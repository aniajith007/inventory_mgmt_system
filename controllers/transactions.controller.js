const { getPool, sql, runQuery } = require('../db');

function coerceNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

async function resolvePartKey(partId, partNumber) {
  if (partNumber) {
    const result = await runQuery(
      `
      SELECT TOP 1 part_number
      FROM dbo.inv_mgmt_part_master
      WHERE part_number = @partNumber
      `,
      { partNumber }
    );

    return result.recordset[0]?.part_number || null;
  }

  if (!partId) return null;

  const result = await runQuery(
    `
    SELECT TOP 1 part_number
    FROM dbo.inv_mgmt_part_master
    WHERE id = @partId
    `,
    { partId: Number(partId) }
  );

  return result.recordset[0]?.part_number || null;
}

async function submitTransaction(req, res, next) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);

  try {
    const {
      warehouseId,
      locationId,
      partId,
      partNumber,
      countedQuantity,
      remarks,
      referenceNo,
      batches
    } = req.body;

    if (!warehouseId || !locationId || countedQuantity === undefined) {
      return res.status(400).json({
        message: 'warehouseId, locationId and countedQuantity are required'
      });
    }

    const resolvedPartNumber = await resolvePartKey(partId, partNumber);
    if (!resolvedPartNumber) {
      return res.status(400).json({ message: 'partId or valid partNumber is required' });
    }

    const batchRows = Array.isArray(batches) && batches.length > 0
      ? batches.map((batch) => ({
        batchNo: batch.batchNo || batch.batch_no || null,
        systemQuantity: coerceNumber(batch.systemQuantity ?? batch.system_quantity),
        countedQuantity: coerceNumber(batch.countedQuantity ?? batch.counted_quantity),
        varianceQuantity: coerceNumber(batch.varianceQuantity ?? batch.variance_quantity)
      }))
      : [
        {
          batchNo: null,
          systemQuantity: 0,
          countedQuantity: coerceNumber(countedQuantity),
          varianceQuantity: coerceNumber(countedQuantity)
        }
      ];

    await tx.begin();

    const groupIdResult = await new sql.Request(tx).query('SELECT NEWID() AS group_id');
    const entryGroup = groupIdResult.recordset[0].group_id;

    let firstInsertedId = null;

    for (const row of batchRows) {
      const entryRequest = new sql.Request(tx);
      entryRequest.input('entryGroup', entryGroup);
      entryRequest.input('warehouseId', Number(warehouseId));
      entryRequest.input('locationId', Number(locationId));
      entryRequest.input('partNumber', resolvedPartNumber);
      entryRequest.input('batchNo', row.batchNo);
      entryRequest.input('systemQuantity', row.systemQuantity);
      entryRequest.input('countedQuantity', row.countedQuantity);
      entryRequest.input('varianceQuantity', row.varianceQuantity);
      entryRequest.input('remarks', remarks || null);
      entryRequest.input('referenceNo', referenceNo || null);
      entryRequest.input('submittedBy', req.user.userId);

      const insertResult = await entryRequest.query(`
        INSERT INTO dbo.inv_mgmt_audit_transactions
        (
          entry_group,
          warehouse_id,
          location_id,
          part_number,
          batch_no,
          system_quantity,
          counted_quantity,
          variance_quantity,
          remarks,
          reference_no,
          submitted_by
        )
        OUTPUT INSERTED.id
        VALUES
        (
          @entryGroup,
          @warehouseId,
          @locationId,
          @partNumber,
          @batchNo,
          @systemQuantity,
          @countedQuantity,
          @varianceQuantity,
          @remarks,
          @referenceNo,
          @submittedBy
        )
      `);

      if (!firstInsertedId) {
        firstInsertedId = insertResult.recordset[0].id;
      }
    }

    await tx.commit();

    return res.status(201).json({
      id: firstInsertedId,
      entryGroup,
      rowsInserted: batchRows.length,
      message: 'transaction submitted'
    });
  } catch (error) {
    if (tx._aborted !== true) {
      await tx.rollback().catch(() => undefined);
    }
    return next(error);
  }
}

async function listTransactions(req, res, next) {
  try {
    const { warehouseId, locationId, fromDate, toDate } = req.query;

    const limitedToOwn = req.user.role === 'user';

    const result = await runQuery(
      `
      SELECT
        MAX(t.id) AS id,
        t.entry_group,
        t.warehouse_id,
        t.location_id,
        t.part_number,
        SUM(t.system_quantity) AS system_quantity,
        SUM(t.counted_quantity) AS counted_quantity,
        SUM(t.variance_quantity) AS variance_quantity,
        MAX(t.remarks) AS remarks,
        MAX(t.reference_no) AS reference_no,
        MAX(t.submitted_by) AS submitted_by,
        MAX(t.submitted_at) AS submitted_at,
        MAX(w.name) AS warehouse_name,
        MAX(l.name) AS location_name,
        MAX(t.part_number) AS part_name,
        MAX(u.username) AS submitted_by_username
      FROM dbo.inv_mgmt_audit_transactions t
      INNER JOIN dbo.inv_mgmt_warehouses w ON w.id = t.warehouse_id
      INNER JOIN dbo.inv_mgmt_locations l ON l.id = t.location_id
      INNER JOIN dbo.inv_mgmt_users u ON u.id = t.submitted_by
      WHERE
        (@warehouseId IS NULL OR t.warehouse_id = @warehouseId)
        AND (@locationId IS NULL OR t.location_id = @locationId)
        AND (@fromDate IS NULL OR CAST(t.submitted_at AS DATE) >= @fromDate)
        AND (@toDate IS NULL OR CAST(t.submitted_at AS DATE) <= @toDate)
        AND (@limitToOwn = 0 OR t.submitted_by = @currentUserId)
      GROUP BY
        t.entry_group,
        t.warehouse_id,
        t.location_id,
        t.part_number
      ORDER BY MAX(t.submitted_at) DESC, MAX(t.id) DESC
      `,
      {
        warehouseId: warehouseId ? Number(warehouseId) : null,
        locationId: locationId ? Number(locationId) : null,
        fromDate: fromDate || null,
        toDate: toDate || null,
        limitToOwn: limitedToOwn ? 1 : 0,
        currentUserId: req.user.userId
      }
    );

    return res.json(result.recordset);
  } catch (error) {
    return next(error);
  }
}

async function getTransactionById(req, res, next) {
  try {
    const transactionId = Number(req.params.id);
    if (!Number.isFinite(transactionId)) {
      return res.status(400).json({ message: 'Invalid transaction id' });
    }

    const keyResult = await runQuery(
      `
      SELECT TOP 1 entry_group
      FROM dbo.inv_mgmt_audit_transactions
      WHERE id = @transactionId
      `,
      { transactionId }
    );

    const entryGroup = keyResult.recordset[0]?.entry_group;
    if (!entryGroup) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const headerResult = await runQuery(
      `
      SELECT
        MAX(t.id) AS id,
        t.entry_group,
        t.warehouse_id,
        t.location_id,
        t.part_number,
        SUM(t.system_quantity) AS system_quantity,
        SUM(t.counted_quantity) AS counted_quantity,
        SUM(t.variance_quantity) AS variance_quantity,
        MAX(t.remarks) AS remarks,
        MAX(t.reference_no) AS reference_no,
        MAX(t.submitted_by) AS submitted_by,
        MAX(t.submitted_at) AS submitted_at,
        MAX(w.name) AS warehouse_name,
        MAX(l.name) AS location_name,
        MAX(t.part_number) AS part_name,
        MAX(u.username) AS submitted_by_username
      FROM dbo.inv_mgmt_audit_transactions t
      INNER JOIN dbo.inv_mgmt_warehouses w ON w.id = t.warehouse_id
      INNER JOIN dbo.inv_mgmt_locations l ON l.id = t.location_id
      INNER JOIN dbo.inv_mgmt_users u ON u.id = t.submitted_by
      WHERE t.entry_group = @entryGroup
      GROUP BY t.entry_group, t.warehouse_id, t.location_id, t.part_number
      `,
      { entryGroup }
    );

    const transaction = headerResult.recordset[0];
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (req.user.role === 'user' && transaction.submitted_by !== req.user.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const batchesResult = await runQuery(
      `
      SELECT
        id,
        entry_group,
        batch_no,
        system_quantity,
        counted_quantity,
        variance_quantity
      FROM dbo.inv_mgmt_audit_transactions
      WHERE entry_group = @entryGroup
      ORDER BY id
      `,
      { entryGroup }
    );

    return res.json({
      ...transaction,
      batches: batchesResult.recordset
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  submitTransaction,
  listTransactions,
  getTransactionById
};


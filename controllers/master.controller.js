const { runQuery } = require('../db');

async function listWarehouses(req, res, next) {
  try {
    const result = await runQuery('SELECT id, code, name, active_status FROM dbo.inv_mgmt_warehouses ORDER BY name');
    return res.json(result.recordset);
  } catch (error) {
    return next(error);
  }
}

async function createWarehouse(req, res, next) {
  try {
    const { code, name, activeStatus } = req.body;

    if (!code || !name) {
      return res.status(400).json({ message: 'code and name are required' });
    }

    const result = await runQuery(
      `
      INSERT INTO dbo.inv_mgmt_warehouses (code, name, active_status, created_by)
      OUTPUT INSERTED.id
      VALUES (@code, @name, @activeStatus, @createdBy)
      `,
      {
        code,
        name,
        activeStatus: activeStatus !== undefined ? Boolean(activeStatus) : true,
        createdBy: req.user.userId
      }
    );

    return res.status(201).json({ id: result.recordset[0].id, message: 'warehouse created' });
  } catch (error) {
    return next(error);
  }
}

async function listLocations(req, res, next) {
  try {
    const { warehouseId } = req.query;
    const result = await runQuery(
      `
      SELECT
        l.id, l.warehouse_id, l.code, l.name, l.active_status,
        w.name AS warehouse_name
      FROM dbo.inv_mgmt_locations l
      INNER JOIN dbo.inv_mgmt_warehouses w ON w.id = l.warehouse_id
      WHERE (@warehouseId IS NULL OR l.warehouse_id = @warehouseId)
      ORDER BY l.name
      `,
      { warehouseId: warehouseId ? Number(warehouseId) : null }
    );

    return res.json(result.recordset);
  } catch (error) {
    return next(error);
  }
}

async function createLocation(req, res, next) {
  try {
    const { warehouseId, code, name, activeStatus } = req.body;

    if (!warehouseId || !code || !name) {
      return res.status(400).json({ message: 'warehouseId, code and name are required' });
    }

    const result = await runQuery(
      `
      INSERT INTO dbo.inv_mgmt_locations (warehouse_id, code, name, active_status, created_by)
      OUTPUT INSERTED.id
      VALUES (@warehouseId, @code, @name, @activeStatus, @createdBy)
      `,
      {
        warehouseId: Number(warehouseId),
        code,
        name,
        activeStatus: activeStatus !== undefined ? Boolean(activeStatus) : true,
        createdBy: req.user.userId
      }
    );

    return res.status(201).json({ id: result.recordset[0].id, message: 'location created' });
  } catch (error) {
    return next(error);
  }
}

async function listParts(req, res, next) {
  try {
    const { warehouseId, locationId } = req.query;

    const result = await runQuery(
      `
      SELECT
        MIN(pm.id) AS id,
        pm.location_id,
        pm.part_number,
        pm.part_number AS part_name,
        'NOS' AS uom,
        CAST(1 AS bit) AS active_status,
        l.name AS location_name,
        w.name AS warehouse_name,
        ISNULL(SUM(pm.quantity), 0) AS total_system_quantity
      FROM dbo.inv_mgmt_part_master pm
      INNER JOIN dbo.inv_mgmt_locations l ON l.id = pm.location_id
      INNER JOIN dbo.inv_mgmt_warehouses w ON w.id = pm.warehouse_id
      WHERE
        (@warehouseId IS NULL OR pm.warehouse_id = @warehouseId)
        AND (@locationId IS NULL OR pm.location_id = @locationId)
        AND pm.active_status = 1
      GROUP BY pm.location_id, pm.part_number, l.name, w.name
      ORDER BY pm.part_number
      `,
      {
        warehouseId: warehouseId ? Number(warehouseId) : null,
        locationId: locationId ? Number(locationId) : null
      }
    );

    return res.json(result.recordset);
  } catch (error) {
    return next(error);
  }
}

async function createPart(req, res, next) {
  try {
    const { locationId, partNumber, batchNo, quantity, activeStatus } = req.body;

    if (!locationId || !partNumber || !batchNo) {
      return res.status(400).json({
        message: 'locationId, partNumber and batchNo are required for part master'
      });
    }

    const locationResult = await runQuery(
      'SELECT TOP 1 warehouse_id FROM dbo.inv_mgmt_locations WHERE id = @locationId',
      { locationId: Number(locationId) }
    );

    const location = locationResult.recordset[0];
    if (!location) {
      return res.status(400).json({ message: 'Invalid locationId' });
    }

    const result = await runQuery(
      `
      INSERT INTO dbo.inv_mgmt_part_master
      (
        warehouse_id, location_id, part_number, batch_no,
        quantity, active_status, created_by
      )
      OUTPUT INSERTED.id
      VALUES
      (
        @warehouseId, @locationId, @partNumber, @batchNo,
        @quantity, @activeStatus, @createdBy
      )
      `,
      {
        warehouseId: location.warehouse_id,
        locationId: Number(locationId),
        partNumber,
        batchNo,
        quantity: Number(quantity || 0),
        activeStatus: activeStatus !== undefined ? Boolean(activeStatus) : true,
        createdBy: req.user.userId
      }
    );

    return res.status(201).json({ id: result.recordset[0].id, message: 'part master row created' });
  } catch (error) {
    return next(error);
  }
}

async function listBatches(req, res, next) {
  try {
    const partId = Number(req.params.partId);

    if (!Number.isFinite(partId)) {
      return res.status(400).json({ message: 'Invalid part id' });
    }

    const seedResult = await runQuery(
      `
      SELECT TOP 1 location_id, part_number
      FROM dbo.inv_mgmt_part_master
      WHERE id = @partId
      `,
      { partId }
    );

    const seed = seedResult.recordset[0];
    if (!seed) {
      return res.status(404).json({ message: 'Part not found' });
    }

    const result = await runQuery(
      `
      SELECT
        id,
        batch_no,
        quantity AS system_quantity,
        active_status
      FROM dbo.inv_mgmt_part_master
      WHERE location_id = @locationId
        AND part_number = @partNumber
        AND active_status = 1
      ORDER BY batch_no
      `,
      {
        locationId: seed.location_id,
        partNumber: seed.part_number
      }
    );

    return res.json(result.recordset);
  } catch (error) {
    return next(error);
  }
}

async function createBatch(req, res, next) {
  try {
    const partId = Number(req.params.partId);
    const { batchNo, systemQuantity, activeStatus } = req.body;

    if (!Number.isFinite(partId)) {
      return res.status(400).json({ message: 'Invalid part id' });
    }

    if (!batchNo || systemQuantity === undefined) {
      return res.status(400).json({ message: 'batchNo and systemQuantity are required' });
    }

    const seedResult = await runQuery(
      `
      SELECT TOP 1 warehouse_id, location_id, part_number
      FROM dbo.inv_mgmt_part_master
      WHERE id = @partId
      `,
      { partId }
    );

    const seed = seedResult.recordset[0];
    if (!seed) {
      return res.status(404).json({ message: 'Part not found' });
    }

    const result = await runQuery(
      `
      INSERT INTO dbo.inv_mgmt_part_master
      (
        warehouse_id, location_id, part_number, batch_no,
        quantity, active_status, created_by
      )
      OUTPUT INSERTED.id
      VALUES
      (
        @warehouseId, @locationId, @partNumber, @batchNo,
        @systemQuantity, @activeStatus, @createdBy
      )
      `,
      {
        warehouseId: seed.warehouse_id,
        locationId: seed.location_id,
        partNumber: seed.part_number,
        batchNo,
        systemQuantity: Number(systemQuantity),
        activeStatus: activeStatus !== undefined ? Boolean(activeStatus) : true,
        createdBy: req.user.userId
      }
    );

    return res.status(201).json({ id: result.recordset[0].id, message: 'batch created' });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listWarehouses,
  createWarehouse,
  listLocations,
  createLocation,
  listParts,
  createPart,
  listBatches,
  createBatch
};


const bcrypt = require('bcryptjs');
const { runQuery } = require('../db');

const ALLOWED_ROLES = ['super_admin', 'admin', 'user'];

function normalizeBoolean(value, fallback = true) {
  if (value === undefined || value === null) return fallback;
  return Boolean(value);
}

async function listUsers(req, res, next) {
  try {
    const { warehouseId, locationId, role, activeStatus } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = {};

    if (warehouseId) {
      whereClause += ' AND u.warehouse_id = @warehouseId';
      params.warehouseId = Number(warehouseId);
    }

    if (locationId) {
      whereClause += ' AND u.location_id = @locationId';
      params.locationId = Number(locationId);
    }

    if (role) {
      whereClause += ' AND u.role = @role';
      params.role = role;
    }

    if (activeStatus !== undefined) {
      whereClause += ' AND u.active_status = @activeStatus';
      params.activeStatus = String(activeStatus).toLowerCase() === 'true';
    }

    const result = await runQuery(
      `
      SELECT
        u.id, u.username, u.role, u.warehouse_id, u.location_id, u.active_status,
        u.full_name, u.email, u.phone, u.last_login_at, u.created_at,
        w.name AS warehouse_name,
        l.name AS location_name
      FROM dbo.inv_mgmt_users u
      LEFT JOIN dbo.inv_mgmt_warehouses w ON w.id = u.warehouse_id
      LEFT JOIN dbo.inv_mgmt_locations l ON l.id = u.location_id
      ${whereClause}
      ORDER BY u.id DESC
      `,
      params
    );

    return res.json(result.recordset);
  } catch (error) {
    return next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const {
      username,
      password,
      role,
      warehouseId,
      locationId,
      activeStatus,
      fullName,
      email,
      phone
    } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ message: 'username, password and role are required' });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: `role must be one of: ${ALLOWED_ROLES.join(', ')}` });
    }

    const existing = await runQuery('SELECT TOP 1 id FROM dbo.inv_mgmt_users WHERE username = @username', { username });

    if (existing.recordset.length > 0) {
      return res.status(409).json({ message: 'username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await runQuery(
      `
      INSERT INTO dbo.inv_mgmt_users
      (
        username, password_hash, role, warehouse_id, location_id,
        active_status, full_name, email, phone, created_by
      )
      OUTPUT INSERTED.id
      VALUES
      (
        @username, @passwordHash, @role, @warehouseId, @locationId,
        @activeStatus, @fullName, @email, @phone, @createdBy
      )
      `,
      {
        username,
        passwordHash,
        role,
        warehouseId: warehouseId ? Number(warehouseId) : null,
        locationId: locationId ? Number(locationId) : null,
        activeStatus: normalizeBoolean(activeStatus, true),
        fullName: fullName || null,
        email: email || null,
        phone: phone || null,
        createdBy: req.user.userId
      }
    );

    return res.status(201).json({ id: result.recordset[0].id, message: 'user created' });
  } catch (error) {
    return next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const {
      role,
      warehouseId,
      locationId,
      activeStatus,
      fullName,
      email,
      phone,
      password
    } = req.body;

    if (role && !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: `role must be one of: ${ALLOWED_ROLES.join(', ')}` });
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      await runQuery('UPDATE dbo.inv_mgmt_users SET password_hash = @passwordHash, updated_at = SYSUTCDATETIME() WHERE id = @id', {
        id,
        passwordHash
      });
    }

    await runQuery(
      `
      UPDATE dbo.inv_mgmt_users SET
        role = COALESCE(@role, role),
        warehouse_id = COALESCE(@warehouseId, warehouse_id),
        location_id = COALESCE(@locationId, location_id),
        active_status = COALESCE(@activeStatus, active_status),
        full_name = COALESCE(@fullName, full_name),
        email = COALESCE(@email, email),
        phone = COALESCE(@phone, phone),
        updated_at = SYSUTCDATETIME(),
        updated_by = @updatedBy
      WHERE id = @id
      `,
      {
        id,
        role: role || null,
        warehouseId: warehouseId !== undefined ? Number(warehouseId) : null,
        locationId: locationId !== undefined ? Number(locationId) : null,
        activeStatus: activeStatus !== undefined ? Boolean(activeStatus) : null,
        fullName: fullName || null,
        email: email || null,
        phone: phone || null,
        updatedBy: req.user.userId
      }
    );

    return res.json({ message: 'user updated' });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listUsers,
  createUser,
  updateUser
};


const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { runQuery } = require('../db');
const { app } = require('../config/env');

function issueToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role,
      warehouseId: user.warehouse_id,
      locationId: user.location_id
    },
    app.jwtSecret,
    { expiresIn: app.jwtExpiresIn }
  );
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'username and password are required' });
    }

    const result = await runQuery(
      `
      SELECT TOP 1
        id, username, password_hash, role, warehouse_id, location_id,
        active_status, full_name, email
      FROM dbo.inv_mgmt_users
      WHERE username = @username
      `,
      { username }
    );

    const user = result.recordset[0];

    if (!user || !user.active_status) {
      return res.status(401).json({ message: 'Invalid credentials or inactive user' });
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);

    if (!passwordOk) {
      return res.status(401).json({ message: 'Invalid credentials or inactive user' });
    }

    await runQuery('UPDATE dbo.inv_mgmt_users SET last_login_at = SYSUTCDATETIME() WHERE id = @id', { id: user.id });

    const token = issueToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        warehouseId: user.warehouse_id,
        locationId: user.location_id,
        fullName: user.full_name,
        email: user.email
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function me(req, res, next) {
  try {
    const result = await runQuery(
      `
      SELECT
        u.id, u.username, u.role, u.warehouse_id, u.location_id,
        u.active_status, u.full_name, u.email, u.phone,
        u.last_login_at,
        w.name AS warehouse_name,
        l.name AS location_name
      FROM dbo.inv_mgmt_users u
      LEFT JOIN dbo.inv_mgmt_warehouses w ON w.id = u.warehouse_id
      LEFT JOIN dbo.inv_mgmt_locations l ON l.id = u.location_id
      WHERE u.id = @id
      `,
      { id: req.user.userId }
    );

    const user = result.recordset[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      warehouseId: user.warehouse_id,
      warehouseName: user.warehouse_name,
      locationId: user.location_id,
      locationName: user.location_name,
      activeStatus: user.active_status,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      lastLoginAt: user.last_login_at
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  login,
  me
};


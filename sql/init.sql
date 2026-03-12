/*
  Inventory Audit - MSSQL bootstrap (simplified model)
  Run this script in your target database (e.g. InventoryAudit)
*/

SET NOCOUNT ON;

IF OBJECT_ID('dbo.inv_mgmt_audit_transactions', 'U') IS NOT NULL DROP TABLE dbo.inv_mgmt_audit_transactions;
IF OBJECT_ID('dbo.inv_mgmt_part_master', 'U') IS NOT NULL DROP TABLE dbo.inv_mgmt_part_master;
IF OBJECT_ID('dbo.inv_mgmt_users', 'U') IS NOT NULL DROP TABLE dbo.inv_mgmt_users;
IF OBJECT_ID('dbo.inv_mgmt_locations', 'U') IS NOT NULL DROP TABLE dbo.inv_mgmt_locations;
IF OBJECT_ID('dbo.inv_mgmt_warehouses', 'U') IS NOT NULL DROP TABLE dbo.inv_mgmt_warehouses;
GO

CREATE TABLE dbo.inv_mgmt_warehouses (
  id INT IDENTITY(1,1) PRIMARY KEY,
  code NVARCHAR(30) NOT NULL UNIQUE,
  name NVARCHAR(120) NOT NULL,
  active_status BIT NOT NULL DEFAULT(1),
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  created_by INT NULL,
  updated_by INT NULL
);
GO

CREATE TABLE dbo.inv_mgmt_locations (
  id INT IDENTITY(1,1) PRIMARY KEY,
  warehouse_id INT NOT NULL,
  code NVARCHAR(30) NOT NULL,
  name NVARCHAR(120) NOT NULL,
  active_status BIT NOT NULL DEFAULT(1),
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  created_by INT NULL,
  updated_by INT NULL,
  CONSTRAINT FK_locations_warehouse FOREIGN KEY (warehouse_id) REFERENCES dbo.inv_mgmt_warehouses(id),
  CONSTRAINT UQ_locations_wh_code UNIQUE (warehouse_id, code)
);
GO

CREATE TABLE dbo.inv_mgmt_users (
  id INT IDENTITY(1,1) PRIMARY KEY,
  username NVARCHAR(100) NOT NULL UNIQUE,
  password_hash NVARCHAR(255) NOT NULL,
  role NVARCHAR(20) NOT NULL,
  warehouse_id INT NULL,
  location_id INT NULL,
  active_status BIT NOT NULL DEFAULT(1),
  full_name NVARCHAR(150) NULL,
  email NVARCHAR(150) NULL,
  phone NVARCHAR(30) NULL,
  last_login_at DATETIME2 NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  created_by INT NULL,
  updated_by INT NULL,
  CONSTRAINT CK_users_role CHECK (role IN ('super_admin','admin','user')),
  CONSTRAINT FK_users_warehouse FOREIGN KEY (warehouse_id) REFERENCES dbo.inv_mgmt_warehouses(id),
  CONSTRAINT FK_users_location FOREIGN KEY (location_id) REFERENCES dbo.inv_mgmt_locations(id)
);
GO

/*
  Flat part master format requested:
  Warehouse + Location + Part + Batch + Quantity
*/
CREATE TABLE dbo.inv_mgmt_part_master (
  id INT IDENTITY(1,1) PRIMARY KEY,
  warehouse_id INT NOT NULL,
  location_id INT NOT NULL,
  part_number NVARCHAR(100) NOT NULL,
  batch_no NVARCHAR(100) NOT NULL,
  quantity DECIMAL(18,3) NOT NULL DEFAULT(0),
  active_status BIT NOT NULL DEFAULT(1),
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  created_by INT NULL,
  updated_by INT NULL,
  CONSTRAINT FK_part_master_warehouse FOREIGN KEY (warehouse_id) REFERENCES dbo.inv_mgmt_warehouses(id),
  CONSTRAINT FK_part_master_location FOREIGN KEY (location_id) REFERENCES dbo.inv_mgmt_locations(id),
  CONSTRAINT UQ_part_master UNIQUE (location_id, part_number, batch_no)
);
GO

/*
  Flat transaction format requested:
  Warehouse + Location + Part + Batch + quantities
*/
CREATE TABLE dbo.inv_mgmt_audit_transactions (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  entry_group UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  warehouse_id INT NOT NULL,
  location_id INT NOT NULL,
  part_number NVARCHAR(100) NOT NULL,
  batch_no NVARCHAR(100) NULL,
  system_quantity DECIMAL(18,3) NOT NULL DEFAULT(0),
  counted_quantity DECIMAL(18,3) NOT NULL,
  variance_quantity DECIMAL(18,3) NOT NULL,
  remarks NVARCHAR(500) NULL,
  reference_no NVARCHAR(100) NULL,
  submitted_by INT NOT NULL,
  submitted_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_audit_txn_warehouse FOREIGN KEY (warehouse_id) REFERENCES dbo.inv_mgmt_warehouses(id),
  CONSTRAINT FK_audit_txn_location FOREIGN KEY (location_id) REFERENCES dbo.inv_mgmt_locations(id),
  CONSTRAINT FK_audit_txn_user FOREIGN KEY (submitted_by) REFERENCES dbo.inv_mgmt_users(id)
);
GO

INSERT INTO dbo.inv_mgmt_warehouses (code, name, active_status) VALUES
('WH-001', 'Main Warehouse', 1),
('WH-002', 'Spare Warehouse', 1);
GO

INSERT INTO dbo.inv_mgmt_locations (warehouse_id, code, name, active_status) VALUES
(1, 'C12', 'Rack C12', 1),
(1, 'C13', 'Rack C13', 1),
(1, 'C14', 'Rack C14', 1);
GO

INSERT INTO dbo.inv_mgmt_users
(username, password_hash, role, warehouse_id, location_id, active_status, full_name, email)
VALUES
('superadmin', '$2b$10$YtyCuqqZgmjfQzveWAroU.n0qfqz3U4RQADmOtPNLJ6IzdTw0aMRO', 'super_admin', NULL, NULL, 1, 'Super Admin', 'superadmin@local'),
('admin1', '$2b$10$YtyCuqqZgmjfQzveWAroU.n0qfqz3U4RQADmOtPNLJ6IzdTw0aMRO', 'admin', 1, NULL, 1, 'Warehouse Admin', 'admin1@local'),
('user1', '$2b$10$YtyCuqqZgmjfQzveWAroU.n0qfqz3U4RQADmOtPNLJ6IzdTw0aMRO', 'user', 1, 1, 1, 'Audit User', 'user1@local');
GO

INSERT INTO dbo.inv_mgmt_part_master
(warehouse_id, location_id, part_number, batch_no, quantity, active_status, created_by)
VALUES
(1, 1, 'PN-C12-001', 'BATCH-C12-001-A', 40, 1, 1),
(1, 1, 'PN-C12-001', 'BATCH-C12-001-B', 25, 1, 1),
(1, 1, 'PN-C12-001', 'BATCH-C12-001-C', 10, 1, 1),
(1, 2, 'PN-C13-003', 'BATCH-C13-003-A', 60, 1, 1),
(1, 2, 'PN-C13-003', 'BATCH-C13-003-B', 15, 1, 1),
(1, 3, 'PN-C14-009', 'BATCH-C14-009-A', 22, 1, 1);
GO

CREATE INDEX IX_users_role_active ON dbo.inv_mgmt_users(role, active_status);
CREATE INDEX IX_locations_warehouse ON dbo.inv_mgmt_locations(warehouse_id);
CREATE INDEX IX_part_master_lookup ON dbo.inv_mgmt_part_master(location_id, part_number, batch_no);
CREATE INDEX IX_audit_txn_filters ON dbo.inv_mgmt_audit_transactions(location_id, warehouse_id, submitted_at DESC);
CREATE INDEX IX_audit_txn_group ON dbo.inv_mgmt_audit_transactions(entry_group);
GO


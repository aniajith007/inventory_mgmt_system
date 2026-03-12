import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Avatar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { useAuth } from "../App";

const drawerWidth = 272;

const navItems = [
  { label: "Dashboard", to: "/", icon: <DashboardRoundedIcon />, bottom: true },
  {
    label: "Entry",
    to: "/audit",
    icon: <FactCheckRoundedIcon />,
    bottom: true,
  },
  {
    label: "Explore",
    to: "/explore",
    icon: <ExploreRoundedIcon />,
    bottom: false,
  },
  {
    label: "Profile",
    to: "/profile",
    icon: <PersonRoundedIcon />,
    bottom: false,
  },
  {
    label: "Settings",
    to: "/settings",
    icon: <SettingsRoundedIcon />,
    bottom: true,
  },
];

function MainLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navValue = useMemo(() => {
    if (pathname.startsWith("/audit")) return "/audit";
    if (pathname.startsWith("/explore")) return "/explore";
    if (pathname.startsWith("/profile")) return "/profile";
    if (pathname.startsWith("/settings")) return "/settings";
    return "/";
  }, [pathname]);

  const pageTitle = useMemo(() => {
    if (pathname.startsWith("/audit/new")) return "New Entry";
    if (pathname.startsWith("/audit")) return "Inventory Entry";
    if (pathname.startsWith("/explore")) return "Explore";
    if (pathname.startsWith("/profile")) return "Profile";
    if (pathname.startsWith("/settings")) return "Settings";
    return "Dashboard";
  }, [pathname]);

  const initials = useMemo(() => {
    const parts = (user?.name || "Demo Admin").split(" ");
    return (parts[0]?.[0] || "D") + (parts[1]?.[0] || "A");
  }, [user?.name]);

  const handleLogout = () => {
    setMenuAnchor(null);
    logout();
    navigate("/splash", { replace: true });
  };

  const sidebar = (
    <Box className="sidebar-shell" sx={{ width: drawerWidth }}>
      <Stack
        className="brand-box"
        direction="row"
        spacing={1.5}
        alignItems="center"
      >
        <BoltRoundedIcon color="primary" />
        <Box>
          <Typography variant="subtitle1" fontWeight={800}>
            MobileFlow Pro
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Operations Console
          </Typography>
        </Box>
      </Stack>

      <List sx={{ px: 1.5, py: 1 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => (isActive ? "nav-active" : "")}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>

      <Box sx={{ mt: "auto", px: 2, pb: 2 }}>
        <Box className="sidebar-upgrade">
          <Typography variant="body2" fontWeight={700}>
            Workspace Healthy
          </Typography>
          <Typography variant="caption" color="text.secondary">
            All systems online
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", height: "100dvh", overflow: "hidden" }}>
      <Box
        className="floating-topbar"
        sx={{
          my: 2,
          left: { xs: 12, md: drawerWidth + 16 },
          right: { xs: 74, md: 230 },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          {!isDesktop && (
            <IconButton
              className="floating-pill"
              onClick={() => setMobileOpen(true)}
            >
              <MenuRoundedIcon fontSize="small" />
            </IconButton>
          )}
          <Box className="floating-pill floating-title-pill">
            <Typography fontSize={13} fontWeight={700}>
              {pageTitle}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box
        sx={{
          position: "fixed",
          top: 10,
          my: 2,
          right: { xs: 12, md: 24 },
          zIndex: 1202,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          className="user-trigger"
          onClick={(event) => setMenuAnchor(event.currentTarget)}
          role="button"
          tabIndex={0}
        >
          <Avatar
            sx={{
              width: 30,
              height: 30,
              bgcolor: "rgba(15, 118, 110, 0.92)",
              fontSize: 13,
            }}
          >
            {initials}
          </Avatar>
          {isDesktop && (
            <>
              <Typography fontSize={13} fontWeight={600}>
                {user?.name || "Demo Admin"}
              </Typography>
              <KeyboardArrowDownRoundedIcon fontSize="small" />
            </>
          )}
        </Stack>
      </Box>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
          <Typography fontWeight={700}>{user?.name || "Demo Admin"}</Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email || "demo@mobile.app"}
          </Typography>
          <Chip label="Active" color="success" size="small" sx={{ mt: 1 }} />
        </Box>
        <Divider />
        <MenuItem onClick={() => navigate("/profile")}>
          <ListItemIcon>
            <PersonRoundedIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={() => navigate("/settings")}>
          <ListItemIcon>
            <SettingsRoundedIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant={isDesktop ? "permanent" : "temporary"}
          open={isDesktop || mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              borderRight: "1px solid rgba(15, 23, 42, 0.08)",
              boxSizing: "border-box",
              backgroundColor: "#f8fbff",
            },
          }}
        >
          {sidebar}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 4 },
          pt: { xs: 8.5, md: 9.5 },
          pb: { xs: 10, md: 4 },
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <Outlet />
      </Box>

      {!isDesktop && (
        <BottomNavigation
          showLabels
          value={navValue}
          onChange={(_, newValue) => navigate(newValue)}
          className="mobile-bottom-nav"
        >
          {navItems
            .filter((a) => a.bottom)
            .map((item) => (
              <BottomNavigationAction
                key={item.to}
                value={item.to}
                label={item.label}
                icon={item.icon}
              />
            ))}
        </BottomNavigation>
      )}
    </Box>
  );
}

export default MainLayout;

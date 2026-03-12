import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Chip, Container, Stack, Typography } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

const slides = [
  {
    title: "Smart Stock Count",
    subtitle: "Track parts.",
    tone: "tone-one",
  },
  {
    title: "Batch-Wise auto calculation",
    subtitle: "It has batch wise calculation for count variance.",
    tone: "tone-two",
  },
];

function StartPage() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 2600);

    return () => clearInterval(timer);
  }, []);

  const current = slides[index];

  return (
    <Box className={`start-shell ${current.tone}`}>
      <Container maxWidth="sm" className="start-container">
        <Box className="start-card">
          <Chip label="LTVS Inventory" className="start-chip" />
          <Typography className="start-title">{current.title}</Typography>
          <Typography className="start-subtitle">{current.subtitle}</Typography>

          <Box className="mock-phone">
            <Box className="mock-notch" />
            <Typography className="mock-heading">Welcome back</Typography>
            <Typography className="mock-copy">
              Manage your workflow with one tap.
            </Typography>
            <Box className="mock-pill">Explore</Box>
          </Box>

          <Stack
            direction="row"
            spacing={1}
            justifyContent="center"
            sx={{ mt: 2 }}
          >
            {slides.map((_, dotIndex) => (
              <Box
                key={dotIndex}
                className={`start-dot ${dotIndex === index ? "active" : ""}`}
              />
            ))}
          </Stack>

          <Button
            fullWidth
            variant="contained"
            className="start-login-btn"
            endIcon={<ArrowForwardRoundedIcon />}
            onClick={() => navigate("/login")}
          >
            Login
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

export default StartPage;

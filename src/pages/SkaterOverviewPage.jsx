import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import "../Dashboard.css";
import { getSkaterOverview, shareSkaterCard, unshareSkaterCard } from "../api/api";
import Navbar from "../components/Navbar";
import dayjs from "dayjs";

const titleStyle = {
  fontSize: "1.25rem",
  fontWeight: 700,
  letterSpacing: 0.5,
  textTransform: "uppercase",
  color: "#fff",
  marginBottom: "0.75rem",
  textAlign: "center",
};

const labelStyle = { color: "#a1a1aa", fontSize: "0.85rem", marginBottom: 2 };
const valueStyle = { fontSize: "1.15rem", fontWeight: 600, color: "#fff", marginBottom: 12 };

export default function SkaterOverviewPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shareToken, setShareToken] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    getSkaterOverview()
      .then((d) => {
        setData(d);
        setShareToken(d?.user_meta?.share_token || null);
      })
      .catch(() => setError("Failed to load skater profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleShare = async () => {
    try {
      const res = await shareSkaterCard();
      setShareToken(res.share_token);
      const url = `${window.location.origin}/shared/card/${res.share_token}`;
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      /* best-effort */
    }
  };

  const handleUnshare = async () => {
    try {
      await unshareSkaterCard();
      setShareToken(null);
    } catch {
      /* best-effort */
    }
  };

  const g = data?.user_general || {};
  const c = data?.user_contact || {};
  const m = data?.user_memberships || {};
  const meta = data?.user_meta || {};

  const fullName = [g.user_first_name, g.user_middle_name, g.user_last_name]
    .filter(Boolean)
    .join(" ");
  const location = [g.user_location_city, g.user_location_state].filter(Boolean).join(", ");
  const locationDetail = [location, g.user_location_zip, g.user_location_country]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="dashboard-bg">
      <Navbar />
      <Container fluid className="p-4">
        {loading ? (
          <div style={{ color: "#a1a1aa", textAlign: "center", paddingTop: 60 }}>Loading...</div>
        ) : error ? (
          <div style={{ color: "red", textAlign: "center", paddingTop: 60 }}>{error}</div>
        ) : (
          <>
            {/* Row 1: Personal, Contact, Memberships */}
            <Row className="mb-4">
              <Col md={4}>
                <Card className="dashboard-card h-100">
                  <Card.Body style={{ textAlign: "center" }}>
                    <div style={titleStyle}>Personal Info</div>
                    <div style={labelStyle}>Name</div>
                    <div style={valueStyle}>{fullName || "—"}</div>
                    <div style={labelStyle}>Location</div>
                    <div style={valueStyle}>{locationDetail || "—"}</div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={4}>
                <Card className="dashboard-card h-100">
                  <Card.Body style={{ textAlign: "center" }}>
                    <div style={titleStyle}>Contact</div>
                    <div style={labelStyle}>Email</div>
                    <div style={valueStyle}>{c.email || "—"}</div>
                    <div style={labelStyle}>Phone</div>
                    <div style={valueStyle}>{c.phone || "—"}</div>
                    <div style={labelStyle}>Username</div>
                    <div style={valueStyle}>{c.username || "—"}</div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={4}>
                <Card className="dashboard-card h-100">
                  <Card.Body style={{ textAlign: "center" }}>
                    <div style={titleStyle}>Memberships</div>
                    <div style={labelStyle}>USFSA Number</div>
                    <div style={valueStyle}>{m.usfsa_number || "—"}</div>
                    <div style={labelStyle}>Club</div>
                    <div style={valueStyle}>{m.affiliated_club_name || "—"}</div>
                    <div style={labelStyle}>Club Since</div>
                    <div style={valueStyle}>
                      {m.affiliated_club_date
                        ? dayjs(m.affiliated_club_date).format("MMMM D, YYYY")
                        : "—"}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Row 2: Current Setup, Preferences, Account */}
            <Row className="mb-4">
              <Col md={4}>
                <Card className="dashboard-card h-100">
                  <Card.Body style={{ textAlign: "center" }}>
                    <div style={titleStyle}>Current Setup</div>
                    <div style={labelStyle}>Primary Coach</div>
                    <div style={valueStyle}>{meta.user_primary_coach || "—"}</div>
                    <div style={labelStyle}>Preferred Rink</div>
                    <div style={valueStyle}>{meta.user_preferred_rink || "—"}</div>
                    <div style={labelStyle}>Active Ice Config</div>
                    <div style={valueStyle}>{meta.user_ice_config || "—"}</div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={4}>
                <Card className="dashboard-card h-100">
                  <Card.Body style={{ textAlign: "center" }}>
                    <div style={titleStyle}>Preferences</div>
                    <div style={labelStyle}>Maintenance Cycle</div>
                    <div style={valueStyle}>
                      {meta.user_preferred_maint_hours != null
                        ? `${meta.user_preferred_maint_hours} hours`
                        : "—"}
                    </div>
                    <div style={labelStyle}>Timezone</div>
                    <div style={valueStyle}>{meta.user_timezone || "—"}</div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={4}>
                <Card className="dashboard-card h-100">
                  <Card.Body style={{ textAlign: "center" }}>
                    <div style={titleStyle}>Account</div>
                    <div style={labelStyle}>Member Since</div>
                    <div style={valueStyle}>
                      {meta.user_creation_date
                        ? dayjs(meta.user_creation_date).format("MMMM D, YYYY")
                        : "—"}
                    </div>
                    <div style={labelStyle}>Roles</div>
                    <div style={valueStyle}>
                      {Array.isArray(meta.user_roles) && meta.user_roles.length > 0
                        ? meta.user_roles.join(", ")
                        : "—"}
                    </div>
                    <div style={labelStyle}>Skater Card</div>
                    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 4 }}>
                      <button
                        onClick={handleShare}
                        title={shareToken ? "Copy share link" : "Share your skater card"}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: shareToken ? "#3b82f6" : "#a1a1aa", fontSize: "1.1rem",
                        }}
                      >
                        {shareCopied ? "✓ Copied!" : "🔗 Share"}
                      </button>
                      {shareToken && (
                        <button
                          onClick={handleUnshare}
                          title="Stop sharing"
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "#ef4444", fontSize: "0.85rem",
                          }}
                        >
                          Unshare
                        </button>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Container>
    </div>
  );
}

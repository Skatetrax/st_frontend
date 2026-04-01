import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import "../Dashboard.css";
import { getSkaterCard, shareSkaterCard, unshareSkaterCard } from "../api/api";
import Navbar from "../components/Navbar";

const titleStyle = {
  fontSize: "1.15rem",
  fontWeight: 700,
  letterSpacing: 0.5,
  textTransform: "uppercase",
  color: "#fff",
  marginBottom: "0.75rem",
};

const labelStyle = { color: "#a1a1aa", fontSize: "0.8rem", marginBottom: 2 };
const valueStyle = { fontSize: "1.05rem", fontWeight: 600, color: "#fff", marginBottom: 10 };

function StatItem({ label, value }) {
  return (
    <>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value ?? "—"}</div>
    </>
  );
}

function fmtFrequency(perWeek) {
  if (!perWeek) return "0 sessions per week";
  if (perWeek >= 1) return `~${perWeek} sessions per week`;
  const perMonth = Math.round(perWeek * 4.33 * 10) / 10;
  return `~${perMonth} sessions per month`;
}

export default function SkaterCardPage() {
  const [card, setCard] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shareToken, setShareToken] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getSkaterCard()
      .then((d) => {
        setCard(d);
        setShareToken(d.share_token || null);
      })
      .catch(() => setError("Failed to load skater card"))
      .finally(() => setLoading(false));
  }, []);

  const handleShare = async () => {
    try {
      const res = await shareSkaterCard();
      setShareToken(res.share_token);
      const url = `${window.location.origin}/shared/card/${res.share_token}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* best-effort */ }
  };

  const handleUnshare = async () => {
    try {
      await unshareSkaterCard();
      setShareToken(null);
    } catch { /* best-effort */ }
  };

  if (loading) {
    return (
      <div className="dashboard-bg">
        <Navbar />
        <Container fluid className="p-4">
          <div style={{ color: "#a1a1aa", textAlign: "center", paddingTop: 60 }}>Loading...</div>
        </Container>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="dashboard-bg">
        <Navbar />
        <Container fluid className="p-4">
          <div style={{ color: "#ef4444", textAlign: "center", paddingTop: 60 }}>{error || "No card data available"}</div>
        </Container>
      </div>
    );
  }

  const { identity, lifetime, recent, current } = card;
  const fullName = [identity.first_name, identity.middle_name, identity.last_name]
    .filter(Boolean).join(" ") || "Skater";
  const prefLabel = identity.contact_preference
    ? identity.contact_preference.charAt(0).toUpperCase() + identity.contact_preference.slice(1)
    : null;

  return (
    <div className="dashboard-bg">
      <Navbar />
      <Container fluid className="p-4" style={{ maxWidth: 900 }}>
        {/* Header + Current */}
        <Card className="dashboard-card mb-4">
          <Card.Body style={{ textAlign: "center" }}>
            <h2 style={{ color: "#fff", fontWeight: 700, margin: 0 }}>{fullName}</h2>
            <div style={{ color: "#a1a1aa", fontSize: "0.9rem", marginTop: 4 }}>
              {[identity.city, identity.state].filter(Boolean).join(", ")}
              {identity.club ? ` · ${identity.club}` : ""}
            </div>
            {identity.usfsa_number && (
              <div style={{ color: "#6b7280", fontSize: "0.8rem", marginTop: 2 }}>USFSA #{identity.usfsa_number}</div>
            )}
            {prefLabel && (
              <div style={{ color: "#6b7280", fontSize: "0.8rem", marginTop: 2 }}>
                Preferred contact method: {prefLabel}
              </div>
            )}
            <hr style={{ borderColor: "#3f3f46", margin: "16px 0" }} />
            <Row>
              <Col sm={3}><StatItem label="Coach" value={current.coach} /></Col>
              <Col sm={3}><StatItem label="Home Rink" value={current.home_rink} /></Col>
              <Col sm={3}><StatItem label="Equipment" value={current.equipment} /></Col>
              <Col sm={3}>
                <div style={labelStyle}>Shared Playlists</div>
                {current.shared_playlists?.length > 0 ? (
                  current.shared_playlists.map((pl, i) => (
                    <div key={i}>
                      <a
                        href={`/shared/playlist/${pl.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#3b82f6", fontSize: "0.9rem", textDecoration: "none" }}
                      >
                        {pl.name}
                      </a>
                    </div>
                  ))
                ) : (
                  <div style={valueStyle}>—</div>
                )}
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* All Time vs Last 12 Months */}
        <Row className="mb-4">
          <Col md={6}>
            <Card className="dashboard-card h-100">
              <Card.Body>
                <div style={titleStyle}>All Time</div>
                <StatItem label="Skating Since" value={lifetime.skating_since ? new Date(lifetime.skating_since).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : null} />
                <StatItem
                  label="Training Style"
                  value={(lifetime.coached_pct || lifetime.solo_pct || lifetime.group_pct) ? `${lifetime.coached_pct}% coached · ${lifetime.solo_pct}% solo · ${lifetime.group_pct}% group` : null}
                />
                <div style={{ color: "#6b7280", fontSize: "0.75rem", marginTop: -6, marginBottom: 10 }}>
                  {fmtFrequency(lifetime.sessions_per_week)} · ~{lifetime.avg_session_min} min per session
                </div>
                <StatItem label="Competition Record" value={`${lifetime.events} events · ${lifetime.entries} entries · ${lifetime.podiums} podiums`} />
                <StatItem label="Previous Coaches" value={lifetime.previous_coaches} />
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="dashboard-card h-100">
              <Card.Body>
                <div style={titleStyle}>Recent</div>
                <div style={{ color: "#6b7280", fontSize: "0.75rem", marginTop: -8, marginBottom: 10 }}>Averaged over previous 3 months</div>
                <StatItem
                  label="Training Style"
                  value={(recent.coached_pct || recent.solo_pct || recent.group_pct) ? `${recent.coached_pct}% coached · ${recent.solo_pct}% solo · ${recent.group_pct}% group` : null}
                />
                <div style={{ color: "#6b7280", fontSize: "0.75rem", marginTop: -6, marginBottom: 10 }}>
                  {fmtFrequency(recent.sessions_per_week)} · ~{recent.avg_session_min} min per session
                </div>
                <StatItem label="Most Recent Event" value={recent.last_event || "No events yet"} />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Share controls */}
        <div style={{ textAlign: "center" }}>
          <Button
            variant={shareToken ? "outline-primary" : "primary"}
            size="sm"
            onClick={handleShare}
          >
            {copied ? "Link Copied!" : shareToken ? "Copy Share Link" : "Share Skater Card"}
          </Button>
          {shareToken && (
            <Button
              variant="outline-danger"
              size="sm"
              className="ms-2"
              onClick={handleUnshare}
            >
              Unshare
            </Button>
          )}
        </div>
      </Container>
    </div>
  );
}

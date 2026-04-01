import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Container, Row, Col, Card } from "react-bootstrap";
import "../Dashboard.css";
import { getSharedCard } from "../api/api";

const titleStyle = {
  fontSize: "1.15rem",
  fontWeight: 700,
  letterSpacing: 0.5,
  textTransform: "uppercase",
  color: "#fff",
  marginBottom: "0.75rem",
};

const labelStyle = { color: "#a1a1aa", fontSize: "0.8rem", marginBottom: 2 };
const valueStyle = { fontSize: "0.8rem", fontWeight: 500, color: "#d1d5db", marginBottom: 10 };

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

export default function SharedCardPage() {
  const { shareToken } = useParams();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getSharedCard(shareToken)
      .then(setCard)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [shareToken]);

  if (loading) {
    return (
      <div className="dashboard-bg" style={{ minHeight: "100vh" }}>
        <Container fluid className="p-4">
          <div style={{ color: "#a1a1aa", textAlign: "center", paddingTop: 80 }}>Loading...</div>
        </Container>
      </div>
    );
  }

  if (notFound || !card) {
    return (
      <div className="dashboard-bg" style={{ minHeight: "100vh" }}>
        <Container fluid className="p-4">
          <div style={{ textAlign: "center", paddingTop: 80 }}>
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>&#9924;</div>
            <div style={{ color: "#f3f4f6", fontWeight: 600, fontSize: "1.1rem" }}>
              Skater card not found
            </div>
            <div style={{ color: "#a1a1aa", fontSize: "0.85rem", marginTop: 6 }}>
              This link may have expired or been unshared.
            </div>
          </div>
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
    <div className="dashboard-bg" style={{ minHeight: "100vh" }}>
      <Container fluid className="p-4" style={{ maxWidth: 900 }}>
        {/* Header + Current */}
        <Card className="dashboard-card mb-4">
          <Card.Body style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: 4 }}>&#9924;</div>
            <h2 style={{ color: "#fff", fontWeight: 700, margin: 0 }}>{fullName}</h2>
            <div style={{ color: "#a1a1aa", fontSize: "0.9rem", marginTop: 4 }}>
              {[identity.city, identity.state].filter(Boolean).join(", ")}
              {identity.club ? ` · ${identity.club}` : ""}
            </div>
            {prefLabel && (
              <div style={{ color: "#6b7280", fontSize: "0.8rem", marginTop: 4 }}>
                Preferred contact method: {prefLabel}
              </div>
            )}
            <hr style={{ borderColor: "#3f3f46", margin: "16px 0" }} />
            <Row>
              <Col sm={3}><StatItem label="Coach" value={current.coach} /></Col>
              <Col sm={3}><StatItem label="Home Rink" value={current.home_rink} /></Col>
              <Col sm={3}>
                <div style={labelStyle}>Equipment</div>
                <div style={{ ...valueStyle, whiteSpace: "nowrap" }}>
                  {current.boots || current.blades ? (
                    <>
                      {current.boots && <div>{current.boots}</div>}
                      {current.blades && <div>{current.blades}</div>}
                    </>
                  ) : "—"}
                </div>
              </Col>
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
                <div style={labelStyle}>Most Recent Competition</div>
                {recent.last_event ? (
                  <div style={{ marginBottom: 10 }}>
                    <div style={valueStyle}>{recent.last_event.name}</div>
                    {recent.last_event.date && (
                      <div style={{ color: "#9ca3af", fontSize: "0.75rem", paddingLeft: 12, marginTop: -6 }}>{recent.last_event.date}</div>
                    )}
                    {recent.last_event.location && (
                      <div style={{ color: "#9ca3af", fontSize: "0.75rem", paddingLeft: 12, marginTop: 2 }}>{recent.last_event.location}</div>
                    )}
                  </div>
                ) : (
                  <div style={valueStyle}>No competitions yet</div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <div style={{ textAlign: "center", color: "#6b7280", fontSize: "0.75rem", marginTop: 16 }}>
          Powered by Skatetrax
        </div>
      </Container>
    </div>
  );
}

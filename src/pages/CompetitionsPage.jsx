import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Pagination,
  Modal,
  Spinner,
  Badge,
} from "react-bootstrap";
import "../Dashboard.css";
import { getEvents, getEventDetail } from "../api/api";
import Navbar from "../components/Navbar";
import dayjs from "dayjs";
import filmreelIcon from "../assets/images/filmreel.png";
import bookletIcon from "../assets/images/booklet.png";
import trophyIcon from "../assets/images/trophy.png";

const STATUS_BADGE = {
  Committed: { bg: "purple-badge", label: "Committed" },
  Scored:    { bg: "teal-badge",   label: "Scored" },
  Withdrew:  { bg: "gray-badge",   label: "Withdrew" },
  Disqualified: { bg: "danger",    label: "DQ" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_BADGE[status] || { bg: "secondary", label: status || "—" };
  return <Badge className={`status-badge ${cfg.bg}`}>{cfg.label}</Badge>;
}

export default function CompetitionsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showDetail, setShowDetail] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    getEvents("Competition")
      .then(setData)
      .catch(() => setError("Failed to load competition data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openDetail = (eventId) => {
    setShowDetail(true);
    setDetailLoading(true);
    setDetail(null);
    getEventDetail(eventId)
      .then(setDetail)
      .catch(() => setDetail({ error: "Failed to load event details" }))
      .finally(() => setDetailLoading(false));
  };

  const allRows = data?.entries || [];
  const todayStr = dayjs().format("YYYY-MM-DD");

  const toDateStr = (row) => dayjs(row.entry_date || row.event_date).format("YYYY-MM-DD");

  const upcoming = allRows
    .filter((r) => toDateStr(r) >= todayStr)
    .sort((a, b) => toDateStr(a).localeCompare(toDateStr(b)));

  const history = allRows
    .filter((r) => toDateStr(r) < todayStr);

  const [histPage, setHistPage] = useState(1);
  const perPage = 15;
  const histTotalPages = Math.ceil(history.length / perPage);
  const histPaginated = history.slice((histPage - 1) * perPage, histPage * perPage);

  function renderPagination(page, totalPages, setPage) {
    if (totalPages <= 1) return null;
    const items = [];
    items.push(<Pagination.First key="first" disabled={page === 1} onClick={() => setPage(1)} />);
    items.push(<Pagination.Prev key="prev" disabled={page === 1} onClick={() => setPage(page - 1)} />);
    items.push(<Pagination.Item key={1} active={page === 1} onClick={() => setPage(1)}>1</Pagination.Item>);
    if (page > 4) items.push(<Pagination.Ellipsis key="se" disabled />);
    for (let i = Math.max(2, page - 2); i <= Math.min(totalPages - 1, page + 2); i++) {
      if (i === 1 || i === totalPages) continue;
      items.push(<Pagination.Item key={i} active={page === i} onClick={() => setPage(i)}>{i}</Pagination.Item>);
    }
    if (page < totalPages - 3) items.push(<Pagination.Ellipsis key="ee" disabled />);
    if (totalPages > 1) {
      items.push(
        <Pagination.Item key={totalPages} active={page === totalPages} onClick={() => setPage(totalPages)}>
          {totalPages}
        </Pagination.Item>
      );
    }
    items.push(<Pagination.Next key="next" disabled={page === totalPages} onClick={() => setPage(page + 1)} />);
    items.push(<Pagination.Last key="last" disabled={page === totalPages} onClick={() => setPage(totalPages)} />);
    return <Pagination size="sm" className="justify-content-center">{items}</Pagination>;
  }

  const fmt = (val) => {
    const n = parseFloat(val || "0");
    return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  function renderScoresTable(entry) {
    const ss = entry.event_type?.scoring_system;
    if (!entry.scores || entry.scores.length === 0) return null;

    if (ss === "6.0") {
      return (
        <Table size="sm" borderless variant="dark" className="mb-0 mt-2" style={{ background: "#1e1e22" }}>
          <thead>
            <tr style={{ color: "#a1a1aa", fontSize: "0.8rem" }}>
              <th>Judge</th><th>Technical Merit</th><th>Presentation</th><th>Ordinal</th>
            </tr>
          </thead>
          <tbody>
            {entry.scores.map((s, i) => (
              <tr key={i}>
                <td>{s.judge_number}</td>
                <td>{s.technical_merit ?? "—"}</td>
                <td>{s.presentation ?? "—"}</td>
                <td>{s.ordinal ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      );
    }

    if (ss === "CJS") {
      return (
        <Table size="sm" borderless variant="dark" className="mb-0 mt-2" style={{ background: "#1e1e22" }}>
          <thead>
            <tr style={{ color: "#a1a1aa", fontSize: "0.8rem" }}>
              <th>Judge</th><th>Artistic Appeal</th><th>Performance</th><th>Skating Skills</th>
            </tr>
          </thead>
          <tbody>
            {entry.scores.map((s, i) => (
              <tr key={i}>
                <td>{s.judge_number}</td>
                <td>{s.artistic_appeal ?? "—"}</td>
                <td>{s.performance ?? "—"}</td>
                <td>{s.skating_skills ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      );
    }

    if (ss === "IJS") {
      return (
        <Table size="sm" borderless variant="dark" className="mb-0 mt-2" style={{ background: "#1e1e22" }}>
          <thead>
            <tr style={{ color: "#a1a1aa", fontSize: "0.8rem" }}>
              <th>Judge</th><th>Composition</th><th>Presentation</th><th>Skating Skills</th>
            </tr>
          </thead>
          <tbody>
            {entry.scores.map((s, i) => (
              <tr key={i}>
                <td>{s.judge_number}</td>
                <td>{s.composition ?? "—"}</td>
                <td>{s.presentation ?? "—"}</td>
                <td>{s.skating_skills ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      );
    }

    return null;
  }

  function renderElements(entry) {
    if (!entry.elements || entry.elements.length === 0) return null;
    return (
      <>
        <div style={{ color: "#a1a1aa", fontSize: "0.8rem", marginTop: 12, marginBottom: 4 }}>Elements</div>
        <Table size="sm" borderless variant="dark" className="mb-0" style={{ background: "#1e1e22" }}>
          <thead>
            <tr style={{ color: "#a1a1aa", fontSize: "0.8rem" }}>
              <th>#</th><th>Element</th><th>Base Value</th><th>GOE</th><th>Score</th>
            </tr>
          </thead>
          <tbody>
            {entry.elements.map((el, i) => (
              <tr key={i}>
                <td>{el.element_number}</td>
                <td>{el.element_name}</td>
                <td>{el.base_value ?? "—"}</td>
                <td>{el.goe ?? "—"}</td>
                <td>{el.final_score ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </>
    );
  }

  function renderDeductions(entry) {
    if (!entry.deductions || entry.deductions.length === 0) return null;
    return (
      <div style={{ marginTop: 8 }}>
        {entry.deductions.map((d, i) => (
          <Badge key={i} bg="danger" className="me-2" style={{ fontSize: "0.75rem" }}>
            {d.deduction_type}: {d.value}
          </Badge>
        ))}
      </div>
    );
  }

  function renderDetailModal() {
    return (
      <Modal
        show={showDetail}
        onHide={() => setShowDetail(false)}
        size="lg"
        centered
        className="comp-detail-modal"
      >
        {detailLoading ? (
          <Modal.Body style={{ background: "#26272b", textAlign: "center", padding: 60 }}>
            <Spinner animation="border" variant="light" />
          </Modal.Body>
        ) : detail?.error ? (
          <>
            <Modal.Header closeButton style={{ background: "#26272b", borderBottom: "1px solid #2d2d36" }}>
              <Modal.Title style={{ color: "#fff" }}>Error</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ background: "#26272b", color: "red" }}>
              {detail.error}
            </Modal.Body>
          </>
        ) : detail ? (
          <>
            <Modal.Header closeButton style={{ background: "#a78bfa", borderBottom: "none" }}>
              <Modal.Title style={{ color: "#fff", fontWeight: 700 }}>
                {detail.event_label}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ background: "#26272b", color: "#f3f4f6" }}>
              <Row className="mb-3">
                <Col sm={4}>
                  <div style={{ color: "#a1a1aa", fontSize: "0.8rem" }}>Date</div>
                  <div>{detail.event_date ? dayjs(detail.event_date).format("MMMM D, YYYY") : "—"}</div>
                </Col>
                <Col sm={4}>
                  <div style={{ color: "#a1a1aa", fontSize: "0.8rem" }}>Coach</div>
                  <div>{detail.coach || "—"}</div>
                </Col>
                <Col sm={4}>
                  <div style={{ color: "#a1a1aa", fontSize: "0.8rem" }}>Location</div>
                  {detail.location ? (
                    <div>
                      <div>{detail.location.name}</div>
                      {detail.location.city && detail.location.state && (
                        <div style={{ fontSize: "0.9rem" }}>{detail.location.city}, {detail.location.state}</div>
                      )}
                    </div>
                  ) : (
                    <div>—</div>
                  )}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col sm={4}>
                  <div style={{ color: "#a1a1aa", fontSize: "0.8rem" }}>Hosting Club</div>
                  <div>{detail.hosting_club || "—"}</div>
                </Col>
                <Col sm={4}>
                  <div style={{ color: "#a1a1aa", fontSize: "0.8rem" }}>Highlights</div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 4 }}>
                    {detail.notes && (
                      <span title={detail.notes} style={{ cursor: "default" }}>
                        <img src={bookletIcon} alt="Notes" style={{ width: 22, height: 22, opacity: 0.9 }} />
                      </span>
                    )}
                    {detail.entries?.filter(e => e.video_url).map((e, i) => (
                      <a key={i} href={e.video_url} target="_blank" rel="noopener noreferrer">
                        <img src={filmreelIcon} alt="Video" style={{ width: 22, height: 22, opacity: 0.9 }} />
                      </a>
                    ))}
                    {detail.entries?.some(e => e.placement != null && e.placement <= 3) && (
                      <img src={trophyIcon} alt="Podium" style={{ width: 22, height: 22, opacity: 0.9 }} />
                    )}
                    {!detail.notes && !detail.entries?.some(e => e.video_url) && !detail.entries?.some(e => e.placement != null && e.placement <= 3) && (
                      <span>—</span>
                    )}
                  </div>
                </Col>
                <Col sm={4} />
              </Row>

              {/* Cost line items */}
              {detail.costs && detail.costs.length > 0 && (
                <div
                  style={{
                    background: "#1e1e22",
                    borderRadius: "0.8rem",
                    padding: "0.8rem 1rem",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ color: "#a1a1aa", fontSize: "0.8rem", marginBottom: 6 }}>Costs</div>
                  {detail.costs.map((c, i) => (
                    <div key={i} style={{ marginBottom: c.note ? 6 : 2 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>
                          {c.category}
                          {c.quantity > 1 && (
                            <span style={{ color: "#a1a1aa", fontSize: "0.85rem" }}> (x{c.quantity})</span>
                          )}
                        </span>
                        <span>{fmt(c.line_total)}</span>
                      </div>
                      {c.note && (
                        <div style={{ color: "#a1a1aa", fontSize: "0.75rem", paddingLeft: 8 }}>{c.note}</div>
                      )}
                    </div>
                  ))}
                  <hr style={{ borderColor: "#2d2d36", margin: "6px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
                    <span>Total</span>
                    <span>{fmt(detail.event_cost)}</span>
                  </div>
                </div>
              )}

              <hr style={{ borderColor: "#2d2d36" }} />

              {detail.entries?.length === 0 && (
                <div style={{ color: "#a1a1aa", textAlign: "center", padding: 20 }}>
                  No entries for this event.
                </div>
              )}

              {detail.entries?.map((entry, idx) => (
                <div
                  key={entry.id}
                  style={{
                    background: "#1e1e22",
                    borderRadius: "0.8rem",
                    padding: "1rem 1.2rem",
                    marginBottom: idx < detail.entries.length - 1 ? 16 : 0,
                  }}
                >
                  <Row>
                    <Col sm={5}>
                      <div style={{ fontWeight: 600, fontSize: "1rem" }}>
                        {entry.event_segment || "Segment"}
                      </div>
                      <div style={{ color: "#a1a1aa", fontSize: "0.85rem" }}>
                        {entry.event_level || "—"}
                        {entry.event_type && (
                          <span style={{ marginLeft: 12 }}>
                            <Badge bg="secondary" style={{ fontSize: "0.7rem", marginRight: 4 }}>
                              {entry.event_type.scoring_system}
                            </Badge>
                            {entry.event_type.governing_body && (
                              <Badge bg="dark" style={{ fontSize: "0.7rem" }}>
                                {entry.event_type.governing_body}
                              </Badge>
                            )}
                          </span>
                        )}
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <StatusBadge status={entry.status} />
                      </div>
                    </Col>
                    <Col sm={4} style={{ textAlign: "center" }}>
                      <div style={{ color: "#a1a1aa", fontSize: "0.8rem" }}>Place</div>
                      <div style={{
                        fontSize: "1.4rem",
                        fontWeight: 700,
                        color: entry.placement && entry.placement <= 3 ? "#5eead4" : "#fff",
                      }}>
                        {entry.placement != null ? `${entry.placement} / ${entry.field_size ?? "?"}` : "—"}
                      </div>
                      {entry.majority && (
                        <div style={{ color: "#a1a1aa", fontSize: "0.75rem" }}>Majority: {entry.majority}</div>
                      )}
                    </Col>
                    <Col sm={3} style={{ textAlign: "right" }}>
                      {entry.total_segment_score != null && (
                        <div>
                          <div style={{ color: "#a1a1aa", fontSize: "0.8rem" }}>Segment Score</div>
                          <div style={{ fontSize: "1.2rem", fontWeight: 600 }}>
                            {entry.total_segment_score}
                          </div>
                        </div>
                      )}
                      {entry.entry_date && (
                        <div style={{ color: "#a1a1aa", fontSize: "0.75rem", marginTop: 4 }}>
                          {dayjs(entry.entry_date).format("MMM D, YYYY")}
                        </div>
                      )}
                    </Col>
                  </Row>

                  {renderScoresTable(entry)}
                  {renderElements(entry)}
                  {renderDeductions(entry)}

                  {entry.source_url && (
                    <div style={{ marginTop: 8 }}>
                      <a
                        href={entry.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#a78bfa", fontSize: "0.8rem" }}
                      >
                        View Official Results
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </Modal.Body>
          </>
        ) : null}
      </Modal>
    );
  }

  return (
    <div className="dashboard-bg">
      <Navbar onDataChange={fetchData} />
      <Container fluid className="p-4">

        {loading ? (
          <div style={{ color: "#a1a1aa", textAlign: "center", paddingTop: 80 }}>Loading...</div>
        ) : error ? (
          <div style={{ color: "red", textAlign: "center", paddingTop: 80 }}>{error}</div>
        ) : (
          <>
            {/* Upcoming Competitions */}
            {upcoming.length > 0 && (
              <Row className="mb-4">
                <Col md={12}>
                  <Card className="dashboard-card" style={{ minHeight: "auto" }}>
                    <Card.Body>
                      <Card.Title>Upcoming Competitions</Card.Title>
                      <div className="card-subtitle">Registered events that haven't happened yet</div>
                      <Table borderless hover variant="dark" responsive className="dashboard-table align-middle mt-3">
                        <thead>
                          <tr>
                            <th style={{ width: "6rem" }}>Date</th>
                            <th>Event</th>
                            <th>Segment</th>
                            <th>Level</th>
                            <th>Status</th>
                            <th style={{ width: "6rem" }}>Highlights</th>
                            <th>Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {upcoming.map((row, idx) => (
                            <tr
                              key={idx}
                              onClick={() => openDetail(row.event_id)}
                              style={{ cursor: "pointer" }}
                            >
                              <td style={{ whiteSpace: "nowrap" }}>{dayjs(row.entry_date || row.event_date).format("YYYY-MM-DD")}</td>
                              <td>{row.event_label}</td>
                              <td>{row.event_segment || "—"}</td>
                              <td>{row.event_level || "—"}</td>
                              <td><StatusBadge status={row.status} /></td>
                              <td>
                                <span style={{ display: "inline-flex", gap: 6 }}>
                                  {row.video_url && <img src={filmreelIcon} alt="Video" style={{ width: 20, height: 20, opacity: 0.9 }} />}
                                  {row.placement != null && row.placement <= 3 && <img src={trophyIcon} alt="Podium" style={{ width: 20, height: 20, opacity: 0.9 }} />}
                                </span>
                              </td>
                              <td>{row.event_cost != null ? fmt(row.event_cost) : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            {/* Competition History */}
            <Row>
              <Col md={12}>
                <Card className="dashboard-card">
                  <Card.Body>
                    <Card.Title>Competition History</Card.Title>
                    <div className="card-subtitle">Past competition entries, most recent first</div>
                    {history.length === 0 ? (
                      <div style={{ color: "#a1a1aa", textAlign: "center", paddingTop: 60 }}>
                        No past competition entries yet.
                      </div>
                    ) : (
                      <>
                        <Table borderless hover variant="dark" responsive className="dashboard-table align-middle mt-3">
                          <thead>
                            <tr>
                              <th style={{ width: "6rem" }}>Date</th>
                              <th>Event</th>
                              <th>Segment</th>
                              <th>Level</th>
                              <th>Place</th>
                              <th>Status</th>
                              <th style={{ width: "6rem" }}>Highlights</th>
                              <th>Cost</th>
                            </tr>
                          </thead>
                          <tbody>
                            {histPaginated.map((row, idx) => (
                              <tr
                                key={idx}
                                onClick={() => openDetail(row.event_id)}
                                style={{ cursor: "pointer" }}
                              >
                                <td style={{ whiteSpace: "nowrap" }}>{dayjs(row.entry_date || row.event_date).format("YYYY-MM-DD")}</td>
                                <td>{row.event_label}</td>
                                <td>{row.event_segment || "—"}</td>
                                <td>{row.event_level || "—"}</td>
                                <td>
                                  {row.placement != null ? (
                                    <span style={{
                                      fontWeight: 600,
                                      color: row.placement <= 3 ? "#5eead4" : "#fff",
                                    }}>
                                      {row.placement}
                                    </span>
                                  ) : "—"}
                                </td>
                                <td><StatusBadge status={row.status} /></td>
                                <td>
                                  <span style={{ display: "inline-flex", gap: 6 }}>
                                    {row.video_url && <img src={filmreelIcon} alt="Video" style={{ width: 20, height: 20, opacity: 0.9 }} />}
                                    {row.placement != null && row.placement <= 3 && <img src={trophyIcon} alt="Podium" style={{ width: 20, height: 20, opacity: 0.9 }} />}
                                  </span>
                                </td>
                                <td>{row.event_cost != null ? fmt(row.event_cost) : "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                        <div className="d-flex justify-content-center">
                          {renderPagination(histPage, histTotalPages, setHistPage)}
                        </div>
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}

      </Container>

      {renderDetailModal()}
    </div>
  );
}

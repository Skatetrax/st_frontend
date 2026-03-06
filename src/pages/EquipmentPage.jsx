import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Badge } from "react-bootstrap";
import "../Dashboard.css";
import { getEquipment } from "../api/api";
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

const colWidths = {
  date: "15%",
  make: "18%",
  model: "22%",
  size: "12%",
  cost: "15%",
  stat: "18%",
};

const fmtCost = (v) => (v != null ? `$${Number(v).toFixed(2)}` : "$0.00");
const fmtHours = (mins) => {
  if (!mins) return "0h 0m";
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${h}h ${m}m`;
};

export default function EquipmentPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEquipment()
      .then(setData)
      .catch(() => setError("Failed to load equipment data"))
      .finally(() => setLoading(false));
  }, []);

  const active = data?.active_config;
  const configs = data?.configs || [];
  const boots = data?.boots || [];
  const blades = data?.blades || [];

  const totalBootCost = boots.reduce((s, b) => s + (b.bootsPurchaseAmount || 0), 0);
  const totalBladeCost = blades.reduce((s, b) => s + (b.bladesPurchaseAmount || 0), 0);

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
            {/* Active Config highlight */}
            <Row className="mb-4">
              <Col md={4}>
                <Card className="dashboard-card h-100">
                  <Card.Body style={{ textAlign: "center" }}>
                    <div style={titleStyle}>Active Skate</div>
                    {active ? (
                      <>
                        <div style={{ fontSize: "1.1rem", color: "#a1a1aa", marginBottom: 4 }}>Boot</div>
                        <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff" }}>
                          {active.bootsName} {active.bootsModel}
                        </div>
                        <div style={{ fontSize: "1.1rem", color: "#a1a1aa", marginTop: 16, marginBottom: 4 }}>Blade</div>
                        <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff" }}>
                          {active.bladesName} {active.bladesModel}
                        </div>
                      </>
                    ) : (
                      <div style={{ color: "#a1a1aa" }}>No active config</div>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              <Col md={4}>
                <Card className="dashboard-card h-100">
                  <Card.Body style={{ textAlign: "center" }}>
                    <div style={titleStyle}>Boot Investment</div>
                    <div style={{ fontSize: "1.8rem", fontWeight: 600, color: "#fff" }}>
                      {fmtCost(totalBootCost)}
                    </div>
                    <div style={{ color: "#a1a1aa", fontSize: "0.9rem" }}>
                      across {boots.length} boot{boots.length !== 1 ? "s" : ""}
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={4}>
                <Card className="dashboard-card h-100">
                  <Card.Body style={{ textAlign: "center" }}>
                    <div style={titleStyle}>Blade Investment</div>
                    <div style={{ fontSize: "1.8rem", fontWeight: 600, color: "#fff" }}>
                      {fmtCost(totalBladeCost)}
                    </div>
                    <div style={{ color: "#a1a1aa", fontSize: "0.9rem" }}>
                      across {blades.length} blade{blades.length !== 1 ? "s" : ""}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* All Skate Configurations */}
            {configs.length > 0 && (
              <Row className="mb-4">
                <Col>
                  <Card className="dashboard-card" style={{ minHeight: "auto" }}>
                    <Card.Body>
                      <div style={titleStyle}>Skate Configurations</div>
                      <Table
                        borderless hover variant="dark" responsive
                        className="dashboard-table align-middle"
                        style={{ tableLayout: "fixed" }}
                      >
                        <thead>
                          <tr>
                            <th style={{ width: "16%" }}>Created</th>
                            <th style={{ width: "24%" }}>Boot</th>
                            <th style={{ width: "24%" }}>Blade</th>
                            <th style={{ width: "16%" }}>Hours</th>
                            <th style={{ width: "16%" }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {configs.map((c, idx) => (
                            <tr key={idx}>
                              <td>{c.date_created ? dayjs(c.date_created).format("YYYY-MM-DD") : "—"}</td>
                              <td>{c.bootsName} {c.bootsModel}</td>
                              <td>{c.bladesName} {c.bladesModel}</td>
                              <td>{fmtHours(c.hours)}</td>
                              <td>
                                {c.sActiveFlag === 1 ? (
                                  <Badge bg="success">Active</Badge>
                                ) : (
                                  <Badge bg="secondary">Retired</Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            {/* Boot Inventory */}
            {boots.length > 0 && (
              <Row className="mb-4">
                <Col>
                  <Card className="dashboard-card" style={{ minHeight: "auto" }}>
                    <Card.Body>
                      <div style={titleStyle}>Boots</div>
                      <Table
                        borderless hover variant="dark" responsive
                        className="dashboard-table align-middle"
                        style={{ tableLayout: "fixed" }}
                      >
                        <thead>
                          <tr>
                            <th style={{ width: colWidths.date }}>Purchased</th>
                            <th style={{ width: colWidths.make }}>Make</th>
                            <th style={{ width: colWidths.model }}>Model</th>
                            <th style={{ width: colWidths.size }}>Size</th>
                            <th style={{ width: colWidths.cost }}>Cost</th>
                            <th style={{ width: colWidths.stat }}>Hours</th>
                          </tr>
                        </thead>
                        <tbody>
                          {boots.map((b, idx) => (
                            <tr key={idx}>
                              <td>{b.date_created ? dayjs(b.date_created).format("YYYY-MM-DD") : "—"}</td>
                              <td>{b.bootsName}</td>
                              <td>{b.bootsModel}</td>
                              <td>{b.bootsSize || "—"}</td>
                              <td>{fmtCost(b.bootsPurchaseAmount)}</td>
                              <td>{fmtHours(b.hours)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            {/* Blade Inventory */}
            {blades.length > 0 && (
              <Row className="mb-4">
                <Col>
                  <Card className="dashboard-card" style={{ minHeight: "auto" }}>
                    <Card.Body>
                      <div style={titleStyle}>Blades</div>
                      <Table
                        borderless hover variant="dark" responsive
                        className="dashboard-table align-middle"
                        style={{ tableLayout: "fixed" }}
                      >
                        <thead>
                          <tr>
                            <th style={{ width: colWidths.date }}>Purchased</th>
                            <th style={{ width: colWidths.make }}>Make</th>
                            <th style={{ width: colWidths.model }}>Model</th>
                            <th style={{ width: colWidths.size }}>Size</th>
                            <th style={{ width: colWidths.cost }}>Cost</th>
                            <th style={{ width: colWidths.stat }}>Sharpenings</th>
                          </tr>
                        </thead>
                        <tbody>
                          {blades.map((b, idx) => (
                            <tr key={idx}>
                              <td>{b.date_created ? dayjs(b.date_created).format("YYYY-MM-DD") : "—"}</td>
                              <td>{b.bladesName}</td>
                              <td>{b.bladesModel}</td>
                              <td>{b.bladesSize || "—"}</td>
                              <td>{fmtCost(b.bladesPurchaseAmount)}</td>
                              <td>{b.sharpenings}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </>
        )}
      </Container>
    </div>
  );
}

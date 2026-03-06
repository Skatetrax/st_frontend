import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table } from "react-bootstrap";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import "../Dashboard.css";
import { getMaintenance } from "../api/api";
import Navbar from "../components/Navbar";
import { toDecimalHours, fmtTime } from "../utils/timeUtils";
import dayjs from "dayjs";

ChartJS.register(ArcElement, Tooltip, Legend);

const maintColWidths = { date: "15%", hoursOn: "15%", cost: "12%", shop: "22%", roh: "12%", notes: "24%" };

const titleStyle = {
  fontSize: "1.25rem",
  fontWeight: 700,
  letterSpacing: 0.5,
  textTransform: "uppercase",
  color: "#fff",
  marginBottom: "0.75rem",
};

function cycleColor(active, total) {
  if (!total) return "#22c55e";
  const pct = active / total;
  if (pct <= 0.75) return "#22c55e";
  if (pct <= 0.90) return "#facc15";
  return "#ef4444";
}

export default function MaintenancePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMaintenance()
      .then(setData)
      .catch(() => setError("Failed to load maintenance data"))
      .finally(() => setLoading(false));
  }, []);

  const clock = data?.clock;
  const blades = data?.blades || [];
  const activeBlade = blades.find((b) => b.is_active);
  const previousBlades = blades.filter((b) => !b.is_active);

  const activeDecimal = toDecimalHours(clock?.active_minutes);
  const totalDecimal = toDecimalHours(clock?.clock_minutes);
  const statusColor = cycleColor(activeDecimal, totalDecimal);

  const activeConfigCost = activeBlade
    ? activeBlade.history.reduce((sum, e) => sum + (e.cost || 0), 0)
    : 0;

  const donutOptions = {
    cutout: "80%",
    plugins: {
      legend: { position: "bottom", labels: { color: "#a1a1aa" } },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const totalMin = ctx.raw * 60;
            const h = Math.floor(totalMin / 60);
            const m = Math.round(totalMin % 60);
            return ` ${ctx.label}: ${h}h ${m}m`;
          },
        },
      },
    },
  };

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
            {/* Summary row */}
            <Row className="mb-4">
              {/* Maintenance Cost */}
              <Col md={4}>
                <Card className="dashboard-card h-100">
                  <Card.Body style={{ textAlign: "center" }}>
                    <div style={titleStyle}>Maintenance Cost</div>
                    <div style={{ fontSize: "1.8rem", fontWeight: 600, color: "#fff" }}>
                      ${activeConfigCost.toFixed(2)}
                    </div>
                    <div style={{ color: "#a1a1aa", fontSize: "0.9rem" }}>current config</div>
                    <div style={{ fontSize: "1.15rem", fontWeight: 600, color: "#fff", marginTop: 12 }}>
                      ${data.total_cost}
                    </div>
                    <div style={{ color: "#a1a1aa", fontSize: "0.9rem" }}>lifetime total</div>
                  </Card.Body>
                </Card>
              </Col>

              {/* Hours text */}
              <Col md={4}>
                <Card className="dashboard-card h-100">
                  <Card.Body style={{ textAlign: "center" }}>
                    <div style={titleStyle}>Current Cycle</div>
                    <div style={{ fontSize: "1.15rem", fontWeight: 600, color: "#fff" }}>
                      {fmtTime(clock?.active_minutes)} skated
                    </div>
                    <div style={{ fontSize: "1.15rem", fontWeight: 600, color: statusColor }}>
                      {fmtTime(clock?.remaining_minutes)} remaining
                    </div>
                    <div style={{ color: "#a1a1aa", fontSize: "0.85rem", marginTop: 4 }}>
                      cycle: {fmtTime(clock?.clock_minutes)}
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {/* Maintenance Clock donut */}
              <Col md={4}>
                <Card className="dashboard-card h-100">
                  <Card.Body style={{ textAlign: "center" }}>
                    <div style={titleStyle}>Maintenance Clock</div>
                    <div className="chart-container position-relative donut-chart-container">
                      <Doughnut
                        data={{
                          labels: ["Active", "Remaining"],
                          datasets: [
                            {
                              data: [activeDecimal, Math.max(totalDecimal - activeDecimal, 0)],
                              backgroundColor: [statusColor, "#e5f9e7"],
                              borderWidth: 0,
                            },
                          ],
                        }}
                        options={donutOptions}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          color: statusColor,
                          fontWeight: 700,
                          fontSize: "1.15rem",
                        }}
                      >
                        {fmtTime(clock?.remaining_minutes)}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Active blade sharpening history */}
            {activeBlade && (
              <Row className="mb-4">
                <Col>
                  <Card className="dashboard-card">
                    <Card.Body>
                      <Card.Title>
                        {activeBlade.blade_name} {activeBlade.blade_model}
                        <span
                          style={{
                            marginLeft: 12,
                            fontSize: "0.8rem",
                            color: "#22c55e",
                            fontWeight: 400,
                          }}
                        >
                          Active
                        </span>
                      </Card.Title>
                      <div className="card-subtitle mb-3">
                        {fmtTime(activeBlade.meta.total_hours)} total &middot;{" "}
                        {activeBlade.meta.sharpenings} sharpening
                        {activeBlade.meta.sharpenings !== 1 ? "s" : ""}
                      </div>
                      {activeBlade.history.length === 0 ? (
                        <div style={{ color: "#a1a1aa" }}>No sharpening records yet.</div>
                      ) : (
                        <Table
                          borderless
                          hover
                          variant="dark"
                          responsive
                          className="dashboard-table align-middle"
                          style={{ tableLayout: "fixed" }}
                        >
                          <thead>
                            <tr>
                              <th style={{ width: maintColWidths.date }}>Date</th>
                              <th style={{ width: maintColWidths.hoursOn }}>Hours On</th>
                              <th style={{ width: maintColWidths.cost }}>Cost</th>
                              <th style={{ width: maintColWidths.shop }}>Shop</th>
                              <th style={{ width: maintColWidths.roh }}>ROH</th>
                              <th style={{ width: maintColWidths.notes }}>Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeBlade.history.map((row, idx) => (
                              <tr key={idx}>
                                <td>{row.date ? dayjs(row.date).format("YYYY-MM-DD") : "—"}</td>
                                <td>{fmtTime(row.hours_on)}</td>
                                <td>${(row.cost || 0).toFixed(2)}</td>
                                <td>{row.location || "—"}</td>
                                <td>{row.roh || "—"}</td>
                                <td>{row.notes || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            {/* Previous blades (only those with history) */}
            {previousBlades
              .filter((blade) => blade.history.length > 0)
              .map((blade, bIdx) => (
              <Row className="mb-4" key={bIdx}>
                <Col>
                  <Card className="dashboard-card">
                    <Card.Body>
                      <Card.Title>
                        {blade.blade_name} {blade.blade_model}
                      </Card.Title>
                      <div className="card-subtitle mb-3">
                        {fmtTime(blade.meta.total_hours)} total &middot;{" "}
                        {blade.meta.sharpenings} sharpening
                        {blade.meta.sharpenings !== 1 ? "s" : ""}
                      </div>
                      <Table
                        borderless
                        hover
                        variant="dark"
                        responsive
                        className="dashboard-table align-middle"
                        style={{ tableLayout: "fixed" }}
                      >
                        <thead>
                          <tr>
                            <th style={{ width: maintColWidths.date }}>Date</th>
                            <th style={{ width: maintColWidths.hoursOn }}>Hours On</th>
                            <th style={{ width: maintColWidths.cost }}>Cost</th>
                            <th style={{ width: maintColWidths.shop }}>Shop</th>
                            <th style={{ width: maintColWidths.roh }}>ROH</th>
                            <th style={{ width: maintColWidths.notes }}>Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {blade.history.map((row, idx) => (
                            <tr key={idx}>
                              <td>{row.date ? dayjs(row.date).format("YYYY-MM-DD") : "—"}</td>
                              <td>{fmtTime(row.hours_on)}</td>
                              <td>${(row.cost || 0).toFixed(2)}</td>
                              <td>{row.location || "—"}</td>
                              <td>{row.roh || "—"}</td>
                              <td>{row.notes || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            ))}
          </>
        )}
      </Container>
    </div>
  );
}

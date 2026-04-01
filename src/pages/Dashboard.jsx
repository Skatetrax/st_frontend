import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Pagination,
} from "react-bootstrap";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import "../Dashboard.css";
import { getDashboard } from "../api/api";
import Navbar from "../components/Navbar";
import { toDecimalHours, fmtTime, sumFmtTime } from "../utils/timeUtils";
import dayjs from "dayjs";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

export default function Dashboard() {
  // State for dashboard data
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardError, setDashboardError] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Pagination for Skating Sessions
  const [sessionPage, setSessionPage] = useState(1);
  const sessionsPerPage = 10;
  const sessionRows = dashboardData?.session_table || [];
  const totalSessionPages = Math.ceil(sessionRows.length / sessionsPerPage);
  const paginatedSessions = sessionRows.slice((sessionPage - 1) * sessionsPerPage, sessionPage * sessionsPerPage);

  const fetchDashboard = () => {
    setDashboardLoading(true);
    getDashboard()
      .then((data) => {
        setDashboardData(data);
        setDashboardLoading(false);
      })
      .catch((err) => {
        setDashboardError("Failed to load dashboard data");
        setDashboardLoading(false);
      });
  };

  useEffect(() => { fetchDashboard(); }, []);

  // Pie chart (Summary) data from API or fallback
  let summaryData;
  const ratio = dashboardData?.charts?.monthly_ratio;
  const coached = toDecimalHours(ratio?.coached);
  const practice = toDecimalHours(ratio?.practice);
  const group = toDecimalHours(ratio?.group);
  const hasTrainingData = coached + practice + group > 0;

  if (hasTrainingData) {
    summaryData = {
      labels: ["Coached", "Practice", "Group Classes"],
      datasets: [{
        data: [coached, practice, group],
        backgroundColor: ["#2563eb", "#a78bfa", "#60a5fa"],
        borderWidth: 0,
      }],
    };
  } else {
    summaryData = {
      labels: ["No data yet"],
      datasets: [{
        data: [1],
        backgroundColor: ["#3f3f46"],
        borderWidth: 0,
      }],
    };
  }

  const donutOptions = {
    cutout: "90%",
    plugins: {
      legend: {
        position: "right",
        labels: { color: "#fff" },
      },
      tooltip: {
        filter: (item) => item.label !== "No data yet",
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

  // Helper for colored initial for Skate Type
  const skateTypeColors = {
    "Public": "#36A2EB",
    "Group Class": "#a78bfa",
    "Free Style (Walk On)": "#22c55e",
    "Competition": "#f59e42",
    "Coaching Session": "#FF6384",
    "Performance": "#6366f1",
    "Club Ice": "#eab308",
    "Free Style (Punch Card)": "#4BC0C0",
    "Off Ice - Concrete or Asphalt": "#e5f9e7",
    "Off Ice - Rink": "#9966FF",
  };

  return (
    <div className="dashboard-bg">
      <Navbar onDataChange={fetchDashboard} />
      <Container fluid className="p-4">

        <Row className="mb-4">
          <Col md={4}>
            {/* Monthly Training Overview donut chart */}
            <Card className="dashboard-card">
              <Card.Body>
                <Card.Title>Monthly Training Overview</Card.Title>
                <div className="card-subtitle">Coached vs Practice (hours)</div>
                <div className="chart-container position-relative donut-chart-container">
                  {dashboardLoading ? (
                    <div style={{ color: '#a1a1aa', textAlign: 'center', paddingTop: '60px' }}>Loading...</div>
                  ) : dashboardError ? (
                    <div style={{ color: 'red', textAlign: 'center', paddingTop: '60px' }}>{dashboardError}</div>
                  ) : (
                    <Doughnut data={summaryData} options={{
                      ...donutOptions,
                      plugins: {
                        ...donutOptions.plugins,
                        legend: {
                          ...donutOptions.plugins.legend,
                          position: 'bottom',
                          labels: {
                            color: '#a1a1aa',
                            filter: (item) => item.text !== "No data yet",
                          },
                        },
                      },
                    }} />
                  )}
                  {/* Center value: show total hours if data loaded */}
                  {!dashboardLoading && !dashboardError && dashboardData && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '1.3rem',
                    }}>
                      {dashboardData.charts && dashboardData.charts.monthly_ratio
                        ? sumFmtTime(
                            dashboardData.charts.monthly_ratio.coached,
                            dashboardData.charts.monthly_ratio.practice,
                            dashboardData.charts.monthly_ratio.group
                          )
                        : "0h 0m"}
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* NEW: Spend Breakdown Donut Chart (3 layers) */}
          <Col md={4}>
            <Card className="dashboard-card">
              <Card.Body>
                <Card.Title>Spend Breakdown</Card.Title>
                <div className="card-subtitle">Current Year</div>
                <div className="chart-container position-relative donut-chart-container">
                  {dashboardLoading ? (
                    <div style={{ color: '#a1a1aa', textAlign: 'center', paddingTop: '60px' }}>Loading...</div>
                  ) : dashboardError ? (
                    <div style={{ color: 'red', textAlign: 'center', paddingTop: '60px' }}>{dashboardError}</div>
                  ) : (
                    (() => {
                      const spend = dashboardData?.charts?.spend || {};
                      const parseSpend = (val) => parseFloat((val || '0').replace(/,/g, ''));
                      const classVal = parseSpend(spend.class);
                      const coachingVal = parseSpend(spend.coaching);
                      const iceTimeVal = parseSpend(spend.ice_time);
                      const equipmentVal = parseSpend(spend.equipment);
                      const maintenanceVal = parseSpend(spend.maintenance);
                      const membershipVal = parseSpend(spend.membership);
                      const competitionVal = parseSpend(spend.competition);
                      const totalVal = parseSpend(spend.total);

                      const emptyRing = { data: [1], backgroundColor: ["#3f3f46"], borderWidth: 0, empty: true };
                      const outerHasData = classVal + coachingVal + iceTimeVal > 0;
                      const middleHasData = equipmentVal + maintenanceVal > 0;
                      const innerHasData = membershipVal + competitionVal > 0;

                      return (
                        <>
                          <Doughnut
                            data={{
                              labels: [],
                              datasets: [
                                outerHasData
                                  ? { data: [classVal, coachingVal, iceTimeVal], backgroundColor: ["#60a5fa", "#2563eb", "#a78bfa"], borderWidth: 2, borderColor: "#232a2d", hoverOffset: 4 }
                                  : { ...emptyRing },
                                middleHasData
                                  ? { data: [equipmentVal, maintenanceVal], backgroundColor: ["#86efac", "#22c55e"], borderWidth: 2, borderColor: "#232a2d", hoverOffset: 8 }
                                  : { ...emptyRing },
                                innerHasData
                                  ? { data: [membershipVal, competitionVal], backgroundColor: ["#eab308", "#f59e42"], borderWidth: 2, borderColor: "#232a2d", hoverOffset: 12 }
                                  : { ...emptyRing },
                              ],
                            }}
                            options={{
                              cutout: '50%',
                              plugins: {
                                legend: { display: false },
                                tooltip: {
                                  filter: (item) => !item.dataset.empty,
                                  callbacks: {
                                    label: function(context) {
                                      const ringLabels = [
                                        ["Class", "Coaching", "Ice Time"],
                                        ["Equipment", "Maintenance"],
                                        ["Membership", "Competition"],
                                      ];
                                      const ring = context.datasetIndex;
                                      const idx = context.dataIndex;
                                      const label = ringLabels[ring][idx] || '';
                                      return `${label}: $${context.raw.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`;
                                    }
                                  }
                                }
                              },
                            }}
                          />
                          {/* Center value: show total spend */}
                          <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '1.3rem',
                            textAlign: 'center',
                          }}>
                            ${totalVal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                            <div style={{ fontWeight: 400, fontSize: '0.9rem', color: '#a1a1aa' }}>total</div>
                          </div>
                        </>
                      );
                    })()
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Maintenance Overview donut chart */}
          <Col md={4}>
            <Card className="dashboard-card mb-4">
              <Card.Body>
                <Card.Title>Maintenance Overview</Card.Title>
                <div className="card-subtitle">Active vs Remaining (hours)</div>
                <div className="chart-container position-relative donut-chart-container">
                  {dashboardLoading ? (
                    <div style={{ color: '#a1a1aa', textAlign: 'center', paddingTop: '60px' }}>Loading...</div>
                  ) : dashboardError ? (
                    <div style={{ color: 'red', textAlign: 'center', paddingTop: '60px' }}>{dashboardError}</div>
                  ) : (
                    (() => {
                      const activeVal = dashboardData?.maintenance ? toDecimalHours(dashboardData.maintenance.active_minutes) : 0;
                      const remainVal = dashboardData?.maintenance ? toDecimalHours(dashboardData.maintenance.remaining_minutes) : 0;
                      const hasMaintData = activeVal + remainVal > 0;
                      return (
                        <Doughnut
                          data={hasMaintData
                            ? {
                                labels: ["Active", "Remaining"],
                                datasets: [{ data: [activeVal, remainVal], backgroundColor: ["#22c55e", "#e5f9e7"], borderWidth: 0 }],
                              }
                            : {
                                labels: ["No data yet"],
                                datasets: [{ data: [1], backgroundColor: ["#3f3f46"], borderWidth: 0 }],
                              }
                          }
                          options={{
                            ...donutOptions,
                            plugins: {
                              ...donutOptions.plugins,
                              legend: {
                                ...donutOptions.plugins.legend,
                                position: 'bottom',
                                labels: {
                                  color: '#a1a1aa',
                                  filter: (item) => item.text !== "No data yet",
                                },
                              },
                            },
                          }}
                        />
                      );
                    })()
                  )}
                  {/* Center value: show total clock minutes if data loaded */}
                  {!dashboardLoading && !dashboardError && dashboardData && dashboardData.maintenance && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '1.3rem',
                    }}>
                      {fmtTime(dashboardData.maintenance.clock_minutes)}
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col md={12}>
            <Card className="dashboard-card">
              <Card.Body>
                <Card.Title>Skating Sessions</Card.Title>
                <div className="card-subtitle">Last Two Weeks</div>
                <Table borderless hover variant="dark" responsive className="dashboard-table align-middle mt-3">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Skate Time</th>
                      <th>Ice Cost</th>
                      <th>Skate Type</th>
                      <th>Coach Time</th>
                      <th>Coach Name</th>
                      <th>Rink Name</th>
                      <th>Rink City</th>
                      <th>Rink State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSessions.map((row, idx) => (
                      <tr key={idx}>
                        <td>{dayjs(row.date).format("YYYY-MM-DD")}</td>
                        <td>{row.ice_time}</td>
                        <td>${row.ice_cost.toFixed(2)}</td>
                        <td>
                          <span
                            className="avatar"
                            style={{
                              backgroundColor: skateTypeColors[row.ice_type] || "#888",
                              marginRight: 8,
                              width: 28,
                              height: 28,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "50%",
                              color: "#fff",
                              fontWeight: 700,
                              fontSize: "0.95rem",
                            }}
                          >
                            {row.ice_type ? row.ice_type[0] : "?"}
                          </span>
                          {row.ice_type}
                        </td>
                        <td>{row.coach_time}</td>
                        <td>{row.coach}</td>
                        <td>{row.rink_name}</td>
                        <td>{row.rink_city}</td>
                        <td>{row.rink_state}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <div className="d-flex justify-content-end">
                  <Pagination size="sm">
                    {[...Array(totalSessionPages)].map((_, i) => (
                      <Pagination.Item key={i+1} active={sessionPage === i+1} onClick={() => setSessionPage(i+1)}>
                        {i+1}
                      </Pagination.Item>
                    ))}
                  </Pagination>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
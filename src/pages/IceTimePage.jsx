import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Pagination,
} from "react-bootstrap";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "../Dashboard.css";
import { getDashboard, getIceTime } from "../api/api";
import Navbar from "../components/Navbar";
import { toDecimalHours, fmtTime } from "../utils/timeUtils";
import dayjs from "dayjs";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function IceTimePage() {
  // State for dashboard data
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardError, setDashboardError] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

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

  // State for ice time data
  const [iceTimeData, setIceTimeData] = useState(null);
  const [iceTimeError, setIceTimeError] = useState(null);
  const [iceTimeLoading, setIceTimeLoading] = useState(true);
  const [calendarOffset, setCalendarOffset] = useState(0);
  const [calendarLoading, setCalendarLoading] = useState(false);

  const fetchIceTime = (monthsBack = 0) => {
    setIceTimeLoading(true);
    getIceTime({ monthsBack })
      .then((data) => {
        setIceTimeData(data);
        setIceTimeLoading(false);
      })
      .catch(() => {
        setIceTimeError("Failed to load ice time data");
        setIceTimeLoading(false);
      });
  };

  const shiftCalendar = (delta) => {
    const next = Math.max(0, calendarOffset + delta);
    setCalendarOffset(next);
    setCalendarLoading(true);
    getIceTime({ monthsBack: next })
      .then((data) => {
        setIceTimeData(prev => ({ ...prev, fsc_graph: data.fsc_graph }));
      })
      .catch(() => {})
      .finally(() => setCalendarLoading(false));
  };

  const refreshAll = () => {
    fetchDashboard();
    setCalendarOffset(0);
    fetchIceTime(0);
  };

  useEffect(() => { fetchDashboard(); }, []);
  useEffect(() => { fetchIceTime(); }, []);

  const donutOptions = {
    cutout: "90%",
    plugins: {
      legend: {
        position: "right",
        labels: { color: "#fff" },
      },
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

  // Pagination for Skating Sessions
  const [sessionPage, setSessionPage] = useState(1);
  const sessionsPerPage = 10;
  const sessionRows = iceTimeData?.session_table || [];
  const totalSessionPages = Math.ceil(sessionRows.length / sessionsPerPage);
  const paginatedSessions = sessionRows.slice((sessionPage - 1) * sessionsPerPage, sessionPage * sessionsPerPage);

  // Condensed pagination logic
  function renderPagination() {
    if (totalSessionPages <= 1) return null;
    const items = [];
    // First and Previous
    items.push(
      <Pagination.First key="first" disabled={sessionPage === 1} onClick={() => setSessionPage(1)} />
    );
    items.push(
      <Pagination.Prev key="prev" disabled={sessionPage === 1} onClick={() => setSessionPage(sessionPage - 1)} />
    );
    // Always show first page
    items.push(
      <Pagination.Item key={1} active={sessionPage === 1} onClick={() => setSessionPage(1)}>
        1
      </Pagination.Item>
    );
    // Ellipsis if needed
    if (sessionPage > 4) {
      items.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);
    }
    // Pages around current
    for (let i = Math.max(2, sessionPage - 2); i <= Math.min(totalSessionPages - 1, sessionPage + 2); i++) {
      if (i === 1 || i === totalSessionPages) continue;
      items.push(
        <Pagination.Item key={i} active={sessionPage === i} onClick={() => setSessionPage(i)}>
          {i}
        </Pagination.Item>
      );
    }
    // Ellipsis if needed
    if (sessionPage < totalSessionPages - 3) {
      items.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);
    }
    // Always show last page if more than 1
    if (totalSessionPages > 1) {
      items.push(
        <Pagination.Item key={totalSessionPages} active={sessionPage === totalSessionPages} onClick={() => setSessionPage(totalSessionPages)}>
          {totalSessionPages}
        </Pagination.Item>
      );
    }
    // Next and Last
    items.push(
      <Pagination.Next key="next" disabled={sessionPage === totalSessionPages} onClick={() => setSessionPage(sessionPage + 1)} />
    );
    items.push(
      <Pagination.Last key="last" disabled={sessionPage === totalSessionPages} onClick={() => setSessionPage(totalSessionPages)} />
    );
    return <Pagination size="sm" className="justify-content-center">{items}</Pagination>;
  }

  return (
    <div className="dashboard-bg">
      <Navbar onDataChange={refreshAll} />
      <Container fluid className="p-4">

        <Row className="mb-4 align-items-stretch">
          <Col md={4} className="d-flex">
            <Card className="dashboard-card w-100">
              <Card.Body>
                <Card.Title>Financial Overview</Card.Title>
                <div style={{ color: '#a1a1aa', fontSize: '0.8rem', marginBottom: '0.75rem' }}>Lifetime totals across all categories</div>
                {dashboardLoading ? (
                  <div style={{ color: '#a1a1aa', textAlign: 'center', paddingTop: '40px' }}>Loading...</div>
                ) : dashboardError ? (
                  <div style={{ color: 'red', textAlign: 'center', paddingTop: '40px' }}>{dashboardError}</div>
                ) : (() => {
                  const spend = dashboardData?.charts?.spend || {};
                  const fmt = (val) => {
                    const n = parseFloat(val || '0');
                    return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  };
                  const categories = [
                    { label: "Ice Time", value: spend.ice_time },
                    { label: "Coaching", value: spend.coaching },
                    { label: "Group Class Fees", value: spend.class },
                    { label: "Skate Camp Fees", value: spend.camp },
                    { label: "Maintenance Costs", value: spend.maintenance },
                    { label: "Equipment Costs", value: spend.equipment },
                    { label: "Competition Fees", value: spend.competition },
                    { label: "Performance Fees", value: spend.performance },
                    { label: "Membership Fees", value: spend.membership },
                  ];
                  return (
                    <div>
                      {categories.map((cat) => (
                        <div key={cat.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>{cat.label}</span>
                          <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}>{fmt(cat.value)}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', marginTop: '0.25rem' }}>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>Total</span>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>{fmt(spend.total)}</span>
                      </div>
                    </div>
                  );
                })()}
              </Card.Body>
            </Card>
          </Col>
          <Col md={8} className="d-flex">
            <Card className="dashboard-card w-100">
              <Card.Body>
                <Card.Title>Trends & Breakdowns</Card.Title>
                <div style={{ color: '#a1a1aa', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Current month activity compared against your previous 3-month average</div>
                {dashboardLoading ? (
                  <div style={{ color: '#a1a1aa', textAlign: 'center', paddingTop: '40px' }}>Loading...</div>
                ) : dashboardError ? (
                  <div style={{ color: 'red', textAlign: 'center', paddingTop: '40px' }}>{dashboardError}</div>
                ) : (() => {
                  const thisMonthCount = dashboardData?.session_table?.length || 0;
                  const baseline = dashboardData?.baseline_monthly_avg || 0;

                  const now = dayjs();
                  const daysElapsed = now.date();
                  const daysInMonth = now.daysInMonth();
                  const projected = daysElapsed > 0
                    ? (thisMonthCount / daysElapsed) * daysInMonth
                    : thisMonthCount;

                  let paceLabel, paceColor;
                  if (baseline === 0 && thisMonthCount === 0) {
                    paceLabel = "No sessions recorded";
                    paceColor = "#a1a1aa";
                  } else if (baseline === 0) {
                    paceLabel = "Ahead of Pace";
                    paceColor = "#5eead4";
                  } else {
                    const pctDiff = ((projected - baseline) / baseline) * 100;
                    if (pctDiff >= 10) {
                      paceLabel = "Ahead of Pace";
                      paceColor = "#5eead4";
                    } else if (pctDiff >= -10) {
                      paceLabel = "On Track";
                      paceColor = "#fff";
                    } else if (pctDiff >= -30) {
                      paceLabel = "Behind Pace";
                      paceColor = "#fbbf24";
                    } else {
                      paceLabel = "Off Pace";
                      paceColor = "#fbbf24";
                    }
                  }

                  const monthly = dashboardData?.charts?.monthly_ratio;
                  const coached = monthly ? fmtTime(monthly.coached) : "0h 0m";
                  const practice = monthly ? fmtTime(monthly.practice) : "0h 0m";
                  const group = monthly ? fmtTime(monthly.group) : "0h 0m";

                  const bl = dashboardData?.charts?.baseline_ratio;
                  const blCoached = bl ? fmtTime(bl.coached) : "0h 0m";
                  const blPractice = bl ? fmtTime(bl.practice) : "0h 0m";
                  const blGroup = bl ? fmtTime(bl.group) : "0h 0m";

                  const deltaIndicator = (current, avg) => {
                    const curVal = current ? toDecimalHours(current) : 0;
                    const avgVal = avg ? toDecimalHours(avg) : 0;
                    if (avgVal === 0) return null;
                    const pct = ((curVal - avgVal) / avgVal) * 100;
                    if (Math.abs(pct) < 10) return null;
                    const arrow = pct > 0 ? "↑" : "↓";
                    const color = pct > 0 ? "#5eead4" : "#fbbf24";
                    return { label: `${arrow} ${Math.abs(Math.round(pct))}%`, color };
                  };

                  const dCoached = deltaIndicator(monthly?.coached, bl?.coached);
                  const dPractice = deltaIndicator(monthly?.practice, bl?.practice);
                  const dGroup = deltaIndicator(monthly?.group, bl?.group);

                  const currentMonth = dayjs().format("MMMM");

                  return (
                    <div style={{ display: 'flex', gap: '2rem' }}>
                      {/* Left side: session counts, pace, breakdowns */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: '2.5rem', marginBottom: '1rem', marginTop: '0.5rem' }}>
                          <div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 600, color: '#fff' }}>{thisMonthCount}</div>
                            <div style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>{currentMonth} Sessions</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 600, color: '#a1a1aa' }}>{baseline}</div>
                            <div style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>Average Baseline</div>
                          </div>
                        </div>
                        <div style={{
                          color: paceColor,
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          marginBottom: '1.25rem',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          background: 'rgba(255,255,255,0.05)',
                          display: 'inline-block',
                        }}>
                          {paceLabel}
                        </div>
                        <hr style={{ borderColor: '#333', margin: '0 0 0.75rem 0' }} />
                        <div style={{ fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.25rem' }}>{currentMonth} Breakdown</div>
                        <div style={{ display: 'flex', marginTop: '0.5rem' }}>
                          <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ color: '#2563eb', fontWeight: 600, fontSize: '1.1rem' }}>
                              {coached}
                              {dCoached && <span style={{ fontSize: '0.7rem', color: dCoached.color, marginLeft: 4 }}>{dCoached.label}</span>}
                            </div>
                            <div style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>Coached</div>
                          </div>
                          <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ color: '#a78bfa', fontWeight: 600, fontSize: '1.1rem' }}>
                              {practice}
                              {dPractice && <span style={{ fontSize: '0.7rem', color: dPractice.color, marginLeft: 4 }}>{dPractice.label}</span>}
                            </div>
                            <div style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>Practice</div>
                          </div>
                          <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ color: '#60a5fa', fontWeight: 600, fontSize: '1.1rem' }}>
                              {group}
                              {dGroup && <span style={{ fontSize: '0.7rem', color: dGroup.color, marginLeft: 4 }}>{dGroup.label}</span>}
                            </div>
                            <div style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>Group</div>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.25rem', marginTop: '0.75rem' }}>Baseline Breakdown</div>
                        <div style={{ display: 'flex', marginTop: '0.5rem' }}>
                          <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ color: '#2563eb', fontWeight: 600, fontSize: '1.1rem', opacity: 0.6 }}>{blCoached}</div>
                            <div style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>Coached</div>
                          </div>
                          <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ color: '#a78bfa', fontWeight: 600, fontSize: '1.1rem', opacity: 0.6 }}>{blPractice}</div>
                            <div style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>Practice</div>
                          </div>
                          <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ color: '#60a5fa', fontWeight: 600, fontSize: '1.1rem', opacity: 0.6 }}>{blGroup}</div>
                            <div style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>Group</div>
                          </div>
                        </div>
                      </div>
                      {/* Right side: doughnut chart */}
                      <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div className="card-subtitle" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Year (outer) vs Month (inner)</div>
                        {(() => {
                          const yr = dashboardData?.charts?.yearly_ratio;
                          const mo = dashboardData?.charts?.monthly_ratio;
                          const yrCoached = toDecimalHours(yr?.coached);
                          const yrPractice = toDecimalHours(yr?.practice);
                          const yrGroup = toDecimalHours(yr?.group);
                          const moCoached = toDecimalHours(mo?.coached);
                          const moPractice = toDecimalHours(mo?.practice);
                          const moGroup = toDecimalHours(mo?.group);
                          const yearHasData = yrCoached + yrPractice + yrGroup > 0;
                          const monthHasData = moCoached + moPractice + moGroup > 0;

                          const emptyRing = { data: [1], backgroundColor: ["#3f3f46"], borderWidth: 0, empty: true };

                          return (
                            <Doughnut
                              data={{
                                labels: ["Coached", "Practice", "Group Classes"],
                                datasets: [
                                  yearHasData
                                    ? { data: [yrCoached, yrPractice, yrGroup], backgroundColor: ["#2563eb", "#a78bfa", "#60a5fa"], borderWidth: 2, borderColor: "#232a2d", hoverOffset: 8 }
                                    : { ...emptyRing },
                                  monthHasData
                                    ? { data: [moCoached, moPractice, moGroup], backgroundColor: ["#2563eb", "#a78bfa", "#60a5fa"], borderWidth: 2, borderColor: "#232a2d", hoverOffset: 4 }
                                    : { ...emptyRing },
                                ],
                              }}
                              options={{
                                ...donutOptions,
                                plugins: {
                                  ...donutOptions.plugins,
                                  legend: {
                                    ...donutOptions.plugins.legend,
                                    position: 'bottom',
                                    labels: { color: '#a1a1aa' },
                                  },
                                  tooltip: {
                                    filter: (item) => !item.dataset.empty,
                                    callbacks: {
                                      label: function(context) {
                                        const ring = context.datasetIndex === 0 ? 'Year' : 'Month';
                                        const totalMin = context.raw * 60;
                                        const h = Math.floor(totalMin / 60);
                                        const m = Math.round(totalMin % 60);
                                        return `${ring} - ${context.label}: ${h}h ${m}m`;
                                      }
                                    }
                                  }
                                },
                                cutout: '60%',
                              }}
                            />
                          );
                        })()}
                      </div>
                    </div>
                  );
                })()}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* New full-width row for Figure Skater Calendar */}
        <Row className="mb-4">
          <Col md={12}>
            <Card className="dashboard-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <div>
                    <Card.Title style={{ margin: 0 }}>Figure Skater Calendar</Card.Title>
                    <div className="card-subtitle" style={{ marginBottom: 0 }}>Monthly breakdown of ice time, coaching, competitions, and group sessions</div>
                  </div>
                  <div className="d-flex align-items-center" style={{ gap: 6, minWidth: 220, justifyContent: "flex-end" }}>
                    <button
                      onClick={() => shiftCalendar(3)}
                      disabled={calendarLoading}
                      title="Go back 3 months"
                      style={{
                        background: "none", border: "1px solid #4b5563", borderRadius: 4,
                        color: "#a1a1aa", cursor: "pointer", padding: "4px 10px", fontSize: "0.9rem",
                      }}
                    >
                      &#9664;
                    </button>
                    <button
                      onClick={() => shiftCalendar(-3)}
                      disabled={calendarOffset === 0 || calendarLoading}
                      title="Go forward 3 months"
                      style={{
                        background: "none", border: "1px solid #4b5563", borderRadius: 4,
                        color: calendarOffset === 0 ? "#333" : "#a1a1aa",
                        cursor: calendarOffset === 0 ? "default" : "pointer",
                        padding: "4px 10px", fontSize: "0.9rem",
                      }}
                    >
                      &#9654;
                    </button>
                    <button
                      onClick={() => { setCalendarOffset(0); setCalendarLoading(true); getIceTime({ monthsBack: 0 }).then(data => setIceTimeData(prev => ({ ...prev, fsc_graph: data.fsc_graph }))).finally(() => setCalendarLoading(false)); }}
                      disabled={calendarOffset === 0 || calendarLoading}
                      title="Reset to present"
                      style={{
                        background: "none", border: "1px solid #4b5563", borderRadius: 4,
                        color: calendarOffset === 0 ? "#333" : "#a78bfa",
                        cursor: calendarOffset === 0 ? "default" : "pointer",
                        padding: "4px 8px", fontSize: "0.78rem",
                        visibility: calendarOffset === 0 ? "hidden" : "visible",
                      }}
                    >
                      Now
                    </button>
                  </div>
                </div>
                <div className="chart-container">
                  {(iceTimeLoading || calendarLoading) ? (
                    <div style={{ color: '#a1a1aa', textAlign: 'center', paddingTop: '60px' }}>Loading...</div>
                  ) : iceTimeError ? (
                    <div style={{ color: 'red', textAlign: 'center', paddingTop: '60px' }}>{iceTimeError}</div>
                  ) : (
                    (() => {
                      const months = iceTimeData?.fsc_graph?.months || [];
                      const practice = iceTimeData?.fsc_graph?.practice || [];
                      const coach = iceTimeData?.fsc_graph?.coach_time || [];
                      const group = iceTimeData?.fsc_graph?.group_sessions || [];
                      const competitions = iceTimeData?.fsc_graph?.competitions || [];
                      const maxY = Math.max(
                        ...coach,
                        ...group,
                        ...practice,
                        1
                      );
                      const competitionPoints = competitions.map(val => val === 1 ? maxY * 1.1 : null);
                      return (
                        <Line
                          data={{
                            labels: months,
                            datasets: [
                              {
                                label: 'Practice',
                                data: practice,
                                borderColor: '#a78bfa',
                                backgroundColor: 'rgba(167,139,250,0.1)',
                                fill: true,
                                tension: 0.3,
                              },
                              {
                                label: 'Coached',
                                data: coach,
                                borderColor: '#2563eb',
                                backgroundColor: 'rgba(37,99,235,0.1)',
                                fill: true,
                                tension: 0.3,
                              },
                              {
                                label: 'Group Sessions',
                                data: group,
                                borderColor: '#60a5fa',
                                backgroundColor: 'rgba(96,165,250,0.1)',
                                fill: true,
                                tension: 0.3,
                              },
                              {
                                label: 'Competitions',
                                data: competitionPoints,
                                borderColor: '#f59e42',
                                backgroundColor: '#f59e42',
                                showLine: false,
                                pointStyle: 'star',
                                pointRadius: 8,
                                pointHoverRadius: 11,
                                type: 'line',
                                yAxisID: 'y',
                              },
                            ],
                          }}
                          options={{
                            plugins: {
                              legend: { labels: { color: '#a1a1aa' } },
                              tooltip: {
                                filter: (item) => item.dataset.label !== 'Competitions',
                              },
                            },
                            elements: { line: { borderWidth: 2 }, point: { radius: 3 } },
                            scales: { x: { ticks: { color: '#a1a1aa' } }, y: { min: 0, ticks: { color: '#a1a1aa' } } },
                            responsive: true,
                            maintainAspectRatio: false,
                          }}
                          height={350}
                        />
                      );
                    })()
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
                <div className="card-subtitle">All Sessions</div>
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
                <div className="d-flex justify-content-center">
                  {renderPagination()}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

      </Container>
    </div>
  );
}
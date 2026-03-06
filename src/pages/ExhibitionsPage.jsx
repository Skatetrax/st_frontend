import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Pagination,
} from "react-bootstrap";
import "../Dashboard.css";
import { getEvents } from "../api/api";
import Navbar from "../components/Navbar";
import dayjs from "dayjs";
import filmreelIcon from "../assets/images/filmreel.png";

export default function ExhibitionsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    getEvents("Exhibition")
      .then(setData)
      .catch(() => setError("Failed to load exhibition data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const allRows = data?.entries || [];

  const [page, setPage] = useState(1);
  const perPage = 15;
  const totalPages = Math.ceil(allRows.length / perPage);
  const paginated = allRows.slice((page - 1) * perPage, page * perPage);

  function renderPagination() {
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

  return (
    <div className="dashboard-bg">
      <Navbar onDataChange={fetchData} />
      <Container fluid className="p-4">

        {loading ? (
          <div style={{ color: "#a1a1aa", textAlign: "center", paddingTop: 80 }}>Loading...</div>
        ) : error ? (
          <div style={{ color: "red", textAlign: "center", paddingTop: 80 }}>{error}</div>
        ) : (
          <Row>
            <Col md={12}>
              <Card className="dashboard-card">
                <Card.Body>
                  <Card.Title>Exhibitions & Shows</Card.Title>
                  <div className="card-subtitle">Performances, showcases, and exhibition appearances</div>
                  {allRows.length === 0 ? (
                    <div style={{ color: "#a1a1aa", textAlign: "center", paddingTop: 60 }}>
                      No exhibition entries yet.
                    </div>
                  ) : (
                    <>
                      <Table borderless hover variant="dark" responsive className="dashboard-table align-middle mt-3">
                        <thead>
                          <tr>
                            <th style={{ width: "6rem" }}>Date</th>
                            <th>Event</th>
                            <th>Program</th>
                            <th style={{ width: "6rem" }}>Highlights</th>
                            <th>Location</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginated.map((row, idx) => (
                            <tr key={idx}>
                              <td style={{ whiteSpace: "nowrap" }}>{dayjs(row.entry_date || row.event_date).format("YYYY-MM-DD")}</td>
                              <td>{row.event_label}</td>
                              <td>{row.event_segment || "—"}</td>
                              <td>
                                <span style={{ display: "inline-flex", gap: 6 }}>
                                  {row.video_url && (
                                    <a href={row.video_url} target="_blank" rel="noopener noreferrer">
                                      <img src={filmreelIcon} alt="Video" style={{ width: 20, height: 20, opacity: 0.9 }} />
                                    </a>
                                  )}
                                </span>
                              </td>
                              <td>
                                {row.location_name ? (
                                  <>
                                    <div>{row.location_name}</div>
                                    {row.location_city && row.location_state && (
                                      <div style={{ color: "#a1a1aa", fontSize: "0.85rem" }}>
                                        {row.location_city}, {row.location_state}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <span>{row.hosting_club || "—"}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                      <div className="d-flex justify-content-center">
                        {renderPagination()}
                      </div>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

      </Container>
    </div>
  );
}

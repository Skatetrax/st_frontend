import React, { useState, useEffect } from "react";
import { Navbar, Nav, NavDropdown, Dropdown, Button, Modal, Form, Alert, Row, Col } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { getSkaterOverview, getRinks, getCoaches, addMaintenance, createEvent, addEventEntry } from "../api/api";
import { fmtTime } from "../utils/timeUtils";
import SessionForm from "./SessionForm";
import dayjs from "dayjs";
import "../Dashboard.css";

const navLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/ice_time", label: "Ice Time" },
];

export default function AppNavbar({ onDataChange }) {
  const location = useLocation();
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [totalHours, setTotalHours] = useState("");
  const [rinks, setRinks] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [maintDate, setMaintDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [maintLocation, setMaintLocation] = useState("");
  const [maintHoursOn, setMaintHoursOn] = useState("");

  const OTHER_COST_CATEGORIES = ["Practice Ice", "Admin Fee", "Coach Fee", "Taxes", "Other"];

  const [showEventModal, setShowEventModal] = useState(false);
  const [eventStep, setEventStep] = useState(1);
  const [eventError, setEventError] = useState("");
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [evtLabel, setEvtLabel] = useState("");
  const [evtDate, setEvtDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [evtLocation, setEvtLocation] = useState("");
  const [evtCoach, setEvtCoach] = useState("");
  const [evtCategory, setEvtCategory] = useState("Competition");
  // Collected entries (each has segment, status, scoring, videoUrl, entryFee)
  const [evtEntries, setEvtEntries] = useState([]);
  const [entrySegment, setEntrySegment] = useState("");
  const [entryStatus, setEntryStatus] = useState("Committed");
  const [entryScoring, setEntryScoring] = useState("");
  const [entryVideoUrl, setEntryVideoUrl] = useState("");
  const [entryFee, setEntryFee] = useState("");
  // Step 3: other costs
  const [evtOtherCosts, setEvtOtherCosts] = useState([]);
  const [costCategory, setCostCategory] = useState("Practice Ice");
  const [costAmount, setCostAmount] = useState("");

  const resetEntryFields = () => {
    setEntrySegment("");
    setEntryStatus("Committed");
    setEntryScoring("");
    setEntryVideoUrl("");
    setEntryFee("");
  };

  const resetEventWizard = () => {
    setEventStep(1);
    setEventError("");
    setEventSubmitting(false);
    setEvtLabel("");
    setEvtDate(dayjs().format("YYYY-MM-DD"));
    setEvtLocation("");
    setEvtCoach("");
    setEvtCategory("Competition");
    setEvtEntries([]);
    setEvtOtherCosts([]);
    setCostCategory("Practice Ice");
    setCostAmount("");
    resetEntryFields();
  };

  const addCurrentEntry = () => {
    if (!entrySegment.trim()) return null;
    const entry = {
      segment: entrySegment.trim(),
      status: entryStatus,
      scoring: entryScoring || null,
      videoUrl: entryVideoUrl.trim() || null,
      fee: parseFloat(entryFee) || 0,
    };
    setEvtEntries(prev => [...prev, entry]);
    resetEntryFields();
    return entry;
  };

  const submitFullEvent = async (finalEntries, finalOtherCosts) => {
    setEventSubmitting(true);
    setEventError("");
    try {
      const allCosts = [];
      for (const e of finalEntries) {
        if (e.fee > 0) allCosts.push({ category: "Competition Entry", amount: e.fee });
      }
      for (const c of finalOtherCosts) {
        allCosts.push({ category: c.category, amount: c.amount });
      }

      const res = await createEvent({
        event_label: evtLabel.trim(),
        event_date: evtDate,
        event_location: evtLocation || null,
        coach_id: evtCoach || null,
        costs: allCosts,
      });

      for (const e of finalEntries) {
        await addEventEntry(res.event_id, {
          event_segment: e.segment,
          status: e.status,
          category: evtCategory === "Exhibition" ? "Exhibition" : "Competition",
          scoring_system: e.scoring,
          video_url: e.videoUrl,
        });
      }

      setShowEventModal(false);
      resetEventWizard();
      onDataChange?.();
    } catch (err) {
      setEventError(err.message);
    } finally {
      setEventSubmitting(false);
    }
  };

  useEffect(() => {
    async function fetchNavData() {
      try {
        const [userData, rinkData, coachData] = await Promise.all([
          getSkaterOverview(),
          getRinks(),
          getCoaches().catch(() => []),
        ]);
        setFirstName(userData?.user_general?.user_first_name || "User");
        setTotalHours(fmtTime(userData?.total_ice_time));
        setRinks(rinkData || []);
        setCoaches(coachData || []);
      } catch {
        setFirstName("User");
        setTotalHours("");
      }
    }
    fetchNavData();
  }, []);

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" className="dashboard-navbar px-4">
        <Navbar.Brand as={Link} to="/dashboard">Skatetrax</Navbar.Brand>
        <Nav className="me-auto">
          {navLinks.map(link => (
            <Nav.Link
              as={Link}
              to={link.to}
              key={link.to}
              className={location.pathname === link.to ? "active" : ""}
              style={{ fontWeight: 500 }}
            >
              {link.label}
            </Nav.Link>
          ))}
          <NavDropdown
            title="Performances"
            id="performances-dropdown"
            active={location.pathname.startsWith("/performances")}
            menuVariant="dark"
          >
            <NavDropdown.Item as={Link} to="/performances/competitions">
              Competitions
            </NavDropdown.Item>
            <NavDropdown.Item as={Link} to="/performances/exhibitions">
              Exhibitions & Shows
            </NavDropdown.Item>
            <NavDropdown.Divider />
            <NavDropdown.Item as={Link} to="/performances/music">
              Music Library
            </NavDropdown.Item>
          </NavDropdown>
          <NavDropdown
            title="Equipment"
            id="equipment-dropdown"
            active={location.pathname.startsWith("/equipment")}
            menuVariant="dark"
          >
            <NavDropdown.Item as={Link} to="/equipment/maintenance">
              Blade Maintenance
            </NavDropdown.Item>
            <NavDropdown.Item as={Link} to="/equipment/configs">
              Skate Configs
            </NavDropdown.Item>
          </NavDropdown>
          <Nav.Link
            as={Link}
            to="/skater_overview"
            className={location.pathname === "/skater_overview" ? "active" : ""}
          >
            Profile
          </Nav.Link>
        </Nav>
        <div className="d-flex align-items-center">
          <Dropdown align="end" className="me-3">
            <Dropdown.Toggle
              variant="primary"
              style={{ fontWeight: 700, fontSize: "1.25rem", lineHeight: 1, padding: "0.4rem 0.75rem" }}
            >
              +
            </Dropdown.Toggle>
            <Dropdown.Menu variant="dark">
              <Dropdown.Item onClick={() => setShowSessionModal(true)}>
                Add Session
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setShowMaintenanceModal(true)}>
                Add Maintenance
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => { resetEventWizard(); setShowEventModal(true); }}>
                Add Event
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          <span className="me-2">{firstName}</span>
          <span className="user-avatar-text">{totalHours}</span>
        </div>
      </Navbar>

      {/* Add Session Modal */}
      <Modal
        show={showSessionModal}
        onHide={() => setShowSessionModal(false)}
        centered
        dialogClassName="update-time-modal"
        contentClassName="update-time-modal-content"
      >
        <Modal.Header closeButton style={{ background: '#2563eb', borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
          <Modal.Title style={{ color: '#fff', fontWeight: 700, fontSize: '2rem' }}>Add Session</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ borderRadius: '0 0 1rem 1rem', padding: '1.5rem 2rem' }}>
          <SessionForm
            variant="compact"
            onSuccess={() => {
              setShowSessionModal(false);
              onDataChange?.();
            }}
          />
        </Modal.Body>
      </Modal>

      {/* Add Event Wizard Modal */}
      <Modal
        show={showEventModal}
        onHide={() => { setShowEventModal(false); resetEventWizard(); }}
        centered
        size="lg"
      >
        <Modal.Header
          closeButton
          style={{ background: '#a78bfa', borderTopLeftRadius: '0.3rem', borderTopRightRadius: '0.3rem' }}
        >
          <Modal.Title style={{ color: '#fff', fontWeight: 700 }}>
            {eventStep === 1 ? 'Add Event' : eventStep === 2 ? 'Add Entries' : 'Additional Costs'}
          </Modal.Title>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginLeft: 12, alignSelf: 'center' }}>
            Step {eventStep} of 3
          </span>
        </Modal.Header>
        <Modal.Body>
          {eventError && <Alert variant="danger" dismissible onClose={() => setEventError("")}>{eventError}</Alert>}

          {/* ── Step 1: Event info ── */}
          {eventStep === 1 && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Event Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. 2026 Peach Open"
                  value={evtLabel}
                  onChange={e => setEvtLabel(e.target.value)}
                />
              </Form.Group>
              <Row>
                <Col sm={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={evtDate}
                      onChange={e => setEvtDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col sm={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category</Form.Label>
                    <Form.Select value={evtCategory} onChange={e => setEvtCategory(e.target.value)}>
                      <option value="Competition">Competition</option>
                      <option value="Exhibition">Exhibition / Show</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col sm={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Location</Form.Label>
                    <Form.Select value={evtLocation} onChange={e => setEvtLocation(e.target.value)}>
                      <option value="">Select a rink</option>
                      {rinks.map(r => (
                        <option key={r.rink_id} value={r.rink_id}>{r.rink_name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col sm={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Coach</Form.Label>
                    <Form.Select value={evtCoach} onChange={e => setEvtCoach(e.target.value)}>
                      <option value="">None</option>
                      {coaches.map(c => (
                        <option key={c.coach_id} value={c.coach_id}>{c.coach_Fname} {c.coach_Lname}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <div className="d-flex justify-content-end">
                <Button
                  variant="primary"
                  disabled={!evtLabel.trim() || !evtDate}
                  onClick={() => { setEventError(""); setEventStep(2); }}
                >
                  Next: Add Entries &rarr;
                </Button>
              </div>
            </Form>
          )}

          {/* ── Step 2: Entries + entry fees ── */}
          {eventStep === 2 && (
            <Form>
              <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: 12 }}>
                <strong>{evtLabel}</strong>
                {evtEntries.length === 0
                  ? ' — add segments or programs for this event.'
                  : ` — ${evtEntries.length} ${evtEntries.length === 1 ? 'entry' : 'entries'} added. Add another or continue.`}
              </p>

              {evtEntries.length > 0 && (
                <div style={{ border: '1px solid #dee2e6', borderRadius: '0.4rem', padding: '0.5rem 0.75rem', marginBottom: 12 }}>
                  {evtEntries.map((e, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
                      <span style={{ fontSize: '0.9rem' }}>
                        {e.segment}
                        {e.fee > 0 && <span style={{ color: '#6b7280', fontSize: '0.8rem' }}> — ${e.fee.toFixed(2)}</span>}
                      </span>
                      <Button
                        variant="link"
                        size="sm"
                        style={{ color: '#ef4444', padding: 0, fontSize: '0.85rem', textDecoration: 'none' }}
                        onClick={() => setEvtEntries(evtEntries.filter((_, j) => j !== i))}
                      >
                        &times;
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Segment / Program</Form.Label>
                <Form.Control
                  type="text"
                  placeholder={evtCategory === "Competition" ? "e.g. Adult Bronze Free Skate" : "e.g. Holiday Show Solo"}
                  value={entrySegment}
                  onChange={e => setEntrySegment(e.target.value)}
                />
              </Form.Group>
              <Row>
                <Col sm={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Select value={entryStatus} onChange={e => setEntryStatus(e.target.value)}>
                      <option value="Committed">Committed</option>
                      <option value="Scored">Scored</option>
                      <option value="Performed">Performed</option>
                      <option value="Withdrew">Withdrew</option>
                      <option value="Disqualified">Disqualified</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col sm={4}>
                  {evtCategory === "Competition" && (
                    <Form.Group className="mb-3">
                      <Form.Label>Scoring System</Form.Label>
                      <Form.Select value={entryScoring} onChange={e => setEntryScoring(e.target.value)}>
                        <option value="">None</option>
                        <option value="6.0">6.0</option>
                        <option value="CJS">CJS</option>
                        <option value="IJS">IJS</option>
                      </Form.Select>
                    </Form.Group>
                  )}
                </Col>
                <Col sm={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Entry Fee</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="$0.00"
                      value={entryFee}
                      onChange={e => setEntryFee(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Video URL</Form.Label>
                <Form.Control
                  type="url"
                  placeholder="https://youtu.be/..."
                  value={entryVideoUrl}
                  onChange={e => setEntryVideoUrl(e.target.value)}
                />
              </Form.Group>

              <div className="d-flex justify-content-between align-items-center">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={!entrySegment.trim()}
                  onClick={addCurrentEntry}
                >
                  + Add Entry
                </Button>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-secondary"
                    onClick={() => {
                      if (evtEntries.length === 0 && !entrySegment.trim()) {
                        setEventStep(3);
                      } else {
                        if (entrySegment.trim()) addCurrentEntry();
                        setEventStep(3);
                      }
                    }}
                  >
                    {evtEntries.length === 0 && !entrySegment.trim() ? 'Skip Entries' : 'Next: Costs \u2192'}
                  </Button>
                </div>
              </div>
              <p style={{ color: '#9ca3af', fontSize: '0.78rem', marginTop: 10, marginBottom: 0 }}>
                You can add practice ice, admin fees, and other costs on the next screen.
              </p>
            </Form>
          )}

          {/* ── Step 3: Other costs + submit ── */}
          {eventStep === 3 && (
            <Form>
              <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: 12 }}>
                <strong>{evtLabel}</strong> — add any additional costs, or submit now.
              </p>

              {/* Summary of entry fees */}
              {evtEntries.some(e => e.fee > 0) && (
                <div style={{ border: '1px solid #dee2e6', borderRadius: '0.4rem', padding: '0.5rem 0.75rem', marginBottom: 12 }}>
                  <div style={{ color: '#6b7280', fontSize: '0.78rem', fontWeight: 600, marginBottom: 4 }}>Entry Fees</div>
                  {evtEntries.filter(e => e.fee > 0).map((e, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '1px 0' }}>
                      <span>{e.segment}</span>
                      <span>${e.fee.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Other costs list */}
              {evtOtherCosts.length > 0 && (
                <div style={{ border: '1px solid #dee2e6', borderRadius: '0.4rem', padding: '0.5rem 0.75rem', marginBottom: 12 }}>
                  <div style={{ color: '#6b7280', fontSize: '0.78rem', fontWeight: 600, marginBottom: 4 }}>Other Costs</div>
                  {evtOtherCosts.map((c, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1px 0' }}>
                      <span style={{ fontSize: '0.9rem' }}>{c.category}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}>
                        ${c.amount.toFixed(2)}
                        <Button
                          variant="link"
                          size="sm"
                          style={{ color: '#ef4444', padding: 0, fontSize: '0.85rem', textDecoration: 'none' }}
                          onClick={() => setEvtOtherCosts(evtOtherCosts.filter((_, j) => j !== i))}
                        >
                          &times;
                        </Button>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Running total */}
              {(evtEntries.some(e => e.fee > 0) || evtOtherCosts.length > 0) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: 12, fontSize: '0.95rem' }}>
                  <span>Total</span>
                  <span>
                    ${(
                      evtEntries.reduce((s, e) => s + e.fee, 0) +
                      evtOtherCosts.reduce((s, c) => s + c.amount, 0)
                    ).toFixed(2)}
                  </span>
                </div>
              )}

              {/* Add a cost row */}
              <Row className="g-2 align-items-end mb-3">
                <Col>
                  <Form.Label style={{ fontSize: '0.85rem' }}>Category</Form.Label>
                  <Form.Select size="sm" value={costCategory} onChange={e => setCostCategory(e.target.value)}>
                    {OTHER_COST_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col xs="auto" style={{ width: 130 }}>
                  <Form.Label style={{ fontSize: '0.85rem' }}>Amount</Form.Label>
                  <Form.Control
                    size="sm"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="$0.00"
                    value={costAmount}
                    onChange={e => setCostAmount(e.target.value)}
                  />
                </Col>
                <Col xs="auto">
                  <Button
                    size="sm"
                    variant="outline-primary"
                    disabled={!costAmount || parseFloat(costAmount) <= 0}
                    onClick={() => {
                      setEvtOtherCosts([...evtOtherCosts, { category: costCategory, amount: parseFloat(costAmount) }]);
                      setCostAmount("");
                    }}
                  >
                    Add
                  </Button>
                </Col>
              </Row>

              <hr />
              <div className="d-flex justify-content-between">
                <Button variant="outline-secondary" onClick={() => setEventStep(2)}>
                  &larr; Back
                </Button>
                <Button
                  variant="primary"
                  disabled={eventSubmitting}
                  onClick={() => submitFullEvent(evtEntries, evtOtherCosts)}
                >
                  {eventSubmitting ? 'Saving…' : 'Submit Event'}
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>

      {/* Add Maintenance Modal */}
      <Modal show={showMaintenanceModal} onHide={() => setShowMaintenanceModal(false)} centered>
        <Modal.Header
          closeButton
          style={{ background: '#22c55e', borderTopLeftRadius: '0.3rem', borderTopRightRadius: '0.3rem' }}
        >
          <Modal.Title style={{ color: '#fff', fontWeight: 700 }}>Add Maintenance</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="maintDate">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={maintDate}
                onChange={e => setMaintDate(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="maintLocation">
              <Form.Label>Location</Form.Label>
              <Form.Select
                value={maintLocation}
                onChange={e => setMaintLocation(e.target.value)}
              >
                <option value="">Select a shop / rink</option>
                {rinks.map(r => (
                  <option key={r.rink_id} value={r.rink_id}>
                    {r.rink_name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3" controlId="maintHoursOn">
              <Form.Label>Hours On</Form.Label>
              <Form.Control
                type="number"
                min="0"
                step="0.25"
                placeholder="Hours since last sharpening"
                value={maintHoursOn}
                onChange={e => setMaintHoursOn(e.target.value)}
              />
            </Form.Group>
            <Button
              variant="success"
              type="submit"
              onClick={e => {
                e.preventDefault();
                addMaintenance({
                  m_date: maintDate,
                  m_location: maintLocation || null,
                  m_hours_on: parseFloat(maintHoursOn) || 0,
                })
                  .then(() => {
                    setShowMaintenanceModal(false);
                    setMaintDate(dayjs().format("YYYY-MM-DD"));
                    setMaintLocation("");
                    setMaintHoursOn("");
                    onDataChange?.();
                  })
                  .catch(err => alert(`Maintenance save failed: ${err.message}`));
              }}
            >
              Submit
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}

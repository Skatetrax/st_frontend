import React, { useState, useRef } from "react";
import { Navbar, Nav, NavDropdown, Button, Modal, Form } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { getRinks, getSkaterOverview, getCoaches, getIceTypes, submitIceTime } from "../api/api";
import { fmtTime } from "../utils/timeUtils";
import dayjs from "dayjs";
import "../Dashboard.css";
import { useEffect } from "react";

const navLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/ice_time", label: "Ice Time" },
];

export default function AppNavbar({ activePage, onDataChange }) {
  const location = useLocation();
  const [showUpdateTime, setShowUpdateTime] = useState(false);
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  // State for rinks and user
  const [rinks, setRinks] = useState([]);
  const [preferredRink, setPreferredRink] = useState("");
  const [rinksLoading, setRinksLoading] = useState(false);
  const [rinksError, setRinksError] = useState(null);
  // State for coaches
  const [coaches, setCoaches] = useState([]);
  const [preferredCoach, setPreferredCoach] = useState("");
  const [coachRate, setCoachRate] = useState("");
  const [coachesLoading, setCoachesLoading] = useState(false);
  const [coachesError, setCoachesError] = useState(null);
  // State for ice types
  const [iceTypes, setIceTypes] = useState([]);
  const [iceTypesLoading, setIceTypesLoading] = useState(false);
  const [iceTypesError, setIceTypesError] = useState(null);
  const [selectedIceType, setSelectedIceType] = useState("");
  // State for form fields
  const [iceTime, setIceTime] = useState("");
  const [iceCost, setIceCost] = useState("");
  const [coachMinutes, setCoachMinutes] = useState("");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const submittingRef = useRef(false);
  // State for navbar user info
  const [firstName, setFirstName] = useState("");
  const [totalHours, setTotalHours] = useState("");

  // Fetch user first name and total hours on mount
  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const userData = await getSkaterOverview();
        setFirstName(userData?.user_general?.user_first_name || "User");
        setTotalHours(fmtTime(userData?.total_ice_time));
      } catch (err) {
        setFirstName("User");
        setTotalHours("");
      }
    }
    fetchUserInfo();
  }, []);

  // Reset form fields when modal opens
  const handleShowUpdateTime = async () => {
    setShowUpdateTime(true);
    setRinksLoading(true);
    setCoachesLoading(true);
    setIceTypesLoading(true);
    setRinksError(null);
    setCoachesError(null);
    setIceTypesError(null);
    let userData = null;
    try {
      userData = await getSkaterOverview();
    } catch (err) {
      console.error("Failed to load user data", err);
    }

    try {
      const rinksData = await getRinks();
      setRinks(Array.isArray(rinksData) ? rinksData : []);
      setPreferredRink(userData?.user_meta?.user_preferred_rink_id || "");
    } catch (err) {
      console.error("Rinks error:", err);
      setRinksError(`Rinks: ${err.message}`);
    } finally {
      setRinksLoading(false);
    }

    try {
      const coachesData = await getCoaches();
      const coachesList = Array.isArray(coachesData) ? coachesData : [];
      setCoaches(coachesList);
      const coachId = userData?.user_meta?.user_primary_coach_id || "";
      setPreferredCoach(coachId);
      const foundCoach = coachesList.find(c => c.coach_id === coachId);
      setCoachRate(foundCoach ? foundCoach.coach_rate : "");
    } catch (err) {
      console.error("Coaches error:", err);
      setCoachesError(`Coaches: ${err.message}`);
    } finally {
      setCoachesLoading(false);
    }

    try {
      const iceTypesData = await getIceTypes();
      const typesList = Array.isArray(iceTypesData) ? iceTypesData : [];
      setIceTypes(typesList);
      setSelectedIceType(typesList[0]?.ice_type_id || "");
    } catch (err) {
      console.error("Ice types error:", err);
      setIceTypesError(`Ice types: ${err.message}`);
    } finally {
      setIceTypesLoading(false);
    }

    setIceTime("");
    setIceCost("");
    setCoachMinutes("");
    setDate(dayjs().format("YYYY-MM-DD"));
  };

  // When coach changes, update the rate field
  const handleCoachChange = (e) => {
    const selectedCoachId = e.target.value;
    setPreferredCoach(selectedCoachId);
    const foundCoach = coaches.find(c => c.coach_id === selectedCoachId);
    setCoachRate(foundCoach ? foundCoach.coach_rate : "");
  };

  // Submit handler for Update Time modal
  const handleUpdateTimeSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitLoading(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    const payload = {
      date,
      ice_time: Number(iceTime),
      ice_cost: Number(iceCost),
      coach_time: Number(coachMinutes),
      coach_cost: Number(coachRate),
      skate_type: selectedIceType,
      rink_id: preferredRink,
      coach_id: preferredCoach,
    };
    try {
      await submitIceTime(payload);
      setSubmitSuccess(true);
      setShowUpdateTime(false);
      if (onDataChange) onDataChange();
    } catch (err) {
      setSubmitError(err.message || "Failed to submit session. Please try again.");
    } finally {
      submittingRef.current = false;
      setSubmitLoading(false);
    }
  };

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
          <Button
            variant="primary"
            className="me-2"
            style={{ fontWeight: 600, letterSpacing: 0.5, boxShadow: '0 2px 8px rgba(167,139,250,0.15)' }}
            onClick={handleShowUpdateTime}
          >
            Update Time
          </Button>
          <Button
            variant="success"
            className="me-3"
            style={{ fontWeight: 600, letterSpacing: 0.5, boxShadow: '0 2px 8px rgba(52,211,153,0.15)' }}
            onClick={() => setShowAddMaintenance(true)}
          >
            Add Maintenance
          </Button>
          <span className="me-2">{firstName}</span>
          <span className="user-avatar-text">{totalHours}</span>
        </div>
      </Navbar>

      {/* Update Time Modal */}
      <Modal show={showUpdateTime} onHide={() => setShowUpdateTime(false)} centered dialogClassName="update-time-modal" contentClassName="update-time-modal-content">
        <Modal.Header closeButton style={{ background: '#38b000', borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
          <Modal.Title style={{ color: '#fff', fontWeight: 700, fontSize: '2rem' }}>Add Session Time</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ borderRadius: '0 0 1rem 1rem', padding: '1.5rem 2rem' }}>
          {rinksLoading || coachesLoading || iceTypesLoading ? (
            <div style={{ color: '#a1a1aa', textAlign: 'center' }}>Loading rinks, coaches, and ice types...</div>
          ) : rinksError || coachesError || iceTypesError ? (
            <div style={{ color: 'red', textAlign: 'center' }}>{rinksError || coachesError || iceTypesError}</div>
          ) : (
            <Form onSubmit={handleUpdateTimeSubmit}>
              <div className="row mb-3">
                <div className="col-md-3 mb-2">
                  <Form.Label>Date</Form.Label>
                  <Form.Control type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div className="col-md-3 mb-2">
                  <Form.Label>Ice Time</Form.Label>
                  <Form.Control type="number" value={iceTime} onChange={e => setIceTime(e.target.value)} placeholder="Minutes" />
                </div>
                <div className="col-md-3 mb-2">
                  <Form.Label>Ice Cost</Form.Label>
                  <Form.Control type="number" value={iceCost} onChange={e => setIceCost(e.target.value)} placeholder="$" />
                </div>
                <div className="col-md-3 mb-2">
                  <Form.Label>Coach Time (minutes)</Form.Label>
                  <Form.Control type="number" value={coachMinutes} onChange={e => setCoachMinutes(e.target.value)} placeholder="Minutes" />
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-4 mb-2">
                  <Form.Label>Coach Cost</Form.Label>
                  <Form.Control type="number" value={coachRate} onChange={e => setCoachRate(e.target.value)} placeholder="$" />
                </div>
                <div className="col-md-4 mb-2">
                  <Form.Label>Skate Type</Form.Label>
                  <Form.Select value={selectedIceType} onChange={e => setSelectedIceType(e.target.value)}>
                    {iceTypes.map(type => (
                      <option value={type.ice_type_id} key={type.ice_type_id}>
                        {type.ice_type}
                      </option>
                    ))}
                  </Form.Select>
                </div>
                <div className="col-md-4 mb-2">
                  <Form.Label>Rink Location</Form.Label>
                  <Form.Select value={preferredRink} onChange={e => setPreferredRink(e.target.value)}>
                    {rinks.map(rink => (
                      <option value={rink.rink_id} key={rink.rink_id}>
                        {rink.rink_name}
                      </option>
                    ))}
                  </Form.Select>
                </div>
                <div className="col-md-4 mb-2">
                  <Form.Label>Coach</Form.Label>
                  <Form.Select value={preferredCoach} onChange={handleCoachChange}>
                    {coaches.map(coach => (
                      <option value={coach.coach_id} key={coach.coach_id}>
                        {coach.coach_Fname} {coach.coach_Lname}
                      </option>
                    ))}
                  </Form.Select>
                </div>
              </div>
              <div className="d-flex justify-content-end">
                <Button variant="primary" type="submit" style={{ borderRadius: '0.5rem', fontWeight: 600, fontSize: '1.1rem', padding: '0.5rem 2.5rem' }} disabled={submitLoading}>
                  {submitLoading ? "Submitting..." : "Add Time"}
                </Button>
              </div>
              {submitError && <div style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>{submitError}</div>}
              {submitSuccess && <div style={{ color: '#22c55e', marginTop: '1rem', textAlign: 'center', fontWeight: 600 }}>Submitted!</div>}
            </Form>
          )}
        </Modal.Body>
      </Modal>

      {/* Add Maintenance Modal */}
      <Modal show={showAddMaintenance} onHide={() => setShowAddMaintenance(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Maintenance</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="formType">
              <Form.Label>Maintenance Type</Form.Label>
              <Form.Control type="text" placeholder="e.g. Blade Sharpening" />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formDate2">
              <Form.Label>Date</Form.Label>
              <Form.Control type="date" />
            </Form.Group>
            <Button variant="success" type="submit" onClick={e => { e.preventDefault(); setShowAddMaintenance(false); if (onDataChange) onDataChange(); }}>
              Submit
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}

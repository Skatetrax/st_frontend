import React, { useState, useEffect, useRef } from "react";
import { Form, Button, Spinner, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { getRinks, getSkaterOverview, getCoaches, getIceTypes, submitIceTime } from "../api/api";
import dayjs from "dayjs";
import "./AddSessionPage.css";

const STORAGE_KEY = "skatetrax_add_session_draft";

function saveDraft(fields) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fields)); } catch {}
}

function loadDraft() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearDraft() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
}

export default function AddSessionPage() {
  const navigate = useNavigate();
  const draft = useRef(loadDraft());

  const [rinks, setRinks] = useState([]);
  const [preferredRink, setPreferredRink] = useState("");
  const [coaches, setCoaches] = useState([]);
  const [preferredCoach, setPreferredCoach] = useState("");
  const [coachRate, setCoachRate] = useState("");
  const [iceTypes, setIceTypes] = useState([]);
  const [selectedIceType, setSelectedIceType] = useState("");

  const [date, setDate] = useState(draft.current?.date || dayjs().format("YYYY-MM-DD"));
  const [iceTime, setIceTime] = useState(draft.current?.iceTime || "");
  const [iceCost, setIceCost] = useState(draft.current?.iceCost || "");
  const [coachMinutes, setCoachMinutes] = useState(draft.current?.coachMinutes || "");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [restoredDraft, setRestoredDraft] = useState(!!draft.current);
  const submittingRef = useRef(false);

  useEffect(() => {
    async function loadFormData() {
      setLoading(true);
      setLoadError(null);
      try {
        const [userData, rinksData, coachesData, iceTypesData] = await Promise.all([
          getSkaterOverview(),
          getRinks(),
          getCoaches(),
          getIceTypes(),
        ]);

        const rinksList = Array.isArray(rinksData) ? rinksData : [];
        setRinks(rinksList);

        const coachesList = Array.isArray(coachesData) ? coachesData : [];
        setCoaches(coachesList);

        const typesList = Array.isArray(iceTypesData) ? iceTypesData : [];
        setIceTypes(typesList);

        const d = draft.current;
        if (d) {
          setPreferredRink(d.preferredRink || rinksList[0]?.rink_id || "");
          setPreferredCoach(d.preferredCoach || "");
          setCoachRate(d.coachRate || "");
          setSelectedIceType(d.selectedIceType || typesList[0]?.ice_type_id || "");
          clearDraft();
        } else {
          setPreferredRink(userData?.user_meta?.user_preferred_rink_id || rinksList[0]?.rink_id || "");
          const coachId = userData?.user_meta?.user_primary_coach_id || "";
          setPreferredCoach(coachId);
          const foundCoach = coachesList.find(c => c.coach_id === coachId);
          setCoachRate(foundCoach ? foundCoach.coach_rate : "");
          setSelectedIceType(typesList[0]?.ice_type_id || "");
        }
      } catch (err) {
        if (err.message && err.message.includes("401")) {
          navigate("/login", { state: { from: "/add-session" }, replace: true });
          return;
        }
        setLoadError(err.message || "Failed to load form data.");
      } finally {
        setLoading(false);
      }
    }
    loadFormData();
  }, [navigate]);

  const handleCoachChange = (e) => {
    const id = e.target.value;
    setPreferredCoach(id);
    const found = coaches.find(c => c.coach_id === id);
    setCoachRate(found ? found.coach_rate : "");
  };

  const resetForm = () => {
    setDate(dayjs().format("YYYY-MM-DD"));
    setIceTime("");
    setIceCost("");
    setCoachMinutes("");
    setCoachRate("");
    setSubmitSuccess(false);
    setSubmitError(null);
    setRestoredDraft(false);
    clearDraft();
  };

  const handleSubmit = async (e) => {
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
      clearDraft();
      setSubmitSuccess(true);
    } catch (err) {
      if (err.message && err.message.includes("401")) {
        saveDraft({ date, iceTime, iceCost, coachMinutes, coachRate, selectedIceType, preferredRink, preferredCoach });
        navigate("/login", { state: { from: "/add-session" }, replace: true });
        return;
      }
      setSubmitError(err.message || "Failed to submit session.");
    } finally {
      submittingRef.current = false;
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="add-session-page">
        <div className="add-session-loading">
          <Spinner animation="border" variant="success" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="add-session-page">
        <Alert variant="danger" className="m-3">{loadError}</Alert>
        <div className="text-center">
          <Button variant="outline-secondary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="add-session-page">
        <div className="add-session-card">
          <div className="add-session-success">
            <div className="success-check">&#10003;</div>
            <h2>Session Added</h2>
            <p>Your ice time has been recorded.</p>
            <div className="success-actions">
              <Button variant="success" size="lg" className="w-100 mb-2" onClick={resetForm}>
                Add Another
              </Button>
              <Link to="/dashboard" className="btn btn-outline-secondary w-100">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="add-session-page">
      <div className="add-session-card">
        <div className="add-session-header">
          <h1>Add Session</h1>
        </div>

        <Form onSubmit={handleSubmit} className="add-session-form">
          {restoredDraft && (
            <Alert variant="info" className="mb-3" dismissible onClose={() => setRestoredDraft(false)}>
              Your previous entry was restored.
            </Alert>
          )}
          <Form.Group className="mb-3">
            <Form.Label>Date</Form.Label>
            <Form.Control
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="form-control-lg"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Ice Time (minutes)</Form.Label>
            <Form.Control
              type="number"
              inputMode="numeric"
              value={iceTime}
              onChange={e => setIceTime(e.target.value)}
              placeholder="0"
              className="form-control-lg"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Ice Cost ($)</Form.Label>
            <Form.Control
              type="number"
              inputMode="decimal"
              value={iceCost}
              onChange={e => setIceCost(e.target.value)}
              placeholder="0.00"
              className="form-control-lg"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Coach Time (minutes)</Form.Label>
            <Form.Control
              type="number"
              inputMode="numeric"
              value={coachMinutes}
              onChange={e => setCoachMinutes(e.target.value)}
              placeholder="0"
              className="form-control-lg"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Coach Cost ($)</Form.Label>
            <Form.Control
              type="number"
              inputMode="decimal"
              value={coachRate}
              onChange={e => setCoachRate(e.target.value)}
              placeholder="0.00"
              className="form-control-lg"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Skate Type</Form.Label>
            <Form.Select
              value={selectedIceType}
              onChange={e => setSelectedIceType(e.target.value)}
              className="form-select-lg"
            >
              {iceTypes.map(type => (
                <option value={type.ice_type_id} key={type.ice_type_id}>
                  {type.ice_type}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Rink</Form.Label>
            <Form.Select
              value={preferredRink}
              onChange={e => setPreferredRink(e.target.value)}
              className="form-select-lg"
            >
              {rinks.map(rink => (
                <option value={rink.rink_id} key={rink.rink_id}>
                  {rink.rink_name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Coach</Form.Label>
            <Form.Select
              value={preferredCoach}
              onChange={handleCoachChange}
              className="form-select-lg"
            >
              {coaches.map(coach => (
                <option value={coach.coach_id} key={coach.coach_id}>
                  {coach.coach_Fname} {coach.coach_Lname}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {submitError && (
            <Alert variant="danger" className="mb-3">{submitError}</Alert>
          )}

          <Button
            variant="success"
            type="submit"
            size="lg"
            className="w-100 add-session-submit"
            disabled={submitLoading}
          >
            {submitLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Submitting...
              </>
            ) : (
              "Add Session"
            )}
          </Button>

          <Link to="/dashboard" className="btn btn-link w-100 mt-2 text-muted">
            Cancel
          </Link>
        </Form>
      </div>
    </div>
  );
}

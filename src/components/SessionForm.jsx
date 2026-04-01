import React, { useState, useEffect, useRef } from "react";
import { Form, Button, Spinner, Alert } from "react-bootstrap";
import { getRinks, getSkaterOverview, getCoaches, getIceTypes, submitIceTime } from "../api/api";
import dayjs from "dayjs";

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

/**
 * Reusable session entry form.
 *
 * Props:
 *   variant    - "compact" (modal grid layout) or "full" (standalone stacked layout)
 *   onSuccess  - called after a successful submission
 *   onAuthError - called when a 401 is encountered (standalone page can redirect)
 */
export default function SessionForm({ variant = "full", onSuccess, onAuthError }) {
  const compact = variant === "compact";
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
  const [restoredDraft, setRestoredDraft] = useState(!!draft.current);
  const submittingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
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
        if (cancelled) return;

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
        if (cancelled) return;
        if (err.message && err.message.includes("401")) {
          onAuthError?.();
          return;
        }
        setLoadError(err.message || "Failed to load form data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadFormData();
    return () => { cancelled = true; };
  }, [onAuthError]);

  const handleCoachChange = (e) => {
    const id = e.target.value;
    setPreferredCoach(id);
    const found = coaches.find(c => c.coach_id === id);
    setCoachRate(found ? found.coach_rate : "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitLoading(true);
    setSubmitError(null);

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
      onSuccess?.();
    } catch (err) {
      if (err.message && err.message.includes("401")) {
        saveDraft({ date, iceTime, iceCost, coachMinutes, coachRate, selectedIceType, preferredRink, preferredCoach });
        onAuthError?.();
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
      <div style={{ textAlign: "center", padding: compact ? "1.5rem" : "4rem 1rem", color: "#94a3b8" }}>
        <Spinner animation="border" variant="success" />
        <div style={{ marginTop: "0.75rem" }}>Loading...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ padding: "1rem" }}>
        <Alert variant="danger">{loadError}</Alert>
        <div className="text-center">
          <Button variant="outline-secondary" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const ctrlClass = compact ? "" : "form-control-lg";
  const selClass = compact ? "" : "form-select-lg";

  if (compact) {
    return (
      <Form onSubmit={handleSubmit}>
        {restoredDraft && (
          <Alert variant="info" className="mb-3" dismissible onClose={() => setRestoredDraft(false)}>
            Your previous entry was restored.
          </Alert>
        )}
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
                <option value={type.ice_type_id} key={type.ice_type_id}>{type.ice_type}</option>
              ))}
            </Form.Select>
          </div>
          <div className="col-md-4 mb-2">
            <Form.Label>Rink Location</Form.Label>
            <Form.Select value={preferredRink} onChange={e => setPreferredRink(e.target.value)}>
              {rinks.map(rink => (
                <option value={rink.rink_id} key={rink.rink_id}>{rink.rink_name}</option>
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
          <Button
            variant="primary"
            type="submit"
            style={{ borderRadius: '0.5rem', fontWeight: 600, fontSize: '1.1rem', padding: '0.5rem 2.5rem' }}
            disabled={submitLoading}
          >
            {submitLoading ? "Submitting..." : "Add Time"}
          </Button>
        </div>
        {submitError && <div style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>{submitError}</div>}
      </Form>
    );
  }

  return (
    <Form onSubmit={handleSubmit} className="add-session-form">
      {restoredDraft && (
        <Alert variant="info" className="mb-3" dismissible onClose={() => setRestoredDraft(false)}>
          Your previous entry was restored.
        </Alert>
      )}
      <Form.Group className="mb-3">
        <Form.Label>Date</Form.Label>
        <Form.Control type="date" value={date} onChange={e => setDate(e.target.value)} className={ctrlClass} />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Ice Time (minutes)</Form.Label>
        <Form.Control type="number" inputMode="numeric" value={iceTime} onChange={e => setIceTime(e.target.value)} placeholder="0" className={ctrlClass} />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Ice Cost ($)</Form.Label>
        <Form.Control type="number" inputMode="decimal" value={iceCost} onChange={e => setIceCost(e.target.value)} placeholder="0.00" className={ctrlClass} />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Coach Time (minutes)</Form.Label>
        <Form.Control type="number" inputMode="numeric" value={coachMinutes} onChange={e => setCoachMinutes(e.target.value)} placeholder="0" className={ctrlClass} />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Coach Cost ($)</Form.Label>
        <Form.Control type="number" inputMode="decimal" value={coachRate} onChange={e => setCoachRate(e.target.value)} placeholder="0.00" className={ctrlClass} />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Skate Type</Form.Label>
        <Form.Select value={selectedIceType} onChange={e => setSelectedIceType(e.target.value)} className={selClass}>
          {iceTypes.map(type => (
            <option value={type.ice_type_id} key={type.ice_type_id}>{type.ice_type}</option>
          ))}
        </Form.Select>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Rink</Form.Label>
        <Form.Select value={preferredRink} onChange={e => setPreferredRink(e.target.value)} className={selClass}>
          {rinks.map(rink => (
            <option value={rink.rink_id} key={rink.rink_id}>{rink.rink_name}</option>
          ))}
        </Form.Select>
      </Form.Group>
      <Form.Group className="mb-4">
        <Form.Label>Coach</Form.Label>
        <Form.Select value={preferredCoach} onChange={handleCoachChange} className={selClass}>
          {coaches.map(coach => (
            <option value={coach.coach_id} key={coach.coach_id}>
              {coach.coach_Fname} {coach.coach_Lname}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
      {submitError && <Alert variant="danger" className="mb-3">{submitError}</Alert>}
      <Button
        variant="success"
        type="submit"
        size="lg"
        className="w-100 add-session-submit"
        disabled={submitLoading}
      >
        {submitLoading ? (
          <><Spinner animation="border" size="sm" className="me-2" />Submitting...</>
        ) : (
          "Add Session"
        )}
      </Button>
    </Form>
  );
}

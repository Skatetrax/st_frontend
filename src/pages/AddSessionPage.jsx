import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import SessionForm from "../components/SessionForm";
import "./AddSessionPage.css";

export default function AddSessionPage() {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);

  if (success) {
    return (
      <div className="add-session-page">
        <div className="add-session-card">
          <div className="add-session-success">
            <div className="success-check">&#10003;</div>
            <h2>Session Added</h2>
            <p>Your ice time has been recorded.</p>
            <div className="success-actions">
              <Button variant="success" size="lg" className="w-100 mb-2" onClick={() => setSuccess(false)}>
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
        <SessionForm
          variant="full"
          onSuccess={() => setSuccess(true)}
          onAuthError={() => navigate("/login", { state: { from: "/add-session" }, replace: true })}
        />
        <div style={{ padding: "0 1.5rem 1.5rem" }}>
          <Link to="/dashboard" className="btn btn-link w-100 text-muted">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}

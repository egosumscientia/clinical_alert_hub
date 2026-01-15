import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchPatient } from "../services/clinical.js";

export default function PatientDetail() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchPatient(id)
      .then((response) => {
        if (active) {
          setPatient(response);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Failed to load patient");
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (error) {
    return <div className="panel">{error}</div>;
  }

  if (!patient) {
    return <div className="panel">Loading patient...</div>;
  }

  return (
    <div className="panel">
      <div className="panel-title">Patient Detail</div>
      <div className="detail-grid">
        <div>
          <div className="detail-label">External Ref</div>
          <div className="detail-value">{patient.external_ref}</div>
        </div>
        <div>
          <div className="detail-label">Status</div>
          <div className={`detail-value status-pill ${patient.current_status}`}>
            {patient.current_status}
          </div>
        </div>
        <div>
          <div className="detail-label">Hospital</div>
          <div className="detail-value">{patient.hospital_id}</div>
        </div>
        <div>
          <div className="detail-label">Created</div>
          <div className="detail-value">{new Date(patient.created_at).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

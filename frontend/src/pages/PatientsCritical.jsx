import React, { useEffect, useState } from "react";
import PatientsTable from "../components/PatientsTable.jsx";
import { fetchCriticalPatients } from "../services/clinical.js";

export default function PatientsCritical() {
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchCriticalPatients()
      .then((response) => {
        if (active) {
          setPatients(response);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Failed to load patients");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return <div className="panel">{error}</div>;
  }

  return (
    <div className="panel">
      <div className="panel-title">Critical Patients</div>
      <PatientsTable patients={patients} />
    </div>
  );
}

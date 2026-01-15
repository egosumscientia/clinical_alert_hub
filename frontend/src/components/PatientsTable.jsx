import React from "react";
import { Link } from "react-router-dom";

export default function PatientsTable({ patients }) {
  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>External Ref</th>
            <th>Status</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr key={patient.patient_id}>
              <td>{patient.external_ref}</td>
              <td>
                <span className={`status-pill ${patient.current_status}`}>
                  {patient.current_status}
                </span>
              </td>
              <td>{new Date(patient.created_at).toLocaleString()}</td>
              <td>
                <Link className="link" to={`/patients/${patient.patient_id}`}>
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

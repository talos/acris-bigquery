SELECT * FROM acris.SCHEMA_master m
  LEFT JOIN EACH acris.SCHEMA_legals l ON l.document_id=m.document_id
  LEFT JOIN EACH acris.SCHEMA_parties p ON m.document_id=p.document_id
  LEFT JOIN EACH acris.SCHEMA_references r ON m.document_id=r.document_id
  LEFT JOIN acris.code_

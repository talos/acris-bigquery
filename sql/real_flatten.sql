SELECT
  /* Master columns */
  m.a_document_id document_id, m.a_crfn crfn, m.a_borough as recorded_borough,
  m.a_doc_type doc_type, dc.Doc_type_description doc_type_description,
  m.a_doc_date doc_date, m.a_doc_amount doc_amount,
  m.a_recorded_filed recorded_filed, m.a_modified_date modified_date,
  m.a_reel_year reel_year, m.a_reel_nbr reel_nbr, m.a_reel_pg reel_pg,
  m.a_percent_transferred percent_transferred,
  m.a_good_through_date good_through_date,

  /* Legals columns */
  l.a_borough borough, l.a_block block, l.a_lot lot, l.a_easement easement,
  l.a_partial_lot partial_lot, l.a_air_rights air_rights,
  l.a_subterranean_rights subterranean_rights, l.a_property_type property_type,
  pt.Description AS property_type_description, l.a_street_number street_number,
  l.a_street_name street_name, l.a_unit unit,

  /* Parties columns */
  p.a_party_type party_type,
  CASE WHEN p.a_party_type = 1 THEN dc.Party1_type
       WHEN p.a_party_type = 2 THEN dc.Party2_type
       WHEN p.a_party_type = 3 THEN dc.Party3_type
       ELSE '' END as party_type_string,
  p.a_name name, p.a_address_1 address_1, p.a_address_2 address_2,
  p.a_country country, p.a_city city, p.a_state state, p.a_zip zip

  /* References columns */
  r.a_reference_by_crfn reference_by_crfn,
  r.a_reference_by_doc_id reference_by_doc_id,
  r.a_reference_by_reel_year reference_by_reel_year,
  r.a_reference_by_reel_borough reference_by_reel_borough,
  r.a_reference_by_reel_nbr reference_by_reel_nbr,
  r.a_reference_by_reel_page refrence_by_reel_page,

  /* Pluto */
  pl.*

FROM acris.latest_real_master m
  LEFT JOIN EACH acris.latest_real_legals l ON l.a_document_id=m.a_document_id
  LEFT JOIN EACH acris.latest_real_parties p ON m.a_document_id=p.a_document_id
  LEFT JOIN EACH acris.latest_real_references r ON m.a_document_id=r.a_document_id
  LEFT JOIN acris.code_document_control dc ON m.a_Doc_type=dc.Doc_type
  LEFT JOIN acris.code_property_types pt ON l.a_property_type=pt.property_type
  LEFT JOIN EACH acris.pluto pl ON
    l.a_Borough = pl.BoroCode AND l.a_block = pl.Block AND l.a_lot = pl.LOT

SELECT a.* FROM acris.TABLE a
JOIN EACH
  (SELECT document_id, max(good_through_date) as latest_good_through_date
      FROM acris.TABLE GROUP EACH BY document_id) b
ON a.document_id = b.document_id AND a.good_through_date = b.latest_good_through_date

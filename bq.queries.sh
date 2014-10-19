bq query --format csv "SELECT * FROM [personal-real-estate:acris.real_flat] where street_name like 'VAN BUREN%' and street_number='60' order by doc_date desc"

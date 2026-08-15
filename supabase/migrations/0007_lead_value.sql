-- Voegt een handmatig instelbare gemiddelde leadwaarde per site toe, voor de
-- "Waarde"-tab op de site-detailpagina (potentiële omzetschatting).
-- Nullable, geen default: null betekent expliciet "nog niet ingesteld", te
-- onderscheiden van 0 (een geldige, zij het onwaarschijnlijke, waarde).
alter table sites add column lead_value_eur numeric(10,2);

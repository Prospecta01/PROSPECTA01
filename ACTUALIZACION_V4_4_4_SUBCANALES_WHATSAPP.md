# PROSPECTA | RTM v4.4.4

## Cambios
- Prospector: Subcanal incorpora **Boticas** y **Gimnasios**.
- Validador: nueva columna **¿Envío WhatsApp?** con check persistente.
- KPI **Códigos Listos** = registros con ¿Geolocalizado? marcado.
- KPI **Mensaje WhatsApp** = registros con ¿Envío WhatsApp? marcado.
- Exportación Excel incorpora ¿Envío WhatsApp?.

## Actualización
1. Ejecutar `supabase/20_v4_4_4_subcanales_whatsapp.sql`.
2. Conservar/copiar `.env`.
3. `npm.cmd install`
4. `npm.cmd run build`
5. `netlify.cmd link`
6. `netlify.cmd deploy --build --prod`

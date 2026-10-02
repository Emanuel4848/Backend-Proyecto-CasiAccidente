# Comprobaciones de seguridad en staging

Uso interno exclusivamente contra localhost o un staging propio, aislado y autorizado. Nunca usar contra producción, Supabase compartido ni sistemas ajenos. El script hace intentos repetidos y debe usarse con usuarios/datos descartables.

## Variables y ejecución

- `BASE_URL`: host local/staging.
- `ADMIN_TOKEN`, `PRL_TOKEN`: JWT de cuentas descartables con esos roles.
- `CASE_OWN_ID`, `CASE_OTHER_ID`: casos de brigadas distintas, creados para la prueba.
- `BAD_LOGIN_EMAIL`, `BAD_LOGIN_PASSWORD`: credenciales descartables inválidas.
- `EXPIRED_TOKEN`: JWT firmado correctamente pero expirado.

```sh
BASE_URL=http://localhost:3000 ADMIN_TOKEN=... PRL_TOKEN=... CASE_OWN_ID=1 CASE_OTHER_ID=2 BAD_LOGIN_EMAIL=invalid@test.local BAD_LOGIN_PASSWORD=wrong EXPIRED_TOKEN=... node security-test/checks.js
```

Comprueba límites de login, 401 sin token/token vencido/manipulado, 403 en rutas administrativas, IDOR de lectura/escritura y aceptación de cargas con extensión falsificada. También busca usos de `[innerHTML]` y `bypassSecurityTrustHtml` en el frontend. Los campos libres se mandan como texto para comprobar que Prisma no interpreta SQL.

# Prueba de carga (k6)

Herramienta manual para un ambiente local o staging controlado. No ejecutar contra producción ni contra datos compartidos sin aprobación expresa del equipo.

## Requisitos

- Instalar k6: https://grafana.com/docs/k6/latest/set-up/install-k6/
- Preparar usuarios descartables de prueba y, si se ejecuta creación, una brigada válida.
- Variables: `BASE_URL`, `LOGIN_USERS` (JSON array de `{correo,password}`), `CASE_PAYLOAD` (JSON válido para `POST /api/casos`), `CREATE_CASES=true` para activar creación opcional, `TOKEN` para probar sin repetir login.

## Ejecutar

```sh
k6 run loadtest/scenarios.js
```

El escenario sube gradualmente de 10 a 200 usuarios virtuales, combina login y lecturas de bandeja, consulta dashboard y puede crear casos opcionalmente. Reporta p95/p99 y tasa de fallos; valida que cada creación sea `201` para detectar errores del consecutivo.

```sh
BASE_URL=http://localhost:3000 LOGIN_USERS='[{"correo":"prl@test.local","password":"..."}]' CASE_PAYLOAD='{"titulo":"Carga controlada","descripcion":"Caso de prueba","id_brigada":1,"id_proceso":1}' CREATE_CASES=true k6 run loadtest/scenarios.js
```

Usa identidades ficticias, realiza la prueba con conocimiento del equipo de backend y borra los casos generados después.

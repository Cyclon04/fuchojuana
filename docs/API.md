# API REST

Base local: `http://localhost:4000/api`. Producción: `https://TU_DOMINIO/api`.

Enviar `Content-Type: application/json`. Las rutas privadas usan `Authorization: Bearer TOKEN`. Listados devuelven arreglos, detalle y escritura devuelven objetos. Errores: `{ "error": "mensaje", "details": ... }`. UUID inválido o datos incorrectos: 400; sin sesión: 401; sin permiso: 403; inexistente: 404; duplicado o relación activa: 409. Creación: 201; borrado/logout: 204.

## Autenticación

| Método | Ruta           | Cuerpo / resultado                            |
| ------ | -------------- | --------------------------------------------- |
| POST   | /auth/register | `{name,email,password}`; solo crea PLAYER     |
| POST   | /auth/login    | `{email,password}` → `{token,expiresAt,user}` |
| GET    | /auth/me       | Usuario actual, sin hash                      |
| POST   | /auth/logout   | Invalida la sesión actual                     |
| GET    | /health        | Salud de PostgreSQL y ambiente (pública)      |

Contraseñas: 10–72 caracteres en registro. En producción utilizar HTTPS.

## Recursos

Para `players`, `clubs`, `teams`, `tournaments` y `matches`:

| Método | Ruta         | Acción                                       |
| ------ | ------------ | -------------------------------------------- |
| GET    | /recurso     | Consultar listado                            |
| GET    | /recurso/:id | Consultar detalle                            |
| POST   | /recurso     | Crear                                        |
| PUT    | /recurso/:id | Sustituir campos editables (cuerpo completo) |
| DELETE | /recurso/:id | Eliminar                                     |

Todos los usuarios autenticados pueden consultar. Las escrituras requieren ADMIN; excepción: COACH puede crear y editar equipos propios. Solo ADMIN elimina recursos principales.

### Cuerpos de ejemplo

```json
{
  "name": "Alex Rivera",
  "birthDate": "2002-04-12",
  "position": "Medio",
  "jerseyNumber": 10,
  "userId": null
}
```

Jugador: posiciones `Portero`, `Defensa`, `Medio`, `Delantero`; número 0–99 opcional. `userId` opcional solo puede enlazar una cuenta PLAYER.

```json
{
  "name": "Club Frontera",
  "neighborhood": "Zona Centro",
  "description": "Fútbol comunitario"
}
```

```json
{
  "name": "Frontera FC",
  "category": "Libre",
  "clubId": "UUID_CLUB",
  "coachId": "UUID_ENTRENADOR"
}
```

```json
{
  "name": "Copa Frontera",
  "location": "CREA",
  "category": "Libre",
  "startDate": "2026-10-01",
  "endDate": "2026-10-31"
}
```

```json
{
  "tournamentId": "UUID_TORNEO",
  "homeTeamId": "UUID_LOCAL",
  "awayTeamId": "UUID_VISITANTE",
  "kickoff": "2026-10-15T19:00:00-07:00",
  "location": "Cancha CREA 1",
  "homeScore": null,
  "awayScore": null
}
```

Los equipos de un partido deben ser distintos e inscritos. Marcadores enteros 0–99 o ambos null. No es posible retirar una inscripción usada por partidos sin eliminarlos primero.

## Relaciones y administración

| Método | Ruta                           | Cuerpo              | Permisos                      |
| ------ | ------------------------------ | ------------------- | ----------------------------- |
| GET    | /dashboard                     | —                   | Autenticado                   |
| GET    | /coaches                       | —                   | Autenticado; solo id y nombre |
| GET    | /users                         | —                   | ADMIN                         |
| PATCH  | /users/:id/role                | `{role:"COACH"}`    | ADMIN                         |
| POST   | /teams/:id/players             | `{playerId:"UUID"}` | ADMIN o entrenador del equipo |
| DELETE | /teams/:id/players/:playerId   | —                   | ADMIN o entrenador del equipo |
| POST   | /tournaments/:id/teams         | `{teamId:"UUID"}`   | ADMIN o entrenador del equipo |
| DELETE | /tournaments/:id/teams/:teamId | —                   | ADMIN o entrenador del equipo |
| GET    | /tournaments/:id/matches       | —                   | Autenticado                   |

En POST de inscripción, la categoría debe coincidir exactamente con el torneo. Las relaciones usan claves compuestas únicas y claves foráneas.

## Postman o Insomnia

1. Crea un ambiente con `base_url=http://localhost:4000/api`.
2. Envía POST `{{base_url}}/auth/login` con correo de demo y la contraseña de tu `.env.development`.
3. Copia `token` a una variable privada; establece Bearer Token en la colección.
4. Prueba GET `{{base_url}}/players`, después los cuerpos anteriores usando UUID reales de las consultas.
5. Guarda el token solo en tu ambiente privado; no exportes credenciales en una colección pública.
6. Cierra sesión y repite GET: debe dar 401.

## Integridad y seguridad

Los roles se consultan en PostgreSQL en cada solicitud; el token identifica una sesión revocable. Ni roles enviados en registro ni un id de entrenador ajeno permiten elevar permisos. Las respuestas nunca devuelven hashes. CORS limita los orígenes del navegador, y no sustituye la autenticación. Los errores internos se registran solo en servidor. El límite de autenticación es de 50 solicitudes por IP cada 15 minutos, incluyendo `/me` y logout.

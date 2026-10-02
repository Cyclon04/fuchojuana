# Guion para la presentación

## Demostración de 7–10 minutos

1. **Problema:** centralizar clubes, plantillas y torneos del fútbol de Tijuana.
2. **Arquitectura:** muestra el diagrama de `ARQUITECTURA.md`. Explica que Expo envía HTTP a Express, que valida permisos y guarda con Prisma en PostgreSQL.
3. **Acceso:** inicia sesión como administrador y abre el resumen con cifras reales.
4. **Gestión:** crea un jugador, un club y un equipo; asigna entrenador y agrega al jugador a la plantilla.
5. **Competencia:** crea un torneo, inscribe dos equipos y registra un partido con resultado.
6. **Persistencia:** refresca la pantalla y muestra la consulta SQL de equipos/partidos. Los datos siguen guardados.
7. **Roles:** abre una sesión de jugador y explica por qué no tiene acciones de escritura. Entrenador solo administra equipos propios; backend también lo verifica.
8. **Nube:** abre la URL HTTPS real y EC2, muestra los servicios y el firewall. Si todavía no se desplegó, identifícalo como pendiente, no como producción.
9. **Dos ambientes:** cambia entre localhost y URL pública; consulta `/api/health` de ambos. Crea un registro con nombre `Solo desarrollo` y muestra que no aparece en producción.
10. **Calidad:** muestra migraciones versionadas y el resultado de las pruebas.

## Capturas que debes tomar

| Evidencia        | Qué debe verse                                           |
| ---------------- | -------------------------------------------------------- |
| Inicio de sesión | Marca Fuchojuana y formulario; ocultar contraseña        |
| Dashboard        | Usuario, totales y próximos partidos                     |
| Jugadores        | Lista y jugador creado                                   |
| Equipo           | Club, entrenador y plantilla                             |
| Torneo           | Categoría, fechas, inscritos y encuentros                |
| Partido          | Equipos, fecha, cancha y marcador                        |
| Base local       | Consulta SQL de datos creados; sin credenciales          |
| EC2              | Instancia real, tipo, región, IP y estado                |
| Disco / VM       | Tamaño de disco, OS y recursos                           |
| Firewall         | 80/443 públicos; SSH restringido; BD no publicada        |
| Contenedores     | Servicios saludables en servidor                         |
| URL pública      | Barra de dirección HTTPS y dashboard funcionando         |
| Dos ambientes    | `/api/health` development y production y bases distintas |
| Validación       | Pruebas aprobadas y compilación                          |

## Consultas sin exponer secretos

```sql
SELECT name, email, role FROM users;
SELECT t.name AS equipo, c.name AS club, u.name AS entrenador
FROM teams t JOIN clubs c ON c.id=t."clubId" JOIN users u ON u.id=t."coachId";
SELECT p.name AS jugador, t.name AS equipo
FROM team_players tp JOIN players p ON p.id=tp."playerId" JOIN teams t ON t.id=tp."teamId";
SELECT id, "kickoff", "homeScore", "awayScore" FROM matches;
SELECT migration_name, finished_at FROM _prisma_migrations;
```

No muestres `passwordHash`, tokens, `.env`, claves SSH ni credenciales del laboratorio. Puedes mostrar archivos `.example` y nombres de las bases.

## Preguntas esperadas

- **¿Por qué N:M?** Un torneo incluye muchos equipos; un equipo puede participar en varios torneos. Lo mismo permite plantillas de distintas competencias.
- **¿Qué evita equipos no inscritos?** Validaciones REST más claves foráneas compuestas en PostgreSQL.
- **¿Cómo se protege la API?** JWT con sesión revocable, hash bcrypt, roles y propiedad del equipo.
- **¿Qué aporta la nube?** EC2 ejecuta los servicios; EBS persiste los datos; VPC/Security Group controla conexiones. No se usa RDS en la propuesta inicial.
- **¿Por qué dos ambientes?** Permite modificar y probar código sin afectar los datos publicados.

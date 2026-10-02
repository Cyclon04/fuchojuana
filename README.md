# Fuchojuana ⚽

MVP de gestión del fútbol de Tijuana: jugadores, clubes, equipos, torneos, inscripciones y partidos. Interfaz en español y diseño adaptable con React Native / Expo para web; API Express conectada a PostgreSQL real mediante Prisma.

## Estado verificable

- Desarrollo local implementado y conectado a PostgreSQL 18.
- Compilación web y backend disponibles; 9 pruebas de integración contra una base PostgreSQL independiente.
- Configuración de despliegue AWS preparada. **No se debe afirmar que está en producción hasta tener una URL pública y completar la verificación de `docs/DESPLIEGUE-AWS.md`.** El estado exacto se registra en `docs/VERIFICACION.md`.

## Tecnologías y organización

Node.js 24, TypeScript, Express 5, Prisma 6.19, PostgreSQL 18, Expo SDK 55, React Native 0.83, React Navigation 7. Se fijan versiones compatibles y se conserva `package-lock.json`; no se adopta una versión preliminar de Prisma.

```text
Fuchojuana/
├── frontend/            Expo, navegación, componentes y pantallas
├── backend/src/         Rutas/controladores HTTP, servicios, middlewares y configuración
├── backend/tests/       Pruebas de integración REST y permisos
├── database/prisma/     Esquema y migraciones SQL versionadas
├── database/seed.ts     Datos de demostración idempotentes
├── deploy/              Dockerfiles, Nginx y Caddy para TLS
├── scripts/             Carga de ambiente, configuración y empaquetado
├── docs/                Arquitectura, API, despliegue y evidencia
├── compose.development.yml
└── compose.production.yml
```

Prisma actúa como capa de repositorios; las rutas controlan solicitudes y los servicios aplican reglas. No hay datos simulados en la interfaz.

## Inicio rápido en esta Mac

El proyecto ya tiene dependencias, `.env.development`, PostgreSQL aislado y datos de prueba creados. Desde la carpeta `Fuchojuana`:

```bash
# Si PostgreSQL no está iniciado:
/Applications/Postgres.app/Contents/Versions/latest/bin/pg_ctl -D .runtime/pgdata -l .runtime/postgres.log -o '-p 55432 -h 127.0.0.1 -k /tmp' start
npm run dev:api
# En otra terminal:
npm run dev:web
```

Abrir http://localhost:8081. API: http://localhost:4000/api/health. Las cuentas y contraseña local están en `.runtime/ACCESO-LOCAL.md`, que está excluido de Git. No es necesario volver a crear la base.

## Instalación en otra computadora

Requisitos: Node.js 24 LTS, npm y PostgreSQL 18 (o Docker con Compose v2). Usa dos terminales para frontend y backend.

1. Clona el repositorio una vez publicado, o copia esta carpeta. No hay un repositorio remoto creado automáticamente:

```bash
git clone <URL_DE_TU_REPOSITORIO>
cd Fuchojuana
npm ci
node scripts/configure.mjs development
npm run db:generate
```

2. La configuración genera secretos aleatorios sin sobrescribir archivos existentes. Inicia PostgreSQL con Docker:

```bash
docker compose --env-file .env.development -f compose.development.yml up -d
```

Si utilizas PostgreSQL instalado, crea un usuario propio y una base `fuchojuana_dev`, y ajusta `DATABASE_URL`. Ejemplo en `psql` como administrador:

```sql
CREATE ROLE fucho_dev LOGIN;
\password fucho_dev
CREATE DATABASE fuchojuana_dev OWNER fucho_dev;
```

`\password` solicita la clave sin dejarla en el historial SQL. El puerto de Docker es 55432; una instalación habitual usa 5432. La contraseña de la URL debe estar codificada si incluye caracteres especiales. El generador usa hexadecimal para evitar ese problema.

3. Aplica el esquema y carga los ejemplos:

```bash
npm run db:migrate
npm run db:seed
npm run dev:api
# Otra terminal
npm run dev:web
```

No uses `db push` para sustituir el historial de migraciones. Para nuevos cambios de esquema durante desarrollo:

```bash
node scripts/env.mjs prisma migrate dev --schema database/prisma/schema.prisma --name descripcion_del_cambio
```

Este comando requiere permiso para crear una base shadow; también puedes configurar una shadow database separada.

## Cuentas y permisos

| Cuenta de demo             | Rol           | Permisos                                                                       |
| -------------------------- | ------------- | ------------------------------------------------------------------------------ |
| admin@fuchojuana.test      | Administrador | CRUD completo, plantillas, inscripciones, resultados y roles                   |
| entrenador@fuchojuana.test | Entrenador    | Consultas, crear y editar sus equipos, gestionar sus plantillas e inscribirlos |
| jugador@fuchojuana.test    | Jugador       | Consultar jugadores, clubes, equipos, torneos, partidos y su equipo            |

La clave de las tres cuentas es el valor local de `SEED_PASSWORD`. Nunca se incluye una contraseña fija en código o documentación pública. El seed no cambia claves de usuarios existentes. El registro público crea únicamente jugadores; un administrador puede promover cuentas desde Usuarios. No se puede cambiar el propio rol, ni quitar un entrenador que tiene equipos asignados.

## Flujo para demostrar el MVP

1. Inicia sesión como administrador.
2. En Clubes crea un club; en Usuarios asigna el rol Entrenador a una cuenta registrada si necesitas otra.
3. En Equipos crea dos equipos con el mismo valor de categoría, club y entrenador.
4. En Jugadores crea un jugador; en Equipos → Ver agrégalo a la plantilla.
5. Crea un torneo con esa misma categoría y un intervalo de fechas válido.
6. En Torneos → Ver inscribe ambos equipos.
7. En Partidos crea el encuentro dentro de las fechas del torneo y después edita ambos marcadores.
8. Refresca la página y comprueba que los datos persisten.
9. Cierra sesión; entra como entrenador o jugador y observa las acciones disponibles.

Las fechas de nacimiento y torneo usan `AAAA-MM-DD`. Los partidos se capturan en hora de **Tijuana** con `AAAA-MM-DD HH:mm` y se guardan como instantes UTC. El intervalo del torneo también se valida según la fecha local de Tijuana. Los resultados requieren ambos marcadores.

## Pruebas

Las pruebas limpian exclusivamente una base cuyo nombre termina en `_test`; nunca apuntes pruebas al desarrollo o producción. En esta Mac ya existe `.env.test` y `fuchojuana_test`.

En otra instalación:

```bash
# En PostgreSQL, con permisos suficientes:
createdb -h 127.0.0.1 -p 55432 -U fucho_dev fuchojuana_test
cp .env.development .env.test
# Edita .env.test: NODE_ENV=test y DATABASE_URL terminada en /fuchojuana_test
ENV_FILE=.env.test npm run db:migrate
npm test
npm run typecheck
```

Los 9 casos cubren múltiples solicitudes: JWT, sesión revocable, registro sin escalamiento, restricciones por rol y propiedad, CRUD, plantillas, fechas, equipos inscritos, marcadores y borrado con relaciones.

## Producción

Consulta la guía paso a paso [Despliegue en AWS Academy](docs/DESPLIEGUE-AWS.md). El entorno está preparado para una VM EC2 Ubuntu 24.04 con Docker: Caddy (HTTPS) → Nginx (frontend y proxy) → Express → PostgreSQL. La BD no expone puertos públicos.

```bash
# Compilar sin desplegar:
npm run build
# En el servidor, con dominio apuntando a la IP pública:
node scripts/configure.mjs production TU_DOMINIO
sudo docker compose --env-file .env.production -f compose.production.yml up -d --build
# Cargar datos de demo de manera explícita:
sudo docker compose --env-file .env.production -f compose.production.yml run --rm -e ALLOW_PRODUCTION_SEED=true api npx tsx database/seed.ts
```

La base se crea al arrancar PostgreSQL. El servicio `migrate` aplica las migraciones antes de que arranque la API. La compilación web usa `/api`, de modo que funciona con el dominio del servidor sin recompilar por cada IP. `frontend/dist` contiene el sitio y `backend/dist` el backend compilado. PM2 no es necesario: Docker reinicia los servicios.

Para operar sin usuarios de demostración, provisiona el primer administrador con un proceso administrativo controlado. Para esta presentación se proporciona el seed explícito. Cambiar `SEED_PASSWORD` después de ejecutarlo no rota claves ya guardadas.

## Variables y separación

| Variable              | Uso                                          | Secreto       |
| --------------------- | -------------------------------------------- | ------------- |
| NODE_ENV              | development / test / production              | No            |
| DATABASE_URL          | Conexión del servidor a PostgreSQL           | Sí            |
| JWT_SECRET            | Firma de JWT, mínimo 32 caracteres           | Sí            |
| FRONTEND_ORIGIN       | Orígenes CORS, separados por comas           | No            |
| EXPO_PUBLIC_API_URL   | Dirección pública de API al compilar Expo    | No            |
| PORT                  | Puerto API, 4000                             | No            |
| TRUST_PROXY           | 0 local; 2 detrás de Caddy y Nginx           | No            |
| SEED_PASSWORD         | Clave inicial de cuentas de demo             | Sí            |
| POSTGRES_*            | Configuración Docker de la BD                | Contraseña sí |
| SITE_ADDRESS          | Dominio de Caddy para certificado HTTPS      | No            |
| ALLOW_PRODUCTION_SEED | Autorización explícita de seed en producción | No            |

`.env.development`, `.env.test` y `.env.production` son distintos y están excluidos de Git. Solo se publican los `.example`. Nunca pongas secretos en variables `EXPO_PUBLIC_*`: se incluyen en el navegador. Los tokens web duran ocho horas y se guardan en `sessionStorage`; en nativo, SecureStore. El logout elimina la sesión en PostgreSQL. Las contraseñas se almacenan con bcrypt.

## Documentación

- [API REST y ejemplos](docs/API.md)
- [Arquitectura y base de datos](docs/ARQUITECTURA.md)
- [Despliegue AWS](docs/DESPLIEGUE-AWS.md)
- [Guion y capturas de evidencia](docs/PRESENTACION.md)
- [Resultados verificados](docs/VERIFICACION.md)

## Límites del MVP

Sin recuperación de contraseña por correo, verificación de correo, archivos/fotos, tabla de posiciones ni paginación de grandes volúmenes. Las listas son apropiadas para una demostración pequeña. El perfil de jugador se vincula a su cuenta desde el formulario del administrador. Un jugador puede integrar varios equipos (N:M). La app se prueba en web; compilar para iOS/Android requiere los pasos normales de Expo. AWS Academy es un laboratorio temporal, no una garantía de servicio permanente.

# Despliegue real en AWS Academy

Este archivo es un procedimiento reproducible, no evidencia de un despliegue ejecutado. Registrar la URL y recursos reales en `VERIFICACION.md` después de comprobarlos. Usa la cuenta/laboratorio que habilite el profesor; las restricciones varían por laboratorio.

## 1. Preparar la VM

1. En AWS Academy abre Learner Lab, pulsa Start Lab y espera el indicador listo. Abre AWS Console.
2. En la región permitida abre EC2 → Launch instance.
3. Nombre: `fuchojuana-prod`. Ubuntu Server 24.04 LTS, arquitectura x86_64.
4. Tipo objetivo: `t3.small`, 2 vCPU, 2 GiB RAM. Si no está permitido, selecciona una instancia disponible con memoria suficiente y registra el cambio. No se promete gratuidad: revisar saldo y límites del laboratorio.
5. Disco: 20 GiB gp3. Selecciona una clave SSH que controles o el acceso EC2 Instance Connect habilitado por el laboratorio.
6. Usa una subred pública con IP pública y salida a Internet. Grupo de seguridad: TCP 22 **solo desde tu IP**; 80 y 443 desde Internet para el sitio. No abrir 4000 ni 5432.
7. Lanza la instancia y registra región, id, IP, CPU, RAM, disco y sistema operativo. Estos datos deben venir de la consola real.

## 2. Software del servidor

Conecta por SSH (`ubuntu@IP_PUBLICA`) o Instance Connect:

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2 git openssl
sudo systemctl enable --now docker
sudo mkdir -p /opt/fuchojuana
sudo chown ubuntu:ubuntu /opt/fuchojuana
```

Con 2 GiB, una compilación puede quedarse sin memoria. Si es necesario, crea swap en el disco antes de compilar:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

Ejecuta esos comandos solo si `/swapfile` no existe. Para persistir, añade `/swapfile none swap sw 0 0` a `/etc/fstab` una única vez. El sistema usa Docker, no instala Node/PostgreSQL globalmente ni necesita PM2.

## 3. Subir el proyecto sin secretos

En esta Mac, desde `Fuchojuana`:

```bash
bash scripts/package.sh
scp -i /ruta/a/tu-clave.pem .runtime/fuchojuana-source.tar.gz ubuntu@IP_PUBLICA:/opt/fuchojuana/
```

En el servidor:

```bash
cd /opt/fuchojuana
tar -xzf fuchojuana-source.tar.gz
```

Alternativa: clonar un repositorio que tú hayas publicado. El paquete excluye dependencias, bases de datos y secretos locales.

## 4. HTTPS y configuración independiente

Apunta un registro DNS A de un dominio/subdominio que controles a la IP pública. Caddy necesita que 80 y 443 sean accesibles para obtener el certificado. Una IP pública de EC2 puede cambiar después de detener/iniciar la VM: actualiza DNS. Una IP elástica, si el laboratorio permite usarla, puede generar costos.

El generador se puede ejecutar sin instalar Node en la VM usando el contenedor oficial:

```bash
sudo docker run --rm -u "$(id -u):$(id -g)" -v "$PWD:/app" -w /app node:24-bookworm-slim node scripts/configure.mjs production TU_DOMINIO
```

Genera `.env.production` con nuevas contraseñas y `SITE_ADDRESS`, `FRONTEND_ORIGIN` y `DATABASE_URL` independientes. No copies `.env.development`. Nunca abras el archivo durante la presentación ni lo subas a Git.

## 5. Arranque, migración y seed

```bash
sudo docker compose --env-file .env.production -f compose.production.yml up -d --build
sudo docker compose --env-file .env.production -f compose.production.yml ps
sudo docker compose --env-file .env.production -f compose.production.yml logs --tail=80 api gateway
```

Orden automático: base saludable → migración completada → API saludable → frontend y HTTPS.

Para la demostración:

```bash
sudo docker compose --env-file .env.production -f compose.production.yml run --rm -e ALLOW_PRODUCTION_SEED=true api npx tsx database/seed.ts
```

El seed utiliza `SEED_PASSWORD` del servidor. Las claves de desarrollo no funcionan en esta base. Es idempotente y no cambia contraseñas previamente almacenadas.

## 6. Verificación pública

```bash
curl --fail https://TU_DOMINIO/api/health
```

Debe indicar `environment: production` y `database: postgresql`. Desde otro dispositivo abre `https://TU_DOMINIO`, inicia sesión, crea un equipo y comprueba que permanece al recargar.

Consulta de persistencia dentro del servidor:

```bash
sudo docker compose --env-file .env.production -f compose.production.yml exec db psql -U fucho_prod -d fuchojuana_prod -c 'SELECT id, name FROM teams;'
```

No marques producción como completada hasta probar frontend, autenticación, API y persistencia real. El frontend exportado por sí solo no cumple este requisito.

## 7. Respaldos y actualizaciones

```bash
# Respaldo en el servidor; copia después a una ubicación controlada fuera de la VM.
sudo docker compose --env-file .env.production -f compose.production.yml exec -T db pg_dump -U fucho_prod -d fuchojuana_prod -Fc > fuchojuana-backup.dump
# Actualización tras subir una nueva versión:
sudo docker compose --env-file .env.production -f compose.production.yml up -d --build
```

No ejecutes `down -v`: elimina los volúmenes. Reiniciar contenedores conserva datos. Eliminar la VM o su disco sí puede perderlos. Para una restauración, usa una base nueva, `pg_restore`, y valida antes de reemplazar la activa.

## 8. Evidencia de VM y costos

Captura consola EC2 (tipo, RAM/CPU en especificaciones, disco), Security Group y `docker compose ps`. Consulta [especificaciones EC2](https://docs.aws.amazon.com/ec2/latest/instancetypes/gp.html) y precios reales en la región/cuenta; este proyecto no fija costos. AWS Academy puede detener recursos cuando termina la sesión o curso. No equivale a hosting permanente. Para la exposición inicia el laboratorio con anticipación.

## Alternativa Firebase

Firebase Hosting puede alojar el frontend exportado; Express y PostgreSQL seguirían necesitando otro servicio. Para evitar cambiar la base exigida a Firestore se prepara AWS como ruta principal. No se han creado recursos Firebase ni modificado proyectos existentes.

---
read_when:
    - Usas OpenClaw con Docker a menudo y quieres comandos cotidianos más cortos
    - Quieres una capa auxiliar para el panel, los registros, la configuración de tokens y los flujos de emparejamiento
summary: Funciones auxiliares de shell de ClawDock para instalaciones de OpenClaw basadas en Docker
title: ClawDock
x-i18n:
    generated_at: "2026-07-11T23:10:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bb829a3301178503f910931e86a39f7befeaf186044f4088a25dc80ea99130d
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock es una pequeña capa de funciones auxiliares de shell para instalaciones de OpenClaw basadas en Docker.

Proporciona comandos breves como `clawdock-start`, `clawdock-dashboard` y `clawdock-fix-token` en lugar de invocaciones más largas de `docker compose ...`.

Si aún no has configurado Docker, comienza por [Docker](/es/install/docker).

## Instalación

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Si anteriormente instalaste ClawDock desde `scripts/shell-helpers/clawdock-helpers.sh`, vuelve a instalarlo desde la ruta actual `scripts/clawdock/clawdock-helpers.sh`; la antigua ruta directa de GitHub se eliminó.

Las funciones auxiliares detectan automáticamente tu copia de trabajo de OpenClaw la primera vez que las usas (comprobando rutas habituales como `~/openclaw` y `~/projects/openclaw`) y almacenan el resultado en caché en `~/.clawdock/config`. Define `CLAWDOCK_DIR` manualmente si tu copia de trabajo se encuentra en otra ubicación.

## Funciones disponibles

### Operaciones básicas

| Comando            | Descripción                      |
| ------------------ | -------------------------------- |
| `clawdock-start`   | Iniciar el Gateway               |
| `clawdock-stop`    | Detener el Gateway               |
| `clawdock-restart` | Reiniciar el Gateway             |
| `clawdock-status`  | Comprobar el estado del contenedor |
| `clawdock-logs`    | Seguir los registros del Gateway |

### Acceso al contenedor

| Comando                   | Descripción                                           |
| ------------------------- | ----------------------------------------------------- |
| `clawdock-shell`          | Abrir un shell dentro del contenedor del Gateway      |
| `clawdock-cli <command>`  | Ejecutar comandos de la CLI de OpenClaw en Docker     |
| `clawdock-exec <command>` | Ejecutar un comando arbitrario dentro del contenedor  |

### Interfaz web y emparejamiento

| Comando                 | Descripción                              |
| ----------------------- | ---------------------------------------- |
| `clawdock-dashboard`    | Abrir la URL de la interfaz de control   |
| `clawdock-devices`      | Mostrar emparejamientos de dispositivos pendientes |
| `clawdock-approve <id>` | Aprobar una solicitud de emparejamiento  |

### Configuración y mantenimiento

| Comando              | Descripción                                                   |
| -------------------- | ------------------------------------------------------------- |
| `clawdock-fix-token` | Escribir el token del Gateway en la configuración del contenedor |
| `clawdock-update`    | Descargar, recompilar y reiniciar                             |
| `clawdock-rebuild`   | Recompilar únicamente la imagen de Docker                     |
| `clawdock-clean`     | Eliminar contenedores y volúmenes                             |

### Utilidades

| Comando                | Descripción                                              |
| ---------------------- | -------------------------------------------------------- |
| `clawdock-health`      | Ejecutar una comprobación de estado del Gateway          |
| `clawdock-token`       | Mostrar el token del Gateway                             |
| `clawdock-cd`          | Ir al directorio del proyecto OpenClaw                   |
| `clawdock-config`      | Abrir `~/.openclaw`                                      |
| `clawdock-show-config` | Mostrar los archivos de configuración con valores ocultos |
| `clawdock-workspace`   | Abrir el directorio del espacio de trabajo               |
| `clawdock-help`        | Mostrar todos los comandos de ClawDock                   |

## Flujo inicial

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Si el navegador indica que se requiere emparejamiento:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Configuración y secretos

ClawDock lee dos archivos `.env` independientes, de acuerdo con la separación descrita en [Docker](/es/install/docker):

- El archivo `.env` del proyecto junto a `docker-compose.yml`: valores específicos de Docker, como el nombre de la imagen, los puertos y `OPENCLAW_GATEWAY_TOKEN`. `clawdock-token` lee el token desde aquí.
- `~/.openclaw/.env` (montado en el contenedor): secretos respaldados por variables de entorno que administra el propio OpenClaw, junto con `openclaw.json` y `agents/<agentId>/agent/auth-profiles.json`.

`clawdock-fix-token` copia el token del archivo `.env` del proyecto en los valores de configuración `gateway.remote.token` y `gateway.auth.token` del contenedor y reinicia el Gateway.

Usa `clawdock-show-config` para inspeccionar rápidamente `openclaw.json` y ambos archivos `.env`; oculta los valores de `.env` en la salida mostrada.

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Docker" href="/es/install/docker" icon="docker">
    Instalación canónica de Docker para OpenClaw.
  </Card>
  <Card title="Entorno de ejecución de máquinas virtuales de Docker" href="/es/install/docker-vm-runtime" icon="cube">
    Entorno de ejecución de máquinas virtuales administrado por Docker para un aislamiento reforzado.
  </Card>
  <Card title="Actualización" href="/es/install/updating" icon="arrow-up-right-from-square">
    Actualización del paquete OpenClaw y de los servicios administrados.
  </Card>
</CardGroup>

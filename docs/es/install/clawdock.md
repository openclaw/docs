---
read_when:
    - Ejecutas OpenClaw con Docker a menudo y quieres comandos diarios más cortos
    - Quieres una capa auxiliar para el panel, los registros, la configuración de tokens y los flujos de emparejamiento
summary: Ayudantes de shell de ClawDock para instalaciones de OpenClaw basadas en Docker
title: ClawDock
x-i18n:
    generated_at: "2026-07-05T11:22:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bb829a3301178503f910931e86a39f7befeaf186044f4088a25dc80ea99130d
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock es una pequeña capa de ayudantes de shell para instalaciones de OpenClaw basadas en Docker.

Te da comandos cortos como `clawdock-start`, `clawdock-dashboard` y `clawdock-fix-token` en lugar de invocaciones más largas de `docker compose ...`.

Si aún no has configurado Docker, empieza con [Docker](/es/install/docker).

## Instalación

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Si instalaste ClawDock anteriormente desde `scripts/shell-helpers/clawdock-helpers.sh`, reinstálalo desde la ruta actual `scripts/clawdock/clawdock-helpers.sh`; la antigua ruta sin procesar de GitHub se eliminó.

Los ayudantes autodetectan tu checkout de OpenClaw en el primer uso (comprobando rutas comunes como `~/openclaw`, `~/projects/openclaw`) y almacenan el resultado en caché en `~/.clawdock/config`. Define `CLAWDOCK_DIR` tú mismo si tu checkout está en otro lugar.

## Qué obtienes

### Operaciones básicas

| Comando            | Descripción               |
| ------------------ | ------------------------- |
| `clawdock-start`   | Iniciar el Gateway        |
| `clawdock-stop`    | Detener el Gateway        |
| `clawdock-restart` | Reiniciar el Gateway      |
| `clawdock-status`  | Comprobar el estado del contenedor |
| `clawdock-logs`    | Seguir los registros del Gateway |

### Acceso al contenedor

| Comando                   | Descripción                                      |
| ------------------------- | ------------------------------------------------ |
| `clawdock-shell`          | Abrir una shell dentro del contenedor del Gateway |
| `clawdock-cli <command>`  | Ejecutar comandos de la CLI de OpenClaw en Docker |
| `clawdock-exec <command>` | Ejecutar un comando arbitrario en el contenedor  |

### Interfaz web y emparejamiento

| Comando                 | Descripción                         |
| ----------------------- | ----------------------------------- |
| `clawdock-dashboard`    | Abrir la URL de la interfaz de control |
| `clawdock-devices`      | Enumerar emparejamientos de dispositivos pendientes |
| `clawdock-approve <id>` | Aprobar una solicitud de emparejamiento |

### Configuración y mantenimiento

| Comando              | Descripción                                             |
| -------------------- | ------------------------------------------------------- |
| `clawdock-fix-token` | Escribir el token del Gateway en la configuración del contenedor |
| `clawdock-update`    | Extraer, reconstruir y reiniciar                        |
| `clawdock-rebuild`   | Reconstruir solo la imagen de Docker                    |
| `clawdock-clean`     | Eliminar contenedores y volúmenes                       |

### Utilidades

| Comando                | Descripción                                      |
| ---------------------- | ------------------------------------------------ |
| `clawdock-health`      | Ejecutar una comprobación de estado del Gateway  |
| `clawdock-token`       | Imprimir el token del Gateway                    |
| `clawdock-cd`          | Ir al directorio del proyecto OpenClaw           |
| `clawdock-config`      | Abrir `~/.openclaw`                              |
| `clawdock-show-config` | Imprimir archivos de configuración con valores redactados |
| `clawdock-workspace`   | Abrir el directorio del espacio de trabajo       |
| `clawdock-help`        | Enumerar todos los comandos de ClawDock          |

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

ClawDock lee dos archivos `.env` separados, coincidiendo con la separación descrita en [Docker](/es/install/docker):

- El `.env` del proyecto junto a `docker-compose.yml`: valores específicos de Docker como el nombre de la imagen, los puertos y `OPENCLAW_GATEWAY_TOKEN`. `clawdock-token` lee el token desde aquí.
- `~/.openclaw/.env` (montado en el contenedor): secretos respaldados por variables de entorno que OpenClaw administra, junto con `openclaw.json` y `agents/<agentId>/agent/auth-profiles.json`.

`clawdock-fix-token` copia el token del `.env` del proyecto en los valores de configuración `gateway.remote.token` y `gateway.auth.token` del contenedor, y reinicia el Gateway.

Usa `clawdock-show-config` para inspeccionar rápidamente `openclaw.json` y ambos archivos `.env`; redacta los valores de `.env` en la salida impresa.

## Relacionado

<CardGroup cols={2}>
  <Card title="Docker" href="/es/install/docker" icon="docker">
    Instalación canónica de Docker para OpenClaw.
  </Card>
  <Card title="Tiempo de ejecución de VM de Docker" href="/es/install/docker-vm-runtime" icon="cube">
    Tiempo de ejecución de VM administrado por Docker para aislamiento reforzado.
  </Card>
  <Card title="Actualización" href="/es/install/updating" icon="arrow-up-right-from-square">
    Actualización del paquete OpenClaw y los servicios administrados.
  </Card>
</CardGroup>

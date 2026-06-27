---
read_when:
    - Usas OpenClaw con Docker a menudo y quieres comandos cotidianos más cortos
    - Quieres una capa auxiliar para el panel, los registros, la configuración de tokens y los flujos de emparejamiento
summary: Ayudantes de shell de ClawDock para instalaciones de OpenClaw basadas en Docker
title: ClawDock
x-i18n:
    generated_at: "2026-05-06T05:38:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 82d31ba74694cda9e195534ce33f7b61343546f174ceacd2607aeb1d5487229e
    source_path: install/clawdock.md
    workflow: 16
    postprocess_version: locale-links-v1
---

ClawDock es una pequeña capa de ayudantes de shell para instalaciones de OpenClaw basadas en Docker.

Te da comandos cortos como `clawdock-start`, `clawdock-dashboard` y `clawdock-fix-token` en lugar de invocaciones más largas de `docker compose ...`.

Si aún no has configurado Docker, empieza con [Docker](/es/install/docker).

## Instalación

Usa la ruta canónica del ayudante:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Si anteriormente instalaste ClawDock desde `scripts/shell-helpers/clawdock-helpers.sh`, reinstálalo desde la nueva ruta `scripts/clawdock/clawdock-helpers.sh`. La ruta antigua sin procesar de GitHub se eliminó.

## Qué obtienes

### Operaciones básicas

| Comando            | Descripción                    |
| ------------------ | ------------------------------ |
| `clawdock-start`   | Iniciar el Gateway             |
| `clawdock-stop`    | Detener el Gateway             |
| `clawdock-restart` | Reiniciar el Gateway           |
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
| `clawdock-devices`      | Listar emparejamientos de dispositivos pendientes |
| `clawdock-approve <id>` | Aprobar una solicitud de emparejamiento |

### Configuración y mantenimiento

| Comando              | Descripción                                      |
| -------------------- | ------------------------------------------------ |
| `clawdock-fix-token` | Configurar el token del Gateway dentro del contenedor |
| `clawdock-update`    | Extraer, reconstruir y reiniciar                 |
| `clawdock-rebuild`   | Reconstruir solo la imagen de Docker             |
| `clawdock-clean`     | Eliminar contenedores y volúmenes                |

### Utilidades

| Comando                | Descripción                                      |
| ---------------------- | ------------------------------------------------ |
| `clawdock-health`      | Ejecutar una comprobación de estado del Gateway  |
| `clawdock-token`       | Imprimir el token del Gateway                    |
| `clawdock-cd`          | Ir al directorio del proyecto OpenClaw           |
| `clawdock-config`      | Abrir `~/.openclaw`                              |
| `clawdock-show-config` | Imprimir archivos de configuración con valores redactados |
| `clawdock-workspace`   | Abrir el directorio del espacio de trabajo       |

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

ClawDock funciona con la misma separación de configuración de Docker descrita en [Docker](/es/install/docker):

- `<project>/.env` para valores específicos de Docker como el nombre de la imagen, los puertos y el token del Gateway
- `~/.openclaw/.env` para claves de proveedores respaldadas por variables de entorno y tokens de bots
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` para autenticación OAuth/clave de API de proveedores almacenada
- `~/.openclaw/openclaw.json` para la configuración de comportamiento

Usa `clawdock-show-config` cuando quieras inspeccionar rápidamente los archivos `.env` y `openclaw.json`. Redacta los valores de `.env` en la salida impresa.

## Relacionado

<CardGroup cols={2}>
  <Card title="Docker" href="/es/install/docker" icon="docker">
    Instalación canónica de Docker para OpenClaw.
  </Card>
  <Card title="Runtime de VM de Docker" href="/es/install/docker-vm-runtime" icon="cube">
    Runtime de VM administrado por Docker para aislamiento reforzado.
  </Card>
  <Card title="Actualización" href="/es/install/updating" icon="arrow-up-right-from-square">
    Actualización del paquete de OpenClaw y los servicios administrados.
  </Card>
</CardGroup>

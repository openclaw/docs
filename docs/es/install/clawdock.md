---
read_when:
    - Usas OpenClaw con Docker con frecuencia y quieres comandos cotidianos más cortos
    - Quieres una capa de helpers para panel, registros, configuración de tokens y flujos de emparejamiento
summary: Helpers de shell de ClawDock para instalaciones de OpenClaw basadas en Docker
title: ClawDock
x-i18n:
    generated_at: "2026-04-24T05:34:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 308ac338cb8a94d7996489ef9d751a9359b22ddd3c44d64774c6a2275b29aa22
    source_path: install/clawdock.md
    workflow: 15
---

ClawDock es una pequeña capa de helpers de shell para instalaciones de OpenClaw basadas en Docker.

Te ofrece comandos cortos como `clawdock-start`, `clawdock-dashboard` y `clawdock-fix-token` en lugar de invocaciones más largas de `docker compose ...`.

Si todavía no has configurado Docker, empieza por [Docker](/es/install/docker).

## Instalar

Usa la ruta canónica del helper:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Si anteriormente instalaste ClawDock desde `scripts/shell-helpers/clawdock-helpers.sh`, vuelve a instalarlo desde la nueva ruta `scripts/clawdock/clawdock-helpers.sh`. La antigua ruta raw de GitHub se eliminó.

## Qué obtienes

### Operaciones básicas

| Command            | Description                  |
| ------------------ | ---------------------------- |
| `clawdock-start`   | Iniciar el gateway           |
| `clawdock-stop`    | Detener el gateway           |
| `clawdock-restart` | Reiniciar el gateway         |
| `clawdock-status`  | Comprobar el estado del contenedor |
| `clawdock-logs`    | Seguir los registros del gateway |

### Acceso al contenedor

| Command                   | Description                                        |
| ------------------------- | -------------------------------------------------- |
| `clawdock-shell`          | Abrir un shell dentro del contenedor del gateway   |
| `clawdock-cli <command>`  | Ejecutar comandos CLI de OpenClaw en Docker        |
| `clawdock-exec <command>` | Ejecutar un comando arbitrario en el contenedor    |

### Web UI y emparejamiento

| Command                 | Description                          |
| ----------------------- | ------------------------------------ |
| `clawdock-dashboard`    | Abrir la URL de Control UI           |
| `clawdock-devices`      | Listar emparejamientos de dispositivos pendientes |
| `clawdock-approve <id>` | Aprobar una solicitud de emparejamiento |

### Configuración y mantenimiento

| Command              | Description                                          |
| -------------------- | ---------------------------------------------------- |
| `clawdock-fix-token` | Configurar el token del gateway dentro del contenedor |
| `clawdock-update`    | Descargar, reconstruir y reiniciar                   |
| `clawdock-rebuild`   | Reconstruir solo la imagen Docker                    |
| `clawdock-clean`     | Eliminar contenedores y volúmenes                    |

### Utilidades

| Command                | Description                                |
| ---------------------- | ------------------------------------------ |
| `clawdock-health`      | Ejecutar una comprobación de salud del gateway |
| `clawdock-token`       | Imprimir el token del gateway              |
| `clawdock-cd`          | Ir al directorio del proyecto OpenClaw     |
| `clawdock-config`      | Abrir `~/.openclaw`                        |
| `clawdock-show-config` | Imprimir archivos de configuración con valores redactados |
| `clawdock-workspace`   | Abrir el directorio del espacio de trabajo |

## Flujo de primera vez

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Si el navegador dice que se requiere emparejamiento:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Configuración y secretos

ClawDock funciona con la misma división de configuración de Docker descrita en [Docker](/es/install/docker):

- `<project>/.env` para valores específicos de Docker como nombre de imagen, puertos y el token del gateway
- `~/.openclaw/.env` para claves de proveedor respaldadas por entorno y tokens de bot
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` para autenticación OAuth/clave de API de proveedor almacenada
- `~/.openclaw/openclaw.json` para configuración de comportamiento

Usa `clawdock-show-config` cuando quieras inspeccionar rápidamente los archivos `.env` y `openclaw.json`. Redacta los valores de `.env` en la salida que imprime.

## Páginas relacionadas

- [Docker](/es/install/docker)
- [Entorno de ejecución Docker VM](/es/install/docker-vm-runtime)
- [Actualización](/es/install/updating)

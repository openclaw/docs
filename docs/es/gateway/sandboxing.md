---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Cómo funciona el aislamiento de OpenClaw: modos, ámbitos, acceso al espacio de trabajo e imágenes'
title: Aislamiento
x-i18n:
    generated_at: "2026-07-06T10:49:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60d6695c5d8f4e8d3bfb80dd387a50c104dc4e140d5974a66d5a2176594782a4
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw puede ejecutar herramientas dentro de un backend de sandbox para reducir el radio de impacto. El sandbox está desactivado de forma predeterminada y se controla mediante `agents.defaults.sandbox` (global) o `agents.list[].sandbox` (por agente). El proceso Gateway siempre permanece en el host; solo la ejecución de herramientas se mueve al sandbox cuando está habilitada.

<Note>
Este no es un límite de seguridad perfecto, pero limita de forma material el acceso al sistema de archivos y a los procesos cuando el modelo hace algo incorrecto.
</Note>

## Qué se ejecuta en sandbox

- Ejecución de herramientas: `exec`, `read`, `write`, `edit`, `apply_patch`, `process`, etc.
- El navegador opcional en sandbox (`agents.defaults.sandbox.browser`).

No se ejecuta en sandbox:

- El propio proceso Gateway.
- Cualquier herramienta a la que se le permita explícitamente ejecutarse fuera del sandbox mediante `tools.elevated`. La ejecución elevada omite el sandbox y se ejecuta en la ruta de escape configurada (`gateway` de forma predeterminada, o `node` cuando el destino de ejecución es `node`). Si el sandbox está desactivado, `tools.elevated` no cambia nada, ya que `exec` ya se ejecuta en el host. Consulta [Modo elevado](/es/tools/elevated).

## Modos, alcance y backend

Tres configuraciones independientes controlan el comportamiento del sandbox:

| Configuración | Clave                             | Valores                      | Predeterminado |
| ------------- | --------------------------------- | ---------------------------- | -------------- |
| Modo          | `agents.defaults.sandbox.mode`    | `off`, `non-main`, `all`     | `off`          |
| Alcance       | `agents.defaults.sandbox.scope`   | `agent`, `session`, `shared` | `agent`        |
| Backend       | `agents.defaults.sandbox.backend` | `docker`, `ssh`, `openshell` | `docker`       |

**Modo** controla cuándo se aplica el sandbox:

- `off`: sin sandbox.
- `non-main`: aplica sandbox a todas las sesiones excepto la sesión principal del agente. La clave de la sesión principal siempre es `agent:<agentId>:main` (o `global` cuando `session.scope` es `"global"`); no es configurable. Las sesiones de grupo/canal usan sus propias claves, por lo que siempre cuentan como no principales y se ejecutan en sandbox.
- `all`: todas las sesiones se ejecutan en un sandbox.

**Alcance** controla cuántos contenedores/entornos se crean:

- `agent`: un contenedor por agente.
- `session`: un contenedor por sesión.
- `shared`: un contenedor compartido por todas las sesiones en sandbox (las anulaciones por agente de `docker`/`ssh`/`browser` se ignoran con este alcance).

**Backend** controla qué runtime ejecuta las herramientas en sandbox. La configuración específica de SSH vive en `agents.defaults.sandbox.ssh`; la configuración específica de OpenShell vive en `plugins.entries.openshell.config`.

|                     | Docker                                  | SSH                               | OpenShell                                                   |
| ------------------- | --------------------------------------- | --------------------------------- | ----------------------------------------------------------- |
| **Dónde se ejecuta** | Contenedor local                        | Cualquier host accesible por SSH  | Sandbox gestionado por OpenShell                            |
| **Configuración**   | `scripts/sandbox-setup.sh`              | Clave SSH + host de destino       | Plugin OpenShell habilitado                                 |
| **Modelo de workspace** | Montaje enlazado o copia            | Canónico remoto (sembrar una vez) | `mirror` o `remote`                                         |
| **Control de red**  | `docker.network` (predeterminado: none) | Depende del host remoto           | Depende de OpenShell                                        |
| **Sandbox de navegador** | Compatible                         | No compatible                     | Aún no compatible                                           |
| **Montajes enlazados** | `docker.binds`                       | N/D                               | N/D                                                         |
| **Ideal para**      | Desarrollo local, aislamiento completo  | Descargar trabajo a una máquina remota | Sandboxes remotos gestionados con sincronización bidireccional opcional |

## Backend Docker

Docker es el backend predeterminado una vez que se habilita el sandbox. Ejecuta herramientas y navegadores en sandbox localmente a través del socket del daemon Docker (`/var/run/docker.sock`); el aislamiento proviene de los espacios de nombres de Docker.

Valores predeterminados: `network: "none"` (sin salida), `readOnlyRoot: true`, `capDrop: ["ALL"]`, imagen `openclaw-sandbox:bookworm-slim`.

Para exponer las GPU del host, establece `agents.defaults.sandbox.docker.gpus` (o la anulación por agente) en un valor como `"all"` o `"device=GPU-uuid"`. Esto se pasa a la marca `--gpus` de Docker y requiere un runtime de host compatible, como NVIDIA Container Toolkit.

<Warning>
**Restricciones de Docker-out-of-Docker (DooD)**

Si despliegas el propio Gateway de OpenClaw como contenedor Docker, este orquesta contenedores de sandbox hermanos usando el socket Docker del host (DooD). Esto introduce una restricción de asignación de rutas:

- **La configuración requiere rutas del host**: `workspace` en `openclaw.json` debe contener la **ruta absoluta del host** (por ejemplo, `/home/user/.openclaw/workspaces`), no la ruta interna del contenedor Gateway. El daemon Docker evalúa las rutas en relación con el espacio de nombres del sistema operativo del host, no con el propio espacio de nombres del Gateway.
- **Se requiere una asignación de volumen coincidente**: el proceso Gateway también escribe archivos de Heartbeat y de puente en esa ruta `workspace`. Da al contenedor Gateway una asignación de volumen idéntica (`-v /home/user/.openclaw:/home/user/.openclaw`) para que la misma ruta del host también se resuelva correctamente desde dentro del contenedor Gateway. Las asignaciones no coincidentes aparecen como `EACCES` cuando el Gateway intenta escribir su Heartbeat.
- **Modo de código de Codex**: cuando hay un sandbox de OpenClaw activo, OpenClaw desactiva el Code Mode nativo del servidor de aplicaciones de Codex, los servidores MCP de usuario y la ejecución de plugins respaldada por aplicaciones para ese turno (estos se ejecutan desde el proceso app-server del host del Gateway, no desde el backend de sandbox de OpenClaw), a menos que la política de herramientas del sandbox exponga las herramientas requeridas y optes por la ruta experimental de exec-server en sandbox. El acceso de shell se enruta entonces a través de herramientas respaldadas por el sandbox de OpenClaw, como `sandbox_exec` y `sandbox_process`. No montes el socket Docker del host en contenedores de sandbox de agente ni en sandboxes personalizados de Codex. Consulta [Harness de Codex](/es/plugins/codex-harness) para ver el comportamiento completo.

En hosts Ubuntu/AppArmor con el modo de sandbox Docker habilitado, la ejecución de shell `workspace-write` del servidor de aplicaciones de Codex necesita espacios de nombres de usuario sin privilegios dentro del contenedor de sandbox, y esto puede fallar antes del inicio de la shell cuando el usuario del servicio no puede crearlos. Esto también necesita un espacio de nombres de red sin privilegios cuando la salida del sandbox Docker está deshabilitada (`network: "none"`, el valor predeterminado). Síntomas comunes: `bwrap: setting up uid map: Permission denied` y `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. Ejecuta `openclaw doctor`; si informa de un fallo en la prueba de espacios de nombres bwrap de Codex, prefiere un perfil de AppArmor que conceda los espacios de nombres requeridos al proceso del servicio OpenClaw. `kernel.apparmor_restrict_unprivileged_userns=0` es una alternativa para todo el host con compromisos de seguridad; úsala solo cuando esa postura del host sea aceptable.
</Warning>

### Navegador en sandbox

- El navegador en sandbox se inicia automáticamente (garantiza que CDP sea accesible) cuando la herramienta de navegador lo necesita. Configúralo mediante `agents.defaults.sandbox.browser.autoStart` (predeterminado `true`) y `autoStartTimeoutMs` (predeterminado 12s).
- Los contenedores del navegador en sandbox usan una red Docker dedicada (`openclaw-sandbox-browser`) en lugar de la red global `bridge`. Configúrala con `agents.defaults.sandbox.browser.network`.
- `agents.defaults.sandbox.browser.cdpSourceRange` restringe el ingreso CDP en el borde del contenedor con una lista de permitidos CIDR (por ejemplo, `172.21.0.1/32`).
- El acceso de observador noVNC está protegido con contraseña de forma predeterminada; OpenClaw emite una URL de token de corta duración que sirve una página de arranque local y abre noVNC con la contraseña en el fragmento de la URL (no en la cadena de consulta ni en registros de cabeceras).
- `agents.defaults.sandbox.browser.allowHostControl` (predeterminado `false`) permite que las sesiones en sandbox apunten explícitamente al navegador del host.
- Las listas de permitidos opcionales controlan `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

## Backend SSH

Usa `backend: "ssh"` para ejecutar en sandbox `exec`, herramientas de archivos y lecturas de medios en una máquina arbitraria accesible por SSH.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Or use SecretRefs / inline contents instead of local files:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Valores predeterminados: `command: "ssh"`, `workspaceRoot: "/tmp/openclaw-sandboxes"`, `strictHostKeyChecking: true`, `updateHostKeys: true`.

- **Ciclo de vida**: OpenClaw crea una raíz remota por alcance bajo `sandbox.ssh.workspaceRoot`. En el primer uso después de crear o recrear, siembra ese workspace remoto desde el workspace local una vez. Después de eso, `exec`, `read`, `write`, `edit`, `apply_patch`, las lecturas de medios de prompt y la preparación de medios entrantes se ejecutan directamente contra el workspace remoto por SSH. OpenClaw no sincroniza automáticamente los cambios remotos de vuelta al workspace local.
- **Material de autenticación**: `identityFile`/`certificateFile`/`knownHostsFile` hacen referencia a archivos locales existentes. `identityData`/`certificateData`/`knownHostsData` aceptan cadenas en línea o SecretRefs, resueltas mediante la instantánea normal del runtime de secretos, escritas en archivos temporales con modo `0600` y eliminadas cuando termina la sesión SSH. Si se establecen una variante `*File` y una variante `*Data` para el mismo elemento, `*Data` gana para esa sesión.
- **Consecuencias de canonicidad remota**: el workspace SSH remoto se convierte en el estado real del sandbox después de la siembra inicial. Las ediciones locales del host realizadas fuera de OpenClaw después del paso de siembra no son visibles remotamente hasta que recrees el sandbox. `openclaw sandbox recreate` elimina la raíz remota por alcance y vuelve a sembrar desde local en el siguiente uso. El sandbox de navegador no es compatible con este backend, y la configuración `sandbox.docker.*` no se aplica a él.

## Backend OpenShell

Usa `backend: "openshell"` para ejecutar herramientas en sandbox en un entorno remoto gestionado por OpenShell. OpenShell reutiliza el mismo transporte SSH y el mismo puente de sistema de archivos remoto que el backend SSH genérico, y añade el ciclo de vida de OpenShell (`sandbox create/get/delete/ssh-config`) más un modo opcional de sincronización de workspace `mirror`.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote", // mirror | remote
        },
      },
    },
  },
}
```

`mode: "mirror"` (predeterminado) mantiene el workspace local como canónico: OpenClaw sincroniza lo local hacia el sandbox antes de `exec` y sincroniza de vuelta después. `mode: "remote"` siembra el workspace remoto una vez desde local y luego ejecuta `exec`/`read`/`write`/`edit`/`apply_patch` directamente contra el workspace remoto sin sincronizar de vuelta; las ediciones locales después de la siembra son invisibles hasta que ejecutes `openclaw sandbox recreate`. Con `scope: "agent"` o `scope: "shared"`, ese workspace remoto se comparte con el mismo alcance. Limitaciones actuales: el navegador en sandbox aún no es compatible, y `sandbox.docker.binds` no se aplica a este backend.

`openclaw sandbox list`/`recreate`/prune all tratan los runtimes de OpenShell igual que los runtimes de Docker; la lógica de depuración tiene en cuenta el backend.

Para ver todos los requisitos previos, la referencia de configuración, la comparación de modos de workspace y los detalles del ciclo de vida, consulta [OpenShell](/es/gateway/openshell).

## Acceso al workspace

`agents.defaults.sandbox.workspaceAccess` controla qué puede ver el sandbox:

| Valor            | Comportamiento                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `none` (predeterminado) | Las herramientas ven un espacio de trabajo de sandbox aislado bajo `~/.openclaw/sandboxes`. |
| `ro`             | Monta el espacio de trabajo del agente como solo lectura en `/agent` (deshabilita `write`/`edit`/`apply_patch`). |
| `rw`             | Monta el espacio de trabajo del agente con lectura/escritura en `/workspace`.            |

Con el backend OpenShell, el modo `mirror` sigue usando el espacio de trabajo local como fuente canónica entre turnos de exec, el modo `remote` usa el espacio de trabajo remoto de OpenShell como canónico después de la semilla inicial, y `workspaceAccess: "ro"`/`"none"` sigue restringiendo el comportamiento de escritura de la misma manera.

Los medios entrantes se copian en el espacio de trabajo de sandbox activo (`media/inbound/*`).

<Note>
**Skills**: la herramienta `read` está arraigada en la raíz del sandbox. Con `workspaceAccess: "none"`, OpenClaw refleja las Skills elegibles en el espacio de trabajo del sandbox (`.../skills`) para que puedan leerse. Con `"rw"`, las Skills del espacio de trabajo se pueden leer desde `/workspace/skills`, y las Skills elegibles administradas, incluidas o de plugins se materializan en la ruta generada de solo lectura `/workspace/.openclaw/sandbox-skills/skills`.
</Note>

## Montajes bind personalizados

`agents.defaults.sandbox.docker.binds` monta directorios adicionales del host en el contenedor. Formato: `host:container:mode` (por ejemplo, `"/home/user/source:/source:rw"`).

Los binds globales y por agente se fusionan (no se reemplazan). Bajo `scope: "shared"`, se ignoran los binds por agente.

`agents.defaults.sandbox.browser.binds` monta directorios adicionales del host solo en el contenedor del **navegador de sandbox**. Cuando se establece (incluido `[]`), reemplaza `docker.binds` para el contenedor del navegador; cuando se omite, el contenedor del navegador recurre a `docker.binds`.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

<Warning>
**Seguridad de bind**

- Los binds omiten el sistema de archivos del sandbox: exponen rutas del host con el modo que establezcas (`:ro` o `:rw`).
- OpenClaw bloquea fuentes de bind peligrosas de forma predeterminada: rutas del sistema (`/etc`, `/proc`, `/sys`, `/dev`, `/root`, `/boot`), directorios de socket de Docker (`/run`, `/var/run` y sus variantes `docker.sock`), y raíces comunes de credenciales del directorio home (`~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, `~/.ssh`).
- La validación normaliza la ruta de origen y luego la resuelve de nuevo a través del ancestro existente más profundo antes de volver a comprobar rutas bloqueadas y raíces permitidas, por lo que los escapes mediante padre de enlace simbólico fallan de forma cerrada incluso cuando la hoja final aún no existe (por ejemplo, `/workspace/run-link/new-file` sigue resolviéndose como `/var/run/...` si `run-link` apunta allí).
- Los destinos de bind que ocultan los puntos de montaje reservados del contenedor (`/workspace`, `/agent`) también se bloquean de forma predeterminada; anula esto con `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true`.
- Las fuentes de bind fuera de las raíces permitidas del espacio de trabajo/espacio de trabajo del agente se bloquean de forma predeterminada; anula esto con `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true`. Las raíces permitidas se canonicalizan de la misma forma, por lo que una ruta que solo parece estar dentro de la lista permitida antes de la resolución de enlaces simbólicos se sigue rechazando por estar fuera de las raíces permitidas.
- Los montajes sensibles (secretos, claves SSH, credenciales de servicio) deberían ser `:ro` salvo que sean absolutamente necesarios.
- Combínalo con `workspaceAccess: "ro"` si solo necesitas acceso de lectura al espacio de trabajo; los modos de bind permanecen independientes.
- Consulta [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated) para saber cómo interactúan los binds con la política de herramientas y la ejecución elevada.

</Warning>

## Imágenes y configuración

Imagen de Docker predeterminada: `openclaw-sandbox:bookworm-slim`

<Note>
**Checkout de fuente frente a instalación npm**

Los scripts auxiliares `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` y `scripts/sandbox-browser-setup.sh` solo están disponibles cuando se ejecutan desde un [checkout de fuente](https://github.com/openclaw/openclaw). No están incluidos en el paquete npm.

Si instalaste OpenClaw mediante `npm install -g openclaw`, usa en su lugar los comandos `docker build` en línea que se muestran abajo.
</Note>

<Steps>
  <Step title="Construye la imagen predeterminada">
    Desde un checkout de fuente:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Desde una instalación npm (no se necesita checkout de fuente):

    ```bash
    docker build -t openclaw-sandbox:bookworm-slim - <<'DOCKERFILE'
    FROM debian:bookworm-slim
    ENV DEBIAN_FRONTEND=noninteractive
    RUN apt-get update && apt-get install -y --no-install-recommends \
      bash ca-certificates curl git jq python3 ripgrep \
      && rm -rf /var/lib/apt/lists/*
    RUN useradd --create-home --shell /bin/bash sandbox
    USER sandbox
    WORKDIR /home/sandbox
    CMD ["sleep", "infinity"]
    DOCKERFILE
    ```

    La imagen predeterminada **no** incluye Node. Si una Skill necesita Node (u otros runtimes), incorpora una imagen personalizada o instala mediante `sandbox.docker.setupCommand` (requiere salida de red + raíz escribible + usuario root).

    OpenClaw no sustituye silenciosamente por `debian:bookworm-slim` sin formato cuando falta `openclaw-sandbox:bookworm-slim`. Las ejecuciones de sandbox que apuntan a la imagen predeterminada fallan rápido con una instrucción de compilación hasta que la construyas, porque la imagen incluida contiene `python3` para los auxiliares de escritura/edición del sandbox.

  </Step>
  <Step title="Opcional: construye la imagen común">
    Para una imagen de sandbox más funcional con herramientas comunes (por ejemplo, `curl`, `jq`, Node 24, pnpm, `python3` y `git`):

    Desde un checkout de fuente:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Desde una instalación npm, construye primero la imagen predeterminada (ver arriba) y luego construye la imagen común encima usando [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) del repositorio.

    Luego establece `agents.defaults.sandbox.docker.image` en `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Opcional: construye la imagen del navegador de sandbox">
    Desde un checkout de fuente:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Desde una instalación npm, construye usando [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) del repositorio.

  </Step>
</Steps>

De forma predeterminada, los contenedores de sandbox de Docker se ejecutan **sin red**. Anúlalo con `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Valores predeterminados de Chromium del navegador de sandbox">
    La imagen incluida del navegador de sandbox aplica flags de inicio de Chromium conservadores para cargas de trabajo en contenedores:

    - `--remote-debugging-address=127.0.0.1`
    - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
    - `--user-data-dir=${HOME}/.chrome`
    - `--no-first-run`
    - `--no-default-browser-check`
    - `--disable-dev-shm-usage`
    - `--disable-background-networking`
    - `--disable-breakpad`
    - `--disable-crash-reporter`
    - `--no-zygote`
    - `--metrics-recording-only`
    - `--password-store=basic`
    - `--use-mock-keychain`
    - `--headless=new` cuando `browser.headless` está habilitado.
    - `--no-sandbox --disable-setuid-sandbox` cuando `browser.noSandbox` está habilitado.
    - `--disable-3d-apis`, `--disable-gpu`, `--disable-software-rasterizer` de forma predeterminada; estos flags de endurecimiento gráfico ayudan a los contenedores sin compatibilidad con GPU. Establece `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` si tu carga de trabajo necesita WebGL u otras funciones 3D.
    - `--disable-extensions` de forma predeterminada; establece `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` para flujos que dependen de extensiones.
    - `--renderer-process-limit=2` de forma predeterminada; controlado por `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, donde `0` mantiene el valor predeterminado de Chromium.

    Si necesitas un perfil de runtime diferente, usa una imagen de navegador personalizada y proporciona tu propio entrypoint. Para perfiles locales (sin contenedor) de Chromium, usa `browser.extraArgs` para añadir flags de inicio adicionales.

  </Accordion>
  <Accordion title="Valores predeterminados de seguridad de red">
    - `network: "host"` está bloqueado.
    - `network: "container:<id>"` está bloqueado de forma predeterminada (riesgo de omitir mediante unión de namespace).
    - Anulación de emergencia: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Las instalaciones de Docker y el Gateway en contenedor viven aquí: [Docker](/es/install/docker)

Para despliegues de Gateway con Docker, `scripts/docker/setup.sh` puede inicializar la configuración de sandbox. Establece `OPENCLAW_SANDBOX=1` (o `true`/`yes`/`on`) para habilitar esa ruta. Anula la ubicación del socket con `OPENCLAW_DOCKER_SOCKET`. Referencia completa de configuración y entorno: [Docker](/es/install/docker#agent-sandbox).

## setupCommand (configuración única del contenedor)

`setupCommand` se ejecuta **una vez** después de crear el contenedor de sandbox (no en cada ejecución). Se ejecuta dentro del contenedor mediante `sh -lc`.

Rutas:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Por agente: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Errores comunes">
    - El `docker.network` predeterminado es `"none"` (sin salida), por lo que las instalaciones de paquetes fallarán.
    - `docker.network: "container:<id>"` requiere `dangerouslyAllowContainerNamespaceJoin: true` y es solo para emergencias.
    - `readOnlyRoot: true` impide escrituras; establece `readOnlyRoot: false` o incorpora una imagen personalizada.
    - `user` debe ser root para instalaciones de paquetes (omite `user` o establece `user: "0:0"`).
    - Sandbox exec **no** hereda `process.env` del host. Usa `agents.defaults.sandbox.docker.env` (o una imagen personalizada) para claves de API de Skills.
    - Los valores en `agents.defaults.sandbox.docker.env` se pasan como variables de entorno explícitas del contenedor Docker. Cualquiera con acceso al daemon de Docker puede inspeccionarlas con comandos de metadatos de Docker como `docker inspect`. Usa una imagen personalizada, un archivo de secreto montado u otra ruta de entrega de secretos si esa exposición de metadatos no es aceptable.

  </Accordion>
</AccordionGroup>

## Política de herramientas y vías de escape

Las políticas de permitir/denegar herramientas siguen aplicándose antes que las reglas de sandbox. Si una herramienta está denegada globalmente o por agente, el sandbox no la recupera.

`tools.elevated` es una vía de escape explícita que ejecuta `exec` fuera del sandbox (`gateway` de forma predeterminada, o `node` cuando el destino de exec es `node`). Las directivas `/exec` solo se aplican para remitentes autorizados y persisten por sesión; para deshabilitar `exec` de forma estricta, usa la denegación en la política de herramientas (consulta [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated)).

Depuración:

- `openclaw sandbox list` muestra contenedores de sandbox, estado, coincidencia de imagen, antigüedad, tiempo inactivo y sesión/agente asociado.
- `openclaw sandbox explain [--session <key>] [--agent <id>]` inspecciona el modo de sandbox efectivo, el espacio de trabajo del host, el workdir del runtime, montajes de Docker, política de herramientas y claves de configuración para corrección. Su campo `workspaceRoot` sigue siendo la raíz de sandbox configurada; `effectiveHostWorkspaceRoot` muestra dónde vive realmente el espacio de trabajo activo.
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` elimina contenedores/entornos para que se vuelvan a crear con la configuración actual en el siguiente uso.
- Consulta [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated) para el modelo mental de “¿por qué está bloqueado esto?”.

## Anulaciones multiagente

Cada agente puede anular sandbox + herramientas: `agents.list[].sandbox` y `agents.list[].tools` (más `agents.list[].tools.sandbox.tools` para la política de herramientas de sandbox). Consulta [Multi-Agent Sandbox & Tools](/es/tools/multi-agent-sandbox-tools) para la precedencia.

## Ejemplo mínimo de habilitación

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## Relacionado

- [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) -- anulaciones por agente y precedencia
- [OpenShell](/es/gateway/openshell) -- configuración del backend de sandbox gestionado, modos de espacio de trabajo y referencia de configuración
- [Configuración de sandbox](/es/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox frente a política de herramientas frente a elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated) -- depuración de "¿por qué está bloqueado esto?"
- [Seguridad](/es/gateway/security)

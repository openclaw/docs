---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Cómo funciona el aislamiento de OpenClaw: modos, ámbitos, acceso al espacio de trabajo e imágenes'
title: Aislamiento
x-i18n:
    generated_at: "2026-07-05T11:20:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c12441ddcecc6bbd2ed6dfa28af843c1492ab39621cc7ead25d51e0a7bacba6a
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw puede ejecutar la ejecución de herramientas dentro de un backend de sandbox para reducir el radio de impacto. El sandboxing está desactivado de forma predeterminada y se controla mediante `agents.defaults.sandbox` (global) o `agents.list[].sandbox` (por agente). El proceso Gateway siempre permanece en el host; solo la ejecución de herramientas pasa al sandbox cuando está habilitado.

<Note>
Este no es un límite de seguridad perfecto, pero limita de forma material el acceso al sistema de archivos y a los procesos cuando el modelo hace algo imprudente.
</Note>

## Qué se ejecuta en sandbox

- Ejecución de herramientas: `exec`, `read`, `write`, `edit`, `apply_patch`, `process`, etc.
- El navegador opcional en sandbox (`agents.defaults.sandbox.browser`).

No se ejecuta en sandbox:

- El propio proceso Gateway.
- Cualquier herramienta autorizada explícitamente para ejecutarse fuera del sandbox mediante `tools.elevated`. La ejecución elevada omite el sandboxing y se ejecuta en la ruta de escape configurada (`gateway` de forma predeterminada, o `node` cuando el destino de ejecución es `node`). Si el sandboxing está desactivado, `tools.elevated` no cambia nada, ya que exec ya se ejecuta en el host. Consulta [Modo elevado](/es/tools/elevated).

## Modos, alcance y backend

Tres ajustes independientes controlan el comportamiento del sandbox:

| Ajuste | Clave                             | Valores                      | Predeterminado |
| ------ | --------------------------------- | ---------------------------- | -------------- |
| Modo   | `agents.defaults.sandbox.mode`    | `off`, `non-main`, `all`     | `off`          |
| Alcance | `agents.defaults.sandbox.scope`  | `agent`, `session`, `shared` | `agent`        |
| Backend | `agents.defaults.sandbox.backend` | `docker`, `ssh`, `openshell` | `docker`       |

**Modo** controla cuándo se aplica el sandboxing:

- `off`: sin sandboxing.
- `non-main`: ejecuta en sandbox todas las sesiones excepto la sesión principal del agente. La clave de sesión principal siempre es `agent:<agentId>:main` (o `global` cuando `session.scope` es `"global"`); no es configurable. Las sesiones de grupo/canal usan sus propias claves, por lo que siempre cuentan como no principales y se ejecutan en sandbox.
- `all`: todas las sesiones se ejecutan en un sandbox.

**Alcance** controla cuántos contenedores/entornos se crean:

- `agent`: un contenedor por agente.
- `session`: un contenedor por sesión.
- `shared`: un contenedor compartido por todas las sesiones en sandbox (las sobrescrituras por agente de `docker`/`ssh`/`browser` se ignoran con este alcance).

**Backend** controla qué runtime ejecuta las herramientas en sandbox. La configuración específica de SSH está en `agents.defaults.sandbox.ssh`; la configuración específica de OpenShell está en `plugins.entries.openshell.config`.

|                     | Docker                           | SSH                              | OpenShell                                                   |
| ------------------- | -------------------------------- | -------------------------------- | ----------------------------------------------------------- |
| **Dónde se ejecuta** | Contenedor local                 | Cualquier host accesible por SSH | Sandbox gestionado por OpenShell                            |
| **Configuración**   | `scripts/sandbox-setup.sh`       | Clave SSH + host de destino      | Plugin OpenShell habilitado                                 |
| **Modelo de workspace** | Montaje bind o copia          | Canónico remoto (sembrar una vez) | `mirror` o `remote`                                        |
| **Control de red**  | `docker.network` (predeterminado: ninguno) | Depende del host remoto | Depende de OpenShell                                        |
| **Sandbox de navegador** | Compatible                  | No compatible                    | Aún no compatible                                           |
| **Montajes bind**   | `docker.binds`                   | N/A                              | N/A                                                         |
| **Ideal para**      | Desarrollo local, aislamiento completo | Descargar trabajo a una máquina remota | Sandboxes remotos gestionados con sincronización bidireccional opcional |

## Backend Docker

Docker es el backend predeterminado una vez habilitado el sandboxing. Ejecuta herramientas y navegadores en sandbox localmente a través del socket del daemon de Docker (`/var/run/docker.sock`); el aislamiento proviene de los namespaces de Docker.

Valores predeterminados: `network: "none"` (sin salida), `readOnlyRoot: true`, `capDrop: ["ALL"]`, imagen `openclaw-sandbox:bookworm-slim`.

Para exponer GPU del host, establece `agents.defaults.sandbox.docker.gpus` (o la sobrescritura por agente) en un valor como `"all"` o `"device=GPU-uuid"`. Esto se pasa a la marca `--gpus` de Docker y requiere un runtime de host compatible, como NVIDIA Container Toolkit.

<Warning>
**Restricciones de Docker-fuera-de-Docker (DooD)**

Si despliegas el propio OpenClaw Gateway como un contenedor Docker, orquesta contenedores sandbox hermanos usando el socket de Docker del host (DooD). Esto introduce una restricción de mapeo de rutas:

- **La configuración requiere rutas del host**: `openclaw.json` `workspace` debe contener la **ruta absoluta del host** (por ejemplo, `/home/user/.openclaw/workspaces`), no la ruta interna del contenedor Gateway. El daemon de Docker evalúa las rutas en relación con el namespace del SO host, no con el namespace propio de Gateway.
- **Se requiere un mapa de volúmenes coincidente**: El proceso Gateway también escribe archivos de Heartbeat y puente en esa ruta de `workspace`. Dale al contenedor Gateway un mapa de volúmenes idéntico (`-v /home/user/.openclaw:/home/user/.openclaw`) para que la misma ruta del host también se resuelva correctamente desde dentro del contenedor Gateway. Los mapeos no coincidentes aparecen como `EACCES` cuando Gateway intenta escribir su Heartbeat.
- **Modo de código de Codex**: cuando un sandbox de OpenClaw está activo, OpenClaw desactiva el Code Mode nativo del app-server de Codex, los servidores MCP de usuario y la ejecución de plugins respaldada por la app para ese turno (se ejecutan desde el proceso app-server en el host de Gateway, no desde el backend de sandbox de OpenClaw), a menos que la política de herramientas del sandbox exponga las herramientas requeridas y optes por la ruta experimental del exec-server de sandbox. El acceso a shell entonces se enruta a través de herramientas respaldadas por el sandbox de OpenClaw, como `sandbox_exec` y `sandbox_process`. No montes el socket de Docker del host en contenedores sandbox de agentes ni en sandboxes personalizados de Codex. Consulta [Arnés de Codex](/es/plugins/codex-harness) para ver el comportamiento completo.

En hosts Ubuntu/AppArmor con el modo sandbox de Docker habilitado, la ejecución de shell `workspace-write` del app-server de Codex necesita namespaces de usuario sin privilegios dentro del contenedor sandbox, y esto puede fallar antes del inicio de shell cuando el usuario del servicio no puede crearlos. Esto también necesita un namespace de red sin privilegios cuando la salida del sandbox de Docker está deshabilitada (`network: "none"`, el valor predeterminado). Síntomas comunes: `bwrap: setting up uid map: Permission denied` y `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. Ejecuta `openclaw doctor`; si informa de un fallo de sondeo de namespace bwrap de Codex, prefiere un perfil AppArmor que conceda los namespaces requeridos al proceso de servicio de OpenClaw. `kernel.apparmor_restrict_unprivileged_userns=0` es una alternativa de reserva para todo el host con contrapartidas de seguridad; úsala solo cuando la postura de ese host sea aceptable.
</Warning>

### Navegador en sandbox

- El navegador en sandbox se inicia automáticamente (garantiza que CDP sea accesible) cuando la herramienta de navegador lo necesita. Configura esto mediante `agents.defaults.sandbox.browser.autoStart` (predeterminado `true`) y `autoStartTimeoutMs` (predeterminado 12 s).
- Los contenedores del navegador en sandbox usan una red Docker dedicada (`openclaw-sandbox-browser`) en lugar de la red global `bridge`. Configúrala con `agents.defaults.sandbox.browser.network`.
- `agents.defaults.sandbox.browser.cdpSourceRange` restringe la entrada CDP en el borde del contenedor con una lista de permitidos CIDR (por ejemplo, `172.21.0.1/32`).
- El acceso de observador noVNC está protegido con contraseña de forma predeterminada; OpenClaw emite una URL de token de corta duración que sirve una página de arranque local y abre noVNC con la contraseña en el fragmento de la URL (no en la cadena de consulta ni en los registros de encabezados).
- `agents.defaults.sandbox.browser.allowHostControl` (predeterminado `false`) permite que las sesiones en sandbox apunten explícitamente al navegador del host.
- Listas de permitidos opcionales controlan `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

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

- **Ciclo de vida**: OpenClaw crea una raíz remota por alcance bajo `sandbox.ssh.workspaceRoot`. En el primer uso tras crear o recrear, siembra una vez ese workspace remoto desde el workspace local. Después, `exec`, `read`, `write`, `edit`, `apply_patch`, las lecturas de medios del prompt y la preparación de medios entrantes se ejecutan directamente contra el workspace remoto mediante SSH. OpenClaw no sincroniza automáticamente los cambios remotos de vuelta al workspace local.
- **Material de autenticación**: `identityFile`/`certificateFile`/`knownHostsFile` hacen referencia a archivos locales existentes. `identityData`/`certificateData`/`knownHostsData` aceptan cadenas en línea o SecretRefs, resueltas a través de la instantánea normal del runtime de secretos, escritas en archivos temporales con modo `0600` y eliminadas cuando termina la sesión SSH. Si se configuran una variante `*File` y una variante `*Data` para el mismo elemento, `*Data` gana para esa sesión.
- **Consecuencias de canónico remoto**: el workspace SSH remoto se convierte en el estado real del sandbox después de la siembra inicial. Las ediciones locales del host realizadas fuera de OpenClaw después del paso de siembra no son visibles de forma remota hasta que recrees el sandbox. `openclaw sandbox recreate` elimina la raíz remota por alcance y vuelve a sembrar desde local en el siguiente uso. El sandboxing del navegador no es compatible con este backend, y los ajustes `sandbox.docker.*` no se aplican a él.

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

`mode: "mirror"` (predeterminado) mantiene el workspace local como canónico: OpenClaw sincroniza lo local hacia el sandbox antes de `exec` y sincroniza de vuelta después. `mode: "remote"` siembra el workspace remoto una vez desde local, luego ejecuta `exec`/`read`/`write`/`edit`/`apply_patch` directamente contra el workspace remoto sin sincronizar de vuelta; las ediciones locales después de la siembra son invisibles hasta que ejecutes `openclaw sandbox recreate`. Con `scope: "agent"` o `scope: "shared"`, ese workspace remoto se comparte en el mismo alcance. Limitaciones actuales: el navegador en sandbox aún no es compatible, y `sandbox.docker.binds` no se aplica a este backend.

`openclaw sandbox list`/`recreate`/prune all tratan los runtimes de OpenShell igual que los runtimes de Docker; la lógica de prune es consciente del backend.

Para ver todos los requisitos previos, la referencia de configuración, la comparación de modos de workspace y los detalles del ciclo de vida, consulta [OpenShell](/es/gateway/openshell).

## Acceso al workspace

`agents.defaults.sandbox.workspaceAccess` controla qué puede ver el sandbox:

| Valor            | Comportamiento                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| `none` (predeterminado) | Las herramientas ven un espacio de trabajo de entorno aislado bajo `~/.openclaw/sandboxes`.                    |
| `ro`             | Monta el espacio de trabajo del agente como de solo lectura en `/agent` (deshabilita `write`/`edit`/`apply_patch`). |
| `rw`             | Monta el espacio de trabajo del agente con lectura/escritura en `/workspace`.                                    |

Con el backend OpenShell, el modo `mirror` sigue usando el espacio de trabajo local como fuente canónica entre turnos de exec, el modo `remote` usa el espacio de trabajo remoto de OpenShell como canónico después de la semilla inicial, y `workspaceAccess: "ro"`/`"none"` sigue restringiendo el comportamiento de escritura de la misma manera.

Los medios entrantes se copian en el espacio de trabajo activo del entorno aislado (`media/inbound/*`).

<Note>
**Skills**: la herramienta `read` está arraigada en la raíz del entorno aislado. Con `workspaceAccess: "none"`, OpenClaw replica las Skills aptas en el espacio de trabajo del entorno aislado (`.../skills`) para que se puedan leer. Con `"rw"`, las Skills del espacio de trabajo se pueden leer desde `/workspace/skills`, y las Skills aptas administradas, incluidas o de plugins se materializan en la ruta generada de solo lectura `/workspace/.openclaw/sandbox-skills/skills`.
</Note>

## Montajes bind personalizados

`agents.defaults.sandbox.docker.binds` monta directorios adicionales del host en el contenedor. Formato: `host:container:mode` (por ejemplo, `"/home/user/source:/source:rw"`).

Los binds globales y por agente se combinan (no se reemplazan). Bajo `scope: "shared"`, los binds por agente se ignoran.

`agents.defaults.sandbox.browser.binds` monta directorios adicionales del host solo en el contenedor del **navegador del entorno aislado**. Cuando se establece (incluido `[]`), reemplaza `docker.binds` para el contenedor del navegador; cuando se omite, el contenedor del navegador recurre a `docker.binds`.

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
**Seguridad de los binds**

- Los binds omiten el sistema de archivos del entorno aislado: exponen rutas del host con el modo que establezcas (`:ro` o `:rw`).
- OpenClaw bloquea fuentes de bind peligrosas de forma predeterminada: rutas del sistema (`/etc`, `/proc`, `/sys`, `/dev`, `/root`, `/boot`), directorios de socket de Docker (`/run`, `/var/run` y sus variantes `docker.sock`) y raíces comunes de credenciales del directorio personal (`~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, `~/.ssh`).
- La validación normaliza la ruta de origen y luego la resuelve de nuevo a través del ancestro existente más profundo antes de volver a comprobar las rutas bloqueadas y las raíces permitidas, de modo que los escapes mediante padres con symlink fallan cerrados incluso cuando la hoja final aún no existe (por ejemplo, `/workspace/run-link/new-file` sigue resolviéndose como `/var/run/...` si `run-link` apunta allí).
- Los destinos de bind que sombrean los puntos de montaje reservados del contenedor (`/workspace`, `/agent`) también se bloquean de forma predeterminada; anúlalo con `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true`.
- Las fuentes de bind fuera de las raíces permitidas del espacio de trabajo/espacio de trabajo del agente se bloquean de forma predeterminada; anúlalo con `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true`. Las raíces permitidas se canonicalizan de la misma manera, por lo que una ruta que solo parece estar dentro de la lista permitida antes de la resolución de symlinks sigue rechazándose por estar fuera de las raíces permitidas.
- Los montajes sensibles (secretos, claves SSH, credenciales de servicio) deberían ser `:ro` salvo que sean absolutamente necesarios.
- Combínalo con `workspaceAccess: "ro"` si solo necesitas acceso de lectura al espacio de trabajo; los modos de bind permanecen independientes.
- Consulta [Entorno aislado vs política de herramientas vs elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated) para saber cómo interactúan los binds con la política de herramientas y exec elevado.

</Warning>

## Imágenes y configuración

Imagen de Docker predeterminada: `openclaw-sandbox:bookworm-slim`

<Note>
**Checkout de código fuente vs instalación npm**

Los scripts auxiliares `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` y `scripts/sandbox-browser-setup.sh` solo están disponibles cuando se ejecuta desde un [checkout de código fuente](https://github.com/openclaw/openclaw). No se incluyen en el paquete npm.

Si instalaste OpenClaw mediante `npm install -g openclaw`, usa en su lugar los comandos inline de `docker build` que se muestran abajo.
</Note>

<Steps>
  <Step title="Build the default image">
    Desde un checkout de código fuente:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Desde una instalación npm (no se necesita checkout de código fuente):

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

    La imagen predeterminada **no** incluye Node. Si una skill necesita Node (u otros runtimes), integra una imagen personalizada o instala mediante `sandbox.docker.setupCommand` (requiere salida de red + raíz escribible + usuario root).

    OpenClaw no sustituye silenciosamente por `debian:bookworm-slim` sin modificar cuando falta `openclaw-sandbox:bookworm-slim`. Las ejecuciones de entorno aislado que apuntan a la imagen predeterminada fallan rápido con una instrucción de compilación hasta que la compiles, porque la imagen incluida lleva `python3` para los auxiliares de escritura/edición del entorno aislado.

  </Step>
  <Step title="Optional: build the common image">
    Para una imagen de entorno aislado más funcional con herramientas comunes (por ejemplo `curl`, `jq`, Node 24, pnpm, `python3` y `git`):

    Desde un checkout de código fuente:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Desde una instalación npm, compila primero la imagen predeterminada (consulta arriba) y luego compila la imagen común encima usando [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) del repositorio.

    Luego establece `agents.defaults.sandbox.docker.image` en `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Optional: build the sandbox browser image">
    Desde un checkout de código fuente:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Desde una instalación npm, compila usando [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) del repositorio.

  </Step>
</Steps>

De forma predeterminada, los contenedores de entorno aislado de Docker se ejecutan **sin red**. Anúlalo con `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    La imagen incluida del navegador del entorno aislado aplica flags de inicio de Chromium conservadores para cargas de trabajo en contenedores:

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
    - `--disable-3d-apis`, `--disable-gpu`, `--disable-software-rasterizer` de forma predeterminada; estos flags de endurecimiento gráfico ayudan a contenedores sin soporte de GPU. Establece `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` si tu carga de trabajo necesita WebGL u otras funciones 3D.
    - `--disable-extensions` de forma predeterminada; establece `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` para flujos que dependen de extensiones.
    - `--renderer-process-limit=2` de forma predeterminada; controlado por `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, donde `0` mantiene el valor predeterminado de Chromium.

    Si necesitas un perfil de runtime diferente, usa una imagen de navegador personalizada y proporciona tu propio entrypoint. Para perfiles locales (sin contenedor) de Chromium, usa `browser.extraArgs` para añadir flags de inicio adicionales.

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` está bloqueado.
    - `network: "container:<id>"` está bloqueado de forma predeterminada (riesgo de omisión al unirse al namespace).
    - Anulación de emergencia: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Las instalaciones de Docker y el Gateway en contenedor se describen aquí: [Docker](/es/install/docker)

Para despliegues de Gateway con Docker, `scripts/docker/setup.sh` puede inicializar la configuración del entorno aislado. Establece `OPENCLAW_SANDBOX=1` (o `true`/`yes`/`on`) para habilitar esa ruta. Anula la ubicación del socket con `OPENCLAW_DOCKER_SOCKET`. Configuración completa y referencia de entorno: [Docker](/es/install/docker#agent-sandbox).

## setupCommand (configuración única del contenedor)

`setupCommand` se ejecuta **una vez** después de crear el contenedor del entorno aislado (no en cada ejecución). Se ejecuta dentro del contenedor mediante `sh -lc`.

Rutas:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Por agente: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Common pitfalls">
    - El `docker.network` predeterminado es `"none"` (sin salida), por lo que las instalaciones de paquetes fallarán.
    - `docker.network: "container:<id>"` requiere `dangerouslyAllowContainerNamespaceJoin: true` y es solo para emergencias.
    - `readOnlyRoot: true` impide escrituras; establece `readOnlyRoot: false` o integra una imagen personalizada.
    - `user` debe ser root para instalaciones de paquetes (omite `user` o establece `user: "0:0"`).
    - El exec del entorno aislado **no** hereda `process.env` del host. Usa `agents.defaults.sandbox.docker.env` (o una imagen personalizada) para claves de API de skills.
    - Los valores en `agents.defaults.sandbox.docker.env` se pasan como variables de entorno explícitas del contenedor Docker. Cualquiera con acceso al demonio de Docker puede inspeccionarlas con comandos de metadatos de Docker como `docker inspect`. Usa una imagen personalizada, un archivo secreto montado u otra ruta de entrega de secretos si esa exposición de metadatos no es aceptable.

  </Accordion>
</AccordionGroup>

## Política de herramientas y vías de escape

Las políticas de permitir/denegar herramientas siguen aplicándose antes que las reglas del entorno aislado. Si una herramienta se deniega globalmente o por agente, el aislamiento no la recupera.

`tools.elevated` es una vía de escape explícita que ejecuta `exec` fuera del entorno aislado (`gateway` de forma predeterminada, o `node` cuando el destino de exec es `node`). Las directivas `/exec` solo se aplican a remitentes autorizados y persisten por sesión; para deshabilitar `exec` de forma estricta, usa la denegación de política de herramientas (consulta [Entorno aislado vs política de herramientas vs elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated)).

Depuración:

- `openclaw sandbox list` muestra los contenedores de entorno aislado, estado, coincidencia de imagen, antigüedad, tiempo inactivo y sesión/agente asociado.
- `openclaw sandbox explain [--session <key>] [--agent <id>]` inspecciona el modo de entorno aislado efectivo, la política de herramientas y las claves de configuración para corregir.
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` elimina contenedores/entornos para que se vuelvan a crear con la configuración actual en el siguiente uso.
- Consulta [Entorno aislado vs política de herramientas vs elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated) para el modelo mental de "¿por qué está bloqueado esto?".

## Anulaciones multiagente

Cada agente puede anular entorno aislado + herramientas: `agents.list[].sandbox` y `agents.list[].tools` (más `agents.list[].tools.sandbox.tools` para la política de herramientas del entorno aislado). Consulta [Entorno aislado y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) para la precedencia.

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
- [OpenShell](/es/gateway/openshell) -- configuración del backend de sandbox administrado, modos de espacio de trabajo y referencia de configuración
- [Configuración del sandbox](/es/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox frente a política de herramientas frente a Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated) -- depuración de "¿por qué está bloqueado esto?"
- [Seguridad](/es/gateway/security)

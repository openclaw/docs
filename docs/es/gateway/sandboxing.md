---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Cómo funciona el aislamiento de OpenClaw: modos, ámbitos, acceso al espacio de trabajo e imágenes'
title: Aislamiento de procesos
x-i18n:
    generated_at: "2026-07-22T10:36:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a3668dc512a8ff30732290ee68e9dd29a3a2e9c106e6e39077a97bfbd90098f7
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw puede ejecutar herramientas dentro de un backend de entorno aislado para reducir el radio de impacto. El aislamiento está desactivado de forma predeterminada y se controla mediante `agents.defaults.sandbox` (global) o `agents.entries.*.sandbox` (por agente). El proceso del Gateway permanece siempre en el host; solo la ejecución de herramientas se traslada al entorno aislado cuando está habilitado.

<Note>
Este no es un límite de seguridad perfecto, pero restringe considerablemente el acceso al sistema de archivos y a los procesos cuando el modelo hace algo indebido.
</Note>

## Qué se ejecuta en el entorno aislado

- Ejecución de herramientas: `exec`, `read`, `write`, `edit`, `apply_patch`, `process`, etc.
- El navegador opcional del entorno aislado (`agents.defaults.sandbox.browser`).

No se ejecuta en el entorno aislado:

- El propio proceso del Gateway.
- Cualquier herramienta que tenga permiso explícito para ejecutarse fuera del entorno aislado mediante `tools.elevated`. La ejecución elevada omite el aislamiento y se ejecuta en la ruta de escape configurada (`gateway` de forma predeterminada, o `node` cuando el destino de ejecución es `node`). Si el aislamiento está desactivado, `tools.elevated` no cambia nada, ya que la ejecución ya se realiza en el host. Consulte [Modo elevado](/es/tools/elevated).

## Modos, ámbito y backend

Tres ajustes independientes controlan el comportamiento del entorno aislado:

| Ajuste  | Clave                             | Valores                      | Valor predeterminado |
| ------- | --------------------------------- | ---------------------------- | -------------------- |
| Modo    | `agents.defaults.sandbox.mode`                | `off`, `non-main`, `all` | `off` |
| Ámbito  | `agents.defaults.sandbox.scope`                | `agent`, `session`, `shared` | `agent` |
| Backend | `agents.defaults.sandbox.backend`                | `docker`, `ssh`, `openshell` | `docker` |

El **modo** controla cuándo se aplica el aislamiento:

- `off`: sin aislamiento.
- `non-main`: aísla todas las sesiones excepto la sesión principal del agente. La clave de la sesión principal siempre es `agent:<agentId>:main` (o `global` cuando `session.scope` es `"global"`); no se puede configurar. Las sesiones de grupo o canal usan sus propias claves, por lo que siempre se consideran no principales y se ejecutan en un entorno aislado.
- `all`: todas las sesiones se ejecutan en un entorno aislado.

El **ámbito** controla cuántos contenedores o entornos se crean:

- `agent`: un contenedor por agente.
- `session`: un contenedor por sesión.
- `shared`: un contenedor compartido por todas las sesiones aisladas (las sustituciones por agente `docker`/`ssh`/`browser` se ignoran en este ámbito).

El **backend** controla qué entorno de ejecución ejecuta las herramientas aisladas. La configuración específica de SSH se encuentra en `agents.defaults.sandbox.ssh`; la configuración específica de OpenShell se encuentra en `plugins.entries.openshell.config`.

|                          | Docker                            | SSH                                    | OpenShell                                                     |
| ------------------------ | --------------------------------- | -------------------------------------- | ------------------------------------------------------------- |
| **Dónde se ejecuta**     | Contenedor local                  | Cualquier host accesible mediante SSH  | Entorno aislado administrado por OpenShell                    |
| **Configuración**        | `scripts/sandbox-setup.sh`                | Clave SSH + host de destino            | Plugin OpenShell habilitado                                   |
| **Modelo del espacio de trabajo** | Montaje enlazado o copia | Remoto canónico (inicialización única) | `mirror` o `remote`                       |
| **Control de red**       | `docker.network` (predeterminado: ninguno) | Depende del host remoto       | Depende de OpenShell                                          |
| **Navegador aislado**    | Compatible                        | No compatible                          | Aún no compatible                                             |
| **Montajes enlazados**   | `docker.binds`                | N/D                                    | N/D                                                           |
| **Ideal para**           | Desarrollo local, aislamiento completo | Descarga de trabajo en una máquina remota | Entornos aislados remotos administrados con sincronización bidireccional opcional |

## Backend de Docker

Docker es el backend predeterminado una vez habilitado el aislamiento. Ejecuta las herramientas y los navegadores aislados localmente mediante el socket del daemon de Docker (`/var/run/docker.sock`); el aislamiento proviene de los espacios de nombres de Docker.

Valores predeterminados: `network: "none"` (sin salida), `readOnlyRoot: true`, `capDrop: ["ALL"]`, imagen `openclaw-sandbox:bookworm-slim`.

Para exponer las GPU del host, establezca `agents.defaults.sandbox.docker.gpus` (o la sustitución por agente) en un valor como `"all"` o `"device=GPU-uuid"`. Este valor se pasa a la opción `--gpus` de Docker y requiere un entorno de ejecución del host compatible, como NVIDIA Container Toolkit.

<Warning>
**Docker fuera de Docker (DooD): restricciones**

Si el propio Gateway de OpenClaw se implementa como contenedor de Docker, este coordina contenedores aislados hermanos mediante el socket de Docker del host (DooD). Esto introduce una restricción de asignación de rutas:

- **La configuración requiere rutas del host**: `openclaw.json` `workspace` debe contener la **ruta absoluta del host** (por ejemplo, `/home/user/.openclaw/workspaces`), no la ruta interna del contenedor del Gateway. El daemon de Docker evalúa las rutas en relación con el espacio de nombres del sistema operativo host, no con el espacio de nombres propio del Gateway.
- **Se requiere una asignación de volumen coincidente**: el proceso del Gateway también escribe archivos de Heartbeat y del puente en esa ruta `workspace`. Asigne al contenedor del Gateway un volumen idéntico (`-v /home/user/.openclaw:/home/user/.openclaw`) para que la misma ruta del host también se resuelva correctamente desde el interior del contenedor del Gateway. Las asignaciones que no coincidan producen `EACCES` cuando el Gateway intenta escribir su Heartbeat.
- **Modo de código de Codex**: cuando hay un entorno aislado de OpenClaw activo, OpenClaw deshabilita durante ese turno el modo de código nativo del servidor de aplicaciones de Codex, los servidores MCP del usuario y la ejecución de plugins respaldada por aplicaciones (estos se ejecutan desde el proceso del servidor de aplicaciones en el host del Gateway, no desde el backend del entorno aislado de OpenClaw), salvo que la política de herramientas del entorno aislado exponga las herramientas necesarias y se habilite expresamente la ruta experimental del servidor de ejecución del entorno aislado. El acceso al shell se enruta entonces mediante herramientas respaldadas por el entorno aislado de OpenClaw, como `sandbox_exec` y `sandbox_process`. No monte el socket de Docker del host en contenedores aislados de agentes ni en entornos aislados personalizados de Codex. Consulte [Harness de Codex](/es/plugins/codex-harness) para conocer el comportamiento completo.

En hosts Ubuntu/AppArmor con el modo de entorno aislado de Docker habilitado, la ejecución del shell `workspace-write` del servidor de aplicaciones de Codex necesita espacios de nombres de usuario sin privilegios dentro del contenedor aislado, y puede fallar antes de que se inicie el shell si el usuario del servicio no puede crearlos. También se necesita un espacio de nombres de red sin privilegios cuando la salida del entorno aislado de Docker está deshabilitada (`network: "none"`, el valor predeterminado). Síntomas habituales: `bwrap: setting up uid map: Permission denied` y `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. Ejecute `openclaw doctor`; si informa de un fallo en la prueba del espacio de nombres de bwrap de Codex, es preferible usar un perfil de AppArmor que conceda los espacios de nombres necesarios al proceso del servicio OpenClaw. `kernel.apparmor_restrict_unprivileged_userns=0` es una alternativa que afecta a todo el host y tiene implicaciones de seguridad; úsela solo cuando esa postura del host sea aceptable.
</Warning>

### Navegador aislado

- El navegador aislado se inicia automáticamente (garantiza que CDP sea accesible) cuando la herramienta del navegador lo necesita. Se configura mediante `agents.defaults.sandbox.browser.autoStart` (valor predeterminado: `true`) y `autoStartTimeoutMs` (valor predeterminado: 12s).
- Los contenedores del navegador aislado usan una red de Docker dedicada (`openclaw-sandbox-browser`) en lugar de la red global `bridge`. Se configura mediante `agents.defaults.sandbox.browser.network`.
- `agents.defaults.sandbox.browser.cdpSourceRange` restringe la entrada de CDP en el perímetro del contenedor mediante una lista de CIDR permitidos (por ejemplo, `172.21.0.1/32`).
- El acceso de observación mediante noVNC está protegido por contraseña de forma predeterminada; OpenClaw emite una URL con un token de corta duración que sirve una página de arranque local y abre noVNC con la contraseña en el fragmento de la URL (no en la cadena de consulta ni en los registros de encabezados).
- `agents.defaults.sandbox.browser.allowHostControl` (valor predeterminado: `false`) permite que las sesiones aisladas se dirijan explícitamente al navegador del host.
- Las listas de permitidos opcionales restringen `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

## Backend de SSH

Use `backend: "ssh"` para aislar `exec`, las herramientas de archivos y las lecturas de contenido multimedia en cualquier máquina accesible mediante SSH.

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
          // O use SecretRefs o contenido insertado directamente en lugar de archivos locales:
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

- **Ciclo de vida**: OpenClaw crea una raíz remota por ámbito en `sandbox.ssh.workspaceRoot`. La primera vez que se usa tras crearla o recrearla, inicializa una sola vez ese espacio de trabajo remoto a partir del espacio de trabajo local. Después, `exec`, `read`, `write`, `edit`, `apply_patch`, las lecturas de contenido multimedia de las instrucciones y la preparación del contenido multimedia entrante se ejecutan directamente en el espacio de trabajo remoto mediante SSH. OpenClaw no sincroniza automáticamente los cambios remotos con el espacio de trabajo local.
- **Material de autenticación**: `identityFile`/`certificateFile`/`knownHostsFile` hacen referencia a archivos locales existentes. `identityData`/`certificateData`/`knownHostsData` aceptan cadenas insertadas directamente o SecretRefs, que se resuelven mediante la instantánea normal del entorno de ejecución de secretos, se escriben en archivos temporales con el modo `0600` y se eliminan cuando finaliza la sesión SSH. Si se establecen una variante `*File` y otra `*Data` para el mismo elemento, `*Data` prevalece durante esa sesión.
- **Consecuencias del modelo remoto canónico**: el espacio de trabajo SSH remoto se convierte en el estado real del entorno aislado después de la inicialización. Las modificaciones locales del host realizadas fuera de OpenClaw después de la inicialización no son visibles de forma remota hasta que se recrea el entorno aislado. `openclaw sandbox recreate` elimina la raíz remota por ámbito y vuelve a inicializarla a partir del entorno local en el siguiente uso. El aislamiento del navegador no es compatible con este backend y los ajustes `sandbox.docker.*` no se aplican a él.

## Backend de OpenShell

Use `backend: "openshell"` para aislar herramientas en un entorno remoto administrado por OpenShell. OpenShell reutiliza el mismo transporte SSH y el mismo puente del sistema de archivos remoto que el backend de SSH genérico, y añade el ciclo de vida de OpenShell (`sandbox create/get/delete/ssh-config`), además de un modo opcional de sincronización del espacio de trabajo `mirror`.

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

`mode: "mirror"` (predeterminado) mantiene canónico el espacio de trabajo local: OpenClaw sincroniza el contenido local con el sandbox antes de `exec` y lo vuelve a sincronizar después. `mode: "remote"` inicializa una vez el espacio de trabajo remoto a partir del local y, a continuación, ejecuta `exec`/`read`/`write`/`edit`/`apply_patch` directamente en el espacio de trabajo remoto sin volver a sincronizarlo; las modificaciones locales posteriores a la inicialización no son visibles hasta que se ejecuta `openclaw sandbox recreate`. Con `scope: "agent"` o `scope: "shared"`, ese espacio de trabajo remoto se comparte en el mismo ámbito. Limitaciones actuales: el navegador del sandbox aún no es compatible y `sandbox.docker.binds` no se aplica a este backend.

`openclaw sandbox list`/`recreate`/prune tratan los runtimes de OpenShell igual que los runtimes de Docker; la lógica de depuración tiene en cuenta el backend.

Para consultar todos los requisitos previos, la referencia de configuración, la comparación de modos del espacio de trabajo y los detalles del ciclo de vida, véase [OpenShell](/es/gateway/openshell).

## Acceso al espacio de trabajo

`agents.defaults.sandbox.workspaceAccess` controla lo que puede ver el sandbox:

| Valor            | Comportamiento                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `none` (predeterminado) | Las herramientas ven un espacio de trabajo aislado del sandbox en `~/.openclaw/sandboxes`.                    |
| `ro`             | Monta el espacio de trabajo del agente en modo de solo lectura en `/agent` (desactiva `write`/`edit`/`apply_patch`). |
| `rw`             | Monta el espacio de trabajo del agente en modo de lectura y escritura en `/workspace`.                                    |

Con el backend de OpenShell, el modo `mirror` sigue utilizando el espacio de trabajo local como fuente canónica entre turnos de ejecución, el modo `remote` utiliza el espacio de trabajo remoto de OpenShell como fuente canónica después de la inicialización y `workspaceAccess: "ro"`/`"none"` siguen restringiendo las operaciones de escritura de la misma manera.

Los archivos multimedia entrantes se copian en el espacio de trabajo activo del sandbox (`media/inbound/*`).

<Note>
**Skills**: la herramienta `read` tiene como raíz el sandbox. Con `workspaceAccess: "none"`, OpenClaw replica las Skills aptas en el espacio de trabajo del sandbox (`.../skills`) para que puedan leerse. Con `"rw"`, las Skills del espacio de trabajo pueden leerse desde `/workspace/skills`, y las Skills aptas administradas, incluidas o de plugins se materializan en la ruta generada de solo lectura `/workspace/.openclaw/sandbox-skills/skills`.
</Note>

## Varias carpetas para un agente

Utilice montajes bind de Docker cuando un agente en sandbox necesite más que su espacio de trabajo principal. Cada entrada asigna una carpeta del host a una ruta del contenedor con un modo de acceso explícito:

```text
host-directory:container-directory:ro
host-directory:container-directory:rw
```

- `ro` hace que la carpeta montada sea de solo lectura dentro del sandbox.
- `rw` permite que las herramientas y los procesos del sandbox modifiquen la carpeta del host.
- La ruta del contenedor es la ruta que utiliza el agente. Las rutas del host no se exponen automáticamente.

Este ejemplo proporciona al agente `research` un espacio de trabajo principal con permiso de escritura, material de referencia de solo lectura en `/reference` y una carpeta de salida independiente con permiso de escritura en `/drafts`:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        scope: "agent",
      },
    },
    list: [
      {
        id: "research",
        workspace: "/srv/openclaw/research-workspace",
        sandbox: {
          workspaceAccess: "rw",
          docker: {
            binds: ["/srv/shared/reference:/reference:ro", "/srv/shared/drafts:/drafts:rw"],
            // Obligatorio porque estas fuentes están fuera del espacio de trabajo del agente.
            dangerouslyAllowExternalBindSources: true,
          },
        },
      },
    ],
  },
}
```

`workspaceAccess` y los modos de los montajes bind son independientes:

| Ajuste                          | Controla                                                                    |
| -------------------------------- | --------------------------------------------------------------------------- |
| `workspaceAccess: "none"`        | Utiliza un espacio de trabajo aislado del sandbox; no expone el espacio de trabajo del agente.    |
| `workspaceAccess: "ro"`          | Monta el espacio de trabajo del agente en modo de solo lectura en `/agent`.                           |
| `workspaceAccess: "rw"`          | Monta el espacio de trabajo del agente en modo de lectura y escritura en `/workspace`.                      |
| Entrada `docker.binds` `:ro`/`:rw` | Controla únicamente esa carpeta adicional del host en la ruta configurada del contenedor. |

Cambiar `workspaceAccess` no cambia un montaje bind adicional de `ro` a `rw`, ni viceversa. Los valores globales y por agente de `docker.binds` se combinan. Mantenga `scope: "agent"` o `"session"` para los montajes bind por agente; `scope: "shared"` ignora todas las sobrescrituras de Docker por agente y utiliza únicamente los montajes bind globales.

Los montajes bind son el límite compatible para varias carpetas porque Docker construye la vista del sistema de archivos del contenedor con aislamiento de montajes, y el modo `ro`/`rw` se aplica a todos los procesos del sandbox. Ese límite abarca `exec`, las herramientas del sistema de archivos, los procesos secundarios y las bibliotecas sin duplicar las comprobaciones de autorización de rutas en cada ruta de código de OpenClaw. Una lista de rutas permitidas en el host no puede proporcionar el mismo límite completo cuando un shell o una dependencia permitidos pueden acceder directamente a los archivos.

La opción voluntaria `dangerouslyAllowExternalBindSources` solo permite fuentes situadas fuera de las raíces de los espacios de trabajo. No desactiva las comprobaciones de OpenClaw sobre rutas del sistema bloqueadas, credenciales, sockets de Docker, directorios padre que sean enlaces simbólicos ni destinos reservados. Utilice la carpeta más pequeña posible, use `ro` salvo que se requiera escritura y vuelva a crear el sandbox después de cambiar los montajes:

```bash
openclaw sandbox recreate --agent research
```

### Otros comportamientos de los montajes bind

`agents.defaults.sandbox.docker.binds` configura los montajes globales. El formato es el mismo, `host:container:mode` (por ejemplo, `"/home/user/source:/source:rw"`).

`agents.defaults.sandbox.browser.binds` monta directorios adicionales del host únicamente en el contenedor del **navegador del sandbox**. Cuando se establece (incluido `[]`), reemplaza `docker.binds` para el contenedor del navegador; cuando se omite, el contenedor del navegador utiliza `docker.binds` como alternativa.

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
**Seguridad de los montajes bind**

- Los montajes bind eluden el sistema de archivos del sandbox: exponen rutas del host con el modo que se establezca (`:ro` o `:rw`).
- OpenClaw bloquea de forma predeterminada las fuentes peligrosas de montajes bind: rutas del sistema (`/etc`, `/proc`, `/sys`, `/dev`, `/root`, `/boot`), directorios de sockets de Docker (`/run`, `/var/run` y sus variantes `docker.sock`) y raíces habituales de credenciales del directorio personal (`~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, `~/.ssh`).
- La validación normaliza la ruta de origen y, después, vuelve a resolverla mediante el ancestro existente más profundo antes de volver a comprobar las rutas bloqueadas y las raíces permitidas, por lo que los escapes mediante directorios padre que sean enlaces simbólicos fallan de forma segura aunque la hoja final todavía no exista (por ejemplo, `/workspace/run-link/new-file` se sigue resolviendo como `/var/run/...` si `run-link` apunta allí).
- Los destinos de montajes bind que ocultan los puntos de montaje reservados del contenedor (`/workspace`, `/agent`) también se bloquean de forma predeterminada; sobrescriba este comportamiento con `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true`.
- Las fuentes de montajes bind situadas fuera de las raíces permitidas del espacio de trabajo o del espacio de trabajo del agente se bloquean de forma predeterminada; sobrescriba este comportamiento con `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true`. Las raíces permitidas se canonicalizan de la misma manera, por lo que una ruta que solo parece estar dentro de la lista permitida antes de resolver los enlaces simbólicos se sigue rechazando por estar fuera de las raíces permitidas.
- Los montajes sensibles (secretos, claves SSH y credenciales de servicios) deben ser `:ro` salvo que sea absolutamente necesario.
- Combine esta opción con `workspaceAccess: "ro"` si solo se necesita acceso de lectura al espacio de trabajo; los modos de los montajes bind siguen siendo independientes.
- Véase [Sandbox frente a política de herramientas frente a ejecución elevada](/es/gateway/sandbox-vs-tool-policy-vs-elevated) para saber cómo interactúan los montajes bind con la política de herramientas y la ejecución elevada.

</Warning>

## Imágenes y configuración

Imagen predeterminada de Docker: `openclaw-sandbox:bookworm-slim`

<Note>
**Checkout del código fuente frente a instalación mediante npm**

Los scripts auxiliares `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` y `scripts/sandbox-browser-setup.sh` solo están disponibles cuando se ejecuta desde un [checkout del código fuente](https://github.com/openclaw/openclaw). No se incluyen en el paquete npm.

Si OpenClaw se instaló mediante `npm install -g openclaw`, utilice en su lugar los comandos `docker build` en línea que se muestran a continuación.
</Note>

<Steps>
  <Step title="Compilar la imagen predeterminada">
    Desde un checkout del código fuente:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Desde una instalación mediante npm (no se necesita un checkout del código fuente):

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

    La imagen predeterminada **no** incluye Node. Si una Skill necesita Node (u otros runtimes), puede crear una imagen personalizada que los incluya o instalarlos mediante `sandbox.docker.setupCommand` (requiere salida de red, una raíz con permiso de escritura y el usuario root).

    OpenClaw no sustituye de forma silenciosa `debian:bookworm-slim` sin modificar cuando falta `openclaw-sandbox:bookworm-slim`. Las ejecuciones del sandbox que utilizan la imagen predeterminada fallan de inmediato con instrucciones de compilación hasta que se compile, porque la imagen incluida contiene `python3` para los auxiliares de escritura y edición del sandbox.

  </Step>
  <Step title="Opcional: compilar la imagen común">
    Para obtener una imagen de sandbox más funcional con herramientas habituales (por ejemplo, `curl`, `jq`, Node 24, pnpm, `python3` y `git`):

    Desde un checkout del código fuente:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Desde una instalación mediante npm, compile primero la imagen predeterminada (véase arriba) y, después, compile sobre ella la imagen común mediante [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) del repositorio.

    A continuación, establezca `agents.defaults.sandbox.docker.image` en `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Opcional: compilar la imagen del navegador del sandbox">
    Desde un checkout del código fuente:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Desde una instalación mediante npm, compile mediante [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) del repositorio.

  </Step>
</Steps>

De forma predeterminada, los contenedores del sandbox de Docker se ejecutan **sin red**. Sobrescriba este comportamiento con `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Valores predeterminados de Chromium para el navegador del sandbox">
    La imagen incluida del navegador del sandbox aplica indicadores de inicio conservadores de Chromium para cargas de trabajo en contenedores:

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
    - `--disable-3d-apis`, `--disable-gpu`, `--disable-software-rasterizer` de forma predeterminada; estas opciones de protección gráfica ayudan a los contenedores sin compatibilidad con GPU. Establezca `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` si su carga de trabajo necesita WebGL u otras funciones 3D.
    - `--disable-extensions` de forma predeterminada; establezca `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` para los flujos que dependen de extensiones.
    - `--renderer-process-limit=2` de forma predeterminada; se controla mediante `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, donde `0` mantiene el valor predeterminado de Chromium.

    Si necesita un perfil de entorno de ejecución diferente, use una imagen de navegador personalizada y proporcione su propio punto de entrada. Para los perfiles locales de Chromium (fuera de contenedores), use `browser.extraArgs` para añadir opciones de inicio adicionales.

  </Accordion>
  <Accordion title="Valores predeterminados de seguridad de red">
    - `network: "host"` está bloqueado.
    - `network: "container:<id>"` está bloqueado de forma predeterminada (riesgo de eludir las restricciones al unirse al espacio de nombres).
    - Anulación de emergencia: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Las instalaciones de Docker y el Gateway en contenedores se encuentran aquí: [Docker](/es/install/docker)

Para las implementaciones del Gateway con Docker, `scripts/docker/setup.sh` puede inicializar la configuración del entorno aislado. Establezca `OPENCLAW_SANDBOX=1` (o `true`/`yes`/`on`) para habilitar esa ruta. Reemplace la ubicación del socket mediante `OPENCLAW_DOCKER_SOCKET`. Configuración completa y referencia de variables de entorno: [Docker](/es/install/docker#agent-sandbox).

## setupCommand (configuración única del contenedor)

`setupCommand` se ejecuta **una vez** después de crear el contenedor del entorno aislado (no en cada ejecución). Se ejecuta dentro del contenedor mediante `sh -lc`.

Rutas:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Por agente: `agents.entries.*.sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Problemas habituales">
    - El valor predeterminado de `docker.network` es `"none"` (sin salida a la red), por lo que las instalaciones de paquetes fallarán.
    - `docker.network: "container:<id>"` requiere `dangerouslyAllowContainerNamespaceJoin: true` y solo debe usarse como medida de emergencia.
    - `readOnlyRoot: true` impide las escrituras; establezca `readOnlyRoot: false` o cree una imagen personalizada.
    - `user` debe ser root para instalar paquetes (omita `user` o establezca `user: "0:0"`).
    - La ejecución en el entorno aislado **no** hereda `process.env` del host. Use `agents.defaults.sandbox.docker.env` (o una imagen personalizada) para las claves de API de Skills.
    - Los valores de `agents.defaults.sandbox.docker.env` se pasan como variables de entorno explícitas del contenedor de Docker. Cualquier persona con acceso al daemon de Docker puede inspeccionarlos mediante comandos de metadatos de Docker, como `docker inspect`. Use una imagen personalizada, un archivo de secretos montado u otra ruta de entrega de secretos si esa exposición en los metadatos no es aceptable.

  </Accordion>
</AccordionGroup>

## Política de herramientas y vías de escape

Las políticas de permiso y denegación de herramientas siguen aplicándose antes que las reglas del entorno aislado. Si una herramienta está denegada globalmente o para un agente, el aislamiento no vuelve a habilitarla.

`tools.elevated` es una vía de escape explícita que ejecuta `exec` fuera del entorno aislado (`gateway` de forma predeterminada, o `node` cuando el destino de ejecución es `node`). Las directivas `/exec` solo se aplican a remitentes autorizados y persisten durante la sesión; para deshabilitar por completo `exec`, use la denegación de la política de herramientas (consulte [Entorno aislado frente a política de herramientas frente a modo elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated)).

Depuración:

- `openclaw sandbox list` muestra los contenedores del entorno aislado, su estado, la coincidencia de imagen, la antigüedad, el tiempo de inactividad y la sesión o el agente asociados.
- `openclaw sandbox explain [--session <key>] [--agent <id>]` inspecciona el modo efectivo del entorno aislado, el espacio de trabajo del host, el directorio de trabajo del entorno de ejecución, los montajes de Docker, la política de herramientas y las claves de configuración para corregirlo. Su campo `workspaceRoot` sigue siendo la raíz configurada del entorno aislado; `effectiveHostWorkspaceRoot` muestra dónde se encuentra realmente el espacio de trabajo activo.
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` elimina los contenedores o entornos para que se vuelvan a crear con la configuración actual la próxima vez que se usen.
- Consulte [Entorno aislado frente a política de herramientas frente a modo elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated) para comprender el motivo de los bloqueos.

## Anulaciones para varios agentes

Cada agente puede anular la configuración del entorno aislado y las herramientas: `agents.entries.*.sandbox` y `agents.entries.*.tools` (además de `agents.entries.*.tools.sandbox.tools` para la política de herramientas del entorno aislado). Consulte [Entorno aislado y herramientas para varios agentes](/es/tools/multi-agent-sandbox-tools) para conocer la precedencia.

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

## Contenido relacionado

- [Entorno aislado y herramientas para varios agentes](/es/tools/multi-agent-sandbox-tools) -- anulaciones por agente y precedencia
- [OpenShell](/es/gateway/openshell) -- configuración del backend administrado del entorno aislado, modos de espacio de trabajo y referencia de configuración
- [Configuración del entorno aislado](/es/gateway/config-agents#agentsdefaultssandbox)
- [Entorno aislado frente a política de herramientas frente a modo elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated) -- depuración del motivo de los bloqueos
- [Seguridad](/es/gateway/security)

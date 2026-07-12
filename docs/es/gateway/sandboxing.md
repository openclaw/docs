---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Cómo funciona el aislamiento de OpenClaw: modos, ámbitos, acceso al espacio de trabajo e imágenes'
title: Aislamiento de procesos
x-i18n:
    generated_at: "2026-07-11T23:08:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60d6695c5d8f4e8d3bfb80dd387a50c104dc4e140d5974a66d5a2176594782a4
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw puede ejecutar herramientas dentro de un backend de entorno aislado para reducir el radio de impacto. El aislamiento está desactivado de forma predeterminada y se controla mediante `agents.defaults.sandbox` (global) o `agents.list[].sandbox` (por agente). El proceso del Gateway siempre permanece en el host; cuando se habilita el aislamiento, solo la ejecución de herramientas se traslada al entorno aislado.

<Note>
Este no es un límite de seguridad perfecto, pero restringe considerablemente el acceso al sistema de archivos y a los procesos cuando el modelo hace algo indebido.
</Note>

## Qué se ejecuta en el entorno aislado

- Ejecución de herramientas: `exec`, `read`, `write`, `edit`, `apply_patch`, `process`, etc.
- El navegador aislado opcional (`agents.defaults.sandbox.browser`).

No se ejecutan en el entorno aislado:

- El propio proceso del Gateway.
- Cualquier herramienta a la que se permita explícitamente ejecutarse fuera del entorno aislado mediante `tools.elevated`. La ejecución con privilegios elevados omite el aislamiento y se ejecuta en la ruta de escape configurada (`gateway` de forma predeterminada, o `node` cuando el destino de ejecución es `node`). Si el aislamiento está desactivado, `tools.elevated` no cambia nada, ya que la ejecución se realiza en el host. Consulta [Modo con privilegios elevados](/es/tools/elevated).

## Modos, ámbito y backend

Tres ajustes independientes controlan el comportamiento del entorno aislado:

| Ajuste  | Clave                             | Valores                      | Valor predeterminado |
| ------- | --------------------------------- | ---------------------------- | -------------------- |
| Modo    | `agents.defaults.sandbox.mode`    | `off`, `non-main`, `all`     | `off`                |
| Ámbito  | `agents.defaults.sandbox.scope`   | `agent`, `session`, `shared` | `agent`              |
| Backend | `agents.defaults.sandbox.backend` | `docker`, `ssh`, `openshell` | `docker`             |

El **modo** controla cuándo se aplica el aislamiento:

- `off`: sin aislamiento.
- `non-main`: aísla todas las sesiones excepto la sesión principal del agente. La clave de la sesión principal siempre es `agent:<agentId>:main` (o `global` cuando `session.scope` es `"global"`); no se puede configurar. Las sesiones de grupo/canal usan sus propias claves, por lo que siempre se consideran no principales y se ejecutan de forma aislada.
- `all`: todas las sesiones se ejecutan en un entorno aislado.

El **ámbito** controla cuántos contenedores o entornos se crean:

- `agent`: un contenedor por agente.
- `session`: un contenedor por sesión.
- `shared`: un contenedor compartido por todas las sesiones aisladas (las anulaciones de `docker`/`ssh`/`browser` por agente se ignoran en este ámbito).

El **backend** controla qué entorno de ejecución ejecuta las herramientas aisladas. La configuración específica de SSH se encuentra en `agents.defaults.sandbox.ssh`; la configuración específica de OpenShell se encuentra en `plugins.entries.openshell.config`.

|                          | Docker                              | SSH                                | OpenShell                                                    |
| ------------------------ | ----------------------------------- | ---------------------------------- | ------------------------------------------------------------ |
| **Dónde se ejecuta**     | Contenedor local                    | Cualquier host accesible por SSH   | Entorno aislado administrado por OpenShell                    |
| **Configuración**        | `scripts/sandbox-setup.sh`          | Clave SSH + host de destino        | Plugin OpenShell habilitado                                  |
| **Modelo de espacio de trabajo** | Montaje enlazado o copia   | Remoto canónico (inicialización única) | `mirror` o `remote`                                      |
| **Control de red**       | `docker.network` (predeterminado: ninguna) | Depende del host remoto     | Depende de OpenShell                                          |
| **Navegador aislado**    | Compatible                          | No compatible                      | Aún no compatible                                            |
| **Montajes enlazados**   | `docker.binds`                      | N/D                                | N/D                                                          |
| **Ideal para**           | Desarrollo local, aislamiento total | Descargar trabajo a una máquina remota | Entornos aislados remotos administrados con sincronización bidireccional opcional |

## Backend de Docker

Docker es el backend predeterminado una vez habilitado el aislamiento. Ejecuta las herramientas y los navegadores aislados localmente mediante el socket del daemon de Docker (`/var/run/docker.sock`); el aislamiento proviene de los espacios de nombres de Docker.

Valores predeterminados: `network: "none"` (sin salida), `readOnlyRoot: true`, `capDrop: ["ALL"]`, imagen `openclaw-sandbox:bookworm-slim`.

Para exponer las GPU del host, establece `agents.defaults.sandbox.docker.gpus` (o la anulación por agente) en un valor como `"all"` o `"device=GPU-uuid"`. Este valor se pasa a la opción `--gpus` de Docker y requiere un entorno de ejecución de host compatible, como NVIDIA Container Toolkit.

<Warning>
**Restricciones de Docker fuera de Docker (DooD)**

Si implementas el Gateway de OpenClaw como un contenedor de Docker, este organiza contenedores aislados hermanos mediante el socket de Docker del host (DooD). Esto introduce una restricción de asignación de rutas:

- **La configuración requiere rutas del host**: `workspace` en `openclaw.json` debe contener la **ruta absoluta del host** (por ejemplo, `/home/user/.openclaw/workspaces`), no la ruta interna del contenedor del Gateway. El daemon de Docker evalúa las rutas con respecto al espacio de nombres del sistema operativo del host, no al espacio de nombres propio del Gateway.
- **Se requiere una asignación de volumen coincidente**: el proceso del Gateway también escribe archivos de Heartbeat y de puente en esa ruta `workspace`. Asigna al contenedor del Gateway un volumen idéntico (`-v /home/user/.openclaw:/home/user/.openclaw`) para que la misma ruta del host también se resuelva correctamente desde dentro del contenedor del Gateway. Las asignaciones no coincidentes se manifiestan como `EACCES` cuando el Gateway intenta escribir su Heartbeat.
- **Modo de código de Codex**: cuando hay un entorno aislado de OpenClaw activo, OpenClaw deshabilita durante ese turno el modo de código nativo del servidor de aplicaciones de Codex, los servidores MCP del usuario y la ejecución de plugins respaldados por aplicaciones (estos se ejecutan desde el proceso del servidor de aplicaciones en el host del Gateway, no desde el backend de entorno aislado de OpenClaw), a menos que la política de herramientas del entorno aislado exponga las herramientas necesarias y habilites la ruta experimental del servidor de ejecución del entorno aislado. El acceso al shell se canaliza entonces mediante herramientas respaldadas por el entorno aislado de OpenClaw, como `sandbox_exec` y `sandbox_process`. No montes el socket de Docker del host en los contenedores aislados de los agentes ni en entornos aislados personalizados de Codex. Consulta [Entorno de Codex](/es/plugins/codex-harness) para conocer el comportamiento completo.

En hosts Ubuntu/AppArmor con el modo de entorno aislado de Docker habilitado, la ejecución del shell con `workspace-write` del servidor de aplicaciones de Codex necesita espacios de nombres de usuario sin privilegios dentro del contenedor aislado, y esto puede fallar antes de iniciar el shell cuando el usuario del servicio no puede crearlos. También se necesita un espacio de nombres de red sin privilegios cuando la salida del entorno aislado de Docker está deshabilitada (`network: "none"`, el valor predeterminado). Síntomas habituales: `bwrap: setting up uid map: Permission denied` y `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. Ejecuta `openclaw doctor`; si informa de un fallo en la comprobación de espacios de nombres de bwrap de Codex, da preferencia a un perfil de AppArmor que conceda los espacios de nombres necesarios al proceso del servicio de OpenClaw. `kernel.apparmor_restrict_unprivileged_userns=0` es una alternativa para todo el host que conlleva contrapartidas de seguridad; úsala solo cuando esa postura de seguridad sea aceptable para el host.
</Warning>

### Navegador aislado

- El navegador aislado se inicia automáticamente (para garantizar que CDP sea accesible) cuando la herramienta de navegador lo necesita. Configúralo mediante `agents.defaults.sandbox.browser.autoStart` (valor predeterminado: `true`) y `autoStartTimeoutMs` (valor predeterminado: 12 s).
- Los contenedores del navegador aislado usan una red de Docker dedicada (`openclaw-sandbox-browser`) en lugar de la red global `bridge`. Configúrala mediante `agents.defaults.sandbox.browser.network`.
- `agents.defaults.sandbox.browser.cdpSourceRange` restringe la entrada de CDP en el perímetro del contenedor mediante una lista de CIDR permitidos (por ejemplo, `172.21.0.1/32`).
- El acceso de observación mediante noVNC está protegido con contraseña de forma predeterminada; OpenClaw emite una URL con un token de corta duración que sirve una página de arranque local y abre noVNC con la contraseña en el fragmento de la URL (no en la cadena de consulta ni en los registros de encabezados).
- `agents.defaults.sandbox.browser.allowHostControl` (valor predeterminado: `false`) permite que las sesiones aisladas se dirijan explícitamente al navegador del host.
- Las listas de permitidos opcionales restringen `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

## Backend de SSH

Usa `backend: "ssh"` para aislar `exec`, las herramientas de archivos y las lecturas multimedia en cualquier máquina accesible por SSH.

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
          // O usa SecretRefs o contenido en línea en lugar de archivos locales:
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

- **Ciclo de vida**: OpenClaw crea una raíz remota por ámbito en `sandbox.ssh.workspaceRoot`. En el primer uso después de crearla o volver a crearla, inicializa una vez ese espacio de trabajo remoto a partir del espacio de trabajo local. Después, `exec`, `read`, `write`, `edit`, `apply_patch`, las lecturas multimedia de solicitudes y la preparación de contenido multimedia entrante operan directamente sobre el espacio de trabajo remoto mediante SSH. OpenClaw no sincroniza automáticamente los cambios remotos con el espacio de trabajo local.
- **Material de autenticación**: `identityFile`/`certificateFile`/`knownHostsFile` hacen referencia a archivos locales existentes. `identityData`/`certificateData`/`knownHostsData` aceptan cadenas en línea o SecretRefs, que se resuelven mediante la instantánea habitual del entorno de ejecución de secretos, se escriben en archivos temporales con el modo `0600` y se eliminan cuando finaliza la sesión SSH. Si se establecen las variantes `*File` y `*Data` para el mismo elemento, `*Data` prevalece durante esa sesión.
- **Consecuencias del modelo remoto canónico**: el espacio de trabajo SSH remoto se convierte en el estado real del entorno aislado después de la inicialización. Las modificaciones locales del host realizadas fuera de OpenClaw después de la inicialización no serán visibles de forma remota hasta que vuelvas a crear el entorno aislado. `openclaw sandbox recreate` elimina la raíz remota por ámbito y vuelve a inicializarla desde el entorno local en el siguiente uso. Este backend no admite el aislamiento del navegador y los ajustes `sandbox.docker.*` no se aplican.

## Backend de OpenShell

Usa `backend: "openshell"` para aislar las herramientas en un entorno remoto administrado por OpenShell. OpenShell reutiliza el mismo transporte SSH y el mismo puente de sistema de archivos remoto que el backend SSH genérico, y añade el ciclo de vida de OpenShell (`sandbox create/get/delete/ssh-config`), además de un modo opcional de sincronización del espacio de trabajo `mirror`.

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

`mode: "mirror"` (valor predeterminado) mantiene el espacio de trabajo local como canónico: OpenClaw sincroniza el contenido local con el entorno aislado antes de `exec` y lo sincroniza de vuelta después. `mode: "remote"` inicializa una vez el espacio de trabajo remoto desde el local y, a continuación, ejecuta `exec`/`read`/`write`/`edit`/`apply_patch` directamente sobre el espacio de trabajo remoto sin volver a sincronizarlo; los cambios locales posteriores a la inicialización no serán visibles hasta que ejecutes `openclaw sandbox recreate`. Con `scope: "agent"` o `scope: "shared"`, ese espacio de trabajo remoto se comparte en el mismo ámbito. Limitaciones actuales: el navegador aislado aún no es compatible y `sandbox.docker.binds` no se aplica a este backend.

`openclaw sandbox list`/`recreate`/prune tratan los entornos de ejecución de OpenShell igual que los de Docker; la lógica de depuración tiene en cuenta el backend.

Para consultar todos los requisitos previos, la referencia de configuración, la comparación de los modos del espacio de trabajo y los detalles del ciclo de vida, consulta [OpenShell](/es/gateway/openshell).

## Acceso al espacio de trabajo

`agents.defaults.sandbox.workspaceAccess` controla qué puede ver el entorno aislado:

| Valor            | Comportamiento                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| `none` (predeterminado) | Las herramientas ven un espacio de trabajo aislado del sandbox en `~/.openclaw/sandboxes`. |
| `ro`             | Monta el espacio de trabajo del agente en modo de solo lectura en `/agent` (deshabilita `write`/`edit`/`apply_patch`). |
| `rw`             | Monta el espacio de trabajo del agente en modo de lectura y escritura en `/workspace`.          |

Con el backend OpenShell, el modo `mirror` sigue usando el espacio de trabajo local como fuente canónica entre turnos de ejecución, el modo `remote` usa el espacio de trabajo remoto de OpenShell como fuente canónica después de la inicialización, y `workspaceAccess: "ro"`/`"none"` sigue restringiendo el comportamiento de escritura de la misma manera.

Los archivos multimedia entrantes se copian en el espacio de trabajo activo del sandbox (`media/inbound/*`).

<Note>
**Skills**: la herramienta `read` está limitada a la raíz del sandbox. Con `workspaceAccess: "none"`, OpenClaw refleja las Skills compatibles en el espacio de trabajo del sandbox (`.../skills`) para que puedan leerse. Con `"rw"`, las Skills del espacio de trabajo pueden leerse desde `/workspace/skills`, y las Skills compatibles administradas, incluidas o de plugins se materializan en la ruta de solo lectura generada `/workspace/.openclaw/sandbox-skills/skills`.
</Note>

## Montajes bind personalizados

`agents.defaults.sandbox.docker.binds` monta directorios adicionales del host en el contenedor. Formato: `host:container:mode` (por ejemplo, `"/home/user/source:/source:rw"`).

Los montajes bind globales y por agente se combinan (no se reemplazan). Con `scope: "shared"`, se ignoran los montajes bind por agente.

`agents.defaults.sandbox.browser.binds` monta directorios adicionales del host únicamente en el contenedor del **navegador del sandbox**. Cuando se establece (incluido `[]`), reemplaza `docker.binds` para el contenedor del navegador; cuando se omite, el contenedor del navegador recurre a `docker.binds`.

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

- Los montajes bind eluden el sistema de archivos del sandbox: exponen rutas del host con el modo que establezca (`:ro` o `:rw`).
- OpenClaw bloquea de forma predeterminada las fuentes peligrosas de montajes bind: rutas del sistema (`/etc`, `/proc`, `/sys`, `/dev`, `/root`, `/boot`), directorios del socket de Docker (`/run`, `/var/run` y sus variantes `docker.sock`) y ubicaciones habituales de credenciales del directorio personal (`~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, `~/.ssh`).
- La validación normaliza la ruta de origen y después vuelve a resolverla mediante el ancestro existente más profundo antes de comprobar de nuevo las rutas bloqueadas y las raíces permitidas. Por ello, los intentos de escape mediante enlaces simbólicos en directorios superiores se bloquean de forma segura incluso cuando el elemento final todavía no existe (por ejemplo, `/workspace/run-link/new-file` sigue resolviéndose como `/var/run/...` si `run-link` apunta allí).
- Los destinos de montajes bind que ocultan los puntos de montaje reservados del contenedor (`/workspace`, `/agent`) también se bloquean de forma predeterminada; puede anular este bloqueo con `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true`.
- Las fuentes de montajes bind situadas fuera de las raíces permitidas del espacio de trabajo o del espacio de trabajo del agente se bloquean de forma predeterminada; puede anular este bloqueo con `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true`. Las raíces permitidas se canonizan del mismo modo, por lo que una ruta que solo parece estar dentro de la lista permitida antes de resolver los enlaces simbólicos se sigue rechazando por estar fuera de las raíces permitidas.
- Los montajes sensibles (secretos, claves SSH, credenciales de servicios) deben usar `:ro`, salvo que sea absolutamente necesario.
- Combínelos con `workspaceAccess: "ro"` si solo necesita acceso de lectura al espacio de trabajo; los modos de los montajes bind siguen siendo independientes.
- Consulte [Sandbox frente a política de herramientas frente a ejecución elevada](/es/gateway/sandbox-vs-tool-policy-vs-elevated) para saber cómo interactúan los montajes bind con la política de herramientas y la ejecución elevada.

</Warning>

## Imágenes y configuración

Imagen predeterminada de Docker: `openclaw-sandbox:bookworm-slim`

<Note>
**Código fuente descargado frente a instalación mediante npm**

Los scripts auxiliares `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` y `scripts/sandbox-browser-setup.sh` solo están disponibles cuando se ejecuta desde una [copia local del código fuente](https://github.com/openclaw/openclaw). No se incluyen en el paquete npm.

Si instaló OpenClaw mediante `npm install -g openclaw`, use en su lugar los comandos `docker build` en línea que se muestran a continuación.
</Note>

<Steps>
  <Step title="Compilar la imagen predeterminada">
    Desde una copia local del código fuente:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Desde una instalación mediante npm (no se necesita una copia local del código fuente):

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

    La imagen predeterminada **no** incluye Node. Si una Skill necesita Node (u otros entornos de ejecución), cree una imagen personalizada que los incluya o instálelos mediante `sandbox.docker.setupCommand` (requiere salida de red, una raíz con permisos de escritura y el usuario raíz).

    OpenClaw no sustituye silenciosamente `openclaw-sandbox:bookworm-slim` por `debian:bookworm-slim` cuando falta la primera. Las ejecuciones del sandbox que usan la imagen predeterminada fallan inmediatamente y muestran instrucciones de compilación hasta que la compile, porque la imagen incluida contiene `python3` para los auxiliares de escritura y edición del sandbox.

  </Step>
  <Step title="Opcional: compilar la imagen común">
    Para disponer de una imagen de sandbox más completa con herramientas habituales (por ejemplo, `curl`, `jq`, Node 24, pnpm, `python3` y `git`):

    Desde una copia local del código fuente:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Desde una instalación mediante npm, compile primero la imagen predeterminada (consulte la sección anterior) y después compile sobre ella la imagen común mediante [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) del repositorio.

    A continuación, establezca `agents.defaults.sandbox.docker.image` en `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Opcional: compilar la imagen del navegador del sandbox">
    Desde una copia local del código fuente:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Desde una instalación mediante npm, compile mediante [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) del repositorio.

  </Step>
</Steps>

De forma predeterminada, los contenedores del sandbox de Docker se ejecutan **sin red**. Puede anularlo mediante `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Valores predeterminados de Chromium para el navegador del sandbox">
    La imagen incluida del navegador del sandbox aplica opciones de inicio conservadoras de Chromium para cargas de trabajo en contenedores:

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
    - `--disable-3d-apis`, `--disable-gpu`, `--disable-software-rasterizer` de forma predeterminada; estas opciones de refuerzo gráfico ayudan en los contenedores sin compatibilidad con GPU. Establezca `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` si su carga de trabajo necesita WebGL u otras funciones 3D.
    - `--disable-extensions` de forma predeterminada; establezca `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` para flujos que dependan de extensiones.
    - `--renderer-process-limit=2` de forma predeterminada; se controla mediante `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, donde `0` mantiene el valor predeterminado de Chromium.

    Si necesita un perfil de entorno de ejecución diferente, use una imagen de navegador personalizada y proporcione su propio punto de entrada. Para perfiles locales de Chromium (fuera de contenedores), use `browser.extraArgs` para añadir opciones de inicio adicionales.

  </Accordion>
  <Accordion title="Valores predeterminados de seguridad de red">
    - `network: "host"` está bloqueado.
    - `network: "container:<id>"` está bloqueado de forma predeterminada (riesgo de eludir el aislamiento al unirse al espacio de nombres).
    - Anulación de emergencia: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Las instalaciones de Docker y el Gateway en contenedores se describen aquí: [Docker](/es/install/docker)

Para implementaciones del Gateway con Docker, `scripts/docker/setup.sh` puede inicializar la configuración del sandbox. Establezca `OPENCLAW_SANDBOX=1` (o `true`/`yes`/`on`) para habilitar esa ruta. Anule la ubicación del socket con `OPENCLAW_DOCKER_SOCKET`. Referencia completa de la configuración y las variables de entorno: [Docker](/es/install/docker#agent-sandbox).

## setupCommand (configuración única del contenedor)

`setupCommand` se ejecuta **una vez** después de crear el contenedor del sandbox (no en cada ejecución). Se ejecuta dentro del contenedor mediante `sh -lc`.

Rutas:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Por agente: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Problemas habituales">
    - El valor predeterminado de `docker.network` es `"none"` (sin salida de red), por lo que las instalaciones de paquetes fallarán.
    - `docker.network: "container:<id>"` requiere `dangerouslyAllowContainerNamespaceJoin: true` y solo debe usarse como medida de emergencia.
    - `readOnlyRoot: true` impide las escrituras; establezca `readOnlyRoot: false` o cree una imagen personalizada que incluya lo necesario.
    - `user` debe ser el usuario raíz para instalar paquetes (omita `user` o establezca `user: "0:0"`).
    - La ejecución en el sandbox **no** hereda `process.env` del host. Use `agents.defaults.sandbox.docker.env` (o una imagen personalizada) para las claves de API de las Skills.
    - Los valores de `agents.defaults.sandbox.docker.env` se pasan como variables de entorno explícitas del contenedor Docker. Cualquier persona con acceso al daemon de Docker puede inspeccionarlos mediante comandos de metadatos de Docker como `docker inspect`. Use una imagen personalizada, un archivo de secretos montado u otra vía de entrega de secretos si esa exposición de metadatos no es aceptable.

  </Accordion>
</AccordionGroup>

## Política de herramientas y vías de escape

Las políticas de permisos y denegaciones de herramientas siguen aplicándose antes que las reglas del sandbox. Si una herramienta está denegada globalmente o para un agente concreto, el sandbox no vuelve a habilitarla.

`tools.elevated` es una vía de escape explícita que ejecuta `exec` fuera del sandbox (`gateway` de forma predeterminada, o `node` cuando el destino de ejecución es `node`). Las directivas `/exec` solo se aplican a remitentes autorizados y persisten durante la sesión; para deshabilitar por completo `exec`, use una denegación en la política de herramientas (consulte [Sandbox frente a política de herramientas frente a ejecución elevada](/es/gateway/sandbox-vs-tool-policy-vs-elevated)).

Depuración:

- `openclaw sandbox list` muestra los contenedores del sandbox, su estado, la coincidencia de la imagen, su antigüedad, el tiempo de inactividad y la sesión o el agente asociados.
- `openclaw sandbox explain [--session <key>] [--agent <id>]` inspecciona el modo efectivo del sandbox, el espacio de trabajo del host, el directorio de trabajo del entorno de ejecución, los montajes de Docker, la política de herramientas y las claves de configuración para corregir problemas. Su campo `workspaceRoot` conserva la raíz configurada del sandbox; `effectiveHostWorkspaceRoot` muestra dónde se encuentra realmente el espacio de trabajo activo.
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` elimina contenedores o entornos para que se vuelvan a crear con la configuración actual la próxima vez que se usen.
- Consulte [Sandbox frente a política de herramientas frente a ejecución elevada](/es/gateway/sandbox-vs-tool-policy-vs-elevated) para entender el modelo mental de «¿por qué está bloqueado esto?».

## Anulaciones para varios agentes

Cada agente puede anular la configuración del sandbox y de las herramientas: `agents.list[].sandbox` y `agents.list[].tools` (además de `agents.list[].tools.sandbox.tools` para la política de herramientas del sandbox). Consulte [Sandbox y herramientas para varios agentes](/es/tools/multi-agent-sandbox-tools) para conocer la precedencia.

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

- [Entorno aislado y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) -- anulaciones por agente y precedencia
- [OpenShell](/es/gateway/openshell) -- configuración del backend de entorno aislado administrado, modos del espacio de trabajo y referencia de configuración
- [Configuración del entorno aislado](/es/gateway/config-agents#agentsdefaultssandbox)
- [Entorno aislado frente a política de herramientas y modo elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated) -- depuración de «¿por qué está bloqueado esto?»
- [Seguridad](/es/gateway/security)

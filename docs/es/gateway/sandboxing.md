---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Cómo funciona el sandboxing de OpenClaw: modos, ámbitos, acceso al workspace e imágenes'
title: Aislamiento
x-i18n:
    generated_at: "2026-06-27T11:35:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c9754fbfc71ee5fb48df72eece8ba3b155ce5e0d9c55aae75ce21801dceb07d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw puede ejecutar **herramientas dentro de backends de sandbox** para reducir el radio de impacto. Esto es **opcional** y se controla mediante configuración (`agents.defaults.sandbox` o `agents.list[].sandbox`). Si el sandboxing está desactivado, las herramientas se ejecutan en el host. El Gateway permanece en el host; la ejecución de herramientas se realiza en un sandbox aislado cuando está habilitada.

<Note>
Este no es un límite de seguridad perfecto, pero limita materialmente el acceso al sistema de archivos y a los procesos cuando el modelo hace algo torpe.
</Note>

## Qué se ejecuta en sandbox

- Ejecución de herramientas (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, etc.).
- Navegador opcional en sandbox (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Sandboxed browser details">
    - De forma predeterminada, el navegador del sandbox se inicia automáticamente (garantiza que CDP sea accesible) cuando la herramienta de navegador lo necesita. Configúralo mediante `agents.defaults.sandbox.browser.autoStart` y `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - De forma predeterminada, los contenedores del navegador del sandbox usan una red Docker dedicada (`openclaw-sandbox-browser`) en lugar de la red global `bridge`. Configúralo con `agents.defaults.sandbox.browser.network`.
    - `agents.defaults.sandbox.browser.cdpSourceRange` opcional restringe el ingreso CDP en el borde del contenedor con una lista de permitidos CIDR (por ejemplo `172.21.0.1/32`).
    - El acceso de observador noVNC está protegido con contraseña de forma predeterminada; OpenClaw emite una URL de token de corta duración que sirve una página de arranque local y abre noVNC con la contraseña en el fragmento de URL (no en registros de consulta/cabecera).
    - `agents.defaults.sandbox.browser.allowHostControl` permite que las sesiones en sandbox apunten explícitamente al navegador del host.
    - Las listas de permitidos opcionales controlan `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

No se ejecuta en sandbox:

- El propio proceso del Gateway.
- Cualquier herramienta autorizada explícitamente para ejecutarse fuera del sandbox (p. ej., `tools.elevated`).
  - **La ejecución elevada omite el sandboxing y usa la ruta de escape configurada (`gateway` de forma predeterminada, o `node` cuando el destino de exec es `node`).**
  - Si el sandboxing está desactivado, `tools.elevated` no cambia la ejecución (ya está en el host). Consulta [Modo elevado](/es/tools/elevated).

## Modos

`agents.defaults.sandbox.mode` controla **cuándo** se usa el sandboxing:

<Tabs>
  <Tab title="off">
    Sin sandboxing.
  </Tab>
  <Tab title="non-main">
    Ejecuta en sandbox solo las sesiones **no principales** (predeterminado si quieres chats normales en el host).

    `"non-main"` se basa en `session.mainKey` (predeterminado `"main"`), no en el id del agente. Las sesiones de grupo/canal usan sus propias claves, por lo que cuentan como no principales y se ejecutarán en sandbox.

  </Tab>
  <Tab title="all">
    Cada sesión se ejecuta en un sandbox.
  </Tab>
</Tabs>

## Alcance

`agents.defaults.sandbox.scope` controla **cuántos contenedores** se crean:

- `"agent"` (predeterminado): un contenedor por agente.
- `"session"`: un contenedor por sesión.
- `"shared"`: un contenedor compartido por todas las sesiones en sandbox.

## Backend

`agents.defaults.sandbox.backend` controla **qué runtime** proporciona el sandbox:

- `"docker"` (predeterminado cuando el sandboxing está habilitado): runtime de sandbox local respaldado por Docker.
- `"ssh"`: runtime de sandbox remoto genérico respaldado por SSH.
- `"openshell"`: runtime de sandbox respaldado por OpenShell.

La configuración específica de SSH vive bajo `agents.defaults.sandbox.ssh`. La configuración específica de OpenShell vive bajo `plugins.entries.openshell.config`.

### Elegir un backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Dónde se ejecuta** | Contenedor local                 | Cualquier host accesible por SSH | Sandbox gestionado por OpenShell                  |
| **Configuración**   | `scripts/sandbox-setup.sh`       | Clave SSH + host de destino     | Plugin OpenShell habilitado                         |
| **Modelo de workspace** | Montaje bind o copia         | Canónico remoto (sembrar una vez) | `mirror` o `remote`                              |
| **Control de red**  | `docker.network` (predeterminado: ninguna) | Depende del host remoto | Depende de OpenShell                                |
| **Sandbox de navegador** | Compatible                  | No compatible                   | Aún no compatible                                   |
| **Montajes bind**   | `docker.binds`                   | N/A                            | N/A                                                 |
| **Mejor para**      | Desarrollo local, aislamiento completo | Descargar carga a una máquina remota | Sandboxes remotos gestionados con sincronización bidireccional opcional |

### Backend Docker

El sandboxing está desactivado de forma predeterminada. Si habilitas el sandboxing y no eliges un backend, OpenClaw usa el backend Docker. Ejecuta herramientas y navegadores de sandbox localmente mediante el socket del demonio Docker (`/var/run/docker.sock`). El aislamiento del contenedor de sandbox lo determinan los namespaces de Docker.

Para exponer GPU del host a sandboxes Docker, configura `agents.defaults.sandbox.docker.gpus` o la anulación por agente `agents.list[].sandbox.docker.gpus`. El valor se pasa al flag `--gpus` de Docker como un argumento separado, por ejemplo `"all"` o `"device=GPU-uuid"`, y requiere un runtime de host compatible, como NVIDIA Container Toolkit.

<Warning>
**Restricciones de Docker-out-of-Docker (DooD)**

Si despliegas el propio OpenClaw Gateway como un contenedor Docker, este orquesta contenedores de sandbox hermanos usando el socket Docker del host (DooD). Esto introduce una restricción específica de mapeo de rutas:

- **La configuración requiere rutas del host**: La configuración `workspace` de `openclaw.json` DEBE contener la **ruta absoluta del host** (p. ej., `/home/user/.openclaw/workspaces`), no la ruta interna del contenedor del Gateway. Cuando OpenClaw pide al demonio Docker que inicie un sandbox, el demonio evalúa las rutas relativas al namespace del sistema operativo host, no al namespace del Gateway.
- **Paridad del puente FS (mapa de volúmenes idéntico)**: El proceso nativo del OpenClaw Gateway también escribe archivos de Heartbeat y puente en el directorio `workspace`. Debido a que el Gateway evalúa exactamente la misma cadena (la ruta del host) desde dentro de su propio entorno en contenedor, el despliegue del Gateway DEBE incluir un mapa de volúmenes idéntico que enlace el namespace del host de forma nativa (`-v /home/user/.openclaw:/home/user/.openclaw`).
- **Modo de código de Codex**: Cuando un sandbox de OpenClaw está activo, OpenClaw deshabilita el modo de código nativo del servidor de aplicación de Codex, los servidores MCP de usuario y la ejecución de Plugin respaldada por la aplicación para ese turno, porque esas superficies nativas se ejecutan desde el proceso del servidor de aplicación en el host del Gateway en lugar de desde el backend de sandbox de OpenClaw. El acceso de shell se expone mediante herramientas respaldadas por el sandbox de OpenClaw, como `sandbox_exec` y `sandbox_process`, cuando las herramientas normales exec/process están disponibles. No montes el socket Docker del host en contenedores de sandbox de agente ni en sandboxes Codex personalizados.

En hosts Ubuntu/AppArmor, Codex `workspace-write` puede fallar antes del inicio del shell
cuando ejecutas intencionalmente Codex `workspace-write` nativo sin sandboxing
activo de OpenClaw y el usuario del servicio no tiene permitido crear namespaces
de usuario sin privilegios. Cuando la salida de red del sandbox Docker está deshabilitada (`network: "none"`, el
valor predeterminado), Codex también necesita un namespace de red sin privilegios. Los síntomas comunes son
`bwrap: setting up uid map: Permission denied` y
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. Ejecuta
`openclaw doctor`; si informa un fallo de sondeo de namespace bwrap de Codex, prefiere
un perfil AppArmor que conceda los namespaces requeridos al proceso del servicio
OpenClaw. `kernel.apparmor_restrict_unprivileged_userns=0` es una alternativa
para todo el host con compromisos de seguridad; úsala solo cuando esa postura del host sea
aceptable.

Si mapeas rutas internamente sin paridad absoluta con el host, OpenClaw lanza nativamente un error de permisos `EACCES` al intentar escribir su Heartbeat dentro del entorno del contenedor porque la cadena de ruta completamente calificada no existe de forma nativa.
</Warning>

### Backend SSH

Usa `backend: "ssh"` cuando quieras que OpenClaw ejecute en sandbox `exec`, herramientas de archivos y lecturas multimedia en una máquina arbitraria accesible por SSH.

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

<AccordionGroup>
  <Accordion title="How it works">
    - OpenClaw crea una raíz remota por alcance bajo `sandbox.ssh.workspaceRoot`.
    - En el primer uso después de crear o recrear, OpenClaw siembra una vez ese workspace remoto desde el workspace local.
    - Después de eso, `exec`, `read`, `write`, `edit`, `apply_patch`, las lecturas de medios de prompt y la preparación de medios entrantes se ejecutan directamente contra el workspace remoto mediante SSH.
    - OpenClaw no sincroniza automáticamente los cambios remotos de vuelta al workspace local.

  </Accordion>
  <Accordion title="Authentication material">
    - `identityFile`, `certificateFile`, `knownHostsFile`: usan archivos locales existentes y los pasan mediante la configuración de OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: usan cadenas inline o SecretRefs. OpenClaw los resuelve mediante la instantánea normal del runtime de secretos, los escribe en archivos temporales con `0600` y los elimina cuando termina la sesión SSH.
    - Si tanto `*File` como `*Data` están configurados para el mismo elemento, `*Data` gana para esa sesión SSH.

  </Accordion>
  <Accordion title="Remote-canonical consequences">
    Este es un modelo **canónico remoto**. El workspace SSH remoto se convierte en el estado real del sandbox después de la siembra inicial.

    - Las ediciones locales del host hechas fuera de OpenClaw después del paso de siembra no son visibles de forma remota hasta que recrees el sandbox.
    - `openclaw sandbox recreate` elimina la raíz remota por alcance y vuelve a sembrar desde local en el siguiente uso.
    - El sandboxing de navegador no es compatible con el backend SSH.
    - La configuración `sandbox.docker.*` no se aplica al backend SSH.

  </Accordion>
</AccordionGroup>

### Backend OpenShell

Usa `backend: "openshell"` cuando quieras que OpenClaw ejecute herramientas en sandbox en un entorno remoto gestionado por OpenShell. Para la guía completa de configuración inicial, la referencia de configuración y la comparación de modos de workspace, consulta la [página de OpenShell](/es/gateway/openshell) dedicada.

OpenShell reutiliza el mismo transporte SSH central y el puente de sistema de archivos remoto que el backend SSH genérico, y añade ciclo de vida específico de OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) además del modo de workspace opcional `mirror`.

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
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

Modos de OpenShell:

- `mirror` (predeterminado): el workspace local permanece canónico. OpenClaw sincroniza archivos locales hacia OpenShell antes de exec y sincroniza el workspace remoto de vuelta después de exec.
- `remote`: el workspace de OpenShell es canónico después de crear el sandbox. OpenClaw siembra el workspace remoto una vez desde el workspace local; luego, las herramientas de archivos y exec se ejecutan directamente contra el sandbox remoto sin sincronizar cambios de vuelta.

<AccordionGroup>
  <Accordion title="Detalles del transporte remoto">
    - OpenClaw solicita a OpenShell la configuración SSH específica del sandbox mediante `openshell sandbox ssh-config <name>`.
    - El núcleo escribe esa configuración SSH en un archivo temporal, abre la sesión SSH y reutiliza el mismo puente de sistema de archivos remoto que usa `backend: "ssh"`.
    - En modo `mirror`, solo cambia el ciclo de vida: se sincroniza de local a remoto antes de exec y luego se vuelve a sincronizar después de exec.

  </Accordion>
  <Accordion title="Limitaciones actuales de OpenShell">
    - el navegador del sandbox aún no es compatible
    - `sandbox.docker.binds` no es compatible con el backend de OpenShell
    - los controles de runtime específicos de Docker bajo `sandbox.docker.*` siguen aplicándose solo al backend de Docker

  </Accordion>
</AccordionGroup>

#### Modos de workspace

OpenShell tiene dos modelos de workspace. Esta es la parte que más importa en la práctica.

<Tabs>
  <Tab title="mirror (local canónico)">
    Usa `plugins.entries.openshell.config.mode: "mirror"` cuando quieras que el **workspace local siga siendo canónico**.

    Comportamiento:

    - Antes de `exec`, OpenClaw sincroniza el workspace local en el sandbox de OpenShell.
    - Después de `exec`, OpenClaw vuelve a sincronizar el workspace remoto al workspace local.
    - Las herramientas de archivos siguen operando a través del puente del sandbox, pero el workspace local permanece como la fuente de verdad entre turnos.

    Úsalo cuando:

    - editas archivos localmente fuera de OpenClaw y quieres que esos cambios aparezcan automáticamente en el sandbox
    - quieres que el sandbox de OpenShell se comporte lo más parecido posible al backend de Docker
    - quieres que el workspace del host refleje las escrituras del sandbox después de cada turno de exec

    Contrapartida: costo adicional de sincronización antes y después de exec.

  </Tab>
  <Tab title="remote (OpenShell canónico)">
    Usa `plugins.entries.openshell.config.mode: "remote"` cuando quieras que el **workspace de OpenShell pase a ser canónico**.

    Comportamiento:

    - Cuando el sandbox se crea por primera vez, OpenClaw inicializa el workspace remoto desde el workspace local una vez.
    - Después de eso, `exec`, `read`, `write`, `edit` y `apply_patch` operan directamente contra el workspace remoto de OpenShell.
    - OpenClaw **no** sincroniza los cambios remotos de vuelta al workspace local después de exec.
    - Las lecturas de medios en tiempo de prompt siguen funcionando porque las herramientas de archivos y medios leen a través del puente del sandbox en lugar de asumir una ruta local del host.
    - El transporte es SSH hacia el sandbox de OpenShell devuelto por `openshell sandbox ssh-config`.

    Consecuencias importantes:

    - Si editas archivos en el host fuera de OpenClaw después del paso de inicialización, el sandbox remoto **no** verá esos cambios automáticamente.
    - Si el sandbox se vuelve a crear, el workspace remoto se inicializa otra vez desde el workspace local.
    - Con `scope: "agent"` o `scope: "shared"`, ese workspace remoto se comparte en ese mismo ámbito.

    Úsalo cuando:

    - el sandbox deba vivir principalmente del lado remoto de OpenShell
    - quieres reducir la sobrecarga de sincronización por turno
    - no quieres que las ediciones locales del host sobrescriban silenciosamente el estado del sandbox remoto

  </Tab>
</Tabs>

Elige `mirror` si piensas en el sandbox como un entorno de ejecución temporal. Elige `remote` si piensas en el sandbox como el workspace real.

#### Ciclo de vida de OpenShell

Los sandboxes de OpenShell se siguen gestionando mediante el ciclo de vida normal del sandbox:

- `openclaw sandbox list` muestra runtimes de OpenShell además de runtimes de Docker
- `openclaw sandbox recreate` elimina el runtime actual y permite que OpenClaw lo vuelva a crear en el siguiente uso
- la lógica de depuración también conoce el backend

Para el modo `remote`, recreate es especialmente importante:

- recreate elimina el workspace remoto canónico para ese ámbito
- el siguiente uso inicializa un workspace remoto nuevo desde el workspace local

Para el modo `mirror`, recreate principalmente restablece el entorno de ejecución remoto, porque el workspace local sigue siendo canónico de todos modos.

## Acceso al workspace

`agents.defaults.sandbox.workspaceAccess` controla **qué puede ver el sandbox**:

<Tabs>
  <Tab title="none (predeterminado)">
    Las herramientas ven un workspace de sandbox bajo `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Monta el workspace del agente en modo de solo lectura en `/agent` (deshabilita `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Monta el workspace del agente en modo lectura/escritura en `/workspace`.
  </Tab>
</Tabs>

Con el backend de OpenShell:

- el modo `mirror` sigue usando el workspace local como fuente canónica entre turnos de exec
- el modo `remote` usa el workspace remoto de OpenShell como fuente canónica después de la inicialización inicial
- `workspaceAccess: "ro"` y `"none"` siguen restringiendo el comportamiento de escritura de la misma manera

Los medios entrantes se copian en el workspace activo del sandbox (`media/inbound/*`).

<Note>
**Nota sobre Skills:** la herramienta `read` está anclada a la raíz del sandbox. Con `workspaceAccess: "none"`, OpenClaw replica las Skills aptas en el workspace del sandbox (`.../skills`) para que puedan leerse. Con `"rw"`, las Skills del workspace se pueden leer desde `/workspace/skills`, y las Skills aptas gestionadas, incluidas o de Plugin se materializan en la ruta de solo lectura generada `/workspace/.openclaw/sandbox-skills/skills`.
</Note>

## Montajes bind personalizados

`agents.defaults.sandbox.docker.binds` monta directorios adicionales del host en el contenedor. Formato: `host:container:mode` (por ejemplo, `"/home/user/source:/source:rw"`).

Los binds globales y por agente se **fusionan** (no se reemplazan). Bajo `scope: "shared"`, los binds por agente se ignoran.

`agents.defaults.sandbox.browser.binds` monta directorios adicionales del host solo en el contenedor del **navegador del sandbox**.

- Cuando se establece (incluido `[]`), reemplaza `agents.defaults.sandbox.docker.binds` para el contenedor del navegador.
- Cuando se omite, el contenedor del navegador recurre a `agents.defaults.sandbox.docker.binds` (compatible hacia atrás).

Ejemplo (fuente de solo lectura + un directorio de datos adicional):

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

- Los binds eluden el sistema de archivos del sandbox: exponen rutas del host con el modo que establezcas (`:ro` o `:rw`).
- OpenClaw bloquea fuentes de bind peligrosas (por ejemplo: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` y montajes padre que las expondrían).
- OpenClaw también bloquea raíces comunes de credenciales en el directorio home, como `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` y `~/.ssh`.
- La validación de bind no es solo coincidencia de cadenas. OpenClaw normaliza la ruta de origen y luego la resuelve de nuevo a través del ancestro existente más profundo antes de volver a comprobar las rutas bloqueadas y las raíces permitidas.
- Eso significa que los escapes mediante padres con symlink siguen fallando de forma cerrada incluso cuando la hoja final aún no existe. Ejemplo: `/workspace/run-link/new-file` sigue resolviéndose como `/var/run/...` si `run-link` apunta allí.
- Las raíces de origen permitidas se canonicalizan de la misma manera, por lo que una ruta que solo parece estar dentro de la lista de permitidos antes de la resolución de symlink se rechaza igualmente como `outside allowed roots`.
- Los montajes sensibles (secretos, claves SSH, credenciales de servicio) deben ser `:ro` salvo que sea absolutamente necesario.
- Combínalo con `workspaceAccess: "ro"` si solo necesitas acceso de lectura al workspace; los modos de bind siguen siendo independientes.
- Consulta [Sandbox frente a política de herramientas frente a elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated) para ver cómo interactúan los binds con la política de herramientas y exec elevado.

</Warning>

## Imágenes y configuración

Imagen de Docker predeterminada: `openclaw-sandbox:bookworm-slim`

<Note>
**Checkout de origen frente a instalación npm**

Los scripts auxiliares `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` y `scripts/sandbox-browser-setup.sh` solo están disponibles cuando se ejecuta desde un [checkout de origen](https://github.com/openclaw/openclaw). No se incluyen en el paquete npm.

Si instalaste OpenClaw mediante `npm install -g openclaw`, usa en su lugar los comandos `docker build` en línea que se muestran abajo.
</Note>

<Steps>
  <Step title="Compilar la imagen predeterminada">
    Desde un checkout de origen:

    ```bash
    scripts/sandbox-setup.sh
    ```

    Desde una instalación npm (no se necesita checkout de origen):

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

    La imagen predeterminada **no** incluye Node. Si una skill necesita Node (u otros runtimes), crea una imagen personalizada o instala mediante `sandbox.docker.setupCommand` (requiere salida de red + raíz escribible + usuario root).

    OpenClaw no sustituye silenciosamente por `debian:bookworm-slim` plano cuando falta `openclaw-sandbox:bookworm-slim`. Las ejecuciones de sandbox que apuntan a la imagen predeterminada fallan rápido con una instrucción de compilación hasta que la compiles, porque la imagen incluida trae `python3` para los auxiliares de escritura/edición del sandbox.

  </Step>
  <Step title="Opcional: compilar la imagen común">
    Para una imagen de sandbox más funcional con herramientas comunes (por ejemplo `curl`, `jq`, Node 24, pnpm, `python3` y `git`):

    Desde un checkout de origen:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Desde una instalación npm, compila primero la imagen predeterminada (ver arriba) y luego compila la imagen común encima usando el [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) del repositorio.

    Luego establece `agents.defaults.sandbox.docker.image` en `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Opcional: compilar la imagen del navegador del sandbox">
    Desde un checkout de origen:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Desde una instalación npm, compila usando el [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) del repositorio.

  </Step>
</Steps>

De forma predeterminada, los contenedores de sandbox de Docker se ejecutan **sin red**. Anúlalo con `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Valores predeterminados de Chromium para el navegador del sandbox">
    La imagen incluida del navegador del sandbox también aplica valores predeterminados conservadores de arranque de Chromium para cargas de trabajo en contenedores. Los valores predeterminados actuales del contenedor incluyen:

    - `--remote-debugging-address=127.0.0.1`
    - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
    - `--user-data-dir=${HOME}/.chrome`
    - `--no-first-run`
    - `--no-default-browser-check`
    - `--disable-3d-apis`
    - `--disable-gpu`
    - `--disable-dev-shm-usage`
    - `--disable-background-networking`
    - `--disable-extensions`
    - `--disable-features=TranslateUI`
    - `--disable-breakpad`
    - `--disable-crash-reporter`
    - `--disable-software-rasterizer`
    - `--no-zygote`
    - `--metrics-recording-only`
    - `--renderer-process-limit=2`
    - `--no-sandbox` cuando `noSandbox` está habilitado.
    - Las tres flags de endurecimiento gráfico (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) son opcionales y resultan útiles cuando los contenedores carecen de soporte de GPU. Establece `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` si tu carga de trabajo requiere WebGL u otras funciones 3D/del navegador.
    - `--disable-extensions` está habilitada de forma predeterminada y puede deshabilitarse con `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` para flujos que dependen de extensiones.
    - `--renderer-process-limit=2` está controlado por `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, donde `0` conserva el valor predeterminado de Chromium.

    Si necesitas un perfil de runtime diferente, usa una imagen de navegador personalizada y proporciona tu propio entrypoint. Para perfiles locales (sin contenedor) de Chromium, usa `browser.extraArgs` para añadir flags de arranque adicionales.

  </Accordion>
  <Accordion title="Valores predeterminados de seguridad de red">
    - `network: "host"` está bloqueado.
    - `network: "container:<id>"` está bloqueado de forma predeterminada (riesgo de omisión por unión de espacio de nombres).
    - Anulación de emergencia: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Las instalaciones de Docker y el gateway en contenedor están aquí: [Docker](/es/install/docker)

Para despliegues del gateway con Docker, `scripts/docker/setup.sh` puede inicializar la configuración del sandbox. Establece `OPENCLAW_SANDBOX=1` (o `true`/`yes`/`on`) para habilitar esa ruta. Puedes anular la ubicación del socket con `OPENCLAW_DOCKER_SOCKET`. Configuración completa y referencia de entorno: [Docker](/es/install/docker#agent-sandbox).

## setupCommand (configuración única del contenedor)

`setupCommand` se ejecuta **una vez** después de crear el contenedor del sandbox (no en cada ejecución). Se ejecuta dentro del contenedor mediante `sh -lc`.

Rutas:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Por agente: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Errores comunes">
    - El valor predeterminado de `docker.network` es `"none"` (sin salida), por lo que las instalaciones de paquetes fallarán.
    - `docker.network: "container:<id>"` requiere `dangerouslyAllowContainerNamespaceJoin: true` y es solo para emergencias.
    - `readOnlyRoot: true` impide escrituras; establece `readOnlyRoot: false` o crea una imagen personalizada.
    - `user` debe ser root para instalar paquetes (omite `user` o establece `user: "0:0"`).
    - La ejecución en sandbox **no** hereda `process.env` del host. Usa `agents.defaults.sandbox.docker.env` (o una imagen personalizada) para claves de API de Skills.
    - Los valores en `agents.defaults.sandbox.docker.env` se pasan como variables de entorno explícitas del contenedor Docker. Cualquier persona con acceso al daemon de Docker puede inspeccionarlos con comandos de metadatos de Docker como `docker inspect`. Usa una imagen personalizada, un archivo de secretos montado u otra ruta de entrega de secretos si esa exposición de metadatos no es aceptable.

  </Accordion>
</AccordionGroup>

## Política de herramientas y vías de escape

Las políticas de permitir/denegar herramientas siguen aplicándose antes que las reglas del sandbox. Si una herramienta se deniega globalmente o por agente, el sandbox no la vuelve a habilitar.

`tools.elevated` es una vía de escape explícita que ejecuta `exec` fuera del sandbox (`gateway` de forma predeterminada, o `node` cuando el destino de exec es `node`). Las directivas `/exec` solo se aplican a remitentes autorizados y persisten por sesión; para deshabilitar `exec` por completo, usa una política de denegación de herramientas (consulta [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated)).

Depuración:

- Usa `openclaw sandbox explain` para inspeccionar el modo de sandbox efectivo, la política de herramientas y las claves de configuración para solucionarlo.
- Consulta [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated) para el modelo mental de "¿por qué está bloqueado esto?".

Mantenlo bloqueado.

## Anulaciones multiagente

Cada agente puede anular sandbox + herramientas: `agents.list[].sandbox` y `agents.list[].tools` (además de `agents.list[].tools.sandbox.tools` para la política de herramientas del sandbox). Consulta [Sandbox multiagente y herramientas](/es/tools/multi-agent-sandbox-tools) para la precedencia.

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

- [Sandbox multiagente y herramientas](/es/tools/multi-agent-sandbox-tools) — anulaciones por agente y precedencia
- [OpenShell](/es/gateway/openshell) — configuración del backend de sandbox administrado, modos de espacio de trabajo y referencia de configuración
- [Configuración de sandbox](/es/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated) — depuración de "¿por qué está bloqueado esto?"
- [Seguridad](/es/gateway/security)

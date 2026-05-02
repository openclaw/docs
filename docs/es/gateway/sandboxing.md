---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Cómo funciona el aislamiento de OpenClaw: modos, ámbitos, acceso al espacio de trabajo e imágenes'
title: Aislamiento
x-i18n:
    generated_at: "2026-05-02T05:27:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f313333ec676aaef636b42d4a6f28f35bf213d9e1c5292ffb4868f312cf0eda
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw puede ejecutar **herramientas dentro de backends de entorno aislado** para reducir el alcance del impacto. Esto es **opcional** y se controla mediante la configuración (`agents.defaults.sandbox` o `agents.list[].sandbox`). Si el aislamiento está desactivado, las herramientas se ejecutan en el host. El Gateway permanece en el host; la ejecución de herramientas se realiza en un entorno aislado cuando está habilitada.

<Note>
Esto no es un límite de seguridad perfecto, pero limita de forma material el acceso al sistema de archivos y a los procesos cuando el modelo hace algo incorrecto.
</Note>

## Qué se aísla

- Ejecución de herramientas (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, etc.).
- Navegador aislado opcional (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Detalles del navegador aislado">
    - De forma predeterminada, el navegador aislado se inicia automáticamente (asegura que CDP sea accesible) cuando la herramienta de navegador lo necesita. Configúralo mediante `agents.defaults.sandbox.browser.autoStart` y `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - De forma predeterminada, los contenedores del navegador aislado usan una red Docker dedicada (`openclaw-sandbox-browser`) en lugar de la red global `bridge`. Configúralo con `agents.defaults.sandbox.browser.network`.
    - El valor opcional `agents.defaults.sandbox.browser.cdpSourceRange` restringe el ingreso CDP en el borde del contenedor con una lista de permitidos CIDR (por ejemplo, `172.21.0.1/32`).
    - El acceso de observador noVNC está protegido con contraseña de forma predeterminada; OpenClaw emite una URL de token de corta duración que sirve una página de arranque local y abre noVNC con la contraseña en el fragmento de URL (no en registros de consulta/cabecera).
    - `agents.defaults.sandbox.browser.allowHostControl` permite que las sesiones aisladas apunten explícitamente al navegador del host.
    - Las listas de permitidos opcionales protegen `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

No se aísla:

- El propio proceso Gateway.
- Cualquier herramienta a la que se le permita explícitamente ejecutarse fuera del entorno aislado (por ejemplo, `tools.elevated`).
  - **La ejecución elevada omite el aislamiento y usa la ruta de escape configurada (`gateway` de forma predeterminada, o `node` cuando el destino de ejecución es `node`).**
  - Si el aislamiento está desactivado, `tools.elevated` no cambia la ejecución (ya está en el host). Consulta [Modo elevado](/es/tools/elevated).

## Modos

`agents.defaults.sandbox.mode` controla **cuándo** se usa el aislamiento:

<Tabs>
  <Tab title="off">
    Sin aislamiento.
  </Tab>
  <Tab title="non-main">
    Aísla solo las sesiones **non-main** (valor predeterminado si quieres chats normales en el host).

    `"non-main"` se basa en `session.mainKey` (predeterminado `"main"`), no en el id del agente. Las sesiones de grupo/canal usan sus propias claves, por lo que cuentan como non-main y se aislarán.

  </Tab>
  <Tab title="all">
    Cada sesión se ejecuta en un entorno aislado.
  </Tab>
</Tabs>

## Alcance

`agents.defaults.sandbox.scope` controla **cuántos contenedores** se crean:

- `"agent"` (predeterminado): un contenedor por agente.
- `"session"`: un contenedor por sesión.
- `"shared"`: un contenedor compartido por todas las sesiones aisladas.

## Backend

`agents.defaults.sandbox.backend` controla **qué runtime** proporciona el entorno aislado:

- `"docker"` (predeterminado cuando el aislamiento está habilitado): runtime de entorno aislado local respaldado por Docker.
- `"ssh"`: runtime de entorno aislado remoto genérico respaldado por SSH.
- `"openshell"`: runtime de entorno aislado respaldado por OpenShell.

La configuración específica de SSH está en `agents.defaults.sandbox.ssh`. La configuración específica de OpenShell está en `plugins.entries.openshell.config`.

### Elegir un backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Dónde se ejecuta** | Contenedor local                 | Cualquier host accesible por SSH | Entorno aislado administrado por OpenShell          |
| **Configuración**   | `scripts/sandbox-setup.sh`       | Clave SSH + host de destino    | Plugin OpenShell habilitado                         |
| **Modelo de espacio de trabajo** | Montaje bind o copia | Remoto canónico (sembrar una vez) | `mirror` o `remote`                                |
| **Control de red**  | `docker.network` (predeterminado: none) | Depende del host remoto | Depende de OpenShell                                |
| **Navegador aislado** | Compatible                     | No compatible                  | Aún no compatible                                   |
| **Montajes bind**   | `docker.binds`                   | N/A                            | N/A                                                 |
| **Ideal para**      | Desarrollo local, aislamiento completo | Descarga a una máquina remota | Entornos aislados remotos administrados con sincronización bidireccional opcional |

### Backend Docker

El aislamiento está desactivado de forma predeterminada. Si habilitas el aislamiento y no eliges un backend, OpenClaw usa el backend Docker. Ejecuta herramientas y navegadores aislados localmente mediante el socket del demonio Docker (`/var/run/docker.sock`). El aislamiento de contenedores del entorno aislado lo determinan los espacios de nombres de Docker.

Para exponer GPUs del host a entornos aislados Docker, establece `agents.defaults.sandbox.docker.gpus` o la sobrescritura por agente `agents.list[].sandbox.docker.gpus`. El valor se pasa a la marca `--gpus` de Docker como un argumento separado, por ejemplo `"all"` o `"device=GPU-uuid"`, y requiere un runtime de host compatible, como NVIDIA Container Toolkit.

<Warning>
**Restricciones de Docker-out-of-Docker (DooD)**

Si despliegas el OpenClaw Gateway como un contenedor Docker, este orquesta contenedores de entorno aislado hermanos usando el socket Docker del host (DooD). Esto introduce una restricción específica de mapeo de rutas:

- **La configuración requiere rutas del host**: La configuración `workspace` de `openclaw.json` DEBE contener la **ruta absoluta del host** (por ejemplo, `/home/user/.openclaw/workspaces`), no la ruta interna del contenedor Gateway. Cuando OpenClaw solicita al demonio Docker que genere un entorno aislado, el demonio evalúa las rutas relativas al espacio de nombres del SO host, no al espacio de nombres del Gateway.
- **Paridad del puente FS (mapa de volúmenes idéntico)**: El proceso nativo del OpenClaw Gateway también escribe archivos de Heartbeat y puente en el directorio `workspace`. Debido a que el Gateway evalúa exactamente la misma cadena (la ruta del host) desde dentro de su propio entorno contenerizado, el despliegue del Gateway DEBE incluir un mapa de volúmenes idéntico que enlace de forma nativa el espacio de nombres del host (`-v /home/user/.openclaw:/home/user/.openclaw`).

Si mapeas rutas internamente sin paridad absoluta con el host, OpenClaw lanza de forma nativa un error de permisos `EACCES` al intentar escribir su Heartbeat dentro del entorno del contenedor porque la cadena de ruta completamente cualificada no existe de forma nativa.
</Warning>

### Backend SSH

Usa `backend: "ssh"` cuando quieras que OpenClaw aísle `exec`, herramientas de archivos y lecturas de medios en una máquina arbitraria accesible por SSH.

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
  <Accordion title="Cómo funciona">
    - OpenClaw crea una raíz remota por alcance bajo `sandbox.ssh.workspaceRoot`.
    - En el primer uso después de crear o recrear, OpenClaw siembra ese espacio de trabajo remoto desde el espacio de trabajo local una vez.
    - Después de eso, `exec`, `read`, `write`, `edit`, `apply_patch`, las lecturas de medios del prompt y la preparación de medios entrantes se ejecutan directamente contra el espacio de trabajo remoto por SSH.
    - OpenClaw no sincroniza automáticamente los cambios remotos de vuelta al espacio de trabajo local.

  </Accordion>
  <Accordion title="Material de autenticación">
    - `identityFile`, `certificateFile`, `knownHostsFile`: usa archivos locales existentes y pásalos mediante la configuración de OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: usa cadenas en línea o SecretRefs. OpenClaw los resuelve mediante la instantánea normal del runtime de secretos, los escribe en archivos temporales con `0600` y los elimina cuando finaliza la sesión SSH.
    - Si tanto `*File` como `*Data` están configurados para el mismo elemento, `*Data` gana para esa sesión SSH.

  </Accordion>
  <Accordion title="Consecuencias del modelo remoto canónico">
    Este es un modelo **remoto canónico**. El espacio de trabajo SSH remoto se convierte en el estado real del entorno aislado después de la siembra inicial.

    - Las ediciones locales del host realizadas fuera de OpenClaw después del paso de siembra no son visibles remotamente hasta que recrees el entorno aislado.
    - `openclaw sandbox recreate` elimina la raíz remota por alcance y vuelve a sembrar desde local en el siguiente uso.
    - El aislamiento de navegador no es compatible con el backend SSH.
    - La configuración `sandbox.docker.*` no se aplica al backend SSH.

  </Accordion>
</AccordionGroup>

### Backend OpenShell

Usa `backend: "openshell"` cuando quieras que OpenClaw aísle herramientas en un entorno remoto administrado por OpenShell. Para la guía de configuración completa, la referencia de configuración y la comparación de modos de espacio de trabajo, consulta la [página de OpenShell](/es/gateway/openshell) dedicada.

OpenShell reutiliza el mismo transporte SSH central y el mismo puente de sistema de archivos remoto que el backend SSH genérico, y añade el ciclo de vida específico de OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) además del modo de espacio de trabajo `mirror` opcional.

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

- `mirror` (predeterminado): el espacio de trabajo local permanece canónico. OpenClaw sincroniza los archivos locales hacia OpenShell antes de exec y sincroniza el espacio de trabajo remoto de vuelta después de exec.
- `remote`: el espacio de trabajo de OpenShell es canónico después de crear el entorno aislado. OpenClaw siembra el espacio de trabajo remoto una vez desde el espacio de trabajo local; luego las herramientas de archivos y exec se ejecutan directamente contra el entorno aislado remoto sin sincronizar cambios de vuelta.

<AccordionGroup>
  <Accordion title="Detalles del transporte remoto">
    - OpenClaw solicita a OpenShell configuración SSH específica del entorno aislado mediante `openshell sandbox ssh-config <name>`.
    - Core escribe esa configuración SSH en un archivo temporal, abre la sesión SSH y reutiliza el mismo puente de sistema de archivos remoto usado por `backend: "ssh"`.
    - En modo `mirror`, solo difiere el ciclo de vida: sincroniza local a remoto antes de exec y luego sincroniza de vuelta después de exec.

  </Accordion>
  <Accordion title="Limitaciones actuales de OpenShell">
    - el navegador aislado aún no es compatible
    - `sandbox.docker.binds` no es compatible con el backend OpenShell
    - los ajustes de runtime específicos de Docker bajo `sandbox.docker.*` siguen aplicándose solo al backend Docker

  </Accordion>
</AccordionGroup>

#### Modos de espacio de trabajo

OpenShell tiene dos modelos de espacio de trabajo. Esta es la parte que más importa en la práctica.

<Tabs>
  <Tab title="mirror (local canónico)">
    Usa `plugins.entries.openshell.config.mode: "mirror"` cuando quieras que el **espacio de trabajo local permanezca canónico**.

    Comportamiento:

    - Antes de `exec`, OpenClaw sincroniza el espacio de trabajo local hacia el entorno aislado OpenShell.
    - Después de `exec`, OpenClaw sincroniza el espacio de trabajo remoto de vuelta al espacio de trabajo local.
    - Las herramientas de archivos siguen operando a través del puente del entorno aislado, pero el espacio de trabajo local sigue siendo la fuente de verdad entre turnos.

    Usa esto cuando:

    - editas archivos localmente fuera de OpenClaw y quieres que esos cambios aparezcan automáticamente en el sandbox
    - quieres que el sandbox de OpenShell se comporte lo más parecido posible al backend de Docker
    - quieres que el espacio de trabajo del host refleje las escrituras del sandbox después de cada turno de ejecución

    Compensación: costo adicional de sincronización antes y después de la ejecución.

  </Tab>
  <Tab title="remote (OpenShell canónico)">
    Usa `plugins.entries.openshell.config.mode: "remote"` cuando quieras que el **espacio de trabajo de OpenShell pase a ser canónico**.

    Comportamiento:

    - Cuando el sandbox se crea por primera vez, OpenClaw inicializa una vez el espacio de trabajo remoto desde el espacio de trabajo local.
    - Después de eso, `exec`, `read`, `write`, `edit` y `apply_patch` operan directamente sobre el espacio de trabajo remoto de OpenShell.
    - OpenClaw **no** sincroniza los cambios remotos de vuelta al espacio de trabajo local después de la ejecución.
    - Las lecturas de medios en tiempo de prompt siguen funcionando porque las herramientas de archivos y medios leen a través del puente del sandbox en lugar de asumir una ruta local del host.
    - El transporte es SSH hacia el sandbox de OpenShell devuelto por `openshell sandbox ssh-config`.

    Consecuencias importantes:

    - Si editas archivos en el host fuera de OpenClaw después del paso de inicialización, el sandbox remoto **no** verá esos cambios automáticamente.
    - Si el sandbox se recrea, el espacio de trabajo remoto se inicializa de nuevo desde el espacio de trabajo local.
    - Con `scope: "agent"` o `scope: "shared"`, ese espacio de trabajo remoto se comparte en ese mismo alcance.

    Usa esto cuando:

    - el sandbox deba vivir principalmente en el lado remoto de OpenShell
    - quieras reducir la sobrecarga de sincronización por turno
    - no quieras que las ediciones locales del host sobrescriban silenciosamente el estado del sandbox remoto

  </Tab>
</Tabs>

Elige `mirror` si piensas en el sandbox como un entorno de ejecución temporal. Elige `remote` si piensas en el sandbox como el espacio de trabajo real.

#### Ciclo de vida de OpenShell

Los sandboxes de OpenShell siguen gestionándose mediante el ciclo de vida normal del sandbox:

- `openclaw sandbox list` muestra tanto runtimes de OpenShell como runtimes de Docker
- `openclaw sandbox recreate` elimina el runtime actual y permite que OpenClaw lo recree en el siguiente uso
- la lógica de limpieza también es consciente del backend

Para el modo `remote`, recrear es especialmente importante:

- recrear elimina el espacio de trabajo remoto canónico para ese alcance
- el siguiente uso inicializa un espacio de trabajo remoto nuevo desde el espacio de trabajo local

Para el modo `mirror`, recrear principalmente restablece el entorno de ejecución remoto porque el espacio de trabajo local sigue siendo canónico de todos modos.

## Acceso al espacio de trabajo

`agents.defaults.sandbox.workspaceAccess` controla **qué puede ver el sandbox**:

<Tabs>
  <Tab title="none (predeterminado)">
    Las herramientas ven un espacio de trabajo de sandbox en `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Monta el espacio de trabajo del agente como solo lectura en `/agent` (deshabilita `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Monta el espacio de trabajo del agente con lectura/escritura en `/workspace`.
  </Tab>
</Tabs>

Con el backend de OpenShell:

- el modo `mirror` sigue usando el espacio de trabajo local como fuente canónica entre turnos de ejecución
- el modo `remote` usa el espacio de trabajo remoto de OpenShell como fuente canónica después de la inicialización inicial
- `workspaceAccess: "ro"` y `"none"` siguen restringiendo el comportamiento de escritura de la misma manera

Los medios entrantes se copian en el espacio de trabajo activo del sandbox (`media/inbound/*`).

<Note>
**Nota sobre Skills:** la herramienta `read` está enraizada en el sandbox. Con `workspaceAccess: "none"`, OpenClaw replica las skills elegibles en el espacio de trabajo del sandbox (`.../skills`) para que puedan leerse. Con `"rw"`, las skills del espacio de trabajo pueden leerse desde `/workspace/skills`.
</Note>

## Montajes bind personalizados

`agents.defaults.sandbox.docker.binds` monta directorios adicionales del host en el contenedor. Formato: `host:container:mode` (por ejemplo, `"/home/user/source:/source:rw"`).

Los binds globales y por agente se **combinan** (no se reemplazan). Bajo `scope: "shared"`, los binds por agente se ignoran.

`agents.defaults.sandbox.browser.binds` monta directorios adicionales del host solo en el contenedor del **navegador del sandbox**.

- Cuando se establece (incluido `[]`), reemplaza a `agents.defaults.sandbox.docker.binds` para el contenedor del navegador.
- Cuando se omite, el contenedor del navegador recurre a `agents.defaults.sandbox.docker.binds` (compatible con versiones anteriores).

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
**Seguridad de los binds**

- Los binds omiten el sistema de archivos del sandbox: exponen rutas del host con el modo que establezcas (`:ro` o `:rw`).
- OpenClaw bloquea fuentes de bind peligrosas (por ejemplo: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` y montajes padre que las expondrían).
- OpenClaw también bloquea raíces comunes de credenciales de directorios personales, como `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` y `~/.ssh`.
- La validación de binds no es solo coincidencia de cadenas. OpenClaw normaliza la ruta de origen y luego la resuelve de nuevo a través del ancestro existente más profundo antes de volver a comprobar las rutas bloqueadas y las raíces permitidas.
- Eso significa que los escapes por padre symlink siguen fallando de forma cerrada incluso cuando la hoja final aún no existe. Ejemplo: `/workspace/run-link/new-file` sigue resolviéndose como `/var/run/...` si `run-link` apunta allí.
- Las raíces de origen permitidas se canonicalizan de la misma manera, por lo que una ruta que solo parece estar dentro de la lista de permitidos antes de la resolución de symlinks sigue rechazándose como `outside allowed roots`.
- Los montajes sensibles (secretos, claves SSH, credenciales de servicio) deberían ser `:ro` salvo que sean absolutamente necesarios.
- Combina con `workspaceAccess: "ro"` si solo necesitas acceso de lectura al espacio de trabajo; los modos de bind se mantienen independientes.
- Consulta [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated) para ver cómo interactúan los binds con la política de herramientas y la ejecución elevada.

</Warning>

## Imágenes y configuración

Imagen de Docker predeterminada: `openclaw-sandbox:bookworm-slim`

<Note>
**Checkout de código fuente vs instalación npm**

Los scripts auxiliares `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` y `scripts/sandbox-browser-setup.sh` solo están disponibles cuando se ejecuta desde un [checkout de código fuente](https://github.com/openclaw/openclaw). No se incluyen en el paquete npm.

Si instalaste OpenClaw mediante `npm install -g openclaw`, usa en su lugar los comandos `docker build` en línea que se muestran abajo.
</Note>

<Steps>
  <Step title="Compilar la imagen predeterminada">
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

    La imagen predeterminada **no** incluye Node. Si una skill necesita Node (u otros runtimes), incorpora una imagen personalizada o instala mediante `sandbox.docker.setupCommand` (requiere salida de red + raíz escribible + usuario root).

    OpenClaw no sustituye silenciosamente por `debian:bookworm-slim` simple cuando falta `openclaw-sandbox:bookworm-slim`. Las ejecuciones de sandbox que apuntan a la imagen predeterminada fallan rápido con una instrucción de compilación hasta que la compiles, porque la imagen incluida lleva `python3` para los auxiliares de escritura/edición del sandbox.

  </Step>
  <Step title="Opcional: compilar la imagen común">
    Para una imagen de sandbox más funcional con herramientas comunes (por ejemplo `curl`, `jq`, `nodejs`, `python3`, `git`):

    Desde un checkout de código fuente:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Desde una instalación npm, compila primero la imagen predeterminada (ver arriba), luego compila la imagen común encima usando el [`Dockerfile.sandbox-common`](https://github.com/openclaw/openclaw/blob/main/Dockerfile.sandbox-common) del repositorio.

    Luego establece `agents.defaults.sandbox.docker.image` en `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Opcional: compilar la imagen del navegador del sandbox">
    Desde un checkout de código fuente:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Desde una instalación npm, compila usando el [`Dockerfile.sandbox-browser`](https://github.com/openclaw/openclaw/blob/main/Dockerfile.sandbox-browser) del repositorio.

  </Step>
</Steps>

De forma predeterminada, los contenedores de sandbox de Docker se ejecutan **sin red**. Sobrescríbelo con `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Valores predeterminados de Chromium del navegador del sandbox">
    La imagen incluida del navegador del sandbox también aplica valores predeterminados conservadores de inicio de Chromium para cargas de trabajo en contenedores. Los valores predeterminados actuales del contenedor incluyen:

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
    - Las tres flags de endurecimiento gráfico (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) son opcionales y son útiles cuando los contenedores no tienen compatibilidad con GPU. Establece `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` si tu carga de trabajo requiere WebGL u otras funciones 3D/del navegador.
    - `--disable-extensions` está habilitado de forma predeterminada y puede deshabilitarse con `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` para flujos que dependen de extensiones.
    - `--renderer-process-limit=2` se controla con `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, donde `0` conserva el valor predeterminado de Chromium.

    Si necesitas un perfil de runtime diferente, usa una imagen personalizada del navegador y proporciona tu propio entrypoint. Para perfiles locales (no de contenedor) de Chromium, usa `browser.extraArgs` para agregar flags de inicio adicionales.

  </Accordion>
  <Accordion title="Valores predeterminados de seguridad de red">
    - `network: "host"` está bloqueado.
    - `network: "container:<id>"` está bloqueado de forma predeterminada (riesgo de omisión por unión de espacio de nombres).
    - Anulación de emergencia: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Las instalaciones de Docker y el gateway en contenedor se encuentran aquí: [Docker](/es/install/docker)

Para despliegues de gateway de Docker, `scripts/docker/setup.sh` puede iniciar la configuración del sandbox. Establece `OPENCLAW_SANDBOX=1` (o `true`/`yes`/`on`) para habilitar esa ruta. Puedes sobrescribir la ubicación del socket con `OPENCLAW_DOCKER_SOCKET`. Configuración completa y referencia de entorno: [Docker](/es/install/docker#agent-sandbox).

## setupCommand (configuración única del contenedor)

`setupCommand` se ejecuta **una vez** después de que se crea el contenedor del sandbox (no en cada ejecución). Se ejecuta dentro del contenedor mediante `sh -lc`.

Rutas:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Por agente: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Errores comunes">
    - El `docker.network` predeterminado es `"none"` (sin salida), por lo que las instalaciones de paquetes fallarán.
    - `docker.network: "container:<id>"` requiere `dangerouslyAllowContainerNamespaceJoin: true` y es solo para emergencia.
    - `readOnlyRoot: true` impide escrituras; establece `readOnlyRoot: false` o incorpora una imagen personalizada.
    - `user` debe ser root para instalaciones de paquetes (omite `user` o establece `user: "0:0"`).
    - La ejecución en sandbox **no** hereda `process.env` del host. Usa `agents.defaults.sandbox.docker.env` (o una imagen personalizada) para claves de API de skills.

  </Accordion>
</AccordionGroup>

## Política de herramientas y vías de escape

Las políticas de permitir/denegar herramientas siguen aplicándose antes que las reglas del sandbox. Si una herramienta está denegada globalmente o por agente, el sandbox no la vuelve a habilitar.

`tools.elevated` es una vía de escape explícita que ejecuta `exec` fuera del sandbox (`gateway` de forma predeterminada, o `node` cuando el destino de exec es `node`). Las directivas `/exec` solo se aplican a remitentes autorizados y persisten por sesión; para deshabilitar `exec` por completo, usa una denegación en la política de herramientas (consulta [Sandbox vs política de herramientas vs elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated)).

Depuración:

- Usa `openclaw sandbox explain` para inspeccionar el modo de sandbox efectivo, la política de herramientas y las claves de configuración para corregirlo.
- Consulta [Sandbox vs política de herramientas vs elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated) para el modelo mental de "¿por qué está bloqueado esto?".

Mantenlo bloqueado.

## Sobrescrituras multiagente

Cada agente puede sobrescribir sandbox + herramientas: `agents.list[].sandbox` y `agents.list[].tools` (más `agents.list[].tools.sandbox.tools` para la política de herramientas del sandbox). Consulta [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) para la precedencia.

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

- [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) — sobrescrituras por agente y precedencia
- [OpenShell](/es/gateway/openshell) — configuración del backend de sandbox gestionado, modos de workspace y referencia de configuración
- [Configuración del sandbox](/es/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs política de herramientas vs elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated) — depuración de "¿por qué está bloqueado esto?"
- [Seguridad](/es/gateway/security)

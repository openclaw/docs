---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Cómo funciona el aislamiento de OpenClaw: modos, ámbitos, acceso al espacio de trabajo e imágenes'
title: Aislamiento en entorno seguro
x-i18n:
    generated_at: "2026-07-19T01:58:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7e2cab130955ee38532838a97ad3c750921dad5e9fe6ed6c533837291e935cd5
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw puede ejecutar herramientas dentro de un backend de aislamiento para reducir el radio de impacto. El aislamiento está desactivado de forma predeterminada y se controla mediante `agents.defaults.sandbox` (global) o `agents.list[].sandbox` (por agente). El proceso del Gateway siempre permanece en el host; solo la ejecución de herramientas se traslada al entorno aislado cuando se habilita.

<Note>
Este no es un límite de seguridad perfecto, pero restringe considerablemente el acceso al sistema de archivos y a los procesos cuando el modelo hace algo inadecuado.
</Note>

## Qué se ejecuta en el entorno aislado

- Ejecución de herramientas: `exec`, `read`, `write`, `edit`, `apply_patch`, `process`, etc.
- El navegador aislado opcional (`agents.defaults.sandbox.browser`).

No se ejecutan en el entorno aislado:

- El propio proceso del Gateway.
- Cualquier herramienta autorizada explícitamente para ejecutarse fuera del entorno aislado mediante `tools.elevated`. La ejecución con privilegios elevados omite el aislamiento y se ejecuta en la ruta de escape configurada (`gateway` de forma predeterminada, o `node` cuando el destino de ejecución es `node`). Si el aislamiento está desactivado, `tools.elevated` no cambia nada, ya que la ejecución ya tiene lugar en el host. Consulte [Modo elevado](/es/tools/elevated).

## Modos, ámbito y backend

Tres ajustes independientes controlan el comportamiento del aislamiento:

| Ajuste  | Clave                             | Valores                      | Valor predeterminado |
| ------- | --------------------------------- | ---------------------------- | -------------------- |
| Modo    | `agents.defaults.sandbox.mode`    | `off`, `non-main`, `all`     | `off`    |
| Ámbito  | `agents.defaults.sandbox.scope`   | `agent`, `session`, `shared` | `agent`  |
| Backend | `agents.defaults.sandbox.backend` | `docker`, `ssh`, `openshell` | `docker` |

El **modo** controla cuándo se aplica el aislamiento:

- `off`: sin aislamiento.
- `non-main`: aísla todas las sesiones excepto la sesión principal del agente. La clave de la sesión principal siempre es `agent:<agentId>:main` (o `global` cuando `session.scope` es `"global"`); no se puede configurar. Las sesiones de grupos o canales utilizan sus propias claves, por lo que siempre se consideran no principales y se aíslan.
- `all`: todas las sesiones se ejecutan en un entorno aislado.

El **ámbito** controla cuántos contenedores o entornos se crean:

- `agent`: un contenedor por agente.
- `session`: un contenedor por sesión.
- `shared`: un contenedor compartido por todas las sesiones aisladas (las anulaciones por agente `docker`/`ssh`/`browser` se ignoran en este ámbito).

El **backend** controla qué entorno de ejecución ejecuta las herramientas aisladas. La configuración específica de SSH se encuentra en `agents.defaults.sandbox.ssh`; la configuración específica de OpenShell se encuentra en `plugins.entries.openshell.config`.

|                         | Docker                            | SSH                                  | OpenShell                                                   |
| ----------------------- | --------------------------------- | ------------------------------------ | ----------------------------------------------------------- |
| **Dónde se ejecuta**    | Contenedor local                  | Cualquier host accesible mediante SSH | Entorno aislado administrado por OpenShell                   |
| **Configuración**       | `scripts/sandbox-setup.sh`        | Clave SSH + host de destino           | Plugin de OpenShell habilitado                               |
| **Modelo del espacio de trabajo** | Montaje enlazado o copia | Remoto canónico (una inicialización) | `mirror` o `remote`                     |
| **Control de red**      | `docker.network` (predeterminado: ninguno) | Depende del host remoto | Depende de OpenShell                                         |
| **Navegador aislado**   | Compatible                        | No compatible                         | Aún no compatible                                           |
| **Montajes enlazados**  | `docker.binds`                | N/D                                   | N/D                                                         |
| **Ideal para**          | Desarrollo local, aislamiento completo | Delegación a una máquina remota  | Entornos aislados remotos administrados con sincronización bidireccional opcional |

## Backend de Docker

Docker es el backend predeterminado una vez habilitado el aislamiento. Ejecuta las herramientas y los navegadores aislados localmente mediante el socket del daemon de Docker (`/var/run/docker.sock`); el aislamiento procede de los espacios de nombres de Docker.

Valores predeterminados: `network: "none"` (sin salida), `readOnlyRoot: true`, `capDrop: ["ALL"]`, imagen `openclaw-sandbox:bookworm-slim`.

Para exponer las GPU del host, establezca `agents.defaults.sandbox.docker.gpus` (o la anulación por agente) en un valor como `"all"` o `"device=GPU-uuid"`. Este valor se pasa a la opción `--gpus` de Docker y requiere un entorno de ejecución del host compatible, como NVIDIA Container Toolkit.

<Warning>
**Restricciones de Docker fuera de Docker (DooD)**

Si se implementa el Gateway de OpenClaw como un contenedor de Docker, este orquesta contenedores de aislamiento hermanos mediante el socket de Docker del host (DooD). Esto introduce una restricción de asignación de rutas:

- **La configuración requiere rutas del host**: `openclaw.json` `workspace` debe contener la **ruta absoluta del host** (por ejemplo, `/home/user/.openclaw/workspaces`), no la ruta interna del contenedor del Gateway. El daemon de Docker evalúa las rutas en relación con el espacio de nombres del sistema operativo host, no con el espacio de nombres del propio Gateway.
- **Se requiere una asignación de volumen coincidente**: El proceso del Gateway también escribe archivos de Heartbeat y del puente en esa ruta `workspace`. Proporcione al contenedor del Gateway una asignación de volumen idéntica (`-v /home/user/.openclaw:/home/user/.openclaw`) para que la misma ruta del host también se resuelva correctamente desde el interior del contenedor del Gateway. Las asignaciones que no coinciden se manifiestan como `EACCES` cuando el Gateway intenta escribir su Heartbeat.
- **Modo de código de Codex**: cuando hay un entorno aislado de OpenClaw activo, OpenClaw deshabilita durante ese turno el modo de código nativo del servidor de aplicaciones de Codex, los servidores MCP del usuario y la ejecución de plugins respaldados por aplicaciones (estos se ejecutan desde el proceso del servidor de aplicaciones del host del Gateway, no desde el backend de aislamiento de OpenClaw), salvo que la política de herramientas del entorno aislado exponga las herramientas necesarias y se habilite explícitamente la ruta experimental del servidor de ejecución del entorno aislado. El acceso al shell se encamina entonces mediante herramientas respaldadas por el entorno aislado de OpenClaw, como `sandbox_exec` y `sandbox_process`. No monte el socket de Docker del host en los contenedores de aislamiento de los agentes ni en entornos aislados personalizados de Codex. Consulte [Arnés de Codex](/es/plugins/codex-harness) para conocer el comportamiento completo.

En hosts Ubuntu/AppArmor con el modo de aislamiento de Docker habilitado, la ejecución de shell `workspace-write` del servidor de aplicaciones de Codex necesita espacios de nombres de usuario sin privilegios dentro del contenedor de aislamiento, y puede fallar antes de iniciar el shell cuando el usuario del servicio no puede crearlos. También se necesita un espacio de nombres de red sin privilegios cuando la salida del entorno aislado de Docker está deshabilitada (`network: "none"`, el valor predeterminado). Síntomas habituales: `bwrap: setting up uid map: Permission denied` y `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. Ejecute `openclaw doctor`; si informa de un fallo en la prueba de espacios de nombres de bwrap de Codex, es preferible usar un perfil de AppArmor que conceda los espacios de nombres necesarios al proceso del servicio OpenClaw. `kernel.apparmor_restrict_unprivileged_userns=0` es una alternativa para todo el host que conlleva implicaciones de seguridad; úsela únicamente cuando esa postura de seguridad sea aceptable para el host.
</Warning>

### Navegador aislado

- El navegador aislado se inicia automáticamente (garantiza que se pueda acceder a CDP) cuando la herramienta de navegador lo necesita. Configúrelo mediante `agents.defaults.sandbox.browser.autoStart` (valor predeterminado: `true`) y `autoStartTimeoutMs` (valor predeterminado: 12s).
- Los contenedores del navegador aislado utilizan una red de Docker dedicada (`openclaw-sandbox-browser`) en lugar de la red global `bridge`. Configúrela mediante `agents.defaults.sandbox.browser.network`.
- `agents.defaults.sandbox.browser.cdpSourceRange` restringe la entrada de CDP en el límite del contenedor mediante una lista de CIDR permitidos (por ejemplo, `172.21.0.1/32`).
- El acceso de observación mediante noVNC está protegido con contraseña de forma predeterminada; OpenClaw genera una URL con token de corta duración que sirve una página de arranque local y abre noVNC con la contraseña en el fragmento de la URL (no en la cadena de consulta ni en los registros de cabeceras).
- `agents.defaults.sandbox.browser.allowHostControl` (valor predeterminado: `false`) permite que las sesiones aisladas seleccionen explícitamente el navegador del host.
- Listas opcionales de elementos permitidos controlan `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

## Backend de SSH

Utilice `backend: "ssh"` para aislar `exec`, las herramientas de archivos y las lecturas multimedia en cualquier máquina accesible mediante SSH.

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
          // O bien, use SecretRefs o contenido insertado en lugar de archivos locales:
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

- **Ciclo de vida**: OpenClaw crea una raíz remota por ámbito en `sandbox.ssh.workspaceRoot`. En el primer uso después de crearla o volver a crearla, inicializa una vez ese espacio de trabajo remoto a partir del espacio de trabajo local. A partir de entonces, `exec`, `read`, `write`, `edit`, `apply_patch`, las lecturas de contenido multimedia de las solicitudes y la preparación de contenido multimedia entrante se ejecutan directamente en el espacio de trabajo remoto mediante SSH. OpenClaw no vuelve a sincronizar automáticamente los cambios remotos con el espacio de trabajo local.
- **Material de autenticación**: `identityFile`/`certificateFile`/`knownHostsFile` hacen referencia a archivos locales existentes. `identityData`/`certificateData`/`knownHostsData` aceptan cadenas insertadas o SecretRefs, que se resuelven mediante la instantánea habitual del entorno de ejecución de secretos, se escriben en archivos temporales con el modo `0600` y se eliminan cuando termina la sesión SSH. Si se establecen una variante `*File` y una variante `*Data` para el mismo elemento, `*Data` tiene prioridad en esa sesión.
- **Consecuencias del modelo remoto canónico**: el espacio de trabajo SSH remoto se convierte en el estado real del entorno aislado tras la inicialización. Las modificaciones locales del host realizadas fuera de OpenClaw después de la inicialización no son visibles de forma remota hasta que se vuelve a crear el entorno aislado. `openclaw sandbox recreate` elimina la raíz remota por ámbito y vuelve a inicializarla desde el entorno local en el siguiente uso. El aislamiento del navegador no es compatible con este backend y los ajustes `sandbox.docker.*` no se aplican a él.

## Backend de OpenShell

Utilice `backend: "openshell"` para aislar herramientas en un entorno remoto administrado por OpenShell. OpenShell reutiliza el mismo transporte SSH y el mismo puente del sistema de archivos remoto que el backend SSH genérico, y añade el ciclo de vida de OpenShell (`sandbox create/get/delete/ssh-config`) junto con un modo opcional de sincronización del espacio de trabajo `mirror`.

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

`mode: "mirror"` (predeterminado) mantiene el espacio de trabajo local como canónico: OpenClaw sincroniza el contenido local con el entorno aislado antes de `exec` y lo vuelve a sincronizar después. `mode: "remote"` inicializa una vez el espacio de trabajo remoto a partir del local y, a continuación, ejecuta `exec`/`read`/`write`/`edit`/`apply_patch` directamente en el espacio de trabajo remoto sin volver a sincronizarlo; las ediciones locales posteriores a la inicialización no son visibles hasta que se ejecuta `openclaw sandbox recreate`. Con `scope: "agent"` o `scope: "shared"`, ese espacio de trabajo remoto se comparte en el mismo ámbito. Limitaciones actuales: el navegador del entorno aislado todavía no es compatible y `sandbox.docker.binds` no se aplica a este backend.

`openclaw sandbox list`/`recreate`/prune tratan los entornos de ejecución de OpenShell del mismo modo que los de Docker; la lógica de depuración tiene en cuenta el backend.

Para consultar todos los requisitos previos, la referencia de configuración, la comparación de modos del espacio de trabajo y los detalles del ciclo de vida, véase [OpenShell](/es/gateway/openshell).

## Acceso al espacio de trabajo

`agents.defaults.sandbox.workspaceAccess` controla qué puede ver el entorno aislado:

| Valor            | Comportamiento                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `none` (predeterminado) | Las herramientas ven un espacio de trabajo aislado del entorno aislado en `~/.openclaw/sandboxes`.                    |
| `ro`             | Monta el espacio de trabajo del agente en modo de solo lectura en `/agent` (deshabilita `write`/`edit`/`apply_patch`). |
| `rw`             | Monta el espacio de trabajo del agente en modo de lectura/escritura en `/workspace`.                                    |

Con el backend de OpenShell, el modo `mirror` sigue utilizando el espacio de trabajo local como fuente canónica entre turnos de ejecución, el modo `remote` utiliza el espacio de trabajo remoto de OpenShell como canónico después de la inicialización y `workspaceAccess: "ro"`/`"none"` siguen restringiendo el comportamiento de escritura del mismo modo.

Los archivos multimedia entrantes se copian en el espacio de trabajo activo del entorno aislado (`media/inbound/*`).

<Note>
**Skills**: la herramienta `read` está vinculada a la raíz del entorno aislado. Con `workspaceAccess: "none"`, OpenClaw replica las Skills aptas en el espacio de trabajo del entorno aislado (`.../skills`) para que puedan leerse. Con `"rw"`, las Skills del espacio de trabajo pueden leerse desde `/workspace/skills`, y las Skills aptas administradas, incluidas o de plugins se materializan en la ruta generada de solo lectura `/workspace/.openclaw/sandbox-skills/skills`.
</Note>

## Varias carpetas para un agente

Utilice montajes vinculados de Docker cuando un agente aislado necesite más carpetas además de su espacio de trabajo principal. Cada entrada asigna una carpeta del host a una ruta del contenedor con un modo de acceso explícito:

```text
host-directory:container-directory:ro
host-directory:container-directory:rw
```

- `ro` hace que la carpeta montada sea de solo lectura dentro del entorno aislado.
- `rw` permite que las herramientas y los procesos del entorno aislado modifiquen la carpeta del host.
- La ruta del contenedor es la ruta que utiliza el agente. Las rutas del host no se exponen automáticamente.

Este ejemplo proporciona al agente `research` un espacio de trabajo principal con acceso de escritura, material de referencia de solo lectura en `/reference` y una carpeta de salida independiente con acceso de escritura en `/drafts`:

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

`workspaceAccess` y los modos de montaje vinculado son independientes:

| Configuración                          | Controla                                                                    |
| -------------------------------- | --------------------------------------------------------------------------- |
| `workspaceAccess: "none"`        | Utiliza un espacio de trabajo aislado del entorno aislado; no expone el espacio de trabajo del agente.    |
| `workspaceAccess: "ro"`          | Monta el espacio de trabajo del agente en modo de solo lectura en `/agent`.                           |
| `workspaceAccess: "rw"`          | Monta el espacio de trabajo del agente en modo de lectura/escritura en `/workspace`.                      |
| Entrada `docker.binds` `:ro`/`:rw` | Controla únicamente esa carpeta adicional del host en la ruta configurada del contenedor. |

Cambiar `workspaceAccess` no cambia un montaje vinculado adicional de `ro` a `rw`, ni viceversa. Los `docker.binds` globales y por agente se combinan. Mantenga `scope: "agent"` o `"session"` para los montajes vinculados por agente; `scope: "shared"` ignora todas las anulaciones de Docker por agente y utiliza únicamente los montajes vinculados globales.

Los montajes vinculados son el límite compatible para varias carpetas porque Docker construye la vista del sistema de archivos del contenedor mediante aislamiento de montajes, y el modo `ro`/`rw` se aplica a todos los procesos del entorno aislado. Ese límite abarca `exec`, las herramientas del sistema de archivos, los procesos secundarios y las bibliotecas sin duplicar las comprobaciones de autorización de rutas en cada ruta de código de OpenClaw. Una lista de rutas permitidas del lado del host no puede proporcionar el mismo límite completo cuando un shell o una dependencia permitidos pueden acceder directamente a los archivos.

La opción `dangerouslyAllowExternalBindSources` requiere activación explícita y solo permite fuentes situadas fuera de las raíces del espacio de trabajo. No deshabilita las comprobaciones de OpenClaw para sistemas, credenciales, sockets de Docker, directorios superiores con enlaces simbólicos ni destinos reservados bloqueados. Utilice la carpeta más pequeña posible, use `ro` salvo que se requieran escrituras y vuelva a crear el entorno aislado después de cambiar los montajes:

```bash
openclaw sandbox recreate --agent research
```

### Otros comportamientos de los montajes vinculados

`agents.defaults.sandbox.docker.binds` configura los montajes globales. El formato es la misma forma `host:container:mode` (por ejemplo, `"/home/user/source:/source:rw"`).

`agents.defaults.sandbox.browser.binds` monta directorios adicionales del host únicamente en el contenedor del **navegador del entorno aislado**. Cuando se establece (incluido `[]`), sustituye a `docker.binds` para el contenedor del navegador; cuando se omite, el contenedor del navegador utiliza `docker.binds` como alternativa.

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
**Seguridad de los montajes vinculados**

- Los montajes vinculados eluden el sistema de archivos del entorno aislado: exponen rutas del host con el modo que se establezca (`:ro` o `:rw`).
- OpenClaw bloquea de forma predeterminada las fuentes de montaje peligrosas: rutas del sistema (`/etc`, `/proc`, `/sys`, `/dev`, `/root`, `/boot`), directorios de sockets de Docker (`/run`, `/var/run` y sus variantes `docker.sock`) y raíces habituales de credenciales del directorio de inicio (`~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, `~/.ssh`).
- La validación normaliza la ruta de origen y después vuelve a resolverla a través del antecesor existente más profundo antes de comprobar de nuevo las rutas bloqueadas y las raíces permitidas, por lo que los escapes mediante enlaces simbólicos en directorios superiores se bloquean incluso cuando la hoja final todavía no existe (por ejemplo, `/workspace/run-link/new-file` sigue resolviéndose como `/var/run/...` si `run-link` apunta allí).
- Los destinos de montaje vinculado que ocultan los puntos de montaje reservados del contenedor (`/workspace`, `/agent`) también se bloquean de forma predeterminada; anule este comportamiento con `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true`.
- Las fuentes de montaje vinculado situadas fuera de las raíces permitidas del espacio de trabajo o del espacio de trabajo del agente se bloquean de forma predeterminada; anule este comportamiento con `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true`. Las raíces permitidas se convierten en canónicas del mismo modo, por lo que una ruta que solo parece estar dentro de la lista permitida antes de resolver los enlaces simbólicos se sigue rechazando por estar fuera de las raíces permitidas.
- Los montajes sensibles (secretos, claves SSH y credenciales de servicios) deben ser `:ro`, salvo que sea absolutamente necesario.
- Combínelo con `workspaceAccess: "ro"` si solo se necesita acceso de lectura al espacio de trabajo; los modos de montaje vinculado siguen siendo independientes.
- Consulte [Entorno aislado frente a política de herramientas frente a ejecución elevada](/es/gateway/sandbox-vs-tool-policy-vs-elevated) para saber cómo interactúan los montajes vinculados con la política de herramientas y la ejecución elevada.

</Warning>

## Imágenes y configuración

Imagen predeterminada de Docker: `openclaw-sandbox:bookworm-slim`

<Note>
**Checkout del código fuente frente a instalación mediante npm**

Los scripts auxiliares `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` y `scripts/sandbox-browser-setup.sh` solo están disponibles cuando se ejecutan desde un [checkout del código fuente](https://github.com/openclaw/openclaw). No se incluyen en el paquete npm.

Si OpenClaw se instaló mediante `npm install -g openclaw`, utilice en su lugar los comandos `docker build` insertados que se muestran a continuación.
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

    La imagen predeterminada **no** incluye Node. Si una Skill necesita Node (u otros entornos de ejecución), cree una imagen personalizada que los incluya o instálelos mediante `sandbox.docker.setupCommand` (requiere salida de red, una raíz con acceso de escritura y el usuario root).

    OpenClaw no sustituye de forma silenciosa `debian:bookworm-slim` sin modificaciones cuando falta `openclaw-sandbox:bookworm-slim`. Las ejecuciones del entorno aislado destinadas a la imagen predeterminada fallan inmediatamente con una instrucción de compilación hasta que se compile, porque la imagen incluida contiene `python3` para los auxiliares de escritura y edición del entorno aislado.

  </Step>
  <Step title="Opcional: compilar la imagen común">
    Para obtener una imagen del entorno aislado más funcional con herramientas habituales (por ejemplo, `curl`, `jq`, Node 24, pnpm, `python3` y `git`):

    Desde un checkout del código fuente:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Desde una instalación mediante npm, compile primero la imagen predeterminada (véase la información anterior) y después compile sobre ella la imagen común utilizando [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) del repositorio.

    A continuación, establezca `agents.defaults.sandbox.docker.image` en `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Opcional: compilar la imagen del navegador del entorno aislado">
    Desde un checkout del código fuente:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    Desde una instalación mediante npm, compile utilizando [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) del repositorio.

  </Step>
</Steps>

De forma predeterminada, los contenedores del entorno aislado de Docker se ejecutan **sin red**. Anule este comportamiento con `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Valores predeterminados de Chromium para el navegador del entorno aislado">
    La imagen incluida del navegador del entorno aislado aplica indicadores conservadores de inicio de Chromium para cargas de trabajo en contenedores:

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
    - `--disable-3d-apis`, `--disable-gpu`, `--disable-software-rasterizer` de forma predeterminada; estas opciones de refuerzo gráfico ayudan a los contenedores sin compatibilidad con GPU. Establezca `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` si la carga de trabajo necesita WebGL u otras funciones 3D.
    - `--disable-extensions` de forma predeterminada; establezca `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` para los flujos que dependen de extensiones.
    - `--renderer-process-limit=2` de forma predeterminada; se controla mediante `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, donde `0` mantiene el valor predeterminado de Chromium.

    Si se necesita un perfil de entorno de ejecución diferente, utilice una imagen de navegador personalizada y proporcione un punto de entrada propio. Para los perfiles locales de Chromium (sin contenedor), utilice `browser.extraArgs` para añadir opciones de inicio adicionales.

  </Accordion>
  <Accordion title="Valores predeterminados de seguridad de red">
    - `network: "host"` está bloqueado.
    - `network: "container:<id>"` está bloqueado de forma predeterminada (riesgo de eludir las restricciones al unirse al espacio de nombres).
    - Excepción de emergencia: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Las instalaciones de Docker y el Gateway en contenedores se describen aquí: [Docker](/es/install/docker)

En despliegues del Gateway con Docker, `scripts/docker/setup.sh` puede inicializar la configuración del entorno aislado. Establezca `OPENCLAW_SANDBOX=1` (o `true`/`yes`/`on`) para habilitar esta vía. Cambie la ubicación del socket mediante `OPENCLAW_DOCKER_SOCKET`. Configuración completa y referencia de variables de entorno: [Docker](/es/install/docker#agent-sandbox).

## setupCommand (configuración única del contenedor)

`setupCommand` se ejecuta **una sola vez** después de crear el contenedor del entorno aislado (no en cada ejecución). Se ejecuta dentro del contenedor mediante `sh -lc`.

Rutas:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Por agente: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Errores comunes">
    - El valor predeterminado de `docker.network` es `"none"` (sin salida a la red), por lo que las instalaciones de paquetes fallarán.
    - `docker.network: "container:<id>"` requiere `dangerouslyAllowContainerNamespaceJoin: true` y solo debe usarse como medida de emergencia.
    - `readOnlyRoot: true` impide las escrituras; establezca `readOnlyRoot: false` o genere una imagen personalizada.
    - `user` debe ser root para instalar paquetes (omita `user` o establezca `user: "0:0"`).
    - La ejecución en el entorno aislado **no** hereda `process.env` del host. Utilice `agents.defaults.sandbox.docker.env` (o una imagen personalizada) para las claves de API de Skills.
    - Los valores de `agents.defaults.sandbox.docker.env` se pasan como variables de entorno explícitas del contenedor Docker. Cualquier persona con acceso al daemon de Docker puede inspeccionarlos mediante comandos de metadatos de Docker como `docker inspect`. Utilice una imagen personalizada, un archivo de secretos montado u otra vía de entrega de secretos si esa exposición de metadatos no es aceptable.

  </Accordion>
</AccordionGroup>

## Política de herramientas y vías de escape

Las políticas de permisos y denegaciones de herramientas siguen aplicándose antes que las reglas del entorno aislado. Si una herramienta está denegada globalmente o para un agente, el aislamiento no vuelve a habilitarla.

`tools.elevated` es una vía de escape explícita que ejecuta `exec` fuera del entorno aislado (`gateway` de forma predeterminada, o `node` cuando el destino de ejecución es `node`). Las directivas `/exec` solo se aplican a remitentes autorizados y persisten durante la sesión; para deshabilitar por completo `exec`, utilice la denegación de la política de herramientas (consulte [Entorno aislado frente a política de herramientas y modo elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated)).

Depuración:

- `openclaw sandbox list` muestra los contenedores del entorno aislado, el estado, la coincidencia de imagen, la antigüedad, el tiempo de inactividad y la sesión o el agente asociados.
- `openclaw sandbox explain [--session <key>] [--agent <id>]` inspecciona el modo efectivo del entorno aislado, el espacio de trabajo del host, el directorio de trabajo del entorno de ejecución, los montajes de Docker, la política de herramientas y las claves de configuración para corregir problemas. Su campo `workspaceRoot` sigue siendo la raíz configurada del entorno aislado; `effectiveHostWorkspaceRoot` muestra dónde se encuentra realmente el espacio de trabajo activo.
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` elimina contenedores y entornos para que se vuelvan a crear con la configuración actual la próxima vez que se utilicen.
- Consulte [Entorno aislado frente a política de herramientas y modo elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated) para comprender el motivo de los bloqueos.

## Configuraciones específicas para varios agentes

Cada agente puede personalizar el entorno aislado y las herramientas: `agents.list[].sandbox` y `agents.list[].tools` (además de `agents.list[].tools.sandbox.tools` para la política de herramientas del entorno aislado). Consulte [Entorno aislado y herramientas para varios agentes](/es/tools/multi-agent-sandbox-tools) para conocer la precedencia.

## Ejemplo de habilitación mínima

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

- [Entorno aislado y herramientas para varios agentes](/es/tools/multi-agent-sandbox-tools) -- configuraciones específicas por agente y precedencia
- [OpenShell](/es/gateway/openshell) -- configuración del backend de entorno aislado administrado, modos de espacio de trabajo y referencia de configuración
- [Configuración del entorno aislado](/es/gateway/config-agents#agentsdefaultssandbox)
- [Entorno aislado frente a política de herramientas y modo elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated) -- diagnóstico del motivo de los bloqueos
- [Seguridad](/es/gateway/security)

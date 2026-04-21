---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'Cómo funciona el sandboxing de OpenClaw: modos, alcances, acceso al workspace e imágenes'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-21T05:14:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35405c103f37f7f7247462ed5bc54a4b0d2a19ca2a373cf10f7f231a62c2c7c4
    source_path: gateway/sandboxing.md
    workflow: 15
---

# Sandboxing

OpenClaw puede ejecutar **herramientas dentro de backends de sandbox** para reducir el radio de impacto.
Esto es **opcional** y se controla mediante configuración (`agents.defaults.sandbox` o
`agents.list[].sandbox`). Si el sandboxing está desactivado, las herramientas se ejecutan en el host.
El Gateway permanece en el host; la ejecución de herramientas se realiza en un sandbox aislado
cuando está activado.

Esto no es un límite de seguridad perfecto, pero sí limita de forma importante el acceso
al sistema de archivos y a los procesos cuando el modelo hace algo tonto.

## Qué se ejecuta en sandbox

- Ejecución de herramientas (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, etc.).
- Navegador opcional en sandbox (`agents.defaults.sandbox.browser`).
  - De forma predeterminada, el navegador del sandbox se inicia automáticamente (garantiza que CDP sea accesible) cuando la herramienta de navegador lo necesita.
    Configúralo mediante `agents.defaults.sandbox.browser.autoStart` y `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - De forma predeterminada, los contenedores del navegador del sandbox usan una red de Docker dedicada (`openclaw-sandbox-browser`) en lugar de la red global `bridge`.
    Configúralo con `agents.defaults.sandbox.browser.network`.
  - `agents.defaults.sandbox.browser.cdpSourceRange` opcional restringe el ingreso de CDP en el borde del contenedor con una lista de permitidos CIDR (por ejemplo `172.21.0.1/32`).
  - El acceso de observador noVNC está protegido por contraseña de forma predeterminada; OpenClaw emite una URL con token de corta duración que sirve una página bootstrap local y abre noVNC con la contraseña en el fragmento de la URL (no en los logs de query/header).
  - `agents.defaults.sandbox.browser.allowHostControl` permite que las sesiones en sandbox apunten explícitamente al navegador del host.
  - Las listas de permitidos opcionales controlan `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

No se ejecuta en sandbox:

- El propio proceso Gateway.
- Cualquier herramienta permitida explícitamente para ejecutarse fuera del sandbox (por ejemplo `tools.elevated`).
  - **Elevated exec omite el sandboxing y usa la ruta de escape configurada (`gateway` de forma predeterminada, o `node` cuando el destino de exec es `node`).**
  - Si el sandboxing está desactivado, `tools.elevated` no cambia la ejecución (ya está en el host). Consulta [Modo Elevated](/es/tools/elevated).

## Modos

`agents.defaults.sandbox.mode` controla **cuándo** se usa el sandboxing:

- `"off"`: sin sandboxing.
- `"non-main"`: sandbox solo para sesiones **no principales** (predeterminado si quieres chats normales en el host).
- `"all"`: cada sesión se ejecuta en un sandbox.
  Nota: `"non-main"` se basa en `session.mainKey` (predeterminado `"main"`), no en el id del agente.
  Las sesiones de grupo/canal usan sus propias claves, así que cuentan como no principales y se ejecutarán en sandbox.

## Alcance

`agents.defaults.sandbox.scope` controla **cuántos contenedores** se crean:

- `"agent"` (predeterminado): un contenedor por agente.
- `"session"`: un contenedor por sesión.
- `"shared"`: un contenedor compartido por todas las sesiones en sandbox.

## Backend

`agents.defaults.sandbox.backend` controla **qué runtime** proporciona el sandbox:

- `"docker"` (predeterminado cuando el sandboxing está activado): runtime de sandbox local respaldado por Docker.
- `"ssh"`: runtime de sandbox remoto genérico respaldado por SSH.
- `"openshell"`: runtime de sandbox respaldado por OpenShell.

La configuración específica de SSH vive en `agents.defaults.sandbox.ssh`.
La configuración específica de OpenShell vive en `plugins.entries.openshell.config`.

### Elegir un backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Dónde se ejecuta** | Contenedor local                 | Cualquier host accesible por SSH | Sandbox administrado por OpenShell                 |
| **Configuración**   | `scripts/sandbox-setup.sh`       | Clave SSH + host de destino    | Plugin OpenShell activado                           |
| **Modelo de workspace** | Bind-mount o copia            | Remoto canónico (siembra una vez) | `mirror` o `remote`                              |
| **Control de red**  | `docker.network` (predeterminado: none) | Depende del host remoto | Depende de OpenShell                                |
| **Sandbox del navegador** | Compatible                 | No compatible                  | Aún no compatible                                   |
| **Bind mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **Ideal para**      | Desarrollo local, aislamiento completo | Delegar a una máquina remota | Sandboxes remotos administrados con sincronización bidireccional opcional |

### Backend Docker

El sandboxing está desactivado de forma predeterminada. Si activas el sandboxing y no eliges un
backend, OpenClaw usa el backend Docker. Ejecuta herramientas y navegadores en sandbox
localmente mediante el socket del daemon de Docker (`/var/run/docker.sock`). El aislamiento del contenedor
sandbox está determinado por los espacios de nombres de Docker.

**Restricciones de Docker-out-of-Docker (DooD)**:
Si implementas el propio OpenClaw Gateway como un contenedor Docker, este orquesta contenedores sandbox hermanos usando el socket Docker del host (DooD). Esto introduce una restricción específica de mapeo de rutas:

- **La configuración requiere rutas del host**: la configuración `workspace` en `openclaw.json` DEBE contener la **ruta absoluta del host** (por ejemplo `/home/user/.openclaw/workspaces`), no la ruta interna del contenedor Gateway. Cuando OpenClaw pide al daemon de Docker que cree un sandbox, el daemon evalúa las rutas en relación con el espacio de nombres del sistema operativo del host, no con el espacio de nombres del Gateway.
- **Paridad de puente FS (mapa de volúmenes idéntico)**: el proceso nativo OpenClaw Gateway también escribe archivos de heartbeat y bridge en el directorio `workspace`. Como el Gateway evalúa la misma cadena exacta (la ruta del host) desde dentro de su propio entorno en contenedor, la implementación del Gateway DEBE incluir un mapa de volúmenes idéntico que enlace el espacio de nombres del host de forma nativa (`-v /home/user/.openclaw:/home/user/.openclaw`).

Si mapeas rutas internamente sin paridad absoluta con el host, OpenClaw lanza de forma nativa un error de permisos `EACCES` al intentar escribir su heartbeat dentro del entorno del contenedor porque la cadena de ruta completamente calificada no existe de forma nativa.

### Backend SSH

Usa `backend: "ssh"` cuando quieras que OpenClaw ejecute en sandbox `exec`, herramientas de archivos y lecturas de medios en
una máquina arbitraria accesible por SSH.

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

Cómo funciona:

- OpenClaw crea una raíz remota por alcance en `sandbox.ssh.workspaceRoot`.
- En el primer uso después de crear o recrear, OpenClaw inicializa ese workspace remoto desde el workspace local una vez.
- Después de eso, `exec`, `read`, `write`, `edit`, `apply_patch`, lecturas de medios del prompt y el staging de medios entrantes se ejecutan directamente contra el workspace remoto por SSH.
- OpenClaw no sincroniza automáticamente los cambios remotos de vuelta al workspace local.

Material de autenticación:

- `identityFile`, `certificateFile`, `knownHostsFile`: usan archivos locales existentes y los pasan mediante la configuración de OpenSSH.
- `identityData`, `certificateData`, `knownHostsData`: usan cadenas inline o SecretRefs. OpenClaw las resuelve mediante la instantánea normal del runtime de secretos, las escribe en archivos temporales con `0600` y las elimina cuando termina la sesión SSH.
- Si `*File` y `*Data` están definidos para el mismo elemento, `*Data` prevalece para esa sesión SSH.

Este es un modelo **remoto canónico**. El workspace SSH remoto se convierte en el estado real del sandbox después de la siembra inicial.

Consecuencias importantes:

- Las ediciones locales en el host realizadas fuera de OpenClaw después del paso de siembra no son visibles de forma remota hasta que recrees el sandbox.
- `openclaw sandbox recreate` elimina la raíz remota por alcance y vuelve a inicializar desde local en el siguiente uso.
- El sandboxing del navegador no es compatible con el backend SSH.
- La configuración `sandbox.docker.*` no se aplica al backend SSH.

### Backend OpenShell

Usa `backend: "openshell"` cuando quieras que OpenClaw ejecute herramientas en sandbox dentro de un
entorno remoto administrado por OpenShell. Para la guía completa de configuración, la referencia
de configuración y la comparación de modos de workspace, consulta la
[página de OpenShell](/es/gateway/openshell).

OpenShell reutiliza el mismo transporte SSH central y el mismo puente de sistema de archivos remoto que el
backend SSH genérico, y añade ciclo de vida específico de OpenShell
(`sandbox create/get/delete`, `sandbox ssh-config`) además del modo opcional de workspace `mirror`.

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

- `mirror` (predeterminado): el workspace local sigue siendo el canónico. OpenClaw sincroniza los archivos locales en OpenShell antes de `exec` y sincroniza de vuelta el workspace remoto después de `exec`.
- `remote`: el workspace de OpenShell es canónico después de crear el sandbox. OpenClaw inicializa el workspace remoto una vez desde el workspace local; luego las herramientas de archivos y `exec` se ejecutan directamente contra el sandbox remoto sin sincronizar los cambios de vuelta.

Detalles del transporte remoto:

- OpenClaw pide a OpenShell una configuración SSH específica del sandbox mediante `openshell sandbox ssh-config <name>`.
- El núcleo escribe esa configuración SSH en un archivo temporal, abre la sesión SSH y reutiliza el mismo puente de sistema de archivos remoto usado por `backend: "ssh"`.
- Solo en modo `mirror` cambia el ciclo de vida: sincroniza local a remoto antes de `exec`, y luego sincroniza de vuelta.

Limitaciones actuales de OpenShell:

- el navegador en sandbox aún no es compatible
- `sandbox.docker.binds` no es compatible con el backend OpenShell
- los controles de runtime específicos de Docker bajo `sandbox.docker.*` siguen aplicándose solo al backend Docker

#### Modos de workspace

OpenShell tiene dos modelos de workspace. Esta es la parte que más importa en la práctica.

##### `mirror`

Usa `plugins.entries.openshell.config.mode: "mirror"` cuando quieras que el **workspace local siga siendo canónico**.

Comportamiento:

- Antes de `exec`, OpenClaw sincroniza el workspace local en el sandbox de OpenShell.
- Después de `exec`, OpenClaw sincroniza el workspace remoto de vuelta al workspace local.
- Las herramientas de archivos siguen operando a través del puente del sandbox, pero el workspace local sigue siendo la fuente de verdad entre turnos.

Usa esto cuando:

- editas archivos localmente fuera de OpenClaw y quieres que esos cambios aparezcan automáticamente en el sandbox
- quieres que el sandbox de OpenShell se comporte lo más parecido posible al backend Docker
- quieres que el workspace del host refleje las escrituras del sandbox después de cada turno de exec

Desventaja:

- costo adicional de sincronización antes y después de exec

##### `remote`

Usa `plugins.entries.openshell.config.mode: "remote"` cuando quieras que el **workspace de OpenShell se vuelva canónico**.

Comportamiento:

- Cuando el sandbox se crea por primera vez, OpenClaw inicializa el workspace remoto desde el workspace local una vez.
- Después de eso, `exec`, `read`, `write`, `edit` y `apply_patch` operan directamente contra el workspace remoto de OpenShell.
- OpenClaw **no** sincroniza los cambios remotos de vuelta al workspace local después de `exec`.
- Las lecturas de medios en tiempo de prompt siguen funcionando porque las herramientas de archivos y medios leen a través del puente del sandbox en lugar de asumir una ruta local del host.
- El transporte es SSH hacia el sandbox de OpenShell devuelto por `openshell sandbox ssh-config`.

Consecuencias importantes:

- Si editas archivos en el host fuera de OpenClaw después del paso de siembra, el sandbox remoto **no** verá esos cambios automáticamente.
- Si el sandbox se recrea, el workspace remoto se vuelve a inicializar desde el workspace local.
- Con `scope: "agent"` o `scope: "shared"`, ese workspace remoto se comparte en ese mismo alcance.

Usa esto cuando:

- el sandbox debe vivir principalmente del lado remoto de OpenShell
- quieres una menor sobrecarga de sincronización por turno
- no quieres que las ediciones locales del host sobrescriban silenciosamente el estado remoto del sandbox

Elige `mirror` si piensas en el sandbox como un entorno temporal de ejecución.
Elige `remote` si piensas en el sandbox como el workspace real.

#### Ciclo de vida de OpenShell

Los sandboxes de OpenShell siguen administrándose mediante el ciclo de vida normal del sandbox:

- `openclaw sandbox list` muestra runtimes de OpenShell además de runtimes de Docker
- `openclaw sandbox recreate` elimina el runtime actual y deja que OpenClaw lo recree en el siguiente uso
- la lógica de prune también distingue por backend

Para el modo `remote`, recreate es especialmente importante:

- recreate elimina el workspace remoto canónico para ese alcance
- el siguiente uso inicializa un workspace remoto nuevo desde el workspace local

Para el modo `mirror`, recreate principalmente restablece el entorno remoto de ejecución
porque el workspace local sigue siendo canónico de todos modos.

## Acceso al workspace

`agents.defaults.sandbox.workspaceAccess` controla **qué puede ver el sandbox**:

- `"none"` (predeterminado): las herramientas ven un workspace de sandbox bajo `~/.openclaw/sandboxes`.
- `"ro"`: monta el workspace del agente como solo lectura en `/agent` (desactiva `write`/`edit`/`apply_patch`).
- `"rw"`: monta el workspace del agente como lectura/escritura en `/workspace`.

Con el backend OpenShell:

- el modo `mirror` sigue usando el workspace local como fuente canónica entre turnos de exec
- el modo `remote` usa el workspace remoto de OpenShell como fuente canónica después de la siembra inicial
- `workspaceAccess: "ro"` y `"none"` siguen restringiendo el comportamiento de escritura de la misma manera

Los medios entrantes se copian al workspace activo del sandbox (`media/inbound/*`).
Nota sobre Skills: la herramienta `read` está enraizada en el sandbox. Con `workspaceAccess: "none"`,
OpenClaw refleja las Skills elegibles en el workspace del sandbox (`.../skills`) para
que puedan leerse. Con `"rw"`, las Skills del workspace se pueden leer desde
`/workspace/skills`.

## Bind mounts personalizados

`agents.defaults.sandbox.docker.binds` monta directorios adicionales del host en el contenedor.
Formato: `host:container:mode` (por ejemplo, `"/home/user/source:/source:rw"`).

Los binds globales y por agente se **fusionan** (no se reemplazan). En `scope: "shared"`, los binds por agente se ignoran.

`agents.defaults.sandbox.browser.binds` monta directorios adicionales del host solo en el contenedor del **navegador del sandbox**.

- Cuando está definido (incluido `[]`), reemplaza `agents.defaults.sandbox.docker.binds` para el contenedor del navegador.
- Cuando se omite, el contenedor del navegador vuelve a usar `agents.defaults.sandbox.docker.binds` (compatible hacia atrás).

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

Notas de seguridad:

- Los binds omiten el sistema de archivos del sandbox: exponen rutas del host con el modo que configures (`:ro` o `:rw`).
- OpenClaw bloquea orígenes de bind peligrosos (por ejemplo: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` y montajes padre que los expondrían).
- OpenClaw también bloquea raíces comunes de credenciales en el directorio home como `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` y `~/.ssh`.
- La validación de binds no se basa solo en coincidencias de cadenas. OpenClaw normaliza la ruta de origen y luego la resuelve otra vez a través del ancestro existente más profundo antes de volver a comprobar rutas bloqueadas y raíces permitidas.
- Eso significa que los escapes por padres con symlink siguen fallando de forma segura incluso cuando la hoja final aún no existe. Ejemplo: `/workspace/run-link/new-file` sigue resolviéndose como `/var/run/...` si `run-link` apunta allí.
- Las raíces de origen permitidas se canonicalizan del mismo modo, así que una ruta que solo parece estar dentro de la lista de permitidos antes de resolver symlinks igualmente se rechaza como `outside allowed roots`.
- Los montajes sensibles (secretos, claves SSH, credenciales de servicio) deberían ser `:ro` salvo que sea absolutamente necesario.
- Combínalo con `workspaceAccess: "ro"` si solo necesitas acceso de lectura al workspace; los modos de bind siguen siendo independientes.
- Consulta [Sandbox vs Política de herramientas vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated) para ver cómo interactúan los binds con la política de herramientas y elevated exec.

## Imágenes + configuración

Imagen Docker predeterminada: `openclaw-sandbox:bookworm-slim`

Constrúyela una vez:

```bash
scripts/sandbox-setup.sh
```

Nota: la imagen predeterminada **no** incluye Node. Si una Skill necesita Node (u
otros runtimes), incorpora una imagen personalizada o instala mediante
`sandbox.docker.setupCommand` (requiere salida de red + raíz con escritura +
usuario root).

Si quieres una imagen de sandbox más funcional con herramientas comunes (por ejemplo
`curl`, `jq`, `nodejs`, `python3`, `git`), construye:

```bash
scripts/sandbox-common-setup.sh
```

Luego establece `agents.defaults.sandbox.docker.image` en
`openclaw-sandbox-common:bookworm-slim`.

Imagen del navegador en sandbox:

```bash
scripts/sandbox-browser-setup.sh
```

De forma predeterminada, los contenedores Docker del sandbox se ejecutan **sin red**.
Reemplázalo con `agents.defaults.sandbox.docker.network`.

La imagen integrada del navegador en sandbox también aplica valores de inicio conservadores de Chromium
para cargas de trabajo en contenedores. Los valores actuales del contenedor incluyen:

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
- `--no-sandbox` y `--disable-setuid-sandbox` cuando `noSandbox` está activado.
- Los tres flags de endurecimiento gráfico (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) son opcionales y son útiles
  cuando los contenedores no tienen soporte GPU. Establece `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  si tu carga de trabajo requiere WebGL u otras funciones 3D/del navegador.
- `--disable-extensions` está activado de forma predeterminada y puede desactivarse con
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` para flujos que dependan de extensiones.
- `--renderer-process-limit=2` se controla con
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, donde `0` conserva el valor predeterminado de Chromium.

Si necesitas un perfil de runtime distinto, usa una imagen de navegador personalizada y proporciona
tu propio entrypoint. Para perfiles locales de Chromium (sin contenedor), usa
`browser.extraArgs` para añadir flags de inicio adicionales.

Valores predeterminados de seguridad:

- `network: "host"` está bloqueado.
- `network: "container:<id>"` está bloqueado de forma predeterminada (riesgo de omitir unión de espacio de nombres).
- Reemplazo de último recurso: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Las instalaciones Docker y el gateway en contenedor viven aquí:
[Docker](/es/install/docker)

Para despliegues del gateway en Docker, `scripts/docker/setup.sh` puede inicializar la configuración del sandbox.
Establece `OPENCLAW_SANDBOX=1` (o `true`/`yes`/`on`) para activar esa ruta. Puedes
reemplazar la ubicación del socket con `OPENCLAW_DOCKER_SOCKET`. Configuración completa y referencia
de variables de entorno: [Docker](/es/install/docker#agent-sandbox).

## setupCommand (configuración única del contenedor)

`setupCommand` se ejecuta **una vez** después de crear el contenedor del sandbox (no en cada ejecución).
Se ejecuta dentro del contenedor mediante `sh -lc`.

Rutas:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Por agente: `agents.list[].sandbox.docker.setupCommand`

Errores comunes:

- `docker.network` predeterminado es `"none"` (sin salida), por lo que las instalaciones de paquetes fallarán.
- `docker.network: "container:<id>"` requiere `dangerouslyAllowContainerNamespaceJoin: true` y es solo para casos de último recurso.
- `readOnlyRoot: true` impide escrituras; establece `readOnlyRoot: false` o incorpora una imagen personalizada.
- `user` debe ser root para instalaciones de paquetes (omite `user` o establece `user: "0:0"`).
- El sandbox exec **no** hereda `process.env` del host. Usa
  `agents.defaults.sandbox.docker.env` (o una imagen personalizada) para las claves API de Skills.

## Política de herramientas + vías de escape

Las políticas de permitir/denegar herramientas siguen aplicándose antes de las reglas del sandbox. Si una herramienta está denegada
globalmente o por agente, el sandboxing no la recupera.

`tools.elevated` es una vía de escape explícita que ejecuta `exec` fuera del sandbox (`gateway` de forma predeterminada, o `node` cuando el destino de exec es `node`).
Las directivas `/exec` solo se aplican a remitentes autorizados y persisten por sesión; para desactivar completamente
`exec`, usa una política de denegación de herramientas (consulta [Sandbox vs Política de herramientas vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated)).

Depuración:

- Usa `openclaw sandbox explain` para inspeccionar el modo efectivo del sandbox, la política de herramientas y las claves de configuración para corregirlo.
- Consulta [Sandbox vs Política de herramientas vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated) para el modelo mental de “¿por qué está bloqueado esto?”.
  Mantenlo restringido.

## Reemplazos multiagente

Cada agente puede reemplazar sandbox + herramientas:
`agents.list[].sandbox` y `agents.list[].tools` (además de `agents.list[].tools.sandbox.tools` para la política de herramientas en sandbox).
Consulta [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) para la precedencia.

## Ejemplo mínimo de activación

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

## Documentación relacionada

- [OpenShell](/es/gateway/openshell) -- configuración del backend de sandbox administrado, modos de workspace y referencia de configuración
- [Configuración del sandbox](/es/gateway/configuration-reference#agentsdefaultssandbox)
- [Sandbox vs Política de herramientas vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated) -- depuración de “¿por qué está bloqueado esto?”
- [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) -- reemplazos por agente y precedencia
- [Seguridad](/es/gateway/security)

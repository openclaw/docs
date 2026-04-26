---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Cómo funciona el sandboxing de OpenClaw: modos, ámbitos, acceso al espacio de trabajo e imágenes'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-26T11:30:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83930d5533832f2ece5fd069c15670f8a73c5801c829ca85c249a4582d36ff29
    source_path: gateway/sandboxing.md
    workflow: 15
---

OpenClaw puede ejecutar **herramientas dentro de backends de sandbox** para reducir el radio de impacto. Esto es **opcional** y se controla mediante configuración (`agents.defaults.sandbox` o `agents.list[].sandbox`). Si el sandboxing está desactivado, las herramientas se ejecutan en el host. El Gateway permanece en el host; la ejecución de herramientas se realiza en un sandbox aislado cuando está habilitado.

<Note>
Esto no es un límite de seguridad perfecto, pero limita materialmente el acceso al sistema de archivos y a procesos cuando el modelo hace algo tonto.
</Note>

## Qué se ejecuta en sandbox

- Ejecución de herramientas (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, etc.).
- Navegador en sandbox opcional (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Detalles del navegador en sandbox">
    - De forma predeterminada, el navegador en sandbox se inicia automáticamente (garantiza que CDP sea accesible) cuando la herramienta de navegador lo necesita. Configúralo con `agents.defaults.sandbox.browser.autoStart` y `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - De forma predeterminada, los contenedores del navegador en sandbox usan una red Docker dedicada (`openclaw-sandbox-browser`) en lugar de la red global `bridge`. Configúralo con `agents.defaults.sandbox.browser.network`.
    - `agents.defaults.sandbox.browser.cdpSourceRange` opcional restringe la entrada CDP en el borde del contenedor con una lista de permitidos CIDR (por ejemplo `172.21.0.1/32`).
    - El acceso de observador noVNC está protegido por contraseña de forma predeterminada; OpenClaw emite una URL de token de corta duración que sirve una página local de arranque y abre noVNC con la contraseña en el fragmento de la URL (no en registros de query/header).
    - `agents.defaults.sandbox.browser.allowHostControl` permite que las sesiones en sandbox apunten explícitamente al navegador del host.
    - Las listas de permitidos opcionales controlan `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.
  </Accordion>
</AccordionGroup>

No se ejecuta en sandbox:

- El propio proceso del Gateway.
- Cualquier herramienta a la que se le permita explícitamente ejecutarse fuera del sandbox (por ejemplo `tools.elevated`).
  - **El exec elevado omite el sandboxing y usa la ruta de escape configurada (`gateway` de forma predeterminada, o `node` cuando el destino de exec es `node`).**
  - Si el sandboxing está desactivado, `tools.elevated` no cambia la ejecución (ya está en el host). Consulta [Modo elevado](/es/tools/elevated).

## Modos

`agents.defaults.sandbox.mode` controla **cuándo** se usa el sandboxing:

<Tabs>
  <Tab title="off">
    Sin sandboxing.
  </Tab>
  <Tab title="non-main">
    Sandbox solo para sesiones **no principales** (predeterminado si quieres chats normales en el host).

    `"non-main"` se basa en `session.mainKey` (predeterminado `"main"`), no en el id del agente. Las sesiones de grupo/canal usan sus propias claves, por lo que cuentan como no principales y se ejecutarán en sandbox.

  </Tab>
  <Tab title="all">
    Todas las sesiones se ejecutan en un sandbox.
  </Tab>
</Tabs>

## Ámbito

`agents.defaults.sandbox.scope` controla **cuántos contenedores** se crean:

- `"agent"` (predeterminado): un contenedor por agente.
- `"session"`: un contenedor por sesión.
- `"shared"`: un contenedor compartido por todas las sesiones en sandbox.

## Backend

`agents.defaults.sandbox.backend` controla **qué runtime** proporciona el sandbox:

- `"docker"` (predeterminado cuando el sandboxing está habilitado): runtime de sandbox local respaldado por Docker.
- `"ssh"`: runtime de sandbox remoto genérico respaldado por SSH.
- `"openshell"`: runtime de sandbox respaldado por OpenShell.

La configuración específica de SSH vive en `agents.defaults.sandbox.ssh`. La configuración específica de OpenShell vive en `plugins.entries.openshell.config`.

### Elegir un backend

|                     | Docker                           | SSH                             | OpenShell                                                   |
| ------------------- | -------------------------------- | ------------------------------- | ----------------------------------------------------------- |
| **Dónde se ejecuta** | Contenedor local                 | Cualquier host accesible por SSH | Sandbox gestionado por OpenShell                            |
| **Configuración**   | `scripts/sandbox-setup.sh`       | Clave SSH + host de destino     | Plugin OpenShell habilitado                                 |
| **Modelo de espacio de trabajo** | Bind-mount o copia               | Canónico remoto (siembra una vez) | `mirror` o `remote`                                         |
| **Control de red**  | `docker.network` (predeterminado: none) | Depende del host remoto         | Depende de OpenShell                                        |
| **Navegador en sandbox** | Compatible                    | No compatible                   | Aún no compatible                                           |
| **Bind mounts**     | `docker.binds`                   | N/A                             | N/A                                                         |
| **Ideal para**      | Desarrollo local, aislamiento completo | Descargar trabajo a una máquina remota | Sandboxes remotos gestionados con sincronización bidireccional opcional |

### Backend Docker

El sandboxing está desactivado de forma predeterminada. Si habilitas el sandboxing y no eliges un backend, OpenClaw usa el backend Docker. Ejecuta herramientas y navegadores en sandbox localmente mediante el socket del daemon de Docker (`/var/run/docker.sock`). El aislamiento del contenedor sandbox lo determinan los namespaces de Docker.

<Warning>
**Restricciones de Docker-out-of-Docker (DooD)**

Si despliegas el propio Gateway de OpenClaw como contenedor Docker, este orquesta contenedores sandbox hermanos usando el socket Docker del host (DooD). Esto introduce una restricción específica de asignación de rutas:

- **La configuración requiere rutas del host**: la configuración `workspace` de `openclaw.json` DEBE contener la **ruta absoluta del host** (por ejemplo `/home/user/.openclaw/workspaces`), no la ruta interna del contenedor del Gateway. Cuando OpenClaw le pide al daemon de Docker que genere un sandbox, el daemon evalúa las rutas relativas al espacio de nombres del SO del host, no al del Gateway.
- **Paridad de puente FS (mapa de volumen idéntico)**: el proceso nativo del Gateway de OpenClaw también escribe archivos de Heartbeat y puente en el directorio `workspace`. Como el Gateway evalúa la misma cadena exacta (la ruta del host) desde su propio entorno en contenedor, el despliegue del Gateway DEBE incluir un mapa de volumen idéntico que enlace el espacio de nombres del host de forma nativa (`-v /home/user/.openclaw:/home/user/.openclaw`).

Si asignas rutas internamente sin paridad absoluta con el host, OpenClaw genera nativamente un error de permisos `EACCES` al intentar escribir su Heartbeat dentro del entorno del contenedor porque la cadena de ruta completa no existe de forma nativa.
</Warning>

### Backend SSH

Usa `backend: "ssh"` cuando quieras que OpenClaw ejecute en sandbox `exec`, herramientas de archivos y lecturas de multimedia en una máquina arbitraria accesible por SSH.

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
          // O usa SecretRefs / contenido inline en lugar de archivos locales:
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
    - OpenClaw crea una raíz remota por ámbito bajo `sandbox.ssh.workspaceRoot`.
    - En el primer uso después de crear o recrear, OpenClaw siembra ese espacio de trabajo remoto desde el espacio de trabajo local una vez.
    - Después de eso, `exec`, `read`, `write`, `edit`, `apply_patch`, las lecturas de multimedia del prompt y el staging de multimedia entrante se ejecutan directamente contra el espacio de trabajo remoto por SSH.
    - OpenClaw no sincroniza automáticamente los cambios remotos de vuelta al espacio de trabajo local.
  </Accordion>
  <Accordion title="Material de autenticación">
    - `identityFile`, `certificateFile`, `knownHostsFile`: usa archivos locales existentes y pásalos mediante la configuración de OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: usa cadenas inline o SecretRefs. OpenClaw los resuelve mediante la instantánea normal del runtime de secretos, los escribe en archivos temporales con `0600` y los elimina cuando finaliza la sesión SSH.
    - Si tanto `*File` como `*Data` están configurados para el mismo elemento, `*Data` tiene prioridad para esa sesión SSH.
  </Accordion>
  <Accordion title="Consecuencias del modelo canónico remoto">
    Este es un modelo **canónico remoto**. El espacio de trabajo SSH remoto se convierte en el estado real del sandbox tras la siembra inicial.

    - Las ediciones locales del host realizadas fuera de OpenClaw después del paso de siembra no son visibles remotamente hasta que recrees el sandbox.
    - `openclaw sandbox recreate` elimina la raíz remota por ámbito y vuelve a sembrar desde local en el siguiente uso.
    - El navegador en sandbox no es compatible con el backend SSH.
    - La configuración `sandbox.docker.*` no se aplica al backend SSH.

  </Accordion>
</AccordionGroup>

### Backend OpenShell

Usa `backend: "openshell"` cuando quieras que OpenClaw ejecute herramientas en sandbox dentro de un entorno remoto gestionado por OpenShell. Para la guía completa de configuración, la referencia de configuración y la comparación de modos de espacio de trabajo, consulta la página dedicada de [OpenShell](/es/gateway/openshell).

OpenShell reutiliza el mismo transporte SSH principal y el mismo puente de sistema de archivos remoto que el backend SSH genérico, y añade el ciclo de vida específico de OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) más el modo de espacio de trabajo opcional `mirror`.

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

- `mirror` (predeterminado): el espacio de trabajo local sigue siendo el canónico. OpenClaw sincroniza los archivos locales en OpenShell antes de `exec` y sincroniza de vuelta el espacio de trabajo remoto después de `exec`.
- `remote`: el espacio de trabajo de OpenShell es canónico después de que se crea el sandbox. OpenClaw siembra el espacio de trabajo remoto una vez desde el espacio de trabajo local, y luego las herramientas de archivos y `exec` se ejecutan directamente contra el sandbox remoto sin sincronizar los cambios de vuelta.

<AccordionGroup>
  <Accordion title="Detalles del transporte remoto">
    - OpenClaw solicita a OpenShell la configuración SSH específica del sandbox mediante `openshell sandbox ssh-config <name>`.
    - El núcleo escribe esa configuración SSH en un archivo temporal, abre la sesión SSH y reutiliza el mismo puente de sistema de archivos remoto usado por `backend: "ssh"`.
    - Solo en modo `mirror` cambia el ciclo de vida: sincroniza de local a remoto antes de `exec` y luego sincroniza de vuelta después de `exec`.
  </Accordion>
  <Accordion title="Limitaciones actuales de OpenShell">
    - el navegador en sandbox aún no es compatible
    - `sandbox.docker.binds` no es compatible en el backend OpenShell
    - los controles de runtime específicos de Docker bajo `sandbox.docker.*` siguen aplicándose solo al backend Docker
  </Accordion>
</AccordionGroup>

#### Modos de espacio de trabajo

OpenShell tiene dos modelos de espacio de trabajo. Esta es la parte que más importa en la práctica.

<Tabs>
  <Tab title="mirror (canónico local)">
    Usa `plugins.entries.openshell.config.mode: "mirror"` cuando quieras que el **espacio de trabajo local siga siendo el canónico**.

    Comportamiento:

    - Antes de `exec`, OpenClaw sincroniza el espacio de trabajo local con el sandbox de OpenShell.
    - Después de `exec`, OpenClaw sincroniza el espacio de trabajo remoto de vuelta al espacio de trabajo local.
    - Las herramientas de archivos siguen operando a través del puente del sandbox, pero el espacio de trabajo local sigue siendo la fuente de verdad entre turnos.

    Úsalo cuando:

    - editas archivos localmente fuera de OpenClaw y quieres que esos cambios aparezcan automáticamente en el sandbox
    - quieres que el sandbox de OpenShell se comporte lo más parecido posible al backend Docker
    - quieres que el espacio de trabajo del host refleje las escrituras del sandbox después de cada turno de exec

    Contrapartida: coste adicional de sincronización antes y después de exec.

  </Tab>
  <Tab title="remote (OpenShell canónico)">
    Usa `plugins.entries.openshell.config.mode: "remote"` cuando quieras que el **espacio de trabajo de OpenShell se convierta en el canónico**.

    Comportamiento:

    - Cuando el sandbox se crea por primera vez, OpenClaw siembra el espacio de trabajo remoto desde el espacio de trabajo local una vez.
    - Después de eso, `exec`, `read`, `write`, `edit` y `apply_patch` operan directamente contra el espacio de trabajo remoto de OpenShell.
    - OpenClaw **no** sincroniza los cambios remotos de vuelta al espacio de trabajo local después de `exec`.
    - Las lecturas de multimedia en tiempo de prompt siguen funcionando porque las herramientas de archivos y multimedia leen a través del puente del sandbox en lugar de asumir una ruta local del host.
    - El transporte es SSH hacia el sandbox de OpenShell devuelto por `openshell sandbox ssh-config`.

    Consecuencias importantes:

    - Si editas archivos en el host fuera de OpenClaw después del paso de siembra, el sandbox remoto **no** verá esos cambios automáticamente.
    - Si el sandbox se recrea, el espacio de trabajo remoto vuelve a sembrarse desde el espacio de trabajo local.
    - Con `scope: "agent"` o `scope: "shared"`, ese espacio de trabajo remoto se comparte en ese mismo ámbito.

    Usa esto cuando:

    - el sandbox deba vivir principalmente en el lado remoto de OpenShell
    - quieras menor sobrecarga de sincronización por turno
    - no quieras que las ediciones locales del host sobrescriban silenciosamente el estado remoto del sandbox

  </Tab>
</Tabs>

Elige `mirror` si piensas en el sandbox como un entorno temporal de ejecución. Elige `remote` si piensas en el sandbox como el espacio de trabajo real.

#### Ciclo de vida de OpenShell

Los sandboxes de OpenShell siguen gestionándose a través del ciclo de vida normal del sandbox:

- `openclaw sandbox list` muestra runtimes de OpenShell además de runtimes de Docker
- `openclaw sandbox recreate` elimina el runtime actual y deja que OpenClaw lo recree en el siguiente uso
- la lógica de depuración también reconoce el backend

Para el modo `remote`, `recreate` es especialmente importante:

- `recreate` elimina el espacio de trabajo remoto canónico para ese ámbito
- el siguiente uso siembra un espacio de trabajo remoto nuevo desde el espacio de trabajo local

Para el modo `mirror`, `recreate` restablece principalmente el entorno remoto de ejecución porque el espacio de trabajo local sigue siendo canónico de todos modos.

## Acceso al espacio de trabajo

`agents.defaults.sandbox.workspaceAccess` controla **qué puede ver el sandbox**:

<Tabs>
  <Tab title="none (predeterminado)">
    Las herramientas ven un espacio de trabajo sandbox en `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Monta el espacio de trabajo del agente como solo lectura en `/agent` (desactiva `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Monta el espacio de trabajo del agente como lectura/escritura en `/workspace`.
  </Tab>
</Tabs>

Con el backend OpenShell:

- el modo `mirror` sigue usando el espacio de trabajo local como fuente canónica entre turnos de `exec`
- el modo `remote` usa el espacio de trabajo remoto de OpenShell como fuente canónica después de la siembra inicial
- `workspaceAccess: "ro"` y `"none"` siguen restringiendo el comportamiento de escritura de la misma manera

La multimedia entrante se copia al espacio de trabajo activo del sandbox (`media/inbound/*`).

<Note>
**Nota sobre Skills:** la herramienta `read` está enraizada en el sandbox. Con `workspaceAccess: "none"`, OpenClaw refleja las Skills elegibles en el espacio de trabajo del sandbox (`.../skills`) para que puedan leerse. Con `"rw"`, las Skills del espacio de trabajo pueden leerse desde `/workspace/skills`.
</Note>

## Bind mounts personalizados

`agents.defaults.sandbox.docker.binds` monta directorios adicionales del host dentro del contenedor. Formato: `host:container:mode` (por ejemplo `"/home/user/source:/source:rw"`).

Los bind mounts globales y por agente se **fusionan** (no se reemplazan). En `scope: "shared"`, los bind mounts por agente se ignoran.

`agents.defaults.sandbox.browser.binds` monta directorios adicionales del host solo dentro del contenedor del **navegador en sandbox**.

- Cuando está configurado (incluido `[]`), reemplaza `agents.defaults.sandbox.docker.binds` para el contenedor del navegador.
- Cuando se omite, el contenedor del navegador recurre a `agents.defaults.sandbox.docker.binds` (compatibilidad hacia atrás).

Ejemplo (código fuente de solo lectura + un directorio de datos adicional):

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
**Seguridad de bind mounts**

- Los bind mounts omiten el sistema de archivos del sandbox: exponen rutas del host con el modo que configures (`:ro` o `:rw`).
- OpenClaw bloquea orígenes de bind peligrosos (por ejemplo: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` y montajes padre que los expondrían).
- OpenClaw también bloquea raíces comunes de credenciales en directorios personales como `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` y `~/.ssh`.
- La validación de binds no se basa solo en comparar cadenas. OpenClaw normaliza la ruta de origen y luego la resuelve otra vez a través del ancestro existente más profundo antes de volver a comprobar rutas bloqueadas y raíces permitidas.
- Eso significa que los escapes de padres por symlink siguen fallando de forma segura incluso cuando la hoja final aún no existe. Ejemplo: `/workspace/run-link/new-file` sigue resolviéndose como `/var/run/...` si `run-link` apunta allí.
- Las raíces de origen permitidas se canonicalizan de la misma manera, por lo que una ruta que solo parece estar dentro de la lista de permitidos antes de la resolución de symlink sigue rechazándose como `outside allowed roots`.
- Los montajes sensibles (secretos, claves SSH, credenciales de servicio) deberían ser `:ro` salvo que sea absolutamente necesario.
- Combínalo con `workspaceAccess: "ro"` si solo necesitas acceso de lectura al espacio de trabajo; los modos de bind siguen siendo independientes.
- Consulta [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated) para ver cómo interactúan los binds con la política de herramientas y exec elevado.
  </Warning>

## Imágenes y configuración

Imagen Docker predeterminada: `openclaw-sandbox:bookworm-slim`

<Steps>
  <Step title="Compilar la imagen predeterminada">
    ```bash
    scripts/sandbox-setup.sh
    ```

    La imagen predeterminada **no** incluye Node. Si una Skill necesita Node (u otros runtimes), o bien crea una imagen personalizada o instala mediante `sandbox.docker.setupCommand` (requiere salida de red + raíz escribible + usuario root).

  </Step>
  <Step title="Opcional: compilar la imagen común">
    Para una imagen de sandbox más funcional con herramientas comunes (por ejemplo `curl`, `jq`, `nodejs`, `python3`, `git`):

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Luego establece `agents.defaults.sandbox.docker.image` en `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Opcional: compilar la imagen del navegador en sandbox">
    ```bash
    scripts/sandbox-browser-setup.sh
    ```
  </Step>
</Steps>

De forma predeterminada, los contenedores de sandbox de Docker se ejecutan **sin red**. Anúlalo con `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Valores predeterminados de Chromium del navegador en sandbox">
    La imagen integrada del navegador en sandbox también aplica valores predeterminados conservadores de arranque de Chromium para cargas de trabajo en contenedor. Los valores actuales del contenedor incluyen:

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
    - Los tres indicadores de refuerzo gráfico (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) son opcionales y son útiles cuando los contenedores carecen de soporte de GPU. Establece `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` si tu carga de trabajo requiere WebGL u otras funciones 3D/del navegador.
    - `--disable-extensions` está habilitado de forma predeterminada y puede desactivarse con `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` para flujos que dependan de extensiones.
    - `--renderer-process-limit=2` se controla con `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, donde `0` conserva el valor predeterminado de Chromium.

    Si necesitas un perfil de runtime diferente, usa una imagen de navegador personalizada y proporciona tu propio entrypoint. Para perfiles locales (no en contenedor) de Chromium, usa `browser.extraArgs` para añadir indicadores adicionales de arranque.

  </Accordion>
  <Accordion title="Valores predeterminados de seguridad de red">
    - `network: "host"` está bloqueado.
    - `network: "container:<id>"` está bloqueado de forma predeterminada (riesgo de omitir el espacio de nombres mediante unión).
    - Anulación de emergencia: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.
  </Accordion>
</AccordionGroup>

Las instalaciones Docker y el gateway en contenedor viven aquí: [Docker](/es/install/docker)

Para despliegues del gateway en Docker, `scripts/docker/setup.sh` puede preparar la configuración del sandbox. Establece `OPENCLAW_SANDBOX=1` (o `true`/`yes`/`on`) para habilitar esa ruta. Puedes anular la ubicación del socket con `OPENCLAW_DOCKER_SOCKET`. Configuración completa y referencia de env: [Docker](/es/install/docker#agent-sandbox).

## setupCommand (configuración única del contenedor)

`setupCommand` se ejecuta **una vez** después de crear el contenedor sandbox (no en cada ejecución). Se ejecuta dentro del contenedor mediante `sh -lc`.

Rutas:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Por agente: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Errores comunes">
    - El valor predeterminado de `docker.network` es `"none"` (sin salida), por lo que las instalaciones de paquetes fallarán.
    - `docker.network: "container:<id>"` requiere `dangerouslyAllowContainerNamespaceJoin: true` y es solo para casos de emergencia.
    - `readOnlyRoot: true` impide escrituras; establece `readOnlyRoot: false` o crea una imagen personalizada.
    - `user` debe ser root para instalaciones de paquetes (omite `user` o establece `user: "0:0"`).
    - El exec del sandbox **no** hereda `process.env` del host. Usa `agents.defaults.sandbox.docker.env` (o una imagen personalizada) para claves de API de Skills.
  </Accordion>
</AccordionGroup>

## Política de herramientas y rutas de escape

Las políticas de permitir/denegar herramientas siguen aplicándose antes que las reglas del sandbox. Si una herramienta está denegada globalmente o por agente, el sandboxing no la recupera.

`tools.elevated` es una ruta de escape explícita que ejecuta `exec` fuera del sandbox (`gateway` de forma predeterminada, o `node` cuando el destino de exec es `node`). Las directivas `/exec` solo se aplican a remitentes autorizados y persisten por sesión; para desactivar completamente `exec`, usa la política de denegación de herramientas (consulta [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated)).

Depuración:

- Usa `openclaw sandbox explain` para inspeccionar el modo efectivo de sandbox, la política de herramientas y las claves de configuración para corregirlo.
- Consulta [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated) para el modelo mental de “¿por qué está bloqueado esto?”.

Mantenlo restringido.

## Anulaciones multiagente

Cada agente puede anular sandbox + herramientas: `agents.list[].sandbox` y `agents.list[].tools` (más `agents.list[].tools.sandbox.tools` para la política de herramientas del sandbox). Consulta [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) para la precedencia.

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

- [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) — anulaciones por agente y precedencia
- [OpenShell](/es/gateway/openshell) — configuración del backend de sandbox gestionado, modos de espacio de trabajo y referencia de configuración
- [Configuración de sandbox](/es/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated) — depurar “¿por qué está bloqueado esto?”
- [Security](/es/gateway/security)

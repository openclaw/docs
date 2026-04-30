---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Cómo funciona el aislamiento de OpenClaw: modos, alcances, acceso al espacio de trabajo e imágenes'
title: Aislamiento
x-i18n:
    generated_at: "2026-04-30T05:43:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96861f3f70bf26b5ed20a063c047064f98a0dc74d36e8f4ccada1f3bb455118d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw puede ejecutar **herramientas dentro de backends de sandbox** para reducir el radio de impacto. Esto es **opcional** y se controla mediante configuración (`agents.defaults.sandbox` o `agents.list[].sandbox`). Si el sandboxing está desactivado, las herramientas se ejecutan en el host. El Gateway permanece en el host; la ejecución de herramientas se realiza en un sandbox aislado cuando está habilitado.

<Note>
Esto no es un límite de seguridad perfecto, pero limita de forma material el acceso al sistema de archivos y a los procesos cuando el modelo hace algo torpe.
</Note>

## Qué se ejecuta en sandbox

- Ejecución de herramientas (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, etc.).
- Navegador opcional en sandbox (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Detalles del navegador en sandbox">
    - De forma predeterminada, el navegador en sandbox se inicia automáticamente (garantiza que CDP sea alcanzable) cuando la herramienta de navegador lo necesita. Configúralo mediante `agents.defaults.sandbox.browser.autoStart` y `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - De forma predeterminada, los contenedores del navegador en sandbox usan una red de Docker dedicada (`openclaw-sandbox-browser`) en lugar de la red global `bridge`. Configúralo con `agents.defaults.sandbox.browser.network`.
    - El valor opcional `agents.defaults.sandbox.browser.cdpSourceRange` restringe el ingreso CDP en el borde del contenedor con una lista de permitidos CIDR (por ejemplo, `172.21.0.1/32`).
    - El acceso del observador noVNC está protegido con contraseña de forma predeterminada; OpenClaw emite una URL con token de corta duración que sirve una página de arranque local y abre noVNC con la contraseña en el fragmento de la URL (no en registros de consulta/cabecera).
    - `agents.defaults.sandbox.browser.allowHostControl` permite que las sesiones en sandbox apunten explícitamente al navegador del host.
    - Listas de permitidos opcionales controlan `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

No se ejecuta en sandbox:

- El proceso del Gateway en sí.
- Cualquier herramienta permitida explícitamente para ejecutarse fuera del sandbox (por ejemplo, `tools.elevated`).
  - **El exec elevado omite el sandboxing y usa la ruta de escape configurada (`gateway` de forma predeterminada, o `node` cuando el destino de exec es `node`).**
  - Si el sandboxing está desactivado, `tools.elevated` no cambia la ejecución (ya está en el host). Consulta [Modo elevado](/es/tools/elevated).

## Modos

`agents.defaults.sandbox.mode` controla **cuándo** se usa el sandboxing:

<Tabs>
  <Tab title="off">
    Sin sandboxing.
  </Tab>
  <Tab title="non-main">
    Ejecuta en sandbox solo las sesiones **non-main** (opción predeterminada si quieres chats normales en el host).

    `"non-main"` se basa en `session.mainKey` (valor predeterminado `"main"`), no en el id del agente. Las sesiones de grupo/canal usan sus propias claves, por lo que cuentan como non-main y se ejecutarán en sandbox.

  </Tab>
  <Tab title="all">
    Todas las sesiones se ejecutan en un sandbox.
  </Tab>
</Tabs>

## Alcance

`agents.defaults.sandbox.scope` controla **cuántos contenedores** se crean:

- `"agent"` (valor predeterminado): un contenedor por agente.
- `"session"`: un contenedor por sesión.
- `"shared"`: un contenedor compartido por todas las sesiones en sandbox.

## Backend

`agents.defaults.sandbox.backend` controla **qué runtime** proporciona el sandbox:

- `"docker"` (valor predeterminado cuando el sandboxing está habilitado): runtime de sandbox local respaldado por Docker.
- `"ssh"`: runtime de sandbox remoto genérico respaldado por SSH.
- `"openshell"`: runtime de sandbox respaldado por OpenShell.

La configuración específica de SSH vive en `agents.defaults.sandbox.ssh`. La configuración específica de OpenShell vive en `plugins.entries.openshell.config`.

### Elegir un backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Dónde se ejecuta** | Contenedor local                 | Cualquier host accesible por SSH | Sandbox administrado por OpenShell                  |
| **Configuración**   | `scripts/sandbox-setup.sh`       | Clave SSH + host de destino    | Plugin de OpenShell habilitado                      |
| **Modelo de workspace** | Montaje bind o copia         | Canónico remoto (sembrar una vez) | `mirror` o `remote`                              |
| **Control de red**  | `docker.network` (valor predeterminado: ninguno) | Depende del host remoto | Depende de OpenShell                                |
| **Sandbox de navegador** | Compatible                  | No compatible                  | Todavía no compatible                               |
| **Montajes bind**   | `docker.binds`                   | N/A                            | N/A                                                 |
| **Ideal para**      | Desarrollo local, aislamiento completo | Descargar trabajo a una máquina remota | Sandboxes remotos administrados con sincronización bidireccional opcional |

### Backend de Docker

El sandboxing está desactivado de forma predeterminada. Si habilitas el sandboxing y no eliges un backend, OpenClaw usa el backend de Docker. Ejecuta herramientas y navegadores en sandbox localmente mediante el socket del daemon de Docker (`/var/run/docker.sock`). El aislamiento del contenedor de sandbox está determinado por los namespaces de Docker.

Para exponer GPU del host a sandboxes de Docker, define `agents.defaults.sandbox.docker.gpus` o la anulación por agente `agents.list[].sandbox.docker.gpus`. El valor se pasa a la flag `--gpus` de Docker como un argumento separado, por ejemplo `"all"` o `"device=GPU-uuid"`, y requiere un runtime de host compatible, como NVIDIA Container Toolkit.

<Warning>
**Restricciones de Docker-out-of-Docker (DooD)**

Si despliegas el Gateway de OpenClaw como un contenedor Docker, este orquesta contenedores de sandbox hermanos usando el socket de Docker del host (DooD). Esto introduce una restricción específica de asignación de rutas:

- **La configuración requiere rutas del host**: La configuración `workspace` de `openclaw.json` DEBE contener la **ruta absoluta del host** (por ejemplo, `/home/user/.openclaw/workspaces`), no la ruta interna del contenedor del Gateway. Cuando OpenClaw pide al daemon de Docker que inicie un sandbox, el daemon evalúa las rutas en relación con el namespace del SO host, no con el namespace del Gateway.
- **Paridad del puente FS (mapa de volúmenes idéntico)**: El proceso nativo del Gateway de OpenClaw también escribe archivos de Heartbeat y puente en el directorio `workspace`. Como el Gateway evalúa exactamente la misma cadena (la ruta del host) desde dentro de su propio entorno contenedorizado, el despliegue del Gateway DEBE incluir un mapa de volúmenes idéntico que vincule el namespace del host de forma nativa (`-v /home/user/.openclaw:/home/user/.openclaw`).

Si asignas rutas internamente sin paridad absoluta con el host, OpenClaw lanza de forma nativa un error de permisos `EACCES` al intentar escribir su Heartbeat dentro del entorno del contenedor porque la cadena de ruta completamente calificada no existe de forma nativa.
</Warning>

### Backend SSH

Usa `backend: "ssh"` cuando quieras que OpenClaw ejecute en sandbox `exec`, herramientas de archivos y lecturas de medios en una máquina arbitraria accesible por SSH.

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
    - En el primer uso después de crear o recrear, OpenClaw siembra una vez ese workspace remoto desde el workspace local.
    - Después de eso, `exec`, `read`, `write`, `edit`, `apply_patch`, las lecturas de medios de prompts y el staging de medios entrantes se ejecutan directamente contra el workspace remoto por SSH.
    - OpenClaw no sincroniza automáticamente los cambios remotos de vuelta al workspace local.

  </Accordion>
  <Accordion title="Material de autenticación">
    - `identityFile`, `certificateFile`, `knownHostsFile`: usan archivos locales existentes y los pasan por la configuración de OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: usan cadenas inline o SecretRefs. OpenClaw las resuelve mediante la instantánea normal del runtime de secretos, las escribe en archivos temporales con `0600` y las elimina cuando termina la sesión SSH.
    - Si tanto `*File` como `*Data` están definidos para el mismo elemento, `*Data` tiene prioridad para esa sesión SSH.

  </Accordion>
  <Accordion title="Consecuencias del modelo canónico remoto">
    Este es un modelo **canónico remoto**. El workspace SSH remoto se convierte en el estado real del sandbox después de la siembra inicial.

    - Las ediciones locales del host realizadas fuera de OpenClaw después del paso de siembra no son visibles remotamente hasta que recrees el sandbox.
    - `openclaw sandbox recreate` elimina la raíz remota por alcance y vuelve a sembrar desde local en el siguiente uso.
    - El sandboxing de navegador no es compatible con el backend SSH.
    - La configuración `sandbox.docker.*` no se aplica al backend SSH.

  </Accordion>
</AccordionGroup>

### Backend OpenShell

Usa `backend: "openshell"` cuando quieras que OpenClaw ejecute herramientas en sandbox en un entorno remoto administrado por OpenShell. Para la guía completa de configuración inicial, la referencia de configuración y la comparación de modos de workspace, consulta la [página de OpenShell](/es/gateway/openshell) dedicada.

OpenShell reutiliza el mismo transporte SSH central y el mismo puente de sistema de archivos remoto que el backend SSH genérico, y añade ciclo de vida específico de OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) más el modo de workspace opcional `mirror`.

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

- `mirror` (valor predeterminado): el workspace local permanece canónico. OpenClaw sincroniza los archivos locales en OpenShell antes de exec y sincroniza el workspace remoto de vuelta después de exec.
- `remote`: el workspace de OpenShell es canónico después de crear el sandbox. OpenClaw siembra el workspace remoto una vez desde el workspace local; luego las herramientas de archivos y exec se ejecutan directamente contra el sandbox remoto sin sincronizar los cambios de vuelta.

<AccordionGroup>
  <Accordion title="Detalles del transporte remoto">
    - OpenClaw pide a OpenShell configuración SSH específica del sandbox mediante `openshell sandbox ssh-config <name>`.
    - Core escribe esa configuración SSH en un archivo temporal, abre la sesión SSH y reutiliza el mismo puente de sistema de archivos remoto usado por `backend: "ssh"`.
    - Solo en modo `mirror` difiere el ciclo de vida: sincronizar local a remoto antes de exec y luego sincronizar de vuelta después de exec.

  </Accordion>
  <Accordion title="Limitaciones actuales de OpenShell">
    - el navegador de sandbox todavía no es compatible
    - `sandbox.docker.binds` no es compatible con el backend de OpenShell
    - los controles de runtime específicos de Docker bajo `sandbox.docker.*` siguen aplicándose solo al backend de Docker

  </Accordion>
</AccordionGroup>

#### Modos de workspace

OpenShell tiene dos modelos de workspace. Esta es la parte que más importa en la práctica.

<Tabs>
  <Tab title="mirror (local canónico)">
    Usa `plugins.entries.openshell.config.mode: "mirror"` cuando quieras que el **workspace local permanezca canónico**.

    Comportamiento:

    - Antes de `exec`, OpenClaw sincroniza el workspace local en el sandbox de OpenShell.
    - Después de `exec`, OpenClaw sincroniza el workspace remoto de vuelta al workspace local.
    - Las herramientas de archivos siguen operando mediante el puente de sandbox, pero el workspace local permanece como la fuente de verdad entre turnos.

    Úsalo cuando:

    - editas archivos localmente fuera de OpenClaw y quieres que esos cambios aparezcan automáticamente en el entorno aislado
    - quieres que el entorno aislado de OpenShell se comporte lo más parecido posible al backend Docker
    - quieres que el espacio de trabajo del host refleje las escrituras del entorno aislado después de cada turno de exec

    Contrapartida: coste adicional de sincronización antes y después de exec.

  </Tab>
  <Tab title="remote (OpenShell canónico)">
    Usa `plugins.entries.openshell.config.mode: "remote"` cuando quieras que el **espacio de trabajo de OpenShell sea canónico**.

    Comportamiento:

    - Cuando el entorno aislado se crea por primera vez, OpenClaw siembra una vez el espacio de trabajo remoto desde el espacio de trabajo local.
    - Después de eso, `exec`, `read`, `write`, `edit` y `apply_patch` operan directamente sobre el espacio de trabajo remoto de OpenShell.
    - OpenClaw **no** sincroniza los cambios remotos de vuelta al espacio de trabajo local después de exec.
    - Las lecturas de medios durante el prompt siguen funcionando porque las herramientas de archivos y medios leen a través del puente del entorno aislado en lugar de asumir una ruta local del host.
    - El transporte es SSH hacia el entorno aislado de OpenShell devuelto por `openshell sandbox ssh-config`.

    Consecuencias importantes:

    - Si editas archivos en el host fuera de OpenClaw después del paso de siembra, el entorno aislado remoto **no** verá esos cambios automáticamente.
    - Si se vuelve a crear el entorno aislado, el espacio de trabajo remoto se siembra de nuevo desde el espacio de trabajo local.
    - Con `scope: "agent"` o `scope: "shared"`, ese espacio de trabajo remoto se comparte con ese mismo alcance.

    Usa esto cuando:

    - el entorno aislado deba vivir principalmente en el lado remoto de OpenShell
    - quieras reducir la sobrecarga de sincronización por turno
    - no quieras que las ediciones locales del host sobrescriban silenciosamente el estado del entorno aislado remoto

  </Tab>
</Tabs>

Elige `mirror` si piensas en el entorno aislado como un entorno de ejecución temporal. Elige `remote` si piensas en el entorno aislado como el espacio de trabajo real.

#### Ciclo de vida de OpenShell

Los entornos aislados de OpenShell se siguen gestionando mediante el ciclo de vida normal de entornos aislados:

- `openclaw sandbox list` muestra los runtimes de OpenShell además de los runtimes de Docker
- `openclaw sandbox recreate` elimina el runtime actual y permite que OpenClaw lo vuelva a crear en el siguiente uso
- la lógica de poda también es consciente del backend

Para el modo `remote`, volver a crear es especialmente importante:

- volver a crear elimina el espacio de trabajo remoto canónico para ese alcance
- el siguiente uso siembra un espacio de trabajo remoto nuevo desde el espacio de trabajo local

Para el modo `mirror`, volver a crear principalmente restablece el entorno de ejecución remoto porque el espacio de trabajo local sigue siendo canónico de todos modos.

## Acceso al espacio de trabajo

`agents.defaults.sandbox.workspaceAccess` controla **qué puede ver el entorno aislado**:

<Tabs>
  <Tab title="none (predeterminado)">
    Las herramientas ven un espacio de trabajo del entorno aislado bajo `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Monta el espacio de trabajo del agente en solo lectura en `/agent` (deshabilita `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Monta el espacio de trabajo del agente en lectura/escritura en `/workspace`.
  </Tab>
</Tabs>

Con el backend OpenShell:

- el modo `mirror` sigue usando el espacio de trabajo local como fuente canónica entre turnos de exec
- el modo `remote` usa el espacio de trabajo remoto de OpenShell como fuente canónica después de la siembra inicial
- `workspaceAccess: "ro"` y `"none"` siguen restringiendo el comportamiento de escritura de la misma manera

Los medios entrantes se copian en el espacio de trabajo activo del entorno aislado (`media/inbound/*`).

<Note>
**Nota sobre Skills:** la herramienta `read` está arraigada en la raíz del entorno aislado. Con `workspaceAccess: "none"`, OpenClaw replica las Skills elegibles en el espacio de trabajo del entorno aislado (`.../skills`) para que puedan leerse. Con `"rw"`, las Skills del espacio de trabajo se pueden leer desde `/workspace/skills`.
</Note>

## Montajes bind personalizados

`agents.defaults.sandbox.docker.binds` monta directorios adicionales del host en el contenedor. Formato: `host:container:mode` (por ejemplo, `"/home/user/source:/source:rw"`).

Los binds globales y por agente se **fusionan** (no se reemplazan). Bajo `scope: "shared"`, los binds por agente se ignoran.

`agents.defaults.sandbox.browser.binds` monta directorios adicionales del host solo en el contenedor del **navegador del entorno aislado**.

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

- Los binds eluden el sistema de archivos del entorno aislado: exponen rutas del host con el modo que configures (`:ro` o `:rw`).
- OpenClaw bloquea fuentes de bind peligrosas (por ejemplo: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` y montajes padre que las expondrían).
- OpenClaw también bloquea raíces comunes de credenciales del directorio personal, como `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` y `~/.ssh`.
- La validación de bind no es solo coincidencia de cadenas. OpenClaw normaliza la ruta de origen y luego la resuelve de nuevo a través del ancestro existente más profundo antes de volver a comprobar rutas bloqueadas y raíces permitidas.
- Eso significa que los escapes mediante padres con symlink siguen fallando de forma cerrada incluso cuando la hoja final aún no existe. Ejemplo: `/workspace/run-link/new-file` sigue resolviéndose como `/var/run/...` si `run-link` apunta allí.
- Las raíces de origen permitidas se canonicalizan de la misma manera, por lo que una ruta que solo parece estar dentro de la lista de permitidos antes de la resolución de symlinks se sigue rechazando como `outside allowed roots`.
- Los montajes sensibles (secretos, claves SSH, credenciales de servicio) deberían ser `:ro` salvo que sea absolutamente necesario.
- Combínalo con `workspaceAccess: "ro"` si solo necesitas acceso de lectura al espacio de trabajo; los modos de bind siguen siendo independientes.
- Consulta [Entorno aislado vs política de herramientas vs elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated) para saber cómo interactúan los binds con la política de herramientas y exec elevado.

</Warning>

## Imágenes y configuración

Imagen Docker predeterminada: `openclaw-sandbox:bookworm-slim`

<Steps>
  <Step title="Compilar la imagen predeterminada">
    ```bash
    scripts/sandbox-setup.sh
    ```

    La imagen predeterminada **no** incluye Node. Si una Skill necesita Node (u otros runtimes), crea una imagen personalizada o instala mediante `sandbox.docker.setupCommand` (requiere egreso de red + raíz escribible + usuario root).

    OpenClaw no sustituye silenciosamente por `debian:bookworm-slim` simple cuando falta `openclaw-sandbox:bookworm-slim`. Las ejecuciones del entorno aislado que apuntan a la imagen predeterminada fallan rápido con una instrucción de compilación hasta que ejecutes `scripts/sandbox-setup.sh`, porque la imagen incluida trae `python3` para los helpers de escritura/edición del entorno aislado.

  </Step>
  <Step title="Opcional: compilar la imagen común">
    Para una imagen de entorno aislado más funcional con herramientas comunes (por ejemplo `curl`, `jq`, `nodejs`, `python3`, `git`):

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Luego establece `agents.defaults.sandbox.docker.image` en `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Opcional: compilar la imagen del navegador del entorno aislado">
    ```bash
    scripts/sandbox-browser-setup.sh
    ```
  </Step>
</Steps>

De forma predeterminada, los contenedores del entorno aislado Docker se ejecutan **sin red**. Sobrescríbelo con `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Valores predeterminados de Chromium del navegador del entorno aislado">
    La imagen incluida del navegador del entorno aislado también aplica valores predeterminados conservadores de inicio de Chromium para cargas de trabajo en contenedores. Los valores predeterminados actuales del contenedor incluyen:

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
    - Las tres flags de endurecimiento gráfico (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) son opcionales y son útiles cuando los contenedores no tienen soporte de GPU. Establece `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` si tu carga de trabajo requiere WebGL u otras funciones 3D/del navegador.
    - `--disable-extensions` está habilitado de forma predeterminada y puede deshabilitarse con `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` para flujos que dependen de extensiones.
    - `--renderer-process-limit=2` se controla mediante `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, donde `0` mantiene el valor predeterminado de Chromium.

    Si necesitas un perfil de runtime diferente, usa una imagen de navegador personalizada y proporciona tu propio entrypoint. Para perfiles locales (no en contenedor) de Chromium, usa `browser.extraArgs` para añadir flags de inicio adicionales.

  </Accordion>
  <Accordion title="Valores predeterminados de seguridad de red">
    - `network: "host"` está bloqueado.
    - `network: "container:<id>"` está bloqueado de forma predeterminada (riesgo de eludir mediante unión de namespace).
    - Anulación de emergencia: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Las instalaciones de Docker y el Gateway en contenedor están aquí: [Docker](/es/install/docker)

Para despliegues del Gateway Docker, `scripts/docker/setup.sh` puede inicializar la configuración del entorno aislado. Establece `OPENCLAW_SANDBOX=1` (o `true`/`yes`/`on`) para habilitar esa ruta. Puedes sobrescribir la ubicación del socket con `OPENCLAW_DOCKER_SOCKET`. Configuración completa y referencia de env: [Docker](/es/install/docker#agent-sandbox).

## setupCommand (configuración única del contenedor)

`setupCommand` se ejecuta **una vez** después de crear el contenedor del entorno aislado (no en cada ejecución). Se ejecuta dentro del contenedor mediante `sh -lc`.

Rutas:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Por agente: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Errores comunes">
    - El `docker.network` predeterminado es `"none"` (sin egreso), por lo que las instalaciones de paquetes fallarán.
    - `docker.network: "container:<id>"` requiere `dangerouslyAllowContainerNamespaceJoin: true` y es solo para emergencia.
    - `readOnlyRoot: true` impide escrituras; establece `readOnlyRoot: false` o crea una imagen personalizada.
    - `user` debe ser root para instalaciones de paquetes (omite `user` o establece `user: "0:0"`).
    - Exec del entorno aislado **no** hereda `process.env` del host. Usa `agents.defaults.sandbox.docker.env` (o una imagen personalizada) para claves de API de Skills.

  </Accordion>
</AccordionGroup>

## Política de herramientas y vías de escape

Las políticas de permiso/denegación de herramientas siguen aplicándose antes de las reglas del entorno aislado. Si una herramienta se deniega globalmente o por agente, el entorno aislado no la recupera.

`tools.elevated` es una vía de escape explícita que ejecuta `exec` fuera del entorno aislado (`gateway` de forma predeterminada, o `node` cuando el destino de exec es `node`). Las directivas `/exec` solo se aplican a remitentes autorizados y persisten por sesión; para deshabilitar `exec` de forma estricta, usa una denegación de política de herramientas (consulta [Entorno aislado vs política de herramientas vs elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated)).

Depuración:

- Usa `openclaw sandbox explain` para inspeccionar el modo efectivo del entorno aislado, la política de herramientas y las claves de configuración de corrección.
- Consulta [Entorno aislado vs política de herramientas vs elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated) para el modelo mental de "¿por qué está bloqueado esto?".

Mantenlo bloqueado.

## Sobrescrituras multiagente

Cada agente puede sobrescribir entorno aislado + herramientas: `agents.list[].sandbox` y `agents.list[].tools` (más `agents.list[].tools.sandbox.tools` para la política de herramientas del entorno aislado). Consulta [Entorno aislado y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) para la precedencia.

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
- [Sandbox vs política de herramientas vs elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated) — depuración de "¿por qué está bloqueado esto?"
- [Seguridad](/es/gateway/security)

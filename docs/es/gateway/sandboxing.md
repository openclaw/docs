---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'Cómo funciona el sandboxing de OpenClaw: modos, alcances, acceso al espacio de trabajo e imágenes'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-24T05:30:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07be63b71a458a17020f33a24d60e6d8d7007d4eaea686a21acabf4815c3f653
    source_path: gateway/sandboxing.md
    workflow: 15
---

Comportamiento:

- OpenClaw inicializa el espacio de trabajo remoto desde el espacio de trabajo local una vez cuando se crea el sandbox.
- Después de eso, `exec` y las herramientas de archivos operan directamente sobre el espacio de trabajo remoto.
- OpenClaw no sincroniza automáticamente los cambios remotos de vuelta al espacio de trabajo local.

Úsalo cuando:

- quieres que el sandbox remoto sea el estado real de trabajo
- no te importa editar el espacio de trabajo local fuera de OpenClaw
- quieres evitar el costo adicional de sincronización de `mirror`

Consecuencia importante:

- si cambias archivos localmente después de la inicialización, el sandbox remoto no verá esos cambios hasta que recrees el sandbox

## Acceso al espacio de trabajo

`agents.defaults.sandbox.workspaceAccess` controla cuánto del espacio de trabajo del host entra en el sandbox:

- `"none"`: sin acceso al espacio de trabajo del host.
- `"ro"`: el espacio de trabajo del host se monta/expone como solo lectura.
- `"rw"`: el espacio de trabajo del host se monta/expone como lectura-escritura.

Esto es importante:

- si usas `"none"`, el sandbox obtiene su propio espacio de trabajo aislado
- si usas `"ro"` o `"rw"` en Docker, OpenClaw puede usar bind mount del espacio de trabajo del host
- en backends remotos (`ssh`, `openshell`), el acceso al espacio de trabajo se modela mediante inicialización/sincronización remota, no mediante bind mounts Docker

## Imágenes y entorno del sandbox

El backend Docker usa una imagen de sandbox de OpenClaw para la ejecución de herramientas. OpenClaw puede compilarla o extraerla según sea necesario.

Controles habituales:

- `agents.defaults.sandbox.docker.image`
- `agents.defaults.sandbox.docker.pull`
- `agents.defaults.sandbox.docker.build`
- `agents.defaults.sandbox.docker.binds`
- `agents.defaults.sandbox.docker.network`

Para el navegador en sandbox, OpenClaw usa una imagen de navegador separada.

Puntos clave:

- la imagen del sandbox de herramientas y la imagen del navegador son independientes
- `sandbox.browser.network` controla la red del contenedor del navegador
- `sandbox.docker.network` controla la red del contenedor de herramientas
- los contenedores del navegador pueden recrearse si cambia la época/hash de configuración

## Recrear sandboxes

Usa recreación cuando necesites borrar estado remoto/aislado y volver a inicializar desde el origen local:

```bash
openclaw sandbox recreate
openclaw sandbox recreate --all
openclaw sandbox recreate --browser
openclaw sandbox recreate --browser --all
```

En términos generales:

- `recreate` borra el estado del sandbox en el alcance objetivo
- en el siguiente uso, OpenClaw lo vuelve a crear
- para backends remotos, el espacio de trabajo remoto se vuelve a inicializar desde el local en el siguiente uso
- para el navegador, la recreación ayuda cuando cambian la configuración o las etiquetas del contenedor

## Bind mounts personalizados (Docker)

Puedes exponer rutas adicionales del host al sandbox Docker con `sandbox.docker.binds`.

Ejemplo:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        backend: "docker",
        docker: {
          binds: [
            "/home/user/shared-data:/data:ro",
          ],
        },
      },
    },
  },
}
```

Úsalo con moderación. Cada bind mount aumenta la superficie accesible desde el sandbox.

## Qué esperar en la práctica

- **Sin sandbox**: las herramientas se ejecutan directamente en el host.
- **`mode: "non-main"`**: la sesión principal permanece en el host; los grupos/canales/subagentes no principales pueden ejecutarse en sandbox.
- **`scope: "agent"`**: un agente comparte estado de sandbox entre sus sesiones en sandbox.
- **`scope: "session"`**: cada sesión obtiene su propio estado aislado.
- **`scope: "shared"`**: todos los usuarios/sesiones en sandbox comparten un mismo sandbox.

Si quieres el aislamiento más fuerte, usa:

- `mode: "all"`
- `scope: "session"`
- `workspaceAccess: "none"`

## Limitaciones

- No es una garantía de seguridad perfecta.
- `tools.elevated` puede omitir el sandbox intencionalmente.
- El navegador en sandbox actualmente solo es compatible con el backend Docker.
- Los backends remotos dependen de la postura de seguridad de la máquina remota.
- Los bind mounts y el acceso `rw` al espacio de trabajo reducen el aislamiento.

## Relacionado

- [OpenShell](/es/gateway/openshell)
- [Elevated Mode](/es/tools/elevated)
- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Configuración — agentes](/es/gateway/config-agents)

- Cuando el sandbox se crea por primera vez, OpenClaw inicializa el espacio de trabajo remoto desde el espacio de trabajo local una vez.
- Después de eso, `exec`, `read`, `write`, `edit` y `apply_patch` operan directamente contra el espacio de trabajo remoto de OpenShell.
- OpenClaw **no** sincroniza los cambios remotos de vuelta al espacio de trabajo local después de `exec`.
- Las lecturas de contenido multimedia en tiempo de prompt siguen funcionando porque las herramientas de archivos y contenido multimedia leen a través del bridge del sandbox en lugar de asumir una ruta local del host.
- El transporte es SSH hacia el sandbox de OpenShell devuelto por `openshell sandbox ssh-config`.

Consecuencias importantes:

- Si editas archivos en el host fuera de OpenClaw después del paso de inicialización, el sandbox remoto **no** verá esos cambios automáticamente.
- Si el sandbox se recrea, el espacio de trabajo remoto se vuelve a inicializar desde el espacio de trabajo local.
- Con `scope: "agent"` o `scope: "shared"`, ese espacio de trabajo remoto se comparte en ese mismo alcance.

Usa esto cuando:

- el sandbox deba residir principalmente en el lado remoto de OpenShell
- quieras una menor sobrecarga de sincronización por turno
- no quieras que las ediciones locales del host sobrescriban silenciosamente el estado remoto del sandbox

Elige `mirror` si piensas en el sandbox como un entorno temporal de ejecución.
Elige `remote` si piensas en el sandbox como el espacio de trabajo real.

#### Ciclo de vida de OpenShell

Los sandboxes de OpenShell siguen gestionándose mediante el ciclo de vida normal del sandbox:

- `openclaw sandbox list` muestra tiempos de ejecución de OpenShell además de los de Docker
- `openclaw sandbox recreate` elimina el tiempo de ejecución actual y deja que OpenClaw lo recree en el siguiente uso
- la lógica de depuración también reconoce el backend

Para el modo `remote`, recreate es especialmente importante:

- recreate elimina el espacio de trabajo remoto canónico para ese alcance
- el siguiente uso inicializa un espacio de trabajo remoto nuevo desde el espacio de trabajo local

Para el modo `mirror`, recreate principalmente restablece el entorno remoto de ejecución
porque el espacio de trabajo local sigue siendo canónico de todos modos.

## Acceso al espacio de trabajo

`agents.defaults.sandbox.workspaceAccess` controla **qué puede ver el sandbox**:

- `"none"` (predeterminado): las herramientas ven un espacio de trabajo de sandbox en `~/.openclaw/sandboxes`.
- `"ro"`: monta el espacio de trabajo del agente como solo lectura en `/agent` (deshabilita `write`/`edit`/`apply_patch`).
- `"rw"`: monta el espacio de trabajo del agente en lectura/escritura en `/workspace`.

Con el backend OpenShell:

- el modo `mirror` sigue usando el espacio de trabajo local como fuente canónica entre turnos de exec
- el modo `remote` usa el espacio de trabajo remoto de OpenShell como fuente canónica después de la inicialización inicial
- `workspaceAccess: "ro"` y `"none"` siguen restringiendo el comportamiento de escritura de la misma forma

El contenido multimedia entrante se copia al espacio de trabajo activo del sandbox (`media/inbound/*`).
Nota sobre Skills: la herramienta `read` está anclada a la raíz del sandbox. Con `workspaceAccess: "none"`,
OpenClaw replica las Skills válidas dentro del espacio de trabajo del sandbox (`.../skills`) para
que puedan leerse. Con `"rw"`, las Skills del espacio de trabajo pueden leerse desde
`/workspace/skills`.

## Bind mounts personalizados

`agents.defaults.sandbox.docker.binds` monta directorios adicionales del host dentro del contenedor.
Formato: `host:container:mode` (por ejemplo, `"/home/user/source:/source:rw"`).

Los binds globales y por agente se **fusionan** (no se reemplazan). Con `scope: "shared"`, los binds por agente se ignoran.

`agents.defaults.sandbox.browser.binds` monta directorios adicionales del host solo en el contenedor del **navegador del sandbox**.

- Cuando está configurado (incluido `[]`), reemplaza `agents.defaults.sandbox.docker.binds` para el contenedor del navegador.
- Cuando se omite, el contenedor del navegador recurre a `agents.defaults.sandbox.docker.binds` (compatible hacia atrás).

Ejemplo (código fuente en solo lectura + un directorio de datos extra):

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

- Los binds omiten el sistema de archivos del sandbox: exponen rutas del host con el modo que establezcas (`:ro` o `:rw`).
- OpenClaw bloquea fuentes de bind peligrosas (por ejemplo: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` y montajes padre que las expondrían).
- OpenClaw también bloquea raíces comunes de credenciales en el directorio home como `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` y `~/.ssh`.
- La validación de binds no es solo coincidencia de cadenas. OpenClaw normaliza la ruta fuente y luego la resuelve de nuevo a través del ancestro existente más profundo antes de volver a comprobar rutas bloqueadas y raíces permitidas.
- Eso significa que los escapes por padres con symlink siguen fallando en modo cerrado incluso cuando la hoja final aún no existe. Ejemplo: `/workspace/run-link/new-file` sigue resolviéndose como `/var/run/...` si `run-link` apunta allí.
- Las raíces fuente permitidas se canonicalizan de la misma forma, por lo que una ruta que solo parezca estar dentro de la lista permitida antes de la resolución del symlink sigue siendo rechazada como `outside allowed roots`.
- Los montajes sensibles (secretos, claves SSH, credenciales de servicios) deberían ser `:ro` salvo que sea absolutamente necesario.
- Combínalo con `workspaceAccess: "ro"` si solo necesitas acceso de lectura al espacio de trabajo; los modos de bind siguen siendo independientes.
- Consulta [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated) para ver cómo interactúan los binds con la política de herramientas y exec elevado.

## Imágenes + configuración

Imagen Docker predeterminada: `openclaw-sandbox:bookworm-slim`

Compílala una vez:

```bash
scripts/sandbox-setup.sh
```

Nota: la imagen predeterminada **no** incluye Node. Si una Skill necesita Node (u
otros tiempos de ejecución), hornea una imagen personalizada o instala mediante
`sandbox.docker.setupCommand` (requiere salida de red + raíz escribible +
usuario root).

Si quieres una imagen de sandbox más funcional con herramientas comunes (por ejemplo
`curl`, `jq`, `nodejs`, `python3`, `git`), compila:

```bash
scripts/sandbox-common-setup.sh
```

Luego establece `agents.defaults.sandbox.docker.image` en
`openclaw-sandbox-common:bookworm-slim`.

Imagen de navegador en sandbox:

```bash
scripts/sandbox-browser-setup.sh
```

De forma predeterminada, los contenedores Docker de sandbox se ejecutan **sin red**.
Anúlalo con `agents.defaults.sandbox.docker.network`.

La imagen incluida del navegador en sandbox también aplica valores conservadores de inicio de Chromium
para cargas de trabajo en contenedores. Los valores predeterminados actuales del contenedor incluyen:

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
- `--no-sandbox` y `--disable-setuid-sandbox` cuando `noSandbox` está habilitado.
- Los tres flags de refuerzo gráfico (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) son opcionales y son útiles
  cuando los contenedores no tienen compatibilidad con GPU. Establece `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  si tu carga de trabajo requiere WebGL u otras funciones 3D/del navegador.
- `--disable-extensions` está habilitado de forma predeterminada y puede deshabilitarse con
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` para flujos que dependan de extensiones.
- `--renderer-process-limit=2` está controlado por
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, donde `0` conserva el valor predeterminado de Chromium.

Si necesitas un perfil de tiempo de ejecución diferente, usa una imagen de navegador personalizada y proporciona
tu propio entrypoint. Para perfiles locales de Chromium (sin contenedor), usa
`browser.extraArgs` para agregar flags adicionales de inicio.

Valores predeterminados de seguridad:

- `network: "host"` está bloqueado.
- `network: "container:<id>"` está bloqueado de forma predeterminada (riesgo de omitir el namespace join).
- Anulación break-glass: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Las instalaciones Docker y el gateway en contenedor viven aquí:
[Docker](/es/install/docker)

Para despliegues de Gateway Docker, `scripts/docker/setup.sh` puede inicializar la configuración de sandbox.
Establece `OPENCLAW_SANDBOX=1` (o `true`/`yes`/`on`) para habilitar esa ruta. Puedes
anular la ubicación del socket con `OPENCLAW_DOCKER_SOCKET`. Referencia completa de
configuración y variables de entorno: [Docker](/es/install/docker#agent-sandbox).

## `setupCommand` (configuración única del contenedor)

`setupCommand` se ejecuta **una vez** después de crear el contenedor del sandbox (no en cada ejecución).
Se ejecuta dentro del contenedor mediante `sh -lc`.

Rutas:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Por agente: `agents.list[].sandbox.docker.setupCommand`

Errores habituales:

- El valor predeterminado de `docker.network` es `"none"` (sin salida), por lo que las instalaciones de paquetes fallarán.
- `docker.network: "container:<id>"` requiere `dangerouslyAllowContainerNamespaceJoin: true` y es solo break-glass.
- `readOnlyRoot: true` impide escrituras; establece `readOnlyRoot: false` o crea una imagen personalizada.
- `user` debe ser root para instalar paquetes (omite `user` o establece `user: "0:0"`).
- El exec del sandbox **no** hereda el `process.env` del host. Usa
  `agents.defaults.sandbox.docker.env` (o una imagen personalizada) para las claves API de Skills.

## Política de herramientas + vías de escape

Las políticas allow/deny de herramientas siguen aplicándose antes de las reglas de sandbox. Si una herramienta está denegada
globalmente o por agente, el sandboxing no la recupera.

`tools.elevated` es una vía de escape explícita que ejecuta `exec` fuera del sandbox (`gateway` de forma predeterminada, o `node` cuando el objetivo de exec es `node`).
Las directivas `/exec` solo se aplican a remitentes autorizados y se conservan por sesión; para desactivar completamente
`exec`, usa la denegación de política de herramientas (consulta [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated)).

Depuración:

- Usa `openclaw sandbox explain` para inspeccionar el modo efectivo de sandbox, la política de herramientas y las claves de configuración de corrección.
- Consulta [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated) para el modelo mental de “¿por qué está bloqueado?”.
  Mantenlo restringido.

## Anulaciones para múltiples agentes

Cada agente puede anular sandbox + herramientas:
`agents.list[].sandbox` y `agents.list[].tools` (más `agents.list[].tools.sandbox.tools` para la política de herramientas del sandbox).
Consulta [Multi-Agent Sandbox & Tools](/es/tools/multi-agent-sandbox-tools) para la precedencia.

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

- [OpenShell](/es/gateway/openshell) -- configuración del backend de sandbox gestionado, modos de espacio de trabajo y referencia de configuración
- [Configuración de sandbox](/es/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated) -- depurar “¿por qué está bloqueado?”
- [Multi-Agent Sandbox & Tools](/es/tools/multi-agent-sandbox-tools) -- anulaciones por agente y precedencia
- [Seguridad](/es/gateway/security)

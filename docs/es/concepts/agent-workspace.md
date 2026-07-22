---
read_when:
    - Necesitas explicar el espacio de trabajo del agente o su estructura de archivos
    - Se desea hacer una copia de seguridad o migrar el espacio de trabajo de un agente
sidebarTitle: Agent workspace
summary: 'Espacio de trabajo del agente: ubicación, estructura y estrategia de copia de seguridad'
title: Espacio de trabajo del agente
x-i18n:
    generated_at: "2026-07-22T10:29:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b58ead9079c3dda4bcaec3253f8d55e67e7e554d5c5b87ccfec6b08ec4ba038f
    source_path: concepts/agent-workspace.md
    workflow: 16
---

El espacio de trabajo es el hogar del agente: el directorio de trabajo utilizado para las herramientas de archivos
y el contexto del espacio de trabajo. Manténgalo privado y trátelo como memoria.

Esto es independiente de `~/.openclaw/`, que almacena la configuración, las credenciales y las sesiones.

<Warning>
El espacio de trabajo es el **cwd predeterminado**, no un entorno aislado estricto. Las herramientas resuelven las rutas relativas con respecto al espacio de trabajo, pero las rutas absolutas aún pueden acceder a otras ubicaciones del host, a menos que se habilite el aislamiento. Si necesita aislamiento, use [`agents.defaults.sandbox`](/es/gateway/sandboxing) (o la configuración de aislamiento por agente).

Cuando el aislamiento está habilitado y `workspaceAccess` no es `"rw"`, las herramientas operan dentro de un espacio de trabajo aislado en `~/.openclaw/sandboxes`, no en el espacio de trabajo del host.
</Warning>

## Ubicación predeterminada

- Valor predeterminado: `~/.openclaw/workspace`
- Si `OPENCLAW_PROFILE` está definido y no es `"default"`, el valor predeterminado pasa a ser `~/.openclaw/workspace-<profile>`.
- `OPENCLAW_WORKSPACE_DIR` reemplaza ambos valores anteriores cuando está definido.
- Los agentes no predeterminados (`agents.entries.*`) sin un espacio de trabajo explícito se resuelven como `<state-dir>/workspace-<agentId>`, no como el espacio de trabajo compartido predeterminado.

Reemplácelo en `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

Reemplazo por agente: `agents.entries.*.workspace`.

`openclaw onboard`, `openclaw configure` o `openclaw setup` crean el espacio de trabajo y generan los archivos de arranque si faltan.

<Note>
Las copias de inicialización del entorno aislado solo aceptan archivos normales dentro del espacio de trabajo; se ignoran los alias de enlaces simbólicos o físicos que se resuelvan fuera del espacio de trabajo de origen.
</Note>

Si ya administra los archivos del espacio de trabajo por su cuenta, deshabilite la creación de archivos de arranque:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Carpetas adicionales del espacio de trabajo

Es posible que las instalaciones antiguas hayan creado `~/openclaw`. Mantener varios directorios de espacio de trabajo puede provocar confusiones en la autenticación o divergencias de estado, ya que solo puede haber un espacio de trabajo activo a la vez.

<Note>
**Recomendación:** mantenga un único espacio de trabajo activo. Si ya no utiliza las carpetas adicionales, archívelas o muévalas a la papelera (por ejemplo, `trash ~/openclaw`). Si mantiene intencionadamente varios espacios de trabajo, asegúrese de que `agents.defaults.workspace` (o la clave por agente `workspace`) apunte al activo.
</Note>

## Mapa de archivos del espacio de trabajo

Archivos estándar que OpenClaw espera encontrar dentro del espacio de trabajo:

<AccordionGroup>
  <Accordion title="AGENTS.md - instrucciones de funcionamiento">
    Instrucciones de funcionamiento para el agente y sobre cómo debe utilizar la memoria. Se carga al inicio de cada sesión. Es un buen lugar para incluir reglas, prioridades y detalles sobre «cómo comportarse».
  </Accordion>
  <Accordion title="SOUL.md - personalidad y tono">
    Personalidad, tono y límites. Se carga en cada sesión. Guía: [guía de personalidad de SOUL.md](/es/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - quién es el usuario">
    Quién es el usuario y cómo dirigirse a él. Se carga en cada sesión.
  </Accordion>
  <Accordion title="IDENTITY.md - nombre, estilo y emoji">
    El nombre, el estilo y el emoji del agente. Se crea o actualiza durante el ritual de arranque.
  </Accordion>
  <Accordion title="TOOLS.md - convenciones de las herramientas locales">
    Notas sobre las herramientas y convenciones locales. No controla la disponibilidad de las herramientas; solo ofrece orientación.
  </Accordion>
  <Accordion title="HEARTBEAT.md - lista de comprobación de Heartbeat">
    Pequeña lista de comprobación opcional para las ejecuciones de Heartbeat. Manténgala breve para evitar el consumo innecesario de tokens.
  </Accordion>
  <Accordion title="BOOT.md - lista de comprobación de inicio">
    Lista de comprobación de inicio opcional que se ejecuta automáticamente al reiniciar el Gateway (cuando los [hooks internos](/es/automation/hooks) están habilitados). Manténgala breve; use la herramienta de mensajes para los envíos salientes.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - ritual de primera ejecución">
    Ritual único de primera ejecución. Solo se crea para un espacio de trabajo completamente nuevo. Elimínelo cuando finalice el ritual.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - registro diario de memoria">
    Registro diario de memoria (un archivo por día). Se recomienda leer el de hoy y el de ayer al iniciar la sesión.
  </Accordion>
  <Accordion title="MEMORY.md - memoria seleccionada a largo plazo (opcional)">
    Memoria seleccionada a largo plazo: hechos duraderos, preferencias, decisiones y resúmenes breves. Mantenga los registros detallados en `memory/YYYY-MM-DD.md` para que las herramientas de memoria puedan recuperarlos cuando se soliciten sin insertarlos en cada prompt. Cargue `MEMORY.md` únicamente en la sesión principal y privada (no en contextos compartidos o de grupo). Consulte [Memoria](/es/concepts/memory) para conocer el flujo de trabajo y el vaciado automático de la memoria.
  </Accordion>
  <Accordion title="skills/ - Skills del espacio de trabajo (opcional)">
    Skills específicas del espacio de trabajo. Es la ubicación de Skills con mayor precedencia para ese espacio de trabajo, por delante de las Skills del agente del proyecto, las Skills personales del agente, las Skills administradas, las Skills incluidas y `skills.load.extraDirs` cuando los nombres coinciden.
  </Accordion>
  <Accordion title="canvas/ - archivos de la interfaz de Canvas (opcional)">
    Archivos de la interfaz de Canvas para las pantallas de Node (por ejemplo, `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Si falta un archivo de arranque, OpenClaw inserta un marcador de «archivo ausente» en la sesión y continúa. Los archivos de arranque grandes se truncan al insertarse; ajuste los límites con `agents.defaults.bootstrapMaxChars` (valor predeterminado: `20000`) y `agents.defaults.bootstrapTotalMaxChars` (valor predeterminado: `60000`). `openclaw setup` puede volver a crear los valores predeterminados ausentes sin sobrescribir los archivos existentes.
</Note>

## Qué NO se encuentra en el espacio de trabajo

Estos elementos se encuentran en `~/.openclaw/` y NO deben confirmarse en el repositorio del espacio de trabajo:

- `~/.openclaw/openclaw.json` (configuración)
- `~/.openclaw/state/openclaw.sqlite` (estado de configuración y certificaciones del espacio de trabajo compartido)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (perfiles de autenticación de modelos: OAuth + claves de API)
- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` (filas de sesiones, transcripciones y estado de ejecución por agente)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (cuenta, configuración, Skills, plugins y estado nativo de los hilos del entorno de ejecución de Codex por agente)
- `~/.openclaw/credentials/` (estado de canales y proveedores, además de datos heredados de importación de OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (orígenes de migración heredados y artefactos de archivo o soporte)
- `~/.openclaw/skills/` (Skills administradas)

Si necesita migrar sesiones o la configuración, cópielas por separado y manténgalas fuera del control de versiones.

Las versiones anteriores de OpenClaw escribían los archivos auxiliares del espacio de trabajo `openclaw-workspace-state.json`,
`.openclaw/workspace-state.json` y `.attested`. El entorno de ejecución actual
solo utiliza la base de datos SQLite compartida para ese estado. Si Doctor informa
de uno de estos archivos, ejecute `openclaw doctor --fix`; Doctor importa el estado
heredado válido y elimina un origen únicamente después de verificar las filas de la base de datos.

## Copia de seguridad con Git (recomendada y privada)

Trate el espacio de trabajo como memoria privada. Guárdelo en un repositorio de Git **privado** para disponer de una copia de seguridad y poder recuperarlo.

Ejecute estos pasos en la máquina donde se ejecuta el Gateway (allí se encuentra el espacio de trabajo).

<Steps>
  <Step title="Inicializar el repositorio">
    Si Git está instalado, los espacios de trabajo completamente nuevos se inicializan automáticamente. Si este espacio de trabajo aún no es un repositorio, ejecute:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Añadir un repositorio remoto privado">
    <Tabs>
      <Tab title="Interfaz web de GitHub">
        1. Cree un nuevo repositorio **privado** en GitHub.
        2. No lo inicialice con un archivo README (para evitar conflictos de fusión).
        3. Copie la URL HTTPS del repositorio remoto.
        4. Añada el repositorio remoto y envíe los cambios:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="CLI de GitHub (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="Interfaz web de GitLab">
        1. Cree un nuevo repositorio **privado** en GitLab.
        2. No lo inicialice con un archivo README (para evitar conflictos de fusión).
        3. Copie la URL HTTPS del repositorio remoto.
        4. Añada el repositorio remoto y envíe los cambios:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Actualizaciones posteriores">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## No confirme secretos

<Warning>
Incluso en un repositorio privado, evite almacenar secretos en el espacio de trabajo:

- Claves de API, tokens de OAuth, contraseñas o credenciales privadas.
- Cualquier elemento bajo `~/.openclaw/`.
- Volcados sin procesar de chats o archivos adjuntos confidenciales.

Si debe almacenar referencias confidenciales, use marcadores de posición y mantenga el secreto real en otro lugar (un gestor de contraseñas, variables de entorno o `~/.openclaw/`).
</Warning>

Plantilla inicial sugerida para `.gitignore`:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Trasladar el espacio de trabajo a una máquina nueva

<Steps>
  <Step title="Clonar el repositorio">
    Clone el repositorio en la ruta deseada (valor predeterminado: `~/.openclaw/workspace`).
  </Step>
  <Step title="Actualizar la configuración">
    Defina `agents.defaults.workspace` con esa ruta en `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Generar los archivos ausentes">
    Ejecute `openclaw setup --workspace <path>` para generar los archivos que falten.
  </Step>
  <Step title="Copiar las sesiones (opcional)">
    Si necesita las sesiones, copie `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
    por separado desde la máquina antigua. Copie `~/.openclaw/agents/<agentId>/sessions/`
    únicamente cuando también necesite entradas de migración heredadas o artefactos de archivo o soporte.
  </Step>
</Steps>

## Notas avanzadas

- El enrutamiento multiagente puede utilizar distintos espacios de trabajo para cada agente mediante `agents.entries.*.workspace`. Consulte [Enrutamiento de canales](/es/channels/channel-routing) para conocer la configuración del enrutamiento.
- Si `agents.defaults.sandbox` está habilitado, las sesiones que no sean la principal pueden utilizar espacios de trabajo aislados por sesión en `agents.defaults.sandbox.workspaceRoot`.

## Contenido relacionado

- [Heartbeat](/es/gateway/heartbeat) - archivo HEARTBEAT.md del espacio de trabajo
- [Aislamiento](/es/gateway/sandboxing) - acceso al espacio de trabajo en entornos aislados
- [Sesión](/es/concepts/session) - rutas de almacenamiento de sesiones
- [Órdenes permanentes](/es/automation/standing-orders) - instrucciones persistentes en los archivos del espacio de trabajo

---
read_when:
    - Debes explicar el espacio de trabajo del agente o su estructura de archivos
    - Desea hacer una copia de seguridad o migrar un espacio de trabajo de agente
sidebarTitle: Agent workspace
summary: 'Espacio de trabajo del agente: ubicación, estructura y estrategia de copias de seguridad'
title: Espacio de trabajo del agente
x-i18n:
    generated_at: "2026-05-06T05:29:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: be5c4c55f3cda5dcf6b763f8e59fa926283cee18270a58dbd62593947a55e67c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

El espacio de trabajo es el hogar del agente. Es el único directorio de trabajo usado para las herramientas de archivos y para el contexto del espacio de trabajo. Mantenlo privado y trátalo como memoria.

Esto está separado de `~/.openclaw/`, que almacena configuración, credenciales y sesiones.

<Warning>
El espacio de trabajo es el **cwd predeterminado**, no un sandbox estricto. Las herramientas resuelven las rutas relativas respecto del espacio de trabajo, pero las rutas absolutas aún pueden llegar a otros lugares del host a menos que el sandboxing esté habilitado. Si necesitas aislamiento, usa [`agents.defaults.sandbox`](/es/gateway/sandboxing) (y/o configuración de sandbox por agente).

Cuando el sandboxing está habilitado y `workspaceAccess` no es `"rw"`, las herramientas operan dentro de un espacio de trabajo de sandbox bajo `~/.openclaw/sandboxes`, no en tu espacio de trabajo del host.
</Warning>

## Ubicación predeterminada

- Predeterminado: `~/.openclaw/workspace`
- Si `OPENCLAW_PROFILE` está definido y no es `"default"`, el valor predeterminado pasa a ser `~/.openclaw/workspace-<profile>`.
- Sobrescribir en `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure` u `openclaw setup` crearán el espacio de trabajo y sembrarán los archivos de arranque si faltan.

<Note>
Las copias semilla del sandbox solo aceptan archivos normales dentro del espacio de trabajo; se ignoran los alias de symlink/hardlink que se resuelven fuera del espacio de trabajo de origen.
</Note>

Si ya gestionas tú mismo los archivos del espacio de trabajo, puedes deshabilitar la creación de archivos de arranque:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Carpetas adicionales del espacio de trabajo

Las instalaciones anteriores pueden haber creado `~/openclaw`. Mantener varios directorios de espacio de trabajo puede causar confusiones de autenticación o desviaciones de estado, porque solo un espacio de trabajo está activo a la vez.

<Note>
**Recomendación:** mantén un único espacio de trabajo activo. Si ya no usas las carpetas adicionales, archívalas o muévelas a la papelera (por ejemplo, `trash ~/openclaw`). Si mantienes varios espacios de trabajo intencionalmente, asegúrate de que `agents.defaults.workspace` apunte al activo.

`openclaw doctor` advierte cuando detecta directorios de espacio de trabajo adicionales.
</Note>

## Mapa de archivos del espacio de trabajo

Estos son los archivos estándar que OpenClaw espera dentro del espacio de trabajo:

<AccordionGroup>
  <Accordion title="AGENTS.md - operating instructions">
    Instrucciones operativas para el agente y cómo debe usar la memoria. Se cargan al inicio de cada sesión. Buen lugar para reglas, prioridades y detalles de "cómo comportarse".
  </Accordion>
  <Accordion title="SOUL.md - persona and tone">
    Persona, tono y límites. Se carga en cada sesión. Guía: [guía de personalidad de SOUL.md](/es/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - who the user is">
    Quién es el usuario y cómo dirigirse a él. Se carga en cada sesión.
  </Accordion>
  <Accordion title="IDENTITY.md - name, vibe, emoji">
    El nombre, la vibra y el emoji del agente. Se crea/actualiza durante el ritual de arranque.
  </Accordion>
  <Accordion title="TOOLS.md - local tool conventions">
    Notas sobre tus herramientas locales y convenciones. No controla la disponibilidad de herramientas; es solo orientación.
  </Accordion>
  <Accordion title="HEARTBEAT.md - heartbeat checklist">
    Lista de verificación diminuta opcional para ejecuciones de Heartbeat. Mantenla corta para evitar consumo de tokens.
  </Accordion>
  <Accordion title="BOOT.md - startup checklist">
    Lista de verificación de inicio opcional que se ejecuta automáticamente al reiniciar el Gateway (cuando los [hooks internos](/es/automation/hooks) están habilitados). Mantenla corta; usa la herramienta de mensajes para envíos salientes.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - first-run ritual">
    Ritual único de primera ejecución. Solo se crea para un espacio de trabajo completamente nuevo. Elimínalo después de completar el ritual.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - daily memory log">
    Registro diario de memoria (un archivo por día). Se recomienda leer hoy + ayer al iniciar la sesión.
  </Accordion>
  <Accordion title="MEMORY.md - curated long-term memory (optional)">
    Memoria a largo plazo curada. Cárgala solo en la sesión principal y privada (no en contextos compartidos/de grupo). Consulta [Memoria](/es/concepts/memory) para el flujo de trabajo y el vaciado automático de memoria.
  </Accordion>
  <Accordion title="skills/ - workspace skills (optional)">
    Skills específicos del espacio de trabajo. Ubicación de Skills con mayor precedencia para ese espacio de trabajo. Anula Skills de agente del proyecto, Skills de agente personales, Skills gestionados, Skills incluidos y `skills.load.extraDirs` cuando los nombres coinciden.
  </Accordion>
  <Accordion title="canvas/ - Canvas UI files (optional)">
    Archivos de interfaz de usuario de Canvas para visualizaciones de Node (por ejemplo `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Si falta algún archivo de arranque, OpenClaw inyecta un marcador de "archivo faltante" en la sesión y continúa. Los archivos de arranque grandes se truncan cuando se inyectan; ajusta los límites con `agents.defaults.bootstrapMaxChars` (predeterminado: 12000) y `agents.defaults.bootstrapTotalMaxChars` (predeterminado: 60000). `openclaw setup` puede recrear los valores predeterminados que faltan sin sobrescribir archivos existentes.
</Note>

## Qué NO está en el espacio de trabajo

Estos viven bajo `~/.openclaw/` y NO deben confirmarse en el repositorio del espacio de trabajo:

- `~/.openclaw/openclaw.json` (configuración)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (perfiles de autenticación del modelo: OAuth + claves de API)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (cuenta de runtime Codex por agente, configuración, Skills, plugins y estado nativo de hilos)
- `~/.openclaw/credentials/` (estado de canal/proveedor más datos de importación OAuth heredados)
- `~/.openclaw/agents/<agentId>/sessions/` (transcripciones de sesión + metadatos)
- `~/.openclaw/skills/` (Skills gestionados)

Si necesitas migrar sesiones o configuración, cópialas por separado y mantenlas fuera del control de versiones.

## Copia de seguridad con Git (recomendada, privada)

Trata el espacio de trabajo como memoria privada. Ponlo en un repositorio git **privado** para que tenga copia de seguridad y sea recuperable.

Ejecuta estos pasos en la máquina donde se ejecuta el Gateway (ahí es donde vive el espacio de trabajo).

<Steps>
  <Step title="Initialize the repo">
    Si git está instalado, los espacios de trabajo completamente nuevos se inicializan automáticamente. Si este espacio de trabajo aún no es un repositorio, ejecuta:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Add a private remote">
    <Tabs>
      <Tab title="GitHub web UI">
        1. Crea un nuevo repositorio **privado** en GitHub.
        2. No lo inicialices con un README (evita conflictos de merge).
        3. Copia la URL remota HTTPS.
        4. Añade el remoto y haz push:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub CLI (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="GitLab web UI">
        1. Crea un nuevo repositorio **privado** en GitLab.
        2. No lo inicialices con un README (evita conflictos de merge).
        3. Copia la URL remota HTTPS.
        4. Añade el remoto y haz push:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Ongoing updates">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## No confirmes secretos

<Warning>
Incluso en un repositorio privado, evita almacenar secretos en el espacio de trabajo:

- Claves de API, tokens OAuth, contraseñas o credenciales privadas.
- Cualquier cosa bajo `~/.openclaw/`.
- Volcados sin procesar de chats o adjuntos sensibles.

Si debes almacenar referencias sensibles, usa marcadores de posición y mantén el secreto real en otro lugar (gestor de contraseñas, variables de entorno o `~/.openclaw/`).
</Warning>

Inicio sugerido de `.gitignore`:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Mover el espacio de trabajo a una máquina nueva

<Steps>
  <Step title="Clone the repo">
    Clona el repositorio en la ruta deseada (predeterminada `~/.openclaw/workspace`).
  </Step>
  <Step title="Update config">
    Define `agents.defaults.workspace` en esa ruta en `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Seed missing files">
    Ejecuta `openclaw setup --workspace <path>` para sembrar cualquier archivo faltante.
  </Step>
  <Step title="Copy sessions (optional)">
    Si necesitas sesiones, copia `~/.openclaw/agents/<agentId>/sessions/` desde la máquina anterior por separado.
  </Step>
</Steps>

## Notas avanzadas

- El enrutamiento multiagente puede usar distintos espacios de trabajo por agente. Consulta [Enrutamiento de canales](/es/channels/channel-routing) para la configuración de enrutamiento.
- Si `agents.defaults.sandbox` está habilitado, las sesiones no principales pueden usar espacios de trabajo de sandbox por sesión bajo `agents.defaults.sandbox.workspaceRoot`.

## Relacionado

- [Heartbeat](/es/gateway/heartbeat) - archivo de espacio de trabajo HEARTBEAT.md
- [Sandboxing](/es/gateway/sandboxing) - acceso al espacio de trabajo en entornos con sandbox
- [Sesión](/es/concepts/session) - rutas de almacenamiento de sesiones
- [Órdenes permanentes](/es/automation/standing-orders) - instrucciones persistentes en archivos del espacio de trabajo

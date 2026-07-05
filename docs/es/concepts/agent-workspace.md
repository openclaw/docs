---
read_when:
    - Necesitas explicar el espacio de trabajo del agente o su organización de archivos
    - Quieres hacer una copia de seguridad o migrar un espacio de trabajo de agente
sidebarTitle: Agent workspace
summary: 'Espacio de trabajo del agente: ubicación, diseño y estrategia de copias de seguridad'
title: Espacio de trabajo del agente
x-i18n:
    generated_at: "2026-07-05T11:12:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a66c441267e306176e4e52c639892dae4a4363729ac647fedf7f946d189ce1b3
    source_path: concepts/agent-workspace.md
    workflow: 16
---

El espacio de trabajo es el hogar del agente: el directorio de trabajo usado para las herramientas de archivos
y el contexto del espacio de trabajo. Mantenlo privado y trátalo como memoria.

Esto está separado de `~/.openclaw/`, que almacena configuración, credenciales y sesiones.

<Warning>
El espacio de trabajo es el **cwd predeterminado**, no un sandbox estricto. Las herramientas resuelven las rutas relativas respecto del espacio de trabajo, pero las rutas absolutas aún pueden llegar a otros lugares del host a menos que el sandboxing esté habilitado. Si necesitas aislamiento, usa [`agents.defaults.sandbox`](/es/gateway/sandboxing) (y/o configuración de sandbox por agente).

Cuando el sandboxing está habilitado y `workspaceAccess` no es `"rw"`, las herramientas operan dentro de un espacio de trabajo de sandbox bajo `~/.openclaw/sandboxes`, no en tu espacio de trabajo del host.
</Warning>

## Ubicación predeterminada

- Predeterminada: `~/.openclaw/workspace`
- Si `OPENCLAW_PROFILE` está configurado y no es `"default"`, el valor predeterminado pasa a ser `~/.openclaw/workspace-<profile>`.
- `OPENCLAW_WORKSPACE_DIR` anula ambos valores anteriores cuando está configurado.
- Los agentes no predeterminados (`agents.list[]`) sin un espacio de trabajo explícito se resuelven a `<state-dir>/workspace-<agentId>`, no al espacio de trabajo compartido predeterminado.

Anula en `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

Anulación por agente: `agents.list[].workspace`.

`openclaw onboard`, `openclaw configure` u `openclaw setup` crean el espacio de trabajo y siembran los archivos de arranque si faltan.

<Note>
Las copias de siembra de sandbox solo aceptan archivos regulares dentro del espacio de trabajo; se ignoran los alias de symlink/hardlink que resuelven fuera del espacio de trabajo de origen.
</Note>

Si ya administras tú mismo los archivos del espacio de trabajo, deshabilita la creación de archivos de arranque:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Carpetas adicionales del espacio de trabajo

Las instalaciones antiguas pueden haber creado `~/openclaw`. Mantener varios directorios de espacio de trabajo puede causar derivaciones confusas de autenticación o estado, ya que solo un espacio de trabajo está activo a la vez.

<Note>
**Recomendación:** mantén un único espacio de trabajo activo. Si ya no usas las carpetas adicionales, archívalas o muévelas a la Papelera (por ejemplo `trash ~/openclaw`). Si mantienes varios espacios de trabajo intencionalmente, asegúrate de que `agents.defaults.workspace` (o la clave `workspace` por agente) apunte al activo.
</Note>

## Mapa de archivos del espacio de trabajo

Archivos estándar que OpenClaw espera dentro del espacio de trabajo:

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
    Notas sobre tus herramientas locales y convenciones. No controla la disponibilidad de herramientas; solo es orientación.
  </Accordion>
  <Accordion title="HEARTBEAT.md - heartbeat checklist">
    Lista de verificación pequeña opcional para ejecuciones de Heartbeat. Mantenla breve para evitar consumo de tokens.
  </Accordion>
  <Accordion title="BOOT.md - startup checklist">
    Lista de verificación de inicio opcional que se ejecuta automáticamente al reiniciar el Gateway (cuando los [hooks internos](/es/automation/hooks) están habilitados). Mantenla breve; usa la herramienta de mensajes para envíos salientes.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - first-run ritual">
    Ritual único de primera ejecución. Solo se crea para un espacio de trabajo completamente nuevo. Elimínalo después de completar el ritual.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - daily memory log">
    Registro diario de memoria (un archivo por día). Se recomienda leer hoy + ayer al iniciar la sesión.
  </Accordion>
  <Accordion title="MEMORY.md - curated long-term memory (optional)">
    Memoria a largo plazo curada: hechos duraderos, preferencias, decisiones y resúmenes breves. Mantén registros detallados en `memory/YYYY-MM-DD.md` para que las herramientas de memoria puedan recuperarlos bajo demanda sin inyectarlos en cada prompt. Carga `MEMORY.md` solo en la sesión principal y privada (no en contextos compartidos/de grupo). Consulta [Memoria](/es/concepts/memory) para ver el flujo de trabajo y el vaciado automático de memoria.
  </Accordion>
  <Accordion title="skills/ - workspace skills (optional)">
    Skills específicas del espacio de trabajo. Ubicación de Skills de mayor precedencia para ese espacio de trabajo, por delante de las Skills de agente del proyecto, Skills personales de agente, Skills administradas, Skills incluidas y `skills.load.extraDirs` cuando los nombres colisionan.
  </Accordion>
  <Accordion title="canvas/ - Canvas UI files (optional)">
    Archivos de interfaz de Canvas para pantallas de nodos (por ejemplo `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Si falta un archivo de arranque, OpenClaw inyecta un marcador de "archivo faltante" en la sesión y continúa. Los archivos de arranque grandes se truncan al inyectarse; ajusta los límites con `agents.defaults.bootstrapMaxChars` (predeterminado: `20000`) y `agents.defaults.bootstrapTotalMaxChars` (predeterminado: `60000`). `openclaw setup` puede recrear valores predeterminados faltantes sin sobrescribir archivos existentes.
</Note>

## Qué NO está en el espacio de trabajo

Estos viven bajo `~/.openclaw/` y NO deben confirmarse en el repo del espacio de trabajo:

- `~/.openclaw/openclaw.json` (configuración)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (perfiles de autenticación de modelo: OAuth + claves de API)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (cuenta, configuración, Skills, plugins y estado nativo de hilos del runtime Codex por agente)
- `~/.openclaw/credentials/` (estado de canales/proveedores más datos heredados de importación OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (transcripciones de sesión + metadatos)
- `~/.openclaw/skills/` (Skills administradas)

Si necesitas migrar sesiones o configuración, cópialas por separado y mantenlas fuera del control de versiones.

## Copia de seguridad con Git (recomendada, privada)

Trata el espacio de trabajo como memoria privada. Ponlo en un repo git **privado** para que tenga copia de seguridad y sea recuperable.

Ejecuta estos pasos en la máquina donde se ejecuta el Gateway (ahí es donde vive el espacio de trabajo).

<Steps>
  <Step title="Initialize the repo">
    Si git está instalado, los espacios de trabajo completamente nuevos se inicializan automáticamente. Si este espacio de trabajo aún no es un repo, ejecuta:

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
        4. Agrega el remoto y haz push:

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
        4. Agrega el remoto y haz push:

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
Incluso en un repo privado, evita almacenar secretos en el espacio de trabajo:

- Claves de API, tokens OAuth, contraseñas o credenciales privadas.
- Cualquier cosa bajo `~/.openclaw/`.
- Volcados sin procesar de chats o adjuntos sensibles.

Si debes almacenar referencias sensibles, usa marcadores de posición y mantén el secreto real en otro lugar (gestor de contraseñas, variables de entorno o `~/.openclaw/`).
</Warning>

Plantilla inicial sugerida de `.gitignore`:

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
    Clona el repo en la ruta deseada (predeterminada `~/.openclaw/workspace`).
  </Step>
  <Step title="Update config">
    Establece `agents.defaults.workspace` en esa ruta en `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Seed missing files">
    Ejecuta `openclaw setup --workspace <path>` para sembrar cualquier archivo faltante.
  </Step>
  <Step title="Copy sessions (optional)">
    Si necesitas sesiones, copia `~/.openclaw/agents/<agentId>/sessions/` desde la máquina antigua por separado.
  </Step>
</Steps>

## Notas avanzadas

- El enrutamiento multiagente puede usar diferentes espacios de trabajo por agente mediante `agents.list[].workspace`. Consulta [Enrutamiento de canales](/es/channels/channel-routing) para ver la configuración de enrutamiento.
- Si `agents.defaults.sandbox` está habilitado, las sesiones no principales pueden usar espacios de trabajo de sandbox por sesión bajo `agents.defaults.sandbox.workspaceRoot`.

## Relacionado

- [Heartbeat](/es/gateway/heartbeat) - archivo de espacio de trabajo HEARTBEAT.md
- [Sandboxing](/es/gateway/sandboxing) - acceso al espacio de trabajo en entornos con sandbox
- [Sesión](/es/concepts/session) - rutas de almacenamiento de sesiones
- [Órdenes permanentes](/es/automation/standing-orders) - instrucciones persistentes en archivos del espacio de trabajo

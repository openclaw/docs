---
read_when:
    - Necesitas explicar el espacio de trabajo del agente o la estructura de sus archivos
    - Quieres hacer una copia de seguridad o migrar un espacio de trabajo del agente
sidebarTitle: Agent workspace
summary: 'Espacio de trabajo del agente: ubicación, estructura y estrategia de copia de seguridad'
title: Espacio de trabajo del agente
x-i18n:
    generated_at: "2026-04-26T11:26:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35d59d1f0dec05db30f9166a43bfa519d7299b08d093bbeb905d8f83e5cd022a
    source_path: concepts/agent-workspace.md
    workflow: 15
---

El espacio de trabajo es el hogar del agente. Es el único directorio de trabajo usado para las herramientas de archivos y para el contexto del espacio de trabajo. Mantenlo privado y trátalo como memoria.

Esto es independiente de `~/.openclaw/`, que almacena configuración, credenciales y sesiones.

<Warning>
El espacio de trabajo es el **cwd predeterminado**, no un sandbox rígido. Las herramientas resuelven rutas relativas respecto del espacio de trabajo, pero las rutas absolutas aún pueden llegar a otras partes del host a menos que el sandboxing esté habilitado. Si necesitas aislamiento, usa [`agents.defaults.sandbox`](/es/gateway/sandboxing) (y/o configuración de sandbox por agente).

Cuando el sandboxing está habilitado y `workspaceAccess` no es `"rw"`, las herramientas operan dentro de un espacio de trabajo en sandbox bajo `~/.openclaw/sandboxes`, no en tu espacio de trabajo del host.
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

`openclaw onboard`, `openclaw configure` o `openclaw setup` crearán el espacio de trabajo y sembrarán los archivos bootstrap si faltan.

<Note>
La copia de semilla del sandbox solo acepta archivos normales dentro del espacio de trabajo; los alias symlink/hardlink que se resuelven fuera del espacio de trabajo de origen se ignoran.
</Note>

Si ya gestionas tú mismo los archivos del espacio de trabajo, puedes deshabilitar la creación de archivos bootstrap:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Carpetas adicionales del espacio de trabajo

Las instalaciones antiguas pueden haber creado `~/openclaw`. Mantener varios directorios de espacio de trabajo puede causar una deriva confusa de autenticación o estado, porque solo un espacio de trabajo está activo a la vez.

<Note>
**Recomendación:** mantén un único espacio de trabajo activo. Si ya no usas las carpetas adicionales, archívalas o muévelas a la Papelera (por ejemplo `trash ~/openclaw`). Si mantienes varios espacios de trabajo intencionalmente, asegúrate de que `agents.defaults.workspace` apunte al activo.

`openclaw doctor` advierte cuando detecta directorios adicionales de espacio de trabajo.
</Note>

## Mapa de archivos del espacio de trabajo

Estos son los archivos estándar que OpenClaw espera dentro del espacio de trabajo:

<AccordionGroup>
  <Accordion title="AGENTS.md — instrucciones operativas">
    Instrucciones operativas para el agente y cómo debe usar la memoria. Se carga al inicio de cada sesión. Buen lugar para reglas, prioridades y detalles sobre “cómo comportarse”.
  </Accordion>
  <Accordion title="SOUL.md — personalidad y tono">
    Personalidad, tono y límites. Se carga en cada sesión. Guía: [Guía de personalidad de SOUL.md](/es/concepts/soul).
  </Accordion>
  <Accordion title="USER.md — quién es el usuario">
    Quién es el usuario y cómo dirigirse a él. Se carga en cada sesión.
  </Accordion>
  <Accordion title="IDENTITY.md — nombre, vibra y emoji">
    El nombre, la vibra y el emoji del agente. Se crea/actualiza durante el ritual bootstrap.
  </Accordion>
  <Accordion title="TOOLS.md — convenciones de herramientas locales">
    Notas sobre tus herramientas y convenciones locales. No controla la disponibilidad de herramientas; es solo orientación.
  </Accordion>
  <Accordion title="HEARTBEAT.md — lista de verificación de Heartbeat">
    Pequeña lista de verificación opcional para ejecuciones de Heartbeat. Mantenla corta para evitar gasto de tokens.
  </Accordion>
  <Accordion title="BOOT.md — lista de verificación de inicio">
    Lista de verificación de inicio opcional que se ejecuta automáticamente al reiniciar el Gateway (cuando [hooks internos](/es/automation/hooks) están habilitados). Mantenla corta; usa la herramienta de mensajes para envíos salientes.
  </Accordion>
  <Accordion title="BOOTSTRAP.md — ritual de primera ejecución">
    Ritual único de primera ejecución. Solo se crea para un espacio de trabajo completamente nuevo. Elimínalo después de completar el ritual.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — registro diario de memoria">
    Registro diario de memoria (un archivo por día). Se recomienda leer el de hoy + el de ayer al inicio de la sesión.
  </Accordion>
  <Accordion title="MEMORY.md — memoria curada a largo plazo (opcional)">
    Memoria curada a largo plazo. Solo cargar en la sesión principal y privada (no en contextos compartidos/de grupo). Consulta [Memoria](/es/concepts/memory) para el flujo de trabajo y el volcado automático de memoria.
  </Accordion>
  <Accordion title="skills/ — Skills del espacio de trabajo (opcional)">
    Skills específicos del espacio de trabajo. Es la ubicación de Skills de mayor precedencia para ese espacio de trabajo. Sobrescribe Skills del agente del proyecto, Skills del agente personal, Skills gestionados, Skills incluidos y `skills.load.extraDirs` cuando los nombres coinciden.
  </Accordion>
  <Accordion title="canvas/ — archivos de la IU de Canvas (opcional)">
    Archivos de la IU de Canvas para pantallas Node (por ejemplo `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Si falta algún archivo bootstrap, OpenClaw inyecta un marcador de “archivo faltante” en la sesión y continúa. Los archivos bootstrap grandes se truncan al inyectarse; ajusta los límites con `agents.defaults.bootstrapMaxChars` (predeterminado: 12000) y `agents.defaults.bootstrapTotalMaxChars` (predeterminado: 60000). `openclaw setup` puede recrear valores predeterminados faltantes sin sobrescribir archivos existentes.
</Note>

## Qué NO está en el espacio de trabajo

Esto vive en `~/.openclaw/` y NO debe confirmarse en el repositorio del espacio de trabajo:

- `~/.openclaw/openclaw.json` (configuración)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (perfiles de autenticación del modelo: OAuth + claves API)
- `~/.openclaw/credentials/` (estado de canal/proveedor más datos heredados de importación OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (transcripciones de sesión + metadatos)
- `~/.openclaw/skills/` (Skills gestionados)

Si necesitas migrar sesiones o configuración, cópialas por separado y mantenlas fuera del control de versiones.

## Copia de seguridad con Git (recomendado, privado)

Trata el espacio de trabajo como memoria privada. Ponlo en un repositorio git **privado** para que tenga copia de seguridad y pueda recuperarse.

Ejecuta estos pasos en la máquina donde se ejecuta el Gateway (ahí es donde vive el espacio de trabajo).

<Steps>
  <Step title="Inicializar el repositorio">
    Si git está instalado, los espacios de trabajo completamente nuevos se inicializan automáticamente. Si este espacio de trabajo aún no es un repositorio, ejecuta:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Agregar un remoto privado">
    <Tabs>
      <Tab title="GitHub web UI">
        1. Crea un nuevo repositorio **privado** en GitHub.
        2. No lo inicialices con un README (evita conflictos de fusión).
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
        2. No lo inicialices con un README (evita conflictos de fusión).
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
  <Step title="Actualizaciones continuas">
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

- Claves API, tokens OAuth, contraseñas o credenciales privadas.
- Cualquier cosa bajo `~/.openclaw/`.
- Volcados sin procesar de chats o adjuntos sensibles.

Si debes almacenar referencias sensibles, usa marcadores de posición y guarda el secreto real en otro lugar (gestor de contraseñas, variables de entorno o `~/.openclaw/`).
</Warning>

Sugerencia de `.gitignore` inicial:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Mover el espacio de trabajo a una máquina nueva

<Steps>
  <Step title="Clonar el repositorio">
    Clona el repositorio en la ruta deseada (predeterminada `~/.openclaw/workspace`).
  </Step>
  <Step title="Actualizar configuración">
    Establece `agents.defaults.workspace` en esa ruta dentro de `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Sembrar archivos faltantes">
    Ejecuta `openclaw setup --workspace <path>` para sembrar cualquier archivo faltante.
  </Step>
  <Step title="Copiar sesiones (opcional)">
    Si necesitas sesiones, copia `~/.openclaw/agents/<agentId>/sessions/` desde la máquina anterior por separado.
  </Step>
</Steps>

## Notas avanzadas

- El enrutamiento multiagente puede usar distintos espacios de trabajo por agente. Consulta [Enrutamiento de canales](/es/channels/channel-routing) para la configuración de enrutamiento.
- Si `agents.defaults.sandbox` está habilitado, las sesiones no principales pueden usar espacios de trabajo en sandbox por sesión bajo `agents.defaults.sandbox.workspaceRoot`.

## Relacionado

- [Heartbeat](/es/gateway/heartbeat) — archivo de espacio de trabajo HEARTBEAT.md
- [Sandboxing](/es/gateway/sandboxing) — acceso al espacio de trabajo en entornos con sandbox
- [Sesión](/es/concepts/session) — rutas de almacenamiento de sesiones
- [Órdenes permanentes](/es/automation/standing-orders) — instrucciones persistentes en archivos del espacio de trabajo

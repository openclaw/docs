---
read_when:
    - Necesitas explicar el espacio de trabajo del agente o su estructura de archivos
    - Desea hacer una copia de seguridad de un espacio de trabajo de agente o migrarlo
sidebarTitle: Agent workspace
summary: 'Espacio de trabajo del agente: ubicación, estructura y estrategia de copia de seguridad'
title: Espacio de trabajo del agente
x-i18n:
    generated_at: "2026-05-11T20:29:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: adb2ae19c702589010cc67907940ae21feb669cca262e36790a3059aa7d7744c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

El espacio de trabajo es el hogar del agente. Es el único directorio de trabajo usado para las herramientas de archivos y para el contexto del espacio de trabajo. Mantenlo privado y trátalo como memoria.

Esto está separado de `~/.openclaw/`, que almacena configuración, credenciales y sesiones.

<Warning>
El espacio de trabajo es el **cwd predeterminado**, no un sandbox rígido. Las herramientas resuelven las rutas relativas con respecto al espacio de trabajo, pero las rutas absolutas aún pueden llegar a otros lugares del host salvo que el sandboxing esté habilitado. Si necesitas aislamiento, usa [`agents.defaults.sandbox`](/es/gateway/sandboxing) (y/o configuración de sandbox por agente).

Cuando el sandboxing está habilitado y `workspaceAccess` no es `"rw"`, las herramientas operan dentro de un espacio de trabajo de sandbox en `~/.openclaw/sandboxes`, no en tu espacio de trabajo del host.
</Warning>

## Ubicación predeterminada

- Predeterminado: `~/.openclaw/workspace`
- Si `OPENCLAW_PROFILE` está definido y no es `"default"`, el valor predeterminado pasa a ser `~/.openclaw/workspace-<profile>`.
- Sobrescríbelo en `~/.openclaw/openclaw.json`:

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
Las copias semilla de sandbox solo aceptan archivos normales dentro del espacio de trabajo; se ignoran los alias de symlink/hardlink que resuelven fuera del espacio de trabajo de origen.
</Note>

Si ya gestionas tú mismo los archivos del espacio de trabajo, puedes deshabilitar la creación de archivos de arranque:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Carpetas adicionales del espacio de trabajo

Las instalaciones antiguas pueden haber creado `~/openclaw`. Mantener varios directorios de espacio de trabajo puede causar deriva confusa de autenticación o estado, porque solo un espacio de trabajo está activo a la vez.

<Note>
**Recomendación:** mantén un único espacio de trabajo activo. Si ya no usas las carpetas adicionales, archívalas o muévelas a la Papelera (por ejemplo, `trash ~/openclaw`). Si mantienes varios espacios de trabajo intencionalmente, asegúrate de que `agents.defaults.workspace` apunte al activo.

`openclaw doctor` advierte cuando detecta directorios adicionales de espacio de trabajo.
</Note>

## Mapa de archivos del espacio de trabajo

Estos son los archivos estándar que OpenClaw espera dentro del espacio de trabajo:

<AccordionGroup>
  <Accordion title="AGENTS.md - instrucciones operativas">
    Instrucciones operativas para el agente y cómo debe usar la memoria. Se cargan al inicio de cada sesión. Buen lugar para reglas, prioridades y detalles de "cómo comportarse".
  </Accordion>
  <Accordion title="SOUL.md - personalidad y tono">
    Personalidad, tono y límites. Se carga en cada sesión. Guía: [guía de personalidad de SOUL.md](/es/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - quién es el usuario">
    Quién es el usuario y cómo dirigirse a él. Se carga en cada sesión.
  </Accordion>
  <Accordion title="IDENTITY.md - nombre, estilo, emoji">
    El nombre, el estilo y el emoji del agente. Se crea/actualiza durante el ritual de arranque.
  </Accordion>
  <Accordion title="TOOLS.md - convenciones de herramientas locales">
    Notas sobre tus herramientas locales y convenciones. No controla la disponibilidad de herramientas; es solo orientación.
  </Accordion>
  <Accordion title="HEARTBEAT.md - lista de comprobación de heartbeat">
    Lista de comprobación diminuta opcional para ejecuciones de heartbeat. Mantenla corta para evitar consumo de tokens.
  </Accordion>
  <Accordion title="BOOT.md - lista de comprobación de inicio">
    Lista de comprobación de inicio opcional que se ejecuta automáticamente al reiniciar el Gateway (cuando los [hooks internos](/es/automation/hooks) están habilitados). Mantenla corta; usa la herramienta de mensajes para envíos salientes.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - ritual de primera ejecución">
    Ritual único de primera ejecución. Solo se crea para un espacio de trabajo totalmente nuevo. Elimínalo después de completar el ritual.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - registro diario de memoria">
    Registro diario de memoria (un archivo por día). Se recomienda leer hoy + ayer al iniciar la sesión.
  </Accordion>
  <Accordion title="MEMORY.md - memoria a largo plazo curada (opcional)">
    Memoria a largo plazo curada: hechos duraderos, preferencias, decisiones y resúmenes breves. Mantén los registros detallados en `memory/YYYY-MM-DD.md` para que las herramientas de memoria puedan recuperarlos bajo demanda sin inyectarlos en cada prompt. Carga `MEMORY.md` solo en la sesión principal y privada (no en contextos compartidos/grupales). Consulta [Memoria](/es/concepts/memory) para ver el flujo de trabajo y el vaciado automático de memoria.
  </Accordion>
  <Accordion title="skills/ - skills del espacio de trabajo (opcional)">
    Skills específicas del espacio de trabajo. Ubicación de Skills de mayor precedencia para ese espacio de trabajo. Sobrescribe las Skills de agente de proyecto, Skills de agente personales, Skills gestionadas, Skills incluidas y `skills.load.extraDirs` cuando los nombres colisionan.
  </Accordion>
  <Accordion title="canvas/ - archivos de Canvas UI (opcional)">
    Archivos de Canvas UI para visualizaciones de nodos (por ejemplo, `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Si falta algún archivo de arranque, OpenClaw inyecta un marcador de "archivo faltante" en la sesión y continúa. Los archivos de arranque grandes se truncan al inyectarse; ajusta los límites con `agents.defaults.bootstrapMaxChars` (predeterminado: 12000) y `agents.defaults.bootstrapTotalMaxChars` (predeterminado: 60000). `openclaw setup` puede recrear los valores predeterminados faltantes sin sobrescribir archivos existentes.
</Note>

## Qué NO está en el espacio de trabajo

Estos viven bajo `~/.openclaw/` y NO deben confirmarse en el repo del espacio de trabajo:

- `~/.openclaw/openclaw.json` (configuración)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (perfiles de autenticación de modelos: OAuth + claves de API)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (cuenta de runtime de Codex por agente, configuración, Skills, plugins y estado nativo de hilos)
- `~/.openclaw/credentials/` (estado de canal/proveedor más datos de importación OAuth heredados)
- `~/.openclaw/agents/<agentId>/sessions/` (transcripciones de sesiones + metadatos)
- `~/.openclaw/skills/` (Skills gestionadas)

Si necesitas migrar sesiones o configuración, cópialas por separado y mantenlas fuera del control de versiones.

## Copia de seguridad con git (recomendada, privada)

Trata el espacio de trabajo como memoria privada. Colócalo en un repo git **privado** para que tenga copia de seguridad y sea recuperable.

Ejecuta estos pasos en la máquina donde se ejecuta el Gateway (ahí es donde vive el espacio de trabajo).

<Steps>
  <Step title="Inicializar el repo">
    Si git está instalado, los espacios de trabajo totalmente nuevos se inicializan automáticamente. Si este espacio de trabajo aún no es un repo, ejecuta:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Añadir un remoto privado">
    <Tabs>
      <Tab title="Interfaz web de GitHub">
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
      <Tab title="Interfaz web de GitLab">
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
Incluso en un repo privado, evita almacenar secretos en el espacio de trabajo:

- Claves de API, tokens OAuth, contraseñas o credenciales privadas.
- Cualquier cosa bajo `~/.openclaw/`.
- Volcados sin procesar de chats o adjuntos sensibles.

Si debes almacenar referencias sensibles, usa placeholders y guarda el secreto real en otro lugar (gestor de contraseñas, variables de entorno o `~/.openclaw/`).
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
  <Step title="Clonar el repo">
    Clona el repo en la ruta deseada (predeterminada `~/.openclaw/workspace`).
  </Step>
  <Step title="Actualizar la configuración">
    Establece `agents.defaults.workspace` en esa ruta en `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Sembrar archivos faltantes">
    Ejecuta `openclaw setup --workspace <path>` para sembrar cualquier archivo faltante.
  </Step>
  <Step title="Copiar sesiones (opcional)">
    Si necesitas sesiones, copia `~/.openclaw/agents/<agentId>/sessions/` desde la máquina antigua por separado.
  </Step>
</Steps>

## Notas avanzadas

- El enrutamiento multiagente puede usar espacios de trabajo diferentes por agente. Consulta [enrutamiento de canales](/es/channels/channel-routing) para la configuración de enrutamiento.
- Si `agents.defaults.sandbox` está habilitado, las sesiones no principales pueden usar espacios de trabajo de sandbox por sesión bajo `agents.defaults.sandbox.workspaceRoot`.

## Relacionado

- [Heartbeat](/es/gateway/heartbeat) - archivo de espacio de trabajo HEARTBEAT.md
- [Sandboxing](/es/gateway/sandboxing) - acceso al espacio de trabajo en entornos con sandboxing
- [Sesión](/es/concepts/session) - rutas de almacenamiento de sesiones
- [Órdenes permanentes](/es/automation/standing-orders) - instrucciones persistentes en archivos del espacio de trabajo

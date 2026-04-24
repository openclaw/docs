---
read_when:
    - Necesitas explicar el espacio de trabajo del agente o su estructura de archivos
    - Quieres hacer una copia de seguridad o migrar un espacio de trabajo del agente
summary: 'Espacio de trabajo del agente: ubicación, estructura y estrategia de copia de seguridad'
title: Espacio de trabajo del agente
x-i18n:
    generated_at: "2026-04-24T05:24:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: d6441991b5f9f71b13b2423d3c36b688a2d7d96386381e610a525aaccd55c9bf
    source_path: concepts/agent-workspace.md
    workflow: 15
---

El espacio de trabajo es el hogar del agente. Es el único directorio de trabajo usado para
las herramientas de archivos y para el contexto del espacio de trabajo. Mantenlo privado y trátalo como memoria.

Esto es independiente de `~/.openclaw/`, que almacena configuración, credenciales y
sesiones.

**Importante:** el espacio de trabajo es el **cwd predeterminado**, no un sandbox rígido. Las herramientas
resuelven rutas relativas respecto al espacio de trabajo, pero las rutas absolutas aún pueden llegar
a otras partes del host a menos que el sandboxing esté habilitado. Si necesitas aislamiento, usa
[`agents.defaults.sandbox`](/es/gateway/sandboxing) (y/o configuración de sandbox por agente).
Cuando el sandboxing está habilitado y `workspaceAccess` no es `"rw"`, las herramientas operan
dentro de un espacio de trabajo de sandbox en `~/.openclaw/sandboxes`, no en tu espacio de trabajo del host.

## Ubicación predeterminada

- Predeterminado: `~/.openclaw/workspace`
- Si `OPENCLAW_PROFILE` está configurado y no es `"default"`, el valor predeterminado pasa a ser
  `~/.openclaw/workspace-<profile>`.
- Anúlalo en `~/.openclaw/openclaw.json`:

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`, `openclaw configure` u `openclaw setup` crearán el
espacio de trabajo y sembrarán los archivos de bootstrap si faltan.
Las copias semilla de sandbox solo aceptan archivos regulares dentro del espacio de trabajo; se ignoran
los alias symlink/hardlink que se resuelven fuera del espacio de trabajo de origen.

Si ya gestionas los archivos del espacio de trabajo por tu cuenta, puedes desactivar la
creación de archivos de bootstrap:

```json5
{ agent: { skipBootstrap: true } }
```

## Carpetas adicionales del espacio de trabajo

Las instalaciones antiguas pueden haber creado `~/openclaw`. Mantener varios directorios
de espacio de trabajo puede causar desviaciones confusas de autenticación o estado, porque solo
un espacio de trabajo está activo a la vez.

**Recomendación:** mantén un único espacio de trabajo activo. Si ya no usas las
carpetas adicionales, archívalas o muévelas a la Papelera (por ejemplo `trash ~/openclaw`).
Si mantienes varios espacios de trabajo de forma intencional, asegúrate de que
`agents.defaults.workspace` apunte al activo.

`openclaw doctor` advierte cuando detecta directorios adicionales de espacio de trabajo.

## Mapa de archivos del espacio de trabajo (qué significa cada archivo)

Estos son los archivos estándar que OpenClaw espera dentro del espacio de trabajo:

- `AGENTS.md`
  - Instrucciones operativas para el agente y cómo debe usar la memoria.
  - Se carga al inicio de cada sesión.
  - Buen lugar para reglas, prioridades y detalles de "cómo comportarse".

- `SOUL.md`
  - Persona, tono y límites.
  - Se carga en cada sesión.
  - Guía: [SOUL.md Personality Guide](/es/concepts/soul)

- `USER.md`
  - Quién es el usuario y cómo dirigirse a él.
  - Se carga en cada sesión.

- `IDENTITY.md`
  - El nombre, la vibra y el emoji del agente.
  - Se crea/actualiza durante el ritual de bootstrap.

- `TOOLS.md`
  - Notas sobre tus herramientas locales y convenciones.
  - No controla la disponibilidad de herramientas; es solo una guía.

- `HEARTBEAT.md`
  - Lista de verificación mínima opcional para ejecuciones de Heartbeat.
  - Mantenla corta para evitar gasto de tokens.

- `BOOT.md`
  - Lista de verificación opcional de inicio que se ejecuta automáticamente al reiniciar gateway (cuando [hooks internos](/es/automation/hooks) están habilitados).
  - Mantenla corta; usa la herramienta message para envíos salientes.

- `BOOTSTRAP.md`
  - Ritual único de primera ejecución.
  - Solo se crea para un espacio de trabajo completamente nuevo.
  - Elimínalo después de completar el ritual.

- `memory/YYYY-MM-DD.md`
  - Registro diario de memoria (un archivo por día).
  - Se recomienda leer hoy + ayer al inicio de la sesión.

- `MEMORY.md` (opcional)
  - Memoria curada a largo plazo.
  - Cárgala solo en la sesión principal y privada (no en contextos compartidos/de grupo).

Consulta [Memory](/es/concepts/memory) para el flujo de trabajo y el volcado automático de memoria.

- `skills/` (opcional)
  - Skills específicas del espacio de trabajo.
  - Ubicación de Skills de mayor precedencia para ese espacio de trabajo.
  - Anula Skills de agentes del proyecto, Skills de agentes personales, Skills gestionadas, Skills incluidas y `skills.load.extraDirs` cuando los nombres colisionan.

- `canvas/` (opcional)
  - Archivos de UI de canvas para visualizaciones de Node (por ejemplo `canvas/index.html`).

Si falta algún archivo de bootstrap, OpenClaw inyecta un marcador de "archivo faltante" en
la sesión y continúa. Los archivos grandes de bootstrap se truncan al inyectarse;
ajusta los límites con `agents.defaults.bootstrapMaxChars` (predeterminado: 12000) y
`agents.defaults.bootstrapTotalMaxChars` (predeterminado: 60000).
`openclaw setup` puede recrear los valores predeterminados faltantes sin sobrescribir
los archivos existentes.

## Qué NO está en el espacio de trabajo

Estos elementos viven en `~/.openclaw/` y NO deben registrarse en el repositorio del espacio de trabajo:

- `~/.openclaw/openclaw.json` (configuración)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (perfiles de autenticación del modelo: OAuth + claves API)
- `~/.openclaw/credentials/` (estado de canal/proveedor más datos heredados de importación OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (transcripciones de sesiones + metadatos)
- `~/.openclaw/skills/` (Skills gestionadas)

Si necesitas migrar sesiones o configuración, cópialas por separado y mantenlas
fuera del control de versiones.

## Copia de seguridad con git (recomendado, privado)

Trata el espacio de trabajo como memoria privada. Ponlo en un repositorio git **privado** para que
tenga copia de seguridad y se pueda recuperar.

Ejecuta estos pasos en la máquina donde se ejecuta Gateway (ahí es donde vive el
espacio de trabajo).

### 1) Inicializar el repositorio

Si git está instalado, los espacios de trabajo completamente nuevos se inicializan automáticamente. Si este
espacio de trabajo no es ya un repositorio, ejecuta:

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) Agregar un remoto privado (opciones fáciles para principiantes)

Opción A: UI web de GitHub

1. Crea un nuevo repositorio **privado** en GitHub.
2. No lo inicialices con un README (evita conflictos de merge).
3. Copia la URL remota HTTPS.
4. Agrega el remoto y haz push:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

Opción B: GitHub CLI (`gh`)

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

Opción C: UI web de GitLab

1. Crea un nuevo repositorio **privado** en GitLab.
2. No lo inicialices con un README (evita conflictos de merge).
3. Copia la URL remota HTTPS.
4. Agrega el remoto y haz push:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3) Actualizaciones continuas

```bash
git status
git add .
git commit -m "Update memory"
git push
```

## No registres secretos

Incluso en un repositorio privado, evita almacenar secretos en el espacio de trabajo:

- Claves API, tokens OAuth, contraseñas o credenciales privadas.
- Cualquier cosa dentro de `~/.openclaw/`.
- Volcados sin procesar de chats o adjuntos sensibles.

Si debes almacenar referencias sensibles, usa marcadores de posición y conserva el
secreto real en otro lugar (gestor de contraseñas, variables de entorno o `~/.openclaw/`).

Sugerencia de `.gitignore` inicial:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Mover el espacio de trabajo a una máquina nueva

1. Clona el repositorio en la ruta deseada (predeterminado `~/.openclaw/workspace`).
2. Establece `agents.defaults.workspace` en esa ruta en `~/.openclaw/openclaw.json`.
3. Ejecuta `openclaw setup --workspace <path>` para sembrar cualquier archivo faltante.
4. Si necesitas sesiones, copia `~/.openclaw/agents/<agentId>/sessions/` desde la
   máquina antigua por separado.

## Notas avanzadas

- El enrutamiento de múltiples agentes puede usar distintos espacios de trabajo por agente. Consulta
  [Enrutamiento de canales](/es/channels/channel-routing) para la configuración de enrutamiento.
- Si `agents.defaults.sandbox` está habilitado, las sesiones no principales pueden usar espacios de trabajo
  de sandbox por sesión bajo `agents.defaults.sandbox.workspaceRoot`.

## Relacionado

- [Standing Orders](/es/automation/standing-orders) — instrucciones persistentes en archivos del espacio de trabajo
- [Heartbeat](/es/gateway/heartbeat) — archivo `HEARTBEAT.md` del espacio de trabajo
- [Session](/es/concepts/session) — rutas de almacenamiento de sesiones
- [Sandboxing](/es/gateway/sandboxing) — acceso al espacio de trabajo en entornos con sandbox

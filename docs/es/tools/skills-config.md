---
read_when:
    - Configurar el comportamiento de carga, instalación o control de acceso de Skills
    - Configurar la visibilidad de Skills por agente
    - Ajustar los límites de Skills Workshop o la política de aprobación
sidebarTitle: Skills config
summary: Referencia completa del esquema de configuración `skills.*`, las listas de permitidos de agentes, la configuración de talleres y el manejo de variables de entorno de sandbox.
title: Configuración de Skills
x-i18n:
    generated_at: "2026-07-01T05:28:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37251cd12162c3083b8b9e1a84c462233eb44656a84ca915705859a352c9557b
    source_path: tools/skills-config.md
    workflow: 16
---

La mayor parte de la configuración de habilidades se encuentra bajo `skills` en
`~/.openclaw/openclaw.json`. La visibilidad específica del agente se encuentra bajo
`agents.defaults.skills` y `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm",
      allowUploadedArchives: false,
    },
    workshop: {
      autonomous: { enabled: false },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<Note>
  Para la generación de imágenes integrada, usa `agents.defaults.imageGenerationModel`
  junto con la herramienta principal `image_generate` en lugar de `skills.entries`.
  Las entradas de habilidades son solo para flujos de trabajo de habilidades
  personalizados o de terceros.
</Note>

## Carga (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Directorios de habilidades adicionales para escanear, con la precedencia más
  baja (después de las habilidades incluidas y de plugins). Las rutas se
  expanden con soporte para `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Directorios de destino reales y confiables en los que pueden resolverse las
  carpetas de habilidades con enlaces simbólicos, incluso cuando el enlace
  simbólico se encuentra fuera de la raíz configurada. Usa esto para diseños
  intencionales de repositorios hermanos como
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Mantén esta lista
  acotada: no apuntes a raíces amplias como `~` o `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Vigila las carpetas de habilidades y actualiza la instantánea de Skills cuando
  cambian los archivos `SKILL.md`. Cubre archivos anidados bajo raíces de
  habilidades agrupadas.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Ventana de antirrebote para eventos del observador de habilidades en milisegundos.
</ParamField>

## Instalación (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Prefiere instaladores de Homebrew cuando `brew` está disponible.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Preferencia de gestor de paquetes de Node para instalaciones de habilidades.
  Esto solo afecta a las instalaciones de habilidades: el runtime del Gateway
  debería seguir usando Node (Bun no se recomienda para WhatsApp/Telegram). Usa
  `openclaw setup --node-manager` para npm, pnpm o bun; establece `"yarn"`
  manualmente para instalaciones de habilidades respaldadas por Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Permite que clientes confiables `operator.admin` del Gateway instalen archivos
  zip privados preparados mediante `skills.upload.*`. Las instalaciones normales
  de ClawHub no necesitan esta opción.
</ParamField>

## Política de instalación del operador (`security.installPolicy`)

Usa `security.installPolicy` cuando los operadores necesiten un comando local
confiable para aprobar o bloquear instalaciones de habilidades y plugins con
una política específica del host. La política se ejecuta después de que OpenClaw
ha preparado el material fuente y antes de que continúe la instalación o
actualización. Se aplica a habilidades de ClawHub, habilidades cargadas,
habilidades de Git/locales, instaladores de dependencias de habilidades y
fuentes de instalación/actualización de plugins.

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // Omit targets to cover every supported target.
      targets: ["skill", "plugin"],
      exec: {
        source: "exec",
        command: "/usr/local/bin/openclaw-install-policy",
        args: ["--json"],
        timeoutMs: 10000,
        noOutputTimeoutMs: 10000,
        maxOutputBytes: 1048576,
        passEnv: ["OPENCLAW_STATE_DIR", "PATH"],
        env: { POLICY_MODE: "strict" },
        trustedDirs: ["/usr/local/bin"],
      },
    },
  },
}
```

<ParamField path="security.installPolicy.enabled" type="boolean" default="false">
  Habilita una política de instalación propiedad del operador. Cuando se habilita
  sin un comando `exec` válido, las instalaciones fallan cerradas.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Filtro de destino opcional. Cuando se omite, la política se aplica a todos los
  destinos admitidos para que las instalaciones nuevas no fallen abiertas de
  forma inesperada.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Ruta absoluta al ejecutable de política confiable. OpenClaw lo ejecuta sin un
  shell y valida la ruta antes de usarlo.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Argumentos estáticos pasados después de `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Tiempo máximo de ejecución de reloj de pared para una decisión de política.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Tiempo máximo sin salida de stdout o stderr antes de que la política falle cerrada.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Máximo de bytes combinados de stdout y stderr aceptados del proceso de política.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Variables de entorno literales proporcionadas al proceso de política.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Nombres de variables de entorno copiados del proceso de OpenClaw al proceso de
  política. Solo se pasan las variables nombradas.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Lista de permitidos opcional de directorios que pueden contener el ejecutable
  de política.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Omite las comprobaciones de propiedad y permisos de la ruta del comando. Úsalo
  solo cuando la ruta esté protegida por otro mecanismo.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Permite que la ruta del comando configurado sea un enlace simbólico. El destino
  resuelto aún debe satisfacer las otras comprobaciones de ruta. Los argumentos
  de script de intérprete deben ser archivos regulares directos, no enlaces
  simbólicos.
</ParamField>

La política recibe un objeto JSON en stdin con `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
`source` estructurado opcional, `origin` estructurado y `request`. Debe escribir
un objeto JSON en stdout: `{ "protocolVersion": 1, "decision": "allow" }` o
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Salida con
código distinto de cero, tiempo de espera, JSON mal formado, campos faltantes o
versiones de protocolo no admitidas fallan cerradas.

OpenClaw no ejecuta la política de instalación durante el inicio normal del
Gateway. Las instalaciones y actualizaciones fallan cerradas cuando la política
está habilitada pero no disponible. `openclaw doctor` realiza validación
estática, y `openclaw doctor --deep` ejecuta una prueba sintética de instalación
contra el comando configurado.

Las actualizaciones masivas aplican la política por destino: una actualización
de habilidad o plugin bloqueada falla para ese destino sin deshabilitar la
política ni omitir destinos posteriores en el lote.

Ejemplo de stdin:

```json
{
  "protocolVersion": 1,
  "openclawVersion": "2026.6.1",
  "targetType": "skill",
  "targetName": "weather",
  "sourcePath": "/var/folders/.../openclaw-skill-clawhub/root",
  "sourcePathKind": "directory",
  "source": {
    "kind": "clawhub",
    "authority": "openclaw",
    "mutable": false,
    "network": true
  },
  "origin": {
    "type": "clawhub",
    "registry": "https://clawhub.openclaw.ai",
    "slug": "weather",
    "version": "1.0.0"
  },
  "request": {
    "kind": "skill-install",
    "mode": "install",
    "requestedSpecifier": "clawhub:weather@1.0.0"
  },
  "skill": {
    "installId": "clawhub"
  }
}
```

Comando de política mínimo:

```js
#!/usr/bin/env node

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  const request = JSON.parse(input);
  if (request.targetType === "plugin" && request.source?.kind === "local-path") {
    process.stdout.write(
      JSON.stringify({
        protocolVersion: 1,
        decision: "block",
        reason: "local plugin paths are not approved on this host",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## Lista de permitidos de habilidades incluidas

<ParamField path="skills.allowBundled" type="string[]">
  Lista de permitidos opcional solo para habilidades **incluidas**. Cuando se
  establece, solo las habilidades incluidas en la lista son elegibles. Las
  habilidades administradas, de nivel de agente y de espacio de trabajo no se
  ven afectadas.
</ParamField>

## Entradas por habilidad (`skills.entries`)

Las claves bajo `entries` coinciden con el `name` de la habilidad de forma
predeterminada. Si una habilidad define `metadata.openclaw.skillKey`, usa esa
clave en su lugar. Pon entre comillas los nombres con guion (JSON5 permite
claves entre comillas).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` deshabilita la habilidad incluso cuando está incluida o instalada. La
  habilidad incluida `coding-agent` es opcional: establécela en `true` y asegúrate
  de que `claude`, `codex`, `opencode` u otra CLI admitida esté instalada y
  autenticada.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Campo práctico para habilidades que declaran `metadata.openclaw.primaryEnv`.
  Admite una cadena de texto plano o una SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Variables de entorno inyectadas para la ejecución del agente. Solo se inyectan
  cuando la variable aún no está establecida en el proceso.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Bolsa opcional para campos de configuración personalizados por habilidad.
</ParamField>

## Listas de permitidos de agentes (`agents`)

Usa la configuración de agentes cuando quieras las mismas raíces de habilidades
de máquina/espacio de trabajo, pero un conjunto de habilidades visible distinto
por agente.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<ParamField path="agents.defaults.skills" type="string[]">
  Lista de permitidos de base compartida heredada por agentes que omiten
  `agents.list[].skills`. Omítela por completo para dejar las habilidades sin
  restricciones de forma predeterminada.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Conjunto final explícito de habilidades para ese agente. Las listas explícitas
  **reemplazan** los valores predeterminados heredados; no se fusionan. Establécelo
  en `[]` para no exponer habilidades a ese agente.
</ParamField>

<Warning>
  Las listas de permitidos de habilidades de agentes son un filtro de visibilidad
  y carga para el descubrimiento de habilidades de OpenClaw, prompts,
  descubrimiento de comandos slash, sincronización de sandbox e instantáneas de
  habilidades. No son un límite de autorización en tiempo de shell. Si un agente
  puede ejecutar `exec` del host, ese shell aún puede ejecutar clientes externos
  o leer archivos del host visibles para el usuario de ejecución, incluidos
  registros de clientes MCP como `~/.openclaw/skills/config/mcporter.json`. Para
  aislamiento MCP por agente, combina listas de permitidos de habilidades con
  aislamiento de sandbox/usuario del SO, deniega o restringe estrictamente
  `exec` del host, y prefiere credenciales por agente en el servidor MCP.
</Warning>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Cuando es `true`, los agentes pueden crear propuestas pendientes a partir de
  señales duraderas de conversación después de turnos correctos. La creación de
  habilidades iniciada por el usuario siempre pasa por Skill Workshop sin
  importar esta configuración.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` requiere aprobación del operador antes de aplicar, rechazar o poner
  en cuarentena acciones iniciadas por el agente. `auto` permite esas acciones
  sin aprobación.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Permite que la aplicación de Skill Workshop escriba a través de enlaces
  simbólicos de skills del espacio de trabajo cuyo destino real ya sea de
  confianza para `skills.load.allowSymlinkTargets`. Mantén esto desactivado a
  menos que las aplicaciones de propuestas generadas deban modificar esa raíz
  compartida de skills.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Número máximo de propuestas pendientes y en cuarentena conservadas por espacio
  de trabajo.
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Tamaño máximo del cuerpo de la propuesta en bytes. Las descripciones de
  propuestas tienen un límite estricto de 160 bytes porque aparecen en la salida
  de descubrimiento y listado.
</ParamField>

## Raíces de skills con enlaces simbólicos

De forma predeterminada, las raíces de skills del espacio de trabajo, del agente
del proyecto, de directorios adicionales y agrupadas son límites de contención.
Una carpeta de skill con enlace simbólico bajo `<workspace>/skills` que se
resuelva fuera de la raíz se omite con un mensaje de registro.

Para permitir un diseño intencional con enlaces simbólicos, declara el destino
de confianza:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

Con esta configuración, `<workspace>/skills/manager -> ~/Projects/manager/skills`
se acepta después de la resolución de realpath. `extraDirs` escanea directamente
el repositorio hermano; `allowSymlinkTargets` conserva la ruta con enlace
simbólico para diseños existentes.

La aplicación de Skill Workshop no escribe a través de esos enlaces simbólicos
de forma predeterminada. Para permitir que Workshop apply modifique skills bajo
destinos de enlaces simbólicos que ya son de confianza, habilítalo por separado:

```json5
{
  skills: {
    load: {
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    workshop: {
      allowSymlinkTargetWrites: true,
    },
  },
}
```

Los directorios administrados `~/.openclaw/skills` y personales
`~/.agents/skills` ya aceptan enlaces simbólicos de directorios de skills
(la contención de `SKILL.md` por skill sigue aplicándose).

## Skills en sandbox y variables de entorno

<Warning>
  `skills.entries.<skill>.env` y `apiKey` se aplican solo a ejecuciones en el
  **host**. Dentro de un sandbox no tienen efecto: un skill que depende de
  `GEMINI_API_KEY` fallará con `apiKey not configured` a menos que la variable se
  proporcione al sandbox por separado.
</Warning>

Pasa secretos a un sandbox de Docker con:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          env: { GEMINI_API_KEY: "your-key-here" },
        },
      },
    },
  },
}
```

<Note>
  Los usuarios con acceso al demonio de Docker pueden inspeccionar los valores
  de `sandbox.docker.env` mediante los metadatos de Docker. Usa un archivo de
  secretos montado, una imagen personalizada u otra ruta de entrega cuando esa
  exposición no sea aceptable.
</Note>

## Recordatorio del orden de carga

```text
workspace/skills      (highest)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
bundled skills
skills.load.extraDirs (lowest)
```

Los cambios en skills y configuración surten efecto en la siguiente sesión nueva
cuando el observador está habilitado, o en el siguiente turno del agente cuando
el observador detecta un cambio.

## Relacionado

<CardGroup cols={2}>
  <Card title="Skills reference" href="/es/tools/skills" icon="puzzle-piece">
    Qué son los skills, el orden de carga, los controles de acceso y el formato
    de SKILL.md.
  </Card>
  <Card title="Creating skills" href="/es/tools/creating-skills" icon="hammer">
    Creación de skills personalizados para el espacio de trabajo.
  </Card>
  <Card title="Skill Workshop" href="/es/tools/skill-workshop" icon="flask">
    Cola de propuestas para skills redactados por agentes.
  </Card>
  <Card title="Slash commands" href="/es/tools/slash-commands" icon="terminal">
    Catálogo nativo de comandos de barra diagonal y directivas de chat.
  </Card>
</CardGroup>

---
read_when:
    - Configurar el comportamiento de carga, instalación o control de acceso de Skills
    - Configurar la visibilidad de Skills por agente
    - Ajustar los límites o la política de aprobación de Skill Workshop
sidebarTitle: Skills config
summary: Referencia completa del esquema de configuración skills.*, las listas de permitidos de agentes, los ajustes de workshop y la gestión de variables de entorno del sandbox.
title: Configuración de Skills
x-i18n:
    generated_at: "2026-07-05T11:48:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ed1ec20aa102b458a9485a1ada1bb7566c97d28b1f43caa28f52b3f5bdc381e
    source_path: tools/skills-config.md
    workflow: 16
---

La mayor parte de la configuración de Skills reside bajo `skills` en
`~/.openclaw/openclaw.json`. La visibilidad específica del agente reside bajo
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
  junto con la herramienta central `image_generate` en lugar de `skills.entries`. Las entradas de Skill
  son solo para flujos de trabajo de Skills personalizados o de terceros.
</Note>

## Carga (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Directorios de Skills adicionales para escanear, con la precedencia más baja (por debajo de
  las Skills empaquetadas y de Plugin). Las rutas se expanden con compatibilidad para `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Directorios de destino reales de confianza a los que pueden resolverse las carpetas de Skills
  enlazadas simbólicamente, incluso cuando el enlace simbólico está fuera de la raíz configurada. Usa esto para
  diseños intencionados de repositorios hermanos, como
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Mantén esta lista
  limitada; no apuntes a raíces amplias como `~` o `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Observa las carpetas de Skills y actualiza la instantánea de Skills cuando cambien los archivos `SKILL.md`.
  Cubre archivos anidados bajo raíces de Skills agrupadas.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Ventana de antirrebote para eventos del observador de Skills en milisegundos.
</ParamField>

## Instalación (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Prefiere instaladores de Homebrew cuando `brew` esté disponible.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Preferencia de gestor de paquetes de Node para instalaciones de Skills. Esto solo afecta a las instalaciones de Skills;
  el runtime de Gateway debe seguir usando Node (Bun no se recomienda
  para WhatsApp/Telegram). `openclaw setup --node-manager` y
  `openclaw onboard --node-manager` aceptan `npm`, `pnpm` o `bun`; define
  `"yarn"` directamente en la configuración para instalaciones de Skills respaldadas por Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Permite que clientes Gateway `operator.admin` de confianza instalen archivos zip privados
  preparados mediante `skills.upload.*`. Las instalaciones normales de ClawHub no
  necesitan esta opción.
</ParamField>

## Política de instalación del operador (`security.installPolicy`)

Usa `security.installPolicy` cuando los operadores necesiten un comando local de confianza para
aprobar o bloquear instalaciones de Skills y plugins con una política específica del host. La
política se ejecuta después de que OpenClaw haya preparado el material de origen y antes de que la instalación
o actualización continúe. Se aplica a Skills de ClawHub, Skills cargadas, Skills de Git/locales,
instaladores de dependencias de Skills y fuentes de instalación/actualización de plugins.

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
  Habilita la política de instalación propiedad del operador. Cuando se habilita sin un comando `exec`
  válido, las instalaciones fallan de forma cerrada.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Filtro opcional de destino. Cuando se omite, la política se aplica a todos los destinos
  compatibles para que las nuevas instalaciones no fallen abiertas inesperadamente.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Ruta absoluta al ejecutable de política de confianza. OpenClaw lo ejecuta sin
  shell y valida la ruta antes de usarlo.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Argumentos estáticos pasados después de `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Tiempo máximo de reloj de pared para una decisión de política.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Tiempo máximo sin salida en stdout o stderr antes de que la política falle
  de forma cerrada.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Máximo de bytes combinados de stdout y stderr aceptados del proceso de política.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Variables de entorno literales proporcionadas al proceso de política.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Nombres de variables de entorno copiadas del proceso de OpenClaw al
  proceso de política. Solo se pasan las variables nombradas.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Lista de permitidos opcional de directorios que pueden contener el ejecutable de política.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Omite las comprobaciones de propiedad y permisos de la ruta del comando. Úsalo solo cuando la
  ruta esté protegida por otro mecanismo.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Permite que la ruta de comando configurada sea un enlace simbólico. El destino resuelto
  aún debe satisfacer las demás comprobaciones de ruta. Los argumentos de script de intérprete deben
  ser archivos regulares directos, no enlaces simbólicos.
</ParamField>

La política recibe un objeto JSON en stdin con `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
`source` estructurado opcional, `origin` estructurado y `request`. Debe
escribir un objeto JSON en stdout: `{ "protocolVersion": 1, "decision": "allow" }`
o `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Salida distinta de cero,
tiempo de espera agotado, JSON malformado, campos faltantes o versiones de protocolo no compatibles
fallan de forma cerrada.

OpenClaw no ejecuta la política de instalación durante el arranque normal de Gateway.
Las instalaciones y actualizaciones fallan de forma cerrada cuando la política está habilitada pero no disponible.
`openclaw doctor` realiza validación estática; `openclaw doctor --deep`
ejecuta una prueba sintética de instalación contra el comando configurado.

Las actualizaciones masivas aplican la política por destino: una actualización de Skill o plugin bloqueada falla
ese destino sin deshabilitar la política ni omitir destinos posteriores en el
lote.

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

## Lista de permitidos de Skills empaquetadas

<ParamField path="skills.allowBundled" type="string[]">
  Lista de permitidos opcional solo para Skills **empaquetadas**. Cuando se define, solo las Skills empaquetadas
  de la lista son aptas. Las Skills gestionadas, de nivel de agente y de espacio de trabajo
  no se ven afectadas.
</ParamField>

## Entradas por Skill (`skills.entries`)

Las claves bajo `entries` coinciden con el `name` de la Skill de forma predeterminada. Si una Skill define
`metadata.openclaw.skillKey`, usa esa clave en su lugar. Pon entre comillas los nombres con guiones
(JSON5 permite claves entrecomilladas).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` deshabilita la Skill incluso cuando está empaquetada o instalada. La Skill empaquetada
  `coding-agent` es opcional; establécela en `true` y asegúrate de que una de
  `claude`, `codex`, `opencode` u otra CLI compatible esté instalada y
  autenticada.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Campo práctico para Skills que declaran `metadata.openclaw.primaryEnv`.
  Admite una cadena de texto plano o un SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Variables de entorno inyectadas para la ejecución del agente. Solo se inyectan cuando la
  variable aún no está definida en el proceso.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Contenedor opcional para campos de configuración personalizados por Skill.
</ParamField>

## Listas de permitidos de agentes (`agents`)

Usa la configuración del agente cuando quieras las mismas raíces de Skills de máquina/espacio de trabajo, pero un
conjunto de Skills visible distinto por agente.

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
  Lista de permitidos de referencia compartida heredada por agentes que omiten
  `agents.list[].skills`. Omítela por completo para dejar las Skills sin restricciones de forma
  predeterminada.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Conjunto final explícito de Skills para ese agente. Las listas explícitas **reemplazan**
  los valores predeterminados heredados; no se fusionan. Defínelo como `[]` para no exponer Skills a
  ese agente.
</ParamField>

<Warning>
  Las listas de permitidos de Skills de agentes son un filtro de visibilidad y carga para el descubrimiento
  de Skills de OpenClaw, prompts, descubrimiento de comandos slash, sincronización de sandbox e instantáneas
  de Skills. No son un límite de autorización en tiempo de shell. Si un agente
  puede ejecutar `exec` del host, ese shell aún puede ejecutar clientes externos o leer
  archivos del host visibles para el usuario de ejecución, incluidos registros de clientes MCP
  como `~/.openclaw/skills/config/mcporter.json`. Para
  aislamiento MCP por agente, combina listas de permitidos de Skills con aislamiento de sandbox/usuario del SO,
  deniega o restringe estrictamente `exec` del host con una lista de permitidos, y prefiere credenciales
  por agente en el servidor MCP.
</Warning>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Cuando es `true`, los agentes pueden crear propuestas pendientes a partir de
  señales de conversación duraderas después de turnos correctos. La creación de
  habilidades solicitada por el usuario siempre pasa por Skill Workshop,
  independientemente de este ajuste.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` requiere aprobación del operador antes de aplicar, rechazar o poner
  en cuarentena una acción iniciada por el agente. `auto` permite esas acciones
  sin aprobación.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Permite que Skill Workshop aplique cambios escribiendo a través de enlaces
  simbólicos de habilidades del espacio de trabajo cuyo destino real ya sea de
  confianza para `skills.load.allowSymlinkTargets`. Mantén esto desactivado a
  menos que las aplicaciones de propuestas generadas deban modificar esa raíz de
  habilidades compartida.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Número máximo de propuestas pendientes y en cuarentena conservadas por espacio
  de trabajo (rango permitido: 1-200).
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Tamaño máximo del cuerpo de la propuesta en bytes (rango permitido:
  1024-200000). Las descripciones de propuestas tienen además un límite estricto
  de 160 bytes, porque aparecen en la salida de descubrimiento y listado.
</ParamField>

Consulta [Skill Workshop](/es/tools/skill-workshop) para ver el ciclo de vida de
las propuestas, los comandos de CLI, los parámetros de herramientas de agente y
los métodos de Gateway que controla esta configuración.

## Raíces de habilidades con enlaces simbólicos

De forma predeterminada, las raíces de habilidades del espacio de trabajo,
agente de proyecto, directorio adicional y empaquetadas son límites de
contención. Una carpeta de habilidades con enlace simbólico bajo
`<workspace>/skills` que se resuelve fuera de la raíz se omite con un mensaje de
registro.

Para permitir una disposición intencional con enlaces simbólicos, declara el
destino de confianza:

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
se acepta después de la resolución de realpath. `extraDirs` escanea
directamente el repositorio hermano; `allowSymlinkTargets` conserva la ruta con
enlace simbólico para las disposiciones existentes.

Skill Workshop no escribe a través de esos enlaces simbólicos de forma
predeterminada al aplicar cambios. Para permitir que Workshop modifique
habilidades bajo destinos de enlaces simbólicos que ya son de confianza, opta
por ello por separado:

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
`~/.agents/skills` ya aceptan incondicionalmente enlaces simbólicos de
directorios de habilidades (la contención por habilidad de `SKILL.md` sigue
aplicándose); `allowSymlinkTargets` solo es necesario para las raíces de espacio
de trabajo, directorio adicional y agente de proyecto
(`<workspace>/.agents/skills`).

## Habilidades en sandbox y variables de entorno

<Warning>
  `skills.entries.<skill>.env` y `apiKey` se aplican solo a ejecuciones en el
  **host**. Dentro de un sandbox no tienen efecto: una habilidad que dependa de
  `GEMINI_API_KEY` fallará con `apiKey not configured` a menos que la variable
  se proporcione al sandbox por separado.
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
  Los usuarios con acceso al daemon de Docker pueden inspeccionar los valores de
  `sandbox.docker.env` a través de los metadatos de Docker. Usa un archivo de
  secreto montado, una imagen personalizada u otra ruta de entrega cuando esa
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

Los cambios en las habilidades y la configuración surten efecto en la siguiente
sesión nueva cuando el observador está habilitado, o en el siguiente turno del
agente cuando el observador detecta un cambio.

## Relacionado

<CardGroup cols={2}>
  <Card title="Referencia de Skills" href="/es/tools/skills" icon="puzzle-piece">
    Qué son las habilidades, orden de carga, control de acceso y formato de SKILL.md.
  </Card>
  <Card title="Crear habilidades" href="/es/tools/creating-skills" icon="hammer">
    Creación de habilidades personalizadas de espacio de trabajo.
  </Card>
  <Card title="Skill Workshop" href="/es/tools/skill-workshop" icon="flask">
    Cola de propuestas para habilidades redactadas por agentes.
  </Card>
  <Card title="Comandos de barra" href="/es/tools/slash-commands" icon="terminal">
    Catálogo nativo de comandos de barra y directivas de chat.
  </Card>
</CardGroup>

---
read_when:
    - Configuración del comportamiento de carga, instalación o habilitación de Skills
    - Configuración de la visibilidad de Skills por agente
    - Ajuste de los límites o la política de aprobación del taller de Skills
sidebarTitle: Skills config
summary: Referencia completa del esquema de configuración `skills.*`, las listas de permitidos de agentes, los ajustes del taller y la gestión de variables de entorno del entorno aislado.
title: Configuración de Skills
x-i18n:
    generated_at: "2026-07-16T12:02:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1633364a7333ba00f5f6c8d6f1f478b65e63bc97de23705e492eb980967ec521
    source_path: tools/skills-config.md
    workflow: 16
---

La mayor parte de la configuración de Skills se encuentra en `skills` dentro de
`~/.openclaw/openclaw.json`. La visibilidad específica de cada agente se encuentra en
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
      approvalPolicy: "auto",
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
  Para la generación de imágenes integrada, use `agents.defaults.imageGenerationModel`
  junto con la herramienta principal `image_generate` en lugar de `skills.entries`. Las entradas de
  Skills son únicamente para flujos de trabajo de Skills personalizados o de terceros.
</Note>

## Carga (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Directorios adicionales de Skills que se analizarán, con la precedencia más baja (por debajo de
  los Skills incluidos y de Plugin). Las rutas se expanden con compatibilidad para `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Directorios de destino reales y de confianza a los que pueden resolverse las carpetas de Skills
  enlazadas simbólicamente, incluso cuando el enlace simbólico se encuentra fuera de la raíz configurada. Use esta opción para
  diseños intencionales con repositorios hermanos, como
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Mantenga esta lista
  restringida; no señale raíces amplias como `~` o `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Supervisa las carpetas de Skills y actualiza la instantánea de Skills cuando cambian los archivos
  `SKILL.md`. Incluye los archivos anidados bajo raíces de Skills agrupadas.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Intervalo de antirrebote para los eventos del supervisor de Skills, en milisegundos.
</ParamField>

## Instalación (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Da preferencia a los instaladores de Homebrew cuando `brew` está disponible.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Preferencia del gestor de paquetes de Node para instalar Skills. Esto solo afecta a las
  instalaciones de Skills; la CLI de OpenClaw y el entorno de ejecución de Gateway requieren Node porque el
  almacén de estado canónico utiliza `node:sqlite`. `openclaw setup --node-manager` y
  `openclaw onboard --node-manager` aceptan `npm`, `pnpm` o `bun`; establezca
  `"yarn"` directamente en la configuración para las instalaciones de Skills basadas en Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Permite que clientes de Gateway `operator.admin` de confianza instalen archivos zip
  privados preparados mediante `skills.upload.*`. Las instalaciones normales de ClawHub no
  necesitan esta opción.
</ParamField>

## Política de instalación del operador (`security.installPolicy`)

Use `security.installPolicy` cuando los operadores necesiten un comando local de confianza para
aprobar o bloquear instalaciones de Skills y Plugins mediante una política específica del host. La
política se ejecuta después de que OpenClaw haya preparado el material de origen y antes de que continúe
la instalación o actualización. Se aplica a los Skills de ClawHub, Skills cargados, Skills locales o de Git,
instaladores de dependencias de Skills y orígenes de instalación o actualización de Plugins.

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
  Habilita la política de instalación propiedad del operador. Cuando se habilita sin un comando
  `exec` válido, las instalaciones se bloquean de forma segura.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Filtro de destinos opcional. Cuando se omite, la política se aplica a todos los destinos
  compatibles para que las instalaciones nuevas no se permitan inesperadamente.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Ruta absoluta al ejecutable de políticas de confianza. OpenClaw lo ejecuta sin un
  shell y valida la ruta antes de utilizarlo.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Argumentos estáticos pasados después de `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Tiempo máximo de ejecución real para una decisión de política.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Tiempo máximo sin salida por stdout o stderr antes de que la política se
  bloquee de forma segura.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Cantidad máxima combinada de bytes de stdout y stderr aceptada del proceso de políticas.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Variables de entorno literales proporcionadas al proceso de políticas.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Nombres de variables de entorno copiados del proceso de OpenClaw al
  proceso de políticas. Solo se pasan las variables indicadas.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Lista opcional de directorios permitidos que pueden contener el ejecutable de políticas.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Omite las comprobaciones de propiedad y permisos de la ruta del comando. Úselo únicamente cuando
  otro mecanismo proteja la ruta.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Permite que la ruta configurada del comando sea un enlace simbólico. El destino resuelto
  debe seguir cumpliendo las demás comprobaciones de ruta. Los argumentos de scripts de intérprete deben
  ser archivos regulares directos, no enlaces simbólicos.
</ParamField>

La política recibe por stdin un objeto JSON con `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
el valor estructurado opcional `source`, el valor estructurado `origin` y `request`. Debe
escribir un objeto JSON por stdout: `{ "protocolVersion": 1, "decision": "allow" }`
o `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Un código de salida distinto de cero,
un tiempo de espera agotado, JSON con formato incorrecto, campos ausentes o versiones de protocolo
no compatibles provocan un bloqueo seguro.

OpenClaw no ejecuta la política de instalación durante el inicio normal de Gateway.
Las instalaciones y actualizaciones se bloquean de forma segura cuando la política está habilitada pero no disponible.
`openclaw doctor` realiza una validación estática; `openclaw doctor --deep`
ejecuta una prueba de instalación sintética con el comando configurado.

Las actualizaciones masivas aplican la política a cada destino: una actualización bloqueada de un Skill o Plugin hace que
ese destino falle sin deshabilitar la política ni omitir los destinos posteriores del
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
        reason: "las rutas locales de Plugins no están aprobadas en este host",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## Lista de Skills incluidos permitidos

<ParamField path="skills.allowBundled" type="string[]">
  Lista opcional de Skills permitidos únicamente para los Skills **incluidos**. Cuando se establece, solo son aptos los Skills
  incluidos en la lista. No afecta a los Skills administrados, del agente ni del espacio de trabajo.
</ParamField>

## Entradas por Skill (`skills.entries`)

Las claves bajo `entries` coinciden de forma predeterminada con el `name` del Skill. Si un Skill define
`metadata.openclaw.skillKey`, use esa clave en su lugar. Escriba entre comillas los nombres con guiones
(JSON5 permite claves entre comillas).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` deshabilita el Skill incluso si está incluido o instalado. El Skill incluido
  `coding-agent` requiere activación; establézcalo en `true` y asegúrese de que
  `claude`, `codex`, `opencode` u otra CLI compatible esté instalada y
  autenticada.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Campo práctico para Skills que declaran `metadata.openclaw.primaryEnv`.
  Admite una cadena de texto sin formato o una SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Variables de entorno inyectadas para la ejecución del agente. Solo se inyectan cuando la
  variable aún no está definida en el proceso.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Contenedor opcional para campos de configuración personalizados por Skill.
</ParamField>

## Listas de agentes permitidos (`agents`)

Use la configuración del agente cuando desee las mismas raíces de Skills de la máquina o del espacio de trabajo, pero un
conjunto distinto de Skills visibles para cada agente.

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
  Lista base compartida de elementos permitidos que heredan los agentes que omiten
  `agents.list[].skills`. Omítala por completo para no restringir los Skills de forma
  predeterminada.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Conjunto final explícito de Skills para ese agente. Las listas explícitas **sustituyen**
  los valores predeterminados heredados; no se combinan. Establézcalo en `[]` para no exponer ningún Skill a
  ese agente.
</ParamField>

<Warning>
  Las listas de Skills permitidos para agentes son un filtro de visibilidad y carga para la detección de Skills
  de OpenClaw, los prompts, la detección de comandos con barra, la sincronización del entorno aislado y las
  instantáneas de Skills. No constituyen un límite de autorización durante la ejecución del shell. Si un agente
  puede ejecutar `exec` en el host, ese shell aún puede ejecutar clientes externos o leer
  archivos del host visibles para el usuario de ejecución, incluidos registros de clientes MCP
  como `~/.openclaw/skills/config/mcporter.json`. Para
  aislar MCP por agente, combine las listas de Skills permitidos con el aislamiento mediante entorno aislado o usuario del sistema operativo,
  deniegue la ejecución en el host o restrínjala con una lista estricta de elementos permitidos, y dé preferencia a credenciales específicas de cada agente
  en el servidor MCP.
</Warning>

## Taller (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Cuando `true`, OpenClaw puede crear propuestas pendientes a partir de correcciones duraderas
  y puede revisar trabajos completados correctamente y de carácter sustancial después de que el sistema quede
  inactivo. Esto puede añadir una ejecución del modelo en segundo plano después de los turnos aptos. La creación
  de Skills solicitada por el usuario y `/learn` siguen funcionando cuando el ajuste es `false`.
</ParamField>

Consulte [Autoaprendizaje](/es/tools/self-learning) para obtener información sobre los requisitos, la privacidad, el coste,
los permisos limitados a propuestas y la resolución de problemas.

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"auto"'>
  `auto` permite aplicar, rechazar o poner en cuarentena por iniciativa del agente sin una
  solicitud de aprobación adicional. `pending` requiere la aprobación del operador.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Permite que la aplicación de Skill Workshop escriba a través de enlaces simbólicos de Skills del espacio de trabajo cuyo
  destino real ya sea de confianza para `skills.load.allowSymlinkTargets`. Mantenga
  esta opción desactivada a menos que la aplicación de propuestas generadas deba modificar esa raíz
  compartida de Skills.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Número máximo de propuestas pendientes y en cuarentena que se conservan por espacio de trabajo (intervalo
  permitido: 1-200).
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Tamaño máximo del cuerpo de la propuesta en bytes (intervalo permitido: 1024-200000). Las descripciones
  de las propuestas tienen por separado un límite estricto de 160 bytes, porque aparecen
  en los resultados de detección y enumeración.
</ParamField>

Consulte [Skill Workshop](/es/tools/skill-workshop) para obtener información sobre el ciclo de vida de las propuestas, los comandos
de la CLI, los parámetros de las herramientas del agente y los métodos del Gateway que controla esta configuración.

## Raíces de Skills con enlaces simbólicos

De forma predeterminada, las raíces de Skills del espacio de trabajo, del agente de proyecto, de directorios adicionales y de Skills incluidas
son límites de contención. Una carpeta de Skills con un enlace simbólico bajo `<workspace>/skills`
que se resuelva fuera de la raíz se omite y se registra un mensaje.

Para permitir una disposición intencional de enlaces simbólicos, declare el destino de confianza:

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
se acepta después de resolver la ruta real. `extraDirs` examina directamente el repositorio
adyacente; `allowSymlinkTargets` conserva la ruta con enlace simbólico para las
disposiciones existentes.

La aplicación de Skill Workshop no escribe a través de esos enlaces simbólicos de forma predeterminada. Para
permitir que la aplicación de Workshop modifique Skills bajo destinos de enlaces simbólicos que ya sean de confianza, habilite
esta opción por separado:

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

Los directorios administrados `~/.openclaw/skills` y personales `~/.agents/skills`
ya aceptan incondicionalmente enlaces simbólicos de directorios de Skills (la contención de
`SKILL.md` por Skill sigue aplicándose); `allowSymlinkTargets` solo es necesario
para las raíces del espacio de trabajo, de directorios adicionales y del agente de proyecto (`<workspace>/.agents/skills`).

## Skills en entornos aislados y variables de entorno

<Warning>
  `skills.entries.<skill>.env` y `apiKey` solo se aplican a las ejecuciones en el **host**.
  Dentro de un entorno aislado no tienen efecto: una Skill que dependa de
  `GEMINI_API_KEY` fallará con `apiKey not configured`, a menos que la variable
  se proporcione por separado al entorno aislado.
</Warning>

Pase secretos a un entorno aislado de Docker con:

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
  Los usuarios con acceso al daemon de Docker pueden inspeccionar los valores de `sandbox.docker.env`
  mediante los metadatos de Docker. Utilice un archivo de secretos montado, una imagen personalizada u
  otra vía de entrega cuando esa exposición no sea aceptable.
</Note>

## Recordatorio del orden de carga

```text
workspace/skills      (prioridad más alta)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
Skills incluidas
skills.load.extraDirs (prioridad más baja)
```

Los cambios en las Skills y la configuración surten efecto en la siguiente sesión nueva cuando el
observador está habilitado, o en el siguiente turno del agente cuando el observador detecta un
cambio.

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Referencia de Skills" href="/es/tools/skills" icon="puzzle-piece">
    Qué son las Skills, su orden de carga, sus restricciones y el formato de SKILL.md.
  </Card>
  <Card title="Creación de Skills" href="/es/tools/creating-skills" icon="hammer">
    Creación de Skills personalizadas para el espacio de trabajo.
  </Card>
  <Card title="Skill Workshop" href="/es/tools/skill-workshop" icon="flask">
    Cola de propuestas para Skills redactadas por agentes.
  </Card>
  <Card title="Autoaprendizaje" href="/es/tools/self-learning" icon="brain">
    Propuestas conservadoras y opcionales a partir del trabajo completado.
  </Card>
  <Card title="Comandos de barra diagonal" href="/es/tools/slash-commands" icon="terminal">
    Catálogo nativo de comandos de barra diagonal y directivas de chat.
  </Card>
</CardGroup>

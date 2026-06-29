---
read_when:
    - Quieres leer o editar la configuración de forma no interactiva
sidebarTitle: Config
summary: Referencia de la CLI para `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Configuración
x-i18n:
    generated_at: "2026-06-28T22:32:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 92878977e8fb6670f12c0a77937a7c41f9230da82e20ec7690731bbda1e910ca
    source_path: cli/config.md
    workflow: 16
---

Ayudantes de configuración para ediciones no interactivas en `openclaw.json`: obtener/establecer/parchear/anular/archivo/esquema/validar valores por ruta e imprimir el archivo de configuración activo. Ejecútalo sin un subcomando para abrir el asistente de configuración (igual que `openclaw configure`).

<Note>
Cuando `OPENCLAW_NIX_MODE=1`, OpenClaw trata `openclaw.json` como inmutable. Los comandos de solo lectura como `config get`, `config file`, `config schema` y `config validate` siguen funcionando, pero los escritores de configuración se niegan a escribir. En su lugar, los agentes deben editar la fuente Nix de la instalación; para la distribución propia nix-openclaw, usa [Inicio rápido de nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) y establece valores bajo `programs.openclaw.config` o `instances.<name>.config`.
</Note>

## Opciones raíz

<ParamField path="--section <section>" type="string">
  Filtro repetible de sección de configuración guiada cuando ejecutas `openclaw config` sin un subcomando.
</ParamField>

Secciones guiadas compatibles: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

## Ejemplos

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Imprime el esquema JSON generado para `openclaw.json` en stdout como JSON.

<AccordionGroup>
  <Accordion title="Qué incluye">
    - El esquema de configuración raíz actual, más un campo de cadena raíz `$schema` para herramientas de editor.
    - Metadatos de documentación `title` y `description` de campos usados por la Control UI.
    - Los nodos de objeto anidado, comodín (`*`) y elemento de arreglo (`[]`) heredan los mismos metadatos `title` / `description` cuando existe documentación de campo coincidente.
    - Las ramas `anyOf` / `oneOf` / `allOf` también heredan los mismos metadatos de documentación cuando existe documentación de campo coincidente.
    - Metadatos de esquema de plugins y canales en vivo en modo de mejor esfuerzo cuando se pueden cargar los manifiestos de runtime.
    - Un esquema de reserva limpio incluso cuando la configuración actual no es válida.

  </Accordion>
  <Accordion title="RPC de runtime relacionado">
    `config.schema.lookup` devuelve una ruta de configuración normalizada con un nodo de esquema superficial (`title`, `description`, `type`, `enum`, `const`, límites comunes), metadatos de sugerencia de UI coincidentes y resúmenes de hijos inmediatos. Úsalo para exploración acotada por ruta en Control UI o clientes personalizados.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Canalízalo a un archivo cuando quieras inspeccionarlo o validarlo con otras herramientas:

```bash
openclaw config schema > openclaw.schema.json
```

### Rutas

Las rutas usan notación de puntos o corchetes. Cita las rutas con notación de corchetes en ejemplos de shell para que shells como zsh no expandan `[0]` como un glob antes de que OpenClaw reciba la ruta:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
```

Usa el índice de la lista de agentes para apuntar a un agente específico:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

## Valores

Los valores se analizan como JSON5 cuando es posible; de lo contrario, se tratan como cadenas. Usa `--strict-json` para exigir análisis de JSON estándar sin reserva a cadena. `--json` sigue siendo compatible como alias heredado de `--strict-json`.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

Cuando `--strict-json` está habilitado, se rechaza la sintaxis exclusiva de JSON5, como comentarios, comas finales o claves de objeto sin comillas. Omite `--strict-json` para analizar valores JSON5 con reserva a cadena sin procesar.

`config get <path> --json` imprime el valor sin procesar como JSON en lugar de texto formateado para terminal.

<Note>
La asignación de objetos reemplaza la ruta de destino de forma predeterminada. Las rutas protegidas de mapa/lista que suelen contener entradas agregadas por usuarios, como `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` y `auth.profiles`, rechazan reemplazos que eliminarían entradas existentes a menos que pases `--replace`.
</Note>

Usa `--merge` al agregar entradas a esos mapas:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Usa `--replace` solo cuando quieras intencionalmente que el valor proporcionado se convierta en el valor de destino completo.

## Modos de `config set`

`openclaw config set` admite cuatro estilos de asignación:

<Tabs>
  <Tab title="Modo de valor">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="Modo generador de SecretRef">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Modo generador de proveedor">
    El modo generador de proveedor solo apunta a rutas `secrets.providers.<alias>`:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="Modo por lotes">
    ```bash
    openclaw config set --batch-json '[
      {
        "path": "secrets.providers.default",
        "provider": { "source": "env" }
      },
      {
        "path": "channels.discord.token",
        "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
      }
    ]'
    ```

    ```bash
    openclaw config set --batch-file ./config-set.batch.json --dry-run
    ```

  </Tab>
</Tabs>

<Warning>
Las asignaciones de SecretRef se rechazan en superficies mutables en runtime no compatibles (por ejemplo, `hooks.token`, `commands.ownerDisplaySecret`, tokens de Webhook de enlace de hilos de Discord y JSON de credenciales de WhatsApp). Consulta [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface).
</Warning>

El análisis por lotes siempre usa la carga útil del lote (`--batch-json`/`--batch-file`) como fuente de verdad. `--strict-json` / `--json` no cambian el comportamiento de análisis por lotes.

## `config patch`

Usa `config patch` cuando quieras pegar o canalizar un parche con forma de configuración en lugar de ejecutar muchos comandos `config set` basados en rutas. La entrada es un objeto JSON5. Los objetos se fusionan recursivamente, los arreglos y valores escalares reemplazan el valor de destino, y `null` elimina la ruta de destino.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

También puedes canalizar un parche por stdin, lo cual es útil para scripts de configuración remota:

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

Parche de ejemplo:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
      },
    },
  },
}
```

Usa `--replace-path <path>` cuando un objeto o arreglo deba convertirse exactamente en el valor proporcionado en lugar de parchearse recursivamente:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` ejecuta comprobaciones de esquema y resolubilidad de SecretRef sin escribir. Las SecretRefs respaldadas por exec se omiten de forma predeterminada durante dry-run; agrega `--allow-exec` cuando quieras intencionalmente que dry-run ejecute comandos de proveedor.

El modo de ruta/valor JSON sigue siendo compatible tanto para SecretRefs como para proveedores:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Marcas del generador de proveedor

Los destinos del generador de proveedor deben usar `secrets.providers.<alias>` como ruta.

<AccordionGroup>
  <Accordion title="Marcas comunes">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Proveedor env (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (repetible)

  </Accordion>
  <Accordion title="Proveedor de archivo (--provider-source file)">
    - `--provider-path <path>` (obligatorio)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Proveedor exec (--provider-source exec)">
    - `--provider-command <path>` (obligatorio)
    - `--provider-arg <arg>` (repetible)
    - `--provider-no-output-timeout-ms <ms>`
    - `--provider-max-output-bytes <bytes>`
    - `--provider-json-only`
    - `--provider-env <KEY=VALUE>` (repetible)
    - `--provider-pass-env <ENV_VAR>` (repetible)
    - `--provider-trusted-dir <path>` (repetible)
    - `--provider-allow-insecure-path`
    - `--provider-allow-symlink-command`

  </Accordion>
</AccordionGroup>

Ejemplo de proveedor exec endurecido:

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## Dry run

Usa `--dry-run` para validar cambios sin escribir `openclaw.json`.

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

<AccordionGroup>
  <Accordion title="Comportamiento de simulación">
    - Modo builder: ejecuta comprobaciones de capacidad de resolución de SecretRef para refs/proveedores modificados.
    - Modo JSON (`--strict-json`, `--json` o modo por lotes): ejecuta validación de esquema más comprobaciones de capacidad de resolución de SecretRef.
    - La validación de políticas también se ejecuta para superficies de destino de SecretRef conocidas como no compatibles.
    - Las comprobaciones de políticas evalúan la configuración completa posterior al cambio, por lo que las escrituras de objetos padre (por ejemplo, establecer `hooks` como objeto) no pueden eludir la validación de superficies no compatibles.
    - Las comprobaciones de SecretRef de exec se omiten de forma predeterminada durante la simulación para evitar efectos secundarios de comandos.
    - Usa `--allow-exec` con `--dry-run` para optar por las comprobaciones de SecretRef de exec (esto puede ejecutar comandos del proveedor).
    - `--allow-exec` es solo para simulación y produce un error si se usa sin `--dry-run`.

  </Accordion>
  <Accordion title="Campos de --dry-run --json">
    `--dry-run --json` imprime un informe legible por máquina:

    - `ok`: si la simulación se completó correctamente
    - `operations`: número de asignaciones evaluadas
    - `checks`: si se ejecutaron comprobaciones de esquema/capacidad de resolución
    - `checks.resolvabilityComplete`: si las comprobaciones de capacidad de resolución se completaron (false cuando se omiten refs de exec)
    - `refsChecked`: número de refs resueltas realmente durante la simulación
    - `skippedExecRefs`: número de refs de exec omitidas porque `--allow-exec` no estaba definido
    - `errors`: errores estructurados de ruta faltante, esquema o capacidad de resolución cuando `ok=false`

  </Accordion>
</AccordionGroup>

### Forma de salida JSON

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder" | "unset", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "missing-path" | "schema" | "resolvability",
      message: string,
      ref?: string, // present for resolvability errors
    },
  ],
}
```

<Tabs>
  <Tab title="Ejemplo de éxito">
    ```json
    {
      "ok": true,
      "operations": 1,
      "configPath": "~/.openclaw/openclaw.json",
      "inputModes": ["builder"],
      "checks": {
        "schema": false,
        "resolvability": true,
        "resolvabilityComplete": true
      },
      "refsChecked": 1,
      "skippedExecRefs": 0
    }
    ```
  </Tab>
  <Tab title="Ejemplo de fallo">
    ```json
    {
      "ok": false,
      "operations": 1,
      "configPath": "~/.openclaw/openclaw.json",
      "inputModes": ["builder"],
      "checks": {
        "schema": false,
        "resolvability": true,
        "resolvabilityComplete": true
      },
      "refsChecked": 1,
      "skippedExecRefs": 0,
      "errors": [
        {
          "kind": "resolvability",
          "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Si la simulación falla">
    - `config schema validation failed`: la forma de tu configuración posterior al cambio no es válida; corrige la ruta/valor o la forma del objeto proveedor/ref.
    - `Config policy validation failed: unsupported SecretRef usage`: devuelve esa credencial a entrada de texto sin formato/cadena y mantén SecretRefs solo en superficies compatibles.
    - `SecretRef assignment(s) could not be resolved`: el proveedor/ref referenciado no se puede resolver actualmente (variable de entorno faltante, puntero de archivo no válido, fallo del proveedor de exec o discrepancia entre proveedor/fuente).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: la simulación omitió refs de exec; vuelve a ejecutar con `--allow-exec` si necesitas validación de capacidad de resolución de exec.
    - Para el modo por lotes, corrige las entradas fallidas y vuelve a ejecutar `--dry-run` antes de escribir.

  </Accordion>
</AccordionGroup>

## Seguridad de escritura

`openclaw config set` y otros escritores de configuración propiedad de OpenClaw validan la configuración completa posterior al cambio antes de confirmarla en disco. Si la nueva carga útil no supera la validación de esquema o parece una sobrescritura destructiva, la configuración activa se deja intacta y la carga útil rechazada se guarda junto a ella como `openclaw.json.rejected.*`.

<Warning>
La ruta de configuración activa debe ser un archivo normal. Los diseños de `openclaw.json` con enlaces simbólicos no son compatibles para escrituras; usa `OPENCLAW_CONFIG_PATH` para apuntar directamente al archivo real en su lugar.
</Warning>

Prefiere escrituras por CLI para ediciones pequeñas:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Si se rechaza una escritura, inspecciona la carga útil guardada y corrige la forma completa de la configuración:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Las escrituras directas con editor siguen estando permitidas, pero el Gateway en ejecución las trata como no confiables hasta que se validan. Las ediciones directas no válidas hacen que el inicio falle o son omitidas por la recarga en caliente; Gateway no reescribe `openclaw.json`. Ejecuta `openclaw doctor --fix` para reparar configuraciones con prefijos/sobrescritas o restaurar la última copia conocida como válida. Consulta [Solución de problemas de Gateway](/es/gateway/troubleshooting#gateway-rejected-invalid-config).

La recuperación de archivo completo se reserva para la reparación de doctor. Los cambios de esquema de Plugin o la desalineación de `minHostVersion` permanecen visibles en lugar de revertir ajustes de usuario no relacionados como modelos, proveedores, perfiles de autenticación, canales, exposición del gateway, herramientas, memoria, navegador o configuración de cron.

## Subcomandos

- `config file`: Imprime la ruta del archivo de configuración activo (resuelta desde `OPENCLAW_CONFIG_PATH` o la ubicación predeterminada). La ruta debe indicar un archivo normal, no un enlace simbólico.

Reinicia el gateway después de las ediciones.

## Validar

Valida la configuración actual con el esquema activo sin iniciar el gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Después de que `openclaw config validate` pase, puedes usar la TUI local para que un agente integrado compare la configuración activa con la documentación mientras validas cada cambio desde la misma terminal:

<Note>
Si la validación ya está fallando, empieza con `openclaw configure` o `openclaw doctor --fix`. `openclaw chat` no omite la protección de configuración no válida.
</Note>

```bash
openclaw chat
```

Luego, dentro de la TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Bucle de reparación típico:

<Steps>
  <Step title="Comparar con la documentación">
    Pide al agente que compare tu configuración actual con la página de documentación relevante y sugiera la corrección más pequeña.
  </Step>
  <Step title="Aplicar ediciones dirigidas">
    Aplica ediciones dirigidas con `openclaw config set` u `openclaw configure`.
  </Step>
  <Step title="Volver a validar">
    Vuelve a ejecutar `openclaw config validate` después de cada cambio.
  </Step>
  <Step title="Doctor para problemas de runtime">
    Si la validación pasa pero el runtime sigue sin estar saludable, ejecuta `openclaw doctor` u `openclaw doctor --fix` para obtener ayuda de migración y reparación.
  </Step>
</Steps>

## Relacionado

- [Referencia de CLI](/es/cli)
- [Configuración](/es/gateway/configuration)

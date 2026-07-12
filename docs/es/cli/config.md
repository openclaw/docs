---
read_when:
    - Quieres leer o editar la configuración de forma no interactiva
sidebarTitle: Config
summary: Referencia de la CLI para `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Configuración
x-i18n:
    generated_at: "2026-07-11T22:55:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a9531407b2314d1a6bc05a87eb7efb6c37a847378b150125693f4d59733a2e9
    source_path: cli/config.md
    workflow: 16
---

Ayudantes no interactivos para `openclaw.json`: obtener, establecer, aplicar parches o eliminar un valor mediante una ruta, imprimir el esquema, validar o imprimir la ruta del archivo activo. Ejecute `openclaw config` sin subcomandos para abrir el mismo asistente guiado que `openclaw configure`.

<Note>
Cuando `OPENCLAW_NIX_MODE=1`, OpenClaw trata `openclaw.json` como inmutable. Los comandos de solo lectura (`config get`, `config file`, `config schema`, `config validate`) siguen funcionando; los comandos que escriben la configuración se niegan a hacerlo. En su lugar, edite la fuente de Nix de la instalación; para la distribución oficial nix-openclaw, consulte el [inicio rápido de nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) y establezca los valores en `programs.openclaw.config` o `instances.<name>.config`.
</Note>

## Opciones raíz

<ParamField path="--section <section>" type="string">
  Filtro repetible de secciones de configuración guiada al ejecutar `openclaw config` sin un subcomando.
</ParamField>

Secciones guiadas: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

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

### Rutas

Notación con puntos o corchetes. Ponga entre comillas las rutas con corchetes en los ejemplos del shell para que zsh no expanda `[0]` como un patrón glob:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

Lee un valor de la instantánea censurada de la configuración (los secretos nunca se imprimen). `--json` imprime el valor sin procesar como JSON; de lo contrario, las cadenas, los números y los booleanos se imprimen sin formato, y los objetos y arreglos se imprimen como JSON con formato.

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

Imprime la ruta del archivo de configuración activo, resuelta a partir de `OPENCLAW_CONFIG_PATH` o de la ubicación predeterminada. La ruta identifica un archivo normal, no un enlace simbólico; consulte [Seguridad de escritura](#write-safety).

### `config schema`

Imprime en la salida estándar el esquema JSON generado para `openclaw.json`.

<AccordionGroup>
  <Accordion title="Qué incluye">
    - El esquema actual de la configuración raíz, además de un campo de cadena `$schema` en la raíz para las herramientas del editor.
    - Metadatos de documentación `title` / `description` de los campos utilizados por la interfaz de control.
    - Los nodos de objetos anidados, comodines (`*`) y elementos de arreglo (`[]`) heredan los mismos metadatos `title` / `description` cuando existe documentación coincidente para los campos.
    - Las ramas `anyOf` / `oneOf` / `allOf` también heredan los mismos metadatos de documentación.
    - Metadatos de esquema en vivo de plugins y canales, cuando sea posible y puedan cargarse los manifiestos en tiempo de ejecución.
    - Un esquema alternativo limpio incluso cuando la configuración actual no sea válida.

  </Accordion>
  <Accordion title="RPC relacionado en tiempo de ejecución">
    `config.schema.lookup` devuelve una ruta de configuración normalizada con un nodo de esquema superficial (`title`, `description`, `type`, `enum`, `const`, límites comunes), los metadatos coincidentes de indicaciones para la interfaz de usuario y resúmenes de los elementos secundarios inmediatos. Úselo para profundizar en una ruta específica desde la interfaz de control o desde clientes personalizados.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
openclaw config schema > openclaw.schema.json
```

### `config validate`

Valida la configuración actual con el esquema activo sin iniciar el Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

<Note>
Si la validación ya está fallando, comience con `openclaw configure` o `openclaw doctor --fix`. `openclaw chat` no omite la protección contra configuraciones no válidas.
</Note>

## Valores

Los valores se analizan como JSON5 cuando es posible; de lo contrario, se tratan como cadenas sin procesar. Use `--strict-json` para exigir JSON estándar sin recurrir a una cadena (en ese caso se rechaza la sintaxis exclusiva de JSON5, como comentarios, comas finales o claves sin comillas). `--json` es un alias heredado de `--strict-json` en `config set`.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` imprime el valor sin procesar como JSON en lugar de texto con formato para la terminal.

<Note>
La asignación de objetos reemplaza de manera predeterminada la ruta de destino. Las rutas protegidas que suelen contener entradas añadidas por el usuario rechazan los reemplazos que eliminarían entradas existentes, a menos que pase `--replace`: `agents.defaults.models`, `agents.list`, `models.providers`, `models.providers.<id>`, `models.providers.<id>.models`, `plugins.entries` y `auth.profiles`.
</Note>

Use `--merge` al añadir entradas a esos mapas:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Use `--replace` únicamente cuando el valor proporcionado deba convertirse intencionadamente en el valor completo del destino.

## Modos de `config set`

<Tabs>
  <Tab title="Modo de valor">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="Modo de creación de SecretRef">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Modo de creación de proveedores">
    Solo admite rutas de destino `secrets.providers.<alias>`:

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
Las asignaciones de SecretRef se rechazan en superficies modificables durante la ejecución que no son compatibles (por ejemplo, `hooks.token`, `commands.ownerDisplaySecret`, los tokens de Webhook para vincular hilos de Discord y el JSON de credenciales de WhatsApp). Consulte [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface).
</Warning>

El análisis por lotes siempre utiliza la carga útil del lote (`--batch-json`/`--batch-file`) como fuente de verdad; `--strict-json` / `--json` no cambian el comportamiento del análisis por lotes.

El modo de ruta/valor JSON también funciona directamente con SecretRefs y proveedores:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### Indicadores del creador de proveedores

Los destinos del creador de proveedores deben usar `secrets.providers.<alias>` como ruta.

<AccordionGroup>
  <Accordion title="Indicadores comunes">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Proveedor de entorno (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (repetible)

  </Accordion>
  <Accordion title="Proveedor de archivos (--provider-source file)">
    - `--provider-path <path>` (obligatorio)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Proveedor de ejecución (--provider-source exec)">
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

Ejemplo de proveedor de ejecución reforzado:

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

## `config patch`

Pegue o canalice un parche JSON5 con la forma de la configuración, en lugar de ejecutar muchos comandos `config set` basados en rutas. Los objetos se combinan recursivamente; los arreglos y los valores escalares reemplazan el destino; `null` elimina la ruta de destino.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Canalice un parche mediante la entrada estándar para scripts de configuración remota:

```bash
ssh user@gateway-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh user@gateway-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
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
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

Use `--replace-path <path>` cuando un objeto o arreglo deba convertirse exactamente en el valor proporcionado en lugar de recibir un parche recursivo:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` ejecuta las comprobaciones del esquema y de resolución de SecretRef sin escribir. Las SecretRefs respaldadas por ejecución se omiten de manera predeterminada durante la ejecución de prueba; añada `--allow-exec` cuando quiera intencionadamente que la ejecución de prueba ejecute los comandos del proveedor.

## Ejecución de prueba

`--dry-run` valida los cambios sin escribir en `openclaw.json`. Está disponible en `config set`, `config patch` y `config unset`.

```bash
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
  <Accordion title="Comportamiento de la ejecución de prueba">
    - Modo de constructor: ejecuta comprobaciones de resolución de SecretRef para las referencias o los proveedores modificados.
    - Modo JSON (`--strict-json`, `--json` o modo por lotes): ejecuta la validación del esquema y las comprobaciones de resolución de SecretRef.
    - La validación de políticas se ejecuta sobre la configuración completa posterior al cambio, por lo que las escrituras de objetos principales (por ejemplo, establecer `hooks` como un objeto) no pueden eludir la validación de superficies no compatibles.
    - Las comprobaciones de SecretRef de ejecución se omiten de forma predeterminada para evitar efectos secundarios de los comandos; pasa `--allow-exec` para habilitarlas (esto puede ejecutar comandos del proveedor). `--allow-exec` solo se admite en la ejecución de prueba y produce un error sin `--dry-run`.

  </Accordion>
  <Accordion title="Campos de --dry-run --json">
    - `ok`: indica si la ejecución de prueba se completó correctamente
    - `operations`: número de asignaciones evaluadas
    - `checks`: indica si se ejecutaron las comprobaciones de esquema y resolución
    - `checks.resolvabilityComplete`: indica si las comprobaciones de resolución se ejecutaron hasta completarse (es falso cuando se omiten las referencias de ejecución)
    - `refsChecked`: número de referencias resueltas realmente durante la ejecución de prueba
    - `skippedExecRefs`: número de referencias de ejecución omitidas porque no se estableció `--allow-exec`
    - `errors`: errores estructurados de rutas ausentes, esquema o resolución cuando `ok=false`

  </Accordion>
</AccordionGroup>

### Estructura de la salida JSON

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
  <Tab title="Ejemplo de error">
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
  <Accordion title="Si falla la ejecución de prueba">
    - `config schema validation failed`: la estructura de la configuración posterior al cambio no es válida; corrige la ruta o el valor, o bien la estructura del objeto de proveedor o referencia.
    - `Config policy validation failed: unsupported SecretRef usage`: vuelve a introducir esa credencial como texto sin formato o cadena; utiliza SecretRefs únicamente en las superficies compatibles.
    - `SecretRef assignment(s) could not be resolved`: el proveedor o la referencia indicados no se pueden resolver actualmente (variable de entorno ausente, puntero de archivo no válido, fallo del proveedor de ejecución o discrepancia entre el proveedor y el origen).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: vuelve a ejecutar el comando con `--allow-exec` si necesitas validar la resolución de las referencias de ejecución.
    - En el modo por lotes, corrige las entradas que fallen y vuelve a ejecutar `--dry-run` antes de escribir.

  </Accordion>
</AccordionGroup>

## Aplicación de cambios

Después de cada ejecución correcta de `config set`, `config patch` o `config unset`, la CLI muestra una de estas tres indicaciones para que sepas si el Gateway necesita reiniciarse:

| Indicación                                          | Significado                                            |
| --------------------------------------------------- | ------------------------------------------------------ |
| `Restart the gateway to apply.`                     | La ruta modificada requiere un reinicio completo.      |
| `Change will apply without restarting the gateway.` | La recarga en caliente la aplica automáticamente.      |
| `No gateway restart needed.`                        | No se modificó nada relevante para el entorno de ejecución. |

Las escrituras en `plugins.entries` (o en cualquiera de sus subrutas) siempre requieren un reinicio, ya que la CLI no puede comprobar que estén cargados los metadatos de recarga de todos los plugins.

## Seguridad de escritura

`openclaw config set` y los demás mecanismos de escritura de configuración propios de OpenClaw validan la configuración completa posterior al cambio antes de guardarla en el disco. Si la nueva carga útil no supera la validación del esquema o parece una sobrescritura destructiva, la configuración activa permanece intacta y la carga útil rechazada se guarda junto a ella como `openclaw.json.rejected.*`.

<Warning>
La ruta de la configuración activa debe ser un archivo normal. No se admiten escrituras en disposiciones donde `openclaw.json` sea un enlace simbólico; utiliza `OPENCLAW_CONFIG_PATH` para apuntar directamente al archivo real.
</Warning>

Para cambios pequeños, es preferible escribir mediante la CLI:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Si se rechaza una escritura, inspecciona la carga útil guardada y corrige la estructura completa de la configuración:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

También se permiten las escrituras directas mediante un editor, pero el Gateway en ejecución las considera no confiables hasta que se validan. Las modificaciones directas no válidas impiden el inicio o se omiten durante la recarga en caliente; el Gateway no vuelve a escribir `openclaw.json`. Ejecuta `openclaw doctor --fix` para reparar una configuración con prefijos o sobrescrita, o para restaurar la última copia válida conocida. Consulta [Solución de problemas del Gateway](/es/gateway/troubleshooting#gateway-rejected-invalid-config).

La recuperación del archivo completo se reserva para la reparación mediante doctor. Los cambios en el esquema de un plugin o las discrepancias de `minHostVersion` siguen produciendo errores explícitos en lugar de revertir ajustes del usuario no relacionados, como los modelos, proveedores, perfiles de autenticación, canales, exposición del Gateway, herramientas, memoria, navegador o configuración de Cron.

## Ciclo de reparación

Después de que `openclaw config validate` se complete correctamente, utiliza la TUI local para que un agente integrado compare la configuración activa con la documentación mientras validas cada cambio desde el mismo terminal:

```bash
openclaw chat
```

Dentro de la TUI, un `!` inicial ejecuta literalmente un comando del shell local (tras una solicitud de confirmación que aparece una sola vez por sesión):

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

<Steps>
  <Step title="Comparar con la documentación">
    Pide al agente que compare tu configuración actual con la página pertinente de la documentación y que sugiera la corrección más pequeña.
  </Step>
  <Step title="Aplicar cambios específicos">
    Aplica cambios específicos con `openclaw config set` u `openclaw configure`.
  </Step>
  <Step title="Volver a validar">
    Vuelve a ejecutar `openclaw config validate` después de cada cambio.
  </Step>
  <Step title="Usar doctor para problemas del entorno de ejecución">
    Si la validación se completa correctamente, pero el entorno de ejecución sigue presentando problemas, ejecuta `openclaw doctor` u `openclaw doctor --fix` para obtener ayuda con la migración y la reparación.
  </Step>
</Steps>

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Configuración](/es/gateway/configuration)

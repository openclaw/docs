---
read_when:
    - Se desea leer o editar la configuración de forma no interactiva
sidebarTitle: Config
summary: Referencia de la CLI para `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Configuración
x-i18n:
    generated_at: "2026-07-16T11:27:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 63be5cbac6c7db9c6b93ad690e5decab9f4ce7904e8b10f26a3b1e39e4729450
    source_path: cli/config.md
    workflow: 16
---

Ayudantes no interactivos para `openclaw.json`: obtener/establecer/modificar/eliminar un valor por ruta, imprimir el esquema, validar o imprimir la ruta del archivo activo. Ejecute `openclaw config` sin subcomando para abrir el mismo asistente guiado que `openclaw configure`.

<Note>
Cuando `OPENCLAW_NIX_MODE=1`, OpenClaw considera `openclaw.json` inmutable. Los comandos de solo lectura (`config get`, `config file`, `config schema`, `config validate`) siguen funcionando; los comandos que escriben la configuración se niegan a hacerlo. En su lugar, edite la fuente de Nix de la instalación; para la distribución propia nix-openclaw, use la [guía de inicio rápido de nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) y establezca los valores en `programs.openclaw.config` o `instances.<name>.config`.
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

Notación de puntos o corchetes. Ponga entre comillas las rutas con corchetes en los ejemplos de shell para que zsh no expanda `[0]` como un patrón glob:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

Lee un valor de la instantánea redactada de la configuración (los secretos nunca se imprimen). `--json` imprime el valor sin procesar como JSON; de lo contrario, las cadenas, los números y los valores booleanos se imprimen sin formato, y los objetos y arreglos se imprimen como JSON con formato.

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
    - El esquema actual de configuración raíz, además de un campo de cadena raíz `$schema` para herramientas de edición.
    - Metadatos de documentación de los campos `title` / `description` utilizados por la interfaz de control.
    - Los nodos de objetos anidados, comodines (`*`) y elementos de arreglo (`[]`) heredan los mismos metadatos `title` / `description` cuando existen documentos de campo coincidentes.
    - Las ramas `anyOf` / `oneOf` / `allOf` también heredan los mismos metadatos de documentación.
    - Metadatos de esquema en vivo de plugins y canales, según el mejor esfuerzo, cuando se pueden cargar los manifiestos en tiempo de ejecución.
    - Un esquema alternativo limpio incluso cuando la configuración actual no es válida.

  </Accordion>
  <Accordion title="RPC de tiempo de ejecución relacionado">
    `config.schema.lookup` devuelve una ruta de configuración normalizada con un nodo de esquema superficial (`title`, `description`, `type`, `enum`, `const`, límites comunes), los metadatos de sugerencias de interfaz coincidentes y resúmenes de los elementos secundarios inmediatos. Úselo para profundizar en rutas específicas en la interfaz de control o en clientes personalizados.
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
Si la validación ya falla, comience con `openclaw configure` o `openclaw doctor --fix`. `openclaw chat` no omite la protección contra configuraciones no válidas.
</Note>

## Valores

Cuando es posible, los valores se analizan como JSON5; de lo contrario, se tratan como cadenas sin procesar. Use `--strict-json` para exigir JSON estándar sin recurrir a una cadena (en ese caso, se rechaza la sintaxis exclusiva de JSON5, como comentarios, comas finales o claves sin comillas). `--json` es un alias heredado de `--strict-json` en `config set`.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` imprime el valor sin procesar como JSON en lugar de texto con formato para la terminal.

<Note>
De forma predeterminada, la asignación de objetos reemplaza la ruta de destino. Las rutas protegidas que suelen contener entradas añadidas por el usuario rechazan los reemplazos que eliminarían entradas existentes, a menos que se pase `--replace`: `agents.defaults.models`, `agents.list`, `models.providers`, `models.providers.<id>`, `models.providers.<id>.models`, `plugins.entries` y `auth.profiles`.
</Note>

Use `--merge` al añadir entradas a esos mapas:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Use `--replace` solo cuando el valor proporcionado deba convertirse intencionadamente en el valor de destino completo.

## Modos de `config set`

<Tabs>
  <Tab title="Modo de valor">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="Modo de constructor de SecretRef">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Modo de constructor de proveedor">
    Solo se dirige a rutas `secrets.providers.<alias>`:

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
Las asignaciones de SecretRef se rechazan en superficies mutables en tiempo de ejecución que no son compatibles (por ejemplo, `hooks.token`, `commands.ownerDisplaySecret`, los tokens de Webhook para la vinculación de hilos de Discord y el JSON de credenciales de WhatsApp). Consulte [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface).
</Warning>

El análisis por lotes siempre utiliza la carga útil del lote (`--batch-json`/`--batch-file`) como fuente de verdad; `--strict-json` / `--json` no modifican el comportamiento del análisis por lotes.

El modo de ruta/valor JSON también funciona directamente con SecretRefs y proveedores:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### Opciones del constructor de proveedores

Los destinos del constructor de proveedores deben usar `secrets.providers.<alias>` como ruta.

<AccordionGroup>
  <Accordion title="Opciones comunes">
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

Pegue o canalice un parche JSON5 con forma de configuración en lugar de ejecutar muchos comandos `config set` basados en rutas. Los objetos se fusionan recursivamente; los arreglos y los valores escalares reemplazan el destino; `null` elimina la ruta de destino.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Canalice un parche mediante la entrada estándar para scripts de configuración remota:

```bash
ssh user@gateway-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh user@gateway-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

Ejemplo de parche:

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

Use `--replace-path <path>` cuando un objeto o arreglo deba convertirse exactamente en el valor proporcionado en lugar de modificarse recursivamente:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` ejecuta comprobaciones del esquema y de la capacidad de resolución de SecretRef sin escribir. De forma predeterminada, las SecretRefs respaldadas por ejecución se omiten durante la ejecución de prueba; añada `--allow-exec` cuando desee intencionadamente que la ejecución de prueba ejecute comandos del proveedor.

## Ejecución de prueba

`--dry-run` valida los cambios sin escribir `openclaw.json`. Está disponible en `config set`, `config patch` y `config unset`.

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
    - Modo de construcción: ejecuta comprobaciones de resolución de SecretRef para las referencias o los proveedores modificados.
    - Modo JSON (`--strict-json`, `--json` o modo por lotes): ejecuta la validación del esquema y las comprobaciones de resolución de SecretRef.
    - La validación de políticas se ejecuta con la configuración completa posterior al cambio, por lo que las escrituras de objetos principales (por ejemplo, establecer `hooks` como objeto) no pueden eludir la validación de superficies no compatibles.
    - Las comprobaciones de SecretRef de ejecución se omiten de forma predeterminada para evitar efectos secundarios de los comandos; pase `--allow-exec` para habilitarlas (esto puede ejecutar comandos de proveedores). `--allow-exec` solo sirve para la ejecución de prueba y genera un error sin `--dry-run`.

  </Accordion>
  <Accordion title="Campos de --dry-run --json">
    - `ok`: indica si la ejecución de prueba se realizó correctamente
    - `operations`: número de asignaciones evaluadas
    - `checks`: indica si se ejecutaron las comprobaciones de esquema o resolución
    - `checks.resolvabilityComplete`: indica si las comprobaciones de resolución se ejecutaron hasta completarse (es falso cuando se omiten las referencias de ejecución)
    - `refsChecked`: número de referencias resueltas realmente durante la ejecución de prueba
    - `skippedExecRefs`: número de referencias de ejecución omitidas porque no se estableció `--allow-exec`
    - `errors`: errores estructurados de ruta ausente, esquema o resolución cuando `ok=false`

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
      ref?: string, // presente para errores de resolución
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
          "message": "Error: La variable de entorno \"MISSING_TEST_SECRET\" no está definida.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Si falla la ejecución de prueba">
    - `config schema validation failed`: la estructura de la configuración posterior al cambio no es válida; corrija la ruta o el valor, o la estructura del objeto del proveedor o de la referencia.
    - `Config policy validation failed: unsupported SecretRef usage`: vuelva a introducir esa credencial como texto sin formato o cadena; mantenga las SecretRef únicamente en superficies compatibles.
    - `SecretRef assignment(s) could not be resolved`: el proveedor o la referencia indicados no se pueden resolver actualmente (variable de entorno ausente, puntero de archivo no válido, error del proveedor de ejecución o discrepancia entre el proveedor y la fuente).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: vuelva a ejecutar con `--allow-exec` si necesita validar la resolución de ejecución.
    - En el modo por lotes, corrija las entradas con errores y vuelva a ejecutar `--dry-run` antes de escribir.

  </Accordion>
</AccordionGroup>

## Aplicación de cambios

Después de cada `config set` / `config patch` / `config unset` que finalice correctamente, la CLI muestra una de tres indicaciones para informar de si es necesario reiniciar el Gateway:

| Indicación                                          | Significado                                              |
| --------------------------------------------------- | -------------------------------------------------------- |
| `Restart the gateway to apply.`                     | La ruta modificada requiere un reinicio completo.        |
| `Change will apply without restarting the gateway.` | La recarga en caliente la aplica automáticamente.        |
| `No gateway restart needed.`                        | No se modificó nada relevante para el entorno de ejecución. |

Las escrituras en `plugins.entries` (o en cualquier subruta) siempre requieren un reinicio, ya que la CLI no puede comprobar que estén cargados los metadatos de recarga de todos los plugins.

## Seguridad de escritura

`openclaw config set` y otros escritores de configuración propiedad de OpenClaw validan la configuración completa posterior al cambio antes de guardarla en el disco. Si la nueva carga útil no supera la validación del esquema o parece una sobrescritura destructiva, la configuración activa se conserva intacta y la carga útil rechazada se guarda junto a ella como `openclaw.json.rejected.*`.

Las escrituras propiedad de OpenClaw vuelven a serializar JSON5 como JSON estándar. Cuando la fuente contiene comentarios, el escritor muestra una advertencia inmediatamente antes de eliminarlos; utilice un editor directamente cuando sea importante conservarlos.

<Warning>
La ruta de configuración activa debe ser un archivo normal. No se admiten escrituras en estructuras de `openclaw.json` con enlaces simbólicos; utilice `OPENCLAW_CONFIG_PATH` para apuntar directamente al archivo real.
</Warning>

Es preferible utilizar escrituras de la CLI para modificaciones pequeñas:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Si se rechaza una escritura, examine la carga útil guardada y corrija la estructura completa de la configuración:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Las escrituras directas con un editor siguen estando permitidas, pero el Gateway en ejecución las considera no fiables hasta que se validan. Las modificaciones directas no válidas impiden el inicio o se omiten durante la recarga en caliente; el Gateway no vuelve a escribir `openclaw.json`. Ejecute `openclaw doctor --fix` para reparar una configuración con prefijos o sobrescrita, o para restaurar la última copia válida conocida. Consulte [Solución de problemas del Gateway](/es/gateway/troubleshooting#gateway-rejected-invalid-config).

La recuperación del archivo completo se reserva para las reparaciones de doctor. Los cambios en el esquema de los plugins o las discrepancias de `minHostVersion` siguen generando errores explícitos en lugar de revertir opciones de configuración del usuario no relacionadas, como modelos, proveedores, perfiles de autenticación, canales, exposición del Gateway, herramientas, memoria, navegador o configuración de Cron.

## Ciclo de reparación

Después de que `openclaw config validate` se complete correctamente, utilice la TUI local para que un agente integrado compare la configuración activa con la documentación mientras valida cada cambio desde el mismo terminal:

```bash
openclaw chat
```

Dentro de la TUI, un `!` inicial ejecuta un comando literal del shell local (después de una solicitud de confirmación que aparece una sola vez por sesión):

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

<Steps>
  <Step title="Comparar con la documentación">
    Pida al agente que compare la configuración actual con la página correspondiente de la documentación y sugiera la corrección más pequeña.
  </Step>
  <Step title="Aplicar modificaciones específicas">
    Aplique modificaciones específicas con `openclaw config set` o `openclaw configure`.
  </Step>
  <Step title="Volver a validar">
    Vuelva a ejecutar `openclaw config validate` después de cada cambio.
  </Step>
  <Step title="Usar doctor para problemas del entorno de ejecución">
    Si la validación se completa correctamente, pero el entorno de ejecución sigue en mal estado, ejecute `openclaw doctor` o `openclaw doctor --fix` para obtener ayuda con la migración y la reparación.
  </Step>
</Steps>

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Configuración](/es/gateway/configuration)

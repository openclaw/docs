---
read_when:
    - Se desea leer o editar la configuración de forma no interactiva
sidebarTitle: Config
summary: Referencia de la CLI para `openclaw config` (get/set/patch/unset/file/schema/validate)
title: Configuración
x-i18n:
    generated_at: "2026-07-12T14:22:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1a9531407b2314d1a6bc05a87eb7efb6c37a847378b150125693f4d59733a2e9
    source_path: cli/config.md
    workflow: 16
---

Asistentes no interactivos para `openclaw.json`: obtener, establecer, aplicar parches o eliminar un valor mediante una ruta, imprimir el esquema, validar o imprimir la ruta del archivo activo. Ejecute `openclaw config` sin subcomandos para abrir el mismo asistente guiado que `openclaw configure`.

<Note>
Cuando `OPENCLAW_NIX_MODE=1`, OpenClaw trata `openclaw.json` como inmutable. Los comandos de solo lectura (`config get`, `config file`, `config schema`, `config validate`) siguen funcionando; los comandos que escriben la configuración se rechazan. En su lugar, edite el código fuente de Nix de la instalación; para la distribución oficial nix-openclaw, use el [inicio rápido de nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) y establezca los valores en `programs.openclaw.config` o `instances.<name>.config`.
</Note>

## Opciones raíz

<ParamField path="--section <section>" type="string">
  Filtro repetible de secciones de configuración guiada cuando se ejecuta `openclaw config` sin subcomandos.
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

Notación con puntos o corchetes. Encierre entre comillas las rutas con corchetes en los ejemplos del shell para que zsh no expanda `[0]` como un patrón glob:

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

Imprime en stdout el esquema JSON generado para `openclaw.json`.

<AccordionGroup>
  <Accordion title="Qué incluye">
    - El esquema actual de la configuración raíz, además de un campo de cadena `$schema` en la raíz para las herramientas del editor.
    - Metadatos de documentación `title` / `description` de los campos utilizados por la interfaz de control.
    - Los nodos de objetos anidados, comodines (`*`) y elementos de arreglos (`[]`) heredan los mismos metadatos `title` / `description` cuando existen documentos de campo coincidentes.
    - Las ramas `anyOf` / `oneOf` / `allOf` también heredan los mismos metadatos de documentación.
    - Metadatos del esquema de plugins y canales activos, según el mejor esfuerzo, cuando se pueden cargar los manifiestos en tiempo de ejecución.
    - Un esquema alternativo limpio incluso cuando la configuración actual no es válida.

  </Accordion>
  <Accordion title="RPC relacionado en tiempo de ejecución">
    `config.schema.lookup` devuelve una ruta de configuración normalizada con un nodo de esquema superficial (`title`, `description`, `type`, `enum`, `const`, límites comunes), los metadatos de sugerencias de la interfaz coincidentes y resúmenes de sus elementos secundarios inmediatos. Úselo para explorar en profundidad una ruta específica en la interfaz de control o en clientes personalizados.
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

Los valores se analizan como JSON5 cuando es posible; de lo contrario, se tratan como cadenas sin procesar. Use `--strict-json` para exigir JSON estándar sin recurrir a una cadena (en ese caso, se rechaza la sintaxis exclusiva de JSON5, como comentarios, comas finales o claves sin comillas). `--json` es un alias heredado de `--strict-json` en `config set`.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` imprime el valor sin procesar como JSON en lugar de texto con formato para la terminal.

<Note>
De forma predeterminada, la asignación de objetos sustituye la ruta de destino. Las rutas protegidas que suelen contener entradas añadidas por el usuario rechazan las sustituciones que eliminarían entradas existentes, salvo que se proporcione `--replace`: `agents.defaults.models`, `agents.list`, `models.providers`, `models.providers.<id>`, `models.providers.<id>.models`, `plugins.entries` y `auth.profiles`.
</Note>

Use `--merge` al añadir entradas a esos mapas:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Use `--replace` solo cuando el valor proporcionado deba convertirse intencionadamente en el valor completo del destino.

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
Las asignaciones de SecretRef se rechazan en superficies modificables en tiempo de ejecución que no las admiten (por ejemplo, `hooks.token`, `commands.ownerDisplaySecret`, los tokens de Webhook para vincular hilos de Discord y el JSON de credenciales de WhatsApp). Consulte [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface).
</Warning>

El análisis por lotes siempre usa la carga útil del lote (`--batch-json`/`--batch-file`) como fuente de verdad; `--strict-json` / `--json` no modifican el comportamiento del análisis por lotes.

El modo de ruta/valor JSON también funciona directamente con SecretRefs y proveedores:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### Opciones de creación de proveedores

Los destinos del creador de proveedores deben usar `secrets.providers.<alias>` como ruta.

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

Pegue o canalice mediante una tubería un parche JSON5 con la forma de una configuración, en lugar de ejecutar muchos comandos `config set` basados en rutas. Los objetos se combinan de forma recursiva; los arreglos y los valores escalares sustituyen el destino; `null` elimina la ruta de destino.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Canalice un parche mediante stdin para los scripts de configuración remota:

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

Use `--replace-path <path>` cuando un objeto o arreglo deba convertirse exactamente en el valor proporcionado, en lugar de recibir un parche recursivo:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` ejecuta comprobaciones del esquema y de la capacidad de resolución de SecretRef sin escribir. De forma predeterminada, durante la ejecución de prueba se omiten las SecretRefs respaldadas por ejecución; añada `--allow-exec` cuando desee intencionadamente que la ejecución de prueba ejecute comandos de proveedores.

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
  <Accordion title="Comportamiento de ejecución de prueba">
    - Modo de constructor: ejecuta comprobaciones de resolubilidad de SecretRef para las referencias o proveedores modificados.
    - Modo JSON (`--strict-json`, `--json` o modo por lotes): ejecuta la validación del esquema y comprobaciones de resolubilidad de SecretRef.
    - La validación de políticas se ejecuta sobre la configuración completa posterior al cambio, por lo que las escrituras de objetos principales (por ejemplo, establecer `hooks` como objeto) no pueden eludir la validación de superficies no compatibles.
    - Las comprobaciones de SecretRef de tipo exec se omiten de forma predeterminada para evitar efectos secundarios de los comandos; pase `--allow-exec` para habilitarlas (esto puede ejecutar comandos del proveedor). `--allow-exec` solo puede usarse en ejecuciones de prueba y genera un error sin `--dry-run`.

  </Accordion>
  <Accordion title="Campos de --dry-run --json">
    - `ok`: indica si la ejecución de prueba se completó correctamente
    - `operations`: número de asignaciones evaluadas
    - `checks`: indica si se ejecutaron las comprobaciones de esquema y resolubilidad
    - `checks.resolvabilityComplete`: indica si las comprobaciones de resolubilidad se ejecutaron hasta completarse (es falso cuando se omiten las referencias de tipo exec)
    - `refsChecked`: número de referencias resueltas realmente durante la ejecución de prueba
    - `skippedExecRefs`: número de referencias de tipo exec omitidas porque no se especificó `--allow-exec`
    - `errors`: errores estructurados de rutas inexistentes, esquema o resolubilidad cuando `ok=false`

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
      ref?: string, // presente para errores de resolubilidad
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
  <Accordion title="Si la ejecución de prueba falla">
    - `config schema validation failed`: la estructura de la configuración posterior al cambio no es válida; corrija la ruta o el valor, o la estructura del objeto de proveedor o referencia.
    - `Config policy validation failed: unsupported SecretRef usage`: vuelva a introducir esa credencial como texto sin formato o cadena; use SecretRefs únicamente en las superficies compatibles.
    - `SecretRef assignment(s) could not be resolved`: el proveedor o la referencia indicados no se pueden resolver actualmente (variable de entorno inexistente, puntero de archivo no válido, error del proveedor exec o discrepancia entre el proveedor y la fuente).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: vuelva a ejecutar con `--allow-exec` si necesita validar la resolubilidad de exec.
    - En el modo por lotes, corrija las entradas con errores y vuelva a ejecutar `--dry-run` antes de escribir.

  </Accordion>
</AccordionGroup>

## Aplicación de cambios

Después de cada ejecución correcta de `config set`, `config patch` o `config unset`, la CLI muestra una de estas tres indicaciones para informar de si es necesario reiniciar el Gateway:

| Indicación                                          | Significado                                                   |
| --------------------------------------------------- | ------------------------------------------------------------- |
| `Restart the gateway to apply.`                     | La ruta modificada requiere un reinicio completo.             |
| `Change will apply without restarting the gateway.` | La recarga en caliente la aplica automáticamente.             |
| `No gateway restart needed.`                        | No se ha modificado nada relevante para el entorno de ejecución. |

Las escrituras en `plugins.entries` (o en cualquier subruta) siempre requieren un reinicio, ya que la CLI no puede comprobar que estén cargados los metadatos de recarga de todos los plugins.

## Seguridad de escritura

`openclaw config set` y los demás escritores de configuración propios de OpenClaw validan la configuración completa posterior al cambio antes de guardarla en el disco. Si la nueva carga útil no supera la validación del esquema o parece una sobrescritura destructiva, la configuración activa se deja intacta y la carga útil rechazada se guarda junto a ella como `openclaw.json.rejected.*`.

<Warning>
La ruta de configuración activa debe ser un archivo normal. No se admiten escrituras en configuraciones donde `openclaw.json` sea un enlace simbólico; en su lugar, use `OPENCLAW_CONFIG_PATH` para apuntar directamente al archivo real.
</Warning>

Para cambios pequeños, se recomienda escribir mediante la CLI:

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

También se permiten las escrituras directas con un editor, pero el Gateway en ejecución las trata como no confiables hasta que superan la validación. Las modificaciones directas no válidas impiden el inicio o se omiten durante la recarga en caliente; el Gateway no vuelve a escribir `openclaw.json`. Ejecute `openclaw doctor --fix` para reparar una configuración con prefijos o sobrescrita, o para restaurar la última copia válida conocida. Consulte [Solución de problemas del Gateway](/es/gateway/troubleshooting#gateway-rejected-invalid-config).

La recuperación del archivo completo se reserva para las reparaciones de doctor. Los cambios en el esquema de los plugins o las discrepancias de `minHostVersion` generan errores explícitos en lugar de revertir otros ajustes del usuario no relacionados, como la configuración de modelos, proveedores, perfiles de autenticación, canales, exposición del Gateway, herramientas, memoria, navegador o Cron.

## Ciclo de reparación

Después de que `openclaw config validate` se complete correctamente, use la TUI local para que un agente integrado compare la configuración activa con la documentación mientras valida cada cambio desde el mismo terminal:

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
    Pida al agente que compare la configuración actual con la página de documentación correspondiente y sugiera la corrección más pequeña.
  </Step>
  <Step title="Aplicar modificaciones específicas">
    Aplique modificaciones específicas con `openclaw config set` o `openclaw configure`.
  </Step>
  <Step title="Volver a validar">
    Vuelva a ejecutar `openclaw config validate` después de cada cambio.
  </Step>
  <Step title="Usar doctor para problemas del entorno de ejecución">
    Si la validación se completa correctamente, pero el entorno de ejecución sigue sin funcionar correctamente, ejecute `openclaw doctor` o `openclaw doctor --fix` para obtener ayuda con la migración y la reparación.
  </Step>
</Steps>

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Configuración](/es/gateway/configuration)

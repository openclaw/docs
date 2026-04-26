---
read_when:
    - Quieres leer o editar la configuración de forma no interactiva
sidebarTitle: Config
summary: Referencia de CLI para `openclaw config` (`get`/`set`/`unset`/`file`/`schema`/`validate`)
title: Configuración
x-i18n:
    generated_at: "2026-04-26T11:25:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7871ee03a1da6ab5d0881ace7579ce101a89e9f9d05d1a720ff34fd31fa12a9d
    source_path: cli/config.md
    workflow: 15
---

Utilidades de configuración para ediciones no interactivas en `openclaw.json`: obtener/establecer/eliminar/archivo/esquema/validar valores por ruta e imprimir el archivo de configuración activo. Ejecútalo sin un subcomando para abrir el asistente de configuración (igual que `openclaw configure`).

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
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Imprime el esquema JSON generado para `openclaw.json` en stdout como JSON.

<AccordionGroup>
  <Accordion title="Qué incluye">
    - El esquema actual de configuración raíz, más un campo de cadena `$schema` en la raíz para herramientas del editor.
    - Los metadatos de documentación de los campos `title` y `description` usados por la Control UI.
    - Los nodos de objeto anidado, comodín (`*`) y elemento de matriz (`[]`) heredan los mismos metadatos `title` / `description` cuando existe documentación de campo coincidente.
    - Las ramas `anyOf` / `oneOf` / `allOf` también heredan los mismos metadatos de documentación cuando existe documentación de campo coincidente.
    - Metadatos de esquema de Plugin + canal en vivo en el mejor esfuerzo cuando se pueden cargar los manifiestos del runtime.
    - Un esquema de respaldo limpio incluso cuando la configuración actual no es válida.
  </Accordion>
  <Accordion title="RPC de runtime relacionado">
    `config.schema.lookup` devuelve una ruta de configuración normalizada con un nodo de esquema superficial (`title`, `description`, `type`, `enum`, `const`, límites comunes), metadatos coincidentes de pistas de UI y resúmenes de hijos inmediatos. Úsalo para un análisis detallado con alcance por ruta en Control UI o clientes personalizados.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Redirígelo a un archivo cuando quieras inspeccionarlo o validarlo con otras herramientas:

```bash
openclaw config schema > openclaw.schema.json
```

### Rutas

Las rutas usan notación con puntos o corchetes:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Usa el índice de la lista de agentes para apuntar a un agente específico:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Valores

Los valores se analizan como JSON5 cuando es posible; en caso contrario, se tratan como cadenas. Usa `--strict-json` para exigir análisis JSON5. `--json` sigue siendo compatible como alias heredado.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` imprime el valor sin procesar como JSON en lugar de texto con formato para terminal.

<Note>
La asignación de objetos reemplaza la ruta de destino de forma predeterminada. Las rutas protegidas de mapa/lista que suelen contener entradas añadidas por el usuario, como `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` y `auth.profiles`, rechazan reemplazos que eliminarían entradas existentes a menos que pases `--replace`.
</Note>

Usa `--merge` al añadir entradas a esos mapas:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Usa `--replace` solo cuando quieras intencionadamente que el valor proporcionado se convierta en el valor completo de destino.

## Modos de `config set`

`openclaw config set` admite cuatro estilos de asignación:

<Tabs>
  <Tab title="Modo valor">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="Modo constructor de SecretRef">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Modo constructor de proveedor">
    El modo constructor de proveedor apunta solo a rutas `secrets.providers.<alias>`:

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
Las asignaciones de SecretRef se rechazan en superficies mutables del runtime no compatibles (por ejemplo `hooks.token`, `commands.ownerDisplaySecret`, tokens de Webhook de vinculación de hilos de Discord y JSON de credenciales de WhatsApp). Consulta [Superficie de credenciales de SecretRef](/es/reference/secretref-credential-surface).
</Warning>

El análisis por lotes siempre usa la carga del lote (`--batch-json`/`--batch-file`) como fuente de verdad. `--strict-json` / `--json` no cambian el comportamiento del análisis por lotes.

El modo JSON path/value sigue siendo compatible tanto para SecretRefs como para proveedores:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Indicadores del constructor de proveedor

Los destinos del constructor de proveedor deben usar `secrets.providers.<alias>` como ruta.

<AccordionGroup>
  <Accordion title="Indicadores comunes">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)
  </Accordion>
  <Accordion title="Proveedor Env (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (repetible)
  </Accordion>
  <Accordion title="Proveedor File (--provider-source file)">
    - `--provider-path <path>` (obligatorio)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`
  </Accordion>
  <Accordion title="Proveedor Exec (--provider-source exec)">
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

Ejemplo reforzado de proveedor exec:

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

## Ejecución de prueba

Usa `--dry-run` para validar cambios sin escribir en `openclaw.json`.

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
  <Accordion title="Comportamiento de dry-run">
    - Modo constructor: ejecuta comprobaciones de capacidad de resolución de SecretRef para refs/proveedores modificados.
    - Modo JSON (`--strict-json`, `--json` o modo por lotes): ejecuta validación de esquema más comprobaciones de capacidad de resolución de SecretRef.
    - La validación de políticas también se ejecuta para superficies de destino de SecretRef conocidas como no compatibles.
    - Las comprobaciones de políticas evalúan la configuración completa posterior al cambio, por lo que las escrituras de objetos padre (por ejemplo, establecer `hooks` como objeto) no pueden omitir la validación de superficies no compatibles.
    - Las comprobaciones de SecretRef exec se omiten de forma predeterminada durante `dry-run` para evitar efectos secundarios de comandos.
    - Usa `--allow-exec` con `--dry-run` para activar las comprobaciones de SecretRef exec (esto puede ejecutar comandos del proveedor).
    - `--allow-exec` es solo para `dry-run` y da error si se usa sin `--dry-run`.
  </Accordion>
  <Accordion title="Campos de --dry-run --json">
    `--dry-run --json` imprime un informe legible por máquina:

    - `ok`: si `dry-run` se aprobó
    - `operations`: número de asignaciones evaluadas
    - `checks`: si se ejecutaron comprobaciones de esquema/capacidad de resolución
    - `checks.resolvabilityComplete`: si las comprobaciones de capacidad de resolución se completaron (false cuando se omiten refs exec)
    - `refsChecked`: número de refs realmente resueltas durante `dry-run`
    - `skippedExecRefs`: número de refs exec omitidas porque no se configuró `--allow-exec`
    - `errors`: fallos estructurados de esquema/capacidad de resolución cuando `ok=false`

  </Accordion>
</AccordionGroup>

### Forma de salida JSON

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "schema" | "resolvability",
      message: string,
      ref?: string, // presente para errores de capacidad de resolución
    },
  ],
}
```

<Tabs>
  <Tab title="Ejemplo correcto">
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
          "message": "Error: La variable de entorno \"MISSING_TEST_SECRET\" no está configurada.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Si dry-run falla">
    - `config schema validation failed`: la forma de tu configuración después del cambio no es válida; corrige la ruta/valor o la forma del objeto provider/ref.
    - `Config policy validation failed: unsupported SecretRef usage`: devuelve esa credencial a una entrada de texto sin formato/cadena y mantén los SecretRefs solo en superficies compatibles.
    - `SecretRef assignment(s) could not be resolved`: el provider/ref referenciado no puede resolverse actualmente (variable de entorno ausente, puntero de archivo no válido, fallo del provider exec o incompatibilidad entre provider/source).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: `dry-run` omitió refs exec; vuelve a ejecutar con `--allow-exec` si necesitas validación de capacidad de resolución exec.
    - En modo por lotes, corrige las entradas con error y vuelve a ejecutar `--dry-run` antes de escribir.
  </Accordion>
</AccordionGroup>

## Seguridad de escritura

`openclaw config set` y otros escritores de configuración propiedad de OpenClaw validan toda la configuración posterior al cambio antes de confirmarla en disco. Si la nueva carga falla la validación del esquema o parece una sobrescritura destructiva, la configuración activa no se modifica y la carga rechazada se guarda a su lado como `openclaw.json.rejected.*`.

<Warning>
La ruta de la configuración activa debe ser un archivo regular. Los diseños de `openclaw.json` con symlink no son compatibles para escrituras; usa `OPENCLAW_CONFIG_PATH` para apuntar directamente al archivo real.
</Warning>

Prefiere escrituras por CLI para ediciones pequeñas:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Si se rechaza una escritura, inspecciona la carga guardada y corrige la forma completa de la configuración:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Las escrituras directas en el editor siguen estando permitidas, pero el Gateway en ejecución las trata como no confiables hasta que validen. Las ediciones directas no válidas pueden restaurarse desde la copia de seguridad de último estado válido durante el inicio o la recarga en caliente. Consulta [Solución de problemas del Gateway](/es/gateway/troubleshooting#gateway-restored-last-known-good-config).

La recuperación del archivo completo se reserva para configuraciones globalmente rotas, como errores de análisis, fallos del esquema en la raíz, fallos de migración heredada o fallos mixtos de Plugin y raíz. Si la validación falla solo en `plugins.entries.<id>...`, OpenClaw mantiene el `openclaw.json` activo en su lugar e informa del problema local del Plugin en vez de restaurar `.last-good`. Esto evita que cambios en el esquema del Plugin o discrepancias de `minHostVersion` reviertan ajustes del usuario no relacionados, como modelos, providers, perfiles de autenticación, canales, exposición del Gateway, herramientas, memoria, navegador o configuración de Cron.

## Subcomandos

- `config file`: imprime la ruta del archivo de configuración activo (resuelta desde `OPENCLAW_CONFIG_PATH` o la ubicación predeterminada). La ruta debe nombrar un archivo regular, no un symlink.

Reinicia el Gateway después de las ediciones.

## Validar

Valida la configuración actual con el esquema activo sin iniciar el Gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Después de que `openclaw config validate` pase correctamente, puedes usar la TUI local para que un agente integrado compare la configuración activa con la documentación mientras validas cada cambio desde la misma terminal:

<Note>
Si la validación ya está fallando, empieza con `openclaw configure` o `openclaw doctor --fix`. `openclaw chat` no omite la protección contra configuración no válida.
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

Bucle típico de reparación:

<Steps>
  <Step title="Comparar con la documentación">
    Pide al agente que compare tu configuración actual con la página de documentación pertinente y sugiera la corrección más pequeña posible.
  </Step>
  <Step title="Aplicar ediciones específicas">
    Aplica ediciones específicas con `openclaw config set` o `openclaw configure`.
  </Step>
  <Step title="Volver a validar">
    Vuelve a ejecutar `openclaw config validate` después de cada cambio.
  </Step>
  <Step title="Doctor para problemas de runtime">
    Si la validación pasa pero el runtime sigue sin estar en buen estado, ejecuta `openclaw doctor` o `openclaw doctor --fix` para obtener ayuda con migración y reparación.
  </Step>
</Steps>

## Relacionado

- [Referencia de CLI](/es/cli)
- [Configuración](/es/gateway/configuration)

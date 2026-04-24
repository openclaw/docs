---
read_when:
    - Quieres cambiar los modelos predeterminados o ver el estado de autenticación del proveedor
    - Quieres escanear modelos/proveedores disponibles y depurar perfiles de autenticación
summary: Referencia de la CLI para `openclaw models` (status/list/set/scan, alias, alternativas, autenticación)
title: Modelos
x-i18n:
    generated_at: "2026-04-24T05:23:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08e04342ef240bf7a1f60c4d4e2667d17c9a97e985c1b170db8538c890dc8119
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Descubrimiento, escaneo y configuración de modelos (modelo predeterminado, alternativas, perfiles de autenticación).

Relacionado:

- Proveedores + modelos: [Modelos](/es/providers/models)
- Conceptos de selección de modelos + comando con barra diagonal `/models`: [Concepto de modelos](/es/concepts/models)
- Configuración de autenticación del proveedor: [Primeros pasos](/es/start/getting-started)

## Comandos comunes

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` muestra el valor resuelto de predeterminado/alternativas junto con un resumen de autenticación.
Cuando hay disponibles instantáneas de uso del proveedor, la sección de estado de OAuth/clave API incluye
ventanas de uso del proveedor e instantáneas de cuota.
Proveedores actuales con ventana de uso: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi y z.ai. La autenticación de uso proviene de hooks específicos
del proveedor cuando están disponibles; en caso contrario, OpenClaw recurre a la coincidencia de
credenciales OAuth/clave API desde perfiles de autenticación, entorno o configuración.
En la salida `--json`, `auth.providers` es el resumen del proveedor con reconocimiento de
entorno/configuración/almacén, mientras que `auth.oauth` es solo el estado de salud del perfil del almacén de autenticación.
Agrega `--probe` para ejecutar sondas de autenticación en vivo contra cada perfil de proveedor configurado.
Las sondas son solicitudes reales (pueden consumir tokens y activar límites de tasa).
Usa `--agent <id>` para inspeccionar el estado de modelo/autenticación de un agente configurado. Si se omite,
el comando usa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` si están definidos; de lo contrario usa el
agente predeterminado configurado.
Las filas de sonda pueden provenir de perfiles de autenticación, credenciales de entorno o `models.json`.

Notas:

- `models set <model-or-alias>` acepta `provider/model` o un alias.
- `models list` es de solo lectura: lee configuración, perfiles de autenticación, el estado
  actual del catálogo y filas de catálogo propiedad del proveedor, pero no reescribe
  `models.json`.
- `models list --all` incluye filas de catálogo estático incluidas y propiedad del proveedor incluso
  cuando todavía no te has autenticado con ese proveedor. Esas filas seguirán mostrándose
  como no disponibles hasta que se configure la autenticación correspondiente.
- `models list --provider <id>` filtra por id de proveedor, como `moonshot` u
  `openai-codex`. No acepta etiquetas de visualización de selectores interactivos
  de proveedor, como `Moonshot AI`.
- Las referencias de modelo se analizan dividiendo en el **primer** `/`. Si el ID del modelo incluye `/` (estilo OpenRouter), incluye el prefijo del proveedor (ejemplo: `openrouter/moonshotai/kimi-k2`).
- Si omites el proveedor, OpenClaw resuelve primero la entrada como alias, luego
  como coincidencia única de proveedor configurado para ese id exacto de modelo, y solo después
  recurre al proveedor predeterminado configurado con una advertencia de desaprobación.
  Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw
  recurre al primer proveedor/modelo configurado en lugar de mostrar un
  valor predeterminado obsoleto de proveedor eliminado.
- `models status` puede mostrar `marker(<value>)` en la salida de autenticación para marcadores no secretos (por ejemplo `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) en lugar de enmascararlos como secretos.

### `models status`

Opciones:

- `--json`
- `--plain`
- `--check` (código de salida 1=falta/caducado, 2=próximo a caducar)
- `--probe` (sonda en vivo de perfiles de autenticación configurados)
- `--probe-provider <name>` (sondear un proveedor)
- `--probe-profile <id>` (repetible o ids separados por comas)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id de agente configurado; sobrescribe `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Categorías de estado de sonda:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Casos de detalle/código de motivo de sonda esperables:

- `excluded_by_auth_order`: existe un perfil almacenado, pero `auth.order.<provider>`
  explícito lo omitió, por lo que la sonda informa la exclusión en lugar de
  intentarlo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  el perfil está presente, pero no es apto/no se puede resolver.
- `no_model`: existe autenticación del proveedor, pero OpenClaw no pudo resolver
  un modelo candidato apto para sonda para ese proveedor.

## Alias + alternativas

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Perfiles de autenticación

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` es el ayudante interactivo de autenticación. Puede iniciar un flujo de autenticación del proveedor
(OAuth/clave API) o guiarte hacia el pegado manual del token, según el
proveedor que elijas.

`models auth login` ejecuta el flujo de autenticación de un Plugin de proveedor
(OAuth/clave API). Usa `openclaw plugins list` para ver qué proveedores están instalados.

Ejemplos:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Notas:

- `setup-token` y `paste-token` siguen siendo comandos de token genéricos para proveedores
  que exponen métodos de autenticación por token.
- `setup-token` requiere una TTY interactiva y ejecuta el método de autenticación por token del proveedor
  (usando por defecto el método `setup-token` de ese proveedor cuando expone
  uno).
- `paste-token` acepta una cadena de token generada en otro lugar o desde automatización.
- `paste-token` requiere `--provider`, solicita el valor del token y lo escribe
  en el id de perfil predeterminado `<provider>:manual` a menos que pases
  `--profile-id`.
- `paste-token --expires-in <duration>` guarda una caducidad absoluta del token a partir de una
  duración relativa como `365d` o `12h`.
- Nota sobre Anthropic: el personal de Anthropic nos dijo que el uso estilo Claude CLI de OpenClaw vuelve a estar permitido, por lo que OpenClaw considera que la reutilización de Claude CLI y el uso de `claude -p` están autorizados para esta integración, salvo que Anthropic publique una nueva política.
- `setup-token` / `paste-token` de Anthropic siguen disponibles como una ruta de token compatible de OpenClaw, pero OpenClaw ahora prefiere la reutilización de Claude CLI y `claude -p` cuando están disponibles.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Selección de modelos](/es/concepts/model-providers)
- [Conmutación por error de modelos](/es/concepts/model-failover)

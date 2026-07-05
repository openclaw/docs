---
read_when:
    - Quieres una configuración guiada para Gateway, espacio de trabajo, autenticación, canales y Skills
summary: Referencia de CLI para `openclaw onboard` (incorporación interactiva)
title: Incorporación
x-i18n:
    generated_at: "2026-07-05T11:11:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 45cd22d23b9e3121a75c7695568cc6a03381daa6e56a64b36f407605bb4d1732
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Configuración guiada para autenticación de modelos, espacio de trabajo, Gateway, canales, Skills y estado en un solo flujo. `openclaw setup` es el mismo punto de entrada; `openclaw setup --baseline` solo escribe la configuración/espacio de trabajo base.

<CardGroup cols={2}>
  <Card title="Centro de incorporación de CLI" href="/es/start/wizard" icon="rocket">
    Recorrido del flujo interactivo de CLI.
  </Card>
  <Card title="Descripción general de la incorporación" href="/es/start/onboarding-overview" icon="map">
    Cómo encaja la incorporación de OpenClaw.
  </Card>
  <Card title="Referencia de configuración de CLI" href="/es/start/wizard-cli-reference" icon="book">
    Salidas, aspectos internos y comportamiento por paso.
  </Card>
  <Card title="Automatización de CLI" href="/es/start/wizard-cli-automation" icon="terminal">
    Flags no interactivos y configuraciones con scripts.
  </Card>
  <Card title="Incorporación de la app de macOS" href="/es/start/onboarding" icon="apple">
    Flujo de incorporación para la app de barra de menús de macOS.
  </Card>
</CardGroup>

## Ejemplos

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

- `--flow quickstart`: prompts mínimos, genera automáticamente un token de Gateway.
- `--flow manual` (alias `advanced`): prompts completos para puerto, enlace y autenticación.
- `--flow import`: ejecuta un proveedor de migración detectado (por ejemplo, Hermes mediante `--import-from hermes`), previsualiza el plan y luego lo aplica tras la confirmación. La importación solo se ejecuta sobre una configuración nueva de OpenClaw: primero restablece la configuración, las credenciales, las sesiones y el estado del espacio de trabajo si existen. Usa [`openclaw migrate`](/es/cli/migrate) para planes de simulación, modo de sobrescritura, informes y asignaciones exactas.
- `--modern` inicia el asistente conversacional de configuración/reparación Crestodian en lugar del flujo clásico.

En una terminal interactiva, `openclaw` sin más (sin subcomando) enruta según el estado de la configuración:

- Si falta el archivo de configuración activo o no tiene ajustes escritos (vacío o solo con metadatos), inicia este flujo clásico de incorporación.
- Si el archivo de configuración existe pero falla la validación, inicia [Crestodian](/es/cli/crestodian) para repararlo.
- Si el archivo de configuración es válido, abre la TUI normal del agente, ya sea localmente o conectada a un Gateway configurado alcanzable. En una instalación configurada, accede a Crestodian con `/crestodian` dentro de la TUI o `openclaw crestodian`.

Se acepta `ws://` en texto plano para loopback, literales de IP privadas, `.local` y URL de Gateway de Tailnet `*.ts.net`. Para otros nombres DNS privados de confianza, establece `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` en el entorno del proceso de incorporación.

## Restablecimiento

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset` borra el estado antes de ejecutar la configuración. `--reset-scope` controla cuánto: `config` (solo configuración), `config+creds+sessions` (valor predeterminado cuando se pasa `--reset` sin un alcance) o `full` (también restablece el espacio de trabajo). El restablecimiento del espacio de trabajo solo ocurre con `--reset-scope full`.

## Configuración regional

La incorporación interactiva usa la configuración regional del asistente de CLI para el texto fijo de configuración. Orden de resolución:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Fallback a inglés

Las configuraciones regionales compatibles del asistente son `en`, `zh-CN` y `zh-TW`. Los valores de configuración regional pueden usar guion bajo o formas con sufijo POSIX, como `zh_CN.UTF-8`. Los nombres de producto, nombres de comandos, claves de configuración, URL, ID de proveedor, ID de modelo y etiquetas de Plugin/canal permanecen literales.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

## Configuración no interactiva

`--non-interactive` requiere `--accept-risk` (reconoce que los agentes son potentes y que el acceso completo al sistema es riesgoso). `--mode` usa `local` de forma predeterminada.

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

`--custom-api-key` es opcional; si se omite, la incorporación comprueba `CUSTOM_API_KEY` en el entorno. OpenClaw marca automáticamente como compatibles con imágenes los ID comunes de modelos de visión (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral y similares). Pasa `--custom-image-input` para ID de visión personalizados desconocidos, o `--custom-text-input` para forzar metadatos solo de texto. Usa `--custom-compatibility openai-responses` para endpoints compatibles con OpenAI que admiten `/v1/responses` pero no `/v1/chat/completions`; los valores válidos son `openai` (predeterminado), `openai-responses`, `anthropic`.

LM Studio también tiene un flag de clave específico del proveedor:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Ollama no interactivo:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` usa `http://127.0.0.1:11434` de forma predeterminada. `--custom-model-id` es opcional; si se omite, la incorporación usa los valores predeterminados sugeridos por Ollama. Los ID de modelos en la nube como `kimi-k2.5:cloud` también funcionan aquí.

Almacena las claves de proveedor como referencias en lugar de texto plano:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Con `--secret-input-mode ref`, la incorporación escribe referencias respaldadas por variables de entorno en lugar de valores de claves en texto sin formato: para proveedores respaldados por perfiles de autenticación, esto escribe `keyRef: { source: "env", provider: "default", id: <envVar> }`; para proveedores personalizados, escribe `models.providers.<id>.apiKey` de la misma manera (por ejemplo, `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`). Contrato: define la variable de entorno del proveedor en el entorno del proceso de incorporación (por ejemplo, `OPENAI_API_KEY`) y no pases también una bandera de clave en línea a menos que esa variable de entorno esté definida; un valor de bandera sin la variable de entorno correspondiente falla rápidamente con orientación.

### Autenticación de Gateway (no interactiva)

- `--gateway-auth token --gateway-token <token>` almacena un token en texto sin formato. `token` es el modo de autenticación predeterminado.
- `--gateway-auth token --gateway-token-ref-env <name>` almacena `gateway.auth.token` como una SecretRef de entorno. Requiere una variable de entorno no vacía con ese nombre en el entorno del proceso de incorporación.
- `--gateway-token` y `--gateway-token-ref-env` son mutuamente excluyentes.
- Con `--install-daemon`: un `gateway.auth.token` administrado mediante SecretRef se valida, pero no se conserva como texto sin formato resuelto en los metadatos del entorno del servicio supervisor; si la referencia no se puede resolver, la instalación falla de forma cerrada con orientación de corrección. Si `gateway.auth.token` y `gateway.auth.password` están configurados y `gateway.auth.mode` no está definido, la instalación se bloquea hasta que el modo se defina explícitamente.
- La incorporación local escribe `gateway.mode="local"` en la configuración. Un archivo de configuración posterior al que le falte `gateway.mode` indica daño en la configuración o una edición manual incompleta, no un acceso directo válido de modo local.
- La incorporación local instala los plugins descargables que requiere la ruta de configuración elegida (por ejemplo, un plugin de runtime de Codex o Copilot para esas opciones de autenticación). La incorporación remota solo escribe la información de conexión para el Gateway remoto; nunca instala paquetes de plugin locales.
- `--allow-unconfigured` es una vía de escape independiente de `openclaw gateway run`; no permite que la incorporación omita `gateway.mode`.

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

### Estado del Gateway local

- A menos que pases `--skip-health`, la incorporación espera a que haya un Gateway local accesible antes de salir correctamente.
- `--install-daemon` inicia primero la ruta de instalación del Gateway administrado. Sin esa opción, ya debe estar ejecutándose un Gateway local (por ejemplo, `openclaw gateway run`).
- `--skip-health` omite la espera si solo quieres escrituras de configuración/espacio de trabajo/arranque en automatización.
- `--skip-bootstrap` define `agents.defaults.skipBootstrap: true` y omite la creación de `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` y `BOOTSTRAP.md`.
- En Windows nativo, `--install-daemon` intenta usar primero Tareas programadas y recurre a un elemento de inicio de sesión en la carpeta Inicio por usuario si se deniega la creación de la tarea.

### Modo de referencia interactivo

- Elige **Usar referencia secreta** cuando se solicite y, después, **Variable de entorno** o un proveedor de secretos configurado (`file` o `exec`).
- La incorporación ejecuta una validación previa rápida antes de guardar la referencia y te permite reintentar si falla.

### Opciones de endpoint de Z.AI

<Note>
`--auth-choice zai-api-key` detecta automáticamente el mejor endpoint y modelo de Z.AI para tu clave: los endpoints de Coding Plan prefieren `zai/glm-5.2` (con reserva a `glm-5.1` si no está disponible); los endpoints generales de API usan `zai/glm-5.1` de forma predeterminada. Para forzar un endpoint de Coding Plan, elige directamente `zai-coding-global` o `zai-coding-cn`.
</Note>

```bash
# Promptless endpoint selection
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Other Z.AI endpoint choices: zai-coding-cn, zai-global, zai-cn
```

Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Banderas no interactivas adicionales

Autenticación de modelos basada en tokens (usada con `--auth-choice token`):

| Bandera                         | Descripción                                                                                                                         |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `--token-provider <id>`         | Id del proveedor de tokens que emite el token                                                                                       |
| `--token <token>`               | Valor del token para la autenticación del modelo                                                                                    |
| `--token-profile-id <id>`       | Id del perfil de autenticación (predeterminado `<provider>:manual`; algunos flujos propiedad del proveedor usan su propio valor predeterminado, como `anthropic:default`) |
| `--token-expires-in <duration>` | Duración opcional de vencimiento del token (p. ej., `365d`, `12h`)                                                                  |

Cloudflare AI Gateway: `--cloudflare-ai-gateway-account-id <id>`, `--cloudflare-ai-gateway-gateway-id <id>`.

Control de instalación del daemon: `--no-install-daemon` / `--skip-daemon` (alias; omiten la instalación del servicio de Gateway), `--daemon-runtime <node|bun>`.

Skills: `--node-manager <npm|pnpm|bun>` (predeterminado `npm`), `--skip-skills`.

Configuración de interfaz de usuario y hooks: `--skip-ui` (omite los avisos de Control UI/TUI), `--skip-hooks` (omite la configuración de Webhook/hook), `--skip-channels`, `--skip-search`.

Salida: `--suppress-gateway-token-output` suprime la salida de Gateway/interfaz de usuario que contiene tokens (pistas de token, URL de inicio de sesión automático con token incrustado y lanzamiento automático de Control UI); resulta útil en terminales compartidas y CI.

<Note>
`--json` no implica modo no interactivo. Usa `--non-interactive` para scripts.
</Note>

## Prefiltrado de proveedores

Cuando una opción de autenticación implica un proveedor preferido, la incorporación prefiltra los selectores de modelo predeterminado y lista de permitidos a los modelos de ese proveedor. El filtro también coincide con otros proveedores propiedad del mismo plugin, lo que cubre variantes de planes de codificación como `volcengine`/`volcengine-plan` y `byteplus`/`byteplus-plan`. Si el filtro de proveedor preferido no devuelve ningún modelo cargado, la incorporación vuelve al catálogo sin filtrar en lugar de dejar vacío el selector.

## Seguimientos de búsqueda web

Algunos proveedores de búsqueda web activan avisos de seguimiento específicos del proveedor durante la incorporación:

- **Grok** puede ofrecer una configuración opcional de `x_search` con la misma autenticación de xAI y una opción de modelo `x_search`.
- **Kimi** puede pedir la región de la API de Moonshot (`api.moonshot.ai` frente a `api.moonshot.cn`) y el modelo predeterminado de búsqueda web de Kimi.

## Otros comportamientos

- Comportamiento del alcance de DM de incorporación local: [referencia de configuración de CLI](/es/start/wizard-cli-reference#outputs-and-internals).
- Primer chat más rápido: `openclaw dashboard` (Control UI, sin configuración de canal).
- Proveedor personalizado: conecta cualquier endpoint compatible con OpenAI o Anthropic, incluidos proveedores alojados no enumerados. Usa la compatibilidad **Desconocida** para detectar automáticamente mediante una prueba en vivo.
- Si se detecta el estado de Hermes, la incorporación ofrece un flujo de migración (consulta `--flow import` arriba).

## Comandos comunes de seguimiento

Usa `openclaw configure` más adelante para cambios específicos y `openclaw channels add` para una configuración solo de canal.

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

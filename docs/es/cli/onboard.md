---
read_when:
    - Desea una configuración guiada para Gateway, espacio de trabajo, autenticación, canales y Skills
summary: Referencia de la CLI para `openclaw onboard` (incorporación interactiva)
title: Incorporación
x-i18n:
    generated_at: "2026-04-24T08:57:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1959ad7014b891230e497a2e0ab494ba316090c81629f25b8147614b694ead5
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Incorporación interactiva para la configuración local o remota de Gateway.

## Guías relacionadas

- Centro de incorporación de la CLI: [Incorporación (CLI)](/es/start/wizard)
- Descripción general de la incorporación: [Descripción general de la incorporación](/es/start/onboarding-overview)
- Referencia de incorporación de la CLI: [Referencia de configuración de la CLI](/es/start/wizard-cli-reference)
- Automatización de la CLI: [Automatización de la CLI](/es/start/wizard-cli-automation)
- Incorporación de macOS: [Incorporación (aplicación de macOS)](/es/start/onboarding)

## Ejemplos

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

Para destinos `ws://` de red privada en texto sin cifrar (solo redes de confianza), configure
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` en el entorno del proceso de incorporación.
No existe un equivalente en `openclaw.json` para esta excepción
de transporte del lado del cliente.

Proveedor personalizado no interactivo:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` es opcional en el modo no interactivo. Si se omite, la incorporación verifica `CUSTOM_API_KEY`.

LM Studio también admite una opción de clave específica del proveedor en el modo no interactivo:

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

`--custom-base-url` usa `http://127.0.0.1:11434` de forma predeterminada. `--custom-model-id` es opcional; si se omite, la incorporación usa las opciones predeterminadas sugeridas por Ollama. Los ID de modelos en la nube, como `kimi-k2.5:cloud`, también funcionan aquí.

Almacene claves de proveedor como referencias en lugar de texto sin cifrar:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Con `--secret-input-mode ref`, la incorporación escribe referencias respaldadas por variables de entorno en lugar de valores de clave en texto sin cifrar.
Para los proveedores respaldados por perfiles de autenticación, esto escribe entradas `keyRef`; para proveedores personalizados, esto escribe `models.providers.<id>.apiKey` como una referencia de entorno (por ejemplo, `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contrato del modo `ref` no interactivo:

- Configure la variable de entorno del proveedor en el entorno del proceso de incorporación (por ejemplo, `OPENAI_API_KEY`).
- No pase opciones de clave en línea (por ejemplo, `--openai-api-key`) a menos que esa variable de entorno también esté configurada.
- Si se pasa una opción de clave en línea sin la variable de entorno requerida, la incorporación falla de inmediato con instrucciones.

Opciones de token de Gateway en el modo no interactivo:

- `--gateway-auth token --gateway-token <token>` almacena un token en texto sin cifrar.
- `--gateway-auth token --gateway-token-ref-env <name>` almacena `gateway.auth.token` como un SecretRef de entorno.
- `--gateway-token` y `--gateway-token-ref-env` son mutuamente excluyentes.
- `--gateway-token-ref-env` requiere una variable de entorno no vacía en el entorno del proceso de incorporación.
- Con `--install-daemon`, cuando la autenticación por token requiere un token, los tokens de Gateway administrados por SecretRef se validan, pero no se conservan como texto sin cifrar resuelto en los metadatos del entorno del servicio supervisor.
- Con `--install-daemon`, si el modo token requiere un token y el SecretRef de token configurado no se puede resolver, la incorporación falla de forma segura con instrucciones de corrección.
- Con `--install-daemon`, si están configurados tanto `gateway.auth.token` como `gateway.auth.password` y `gateway.auth.mode` no está configurado, la incorporación bloquea la instalación hasta que el modo se configure explícitamente.
- La incorporación local escribe `gateway.mode="local"` en la configuración. Si un archivo de configuración posterior no tiene `gateway.mode`, trátelo como daño en la configuración o una edición manual incompleta, no como un atajo válido para el modo local.
- `--allow-unconfigured` es una vía de escape independiente del tiempo de ejecución de Gateway. No significa que la incorporación pueda omitir `gateway.mode`.

Ejemplo:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

Estado de salud del Gateway local no interactivo:

- A menos que pase `--skip-health`, la incorporación espera a que un Gateway local accesible esté disponible antes de finalizar correctamente.
- `--install-daemon` inicia primero la ruta de instalación administrada de Gateway. Sin él, ya debe tener un Gateway local en ejecución, por ejemplo `openclaw gateway run`.
- Si solo desea escrituras de configuración/espacio de trabajo/inicialización en la automatización, use `--skip-health`.
- En Windows nativo, `--install-daemon` intenta primero con Tareas programadas y recurre a un elemento de inicio de sesión por usuario en la carpeta Inicio si se deniega la creación de tareas.

Comportamiento de la incorporación interactiva con modo de referencia:

- Elija **Usar referencia de secreto** cuando se le solicite.
- Luego elija una de estas opciones:
  - Variable de entorno
  - Proveedor de secretos configurado (`file` o `exec`)
- La incorporación realiza una validación previa rápida antes de guardar la referencia.
  - Si la validación falla, la incorporación muestra el error y le permite volver a intentarlo.

Opciones de endpoint de Z.AI no interactivas:

Nota: `--auth-choice zai-api-key` ahora detecta automáticamente el mejor endpoint de Z.AI para su clave (prefiere la API general con `zai/glm-5.1`).
Si desea específicamente los endpoints de GLM Coding Plan, elija `zai-coding-global` o `zai-coding-cn`.

```bash
# Selección de endpoint sin solicitudes
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Otras opciones de endpoint de Z.AI:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Ejemplo no interactivo de Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

Notas de flujo:

- `quickstart`: solicitudes mínimas, genera automáticamente un token de Gateway.
- `manual`: solicitudes completas para puerto/vinculación/autenticación (alias de `advanced`).
- Cuando una opción de autenticación implica un proveedor preferido, la incorporación prefiltra los selectores de modelo predeterminado y de lista de permitidos para ese proveedor. Para Volcengine y BytePlus, esto también coincide con las variantes de coding-plan
  (`volcengine-plan/*`, `byteplus-plan/*`).
- Si el filtro de proveedor preferido no produce modelos cargados todavía, la incorporación
  vuelve al catálogo sin filtrar en lugar de dejar vacío el selector.
- En el paso de búsqueda web, algunos proveedores pueden activar solicitudes de seguimiento específicas del proveedor:
  - **Grok** puede ofrecer una configuración opcional de `x_search` con la misma `XAI_API_KEY`
    y una selección de modelo `x_search`.
  - **Kimi** puede solicitar la región de la API de Moonshot (`api.moonshot.ai` frente a
    `api.moonshot.cn`) y el modelo de búsqueda web predeterminado de Kimi.
- Comportamiento del alcance de mensajes directos en la incorporación local: [Referencia de configuración de la CLI](/es/start/wizard-cli-reference#outputs-and-internals).
- Chat inicial más rápido: `openclaw dashboard` (interfaz de control, sin configuración de canales).
- Proveedor personalizado: conecte cualquier endpoint compatible con OpenAI o Anthropic,
  incluidos proveedores alojados que no figuran en la lista. Use Unknown para detectar automáticamente.

## Comandos de seguimiento comunes

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` no implica modo no interactivo. Use `--non-interactive` para scripts.
</Note>

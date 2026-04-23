---
read_when:
    - Quieres una configuración guiada para Gateway, espacio de trabajo, autenticación, canales y Skills
summary: Referencia de CLI para `openclaw onboard` (incorporación interactiva)
title: incorporación
x-i18n:
    generated_at: "2026-04-23T14:01:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 348ee9cbc14ff78b588f10297e728473668a72f9f16be385f25022bf5108340c
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Incorporación interactiva para configuración local o remota del Gateway.

## Guías relacionadas

- Centro de incorporación de CLI: [Onboarding (CLI)](/es/start/wizard)
- Resumen de incorporación: [Onboarding Overview](/es/start/onboarding-overview)
- Referencia de incorporación de CLI: [CLI Setup Reference](/es/start/wizard-cli-reference)
- Automatización de CLI: [CLI Automation](/es/start/wizard-cli-automation)
- Incorporación en macOS: [Onboarding (macOS App)](/es/start/onboarding)

## Ejemplos

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

Para destinos de red privada `ws://` en texto plano (solo redes de confianza), establece
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` en el entorno del proceso de incorporación.

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

`--custom-api-key` es opcional en modo no interactivo. Si se omite, la incorporación comprueba `CUSTOM_API_KEY`.

LM Studio también admite un flag de clave específico del proveedor en modo no interactivo:

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

`--custom-base-url` usa `http://127.0.0.1:11434` de forma predeterminada. `--custom-model-id` es opcional; si se omite, la incorporación usa los valores predeterminados sugeridos por Ollama. Los IDs de modelo en la nube como `kimi-k2.5:cloud` también funcionan aquí.

Almacena claves de proveedor como referencias en lugar de texto plano:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Con `--secret-input-mode ref`, la incorporación escribe referencias respaldadas por variables de entorno en lugar de valores de clave en texto plano.
Para proveedores respaldados por perfiles de autenticación, esto escribe entradas `keyRef`; para proveedores personalizados, esto escribe `models.providers.<id>.apiKey` como referencia de entorno (por ejemplo `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contrato del modo `ref` no interactivo:

- Establece la variable de entorno del proveedor en el entorno del proceso de incorporación (por ejemplo `OPENAI_API_KEY`).
- No pases flags de clave en línea (por ejemplo `--openai-api-key`) a menos que esa variable de entorno también esté establecida.
- Si se pasa un flag de clave en línea sin la variable de entorno requerida, la incorporación falla de inmediato con orientación.

Opciones de token del Gateway en modo no interactivo:

- `--gateway-auth token --gateway-token <token>` almacena un token en texto plano.
- `--gateway-auth token --gateway-token-ref-env <name>` almacena `gateway.auth.token` como un SecretRef de entorno.
- `--gateway-token` y `--gateway-token-ref-env` son mutuamente excluyentes.
- `--gateway-token-ref-env` requiere una variable de entorno no vacía en el entorno del proceso de incorporación.
- Con `--install-daemon`, cuando la autenticación por token requiere un token, los tokens de Gateway administrados por SecretRef se validan, pero no se conservan como texto plano resuelto en los metadatos del entorno del servicio supervisor.
- Con `--install-daemon`, si el modo de token requiere un token y el SecretRef de token configurado no está resuelto, la incorporación falla en cerrado con orientación para solucionarlo.
- Con `--install-daemon`, si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está establecido, la incorporación bloquea la instalación hasta que el modo se establezca explícitamente.
- La incorporación local escribe `gateway.mode="local"` en la configuración. Si un archivo de configuración posterior no tiene `gateway.mode`, trátalo como daño en la configuración o una edición manual incompleta, no como un atajo válido de modo local.
- `--allow-unconfigured` es una vía de escape independiente del entorno de ejecución del Gateway. No significa que la incorporación pueda omitir `gateway.mode`.

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

Estado del Gateway local en modo no interactivo:

- A menos que pases `--skip-health`, la incorporación espera a que haya un Gateway local accesible antes de salir correctamente.
- `--install-daemon` inicia primero la ruta de instalación administrada del Gateway. Sin eso, ya debes tener un Gateway local en ejecución, por ejemplo `openclaw gateway run`.
- Si solo quieres escrituras de configuración/espacio de trabajo/bootstrap en automatización, usa `--skip-health`.
- En Windows nativo, `--install-daemon` prueba primero con Tareas programadas y recurre a un elemento de inicio de sesión en la carpeta Inicio por usuario si se deniega la creación de la tarea.

Comportamiento de la incorporación interactiva con modo de referencia:

- Elige **Use secret reference** cuando se te solicite.
- Luego elige una de estas opciones:
  - Variable de entorno
  - Proveedor de secretos configurado (`file` o `exec`)
- La incorporación realiza una validación previa rápida antes de guardar la referencia.
  - Si la validación falla, la incorporación muestra el error y te permite reintentar.

Opciones de endpoint de Z.AI no interactivas:

Nota: `--auth-choice zai-api-key` ahora detecta automáticamente el mejor endpoint de Z.AI para tu clave (prioriza la API general con `zai/glm-5.1`).
Si específicamente quieres los endpoints de GLM Coding Plan, elige `zai-coding-global` o `zai-coding-cn`.

```bash
# Selección de endpoint sin prompts
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

Notas sobre el flujo:

- `quickstart`: prompts mínimos, genera automáticamente un token de Gateway.
- `manual`: prompts completos para puerto/enlace/autenticación (alias de `advanced`).
- Cuando una opción de autenticación implica un proveedor preferido, la incorporación prefiltra los selectores del modelo predeterminado y la lista de permitidos para ese proveedor. Para Volcengine y BytePlus, esto también coincide con las variantes de plan de programación (`volcengine-plan/*`, `byteplus-plan/*`).
- Si el filtro del proveedor preferido aún no produce modelos cargados, la incorporación recurre al catálogo sin filtrar en lugar de dejar vacío el selector.
- En el paso de búsqueda web, algunos proveedores pueden activar prompts de seguimiento específicos del proveedor:
  - **Grok** puede ofrecer una configuración opcional de `x_search` con la misma `XAI_API_KEY` y una elección de modelo `x_search`.
  - **Kimi** puede solicitar la región de API de Moonshot (`api.moonshot.ai` frente a `api.moonshot.cn`) y el modelo predeterminado de búsqueda web de Kimi.
- Comportamiento del alcance de MD en la incorporación local: [CLI Setup Reference](/es/start/wizard-cli-reference#outputs-and-internals).
- Chat inicial más rápido: `openclaw dashboard` (interfaz Control, sin configuración de canales).
- Proveedor personalizado: conecta cualquier endpoint compatible con OpenAI o Anthropic, incluidos proveedores alojados no listados. Usa Unknown para la detección automática.

## Comandos de seguimiento habituales

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` no implica modo no interactivo. Usa `--non-interactive` para scripts.
</Note>

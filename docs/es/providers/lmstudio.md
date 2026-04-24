---
read_when:
    - Quieres ejecutar OpenClaw con modelos de código abierto mediante LM Studio
    - Quieres configurar y poner en marcha LM Studio
summary: Ejecutar OpenClaw con LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-24T05:45:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2077790173a8cb660409b64e199d2027dda7b5b55226a00eadb0cdc45061e3ce
    source_path: providers/lmstudio.md
    workflow: 15
---

LM Studio es una app amigable pero potente para ejecutar modelos de pesos abiertos en tu propio hardware. Te permite ejecutar modelos llama.cpp (GGUF) o MLX (Apple Silicon). Está disponible como paquete con GUI o como daemon sin interfaz (`llmster`). Para documentación del producto y de configuración, consulta [lmstudio.ai](https://lmstudio.ai/).

## Inicio rápido

1. Instala LM Studio (escritorio) o `llmster` (sin interfaz), y luego inicia el servidor local:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Inicia el servidor

Asegúrate de iniciar la app de escritorio o de ejecutar el daemon con el siguiente comando:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Si usas la app, asegúrate de tener JIT habilitado para una experiencia fluida. Más información en la [guía de JIT y TTL de LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. OpenClaw requiere un valor de token de LM Studio. Configura `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Si la autenticación de LM Studio está deshabilitada, usa cualquier valor de token no vacío:

```bash
export LM_API_TOKEN="placeholder-key"
```

Para detalles de configuración de autenticación de LM Studio, consulta [Autenticación de LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

4. Ejecuta la incorporación y elige `LM Studio`:

```bash
openclaw onboard
```

5. En la incorporación, usa el prompt `Default model` para elegir tu modelo de LM Studio.

También puedes configurarlo o cambiarlo más tarde:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Las claves de modelo de LM Studio siguen el formato `author/model-name` (por ejemplo `qwen/qwen3.5-9b`). Las referencias de modelo de OpenClaw anteponen el nombre del proveedor: `lmstudio/qwen/qwen3.5-9b`. Puedes encontrar la clave exacta de un modelo ejecutando `curl http://localhost:1234/api/v1/models` y buscando el campo `key`.

## Incorporación no interactiva

Usa incorporación no interactiva cuando quieras automatizar la configuración (CI, aprovisionamiento, bootstrap remoto):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

O especifica URL base o modelo con clave API:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` toma la clave del modelo tal como la devuelve LM Studio (por ejemplo `qwen/qwen3.5-9b`), sin el prefijo de proveedor `lmstudio/`.

La incorporación no interactiva requiere `--lmstudio-api-key` (o `LM_API_TOKEN` en el entorno).
Para servidores LM Studio sin autenticación, cualquier valor de token no vacío funciona.

`--custom-api-key` sigue siendo compatible por compatibilidad, pero `--lmstudio-api-key` es la opción preferida para LM Studio.

Esto escribe `models.providers.lmstudio`, establece el modelo predeterminado en
`lmstudio/<custom-model-id>` y escribe el perfil de autenticación `lmstudio:default`.

La configuración interactiva puede pedir una longitud de contexto de carga preferida opcional y la aplica a los modelos LM Studio descubiertos que guarda en la configuración.

## Configuración

### Compatibilidad de uso en streaming

LM Studio es compatible con uso en streaming. Cuando no emite un objeto
`usage` con forma de OpenAI, OpenClaw recupera los conteos de tokens a partir de metadatos estilo llama.cpp
`timings.prompt_n` / `timings.predicted_n`.

El mismo comportamiento se aplica a estos backends locales compatibles con OpenAI:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Configuración explícita

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Solución de problemas

### LM Studio no se detecta

Asegúrate de que LM Studio esté en ejecución y de haber configurado `LM_API_TOKEN` (para servidores sin autenticación, funciona cualquier valor de token no vacío):

```bash
# Iniciar desde la app de escritorio, o sin interfaz:
lms server start --port 1234
```

Verifica que la API sea accesible:

```bash
curl http://localhost:1234/api/v1/models
```

### Errores de autenticación (HTTP 401)

Si la configuración informa HTTP 401, verifica tu clave API:

- Comprueba que `LM_API_TOKEN` coincida con la clave configurada en LM Studio.
- Para detalles de configuración de autenticación de LM Studio, consulta [Autenticación de LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Si tu servidor no requiere autenticación, usa cualquier valor de token no vacío para `LM_API_TOKEN`.

### Carga just-in-time de modelos

LM Studio admite carga de modelos just-in-time (JIT), donde los modelos se cargan en la primera solicitud. Asegúrate de tener esto habilitado para evitar errores de “Model not loaded”.

## Relacionado

- [Selección de modelos](/es/concepts/model-providers)
- [Ollama](/es/providers/ollama)
- [Modelos locales](/es/gateway/local-models)

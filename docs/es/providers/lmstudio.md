---
read_when:
    - Quieres ejecutar OpenClaw con modelos de código abierto mediante LM Studio
    - Quieres configurar y poner en marcha LM Studio
summary: Ejecutar OpenClaw con LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-23T14:06:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 062b26cf10631e74f4e1917ea9011133eb4433f5fb7ee85748d00080a6ca212d
    source_path: providers/lmstudio.md
    workflow: 15
---

# LM Studio

LM Studio es una aplicación amigable pero potente para ejecutar modelos de pesos abiertos en tu propio hardware. Te permite ejecutar modelos llama.cpp (GGUF) o MLX (Apple Silicon). Está disponible como paquete con GUI o como daemon sin interfaz (`llmster`). Para la documentación del producto y de configuración, consulta [lmstudio.ai](https://lmstudio.ai/).

## Inicio rápido

1. Instala LM Studio (escritorio) o `llmster` (sin interfaz), luego inicia el servidor local:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Inicia el servidor

Asegúrate de iniciar la aplicación de escritorio o ejecutar el daemon con el siguiente comando:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Si usas la aplicación, asegúrate de tener JIT habilitado para una experiencia fluida. Más información en la [guía de JIT y TTL de LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. OpenClaw requiere un valor de token de LM Studio. Establece `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Si la autenticación de LM Studio está deshabilitada, usa cualquier valor de token no vacío:

```bash
export LM_API_TOKEN="placeholder-key"
```

Para detalles sobre la configuración de autenticación de LM Studio, consulta [Autenticación de LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

4. Ejecuta el onboarding y elige `LM Studio`:

```bash
openclaw onboard
```

5. En el onboarding, usa el prompt `Default model` para elegir tu modelo de LM Studio.

También puedes establecerlo o cambiarlo más tarde:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Las claves de modelo de LM Studio siguen el formato `author/model-name` (p. ej. `qwen/qwen3.5-9b`). Las referencias de modelo de OpenClaw anteponen el nombre del proveedor: `lmstudio/qwen/qwen3.5-9b`. Puedes encontrar la clave exacta de un modelo ejecutando `curl http://localhost:1234/api/v1/models` y mirando el campo `key`.

## Onboarding no interactivo

Usa onboarding no interactivo cuando quieras automatizar la configuración (CI, aprovisionamiento, bootstrap remoto):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

O especifica base URL o modelo con clave API:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` toma la clave del modelo tal como la devuelve LM Studio (p. ej. `qwen/qwen3.5-9b`), sin el prefijo de proveedor `lmstudio/`.

El onboarding no interactivo requiere `--lmstudio-api-key` (o `LM_API_TOKEN` en el entorno).
Para servidores LM Studio sin autenticación, cualquier valor de token no vacío funciona.

`--custom-api-key` sigue siendo compatible por compatibilidad, pero se prefiere `--lmstudio-api-key` para LM Studio.

Esto escribe `models.providers.lmstudio`, establece el modelo predeterminado en
`lmstudio/<custom-model-id>` y escribe el perfil de autenticación `lmstudio:default`.

La configuración interactiva puede pedir una longitud de contexto de carga preferida opcional y la aplica a los modelos de LM Studio detectados que guarda en la configuración.

## Configuración

### Compatibilidad de uso con streaming

LM Studio es compatible con uso en streaming. Cuando no emite un objeto `usage`
con formato de OpenAI, OpenClaw recupera los recuentos de tokens a partir de los metadatos de estilo llama.cpp
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

### No se detecta LM Studio

Asegúrate de que LM Studio está en ejecución y de que has establecido `LM_API_TOKEN` (para servidores sin autenticación, cualquier valor de token no vacío funciona):

```bash
# Inicia mediante la aplicación de escritorio, o sin interfaz:
lms server start --port 1234
```

Verifica que la API sea accesible:

```bash
curl http://localhost:1234/api/v1/models
```

### Errores de autenticación (HTTP 401)

Si la configuración informa HTTP 401, verifica tu clave API:

- Comprueba que `LM_API_TOKEN` coincide con la clave configurada en LM Studio.
- Para detalles sobre la configuración de autenticación de LM Studio, consulta [Autenticación de LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Si tu servidor no requiere autenticación, usa cualquier valor de token no vacío para `LM_API_TOKEN`.

### Carga just-in-time de modelos

LM Studio admite carga just-in-time (JIT) de modelos, donde los modelos se cargan en la primera solicitud. Asegúrate de tener esto habilitado para evitar errores de tipo 'Model not loaded'.

---
read_when:
    - Quieres ejecutar OpenClaw con modelos de código abierto mediante LM Studio
    - Quieres configurar y ajustar LM Studio
summary: Ejecuta OpenClaw con LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-13T08:50:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11264584e8277260d4215feb7c751329ce04f59e9228da1c58e147c21cd9ac2c
    source_path: providers/lmstudio.md
    workflow: 15
---

# LM Studio

LM Studio es una aplicación amigable pero potente para ejecutar modelos de pesos abiertos en tu propio hardware. Te permite ejecutar modelos llama.cpp (GGUF) o MLX (Apple Silicon). Viene en un paquete con GUI o como daemon sin interfaz (`llmster`). Para consultar la documentación del producto y la configuración, consulta [lmstudio.ai](https://lmstudio.ai/).

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

Si estás usando la aplicación, asegúrate de tener JIT habilitado para una experiencia fluida. Obtén más información en la [guía de JIT y TTL de LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. OpenClaw requiere un valor de token de LM Studio. Establece `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Si la autenticación de LM Studio está deshabilitada, usa cualquier valor de token no vacío:

```bash
export LM_API_TOKEN="placeholder-key"
```

Para obtener detalles sobre la configuración de autenticación de LM Studio, consulta [Autenticación de LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

4. Ejecuta la incorporación y elige `LM Studio`:

```bash
openclaw onboard
```

5. En la incorporación, usa el prompt `Default model` para elegir tu modelo de LM Studio.

También puedes configurarlo o cambiarlo más tarde:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Las claves de modelo de LM Studio siguen el formato `author/model-name` (por ejemplo, `qwen/qwen3.5-9b`). Las referencias de modelo de OpenClaw anteponen el nombre del proveedor: `lmstudio/qwen/qwen3.5-9b`. Puedes encontrar la clave exacta de un modelo ejecutando `curl http://localhost:1234/api/v1/models` y buscando el campo `key`.

## Incorporación no interactiva

Usa la incorporación no interactiva cuando quieras automatizar la configuración (CI, aprovisionamiento, arranque remoto):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

O especifica la URL base o el modelo con la clave de API:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` toma la clave del modelo tal como la devuelve LM Studio (por ejemplo, `qwen/qwen3.5-9b`), sin el prefijo del proveedor `lmstudio/`.

La incorporación no interactiva requiere `--lmstudio-api-key` (o `LM_API_TOKEN` en el entorno).
Para servidores de LM Studio sin autenticación, funciona cualquier valor de token no vacío.

`--custom-api-key` sigue siendo compatible por motivos de compatibilidad, pero se prefiere `--lmstudio-api-key` para LM Studio.

Esto escribe `models.providers.lmstudio`, establece el modelo predeterminado en
`lmstudio/<custom-model-id>` y escribe el perfil de autenticación `lmstudio:default`.

La configuración interactiva puede solicitar una longitud de contexto de carga preferida opcional y la aplica a los modelos de LM Studio detectados que guarda en la configuración.

## Configuración

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

### LM Studio no detectado

Asegúrate de que LM Studio esté en ejecución y de haber configurado `LM_API_TOKEN` (para servidores sin autenticación, funciona cualquier valor de token no vacío):

```bash
# Inicia mediante la aplicación de escritorio, o sin interfaz:
lms server start --port 1234
```

Verifica que la API sea accesible:

```bash
curl http://localhost:1234/api/v1/models
```

### Errores de autenticación (HTTP 401)

Si la configuración informa HTTP 401, verifica tu clave de API:

- Comprueba que `LM_API_TOKEN` coincida con la clave configurada en LM Studio.
- Para obtener detalles sobre la configuración de autenticación de LM Studio, consulta [Autenticación de LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Si tu servidor no requiere autenticación, usa cualquier valor de token no vacío para `LM_API_TOKEN`.

### Carga de modelos justo a tiempo

LM Studio admite la carga de modelos justo a tiempo (JIT), donde los modelos se cargan en la primera solicitud. Asegúrate de tener esto habilitado para evitar errores de tipo 'Model not loaded'.

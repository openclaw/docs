---
read_when:
    - Quieres una sola clave de API para los principales LLM de código abierto
    - Desea ejecutar modelos mediante la API de DeepInfra en OpenClaw
summary: Usa la API unificada de DeepInfra para acceder a los modelos de código abierto y de vanguardia más populares en OpenClaw
x-i18n:
    generated_at: "2026-04-30T05:57:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22a178e7ac582e094f82f5779a9a963e0bf77b1b19820f74725255b6be0b0593
    source_path: providers/deepinfra.md
    workflow: 16
---

# DeepInfra

DeepInfra proporciona una **API unificada** que dirige solicitudes a los modelos de código abierto y de frontera más populares detrás de un único
endpoint y clave de API. Es compatible con OpenAI, por lo que la mayoría de los SDK de OpenAI funcionan cambiando la URL base.

## Obtener una clave de API

1. Ve a [https://deepinfra.com/](https://deepinfra.com/)
2. Inicia sesión o crea una cuenta
3. Ve a Panel / Claves y genera una nueva clave de API o usa la creada automáticamente

## Configuración de CLI

```bash
openclaw onboard --deepinfra-api-key <key>
```

O establece la variable de entorno:

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## Fragmento de configuración

```json5
{
  env: { DEEPINFRA_API_KEY: "<your-deepinfra-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V3.2" },
    },
  },
}
```

## Superficies de OpenClaw compatibles

El plugin incluido registra todas las superficies de DeepInfra que coinciden con los contratos actuales
de proveedores de OpenClaw:

| Superficie               | Modelo predeterminado              | Configuración/herramienta de OpenClaw                    |
| ------------------------ | ---------------------------------- | -------------------------------------------------------- |
| Chat / proveedor de modelos | `deepseek-ai/DeepSeek-V3.2`     | `agents.defaults.model`                                  |
| Generación/edición de imágenes | `black-forest-labs/FLUX-1-schnell` | `image_generate`, `agents.defaults.imageGenerationModel` |
| Comprensión multimedia   | `moonshotai/Kimi-K2.5` para imágenes | comprensión de imágenes entrantes                       |
| Voz a texto              | `openai/whisper-large-v3-turbo`    | transcripción de audio entrante                          |
| Texto a voz              | `hexgrad/Kokoro-82M`               | `messages.tts.provider: "deepinfra"`                     |
| Generación de video      | `Pixverse/Pixverse-T2V`            | `video_generate`, `agents.defaults.videoGenerationModel` |
| Embeddings de memoria    | `BAAI/bge-m3`                      | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra también expone reclasificación, clasificación, detección de objetos y otros
tipos de modelos nativos. OpenClaw actualmente no tiene contratos de proveedor de primera clase
para esas categorías, por lo que este plugin aún no las registra.

## Modelos disponibles

OpenClaw descubre dinámicamente los modelos disponibles de DeepInfra al iniciar. Usa
`/models deepinfra` para ver la lista completa de modelos disponibles.

Cualquier modelo disponible en [DeepInfra.com](https://deepinfra.com/) puede usarse con el prefijo `deepinfra/`:

```
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/moonshotai/Kimi-K2.5
deepinfra/zai-org/GLM-5.1
...y muchos más
```

## Notas

- Las referencias de modelo son `deepinfra/<provider>/<model>` (por ejemplo, `deepinfra/Qwen/Qwen3-Max`).
- Modelo predeterminado: `deepinfra/deepseek-ai/DeepSeek-V3.2`
- URL base: `https://api.deepinfra.com/v1/openai`
- La generación de video nativa usa `https://api.deepinfra.com/v1/inference/<model>`.

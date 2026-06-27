---
read_when:
    - Quieres una sola clave de API para los principales LLM de código abierto
    - Quieres ejecutar modelos a través de la API de DeepInfra en OpenClaw
summary: Usa la API unificada de DeepInfra para acceder a los modelos de código abierto y de frontera más populares en OpenClaw
title: DeepInfra
x-i18n:
    generated_at: "2026-06-27T12:35:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 059a556c24d2de2c8c5290b54c78fbc7451dc534238bfc4c725dcfbbd9a2d17f
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra proporciona una **API unificada** que enruta solicitudes a los modelos de código abierto y de frontera más populares detrás de un único
endpoint y una clave de API. Es compatible con OpenAI, por lo que la mayoría de los SDK de OpenAI funcionan cambiando la URL base.

## Instalar Plugin

Instala el Plugin oficial y luego reinicia Gateway:

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## Obtener una clave de API

1. Ve a [https://deepinfra.com/](https://deepinfra.com/)
2. Inicia sesión o crea una cuenta
3. Navega a Dashboard / Keys y genera una nueva clave de API o usa la creada automáticamente

## Configuración de CLI

```bash
openclaw onboard --deepinfra-api-key <key>
```

O configura la variable de entorno:

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## Fragmento de configuración

```json5
{
  env: { DEEPINFRA_API_KEY: "<your-deepinfra-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V4-Flash" },
    },
  },
}
```

## Superficies de OpenClaw compatibles

El Plugin registra todas las superficies de DeepInfra que coinciden con los contratos de proveedor actuales de
OpenClaw. Chat, generación de imágenes y generación de video
actualizan sus catálogos de modelos en vivo desde `/v1/openai/models?sort_by=openclaw&filter=with_meta`
cuando `DEEPINFRA_API_KEY` está configurada; las demás superficies usan los valores predeterminados estáticos
seleccionados a continuación.

| Superficie               | Modelo predeterminado                                                                                 | Configuración/herramienta de OpenClaw                   |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Chat / proveedor de modelos | primera entrada etiquetada como chat del catálogo en vivo (respaldo del manifiesto `deepseek-ai/DeepSeek-V4-Flash`) | `agents.defaults.model`                                  |
| Generación/edición de imágenes | primera entrada etiquetada como `image-gen` del catálogo en vivo (respaldo estático `black-forest-labs/FLUX-1-schnell`) | `image_generate`, `agents.defaults.imageGenerationModel` |
| Comprensión multimedia   | `moonshotai/Kimi-K2.5` para imágenes                                                                  | comprensión de imágenes entrantes                        |
| Voz a texto              | `openai/whisper-large-v3-turbo`                                                                       | transcripción de audio entrante                          |
| Texto a voz              | `hexgrad/Kokoro-82M`                                                                                  | `messages.tts.provider: "deepinfra"`                     |
| Generación de video      | primera entrada etiquetada como `video-gen` del catálogo en vivo (respaldo estático `Pixverse/Pixverse-T2V`) | `video_generate`, `agents.defaults.videoGenerationModel` |
| Embeddings de memoria    | `BAAI/bge-m3`                                                                                         | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra también expone reranking, clasificación, detección de objetos y otros
tipos de modelos nativos. OpenClaw actualmente no tiene contratos de proveedor de primera clase
para esas categorías, por lo que este Plugin aún no los registra.

## Modelos disponibles

OpenClaw descubre dinámicamente los modelos de DeepInfra disponibles al iniciar. Usa
`/models deepinfra` para ver la lista completa de modelos disponibles.

Cualquier modelo disponible en [DeepInfra.com](https://deepinfra.com/) se puede usar con el prefijo `deepinfra/`:

```
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...and many more
```

## Notas

- Las referencias de modelo son `deepinfra/<provider>/<model>` (por ejemplo, `deepinfra/Qwen/Qwen3-Max`).
- Modelo predeterminado: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- URL base: `https://api.deepinfra.com/v1/openai`
- La generación de video nativa usa `https://api.deepinfra.com/v1/inference/<model>`.

## Relacionado

- [Proveedores de modelos](/es/concepts/model-providers)
- [Todos los proveedores](/es/providers/index)

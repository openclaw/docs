---
read_when:
    - Quieres una sola clave de API para los principales LLM de código abierto
    - Quieres ejecutar modelos mediante la API de DeepInfra en OpenClaw
summary: Usa la API unificada de DeepInfra para acceder a los modelos de código abierto y de frontera más populares en OpenClaw
title: DeepInfra
x-i18n:
    generated_at: "2026-07-05T11:39:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f68bac84311d20348007c715803a34451ba8ab0c09beba63366ba5b1b29de05
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra enruta solicitudes a modelos populares de código abierto y modelos frontier detrás de un
único endpoint compatible con OpenAI y una clave de API. La mayoría de los SDK de OpenAI funcionan con
él al cambiar la URL base.

## Instalar Plugin

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## Obtener una clave de API

1. Inicia sesión en [deepinfra.com](https://deepinfra.com/)
2. Ve a Dashboard / Keys y genera una clave, o usa la creada automáticamente

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

## Superficies admitidas

El chat, la generación de imágenes y la generación de video actualizan sus catálogos de modelos
en vivo desde `https://api.deepinfra.com/v1/openai/models?sort_by=openclaw&filter=with_meta`
una vez que `DEEPINFRA_API_KEY` está configurada. Otras superficies usan los valores
predeterminados estáticos siguientes hasta que pasen al mismo catálogo en vivo.

| Superficie               | Modelo predeterminado                                                                                 | Configuración/herramienta de OpenClaw                   |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Chat / proveedor de modelos | primera entrada etiquetada como chat del catálogo en vivo (respaldo estático `deepseek-ai/DeepSeek-V4-Flash`) | `agents.defaults.model`                                  |
| Generación/edición de imágenes | primera entrada etiquetada como `image-gen` del catálogo en vivo (respaldo estático `black-forest-labs/FLUX-1-schnell`) | `image_generate`, `agents.defaults.imageGenerationModel` |
| Comprensión multimedia   | `moonshotai/Kimi-K2.5` para imágenes                                                                  | comprensión de imágenes entrantes                        |
| Voz a texto              | `openai/whisper-large-v3-turbo`                                                                       | transcripción de audio entrante                          |
| Texto a voz              | `hexgrad/Kokoro-82M`                                                                                  | `messages.tts.provider: "deepinfra"`                     |
| Generación de video      | respaldo estático `Pixverse/Pixverse-T2V` (sin filas de video-gen en vivo de DeepInfra hoy)           | `video_generate`, `agents.defaults.videoGenerationModel` |
| Embeddings de memoria    | `BAAI/bge-m3`                                                                                         | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra también expone reranking, clasificación, detección de objetos y otros
tipos de modelos nativos. OpenClaw todavía no tiene un contrato de proveedor para esas categorías,
por lo que este Plugin no las registra.

## Modelos disponibles

OpenClaw descubre modelos de DeepInfra dinámicamente una vez que se configura una clave. Usa
`/models deepinfra` o `openclaw models list --provider deepinfra` para ver la
lista actual.

Cualquier modelo en [deepinfra.com](https://deepinfra.com/) funciona con el
prefijo `deepinfra/`:

```text
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
- Modelo de chat predeterminado: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- URL base: `https://api.deepinfra.com/v1/openai`
- La generación de video nativa usa `https://api.deepinfra.com/v1/inference/<model>`.

## Relacionado

- [Proveedores de modelos](/es/concepts/model-providers)
- [Todos los proveedores](/es/providers/index)

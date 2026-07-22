---
read_when:
    - Quieres una única clave de API para los principales LLM de código abierto
    - Quieres ejecutar modelos mediante la API de DeepInfra en OpenClaw
summary: Usa la API unificada de DeepInfra para acceder a los modelos de código abierto y de vanguardia más populares en OpenClaw
title: DeepInfra
x-i18n:
    generated_at: "2026-07-22T10:47:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9220dcfe911f39770a1bc2f93f1b9f428555580d386d6429e7a590ed3dc75845
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra enruta las solicitudes a modelos populares de código abierto y de vanguardia mediante un
único endpoint compatible con OpenAI y una clave de API. La mayoría de los SDK de OpenAI funcionan con
él cambiando la URL base.

## Instalar el plugin

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## Obtener una clave de API

1. Inicie sesión en [deepinfra.com](https://deepinfra.com/)
2. Vaya a Dashboard / Keys y genere una clave, o use la creada automáticamente

## Configuración mediante la CLI

```bash
openclaw onboard --deepinfra-api-key <key>
```

O establezca la variable de entorno:

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

## Superficies compatibles

El chat, la generación de imágenes y la generación de vídeo actualizan sus catálogos de modelos
en tiempo real desde `https://api.deepinfra.com/v1/openai/models?sort_by=openclaw&filter=with_meta`
una vez que se configura `DEEPINFRA_API_KEY`. Las demás superficies usan los valores
predeterminados estáticos que aparecen a continuación hasta que adopten el mismo catálogo en tiempo real.

| Superficie               | Modelo predeterminado                                                                                 | Configuración/herramienta de OpenClaw                  |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Chat / proveedor de modelos | primera entrada con la etiqueta de chat del catálogo en tiempo real (alternativa estática `deepseek-ai/DeepSeek-V4-Flash`) | `agents.defaults.model` |
| Generación/edición de imágenes | primera entrada con la etiqueta `image-gen` del catálogo en tiempo real (alternativa estática `black-forest-labs/FLUX-1-schnell`) | `image_generate`, `agents.defaults.mediaModels.image` |
| Comprensión multimedia   | `moonshotai/Kimi-K2.5` para imágenes                                                                     | comprensión de imágenes entrantes                     |
| Conversión de voz a texto | `openai/whisper-large-v3-turbo`                                                                                  | transcripción de audio entrante                       |
| Conversión de texto a voz | `hexgrad/Kokoro-82M`                                                                                  | `tts.provider: "deepinfra"`                                    |
| Generación de vídeo      | alternativa estática `Pixverse/Pixverse-T2V` (actualmente no hay filas de generación de vídeo en tiempo real de DeepInfra) | `video_generate`, `agents.defaults.mediaModels.video` |
| Embeddings de memoria    | `BAAI/bge-m3`                                                                                   | `memory.search.provider: "deepinfra"`                                    |

DeepInfra también ofrece reclasificación, clasificación, detección de objetos y otros
tipos de modelos nativos. OpenClaw todavía no dispone de un contrato de proveedor para esas categorías,
por lo que este plugin no las registra.

## Modelos disponibles

OpenClaw detecta dinámicamente los modelos de DeepInfra una vez que se configura una clave. Use
`/models deepinfra` o `openclaw models list --provider deepinfra` para ver la
lista actual.

Cualquier modelo de [deepinfra.com](https://deepinfra.com/) funciona con el
prefijo `deepinfra/`:

```text
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...y muchos más
```

## Notas

- Las referencias de modelos son `deepinfra/<provider>/<model>` (por ejemplo, `deepinfra/Qwen/Qwen3-Max`).
- Modelo de chat predeterminado: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- URL base: `https://api.deepinfra.com/v1/openai`
- La generación nativa de vídeo usa `https://api.deepinfra.com/v1/inference/<model>`.

## Contenido relacionado

- [Proveedores de modelos](/es/concepts/model-providers)
- [Todos los proveedores](/es/providers/index)

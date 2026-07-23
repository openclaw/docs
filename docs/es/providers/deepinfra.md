---
read_when:
    - Quieres una única clave de API para los principales LLM de código abierto
    - Quieres ejecutar modelos mediante la API de DeepInfra en OpenClaw
summary: Usa la API unificada de DeepInfra para acceder a los modelos de código abierto y de vanguardia más populares en OpenClaw
title: DeepInfra
x-i18n:
    generated_at: "2026-07-22T20:05:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a63bdd4ffd2189cde50f0ee601fd7ee32ca86c943a9899072f0c140823608004
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra dirige las solicitudes a modelos populares de código abierto y de vanguardia mediante un
único endpoint compatible con OpenAI y una clave de API. La mayoría de los SDK de OpenAI funcionan
con este servicio al cambiar la URL base.

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

También puede establecer la variable de entorno:

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
una vez que se configura `DEEPINFRA_API_KEY`. El descubrimiento en tiempo real amplía la lista de
modelos seleccionables; el modelo predeterminado de cada superficie sigue siendo el valor estático
que se indica a continuación. Las demás superficies utilizan catálogos estáticos hasta que adopten
el mismo catálogo en tiempo real.

| Superficie                        | Modelo predeterminado                                                                  | Configuración/herramienta de OpenClaw                  |
| --------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Chat / proveedor de modelos       | `deepseek-ai/DeepSeek-V4-Flash` (el catálogo en tiempo real añade más modelos de chat)              | `agents.defaults.model`                                    |
| Generación/edición de imágenes    | `black-forest-labs/FLUX-1-schnell` (el catálogo en tiempo real añade más modelos `image-gen`)    | `image_generate`, `agents.defaults.mediaModels.image`                |
| Comprensión multimedia            | `moonshotai/Kimi-K2.5` para imágenes                                                       | comprensión de imágenes entrantes                     |
| Conversión de voz a texto         | `openai/whisper-large-v3-turbo`                                                                     | transcripción de audio entrante                       |
| Conversión de texto a voz         | `hexgrad/Kokoro-82M`                                                                     | `tts.provider: "deepinfra"`                                    |
| Generación de vídeo               | `Pixverse/Pixverse-T2V` (el catálogo en tiempo real añade más modelos `video-gen`)    | `video_generate`, `agents.defaults.mediaModels.video`                |
| Incrustaciones de memoria         | `BAAI/bge-m3`                                                                     | `memory.search.provider: "deepinfra"`                                    |

DeepInfra también ofrece reclasificación, clasificación, detección de objetos y otros
tipos de modelos nativos. OpenClaw aún no dispone de un contrato de proveedor para esas categorías,
por lo que este plugin no las registra.

## Modelos disponibles

OpenClaw descubre dinámicamente los modelos de DeepInfra una vez configurada una clave. Use
`/models deepinfra` o `openclaw models list --provider deepinfra` para consultar la
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
- La generación de vídeo utiliza el endpoint asíncrono compatible con OpenAI `https://api.deepinfra.com/v1/openai/videos` (se envía la solicitud y después se consulta su estado). Se respeta cualquier `baseUrl` configurado. `openclaw doctor --fix` migra automáticamente los valores heredados `nativeBaseUrl` o `/v1/inference` de `api.deepinfra.com` a `baseUrl`; los endpoints nativos personalizados se retiran con un aviso de doctor y requieren configurar manualmente un `baseUrl` compatible con OpenAI. La generación de vídeo falla con un error que indica cómo actuar (antes de enviar cualquier solicitud) mientras `baseUrl` siga apuntando a la superficie retirada `/v1/inference`.

## Relacionado

- [Proveedores de modelos](/es/concepts/model-providers)
- [Todos los proveedores](/es/providers/index)

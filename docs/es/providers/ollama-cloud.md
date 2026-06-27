---
read_when:
    - Desea usar modelos de Ollama alojados sin un servidor local de Ollama
    - Necesitas el id, la clave o el endpoint del proveedor ollama-cloud
summary: Usa Ollama Cloud directamente con OpenClaw
title: Ollama Cloud
x-i18n:
    generated_at: "2026-06-27T12:39:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24b937085de1ed805b7bb0fe76a4197030bd45cd989ede8030386f3c721b9763
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud es la API de modelos alojados de Ollama. Permite que OpenClaw llame directamente a modelos alojados en Ollama, sin instalar un servidor Ollama local ni iniciar sesión en una aplicación Ollama local en modo nube. Usa el id de proveedor `ollama-cloud` y referencias de modelo como `ollama-cloud/kimi-k2.6`.

Esta página es para enrutamiento directo solo en la nube. El proveedor usa el estilo nativo `/api/chat` de Ollama, no la ruta `/v1` compatible con OpenAI. OpenClaw lo registra como un id de proveedor separado para que las credenciales solo de nube, el descubrimiento del catálogo en vivo y la selección de modelos no se mezclen con un host `ollama` local.

Usa esta página cuando quieras enrutamiento solo en la nube. Para Ollama local, enrutamiento híbrido nube más local, embeddings y detalles de host personalizados, consulta [Ollama](/es/providers/ollama).

## Configuración

Crea una clave de API de Ollama Cloud en [ollama.com/settings/keys](https://ollama.com/settings/keys), luego ejecuta:

```bash
openclaw onboard --auth-choice ollama-cloud
```

O configura:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

## Valores predeterminados

- Proveedor: `ollama-cloud`
- URL base: `https://ollama.com`
- Variable de entorno: `OLLAMA_API_KEY`
- Estilo de API: `/api/chat` nativo de Ollama
- Modelo de ejemplo: `ollama-cloud/kimi-k2.6`

## Cuándo elegir Ollama Cloud

- Quieres modelos Ollama alojados sin ejecutar `ollama serve` localmente.
- Quieres la misma forma de API de chat nativa de Ollama que OpenClaw usa para Ollama local, pero apuntada a `https://ollama.com`.
- Quieres una ruta sencilla en la nube para modelos que ya están en el catálogo alojado de Ollama.
- No necesitas descargas de modelos locales, control de GPU local ni inferencia solo por LAN.

Usa [Ollama](/es/providers/ollama) en su lugar cuando quieras enrutamiento solo local o nube más local a través de un host Ollama con sesión iniciada. Usa un proveedor compatible con OpenAI en su lugar cuando necesites semántica de `/v1/chat/completions` o funciones de estilo OpenAI específicas del proveedor.

## Modelos

OpenClaw descubre modelos de Ollama Cloud desde el catálogo alojado en vivo. Los ids alojados disponibles comúnmente incluyen:

- `ollama-cloud/gpt-oss:20b`
- `ollama-cloud/kimi-k2.6`
- `ollama-cloud/deepseek-v4-flash`
- `ollama-cloud/minimax-m2.7`
- `ollama-cloud/glm-5`

Usa un id de modelo de tu catálogo alojado actual:

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

Los ids de modelo son ids del catálogo en la nube, no nombres de descarga local. Si un nombre de modelo funciona en un host Ollama local pero no está en el catálogo alojado, usa el proveedor `ollama` con ese host local en su lugar.

## Prueba en vivo

Para pruebas de humo con clave de API de Ollama Cloud, apunta la prueba en vivo de Ollama al endpoint alojado y elige un modelo de tu catálogo actual:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

La prueba de humo en la nube ejecuta texto, stream nativo y búsqueda web. Omite embeddings de forma predeterminada para `https://ollama.com` porque las claves de API de Ollama Cloud pueden no autorizar `/api/embed`.

## Solución de problemas

- Errores de `Set OLLAMA_API_KEY`: proporciona una clave de API de nube real. El marcador local `ollama-local` es solo para hosts Ollama locales o privados.
- Errores de modelo desconocido: ejecuta `openclaw models list --provider ollama-cloud` y copia exactamente el id del modelo alojado.
- Problemas con llamadas a herramientas o JSON sin procesar en hosts Ollama personalizados: comprueba si estás usando accidentalmente una URL `/v1` compatible con OpenAI. Las rutas de Ollama deben usar la URL base nativa sin sufijo `/v1`.

## Relacionado

- [Ollama](/es/providers/ollama)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Todos los proveedores](/es/providers/index)

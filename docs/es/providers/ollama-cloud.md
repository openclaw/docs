---
read_when:
    - Quieres usar modelos de Ollama alojados sin un servidor local de Ollama.
    - Necesitas el identificador, la clave o el endpoint del proveedor ollama-cloud
summary: Usa Ollama Cloud directamente con OpenClaw
title: Ollama Cloud
x-i18n:
    generated_at: "2026-07-11T23:30:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 966e5237e37134cef109979079db390e9844714001e921e7976dc8ca7f58bcc4
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud es la API de modelos alojada de Ollama. El proveedor `ollama-cloud` la invoca
directamente en `https://ollama.com` mediante la API nativa `/api/chat` de Ollama, sin
un servidor Ollama local ni una aplicación Ollama local con sesión iniciada en modo nube. Usa
referencias de modelo como `ollama-cloud/kimi-k2.6`.

OpenClaw registra `ollama-cloud` con su propio id. de proveedor para que las
credenciales exclusivas de la nube, la detección en vivo del catálogo y la selección de modelos no se mezclen con
un host `ollama` local. Para Ollama local, el enrutamiento híbrido entre la nube y el entorno local,
los embeddings y los detalles de hosts personalizados, consulta [Ollama](/es/providers/ollama).

## Configuración

Crea una clave de API de Ollama Cloud en [ollama.com/settings/keys](https://ollama.com/settings/keys) y, a continuación, ejecuta:

```bash
openclaw onboard --auth-choice ollama-cloud
```

También puedes definir:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

La incorporación no interactiva acepta la clave directamente:

```bash
openclaw onboard --auth-choice ollama-cloud --ollama-cloud-api-key "<key>"
```

La incorporación establece el modelo predeterminado en `ollama-cloud/kimi-k2.5:cloud`.

## Valores predeterminados

- Proveedor: `ollama-cloud`
- URL base: `https://ollama.com`
- Variable de entorno: `OLLAMA_API_KEY`
- Estilo de API: `/api/chat` nativa de Ollama
- Modelo predeterminado de incorporación: `ollama-cloud/kimi-k2.5:cloud`

## Cuándo elegir Ollama Cloud

- Quieres modelos Ollama alojados sin ejecutar `ollama serve` localmente.
- Quieres la misma estructura de la API de chat nativa de Ollama que OpenClaw usa para Ollama
  local, pero dirigida a `https://ollama.com`.
- Quieres una ruta sencilla en la nube para modelos que ya están en el catálogo
  alojado de Ollama.
- No necesitas descargar modelos localmente, controlar una GPU local ni realizar inferencias solo en la LAN.

Usa [Ollama](/es/providers/ollama) en su lugar cuando quieras un enrutamiento exclusivamente local o
híbrido entre la nube y el entorno local mediante un host Ollama con sesión iniciada. Usa en su lugar un
proveedor compatible con OpenAI cuando necesites la semántica de `/v1/chat/completions`
o funciones específicas del proveedor con el estilo de OpenAI.

## Modelos

El proveedor requiere una clave de API; sin ella, permanece inactivo. Con una clave,
OpenClaw detecta en vivo los modelos de Ollama Cloud en el catálogo alojado:

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

Los id. alojados del catálogo en vivo incluyen `deepseek-v4-flash`, `glm-5`,
`gpt-oss:20b`, `kimi-k2.6` y `minimax-m2.7`. Cuando la detección en vivo no devuelve
nada, OpenClaw recurre a las filas incluidas `kimi-k2.5:cloud`,
`minimax-m2.7:cloud`, `glm-5.1:cloud` y `glm-5.2:cloud`.

Los id. de modelo son id. del catálogo en la nube, no nombres de descarga local. Si un nombre de modelo funciona en
un host Ollama local, pero no está en el catálogo alojado, usa en su lugar el proveedor `ollama`
con ese host local.

## Prueba en vivo

Para las pruebas rápidas de Ollama Cloud con clave de API, dirige la prueba en vivo de Ollama al
punto de conexión alojado y elige un modelo de tu catálogo actual:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

La prueba rápida en la nube ejecuta texto, transmisión nativa y búsqueda web; define
`OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0` para omitir la búsqueda web. De forma
predeterminada, omite los embeddings para `https://ollama.com` porque es posible que las claves de API de Ollama Cloud no
autoricen `/api/embed`; fuérzalos con `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`.

## Solución de problemas

- Errores `Ollama Cloud requires an API key` / `Set OLLAMA_API_KEY`: proporciona una
  clave de API real de la nube. El marcador local `ollama-local` es solo para hosts Ollama
  locales o privados.
- Errores de modelo desconocido: ejecuta `openclaw models list --provider ollama-cloud` y
  copia exactamente el id. del modelo alojado.
- Problemas con llamadas a herramientas o JSON sin procesar en hosts Ollama personalizados: comprueba si estás
  usando por accidente una URL `/v1` compatible con OpenAI. Las rutas de Ollama deben usar
  la URL base nativa sin el sufijo `/v1`.

## Recursos relacionados

- [Ollama](/es/providers/ollama)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Todos los proveedores](/es/providers/index)

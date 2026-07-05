---
read_when:
    - Quieres usar modelos Ollama alojados sin un servidor Ollama local
    - Necesitas el id de proveedor, la clave o el endpoint de ollama-cloud
summary: Usa Ollama Cloud directamente con OpenClaw
title: Ollama Cloud
x-i18n:
    generated_at: "2026-07-05T11:41:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 966e5237e37134cef109979079db390e9844714001e921e7976dc8ca7f58bcc4
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud es la API de modelos hospedados de Ollama. El proveedor `ollama-cloud` la llama
directamente en `https://ollama.com` mediante la API nativa `/api/chat` de Ollama, sin
servidor local de Ollama y sin aplicación local de Ollama con sesión iniciada en modo cloud. Usa referencias
de modelo como `ollama-cloud/kimi-k2.6`.

OpenClaw registra `ollama-cloud` como su propio id de proveedor para que las
credenciales solo de cloud, el descubrimiento en vivo del catálogo y la selección de modelos no se mezclen con
un host local `ollama`. Para Ollama local, enrutamiento híbrido cloud más local,
embeddings y detalles de host personalizado, consulta [Ollama](/es/providers/ollama).

## Configuración

Crea una clave de API de Ollama Cloud en [ollama.com/settings/keys](https://ollama.com/settings/keys), luego ejecuta:

```bash
openclaw onboard --auth-choice ollama-cloud
```

O define:

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

- Quieres modelos Ollama hospedados sin ejecutar `ollama serve` localmente.
- Quieres la misma forma de API de chat nativa de Ollama que OpenClaw usa para Ollama
  local, pero apuntando a `https://ollama.com`.
- Quieres una ruta cloud simple para modelos que ya están en el catálogo hospedado
  de Ollama.
- No necesitas descargas de modelos locales, control de GPU local ni inferencia solo por LAN.

Usa [Ollama](/es/providers/ollama) en su lugar cuando quieras enrutamiento solo local o
cloud más local mediante un host Ollama con sesión iniciada. Usa un proveedor
compatible con OpenAI en su lugar cuando necesites semántica de `/v1/chat/completions`
o funciones de estilo OpenAI específicas del proveedor.

## Modelos

El proveedor requiere una clave de API; sin una, permanece inactivo. Con una clave,
OpenClaw descubre modelos de Ollama Cloud en vivo desde el catálogo hospedado:

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

Los ids hospedados en el catálogo en vivo incluyen `deepseek-v4-flash`, `glm-5`,
`gpt-oss:20b`, `kimi-k2.6` y `minimax-m2.7`. Cuando el descubrimiento en vivo no devuelve
nada, OpenClaw recurre a las filas incluidas `kimi-k2.5:cloud`,
`minimax-m2.7:cloud`, `glm-5.1:cloud` y `glm-5.2:cloud`.

Los ids de modelo son ids del catálogo cloud, no nombres de descarga local. Si un nombre de modelo funciona en
un host local de Ollama pero no está presente en el catálogo hospedado, usa el proveedor `ollama`
con ese host local en su lugar.

## Prueba en vivo

Para pruebas de humo con clave de API de Ollama Cloud, apunta la prueba en vivo de Ollama al endpoint hospedado
y elige un modelo de tu catálogo actual:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

La prueba de humo cloud ejecuta texto, stream nativo y búsqueda web; define
`OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0` para omitir la búsqueda web. Omite embeddings de forma
predeterminada para `https://ollama.com` porque las claves de API de Ollama Cloud pueden no
autorizar `/api/embed`; fuérzalos con `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`.

## Solución de problemas

- Errores `Ollama Cloud requires an API key` / `Set OLLAMA_API_KEY`: proporciona una
  clave de API cloud real. El marcador local `ollama-local` es solo para hosts Ollama locales o
  privados.
- Errores de modelo desconocido: ejecuta `openclaw models list --provider ollama-cloud` y
  copia exactamente el id del modelo hospedado.
- Problemas de llamadas a herramientas o JSON sin procesar en hosts Ollama personalizados: comprueba si estás
  usando accidentalmente una URL `/v1` compatible con OpenAI. Las rutas de Ollama deben usar
  la URL base nativa sin sufijo `/v1`.

## Relacionado

- [Ollama](/es/providers/ollama)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Todos los proveedores](/es/providers/index)

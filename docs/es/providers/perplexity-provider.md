---
read_when:
    - Quieres configurar Perplexity como proveedor de búsqueda web
    - Necesita la clave de API de Perplexity o la configuración del proxy de OpenRouter
summary: Configuración del proveedor de búsqueda web Perplexity (clave API, modos de búsqueda, filtrado)
title: Perplexity
x-i18n:
    generated_at: "2026-07-05T11:41:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea76a5cb7befce95756e9bcc8f9c1637fac87711d02d8a486ec2a1b9f51b73dc
    source_path: providers/perplexity-provider.md
    workflow: 16
---

El Plugin de Perplexity registra un proveedor `web_search` con dos transportes: la
API nativa de Perplexity Search (resultados estructurados con filtros) y las
finalizaciones de chat de Perplexity Sonar, directas o mediante OpenRouter (respuestas
sintetizadas por IA con citas).

<Note>
Esta página cubre la configuración del **proveedor** de Perplexity. Para la **herramienta** de Perplexity (cómo la usa el agente), consulta [búsqueda de Perplexity](/es/tools/perplexity-search).
</Note>

| Propiedad   | Valor                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| Tipo        | Proveedor de búsqueda web (no un proveedor de modelos)                 |
| Auth        | `PERPLEXITY_API_KEY` (nativo) o `OPENROUTER_API_KEY` (mediante OpenRouter) |
| Ruta de configuración | `plugins.entries.perplexity.config.webSearch.apiKey`                   |
| Sobrescrituras | `plugins.entries.perplexity.config.webSearch.baseUrl` / `.model`       |
| Obtener una clave | [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)   |

## Instalar Plugin

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Primeros pasos

<Steps>
  <Step title="Configurar la clave de API">
    ```bash
    openclaw configure --section web
    ```

    O configura la clave directamente:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

    Una clave exportada como `PERPLEXITY_API_KEY` u `OPENROUTER_API_KEY` en el
    entorno del Gateway también funciona.

  </Step>
  <Step title="Empezar a buscar">
    `web_search` detecta automáticamente Perplexity cuando su clave es la credencial
    de búsqueda disponible; no se requiere más configuración. Para fijar el proveedor explícitamente:

    ```bash
    openclaw config set tools.web.search.provider perplexity
    ```

  </Step>
</Steps>

## Modos de búsqueda

El Plugin resuelve el transporte en este orden:

1. `webSearch.baseUrl` o `webSearch.model` configurado: siempre enruta mediante finalizaciones de chat de Sonar contra ese endpoint, independientemente del tipo de clave.
2. De lo contrario, el origen de la clave decide el endpoint: el prefijo de una clave configurada elige el transporte (la configuración tiene prioridad sobre las variables de entorno); una clave de entorno usa directamente su endpoint correspondiente.

| Prefijo de clave | Transporte                                                | Funciones                                        |
| ---------------- | --------------------------------------------------------- | ------------------------------------------------ |
| `pplx-`           | API nativa de Perplexity Search (`https://api.perplexity.ai`) | Resultados estructurados, filtros de dominio/idioma/fecha |
| `sk-or-`          | OpenRouter (`https://openrouter.ai/api/v1`), modelo Sonar | Respuestas sintetizadas por IA con citas         |

Una clave configurada con cualquier otro prefijo también usa la API nativa de Search. La
ruta de finalizaciones de chat usa de forma predeterminada el modelo `perplexity/sonar-pro`; sobrescríbelo
con `plugins.entries.perplexity.config.webSearch.model`.

## Filtrado de la API nativa

| Filtro                               | Descripción                                                     | Transporte       |
| ------------------------------------ | --------------------------------------------------------------- | ---------------- |
| `count`                              | Resultados por búsqueda, 1-10 (predeterminado 5)                | Solo nativo      |
| `freshness`                          | Ventana de antigüedad: `day`, `week`, `month`, `year`           | Ambos            |
| `country`                            | Código de país de 2 letras (`us`, `de`, `jp`)                   | Solo nativo      |
| `language`                           | Código de idioma ISO 639-1 (`en`, `fr`, `zh`)                   | Solo nativo      |
| `date_after` / `date_before`         | Rango de fecha de publicación en `YYYY-MM-DD`                   | Solo nativo      |
| `domain_filter`                      | Máx. 20 dominios; lista de permitidos o lista de denegados con prefijo `-`, nunca mezcladas | Solo nativo |
| `max_tokens` / `max_tokens_per_page` | Presupuesto de contenido en todos los resultados / por página   | Solo nativo      |

Los filtros solo nativos devuelven un error descriptivo en la ruta de finalizaciones de chat.
`freshness` no se puede combinar con `date_after`/`date_before`.

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Variable de entorno para procesos daemon">
    <Warning>
    Una clave exportada solo en una shell interactiva no es visible para un
    daemon de Gateway de launchd/systemd a menos que ese entorno se importe
    explícitamente. Configura la clave en `~/.openclaw/.env` o mediante `env.shellEnv` para que el
    proceso de Gateway pueda leerla. Consulta [Variables de entorno](/es/help/environment)
    para ver el orden de precedencia completo.
    </Warning>
  </Accordion>

  <Accordion title="Configuración del proxy de OpenRouter">
    Para enrutar búsquedas de Perplexity mediante OpenRouter, configura una `OPENROUTER_API_KEY`
    (prefijo `sk-or-`) en lugar de una clave nativa de Perplexity. OpenClaw detecta la
    clave y cambia al transporte Sonar automáticamente. Es útil si ya
    tienes configurada la facturación de OpenRouter y quieres consolidar proveedores allí.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Herramienta de búsqueda de Perplexity" href="/es/tools/perplexity-search" icon="magnifying-glass">
    Cómo el agente invoca búsquedas de Perplexity e interpreta los resultados.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia de configuración completa, incluidas las entradas de Plugin.
  </Card>
</CardGroup>

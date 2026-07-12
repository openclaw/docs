---
read_when:
    - Quieres configurar Perplexity como proveedor de búsqueda web
    - Necesitas la clave de API de Perplexity o configurar el proxy de OpenRouter
summary: Configuración del proveedor de búsqueda web Perplexity (clave de API, modos de búsqueda y filtrado)
title: Perplexity
x-i18n:
    generated_at: "2026-07-11T23:30:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea76a5cb7befce95756e9bcc8f9c1637fac87711d02d8a486ec2a1b9f51b73dc
    source_path: providers/perplexity-provider.md
    workflow: 16
---

El plugin de Perplexity registra un proveedor `web_search` con dos transportes: la API de búsqueda nativa de Perplexity (resultados estructurados con filtros) y las finalizaciones de chat de Perplexity Sonar, directamente o mediante OpenRouter (respuestas sintetizadas por IA con citas).

<Note>
Esta página abarca la configuración del **proveedor** Perplexity. Para conocer la **herramienta** Perplexity (cómo la utiliza el agente), consulta [Búsqueda con Perplexity](/es/tools/perplexity-search).
</Note>

| Propiedad              | Valor                                                                           |
| ---------------------- | ------------------------------------------------------------------------------- |
| Tipo                   | Proveedor de búsqueda web (no es un proveedor de modelos)                       |
| Autenticación          | `PERPLEXITY_API_KEY` (nativa) o `OPENROUTER_API_KEY` (mediante OpenRouter)       |
| Ruta de configuración  | `plugins.entries.perplexity.config.webSearch.apiKey`                            |
| Anulaciones            | `plugins.entries.perplexity.config.webSearch.baseUrl` / `.model`                |
| Obtener una clave      | [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)            |

## Instalar el plugin

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

    También puedes configurar la clave directamente:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

    También funciona una clave exportada como `PERPLEXITY_API_KEY` u `OPENROUTER_API_KEY` en el entorno del Gateway.

  </Step>
  <Step title="Empezar a buscar">
    `web_search` detecta automáticamente Perplexity cuando su clave es la credencial de búsqueda disponible; no se requiere ninguna configuración adicional. Para fijar el proveedor explícitamente:

    ```bash
    openclaw config set tools.web.search.provider perplexity
    ```

  </Step>
</Steps>

## Modos de búsqueda

El plugin determina el transporte en este orden:

1. Si se establece `webSearch.baseUrl` o `webSearch.model`, siempre se enruta mediante las finalizaciones de chat de Sonar contra ese punto de conexión, independientemente del tipo de clave.
2. De lo contrario, el origen de la clave determina el punto de conexión: el prefijo de una clave configurada selecciona el transporte (la configuración tiene prioridad sobre las variables de entorno); una clave de entorno utiliza directamente su punto de conexión correspondiente.

| Prefijo de clave | Transporte                                                        | Funciones                                                   |
| ---------------- | ----------------------------------------------------------------- | ----------------------------------------------------------- |
| `pplx-`          | API de búsqueda nativa de Perplexity (`https://api.perplexity.ai`) | Resultados estructurados y filtros de dominio, idioma y fecha |
| `sk-or-`         | OpenRouter (`https://openrouter.ai/api/v1`), modelo Sonar          | Respuestas sintetizadas por IA con citas                    |

Una clave configurada con cualquier otro prefijo también utiliza la API de búsqueda nativa. La ruta de finalizaciones de chat utiliza de forma predeterminada el modelo `perplexity/sonar-pro`; puedes sustituirlo mediante `plugins.entries.perplexity.config.webSearch.model`.

## Filtrado de la API nativa

| Filtro                               | Descripción                                                                 | Transporte       |
| ------------------------------------ | --------------------------------------------------------------------------- | ---------------- |
| `count`                              | Resultados por búsqueda, de 1 a 10 (valor predeterminado: 5)                | Solo nativo      |
| `freshness`                          | Intervalo de actualidad: `day`, `week`, `month`, `year`                     | Ambos            |
| `country`                            | Código de país de 2 letras (`us`, `de`, `jp`)                               | Solo nativo      |
| `language`                           | Código de idioma ISO 639-1 (`en`, `fr`, `zh`)                               | Solo nativo      |
| `date_after` / `date_before`         | Intervalo de fechas de publicación en formato `YYYY-MM-DD`                  | Solo nativo      |
| `domain_filter`                      | Máximo de 20 dominios; lista de permitidos o de denegados con prefijo `-`, nunca mezcladas | Solo nativo |
| `max_tokens` / `max_tokens_per_page` | Presupuesto de contenido para todos los resultados / por página             | Solo nativo      |

Los filtros exclusivos del transporte nativo devuelven un error descriptivo en la ruta de finalizaciones de chat. `freshness` no se puede combinar con `date_after`/`date_before`.

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Variable de entorno para procesos de demonio">
    <Warning>
    Una clave exportada únicamente en un intérprete de comandos interactivo no es visible para un demonio del Gateway de launchd/systemd, a menos que ese entorno se importe explícitamente. Configura la clave en `~/.openclaw/.env` o mediante `env.shellEnv` para que el proceso del Gateway pueda leerla. Consulta [Variables de entorno](/es/help/environment) para conocer el orden de precedencia completo.
    </Warning>
  </Accordion>

  <Accordion title="Configuración del proxy de OpenRouter">
    Para enrutar las búsquedas de Perplexity mediante OpenRouter, configura una `OPENROUTER_API_KEY` (prefijo `sk-or-`) en lugar de una clave nativa de Perplexity. OpenClaw detecta la clave y cambia automáticamente al transporte Sonar. Resulta útil si ya tienes configurada la facturación de OpenRouter y quieres consolidar allí los proveedores.
  </Accordion>
</AccordionGroup>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Herramienta de búsqueda de Perplexity" href="/es/tools/perplexity-search" icon="magnifying-glass">
    Cómo invoca el agente las búsquedas de Perplexity e interpreta los resultados.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia de configuración completa, incluidas las entradas de plugins.
  </Card>
</CardGroup>

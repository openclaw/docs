---
read_when:
    - Quieres configurar Perplexity como proveedor de búsqueda web
    - Necesitas la clave API de Perplexity o la configuración del proxy de OpenRouter
summary: Configuración del proveedor de búsqueda web de Perplexity (clave API, modos de búsqueda, filtrado)
title: Perplexity
x-i18n:
    generated_at: "2026-04-24T05:45:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b2d3d6912bc9952bbe89124dd8aea600c938c8ceff21df46508b6e44e0a1159
    source_path: providers/perplexity-provider.md
    workflow: 15
---

# Perplexity (proveedor de búsqueda web)

El Plugin de Perplexity proporciona capacidades de búsqueda web a través de la
API de búsqueda de Perplexity o Perplexity Sonar mediante OpenRouter.

<Note>
Esta página cubre la configuración del **proveedor** de Perplexity. Para la
**herramienta** de Perplexity (cómo la usa el agente), consulta [Herramienta de Perplexity](/es/tools/perplexity-search).
</Note>

| Property    | Value                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| Type        | Proveedor de búsqueda web (no proveedor de modelos)                    |
| Auth        | `PERPLEXITY_API_KEY` (directo) o `OPENROUTER_API_KEY` (mediante OpenRouter) |
| Config path | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## Primeros pasos

<Steps>
  <Step title="Establece la clave API">
    Ejecuta el flujo interactivo de configuración de búsqueda web:

    ```bash
    openclaw configure --section web
    ```

    O establece la clave directamente:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Empieza a buscar">
    El agente usará automáticamente Perplexity para búsquedas web una vez que la clave esté
    configurada. No se requieren pasos adicionales.
  </Step>
</Steps>

## Modos de búsqueda

El Plugin selecciona automáticamente el transporte según el prefijo de la clave API:

<Tabs>
  <Tab title="API nativa de Perplexity (pplx-)">
    Cuando tu clave empieza por `pplx-`, OpenClaw usa la
    API nativa de búsqueda de Perplexity. Este transporte devuelve resultados estructurados y admite filtros de dominio, idioma
    y fecha (consulta las opciones de filtrado más abajo).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Cuando tu clave empieza por `sk-or-`, OpenClaw enruta a través de OpenRouter usando
    el modelo Perplexity Sonar. Este transporte devuelve respuestas sintetizadas por IA con
    citas.
  </Tab>
</Tabs>

| Key prefix | Transport                    | Features                                         |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`    | API nativa de búsqueda de Perplexity | Resultados estructurados, filtros de dominio/idioma/fecha |
| `sk-or-`   | OpenRouter (Sonar)           | Respuestas sintetizadas por IA con citas         |

## Filtrado de API nativa

<Note>
Las opciones de filtrado solo están disponibles cuando se usa la API nativa de Perplexity
(clave `pplx-`). Las búsquedas de OpenRouter/Sonar no admiten estos parámetros.
</Note>

Al usar la API nativa de Perplexity, las búsquedas admiten los siguientes filtros:

| Filter         | Description                            | Example                             |
| -------------- | -------------------------------------- | ----------------------------------- |
| País           | Código de país de 2 letras             | `us`, `de`, `jp`                    |
| Idioma         | Código de idioma ISO 639-1             | `en`, `fr`, `zh`                    |
| Rango de fechas | Ventana de recencia                   | `day`, `week`, `month`, `year`      |
| Filtros de dominio | Lista de permitidos o denegados (máx. 20 dominios) | `example.com`                       |
| Presupuesto de contenido | Límites de tokens por respuesta / por página | `max_tokens`, `max_tokens_per_page` |

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Variable de entorno para procesos daemon">
    Si OpenClaw Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que
    `PERPLEXITY_API_KEY` esté disponible para ese proceso.

    <Warning>
    Una clave establecida solo en `~/.profile` no será visible para un
    daemon launchd/systemd a menos que ese entorno se importe explícitamente. Establece la clave en
    `~/.openclaw/.env` o mediante `env.shellEnv` para asegurar que el proceso del gateway pueda
    leerla.
    </Warning>

  </Accordion>

  <Accordion title="Configuración del proxy de OpenRouter">
    Si prefieres enrutar las búsquedas de Perplexity a través de OpenRouter, establece
    `OPENROUTER_API_KEY` (prefijo `sk-or-`) en lugar de una clave nativa de Perplexity.
    OpenClaw detectará el prefijo y cambiará al transporte Sonar
    automáticamente.

    <Tip>
    El transporte OpenRouter es útil si ya tienes una cuenta de OpenRouter
    y quieres facturación consolidada entre varios proveedores.
    </Tip>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Herramienta de búsqueda de Perplexity" href="/es/tools/perplexity-search" icon="magnifying-glass">
    Cómo el agente invoca búsquedas de Perplexity e interpreta los resultados.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración, incluidas las entradas de Plugin.
  </Card>
</CardGroup>

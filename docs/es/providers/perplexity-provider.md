---
read_when:
    - Quieres configurar Perplexity como proveedor de búsqueda web
    - Necesitas la clave de API de Perplexity o la configuración de proxy de OpenRouter
summary: Configuración del proveedor de búsqueda web Perplexity (clave de API, modos de búsqueda, filtrado)
title: Perplexity
x-i18n:
    generated_at: "2026-04-30T05:58:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 36475ba0d6ab7d569f83b7f6fdc13c5dbe6b12ca5acab44e8d213da23d04a795
    source_path: providers/perplexity-provider.md
    workflow: 16
---

El Plugin Perplexity proporciona capacidades de búsqueda web mediante la API de búsqueda
de Perplexity o Perplexity Sonar a través de OpenRouter.

<Note>
Esta página es la configuración del **proveedor** de Perplexity. Para la **herramienta** de Perplexity (cómo la usa el agente), consulta [herramienta de Perplexity](/es/tools/perplexity-search).
</Note>

| Propiedad             | Valor                                                                  |
| --------------------- | ---------------------------------------------------------------------- |
| Tipo                  | Proveedor de búsqueda web (no un proveedor de modelos)                 |
| Autenticación         | `PERPLEXITY_API_KEY` (directa) o `OPENROUTER_API_KEY` (vía OpenRouter) |
| Ruta de configuración | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## Primeros pasos

<Steps>
  <Step title="Configurar la clave de API">
    Ejecuta el flujo interactivo de configuración de búsqueda web:

    ```bash
    openclaw configure --section web
    ```

    O configura la clave directamente:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Empezar a buscar">
    El agente usará automáticamente Perplexity para las búsquedas web una vez que
    la clave esté configurada. No se requieren pasos adicionales.
  </Step>
</Steps>

## Modos de búsqueda

El Plugin selecciona automáticamente el transporte según el prefijo de la clave de API:

<Tabs>
  <Tab title="API nativa de Perplexity (pplx-)">
    Cuando tu clave empieza por `pplx-`, OpenClaw usa la API nativa de búsqueda
    de Perplexity. Este transporte devuelve resultados estructurados y admite filtros
    de dominio, idioma y fecha (consulta las opciones de filtrado más abajo).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Cuando tu clave empieza por `sk-or-`, OpenClaw enruta a través de OpenRouter usando
    el modelo Perplexity Sonar. Este transporte devuelve respuestas sintetizadas por IA con
    citas.
  </Tab>
</Tabs>

| Prefijo de clave | Transporte                  | Funciones                                        |
| ---------------- | --------------------------- | ------------------------------------------------ |
| `pplx-`          | API nativa de Perplexity Search | Resultados estructurados, filtros de dominio/idioma/fecha |
| `sk-or-`         | OpenRouter (Sonar)          | Respuestas sintetizadas por IA con citas         |

## Filtrado de la API nativa

<Note>
Las opciones de filtrado solo están disponibles al usar la API nativa de Perplexity
(clave `pplx-`). Las búsquedas de OpenRouter/Sonar no admiten estos parámetros.
</Note>

Al usar la API nativa de Perplexity, las búsquedas admiten los siguientes filtros:

| Filtro             | Descripción                                  | Ejemplo                             |
| ------------------ | -------------------------------------------- | ----------------------------------- |
| País               | Código de país de 2 letras                   | `us`, `de`, `jp`                    |
| Idioma             | Código de idioma ISO 639-1                   | `en`, `fr`, `zh`                    |
| Intervalo de fechas | Ventana de actualidad                       | `day`, `week`, `month`, `year`      |
| Filtros de dominio | Lista de permitidos o bloqueados (máx. 20 dominios) | `example.com`                       |
| Presupuesto de contenido | Límites de tokens por respuesta / por página | `max_tokens`, `max_tokens_per_page` |

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Variable de entorno para procesos daemon">
    Si el Gateway de OpenClaw se ejecuta como daemon (launchd/systemd), asegúrate de que
    `PERPLEXITY_API_KEY` esté disponible para ese proceso.

    <Warning>
    Una clave configurada solo en `~/.profile` no será visible para un daemon
    launchd/systemd a menos que ese entorno se importe explícitamente. Configura la clave en
    `~/.openclaw/.env` o mediante `env.shellEnv` para garantizar que el proceso del Gateway pueda
    leerla.
    </Warning>

  </Accordion>

  <Accordion title="Configuración de proxy de OpenRouter">
    Si prefieres enrutar las búsquedas de Perplexity a través de OpenRouter, configura una
    `OPENROUTER_API_KEY` (prefijo `sk-or-`) en lugar de una clave nativa de Perplexity.
    OpenClaw detectará el prefijo y cambiará al transporte Sonar
    automáticamente.

    <Tip>
    El transporte de OpenRouter es útil si ya tienes una cuenta de OpenRouter
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
    Referencia de configuración completa, incluidas las entradas de Plugin.
  </Card>
</CardGroup>

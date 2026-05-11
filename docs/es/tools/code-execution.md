---
read_when:
    - Quieres habilitar o configurar code_execution
    - Quiere análisis remoto sin acceso al shell local
    - Quieres combinar x_search o web_search con análisis remoto en Python
summary: 'code_execution: ejecutar análisis remoto de Python en entorno aislado con xAI'
title: Ejecución de código
x-i18n:
    generated_at: "2026-05-11T20:55:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76be496e459fac9c7f6b0324cceb884d3a693fd72d7541094d1bb64a4f1b7b8b
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` ejecuta análisis de Python remoto en sandbox en la API Responses de xAI. Lo registra el plugin `xai` incluido (bajo el contrato `tools`) y se despacha al mismo endpoint `https://api.x.ai/v1/responses` que usa `x_search`.

| Propiedad             | Valor                                                                              |
| --------------------- | ---------------------------------------------------------------------------------- |
| Nombre de la herramienta | `code_execution`                                                               |
| Plugin de proveedor   | `xai` (incluido, `enabledByDefault: true`)                                         |
| Autenticación         | Perfil de autenticación de xAI, `XAI_API_KEY`, o `plugins.entries.xai.config.webSearch.apiKey` |
| Modelo predeterminado | `grok-4-1-fast`                                                                    |
| Tiempo de espera predeterminado | 30 segundos                                                               |
| `maxTurns` predeterminado | sin establecer (xAI aplica su propio límite interno)                         |

Esto es distinto de [`exec`](/es/tools/exec) local:

- `exec` ejecuta comandos de shell en tu máquina o nodo emparejado.
- `code_execution` ejecuta Python en el sandbox remoto de xAI.

Usa `code_execution` para:

- Cálculos.
- Tabulación.
- Estadísticas rápidas.
- Análisis de estilo gráfico.
- Analizar datos devueltos por `x_search` o `web_search`.

**No** lo uses cuando necesites archivos locales, tu shell, tu repositorio o dispositivos emparejados. Usa [`exec`](/es/tools/exec) para eso.

## Configuración

<Steps>
  <Step title="Proporciona una clave de API de xAI">
    Run `openclaw onboard --auth-choice xai-api-key` for `code_execution` and
    `x_search`, or set `XAI_API_KEY` / configure the key under the xAI plugin
    when you also want Grok web search to use the same credential:

    ```bash
    export XAI_API_KEY=xai-...
    ```

    O mediante configuración:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              webSearch: {
                apiKey: "xai-...",
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Habilita y ajusta code_execution">
    La herramienta está controlada por `plugins.entries.xai.config.codeExecution.enabled`. El valor predeterminado es desactivado.

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast", // override the default xAI code-execution model
                maxTurns: 2,            // optional cap on internal tool turns
                timeoutSeconds: 30,     // request timeout (default: 30)
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Reinicia el Gateway">
    ```bash
    openclaw gateway restart
    ```

    `code_execution` aparece en la lista de herramientas del agente una vez que el plugin xAI vuelve a registrarse con `enabled: true`.

  </Step>
</Steps>

## Cómo usarlo

Pide de forma natural y explicita la intención del análisis:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

La herramienta toma internamente un único parámetro `task`, así que el agente debe enviar la solicitud completa de análisis y cualquier dato en línea en un solo prompt.

## Errores

Cuando la herramienta se ejecuta sin autenticación, devuelve un error estructurado `missing_xai_api_key` que apunta al perfil de autenticación, la variable de entorno y las opciones de configuración. El error es JSON, no una excepción lanzada, por lo que el agente puede autocorregirse:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs an xAI API key. Run openclaw onboard --auth-choice xai-api-key, set XAI_API_KEY in the Gateway environment, or configure plugins.entries.xai.config.webSearch.apiKey.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Límites

- Esto es ejecución remota de xAI, no ejecución de procesos locales.
- Trata los resultados como análisis efímero, no como una sesión persistente de notebook.
- No asumas acceso a archivos locales ni a tu área de trabajo.
- Para datos recientes de X, usa primero [`x_search`](/es/tools/web#x_search) y canaliza el resultado a `code_execution`.

## Relacionado

<CardGroup cols={2}>
  <Card title="Herramienta Exec" href="/es/tools/exec" icon="terminal">
    Ejecución de shell local en tu máquina o nodo emparejado.
  </Card>
  <Card title="Aprobaciones de exec" href="/es/tools/exec-approvals" icon="shield">
    Política de permitir/denegar para la ejecución de shell.
  </Card>
  <Card title="Herramientas web" href="/es/tools/web" icon="globe">
    `web_search`, `x_search` y `web_fetch`.
  </Card>
  <Card title="Proveedor xAI" href="/es/providers/xai" icon="microchip">
    Modelos Grok, búsqueda web/X y configuración de ejecución de código.
  </Card>
</CardGroup>

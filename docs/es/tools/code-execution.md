---
read_when:
    - Quiere habilitar o configurar code_execution
    - Quieres análisis remoto sin acceso al intérprete de comandos local
    - Desea combinar x_search o web_search con análisis remoto en Python
summary: 'code_execution: ejecutar análisis remoto de Python en sandbox con xAI'
title: Ejecución de código
x-i18n:
    generated_at: "2026-05-06T05:50:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: a37e921c0016a32b01558c255bc05fcf24146f363a022da87feb94f3d6d48527
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` ejecuta análisis remoto de Python en entorno aislado en la API Responses de xAI. Lo registra el Plugin incluido `xai` (bajo el contrato `tools`) y se despacha al mismo endpoint `https://api.x.ai/v1/responses` que usa `x_search`.

| Propiedad                  | Valor                                                          |
| -------------------------- | -------------------------------------------------------------- |
| Nombre de la herramienta   | `code_execution`                                               |
| Plugin de proveedor        | `xai` (incluido, `enabledByDefault: true`)                     |
| Autenticación              | `XAI_API_KEY` o `plugins.entries.xai.config.webSearch.apiKey` |
| Modelo predeterminado      | `grok-4-1-fast`                                                |
| Tiempo de espera predeterminado | 30 segundos                                               |
| `maxTurns` predeterminado  | sin configurar (xAI aplica su propio límite interno)           |

Esto es diferente del [`exec`](/es/tools/exec) local:

- `exec` ejecuta comandos de shell en tu máquina o nodo emparejado.
- `code_execution` ejecuta Python en el entorno aislado remoto de xAI.

Usa `code_execution` para:

- Cálculos.
- Tabulación.
- Estadísticas rápidas.
- Análisis tipo gráfico.
- Analizar datos devueltos por `x_search` o `web_search`.

**No** lo uses cuando necesites archivos locales, tu shell, tu repositorio o dispositivos emparejados. Usa [`exec`](/es/tools/exec) para eso.

## Configuración

<Steps>
  <Step title="Proporciona una clave de API de xAI">
    Configura `XAI_API_KEY` en el entorno del Gateway, o configura la clave en el Plugin de xAI para que la misma credencial cubra `code_execution`, `x_search`, búsqueda web y otras herramientas de xAI:

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

    `code_execution` aparece en la lista de herramientas del agente cuando el Plugin de xAI vuelve a registrarse con `enabled: true`.

  </Step>
</Steps>

## Cómo usarlo

Pregunta con naturalidad y haz explícita la intención del análisis:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

La herramienta toma internamente un único parámetro `task`, por lo que el agente debe enviar la solicitud de análisis completa y cualquier dato en línea en un solo prompt.

## Errores

Cuando la herramienta se ejecuta sin autenticación, devuelve un error estructurado `missing_xai_api_key` que apunta a la variable de entorno y a la ruta de configuración. El error es JSON, no una excepción lanzada, por lo que el agente puede autocorregirse:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs an xAI API key. Set XAI_API_KEY in the Gateway environment, or configure plugins.entries.xai.config.webSearch.apiKey.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Límites

- Esto es ejecución remota de xAI, no ejecución de procesos locales.
- Trata los resultados como análisis efímero, no como una sesión persistente de notebook.
- No asumas acceso a archivos locales ni a tu espacio de trabajo.
- Para datos recientes de X, usa primero [`x_search`](/es/tools/web#x_search) y canaliza el resultado a `code_execution`.

## Relacionado

<CardGroup cols={2}>
  <Card title="Herramienta Exec" href="/es/tools/exec" icon="terminal">
    Ejecución de shell local en tu máquina o nodo emparejado.
  </Card>
  <Card title="Aprobaciones de Exec" href="/es/tools/exec-approvals" icon="shield">
    Política para permitir/denegar la ejecución de shell.
  </Card>
  <Card title="Herramientas web" href="/es/tools/web" icon="globe">
    `web_search`, `x_search` y `web_fetch`.
  </Card>
  <Card title="Proveedor xAI" href="/es/providers/xai" icon="microchip">
    Modelos Grok, búsqueda web/X y configuración de ejecución de código.
  </Card>
</CardGroup>

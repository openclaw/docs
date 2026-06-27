---
read_when:
    - Quieres habilitar o configurar code_execution
    - Quieres análisis remoto sin acceso al shell local
    - Quieres combinar x_search o web_search con análisis remoto en Python
summary: 'code_execution: ejecuta análisis remoto de Python en entorno aislado con xAI'
title: Ejecución de código
x-i18n:
    generated_at: "2026-06-27T13:01:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5fe174e2c2ae9989ae651e0694c12158ba460f0f1a35786d0ac628e0ff8f741
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` ejecuta análisis remotos de Python en sandbox en la Responses API de xAI. Lo registra el plugin `xai` incluido (bajo el contrato `tools`) y se despacha al mismo endpoint `https://api.x.ai/v1/responses` usado por `x_search`.

| Propiedad          | Valor                                                                             |
| ------------------ | --------------------------------------------------------------------------------- |
| Nombre de la herramienta | `code_execution`                                                                  |
| Plugin de proveedor | `xai` (incluido, `enabledByDefault: true`)                                         |
| Autenticación      | perfil de autenticación de xAI, `XAI_API_KEY`, o `plugins.entries.xai.config.webSearch.apiKey` |
| Modelo predeterminado | `grok-4-1-fast`                                                                   |
| Tiempo de espera predeterminado | 30 segundos                                                                        |
| `maxTurns` predeterminado | sin definir (xAI aplica su propio límite interno)                                        |

Esto es diferente de [`exec`](/es/tools/exec) local:

- `exec` ejecuta comandos de shell en tu máquina o nodo emparejado.
- `code_execution` ejecuta Python en el sandbox remoto de xAI.

Usa `code_execution` para:

- Cálculos.
- Tabulación.
- Estadísticas rápidas.
- Análisis de tipo gráfico.
- Analizar datos devueltos por `x_search` o `web_search`.

No lo uses cuando necesites archivos locales, tu shell, tu repositorio o dispositivos emparejados. Usa [`exec`](/es/tools/exec) para eso.

## Configuración

<Steps>
  <Step title="Provide xAI credentials">
    Inicia sesión con Grok OAuth usando una suscripción elegible de SuperGrok o X Premium,
    usa el flujo de código de dispositivo apto para entornos remotos, o almacena una clave de API. OAuth funciona
    para `code_execution` y `x_search`; `XAI_API_KEY` o la configuración de búsqueda web
    del plugin también pueden impulsar `web_search` de Grok.

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw models auth login --provider xai --device-code
    ```

    Durante una instalación nueva, las mismas opciones de autenticación están disponibles dentro de
    la incorporación:

    ```bash
    openclaw onboard --install-daemon
    openclaw onboard --install-daemon --auth-choice xai-device-code
    ```

    O usa una clave de API:

    ```bash
    openclaw models auth login --provider xai --method api-key
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

  <Step title="Enable and tune code_execution">
    `code_execution` está disponible cuando hay credenciales de xAI disponibles. Establece
    `plugins.entries.xai.config.codeExecution.enabled` en `false` para deshabilitarlo,
    o usa el mismo bloque para ajustar el modelo y el tiempo de espera.

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

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    `code_execution` aparece en la lista de herramientas del agente una vez que el plugin xAI vuelve a registrarse con `enabled: true`.

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

La herramienta toma internamente un único parámetro `task`, por lo que el agente debe enviar la solicitud completa de análisis y cualquier dato en línea en un solo prompt.

## Errores

Cuando la herramienta se ejecuta sin autenticación, devuelve un error estructurado `missing_xai_api_key` que apunta al perfil de autenticación, la variable de entorno y las opciones de configuración. El error es JSON, no una excepción lanzada, por lo que el agente puede autocorregirse:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Límites

- Esta es ejecución remota de xAI, no ejecución de procesos locales.
- Trata los resultados como análisis efímero, no como una sesión persistente de notebook.
- No asumas acceso a archivos locales ni a tu espacio de trabajo.
- Para datos recientes de X, usa primero [`x_search`](/es/tools/web#x_search) y canaliza el resultado a `code_execution`.

## Relacionado

<CardGroup cols={2}>
  <Card title="Exec tool" href="/es/tools/exec" icon="terminal">
    Ejecución de shell local en tu máquina o nodo emparejado.
  </Card>
  <Card title="Exec approvals" href="/es/tools/exec-approvals" icon="shield">
    Política de permitir/denegar para la ejecución de shell.
  </Card>
  <Card title="Web tools" href="/es/tools/web" icon="globe">
    `web_search`, `x_search` y `web_fetch`.
  </Card>
  <Card title="xAI provider" href="/es/providers/xai" icon="microchip">
    Modelos Grok, búsqueda web/X y configuración de ejecución de código.
  </Card>
</CardGroup>

---
read_when:
    - Quieres habilitar o configurar code_execution
    - Quieres análisis remoto sin acceso al shell local
    - Quieres combinar x_search o web_search con análisis remoto en Python
summary: 'code_execution: ejecuta análisis remoto de Python en entorno aislado con xAI'
title: Ejecución de código
x-i18n:
    generated_at: "2026-07-05T11:43:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a35d585a6b1b53d3ea50085459e4f180da1e91b7c72ef51f98786e4e5226f8ad
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` ejecuta análisis remotos de Python en sandbox en la Responses API de xAI
(`https://api.x.ai/v1/responses`, el mismo endpoint que usa `x_search`). Lo
registra el plugin `xai` incluido bajo el contrato `tools`.

| Propiedad          | Valor                                                                             |
| ------------------ | --------------------------------------------------------------------------------- |
| Nombre de herramienta | `code_execution`                                                               |
| Plugin proveedor   | `xai` (incluido, `enabledByDefault: true`)                                        |
| Autenticación      | perfil de autenticación de xAI, `XAI_API_KEY` o `plugins.entries.xai.config.webSearch.apiKey` |
| Modelo predeterminado | `grok-4-1-fast`                                                               |
| Tiempo de espera predeterminado | 30 segundos                                                        |
| `maxTurns` predeterminado | sin definir (xAI aplica su propio límite interno)                         |

Úsalo para cálculos, tabulación, estadísticas rápidas y análisis tipo gráfico,
incluidos datos devueltos por `x_search` o `web_search`. No tiene acceso a
archivos locales, tu shell, tu repositorio ni dispositivos emparejados, y no
conserva estado entre llamadas, así que trata cada llamada como análisis
efímero, no como una sesión de cuaderno. Para datos recientes de X, ejecuta
primero [`x_search`](/es/tools/web#x_search) y pasa el resultado.

Para ejecución local, usa [`exec`](/es/tools/exec) en su lugar.

## Configuración

<Steps>
  <Step title="Provide xAI credentials">
    OAuth requiere una suscripción SuperGrok o X Premium elegible
    (verificación con código de dispositivo, por lo que funciona desde hosts
    remotos sin callback de localhost):

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Durante una instalación nueva, la misma opción está disponible en el
    onboarding:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    O una clave de API:

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

    Cualquiera de estas tres opciones también habilita `x_search` y
    `web_search` de Grok.

  </Step>

  <Step title="Enable and tune code_execution">
    `code_execution` está disponible siempre que se resuelvan credenciales de
    xAI. Define `plugins.entries.xai.config.codeExecution.enabled` como `false`
    para deshabilitarlo, o usa el mismo bloque para sobrescribir el modelo, el
    límite de turnos o el tiempo de espera:

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

    `code_execution` aparece en la lista de herramientas del agente cuando el
    plugin xAI se vuelve a registrar con `enabled: true`.

  </Step>
</Steps>

## Cómo usarlo

Haz explícita la intención del análisis; la herramienta acepta un único
parámetro `task`, así que envía la solicitud completa y cualquier dato en línea
en un solo prompt:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

## Errores

Sin autenticación, la herramienta devuelve un error JSON estructurado (no una
excepción lanzada), para que el agente pueda autocorregirse:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

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

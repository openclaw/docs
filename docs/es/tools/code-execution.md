---
read_when:
    - Quieres habilitar o configurar `code_execution`
    - Quieres realizar análisis remoto sin acceso al shell local
    - Quieres combinar x_search o web_search con análisis remoto de Python
summary: 'code_execution: ejecutar análisis remoto de Python en un entorno aislado con xAI'
title: Ejecución de código
x-i18n:
    generated_at: "2026-07-11T23:37:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ab391daed9154f113535e6d241c45d5c08c22abdc012148a9f0f2ae5ec548b3
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` ejecuta análisis remotos de Python en un entorno aislado mediante la API Responses de xAI
(`https://api.x.ai/v1/responses`, el mismo endpoint que utiliza `x_search`). Lo
registra el plugin `xai` incluido mediante el contrato `tools`.

<Warning>
  `code_execution` se ejecuta en los servidores de xAI. xAI cobra 5 USD por cada 1000 llamadas a herramientas,
  además de los tokens de entrada y salida del modelo.
</Warning>

| Propiedad            | Valor                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| Nombre de herramienta | `code_execution`                                                                               |
| Plugin proveedor      | `xai` (incluido, `enabledByDefault: true`)                                                      |
| Autenticación         | Perfil de autenticación de xAI, `XAI_API_KEY` o `plugins.entries.xai.config.webSearch.apiKey`  |
| Modelo predeterminado | `grok-4.3`                                                                                     |
| Tiempo de espera predeterminado | 30 segundos                                                                          |
| `maxTurns` predeterminado | sin establecer (xAI aplica su propio límite interno)                                      |

Úselo para cálculos, tabulaciones, estadísticas rápidas y análisis de tipo
gráfico, incluidos los datos devueltos por `x_search` o `web_search`. No tiene
acceso a archivos locales, al shell, al repositorio ni a dispositivos emparejados, y no
conserva el estado entre llamadas; por tanto, trate cada llamada como un análisis efímero, no
como una sesión de cuaderno. Para obtener datos recientes de X, ejecute primero
[`x_search`](/es/tools/web#x_search) y pase el resultado.

Para la ejecución local, utilice [`exec`](/es/tools/exec).

## Configuración

<Steps>
  <Step title="Provide xAI credentials">
    OAuth requiere una suscripción válida a SuperGrok o X Premium
    (verificación mediante código de dispositivo, por lo que funciona desde hosts remotos sin una
    devolución de llamada a localhost):

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Durante una instalación nueva, la misma opción está disponible en la configuración inicial:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    O mediante una clave de API:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

    O mediante la configuración:

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

    Cualquiera de estas tres opciones también permite utilizar `x_search` y `web_search` de Grok.

  </Step>

  <Step title="Enable and tune code_execution">
    Si se omite `enabled`, `code_execution` solo se expone cuando el proveedor
    del modelo activo es `xai` y se pueden resolver las credenciales de xAI. Para un modelo activo
    con un proveedor conocido que no sea xAI, establezca
    `plugins.entries.xai.config.codeExecution.enabled` en `true` para habilitar
    el uso entre proveedores. Si falta el proveedor del modelo activo o no se puede resolver,
    la herramienta permanece oculta. Establezca `enabled` en `false` para deshabilitarla para todos los
    proveedores. Las credenciales de xAI son siempre obligatorias.

    Utilice el mismo bloque para sustituir el modelo, el límite de turnos o el tiempo de espera:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true, // required for a known non-xAI model provider
                model: "grok-4.3", // override the default xAI code-execution model
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

    `code_execution` aparece en la lista de herramientas del agente cuando el plugin de xAI
    vuelve a registrarse y se superan las comprobaciones anteriores del proveedor, la habilitación y la autenticación.

  </Step>
</Steps>

## Cómo utilizarla

Indique explícitamente la finalidad del análisis; la herramienta acepta un único parámetro `task`,
por lo que debe enviar la solicitud completa y todos los datos en línea en un solo prompt:

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
excepción lanzada), por lo que el agente puede autocorregirse:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Exec tool" href="/es/tools/exec" icon="terminal">
    Ejecución del shell local en su equipo o nodo emparejado.
  </Card>
  <Card title="Exec approvals" href="/es/tools/exec-approvals" icon="shield">
    Política de autorización o denegación para la ejecución del shell.
  </Card>
  <Card title="Web tools" href="/es/tools/web" icon="globe">
    `web_search`, `x_search` y `web_fetch`.
  </Card>
  <Card title="xAI provider" href="/es/providers/xai" icon="microchip">
    Modelos Grok, búsquedas web/X y configuración de ejecución de código.
  </Card>
</CardGroup>

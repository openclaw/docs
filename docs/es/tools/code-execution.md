---
read_when:
    - Quieres habilitar o configurar `code_execution`
    - Quieres realizar análisis remoto sin acceso al shell local
    - Quieres combinar x_search o web_search con análisis remoto en Python
summary: 'code_execution: ejecutar análisis remoto de Python en un entorno aislado con xAI'
title: Ejecución de código
x-i18n:
    generated_at: "2026-07-12T14:50:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1ab391daed9154f113535e6d241c45d5c08c22abdc012148a9f0f2ae5ec548b3
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` ejecuta análisis remoto de Python en un entorno aislado mediante la API Responses de xAI
(`https://api.x.ai/v1/responses`, el mismo endpoint que usa `x_search`). Lo
registra el plugin `xai` incluido mediante el contrato `tools`.

<Warning>
  `code_execution` se ejecuta en los servidores de xAI. xAI factura $5 por cada 1,000 llamadas a herramientas,
  además de los tokens de entrada y salida del modelo.
</Warning>

| Propiedad          | Valor                                                                             |
| ------------------ | --------------------------------------------------------------------------------- |
| Nombre de la herramienta | `code_execution`                                                             |
| Plugin proveedor   | `xai` (incluido, `enabledByDefault: true`)                                         |
| Autenticación      | Perfil de autenticación de xAI, `XAI_API_KEY` o `plugins.entries.xai.config.webSearch.apiKey` |
| Modelo predeterminado | `grok-4.3`                                                                     |
| Tiempo de espera predeterminado | 30 segundos                                                           |
| `maxTurns` predeterminado | sin establecer (xAI aplica su propio límite interno)                      |

Se utiliza para cálculos, tabulación, estadísticas rápidas y análisis de tipo
gráfico, incluidos los datos devueltos por `x_search` o `web_search`. No tiene
acceso a archivos locales, al shell, al repositorio ni a dispositivos vinculados,
y no conserva el estado entre llamadas; por tanto, cada llamada debe tratarse como
un análisis efímero, no como una sesión de cuaderno. Para obtener datos recientes de X, ejecute primero
[`x_search`](/es/tools/web#x_search) y canalice el resultado.

Para la ejecución local, utilice [`exec`](/es/tools/exec) en su lugar.

## Configuración

<Steps>
  <Step title="Proporcionar credenciales de xAI">
    OAuth requiere una suscripción apta de SuperGrok o X Premium
    (verificación mediante código de dispositivo, por lo que funciona desde hosts remotos sin una
    devolución de llamada a localhost):

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Durante una instalación nueva, la misma opción está disponible en la incorporación:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    O una clave de API:

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

    Cualquiera de estas tres opciones también habilita `x_search` y `web_search` de Grok.

  </Step>

  <Step title="Habilitar y ajustar code_execution">
    Si se omite `enabled`, `code_execution` solo se expone cuando el proveedor
    del modelo activo es `xai` y se pueden resolver las credenciales de xAI. Para un modelo activo
    con un proveedor conocido distinto de xAI, establezca
    `plugins.entries.xai.config.codeExecution.enabled` en `true` para habilitar
    el uso entre proveedores. Si falta el proveedor del modelo activo o no se puede resolver,
    la herramienta permanece oculta. Establezca `enabled` en `false` para deshabilitarla para todos los
    proveedores. Las credenciales de xAI siempre son obligatorias.

    Utilice el mismo bloque para sustituir el modelo, el límite de turnos o el tiempo de espera:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true, // obligatorio para un proveedor de modelos conocido distinto de xAI
                model: "grok-4.3", // sustituye el modelo predeterminado de ejecución de código de xAI
                maxTurns: 2,            // límite opcional de turnos internos de herramientas
                timeoutSeconds: 30,     // tiempo de espera de la solicitud (predeterminado: 30)
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Reiniciar el Gateway">
    ```bash
    openclaw gateway restart
    ```

    `code_execution` aparece en la lista de herramientas del agente cuando el plugin de xAI
    vuelve a registrarse y se superan las comprobaciones anteriores de proveedor, habilitación y autenticación.

  </Step>
</Steps>

## Cómo utilizarlo

Indique explícitamente la intención del análisis; la herramienta acepta un único parámetro `task`,
por lo que debe enviar la solicitud completa y todos los datos insertados en un solo prompt:

```text
Utiliza code_execution para calcular la media móvil de 7 días de estos números: ...
```

```text
Utiliza x_search para buscar publicaciones que mencionen OpenClaw esta semana y, después, utiliza code_execution para contarlas por día.
```

```text
Utiliza web_search para recopilar las cifras más recientes de pruebas comparativas de IA y, después, utiliza code_execution para comparar los cambios porcentuales.
```

## Errores

Sin autenticación, la herramienta devuelve un error JSON estructurado (no una
excepción lanzada), por lo que el agente puede autocorregirse:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution necesita credenciales de xAI. Ejecute `openclaw onboard --auth-choice xai-oauth` para iniciar sesión con Grok, ejecute `openclaw onboard --auth-choice xai-api-key`, establezca `XAI_API_KEY` en el entorno del Gateway o configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Herramienta Exec" href="/es/tools/exec" icon="terminal">
    Ejecución local del shell en su máquina o Node vinculado.
  </Card>
  <Card title="Aprobaciones de Exec" href="/es/tools/exec-approvals" icon="shield">
    Política de permitir o denegar la ejecución del shell.
  </Card>
  <Card title="Herramientas web" href="/es/tools/web" icon="globe">
    `web_search`, `x_search` y `web_fetch`.
  </Card>
  <Card title="Proveedor xAI" href="/es/providers/xai" icon="microchip">
    Modelos Grok, búsqueda web/X y configuración de ejecución de código.
  </Card>
</CardGroup>

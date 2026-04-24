---
read_when:
    - Quieres habilitar o configurar code_execution
    - Quieres análisis remoto sin acceso local al shell
    - Quieres combinar x_search o web_search con análisis remoto en Python
summary: code_execution -- ejecutar análisis remoto en Python con sandbox mediante xAI
title: Ejecución de código
x-i18n:
    generated_at: "2026-04-24T05:53:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 332afbbef15eaa832d87f263eb095eff680e8f941b9e123add9b37f9b4fa5e00
    source_path: tools/code-execution.md
    workflow: 15
---

`code_execution` ejecuta análisis remoto en Python con sandbox sobre la Responses API de xAI.
Esto es diferente de [`exec`](/es/tools/exec) local:

- `exec` ejecuta comandos de shell en tu máquina o Node
- `code_execution` ejecuta Python en el sandbox remoto de xAI

Usa `code_execution` para:

- cálculos
- tabulación
- estadísticas rápidas
- análisis tipo gráfico
- analizar datos devueltos por `x_search` o `web_search`

**No** lo uses cuando necesites archivos locales, tu shell, tu repositorio o dispositivos emparejados. Usa [`exec`](/es/tools/exec) para eso.

## Configuración

Necesitas una API key de xAI. Cualquiera de estas sirve:

- `XAI_API_KEY`
- `plugins.entries.xai.config.webSearch.apiKey`

Ejemplo:

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...",
          },
          codeExecution: {
            enabled: true,
            model: "grok-4-1-fast",
            maxTurns: 2,
            timeoutSeconds: 30,
          },
        },
      },
    },
  },
}
```

## Cómo usarlo

Pregunta de forma natural y deja clara la intención del análisis:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

La herramienta toma internamente un único parámetro `task`, así que el agente debería enviar
la solicitud completa de análisis y cualquier dato inline en un solo prompt.

## Límites

- Esto es ejecución remota de xAI, no ejecución local de procesos.
- Debe tratarse como análisis efímero, no como un cuaderno persistente.
- No presupongas acceso a archivos locales ni a tu espacio de trabajo.
- Para datos recientes de X, usa primero [`x_search`](/es/tools/web#x_search).

## Relacionado

- [Herramienta exec](/es/tools/exec)
- [Aprobaciones de exec](/es/tools/exec-approvals)
- [Herramienta apply_patch](/es/tools/apply-patch)
- [Herramientas web](/es/tools/web)
- [xAI](/es/providers/xai)

---
read_when:
    - Desea habilitar o configurar code_execution
    - Quieres análisis remoto sin acceso al intérprete de comandos local
    - Quiere combinar x_search o web_search con análisis remoto con Python
summary: code_execution -- ejecutar análisis remoto de Python en entorno aislado con xAI
title: Ejecución de código
x-i18n:
    generated_at: "2026-04-30T06:03:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe635ec65aaf593a5bd63c139fbfc69e1ba3ea7c58c2bba639ec1ebd70dba1a9
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` ejecuta análisis remoto de Python en entorno aislado en la Responses API de xAI.
Esto es diferente de [`exec`](/es/tools/exec) local:

- `exec` ejecuta comandos de shell en tu máquina o nodo
- `code_execution` ejecuta Python en el entorno aislado remoto de xAI

Usa `code_execution` para:

- cálculos
- tabulación
- estadísticas rápidas
- análisis tipo gráfico
- analizar datos devueltos por `x_search` o `web_search`

**No** lo uses cuando necesites archivos locales, tu shell, tu repositorio o
dispositivos emparejados. Usa [`exec`](/es/tools/exec) para eso.

## Configuración

Necesitas una clave de API de xAI. Cualquiera de estas funciona:

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

Pregunta de forma natural y haz explícita la intención del análisis:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

La herramienta toma internamente un único parámetro `task`, por lo que el agente debe enviar
la solicitud completa de análisis y cualquier dato insertado en una sola indicación.

## Límites

- Esta es ejecución remota de xAI, no ejecución de procesos locales.
- Debe tratarse como análisis efímero, no como un cuaderno persistente.
- No supongas acceso a archivos locales ni a tu área de trabajo.
- Para datos recientes de X, usa [`x_search`](/es/tools/web#x_search) primero.

## Relacionado

- [Herramienta Exec](/es/tools/exec)
- [Aprobaciones de Exec](/es/tools/exec-approvals)
- [Herramienta apply_patch](/es/tools/apply-patch)
- [Herramientas web](/es/tools/web)
- [xAI](/es/providers/xai)

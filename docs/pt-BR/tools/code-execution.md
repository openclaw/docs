---
read_when:
    - Você quer habilitar ou configurar code_execution
    - Você quer análise remota sem acesso ao shell local
    - Você quer combinar x_search ou web_search com análise remota em Python
summary: code_execution -- execute análise remota em Python em sandbox com xAI
title: Execução de código
x-i18n:
    generated_at: "2026-04-30T10:10:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe635ec65aaf593a5bd63c139fbfc69e1ba3ea7c58c2bba639ec1ebd70dba1a9
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` executa análise remota em Python em sandbox na Responses API da xAI.
Isso é diferente do [`exec`](/pt-BR/tools/exec) local:

- `exec` executa comandos de shell na sua máquina ou Node
- `code_execution` executa Python no sandbox remoto da xAI

Use `code_execution` para:

- cálculos
- tabulação
- estatísticas rápidas
- análise em estilo de gráfico
- analisar dados retornados por `x_search` ou `web_search`

**Não** use quando precisar de arquivos locais, do seu shell, do seu repositório ou de dispositivos
pareados. Use [`exec`](/pt-BR/tools/exec) para isso.

## Configuração

Você precisa de uma chave de API da xAI. Qualquer uma destas funciona:

- `XAI_API_KEY`
- `plugins.entries.xai.config.webSearch.apiKey`

Exemplo:

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

## Como usar

Peça de forma natural e deixe explícita a intenção da análise:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

A ferramenta recebe internamente um único parâmetro `task`, então o agente deve enviar
a solicitação completa de análise e quaisquer dados embutidos em um único prompt.

## Limites

- Esta é execução remota da xAI, não execução de processo local.
- Ela deve ser tratada como análise efêmera, não como um notebook persistente.
- Não presuma acesso a arquivos locais ou ao seu workspace.
- Para dados recentes do X, use [`x_search`](/pt-BR/tools/web#x_search) primeiro.

## Relacionados

- [Ferramenta Exec](/pt-BR/tools/exec)
- [Aprovações do Exec](/pt-BR/tools/exec-approvals)
- [Ferramenta apply_patch](/pt-BR/tools/apply-patch)
- [Ferramentas da Web](/pt-BR/tools/web)
- [xAI](/pt-BR/providers/xai)

---
read_when:
    - Você quer ativar ou configurar code_execution
    - Você quer análise remota sem acesso ao shell local
    - Você quer combinar x_search ou web_search com análise remota em Python
summary: code_execution -- executar análise remota em Python com sandbox usando xAI
title: Execução de código
x-i18n:
    generated_at: "2026-04-24T06:15:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 332afbbef15eaa832d87f263eb095eff680e8f941b9e123add9b37f9b4fa5e00
    source_path: tools/code-execution.md
    workflow: 15
---

`code_execution` executa análise remota em Python com sandbox na API Responses da xAI.
Isso é diferente de [`exec`](/pt-BR/tools/exec) local:

- `exec` executa comandos de shell na sua máquina ou Node
- `code_execution` executa Python no sandbox remoto da xAI

Use `code_execution` para:

- cálculos
- tabulação
- estatísticas rápidas
- análise em estilo de gráfico
- analisar dados retornados por `x_search` ou `web_search`

**Não** o use quando você precisar de arquivos locais, seu shell, seu repositório ou dispositivos pareados. Use [`exec`](/pt-BR/tools/exec) para isso.

## Configuração

Você precisa de uma chave de API xAI. Qualquer uma destas funciona:

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

Peça de forma natural e deixe explícita a intenção de análise:

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
a solicitação completa de análise e quaisquer dados inline em um único prompt.

## Limites

- Isso é execução remota da xAI, não execução de processo local.
- Deve ser tratado como análise efêmera, não como notebook persistente.
- Não presuma acesso a arquivos locais ou ao seu workspace.
- Para dados atuais do X, use [`x_search`](/pt-BR/tools/web#x_search) primeiro.

## Relacionado

- [Ferramenta exec](/pt-BR/tools/exec)
- [Aprovações de exec](/pt-BR/tools/exec-approvals)
- [ferramenta apply_patch](/pt-BR/tools/apply-patch)
- [Ferramentas web](/pt-BR/tools/web)
- [xAI](/pt-BR/providers/xai)

---
read_when:
    - Você quer habilitar ou configurar code_execution
    - Você quer análise remota sem acesso ao shell local
    - Você quer combinar x_search ou web_search com análise remota em Python
summary: 'code_execution: execute análise Python remota em sandbox com xAI'
title: Execução de código
x-i18n:
    generated_at: "2026-06-27T18:14:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d510d0d2b41deab527d456e675a23ef80ac3b55b5f01906ba2c43d90e4452e36
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` executa análise remota de Python em sandbox na Responses API da xAI. Ele é registrado pelo plugin `xai` incluído (sob o contrato `tools`) e despacha para o mesmo endpoint `https://api.x.ai/v1/responses` usado por `x_search`.

| Propriedade        | Valor                                                                             |
| ------------------ | --------------------------------------------------------------------------------- |
| Nome da ferramenta | `code_execution`                                                                  |
| Plugin provedor    | `xai` (incluído, `enabledByDefault: true`)                                        |
| Auth               | Perfil de auth da xAI, `XAI_API_KEY` ou `plugins.entries.xai.config.webSearch.apiKey` |
| Modelo padrão      | `grok-4-1-fast`                                                                   |
| Tempo-limite padrão | 30 segundos                                                                       |
| `maxTurns` padrão  | não definido (a xAI aplica o próprio limite interno)                              |

Isso é diferente do [`exec`](/pt-BR/tools/exec) local:

- `exec` executa comandos de shell na sua máquina ou nó pareado.
- `code_execution` executa Python no sandbox remoto da xAI.

Use `code_execution` para:

- Cálculos.
- Tabulação.
- Estatísticas rápidas.
- Análise no estilo de gráficos.
- Analisar dados retornados por `x_search` ou `web_search`.

**Não** use quando precisar de arquivos locais, do seu shell, do seu repositório ou de dispositivos pareados. Use [`exec`](/pt-BR/tools/exec) para isso.

## Configuração

<Steps>
  <Step title="Forneça credenciais da xAI">
    Entre com OAuth do Grok usando uma assinatura SuperGrok ou X Premium qualificada,
    ou armazene uma chave de API. O OAuth da xAI usa verificação por código de dispositivo,
    então funciona a partir de hosts remotos sem callback de localhost. OAuth funciona para
    `code_execution` e `x_search`; `XAI_API_KEY` ou a configuração de pesquisa web do plugin
    também podem alimentar o `web_search` do Grok.

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Durante uma instalação nova, as mesmas opções de auth ficam disponíveis dentro do
    onboarding:

    ```bash
    openclaw onboard --install-daemon
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    Ou use uma chave de API:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

    Ou via configuração:

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

  <Step title="Habilite e ajuste code_execution">
    `code_execution` fica disponível quando as credenciais da xAI estão disponíveis. Defina
    `plugins.entries.xai.config.codeExecution.enabled` como `false` para desabilitá-lo,
    ou use o mesmo bloco para ajustar o modelo e o tempo-limite.

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

  <Step title="Reinicie o Gateway">
    ```bash
    openclaw gateway restart
    ```

    `code_execution` aparece na lista de ferramentas do agente assim que o plugin xAI se registra novamente com `enabled: true`.

  </Step>
</Steps>

## Como usar

Peça naturalmente e deixe explícita a intenção da análise:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

A ferramenta recebe internamente um único parâmetro `task`, então o agente deve enviar a solicitação completa de análise e quaisquer dados inline em um único prompt.

## Erros

Quando a ferramenta é executada sem auth, ela retorna um erro estruturado `missing_xai_api_key` apontando para as opções de perfil de auth, variável de ambiente e configuração. O erro é JSON, não uma exceção lançada, então o agente pode se autocorrigir:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Limites

- Esta é execução remota da xAI, não execução de processo local.
- Trate os resultados como análise efêmera, não como uma sessão persistente de notebook.
- Não presuma acesso a arquivos locais ou ao seu workspace.
- Para dados X recentes, use [`x_search`](/pt-BR/tools/web#x_search) primeiro e canalize o resultado para `code_execution`.

## Relacionados

<CardGroup cols={2}>
  <Card title="Ferramenta Exec" href="/pt-BR/tools/exec" icon="terminal">
    Execução de shell local na sua máquina ou nó pareado.
  </Card>
  <Card title="Aprovações de exec" href="/pt-BR/tools/exec-approvals" icon="shield">
    Política de permitir/negar para execução de shell.
  </Card>
  <Card title="Ferramentas Web" href="/pt-BR/tools/web" icon="globe">
    `web_search`, `x_search` e `web_fetch`.
  </Card>
  <Card title="Provedor xAI" href="/pt-BR/providers/xai" icon="microchip">
    Modelos Grok, pesquisa web/x e configuração de execução de código.
  </Card>
</CardGroup>

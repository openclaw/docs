---
read_when:
    - Você deseja habilitar ou configurar `code_execution`
    - Você quer análise remota sem acesso ao shell local
    - Você quer combinar x_search ou web_search com análise remota em Python
summary: 'code_execution: execute análises remotas em Python em ambiente isolado com a xAI'
title: Execução de código
x-i18n:
    generated_at: "2026-07-12T00:27:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ab391daed9154f113535e6d241c45d5c08c22abdc012148a9f0f2ae5ec548b3
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` executa análises remotas em Python em sandbox na Responses API da xAI
(`https://api.x.ai/v1/responses`, o mesmo endpoint usado por `x_search`). Ele é
registrado pelo plugin `xai` incluído, conforme o contrato `tools`.

<Warning>
  `code_execution` é executado nos servidores da xAI. A xAI cobra US$ 5 por 1.000 chamadas de ferramenta,
  além dos tokens de entrada e saída do modelo.
</Warning>

| Propriedade        | Valor                                                                             |
| ------------------ | --------------------------------------------------------------------------------- |
| Nome da ferramenta | `code_execution`                                                                  |
| Plugin do provedor | `xai` (incluído, `enabledByDefault: true`)                                         |
| Autenticação       | Perfil de autenticação da xAI, `XAI_API_KEY` ou `plugins.entries.xai.config.webSearch.apiKey` |
| Modelo padrão      | `grok-4.3`                                                                        |
| Tempo limite padrão | 30 segundos                                                                       |
| `maxTurns` padrão  | não definido (a xAI aplica seu próprio limite interno)                            |

Use-o para cálculos, tabulação, estatísticas rápidas e análises no estilo de
gráficos, inclusive com dados retornados por `x_search` ou `web_search`. Ele não
tem acesso a arquivos locais, ao seu shell, ao seu repositório nem a dispositivos pareados, e
não mantém estado entre chamadas; portanto, trate cada chamada como uma análise efêmera, e não
como uma sessão de notebook. Para obter dados recentes do X, execute primeiro
[`x_search`](/pt-BR/tools/web#x_search) e encaminhe o resultado.

Para execução local, use [`exec`](/pt-BR/tools/exec).

## Configuração

<Steps>
  <Step title="Forneça as credenciais da xAI">
    O OAuth exige uma assinatura elegível do SuperGrok ou X Premium
    (verificação por código de dispositivo, portanto funciona em hosts remotos sem um
    callback de localhost):

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Durante uma nova instalação, a mesma opção está disponível na integração inicial:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    Ou use uma chave de API:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

    Ou pela configuração:

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

    Qualquer uma dessas três opções também habilita `x_search` e o `web_search` do Grok.

  </Step>

  <Step title="Ative e ajuste code_execution">
    Quando `enabled` é omitido, `code_execution` só é disponibilizado quando o provedor
    do modelo ativo é `xai` e as credenciais da xAI são encontradas. Para um modelo ativo
    com um provedor conhecido que não seja da xAI, defina
    `plugins.entries.xai.config.codeExecution.enabled` como `true` para aceitar o
    uso entre provedores. Se o provedor do modelo ativo estiver ausente ou não puder ser resolvido,
    a ferramenta permanecerá oculta. Defina `enabled` como `false` para desativá-la para todos os
    provedores. As credenciais da xAI são sempre obrigatórias.

    Use o mesmo bloco para substituir o modelo, o limite de turnos ou o tempo limite:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true, // obrigatório para um provedor de modelo conhecido que não seja da xAI
                model: "grok-4.3", // substitui o modelo padrão de execução de código da xAI
                maxTurns: 2,            // limite opcional de turnos internos da ferramenta
                timeoutSeconds: 30,     // tempo limite da solicitação (padrão: 30)
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

    `code_execution` aparecerá na lista de ferramentas do agente quando o plugin da xAI
    for registrado novamente e as verificações de provedor, ativação e autenticação acima forem aprovadas.

  </Step>
</Steps>

## Como usar

Explicite a finalidade da análise; a ferramenta recebe um único parâmetro `task`,
portanto envie a solicitação completa e todos os dados em linha em um único prompt:

```text
Use code_execution para calcular a média móvel de 7 dias destes números: ...
```

```text
Use x_search para encontrar publicações que mencionem OpenClaw nesta semana e depois use code_execution para contá-las por dia.
```

```text
Use web_search para coletar os números mais recentes de benchmarks de IA e depois use code_execution para comparar as variações percentuais.
```

## Erros

Sem autenticação, a ferramenta retorna um erro JSON estruturado (em vez de lançar
uma exceção), permitindo que o agente faça a autocorreção:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution precisa de credenciais da xAI. Execute `openclaw onboard --auth-choice xai-oauth` para entrar com o Grok, execute `openclaw onboard --auth-choice xai-api-key`, defina `XAI_API_KEY` no ambiente do Gateway ou configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Relacionados

<CardGroup cols={2}>
  <Card title="Ferramenta Exec" href="/pt-BR/tools/exec" icon="terminal">
    Execução local de shell na sua máquina ou em um Node pareado.
  </Card>
  <Card title="Aprovações do Exec" href="/pt-BR/tools/exec-approvals" icon="shield">
    Política de permissão/negação para execução de shell.
  </Card>
  <Card title="Ferramentas web" href="/pt-BR/tools/web" icon="globe">
    `web_search`, `x_search` e `web_fetch`.
  </Card>
  <Card title="Provedor xAI" href="/pt-BR/providers/xai" icon="microchip">
    Modelos Grok, pesquisa na web/no X e configuração da execução de código.
  </Card>
</CardGroup>

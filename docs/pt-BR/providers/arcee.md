---
read_when:
    - Você quer usar o Arcee AI com o OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da opção de autenticação da CLI
summary: Configuração do Arcee AI (autenticação + seleção de modelo)
title: Arcee AI
x-i18n:
    generated_at: "2026-04-24T06:06:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54989e1706901fedc8a0c816ca7ee7f877fa4b973697540dd90cb9182420043f
    source_path: providers/arcee.md
    workflow: 15
---

[Arcee AI](https://arcee.ai) oferece acesso à família Trinity de modelos mixture-of-experts por meio de uma API compatível com OpenAI. Todos os modelos Trinity são licenciados sob Apache 2.0.

Modelos da Arcee AI podem ser acessados diretamente pela plataforma Arcee ou por meio do [OpenRouter](/pt-BR/providers/openrouter).

| Propriedade | Valor                                                                                  |
| ----------- | -------------------------------------------------------------------------------------- |
| Provedor    | `arcee`                                                                                |
| Auth        | `ARCEEAI_API_KEY` (direto) ou `OPENROUTER_API_KEY` (via OpenRouter)                    |
| API         | Compatível com OpenAI                                                                  |
| Base URL    | `https://api.arcee.ai/api/v1` (direto) ou `https://openrouter.ai/api/v1` (OpenRouter) |

## Primeiros passos

<Tabs>
  <Tab title="Direto (plataforma Arcee)">
    <Steps>
      <Step title="Obter uma chave de API">
        Crie uma chave de API em [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Executar o onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Definir um modelo padrão">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Via OpenRouter">
    <Steps>
      <Step title="Obter uma chave de API">
        Crie uma chave de API em [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="Executar o onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Definir um modelo padrão">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        As mesmas refs de modelo funcionam tanto para configurações diretas quanto via OpenRouter (por exemplo `arcee/trinity-large-thinking`).
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configuração não interativa

<Tabs>
  <Tab title="Direto (plataforma Arcee)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="Via OpenRouter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## Catálogo integrado

Atualmente, o OpenClaw inclui este catálogo Arcee integrado:

| Ref do modelo                  | Nome                   | Entrada | Contexto | Custo (entrada/saída por 1M) | Observações                                 |
| ------------------------------ | ---------------------- | ------- | -------- | ---------------------------- | ------------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | texto   | 256K     | $0.25 / $0.90                | Modelo padrão; reasoning habilitado         |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | texto   | 128K     | $0.25 / $1.00                | Uso geral; 400B params, 13B ativos          |
| `arcee/trinity-mini`           | Trinity Mini 26B       | texto   | 128K     | $0.045 / $0.15               | Rápido e econômico; function calling        |

<Tip>
A predefinição de onboarding define `arcee/trinity-large-thinking` como modelo padrão.
</Tip>

## Recursos compatíveis

| Recurso                                      | Compatível                   |
| -------------------------------------------- | ---------------------------- |
| Streaming                                    | Sim                          |
| Uso de ferramentas / function calling        | Sim                          |
| Saída estruturada (modo JSON e JSON schema)  | Sim                          |
| Thinking estendido                           | Sim (Trinity Large Thinking) |

<AccordionGroup>
  <Accordion title="Observação sobre ambiente">
    Se o Gateway estiver em execução como daemon (launchd/systemd), certifique-se de que `ARCEEAI_API_KEY`
    (ou `OPENROUTER_API_KEY`) esteja disponível para esse processo (por exemplo, em
    `~/.openclaw/.env` ou via `env.shellEnv`).
  </Accordion>

  <Accordion title="Roteamento do OpenRouter">
    Ao usar modelos Arcee via OpenRouter, aplicam-se as mesmas refs de modelo `arcee/*`.
    O OpenClaw lida com o roteamento de forma transparente com base na sua escolha de autenticação. Consulte a
    [documentação do provedor OpenRouter](/pt-BR/providers/openrouter) para detalhes de configuração específicos do OpenRouter.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/pt-BR/providers/openrouter" icon="shuffle">
    Acesse modelos Arcee e muitos outros por meio de uma única chave de API.
  </Card>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
</CardGroup>

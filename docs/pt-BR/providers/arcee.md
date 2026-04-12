---
read_when:
    - Você quer usar Arcee AI com OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da opção de auth da CLI
summary: Configuração do Arcee AI (auth + seleção de modelo)
title: Arcee AI
x-i18n:
    generated_at: "2026-04-12T23:29:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68c5fddbe272c69611257ceff319c4de7ad21134aaf64582d60720a6f3b853cc
    source_path: providers/arcee.md
    workflow: 15
---

# Arcee AI

[Arcee AI](https://arcee.ai) fornece acesso à família Trinity de modelos mixture-of-experts por meio de uma API compatível com OpenAI. Todos os modelos Trinity são licenciados sob Apache 2.0.

Os modelos do Arcee AI podem ser acessados diretamente pela plataforma Arcee ou por meio do [OpenRouter](/pt-BR/providers/openrouter).

| Propriedade | Valor                                                                                |
| ----------- | ------------------------------------------------------------------------------------ |
| Provedor    | `arcee`                                                                              |
| Auth        | `ARCEEAI_API_KEY` (direto) ou `OPENROUTER_API_KEY` (via OpenRouter)                  |
| API         | compatível com OpenAI                                                                |
| Base URL    | `https://api.arcee.ai/api/v1` (direto) ou `https://openrouter.ai/api/v1` (OpenRouter) |

## Primeiros passos

<Tabs>
  <Tab title="Direct (plataforma Arcee)">
    <Steps>
      <Step title="Obtenha uma chave de API">
        Crie uma chave de API em [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Execute o onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Defina um modelo padrão">
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
      <Step title="Obtenha uma chave de API">
        Crie uma chave de API em [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="Execute o onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Defina um modelo padrão">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        As mesmas referências de modelo funcionam tanto para configurações diretas quanto via OpenRouter (por exemplo, `arcee/trinity-large-thinking`).
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configuração não interativa

<Tabs>
  <Tab title="Direct (plataforma Arcee)">
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

No momento, o OpenClaw inclui este catálogo Arcee integrado:

| Model ref                      | Nome                   | Entrada | Contexto | Custo (in/out por 1M) | Observações                                |
| ------------------------------ | ---------------------- | ------- | -------- | --------------------- | ------------------------------------------ |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text    | 256K     | $0.25 / $0.90         | Modelo padrão; raciocínio ativado          |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text    | 128K     | $0.25 / $1.00         | Uso geral; 400B params, 13B ativos         |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text    | 128K     | $0.045 / $0.15        | Rápido e econômico; function calling       |

<Tip>
O preset de onboarding define `arcee/trinity-large-thinking` como modelo padrão.
</Tip>

## Recursos compatíveis

| Recurso                                      | Compatível                  |
| -------------------------------------------- | --------------------------- |
| Streaming                                    | Sim                         |
| Uso de ferramentas / function calling        | Sim                         |
| Saída estruturada (modo JSON e esquema JSON) | Sim                         |
| Raciocínio estendido                         | Sim (Trinity Large Thinking) |

<AccordionGroup>
  <Accordion title="Observação sobre ambiente">
    Se o Gateway for executado como daemon (launchd/systemd), certifique-se de que `ARCEEAI_API_KEY`
    (ou `OPENROUTER_API_KEY`) esteja disponível para esse processo (por exemplo, em
    `~/.openclaw/.env` ou via `env.shellEnv`).
  </Accordion>

  <Accordion title="Roteamento do OpenRouter">
    Ao usar modelos Arcee via OpenRouter, as mesmas referências de modelo `arcee/*` se aplicam.
    O OpenClaw faz o roteamento de forma transparente com base na sua escolha de auth. Consulte a
    [documentação do provedor OpenRouter](/pt-BR/providers/openrouter) para detalhes de configuração
    específicos do OpenRouter.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/pt-BR/providers/openrouter" icon="shuffle">
    Acesse modelos Arcee e muitos outros por meio de uma única chave de API.
  </Card>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
</CardGroup>

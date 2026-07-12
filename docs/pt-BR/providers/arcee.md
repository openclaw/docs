---
read_when:
    - Você quer usar a Arcee AI com o OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da opção de autenticação da CLI
summary: Configuração do Arcee AI (autenticação + seleção de modelo)
title: Arcee AI
x-i18n:
    generated_at: "2026-07-12T15:31:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fe519393db3cf39f1b14b8121603b6f667102ac8c122fb6560d9b73a6ee6b0a3
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) disponibiliza a família Trinity de modelos mixture-of-experts por meio de uma API compatível com a OpenAI. Todos os modelos Trinity são licenciados sob a licença Apache 2.0. O Arcee é um plugin oficial do OpenClaw, não incluído no núcleo, portanto requer uma etapa de instalação antes da configuração inicial.

Acesse os modelos Arcee diretamente pela plataforma Arcee ou pelo [OpenRouter](/pt-BR/providers/openrouter).

| Propriedade | Valor                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| Provedor | `arcee`                                                                               |
| Autenticação     | `ARCEEAI_API_KEY` (direto) ou `OPENROUTER_API_KEY` (via OpenRouter)                   |
| API      | Compatível com a OpenAI                                                                     |
| URL base | `https://api.arcee.ai/api/v1` (direto) ou `https://openrouter.ai/api/v1` (OpenRouter) |

## Instalar o plugin

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

## Primeiros passos

<Tabs>
  <Tab title="Direto (plataforma Arcee)">
    <Steps>
      <Step title="Obter uma chave de API">
        Crie uma chave de API na [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Executar a configuração inicial">
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
        Crie uma chave de API no [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="Executar a configuração inicial">
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

        As mesmas referências de modelo funcionam tanto para configurações diretas quanto via OpenRouter.
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

| Referência do modelo                      | Nome                   | Entrada | Contexto | Saída máxima | Custo (entrada/saída por 1M) | Ferramentas | Observações                                     |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------- | ----- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | texto  | 256K    | 80K        | $0.25 / $0.90        | Não    | Modelo padrão; raciocínio estendido          |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | texto  | 128K    | 16K        | $0.25 / $1.00        | Sim   | Uso geral; 400B parâmetros, 13B ativos  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | texto  | 128K    | 80K        | $0.045 / $0.15       | Sim   | Rápido e econômico; chamada de funções |

<Tip>
A predefinição de configuração inicial define `arcee/trinity-large-thinking` como o modelo padrão.
</Tip>

## Recursos compatíveis

| Recurso                                       | Compatível                                    |
| --------------------------------------------- | -------------------------------------------- |
| Streaming                                     | Sim                                          |
| Uso de ferramentas / chamada de funções                   | Sim (Trinity Mini, Trinity Large Preview)    |
| Saída estruturada (modo JSON e esquema JSON) | Sim                                          |
| Raciocínio estendido                             | Sim (Trinity Large Thinking; ferramentas desativadas) |

<AccordionGroup>
  <Accordion title="Observação sobre o ambiente">
    Se o Gateway for executado como um daemon (launchd/systemd), garanta que `ARCEEAI_API_KEY`
    (ou `OPENROUTER_API_KEY`) esteja disponível para esse processo, por exemplo em
    `~/.openclaw/.env` ou via `env.shellEnv`.
  </Accordion>

  <Accordion title="Roteamento do OpenRouter">
    Ao usar modelos Arcee via OpenRouter, aplicam-se as mesmas referências de modelo `arcee/*`.
    O OpenClaw faz o roteamento de forma transparente com base na sua opção de autenticação. Consulte a
    [documentação do provedor OpenRouter](/pt-BR/providers/openrouter) para obter detalhes de configuração
    específicos do OpenRouter.
  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/pt-BR/providers/openrouter" icon="shuffle">
    Acesse os modelos Arcee e muitos outros com uma única chave de API.
  </Card>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Como escolher provedores, referências de modelo e o comportamento de failover.
  </Card>
</CardGroup>

---
read_when:
    - Você quer usar a Arcee AI com o OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da opção de autenticação da CLI
summary: Configuração da Arcee AI (autenticação + seleção de modelo)
title: Arcee AI
x-i18n:
    generated_at: "2026-06-27T18:01:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15570c1d018104377a473fe5f9b556d9a6ffd2dea6db5d55d46ca3702e237101
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) fornece acesso à família Trinity de modelos mixture-of-experts por meio de uma API compatível com OpenAI. Todos os modelos Trinity são licenciados sob Apache 2.0.

Os modelos da Arcee AI podem ser acessados diretamente pela plataforma Arcee ou por meio do [OpenRouter](/pt-BR/providers/openrouter).

| Propriedade | Valor                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| Provedor | `arcee`                                                                               |
| Autenticação     | `ARCEEAI_API_KEY` (direta) ou `OPENROUTER_API_KEY` (via OpenRouter)                   |
| API      | Compatível com OpenAI                                                                     |
| URL base | `https://api.arcee.ai/api/v1` (direta) ou `https://openrouter.ai/api/v1` (OpenRouter) |

## Instalar Plugin

Instale o Plugin oficial e reinicie o Gateway:

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

## Primeiros passos

<Tabs>
  <Tab title="Direct (Arcee platform)">
    <Steps>
      <Step title="Get an API key">
        Crie uma chave de API na [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Get an API key">
        Crie uma chave de API no [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        As mesmas refs de modelo funcionam tanto para configurações diretas quanto via OpenRouter (por exemplo, `arcee/trinity-large-thinking`).
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configuração não interativa

<Tabs>
  <Tab title="Direct (Arcee platform)">
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

Atualmente, o OpenClaw inclui este catálogo estático da Arcee:

| Ref do modelo                  | Nome                   | Entrada | Contexto | Custo (entrada/saída por 1M) | Observações                               |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | texto  | 256K    | $0.25 / $0.90        | Modelo padrão; raciocínio habilitado      |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | texto  | 128K    | $0.25 / $1.00        | Uso geral; 400B parâmetros, 13B ativos    |
| `arcee/trinity-mini`           | Trinity Mini 26B       | texto  | 128K    | $0.045 / $0.15       | Rápido e econômico; chamada de função |

<Tip>
A predefinição de onboarding define `arcee/trinity-large-thinking` como o modelo padrão.
</Tip>

## Recursos compatíveis

| Recurso                                       | Compatível                                    |
| --------------------------------------------- | -------------------------------------------- |
| Streaming                                     | Sim                                          |
| Uso de ferramentas / chamada de função        | Sim (Trinity Mini, Trinity Large Preview)    |
| Saída estruturada (modo JSON e esquema JSON)  | Sim                                          |
| Extended thinking                             | Sim (Trinity Large Thinking; ferramentas desabilitadas) |

<AccordionGroup>
  <Accordion title="Environment note">
    Se o Gateway for executado como daemon (launchd/systemd), verifique se `ARCEEAI_API_KEY`
    (ou `OPENROUTER_API_KEY`) está disponível para esse processo (por exemplo, em
    `~/.openclaw/.env` ou via `env.shellEnv`).
  </Accordion>

  <Accordion title="OpenRouter routing">
    Ao usar modelos da Arcee via OpenRouter, aplicam-se as mesmas refs de modelo `arcee/*`.
    O OpenClaw gerencia o roteamento de forma transparente com base na sua escolha de autenticação. Consulte a
    [documentação do provedor OpenRouter](/pt-BR/providers/openrouter) para detalhes de configuração
    específicos do OpenRouter.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/pt-BR/providers/openrouter" icon="shuffle">
    Acesse modelos da Arcee e muitos outros por meio de uma única chave de API.
  </Card>
  <Card title="Model selection" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
</CardGroup>

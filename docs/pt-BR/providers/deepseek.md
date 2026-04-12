---
read_when:
    - Você quer usar o DeepSeek com o OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da opção de auth da CLI
summary: Configuração do DeepSeek (auth + seleção de modelo)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-12T23:30:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad06880bd1ab89f72f9e31f4927e2c099dcf6b4e0ff2b3fcc91a24468fbc089d
    source_path: providers/deepseek.md
    workflow: 15
---

# DeepSeek

[DeepSeek](https://www.deepseek.com) fornece modelos de IA poderosos com uma API compatível com OpenAI.

| Propriedade | Valor                      |
| ----------- | -------------------------- |
| Provedor    | `deepseek`                 |
| Auth        | `DEEPSEEK_API_KEY`         |
| API         | compatível com OpenAI      |
| Base URL    | `https://api.deepseek.com` |

## Primeiros passos

<Steps>
  <Step title="Obtenha sua chave de API">
    Crie uma chave de API em [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Execute o onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Isso solicitará sua chave de API e definirá `deepseek/deepseek-chat` como o modelo padrão.

  </Step>
  <Step title="Verifique se os modelos estão disponíveis">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Configuração não interativa">
    Para instalações automatizadas ou sem interface, passe todos os sinalizadores diretamente:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Se o Gateway for executado como daemon (launchd/systemd), certifique-se de que `DEEPSEEK_API_KEY`
esteja disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via
`env.shellEnv`).
</Warning>

## Catálogo integrado

| Model ref                    | Nome              | Entrada | Contexto | Saída máx. | Observações                                        |
| ---------------------------- | ----------------- | ------- | -------- | ---------- | -------------------------------------------------- |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text    | 131,072  | 8,192      | Modelo padrão; superfície sem raciocínio do DeepSeek V3.2 |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text    | 131,072  | 65,536     | Superfície V3.2 com raciocínio ativado             |

<Tip>
No momento, ambos os modelos integrados anunciam compatibilidade com uso de streaming no código-fonte.
</Tip>

## Exemplo de configuração

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-chat" },
    },
  },
}
```

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração para agentes, modelos e provedores.
  </Card>
</CardGroup>

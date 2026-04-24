---
read_when:
    - Você quer usar o DeepSeek com OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da opção de autenticação da CLI
summary: Configuração do DeepSeek (autenticação + seleção de modelo)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-24T15:21:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b0d2345c72328e14351d71c5784204dc6ed9dc922f919b6adfac394001c3261
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) oferece modelos de IA poderosos com uma API compatível com OpenAI.

| Propriedade | Valor                      |
| ----------- | -------------------------- |
| Provedor    | `deepseek`                 |
| Autenticação     | `DEEPSEEK_API_KEY`         |
| API         | Compatível com OpenAI      |
| URL base    | `https://api.deepseek.com` |

## Primeiros passos

<Steps>
  <Step title="Obtenha sua chave de API">
    Crie uma chave de API em [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Execute a integração inicial">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Isso solicitará sua chave de API e definirá `deepseek/deepseek-v4-flash` como o modelo padrão.

  </Step>
  <Step title="Verifique se os modelos estão disponíveis">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Configuração não interativa">
    Para instalações com script ou sem interface, passe todos os sinalizadores diretamente:

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
Se o Gateway estiver em execução como daemon (launchd/systemd), certifique-se de que `DEEPSEEK_API_KEY`
esteja disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via
`env.shellEnv`).
</Warning>

## Catálogo integrado

| Ref do modelo                | Nome              | Entrada | Contexto  | Saída máx. | Observações                                |
| ---------------------------- | ----------------- | ------- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text    | 1,000,000 | 384,000    | Modelo padrão; superfície V4 com suporte a thinking |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text    | 1,000,000 | 384,000    | Superfície V4 com suporte a thinking                |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text    | 131,072   | 8,192      | Superfície sem thinking do DeepSeek V3.2         |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text    | 131,072   | 65,536     | Superfície V3.2 com raciocínio habilitado             |

<Tip>
Os modelos V4 oferecem suporte ao controle `thinking` do DeepSeek. O OpenClaw também reproduz
`reasoning_content` do DeepSeek em turnos de acompanhamento para que sessões de thinking com chamadas de
ferramenta possam continuar.
</Tip>

## Exemplo de configuração

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração para agentes, modelos e provedores.
  </Card>
</CardGroup>

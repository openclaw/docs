---
read_when:
    - Você quer usar o Fireworks com o OpenClaw
    - Você precisa da variável de ambiente da chave de API do Fireworks ou do ID do modelo padrão
summary: Configuração do Fireworks (auth + seleção de modelo)
title: Fireworks
x-i18n:
    generated_at: "2026-04-12T23:31:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a85d9507c19e275fdd846a303d844eda8045d008774d4dde1eae408e8716b6f
    source_path: providers/fireworks.md
    workflow: 15
---

# Fireworks

[Fireworks](https://fireworks.ai) expõe modelos open-weight e roteados por meio de uma API compatível com OpenAI. O OpenClaw inclui um Plugin de provedor Fireworks empacotado.

| Propriedade   | Valor                                                  |
| ------------- | ------------------------------------------------------ |
| Provedor      | `fireworks`                                            |
| Auth          | `FIREWORKS_API_KEY`                                    |
| API           | chat/completions compatível com OpenAI                 |
| URL base      | `https://api.fireworks.ai/inference/v1`                |
| Modelo padrão | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## Primeiros passos

<Steps>
  <Step title="Configure a autenticação do Fireworks pelo onboarding">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    Isso armazena sua chave do Fireworks na configuração do OpenClaw e define o modelo inicial Fire Pass como padrão.

  </Step>
  <Step title="Verifique se o modelo está disponível">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## Exemplo não interativo

Para configurações por script ou CI, passe todos os valores pela linha de comando:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catálogo integrado

| Ref de modelo                                          | Nome                        | Entrada    | Contexto | Saída máx. | Observações                                 |
| ------------------------------------------------------ | --------------------------- | ---------- | -------- | ---------- | ------------------------------------------- |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000  | 256,000    | Modelo inicial empacotado padrão no Fireworks |

<Tip>
Se o Fireworks publicar um modelo mais novo, como uma nova versão do Qwen ou do Gemma, você poderá trocar diretamente para ele usando seu ID de modelo do Fireworks sem esperar por uma atualização do catálogo empacotado.
</Tip>

## IDs de modelo Fireworks personalizados

O OpenClaw também aceita IDs dinâmicos de modelo Fireworks. Use o ID exato do modelo ou roteador mostrado pelo Fireworks e prefixe-o com `fireworks/`.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Como funciona o prefixo do ID do modelo">
    Toda ref de modelo Fireworks no OpenClaw começa com `fireworks/`, seguido do ID exato ou do caminho do roteador da plataforma Fireworks. Por exemplo:

    - Modelo de roteador: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Modelo direto: `fireworks/accounts/fireworks/models/<model-name>`

    O OpenClaw remove o prefixo `fireworks/` ao montar a solicitação da API e envia o caminho restante para o endpoint do Fireworks.

  </Accordion>

  <Accordion title="Observação sobre ambiente">
    Se o Gateway for executado fora do seu shell interativo, certifique-se de que `FIREWORKS_API_KEY` também esteja disponível para esse processo.

    <Warning>
    Uma chave presente apenas em `~/.profile` não ajudará um daemon `launchd/systemd`, a menos que esse ambiente também seja importado ali. Defina a chave em `~/.openclaw/.env` ou via `env.shellEnv` para garantir que o processo do gateway consiga lê-la.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Solução geral de problemas e FAQ.
  </Card>
</CardGroup>

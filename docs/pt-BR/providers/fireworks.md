---
read_when:
    - Você quer usar Fireworks com OpenClaw
    - Você precisa da variável de ambiente da chave da API do Fireworks ou do ID do modelo padrão
summary: Configuração do Fireworks (autenticação + seleção de modelo)
title: Fireworks
x-i18n:
    generated_at: "2026-04-22T04:26:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b2aae346f1fb7e6d649deefe9117d8d8399c0441829cb49132ff5b86a7051ce
    source_path: providers/fireworks.md
    workflow: 15
---

# Fireworks

[Fireworks](https://fireworks.ai) expõe modelos open-weight e roteados por meio de uma API compatível com OpenAI. O OpenClaw inclui um Plugin de provider Fireworks empacotado.

| Propriedade   | Valor                                                  |
| ------------- | ------------------------------------------------------ |
| Provider      | `fireworks`                                            |
| Autenticação  | `FIREWORKS_API_KEY`                                    |
| API           | `chat/completions` compatível com OpenAI               |
| Base URL      | `https://api.fireworks.ai/inference/v1`                |
| Modelo padrão | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## Primeiros passos

<Steps>
  <Step title="Configurar autenticação do Fireworks pelo onboarding">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    Isso armazena sua chave do Fireworks na configuração do OpenClaw e define o modelo inicial Fire Pass como padrão.

  </Step>
  <Step title="Verificar se o modelo está disponível">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## Exemplo não interativo

Para configurações via script ou CI, passe todos os valores na linha de comando:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catálogo integrado

| Ref de modelo                                         | Nome                        | Entrada    | Contexto | Saída máx. | Observações                                                                                                                                          |
| ----------------------------------------------------- | --------------------------- | ---------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`       | Kimi K2.6                   | text,image | 262,144  | 262,144    | Modelo Kimi mais recente no Fireworks. Thinking é desativado para requisições K2.6 no Fireworks; roteie diretamente pelo Moonshot se precisar da saída de thinking do Kimi. |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000  | 256,000    | Modelo inicial padrão empacotado no Fireworks                                                                                                       |

<Tip>
Se o Fireworks publicar um modelo mais novo, como uma nova versão de Qwen ou Gemma, você pode mudar diretamente para ele usando seu ID de modelo Fireworks sem esperar por uma atualização do catálogo empacotado.
</Tip>

## IDs de modelo Fireworks personalizados

O OpenClaw também aceita IDs dinâmicos de modelo Fireworks. Use o ID exato do modelo ou roteador mostrado pelo Fireworks e prefixe com `fireworks/`.

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
    Toda ref de modelo Fireworks no OpenClaw começa com `fireworks/`, seguida pelo ID exato ou caminho do roteador da plataforma Fireworks. Por exemplo:

    - Modelo de roteador: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Modelo direto: `fireworks/accounts/fireworks/models/<model-name>`

    O OpenClaw remove o prefixo `fireworks/` ao montar a requisição da API e envia o caminho restante para o endpoint do Fireworks.

  </Accordion>

  <Accordion title="Observação sobre ambiente">
    Se o Gateway estiver rodando fora do seu shell interativo, garanta que `FIREWORKS_API_KEY` também esteja disponível para esse processo.

    <Warning>
    Uma chave presente apenas em `~/.profile` não ajudará um daemon launchd/systemd, a menos que esse ambiente também seja importado ali. Defina a chave em `~/.openclaw/.env` ou via `env.shellEnv` para garantir que o processo do gateway possa lê-la.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de providers, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Solução geral de problemas e FAQ.
  </Card>
</CardGroup>

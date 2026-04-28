---
read_when:
    - Você quer usar o Fireworks com o OpenClaw
    - Você precisa da variável de ambiente da chave de API do Fireworks ou do ID do modelo padrão
summary: Configuração do Fireworks (autenticação + seleção de modelo)
title: Fireworks
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T06:07:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66ad831b9a04897c8850f28d246ec6c1efe1006c2a7f59295a8a78746c78e645
    source_path: providers/fireworks.md
    workflow: 15
---

[Fireworks](https://fireworks.ai) expõe modelos open-weight e roteados por meio de uma API compatível com OpenAI. O OpenClaw inclui um plugin integrado de provider do Fireworks.

| Propriedade   | Valor                                                  |
| ------------- | ------------------------------------------------------ |
| Provider      | `fireworks`                                            |
| Auth          | `FIREWORKS_API_KEY`                                    |
| API           | chat/completions compatível com OpenAI                 |
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

Para configurações com script ou CI, passe todos os valores na linha de comando:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catálogo integrado

| Ref do modelo                                         | Nome                        | Entrada    | Contexto | Saída máxima | Observações                                                                                                                                           |
| ----------------------------------------------------- | --------------------------- | ---------- | -------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`       | Kimi K2.6                   | text,image | 262,144  | 262,144      | Modelo Kimi mais recente no Fireworks. Thinking é desabilitado para requisições Fireworks K2.6; roteie diretamente pelo Moonshot se precisar de saída de thinking do Kimi. |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000  | 256,000      | Modelo inicial integrado padrão no Fireworks                                                                                                          |

<Tip>
Se o Fireworks publicar um modelo mais novo, como um lançamento recente de Qwen ou Gemma, você pode alternar diretamente para ele usando seu ID de modelo Fireworks, sem esperar por uma atualização do catálogo integrado.
</Tip>

## IDs personalizados de modelo Fireworks

O OpenClaw também aceita IDs dinâmicos de modelo Fireworks. Use o ID exato do modelo ou router exibido pelo Fireworks e prefixe-o com `fireworks/`.

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
    Toda ref de modelo Fireworks no OpenClaw começa com `fireworks/`, seguida pelo ID exato ou caminho do router da plataforma Fireworks. Por exemplo:

    - Modelo router: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Modelo direto: `fireworks/accounts/fireworks/models/<model-name>`

    O OpenClaw remove o prefixo `fireworks/` ao montar a requisição da API e envia o caminho restante ao endpoint do Fireworks.

  </Accordion>

  <Accordion title="Observação sobre ambiente">
    Se o Gateway for executado fora do seu shell interativo, garanta que `FIREWORKS_API_KEY` também esteja disponível para esse processo.

    <Warning>
    Uma chave presente apenas em `~/.profile` não ajudará um daemon launchd/systemd, a menos que esse ambiente também seja importado ali. Defina a chave em `~/.openclaw/.env` ou via `env.shellEnv` para garantir que o processo do gateway consiga lê-la.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de providers, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Solução de problemas geral e FAQ.
  </Card>
</CardGroup>

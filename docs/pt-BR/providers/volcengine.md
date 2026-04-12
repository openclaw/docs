---
read_when:
    - Você quer usar modelos Volcano Engine ou Doubao com o OpenClaw
    - Você precisa da configuração de chave de API da Volcengine
summary: Configuração da Volcano Engine (modelos Doubao, endpoints gerais + de coding)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-12T23:33:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: a21f390da719f79c88c6d55a7d952d35c2ce5ff26d910c9f10020132cd7d2f4c
    source_path: providers/volcengine.md
    workflow: 15
---

# Volcengine (Doubao)

O provedor Volcengine dá acesso a modelos Doubao e a modelos de terceiros
hospedados na Volcano Engine, com endpoints separados para cargas de trabalho
gerais e de coding.

| Detail    | Value                                               |
| --------- | --------------------------------------------------- |
| Provedores | `volcengine` (geral) + `volcengine-plan` (coding) |
| Auth      | `VOLCANO_ENGINE_API_KEY`                            |
| API       | compatível com OpenAI                               |

## Introdução

<Steps>
  <Step title="Defina a chave de API">
    Execute o onboarding interativo:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Isso registra os provedores geral (`volcengine`) e de coding (`volcengine-plan`) a partir de uma única chave de API.

  </Step>
  <Step title="Defina um modelo padrão">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="Verifique se o modelo está disponível">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Para configuração não interativa (CI, scripts), passe a chave diretamente:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Provedores e endpoints

| Provider          | Endpoint                                  | Use case       |
| ----------------- | ----------------------------------------- | -------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Modelos gerais |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Modelos de coding  |

<Note>
Ambos os provedores são configurados a partir de uma única chave de API. A configuração registra ambos automaticamente.
</Note>

## Modelos disponíveis

<Tabs>
  <Tab title="Geral (volcengine)">
    | Model ref                                    | Name                            | Input       | Context |
    | -------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | text, image | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | text, image | 256,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | text, image | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | text, image | 200,000 |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | text, image | 128,000 |
  </Tab>
  <Tab title="Coding (volcengine-plan)">
    | Model ref                                         | Name                     | Input | Context |
    | ------------------------------------------------- | ------------------------ | ----- | ------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | text  | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | text  | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | text  | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | text  | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | text  | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | text  | 256,000 |
  </Tab>
</Tabs>

## Observações avançadas

<AccordionGroup>
  <Accordion title="Modelo padrão após o onboarding">
    `openclaw onboard --auth-choice volcengine-api-key` atualmente define
    `volcengine-plan/ark-code-latest` como modelo padrão ao mesmo tempo em que registra
    o catálogo geral `volcengine`.
  </Accordion>

  <Accordion title="Comportamento de fallback do seletor de modelo">
    Durante a seleção de modelo em onboarding/configure, o auth choice da Volcengine prefere
    linhas `volcengine/*` e `volcengine-plan/*`. Se esses modelos ainda não
    estiverem carregados, o OpenClaw faz fallback para o catálogo não filtrado em vez de mostrar um
    seletor com escopo de provedor vazio.
  </Accordion>

  <Accordion title="Variáveis de ambiente para processos daemon">
    Se o Gateway for executado como daemon (launchd/systemd), certifique-se de que
    `VOLCANO_ENGINE_API_KEY` esteja disponível para esse processo (por exemplo, em
    `~/.openclaw/.env` ou via `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Ao executar o OpenClaw como serviço em segundo plano, variáveis de ambiente definidas no seu
shell interativo não são herdadas automaticamente. Veja a observação sobre daemon acima.
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolhendo provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de config para agentes, modelos e provedores.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e etapas de depuração.
  </Card>
  <Card title="FAQ" href="/pt-BR/help/faq" icon="circle-question">
    Perguntas frequentes sobre a configuração do OpenClaw.
  </Card>
</CardGroup>

---
read_when:
    - Você quer usar Volcano Engine ou modelos Doubao com o OpenClaw
    - Você precisa da configuração da chave de API do Volcengine
summary: Configuração do Volcano Engine (modelos Doubao, endpoints gerais + de coding)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-24T06:09:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6091da50fbab3a01cdc4337a496f361987f1991a2e2b7764e7a9c8c464e9757a
    source_path: providers/volcengine.md
    workflow: 15
---

O provider Volcengine oferece acesso a modelos Doubao e a modelos de terceiros
hospedados no Volcano Engine, com endpoints separados para workloads gerais e de
coding.

| Detalhe   | Valor                                               |
| --------- | --------------------------------------------------- |
| Providers | `volcengine` (geral) + `volcengine-plan` (coding)   |
| Autenticação | `VOLCANO_ENGINE_API_KEY`                         |
| API       | Compatível com OpenAI                               |

## Primeiros passos

<Steps>
  <Step title="Definir a chave de API">
    Execute o onboarding interativo:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Isso registra tanto o provider geral (`volcengine`) quanto o provider de coding (`volcengine-plan`) a partir de uma única chave de API.

  </Step>
  <Step title="Definir um modelo padrão">
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
  <Step title="Verificar se o modelo está disponível">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Para configuração não interativa (CI, scripting), passe a chave diretamente:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Providers e endpoints

| Provider          | Endpoint                                  | Caso de uso      |
| ----------------- | ----------------------------------------- | ---------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Modelos gerais   |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Modelos de coding |

<Note>
Ambos os providers são configurados a partir de uma única chave de API. A configuração registra os dois automaticamente.
</Note>

## Catálogo integrado

<Tabs>
  <Tab title="Geral (volcengine)">
    | Ref de modelo                                | Nome                            | Entrada     | Contexto |
    | -------------------------------------------- | ------------------------------- | ----------- | -------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | text, image | 256,000  |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | text, image | 256,000  |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | text, image | 256,000  |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | text, image | 200,000  |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | text, image | 128,000  |
  </Tab>
  <Tab title="Coding (volcengine-plan)">
    | Ref de modelo                                     | Nome                     | Entrada | Contexto |
    | ------------------------------------------------- | ------------------------ | ------- | -------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | text    | 256,000  |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | text    | 256,000  |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | text    | 200,000  |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | text    | 256,000  |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | text    | 256,000  |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | text    | 256,000  |
  </Tab>
</Tabs>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Modelo padrão após o onboarding">
    `openclaw onboard --auth-choice volcengine-api-key` atualmente define
    `volcengine-plan/ark-code-latest` como modelo padrão enquanto também registra
    o catálogo geral `volcengine`.
  </Accordion>

  <Accordion title="Comportamento de fallback do seletor de modelo">
    Durante a seleção de modelo em onboarding/configure, a escolha de autenticação do Volcengine prefere
    linhas `volcengine/*` e `volcengine-plan/*`. Se esses modelos ainda não
    estiverem carregados, o OpenClaw recorre ao catálogo não filtrado em vez de mostrar um
    seletor vazio com escopo de provider.
  </Accordion>

  <Accordion title="Variáveis de ambiente para processos daemon">
    Se o Gateway estiver em execução como daemon (launchd/systemd), certifique-se de que
    `VOLCANO_ENGINE_API_KEY` esteja disponível para esse processo (por exemplo, em
    `~/.openclaw/.env` ou via `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Ao executar o OpenClaw como serviço em segundo plano, variáveis de ambiente definidas no seu
shell interativo não são herdadas automaticamente. Consulte a observação sobre daemon acima.
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de providers, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de configuração para agentes, modelos e providers.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e etapas de depuração.
  </Card>
  <Card title="FAQ" href="/pt-BR/help/faq" icon="circle-question">
    Perguntas frequentes sobre configuração do OpenClaw.
  </Card>
</CardGroup>

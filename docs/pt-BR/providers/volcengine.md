---
read_when:
    - Você quer usar modelos Volcano Engine ou Doubao com o OpenClaw
    - Você precisa da configuração da chave de API da Volcengine
summary: Configuração do Volcano Engine (modelos Doubao, endpoints gerais + de código)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-23T14:07:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d803e965699bedf06cc7ea4e902ffc92e4a168be012224e845820069fd67acc
    source_path: providers/volcengine.md
    workflow: 15
---

# Volcengine (Doubao)

O provider Volcengine dá acesso a modelos Doubao e modelos de terceiros
hospedados no Volcano Engine, com endpoints separados para cargas de trabalho
gerais e de código.

| Detalhe   | Valor                                              |
| --------- | -------------------------------------------------- |
| Providers | `volcengine` (geral) + `volcengine-plan` (código)  |
| Autenticação | `VOLCANO_ENGINE_API_KEY`                         |
| API       | Compatível com OpenAI                              |

## Introdução

<Steps>
  <Step title="Defina a chave de API">
    Execute o onboarding interativo:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Isso registra tanto os providers geral (`volcengine`) quanto de código (`volcengine-plan`) a partir de uma única chave de API.

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

## Providers e endpoints

| Provider          | Endpoint                                  | Caso de uso      |
| ----------------- | ----------------------------------------- | ---------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Modelos gerais   |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Modelos de código |

<Note>
Ambos os providers são configurados a partir de uma única chave de API. A configuração registra ambos automaticamente.
</Note>

## Modelos disponíveis

<Tabs>
  <Tab title="Geral (volcengine)">
    | Ref de modelo                                | Nome                            | Entrada     | Contexto |
    | -------------------------------------------- | ------------------------------- | ----------- | -------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | texto, imagem | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | texto, imagem | 256,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | texto, imagem | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | texto, imagem | 200,000 |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | texto, imagem | 128,000 |
  </Tab>
  <Tab title="Código (volcengine-plan)">
    | Ref de modelo                                     | Nome                     | Entrada | Contexto |
    | ------------------------------------------------- | ------------------------ | ------- | -------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | texto   | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | texto   | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | texto   | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | texto   | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | texto   | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | texto   | 256,000 |
  </Tab>
</Tabs>

## Observações avançadas

<AccordionGroup>
  <Accordion title="Modelo padrão após o onboarding">
    `openclaw onboard --auth-choice volcengine-api-key` atualmente define
    `volcengine-plan/ark-code-latest` como modelo padrão, ao mesmo tempo em que registra
    o catálogo geral `volcengine`.
  </Accordion>

  <Accordion title="Comportamento de fallback do seletor de modelo">
    Durante o onboarding/configuração da seleção de modelo, a escolha de autenticação Volcengine dá preferência
    a linhas `volcengine/*` e `volcengine-plan/*`. Se esses modelos ainda não
    estiverem carregados, o OpenClaw usa fallback para o catálogo sem filtro em vez de mostrar um
    seletor vazio limitado ao provider.
  </Accordion>

  <Accordion title="Variáveis de ambiente para processos daemon">
    Se o Gateway estiver em execução como daemon (launchd/systemd), certifique-se de que
    `VOLCANO_ENGINE_API_KEY` esteja disponível para esse processo (por exemplo, em
    `~/.openclaw/.env` ou via `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Ao executar o OpenClaw como um serviço em segundo plano, variáveis de ambiente definidas no seu
shell interativo não são herdadas automaticamente. Consulte a observação sobre daemon acima.
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de providers, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de config para agentes, modelos e providers.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e etapas de depuração.
  </Card>
  <Card title="FAQ" href="/pt-BR/help/faq" icon="circle-question">
    Perguntas frequentes sobre a configuração do OpenClaw.
  </Card>
</CardGroup>

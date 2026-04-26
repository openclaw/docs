---
read_when:
    - Você quer usar Volcano Engine ou models Doubao com o OpenClaw
    - Você precisa configurar a chave de API da Volcengine
    - Você quer usar a conversão de texto em fala do Volcengine Speech
summary: Configuração do Volcano Engine (models Doubao, endpoints de coding e TTS Seed Speech)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-26T11:37:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7948a26cc898e125d445e9ae091704f5cf442266d29e712c0dcedbe0dc0cce7
    source_path: providers/volcengine.md
    workflow: 15
---

O provedor Volcengine dá acesso aos modelos Doubao e a modelos de terceiros
hospedados no Volcano Engine, com endpoints separados para cargas de trabalho
gerais e de programação. O mesmo Plugin incluído também pode registrar o Volcengine Speech como provedor de TTS.

| Detalhe    | Valor                                                        |
| ---------- | ------------------------------------------------------------ |
| Provedores | `volcengine` (geral + TTS) + `volcengine-plan` (programação) |
| Autenticação do modelo | `VOLCANO_ENGINE_API_KEY`                         |
| Autenticação de TTS | `VOLCENGINE_TTS_API_KEY` ou `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API        | Modelos compatíveis com OpenAI, BytePlus Seed Speech TTS     |

## Primeiros passos

<Steps>
  <Step title="Defina a chave de API">
    Execute a configuração interativa:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Isso registra os provedores geral (`volcengine`) e de programação (`volcengine-plan`) a partir de uma única chave de API.

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

| Provedor          | Endpoint                                  | Caso de uso     |
| ----------------- | ----------------------------------------- | --------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Modelos gerais  |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Modelos de programação  |

<Note>
Ambos os provedores são configurados a partir de uma única chave de API. A configuração registra ambos automaticamente.
</Note>

## Catálogo integrado

<Tabs>
  <Tab title="Geral (volcengine)">
    | Ref. do modelo                               | Nome                            | Entrada     | Contexto |
    | -------------------------------------------- | ------------------------------- | ----------- | -------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | texto, imagem | 256.000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | texto, imagem | 256.000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | texto, imagem | 256.000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | texto, imagem | 200.000 |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | texto, imagem | 128.000 |
  </Tab>
  <Tab title="Programação (volcengine-plan)">
    | Ref. do modelo                                    | Nome                     | Entrada | Contexto |
    | ------------------------------------------------- | ------------------------ | ------- | -------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | texto   | 256.000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | texto   | 256.000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | texto   | 200.000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | texto   | 256.000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | texto   | 256.000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | texto   | 256.000 |
  </Tab>
</Tabs>

## Conversão de texto em fala

O TTS do Volcengine usa a API HTTP BytePlus Seed Speech e é configurado
separadamente da chave de API do modelo Doubao compatível com OpenAI. No console
do BytePlus, abra Seed Speech > Settings > API Keys e copie a chave de API; em
seguida, defina:

```bash
export VOLCENGINE_TTS_API_KEY="byteplus_seed_speech_api_key"
export VOLCENGINE_TTS_RESOURCE_ID="seed-tts-1.0"
```

Em seguida, habilite-o em `openclaw.json`:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "byteplus_seed_speech_api_key",
          voice: "en_female_anna_mars_bigtts",
          speedRatio: 1.0,
        },
      },
    },
  },
}
```

Para destinos de nota de voz, o OpenClaw solicita ao Volcengine o formato nativo
do provedor `ogg_opus`. Para anexos de áudio normais, solicita `mp3`. Os aliases
de provedor `bytedance` e `doubao` também resolvem para o mesmo provedor de fala.

O resource id padrão é `seed-tts-1.0` porque é isso que o BytePlus concede
a chaves de API Seed Speech recém-criadas no projeto padrão. Se o seu projeto
tiver direito ao TTS 2.0, defina `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0`.

<Warning>
`VOLCANO_ENGINE_API_KEY` é para os endpoints de modelo ModelArk/Doubao e não é
uma chave de API do Seed Speech. O TTS precisa de uma chave de API do Seed Speech
do BytePlus Speech Console, ou de um par AppID/token legado do Speech Console.
</Warning>

A autenticação legada com AppID/token continua com suporte para aplicações mais antigas do Speech Console:

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

## Configuração avançada

<AccordionGroup>
  <Accordion title="Modelo padrão após a configuração inicial">
    `openclaw onboard --auth-choice volcengine-api-key` atualmente define
    `volcengine-plan/ark-code-latest` como o modelo padrão, enquanto também registra
    o catálogo geral `volcengine`.
  </Accordion>

  <Accordion title="Comportamento de fallback do seletor de modelo">
    Durante a configuração inicial/configuração da seleção de modelo, a opção de autenticação do Volcengine prioriza
    linhas `volcengine/*` e `volcengine-plan/*`. Se esses modelos ainda não
    tiverem sido carregados, o OpenClaw recorre ao catálogo sem filtro em vez de mostrar um
    seletor restrito ao provedor vazio.
  </Accordion>

  <Accordion title="Variáveis de ambiente para processos daemon">
    Se o Gateway for executado como daemon (launchd/systemd), certifique-se de que as
    variáveis de ambiente do modelo e do TTS, como `VOLCANO_ENGINE_API_KEY`, `VOLCENGINE_TTS_API_KEY`,
    `BYTEPLUS_SEED_SPEECH_API_KEY`, `VOLCENGINE_TTS_APPID` e
    `VOLCENGINE_TTS_TOKEN`, estejam disponíveis para esse processo (por exemplo, em
    `~/.openclaw/.env` ou via `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Ao executar o OpenClaw como serviço em segundo plano, as variáveis de ambiente definidas no seu
shell interativo não são herdadas automaticamente. Consulte a observação sobre daemon acima.
</Warning>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs. de modelo e comportamento de failover.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de configuração para agentes, modelos e provedores.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e etapas de depuração.
  </Card>
  <Card title="FAQ" href="/pt-BR/help/faq" icon="circle-question">
    Perguntas frequentes sobre a configuração do OpenClaw.
  </Card>
</CardGroup>

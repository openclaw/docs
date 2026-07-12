---
read_when:
    - Você quer usar modelos do Volcano Engine ou Doubao com o OpenClaw
    - Você precisa configurar a chave da API da Volcengine
    - Você quer usar a conversão de texto em fala do Volcengine Speech
summary: Configuração do Volcano Engine (modelos Doubao, endpoints de programação e TTS Seed Speech)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-07-12T00:21:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e853a1c8847704caedf0ec83c38332569f72105c5e34ad973daf614a2e80550b
    source_path: providers/volcengine.md
    workflow: 16
---

O provedor Volcengine oferece acesso aos modelos Doubao e a modelos de terceiros hospedados no Volcano Engine, com endpoints separados para cargas de trabalho gerais e de programação. O mesmo plugin incluído também registra o Volcengine Speech como provedor de TTS.

| Detalhe                 | Valor                                                      |
| ----------------------- | ---------------------------------------------------------- |
| Provedores              | `volcengine` (geral + TTS), `volcengine-plan` (programação) |
| Autenticação do modelo  | `VOLCANO_ENGINE_API_KEY`                                   |
| Autenticação de TTS     | `VOLCENGINE_TTS_API_KEY` ou `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API                     | Modelos compatíveis com OpenAI, TTS BytePlus Seed Speech   |

## Primeiros passos

<Steps>
  <Step title="Set the API key">
    Execute a configuração inicial interativa:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Isso registra os provedores geral (`volcengine`) e de programação (`volcengine-plan`) usando uma única chave de API.

  </Step>
  <Step title="Set a default model">
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
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Para uma configuração não interativa (CI, scripts), forneça a chave diretamente:

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
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Modelos de programação |

<Note>
Ambos os provedores são configurados com uma única chave de API. A configuração registra os dois automaticamente, e o seletor de modelos do provedor de programação também reutiliza a autenticação do provedor geral (`volcengine-plan` é um alias de autenticação de `volcengine`).
</Note>

## Catálogo integrado

<Tabs>
  <Tab title="General (volcengine)">
    | Referência do modelo                           | Nome                            | Entrada       | Contexto |
    | ---------------------------------------------- | ------------------------------- | ------------- | -------- |
    | `volcengine/deepseek-v3-2-251201`              | DeepSeek V3.2                   | texto, imagem | 128,000  |
    | `volcengine/doubao-seed-1-8-251228`            | Doubao Seed 1.8                 | texto, imagem | 256,000  |
    | `volcengine/doubao-seed-code-preview-251028`   | doubao-seed-code-preview-251028 | texto, imagem | 256,000  |
    | `volcengine/glm-4-7-251222`                    | GLM 4.7                         | texto, imagem | 200,000  |
    | `volcengine/kimi-k2-5-260127`                  | Kimi K2.5                       | texto, imagem | 256,000  |
  </Tab>
  <Tab title="Coding (volcengine-plan)">
    | Referência do modelo                                | Nome                     | Entrada | Contexto |
    | --------------------------------------------------- | ------------------------ | ------- | -------- |
    | `volcengine-plan/ark-code-latest`                   | Ark Coding Plan          | texto   | 256,000  |
    | `volcengine-plan/doubao-seed-code`                  | Doubao Seed Code         | texto   | 256,000  |
    | `volcengine-plan/doubao-seed-code-preview-251028`   | Doubao Seed Code Preview | texto   | 256,000  |
    | `volcengine-plan/glm-4.7`                           | GLM 4.7 Coding           | texto   | 200,000  |
    | `volcengine-plan/kimi-k2-thinking`                  | Kimi K2 Thinking         | texto   | 256,000  |
    | `volcengine-plan/kimi-k2.5`                         | Kimi K2.5 Coding         | texto   | 256,000  |
  </Tab>
</Tabs>

Ambos os catálogos são estáticos (sem chamada de descoberta a `/models`) e oferecem contabilização de uso em streaming compatível com OpenAI. Os esquemas de ferramentas de ambos os provedores removem automaticamente as palavras-chave `minLength`, `maxLength`, `minItems`, `maxItems`, `minContains` e `maxContains`, pois a API de chamadas de ferramentas do Volcengine as rejeita.

## Conversão de texto em fala

O TTS do Volcengine usa a API HTTP BytePlus Seed Speech (`voice.ap-southeast-1.bytepluses.com`) e é configurado separadamente da chave de API dos modelos Doubao compatíveis com OpenAI. No console do BytePlus, abra Seed Speech > Settings > API Keys, copie a chave de API e defina:

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

Campos disponíveis em `messages.tts.providers.volcengine`: `apiKey`, `voice`, `speedRatio` (0.2-3.0), `emotion`, `cluster`, `resourceId`, `appKey` e `baseUrl`. `!emotion=<value>` também funciona como uma diretiva de voz embutida quando substituições das configurações de voz são permitidas.

Para destinos de mensagens de voz, o OpenClaw solicita o formato nativo do provedor `ogg_opus`. Para anexos de áudio comuns, solicita `mp3`. Os aliases de provedor `bytedance` e `doubao` também são resolvidos para esse provedor de fala.

O identificador de recurso padrão é `seed-tts-1.0`, a permissão que o BytePlus concede por padrão às chaves de API Seed Speech recém-criadas. Se o seu projeto tiver permissão para TTS 2.0, defina `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0`.

<Warning>
`VOLCANO_ENGINE_API_KEY` destina-se aos endpoints dos modelos ModelArk/Doubao e não é uma chave de API Seed Speech. O TTS precisa de uma chave de API Seed Speech do BytePlus Speech Console ou de um par AppID/token legado do Speech Console.
</Warning>

A autenticação legada com AppID/token continua disponível para aplicações mais antigas do Speech Console:

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

Outras variáveis de ambiente opcionais de TTS: `VOLCENGINE_TTS_VOICE`, `VOLCENGINE_TTS_APP_KEY` e `VOLCENGINE_TTS_BASE_URL` substituem os campos de configuração correspondentes em `messages.tts.providers.volcengine` quando definidas.

## Configuração avançada

<AccordionGroup>
  <Accordion title="Default model after onboarding">
    `openclaw onboard --auth-choice volcengine-api-key` define `volcengine-plan/ark-code-latest` como o modelo padrão e também registra o catálogo geral `volcengine`.
  </Accordion>

  <Accordion title="Model picker fallback behavior">
    Durante a seleção de modelos na configuração inicial ou na configuração, a opção de autenticação do Volcengine prioriza linhas de `volcengine/*` e `volcengine-plan/*`. Se esses modelos ainda não estiverem carregados, o OpenClaw recorre ao catálogo não filtrado em vez de exibir um seletor vazio com escopo limitado ao provedor.
  </Accordion>

  <Accordion title="Environment variables for daemon processes">
    Se o Gateway for executado como daemon (launchd/systemd), verifique se as variáveis de ambiente do modelo e de TTS, como `VOLCANO_ENGINE_API_KEY`, `VOLCENGINE_TTS_API_KEY`, `BYTEPLUS_SEED_SPEECH_API_KEY`, `VOLCENGINE_TTS_APPID` e `VOLCENGINE_TTS_TOKEN`, estão disponíveis para esse processo (por exemplo, em `~/.openclaw/.env` ou por meio de `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Ao executar o OpenClaw como serviço em segundo plano, as variáveis de ambiente definidas no shell interativo não são herdadas automaticamente. Consulte a observação sobre daemon acima.
</Warning>

## Conteúdo relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="Configuration" href="/pt-BR/gateway/configuration" icon="gear">
    Referência completa de configuração para agentes, modelos e provedores.
  </Card>
  <Card title="Troubleshooting" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e etapas de depuração.
  </Card>
  <Card title="FAQ" href="/pt-BR/help/faq" icon="circle-question">
    Perguntas frequentes sobre a configuração do OpenClaw.
  </Card>
</CardGroup>

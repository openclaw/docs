---
read_when:
    - Habilitando texto para fala para respostas
    - Configurando um provider de TTS, cadeia de fallback ou persona
    - Usando comandos ou diretivas /tts
sidebarTitle: Text to speech (TTS)
summary: Texto para fala para respostas de saída — providers, personas, comandos slash e saída por canal
title: Texto para fala
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-26T11:40:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 199a84fde8f7fd380667a39c448ac8158e0aab071b77be41b87431d10d8b4219
    source_path: tools/tts.md
    workflow: 15
---

O OpenClaw pode converter respostas de saída em áudio em **13 providers de fala**
e entregar mensagens de voz nativas no Feishu, Matrix, Telegram e WhatsApp,
anexos de áudio em qualquer outro lugar, e streams PCM/Ulaw para telefonia e Talk.

## Início rápido

<Steps>
  <Step title="Escolha um provider">
    OpenAI e ElevenLabs são as opções hospedadas mais confiáveis. Microsoft e
    Local CLI funcionam sem chave de API. Consulte a [matriz de providers](#supported-providers)
    para ver a lista completa.
  </Step>
  <Step title="Defina a chave de API">
    Exporte a variável de ambiente do seu provider (por exemplo `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft e Local CLI não precisam de chave.
  </Step>
  <Step title="Habilite na config">
    Defina `messages.tts.auto: "always"` e `messages.tts.provider`:

    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "elevenlabs",
        },
      },
    }
    ```

  </Step>
  <Step title="Teste no chat">
    `/tts status` mostra o estado atual. `/tts audio Hello from OpenClaw`
    envia uma resposta de áudio única.
  </Step>
</Steps>

<Note>
O TTS automático fica **desativado** por padrão. Quando `messages.tts.provider` não está definido,
o OpenClaw escolhe o primeiro provider configurado na ordem de seleção automática do registro.
</Note>

## Providers compatíveis

| Provider          | Auth                                                                                                             | Observações                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (também `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)      | Saída nativa de nota de voz Ogg/Opus e telefonia.                      |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` ou `XI_API_KEY`                                                                             | Clonagem de voz, multilíngue, determinístico via `seed`.               |
| **Google Gemini** | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`                                                                             | TTS da API Gemini; compatível com persona via `promptTemplate: "audio-profile-v1"`. |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | Saída de nota de voz e telefonia.                                      |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | API de TTS com streaming. Nota de voz Opus nativa e telefonia PCM.     |
| **Local CLI**     | none                                                                                                             | Executa um comando local de TTS configurado.                           |
| **Microsoft**     | none                                                                                                             | TTS neural público do Edge via `node-edge-tts`. Melhor esforço, sem SLA. |
| **MiniMax**       | `MINIMAX_API_KEY` (ou Plano Token: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)   | API T2A v2. O padrão é `speech-2.8-hd`.                                |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | Também usado para resumo automático; oferece suporte a persona `instructions`. |
| **OpenRouter**    | `OPENROUTER_API_KEY` (pode reutilizar `models.providers.openrouter.apiKey`)                                     | Modelo padrão `hexgrad/kokoro-82m`.                                    |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` ou `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/token legado: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | API HTTP BytePlus Seed Speech.                                         |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | Provider compartilhado de imagem, vídeo e fala.                        |
| **xAI**           | `XAI_API_KEY`                                                                                                    | TTS em lote do xAI. Opus nativo para nota de voz **não** é compatível. |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | TTS do MiMo por meio de chat completions da Xiaomi.                    |

Se vários providers estiverem configurados, o selecionado será usado primeiro e os
outros serão opções de fallback. O resumo automático usa `summaryModel` (ou
`agents.defaults.model.primary`), então esse provider também deve estar autenticado
se você mantiver os resumos habilitados.

<Warning>
O provider **Microsoft** incluído usa o serviço público online de TTS neural do Microsoft Edge
via `node-edge-tts`. É um serviço web público sem
SLA ou cota publicada — trate-o como melhor esforço. O id legado do provider `edge` é
normalizado para `microsoft`, e `openclaw doctor --fix` regrava a
config persistida; novas configs devem sempre usar `microsoft`.
</Warning>

## Configuração

A config de TTS fica em `messages.tts` em `~/.openclaw/openclaw.json`. Escolha uma
predefinição e adapte o bloco do provider:

<Tabs>
  <Tab title="Azure Speech">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "azure-speech",
      providers: {
        "azure-speech": {
          apiKey: "${AZURE_SPEECH_KEY}",
          region: "eastus",
          voice: "en-US-JennyNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          voiceNoteOutputFormat: "ogg-24khz-16bit-mono-opus",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Google Gemini">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "${GEMINI_API_KEY}",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          // Prompts opcionais em linguagem natural para estilo:
          // audioProfile: "Fale em um tom calmo, de apresentador de podcast.",
          // speakerName: "Alex",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Gradium">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "${GRADIUM_API_KEY}",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Inworld">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "inworld",
      providers: {
        inworld: {
          apiKey: "${INWORLD_API_KEY}",
          modelId: "inworld-tts-1.5-max",
          voiceId: "Sarah",
          temperature: 0.7,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Local CLI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "tts-local-cli",
      providers: {
        "tts-local-cli": {
          command: "say",
          args: ["-o", "{{OutputPath}}", "{{Text}}"],
          outputFormat: "wav",
          timeoutMs: 120000,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Microsoft (sem chave)">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          voice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          rate: "+0%",
          pitch: "+0%",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="MiniMax">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "${MINIMAX_API_KEY}",
          model: "speech-2.8-hd",
          voiceId: "English_expressive_narrator",
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenAI + ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      providers: {
        openai: {
          apiKey: "${OPENAI_API_KEY}",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
          voiceSettings: { stability: 0.5, similarityBoost: 0.75, style: 0.0, useSpeakerBoost: true, speed: 1.0 },
          applyTextNormalization: "auto",
          languageCode: "en",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenRouter">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "${OPENROUTER_API_KEY}",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Volcengine">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "${VOLCENGINE_TTS_API_KEY}",
          resourceId: "seed-tts-1.0",
          voice: "en_female_anna_mars_bigtts",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="xAI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "${XAI_API_KEY}",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Xiaomi MiMo">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "${XIAOMI_API_KEY}",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

### Substituições de voz por agente

Use `agents.list[].tts` quando um agente precisar falar com um provider,
voz, modelo, persona ou modo de TTS automático diferente. O bloco do agente faz um deep merge sobre
`messages.tts`, então as credenciais do provider podem permanecer na config global do provider:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: { apiKey: "${ELEVENLABS_API_KEY}", model: "eleven_multilingual_v2" },
      },
    },
  },
  agents: {
    list: [
      {
        id: "reader",
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

Para fixar uma persona por agente, defina `agents.list[].tts.persona` junto com a
config do provider — isso substitui `messages.tts.persona` global somente para esse agente.

Ordem de precedência para respostas automáticas, `/tts audio`, `/tts status` e a
ferramenta de agente `tts`:

1. `messages.tts`
2. `agents.list[].tts` ativo
3. substituição do canal, quando o canal oferece suporte a `channels.<channel>.tts`
4. substituição da conta, quando o canal passa `channels.<channel>.accounts.<id>.tts`
5. preferências locais de `/tts` para este host
6. diretivas inline `[[tts:...]]` quando [substituições dirigidas por modelo](#model-driven-directives) estiverem habilitadas

Substituições de canal e conta usam o mesmo formato de `messages.tts` e
fazem deep merge sobre as camadas anteriores, então credenciais compartilhadas do provider podem permanecer em
`messages.tts` enquanto um canal ou conta de bot altera apenas voz, modelo, persona
ou modo automático:

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { apiKey: "${OPENAI_API_KEY}", model: "gpt-4o-mini-tts" },
      },
    },
  },
  channels: {
    feishu: {
      accounts: {
        english: {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

## Personas

Uma **persona** é uma identidade de fala estável que pode ser aplicada de forma determinística
entre providers. Ela pode preferir um provider, definir uma intenção de prompt neutra em relação ao provider
e carregar bindings específicos de provider para vozes, modelos,
templates de prompt, seeds e configurações de voz.

### Persona mínima

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "Narrador",
          provider: "elevenlabs",
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL", modelId: "eleven_multilingual_v2" },
          },
        },
      },
    },
  },
}
```

### Persona completa (prompt neutro em relação ao provider)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "Narrador no estilo mordomo britânico: seco e acolhedor.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "Um brilhante mordomo britânico. Seco, espirituoso, acolhedor, encantador, emocionalmente expressivo, nunca genérico.",
            scene: "Um escritório silencioso tarde da noite. Narração em microfone próximo para um operador de confiança.",
            sampleContext: "O locutor está respondendo a uma solicitação técnica privada com confiança concisa e calor seco.",
            style: "Refinado, contido, levemente divertido.",
            accent: "Inglês britânico.",
            pacing: "Cadenciado, com pequenas pausas dramáticas.",
            constraints: ["Não leia valores de configuração em voz alta.", "Não explique a persona."],
          },
          providers: {
            google: {
              model: "gemini-3.1-flash-tts-preview",
              voiceName: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", voice: "cedar" },
            elevenlabs: {
              voiceId: "voice_id",
              modelId: "eleven_multilingual_v2",
              seed: 42,
              voiceSettings: {
                stability: 0.65,
                similarityBoost: 0.8,
                style: 0.25,
                useSpeakerBoost: true,
                speed: 0.95,
              },
            },
          },
        },
      },
    },
  },
}
```

### Resolução de persona

A persona ativa é selecionada de forma determinística:

1. preferência local de `/tts persona <id>`, se definida.
2. `messages.tts.persona`, se definido.
3. Sem persona.

A seleção de provider executa explicit-first:

1. Substituições diretas (CLI, gateway, Talk, diretivas TTS permitidas).
2. preferência local de `/tts provider <id>`.
3. `provider` da persona ativa.
4. `messages.tts.provider`.
5. Seleção automática do registro.

Para cada tentativa de provider, o OpenClaw mescla as configs nesta ordem:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Substituições de requisição confiável
4. Substituições permitidas de diretivas TTS emitidas pelo modelo

### Como os providers usam prompts de persona

Os campos de prompt de persona (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) são **neutros em relação ao provider**. Cada provider decide como
usá-los:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Encapsula os campos de prompt de persona em uma estrutura de prompt TTS do Gemini **somente quando**
    a config efetiva do provider Google define `promptTemplate: "audio-profile-v1"`
    ou `personaPrompt`. Os campos mais antigos `audioProfile` e `speakerName` ainda são
    adicionados como texto de prompt específico do Google. Tags de áudio inline, como
    `[whispers]` ou `[laughs]`, dentro de um bloco `[[tts:text]]` são preservadas
    dentro da transcrição do Gemini; o OpenClaw não gera essas tags.
  </Accordion>
  <Accordion title="OpenAI">
    Mapeia campos de prompt de persona para o campo `instructions` da requisição **somente quando**
    não existe uma configuração explícita de `instructions` do OpenAI. `instructions`
    explícito sempre tem precedência.
  </Accordion>
  <Accordion title="Outros providers">
    Usam apenas os bindings de persona específicos do provider em
    `personas.<id>.providers.<provider>`. Campos de prompt de persona são ignorados
    a menos que o provider implemente seu próprio mapeamento de prompt de persona.
  </Accordion>
</AccordionGroup>

### Política de fallback

`fallbackPolicy` controla o comportamento quando uma persona **não tem binding** para o
provider tentado:

| Policy              | Comportamento                                                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `preserve-persona`  | **Padrão.** Campos de prompt neutros em relação ao provider permanecem disponíveis; o provider pode usá-los ou ignorá-los.                    |
| `provider-defaults` | A persona é omitida da preparação do prompt para essa tentativa; o provider usa seus padrões neutros enquanto o fallback para outros providers continua. |
| `fail`              | Ignora essa tentativa de provider com `reasonCode: "not_configured"` e `personaBinding: "missing"`. Providers de fallback ainda são tentados. |

A requisição TTS inteira só falha quando **toda** tentativa de provider é ignorada
ou falha.

## Diretivas orientadas por modelo

Por padrão, o assistente **pode** emitir diretivas `[[tts:...]]` para substituir
voz, modelo ou velocidade em uma única resposta, além de um bloco opcional
`[[tts:text]]...[[/tts:text]]` para dicas expressivas que devem aparecer
somente no áudio:

```text
Aqui está.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](ri) Leia a música mais uma vez.[[/tts:text]]
```

Quando `messages.tts.auto` é `"tagged"`, **diretivas são obrigatórias** para disparar
áudio. A entrega de bloco em streaming remove diretivas do texto visível antes que o
canal as veja, mesmo quando divididas em blocos adjacentes.

`provider=...` é ignorado, a menos que `modelOverrides.allowProvider: true`. Quando uma
resposta declara `provider=...`, as outras chaves nessa diretiva são analisadas
somente por esse provider; chaves não compatíveis são removidas e relatadas como avisos
de diretiva TTS.

**Chaves de diretiva disponíveis:**

- `provider` (id de provider registrado; requer `allowProvider: true`)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume do MiniMax, 0–10)
- `pitch` (pitch inteiro do MiniMax, −12 a 12; valores fracionários são truncados)
- `emotion` (tag de emoção do Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Desabilitar completamente substituições do modelo:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Permitir troca de provider mantendo os outros controles configuráveis:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Comandos slash

Comando único `/tts`. No Discord, o OpenClaw também registra `/voice` porque
`/tts` é um comando embutido do Discord — texto `/tts ...` ainda funciona.

```text
/tts off | on | status
/tts chat on | off | default
/tts latest
/tts provider <id>
/tts persona <id> | off
/tts limit <chars>
/tts summary off
/tts audio <text>
```

<Note>
Os comandos exigem um remetente autorizado (regras de allowlist/proprietário se aplicam) e
`commands.text` ou o registro nativo de comandos deve estar habilitado.
</Note>

Observações de comportamento:

- `/tts on` grava a preferência local de TTS como `always`; `/tts off` grava como `off`.
- `/tts chat on|off|default` grava uma substituição de TTS automático no escopo da sessão para o chat atual.
- `/tts persona <id>` grava a preferência local de persona; `/tts persona off` limpa essa preferência.
- `/tts latest` lê a resposta mais recente do assistente da transcrição da sessão atual e a envia como áudio uma vez. Ele armazena apenas um hash dessa resposta na entrada da sessão para suprimir envios de voz duplicados.
- `/tts audio` gera uma resposta de áudio única (**não** ativa o TTS).
- `limit` e `summary` são armazenados em **preferências locais**, não na config principal.
- `/tts status` inclui diagnósticos de fallback para a tentativa mais recente — `Fallback: <primary> -> <used>`, `Attempts: ...` e detalhes por tentativa (`provider:outcome(reasonCode) latency`).
- `/status` mostra o modo TTS ativo mais provider, modelo, voz e metadados sanitizados de endpoint personalizado quando o TTS está habilitado.

## Preferências por usuário

Os comandos slash gravam substituições locais em `prefsPath`. O padrão é
`~/.openclaw/settings/tts.json`; substitua com a variável de ambiente `OPENCLAW_TTS_PREFS`
ou `messages.tts.prefsPath`.

| Campo armazenado | Efeito                                        |
| ---------------- | --------------------------------------------- |
| `auto`           | Substituição local de TTS automático (`always`, `off`, …) |
| `provider`       | Substituição local do provider principal      |
| `persona`        | Substituição local de persona                 |
| `maxLength`      | Limite para resumo (padrão `1500` chars)      |
| `summarize`      | Alternância de resumo (padrão `true`)         |

Essas opções substituem a config efetiva de `messages.tts` junto com o bloco
ativo `agents.list[].tts` para esse host.

## Formatos de saída (fixos)

A entrega de voz de TTS é orientada pela capacidade do canal. Plugins de canal anunciam
se o TTS no estilo mensagem de voz deve pedir aos providers um destino nativo `voice-note` ou
manter a síntese normal `audio-file` e apenas marcar a saída compatível para
entrega de voz.

- **Canais com suporte a voice-note**: respostas em voice-note preferem Opus (`opus_48000_64` do ElevenLabs, `opus` do OpenAI).
  - 48 kHz / 64 kbps é um bom equilíbrio para mensagens de voz.
- **Feishu / WhatsApp**: quando uma resposta em voice-note é produzida como MP3/WebM/WAV/M4A
  ou outro arquivo de áudio provável, o plugin do canal a transcodifica para
  Ogg/Opus 48 kHz com `ffmpeg` antes de enviar a mensagem de voz nativa. O WhatsApp envia
  o resultado pelo payload `audio` do Baileys com `ptt: true` e
  `audio/ogg; codecs=opus`. Se a conversão falhar, o Feishu recebe o arquivo
  original como anexo; o envio no WhatsApp falha em vez de publicar um
  payload PTT incompatível.
- **BlueBubbles**: mantém a síntese do provider no caminho normal de arquivo de áudio; saídas MP3
  e CAF são marcadas para entrega como memorando de voz do iMessage.
- **Outros canais**: MP3 (`mp3_44100_128` do ElevenLabs, `mp3` do OpenAI).
  - 44,1 kHz / 128 kbps é o equilíbrio padrão para clareza da fala.
- **MiniMax**: MP3 (modelo `speech-2.8-hd`, taxa de amostragem de 32 kHz) para anexos normais de áudio. Para destinos de voice-note anunciados pelo canal, o OpenClaw transcodifica o MP3 do MiniMax para Opus 48 kHz com `ffmpeg` antes da entrega quando o canal anuncia transcodificação.
- **Xiaomi MiMo**: MP3 por padrão, ou WAV quando configurado. Para destinos de voice-note anunciados pelo canal, o OpenClaw transcodifica a saída da Xiaomi para Opus 48 kHz com `ffmpeg` antes da entrega quando o canal anuncia transcodificação.
- **Local CLI**: usa o `outputFormat` configurado. Destinos de voice-note são
  convertidos para Ogg/Opus e a saída de telefonia é convertida para PCM bruto mono 16 kHz
  com `ffmpeg`.
- **Google Gemini**: o TTS da API Gemini retorna PCM bruto de 24 kHz. O OpenClaw o encapsula como WAV para anexos de áudio, transcodifica para Opus 48 kHz para destinos de voice-note e retorna PCM diretamente para Talk/telefonia.
- **Gradium**: WAV para anexos de áudio, Opus para destinos de voice-note e `ulaw_8000` a 8 kHz para telefonia.
- **Inworld**: MP3 para anexos normais de áudio, `OGG_OPUS` nativo para destinos de voice-note e `PCM` bruto a 22050 Hz para Talk/telefonia.
- **xAI**: MP3 por padrão; `responseFormat` pode ser `mp3`, `wav`, `pcm`, `mulaw` ou `alaw`. O OpenClaw usa o endpoint REST em lote de TTS do xAI e retorna um anexo de áudio completo; o WebSocket de TTS em streaming do xAI não é usado por este caminho de provider. O formato Opus nativo para voice-note não é compatível com este caminho.
- **Microsoft**: usa `microsoft.outputFormat` (padrão `audio-24khz-48kbitrate-mono-mp3`).
  - O transporte incluído aceita um `outputFormat`, mas nem todos os formatos estão disponíveis no serviço.
  - Os valores de formato de saída seguem os formatos de saída do Microsoft Speech (incluindo Ogg/WebM Opus).
  - `sendVoice` do Telegram aceita OGG/MP3/M4A; use OpenAI/ElevenLabs se precisar de
    mensagens de voz Opus garantidas.
  - Se o formato de saída configurado do Microsoft falhar, o OpenClaw tenta novamente com MP3.

Os formatos de saída de OpenAI/ElevenLabs são fixos por canal (veja acima).

## Comportamento do TTS automático

Quando `messages.tts.auto` está habilitado, o OpenClaw:

- Ignora TTS se a resposta já contiver mídia ou uma diretiva `MEDIA:`.
- Ignora respostas muito curtas (menos de 10 caracteres).
- Resume respostas longas quando resumos estão habilitados, usando
  `summaryModel` (ou `agents.defaults.model.primary`).
- Anexa o áudio gerado à resposta.
- Em `mode: "final"`, ainda envia TTS somente em áudio para respostas finais em streaming
  após a conclusão do stream de texto; a mídia gerada passa pela mesma
  normalização de mídia do canal que os anexos normais de resposta.

Se a resposta exceder `maxLength` e o resumo estiver desativado (ou não houver chave de API para o
modelo de resumo), o áudio será ignorado e a resposta normal em texto será enviada.

```text
Resposta -> TTS habilitado?
  não -> enviar texto
  sim -> tem mídia / MEDIA: / curta?
           sim -> enviar texto
           não -> tamanho > limite?
                    não -> TTS -> anexar áudio
                    sim -> resumo habilitado?
                             não -> enviar texto
                             sim -> resumir -> TTS -> anexar áudio
```

## Formatos de saída por canal

| Destino                               | Formato                                                                                                                                   |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | Respostas em voice-note preferem **Opus** (`opus_48000_64` do ElevenLabs, `opus` do OpenAI). 48 kHz / 64 kbps equilibra clareza e tamanho. |
| Outros canais                         | **MP3** (`mp3_44100_128` do ElevenLabs, `mp3` do OpenAI). 44,1 kHz / 128 kbps é o padrão para fala.                                      |
| Talk / telefonia                      | **PCM** nativo do provider (Inworld 22050 Hz, Google 24 kHz), ou `ulaw_8000` do Gradium para telefonia.                                  |

Observações por provider:

- **Transcodificação Feishu / WhatsApp:** quando uma resposta em voice-note chega como MP3/WebM/WAV/M4A, o plugin do canal transcodifica para Ogg/Opus 48 kHz com `ffmpeg`. O WhatsApp envia pelo Baileys com `ptt: true` e `audio/ogg; codecs=opus`. Se a conversão falhar: o Feishu recua para anexar o arquivo original; o envio no WhatsApp falha em vez de publicar um payload PTT incompatível.
- **MiniMax / Xiaomi MiMo:** MP3 por padrão (32 kHz para MiniMax `speech-2.8-hd`); transcodificado para Opus 48 kHz para destinos de voice-note via `ffmpeg`.
- **Local CLI:** usa o `outputFormat` configurado. Destinos de voice-note são convertidos para Ogg/Opus e a saída de telefonia para PCM bruto mono 16 kHz.
- **Google Gemini:** retorna PCM bruto de 24 kHz. O OpenClaw encapsula como WAV para anexos, transcodifica para Opus 48 kHz para destinos de voice-note e retorna PCM diretamente para Talk/telefonia.
- **Inworld:** anexos MP3, voice-note `OGG_OPUS` nativo, `PCM` bruto 22050 Hz para Talk/telefonia.
- **xAI:** MP3 por padrão; `responseFormat` pode ser `mp3|wav|pcm|mulaw|alaw`. Usa o endpoint REST em lote do xAI — o TTS por WebSocket em streaming **não** é usado. O formato Opus nativo para voice-note **não** é compatível.
- **Microsoft:** usa `microsoft.outputFormat` (padrão `audio-24khz-48kbitrate-mono-mp3`). `sendVoice` do Telegram aceita OGG/MP3/M4A; use OpenAI/ElevenLabs se precisar de mensagens de voz Opus garantidas. Se o formato Microsoft configurado falhar, o OpenClaw tenta novamente com MP3.

Os formatos de saída do OpenAI e do ElevenLabs são fixos por canal, conforme listado acima.

## Referência de campos

<AccordionGroup>
  <Accordion title="Top-level messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Modo de TTS automático. `inbound` só envia áudio após uma mensagem de voz de entrada; `tagged` só envia áudio quando a resposta inclui diretivas `[[tts:...]]` ou um bloco `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Alternância legada. `openclaw doctor --fix` migra isso para `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` inclui respostas de ferramentas/blocos além das respostas finais.
    </ParamField>
    <ParamField path="provider" type="string">
      ID do provider de fala. Quando não definido, o OpenClaw usa o primeiro provider configurado na ordem de seleção automática do registro. O legado `provider: "edge"` é reescrito para `"microsoft"` por `openclaw doctor --fix`.
    </ParamField>
    <ParamField path="persona" type="string">
      ID da persona ativa de `personas`. Normalizado para minúsculas.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Identidade de fala estável. Campos: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Consulte [Personas](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Modelo barato para resumo automático; o padrão é `agents.defaults.model.primary`. Aceita `provider/model` ou um alias de modelo configurado.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Permite que o modelo emita diretivas de TTS. `enabled` usa `true` por padrão; `allowProvider` usa `false` por padrão.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Configurações de propriedade do provider, indexadas pelo ID do provider de fala. Blocos diretos legados (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) são reescritos por `openclaw doctor --fix`; faça commit apenas de `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      Limite rígido de caracteres de entrada para TTS. `/tts audio` falha se for excedido.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      Timeout da requisição em milissegundos.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Substitui o caminho do JSON de preferências locais (provider/limite/resumo). Padrão `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` ou `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Região do Azure Speech (por exemplo `eastus`). Env: `AZURE_SPEECH_REGION` ou `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Substituição opcional do endpoint do Azure Speech (alias `baseUrl`).</ParamField>
    <ParamField path="voice" type="string">ShortName da voz do Azure. Padrão `en-US-JennyNeural`.</ParamField>
    <ParamField path="lang" type="string">Código de idioma SSML. Padrão `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">`X-Microsoft-OutputFormat` do Azure para áudio padrão. Padrão `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">`X-Microsoft-OutputFormat` do Azure para saída de voice-note. Padrão `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Usa `ELEVENLABS_API_KEY` ou `XI_API_KEY` como fallback.</ParamField>
    <ParamField path="model" type="string">ID do modelo (por exemplo `eleven_multilingual_v2`, `eleven_v3`).</ParamField>
    <ParamField path="voiceId" type="string">ID da voz no ElevenLabs.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (cada um `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = normal).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Modo de normalização de texto.</ParamField>
    <ParamField path="languageCode" type="string">ISO 639-1 de 2 letras (por exemplo `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Inteiro `0..4294967295` para determinismo por melhor esforço.</ParamField>
    <ParamField path="baseUrl" type="string">Substitui a URL base da API do ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Usa `GEMINI_API_KEY` / `GOOGLE_API_KEY` como fallback. Se omitido, o TTS pode reutilizar `models.providers.google.apiKey` antes do fallback por env.</ParamField>
    <ParamField path="model" type="string">Modelo TTS do Gemini. Padrão `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="voiceName" type="string">Nome de voz predefinida do Gemini. Padrão `Kore`. Alias: `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Prompt de estilo em linguagem natural adicionado antes do texto falado.</ParamField>
    <ParamField path="speakerName" type="string">Rótulo opcional do locutor adicionado antes do texto falado quando seu prompt usa um locutor nomeado.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Defina como `audio-profile-v1` para encapsular os campos de prompt da persona ativa em uma estrutura determinística de prompt TTS do Gemini.</ParamField>
    <ParamField path="personaPrompt" type="string">Texto extra de prompt de persona específico do Google, anexado às Director's Notes do template.</ParamField>
    <ParamField path="baseUrl" type="string">Somente `https://generativelanguage.googleapis.com` é aceito.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Env: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Padrão `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">Padrão Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    <ParamField path="apiKey" type="string">Env: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Padrão `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Padrão `inworld-tts-1.5-max`. Também: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">Padrão `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">Temperatura de amostragem `0..2`.</ParamField>
  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">Executável local ou string de comando para TTS por CLI.</ParamField>
    <ParamField path="args" type="string[]">Argumentos do comando. Compatível com placeholders `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Formato de saída esperado da CLI. Padrão `mp3` para anexos de áudio.</ParamField>
    <ParamField path="timeoutMs" type="number">Timeout do comando em milissegundos. Padrão `120000`.</ParamField>
    <ParamField path="cwd" type="string">Diretório de trabalho opcional do comando.</ParamField>
    <ParamField path="env" type="Record<string, string>">Substituições opcionais de ambiente para o comando.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (sem chave de API)">
    <ParamField path="enabled" type="boolean" default="true">Permitir uso de fala do Microsoft.</ParamField>
    <ParamField path="voice" type="string">Nome da voz neural da Microsoft (por exemplo `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">Código de idioma (por exemplo `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Formato de saída da Microsoft. Padrão `audio-24khz-48kbitrate-mono-mp3`. Nem todos os formatos são compatíveis com o transporte incluído baseado em Edge.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Strings de porcentagem (por exemplo `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Grava legendas JSON ao lado do arquivo de áudio.</ParamField>
    <ParamField path="proxy" type="string">URL de proxy para requisições de fala da Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">Substituição do timeout da requisição (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Alias legado. Execute `openclaw doctor --fix` para regravar a config persistida para `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Usa `MINIMAX_API_KEY` como fallback. Auth do Plano Token via `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` ou `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Padrão `https://api.minimax.io`. Env: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Padrão `speech-2.8-hd`. Env: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">Padrão `English_expressive_narrator`. Env: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Padrão `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Padrão `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Inteiro `-12..12`. Padrão `0`. Valores fracionários são truncados antes da requisição.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Usa `OPENAI_API_KEY` como fallback.</ParamField>
    <ParamField path="model" type="string">ID do modelo TTS da OpenAI (por exemplo `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">Nome da voz (por exemplo `alloy`, `cedar`).</ParamField>
    <ParamField path="instructions" type="string">Campo explícito `instructions` da OpenAI. Quando definido, campos de prompt de persona **não** são mapeados automaticamente.</ParamField>
    <ParamField path="baseUrl" type="string">
      Substitui o endpoint TTS da OpenAI. Ordem de resolução: config → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Valores não padrão são tratados como endpoints TTS compatíveis com OpenAI, então nomes personalizados de modelo e voz são aceitos.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Env: `OPENROUTER_API_KEY`. Pode reutilizar `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">Padrão `https://openrouter.ai/api/v1`. O legado `https://openrouter.ai/v1` é normalizado.</ParamField>
    <ParamField path="model" type="string">Padrão `hexgrad/kokoro-82m`. Alias: `modelId`.</ParamField>
    <ParamField path="voice" type="string">Padrão `af_alloy`. Alias: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Padrão `mp3`.</ParamField>
    <ParamField path="speed" type="number">Substituição de velocidade nativa do provider.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Env: `VOLCENGINE_TTS_API_KEY` ou `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Padrão `seed-tts-1.0`. Env: `VOLCENGINE_TTS_RESOURCE_ID`. Use `seed-tts-2.0` quando seu projeto tiver entitlement de TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">Cabeçalho da app key. Padrão `aGjiRDfUWi`. Env: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Substitui o endpoint HTTP de TTS do Seed Speech. Env: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">Tipo de voz. Padrão `en_female_anna_mars_bigtts`. Env: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">Relação de velocidade nativa do provider.</ParamField>
    <ParamField path="emotion" type="string">Tag de emoção nativa do provider.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Campos legados do Volcengine Speech Console. Env: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (padrão `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Env: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Padrão `https://api.x.ai/v1`. Env: `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">Padrão `eve`. Vozes live: `ara`, `eve`, `leo`, `rex`, `sal`, `una`.</ParamField>
    <ParamField path="language" type="string">Código de idioma BCP-47 ou `auto`. Padrão `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Padrão `mp3`.</ParamField>
    <ParamField path="speed" type="number">Substituição de velocidade nativa do provider.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Env: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Padrão `https://api.xiaomimimo.com/v1`. Env: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Padrão `mimo-v2.5-tts`. Env: `XIAOMI_TTS_MODEL`. Também oferece suporte a `mimo-v2-tts`.</ParamField>
    <ParamField path="voice" type="string">Padrão `mimo_default`. Env: `XIAOMI_TTS_VOICE`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Padrão `mp3`. Env: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Instrução opcional de estilo em linguagem natural enviada como mensagem do usuário; não é falada.</ParamField>
  </Accordion>
</AccordionGroup>

## Ferramenta do agente

A ferramenta `tts` converte texto em fala e retorna um anexo de áudio para
entrega na resposta. No Feishu, Matrix, Telegram e WhatsApp, o áudio é
entregue como mensagem de voz, e não como anexo de arquivo. Feishu e
WhatsApp podem transcodificar saída TTS não-Opus nesse caminho quando `ffmpeg` estiver
disponível.

O WhatsApp envia áudio pelo Baileys como nota de voz PTT (`audio` com
`ptt: true`) e envia o texto visível **separadamente** do áudio PTT porque
os clientes nem sempre renderizam legendas em notas de voz.

A ferramenta aceita campos opcionais `channel` e `timeoutMs`; `timeoutMs` é um
timeout por chamada da requisição ao provider em milissegundos.

## Gateway RPC

| Method            | Finalidade                                  |
| ----------------- | ------------------------------------------- |
| `tts.status`      | Lê o estado atual do TTS e a última tentativa. |
| `tts.enable`      | Define a preferência automática local como `always`. |
| `tts.disable`     | Define a preferência automática local como `off`. |
| `tts.convert`     | Conversão única de texto → áudio.           |
| `tts.setProvider` | Define a preferência local de provider.     |
| `tts.setPersona`  | Define a preferência local de persona.      |
| `tts.providers`   | Lista providers configurados e status.      |

## Links de serviços

- [Guia de text-to-speech da OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [Referência da API Audio da OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [Text-to-speech REST do Azure Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Provider Azure Speech](/pt-BR/providers/azure-speech)
- [Text to Speech do ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Autenticação do ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/pt-BR/providers/gradium)
- [API TTS da Inworld](https://docs.inworld.ai/tts/tts)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [API HTTP TTS do Volcengine](/pt-BR/providers/volcengine#text-to-speech)
- [Síntese de fala Xiaomi MiMo](/pt-BR/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formatos de saída do Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [Text to speech do xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Relacionado

- [Visão geral de mídia](/pt-BR/tools/media-overview)
- [Geração de música](/pt-BR/tools/music-generation)
- [Geração de vídeo](/pt-BR/tools/video-generation)
- [Comandos slash](/pt-BR/tools/slash-commands)
- [Plugin de chamada de voz](/pt-BR/plugins/voice-call)

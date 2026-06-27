---
read_when:
    - Habilitando conversão de texto em fala para respostas
    - Configurando um provedor de TTS, uma cadeia de fallback ou uma persona
    - Usando comandos ou diretivas /tts
sidebarTitle: Text to speech (TTS)
summary: Conversão de texto em fala para respostas de saída — provedores, personas, comandos slash e saída por canal
title: Texto para fala
x-i18n:
    generated_at: "2026-06-27T18:19:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 94835daf766286e937c57828818a4ee0a20e6d5894b7d51d6f98fc7ebdaffe35
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw pode converter respostas de saída em áudio em **14 provedores de fala**
e entregar mensagens de voz nativas no Feishu, Matrix, Telegram e WhatsApp,
anexos de áudio em todos os outros lugares e streams PCM/Ulaw para telefonia e Talk.

TTS é a metade de saída de fala do modo `stt-tts` do Talk. Sessões Talk
`realtime` nativas do provedor sintetizam fala dentro do provedor em tempo real
em vez de chamar este caminho de TTS, enquanto sessões `transcription` não sintetizam
uma resposta de voz do assistente.

## Início rápido

<Steps>
  <Step title="Escolha um provedor">
    OpenAI e ElevenLabs são as opções hospedadas mais confiáveis. Microsoft e
    CLI local funcionam sem uma chave de API. Veja a [matriz de provedores](#supported-providers)
    para a lista completa.
  </Step>
  <Step title="Defina a chave de API">
    Exporte a variável de ambiente do seu provedor (por exemplo `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft e CLI local não precisam de chave.
  </Step>
  <Step title="Ative na configuração">
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
    envia uma resposta de áudio avulsa.
  </Step>
</Steps>

<Note>
Auto-TTS fica **desativado** por padrão. Quando `messages.tts.provider` não está definido,
o OpenClaw escolhe o primeiro provedor configurado na ordem de seleção automática do registro.
A ferramenta de agente `tts` integrada é apenas para intenção explícita: o chat comum permanece
em texto, a menos que o usuário peça áudio, use `/tts` ou ative fala por Auto-TTS/diretiva.
</Note>

## Provedores compatíveis

| Provedor          | Autenticação                                                                                                     | Observações                                                                                 |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (também `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)        | Saída nativa de recado de voz Ogg/Opus e telefonia.                                         |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | TTS compatível com OpenAI. O padrão é `hexgrad/Kokoro-82M`.                                 |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` ou `XI_API_KEY`                                                                             | Clonagem de voz, multilíngue, determinístico via `seed`; transmitido para reprodução de voz no Discord. |
| **Google Gemini** | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`                                                                             | TTS em lote da API Gemini; ciente de persona via `promptTemplate: "audio-profile-v1"`.      |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | Saída de recado de voz e telefonia.                                                         |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | API de TTS por streaming. Recado de voz Opus nativo e telefonia PCM.                        |
| **CLI local**     | nenhum                                                                                                           | Executa um comando local de TTS configurado.                                                |
| **Microsoft**     | nenhum                                                                                                           | TTS neural público do Edge via `node-edge-tts`. Melhor esforço, sem SLA.                    |
| **MiniMax**       | `MINIMAX_API_KEY` (ou Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)      | API T2A v2. O padrão é `speech-2.8-hd`.                                                     |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | Também usado para resumo automático; aceita persona `instructions`.                         |
| **OpenRouter**    | `OPENROUTER_API_KEY` (pode reutilizar `models.providers.openrouter.apiKey`)                                      | Modelo padrão `hexgrad/kokoro-82m`.                                                         |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` ou `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/token legado: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | API HTTP BytePlus Seed Speech.                                                              |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | Provedor compartilhado de imagem, vídeo e fala.                                             |
| **xAI**           | `XAI_API_KEY`                                                                                                    | TTS em lote da xAI. Recado de voz Opus nativo **não** é compatível.                         |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | TTS MiMo por meio de conclusões de chat da Xiaomi.                                          |

Se vários provedores estiverem configurados, o selecionado é usado primeiro e os
outros são opções de fallback. O resumo automático usa `summaryModel` (ou
`agents.defaults.model.primary`), então esse provedor também deve estar autenticado
se você mantiver os resumos ativados.

<Warning>
O provedor **Microsoft** incluído usa o serviço online de TTS neural do Microsoft Edge
via `node-edge-tts`. Ele é um serviço web público sem SLA ou cota publicados — trate-o
como melhor esforço. O id de provedor legado `edge` é normalizado para `microsoft` e
`openclaw doctor --fix` reescreve a configuração persistida; novas configurações devem
sempre usar `microsoft`.
</Warning>

## Configuração

A configuração de TTS fica em `messages.tts` em `~/.openclaw/openclaw.json`. Escolha uma
predefinição e adapte o bloco do provedor:

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
          speakerVoice: "en-US-JennyNeural",
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
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
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
          speakerVoice: "Kore",
          // Optional natural-language style prompts:
          // audioProfile: "Speak in a calm, podcast-host tone.",
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
          speakerVoiceId: "YTpq7expH9539ERJ",
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
          speakerVoiceId: "Sarah",
          temperature: 0.7,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="CLI local">
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
          speakerVoice: "en-US-MichelleNeural",
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
          speakerVoiceId: "English_expressive_narrator",
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
          speakerVoice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
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
          speakerVoice: "af_alloy",
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
          speakerVoice: "en_female_anna_mars_bigtts",
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
          speakerVoiceId: "eve",
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
          speakerVoice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

Para Xiaomi `mimo-v2.5-tts-voicedesign`, omita `speakerVoice` e defina `style` como
o prompt de design de voz. O OpenClaw envia esse prompt como a mensagem `user` do TTS
e não envia `audio.voice` para o modelo voicedesign.

### Substituições de voz por agente

Use `agents.list[].tts` quando um agente deve falar com um provedor,
voz, modelo, persona ou modo de TTS automático diferente. O bloco do agente faz mesclagem profunda sobre
`messages.tts`, então as credenciais do provedor podem permanecer na configuração global do provedor:

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
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

Para fixar uma persona por agente, defina `agents.list[].tts.persona` junto com a configuração do provedor
— isso substitui a `messages.tts.persona` global apenas para esse agente.

Ordem de precedência para respostas automáticas, `/tts audio`, `/tts status` e a
ferramenta de agente `tts`:

1. `messages.tts`
2. `agents.list[].tts` ativo
3. substituição de canal, quando o canal oferece suporte a `channels.<channel>.tts`
4. substituição de conta, quando o canal passa `channels.<channel>.accounts.<id>.tts`
5. preferências locais de `/tts` para este host
6. diretivas inline `[[tts:...]]` quando [substituições por modelo](#model-driven-directives) estão habilitadas

Substituições de canal e conta usam o mesmo formato de `messages.tts` e
fazem mesclagem profunda sobre as camadas anteriores, então credenciais compartilhadas do provedor podem permanecer em
`messages.tts` enquanto um canal ou conta de bot altera apenas a voz do falante, o modelo, a persona
ou o modo automático:

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
              openai: { speakerVoice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

## Personas

Uma **persona** é uma identidade falada estável que pode ser aplicada de forma determinística
entre provedores. Ela pode preferir um provedor, definir uma intenção de prompt
neutra em relação a provedores e carregar vínculos específicos de provedor para vozes, modelos, modelos de prompt, sementes e configurações de voz.

### Persona mínima

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "Narrator",
          provider: "elevenlabs",
          providers: {
            elevenlabs: {
              speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
              modelId: "eleven_multilingual_v2",
            },
          },
        },
      },
    },
  },
}
```

### Persona completa (prompt neutro em relação ao provedor)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "Dry, warm British butler narrator.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "A brilliant British butler. Dry, witty, warm, charming, emotionally expressive, never generic.",
            scene: "A quiet late-night study. Close-mic narration for a trusted operator.",
            sampleContext: "The speaker is answering a private technical request with concise confidence and dry warmth.",
            style: "Refined, understated, lightly amused.",
            accent: "British English.",
            pacing: "Measured, with short dramatic pauses.",
            constraints: ["Do not read configuration values aloud.", "Do not explain the persona."],
          },
          providers: {
            google: {
              model: "gemini-3.1-flash-tts-preview",
              speakerVoice: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "cedar" },
            elevenlabs: {
              speakerVoiceId: "voice_id",
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

1. Preferência local `/tts persona <id>`, se definida.
2. `messages.tts.persona`, se definida.
3. Nenhuma persona.

A seleção de provedor executa primeiro as opções explícitas:

1. Substituições diretas (CLI, Gateway, Talk, diretivas TTS permitidas).
2. Preferência local `/tts provider <id>`.
3. `provider` da persona ativa.
4. `messages.tts.provider`.
5. Seleção automática do registro.

Para cada tentativa de provedor, o OpenClaw mescla configurações nesta ordem:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Substituições de solicitação confiáveis
4. Substituições de diretiva TTS permitidas emitidas pelo modelo

### Como os provedores usam prompts de persona

Campos de prompt de persona (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) são **neutros em relação ao provedor**. Cada provedor decide como
usá-los:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Envolve campos de prompt de persona em uma estrutura de prompt TTS do Gemini **somente quando**
    a configuração efetiva do provedor Google define `promptTemplate: "audio-profile-v1"`
    ou `personaPrompt`. Os campos antigos `audioProfile` e `speakerName` ainda são
    prefixados como texto de prompt específico do Google. Tags de áudio inline, como
    `[whispers]` ou `[laughs]` dentro de um bloco `[[tts:text]]`, são preservadas
    dentro da transcrição do Gemini; o OpenClaw não gera essas tags.
  </Accordion>
  <Accordion title="OpenAI">
    Mapeia campos de prompt de persona para o campo `instructions` da solicitação **somente quando**
    nenhuma `instructions` explícita do OpenAI está configurada. `instructions` explícitas
    sempre prevalecem.
  </Accordion>
  <Accordion title="Other providers">
    Use apenas os vínculos de persona específicos do provedor em
    `personas.<id>.providers.<provider>`. Campos de prompt de persona são ignorados,
    a menos que o provedor implemente seu próprio mapeamento de prompt de persona.
  </Accordion>
</AccordionGroup>

### Política de fallback

`fallbackPolicy` controla o comportamento quando uma persona **não tem vínculo** para o
provedor tentado:

| Política            | Comportamento                                                                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `preserve-persona`  | **Padrão.** Campos de prompt neutros em relação ao provedor permanecem disponíveis; o provedor pode usá-los ou ignorá-los.                                 |
| `provider-defaults` | A persona é omitida da preparação de prompt para essa tentativa; o provedor usa seus padrões neutros enquanto o fallback para outros provedores continua. |
| `fail`              | Ignora essa tentativa de provedor com `reasonCode: "not_configured"` e `personaBinding: "missing"`. Provedores de fallback ainda são tentados.             |

A solicitação TTS inteira só falha quando **todos** os provedores tentados são ignorados
ou falham.

A seleção de provedor de sessão Talk é escopada à sessão. Um cliente Talk deve escolher
IDs de provedor, IDs de modelo, IDs de voz e localidades em `talk.catalog` e passá-los
pela sessão Talk ou solicitação de handoff. Abrir uma sessão de voz não deve
alterar `messages.tts` nem os padrões globais do provedor Talk.

## Diretivas orientadas por modelo

Por padrão, o assistente **pode** emitir diretivas `[[tts:...]]` para substituir
voz, modelo ou velocidade para uma única resposta, além de um bloco opcional
`[[tts:text]]...[[/tts:text]]` para pistas expressivas que devem aparecer
apenas no áudio:

```text
Here you go.

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Quando `messages.tts.auto` é `"tagged"`, **diretivas são obrigatórias** para acionar
áudio. A entrega de blocos em streaming remove diretivas do texto visível antes que o
canal as veja, mesmo quando divididas em blocos adjacentes.

`provider=...` é ignorado, a menos que `modelOverrides.allowProvider: true`. Quando uma
resposta declara `provider=...`, as outras chaves nessa diretiva são analisadas
apenas por esse provedor; chaves não compatíveis são removidas e relatadas como avisos
de diretiva TTS.

**Chaves de diretiva disponíveis:**

- `provider` (ID de provedor registrado; requer `allowProvider: true`)
- `speakerVoice` / `speakerVoiceId` (aliases legados: `voice`, `voiceName`, `voice_name`, `google_voice`, `voiceId`)
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume MiniMax, 0–10)
- `pitch` (pitch inteiro MiniMax, −12 a 12; valores fracionários são truncados)
- `emotion` (tag de emoção Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Desabilitar substituições por modelo completamente:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Permitir troca de provedor mantendo outros controles configuráveis:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Comandos slash

Comando único `/tts`. No Discord, o OpenClaw também registra `/voice` porque
`/tts` é um comando integrado do Discord — texto `/tts ...` ainda funciona.

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
Comandos exigem um remetente autorizado (regras de allowlist/proprietário se aplicam) e `commands.text`
ou o registro de comando nativo deve estar habilitado.
</Note>

Observações de comportamento:

- `/tts on` grava a preferência local de TTS como `always`; `/tts off` grava como `off`.
- `/tts chat on|off|default` grava uma substituição de TTS automático escopada à sessão para o chat atual.
- `/tts persona <id>` grava a preferência local de persona; `/tts persona off` a limpa.
- `/tts latest` lê a resposta mais recente do assistente na transcrição da sessão atual e a envia como áudio uma vez. Ele armazena apenas um hash dessa resposta na entrada da sessão para suprimir envios de voz duplicados.
- `/tts audio` gera uma resposta de áudio avulsa (não alterna TTS para ativado).
- `limit` e `summary` são armazenados nas **preferências locais**, não na configuração principal.
- `/tts status` inclui diagnósticos de fallback da tentativa mais recente — `Fallback: <primary> -> <used>`, `Attempts: ...` e detalhe por tentativa (`provider:outcome(reasonCode) latency`).
- `/status` mostra o modo TTS ativo, além do provedor, modelo, voz e metadados sanitizados de endpoint personalizado configurados quando TTS está habilitado.

## Preferências por usuário

Comandos slash gravam substituições locais em `prefsPath`. O padrão é
`~/.openclaw/settings/tts.json`; substitua com a variável de ambiente `OPENCLAW_TTS_PREFS`
ou `messages.tts.prefsPath`.

| Campo armazenado | Efeito                                           |
| ---------------- | ------------------------------------------------ |
| `auto`           | Substituição local de TTS automático (`always`, `off`, …) |
| `provider`       | Substituição local do provedor primário          |
| `persona`        | Substituição local de persona                    |
| `maxLength`      | Limiar de resumo (padrão `1500` caracteres)      |
| `summarize`      | Alternância de resumo (padrão `true`)            |

Essas preferências substituem a configuração efetiva de `messages.tts` mais o bloco
`agents.list[].tts` ativo para esse host.

## Formatos de saída (fixos)

A entrega de voz TTS é orientada por capacidade do canal. Plugins de canal anunciam
se TTS em estilo de voz deve pedir aos provedores um destino nativo `voice-note` ou
manter a síntese normal `audio-file` e apenas marcar a saída compatível para entrega
de voz.

- **Canais compatíveis com notas de voz**: respostas de nota de voz preferem Opus (`opus_48000_64` da ElevenLabs, `opus` da OpenAI).
  - 48 kHz / 64 kbps é um bom equilíbrio para mensagens de voz.
- **Feishu / WhatsApp**: quando uma resposta de nota de voz é produzida como MP3/WebM/WAV/M4A
  ou outro arquivo provavelmente de áudio, o Plugin do canal a transcodifica para Ogg/Opus
  a 48 kHz com `ffmpeg` antes de enviar a mensagem de voz nativa. O WhatsApp envia
  o resultado por meio do payload `audio` da Baileys com `ptt: true` e
  `audio/ogg; codecs=opus`. Se a conversão falhar, o Feishu recebe o arquivo
  original como anexo; o envio do WhatsApp falha em vez de publicar um payload
  PTT incompatível.
- **Outros canais**: MP3 (`mp3_44100_128` da ElevenLabs, `mp3` da OpenAI).
  - 44,1 kHz / 128 kbps é o equilíbrio padrão para clareza de fala.
- **MiniMax**: MP3 (modelo `speech-2.8-hd`, taxa de amostragem de 32 kHz) para anexos de áudio comuns. Para destinos de nota de voz anunciados pelo canal, o OpenClaw transcodifica o MP3 da MiniMax para Opus a 48 kHz com `ffmpeg` antes da entrega quando o canal anuncia transcodificação.
- **Xiaomi MiMo**: MP3 por padrão, ou WAV quando configurado. Para destinos de nota de voz anunciados pelo canal, o OpenClaw transcodifica a saída da Xiaomi para Opus a 48 kHz com `ffmpeg` antes da entrega quando o canal anuncia transcodificação.
- **CLI local**: usa o `outputFormat` configurado. Destinos de nota de voz são
  convertidos para Ogg/Opus e a saída de telefonia é convertida para PCM mono bruto
  de 16 kHz com `ffmpeg`.
- **Google Gemini**: o TTS da API Gemini retorna PCM bruto de 24 kHz. O OpenClaw o encapsula como WAV para anexos de áudio, transcodifica para Opus a 48 kHz para destinos de nota de voz e retorna PCM diretamente para Talk/telefonia.
- **Gradium**: WAV para anexos de áudio, Opus para destinos de nota de voz e `ulaw_8000` a 8 kHz para telefonia.
- **Inworld**: MP3 para anexos de áudio comuns, `OGG_OPUS` nativo para destinos de nota de voz e `PCM` bruto a 22050 Hz para Talk/telefonia.
- **xAI**: MP3 por padrão; `responseFormat` pode ser `mp3`, `wav`, `pcm`, `mulaw` ou `alaw`. O OpenClaw usa o endpoint TTS REST em lote da xAI e retorna um anexo de áudio completo; o WebSocket de TTS por streaming da xAI não é usado por este caminho de provedor. O formato Opus nativo de nota de voz não é compatível com este caminho.
- **Microsoft**: usa `microsoft.outputFormat` (padrão `audio-24khz-48kbitrate-mono-mp3`).
  - O transporte incluído aceita um `outputFormat`, mas nem todos os formatos estão disponíveis no serviço.
  - Valores de formato de saída seguem os formatos de saída do Microsoft Speech (incluindo Ogg/WebM Opus).
  - O `sendVoice` do Telegram aceita OGG/MP3/M4A; use OpenAI/ElevenLabs se precisar
    de mensagens de voz Opus garantidas.
  - Se o formato de saída configurado da Microsoft falhar, o OpenClaw tenta novamente com MP3.

Os formatos de saída da OpenAI/ElevenLabs são fixos por canal (veja acima).

## Comportamento de TTS automático

Quando `messages.tts.auto` está habilitado, o OpenClaw:

- Ignora TTS se a resposta já contiver mídia estruturada.
- Ignora respostas muito curtas (menos de 10 caracteres).
- Resume respostas longas quando resumos estão habilitados, usando
  `summaryModel` (ou `agents.defaults.model.primary`).
- Anexa o áudio gerado à resposta.
- Em `mode: "final"`, ainda envia TTS somente de áudio para respostas finais transmitidas por streaming
  após a conclusão do stream de texto; a mídia gerada passa pela mesma
  normalização de mídia do canal que anexos normais de resposta.

Se a resposta exceder `maxLength` e o resumo estiver desativado (ou não houver chave de API para o
modelo de resumo), o áudio é ignorado e a resposta de texto normal é enviada.

```text
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize -> TTS -> attach audio
```

## Formatos de saída por canal

| Destino                               | Formato                                                                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | Respostas de nota de voz preferem **Opus** (`opus_48000_64` da ElevenLabs, `opus` da OpenAI). 48 kHz / 64 kbps equilibram clareza e tamanho. |
| Outros canais                         | **MP3** (`mp3_44100_128` da ElevenLabs, `mp3` da OpenAI). 44,1 kHz / 128 kbps padrão para fala.                                      |
| Talk / telefonia                      | **PCM** nativo do provedor (Inworld 22050 Hz, Google 24 kHz), ou `ulaw_8000` da Gradium para telefonia.                              |

Observações por provedor:

- **Transcodificação Feishu / WhatsApp:** quando uma resposta de nota de voz chega como MP3/WebM/WAV/M4A, o Plugin do canal transcodifica para Ogg/Opus a 48 kHz com `ffmpeg`. O WhatsApp envia pela Baileys com `ptt: true` e `audio/ogg; codecs=opus`. Se a conversão falhar: o Feishu recorre a anexar o arquivo original; o envio do WhatsApp falha em vez de publicar um payload PTT incompatível.
- **MiniMax / Xiaomi MiMo:** MP3 padrão (32 kHz para MiniMax `speech-2.8-hd`); transcodificado para Opus a 48 kHz para destinos de nota de voz via `ffmpeg`.
- **CLI local:** usa o `outputFormat` configurado. Destinos de nota de voz são convertidos para Ogg/Opus e a saída de telefonia para PCM mono bruto de 16 kHz.
- **Google Gemini:** retorna PCM bruto de 24 kHz. O OpenClaw encapsula como WAV para anexos, transcodifica para Opus a 48 kHz para destinos de nota de voz e retorna PCM diretamente para Talk/telefonia.
- **Inworld:** anexos MP3, nota de voz `OGG_OPUS` nativa, `PCM` bruto a 22050 Hz para Talk/telefonia.
- **xAI:** MP3 por padrão; `responseFormat` pode ser `mp3|wav|pcm|mulaw|alaw`. Usa o endpoint REST em lote da xAI — TTS por WebSocket em streaming **não** é usado. O formato Opus nativo de nota de voz **não** é compatível.
- **Microsoft:** usa `microsoft.outputFormat` (padrão `audio-24khz-48kbitrate-mono-mp3`). O `sendVoice` do Telegram aceita OGG/MP3/M4A; use OpenAI/ElevenLabs se precisar de mensagens de voz Opus garantidas. Se o formato configurado da Microsoft falhar, o OpenClaw tenta novamente com MP3.

Os formatos de saída da OpenAI e da ElevenLabs são fixos por canal conforme listado acima.

## Referência de campos

<AccordionGroup>
  <Accordion title="Top-level messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Modo de TTS automático. `inbound` só envia áudio após uma mensagem de voz recebida; `tagged` só envia áudio quando a resposta inclui diretivas `[[tts:...]]` ou um bloco `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Alternância legada. `openclaw doctor --fix` migra isto para `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` inclui respostas de ferramenta/bloco além das respostas finais.
    </ParamField>
    <ParamField path="provider" type="string">
      ID do provedor de fala. Quando não definido, o OpenClaw usa o primeiro provedor configurado na ordem de seleção automática do registro. O `provider: "edge"` legado é reescrito para `"microsoft"` por `openclaw doctor --fix`.
    </ParamField>
    <ParamField path="persona" type="string">
      ID da persona ativa de `personas`. Normalizado para minúsculas.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Identidade falada estável. Campos: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Veja [Personas](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Modelo barato para resumo automático; o padrão é `agents.defaults.model.primary`. Aceita `provider/model` ou um alias de modelo configurado.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Permite que o modelo emita diretivas TTS. `enabled` usa `true` por padrão; `allowProvider` usa `false` por padrão.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Configurações de propriedade do provedor indexadas por ID do provedor de fala. Blocos diretos legados (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) são reescritos por `openclaw doctor --fix`; faça commit apenas de `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      Limite rígido para caracteres de entrada de TTS. `/tts audio` falha se excedido.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      Tempo limite da requisição em milissegundos.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Substitui o caminho JSON local de preferências (provedor/limite/resumo). Padrão `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` ou `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Região do Azure Speech (por exemplo, `eastus`). Env: `AZURE_SPEECH_REGION` ou `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Substituição opcional do endpoint do Azure Speech (alias `baseUrl`).</ParamField>
    <ParamField path="speakerVoice" type="string">ShortName da voz do Azure. Padrão `en-US-JennyNeural`. Alias legado: `voice`.</ParamField>
    <ParamField path="lang" type="string">Código de idioma SSML. Padrão `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">`X-Microsoft-OutputFormat` do Azure para áudio padrão. Padrão `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">`X-Microsoft-OutputFormat` do Azure para saída de nota de voz. Padrão `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Recorre a `ELEVENLABS_API_KEY` ou `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">ID do modelo (por exemplo, `eleven_multilingual_v2`, `eleven_v3`).</ParamField>
    <ParamField path="speakerVoiceId" type="string">ID de voz da ElevenLabs. Alias legado: `voiceId`.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (cada um `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = normal).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Modo de normalização de texto.</ParamField>
    <ParamField path="languageCode" type="string">ISO 639-1 de 2 letras (por exemplo, `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Inteiro `0..4294967295` para determinismo de melhor esforço.</ParamField>
    <ParamField path="baseUrl" type="string">Substitui a URL base da API ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Recorre a `GEMINI_API_KEY` / `GOOGLE_API_KEY`. Se omitido, o TTS pode reutilizar `models.providers.google.apiKey` antes do fallback de env.</ParamField>
    <ParamField path="model" type="string">Modelo TTS do Gemini. Padrão `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="speakerVoice" type="string">Nome de voz pré-criada do Gemini. Padrão `Kore`. Aliases legados: `voiceName`, `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Prompt de estilo em linguagem natural prefixado antes do texto falado.</ParamField>
    <ParamField path="speakerName" type="string">Rótulo opcional do falante prefixado antes do texto falado quando seu prompt usa um falante nomeado.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Defina como `audio-profile-v1` para encapsular campos de prompt da persona ativa em uma estrutura determinística de prompt TTS do Gemini.</ParamField>
    <ParamField path="personaPrompt" type="string">Texto extra de prompt de persona específico do Google anexado às notas do diretor do modelo.</ParamField>
    <ParamField path="baseUrl" type="string">Somente `https://generativelanguage.googleapis.com` é aceito.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Amb: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Padrão `https://api.gradium.ai`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Padrão Emma (`YTpq7expH9539ERJ`). Alias legado: `voiceId`.</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Inworld principal

    <ParamField path="apiKey" type="string">Amb: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Padrão `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Padrão `inworld-tts-1.5-max`. Também: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Padrão `Sarah`. Alias legado: `voiceId`.</ParamField>
    <ParamField path="temperature" type="number">Temperatura de amostragem `0..2`.</ParamField>

  </Accordion>

  <Accordion title="CLI local (tts-local-cli)">
    <ParamField path="command" type="string">Executável local ou string de comando para TTS por CLI.</ParamField>
    <ParamField path="args" type="string[]">Argumentos do comando. Aceita os placeholders `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Formato de saída esperado da CLI. Padrão `mp3` para anexos de áudio.</ParamField>
    <ParamField path="timeoutMs" type="number">Tempo limite do comando em milissegundos. Padrão `120000`.</ParamField>
    <ParamField path="cwd" type="string">Diretório de trabalho opcional do comando.</ParamField>
    <ParamField path="env" type="Record<string, string>">Substituições opcionais de ambiente para o comando.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (sem chave de API)">
    <ParamField path="enabled" type="boolean" default="true">Permite o uso de fala da Microsoft.</ParamField>
    <ParamField path="speakerVoice" type="string">Nome da voz neural da Microsoft (por exemplo, `en-US-MichelleNeural`). Alias legado: `voice`.</ParamField>
    <ParamField path="lang" type="string">Código do idioma (por exemplo, `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Formato de saída da Microsoft. Padrão `audio-24khz-48kbitrate-mono-mp3`. Nem todos os formatos são compatíveis com o transporte incluído baseado no Edge.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Strings percentuais (por exemplo, `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Grava legendas JSON junto ao arquivo de áudio.</ParamField>
    <ParamField path="proxy" type="string">URL de proxy para solicitações de fala da Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">Substituição do tempo limite da solicitação (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Alias legado. Execute `openclaw doctor --fix` para regravar a configuração persistida em `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Usa `MINIMAX_API_KEY` como alternativa. Autenticação Token Plan via `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` ou `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Padrão `https://api.minimax.io`. Amb: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Padrão `speech-2.8-hd`. Amb: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Padrão `English_expressive_narrator`. Amb: `MINIMAX_TTS_VOICE_ID`. Alias legado: `voiceId`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Padrão `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Padrão `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Inteiro `-12..12`. Padrão `0`. Valores fracionários são truncados antes da solicitação.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Usa `OPENAI_API_KEY` como alternativa.</ParamField>
    <ParamField path="model" type="string">ID do modelo TTS da OpenAI (por exemplo, `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="speakerVoice" type="string">Nome da voz (por exemplo, `alloy`, `cedar`). Alias legado: `voice`.</ParamField>
    <ParamField path="instructions" type="string">Campo `instructions` explícito da OpenAI. Quando definido, os campos de prompt de persona **não** são mapeados automaticamente.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">Campos JSON extras mesclados aos corpos de solicitação `/audio/speech` depois dos campos TTS gerados da OpenAI. Use isto para endpoints compatíveis com OpenAI, como Kokoro, que exigem chaves específicas do provedor como `lang`; chaves de protótipo inseguras são ignoradas.</ParamField>
    <ParamField path="baseUrl" type="string">
      Substitui o endpoint TTS da OpenAI. Ordem de resolução: configuração → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Valores não padrão são tratados como endpoints TTS compatíveis com OpenAI, portanto nomes personalizados de modelo e voz são aceitos.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Amb: `OPENROUTER_API_KEY`. Pode reutilizar `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">Padrão `https://openrouter.ai/api/v1`. O legado `https://openrouter.ai/v1` é normalizado.</ParamField>
    <ParamField path="model" type="string">Padrão `hexgrad/kokoro-82m`. Alias: `modelId`.</ParamField>
    <ParamField path="speakerVoice" type="string">Padrão `af_alloy`. Aliases legados: `voice`, `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Padrão `mp3`.</ParamField>
    <ParamField path="speed" type="number">Substituição de velocidade nativa do provedor.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Amb: `VOLCENGINE_TTS_API_KEY` ou `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Padrão `seed-tts-1.0`. Amb: `VOLCENGINE_TTS_RESOURCE_ID`. Use `seed-tts-2.0` quando seu projeto tiver direito ao TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">Cabeçalho da chave do app. Padrão `aGjiRDfUWi`. Amb: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Substitui o endpoint HTTP TTS do Seed Speech. Amb: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="speakerVoice" type="string">Tipo de voz. Padrão `en_female_anna_mars_bigtts`. Amb: `VOLCENGINE_TTS_VOICE`. Alias legado: `voice`.</ParamField>
    <ParamField path="speedRatio" type="number">Proporção de velocidade nativa do provedor.</ParamField>
    <ParamField path="emotion" type="string">Etiqueta de emoção nativa do provedor.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Campos legados do Volcengine Speech Console. Amb: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (padrão `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Amb: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Padrão `https://api.x.ai/v1`. Amb: `XAI_BASE_URL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Padrão `eve`. Vozes ativas: `ara`, `eve`, `leo`, `rex`, `sal`, `una`. Alias legado: `voiceId`.</ParamField>
    <ParamField path="language" type="string">Código de idioma BCP-47 ou `auto`. Padrão `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Padrão `mp3`.</ParamField>
    <ParamField path="speed" type="number">Substituição de velocidade nativa do provedor.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Amb: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Padrão `https://api.xiaomimimo.com/v1`. Amb: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Padrão `mimo-v2.5-tts`. Amb: `XIAOMI_TTS_MODEL`. Também aceita `mimo-v2-tts` e `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="speakerVoice" type="string">Padrão `mimo_default` para modelos de voz predefinida. Amb: `XIAOMI_TTS_VOICE`. Alias legado: `voice`. Não enviado para `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Padrão `mp3`. Amb: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Instrução opcional de estilo em linguagem natural enviada como mensagem do usuário; não é falada. Para `mimo-v2.5-tts-voicedesign`, este é o prompt de design de voz; o OpenClaw fornece um padrão quando omitido.</ParamField>
  </Accordion>
</AccordionGroup>

## Ferramenta do agente

A ferramenta `tts` converte texto em fala e retorna um anexo de áudio para
entrega da resposta. No Feishu, Matrix, Telegram e WhatsApp, o áudio é
entregue como uma mensagem de voz em vez de um anexo de arquivo. Feishu e
WhatsApp podem transcodificar a saída TTS não Opus neste caminho quando `ffmpeg` está
disponível.

O WhatsApp envia áudio pelo Baileys como uma nota de voz PTT (`audio` com
`ptt: true`) e envia texto visível **separadamente** do áudio PTT porque
os clientes não renderizam legendas de forma consistente em notas de voz.

A ferramenta aceita os campos opcionais `channel` e `timeoutMs`; `timeoutMs` é um
tempo limite de solicitação ao provedor por chamada, em milissegundos. Valores por chamada substituem
`messages.tts.timeoutMs`; tempos limite de TTS configurados substituem qualquer
padrão de provedor criado por plugin.

## RPC do Gateway

| Método            | Finalidade                                  |
| ----------------- | ---------------------------------------- |
| `tts.status`      | Lê o estado atual do TTS e a última tentativa. |
| `tts.enable`      | Define a preferência automática local como `always`.   |
| `tts.disable`     | Define a preferência automática local como `off`.      |
| `tts.convert`     | Texto avulso → áudio.                    |
| `tts.setProvider` | Define a preferência local de provedor.           |
| `tts.setPersona`  | Define a preferência local de persona.            |
| `tts.providers`   | Lista provedores configurados e status.    |

## Links de serviço

- [Guia de texto para fala da OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [Referência da API de áudio da OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [Texto para fala REST do Azure Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Provedor Azure Speech](/pt-BR/providers/azure-speech)
- [Texto para fala da ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Autenticação da ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/pt-BR/providers/gradium)
- [API TTS da Inworld](https://docs.inworld.ai/tts/tts)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [API HTTP TTS da Volcengine](/pt-BR/providers/volcengine#text-to-speech)
- [Síntese de fala Xiaomi MiMo](/pt-BR/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formatos de saída do Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [Texto para fala da xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Relacionados

- [Visão geral de mídia](/pt-BR/tools/media-overview)
- [Geração de música](/pt-BR/tools/music-generation)
- [Geração de vídeo](/pt-BR/tools/video-generation)
- [Comandos de barra](/pt-BR/tools/slash-commands)
- [Plugin de chamada de voz](/pt-BR/plugins/voice-call)

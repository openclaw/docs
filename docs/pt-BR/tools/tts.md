---
read_when:
    - Ativando a conversão de texto em fala para respostas
    - Configurando um provedor de TTS, uma cadeia de fallback ou uma persona
    - Usando comandos ou diretivas /tts
sidebarTitle: Text to speech (TTS)
summary: Conversão de texto em fala para respostas enviadas — provedores, personas, comandos de barra e saída por canal
title: Texto para fala
x-i18n:
    generated_at: "2026-07-12T15:46:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 908679a0386da75577a2445dfcafecc746d124ffe04816c6f2d6eb74af232edd
    source_path: tools/tts.md
    workflow: 16
---

O OpenClaw converte respostas de saída em áudio por meio de **14 provedores de fala**:
mensagens de voz nativas no Feishu, Matrix, Telegram e WhatsApp; anexos de
áudio em todos os outros lugares; e fluxos PCM/Ulaw para telefonia e Talk.

TTS é a metade de saída de fala do modo `stt-tts` do Talk (`talk.speak` chama
esse mesmo caminho de síntese). Sessões do Talk `realtime` nativas do provedor
sintetizam a fala dentro do provedor em tempo real; sessões `transcription`
nunca sintetizam uma resposta de voz do assistente.

## Início rápido

<Steps>
  <Step title="Escolha um provedor">
    OpenAI e ElevenLabs são as opções hospedadas mais confiáveis. Microsoft e
    CLI local funcionam sem uma chave de API. Consulte a [matriz de provedores](#supported-providers)
    para ver a lista completa.
  </Step>
  <Step title="Defina a chave de API">
    Exporte a variável de ambiente do seu provedor (por exemplo, `OPENAI_API_KEY`,
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
  <Step title="Experimente no chat">
    `/tts status` mostra o estado atual. `/tts audio Hello from OpenClaw`
    envia uma resposta de áudio avulsa.
  </Step>
</Steps>

<Note>
O TTS automático fica **desativado** por padrão. Quando `messages.tts.provider`
não está definido, o OpenClaw escolhe o primeiro provedor configurado na ordem
de seleção automática do registro. A ferramenta de agente `tts` integrada
aceita apenas intenção explícita: o chat comum permanece em texto, a menos que
o usuário solicite áudio, use `/tts` ou ative a fala por TTS automático/diretiva.
</Note>

## Provedores compatíveis

| Provedor          | Autenticação                                                                                                     | Observações                                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (também `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)        | Saída nativa de mensagem de voz Ogg/Opus e telefonia.                                               |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | TTS compatível com OpenAI. O padrão é `hexgrad/Kokoro-82M`.                                         |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` ou `XI_API_KEY`                                                                             | Clonagem de voz, multilíngue, determinístico via `seed`; transmitido para reprodução de voz no Discord. |
| **Google Gemini** | `GEMINI_API_KEY` ou `GOOGLE_API_KEY`                                                                             | TTS em lote da API Gemini; considera a persona via `promptTemplate: "audio-profile-v1"`.            |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | Saída de mensagem de voz e telefonia.                                                               |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | API de TTS por streaming. Mensagem de voz Opus nativa e telefonia PCM.                              |
| **CLI local**     | nenhuma                                                                                                          | Executa um comando TTS local configurado.                                                           |
| **Microsoft**     | nenhuma                                                                                                          | TTS neural público do Edge via `node-edge-tts`. Fornecido na medida do possível, sem SLA.           |
| **MiniMax**       | `MINIMAX_API_KEY` (ou Plano de Tokens: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`) | API T2A v2. O padrão é `speech-2.8-hd`.                                                             |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | Também usado para resumo automático; oferece suporte a `instructions` de persona.                   |
| **OpenRouter**    | `OPENROUTER_API_KEY` (pode reutilizar `models.providers.openrouter.apiKey`)                                      | Modelo padrão `hexgrad/kokoro-82m`.                                                                 |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` ou `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/token legado: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | API HTTP BytePlus Seed Speech.                                                                      |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | Provedor compartilhado de imagem, vídeo e fala.                                                     |
| **xAI**           | `XAI_API_KEY`                                                                                                    | TTS em lote da xAI. Mensagem de voz Opus nativa **não** é compatível.                               |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | TTS MiMo por meio das conclusões de chat da Xiaomi.                                                 |

Se vários provedores estiverem configurados, o selecionado será usado primeiro,
e os demais serão opções de fallback. O resumo automático usa `summaryModel`
(ou `agents.defaults.model.primary`), portanto esse provedor também deve estar
autenticado se você mantiver os resumos ativados.

<Warning>
O provedor **Microsoft** incluído usa o serviço de TTS neural online do
Microsoft Edge por meio de `node-edge-tts`. É um serviço web público sem SLA
ou cota publicados — considere-o um serviço fornecido na medida do possível.
O ID de provedor legado `edge` é normalizado para `microsoft`, e
`openclaw doctor --fix` regrava a configuração persistida; novas configurações
devem sempre usar `microsoft`.
</Warning>

## Configuração

A configuração de TTS fica em `messages.tts` no arquivo
`~/.openclaw/openclaw.json`. Escolha uma predefinição e adapte o bloco do
provedor. Os campos `speakerVoice`/`speakerVoiceId` mostrados abaixo são
canônicos; os nomes de campo `voice`/`voiceId`/`voiceName` próprios de cada
provedor ainda funcionam como aliases legados.

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
          // Prompts opcionais de estilo em linguagem natural:
          // audioProfile: "Fale em um tom calmo de apresentador de podcast.",
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

Para o Xiaomi `mimo-v2.5-tts-voicedesign`, omita `speakerVoice` e defina `style`
como o prompt de criação da voz. O OpenClaw envia esse prompt como a mensagem
`user` do TTS e não envia `audio.voice` para o modelo voicedesign.

### Substituições de voz por agente

Use `agents.list[].tts` quando um agente precisar falar com um provedor, voz, modelo, persona ou modo de TTS automático diferente. O bloco do agente é mesclado profundamente sobre `messages.tts`, portanto as credenciais do provedor podem permanecer na configuração global do provedor:

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

Para fixar uma persona por agente, defina `agents.list[].tts.persona` junto à configuração do provedor — isso substitui a `messages.tts.persona` global somente para esse agente.

Ordem de precedência para respostas automáticas, `/tts audio`, `/tts status` e a ferramenta de agente `tts`:

1. `messages.tts`
2. `agents.list[].tts` ativo
3. substituição do canal, quando o canal oferece suporte a `channels.<channel>.tts`
4. substituição da conta, quando o canal transmite `channels.<channel>.accounts.<id>.tts`
5. preferências locais de `/tts` para este host
6. diretivas `[[tts:...]]` embutidas quando as [substituições pelo modelo](#model-driven-directives) estão habilitadas

As substituições de canal e conta usam o mesmo formato de `messages.tts` e são mescladas profundamente sobre as camadas anteriores, portanto as credenciais compartilhadas do provedor podem permanecer em `messages.tts`, enquanto um canal ou uma conta de bot altera somente a voz do locutor, o modelo, a persona ou o modo automático:

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

Uma **persona** é uma identidade falada estável que pode ser aplicada de forma determinística entre provedores. Ela pode dar preferência a um provedor, definir a intenção do prompt independentemente do provedor e conter vinculações específicas de cada provedor para vozes, modelos, modelos de prompt, seeds e configurações de voz.

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

### Persona completa (prompt independente do provedor)

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

### Resolução da persona

A persona ativa é selecionada de forma determinística:

1. Preferência local de `/tts persona <id>`, se definida.
2. `messages.tts.persona`, se definida.
3. Nenhuma persona.

A seleção do provedor prioriza configurações explícitas:

1. Substituições diretas (CLI, Gateway, Talk e diretivas TTS permitidas).
2. Preferência local de `/tts provider <id>`.
3. `provider` da persona ativa.
4. `messages.tts.provider`.
5. Seleção automática pelo registro.

Para cada tentativa de provedor, o OpenClaw mescla as configurações nesta ordem:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Substituições confiáveis da solicitação
4. Substituições permitidas por diretivas TTS emitidas pelo modelo

### Como os provedores usam prompts de persona

Os campos do prompt da persona (`profile`, `scene`, `sampleContext`, `style`, `accent`, `pacing`, `constraints`) são **independentes do provedor**. Cada provedor decide como usá-los:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Encapsula os campos do prompt da persona em uma estrutura de prompt TTS do Gemini **somente quando** a configuração efetiva do provedor Google define `promptTemplate: "audio-profile-v1"` ou `personaPrompt`. Os campos mais antigos `audioProfile` e `speakerName` ainda são adicionados no início como texto de prompt específico do Google. Tags de áudio embutidas, como `[whispers]` ou `[laughs]`, dentro de um bloco `[[tts:text]]` são preservadas na transcrição do Gemini; o OpenClaw não gera essas tags.
  </Accordion>
  <Accordion title="OpenAI">
    Mapeia os campos do prompt da persona para o campo `instructions` da solicitação **somente quando** nenhuma `instructions` explícita do OpenAI está configurada. Uma `instructions` explícita sempre prevalece.
  </Accordion>
  <Accordion title="Outros provedores">
    Usam somente as vinculações de persona específicas do provedor em `personas.<id>.providers.<provider>`. Os campos do prompt da persona são ignorados, a menos que o provedor implemente seu próprio mapeamento de prompt de persona.
  </Accordion>
</AccordionGroup>

### Política de fallback

`fallbackPolicy` controla o comportamento quando uma persona **não tem vinculação** para o provedor tentado:

| Política            | Comportamento                                                                                                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `preserve-persona`  | **Padrão.** Os campos de prompt independentes do provedor permanecem disponíveis; o provedor pode usá-los ou ignorá-los.                                                               |
| `provider-defaults` | A persona é omitida da preparação do prompt para essa tentativa; o provedor usa seus padrões neutros enquanto o fallback para outros provedores continua.                              |
| `fail`              | Ignora essa tentativa de provedor com `reasonCode: "not_configured"` e `personaBinding: "missing"`. Os provedores de fallback ainda são testados.                                       |

A solicitação TTS inteira só falha quando **todos** os provedores tentados são ignorados ou falham.

A seleção do provedor da sessão do Talk é definida no escopo da sessão. Um cliente Talk deve escolher IDs de provedor, IDs de modelo, IDs de voz e localidades em `talk.catalog` e transmiti-los pela solicitação de sessão ou transferência do Talk. Abrir uma sessão de voz não deve alterar `messages.tts` nem os padrões globais de provedor do Talk.

## Diretivas controladas pelo modelo

Por padrão, o assistente **pode** emitir diretivas `[[tts:...]]` para substituir a voz, o modelo ou a velocidade em uma única resposta, além de um bloco opcional `[[tts:text]]...[[/tts:text]]` para indicações expressivas que devem aparecer somente no áudio:

```text
Aqui está.

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](risos) Leia a música mais uma vez.[[/tts:text]]
```

Quando `messages.tts.auto` é `"tagged"`, as **diretivas são obrigatórias** para acionar o áudio. A entrega de blocos por streaming remove as diretivas do texto visível antes que o canal as receba, mesmo quando elas estão divididas entre blocos adjacentes.

`provider=...` é ignorado, a menos que `modelOverrides.allowProvider: true`. Quando uma resposta declara `provider=...`, as outras chaves dessa diretiva são analisadas somente por esse provedor; chaves sem suporte são removidas e informadas como avisos de diretiva TTS.

**Chaves de diretiva disponíveis:**

- `provider` (ID de provedor registrado; requer `allowProvider: true`)
- `speakerVoice` / `speakerVoiceId` (aliases legados: `voice`, `voiceName`, `voice_name`, `google_voice`, `voiceId`)
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume do MiniMax, `(0, 10]`)
- `pitch` (altura inteira do MiniMax, de −12 a 12; valores fracionários são truncados)
- `emotion` (tag de emoção do Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Desabilitar completamente as substituições pelo modelo:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Permitir a troca de provedor mantendo os outros controles configuráveis:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Comandos de barra

Comando único `/tts`. No Discord, o OpenClaw também registra `/voice` porque `/tts` é um comando integrado do Discord — o texto `/tts ...` continua funcionando.

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
Os comandos exigem um remetente autorizado (aplicam-se as regras de lista de permissões/proprietário), e `commands.text` ou o registro de comandos nativos deve estar habilitado.
</Note>

Observações sobre o comportamento:

- `/tts on` grava a preferência local de TTS como `always`; `/tts off` a grava como `off`.
- `/tts chat on|off|default` grava uma substituição de TTS automático no escopo da sessão para o chat atual.
- `/tts persona <id>` grava a preferência local de persona; `/tts persona off` a limpa.
- `/tts latest` lê a resposta mais recente do assistente na transcrição da sessão atual e a envia uma vez como áudio. Ele armazena somente um hash dessa resposta na entrada da sessão para impedir envios de voz duplicados.
- `/tts audio` gera uma resposta de áudio avulsa (**não** ativa o TTS).
- `/tts limit <chars>` aceita **100–4096** (4096 é o máximo de legenda/mensagem do Telegram); valores fora desse intervalo são rejeitados.
- `limit` e `summary` são armazenados nas **preferências locais**, não na configuração principal.
- `/tts status` inclui diagnósticos de fallback para a tentativa mais recente — `Fallback: <primary> -> <used>`, `Attempts: ...` e detalhes por tentativa (`provider:outcome(reasonCode) latency`).
- `/status` mostra o modo TTS ativo, além do provedor, modelo, voz e metadados sanitizados do endpoint personalizado configurados quando o TTS está habilitado.

## Preferências por usuário

Os comandos de barra gravam substituições locais em `prefsPath`. O padrão é `~/.openclaw/settings/tts.json`; substitua-o pela variável de ambiente `OPENCLAW_TTS_PREFS` ou por `messages.tts.prefsPath`.

| Campo armazenado | Efeito                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| `auto`           | Substituição local do TTS automático (`always`, `off`, …)                                     |
| `provider`       | Substituição local do provedor principal                                                       |
| `persona`        | Substituição local da persona                                                                  |
| `maxLength`      | Limite de resumo/truncamento (padrão de `1500` caracteres, intervalo de `/tts limit` 100–4096) |
| `summarize`      | Alternância de resumo (padrão `true`)                                                          |

Esses valores substituem a configuração efetiva de `messages.tts` junto ao bloco `agents.list[].tts` ativo para esse host.

## Formatos de saída

A entrega de voz TTS é orientada pelos recursos do canal. Os plugins de canal informam
se o TTS em estilo de voz deve solicitar aos provedores um destino nativo `voice-note` ou
manter a síntese normal `audio-file`, e se o canal transcodifica
a saída não nativa antes do envio.

| Destino                               | Formato                                                                                                                                        |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | Respostas de nota de voz priorizam **Opus** (`opus_48000_64` da ElevenLabs, `opus` da OpenAI). 48 kHz / 64 kbps equilibra clareza e tamanho.    |
| Outros canais                         | **MP3** (`mp3_44100_128` da ElevenLabs, `mp3` da OpenAI). 44.1 kHz / 128 kbps é o equilíbrio padrão para fala.                                 |
| Talk / telefonia                      | **PCM** nativo do provedor (Inworld 22050 Hz, Google 24 kHz) ou `ulaw_8000` da Gradium para telefonia.                                          |

Observações por provedor:

- **Transcodificação do Feishu / WhatsApp:** quando uma resposta de nota de voz chega como MP3/WebM/WAV/M4A ou outro provável arquivo de áudio, o plugin do canal a transcodifica para Ogg/Opus de 48 kHz com `ffmpeg` (`libopus`, 64 kbps) antes de enviar a mensagem de voz nativa. O WhatsApp envia o resultado por meio do payload `audio` do Baileys com `ptt: true` e `audio/ogg; codecs=opus`. Em caso de falha na transcodificação: o Feishu captura o erro e recorre ao envio do arquivo original como um anexo comum; o WhatsApp não tem fallback, portanto o próprio envio falha em vez de publicar um payload PTT incompatível.
- **MiniMax:** MP3 (modelo `speech-2.8-hd`, taxa de amostragem de 32 kHz) para anexos de áudio normais; transcodificado para Opus de 48 kHz com `ffmpeg` para destinos de nota de voz anunciados pelo canal.
- **Xiaomi MiMo:** MP3 por padrão ou WAV quando configurado; transcodificado para Opus de 48 kHz com `ffmpeg` para destinos de nota de voz anunciados pelo canal.
- **CLI local:** usa o `outputFormat` configurado. Destinos de nota de voz são convertidos para Ogg/Opus, e a saída de telefonia é convertida para PCM mono bruto de 16 kHz com `ffmpeg`.
- **Google Gemini:** retorna PCM bruto de 24 kHz. O OpenClaw o encapsula como WAV para anexos de áudio, transcodifica-o para Opus de 48 kHz para destinos de nota de voz e retorna PCM diretamente para Talk/telefonia.
- **Gradium:** WAV para anexos de áudio, Opus para destinos de nota de voz e `ulaw_8000` a 8 kHz para telefonia.
- **Inworld:** MP3 para anexos de áudio normais, `OGG_OPUS` nativo para destinos de nota de voz e `PCM` bruto a 22050 Hz para Talk/telefonia.
- **xAI:** MP3 por padrão; `responseFormat` pode ser `mp3`, `wav`, `pcm`, `mulaw` ou `alaw`. Usa o endpoint REST de TTS em lote da xAI e retorna um anexo de áudio completo; o WebSocket de TTS por streaming da xAI não é usado por este caminho do provedor. O formato nativo de nota de voz Opus não é compatível.
- **Microsoft:** usa `microsoft.outputFormat` (padrão `audio-24khz-48kbitrate-mono-mp3`).
  - O transporte incluído aceita um `outputFormat`, mas nem todos os formatos estão disponíveis no serviço.
  - Os valores do formato de saída seguem os formatos de saída do Microsoft Speech (incluindo Ogg/WebM Opus).
  - O `sendVoice` do Telegram aceita OGG/MP3/M4A; use OpenAI/ElevenLabs se precisar de mensagens de voz Opus garantidas.
  - Se o formato de saída configurado da Microsoft falhar, o OpenClaw tenta novamente com MP3.
  - Quando nenhuma substituição explícita de voz está definida e a voz padrão em inglês é usada, o OpenClaw muda automaticamente para uma voz neural chinesa (`zh-CN-XiaoxiaoNeural`, localidade `zh-CN`) se o texto da resposta tiver predominância de CJK.

Os formatos de saída da OpenAI e da ElevenLabs são fixos por canal, conforme listado acima.

## Comportamento do TTS automático

Quando `messages.tts.auto` está habilitado, o OpenClaw:

- Ignora o TTS se a resposta já contiver mídia estruturada.
- Ignora respostas muito curtas (menos de 10 caracteres).
- Resume respostas longas quando os resumos estão habilitados, usando
  `summaryModel` (ou `agents.defaults.model.primary`).
- Anexa o áudio gerado à resposta.
- Em `mode: "final"`, ainda envia TTS somente de áudio para respostas finais transmitidas por streaming
  depois que o fluxo de texto é concluído; a mídia gerada passa pela mesma
  normalização de mídia do canal usada pelos anexos de resposta normais.

Se a resposta exceder `maxLength`, o OpenClaw nunca ignora o áudio por completo:

- **Resumo ativado** (padrão) e um modelo de resumo está disponível: resume o
  texto para aproximadamente `maxLength` caracteres e, em seguida, sintetiza o resumo.
- **Resumo desativado**, a geração do resumo falha ou nenhuma chave de API está disponível para o
  modelo de resumo: trunca o texto para `maxLength` caracteres e sintetiza o
  texto truncado.

```text
Resposta -> TTS habilitado?
  não -> enviar texto
  sim -> contém mídia / é curta?
          sim -> enviar texto
          não -> tamanho > limite?
                   não -> TTS -> anexar áudio
                   sim -> resumo habilitado e disponível?
                            não -> truncar -> TTS -> anexar áudio
                            sim -> resumir -> TTS -> anexar áudio
```

## Referência de campos

<AccordionGroup>
  <Accordion title="messages.tts.* de nível superior">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Modo de TTS automático. `inbound` envia áudio somente após uma mensagem de voz recebida; `tagged` envia áudio somente quando a resposta inclui diretivas `[[tts:...]]` ou um bloco `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Alternância legada. `openclaw doctor --fix` migra isso para `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` inclui respostas de ferramentas/blocos além das respostas finais.
    </ParamField>
    <ParamField path="provider" type="string">
      ID do provedor de fala. Quando não definido, o OpenClaw usa o primeiro provedor configurado na ordem de seleção automática do registro. O `provider: "edge"` legado é reescrito como `"microsoft"` por `openclaw doctor --fix`.
    </ParamField>
    <ParamField path="persona" type="string">
      ID da persona ativa de `personas`. Normalizado para letras minúsculas.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Identidade falada estável. Campos: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Consulte [Personas](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Modelo econômico para resumo automático; o padrão é `agents.defaults.model.primary`. Aceita `provider/model` ou um alias de modelo configurado.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Permite que o modelo emita diretivas de TTS. `enabled` usa `true` por padrão; `allowProvider` usa `false` por padrão.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Configurações controladas pelo provedor e identificadas pelo ID do provedor de fala. Blocos diretos legados (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) são reescritos por `openclaw doctor --fix`; confirme somente `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number" default="4096">
      Limite rígido de caracteres de entrada para TTS. `/tts audio`, `tts.convert` e `tts.speak` falham se ele for excedido.
    </ParamField>
    <ParamField path="timeoutMs" type="number" default="30000">
      Tempo limite da solicitação em milissegundos. Um `timeoutMs` por chamada (ferramenta do agente, Gateway) prevalece quando definido; caso contrário, um `messages.tts.timeoutMs` configurado explicitamente prevalece sobre qualquer padrão do provedor definido pelo plugin.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Substitui o caminho JSON local das preferências (provedor/limite/resumo). Padrão: `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Ambiente: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` ou `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Região do Azure Speech (por exemplo, `eastus`). Ambiente: `AZURE_SPEECH_REGION` ou `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Substituição opcional do endpoint do Azure Speech (alias `baseUrl`).</ParamField>
    <ParamField path="speakerVoice" type="string">ShortName da voz do Azure. Padrão: `en-US-JennyNeural`. Alias legado: `voice`.</ParamField>
    <ParamField path="lang" type="string">Código de idioma SSML. Padrão: `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">`X-Microsoft-OutputFormat` do Azure para áudio padrão. Padrão: `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">`X-Microsoft-OutputFormat` do Azure para saída de nota de voz. Padrão: `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Usa `ELEVENLABS_API_KEY` ou `XI_API_KEY` como fallback.</ParamField>
    <ParamField path="model" type="string">ID do modelo. Padrão: `eleven_multilingual_v2`. Os IDs legados `eleven_turbo_v2_5`/`eleven_turbo_v2` são normalizados para o modelo `flash` correspondente.</ParamField>
    <ParamField path="speakerVoiceId" type="string">ID da voz da ElevenLabs. Padrão: `pMsXgVXv3BLzUgSXRplE`. Alias legado: `voiceId`.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (cada um `0..1`, padrões `0.5`/`0.75`/`0`), `useSpeakerBoost` (`true|false`, padrão `true`), `speed` (`0.5..2.0`, padrão `1.0`).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Modo de normalização de texto.</ParamField>
    <ParamField path="languageCode" type="string">ISO 639-1 de 2 letras (por exemplo, `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Inteiro `0..4294967295` para determinismo de melhor esforço.</ParamField>
    <ParamField path="baseUrl" type="string">Substitui a URL-base da API da ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Usa `GEMINI_API_KEY` / `GOOGLE_API_KEY` como fallback. Se omitida, o TTS pode reutilizar `models.providers.google.apiKey` antes do fallback para o ambiente.</ParamField>
    <ParamField path="model" type="string">Modelo de TTS do Gemini. Padrão: `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="speakerVoice" type="string">Nome da voz predefinida do Gemini. Padrão: `Kore`. Aliases legados: `voiceName`, `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Prompt de estilo em linguagem natural adicionado antes do texto falado.</ParamField>
    <ParamField path="speakerName" type="string">Rótulo opcional do locutor adicionado antes do texto falado quando o prompt usa um locutor nomeado.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Defina como `audio-profile-v1` para encapsular os campos de prompt da persona ativa em uma estrutura determinística de prompt de TTS do Gemini.</ParamField>
    <ParamField path="personaPrompt" type="string">Texto de prompt adicional da persona específico do Google, anexado às Notas do Diretor do modelo.</ParamField>
    <ParamField path="baseUrl" type="string">Somente `https://generativelanguage.googleapis.com` é aceita.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Ambiente: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">URL HTTPS da API da Gradium em `api.gradium.ai`. Padrão: `https://api.gradium.ai`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Padrão Emma (`YTpq7expH9539ERJ`). Alias legado: `voiceId`.</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Provedor principal do Inworld

    <ParamField path="apiKey" type="string">Var. de ambiente: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Padrão: `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Padrão: `inworld-tts-1.5-max`. Também: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Padrão: `Sarah`. Alias legado: `voiceId`.</ParamField>
    <ParamField path="temperature" type="number">Temperatura de amostragem `0..2` (0 não incluso).</ParamField>

  </Accordion>

  <Accordion title="CLI local (tts-local-cli)">
    <ParamField path="command" type="string">Executável local ou string de comando para TTS via CLI.</ParamField>
    <ParamField path="args" type="string[]">Argumentos do comando. Compatível com os espaços reservados `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Formato de saída esperado da CLI. O padrão é `mp3` para anexos de áudio.</ParamField>
    <ParamField path="timeoutMs" type="number">Tempo limite do comando em milissegundos. Padrão: `120000`.</ParamField>
    <ParamField path="cwd" type="string">Diretório de trabalho opcional do comando.</ParamField>
    <ParamField path="env" type="Record<string, string>">Substituições opcionais de variáveis de ambiente para o comando.</ParamField>

    A saída padrão do comando e o áudio gerado ou convertido são limitados a 50 MiB. A saída de erro de diagnóstico é limitada a 1 MiB. O OpenClaw encerra o comando e interrompe a síntese com falha quando qualquer um dos limites é excedido.

  </Accordion>

  <Accordion title="Microsoft (sem chave de API)">
    <ParamField path="enabled" type="boolean" default="true">Permite o uso da síntese de fala da Microsoft.</ParamField>
    <ParamField path="speakerVoice" type="string">Nome da voz neural da Microsoft (por exemplo, `en-US-MichelleNeural`). Alias legado: `voice`. Se a voz padrão em inglês estiver em uso e o texto da resposta for predominantemente CJK, o OpenClaw alternará automaticamente para `zh-CN-XiaoxiaoNeural`.</ParamField>
    <ParamField path="lang" type="string">Código do idioma (por exemplo, `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Formato de saída da Microsoft. Padrão: `audio-24khz-48kbitrate-mono-mp3`. Nem todos os formatos são compatíveis com o transporte integrado baseado no Edge.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Strings de porcentagem (por exemplo, `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Grava legendas JSON junto ao arquivo de áudio.</ParamField>
    <ParamField path="proxy" type="string">URL do proxy para solicitações de síntese de fala da Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">Substituição do tempo limite da solicitação (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Alias legado. Execute `openclaw doctor --fix` para regravar a configuração persistida como `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Como alternativa, usa `MINIMAX_API_KEY`. Autenticação do Token Plan por meio de `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` ou `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Padrão: `https://api.minimax.io`. Var. de ambiente: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Padrão: `speech-2.8-hd`. Var. de ambiente: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Padrão: `English_expressive_narrator`. Var. de ambiente: `MINIMAX_TTS_VOICE_ID`. Alias legado: `voiceId`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Padrão: `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Padrão: `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Inteiro `-12..12`. Padrão: `0`. Valores fracionários são truncados antes da solicitação.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Como alternativa, usa `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">ID do modelo TTS da OpenAI. Padrão: `gpt-4o-mini-tts`.</ParamField>
    <ParamField path="speakerVoice" type="string">Nome da voz (por exemplo, `alloy`, `cedar`). Padrão: `coral`. Alias legado: `voice`.</ParamField>
    <ParamField path="instructions" type="string">Campo `instructions` explícito da OpenAI. Quando definido, os campos de prompt da persona **não** são mapeados automaticamente.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">Campos JSON adicionais mesclados aos corpos das solicitações de `/audio/speech` após os campos TTS gerados da OpenAI. Use isto para endpoints compatíveis com a OpenAI, como o Kokoro, que exigem chaves específicas do provedor, como `lang`; chaves de protótipo inseguras são ignoradas.</ParamField>
    <ParamField path="baseUrl" type="string">
      Substitui o endpoint TTS da OpenAI. Ordem de resolução: configuração → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Valores diferentes do padrão são tratados como endpoints TTS compatíveis com a OpenAI; portanto, nomes personalizados de modelo e voz são aceitos, e `speed` deixa de ter a validação do intervalo `0.25..4.0`.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Var. de ambiente: `OPENROUTER_API_KEY`. Pode reutilizar `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">Padrão: `https://openrouter.ai/api/v1`. O valor legado `https://openrouter.ai/v1` é normalizado.</ParamField>
    <ParamField path="model" type="string">Padrão: `hexgrad/kokoro-82m`. Alias: `modelId`.</ParamField>
    <ParamField path="speakerVoice" type="string">Padrão: `af_alloy`. Aliases legados: `voice`, `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Padrão: `mp3`.</ParamField>
    <ParamField path="speed" type="number">Substituição da velocidade nativa do provedor.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Var. de ambiente: `VOLCENGINE_TTS_API_KEY` ou `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Padrão: `seed-tts-1.0`. Var. de ambiente: `VOLCENGINE_TTS_RESOURCE_ID`. Use `seed-tts-2.0` quando seu projeto tiver direito de acesso ao TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">Cabeçalho da chave do aplicativo. Padrão: `aGjiRDfUWi`. Var. de ambiente: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Substitui o endpoint HTTP do TTS Seed Speech. Var. de ambiente: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="speakerVoice" type="string">Tipo de voz. Padrão: `en_female_anna_mars_bigtts`. Var. de ambiente: `VOLCENGINE_TTS_VOICE`. Alias legado: `voice`.</ParamField>
    <ParamField path="speedRatio" type="number">Proporção de velocidade nativa do provedor, `0.2..3`.</ParamField>
    <ParamField path="emotion" type="string">Tag de emoção nativa do provedor.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Campos legados do Volcengine Speech Console. Var. de ambiente: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (padrão: `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Var. de ambiente: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Padrão: `https://api.x.ai/v1`. Var. de ambiente: `XAI_BASE_URL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Padrão: `eve`. Com autenticação, `openclaw infer tts voices --provider xai` obtém o catálogo integrado atual; sem autenticação, lista as opções alternativas offline `ara`, `eve`, `leo`, `rex` e `sal`. IDs de voz personalizados da conta são encaminhados mesmo quando não estão presentes na lista integrada. Alias legado: `voiceId`.</ParamField>
    <ParamField path="language" type="string">Código de idioma BCP-47 ou `auto`. Padrão: `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Padrão: `mp3`.</ParamField>
    <ParamField path="speed" type="number">Substituição da velocidade nativa do provedor, `0.7..1.5`.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Var. de ambiente: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Padrão: `https://api.xiaomimimo.com/v1`. Var. de ambiente: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Padrão: `mimo-v2.5-tts`. Var. de ambiente: `XIAOMI_TTS_MODEL`. Também é compatível com `mimo-v2-tts` e `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="speakerVoice" type="string">Padrão: `mimo_default` para modelos com voz predefinida. Var. de ambiente: `XIAOMI_TTS_VOICE`. Alias legado: `voice`. Não é enviado para `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Padrão: `mp3`. Var. de ambiente: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Instrução opcional de estilo em linguagem natural enviada como mensagem do usuário; não é falada. Para `mimo-v2.5-tts-voicedesign`, este é o prompt de criação da voz; o OpenClaw fornece um valor padrão quando omitido.</ParamField>
  </Accordion>
</AccordionGroup>

## Ferramenta do agente

A ferramenta `tts` converte texto em fala e retorna um anexo de áudio para
entrega da resposta. No Feishu, Matrix, Telegram e WhatsApp, o áudio é
entregue como mensagem de voz em vez de anexo de arquivo. O Feishu e o
WhatsApp podem transcodificar saídas TTS que não sejam Opus nesse fluxo quando
`ffmpeg` estiver disponível.

O WhatsApp envia áudio por meio do Baileys como uma mensagem de voz PTT (`audio` com
`ptt: true`) e envia o texto visível **separadamente** do áudio PTT porque
os clientes não renderizam legendas de forma consistente em mensagens de voz.

A ferramenta aceita os campos opcionais `channel` e `timeoutMs`; `timeoutMs` é um
tempo limite por chamada para a solicitação ao provedor, em milissegundos. Os valores por chamada substituem
`messages.tts.timeoutMs`; os tempos limites configurados para TTS substituem qualquer valor padrão
do provedor definido por um plugin.

## RPC do Gateway

| Método            | Finalidade                                              |
| ----------------- | ------------------------------------------------------- |
| `tts.status`      | Lê o estado atual do TTS e a última tentativa.          |
| `tts.enable`      | Define a preferência automática local como `always`.    |
| `tts.disable`     | Define a preferência automática local como `off`.       |
| `tts.convert`     | Conversão avulsa de texto → áudio.                      |
| `tts.setProvider` | Define a preferência local de provedor.                 |
| `tts.personas`    | Lista as personas configuradas e a persona ativa.       |
| `tts.setPersona`  | Define a preferência local de persona.                  |
| `tts.providers`   | Lista os provedores configurados e seus estados.        |

## Links dos serviços

- [Guia de conversão de texto em fala da OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [Referência da API de áudio da OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [Conversão de texto em fala pela API REST do Azure Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Provedor Azure Speech](/pt-BR/providers/azure-speech)
- [Conversão de texto em fala do ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Autenticação do ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/pt-BR/providers/gradium)
- [API TTS da Inworld](https://docs.inworld.ai/tts/tts)
- [API T2A v2 da MiniMax](https://platform.minimaxi.com/document/T2A%20V2)
- [API HTTP de TTS da Volcengine](/pt-BR/providers/volcengine#text-to-speech)
- [Síntese de fala do Xiaomi MiMo](/pt-BR/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formatos de saída do Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [Conversão de texto em fala da xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Relacionados

- [Visão geral de mídia](/pt-BR/tools/media-overview)
- [Geração de música](/pt-BR/tools/music-generation)
- [Geração de vídeo](/pt-BR/tools/video-generation)
- [Comandos de barra](/pt-BR/tools/slash-commands)
- [Plugin de chamada de voz](/pt-BR/plugins/voice-call)

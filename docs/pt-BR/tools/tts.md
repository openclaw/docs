---
read_when:
    - Habilitando texto para fala para respostas
    - Configurando provedores de TTS ou limites
    - Usando comandos `/tts`
summary: Texto para fala (TTS) para respostas de saída
title: Texto para fala
x-i18n:
    generated_at: "2026-04-24T06:19:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 935fec2325a08da6f4ecd8ba5a9b889cd265025c5c7ee43bc4e0da36c1003d8f
    source_path: tools/tts.md
    workflow: 15
---

O OpenClaw pode converter respostas de saída em áudio usando ElevenLabs, Google Gemini, Microsoft, MiniMax, OpenAI ou xAI.
Isso funciona em qualquer lugar onde o OpenClaw possa enviar áudio.

## Serviços compatíveis

- **ElevenLabs** (provedor principal ou fallback)
- **Google Gemini** (provedor principal ou fallback; usa Gemini API TTS)
- **Microsoft** (provedor principal ou fallback; a implementação empacotada atual usa `node-edge-tts`)
- **MiniMax** (provedor principal ou fallback; usa a API T2A v2)
- **OpenAI** (provedor principal ou fallback; também usado para resumos)
- **xAI** (provedor principal ou fallback; usa a API xAI TTS)

### Observações sobre fala da Microsoft

O provedor de fala Microsoft empacotado atualmente usa o serviço online
de TTS neural do Microsoft Edge por meio da biblioteca `node-edge-tts`. É um serviço hospedado (não
local), usa endpoints da Microsoft e não exige chave de API.
`node-edge-tts` expõe opções de configuração de fala e formatos de saída, mas
nem todas as opções são compatíveis com o serviço. Configuração legada e entrada de diretiva
usando `edge` ainda funcionam e são normalizadas para `microsoft`.

Como esse caminho é um serviço web público sem SLA ou cota publicados,
trate-o como best-effort. Se você precisar de limites garantidos e suporte, use OpenAI
ou ElevenLabs.

## Chaves opcionais

Se você quiser OpenAI, ElevenLabs, Google Gemini, MiniMax ou xAI:

- `ELEVENLABS_API_KEY` (ou `XI_API_KEY`)
- `GEMINI_API_KEY` (ou `GOOGLE_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`
- `XAI_API_KEY`

A fala da Microsoft **não** exige chave de API.

Se vários provedores estiverem configurados, o provedor selecionado será usado primeiro e os outros serão opções de fallback.
O auto-summary usa o `summaryModel` configurado (ou `agents.defaults.model.primary`),
então esse provedor também deve estar autenticado se você habilitar resumos.

## Links dos serviços

- [Guia de Text-to-Speech da OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [Referência da API Audio da OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Autenticação da ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formatos de saída de fala da Microsoft](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Isso vem habilitado por padrão?

Não. O auto‑TTS vem **desligado** por padrão. Habilite-o na configuração com
`messages.tts.auto` ou localmente com `/tts on`.

Quando `messages.tts.provider` não estiver definido, o OpenClaw escolhe o primeiro
provedor de fala configurado na ordem de seleção automática do registro.

## Configuração

A configuração de TTS fica em `messages.tts` em `openclaw.json`.
O schema completo está em [Gateway configuration](/pt-BR/gateway/configuration).

### Configuração mínima (habilitar + provedor)

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

### OpenAI principal com fallback para ElevenLabs

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      providers: {
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
      },
    },
  },
}
```

### Microsoft principal (sem chave de API)

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
          rate: "+10%",
          pitch: "-5%",
        },
      },
    },
  },
}
```

### MiniMax principal

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "minimax_api_key",
          baseUrl: "https://api.minimax.io",
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

### Google Gemini principal

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "gemini_api_key",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

O TTS do Google Gemini usa o caminho de chave de API do Gemini. Uma chave de API do Google Cloud Console
restrita à API Gemini é válida aqui, e é o mesmo tipo de chave usado
pelo provedor empacotado de geração de imagem do Google. A ordem de resolução é
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY`.

### xAI principal

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "xai_api_key",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
          speed: 1.0,
        },
      },
    },
  },
}
```

O TTS do xAI usa o mesmo caminho `XAI_API_KEY` do provedor de modelo Grok empacotado.
A ordem de resolução é `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`.
As vozes atuais em produção são `ara`, `eve`, `leo`, `rex`, `sal` e `una`; `eve` é
o padrão. `language` aceita uma tag BCP-47 ou `auto`.

### Desabilitar a fala da Microsoft

```json5
{
  messages: {
    tts: {
      providers: {
        microsoft: {
          enabled: false,
        },
      },
    },
  },
}
```

### Limites personalizados + caminho de prefs

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
    },
  },
}
```

### Responder com áudio apenas após uma mensagem de voz recebida

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### Desabilitar auto-summary para respostas longas

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

Depois execute:

```
/tts summary off
```

### Observações sobre os campos

- `auto`: modo de auto‑TTS (`off`, `always`, `inbound`, `tagged`).
  - `inbound` envia áudio apenas após uma mensagem de voz recebida.
  - `tagged` envia áudio apenas quando a resposta inclui diretivas `[[tts:key=value]]` ou um bloco `[[tts:text]]...[[/tts:text]]`.
- `enabled`: alternância legada (doctor migra isso para `auto`).
- `mode`: `"final"` (padrão) ou `"all"` (inclui respostas de ferramenta/bloco).
- `provider`: id do provedor de fala, como `"elevenlabs"`, `"google"`, `"microsoft"`, `"minimax"` ou `"openai"` (fallback é automático).
- Se `provider` **não** estiver definido, o OpenClaw usa o primeiro provedor de fala configurado na ordem de seleção automática do registro.
- O legado `provider: "edge"` ainda funciona e é normalizado para `microsoft`.
- `summaryModel`: modelo barato opcional para auto-summary; o padrão é `agents.defaults.model.primary`.
  - Aceita `provider/model` ou um alias de modelo configurado.
- `modelOverrides`: permite que o modelo emita diretivas de TTS (ligado por padrão).
  - `allowProvider` usa por padrão `false` (troca de provedor é opt-in).
- `providers.<id>`: configurações de propriedade do provedor, indexadas pelo id do provedor de fala.
- Blocos legados diretos de provedor (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) são migrados automaticamente para `messages.tts.providers.<id>` no carregamento.
- `maxTextLength`: limite rígido para entrada de TTS (caracteres). `/tts audio` falha se excedido.
- `timeoutMs`: timeout da request (ms).
- `prefsPath`: sobrescreve o caminho local do JSON de prefs (provedor/limite/resumo).
- Valores `apiKey` usam fallback para variáveis de ambiente (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl`: sobrescreve a URL base da API ElevenLabs.
- `providers.openai.baseUrl`: sobrescreve o endpoint de TTS da OpenAI.
  - Ordem de resolução: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Valores diferentes do padrão são tratados como endpoints de TTS compatíveis com OpenAI, então nomes personalizados de modelo e voz são aceitos.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = normal)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: ISO 639-1 de 2 letras (por exemplo `en`, `de`)
- `providers.elevenlabs.seed`: inteiro `0..4294967295` (determinismo best-effort)
- `providers.minimax.baseUrl`: sobrescreve a URL base da API MiniMax (padrão `https://api.minimax.io`, env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: modelo TTS (padrão `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: identificador de voz (padrão `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: velocidade de reprodução `0.5..2.0` (padrão 1.0).
- `providers.minimax.vol`: volume `(0, 10]` (padrão 1.0; deve ser maior que 0).
- `providers.minimax.pitch`: deslocamento de pitch `-12..12` (padrão 0).
- `providers.google.model`: modelo Gemini TTS (padrão `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: nome de voz predefinida do Gemini (padrão `Kore`; `voice` também é aceito).
- `providers.google.baseUrl`: sobrescreve a URL base da API Gemini. Apenas `https://generativelanguage.googleapis.com` é aceito.
  - Se `messages.tts.providers.google.apiKey` for omitido, o TTS pode reutilizar `models.providers.google.apiKey` antes do fallback para env.
- `providers.xai.apiKey`: chave de API TTS do xAI (env: `XAI_API_KEY`).
- `providers.xai.baseUrl`: sobrescreve a URL base de TTS do xAI (padrão `https://api.x.ai/v1`, env: `XAI_BASE_URL`).
- `providers.xai.voiceId`: id de voz do xAI (padrão `eve`; vozes atuais em produção: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: código de idioma BCP-47 ou `auto` (padrão `en`).
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw` ou `alaw` (padrão `mp3`).
- `providers.xai.speed`: sobrescrita de velocidade nativa do provedor.
- `providers.microsoft.enabled`: permite uso da fala da Microsoft (padrão `true`; sem chave de API).
- `providers.microsoft.voice`: nome de voz neural da Microsoft (por exemplo `en-US-MichelleNeural`).
- `providers.microsoft.lang`: código de idioma (por exemplo `en-US`).
- `providers.microsoft.outputFormat`: formato de saída da Microsoft (por exemplo `audio-24khz-48kbitrate-mono-mp3`).
  - Consulte os formatos de saída de fala da Microsoft para valores válidos; nem todos os formatos são compatíveis com o transporte empacotado baseado em Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: strings percentuais (por exemplo `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: grava legendas JSON ao lado do arquivo de áudio.
- `providers.microsoft.proxy`: URL de proxy para requests de fala da Microsoft.
- `providers.microsoft.timeoutMs`: sobrescrita de timeout de request (ms).
- `edge.*`: alias legado para as mesmas configurações da Microsoft.

## Sobrescritas orientadas por modelo (ligado por padrão)

Por padrão, o modelo **pode** emitir diretivas de TTS para uma única resposta.
Quando `messages.tts.auto` é `tagged`, essas diretivas são necessárias para acionar o áudio.

Quando habilitado, o modelo pode emitir diretivas `[[tts:...]]` para sobrescrever a voz
em uma única resposta, além de um bloco opcional `[[tts:text]]...[[/tts:text]]` para
fornecer tags expressivas (risadas, indicações de canto etc.) que devem aparecer apenas
no áudio.

Diretivas `provider=...` são ignoradas a menos que `modelOverrides.allowProvider: true`.

Exemplo de payload de resposta:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Chaves de diretiva disponíveis (quando habilitadas):

- `provider` (id de provedor de fala registrado, por exemplo `openai`, `elevenlabs`, `google`, `minimax` ou `microsoft`; exige `allowProvider: true`)
- `voice` (voz da OpenAI), `voiceName` / `voice_name` / `google_voice` (voz do Google) ou `voiceId` (ElevenLabs / MiniMax / xAI)
- `model` (modelo TTS da OpenAI, id de modelo da ElevenLabs ou modelo da MiniMax) ou `google_model` (modelo TTS do Google)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume da MiniMax, 0-10)
- `pitch` (pitch da MiniMax, -12 a 12)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Desabilite todas as sobrescritas de modelo:

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false,
      },
    },
  },
}
```

Allowlist opcional (habilita troca de provedor enquanto mantém outros controles configuráveis):

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: true,
        allowSeed: false,
      },
    },
  },
}
```

## Preferências por usuário

Comandos slash gravam sobrescritas locais em `prefsPath` (padrão:
`~/.openclaw/settings/tts.json`, sobrescreva com `OPENCLAW_TTS_PREFS` ou
`messages.tts.prefsPath`).

Campos armazenados:

- `enabled`
- `provider`
- `maxLength` (limite para resumo; padrão 1500 caracteres)
- `summarize` (padrão `true`)

Eles sobrescrevem `messages.tts.*` para esse host.

## Formatos de saída (fixos)

- **Feishu / Matrix / Telegram / WhatsApp**: mensagem de voz Opus (`opus_48000_64` da ElevenLabs, `opus` da OpenAI).
  - 48kHz / 64kbps é um bom equilíbrio para mensagem de voz.
- **Outros canais**: MP3 (`mp3_44100_128` da ElevenLabs, `mp3` da OpenAI).
  - 44.1kHz / 128kbps é o equilíbrio padrão para clareza de fala.
- **MiniMax**: MP3 (modelo `speech-2.8-hd`, taxa de amostragem de 32kHz). O formato de voice note não é compatível nativamente; use OpenAI ou ElevenLabs para mensagens de voz Opus garantidas.
- **Google Gemini**: o TTS da API Gemini retorna PCM bruto a 24kHz. O OpenClaw o encapsula como WAV para anexos de áudio e retorna PCM diretamente para Talk/telephony. O formato nativo de voice note Opus não é compatível com esse caminho.
- **xAI**: MP3 por padrão; `responseFormat` pode ser `mp3`, `wav`, `pcm`, `mulaw` ou `alaw`. O OpenClaw usa o endpoint REST em lote de TTS do xAI e retorna um anexo de áudio completo; o WebSocket de streaming TTS do xAI não é usado por esse caminho de provedor. O formato nativo de voice note Opus não é compatível com esse caminho.
- **Microsoft**: usa `microsoft.outputFormat` (padrão `audio-24khz-48kbitrate-mono-mp3`).
  - O transporte empacotado aceita um `outputFormat`, mas nem todos os formatos estão disponíveis no serviço.
  - Os valores de formato de saída seguem os formatos de saída de fala da Microsoft (incluindo Ogg/WebM Opus).
  - O `sendVoice` do Telegram aceita OGG/MP3/M4A; use OpenAI/ElevenLabs se precisar de
    mensagens de voz Opus garantidas.
  - Se o formato de saída Microsoft configurado falhar, o OpenClaw faz nova tentativa com MP3.

Os formatos de saída OpenAI/ElevenLabs são fixos por canal (veja acima).

## Comportamento do auto-TTS

Quando habilitado, o OpenClaw:

- ignora TTS se a resposta já contiver mídia ou uma diretiva `MEDIA:`.
- ignora respostas muito curtas (< 10 caracteres).
- resume respostas longas quando habilitado usando `agents.defaults.model.primary` (ou `summaryModel`).
- anexa o áudio gerado à resposta.

Se a resposta exceder `maxLength` e o resumo estiver desligado (ou não houver chave de API para o
modelo de resumo), o áudio
será ignorado e a resposta normal em texto será enviada.

## Diagrama de fluxo

```
Resposta -> TTS habilitado?
  não -> enviar texto
  sim -> tem mídia / MEDIA: / curta?
          sim -> enviar texto
          não -> tamanho > limite?
                   não -> TTS -> anexar áudio
                   sim -> resumo habilitado?
                            não -> enviar texto
                            sim -> resumir (summaryModel ou agents.defaults.model.primary)
                                      -> TTS -> anexar áudio
```

## Uso de comando slash

Há um único comando: `/tts`.
Consulte [Slash commands](/pt-BR/tools/slash-commands) para detalhes de habilitação.

Observação para Discord: `/tts` é um comando integrado do Discord, então o OpenClaw registra
`/voice` como comando nativo lá. Texto `/tts ...` ainda funciona.

```
/tts off
/tts on
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

Observações:

- Os comandos exigem um remetente autorizado (regras de allowlist/owner ainda se aplicam).
- `commands.text` ou o registro de comando nativo devem estar habilitados.
- A configuração `messages.tts.auto` aceita `off|always|inbound|tagged`.
- `/tts on` grava a preferência local de TTS como `always`; `/tts off` grava como `off`.
- Use configuração quando quiser padrões `inbound` ou `tagged`.
- `limit` e `summary` são armazenados em prefs locais, não na configuração principal.
- `/tts audio` gera uma resposta de áudio única (não ativa o TTS).
- `/tts status` inclui visibilidade de fallback para a tentativa mais recente:
  - fallback com sucesso: `Fallback: <primary> -> <used>` mais `Attempts: ...`
  - falha: `Error: ...` mais `Attempts: ...`
  - diagnósticos detalhados: `Attempt details: provider:outcome(reasonCode) latency`
- Falhas de API da OpenAI e ElevenLabs agora incluem detalhes de erro do provedor analisados e request id (quando retornado pelo provedor), que são exibidos em erros/logs de TTS.

## Ferramenta do agente

A ferramenta `tts` converte texto em fala e retorna um anexo de áudio para
entrega de resposta. Quando o canal é Feishu, Matrix, Telegram ou WhatsApp,
o áudio é entregue como mensagem de voz em vez de anexo de arquivo.
Ela aceita campos opcionais `channel` e `timeoutMs`; `timeoutMs` é um
timeout por chamada da request do provedor em milissegundos.

## RPC do Gateway

Métodos do Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

## Relacionados

- [Media overview](/pt-BR/tools/media-overview)
- [Music generation](/pt-BR/tools/music-generation)
- [Video generation](/pt-BR/tools/video-generation)

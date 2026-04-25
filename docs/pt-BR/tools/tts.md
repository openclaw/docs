---
read_when:
    - Habilitar text-to-speech para respostas
    - Configurar providers ou limites de TTS
    - Usar comandos /tts
summary: Text-to-speech (TTS) para respostas de saída
title: Text-to-speech
x-i18n:
    generated_at: "2026-04-25T13:58:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0038157f631a308c8ff7f0eef9db2b2d686cd417c525ac37b9d21097c34d9b6a
    source_path: tools/tts.md
    workflow: 15
---

O OpenClaw pode converter respostas de saída em áudio usando ElevenLabs, Google Gemini, Gradium, CLI local, Microsoft, MiniMax, OpenAI, Vydra, xAI ou Xiaomi MiMo.
Isso funciona em qualquer lugar onde o OpenClaw possa enviar áudio.

## Serviços compatíveis

- **ElevenLabs** (provider principal ou de fallback)
- **Google Gemini** (provider principal ou de fallback; usa a API TTS do Gemini)
- **Gradium** (provider principal ou de fallback; oferece suporte a saída de mensagem de voz e telefonia)
- **CLI local** (provider principal ou de fallback; executa um comando TTS local configurado)
- **Microsoft** (provider principal ou de fallback; a implementação incluída atual usa `node-edge-tts`)
- **MiniMax** (provider principal ou de fallback; usa a API T2A v2)
- **OpenAI** (provider principal ou de fallback; também usado para resumos)
- **Vydra** (provider principal ou de fallback; provider compartilhado de imagem, vídeo e fala)
- **xAI** (provider principal ou de fallback; usa a API TTS da xAI)
- **Xiaomi MiMo** (provider principal ou de fallback; usa TTS do MiMo por meio de chat completions da Xiaomi)

### Observações sobre fala da Microsoft

Atualmente, o provider de fala da Microsoft incluído usa o serviço online
de TTS neural do Microsoft Edge por meio da biblioteca `node-edge-tts`. É um serviço hospedado (não
local), usa endpoints da Microsoft e não exige uma chave de API.
`node-edge-tts` expõe opções de configuração de fala e formatos de saída, mas
nem todas as opções são compatíveis com o serviço. Configuração legada e entrada de diretiva
usando `edge` continuam funcionando e são normalizadas para `microsoft`.

Como esse caminho usa um serviço web público sem SLA ou cota publicados,
trate-o como best-effort. Se você precisar de limites garantidos e suporte, use OpenAI
ou ElevenLabs.

## Chaves opcionais

Se você quiser usar OpenAI, ElevenLabs, Google Gemini, Gradium, MiniMax, Vydra, xAI ou Xiaomi MiMo:

- `ELEVENLABS_API_KEY` (ou `XI_API_KEY`)
- `GEMINI_API_KEY` (ou `GOOGLE_API_KEY`)
- `GRADIUM_API_KEY`
- `MINIMAX_API_KEY`; o MiniMax TTS também aceita autenticação Token Plan via
  `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` ou
  `MINIMAX_CODING_API_KEY`
- `OPENAI_API_KEY`
- `VYDRA_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`

CLI local e fala da Microsoft **não** exigem chave de API.

Se vários providers estiverem configurados, o provider selecionado será usado primeiro, e os demais serão opções de fallback.
O resumo automático usa o `summaryModel` configurado (ou `agents.defaults.model.primary`),
então esse provider também precisa estar autenticado se você habilitar resumos.

## Links dos serviços

- [Guia de Text-to-Speech da OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [Referência da API de áudio da OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [Text to Speech da ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Autenticação da ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/pt-BR/providers/gradium)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [Síntese de fala do Xiaomi MiMo](/pt-BR/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formatos de saída do Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [Text to Speech da xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Isso é habilitado por padrão?

Não. O TTS automático vem **desativado** por padrão. Habilite-o na configuração com
`messages.tts.auto` ou localmente com `/tts on`.

Quando `messages.tts.provider` não está definido, o OpenClaw escolhe o primeiro
provider de fala configurado na ordem de seleção automática do registro.

## Configuração

A configuração de TTS fica em `messages.tts` em `openclaw.json`.
O esquema completo está em [Configuração do Gateway](/pt-BR/gateway/configuration).

### Configuração mínima (habilitar + provider)

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

### OpenAI principal com fallback de ElevenLabs

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

A resolução de autenticação do MiniMax TTS é `messages.tts.providers.minimax.apiKey`, depois
perfis OAuth/token armazenados de `minimax-portal`, depois chaves de ambiente do Token Plan
(`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
`MINIMAX_CODING_API_KEY`) e, por fim, `MINIMAX_API_KEY`. Quando nenhum `baseUrl`
explícito de TTS está definido, o OpenClaw pode reutilizar o host OAuth
configurado de `minimax-portal` para fala do Token Plan.

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

O Google Gemini TTS usa o caminho de chave de API do Gemini. Uma chave de API do Google Cloud Console
restrita à API Gemini é válida aqui, e é o mesmo tipo de chave usado
pelo provider incluído de geração de imagem do Google. A ordem de resolução é
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

O xAI TTS usa o mesmo caminho `XAI_API_KEY` que o provider de modelo Grok incluído.
A ordem de resolução é `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`.
As vozes live atuais são `ara`, `eve`, `leo`, `rex`, `sal` e `una`; `eve` é
o padrão. `language` aceita uma tag BCP-47 ou `auto`.

### Xiaomi MiMo principal

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          baseUrl: "https://api.xiaomimimo.com/v1",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

O Xiaomi MiMo TTS usa o mesmo caminho `XIAOMI_API_KEY` que o provider de modelo Xiaomi incluído.
O id do provider de fala é `xiaomi`; `mimo` é aceito como alias.
O texto de destino é enviado como mensagem do assistant, correspondendo ao contrato de TTS da Xiaomi.
O `style` opcional é enviado como instrução do usuário e não é falado.

### OpenRouter principal

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "openrouter_api_key",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

O OpenRouter TTS usa o mesmo caminho `OPENROUTER_API_KEY` que o provider de modelo
OpenRouter incluído. A ordem de resolução é
`messages.tts.providers.openrouter.apiKey` ->
`models.providers.openrouter.apiKey` -> `OPENROUTER_API_KEY`.

### CLI local principal

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

O TTS por CLI local executa o comando configurado no host do gateway. Os placeholders
`{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}` e `{{OutputBase}}` são
expandidos em `args`; se não houver placeholder `{{Text}}`, o OpenClaw escreve o
texto falado em stdin. `outputFormat` aceita `mp3`, `opus` ou `wav`.
Destinos de mensagem de voz são transcodificados para Ogg/Opus, e a saída de telefonia é
transcodificada para PCM mono bruto de 16 kHz com `ffmpeg`. O alias legado do provider
`cli` ainda funciona, mas novas configurações devem usar `tts-local-cli`.

### Gradium principal

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "gradium_api_key",
          baseUrl: "https://api.gradium.ai",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```

### Desabilitar fala da Microsoft

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

### Limites personalizados + caminho de preferências

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

### Responder apenas com áudio após uma mensagem de voz recebida

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### Desabilitar o resumo automático para respostas longas

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

Em seguida, execute:

```
/tts summary off
```

### Observações sobre os campos

- `auto`: modo de TTS automático (`off`, `always`, `inbound`, `tagged`).
  - `inbound` envia áudio somente após uma mensagem de voz recebida.
  - `tagged` envia áudio somente quando a resposta inclui diretivas `[[tts:key=value]]` ou um bloco `[[tts:text]]...[[/tts:text]]`.
- `enabled`: alternância legada (o doctor migra isso para `auto`).
- `mode`: `"final"` (padrão) ou `"all"` (inclui respostas de ferramenta/bloco).
- `provider`: id do provider de fala, como `"elevenlabs"`, `"google"`, `"gradium"`, `"microsoft"`, `"minimax"`, `"openai"`, `"vydra"`, `"xai"` ou `"xiaomi"` (o fallback é automático).
- Se `provider` **não estiver definido**, o OpenClaw usa o primeiro provider de fala configurado na ordem de seleção automática do registro.
- A configuração legada `provider: "edge"` é corrigida por `openclaw doctor --fix` e
  reescrita para `provider: "microsoft"`.
- `summaryModel`: modelo opcional barato para resumo automático; o padrão é `agents.defaults.model.primary`.
  - Aceita `provider/model` ou um alias de modelo configurado.
- `modelOverrides`: permite que o modelo emita diretivas de TTS (ativado por padrão).
  - `allowProvider` tem padrão `false` (troca de provider é opt-in).
- `providers.<id>`: configurações pertencentes ao provider, indexadas pelo id do provider de fala.
- Blocos legados de provider direto (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) são corrigidos por `openclaw doctor --fix`; a configuração persistida deve usar `messages.tts.providers.<id>`.
- O legado `messages.tts.providers.edge` também é corrigido por `openclaw doctor --fix`; a configuração persistida deve usar `messages.tts.providers.microsoft`.
- `maxTextLength`: limite rígido para entrada de TTS (caracteres). `/tts audio` falha se esse limite for excedido.
- `timeoutMs`: timeout da solicitação (ms).
- `prefsPath`: substitui o caminho local do JSON de preferências (provider/limite/resumo).
- Valores de `apiKey` usam fallback para variáveis de ambiente (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `GRADIUM_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`, `VYDRA_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`).
- `providers.elevenlabs.baseUrl`: substitui a URL base da API da ElevenLabs.
- `providers.openai.baseUrl`: substitui o endpoint de TTS da OpenAI.
  - Ordem de resolução: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Valores fora do padrão são tratados como endpoints de TTS compatíveis com OpenAI, então nomes personalizados de modelo e voz são aceitos.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = normal)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: ISO 639-1 de 2 letras (por exemplo `en`, `de`)
- `providers.elevenlabs.seed`: inteiro `0..4294967295` (determinismo best-effort)
- `providers.minimax.baseUrl`: substitui a URL base da API MiniMax (padrão `https://api.minimax.io`, env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: modelo de TTS (padrão `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: identificador de voz (padrão `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: velocidade de reprodução `0.5..2.0` (padrão 1.0).
- `providers.minimax.vol`: volume `(0, 10]` (padrão 1.0; deve ser maior que 0).
- `providers.minimax.pitch`: deslocamento inteiro de tom `-12..12` (padrão 0). Valores fracionários são truncados antes da chamada ao MiniMax T2A porque a API rejeita valores de tom não inteiros.
- `providers.tts-local-cli.command`: executável local ou string de comando para TTS por CLI.
- `providers.tts-local-cli.args`: argumentos do comando; oferece suporte aos placeholders `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}` e `{{OutputBase}}`.
- `providers.tts-local-cli.outputFormat`: formato de saída esperado da CLI (`mp3`, `opus` ou `wav`; padrão `mp3` para anexos de áudio).
- `providers.tts-local-cli.timeoutMs`: timeout do comando em milissegundos (padrão `120000`).
- `providers.tts-local-cli.cwd`: diretório de trabalho opcional do comando.
- `providers.tts-local-cli.env`: substituições opcionais de ambiente em string para o comando.
- `providers.google.model`: modelo de TTS do Gemini (padrão `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: nome de voz predefinido do Gemini (padrão `Kore`; `voice` também é aceito).
- `providers.google.audioProfile`: prompt de estilo em linguagem natural prefixado antes do texto falado.
- `providers.google.speakerName`: rótulo opcional de locutor prefixado antes do texto falado quando seu prompt de TTS usa um locutor nomeado.
- `providers.google.baseUrl`: substitui a URL base da API Gemini. Apenas `https://generativelanguage.googleapis.com` é aceito.
  - Se `messages.tts.providers.google.apiKey` for omitido, o TTS pode reutilizar `models.providers.google.apiKey` antes do fallback para env.
- `providers.gradium.baseUrl`: substitui a URL base da API Gradium (padrão `https://api.gradium.ai`).
- `providers.gradium.voiceId`: identificador de voz do Gradium (padrão Emma, `YTpq7expH9539ERJ`).
- `providers.xai.apiKey`: chave de API de TTS da xAI (env: `XAI_API_KEY`).
- `providers.xai.baseUrl`: substitui a URL base de TTS da xAI (padrão `https://api.x.ai/v1`, env: `XAI_BASE_URL`).
- `providers.xai.voiceId`: id de voz da xAI (padrão `eve`; vozes live atuais: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: código de idioma BCP-47 ou `auto` (padrão `en`).
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw` ou `alaw` (padrão `mp3`).
- `providers.xai.speed`: substituição nativa de velocidade do provider.
- `providers.xiaomi.apiKey`: chave de API do Xiaomi MiMo (env: `XIAOMI_API_KEY`).
- `providers.xiaomi.baseUrl`: substitui a URL base da API Xiaomi MiMo (padrão `https://api.xiaomimimo.com/v1`, env: `XIAOMI_BASE_URL`).
- `providers.xiaomi.model`: modelo de TTS (padrão `mimo-v2.5-tts`, env: `XIAOMI_TTS_MODEL`; `mimo-v2-tts` também é compatível).
- `providers.xiaomi.voice`: id de voz do MiMo (padrão `mimo_default`, env: `XIAOMI_TTS_VOICE`).
- `providers.xiaomi.format`: `mp3` ou `wav` (padrão `mp3`, env: `XIAOMI_TTS_FORMAT`).
- `providers.xiaomi.style`: instrução opcional de estilo em linguagem natural enviada como mensagem do usuário; ela não é falada.
- `providers.openrouter.apiKey`: chave de API do OpenRouter (env: `OPENROUTER_API_KEY`; pode reutilizar `models.providers.openrouter.apiKey`).
- `providers.openrouter.baseUrl`: substitui a URL base de TTS do OpenRouter (padrão `https://openrouter.ai/api/v1`; o legado `https://openrouter.ai/v1` é normalizado).
- `providers.openrouter.model`: id do modelo de TTS do OpenRouter (padrão `hexgrad/kokoro-82m`; `modelId` também é aceito).
- `providers.openrouter.voice`: id de voz específico do provider (padrão `af_alloy`; `voiceId` também é aceito).
- `providers.openrouter.responseFormat`: `mp3` ou `pcm` (padrão `mp3`).
- `providers.openrouter.speed`: substituição nativa de velocidade do provider.
- `providers.microsoft.enabled`: permite o uso de fala da Microsoft (padrão `true`; sem chave de API).
- `providers.microsoft.voice`: nome da voz neural da Microsoft (por exemplo `en-US-MichelleNeural`).
- `providers.microsoft.lang`: código do idioma (por exemplo `en-US`).
- `providers.microsoft.outputFormat`: formato de saída da Microsoft (por exemplo `audio-24khz-48kbitrate-mono-mp3`).
  - Consulte os formatos de saída do Microsoft Speech para valores válidos; nem todos os formatos são compatíveis com o transporte incluído com suporte do Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: strings em porcentagem (por exemplo `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: grava legendas JSON ao lado do arquivo de áudio.
- `providers.microsoft.proxy`: URL de proxy para solicitações de fala da Microsoft.
- `providers.microsoft.timeoutMs`: substituição de timeout da solicitação (ms).
- `edge.*`: alias legado para as mesmas configurações da Microsoft. Execute
  `openclaw doctor --fix` para reescrever a configuração persistida para `providers.microsoft`.

## Substituições orientadas por modelo (ativadas por padrão)

Por padrão, o modelo **pode** emitir diretivas de TTS para uma única resposta.
Quando `messages.tts.auto` é `tagged`, essas diretivas são necessárias para disparar o áudio.

Quando ativado, o modelo pode emitir diretivas `[[tts:...]]` para substituir a voz
em uma única resposta, além de um bloco opcional `[[tts:text]]...[[/tts:text]]` para
fornecer tags expressivas (risos, indicações de canto etc.) que devem aparecer apenas
no áudio.

Diretivas `provider=...` são ignoradas, a menos que `modelOverrides.allowProvider: true`.

Exemplo de payload de resposta:

```
Aqui está.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](risos) Leia a música mais uma vez.[[/tts:text]]
```

Chaves de diretiva disponíveis (quando ativadas):

- `provider` (id de provider de fala registrado, por exemplo `openai`, `elevenlabs`, `google`, `gradium`, `minimax`, `microsoft`, `vydra`, `xai` ou `xiaomi`; requer `allowProvider: true`)
- `voice` (voz de OpenAI, Gradium ou Xiaomi), `voiceName` / `voice_name` / `google_voice` (voz do Google) ou `voiceId` (ElevenLabs / Gradium / MiniMax / xAI)
- `model` (modelo TTS da OpenAI, id de modelo da ElevenLabs, modelo MiniMax ou modelo TTS do Xiaomi MiMo) ou `google_model` (modelo TTS do Google)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume do MiniMax, 0-10)
- `pitch` (tom inteiro do MiniMax, -12 a 12; valores fracionários são truncados antes da solicitação MiniMax)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Desabilitar todas as substituições orientadas por modelo:

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

Allowlist opcional (habilita troca de provider enquanto mantém outros parâmetros configuráveis):

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

Os comandos slash gravam substituições locais em `prefsPath` (padrão:
`~/.openclaw/settings/tts.json`, substituível com `OPENCLAW_TTS_PREFS` ou
`messages.tts.prefsPath`).

Campos armazenados:

- `enabled`
- `provider`
- `maxLength` (limite para resumo; padrão 1500 caracteres)
- `summarize` (padrão `true`)

Esses campos substituem `messages.tts.*` para esse host.

## Formatos de saída (fixos)

- **Feishu / Matrix / Telegram / WhatsApp**: respostas em mensagem de voz preferem Opus (`opus_48000_64` da ElevenLabs, `opus` da OpenAI).
  - 48 kHz / 64 kbps é um bom equilíbrio para mensagens de voz.
- **Feishu**: quando uma resposta em mensagem de voz é produzida como MP3/WAV/M4A ou outro
  arquivo provavelmente de áudio, o Plugin Feishu a transcodifica para Ogg/Opus em 48 kHz com
  `ffmpeg` antes de enviar o bubble nativo `audio`. Se a conversão falhar, o Feishu
  receberá o arquivo original como anexo.
- **Outros canais**: MP3 (`mp3_44100_128` da ElevenLabs, `mp3` da OpenAI).
  - 44,1 kHz / 128 kbps é o equilíbrio padrão para clareza de fala.
- **MiniMax**: MP3 (modelo `speech-2.8-hd`, taxa de amostragem de 32 kHz) para anexos normais de áudio. Para destinos de mensagem de voz como Feishu e Telegram, o OpenClaw transcodifica o MP3 do MiniMax para Opus em 48 kHz com `ffmpeg` antes da entrega.
- **Xiaomi MiMo**: MP3 por padrão, ou WAV quando configurado. Para destinos de mensagem de voz como Feishu e Telegram, o OpenClaw transcodifica a saída da Xiaomi para Opus em 48 kHz com `ffmpeg` antes da entrega.
- **CLI local**: usa o `outputFormat` configurado. Destinos de mensagem de voz são
  convertidos para Ogg/Opus, e a saída de telefonia é convertida para PCM mono bruto de 16 kHz
  com `ffmpeg`.
- **Google Gemini**: a API TTS do Gemini retorna PCM bruto de 24 kHz. O OpenClaw o encapsula como WAV para anexos de áudio e retorna PCM diretamente para Talk/telefonia. O formato nativo de mensagem de voz em Opus não é compatível com esse caminho.
- **Gradium**: WAV para anexos de áudio, Opus para destinos de mensagem de voz e `ulaw_8000` em 8 kHz para telefonia.
- **xAI**: MP3 por padrão; `responseFormat` pode ser `mp3`, `wav`, `pcm`, `mulaw` ou `alaw`. O OpenClaw usa o endpoint REST em lote de TTS da xAI e retorna um anexo de áudio completo; o WebSocket de TTS por streaming da xAI não é usado por esse caminho de provider. O formato nativo de mensagem de voz em Opus não é compatível com esse caminho.
- **Microsoft**: usa `microsoft.outputFormat` (padrão `audio-24khz-48kbitrate-mono-mp3`).
  - O transporte incluído aceita um `outputFormat`, mas nem todos os formatos estão disponíveis no serviço.
  - Os valores de formato de saída seguem os formatos de saída do Microsoft Speech (incluindo Ogg/WebM Opus).
  - O `sendVoice` do Telegram aceita OGG/MP3/M4A; use OpenAI/ElevenLabs se precisar de
    mensagens de voz em Opus garantidas.
  - Se o formato de saída configurado da Microsoft falhar, o OpenClaw tenta novamente com MP3.

Os formatos de saída de OpenAI/ElevenLabs são fixos por canal (veja acima).

## Comportamento do TTS automático

Quando habilitado, o OpenClaw:

- ignora TTS se a resposta já contiver mídia ou uma diretiva `MEDIA:`.
- ignora respostas muito curtas (< 10 caracteres).
- resume respostas longas quando habilitado usando `agents.defaults.model.primary` (ou `summaryModel`).
- anexa o áudio gerado à resposta.

Se a resposta exceder `maxLength` e o resumo estiver desativado (ou não houver chave de API para o
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
Consulte [Comandos slash](/pt-BR/tools/slash-commands) para detalhes de habilitação.

Observação sobre Discord: `/tts` é um comando integrado do Discord, então o OpenClaw registra
`/voice` como comando nativo lá. O texto `/tts ...` ainda funciona.

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
- `/tts on` grava a preferência local de TTS como `always`; `/tts off` a grava como `off`.
- Use a configuração quando quiser padrões `inbound` ou `tagged`.
- `limit` e `summary` são armazenados em preferências locais, não na configuração principal.
- `/tts audio` gera uma resposta de áudio pontual (não ativa o TTS).
- `/tts status` inclui visibilidade de fallback para a tentativa mais recente:
  - fallback com sucesso: `Fallback: <primary> -> <used>` mais `Attempts: ...`
  - falha: `Error: ...` mais `Attempts: ...`
  - diagnósticos detalhados: `Attempt details: provider:outcome(reasonCode) latency`
- Falhas de API da OpenAI e ElevenLabs agora incluem detalhes de erro do provider analisados e id da solicitação (quando retornado pelo provider), o que é exposto em erros/logs de TTS.

## Ferramenta do agente

A ferramenta `tts` converte texto em fala e retorna um anexo de áudio para
entrega da resposta. Quando o canal é Feishu, Matrix, Telegram ou WhatsApp,
o áudio é entregue como mensagem de voz em vez de um anexo de arquivo.
O Feishu pode transcodificar saída de TTS não Opus nesse caminho quando `ffmpeg` está
disponível.
Ela aceita campos opcionais `channel` e `timeoutMs`; `timeoutMs` é um
timeout de solicitação ao provider por chamada, em milissegundos.

## RPC do Gateway

Métodos do Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

## Relacionado

- [Visão geral de mídia](/pt-BR/tools/media-overview)
- [Geração de música](/pt-BR/tools/music-generation)
- [Geração de vídeo](/pt-BR/tools/video-generation)

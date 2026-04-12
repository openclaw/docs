---
read_when:
    - Ativar texto para fala para respostas
    - Configurar provedores de TTS ou limites
    - Usar comandos `/tts`
summary: Texto para fala (TTS) para respostas enviadas
title: Texto para fala
x-i18n:
    generated_at: "2026-04-12T23:33:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad79a6be34879347dc73fdab1bd219823cd7c6aa8504e3e4c73e1a0554c837c5
    source_path: tools/tts.md
    workflow: 15
---

# Texto para fala (TTS)

O OpenClaw pode converter respostas enviadas em áudio usando ElevenLabs, Microsoft, MiniMax ou OpenAI.
Funciona em qualquer lugar onde o OpenClaw possa enviar áudio.

## Serviços compatíveis

- **ElevenLabs** (provedor principal ou de fallback)
- **Microsoft** (provedor principal ou de fallback; a implementação agrupada atual usa `node-edge-tts`)
- **MiniMax** (provedor principal ou de fallback; usa a API T2A v2)
- **OpenAI** (provedor principal ou de fallback; também usado para resumos)

### Observações sobre a fala da Microsoft

Atualmente, o provedor agrupado de fala da Microsoft usa o serviço online
de TTS neural do Microsoft Edge por meio da biblioteca `node-edge-tts`. É um serviço hospedado (não
local), usa endpoints da Microsoft e não exige chave de API.
O `node-edge-tts` expõe opções de configuração de fala e formatos de saída, mas
nem todas as opções são compatíveis com o serviço. Configuração legada e entrada de diretiva
usando `edge` continuam funcionando e são normalizadas para `microsoft`.

Como esse caminho é um serviço web público sem SLA ou cota publicados,
trate-o como best-effort. Se você precisa de limites garantidos e suporte, use OpenAI
ou ElevenLabs.

## Chaves opcionais

Se você quiser OpenAI, ElevenLabs ou MiniMax:

- `ELEVENLABS_API_KEY` (ou `XI_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`

A fala da Microsoft **não** exige chave de API.

Se vários provedores estiverem configurados, o provedor selecionado será usado primeiro, e os demais serão opções de fallback.
O resumo automático usa o `summaryModel` configurado (ou `agents.defaults.model.primary`),
então esse provedor também precisa estar autenticado se você ativar resumos.

## Links dos serviços

- [Guia de Text-to-Speech da OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [Referência da API de áudio da OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [Text to Speech da ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Autenticação da ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formatos de saída de fala da Microsoft](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)

## Ela vem ativada por padrão?

Não. O TTS automático vem **desativado** por padrão. Ative-o na configuração com
`messages.tts.auto` ou localmente com `/tts on`.

Quando `messages.tts.provider` não está definido, o OpenClaw escolhe o primeiro
provedor de fala configurado na ordem de seleção automática do registro.

## Configuração

A configuração de TTS fica em `messages.tts` no `openclaw.json`.
O esquema completo está em [Configuração do Gateway](/pt-BR/gateway/configuration).

### Configuração mínima (ativar + provedor)

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

### OpenAI como principal com fallback da ElevenLabs

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

### Microsoft como principal (sem chave de API)

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

### MiniMax como principal

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

### Desativar a fala da Microsoft

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

### Caminho personalizado de limites + preferências

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

### Desativar resumo automático para respostas longas

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

- `auto`: modo de TTS automático (`off`, `always`, `inbound`, `tagged`).
  - `inbound` envia áudio apenas após uma mensagem de voz recebida.
  - `tagged` envia áudio apenas quando a resposta inclui diretivas `[[tts:key=value]]` ou um bloco `[[tts:text]]...[[/tts:text]]`.
- `enabled`: alternador legado (o doctor migra isso para `auto`).
- `mode`: `"final"` (padrão) ou `"all"` (inclui respostas de ferramenta/bloco).
- `provider`: id do provedor de fala, como `"elevenlabs"`, `"microsoft"`, `"minimax"` ou `"openai"` (o fallback é automático).
- Se `provider` **não** estiver definido, o OpenClaw usa o primeiro provedor de fala configurado na ordem de seleção automática do registro.
- O legado `provider: "edge"` ainda funciona e é normalizado para `microsoft`.
- `summaryModel`: modelo barato opcional para resumo automático; o padrão é `agents.defaults.model.primary`.
  - Aceita `provider/model` ou um alias de modelo configurado.
- `modelOverrides`: permite que o modelo emita diretivas de TTS (ativado por padrão).
  - `allowProvider` usa `false` por padrão (troca de provedor é opt-in).
- `providers.<id>`: configurações pertencentes ao provedor, indexadas pelo id do provedor de fala.
- Blocos legados de provedor direto (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) são migrados automaticamente para `messages.tts.providers.<id>` no carregamento.
- `maxTextLength`: limite rígido para entrada de TTS (caracteres). `/tts audio` falha se for excedido.
- `timeoutMs`: timeout da requisição (ms).
- `prefsPath`: substitui o caminho local do JSON de preferências (provedor/limite/resumo).
- Valores de `apiKey` usam fallback para variáveis de ambiente (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl`: substitui a URL base da API da ElevenLabs.
- `providers.openai.baseUrl`: substitui o endpoint de TTS da OpenAI.
  - Ordem de resolução: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Valores diferentes do padrão são tratados como endpoints de TTS compatíveis com OpenAI, então nomes personalizados de modelo e voz são aceitos.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = normal)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: ISO 639-1 de 2 letras (por exemplo `en`, `de`)
- `providers.elevenlabs.seed`: inteiro `0..4294967295` (determinismo best-effort)
- `providers.minimax.baseUrl`: substitui a URL base da API do MiniMax (padrão `https://api.minimax.io`, env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: modelo TTS (padrão `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: identificador de voz (padrão `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: velocidade de reprodução `0.5..2.0` (padrão 1.0).
- `providers.minimax.vol`: volume `(0, 10]` (padrão 1.0; precisa ser maior que 0).
- `providers.minimax.pitch`: deslocamento de tom `-12..12` (padrão 0).
- `providers.microsoft.enabled`: permite uso da fala da Microsoft (padrão `true`; sem chave de API).
- `providers.microsoft.voice`: nome da voz neural da Microsoft (por exemplo `en-US-MichelleNeural`).
- `providers.microsoft.lang`: código de idioma (por exemplo `en-US`).
- `providers.microsoft.outputFormat`: formato de saída da Microsoft (por exemplo `audio-24khz-48kbitrate-mono-mp3`).
  - Veja os formatos de saída de fala da Microsoft para valores válidos; nem todos os formatos são compatíveis com o transporte agrupado baseado em Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: strings em porcentagem (por exemplo `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: grava legendas em JSON ao lado do arquivo de áudio.
- `providers.microsoft.proxy`: URL de proxy para requisições de fala da Microsoft.
- `providers.microsoft.timeoutMs`: substituição do timeout da requisição (ms).
- `edge.*`: alias legado para as mesmas configurações da Microsoft.

## Substituições orientadas por modelo (ativadas por padrão)

Por padrão, o modelo **pode** emitir diretivas de TTS para uma única resposta.
Quando `messages.tts.auto` é `tagged`, essas diretivas são obrigatórias para disparar o áudio.

Quando ativado, o modelo pode emitir diretivas `[[tts:...]]` para substituir a voz
em uma única resposta, além de um bloco opcional `[[tts:text]]...[[/tts:text]]` para
fornecer tags expressivas (risadas, indicações de canto etc.) que devem aparecer
apenas no áudio.

Diretivas `provider=...` são ignoradas, a menos que `modelOverrides.allowProvider: true`.

Exemplo de payload de resposta:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Chaves de diretiva disponíveis (quando ativadas):

- `provider` (id de provedor de fala registrado, por exemplo `openai`, `elevenlabs`, `minimax` ou `microsoft`; exige `allowProvider: true`)
- `voice` (voz da OpenAI) ou `voiceId` (ElevenLabs / MiniMax)
- `model` (modelo TTS da OpenAI, id de modelo da ElevenLabs ou modelo do MiniMax)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume do MiniMax, 0-10)
- `pitch` (tom do MiniMax, -12 a 12)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Desativar todas as substituições do modelo:

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

Lista de permissões opcional (ativa a troca de provedor enquanto mantém outros controles configuráveis):

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

Os comandos com barra gravam substituições locais em `prefsPath` (padrão:
`~/.openclaw/settings/tts.json`, substitua com `OPENCLAW_TTS_PREFS` ou
`messages.tts.prefsPath`).

Campos armazenados:

- `enabled`
- `provider`
- `maxLength` (limite de resumo; padrão 1500 caracteres)
- `summarize` (padrão `true`)

Eles substituem `messages.tts.*` para esse host.

## Formatos de saída (fixos)

- **Feishu / Matrix / Telegram / WhatsApp**: mensagem de voz Opus (`opus_48000_64` da ElevenLabs, `opus` da OpenAI).
  - 48kHz / 64kbps é um bom equilíbrio para mensagem de voz.
- **Outros canais**: MP3 (`mp3_44100_128` da ElevenLabs, `mp3` da OpenAI).
  - 44.1kHz / 128kbps é o equilíbrio padrão para clareza de fala.
- **MiniMax**: MP3 (modelo `speech-2.8-hd`, taxa de amostragem de 32kHz). O formato de nota de voz não é compatível nativamente; use OpenAI ou ElevenLabs para mensagens de voz Opus garantidas.
- **Microsoft**: usa `microsoft.outputFormat` (padrão `audio-24khz-48kbitrate-mono-mp3`).
  - O transporte agrupado aceita um `outputFormat`, mas nem todos os formatos estão disponíveis no serviço.
  - Os valores de formato de saída seguem os formatos de saída de fala da Microsoft (incluindo Ogg/WebM Opus).
  - O `sendVoice` do Telegram aceita OGG/MP3/M4A; use OpenAI/ElevenLabs se você precisar de mensagens de voz Opus garantidas.
  - Se o formato de saída configurado da Microsoft falhar, o OpenClaw tenta novamente com MP3.

Os formatos de saída da OpenAI/ElevenLabs são fixos por canal (veja acima).

## Comportamento do TTS automático

Quando ativado, o OpenClaw:

- ignora o TTS se a resposta já contiver mídia ou uma diretiva `MEDIA:`.
- ignora respostas muito curtas (< 10 caracteres).
- resume respostas longas quando ativado usando `agents.defaults.model.primary` (ou `summaryModel`).
- anexa o áudio gerado à resposta.

Se a resposta exceder `maxLength` e o resumo estiver desativado (ou não houver chave de API para o
modelo de resumo), o áudio
será ignorado e a resposta normal em texto será enviada.

## Diagrama de fluxo

```
Resposta -> TTS ativado?
  não -> enviar texto
  sim -> tem mídia / MEDIA: / é curta?
          sim -> enviar texto
          não -> tamanho > limite?
                   não -> TTS -> anexar áudio
                   sim -> resumo ativado?
                            não -> enviar texto
                            sim -> resumir (summaryModel ou agents.defaults.model.primary)
                                      -> TTS -> anexar áudio
```

## Uso do comando com barra

Há um único comando: `/tts`.
Consulte [Comandos com barra](/pt-BR/tools/slash-commands) para detalhes de ativação.

Observação sobre o Discord: `/tts` é um comando nativo do Discord, então o OpenClaw registra
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

- Os comandos exigem um remetente autorizado (as regras de allowlist/proprietário ainda se aplicam).
- `commands.text` ou o registro de comando nativo precisam estar ativados.
- A configuração `messages.tts.auto` aceita `off|always|inbound|tagged`.
- `/tts on` grava a preferência local de TTS como `always`; `/tts off` grava como `off`.
- Use a configuração quando quiser padrões `inbound` ou `tagged`.
- `limit` e `summary` são armazenados nas preferências locais, não na configuração principal.
- `/tts audio` gera uma resposta de áudio avulsa (não ativa o TTS).
- `/tts status` inclui visibilidade de fallback para a tentativa mais recente:
  - fallback com sucesso: `Fallback: <primary> -> <used>` mais `Attempts: ...`
  - falha: `Error: ...` mais `Attempts: ...`
  - diagnóstico detalhado: `Attempt details: provider:outcome(reasonCode) latency`
- Falhas de API da OpenAI e da ElevenLabs agora incluem detalhes analisados do erro do provedor e id da requisição (quando retornado pelo provedor), que aparecem em erros/logs de TTS.

## Ferramenta do agente

A ferramenta `tts` converte texto em fala e retorna um anexo de áudio para
entrega na resposta. Quando o canal é Feishu, Matrix, Telegram ou WhatsApp,
o áudio é entregue como uma mensagem de voz em vez de um anexo de arquivo.

## RPC do Gateway

Métodos do Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

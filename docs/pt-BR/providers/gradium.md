---
read_when:
- Você quer usar o Gradium para text-to-speech
- You need Gradium API key or voice configuration
summary: Usar Gradium text-to-speech no OpenClaw
title: Gradium
x-i18n:
  generated_at: '2026-04-25T13:54:26Z'
  refreshed_at: '2026-04-28T04:45:00Z'
  model: gpt-5.4
  provider: openai
  source_hash: ed836c836ad4e5f5033fa982b28341ce0b37f6972a8eb1bb5a2b0b5619859bcb
  source_path: providers/gradium.md
  workflow: 15
---

Gradium é um provedor de text-to-speech empacotado do OpenClaw. Ele pode gerar respostas normais em áudio, saída Opus compatível com nota de voz e áudio u-law de 8 kHz para superfícies de telefonia.

## Configuração inicial

Crie uma chave de API do Gradium e então exponha-a ao OpenClaw:

```bash
export GRADIUM_API_KEY="gsk_..."
```

Você também pode armazenar a chave na configuração em `messages.tts.providers.gradium.apiKey`.

## Configuração

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          voiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

## Vozes

| Nome      | ID da voz          |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

Voz padrão: Emma.

## Saída

- Respostas em arquivo de áudio usam WAV.
- Respostas em nota de voz usam Opus e são marcadas como compatíveis com voz.
- A síntese para telefonia usa `ulaw_8000` em 8 kHz.

## Relacionado

- [Text-to-Speech](/pt-BR/tools/tts)
- [Media Overview](/pt-BR/tools/media-overview)

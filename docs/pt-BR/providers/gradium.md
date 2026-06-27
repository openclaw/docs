---
read_when:
    - Você quer o Gradium para conversão de texto em fala
    - Você precisa configurar a chave de API, voz ou token de diretiva do Gradium
summary: Use texto-para-fala da Gradium no OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-06-27T18:04:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5178bfaf5087e18d5d71f46d04b16d52e0e132257b9ef772b7869ac11b49a0da
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) é um provedor de texto para fala para o OpenClaw. O Plugin pode renderizar respostas normais em áudio (WAV), saída Opus compatível com notas de voz e áudio u-law de 8 kHz para superfícies de telefonia.

| Propriedade | Valor                                |
| ----------- | ------------------------------------ |
| ID do provedor | `gradium`                            |
| Autenticação | `GRADIUM_API_KEY` ou config `apiKey` |
| URL base    | `https://api.gradium.ai` (padrão)   |
| Voz padrão  | `Emma` (`YTpq7expH9539ERJ`)          |

## Instalar Plugin

Instale o Plugin oficial e depois reinicie o Gateway:

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## Configuração

Crie uma chave de API do Gradium e depois exponha-a ao OpenClaw com uma variável de ambiente ou com a chave de configuração.

<Tabs>
  <Tab title="Env var">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="Config key">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "gradium",
          providers: {
            gradium: {
              apiKey: "${GRADIUM_API_KEY}",
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

O Plugin verifica primeiro o `apiKey` resolvido e recorre à variável de ambiente `GRADIUM_API_KEY`.

## Configuração

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          speakerVoiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

| Chave                                           | Tipo   | Descrição                                                                                   |
| ----------------------------------------------- | ------ | ------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | string | Chave de API resolvida. Compatível com `${ENV}` e referências a secrets.                    |
| `messages.tts.providers.gradium.baseUrl`        | string | Substitui a origem da API. Barras finais são removidas. O padrão é `https://api.gradium.ai`. |
| `messages.tts.providers.gradium.speakerVoiceId` | string | ID da voz padrão usado quando não há substituição por diretiva presente.                     |

O formato de áudio de saída é selecionado automaticamente pelo runtime com base na superfície de destino e não é configurável em `openclaw.json`. Veja [Saída](#output) abaixo.

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

### Substituição de voz por mensagem

Quando a política de fala ativa permite substituições de voz, você pode trocar vozes inline usando um token de diretiva. Use `speakerVoiceId` para IDs de voz nativos do provedor.

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

Se a política de fala desabilitar substituições de voz, a diretiva é consumida, mas ignorada.

## Saída

O runtime escolhe o formato de saída a partir da superfície de destino. Atualmente, o provedor não sintetiza outros formatos.

| Destino        | Formato     | Ext. do arquivo | Taxa de amostragem | Sinalizador compatível com voz |
| -------------- | ----------- | --------------- | ------------------ | ------------------------------ |
| Áudio padrão   | `wav`       | `.wav`          | provedor           | não                            |
| Nota de voz    | `opus`      | `.opus`         | provedor           | sim                            |
| Telefonia      | `ulaw_8000` | n/d             | 8 kHz              | n/d                            |

## Ordem de seleção automática

Entre os provedores de TTS configurados, a ordem de seleção automática do Gradium é `30`. Veja [Texto para fala](/pt-BR/tools/tts) para saber como o OpenClaw escolhe o provedor ativo quando `messages.tts.provider` não está fixado.

## Relacionados

- [Texto para fala](/pt-BR/tools/tts)
- [Visão geral de mídia](/pt-BR/tools/media-overview)

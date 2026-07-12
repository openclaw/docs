---
read_when:
    - Você quer usar o Gradium para conversão de texto em fala
    - Você precisa configurar a chave da API, a voz ou o token de diretiva do Gradium
summary: Use a conversão de texto em fala do Gradium no OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-07-12T15:39:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 80120b1951115b6c81247c6bc6bc3c8834ef454c30d32f1d854cd3cca0870750
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) é um provedor de conversão de texto em fala para o OpenClaw. Ele gera respostas de áudio padrão (WAV), saída Opus compatível com mensagens de voz e áudio u-law de 8 kHz para interfaces de telefonia.

| Propriedade     | Valor                                |
| --------------- | ------------------------------------ |
| ID do provedor  | `gradium`                            |
| Autenticação    | `GRADIUM_API_KEY` ou `apiKey` na configuração |
| URL base        | `https://api.gradium.ai` (padrão)    |
| Voz padrão      | `Emma` (`YTpq7expH9539ERJ`)          |

## Instalar o plugin

Gradium é um plugin externo oficial. Instale-o e reinicie o Gateway:

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## Configuração inicial

Crie uma chave de API do Gradium e disponibilize-a por meio de uma variável de ambiente ou da chave de configuração. A configuração tem precedência sobre a variável de ambiente.

<Tabs>
  <Tab title="Variável de ambiente">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="Chave de configuração">
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

| Chave                                           | Tipo   | Descrição                                                                                                      |
| ----------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | string | Chave de API resolvida. Compatível com `${ENV}` e referências a segredos.                                      |
| `messages.tts.providers.gradium.baseUrl`        | string | URL HTTPS da API do Gradium em `api.gradium.ai`. Barras finais são removidas. Padrão: `https://api.gradium.ai`. |
| `messages.tts.providers.gradium.speakerVoiceId` | string | ID da voz padrão usado quando não há substituição por diretiva.                                                |

O formato de saída é escolhido automaticamente de acordo com a interface de destino (consulte [Saída](#output)) e não pode ser configurado em `openclaw.json`.

## Vozes

| Nome               | ID da voz          |
| ------------------ | ------------------ |
| Arthur             | `3jUdJyOi9pgbxBTK` |
| Christina          | `2H4HY2CBNyJHBCrP` |
| Emma **(padrão)**  | `YTpq7expH9539ERJ` |
| John               | `KWJiFWu2O9nMPYcR` |
| Kent               | `LFZvm12tW_z0xfGo` |
| Sydney             | `jtEKaLYNn6iif5PR` |
| Tiffany            | `Eu9iL_CYe8N-Gkx_` |

### Substituição da voz por mensagem

Quando a política de fala ativa permite substituições de voz, altere a voz em linha com um token de diretiva (todas estas formas são equivalentes e recebem um ID de voz nativo do provedor):

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

Se a política de fala desativar substituições de voz, a diretiva será consumida, mas ignorada.

## Saída

O formato de saída é selecionado de acordo com a interface de destino; o provedor não sintetiza outros formatos.

| Destino      | Formato     | Extensão do arquivo | Taxa de amostragem | Indicador de compatibilidade com voz |
| ------------ | ----------- | ------------------- | ------------------- | ------------------------------------ |
| Áudio padrão | `wav`       | `.wav`              | provedor            | não                                  |
| Mensagem de voz | `opus`   | `.opus`             | provedor            | sim                                  |
| Telefonia    | `ulaw_8000` | n/d                 | 8 kHz               | n/d                                  |

## Ordem de seleção automática

Entre os provedores de TTS configurados, a ordem de seleção automática do Gradium é `30`. Consulte [Conversão de texto em fala](/pt-BR/tools/tts) para saber como o OpenClaw escolhe o provedor ativo quando `messages.tts.provider` não está definido explicitamente.

## Relacionados

- [Conversão de texto em fala](/pt-BR/tools/tts)
- [Visão geral de mídia](/pt-BR/tools/media-overview)

---
read_when:
    - Metinden sese için Gradium istiyorsunuz
    - Gradium API anahtarı, ses veya yönerge belirteci yapılandırmasına ihtiyacınız var
summary: OpenClaw’da Gradium metinden konuşmaya özelliğini kullanın
title: Gradium
x-i18n:
    generated_at: "2026-06-28T01:10:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5178bfaf5087e18d5d71f46d04b16d52e0e132257b9ef772b7869ac11b49a0da
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai), OpenClaw için bir metinden konuşmaya sağlayıcısıdır. Plugin normal sesli yanıtları (WAV), sesli not uyumlu Opus çıktısını ve telefon yüzeyleri için 8 kHz u-law sesi işleyebilir.

| Özellik       | Değer                                |
| ------------- | ------------------------------------ |
| Sağlayıcı kimliği | `gradium`                            |
| Kimlik doğrulama | `GRADIUM_API_KEY` veya config `apiKey` |
| Temel URL     | `https://api.gradium.ai` (varsayılan) |
| Varsayılan ses | `Emma` (`YTpq7expH9539ERJ`)          |

## Plugin yükleme

Resmi Plugin'i yükleyin, ardından Gateway'i yeniden başlatın:

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## Kurulum

Bir Gradium API anahtarı oluşturun, ardından bunu bir env var veya config anahtarıyla OpenClaw'a sunun.

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

Plugin önce çözümlenen `apiKey` değerini kontrol eder ve ardından `GRADIUM_API_KEY` ortam değişkenine geri döner.

## Config

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

| Anahtar                                        | Tür    | Açıklama                                                                                     |
| ----------------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | string | Çözümlenen API anahtarı. `${ENV}` ve secret ref'lerini destekler.                             |
| `messages.tts.providers.gradium.baseUrl`        | string | API kaynağını geçersiz kılar. Sondaki eğik çizgiler çıkarılır. Varsayılan `https://api.gradium.ai`. |
| `messages.tts.providers.gradium.speakerVoiceId` | string | Yönerge geçersiz kılması yokken kullanılan varsayılan ses kimliği.                            |

Çıktı ses biçimi, hedef yüzeye göre runtime tarafından otomatik olarak seçilir ve `openclaw.json` içinden yapılandırılamaz. Aşağıdaki [Çıktı](#output) bölümüne bakın.

## Sesler

| Ad        | Ses kimliği        |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

Varsayılan ses: Emma.

### Mesaj başına ses geçersiz kılma

Etkin konuşma ilkesi ses geçersiz kılmalarına izin verdiğinde, bir yönerge belirteci kullanarak sesleri satır içinde değiştirebilirsiniz. Sağlayıcıya özgü ses kimlikleri için `speakerVoiceId` kullanın.

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

Konuşma ilkesi ses geçersiz kılmalarını devre dışı bırakırsa, yönerge tüketilir ancak yok sayılır.

## Çıktı

Runtime, çıktı biçimini hedef yüzeyden seçer. Sağlayıcı bugün başka biçimler sentezlemez.

| Hedef          | Biçim       | Dosya uzantısı | Örnekleme hızı | Ses uyumlu bayrak |
| -------------- | ----------- | -------- | ----------- | --------------------- |
| Standart ses   | `wav`       | `.wav`   | sağlayıcı    | hayır                 |
| Sesli not      | `opus`      | `.opus`  | sağlayıcı    | evet                  |
| Telefon        | `ulaw_8000` | n/a      | 8 kHz        | n/a                   |

## Otomatik seçim sırası

Yapılandırılmış TTS sağlayıcıları arasında Gradium'un otomatik seçim sırası `30` değeridir. `messages.tts.provider` sabitlenmediğinde OpenClaw'ın etkin sağlayıcıyı nasıl seçtiği için [Metinden Konuşmaya](/tr/tools/tts) bölümüne bakın.

## İlgili

- [Metinden Konuşmaya](/tr/tools/tts)
- [Medya Genel Bakışı](/tr/tools/media-overview)

---
read_when:
    - Metinden konuşmaya dönüştürme için Gradium kullanmak istiyorsunuz
    - Gradium API anahtarı, ses veya direktif belirteci yapılandırması gereklidir
summary: OpenClaw'da Gradium metinden konuşmaya özelliğini kullanma
title: Gradium
x-i18n:
    generated_at: "2026-07-16T17:37:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 80120b1951115b6c81247c6bc6bc3c8834ef454c30d32f1d854cd3cca0870750
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai), OpenClaw için bir metinden konuşmaya sağlayıcısıdır. Standart sesli yanıtlar (WAV), sesli notlarla uyumlu Opus çıktısı ve telefon yüzeyleri için 8 kHz u-law ses oluşturur.

| Özellik       | Değer                                |
| ------------- | ------------------------------------ |
| Sağlayıcı kimliği | `gradium`                            |
| Kimlik doğrulama | `GRADIUM_API_KEY` veya `apiKey` yapılandırması |
| Temel URL     | `https://api.gradium.ai` (varsayılan)   |
| Varsayılan ses | `Emma` (`YTpq7expH9539ERJ`)          |

## Plugin'i yükleme

Gradium, resmi bir harici Plugin'dir. Plugin'i yükleyin, ardından Gateway'i yeniden başlatın:

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## Kurulum

Bir Gradium API anahtarı oluşturun, ardından bunu bir ortam değişkeni veya yapılandırma anahtarıyla kullanıma sunun. Yapılandırma, ortam değişkenine göre önceliklidir.

<Tabs>
  <Tab title="Ortam değişkeni">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="Yapılandırma anahtarı">
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

## Yapılandırma

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

| Anahtar                                         | Tür    | Açıklama                                                                                                |
| ----------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | dize | Çözümlenmiş API anahtarı. `${ENV}` ve gizli bilgi referanslarını destekler.                                                    |
| `messages.tts.providers.gradium.baseUrl`        | dize | `api.gradium.ai` üzerindeki HTTPS Gradium API URL'si. Sondaki eğik çizgiler kaldırılır. Varsayılan: `https://api.gradium.ai`. |
| `messages.tts.providers.gradium.speakerVoiceId` | dize | Direktifle geçersiz kılma belirtilmediğinde kullanılan varsayılan ses kimliği.                                            |

Çıktı biçimi hedef yüzeye göre otomatik olarak seçilir (bkz. [Çıktı](#output)) ve `openclaw.json` içinde yapılandırılamaz.

## Sesler

| Ad                 | Ses kimliği        |
| ------------------ | ------------------ |
| Arthur             | `3jUdJyOi9pgbxBTK` |
| Christina          | `2H4HY2CBNyJHBCrP` |
| Emma **(varsayılan)** | `YTpq7expH9539ERJ` |
| John               | `KWJiFWu2O9nMPYcR` |
| Kent               | `LFZvm12tW_z0xfGo` |
| Sydney             | `jtEKaLYNn6iif5PR` |
| Tiffany            | `Eu9iL_CYe8N-Gkx_` |

### İleti başına sesi geçersiz kılma

Etkin konuşma ilkesi sesi geçersiz kılmaya izin verdiğinde, bir direktif belirteciyle satır içinde sesler arasında geçiş yapın (bunların tümü eşdeğerdir ve sağlayıcıya özgü bir ses kimliği alır):

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

Konuşma ilkesi sesi geçersiz kılmayı devre dışı bırakırsa direktif tüketilir ancak yok sayılır.

## Çıktı

Çıktı biçimi hedef yüzeye göre seçilir; sağlayıcı diğer biçimleri sentezlemez.

| Hedef          | Biçim       | Dosya uzantısı | Örnekleme hızı | Sesle uyumlu işareti |
| -------------- | ----------- | -------------- | ------------- | -------------------- |
| Standart ses   | `wav`       | `.wav`   | sağlayıcı     | hayır                |
| Sesli not      | `opus`      | `.opus`  | sağlayıcı     | evet                 |
| Telefon        | `ulaw_8000` | yok            | 8 kHz         | yok                  |

## Otomatik seçim sırası

Yapılandırılmış TTS sağlayıcıları arasında Gradium'un otomatik seçim sırası `30` değerindedir. `messages.tts.provider` sabitlenmediğinde OpenClaw'ın etkin sağlayıcıyı nasıl seçtiği hakkında bilgi için [Metinden Konuşmaya](/tr/tools/tts) bölümüne bakın.

## İlgili

- [Metinden Konuşmaya](/tr/tools/tts)
- [Medyaya Genel Bakış](/tr/tools/media-overview)

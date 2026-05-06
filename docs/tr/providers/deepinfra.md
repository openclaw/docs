---
read_when:
    - Önde gelen açık kaynak büyük dil modelleri için tek bir API anahtarı istiyorsunuz
    - OpenClaw'da modelleri DeepInfra'nın API'si aracılığıyla çalıştırmak istiyorsunuz
summary: DeepInfra'nın birleşik API'sini kullanarak OpenClaw'da en popüler açık kaynak ve öncü modellere erişin
title: DeepInfra
x-i18n:
    generated_at: "2026-05-06T09:27:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e68c3f764ac91548c2ced0b650e582f6d315ad7f154d19a00f299a3737494cd
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra, istekleri tek bir uç nokta ve API anahtarının arkasındaki en popüler açık kaynak ve öncü modellere yönlendiren **birleşik API** sağlar. OpenAI uyumludur, bu nedenle çoğu OpenAI SDK'sı temel URL değiştirilerek çalışır.

## API anahtarı alma

1. [https://deepinfra.com/](https://deepinfra.com/) adresine gidin
2. Oturum açın veya bir hesap oluşturun
3. Dashboard / Keys bölümüne gidin ve yeni bir API anahtarı oluşturun ya da otomatik oluşturulanı kullanın

## CLI kurulumu

```bash
openclaw onboard --deepinfra-api-key <key>
```

Veya ortam değişkenini ayarlayın:

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## Yapılandırma parçacığı

```json5
{
  env: { DEEPINFRA_API_KEY: "<your-deepinfra-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V3.2" },
    },
  },
}
```

## Desteklenen OpenClaw yüzeyleri

Paketle gelen Plugin, güncel OpenClaw sağlayıcı sözleşmeleriyle eşleşen tüm DeepInfra yüzeylerini kaydeder:

| Yüzey                    | Varsayılan model                  | OpenClaw yapılandırması/aracı                         |
| ------------------------ | ---------------------------------- | -------------------------------------------------------- |
| Sohbet / model sağlayıcısı | `deepseek-ai/DeepSeek-V3.2`        | `agents.defaults.model`                                  |
| Görsel oluşturma/düzenleme | `black-forest-labs/FLUX-1-schnell` | `image_generate`, `agents.defaults.imageGenerationModel` |
| Medya anlama             | görseller için `moonshotai/Kimi-K2.5` | gelen görsel anlama                                      |
| Konuşmadan metne         | `openai/whisper-large-v3-turbo`    | gelen ses transkripsiyonu                                |
| Metinden konuşmaya       | `hexgrad/Kokoro-82M`               | `messages.tts.provider: "deepinfra"`                     |
| Video oluşturma          | `Pixverse/Pixverse-T2V`            | `video_generate`, `agents.defaults.videoGenerationModel` |
| Bellek embedding'leri    | `BAAI/bge-m3`                      | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra ayrıca yeniden sıralama, sınıflandırma, nesne algılama ve diğer yerel model türlerini de sunar. OpenClaw şu anda bu kategoriler için birinci sınıf sağlayıcı sözleşmelerine sahip değildir, bu nedenle bu Plugin bunları henüz kaydetmez.

## Kullanılabilir modeller

OpenClaw, başlangıçta kullanılabilir DeepInfra modellerini dinamik olarak keşfeder. Kullanılabilir modellerin tam listesini görmek için `/models deepinfra` kullanın.

[DeepInfra.com](https://deepinfra.com/) üzerinde kullanılabilen herhangi bir model `deepinfra/` önekiyle kullanılabilir:

```
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/moonshotai/Kimi-K2.5
deepinfra/zai-org/GLM-5.1
...ve daha fazlası
```

## Notlar

- Model referansları `deepinfra/<provider>/<model>` biçimindedir (örn. `deepinfra/Qwen/Qwen3-Max`).
- Varsayılan model: `deepinfra/deepseek-ai/DeepSeek-V3.2`
- Temel URL: `https://api.deepinfra.com/v1/openai`
- Yerel video oluşturma `https://api.deepinfra.com/v1/inference/<model>` kullanır.

## İlgili

- [Model sağlayıcıları](/tr/concepts/model-providers)
- [Tüm sağlayıcılar](/tr/providers/index)

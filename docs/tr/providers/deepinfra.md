---
read_when:
    - En iyi açık kaynak LLM'ler için tek bir API anahtarı istiyorsunuz
    - OpenClaw’da modelleri DeepInfra'nın API'si üzerinden çalıştırmak istiyorsunuz
summary: OpenClaw'da en popüler açık kaynak ve öncü modellere erişmek için DeepInfra'nın birleşik API'sini kullanın
title: DeepInfra
x-i18n:
    generated_at: "2026-06-28T01:09:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 059a556c24d2de2c8c5290b54c78fbc7451dc534238bfc4c725dcfbbd9a2d17f
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra, istekleri tek bir uç nokta ve API anahtarı arkasında en popüler açık kaynak ve frontier modellere yönlendiren **birleşik API** sağlar. OpenAI uyumludur, bu nedenle çoğu OpenAI SDK'sı temel URL değiştirilerek çalışır.

## Plugin yükleme

Resmi Plugin'i yükleyin, ardından Gateway'i yeniden başlatın:

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## API anahtarı alma

1. [https://deepinfra.com/](https://deepinfra.com/) adresine gidin
2. Oturum açın veya bir hesap oluşturun
3. Dashboard / Keys bölümüne gidin ve yeni bir API anahtarı oluşturun ya da otomatik oluşturulan anahtarı kullanın

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
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V4-Flash" },
    },
  },
}
```

## Desteklenen OpenClaw yüzeyleri

Plugin, mevcut OpenClaw sağlayıcı sözleşmeleriyle eşleşen tüm DeepInfra yüzeylerini kaydeder. Sohbet, görsel oluşturma ve video oluşturma, `DEEPINFRA_API_KEY` yapılandırıldığında model kataloglarını `/v1/openai/models?sort_by=openclaw&filter=with_meta` üzerinden canlı olarak yeniler; diğer yüzeyler aşağıdaki seçilmiş statik varsayılanları kullanır.

| Yüzey                    | Varsayılan model                                                                                         | OpenClaw yapılandırması/aracı                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Sohbet / model sağlayıcısı | canlı katalogdan ilk sohbet etiketli giriş (manifest yedeği `deepseek-ai/DeepSeek-V4-Flash`)         | `agents.defaults.model`                                  |
| Görsel oluşturma/düzenleme | canlı katalogdan ilk `image-gen` etiketli giriş (statik yedek `black-forest-labs/FLUX-1-schnell`) | `image_generate`, `agents.defaults.imageGenerationModel` |
| Medya anlama             | görseller için `moonshotai/Kimi-K2.5`                                                                     | gelen görsel anlama                              |
| Konuşmadan metne         | `openai/whisper-large-v3-turbo`                                                                       | gelen ses transkripsiyonu                              |
| Metinden konuşmaya       | `hexgrad/Kokoro-82M`                                                                                  | `messages.tts.provider: "deepinfra"`                     |
| Video oluşturma          | canlı katalogdan ilk `video-gen` etiketli giriş (statik yedek `Pixverse/Pixverse-T2V`)            | `video_generate`, `agents.defaults.videoGenerationModel` |
| Bellek embedding'leri    | `BAAI/bge-m3`                                                                                         | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra ayrıca yeniden sıralama, sınıflandırma, nesne algılama ve diğer yerel model türlerini de sunar. OpenClaw şu anda bu kategoriler için birinci sınıf sağlayıcı sözleşmelerine sahip değildir, bu nedenle bu Plugin bunları henüz kaydetmez.

## Kullanılabilir modeller

OpenClaw, başlangıçta kullanılabilir DeepInfra modellerini dinamik olarak keşfeder. Kullanılabilir modellerin tam listesini görmek için `/models deepinfra` kullanın.

[DeepInfra.com](https://deepinfra.com/) üzerinde bulunan herhangi bir model `deepinfra/` önekiyle kullanılabilir:

```
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...and many more
```

## Notlar

- Model referansları `deepinfra/<provider>/<model>` biçimindedir (ör. `deepinfra/Qwen/Qwen3-Max`).
- Varsayılan model: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- Temel URL: `https://api.deepinfra.com/v1/openai`
- Yerel video oluşturma `https://api.deepinfra.com/v1/inference/<model>` kullanır.

## İlgili

- [Model sağlayıcıları](/tr/concepts/model-providers)
- [Tüm sağlayıcılar](/tr/providers/index)

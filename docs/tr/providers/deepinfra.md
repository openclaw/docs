---
read_when:
    - En iyi açık kaynaklı LLM'ler için tek bir API anahtarı istiyorsunuz
    - OpenClaw'da modelleri DeepInfra API'si üzerinden çalıştırmak istiyorsunuz
summary: OpenClaw'da en popüler açık kaynaklı ve öncü modellere erişmek için DeepInfra'nın birleşik API'sini kullanın
title: DeepInfra
x-i18n:
    generated_at: "2026-07-12T12:42:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f68bac84311d20348007c715803a34451ba8ab0c09beba63366ba5b1b29de05
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra, istekleri tek bir OpenAI uyumlu uç nokta ve API anahtarı üzerinden popüler açık kaynak ve öncü modellere yönlendirir. Çoğu OpenAI SDK'sı, temel URL değiştirilerek bununla çalışır.

## Plugin'i yükleme

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## API anahtarı alma

1. [deepinfra.com](https://deepinfra.com/) adresinde oturum açın
2. Dashboard / Keys bölümüne gidip bir anahtar oluşturun veya otomatik oluşturulan anahtarı kullanın

## CLI kurulumu

```bash
openclaw onboard --deepinfra-api-key <key>
```

Alternatif olarak ortam değişkenini ayarlayın:

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## Yapılandırma örneği

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

## Desteklenen yüzeyler

Sohbet, görüntü oluşturma ve video oluşturma, `DEEPINFRA_API_KEY` yapılandırıldıktan sonra model kataloglarını `https://api.deepinfra.com/v1/openai/models?sort_by=openclaw&filter=with_meta` adresinden canlı olarak yeniler. Diğer yüzeyler, aynı canlı kataloğa geçene kadar aşağıdaki statik varsayılanları kullanır.

| Yüzey                    | Varsayılan model                                                                                                     | OpenClaw yapılandırması/aracı                            |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Sohbet / model sağlayıcısı | canlı katalogdaki sohbet etiketli ilk girdi (statik geri dönüş `deepseek-ai/DeepSeek-V4-Flash`)                     | `agents.defaults.model`                                 |
| Görüntü oluşturma/düzenleme | canlı katalogdaki `image-gen` etiketli ilk girdi (statik geri dönüş `black-forest-labs/FLUX-1-schnell`)            | `image_generate`, `agents.defaults.imageGenerationModel` |
| Medya anlama             | görüntüler için `moonshotai/Kimi-K2.5`                                                                                | gelen görüntüleri anlama                                |
| Konuşmayı metne dönüştürme | `openai/whisper-large-v3-turbo`                                                                                     | gelen sesleri yazıya dökme                              |
| Metni konuşmaya dönüştürme | `hexgrad/Kokoro-82M`                                                                                                | `messages.tts.provider: "deepinfra"`                    |
| Video oluşturma          | statik geri dönüş `Pixverse/Pixverse-T2V` (DeepInfra'da bugün canlı `video-gen` satırı yoktur)                       | `video_generate`, `agents.defaults.videoGenerationModel` |
| Bellek gömmeleri         | `BAAI/bge-m3`                                                                                                        | `agents.defaults.memorySearch.provider: "deepinfra"`    |

DeepInfra ayrıca yeniden sıralama, sınıflandırma, nesne algılama ve diğer yerel model türlerini de sunar. OpenClaw henüz bu kategoriler için bir sağlayıcı sözleşmesine sahip olmadığından bu Plugin bunları kaydetmez.

## Kullanılabilir modeller

Bir anahtar yapılandırıldığında OpenClaw, DeepInfra modellerini dinamik olarak keşfeder. Güncel listeyi görmek için `/models deepinfra` veya `openclaw models list --provider deepinfra` komutunu kullanın.

[deepinfra.com](https://deepinfra.com/) üzerindeki tüm modeller `deepinfra/` ön ekiyle çalışır:

```text
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...ve çok daha fazlası
```

## Notlar

- Model referansları `deepinfra/<provider>/<model>` biçimindedir (örneğin `deepinfra/Qwen/Qwen3-Max`).
- Varsayılan sohbet modeli: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- Temel URL: `https://api.deepinfra.com/v1/openai`
- Yerel video oluşturma, `https://api.deepinfra.com/v1/inference/<model>` adresini kullanır.

## İlgili

- [Model sağlayıcıları](/tr/concepts/model-providers)
- [Tüm sağlayıcılar](/tr/providers/index)

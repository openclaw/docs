---
read_when:
    - Yerel bir GGUF modelinden bellek arama gömmeleri istiyorsunuz
    - memorySearch.provider = "local" yapılandırmasını yapıyorsunuz
    - node-llama-cpp çalışma zamanının sahibi olan OpenClaw pluginine ihtiyacınız var
sidebarTitle: llama.cpp Provider
summary: Yerel GGUF bellek gömmeleri için resmi llama.cpp sağlayıcısını yükleyin
title: llama.cpp Sağlayıcısı
x-i18n:
    generated_at: "2026-07-12T12:33:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 369ec199e8493356912337b849a84f829672e8872d17083c9a597f4e5294ebd5
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp`, yerel GGUF gömmeleri için resmî harici sağlayıcı Plugin'idir. `local` gömme sağlayıcısı kimliğini kaydeder ve `memorySearch.provider: "local"` tarafından kullanılan `node-llama-cpp` çalışma zamanı bağımlılığının sahibidir.

Yerel bellek gömmelerini kullanmadan önce bunu yükleyin:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

Ana `openclaw` npm paketi `node-llama-cpp` içermez. Yerel bağımlılığın bu Plugin'de tutulması, normal OpenClaw npm güncellemelerinin OpenClaw paket dizinine elle yüklenmiş bir çalışma zamanını silmesini önler.

## Yapılandırma

`memorySearch.provider` değerini `local` olarak ayarlayın:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        local: {
          modelPath: "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

`local.modelPath` varsayılan olarak yukarıda gösterilen `hf:` URI'sini (`embeddinggemma-300m-qat-Q8_0.gguf`) kullanır. Başka bir model kullanmak için bunu farklı bir `hf:` URI'sine veya yerel bir `.gguf` dosyasına yönlendirin. `local.modelCacheDir`, indirilen modellerin önbelleğe alındığı konumu geçersiz kılar (varsayılan: `~/.node-llama-cpp/models`); `local.contextSize` ise bir tam sayı veya `"auto"` kabul eder.

`local.contextSize` sayısal olduğunda sağlayıcı, bu gereksinimi node-llama-cpp'nin otomatik GPU katmanı yerleştirmesine de iletir. Bu, node-llama-cpp'nin bellek güvenliği denetimlerini korurken modeli ve gömme bağlamını birlikte sığdırmasını sağlar. `"auto"` kullanıldığında node-llama-cpp normal otomatik yerleştirmesini sürdürür.

## Yerel Çalışma Zamanı

En sorunsuz yerel yükleme süreci için Node 24 kullanın. pnpm kullanan kaynak kod çalışma kopyalarında yerel bağımlılığa izin verilmesi ve bağımlılığın yeniden derlenmesi gerekebilir:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## Çalışma zamanı tanılamaları

Seçilen arka ucu ve derlemeyi, cihaz adlarını, GPU'ya aktarılan katmanları, istenen bağlam boyutunu ve son gözlemlenen VRAM veya birleşik bellek anlık görüntüsünü incelemek için sağlayıcı yüklendikten sonra `openclaw memory status --deep` komutunu çalıştırın. Pasif durum okumaları modeli yeniden yüklemediği veya cihazı yoklamadığı için VRAM değerleri bir gözlem zaman damgası içerir.

Çalışan Gateway yerel sağlayıcıyı daha önce kullandıysa aynı son bilinen bilgiler `openclaw doctor` içinde de görünebilir. Normal bir durum veya doctor komutu yalnızca tanılama bilgilerini toplamak için model yüklemez.

## Sorun giderme

`node-llama-cpp` eksikse veya yüklenemezse OpenClaw, hatayla birlikte şu adımları bildirir:

1. Plugin'i yükleyin: `openclaw plugins install @openclaw/llama-cpp-provider`.
2. Yerel yüklemeler/güncellemeler için Node 24 kullanın.
3. Bir pnpm kaynak kod çalışma kopyasında: `pnpm approve-builds`, ardından `pnpm rebuild node-llama-cpp`.

Yerel derleme adımı gerektirmeyen, daha az zahmetli yerel gömmeler için bunun yerine `memorySearch.provider` değerini `lmstudio`, `ollama`, `openai` veya `voyage` gibi uzak bir gömme sağlayıcısına ayarlayın.

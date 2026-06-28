---
read_when:
    - Yerel bir GGUF modelinden bellek arama gömmeleri istiyorsunuz
    - memorySearch.provider = "local" yapılandırıyorsunuz
    - node-llama-cpp çalışma zamanını sahiplenen OpenClaw Plugin’ine ihtiyacınız var
sidebarTitle: llama.cpp Provider
summary: Resmi llama.cpp sağlayıcısını yerel GGUF bellek gömmeleri için yükleyin
title: llama.cpp Sağlayıcısı
x-i18n:
    generated_at: "2026-06-28T00:54:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b0988c36c5ed5c61a7e97980df291fb43a0071e57c7460bf5a653f516114963
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp`, yerel GGUF gömmeleri için resmi harici sağlayıcı Plugin'idir.
`memorySearch.provider: "local"` tarafından kullanılan `node-llama-cpp` çalışma zamanı bağımlılığının sahibidir.

Yerel bellek gömmelerini kullanmadan önce yükleyin:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

Ana `openclaw` npm paketi `node-llama-cpp` içermez. Yerel bağımlılığın bu Plugin içinde tutulması, normal OpenClaw npm güncellemelerinin OpenClaw paket dizini içinde elle yüklenmiş bir çalışma zamanını silmesini önler.

## Yapılandırma

Bellek arama sağlayıcısını `local` olarak ayarlayın:

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

Varsayılan model `embeddinggemma-300m-qat-Q8_0.gguf` şeklindedir. `local.modelPath` değerini yerel bir `.gguf` dosyasına da yönlendirebilirsiniz.

## Yerel Çalışma Zamanı

En sorunsuz yerel kurulum yolu için Node 24 kullanın. pnpm kullanan kaynak checkout'larının yerel bağımlılığı onaylaması ve yeniden derlemesi gerekebilir:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

Daha az sorunlu yerel gömmeler için bunun yerine Ollama veya LM Studio gibi yerel bir hizmet sağlayıcısı kullanın.

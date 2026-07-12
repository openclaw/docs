---
read_when:
    - Varsayılan bellek arka ucunu anlamak istiyorsunuz
    - Gömme sağlayıcılarını veya hibrit aramayı yapılandırmak istiyorsunuz
summary: Anahtar kelime, vektör ve hibrit arama özelliklerine sahip varsayılan SQLite tabanlı bellek arka ucu
title: Yerleşik bellek motoru
x-i18n:
    generated_at: "2026-07-12T12:13:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8cbe2bae73b1d393ac158edb67fc442e76d1e5ff93e5201dbb7e7216801aa85
    source_path: concepts/memory-builtin.md
    workflow: 16
---

Yerleşik motor, varsayılan bellek arka ucudur. Bellek dizininizi her ajan için ayrı bir SQLite veritabanında saklar ve başlamak için ek bağımlılık gerektirmez.

## Sağladıkları

- FTS5 tam metin dizinleme (BM25 puanlaması) aracılığıyla **anahtar sözcük araması**.
- Desteklenen herhangi bir sağlayıcıdan alınan gömmeler aracılığıyla **vektör araması**.
- En iyi sonuçlar için ikisini birleştiren **hibrit arama**.
- Çince, Japonca ve Korece için trigram belirteçleştirme aracılığıyla **CJK desteği**.
- Veritabanı içi vektör sorguları için **sqlite-vec hızlandırması** (isteğe bağlı).

## Başlarken

Yerleşik motor varsayılan olarak OpenAI gömmelerini kullanır. `OPENAI_API_KEY` veya `models.providers.openai.apiKey` zaten yapılandırılmışsa vektör araması ek bellek yapılandırması olmadan çalışır.

Bir sağlayıcıyı açıkça ayarlamak için:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
      },
    },
  },
}
```

Bir gömme sağlayıcısı olmadan yalnızca anahtar sözcük araması kullanılabilir.

Yerel GGUF gömmelerini zorunlu kılmak için resmi llama.cpp sağlayıcı Plugin'ini yükleyin, ardından `local.modelPath` değerini bir GGUF dosyasına yönlendirin:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        fallback: "none",
        local: {
          modelPath: "~/.node-llama-cpp/models/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

## Desteklenen gömme sağlayıcıları

| Sağlayıcı         | Kimlik              | Notlar                                      |
| ----------------- | ------------------- | ------------------------------------------- |
| Bedrock           | `bedrock`           | AWS kimlik bilgisi zincirini kullanır       |
| DeepInfra         | `deepinfra`         | Varsayılan: `BAAI/bge-m3`                   |
| Gemini            | `gemini`            | Çoklu ortamı destekler (görüntü + ses)      |
| GitHub Copilot    | `github-copilot`    | Copilot aboneliğinizi kullanır               |
| LM Studio         | `lmstudio`          | Yerel/kendi sunucunuzda barındırılan         |
| Yerel             | `local`             | `@openclaw/llama-cpp-provider`              |
| Mistral           | `mistral`           |                                             |
| Ollama            | `ollama`            | Yerel/kendi sunucunuzda barındırılan         |
| OpenAI            | `openai`            | Varsayılan: `text-embedding-3-small`         |
| OpenAI uyumlu     | `openai-compatible` | Genel `/v1/embeddings` uç noktası            |
| Voyage            | `voyage`            |                                             |

OpenAI yerine başka bir sağlayıcı kullanmak için `memorySearch.provider` değerini ayarlayın.

## Dizinleme nasıl çalışır?

OpenClaw, `MEMORY.md` ve `memory/*.md` dosyalarını parçalara (varsayılan olarak 80 belirteç örtüşmeli 400 belirteç) ayırarak dizinler ve bunları her ajan için ayrı bir SQLite veritabanında saklar.

- **Dizin konumu:** sahibi olan ajan veritabanı:
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Depolama bakımı:** SQLite WAL yan dosyaları, düzenli aralıklarla ve kapatma sırasında gerçekleştirilen kontrol noktalarıyla sınırlandırılır.
- **Dosya izleme:** bellek dosyalarındaki değişiklikler, gecikmeli bir yeniden dizinlemeyi tetikler (varsayılan 1,5 sn).
- **Otomatik yeniden dizinleme:** gömme sağlayıcısı, model, parçalama yapılandırması, yapılandırılmış kaynaklar veya kapsam değiştiğinde dizin otomatik olarak yeniden oluşturulur.
- **İsteğe bağlı yeniden dizinleme:** `openclaw memory index --force`

<Info>
Çalışma alanı dışındaki Markdown dosyalarını da `memorySearch.extraPaths` ile dizinleyebilirsiniz. Bkz. [yapılandırma başvurusu](/tr/reference/memory-config#additional-memory-paths).
</Info>

## Ne zaman kullanılmalı?

Yerleşik motor çoğu kullanıcı için doğru seçimdir:

- Ek bağımlılık gerektirmeden doğrudan çalışır.
- Anahtar sözcük ve vektör aramasını iyi şekilde gerçekleştirir.
- Tüm gömme sağlayıcılarını destekler.
- Hibrit arama, her iki getirme yaklaşımının en iyi yönlerini birleştirir.

Yeniden sıralamaya, sorgu genişletmeye ihtiyacınız varsa veya çalışma alanı dışındaki dizinleri dizinlemek istiyorsanız [QMD](/tr/concepts/memory-qmd) kullanmayı değerlendirin.

Otomatik kullanıcı modellemeli, oturumlar arası bellek istiyorsanız [Honcho](/tr/concepts/memory-honcho) kullanmayı değerlendirin.

## Sorun giderme

**Bellek araması devre dışı mı?** `openclaw memory status` komutunu kontrol edin. Hiçbir sağlayıcı algılanmazsa açıkça bir sağlayıcı ayarlayın veya bir API anahtarı ekleyin.

**Yerel sağlayıcı algılanmıyor mu?** Yerel yolun mevcut olduğunu doğrulayın ve şunları çalıştırın:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Hem bağımsız CLI komutları hem de Gateway aynı `local` sağlayıcı kimliğini kullanır. Yerel gömmeler istediğinizde `memorySearch.provider: "local"` ayarını kullanın.

**Sonuçlar güncel değil mi?** Yeniden oluşturmak için `openclaw memory index --force` komutunu çalıştırın. İzleyici, nadir uç durumlarda değişiklikleri kaçırabilir.

**sqlite-vec yüklenmiyor mu?** OpenClaw otomatik olarak süreç içi kosinüs benzerliğine geri döner. `openclaw memory status --deep`, yerel vektör deposunu gömme sağlayıcısından ayrı olarak bildirir; bu nedenle `Vector store: unavailable`, sqlite-vec yüklemesine işaret ederken `Embeddings: unavailable`, sağlayıcı/kimlik doğrulama veya modelin hazır olma durumuna işaret eder. Belirli yükleme hatası için günlükleri kontrol edin.

## Yapılandırma

Gömme sağlayıcısı kurulumu, hibrit arama ayarlaması (ağırlıklar, MMR, zamansal azalma), toplu dizinleme, çoklu ortam belleği, sqlite-vec, ek yollar ve diğer tüm yapılandırma seçenekleri için [Bellek yapılandırması başvurusuna](/tr/reference/memory-config) bakın.

## İlgili

- [Belleğe genel bakış](/tr/concepts/memory)
- [Bellek araması](/tr/concepts/memory-search)
- [Active Memory](/tr/concepts/active-memory)

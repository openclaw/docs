---
read_when:
    - Varsayılan bellek backend'ini anlamak istiyorsunuz
    - Embedding sağlayıcılarını veya hibrit aramayı yapılandırmak istiyorsunuz
summary: Varsayılan SQLite tabanlı bellek backend'i; anahtar kelime, vektör ve hibrit arama ile
title: Yerleşik bellek motoru
x-i18n:
    generated_at: "2026-04-24T09:05:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: f82c1f4dc37b4fc6c075a7fcd2ec78bfcbfbebbcba7e48d366a1da3afcaff508
    source_path: concepts/memory-builtin.md
    workflow: 15
---

Yerleşik motor, varsayılan bellek backend'idir. Bellek dizininizi
agent başına bir SQLite veritabanında saklar ve başlamak için ek bağımlılık gerektirmez.

## Sağladıkları

- FTS5 tam metin indeksleme (BM25 puanlama) ile **anahtar kelime araması**.
- Desteklenen herhangi bir sağlayıcıdan embedding'lerle **vektör araması**.
- En iyi sonuçlar için ikisini birleştiren **hibrit arama**.
- Çince, Japonca ve Korece için trigram tokenization ile **CJK desteği**.
- Veritabanı içi vektör sorguları için **sqlite-vec hızlandırması** (isteğe bağlı).

## Başlarken

OpenAI, Gemini, Voyage veya Mistral için bir API anahtarınız varsa yerleşik
motor bunu otomatik algılar ve vektör aramasını etkinleştirir. Yapılandırma gerekmez.

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

Bir embedding sağlayıcısı olmadan yalnızca anahtar kelime araması kullanılabilir.

Yerleşik yerel embedding sağlayıcısını zorlamak için `local.modelPath` değerini bir
GGUF dosyasına yönlendirin:

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

## Desteklenen embedding sağlayıcıları

| Sağlayıcı | Kimlik     | Otomatik algılanır | Notlar                              |
| --------- | ---------- | ------------------ | ----------------------------------- |
| OpenAI    | `openai`   | Evet               | Varsayılan: `text-embedding-3-small` |
| Gemini    | `gemini`   | Evet               | Çok modlu desteği vardır (görüntü + ses) |
| Voyage    | `voyage`   | Evet               |                                     |
| Mistral   | `mistral`  | Evet               |                                     |
| Ollama    | `ollama`   | Hayır              | Yerel, açıkça ayarlayın             |
| Local     | `local`    | Evet (ilk)         | GGUF model, ~0.6 GB indirme         |

Otomatik algılama, API anahtarı çözümlenebilen ilk sağlayıcıyı
gösterilen sırayla seçer. Geçersiz kılmak için `memorySearch.provider` ayarlayın.

## İndeksleme nasıl çalışır

OpenClaw, `MEMORY.md` ve `memory/*.md` dosyalarını parçalar halinde (~400 token,
80 token örtüşme ile) indeksler ve bunları agent başına bir SQLite veritabanında saklar.

- **Dizin konumu:** `~/.openclaw/memory/<agentId>.sqlite`
- **Dosya izleme:** bellek dosyalarındaki değişiklikler debounce uygulanmış bir yeniden indekslemeyi tetikler (1.5 sn).
- **Otomatik yeniden indeksleme:** embedding sağlayıcısı, model veya parçalara ayırma yapılandırması
  değiştiğinde tüm dizin otomatik olarak yeniden oluşturulur.
- **İsteğe bağlı yeniden indeksleme:** `openclaw memory index --force`

<Info>
Ayrıca çalışma alanı dışındaki Markdown dosyalarını da
`memorySearch.extraPaths` ile indeksleyebilirsiniz. Bkz.
[yapılandırma başvurusu](/tr/reference/memory-config#additional-memory-paths).
</Info>

## Ne zaman kullanılmalı

Yerleşik motor, çoğu kullanıcı için doğru seçimdir:

- Ek bağımlılık olmadan kutudan çıktığı gibi çalışır.
- Anahtar kelime ve vektör aramasını iyi işler.
- Tüm embedding sağlayıcılarını destekler.
- Hibrit arama, iki erişim yaklaşımının en iyisini birleştirir.

Yeniden sıralama, sorgu
genişletme veya çalışma alanı dışındaki dizinleri indeksleme ihtiyacınız varsa [QMD](/tr/concepts/memory-qmd) kullanmaya geçmeyi değerlendirin.

Otomatik kullanıcı modelleme ile oturumlar arası bellek istiyorsanız
[Honcho](/tr/concepts/memory-honcho) seçeneğini değerlendirin.

## Sorun giderme

**Bellek araması devre dışı mı?** `openclaw memory status` kontrol edin. Hiç sağlayıcı
algılanmıyorsa birini açıkça ayarlayın veya bir API anahtarı ekleyin.

**Yerel sağlayıcı algılanmıyor mu?** Yerel yolun mevcut olduğunu doğrulayın ve şunu çalıştırın:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Hem bağımsız CLI komutları hem de Gateway aynı `local` sağlayıcı kimliğini kullanır.
Sağlayıcı `auto` olarak ayarlanmışsa, yerel embedding'ler yalnızca
`memorySearch.local.modelPath` mevcut bir yerel dosyaya işaret ettiğinde önce değerlendirilir.

**Sonuçlar eski mi?** Yeniden oluşturmak için `openclaw memory index --force` çalıştırın. İzleyici
nadir uç durumlarda değişiklikleri kaçırabilir.

**sqlite-vec yüklenmiyor mu?** OpenClaw otomatik olarak süreç içi cosine similarity'ye geri düşer. Belirli yükleme hatası için günlükleri kontrol edin.

## Yapılandırma

Embedding sağlayıcısı kurulumu, hibrit arama ayarı (ağırlıklar, MMR, zamansal
azalma), toplu indeksleme, çok modlu bellek, sqlite-vec, ek yollar ve diğer
tüm yapılandırma düğmeleri için
[Memory configuration reference](/tr/reference/memory-config) sayfasına bakın.

## İlgili

- [Memory overview](/tr/concepts/memory)
- [Memory search](/tr/concepts/memory-search)
- [Active memory](/tr/concepts/active-memory)

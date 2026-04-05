---
read_when:
    - Varsayılan bellek arka ucunu anlamak istiyorsunuz
    - Embedding sağlayıcılarını veya hibrit aramayı yapılandırmak istiyorsunuz
summary: Anahtar sözcük, vektör ve hibrit aramayla varsayılan SQLite tabanlı bellek arka ucu
title: Yerleşik Bellek Motoru
x-i18n:
    generated_at: "2026-04-05T13:50:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 181c40a43332315bf915ff6f395d9d5fd766c889e1a8d1aa525f9ba0198d3367
    source_path: concepts/memory-builtin.md
    workflow: 15
---

# Yerleşik Bellek Motoru

Yerleşik motor, varsayılan bellek arka ucudur. Bellek dizininizi aracı başına
bir SQLite veritabanında saklar ve başlamak için ek bağımlılık gerektirmez.

## Sağladıkları

- FTS5 tam metin dizinleme (BM25 puanlama) aracılığıyla **anahtar sözcük araması**.
- Desteklenen herhangi bir sağlayıcıdan embedding'ler aracılığıyla **vektör araması**.
- En iyi sonuçlar için ikisini birleştiren **hibrit arama**.
- Çince, Japonca ve Korece için trigram tokenizasyonu aracılığıyla **CJK desteği**.
- Veritabanı içi vektör sorguları için **sqlite-vec hızlandırması** (isteğe bağlı).

## Başlangıç

OpenAI, Gemini, Voyage veya Mistral için bir API anahtarınız varsa, yerleşik
motor bunu otomatik olarak algılar ve vektör aramayı etkinleştirir. Yapılandırma gerekmez.

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

Bir embedding sağlayıcısı olmadan yalnızca anahtar sözcük araması kullanılabilir.

## Desteklenen embedding sağlayıcıları

| Sağlayıcı | Kimlik    | Otomatik algılanır | Notlar                              |
| --------- | --------- | ------------------ | ----------------------------------- |
| OpenAI    | `openai`  | Evet               | Varsayılan: `text-embedding-3-small` |
| Gemini    | `gemini`  | Evet               | Çok modluyu destekler (görüntü + ses) |
| Voyage    | `voyage`  | Evet               |                                     |
| Mistral   | `mistral` | Evet               |                                     |
| Ollama    | `ollama`  | Hayır              | Yerel, açıkça ayarlanmalıdır        |
| Local     | `local`   | Evet (ilk)         | GGUF modeli, ~0.6 GB indirme        |

Otomatik algılama, yukarıda gösterilen sırayla API anahtarı çözümlenebilen ilk sağlayıcıyı seçer. Geçersiz kılmak için `memorySearch.provider` ayarlayın.

## Dizinleme nasıl çalışır

OpenClaw, `MEMORY.md` ve `memory/*.md` dosyalarını parçalar hâlinde (~400 token,
80 token çakışma ile) dizinler ve bunları aracı başına bir SQLite veritabanında saklar.

- **Dizin konumu:** `~/.openclaw/memory/<agentId>.sqlite`
- **Dosya izleme:** bellek dosyalarındaki değişiklikler gecikmeli bir yeniden dizinlemeyi tetikler (1.5 sn).
- **Otomatik yeniden dizinleme:** embedding sağlayıcısı, model veya parçalama yapılandırması değiştiğinde tüm dizin otomatik olarak yeniden oluşturulur.
- **İstek üzerine yeniden dizinleme:** `openclaw memory index --force`

<Info>
`memorySearch.extraPaths` ile çalışma alanı dışındaki Markdown dosyalarını da
dizinleyebilirsiniz. Bkz.
[yapılandırma başvurusu](/reference/memory-config#additional-memory-paths).
</Info>

## Ne zaman kullanılmalı

Yerleşik motor, çoğu kullanıcı için doğru seçimdir:

- Ek bağımlılık olmadan kutudan çıktığı gibi çalışır.
- Anahtar sözcük ve vektör aramasını iyi şekilde işler.
- Tüm embedding sağlayıcılarını destekler.
- Hibrit arama, her iki getirme yaklaşımının en iyi yönlerini birleştirir.

Yeniden sıralama, sorgu genişletme gerekiyorsa veya çalışma alanı dışındaki dizinleri dizinlemek istiyorsanız [QMD](/concepts/memory-qmd)'ye geçmeyi değerlendirin.

Otomatik kullanıcı modelleme ile oturumlar arası bellek istiyorsanız [Honcho](/concepts/memory-honcho)'yu değerlendirin.

## Sorun giderme

**Bellek araması devre dışı mı?** `openclaw memory status` komutunu kontrol edin. Hiçbir sağlayıcı algılanmıyorsa birini açıkça ayarlayın veya bir API anahtarı ekleyin.

**Sonuçlar eski mi?** Yeniden oluşturmak için `openclaw memory index --force` çalıştırın. İzleyici nadir uç durumlarda değişiklikleri kaçırabilir.

**sqlite-vec yüklenmiyor mu?** OpenClaw otomatik olarak işlem içi cosine similarity kullanımına geri döner. Belirli yükleme hatası için günlükleri kontrol edin.

## Yapılandırma

Embedding sağlayıcı kurulumu, hibrit arama ayarı (ağırlıklar, MMR, zamansal
azalma), toplu dizinleme, çok modlu bellek, sqlite-vec, ek yollar ve diğer tüm
yapılandırma seçenekleri için bkz.
[Bellek yapılandırma başvurusu](/reference/memory-config).

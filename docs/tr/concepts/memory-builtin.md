---
read_when:
    - Varsayılan bellek arka ucunu anlamak istiyorsunuz
    - Gömme sağlayıcılarını veya hibrit aramayı yapılandırmak istiyorsunuz
summary: Anahtar kelime, vektör ve hibrit arama özelliklerine sahip varsayılan SQLite tabanlı bellek arka ucu
title: Yerleşik bellek motoru
x-i18n:
    generated_at: "2026-05-03T21:30:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72f5d1fee02bff0962bd012575b62846c1f11c030fd1174fdb2af1e81909f52a
    source_path: concepts/memory-builtin.md
    workflow: 16
---

Yerleşik motor varsayılan bellek arka ucudur. Bellek dizininizi ajan başına
ayrı bir SQLite veritabanında saklar ve başlamak için ek bağımlılık gerektirmez.

## Neler sağlar

- FTS5 tam metin dizinleme ile **anahtar sözcük araması** (BM25 puanlaması).
- Desteklenen herhangi bir sağlayıcıdan gelen yerleştirmelerle **vektör araması**.
- En iyi sonuçlar için ikisini birleştiren **hibrit arama**.
- Çince, Japonca ve Korece için trigram belirteçleştirme ile **CJK desteği**.
- Veritabanı içi vektör sorguları için **sqlite-vec hızlandırması** (isteğe bağlı).

## Başlarken

OpenAI, Gemini, Voyage, Mistral veya DeepInfra için bir API anahtarınız varsa, yerleşik
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

Yerleştirme sağlayıcısı olmadan yalnızca anahtar sözcük araması kullanılabilir.

Yerleşik yerel yerleştirme sağlayıcısını zorunlu kılmak için, isteğe bağlı
`node-llama-cpp` çalışma zamanı paketini OpenClaw yanına kurun, ardından `local.modelPath`
değerini bir GGUF dosyasına yönlendirin:

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

## Desteklenen yerleştirme sağlayıcıları

| Sağlayıcı | Kimlik      | Otomatik algılanır | Notlar                              |
| --------- | ----------- | ------------------ | ----------------------------------- |
| OpenAI    | `openai`    | Evet               | Varsayılan: `text-embedding-3-small` |
| Gemini    | `gemini`    | Evet               | Çok modluyu destekler (görüntü + ses) |
| Voyage    | `voyage`    | Evet               |                                     |
| Mistral   | `mistral`   | Evet               |                                     |
| DeepInfra | `deepinfra` | Evet               | Varsayılan: `BAAI/bge-m3`           |
| Ollama    | `ollama`    | Hayır              | Yerel, açıkça ayarlayın             |
| Yerel     | `local`     | Evet (ilk)         | İsteğe bağlı `node-llama-cpp` çalışma zamanı |

Otomatik algılama, API anahtarı çözümlenebilen ilk sağlayıcıyı gösterilen
sıraya göre seçer. Geçersiz kılmak için `memorySearch.provider` değerini ayarlayın.

## Dizinleme nasıl çalışır

OpenClaw, `MEMORY.md` ve `memory/*.md` dosyalarını parçalara (~400 belirteç ve
80 belirteç çakışma) dizinler ve bunları ajan başına ayrı bir SQLite veritabanında saklar.

- **Dizin konumu:** `~/.openclaw/memory/<agentId>.sqlite`
- **Depolama bakımı:** SQLite WAL yan dosyaları periyodik ve kapatma
  denetim noktalarıyla sınırlandırılır.
- **Dosya izleme:** bellek dosyalarındaki değişiklikler gecikmeli yeniden dizinlemeyi tetikler (1,5 sn).
- **Otomatik yeniden dizinleme:** yerleştirme sağlayıcısı, model veya parçalama yapılandırması
  değiştiğinde, tüm dizin otomatik olarak yeniden oluşturulur.
- **İsteğe bağlı yeniden dizinleme:** `openclaw memory index --force`

<Info>
`memorySearch.extraPaths` ile çalışma alanının dışındaki Markdown dosyalarını da
dizinleyebilirsiniz. Bkz.
[yapılandırma başvurusu](/tr/reference/memory-config#additional-memory-paths).
</Info>

## Ne zaman kullanılmalı

Yerleşik motor çoğu kullanıcı için doğru seçimdir:

- Ek bağımlılık olmadan kullanıma hazır çalışır.
- Anahtar sözcük ve vektör aramasını iyi işler.
- Tüm yerleştirme sağlayıcılarını destekler.
- Hibrit arama, iki geri getirme yaklaşımının en iyilerini birleştirir.

Yeniden sıralama, sorgu genişletme gerekiyorsa veya çalışma alanı dışındaki
dizinleri dizinlemek istiyorsanız [QMD](/tr/concepts/memory-qmd) seçeneğine geçmeyi düşünün.

Otomatik kullanıcı modellemesiyle oturumlar arası bellek istiyorsanız
[Honcho](/tr/concepts/memory-honcho) seçeneğini düşünün.

## Sorun giderme

**Bellek araması devre dışı mı?** `openclaw memory status` komutunu kontrol edin. Hiç sağlayıcı
algılanmazsa, birini açıkça ayarlayın veya bir API anahtarı ekleyin.

**Yerel sağlayıcı algılanmadı mı?** Yerel yolun var olduğunu doğrulayın ve şunu çalıştırın:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Hem bağımsız CLI komutları hem de Gateway aynı `local` sağlayıcı kimliğini kullanır.
Sağlayıcı `auto` olarak ayarlanırsa, yerel yerleştirmeler yalnızca
`memorySearch.local.modelPath` var olan bir yerel dosyaya işaret ettiğinde ilk olarak değerlendirilir.

**Sonuçlar güncel değil mi?** Yeniden oluşturmak için `openclaw memory index --force` komutunu çalıştırın. İzleyici
nadir uç durumlarda değişiklikleri kaçırabilir.

**sqlite-vec yüklenmiyor mu?** OpenClaw otomatik olarak işlem içi kosinüs benzerliğine
geri döner. `openclaw memory status --deep`, yerel vektör deposunu yerleştirme sağlayıcısından
ayrı olarak raporlar; bu nedenle `Vector store: unavailable` sqlite-vec yüklemesini,
`Embeddings: unavailable` ise sağlayıcı/kimlik doğrulama veya model hazır olma durumunu
işaret eder. Belirli yükleme hatası için günlükleri kontrol edin.

## Yapılandırma

Yerleştirme sağlayıcısı kurulumu, hibrit arama ayarı (ağırlıklar, MMR, zamansal
azalma), toplu dizinleme, çok modlu bellek, sqlite-vec, ek yollar ve diğer tüm
yapılandırma düğmeleri için
[Bellek yapılandırması başvurusu](/tr/reference/memory-config) bölümüne bakın.

## İlgili

- [Belleğe genel bakış](/tr/concepts/memory)
- [Bellek araması](/tr/concepts/memory-search)
- [Active Memory](/tr/concepts/active-memory)

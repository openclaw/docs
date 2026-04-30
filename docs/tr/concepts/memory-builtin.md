---
read_when:
    - Varsayılan bellek arka ucunu anlamak istiyorsunuz
    - Gömme sağlayıcılarını veya hibrit aramayı yapılandırmak istiyorsunuz
summary: Anahtar sözcük, vektör ve hibrit arama özelliklerine sahip varsayılan SQLite tabanlı bellek arka ucu
title: Yerleşik bellek motoru
x-i18n:
    generated_at: "2026-04-30T09:16:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: aa1597a9a49a6f1124cedf49f6f5a4c336f76dd5998ced246affb9c2e8171f05
    source_path: concepts/memory-builtin.md
    workflow: 16
---

Yerleşik motor, varsayılan bellek arka ucudur. Bellek dizininizi
ajan başına bir SQLite veritabanında depolar ve başlamak için ek bağımlılık gerektirmez.

## Neler sağlar

- FTS5 tam metin dizinleme (BM25 puanlama) ile **anahtar sözcük araması**.
- Desteklenen herhangi bir sağlayıcıdan alınan gömmelerle **vektör araması**.
- En iyi sonuçlar için ikisini birleştiren **hibrit arama**.
- Çince, Japonca ve Korece için trigram belirteçleme ile **CJK desteği**.
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

Bir gömme sağlayıcısı olmadan yalnızca anahtar sözcük araması kullanılabilir.

Yerleşik yerel gömme sağlayıcısını zorunlu kılmak için, isteğe bağlı
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

## Desteklenen gömme sağlayıcıları

| Sağlayıcı | ID          | Otomatik algılanır | Notlar                              |
| --------- | ----------- | ------------------ | ----------------------------------- |
| OpenAI    | `openai`    | Evet               | Varsayılan: `text-embedding-3-small` |
| Gemini    | `gemini`    | Evet               | Çok modluyu destekler (görüntü + ses) |
| Voyage    | `voyage`    | Evet               |                                     |
| Mistral   | `mistral`   | Evet               |                                     |
| DeepInfra | `deepinfra` | Evet               | Varsayılan: `BAAI/bge-m3`           |
| Ollama    | `ollama`    | Hayır              | Yerel, açıkça ayarlayın            |
| Yerel     | `local`     | Evet (ilk)         | İsteğe bağlı `node-llama-cpp` çalışma zamanı |

Otomatik algılama, API anahtarı çözümlenebilen ilk sağlayıcıyı gösterilen
sırayla seçer. Geçersiz kılmak için `memorySearch.provider` değerini ayarlayın.

## Dizinleme nasıl çalışır

OpenClaw, `MEMORY.md` ve `memory/*.md` dosyalarını parçalara (~400 belirteç,
80 belirteç örtüşme ile) ayırarak dizinler ve bunları ajan başına bir SQLite veritabanında depolar.

- **Dizin konumu:** `~/.openclaw/memory/<agentId>.sqlite`
- **Depolama bakımı:** SQLite WAL yan dosyaları periyodik ve
  kapanış kontrol noktalarıyla sınırlanır.
- **Dosya izleme:** bellek dosyalarındaki değişiklikler gecikmeli yeniden dizinlemeyi tetikler (1,5 sn).
- **Otomatik yeniden dizinleme:** gömme sağlayıcısı, model veya parçalama yapılandırması
  değiştiğinde tüm dizin otomatik olarak yeniden oluşturulur.
- **İsteğe bağlı yeniden dizinleme:** `openclaw memory index --force`

<Info>
`memorySearch.extraPaths` ile çalışma alanı dışındaki Markdown dosyalarını da dizinleyebilirsiniz. Bkz.
[yapılandırma referansı](/tr/reference/memory-config#additional-memory-paths).
</Info>

## Ne zaman kullanılmalı

Yerleşik motor çoğu kullanıcı için doğru seçimdir:

- Ek bağımlılık olmadan hazır çalışır.
- Anahtar sözcük ve vektör aramasını iyi yönetir.
- Tüm gömme sağlayıcılarını destekler.
- Hibrit arama, iki alma yaklaşımının en iyi yanlarını birleştirir.

Yeniden sıralama, sorgu genişletme veya çalışma alanı dışındaki dizinleri dizinleme
ihtiyacınız varsa [QMD](/tr/concepts/memory-qmd) kullanmayı düşünün.

Otomatik kullanıcı modelleme ile oturumlar arası bellek istiyorsanız
[Honcho](/tr/concepts/memory-honcho) kullanmayı düşünün.

## Sorun giderme

**Bellek araması devre dışı mı?** `openclaw memory status` komutunu kontrol edin. Hiçbir sağlayıcı
algılanmazsa birini açıkça ayarlayın veya bir API anahtarı ekleyin.

**Yerel sağlayıcı algılanmadı mı?** Yerel yolun var olduğunu doğrulayın ve şunu çalıştırın:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Hem bağımsız CLI komutları hem de Gateway aynı `local` sağlayıcı kimliğini kullanır.
Sağlayıcı `auto` olarak ayarlanmışsa, yerel gömmeler yalnızca
`memorySearch.local.modelPath` mevcut bir yerel dosyayı gösterdiğinde önce değerlendirilir.

**Eski sonuçlar mı?** Yeniden oluşturmak için `openclaw memory index --force` komutunu çalıştırın. İzleyici
nadir uç durumlarda değişiklikleri kaçırabilir.

**sqlite-vec yüklenmiyor mu?** OpenClaw otomatik olarak süreç içi kosinüs benzerliğine
geri döner. Belirli yükleme hatası için günlükleri kontrol edin.

## Yapılandırma

Gömme sağlayıcısı kurulumu, hibrit arama ayarı (ağırlıklar, MMR, zamansal
azalma), toplu dizinleme, çok modlu bellek, sqlite-vec, ek yollar ve diğer tüm
yapılandırma ayarları için
[Bellek yapılandırma referansı](/tr/reference/memory-config) bölümüne bakın.

## İlgili

- [Belleğe genel bakış](/tr/concepts/memory)
- [Bellek araması](/tr/concepts/memory-search)
- [Active Memory](/tr/concepts/active-memory)

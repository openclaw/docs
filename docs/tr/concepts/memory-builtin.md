---
read_when:
    - Varsayılan bellek arka ucunu anlamak istiyorsunuz
    - OpenClaw Docs i18n girdisini çevirmek istiyorsunuz
summary: Anahtar sözcük, vektör ve hibrit arama özelliklerine sahip varsayılan SQLite tabanlı bellek arka ucu
title: Yerleşik bellek motoru
x-i18n:
    generated_at: "2026-06-28T00:28:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a867bd295778f81109b258a63a35a1683d652d4564e44335053af4d86f90584e
    source_path: concepts/memory-builtin.md
    workflow: 16
---

Yerleşik motor varsayılan bellek arka ucudur. Bellek dizininizi ajan başına
SQLite veritabanında saklar ve başlamak için ek bağımlılık gerektirmez.

## Neler sağlar

- FTS5 tam metin dizinleme (BM25 puanlama) ile **anahtar sözcük araması**.
- Desteklenen herhangi bir sağlayıcıdan gelen gömmeler ile **vektör araması**.
- En iyi sonuçlar için ikisini birleştiren **hibrit arama**.
- Çince, Japonca ve Korece için trigram tokenizasyonuyla **CJK desteği**.
- Veritabanı içi vektör sorguları için **sqlite-vec hızlandırması** (isteğe bağlı).

## Başlarken

Varsayılan olarak yerleşik motor OpenAI gömmelerini kullanır. Zaten
`OPENAI_API_KEY` veya `models.providers.openai.apiKey` yapılandırdıysanız,
vektör araması ek bellek yapılandırması olmadan çalışır.

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

Yerel GGUF gömmelerini zorunlu kılmak için resmi llama.cpp sağlayıcı Plugin'ini
kurun, ardından `local.modelPath` değerini bir GGUF dosyasına yönlendirin:

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

| Sağlayıcı         | ID                  | Notlar                              |
| ----------------- | ------------------- | ----------------------------------- |
| Bedrock           | `bedrock`           | AWS kimlik bilgisi zincirini kullanır |
| DeepInfra         | `deepinfra`         | Varsayılan: `BAAI/bge-m3`           |
| Gemini            | `gemini`            | Çok modluyu destekler (görüntü + ses) |
| GitHub Copilot    | `github-copilot`    | Copilot aboneliğini kullanır        |
| Yerel             | `local`             | `@openclaw/llama-cpp-provider`      |
| Mistral           | `mistral`           |                                     |
| Ollama            | `ollama`            | Yerel/kendi barındırmalı            |
| OpenAI            | `openai`            | Varsayılan: `text-embedding-3-small` |
| OpenAI uyumlu     | `openai-compatible` | Genel `/v1/embeddings` uç noktası   |
| Voyage            | `voyage`            |                                     |

OpenAI'dan ayrılmak için `memorySearch.provider` değerini ayarlayın.

## Dizinleme nasıl çalışır

OpenClaw, `MEMORY.md` ve `memory/*.md` dosyalarını parçalara (~400 token,
80 token örtüşme ile) dizinler ve ajan başına bir SQLite veritabanında saklar.

- **Dizin konumu:** sahip olan ajan veritabanı:
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Depolama bakımı:** SQLite WAL yan dosyaları periyodik ve kapanış
  checkpoint'leriyle sınırlandırılır.
- **Dosya izleme:** bellek dosyalarındaki değişiklikler gecikmeli yeniden
  dizinlemeyi tetikler (1,5 sn).
- **Otomatik yeniden dizinleme:** gömme sağlayıcısı, model veya parçalama
  yapılandırması değiştiğinde tüm dizin otomatik olarak yeniden oluşturulur.
- **İsteğe bağlı yeniden dizinleme:** `openclaw memory index --force`

<Info>
`memorySearch.extraPaths` ile çalışma alanı dışındaki Markdown dosyalarını da
dizinleyebilirsiniz. Bkz.
[yapılandırma başvurusu](/tr/reference/memory-config#additional-memory-paths).
</Info>

## Ne zaman kullanılmalı

Yerleşik motor çoğu kullanıcı için doğru seçimdir:

- Ek bağımlılık olmadan kutudan çıktığı gibi çalışır.
- Anahtar sözcük ve vektör aramasını iyi şekilde işler.
- Tüm gömme sağlayıcılarını destekler.
- Hibrit arama, iki getirme yaklaşımının en iyi yönlerini birleştirir.

Yeniden sıralama, sorgu genişletme gerekiyorsa veya çalışma alanı dışındaki
dizinleri dizinlemek istiyorsanız [QMD](/tr/concepts/memory-qmd) seçeneğine geçmeyi
düşünün.

Otomatik kullanıcı modelleme ile oturumlar arası bellek istiyorsanız
[Honcho](/tr/concepts/memory-honcho) seçeneğini düşünün.

## Sorun giderme

**Bellek araması devre dışı mı?** `openclaw memory status` komutunu kontrol edin.
Hiçbir sağlayıcı algılanmazsa, birini açıkça ayarlayın veya bir API anahtarı ekleyin.

**Yerel sağlayıcı algılanmıyor mu?** Yerel yolun var olduğunu doğrulayın ve şunu çalıştırın:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Hem bağımsız CLI komutları hem de Gateway aynı `local` sağlayıcı kimliğini
kullanır. Yerel gömmeler istediğinizde `memorySearch.provider: "local"` ayarlayın.

**Sonuçlar bayat mı?** Yeniden oluşturmak için `openclaw memory index --force`
çalıştırın. İzleyici nadir uç durumlarda değişiklikleri kaçırabilir.

**sqlite-vec yüklenmiyor mu?** OpenClaw otomatik olarak süreç içi kosinüs
benzerliğine geri döner. `openclaw memory status --deep`, yerel vektör deposunu
gömme sağlayıcısından ayrı bildirir; bu nedenle `Vector store: unavailable`
sqlite-vec yüklemesine, `Embeddings: unavailable` ise sağlayıcı/kimlik doğrulama
veya model hazır olma durumuna işaret eder. Belirli yükleme hatası için günlükleri
kontrol edin.

## Yapılandırma

Gömme sağlayıcısı kurulumu, hibrit arama ayarı (ağırlıklar, MMR, zamansal
azalma), toplu dizinleme, çok modlu bellek, sqlite-vec, ek yollar ve diğer tüm
yapılandırma düğmeleri için
[Bellek yapılandırması başvurusu](/tr/reference/memory-config) bölümüne bakın.

## İlgili

- [Belleğe genel bakış](/tr/concepts/memory)
- [Bellek araması](/tr/concepts/memory-search)
- [Active Memory](/tr/concepts/active-memory)

---
read_when:
    - Oturumlar ve kanallar arasında çalışan kalıcı bellek istiyorsunuz
    - Yapay zekâ destekli hatırlama ve kullanıcı modelleme istiyorsunuz
summary: Honcho plugin'i aracılığıyla yapay zekâya özgü oturumlar arası bellek
title: Honcho belleği
x-i18n:
    generated_at: "2026-07-12T11:38:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fadcf6d8e2505ab4fe6a81340695b7c8fee49c3cb4889665af13389941619117
    source_path: concepts/memory-honcho.md
    workflow: 16
---

[Honcho](https://honcho.dev), harici bir Plugin aracılığıyla OpenClaw'a yapay zekâya özgü bellek ekler. Konuşmaları özel bir hizmette kalıcı olarak saklar ve zaman içinde kullanıcı ile aracı modelleri oluşturarak aracınıza çalışma alanındaki Markdown dosyalarının ötesine geçen oturumlar arası bağlam sağlar.

## Neler sunar

- **Oturumlar arası bellek** - konuşmalar her etkileşimden sonra kalıcı olarak saklanır; böylece bağlam, oturum sıfırlamaları, Compaction ve kanal geçişleri boyunca korunur.
- **Kullanıcı modelleme** - Honcho her kullanıcı (tercihler, bilgiler, iletişim tarzı) ve aracı (kişilik, öğrenilmiş davranışlar) için bir profil tutar.
- **Anlamsal arama** - yalnızca geçerli oturumda değil, geçmiş konuşmalardaki gözlemler üzerinde arama yapar.
- **Çok aracılı farkındalık** - üst aracılar, oluşturulan alt aracıları otomatik olarak takip eder ve alt oturumlara gözlemci olarak eklenir.

## Kullanılabilir araçlar

Honcho, aracının konuşma sırasında kullanabileceği araçları kaydeder:

**Veri alma (hızlı, LLM çağrısı yok):**

| Araç                        | İşlevi                                                  |
| --------------------------- | ------------------------------------------------------- |
| `honcho_context`            | Oturumlar genelindeki eksiksiz kullanıcı temsili        |
| `honcho_search_conclusions` | Saklanan sonuçlar üzerinde anlamsal arama               |
| `honcho_search_messages`    | Oturumlar genelinde mesajları bulma (gönderen ve tarihe göre filtreleme) |
| `honcho_session`            | Geçerli oturum geçmişi ve özeti                         |

**Soru-cevap (LLM destekli):**

| Araç         | İşlevi                                                                      |
| ------------ | --------------------------------------------------------------------------- |
| `honcho_ask` | Kullanıcı hakkında soru sorun. Bilgiler için `depth='quick'`, sentez için `'thorough'` kullanın |

## Başlarken

Plugin'i yükleyin ve kurulumu çalıştırın:

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

Kurulum komutu API kimlik bilgilerinizi ister, yapılandırmayı yazar ve isteğe bağlı olarak mevcut çalışma alanı bellek dosyalarını taşır.

<Info>
Honcho tamamen yerel olarak (kendi sunucunuzda) veya `api.honcho.dev` adresindeki yönetilen API üzerinden çalışabilir. Kendi sunucunuzda çalıştırma seçeneği için harici bağımlılık gerekmez.
</Info>

## Yapılandırma

Ayarlar `plugins.entries["openclaw-honcho"].config` altında bulunur:

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // omit for self-hosted
          workspaceId: "openclaw", // memory isolation
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

Kendi sunucunuzda çalışan örnekler için `baseUrl` değerini yerel sunucunuza (örneğin `http://localhost:8000`) yönlendirin ve API anahtarını belirtmeyin.

## Mevcut belleği taşıma

Mevcut çalışma alanı bellek dosyalarınız (`USER.md`, `MEMORY.md`, `IDENTITY.md`, `memory/`, `canvas/`) varsa `openclaw honcho setup` bunları algılar ve taşıma seçeneği sunar.

<Info>
Taşıma işlemi tahribatsızdır; dosyalar Honcho'ya yüklenir. Özgün dosyalar hiçbir zaman silinmez veya taşınmaz.
</Info>

## Nasıl çalışır

Her yapay zekâ etkileşiminden sonra konuşma Honcho'da kalıcı olarak saklanır. Hem kullanıcı hem de aracı mesajları gözlemlenir; bu da Honcho'nun zaman içinde modellerini oluşturmasına ve iyileştirmesine olanak tanır.

Konuşma sırasında Honcho araçları, OpenClaw'ın `before_prompt_build` Plugin kancası üzerinden hizmeti sorgular ve model istemi görmeden önce ilgili bağlamı ekler.

## Honcho ile yerleşik belleğin karşılaştırması

|                   | Yerleşik / QMD                 | Honcho                                  |
| ----------------- | ------------------------------ | --------------------------------------- |
| **Depolama**      | Çalışma alanı Markdown dosyaları | Özel hizmet (yerel veya barındırılan) |
| **Oturumlar arası** | Bellek dosyaları aracılığıyla | Otomatik, yerleşik                      |
| **Kullanıcı modelleme** | Manuel (`MEMORY.md` dosyasına yazılır) | Otomatik profiller          |
| **Arama**         | Vektör + anahtar sözcük (karma) | Gözlemler üzerinde anlamsal arama      |
| **Çok aracılı**   | İzlenmez                       | Üst/alt aracı farkındalığı              |
| **Bağımlılıklar** | Yok (yerleşik) veya QMD ikili dosyası | Plugin kurulumu                    |

Honcho ve yerleşik bellek sistemi birlikte çalışabilir. QMD yapılandırıldığında, Honcho'nun oturumlar arası belleğinin yanı sıra yerel Markdown dosyalarında arama yapmak için ek araçlar kullanılabilir hâle gelir.

## CLI komutları

```bash
openclaw honcho setup                        # Configure API key and migrate files
openclaw honcho status                       # Check connection status
openclaw honcho ask <question>               # Query Honcho about the user
openclaw honcho search <query> [-k N] [-d D] # Semantic search over memory
```

## Ek okumalar

- [Plugin kaynak kodu](https://github.com/plastic-labs/openclaw-honcho)
- [Honcho belgeleri](https://docs.honcho.dev)
- [Honcho OpenClaw entegrasyon kılavuzu](https://docs.honcho.dev/v3/guides/integrations/openclaw)

## İlgili içerikler

- [Belleğe genel bakış](/tr/concepts/memory)
- [Yerleşik bellek motoru](/tr/concepts/memory-builtin)
- [QMD bellek motoru](/tr/concepts/memory-qmd)
- [Bağlam Motorları](/tr/concepts/context-engine)

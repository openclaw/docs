---
read_when:
    - Oturumlar ve kanallar arasında çalışan kalıcı bellek istediğinizde
    - AI destekli hatırlama ve kullanıcı modelleme istediğinizde
summary: Honcho eklentisi aracılığıyla AI-native oturumlar arası bellek
title: Honcho Memory
x-i18n:
    generated_at: "2026-04-05T13:50:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83ae3561152519a23589f754e0625f1e49c43e38f85de07686b963170a6cf229
    source_path: concepts/memory-honcho.md
    workflow: 15
---

# Honcho Memory

[Honcho](https://honcho.dev), OpenClaw'a AI-native bellek ekler. Konuşmaları özel bir hizmete kalıcı olarak kaydeder ve zaman içinde kullanıcı ile ajan modelleri oluşturur; böylece ajanınıza, çalışma alanı Markdown dosyalarının ötesine geçen oturumlar arası bağlam sağlar.

## Sağladıkları

- **Oturumlar arası bellek** -- konuşmalar her turdan sonra kalıcı olarak kaydedilir; böylece bağlam, oturum sıfırlamaları, sıkıştırma ve kanal değişiklikleri arasında korunur.
- **Kullanıcı modelleme** -- Honcho, her kullanıcı için (tercihler, gerçekler, iletişim tarzı) ve ajan için (kişilik, öğrenilmiş davranışlar) bir profil tutar.
- **Anlamsal arama** -- yalnızca mevcut oturum üzerinde değil, geçmiş konuşmalardan elde edilen gözlemler üzerinde arama yapar.
- **Çoklu ajan farkındalığı** -- üst ajanlar, oluşturdukları alt ajanları otomatik olarak izler; üst ajanlar alt oturumlara gözlemci olarak eklenir.

## Kullanılabilir araçlar

Honcho, ajanın konuşma sırasında kullanabileceği araçlar kaydeder:

**Veri alma (hızlı, LLM çağrısı yok):**

| Araç                        | Ne yapar                                              |
| --------------------------- | ----------------------------------------------------- |
| `honcho_context`            | Oturumlar arasında tam kullanıcı temsili              |
| `honcho_search_conclusions` | Kaydedilmiş sonuçlar üzerinde anlamsal arama yapar    |
| `honcho_search_messages`    | Oturumlar arasında mesaj bulur (gönderene, tarihe göre filtreler) |
| `honcho_session`            | Mevcut oturum geçmişi ve özeti                        |

**Soru-cevap (LLM destekli):**

| Araç         | Ne yapar                                                                   |
| ------------ | -------------------------------------------------------------------------- |
| `honcho_ask` | Kullanıcı hakkında soru sorar. Gerçekler için `depth='quick'`, sentez için `'thorough'` |

## Başlarken

Eklentiyi yükleyin ve kurulumu çalıştırın:

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

Kurulum komutu API kimlik bilgilerinizi ister, yapılandırmayı yazar ve isteğe bağlı olarak mevcut çalışma alanı bellek dosyalarını taşır.

<Info>
Honcho tamamen yerel olarak (self-hosted) veya `api.honcho.dev` adresindeki yönetilen API üzerinden çalışabilir. Self-hosted seçeneği için harici bağımlılık gerekmez.
</Info>

## Yapılandırma

Ayarlar `plugins.entries["openclaw-honcho"].config` altında bulunur:

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // self-hosted için atlayın
          workspaceId: "openclaw", // bellek yalıtımı
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

Self-hosted örnekler için `baseUrl` değerini yerel sunucunuza yönlendirin (örneğin `http://localhost:8000`) ve API anahtarını atlayın.

## Mevcut belleği taşıma

Mevcut çalışma alanı bellek dosyalarınız varsa (`USER.md`, `MEMORY.md`,
`IDENTITY.md`, `memory/`, `canvas/`), `openclaw honcho setup` bunları algılar ve
taşımayı önerir.

<Info>
Taşıma yıkıcı değildir -- dosyalar Honcho'ya yüklenir. Orijinaller asla silinmez veya taşınmaz.
</Info>

## Nasıl çalışır

Her AI turundan sonra konuşma Honcho'ya kalıcı olarak kaydedilir. Hem kullanıcı hem de ajan mesajları gözlemlenir; bu da Honcho'nun zaman içinde modellerini oluşturmasına ve iyileştirmesine olanak tanır.

Konuşma sırasında Honcho araçları, hizmeti `before_prompt_build`
aşamasında sorgular ve model istemi görmeden önce ilgili bağlamı ekler. Bu, doğru tur sınırları ve ilgili hatırlama sağlar.

## Honcho ile yerleşik bellek karşılaştırması

|                   | Yerleşik / QMD                | Honcho                               |
| ----------------- | ----------------------------- | ------------------------------------ |
| **Depolama**      | Çalışma alanı Markdown dosyaları | Özel hizmet (yerel veya barındırılan) |
| **Oturumlar arası** | Bellek dosyaları aracılığıyla | Otomatik, yerleşik                    |
| **Kullanıcı modelleme** | El ile (`MEMORY.md` içine yazılır) | Otomatik profiller                   |
| **Arama**         | Vektör + anahtar kelime (hibrit) | Gözlemler üzerinde anlamsal          |
| **Çoklu ajan**    | İzlenmez                      | Üst/alt farkındalığı                 |
| **Bağımlılıklar** | Yok (yerleşik) veya QMD ikilisi | Eklenti kurulumu                     |

Honcho ile yerleşik bellek sistemi birlikte çalışabilir. QMD yapılandırıldığında, Honcho'nun oturumlar arası belleği yanında yerel Markdown dosyalarında arama yapmak için ek araçlar kullanılabilir hâle gelir.

## CLI komutları

```bash
openclaw honcho setup                        # API anahtarını yapılandır ve dosyaları taşı
openclaw honcho status                       # Bağlantı durumunu kontrol et
openclaw honcho ask <question>               # Honcho'ya kullanıcı hakkında soru sor
openclaw honcho search <query> [-k N] [-d D] # Bellek üzerinde anlamsal arama
```

## Daha fazla bilgi

- [Eklenti kaynak kodu](https://github.com/plastic-labs/openclaw-honcho)
- [Honcho belgeleri](https://docs.honcho.dev)
- [Honcho OpenClaw entegrasyon kılavuzu](https://docs.honcho.dev/v3/guides/integrations/openclaw)
- [Memory](/concepts/memory) -- OpenClaw bellek genel bakışı
- [Context Engines](/concepts/context-engine) -- eklenti bağlam motorlarının nasıl çalıştığı

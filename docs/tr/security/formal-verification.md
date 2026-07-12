---
permalink: /security/formal-verification/
read_when:
    - Biçimsel güvenlik modeli güvencelerini veya sınırlamalarını inceleme
    - TLA+/TLC güvenlik modeli denetimlerini yeniden üretme veya güncelleme
summary: OpenClaw'ın en yüksek riskli yolları için makineyle doğrulanan güvenlik modelleri.
title: Biçimsel doğrulama (güvenlik modelleri)
x-i18n:
    generated_at: "2026-07-12T12:44:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86342f6e2f54c08d5e0f8a08d0d488459650a6ace35e985ff886f847540202c9
    source_path: security/formal-verification.md
    workflow: 16
---

OpenClaw'ın biçimsel güvenlik modelleri (günümüzde TLA+/TLC), açıkça belirtilen varsayımlar altında en yüksek risk taşıyan belirli yolların — yetkilendirme, oturum yalıtımı, araç geçitleme ve yanlış yapılandırma güvenliği — amaçlanan politikayı uyguladığına dair makine tarafından denetlenmiş bir gerekçe sunar.

> Not: Bazı eski bağlantılar önceki proje adına atıfta bulunabilir.

## Bu nedir?

Yürütülebilir, saldırgan odaklı bir güvenlik regresyon paketi:

- Her iddia, sonlu bir durum uzayı üzerinde çalıştırılabilir bir model denetimine sahiptir.
- Birçok iddianın, gerçekçi bir hata sınıfı için karşı örnek izi üreten eşleştirilmiş bir negatif modeli vardır.

Bu, OpenClaw'ın her açıdan güvenli olduğunun **kanıtı değildir** ve TypeScript uygulamasının tamamını doğrulamaz.

## Modellerin bulunduğu yer

Modeller ayrı bir depoda tutulur: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

<Note>
Bu yazının hazırlandığı sırada söz konusu depoya erişilemiyor (GitHub, "Repository not found" sonucunu döndürüyor). Sizin için de hâlâ erişilemiyorsa modellerin kaldırıldığını varsaymadan önce güncel konumu OpenClaw bakım sorumlusu kanallarında sorun.
</Note>

## Sınırlamalar

- Bunlar modeldir, TypeScript uygulamasının tamamı değildir; model ile kod arasında sapma olması mümkündür.
- Sonuçlar, TLC'nin incelediği durum uzayıyla sınırlıdır. Yeşil sonuç, modellenen varsayımların ve sınırların ötesinde güvenlik anlamına gelmez.
- Bazı iddialar açık ortam varsayımlarına dayanır (örneğin doğru dağıtım ve doğru yapılandırma girdileri).

## Sonuçları yeniden üretme

Model deposunu klonlayın ve TLC'yi çalıştırın:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ gerekli (TLC, JVM üzerinde çalışır).
# Depo, sabitlenmiş bir tla2tools.jar sürümünü içerir ve bin/tlc ile Make hedefleri sağlar.

make <target>
```

Henüz bu depoya yönelik bir CI entegrasyonu yoktur; gelecekteki bir sürüm, herkese açık yapıtlarla (karşı örnek izleri, çalıştırma günlükleri) CI tarafından çalıştırılan modeller veya küçük ve sınırlı denetimler için barındırılan bir "bu modeli çalıştır" iş akışı ekleyebilir.

## İddialar ve hedefler

### Gateway erişimi ve açık Gateway yanlış yapılandırması

**İddia:** Kimlik doğrulama olmadan loopback ötesine bağlanmak, uzaktan ele geçirmeyi mümkün kılabilir ve erişim kapsamını artırır; modelin varsayımlarına göre bir belirteç/parola, kimliği doğrulanmamış saldırganları engeller.

| Sonuç          | Hedefler                                                          |
| -------------- | ----------------------------------------------------------------- |
| Yeşil          | `make gateway-exposure-v2`, `make gateway-exposure-v2-protected` |
| Kırmızı (beklenen) | `make gateway-exposure-v2-negative`                          |

Model deposundaki `docs/gateway-exposure-matrix.md` dosyasına da bakın.

### Node exec işlem hattı (en yüksek riskli yetenek)

**İddia:** Modelde `exec host=node`, (a) bir Node komutu izin listesi ile bildirilmiş komutları ve (b) yapılandırıldığında canlı onayı gerektirir; yeniden oynatma saldırılarını önlemek için onaylar belirteçleştirilir.

| Sonuç          | Hedefler                                                         |
| -------------- | ---------------------------------------------------------------- |
| Yeşil          | `make nodes-pipeline`, `make approvals-token`                   |
| Kırmızı (beklenen) | `make nodes-pipeline-negative`, `make approvals-token-negative` |

### Eşleştirme deposu (DM geçitleme)

**İddia:** Eşleştirme istekleri TTL'ye ve bekleyen istek sınırlarına uyar.

| Sonuç          | Hedefler                                             |
| -------------- | --------------------------------------------------- |
| Yeşil          | `make pairing`, `make pairing-cap`                  |
| Kırmızı (beklenen) | `make pairing-negative`, `make pairing-cap-negative` |

### Giriş geçitleme (bahsetmeler ve denetim komutu atlatması)

**İddia:** Bahsetme gerektiren grup bağlamlarında, yetkisiz bir denetim komutu bahsetme geçitlemesini atlayamaz.

| Sonuç          | Hedefler                        |
| -------------- | ------------------------------ |
| Yeşil          | `make ingress-gating`          |
| Kırmızı (beklenen) | `make ingress-gating-negative` |

### Yönlendirme ve oturum anahtarı yalıtımı

**İddia:** Farklı eşlerden gelen DM'ler, açıkça bağlanmadıkça veya bu şekilde yapılandırılmadıkça aynı oturumda birleştirilmez.

| Sonuç          | Hedefler                           |
| -------------- | --------------------------------- |
| Yeşil          | `make routing-isolation`          |
| Kırmızı (beklenen) | `make routing-isolation-negative` |

## v1++ modelleri: eşzamanlılık, yeniden denemeler ve iz doğruluğu

Atomik olmayan güncellemeler, yeniden denemeler ve mesajların çoklu dağıtımı gibi gerçek dünyadaki hata kipleri konusunda doğruluğu artıran devam modelleri.

### Eşleştirme deposunda eşzamanlılık ve eşgüçlülük

**İddia:** Eşleştirme deposu, iç içe geçmeli yürütmeler altında bile `MaxPending` sınırını ve eşgüçlülüğü uygular; denetle-ve-yaz işlemi atomik/kilitli olmalı ve yenileme yinelenen kayıtlar oluşturmamalıdır. Somut olarak: eşzamanlı istekler bir kanal için `MaxPending` sınırını aşamaz ve aynı `(channel, sender)` için yinelenen istekler/yenilemeler, yinelenen etkin bekleyen satırlar oluşturmaz.

| Sonuç          | Hedefler                                                                                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yeşil          | `make pairing-race` (atomik/kilitli sınır denetimi), `make pairing-idempotency`, `make pairing-refresh`, `make pairing-refresh-race`                                        |
| Kırmızı (beklenen) | `make pairing-race-negative` (atomik olmayan başlatma/işleme sınırı yarış durumu), `make pairing-idempotency-negative`, `make pairing-refresh-negative`, `make pairing-refresh-race-negative` |

### Giriş izi korelasyonu ve eşgüçlülük

**İddia:** İçeri alma işlemi, çoklu dağıtım boyunca iz korelasyonunu korur ve sağlayıcı yeniden denemeleri altında eşgüçlüdür. Bir harici olay birden fazla dahili mesaja dönüştüğünde her parça aynı iz/olay kimliğini korur; yeniden denemeler çift işlemeye yol açmaz; sağlayıcı olay kimlikleri eksikse tekilleştirme, farklı olayların elenmesini önlemek için güvenli bir anahtara (örneğin iz kimliğine) geri döner.

| Sonuç          | Hedefler                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Yeşil          | `make ingress-trace`, `make ingress-trace2`, `make ingress-idempotency`, `make ingress-dedupe-fallback`                                     |
| Kırmızı (beklenen) | `make ingress-trace-negative`, `make ingress-trace2-negative`, `make ingress-idempotency-negative`, `make ingress-dedupe-fallback-negative` |

### Yönlendirmede dmScope önceliği ve identityLinks

**İddia:** Yönlendirme, DM oturumlarını varsayılan olarak yalıtılmış tutar ve oturumları yalnızca kanal önceliği ve kimlik bağlantıları aracılığıyla açıkça yapılandırıldığında birleştirir. Kanala özgü `dmScope` geçersiz kılmaları, genel varsayılanlara göre önceliklidir; `identityLinks`, oturumları ilgisiz eşler arasında değil, yalnızca açıkça bağlanmış gruplar içinde birleştirir.

| Sonuç          | Hedefler                                                                   |
| -------------- | ------------------------------------------------------------------------- |
| Yeşil          | `make routing-precedence`, `make routing-identitylinks`                   |
| Kırmızı (beklenen) | `make routing-precedence-negative`, `make routing-identitylinks-negative` |

## İlgili içerikler

- [Tehdit modeli](/tr/security/THREAT-MODEL-ATLAS)
- [Tehdit modeline katkıda bulunma](/tr/security/CONTRIBUTING-THREAT-MODEL)
- [Olay müdahalesi](/tr/security/incident-response)

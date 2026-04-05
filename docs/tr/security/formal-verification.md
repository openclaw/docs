---
permalink: /security/formal-verification/
read_when:
    - Biçimsel güvenlik modeli güvencelerini veya sınırlarını inceliyorsunuz
    - TLA+/TLC güvenlik modeli denetimlerini yeniden üretiyor veya güncelliyorsunuz
summary: OpenClaw’ın en yüksek riskli yolları için makine tarafından denetlenmiş güvenlik modelleri.
title: Biçimsel Doğrulama (Güvenlik Modelleri)
x-i18n:
    generated_at: "2026-04-05T14:08:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f7cd2461dcc00d320a5210e50279d76a7fa84e0830c440398323d75e262a38a
    source_path: security/formal-verification.md
    workflow: 15
---

# Biçimsel Doğrulama (Güvenlik Modelleri)

Bu sayfa, OpenClaw’ın **biçimsel güvenlik modellerini** izler (bugün TLA+/TLC; gerektiğinde daha fazlası).

> Not: bazı eski bağlantılar önceki proje adına atıfta bulunabilir.

**Amaç (kuzey yıldızı):** OpenClaw’ın amaçlanan güvenlik ilkesini
(yetkilendirme, oturum yalıtımı, araç geçitleme ve
yanlış yapılandırma güvenliği) açık varsayımlar altında uyguladığını
makine tarafından denetlenmiş bir argümanla göstermek.

**Bugün bunun ne olduğu:** yürütülebilir, saldırgan odaklı bir **güvenlik regresyon test paketi**:

- Her iddia, sonlu bir durum uzayı üzerinde çalıştırılabilir bir model denetimine sahiptir.
- Birçok iddiada, gerçekçi bir hata sınıfı için karşı örnek izi üreten eşleştirilmiş bir **negatif model** bulunur.

**Henüz bunun ne olmadığı:** “OpenClaw her açıdan güvenlidir” ya da tam TypeScript uygulamasının doğru olduğu yönünde bir kanıt değildir.

## Modellerin bulunduğu yer

Modeller ayrı bir repoda tutulur: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Önemli uyarılar

- Bunlar tam TypeScript uygulaması değil, **modellerdir**. Model ile kod arasında sapma olabilir.
- Sonuçlar, TLC’nin keşfettiği durum uzayıyla sınırlıdır; “yeşil” sonuç, modellenen varsayımlar ve sınırların ötesinde güvenlik anlamına gelmez.
- Bazı iddialar açık çevresel varsayımlara dayanır (ör. doğru dağıtım, doğru yapılandırma girdileri).

## Sonuçları yeniden üretme

Bugün sonuçlar, model reposunun yerelde klonlanması ve TLC’nin çalıştırılmasıyla yeniden üretilir (aşağıya bakın). Gelecekteki bir sürüm şunları sunabilir:

- Herkese açık artefaktlarla çalışan CI modelleri (karşı örnek izleri, çalışma günlükleri)
- Küçük, sınırlı denetimler için barındırılan bir “bu modeli çalıştır” iş akışı

Başlangıç:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ gerekli (TLC JVM üzerinde çalışır).
# Repo sabitlenmiş bir `tla2tools.jar` (TLA+ araçları) içerir ve `bin/tlc` + Make hedefleri sağlar.

make <target>
```

### Gateway maruziyeti ve açık gateway yanlış yapılandırması

**İddia:** kimlik doğrulama olmadan loopback dışına bağlanmak uzaktan ele geçirmeyi mümkün kılabilir / maruziyeti artırır; token/parola, model varsayımlarına göre yetkisiz saldırganları engeller.

- Yeşil çalıştırmalar:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Kırmızı (beklenen):
  - `make gateway-exposure-v2-negative`

Ayrıca bakın: model reposundaki `docs/gateway-exposure-matrix.md`.

### Node exec hattı (en yüksek riskli yetenek)

**İddia:** `exec host=node` için (a) düğüm komut izin listesi ile beyan edilmiş komutlar ve (b) yapılandırıldığında canlı onay gerekir; modelde tekrar oynatmayı önlemek için onaylar token’laştırılır.

- Yeşil çalıştırmalar:
  - `make nodes-pipeline`
  - `make approvals-token`
- Kırmızı (beklenen):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Eşleştirme deposu (DM geçitleme)

**İddia:** eşleştirme istekleri TTL’ye ve bekleyen istek üst sınırlarına uyar.

- Yeşil çalıştırmalar:
  - `make pairing`
  - `make pairing-cap`
- Kırmızı (beklenen):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Giriş geçitleme (bahsetmeler + kontrol-komutu atlaması)

**İddia:** bahsetme gerektiren grup bağlamlarında, yetkisiz bir “kontrol komutu” bahsetme geçitlemesini atlayamaz.

- Yeşil:
  - `make ingress-gating`
- Kırmızı (beklenen):
  - `make ingress-gating-negative`

### Yönlendirme/oturum anahtarı yalıtımı

**İddia:** farklı eşlerden gelen DM’ler, açıkça bağlanmadıkça/yapılandırılmadıkça aynı oturumda birleşmez.

- Yeşil:
  - `make routing-isolation`
- Kırmızı (beklenen):
  - `make routing-isolation-negative`

## v1++: ek sınırlı modeller (eşzamanlılık, yeniden denemeler, iz doğruluğu)

Bunlar, gerçek dünya arıza kipleri etrafındaki doğruluğu artıran devam modelleridir (atomik olmayan güncellemeler, yeniden denemeler ve mesaj fan-out).

### Eşleştirme deposu eşzamanlılığı / idempotensi

**İddia:** bir eşleştirme deposu, iç içe geçmeler altında bile `MaxPending` ve idempotensi uygulamalıdır (yani “kontrol et-sonra-yaz” işlemi atomik / kilitli olmalıdır; yenileme yinelenen kayıt oluşturmamalıdır).

Anlamı:

- Eşzamanlı istekler altında, bir kanal için `MaxPending` sınırı aşılamaz.
- Aynı `(channel, sender)` için yinelenen istekler/yenilemeler, canlı bekleyen satırlarda yinelenen kayıt oluşturmamalıdır.

- Yeşil çalıştırmalar:
  - `make pairing-race` (atomik/kilitli üst sınır denetimi)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Kırmızı (beklenen):
  - `make pairing-race-negative` (atomik olmayan begin/commit üst sınır yarışı)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Giriş iz korelasyonu / idempotensi

**İddia:** içe alma, fan-out boyunca iz korelasyonunu korumalı ve sağlayıcı yeniden denemeleri altında idempotent olmalıdır.

Anlamı:

- Tek bir harici olay birden çok dahili mesaja dönüştüğünde, her parça aynı iz/olay kimliğini korur.
- Yeniden denemeler çift işlemeye yol açmaz.
- Sağlayıcı olay kimlikleri eksikse, tekilleştirme farklı olayların düşmesini önlemek için güvenli bir anahtara (ör. iz kimliği) geri döner.

- Yeşil:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- Kırmızı (beklenen):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### Yönlendirme dmScope önceliği + identityLinks

**İddia:** yönlendirme varsayılan olarak DM oturumlarını yalıtılmış tutmalı ve oturumları yalnızca açıkça yapılandırıldığında birleştirmelidir (kanal önceliği + kimlik bağlantıları).

Anlamı:

- Kanala özgü dmScope geçersiz kılmaları, genel varsayılanlara üstün gelmelidir.
- identityLinks yalnızca açıkça bağlanmış gruplar içinde birleştirmeli, ilgisiz eşler arasında değil.

- Yeşil:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Kırmızı (beklenen):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

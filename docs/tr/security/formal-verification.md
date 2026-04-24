---
permalink: /security/formal-verification/
read_when:
    - Biçimsel güvenlik modeli garantilerini veya sınırlarını gözden geçirme
    - TLA+/TLC güvenlik model kontrollerini yeniden üretme veya güncelleme
summary: OpenClaw'ın en yüksek riskli yolları için makine tarafından doğrulanan güvenlik modelleri.
title: Biçimsel doğrulama (güvenlik modelleri)
x-i18n:
    generated_at: "2026-04-24T09:31:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f50fa9118a80054b8d556cd4f1901b2d5fcb37fb0866bd5357a1b0a46c74116
    source_path: security/formal-verification.md
    workflow: 15
---

Bu sayfa, OpenClaw'ın **biçimsel güvenlik modellerini** izler (bugün TLA+/TLC; gerekirse daha fazlası).

> Not: bazı eski bağlantılar önceki proje adına atıfta bulunabilir.

**Amaç (kuzey yıldızı):** OpenClaw'ın amaçlanan güvenlik politikasını
(yetkilendirme, oturum yalıtımı, araç geçitleme ve
yanlış yapılandırma güvenliği), açık varsayımlar altında uyguladığına dair makine tarafından doğrulanmış bir argüman sağlamak.

**Bugün bunun ne olduğu:** çalıştırılabilir, saldırgan odaklı bir **güvenlik regresyon paketi**:

- Her iddia, sonlu bir durum uzayı üzerinde çalıştırılabilir bir model kontrolüne sahiptir.
- Birçok iddianın, gerçekçi bir hata sınıfı için karşı örnek izi üreten eşleştirilmiş bir **negatif modeli** vardır.

**Henüz bunun ne olmadığı:** “OpenClaw her açıdan güvenlidir” veya tam TypeScript uygulamasının doğru olduğuna dair bir kanıt.

## Modeller nerede yaşar

Modeller ayrı bir depoda tutulur: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Önemli uyarılar

- Bunlar tam TypeScript uygulaması değil, **modellerdir**. Model ile kod arasında sapma mümkündür.
- Sonuçlar, TLC tarafından keşfedilen durum uzayı ile sınırlıdır; “yeşil” sonuç, modellenen varsayımların ve sınırların ötesinde güvenlik anlamına gelmez.
- Bazı iddialar açık çevresel varsayımlara dayanır (ör. doğru dağıtım, doğru yapılandırma girdileri).

## Sonuçları yeniden üretme

Bugün sonuçlar, modeller deposunun yerelde klonlanması ve TLC'nin çalıştırılmasıyla yeniden üretilir (aşağıya bakın). Gelecekteki bir sürüm şunları sunabilir:

- genel artifact'lerle CI üzerinde çalışan modeller (karşı örnek izleri, çalıştırma günlükleri)
- küçük, sınırlı kontroller için barındırılan bir “bu modeli çalıştır” iş akışı

Başlangıç:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ gerekir (TLC JVM üzerinde çalışır).
# Repo, sabitlenmiş bir `tla2tools.jar` (TLA+ araçları) paketler ve `bin/tlc` + Make hedefleri sağlar.

make <target>
```

### Gateway açığa çıkma ve açık gateway yanlış yapılandırması

**İddia:** loopback dışına auth olmadan bağlanmak uzak ele geçirmeyi mümkün kılabilir / maruziyeti artırır; token/parola yetkisiz saldırganları engeller (model varsayımlarına göre).

- Yeşil çalıştırmalar:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Kırmızı (beklenen):
  - `make gateway-exposure-v2-negative`

Ayrıca bkz.: modeller deposundaki `docs/gateway-exposure-matrix.md`.

### Node exec işlem hattı (en yüksek riskli yetenek)

**İddia:** `exec host=node`, (a) node komut izin listesi + bildirilmiş komutları ve (b) yapılandırıldığında canlı onayı gerektirir; modelde yeniden oynatmayı önlemek için onaylar token'laştırılır.

- Yeşil çalıştırmalar:
  - `make nodes-pipeline`
  - `make approvals-token`
- Kırmızı (beklenen):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Pairing deposu (DM geçitlemesi)

**İddia:** pairing istekleri TTL ve bekleyen istek üst sınırlarına uyar.

- Yeşil çalıştırmalar:
  - `make pairing`
  - `make pairing-cap`
- Kırmızı (beklenen):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Giriş geçitlemesi (mention + denetim komutu by-pass'ı)

**İddia:** mention gerektiren grup bağlamlarında yetkisiz bir “denetim komutu” mention geçitlemesini by-pass edemez.

- Yeşil:
  - `make ingress-gating`
- Kırmızı (beklenen):
  - `make ingress-gating-negative`

### Yönlendirme/oturum anahtarı yalıtımı

**İddia:** farklı eşlerden gelen DM'ler açıkça bağlanmadıkça/yapılandırılmadıkça aynı oturuma çökmez.

- Yeşil:
  - `make routing-isolation`
- Kırmızı (beklenen):
  - `make routing-isolation-negative`

## v1++: ek sınırlı modeller (eşzamanlılık, yeniden denemeler, iz doğruluğu)

Bunlar, gerçek dünya hata modları etrafındaki sadakati sıkılaştıran takip modelleridir (atomik olmayan güncellemeler, yeniden denemeler ve mesaj fan-out).

### Pairing deposu eşzamanlılığı / idempotency

**İddia:** pairing deposu, ara kesişmeler altında bile `MaxPending` ve idempotency'yi uygulamalıdır (yani “kontrol et-sonra yaz” işlemi atomik / kilitli olmalı; yenileme yinelenen kayıtlar oluşturmamalıdır).

Bunun anlamı:

- Eşzamanlı isteklerde, bir kanal için `MaxPending` değeri aşılamaz.
- Aynı `(channel, sender)` için tekrarlanan istekler/yenilemeler yinelenen canlı bekleyen satırlar oluşturmamalıdır.

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

### Giriş iz korelasyonu / idempotency

**İddia:** alım, fan-out boyunca iz korelasyonunu korumalı ve sağlayıcı yeniden denemelerinde idempotent olmalıdır.

Bunun anlamı:

- Bir dış olay birden çok iç mesaja dönüştüğünde her parça aynı iz/olay kimliğini korur.
- Yeniden denemeler çift işlemeye yol açmaz.
- Sağlayıcı olay kimlikleri eksikse dedupe, farklı olayları düşürmemek için güvenli bir anahtara (ör. trace ID) geri düşer.

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

**İddia:** yönlendirme, varsayılan olarak DM oturumlarını yalıtılmış tutmalı ve yalnızca açıkça yapılandırıldığında oturumları çökertmelidir (kanal önceliği + identity links).

Bunun anlamı:

- Kanala özgü dmScope geçersiz kılmaları genel varsayılanların önüne geçmelidir.
- identityLinks, ilgisiz eşler arasında değil, yalnızca açıkça bağlı gruplar içinde çökertme yapmalıdır.

- Yeşil:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Kırmızı (beklenen):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## İlgili

- [Tehdit modeli](/tr/security/THREAT-MODEL-ATLAS)
- [Tehdit modeline katkı](/tr/security/CONTRIBUTING-THREAT-MODEL)

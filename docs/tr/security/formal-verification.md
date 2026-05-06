---
permalink: /security/formal-verification/
read_when:
    - Biçimsel güvenlik modeli güvencelerini veya sınırlarını inceleme
    - TLA+/TLC güvenlik modeli denetimlerini yeniden üretme veya güncelleme
summary: OpenClaw'ın en yüksek riskli yolları için makine tarafından denetlenmiş güvenlik modelleri.
title: Biçimsel doğrulama (güvenlik modelleri)
x-i18n:
    generated_at: "2026-05-06T09:30:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 298b92f27abb8321be807fe4d95c7cd568a0fb8f543d168863b2adb9b3ddcde4
    source_path: security/formal-verification.md
    workflow: 16
---

Bu sayfa OpenClaw'un **resmi güvenlik modellerini** izler (bugün TLA+/TLC; gerektiğinde daha fazlası).

> Not: bazı eski bağlantılar önceki proje adına atıfta bulunabilir.

**Hedef (kuzey yıldızı):** açık varsayımlar altında OpenClaw'un amaçlanan
güvenlik politikasını (yetkilendirme, oturum yalıtımı, araç geçitlemesi ve
yanlış yapılandırma güvenliği) uyguladığına dair makine tarafından denetlenmiş
bir argüman sağlamak.

**Bu nedir (bugün):** çalıştırılabilir, saldırgan odaklı bir **güvenlik regresyon paketi**:

- Her iddia, sonlu bir durum uzayı üzerinde çalıştırılabilir bir model denetimine sahiptir.
- Birçok iddianın, gerçekçi bir hata sınıfı için karşı örnek izi üreten eşleştirilmiş bir **negatif modeli** vardır.

**Bu ne değildir (henüz):** "OpenClaw her bakımdan güvenlidir" ya da tam TypeScript uygulamasının doğru olduğuna dair bir kanıt değildir.

## Modeller nerede bulunur

Modeller ayrı bir repoda tutulur: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Önemli uyarılar

- Bunlar **modellerdir**, tam TypeScript uygulaması değildir. Model ile kod arasında sapma olabilir.
- Sonuçlar TLC tarafından keşfedilen durum uzayıyla sınırlıdır; "yeşil" olmak, modellenen varsayımlar ve sınırların ötesinde güvenlik anlamına gelmez.
- Bazı iddialar açık çevresel varsayımlara dayanır (ör. doğru dağıtım, doğru yapılandırma girdileri).

## Sonuçları yeniden üretme

Bugün sonuçlar, modeller reposu yerelde klonlanıp TLC çalıştırılarak yeniden üretilir (aşağıya bakın). Gelecekteki bir yineleme şunları sunabilir:

- herkese açık yapıtlarla CI tarafından çalıştırılan modeller (karşı örnek izleri, çalışma günlükleri)
- küçük, sınırlı denetimler için barındırılan bir "bu modeli çalıştır" iş akışı

Başlarken:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ required (TLC runs on the JVM).
# The repo vendors a pinned `tla2tools.jar` (TLA+ tools) and provides `bin/tlc` + Make targets.

make <target>
```

### Gateway maruziyeti ve açık Gateway yanlış yapılandırması

**İddia:** kimlik doğrulama olmadan loopback ötesine bağlanmak uzaktan ele geçirmeyi mümkün kılabilir / maruziyeti artırır; token/parola, yetkisiz saldırganları engeller (model varsayımlarına göre).

- Yeşil çalıştırmalar:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Kırmızı (beklenen):
  - `make gateway-exposure-v2-negative`

Ayrıca bakın: modeller reposundaki `docs/gateway-exposure-matrix.md`.

### Node exec işlem hattı (en yüksek riskli yetenek)

**İddia:** `exec host=node`, (a) Node komut izin listesi ve beyan edilmiş komutlar ile (b) yapılandırıldığında canlı onay gerektirir; onaylar yeniden oynatmayı önlemek için token'laştırılır (modelde).

- Yeşil çalıştırmalar:
  - `make nodes-pipeline`
  - `make approvals-token`
- Kırmızı (beklenen):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Eşleştirme deposu (DM geçitlemesi)

**İddia:** eşleştirme istekleri TTL'ye ve bekleyen istek sınırlarına uyar.

- Yeşil çalıştırmalar:
  - `make pairing`
  - `make pairing-cap`
- Kırmızı (beklenen):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Giriş geçitlemesi (bahsetmeler + kontrol komutu baypası)

**İddia:** bahsetme gerektiren grup bağlamlarında, yetkisiz bir "kontrol komutu" bahsetme geçitlemesini baypas edemez.

- Yeşil:
  - `make ingress-gating`
- Kırmızı (beklenen):
  - `make ingress-gating-negative`

### Yönlendirme/oturum anahtarı yalıtımı

**İddia:** farklı eşlerden gelen DM'ler, açıkça bağlanmadıkça/yapılandırılmadıkça aynı oturumda birleşmez.

- Yeşil:
  - `make routing-isolation`
- Kırmızı (beklenen):
  - `make routing-isolation-negative`

## v1++: ek sınırlı modeller (eşzamanlılık, yeniden denemeler, iz doğruluğu)

Bunlar, gerçek dünya hata modları (atomik olmayan güncellemeler, yeniden denemeler ve mesaj fan-out'u) etrafında sadakati sıkılaştıran takip modelleridir.

### Eşleştirme deposu eşzamanlılığı / idempotentlik

**İddia:** bir eşleştirme deposu, araya girmeler altında bile `MaxPending` ve idempotentliği uygulamalıdır (yani, "kontrol et, sonra yaz" atomik / kilitli olmalıdır; yenileme kopyalar oluşturmamalıdır).

Anlamı:

- Eşzamanlı istekler altında, bir kanal için `MaxPending` aşılamaz.
- Aynı `(channel, sender)` için tekrarlanan istekler/yenilemeler, yinelenen canlı bekleyen satırlar oluşturmamalıdır.

- Yeşil çalıştırmalar:
  - `make pairing-race` (atomik/kilitli sınır denetimi)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Kırmızı (beklenen):
  - `make pairing-race-negative` (atomik olmayan başlatma/işleme sınır yarışı)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Giriş izi korelasyonu / idempotentlik

**İddia:** alım, fan-out boyunca iz korelasyonunu korumalı ve sağlayıcı yeniden denemeleri altında idempotent olmalıdır.

Anlamı:

- Bir harici olay birden çok dahili mesaja dönüştüğünde, her parça aynı iz/olay kimliğini korur.
- Yeniden denemeler çift işlemeyle sonuçlanmaz.
- Sağlayıcı olay kimlikleri eksikse, tekilleştirme farklı olayları düşürmekten kaçınmak için güvenli bir anahtara (ör. iz kimliği) geri döner.

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

**İddia:** yönlendirme, DM oturumlarını varsayılan olarak yalıtılmış tutmalı ve oturumları yalnızca açıkça yapılandırıldığında birleştirmelidir (kanal önceliği + kimlik bağlantıları).

Anlamı:

- Kanala özel dmScope geçersiz kılmaları, küresel varsayılanlara üstün gelmelidir.
- identityLinks yalnızca açıkça bağlanmış gruplar içinde birleştirmeli, ilişkisiz eşler arasında birleştirmemelidir.

- Yeşil:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Kırmızı (beklenen):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## İlgili

- [Tehdit modeli](/tr/security/THREAT-MODEL-ATLAS)
- [Tehdit modeline katkıda bulunma](/tr/security/CONTRIBUTING-THREAT-MODEL)

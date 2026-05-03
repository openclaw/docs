---
read_when:
    - Bir güvenlik raporuna veya şüpheli bir güvenlik olayına yanıt verme
    - Koordineli bir açıklama veya yamalanmış güvenlik sürümü hazırlama
    - Olay sonrası takip beklentilerini gözden geçirme
summary: OpenClaw güvenlik olaylarını nasıl değerlendirir, yanıtlar ve takip eder
title: Olay müdahalesi
x-i18n:
    generated_at: "2026-05-03T21:37:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef39b037cf3574a61fd67b356654f1ea0b91d84f89345c22aae93c1db7694df8
    source_path: security/incident-response.md
    workflow: 16
---

# Olay Müdahalesi

## 1. Tespit ve triyaj

Güvenlik sinyallerini şu kaynaklardan izleriz:

- GitHub Security Advisories (GHSA) ve özel güvenlik açığı bildirimleri.
- Bildirimler hassas olmadığında herkese açık GitHub issue’ları/tartışmaları.
- Otomatik sinyaller (örneğin Dependabot, CodeQL, npm danışma bildirimleri ve gizli bilgi tarama).

İlk triyaj:

1. Etkilenen bileşeni, sürümü ve güven sınırı etkisini doğrulayın.
2. Depodaki `SECURITY.md` kapsamını ve kapsam dışı kuralları kullanarak bunu güvenlik sorunu veya sıkılaştırma/eylem gerektirmez olarak sınıflandırın.
3. Bir olay sahibi buna uygun şekilde yanıt verir.

## 2. Değerlendirme

Önem derecesi kılavuzu:

- **Kritik:** Paket/sürüm/depo ele geçirilmesi, aktif istismar veya yüksek etkili denetim ya da veri ifşasıyla kimlik doğrulaması gerektirmeyen güven sınırı atlatma.
- **Yüksek:** Sınırlı önkoşullar gerektiren doğrulanmış güven sınırı atlatma (örneğin kimliği doğrulanmış ancak yetkisiz yüksek etkili eylem) veya OpenClaw’a ait hassas kimlik bilgilerinin ifşası.
- **Orta:** Pratik etkisi olan ancak istismar edilebilirliği sınırlı ya da önemli önkoşulları bulunan belirgin güvenlik zayıflığı.
- **Düşük:** Savunma derinliği bulguları, dar kapsamlı hizmet reddi veya gösterilmiş bir güven sınırı atlatması olmadan sıkılaştırma/parite açıkları.

## 3. Yanıt

1. Bildirimin alındığını bildiren kişiye onaylayın (hassas olduğunda özel olarak).
2. Desteklenen sürümlerde ve en son `main` üzerinde yeniden üretin, ardından regresyon kapsamıyla bir yamayı uygulayıp doğrulayın.
3. Kritik/yüksek olaylar için düzeltilmiş sürüm(ler)i pratik olarak mümkün olan en hızlı şekilde hazırlayın.
4. Orta/düşük olaylar için normal sürüm akışında yama uygulayın ve azaltma rehberini belgeleyin.

## 4. İletişim

Şu kanallar üzerinden iletişim kurarız:

- Etkilenen depodaki GitHub Security Advisories.
- Düzeltilmiş sürümler için sürüm notları/changelog girdileri.
- Durum ve çözüm hakkında bildirimi yapan kişiyle doğrudan takip.

Açıklama politikası:

- Kritik/yüksek olaylar, uygun olduğunda CVE verilmesiyle birlikte koordineli açıklama almalıdır.
- Düşük riskli sıkılaştırma bulguları, etkiye ve kullanıcı maruziyetine bağlı olarak CVE olmadan sürüm notlarında veya danışma bildirimlerinde belgelenebilir.

## 5. Kurtarma ve takip

Düzeltmeyi yayımladıktan sonra:

1. Düzeltmeleri CI’da ve sürüm yapıtlarında doğrulayın.
2. Kısa bir olay sonrası inceleme yürütün (zaman çizelgesi, kök neden, tespit açığı, önleme planı).
3. Takip sıkılaştırma/testler/belgeler görevleri ekleyin ve bunları tamamlanana kadar izleyin.

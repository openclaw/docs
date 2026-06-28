---
read_when:
    - Bir güvenlik raporuna veya şüpheli bir güvenlik olayına yanıt verme
    - Koordineli açıklama veya yamalı güvenlik sürümü hazırlama
    - Olay sonrası takip beklentilerini gözden geçirme
summary: OpenClaw güvenlik olaylarını nasıl değerlendirir, yanıtlar ve takip eder
title: Olay müdahalesi
x-i18n:
    generated_at: "2026-05-06T09:30:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 546b69242fc4674e3d27e79e4c7b5cfecb83bcb17e8edb2a4b62f1a7498fb84f
    source_path: security/incident-response.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## 1. Tespit ve triyaj

Güvenlik sinyallerini şu kaynaklardan izleriz:

- GitHub Güvenlik Danışmaları (GHSA) ve özel güvenlik açığı raporları.
- Raporlar hassas olmadığında herkese açık GitHub sorunları/tartışmaları.
- Otomatik sinyaller (örneğin Dependabot, CodeQL, npm danışmaları ve gizli bilgi taraması).

İlk triyaj:

1. Etkilenen bileşeni, sürümü ve güven sınırı etkisini doğrulayın.
2. Depo `SECURITY.md` kapsamını ve kapsam dışı kurallarını kullanarak güvenlik sorunu ile güçlendirme/işlem yok olarak sınıflandırın.
3. Bir olay sorumlusu buna göre yanıt verir.

## 2. Değerlendirme

Önem derecesi kılavuzu:

- **Kritik:** Paket/yayın/depo ele geçirilmesi, aktif istismar veya yüksek etkili kontrol ya da veri açığa çıkmasıyla kimliği doğrulanmamış güven sınırı atlatma.
- **Yüksek:** Sınırlı önkoşullar gerektiren doğrulanmış güven sınırı atlatma (örneğin kimliği doğrulanmış ancak yetkisiz yüksek etkili eylem) veya OpenClaw’a ait hassas kimlik bilgilerinin açığa çıkması.
- **Orta:** Pratik etkisi olan ancak istismar edilebilirliği sınırlı ya da önemli önkoşullar gerektiren belirgin güvenlik zayıflığı.
- **Düşük:** Derinlemesine savunma bulguları, dar kapsamlı hizmet reddi veya gösterilmiş bir güven sınırı atlatması olmayan güçlendirme/parite eksikleri.

## 3. Yanıt

1. Raporu aldığınızı bildirene onaylayın (hassas olduğunda özel olarak).
2. Desteklenen sürümlerde ve en son `main` üzerinde yeniden üretin, ardından regresyon kapsamıyla birlikte bir yamayı uygulayın ve doğrulayın.
3. Kritik/yüksek olaylar için yamalı yayınları pratik olarak mümkün olan en hızlı şekilde hazırlayın.
4. Orta/düşük olaylar için normal yayın akışında yama yapın ve azaltma yönergelerini belgeleyin.

## 4. İletişim

Şu kanallar üzerinden iletişim kurarız:

- Etkilenen depodaki GitHub Güvenlik Danışmaları.
- Düzeltilen sürümler için yayın notları/değişiklik günlüğü girdileri.
- Durum ve çözüm hakkında bildirene doğrudan takip.

Açıklama politikası:

- Kritik/yüksek olaylarda, uygun olduğunda CVE verilmesiyle birlikte koordineli açıklama yapılmalıdır.
- Düşük riskli güçlendirme bulguları, etkiye ve kullanıcı maruziyetine bağlı olarak CVE olmadan yayın notlarında veya danışmalarda belgelenebilir.

## 5. Kurtarma ve takip

Düzeltme yayınlandıktan sonra:

1. İyileştirmeleri CI ve yayın artefaktlarında doğrulayın.
2. Kısa bir olay sonrası inceleme yürütün (zaman çizelgesi, kök neden, tespit açığı, önleme planı).
3. Takip güçlendirme/testler/dokümanlar görevlerini ekleyin ve tamamlanana kadar izleyin.

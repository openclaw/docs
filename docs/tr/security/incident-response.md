---
read_when:
    - Bir güvenlik raporuna veya şüphelenilen bir güvenlik olayına yanıt verme
    - Koordineli bir güvenlik açığı açıklaması veya yamalanmış güvenlik sürümü hazırlama
    - Olay sonrası takip beklentilerinin gözden geçirilmesi
summary: OpenClaw güvenlik olaylarını nasıl önceliklendirir, yanıtlar ve takip eder
title: Olay müdahalesi
x-i18n:
    generated_at: "2026-07-12T12:15:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 30f2d754408e95133ee86254ce193c0d8aab293040df55e0c1cec0c4d7644c56
    source_path: security/incident-response.md
    workflow: 16
---

## 1. Tespit ve triyaj

Güvenlik sinyalleri şu kaynaklardan gelir:

- GitHub Güvenlik Bildirimleri (GHSA) ve özel güvenlik açığı raporları.
- Raporların hassas olmadığı durumlarda herkese açık GitHub sorunları/tartışmaları.
- Otomatik sinyaller: Dependabot, CodeQL, npm bildirimleri, gizli bilgi taraması.

İlk triyaj:

1. Etkilenen bileşeni, sürümü ve güven sınırı üzerindeki etkiyi doğrulayın.
2. `SECURITY.md` dosyasındaki kapsam ve kapsam dışı kuralları kullanarak durumu güvenlik sorunu ya da sağlamlaştırma/işlem gerektirmeyen durum olarak sınıflandırın.
3. Olay sorumlusu buna göre yanıt verir.

## 2. Önem derecesi

| Önem derecesi | Tanım                                                                                                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kritik         | Paket, sürüm veya deponun ele geçirilmesi; etkin istismar; ya da yüksek etkili kontrol veya veri ifşasına yol açan, kimlik doğrulaması gerektirmeyen güven sınırı atlatması.                         |
| Yüksek         | Sınırlı ön koşullar gerektiren doğrulanmış güven sınırı atlatması (örneğin, kimliği doğrulanmış ancak yetkisiz yüksek etkili bir eylem) veya OpenClaw'a ait hassas kimlik bilgilerinin ifşa edilmesi. |
| Orta           | Pratik etkisi olan ancak istismar edilebilirliği kısıtlı veya önemli ön koşullar gerektiren kayda değer bir güvenlik zayıflığı.                                                                    |
| Düşük          | Derinlemesine savunma bulguları, dar kapsamlı hizmet reddi veya kanıtlanmış bir güven sınırı atlatması bulunmayan sağlamlaştırma/eşdeğerlik eksiklikleri.                                           |

## 3. Müdahale

1. Raporun alındığını raportöre bildirin (hassas olduğunda özel olarak).
2. Desteklenen sürümlerde ve en son `main` üzerinde sorunu yeniden üretin; ardından regresyon kapsamıyla birlikte bir yama uygulayıp doğrulayın.
3. Kritik/yüksek: Yamalanmış sürümleri mümkün olan en kısa sürede hazırlayın.
4. Orta/düşük: Normal sürüm akışında yamalayın ve azaltma yönergelerini belgelendirin.

## 4. İletişim ve açıklama

Etkilenen depodaki GitHub Güvenlik Bildirimleri, düzeltilen sürümlere ait sürüm notları/değişiklik günlüğü girdileri ve durum ile çözüm hakkında raportöre doğrudan geri bildirim yoluyla iletişim kurun.

Kritik/yüksek önem dereceli olaylar, uygun olduğunda CVE yayımlanmasıyla birlikte koordineli olarak açıklanır. Düşük riskli sağlamlaştırma bulguları, etkiye ve kullanıcıların maruz kalma düzeyine bağlı olarak CVE olmadan sürüm notlarında veya bildirimlerde belgelenebilir.

## 5. Kurtarma ve takip

Düzeltme yayımlandıktan sonra:

1. Düzeltici önlemleri CI'da ve sürüm yapıtlarında doğrulayın.
2. Kısa bir olay sonrası inceleme gerçekleştirin: zaman çizelgesi, temel neden, tespit eksikliği, önleme planı.
3. Takip niteliğindeki sağlamlaştırma/test/dokümantasyon görevlerini ekleyin ve tamamlanana kadar izleyin.

## İlgili

- [Güvenlik politikası](https://github.com/openclaw/openclaw/blob/main/SECURITY.md) — rapor kapsamı ve güven modeli.
- [Tehdit modeli](/tr/security/THREAT-MODEL-ATLAS)

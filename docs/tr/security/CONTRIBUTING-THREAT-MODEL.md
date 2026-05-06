---
read_when:
    - Güvenlik bulguları veya tehdit senaryolarıyla katkıda bulunmak istiyorsunuz
    - Tehdit modelini gözden geçirme veya güncelleme
summary: OpenClaw tehdit modeline nasıl katkıda bulunulur
title: Tehdit modeline katkıda bulunma
x-i18n:
    generated_at: "2026-05-06T18:00:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: a23ca088d7893180a83c02d6971bbf1c32affa724e43019fd40276eaadc52278
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
---

OpenClaw'ı daha güvenli hale getirmeye yardımcı olduğunuz için teşekkürler. Bu tehdit modeli yaşayan bir belgedir ve herkesin katkısını memnuniyetle karşılarız; güvenlik uzmanı olmanız gerekmez.

## Katkıda bulunma yolları

### Tehdit ekleme

Ele almadığımız bir saldırı vektörü veya risk mi fark ettiniz? [openclaw/trust](https://github.com/openclaw/trust/issues) üzerinde bir issue açın ve bunu kendi sözlerinizle açıklayın. Herhangi bir çerçeveyi bilmeniz veya her alanı doldurmanız gerekmez; sadece senaryoyu açıklayın.

**Eklenmesi faydalı olanlar (ancak zorunlu değildir):**

- Saldırı senaryosu ve nasıl istismar edilebileceği
- OpenClaw'ın hangi bölümlerinin etkilendiği (CLI, Gateway, kanallar, ClawHub, MCP sunucuları vb.)
- Sizce ne kadar ciddi olduğu (düşük / orta / yüksek / kritik)
- İlgili araştırmalara, CVE'lere veya gerçek dünyadan örneklere bağlantılar

İnceleme sırasında ATLAS eşlemesini, tehdit kimliklerini ve risk değerlendirmesini biz ele alırız. Bu ayrıntıları eklemek isterseniz harika, ancak beklenmez.

> **Bu, canlı güvenlik açıklarını bildirmek için değil, tehdit modeline ekleme yapmak içindir.** İstismar edilebilir bir güvenlik açığı bulduysanız, sorumlu açıklama yönergeleri için [Trust sayfamıza](https://trust.openclaw.ai) bakın.

### Bir azaltım önerme

Mevcut bir tehdidi nasıl ele alabileceğinize dair bir fikriniz mi var? Tehdide referans veren bir issue veya PR açın. Yararlı azaltımlar belirli ve uygulanabilirdir; örneğin "Gateway'de gönderici başına dakikada 10 mesaj oran sınırlaması", "oran sınırlaması uygulayın" ifadesinden daha iyidir.

### Bir saldırı zinciri önerme

Saldırı zincirleri, birden çok tehdidin gerçekçi bir saldırı senaryosunda nasıl birleştiğini gösterir. Tehlikeli bir kombinasyon görürseniz, adımları ve bir saldırganın bunları nasıl zincirleyeceğini açıklayın. Saldırının pratikte nasıl geliştiğine dair kısa bir anlatı, resmi bir şablondan daha değerlidir.

### Mevcut içeriği düzeltme veya iyileştirme

Yazım hataları, açıklamalar, güncel olmayan bilgiler, daha iyi örnekler; PR'lar memnuniyetle karşılanır, issue gerekmez.

## Ne kullanıyoruz

### MITRE ATLAS çerçevesi

Bu tehdit modeli, prompt injection, araçların kötüye kullanımı ve ajan istismarı gibi AI/ML tehditleri için özel olarak tasarlanmış bir çerçeve olan [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems) üzerine kuruludur. Katkıda bulunmak için ATLAS bilmeniz gerekmez; gönderimleri inceleme sırasında çerçeveyle eşleştiririz.

### Tehdit kimlikleri

Her tehdit `T-EXEC-003` gibi bir kimlik alır. Kategoriler şunlardır:

| Kod     | Kategori                                 |
| ------- | ---------------------------------------- |
| RECON   | Keşif - bilgi toplama                    |
| ACCESS  | İlk erişim - giriş elde etme             |
| EXEC    | Yürütme - kötü amaçlı eylemler çalıştırma |
| PERSIST | Kalıcılık - erişimi sürdürme             |
| EVADE   | Savunmadan kaçınma - tespitten kaçınma   |
| DISC    | Keşif - ortam hakkında bilgi edinme      |
| EXFIL   | Dışarı sızdırma - veri çalma             |
| IMPACT  | Etki - hasar veya kesinti                |

Kimlikler inceleme sırasında bakımcılar tarafından atanır. Birini seçmeniz gerekmez.

### Risk seviyeleri

| Seviye       | Anlam                                                            |
| ------------ | ---------------------------------------------------------------- |
| **Kritik**   | Tam sistem ele geçirilmesi veya yüksek olasılık + kritik etki    |
| **Yüksek**   | Önemli hasar olası veya orta olasılık + kritik etki              |
| **Orta**     | Orta düzey risk veya düşük olasılık + yüksek etki                |
| **Düşük**    | Olası değil ve sınırlı etki                                      |

Risk seviyesinden emin değilseniz, yalnızca etkiyi açıklayın; biz değerlendiririz.

## İnceleme süreci

1. **Triyaj** - Yeni gönderimleri 48 saat içinde inceleriz
2. **Değerlendirme** - Uygulanabilirliği doğrular, ATLAS eşlemesini ve tehdit kimliğini atar, risk seviyesini doğrularız
3. **Dokümantasyon** - Her şeyin biçimlendirilmiş ve eksiksiz olduğundan emin oluruz
4. **Birleştirme** - Tehdit modeline ve görselleştirmeye eklenir

## Kaynaklar

- [ATLAS Web Sitesi](https://atlas.mitre.org/)
- [ATLAS Teknikleri](https://atlas.mitre.org/techniques/)
- [ATLAS Vaka Çalışmaları](https://atlas.mitre.org/studies/)
- [OpenClaw Tehdit Modeli](/tr/security/THREAT-MODEL-ATLAS)

## İletişim

- **Güvenlik açıkları:** Bildirim yönergeleri için [Trust sayfamıza](https://trust.openclaw.ai) bakın
- **Tehdit modeli soruları:** [openclaw/trust](https://github.com/openclaw/trust/issues) üzerinde bir issue açın
- **Genel sohbet:** Discord #security kanalı

## Takdir

Tehdit modeline katkıda bulunanlar, önemli katkıları için tehdit modeli teşekkürlerinde, sürüm notlarında ve OpenClaw güvenlik onur listesinde takdir edilir.

## İlgili

- [Tehdit modeli](/tr/security/THREAT-MODEL-ATLAS)
- [Resmi doğrulama](/tr/security/formal-verification)

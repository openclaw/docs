---
read_when:
    - Güvenlik bulguları veya tehdit senaryoları katkısında bulunmak istiyorsunuz
    - Tehdit modelini gözden geçirme veya güncelleme
summary: OpenClaw tehdit modeline nasıl katkıda bulunulur
title: Tehdit modeline katkıda bulunma
x-i18n:
    generated_at: "2026-04-30T09:45:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75cf2b408a78fce5134d24a3f115490da2dacc4ba8a1a24415425c3e4420ca55
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
---

# OpenClaw Tehdit Modeline Katkıda Bulunma

OpenClaw’ı daha güvenli hale getirmeye yardımcı olduğunuz için teşekkürler. Bu tehdit modeli yaşayan bir belgedir ve herkesten katkı bekleriz - güvenlik uzmanı olmanız gerekmez.

## Katkıda Bulunma Yolları

### Tehdit Ekleme

Ele almadığımız bir saldırı vektörü veya risk mi fark ettiniz? [openclaw/trust](https://github.com/openclaw/trust/issues) üzerinde bir issue açın ve bunu kendi sözlerinizle açıklayın. Herhangi bir çerçeveyi bilmeniz veya her alanı doldurmanız gerekmez - yalnızca senaryoyu açıklayın.

**Eklemek yararlı olur (ancak zorunlu değildir):**

- Saldırı senaryosu ve nasıl istismar edilebileceği
- OpenClaw’ın hangi bölümlerinin etkilendiği (CLI, Gateway, kanallar, ClawHub, MCP sunucuları vb.)
- Sizce ne kadar ciddi olduğu (düşük / orta / yüksek / kritik)
- İlgili araştırmalara, CVE’lere veya gerçek dünya örneklerine bağlantılar

ATLAS eşlemesini, tehdit kimliklerini ve risk değerlendirmesini inceleme sırasında biz hallederiz. Bu ayrıntıları eklemek isterseniz harika - ancak beklenmez.

> **Bu, tehdit modeline ekleme yapmak içindir; canlı güvenlik açıklarını bildirmek için değildir.** İstismar edilebilir bir güvenlik açığı bulduysanız, sorumlu açıklama talimatları için [Trust sayfamıza](https://trust.openclaw.ai) bakın.

### Azaltma Önlemi Önerme

Mevcut bir tehdidi nasıl ele alabileceğinize dair bir fikriniz mi var? Tehdide atıfta bulunan bir issue veya PR açın. Yararlı azaltma önlemleri belirli ve uygulanabilirdir - örneğin, "Gateway’de gönderici başına 10 mesaj/dakika hız sınırlaması", "hız sınırlaması uygulayın" ifadesinden daha iyidir.

### Saldırı Zinciri Önerme

Saldırı zincirleri, birden çok tehdidin gerçekçi bir saldırı senaryosunda nasıl birleştiğini gösterir. Tehlikeli bir kombinasyon görürseniz adımları ve bir saldırganın bunları nasıl birbirine zincirleyeceğini açıklayın. Saldırının pratikte nasıl geliştiğine dair kısa bir anlatı, resmi bir şablondan daha değerlidir.

### Mevcut İçeriği Düzeltme veya İyileştirme

Yazım hataları, netleştirmeler, güncel olmayan bilgiler, daha iyi örnekler - PR’lar memnuniyetle karşılanır, issue gerekmez.

## Kullandıklarımız

### MITRE ATLAS

Bu tehdit modeli, prompt enjeksiyonu, araç kötüye kullanımı ve ajan istismarı gibi AI/ML tehditleri için özel olarak tasarlanmış bir çerçeve olan [MITRE ATLAS](https://atlas.mitre.org/) (Yapay Zeka Sistemleri için Hasmane Tehdit Ortamı) üzerine kuruludur. Katkıda bulunmak için ATLAS bilmeniz gerekmez - gönderimleri inceleme sırasında çerçeveyle eşleştiririz.

### Tehdit Kimlikleri

Her tehdit `T-EXEC-003` gibi bir kimlik alır. Kategoriler şunlardır:

| Kod     | Kategori                                  |
| ------- | ----------------------------------------- |
| RECON   | Keşif - bilgi toplama                     |
| ACCESS  | İlk erişim - giriş elde etme              |
| EXEC    | Yürütme - kötü amaçlı eylemler çalıştırma |
| PERSIST | Kalıcılık - erişimi sürdürme              |
| EVADE   | Savunmadan kaçınma - tespitten kaçınma    |
| DISC    | Keşif - ortam hakkında bilgi edinme       |
| EXFIL   | Veri sızdırma - veri çalma                |
| IMPACT  | Etki - hasar veya kesinti                 |

Kimlikler inceleme sırasında bakımcılar tarafından atanır. Birini seçmeniz gerekmez.

### Risk seviyeleri

| Seviye       | Anlam                                                         |
| ------------ | ------------------------------------------------------------- |
| **Kritik**   | Tam sistem ele geçirilmesi veya yüksek olasılık + kritik etki |
| **Yüksek**   | Önemli hasarın olası olması veya orta olasılık + kritik etki  |
| **Orta**     | Orta düzey risk veya düşük olasılık + yüksek etki             |
| **Düşük**    | Olası değil ve sınırlı etki                                   |

Risk seviyesi konusunda emin değilseniz yalnızca etkiyi açıklayın, biz değerlendiririz.

## İnceleme süreci

1. **Triyaj** - Yeni gönderimleri 48 saat içinde inceleriz
2. **Değerlendirme** - Uygulanabilirliği doğrular, ATLAS eşlemesini ve tehdit kimliğini atar, risk seviyesini doğrularız
3. **Dokümantasyon** - Her şeyin biçimlendirilmiş ve eksiksiz olmasını sağlarız
4. **Birleştirme** - Tehdit modeline ve görselleştirmeye eklenir

## Kaynaklar

- [ATLAS Web Sitesi](https://atlas.mitre.org/)
- [ATLAS Teknikleri](https://atlas.mitre.org/techniques/)
- [ATLAS Vaka Çalışmaları](https://atlas.mitre.org/studies/)
- [OpenClaw Tehdit Modeli](/tr/security/THREAT-MODEL-ATLAS)

## İletişim

- **Güvenlik açıkları:** Bildirim talimatları için [Trust sayfamıza](https://trust.openclaw.ai) bakın
- **Tehdit modeli soruları:** [openclaw/trust](https://github.com/openclaw/trust/issues) üzerinde bir issue açın
- **Genel sohbet:** Discord #security kanalı

## Takdir

Tehdit modeline katkıda bulunanlar, önemli katkıları için tehdit modeli teşekkürlerinde, sürüm notlarında ve OpenClaw güvenlik onur listesinde takdir edilir.

## İlgili

- [Tehdit modeli](/tr/security/THREAT-MODEL-ATLAS)
- [Resmi doğrulama](/tr/security/formal-verification)

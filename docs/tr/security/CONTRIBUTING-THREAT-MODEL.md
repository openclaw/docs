---
read_when:
    - Güvenlik bulgularına veya tehdit senaryolarına katkıda bulunmak istiyorsunuz
    - Tehdit modelini gözden geçiriyor veya güncelliyorsunuz
summary: OpenClaw tehdit modeline nasıl katkıda bulunulur
title: Tehdit Modeline Katkıda Bulunma
x-i18n:
    generated_at: "2026-04-05T14:08:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9cd212d456571a25da63031588d3b584bdfc119e2096b528b97a3f7ec5e4b3db
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 15
---

# OpenClaw Tehdit Modeline Katkıda Bulunma

OpenClaw'ı daha güvenli hâle getirmeye yardımcı olduğunuz için teşekkürler. Bu tehdit modeli yaşayan bir belgedir ve herkesten gelen katkıları memnuniyetle karşılarız - güvenlik uzmanı olmanız gerekmez.

## Katkıda Bulunma Yolları

### Tehdit Ekleme

Kapsamadığımız bir saldırı vektörü veya risk mi fark ettiniz? [openclaw/trust](https://github.com/openclaw/trust/issues) üzerinde bir issue açın ve bunu kendi sözlerinizle açıklayın. Herhangi bir çerçeveyi bilmeniz veya her alanı doldurmanız gerekmez - yalnızca senaryoyu açıklayın.

**Eklenmesi faydalı olur (ama zorunlu değildir):**

- Saldırı senaryosu ve bunun nasıl istismar edilebileceği
- OpenClaw'ın hangi bölümlerinin etkilendiği (CLI, gateway, kanallar, ClawHub, MCP sunucuları vb.)
- Bunun ne kadar ciddi olduğunu düşündüğünüz (düşük / orta / yüksek / kritik)
- İlgili araştırmalara, CVE'lere veya gerçek dünyadan örneklere ait bağlantılar

İnceleme sırasında ATLAS eşlemesini, tehdit kimliklerini ve risk değerlendirmesini biz ele alacağız. Bu ayrıntıları siz eklemek isterseniz harika - ancak beklenen bir şey değildir.

> **Bu, canlı güvenlik açıklarını bildirmek için değil, tehdit modeline ekleme yapmak içindir.** İstismar edilebilir bir güvenlik açığı bulduysanız, sorumlu açıklama talimatları için [Trust sayfamıza](https://trust.openclaw.ai) bakın.

### Bir Azaltım Önerme

Mevcut bir tehdidi ele alma konusunda bir fikriniz mi var? Tehdide referans veren bir issue veya PR açın. Yararlı azaltımlar belirli ve uygulanabilir olur - örneğin "oran sınırlaması uygulayın" yerine gateway'de "gönderen başına dakikada 10 mesaj oran sınırlaması" daha iyidir.

### Bir Saldırı Zinciri Önerme

Saldırı zincirleri, birden fazla tehdidin gerçekçi bir saldırı senaryosunda nasıl birleştiğini gösterir. Tehlikeli bir birleşim görüyorsanız, adımları ve bir saldırganın bunları nasıl zincirleyeceğini açıklayın. Saldırının pratikte nasıl geliştiğine dair kısa bir anlatı, resmi bir şablondan daha değerlidir.

### Mevcut İçeriği Düzeltme veya İyileştirme

Yazım hataları, açıklık kazandırmalar, güncelliğini yitirmiş bilgiler, daha iyi örnekler - PR'lar memnuniyetle karşılanır, issue gerekmez.

## Kullandıklarımız

### MITRE ATLAS

Bu tehdit modeli, özellikle istem enjeksiyonu, araç kötüye kullanımı ve aracı istismarı gibi AI/ML tehditleri için tasarlanmış bir çerçeve olan [MITRE ATLAS](https://atlas.mitre.org/) (AI Sistemleri için Hasım Tehdit Ortamı) üzerine kuruludur. Katkıda bulunmak için ATLAS'ı bilmeniz gerekmez - gönderimleri inceleme sırasında çerçeveye eşliyoruz.

### Tehdit Kimlikleri

Her tehdit `T-EXEC-003` gibi bir kimlik alır. Kategoriler şunlardır:

| Code    | Category                                   |
| ------- | ------------------------------------------ |
| RECON   | Keşif - bilgi toplama                      |
| ACCESS  | İlk erişim - giriş kazanma                 |
| EXEC    | Yürütme - kötü amaçlı eylemler çalıştırma  |
| PERSIST | Kalıcılık - erişimi sürdürme               |
| EVADE   | Savunmadan kaçınma - tespitten kaçınma     |
| DISC    | Ortamı keşfetme - çevre hakkında öğrenme   |
| EXFIL   | Veri sızdırma - veri çalma                 |
| IMPACT  | Etki - zarar veya kesinti                  |

Kimlikler inceleme sırasında bakımcılar tarafından atanır. Sizin bir tane seçmeniz gerekmez.

### Risk Düzeyleri

| Level        | Meaning                                                           |
| ------------ | ----------------------------------------------------------------- |
| **Critical** | Tam sistem ele geçirilmesi veya yüksek olasılık + kritik etki     |
| **High**     | Önemli zararın muhtemel olması veya orta olasılık + kritik etki   |
| **Medium**   | Orta düzey risk veya düşük olasılık + yüksek etki                 |
| **Low**      | Düşük olasılıklı ve sınırlı etki                                  |

Risk düzeyinden emin değilseniz, yalnızca etkiyi açıklayın; değerlendirmeyi biz yaparız.

## İnceleme Süreci

1. **Ön değerlendirme** - Yeni gönderimleri 48 saat içinde inceleriz
2. **Değerlendirme** - Uygulanabilirliği doğrular, ATLAS eşlemesini ve tehdit kimliğini atar, risk düzeyini doğrularız
3. **Belgelendirme** - Her şeyin biçimlendirilmiş ve eksiksiz olduğundan emin oluruz
4. **Birleştirme** - Tehdit modeline ve görselleştirmeye eklenir

## Kaynaklar

- [ATLAS Web Sitesi](https://atlas.mitre.org/)
- [ATLAS Teknikleri](https://atlas.mitre.org/techniques/)
- [ATLAS Vaka Çalışmaları](https://atlas.mitre.org/studies/)
- [OpenClaw Tehdit Modeli](/security/THREAT-MODEL-ATLAS)

## İletişim

- **Güvenlik açıkları:** Bildirim talimatları için [Trust sayfamıza](https://trust.openclaw.ai) bakın
- **Tehdit modeli soruları:** [openclaw/trust](https://github.com/openclaw/trust/issues) üzerinde bir issue açın
- **Genel sohbet:** Discord #security kanalı

## Tanınma

Tehdit modeline katkıda bulunanlar, önemli katkılar için tehdit modeli teşekkür bölümünde, sürüm notlarında ve OpenClaw güvenlik şeref listesinde tanınır.

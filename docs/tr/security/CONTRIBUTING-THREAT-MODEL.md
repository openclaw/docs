---
read_when:
    - Güvenlik bulgularına veya tehdit senaryolarına katkı sağlamak istiyorsunuz
    - Tehdit modelini gözden geçirme veya güncelleme
summary: OpenClaw tehdit modeline nasıl katkı sağlanır
title: Tehdit modeline katkı sağlama
x-i18n:
    generated_at: "2026-04-24T09:31:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 21cf130c2d8641b66b87de86a3ea718cd7c751c29ed9bf5e0bd76b43d65d0964
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 15
---

# OpenClaw Tehdit Modeline Katkı Sağlama

OpenClaw'ı daha güvenli hâle getirmeye yardımcı olduğunuz için teşekkürler. Bu tehdit modeli yaşayan bir belgedir ve güvenlik uzmanı olmanız gerekmeden herkesten katkı kabul ediyoruz.

## Katkı Sağlama Yolları

### Bir Tehdit Ekleyin

Kapsamadığımız bir saldırı vektörü veya risk mi fark ettiniz? [openclaw/trust](https://github.com/openclaw/trust/issues) üzerinde bir issue açın ve bunu kendi sözlerinizle açıklayın. Herhangi bir çerçeveyi bilmeniz veya her alanı doldurmanız gerekmez — yalnızca senaryoyu anlatın.

**Eklenmesi yararlı olanlar (ama zorunlu değil):**

- Saldırı senaryosu ve nasıl istismar edilebileceği
- OpenClaw'ın hangi bölümlerinin etkilendiği (CLI, Gateway, kanallar, ClawHub, MCP sunucuları vb.)
- Bunun ne kadar ciddi olduğunu düşündüğünüz (low / medium / high / critical)
- İlgili araştırmalara, CVE'lere veya gerçek dünya örneklerine bağlantılar

ATLAS eşlemesini, tehdit kimliklerini ve risk değerlendirmesini inceleme sırasında biz ele alacağız. Bu ayrıntıları eklemek isterseniz harika — ama beklenmez.

> **Bu, canlı güvenlik açıklarını bildirmek değil, tehdit modeline ekleme yapmak içindir.** İstismar edilebilir bir güvenlik açığı bulduysanız sorumlu açıklama talimatları için [Trust sayfamıza](https://trust.openclaw.ai) bakın.

### Bir Önlem Önerin

Mevcut bir tehdidin nasıl ele alınacağına dair bir fikriniz mi var? Tehdide referans veren bir issue veya PR açın. Yararlı önlemler belirgin ve uygulanabilir olur — örneğin, "oran sınırlaması uygulayın" yerine "Gateway'de gönderici başına dakikada 10 ileti oran sınırlaması" daha iyidir.

### Bir Saldırı Zinciri Önerin

Saldırı zincirleri, birden fazla tehdidin nasıl birleşerek gerçekçi bir saldırı senaryosu oluşturduğunu gösterir. Tehlikeli bir birleşim görüyorsanız adımları ve bir saldırganın bunları nasıl zincirleyeceğini açıklayın. Saldırının pratikte nasıl geliştiğine dair kısa bir anlatım, resmî bir şablondan daha değerlidir.

### Mevcut İçeriği Düzeltin veya İyileştirin

Yazım hataları, açıklamalar, eski bilgiler, daha iyi örnekler — PR'lar memnuniyetle karşılanır, issue gerekmez.

## Kullandıklarımız

### MITRE ATLAS

Bu tehdit modeli, istem enjeksiyonu, araç kötüye kullanımı ve agent istismarı gibi yapay zekâ/ML tehditleri için özel olarak tasarlanmış bir çerçeve olan [MITRE ATLAS](https://atlas.mitre.org/) (AI Sistemleri için Saldırgan Tehdit Manzarası) üzerine kuruludur. Katkı sağlamak için ATLAS bilmeniz gerekmez — gönderimleri inceleme sırasında çerçeveye eşliyoruz.

### Tehdit Kimlikleri

Her tehdit `T-EXEC-003` gibi bir kimlik alır. Kategoriler şunlardır:

| Kod     | Kategori                                  |
| ------- | ----------------------------------------- |
| RECON   | Keşif - bilgi toplama                     |
| ACCESS  | İlk erişim - giriş kazanma                |
| EXEC    | Yürütme - kötü amaçlı eylemleri çalıştırma |
| PERSIST | Kalıcılık - erişimi sürdürme              |
| EVADE   | Savunmadan kaçınma - tespitten kaçma      |
| DISC    | Discovery - ortam hakkında bilgi edinme   |
| EXFIL   | Sızdırma - veri çalma                     |
| IMPACT  | Etki - zarar veya kesinti                 |

Kimlikler inceleme sırasında bakımcılar tarafından atanır. Sizin bir tane seçmeniz gerekmez.

### Risk Düzeyleri

| Düzey        | Anlamı                                                          |
| ------------ | ---------------------------------------------------------------- |
| **Critical** | Tam sistem ele geçirilmesi veya yüksek olasılık + kritik etki   |
| **High**     | Büyük zararın olası olması veya orta olasılık + kritik etki     |
| **Medium**   | Orta düzey risk veya düşük olasılık + yüksek etki               |
| **Low**      | Düşük olasılık ve sınırlı etki                                  |

Risk düzeyinden emin değilseniz yalnızca etkiyi açıklayın, biz değerlendiririz.

## İnceleme Süreci

1. **Triage** - Yeni gönderimleri 48 saat içinde inceleriz
2. **Değerlendirme** - Uygulanabilirliği doğrular, ATLAS eşlemesi ve tehdit kimliği atar, risk düzeyini doğrularız
3. **Belgeleme** - Her şeyin biçimlendirilmiş ve eksiksiz olduğundan emin oluruz
4. **Birleştirme** - Tehdit modeline ve görselleştirmeye eklenir

## Kaynaklar

- [ATLAS Website](https://atlas.mitre.org/)
- [ATLAS Techniques](https://atlas.mitre.org/techniques/)
- [ATLAS Case Studies](https://atlas.mitre.org/studies/)
- [OpenClaw Threat Model](/tr/security/THREAT-MODEL-ATLAS)

## İletişim

- **Güvenlik açıkları:** Bildirim talimatları için [Trust sayfamıza](https://trust.openclaw.ai) bakın
- **Tehdit modeli soruları:** [openclaw/trust](https://github.com/openclaw/trust/issues) üzerinde bir issue açın
- **Genel sohbet:** Discord `#security` kanalı

## Takdir

Tehdit modeline katkı sağlayanlar, önemli katkılar için tehdit modeli teşekkür bölümünde, sürüm notlarında ve OpenClaw güvenlik onur listesinde tanınır.

## İlgili

- [Tehdit modeli](/tr/security/THREAT-MODEL-ATLAS)
- [Formal verification](/tr/security/formal-verification)

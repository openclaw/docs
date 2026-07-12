---
read_when:
    - Güvenlik bulgılarına veya tehdit senaryolarına katkıda bulunmak istiyorsunuz
    - Tehdit modelini gözden geçirme veya güncelleme
summary: OpenClaw tehdit modeline nasıl katkıda bulunulur
title: Tehdit modeline katkıda bulunma
x-i18n:
    generated_at: "2026-07-12T12:14:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e2e5cd95e8a2bf5ee4bd167afedfadf9aa876e4260e2d0bfb5f414cd4255410
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
---

[Tehdit modeli](/tr/security/THREAT-MODEL-ATLAS) yaşayan bir belgedir. Herkesin katkısı memnuniyetle karşılanır; güvenlik veya MITRE ATLAS geçmişine sahip olmanız gerekmez.

<Note>
Bu bölüm, etkin güvenlik açıklarını bildirmek için değil, tehdit modeline ekleme yapmak içindir. İstismar edilebilir bir güvenlik açığı bulduysanız bunun yerine [Trust sayfasındaki](https://trust.openclaw.ai) sorumlu açıklama talimatlarını izleyin.
</Note>

## Katkıda bulunma yolları

**Tehdit ekleyin.** Saldırı senaryosunu kendi ifadelerinizle açıklayan bir konu kaydını [openclaw/trust](https://github.com/openclaw/trust/issues) üzerinde açın. Aşağıdakiler yararlıdır ancak zorunlu değildir:

- Saldırı senaryosu ve bunun nasıl istismar edilebileceği.
- Etkilenen bileşenler (CLI, Gateway, kanallar, ClawHub, MCP sunucuları vb.).
- Önem derecesine ilişkin tahmininiz (düşük / orta / yüksek / kritik).
- İlgili araştırmalara, CVE'lere veya gerçek dünya örneklerine bağlantılar.

Bakım sorumluları inceleme sırasında ATLAS eşlemesini, tehdit kimliğini ve risk düzeyini belirler.

**Bir azaltma önlemi önerin.** Tehdide başvuran bir konu kaydı veya PR açın. Öneriniz belirli ve uygulanabilir olsun: "Gateway üzerinde gönderici başına dakikada 10 iletiyle hız sınırlaması", "hız sınırlaması uygulayın" ifadesinden daha yararlıdır.

**Bir saldırı zinciri önerin.** Saldırı zincirleri, birden fazla tehdidin gerçekçi bir senaryoda nasıl birleştiğini gösterir. Adımları ve bir saldırganın bunları nasıl zincirleyeceğini açıklayın; kısa bir anlatım, resmî bir şablondan daha etkilidir.

**Mevcut içeriği düzeltin veya iyileştirin.** Yazım hataları, açıklamalar, güncelliğini yitirmiş bilgiler ve daha iyi örnekler için PR'lar memnuniyetle karşılanır; konu kaydı gerekmez.

## Çerçeve başvurusu

Tehditler; istem enjeksiyonu, araçların kötüye kullanılması ve ajan istismarı gibi yapay zekâ/makine öğrenimine özgü tehditlere yönelik bir çerçeve olan [MITRE ATLAS](https://atlas.mitre.org/) (Yapay Zekâ Sistemleri için Hasmane Tehdit Ortamı) ile eşleştirilir. Katkıda bulunmak için ATLAS'ı bilmeniz gerekmez; bakım sorumluları gönderimleri inceleme sırasında eşler.

**Tehdit kimlikleri.** Her tehdit, inceleme sırasında bakım sorumluları tarafından atanan `T-EXEC-003` benzeri bir kimlik alır.

| Kod     | Kategori                                      |
| ------- | --------------------------------------------- |
| RECON   | Keşif - bilgi toplama                         |
| ACCESS  | İlk erişim - sisteme giriş elde etme          |
| EXEC    | Yürütme - kötü amaçlı eylemler gerçekleştirme |
| PERSIST | Kalıcılık - erişimi sürdürme                   |
| EVADE   | Savunmadan kaçınma - tespit edilmekten kaçınma |
| DISC    | Ortam keşfi - ortam hakkında bilgi edinme     |
| EXFIL   | Veri sızdırma - verileri çalma                |
| IMPACT  | Etki - hasar veya kesinti                     |

**Risk düzeyleri.** Düzeyden emin değilseniz yalnızca etkiyi açıklayın; bakım sorumluları düzeyi değerlendirir.

| Düzey        | Anlam                                                               |
| ------------ | ------------------------------------------------------------------- |
| **Kritik**   | Sistemin tamamen ele geçirilmesi veya yüksek olasılık + kritik etki |
| **Yüksek**   | Önemli hasar olasılığı veya orta olasılık + kritik etki             |
| **Orta**     | Orta düzey risk veya düşük olasılık + yüksek etki                   |
| **Düşük**    | Düşük olasılık ve sınırlı etki                                     |

## İnceleme süreci

1. **Ön değerlendirme** - yeni gönderimler 48 saat içinde incelenir.
2. **Değerlendirme** - bakım sorumluları uygulanabilirliği doğrular, ATLAS eşlemesini ve tehdit kimliğini atar, risk düzeyini doğrular.
3. **Belgelendirme** - biçimlendirme ve eksiksizlik denetimi yapılır.
4. **Birleştirme** - tehdit modeline ve görselleştirmeye eklenir.

## Kaynaklar

- [ATLAS web sitesi](https://atlas.mitre.org/)
- [ATLAS teknikleri](https://atlas.mitre.org/techniques/)
- [ATLAS vaka çalışmaları](https://atlas.mitre.org/studies/)

## İletişim

- **Güvenlik açıkları:** Bildirim talimatları için [Trust sayfasına](https://trust.openclaw.ai) bakın veya `security@openclaw.ai` adresini kullanın.
- **Tehdit modeli soruları:** [openclaw/trust](https://github.com/openclaw/trust/issues) üzerinde bir konu kaydı açın.
- **Genel sohbet:** Discord `#security` kanalı.

## Takdir

Tehdit modeline katkıda bulunanlar, tehdit modeli teşekkür bölümünde ve sürüm notlarında anılır; önemli katkılar ayrıca OpenClaw güvenlik onur listesinde yer alır.

## İlgili

- [Tehdit modeli](/tr/security/THREAT-MODEL-ATLAS)
- [Olay müdahalesi](/tr/security/incident-response)
- [Biçimsel doğrulama](/tr/security/formal-verification)

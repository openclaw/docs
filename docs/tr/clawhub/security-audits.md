---
read_when:
    - ClawHub güvenlik denetimi sonuçlarını anlama
    - Bir skill veya plugin kurulup kurulmayacağına karar verme
    - ClawHub denetim durumunu, risk düzeyini veya bulgularını açıklama
sidebarTitle: Security Audits
summary: Bir beceri veya Plugin yüklemeden önce ClawHub güvenlik denetimi sonuçlarını nasıl anlayacağınız.
title: Güvenlik Denetimleri
x-i18n:
    generated_at: "2026-07-05T05:28:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Güvenlik Denetimleri

ClawHub güvenlik denetimleri, bir skill veya plugin'in kurulacak kadar güvenli
olup olmadığına karar vermenize yardımcı olur. Bir sürümün ne yaptığını, hangi
yetkileri istediğini ve dosyalara, hesaplara, kimlik bilgilerine, koda veya dış
servislere erişmeden önce ekstra dikkat gerektiren bir şey olup olmadığını
gösterir.

Denetimler güçlü güvenlik sinyalleridir, ancak bir sürümün risksiz olduğunun
garantisi değildir. Hassas erişim vermeden önce her zaman kendi değerlendirmenizi
kullanın.

Ayrıca bkz. [Güvenlik](/clawhub/security), [Kabul edilebilir kullanım](/clawhub/acceptable-usage)
ve [Moderasyon ve Hesap Güvenliği](/clawhub/moderation).

## Kurulumdan önce kontrol edilecekler

Kurulumdan önce şunları inceleyin:

- genel denetim durumu
- risk düzeyi
- listelenen bulgular
- gerekli kimlik bilgileri, izinler veya ortam değişkenleri
- sahip, kaynak, sürüm, değişiklik günlüğü, indirmeler, yıldızlar ve diğer güven sinyalleri

Yalnızca anladığınız ve güvendiğiniz içerikleri kurun.

## Denetim durumu

Denetim durumu, denetim sonucuna nasıl tepki vermeniz gerektiğini söyler:

| Durum       | Anlamı                                                                    |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Düşük riskin üzerinde görünür bir sorun bulunmadı.                        |
| `Review`    | Kurmadan önce bulguları okuyun. Sürüm yine de meşru olabilir.             |
| `Warn`      | Ekstra dikkatli olun. ClawHub yüksek etkili bir endişe veya uyarı sinyali buldu. |
| `Malicious` | Kurmayın.                                                                 |
| `Pending`   | Denetimler henüz tamamlanmadı.                                            |
| `Error`     | Denetim tamamlanamadı.                                                    |

`Pass` güven vericidir, ancak kendi değerlendirmenizin yerini almaz. Bu en çok
içerik yayımlayabilen, veri düzenleyebilen, komut çalıştırabilen, dosya
okuyabilen veya üretim sistemlerine erişebilen araçlar için önemlidir.

## Risk düzeyi

Risk düzeyi etki alanını açıklar: sürüm, amaçlandığı gibi kullanıldığında ne
kadar yetkiye sahip görünüyor.

| Risk düzeyi | Anlamı                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| `Low`      | Az miktarda hassas yetki veya kullanıcı etkisi bulundu.                       |
| `Medium`   | Sürüm, hesap erişimi veya veri değişiklikleri gibi anlamlı yetkilere sahip.   |
| `High`     | Sürüm yüksek etkili yetkilere, ciddi bulgulara veya kötü amaçlı sinyallere sahip. |

Risk düzeyi ve denetim durumu farklı soruları yanıtlar:

- Risk düzeyi şunu sorar: "Burada ne kadar yetki var?"
- Denetim durumu şunu sorar: "Bu sonuçla ne yapmalıyım?"

Örneğin, bir yayımlama skill'i `Medium` risk ile `Review` gösterebilir. Bu,
onun kötü amaçlı olduğu anlamına gelmez. Skill'in amaca uygun göründüğü, ancak
anlamlı hesap yetkisiyle işlem yapabildiği anlamına gelir.

## Bulgular

Bulgular, bir denetim sonucunun neden gösterildiğini açıklar. Her bulgu genellikle
şunları içerir:

- ne anlama geldiği
- neden işaretlendiği
- ilgili skill veya plugin içeriği
- bir öneri

Bulgular `Info`, `Low`, `Medium`, `High` veya `Critical` olarak etiketlenebilir.
Daha yüksek önem derecesine sahip bulgular, risk düzeyine ve denetim durumuna
daha güçlü katkıda bulunur.

Düşük güvenilirlikli bulgular, sayfanın yararlı kanıtlara odaklı kalması için
genel denetim özetinden gizlenir.

## ClawHub neleri kontrol eder

ClawHub, gönderilen sürüm yapıtlarını denetler; bunlara şunlar dahildir:

- skill talimatları veya plugin meta verileri
- beyan edilen ortam değişkenleri ve izinler
- kurulum talimatları ve paket meta verileri
- dahil edilen dosyalar ve dosya manifestleri
- uyumluluk ve yetenek meta verileri

Ana soru tutarlılıktır: ad, özet, meta veriler, istenen yetki ve gerçek içerik,
kullanıcıların makul olarak bekleyeceği şeylerle örtüşüyor mu?

Güçlü davranış otomatik olarak kötü değildir. Birçok yararlı araç kimlik
bilgilerine, yerel komutlara, sağlayıcı API'lerine veya paket kurulumlarına
ihtiyaç duyar. Denetim, bu yetkinin beklenen, açıklanmış ve orantılı olup
olmadığını kontrol eder.

Yapıt sayfaları tam denetime şu adreste bağlantı verir:

```text
/<owner>/skills/<slug>/security-audit
```

Denetim sayfası şunları birleştirir:

1. SkillSpector
2. VirusTotal
3. Risk analizi

## VirusTotal

ClawHub, denetim yığınında kötü amaçlı yazılım telemetrisi olarak VirusTotal'ı
kullanır. VirusTotal, dosya itibarı ve kötü amaçlı yazılım taraması için
güvenilir bir sektör standardıdır ve ortaklığımız ClawHub'ın skill ve plugin
incelemesine daha geniş güvenlik zekası eklemesini sağlar.

VirusTotal özellikle bilinen kötü amaçlı yapıtlar, motor eşleşmeleri ve ClawHub'ın
ajan farkındalıklı incelemesini tamamlayan itibar sinyalleri için yararlıdır.
Tedarikçi motor sayıları mevcut olduğunda denetim bunları düz bir dille özetler,
örneğin:

```text
62/62 vendors flagged this skill as clean.
```

veya:

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

ClawHub'ın özetleyebileceği tedarikçi sayımı telemetrisi olmadığında denetim
şunu söyler:

```text
No VirusTotal findings
```

VirusTotal telemetri olarak kalır. ClawHub'ın kendi yapıt farkındalıklı risk
analizinin yerini almaz.

## Risk analizi

Risk analizi, dahili olarak ClawHub'ın kendi güvenlik denetim sistemi ClawScan
tarafından desteklenir. Her sürümü ajanlara yönelik bir yapıt olarak inceler:
talimatlar, meta veriler, beyan edilen izinler, dosyalar, yetenek sinyalleri,
statik tarama sinyalleri, SkillSpector bulguları, VirusTotal telemetrisi ve
yayımcı tarafından sağlanan bağlam. Statik tarama sinyalleri bu inceleme için
dahili bağlamdır; bağımsız bir genel denetim bölümü veya kurulumu engelleyen bir
karar değildir.

Risk analizi, prompt enjeksiyonu, araç kötüye kullanımı, kimlik bilgisi ifşası,
güvensiz yürütme, bellek veya bağlam zehirlenmesi ve aşırı temsil yetkisi gibi
riskler için
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
çerçevesini kullanır.

ClawScan, ürkütücü görünen bir yeteneği otomatik olarak kötü amaçlı kabul etmez.
Yeteneğin açıklanıp açıklanmadığını, amaca uygun olup olmadığını ve sürümün
belirtilen kullanım senaryosu tarafından desteklenip desteklenmediğini sorar.

---
read_when:
    - ClawHub güvenlik denetimi sonuçlarını anlama
    - Bir beceri veya Plugin yükleyip yüklememeye karar verme
    - ClawHub denetim durumunu, risk düzeyini veya bulguları açıklama
sidebarTitle: Security Audits
summary: Bir beceri veya Plugin yüklemeden önce ClawHub güvenlik denetimi sonuçlarını nasıl anlayacağınız.
title: Güvenlik Denetimleri
x-i18n:
    generated_at: "2026-07-03T02:55:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Güvenlik Denetimleri

ClawHub güvenlik denetimleri, bir becerinin veya Plugin'in kurulacak kadar güvenli
olup olmadığına karar vermenize yardımcı olur. Bir sürümün ne yaptığını, hangi
yetkileri istediğini ve dosyalara, hesaplara, kimlik bilgilerine, koda veya harici
hizmetlere erişmeden önce ek dikkat gerektiren bir şey olup olmadığını gösterir.

Denetimler güçlü güvenlik sinyalleridir, ancak bir sürümün risksiz olduğunun
garantisi değildir. Hassas erişim vermeden önce her zaman kendi değerlendirmenizi
kullanın.

Ayrıca bkz. [Güvenlik](/clawhub/security), [Kabul edilebilir kullanım](/clawhub/acceptable-usage)
ve [Moderasyon ve Hesap Güvenliği](/clawhub/moderation).

## Kurmadan önce kontrol edilecekler

Kurulumdan önce şunları gözden geçirin:

- genel denetim durumu
- risk seviyesi
- listelenen bulgular
- gerekli kimlik bilgileri, izinler veya ortam değişkenleri
- sahip, kaynak, sürüm, değişiklik günlüğü, indirmeler, yıldızlar ve diğer güven sinyalleri

Yalnızca anladığınız ve güvendiğiniz içerikleri kurun.

## Denetim durumu

Denetim durumu, denetim sonucuna nasıl tepki vermeniz gerektiğini söyler:

| Durum       | Anlamı                                                                      |
| ----------- | --------------------------------------------------------------------------- |
| `Pass`      | Düşük riskin üzerinde görünür bir sorun bulunmadı.                         |
| `Review`    | Kurmadan önce bulguları okuyun. Sürüm yine de meşru olabilir.              |
| `Warn`      | Ekstra dikkatli olun. ClawHub yüksek etkili bir endişe veya uyarı sinyali buldu. |
| `Malicious` | Kurmayın.                                                                   |
| `Pending`   | Denetimler henüz tamamlanmadı.                                              |
| `Error`     | Denetim tamamlanamadı.                                                      |

`Pass` güven vericidir, ancak kendi değerlendirmenizin yerine geçmez. Bu özellikle
içerik yayımlayabilen, verileri düzenleyebilen, komut çalıştırabilen, dosya
okuyabilen veya üretim sistemlerine erişebilen araçlar için önemlidir.

## Risk seviyesi

Risk seviyesi, etki alanını açıklar: sürüm amaçlandığı şekilde kullanıldığında
ne kadar güce sahip görünüyor.

| Risk seviyesi | Anlamı                                                                      |
| ------------- | --------------------------------------------------------------------------- |
| `Low`         | Az miktarda hassas yetki veya kullanıcı etkisi bulundu.                    |
| `Medium`      | Sürüm, hesap erişimi veya veri değişiklikleri gibi anlamlı yetkilere sahip. |
| `High`        | Sürüm yüksek etkili yetkilere, ağır bulgulara veya kötü niyet sinyallerine sahip. |

Risk seviyesi ve denetim durumu farklı soruları yanıtlar:

- Risk seviyesi şunu sorar: "Burada ne kadar güç var?"
- Denetim durumu şunu sorar: "Bu sonuçla ne yapmalıyım?"

Örneğin, yayımlama yapan bir beceri `Medium` riskle `Review` gösterebilir. Bu,
onun kötü niyetli olduğu anlamına gelmez. Becerinin amaca uygun göründüğü, ancak
anlamlı hesap yetkisiyle işlem yapabildiği anlamına gelir.

## Bulgular

Bulgular, bir denetim sonucunun neden gösterildiğini açıklar. Her bulgu genellikle
şunları içerir:

- ne anlama geldiği
- neden işaretlendiği
- ilgili beceri veya Plugin içeriği
- bir öneri

Bulgular `Info`, `Low`, `Medium`, `High` veya `Critical` olarak etiketlenebilir.
Daha yüksek önem derecesine sahip bulgular, risk seviyesine ve denetim durumuna
daha güçlü katkı sağlar.

Düşük güvenilirlikli bulgular, sayfanın yararlı kanıtlara odaklı kalması için
herkese açık denetim özetinde gizlenir.

## ClawHub neleri kontrol eder

ClawHub, gönderilen sürüm yapıtlarını denetler. Bunlara şunlar dahildir:

- beceri talimatları veya Plugin metadata'sı
- bildirilen ortam değişkenleri ve izinler
- kurulum talimatları ve paket metadata'sı
- dahil edilen dosyalar ve dosya manifest'leri
- uyumluluk ve yetenek metadata'sı

Ana soru tutarlılıktır: ad, özet, metadata, istenen yetki ve gerçek içerik,
kullanıcıların makul şekilde bekleyeceği şeylerle örtüşüyor mu?

Güçlü davranış otomatik olarak kötü değildir. Birçok yararlı araç kimlik bilgileri,
yerel komutlar, sağlayıcı API'leri veya paket kurulumları gerektirir. Denetim,
bu gücün beklenen, açıklanmış ve orantılı olup olmadığını kontrol eder.

Yapıt sayfaları tam denetime şu adresten bağlantı verir:

```text
/<owner>/skills/<slug>/security-audit
```

Denetim sayfası şunları birleştirir:

1. SkillSpector
2. VirusTotal
3. Risk analizi

## VirusTotal

ClawHub, denetim yığınında kötü amaçlı yazılım telemetrisi olarak VirusTotal'ı
kullanır. VirusTotal, dosya itibarı ve kötü amaçlı yazılım taraması için güvenilir
bir sektör standardıdır ve ortaklığımız ClawHub'ın beceri ve Plugin incelemesine
daha geniş güvenlik istihbaratı eklemesini sağlar.

VirusTotal, bilinen kötü amaçlı yapıtlar, motor eşleşmeleri ve ClawHub'ın
agent farkındalıklı incelemesini tamamlayan itibar sinyalleri için özellikle
yararlıdır. Tedarikçi motor sayıları mevcut olduğunda, denetim bunları düz
dille özetler, örneğin:

```text
62/62 vendors flagged this skill as clean.
```

veya:

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

ClawHub'ın özetleyecek tedarikçi sayımı telemetrisi olmadığında, denetim şunu söyler:

```text
No VirusTotal findings
```

VirusTotal telemetri olarak kalır. ClawHub'ın kendi yapıt farkındalıklı risk
analizinin yerine geçmez.

## Risk analizi

Risk analizi, ClawHub'ın kendi güvenlik denetim sistemi olan ClawScan tarafından
dahili olarak desteklenir. Her sürümü agent'a yönelik bir yapıt olarak inceler:
talimatlar, metadata, bildirilen izinler, dosyalar, yetenek sinyalleri, statik
tarama sinyalleri, SkillSpector bulguları, VirusTotal telemetrisi ve yayıncının
sağladığı bağlam. Statik tarama sinyalleri bu inceleme için dahili bağlamdır;
tek başına herkese açık bir denetim bölümü veya kurulumu engelleyen bir karar
değildir.

Risk analizi,
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
belgesini prompt injection, araç kötüye kullanımı, kimlik bilgisi açığa çıkması,
güvensiz yürütme, bellek veya bağlam zehirlenmesi ve aşırı yetki gibi riskler
için bir mercek olarak kullanır.

ClawScan, korkutucu görünen bir yeteneği otomatik olarak kötü niyetli saymaz.
Yeteneğin açıklanmış, amaca uygun ve sürümün belirtilen kullanım amacı tarafından
desteklenmiş olup olmadığını sorar.

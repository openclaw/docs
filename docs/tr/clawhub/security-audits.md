---
read_when:
    - ClawHub güvenlik denetimi sonuçlarını anlama
    - Bir skill veya plugin yükleyip yüklememeye karar verme
    - ClawHub denetim durumunu, risk düzeyini veya bulguları açıklama
sidebarTitle: Security Audits
summary: Bir skill veya Plugin yüklemeden önce ClawHub güvenlik denetimi sonuçlarını nasıl anlayacağınız.
title: Güvenlik Denetimleri
x-i18n:
    generated_at: "2026-07-04T18:17:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Güvenlik Denetimleri

ClawHub güvenlik denetimleri, bir becerinin veya Plugin'in yüklemek için yeterince güvenli olup olmadığına karar vermenize yardımcı olur.
Bir sürümün ne yaptığını, hangi yetkileri istediğini ve
dosyalara, hesaplara, kimlik bilgilerine, koda veya harici hizmetlere erişmeden önce
ek dikkat gerektiren bir şey olup olmadığını gösterir.

Denetimler güçlü güvenlik sinyalleridir, ancak bir sürümün
risksiz olduğunun garantisi değildir. Hassas erişim vermeden önce her zaman kendi değerlendirmenizi kullanın.

Ayrıca bkz. [Güvenlik](/clawhub/security), [Kabul edilebilir kullanım](/clawhub/acceptable-usage)
ve [Moderasyon ve Hesap Güvenliği](/clawhub/moderation).

## Yüklemeden önce kontrol edilecekler

Yüklemeden önce şunları inceleyin:

- genel denetim durumu
- risk seviyesi
- listelenen bulgular
- gerekli kimlik bilgileri, izinler veya ortam değişkenleri
- sahip, kaynak, sürüm, değişiklik günlüğü, indirmeler, yıldızlar ve diğer güven sinyalleri

Yalnızca anladığınız ve güvendiğiniz içeriği yükleyin.

## Denetim durumu

Denetim durumu, denetim sonucuna nasıl tepki vermeniz gerektiğini söyler:

| Durum       | Anlamı                                                                    |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Düşük riskin üzerinde görünür bir sorun bulunmadı.                        |
| `Review`    | Yüklemeden önce bulguları okuyun. Sürüm yine de meşru olabilir.           |
| `Warn`      | Ekstra dikkatli olun. ClawHub yüksek etkili bir endişe veya uyarı sinyali buldu. |
| `Malicious` | Yüklemeyin.                                                               |
| `Pending`   | Denetimler henüz tamamlanmadı.                                            |
| `Error`     | Denetim tamamlanamadı.                                                    |

`Pass` güven vericidir, ancak kendi değerlendirmenizin yerine geçmez. Bu özellikle
içerik yayımlayabilen, verileri düzenleyebilen, komut çalıştırabilen, dosya okuyabilen veya
üretim sistemlerine erişebilen araçlar için önemlidir.

## Risk seviyesi

Risk seviyesi etki alanını açıklar: sürümü amaçlandığı gibi
kullandığınızda ne kadar güce sahip göründüğünü belirtir.

| Risk seviyesi | Anlamı                                                                        |
| ------------- | ----------------------------------------------------------------------------- |
| `Low`         | Çok az hassas yetki veya kullanıcı etkisi bulundu.                            |
| `Medium`      | Sürüm, hesap erişimi veya veri değişiklikleri gibi anlamlı yetkilere sahiptir. |
| `High`        | Sürüm yüksek etkili yetkiye, ciddi bulgulara veya kötü niyetli sinyallere sahiptir. |

Risk seviyesi ve denetim durumu farklı soruları yanıtlar:

- Risk seviyesi şunu sorar: "Burada ne kadar güç var?"
- Denetim durumu şunu sorar: "Bu sonuçla ne yapmalıyım?"

Örneğin, bir yayımlama becerisi `Medium` riskle `Review` gösterebilir. Bu,
kötü niyetli olduğu anlamına gelmez. Beceri amaca uygun görünüyor, ancak
anlamlı hesap yetkisiyle hareket edebilir anlamına gelir.

## Bulgular

Bulgular, bir denetim sonucunun neden gösterildiğini açıklar. Her bulgu genellikle şunları içerir:

- ne anlama geldiği
- neden işaretlendiği
- ilgili beceri veya Plugin içeriği
- bir öneri

Bulgular `Info`, `Low`, `Medium`, `High` veya `Critical` olarak etiketlenebilir. Daha yüksek
önem derecesine sahip bulgular, risk seviyesine ve denetim durumuna daha güçlü katkıda bulunur.

Düşük güvenilirlikli bulgular, sayfanın faydalı kanıtlara odaklı kalması için
genel denetim özetinden gizlenir.

## ClawHub neleri kontrol eder

ClawHub gönderilen sürüm artefaktlarını denetler; bunlara şunlar dahildir:

- beceri talimatları veya Plugin meta verileri
- beyan edilen ortam değişkenleri ve izinler
- yükleme talimatları ve paket meta verileri
- dahil edilen dosyalar ve dosya manifestleri
- uyumluluk ve yetenek meta verileri

Ana soru tutarlılıktır: ad, özet, meta veriler, istenen
yetki ve gerçek içerik, kullanıcıların makul biçimde bekleyeceği şeylerle uyumlu mu?

Güçlü davranış otomatik olarak kötü değildir. Birçok yararlı araç kimlik bilgilerine,
yerel komutlara, sağlayıcı API'lerine veya paket yüklemelerine ihtiyaç duyar. Denetim, bu
gücün beklenen, açıklanmış ve orantılı olup olmadığını kontrol eder.

Artefakt sayfaları tam denetime şu adreste bağlantı verir:

```text
/<owner>/skills/<slug>/security-audit
```

Denetim sayfası şunları birleştirir:

1. SkillSpector
2. VirusTotal
3. Risk analizi

## VirusTotal

ClawHub, denetim yığınında kötü amaçlı yazılım telemetrisi olarak VirusTotal kullanır. VirusTotal,
dosya itibarı ve kötü amaçlı yazılım taraması için güvenilir bir sektör standardıdır ve
ortaklığımız ClawHub'ın beceri ve Plugin incelemesine daha geniş güvenlik zekası eklemesini sağlar.

VirusTotal özellikle bilinen kötü niyetli artefaktlar, motor isabetleri ve
ClawHub'ın ajan farkındalıklı incelemesini tamamlayan itibar sinyalleri için yararlıdır. Tedarikçi
motor sayıları mevcut olduğunda, denetim bunları sade bir dille özetler, örneğin:

```text
62/62 vendors flagged this skill as clean.
```

veya:

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

ClawHub'ın özetleyecek tedarikçi sayısı telemetrisi olmadığında, denetim şunu söyler:

```text
No VirusTotal findings
```

VirusTotal telemetri olarak kalır. ClawHub'ın kendi artefakt farkındalıklı
risk analizinin yerine geçmez.

## Risk analizi

Risk analizi, ClawHub'ın kendi güvenlik denetim sistemi olan ClawScan tarafından dahili olarak desteklenir.
Her sürümü ajanlara yönelik bir artefakt olarak inceler: talimatlar,
meta veriler, beyan edilen izinler, dosyalar, yetenek sinyalleri, statik tarama sinyalleri,
SkillSpector bulguları, VirusTotal telemetrisi ve yayımcı tarafından sağlanan bağlam.
Statik tarama sinyalleri bu inceleme için dahili bağlamdır; bağımsız bir
genel denetim bölümü veya yüklemeyi engelleyen karar değildir.

Risk analizi,
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
çerçevesini prompt injection, araç kötüye kullanımı, kimlik bilgisi ifşası,
güvensiz yürütme, bellek veya bağlam zehirlenmesi ve aşırı temsil yetkisi gibi riskleri değerlendirmek için kullanır.

ClawScan, korkutucu görünen bir yeteneği otomatik olarak kötü niyetli saymaz.
Yeteneğin açıklanmış, amaca uygun ve
sürümün belirtilen kullanım senaryosu tarafından desteklenmiş olup olmadığını sorar.

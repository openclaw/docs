---
read_when:
    - ClawHub güvenlik denetimi sonuçlarını anlama
    - Bir beceri veya Plugin yüklenip yüklenmeyeceğine karar verme
    - ClawHub denetim durumunu, risk seviyesini veya bulguları açıklama
sidebarTitle: Security Audits
summary: Bir skill veya Plugin yüklemeden önce ClawHub güvenlik denetimi sonuçlarını nasıl anlayacağınız.
title: Güvenlik Denetimleri
x-i18n:
    generated_at: "2026-06-28T07:42:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Güvenlik Denetimleri

ClawHub güvenlik denetimleri, bir skill veya Plugin'in kurulacak kadar güvenli olup olmadığına karar vermenize yardımcı olur. Bunlar, bir sürümün ne yaptığını, hangi yetkileri istediğini ve dosyalara, hesaplara, kimlik bilgilerine, koda veya dış hizmetlere erişebilmeden önce ekstra dikkat gerektiren bir şey olup olmadığını gösterir.

Denetimler güçlü güvenlik sinyalleridir, ancak bir sürümün risksiz olduğunun garantisi değildir. Hassas erişim vermeden önce her zaman kendi değerlendirmenizi kullanın.

Ayrıca bkz. [Güvenlik](/tr/clawhub/security), [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) ve [Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation).

## Kurmadan önce kontrol edilecekler

Kurulumdan önce şunları gözden geçirin:

- genel denetim durumu
- risk düzeyi
- listelenen bulgular
- gerekli kimlik bilgileri, izinler veya ortam değişkenleri
- sahip, kaynak, sürüm, değişiklik günlüğü, indirmeler, yıldızlar ve diğer güven sinyalleri

Yalnızca anladığınız ve güvendiğiniz içerikleri kurun.

## Denetim durumu

Denetim durumu, denetim sonucuna nasıl tepki vermeniz gerektiğini söyler:

| Durum       | Anlamı                                                                            |
| ----------- | --------------------------------------------------------------------------------- |
| `Pass`      | Düşük riskin üzerinde görünür bir sorun bulunmadı.                                |
| `Review`    | Kurmadan önce bulguları okuyun. Sürüm yine de meşru olabilir.                     |
| `Warn`      | Ekstra dikkatli olun. ClawHub yüksek etkili bir endişe veya uyarı sinyali buldu. |
| `Malicious` | Kurmayın.                                                                         |
| `Pending`   | Denetimler henüz tamamlanmadı.                                                    |
| `Error`     | Denetim tamamlanamadı.                                                            |

`Pass` güven vericidir, ancak kendi değerlendirmenizin yerini tutmaz. Bu, içerik yayımlayabilen, veri düzenleyebilen, komut çalıştırabilen, dosya okuyabilen veya üretim sistemlerine erişebilen araçlar için en önemlisidir.

## Risk düzeyi

Risk düzeyi etki alanını açıklar: Sürümü amaçlandığı gibi kullandığınızda ne kadar güce sahip göründüğünü gösterir.

| Risk düzeyi | Anlamı                                                                                         |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `Low`       | Az düzeyde hassas yetki veya kullanıcı etkisi bulundu.                                          |
| `Medium`    | Sürüm, hesap erişimi veya veri değişiklikleri gibi anlamlı yetkilere sahiptir.                  |
| `High`      | Sürüm yüksek etkili yetkiye, ciddi bulgulara veya kötü amaçlı sinyallere sahiptir.              |

Risk düzeyi ve denetim durumu farklı soruları yanıtlar:

- Risk düzeyi şunu sorar: "Burada ne kadar güç var?"
- Denetim durumu şunu sorar: "Bu sonuçla ne yapmalıyım?"

Örneğin, yayımlama yapan bir skill `Medium` riskle `Review` gösterebilir. Bu, onun kötü amaçlı olduğu anlamına gelmez. Skill'in amaca uygun göründüğü, ancak anlamlı hesap yetkisiyle hareket edebildiği anlamına gelir.

## Bulgular

Bulgular, bir denetim sonucunun neden gösterildiğini açıklar. Her bulgu genellikle şunları içerir:

- ne anlama geldiği
- neden işaretlendiği
- ilgili skill veya Plugin içeriği
- bir öneri

Bulgular `Info`, `Low`, `Medium`, `High` veya `Critical` olarak etiketlenebilir. Daha yüksek önem dereceli bulgular, risk düzeyine ve denetim durumuna daha güçlü katkıda bulunur.

Düşük güven düzeyli bulgular, sayfanın yararlı kanıtlara odaklanmasını sağlamak için herkese açık denetim özetinden gizlenir.

## ClawHub neyi kontrol eder?

ClawHub, gönderilen sürüm yapıtlarını denetler; bunlara şunlar dahildir:

- skill talimatları veya Plugin meta verileri
- bildirilen ortam değişkenleri ve izinler
- kurulum talimatları ve paket meta verileri
- dahil edilen dosyalar ve dosya manifestleri
- uyumluluk ve yetenek meta verileri

Ana soru tutarlılıktır: Ad, özet, meta veriler, istenen yetki ve gerçek içerik, kullanıcıların makul biçimde bekleyeceği şeylerle uyumlu mu?

Güçlü davranış otomatik olarak kötü değildir. Birçok yararlı aracın kimlik bilgilerine, yerel komutlara, sağlayıcı API'lerine veya paket kurulumlarına ihtiyacı vardır. Denetim, bu gücün beklenen, açıklanmış ve orantılı olup olmadığını kontrol eder.

Yapıt sayfaları tam denetime şu adresten bağlantı verir:

```text
/<owner>/skills/<slug>/security-audit
```

Denetim sayfası şunları birleştirir:

1. SkillSpector
2. VirusTotal
3. Risk analizi

## VirusTotal

ClawHub, denetim yığınında VirusTotal'ı kötü amaçlı yazılım telemetrisi olarak kullanır. VirusTotal, dosya itibarı ve kötü amaçlı yazılım taraması için güvenilir bir sektör standardıdır ve ortaklığımız ClawHub'ın skill ve Plugin incelemesine daha geniş güvenlik istihbaratı eklemesini sağlar.

VirusTotal özellikle bilinen kötü amaçlı yapıtlar, motor isabetleri ve ClawHub'ın ajan farkındalıklı incelemesini tamamlayan itibar sinyalleri için yararlıdır. Tedarikçi motor sayıları mevcut olduğunda, denetim bunları sade bir dille özetler, örneğin:

```text
62/62 vendors flagged this skill as clean.
```

veya:

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

ClawHub'ın özetleyecek tedarikçi sayısı telemetrisi olmadığında denetim şunu söyler:

```text
No VirusTotal findings
```

VirusTotal telemetri olarak kalır. ClawHub'ın kendi yapıt farkındalıklı risk analizinin yerini almaz.

## Risk analizi

Risk analizi, dahili olarak ClawHub'ın kendi güvenlik denetim sistemi olan ClawScan tarafından desteklenir. Her sürümü ajanlara yönelik bir yapıt olarak inceler: talimatlar, meta veriler, bildirilen izinler, dosyalar, yetenek sinyalleri, statik tarama sinyalleri, SkillSpector bulguları, VirusTotal telemetrisi ve yayımcı tarafından sağlanan bağlam. Statik tarama sinyalleri bu inceleme için dahili bağlamdır; bağımsız bir herkese açık denetim bölümü veya kurulumu engelleyen bir karar değildir.

Risk analizi, istem enjeksiyonu, araç kötüye kullanımı, kimlik bilgisi açığa çıkması, güvenli olmayan yürütme, bellek veya bağlam zehirlenmesi ve aşırı yetki gibi riskler için [OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/) listesini bir mercek olarak kullanır.

ClawScan, korkutucu görünen bir yeteneği otomatik olarak kötü amaçlı kabul etmez. Yeteneğin açıklanmış, amaca uygun ve sürümün belirtilen kullanım senaryosu tarafından desteklenmiş olup olmadığını sorar.

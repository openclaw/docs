---
read_when:
    - ClawHub güvenlik denetimi sonuçlarını anlama
    - Bir beceri veya Plugin yükleyip yüklememeye karar verme
    - ClawHub denetim durumunu, risk düzeyini veya bulgularını açıklama
sidebarTitle: Security Audits
summary: Bir Skills veya Plugin yüklemeden önce ClawHub güvenlik denetimi sonuçlarını nasıl anlayacağınız.
title: Güvenlik Denetimleri
x-i18n:
    generated_at: "2026-07-03T01:02:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Güvenlik Denetimleri

ClawHub güvenlik denetimleri, bir skill veya pluginin yüklemek için yeterince güvenli olup olmadığına karar vermenize yardımcı olur. Bir sürümün ne yaptığını, hangi yetkileri istediğini ve dosyalara, hesaplara, kimlik bilgilerine, koda veya dış hizmetlere erişmeden önce ekstra dikkat gerektiren bir şey olup olmadığını gösterir.

Denetimler güçlü güvenlik sinyalleridir, ancak bir sürümün risksiz olduğunun garantisi değildir. Hassas erişim vermeden önce her zaman muhakemenizi kullanın.

Ayrıca bkz. [Güvenlik](/clawhub/security), [Kabul edilebilir kullanım](/clawhub/acceptable-usage) ve [Moderasyon ve Hesap Güvenliği](/clawhub/moderation).

## Yüklemeden önce kontrol edilecekler

Yüklemeden önce şunları gözden geçirin:

- genel denetim durumu
- risk düzeyi
- listelenen bulgular
- gerekli kimlik bilgileri, izinler veya ortam değişkenleri
- sahip, kaynak, sürüm, değişiklik günlüğü, indirmeler, yıldızlar ve diğer güven sinyalleri

Yalnızca anladığınız ve güvendiğiniz içerikleri yükleyin.

## Denetim durumu

Denetim durumu, denetim sonucuna nasıl tepki vereceğinizi söyler:

| Durum | Anlam |
| ----------- | ------------------------------------------------------------------------- |
| `Pass` | Düşük riskin üzerinde görünür bir sorun bulunmadı. |
| `Review` | Yüklemeden önce bulguları okuyun. Sürüm yine de meşru olabilir. |
| `Warn` | Ekstra dikkat gösterin. ClawHub yüksek etkili bir endişe veya uyarı sinyali buldu. |
| `Malicious` | Yüklemeyin. |
| `Pending` | Denetimler henüz tamamlanmadı. |
| `Error` | Denetim tamamlanamadı. |

`Pass` güven vericidir, ancak kendi muhakemenizin yerini almaz. Bu özellikle içerik yayımlayabilen, verileri düzenleyebilen, komut çalıştırabilen, dosya okuyabilen veya üretim sistemlerine erişebilen araçlar için önemlidir.

## Risk düzeyi

Risk düzeyi etki alanını açıklar: sürümün amaçlandığı gibi kullandığınızda ne kadar güce sahip göründüğü.

| Risk düzeyi | Anlam |
| ---------- | ----------------------------------------------------------------------------- |
| `Low` | Az miktarda hassas yetki veya kullanıcı etkisi bulundu. |
| `Medium` | Sürüm, hesap erişimi veya veri değişiklikleri gibi anlamlı yetkilere sahiptir. |
| `High` | Sürüm yüksek etkili yetkilere, ciddi bulgulara veya kötü niyetli sinyallere sahiptir. |

Risk düzeyi ve denetim durumu farklı soruları yanıtlar:

- Risk düzeyi şunu sorar: "Burada ne kadar güç var?"
- Denetim durumu şunu sorar: "Bu sonuçla ne yapmalıyım?"

Örneğin, yayımlama yapan bir skill `Medium` riskle `Review` gösterebilir. Bu onun kötü niyetli olduğu anlamına gelmez. Bu, skillin amaca uygun göründüğü, ancak anlamlı hesap yetkisiyle hareket edebileceği anlamına gelir.

## Bulgular

Bulgular, bir denetim sonucunun neden gösterildiğini açıklar. Her bulgu genellikle şunları içerir:

- ne anlama geldiği
- neden işaretlendiği
- ilgili skill veya plugin içeriği
- bir öneri

Bulgular `Info`, `Low`, `Medium`, `High` veya `Critical` olarak etiketlenebilir. Daha yüksek önem derecesindeki bulgular, risk düzeyine ve denetim durumuna daha güçlü katkıda bulunur.

Düşük güvenilirlikli bulgular, sayfanın yararlı kanıtlara odaklı kalması için herkese açık denetim özetinden gizlenir.

## ClawHub neyi kontrol eder

ClawHub gönderilen sürüm yapıtlarını denetler; bunlara şunlar dahildir:

- skill talimatları veya plugin meta verileri
- bildirilen ortam değişkenleri ve izinler
- yükleme talimatları ve paket meta verileri
- dahil edilen dosyalar ve dosya manifestleri
- uyumluluk ve yetenek meta verileri

Ana soru tutarlılıktır: ad, özet, meta veriler, istenen yetki ve gerçek içerik kullanıcıların makul biçimde bekleyeceği şeylerle örtüşüyor mu?

Güçlü davranış otomatik olarak kötü değildir. Birçok yararlı araç kimlik bilgilerine, yerel komutlara, sağlayıcı API'lerine veya paket yüklemelerine ihtiyaç duyar. Denetim, bu gücün beklenen, açıklanan ve orantılı olup olmadığını kontrol eder.

Yapıt sayfaları tam denetime şu adresten bağlantı verir:

```text
/<owner>/skills/<slug>/security-audit
```

Denetim sayfası şunları birleştirir:

1. SkillSpector
2. VirusTotal
3. Risk analizi

## VirusTotal

ClawHub, denetim yığınında kötü amaçlı yazılım telemetrisi olarak VirusTotal'ı kullanır. VirusTotal, dosya itibarı ve kötü amaçlı yazılım taraması için güvenilir bir endüstri standardıdır ve ortaklığımız ClawHub'ın skill ve plugin incelemesine daha geniş güvenlik istihbaratı eklemesini sağlar.

VirusTotal özellikle bilinen kötü amaçlı yapıtlar, motor bulguları ve ClawHub'ın ajan farkındalıklı incelemesini tamamlayan itibar sinyalleri için yararlıdır. Tedarikçi motor sayıları mevcut olduğunda denetim bunları düz bir dille özetler, örneğin:

```text
62/62 tedarikçi bu skilli temiz olarak işaretledi.
```

veya:

```text
2/64 tedarikçi bu skilli kötü niyetli olarak işaretledi, 1/64 şüpheli olarak işaretledi ve 61/64 temiz olarak işaretledi.
```

ClawHub'ın özetleyebileceği tedarikçi sayısı telemetrisi olmadığında denetim şöyle der:

```text
VirusTotal bulgusu yok
```

VirusTotal telemetri olarak kalır. ClawHub'ın kendi yapıt farkındalıklı risk analizinin yerini almaz.

## Risk analizi

Risk analizi, ClawHub'ın kendi güvenlik denetim sistemi olan ClawScan tarafından dahili olarak desteklenir. Her sürümü ajanlara yönelik bir yapıt olarak inceler: talimatlar, meta veriler, bildirilen izinler, dosyalar, yetenek sinyalleri, statik tarama sinyalleri, SkillSpector bulguları, VirusTotal telemetrisi ve yayımcı tarafından sağlanan bağlam. Statik tarama sinyalleri bu inceleme için dahili bağlamdır; tek başına herkese açık bir denetim bölümü veya yüklemeyi engelleyen hüküm değildir.

Risk analizi, prompt injection, araçların kötüye kullanımı, kimlik bilgilerinin açığa çıkması, güvenli olmayan yürütme, bellek veya bağlam zehirleme ve aşırı özerklik gibi riskler için [OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/) listesini bir mercek olarak kullanır.

ClawScan korkutucu görünen bir yeteneği otomatik olarak kötü niyetli kabul etmez. Yeteneğin açıklanıp açıklanmadığını, amaca uygun olup olmadığını ve sürümün belirtilen kullanım senaryosu tarafından desteklenip desteklenmediğini sorar.

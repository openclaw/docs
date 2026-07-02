---
read_when:
    - ClawHub güvenlik denetimi sonuçlarını anlama
    - Bir skill veya plugin kurulup kurulmayacağına karar verme
    - ClawHub denetim durumunu, risk düzeyini veya bulguları açıklama
sidebarTitle: Security Audits
summary: Bir skill veya plugin yüklemeden önce ClawHub güvenlik denetimi sonuçlarını nasıl anlayacağınız.
title: Güvenlik Denetimleri
x-i18n:
    generated_at: "2026-07-02T08:43:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Güvenlik Denetimleri

ClawHub güvenlik denetimleri, bir becerinin veya Plugin'in yüklemek için yeterince
güvenli olup olmadığına karar vermenize yardımcı olur. Bir sürümün ne yaptığını, hangi yetkiyi istediğini ve
dosyalara, hesaplara, kimlik bilgilerine, koda veya harici hizmetlere erişebilmeden önce
ek dikkat gerektiren bir şey olup olmadığını gösterir.

Denetimler güçlü güvenlik sinyalleridir, ancak bir sürümün risksiz olduğunun
garantisi değildir. Hassas erişim vermeden önce her zaman sağduyunuzu kullanın.

Ayrıca bkz. [Güvenlik](/clawhub/security), [Kabul edilebilir kullanım](/clawhub/acceptable-usage)
ve [Moderasyon ve Hesap Güvenliği](/clawhub/moderation).

## Yüklemeden önce neleri kontrol etmeli

Yüklemeden önce şunları inceleyin:

- genel denetim durumu
- risk düzeyi
- listelenen bulgular
- gerekli kimlik bilgileri, izinler veya ortam değişkenleri
- sahip, kaynak, sürüm, değişiklik günlüğü, indirmeler, yıldızlar ve diğer güven sinyalleri

Yalnızca anladığınız ve güvendiğiniz içerikleri yükleyin.

## Denetim durumu

Denetim durumu, denetim sonucuna nasıl tepki vereceğinizi söyler:

| Durum       | Anlamı                                                                    |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Düşük riskin üzerinde görünür bir sorun bulunmadı.                        |
| `Review`    | Yüklemeden önce bulguları okuyun. Sürüm hâlâ meşru olabilir.              |
| `Warn`      | Ekstra dikkatli olun. ClawHub yüksek etkili bir endişe veya uyarı sinyali buldu. |
| `Malicious` | Yüklemeyin.                                                               |
| `Pending`   | Denetimler henüz tamamlanmadı.                                            |
| `Error`     | Denetim tamamlanamadı.                                                    |

`Pass` güven vericidir, ancak kendi değerlendirmenizin yerini almaz. Bu özellikle
içerik yayımlayabilen, verileri düzenleyebilen, komut çalıştırabilen, dosya okuyabilen veya
üretim sistemlerine erişebilen araçlar için önemlidir.

## Risk düzeyi

Risk düzeyi, etki alanını açıklar: Sürüm amaçlandığı şekilde kullanıldığında
ne kadar güce sahip görünüyor.

| Risk düzeyi | Anlamı                                                                       |
| ----------- | ----------------------------------------------------------------------------- |
| `Low`       | Çok az hassas yetki veya kullanıcı etkisi bulundu.                            |
| `Medium`    | Sürüm, hesap erişimi veya veri değişiklikleri gibi anlamlı yetkilere sahiptir. |
| `High`      | Sürüm yüksek etkili yetkilere, ciddi bulgulara veya kötü niyetli sinyallere sahiptir. |

Risk düzeyi ve denetim durumu farklı soruları yanıtlar:

- Risk düzeyi şunu sorar: "Burada ne kadar güç var?"
- Denetim durumu şunu sorar: "Bu sonuçla ne yapmalıyım?"

Örneğin, bir yayımlama becerisi `Medium` risk ile `Review` gösterebilir. Bu,
kötü niyetli olduğu anlamına gelmez. Becerinin amaca uygun göründüğü, ancak
anlamlı hesap yetkisiyle işlem yapabileceği anlamına gelir.

## Bulgular

Bulgular, bir denetim sonucunun neden gösterildiğini açıklar. Her bulgu genellikle şunları içerir:

- ne anlama geldiği
- neden işaretlendiği
- ilgili beceri veya Plugin içeriği
- bir öneri

Bulgular `Info`, `Low`, `Medium`, `High` veya `Critical` olarak etiketlenebilir. Daha yüksek
önem derecesine sahip bulgular, risk düzeyine ve denetim durumuna daha güçlü katkıda bulunur.

Düşük güvenli bulgular, sayfanın yararlı kanıtlara odaklı kalması için genel denetim özetinden gizlenir.

## ClawHub neleri kontrol eder

ClawHub gönderilen sürüm yapıtlarını denetler; bunlara şunlar dahildir:

- beceri talimatları veya Plugin meta verileri
- bildirilen ortam değişkenleri ve izinler
- yükleme talimatları ve paket meta verileri
- dahil edilen dosyalar ve dosya bildirimleri
- uyumluluk ve yetenek meta verileri

Ana soru tutarlılıktır: ad, özet, meta veriler, istenen yetki ve gerçek içerik
kullanıcıların makul şekilde bekleyeceği şeylerle örtüşüyor mu?

Güçlü davranış otomatik olarak kötü değildir. Birçok yararlı araç kimlik bilgilerine,
yerel komutlara, sağlayıcı API'lerine veya paket yüklemelerine ihtiyaç duyar. Denetim, bu
gücün beklenen, açıklanmış ve orantılı olup olmadığını kontrol eder.

Yapıt sayfaları tam denetime şuradan bağlantı verir:

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

VirusTotal özellikle bilinen kötü amaçlı yapıtlar, motor isabetleri ve
ClawHub'ın ajan farkındalıklı incelemesini tamamlayan itibar sinyalleri için yararlıdır. Tedarikçi
motor sayıları mevcut olduğunda, denetim bunları sade bir dille özetler; örneğin:

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

VirusTotal telemetri olarak kalır. ClawHub'ın kendi yapıt farkındalıklı
risk analizinin yerini almaz.

## Risk analizi

Risk analizi, ClawHub'ın kendi güvenlik denetim sistemi olan ClawScan tarafından dahili olarak desteklenir.
Her sürümü ajanlara yönelik bir yapıt olarak inceler: talimatlar,
meta veriler, bildirilen izinler, dosyalar, yetenek sinyalleri, statik tarama sinyalleri,
SkillSpector bulguları, VirusTotal telemetrisi ve yayımcı tarafından sağlanan bağlam.
Statik tarama sinyalleri bu inceleme için dahili bağlamdır; bağımsız bir
genel denetim bölümü veya yüklemeyi engelleyen karar değildir.

Risk analizi, istem enjeksiyonu, araç kötüye kullanımı, kimlik bilgisi ifşası,
güvensiz yürütme, bellek veya bağlam zehirlenmesi ve aşırı özerklik gibi riskler için
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
çerçevesini kullanır.

ClawScan, korkutucu görünen bir yeteneği otomatik olarak kötü niyetli kabul etmez.
Yeteneğin açıklanıp açıklanmadığını, amaca uygun olup olmadığını ve
sürümün belirtilen kullanım durumu tarafından desteklenip desteklenmediğini sorar.

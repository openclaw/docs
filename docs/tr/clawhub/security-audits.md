---
read_when:
    - ClawHub güvenlik denetimi sonuçlarını anlama
    - Skills veya Plugin yükleyip yüklememeye karar verme
    - ClawHub denetim durumunu, risk düzeyini veya bulguları açıklama
sidebarTitle: Security Audits
summary: Bir beceri veya Plugin yüklemeden önce ClawHub güvenlik denetimi sonuçlarını nasıl anlayacağınız.
title: Güvenlik Denetimleri
x-i18n:
    generated_at: "2026-07-01T08:22:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Güvenlik Denetimleri

ClawHub güvenlik denetimleri, bir becerinin veya Plugin’in kurulacak kadar güvenli
olup olmadığına karar vermenize yardımcı olur. Bir sürümün ne yaptığını, hangi
yetkiyi istediğini ve dosyalara, hesaplara, kimlik bilgilerine, koda veya harici
hizmetlere erişmeden önce ek dikkat gerektiren bir şey olup olmadığını gösterir.

Denetimler güçlü güvenlik sinyalleridir, ancak bir sürümün risksiz olduğunun
garantisi değildir. Hassas erişim vermeden önce her zaman kendi değerlendirmenizi
kullanın.

Ayrıca bkz. [Güvenlik](/clawhub/security), [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage)
ve [Moderasyon ve Hesap Güvenliği](/clawhub/moderation).

## Kurulumdan önce neleri kontrol etmelisiniz

Kurulumdan önce şunları inceleyin:

- genel denetim durumu
- risk düzeyi
- listelenen bulgular
- gerekli kimlik bilgileri, izinler veya ortam değişkenleri
- sahip, kaynak, sürüm, değişiklik günlüğü, indirmeler, yıldızlar ve diğer güven sinyalleri

Yalnızca anladığınız ve güvendiğiniz içerikleri kurun.

## Denetim durumu

Denetim durumu, denetim sonucuna nasıl tepki vermeniz gerektiğini söyler:

| Durum       | Anlamı                                                                          |
| ----------- | ------------------------------------------------------------------------------- |
| `Pass`      | Düşük riskin üzerinde görünür bir sorun bulunmadı.                              |
| `Review`    | Kurulumdan önce bulguları okuyun. Sürüm hâlâ meşru olabilir.                    |
| `Warn`      | Ekstra dikkatli olun. ClawHub yüksek etkili bir endişe veya uyarı sinyali buldu. |
| `Malicious` | Kurmayın.                                                                       |
| `Pending`   | Denetimler henüz tamamlanmadı.                                                  |
| `Error`     | Denetim tamamlanamadı.                                                          |

`Pass` güven vericidir, ancak kendi değerlendirmenizin yerine geçmez. Bu en çok
içerik yayımlayabilen, verileri düzenleyebilen, komut çalıştırabilen, dosyaları
okuyabilen veya üretim sistemlerine erişebilen araçlar için önemlidir.

## Risk düzeyi

Risk düzeyi etki alanını açıklar: sürümün amaçlandığı şekilde kullanılması
durumunda ne kadar güce sahip göründüğünü belirtir.

| Risk düzeyi | Anlamı                                                                         |
| ----------- | ------------------------------------------------------------------------------ |
| `Low`       | Az miktarda hassas yetki veya kullanıcı etkisi bulundu.                        |
| `Medium`    | Sürüm, hesap erişimi veya veri değişiklikleri gibi anlamlı yetkilere sahiptir. |
| `High`      | Sürüm yüksek etkili yetkilere, ciddi bulgulara veya kötü amaçlı sinyallere sahiptir. |

Risk düzeyi ve denetim durumu farklı soruları yanıtlar:

- Risk düzeyi şunu sorar: "Burada ne kadar güç var?"
- Denetim durumu şunu sorar: "Bu sonuçla ne yapmalıyım?"

Örneğin, yayımlama yapan bir beceri `Medium` risk ile `Review` gösterebilir. Bu,
onun kötü amaçlı olduğu anlamına gelmez. Becerinin amaçla uyumlu göründüğü, ancak
anlamlı hesap yetkisiyle hareket edebildiği anlamına gelir.

## Bulgular

Bulgular, bir denetim sonucunun neden gösterildiğini açıklar. Her bulgu genellikle
şunları içerir:

- ne anlama geldiği
- neden işaretlendiği
- ilgili beceri veya Plugin içeriği
- bir öneri

Bulgular `Info`, `Low`, `Medium`, `High` veya `Critical` olarak etiketlenebilir.
Daha yüksek önem derecesine sahip bulgular risk düzeyine ve denetim durumuna daha
güçlü katkıda bulunur.

Düşük güvenilirlikteki bulgular, sayfanın yararlı kanıtlara odaklanmasını sağlamak
için herkese açık denetim özetinden gizlenir.

## ClawHub neleri kontrol eder

ClawHub gönderilen sürüm yapıtlarını denetler, bunlara şunlar dahildir:

- beceri yönergeleri veya Plugin meta verileri
- bildirilen ortam değişkenleri ve izinler
- kurulum yönergeleri ve paket meta verileri
- dahil edilen dosyalar ve dosya manifestleri
- uyumluluk ve yetenek meta verileri

Ana soru tutarlılıktır: ad, özet, meta veriler, istenen yetki ve gerçek içerik,
kullanıcıların makul olarak bekleyeceği şeyle uyumlu mu?

Güçlü davranış otomatik olarak kötü değildir. Birçok yararlı araç kimlik bilgilerine,
yerel komutlara, sağlayıcı API’lerine veya paket kurulumlarına ihtiyaç duyar.
Denetim, bu gücün beklenen, açıklanmış ve orantılı olup olmadığını kontrol eder.

Yapıt sayfaları tam denetime şu adresten bağlantı verir:

```text
/<owner>/skills/<slug>/security-audit
```

Denetim sayfası şunları birleştirir:

1. SkillSpector
2. VirusTotal
3. Risk analizi

## VirusTotal

ClawHub, denetim yığınında kötü amaçlı yazılım telemetrisi olarak VirusTotal kullanır.
VirusTotal, dosya itibarı ve kötü amaçlı yazılım taraması için güvenilir bir sektör
standardıdır ve ortaklığımız ClawHub’ın beceri ve Plugin incelemesine daha geniş
güvenlik istihbaratı eklemesini sağlar.

VirusTotal özellikle bilinen kötü amaçlı yapıtlar, motor eşleşmeleri ve ClawHub’ın
aracı farkındalıklı incelemesini tamamlayan itibar sinyalleri için yararlıdır.
Tedarikçi motor sayıları mevcut olduğunda, denetim bunları sade bir dille özetler,
örneğin:

```text
62/62 vendors flagged this skill as clean.
```

veya:

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

ClawHub’ın özetleyecek tedarikçi sayısı telemetrisi olmadığında, denetim şunu söyler:

```text
No VirusTotal findings
```

VirusTotal telemetri olarak kalır. ClawHub’ın kendi yapıt farkındalıklı risk
analizinin yerine geçmez.

## Risk analizi

Risk analizi, ClawHub’ın kendi güvenlik denetim sistemi olan ClawScan tarafından
dahili olarak desteklenir. Her sürümü aracıya yönelik bir yapıt olarak inceler:
yönergeler, meta veriler, bildirilen izinler, dosyalar, yetenek sinyalleri, statik
tarama sinyalleri, SkillSpector bulguları, VirusTotal telemetrisi ve yayımcı
tarafından sağlanan bağlam. Statik tarama sinyalleri bu inceleme için dahili
bağlamdır; bağımsız bir herkese açık denetim bölümü veya kurulumu engelleyen bir
karar değildir.

Risk analizi,
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
listesini prompt injection, araç kötüye kullanımı, kimlik bilgisi açığa çıkması,
güvensiz yürütme, bellek veya bağlam zehirlenmesi ve aşırı aracılık gibi riskler
için bir mercek olarak kullanır.

ClawScan korkutucu görünen bir yeteneği otomatik olarak kötü amaçlı kabul etmez.
Yeteneğin açıklanmış, amaçla uyumlu ve sürümün belirtilen kullanım senaryosu
tarafından desteklenip desteklenmediğini sorar.

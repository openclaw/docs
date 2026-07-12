---
read_when:
    - ClawHub güvenlik denetimi sonuçlarını anlama
    - Bir skill mi yoksa plugin mi yükleneceğine karar verme
    - ClawHub denetim durumunu, risk düzeyini veya bulgularını açıklama
sidebarTitle: Security Audits
summary: Bir skill veya plugin yüklemeden önce ClawHub güvenlik denetimi sonuçları nasıl anlaşılır?
title: Güvenlik Denetimleri
x-i18n:
    generated_at: "2026-07-12T12:08:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Güvenlik Denetimleri

ClawHub güvenlik denetimleri, bir Skill veya Plugin'in kurulacak kadar güvenli olup olmadığına karar vermenize yardımcı olur. Bir sürümün ne yaptığını, hangi yetkileri talep ettiğini ve dosyalara, hesaplara, kimlik bilgilerine, koda veya harici hizmetlere erişebilmeden önce özellikle dikkat edilmesi gereken herhangi bir husus olup olmadığını gösterir.

Denetimler güçlü güvenlik göstergeleridir, ancak bir sürümün risksiz olduğunu garanti etmez. Hassas erişim vermeden önce daima kendi değerlendirmenizi yapın.

Ayrıca [Güvenlik](/clawhub/security), [Kabul edilebilir kullanım](/clawhub/acceptable-usage) ve [Moderasyon ve Hesap Güvenliği](/clawhub/moderation) bölümlerine bakın.

## Kurulumdan önce kontrol edilmesi gerekenler

Kurulumdan önce şunları inceleyin:

- genel denetim durumu
- risk düzeyi
- listelenen bulgular
- gerekli kimlik bilgileri, izinler veya ortam değişkenleri
- sahip, kaynak, sürüm, değişiklik günlüğü, indirme sayısı, yıldızlar ve diğer güven göstergeleri

Yalnızca anladığınız ve güvendiğiniz içerikleri kurun.

## Denetim durumu

Denetim durumu, denetim sonucuna nasıl tepki vermeniz gerektiğini belirtir:

| Durum       | Anlamı                                                                        |
| ----------- | ----------------------------------------------------------------------------- |
| `Pass`      | Düşük riskin üzerinde görünür bir sorun bulunmadı.                             |
| `Review`    | Kurulumdan önce bulguları okuyun. Sürüm yine de meşru olabilir.                |
| `Warn`      | Daha dikkatli olun. ClawHub, etkisi yüksek bir endişe veya uyarı sinyali buldu. |
| `Malicious` | Kurmayın.                                                                     |
| `Pending`   | Denetimler henüz tamamlanmadı.                                                 |
| `Error`     | Denetim tamamlanamadı.                                                         |

`Pass` güven vericidir, ancak kendi değerlendirmenizin yerini tutmaz. Bu özellikle içerik yayımlayabilen, verileri düzenleyebilen, komut çalıştırabilen, dosyaları okuyabilen veya üretim sistemlerine erişebilen araçlar için önemlidir.

## Risk düzeyi

Risk düzeyi, etki alanını açıklar: sürümü amaçlandığı şekilde kullandığınızda ne kadar yetkiye sahip göründüğünü belirtir.

| Risk düzeyi | Anlamı                                                                            |
| ----------- | --------------------------------------------------------------------------------- |
| `Low`       | Çok az hassas yetki veya kullanıcı etkisi bulundu.                                |
| `Medium`    | Sürüm, hesap erişimi veya veri değişiklikleri gibi önemli yetkilere sahiptir.      |
| `High`      | Sürüm; etkisi yüksek yetkilere, ciddi bulgulara veya kötü amaçlı sinyallere sahiptir. |

Risk düzeyi ile denetim durumu farklı soruları yanıtlar:

- Risk düzeyi şu soruyu sorar: "Burada ne kadar yetki var?"
- Denetim durumu şu soruyu sorar: "Bu sonuç karşısında ne yapmalıyım?"

Örneğin, yayımlama işlevine sahip bir Skill, `Medium` riskle birlikte `Review` gösterebilir. Bu, onun kötü amaçlı olduğu anlamına gelmez. Skill'in amacıyla uyumlu göründüğü, ancak önemli hesap yetkileriyle işlem yapabildiği anlamına gelir.

## Bulgular

Bulgular, bir denetim sonucunun neden gösterildiğini açıklar. Her bulgu genellikle şunları içerir:

- ne anlama geldiği
- neden işaretlendiği
- ilgili Skill veya Plugin içeriği
- bir öneri

Bulgular `Info`, `Low`, `Medium`, `High` veya `Critical` olarak etiketlenebilir. Daha yüksek önem derecesine sahip bulgular, risk düzeyine ve denetim durumuna daha fazla katkıda bulunur.

Sayfanın faydalı kanıtlara odaklanmasını sağlamak için düşük güven düzeyli bulgular genel denetim özetinde gösterilmez.

## ClawHub'ın kontrol ettikleri

ClawHub, gönderilen sürüm yapılarını denetler. Bunlar şunları içerir:

- Skill talimatları veya Plugin meta verileri
- beyan edilen ortam değişkenleri ve izinler
- kurulum talimatları ve paket meta verileri
- dâhil edilen dosyalar ve dosya manifestleri
- uyumluluk ve yetenek meta verileri

Temel soru tutarlılıktır: ad, özet, meta veriler, talep edilen yetkiler ve gerçek içerik, kullanıcıların makul olarak bekleyeceği biçimde birbiriyle uyumlu mu?

Güçlü davranışlar kendiliğinden kötü değildir. Birçok yararlı araç kimlik bilgilerine, yerel komutlara, sağlayıcı API'lerine veya paket kurulumlarına ihtiyaç duyar. Denetim, bu yetkinin beklenen, açıklanmış ve ölçülü olup olmadığını kontrol eder.

Yapı sayfaları tam denetimin bağlantısını şu adreste sunar:

```text
/<owner>/skills/<slug>/security-audit
```

Denetim sayfası şunları bir araya getirir:

1. SkillSpector
2. VirusTotal
3. Risk analizi

## VirusTotal

ClawHub, denetim sisteminde kötü amaçlı yazılım telemetrisi olarak VirusTotal'ı kullanır. VirusTotal, dosya itibarı ve kötü amaçlı yazılım taraması konusunda güvenilir bir sektör standardıdır ve iş ortaklığımız sayesinde ClawHub, Skill ve Plugin incelemelerine daha kapsamlı güvenlik bilgileri ekleyebilir.

VirusTotal; bilinen kötü amaçlı yapılar, tarama motoru tespitleri ve ClawHub'ın ajan odaklı incelemesini tamamlayan itibar sinyalleri açısından özellikle yararlıdır. Sağlayıcı tarama motorlarının sayıları mevcut olduğunda denetim, bunları aşağıdaki gibi sade bir dille özetler:

```text
62/62 vendors flagged this skill as clean.
```

veya:

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

ClawHub'ın özetleyebileceği bir sağlayıcı sayısı telemetrisi olmadığında denetim şunu belirtir:

```text
No VirusTotal findings
```

VirusTotal bir telemetri kaynağı olmaya devam eder. ClawHub'ın yapılara duyarlı kendi risk analizinin yerini tutmaz.

## Risk analizi

Risk analizi, ClawHub'ın kendi güvenlik denetim sistemi olan ClawScan tarafından desteklenir. Her sürümü ajanlara yönelik bir yapı olarak inceler: talimatlar, meta veriler, beyan edilen izinler, dosyalar, yetenek sinyalleri, statik tarama sinyalleri, SkillSpector bulguları, VirusTotal telemetrisi ve yayımcı tarafından sağlanan bağlam. Statik tarama sinyalleri bu incelemenin dâhilî bağlamıdır; bağımsız bir genel denetim bölümü veya kurulumu engelleyen bir karar değildir.

Risk analizi; istem enjeksiyonu, araçların kötüye kullanımı, kimlik bilgilerinin açığa çıkması, güvenli olmayan yürütme, bellek ya da bağlam zehirlenmesi ve aşırı özerklik gibi riskleri değerlendirmek için
[OWASP Agentic Skills İlk 10](https://owasp.org/www-project-agentic-skills-top-10/)
listesini bir çerçeve olarak kullanır.

ClawScan, ürkütücü görünen bir yeteneği otomatik olarak kötü amaçlı kabul etmez. Yeteneğin açıklanıp açıklanmadığını, amaçla uyumlu olup olmadığını ve sürümün belirtilen kullanım amacıyla desteklenip desteklenmediğini değerlendirir.

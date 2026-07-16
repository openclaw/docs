---
read_when:
    - ClawHub güvenlik denetimi sonuçlarını anlama
    - Bir skill'in mi yoksa plugin'in mi kurulacağına karar verme
    - ClawHub denetim durumunu, risk düzeyini veya bulgularını açıklama
sidebarTitle: Security Audits
summary: Bir skill veya plugin yüklemeden önce ClawHub güvenlik denetimi sonuçları nasıl anlaşılır?
title: Güvenlik Denetimleri
x-i18n:
    generated_at: "2026-07-16T17:12:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Güvenlik Denetimleri

ClawHub güvenlik denetimleri, bir skill veya pluginin yüklemek için yeterince güvenli olup olmadığına karar vermenize yardımcı olur. Bir sürümün ne yaptığını, hangi yetkileri talep ettiğini ve dosyalara, hesaplara, kimlik bilgilerine, koda veya harici hizmetlere erişmeden önce herhangi bir noktanın özellikle incelenmesi gerekip gerekmediğini gösterir.

Denetimler güçlü güvenlik göstergeleridir ancak bir sürümün risksiz olduğunu garanti etmez. Hassas erişim vermeden önce daima kendi değerlendirmenizi yapın.

Ayrıca [Güvenlik](/clawhub/security), [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage) ve [Moderasyon ve Hesap Güvenliği](/clawhub/moderation) bölümlerine bakın.

## Yüklemeden önce kontrol edilmesi gerekenler

Yüklemeden önce şunları inceleyin:

- genel denetim durumu
- risk düzeyi
- listelenen bulgular
- gerekli kimlik bilgileri, izinler veya ortam değişkenleri
- sahip, kaynak, sürüm, değişiklik günlüğü, indirme sayısı, yıldızlar ve diğer güven göstergeleri

Yalnızca anladığınız ve güvendiğiniz içerikleri yükleyin.

## Denetim durumu

Denetim durumu, denetim sonucuna nasıl yaklaşmanız gerektiğini belirtir:

| Durum      | Anlamı                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Düşük risk düzeyinin üzerinde görünür bir sorun bulunmadı.                                |
| `Review`    | Yüklemeden önce bulguları okuyun. Sürüm yine de meşru olabilir. |
| `Warn`      | Özellikle dikkatli olun. ClawHub, yüksek etkili bir endişe veya uyarı göstergesi buldu. |
| `Malicious` | Yüklemeyin.                                                           |
| `Pending`   | Denetimler henüz tamamlanmadı.                                             |
| `Error`     | Denetim tamamlanamadı.                                         |

Bir `Pass` güven vericidir ancak kendi değerlendirmenizin yerini tutmaz. Bu durum özellikle içerik yayımlayabilen, verileri düzenleyebilen, komut çalıştırabilen, dosya okuyabilen veya üretim sistemlerine erişebilen araçlar için önemlidir.

## Risk düzeyi

Risk düzeyi, etki alanını, yani sürüm amaçlandığı şekilde kullanıldığında ne kadar yetkiye sahip göründüğünü açıklar.

| Risk düzeyi | Anlamı                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| `Low`      | Çok az hassas yetki veya kullanıcı etkisi bulundu.                          |
| `Medium`   | Sürüm, hesap erişimi veya veri değişiklikleri gibi kayda değer yetkilere sahiptir. |
| `High`     | Sürüm yüksek etkili yetkilere, ciddi bulgulara veya kötü amaçlı göstergelere sahiptir. |

Risk düzeyi ile denetim durumu farklı soruları yanıtlar:

- Risk düzeyi şunu sorar: "Burada ne kadar yetki var?"
- Denetim durumu şunu sorar: "Bu sonuç karşısında ne yapmalıyım?"

Örneğin, yayımlama amaçlı bir skill, `Medium` risk düzeyiyle birlikte `Review` gösterebilir. Bu, kötü amaçlı olduğu anlamına gelmez. Skillin amacıyla uyumlu göründüğü ancak kayda değer hesap yetkileriyle işlem yapabildiği anlamına gelir.

## Bulgular

Bulgular, bir denetim sonucunun neden gösterildiğini açıklar. Her bulgu genellikle şunları içerir:

- ne anlama geldiği
- neden işaretlendiği
- ilgili skill veya plugin içeriği
- bir öneri

Bulgular `Info`, `Low`, `Medium`, `High` veya `Critical` olarak etiketlenebilir. Daha yüksek önem derecesine sahip bulgular, risk düzeyini ve denetim durumunu daha güçlü biçimde etkiler.

Sayfanın yararlı kanıtlara odaklanmasını sağlamak için düşük güven düzeyindeki bulgular, herkese açık denetim özetinde gizlenir.

## ClawHub neleri kontrol eder?

ClawHub, gönderilen sürüm yapıtlarını denetler. Bunlara şunlar dahildir:

- skill talimatları veya plugin meta verileri
- bildirilen ortam değişkenleri ve izinler
- yükleme talimatları ve paket meta verileri
- dahil edilen dosyalar ve dosya bildirimleri
- uyumluluk ve yetenek meta verileri

Temel soru tutarlılıktır: ad, özet, meta veriler, talep edilen yetkiler ve gerçek içerik, kullanıcıların makul beklentileriyle örtüşüyor mu?

Güçlü davranışlar otomatik olarak kötü değildir. Birçok yararlı araç kimlik bilgilerine, yerel komutlara, sağlayıcı API'lerine veya paket yüklemelerine ihtiyaç duyar. Denetim, bu yetkilerin beklenen, açıklanmış ve orantılı olup olmadığını kontrol eder.

Yapıt sayfaları, tam denetime şu adresten bağlantı verir:

```text
/<owner>/skills/<slug>/security-audit
```

Denetim sayfası şunları bir araya getirir:

1. SkillSpector
2. VirusTotal
3. Risk analizi

## VirusTotal

ClawHub, denetim katmanında kötü amaçlı yazılım telemetrisi olarak VirusTotal'ı kullanır. VirusTotal, dosya itibarı ve kötü amaçlı yazılım taraması için güvenilir bir sektör standardıdır ve ortaklığımız, ClawHub'ın skill ve plugin incelemelerine daha kapsamlı güvenlik istihbaratı eklemesini sağlar.

VirusTotal özellikle bilinen kötü amaçlı yapıtlar, tarama motoru eşleşmeleri ve ClawHub'ın ajan odaklı incelemesini tamamlayan itibar göstergeleri için kullanışlıdır. Sağlayıcı motorlarının sayıları mevcut olduğunda denetim bunları sade bir dille şöyle özetler:

```text
62/62 sağlayıcı bu skillin temiz olduğunu belirtti.
```

veya:

```text
2/64 sağlayıcı bu skillin kötü amaçlı olduğunu, 1/64 sağlayıcı şüpheli olduğunu ve 61/64 sağlayıcı temiz olduğunu belirtti.
```

ClawHub'ın özetleyebileceği bir sağlayıcı sayısı telemetrisi olmadığında denetimde şu ifade yer alır:

```text
VirusTotal bulgusu yok
```

VirusTotal bir telemetri kaynağı olmaya devam eder. ClawHub'ın yapıta duyarlı kendi risk analizinin yerini tutmaz.

## Risk analizi

Risk analizi, dahili olarak ClawHub'ın kendi güvenlik denetim sistemi ClawScan tarafından desteklenir. Her sürümü ajanlara yönelik bir yapıt olarak inceler: talimatlar, meta veriler, bildirilen izinler, dosyalar, yetenek göstergeleri, statik tarama göstergeleri, SkillSpector bulguları, VirusTotal telemetrisi ve yayımcı tarafından sağlanan bağlam. Statik tarama göstergeleri bu inceleme için dahili bağlam sağlar; bağımsız, herkese açık bir denetim bölümü veya yüklemeyi engelleyen bir karar değildir.

Risk analizi; istem enjeksiyonu, araçların kötüye kullanımı, kimlik bilgilerinin açığa çıkması, güvenli olmayan yürütme, bellek veya bağlam zehirlenmesi ve aşırı özerklik gibi riskleri değerlendirmek için [OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/) listesini temel alır.

ClawScan, ürkütücü görünen bir yeteneği otomatik olarak kötü amaçlı kabul etmez. Yeteneğin açıklanmış, amaçla uyumlu ve sürümün belirtilen kullanım senaryosuyla desteklenip desteklenmediğini değerlendirir.

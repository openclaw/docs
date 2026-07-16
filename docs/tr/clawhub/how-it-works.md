---
read_when:
    - Listelemeleri, sürümleri, kurulumları, yayımlamayı ve moderasyonu anlama
summary: ClawHub listelemelerinin, sürümlerinin, kurulumlarının, yayımlama, tarama ve güncelleme işlemlerinin çalışma şekli.
x-i18n:
    generated_at: "2026-07-16T16:53:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır?

ClawHub, OpenClaw Skills ve Plugin'leri için kayıt katmanıdır. Kullanıcılara
paketleri keşfedebilecekleri, yayıncılara sürümleri yayımlayabilecekleri bir yer sağlar ve
OpenClaw'a bu paketleri güvenli biçimde yükleyip güncellemesi için yeterli meta veriyi sunar.

## Kayıt girdileri

Herkese açık her listeleme, aşağıdakileri içeren bir kayıt girdisidir:

- bir sahip ve kısa ad veya paket adı
- bir ya da daha fazla yayımlanmış sürüm
- meta veri, özet, dosyalar ve kaynak atfı
- değişiklik günlüğü ve `latest` gibi etiket bilgileri
- indirme, yükleme ve yıldız sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir Skills veya Plugin'i yüklemeden önce
ne yaptığını iddia ettiğini inceleyebilecekleri standart yerdir.

## Skills

Bir Skills, `SKILL.md` merkezli, sürümlendirilmiş bir metin paketidir.
Destekleyici dosyalar, örnekler, şablonlar ve betikler içerebilir.

ClawHub; Skills adını, açıklamasını, gereksinimlerini, ortam değişkenlerini ve
meta verilerini anlamak için `SKILL.md` ön bilgisini okur. Doğru
meta veriler önemlidir; çünkü kullanıcıların Skills'i yükleyip yüklememeye
karar vermesine ve otomatik taramaların beyan edilen davranış ile gözlemlenen
davranış arasındaki uyumsuzlukları algılamasına yardımcı olur.

Bkz. [Skills biçimi](/tr/clawhub/skill-format).

## Plugin'ler

Plugin'ler, paketlenmiş OpenClaw uzantılarıdır. ClawHub paket meta verilerini,
uyumluluk bilgilerini, kaynak bağlantılarını, yapıtları ve sürüm kayıtlarını saklar.

OpenClaw, ClawHub'dan bir Plugin yüklerken yüklemeden önce belirtilen uyumluluk
meta verilerini denetler. Paket kayıtları; API uyumluluğunu, minimum Gateway
sürümünü, ana makine hedeflerini, ortam gereksinimlerini ve yapıt özetlerini
içerebilir.

Kayıt sisteminin tek doğruluk kaynağı olmasını istediğinizde açık bir ClawHub
yükleme kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayımlama

Yayımlama, değiştirilemez yeni bir sürüm kaydı oluşturur. Yayıncılar, kimlik
doğrulamalı kayıt iş akışları için `clawhub` CLI'ını kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenen yükü önizlemek için deneme çalıştırmalarını kullanın.
Ardından herkese açık sayfalar; yayımlanan meta verileri, dosyaları, kaynak
atfını ve tarama durumunu gösterir.

## Yüklemeler ve güncellemeler

OpenClaw yükleme komutları, ClawHub'ı paket kaynağı olarak kullanır:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw, güncellemelerin daha sonra aynı kayıt paketini çözümleyebilmesi için
yükleme kaynağı meta verilerini kaydeder. ClawHub CLI ayrıca, kayıt tarafından
yönetilen Skills klasörlerini tam bir OpenClaw çalışma alanının dışında kullanmak
isteyen kullanıcılar için doğrudan Skills yükleme ve güncelleme iş akışlarını destekler.

## Güvenlik durumu

ClawHub yayımlamaya açıktır, ancak sürümler yine de yükleme geçitlerine, otomatik
denetimlere, kullanıcı raporlarına ve moderatör işlemlerine tabidir.

Herkese açık sayfalar, mevcut olduğunda tarama özetlerini gösterir. Bekletilen,
gizlenen veya engellenen içerikler, tanılama amacıyla sahibi tarafından
görülebilir kalırken herkese açık arama ve yükleme akışlarından kaybolabilir.

Bkz. [Güvenlik](/clawhub/security), [Güvenlik Denetimleri](/clawhub/security-audits),
[Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation) ve
[Kabul edilebilir kullanım](/clawhub/acceptable-usage).

## API erişimi

ClawHub; keşif, arama, paket ayrıntıları ve indirmeler için herkese açık okuma
API'leri sunar. Üçüncü taraf katalogları, standart ClawHub listelemesine geri
bağlantı verdikleri, hız sınırlarına uydukları ve desteklendikleri izlenimini
vermekten kaçındıkları sürece bu API'leri kullanabilir.

Bkz. [Genel API](/clawhub/api) ve [HTTP API](/clawhub/http-api).

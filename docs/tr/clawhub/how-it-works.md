---
read_when:
    - Listeleri, sürümleri, kurulumları, yayımlamayı ve moderasyonu anlama
summary: ClawHub kayıtlarının, sürümlerinin, kurulumlarının, yayınlamanın, taramaların ve güncellemelerin nasıl çalıştığı.
x-i18n:
    generated_at: "2026-07-03T02:53:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır

ClawHub, OpenClaw Skills ve Plugin kayıt katmanıdır. Kullanıcılara paketleri
keşfedebilecekleri bir yer, yayıncılara sürüm yayımlayabilecekleri bir yer ve
OpenClaw'a bu paketleri güvenli şekilde yükleyip güncellemesi için yeterli meta
veri sağlar.

## Kayıt kayıtları

Her herkese açık listeleme şu öğeleri içeren bir kayıt kaydıdır:

- sahip ve slug ya da paket adı
- bir veya daha fazla yayımlanmış sürüm
- meta veri, özet, dosyalar ve kaynak atfı
- `latest` gibi değişiklik günlüğü ve etiket bilgileri
- indirme, yükleme ve yıldız sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir skill veya plugin'in ne yaptığını iddia
ettiğini yüklemeden önce incelemesi için kanonik yerdir.

## Skills

Bir skill, `SKILL.md` etrafında merkezlenen sürümlendirilmiş bir metin paketidir.
Destekleyici dosyalar, örnekler, şablonlar ve betikler içerebilir.

ClawHub, skill adını, açıklamasını, gereksinimlerini, ortam değişkenlerini ve meta
verilerini anlamak için `SKILL.md` frontmatter'ını okur. Doğru meta veri önemlidir
çünkü kullanıcıların skill'i yükleyip yüklememeye karar vermesine yardımcı olur ve
otomatik taramaların bildirilen davranış ile gözlemlenen davranış arasındaki
uyumsuzlukları algılamasına yardımcı olur.

Bkz. [Skill biçimi](/tr/clawhub/skill-format).

## Plugins

Plugin'ler paketlenmiş OpenClaw uzantılarıdır. ClawHub paket meta verilerini,
uyumluluk bilgilerini, kaynak bağlantılarını, yapıtları ve sürüm kayıtlarını
saklar.

OpenClaw, ClawHub'dan bir plugin yüklediğinde, yüklemeden önce duyurulan uyumluluk
meta verilerini denetler. Paket kayıtları API uyumluluğu, minimum Gateway sürümü,
ana makine hedefleri, ortam gereksinimleri ve yapıt özetlerini içerebilir.

Kayıt katmanının doğruluk kaynağı olmasını istediğinizde açık bir ClawHub yükleme
kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayımlama

Yayımlama, yeni ve değişmez bir sürüm kaydı oluşturur. Yayıncılar, kimlik
doğrulamalı kayıt iş akışları için `clawhub` CLI'sini kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenen yükü önizlemek için kuru çalıştırmaları kullanın.
Herkese açık sayfalar daha sonra yayımlanan meta verileri, dosyaları, kaynak
atfını ve tarama durumunu gösterir.

## Yüklemeler ve güncellemeler

OpenClaw yükleme komutları ClawHub'ı bir paket kaynağı olarak kullanır:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw, güncellemelerin daha sonra aynı kayıt paketini çözümleyebilmesi için
yükleme kaynağı meta verilerini kaydeder. ClawHub CLI, tam bir OpenClaw çalışma
alanı dışında kayıt tarafından yönetilen skill klasörleri isteyen kullanıcılar
için doğrudan skill yükleme ve güncelleme iş akışlarını da destekler.

## Güvenlik durumu

ClawHub yayımlamaya açıktır, ancak sürümler yine de yükleme kapılarına, otomatik
kontrollere, kullanıcı raporlarına ve moderatör eylemine tabidir.

Herkese açık sayfalar, mevcut olduğunda tarama özetlerini gösterir. Bekletilen,
gizlenen veya engellenen içerik; tanılama için sahibine görünür kalırken herkese
açık arama ve yükleme akışlarından kaybolabilir.

Bkz. [Güvenlik](/clawhub/security), [Güvenlik Denetimleri](/clawhub/security-audits),
[Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation) ve
[Kabul edilebilir kullanım](/clawhub/acceptable-usage).

## API erişimi

ClawHub; keşif, arama, paket ayrıntıları ve indirmeler için herkese açık okuma
API'leri sunar. Üçüncü taraf kataloglar, kanonik ClawHub listelemesine geri
bağlantı verdiklerinde, hız sınırlarına uyduklarında ve onay anlamı çıkarmaktan
kaçındıklarında bu API'leri kullanabilir.

Bkz. [Herkese Açık API](/tr/clawhub/api) ve [HTTP API](/clawhub/http-api).

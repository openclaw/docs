---
read_when:
    - Listelemeleri, sürümleri, kurulumları, yayımlamayı ve moderasyonu anlama
summary: ClawHub listelemeleri, sürümler, kurulumlar, yayımlama, taramalar ve güncellemeler nasıl çalışır.
x-i18n:
    generated_at: "2026-05-12T15:42:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır

ClawHub, OpenClaw Skills ve Plugin kayıt katmanıdır. Kullanıcılara paketleri
keşfedebilecekleri bir yer, yayıncılara sürümleri yayımlayabilecekleri bir yer
ve OpenClaw'a bu paketleri güvenli şekilde yükleyip güncellemek için yeterli
meta veri sağlar.

## Kayıt kayıtları

Her herkese açık listeleme şunları içeren bir kayıt kaydıdır:

- bir sahip ve slug ya da paket adı
- bir veya daha fazla yayımlanmış sürüm
- meta veriler, özet, dosyalar ve kaynak atfı
- `latest` gibi değişiklik günlüğü ve etiket bilgileri
- indirme, yükleme, yıldız ve yorum sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir skill veya plugin yüklemeden önce ne
yaptığını iddia ettiğini incelemesi için kanonik yerdir.

## Skills

Bir skill, `SKILL.md` etrafında merkezlenen sürümlenmiş bir metin paketidir.
Destekleyici dosyalar, örnekler, şablonlar ve betikler içerebilir.

ClawHub, skill adını, açıklamasını, gereksinimlerini, ortam değişkenlerini ve
meta verilerini anlamak için `SKILL.md` frontmatter bölümünü okur. Doğru meta
veri önemlidir; çünkü kullanıcıların skill'i yükleyip yüklememeye karar vermesine
yardımcı olur ve otomatik taramaların beyan edilen davranış ile gözlemlenen
davranış arasındaki uyumsuzlukları tespit etmesini sağlar.

Bkz. [Skill biçimi](/tr/clawhub/skill-format).

## Plugins

Plugins, paketlenmiş OpenClaw uzantılarıdır. ClawHub paket meta verilerini,
uyumluluk bilgilerini, kaynak bağlantılarını, yapıtları ve sürüm kayıtlarını
saklar.

OpenClaw, ClawHub'dan bir plugin yüklediğinde, yüklemeden önce duyurulan
uyumluluk meta verilerini denetler. Paket kayıtları API uyumluluğunu, minimum
gateway sürümünü, ana makine hedeflerini, ortam gereksinimlerini ve yapıt
özetlerini içerebilir.

Kaydın doğruluk kaynağı olmasını istediğinizde açık bir ClawHub yükleme kaynağı
kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayımlama

Yayımlama, yeni ve değiştirilemez bir sürüm kaydı oluşturur. Yayıncılar,
kimliği doğrulanmış kayıt iş akışları için `clawhub` CLI kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenen yükü önizlemek için kuru çalıştırmaları kullanın.
Herkese açık sayfalar daha sonra yayımlanan meta verileri, dosyaları, kaynak
atfını ve tarama durumunu gösterir.

## Yüklemeler ve güncellemeler

OpenClaw yükleme komutları ClawHub'ı paket kaynağı olarak kullanır:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw, güncellemelerin daha sonra aynı kayıt paketini çözümleyebilmesi için
yükleme kaynağı meta verilerini kaydeder. ClawHub CLI, tam bir OpenClaw çalışma
alanı dışında kayıt tarafından yönetilen skill klasörleri isteyen kullanıcılar
için doğrudan skill yükleme ve güncelleme iş akışlarını da destekler.

## Güvenlik durumu

ClawHub yayımlamaya açıktır, ancak sürümler yine de yükleme kapılarına, otomatik
denetimlere, kullanıcı raporlarına ve moderatör işlemine tabidir.

Herkese açık sayfalar, mevcut olduğunda tarama özetlerini gösterir. Bekletilen,
gizlenen veya engellenen içerikler, tanılama için sahibine görünür kalırken
herkese açık arama ve yükleme akışlarından kaybolabilir.

Bkz. [Güvenlik + moderasyon](/tr/clawhub/security) ve
[Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage).

## API erişimi

ClawHub; keşif, arama, paket ayrıntıları ve indirmeler için herkese açık okuma
API'leri sunar. Üçüncü taraf kataloglar, kanonik ClawHub listelemesine geri
bağlantı verdikleri, hız sınırlarına uydukları ve onay ima etmekten kaçındıkları
sürece bu API'leri kullanabilir.

Bkz. [Public API](/tr/clawhub/api) ve [HTTP API](/tr/clawhub/http-api).

---
read_when:
    - Listeleri, sürümleri, kurulumları, yayımlamayı ve moderasyonu anlama
summary: ClawHub listelemeleri, sürümleri, yüklemeleri, yayınlama, taramalar ve güncellemelerin nasıl çalıştığı.
x-i18n:
    generated_at: "2026-06-28T08:15:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır

ClawHub, OpenClaw becerileri ve eklentileri için kayıt katmanıdır. Kullanıcılara
paketleri keşfedecek bir yer, yayıncılara sürüm yayımlayacak bir yer ve
OpenClaw'a bu paketleri güvenli şekilde kurup güncellemek için yeterli meta veri
sağlar.

## Kayıt kayıtları

Her herkese açık listeleme şunları içeren bir kayıt kaydıdır:

- sahip ve slug ya da paket adı
- bir veya daha fazla yayımlanmış sürüm
- meta veriler, özet, dosyalar ve kaynak atfı
- `latest` gibi değişiklik günlüğü ve etiket bilgileri
- indirme, kurulum ve yıldız sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir becerinin veya eklentinin kurulumdan önce
ne yaptığını iddia ettiğini incelemesi için kanonik yerdir.

## Skills

Beceri, `SKILL.md` merkezli sürümlenmiş bir metin paketidir. Destekleyici
dosyalar, örnekler, şablonlar ve betikler içerebilir.

ClawHub, beceri adını, açıklamasını, gereksinimlerini, ortam değişkenlerini ve
meta verilerini anlamak için `SKILL.md` frontmatter'ını okur. Doğru meta veriler
önemlidir çünkü kullanıcıların beceriyi kurup kurmamaya karar vermesine yardımcı
olur ve otomatik taramaların beyan edilen davranış ile gözlemlenen davranış
arasındaki uyumsuzlukları algılamasına yardımcı olur.

Bkz. [Beceri biçimi](/tr/clawhub/skill-format).

## Eklentiler

Eklentiler, paketlenmiş OpenClaw uzantılarıdır. ClawHub paket meta verilerini,
uyumluluk bilgilerini, kaynak bağlantılarını, yapıtları ve sürüm kayıtlarını
saklar.

OpenClaw, ClawHub'dan bir eklenti kurduğunda, kurulumdan önce duyurulan
uyumluluk meta verilerini denetler. Paket kayıtları API uyumluluğu, minimum
Gateway sürümü, ana makine hedefleri, ortam gereksinimleri ve yapıt özetlerini
içerebilir.

Kayıt defterinin doğruluk kaynağı olmasını istediğinizde açık bir ClawHub kurulum
kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayımlama

Yayımlama, yeni ve değiştirilemez bir sürüm kaydı oluşturur. Yayıncılar kimliği
doğrulanmış kayıt iş akışları için `clawhub` CLI'ını kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenen yükü önizlemek için kuru çalıştırmaları kullanın.
Ardından herkese açık sayfalar yayımlanan meta verileri, dosyaları, kaynak
atfını ve tarama durumunu gösterir.

## Kurulumlar ve güncellemeler

OpenClaw kurulum komutları ClawHub'ı paket kaynağı olarak kullanır:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw, güncellemelerin daha sonra aynı kayıt paketini çözümleyebilmesi için
kurulum kaynağı meta verilerini kaydeder. ClawHub CLI, tam bir OpenClaw çalışma
alanı dışında kayıt tarafından yönetilen beceri klasörleri isteyen kullanıcılar
için doğrudan beceri kurulum ve güncelleme iş akışlarını da destekler.

## Güvenlik durumu

ClawHub yayımlamaya açıktır, ancak sürümler yine de yükleme kapılarına, otomatik
denetimlere, kullanıcı raporlarına ve moderatör işlemlerine tabidir.

Herkese açık sayfalar, mevcut olduğunda tarama özetlerini gösterir. Tutulan,
gizlenen veya engellenen içerik; tanılama için sahibine görünür kalırken herkese
açık arama ve kurulum akışlarından kaybolabilir.

Bkz. [Güvenlik](/tr/clawhub/security), [Güvenlik Denetimleri](/tr/clawhub/security-audits),
[Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation) ve
[Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage).

## API erişimi

ClawHub keşif, arama, paket ayrıntıları ve indirmeler için herkese açık okuma
API'leri sunar. Üçüncü taraf kataloglar, kanonik ClawHub listelemesine geri
bağlantı verdiklerinde, hız sınırlarına uyduklarında ve onay ima etmekten
kaçındıklarında bu API'leri kullanabilir.

Bkz. [Herkese Açık API](/tr/clawhub/api) ve [HTTP API](/tr/clawhub/http-api).

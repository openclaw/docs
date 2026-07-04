---
read_when:
    - Listelemeleri, sürümleri, kurulumları, yayımlamayı ve moderasyonu anlama
summary: ClawHub listelerinin, sürümlerinin, kurulumlarının, yayınlamanın, taramaların ve güncellemelerin nasıl çalıştığı.
x-i18n:
    generated_at: "2026-07-04T04:02:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır

ClawHub, OpenClaw becerileri ve Plugin'leri için kayıt katmanıdır. Kullanıcılara
paketleri keşfedecek bir yer, yayıncılara sürüm yayımlayacak bir yer ve
OpenClaw'a bu paketleri güvenli biçimde kurup güncellemek için yeterli meta veri
sağlar.

## Kayıt kayıtları

Her herkese açık listeleme şunları içeren bir kayıt kaydıdır:

- sahip ve slug ya da paket adı
- bir veya daha fazla yayımlanmış sürüm
- meta veriler, özet, dosyalar ve kaynak atfı
- `latest` gibi değişiklik günlüğü ve etiket bilgileri
- indirme, kurulum ve yıldız sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir becerinin veya Plugin'in kurmadan önce ne
yaptığını iddia ettiğini incelemesi için kanonik yerdir.

## Skills

Beceri, `SKILL.md` etrafında merkezlenen sürümlü bir metin paketidir. Destekleyici
dosyalar, örnekler, şablonlar ve betikler içerebilir.

ClawHub, beceri adını, açıklamasını, gereksinimlerini, ortam değişkenlerini ve
meta verilerini anlamak için `SKILL.md` ön maddesini okur. Doğru meta veriler
önemlidir çünkü kullanıcıların beceriyi kurup kurmamaya karar vermesine yardımcı
olur ve otomatik taramaların bildirilen davranış ile gözlemlenen davranış
arasındaki uyumsuzlukları algılamasına yardımcı olur.

Bkz. [Beceri biçimi](/tr/clawhub/skill-format).

## Plugin'ler

Plugin'ler paketlenmiş OpenClaw uzantılarıdır. ClawHub paket meta verilerini,
uyumluluk bilgilerini, kaynak bağlantılarını, yapıtları ve sürüm kayıtlarını
saklar.

OpenClaw, ClawHub'dan bir Plugin kurduğunda, kurulumdan önce duyurulan uyumluluk
meta verilerini denetler. Paket kayıtları API uyumluluğu, minimum Gateway
sürümü, ana makine hedefleri, ortam gereksinimleri ve yapıt özetlerini içerebilir.

Kayıt defterinin doğruluk kaynağı olmasını istediğinizde açık bir ClawHub kurulum
kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayınlama

Yayınlama, yeni ve değişmez bir sürüm kaydı oluşturur. Yayıncılar, kimliği
doğrulanmış kayıt iş akışları için `clawhub` CLI'sini kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenen yükü önizlemek için kuru çalıştırmaları kullanın.
Ardından herkese açık sayfalar yayımlanan meta verileri, dosyaları, kaynak
atfını ve tarama durumunu gösterir.

## Kurulumlar ve güncellemeler

OpenClaw kurulum komutları, ClawHub'ı paket kaynağı olarak kullanır:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw, güncellemelerin aynı kayıt paketini daha sonra çözebilmesi için kurulum
kaynağı meta verilerini kaydeder. ClawHub CLI, tam bir OpenClaw çalışma alanı
dışında kayıt tarafından yönetilen beceri klasörleri isteyen kullanıcılar için
doğrudan beceri kurulum ve güncelleme iş akışlarını da destekler.

## Güvenlik durumu

ClawHub yayınlamaya açıktır, ancak sürümler yine de yükleme kapılarına, otomatik
denetimlere, kullanıcı raporlarına ve moderatör eylemlerine tabidir.

Herkese açık sayfalar, mevcut olduğunda tarama özetlerini gösterir. Bekletilen,
gizlenen veya engellenen içerikler tanılama için sahibine görünür kalırken
herkese açık arama ve kurulum akışlarından kaybolabilir.

Bkz. [Güvenlik](/clawhub/security), [Güvenlik Denetimleri](/clawhub/security-audits),
[Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation) ve
[Kabul edilebilir kullanım](/clawhub/acceptable-usage).

## API erişimi

ClawHub keşif, arama, paket ayrıntıları ve indirmeler için herkese açık okuma
API'leri sunar. Üçüncü taraf kataloglar, kanonik ClawHub listelemesine geri
bağlantı verdiklerinde, hız sınırlarına uyduklarında ve desteklendiği izlenimi
vermekten kaçındıklarında bu API'leri kullanabilir.

Bkz. [Herkese Açık API](/tr/clawhub/api) ve [HTTP API](/clawhub/http-api).

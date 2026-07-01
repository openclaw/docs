---
read_when:
    - Listelemeleri, sürümleri, kurulumları, yayınlamayı ve moderasyonu anlama
summary: ClawHub listelemelerinin, sürümlerinin, kurulumlarının, yayımlamanın, taramaların ve güncellemelerin nasıl çalıştığı.
x-i18n:
    generated_at: "2026-07-01T18:18:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır

ClawHub, OpenClaw becerileri ve Plugin'leri için kayıt katmanıdır. Kullanıcılara
paketleri keşfedebilecekleri bir yer, yayıncılara sürümleri yayımlayabilecekleri
bir yer ve OpenClaw'a bu paketleri güvenli şekilde yükleyip güncellemek için
yeterli metadata sağlar.

## Kayıt kayıtları

Her herkese açık listeleme şunları içeren bir kayıt kaydıdır:

- bir sahip ve slug ya da paket adı
- bir veya daha fazla yayımlanmış sürüm
- metadata, özet, dosyalar ve kaynak atfı
- changelog ve `latest` gibi etiket bilgileri
- indirme, yükleme ve yıldız sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir becerinin veya Plugin'in yüklemeden önce
ne yaptığını iddia ettiğini incelemesi için kanonik yerdir.

## Skills

Bir beceri, `SKILL.md` merkezli sürümlendirilmiş bir metin paketidir. Destekleyici
dosyalar, örnekler, şablonlar ve betikler içerebilir.

ClawHub, beceri adını, açıklamasını, gereksinimlerini, ortam değişkenlerini ve
metadata'sını anlamak için `SKILL.md` frontmatter'ını okur. Doğru metadata
önemlidir; çünkü kullanıcıların beceriyi yükleyip yüklememeye karar vermesine
yardımcı olur ve otomatik taramaların beyan edilen davranış ile gözlemlenen
davranış arasındaki uyumsuzlukları saptamasını sağlar.

Bkz. [Beceri biçimi](/tr/clawhub/skill-format).

## Plugin'ler

Plugin'ler paketlenmiş OpenClaw uzantılarıdır. ClawHub paket metadata'sını,
uyumluluk bilgilerini, kaynak bağlantılarını, artifact'leri ve sürüm kayıtlarını
saklar.

OpenClaw, ClawHub'dan bir Plugin yüklediğinde yüklemeden önce duyurulan uyumluluk
metadata'sını denetler. Paket kayıtları API uyumluluğu, minimum gateway sürümü,
host hedefleri, ortam gereksinimleri ve artifact özetleri içerebilir.

Kayıt katmanının doğruluk kaynağı olmasını istediğinizde açık bir ClawHub yükleme
kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayımlama

Yayımlama, yeni bir değişmez sürüm kaydı oluşturur. Yayıncılar kimlik doğrulamalı
kayıt iş akışları için `clawhub` CLI'sini kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenen payload'ı önizlemek için dry run kullanın. Herkese açık
sayfalar daha sonra yayımlanan metadata'yı, dosyaları, kaynak atfını ve tarama
durumunu gösterir.

## Yüklemeler ve güncellemeler

OpenClaw yükleme komutları ClawHub'ı paket kaynağı olarak kullanır:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw, güncellemelerin daha sonra aynı kayıt paketini çözebilmesi için yükleme
kaynağı metadata'sını kaydeder. ClawHub CLI, tam bir OpenClaw çalışma alanı
dışında kayıt tarafından yönetilen beceri klasörleri isteyen kullanıcılar için
doğrudan beceri yükleme ve güncelleme iş akışlarını da destekler.

## Güvenlik durumu

ClawHub yayımlamaya açıktır, ancak sürümler yine de yükleme kapılarına, otomatik
denetimlere, kullanıcı raporlarına ve moderatör eylemine tabidir.

Herkese açık sayfalar, mevcut olduğunda tarama özetlerini gösterir. Bekletilen,
gizlenen veya engellenen içerik; tanılama için sahibine görünür kalırken herkese
açık arama ve yükleme akışlarından kaybolabilir.

Bkz. [Güvenlik](/clawhub/security), [Güvenlik Denetimleri](/clawhub/security-audits),
[Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation) ve
[Kabul edilebilir kullanım](/clawhub/acceptable-usage).

## API erişimi

ClawHub keşif, arama, paket ayrıntıları ve indirmeler için herkese açık okuma
API'leri sunar. Üçüncü taraf kataloglar, kanonik ClawHub listelemesine geri
bağlantı verdikleri, hız sınırlarına uydukları ve onay izlenimi vermekten
kaçındıkları sürece bu API'leri kullanabilir.

Bkz. [Herkese Açık API](/tr/clawhub/api) ve [HTTP API](/clawhub/http-api).

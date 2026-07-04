---
read_when:
    - Listelemeleri, sürümleri, kurulumları, yayınlamayı ve moderasyonu anlama
summary: ClawHub listelemelerinin, sürümlerinin, kurulumlarının, yayımlamanın, taramaların ve güncellemelerin nasıl çalıştığı.
x-i18n:
    generated_at: "2026-07-04T10:56:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır

ClawHub, OpenClaw Skills ve pluginleri için kayıt katmanıdır. Kullanıcılara
paketleri keşfedebilecekleri bir yer, yayıncılara sürüm yayınlayabilecekleri
bir yer ve OpenClaw'a bu paketleri güvenli şekilde kurup güncellemek için yeterli
metadata sağlar.

## Kayıt kayıtları

Her genel listeleme şunları içeren bir kayıt kaydıdır:

- sahip ve slug ya da paket adı
- bir veya daha fazla yayımlanmış sürüm
- metadata, özet, dosyalar ve kaynak atfı
- `latest` gibi changelog ve etiket bilgileri
- indirme, kurulum ve yıldız sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir skill veya pluginin kurulumdan önce ne
yapmayı iddia ettiğini incelemesi için kanonik yerdir.

## Skills

Skill, `SKILL.md` merkezli sürümlenmiş bir metin paketidir. Destekleyici
dosyalar, örnekler, şablonlar ve betikler içerebilir.

ClawHub, skill adını, açıklamasını, gereksinimlerini, environment variable'ları
ve metadata bilgilerini anlamak için `SKILL.md` frontmatter bölümünü okur. Doğru
metadata önemlidir çünkü kullanıcıların skill'i kurup kurmamaya karar vermesine
yardımcı olur ve otomatik taramaların beyan edilen davranış ile gözlemlenen
davranış arasındaki uyumsuzlukları tespit etmesini sağlar.

Bkz. [Skill biçimi](/tr/clawhub/skill-format).

## Pluginler

Pluginler, paketlenmiş OpenClaw uzantılarıdır. ClawHub paket metadata'sını,
uyumluluk bilgilerini, kaynak bağlantılarını, artifact'leri ve sürüm kayıtlarını
saklar.

OpenClaw, ClawHub'dan bir plugin kurduğunda kurulumdan önce ilan edilen
uyumluluk metadata'sını denetler. Paket kayıtları API uyumluluğu, minimum
Gateway sürümü, ana makine hedefleri, ortam gereksinimleri ve artifact digest'leri
içerebilir.

Kayıt katmanının doğruluk kaynağı olmasını istediğinizde açık bir ClawHub kurulum
kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayınlama

Yayınlama, yeni ve değiştirilemez bir sürüm kaydı oluşturur. Yayıncılar kimliği
doğrulanmış kayıt iş akışları için `clawhub` CLI aracını kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenen payload'u önizlemek için dry run kullanın. Genel
sayfalar daha sonra yayımlanan metadata'yı, dosyaları, kaynak atfını ve tarama
durumunu gösterir.

## Kurulumlar ve güncellemeler

OpenClaw kurulum komutları ClawHub'ı paket kaynağı olarak kullanır:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw, güncellemelerin daha sonra aynı kayıt paketini çözebilmesi için
kurulum kaynağı metadata'sını kaydeder. ClawHub CLI ayrıca, tam bir OpenClaw
workspace'i dışında kayıt tarafından yönetilen skill klasörleri isteyen
kullanıcılar için doğrudan skill kurulum ve güncelleme iş akışlarını destekler.

## Güvenlik durumu

ClawHub yayınlamaya açıktır, ancak sürümler yine de yükleme kapılarına, otomatik
denetimlere, kullanıcı raporlarına ve moderatör işlemlerine tabidir.

Genel sayfalar mevcut olduğunda tarama özetlerini gösterir. Tutulan, gizlenen
veya engellenen içerik, tanılama için sahibine görünür kalırken genel arama ve
kurulum akışlarından kaybolabilir.

Bkz. [Güvenlik](/clawhub/security), [Güvenlik Denetimleri](/clawhub/security-audits),
[Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation) ve
[Kabul edilebilir kullanım](/clawhub/acceptable-usage).

## API erişimi

ClawHub keşif, arama, paket ayrıntıları ve indirmeler için genel okuma API'leri
sunar. Üçüncü taraf kataloglar, kanonik ClawHub listelemesine geri bağlantı
verdikleri, hız sınırlarına uydukları ve onay ima etmekten kaçındıkları sürece
bu API'leri kullanabilir.

Bkz. [Genel API](/tr/clawhub/api) ve [HTTP API](/clawhub/http-api).

---
read_when:
    - Listelemeleri, sürümleri, kurulumları, yayınlamayı ve moderasyonu anlama
summary: ClawHub listelemelerinin, sürümlerinin, kurulumlarının, yayımlamanın, taramaların ve güncellemelerin nasıl çalıştığı.
x-i18n:
    generated_at: "2026-07-02T17:44:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır?

ClawHub, OpenClaw Skills ve Plugin’leri için kayıt katmanıdır. Kullanıcılara
paketleri keşfedecekleri bir yer, yayıncılara sürümleri yayımlayacakları bir
yer ve OpenClaw’a bu paketleri güvenli şekilde kurup güncellemek için yeterli
metadata sağlar.

## Kayıt kayıtları

Her herkese açık listeleme, şunları içeren bir kayıt kaydıdır:

- bir sahip ve slug ya da paket adı
- bir veya daha fazla yayımlanmış sürüm
- metadata, özet, dosyalar ve kaynak atfı
- `latest` gibi changelog ve etiket bilgileri
- indirme, kurulum ve yıldız sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir skill veya
plugin’in ne yaptığını iddia ettiğini kurmadan önce inceleyebileceği kanonik yerdir.

## Skills

Bir skill, `SKILL.md` merkezli sürümlenmiş bir metin paketidir. Destekleyici
dosyalar, örnekler, şablonlar ve betikler içerebilir.

ClawHub, skill adını, açıklamasını, gereksinimlerini, ortam değişkenlerini ve
metadata’yı anlamak için `SKILL.md` frontmatter’ını okur. Doğru
metadata önemlidir; çünkü kullanıcıların skill’i kurup kurmamaya karar vermesine
yardımcı olur ve otomatik taramaların beyan edilen davranış ile gözlenen davranış
arasındaki uyumsuzlukları algılamasına yardımcı olur.

Bkz. [Skill biçimi](/tr/clawhub/skill-format).

## Plugins

Plugin’ler paketlenmiş OpenClaw uzantılarıdır. ClawHub paket metadata’sını,
uyumluluk bilgilerini, kaynak bağlantılarını, artifact’leri ve sürüm kayıtlarını
saklar.

OpenClaw, ClawHub’dan bir plugin kurduğunda, kurulumdan önce ilan edilen uyumluluk
metadata’sını denetler. Paket kayıtları API uyumluluğu, minimum gateway sürümü,
host hedefleri, ortam gereksinimleri ve artifact özet değerleri içerebilir.

Kayıt katmanının doğruluk kaynağı olmasını istediğinizde açık bir ClawHub kurulum
kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayımlama

Yayımlama, yeni ve değişmez bir sürüm kaydı oluşturur. Yayıncılar kimliği doğrulanmış
kayıt iş akışları için `clawhub` CLI’ını kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenen payload’u önizlemek için dry run kullanın. Herkese açık
sayfalar daha sonra yayımlanan metadata’yı, dosyaları, kaynak atfını ve tarama
durumunu gösterir.

## Kurulumlar ve güncellemeler

OpenClaw kurulum komutları ClawHub’ı paket kaynağı olarak kullanır:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw, güncellemelerin daha sonra aynı kayıt paketini çözümleyebilmesi için
kurulum kaynağı metadata’sını kaydeder. ClawHub CLI ayrıca tam bir OpenClaw
çalışma alanı dışında kayıt tarafından yönetilen skill klasörleri isteyen
kullanıcılar için doğrudan skill kurulum ve güncelleme iş akışlarını destekler.

## Güvenlik durumu

ClawHub yayımlamaya açıktır, ancak sürümler yine de yükleme kapılarına, otomatik
denetimlere, kullanıcı raporlarına ve moderatör işlemine tabidir.

Herkese açık sayfalar mevcut olduğunda tarama özetlerini gösterir. Tutulan,
gizlenen veya engellenen içerik, tanılama için sahibine görünür kalırken herkese
açık arama ve kurulum akışlarından kaybolabilir.

Bkz. [Güvenlik](/clawhub/security), [Güvenlik Denetimleri](/clawhub/security-audits),
[Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation) ve
[Kabul edilebilir kullanım](/clawhub/acceptable-usage).

## API erişimi

ClawHub keşif, arama, paket ayrıntıları ve indirmeler için herkese açık okuma
API’leri sunar. Üçüncü taraf kataloglar, kanonik ClawHub listelemesine geri bağlantı
verdiklerinde, hız sınırlarına uyduklarında ve onay ima etmekten kaçındıklarında
bu API’leri kullanabilir.

Bkz. [Public API](/clawhub/api) ve [HTTP API](/clawhub/http-api).

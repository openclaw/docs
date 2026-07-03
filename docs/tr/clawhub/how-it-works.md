---
read_when:
    - Listelemeleri, sürümleri, kurulumları, yayımlamayı ve moderasyonu anlama
summary: ClawHub listelemeleri, sürümleri, kurulumları, yayınlama, taramalar ve güncellemeler nasıl çalışır.
x-i18n:
    generated_at: "2026-07-03T01:02:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır

ClawHub, OpenClaw becerileri ve pluginleri için kayıt katmanıdır. Kullanıcılara
paketleri keşfedebilecekleri bir yer, yayıncılara sürümleri yayımlayabilecekleri
bir yer ve OpenClaw'a bu paketleri güvenle kurup güncellemek için yeterli
metadata sağlar.

## Kayıt kayıtları

Her herkese açık listeleme şunları içeren bir kayıt kaydıdır:

- bir sahip ve slug ya da paket adı
- bir veya daha fazla yayımlanmış sürüm
- metadata, özet, dosyalar ve kaynak atfı
- `latest` gibi değişiklik günlüğü ve etiket bilgileri
- indirme, kurulum ve yıldız sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir beceri veya pluginin ne yaptığını iddia
ettiğini kurmadan önce inceleyebileceği kanonik yerdir.

## Skills

Bir beceri, `SKILL.md` merkezli sürümlenmiş bir metin paketidir. Destekleyici
dosyalar, örnekler, şablonlar ve betikler içerebilir.

ClawHub, beceri adını, açıklamasını, gereksinimlerini, ortam değişkenlerini ve
metadatasını anlamak için `SKILL.md` frontmatter bölümünü okur. Doğru metadata
önemlidir, çünkü kullanıcıların beceriyi kurup kurmamaya karar vermesine
yardımcı olur ve otomatik taramaların beyan edilen davranış ile gözlenen
davranış arasındaki uyumsuzlukları algılamasına yardımcı olur.

Bkz. [Beceri biçimi](/tr/clawhub/skill-format).

## Pluginler

Pluginler, paketlenmiş OpenClaw uzantılarıdır. ClawHub paket metadatasını,
uyumluluk bilgilerini, kaynak bağlantılarını, artifactleri ve sürüm kayıtlarını
saklar.

OpenClaw, ClawHub'dan bir plugin kurduğunda kurulumdan önce ilan edilen
uyumluluk metadatasını denetler. Paket kayıtları API uyumluluğunu, minimum
gateway sürümünü, host hedeflerini, ortam gereksinimlerini ve artifact
özetlerini içerebilir.

Kayıt katmanının doğruluk kaynağı olmasını istediğinizde açık bir ClawHub kurulum
kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayımlama

Yayımlama, yeni bir değişmez sürüm kaydı oluşturur. Yayıncılar, kimliği
doğrulanmış kayıt iş akışları için `clawhub` CLI aracını kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenen payloadu önizlemek için dry run kullanın. Herkese açık
sayfalar daha sonra yayımlanan metadatayı, dosyaları, kaynak atfını ve tarama
durumunu gösterir.

## Kurulumlar ve güncellemeler

OpenClaw kurulum komutları ClawHub'ı paket kaynağı olarak kullanır:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw, güncellemelerin daha sonra aynı kayıt paketini çözebilmesi için
kurulum kaynağı metadatasını kaydeder. ClawHub CLI ayrıca tam bir OpenClaw çalışma
alanı dışında kayıt tarafından yönetilen beceri klasörleri isteyen kullanıcılar
için doğrudan beceri kurulum ve güncelleme iş akışlarını destekler.

## Güvenlik durumu

ClawHub yayımlamaya açıktır, ancak sürümler yine de yükleme geçitlerine, otomatik
kontrollere, kullanıcı bildirimlerine ve moderatör eylemine tabidir.

Herkese açık sayfalar, kullanılabilir olduğunda tarama özetlerini gösterir.
Tutulan, gizlenen veya engellenen içerikler, tanılama için sahibine görünür
kalmaya devam ederken herkese açık arama ve kurulum akışlarından kaybolabilir.

Bkz. [Güvenlik](/clawhub/security), [Güvenlik Denetimleri](/clawhub/security-audits),
[Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation) ve
[Kabul edilebilir kullanım](/clawhub/acceptable-usage).

## API erişimi

ClawHub keşif, arama, paket ayrıntıları ve indirmeler için herkese açık okuma
API'leri sunar. Üçüncü taraf kataloglar, kanonik ClawHub listelemesine geri
bağlantı verdiklerinde, hız sınırlarına uyduklarında ve onay ima etmekten
kaçındıklarında bu API'leri kullanabilir.

Bkz. [Herkese Açık API](/tr/clawhub/api) ve [HTTP API](/clawhub/http-api).

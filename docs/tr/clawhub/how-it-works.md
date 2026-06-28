---
read_when:
    - Listelemeleri, sürümleri, kurulumları, yayınlamayı ve moderasyonu anlama
summary: ClawHub listelemelerinin, sürümlerin, kurulumların, yayınlamanın, taramaların ve güncellemelerin nasıl çalıştığı.
x-i18n:
    generated_at: "2026-06-28T07:41:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır

ClawHub, OpenClaw becerileri ve pluginleri için kayıt katmanıdır. Kullanıcılara
paketleri keşfedecekleri bir yer, yayıncılara sürüm yayımlayacakları bir yer ve
OpenClaw’a bu paketleri güvenle yükleyip güncellemek için yeterli metadata sağlar.

## Kayıt kayıtları

Her herkese açık listeleme, şunları içeren bir kayıt kaydıdır:

- bir sahip ve slug veya paket adı
- bir veya daha fazla yayımlanmış sürüm
- metadata, özet, dosyalar ve kaynak atfı
- `latest` gibi changelog ve etiket bilgileri
- indirme, yükleme ve yıldız sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir becerinin veya pluginin yüklemeden önce
ne yaptığını iddia ettiğini inceleyebileceği kanonik yerdir.

## Skills

Bir beceri, `SKILL.md` merkezli sürümlenmiş bir metin paketidir. Destekleyici
dosyalar, örnekler, şablonlar ve betikler içerebilir.

ClawHub, beceri adını, açıklamasını, gereksinimlerini, ortam değişkenlerini ve
metadatasını anlamak için `SKILL.md` frontmatter bölümünü okur. Doğru metadata
önemlidir, çünkü kullanıcıların beceriyi yükleyip yüklememeye karar vermesine
yardımcı olur ve otomatik taramaların beyan edilen davranış ile gözlemlenen
davranış arasındaki uyumsuzlukları tespit etmesine yardımcı olur.

Bkz. [Beceri biçimi](/tr/clawhub/skill-format).

## Pluginler

Pluginler, paketlenmiş OpenClaw uzantılarıdır. ClawHub paket metadatasını,
uyumluluk bilgilerini, kaynak bağlantılarını, artifaktları ve sürüm kayıtlarını
saklar.

OpenClaw, ClawHub’dan bir plugin yüklediğinde, yüklemeden önce ilan edilen
uyumluluk metadatasını denetler. Paket kayıtları API uyumluluğu, minimum Gateway
sürümü, ana makine hedefleri, ortam gereksinimleri ve artifakt özetlerini
içerebilir.

Kayıt katmanının doğruluk kaynağı olmasını istediğinizde açık bir ClawHub yükleme
kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayımlama

Yayımlama, yeni ve değiştirilemez bir sürüm kaydı oluşturur. Yayıncılar kimliği
doğrulanmış kayıt iş akışları için `clawhub` CLI aracını kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenen yükü önizlemek için deneme çalıştırmalarını kullanın.
Herkese açık sayfalar daha sonra yayımlanan metadatayı, dosyaları, kaynak atfını
ve tarama durumunu gösterir.

## Yüklemeler ve güncellemeler

OpenClaw yükleme komutları ClawHub’ı paket kaynağı olarak kullanır:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw, güncellemelerin daha sonra aynı kayıt paketini çözümleyebilmesi için
yükleme kaynağı metadatasını kaydeder. ClawHub CLI, tam bir OpenClaw çalışma
alanı dışında kayıt tarafından yönetilen beceri klasörleri isteyen kullanıcılar
için doğrudan beceri yükleme ve güncelleme iş akışlarını da destekler.

## Güvenlik durumu

ClawHub yayımlamaya açıktır, ancak sürümler yine de yükleme kapılarına, otomatik
denetimlere, kullanıcı raporlarına ve moderatör eylemine tabidir.

Herkese açık sayfalar, mevcut olduğunda tarama özetlerini gösterir. Bekletilen,
gizlenen veya engellenen içerik, tanılama için sahibine görünür kalırken herkese
açık arama ve yükleme akışlarından kaybolabilir.

Bkz. [Güvenlik](/tr/clawhub/security), [Güvenlik Denetimleri](/tr/clawhub/security-audits),
[Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation) ve
[Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage).

## API erişimi

ClawHub keşif, arama, paket ayrıntıları ve indirmeler için herkese açık okuma
API’leri sunar. Üçüncü taraf kataloglar, kanonik ClawHub listelemesine geri
bağlantı verdiklerinde, hız sınırlarına uyduklarında ve onay anlamı çıkarmaktan
kaçındıklarında bu API’leri kullanabilir.

Bkz. [Herkese Açık API](/tr/clawhub/api) ve [HTTP API](/tr/clawhub/http-api).

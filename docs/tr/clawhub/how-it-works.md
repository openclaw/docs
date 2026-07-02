---
read_when:
    - Listelemeleri, sürümleri, kurulumları, yayımlamayı ve moderasyonu anlama
summary: ClawHub listelemelerinin, sürümlerin, kurulumların, yayımlamanın, taramaların ve güncellemelerin nasıl çalıştığı.
x-i18n:
    generated_at: "2026-07-02T01:10:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır?

ClawHub, OpenClaw skills ve plugins için kayıt katmanıdır. Kullanıcılara paketleri
keşfedebilecekleri bir yer, yayıncılara sürümleri yayınlayabilecekleri bir yer ve
OpenClaw’a bu paketleri güvenli şekilde yüklemek ve güncellemek için yeterli metadata sağlar.

## Kayıt kayıtları

Her herkese açık listeleme, şunları içeren bir kayıt kaydıdır:

- sahip ve slug ya da paket adı
- bir veya daha fazla yayınlanmış sürüm
- metadata, özet, dosyalar ve kaynak atfı
- `latest` gibi changelog ve etiket bilgileri
- indirme, yükleme ve yıldız sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir skill veya
plugin yüklemeden önce ne yaptığını iddia ettiğini incelemesi için kanonik yerdir.

## Skills

Bir skill, `SKILL.md` merkezli sürümlendirilmiş bir metin paketidir. Destekleyici
dosyalar, örnekler, şablonlar ve betikler içerebilir.

ClawHub, skill adını, açıklamasını, gereksinimlerini, ortam değişkenlerini ve
metadata’yı anlamak için `SKILL.md` frontmatter’ını okur. Doğru metadata önemlidir
çünkü kullanıcıların skill’i yükleyip yüklemeyeceklerine karar vermesine yardımcı olur ve
otomatik taramaların beyan edilen davranış ile gözlemlenen davranış arasındaki uyumsuzlukları tespit etmesine yardımcı olur.

Bkz. [Skill biçimi](/tr/clawhub/skill-format).

## Plugins

Plugins, paketlenmiş OpenClaw uzantılarıdır. ClawHub paket metadata’sını,
uyumluluk bilgilerini, kaynak bağlantılarını, artefaktları ve sürüm kayıtlarını saklar.

OpenClaw, ClawHub’dan bir plugin yüklediğinde, yüklemeden önce duyurulan uyumluluk
metadata’sını kontrol eder. Paket kayıtları API uyumluluğu,
minimum gateway sürümü, ana makine hedefleri, ortam gereksinimleri ve artefakt
özetlerini içerebilir.

Kayıt sisteminin doğruluk kaynağı olmasını istediğinizde açık bir ClawHub yükleme kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayınlama

Yayınlama, yeni bir değiştirilemez sürüm kaydı oluşturur. Yayıncılar, kimliği doğrulanmış kayıt iş akışları için `clawhub`
CLI kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenen payload’u önizlemek için dry run kullanın. Herkese açık sayfalar daha sonra
yayınlanmış metadata’yı, dosyaları, kaynak atfını ve tarama durumunu gösterir.

## Yüklemeler ve güncellemeler

OpenClaw yükleme komutları, paket kaynağı olarak ClawHub’ı kullanır:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw, güncellemelerin daha sonra aynı kayıt paketini çözümleyebilmesi için yükleme kaynağı metadata’sını kaydeder.
ClawHub CLI ayrıca, tam bir OpenClaw çalışma alanı dışında kayıt tarafından yönetilen skill klasörleri isteyen kullanıcılar için doğrudan skill yükleme ve
güncelleme iş akışlarını destekler.

## Güvenlik durumu

ClawHub yayınlamaya açıktır, ancak sürümler yine de yükleme kapılarına,
otomatik kontrollere, kullanıcı raporlarına ve moderatör eylemine tabidir.

Herkese açık sayfalar, mevcut olduğunda tarama özetlerini gösterir. Bekletilen, gizlenen
veya engellenen içerik, tanılama için sahibine görünür kalırken herkese açık arama ve yükleme akışlarından kaybolabilir.

Bkz. [Güvenlik](/clawhub/security), [Güvenlik Denetimleri](/clawhub/security-audits),
[Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation) ve
[Kabul edilebilir kullanım](/clawhub/acceptable-usage).

## API erişimi

ClawHub; keşif, arama, paket ayrıntıları ve
indirmeler için herkese açık okuma API’leri sunar. Üçüncü taraf kataloglar, kanonik ClawHub listelemesine geri bağlantı verdiklerinde,
hız sınırlarına uyduklarında ve onay anlamı ima etmekten kaçındıklarında bu API’leri kullanabilir.

Bkz. [Herkese Açık API](/clawhub/api) ve [HTTP API](/clawhub/http-api).

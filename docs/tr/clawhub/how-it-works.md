---
read_when:
    - Listelemeleri, sürümleri, kurulumları, yayımlamayı ve moderasyonu anlama
summary: ClawHub listelemelerinin, sürümlerinin, kurulumlarının, yayınlamanın, taramaların ve güncellemelerin nasıl çalıştığı.
x-i18n:
    generated_at: "2026-07-01T20:31:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır?

ClawHub, OpenClaw Skills ve Pluginleri için registry katmanıdır. Kullanıcılara
paketleri keşfedecek bir yer, yayıncılara sürüm yayınlayacak bir yer ve
OpenClaw'a bu paketleri güvenle yükleyip güncellemek için yeterli metadata
sağlar.

## Registry kayıtları

Her herkese açık listeleme şunları içeren bir registry kaydıdır:

- bir sahip ve slug ya da paket adı
- bir veya daha fazla yayımlanmış sürüm
- metadata, özet, dosyalar ve kaynak atfı
- `latest` gibi changelog ve etiket bilgileri
- indirme, yükleme ve yıldız sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir skill veya pluginin ne yaptığını iddia
ettiğini yüklemeden önce inceleyebilecekleri kanonik yerdir.

## Skills

Bir skill, `SKILL.md` merkezli sürümlenmiş bir metin paketidir. Destekleyici
dosyalar, örnekler, şablonlar ve betikler içerebilir.

ClawHub, skill adını, açıklamasını, gereksinimlerini, ortam değişkenlerini ve
metadatayı anlamak için `SKILL.md` frontmatter'ını okur. Doğru metadata
önemlidir çünkü kullanıcıların skill'i yükleyip yüklememeye karar vermesine
yardımcı olur ve otomatik taramaların beyan edilen davranış ile gözlemlenen
davranış arasındaki uyuşmazlıkları tespit etmesini sağlar.

Bkz. [Skill biçimi](/tr/clawhub/skill-format).

## Pluginler

Pluginler, paketlenmiş OpenClaw uzantılarıdır. ClawHub paket metadatasını,
uyumluluk bilgisini, kaynak bağlantılarını, artifactleri ve sürüm kayıtlarını
saklar.

OpenClaw, ClawHub'dan bir plugin yüklediğinde, yüklemeden önce duyurulan
uyumluluk metadatasını denetler. Paket kayıtları API uyumluluğu, minimum
gateway sürümü, ana makine hedefleri, ortam gereksinimleri ve artifact özetleri
içerebilir.

Registry'nin doğruluk kaynağı olmasını istediğinizde açık bir ClawHub yükleme
kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayınlama

Yayınlama, yeni ve değiştirilemez bir sürüm kaydı oluşturur. Yayıncılar,
kimliği doğrulanmış registry iş akışları için `clawhub` CLI'ını kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenen payload'u önizlemek için dry run kullanın. Herkese
açık sayfalar daha sonra yayımlanan metadatayı, dosyaları, kaynak atfını ve
tarama durumunu gösterir.

## Yüklemeler ve güncellemeler

OpenClaw yükleme komutları ClawHub'ı paket kaynağı olarak kullanır:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw, güncellemelerin daha sonra aynı registry paketini çözümleyebilmesi
için yükleme kaynağı metadatasını kaydeder. ClawHub CLI ayrıca, tam bir OpenClaw
çalışma alanı dışında registry tarafından yönetilen skill klasörleri isteyen
kullanıcılar için doğrudan skill yükleme ve güncelleme iş akışlarını destekler.

## Güvenlik durumu

ClawHub yayınlamaya açıktır, ancak yayınlar yine de yükleme kapılarına,
otomatik denetimlere, kullanıcı raporlarına ve moderatör işlemlerine tabidir.

Herkese açık sayfalar, mevcut olduğunda tarama özetlerini gösterir. Tutulan,
gizlenen veya engellenen içerik; tanılama için sahibine görünür kalırken herkese
açık arama ve yükleme akışlarından kaybolabilir.

Bkz. [Güvenlik](/clawhub/security), [Güvenlik Denetimleri](/clawhub/security-audits),
[Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation) ve
[Kabul edilebilir kullanım](/clawhub/acceptable-usage).

## API erişimi

ClawHub keşif, arama, paket ayrıntıları ve indirmeler için herkese açık okuma
API'leri sunar. Üçüncü taraf kataloglar, kanonik ClawHub listelemesine geri
bağlantı verdiklerinde, hız sınırlarına uyduklarında ve onay ima etmekten
kaçındıklarında bu API'leri kullanabilir.

Bkz. [Herkese Açık API](/tr/clawhub/api) ve [HTTP API](/clawhub/http-api).

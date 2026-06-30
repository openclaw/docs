---
read_when:
    - Listeleri, sürümleri, kurulumları, yayımlamayı ve moderasyonu anlama
summary: ClawHub listelemelerinin, sürümlerin, kurulumların, yayınlamanın, taramaların ve güncellemelerin nasıl çalıştığı.
x-i18n:
    generated_at: "2026-06-30T14:19:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır

ClawHub, OpenClaw Skills ve Plugin'leri için kayıt katmanıdır. Kullanıcılara
paketleri keşfedebilecekleri bir yer, yayıncılara sürüm yayınlayabilecekleri
bir yer sağlar ve OpenClaw'a bu paketleri güvenli şekilde yüklemek ve güncellemek
için yeterli metadata verir.

## Kayıt deposu kayıtları

Her herkese açık listeleme şunları içeren bir kayıt deposu kaydıdır:

- sahip ve slug veya paket adı
- bir veya daha fazla yayınlanmış sürüm
- metadata, özet, dosyalar ve kaynak atfı
- `latest` gibi changelog ve etiket bilgileri
- indirme, yükleme ve yıldız sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir skill veya Plugin'in ne yaptığını iddia
ettiğini yüklemeden önce inceleyebileceği kanonik yerdir.

## Skills

Bir skill, merkezinde `SKILL.md` bulunan sürümlenmiş bir metin paketidir.
Destekleyici dosyalar, örnekler, şablonlar ve betikler içerebilir.

ClawHub, skill adını, açıklamasını, gereksinimlerini, ortam değişkenlerini ve
metadata bilgilerini anlamak için `SKILL.md` frontmatter'ını okur. Doğru
metadata önemlidir; çünkü kullanıcıların skill'i yükleyip yüklememeye karar
vermesine yardımcı olur ve otomatik taramaların bildirilen davranış ile
gözlemlenen davranış arasındaki uyumsuzlukları algılamasını sağlar.

Bkz. [Skill biçimi](/tr/clawhub/skill-format).

## Plugin'ler

Plugin'ler paketlenmiş OpenClaw uzantılarıdır. ClawHub paket metadata'sını,
uyumluluk bilgilerini, kaynak bağlantılarını, artifact'leri ve sürüm kayıtlarını
saklar.

OpenClaw, ClawHub'dan bir Plugin yüklediğinde, yüklemeden önce duyurulan
uyumluluk metadata'sını kontrol eder. Paket kayıtları API uyumluluğu, minimum
gateway sürümü, host hedefleri, ortam gereksinimleri ve artifact digest'leri
içerebilir.

Kayıt deposunun doğruluk kaynağı olmasını istediğinizde açık bir ClawHub yükleme
kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayınlama

Yayınlama, yeni ve değiştirilemez bir sürüm kaydı oluşturur. Yayıncılar,
kimliği doğrulanmış kayıt deposu iş akışları için `clawhub` CLI'sini kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenen yükü önizlemek için kuru çalıştırmaları kullanın.
Herkese açık sayfalar ardından yayınlanan metadata'yı, dosyaları, kaynak atfını
ve tarama durumunu gösterir.

## Yüklemeler ve güncellemeler

OpenClaw yükleme komutları, ClawHub'ı paket kaynağı olarak kullanır:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw, güncellemelerin daha sonra aynı kayıt deposu paketini çözebilmesi için
yükleme kaynağı metadata'sını kaydeder. ClawHub CLI ayrıca tam bir OpenClaw
çalışma alanı dışında kayıt deposu tarafından yönetilen skill klasörleri isteyen
kullanıcılar için doğrudan skill yükleme ve güncelleme iş akışlarını destekler.

## Güvenlik durumu

ClawHub yayınlamaya açıktır, ancak yayınlar yine de yükleme kapılarına,
otomatik kontrollere, kullanıcı raporlarına ve moderatör işlemlerine tabidir.

Herkese açık sayfalar, mevcut olduğunda tarama özetlerini gösterir. Tutulan,
gizlenen veya engellenen içerik; tanılama için sahibine görünür kalırken herkese
açık arama ve yükleme akışlarından kaybolabilir.

Bkz. [Güvenlik](/clawhub/security), [Güvenlik Denetimleri](/clawhub/security-audits),
[Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation) ve
[Kabul edilebilir kullanım](/clawhub/acceptable-usage).

## API erişimi

ClawHub; keşif, arama, paket ayrıntıları ve indirmeler için herkese açık okuma
API'leri sunar. Üçüncü taraf kataloglar, kanonik ClawHub listelemesine geri
bağlantı verdiklerinde, hız sınırlarına uyduklarında ve onay ima etmekten
kaçındıklarında bu API'leri kullanabilir.

Bkz. [Herkese Açık API](/clawhub/api) ve [HTTP API](/clawhub/http-api).

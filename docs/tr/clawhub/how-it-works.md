---
read_when:
    - Listelemeleri, sürümleri, kurulumları, yayımlamayı ve moderasyonu anlama
summary: ClawHub listelemelerinin, sürümlerin, kurulumların, yayınlamanın, taramaların ve güncellemelerin nasıl çalıştığı.
x-i18n:
    generated_at: "2026-07-03T09:52:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır

ClawHub, OpenClaw Skills ve Plugin'leri için kayıt katmanıdır. Kullanıcılara
paketleri keşfedebilecekleri bir yer, yayıncılara sürüm yayınlayabilecekleri bir
yer ve OpenClaw'a bu paketleri güvenli şekilde yükleyip güncellemek için yeterli
meta veri sağlar.

## Kayıt girdileri

Her herkese açık listeleme şunları içeren bir kayıt girdisidir:

- sahip ve slug ya da paket adı
- bir veya daha fazla yayınlanmış sürüm
- meta veri, özet, dosyalar ve kaynak atfı
- `latest` gibi değişiklik günlüğü ve etiket bilgileri
- indirme, yükleme ve yıldız sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir Skills veya Plugin'in yüklemeden önce ne
yapmayı iddia ettiğini inceleyebileceği kanonik yerdir.

## Skills

Skills, `SKILL.md` merkezli, sürümlenmiş bir metin paketidir. Destekleyici
dosyalar, örnekler, şablonlar ve betikler içerebilir.

ClawHub, Skills adını, açıklamasını, gereksinimlerini, ortam değişkenlerini ve
meta verilerini anlamak için `SKILL.md` frontmatter'ını okur. Doğru meta veri
önemlidir; çünkü kullanıcıların Skills'i yükleyip yüklememeye karar vermesine
yardımcı olur ve otomatik taramaların bildirilen davranış ile gözlemlenen
davranış arasındaki uyumsuzlukları algılamasını sağlar.

Bkz. [Skills biçimi](/tr/clawhub/skill-format).

## Plugin'ler

Plugin'ler, paketlenmiş OpenClaw uzantılarıdır. ClawHub paket meta verilerini,
uyumluluk bilgilerini, kaynak bağlantılarını, yapıtları ve sürüm kayıtlarını
saklar.

OpenClaw, ClawHub'dan bir Plugin yüklediğinde, yüklemeden önce duyurulan
uyumluluk meta verilerini kontrol eder. Paket kayıtları API uyumluluğu, minimum
Gateway sürümü, ana makine hedefleri, ortam gereksinimleri ve yapıt özetleri
içerebilir.

Kayıt defterinin doğruluk kaynağı olmasını istediğinizde açık bir ClawHub
yükleme kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayınlama

Yayınlama, yeni bir değiştirilemez sürüm kaydı oluşturur. Yayıncılar, kimliği
doğrulanmış kayıt iş akışları için `clawhub` CLI'ını kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenen yükü önizlemek için deneme çalıştırmaları kullanın.
Herkese açık sayfalar daha sonra yayınlanan meta verileri, dosyaları, kaynak
atfını ve tarama durumunu gösterir.

## Yüklemeler ve güncellemeler

OpenClaw yükleme komutları ClawHub'ı paket kaynağı olarak kullanır:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw, güncellemelerin aynı kayıt paketini daha sonra çözebilmesi için
yükleme kaynağı meta verilerini kaydeder. ClawHub CLI, tam bir OpenClaw çalışma
alanının dışında kayıt tarafından yönetilen Skills klasörleri isteyen
kullanıcılar için doğrudan Skills yükleme ve güncelleme iş akışlarını da
destekler.

## Güvenlik durumu

ClawHub yayınlamaya açıktır, ancak yayınlar yine de yükleme kapılarına, otomatik
kontrollere, kullanıcı raporlarına ve moderatör eylemine tabidir.

Herkese açık sayfalar, mevcut olduğunda tarama özetlerini gösterir. Tutulan,
gizlenen veya engellenen içerik; tanılama için sahibine görünür kalırken herkese
açık arama ve yükleme akışlarından kaybolabilir.

Bkz. [Güvenlik](/clawhub/security), [Güvenlik Denetimleri](/clawhub/security-audits),
[Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation) ve
[Kabul edilebilir kullanım](/clawhub/acceptable-usage).

## API erişimi

ClawHub; keşif, arama, paket ayrıntıları ve indirmeler için herkese açık okuma
API'leri sunar. Üçüncü taraf kataloglar, kanonik ClawHub listelemesine geri
bağlantı verdikleri, hız sınırlarına uydukları ve onay anlamı çıkarmaktan
kaçındıkları sürece bu API'leri kullanabilir.

Bkz. [Herkese Açık API](/clawhub/api) ve [HTTP API](/clawhub/http-api).

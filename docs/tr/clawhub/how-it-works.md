---
read_when:
    - Listelemeleri, sürümleri, kurulumları, yayımlamayı ve moderasyonu anlama
summary: ClawHub listelemeleri, sürümleri, kurulumları, yayımlama işlemi, taramaları ve güncellemeleri nasıl çalışır.
x-i18n:
    generated_at: "2026-05-11T20:23:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4b995124c07d598a60897fa79fb61c4250a28f47d93d3bd62949f3a3364072e
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır

ClawHub, OpenClaw Skills ve Plugin’leri için kayıt katmanıdır. Kullanıcılara
paketleri keşfedecekleri bir yer, yayıncılara sürümleri yayımlayacakları bir yer
ve OpenClaw’a bu paketleri güvenle yükleyip güncellemek için yeterli meta veri
sağlar.

## Kayıt kayıtları

Her herkese açık listeleme şunları içeren bir kayıt kaydıdır:

- sahip ve slug ya da paket adı
- bir veya daha fazla yayımlanmış sürüm
- meta veriler, özet, dosyalar ve kaynak atfı
- `latest` gibi değişiklik günlüğü ve etiket bilgileri
- indirme, yükleme, yıldız ve yorum sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir skill’in veya
Plugin’in yüklemeden önce ne yaptığını iddia ettiğini incelemesi için kanonik yerdir.

## Skills

Skill, `SKILL.md` merkezli, sürümlenmiş bir metin paketidir. Destekleyici
dosyalar, örnekler, şablonlar ve betikler içerebilir.

ClawHub, skill adını, açıklamasını, gereksinimlerini, ortam değişkenlerini ve
meta verilerini anlamak için `SKILL.md` frontmatter’ını okur. Doğru
meta veriler önemlidir; çünkü kullanıcıların skill’i yükleyip yüklememeye karar
vermesine yardımcı olur ve otomatik taramaların bildirilen davranış ile gözlenen
davranış arasındaki uyumsuzlukları algılamasına yardım eder.

Bkz. [Skill biçimi](/tr/clawhub/skill-format).

## Plugin’ler

Plugin’ler paketlenmiş OpenClaw uzantılarıdır. ClawHub paket meta verilerini,
uyumluluk bilgilerini, kaynak bağlantılarını, yapıtları ve sürüm kayıtlarını saklar.

OpenClaw, ClawHub’dan bir Plugin yüklediğinde yüklemeden önce duyurulan uyumluluk
meta verilerini kontrol eder. Paket kayıtları API uyumluluğu, minimum Gateway
sürümü, host hedefleri, ortam gereksinimleri ve yapıt özetlerini içerebilir.

Kayıt sisteminin doğruluk kaynağı olmasını istediğinizde açık bir ClawHub yükleme
kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayınlama

Yayınlama, yeni ve değiştirilemez bir sürüm kaydı oluşturur. Yayıncılar kimliği
doğrulanmış kayıt iş akışları için `clawhub` CLI’sini kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenen yükü önizlemek için deneme çalıştırmalarını kullanın.
Ardından herkese açık sayfalar yayımlanan meta verileri, dosyaları, kaynak atfını
ve tarama durumunu gösterir.

## Yüklemeler ve güncellemeler

OpenClaw yükleme komutları, ClawHub’ı paket kaynağı olarak kullanır:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw, güncellemelerin daha sonra aynı kayıt paketini çözebilmesi için yükleme
kaynağı meta verilerini kaydeder. ClawHub CLI ayrıca, tam bir OpenClaw çalışma
alanı dışında kayıt tarafından yönetilen skill klasörleri isteyen kullanıcılar
için doğrudan skill yükleme ve güncelleme iş akışlarını destekler.

## Güvenlik durumu

ClawHub yayınlamaya açıktır, ancak sürümler yine de yükleme kapılarına, otomatik
kontrollere, kullanıcı raporlarına ve moderatör işlemlerine tabidir.

Herkese açık sayfalar, mevcut olduğunda tarama özetlerini gösterir. Bekletilen,
gizlenen veya engellenen içerikler; tanılama ya da itiraz için sahibine görünür
kalmaya devam ederken herkese açık arama ve yükleme akışlarından kaybolabilir.

Bkz. [Güvenlik + moderasyon](/tr/clawhub/security) ve
[Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage).

## API erişimi

ClawHub keşif, arama, paket ayrıntıları ve indirmeler için herkese açık okuma
API’leri sunar. Üçüncü taraf kataloglar, kanonik ClawHub listelemesine geri
bağlantı verdiklerinde, hız sınırlarına uyduklarında ve onaylandıkları izlenimi
vermekten kaçındıklarında bu API’leri kullanabilir.

Bkz. [Herkese Açık API](/tr/clawhub/api) ve [HTTP API](/tr/clawhub/http-api).

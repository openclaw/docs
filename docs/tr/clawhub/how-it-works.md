---
read_when:
    - Listelemeleri, sürümleri, kurulumları, yayımlamayı ve moderasyonu anlamak
summary: ClawHub listelemeleri, sürümleri, kurulumları, yayımlama, taramalar ve güncellemeler nasıl çalışır.
x-i18n:
    generated_at: "2026-05-12T00:56:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır

ClawHub, OpenClaw Skills ve Plugin'leri için kayıt katmanıdır. Kullanıcılara
paketleri keşfedecek bir yer, yayıncılara sürümleri yayımlayacak bir yer ve
OpenClaw'a bu paketleri güvenle yükleyip güncellemek için yeterli üst veri sağlar.

## Kayıt kayıtları

Her herkese açık listeleme şunları içeren bir kayıt kaydıdır:

- sahip ve slug veya paket adı
- bir veya daha fazla yayımlanmış sürüm
- üst veri, özet, dosyalar ve kaynak atfı
- `latest` gibi değişiklik günlüğü ve etiket bilgileri
- indirme, yükleme, yıldız ve yorum sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir Skill veya Plugin'in yüklenmeden önce ne
yaptığını iddia ettiğini incelemesi için kanonik yerdir.

## Skills

Skill, `SKILL.md` merkezli, sürümlendirilmiş bir metin paketidir. Destekleyici
dosyalar, örnekler, şablonlar ve betikler içerebilir.

ClawHub, Skill adını, açıklamasını, gereksinimlerini, ortam değişkenlerini ve üst
verilerini anlamak için `SKILL.md` frontmatter bölümünü okur. Doğru üst veri
önemlidir; çünkü kullanıcıların Skill'i yükleyip yüklememeye karar vermesine
yardımcı olur ve otomatik taramaların bildirilen davranış ile gözlemlenen
davranış arasındaki uyumsuzlukları algılamasını sağlar.

Bkz. [Skill biçimi](/tr/clawhub/skill-format).

## Plugin'ler

Plugin'ler, paketlenmiş OpenClaw uzantılarıdır. ClawHub paket üst verilerini,
uyumluluk bilgilerini, kaynak bağlantılarını, yapıtları ve sürüm kayıtlarını
saklar.

OpenClaw, ClawHub'dan bir Plugin yüklediğinde, yüklemeden önce duyurulan
uyumluluk üst verilerini denetler. Paket kayıtları API uyumluluğu, minimum
Gateway sürümü, ana makine hedefleri, ortam gereksinimleri ve yapıt özetleri
içerebilir.

Kayıt katmanının doğruluk kaynağı olmasını istediğinizde açık bir ClawHub yükleme
kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayınlama

Yayınlama, yeni bir değiştirilemez sürüm kaydı oluşturur. Yayıncılar, kimliği
doğrulanmış kayıt iş akışları için `clawhub` CLI kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenen yükü önizlemek için kuru çalıştırmaları kullanın.
Ardından herkese açık sayfalar yayımlanan üst verileri, dosyaları, kaynak atfını
ve tarama durumunu gösterir.

## Yüklemeler ve güncellemeler

OpenClaw yükleme komutları, ClawHub'ı paket kaynağı olarak kullanır:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw, güncellemelerin daha sonra aynı kayıt paketini çözümleyebilmesi için
yükleme kaynağı üst verilerini kaydeder. ClawHub CLI, tam bir OpenClaw çalışma
alanı dışında kayıt tarafından yönetilen Skill klasörleri isteyen kullanıcılar
için doğrudan Skill yükleme ve güncelleme iş akışlarını da destekler.

## Güvenlik durumu

ClawHub yayınlamaya açıktır, ancak sürümler yine de yükleme geçitlerine,
otomatik denetimlere, kullanıcı raporlarına ve moderatör eylemlerine tabidir.

Herkese açık sayfalar, mevcut olduğunda tarama özetlerini gösterir. Bekletilen,
gizlenen veya engellenen içerik, tanılama için sahibine görünür kalırken herkese
açık arama ve yükleme akışlarından kaybolabilir.

Bkz. [Güvenlik + moderasyon](/tr/clawhub/security) ve
[Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage).

## API erişimi

ClawHub; keşif, arama, paket ayrıntıları ve indirmeler için herkese açık okuma
API'leri sunar. Üçüncü taraf kataloglar, kanonik ClawHub listelemesine geri
bağlantı verdikleri, hız sınırlarına uydukları ve onay ima etmekten kaçındıkları
sürece bu API'leri kullanabilir.

Bkz. [Herkese Açık API](/tr/clawhub/api) ve [HTTP API](/tr/clawhub/http-api).

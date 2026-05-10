---
read_when:
    - Listelemeleri, sürümleri, kurulumları, yayımlamayı ve moderasyonu anlama
summary: ClawHub listelemelerinin, sürümlerin, kurulumların, yayımlamanın, taramaların ve güncellemelerin nasıl çalıştığı.
x-i18n:
    generated_at: "2026-05-10T19:25:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4b995124c07d598a60897fa79fb61c4250a28f47d93d3bd62949f3a3364072e
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır

ClawHub, OpenClaw Skills ve plugin'leri için kayıt katmanıdır. Kullanıcılara
paketleri keşfedecekleri bir yer, yayıncılara sürüm yayınlayacakları bir yer
sağlar ve OpenClaw'a bu paketleri güvenli şekilde yükleyip güncellemek için
yeterli metadata verir.

## Kayıt kayıtları

Her herkese açık listeleme şunları içeren bir kayıt kaydıdır:

- bir sahip ve slug veya paket adı
- bir veya daha fazla yayınlanmış sürüm
- metadata, özet, dosyalar ve kaynak atfı
- changelog ve `latest` gibi etiket bilgileri
- indirme, yükleme, yıldız ve yorum sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir skill veya plugin'in ne yaptığını iddia
ettiğini yüklemeden önce inceleyebileceği kanonik yerdir.

## Skills

Bir skill, `SKILL.md` merkezli sürümlenmiş bir metin paketidir. Destekleyici
dosyalar, örnekler, şablonlar ve betikler içerebilir.

ClawHub, skill adını, açıklamasını, gereksinimlerini, ortam değişkenlerini ve
metadata'sını anlamak için `SKILL.md` frontmatter'ını okur. Doğru metadata
önemlidir çünkü kullanıcıların skill'i yükleyip yüklemeyeceklerine karar
vermesine yardımcı olur ve otomatik taramaların beyan edilen davranış ile
gözlenen davranış arasındaki uyumsuzlukları tespit etmesine yardımcı olur.

Bkz. [Skill formatı](/tr/clawhub/skill-format).

## Plugin'ler

Plugin'ler, paketlenmiş OpenClaw uzantılarıdır. ClawHub paket metadata'sını,
uyumluluk bilgilerini, kaynak bağlantılarını, artifact'leri ve sürüm kayıtlarını
saklar.

OpenClaw, ClawHub'dan bir plugin yüklediğinde, yüklemeden önce duyurulan
uyumluluk metadata'sını kontrol eder. Paket kayıtları API uyumluluğu, minimum
gateway sürümü, host hedefleri, ortam gereksinimleri ve artifact digest'leri
içerebilir.

Kayıt defterinin doğruluk kaynağı olmasını istediğinizde açık bir ClawHub
yükleme kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayınlama

Yayınlama, yeni ve değişmez bir sürüm kaydı oluşturur. Yayıncılar kimliği
doğrulanmış kayıt iş akışları için `clawhub` CLI'ını kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenmiş payload'ı önizlemek için dry run'ları kullanın.
Ardından herkese açık sayfalar yayınlanmış metadata'yı, dosyaları, kaynak atfını
ve tarama durumunu gösterir.

## Yüklemeler ve güncellemeler

OpenClaw yükleme komutları ClawHub'ı paket kaynağı olarak kullanır:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw, güncellemelerin daha sonra aynı kayıt paketini çözümleyebilmesi için
yükleme kaynağı metadata'sını kaydeder. ClawHub CLI, tam bir OpenClaw çalışma
alanı dışında kayıt tarafından yönetilen skill klasörleri isteyen kullanıcılar
için doğrudan skill yükleme ve güncelleme iş akışlarını da destekler.

## Güvenlik durumu

ClawHub yayınlamaya açıktır, ancak sürümler yine de yükleme kapılarına,
otomatik kontrollere, kullanıcı raporlarına ve moderatör eylemlerine tabidir.

Herkese açık sayfalar, mevcut olduğunda tarama özetlerini gösterir. Bekletilen,
gizlenen veya engellenen içerik; tanılama ya da itiraz için sahibine görünür
kalmaya devam ederken herkese açık arama ve yükleme akışlarından kaybolabilir.

Bkz. [Güvenlik + moderasyon](/tr/clawhub/security) ve
[Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage).

## API erişimi

ClawHub keşif, arama, paket ayrıntıları ve indirmeler için herkese açık okuma
API'leri sunar. Üçüncü taraf kataloglar, kanonik ClawHub listelemesine geri
bağlantı verdiklerinde, rate limit'lere uyduklarında ve onay izlenimi
yaratmaktan kaçındıklarında bu API'leri kullanabilir.

Bkz. [Herkese açık API](/tr/clawhub/api) ve [HTTP API](/tr/clawhub/http-api).

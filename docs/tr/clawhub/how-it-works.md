---
read_when:
    - Listelemeleri, sürümleri, kurulumları, yayımlamayı ve moderasyonu anlama
summary: ClawHub listelemelerinin, sürümlerin, kurulumların, yayımlamanın, taramaların ve güncellemelerin nasıl çalıştığı.
x-i18n:
    generated_at: "2026-05-12T08:44:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır

ClawHub, OpenClaw Skills ve plugin'leri için kayıt katmanıdır. Kullanıcılara
paketleri keşfedebilecekleri, yayıncılara sürümleri yayımlayabilecekleri bir yer
sağlar ve OpenClaw'a bu paketleri güvenle yükleyip güncellemek için yeterli
metadata verir.

## Kayıt girdileri

Her herkese açık listeleme, şunları içeren bir kayıt girdisidir:

- sahip ve slug ya da paket adı
- yayımlanmış bir veya daha fazla sürüm
- metadata, özet, dosyalar ve kaynak atfı
- `latest` gibi değişiklik günlüğü ve etiket bilgileri
- indirme, yükleme, yıldız ve yorum sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir skill'in veya plugin'in yüklemeden önce
ne yaptığını iddia ettiğini inceleyebileceği kanonik yerdir.

## Skills

Skill, `SKILL.md` merkezli, sürümlenmiş bir metin paketidir. Destekleyici
dosyalar, örnekler, şablonlar ve betikler içerebilir.

ClawHub, skill adını, açıklamasını, gereksinimlerini, ortam değişkenlerini ve
metadata'yı anlamak için `SKILL.md` frontmatter'ını okur. Doğru metadata
önemlidir çünkü kullanıcıların skill'i yükleyip yüklememeye karar vermesine
yardımcı olur ve otomatik taramaların bildirilen davranış ile gözlemlenen
davranış arasındaki uyumsuzlukları algılamasına yardımcı olur.

Bkz. [Skill biçimi](/tr/clawhub/skill-format).

## Plugin'ler

Plugin'ler paketlenmiş OpenClaw uzantılarıdır. ClawHub paket metadata'sını,
uyumluluk bilgilerini, kaynak bağlantılarını, artifact'leri ve sürüm kayıtlarını
saklar.

OpenClaw, ClawHub'dan bir plugin yüklediğinde, yüklemeden önce duyurulan
uyumluluk metadata'sını denetler. Paket kayıtları API uyumluluğu, minimum
gateway sürümü, host hedefleri, ortam gereksinimleri ve artifact digest'leri
içerebilir.

Kayıt defterinin doğruluk kaynağı olmasını istediğinizde açık bir ClawHub
yükleme kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayımlama

Yayımlama, yeni ve değiştirilemez bir sürüm kaydı oluşturur. Yayıncılar,
kimliği doğrulanmış kayıt defteri iş akışları için `clawhub` CLI'sini kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenen payload'u önizlemek için dry run'ları kullanın.
Ardından herkese açık sayfalar yayımlanan metadata'yı, dosyaları, kaynak atfını
ve tarama durumunu gösterir.

## Yüklemeler ve güncellemeler

OpenClaw yükleme komutları, ClawHub'ı paket kaynağı olarak kullanır:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw yükleme kaynağı metadata'sını kaydeder; böylece güncellemeler daha
sonra aynı kayıt defteri paketini çözebilir. ClawHub CLI, tam bir OpenClaw
çalışma alanı dışında, kayıt defteri tarafından yönetilen skill klasörleri
isteyen kullanıcılar için doğrudan skill yükleme ve güncelleme iş akışlarını da
destekler.

## Güvenlik durumu

ClawHub yayımlamaya açıktır, ancak sürümler yine de yükleme kapılarına, otomatik
denetimlere, kullanıcı raporlarına ve moderatör eylemlerine tabidir.

Herkese açık sayfalar, mevcut olduğunda tarama özetlerini gösterir. Beklemeye
alınan, gizlenen veya engellenen içerik, tanılama için sahibine görünür kalırken
herkese açık arama ve yükleme akışlarından kaybolabilir.

Bkz. [Güvenlik + moderasyon](/tr/clawhub/security) ve
[Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage).

## API erişimi

ClawHub keşif, arama, paket ayrıntıları ve indirmeler için herkese açık okuma
API'leri sunar. Üçüncü taraf kataloglar, kanonik ClawHub listelemesine bağlantı
verdiklerinde, hız sınırlarına uyduklarında ve onay ima etmekten kaçındıklarında
bu API'leri kullanabilir.

Bkz. [Herkese açık API](/tr/clawhub/api) ve [HTTP API](/tr/clawhub/http-api).

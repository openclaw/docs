---
read_when:
    - Listelemeleri, sürümleri, kurulumları, yayınlamayı ve moderasyonu anlama
summary: ClawHub listelemeleri, sürümleri, kurulumları, yayımlama, taramalar ve güncellemeler nasıl çalışır.
x-i18n:
    generated_at: "2026-05-12T04:09:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır

ClawHub, OpenClaw Skills ve plugin'leri için kayıt katmanıdır. Kullanıcılara
paketleri keşfedebilecekleri bir yer, yayıncılara sürüm yayımlayabilecekleri bir
yer ve OpenClaw'a bu paketleri güvenli şekilde yükleyip güncellemek için yeterli
metadata sağlar.

## Kayıt kayıtları

Her herkese açık listeleme, şunları içeren bir kayıt kaydıdır:

- bir sahip ve slug veya paket adı
- bir veya daha fazla yayımlanmış sürüm
- metadata, özet, dosyalar ve kaynak atfı
- `latest` gibi changelog ve etiket bilgileri
- indirme, yükleme, yıldız ve yorum sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir skill veya plugin'in yüklemeden önce ne
yapmayı iddia ettiğini incelemesi için kanonik yerdir.

## Skills

Bir skill, `SKILL.md` merkezli sürümlenmiş bir metin paketidir. Destekleyici
dosyalar, örnekler, şablonlar ve betikler içerebilir.

ClawHub, skill adını, açıklamasını, gereksinimlerini, environment variable'larını
ve metadata'sını anlamak için `SKILL.md` frontmatter'ını okur. Doğru metadata
önemlidir; çünkü kullanıcıların skill'i yükleyip yüklememeye karar vermesine
yardımcı olur ve otomatik taramaların bildirilen davranış ile gözlemlenen
davranış arasındaki uyumsuzlukları algılamasını sağlar.

Bkz. [Skill biçimi](/tr/clawhub/skill-format).

## Plugin'ler

Plugin'ler, paketlenmiş OpenClaw uzantılarıdır. ClawHub paket metadata'sını,
uyumluluk bilgilerini, kaynak bağlantılarını, artifact'leri ve sürüm kayıtlarını
saklar.

OpenClaw, ClawHub'dan bir plugin yüklediğinde, yüklemeden önce ilan edilen
uyumluluk metadata'sını denetler. Paket kayıtları API uyumluluğu, minimum gateway
sürümü, host hedefleri, ortam gereksinimleri ve artifact digest'leri içerebilir.

Kayıt defterinin doğruluk kaynağı olmasını istediğinizde açık bir ClawHub yükleme
kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayımlama

Yayımlama, yeni ve değiştirilemez bir sürüm kaydı oluşturur. Yayıncılar,
kimlik doğrulamalı kayıt iş akışları için `clawhub` CLI'sini kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenmiş payload'u önizlemek için kuru çalıştırmaları kullanın.
Ardından herkese açık sayfalar yayımlanan metadata'yı, dosyaları, kaynak atfını
ve tarama durumunu gösterir.

## Yüklemeler ve güncellemeler

OpenClaw yükleme komutları, ClawHub'ı paket kaynağı olarak kullanır:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw, güncellemelerin daha sonra aynı kayıt paketini çözümleyebilmesi için
yükleme kaynağı metadata'sını kaydeder. ClawHub CLI, tam bir OpenClaw çalışma
alanı dışında kayıt tarafından yönetilen skill klasörleri isteyen kullanıcılar
için doğrudan skill yükleme ve güncelleme iş akışlarını da destekler.

## Güvenlik durumu

ClawHub yayımlamaya açıktır, ancak sürümler yine de yükleme kapılarına, otomatik
denetimlere, kullanıcı raporlarına ve moderatör eylemlerine tabidir.

Herkese açık sayfalar, kullanılabilir olduğunda tarama özetlerini gösterir.
Bekletilen, gizlenen veya engellenen içerik, tanılama için sahibine görünür
kalmaya devam ederken herkese açık arama ve yükleme akışlarından kaybolabilir.

Bkz. [Güvenlik + moderasyon](/tr/clawhub/security) ve
[Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage).

## API erişimi

ClawHub; keşif, arama, paket ayrıntıları ve indirmeler için herkese açık okuma
API'leri sunar. Üçüncü taraf kataloglar, kanonik ClawHub listelemesine geri
bağlantı verdiklerinde, rate limit'lere uyduklarında ve onay ima etmekten
kaçındıklarında bu API'leri kullanabilir.

Bkz. [Public API](/tr/clawhub/api) ve [HTTP API](/tr/clawhub/http-api).

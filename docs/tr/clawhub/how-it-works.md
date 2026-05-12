---
read_when:
    - Listelemeleri, sürümleri, kurulumları, yayınlamayı ve moderasyonu anlama
summary: ClawHub listelemelerinin, sürümlerinin, kurulumlarının, yayımlama işleminin, taramalarının ve güncellemelerinin nasıl çalıştığı.
x-i18n:
    generated_at: "2026-05-12T23:28:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır

ClawHub, OpenClaw Skills ve Plugin'leri için kayıt katmanıdır. Kullanıcılara
paketleri keşfedebilecekleri bir yer, yayıncılara sürümleri yayımlayabilecekleri
bir yer ve OpenClaw'a bu paketleri güvenli şekilde kurup güncellemek için yeterli
metadata sağlar.

## Kayıt girdileri

Her herkese açık listeleme şunları içeren bir kayıt girdisidir:

- sahip ve slug veya paket adı
- bir veya daha fazla yayımlanmış sürüm
- metadata, özet, dosyalar ve kaynak atfı
- changelog ve `latest` gibi etiket bilgileri
- indirme, kurulum, yıldız ve yorum sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir Skills veya Plugin'in ne yaptığını iddia
ettiğini kurulumdan önce inceleyebilecekleri kanonik yerdir.

## Skills

Bir Skills, `SKILL.md` etrafında şekillenen sürümlü bir metin paketidir.
Destekleyici dosyalar, örnekler, şablonlar ve betikler içerebilir.

ClawHub, Skills adını, açıklamasını, gereksinimlerini, ortam değişkenlerini ve
metadata bilgilerini anlamak için `SKILL.md` frontmatter'ını okur. Doğru metadata
önemlidir, çünkü kullanıcıların Skills'i kurup kurmamaya karar vermesine yardımcı
olur ve otomatik taramaların beyan edilen davranış ile gözlemlenen davranış
arasındaki uyumsuzlukları algılamasını sağlar.

Bkz. [Skills biçimi](/tr/clawhub/skill-format).

## Plugin'ler

Plugin'ler, paketlenmiş OpenClaw eklentileridir. ClawHub paket metadata'sını,
uyumluluk bilgilerini, kaynak bağlantılarını, artifact'leri ve sürüm kayıtlarını
saklar.

OpenClaw, ClawHub'dan bir Plugin kurduğunda kurulumdan önce ilan edilen uyumluluk
metadata'sını denetler. Paket kayıtları API uyumluluğu, minimum Gateway sürümü,
host hedefleri, ortam gereksinimleri ve artifact digest'leri içerebilir.

Kayıt katmanının doğruluk kaynağı olmasını istediğinizde açık bir ClawHub kurulum
kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayınlama

Yayınlama, yeni ve değiştirilemez bir sürüm kaydı oluşturur. Yayıncılar,
kimlik doğrulamalı kayıt iş akışları için `clawhub` CLI'ını kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenen payload'u önizlemek için dry run'ları kullanın.
Ardından herkese açık sayfalar yayımlanan metadata'yı, dosyaları, kaynak atfını
ve tarama durumunu gösterir.

## Kurulumlar ve güncellemeler

OpenClaw kurulum komutları, ClawHub'ı paket kaynağı olarak kullanır:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw, güncellemelerin daha sonra aynı kayıt paketini çözümleyebilmesi için
kurulum kaynağı metadata'sını kaydeder. ClawHub CLI, tam bir OpenClaw çalışma
alanı dışında kayıt tarafından yönetilen Skills klasörleri isteyen kullanıcılar
için doğrudan Skills kurulum ve güncelleme iş akışlarını da destekler.

## Güvenlik durumu

ClawHub yayınlamaya açıktır, ancak sürümler yine de yükleme kapılarına, otomatik
kontrollere, kullanıcı raporlarına ve moderatör eylemlerine tabidir.

Herkese açık sayfalar, mevcut olduğunda tarama özetlerini gösterir. Bekletilen,
gizlenen veya engellenen içerik; tanılama amacıyla sahibine görünür kalırken
herkese açık arama ve kurulum akışlarından kaybolabilir.

Bkz. [Güvenlik + moderasyon](/tr/clawhub/security) ve
[Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage).

## API erişimi

ClawHub; keşif, arama, paket ayrıntıları ve indirmeler için herkese açık okuma
API'ları sunar. Üçüncü taraf kataloglar, kanonik ClawHub listelemesine geri
bağlantı verdikleri, hız sınırlarına uydukları ve onay iması oluşturmaktan
kaçındıkları sürece bu API'ları kullanabilir.

Bkz. [Herkese açık API](/tr/clawhub/api) ve [HTTP API](/tr/clawhub/http-api).

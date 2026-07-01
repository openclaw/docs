---
read_when:
    - Listelemeleri, sürümleri, kurulumları, yayımlamayı ve moderasyonu anlama
summary: ClawHub listelemeleri, sürümleri, kurulumları, yayımlama, taramalar ve güncellemeler nasıl çalışır.
x-i18n:
    generated_at: "2026-07-01T13:16:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır?

ClawHub, OpenClaw skills ve plugin'leri için kayıt katmanıdır. Kullanıcılara
paketleri keşfedebilecekleri bir yer, yayıncılara sürümleri yayımlayabilecekleri
bir yer sağlar ve OpenClaw'a bu paketleri güvenli şekilde kurup güncellemek için
yeterli metadata verir.

## Kayıt kayıtları

Her herkese açık listeleme şunları içeren bir kayıt kaydıdır:

- bir sahip ve slug veya paket adı
- bir veya daha fazla yayımlanmış sürüm
- metadata, özet, dosyalar ve kaynak atfı
- `latest` gibi changelog ve etiket bilgileri
- indirme, kurulum ve yıldız sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir skill veya plugin'in kurulumdan önce ne
yaptığını iddia ettiğini incelemesi için kanonik yerdir.

## Skills

Bir skill, merkezinde `SKILL.md` bulunan sürümlenmiş bir metin paketidir.
Destekleyici dosyalar, örnekler, şablonlar ve betikler içerebilir.

ClawHub, skill adını, açıklamasını, gereksinimlerini, ortam değişkenlerini ve
metadata'sını anlamak için `SKILL.md` frontmatter'ını okur. Doğru metadata
önemlidir çünkü kullanıcıların skill'i kurup kurmayacaklarına karar vermesine
yardımcı olur ve otomatik taramaların beyan edilen davranış ile gözlemlenen
davranış arasındaki uyumsuzlukları tespit etmesine yardımcı olur.

Bkz. [Skill biçimi](/tr/clawhub/skill-format).

## Plugin'ler

Plugin'ler paketlenmiş OpenClaw uzantılarıdır. ClawHub paket metadata'sını,
uyumluluk bilgilerini, kaynak bağlantılarını, artifact'ları ve sürüm kayıtlarını
saklar.

OpenClaw, ClawHub'dan bir plugin kurduğunda kurulumdan önce duyurulan uyumluluk
metadata'sını kontrol eder. Paket kayıtları API uyumluluğu, minimum Gateway
sürümü, ana makine hedefleri, ortam gereksinimleri ve artifact özetlerini
içerebilir.

Kayıt defterinin doğruluk kaynağı olmasını istediğinizde açık bir ClawHub
kurulum kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayımlama

Yayımlama, yeni ve değiştirilemez bir sürüm kaydı oluşturur. Yayıncılar kimlik
doğrulamalı kayıt iş akışları için `clawhub` CLI kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenen payload'ı önizlemek için dry run kullanın. Herkese
açık sayfalar daha sonra yayımlanan metadata'yı, dosyaları, kaynak atfını ve
tarama durumunu gösterir.

## Kurulumlar ve güncellemeler

OpenClaw kurulum komutları ClawHub'ı paket kaynağı olarak kullanır:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw, güncellemelerin daha sonra aynı kayıt paketini çözebilmesi için
kurulum kaynağı metadata'sını kaydeder. ClawHub CLI, tam bir OpenClaw çalışma
alanı dışında kayıt tarafından yönetilen skill klasörleri isteyen kullanıcılar
için doğrudan skill kurulum ve güncelleme iş akışlarını da destekler.

## Güvenlik durumu

ClawHub yayımlamaya açıktır, ancak sürümler yine de yükleme kapılarına, otomatik
kontrollere, kullanıcı raporlarına ve moderatör işlemine tabidir.

Herkese açık sayfalar, mevcut olduğunda tarama özetlerini gösterir. Bekletilen,
gizlenen veya engellenen içerik, tanılama için sahibine görünür kalırken herkese
açık arama ve kurulum akışlarından kaybolabilir.

Bkz. [Güvenlik](/clawhub/security), [Güvenlik Denetimleri](/clawhub/security-audits),
[Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation) ve
[Kabul edilebilir kullanım](/clawhub/acceptable-usage).

## API erişimi

ClawHub keşif, arama, paket ayrıntıları ve indirmeler için herkese açık okuma
API'leri sunar. Üçüncü taraf kataloglar, kanonik ClawHub listelemesine geri
bağlantı verdiklerinde, hız sınırlarına uyduklarında ve onay izlenimi vermekten
kaçındıklarında bu API'leri kullanabilir.

Bkz. [Herkese açık API](/tr/clawhub/api) ve [HTTP API](/clawhub/http-api).

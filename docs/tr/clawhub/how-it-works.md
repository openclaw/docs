---
read_when:
    - Listelemeleri, sürümleri, kurulumları, yayımlamayı ve moderasyonu anlama
summary: ClawHub listelemelerinin, sürümlerin, kurulumların, yayımlamanın, taramaların ve güncellemelerin nasıl çalıştığı.
x-i18n:
    generated_at: "2026-07-03T23:40:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır

ClawHub, OpenClaw Skills ve pluginleri için kayıt katmanıdır. Kullanıcılara paketleri keşfedebilecekleri, yayıncılara sürümleri yayımlayabilecekleri bir yer sağlar ve OpenClaw’a bu paketleri güvenle yükleyip güncellemek için yeterli metadata sunar.

## Kayıt kayıtları

Her genel listeleme şunları içeren bir kayıt kaydıdır:

- sahip ve slug ya da paket adı
- yayımlanmış bir veya daha fazla sürüm
- metadata, özet, dosyalar ve kaynak atfı
- `latest` gibi changelog ve etiket bilgileri
- indirme, yükleme ve yıldız sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir skill veya plugin yüklemeden önce ne yaptığını iddia ettiğini incelemesi için kanonik yerdir.

## Skills

Bir skill, `SKILL.md` etrafında merkezlenen sürümlenmiş bir metin paketidir. Destekleyici dosyalar, örnekler, şablonlar ve betikler içerebilir.

ClawHub, skill adını, açıklamasını, gereksinimlerini, ortam değişkenlerini ve metadata’sını anlamak için `SKILL.md` frontmatter’ını okur. Doğru metadata önemlidir çünkü kullanıcıların skill’i yükleyip yüklememeye karar vermesine yardımcı olur ve otomatik taramaların beyan edilen davranış ile gözlemlenen davranış arasındaki uyumsuzlukları tespit etmesine yardımcı olur.

Bkz. [Skill biçimi](/tr/clawhub/skill-format).

## Pluginler

Pluginler paketlenmiş OpenClaw uzantılarıdır. ClawHub paket metadata’sını, uyumluluk bilgilerini, kaynak bağlantılarını, artifact’leri ve sürüm kayıtlarını saklar.

OpenClaw, ClawHub’dan bir plugin yüklediğinde, yüklemeden önce duyurulan uyumluluk metadata’sını kontrol eder. Paket kayıtları API uyumluluğu, minimum gateway sürümü, host hedefleri, ortam gereksinimleri ve artifact özetlerini içerebilir.

Kaydın doğruluk kaynağı olmasını istediğinizde açık bir ClawHub yükleme kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayımlama

Yayımlama, yeni bir değiştirilemez sürüm kaydı oluşturur. Yayıncılar, kimlik doğrulamalı kayıt iş akışları için `clawhub` CLI’ını kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenen payload’u önizlemek için dry run kullanın. Genel sayfalar daha sonra yayımlanan metadata’yı, dosyaları, kaynak atfını ve tarama durumunu gösterir.

## Yüklemeler ve güncellemeler

OpenClaw yükleme komutları ClawHub’ı paket kaynağı olarak kullanır:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw, güncellemelerin daha sonra aynı kayıt paketini çözebilmesi için yükleme kaynağı metadata’sını kaydeder. ClawHub CLI ayrıca, tam bir OpenClaw çalışma alanı dışında kayıt tarafından yönetilen skill klasörleri isteyen kullanıcılar için doğrudan skill yükleme ve güncelleme iş akışlarını destekler.

## Güvenlik durumu

ClawHub yayımlamaya açıktır, ancak sürümler yine de yükleme geçitlerine, otomatik kontrollere, kullanıcı raporlarına ve moderatör eylemlerine tabidir.

Genel sayfalar, mevcut olduğunda tarama özetlerini gösterir. Tutulan, gizlenen veya engellenen içerikler, tanılama için sahibi tarafından görünür kalırken genel arama ve yükleme akışlarından kaybolabilir.

Bkz. [Güvenlik](/clawhub/security), [Güvenlik Denetimleri](/clawhub/security-audits), [Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation) ve [Kabul edilebilir kullanım](/clawhub/acceptable-usage).

## API erişimi

ClawHub keşif, arama, paket ayrıntıları ve indirmeler için genel okuma API’leri sunar. Üçüncü taraf kataloglar, kanonik ClawHub listelemesine geri bağlantı verdikleri, hız sınırlarına uydukları ve onay ima etmekten kaçındıkları sürece bu API’leri kullanabilir.

Bkz. [Genel API](/tr/clawhub/api) ve [HTTP API](/clawhub/http-api).

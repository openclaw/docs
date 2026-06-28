---
read_when:
    - Listelemeleri, sürümleri, kurulumları, yayımlamayı ve moderasyonu anlama
summary: ClawHub listelemelerinin, sürümlerin, kurulumların, yayımlamanın, taramaların ve güncellemelerin nasıl çalıştığı.
x-i18n:
    generated_at: "2026-06-28T00:17:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır

ClawHub, OpenClaw becerileri ve pluginleri için kayıt katmanıdır. Kullanıcılara paketleri keşfedebilecekleri bir yer, yayıncılara sürüm yayımlayabilecekleri bir yer ve OpenClaw'a bu paketleri güvenle kurup güncellemek için yeterli meta veri sağlar.

## Kayıt kayıtları

Her herkese açık listeleme, şunları içeren bir kayıt kaydıdır:

- bir sahip ve slug ya da paket adı
- bir veya daha fazla yayımlanmış sürüm
- meta veri, özet, dosyalar ve kaynak atfı
- `latest` gibi değişiklik günlüğü ve etiket bilgileri
- indirme, kurulum ve yıldız sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir becerinin veya pluginin kurmadan önce ne yapmayı iddia ettiğini inceleyebileceği kanonik yerdir.

## Skills

Bir beceri, `SKILL.md` merkezli sürümlenmiş bir metin paketidir. Destekleyici dosyalar, örnekler, şablonlar ve betikler içerebilir.

ClawHub, beceri adını, açıklamasını, gereksinimlerini, ortam değişkenlerini ve meta verilerini anlamak için `SKILL.md` frontmatter bölümünü okur. Doğru meta veri önemlidir çünkü kullanıcıların beceriyi kurup kurmamaya karar vermesine yardımcı olur ve otomatik taramaların beyan edilen davranış ile gözlemlenen davranış arasındaki uyumsuzlukları algılamasına yardımcı olur.

Bkz. [Beceri biçimi](/tr/clawhub/skill-format).

## Pluginler

Pluginler, paketlenmiş OpenClaw uzantılarıdır. ClawHub paket meta verilerini, uyumluluk bilgilerini, kaynak bağlantılarını, artefaktları ve sürüm kayıtlarını saklar.

OpenClaw, ClawHub'dan bir plugin kurduğunda, kurulumdan önce duyurulan uyumluluk meta verilerini denetler. Paket kayıtları API uyumluluğu, minimum gateway sürümü, ana makine hedefleri, ortam gereksinimleri ve artefakt özet değerlerini içerebilir.

Kayıt defterinin doğruluk kaynağı olmasını istediğinizde açık bir ClawHub kurulum kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayımlama

Yayımlama, yeni ve değiştirilemez bir sürüm kaydı oluşturur. Yayıncılar, kimlik doğrulamalı kayıt iş akışları için `clawhub` CLI aracını kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenen payload'u önizlemek için kuru çalıştırmaları kullanın. Herkese açık sayfalar daha sonra yayımlanan meta verileri, dosyaları, kaynak atfını ve tarama durumunu gösterir.

## Kurulumlar ve güncellemeler

OpenClaw kurulum komutları ClawHub'ı paket kaynağı olarak kullanır:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw, güncellemelerin daha sonra aynı kayıt paketini çözümleyebilmesi için kurulum kaynağı meta verilerini kaydeder. ClawHub CLI ayrıca tam bir OpenClaw çalışma alanı dışında kayıt tarafından yönetilen beceri klasörleri isteyen kullanıcılar için doğrudan beceri kurulum ve güncelleme iş akışlarını destekler.

## Güvenlik durumu

ClawHub yayımlamaya açıktır, ancak sürümler yine de yükleme kapılarına, otomatik denetimlere, kullanıcı raporlarına ve moderatör eylemlerine tabidir.

Herkese açık sayfalar, mevcut olduğunda tarama özetlerini gösterir. Bekletilen, gizlenen veya engellenen içerik, tanılama için sahibine görünür kalırken herkese açık arama ve kurulum akışlarından kaybolabilir.

Bkz. [Güvenlik](/tr/clawhub/security), [Güvenlik Denetimleri](/tr/clawhub/security-audits), [Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation) ve [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage).

## API erişimi

ClawHub keşif, arama, paket ayrıntıları ve indirmeler için herkese açık okuma API'leri sunar. Üçüncü taraf kataloglar, kanonik ClawHub listelemesine geri bağlantı verdiklerinde, hız sınırlarına uyduklarında ve onay ima etmekten kaçındıklarında bu API'leri kullanabilir.

Bkz. [Herkese Açık API](/tr/clawhub/api) ve [HTTP API](/tr/clawhub/http-api).

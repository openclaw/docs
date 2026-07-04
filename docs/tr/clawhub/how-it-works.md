---
read_when:
    - Listelemeleri, sürümleri, kurulumları, yayımlamayı ve moderasyonu anlama
summary: ClawHub listelemelerinin, sürümlerin, kurulumların, yayınlamanın, taramaların ve güncellemelerin nasıl çalıştığı.
x-i18n:
    generated_at: "2026-07-04T06:44:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır

ClawHub, OpenClaw Skills ve Plugin'leri için kayıt katmanıdır. Kullanıcılara paketleri keşfedebilecekleri, yayıncılara sürüm yayımlayabilecekleri bir yer sağlar ve OpenClaw'a bu paketleri güvenle kurup güncellemek için yeterli meta veri verir.

## Kayıt kayıtları

Her herkese açık listeleme şunları içeren bir kayıt kaydıdır:

- sahip ve slug ya da paket adı
- yayımlanmış bir veya daha fazla sürüm
- meta veri, özet, dosyalar ve kaynak atfı
- `latest` gibi değişiklik günlüğü ve etiket bilgileri
- indirme, kurulum ve yıldız sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir Skill veya Plugin'in kurulumdan önce ne yaptığını iddia ettiğini incelemesi için kanonik yerdir.

## Skills

Skill, `SKILL.md` merkezli, sürümlenmiş bir metin paketidir. Destek dosyaları, örnekler, şablonlar ve betikler içerebilir.

ClawHub, Skill adını, açıklamasını, gereksinimlerini, ortam değişkenlerini ve meta verilerini anlamak için `SKILL.md` frontmatter'ını okur. Doğru meta veri önemlidir; çünkü kullanıcıların Skill'i kurup kurmamaya karar vermesine yardımcı olur ve otomatik taramaların beyan edilen davranış ile gözlemlenen davranış arasındaki uyumsuzlukları algılamasını sağlar.

Bkz. [Skill biçimi](/tr/clawhub/skill-format).

## Plugin'ler

Plugin'ler, paketlenmiş OpenClaw uzantılarıdır. ClawHub paket meta verilerini, uyumluluk bilgilerini, kaynak bağlantılarını, yapıtları ve sürüm kayıtlarını saklar.

OpenClaw, ClawHub'dan bir Plugin kurduğunda, kurulumdan önce duyurulan uyumluluk meta verilerini denetler. Paket kayıtları API uyumluluğu, minimum Gateway sürümü, ana makine hedefleri, ortam gereksinimleri ve yapıt özetlerini içerebilir.

Kayıt defterinin doğruluk kaynağı olmasını istediğinizde açık bir ClawHub kurulum kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayımlama

Yayımlama, yeni ve değiştirilemez bir sürüm kaydı oluşturur. Yayıncılar, kimlik doğrulamalı kayıt iş akışları için `clawhub` CLI'ını kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenen yükü önizlemek için kuru çalıştırmaları kullanın. Ardından herkese açık sayfalar yayımlanan meta verileri, dosyaları, kaynak atfını ve tarama durumunu gösterir.

## Kurulumlar ve güncellemeler

OpenClaw kurulum komutları ClawHub'ı paket kaynağı olarak kullanır:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw, güncellemelerin daha sonra aynı kayıt paketini çözümleyebilmesi için kurulum kaynağı meta verilerini kaydeder. ClawHub CLI, tam bir OpenClaw çalışma alanı dışında kayıt tarafından yönetilen Skill klasörleri isteyen kullanıcılar için doğrudan Skill kurulum ve güncelleme iş akışlarını da destekler.

## Güvenlik durumu

ClawHub yayımlamaya açıktır, ancak sürümler yine de yükleme geçitlerine, otomatik denetimlere, kullanıcı raporlarına ve moderatör işlemine tabidir.

Herkese açık sayfalar, mevcut olduğunda tarama özetlerini gösterir. Bekletilen, gizlenen veya engellenen içerik; tanılama amacıyla sahibi tarafından görünür kalırken herkese açık arama ve kurulum akışlarından kaybolabilir.

Bkz. [Güvenlik](/clawhub/security), [Güvenlik Denetimleri](/clawhub/security-audits), [Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation) ve [Kabul edilebilir kullanım](/clawhub/acceptable-usage).

## API erişimi

ClawHub keşif, arama, paket ayrıntıları ve indirmeler için herkese açık okuma API'leri sunar. Üçüncü taraf kataloglar, kanonik ClawHub listelemesine geri bağlantı verdikleri, hız sınırlarına uydukları ve onay ima etmekten kaçındıkları sürece bu API'leri kullanabilir.

Bkz. [Public API](/tr/clawhub/api) ve [HTTP API](/clawhub/http-api).

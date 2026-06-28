---
read_when:
    - Listelemeleri, sürümleri, kurulumları, yayımlamayı ve moderasyonu anlama
summary: ClawHub listelerinin, sürümlerinin, kurulumlarının, yayımlamanın, taramaların ve güncellemelerin nasıl çalıştığı.
x-i18n:
    generated_at: "2026-06-28T20:40:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır

ClawHub, OpenClaw Skills ve Plugin'leri için kayıt katmanıdır. Kullanıcılara
paketleri keşfedecek bir yer, yayıncılara sürüm yayımlayacak bir yer sağlar ve
OpenClaw'a bu paketleri güvenli şekilde yüklemek ve güncellemek için yeterli meta veri verir.

## Kayıt kayıtları

Her herkese açık listeleme, şunları içeren bir kayıt kaydıdır:

- bir sahip ve slug ya da paket adı
- bir veya daha fazla yayımlanmış sürüm
- meta veriler, özet, dosyalar ve kaynak atfı
- `latest` gibi değişiklik günlüğü ve etiket bilgileri
- indirme, yükleme ve yıldız sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir skill'in veya
plugin'in yüklemeden önce ne yaptığını iddia ettiğini incelemesi için kanonik yerdir.

## Skills

Bir skill, `SKILL.md` merkezli sürümlenmiş bir metin paketidir. Destekleyici
dosyalar, örnekler, şablonlar ve betikler içerebilir.

ClawHub, skill adını, açıklamasını, gereksinimlerini, ortam değişkenlerini ve
meta verilerini anlamak için `SKILL.md` frontmatter'ını okur. Doğru
meta veriler önemlidir çünkü kullanıcıların skill'i yükleyip yüklememeye karar vermesine
yardımcı olur ve otomatik taramaların beyan edilen davranış ile gözlemlenen davranış
arasındaki uyuşmazlıkları algılamasına yardımcı olur.

Bkz. [Skill biçimi](/tr/clawhub/skill-format).

## Plugin'ler

Plugin'ler paketlenmiş OpenClaw uzantılarıdır. ClawHub paket meta verilerini,
uyumluluk bilgilerini, kaynak bağlantılarını, artifaktları ve sürüm kayıtlarını saklar.

OpenClaw, ClawHub'dan bir plugin yüklediğinde, yüklemeden önce duyurulan uyumluluk
meta verilerini denetler. Paket kayıtları API uyumluluğu,
minimum gateway sürümü, ana makine hedefleri, ortam gereksinimleri ve artifakt
özetlerini içerebilir.

Kayıt kaynağının doğruluk kaynağı olmasını istediğinizde açık bir ClawHub yükleme kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayınlama

Yayınlama, yeni ve değişmez bir sürüm kaydı oluşturur. Yayıncılar, kimlik doğrulamalı kayıt iş akışları için `clawhub`
CLI'ını kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenen yükü önizlemek için deneme çalıştırmaları kullanın. Herkese açık sayfalar daha sonra
yayımlanan meta verileri, dosyaları, kaynak atfını ve tarama durumunu gösterir.

## Yüklemeler ve güncellemeler

OpenClaw yükleme komutları ClawHub'ı paket kaynağı olarak kullanır:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw, güncellemelerin daha sonra aynı
kayıt paketini çözebilmesi için yükleme kaynağı meta verilerini kaydeder. ClawHub CLI ayrıca, tam bir OpenClaw çalışma alanı dışında
kayıt tarafından yönetilen skill klasörleri isteyen kullanıcılar için doğrudan skill yükleme ve
güncelleme iş akışlarını destekler.

## Güvenlik durumu

ClawHub yayınlamaya açıktır, ancak sürümler yine de yükleme kapılarına,
otomatik denetimlere, kullanıcı raporlarına ve moderatör işlemine tabidir.

Herkese açık sayfalar, mevcut olduğunda tarama özetlerini gösterir. Bekletilen, gizlenen
veya engellenen içerik, teşhis için sahibine
görünür kalırken herkese açık arama ve yükleme akışlarından kaybolabilir.

Bkz. [Güvenlik](/tr/clawhub/security), [Güvenlik Denetimleri](/tr/clawhub/security-audits),
[Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation) ve
[Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage).

## API erişimi

ClawHub; keşif, arama, paket ayrıntıları ve
indirmeler için herkese açık okuma API'leri sunar. Üçüncü taraf kataloglar, kanonik
ClawHub listelemesine geri bağlantı verdiklerinde, hız sınırlarına uyduklarında ve desteklendiği izlenimi vermekten kaçındıklarında bu API'leri kullanabilir.

Bkz. [Public API](/tr/clawhub/api) ve [HTTP API](/tr/clawhub/http-api).

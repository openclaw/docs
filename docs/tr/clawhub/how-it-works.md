---
read_when:
    - Listelemeleri, sürümleri, kurulumları, yayınlamayı ve moderasyonu anlama
summary: ClawHub listelemelerinin, sürümlerinin, kurulumlarının, yayımlamanın, taramaların ve güncellemelerin nasıl çalıştığı.
x-i18n:
    generated_at: "2026-07-01T15:29:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır?

ClawHub, OpenClaw Skills ve plugin'leri için kayıt katmanıdır. Kullanıcılara
paketleri keşfedecek bir yer, yayıncılara sürümleri yayımlayacak bir yer ve
OpenClaw'a bu paketleri güvenle kurup güncellemek için yeterli metadata sağlar.

## Kayıt kayıtları

Her herkese açık listeleme şunları içeren bir kayıt kaydıdır:

- bir sahip ve slug ya da paket adı
- bir veya daha fazla yayımlanmış sürüm
- metadata, özet, dosyalar ve kaynak atfı
- `latest` gibi değişiklik günlüğü ve etiket bilgileri
- indirme, kurulum ve yıldız sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir Skills ya da plugin'in kurmadan önce ne
yapmayı iddia ettiğini incelemesi için kanonik yerdir.

## Skills

Bir Skills, `SKILL.md` merkezli sürümlenmiş bir metin paketidir. Destekleyici
dosyalar, örnekler, şablonlar ve betikler içerebilir.

ClawHub, Skills adını, açıklamasını, gereksinimlerini, ortam değişkenlerini ve
metadata'sını anlamak için `SKILL.md` frontmatter'ını okur. Doğru metadata
önemlidir çünkü kullanıcıların Skills'i kurup kurmamaya karar vermesine yardımcı
olur ve otomatik taramaların beyan edilen davranış ile gözlenen davranış
arasındaki uyumsuzlukları algılamasına yardımcı olur.

Bkz. [Skills biçimi](/tr/clawhub/skill-format).

## Plugin'ler

Plugin'ler paketlenmiş OpenClaw uzantılarıdır. ClawHub paket metadata'sını,
uyumluluk bilgilerini, kaynak bağlantılarını, yapıtları ve sürüm kayıtlarını
saklar.

OpenClaw, ClawHub'dan bir plugin kurduğunda, kurulumdan önce ilan edilen
uyumluluk metadata'sını denetler. Paket kayıtları API uyumluluğu, minimum
Gateway sürümü, host hedefleri, ortam gereksinimleri ve yapıt özetlerini
içerebilir.

Kayıt sisteminin doğruluk kaynağı olmasını istediğinizde açık bir ClawHub kurulum
kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayınlama

Yayınlama, yeni bir değişmez sürüm kaydı oluşturur. Yayıncılar kimliği doğrulanmış
kayıt iş akışları için `clawhub` CLI'ını kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenen payload'u önizlemek için dry run kullanın. Ardından
herkese açık sayfalar yayımlanan metadata'yı, dosyaları, kaynak atfını ve tarama
durumunu gösterir.

## Kurulumlar ve güncellemeler

OpenClaw kurulum komutları ClawHub'ı paket kaynağı olarak kullanır:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw, güncellemelerin daha sonra aynı kayıt paketini çözümleyebilmesi için
kurulum kaynağı metadata'sını kaydeder. ClawHub CLI, tam bir OpenClaw çalışma
alanı dışında kayıt tarafından yönetilen Skills klasörleri isteyen kullanıcılar
için doğrudan Skills kurulum ve güncelleme iş akışlarını da destekler.

## Güvenlik durumu

ClawHub yayınlamaya açıktır, ancak sürümler yine de yükleme kapılarına, otomatik
denetimlere, kullanıcı raporlarına ve moderatör işlemine tabidir.

Herkese açık sayfalar mevcut olduğunda tarama özetlerini gösterir. Beklemeye
alınan, gizlenen veya engellenen içerik; tanılama için sahibine görünür kalırken
herkese açık arama ve kurulum akışlarından kaybolabilir.

Bkz. [Güvenlik](/clawhub/security), [Güvenlik Denetimleri](/clawhub/security-audits),
[Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation) ve
[Kabul edilebilir kullanım](/clawhub/acceptable-usage).

## API erişimi

ClawHub keşif, arama, paket ayrıntıları ve indirmeler için herkese açık okuma
API'leri sunar. Üçüncü taraf kataloglar, kanonik ClawHub listelemesine geri
bağlantı verdiklerinde, hız sınırlarına uyduklarında ve onaylandıkları izlenimi
yaratmaktan kaçındıklarında bu API'leri kullanabilir.

Bkz. [Herkese Açık API](/tr/clawhub/api) ve [HTTP API](/clawhub/http-api).

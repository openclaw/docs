---
read_when:
    - Listelemeleri, sürümleri, kurulumları, yayımlamayı ve moderasyonu anlama
summary: ClawHub listelemelerinin, sürümlerinin, kurulumlarının, yayımlama süreçlerinin, taramalarının ve güncellemelerinin nasıl çalıştığı.
x-i18n:
    generated_at: "2026-07-02T22:44:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır?

ClawHub, OpenClaw Skills ve Plugin'ları için registry katmanıdır. Kullanıcılara paketleri
keşfedebilecekleri bir yer, yayıncılara sürüm yayımlayabilecekleri bir yer ve
OpenClaw'a bu paketleri güvenle kurup güncellemek için yeterli metadata sağlar.

## Registry kayıtları

Her herkese açık listeleme şunları içeren bir registry kaydıdır:

- bir sahip ve slug ya da paket adı
- yayımlanmış bir veya daha fazla sürüm
- metadata, özet, dosyalar ve kaynak atfı
- changelog ve `latest` gibi tag bilgileri
- indirme, kurulum ve yıldız sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir skill veya
Plugin'ın kurmadan önce ne yaptığını iddia ettiğini incelemesi için kanonik yerdir.

## Skills

Bir skill, `SKILL.md` etrafında şekillenen sürümlü bir metin paketidir. Destekleyici
dosyalar, örnekler, şablonlar ve betikler içerebilir.

ClawHub, skill adını, açıklamasını, gereksinimlerini, ortam değişkenlerini
ve metadata bilgilerini anlamak için `SKILL.md` frontmatter'ını okur. Doğru
metadata önemlidir çünkü kullanıcıların skill'i kurup kurmamaya karar vermesine
yardımcı olur ve otomatik taramaların beyan edilen davranış ile gözlenen davranış
arasındaki uyumsuzlukları algılamasına yardımcı olur.

Bkz. [Skill formatı](/tr/clawhub/skill-format).

## Plugin'lar

Plugin'lar paketlenmiş OpenClaw uzantılarıdır. ClawHub paket metadata'sını,
uyumluluk bilgilerini, kaynak bağlantılarını, artifact'ları ve sürüm kayıtlarını saklar.

OpenClaw, ClawHub'dan bir Plugin kurduğunda, kurulumdan önce ilan edilen uyumluluk
metadata'sını denetler. Paket kayıtları API uyumluluğu, minimum gateway sürümü,
host hedefleri, ortam gereksinimleri ve artifact digest'leri içerebilir.

Registry'nin doğruluk kaynağı olmasını istediğinizde açık bir ClawHub kurulum
kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayınlama

Yayınlama, yeni bir değiştirilemez sürüm kaydı oluşturur. Yayıncılar kimliği
doğrulanmış registry iş akışları için `clawhub` CLI'ını kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenen payload'u önizlemek için dry run kullanın. Herkese açık
sayfalar daha sonra yayımlanan metadata'yı, dosyaları, kaynak atfını ve tarama
durumunu gösterir.

## Kurulumlar ve güncellemeler

OpenClaw kurulum komutları ClawHub'ı paket kaynağı olarak kullanır:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw kurulum kaynağı metadata'sını kaydeder, böylece güncellemeler daha sonra
aynı registry paketini çözümleyebilir. ClawHub CLI ayrıca tam bir OpenClaw çalışma
alanı dışında registry tarafından yönetilen skill klasörleri isteyen kullanıcılar
için doğrudan skill kurulum ve güncelleme iş akışlarını destekler.

## Güvenlik durumu

ClawHub yayınlamaya açıktır, ancak sürümler yine de yükleme kapılarına,
otomatik denetimlere, kullanıcı raporlarına ve moderatör işlemine tabidir.

Herkese açık sayfalar, kullanılabilir olduğunda tarama özetlerini gösterir. Tutulan,
gizlenen veya engellenen içerik; tanılama için sahibine görünür kalırken herkese açık
arama ve kurulum akışlarından kaybolabilir.

Bkz. [Güvenlik](/clawhub/security), [Güvenlik Denetimleri](/clawhub/security-audits),
[Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation) ve
[Kabul edilebilir kullanım](/clawhub/acceptable-usage).

## API erişimi

ClawHub; keşif, arama, paket ayrıntıları ve indirmeler için herkese açık okuma
API'leri sunar. Üçüncü taraf kataloglar, kanonik ClawHub listelemesine geri bağlantı
verdikleri, hız sınırlarına uydukları ve onay izlenimi vermekten kaçındıkları sürece
bu API'leri kullanabilir.

Bkz. [Public API](/tr/clawhub/api) ve [HTTP API](/clawhub/http-api).

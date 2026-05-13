---
read_when:
    - Listelemeleri, sürümleri, kurulumları, yayımlamayı ve moderasyonu anlama
summary: ClawHub listelemelerinin, sürümlerin, kurulumların, yayımlamanın, taramaların ve güncellemelerin nasıl çalıştığı.
x-i18n:
    generated_at: "2026-05-13T05:32:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır

ClawHub, OpenClaw Skills ve plugins için kayıt katmanıdır. Kullanıcılara paketleri keşfedecek bir yer, yayıncılara sürüm yayımlayacak bir yer ve OpenClaw'a bu paketleri güvenli şekilde kurup güncellemek için yeterli metadata sağlar.

## Kayıt kayıtları

Her herkese açık listeleme, şunları içeren bir kayıt kaydıdır:

- sahip ve slug ya da paket adı
- bir veya daha fazla yayımlanmış sürüm
- metadata, özet, dosyalar ve kaynak atfı
- `latest` gibi changelog ve etiket bilgileri
- indirme, kurulum, yıldız ve yorum sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir Skills veya plugin kurmadan önce ne yaptığını iddia ettiğini incelemesi için kanonik yerdir.

## Skills

Bir skill, `SKILL.md` merkezli sürümlenmiş bir metin paketidir. Destekleyici dosyalar, örnekler, şablonlar ve scriptler içerebilir.

ClawHub, skill adını, açıklamasını, gereksinimlerini, ortam değişkenlerini ve metadata bilgilerini anlamak için `SKILL.md` frontmatter'ını okur. Doğru metadata önemlidir; çünkü kullanıcıların skill'i kurup kurmamaya karar vermesine yardımcı olur ve otomatik taramaların bildirilen davranış ile gözlemlenen davranış arasındaki uyumsuzlukları saptamasını sağlar.

Bkz. [Skill formatı](/tr/clawhub/skill-format).

## Plugins

Plugins, paketlenmiş OpenClaw uzantılarıdır. ClawHub paket metadata bilgilerini, uyumluluk bilgilerini, kaynak bağlantılarını, artifact'leri ve sürüm kayıtlarını saklar.

OpenClaw, ClawHub'dan bir plugin kurduğunda, kurulumdan önce duyurulan uyumluluk metadata bilgilerini kontrol eder. Paket kayıtları API uyumluluğu, minimum gateway sürümü, host hedefleri, ortam gereksinimleri ve artifact digest'leri içerebilir.

Kayıt katmanının doğruluk kaynağı olmasını istediğinizde açık bir ClawHub kurulum kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayınlama

Yayınlama, yeni bir değiştirilemez sürüm kaydı oluşturur. Yayıncılar, kimlik doğrulamalı kayıt iş akışları için `clawhub` CLI'ını kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenen payload'u önizlemek için deneme çalıştırmalarını kullanın. Herkese açık sayfalar ardından yayımlanan metadata bilgilerini, dosyaları, kaynak atfını ve tarama durumunu gösterir.

## Kurulumlar ve güncellemeler

OpenClaw kurulum komutları, ClawHub'ı paket kaynağı olarak kullanır:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw, güncellemelerin daha sonra aynı kayıt paketini çözümleyebilmesi için kurulum kaynağı metadata bilgilerini kaydeder. ClawHub CLI ayrıca, tam bir OpenClaw çalışma alanı dışında kayıt yönetimli skill klasörleri isteyen kullanıcılar için doğrudan skill kurulum ve güncelleme iş akışlarını destekler.

## Güvenlik durumu

ClawHub yayınlamaya açıktır, ancak sürümler yine de yükleme kapılarına, otomatik kontrollere, kullanıcı raporlarına ve moderatör işlemlerine tabidir.

Herkese açık sayfalar, mevcut olduğunda tarama özetlerini gösterir. Bekletilen, gizlenen veya engellenen içerikler; tanılama için sahibine görünür kalırken herkese açık arama ve kurulum akışlarından kaybolabilir.

Bkz. [Güvenlik + moderasyon](/tr/clawhub/security) ve [Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage).

## API erişimi

ClawHub; keşif, arama, paket ayrıntıları ve indirmeler için herkese açık okuma API'leri sunar. Üçüncü taraf kataloglar, kanonik ClawHub listelemesine bağlantı verdiklerinde, hız sınırlarına uyduklarında ve onaylandıkları izlenimini vermekten kaçındıklarında bu API'leri kullanabilir.

Bkz. [Herkese Açık API](/tr/clawhub/api) ve [HTTP API](/tr/clawhub/http-api).

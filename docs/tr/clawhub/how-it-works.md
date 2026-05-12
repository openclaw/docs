---
read_when:
    - Listelemeleri, sürümleri, kurulumları, yayımlamayı ve moderasyonu anlama
summary: ClawHub listelemelerinin, sürümlerin, kurulumların, yayımlamanın, taramaların ve güncellemelerin nasıl çalıştığı.
x-i18n:
    generated_at: "2026-05-12T12:48:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır

ClawHub, OpenClaw Skills ve Pluginleri için kayıt katmanıdır. Kullanıcılara
paketleri keşfedebilecekleri bir yer, yayıncılara sürüm yayımlayabilecekleri
bir yer ve OpenClaw'a bu paketleri güvenli şekilde kurup güncellemek için
yeterli metadata sağlar.

## Kayıt kayıtları

Her herkese açık listeleme şunları içeren bir kayıt kaydıdır:

- bir sahip ve slug veya paket adı
- bir veya daha fazla yayımlanmış sürüm
- metadata, özet, dosyalar ve kaynak atfı
- `latest` gibi changelog ve etiket bilgileri
- indirme, kurulum, yıldız ve yorum sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir skill veya
pluginin kurmadan önce ne yaptığını iddia ettiğini inceleyebileceği kanonik yerdir.

## Skills

Bir skill, `SKILL.md` merkezli sürümlenmiş bir metin paketidir. Destekleyici
dosyalar, örnekler, şablonlar ve betikler içerebilir.

ClawHub, skill adını, açıklamasını, gereksinimlerini, ortam değişkenlerini ve
metadata bilgisini anlamak için `SKILL.md` frontmatter içeriğini okur. Doğru
metadata önemlidir çünkü kullanıcıların skilli kurup kurmamaya karar vermesine
yardımcı olur ve otomatik taramaların beyan edilen davranış ile gözlemlenen
davranış arasındaki uyumsuzlukları tespit etmesine yardımcı olur.

Bkz. [Skill biçimi](/tr/clawhub/skill-format).

## Pluginler

Pluginler, paketlenmiş OpenClaw uzantılarıdır. ClawHub paket metadata bilgisini,
uyumluluk bilgilerini, kaynak bağlantılarını, artefaktları ve sürüm kayıtlarını
saklar.

OpenClaw, ClawHub'dan bir plugin kurduğunda, kurulumdan önce ilan edilen uyumluluk
metadata bilgisini kontrol eder. Paket kayıtları API uyumluluğu,
minimum gateway sürümü, ana makine hedefleri, ortam gereksinimleri ve artefakt
özetleri içerebilir.

Kayıt deposunun doğruluk kaynağı olmasını istediğinizde açık bir ClawHub kurulum
kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayınlama

Yayınlama, yeni bir değiştirilemez sürüm kaydı oluşturur. Yayıncılar kimliği
doğrulanmış kayıt deposu iş akışları için `clawhub` CLI kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenen yükü önizlemek için deneme çalıştırmalarını kullanın.
Herkese açık sayfalar daha sonra yayımlanan metadata bilgisini, dosyaları, kaynak
atfını ve tarama durumunu gösterir.

## Kurulumlar ve güncellemeler

OpenClaw kurulum komutları ClawHub'ı paket kaynağı olarak kullanır:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw, güncellemelerin daha sonra aynı kayıt deposu paketini çözümleyebilmesi
için kurulum kaynağı metadata bilgisini kaydeder. ClawHub CLI ayrıca tam bir
OpenClaw çalışma alanı dışında kayıt deposu tarafından yönetilen skill klasörleri
isteyen kullanıcılar için doğrudan skill kurulum ve güncelleme iş akışlarını
destekler.

## Güvenlik durumu

ClawHub yayınlamaya açıktır, ancak sürümler yine de yükleme kapılarına,
otomatik kontrollere, kullanıcı raporlarına ve moderatör işlemine tabidir.

Herkese açık sayfalar, kullanılabilir olduğunda tarama özetlerini gösterir.
Bekletilen, gizlenen veya engellenen içerik, tanılama için sahibine görünür
kalmaya devam ederken herkese açık arama ve kurulum akışlarından kaybolabilir.

Bkz. [Güvenlik + moderasyon](/tr/clawhub/security) ve
[Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage).

## API erişimi

ClawHub keşif, arama, paket ayrıntıları ve indirmeler için herkese açık okuma
API'leri sunar. Üçüncü taraf kataloglar, kanonik ClawHub listelemesine geri
bağlantı verdiklerinde, hız sınırlarına uyduklarında ve onay ima etmekten
kaçındıklarında bu API'leri kullanabilir.

Bkz. [Public API](/tr/clawhub/api) ve [HTTP API](/tr/clawhub/http-api).

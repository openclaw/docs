---
read_when:
    - Listelemeleri, sürümleri, kurulumları, yayımlamayı ve moderasyonu anlama
summary: ClawHub listelemelerinin, sürümlerinin, kurulumlarının, yayımlama işlemlerinin, taramalarının ve güncellemelerinin nasıl çalıştığı.
x-i18n:
    generated_at: "2026-07-12T12:06:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır

ClawHub, OpenClaw Skills ve Plugin'leri için kayıt katmanıdır. Kullanıcılara paketleri keşfedebilecekleri, yayıncılara sürümleri yayımlayabilecekleri bir yer sunar ve OpenClaw'a bu paketleri güvenli bir şekilde kurup güncellemesi için yeterli meta veriyi sağlar.

## Kayıt girdileri

Herkese açık her listeleme, aşağıdakileri içeren bir kayıt girdisidir:

- bir sahip ve kısa ad veya paket adı
- yayımlanmış bir veya daha fazla sürüm
- meta veriler, özet, dosyalar ve kaynak atfı
- değişiklik günlüğü ve `latest` gibi etiket bilgileri
- indirme, kurulum ve yıldız sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir Skills veya Plugin'i kurmadan önce ne yaptığını iddia ettiğini inceleyebilecekleri asıl kaynaktır.

## Skills

Skills, `SKILL.md` merkezli, sürümlendirilmiş bir metin paketidir. Destekleyici dosyalar, örnekler, şablonlar ve betikler içerebilir.

ClawHub; Skills adını, açıklamasını, gereksinimlerini, ortam değişkenlerini ve meta verilerini anlamak için `SKILL.md` ön bilgilerini okur. Doğru meta veriler önemlidir; çünkü kullanıcıların Skills'i kurup kurmamaya karar vermelerine yardımcı olur ve otomatik taramaların bildirilen davranış ile gözlemlenen davranış arasındaki uyumsuzlukları tespit etmesini sağlar.

Bkz. [Skills biçimi](/clawhub/skill-format).

## Plugin'ler

Plugin'ler, paketlenmiş OpenClaw uzantılarıdır. ClawHub paket meta verilerini, uyumluluk bilgilerini, kaynak bağlantılarını, yapıtları ve sürüm kayıtlarını saklar.

OpenClaw, ClawHub'dan bir Plugin kurarken kurulumdan önce belirtilen uyumluluk meta verilerini denetler. Paket kayıtları API uyumluluğunu, minimum Gateway sürümünü, ana makine hedeflerini, ortam gereksinimlerini ve yapıt özetlerini içerebilir.

Kayıt sisteminin asıl kaynak olmasını istediğinizde açık bir ClawHub kurulum kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayımlama

Yayımlama işlemi, değiştirilemez yeni bir sürüm kaydı oluşturur. Yayıncılar, kimliği doğrulanmış kayıt sistemi iş akışları için `clawhub` CLI'ını kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenen yükü önizlemek için deneme çalıştırmalarını kullanın. Ardından herkese açık sayfalar yayımlanan meta verileri, dosyaları, kaynak atfını ve tarama durumunu gösterir.

## Kurulumlar ve güncellemeler

OpenClaw kurulum komutları, paket kaynağı olarak ClawHub'ı kullanır:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw, güncellemelerin daha sonra aynı kayıt paketini çözümleyebilmesi için kurulum kaynağı meta verilerini kaydeder. ClawHub CLI ayrıca, kayıt sistemi tarafından yönetilen Skills klasörlerini tam bir OpenClaw çalışma alanının dışında kullanmak isteyen kullanıcılar için doğrudan Skills kurulum ve güncelleme iş akışlarını destekler.

## Güvenlik durumu

ClawHub yayımlamaya açıktır ancak sürümler yine de yükleme denetimlerine, otomatik kontrollere, kullanıcı bildirimlerine ve moderatör işlemlerine tabidir.

Herkese açık sayfalar, mevcut olduğunda tarama özetlerini gösterir. Bekletilen, gizlenen veya engellenen içerikler, tanılama amacıyla sahibi tarafından görülebilmeye devam ederken herkese açık arama ve kurulum akışlarından kaybolabilir.

Bkz. [Güvenlik](/tr/clawhub/security), [Güvenlik Denetimleri](/clawhub/security-audits), [Moderasyon ve Hesap Güvenliği](/tr/clawhub/moderation) ve [Kabul Edilebilir Kullanım](/clawhub/acceptable-usage).

## API erişimi

ClawHub; keşif, arama, paket ayrıntıları ve indirmeler için herkese açık okuma API'leri sunar. Üçüncü taraf kataloglar, asıl ClawHub listelemesine bağlantı verdikleri, hız sınırlarına uydukları ve onaylandıkları izlenimini vermekten kaçındıkları sürece bu API'leri kullanabilir.

Bkz. [Herkese Açık API](/clawhub/api) ve [HTTP API](/clawhub/http-api).

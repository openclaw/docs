---
read_when:
    - Listelemeleri, sürümleri, kurulumları, yayımlamayı ve moderasyonu anlama
summary: ClawHub listelemelerinin, sürümlerin, kurulumların, yayımlamanın, taramaların ve güncellemelerin nasıl çalıştığı.
x-i18n:
    generated_at: "2026-05-11T22:19:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır

ClawHub, OpenClaw Skills ve Plugin'leri için kayıt katmanıdır. Kullanıcılara
paketleri keşfedecek bir yer, yayıncılara sürümleri yayımlayacak bir yer sağlar
ve OpenClaw'a bu paketleri güvenli şekilde kurup güncellemek için yeterli
metadata verir.

## Kayıt kayıtları

Her herkese açık listeleme şunları içeren bir kayıt kaydıdır:

- bir sahip ve slug ya da paket adı
- bir veya daha fazla yayımlanmış sürüm
- metadata, özet, dosyalar ve kaynak atfı
- `latest` gibi değişiklik günlüğü ve etiket bilgileri
- indirme, kurulum, yıldız ve yorum sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir skill veya Plugin'in kurulumdan önce ne
yaptığını iddia ettiğini inceleyebileceği kanonik yerdir.

## Skills

Bir skill, `SKILL.md` merkezli sürümlenmiş bir metin paketidir. Destekleyici
dosyalar, örnekler, şablonlar ve betikler içerebilir.

ClawHub, skill adını, açıklamasını, gereksinimlerini, ortam değişkenlerini ve
metadata'yı anlamak için `SKILL.md` frontmatter'ını okur. Doğru metadata
önemlidir; çünkü kullanıcıların skill'i kurup kurmamaya karar vermesine yardımcı
olur ve otomatik taramaların bildirilen davranış ile gözlemlenen davranış
arasındaki uyumsuzlukları tespit etmesini sağlar.

Bkz. [Skill biçimi](/tr/clawhub/skill-format).

## Plugin'ler

Plugin'ler paketlenmiş OpenClaw uzantılarıdır. ClawHub paket metadata'sını,
uyumluluk bilgilerini, kaynak bağlantılarını, artifact'leri ve sürüm kayıtlarını
saklar.

OpenClaw, ClawHub'dan bir Plugin kurduğunda, kurulumdan önce duyurulan uyumluluk
metadata'sını kontrol eder. Paket kayıtları API uyumluluğunu, minimum Gateway
sürümünü, ana makine hedeflerini, ortam gereksinimlerini ve artifact özetlerini
içerebilir.

Kayıt katmanının doğruluk kaynağı olmasını istediğinizde açık bir ClawHub kurulum
kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayımlama

Yayımlama yeni, değiştirilemez bir sürüm kaydı oluşturur. Yayıncılar kimlik
doğrulamalı kayıt iş akışları için `clawhub` CLI'sini kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenmiş payload'u önizlemek için kuru çalıştırmaları
kullanın. Herkese açık sayfalar daha sonra yayımlanan metadata'yı, dosyaları,
kaynak atfını ve tarama durumunu gösterir.

## Kurulumlar ve güncellemeler

OpenClaw kurulum komutları ClawHub'ı paket kaynağı olarak kullanır:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw kurulum kaynağı metadata'sını kaydeder; böylece güncellemeler daha
sonra aynı kayıt paketini çözümleyebilir. ClawHub CLI ayrıca tam bir OpenClaw
çalışma alanı dışında kayıt yönetimli skill klasörleri isteyen kullanıcılar için
doğrudan skill kurulum ve güncelleme iş akışlarını destekler.

## Güvenlik durumu

ClawHub yayımlamaya açıktır, ancak sürümler yine de yükleme kapılarına,
otomatik kontrollere, kullanıcı raporlarına ve moderatör işlemine tabidir.

Herkese açık sayfalar, mevcut olduğunda tarama özetlerini gösterir. Tutulan,
gizlenen veya engellenen içerik, teşhis için sahibine görünür kalırken herkese
açık arama ve kurulum akışlarından kaybolabilir.

Bkz. [Güvenlik + moderasyon](/tr/clawhub/security) ve
[Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage).

## API erişimi

ClawHub keşif, arama, paket ayrıntıları ve indirmeler için herkese açık okuma
API'leri sunar. Üçüncü taraf kataloglar, kanonik ClawHub listelemesine bağlantı
verdiklerinde, hız sınırlarına uyduklarında ve onay ima etmekten kaçındıklarında
bu API'leri kullanabilir.

Bkz. [Herkese açık API](/tr/clawhub/api) ve [HTTP API](/tr/clawhub/http-api).

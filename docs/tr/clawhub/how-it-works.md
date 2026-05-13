---
read_when:
    - Listelemeleri, sürümleri, kurulumları, yayımlamayı ve moderasyonu anlama
summary: ClawHub listelemelerinin, sürümlerinin, kurulumlarının, yayımlamanın, taramaların ve güncellemelerin nasıl çalıştığı.
x-i18n:
    generated_at: "2026-05-13T02:50:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub Nasıl Çalışır

ClawHub, OpenClaw becerileri ve pluginleri için kayıt katmanıdır. Kullanıcılara
paketleri keşfedecekleri bir yer, yayıncılara sürümleri yayımlayacakları bir
yer sağlar ve OpenClaw'a bu paketleri güvenli biçimde kurup güncellemek için
yeterli meta veri verir.

## Kayıt deposu kayıtları

Her herkese açık listeleme şunları içeren bir kayıt deposu kaydıdır:

- bir sahip ve kısa ad ya da paket adı
- bir veya daha fazla yayımlanmış sürüm
- meta veri, özet, dosyalar ve kaynak atfı
- `latest` gibi değişiklik günlüğü ve etiket bilgileri
- indirme, kurulum, yıldız ve yorum sinyalleri
- güvenlik taraması ve moderasyon durumu

Listeleme sayfası, kullanıcıların bir becerinin veya pluginin kurmadan önce ne
yaptığını iddia ettiğini inceleyebilecekleri kanonik yerdir.

## Skills

Bir beceri, `SKILL.md` merkezli sürümlenmiş bir metin paketidir. Destekleyici
dosyalar, örnekler, şablonlar ve betikler içerebilir.

ClawHub, beceri adını, açıklamasını, gereksinimlerini, ortam değişkenlerini ve
meta verilerini anlamak için `SKILL.md` ön maddesini okur. Doğru meta veriler
önemlidir çünkü kullanıcıların beceriyi kurup kurmamaya karar vermesine yardımcı
olur ve otomatik taramaların bildirilen davranış ile gözlemlenen davranış
arasındaki uyuşmazlıkları tespit etmesine yardımcı olur.

Bkz. [Beceri biçimi](/tr/clawhub/skill-format).

## Pluginler

Pluginler, paketlenmiş OpenClaw uzantılarıdır. ClawHub paket meta verilerini,
uyumluluk bilgilerini, kaynak bağlantılarını, yapıtları ve sürüm kayıtlarını
depolar.

OpenClaw, ClawHub'dan bir plugin kurduğunda, kurulumdan önce duyurulan uyumluluk
meta verilerini denetler. Paket kayıtları API uyumluluğu, minimum Gateway
sürümü, ana makine hedefleri, ortam gereksinimleri ve yapıt özetleri içerebilir.

Kayıt deposunun doğruluk kaynağı olmasını istediğinizde açık bir ClawHub kurulum
kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

## Yayımlama

Yayımlama, yeni ve değiştirilemez bir sürüm kaydı oluşturur. Yayıncılar,
kimlik doğrulamalı kayıt deposu iş akışları için `clawhub` CLI'ını kullanır:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Yüklemeden önce çözümlenen yükü önizlemek için kuru çalıştırmaları kullanın.
Herkese açık sayfalar daha sonra yayımlanan meta verileri, dosyaları, kaynak
atfını ve tarama durumunu gösterir.

## Kurulumlar ve güncellemeler

OpenClaw kurulum komutları ClawHub'ı paket kaynağı olarak kullanır:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw, güncellemelerin daha sonra aynı kayıt deposu paketini çözebilmesi için
kurulum kaynağı meta verilerini kaydeder. ClawHub CLI, tam bir OpenClaw çalışma
alanı dışında kayıt deposu tarafından yönetilen beceri klasörleri isteyen
kullanıcılar için doğrudan beceri kurulum ve güncelleme iş akışlarını da
destekler.

## Güvenlik durumu

ClawHub yayımlamaya açıktır, ancak sürümler yine de yükleme kapılarına, otomatik
denetimlere, kullanıcı raporlarına ve moderatör işlemine tabidir.

Herkese açık sayfalar, kullanılabilir olduğunda tarama özetlerini gösterir.
Tutulan, gizlenen veya engellenen içerikler, tanılama için sahibine görünür
kalmaya devam ederken herkese açık arama ve kurulum akışlarından kaybolabilir.

Bkz. [Güvenlik + moderasyon](/tr/clawhub/security) ve
[Kabul edilebilir kullanım](/tr/clawhub/acceptable-usage).

## API erişimi

ClawHub keşif, arama, paket ayrıntıları ve indirmeler için herkese açık okuma
API'leri sunar. Üçüncü taraf kataloglar, kanonik ClawHub listelemesine geri
bağlantı verdiklerinde, hız sınırlarına uyduklarında ve onaylandıkları izlenimi
yaratmaktan kaçındıklarında bu API'leri kullanabilir.

Bkz. [Herkese açık API](/tr/clawhub/api) ve [HTTP API](/tr/clawhub/http-api).

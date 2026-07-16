---
read_when:
    - Uç noktaları ekleme/değiştirme
    - CLI ↔ kayıt defteri isteklerinde hata ayıklama
summary: HTTP API referansı (genel + CLI uç noktaları + kimlik doğrulama).
x-i18n:
    generated_at: "2026-07-16T17:09:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

Temel URL: `https://clawhub.ai` (varsayılan).

Tüm v1 yolları `/api/v1/...` altındadır.
Eski `/api/...` ve `/api/cli/...` uyumluluk için korunmaktadır (bkz. `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Herkese açık kataloğun yeniden kullanımı

Üçüncü taraf dizinler, ClawHub skills'lerini listelemek veya aramak için herkese açık okuma uç noktalarını kullanabilir. Lütfen sonuçları önbelleğe alın, `429`/`Retry-After` değerlerine uyun, kullanıcıları standart ClawHub listesine (`https://clawhub.ai/<owner>/skills/<slug>`) geri yönlendirin ve ClawHub'ın üçüncü taraf siteyi desteklediği izlenimini vermekten kaçının. Herkese açık API yüzeyi dışında gizli, özel veya moderasyon tarafından engellenmiş içeriği yansıtmaya çalışmayın.

Web slug kısayolları kayıt defteri aileleri genelinde çözümlenir, ancak API istemcileri rota
önceliğini yeniden oluşturmak yerine okuma uç noktalarının döndürdüğü standart URL'leri
kullanmalıdır.

## Hız sınırları

Uygulama modeli:

- Anonim istekler: IP başına uygulanır.
- Kimliği doğrulanmış istekler (geçerli Bearer token): kullanıcı dilimi başına uygulanır.
- Token eksik/geçersizse davranış IP tabanlı uygulamaya geri döner.
- Kimliği doğrulanmış yazma uç noktaları, sunucu nedeni biliyorsa yalnızca `Unauthorized` döndürmemelidir.
  Eksik token'lar, geçersiz/iptal edilmiş token'lar ve silinmiş/yasaklanmış/devre dışı bırakılmış
  hesapların her biri, CLI istemcilerinin kullanıcıları neyin engellediğini
  bildirebilmesi için eyleme dönüştürülebilir metin almalıdır.

- Okuma: IP başına 3000/dk., anahtar başına 12000/dk.
- Yazma: IP başına 300/dk., anahtar başına 3000/dk.
- İndirme: IP başına 1200/dk., anahtar başına 6000/dk. (indirme uç noktaları)

Üstbilgiler:

- Eski uyumluluk: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Standartlaştırılmış: `RateLimit-Limit`, `RateLimit-Reset`
- `429` durumunda: `X-RateLimit-Remaining: 0` ve `RateLimit-Remaining: 0`
- `429` durumunda: `Retry-After`

Üstbilgi anlamları:

- `X-RateLimit-Reset`: mutlak Unix epoch saniyeleri
- `RateLimit-Reset`: sıfırlamaya kadar geçen saniye (gecikme)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: mevcut olduğunda tam kalan kota.
  Parçalanmış başarılı istekler, yaklaşık bir genel değer döndürmek yerine bu üstbilgiyi atlar.
- `Retry-After`: `429` durumunda yeniden denemeden önce beklenecek saniye (gecikme)

Örnek `429` yanıtı:

```http
HTTP/2 429
content-type: text/plain; charset=utf-8
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34

Hız sınırı aşıldı
```

İstemci rehberi:

- `Retry-After` mevcutsa yeniden denemeden önce belirtilen saniye kadar bekleyin.
- Eş zamanlı yeniden denemeleri önlemek için rastgele sapmalı geri çekilme kullanın.
- `Retry-After` eksikse `RateLimit-Reset` değerine geri dönün (veya `X-RateLimit-Reset` üzerinden hesaplayın).

IP kaynağı:

- `cf-connecting-ip` dahil güvenilir istemci IP üstbilgilerini yalnızca dağıtım,
  güvenilir iletilen üstbilgileri açıkça etkinleştirdiğinde kullanır.
- ClawHub, istemci IP'lerini uç noktada belirlemek için güvenilir yönlendirme üstbilgilerini kullanır.
- Güvenilir bir istemci IP'si yoksa anonim istekler yalnızca hız sınırı türüne
  göre kapsamlandırılmış yedek dilimleri kullanır. Bu yedek dilimler arayan tarafından sağlanan
  yolları, slug'ları, paket adlarını, sürümleri, sorgu dizelerini veya diğer
  yapıt parametrelerini içermez.

## Hata yanıtları

Herkese açık v1 hata yanıtları `content-type: text/plain; charset=utf-8` ile düz metin biçimindedir.
Buna doğrulama hataları (`400`), eksik herkese açık kaynaklar (`404`), kimlik doğrulama ve
izin hataları (`401`/`403`), hız sınırları (`429`) ve engellenmiş indirmeler dahildir. İstemciler
yanıt gövdesini insanların okuyabileceği bir dize olarak okumalıdır. Bilinmeyen sorgu parametreleri
uyumluluk için yok sayılır, ancak tanınan sorgu parametreleri geçersiz değerlere sahipse
`400` döndürülür.

## Herkese açık uç noktalar (kimlik doğrulama yok)

### `GET /api/v1/search`

Sorgu parametreleri:

- `q` (zorunlu): sorgu dizesi
- `limit` (isteğe bağlı): tam sayı
- `highlightedOnly` (isteğe bağlı): öne çıkarılan skills ile filtrelemek için `true`
- `nonSuspiciousOnly` (isteğe bağlı): şüpheli (`flagged.suspicious`) skills'leri gizlemek için `true`
- `nonSuspicious` (isteğe bağlı): `nonSuspiciousOnly` için eski takma ad

Yanıt:

```json
{
  "results": [
    {
      "score": 0.123,
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "version": "1.2.3",
      "updatedAt": 1730000000000,
      "ownerHandle": "openclaw",
      "owner": {
        "handle": "openclaw",
        "displayName": "OpenClaw",
        "image": "https://example.com/avatar.png"
      }
    }
  ]
}
```

Notlar:

- Sonuçlar ilgi sırasına göre döndürülür (gömme benzerliği + tam slug/ad token güçlendirmeleri + küçük bir popülerlik önceliği).
- İlgi, popülerlikten daha etkilidir. Tam bir slug veya görünen ad token eşleşmesi, çok daha güçlü etkileşime sahip daha gevşek bir eşleşmeden üst sırada olabilir.
- ASCII metni, sözcük ve noktalama sınırlarında token'lara ayrılır. Örneğin `personal-map` bağımsız bir `map` token'ı içerirken `amap-jsapi-skill`, `amap`, `jsapi` ve `skill` içerir; bu nedenle `map` araması, `personal-map` için `amap-jsapi-skill` değerinden daha güçlü bir sözcüksel eşleşme sağlar.
- Popülerlik logaritmik olarak ölçeklendirilir ve üst sınırla kısıtlanır. Yüksek etkileşimli skills, sorgu metniyle daha zayıf eşleştiklerinde daha alt sıralarda yer alabilir.
- Şüpheli veya gizli moderasyon durumu, arayanın filtrelerine ve mevcut moderasyon durumuna bağlı olarak bir skill'i herkese açık aramadan kaldırabilir.

Yayıncıların keşfedilebilirlik rehberi:

- Kullanıcıların gerçekten arayacağı terimleri görünen ada, özete ve etiketlere ekleyin. Bağımsız bir slug token'ını yalnızca korumak istediğiniz kararlı bir kimlikse kullanın.
- Yeni slug daha iyi, uzun vadeli standart bir ad olmadıkça yalnızca tek bir sorguyu hedeflemek için slug'ı yeniden adlandırmayın. Eski slug'lar yönlendirme takma adlarına dönüşür, ancak standart URL, görüntülenen slug ve gelecekteki arama özetleri yeni slug'ı kullanır.
- Yeniden adlandırma takma adları, kayıt defteri üzerinden çözümlenen eski URL'ler ve kurulumlar için çözümlemeyi korur; ancak arama sıralaması, yeniden adlandırma dizine eklendikten sonra standart skill meta verilerine dayanır. Mevcut istatistikler skill ile birlikte kalır.
- Bir skill beklenmedik şekilde görünmüyorsa sıralamayla ilgili meta verileri değiştirmeden önce oturum açmış durumdayken `clawhub inspect @owner/slug` ile moderasyon durumunu kontrol edin.

### `GET /api/v1/skills`

Sorgu parametreleri:

- `limit` (isteğe bağlı): tam sayı (1–200)
- `cursor` (isteğe bağlı): `trending` dışındaki tüm sıralamalar için sayfalama imleci
- `sort` (isteğe bağlı): `updated` (varsayılan), `recommended` (takma ad: `default`), `createdAt` (takma ad: `newest`), `downloads`, `stars` (takma ad: `rating`), eski kurulum takma adları `installsCurrent`/`installs`/`installsAllTime`, `downloads` değerine eşlenir, `trending`
- `nonSuspiciousOnly` (isteğe bağlı): şüpheli (`flagged.suspicious`) skills'leri gizlemek için `true`
- `nonSuspicious` (isteğe bağlı): `nonSuspiciousOnly` için eski takma ad

Geçersiz `sort` değerleri `400` döndürür.

Notlar:

- `recommended` etkileşim ve güncellik sinyallerini kullanır.
- `trending` son 7 gündeki kurulumlara göre sıralama yapar (telemetri tabanlı).
- `createdAt` yeni skill taramaları için kararlıdır; mevcut skills yeniden yayımlandığında `updated` değişir.
- `nonSuspiciousOnly=true` olduğunda, şüpheli skills sayfa alındıktan sonra filtrelendiği için imleç tabanlı sıralamalar bir sayfada `limit` öğeden daha azını döndürebilir.
- Mevcut olduğunda sayfalamaya devam etmek için `nextCursor` kullanın. Kısa bir sayfa tek başına sonuçların sona erdiği anlamına gelmez.

Yanıt:

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "topics": ["Productivity"],
      "tags": { "latest": "1.2.3" },
      "stats": {},
      "createdAt": 0,
      "updatedAt": 0,
      "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
      "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] }
    }
  ],
  "nextCursor": null
}
```

### `GET /api/v1/skills/{slug}`

Yanıt:

```json
{
  "skill": {
    "slug": "gifgrep",
    "displayName": "GifGrep",
    "summary": "…",
    "topics": ["Productivity"],
    "tags": { "latest": "1.2.3" },
    "stats": {},
    "createdAt": 0,
    "updatedAt": 0
  },
  "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
  "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] },
  "owner": { "handle": "steipete", "displayName": "Peter", "image": null },
  "moderation": {
    "isSuspicious": false,
    "isMalwareBlocked": false,
    "verdict": "clean",
    "reasonCodes": [],
    "summary": null,
    "engineVersion": "v2.0.0",
    "updatedAt": 0
  }
}
```

Notlar:

- Sahibin yeniden adlandırma/birleştirme akışlarıyla oluşturulan eski slug'lar standart skill'e çözümlenir.
- `metadata.os`: skill frontmatter'ında bildirilen işletim sistemi kısıtlamaları (ör. `["macos"]`, `["linux"]`). Bildirilmemişse `null`.
- `metadata.systems`: Nix sistem hedefleri (ör. `["aarch64-darwin", "x86_64-linux"]`). Bildirilmemişse `null`.
- Skill'in platform meta verileri yoksa `metadata`, `null` olur.
- `moderation` yalnızca skill işaretlendiğinde veya sahibi onu görüntülerken eklenir.

### `GET /api/v1/skills/{slug}/moderation`

Yapılandırılmış moderasyon durumunu döndürür.

Yanıt:

```json
{
  "moderation": {
    "isSuspicious": true,
    "isMalwareBlocked": false,
    "verdict": "suspicious",
    "reasonCodes": ["suspicious.dynamic_code_execution"],
    "summary": "Algılandı: suspicious.dynamic_code_execution",
    "engineVersion": "v2.0.0",
    "updatedAt": 0,
    "legacyReason": null,
    "evidence": [
      {
        "code": "suspicious.dynamic_code_execution",
        "severity": "critical",
        "file": "index.ts",
        "line": 3,
        "message": "Dinamik kod yürütme algılandı.",
        "evidence": ""
      }
    ]
  }
}
```

Notlar:

- Sahipler ve moderatörler gizli skills için moderasyon ayrıntılarına erişebilir.
- Herkese açık arayanlar yalnızca önceden işaretlenmiş görünür skills için `200` alır.
- Kanıtlar herkese açık arayanlar için sansürlenir ve ham parçacıkları yalnızca sahipler/moderatörler için içerir.

### `POST /api/v1/skills/{slug}/report`

Bir skill'i moderatör incelemesi için bildirin. Bildirimler skill düzeyindedir, isteğe bağlı olarak
bir sürüme bağlanır ve skill bildirim kuyruğunu besler.

Kimlik doğrulama:

- Bir API token'ı gerektirir.

İstek:

```json
{ "reason": "Şüpheli kurulum adımı", "version": "1.2.3" }
```

Yanıt:

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "reportId": "skillReports:...",
  "skillId": "skills:...",
  "reportCount": 1
}
```

### `GET /api/v1/skills/-/reports`

Skill bildirimlerini almak için moderatör/yönetici uç noktası.

Sorgu parametreleri:

- `status` (isteğe bağlı): `open` (varsayılan), `confirmed`, `dismissed` veya `all`
- `limit` (isteğe bağlı): tam sayı (1-200)
- `cursor` (isteğe bağlı): sayfalama imleci

Yanıt:

```json
{
  "items": [
    {
      "reportId": "skillReports:...",
      "skillId": "skills:...",
      "skillVersionId": "skillVersions:...",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "version": "1.2.3",
      "reason": "Şüpheli yükleme adımı",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Bildiren"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/skills/-/reports/{reportId}/triage`

Skill bildirimlerini çözümlemeye veya yeniden açmaya yönelik moderatör/yönetici uç noktası.

İstek:

```json
{ "status": "confirmed", "note": "İncelendi ve etkilenen sürüm gizlendi.", "finalAction": "hide" }
```

`note`, `confirmed` ve `dismissed` için gereklidir; `status`
yeniden `open` olarak ayarlanırken atlanabilir. Skill'i aynı denetlenebilir iş akışında
gizlemek için önceliklendirilmiş bir bildirimle `finalAction: "hide"` iletin.

### `GET /api/v1/skills/{slug}/versions`

Sorgu parametreleri:

- `limit` (isteğe bağlı): tam sayı
- `cursor` (isteğe bağlı): sayfalama imleci

### `GET /api/v1/skills/{slug}/versions/{version}`

Sürüm meta verilerini ve dosya listesini döndürür.

- `version.security`, mevcut olduğunda normalleştirilmiş tarama doğrulama durumunu ve
  tarayıcı ayrıntılarını (VirusTotal + LLM) içerir.

### `GET /api/v1/skills/{slug}/scan`

Bir skill sürümünün güvenlik taraması doğrulama ayrıntılarını döndürür.

Sorgu parametreleri:

- `version` (isteğe bağlı): belirli bir sürüm dizesi.
- `tag` (isteğe bağlı): etiketlenmiş bir sürümü çözümle (örneğin `latest`).

Notlar:

- Ne `version` ne de `tag` sağlanırsa en son sürümü kullanır.
- Normalleştirilmiş doğrulama durumunun yanı sıra tarayıcıya özgü ayrıntıları içerir.
- `security.hasScanResult`, yalnızca bir tarayıcı kesin bir karar (`clean`, `suspicious` veya `malicious`) ürettiğinde `true` olur.
- `moderation`, en son sürümden türetilen güncel bir skill düzeyi moderasyon anlık görüntüsüdür.
- Geçmiş bir sürüm sorgulanırken `moderation` ve `security` değerlerini aynı sürüm bağlamı olarak değerlendirmeden önce `moderation.matchesRequestedVersion` ve `moderation.sourceVersion` değerlerini kontrol edin.

### `POST /api/v1/skills/-/scan`

Yeni ClawScan işleri için kimliği doğrulanmış gönderim uç noktası.

Yerel yükleme taramaları artık desteklenmemektedir. `multipart/form-data` veya
`{ "source": { "kind": "upload" } }` kullanan istekler `410` döndürür.

Yayımlanmış taramalar JSON kullanır:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Notlar:

- Tarama isteği yükleri ve indirilebilir raporların süresi, saklama aralığından sonra tarama isteği deposunda dolar.
- Yayımlanmış taramalar, sahip/yayımcı yönetim erişimi veya platform moderatörü/yöneticisi yetkisi gerektirir.
- Yayımlanmış taramalar yalnızca `update: true` olduğunda ve tarama başarıyla tamamlandığında geri yazar.
- Yanıt, `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` ile birlikte `202` olur.
- Tarama işleri eş zamansızdır. Manuel tarama isteklerine normal yayımlama/geçmişi doldurma işlerinden önce öncelik verilir, ancak tamamlanma yine de çalışan kullanılabilirliğine bağlıdır.

### `GET /api/v1/skills/-/scan/{scanId}`

Gönderilmiş bir tarama için kimliği doğrulanmış yoklama uç noktası.

- Kuyrukta/çalışıyor/başarılı/başarısız durumunu döndürür.
- İstemcilerin isteğin önünde kaç tane önceliklendirilmiş manuel tarama bulunduğunu gösterebilmesi için kuyruktayken `queue.queuedAhead` ve `queue.position` değerlerini döndürür. Çok büyük kuyruklar sınırlandırılır ve `queuedAheadIsEstimate: true` ile bildirilir.
- Mevcut olduğunda `report`; `clawscan`, `skillspector`, `staticAnalysis` ve `virustotal` bölümlerini içerir.
- Başarısız tarama işleri, `lastError` ile birlikte `status: "failed"` döndürür.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Kimliği doğrulanmış rapor arşivi uç noktası.

- Başarılı bir tarama gerektirir; sonlandırılmamış taramalar `409` döndürür.
- `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` ve `README.md` içeren bir ZIP döndürür.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Gönderilmiş sürümler için kimliği doğrulanmış, depolanan rapor arşivi uç noktası.

- Skill veya plugin için sahip/yayımcı yönetim erişimi ya da platform moderatörü/yöneticisi yetkisi gerektirir.
- Engellenmiş veya gizlenmiş sürümler dâhil olmak üzere tam olarak gönderilen sürümün depolanan tarama sonuçlarını döndürür.
- `kind` varsayılan olarak `skill` değerini alır; plugin/paket taramaları için `kind=plugin` kullanın.
- Tarama isteği indirmeleriyle aynı ZIP yapısını döndürür.

### `POST /api/v1/skills/-/scan/batch`

Yalnızca yöneticilere açık standart toplu yeniden tarama rotası. Eski `POST /api/v1/skills/-/rescan-batch` ile aynı yük yapısını kabul eder.

### `POST /api/v1/skills/-/scan/batch/status`

Yalnızca yöneticilere açık standart toplu durum rotası. `{ "jobIds": ["..."] }` değerini kabul eder ve eski `POST /api/v1/skills/-/rescan-batch/status` ile aynı toplu sayaçları döndürür.

### `GET /api/v1/skills/{slug}/verify`

`clawhub skill verify` tarafından kullanılan Skill Kartı doğrulama zarfını döndürür.

Sorgu parametreleri:

- `version` (isteğe bağlı): belirli bir sürüm dizesi.
- `tag` (isteğe bağlı): etiketlenmiş bir sürümü çözümle (örneğin `latest`).

Notlar:

- `ok`, yalnızca seçilen sürüm oluşturulmuş bir Skill Kartına sahip olduğunda, moderasyon tarafından kötü amaçlı yazılım nedeniyle engellenmediğinde ve ClawScan doğrulaması temiz olduğunda `true` olur.
- Kabuk otomasyonunun iç içe sarmalayıcıları açmadan okuyabilmesi için skill kimliği, yayımcı kimliği ve seçilen sürüm meta verileri üst düzey zarf alanlarıdır (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`).
- `security`, üst düzey ClawScan/güvenlik kararıdır. Otomasyon; `ok`, `decision`, `reasons` ve `security.status` değerlerini temel almalıdır.
- `security.signals`; `staticScan`, `virusTotal` ve `skillSpector` gibi destekleyici tarayıcı kanıtlarını içerir.
- `security.signals.dependencyRegistry`, v1 yanıt uyumluluğu için korunur; ancak bağımlılık kayıt defteri varlık tarayıcısı kullanımdan kaldırılmıştır ve bu anahtar her zaman `null` olur.
- `provenance`, yalnızca ClawHub yayımlama veya içe aktarma sırasında bir GitHub deposunu/referansını/işlemesini/yolunu çözümleyip depoladığında `server-resolved-github-import` olur; aksi hâlde `unavailable` olur.

### `POST /api/v1/skills/-/security-verdicts`

Tam skill sürümleri için güncel kompakt güvenlik kararlarını döndürür. Bu
koleksiyon uç noktası, OpenClaw Control UI gibi hangi yüklü ClawHub skill
sürümlerini görüntülemesi gerektiğini zaten bilen istemciler için tasarlanmıştır.

İstek:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Notlar:

- `items`, 1-100 benzersiz `{ slug, version }` çifti içermelidir.
- Sonuçlar öğe bazındadır; eksik bir skill veya sürüm tüm yanıtın başarısız olmasına neden olmaz.
- Yanıt yalnızca güvenlikle ilgilidir. Skill Kartı verilerini, oluşturulan kart durumunu, yapıt dosyası listelerini veya ayrıntılı tarayıcı yüklerini içermez.
- `security.signals`, yalnızca durum düzeyinde destekleyici kanıtlar içerir; tam tarayıcı ayrıntıları için `/scan` veya ClawHub güvenlik denetimi sayfasını kullanın.
- `security.signals.dependencyRegistry`, v1 yanıt uyumluluğu için korunur; ancak bağımlılık kayıt defteri varlık tarayıcısı kullanımdan kaldırılmıştır ve bu anahtar her zaman `null` olur.
- Skill Kartının bulunmaması bu uç noktanın `ok`, `decision` veya `reasons` değerlerini etkilemez; istemciler kart içeriğine ihtiyaç duyduklarında yüklü `skill-card.md` değerini yerel olarak okumalıdır.
- Tek skill için Skill Kartı doğrulama zarfına ihtiyaç duyduğunuzda `/verify`, oluşturulan kart Markdown'ına ihtiyaç duyduğunuzda `/card`, ayrıntılı tarayıcı verilerine ihtiyaç duyduğunuzda ise `/scan` kullanın.

Yanıt:

```json
{
  "schema": "clawhub.skill.security-verdicts.v1",
  "items": [
    {
      "ok": true,
      "decision": "pass",
      "reasons": [],
      "requestedSlug": "gifgrep",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "publisherHandle": "steipete",
      "publisherDisplayName": "Peter",
      "requestedVersion": "1.2.3",
      "version": "1.2.3",
      "createdAt": 0,
      "checkedAt": 0,
      "skillUrl": "https://clawhub.ai/steipete/skills/gifgrep",
      "securityAuditUrl": "https://clawhub.ai/steipete/skills/gifgrep/security-audit?version=1.2.3",
      "security": {
        "status": "clean",
        "passed": true,
        "signals": {
          "staticScan": { "status": "clean", "reasonCodes": [] },
          "virusTotal": null,
          "skillSpector": null,
          "dependencyRegistry": null
        }
      }
    },
    {
      "ok": false,
      "decision": "fail",
      "reasons": ["version.not_found"],
      "requestedSlug": "missing-version",
      "requestedVersion": "1.0.0",
      "error": { "code": "version_not_found", "message": "Sürüm bulunamadı" },
      "security": null
    }
  ]
}
```

### `GET /api/v1/skills/{slug}/file`

Ham metin içeriğini döndürür.

Sorgu parametreleri:

- `path` (gerekli)
- `version` (isteğe bağlı)
- `tag` (isteğe bağlı)

Notlar:

- Varsayılan olarak en son sürümü kullanır.
- Dosya boyutu sınırı: 200KB.

### `GET /api/v1/packages`

Şunlar için birleşik katalog uç noktası:

- skill'ler
- kod plugin'leri
- paket plugin'leri

Sorgu parametreleri:

- `limit` (isteğe bağlı): tam sayı (1–100)
- `cursor` (isteğe bağlı): sayfalama imleci
- `family` (isteğe bağlı): `skill`, `code-plugin` veya `bundle-plugin`
- `channel` (isteğe bağlı): `official`, `community` veya `private`
- `isOfficial` (isteğe bağlı): `true` veya `false`
- `sort` (isteğe bağlı): `updated` (varsayılan), `recommended`, `trending`, `downloads`, eski takma ad `installs`
- `category` (isteğe bağlı): plugin kategorisi filtresi. Yalnızca istek
  plugin paketleriyle sınırlandırıldığında desteklenir (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` veya `family=code-plugin`/`family=bundle-plugin`
  içeren paket uç noktaları). Denetimli kategoriler ve eski v1 filtre takma
  adları `GET /api/v1/plugins` altında belgelenmiştir.

Notlar:

- `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` veya `sort` için geçersiz değerler `400` döndürür. Bilinmeyen sorgu parametreleri yok sayılır.
- `GET /api/v1/code-plugins` ve `GET /api/v1/bundle-plugins`, sabit aile takma adları olarak kalır.
- Skill girdileri skill kayıt defteri tarafından desteklenmeye devam eder ve hâlâ yalnızca `POST /api/v1/skills` aracılığıyla yayımlanabilir.
- `POST /api/v1/packages`, hâlâ yalnızca kod plugin'i ve paket plugin'i sürümleri içindir.
- Anonim çağıranlar yalnızca herkese açık paket kanallarını görür.
- Kimliği doğrulanmış çağıranlar, ait oldukları yayımcıların özel paketlerini listeleme/arama sonuçlarında görebilir.
- `channel=private`, yalnızca kimliği doğrulanmış çağıranın okuyabildiği paketleri döndürür.

### `GET /api/v1/packages/search`

Skill'ler ve plugin paketleri genelinde birleşik katalog araması.

Sorgu parametreleri:

- `q` (zorunlu): sorgu dizesi
- `limit` (isteğe bağlı): tam sayı (1–100)
- `family` (isteğe bağlı): `skill`, `code-plugin` veya `bundle-plugin`
- `channel` (isteğe bağlı): `official`, `community` veya `private`
- `isOfficial` (isteğe bağlı): `true` veya `false`
- `category` (isteğe bağlı): Plugin kategori filtresi. Yalnızca istek
  Plugin paketleriyle sınırlandırıldığında desteklenir. Denetlenen kategoriler ve eski v1
  filtre takma adları `GET /api/v1/plugins` altında belgelenmiştir.

Notlar:

- `family`, `channel`, `isOfficial`, `featured` veya
  `highlightedOnly` için geçersiz değerler `400` döndürür. Bilinmeyen sorgu parametreleri yok sayılır.
- Anonim çağıranlar yalnızca herkese açık paket kanallarını görür.
- Kimliği doğrulanmış çağıranlar, üyesi oldukları yayıncılara ait özel paketlerde arama yapabilir.
- `channel=private` yalnızca kimliği doğrulanmış çağıranın okuyabildiği paketleri döndürür.

### `GET /api/v1/plugins`

Kod Plugin ve paket Plugin paketleri genelinde yalnızca Plugin içeren katalog taraması.

Sorgu parametreleri:

- `limit` (isteğe bağlı): tam sayı (1-100)
- `cursor` (isteğe bağlı): sayfalandırma imleci
- `isOfficial` (isteğe bağlı): `true` veya `false`
- `sort` (isteğe bağlı): `recommended` (varsayılan), `trending`, `downloads`, `updated`, eski takma ad `installs`
- `category` (isteğe bağlı): Plugin kategori filtresi. Geçerli değerler:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Eski v1 filtre takma adları okuma uç noktalarında kabul edilmeye devam eder:

- `mcp-tooling`, `data` ve `automation`, `tools` olarak çözümlenir.
- `observability` ve `deployment`, `gateway` olarak çözümlenir.
- `dev-tools`, `runtime` olarak çözümlenir.

`trending`, yedi günlük yükleme/indirme liderlik tablosudur ve tüm zamanların toplamlarını kullanmaz.
Birleştirilmiş `/api/v1/packages` uç noktasında yalnızca Plugin içindir; beceri kataloğu için
`/api/v1/skills?sort=trending` kullanın.

Eski takma adlar, depolanan veya yazar tarafından bildirilen kategori değerleri olarak kabul edilmez.

### `GET /api/v1/skills/export`

Çevrimdışı analiz için en yeni herkese açık becerilerin toplu dışa aktarımı.

Kimlik doğrulama:

- API belirteci zorunludur.

Sorgu parametreleri:

- `startDate` (zorunlu): Beceri `updatedAt` için Unix milisaniye alt sınırı.
- `endDate` (zorunlu): Beceri `updatedAt` için Unix milisaniye üst sınırı.
- `limit` (isteğe bağlı): tam sayı (1-250), varsayılan `250`.
- `cursor` (isteğe bağlı): önceki yanıttaki sayfalandırma imleci.

Yanıt:

- Gövde: ZIP arşivi.
- Dışa aktarılan her becerinin kökü `{publisher}/{slug}/` konumundadır.
- Barındırılan beceriler, depolanan en son sürüm dosyalarını içerir ve
  `sourceRef: "public-clawhub"` ile birlikte `_manifest.json` içinde listelenir.
- `clean` veya `suspicious` taramasına sahip geçerli GitHub destekli beceriler;
  `sourceRef: "public-github"`, depo, commit, yol,
  içerik karması ve arşiv URL'siyle birlikte `_source_handoff.json` içerir. ClawHub tarafından barındırılan kaynak dosyalarını içermezler.
- Her beceri `_export_skill_meta.json` içerir.
- `_manifest.json` her zaman ZIP kökünde bulunur.
- `_errors.json`, tek tek beceriler veya dosyalar dışa aktarılamadığında
  eklenir.

Üst bilgiler:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Çevrimdışı analiz için en yeni herkese açık Plugin sürümlerinin toplu dışa aktarımı.

Kimlik doğrulama:

- API belirteci zorunludur.

Sorgu parametreleri:

- `startDate` (zorunlu): Plugin `updatedAt` için Unix milisaniye alt sınırı.
- `endDate` (zorunlu): Plugin `updatedAt` için Unix milisaniye üst sınırı.
- `limit` (isteğe bağlı): tam sayı (1-250), varsayılan `250`.
- `cursor` (isteğe bağlı): önceki yanıttaki sayfalandırma imleci.
- `family` (isteğe bağlı): `code-plugin` veya `bundle-plugin`. Belirtilmemesi her iki
  Plugin ailesi anlamına gelir.

Yanıt:

- Gövde: ZIP arşivi.
- Dışa aktarılan her Plugin'in kökü `{family}/{packageName}/` konumundadır.
- Dışa aktarılan her Plugin, en son sürümün depolanan dosyalarını içerir.
- Plugin başına dışa aktarma meta verileri
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` konumunda depolanır.
- `_manifest.json` her zaman ZIP kökünde bulunur.
- `_errors.json`, tek tek Plugin'ler veya dosyalar dışa aktarılamadığında
  eklenir.

Üst bilgiler:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Kod Plugin ve paket Plugin paketleri genelinde yalnızca Plugin araması.

Sorgu parametreleri:

- `q` (zorunlu): sorgu dizesi
- `limit` (isteğe bağlı): tam sayı (1-100)
- `isOfficial` (isteğe bağlı): `true` veya `false`
- `category` (isteğe bağlı): Plugin kategori filtresi. Geçerli değerler:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Notlar:

- `GET /api/v1/plugins` altında belgelenen eski v1 filtre takma adları da
  kabul edilir.
- Kategori filtreleme, arama sorgusunun yeniden yazılması değil, Plugin kategori özet
  satırlarıyla desteklenen gerçek bir API filtresidir.
- Sonuçlar ilgi düzeyine göre sıralanarak döndürülür ve şu anda sayfalandırılmaz.
- Plugin aramasına yönelik tarayıcı kullanıcı arayüzü sıralama denetimleri, yüklenen ilgi düzeyi sonuçlarını
  geçerli `/skills` tarama davranışıyla eşleşecek şekilde yeniden sıralar.

### `GET /api/v1/packages/{name}`

Paket ayrıntısı meta verilerini döndürür.

Notlar:

- Birleştirilmiş katalogda beceriler de bu rota üzerinden çözümlenebilir.
- Çağıran, sahibi olan yayıncıyı okuyamıyorsa özel paketler `404` döndürür.

### `DELETE /api/v1/packages/{name}`

Bir paketi ve tüm sürümlerini geçici olarak siler.

Notlar:

- Paket sahibi, kuruluş yayıncısının sahibi/yöneticisi,
  platform moderatörü veya platform yöneticisi için bir API belirteci gerektirir.

### `GET /api/v1/packages/{name}/versions`

Sürüm geçmişini döndürür.

Sorgu parametreleri:

- `limit` (isteğe bağlı): tam sayı (1–100)
- `cursor` (isteğe bağlı): sayfalandırma imleci

Notlar:

- Çağıran, sahibi olan yayıncıyı okuyamıyorsa özel paketler `404` döndürür.

### `GET /api/v1/packages/{name}/versions/{version}`

Dosya meta verileri, uyumluluk, doğrulama, yapı meta verileri ve tarama verileri
dâhil olmak üzere tek bir paket sürümünü döndürür.

Notlar:

- `version.artifact.kind`, eski sistem paket arşivleri için `legacy-zip` veya
  ClawPack destekli sürümler için `npm-pack` değeridir.
- ClawPack sürümleri npm uyumlu `npmIntegrity`, `npmShasum` ve
  `npmTarballName` alanlarını içerir.
- `version.sha256hash`, eski istemciler için kullanımdan kaldırılmış uyumluluk meta verisidir.
  `/api/v1/packages/{name}/download` tarafından döndürülen tam ZIP baytlarının karmasını hesaplar.
  Modern istemciler, kurallı sürüm yapısını tanımlayan
  `version.artifact.sha256` kullanmalıdır.
- `version.vtAnalysis`, `version.llmAnalysis` ve `version.staticScan`,
  tarama verileri mevcut olduğunda eklenir.
- Çağıran, sahibi olan yayıncıyı okuyamıyorsa özel paketler `404` döndürür.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Yükleme istemcileri için tam paket sürümü güvenlik ve güven özetini döndürür.
Bu, çözümlenen bir sürümün yüklenip yüklenemeyeceğine karar vermek için kullanılan herkese açık
OpenClaw tüketim yüzeyidir.

Kimlik doğrulama:

- Herkese açık okuma uç noktasıdır. Sahip, yayıncı, moderatör veya yönetici belirteci
  gerekmez.

Yanıt:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin"
  },
  "release": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "artifactSha256": "0123456789abcdef...",
    "npmIntegrity": "sha512-...",
    "npmShasum": "0123456789abcdef0123456789abcdef01234567",
    "npmTarballName": "example-plugin-1.2.3.tgz",
    "createdAt": 1730000000000
  },
  "trust": {
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious"],
    "pending": false,
    "stale": false
  }
}
```

Yanıt alanları:

- `package.name`, `package.displayName` ve `package.family`,
  çözümlenen kayıt defteri paketini tanımlar.
- `release.releaseId`, `release.version` ve `release.createdAt`,
  değerlendirilen tam sürümü tanımlar.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` ve `release.npmTarballName`, sürüm yapısı için bilindiklerinde
  bulunur.
- `trust.scanStatus`, tarayıcı girdilerinden ve manuel sürüm moderasyonundan
  türetilen geçerli güven durumudur.
- `trust.moderationState` null değerine izin verir. Manuel sürüm
  moderasyonu olmadığında `null` değeridir.
- `trust.blockedFromDownload`, yükleme engelleme sinyalidir. OpenClaw ve diğer
  yükleme istemcileri, tarayıcı veya moderasyon alanlarından engelleme kurallarını yeniden türetmek yerine
  bu değer `true` olduğunda yüklemeyi engellemelidir.
- `trust.reasons`, kullanıcıya gösterilen ve denetim amaçlı açıklama listesidir. Neden kodları
  `manual:quarantined`, `scan:malicious` ve
  `package:malicious` gibi kararlı, kısa dizelerdir.
- `trust.pending`, bir veya daha fazla güven girdisinin hâlâ tamamlanmayı beklediği anlamına gelir.
- `trust.stale`, güven özetinin güncelliğini yitirmiş girdilerden hesaplandığı ve
  yüksek güvenli bir izin kararından önce yenileme gerektiriyor olarak değerlendirilmesi gerektiği anlamına gelir.

Notlar:

- Bu uç nokta sürüme özeldir. İstemciler bunu yalnızca en son
  paket meta verilerini okuduktan sonra değil, yüklemeyi planladıkları paket sürümünü
  çözümledikten sonra çağırmalıdır.
- Çağıran, sahibi olan yayıncıyı okuyamıyorsa özel paketler `404` döndürür.
- Bu uç nokta, sahip/moderatör moderasyon uç noktalarından kasıtlı olarak daha
  dar kapsamlıdır. Bildiren kimliklerini, bildirim içeriklerini, özel kanıtları veya dâhilî inceleme
  zaman çizelgelerini değil, yükleme kararını ve herkese açık açıklamayı sunar.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Bir paket sürümü için açık yapı çözümleyici meta verilerini döndürür.

Notlar:

- Eski paket sürümleri bir `legacy-zip` yapısı ve eski ZIP
  `downloadUrl` döndürür.
- ClawPack sürümleri bir `npm-pack` yapısı, npm bütünlük alanları, bir
  `tarballUrl` ve eski ZIP uyumluluk URL'sini döndürür.
- Bu, OpenClaw çözümleyici yüzeyidir; paylaşılan bir URL'den arşiv biçiminin
  tahmin edilmesini önler.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Sürüm yapısını açık çözümleyici yolu üzerinden indirir.

Notlar:

- ClawPack sürümleri, yüklenen npm-pack `.tgz` baytlarını aynen aktarır.
- Eski ZIP sürümleri `/api/v1/packages/{name}/download?version=` konumuna yönlendirilir.
- İndirme hız sınırı havuzunu kullanır.

### `GET /api/v1/packages/{name}/readiness`

OpenClaw'ın gelecekteki kullanımı için hesaplanan hazır olma durumunu döndürür.

Hazır olma denetimleri şunları kapsar:

- resmî kanal durumu
- en son sürümün kullanılabilirliği
- ClawPack npm-pack yapıtının kullanılabilirliği
- yapıt özeti
- kaynak depo ve commit kökeni
- OpenClaw uyumluluk meta verileri
- ana makine hedefleri
- tarama durumu

Yanıt:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Örnek Plugin",
    "family": "code-plugin",
    "isOfficial": true,
    "latestVersion": "1.2.3"
  },
  "ready": false,
  "checks": [
    {
      "id": "clawpack",
      "label": "ClawPack yapıtı",
      "status": "fail",
      "message": "En son sürüm yalnızca eski ZIP biçimindedir."
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

Resmî OpenClaw Plugin geçiş satırlarını listelemeye yönelik moderatör uç noktası.

Kimlik doğrulama:

- Moderatör veya yönetici kullanıcıya ait bir API belirteci gerektirir.

Sorgu parametreleri:

- `phase` (isteğe bağlı): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw` veya
  `all` (varsayılan).
- `limit` (isteğe bağlı): tam sayı (1-100)
- `cursor` (isteğe bağlı): sayfalama imleci

Yanıt:

```json
{
  "items": [
    {
      "migrationId": "officialPluginMigrations:...",
      "bundledPluginId": "core.search",
      "packageName": "@openclaw/search-plugin",
      "packageId": "packages:...",
      "owner": "platform",
      "sourceRepo": "openclaw/openclaw",
      "sourcePath": "plugins/search",
      "sourceCommit": "abc123",
      "phase": "blocked",
      "blockers": ["ClawPack eksik"],
      "hostTargetsComplete": true,
      "scanClean": false,
      "moderationApproved": false,
      "runtimeBundlesReady": false,
      "notes": null,
      "createdAt": 1760000000000,
      "updatedAt": 1760000000000
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/migrations`

Resmî bir Plugin geçiş satırı oluşturmaya veya güncellemeye yönelik yönetici uç noktası.

Kimlik doğrulama:

- Yönetici kullanıcıya ait bir API belirteci gerektirir.

İstek gövdesi:

```json
{
  "bundledPluginId": "core.search",
  "packageName": "@openclaw/search-plugin",
  "owner": "platform",
  "sourceRepo": "openclaw/openclaw",
  "sourcePath": "plugins/search",
  "sourceCommit": "abc123",
  "phase": "blocked",
  "blockers": ["ClawPack eksik"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "yayıncının yüklemesi bekleniyor"
}
```

Notlar:

- `bundledPluginId` küçük harfe dönüştürülerek normalleştirilir ve kararlı upsert anahtarıdır.
- `packageName` npm adına göre normalleştirilir; planlanan geçişlerde paket
  mevcut olmayabilir.
- Bu, yalnızca geçişe hazır olma durumunu izler. OpenClaw'ı değiştirmez veya
  ClawPack oluşturmaz.

### `GET /api/v1/packages/moderation/queue`

Paket sürümü inceleme kuyruklarına yönelik moderatör/yönetici uç noktası.

Kimlik doğrulama:

- Moderatör veya yönetici kullanıcıya ait bir API belirteci gerektirir.

Sorgu parametreleri:

- `status` (isteğe bağlı): `open` (varsayılan), `blocked`, `manual` veya `all`
- `limit` (isteğe bağlı): tam sayı (1-100)
- `cursor` (isteğe bağlı): sayfalama imleci

Durumların anlamları:

- `open`: şüpheli, kötü amaçlı, beklemede, karantinaya alınmış, iptal edilmiş veya bildirilmiş sürümler.
- `blocked`: karantinaya alınmış, iptal edilmiş veya kötü amaçlı sürümler.
- `manual`: elle moderasyon geçersiz kılması bulunan tüm sürümler.
- `all`: elle geçersiz kılma, temiz olmayan tarama durumu veya paket bildirimi bulunan tüm sürümler.

Yanıt:

```json
{
  "items": [
    {
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Örnek Plugin",
      "family": "code-plugin",
      "channel": "community",
      "isOfficial": false,
      "version": "1.2.3",
      "createdAt": 1730000000000,
      "artifactKind": "npm-pack",
      "scanStatus": "malicious",
      "moderationState": "quarantined",
      "moderationReason": "elle inceleme",
      "sourceRepo": "openclaw/example-plugin",
      "sourceCommit": "abc123",
      "reportCount": 2,
      "lastReportedAt": 1730000001000,
      "reasons": ["manual:quarantined", "scan:malicious", "reports:2"]
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/{name}/report`

Bir paketi moderatör incelemesi için bildirin. Bildirimler paket düzeyindedir ve isteğe bağlı olarak
bir sürüme bağlanabilir. Moderasyon kuyruğunu beslerler ancak kendi başlarına indirmeleri
otomatik olarak gizlemez veya engellemezler; moderatörler yapıtları onaylamak, karantinaya
almak veya iptal etmek için sürüm moderasyonunu kullanmalıdır.

Kimlik doğrulama:

- Bir API belirteci gerektirir.

İstek:

```json
{ "reason": "Şüpheli yerel ikili dosya", "version": "1.2.3" }
```

Yanıt:

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "reportCount": 1
}
```

### `GET /api/v1/packages/reports`

Paket bildirimi alımına yönelik moderatör/yönetici uç noktası.

Kimlik doğrulama:

- Moderatör veya yönetici kullanıcıya ait bir API belirteci gerektirir.

Sorgu parametreleri:

- `status` (isteğe bağlı): `open` (varsayılan), `confirmed`, `dismissed` veya `all`
- `limit` (isteğe bağlı): tam sayı (1-100)
- `cursor` (isteğe bağlı): sayfalama imleci

Yanıt:

```json
{
  "items": [
    {
      "reportId": "packageReports:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Örnek Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "reason": "Şüpheli yerel ikili dosya",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Bildiren"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `GET /api/v1/packages/{name}/moderation`

Paket moderasyonu görünürlüğüne yönelik sahip/moderatör uç noktası.

Kimlik doğrulama:

- Paket sahibine, yayıncı üyesine, moderatöre veya
  yönetici kullanıcıya ait bir API belirteci gerektirir.

Yanıt:

```json
{
  "package": {
    "packageId": "packages:...",
    "name": "@openclaw/example-plugin",
    "displayName": "Örnek Plugin",
    "family": "code-plugin",
    "channel": "community",
    "isOfficial": false,
    "reportCount": 2,
    "lastReportedAt": 1730000001000,
    "scanStatus": "malicious"
  },
  "latestRelease": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "moderationReason": "elle inceleme",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious", "reports:2"],
    "createdAt": 1730000000000
  }
}
```

### `POST /api/v1/packages/reports/{reportId}/triage`

Paket bildirimlerini çözümlemeye veya yeniden açmaya yönelik moderatör/yönetici uç noktası.

İstek:

```json
{
  "status": "confirmed",
  "note": "Etkilenen sürüm incelendi ve karantinaya alındı.",
  "finalAction": "quarantine"
}
```

`note`, `confirmed` ve `dismissed` için gereklidir; `status`
yeniden `open` olarak ayarlanırken belirtilmeyebilir. Aynı denetlenebilir iş akışında
sürüm moderasyonu uygulamak için doğrulanmış bir bildirimle birlikte `finalAction: "quarantine"` veya
`finalAction: "revoke"` iletin.

Yanıt:

```json
{
  "ok": true,
  "reportId": "packageReports:...",
  "packageId": "packages:...",
  "status": "confirmed",
  "reportCount": 0
}
```

### `POST /api/v1/packages/{name}/versions/{version}/moderation`

Paket sürümü incelemesine yönelik moderatör/yönetici uç noktası.

İstek:

```json
{ "state": "quarantined", "reason": "Şüpheli yerel yük." }
```

Desteklenen durumlar:

- `approved`: elle incelenmiş ve izin verilmiş.
- `quarantined`: takip işlemi beklenirken engellenmiş.
- `revoked`: bir sürüme daha önce güvenildikten sonra engellenmiş.

Karantinaya alınmış ve iptal edilmiş sürümler, yapıt indirme yollarından `403` döndürür.
Her değişiklik bir denetim günlüğü girdisi yazar.

### `GET /api/v1/packages/{name}/file`

Bir paket dosyasının ham metin içeriğini döndürür.

Sorgu parametreleri:

- `path` (gerekli)
- `version` (isteğe bağlı)
- `tag` (isteğe bağlı)

Notlar:

- Varsayılan olarak en son sürümü kullanır.
- İndirme havuzunu değil, okuma hız sınırı havuzunu kullanır.
- İkili dosyalar `415` döndürür.
- Dosya boyutu sınırı: 200KB.
- Bekleyen VirusTotal taramaları okumaları engellemez; kötü amaçlı sürümler başka yerlerde yine de sunulmayabilir.
- Çağıran, sahibi olan yayıncıyı okuyamıyorsa özel paketler `404` döndürür.

### `GET /api/v1/packages/{name}/download`

Bir paket sürümünün eski, deterministik ZIP arşivini indirir.

Sorgu parametreleri:

- `version` (isteğe bağlı)
- `tag` (isteğe bağlı)

Notlar:

- Varsayılan olarak en son sürümü kullanır.
- Skills, `GET /api/v1/download` konumuna yönlendirilir.
- Plugin/paket arşivleri, eski OpenClaw istemcilerinin çalışmaya devam etmesi için
  `package/` köküne sahip zip dosyalarıdır.
- Bu yol yalnızca ZIP olarak kalır. ClawPack `.tgz` dosyalarını aktarmaz.
- Yanıtlar, çözümleyici bütünlük denetimleri için `ETag`, `Digest`,
  `X-ClawHub-Artifact-Type` ve `X-ClawHub-Artifact-Sha256` üst bilgilerini içerir.
- Yalnızca kayıt defterine ait meta veriler indirilen arşive eklenmez.
- Bekleyen VirusTotal taramaları indirmeleri engellemez; kötü amaçlı sürümler `403` döndürür.
- Çağıran sahip değilse özel paketler `404` döndürür.

### `GET /api/npm/{package}`

ClawPack destekli paket sürümleri için npm uyumlu bir packument döndürür.

Notlar:

- Yalnızca yüklenmiş ClawPack npm-pack tarball dosyalarına sahip sürümler listelenir.
- Yalnızca eski ZIP biçimindeki sürümler kasıtlı olarak dahil edilmez.
- `dist.tarball`, `dist.integrity` ve `dist.shasum`, kullanıcıların isterlerse
  npm'i yansıya yönlendirebilmesi için npm uyumlu alanlar kullanır.
- Kapsamlı paket packument'ları hem `/api/npm/@scope/name` hem de npm'in
  kodlanmış `/api/npm/@scope%2Fname` istek yolunu destekler.

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm yansı istemcileri için yüklenen ClawPack tarball baytlarını aynen aktarır.

Notlar:

- İndirme hız sınırı havuzunu kullanır.
- İndirme üst bilgileri, ClawHub SHA-256 değerinin yanı sıra npm bütünlük/shasum meta verilerini içerir.
- Moderasyon ve özel paket erişim denetimleri uygulanmaya devam eder.

### `GET /api/v1/resolve`

CLI tarafından yerel bir parmak izini bilinen bir sürümle eşlemek için kullanılır.

Sorgu parametreleri:

- `slug` (gerekli)
- `hash` (gerekli): paket parmak izinin 64 karakterli onaltılık sha256 değeri

Yanıt:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Barındırılan bir skill sürümünün ZIP dosyasını indirir veya barındırılan sürümü bulunmayan,
`clean` ya da `suspicious` taramasına sahip, güncel ve GitHub destekli bir skill için
GitHub kaynak devri döndürür.

Sorgu parametreleri:

- `slug` (zorunlu)
- `version` (isteğe bağlı): semver dizesi
- `tag` (isteğe bağlı): etiket adı (ör. `latest`)

Notlar:

- Ne `version` ne de `tag` sağlanırsa en son sürüm kullanılır.
- Geçici olarak silinen sürümler `410` döndürür.
- GitHub destekli skill aktarımları baytları proxy üzerinden iletmez veya yansıtmaz. JSON yanıtı
  `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  ve `archiveUrl` içerir; tarama/mevcut durum bir geçittir ve başarı
  yükü meta verilerine dahil edilmez.
- İndirme istatistikleri UTC günü başına benzersiz kimlikler olarak sayılır (API belirteci geçerliyse `userId`, aksi hâlde IP).

## Kimlik doğrulama uç noktaları (Bearer belirteci)

Tüm uç noktalar şunu gerektirir:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Belirteci doğrular ve kullanıcı tanıtıcısını döndürür.

### `POST /api/v1/skills`

Yeni bir sürüm yayımlar.

- Tercih edilen: `payload` JSON ve `files[]` bloblarıyla `multipart/form-data`.
- `files` içeren JSON gövdesi (storageId tabanlı) de kabul edilir.
- İsteğe bağlı yük alanı: `ownerHandle`. Mevcut olduğunda API, söz konusu
  yayıncıyı sunucu tarafında çözümler ve aktörün yayıncı erişimine sahip olmasını gerektirir.
- İsteğe bağlı yük alanı: `migrateOwner`. `ownerHandle` ile `true` olduğunda,
  aktör hem mevcut hem de hedef yayıncılarda yönetici/sahipse mevcut bir skill
  bu sahibin mülkiyetine taşınabilir. Bu açık onay olmadan sahip değişiklikleri
  reddedilir.

### `POST /api/v1/packages`

Bir kod plugini veya paket plugini sürümü yayımlar.

- Bearer belirteciyle kimlik doğrulaması gerektirir.
- `multipart/form-data` gerektirir.
- İzin verilen form alanları `payload`, yinelenen `files` blobları veya tek bir `clawpack`
  tarball referansıdır. `clawpack`, bir `.tgz` blobu veya
  yükleme URL'si akışı tarafından döndürülen bir depolama kimliği olabilir. Hazırlanmış depolama kimliği yayımları,
  bu yükleme URL'siyle döndürülen `clawpackUploadTicket` değerini de içermelidir.
- `files` veya `clawpack` seçeneklerinden birini kullanın; aynı istekte asla ikisini birden kullanmayın.
- JSON gövdeleri ve çağıran tarafından sağlanan `payload.files` / `payload.artifact`
  meta verileri reddedilir.
- Doğrudan çok parçalı yayımlama istekleri 18MB ile sınırlıdır. ClawPack tarball'ları,
  120MB tarball sınırına kadar yükleme URL'si akışını kullanabilir.
- İsteğe bağlı yük alanı: `ownerHandle`. Mevcut olduğunda yalnızca yöneticiler bu sahip adına yayımlama yapabilir.

Doğrulamada öne çıkanlar:

- `family`, `code-plugin` veya `bundle-plugin` olmalıdır.
- Plugin paketleri `openclaw.plugin.json` gerektirir. ClawPack `.tgz` yüklemeleri
  bunu `package/openclaw.plugin.json` konumunda içermelidir.
- Kod pluginleri `package.json`, kaynak depo meta verileri, kaynak commit
  meta verileri, yapılandırma şeması meta verileri, `openclaw.compat.pluginApi` ve
  `openclaw.build.openclawVersion` gerektirir.
- `openclaw.hostTargets` ve `openclaw.environment` isteğe bağlı meta verilerdir.
- Yalnızca `openclaw` kuruluş yayıncısı ve mevcut `openclaw` kuruluş üyelerinin
  kişisel yayıncıları `official` kanalında yayımlama yapabilir.
- Başkası adına yapılan yayımlamalarda da resmî kanal uygunluğu hedef sahip hesabına göre doğrulanır.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Bir skilli geçici olarak siler / geri yükler (sahip, moderatör veya yönetici).

İsteğe bağlı JSON gövdesi:

```json
{ "reason": "Hukuki inceleme tamamlanana kadar moderasyon için bekletiliyor." }
```

Mevcut olduğunda `reason`, skill moderasyon notu olarak saklanır ve denetim günlüğüne kopyalanır.
Sahip tarafından başlatılan geçici silmeler slug'ı 30 gün boyunca ayırır; ardından slug
başka bir yayıncı tarafından alınabilir. Silme yanıtı, bu süre sonu geçerli olduğunda `slugReservedUntil` içerir.
Moderatör/yönetici gizlemeleri ve güvenlik nedeniyle kaldırmaların süresi bu şekilde dolmaz.

Silme yanıtı:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Durum kodları:

- `200`: başarılı
- `401`: yetkisiz
- `403`: yasak
- `404`: skill/kullanıcı bulunamadı
- `500`: dahili sunucu hatası

### `POST /api/v1/users/publisher`

Yalnızca yönetici. Bir tanıtıcı için kuruluş yayıncısının var olmasını sağlar. Tanıtıcı hâlâ
eski bir paylaşılan kullanıcı/kişisel yayıncıyı gösteriyorsa uç nokta önce bunu bir kuruluş yayıncısına
taşır. Yeni oluşturulan bir kuruluş için `memberHandle` sağlayın; işlemi yapan yönetici üye olarak eklenmez.
`memberRole` varsayılan olarak `owner` değerini alır.

- Gövde: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Yanıt: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Kimliği doğrulanmış, self servis kuruluş yayıncısı oluşturma. Yeni bir kuruluş yayıncısı oluşturur ve
çağıranı sahip olarak ekler. Bu uç nokta mevcut kullanıcı/kişisel tanıtıcıları taşımaz ve
yayıncıyı güvenilir/resmî olarak işaretlemez.

- Gövde: `{ "handle": "opik", "displayName": "Opik" }`
- Yanıt: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Tanıtıcı zaten bir yayıncı, kullanıcı veya kişisel yayıncı tarafından kullanılıyorsa `409` döndürür.

### `POST /api/v1/users/reserve`

Yalnızca yönetici. Bir sürüm yayımlamadan kök slug'ları ve paket adlarını hak sahibi için ayırır.
Paket adları, sürüm satırı bulunmayan özel yer tutucu paketlere dönüşür; böylece aynı
sahip daha sonra gerçek kod plugini veya paket plugini sürümünü bu adla yayımlayabilir.

- Gövde: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Yanıt: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Yalnızca yönetici. Convex Auth hesap satırlarını düzenlemeden, doğrulanmış bir yedek GitHub OAuth sorumlusu
için kişisel yayıncıyı kurtarır. İstek, her iki değişmez GitHub
sağlayıcı hesap kimliğini de belirtmelidir; değiştirilebilir tanıtıcılar yalnızca operatöre yönelik bir koruma olarak kullanılır.

Uç nokta varsayılan olarak deneme çalıştırması yapar. Kurtarmayı uygulamak için personelin her iki
GitHub sorumlusu arasındaki devamlılığı bağımsız olarak doğrulamasından sonra `dryRun: false` ve
`confirmIdentityVerified: true` gerekir. Hedef kullanıcının mevcut kişisel
yayıncısında skill, paket veya GitHub skill kaynağı varsa kurtarma güvenli biçimde başarısız olur.
Kurtarma ayrıca kurtarılan yayıncının skillleri, skill slug diğer adları, paketleri,
paket denetleyicisi uyarıları ve türetilmiş arama özeti satırları için eski `ownerUserId` alanlarını taşır;
böylece doğrudan sahip yolları yeni yayıncı yetkisiyle uyumlu olur. Kurtarılan tanıtıcıya ait etkin bir
korumalı tanıtıcı rezervasyonu da yedek kullanıcıya yeniden atanır; böylece sonraki
profil eşitlemesi eski kullanıcının rakip yetkisini geri getiremez. Her birincil tablo, uygulama işlemi başına
100 satırla sınırlıdır; daha büyük kurtarmalarda önce sürdürülebilir bir sahip taşıması kullanılmalıdır.
GitHub skill kaynakları yayıncı kapsamındadır ve yeniden yazılmak yerine kontrol edilmiş olarak raporlanır.

- Gövde: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Yanıt: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Sahip slug yönetimi uç noktaları

- `POST /api/v1/skills/{slug}/rename`
  - Gövde: `{ "newSlug": "new-canonical-slug" }`
  - Yanıt: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Gövde: `{ "targetSlug": "canonical-target-slug" }`
  - Yanıt: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Notlar:

- Her iki uç nokta da API belirteciyle kimlik doğrulaması gerektirir ve yalnızca skill sahibi için çalışır.
- `rename`, önceki slug'ı yönlendirme diğer adı olarak korur.
- `merge`, kaynak listelemeyi gizler ve kaynak slug'ını hedef listelemeye yönlendirir.

### Mülkiyet aktarımı uç noktaları

- `POST /api/v1/skills/{slug}/transfer`
  - Gövde: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Yanıt: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Yanıt (kabul/ret/iptal): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Yanıt biçimi: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Bir kullanıcıyı yasaklar ve kullanıcının sahip olduğu skillleri kalıcı olarak siler (yalnızca moderatör/yönetici).

Gövde:

```json
{ "handle": "user_handle", "reason": "isteğe bağlı yasaklama nedeni" }
```

veya

```json
{ "userId": "users_...", "reason": "isteğe bağlı yasaklama nedeni" }
```

Yanıt:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

Bir kullanıcının yasağını kaldırır ve uygun skillleri geri yükler (yalnızca yönetici).

Gövde:

```json
{ "handle": "user_handle", "reason": "isteğe bağlı yasak kaldırma nedeni" }
```

veya

```json
{ "userId": "users_...", "reason": "isteğe bağlı yasak kaldırma nedeni" }
```

Yanıt:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

Yasağı kaldırmadan veya içeriği geri yüklemeden mevcut bir yasağın kayıtlı nedenini
değiştirir (yalnızca yönetici). `dryRun`, `false` olmadığı sürece varsayılan olarak deneme çalıştırması yapar.

Gövde:

```json
{ "handle": "user_handle", "reason": "toplu yayımlama spam'i", "dryRun": true }
```

veya

```json
{ "userId": "users_...", "reason": "toplu yayımlama spam'i", "dryRun": false }
```

Yanıt:

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "kötü amaçlı yazılım nedeniyle otomatik yasaklama",
  "nextReason": "toplu yayımlama spam'i",
  "changed": true
}
```

### `POST /api/v1/users/role`

Bir kullanıcı rolünü değiştirir (yalnızca yönetici).

Gövde:

```json
{ "handle": "user_handle", "role": "moderator" }
```

veya

```json
{ "userId": "users_...", "role": "admin" }
```

Yanıt:

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

Kullanıcıları listeler veya arar (yalnızca yönetici).

Sorgu parametreleri:

- `q` (isteğe bağlı): arama sorgusu
- `query` (isteğe bağlı): `q` için diğer ad
- `limit` (isteğe bağlı): azami sonuç sayısı (varsayılan 20, azami 200)

Yanıt:

```json
{
  "items": [
    {
      "userId": "users_...",
      "handle": "user_handle",
      "displayName": "Kullanıcı",
      "name": "Kullanıcı",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

Yıldız ekler/kaldırır (öne çıkarma). Her iki uç nokta da idempotenttir.

Yanıtlar:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Eski CLI uç noktaları (kullanımdan kaldırıldı)

Eski CLI sürümleri için desteklenmeye devam eder:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Kaldırma planı için `DEPRECATIONS.md` bölümüne bakın.

`POST /api/cli/upload-url`, `uploadUrl` ve `uploadTicket` döndürür. Bir ClawPack tarball'ını
hazırlayan paket yayımları, elde edilen depolama kimliğini `clawpack` ve döndürülen bileti
`clawpackUploadTicket` olarak göndermelidir.

## Kayıt defteri keşfi (`/.well-known/clawhub.json`)

CLI, kayıt defteri/kimlik doğrulama ayarlarını siteden keşfedebilir:

- `/.well-known/clawhub.json` (JSON, tercih edilen)
- `/.well-known/clawdhub.json` (eski)

Şema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Kendi sunucunuzda barındırıyorsanız bu dosyayı sunun (veya `CLAWHUB_REGISTRY` değerini açıkça ayarlayın; eski: `CLAWDHUB_REGISTRY`).

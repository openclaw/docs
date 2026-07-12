---
read_when:
    - Uç noktaları ekleme/değiştirme
    - CLI ↔ kayıt defteri isteklerinde hata ayıklama
summary: HTTP API başvurusu (genel + CLI uç noktaları + kimlik doğrulama).
x-i18n:
    generated_at: "2026-07-12T11:32:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

Temel URL: `https://clawhub.ai` (varsayılan).

Tüm v1 yolları `/api/v1/...` altındadır.
Eski `/api/...` ve `/api/cli/...` yolları uyumluluk amacıyla korunmaktadır (bkz. `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Genel kataloğun yeniden kullanımı

Üçüncü taraf dizinler, ClawHub Skills öğelerini listelemek veya aramak için genel okuma uç noktalarını kullanabilir. Lütfen sonuçları önbelleğe alın, `429`/`Retry-After` değerlerine uyun, kullanıcıları standart ClawHub listesine (`https://clawhub.ai/<owner>/skills/<slug>`) yönlendirin ve ClawHub'ın üçüncü taraf siteyi desteklediği izlenimini vermekten kaçının. Gizli, özel veya moderasyon tarafından engellenmiş içeriği genel API yüzeyinin dışında yansıtmaya çalışmayın.

Web kısa ad kısayolları kayıt defteri aileleri genelinde çözümlenir, ancak API istemcileri rota önceliğini yeniden oluşturmak yerine okuma uç noktalarının döndürdüğü standart URL'leri kullanmalıdır.

## Hız sınırları

Uygulama modeli:

- Anonim istekler: IP başına uygulanır.
- Kimliği doğrulanmış istekler (geçerli Bearer belirteci): kullanıcı kovası başına uygulanır.
- Belirteç eksik veya geçersizse davranış IP tabanlı uygulamaya geri döner.
- Kimliği doğrulanmış yazma uç noktaları, sunucu nedeni biliyorsa yalnızca `Unauthorized` döndürmemelidir. Eksik belirteçler, geçersiz/iptal edilmiş belirteçler ve silinmiş/yasaklanmış/devre dışı bırakılmış hesapların her biri, CLI istemcilerinin kullanıcılara kendilerini neyin engellediğini bildirebilmesi için uygulanabilir açıklama metni almalıdır.

- Okuma: IP başına dakikada 3000, anahtar başına dakikada 12000
- Yazma: IP başına dakikada 300, anahtar başına dakikada 3000
- İndirme: IP başına dakikada 1200, anahtar başına dakikada 6000 (indirme uç noktaları)

Üstbilgiler:

- Eski uyumluluk: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Standartlaştırılmış: `RateLimit-Limit`, `RateLimit-Reset`
- `429` durumunda: `X-RateLimit-Remaining: 0` ve `RateLimit-Remaining: 0`
- `429` durumunda: `Retry-After`

Üstbilgi anlamları:

- `X-RateLimit-Reset`: Unix döneminden itibaren mutlak saniye değeri
- `RateLimit-Reset`: sıfırlamaya kadar geçecek saniye (gecikme)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: mevcut olduğunda kalan kesin kota.
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

İstemci yönergeleri:

- `Retry-After` mevcutsa yeniden denemeden önce belirtilen saniye kadar bekleyin.
- Eş zamanlı yeniden denemeleri önlemek için rastgele sapmalı geri çekilme kullanın.
- `Retry-After` eksikse `RateLimit-Reset` değerine geri dönün (veya `X-RateLimit-Reset` üzerinden hesaplayın).

IP kaynağı:

- Yalnızca dağıtım güvenilir iletilmiş üstbilgileri açıkça etkinleştirdiğinde `cf-connecting-ip` dâhil güvenilir istemci IP üstbilgilerini kullanır.
- ClawHub, uçta istemci IP'lerini tanımlamak için güvenilir yönlendirme üstbilgilerini kullanır.
- Güvenilir bir istemci IP'si yoksa anonim istekler yalnızca hız sınırı türüyle kapsamlandırılmış yedek kovaları kullanır. Bu yedek kovalar, çağıranın sağladığı yolları, kısa adları, paket adlarını, sürümleri, sorgu dizelerini veya diğer yapıt parametrelerini içermez.

## Hata yanıtları

Genel v1 hata yanıtları `content-type: text/plain; charset=utf-8` ile düz metin olarak döndürülür.
Buna doğrulama hataları (`400`), bulunamayan genel kaynaklar (`404`), kimlik doğrulama ve izin hataları (`401`/`403`), hız sınırları (`429`) ve engellenmiş indirmeler dâhildir. İstemciler yanıt gövdesini insanlar tarafından okunabilir bir dize olarak okumalıdır. Bilinmeyen sorgu parametreleri uyumluluk amacıyla yok sayılır, ancak geçersiz değerlere sahip tanınan sorgu parametreleri `400` döndürür.

## Genel uç noktalar (kimlik doğrulaması yok)

### `GET /api/v1/search`

Sorgu parametreleri:

- `q` (zorunlu): sorgu dizesi
- `limit` (isteğe bağlı): tam sayı
- `highlightedOnly` (isteğe bağlı): öne çıkarılmış Skills öğelerini filtrelemek için `true`
- `nonSuspiciousOnly` (isteğe bağlı): şüpheli (`flagged.suspicious`) Skills öğelerini gizlemek için `true`
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

- Sonuçlar alaka sırasına göre döndürülür (gömme benzerliği + tam kısa ad/ad belirteci artışları + küçük bir popülerlik önceliği).
- Alaka, popülerlikten daha güçlüdür. Kesin bir kısa ad veya görünen ad belirteci eşleşmesi, etkileşimi çok daha güçlü olan daha gevşek bir eşleşmeden üst sırada yer alabilir.
- ASCII metni, sözcük ve noktalama işareti sınırlarında belirteçlere ayrılır. Örneğin `personal-map` bağımsız bir `map` belirteci içerirken `amap-jsapi-skill`; `amap`, `jsapi` ve `skill` belirteçlerini içerir; bu nedenle `map` araması `personal-map` için `amap-jsapi-skill` öğesine kıyasla daha güçlü bir sözcüksel eşleşme sağlar.
- Popülerlik logaritmik olarak ölçeklenir ve üst sınırla kısıtlanır. Yüksek etkileşimli Skills öğeleri, sorgu metni daha zayıf bir eşleşmeyse daha alt sırada yer alabilir.
- Şüpheli veya gizli moderasyon durumu, çağıran filtrelerine ve mevcut moderasyon durumuna bağlı olarak bir Skill öğesini genel aramadan kaldırabilir.

Yayıncıların bulunabilirliğine yönelik yönergeler:

- Kullanıcıların tam olarak arayacağı terimleri görünen ada, özete ve etiketlere ekleyin. Bağımsız bir kısa ad belirtecini yalnızca korumak istediğiniz kararlı bir kimlik olduğunda kullanın.
- Yeni kısa ad uzun vadede daha iyi bir standart ad olmadığı sürece yalnızca tek bir sorguda öne çıkmak için kısa adı değiştirmeyin. Eski kısa adlar yönlendirme takma adlarına dönüşür, ancak standart URL, görüntülenen kısa ad ve gelecekteki arama özetleri yeni kısa adı kullanır.
- Yeniden adlandırma takma adları, eski URL'lerin ve kayıt defteri üzerinden çözümlenen kurulumların çalışmasını sürdürür; ancak arama sıralaması, yeniden adlandırma dizine eklendikten sonra standart Skill meta verilerine dayanır. Mevcut istatistikler Skill ile birlikte kalır.
- Bir Skill beklenmedik şekilde görünmüyorsa sıralamayla ilgili meta verileri değiştirmeden önce oturum açmış durumdayken `clawhub inspect @owner/slug` ile moderasyon durumunu kontrol edin.

### `GET /api/v1/skills`

Sorgu parametreleri:

- `limit` (isteğe bağlı): tam sayı (1–200)
- `cursor` (isteğe bağlı): `trending` dışındaki herhangi bir sıralama için sayfalama imleci
- `sort` (isteğe bağlı): `updated` (varsayılan), `recommended` (takma ad: `default`), `createdAt` (takma ad: `newest`), `downloads`, `stars` (takma ad: `rating`), eski kurulum takma adları `installsCurrent`/`installs`/`installsAllTime`, `downloads` değerine eşlenir; `trending`
- `nonSuspiciousOnly` (isteğe bağlı): şüpheli (`flagged.suspicious`) Skills öğelerini gizlemek için `true`
- `nonSuspicious` (isteğe bağlı): `nonSuspiciousOnly` için eski takma ad

Geçersiz `sort` değerleri `400` döndürür.

Notlar:

- `recommended`, etkileşim ve güncellik sinyallerini kullanır.
- `trending`, son 7 gündeki kurulum sayısına göre sıralar (telemetri tabanlı).
- `createdAt`, yeni Skill taramaları için kararlıdır; mevcut Skills öğeleri yeniden yayımlandığında `updated` değişir.
- `nonSuspiciousOnly=true` olduğunda imleç tabanlı sıralamalar, şüpheli Skills öğeleri sayfa alındıktan sonra filtrelendiği için bir sayfada `limit` değerinden daha az öğe döndürebilir.
- Mevcut olduğunda sayfalamaya devam etmek için `nextCursor` kullanın. Kısa bir sayfa tek başına sonuçların sonuna gelindiği anlamına gelmez.

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

- Sahip yeniden adlandırma/birleştirme akışlarıyla oluşturulan eski kısa adlar standart Skill öğesine çözümlenir.
- `metadata.os`: Skill frontmatter bölümünde belirtilen işletim sistemi kısıtlamaları (ör. `["macos"]`, `["linux"]`). Belirtilmemişse `null`.
- `metadata.systems`: Nix sistem hedefleri (ör. `["aarch64-darwin", "x86_64-linux"]`). Belirtilmemişse `null`.
- Skill platform meta verilerine sahip değilse `metadata`, `null` olur.
- `moderation` yalnızca Skill işaretlendiğinde veya sahibi onu görüntülediğinde dâhil edilir.

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
    "summary": "Detected: suspicious.dynamic_code_execution",
    "engineVersion": "v2.0.0",
    "updatedAt": 0,
    "legacyReason": null,
    "evidence": [
      {
        "code": "suspicious.dynamic_code_execution",
        "severity": "critical",
        "file": "index.ts",
        "line": 3,
        "message": "Dynamic code execution detected.",
        "evidence": ""
      }
    ]
  }
}
```

Notlar:

- Sahipler ve moderatörler gizli Skills öğelerinin moderasyon ayrıntılarına erişebilir.
- Genel çağıranlar yalnızca önceden işaretlenmiş görünür Skills öğeleri için `200` alır.
- Kanıtlar genel çağıranlar için sansürlenir ve ham parçaları yalnızca sahipler/moderatörler için içerir.

### `POST /api/v1/skills/{slug}/report`

Bir Skill öğesini moderatör incelemesi için bildirin. Bildirimler Skill düzeyindedir, isteğe bağlı olarak bir sürüme bağlanır ve Skill bildirim kuyruğunu besler.

Kimlik doğrulama:

- Bir API belirteci gerektirir.

İstek:

```json
{ "reason": "Suspicious install step", "version": "1.2.3" }
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
      "reason": "Suspicious install step",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
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

Skill bildirimlerini çözümlemek veya yeniden açmak için moderatör/yönetici uç noktası.

İstek:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note`, `confirmed` ve `dismissed` için zorunludur; `status` yeniden `open` olarak ayarlanırken atlanabilir. Skill öğesini aynı denetlenebilir iş akışında gizlemek için işleme alınmış bir bildirimle birlikte `finalAction: "hide"` iletin.

### `GET /api/v1/skills/{slug}/versions`

Sorgu parametreleri:

- `limit` (isteğe bağlı): tam sayı
- `cursor` (isteğe bağlı): sayfalama imleci

### `GET /api/v1/skills/{slug}/versions/{version}`

Sürüm meta verilerini ve dosya listesini döndürür.

- `version.security`, mevcut olduğunda normalleştirilmiş tarama doğrulama durumunu ve tarayıcı ayrıntılarını (VirusTotal + LLM) içerir.

### `GET /api/v1/skills/{slug}/scan`

Bir Skill sürümü için güvenlik taraması doğrulama ayrıntılarını döndürür.

Sorgu parametreleri:

- `version` (isteğe bağlı): belirli sürüm dizesi.
- `tag` (isteğe bağlı): etiketlenmiş bir sürümü çözümleyin (örneğin `latest`).

Notlar:

- Ne `version` ne de `tag` sağlanırsa en son sürümü kullanır.
- Normalleştirilmiş doğrulama durumunun yanı sıra tarayıcıya özgü ayrıntıları içerir.
- `security.hasScanResult`, yalnızca bir tarayıcı kesin bir hüküm (`clean`, `suspicious` veya `malicious`) ürettiğinde `true` olur.
- `moderation`, en son sürümden türetilen güncel bir Skills düzeyi moderasyon anlık görüntüsüdür.
- Geçmiş bir sürümü sorgularken `moderation` ve `security` öğelerini aynı sürüm bağlamında kabul etmeden önce `moderation.matchesRequestedVersion` ve `moderation.sourceVersion` değerlerini kontrol edin.

### `POST /api/v1/skills/-/scan`

Yeni ClawScan işleri için kimlik doğrulamalı gönderim uç noktası.

Yerel yükleme taramaları artık desteklenmemektedir. `multipart/form-data`
veya `{ "source": { "kind": "upload" } }` kullanan istekler `410` döndürür.

Yayımlanmış taramalar JSON kullanır:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Notlar:

- Tarama isteği yükleri ve indirilebilir raporlar, saklama süresi dolduktan sonra tarama isteği deposundan kaldırılır.
- Yayımlanmış taramalar, sahip/yayımcı yönetim erişimi veya platform moderatörü/yöneticisi yetkisi gerektirir.
- Yayımlanmış taramalar yalnızca `update: true` olduğunda ve tarama başarıyla tamamlandığında sonuçları geri yazar.
- Yanıt, `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` ile `202` olur.
- Tarama işleri eşzamansızdır. Manuel tarama isteklerine normal yayımlama/geçmiş verileri doldurma çalışmalarından önce öncelik verilir, ancak tamamlanma yine de çalışan kullanılabilirliğine bağlıdır.

### `GET /api/v1/skills/-/scan/{scanId}`

Gönderilmiş bir tarama için kimlik doğrulamalı sorgulama uç noktası.

- Kuyrukta/çalışıyor/başarılı/başarısız durumunu döndürür.
- İstemcilerin isteğin önünde kaç adet öncelikli manuel tarama bulunduğunu gösterebilmesi için kuyruktayken `queue.queuedAhead` ve `queue.position` değerlerini döndürür. Çok büyük kuyruklar sınırlandırılır ve `queuedAheadIsEstimate: true` ile bildirilir.
- Kullanılabilir olduğunda `report`, `clawscan`, `skillspector`, `staticAnalysis` ve `virustotal` bölümlerini içerir.
- Başarısız tarama işleri, `lastError` ile birlikte `status: "failed"` döndürür.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Kimlik doğrulamalı rapor arşivi uç noktası.

- Başarıyla tamamlanmış bir tarama gerektirir; sonlandırılmamış taramalar `409` döndürür.
- `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` ve `README.md` dosyalarını içeren bir ZIP döndürür.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Gönderilmiş sürümler için kimlik doğrulamalı, depolanmış rapor arşivi uç noktası.

- Skills veya Plugin için sahip/yayımcı yönetim erişimi ya da platform moderatörü/yöneticisi yetkisi gerektirir.
- Engellenmiş veya gizlenmiş sürümler dâhil olmak üzere tam olarak gönderilen sürüme ait depolanmış tarama sonuçlarını döndürür.
- `kind` varsayılan olarak `skill` değerini alır; Plugin/paket taramaları için `kind=plugin` kullanın.
- Tarama isteği indirmeleriyle aynı ZIP yapısını döndürür.

### `POST /api/v1/skills/-/scan/batch`

Yalnızca yöneticilere açık standart toplu yeniden tarama rotası. Eski `POST /api/v1/skills/-/rescan-batch` ile aynı yük yapısını kabul eder.

### `POST /api/v1/skills/-/scan/batch/status`

Yalnızca yöneticilere açık standart toplu durum rotası. `{ "jobIds": ["..."] }` kabul eder ve eski `POST /api/v1/skills/-/rescan-batch/status` ile aynı toplu sayaçları döndürür.

### `GET /api/v1/skills/{slug}/verify`

`clawhub skill verify` tarafından kullanılan Skills Kartı doğrulama zarfını döndürür.

Sorgu parametreleri:

- `version` (isteğe bağlı): Belirli sürüm dizesi.
- `tag` (isteğe bağlı): Etiketlenmiş bir sürümü çözümler (örneğin `latest`).

Notlar:

- `ok`, yalnızca seçilen sürüm oluşturulmuş bir Skills Kartına sahip olduğunda, moderasyon tarafından kötü amaçlı yazılım nedeniyle engellenmediğinde ve ClawScan doğrulaması temiz olduğunda `true` olur.
- Kabuk otomasyonunun iç içe sarmalayıcıları açmadan okuyabilmesi için Skills kimliği, yayımcı kimliği ve seçilen sürüm meta verileri üst düzey zarf alanlarıdır (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`).
- `security`, üst düzey ClawScan/güvenlik hükmüdür. Otomasyon `ok`, `decision`, `reasons` ve `security.status` değerlerini esas almalıdır.
- `security.signals`, `staticScan`, `virusTotal` ve `skillSpector` gibi destekleyici tarayıcı kanıtlarını içerir.
- `security.signals.dependencyRegistry`, v1 yanıt uyumluluğu için korunur ancak bağımlılık kayıt defteri varlık tarayıcısı kullanımdan kaldırılmıştır ve bu anahtar her zaman `null` değerindedir.
- `provenance`, yalnızca ClawHub yayımlama veya içe aktarma sırasında bir GitHub deposunu/referansını/commit'ini/yolunu çözümleyip depoladığında `server-resolved-github-import` olur; aksi takdirde `unavailable` olur.

### `POST /api/v1/skills/-/security-verdicts`

Tam Skills sürümleri için güncel ve kompakt güvenlik hükümlerini döndürür. Bu
koleksiyon uç noktası, OpenClaw Control UI gibi hangi yüklü
ClawHub Skills sürümlerini göstermesi gerektiğini zaten bilen istemciler içindir.

İstek:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Notlar:

- `items`, 1-100 benzersiz `{ slug, version }` çifti içermelidir.
- Sonuçlar öğe başınadır; eksik bir Skills veya sürüm tüm yanıtın başarısız olmasına neden olmaz.
- Yanıt yalnızca güvenlikle ilgilidir. Skills Kartı verilerini, oluşturulmuş kart durumunu, yapıt dosyası listelerini veya ayrıntılı tarayıcı yüklerini içermez.
- `security.signals` yalnızca durum düzeyinde destekleyici kanıt içerir; tüm tarayıcı ayrıntıları için `/scan` veya ClawHub güvenlik denetimi sayfasını kullanın.
- `security.signals.dependencyRegistry`, v1 yanıt uyumluluğu için korunur ancak bağımlılık kayıt defteri varlık tarayıcısı kullanımdan kaldırılmıştır ve bu anahtar her zaman `null` değerindedir.
- Skills Kartının bulunmaması bu uç noktanın `ok`, `decision` veya `reasons` değerlerini etkilemez; istemciler kart içeriğine ihtiyaç duyduklarında yüklü `skill-card.md` dosyasını yerel olarak okumalıdır.
- Tek bir Skills için Skills Kartı doğrulama zarfına ihtiyaç duyduğunuzda `/verify`, oluşturulmuş kart Markdown'ına ihtiyaç duyduğunuzda `/card` ve ayrıntılı tarayıcı verilerine ihtiyaç duyduğunuzda `/scan` kullanın.

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
      "error": { "code": "version_not_found", "message": "Version not found" },
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
- Dosya boyutu sınırı: 200 KB.

### `GET /api/v1/packages`

Şunlar için birleşik katalog uç noktası:

- Skills
- kod Pluginleri
- paket Pluginleri

Sorgu parametreleri:

- `limit` (isteğe bağlı): tam sayı (1–100)
- `cursor` (isteğe bağlı): sayfalama imleci
- `family` (isteğe bağlı): `skill`, `code-plugin` veya `bundle-plugin`
- `channel` (isteğe bağlı): `official`, `community` veya `private`
- `isOfficial` (isteğe bağlı): `true` veya `false`
- `sort` (isteğe bağlı): `updated` (varsayılan), `recommended`, `trending`, `downloads`, eski takma ad `installs`
- `category` (isteğe bağlı): Plugin kategorisi filtresi. Yalnızca istek Plugin paketleriyle sınırlandırıldığında desteklenir (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` veya
  `family=code-plugin`/`family=bundle-plugin` içeren paket uç noktaları).
  Denetimli kategoriler ve eski v1 filtre takma adları
  `GET /api/v1/plugins` altında belgelenmiştir.

Notlar:

- `family`, `channel`, `isOfficial`, `featured`, `highlightedOnly` veya `sort`
  için geçersiz değerler `400` döndürür. Bilinmeyen sorgu parametreleri yok sayılır.
- `GET /api/v1/code-plugins` ve `GET /api/v1/bundle-plugins`, sabit aileli takma adlar olarak kalır.
- Skill girdileri Skill kayıt defteri tarafından desteklenmeye devam eder ve hâlâ yalnızca `POST /api/v1/skills` üzerinden yayımlanabilir.
- `POST /api/v1/packages` hâlâ yalnızca kod Plugini ve paket Plugini sürümleri içindir.
- Anonim çağıranlar yalnızca herkese açık paket kanallarını görür.
- Kimliği doğrulanmış çağıranlar, listeleme/arama sonuçlarında üyesi oldukları yayıncılara ait özel paketleri görebilir.
- `channel=private` yalnızca kimliği doğrulanmış çağıranın okuyabildiği paketleri döndürür.

### `GET /api/v1/packages/search`

Skills ve Plugin paketleri genelinde birleşik katalog araması.

Sorgu parametreleri:

- `q` (gerekli): sorgu dizesi
- `limit` (isteğe bağlı): tam sayı (1–100)
- `family` (isteğe bağlı): `skill`, `code-plugin` veya `bundle-plugin`
- `channel` (isteğe bağlı): `official`, `community` veya `private`
- `isOfficial` (isteğe bağlı): `true` veya `false`
- `category` (isteğe bağlı): Plugin kategorisi filtresi. Yalnızca istek Plugin
  paketleriyle sınırlandırıldığında desteklenir. Denetimli kategoriler ve eski
  v1 filtre takma adları `GET /api/v1/plugins` altında belgelenmiştir.

Notlar:

- `family`, `channel`, `isOfficial`, `featured` veya `highlightedOnly` için
  geçersiz değerler `400` döndürür. Bilinmeyen sorgu parametreleri yok sayılır.
- Anonim çağıranlar yalnızca herkese açık paket kanallarını görür.
- Kimliği doğrulanmış çağıranlar, üyesi oldukları yayıncılara ait özel paketlerde arama yapabilir.
- `channel=private` yalnızca kimliği doğrulanmış çağıranın okuyabildiği paketleri döndürür.

### `GET /api/v1/plugins`

Kod Plugini ve paket Plugini paketleri genelinde yalnızca Pluginlere yönelik katalog taraması.

Sorgu parametreleri:

- `limit` (isteğe bağlı): tam sayı (1-100)
- `cursor` (isteğe bağlı): sayfalama imleci
- `isOfficial` (isteğe bağlı): `true` veya `false`
- `sort` (isteğe bağlı): `recommended` (varsayılan), `trending`, `downloads`, `updated`, eski takma ad `installs`
- `category` (isteğe bağlı): Plugin kategorisi filtresi. Geçerli değerler:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Eski v1 filtre takma adları okuma uç noktalarında kabul edilmeye devam eder:

- `mcp-tooling`, `data` ve `automation`, `tools` olarak çözümlenir.
- `observability` ve `deployment`, `gateway` olarak çözümlenir.
- `dev-tools`, `runtime` olarak çözümlenir.

`trending`, yedi günlük kurulum/indirme liderlik tablosudur ve tüm zamanların toplamlarını kullanmaz.
Birleşik `/api/v1/packages` uç noktasında yalnızca Pluginlere yöneliktir; Skill kataloğu için
`/api/v1/skills?sort=trending` kullanın.

Eski takma adlar, depolanan veya yazar tarafından beyan edilen kategori değerleri olarak kabul edilmez.

### `GET /api/v1/skills/export`

Çevrimdışı analiz için en son herkese açık Skills öğelerinin toplu dışa aktarımı.

Kimlik doğrulama:

- API belirteci gereklidir.

Sorgu parametreleri:

- `startDate` (gerekli): Skill `updatedAt` değeri için Unix milisaniyesi cinsinden alt sınır.
- `endDate` (gerekli): Skill `updatedAt` değeri için Unix milisaniyesi cinsinden üst sınır.
- `limit` (isteğe bağlı): tam sayı (1-250), varsayılan `250`.
- `cursor` (isteğe bağlı): önceki yanıttan alınan sayfalama imleci.

Yanıt:

- Gövde: ZIP arşivi.
- Dışa aktarılan her Skill, `{publisher}/{slug}/` kökünde yer alır.
- Barındırılan Skills öğeleri, depolanan en son sürüm dosyalarını içerir ve
  `_manifest.json` içinde `sourceRef: "public-clawhub"` ile listelenir.
- `clean` veya `suspicious` taramasına sahip, GitHub destekli güncel Skills öğeleri;
  depo, commit, yol, içerik karması ve arşiv URL'siyle birlikte
  `sourceRef: "public-github"` içeren `_source_handoff.json` dosyasını içerir.
  ClawHub tarafından barındırılan kaynak dosyalarını içermezler.
- Her Skill, `_export_skill_meta.json` dosyasını içerir.
- `_manifest.json` her zaman ZIP köküne eklenir.
- Tek tek Skills öğeleri veya dosyalar dışa aktarılamadığında `_errors.json`
  eklenir.

Üstbilgiler:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Çevrimdışı analiz için en son herkese açık Plugin sürümlerinin toplu dışa aktarımı.

Kimlik doğrulama:

- API tokeni gereklidir.

Sorgu parametreleri:

- `startDate` (zorunlu): Plugin `updatedAt` değeri için Unix milisaniye alt sınırı.
- `endDate` (zorunlu): Plugin `updatedAt` değeri için Unix milisaniye üst sınırı.
- `limit` (isteğe bağlı): tam sayı (1-250), varsayılan `250`.
- `cursor` (isteğe bağlı): önceki yanıttan alınan sayfalama imleci.
- `family` (isteğe bağlı): `code-plugin` veya `bundle-plugin`. Atlanırsa her iki
  Plugin ailesi de kullanılır.

Yanıt:

- Gövde: ZIP arşivi.
- Dışa aktarılan her Plugin `{family}/{packageName}/` altında yer alır.
- Dışa aktarılan her Plugin, en son sürümün depolanan dosyalarını içerir.
- Plugin başına dışa aktarma meta verileri
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` konumunda saklanır.
- `_manifest.json` her zaman ZIP kökünde bulunur.
- Tek tek Plugin'ler veya dosyalar dışa aktarılamadığında `_errors.json`
  eklenir.

Üstbilgiler:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

`code-plugin` ve `bundle-plugin` paketleri genelinde yalnızca Plugin araması.

Sorgu parametreleri:

- `q` (zorunlu): sorgu dizesi
- `limit` (isteğe bağlı): tam sayı (1-100)
- `isOfficial` (isteğe bağlı): `true` veya `false`
- `category` (isteğe bağlı): Plugin kategorisi filtresi. Geçerli değerler:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Notlar:

- `GET /api/v1/plugins` altında belgelenen eski v1 filtre diğer adları da
  kabul edilir.
- Kategori filtreleme, arama sorgusunun yeniden yazılması değil, Plugin kategorisi özet
  satırlarıyla desteklenen gerçek bir API filtresidir.
- Sonuçlar ilgililik sırasına göre döndürülür ve şu anda sayfalanmaz.
- Plugin aramasına yönelik tarayıcı arayüzü sıralama denetimleri, yüklenen ilgililik sonuçlarını
  mevcut `/skills` göz atma davranışıyla eşleşecek şekilde yeniden sıralar.

### `GET /api/v1/packages/{name}`

Paket ayrıntısı meta verilerini döndürür.

Notlar:

- Birleştirilmiş katalogda Skills da bu yol üzerinden çözümlenebilir.
- Çağıran taraf, sahibi olan yayıncıyı okuyamıyorsa özel paketler `404` döndürür.

### `DELETE /api/v1/packages/{name}`

Bir paketi ve tüm sürümlerini geçici olarak siler.

Notlar:

- Paket sahibi, kuruluş yayıncısının sahibi/yöneticisi, platform moderatörü veya platform yöneticisi için bir API tokeni gerektirir.

### `GET /api/v1/packages/{name}/versions`

Sürüm geçmişini döndürür.

Sorgu parametreleri:

- `limit` (isteğe bağlı): tam sayı (1–100)
- `cursor` (isteğe bağlı): sayfalama imleci

Notlar:

- Çağıran taraf, sahibi olan yayıncıyı okuyamıyorsa özel paketler `404` döndürür.

### `GET /api/v1/packages/{name}/versions/{version}`

Dosya meta verileri, uyumluluk, doğrulama, yapıt meta verileri ve tarama verileri dâhil olmak üzere tek bir paket sürümünü döndürür.

Notlar:

- `version.artifact.kind`, eski tür paket arşivleri için `legacy-zip`, ClawPack destekli sürümler için
  `npm-pack` değeridir.
- ClawPack sürümleri, npm uyumlu `npmIntegrity`, `npmShasum` ve
  `npmTarballName` alanlarını içerir.
- `version.sha256hash`, eski istemciler için kullanımdan kaldırılmış uyumluluk meta verisidir.
  `/api/v1/packages/{name}/download` tarafından döndürülen tam ZIP baytlarının
  özetini hesaplar. Modern istemciler, standart sürüm yapıtını tanımlayan
  `version.artifact.sha256` değerini kullanmalıdır.
- Tarama verileri mevcut olduğunda `version.vtAnalysis`, `version.llmAnalysis` ve
  `version.staticScan` eklenir.
- Çağıran taraf, sahibi olan yayıncıyı okuyamıyorsa özel paketler `404` döndürür.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Kurulum istemcileri için tam paket sürümü güvenlik ve güven özetini döndürür.
Bu, çözümlenen bir sürümün kurulup kurulamayacağına karar vermek için herkese
açık OpenClaw tüketim yüzeyidir.

Kimlik doğrulama:

- Herkese açık okuma uç noktasıdır. Sahip, yayıncı, moderatör veya yönetici tokeni
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

- `package.name`, `package.displayName` ve `package.family`, çözümlenen kayıt defteri paketini
  tanımlar.
- `release.releaseId`, `release.version` ve `release.createdAt`, değerlendirilen
  tam sürümü tanımlar.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` ve `release.npmTarballName`, sürüm yapıtı için biliniyorsa
  bulunur.
- `trust.scanStatus`, tarayıcı girdilerinden ve manuel sürüm moderasyonundan
  türetilen geçerli güven durumudur.
- `trust.moderationState` null olabilir. Manuel sürüm moderasyonu
  bulunmadığında `null` değerindedir.
- `trust.blockedFromDownload`, kurulum engelleme sinyalidir. OpenClaw ve diğer
  kurulum istemcileri, tarayıcı veya moderasyon alanlarından engelleme kurallarını
  yeniden türetmek yerine bu değer `true` olduğunda kurulumu engellemelidir.
- `trust.reasons`, kullanıcıya gösterilen açıklama ve denetim açıklamaları listesidir. Neden kodları
  `manual:quarantined`, `scan:malicious` ve `package:malicious` gibi kararlı,
  kısa dizelerdir.
- `trust.pending`, bir veya daha fazla güven girdisinin hâlâ tamamlanmayı beklediği anlamına gelir.
- `trust.stale`, güven özetinin güncel olmayan girdilerden hesaplandığı ve
  yüksek güvenli bir izin kararından önce yenilenmesi gerektiği anlamına gelir.

Notlar:

- Bu uç nokta tam sürüme özeldir. İstemciler bunu yalnızca en son paket meta
  verilerini okuduktan sonra değil, kurmayı amaçladıkları paket sürümünü
  çözümledikten sonra çağırmalıdır.
- Çağıran taraf, sahibi olan yayıncıyı okuyamıyorsa özel paketler `404` döndürür.
- Bu uç nokta, sahip/moderatör moderasyon uç noktalarından kasıtlı olarak daha
  dar kapsamlıdır. Bildirimi yapanların kimliklerini, bildirim içeriklerini,
  özel kanıtları veya dâhilî inceleme zaman çizelgelerini değil, kurulum kararını
  ve herkese açık açıklamayı sunar.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Bir paket sürümü için açık yapıt çözümleyici meta verilerini döndürür.

Notlar:

- Eski paket sürümleri bir `legacy-zip` yapıtı ve eski ZIP
  `downloadUrl` değerini döndürür.
- ClawPack sürümleri bir `npm-pack` yapıtı, npm bütünlük alanları, bir
  `tarballUrl` ve eski ZIP uyumluluk URL'sini döndürür.
- Bu, OpenClaw çözümleyici yüzeyidir; paylaşılan bir URL'den arşiv biçiminin
  tahmin edilmesini önler.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Sürüm yapıtını açık çözümleyici yolu üzerinden indirir.

Notlar:

- ClawPack sürümleri, yüklenen npm-pack `.tgz` baytlarını aynen aktarır.
- Eski ZIP sürümleri `/api/v1/packages/{name}/download?version=` adresine yönlendirir.
- İndirme hız sınırı grubunu kullanır.

### `GET /api/v1/packages/{name}/readiness`

Gelecekteki OpenClaw tüketimi için hesaplanan hazır olma durumunu döndürür.

Hazır olma denetimleri şunları kapsar:

- resmî kanal durumu
- en son sürümün kullanılabilirliği
- ClawPack npm-pack yapıtının kullanılabilirliği
- yapıt özeti
- kaynak deposu ve commit kaynağı
- OpenClaw uyumluluk meta verileri
- ana makine hedefleri
- tarama durumu

Yanıt:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "isOfficial": true,
    "latestVersion": "1.2.3"
  },
  "ready": false,
  "checks": [
    {
      "id": "clawpack",
      "label": "ClawPack artifact",
      "status": "fail",
      "message": "Latest version is legacy ZIP-only."
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

Resmî OpenClaw Plugin geçiş satırlarını listelemek için moderatör uç noktası.

Kimlik doğrulama:

- Moderatör veya yönetici kullanıcı için bir API tokeni gerektirir.

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
      "blockers": ["missing ClawPack"],
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

Resmî bir Plugin geçiş satırı oluşturmak veya güncellemek için yönetici uç noktası.

Kimlik doğrulama:

- Yönetici kullanıcı için bir API tokeni gerektirir.

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
  "blockers": ["missing ClawPack"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "waiting on publisher upload"
}
```

Notlar:

- `bundledPluginId` küçük harfe dönüştürülür ve kararlı ekleme/güncelleme anahtarıdır.
- `packageName`, npm adına göre normalleştirilir; planlanan geçişlerde paket
  eksik olabilir.
- Bu yalnızca geçişe hazır olma durumunu izler. OpenClaw'ı değiştirmez veya
  ClawPack'ler oluşturmaz.

### `GET /api/v1/packages/moderation/queue`

Paket sürümü inceleme kuyrukları için moderatör/yönetici uç noktası.

Kimlik doğrulama:

- Moderatör veya yönetici kullanıcı için bir API tokeni gerektirir.

Sorgu parametreleri:

- `status` (isteğe bağlı): `open` (varsayılan), `blocked`, `manual` veya `all`
- `limit` (isteğe bağlı): tam sayı (1-100)
- `cursor` (isteğe bağlı): sayfalama imleci

Durumların anlamları:

- `open`: şüpheli, kötü amaçlı, beklemede, karantinaya alınmış, iptal edilmiş veya bildirilmiş sürümler.
- `blocked`: karantinaya alınmış, iptal edilmiş veya kötü amaçlı sürümler.
- `manual`: manuel moderasyon geçersiz kılması bulunan tüm sürümler.
- `all`: manuel geçersiz kılması, temiz olmayan tarama durumu veya paket bildirimi bulunan tüm sürümler.

Yanıt:

```json
{
  "items": [
    {
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "channel": "community",
      "isOfficial": false,
      "version": "1.2.3",
      "createdAt": 1730000000000,
      "artifactKind": "npm-pack",
      "scanStatus": "malicious",
      "moderationState": "quarantined",
      "moderationReason": "manual review",
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
bir sürümle ilişkilendirilir. Moderasyon kuyruğunu beslerler ancak kendi başlarına
otomatik olarak gizleme veya indirmeleri engelleme işlemi yapmazlar; moderatörler yapıtları
onaylamak, karantinaya almak veya iptal etmek için sürüm moderasyonunu kullanmalıdır.

Kimlik doğrulama:

- Bir API tokeni gerektirir.

İstek:

```json
{ "reason": "Suspicious native binary", "version": "1.2.3" }
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

Paket raporu alımı için moderatör/yönetici uç noktası.

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
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "reason": "Suspicious native binary",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
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

Paket moderasyonunun görünürlüğü için sahip/moderatör uç noktası.

Kimlik doğrulama:

- Paket sahibi, yayıncı üyesi, moderatör veya yönetici kullanıcıya ait bir API
  belirteci gerektirir.

Yanıt:

```json
{
  "package": {
    "packageId": "packages:...",
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
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
    "moderationReason": "manual review",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious", "reports:2"],
    "createdAt": 1730000000000
  }
}
```

### `POST /api/v1/packages/reports/{reportId}/triage`

Paket raporlarını çözümlemek veya yeniden açmak için moderatör/yönetici uç noktası.

İstek:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note`, `confirmed` ve `dismissed` için zorunludur; `status` yeniden `open`
olarak ayarlanırken atlanabilir. Aynı denetlenebilir iş akışında sürüm
moderasyonu uygulamak için doğrulanmış bir raporla `finalAction: "quarantine"`
veya `finalAction: "revoke"` iletin.

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

Paket sürümü incelemesi için moderatör/yönetici uç noktası.

İstek:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Desteklenen durumlar:

- `approved`: elle incelenmiş ve izin verilmiş.
- `quarantined`: takip işlemi beklenirken engellenmiş.
- `revoked`: bir sürüme daha önce güvenildikten sonra engellenmiş.

Karantinaya alınan ve iptal edilen sürümler, yapıt indirme rotalarından `403`
döndürür. Her değişiklik bir denetim günlüğü girdisi oluşturur.

### `GET /api/v1/packages/{name}/file`

Bir paket dosyasının ham metin içeriğini döndürür.

Sorgu parametreleri:

- `path` (zorunlu)
- `version` (isteğe bağlı)
- `tag` (isteğe bağlı)

Notlar:

- Varsayılan olarak en son sürümü kullanır.
- İndirme hız sınırı grubunu değil, okuma hız sınırı grubunu kullanır.
- İkili dosyalar `415` döndürür.
- Dosya boyutu sınırı: 200 KB.
- Bekleyen VirusTotal taramaları okumaları engellemez; kötü amaçlı sürümler başka yerlerde yine de sunulmayabilir.
- Özel paketler, çağıran taraf paket sahibi yayıncıyı okuyamıyorsa `404` döndürür.

### `GET /api/v1/packages/{name}/download`

Bir paket sürümünün eski, deterministik ZIP arşivini indirir.

Sorgu parametreleri:

- `version` (isteğe bağlı)
- `tag` (isteğe bağlı)

Notlar:

- Varsayılan olarak en son sürümü kullanır.
- Skills, `GET /api/v1/download` rotasına yönlendirilir.
- Eski OpenClaw istemcilerinin çalışmaya devam etmesi için Plugin/paket arşivleri
  `package/` köküne sahip zip dosyalarıdır.
- Bu rota yalnızca ZIP olarak kalır. ClawPack `.tgz` dosyalarını akışla iletmez.
- Çözümleyici bütünlük kontrolleri için yanıtlar `ETag`, `Digest`,
  `X-ClawHub-Artifact-Type` ve `X-ClawHub-Artifact-Sha256` üstbilgilerini içerir.
- Yalnızca kayıt defterine ait meta veriler, indirilen arşive eklenmez.
- Bekleyen VirusTotal taramaları indirmeleri engellemez; kötü amaçlı sürümler `403` döndürür.
- Özel paketler, çağıran taraf paket sahibi değilse `404` döndürür.

### `GET /api/npm/{package}`

ClawPack tabanlı paket sürümleri için npm uyumlu bir paket belgesi döndürür.

Notlar:

- Yalnızca yüklenmiş ClawPack npm-pack tar arşivlerine sahip sürümler listelenir.
- Yalnızca eski ZIP biçiminde olan sürümler kasıtlı olarak dahil edilmez.
- Kullanıcıların isterlerse npm'i yansıya yönlendirebilmeleri için `dist.tarball`,
  `dist.integrity` ve `dist.shasum`, npm uyumlu alanlar kullanır.
- Kapsamlı paket belgeleri hem `/api/npm/@scope/name` hem de npm'in
  kodlanmış `/api/npm/@scope%2Fname` istek yolunu destekler.

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm yansı istemcileri için yüklenen ClawPack tar arşivinin baytlarını aynen akışla iletir.

Notlar:

- İndirme hız sınırı grubunu kullanır.
- İndirme üstbilgileri, ClawHub SHA-256 değerinin yanı sıra npm bütünlük/shasum meta verilerini içerir.
- Moderasyon ve özel paket erişim kontrolleri uygulanmaya devam eder.

### `GET /api/v1/resolve`

CLI tarafından yerel bir parmak izini bilinen bir sürümle eşleştirmek için kullanılır.

Sorgu parametreleri:

- `slug` (zorunlu)
- `hash` (zorunlu): paket parmak izinin 64 karakterlik onaltılık sha256 değeri

Yanıt:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Barındırılan bir skill sürümünün ZIP dosyasını indirir veya barındırılan sürümü
bulunmayan ve `clean` ya da `suspicious` taramasına sahip güncel, GitHub tabanlı
bir skill için GitHub kaynak devri döndürür.

Sorgu parametreleri:

- `slug` (zorunlu)
- `version` (isteğe bağlı): semver dizgesi
- `tag` (isteğe bağlı): etiket adı (ör. `latest`)

Notlar:

- `version` veya `tag` sağlanmazsa en son sürüm kullanılır.
- Geçici olarak silinen sürümler `410` döndürür.
- GitHub tabanlı skill devirleri baytları vekil üzerinden iletmez veya yansıtmaz.
  JSON yanıtı `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  ve `archiveUrl` içerir; tarama/güncel durum bir geçittir ve başarılı yanıtın
  meta verilerine dahil edilmez.
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

- Tercih edilen: `payload` JSON'u + `files[]` blob'ları içeren `multipart/form-data`.
- `files` içeren JSON gövdesi (storageId tabanlı) de kabul edilir.
- İsteğe bağlı yük alanı: `ownerHandle`. Mevcut olduğunda API, bu yayıncıyı
  sunucu tarafında çözümler ve işlemi yapan kişinin yayıncı erişimine sahip
  olmasını gerektirir.
- İsteğe bağlı yük alanı: `migrateOwner`. `ownerHandle` ile birlikte `true`
  olduğunda, işlemi yapan kişi hem mevcut hem de hedef yayıncılarda
  yönetici/sahip ise mevcut bir skill bu sahibe taşınabilir. Bu açık onay
  olmadan sahip değişiklikleri reddedilir.

### `POST /api/v1/packages`

Bir code-plugin veya bundle-plugin sürümü yayımlar.

- Bearer belirteciyle kimlik doğrulaması gerektirir.
- `multipart/form-data` gerektirir.
- İzin verilen form alanları `payload`, yinelenen `files` blob'ları veya tek bir
  `clawpack` tar arşivi başvurusudur. `clawpack`, bir `.tgz` blob'u veya
  yükleme URL'si akışının döndürdüğü bir depolama kimliği olabilir. Hazırlanmış
  depolama kimliğiyle yapılan yayımlar, bu yükleme URL'siyle döndürülen
  `clawpackUploadTicket` değerini de içermelidir.
- `files` veya `clawpack` seçeneklerinden birini kullanın; aynı istekte asla ikisini birden kullanmayın.
- JSON gövdeleri ve çağıran tarafın sağladığı `payload.files` / `payload.artifact`
  meta verileri reddedilir.
- Doğrudan çok parçalı yayımlama istekleri 18 MB ile sınırlıdır. ClawPack tar
  arşivleri, 120 MB tar arşivi sınırına kadar yükleme URL'si akışını kullanabilir.
- İsteğe bağlı yük alanı: `ownerHandle`. Mevcut olduğunda yalnızca yöneticiler bu sahip adına yayımlama yapabilir.

Doğrulamada öne çıkanlar:

- `family`, `code-plugin` veya `bundle-plugin` olmalıdır.
- Plugin paketleri `openclaw.plugin.json` gerektirir. ClawPack `.tgz` yüklemeleri
  bu dosyayı `package/openclaw.plugin.json` konumunda içermelidir.
- Kod Plugin'leri `package.json`, kaynak depo meta verileri, kaynak commit meta
  verileri, yapılandırma şeması meta verileri, `openclaw.compat.pluginApi` ve
  `openclaw.build.openclawVersion` gerektirir.
- `openclaw.hostTargets` ve `openclaw.environment` isteğe bağlı meta verilerdir.
- Yalnızca `openclaw` kuruluş yayıncısı ve mevcut `openclaw` kuruluş üyelerinin
  kişisel yayıncıları `official` kanalında yayımlama yapabilir.
- Başkası adına yapılan yayımlamalarda da resmi kanal uygunluğu hedef sahip hesabına göre doğrulanır.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Bir skill'i geçici olarak siler / geri yükler (sahip, moderatör veya yönetici).

İsteğe bağlı JSON gövdesi:

```json
{ "reason": "Held for moderation pending legal review." }
```

Mevcut olduğunda `reason`, skill moderasyon notu olarak saklanır ve denetim günlüğüne kopyalanır.
Sahibin başlattığı geçici silme işlemleri kısa adı 30 gün boyunca ayırır; ardından kısa ad başka
bir yayıncı tarafından alınabilir. Bu süre sonu geçerli olduğunda silme yanıtı `slugReservedUntil`
alanını içerir. Moderatör/yönetici gizlemeleri ve güvenlik nedeniyle kaldırmalar bu şekilde sona ermez.

Silme yanıtı:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Durum kodları:

- `200`: başarılı
- `401`: kimlik doğrulanmadı
- `403`: yasak
- `404`: skill/kullanıcı bulunamadı
- `500`: dahili sunucu hatası

### `POST /api/v1/users/publisher`

Yalnızca yönetici. Bir tanıtıcı için kuruluş yayıncısının var olmasını sağlar. Tanıtıcı hâlâ
eski bir paylaşılan kullanıcı/kişisel yayıncıya işaret ediyorsa uç nokta önce bunu bir kuruluş
yayıncısına taşır. Yeni oluşturulan bir kuruluş için `memberHandle` sağlayın; işlemi yapan yönetici
üye olarak eklenmez. `memberRole` varsayılan olarak `owner` değerini kullanır.

- Gövde: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Yanıt: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Kimliği doğrulanmış kullanıcıların kendi kendine kuruluş yayıncısı oluşturması. Yeni bir kuruluş
yayıncısı oluşturur ve çağıran tarafı sahip olarak ekler. Bu uç nokta mevcut kullanıcı/kişisel
tanıtıcıları taşımaz ve yayıncıyı güvenilir/resmî olarak işaretlemez.

- Gövde: `{ "handle": "opik", "displayName": "Opik" }`
- Yanıt: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Tanıtıcı zaten bir yayıncı, kullanıcı veya kişisel yayıncı tarafından kullanılıyorsa `409` döndürür.

### `POST /api/v1/users/reserve`

Yalnızca yönetici. Bir sürüm yayımlamadan kök kısa adları ve paket adlarını hak sahibi için ayırır.
Paket adları, sürüm satırı olmayan özel yer tutucu paketlere dönüşür; böylece aynı sahip daha sonra
gerçek code-plugin veya bundle-plugin sürümünü bu ad altında yayımlayabilir.

- Gövde: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Yanıt: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Yalnızca yönetici. Convex Auth hesap satırlarını düzenlemeden, doğrulanmış bir yedek GitHub OAuth
sorumlusu için kişisel yayıncıyı kurtarır. İstek, değiştirilemez GitHub sağlayıcı hesap kimliklerinin
ikisini de belirtmelidir; değiştirilebilir tanıtıcılar yalnızca operatöre yönelik bir güvenlik kontrolü
olarak kullanılır.

Uç nokta varsayılan olarak deneme çalıştırması yapar. Kurtarma işlemini uygulamak için personelin her iki
GitHub sorumlusu arasındaki sürekliliği bağımsız olarak doğrulamasının ardından `dryRun: false` ve
`confirmIdentityVerified: true` gerekir. Hedef kullanıcının mevcut kişisel
yayıncısında Skills, paketler veya GitHub Skill kaynakları varsa kurtarma güvenli biçimde başarısız olur.
Kurtarma ayrıca doğrudan sahip yollarının yeni yayıncı yetkisiyle uyumlu olması için kurtarılan yayıncının Skills öğeleri,
Skill kısa ad takma adları, paketleri, paket denetçisi uyarıları ve türetilmiş arama özeti satırlarındaki eski `ownerUserId` alanlarını taşır.
Kurtarılan kısa ad için etkin bir korumalı kısa ad rezervasyonu da yeni kullanıcıya yeniden atanır; böylece daha sonraki
profil eşitlemesi eski kullanıcının rakip yetkisini geri yükleyemez. Her birincil tablo, uygulama işlemi başına
100 satırla sınırlıdır; daha büyük kurtarma işlemlerinde önce devam ettirilebilir bir sahip taşıması kullanılmalıdır.
GitHub Skill kaynakları yayıncı kapsamındadır ve yeniden yazılmak yerine kontrol edilmiş olarak bildirilir.

- Gövde: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Yanıt: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Sahip kısa adı yönetimi uç noktaları

- `POST /api/v1/skills/{slug}/rename`
  - Gövde: `{ "newSlug": "new-canonical-slug" }`
  - Yanıt: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Gövde: `{ "targetSlug": "canonical-target-slug" }`
  - Yanıt: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Notlar:

- Her iki uç nokta da API belirteciyle kimlik doğrulaması gerektirir ve yalnızca Skill sahibi için çalışır.
- `rename`, önceki kısa adı yönlendirme takma adı olarak korur.
- `merge`, kaynak listelemeyi gizler ve kaynak kısa adını hedef listelemeye yönlendirir.

### Sahipliği aktarma uç noktaları

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

Bir kullanıcıyı yasaklayın ve sahip olduğu Skills öğelerini kalıcı olarak silin (yalnızca moderatör/yönetici).

Gövde:

```json
{ "handle": "user_handle", "reason": "optional ban reason" }
```

veya

```json
{ "userId": "users_...", "reason": "optional ban reason" }
```

Yanıt:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

Bir kullanıcının yasağını kaldırın ve uygun Skills öğelerini geri yükleyin (yalnızca yönetici).

Gövde:

```json
{ "handle": "user_handle", "reason": "optional unban reason" }
```

veya

```json
{ "userId": "users_...", "reason": "optional unban reason" }
```

Yanıt:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

Yasağı kaldırmadan veya içeriği geri yüklemeden mevcut bir yasağın kayıtlı nedenini değiştirin
(yalnızca yönetici). `dryRun`, `false` olmadığı sürece varsayılan olarak deneme çalıştırması yapılır.

Gövde:

```json
{ "handle": "user_handle", "reason": "bulk publishing spam", "dryRun": true }
```

veya

```json
{ "userId": "users_...", "reason": "bulk publishing spam", "dryRun": false }
```

Yanıt:

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "malware auto-ban",
  "nextReason": "bulk publishing spam",
  "changed": true
}
```

### `POST /api/v1/users/role`

Bir kullanıcı rolünü değiştirin (yalnızca yönetici).

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

Kullanıcıları listeleyin veya arayın (yalnızca yönetici).

Sorgu parametreleri:

- `q` (isteğe bağlı): arama sorgusu
- `query` (isteğe bağlı): `q` için takma ad
- `limit` (isteğe bağlı): azami sonuç sayısı (varsayılan 20, azami 200)

Yanıt:

```json
{
  "items": [
    {
      "userId": "users_...",
      "handle": "user_handle",
      "displayName": "User",
      "name": "User",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

Yıldız ekleyin/kaldırın (öne çıkarma). Her iki uç nokta da eşgüçlüdür.

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

Kaldırma planı için `DEPRECATIONS.md` dosyasına bakın.

`POST /api/cli/upload-url`, `uploadUrl` ve `uploadTicket` döndürür. Bir ClawPack tar arşivini
hazırlama aşamasına alan paket yayımlama işlemleri, ortaya çıkan depolama kimliğini `clawpack`,
döndürülen bileti ise `clawpackUploadTicket` olarak göndermelidir.

## Kayıt defteri keşfi (`/.well-known/clawhub.json`)

CLI, kayıt defteri/kimlik doğrulama ayarlarını siteden keşfedebilir:

- `/.well-known/clawhub.json` (JSON, tercih edilen)
- `/.well-known/clawdhub.json` (eski)

Şema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Kendi sunucunuzda barındırıyorsanız bu dosyayı sunun (veya `CLAWHUB_REGISTRY` değişkenini açıkça ayarlayın; eski değişken `CLAWDHUB_REGISTRY`).

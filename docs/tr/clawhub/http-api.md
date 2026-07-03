---
read_when:
    - Uç noktalar ekleme/değiştirme
    - CLI ↔ kayıt defteri isteklerinde hata ayıklama
summary: HTTP API referansı (genel + CLI uç noktaları + kimlik doğrulama).
x-i18n:
    generated_at: "2026-07-03T23:39:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

Temel URL: `https://clawhub.ai` (varsayılan).

Tüm v1 yolları `/api/v1/...` altındadır.
Eski `/api/...` ve `/api/cli/...` uyumluluk için kalır (`DEPRECATIONS.md` bölümüne bakın).
OpenAPI: `/api/v1/openapi.json`.

## Herkese açık katalog yeniden kullanımı

Üçüncü taraf dizinler, ClawHub Skills öğelerini listelemek veya aramak için herkese açık okuma uç noktalarını kullanabilir. Lütfen sonuçları önbelleğe alın, `429`/`Retry-After` değerlerine uyun, kullanıcıları kanonik ClawHub listesine (`https://clawhub.ai/<owner>/skills/<slug>`) geri bağlayın ve ClawHub'ın üçüncü taraf siteyi onayladığı izlenimini vermekten kaçının. Herkese açık API yüzeyinin dışında gizli, özel veya moderasyon tarafından engellenmiş içeriği yansıtmaya çalışmayın.

Web slug kısayolları kayıt defteri aileleri arasında çözümlenir, ancak API istemcileri rota
önceliğini yeniden oluşturmak yerine okuma uç noktaları tarafından döndürülen kanonik URL'leri
kullanmalıdır.

## Hız sınırları

Uygulama modeli:

- Anonim istekler: IP başına uygulanır.
- Kimliği doğrulanmış istekler (geçerli Bearer belirteci): kullanıcı kovası başına uygulanır.
- Belirteç eksik/geçersizse davranış IP uygulamasına geri döner.
- Kimliği doğrulanmış yazma uç noktaları, sunucu nedeni bildiğinde çıplak bir `Unauthorized`
  döndürmemelidir. Eksik belirteçler, geçersiz/iptal edilmiş belirteçler ve
  silinmiş/yasaklanmış/devre dışı hesapların her biri işlem yapılabilir metin almalıdır; böylece CLI
  istemcileri kullanıcılara onları neyin engellediğini söyleyebilir.

- Okuma: IP başına 3000/dak, anahtar başına 12000/dak
- Yazma: IP başına 300/dak, anahtar başına 3000/dak
- İndirme: IP başına 1200/dak, anahtar başına 6000/dak (indirme uç noktaları)

Başlıklar:

- Eski uyumluluk: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Standartlaştırılmış: `RateLimit-Limit`, `RateLimit-Reset`
- `429` durumunda: `X-RateLimit-Remaining: 0` ve `RateLimit-Remaining: 0`
- `429` durumunda: `Retry-After`

Başlık semantiği:

- `X-RateLimit-Reset`: mutlak Unix epoch saniyeleri
- `RateLimit-Reset`: sıfırlamaya kadar saniye (gecikme)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: mevcut olduğunda kesin kalan bütçe.
  Parçalanmış başarılı istekler yaklaşık bir küresel değer döndürmek yerine bu başlığı atlar.
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

Rate limit exceeded
```

İstemci kılavuzu:

- `Retry-After` varsa, yeniden denemeden önce o kadar saniye bekleyin.
- Eşzamanlı yeniden denemeleri önlemek için jitter uygulanmış geri çekilme kullanın.
- `Retry-After` eksikse, `RateLimit-Reset` değerine geri dönün (veya `X-RateLimit-Reset` değerinden hesaplayın).

IP kaynağı:

- `cf-connecting-ip` dahil güvenilir istemci IP başlıklarını yalnızca dağıtım
  güvenilir iletilen başlıkları açıkça etkinleştirdiğinde kullanır.
- ClawHub, istemci IP'lerini uçta tanımlamak için güvenilir iletme başlıklarını kullanır.
- Güvenilir istemci IP'si yoksa anonim istekler yalnızca hız sınırı türüne göre
  kapsamlandırılmış yedek kovalari kullanır. Bu yedek kovalar çağıran tarafından sağlanan
  yolları, slug'ları, paket adlarını, sürümleri, sorgu dizelerini veya diğer
  yapıt parametrelerini içermez.

## Hata yanıtları

Herkese açık v1 hata yanıtları `content-type: text/plain; charset=utf-8` ile düz metindir.
Buna doğrulama hataları (`400`), eksik herkese açık kaynaklar (`404`), kimlik doğrulama ve
izin hataları (`401`/`403`), hız sınırları (`429`) ve engellenmiş indirmeler dahildir. İstemciler
yanıt gövdesini insan tarafından okunabilir bir dize olarak okumalıdır. Bilinmeyen sorgu parametreleri
uyumluluk için yok sayılır, ancak geçersiz değerleri olan tanınan sorgu parametreleri
`400` döndürür.

## Herkese açık uç noktalar (kimlik doğrulama yok)

### `GET /api/v1/search`

Sorgu parametreleri:

- `q` (gerekli): sorgu dizesi
- `limit` (isteğe bağlı): tam sayı
- `highlightedOnly` (isteğe bağlı): öne çıkarılmış Skills öğelerine filtrelemek için `true`
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

- Sonuçlar alaka sırasına göre döndürülür (embedding benzerliği + tam slug/ad belirteci artırımları + küçük bir popülerlik önceliği).
- Alaka popülerlikten daha güçlüdür. Kesin bir slug veya görüntülenen ad belirteci eşleşmesi, çok daha güçlü etkileşime sahip daha gevşek bir eşleşmenin önüne geçebilir.
- ASCII metin, sözcük ve noktalama sınırlarında belirteçlere ayrılır. Örneğin `personal-map` bağımsız bir `map` belirteci içerirken `amap-jsapi-skill` `amap`, `jsapi` ve `skill` içerir; bu nedenle `map` araması `personal-map` için `amap-jsapi-skill` değerinden daha güçlü bir sözcüksel eşleşme verir.
- Popülerlik logaritmik ölçeklenir ve sınırlandırılır. Yüksek etkileşimli Skills öğeleri, sorgu metni daha zayıf eşleştiğinde daha düşük sıralanabilir.
- Şüpheli veya gizli moderasyon durumu, çağıran filtrelerine ve mevcut moderasyon durumuna bağlı olarak bir Skill öğesini herkese açık aramadan kaldırabilir.

Yayıncı keşfedilebilirlik kılavuzu:

- Kullanıcıların tam olarak arayacağı terimleri görüntülenen ada, özete ve etiketlere koyun. Bağımsız bir slug belirtecini yalnızca korumak istediğiniz kararlı bir kimlik olduğunda kullanın.
- Yeni slug daha iyi bir uzun vadeli kanonik ad olmadıkça yalnızca bir sorguyu hedeflemek için slug adını değiştirmeyin. Eski slug'lar yönlendirme takma adları olur, ancak kanonik URL, görüntülenen slug ve gelecekteki arama özetleri yeni slug'ı kullanır.
- Yeniden adlandırma takma adları eski URL'ler ve kayıt defteri üzerinden çözümlenen kurulumlar için çözümlemeyi korur, ancak arama sıralaması yeniden adlandırma indekslendikten sonra kanonik Skill metadata'sına dayanır. Mevcut istatistikler Skill ile kalır.
- Bir Skill beklenmedik şekilde görünmezse, sıralamayla ilgili metadata'yı değiştirmeden önce oturum açmışken önce `clawhub inspect @owner/slug` ile moderasyon durumunu kontrol edin.

### `GET /api/v1/skills`

Sorgu parametreleri:

- `limit` (isteğe bağlı): tam sayı (1–200)
- `cursor` (isteğe bağlı): `trending` dışındaki herhangi bir sıralama için sayfalama imleci
- `sort` (isteğe bağlı): `updated` (varsayılan), `recommended` (takma ad: `default`), `createdAt` (takma ad: `newest`), `downloads`, `stars` (takma ad: `rating`), eski kurulum takma adları `installsCurrent`/`installs`/`installsAllTime` `downloads` değerine eşlenir, `trending`
- `nonSuspiciousOnly` (isteğe bağlı): şüpheli (`flagged.suspicious`) Skills öğelerini gizlemek için `true`
- `nonSuspicious` (isteğe bağlı): `nonSuspiciousOnly` için eski takma ad

Geçersiz `sort` değerleri `400` döndürür.

Notlar:

- `recommended` etkileşim ve güncellik sinyallerini kullanır.
- `trending`, son 7 gündeki kurulumlara göre sıralar (telemetri tabanlı).
- `createdAt` yeni Skill taramaları için kararlıdır; `updated` mevcut Skills yeniden yayımlandığında değişir.
- `nonSuspiciousOnly=true` olduğunda, imleç tabanlı sıralamalar bir sayfada `limit` öğeden daha az döndürebilir çünkü şüpheli Skills sayfa alımından sonra filtrelenir.
- Mevcut olduğunda sayfalamaya devam etmek için `nextCursor` kullanın. Kısa bir sayfa tek başına sonuçların bittiği anlamına gelmez.

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

- Sahip yeniden adlandırma/birleştirme akışları tarafından oluşturulan eski slug'lar kanonik Skill öğesine çözümlenir.
- `metadata.os`: Skill frontmatter içinde bildirilen OS kısıtlamaları (örn. `["macos"]`, `["linux"]`). Bildirilmemişse `null`.
- `metadata.systems`: Nix sistem hedefleri (örn. `["aarch64-darwin", "x86_64-linux"]`). Bildirilmemişse `null`.
- Skill'in platform metadata'sı yoksa `metadata` `null` olur.
- `moderation` yalnızca Skill işaretlenmişse veya sahibi onu görüntülüyorsa dahil edilir.

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

- Sahipler ve moderatörler gizli Skills için moderasyon ayrıntılarına erişebilir.
- Herkese açık çağıranlar yalnızca zaten işaretlenmiş görünür Skills için `200` alır.
- Kanıt herkese açık çağıranlar için redakte edilir ve ham parçaları yalnızca sahipler/moderatörler için içerir.

### `POST /api/v1/skills/{slug}/report`

Bir Skill'i moderatör incelemesi için bildirin. Bildirimler Skill düzeyindedir, isteğe bağlı olarak
bir sürüme bağlanır ve Skill bildirim kuyruğunu besler.

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

Skill bildirim alımı için moderatör/yönetici uç noktası.

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

Skill bildirimlerini çözmek veya yeniden açmak için moderatör/yönetici uç noktası.

İstek:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note`, `confirmed` ve `dismissed` için gereklidir; `status` tekrar `open` olarak
ayarlanırken atlanabilir. Denetlenebilir aynı iş akışında Skill'i gizlemek için denetlenmiş
bir bildirimle `finalAction: "hide"` geçirin.

### `GET /api/v1/skills/{slug}/versions`

Sorgu parametreleri:

- `limit` (isteğe bağlı): tam sayı
- `cursor` (isteğe bağlı): sayfalama imleci

### `GET /api/v1/skills/{slug}/versions/{version}`

Sürüm metadata'sı + dosya listesini döndürür.

- `version.security`, mevcut olduğunda normalleştirilmiş tarama doğrulama durumunu ve tarayıcı ayrıntılarını
  (VirusTotal + LLM) içerir.

### `GET /api/v1/skills/{slug}/scan`

Bir Skill sürümü için güvenlik taraması doğrulama ayrıntılarını döndürür.

Sorgu parametreleri:

- `version` (isteğe bağlı): belirli sürüm dizesi.
- `tag` (isteğe bağlı): etiketlenmiş bir sürümü çözümle (örneğin `latest`).

Notlar:

- Ne `version` ne de `tag` sağlanırsa en son sürümü kullanır.
- Normalize edilmiş doğrulama durumunu ve tarayıcıya özgü ayrıntıları içerir.
- `security.hasScanResult`, yalnızca bir tarayıcı kesin bir karar (`clean`, `suspicious` veya `malicious`) ürettiğinde `true` olur.
- `moderation`, en son sürümden türetilmiş geçerli Skills düzeyinde moderasyon anlık görüntüsüdür.
- Geçmiş bir sürüm sorgulanırken, `moderation` ve `security` aynı sürüm bağlamı olarak ele alınmadan önce `moderation.matchesRequestedVersion` ve `moderation.sourceVersion` değerlerini kontrol edin.

### `POST /api/v1/skills/-/scan`

Yeni ClawScan işleri için kimliği doğrulanmış gönderim uç noktası.

Yerel yükleme taramaları artık desteklenmiyor. `multipart/form-data` veya `{ "source": { "kind": "upload" } }` kullanan istekler `410` döndürür.

Yayımlanmış taramalar JSON kullanır:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Notlar:

- Tarama isteği yükleri ve indirilebilir raporlar, saklama penceresinden sonra tarama isteği deposundan sona erer.
- Yayımlanmış taramalar, sahip/yayımcı yönetim erişimi veya platform moderatörü/yöneticisi yetkisi gerektirir.
- Yayımlanmış taramalar yalnızca `update: true` olduğunda ve tarama başarıyla tamamlandığında geri yazar.
- Yanıt `202` olur ve `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` içerir.
- Tarama işleri eşzamansızdır. Manuel tarama istekleri normal yayımlama/geri doldurma işlerinden önce önceliklendirilir, ancak tamamlanma yine de çalışan uygunluğuna bağlıdır.

### `GET /api/v1/skills/-/scan/{scanId}`

Gönderilmiş bir tarama için kimliği doğrulanmış yoklama uç noktası.

- Kuyruğa alınmış/çalışıyor/başarılı/başarısız durumunu döndürür.
- Kuyruktayken `queue.queuedAhead` ve `queue.position` değerlerini döndürür; böylece istemciler isteğin önünde kaç önceliklendirilmiş manuel tarama olduğunu gösterebilir. Çok büyük kuyruklar sınırlandırılır ve `queuedAheadIsEstimate: true` ile raporlanır.
- Kullanılabilir olduğunda, `report` `clawscan`, `skillspector`, `staticAnalysis` ve `virustotal` bölümlerini içerir.
- Başarısız tarama işleri `lastError` ile `status: "failed"` döndürür.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Kimliği doğrulanmış rapor arşivi uç noktası.

- Başarılı bir tarama gerektirir; terminal olmayan taramalar `409` döndürür.
- `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` ve `README.md` içeren bir ZIP döndürür.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Gönderilmiş sürümler için kimliği doğrulanmış saklanan rapor arşivi uç noktası.

- Skill veya Plugin için sahip/yayımcı yönetim erişimi ya da platform moderatörü/yöneticisi yetkisi gerektirir.
- Engellenmiş veya gizli sürümler dahil, tam gönderilen sürüm için saklanan tarama sonuçlarını döndürür.
- `kind` varsayılan olarak `skill` olur; plugin/paket taramaları için `kind=plugin` kullanın.
- Tarama isteği indirmeleriyle aynı ZIP biçimini döndürür.

### `POST /api/v1/skills/-/scan/batch`

Yalnızca yöneticiye açık kanonik toplu yeniden tarama rotası. Eski `POST /api/v1/skills/-/rescan-batch` ile aynı yük biçimini kabul eder.

### `POST /api/v1/skills/-/scan/batch/status`

Yalnızca yöneticiye açık kanonik toplu durum rotası. `{ "jobIds": ["..."] }` kabul eder ve eski `POST /api/v1/skills/-/rescan-batch/status` ile aynı toplu sayaçları döndürür.

### `GET /api/v1/skills/{slug}/verify`

`clawhub skill verify` tarafından kullanılan Skill Card doğrulama zarfını döndürür.

Sorgu parametreleri:

- `version` (isteğe bağlı): belirli sürüm dizesi.
- `tag` (isteğe bağlı): etiketlenmiş bir sürümü çözer (örneğin `latest`).

Notlar:

- `ok` yalnızca seçilen sürümün oluşturulmuş bir Skill Card'ı olduğunda, moderasyon tarafından kötü amaçlı yazılım nedeniyle engellenmediğinde ve ClawScan doğrulaması temiz olduğunda `true` olur.
- Skill kimliği, yayımcı kimliği ve seçilen sürüm meta verileri üst düzey zarf alanlarıdır (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`); böylece kabuk otomasyonu bunları iç içe sarmalayıcıları açmadan okuyabilir.
- `security`, üst düzey ClawScan/güvenlik kararıdır. Otomasyon `ok`, `decision`, `reasons` ve `security.status` değerlerini temel almalıdır.
- `security.signals`, `staticScan`, `virusTotal` ve `skillSpector` gibi destekleyici tarayıcı kanıtlarını içerir.
- `security.signals.dependencyRegistry`, v1 yanıt uyumluluğu için korunur, ancak bağımlılık kayıt varlığı tarayıcısı emekliye ayrılmıştır ve bu anahtar her zaman `null` olur.
- `provenance`, yalnızca ClawHub yayımlama veya içe aktarma sırasında bir GitHub depo/ref/commit/yolunu çözüp sakladığında `server-resolved-github-import` olur; aksi halde `unavailable` olur.

### `POST /api/v1/skills/-/security-verdicts`

Tam skill sürümleri için geçerli kompakt güvenlik kararlarını döndürür. Bu koleksiyon uç noktası, OpenClaw Control UI gibi, hangi yüklü ClawHub skill sürümlerini göstermeleri gerektiğini zaten bilen istemciler için tasarlanmıştır.

İstek:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Notlar:

- `items`, 1-100 benzersiz `{ slug, version }` çifti içermelidir.
- Sonuçlar öğe başınadır; eksik bir skill veya sürüm tüm yanıtı başarısız yapmaz.
- Yanıt yalnızca güvenlikle ilgilidir. Skill Card verilerini, oluşturulmuş kart durumunu, artefakt dosya listelerini veya ayrıntılı tarayıcı yüklerini içermez.
- `security.signals` yalnızca durum düzeyinde destekleyici kanıt içerir; tam tarayıcı ayrıntıları için `/scan` veya ClawHub güvenlik denetimi sayfasını kullanın.
- `security.signals.dependencyRegistry`, v1 yanıt uyumluluğu için korunur, ancak bağımlılık kayıt varlığı tarayıcısı emekliye ayrılmıştır ve bu anahtar her zaman `null` olur.
- Skill Card yokluğu, bu uç noktanın `ok`, `decision` veya `reasons` değerlerini etkilemez; istemciler kart içeriğine ihtiyaç duyduklarında yüklü `skill-card.md` dosyasını yerel olarak okumalıdır.
- Tek skill için Skill Card doğrulama zarfına ihtiyacınız olduğunda `/verify`, oluşturulmuş kart markdown'ına ihtiyacınız olduğunda `/card`, ayrıntılı tarayıcı verilerine ihtiyacınız olduğunda `/scan` kullanın.

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

- Varsayılan olarak en son sürüm kullanılır.
- Dosya boyutu sınırı: 200KB.

### `GET /api/v1/packages`

Şunlar için birleşik katalog uç noktası:

- skills
- code plugins
- bundle plugins

Sorgu parametreleri:

- `limit` (isteğe bağlı): tam sayı (1–100)
- `cursor` (isteğe bağlı): sayfalama imleci
- `family` (isteğe bağlı): `skill`, `code-plugin` veya `bundle-plugin`
- `channel` (isteğe bağlı): `official`, `community` veya `private`
- `isOfficial` (isteğe bağlı): `true` veya `false`
- `sort` (isteğe bağlı): `updated` (varsayılan), `recommended`, `trending`, `downloads`, eski takma ad `installs`
- `category` (isteğe bağlı): plugin kategori filtresi. Yalnızca istek plugin paketleriyle sınırlandırıldığında desteklenir (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` veya
  `family=code-plugin`/`family=bundle-plugin` içeren paket uç noktaları). Kontrollü kategoriler ve
  eski v1 filtre takma adları `GET /api/v1/plugins` altında belgelenmiştir.

Notlar:

- `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` veya `sort` için geçersiz değerler `400` döndürür. Bilinmeyen sorgu parametreleri yok sayılır.
- `GET /api/v1/code-plugins` ve `GET /api/v1/bundle-plugins` sabit aile takma adları olarak kalır.
- Skill girdileri skill registry tarafından desteklenmeye devam eder ve hâlâ yalnızca `POST /api/v1/skills` üzerinden yayımlanabilir.
- `POST /api/v1/packages` hâlâ yalnızca code-plugin ve bundle-plugin sürümleri içindir.
- Anonim çağıranlar yalnızca herkese açık paket kanallarını görür.
- Kimliği doğrulanmış çağıranlar, listeleme/arama sonuçlarında ait oldukları yayıncılar için özel paketleri görebilir.
- `channel=private` yalnızca kimliği doğrulanmış çağıranın okuyabildiği paketleri döndürür.

### `GET /api/v1/packages/search`

Skills + plugin paketleri genelinde birleşik katalog araması.

Sorgu parametreleri:

- `q` (gerekli): sorgu dizesi
- `limit` (isteğe bağlı): tam sayı (1–100)
- `family` (isteğe bağlı): `skill`, `code-plugin` veya `bundle-plugin`
- `channel` (isteğe bağlı): `official`, `community` veya `private`
- `isOfficial` (isteğe bağlı): `true` veya `false`
- `category` (isteğe bağlı): plugin kategori filtresi. Yalnızca istek
  plugin paketleriyle sınırlandırıldığında desteklenir. Kontrollü kategoriler ve eski v1
  filtre takma adları `GET /api/v1/plugins` altında belgelenmiştir.

Notlar:

- `family`, `channel`, `isOfficial`, `featured` veya
  `highlightedOnly` için geçersiz değerler `400` döndürür. Bilinmeyen sorgu parametreleri yok sayılır.
- Anonim çağıranlar yalnızca herkese açık paket kanallarını görür.
- Kimliği doğrulanmış çağıranlar ait oldukları yayıncılar için özel paketlerde arama yapabilir.
- `channel=private` yalnızca kimliği doğrulanmış çağıranın okuyabildiği paketleri döndürür.

### `GET /api/v1/plugins`

Code-plugin ve bundle-plugin paketleri arasında yalnızca Plugin kataloğu göz atma.

Sorgu parametreleri:

- `limit` (isteğe bağlı): tam sayı (1-100)
- `cursor` (isteğe bağlı): sayfalama imleci
- `isOfficial` (isteğe bağlı): `true` veya `false`
- `sort` (isteğe bağlı): `recommended` (varsayılan), `trending`, `downloads`, `updated`, eski takma ad `installs`
- `category` (isteğe bağlı): plugin kategori filtresi. Geçerli değerler:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Eski v1 filtre takma adları okuma uç noktalarında kabul edilmeye devam eder:

- `mcp-tooling`, `data` ve `automation`, `tools` olarak çözümlenir.
- `observability` ve `deployment`, `gateway` olarak çözümlenir.
- `dev-tools`, `runtime` olarak çözümlenir.

`trending`, yedi günlük yükleme/indirme lider panosudur ve tüm zamanların toplamlarını kullanmaz.
Birleşik `/api/v1/packages` uç noktasında yalnızca Plugin içindir; skill kataloğu için
`/api/v1/skills?sort=trending` kullanın.

Eski takma adlar, depolanan veya yazar tarafından bildirilen kategori değerleri olarak kabul edilmez.

### `GET /api/v1/skills/export`

Çevrimdışı analiz için en son herkese açık skills toplu dışa aktarımı.

Kimlik doğrulama:

- API token’ı gerekli.

Sorgu parametreleri:

- `startDate` (gerekli): skill `updatedAt` için Unix milisaniye alt sınırı.
- `endDate` (gerekli): skill `updatedAt` için Unix milisaniye üst sınırı.
- `limit` (isteğe bağlı): tam sayı (1-250), varsayılan `250`.
- `cursor` (isteğe bağlı): önceki yanıttan sayfalama imleci.

Yanıt:

- Gövde: ZIP arşivi.
- Dışa aktarılan her skill `{publisher}/{slug}/` kökünde yer alır.
- Barındırılan skills, en son depolanan sürüm dosyalarını içerir ve
  `_manifest.json` içinde `sourceRef: "public-clawhub"` ile listelenir.
- `clean` veya `suspicious` taraması olan geçerli GitHub destekli skills,
  `_source_handoff.json` içinde `sourceRef: "public-github"`, repo, commit, path,
  content hash ve arşiv URL’si içerir. ClawHub tarafından barındırılan kaynak dosyaları içermezler.
- Her skill `_export_skill_meta.json` içerir.
- `_manifest.json` her zaman ZIP kökünde bulunur.
- Tek tek skills veya dosyalar dışa aktarılamadığında `_errors.json` dahil edilir.

Başlıklar:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Çevrimdışı analiz için en son herkese açık plugin sürümlerinin toplu dışa aktarımı.

Kimlik doğrulama:

- API belirteci gerekir.

Sorgu parametreleri:

- `startDate` (gerekli): Plugin `updatedAt` için Unix milisaniye alt sınırı.
- `endDate` (gerekli): Plugin `updatedAt` için Unix milisaniye üst sınırı.
- `limit` (isteğe bağlı): tam sayı (1-250), varsayılan `250`.
- `cursor` (isteğe bağlı): önceki yanıttan sayfalama imleci.
- `family` (isteğe bağlı): `code-plugin` veya `bundle-plugin`. Atlanırsa iki
  plugin ailesi de kullanılır.

Yanıt:

- Gövde: ZIP arşivi.
- Dışa aktarılan her plugin `{family}/{packageName}/` kökünde yer alır.
- Dışa aktarılan her plugin, en son sürümün depolanan dosyalarını içerir.
- Plugin başına dışa aktarma meta verileri
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` konumunda depolanır.
- `_manifest.json` her zaman ZIP kökünde bulunur.
- Tekil plugin'ler veya dosyalar dışa aktarılamadığında `_errors.json`
  dahil edilir.

Başlıklar:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

Code-plugin ve bundle-plugin paketleri genelinde yalnızca plugin araması.

Sorgu parametreleri:

- `q` (gerekli): sorgu dizesi
- `limit` (isteğe bağlı): tam sayı (1-100)
- `isOfficial` (isteğe bağlı): `true` veya `false`
- `category` (isteğe bağlı): plugin kategorisi filtresi. Geçerli değerler:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Notlar:

- `GET /api/v1/plugins` altında belgelenen eski v1 filtre takma adları da
  kabul edilir.
- Kategori filtreleme, arama sorgusu yeniden yazımı değil, plugin kategori özet
  satırlarıyla desteklenen gerçek bir API filtresidir.
- Sonuçlar alaka sırasıyla döndürülür ve şu anda sayfalanmaz.
- Plugin araması için tarayıcı kullanıcı arayüzü sıralama kontrolleri, yüklenen
  alaka sonuçlarını yeniden sıralar ve mevcut `/skills` gezinme davranışıyla eşleşir.

### `GET /api/v1/packages/{name}`

Paket ayrıntı meta verilerini döndürür.

Notlar:

- Skills, birleşik katalogda bu rota üzerinden de çözümlenebilir.
- Özel paketler, çağıran taraf sahibi yayıncıyı okuyamadığı sürece `404` döndürür.

### `DELETE /api/v1/packages/{name}`

Bir paketi ve tüm sürümlerini geçici olarak siler.

Notlar:

- Paket sahibi, kuruluş yayıncısı sahibi/yöneticisi, platform moderatörü veya
  platform yöneticisi için API belirteci gerektirir.

### `GET /api/v1/packages/{name}/versions`

Sürüm geçmişini döndürür.

Sorgu parametreleri:

- `limit` (isteğe bağlı): tam sayı (1–100)
- `cursor` (isteğe bağlı): sayfalama imleci

Notlar:

- Özel paketler, çağıran taraf sahibi yayıncıyı okuyamadığı sürece `404` döndürür.

### `GET /api/v1/packages/{name}/versions/{version}`

Dosya meta verileri, uyumluluk, doğrulama, artifact meta verileri ve tarama
verileri dahil olmak üzere bir paket sürümünü döndürür.

Notlar:

- `version.artifact.kind`, eski dünya paket arşivleri için `legacy-zip` veya
  ClawPack destekli sürümler için `npm-pack` olur.
- ClawPack sürümleri npm uyumlu `npmIntegrity`, `npmShasum` ve
  `npmTarballName` alanlarını içerir.
- `version.sha256hash`, eski istemciler için kullanımdan kaldırılmış uyumluluk
  meta verisidir. `/api/v1/packages/{name}/download` tarafından döndürülen tam
  ZIP baytlarını hash'ler. Modern istemciler, kanonik sürüm artifact'ını
  tanımlayan `version.artifact.sha256` değerini kullanmalıdır.
- Tarama verileri mevcut olduğunda `version.vtAnalysis`, `version.llmAnalysis`
  ve `version.staticScan` dahil edilir.
- Özel paketler, çağıran taraf sahibi yayıncıyı okuyamadığı sürece `404` döndürür.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Kurulum istemcileri için tam paket sürümü güvenlik ve güven özeti döndürür. Bu,
çözümlenen bir sürümün kurulup kurulamayacağına karar vermek için herkese açık
OpenClaw tüketim yüzeyidir.

Kimlik doğrulama:

- Herkese açık okuma uç noktası. Sahip, yayıncı, moderatör veya yönetici
  belirteci gerekmez.

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

- `package.name`, `package.displayName` ve `package.family`, çözümlenen kayıt
  paketini tanımlar.
- `release.releaseId`, `release.version` ve `release.createdAt`, değerlendirilen
  tam sürümü tanımlar.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` ve `release.npmTarballName`, sürüm artifact'ı için
  bilindiğinde bulunur.
- `trust.scanStatus`, tarayıcı girdilerinden ve manuel sürüm moderasyonundan
  türetilen geçerli güven durumudur.
- `trust.moderationState` null olabilir. Manuel sürüm moderasyonu yoksa `null`
  olur.
- `trust.blockedFromDownload`, kurulum engelleme sinyalidir. OpenClaw ve diğer
  kurulum istemcileri, tarayıcı veya moderasyon alanlarından engelleme kurallarını
  yeniden türetmek yerine bu değer `true` olduğunda kurulumu engellemelidir.
- `trust.reasons`, kullanıcıya gösterilen ve denetim amaçlı açıklama listesidir.
  Neden kodları `manual:quarantined`, `scan:malicious` ve `package:malicious`
  gibi kararlı, kompakt dizelerdir.
- `trust.pending`, bir veya daha fazla güven girdisinin hâlâ tamamlanmayı
  beklediği anlamına gelir.
- `trust.stale`, güven özetinin güncel olmayan girdilerden hesaplandığı ve yüksek
  güvenli izin kararı verilmeden önce yenileme gerektiriyor olarak ele alınması
  gerektiği anlamına gelir.

Notlar:

- Bu uç nokta sürüme özeldir. İstemciler, yalnızca en son paket meta verilerini
  okuduktan sonra değil, kurmayı amaçladıkları paket sürümünü çözdükten sonra
  bunu çağırmalıdır.
- Özel paketler, çağıran taraf sahibi yayıncıyı okuyamadığı sürece `404` döndürür.
- Bu uç nokta, sahip/moderatör moderasyon uç noktalarından bilinçli olarak daha
  dardır. Bildirici kimliklerini, bildirim gövdelerini, özel kanıtları veya
  dahili inceleme zaman çizelgelerini değil, kurulum kararını ve herkese açık
  açıklamayı gösterir.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Bir paket sürümü için açık artifact çözücü meta verilerini döndürür.

Notlar:

- Eski paket sürümleri bir `legacy-zip` artifact'ı ve eski ZIP `downloadUrl`
  döndürür.
- ClawPack sürümleri bir `npm-pack` artifact'ı, npm bütünlük alanları, bir
  `tarballUrl` ve eski ZIP uyumluluk URL'si döndürür.
- Bu, OpenClaw çözücü yüzeyidir; paylaşılan bir URL'den arşiv biçimini tahmin
  etmeyi önler.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Açık çözücü yolu üzerinden sürüm artifact'ını indirir.

Notlar:

- ClawPack sürümleri tam yüklenen npm-pack `.tgz` baytlarını akış olarak gönderir.
- Eski ZIP sürümleri `/api/v1/packages/{name}/download?version=` adresine yönlendirir.
- İndirme hız kovasını kullanır.

### `GET /api/v1/packages/{name}/readiness`

Gelecekteki OpenClaw tüketimi için hesaplanan hazır olma durumunu döndürür.

Hazır olma kontrolleri şunları kapsar:

- resmi kanal durumu
- en son sürüm kullanılabilirliği
- ClawPack npm-pack artifact kullanılabilirliği
- artifact özeti
- kaynak repo ve commit kökeni
- OpenClaw uyumluluk meta verileri
- host hedefleri
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

Resmi OpenClaw plugin geçiş satırlarını listelemek için moderatör uç noktası.

Kimlik doğrulama:

- Moderatör veya yönetici kullanıcı için API belirteci gerektirir.

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

Resmi bir plugin geçiş satırı oluşturmak veya güncellemek için yönetici uç noktası.

Kimlik doğrulama:

- Yönetici kullanıcı için API belirteci gerektirir.

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

- `bundledPluginId` küçük harfe normalleştirilir ve kararlı upsert anahtarıdır.
- `packageName` npm adına göre normalleştirilir; planlanan geçişler için paket
  eksik olabilir.
- Bu yalnızca geçiş hazır olma durumunu izler. OpenClaw'ı değiştirmez veya
  ClawPack oluşturmaz.

### `GET /api/v1/packages/moderation/queue`

Paket sürümü inceleme kuyrukları için moderatör/yönetici uç noktası.

Kimlik doğrulama:

- Moderatör veya yönetici kullanıcı için API belirteci gerektirir.

Sorgu parametreleri:

- `status` (isteğe bağlı): `open` (varsayılan), `blocked`, `manual` veya `all`
- `limit` (isteğe bağlı): tam sayı (1-100)
- `cursor` (isteğe bağlı): sayfalama imleci

Durum anlamları:

- `open`: şüpheli, kötü amaçlı, bekleyen, karantinaya alınmış, iptal edilmiş veya bildirilmiş sürümler.
- `blocked`: karantinaya alınmış, iptal edilmiş veya kötü amaçlı sürümler.
- `manual`: manuel moderasyon geçersiz kılması olan herhangi bir sürüm.
- `all`: manuel geçersiz kılması, temiz olmayan tarama durumu veya paket bildirimi olan herhangi bir sürüm.

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

Bir paketi moderatör incelemesi için bildirir. Bildirimler paket düzeyindedir ve
isteğe bağlı olarak bir sürüme bağlanır. Moderasyon kuyruğunu beslerler ancak
tek başlarına indirmeleri otomatik olarak gizlemez veya engellemezler;
moderatörler artifact'ları onaylamak, karantinaya almak veya iptal etmek için
sürüm moderasyonunu kullanmalıdır.

Kimlik doğrulama:

- API belirteci gerektirir.

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

- Moderatör veya yönetici kullanıcı için bir API belirteci gerektirir.

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

Paket moderasyon görünürlüğü için sahip/moderatör uç noktası.

Kimlik doğrulama:

- Paket sahibi, yayıncı üyesi, moderatör veya yönetici kullanıcı için bir API
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

Paket raporlarını çözmek veya yeniden açmak için moderatör/yönetici uç noktası.

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
moderasyonu uygulamak için onaylanmış bir raporla birlikte `finalAction: "quarantine"`
veya `finalAction: "revoke"` gönderin.

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

- `approved`: elle incelendi ve izin verildi.
- `quarantined`: takip işlemi beklenirken engellendi.
- `revoked`: bir sürüm daha önce güvenilir kabul edildikten sonra engellendi.

Karantinaya alınmış ve iptal edilmiş sürümler, artifact indirme rotalarından `403` döndürür.
Her değişiklik bir denetim günlüğü girdisi yazar.

### `GET /api/v1/packages/{name}/file`

Bir paket dosyası için ham metin içeriği döndürür.

Sorgu parametreleri:

- `path` (zorunlu)
- `version` (isteğe bağlı)
- `tag` (isteğe bağlı)

Notlar:

- Varsayılan olarak en son sürümü kullanır.
- İndirme kovasını değil, okuma hız kovasını kullanır.
- İkili dosyalar `415` döndürür.
- Dosya boyutu sınırı: 200KB.
- Bekleyen VirusTotal taramaları okumaları engellemez; kötü amaçlı sürümler başka yerlerde yine de alıkonabilir.
- Çağıran, sahip yayıncıyı okuyamıyorsa özel paketler `404` döndürür.

### `GET /api/v1/packages/{name}/download`

Bir paket sürümü için eski deterministik ZIP arşivini indirir.

Sorgu parametreleri:

- `version` (isteğe bağlı)
- `tag` (isteğe bağlı)

Notlar:

- Varsayılan olarak en son sürümü kullanır.
- Skills, `GET /api/v1/download` hedefine yönlendirir.
- Plugin/paket arşivleri, eski OpenClaw istemcilerinin çalışmaya devam etmesi
  için `package/` köküne sahip zip dosyalarıdır.
- Bu rota yalnızca ZIP olarak kalır. ClawPack `.tgz` dosyalarını akışla iletmez.
- Yanıtlar, çözümleyici bütünlük kontrolleri için `ETag`, `Digest`,
  `X-ClawHub-Artifact-Type` ve `X-ClawHub-Artifact-Sha256` başlıklarını içerir.
- Yalnızca kayıt defterine ait metadata, indirilen arşive enjekte edilmez.
- Bekleyen VirusTotal taramaları indirmeleri engellemez; kötü amaçlı sürümler `403` döndürür.
- Çağıran sahip değilse özel paketler `404` döndürür.

### `GET /api/npm/{package}`

ClawPack destekli paket sürümleri için npm uyumlu bir packument döndürür.

Notlar:

- Yalnızca yüklenmiş ClawPack npm-pack tarball'ları olan sürümler listelenir.
- Eski yalnızca ZIP sürümleri kasıtlı olarak atlanır.
- `dist.tarball`, `dist.integrity` ve `dist.shasum`, kullanıcılar isterse npm'i
  yansıyı gösterecek şekilde ayarlayabilsin diye npm uyumlu alanları kullanır.
- Kapsamlı paket packument'ları hem `/api/npm/@scope/name` hem de npm'in
  kodlanmış `/api/npm/@scope%2Fname` istek yolunu destekler.

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm yansı istemcileri için yüklenen ClawPack tarball baytlarını aynen akışla iletir.

Notlar:

- İndirme hız kovasını kullanır.
- İndirme başlıkları ClawHub SHA-256'nın yanı sıra npm integrity/shasum metadata'sını içerir.
- Moderasyon ve özel paket erişim kontrolleri uygulanmaya devam eder.

### `GET /api/v1/resolve`

CLI tarafından yerel bir parmak izini bilinen bir sürümle eşlemek için kullanılır.

Sorgu parametreleri:

- `slug` (zorunlu)
- `hash` (zorunlu): paket parmak izinin 64 karakterlik hex sha256 değeri

Yanıt:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Barındırılan bir beceri sürümü ZIP'ini indirir veya `clean` ya da `suspicious`
taraması olan ve barındırılan sürümü bulunmayan güncel GitHub destekli bir
beceri için GitHub kaynak devrini döndürür.

Sorgu parametreleri:

- `slug` (zorunlu)
- `version` (isteğe bağlı): semver dizesi
- `tag` (isteğe bağlı): etiket adı (örn. `latest`)

Notlar:

- Ne `version` ne de `tag` sağlanırsa en son sürüm kullanılır.
- Geçici olarak silinmiş sürümler `410` döndürür.
- GitHub destekli beceri devirleri baytları proxy'lemez veya yansıtmaz. JSON yanıtı
  `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash` ve
  `archiveUrl` içerir; tarama/güncel durum bir geçittir ve başarı yükü
  metadata'sı olarak dahil edilmez.
- İndirme istatistikleri UTC günü başına benzersiz kimlikler olarak sayılır (API belirteci geçerliyse `userId`, aksi halde IP).

## Kimlik doğrulama uç noktaları (Bearer belirteci)

Tüm uç noktalar şunu gerektirir:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Belirteci doğrular ve kullanıcı tanıtıcısını döndürür.

### `POST /api/v1/skills`

Yeni bir sürüm yayınlar.

- Tercih edilen: `payload` JSON + `files[]` blob'ları ile `multipart/form-data`.
- `files` içeren JSON gövdesi (storageId tabanlı) de kabul edilir.
- İsteğe bağlı payload alanı: `ownerHandle`. Mevcut olduğunda API, bu yayıncıyı
  sunucu tarafında çözümler ve aktörün yayıncı erişimine sahip olmasını gerektirir.
- İsteğe bağlı payload alanı: `migrateOwner`. `ownerHandle` ile `true` olduğunda,
  aktör hem mevcut hem de hedef yayıncılarda yönetici/sahip ise mevcut bir beceri
  bu sahibe taşınabilir. Bu açık onay olmadan sahip değişiklikleri reddedilir.

### `POST /api/v1/packages`

Bir code-plugin veya bundle-plugin sürümü yayınlar.

- Bearer belirteci kimlik doğrulaması gerektirir.
- `multipart/form-data` gerektirir.
- İzin verilen form alanları `payload`, tekrarlanan `files` blob'ları veya tek bir
  `clawpack` tarball referansıdır. `clawpack`, bir `.tgz` blob'u veya upload-url
  akışından döndürülen bir depolama kimliği olabilir. Aşamalandırılmış storage-id
  yayınları, bu yükleme URL'siyle döndürülen `clawpackUploadTicket` değerini de
  içermelidir.
- Aynı istekte asla ikisini birden değil, `files` veya `clawpack` kullanın.
- JSON gövdeleri ve çağıranın sağladığı `payload.files` / `payload.artifact`
  metadata'sı reddedilir.
- Doğrudan multipart yayın istekleri 18MB ile sınırlandırılır. ClawPack tarball'ları,
  120MB tarball sınırına kadar upload-url akışını kullanabilir.
- İsteğe bağlı payload alanı: `ownerHandle`. Mevcut olduğunda, yalnızca yöneticiler bu sahip adına yayın yapabilir.

Doğrulama öne çıkanları:

- `family`, `code-plugin` veya `bundle-plugin` olmalıdır.
- Plugin paketleri `openclaw.plugin.json` gerektirir. ClawPack `.tgz` yüklemeleri
  bunu `package/openclaw.plugin.json` konumunda içermelidir.
- Kod Plugin'leri `package.json`, kaynak depo metadata'sı, kaynak commit
  metadata'sı, config şema metadata'sı, `openclaw.compat.pluginApi` ve
  `openclaw.build.openclawVersion` gerektirir.
- `openclaw.hostTargets` ve `openclaw.environment` isteğe bağlı metadata'dır.
- Yalnızca `openclaw` org yayıncısı ve mevcut `openclaw` org üyelerinin kişisel
  yayıncıları `official` kanalına yayın yapabilir.
- Başkası adına yayınlar da official-channel uygunluğunu hedef sahip hesabına göre doğrular.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Bir beceriyi geçici olarak sil / geri yükle (sahip, moderatör veya yönetici).

İsteğe bağlı JSON gövdesi:

```json
{ "reason": "Held for moderation pending legal review." }
```

Mevcut olduğunda `reason`, beceri moderasyon notu olarak saklanır ve denetim günlüğüne kopyalanır.
Sahip tarafından başlatılan geçici silmeler slug'ı 30 gün boyunca rezerve eder, ardından slug
başka bir yayıncı tarafından alınabilir. Silme yanıtı, bu süre sonu geçerliyse `slugReservedUntil` içerir.
Moderatör/yönetici gizlemeleri ve güvenlik kaldırmaları bu şekilde sona ermez.

Silme yanıtı:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Durum kodları:

- `200`: tamam
- `401`: yetkisiz
- `403`: yasak
- `404`: beceri/kullanıcı bulunamadı
- `500`: dahili sunucu hatası

### `POST /api/v1/users/publisher`

Yalnızca yönetici. Bir tanıtıcı için org yayıncısının var olmasını sağlar. Tanıtıcı hâlâ
eski paylaşılan kullanıcı/kişisel yayıncıyı gösteriyorsa, uç nokta önce bunu bir org yayıncısına geçirir.
Yeni oluşturulan bir org için `memberHandle` sağlayın; işlem yapan yönetici üye olarak eklenmez.
`memberRole` varsayılan olarak `owner` değerindedir.

- Gövde: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Yanıt: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Kimliği doğrulanmış self servis org yayıncısı oluşturma. Yeni bir org yayıncısı oluşturur ve
çağıranı sahip olarak ekler. Bu uç nokta mevcut kullanıcı/kişisel tanıtıcıları geçirmez ve
yayıncıyı güvenilir/official olarak işaretlemez.

- Gövde: `{ "handle": "opik", "displayName": "Opik" }`
- Yanıt: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Tanıtıcı zaten bir yayıncı, kullanıcı veya kişisel yayıncı tarafından kullanılıyorsa `409` döndürür.

### `POST /api/v1/users/reserve`

Yalnızca yönetici. Bir sürüm yayınlamadan, hak sahibi için kök slug'ları ve paket adlarını rezerve eder.
Paket adları, sürüm satırları olmayan özel yer tutucu paketlere dönüşür; böylece aynı sahip daha sonra
gerçek code-plugin veya bundle-plugin sürümünü bu ada yayınlayabilir.

- Gövde: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Yanıt: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Yalnızca yönetici. Convex Auth hesap satırlarını düzenlemeden, doğrulanmış bir yedek GitHub OAuth kimliği
için kişisel yayıncıyı kurtarır. İstek, değişmez GitHub sağlayıcı hesap kimliklerinin ikisini de adlandırmalıdır;
değişebilir tanıtıcılar yalnızca operatöre dönük bir koruma olarak kullanılır.

Uç nokta varsayılan olarak kuru çalıştırma modundadır. Kurtarmayı uygulamak için personelin her iki
GitHub ana kimliği arasındaki sürekliliği bağımsız olarak doğrulamasından sonra `dryRun: false` ve
`confirmIdentityVerified: true` gerekir. Hedef kullanıcının mevcut kişisel
yayıncısında Skills, paketler veya GitHub Skills kaynakları varsa kurtarma güvenli biçimde başarısız olur.
Kurtarma ayrıca kurtarılan yayıncının Skills, Skills slug takma adları, paketleri,
paket denetleyicisi uyarıları ve türetilmiş arama özeti satırları için eski `ownerUserId` alanlarını da taşır; böylece
doğrudan sahip yolları yeni yayıncı yetkisiyle uyumlu olur. Kurtarılan kullanıcı adı için etkin bir korumalı kullanıcı adı
rezervasyonu da yedek kullanıcıya yeniden atanır; böylece sonraki
profil senkronizasyonu eski kullanıcının rakip yetkisini geri yükleyemez. Her birincil tablo,
uygulama işlemi başına 100 satırla sınırlıdır; daha büyük kurtarmalar önce sürdürülebilir bir sahip taşıması kullanmalıdır.
GitHub Skills kaynakları yayıncı kapsamındadır ve yeniden yazılmak yerine denetlendi olarak raporlanır.

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

- Her iki uç nokta da API token kimlik doğrulaması gerektirir ve yalnızca Skills sahibi için çalışır.
- `rename`, önceki slug'ı yönlendirme takma adı olarak korur.
- `merge`, kaynak liste kaydını gizler ve kaynak slug'ı hedef liste kaydına yönlendirir.

### Sahiplik aktarma uç noktaları

- `POST /api/v1/skills/{slug}/transfer`
  - Gövde: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Yanıt: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Yanıt (kabul/reddet/iptal): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Yanıt biçimi: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Bir kullanıcıyı yasakla ve sahip olunan Skills öğelerini kalıcı olarak sil (yalnızca moderatör/yönetici).

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

Bir kullanıcının yasağını kaldır ve uygun Skills öğelerini geri yükle (yalnızca yönetici).

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

Mevcut bir yasağın saklanan nedenini, yasağı kaldırmadan veya
içeriği geri yüklemeden değiştir (yalnızca yönetici). `dryRun`, `false` olmadığı sürece varsayılan olarak kuru çalıştırma modundadır.

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

Bir kullanıcı rolünü değiştir (yalnızca yönetici).

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

Kullanıcıları listele veya ara (yalnızca yönetici).

Sorgu parametreleri:

- `q` (isteğe bağlı): arama sorgusu
- `query` (isteğe bağlı): `q` için takma ad
- `limit` (isteğe bağlı): en fazla sonuç sayısı (varsayılan 20, en fazla 200)

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

Yıldız ekle/kaldır (öne çıkarmalar). Her iki uç nokta da idempotenttir.

Yanıtlar:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Eski CLI uç noktaları (kullanımdan kaldırıldı)

Eski CLI sürümleri için hâlâ desteklenir:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Kaldırma planı için `DEPRECATIONS.md` dosyasına bakın.

`POST /api/cli/upload-url`, `uploadUrl` ve `uploadTicket` döndürür. Bir ClawPack tarball'ını
aşamalandıran paket yayınları, ortaya çıkan depolama kimliğini `clawpack` olarak
ve döndürülen bileti `clawpackUploadTicket` olarak göndermelidir.

## Registry keşfi (`/.well-known/clawhub.json`)

CLI, registry/kimlik doğrulama ayarlarını siteden keşfedebilir:

- `/.well-known/clawhub.json` (JSON, tercih edilen)
- `/.well-known/clawdhub.json` (eski)

Şema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Kendiniz barındırıyorsanız bu dosyayı sunun (veya `CLAWHUB_REGISTRY` değerini açıkça ayarlayın; eski `CLAWDHUB_REGISTRY`).

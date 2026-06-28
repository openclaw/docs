---
read_when:
    - Uç noktalar ekleme/değiştirme
    - CLI ↔ registry isteklerinde hata ayıklama
summary: HTTP API referansı (genel + CLI uç noktaları + kimlik doğrulama).
x-i18n:
    generated_at: "2026-06-28T08:15:51Z"
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
Eski `/api/...` ve `/api/cli/...` uyumluluk için korunur (bkz. `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Genel katalog yeniden kullanımı

Üçüncü taraf dizinler, ClawHub becerilerini listelemek veya aramak için genel okuma uç noktalarını kullanabilir. Lütfen sonuçları önbelleğe alın, `429`/`Retry-After` değerlerine uyun, kullanıcıları standart ClawHub listelemesine (`https://clawhub.ai/<owner>/skills/<slug>`) geri bağlayın ve üçüncü taraf sitenin ClawHub tarafından onaylandığı izlenimini vermekten kaçının. Gizli, özel veya moderasyon tarafından engellenmiş içeriği genel API yüzeyi dışında yansıtmaya çalışmayın.

Web `slug` kısayolları kayıt defteri aileleri arasında çözümlenir, ancak API istemcileri rota
önceliğini yeniden oluşturmaya çalışmak yerine okuma uç noktalarının döndürdüğü standart
URL'leri kullanmalıdır.

## Hız sınırları

Uygulama modeli:

- Anonim istekler: IP başına uygulanır.
- Kimliği doğrulanmış istekler (geçerli Bearer belirteci): kullanıcı kovası başına uygulanır.
- Belirteç eksik/geçersizse davranış IP uygulamasına geri döner.
- Kimliği doğrulanmış yazma uç noktaları, sunucu nedeni bildiğinde yalın bir `Unauthorized`
  döndürmemelidir. Eksik belirteçler, geçersiz/iptal edilmiş belirteçler ve
  silinmiş/yasaklanmış/devre dışı bırakılmış hesaplar, CLI istemcilerinin kullanıcılara
  kendilerini neyin engellediğini söyleyebilmesi için eyleme geçirilebilir metin almalıdır.

- Okuma: IP başına 3000/dk, anahtar başına 12000/dk
- Yazma: IP başına 300/dk, anahtar başına 3000/dk
- İndirme: IP başına 1200/dk, anahtar başına 6000/dk (indirme uç noktaları)

Başlıklar:

- Eski uyumluluk: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Standartlaştırılmış: `RateLimit-Limit`, `RateLimit-Reset`
- `429` durumunda: `X-RateLimit-Remaining: 0` ve `RateLimit-Remaining: 0`
- `429` durumunda: `Retry-After`

Başlık anlamları:

- `X-RateLimit-Reset`: mutlak Unix epoch saniyeleri
- `RateLimit-Reset`: sıfırlamaya kadar saniye (gecikme)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: mevcutsa tam kalan bütçe.
  Parçalanmış başarılı istekler, yaklaşık bir genel değer döndürmek yerine bu başlığı atlar.
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

İstemci rehberi:

- `Retry-After` varsa, yeniden denemeden önce belirtilen saniye kadar bekleyin.
- Eşzamanlı yeniden denemeleri önlemek için jitter eklenmiş backoff kullanın.
- `Retry-After` eksikse, `RateLimit-Reset` değerine geri dönün (veya `X-RateLimit-Reset` üzerinden hesaplayın).

IP kaynağı:

- Yalnızca dağıtım güvenilir iletilmiş başlıkları açıkça etkinleştirdiğinde
  `cf-connecting-ip` dahil güvenilir istemci IP başlıklarını kullanır.
- ClawHub, kenarda istemci IP'lerini tanımlamak için güvenilir iletme başlıklarını kullanır.
- Güvenilir istemci IP'si yoksa, anonim istekler yalnızca hız sınırı türüne göre
  kapsamlandırılmış geri dönüş kovalarını kullanır. Bu geri dönüş kovaları
  çağıranın sağladığı yolları, slug'ları, paket adlarını, sürümleri, sorgu dizelerini
  veya diğer yapıt parametrelerini içermez.

## Hata yanıtları

Genel v1 hata yanıtları `content-type: text/plain; charset=utf-8` ile düz metindir.
Buna doğrulama hataları (`400`), eksik genel kaynaklar (`404`), kimlik doğrulama ve
izin hataları (`401`/`403`), hız sınırları (`429`) ve engellenmiş indirmeler dahildir. İstemciler
yanıt gövdesini insan tarafından okunabilir bir dize olarak okumalıdır. Bilinmeyen sorgu
parametreleri uyumluluk için yok sayılır, ancak geçersiz değerlere sahip tanınan sorgu
parametreleri `400` döndürür.

## Genel uç noktalar (kimlik doğrulama yok)

### `GET /api/v1/search`

Sorgu parametreleri:

- `q` (zorunlu): sorgu dizesi
- `limit` (isteğe bağlı): tamsayı
- `highlightedOnly` (isteğe bağlı): öne çıkarılmış becerilere filtrelemek için `true`
- `nonSuspiciousOnly` (isteğe bağlı): şüpheli (`flagged.suspicious`) becerileri gizlemek için `true`
- `nonSuspicious` (isteğe bağlı): `nonSuspiciousOnly` için eski ad

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

- Sonuçlar alaka sırasına göre döndürülür (embedding benzerliği + tam slug/ad token güçlendirmeleri + küçük bir popülerlik önceliği).
- Alaka, popülerlikten daha güçlüdür. Kesin bir slug veya görünen ad token eşleşmesi, çok daha güçlü etkileşime sahip daha gevşek bir eşleşmenin önüne geçebilir.
- ASCII metin, sözcük ve noktalama sınırlarında token'lara ayrılır. Örneğin `personal-map` bağımsız bir `map` token'ı içerirken `amap-jsapi-skill` `amap`, `jsapi` ve `skill` içerir; bu nedenle `map` araması `personal-map` için `amap-jsapi-skill` değerine göre daha güçlü bir sözcüksel eşleşme verir.
- Popülerlik logaritmik ölçeklenir ve üst sınır uygulanır. Yüksek etkileşimli beceriler, sorgu metni daha zayıf bir eşleşmeyse daha aşağıda sıralanabilir.
- Şüpheli veya gizli moderasyon durumu, çağıran filtrelerine ve mevcut moderasyon durumuna bağlı olarak bir beceriyi genel aramadan kaldırabilir.

Yayıncı keşfedilebilirlik rehberi:

- Kullanıcıların kelimenin tam anlamıyla arayacağı terimleri görünen ada, özete ve etiketlere koyun. Bağımsız bir slug token'ını yalnızca korumak istediğiniz kararlı bir kimlik olduğunda kullanın.
- Yeni slug daha iyi uzun vadeli standart ad değilse, yalnızca tek bir sorguyu yakalamak için bir slug'ı yeniden adlandırmayın. Eski slug'lar yönlendirme adlarına dönüşür, ancak standart URL, görüntülenen slug ve gelecekteki arama özetleri yeni slug'ı kullanır.
- Yeniden adlandırma adları, eski URL'ler ve kayıt defteri üzerinden çözümlenen kurulumlar için çözümlemeyi korur, ancak arama sıralaması, yeniden adlandırma indekslendikten sonra standart beceri meta verilerine dayanır. Mevcut istatistikler beceriyle kalır.
- Bir beceri beklenmedik şekilde görünmezse, sıralamayla ilgili meta verileri değiştirmeden önce oturum açmışken önce `clawhub inspect @owner/slug` ile moderasyon durumunu kontrol edin.

### `GET /api/v1/skills`

Sorgu parametreleri:

- `limit` (isteğe bağlı): tamsayı (1-200)
- `cursor` (isteğe bağlı): `trending` olmayan herhangi bir sıralama için sayfalama imleci
- `sort` (isteğe bağlı): `updated` (varsayılan), `recommended` (ad: `default`), `createdAt` (ad: `newest`), `downloads`, `stars` (ad: `rating`), eski kurulum adları `installsCurrent`/`installs`/`installsAllTime` `downloads` değerine eşlenir, `trending`
- `nonSuspiciousOnly` (isteğe bağlı): şüpheli (`flagged.suspicious`) becerileri gizlemek için `true`
- `nonSuspicious` (isteğe bağlı): `nonSuspiciousOnly` için eski ad

Geçersiz `sort` değerleri `400` döndürür.

Notlar:

- `recommended`, etkileşim ve güncellik sinyallerini kullanır.
- `trending`, son 7 gündeki kurulumlara göre sıralar (telemetri tabanlı).
- `createdAt`, yeni beceri taramaları için kararlıdır; `updated`, mevcut beceriler yeniden yayınlandığında değişir.
- `nonSuspiciousOnly=true` olduğunda, imleç tabanlı sıralamalar bir sayfada `limit` değerinden daha az öğe döndürebilir, çünkü şüpheli beceriler sayfa alındıktan sonra filtrelenir.
- Mevcut olduğunda sayfalamaya devam etmek için `nextCursor` kullanın. Kısa bir sayfa tek başına sonuçların sonu anlamına gelmez.

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

- Sahip yeniden adlandırma/birleştirme akışları tarafından oluşturulan eski slug'lar standart beceriye çözümlenir.
- `metadata.os`: Beceri frontmatter'ında bildirilen OS kısıtlamaları (örn. `["macos"]`, `["linux"]`). Bildirilmemişse `null`.
- `metadata.systems`: Nix sistem hedefleri (örn. `["aarch64-darwin", "x86_64-linux"]`). Bildirilmemişse `null`.
- Beceri platform meta verisine sahip değilse `metadata` `null` olur.
- `moderation` yalnızca beceri işaretlenmişse veya sahibi görüntülüyorsa dahil edilir.

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

- Sahipler ve moderatörler gizli beceriler için moderasyon ayrıntılarına erişebilir.
- Genel çağıranlar yalnızca zaten işaretlenmiş görünür beceriler için `200` alır.
- Kanıt genel çağıranlar için redakte edilir ve ham parçaları yalnızca sahipler/moderatörler için içerir.

### `POST /api/v1/skills/{slug}/report`

Bir beceriyi moderatör incelemesi için bildirin. Bildirimler beceri düzeyindedir, isteğe bağlı olarak
bir sürüme bağlanır ve beceri bildirim kuyruğunu besler.

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

Beceri bildirim alımı için moderatör/yönetici uç noktası.

Sorgu parametreleri:

- `status` (isteğe bağlı): `open` (varsayılan), `confirmed`, `dismissed` veya `all`
- `limit` (isteğe bağlı): tamsayı (1-200)
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

Beceri bildirimlerini çözmek veya yeniden açmak için moderatör/yönetici uç noktası.

İstek:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note`, `confirmed` ve `dismissed` için zorunludur; `status` tekrar `open` olarak
ayarlanırken atlanabilir. Aynı denetlenebilir iş akışında beceriyi gizlemek için triyajlanmış
bir bildirimle `finalAction: "hide"` gönderin.

### `GET /api/v1/skills/{slug}/versions`

Sorgu parametreleri:

- `limit` (isteğe bağlı): tamsayı
- `cursor` (isteğe bağlı): sayfalama imleci

### `GET /api/v1/skills/{slug}/versions/{version}`

Sürüm meta verilerini + dosya listesini döndürür.

- `version.security`, mevcut olduğunda normalleştirilmiş tarama doğrulama durumunu ve tarayıcı ayrıntılarını
  (VirusTotal + LLM) içerir.

### `GET /api/v1/skills/{slug}/scan`

Bir beceri sürümü için güvenlik taraması doğrulama ayrıntılarını döndürür.

Sorgu parametreleri:

- `version` (isteğe bağlı): belirli sürüm dizesi.
- `tag` (isteğe bağlı): etiketlenmiş bir sürümü çözümler (örneğin `latest`).

Notlar:

- Ne `version` ne de `tag` sağlanırsa en son sürümü kullanır.
- Normalleştirilmiş doğrulama durumunu ve tarama aracına özgü ayrıntıları içerir.
- `security.hasScanResult`, yalnızca bir tarama aracı kesin bir karar (`clean`, `suspicious` veya `malicious`) ürettiğinde `true` olur.
- `moderation`, en son sürümden türetilmiş geçerli beceri düzeyinde moderasyon anlık görüntüsüdür.
- Geçmiş bir sürümü sorgularken, `moderation` ve `security` değerlerini aynı sürüm bağlamı olarak değerlendirmeden önce `moderation.matchesRequestedVersion` ve `moderation.sourceVersion` değerlerini kontrol edin.

### `POST /api/v1/skills/-/scan`

Yeni ClawScan işleri için kimliği doğrulanmış gönderim uç noktası.

Yerel yükleme taramaları artık desteklenmez. `multipart/form-data` veya `{ "source": { "kind": "upload" } }` kullanan istekler `410` döndürür.

Yayınlanmış taramalar JSON kullanır:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Notlar:

- Tarama isteği yükleri ve indirilebilir raporlar, saklama penceresinden sonra tarama isteği deposundan sona erer.
- Yayınlanmış taramalar sahip/yayıncı yönetim erişimi veya platform moderatörü/yöneticisi yetkisi gerektirir.
- Yayınlanmış taramalar yalnızca `update: true` olduğunda ve tarama başarıyla tamamlandığında geri yazar.
- Yanıt, `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` ile `202` olur.
- Tarama işleri eşzamansızdır. Manuel tarama istekleri normal yayınlama/geri doldurma işlerinden önce önceliklendirilir, ancak tamamlanma yine de çalışan kullanılabilirliğine bağlıdır.

### `GET /api/v1/skills/-/scan/{scanId}`

Gönderilmiş bir tarama için kimliği doğrulanmış yoklama uç noktası.

- Kuyrukta/çalışıyor/başarılı/başarısız durumunu döndürür.
- Kuyruktayken `queue.queuedAhead` ve `queue.position` değerlerini döndürür; böylece istemciler isteğin önünde kaç öncelikli manuel tarama olduğunu gösterebilir. Çok büyük kuyruklar sınırlandırılır ve `queuedAheadIsEstimate: true` ile raporlanır.
- Kullanılabilir olduğunda, `report` içinde `clawscan`, `skillspector`, `staticAnalysis` ve `virustotal` bölümleri bulunur.
- Başarısız tarama işleri `lastError` ile `status: "failed"` döndürür.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Kimliği doğrulanmış rapor arşivi uç noktası.

- Başarılı olmuş bir tarama gerektirir; sonlanmamış taramalar `409` döndürür.
- `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` ve `README.md` içeren bir ZIP döndürür.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Gönderilmiş sürümler için kimliği doğrulanmış saklanan rapor arşivi uç noktası.

- Beceriye veya Plugin'e sahip/yayıncı yönetim erişimi ya da platform moderatörü/yöneticisi yetkisi gerektirir.
- Engellenmiş veya gizlenmiş sürümler dahil olmak üzere, tam olarak gönderilen sürüm için saklanan tarama sonuçlarını döndürür.
- `kind` varsayılan olarak `skill` olur; Plugin/paket taramaları için `kind=plugin` kullanın.
- Tarama isteği indirmeleriyle aynı ZIP şeklini döndürür.

### `POST /api/v1/skills/-/scan/batch`

Yalnızca yöneticilere açık kanonik toplu yeniden tarama rotası. Eski `POST /api/v1/skills/-/rescan-batch` ile aynı yük şeklini kabul eder.

### `POST /api/v1/skills/-/scan/batch/status`

Yalnızca yöneticilere açık kanonik toplu durum rotası. `{ "jobIds": ["..."] }` değerini kabul eder ve eski `POST /api/v1/skills/-/rescan-batch/status` ile aynı toplu sayaçları döndürür.

### `GET /api/v1/skills/{slug}/verify`

`clawhub skill verify` tarafından kullanılan Beceri Kartı doğrulama zarfını döndürür.

Sorgu parametreleri:

- `version` (isteğe bağlı): belirli sürüm dizesi.
- `tag` (isteğe bağlı): etiketlenmiş bir sürümü çözer (örneğin `latest`).

Notlar:

- `ok`, yalnızca seçilen sürümde oluşturulmuş bir Beceri Kartı olduğunda, moderasyon tarafından kötü amaçlı yazılım nedeniyle engellenmemiş olduğunda ve ClawScan doğrulaması temiz olduğunda `true` olur.
- Beceri kimliği, yayıncı kimliği ve seçilen sürüm meta verileri üst düzey zarf alanlarıdır (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`); böylece kabuk otomasyonu bunları iç içe sarmalayıcıları açmadan okuyabilir.
- `security`, üst düzey ClawScan/güvenlik kararıdır. Otomasyon `ok`, `decision`, `reasons` ve `security.status` değerlerini temel almalıdır.
- `security.signals`, `staticScan`, `virusTotal` ve `skillSpector` gibi destekleyici tarama aracı kanıtlarını içerir.
- `security.signals.dependencyRegistry`, v1 yanıt uyumluluğu için korunur, ancak bağımlılık kayıt defteri varlık tarayıcısı kullanımdan kaldırılmıştır ve bu anahtar her zaman `null` olur.
- `provenance`, yalnızca ClawHub yayınlama veya içe aktarma sırasında bir GitHub repo/ref/commit/path çözüp sakladığında `server-resolved-github-import` olur; aksi halde `unavailable` olur.

### `POST /api/v1/skills/-/security-verdicts`

Tam beceri sürümleri için geçerli kompakt güvenlik kararlarını döndürür. Bu koleksiyon uç noktası, OpenClaw Control UI gibi, hangi yüklü ClawHub beceri sürümlerini göstermesi gerektiğini zaten bilen istemciler için tasarlanmıştır.

İstek:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Notlar:

- `items`, 1-100 benzersiz `{ slug, version }` çifti içermelidir.
- Sonuçlar öğe başınadır; eksik bir beceri veya sürüm tüm yanıtı başarısız yapmaz.
- Yanıt yalnızca güvenlikle ilgilidir. Beceri Kartı verilerini, oluşturulan kart durumunu, yapıt dosya listelerini veya ayrıntılı tarama aracı yüklerini içermez.
- `security.signals` yalnızca durum düzeyinde destekleyici kanıt içerir; tam tarama aracı ayrıntıları için `/scan` veya ClawHub güvenlik denetimi sayfasını kullanın.
- `security.signals.dependencyRegistry`, v1 yanıt uyumluluğu için korunur, ancak bağımlılık kayıt defteri varlık tarayıcısı kullanımdan kaldırılmıştır ve bu anahtar her zaman `null` olur.
- Beceri Kartı yokluğu, bu uç noktanın `ok`, `decision` veya `reasons` değerlerini etkilemez; istemciler kart içeriğine ihtiyaç duyduğunda yüklü `skill-card.md` dosyasını yerel olarak okumalıdır.
- Tek beceri Beceri Kartı doğrulama zarfına ihtiyaç duyduğunuzda `/verify`, oluşturulan kart Markdown'ına ihtiyaç duyduğunuzda `/card` ve ayrıntılı tarama aracı verilerine ihtiyaç duyduğunuzda `/scan` kullanın.

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
- Dosya boyutu sınırı: 200KB.

### `GET /api/v1/packages`

Şunlar için birleşik katalog uç noktası:

- skills
- kod Plugin'leri
- paket Plugin'leri

Sorgu parametreleri:

- `limit` (isteğe bağlı): tamsayı (1–100)
- `cursor` (isteğe bağlı): sayfalama imleci
- `family` (isteğe bağlı): `skill`, `code-plugin` veya `bundle-plugin`
- `channel` (isteğe bağlı): `official`, `community` veya `private`
- `isOfficial` (isteğe bağlı): `true` veya `false`
- `sort` (isteğe bağlı): `updated` (varsayılan), `recommended`, `trending`, `downloads`, eski takma ad `installs`
- `category` (isteğe bağlı): Plugin kategori filtresi. Yalnızca istek
  Plugin paketleriyle (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` veya
  `family=code-plugin`/`family=bundle-plugin` içeren paket uç noktaları) sınırlandırıldığında desteklenir. Denetimli kategoriler ve
  eski v1 filtre takma adları `GET /api/v1/plugins` altında belgelenmiştir.

Notlar:

- `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` veya `sort` için geçersiz değerler `400` döndürür. Bilinmeyen sorgu parametreleri yok sayılır.
- `GET /api/v1/code-plugins` ve `GET /api/v1/bundle-plugins` sabit aile takma adları olarak kalır.
- Skill girdileri Skills kayıt defteri tarafından desteklenmeye devam eder ve hâlâ yalnızca `POST /api/v1/skills` üzerinden yayımlanabilir.
- `POST /api/v1/packages` hâlâ yalnızca code-plugin ve bundle-plugin yayınları içindir.
- Anonim çağıranlar yalnızca herkese açık paket kanallarını görür.
- Kimliği doğrulanmış çağıranlar, ait oldukları yayımcılar için özel paketleri listeleme/arama sonuçlarında görebilir.
- `channel=private` yalnızca kimliği doğrulanmış çağıranın okuyabildiği paketleri döndürür.

### `GET /api/v1/packages/search`

Skills + Plugin paketleri genelinde birleşik katalog araması.

Sorgu parametreleri:

- `q` (gerekli): sorgu dizesi
- `limit` (isteğe bağlı): tamsayı (1–100)
- `family` (isteğe bağlı): `skill`, `code-plugin` veya `bundle-plugin`
- `channel` (isteğe bağlı): `official`, `community` veya `private`
- `isOfficial` (isteğe bağlı): `true` veya `false`
- `category` (isteğe bağlı): Plugin kategori filtresi. Yalnızca istek
  Plugin paketleriyle sınırlandırıldığında desteklenir. Denetimli kategoriler ve eski v1
  filtre takma adları `GET /api/v1/plugins` altında belgelenmiştir.

Notlar:

- `family`, `channel`, `isOfficial`, `featured` veya
  `highlightedOnly` için geçersiz değerler `400` döndürür. Bilinmeyen sorgu parametreleri yok sayılır.
- Anonim çağıranlar yalnızca herkese açık paket kanallarını görür.
- Kimliği doğrulanmış çağıranlar, ait oldukları yayımcılar için özel paketlerde arama yapabilir.
- `channel=private` yalnızca kimliği doğrulanmış çağıranın okuyabildiği paketleri döndürür.

### `GET /api/v1/plugins`

Code-plugin ve bundle-plugin paketleri genelinde yalnızca Plugin katalog göz atması.

Sorgu parametreleri:

- `limit` (isteğe bağlı): tamsayı (1-100)
- `cursor` (isteğe bağlı): sayfalama imleci
- `isOfficial` (isteğe bağlı): `true` veya `false`
- `sort` (isteğe bağlı): `recommended` (varsayılan), `trending`, `downloads`, `updated`, eski takma ad `installs`
- `category` (isteğe bağlı): Plugin kategori filtresi. Geçerli değerler:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Eski v1 filtre takma adları okuma uç noktalarında kabul edilmeye devam eder:

- `mcp-tooling`, `data` ve `automation`, `tools` olarak çözümlenir.
- `observability` ve `deployment`, `gateway` olarak çözümlenir.
- `dev-tools`, `runtime` olarak çözümlenir.

`trending`, yedi günlük kurulum/indirme liderlik tablosudur ve tüm zamanların toplamlarını kullanmaz.
Birleşik `/api/v1/packages` uç noktasında yalnızca Plugin içindir; Skill kataloğu için
`/api/v1/skills?sort=trending` kullanın.

Eski takma adlar, depolanan veya yazar tarafından bildirilen kategori değerleri olarak kabul edilmez.

### `GET /api/v1/skills/export`

Çevrimdışı analiz için en son herkese açık Skills'in toplu dışa aktarımı.

Kimlik doğrulama:

- API belirteci gereklidir.

Sorgu parametreleri:

- `startDate` (gerekli): Skill `updatedAt` için Unix milisaniye alt sınırı.
- `endDate` (gerekli): Skill `updatedAt` için Unix milisaniye üst sınırı.
- `limit` (isteğe bağlı): tamsayı (1-250), varsayılan `250`.
- `cursor` (isteğe bağlı): önceki yanıttan sayfalama imleci.

Yanıt:

- Gövde: ZIP arşivi.
- Dışa aktarılan her Skill `{publisher}/{slug}/` konumunda köklenir.
- Barındırılan Skills, en son depolanmış sürüm dosyalarını içerir ve
  `_manifest.json` içinde `sourceRef: "public-clawhub"` ile listelenir.
- `clean` veya `suspicious` taramasına sahip güncel GitHub destekli Skills,
  `_source_handoff.json` içinde `sourceRef: "public-github"`, depo, commit, yol,
  içerik karması ve arşiv URL'si içerir. ClawHub tarafından barındırılan kaynak dosyalarını içermezler.
- Her Skill `_export_skill_meta.json` içerir.
- `_manifest.json` her zaman ZIP kökünde yer alır.
- Tek tek Skills veya dosyalar dışa aktarılamadığında `_errors.json` eklenir.

Başlıklar:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Çevrim dışı analiz için en son herkese açık Plugin sürümlerinin toplu dışa aktarımı.

Kimlik doğrulama:

- API belirteci gereklidir.

Sorgu parametreleri:

- `startDate` (zorunlu): Plugin `updatedAt` için Unix milisaniye alt sınırı.
- `endDate` (zorunlu): Plugin `updatedAt` için Unix milisaniye üst sınırı.
- `limit` (isteğe bağlı): tam sayı (1-250), varsayılan `250`.
- `cursor` (isteğe bağlı): önceki yanıttan sayfalama imleci.
- `family` (isteğe bağlı): `code-plugin` veya `bundle-plugin`. Atlanırsa her iki
  Plugin ailesi anlamına gelir.

Yanıt:

- Gövde: ZIP arşivi.
- Dışa aktarılan her Plugin `{family}/{packageName}/` kökünde bulunur.
- Dışa aktarılan her Plugin, en son sürümün saklanan dosyalarını içerir.
- Plugin başına dışa aktarma meta verileri
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` konumunda saklanır.
- `_manifest.json` her zaman ZIP kökünde yer alır.
- Tek tek Plugin'ler veya dosyalar dışa aktarılamadığında `_errors.json`
  dahil edilir.

Başlıklar:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

code-plugin ve bundle-plugin paketleri genelinde yalnızca Plugin araması.

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
- Kategori filtreleme, arama sorgusu yeniden yazımı değil, Plugin kategori özet
  satırlarıyla desteklenen gerçek bir API filtresidir.
- Sonuçlar alaka sırasıyla döndürülür ve şu anda sayfalanmaz.
- Plugin araması için tarayıcı kullanıcı arayüzü sıralama denetimleri, yüklenen
  alaka sonuçlarını yeniden sıralar ve mevcut `/skills` göz atma davranışıyla eşleşir.

### `GET /api/v1/packages/{name}`

Paket ayrıntı meta verilerini döndürür.

Notlar:

- Skills, birleşik katalogda bu rota üzerinden de çözümlenebilir.
- Özel paketler, çağıran sahip yayıncıyı okuyamadığı sürece `404` döndürür.

### `DELETE /api/v1/packages/{name}`

Bir paketi ve tüm sürümlerini geçici olarak siler.

Notlar:

- Paket sahibi, kuruluş yayıncı sahibi/yöneticisi, platform moderatörü veya
  platform yöneticisi için API belirteci gerektirir.

### `GET /api/v1/packages/{name}/versions`

Sürüm geçmişini döndürür.

Sorgu parametreleri:

- `limit` (isteğe bağlı): tam sayı (1–100)
- `cursor` (isteğe bağlı): sayfalama imleci

Notlar:

- Özel paketler, çağıran sahip yayıncıyı okuyamadığı sürece `404` döndürür.

### `GET /api/v1/packages/{name}/versions/{version}`

Dosya meta verileri, uyumluluk, doğrulama, yapı meta verileri ve tarama verileri
dahil olmak üzere bir paket sürümünü döndürür.

Notlar:

- `version.artifact.kind`, eski dünya paket arşivleri için `legacy-zip` veya
  ClawPack destekli sürümler için `npm-pack` değeridir.
- ClawPack sürümleri npm uyumlu `npmIntegrity`, `npmShasum` ve
  `npmTarballName` alanlarını içerir.
- `version.sha256hash`, eski istemciler için kullanımdan kaldırılmış uyumluluk
  meta verisidir. `/api/v1/packages/{name}/download` tarafından döndürülen tam
  ZIP baytlarını hash'ler. Modern istemciler, kanonik sürüm yapısını tanımlayan
  `version.artifact.sha256` alanını kullanmalıdır.
- `version.vtAnalysis`, `version.llmAnalysis` ve `version.staticScan`, tarama
  verileri varsa dahil edilir.
- Özel paketler, çağıran sahip yayıncıyı okuyamadığı sürece `404` döndürür.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Kurulum istemcileri için tam paket sürümü güvenlik ve güven özetini döndürür.
Bu, çözümlenen bir sürümün kurulup kurulamayacağına karar vermek için herkese
açık OpenClaw tüketim yüzeyidir.

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
  `release.npmShasum` ve `release.npmTarballName`, sürüm yapısı için
  bilindiğinde mevcuttur.
- `trust.scanStatus`, tarayıcı girdilerinden ve manuel sürüm moderasyonundan
  türetilen etkili güven durumudur.
- `trust.moderationState` boş değer alabilir. Manuel sürüm moderasyonu yoksa
  `null` olur.
- `trust.blockedFromDownload`, kurulum engelleme sinyalidir. OpenClaw ve diğer
  kurulum istemcileri, tarayıcı veya moderasyon alanlarından engelleme kurallarını
  yeniden türetmek yerine bu değer `true` olduğunda kurulumu engellemelidir.
- `trust.reasons`, kullanıcıya yönelik ve denetim açıklaması listesidir. Neden
  kodları `manual:quarantined`, `scan:malicious` ve `package:malicious` gibi
  kararlı, kompakt dizelerdir.
- `trust.pending`, bir veya daha fazla güven girdisinin hâlâ tamamlanmayı
  beklediği anlamına gelir.
- `trust.stale`, güven özetinin güncel olmayan girdilerden hesaplandığı ve yüksek
  güvenli izin kararından önce yenileme gerektiriyor olarak ele alınması
  gerektiği anlamına gelir.

Notlar:

- Bu uç nokta sürüm açısından kesindir. İstemciler bunu yalnızca en son paket
  meta verilerini okuduktan sonra değil, kurmayı amaçladıkları paket sürümünü
  çözdükten sonra çağırmalıdır.
- Özel paketler, çağıran sahip yayıncıyı okuyamadığı sürece `404` döndürür.
- Bu uç nokta, sahip/moderatör moderasyon uç noktalarından bilerek daha dardır.
  Kurulum kararını ve herkese açık açıklamayı sunar; bildiren kimliklerini,
  rapor gövdelerini, özel kanıtları veya dahili inceleme zaman çizelgelerini
  sunmaz.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Bir paket sürümü için açık yapı çözümleyici meta verilerini döndürür.

Notlar:

- Eski paket sürümleri bir `legacy-zip` yapısı ve eski ZIP `downloadUrl`
  döndürür.
- ClawPack sürümleri bir `npm-pack` yapısı, npm bütünlük alanları, bir
  `tarballUrl` ve eski ZIP uyumluluk URL'si döndürür.
- Bu, OpenClaw çözümleyici yüzeyidir; paylaşılan bir URL'den arşiv biçimini
  tahmin etmekten kaçınır.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Sürüm yapısını açık çözümleyici yolu üzerinden indirir.

Notlar:

- ClawPack sürümleri, tam olarak yüklenen npm-pack `.tgz` baytlarını akış olarak
  gönderir.
- Eski ZIP sürümleri `/api/v1/packages/{name}/download?version=` adresine
  yönlendirir.
- İndirme hız kovasını kullanır.

### `GET /api/v1/packages/{name}/readiness`

Gelecekteki OpenClaw tüketimi için hesaplanan hazır olma durumunu döndürür.

Hazır olma kontrolleri şunları kapsar:

- resmi kanal durumu
- en son sürüm kullanılabilirliği
- ClawPack npm-pack yapısı kullanılabilirliği
- yapı özeti
- kaynak depo ve commit kökeni
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

Resmi OpenClaw Plugin geçiş satırlarını listelemek için moderatör uç noktası.

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

Resmi Plugin geçiş satırı oluşturmak veya güncellemek için yönetici uç noktası.

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

- `bundledPluginId` küçük harfe normalize edilir ve kararlı upsert anahtarıdır.
- `packageName` npm adına normalize edilir; planlanan geçişler için paket eksik
  olabilir.
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

- `open`: şüpheli, kötü amaçlı, bekleyen, karantinaya alınmış, geri çekilmiş veya raporlanmış sürümler.
- `blocked`: karantinaya alınmış, geri çekilmiş veya kötü amaçlı sürümler.
- `manual`: manuel moderasyon geçersiz kılması olan herhangi bir sürüm.
- `all`: manuel geçersiz kılma, temiz olmayan tarama durumu veya paket raporu olan herhangi bir sürüm.

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

Moderasyon incelemesi için bir paketi raporlar. Raporlar paket düzeyindedir ve
isteğe bağlı olarak bir sürüme bağlanır. Moderasyon kuyruğunu beslerler, ancak
kendi başlarına indirmeleri otomatik olarak gizlemez veya engellemezler;
moderatörler yapıları onaylamak, karantinaya almak veya geri çekmek için sürüm
moderasyonunu kullanmalıdır.

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

Paket raporu alımı için moderatör/admin uç noktası.

Kimlik doğrulama:

- Moderatör veya admin kullanıcısı için bir API token'ı gerektirir.

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

- Paket sahibi, yayıncı üyesi, moderatör veya admin kullanıcısı için bir API
  token'ı gerektirir.

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

Paket raporlarını çözmek veya yeniden açmak için moderatör/admin uç noktası.

İstek:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note`, `confirmed` ve `dismissed` için gereklidir; `status` yeniden `open`
olarak ayarlanırken atlanabilir. Aynı denetlenebilir iş akışında sürüm
moderasyonu uygulamak için onaylanmış bir raporla `finalAction: "quarantine"`
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

Paket sürümü incelemesi için moderatör/admin uç noktası.

İstek:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Desteklenen durumlar:

- `approved`: elle incelendi ve izin verildi.
- `quarantined`: takip beklenirken engellendi.
- `revoked`: bir sürüm daha önce güvenilir kabul edildikten sonra engellendi.

Karantinaya alınan ve iptal edilen sürümler, yapı indirme rotalarından `403`
döndürür. Her değişiklik bir denetim günlüğü girdisi yazar.

### `GET /api/v1/packages/{name}/file`

Bir paket dosyası için ham metin içeriğini döndürür.

Sorgu parametreleri:

- `path` (gerekli)
- `version` (isteğe bağlı)
- `tag` (isteğe bağlı)

Notlar:

- Varsayılan olarak en son sürümü kullanır.
- İndirme kotası yerine okuma kotası kovasını kullanır.
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
- Skills, `GET /api/v1/download` adresine yönlendirilir.
- Plugin/paket arşivleri, eski OpenClaw istemcilerinin çalışmaya devam etmesi
  için `package/` köküne sahip zip dosyalarıdır.
- Bu rota yalnızca ZIP olarak kalır. ClawPack `.tgz` dosyalarını akıtmaz.
- Yanıtlar, çözümleyici bütünlük kontrolleri için `ETag`, `Digest`,
  `X-ClawHub-Artifact-Type` ve `X-ClawHub-Artifact-Sha256` başlıklarını içerir.
- Yalnızca kayıt defterine ait metadata indirilen arşive enjekte edilmez.
- Bekleyen VirusTotal taramaları indirmeleri engellemez; kötü amaçlı sürümler `403` döndürür.
- Çağıran sahip değilse özel paketler `404` döndürür.

### `GET /api/npm/{package}`

ClawPack destekli paket sürümleri için npm uyumlu bir packument döndürür.

Notlar:

- Yalnızca yüklenmiş ClawPack npm-pack tarball'larına sahip sürümler listelenir.
- Eski yalnızca ZIP sürümleri bilinçli olarak atlanır.
- `dist.tarball`, `dist.integrity` ve `dist.shasum`, kullanıcılar isterse npm'i
  aynaya yönlendirebilsin diye npm uyumlu alanlar kullanır.
- Kapsamlı paket packument'leri hem `/api/npm/@scope/name` hem de npm'in
  kodlanmış `/api/npm/@scope%2Fname` istek yolunu destekler.

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm ayna istemcileri için yüklenen ClawPack tarball baytlarını aynen akıtır.

Notlar:

- İndirme kotası kovasını kullanır.
- İndirme başlıkları ClawHub SHA-256 ile npm integrity/shasum metadata'sını içerir.
- Moderasyon ve özel paket erişim kontrolleri uygulanmaya devam eder.

### `GET /api/v1/resolve`

CLI tarafından yerel bir fingerprint'i bilinen bir sürümle eşlemek için kullanılır.

Sorgu parametreleri:

- `slug` (gerekli)
- `hash` (gerekli): bundle fingerprint'inin 64 karakterlik hex sha256 değeri

Yanıt:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Barındırılan bir skill sürümü ZIP'ini indirir veya `clean` ya da `suspicious`
taramasına sahip ve barındırılan sürümü olmayan güncel GitHub destekli bir skill
için GitHub kaynak devri döndürür.

Sorgu parametreleri:

- `slug` (gerekli)
- `version` (isteğe bağlı): semver dizesi
- `tag` (isteğe bağlı): tag adı (örn. `latest`)

Notlar:

- Ne `version` ne de `tag` sağlanırsa en son sürüm kullanılır.
- Soft-delete edilmiş sürümler `410` döndürür.
- GitHub destekli skill devirleri baytları proxy'lemez veya aynalamaz. JSON
  yanıtı `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`
  ve `archiveUrl` içerir; tarama/geçerli durum bir kapıdır ve başarı payload
  metadata'sı olarak dahil edilmez.
- İndirme istatistikleri UTC günü başına benzersiz kimlikler olarak sayılır (API token'ı geçerliyse `userId`, aksi halde IP).

## Kimlik doğrulama uç noktaları (Bearer token)

Tüm uç noktalar şunu gerektirir:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Token'ı doğrular ve kullanıcı handle'ını döndürür.

### `POST /api/v1/skills`

Yeni bir sürüm yayınlar.

- Tercih edilen: `payload` JSON + `files[]` blob'ları ile `multipart/form-data`.
- `files` içeren JSON gövdesi (storageId tabanlı) de kabul edilir.
- İsteğe bağlı payload alanı: `ownerHandle`. Mevcut olduğunda API, bu yayıncıyı
  sunucu tarafında çözümler ve aktörün yayıncı erişimine sahip olmasını gerektirir.
- İsteğe bağlı payload alanı: `migrateOwner`. `ownerHandle` ile `true` olduğunda,
  aktör hem mevcut hem de hedef yayıncılarda admin/sahip ise mevcut bir skill o
  sahibe taşınabilir. Bu açık onay olmadan sahip değişiklikleri reddedilir.

### `POST /api/v1/packages`

Bir code-plugin veya bundle-plugin sürümü yayınlar.

- Bearer token kimlik doğrulaması gerektirir.
- `multipart/form-data` gerektirir.
- İzin verilen form alanları `payload`, tekrarlanan `files` blob'ları veya tek
  bir `clawpack` tarball referansıdır. `clawpack`, bir `.tgz` blob'u veya
  upload-url akışı tarafından döndürülen bir storage id olabilir. Aşamalanmış
  storage-id yayınları, bu yükleme URL'siyle döndürülen `clawpackUploadTicket`
  değerini de içermelidir.
- Aynı istekte ya `files` ya da `clawpack` kullanın; ikisini birlikte asla kullanmayın.
- JSON gövdeleri ve çağıranın sağladığı `payload.files` / `payload.artifact`
  metadata'sı reddedilir.
- Doğrudan multipart yayın istekleri 18MB ile sınırlıdır. ClawPack tarball'ları,
  120MB tarball sınırına kadar upload-url akışını kullanabilir.
- İsteğe bağlı payload alanı: `ownerHandle`. Mevcut olduğunda yalnızca adminler bu sahip adına yayın yapabilir.

Doğrulama öne çıkanları:

- `family`, `code-plugin` veya `bundle-plugin` olmalıdır.
- Plugin paketleri `openclaw.plugin.json` gerektirir. ClawPack `.tgz`
  yüklemeleri bunu `package/openclaw.plugin.json` konumunda içermelidir.
- Code plugin'leri `package.json`, kaynak repo metadata'sı, kaynak commit
  metadata'sı, config schema metadata'sı, `openclaw.compat.pluginApi` ve
  `openclaw.build.openclawVersion` gerektirir.
- `openclaw.hostTargets` ve `openclaw.environment` isteğe bağlı metadata'dır.
- Yalnızca `openclaw` org yayıncısı ve mevcut `openclaw` org üyelerinin kişisel
  yayıncıları `official` kanalına yayın yapabilir.
- Başkası adına yapılan yayınlar da official-channel uygunluğunu hedef sahip hesabına göre doğrular.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Bir skill'i soft-delete yapar / geri yükler (sahip, moderatör veya admin).

İsteğe bağlı JSON gövdesi:

```json
{ "reason": "Held for moderation pending legal review." }
```

Mevcut olduğunda `reason`, skill moderasyon notu olarak saklanır ve denetim günlüğüne kopyalanır.
Sahip tarafından başlatılan soft delete işlemleri slug'ı 30 gün ayırır; ardından slug başka bir
yayıncı tarafından talep edilebilir. Silme yanıtı, bu sona erme geçerliyse `slugReservedUntil` içerir.
Moderatör/admin gizlemeleri ve güvenlik kaldırmaları bu şekilde sona ermez.

Silme yanıtı:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Durum kodları:

- `200`: tamam
- `401`: yetkisiz
- `403`: yasak
- `404`: skill/kullanıcı bulunamadı
- `500`: dahili sunucu hatası

### `POST /api/v1/users/publisher`

Yalnızca admin. Bir handle için bir org yayıncısının var olmasını sağlar. Handle hâlâ
eski bir paylaşılan kullanıcı/kişisel yayıncıyı gösteriyorsa, uç nokta önce onu bir org yayıncısına taşır.
Yeni oluşturulan bir org için `memberHandle` sağlayın; işlemi yapan admin üye olarak eklenmez.
`memberRole` varsayılan olarak `owner` olur.

- Gövde: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Yanıt: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Kimliği doğrulanmış self-serve org yayıncısı oluşturma. Yeni bir org yayıncısı oluşturur ve
çağıranı sahip olarak ekler. Bu uç nokta mevcut kullanıcı/kişisel handle'ları taşımaz ve
yayıncıyı trusted/official olarak işaretlemez.

- Gövde: `{ "handle": "opik", "displayName": "Opik" }`
- Yanıt: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Handle zaten bir yayıncı, kullanıcı veya kişisel yayıncı tarafından kullanılıyorsa `409` döndürür.

### `POST /api/v1/users/reserve`

Yalnızca admin. Bir sürüm yayınlamadan, hak sahibi için kök slug'ları ve paket adlarını ayırır.
Paket adları sürüm satırı olmayan özel yer tutucu paketler hâline gelir; böylece aynı sahip
daha sonra gerçek code-plugin veya bundle-plugin sürümünü bu ad altında yayınlayabilir.

- Gövde: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Yanıt: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Yalnızca admin. Convex Auth hesap satırlarını düzenlemeden, doğrulanmış bir yedek GitHub OAuth principal'ı
için kişisel bir yayıncıyı kurtarır. İstek, değişmez iki GitHub provider hesap id'sini de adlandırmalıdır;
değişebilir handle'lar yalnızca operatöre dönük bir koruma olarak kullanılır.

Uç nokta varsayılan olarak deneme çalıştırmasıdır. Kurtarmayı uygulamak için personel her iki GitHub kimliği arasındaki sürekliliği bağımsız olarak doğruladıktan sonra `dryRun: false` ve
`confirmIdentityVerified: true` gerekir. Hedef kullanıcının mevcut kişisel
yayıncısında skills, paketler veya GitHub skill kaynakları varsa kurtarma güvenli biçimde başarısız olur.
Kurtarma ayrıca, doğrudan sahip yollarının yeni yayıncı yetkisiyle uyumlu olması için kurtarılan yayıncının skills'leri,
skill slug takma adları, paketleri, paket denetçisi uyarıları ve türetilmiş arama özeti satırları için eski `ownerUserId` alanlarını da taşır. Kurtarılan handle için etkin korumalı handle
rezervasyonu da yedek kullanıcıya yeniden atanır; böylece sonraki
profil senkronizasyonu eski kullanıcının rakip yetkisini geri getiremez. Her birincil tablo, uygulama işlemi başına
100 satırla sınırlıdır; daha büyük kurtarmalar önce sürdürülebilir bir sahip taşıması kullanmalıdır.
GitHub skill kaynakları yayıncı kapsamındadır ve yeniden yazılmak yerine denetlenmiş olarak raporlanır.

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

- Her iki uç nokta da API token kimlik doğrulaması gerektirir ve yalnızca skill sahibi için çalışır.
- `rename`, önceki slug'ı yönlendirme takma adı olarak korur.
- `merge`, kaynak listelemeyi gizler ve kaynak slug'ı hedef listelemeye yönlendirir.

### Sahipliği aktarma uç noktaları

- `POST /api/v1/skills/{slug}/transfer`
  - Gövde: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Yanıt: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Yanıt (kabul/reddet/iptal): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Yanıt şekli: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Bir kullanıcıyı yasaklar ve sahip olunan skills'leri kalıcı olarak siler (yalnızca moderatör/yönetici).

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

Bir kullanıcının yasağını kaldırır ve uygun skills'leri geri yükler (yalnızca yönetici).

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

Yasağı kaldırmadan veya içeriği geri yüklemeden mevcut bir yasak için saklanan nedeni değiştirir
(yalnızca yönetici). `dryRun`, `false` olmadıkça varsayılan olarak deneme çalıştırmasıdır.

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

Bir yıldız ekler/kaldırır (öne çıkarma). Her iki uç nokta da idempotenttir.

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

`POST /api/cli/upload-url`, `uploadUrl` ve `uploadTicket` döndürür. ClawPack tarball'ını hazırlayan paket
yayınları, oluşan depolama kimliğini `clawpack` olarak ve döndürülen bileti `clawpackUploadTicket` olarak göndermelidir.

## Registry keşfi (`/.well-known/clawhub.json`)

CLI, registry/kimlik doğrulama ayarlarını siteden keşfedebilir:

- `/.well-known/clawhub.json` (JSON, tercih edilir)
- `/.well-known/clawdhub.json` (eski)

Şema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Kendi kendine barındırıyorsanız bu dosyayı sunun (veya `CLAWHUB_REGISTRY` değerini açıkça ayarlayın; eski `CLAWDHUB_REGISTRY`).

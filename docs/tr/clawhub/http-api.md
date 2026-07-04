---
read_when:
    - Uç noktalar ekleme/değiştirme
    - CLI ↔ kayıt defteri isteklerinde hata ayıklama
summary: HTTP API başvurusu (genel + CLI uç noktaları + kimlik doğrulama).
x-i18n:
    generated_at: "2026-07-04T04:01:25Z"
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
Eski `/api/...` ve `/api/cli/...` uyumluluk için kalır (`DEPRECATIONS.md` dosyasına bakın).
OpenAPI: `/api/v1/openapi.json`.

## Herkese açık katalog yeniden kullanımı

Üçüncü taraf dizinler, ClawHub becerilerini listelemek veya aramak için herkese açık okuma uç noktalarını kullanabilir. Lütfen sonuçları önbelleğe alın, `429`/`Retry-After` değerlerine uyun, kullanıcıları kanonik ClawHub listesine (`https://clawhub.ai/<owner>/skills/<slug>`) geri bağlayın ve ClawHub'ın üçüncü taraf siteyi onayladığını ima etmekten kaçının. Gizli, özel veya moderasyon tarafından engellenmiş içeriği herkese açık API yüzeyi dışında yansıtmaya çalışmayın.

Web slug kısayolları kayıt defteri aileleri genelinde çözümlenir, ancak API istemcileri rota
önceliğini yeniden oluşturmak yerine okuma uç noktaları tarafından döndürülen
kanonik URL'leri kullanmalıdır.

## Hız sınırları

Uygulama modeli:

- Anonim istekler: IP başına uygulanır.
- Kimliği doğrulanmış istekler (geçerli Bearer token): kullanıcı kovası başına uygulanır.
- Token eksik/geçersizse davranış IP uygulamasına geri döner.
- Kimliği doğrulanmış yazma uç noktaları, sunucu nedeni bildiğinde yalın bir `Unauthorized` döndürmemelidir. Eksik tokenlar, geçersiz/iptal edilmiş tokenlar ve silinmiş/yasaklanmış/devre dışı bırakılmış hesapların her biri, CLI istemcilerinin kullanıcılara onları neyin engellediğini söyleyebilmesi için işlem yapılabilir metin almalıdır.

- Okuma: IP başına 3000/dk, anahtar başına 12000/dk
- Yazma: IP başına 300/dk, anahtar başına 3000/dk
- İndirme: IP başına 1200/dk, anahtar başına 6000/dk (indirme uç noktaları)

Başlıklar:

- Eski uyumluluk: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Standartlaştırılmış: `RateLimit-Limit`, `RateLimit-Reset`
- `429` durumunda: `X-RateLimit-Remaining: 0` ve `RateLimit-Remaining: 0`
- `429` durumunda: `Retry-After`

Başlık semantiği:

- `X-RateLimit-Reset`: mutlak Unix epoch saniyesi
- `RateLimit-Reset`: sıfırlamaya kadar saniye (gecikme)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: mevcut olduğunda tam kalan bütçe.
  Parçalı başarılı istekler, yaklaşık bir genel değer döndürmek yerine bu başlığı atlar.
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

- `Retry-After` varsa yeniden denemeden önce o kadar saniye bekleyin.
- Eşzamanlı yeniden denemelerden kaçınmak için jitter uygulanmış geri çekilme kullanın.
- `Retry-After` eksikse `RateLimit-Reset` değerine geri dönün (veya `X-RateLimit-Reset` değerinden hesaplayın).

IP kaynağı:

- Güvenilir istemci IP başlıklarını, `cf-connecting-ip` dahil, yalnızca dağıtım güvenilir iletilen başlıkları açıkça etkinleştirdiğinde kullanır.
- ClawHub, uçta istemci IP'lerini tanımlamak için güvenilir iletme başlıklarını kullanır.
- Güvenilir istemci IP'si yoksa anonim istekler yalnızca hız sınırı türüne göre kapsamlanmış yedek kovaları kullanır. Bu yedek kovalar, çağıranın sağladığı yolları, slug'ları, paket adlarını, sürümleri, sorgu dizelerini veya diğer yapıt parametrelerini içermez.

## Hata yanıtları

Herkese açık v1 hata yanıtları `content-type: text/plain; charset=utf-8` ile düz metindir.
Buna doğrulama hataları (`400`), eksik herkese açık kaynaklar (`404`), kimlik doğrulama ve
izin hataları (`401`/`403`), hız sınırları (`429`) ve engellenmiş indirmeler dahildir. İstemciler
yanıt gövdesini insan tarafından okunabilir bir dize olarak okumalıdır. Bilinmeyen sorgu parametreleri
uyumluluk için yok sayılır, ancak geçersiz değerlere sahip tanınan sorgu parametreleri
`400` döndürür.

## Herkese açık uç noktalar (kimlik doğrulama yok)

### `GET /api/v1/search`

Sorgu parametreleri:

- `q` (zorunlu): sorgu dizesi
- `limit` (isteğe bağlı): tamsayı
- `highlightedOnly` (isteğe bağlı): öne çıkarılmış becerilere filtrelemek için `true`
- `nonSuspiciousOnly` (isteğe bağlı): şüpheli (`flagged.suspicious`) becerileri gizlemek için `true`
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

- Sonuçlar alaka sırasına göre döndürülür (gömme benzerliği + tam slug/ad token güçlendirmeleri + küçük bir popülerlik önceliği).
- Alaka popülerlikten daha güçlüdür. Kesin bir slug veya görünen ad token eşleşmesi, çok daha güçlü etkileşime sahip daha gevşek bir eşleşmenin üstüne çıkabilir.
- ASCII metin, kelime ve noktalama sınırlarında token'lara ayrılır. Örneğin `personal-map` bağımsız bir `map` token'ı içerirken `amap-jsapi-skill`, `amap`, `jsapi` ve `skill` içerir; bu nedenle `map` araması `personal-map` için `amap-jsapi-skill` öğesine göre daha güçlü bir sözcüksel eşleşme verir.
- Popülerlik log ölçeklidir ve sınırlıdır. Yüksek etkileşimli beceriler, sorgu metni daha zayıf eşleştiğinde daha düşük sıralanabilir.
- Şüpheli veya gizli moderasyon durumu, çağıran filtrelerine ve geçerli moderasyon durumuna bağlı olarak bir beceriyi herkese açık aramadan kaldırabilir.

Yayıncı keşfedilebilirlik kılavuzu:

- Kullanıcıların kelimesi kelimesine arayacağı terimleri görünen ada, özete ve etiketlere koyun. Bağımsız bir slug token'ını yalnızca korumak istediğiniz kararlı bir kimlik olduğunda kullanın.
- Yeni slug daha iyi uzun vadeli kanonik ad olmadığı sürece yalnızca tek bir sorguyu yakalamak için slug'ı yeniden adlandırmayın. Eski slug'lar yönlendirme takma adları olur, ancak kanonik URL, görüntülenen slug ve gelecekteki arama özetleri yeni slug'ı kullanır.
- Yeniden adlandırma takma adları, kayıt defteri üzerinden çözümlenen eski URL'ler ve kurulumlar için çözümlemeyi korur, ancak arama sıralaması yeniden adlandırma dizine eklendikten sonra kanonik beceri meta verilerine dayanır. Mevcut istatistikler beceriyle kalır.
- Bir beceri beklenmedik şekilde görünmüyorsa sıralamayla ilgili meta verileri değiştirmeden önce oturum açmışken `clawhub inspect @owner/slug` ile önce moderasyon durumunu kontrol edin.

### `GET /api/v1/skills`

Sorgu parametreleri:

- `limit` (isteğe bağlı): tamsayı (1-200)
- `cursor` (isteğe bağlı): `trending` dışındaki herhangi bir sıralama için sayfalama imleci
- `sort` (isteğe bağlı): `updated` (varsayılan), `recommended` (takma ad: `default`), `createdAt` (takma ad: `newest`), `downloads`, `stars` (takma ad: `rating`), eski kurulum takma adları `installsCurrent`/`installs`/`installsAllTime` `downloads` değerine eşlenir, `trending`
- `nonSuspiciousOnly` (isteğe bağlı): şüpheli (`flagged.suspicious`) becerileri gizlemek için `true`
- `nonSuspicious` (isteğe bağlı): `nonSuspiciousOnly` için eski takma ad

Geçersiz `sort` değerleri `400` döndürür.

Notlar:

- `recommended` etkileşim ve güncellik sinyallerini kullanır.
- `trending`, son 7 gündeki kurulumlara göre sıralar (telemetri tabanlı).
- `createdAt`, yeni beceri taramaları için kararlıdır; `updated`, mevcut beceriler yeniden yayımlandığında değişir.
- `nonSuspiciousOnly=true` olduğunda, imleç tabanlı sıralamalar bir sayfada `limit` öğeden daha az döndürebilir çünkü şüpheli beceriler sayfa alımından sonra filtrelenir.
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

- Sahip yeniden adlandırma/birleştirme akışları tarafından oluşturulan eski slug'lar kanonik beceriye çözümlenir.
- `metadata.os`: beceri frontmatter'ında bildirilen OS kısıtlamaları (ör. `["macos"]`, `["linux"]`). Bildirilmemişse `null`.
- `metadata.systems`: Nix sistem hedefleri (ör. `["aarch64-darwin", "x86_64-linux"]`). Bildirilmemişse `null`.
- Becerinin platform meta verisi yoksa `metadata` `null` olur.
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
- Herkese açık çağıranlar yalnızca zaten işaretlenmiş görünür beceriler için `200` alır.
- Kanıt herkese açık çağıranlar için redakte edilir ve ham parçaları yalnızca sahipler/moderatörler için içerir.

### `POST /api/v1/skills/{slug}/report`

Moderatör incelemesi için bir beceriyi bildirin. Bildirimler beceri düzeyindedir, isteğe bağlı olarak
bir sürüme bağlanır ve beceri bildirim kuyruğunu besler.

Kimlik doğrulama:

- Bir API token'ı gerektirir.

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

Beceri bildirimi alımı için moderatör/yönetici uç noktası.

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

`note`, `confirmed` ve `dismissed` için gereklidir; `status` tekrar `open` olarak
ayarlanırken atlanabilir. Aynı denetlenebilir iş akışında beceriyi gizlemek için triyajı yapılmış
bir bildirimle `finalAction: "hide"` geçirin.

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
- `tag` (isteğe bağlı): etiketlenmiş bir sürümü çözümle (örneğin `latest`).

Notlar:

- Ne `version` ne de `tag` sağlanırsa en son sürümü kullanır.
- Normalleştirilmiş doğrulama durumunu ve tarayıcıya özgü ayrıntıları içerir.
- `security.hasScanResult` yalnızca bir tarayıcı kesin bir karar (`clean`, `suspicious` veya `malicious`) ürettiğinde `true` olur.
- `moderation`, en son sürümden türetilen güncel beceri düzeyinde moderasyon anlık görüntüsüdür.
- Geçmiş bir sürümü sorgularken, `moderation` ve `security` değerlerini aynı sürüm bağlamı olarak ele almadan önce `moderation.matchesRequestedVersion` ve `moderation.sourceVersion` değerlerini kontrol edin.

### `POST /api/v1/skills/-/scan`

Yeni ClawScan işleri için kimlik doğrulamalı gönderim uç noktası.

Yerel yükleme taramaları artık desteklenmiyor. `multipart/form-data` veya `{ "source": { "kind": "upload" } }` kullanan istekler `410` döndürür.

Yayımlanmış taramalar JSON kullanır:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

Notlar:

- Tarama isteği yükleri ve indirilebilir raporlar, saklama penceresinden sonra tarama isteği deposundan silinir.
- Yayımlanmış taramalar, sahip/yayımcı yönetim erişimi veya platform moderatörü/yöneticisi yetkisi gerektirir.
- Yayımlanmış taramalar yalnızca `update: true` olduğunda ve tarama başarıyla tamamlandığında geri yazar.
- Yanıt, `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` ile `202` olur.
- Tarama işleri eşzamansızdır. Elle yapılan tarama istekleri normal yayımlama/geri doldurma işlerinden önce önceliklendirilir, ancak tamamlanma yine de worker kullanılabilirliğine bağlıdır.

### `GET /api/v1/skills/-/scan/{scanId}`

Gönderilmiş bir tarama için kimlik doğrulamalı yoklama uç noktası.

- Kuyrukta/çalışıyor/başarılı/başarısız durumunu döndürür.
- Kuyruktayken `queue.queuedAhead` ve `queue.position` değerlerini döndürür; böylece istemciler isteğin önünde kaç öncelikli manuel tarama olduğunu gösterebilir. Çok büyük kuyruklar sınırlandırılır ve `queuedAheadIsEstimate: true` ile raporlanır.
- Kullanılabilir olduğunda `report`, `clawscan`, `skillspector`, `staticAnalysis` ve `virustotal` bölümlerini içerir.
- Başarısız tarama işleri `lastError` ile `status: "failed"` döndürür.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Kimlik doğrulamalı rapor arşivi uç noktası.

- Başarılı olmuş bir tarama gerektirir; terminal olmayan taramalar `409` döndürür.
- `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` ve `README.md` içeren bir ZIP döndürür.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Gönderilmiş sürümler için kimlik doğrulamalı saklanan rapor arşivi uç noktası.

- Beceri veya Plugin için sahip/yayımcı yönetim erişimi ya da platform moderatörü/yöneticisi yetkisi gerektirir.
- Engellenmiş veya gizlenmiş sürümler dahil olmak üzere, tam olarak gönderilen sürüm için saklanan tarama sonuçlarını döndürür.
- `kind` varsayılan olarak `skill` değerini alır; Plugin/paket taramaları için `kind=plugin` kullanın.
- Tarama isteği indirmeleriyle aynı ZIP şeklini döndürür.

### `POST /api/v1/skills/-/scan/batch`

Yalnızca yöneticilere açık kanonik toplu yeniden tarama rotası. Eski `POST /api/v1/skills/-/rescan-batch` ile aynı yük şeklini kabul eder.

### `POST /api/v1/skills/-/scan/batch/status`

Yalnızca yöneticilere açık kanonik toplu durum rotası. `{ "jobIds": ["..."] }` kabul eder ve eski `POST /api/v1/skills/-/rescan-batch/status` ile aynı toplam sayaçları döndürür.

### `GET /api/v1/skills/{slug}/verify`

`clawhub skill verify` tarafından kullanılan Beceri Kartı doğrulama zarfını döndürür.

Sorgu parametreleri:

- `version` (isteğe bağlı): belirli sürüm dizesi.
- `tag` (isteğe bağlı): etiketlenmiş bir sürümü çözer (örneğin `latest`).

Notlar:

- `ok` yalnızca seçilen sürümde oluşturulmuş bir Beceri Kartı varsa, moderasyon tarafından kötü amaçlı yazılım nedeniyle engellenmemişse ve ClawScan doğrulaması temizse `true` olur.
- Beceri kimliği, yayımcı kimliği ve seçilen sürüm meta verileri üst düzey zarf alanlarıdır (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`); böylece kabuk otomasyonu bunları iç içe sarmalayıcıları açmadan okuyabilir.
- `security`, üst düzey ClawScan/güvenlik kararıdır. Otomasyon `ok`, `decision`, `reasons` ve `security.status` değerlerini temel almalıdır.
- `security.signals`, `staticScan`, `virusTotal` ve `skillSpector` gibi destekleyici tarayıcı kanıtlarını içerir.
- `security.signals.dependencyRegistry`, v1 yanıt uyumluluğu için korunur, ancak bağımlılık kayıt varlığı tarayıcısı kullanımdan kaldırılmıştır ve bu anahtar her zaman `null` olur.
- `provenance`, yalnızca ClawHub yayımlama veya içe aktarma sırasında bir GitHub depo/ref/commit/path değerini çözüp sakladığında `server-resolved-github-import` olur; aksi halde `unavailable` olur.

### `POST /api/v1/skills/-/security-verdicts`

Tam beceri sürümleri için güncel kompakt güvenlik kararlarını döndürür. Bu koleksiyon uç noktası, OpenClaw Control UI gibi hangi yüklü ClawHub beceri sürümlerini göstermesi gerektiğini zaten bilen istemciler içindir.

İstek:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Notlar:

- `items`, 1-100 benzersiz `{ slug, version }` çifti içermelidir.
- Sonuçlar öğe bazındadır; eksik bir beceri veya sürüm tüm yanıtı başarısız yapmaz.
- Yanıt yalnızca güvenlik içindir. Beceri Kartı verilerini, oluşturulmuş kart durumunu, yapıt dosyası listelerini veya ayrıntılı tarayıcı yüklerini içermez.
- `security.signals` yalnızca durum düzeyinde destekleyici kanıt içerir; tam tarayıcı ayrıntıları için `/scan` veya ClawHub güvenlik denetimi sayfasını kullanın.
- `security.signals.dependencyRegistry`, v1 yanıt uyumluluğu için korunur, ancak bağımlılık kayıt varlığı tarayıcısı kullanımdan kaldırılmıştır ve bu anahtar her zaman `null` olur.
- Beceri Kartı olmaması, bu uç noktanın `ok`, `decision` veya `reasons` değerlerini etkilemez; istemciler kart içeriğine ihtiyaç duyduğunda yüklü `skill-card.md` dosyasını yerel olarak okumalıdır.
- Tek becerilik Beceri Kartı doğrulama zarfına ihtiyaç duyduğunuzda `/verify`, oluşturulmuş kart markdown'ına ihtiyaç duyduğunuzda `/card` ve ayrıntılı tarayıcı verilerine ihtiyaç duyduğunuzda `/scan` kullanın.

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

Ham metin içeriği döndürür.

Sorgu parametreleri:

- `path` (zorunlu)
- `version` (isteğe bağlı)
- `tag` (isteğe bağlı)

Notlar:

- Varsayılan olarak en son sürümü kullanır.
- Dosya boyutu sınırı: 200KB.

### `GET /api/v1/packages`

Şunlar için birleşik katalog uç noktası:

- Skills
- kod pluginleri
- paket pluginleri

Sorgu parametreleri:

- `limit` (isteğe bağlı): tam sayı (1–100)
- `cursor` (isteğe bağlı): sayfalama imleci
- `family` (isteğe bağlı): `skill`, `code-plugin` veya `bundle-plugin`
- `channel` (isteğe bağlı): `official`, `community` veya `private`
- `isOfficial` (isteğe bağlı): `true` veya `false`
- `sort` (isteğe bağlı): `updated` (varsayılan), `recommended`, `trending`, `downloads`, eski takma ad `installs`
- `category` (isteğe bağlı): plugin kategori filtresi. Yalnızca istek plugin paketlerine
  (`/api/v1/plugins`, `/api/v1/code-plugins`, `/api/v1/bundle-plugins` veya
  `family=code-plugin`/`family=bundle-plugin` içeren paket uç noktaları)
  kapsamlandığında desteklenir. Kontrollü kategoriler ve eski v1 filtre takma adları
  `GET /api/v1/plugins` altında belgelenmiştir.

Notlar:

- `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` veya `sort` için geçersiz değerler `400` döndürür. Bilinmeyen sorgu parametreleri yok sayılır.
- `GET /api/v1/code-plugins` ve `GET /api/v1/bundle-plugins` sabit aile takma adları olarak kalır.
- Skills girdileri, Skills kayıt defteri tarafından desteklenmeye devam eder ve hâlâ yalnızca `POST /api/v1/skills` üzerinden yayımlanabilir.
- `POST /api/v1/packages` hâlâ yalnızca code-plugin ve bundle-plugin sürümleri içindir.
- Anonim çağıranlar yalnızca herkese açık paket kanallarını görür.
- Kimliği doğrulanmış çağıranlar, listeleme/arama sonuçlarında ait oldukları yayıncıların özel paketlerini görebilir.
- `channel=private` yalnızca kimliği doğrulanmış çağıranın okuyabildiği paketleri döndürür.

### `GET /api/v1/packages/search`

Skills + plugin paketleri genelinde birleşik katalog araması.

Sorgu parametreleri:

- `q` (zorunlu): sorgu dizesi
- `limit` (isteğe bağlı): tam sayı (1–100)
- `family` (isteğe bağlı): `skill`, `code-plugin` veya `bundle-plugin`
- `channel` (isteğe bağlı): `official`, `community` veya `private`
- `isOfficial` (isteğe bağlı): `true` veya `false`
- `category` (isteğe bağlı): plugin kategori filtresi. Yalnızca istek plugin paketlerine
  kapsamlandığında desteklenir. Kontrollü kategoriler ve eski v1
  filtre takma adları `GET /api/v1/plugins` altında belgelenmiştir.

Notlar:

- `family`, `channel`, `isOfficial`, `featured` veya
  `highlightedOnly` için geçersiz değerler `400` döndürür. Bilinmeyen sorgu parametreleri yok sayılır.
- Anonim çağıranlar yalnızca herkese açık paket kanallarını görür.
- Kimliği doğrulanmış çağıranlar, ait oldukları yayıncıların özel paketlerinde arama yapabilir.
- `channel=private` yalnızca kimliği doğrulanmış çağıranın okuyabildiği paketleri döndürür.

### `GET /api/v1/plugins`

Code-plugin ve bundle-plugin paketleri genelinde yalnızca plugin katalog gezintisi.

Sorgu parametreleri:

- `limit` (isteğe bağlı): tam sayı (1-100)
- `cursor` (isteğe bağlı): sayfalama imleci
- `isOfficial` (isteğe bağlı): `true` veya `false`
- `sort` (isteğe bağlı): `recommended` (varsayılan), `trending`, `downloads`, `updated`, eski takma ad `installs`
- `category` (isteğe bağlı): plugin kategori filtresi. Geçerli değerler:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Eski v1 filtre takma adları okuma uç noktalarında kabul edilmeye devam eder:

- `mcp-tooling`, `data` ve `automation`, `tools` değerine çözümlenir.
- `observability` ve `deployment`, `gateway` değerine çözümlenir.
- `dev-tools`, `runtime` değerine çözümlenir.

`trending`, yedi günlük kurulum/indirme lider tablosudur ve tüm zaman toplamlarını kullanmaz.
Birleşik `/api/v1/packages` uç noktasında yalnızca pluginler içindir; Skills kataloğu için
`/api/v1/skills?sort=trending` kullanın.

Eski takma adlar, saklanan veya yazar tarafından bildirilen kategori değerleri olarak kabul edilmez.

### `GET /api/v1/skills/export`

Çevrimdışı analiz için en son herkese açık Skills toplu dışa aktarımı.

Kimlik doğrulama:

- API belirteci zorunludur.

Sorgu parametreleri:

- `startDate` (zorunlu): Skills `updatedAt` için Unix milisaniye alt sınırı.
- `endDate` (zorunlu): Skills `updatedAt` için Unix milisaniye üst sınırı.
- `limit` (isteğe bağlı): tam sayı (1-250), varsayılan `250`.
- `cursor` (isteğe bağlı): önceki yanıttan sayfalama imleci.

Yanıt:

- Gövde: ZIP arşivi.
- Dışa aktarılan her Skills, `{publisher}/{slug}/` kökünde yer alır.
- Barındırılan Skills, en son saklanan sürüm dosyalarını içerir ve
  `_manifest.json` içinde `sourceRef: "public-clawhub"` ile listelenir.
- `clean` veya `suspicious` taraması olan güncel GitHub destekli Skills,
  repo, commit, path, içerik karması ve arşiv URL'siyle birlikte
  `sourceRef: "public-github"` içeren `_source_handoff.json` dosyasını içerir.
  ClawHub tarafından barındırılan kaynak dosyalarını içermezler.
- Her Skills, `_export_skill_meta.json` içerir.
- `_manifest.json` her zaman ZIP kökünde yer alır.
- Tek tek Skills veya dosyalar dışa aktarılamadığında `_errors.json` eklenir.

Başlıklar:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Çevrimdışı analiz için en son herkese açık Plugin sürümlerinin toplu dışa aktarımı.

Kimlik doğrulama:

- API token gereklidir.

Sorgu parametreleri:

- `startDate` (zorunlu): Plugin `updatedAt` için Unix milisaniye alt sınırı.
- `endDate` (zorunlu): Plugin `updatedAt` için Unix milisaniye üst sınırı.
- `limit` (isteğe bağlı): tam sayı (1-250), varsayılan `250`.
- `cursor` (isteğe bağlı): önceki yanıttan sayfalama imleci.
- `family` (isteğe bağlı): `code-plugin` veya `bundle-plugin`. Atlanırsa her iki
  Plugin ailesi de kullanılır.

Yanıt:

- Gövde: ZIP arşivi.
- Dışa aktarılan her Plugin `{family}/{packageName}/` altında köklenir.
- Dışa aktarılan her Plugin, en son sürümün saklanan dosyalarını içerir.
- Plugin başına dışa aktarma meta verileri
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` konumunda saklanır.
- `_manifest.json` her zaman ZIP kökünde bulunur.
- Tekil Plugin'ler veya dosyalar dışa aktarılamadığında `_errors.json`
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
- `category` (isteğe bağlı): Plugin kategorisi filtresi. Geçerli değerler:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Notlar:

- `GET /api/v1/plugins` altında belgelenen eski v1 filtre takma adları da
  kabul edilir.
- Kategori filtreleme, arama sorgusu yeniden yazımı değil, Plugin kategori özet
  satırlarıyla desteklenen gerçek bir API filtresidir.
- Sonuçlar ilgi sırasına göre döndürülür ve şu anda sayfalanmaz.
- Plugin araması için tarayıcı UI sıralama kontrolleri, yüklenen ilgi sonuçlarını
  yeniden sıralar ve mevcut `/skills` göz atma davranışıyla eşleşir.

### `GET /api/v1/packages/{name}`

Paket ayrıntı meta verilerini döndürür.

Notlar:

- Skills, birleşik katalogda bu rota üzerinden de çözümlenebilir.
- Özel paketler, çağıran taraf sahip yayıncıyı okuyamadığı sürece `404` döndürür.

### `DELETE /api/v1/packages/{name}`

Bir paketi ve tüm sürümlerini silinmiş olarak işaretler.

Notlar:

- Paket sahibi, kuruluş yayıncı sahibi/yöneticisi, platform moderatörü veya
  platform yöneticisi için bir API token gerektirir.

### `GET /api/v1/packages/{name}/versions`

Sürüm geçmişini döndürür.

Sorgu parametreleri:

- `limit` (isteğe bağlı): tam sayı (1–100)
- `cursor` (isteğe bağlı): sayfalama imleci

Notlar:

- Özel paketler, çağıran taraf sahip yayıncıyı okuyamadığı sürece `404` döndürür.

### `GET /api/v1/packages/{name}/versions/{version}`

Dosya meta verileri, uyumluluk, doğrulama, artifact meta verileri ve tarama
verileri dahil olmak üzere tek bir paket sürümünü döndürür.

Notlar:

- `version.artifact.kind`, eski dünya paket arşivleri için `legacy-zip` veya
  ClawPack destekli sürümler için `npm-pack` olur.
- ClawPack sürümleri npm uyumlu `npmIntegrity`, `npmShasum` ve
  `npmTarballName` alanlarını içerir.
- `version.sha256hash`, eski istemciler için kullanımdan kaldırılmış uyumluluk
  meta verisidir. `/api/v1/packages/{name}/download` tarafından döndürülen tam
  ZIP baytlarını hash'ler. Modern istemciler, kanonik sürüm artifact'ını
  tanımlayan `version.artifact.sha256` değerini kullanmalıdır.
- Tarama verisi varsa `version.vtAnalysis`, `version.llmAnalysis` ve
  `version.staticScan` dahil edilir.
- Özel paketler, çağıran taraf sahip yayıncıyı okuyamadığı sürece `404` döndürür.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Kurulum istemcileri için tam paket sürümü güvenlik ve güven özetini döndürür.
Bu, çözümlenen bir sürümün kurulup kurulamayacağına karar vermek için herkese
açık OpenClaw tüketim yüzeyidir.

Kimlik doğrulama:

- Herkese açık okuma uç noktası. Sahip, yayıncı, moderatör veya yönetici token'ı
  gerekli değildir.

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
  biliniyorsa bulunur.
- `trust.scanStatus`, tarayıcı girdilerinden ve manuel sürüm moderasyonundan
  türetilen etkin güven durumudur.
- `trust.moderationState` null olabilir. Manuel sürüm moderasyonu yoksa `null`
  olur.
- `trust.blockedFromDownload`, kurulum engelleme sinyalidir. OpenClaw ve diğer
  kurulum istemcileri, bu değer `true` olduğunda tarayıcı veya moderasyon
  alanlarından engelleme kurallarını yeniden türetmek yerine kurulumu
  engellemelidir.
- `trust.reasons`, kullanıcıya dönük ve denetim açıklaması listesidir. Neden
  kodları `manual:quarantined`, `scan:malicious` ve `package:malicious` gibi
  kararlı, kompakt dizelerdir.
- `trust.pending`, bir veya daha fazla güven girdisinin hâlâ tamamlanmayı
  beklediği anlamına gelir.
- `trust.stale`, güven özetinin güncel olmayan girdilerden hesaplandığı ve yüksek
  güvenli bir izin kararı öncesinde yenileme gerektiriyor olarak ele alınması
  gerektiği anlamına gelir.

Notlar:

- Bu uç nokta sürüme özeldir. İstemciler bunu yalnızca en son paket meta
  verilerini okuduktan sonra değil, kurmayı amaçladıkları paket sürümünü
  çözümlendikten sonra çağırmalıdır.
- Özel paketler, çağıran taraf sahip yayıncıyı okuyamadığı sürece `404` döndürür.
- Bu uç nokta, sahip/moderatör moderasyon uç noktalarından bilinçli olarak daha
  dardır. Bildiren kimliklerini, rapor gövdelerini, özel kanıtları veya dahili
  inceleme zaman çizelgelerini değil, kurulum kararını ve herkese açık
  açıklamayı ortaya çıkarır.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Bir paket sürümü için açık artifact çözücü meta verilerini döndürür.

Notlar:

- Eski paket sürümleri bir `legacy-zip` artifact'ı ve eski ZIP `downloadUrl`
  döndürür.
- ClawPack sürümleri bir `npm-pack` artifact'ı, npm bütünlük alanları, bir
  `tarballUrl` ve eski ZIP uyumluluk URL'si döndürür.
- Bu, OpenClaw çözücü yüzeyidir; paylaşılan bir URL'den arşiv formatını tahmin
  etmeyi önler.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Sürüm artifact'ını açık çözücü yolu üzerinden indirir.

Notlar:

- ClawPack sürümleri, tam olarak yüklenen npm-pack `.tgz` baytlarını akışla
  iletir.
- Eski ZIP sürümleri `/api/v1/packages/{name}/download?version=` adresine
  yönlendirir.
- İndirme hız kovasını kullanır.

### `GET /api/v1/packages/{name}/readiness`

Gelecekteki OpenClaw tüketimi için hesaplanan hazırlığı döndürür.

Hazırlık kontrolleri şunları kapsar:

- resmi kanal durumu
- en son sürüm kullanılabilirliği
- ClawPack npm-pack artifact kullanılabilirliği
- artifact özeti
- kaynak repo ve commit köken bilgisi
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

Resmi OpenClaw Plugin geçiş satırlarını listelemek için moderatör uç noktası.

Kimlik doğrulama:

- Bir moderatör veya yönetici kullanıcı için API token gerektirir.

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

Resmi bir Plugin geçiş satırı oluşturmak veya güncellemek için yönetici uç
noktası.

Kimlik doğrulama:

- Bir yönetici kullanıcı için API token gerektirir.

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
- `packageName` npm adı olarak normalleştirilir; planlanan geçişler için paket
  eksik olabilir.
- Bu yalnızca geçiş hazırlığını izler. OpenClaw üzerinde değişiklik yapmaz veya
  ClawPack oluşturmaz.

### `GET /api/v1/packages/moderation/queue`

Paket sürümü inceleme kuyrukları için moderatör/yönetici uç noktası.

Kimlik doğrulama:

- Bir moderatör veya yönetici kullanıcı için API token gerektirir.

Sorgu parametreleri:

- `status` (isteğe bağlı): `open` (varsayılan), `blocked`, `manual` veya `all`
- `limit` (isteğe bağlı): tam sayı (1-100)
- `cursor` (isteğe bağlı): sayfalama imleci

Durum anlamları:

- `open`: şüpheli, kötü amaçlı, beklemede, karantinaya alınmış, iptal edilmiş veya raporlanmış sürümler.
- `blocked`: karantinaya alınmış, iptal edilmiş veya kötü amaçlı sürümler.
- `manual`: manuel moderasyon geçersiz kılması olan herhangi bir sürüm.
- `all`: manuel geçersiz kılması, temiz olmayan tarama durumu veya paket raporu olan herhangi bir sürüm.

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

Bir paketi moderatör incelemesi için raporlar. Raporlar paket düzeyindedir ve
isteğe bağlı olarak bir sürüme bağlanabilir. Moderasyon kuyruğunu beslerler,
ancak tek başlarına indirmeleri otomatik olarak gizlemez veya engellemezler;
moderatörler artifact'ları onaylamak, karantinaya almak veya iptal etmek için
sürüm moderasyonunu kullanmalıdır.

Kimlik doğrulama:

- API token gerektirir.

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

- Moderatör veya yönetici kullanıcı için bir API token gerektirir.

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

Paket moderasyonu görünürlüğü için sahip/moderatör uç noktası.

Kimlik doğrulama:

- Paket sahibi, yayımcı üyesi, moderatör veya yönetici kullanıcı için bir API
  token gerektirir.

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
olarak ayarlanırken atlanabilir. Aynı denetlenebilir iş akışında sürüm moderasyonu
uygulamak için onaylanmış bir raporla birlikte `finalAction: "quarantine"` veya
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

Paket sürümü incelemesi için moderatör/yönetici uç noktası.

İstek:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Desteklenen durumlar:

- `approved`: elle incelenmiş ve izin verilmiş.
- `quarantined`: takip beklemede engellenmiş.
- `revoked`: bir sürüm daha önce güvenilir kabul edildikten sonra engellenmiş.

Karantinaya alınan ve iptal edilen sürümler, yapıt indirme rotalarından `403` döndürür.
Her değişiklik bir denetim günlüğü girdisi yazar.

### `GET /api/v1/packages/{name}/file`

Bir paket dosyası için ham metin içeriğini döndürür.

Sorgu parametreleri:

- `path` (zorunlu)
- `version` (isteğe bağlı)
- `tag` (isteğe bağlı)

Notlar:

- Varsayılan olarak en son sürümü kullanır.
- İndirme kotasını değil, okuma oranı kotasını kullanır.
- İkili dosyalar `415` döndürür.
- Dosya boyutu sınırı: 200KB.
- Bekleyen VirusTotal taramaları okumaları engellemez; kötü amaçlı sürümler başka yerde yine de alıkonabilir.
- Özel paketler, çağıran sahip yayımcıyı okuyamıyorsa `404` döndürür.

### `GET /api/v1/packages/{name}/download`

Bir paket sürümü için eski deterministik ZIP arşivini indirir.

Sorgu parametreleri:

- `version` (isteğe bağlı)
- `tag` (isteğe bağlı)

Notlar:

- Varsayılan olarak en son sürümü kullanır.
- Skills, `GET /api/v1/download` adresine yönlendirilir.
- Plugin/paket arşivleri, eski OpenClaw istemcilerinin çalışmaya devam etmesi için
  `package/` köküne sahip zip dosyalarıdır.
- Bu rota yalnızca ZIP olarak kalır. ClawPack `.tgz` dosyalarını akışla göndermez.
- Çözümleyici bütünlük denetimleri için yanıtlara `ETag`, `Digest`, `X-ClawHub-Artifact-Type` ve
  `X-ClawHub-Artifact-Sha256` başlıkları dahildir.
- Yalnızca kayıt defteri meta verileri indirilen arşive enjekte edilmez.
- Bekleyen VirusTotal taramaları indirmeleri engellemez; kötü amaçlı sürümler `403` döndürür.
- Özel paketler, çağıran sahip değilse `404` döndürür.

### `GET /api/npm/{package}`

ClawPack destekli paket sürümleri için npm uyumlu bir packument döndürür.

Notlar:

- Yalnızca yüklenmiş ClawPack npm-pack tarball dosyalarına sahip sürümler listelenir.
- Eski yalnızca ZIP sürümleri özellikle atlanır.
- `dist.tarball`, `dist.integrity` ve `dist.shasum`, kullanıcılar isterse npm'i
  aynaya yöneltebilsin diye npm uyumlu alanlar kullanır.
- Kapsamlı paket packument'ları hem `/api/npm/@scope/name` hem de npm'in
  kodlanmış `/api/npm/@scope%2Fname` istek yolunu destekler.

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm ayna istemcileri için tam olarak yüklenen ClawPack tarball baytlarını akışla gönderir.

Notlar:

- İndirme oranı kotasını kullanır.
- İndirme başlıkları, ClawHub SHA-256 ile birlikte npm integrity/shasum meta verilerini içerir.
- Moderasyon ve özel paket erişim denetimleri uygulanmaya devam eder.

### `GET /api/v1/resolve`

CLI tarafından yerel bir parmak izini bilinen bir sürüme eşlemek için kullanılır.

Sorgu parametreleri:

- `slug` (zorunlu)
- `hash` (zorunlu): bundle parmak izinin 64 karakterli hex sha256 değeri

Yanıt:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Barındırılan bir skill sürümü ZIP dosyasını indirir veya `clean` ya da `suspicious`
taramasına sahip, barındırılan sürümü olmayan güncel GitHub destekli bir skill için
GitHub kaynak devri döndürür.

Sorgu parametreleri:

- `slug` (zorunlu)
- `version` (isteğe bağlı): semver dizesi
- `tag` (isteğe bağlı): etiket adı (örn. `latest`)

Notlar:

- Ne `version` ne de `tag` sağlanırsa en son sürüm kullanılır.
- Geçici olarak silinen sürümler `410` döndürür.
- GitHub destekli skill devirleri baytları proxy'lemez veya aynalamaz. JSON yanıtı
  `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash` ve
  `archiveUrl` içerir; tarama/güncel durum bir geçittir ve başarı yükü meta
  verisi olarak dahil edilmez.
- İndirme istatistikleri UTC günü başına benzersiz kimlikler olarak sayılır (API token geçerliyse `userId`, aksi halde IP).

## Kimlik doğrulama uç noktaları (Bearer token)

Tüm uç noktalar şunu gerektirir:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Token'ı doğrular ve kullanıcı tanıtıcısını döndürür.

### `POST /api/v1/skills`

Yeni bir sürüm yayımlar.

- Tercih edilen: `payload` JSON + `files[]` blob'ları ile `multipart/form-data`.
- `files` içeren JSON gövdesi (storageId tabanlı) de kabul edilir.
- İsteğe bağlı payload alanı: `ownerHandle`. Mevcut olduğunda API bu yayımcıyı
  sunucu tarafında çözer ve aktörün yayımcı erişimine sahip olmasını gerektirir.
- İsteğe bağlı payload alanı: `migrateOwner`. `ownerHandle` ile `true` olduğunda,
  aktör hem mevcut hem de hedef yayımcılarda yönetici/sahip ise mevcut bir skill
  o sahibe taşınabilir. Bu açık onay olmadan sahip değişiklikleri reddedilir.

### `POST /api/v1/packages`

Bir code-plugin veya bundle-plugin sürümü yayımlar.

- Bearer token kimlik doğrulaması gerektirir.
- `multipart/form-data` gerektirir.
- İzin verilen form alanları `payload`, tekrarlanan `files` blob'ları veya bir `clawpack`
  tarball referansıdır. `clawpack`, bir `.tgz` blob'u veya upload-url akışı tarafından
  döndürülen bir storage id olabilir. Aşamalanmış storage-id yayımları, bu yükleme URL'siyle
  döndürülen `clawpackUploadTicket` değerini de içermelidir.
- Aynı istekte `files` veya `clawpack` seçeneklerinden birini kullanın, asla ikisini birden kullanmayın.
- JSON gövdeleri ve çağıran tarafından sağlanan `payload.files` / `payload.artifact`
  meta verileri reddedilir.
- Doğrudan multipart yayım istekleri 18MB ile sınırlıdır. ClawPack tarball dosyaları,
  120MB tarball sınırına kadar upload-url akışını kullanabilir.
- İsteğe bağlı payload alanı: `ownerHandle`. Mevcut olduğunda, yalnızca yöneticiler o sahip adına yayımlayabilir.

Doğrulama öne çıkanları:

- `family`, `code-plugin` veya `bundle-plugin` olmalıdır.
- Plugin paketleri `openclaw.plugin.json` gerektirir. ClawPack `.tgz` yüklemeleri bunu
  `package/openclaw.plugin.json` konumunda içermelidir.
- Code plugin'ler `package.json`, kaynak repo meta verisi, kaynak commit
  meta verisi, config schema meta verisi, `openclaw.compat.pluginApi` ve
  `openclaw.build.openclawVersion` gerektirir.
- `openclaw.hostTargets` ve `openclaw.environment` isteğe bağlı meta verilerdir.
- Yalnızca `openclaw` kuruluş yayımcısı ve mevcut `openclaw` kuruluş üyelerinin
  kişisel yayımcıları `official` kanalına yayımlayabilir.
- Başkası adına yayımlar, official-channel uygunluğunu yine hedef sahip hesabına göre doğrular.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Bir skill'i geçici olarak siler / geri yükler (sahip, moderatör veya yönetici).

İsteğe bağlı JSON gövdesi:

```json
{ "reason": "Held for moderation pending legal review." }
```

Mevcut olduğunda `reason`, skill moderasyon notu olarak saklanır ve denetim günlüğüne kopyalanır.
Sahip tarafından başlatılan geçici silmeler slug'ı 30 gün boyunca ayırır; ardından slug başka bir
yayımcı tarafından alınabilir. Bu sürenin geçerli olduğu durumlarda silme yanıtı `slugReservedUntil` içerir.
Moderatör/yönetici gizlemeleri ve güvenlik kaldırmaları bu şekilde sona ermez.

Silme yanıtı:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Durum kodları:

- `200`: tamam
- `401`: yetkisiz
- `403`: yasak
- `404`: skill/kullanıcı bulunamadı
- `500`: iç sunucu hatası

### `POST /api/v1/users/publisher`

Yalnızca yönetici. Bir tanıtıcı için kuruluş yayımcısının var olmasını sağlar. Tanıtıcı hâlâ
eski paylaşımlı kullanıcı/kişisel yayımcıyı gösteriyorsa uç nokta önce onu kuruluş yayımcısına taşır.
Yeni oluşturulan bir kuruluş için `memberHandle` sağlayın; işlem yapan yönetici üye olarak eklenmez.
`memberRole` varsayılan olarak `owner` değerini alır.

- Gövde: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Yanıt: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Kimliği doğrulanmış self servis kuruluş yayımcısı oluşturma. Yeni bir kuruluş yayımcısı oluşturur ve
çağıranı sahip olarak ekler. Bu uç nokta mevcut kullanıcı/kişisel tanıtıcıları taşımaz ve
yayımcıyı güvenilir/resmi olarak işaretlemez.

- Gövde: `{ "handle": "opik", "displayName": "Opik" }`
- Yanıt: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Tanıtıcı zaten bir yayımcı, kullanıcı veya kişisel yayımcı tarafından kullanılıyorsa `409` döndürür.

### `POST /api/v1/users/reserve`

Yalnızca yönetici. Hak sahibi için kök slug'ları ve paket adlarını bir sürüm yayımlamadan ayırır.
Paket adları, sürüm satırı olmayan özel yer tutucu paketlere dönüşür; böylece aynı sahip daha sonra
gerçek code-plugin veya bundle-plugin sürümünü o ada yayımlayabilir.

- Gövde: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Yanıt: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Yalnızca yönetici. Convex Auth hesap satırlarını düzenlemeden, doğrulanmış bir yedek GitHub OAuth principal'ı
için kişisel yayımcıyı kurtarır. İstek, her iki değişmez GitHub sağlayıcı hesap kimliğini de adlandırmalıdır;
değişebilir tanıtıcılar yalnızca operatöre dönük bir güvenlik denetimi olarak kullanılır.

Uç nokta varsayılan olarak dry-run modundadır. Kurtarmayı uygulamak için personel her iki
GitHub kimliği arasındaki sürekliliği bağımsız olarak doğruladıktan sonra `dryRun: false` ve
`confirmIdentityVerified: true` gerekir. Hedef kullanıcının mevcut kişisel yayıncısında
skills, paketler veya GitHub skill kaynakları varsa kurtarma kapalı hata verir.
Kurtarma ayrıca kurtarılan yayıncının skills, skill slug takma adları, paketleri, paket
denetleyicisi uyarıları ve türetilmiş arama özeti satırları için eski `ownerUserId`
alanlarını da taşır; böylece doğrudan sahip yolları yeni yayıncı yetkisiyle uyumlu olur.
Kurtarılan handle için etkin bir korumalı handle rezervasyonu da yedek kullanıcıya yeniden
atanır; böylece daha sonraki profil eşitlemesi eski kullanıcının rakip yetkisini geri
yükleyemez. Her birincil tablo uygulama işlemi başına 100 satırla sınırlıdır; daha büyük
kurtarmalar önce sürdürülebilir bir sahip taşıması kullanmalıdır. GitHub skill kaynakları
yayıncı kapsamındadır ve yeniden yazılmak yerine denetlenmiş olarak raporlanır.

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

### Sahiplik aktarma uç noktaları

- `POST /api/v1/skills/{slug}/transfer`
  - Gövde: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Yanıt: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Yanıt (accept/reject/cancel): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Yanıt biçimi: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Bir kullanıcıyı yasaklayın ve sahip olduğu skills öğelerini kalıcı olarak silin (yalnızca moderatör/admin).

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

Bir kullanıcının yasağını kaldırın ve uygun skills öğelerini geri yükleyin (yalnızca admin).

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

Mevcut bir yasağın saklanan nedenini, yasağı kaldırmadan veya içeriği geri yüklemeden
değiştirin (yalnızca admin). `dryRun`, `false` olmadığı sürece varsayılan olarak dry-run kullanır.

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

Bir kullanıcı rolünü değiştirin (yalnızca admin).

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

Kullanıcıları listeleyin veya arayın (yalnızca admin).

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

Bir yıldız ekleyin/kaldırın (öne çıkarmalar). Her iki uç nokta da idempotenttir.

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

`POST /api/cli/upload-url`, `uploadUrl` ve `uploadTicket` döndürür. ClawPack tarball
hazırlayan paket yayınları, sonuçtaki depolama kimliğini `clawpack` olarak ve döndürülen
bileti `clawpackUploadTicket` olarak göndermelidir.

## Kayıt keşfi (`/.well-known/clawhub.json`)

CLI, kayıt/kimlik doğrulama ayarlarını siteden keşfedebilir:

- `/.well-known/clawhub.json` (JSON, tercih edilen)
- `/.well-known/clawdhub.json` (eski)

Şema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Kendi barındırmanızı yapıyorsanız, bu dosyayı sunun (veya `CLAWHUB_REGISTRY` öğesini açıkça ayarlayın; eski `CLAWDHUB_REGISTRY`).

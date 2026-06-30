---
read_when:
    - Uç noktalar ekleme/değiştirme
    - CLI ↔ kayıt defteri isteklerinde hata ayıklama
summary: HTTP API başvurusu (herkese açık + CLI uç noktaları + kimlik doğrulama).
x-i18n:
    generated_at: "2026-06-30T22:29:57Z"
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
Eski `/api/...` ve `/api/cli/...` uyumluluk için kalır (bkz. `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Genel katalog yeniden kullanımı

Üçüncü taraf dizinler, ClawHub Skills'lerini listelemek veya aramak için herkese açık okuma uç noktalarını kullanabilir. Lütfen sonuçları önbelleğe alın, `429`/`Retry-After` değerlerine uyun, kullanıcıları kanonik ClawHub listesine (`https://clawhub.ai/<owner>/skills/<slug>`) geri bağlayın ve üçüncü taraf sitenin ClawHub tarafından onaylandığını ima etmekten kaçının. Gizli, özel veya moderasyon tarafından engellenmiş içeriği herkese açık API yüzeyinin dışında yansıtmaya çalışmayın.

Web slug kısayolları kayıt aileleri genelinde çözümlenir, ancak API istemcileri rota
önceliğini yeniden oluşturmak yerine okuma uç noktaları tarafından döndürülen
kanonik URL'leri kullanmalıdır.

## Hız sınırları

Zorlama modeli:

- Anonim istekler: IP başına uygulanır.
- Kimliği doğrulanmış istekler (geçerli Bearer belirteci): kullanıcı kovası başına uygulanır.
- Belirteç eksik/geçersizse davranış IP zorlamasına geri döner.
- Sunucu nedeni biliyorsa, kimliği doğrulanmış yazma uç noktaları yalın bir `Unauthorized`
  döndürmemelidir. Eksik belirteçler, geçersiz/iptal edilmiş belirteçler ve
  silinmiş/yasaklanmış/devre dışı bırakılmış hesapların her biri eyleme geçirilebilir metin almalıdır ki CLI
  istemcileri kullanıcılara onları neyin engellediğini söyleyebilsin.

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
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: mevcut olduğunda tam kalan bütçe.
  Parçalanmış başarılı istekler, yaklaşık bir küresel değer döndürmek yerine bu başlığı atlar.
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

- `Retry-After` varsa yeniden denemeden önce o kadar saniye bekleyin.
- Eşzamanlı yeniden denemelerden kaçınmak için jitter uygulanmış geri çekilme kullanın.
- `Retry-After` eksikse `RateLimit-Reset` değerine geri dönün (veya `X-RateLimit-Reset` üzerinden hesaplayın).

IP kaynağı:

- `cf-connecting-ip` dahil güvenilir istemci IP başlıklarını yalnızca dağıtım
  güvenilir iletilmiş başlıkları açıkça etkinleştirdiğinde kullanır.
- ClawHub, uçta istemci IP'lerini tanımlamak için güvenilir iletme başlıkları kullanır.
- Güvenilir istemci IP'si yoksa anonim istekler yalnızca hız sınırı türüyle
  kapsamlandırılmış yedek kovalara gider. Bu yedek kovalar, çağıran tarafından sağlanan
  yolları, slug'ları, paket adlarını, sürümleri, sorgu dizelerini veya diğer
  artefakt parametrelerini içermez.

## Hata yanıtları

Herkese açık v1 hata yanıtları `content-type: text/plain; charset=utf-8` ile düz metindir.
Buna doğrulama hataları (`400`), eksik herkese açık kaynaklar (`404`), kimlik doğrulama ve
izin hataları (`401`/`403`), hız sınırları (`429`) ve engellenen indirmeler dahildir. İstemciler
yanıt gövdesini insan tarafından okunabilir bir dize olarak okumalıdır. Bilinmeyen sorgu parametreleri
uyumluluk için yok sayılır, ancak geçersiz değerlere sahip tanınan sorgu parametreleri
`400` döndürür.

## Herkese açık uç noktalar (kimlik doğrulama yok)

### `GET /api/v1/search`

Sorgu parametreleri:

- `q` (zorunlu): sorgu dizesi
- `limit` (isteğe bağlı): tam sayı
- `highlightedOnly` (isteğe bağlı): öne çıkarılmış Skills'lere filtrelemek için `true`
- `nonSuspiciousOnly` (isteğe bağlı): şüpheli (`flagged.suspicious`) Skills'leri gizlemek için `true`
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

- Sonuçlar alaka sırasına göre döndürülür (gömme benzerliği + tam slug/ad belirteci artırmaları + küçük bir popülerlik önceliği).
- Alaka popülerlikten daha güçlüdür. Kesin bir slug veya görüntülenen ad belirteci eşleşmesi, çok daha güçlü etkileşime sahip daha gevşek bir eşleşmenin önüne geçebilir.
- ASCII metin sözcük ve noktalama sınırlarında belirteçlere ayrılır. Örneğin, `personal-map` bağımsız bir `map` belirteci içerirken `amap-jsapi-skill` `amap`, `jsapi` ve `skill` içerir; bu nedenle `map` araması `personal-map` için `amap-jsapi-skill`'den daha güçlü bir sözcüksel eşleşme verir.
- Popülerlik log ölçeklidir ve sınırlandırılmıştır. Yüksek etkileşimli Skills'ler, sorgu metni daha zayıf eşleştiğinde daha düşük sıralanabilir.
- Şüpheli veya gizli moderasyon durumu, çağıran filtrelerine ve mevcut moderasyon durumuna bağlı olarak bir Skills'i herkese açık aramadan kaldırabilir.

Yayıncı keşfedilebilirlik rehberi:

- Kullanıcıların kelimesi kelimesine arayacağı terimleri görüntülenen ada, özete ve etiketlere koyun. Bağımsız bir slug belirtecini yalnızca korumak istediğiniz kararlı bir kimlikse kullanın.
- Yeni slug daha iyi uzun vadeli kanonik ad değilse, yalnızca tek bir sorguyu yakalamak için slug'ı yeniden adlandırmayın. Eski slug'lar yönlendirme takma adlarına dönüşür, ancak kanonik URL, görüntülenen slug ve gelecekteki arama özetleri yeni slug'ı kullanır.
- Yeniden adlandırma takma adları eski URL'ler ve kayıt üzerinden çözümlenen kurulumlar için çözümlemeyi korur, ancak arama sıralaması yeniden adlandırma indekslendikten sonra kanonik Skills meta verilerine dayanır. Mevcut istatistikler Skills ile kalır.
- Bir Skills beklenmedik şekilde görünmezse, sıralamayla ilgili meta verileri değiştirmeden önce oturum açmışken `clawhub inspect @owner/slug` ile önce moderasyon durumunu kontrol edin.

### `GET /api/v1/skills`

Sorgu parametreleri:

- `limit` (isteğe bağlı): tam sayı (1-200)
- `cursor` (isteğe bağlı): `trending` dışındaki herhangi bir sıralama için sayfalama imleci
- `sort` (isteğe bağlı): `updated` (varsayılan), `recommended` (takma ad: `default`), `createdAt` (takma ad: `newest`), `downloads`, `stars` (takma ad: `rating`), eski kurulum takma adları `installsCurrent`/`installs`/`installsAllTime` `downloads` değerine eşlenir, `trending`
- `nonSuspiciousOnly` (isteğe bağlı): şüpheli (`flagged.suspicious`) Skills'leri gizlemek için `true`
- `nonSuspicious` (isteğe bağlı): `nonSuspiciousOnly` için eski takma ad

Geçersiz `sort` değerleri `400` döndürür.

Notlar:

- `recommended` etkileşim ve güncellik sinyallerini kullanır.
- `trending`, son 7 gündeki kurulumlara göre sıralar (telemetri tabanlı).
- `createdAt` yeni Skills taramaları için kararlıdır; `updated` mevcut Skills'ler yeniden yayınlandığında değişir.
- `nonSuspiciousOnly=true` olduğunda, imleç tabanlı sıralamalar bir sayfada `limit` öğeden daha az döndürebilir çünkü şüpheli Skills'ler sayfa alındıktan sonra filtrelenir.
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

- Sahip yeniden adlandırma/birleştirme akışlarıyla oluşturulan eski slug'lar kanonik Skills'e çözümlenir.
- `metadata.os`: Skills frontmatter'ında bildirilen OS kısıtlamaları (örn. `["macos"]`, `["linux"]`). Bildirilmemişse `null`.
- `metadata.systems`: Nix sistem hedefleri (örn. `["aarch64-darwin", "x86_64-linux"]`). Bildirilmemişse `null`.
- Skills'in platform meta verisi yoksa `metadata` `null` olur.
- `moderation` yalnızca Skills işaretlenmişse veya sahibi onu görüntülüyorsa dahil edilir.

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

- Sahipler ve moderatörler gizli Skills'ler için moderasyon ayrıntılarına erişebilir.
- Herkese açık çağıranlar yalnızca zaten işaretlenmiş görünür Skills'ler için `200` alır.
- Kanıt herkese açık çağıranlar için redakte edilir ve ham parçaları yalnızca sahipler/moderatörler için içerir.

### `POST /api/v1/skills/{slug}/report`

Bir Skills'i moderatör incelemesi için bildirin. Bildirimler Skills düzeyindedir, isteğe bağlı olarak
bir sürüme bağlanır ve Skills bildirim kuyruğunu besler.

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

Skills bildirim alımı için moderatör/yönetici uç noktası.

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

Skills bildirimlerini çözümlemek veya yeniden açmak için moderatör/yönetici uç noktası.

İstek:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note`, `confirmed` ve `dismissed` için zorunludur; `status` yeniden `open` olarak
ayarlanırken atlanabilir. Skills'i aynı denetlenebilir iş akışında gizlemek için triyajlanmış
bildirimle `finalAction: "hide"` geçirin.

### `GET /api/v1/skills/{slug}/versions`

Sorgu parametreleri:

- `limit` (isteğe bağlı): tam sayı
- `cursor` (isteğe bağlı): sayfalama imleci

### `GET /api/v1/skills/{slug}/versions/{version}`

Sürüm meta verilerini + dosya listesini döndürür.

- `version.security`, mevcut olduğunda normalize edilmiş tarama doğrulama durumunu ve tarayıcı ayrıntılarını
  (VirusTotal + LLM) içerir.

### `GET /api/v1/skills/{slug}/scan`

Bir Skills sürümü için güvenlik taraması doğrulama ayrıntılarını döndürür.

Sorgu parametreleri:

- `version` (isteğe bağlı): belirli sürüm dizesi.
- `tag` (isteğe bağlı): etiketlenmiş bir sürümü çözümle (örneğin `latest`).

Notlar:

- `version` veya `tag` sağlanmazsa en son sürümü kullanır.
- Normalleştirilmiş doğrulama durumunu ve tarayıcıya özgü ayrıntıları içerir.
- `security.hasScanResult` yalnızca bir tarayıcı kesin bir karar (`clean`, `suspicious` veya `malicious`) ürettiğinde `true` olur.
- `moderation`, en son sürümden türetilen geçerli Skills düzeyi moderasyon anlık görüntüsüdür.
- Geçmiş bir sürüm sorgulanırken, `moderation` ve `security` alanlarını aynı sürüm bağlamı olarak ele almadan önce `moderation.matchesRequestedVersion` ve `moderation.sourceVersion` değerlerini kontrol edin.

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

- Tarama isteği yükleri ve indirilebilir raporlar, saklama süresinden sonra tarama isteği deposundan sona erer.
- Yayımlanmış taramalar sahip/yayıncı yönetim erişimi veya platform moderatörü/yöneticisi yetkisi gerektirir.
- Yayımlanmış taramalar yalnızca `update: true` olduğunda ve tarama başarıyla tamamlandığında geri yazar.
- Yanıt, `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` ile birlikte `202` olur.
- Tarama işleri eşzamansızdır. Manuel tarama isteklerine normal yayımlama/geri doldurma işlerinden önce öncelik verilir, ancak tamamlanma yine de worker kullanılabilirliğine bağlıdır.

### `GET /api/v1/skills/-/scan/{scanId}`

Gönderilmiş bir tarama için kimlik doğrulamalı yoklama uç noktası.

- Kuyrukta/çalışıyor/başarılı/başarısız durumunu döndürür.
- Kuyruktayken `queue.queuedAhead` ve `queue.position` değerlerini döndürür, böylece istemciler isteğin önünde kaç öncelikli manuel tarama olduğunu gösterebilir. Çok büyük kuyruklar sınırlandırılır ve `queuedAheadIsEstimate: true` ile raporlanır.
- Varsa `report`, `clawscan`, `skillspector`, `staticAnalysis` ve `virustotal` bölümlerini içerir.
- Başarısız tarama işleri, `lastError` ile birlikte `status: "failed"` döndürür.

### `GET /api/v1/skills/-/scan/{scanId}/download`

Kimlik doğrulamalı rapor arşivi uç noktası.

- Başarılı bir tarama gerektirir; sonlanmamış taramalar `409` döndürür.
- `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` ve `README.md` içeren bir ZIP döndürür.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Gönderilmiş sürümler için kimlik doğrulamalı saklanmış rapor arşivi uç noktası.

- Skill veya Plugin için sahip/yayıncı yönetim erişimi ya da platform moderatörü/yöneticisi yetkisi gerektirir.
- Engellenmiş veya gizli sürümler dahil, tam gönderilmiş sürüm için saklanan tarama sonuçlarını döndürür.
- `kind` varsayılan olarak `skill` olur; plugin/paket taramaları için `kind=plugin` kullanın.
- Tarama isteği indirmeleriyle aynı ZIP biçimini döndürür.

### `POST /api/v1/skills/-/scan/batch`

Yalnızca yöneticilere açık kanonik toplu yeniden tarama rotası. Eski `POST /api/v1/skills/-/rescan-batch` ile aynı yük biçimini kabul eder.

### `POST /api/v1/skills/-/scan/batch/status`

Yalnızca yöneticilere açık kanonik toplu durum rotası. `{ "jobIds": ["..."] }` kabul eder ve eski `POST /api/v1/skills/-/rescan-batch/status` ile aynı toplu sayaçları döndürür.

### `GET /api/v1/skills/{slug}/verify`

`clawhub skill verify` tarafından kullanılan Skill Card doğrulama zarfını döndürür.

Sorgu parametreleri:

- `version` (isteğe bağlı): belirli sürüm dizgesi.
- `tag` (isteğe bağlı): etiketlenmiş bir sürümü çözer (örneğin `latest`).

Notlar:

- `ok` yalnızca seçilen sürümde oluşturulmuş bir Skill Card olduğunda, moderasyon tarafından kötü amaçlı yazılım nedeniyle engellenmediğinde ve ClawScan doğrulaması temiz olduğunda `true` olur.
- Skill kimliği, yayıncı kimliği ve seçilen sürüm meta verileri üst düzey zarf alanlarıdır (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`), böylece kabuk otomasyonu bunları iç içe sarmalayıcıları açmadan okuyabilir.
- `security`, üst düzey ClawScan/güvenlik kararıdır. Otomasyon `ok`, `decision`, `reasons` ve `security.status` değerlerini temel almalıdır.
- `security.signals`, `staticScan`, `virusTotal` ve `skillSpector` gibi destekleyici tarayıcı kanıtlarını içerir.
- `security.signals.dependencyRegistry`, v1 yanıt uyumluluğu için korunur, ancak bağımlılık kayıt defteri varlığı tarayıcısı kullanımdan kaldırılmıştır ve bu anahtar her zaman `null` olur.
- `provenance`, yalnızca ClawHub yayımlama veya içe aktarma sırasında bir GitHub repo/ref/commit/path çözüp sakladığında `server-resolved-github-import` olur; aksi halde `unavailable` olur.

### `POST /api/v1/skills/-/security-verdicts`

Tam Skill sürümleri için geçerli kompakt güvenlik kararlarını döndürür. Bu koleksiyon uç noktası, OpenClaw Control UI gibi, hangi yüklü ClawHub Skill sürümlerini görüntülemeleri gerektiğini zaten bilen istemciler için tasarlanmıştır.

İstek:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

Notlar:

- `items`, 1-100 benzersiz `{ slug, version }` çifti içermelidir.
- Sonuçlar öğe başınadır; eksik bir Skill veya sürüm tüm yanıtı başarısız yapmaz.
- Yanıt yalnızca güvenlikle ilgilidir. Skill Card verilerini, oluşturulmuş kart durumunu, artifact dosya listelerini veya ayrıntılı tarayıcı yüklerini içermez.
- `security.signals` yalnızca durum düzeyinde destekleyici kanıt içerir; tam tarayıcı ayrıntıları için `/scan` veya ClawHub security-audit sayfasını kullanın.
- `security.signals.dependencyRegistry`, v1 yanıt uyumluluğu için korunur, ancak bağımlılık kayıt defteri varlığı tarayıcısı kullanımdan kaldırılmıştır ve bu anahtar her zaman `null` olur.
- Skill Card yokluğu, bu uç noktanın `ok`, `decision` veya `reasons` değerlerini etkilemez; istemciler kart içeriğine ihtiyaç duyduğunda yüklü `skill-card.md` dosyasını yerel olarak okumalıdır.
- Tek Skill için Skill Card doğrulama zarfına ihtiyaç duyduğunuzda `/verify`, oluşturulmuş kart Markdown'ına ihtiyaç duyduğunuzda `/card` ve ayrıntılı tarayıcı verilerine ihtiyaç duyduğunuzda `/scan` kullanın.

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

- `limit` (isteğe bağlı): tam sayı (1–100)
- `cursor` (isteğe bağlı): sayfalama imleci
- `family` (isteğe bağlı): `skill`, `code-plugin` veya `bundle-plugin`
- `channel` (isteğe bağlı): `official`, `community` veya `private`
- `isOfficial` (isteğe bağlı): `true` veya `false`
- `sort` (isteğe bağlı): `updated` (varsayılan), `recommended`, `trending`, `downloads`, eski takma ad `installs`
- `category` (isteğe bağlı): Plugin kategori filtresi. Yalnızca istek
  Plugin paketleriyle sınırlandırıldığında desteklenir (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins` veya
  `family=code-plugin`/`family=bundle-plugin` içeren paket uç noktaları).
  Denetimli kategoriler ve eski v1 filtre takma adları `GET /api/v1/plugins`
  altında belgelenmiştir.

Notlar:

- `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly` veya `sort` için geçersiz değerler `400` döndürür. Bilinmeyen sorgu parametreleri yok sayılır.
- `GET /api/v1/code-plugins` ve `GET /api/v1/bundle-plugins` sabit aile takma adları olarak kalır.
- Skill girdileri skill kayıt defteri tarafından desteklenmeye devam eder ve hâlâ yalnızca `POST /api/v1/skills` üzerinden yayımlanabilir.
- `POST /api/v1/packages` hâlâ yalnızca code-plugin ve bundle-plugin sürümleri içindir.
- Anonim çağıranlar yalnızca herkese açık paket kanallarını görür.
- Kimliği doğrulanmış çağıranlar, liste/arama sonuçlarında üyesi oldukları yayıncılara ait özel paketleri görebilir.
- `channel=private` yalnızca kimliği doğrulanmış çağıranın okuyabildiği paketleri döndürür.

### `GET /api/v1/packages/search`

Skills + Plugin paketleri genelinde birleşik katalog araması.

Sorgu parametreleri:

- `q` (gerekli): sorgu dizesi
- `limit` (isteğe bağlı): tam sayı (1–100)
- `family` (isteğe bağlı): `skill`, `code-plugin` veya `bundle-plugin`
- `channel` (isteğe bağlı): `official`, `community` veya `private`
- `isOfficial` (isteğe bağlı): `true` veya `false`
- `category` (isteğe bağlı): Plugin kategori filtresi. Yalnızca istek
  Plugin paketleriyle sınırlandırıldığında desteklenir. Denetimli kategoriler
  ve eski v1 filtre takma adları `GET /api/v1/plugins` altında belgelenmiştir.

Notlar:

- `family`, `channel`, `isOfficial`, `featured` veya
  `highlightedOnly` için geçersiz değerler `400` döndürür. Bilinmeyen sorgu parametreleri yok sayılır.
- Anonim çağıranlar yalnızca herkese açık paket kanallarını görür.
- Kimliği doğrulanmış çağıranlar, üyesi oldukları yayıncılara ait özel paketlerde arama yapabilir.
- `channel=private` yalnızca kimliği doğrulanmış çağıranın okuyabildiği paketleri döndürür.

### `GET /api/v1/plugins`

Code-plugin ve bundle-plugin paketleri genelinde yalnızca Plugin katalog gezintisi.

Sorgu parametreleri:

- `limit` (isteğe bağlı): tam sayı (1-100)
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

`trending`, yedi günlük kurulum/indirme lider tablosudur ve tüm zamanların toplamlarını kullanmaz.
Birleşik `/api/v1/packages` uç noktasında yalnızca Plugin içindir; skill kataloğu için
`/api/v1/skills?sort=trending` kullanın.

Eski takma adlar, saklanan veya yazar tarafından bildirilen kategori değerleri olarak kabul edilmez.

### `GET /api/v1/skills/export`

Çevrimdışı analiz için en son herkese açık skills toplu dışa aktarımı.

Kimlik doğrulama:

- API belirteci gerekli.

Sorgu parametreleri:

- `startDate` (gerekli): skill `updatedAt` için Unix milisaniye alt sınırı.
- `endDate` (gerekli): skill `updatedAt` için Unix milisaniye üst sınırı.
- `limit` (isteğe bağlı): tam sayı (1-250), varsayılan `250`.
- `cursor` (isteğe bağlı): önceki yanıttan sayfalama imleci.

Yanıt:

- Gövde: ZIP arşivi.
- Dışa aktarılan her skill `{publisher}/{slug}/` kökünde yer alır.
- Barındırılan skills, en son saklanan sürüm dosyalarını içerir ve
  `_manifest.json` içinde `sourceRef: "public-clawhub"` ile listelenir.
- `clean` veya `suspicious` taraması olan mevcut GitHub destekli skills,
  `sourceRef: "public-github"`, depo, commit, path,
  içerik hash'i ve arşiv URL'si ile `_source_handoff.json` içerir. ClawHub tarafından barındırılan kaynak dosyalarını içermezler.
- Her skill `_export_skill_meta.json` içerir.
- `_manifest.json` her zaman ZIP kökünde bulunur.
- Tek tek skills veya dosyalar dışa aktarılamadığında `_errors.json` dahil edilir.

Üstbilgiler:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

Çevrimdışı analiz için en son genel Plugin sürümlerinin toplu dışa aktarımı.

Kimlik doğrulama:

- API belirteci gerekir.

Sorgu parametreleri:

- `startDate` (zorunlu): Plugin `updatedAt` için Unix milisaniye alt sınırı.
- `endDate` (zorunlu): Plugin `updatedAt` için Unix milisaniye üst sınırı.
- `limit` (isteğe bağlı): tamsayı (1-250), varsayılan `250`.
- `cursor` (isteğe bağlı): önceki yanıttan sayfalama imleci.
- `family` (isteğe bağlı): `code-plugin` veya `bundle-plugin`. Atlanırsa her iki
  Plugin ailesi anlamına gelir.

Yanıt:

- Gövde: ZIP arşivi.
- Dışa aktarılan her Plugin `{family}/{packageName}/` kökünde yer alır.
- Dışa aktarılan her Plugin, en son sürümün depolanan dosyalarını içerir.
- Plugin başına dışa aktarma meta verileri
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` konumunda saklanır.
- `_manifest.json` her zaman ZIP kökünde yer alır.
- Tek tek Pluginler veya dosyalar dışa aktarılamadığında `_errors.json`
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
- `limit` (isteğe bağlı): tamsayı (1-100)
- `isOfficial` (isteğe bağlı): `true` veya `false`
- `category` (isteğe bağlı): Plugin kategori filtresi. Geçerli değerler:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Notlar:

- `GET /api/v1/plugins` altında belgelenen eski v1 filtre takma adları da
  kabul edilir.
- Kategori filtreleme, arama sorgusu yeniden yazımı değil, Plugin kategori özet
  satırlarıyla desteklenen gerçek bir API filtresidir.
- Sonuçlar alaka düzeyine göre döndürülür ve şu anda sayfalanmaz.
- Plugin araması için tarayıcı arayüzü sıralama denetimleri, yüklenen alaka
  sonuçlarını yeniden sıralar ve geçerli `/skills` göz atma davranışıyla eşleşir.

### `GET /api/v1/packages/{name}`

Paket ayrıntı meta verilerini döndürür.

Notlar:

- Skills, birleşik katalogda bu rota üzerinden de çözümlenebilir.
- Özel paketler, çağıran sahip yayıncıyı okuyamıyorsa `404` döndürür.

### `DELETE /api/v1/packages/{name}`

Bir paketi ve tüm sürümlerini geçici olarak siler.

Notlar:

- Paket sahibi, kuruluş yayıncı sahibi/yöneticisi, platform moderatörü veya
  platform yöneticisi için API belirteci gerektirir.

### `GET /api/v1/packages/{name}/versions`

Sürüm geçmişini döndürür.

Sorgu parametreleri:

- `limit` (isteğe bağlı): tamsayı (1–100)
- `cursor` (isteğe bağlı): sayfalama imleci

Notlar:

- Özel paketler, çağıran sahip yayıncıyı okuyamıyorsa `404` döndürür.

### `GET /api/v1/packages/{name}/versions/{version}`

Dosya meta verileri, uyumluluk, doğrulama, yapıt meta verileri ve tarama
verileri dahil olmak üzere bir paket sürümünü döndürür.

Notlar:

- `version.artifact.kind`, eski dünya paket arşivleri için `legacy-zip` veya
  ClawPack destekli sürümler için `npm-pack` olur.
- ClawPack sürümleri npm uyumlu `npmIntegrity`, `npmShasum` ve
  `npmTarballName` alanlarını içerir.
- `version.sha256hash`, eski istemciler için kullanımdan kaldırılmış uyumluluk
  meta verisidir. `/api/v1/packages/{name}/download` tarafından döndürülen tam
  ZIP baytlarını hashler. Modern istemciler, kanonik sürüm yapıtını tanımlayan
  `version.artifact.sha256` değerini kullanmalıdır.
- `version.vtAnalysis`, `version.llmAnalysis` ve `version.staticScan`, tarama
  verileri mevcut olduğunda dahil edilir.
- Özel paketler, çağıran sahip yayıncıyı okuyamıyorsa `404` döndürür.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Kurulum istemcileri için tam paket sürümü güvenlik ve güven özeti döndürür. Bu,
çözümlenen bir sürümün kurulup kurulamayacağına karar vermek için genel OpenClaw
tüketim yüzeyidir.

Kimlik doğrulama:

- Genel okuma uç noktası. Sahip, yayıncı, moderatör veya yönetici belirteci
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

- `package.name`, `package.displayName` ve `package.family`, çözümlenen kayıt
  paketini tanımlar.
- `release.releaseId`, `release.version` ve `release.createdAt`,
  değerlendirilen tam sürümü tanımlar.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` ve `release.npmTarballName`, sürüm yapıtı için bilindiğinde
  bulunur.
- `trust.scanStatus`, tarayıcı girdilerinden ve manuel sürüm moderasyonundan
  türetilen etkin güven durumudur.
- `trust.moderationState` null atanabilir. Manuel sürüm moderasyonu yoksa `null`
  olur.
- `trust.blockedFromDownload`, kurulum engelleme sinyalidir. OpenClaw ve diğer
  kurulum istemcileri, tarayıcı veya moderasyon alanlarından engelleme
  kurallarını yeniden türetmek yerine bu değer `true` olduğunda kurulumu
  engellemelidir.
- `trust.reasons`, kullanıcıya gösterilen ve denetim açıklama listesidir. Neden
  kodları `manual:quarantined`, `scan:malicious` ve `package:malicious` gibi
  kararlı, kompakt dizelerdir.
- `trust.pending`, bir veya daha fazla güven girdisinin hâlâ tamamlanmayı
  beklediği anlamına gelir.
- `trust.stale`, güven özetinin güncel olmayan girdilerden hesaplandığı ve yüksek
  güvenli bir izin kararından önce yenileme gerektiriyor gibi ele alınması
  gerektiği anlamına gelir.

Notlar:

- Bu uç nokta sürüm açısından kesindir. İstemciler, yalnızca en son paket meta
  verilerini okuduktan sonra değil, kurmayı amaçladıkları paket sürümünü
  çözümlendikten sonra bunu çağırmalıdır.
- Özel paketler, çağıran sahip yayıncıyı okuyamıyorsa `404` döndürür.
- Bu uç nokta, sahip/moderatör moderasyon uç noktalarından kasıtlı olarak daha
  dardır. Bildiren kimlikleri, rapor gövdeleri, özel kanıtlar veya dahili
  inceleme zaman çizelgeleri yerine kurulum kararını ve genel açıklamayı
  açığa çıkarır.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Bir paket sürümü için açık yapıt çözümleyici meta verilerini döndürür.

Notlar:

- Eski paket sürümleri bir `legacy-zip` yapıtı ve eski ZIP `downloadUrl`
  döndürür.
- ClawPack sürümleri bir `npm-pack` yapıtı, npm bütünlük alanları, bir
  `tarballUrl` ve eski ZIP uyumluluk URL'si döndürür.
- Bu, OpenClaw çözümleyici yüzeyidir; paylaşılan bir URL'den arşiv biçimini
  tahmin etmekten kaçınır.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Açık çözümleyici yolu üzerinden sürüm yapıtını indirir.

Notlar:

- ClawPack sürümleri, yüklenen tam npm-pack `.tgz` baytlarını akışla aktarır.
- Eski ZIP sürümleri `/api/v1/packages/{name}/download?version=` adresine
  yönlendirir.
- İndirme hız kovasını kullanır.

### `GET /api/v1/packages/{name}/readiness`

Gelecekteki OpenClaw tüketimi için hesaplanan hazırlığı döndürür.

Hazırlık denetimleri şunları kapsar:

- resmi kanal durumu
- en son sürüm kullanılabilirliği
- ClawPack npm-pack yapıt kullanılabilirliği
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
- `limit` (isteğe bağlı): tamsayı (1-100)
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
- Bu yalnızca geçiş hazırlığını izler. OpenClaw'ı değiştirmez veya ClawPack
  üretmez.

### `GET /api/v1/packages/moderation/queue`

Paket sürümü inceleme kuyrukları için moderatör/yönetici uç noktası.

Kimlik doğrulama:

- Moderatör veya yönetici kullanıcı için API belirteci gerektirir.

Sorgu parametreleri:

- `status` (isteğe bağlı): `open` (varsayılan), `blocked`, `manual` veya `all`
- `limit` (isteğe bağlı): tamsayı (1-100)
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
isteğe bağlı olarak bir sürüme bağlanır. Moderasyon kuyruğunu beslerler ancak
indirmeleri kendiliğinden otomatik olarak gizlemez veya engellemezler;
moderatörler yapıtları onaylamak, karantinaya almak veya iptal etmek için sürüm
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

Moderatör/yönetici paket raporu alımı uç noktası.

Kimlik doğrulama:

- Moderatör veya yönetici kullanıcı için API token’ı gerektirir.

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

- Paket sahibi, yayıncı üyesi, moderatör veya yönetici kullanıcı için API
  token’ı gerektirir.

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

`note`, `confirmed` ve `dismissed` için gereklidir; `status` tekrar `open`
olarak ayarlanırken atlanabilir. Aynı denetlenebilir iş akışında sürüm
moderasyonu uygulamak için onaylanmış bir raporla `finalAction: "quarantine"`
veya `finalAction: "revoke"` geçirin.

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
- `quarantined`: takip beklerken engellenmiş.
- `revoked`: bir sürüm daha önce güvenilir kabul edildikten sonra engellenmiş.

Karantinaya alınan ve iptal edilen sürümler, artefakt indirme rotalarından `403` döndürür.
Her değişiklik bir denetim günlüğü kaydı yazar.

### `GET /api/v1/packages/{name}/file`

Bir paket dosyası için ham metin içeriği döndürür.

Sorgu parametreleri:

- `path` (gerekli)
- `version` (isteğe bağlı)
- `tag` (isteğe bağlı)

Notlar:

- Varsayılan olarak en son sürümü kullanır.
- İndirme kovasını değil, okuma hız kovasını kullanır.
- İkili dosyalar `415` döndürür.
- Dosya boyutu sınırı: 200KB.
- Bekleyen VirusTotal taramaları okumaları engellemez; kötü amaçlı sürümler başka yerlerde yine de alıkonabilir.
- Özel paketler, çağıran sahip yayıncıyı okuyamıyorsa `404` döndürür.

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
- Bu rota yalnızca ZIP olarak kalır. ClawPack `.tgz` dosyalarını akıtmaz.
- Yanıtlar, çözümleyici bütünlük denetimleri için `ETag`, `Digest`,
  `X-ClawHub-Artifact-Type` ve `X-ClawHub-Artifact-Sha256` üstbilgilerini içerir.
- Yalnızca kayıt defterine ait meta veriler indirilen arşive enjekte edilmez.
- Bekleyen VirusTotal taramaları indirmeleri engellemez; kötü amaçlı sürümler `403` döndürür.
- Özel paketler, çağıran sahip değilse `404` döndürür.

### `GET /api/npm/{package}`

ClawPack destekli paket sürümleri için npm uyumlu bir packument döndürür.

Notlar:

- Yalnızca yüklenmiş ClawPack npm-pack tarball’larına sahip sürümler listelenir.
- Eski yalnızca ZIP sürümleri bilerek atlanır.
- `dist.tarball`, `dist.integrity` ve `dist.shasum`, kullanıcılar isterse npm’i
  aynaya yönlendirebilsin diye npm uyumlu alanlar kullanır.
- Kapsamlı paket packument’ları hem `/api/npm/@scope/name` hem de npm’in
  kodlanmış `/api/npm/@scope%2Fname` istek yolunu destekler.

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm ayna istemcileri için yüklenen ClawPack tarball baytlarını aynen akıtır.

Notlar:

- İndirme hız kovasını kullanır.
- İndirme üstbilgileri ClawHub SHA-256 ile npm integrity/shasum meta verilerini içerir.
- Moderasyon ve özel paket erişim denetimleri hâlâ geçerlidir.

### `GET /api/v1/resolve`

CLI tarafından yerel parmak izini bilinen bir sürümle eşlemek için kullanılır.

Sorgu parametreleri:

- `slug` (gerekli)
- `hash` (gerekli): paket parmak izinin 64 karakterlik hex sha256 değeri

Yanıt:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Barındırılan bir skill sürümü ZIP’ini indirir ya da `clean` veya `suspicious`
taramasına sahip ve barındırılan sürümü olmayan mevcut GitHub destekli bir skill
için GitHub kaynak devri döndürür.

Sorgu parametreleri:

- `slug` (gerekli)
- `version` (isteğe bağlı): semver dizesi
- `tag` (isteğe bağlı): etiket adı (örn. `latest`)

Notlar:

- Ne `version` ne de `tag` sağlanırsa en son sürüm kullanılır.
- Geçici olarak silinen sürümler `410` döndürür.
- GitHub destekli skill devirleri baytları proxy’lemez veya aynalamaz. JSON yanıtı
  `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash` ve
  `archiveUrl` içerir; tarama/mevcut durum bir kapıdır ve başarı yükü meta
  verisi olarak dahil edilmez.
- İndirme istatistikleri UTC günü başına benzersiz kimlikler olarak sayılır (API token’ı geçerliyse `userId`, aksi halde IP).

## Kimlik doğrulama uç noktaları (Bearer token)

Tüm uç noktalar şunu gerektirir:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Token’ı doğrular ve kullanıcı handle’ını döndürür.

### `POST /api/v1/skills`

Yeni bir sürüm yayınlar.

- Tercih edilen: `payload` JSON + `files[]` blob’ları ile `multipart/form-data`.
- `files` (storageId tabanlı) içeren JSON gövdesi de kabul edilir.
- İsteğe bağlı payload alanı: `ownerHandle`. Mevcut olduğunda API bu
  yayıncıyı sunucu tarafında çözümler ve aktörün yayıncı erişimine sahip olmasını gerektirir.
- İsteğe bağlı payload alanı: `migrateOwner`. `ownerHandle` ile `true` olduğunda,
  aktör hem mevcut hem de hedef yayıncılarda yönetici/sahip ise mevcut bir skill
  o sahibe taşınabilir. Bu açık onay olmadan sahip değişiklikleri reddedilir.

### `POST /api/v1/packages`

Bir code-plugin veya bundle-plugin sürümü yayınlar.

- Bearer token kimlik doğrulaması gerektirir.
- `multipart/form-data` gerektirir.
- İzin verilen form alanları `payload`, yinelenen `files` blob’ları veya tek bir
  `clawpack` tarball referansıdır. `clawpack`, bir `.tgz` blob’u veya upload-url
  akışı tarafından döndürülen bir storage id olabilir. Aşamalandırılmış storage-id
  yayınları, o yükleme URL’siyle döndürülen `clawpackUploadTicket` değerini de içermelidir.
- Aynı istekte asla ikisini birden değil, `files` veya `clawpack` kullanın.
- JSON gövdeleri ve çağıran tarafından sağlanan `payload.files` / `payload.artifact`
  meta verileri reddedilir.
- Doğrudan multipart yayın istekleri 18MB ile sınırlıdır. ClawPack tarball’ları,
  120MB tarball sınırına kadar upload-url akışını kullanabilir.
- İsteğe bağlı payload alanı: `ownerHandle`. Mevcut olduğunda, yalnızca yöneticiler o sahip adına yayın yapabilir.

Doğrulama öne çıkanları:

- `family`, `code-plugin` veya `bundle-plugin` olmalıdır.
- Plugin paketleri `openclaw.plugin.json` gerektirir. ClawPack `.tgz` yüklemeleri
  bunu `package/openclaw.plugin.json` konumunda içermelidir.
- Kod Pluginleri `package.json`, kaynak repo meta verileri, kaynak commit meta
  verileri, yapılandırma şeması meta verileri, `openclaw.compat.pluginApi` ve
  `openclaw.build.openclawVersion` gerektirir.
- `openclaw.hostTargets` ve `openclaw.environment` isteğe bağlı meta verilerdir.
- Yalnızca `openclaw` kuruluş yayıncısı ve mevcut `openclaw` kuruluş üyelerinin
  kişisel yayıncıları `official` kanalına yayın yapabilir.
- Başkası adına yapılan yayınlar, resmi kanal uygunluğunu hedef sahip hesabına göre yine de doğrular.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Bir skill’i geçici olarak siler / geri yükler (sahip, moderatör veya yönetici).

İsteğe bağlı JSON gövdesi:

```json
{ "reason": "Held for moderation pending legal review." }
```

Mevcut olduğunda `reason`, skill moderasyon notu olarak saklanır ve denetim günlüğüne kopyalanır.
Sahip tarafından başlatılan geçici silmeler slug’ı 30 gün boyunca ayırır; ardından slug başka
bir yayıncı tarafından alınabilir. Silme yanıtı, bu sürenin geçerli olduğu durumlarda `slugReservedUntil` içerir.
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
- `500`: dahili sunucu hatası

### `POST /api/v1/users/publisher`

Yalnızca yönetici. Bir handle için kuruluş yayıncısının var olmasını sağlar. Handle hâlâ eski
paylaşılan kullanıcı/kişisel yayıncıya işaret ediyorsa uç nokta önce bunu bir kuruluş yayıncısına taşır.
Yeni oluşturulan bir kuruluş için `memberHandle` sağlayın; işlemi yapan yönetici üye olarak eklenmez.
`memberRole` varsayılan olarak `owner` olur.

- Gövde: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Yanıt: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Kimliği doğrulanmış self-servis kuruluş yayıncısı oluşturma. Yeni bir kuruluş yayıncısı oluşturur ve
çağıranı sahip olarak ekler. Bu uç nokta mevcut kullanıcı/kişisel handle’ları taşımaz ve
yayıncıyı güvenilir/resmi olarak işaretlemez.

- Gövde: `{ "handle": "opik", "displayName": "Opik" }`
- Yanıt: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- Handle zaten bir yayıncı, kullanıcı veya kişisel yayıncı tarafından kullanılıyorsa `409` döndürür.

### `POST /api/v1/users/reserve`

Yalnızca yönetici. Hak sahibi için kök slug’ları ve paket adlarını sürüm yayınlamadan ayırır.
Paket adları, sürüm satırları olmayan özel yer tutucu paketlere dönüşür; böylece aynı
sahip daha sonra gerçek code-plugin veya bundle-plugin sürümünü o ad altında yayınlayabilir.

- Gövde: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Yanıt: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Yalnızca yönetici. Convex Auth hesap satırlarını düzenlemeden, doğrulanmış bir yedek GitHub OAuth principal’ı
için kişisel yayıncıyı kurtarır. İstek, her iki değişmez GitHub sağlayıcı hesap kimliğini adlandırmalıdır;
değiştirilebilir handle’lar yalnızca operatöre yönelik bir koruma olarak kullanılır.

Uç nokta varsayılan olarak dry-run kullanır. Kurtarmayı uygulamak için personel her iki
GitHub kimliği arasındaki sürekliliği bağımsız olarak doğruladıktan sonra `dryRun: false` ve
`confirmIdentityVerified: true` gerekir. Hedef kullanıcının mevcut kişisel
yayımcısında skills, paketler veya GitHub skill kaynakları varsa kurtarma kapalı şekilde başarısız olur.
Kurtarma ayrıca, kurtarılan yayımcının skills, skill slug diğer adları, paketleri, paket denetleyici uyarıları ve türetilmiş arama özeti satırları için eski `ownerUserId` alanlarını da taşır; böylece doğrudan sahip yolları yeni yayımcı yetkisiyle uyumlu olur. Kurtarılan handle için etkin bir korumalı handle rezervasyonu da yedek kullanıcıya yeniden atanır; böylece sonraki profil senkronizasyonu önceki kullanıcının rakip yetkisini geri yükleyemez. Her birincil tablo, uygulama işlemi başına
100 satırla sınırlıdır; daha büyük kurtarmalar önce sürdürülebilir bir sahip migrasyonu kullanmalıdır.
GitHub skill kaynakları yayımcı kapsamındadır ve yeniden yazılmak yerine denetlenmiş olarak raporlanır.

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
- `rename`, önceki slug'ı yönlendirme diğer adı olarak korur.
- `merge`, kaynak listelemeyi gizler ve kaynak slug'ı hedef listelemeye yönlendirir.

### Sahipliği aktarma uç noktaları

- `POST /api/v1/skills/{slug}/transfer`
  - Gövde: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Yanıt: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Yanıt (accept/reject/cancel): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Yanıt şekli: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Bir kullanıcıyı yasaklayın ve sahip olduğu skills'i kalıcı olarak silin (yalnızca moderator/admin).

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

Bir kullanıcının yasağını kaldırın ve uygun skills'i geri yükleyin (yalnızca admin).

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

Mevcut bir yasaklamanın depolanan nedenini, yasağı kaldırmadan veya
içeriği geri yüklemeden değiştirin (yalnızca admin). `dryRun`, `false` olmadığı sürece varsayılan olarak dry-run kullanır.

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
- `query` (isteğe bağlı): `q` için diğer ad
- `limit` (isteğe bağlı): maksimum sonuç sayısı (varsayılan 20, maksimum 200)

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

Bir yıldız ekleyin/kaldırın (öne çıkarır). Her iki uç nokta da idempotenttir.

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

`POST /api/cli/upload-url`, `uploadUrl` ve `uploadTicket` döndürür. Bir ClawPack tarball'ını aşamalandıran paket
yayınları, ortaya çıkan depolama kimliğini `clawpack` olarak ve döndürülen bileti `clawpackUploadTicket` olarak göndermelidir.

## Registry keşfi (`/.well-known/clawhub.json`)

CLI, registry/kimlik doğrulama ayarlarını siteden keşfedebilir:

- `/.well-known/clawhub.json` (JSON, tercih edilir)
- `/.well-known/clawdhub.json` (eski)

Şema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Kendiniz barındırıyorsanız bu dosyayı sunun (veya `CLAWHUB_REGISTRY` değerini açıkça ayarlayın; eski `CLAWDHUB_REGISTRY`).

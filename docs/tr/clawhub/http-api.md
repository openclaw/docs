---
read_when:
    - Uç nokta ekleme/değiştirme
    - CLI ↔ kayıt defteri isteklerinde hata ayıklama
summary: HTTP API referansı (herkese açık + CLI uç noktaları + kimlik doğrulama).
x-i18n:
    generated_at: "2026-05-11T22:19:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c217e56a38d697d8cc6e1c7f0c6481fd762ecbadcf5629964c1f49781d5405b
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

Temel URL: `https://clawhub.ai` (varsayılan).

Tüm v1 yolları `/api/v1/...` altındadır.
Eski `/api/...` ve `/api/cli/...` uyumluluk için kalır (bkz. `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Herkese açık katalog yeniden kullanımı

Üçüncü taraf dizinleri, ClawHub becerilerini listelemek veya aramak için herkese açık okuma uç noktalarını kullanabilir. Lütfen sonuçları önbelleğe alın, `429`/`Retry-After` değerlerine uyun, kullanıcıları kanonik ClawHub listelemesine (`https://clawhub.ai/<owner>/<slug>`) geri yönlendirin ve ClawHub'ın üçüncü taraf siteyi onayladığını ima etmekten kaçının. Gizli, özel veya moderasyon tarafından engellenmiş içeriği herkese açık API yüzeyi dışında yansıtmaya çalışmayın.

Web slug kısayolları kayıt aileleri arasında çözümlenir, ancak API istemcileri rota
önceliğini yeniden oluşturmak yerine okuma uç noktalarının döndürdüğü kanonik
URL'leri kullanmalıdır.

## Hız limitleri

Uygulama modeli:

- Anonim istekler: IP başına uygulanır.
- Kimliği doğrulanmış istekler (geçerli Bearer token): kullanıcı kovası başına uygulanır.
- Token eksik/geçersizse, davranış IP uygulamasına geri döner.
- Kimliği doğrulanmış yazma uç noktaları, sunucu nedeni biliyorken yalın bir `Unauthorized`
  döndürmemelidir. Eksik token'lar, geçersiz/iptal edilmiş token'lar ve
  silinmiş/yasaklanmış/devre dışı bırakılmış hesapların her biri, CLI
  istemcilerinin kullanıcılara onları neyin engellediğini söyleyebilmesi için eyleme geçirilebilir metin almalıdır.

- Okuma: IP başına 600/dk, anahtar başına 2400/dk
- Yazma: IP başına 45/dk, anahtar başına 180/dk
- İndirme: IP başına 30/dk, anahtar başına 180/dk (`/api/v1/download`)

Başlıklar:

- Eski uyumluluk: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Standartlaştırılmış: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- `429` durumunda: `Retry-After`

Başlık anlamları:

- `X-RateLimit-Reset`: mutlak Unix epoch saniyeleri
- `RateLimit-Reset`: sıfırlamaya kadar saniye (gecikme)
- `Retry-After`: yeniden denemeden önce beklenecek saniye (gecikme), `429` durumunda

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

İstemci yönergeleri:

- `Retry-After` varsa, yeniden denemeden önce belirtilen kadar saniye bekleyin.
- Eşzamanlı yeniden denemeleri önlemek için jitter uygulanmış backoff kullanın.
- `Retry-After` eksikse, `RateLimit-Reset` değerine geri dönün (veya `X-RateLimit-Reset` üzerinden hesaplayın).

IP kaynağı:

- Varsayılan olarak istemci IP'si için `cf-connecting-ip` (Cloudflare) kullanır.
- ClawHub, uçta istemci IP'lerini tanımlamak için güvenilir yönlendirme başlıklarını kullanır.
- Güvenilir istemci IP'si yoksa, anonim indirme istekleri tek bir genel `ip:unknown` kovası yerine uç noktaya kapsamlanmış bir yedek kova kullanır. Anonim okuma/yazma istekleri hâlâ paylaşılan bilinmeyen kovayı kullanır; böylece eksik IP yönlendirmesi görünür ve ihtiyatlı kalır.

## Herkese açık uç noktalar (kimlik doğrulama yok)

### `GET /api/v1/search`

Sorgu parametreleri:

- `q` (gerekli): sorgu dizesi
- `limit` (isteğe bağlı): tam sayı
- `highlightedOnly` (isteğe bağlı): vurgulanan becerilere filtrelemek için `true`
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
      "updatedAt": 1730000000000
    }
  ]
}
```

Notlar:

- Sonuçlar alaka sırasına göre döndürülür (gömme benzerliği + tam slug/ad token artırımları + indirmelerden gelen popülerlik önceliği).
- Alaka, popülerlikten daha güçlüdür. Kesin bir slug veya görünen ad token eşleşmesi, çok daha fazla indirmeye sahip daha gevşek bir eşleşmenin önüne geçebilir.
- ASCII metin, sözcük ve noktalama sınırlarında token'lara ayrılır. Örneğin `personal-map` bağımsız bir `map` token'ı içerirken, `amap-jsapi-skill` `amap`, `jsapi` ve `skill` içerir; bu nedenle `map` araması `personal-map` için `amap-jsapi-skill` değerine göre daha güçlü bir sözcüksel eşleşme verir.
- İndirmeler birincil sıralama sinyali olarak değil, küçük log ölçekli bir öncelik ve eşitlik bozucu olarak kullanılır. Sorgu metni daha zayıf eşleştiğinde yüksek indirmeli beceriler daha alt sırada yer alabilir.
- Şüpheli veya gizli moderasyon durumu, çağıran filtrelerine ve mevcut moderasyon durumuna bağlı olarak bir beceriyi herkese açık aramadan kaldırabilir.

Yayıncı bulunabilirlik yönergeleri:

- Kullanıcıların kelimenin tam anlamıyla arayacağı terimleri görünen ada, özete ve etiketlere koyun. Bağımsız bir slug token'ını yalnızca aynı zamanda korumak istediğiniz kararlı bir kimlikse kullanın.
- Yeni slug daha iyi uzun vadeli kanonik ad olmadığı sürece, yalnızca tek bir sorguyu hedeflemek için slug adını değiştirmeyin. Eski slug'lar yönlendirme takma adlarına dönüşür, ancak kanonik URL, görüntülenen slug ve gelecekteki arama özetleri yeni slug'ı kullanır.
- Yeniden adlandırma takma adları, eski URL'ler ve kayıt üzerinden çözümlenen kurulumlar için çözümlemeyi korur, ancak arama sıralaması, yeniden adlandırma indekslendikten sonra kanonik beceri meta verilerine dayanır. Mevcut istatistikler beceriyle kalır.
- Bir beceri beklenmedik şekilde görünmüyorsa, sıralamayla ilgili meta verileri değiştirmeden önce oturum açıkken `clawhub inspect <slug>` ile moderasyon durumunu kontrol edin.

### `GET /api/v1/skills`

Sorgu parametreleri:

- `limit` (isteğe bağlı): tam sayı (1-200)
- `cursor` (isteğe bağlı): `trending` dışındaki herhangi bir sıralama için sayfalama imleci
- `sort` (isteğe bağlı): `updated` (varsayılan), `createdAt` (takma ad: `newest`), `downloads`, `stars` (takma ad: `rating`), `installsCurrent` (takma ad: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (isteğe bağlı): şüpheli (`flagged.suspicious`) becerileri gizlemek için `true`
- `nonSuspicious` (isteğe bağlı): `nonSuspiciousOnly` için eski takma ad

Notlar:

- `trending`, son 7 gündeki kurulumlara göre sıralar (telemetri tabanlı).
- `createdAt`, yeni beceri taramaları için kararlıdır; `updated`, mevcut beceriler yeniden yayımlandığında değişir.
- `nonSuspiciousOnly=true` olduğunda, imleç tabanlı sıralamalar bir sayfada `limit` öğeden daha azını döndürebilir, çünkü şüpheli beceriler sayfa alımından sonra filtrelenir.
- Mevcut olduğunda sayfalamaya devam etmek için `nextCursor` kullanın. Kısa bir sayfa tek başına sonuçların bittiği anlamına gelmez.

Yanıt:

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
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
- `metadata.os`: beceri frontmatter'ında bildirilen işletim sistemi kısıtlamaları (örn. `["macos"]`, `["linux"]`). Bildirilmemişse `null`.
- `metadata.systems`: Nix sistem hedefleri (örn. `["aarch64-darwin", "x86_64-linux"]`). Bildirilmemişse `null`.
- Beceri platform meta verisine sahip değilse `metadata` değeri `null` olur.
- `moderation` yalnızca beceri işaretlenmişse veya sahibi onu görüntülüyorsa dahil edilir.

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
- Kanıt, herkese açık çağıranlar için redakte edilir ve ham parçaları yalnızca sahipler/moderatörler için içerir.

### `POST /api/v1/skills/{slug}/report`

Moderatör incelemesi için bir beceriyi bildirin. Bildirimler beceri düzeyindedir, isteğe bağlı olarak
bir sürüme bağlanır ve beceri bildirim kuyruğunu besler.

Kimlik doğrulama:

- API token'ı gerektirir.

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

Beceri bildirimlerini çözmek veya yeniden açmak için moderatör/yönetici uç noktası.

İstek:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note`, `confirmed` ve `dismissed` için gereklidir; `status` yeniden `open` olarak
ayarlanırken atlanabilir. Değerlendirilmiş bir bildirimle birlikte `finalAction: "hide"`
geçirerek beceriyi aynı denetlenebilir iş akışında gizleyin.

### `GET /api/v1/skills/{slug}/versions`

Sorgu parametreleri:

- `limit` (isteğe bağlı): tam sayı
- `cursor` (isteğe bağlı): sayfalama imleci

### `GET /api/v1/skills/{slug}/versions/{version}`

Sürüm meta verilerini + dosya listesini döndürür.

- `version.security`, mevcut olduğunda normalleştirilmiş tarama doğrulama durumunu ve tarayıcı ayrıntılarını
  (VirusTotal + LLM) içerir.

### `GET /api/v1/skills/{slug}/scan`

Bir beceri sürümü için güvenlik taraması doğrulama ayrıntılarını döndürür.

Sorgu parametreleri:

- `version` (isteğe bağlı): belirli sürüm dizesi.
- `tag` (isteğe bağlı): etiketli bir sürümü çözümle (örneğin `latest`).

Notlar:

- Ne `version` ne de `tag` sağlanmışsa, en son sürümü kullanır.
- Normalleştirilmiş doğrulama durumunu ve tarayıcıya özgü ayrıntıları içerir.
- `security.capabilityTags`, algılandığında
  `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token` ve `posts-externally` gibi deterministik yetenek/risk etiketlerini içerir.
- `security.hasScanResult`, yalnızca bir tarayıcı kesin bir karar (`clean`, `suspicious` veya `malicious`) ürettiğinde `true` olur.
- `moderation`, en son sürümden türetilmiş mevcut beceri düzeyi moderasyon anlık görüntüsüdür.
- Geçmiş bir sürümü sorgularken, `moderation` ve `security` değerlerini aynı sürüm bağlamı olarak ele almadan önce `moderation.matchesRequestedVersion` ve `moderation.sourceVersion` değerlerini kontrol edin.

### `GET /api/v1/skills/{slug}/file`

Ham metin içeriğini döndürür.

Sorgu parametreleri:

- `path` (gerekli)
- `version` (isteğe bağlı)
- `tag` (isteğe bağlı)

Notlar:

- Varsayılan olarak en son sürüme gider.
- Dosya boyutu sınırı: 200KB.

### `GET /api/v1/packages`

Şunlar için birleşik katalog uç noktası:

- beceriler
- kod plugin'leri
- paket plugin'leri

Sorgu parametreleri:

- `limit` (isteğe bağlı): tam sayı (1–100)
- `cursor` (isteğe bağlı): sayfalama imleci
- `family` (isteğe bağlı): `skill`, `code-plugin` veya `bundle-plugin`
- `channel` (isteğe bağlı): `official`, `community` veya `private`
- `isOfficial` (isteğe bağlı): `true` veya `false`
- `executesCode` (isteğe bağlı): `true` veya `false`
- `capabilityTag` (isteğe bağlı): Plugin paketleri için yetenek filtresi
- `target` / `hostTarget` (isteğe bağlı): `host:<target>` için kısa yazım
- `os`, `arch`, `libc` (isteğe bağlı): ana makine yetenek filtreleri için kısa yazım
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (isteğe bağlı): ortam gereksinimi etiketleri için `true`/`1` kısa yazımı
- `externalService`, `binary`, `osPermission` (isteğe bağlı): adlandırılmış
  ortam gereksinimi etiketleri için kısa yazım
- `artifactKind` (isteğe bağlı): `legacy-zip` veya `npm-pack`
- `npmMirror` (isteğe bağlı): npm yansısı üzerinden kullanılabilen
  ClawPack destekli paket sürümlerini göstermek için `true`/`1`

Notlar:

- `GET /api/v1/code-plugins` ve `GET /api/v1/bundle-plugins` sabit aile takma adları olarak kalır.
- Skill kayıtları, skill kayıt defteri tarafından desteklenmeye devam eder ve hâlâ yalnızca `POST /api/v1/skills` üzerinden yayımlanabilir.
- `POST /api/v1/packages` hâlâ yalnızca code-plugin ve bundle-plugin sürümleri içindir.
- Anonim çağıranlar yalnızca genel paket kanallarını görür.
- Kimliği doğrulanmış çağıranlar, listeleme/arama sonuçlarında ait oldukları yayıncıların özel paketlerini görebilir.
- `channel=private` yalnızca kimliği doğrulanmış çağıranın okuyabildiği paketleri döndürür.

### `GET /api/v1/packages/search`

Skills + Plugin paketleri genelinde birleşik katalog araması.

Sorgu parametreleri:

- `q` (zorunlu): sorgu dizesi
- `limit` (isteğe bağlı): tam sayı (1–100)
- `family` (isteğe bağlı): `skill`, `code-plugin` veya `bundle-plugin`
- `channel` (isteğe bağlı): `official`, `community` veya `private`
- `isOfficial` (isteğe bağlı): `true` veya `false`
- `executesCode` (isteğe bağlı): `true` veya `false`
- `capabilityTag` (isteğe bağlı): Plugin paketleri için yetenek filtresi
- `target` / `hostTarget`, `os`, `arch`, `libc`, `requiresBrowser`,
  `requiresDesktop`, `requiresNativeDeps`, `requiresExternalService`,
  `requiresBinary`, `requiresOsPermission`, `externalService`, `binary` ve
  `osPermission` yaygın yetenek etiketleri için kısa yazımlar olarak kabul edilir
- `artifactKind` (isteğe bağlı): `legacy-zip` veya `npm-pack`
- `npmMirror` (isteğe bağlı): npm yansısı üzerinden kullanılabilen
  ClawPack destekli paket sürümlerini aramak için `true`/`1`

Notlar:

- Anonim çağıranlar yalnızca genel paket kanallarını görür.
- Kimliği doğrulanmış çağıranlar, ait oldukları yayıncılar için özel paketlerde arama yapabilir.
- `channel=private` yalnızca kimliği doğrulanmış çağıranın okuyabildiği paketleri döndürür.
- Yapıt filtreleri dizinlenmiş yetenek etiketleri tarafından desteklenir:
  `artifact:legacy-zip`, `artifact:npm-pack` ve `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

Paket ayrıntı meta verilerini döndürür.

Notlar:

- Skills, birleşik katalogda bu rota üzerinden de çözümlenebilir.
- Özel paketler, çağıran sahip olan yayıncıyı okuyamadığı sürece `404` döndürür.

### `DELETE /api/v1/packages/{name}`

Bir paketi ve tüm sürümlerini geçici olarak siler.

Notlar:

- Paket sahibi, kuruluş yayıncısı sahibi/yöneticisi, platform moderatörü veya platform yöneticisi için bir API belirteci gerektirir.

### `GET /api/v1/packages/{name}/versions`

Sürüm geçmişini döndürür.

Sorgu parametreleri:

- `limit` (isteğe bağlı): tam sayı (1–100)
- `cursor` (isteğe bağlı): sayfalama imleci

Notlar:

- Özel paketler, çağıran sahip olan yayıncıyı okuyamadığı sürece `404` döndürür.

### `GET /api/v1/packages/{name}/versions/{version}`

Dosya meta verileri, uyumluluk, yetenekler, doğrulama, yapıt meta verileri ve tarama verileri dahil olmak üzere bir paket sürümünü döndürür.

Notlar:

- `version.artifact.kind`, eski dünya paket arşivleri için `legacy-zip` veya ClawPack destekli sürümler için `npm-pack` olur.
- ClawPack sürümleri npm uyumlu `npmIntegrity`, `npmShasum` ve `npmTarballName` alanlarını içerir.
- Tarama verisi mevcut olduğunda `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis` ve `version.staticScan` dahil edilir.
- Özel paketler, çağıran sahip olan yayıncıyı okuyamadığı sürece `404` döndürür.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Bir paket sürümü için açık yapıt çözümleyici meta verilerini döndürür.

Notlar:

- Eski paket sürümleri bir `legacy-zip` yapıtı ve eski ZIP `downloadUrl` döndürür.
- ClawPack sürümleri bir `npm-pack` yapıtı, npm bütünlük alanları, bir `tarballUrl` ve eski ZIP uyumluluk URL'sini döndürür.
- Bu, OpenClaw çözümleyici yüzeyidir; paylaşılan bir URL'den arşiv biçimini tahmin etmeyi önler.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Açık çözümleyici yolu üzerinden sürüm yapıtını indirir.

Notlar:

- ClawPack sürümleri yüklenen tam npm-pack `.tgz` baytlarını yayınlar.
- Eski ZIP sürümleri `/api/v1/packages/{name}/download?version=` adresine yönlendirir.
- İndirme hız kovasını kullanır.

### `GET /api/v1/packages/{name}/readiness`

Gelecekteki OpenClaw tüketimi için hesaplanan hazır olma durumunu döndürür.

Hazır olma denetimleri şunları kapsar:

- official kanal durumu
- en son sürüm kullanılabilirliği
- ClawPack npm-pack yapıtı kullanılabilirliği
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

Official OpenClaw Plugin geçiş satırlarını listelemek için moderatör uç noktası.

Kimlik doğrulama:

- Moderatör veya yönetici kullanıcı için bir API belirteci gerektirir.

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

Official Plugin geçiş satırı oluşturmak veya güncellemek için yönetici uç noktası.

Kimlik doğrulama:

- Yönetici kullanıcı için bir API belirteci gerektirir.

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
- `packageName` npm adı olarak normalize edilir; planlanmış geçişler için paket eksik olabilir.
- Bu yalnızca geçiş hazır olma durumunu izler. OpenClaw'ı değiştirmez veya ClawPack üretmez.

### `GET /api/v1/packages/moderation/queue`

Paket sürümü inceleme kuyrukları için moderatör/yönetici uç noktası.

Kimlik doğrulama:

- Moderatör veya yönetici kullanıcı için bir API belirteci gerektirir.

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

Bir paketi moderatör incelemesi için raporlar. Raporlar paket düzeyindedir ve isteğe bağlı olarak bir sürüme bağlanır. Moderasyon kuyruğunu beslerler ancak tek başlarına indirmeleri otomatik olarak gizlemez veya engellemezler; moderatörler yapıtları onaylamak, karantinaya almak veya iptal etmek için sürüm moderasyonunu kullanmalıdır.

Kimlik doğrulama:

- Bir API belirteci gerektirir.

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

- Paket sahibi, yayıncı üyesi, moderatör veya yönetici kullanıcı için bir API belirteci gerektirir.

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

`note`, `confirmed` ve `dismissed` için zorunludur; `status` yeniden `open` olarak
ayarlanırken atlanabilir. Aynı denetlenebilir iş akışında yayın moderasyonu
uygulamak için doğrulanmış bir raporla birlikte `finalAction: "quarantine"` veya
`finalAction: "revoke"` geçirin.

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

Paket yayını incelemesi için moderatör/yönetici uç noktası.

İstek:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Desteklenen durumlar:

- `approved`: elle incelendi ve izin verildi.
- `quarantined`: takip beklerken engellendi.
- `revoked`: bir yayın daha önce güvenilir kabul edildikten sonra engellendi.

Karantinaya alınmış ve iptal edilmiş yayınlar, artefakt indirme rotalarından `403` döndürür.
Her değişiklik bir denetim günlüğü girdisi yazar.

### `POST /api/v1/packages/backfill/artifacts`

Eski paket yayınlarını açık artefakt türü meta verisiyle etiketlemek için
yalnızca yöneticilere açık bakım uç noktası.

İstek gövdesi:

```json
{
  "cursor": null,
  "batchSize": 100,
  "dryRun": true
}
```

Yanıt:

```json
{
  "ok": true,
  "scanned": 100,
  "updated": 12,
  "nextCursor": "cursor...",
  "done": false,
  "dryRun": true
}
```

Notlar:

- Varsayılan olarak deneme çalıştırması yapar.
- ClawPack depolaması olmayan yayınlar `legacy-zip` olarak etiketlenir.
- `artifactKind` eksik olan mevcut ClawPack destekli satırlar `npm-pack`
  olarak onarılır.
- Bu işlem ClawPack oluşturmaz veya artefakt baytlarını değiştirmez.

### `GET /api/v1/packages/{name}/file`

Bir paket dosyası için ham metin içeriğini döndürür.

Sorgu parametreleri:

- `path` (zorunlu)
- `version` (isteğe bağlı)
- `tag` (isteğe bağlı)

Notlar:

- Varsayılan olarak en son yayını kullanır.
- İndirme kovasını değil, okuma hız kovasını kullanır.
- İkili dosyalar `415` döndürür.
- Dosya boyutu sınırı: 200KB.
- Bekleyen VirusTotal taramaları okumaları engellemez; kötü amaçlı yayınlar başka yerde yine de alıkonabilir.
- Özel paketler, çağıran sahip yayıncıyı okuyamıyorsa `404` döndürür.

### `GET /api/v1/packages/{name}/download`

Bir paket yayını için eski belirlenimci ZIP arşivini indirir.

Sorgu parametreleri:

- `version` (isteğe bağlı)
- `tag` (isteğe bağlı)

Notlar:

- Varsayılan olarak en son yayını kullanır.
- Skills, `GET /api/v1/download` adresine yönlendirilir.
- Plugin/paket arşivleri, eski OpenClaw istemcilerinin çalışmaya devam etmesi için
  `package/` köküne sahip zip dosyalarıdır.
- Bu rota yalnızca ZIP olarak kalır. ClawPack `.tgz` dosyalarını akışa vermez.
- Yanıtlar çözümleyici bütünlük kontrolleri için `ETag`, `Digest`,
  `X-ClawHub-Artifact-Type` ve `X-ClawHub-Artifact-Sha256` başlıklarını içerir.
- Yalnızca kayıt defterine ait meta veriler indirilen arşive eklenmez.
- Bekleyen VirusTotal taramaları indirmeleri engellemez; kötü amaçlı yayınlar `403` döndürür.
- Özel paketler, çağıran sahip değilse `404` döndürür.

### `GET /api/npm/{package}`

ClawPack destekli paket sürümleri için npm uyumlu bir packument döndürür.

Notlar:

- Yalnızca yüklenmiş ClawPack npm-pack tarball'larına sahip sürümler listelenir.
- Yalnızca eski ZIP sürümleri kasıtlı olarak atlanır.
- `dist.tarball`, `dist.integrity` ve `dist.shasum`, kullanıcılar isterse npm'i
  yansıtıcıya yöneltebilsin diye npm uyumlu alanlar kullanır.
- Kapsamlı paket packument'ları hem `/api/npm/@scope/name` hem de npm'in
  kodlanmış `/api/npm/@scope%2Fname` istek yolunu destekler.

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm yansıtıcı istemcileri için tam olarak yüklenmiş ClawPack tarball baytlarını akışa verir.

Notlar:

- İndirme hız kovasını kullanır.
- İndirme başlıkları ClawHub SHA-256 ile npm integrity/shasum meta verilerini içerir.
- Moderasyon ve özel paket erişim kontrolleri yine de uygulanır.

### `GET /api/v1/resolve`

CLI tarafından yerel bir parmak izini bilinen bir sürüme eşlemek için kullanılır.

Sorgu parametreleri:

- `slug` (zorunlu)
- `hash` (zorunlu): paket parmak izinin 64 karakterlik hex sha256 değeri

Yanıt:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Bir Skills sürümünün zip dosyasını indirir.

Sorgu parametreleri:

- `slug` (zorunlu)
- `version` (isteğe bağlı): semver dizesi
- `tag` (isteğe bağlı): etiket adı (örn. `latest`)

Notlar:

- Ne `version` ne de `tag` sağlanırsa en son sürüm kullanılır.
- Yumuşak silinmiş sürümler `410` döndürür.
- İndirme istatistikleri saat başına benzersiz kimlikler olarak sayılır (API belirteci geçerliyse `userId`, aksi halde IP).

## Kimlik doğrulama uç noktaları (Bearer token)

Tüm uç noktalar şunu gerektirir:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Belirteci doğrular ve kullanıcı tanıtıcısını döndürür.

### `POST /api/v1/skills`

Yeni bir sürüm yayımlar.

- Tercih edilen: `payload` JSON + `files[]` blob'ları ile `multipart/form-data`.
- `files` içeren JSON gövdesi (storageId tabanlı) de kabul edilir.
- İsteğe bağlı payload alanı: `ownerHandle`. Mevcut olduğunda API, bu
  yayıncıyı sunucu tarafında çözer ve aktörün yayıncı erişimine sahip olmasını gerektirir.
- İsteğe bağlı payload alanı: `migrateOwner`. `ownerHandle` ile birlikte `true`
  olduğunda, aktör hem mevcut hem de hedef yayıncılarda admin/sahip ise
  mevcut bir Skills o sahibe taşınabilir. Bu açık onay olmadan sahip değişiklikleri
  reddedilir.

### `POST /api/v1/packages`

Bir code-plugin veya bundle-plugin yayını yayımlar.

- Bearer token kimlik doğrulaması gerektirir.
- Tercih edilen: `payload` JSON + `files[]` blob'ları ile `multipart/form-data`.
- `files` içeren JSON gövdesi (storageId tabanlı) de kabul edilir.
- İsteğe bağlı payload alanı: `ownerHandle`. Mevcut olduğunda, yalnızca admin'ler o sahip adına yayımlayabilir.

Doğrulama öne çıkanları:

- `family`, `code-plugin` veya `bundle-plugin` olmalıdır.
- Plugin paketleri `openclaw.plugin.json` gerektirir. ClawPack `.tgz` yüklemeleri
  bunu `package/openclaw.plugin.json` konumunda içermelidir.
- Kod Plugin'leri `package.json`, kaynak depo meta verisi, kaynak commit
  meta verisi, yapılandırma şeması meta verisi, `openclaw.compat.pluginApi` ve
  `openclaw.build.openclawVersion` gerektirir.
- `openclaw.hostTargets` ve `openclaw.environment` isteğe bağlı meta verilerdir.
- Yalnızca güvenilir yayıncılar `official` kanalına yayımlayabilir.
- Başkası adına yapılan yayınlar, official kanal uygunluğunu yine de hedef sahip hesabına göre doğrular.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Bir Skills'i yumuşak sil / geri yükle (sahip, moderatör veya admin).

İsteğe bağlı JSON gövdesi:

```json
{ "reason": "Held for moderation pending legal review." }
```

Mevcut olduğunda `reason`, Skills moderasyon notu olarak saklanır ve denetim günlüğüne kopyalanır.
Sahip tarafından başlatılan yumuşak silmeler slug'ı 30 gün boyunca rezerve eder, ardından slug
başka bir yayıncı tarafından alınabilir. Silme yanıtı, bu sürenin geçerli olduğu durumda
`slugReservedUntil` içerir. Moderatör/admin gizlemeleri ve güvenlik kaldırmaları bu şekilde sona ermez.

Silme yanıtı:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Durum kodları:

- `200`: tamam
- `401`: yetkisiz
- `403`: yasak
- `404`: Skills/kullanıcı bulunamadı
- `500`: iç sunucu hatası

### `POST /api/v1/users/publisher`

Yalnızca admin. Bir tanıtıcı için org yayıncısının var olmasını sağlar. Tanıtıcı hâlâ
eski paylaşımlı kullanıcı/kişisel yayıncıya işaret ediyorsa uç nokta önce onu bir org yayıncısına taşır.

- Gövde: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Yanıt: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Yalnızca admin. Yayın yapmadan, hak sahibi için kök slug'ları ve paket adlarını rezerve eder.
Paket adları yayın satırı olmayan özel yer tutucu paketler hâline gelir; böylece aynı
sahip daha sonra gerçek code-plugin veya bundle-plugin yayınını bu ada yayımlayabilir.

- Gövde: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Yanıt: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### Sahip slug yönetimi uç noktaları

- `POST /api/v1/skills/{slug}/rename`
  - Gövde: `{ "newSlug": "new-canonical-slug" }`
  - Yanıt: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Gövde: `{ "targetSlug": "canonical-target-slug" }`
  - Yanıt: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Notlar:

- Her iki uç nokta da API belirteci kimlik doğrulaması gerektirir ve yalnızca Skills sahibi için çalışır.
- `rename`, önceki slug'ı yönlendirme takma adı olarak korur.
- `merge`, kaynak listelemeyi gizler ve kaynak slug'ı hedef listelemeye yönlendirir.

### Sahiplik aktarımı uç noktaları

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

Bir kullanıcıyı yasakla ve sahip olduğu Skills'leri kalıcı olarak sil (yalnızca moderatör/admin).

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

Bir kullanıcının yasağını kaldır ve uygun Skills'leri geri yükle (yalnızca admin).

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

### `POST /api/v1/users/role`

Bir kullanıcı rolünü değiştir (yalnızca admin).

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

Kullanıcıları listele veya ara (yalnızca admin).

Sorgu parametreleri:

- `q` (isteğe bağlı): arama sorgusu
- `query` (isteğe bağlı): `q` için takma ad
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

Yıldız ekle/kaldır (öne çıkanlar). Her iki uç nokta da idempotenttir.

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
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Kaldırma planı için `DEPRECATIONS.md` dosyasına bakın.

## Kayıt defteri keşfi (`/.well-known/clawhub.json`)

CLI, siteden kayıt defteri/kimlik doğrulama ayarlarını keşfedebilir:

- `/.well-known/clawhub.json` (JSON, tercih edilen)
- `/.well-known/clawdhub.json` (eski)

Şema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Kendi sunucunuzda barındırıyorsanız bu dosyayı sunun (veya `CLAWHUB_REGISTRY` değerini açıkça ayarlayın; eski `CLAWDHUB_REGISTRY`).

---
read_when:
    - Uç noktalar ekleme/değiştirme
    - CLI ↔ kayıt defteri isteklerinde hata ayıklama
summary: HTTP API referansı (herkese açık + CLI uç noktaları + kimlik doğrulama).
x-i18n:
    generated_at: "2026-05-13T04:17:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1ea3f398107dd3a59fd870a3320ff8d76863a0b7995904e0e61b48d59f35a7d4
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

Temel URL: `https://clawhub.ai` (varsayılan).

Tüm v1 yolları `/api/v1/...` altındadır.
Eski `/api/...` ve `/api/cli/...` uyumluluk için kalır (`DEPRECATIONS.md` dosyasına bakın).
OpenAPI: `/api/v1/openapi.json`.

## Genel katalog yeniden kullanımı

Üçüncü taraf dizinler, ClawHub Skills öğelerini listelemek veya aramak için genel okuma uç noktalarını kullanabilir. Lütfen sonuçları önbelleğe alın, `429`/`Retry-After` değerlerine uyun, kullanıcıları kanonik ClawHub listesine (`https://clawhub.ai/<owner>/<slug>`) geri bağlayın ve ClawHub'ın üçüncü taraf siteyi onayladığı izlenimini vermekten kaçının. Gizli, özel veya moderasyon tarafından engellenmiş içeriği genel API yüzeyinin dışında yansıtmaya çalışmayın.

Web slug kısayolları kayıt defteri aileleri genelinde çözümlenir, ancak API istemcileri rota
önceliğini yeniden oluşturmaya çalışmak yerine okuma uç noktaları tarafından döndürülen
kanonik URL'leri kullanmalıdır.

## Hız sınırları

Zorlama modeli:

- Anonim istekler: IP başına uygulanır.
- Kimliği doğrulanmış istekler (geçerli Bearer token): kullanıcı kovası başına uygulanır.
- Token eksik/geçersizse, davranış IP zorlamasına geri döner.
- Kimliği doğrulanmış yazma uç noktaları, sunucu nedeni bildiğinde yalın bir `Unauthorized`
  döndürmemelidir. Eksik tokenlar, geçersiz/iptal edilmiş tokenlar ve
  silinmiş/yasaklanmış/devre dışı bırakılmış hesaplar, CLI istemcilerinin kullanıcılara
  onları neyin engellediğini söyleyebilmesi için her biri eyleme dönük metin almalıdır.

- Okuma: IP başına 600/dk, anahtar başına 2400/dk
- Yazma: IP başına 45/dk, anahtar başına 180/dk
- İndirme: IP başına 30/dk, anahtar başına 180/dk (`/api/v1/download`)

Başlıklar:

- Eski uyumluluk: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Standartlaştırılmış: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- `429` durumunda: `Retry-After`

Başlık semantiği:

- `X-RateLimit-Reset`: mutlak Unix epoch saniyeleri
- `RateLimit-Reset`: sıfırlamaya kadar saniye (gecikme)
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

İstemci yönergesi:

- `Retry-After` varsa, yeniden denemeden önce belirtilen saniye kadar bekleyin.
- Eşzamanlı yeniden denemelerden kaçınmak için jitter'lı backoff kullanın.
- `Retry-After` yoksa, `RateLimit-Reset` değerine geri dönün (veya `X-RateLimit-Reset` değerinden hesaplayın).

IP kaynağı:

- Varsayılan olarak istemci IP'si için `cf-connecting-ip` (Cloudflare) kullanır.
- ClawHub, uçta istemci IP'lerini tanımlamak için güvenilir iletme başlıklarını kullanır.
- Güvenilir bir istemci IP'si mevcut değilse, anonim indirme istekleri tek bir genel `ip:unknown` kovası yerine uç nokta kapsamlı bir yedek kovası kullanır. Anonim okuma/yazma istekleri yine de paylaşılan bilinmeyen kovayı kullanır; böylece eksik IP yönlendirmesi görünür ve temkinli kalır.

## Genel uç noktalar (kimlik doğrulama yok)

### `GET /api/v1/search`

Sorgu parametreleri:

- `q` (gerekli): sorgu dizesi
- `limit` (isteğe bağlı): tam sayı
- `highlightedOnly` (isteğe bağlı): vurgulanmış Skills öğelerine filtrelemek için `true`
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
      "updatedAt": 1730000000000
    }
  ]
}
```

Notlar:

- Sonuçlar alaka sırasına göre döndürülür (embedding benzerliği + tam slug/ad token güçlendirmeleri + indirmelerden gelen popülerlik önceliği).
- Alaka popülerlikten daha güçlüdür. Kesin bir slug veya görünen ad token eşleşmesi, çok daha fazla indirmeye sahip daha gevşek bir eşleşmeyi geride bırakabilir.
- ASCII metin, sözcük ve noktalama sınırlarında tokenlara ayrılır. Örneğin, `personal-map` bağımsız bir `map` tokenı içerirken `amap-jsapi-skill` `amap`, `jsapi` ve `skill` içerir; bu nedenle `map` araması, `personal-map` için `amap-jsapi-skill` öğesine göre daha güçlü bir sözcüksel eşleşme sağlar.
- İndirmeler birincil sıralama sinyali olarak değil, küçük log ölçekli bir öncelik ve eşitlik bozucu olarak kullanılır. Sorgu metni daha zayıf bir eşleşmeyse, yüksek indirmeli Skills öğeleri daha düşük sıralanabilir.
- Şüpheli veya gizli moderasyon durumu, çağıran filtrelerine ve mevcut moderasyon durumuna bağlı olarak bir Skill öğesini genel aramadan kaldırabilir.

Yayıncı keşfedilebilirliği yönergesi:

- Kullanıcıların kelimenin tam anlamıyla arayacağı terimleri görünen ada, özete ve etiketlere koyun. Bağımsız bir slug tokenını yalnızca korumak istediğiniz kararlı bir kimlik de olduğunda kullanın.
- Yeni slug daha iyi bir uzun vadeli kanonik ad değilse, yalnızca tek bir sorguyu yakalamak için slug adını değiştirmeyin. Eski sluglar yönlendirme takma adlarına dönüşür, ancak kanonik URL, görüntülenen slug ve gelecekteki arama özetleri yeni slugı kullanır.
- Yeniden adlandırma takma adları, kayıt defteri üzerinden çözümlenen eski URL'ler ve kurulumlar için çözümlemeyi korur, ancak arama sıralaması yeniden adlandırma dizine eklendikten sonra kanonik Skill meta verilerine dayanır. Mevcut istatistikler Skill öğesiyle kalır.
- Bir Skill beklenmedik şekilde görünmüyorsa, sıralama ile ilgili meta verileri değiştirmeden önce oturum açmış durumdayken önce `clawhub inspect <slug>` ile moderasyon durumunu kontrol edin.

### `GET /api/v1/skills`

Sorgu parametreleri:

- `limit` (isteğe bağlı): tam sayı (1–200)
- `cursor` (isteğe bağlı): `trending` dışındaki herhangi bir sıralama için sayfalama imleci
- `sort` (isteğe bağlı): `updated` (varsayılan), `createdAt` (takma ad: `newest`), `downloads`, `stars` (takma ad: `rating`), `installsCurrent` (takma ad: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (isteğe bağlı): şüpheli (`flagged.suspicious`) Skills öğelerini gizlemek için `true`
- `nonSuspicious` (isteğe bağlı): `nonSuspiciousOnly` için eski takma ad

Notlar:

- `trending`, son 7 gündeki kurulumlara göre sıralar (telemetri tabanlı).
- `createdAt`, yeni Skill taramaları için kararlıdır; `updated`, mevcut Skills yeniden yayımlandığında değişir.
- `nonSuspiciousOnly=true` olduğunda, imleç tabanlı sıralamalar bir sayfada `limit` değerinden daha az öğe döndürebilir çünkü şüpheli Skills sayfa alımından sonra filtrelenir.
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

- Sahip yeniden adlandırma/birleştirme akışları tarafından oluşturulan eski sluglar kanonik Skill öğesine çözümlenir.
- `metadata.os`: Skill frontmatter içinde bildirilen OS kısıtlamaları (örn. `["macos"]`, `["linux"]`). Bildirilmemişse `null`.
- `metadata.systems`: Nix sistem hedefleri (örn. `["aarch64-darwin", "x86_64-linux"]`). Bildirilmemişse `null`.
- Skill öğesinin platform meta verisi yoksa `metadata` `null` olur.
- `moderation` yalnızca Skill işaretlenmişse veya sahibi görüntülüyorsa dahil edilir.

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
- Genel çağıranlar yalnızca zaten işaretlenmiş görünür Skills için `200` alır.
- Kanıt genel çağıranlar için redakte edilir ve ham parçaları yalnızca sahipler/moderatörler için içerir.

### `POST /api/v1/skills/{slug}/report`

Bir Skill öğesini moderatör incelemesi için bildirin. Bildirimler Skill düzeyindedir, isteğe bağlı olarak
bir sürüme bağlanır ve Skill bildirim kuyruğunu besler.

Kimlik doğrulama:

- API tokenı gerektirir.

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

`note`, `confirmed` ve `dismissed` için gereklidir; `status` yeniden `open` olarak ayarlanırken
atılabilir. İncelenen bir bildirimle aynı denetlenebilir iş akışında Skill öğesini gizlemek için
`finalAction: "hide"` iletin.

### `GET /api/v1/skills/{slug}/versions`

Sorgu parametreleri:

- `limit` (isteğe bağlı): tam sayı
- `cursor` (isteğe bağlı): sayfalama imleci

### `GET /api/v1/skills/{slug}/versions/{version}`

Sürüm meta verilerini + dosya listesini döndürür.

- `version.security`, mevcut olduğunda normalleştirilmiş tarama doğrulama durumunu ve tarayıcı ayrıntılarını
  (VirusTotal + LLM) içerir.

### `GET /api/v1/skills/{slug}/scan`

Bir Skill sürümü için güvenlik taraması doğrulama ayrıntılarını döndürür.

Sorgu parametreleri:

- `version` (isteğe bağlı): belirli sürüm dizesi.
- `tag` (isteğe bağlı): etiketlenmiş bir sürümü çözümle (örneğin `latest`).

Notlar:

- Ne `version` ne de `tag` sağlanmışsa, en son sürümü kullanır.
- Normalleştirilmiş doğrulama durumunun yanı sıra tarayıcıya özgü ayrıntıları içerir.
- `security.capabilityTags`, algılandığında `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`,
  `requires-oauth-token` ve `posts-externally` gibi deterministik yetenek/risk etiketlerini içerir.
- `security.hasScanResult` yalnızca bir tarayıcı kesin bir karar (`clean`, `suspicious` veya `malicious`) ürettiğinde `true` olur.
- `moderation`, en son sürümden türetilmiş geçerli Skill düzeyi moderasyon anlık görüntüsüdür.
- Geçmiş bir sürümü sorgularken, `moderation` ve `security` değerlerini aynı sürüm bağlamı olarak ele almadan önce `moderation.matchesRequestedVersion` ve `moderation.sourceVersion` değerlerini kontrol edin.

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

- Skills
- kod Pluginleri
- paket Pluginleri

Sorgu parametreleri:

- `limit` (isteğe bağlı): tamsayı (1–100)
- `cursor` (isteğe bağlı): sayfalama imleci
- `family` (isteğe bağlı): `skill`, `code-plugin` veya `bundle-plugin`
- `channel` (isteğe bağlı): `official`, `community` veya `private`
- `isOfficial` (isteğe bağlı): `true` veya `false`
- `executesCode` (isteğe bağlı): `true` veya `false`
- `capabilityTag` (isteğe bağlı): Plugin paketleri için yetenek filtresi
- `target` / `hostTarget` (isteğe bağlı): `host:<target>` için kısa gösterim
- `os`, `arch`, `libc` (isteğe bağlı): ana makine yetenek filtreleri için kısa gösterim
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (isteğe bağlı): ortam gereksinimi etiketleri için `true`/`1` kısa gösterimi
- `externalService`, `binary`, `osPermission` (isteğe bağlı): adlandırılmış
  ortam gereksinimi etiketleri için kısa gösterim
- `artifactKind` (isteğe bağlı): `legacy-zip` veya `npm-pack`
- `npmMirror` (isteğe bağlı): npm aynası üzerinden kullanılabilen
  ClawPack destekli paket sürümlerini göstermek için `true`/`1`

Notlar:

- `GET /api/v1/code-plugins` ve `GET /api/v1/bundle-plugins` sabit aile takma adları olarak kalır.
- Skill girdileri skill kayıt defteri tarafından desteklenmeye devam eder ve hâlâ yalnızca `POST /api/v1/skills` üzerinden yayımlanabilir.
- `POST /api/v1/packages` hâlâ yalnızca code-plugin ve bundle-plugin sürümleri içindir.
- Anonim çağıranlar yalnızca herkese açık paket kanallarını görür.
- Kimliği doğrulanmış çağıranlar, liste/arama sonuçlarında üyesi oldukları yayımcıların özel paketlerini görebilir.
- `channel=private` yalnızca kimliği doğrulanmış çağıranın okuyabildiği paketleri döndürür.

### `GET /api/v1/packages/search`

Skills + Plugin paketleri genelinde birleşik katalog araması.

Sorgu parametreleri:

- `q` (zorunlu): sorgu dizesi
- `limit` (isteğe bağlı): tamsayı (1–100)
- `family` (isteğe bağlı): `skill`, `code-plugin` veya `bundle-plugin`
- `channel` (isteğe bağlı): `official`, `community` veya `private`
- `isOfficial` (isteğe bağlı): `true` veya `false`
- `executesCode` (isteğe bağlı): `true` veya `false`
- `capabilityTag` (isteğe bağlı): Plugin paketleri için yetenek filtresi
- `target` / `hostTarget`, `os`, `arch`, `libc`, `requiresBrowser`,
  `requiresDesktop`, `requiresNativeDeps`, `requiresExternalService`,
  `requiresBinary`, `requiresOsPermission`, `externalService`, `binary` ve
  `osPermission`, yaygın yetenek etiketleri için kısa gösterimler olarak kabul edilir
- `artifactKind` (isteğe bağlı): `legacy-zip` veya `npm-pack`
- `npmMirror` (isteğe bağlı): npm aynası üzerinden kullanılabilen
  ClawPack destekli paket sürümlerini aramak için `true`/`1`

Notlar:

- Anonim çağıranlar yalnızca herkese açık paket kanallarını görür.
- Kimliği doğrulanmış çağıranlar, üyesi oldukları yayımcıların özel paketlerinde arama yapabilir.
- `channel=private` yalnızca kimliği doğrulanmış çağıranın okuyabildiği paketleri döndürür.
- Artifakt filtreleri dizinlenmiş yetenek etiketleri tarafından desteklenir:
  `artifact:legacy-zip`, `artifact:npm-pack` ve `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

Paket ayrıntı meta verilerini döndürür.

Notlar:

- Skills, birleşik katalogda bu rota üzerinden de çözümlenebilir.
- Özel paketler, çağıran sahip yayımcıyı okuyamadıkça `404` döndürür.

### `DELETE /api/v1/packages/{name}`

Bir paketi ve tüm sürümlerini geçici olarak siler.

Notlar:

- Paket sahibi, kuruluş yayımcısı sahibi/yöneticisi,
  platform moderatörü veya platform yöneticisi için bir API belirteci gerektirir.

### `GET /api/v1/packages/{name}/versions`

Sürüm geçmişini döndürür.

Sorgu parametreleri:

- `limit` (isteğe bağlı): tamsayı (1–100)
- `cursor` (isteğe bağlı): sayfalama imleci

Notlar:

- Özel paketler, çağıran sahip yayımcıyı okuyamadıkça `404` döndürür.

### `GET /api/v1/packages/{name}/versions/{version}`

Dosya meta verileri, uyumluluk, yetenekler, doğrulama, artifakt meta verileri ve tarama verileri dahil olmak üzere tek bir paket sürümünü döndürür.

Notlar:

- `version.artifact.kind`, eski dünya paket arşivleri için `legacy-zip` veya
  ClawPack destekli sürümler için `npm-pack` olur.
- ClawPack sürümleri npm uyumlu `npmIntegrity`, `npmShasum` ve
  `npmTarballName` alanlarını içerir.
- `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis` ve `version.staticScan`, tarama verisi varsa dahil edilir.
- Özel paketler, çağıran sahip yayımcıyı okuyamadıkça `404` döndürür.

### `GET /api/v1/packages/{name}/versions/{version}/security`

Kurulum istemcileri için tam paket sürümü güvenlik ve güven özetini döndürür.
Bu, çözümlenen bir sürümün kurulup kurulamayacağına karar vermek için herkese açık OpenClaw tüketim yüzeyidir.

Kimlik doğrulama:

- Herkese açık okuma uç noktası. Sahip, yayımcı, moderatör veya yönetici belirteci
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

- `package.name`, `package.displayName` ve `package.family`, çözümlenen
  kayıt defteri paketini tanımlar.
- `release.releaseId`, `release.version` ve `release.createdAt`,
  değerlendirilen tam sürümü tanımlar.
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum` ve `release.npmTarballName`, sürüm artifaktı için
  bilindiğinde bulunur.
- `trust.scanStatus`, tarayıcı girdilerinden ve manuel sürüm moderasyonundan
  türetilen etkin güven durumudur.
- `trust.moderationState` nullable'dır. Manuel sürüm moderasyonu yoksa `null` olur.
- `trust.blockedFromDownload`, kurulum engelleme sinyalidir. OpenClaw ve diğer
  kurulum istemcileri, tarayıcı veya moderasyon alanlarından engelleme kurallarını
  yeniden türetmek yerine bu değer `true` olduğunda kurulumu engellemelidir.
- `trust.reasons`, kullanıcıya dönük ve denetim açıklama listesidir. Neden kodları
  `manual:quarantined`, `scan:malicious`, `static:malicious`, `vt:suspicious` ve
  `package:malicious` gibi kararlı, kompakt dizelerdir.
- `trust.pending`, bir veya daha fazla güven girdisinin hâlâ tamamlanmayı beklediği anlamına gelir.
- `trust.stale`, güven özetinin güncel olmayan girdilerden hesaplandığı ve
  yüksek güvenli bir izin kararı öncesinde yenileme gerektiriyor olarak ele alınması gerektiği anlamına gelir.

Notlar:

- Bu uç nokta sürüme özeldir. İstemciler, yalnızca en son paket meta verilerini
  okuduktan sonra değil, kurmayı amaçladıkları paket sürümünü çözümlendikten sonra bunu çağırmalıdır.
- Özel paketler, çağıran sahip yayımcıyı okuyamadıkça `404` döndürür.
- Bu uç nokta, sahip/moderatör moderasyon uç noktalarından kasıtlı olarak daha dardır.
  Muhabir kimliklerini, rapor gövdelerini, özel kanıtları veya dahili inceleme
  zaman çizelgelerini değil, kurulum kararını ve herkese açık açıklamayı sunar.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Bir paket sürümü için açık artifakt çözümleyici meta verilerini döndürür.

Notlar:

- Eski paket sürümleri bir `legacy-zip` artifaktı ve eski ZIP
  `downloadUrl` döndürür.
- ClawPack sürümleri bir `npm-pack` artifaktı, npm bütünlük alanları,
  bir `tarballUrl` ve eski ZIP uyumluluk URL'si döndürür.
- Bu, OpenClaw çözümleyici yüzeyidir; paylaşılan bir URL'den arşiv biçimini tahmin etmeyi önler.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Açık çözümleyici yolu üzerinden sürüm artifaktını indirir.

Notlar:

- ClawPack sürümleri, tam olarak yüklenen npm-pack `.tgz` baytlarını akış olarak verir.
- Eski ZIP sürümleri `/api/v1/packages/{name}/download?version=` adresine yönlendirir.
- İndirme hız kovasını kullanır.

### `GET /api/v1/packages/{name}/readiness`

Gelecekteki OpenClaw tüketimi için hesaplanan hazır olma durumunu döndürür.

Hazırlık denetimleri şunları kapsar:

- resmi kanal durumu
- en son sürüm kullanılabilirliği
- ClawPack npm-pack artifakt kullanılabilirliği
- artifakt özeti
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

- Moderatör veya yönetici kullanıcı için bir API belirteci gerektirir.

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

- `bundledPluginId` küçük harfe normalleştirilir ve kararlı upsert anahtarıdır.
- `packageName`, npm adına göre normalleştirilir; planlanan geçişler için paket eksik olabilir.
- Bu yalnızca geçiş hazırlığını izler. OpenClaw üzerinde değişiklik yapmaz veya
  ClawPack üretmez.

### `GET /api/v1/packages/moderation/queue`

Paket sürümü inceleme kuyrukları için moderatör/yönetici uç noktası.

Kimlik doğrulama:

- Moderatör veya yönetici kullanıcı için bir API belirteci gerektirir.

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

Bir paketi moderatör incelemesine bildirin. Bildirimler paket düzeyindedir ve isteğe bağlı olarak bir sürüme bağlanabilir. Moderasyon kuyruğunu beslerler ancak tek başlarına indirmeleri otomatik olarak gizlemez veya engellemezler; moderatörler yapıtları onaylamak, karantinaya almak veya iptal etmek için sürüm moderasyonunu kullanmalıdır.

Kimlik doğrulama:

- API token'ı gerektirir.

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

Paket bildirimi alımı için moderatör/yönetici uç noktası.

Kimlik doğrulama:

- Moderatör veya yönetici kullanıcı için API token'ı gerektirir.

Sorgu parametreleri:

- `status` (isteğe bağlı): `open` (varsayılan), `confirmed`, `dismissed` veya `all`
- `limit` (isteğe bağlı): tamsayı (1-100)
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

- Paket sahibi, yayımcı üyesi, moderatör veya yönetici kullanıcı için API token'ı gerektirir.

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

Paket bildirimlerini çözmek veya yeniden açmak için moderatör/yönetici uç noktası.

İstek:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note`, `confirmed` ve `dismissed` için zorunludur; `status` yeniden `open` olarak ayarlanırken atlanabilir. Aynı denetlenebilir iş akışında sürüm moderasyonu uygulamak için onaylanmış bir bildirimle birlikte `finalAction: "quarantine"` veya `finalAction: "revoke"` geçirin.

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
- `quarantined`: takip beklenirken engellenmiş.
- `revoked`: bir sürüm daha önce güvenilir sayıldıktan sonra engellenmiş.

Karantinaya alınmış ve iptal edilmiş sürümler, yapıt indirme rotalarından `403` döndürür. Her değişiklik bir denetim günlüğü girdisi yazar.

### `POST /api/v1/packages/backfill/artifacts`

Eski paket sürümlerini açık yapıt türü meta verileriyle etiketlemek için yalnızca yöneticiye açık bakım uç noktası.

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

- Varsayılan olarak kuru çalıştırmadır.
- ClawPack depolaması olmayan sürümler `legacy-zip` olarak etiketlenir.
- `artifactKind` eksik olan mevcut ClawPack destekli satırlar `npm-pack` olarak onarılır.
- Bu işlem ClawPack oluşturmaz veya yapıt baytlarını değiştirmez.

### `GET /api/v1/packages/{name}/file`

Bir paket dosyası için ham metin içeriğini döndürür.

Sorgu parametreleri:

- `path` (zorunlu)
- `version` (isteğe bağlı)
- `tag` (isteğe bağlı)

Notlar:

- Varsayılan olarak en son sürümü kullanır.
- İndirme kovasını değil, okuma oranı kovasını kullanır.
- İkili dosyalar `415` döndürür.
- Dosya boyutu sınırı: 200KB.
- Bekleyen VirusTotal taramaları okumaları engellemez; kötü amaçlı sürümler başka yerlerde yine de alıkonabilir.
- Özel paketler, çağıran sahip yayımcıyı okuyamıyorsa `404` döndürür.

### `GET /api/v1/packages/{name}/download`

Bir paket sürümü için eski deterministik ZIP arşivini indirir.

Sorgu parametreleri:

- `version` (isteğe bağlı)
- `tag` (isteğe bağlı)

Notlar:

- Varsayılan olarak en son sürümü kullanır.
- Skills, `GET /api/v1/download` konumuna yönlendirilir.
- Plugin/paket arşivleri, eski OpenClaw istemcilerinin çalışmaya devam etmesi için `package/` köküne sahip zip dosyalarıdır.
- Bu rota yalnızca ZIP olarak kalır. ClawPack `.tgz` dosyalarını akışla göndermez.
- Yanıtlar çözümleyici bütünlük kontrolleri için `ETag`, `Digest`, `X-ClawHub-Artifact-Type` ve `X-ClawHub-Artifact-Sha256` başlıklarını içerir.
- Yalnızca kayıt meta verileri indirilen arşive enjekte edilmez.
- Bekleyen VirusTotal taramaları indirmeleri engellemez; kötü amaçlı sürümler `403` döndürür.
- Özel paketler, çağıran sahip değilse `404` döndürür.

### `GET /api/npm/{package}`

ClawPack destekli paket sürümleri için npm uyumlu bir packument döndürür.

Notlar:

- Yalnızca yüklenmiş ClawPack npm-pack tarball'larına sahip sürümler listelenir.
- Eski yalnızca ZIP sürümler kasıtlı olarak atlanır.
- `dist.tarball`, `dist.integrity` ve `dist.shasum`, kullanıcılar isterse npm'i yansıya yönlendirebilsin diye npm uyumlu alanlar kullanır.
- Kapsamlı paket packument'leri hem `/api/npm/@scope/name` hem de npm'in kodlanmış `/api/npm/@scope%2Fname` istek yolunu destekler.

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm yansı istemcileri için yüklenen ClawPack tarball baytlarının aynısını akışla gönderir.

Notlar:

- İndirme oranı kovasını kullanır.
- İndirme başlıkları ClawHub SHA-256 ile npm integrity/shasum meta verilerini içerir.
- Moderasyon ve özel paket erişim kontrolleri yine de uygulanır.

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

Bir skill sürümünün zip dosyasını indirir.

Sorgu parametreleri:

- `slug` (zorunlu)
- `version` (isteğe bağlı): semver dizesi
- `tag` (isteğe bağlı): etiket adı (örn. `latest`)

Notlar:

- Ne `version` ne de `tag` sağlanırsa en son sürüm kullanılır.
- Geçici olarak silinmiş sürümler `410` döndürür.
- İndirme istatistikleri saat başına benzersiz kimlikler olarak sayılır (API token'ı geçerliyse `userId`, aksi halde IP).

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
- İsteğe bağlı payload alanı: `ownerHandle`. Mevcut olduğunda API bu yayımcıyı sunucu tarafında çözer ve aktörün yayımcı erişimine sahip olmasını gerektirir.
- İsteğe bağlı payload alanı: `migrateOwner`. `ownerHandle` ile `true` olduğunda, aktör hem mevcut hem de hedef yayımcılarda yönetici/sahip ise mevcut bir skill bu sahibe taşınabilir. Bu açık kabul olmadan sahip değişiklikleri reddedilir.

### `POST /api/v1/packages`

Bir code-plugin veya bundle-plugin sürümü yayımlar.

- Bearer token kimlik doğrulaması gerektirir.
- Tercih edilen: `payload` JSON + `files[]` blob'ları ile `multipart/form-data`.
- `files` içeren JSON gövdesi (storageId tabanlı) de kabul edilir.
- İsteğe bağlı payload alanı: `ownerHandle`. Mevcut olduğunda, yalnızca yöneticiler o sahip adına yayım yapabilir.

Doğrulama öne çıkanları:

- `family`, `code-plugin` veya `bundle-plugin` olmalıdır.
- Plugin paketleri `openclaw.plugin.json` gerektirir. ClawPack `.tgz` yüklemeleri bunu `package/openclaw.plugin.json` konumunda içermelidir.
- Code plugin'ler `package.json`, kaynak depo meta verileri, kaynak commit meta verileri, config schema meta verileri, `openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` gerektirir.
- `openclaw.hostTargets` ve `openclaw.environment` isteğe bağlı meta verilerdir.
- Yalnızca güvenilir yayımcılar `official` kanalına yayım yapabilir.
- Başkası adına yayımlar, resmi kanal uygunluğunu yine hedef sahip hesabına göre doğrular.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Bir skill'i geçici olarak sil / geri yükle (sahip, moderatör veya yönetici).

İsteğe bağlı JSON gövdesi:

```json
{ "reason": "Held for moderation pending legal review." }
```

Mevcut olduğunda `reason`, skill moderasyon notu olarak saklanır ve denetim günlüğüne kopyalanır.
Sahip tarafından başlatılan geçici silmeler slug'ı 30 gün ayırır; ardından slug başka bir yayımcı tarafından alınabilir. Silme yanıtı, bu sona erme geçerliyse `slugReservedUntil` içerir.
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

Yalnızca yönetici. Bir tanıtıcı için org yayımcısının var olduğundan emin olur. Tanıtıcı hâlâ eski paylaşımlı kullanıcı/kişisel yayımcıyı gösteriyorsa uç nokta önce onu bir org yayımcısına taşır.

- Gövde: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Yanıt: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Yalnızca yönetici. Yayım yapmadan, kök slug'ları ve paket adlarını hak sahibi için ayırır. Paket adları sürüm satırı olmayan özel yer tutucu paketler hâline gelir; böylece aynı sahip daha sonra gerçek code-plugin veya bundle-plugin sürümünü bu ada yayımlayabilir.

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
  - Yanıt (kabul/ret/iptal): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Yanıt şekli: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Bir kullanıcıyı yasaklayın ve sahip olduğu Skills'i kalıcı olarak silin (yalnızca moderatör/yönetici).

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

Bir kullanıcının yasağını kaldırın ve uygun Skills'i geri yükleyin (yalnızca yönetici).

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

Bir yıldız (vurgulama) ekleyin/kaldırın. Her iki uç nokta da idempotenttir.

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

## Registry keşfi (`/.well-known/clawhub.json`)

CLI, registry/kimlik doğrulama ayarlarını siteden keşfedebilir:

- `/.well-known/clawhub.json` (JSON, tercih edilen)
- `/.well-known/clawdhub.json` (eski)

Şema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Kendi sunucunuzda barındırıyorsanız bu dosyayı sunun (veya `CLAWHUB_REGISTRY` değerini açıkça ayarlayın; eski `CLAWDHUB_REGISTRY`).

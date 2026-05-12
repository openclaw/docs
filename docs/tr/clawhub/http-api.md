---
read_when:
    - Uç noktalar ekleme/değiştirme
    - CLI ↔ kayıt defteri isteklerinde hata ayıklama
summary: HTTP API referansı (herkese açık + CLI uç noktaları + kimlik doğrulama).
x-i18n:
    generated_at: "2026-05-12T00:57:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c217e56a38d697d8cc6e1c7f0c6481fd762ecbadcf5629964c1f49781d5405b
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

Temel URL: `https://clawhub.ai` (varsayılan).

Tüm v1 yolları `/api/v1/...` altındadır.
Eski `/api/...` ve `/api/cli/...` uyumluluk için kalır (`DEPRECATIONS.md` dosyasına bakın).
OpenAPI: `/api/v1/openapi.json`.

## Genel katalog yeniden kullanımı

Üçüncü taraf dizinler, ClawHub Skills öğelerini listelemek veya aramak için genel okuma uç noktalarını kullanabilir. Lütfen sonuçları önbelleğe alın, `429`/`Retry-After` değerlerine uyun, kullanıcıları kanonik ClawHub listesine (`https://clawhub.ai/<owner>/<slug>`) geri bağlayın ve ClawHub’ın üçüncü taraf siteyi onayladığını ima etmekten kaçının. Gizli, özel veya moderasyon tarafından engellenmiş içeriği genel API yüzeyi dışında yansıtmaya çalışmayın.

Web slug kısayolları kayıt defteri aileleri arasında çözümlenir, ancak API istemcileri rota önceliğini yeniden kurmak yerine okuma uç noktalarının döndürdüğü kanonik URL’leri kullanmalıdır.

## Hız sınırları

Uygulama modeli:

- Anonim istekler: IP başına uygulanır.
- Kimliği doğrulanmış istekler (geçerli Bearer token): kullanıcı kovası başına uygulanır.
- Token eksik/geçersizse davranış IP uygulamasına geri döner.
- Kimliği doğrulanmış yazma uç noktaları, sunucu nedeni bildiğinde yalın bir `Unauthorized` döndürmemelidir. Eksik tokenlar, geçersiz/iptal edilmiş tokenlar ve silinmiş/yasaklanmış/devre dışı bırakılmış hesaplar, CLI istemcilerinin kullanıcıya neyin engel olduğunu söyleyebilmesi için her biri eyleme geçirilebilir metin almalıdır.

- Okuma: IP başına 600/dk, anahtar başına 2400/dk
- Yazma: IP başına 45/dk, anahtar başına 180/dk
- İndirme: IP başına 30/dk, anahtar başına 180/dk (`/api/v1/download`)

Başlıklar:

- Eski uyumluluk: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Standartlaştırılmış: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- `429` durumunda: `Retry-After`

Başlık semantiği:

- `X-RateLimit-Reset`: mutlak Unix epoch saniyesi
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

İstemci kılavuzu:

- `Retry-After` varsa, yeniden denemeden önce o kadar saniye bekleyin.
- Eşzamanlı yeniden denemelerden kaçınmak için rastgele sapmalı backoff kullanın.
- `Retry-After` eksikse `RateLimit-Reset` değerine geri dönün (veya `X-RateLimit-Reset` değerinden hesaplayın).

IP kaynağı:

- Varsayılan olarak istemci IP’si için `cf-connecting-ip` (Cloudflare) kullanır.
- ClawHub, istemci IP’lerini uçta tanımlamak için güvenilir yönlendirme başlıklarını kullanır.
- Güvenilir bir istemci IP’si yoksa anonim indirme istekleri tek bir genel `ip:unknown` kovası yerine uç nokta kapsamlı bir yedek kova kullanır. Anonim okuma/yazma istekleri hâlâ paylaşılan bilinmeyen kovayı kullanır, böylece eksik IP yönlendirmesi görünür ve ihtiyatlı kalır.

## Genel uç noktalar (kimlik doğrulama yok)

### `GET /api/v1/search`

Sorgu parametreleri:

- `q` (gerekli): sorgu dizesi
- `limit` (isteğe bağlı): tam sayı
- `highlightedOnly` (isteğe bağlı): vurgulanan Skills öğelerine filtrelemek için `true`
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

- Sonuçlar alaka sırasına göre döndürülür (embedding benzerliği + tam slug/ad token artırımları + indirmelerden gelen popülerlik önceliği).
- Alaka popülerlikten daha güçlüdür. Kesin bir slug veya görüntüleme adı token eşleşmesi, çok daha fazla indirmeye sahip daha gevşek bir eşleşmeden üst sıraya çıkabilir.
- ASCII metin, sözcük ve noktalama sınırlarında tokenlara ayrılır. Örneğin `personal-map` bağımsız bir `map` tokenı içerirken `amap-jsapi-skill` `amap`, `jsapi` ve `skill` içerir; bu nedenle `map` araması `personal-map` için `amap-jsapi-skill` öğesine göre daha güçlü bir sözcüksel eşleşme verir.
- İndirmeler birincil sıralama sinyali olarak değil, küçük log ölçekli bir öncelik ve eşitlik bozucu olarak kullanılır. Sorgu metni daha zayıf eşleştiğinde yüksek indirmeli Skills öğeleri daha düşük sıralanabilir.
- Şüpheli veya gizli moderasyon durumu, çağıran filtrelerine ve mevcut moderasyon durumuna bağlı olarak bir Skills öğesini genel aramadan kaldırabilir.

Yayıncı keşfedilebilirlik kılavuzu:

- Kullanıcıların gerçekten arayacağı terimleri görüntüleme adına, özete ve etiketlere koyun. Bağımsız bir slug tokenını yalnızca korumak istediğiniz kararlı bir kimlik olduğunda kullanın.
- Yeni slug daha iyi uzun vadeli kanonik ad olmadığı sürece, yalnızca tek bir sorguyu yakalamak için slug adını değiştirmeyin. Eski sluglar yönlendirme takma adlarına dönüşür, ancak kanonik URL, görüntülenen slug ve gelecekteki arama özetleri yeni slugı kullanır.
- Yeniden adlandırma takma adları eski URL’ler ve kayıt defteri üzerinden çözümlenen kurulumlar için çözümlemeyi korur, ancak arama sıralaması, yeniden adlandırma indekslendikten sonra kanonik Skills meta verilerine dayanır. Mevcut istatistikler Skills öğesiyle kalır.
- Bir Skills öğesi beklenmedik şekilde görünmüyorsa, sıralamayla ilgili meta verileri değiştirmeden önce oturum açmışken önce `clawhub inspect <slug>` ile moderasyon durumunu kontrol edin.

### `GET /api/v1/skills`

Sorgu parametreleri:

- `limit` (isteğe bağlı): tam sayı (1–200)
- `cursor` (isteğe bağlı): `trending` dışındaki herhangi bir sıralama için sayfalama imleci
- `sort` (isteğe bağlı): `updated` (varsayılan), `createdAt` (takma ad: `newest`), `downloads`, `stars` (takma ad: `rating`), `installsCurrent` (takma ad: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (isteğe bağlı): şüpheli (`flagged.suspicious`) Skills öğelerini gizlemek için `true`
- `nonSuspicious` (isteğe bağlı): `nonSuspiciousOnly` için eski takma ad

Notlar:

- `trending`, son 7 gündeki kurulumlara göre sıralar (telemetri tabanlı).
- `createdAt` yeni Skills taramaları için kararlıdır; `updated` mevcut Skills öğeleri yeniden yayımlandığında değişir.
- `nonSuspiciousOnly=true` olduğunda, imleç tabanlı sıralamalar bir sayfada `limit` değerinden daha az öğe döndürebilir çünkü şüpheli Skills öğeleri sayfa alımından sonra filtrelenir.
- Varsa sayfalamaya devam etmek için `nextCursor` kullanın. Kısa bir sayfa tek başına sonuçların bittiği anlamına gelmez.

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

- Sahip yeniden adlandırma/birleştirme akışlarıyla oluşturulan eski sluglar kanonik Skills öğesine çözümlenir.
- `metadata.os`: Skills frontmatter içinde bildirilen işletim sistemi kısıtlamaları (ör. `["macos"]`, `["linux"]`). Bildirilmemişse `null`.
- `metadata.systems`: Nix sistem hedefleri (ör. `["aarch64-darwin", "x86_64-linux"]`). Bildirilmemişse `null`.
- Skills platform meta verisine sahip değilse `metadata` `null` olur.
- `moderation` yalnızca Skills işaretlenmişse veya sahibi görüntülüyorsa dahil edilir.

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

- Sahipler ve moderatörler gizli Skills öğeleri için moderasyon ayrıntılarına erişebilir.
- Genel çağıranlar yalnızca zaten işaretlenmiş görünür Skills öğeleri için `200` alır.
- Kanıt genel çağıranlar için redakte edilir ve ham parçalar yalnızca sahipler/moderatörler için dahil edilir.

### `POST /api/v1/skills/{slug}/report`

Bir Skills öğesini moderatör incelemesi için bildirin. Bildirimler Skills düzeyindedir, isteğe bağlı olarak bir sürüme bağlanır ve Skills bildirim kuyruğunu besler.

Kimlik doğrulama:

- Bir API tokenı gerektirir.

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

Skills bildirimi alımı için moderatör/yönetici uç noktası.

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

Skills bildirimlerini çözmek veya yeniden açmak için moderatör/yönetici uç noktası.

İstek:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`confirmed` ve `dismissed` için `note` gereklidir; `status` tekrar `open` olarak ayarlanırken atlanabilir. Skills öğesini aynı denetlenebilir iş akışında gizlemek için incelenmiş bir bildirimle birlikte `finalAction: "hide"` geçin.

### `GET /api/v1/skills/{slug}/versions`

Sorgu parametreleri:

- `limit` (isteğe bağlı): tam sayı
- `cursor` (isteğe bağlı): sayfalama imleci

### `GET /api/v1/skills/{slug}/versions/{version}`

Sürüm meta verilerini + dosya listesini döndürür.

- `version.security`, mevcut olduğunda normalize edilmiş tarama doğrulama durumunu ve tarayıcı ayrıntılarını (VirusTotal + LLM) içerir.

### `GET /api/v1/skills/{slug}/scan`

Bir Skills sürümü için güvenlik taraması doğrulama ayrıntılarını döndürür.

Sorgu parametreleri:

- `version` (isteğe bağlı): belirli sürüm dizesi.
- `tag` (isteğe bağlı): etiketlenmiş bir sürümü çözümle (örneğin `latest`).

Notlar:

- Ne `version` ne de `tag` sağlanırsa en son sürümü kullanır.
- Normalize edilmiş doğrulama durumu ile tarayıcıya özgü ayrıntıları içerir.
- `security.capabilityTags`, tespit edildiğinde `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`, `requires-oauth-token` ve `posts-externally` gibi deterministik yetenek/risk etiketlerini içerir.
- `security.hasScanResult` yalnızca bir tarayıcı kesin bir karar (`clean`, `suspicious` veya `malicious`) ürettiğinde `true` olur.
- `moderation`, en son sürümden türetilmiş mevcut Skills düzeyi moderasyon anlık görüntüsüdür.
- Geçmiş bir sürüm sorgulanırken `moderation` ve `security` değerlerini aynı sürüm bağlamı olarak ele almadan önce `moderation.matchesRequestedVersion` ve `moderation.sourceVersion` değerlerini kontrol edin.

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

- skills
- code plugins
- bundle plugins

Sorgu parametreleri:

- `limit` (isteğe bağlı): tamsayı (1–100)
- `cursor` (isteğe bağlı): sayfalama imleci
- `family` (isteğe bağlı): `skill`, `code-plugin` veya `bundle-plugin`
- `channel` (isteğe bağlı): `official`, `community` veya `private`
- `isOfficial` (isteğe bağlı): `true` veya `false`
- `executesCode` (isteğe bağlı): `true` veya `false`
- `capabilityTag` (isteğe bağlı): Plugin paketleri için yetenek filtresi
- `target` / `hostTarget` (isteğe bağlı): `host:<target>` için kısaltma
- `os`, `arch`, `libc` (isteğe bağlı): host yetenek filtreleri için kısaltma
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (isteğe bağlı): ortam gereksinimi etiketleri için `true`/`1` kısaltması
- `externalService`, `binary`, `osPermission` (isteğe bağlı): adlandırılmış
  ortam gereksinimi etiketleri için kısaltma
- `artifactKind` (isteğe bağlı): `legacy-zip` veya `npm-pack`
- `npmMirror` (isteğe bağlı): npm aynası üzerinden kullanılabilen
  ClawPack destekli paket sürümlerini göstermek için `true`/`1`

Notlar:

- `GET /api/v1/code-plugins` ve `GET /api/v1/bundle-plugins` sabit aile takma adları olarak kalır.
- Skill girdileri Skills kayıt defteri tarafından desteklenmeye devam eder ve hâlâ yalnızca `POST /api/v1/skills` üzerinden yayımlanabilir.
- `POST /api/v1/packages` hâlâ yalnızca code-plugin ve bundle-plugin sürümleri içindir.
- Anonim çağıranlar yalnızca herkese açık paket kanallarını görür.
- Kimliği doğrulanmış çağıranlar, liste/arama sonuçlarında ait oldukları yayıncıların özel paketlerini görebilir.
- `channel=private` yalnızca kimliği doğrulanmış çağıranın okuyabildiği paketleri döndürür.

### `GET /api/v1/packages/search`

Skills + Plugin paketleri genelinde birleşik katalog araması.

Sorgu parametreleri:

- `q` (gerekli): sorgu dizesi
- `limit` (isteğe bağlı): tamsayı (1–100)
- `family` (isteğe bağlı): `skill`, `code-plugin` veya `bundle-plugin`
- `channel` (isteğe bağlı): `official`, `community` veya `private`
- `isOfficial` (isteğe bağlı): `true` veya `false`
- `executesCode` (isteğe bağlı): `true` veya `false`
- `capabilityTag` (isteğe bağlı): Plugin paketleri için yetenek filtresi
- `target` / `hostTarget`, `os`, `arch`, `libc`, `requiresBrowser`,
  `requiresDesktop`, `requiresNativeDeps`, `requiresExternalService`,
  `requiresBinary`, `requiresOsPermission`, `externalService`, `binary` ve
  `osPermission` yaygın yetenek etiketleri için kısaltma olarak kabul edilir
- `artifactKind` (isteğe bağlı): `legacy-zip` veya `npm-pack`
- `npmMirror` (isteğe bağlı): npm aynası üzerinden kullanılabilen
  ClawPack destekli paket sürümlerini aramak için `true`/`1`

Notlar:

- Anonim çağıranlar yalnızca herkese açık paket kanallarını görür.
- Kimliği doğrulanmış çağıranlar, ait oldukları yayıncıların özel paketlerinde arama yapabilir.
- `channel=private` yalnızca kimliği doğrulanmış çağıranın okuyabildiği paketleri döndürür.
- Artefakt filtreleri dizinlenmiş yetenek etiketleri tarafından desteklenir:
  `artifact:legacy-zip`, `artifact:npm-pack` ve `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

Paket ayrıntı meta verilerini döndürür.

Notlar:

- Skills, birleşik katalogda bu rota üzerinden de çözümlenebilir.
- Özel paketler, çağıran sahip yayıncıyı okuyamadığı sürece `404` döndürür.

### `DELETE /api/v1/packages/{name}`

Bir paketi ve tüm sürümlerini geçici olarak siler.

Notlar:

- Paket sahibi, kuruluş yayıncı sahibi/yöneticisi, platform moderatörü veya platform yöneticisi için bir API belirteci gerektirir.

### `GET /api/v1/packages/{name}/versions`

Sürüm geçmişini döndürür.

Sorgu parametreleri:

- `limit` (isteğe bağlı): tamsayı (1–100)
- `cursor` (isteğe bağlı): sayfalama imleci

Notlar:

- Özel paketler, çağıran sahip yayıncıyı okuyamadığı sürece `404` döndürür.

### `GET /api/v1/packages/{name}/versions/{version}`

Dosya meta verileri, uyumluluk, yetenekler, doğrulama, artefakt meta verileri ve tarama verileri dahil olmak üzere bir paket sürümünü döndürür.

Notlar:

- `version.artifact.kind`, eski dünya paket arşivleri için `legacy-zip` veya ClawPack destekli sürümler için `npm-pack` değeridir.
- ClawPack sürümleri npm uyumlu `npmIntegrity`, `npmShasum` ve `npmTarballName` alanlarını içerir.
- Tarama verileri mevcut olduğunda `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis` ve `version.staticScan` dahil edilir.
- Özel paketler, çağıran sahip yayıncıyı okuyamadığı sürece `404` döndürür.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Bir paket sürümü için açık artefakt çözücü meta verilerini döndürür.

Notlar:

- Eski paket sürümleri bir `legacy-zip` artefaktı ve eski ZIP `downloadUrl` döndürür.
- ClawPack sürümleri bir `npm-pack` artefaktı, npm bütünlük alanları, bir `tarballUrl` ve eski ZIP uyumluluk URL'si döndürür.
- Bu, OpenClaw çözücü yüzeyidir; paylaşılan bir URL'den arşiv biçimini tahmin etmekten kaçınır.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Açık çözücü yolu üzerinden sürüm artefaktını indirir.

Notlar:

- ClawPack sürümleri tam olarak yüklenen npm-pack `.tgz` baytlarını akış olarak iletir.
- Eski ZIP sürümleri `/api/v1/packages/{name}/download?version=` adresine yönlendirir.
- İndirme hız sınırı kovasını kullanır.

### `GET /api/v1/packages/{name}/readiness`

Gelecekteki OpenClaw tüketimi için hesaplanan hazır olma durumunu döndürür.

Hazır olma kontrolleri şunları kapsar:

- resmi kanal durumu
- en son sürüm kullanılabilirliği
- ClawPack npm-pack artefakt kullanılabilirliği
- artefakt özeti
- kaynak depo ve commit kaynağı
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

Resmi OpenClaw Plugin geçiş satırlarını listelemeye yönelik moderatör uç noktası.

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

Resmi Plugin geçiş satırı oluşturmaya veya güncellemeye yönelik yönetici uç noktası.

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
- `packageName` npm adı olarak normalleştirilir; planlanan geçişlerde paket eksik olabilir.
- Bu yalnızca geçiş hazır olma durumunu izler. OpenClaw üzerinde değişiklik yapmaz veya ClawPack üretmez.

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

Bir paketi moderatör incelemesi için raporlar. Raporlar paket düzeyindedir ve isteğe bağlı olarak bir sürüme bağlanabilir. Moderasyon kuyruğunu beslerler ancak kendiliğinden indirmeleri otomatik olarak gizlemez veya engellemez; moderatörler artefaktları onaylamak, karantinaya almak veya iptal etmek için sürüm moderasyonunu kullanmalıdır.

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

Paket raporlarını çözümlemeye veya yeniden açmaya yönelik moderatör/yönetici uç noktası.

İstek:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`confirmed` ve `dismissed` için `note` zorunludur; `status` tekrar `open` olarak
ayarlanırken atlanabilir. Aynı denetlenebilir iş akışında sürüm moderasyonu uygulamak için
onaylanmış bir raporla `finalAction: "quarantine"` veya
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

Paket sürümü incelemesi için moderatör/yönetici uç noktası.

İstek:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

Desteklenen durumlar:

- `approved`: manuel olarak incelendi ve izin verildi.
- `quarantined`: takip beklerken engellendi.
- `revoked`: bir sürüm daha önce güvenilir kabul edildikten sonra engellendi.

Karantinaya alınan ve iptal edilen sürümler, yapı indirme rotalarından `403` döndürür.
Her değişiklik bir denetim günlüğü girdisi yazar.

### `POST /api/v1/packages/backfill/artifacts`

Eski paket sürümlerini açık yapı türü meta verileriyle etiketlemek için yalnızca yöneticilere açık bakım uç noktası.

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

- Varsayılan olarak kuru çalıştırma yapar.
- ClawPack depolaması olmayan sürümler `legacy-zip` olarak etiketlenir.
- `artifactKind` eksik olan mevcut ClawPack destekli satırlar
  `npm-pack` olarak onarılır.
- Bu işlem ClawPack üretmez veya yapı baytlarını değiştirmez.

### `GET /api/v1/packages/{name}/file`

Bir paket dosyası için ham metin içeriğini döndürür.

Sorgu parametreleri:

- `path` (zorunlu)
- `version` (isteğe bağlı)
- `tag` (isteğe bağlı)

Notlar:

- Varsayılan olarak en son sürümü kullanır.
- İndirme kovasını değil, okuma hız kovasını kullanır.
- İkili dosyalar `415` döndürür.
- Dosya boyutu sınırı: 200KB.
- Bekleyen VirusTotal taramaları okumaları engellemez; kötü amaçlı sürümler yine de başka yerde alıkonabilir.
- Özel paketler, çağıran sahip yayıncıyı okuyamıyorsa `404` döndürür.

### `GET /api/v1/packages/{name}/download`

Bir paket sürümü için eski deterministik ZIP arşivini indirir.

Sorgu parametreleri:

- `version` (isteğe bağlı)
- `tag` (isteğe bağlı)

Notlar:

- Varsayılan olarak en son sürümü kullanır.
- Skills, `GET /api/v1/download` adresine yönlendirir.
- Plugin/paket arşivleri, eski OpenClaw istemcilerinin çalışmaya devam etmesi için
  `package/` köküne sahip zip dosyalarıdır.
- Bu rota yalnızca ZIP olarak kalır. ClawPack `.tgz` dosyalarını akışa almaz.
- Yanıtlar, çözümleyici bütünlük kontrolleri için `ETag`, `Digest`, `X-ClawHub-Artifact-Type` ve
  `X-ClawHub-Artifact-Sha256` başlıklarını içerir.
- Yalnızca kayıt meta verileri indirilen arşive enjekte edilmez.
- Bekleyen VirusTotal taramaları indirmeleri engellemez; kötü amaçlı sürümler `403` döndürür.
- Özel paketler, çağıran sahip değilse `404` döndürür.

### `GET /api/npm/{package}`

ClawPack destekli paket sürümleri için npm uyumlu bir packument döndürür.

Notlar:

- Yalnızca yüklenmiş ClawPack npm-pack tarball’ları olan sürümler listelenir.
- Eski, yalnızca ZIP sürümleri bilinçli olarak atlanır.
- `dist.tarball`, `dist.integrity` ve `dist.shasum`, kullanıcılar isterse npm’i aynaya yönlendirebilsin diye
  npm uyumlu alanlar kullanır.
- Kapsamlı paket packument’leri hem `/api/npm/@scope/name` hem de npm’in
  kodlanmış `/api/npm/@scope%2Fname` istek yolunu destekler.

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm ayna istemcileri için tam olarak yüklenmiş ClawPack tarball baytlarını akışa alır.

Notlar:

- İndirme hız kovasını kullanır.
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

Bir Skills sürümünün zip dosyasını indirir.

Sorgu parametreleri:

- `slug` (zorunlu)
- `version` (isteğe bağlı): semver dizesi
- `tag` (isteğe bağlı): etiket adı (örn. `latest`)

Notlar:

- Ne `version` ne de `tag` sağlanırsa en son sürüm kullanılır.
- Yazılımsal olarak silinmiş sürümler `410` döndürür.
- İndirme istatistikleri saat başına benzersiz kimlikler olarak sayılır (API token’ı geçerliyse `userId`, aksi halde IP).

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
- `files` içeren JSON gövdesi (storageId tabanlı) de kabul edilir.
- İsteğe bağlı payload alanı: `ownerHandle`. Mevcut olduğunda API bu
  yayıncıyı sunucu tarafında çözümler ve aktörün yayıncı erişimine sahip olmasını gerektirir.
- İsteğe bağlı payload alanı: `migrateOwner`. `ownerHandle` ile `true` olduğunda,
  aktör hem mevcut hem de hedef yayıncılarda yönetici/sahip ise mevcut bir Skills
  o sahibe taşınabilir. Bu açık kabul olmadan sahip değişiklikleri
  reddedilir.

### `POST /api/v1/packages`

Bir code-plugin veya bundle-plugin sürümü yayınlar.

- Bearer token kimlik doğrulaması gerektirir.
- Tercih edilen: `payload` JSON + `files[]` blob’ları ile `multipart/form-data`.
- `files` içeren JSON gövdesi (storageId tabanlı) de kabul edilir.
- İsteğe bağlı payload alanı: `ownerHandle`. Mevcut olduğunda, yalnızca yöneticiler o sahip adına yayınlayabilir.

Doğrulama öne çıkanları:

- `family`, `code-plugin` veya `bundle-plugin` olmalıdır.
- Plugin paketleri `openclaw.plugin.json` gerektirir. ClawPack `.tgz` yüklemeleri
  bunu `package/openclaw.plugin.json` konumunda içermelidir.
- Code Plugin’ler `package.json`, kaynak repo meta verileri, kaynak commit
  meta verileri, config şeması meta verileri, `openclaw.compat.pluginApi` ve
  `openclaw.build.openclawVersion` gerektirir.
- `openclaw.hostTargets` ve `openclaw.environment` isteğe bağlı meta verilerdir.
- Yalnızca güvenilir yayıncılar `official` kanalına yayın yapabilir.
- Başkası adına yayınlar yine de resmi kanal uygunluğunu hedef sahip hesabına göre doğrular.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Bir Skills’i yazılımsal olarak siler / geri yükler (sahip, moderatör veya yönetici).

İsteğe bağlı JSON gövdesi:

```json
{ "reason": "Held for moderation pending legal review." }
```

Mevcut olduğunda `reason`, Skills moderasyon notu olarak saklanır ve denetim günlüğüne kopyalanır.
Sahip tarafından başlatılan yazılımsal silmeler slug’ı 30 gün boyunca rezerve eder, ardından slug
başka bir yayıncı tarafından alınabilir. Silme yanıtı, bu sürenin geçerli olduğu durumlarda `slugReservedUntil` içerir.
Moderatör/yönetici gizlemeleri ve güvenlik kaldırmaları bu şekilde sona ermez.

Silme yanıtı:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Durum kodları:

- `200`: tamam
- `401`: yetkisiz
- `403`: yasak
- `404`: Skills/kullanıcı bulunamadı
- `500`: dahili sunucu hatası

### `POST /api/v1/users/publisher`

Yalnızca yönetici. Bir handle için bir kuruluş yayıncısının var olduğundan emin olur. Handle hâlâ
eski paylaşılan kullanıcı/kişisel yayıncıya işaret ediyorsa uç nokta önce onu bir kuruluş yayıncısına taşır.

- Gövde: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Yanıt: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Yalnızca yönetici. Kök slug’ları ve paket adlarını, bir sürüm yayınlamadan hak sahibi için rezerve eder.
Paket adları, sürüm satırları olmayan özel yer tutucu paketler hâline gelir; böylece aynı
sahip daha sonra gerçek code-plugin veya bundle-plugin sürümünü bu ada yayınlayabilir.

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

- Her iki uç nokta da API token kimlik doğrulaması gerektirir ve yalnızca Skills sahibi için çalışır.
- `rename`, önceki slug’ı bir yönlendirme takma adı olarak korur.
- `merge`, kaynak listelemeyi gizler ve kaynak slug’ı hedef listelemeye yönlendirir.

### Sahipliği aktarma uç noktaları

- `POST /api/v1/skills/{slug}/transfer`
  - Gövde: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Yanıt: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Yanıt (kabul/red/iptal): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Yanıt şekli: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

Bir kullanıcıyı yasaklar ve sahip olduğu Skills’leri kalıcı olarak siler (yalnızca moderatör/yönetici).

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

Bir kullanıcının yasağını kaldırır ve uygun Skills’leri geri yükler (yalnızca yönetici).

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

Bir yıldız ekler/kaldırır (öne çıkanlar). Her iki uç nokta da idempotenttir.

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

Kaldırma planı için `DEPRECATIONS.md` bölümüne bakın.

## Kayıt keşfi (`/.well-known/clawhub.json`)

CLI, site üzerinden kayıt/kimlik doğrulama ayarlarını keşfedebilir:

- `/.well-known/clawhub.json` (JSON, tercih edilen)
- `/.well-known/clawdhub.json` (eski)

Şema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Kendi barındırmanızı yapıyorsanız bu dosyayı sunun (veya `CLAWHUB_REGISTRY` değerini açıkça ayarlayın; eski `CLAWDHUB_REGISTRY`).

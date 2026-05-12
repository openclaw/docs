---
read_when:
    - Uç noktaları ekleme/değiştirme
    - CLI ↔ kayıt deposu isteklerinde hata ayıklama
summary: HTTP API referansı (herkese açık + CLI uç noktaları + kimlik doğrulama).
x-i18n:
    generated_at: "2026-05-12T04:09:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c217e56a38d697d8cc6e1c7f0c6481fd762ecbadcf5629964c1f49781d5405b
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

Temel URL: `https://clawhub.ai` (varsayılan).

Tüm v1 yolları `/api/v1/...` altındadır.
Eski `/api/...` ve `/api/cli/...` uyumluluk için korunur (bkz. `DEPRECATIONS.md`).
OpenAPI: `/api/v1/openapi.json`.

## Herkese açık kataloğun yeniden kullanımı

Üçüncü taraf dizinler, ClawHub Skills listelemek veya aramak için herkese açık okuma uç noktalarını kullanabilir. Lütfen sonuçları önbelleğe alın, `429`/`Retry-After` değerlerine uyun, kullanıcıları kanonik ClawHub listesine (`https://clawhub.ai/<owner>/<slug>`) geri bağlayın ve ClawHub'ın üçüncü taraf siteyi desteklediği izlenimini vermekten kaçının. Gizli, özel veya moderasyon tarafından engellenmiş içeriği herkese açık API yüzeyi dışında yansıtmaya çalışmayın.

Web slug kısayolları registry aileleri arasında çözümlenir, ancak API istemcileri rota
önceliğini yeniden oluşturmak yerine okuma uç noktalarının döndürdüğü kanonik URL'leri
kullanmalıdır.

## Hız sınırları

Uygulama modeli:

- Anonim istekler: IP başına uygulanır.
- Kimliği doğrulanmış istekler (geçerli Bearer belirteci): kullanıcı kovası başına uygulanır.
- Belirteç eksik/geçersizse, davranış IP uygulamasına geri döner.
- Kimliği doğrulanmış yazma uç noktaları, sunucu nedeni bildiğinde yalın bir `Unauthorized` döndürmemelidir. Eksik belirteçler, geçersiz/iptal edilmiş belirteçler ve silinmiş/yasaklanmış/devre dışı bırakılmış hesapların her biri, CLI istemcilerinin kullanıcılarına onları neyin engellediğini söyleyebilmesi için eyleme geçirilebilir metin almalıdır.

- Okuma: IP başına 600/dk, anahtar başına 2400/dk
- Yazma: IP başına 45/dk, anahtar başına 180/dk
- İndirme: IP başına 30/dk, anahtar başına 180/dk (`/api/v1/download`)

Başlıklar:

- Eski uyumluluk: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Standartlaştırılmış: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- `429` durumunda: `Retry-After`

Başlık semantiği:

- `X-RateLimit-Reset`: mutlak Unix epoch saniyeleri
- `RateLimit-Reset`: sıfırlamaya kalan saniye (gecikme)
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
- Eşzamanlı yeniden denemelerden kaçınmak için jitter'lı backoff kullanın.
- `Retry-After` eksikse, `RateLimit-Reset` değerine geri dönün (veya `X-RateLimit-Reset` üzerinden hesaplayın).

IP kaynağı:

- Varsayılan olarak istemci IP'si için `cf-connecting-ip` (Cloudflare) kullanır.
- ClawHub, edge üzerinde istemci IP'lerini tanımlamak için güvenilir yönlendirme başlıklarını kullanır.
- Güvenilir istemci IP'si yoksa, anonim indirme istekleri tek bir genel `ip:unknown` kovası yerine uç nokta kapsamlı bir yedek kovayı kullanır. Anonim okuma/yazma istekleri yine paylaşılan bilinmeyen kovayı kullanır; böylece eksik IP yönlendirmesi görünür ve tutucu kalır.

## Herkese açık uç noktalar (auth yok)

### `GET /api/v1/search`

Sorgu parametreleri:

- `q` (gerekli): sorgu dizesi
- `limit` (isteğe bağlı): tamsayı
- `highlightedOnly` (isteğe bağlı): öne çıkarılmış Skills ile filtrelemek için `true`
- `nonSuspiciousOnly` (isteğe bağlı): şüpheli (`flagged.suspicious`) Skills gizlemek için `true`
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
- Alaka, popülerlikten daha güçlüdür. Kesin bir slug veya görünen ad token eşleşmesi, çok daha fazla indirmeye sahip daha gevşek bir eşleşmenin önüne geçebilir.
- ASCII metin, kelime ve noktalama sınırlarında token'lara ayrılır. Örneğin, `personal-map` bağımsız bir `map` token'ı içerirken `amap-jsapi-skill` `amap`, `jsapi` ve `skill` içerir; bu nedenle `map` araması `personal-map` için `amap-jsapi-skill` değerinden daha güçlü bir sözcüksel eşleşme verir.
- İndirmeler, birincil sıralama sinyali olarak değil, küçük log ölçekli öncelik ve eşitlik bozucu olarak kullanılır. Yüksek indirmeli Skills, sorgu metni daha zayıf eşleştiğinde daha düşük sıralanabilir.
- Şüpheli veya gizli moderasyon durumu, çağıran filtrelerine ve mevcut moderasyon durumuna bağlı olarak bir Skill'i herkese açık aramadan kaldırabilir.

Yayıncı keşfedilebilirlik kılavuzu:

- Kullanıcıların gerçekten arayacağı terimleri görünen ada, özete ve etiketlere koyun. Bağımsız bir slug token'ını yalnızca korumak istediğiniz kararlı bir kimlik olduğunda kullanın.
- Yeni slug daha iyi bir uzun vadeli kanonik ad değilse, yalnızca tek bir sorguyu yakalamak için slug'ı yeniden adlandırmayın. Eski slug'lar yönlendirme takma adları olur, ancak kanonik URL, gösterilen slug ve gelecekteki arama özetleri yeni slug'ı kullanır.
- Yeniden adlandırma takma adları, registry üzerinden çözümlenen eski URL'ler ve kurulumlar için çözümlemeyi korur, ancak arama sıralaması yeniden adlandırma dizine eklendikten sonra kanonik Skill metadata'sına dayanır. Mevcut istatistikler Skill ile kalır.
- Bir Skill beklenmedik şekilde görünmüyorsa, sıralamayla ilgili metadata'yı değiştirmeden önce oturum açıkken `clawhub inspect <slug>` ile önce moderasyon durumunu kontrol edin.

### `GET /api/v1/skills`

Sorgu parametreleri:

- `limit` (isteğe bağlı): tamsayı (1–200)
- `cursor` (isteğe bağlı): `trending` olmayan herhangi bir sıralama için sayfalama imleci
- `sort` (isteğe bağlı): `updated` (varsayılan), `createdAt` (takma ad: `newest`), `downloads`, `stars` (takma ad: `rating`), `installsCurrent` (takma ad: `installs`), `installsAllTime`, `trending`
- `nonSuspiciousOnly` (isteğe bağlı): şüpheli (`flagged.suspicious`) Skills gizlemek için `true`
- `nonSuspicious` (isteğe bağlı): `nonSuspiciousOnly` için eski takma ad

Notlar:

- `trending`, son 7 gündeki kurulumlara göre sıralar (telemetri tabanlı).
- `createdAt`, yeni Skill taramaları için kararlıdır; `updated`, mevcut Skills yeniden yayımlandığında değişir.
- `nonSuspiciousOnly=true` olduğunda, sayfa alımından sonra şüpheli Skills filtrelendiği için imleç tabanlı sıralamalar bir sayfada `limit` değerinden daha az öğe döndürebilir.
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

- Sahip yeniden adlandırma/birleştirme akışları tarafından oluşturulan eski slug'lar kanonik Skill'e çözümlenir.
- `metadata.os`: Skill frontmatter'ında bildirilen OS kısıtlamaları (örn. `["macos"]`, `["linux"]`). Bildirilmemişse `null`.
- `metadata.systems`: Nix sistem hedefleri (örn. `["aarch64-darwin", "x86_64-linux"]`). Bildirilmemişse `null`.
- Skill'in platform metadata'sı yoksa `metadata` `null` olur.
- `moderation` yalnızca Skill işaretlendiyse veya sahibi görüntülüyorsa dahil edilir.

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

Moderatör incelemesi için bir Skill bildirin. Bildirimler Skill düzeyindedir, isteğe bağlı olarak bir sürüme bağlanır ve Skill bildirim kuyruğunu besler.

Auth:

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

Skill bildirimlerini çözmek veya yeniden açmak için moderatör/yönetici uç noktası.

İstek:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note`, `confirmed` ve `dismissed` için gereklidir; `status` tekrar `open` olarak ayarlanırken atlanabilir. Aynı denetlenebilir iş akışında Skill'i gizlemek için triage edilmiş bir bildirimle `finalAction: "hide"` gönderin.

### `GET /api/v1/skills/{slug}/versions`

Sorgu parametreleri:

- `limit` (isteğe bağlı): tamsayı
- `cursor` (isteğe bağlı): sayfalama imleci

### `GET /api/v1/skills/{slug}/versions/{version}`

Sürüm metadata'sını + dosya listesini döndürür.

- `version.security`, varsa normalleştirilmiş tarama doğrulama durumunu ve tarayıcı ayrıntılarını
  (VirusTotal + LLM) içerir.

### `GET /api/v1/skills/{slug}/scan`

Bir Skill sürümü için güvenlik taraması doğrulama ayrıntılarını döndürür.

Sorgu parametreleri:

- `version` (isteğe bağlı): belirli sürüm dizesi.
- `tag` (isteğe bağlı): etiketlenmiş bir sürümü çözümle (örneğin `latest`).

Notlar:

- Ne `version` ne de `tag` sağlanırsa, en son sürümü kullanır.
- Normalleştirilmiş doğrulama durumunu ve tarayıcıya özgü ayrıntıları içerir.
- `security.capabilityTags`, algılandığında `crypto`, `requires-wallet`, `can-make-purchases`, `can-sign-transactions`, `requires-oauth-token` ve `posts-externally` gibi deterministik capability/risk etiketlerini içerir.
- `security.hasScanResult`, yalnızca bir tarayıcı kesin bir karar (`clean`, `suspicious` veya `malicious`) ürettiğinde `true` olur.
- `moderation`, en son sürümden türetilmiş geçerli Skill düzeyi moderasyon anlık görüntüsüdür.
- Geçmiş bir sürüm sorgulanırken, `moderation` ve `security` değerlerini aynı sürüm bağlamı olarak ele almadan önce `moderation.matchesRequestedVersion` ve `moderation.sourceVersion` değerlerini kontrol edin.

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
- kod Plugin'leri
- paket Plugin'leri

Sorgu parametreleri:

- `limit` (isteğe bağlı): tamsayı (1–100)
- `cursor` (isteğe bağlı): sayfalama imleci
- `family` (isteğe bağlı): `skill`, `code-plugin` veya `bundle-plugin`
- `channel` (isteğe bağlı): `official`, `community` veya `private`
- `isOfficial` (isteğe bağlı): `true` veya `false`
- `executesCode` (isteğe bağlı): `true` veya `false`
- `capabilityTag` (isteğe bağlı): Plugin paketleri için yetenek filtresi
- `target` / `hostTarget` (isteğe bağlı): `host:<target>` için kısaltma
- `os`, `arch`, `libc` (isteğe bağlı): ana makine yetenek filtreleri için kısaltma
- `requiresBrowser`, `requiresDesktop`, `requiresNativeDeps`,
  `requiresExternalService`, `requiresBinary`, `requiresOsPermission`
  (isteğe bağlı): ortam gereksinimi etiketleri için `true`/`1` kısaltması
- `externalService`, `binary`, `osPermission` (isteğe bağlı): adlandırılmış
  ortam gereksinimi etiketleri için kısaltma
- `artifactKind` (isteğe bağlı): `legacy-zip` veya `npm-pack`
- `npmMirror` (isteğe bağlı): npm yansısı üzerinden kullanılabilen
  ClawPack destekli paket sürümlerini göstermek için `true`/`1`

Notlar:

- `GET /api/v1/code-plugins` ve `GET /api/v1/bundle-plugins` sabit aile takma adları olarak kalır.
- Skill girdileri skill kayıt defteri tarafından desteklenmeye devam eder ve hâlâ yalnızca `POST /api/v1/skills` üzerinden yayımlanabilir.
- `POST /api/v1/packages` hâlâ yalnızca code-plugin ve bundle-plugin yayınları içindir.
- Anonim çağıranlar yalnızca herkese açık paket kanallarını görür.
- Kimliği doğrulanmış çağıranlar, ait oldukları yayımcıların özel paketlerini liste/arama sonuçlarında görebilir.
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
  `osPermission` yaygın yetenek etiketleri için kısaltma olarak kabul edilir
- `artifactKind` (isteğe bağlı): `legacy-zip` veya `npm-pack`
- `npmMirror` (isteğe bağlı): npm yansısı üzerinden kullanılabilen
  ClawPack destekli paket sürümlerini aramak için `true`/`1`

Notlar:

- Anonim çağıranlar yalnızca herkese açık paket kanallarını görür.
- Kimliği doğrulanmış çağıranlar, ait oldukları yayımcıların özel paketlerini arayabilir.
- `channel=private` yalnızca kimliği doğrulanmış çağıranın okuyabildiği paketleri döndürür.
- Artifact filtreleri dizinlenmiş yetenek etiketleriyle desteklenir:
  `artifact:legacy-zip`, `artifact:npm-pack` ve `npm-mirror:available`.

### `GET /api/v1/packages/{name}`

Paket ayrıntı meta verilerini döndürür.

Notlar:

- Skills, birleşik katalogda bu rota üzerinden de çözümlenebilir.
- Özel paketler, çağıran sahibi olan yayımcıyı okuyamadığı sürece `404` döndürür.

### `DELETE /api/v1/packages/{name}`

Bir paketi ve tüm yayınlarını geçici olarak siler.

Notlar:

- Paket sahibi, kuruluş yayımcısı sahibi/yöneticisi, platform moderatörü veya platform yöneticisi için bir API belirteci gerektirir.

### `GET /api/v1/packages/{name}/versions`

Sürüm geçmişini döndürür.

Sorgu parametreleri:

- `limit` (isteğe bağlı): tamsayı (1–100)
- `cursor` (isteğe bağlı): sayfalama imleci

Notlar:

- Özel paketler, çağıran sahibi olan yayımcıyı okuyamadığı sürece `404` döndürür.

### `GET /api/v1/packages/{name}/versions/{version}`

Dosya meta verileri, uyumluluk, yetenekler, doğrulama, artifact meta verileri ve tarama verileri dahil olmak üzere tek bir paket sürümünü döndürür.

Notlar:

- `version.artifact.kind`, eski dünya paket arşivleri için `legacy-zip` veya ClawPack destekli yayınlar için `npm-pack` değeridir.
- ClawPack yayınları npm uyumlu `npmIntegrity`, `npmShasum` ve `npmTarballName` alanlarını içerir.
- Tarama verileri mevcut olduğunda `version.sha256hash`, `version.vtAnalysis`, `version.llmAnalysis` ve `version.staticScan` dahil edilir.
- Özel paketler, çağıran sahibi olan yayımcıyı okuyamadığı sürece `404` döndürür.

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

Bir paket sürümü için açık artifact çözümleyici meta verilerini döndürür.

Notlar:

- Eski paket sürümleri bir `legacy-zip` artifact ve eski ZIP
  `downloadUrl` döndürür.
- ClawPack sürümleri bir `npm-pack` artifact, npm bütünlük alanları, bir
  `tarballUrl` ve eski ZIP uyumluluk URL'sini döndürür.
- Bu, OpenClaw çözümleyici yüzeyidir; paylaşılan bir URL'den arşiv biçimini tahmin etmeyi önler.

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

Açık çözümleyici yolu üzerinden sürüm artifact'ini indirir.

Notlar:

- ClawPack sürümleri, yüklenen tam npm-pack `.tgz` baytlarını akışla gönderir.
- Eski ZIP sürümleri `/api/v1/packages/{name}/download?version=` adresine yönlendirir.
- İndirme hız kovasını kullanır.

### `GET /api/v1/packages/{name}/readiness`

Gelecekteki OpenClaw tüketimi için hesaplanan hazırlık durumunu döndürür.

Hazırlık denetimleri şunları kapsar:

- resmi kanal durumu
- en son sürüm kullanılabilirliği
- ClawPack npm-pack artifact kullanılabilirliği
- artifact özeti
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

Resmi OpenClaw Plugin taşıma satırlarını listelemek için moderatör uç noktası.

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

Resmi Plugin taşıma satırı oluşturmak veya güncellemek için yönetici uç noktası.

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
- `packageName` npm adına göre normalleştirilir; planlanan
  taşımalar için paket eksik olabilir.
- Bu yalnızca taşıma hazırlığını izler. OpenClaw'u değiştirmez veya
  ClawPack üretmez.

### `GET /api/v1/packages/moderation/queue`

Paket yayını inceleme kuyrukları için moderatör/yönetici uç noktası.

Kimlik doğrulama:

- Moderatör veya yönetici kullanıcı için bir API belirteci gerektirir.

Sorgu parametreleri:

- `status` (isteğe bağlı): `open` (varsayılan), `blocked`, `manual` veya `all`
- `limit` (isteğe bağlı): tamsayı (1-100)
- `cursor` (isteğe bağlı): sayfalama imleci

Durum anlamları:

- `open`: şüpheli, kötü amaçlı, beklemede, karantinaya alınmış, iptal edilmiş veya bildirilmiş yayınlar.
- `blocked`: karantinaya alınmış, iptal edilmiş veya kötü amaçlı yayınlar.
- `manual`: manuel moderasyon geçersiz kılması olan herhangi bir yayın.
- `all`: manuel geçersiz kılması, temiz olmayan tarama durumu veya paket bildirimi olan herhangi bir yayın.

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

Bir paketi moderatör incelemesi için bildirir. Bildirimler paket düzeyindedir ve isteğe bağlı olarak bir sürüme bağlanır. Moderasyon kuyruğunu beslerler ancak tek başlarına indirmeleri otomatik olarak gizlemez veya engellemezler; moderatörler artifact'leri onaylamak, karantinaya almak veya iptal etmek için yayın moderasyonunu kullanmalıdır.

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

Paket bildirim alımı için moderatör/yönetici uç noktası.

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

- Paket sahibi, yayımcı üyesi, moderatör veya
  yönetici kullanıcı için bir API belirteci gerektirir.

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

`note`, `confirmed` ve `dismissed` için gereklidir; `status` yeniden `open` olarak
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

- `approved`: elle incelenmiş ve izin verilmiş.
- `quarantined`: takip işlemi beklerken engellenmiş.
- `revoked`: bir sürüm daha önce güvenilir kabul edildikten sonra engellenmiş.

Karantinaya alınmış ve iptal edilmiş sürümler, yapıt indirme rotalarından `403` döndürür.
Her değişiklik bir denetim günlüğü girdisi yazar.

### `POST /api/v1/packages/backfill/artifacts`

Eski paket sürümlerini açık yapıt türü meta verisiyle etiketlemek için yalnızca yöneticilere yönelik bakım uç noktası.

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

- Varsayılan olarak deneme çalışmasıdır.
- ClawPack depolaması olmayan sürümler `legacy-zip` olarak etiketlenir.
- `artifactKind` eksik olan mevcut ClawPack destekli satırlar
  `npm-pack` olarak onarılır.
- Bu işlem ClawPack oluşturmaz veya yapıt baytlarını değiştirmez.

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
- Bekleyen VirusTotal taramaları okumaları engellemez; kötü amaçlı sürümler başka yerlerde yine de alıkonabilir.
- Özel paketler, çağıran sahip yayımcıyı okuyamıyorsa `404` döndürür.

### `GET /api/v1/packages/{name}/download`

Bir paket sürümü için eski deterministik ZIP arşivini indirir.

Sorgu parametreleri:

- `version` (isteğe bağlı)
- `tag` (isteğe bağlı)

Notlar:

- Varsayılan olarak en son sürümü kullanır.
- Skills `GET /api/v1/download` adresine yönlendirilir.
- Plugin/paket arşivleri, eski OpenClaw istemcilerinin çalışmaya devam etmesi için
  `package/` köküne sahip zip dosyalarıdır.
- Bu rota yalnızca ZIP olarak kalır. ClawPack `.tgz` dosyalarını akıtmaz.
- Yanıtlar, çözücü bütünlük kontrolleri için `ETag`, `Digest`, `X-ClawHub-Artifact-Type` ve
  `X-ClawHub-Artifact-Sha256` başlıklarını içerir.
- Yalnızca kayıt meta verisi indirilen arşive enjekte edilmez.
- Bekleyen VirusTotal taramaları indirmeleri engellemez; kötü amaçlı sürümler `403` döndürür.
- Özel paketler, çağıran sahip değilse `404` döndürür.

### `GET /api/npm/{package}`

ClawPack destekli paket sürümleri için npm uyumlu bir packument döndürür.

Notlar:

- Yalnızca yüklenmiş ClawPack npm-pack tarball'larına sahip sürümler listelenir.
- Eski yalnızca ZIP sürümleri bilerek atlanır.
- `dist.tarball`, `dist.integrity` ve `dist.shasum`, kullanıcılar isterse npm'i aynaya yönlendirebilsin diye npm uyumlu
  alanlar kullanır.
- Kapsamlı paket packument'ları hem `/api/npm/@scope/name` hem de npm'in
  kodlanmış `/api/npm/@scope%2Fname` istek yolunu destekler.

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm ayna istemcileri için yüklenen tam ClawPack tarball baytlarını akıtır.

Notlar:

- İndirme hız kovasını kullanır.
- İndirme başlıkları, ClawHub SHA-256 ile npm integrity/shasum meta verisini içerir.
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
- Geçici olarak silinen sürümler `410` döndürür.
- İndirme istatistikleri saat başına benzersiz kimlikler olarak sayılır (API belirteci geçerliyse `userId`, aksi halde IP).

## Kimlik doğrulama uç noktaları (Bearer belirteci)

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
- İsteğe bağlı yük alanı: `ownerHandle`. Mevcut olduğunda API bu
  yayımcıyı sunucu tarafında çözer ve aktörün yayımcı erişimine sahip olmasını gerektirir.
- İsteğe bağlı yük alanı: `migrateOwner`. `ownerHandle` ile `true` olduğunda, aktör hem
  mevcut hem de hedef yayımcılarda yönetici/sahip ise mevcut bir Skills o sahibe taşınabilir.
  Bu açık onay olmadan sahip değişiklikleri reddedilir.

### `POST /api/v1/packages`

Bir code-plugin veya bundle-plugin sürümü yayımlar.

- Bearer belirteci kimlik doğrulaması gerektirir.
- Tercih edilen: `payload` JSON + `files[]` blob'ları ile `multipart/form-data`.
- `files` içeren JSON gövdesi (storageId tabanlı) de kabul edilir.
- İsteğe bağlı yük alanı: `ownerHandle`. Mevcut olduğunda yalnızca yöneticiler o sahip adına yayımlayabilir.

Doğrulama öne çıkanları:

- `family`, `code-plugin` veya `bundle-plugin` olmalıdır.
- Plugin paketleri `openclaw.plugin.json` gerektirir. ClawPack `.tgz` yüklemeleri
  bunu `package/openclaw.plugin.json` konumunda içermelidir.
- Code plugin'ler `package.json`, kaynak depo meta verisi, kaynak commit
  meta verisi, yapılandırma şeması meta verisi, `openclaw.compat.pluginApi` ve
  `openclaw.build.openclawVersion` gerektirir.
- `openclaw.hostTargets` ve `openclaw.environment` isteğe bağlı meta verilerdir.
- Yalnızca güvenilir yayımcılar `official` kanalına yayımlayabilir.
- Başkası adına yayımlamalar, resmi kanal uygunluğunu yine de hedef sahip hesabına göre doğrular.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Bir Skills'i geçici olarak sil / geri yükle (sahip, moderatör veya yönetici).

İsteğe bağlı JSON gövdesi:

```json
{ "reason": "Held for moderation pending legal review." }
```

Mevcut olduğunda `reason`, Skills moderasyon notu olarak saklanır ve denetim günlüğüne kopyalanır.
Sahip tarafından başlatılan geçici silmeler slug'ı 30 gün boyunca ayırır; ardından slug başka bir
yayımcı tarafından talep edilebilir. Bu sona erme geçerliyse silme yanıtı `slugReservedUntil` içerir.
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

Yalnızca yönetici. Bir tanıtıcı için kuruluş yayımcısının var olmasını sağlar. Tanıtıcı hâlâ
eski paylaşılan kullanıcı/kişisel yayımcıyı gösteriyorsa uç nokta önce onu bir kuruluş yayımcısına taşır.

- Gövde: `{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- Yanıt: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

Yalnızca yönetici. Bir sürüm yayımlamadan kök slug'ları ve paket adlarını hak sahibi için ayırır.
Paket adları, sürüm satırı olmayan özel yer tutucu paketler hâline gelir; böylece aynı
sahip daha sonra gerçek code-plugin veya bundle-plugin sürümünü bu ada yayımlayabilir.

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
- `rename` önceki slug'ı yönlendirme takma adı olarak korur.
- `merge` kaynak listelemeyi gizler ve kaynak slug'ı hedef listelemeye yönlendirir.

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

Bir kullanıcıyı yasaklar ve sahip olunan Skills'leri kalıcı olarak siler (yalnızca moderatör/yönetici).

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

Bir kullanıcının yasağını kaldırır ve uygun Skills'leri geri yükler (yalnızca yönetici).

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
- `limit` (isteğe bağlı): en fazla sonuç (varsayılan 20, en fazla 200)

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

Bir yıldız ekle/kaldır (vurgular). Her iki uç nokta da idempotenttir.

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

CLI, kayıt/kimlik doğrulama ayarlarını siteden keşfedebilir:

- `/.well-known/clawhub.json` (JSON, tercih edilen)
- `/.well-known/clawdhub.json` (eski)

Şema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

Kendi barındırmanızı kullanıyorsanız bu dosyayı sunun (veya `CLAWHUB_REGISTRY` değerini açıkça ayarlayın; eski `CLAWDHUB_REGISTRY`).

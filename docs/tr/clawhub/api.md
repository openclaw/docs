---
read_when:
    - API istemcileri oluşturma
    - Uç noktalar veya şemalar ekleme
summary: Genel REST API'sine (v1) genel bakış ve kurallar.
x-i18n:
    generated_at: "2026-07-16T16:43:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Temel: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Herkese açık kataloğun yeniden kullanımı

ClawHub'ın herkese açık okuma API'leri üzerinde üçüncü taraf bir katalog, dizin veya arama yüzeyi oluşturabilirsiniz. Herkese açık skill meta verileri ve skill dosyaları ClawHub'ın skill lisansı kuralları kapsamında yayımlanırken API'nin kendisi hız sınırlamasına tabidir ve sorumlu bir şekilde kullanılmalıdır.

Yönergeler:

- Katalog listeleri için `GET /api/v1/skills`, `GET /api/v1/search` ve `GET /api/v1/skills/{slug}` gibi herkese açık okuma uç noktalarını kullanın.
- Yanıtları önbelleğe alın ve yoğun sorgulama yapmak yerine `429`, `Retry-After` ve hız sınırı üstbilgilerine uyun.
- Kullanıcıların kaynak kayıt defteri kaydını inceleyebilmesi için listeleri görüntülerken kanonik ClawHub skill URL'sine bağlantı verin.
- `https://clawhub.ai/<owner>/skills/<slug>` biçimindeki kanonik sayfa URL'lerini kullanın.
- ClawHub'ın üçüncü taraf siteyi desteklediğini, doğruladığını veya işlettiğini ima etmeyin.
- Herkese açık API filtrelerini veya kimlik doğrulama sınırlarını aşarak gizli, özel ya da moderasyon tarafından engellenmiş içerikleri yansıtmayın.

## Kimlik doğrulama

- Herkese açık okuma: belirteç gerekmez.
- Yazma + hesap: `Authorization: Bearer clh_...`.

## Hız sınırları

Kimlik doğrulamayı dikkate alan uygulama:

- Anonim istekler: IP başına.
- Kimliği doğrulanmış istekler (geçerli Bearer belirteci): kullanıcı havuzu başına.
- Eksik/geçersiz belirteç, IP tabanlı uygulamaya geri döner.

- Okuma: IP başına dakikada 3000, anahtar başına dakikada 12000
- Yazma: IP başına dakikada 300, anahtar başına dakikada 3000
- İndirme: IP başına dakikada 1200, anahtar başına dakikada 6000

Üstbilgiler: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining` ve `Retry-After`, `429` üzerinde yer alır.

Anlamları:

- `X-RateLimit-Reset`: Unix epoch saniyesi (mutlak sıfırlama zamanı)
- `RateLimit-Reset`: sıfırlamaya kadar olan gecikme süresi, saniye cinsinden
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: mevcut olduğunda kalan kesin bütçe; parçalanmış başarılı istekler yaklaşık bir genel değer döndürmek yerine bunu atlar
- `Retry-After`: `429` durumunda beklenecek gecikme süresi, saniye cinsinden

Örnek `429`:

```http
HTTP/2 429
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34
```

İstemci işlemesi:

- Mevcut olduğunda `Retry-After` değerini tercih edin.
- Aksi hâlde `RateLimit-Reset` değerini kullanın veya gecikmeyi `X-RateLimit-Reset` değerinden türetin.
- Yeniden denemelere rastgele sapma ekleyin.

## Hatalar

- v1 hataları; `400`, `401`, `403`, `404`, `429` ve engellenmiş indirme yanıtları dâhil olmak üzere düz metindir (`text/plain; charset=utf-8`).
- Bilinmeyen sorgu parametreleri uyumluluk amacıyla yok sayılır.
- Geçersiz değerlere sahip bilinen sorgu parametreleri `400` döndürür.

## Uç noktalar

Herkese açık okuma:

- `GET /api/v1/search?q=...`
  - İsteğe bağlı filtreler: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Eski takma ad: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (varsayılan), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`); eski kurulum takma adları `installsCurrent`/`installs`/`installsAllTime`, `downloads` ve `trending` değerlerine eşlenir
  - Geçersiz `sort` değerleri `400` döndürür
  - `cursor`, `trending` dışındaki sıralamalara uygulanır
  - İsteğe bağlı filtre: `nonSuspiciousOnly=true`
  - Eski takma ad: `nonSuspicious=true`
  - `nonSuspiciousOnly=true` ile imleç tabanlı sayfalar `limit` öğeden daha azını içerebilir; devam etmek için `nextCursor` kullanın.
  - `recommended`, etkileşim ve güncellik sinyallerini kullanır.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Barındırılan skill'ler deterministik ZIP baytları döndürür.
  - `clean` veya `suspicious` taramasına sahip mevcut GitHub destekli skill'ler, ClawHub baytları yerine bir JSON `public-github` devir tanımlayıcısı döndürür.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Barındırılan skill'ler, depolandıkları biçimde dosyalar olarak dışa aktarılır.
  - `clean` veya `suspicious` taramasına sahip mevcut GitHub destekli skill'ler, `public-github` devir tanımlayıcıları olarak dışa aktarılır.
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (varsayılan), `recommended`, `downloads`, eski takma ad `installs`
  - Geçersiz `sort` değerleri `400` döndürür
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (varsayılan), `downloads`, `updated`, eski takma ad `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

Kimlik doğrulama gerekli:

- `POST /api/v1/skills` (yayımlama, multipart tercih edilir)
- `DELETE /api/v1/skills/{slug}`
- `DELETE /api/v1/packages/{name}`
- `POST /api/v1/skills/{slug}/undelete`
- `POST /api/v1/packages/{name}/undelete`
- `POST /api/v1/skills/{slug}/rename`
- `POST /api/v1/skills/{slug}/merge`
- `POST /api/v1/skills/{slug}/transfer`
- `POST /api/v1/packages/{name}/transfer`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
- `GET /api/v1/plugins/export?startDate=&endDate=&limit=&cursor=&family=`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

Yalnızca yönetici:

- `POST /api/v1/users/reserve`, bir sahip kullanıcı adı için kök kısa adları ve sürümü olmayan özel paket yer tutucularını ayırır.

## Eski sürüm

Eski `/api/*` ve `/api/cli/*` hâlâ kullanılabilir. Bkz. `DEPRECATIONS.md`.

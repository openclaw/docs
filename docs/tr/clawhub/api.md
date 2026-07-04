---
read_when:
    - API istemcileri oluşturma
    - Uç noktalar veya şemalar ekleme
summary: Herkese açık REST API (v1) genel bakışı ve kuralları.
x-i18n:
    generated_at: "2026-07-04T04:02:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Temel: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Genel katalog yeniden kullanımı

ClawHub'ın genel okuma API'lerinin üzerine üçüncü taraf bir katalog, dizin veya arama yüzeyi oluşturabilirsiniz. Genel beceri meta verileri ve beceri dosyaları ClawHub'ın beceri lisansı kuralları kapsamında yayımlanır; API'nin kendisi ise hız sınırına tabidir ve sorumlu şekilde tüketilmelidir.

Yönergeler:

- Katalog listelemeleri için `GET /api/v1/skills`, `GET /api/v1/search` ve `GET /api/v1/skills/{slug}` gibi genel okuma uç noktalarını kullanın.
- Yanıtları önbelleğe alın ve agresif yoklama yapmak yerine `429`, `Retry-After` ve hız sınırı üstbilgilerine uyun.
- Listelemeleri gösterirken kanonik ClawHub beceri URL'sine bağlantı verin; böylece kullanıcılar kaynak kayıt defteri kaydını inceleyebilir.
- Kanonik sayfa URL'lerini `https://clawhub.ai/<owner>/skills/<slug>` biçiminde kullanın.
- ClawHub'ın üçüncü taraf siteyi onayladığını, doğruladığını veya işlettiğini ima etmeyin.
- Genel API filtrelerini veya kimlik doğrulama sınırlarını atlayarak gizli, özel ya da moderasyon tarafından engellenmiş içeriği yansıtmayın.

## Kimlik doğrulama

- Genel okuma: belirteç gerekmez.
- Yazma + hesap: `Authorization: Bearer clh_...`.

## Hız sınırları

Kimlik doğrulamaya duyarlı uygulama:

- Anonim istekler: IP başına.
- Kimliği doğrulanmış istekler (geçerli Bearer belirteci): kullanıcı kovası başına.
- Eksik/geçersiz belirteç IP tabanlı uygulamaya geri döner.

- Okuma: IP başına 3000/dk, anahtar başına 12000/dk
- Yazma: IP başına 300/dk, anahtar başına 3000/dk
- İndirme: IP başına 1200/dk, anahtar başına 6000/dk

Üstbilgiler: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining` ve `Retry-After`, `429` durumunda dahil edilir.

Anlamlar:

- `X-RateLimit-Reset`: Unix epoch saniyeleri (mutlak sıfırlama zamanı)
- `RateLimit-Reset`: sıfırlamaya kadar gecikme saniyesi
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: mevcut olduğunda tam kalan bütçe;
  parçalı başarılı istekler, yaklaşık bir genel değer döndürmek yerine bunu atlar
- `Retry-After`: `429` durumunda beklenecek gecikme saniyesi

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

İstemci davranışı:

- Mevcut olduğunda `Retry-After` tercih edin.
- Aksi halde `RateLimit-Reset` kullanın veya gecikmeyi `X-RateLimit-Reset` değerinden türetin.
- Yeniden denemelere jitter ekleyin.

## Hatalar

- v1 hataları, `400`, `401`, `403`, `404`, `429` ve engellenmiş indirme yanıtları dahil olmak üzere düz metindir (`text/plain; charset=utf-8`).
- Bilinmeyen sorgu parametreleri uyumluluk için yok sayılır.
- Geçersiz değerlere sahip bilinen sorgu parametreleri `400` döndürür.

## Uç noktalar

Genel okuma:

- `GET /api/v1/search?q=...`
  - İsteğe bağlı filtreler: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Eski takma ad: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (varsayılan), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), eski kurulum takma adları `installsCurrent`/`installs`/`installsAllTime` `downloads` değerine eşlenir, `trending`
  - Geçersiz `sort` değerleri `400` döndürür
  - `cursor`, `trending` olmayan sıralamalara uygulanır
  - İsteğe bağlı filtre: `nonSuspiciousOnly=true`
  - Eski takma ad: `nonSuspicious=true`
  - `nonSuspiciousOnly=true` ile imleç tabanlı sayfalar `limit` değerinden daha az öğe içerebilir; devam etmek için `nextCursor` kullanın.
  - `recommended`, etkileşim ve güncellik sinyallerini kullanır.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Barındırılan beceriler deterministik ZIP baytları döndürür.
  - `clean` veya `suspicious` taraması olan geçerli GitHub destekli beceriler,
    ClawHub baytları yerine JSON `public-github` devir tanımlayıcısı döndürür.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Barındırılan beceriler saklanan dosyalar olarak dışa aktarılır.
  - `clean` veya `suspicious` taraması olan geçerli GitHub destekli beceriler
    `public-github` devir tanımlayıcıları olarak dışa aktarılır.
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

- `POST /api/v1/users/reserve`, bir sahip tanıtıcısı için kök slug'ları ve özel yayınsız paket yer tutucularını ayırır.

## Eski

Eski `/api/*` ve `/api/cli/*` hâlâ kullanılabilir. `DEPRECATIONS.md` dosyasına bakın.

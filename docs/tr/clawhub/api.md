---
read_when:
    - API istemcileri oluşturma
    - Uç noktalar veya şemalar ekleme
summary: Herkese açık REST API (v1) genel bakışı ve kuralları.
x-i18n:
    generated_at: "2026-05-12T00:55:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b6bb020fec1f8aca039dab4d1a09f7a42c64158ad48bf061ce5dbda819d1987
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Temel: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Genel katalog yeniden kullanımı

ClawHub'ın genel okuma API'leri üzerine üçüncü taraf bir katalog, dizin veya arama yüzeyi oluşturabilirsiniz. Genel beceri meta verileri ve beceri dosyaları ClawHub'ın beceri lisansı kuralları kapsamında yayımlanırken, API'nin kendisi hız sınırına tabidir ve sorumlu şekilde tüketilmelidir.

Yönergeler:

- Katalog listeleri için `GET /api/v1/skills`, `GET /api/v1/search` ve `GET /api/v1/skills/{slug}` gibi genel okuma uç noktalarını kullanın.
- Agresif yoklama yapmak yerine yanıtları önbelleğe alın ve `429`, `Retry-After` ile hız sınırı üst bilgilerine uyun.
- Listelemeleri görüntülerken kullanıcıların kaynak kayıt defteri kaydını inceleyebilmesi için kanonik ClawHub beceri URL'sine geri bağlantı verin.
- `https://clawhub.ai/<owner>/<slug>` biçimindeki kanonik sayfa URL'lerini kullanın.
- ClawHub'ın üçüncü taraf siteyi desteklediğini, doğruladığını veya işlettiğini ima etmeyin.
- Genel API filtrelerini veya kimlik doğrulama sınırlarını aşarak gizli, özel ya da moderasyonla engellenmiş içeriği yansıtmayın.

## Kimlik doğrulama

- Genel okuma: belirteç gerekmez.
- Yazma + hesap: `Authorization: Bearer clh_...`.

## Hız sınırları

Kimlik doğrulama duyarlı zorlama:

- Anonim istekler: IP başına.
- Kimliği doğrulanmış istekler (geçerli Bearer belirteci): kullanıcı kovası başına.
- Eksik/geçersiz belirteç, IP tabanlı zorlamaya geri döner.

- Okuma: IP başına 600/dk, anahtar başına 2400/dk
- Yazma: IP başına 45/dk, anahtar başına 180/dk

Üst bilgiler: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After` (`429` durumunda).

Anlamsal bilgiler:

- `X-RateLimit-Reset`: Unix epoch saniyesi (mutlak sıfırlama zamanı)
- `RateLimit-Reset`: sıfırlamaya kadar gecikme saniyesi
- `Retry-After`: `429` durumunda beklenmesi gereken gecikme saniyesi

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

İstemci işleme:

- Varsa `Retry-After` değerini tercih edin.
- Aksi halde `RateLimit-Reset` kullanın veya gecikmeyi `X-RateLimit-Reset` değerinden türetin.
- Yeniden denemelere jitter ekleyin.

## Uç noktalar

Genel okuma:

- `GET /api/v1/search?q=...`
  - İsteğe bağlı filtreler: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Eski takma ad: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (varsayılan), `createdAt` (`newest`), `downloads`, `stars` (`rating`), `installsCurrent` (`installs`), `installsAllTime`, `trending`
  - `cursor`, `trending` dışındaki sıralamalara uygulanır
  - İsteğe bağlı filtre: `nonSuspiciousOnly=true`
  - Eski takma ad: `nonSuspicious=true`
  - `nonSuspiciousOnly=true` ile imleç tabanlı sayfalar `limit` değerinden daha az öğe içerebilir; devam etmek için `nextCursor` kullanın.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
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
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

Yalnızca yönetici:

- `POST /api/v1/users/reserve`, kök slug'ları ve bir sahip kullanıcı adı için özel yayımsız paket yer tutucularını rezerve eder.

## Eski

Eski `/api/*` ve `/api/cli/*` hâlâ kullanılabilir. Bkz. `DEPRECATIONS.md`.

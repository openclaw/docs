---
read_when:
    - API istemcileri oluşturma
    - Uç noktalar veya şemalar ekleme
summary: Herkese açık REST API (v1) genel bakışı ve kuralları.
x-i18n:
    generated_at: "2026-05-13T04:17:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: b47be9d71678924ec43f061a1013776695facc1ee8017397b07e24faa65fc154
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Temel: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Herkese açık kataloğun yeniden kullanımı

ClawHub'ın herkese açık okuma API'leri üzerine üçüncü taraf bir katalog, dizin veya arama yüzeyi oluşturabilirsiniz. Herkese açık skill meta verileri ve skill dosyaları ClawHub'ın skill lisansı kuralları kapsamında yayımlanırken, API'nin kendisi hız sınırlıdır ve sorumlu şekilde tüketilmelidir.

Yönergeler:

- Katalog listelemeleri için `GET /api/v1/skills`, `GET /api/v1/search` ve `GET /api/v1/skills/{slug}` gibi herkese açık okuma uç noktalarını kullanın.
- Yanıtları önbelleğe alın ve agresif yoklama yapmak yerine `429`, `Retry-After` ve hız sınırı üst bilgilerine uyun.
- Listelemeleri gösterirken kullanıcıların kaynak kayıt defteri kaydını inceleyebilmesi için kanonik ClawHub skill URL'sine geri bağlantı verin.
- `https://clawhub.ai/<owner>/<slug>` biçimindeki kanonik sayfa URL'lerini kullanın.
- ClawHub'ın üçüncü taraf siteyi onayladığını, doğruladığını veya işlettiğini ima etmeyin.
- Herkese açık API filtrelerini veya kimlik doğrulama sınırlarını atlayarak gizli, özel ya da moderasyon tarafından engellenmiş içeriği yansıtmayın.

## Kimlik doğrulama

- Herkese açık okuma: belirteç gerekmez.
- Yazma + hesap: `Authorization: Bearer clh_...`.

## Hız sınırları

Kimlik doğrulamaya duyarlı uygulama:

- Anonim istekler: IP başına.
- Kimliği doğrulanmış istekler (geçerli Bearer belirteci): kullanıcı kovası başına.
- Eksik/geçersiz belirteç IP tabanlı uygulamaya geri döner.

- Okuma: IP başına 600/dk, anahtar başına 2400/dk
- Yazma: IP başına 45/dk, anahtar başına 180/dk

Üst bilgiler: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After` (`429` durumunda).

Anlamlar:

- `X-RateLimit-Reset`: Unix epoch saniyeleri (mutlak sıfırlama zamanı)
- `RateLimit-Reset`: sıfırlamaya kadar gecikme saniyeleri
- `Retry-After`: `429` durumunda beklenmesi gereken gecikme saniyeleri

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

- Mevcut olduğunda `Retry-After` tercih edin.
- Aksi halde `RateLimit-Reset` kullanın veya gecikmeyi `X-RateLimit-Reset` değerinden türetin.
- Yeniden denemelere jitter ekleyin.

## Uç noktalar

Herkese açık okuma:

- `GET /api/v1/search?q=...`
  - İsteğe bağlı filtreler: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Eski takma ad: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (varsayılan), `createdAt` (`newest`), `downloads`, `stars` (`rating`), `installsCurrent` (`installs`), `installsAllTime`, `trending`
  - `cursor`, `trending` dışındaki sıralamalar için geçerlidir
  - İsteğe bağlı filtre: `nonSuspiciousOnly=true`
  - Eski takma ad: `nonSuspicious=true`
  - `nonSuspiciousOnly=true` ile, imleç tabanlı sayfalar `limit` değerinden daha az öğe içerebilir; devam etmek için `nextCursor` kullanın.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

Kimlik doğrulama gerekli:

- `POST /api/v1/skills` (yayımla, multipart tercih edilir)
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

- `POST /api/v1/users/reserve`, bir sahip tanıtıcısı için kök slug'ları ve özel sürümsüz paket yer tutucularını ayırır.

## Eski

Eski `/api/*` ve `/api/cli/*` hâlâ kullanılabilir. Bkz. `DEPRECATIONS.md`.

---
read_when:
    - API istemcileri oluşturma
    - Uç noktalar veya şemalar ekleme
summary: Genel REST API'sine (v1) genel bakış ve kurallar.
x-i18n:
    generated_at: "2026-07-12T12:08:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

Temel adres: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## Herkese açık kataloğun yeniden kullanımı

ClawHub'ın herkese açık okuma API'leri üzerinde üçüncü taraf bir katalog, dizin veya arama arayüzü oluşturabilirsiniz. Herkese açık skill meta verileri ve skill dosyaları ClawHub'ın skill lisansı kuralları kapsamında yayımlanır; API ise hız sınırlamasına tabidir ve sorumlu biçimde kullanılmalıdır.

Yönergeler:

- Katalog listeleri için `GET /api/v1/skills`, `GET /api/v1/search` ve `GET /api/v1/skills/{slug}` gibi herkese açık okuma uç noktalarını kullanın.
- Yanıtları önbelleğe alın; yoğun biçimde yoklama yapmak yerine `429`, `Retry-After` ve hız sınırı üstbilgilerine uyun.
- Kullanıcıların kaynak kayıt defteri kaydını inceleyebilmesi için listeleri görüntülerken standart ClawHub skill URL'sine bağlantı verin.
- `https://clawhub.ai/<owner>/skills/<slug>` biçimindeki standart sayfa URL'lerini kullanın.
- ClawHub'ın üçüncü taraf siteyi desteklediğini, doğruladığını veya işlettiğini ima etmeyin.
- Herkese açık API filtrelerini veya kimlik doğrulama sınırlarını aşarak gizli, özel ya da moderasyon nedeniyle engellenmiş içerikleri yansıtmayın.

## Kimlik doğrulama

- Herkese açık okuma: belirteç gerekmez.
- Yazma + hesap: `Authorization: Bearer clh_...`.

## Hız sınırları

Kimlik doğrulama durumuna duyarlı uygulama:

- Anonim istekler: IP başına.
- Kimliği doğrulanmış istekler (geçerli Bearer belirteci): kullanıcı dilimi başına.
- Eksik/geçersiz belirteç, IP tabanlı uygulamaya geri döner.

- Okuma: IP başına dakikada 3000, anahtar başına dakikada 12000
- Yazma: IP başına dakikada 300, anahtar başına dakikada 3000
- İndirme: IP başına dakikada 1200, anahtar başına dakikada 6000

Üstbilgiler: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`429` yanıtlarında `X-RateLimit-Remaining`, `RateLimit-Remaining` ve `Retry-After` bulunur.

Anlamları:

- `X-RateLimit-Reset`: Unix çağ saniyesi (mutlak sıfırlanma zamanı)
- `RateLimit-Reset`: sıfırlanmaya kadar geçen gecikme süresi, saniye cinsinden
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: mevcut olduğunda kalan kesin kota;
  parçalanmış başarılı isteklerde yaklaşık bir genel değer döndürmek yerine bu alan
  atlanır
- `Retry-After`: `429` durumunda beklenecek süre, saniye cinsinden

`429` örneği:

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

- v1 hataları; `400`, `401`, `403`, `404`, `429` ve engellenmiş indirme yanıtları
  dâhil olmak üzere düz metindir (`text/plain; charset=utf-8`).
- Bilinmeyen sorgu parametreleri uyumluluk amacıyla yok sayılır.
- Geçersiz değerlere sahip bilinen sorgu parametreleri `400` döndürür.

## Uç noktalar

Herkese açık okuma:

- `GET /api/v1/search?q=...`
  - İsteğe bağlı filtreler: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Eski takma ad: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (varsayılan), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`); eski kurulum takma adları `installsCurrent`/`installs`/`installsAllTime`, `downloads` değerine eşlenir; `trending`
  - Geçersiz `sort` değerleri `400` döndürür
  - `cursor`, `trending` dışındaki sıralamalara uygulanır
  - İsteğe bağlı filtre: `nonSuspiciousOnly=true`
  - Eski takma ad: `nonSuspicious=true`
  - `nonSuspiciousOnly=true` kullanıldığında imleç tabanlı sayfalar `limit` değerinden daha az öğe içerebilir; devam etmek için `nextCursor` kullanın.
  - `recommended`, etkileşim ve güncellik sinyallerini kullanır.
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Barındırılan skill'ler belirlenimci ZIP baytları döndürür.
  - `clean` veya `suspicious` taramasına sahip, GitHub destekli güncel skill'ler
    ClawHub baytları yerine JSON biçiminde bir `public-github` aktarım tanımlayıcısı döndürür.
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Barındırılan skill'ler, saklanan dosyalar olarak dışa aktarılır.
  - `clean` veya `suspicious` taramasına sahip, GitHub destekli güncel skill'ler
    `public-github` aktarım tanımlayıcıları olarak dışa aktarılır.
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

- `POST /api/v1/skills` (yayımlama, çok parçalı biçim tercih edilir)
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

Eski `/api/*` ve `/api/cli/*` hâlâ kullanılabilir. `DEPRECATIONS.md` dosyasına bakın.

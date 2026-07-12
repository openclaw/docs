---
read_when:
    - OpenResponses API'sini kullanan istemcileri entegre etme
    - Öğe tabanlı girdiler, istemci araç çağrıları veya SSE olayları istiyorsunuz
summary: Gateway üzerinden OpenResponses uyumlu bir /v1/responses HTTP uç noktası sunun
title: OpenResponses API’si
x-i18n:
    generated_at: "2026-07-12T11:46:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fcf5016d1455383181923ec31b26cf31533b990045df300f0356f135c95579
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Gateway, OpenResponses uyumlu bir `POST /v1/responses` uç noktası sunabilir. Bu uç nokta **varsayılan olarak devre dışıdır** ve Gateway ile aynı bağlantı noktasını paylaşır (WS + HTTP çoklama): `http://<gateway-host>:<port>/v1/responses`.

İstekler normal bir Gateway aracı çalıştırması olarak yürütülür (`openclaw agent` ile aynı kod yolu); dolayısıyla yönlendirme, izinler ve yapılandırma Gateway'inizle eşleşir.

`gateway.http.endpoints.responses.enabled` ile etkinleştirin veya devre dışı bırakın. Etkinleştirildiğinde aynı uyumluluk yüzeyi ayrıca `GET /v1/models`, `GET /v1/models/{id}`, `POST /v1/embeddings` ve `POST /v1/chat/completions` uç noktalarını da sunar.

## Kimlik doğrulama, güvenlik ve yönlendirme

İşletim davranışı [OpenAI Chat Completions](/tr/gateway/openai-http-api) ile eşleşir:

- Kimlik doğrulama yolu `gateway.auth.mode` ile eşleşir: paylaşılan gizli bilgi (`token`/`password`), `Authorization: Bearer <token-or-password>` kullanır; güvenilen proxy, kimlik bilgisine duyarlı proxy üstbilgilerini kullanır (aynı ana makinedeki local loopback proxy'leri için `gateway.auth.trustedProxy.allowLoopback = true` gerekir; `Forwarded`/`X-Forwarded-*`/`X-Real-IP` üstbilgisi bulunmadığında `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` üzerinden aynı ana makinede doğrudan geri dönüş sağlanır); özel girişte `none` için kimlik doğrulama üstbilgisi gerekmez. Bkz. [Güvenilen proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth).
- Uç noktayı Gateway örneğine tam operatör erişimi olarak değerlendirin.
- Paylaşılan gizli bilgi kimlik doğrulama modları, bearer tarafından bildirilen daha dar bir `x-openclaw-scopes` değerini yok sayar ve tam varsayılan operatör kapsamı kümesini geri yükler: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Bu uç noktadaki sohbet turları, sahip-gönderen turları olarak değerlendirilir.
- Güvenilen ve kimlik taşıyan HTTP modları (güvenilen proxy veya `gateway.auth.mode="none"`), mevcut olduğunda `x-openclaw-scopes` değerine uyar; aksi takdirde varsayılan operatör kapsamı kümesine geri döner. Sahip semantiği yalnızca çağıran taraf kapsamları açıkça daraltıp `operator.admin` kapsamını çıkardığında kaybolur.
- Aracıları `model: "openclaw"`, `"openclaw/default"`, `"openclaw/<agentId>"` veya `x-openclaw-agent-id` üstbilgisiyle seçin.
- Seçilen aracının arka uç modelini geçersiz kılmak için `x-openclaw-model` kullanın (kimlik taşıyan kimlik doğrulama yollarında `operator.admin` gerektirir).
- Açık oturum yönlendirmesi için `x-openclaw-session-key` kullanın (ayrılmış bir ad alanı kullanıyorsa `400 invalid_request_error` ile reddedilir: `subagent:`, `cron:`, `acp:`).
- Varsayılan olmayan sentetik giriş kanalı bağlamı için `x-openclaw-message-channel` kullanın.

Aracı hedefleyen modellerin, `openclaw/default` değerinin, gömme aktarımının ve arka uç model geçersiz kılmalarının standart açıklaması için [OpenAI Chat Completions](/tr/gateway/openai-http-api#agent-first-model-contract) bölümüne bakın.

Bkz. [Operatör kapsamları](/tr/gateway/operator-scopes) ve [Güvenlik](/tr/gateway/security).

## Oturum davranışı

Uç nokta varsayılan olarak **her istek için durumsuzdur** (her çağrıda yeni bir oturum anahtarı oluşturulur).

İstek bir OpenResponses `user` dizesi içeriyorsa Gateway, yinelenen çağrıların bir aracı oturumunu paylaşabilmesi için bu dizeden kararlı bir oturum anahtarı türetir.

`previous_response_id`, istek aynı aracı/kullanıcı/istenen-oturum kapsamında kaldığında önceki yanıtın oturumunu yeniden kullanır (kimlik doğrulama öznesi, aracı kimliği ve `x-openclaw-session-key` ile eşleştirilir).

## İstek biçimi

| Alan                                                             | Destek                                                                                                                                 |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `input`                                                          | Dize veya öğe nesneleri dizisi.                                                                                                         |
| `instructions`                                                   | Sistem istemiyle birleştirilir.                                                                                                         |
| `tools`                                                          | İstemci araç tanımları (işlev araçları).                                                                                                |
| `tool_choice`                                                    | İstemci araçlarını filtrelemek veya zorunlu kılmak için `"auto"`, `"none"`, `"required"` veya `{ "type": "function", "name": "..." }`. |
| `stream`                                                         | SSE akışını etkinleştirir.                                                                                                              |
| `max_output_tokens`                                              | En iyi çabayla uygulanan çıktı sınırı (sağlayıcıya bağlıdır).                                                                            |
| `temperature`                                                    | En iyi çabayla uygulanan örnekleme sıcaklığı. Sabit sunucu tarafı örnekleme kullanan ChatGPT tabanlı Codex Responses arka ucu tarafından yok sayılır. |
| `top_p`                                                          | En iyi çabayla uygulanan çekirdek örnekleme. `temperature` ile aynı Codex Responses sınırlaması geçerlidir.                             |
| `user`                                                           | Kararlı oturum yönlendirmesi.                                                                                                           |
| `previous_response_id`                                           | Oturum sürekliliği (yukarıya bakın).                                                                                                    |
| `max_tool_calls`, `reasoning`, `metadata`, `store`, `truncation` | Kabul edilir ancak şu anda yok sayılır.                                                                                                  |

## Öğeler (girdi)

### `message`

Roller: `system`, `developer`, `user`, `assistant`.

- `system` ve `developer`, sistem istemine eklenir.
- En son `user` veya `function_call_output` öğesi "geçerli ileti" olur.
- Önceki kullanıcı/aracı iletileri, bağlam için geçmişe dahil edilir.

### `function_call_output` (tur tabanlı araçlar)

Araç sonuçlarını modele geri gönderin:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` ve `item_reference`

Şema uyumluluğu için kabul edilir ancak istem oluşturulurken yok sayılır.

## Araçlar (istemci tarafı işlev araçları)

Araçları `tools: [{ type: "function", name, description?, parameters? }]` ile sağlayın.

Aracı bir araç çağırırsa yanıt bir `function_call` çıktı öğesi döndürür. Tura devam etmek için `function_call_output` içeren bir takip isteği gönderin.

`tool_choice: "required"` ve işleve sabitlenmiş `tool_choice` için uç nokta, kullanıma sunulan istemci işlev araçları kümesini daraltır, çalışma zamanına yanıt vermeden önce bir istemci aracını çağırması talimatını verir ve tur eşleşen yapılandırılmış bir istemci araç çağrısı içermiyorsa `/v1/chat/completions` sözleşmesine uygun biçimde turu reddeder. Akışsız istekler `api_error` ile `502` döndürür; akışlı istekler bir `response.failed` olayı yayınlar.

## Görseller (`input_image`)

Base64 veya URL kaynaklarını destekler:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

İzin verilen MIME türleri (varsayılan): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`. En büyük boyut (varsayılan): 10MB.

## Dosyalar (`input_file`)

Base64 veya URL kaynaklarını destekler:

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

İzin verilen MIME türleri (varsayılan): `text/plain`, `text/markdown`, `text/html`, `text/csv`, `application/json`, `application/pdf`. En büyük boyut (varsayılan): 5MB.

Geçerli davranış:

- Dosya içeriğinin kodu çözülür ve kullanıcı iletisine değil, **sistem istemine** eklenir; böylece geçici kalır (oturum geçmişinde kalıcı hâle getirilmez).
- Kodu çözülmüş dosya metni eklenmeden önce **güvenilmeyen harici içerik** olarak sarmalanır; böylece dosya baytları güvenilen talimatlar olarak değil, veri olarak değerlendirilir. Eklenen blok açık sınır işaretleri (`<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`) ve bir `Source: External` meta veri satırı kullanır. İstem bütçesini korumak için uzun `SECURITY NOTICE:` başlığı kasıtlı olarak eklenmez; sınır işaretleri ve meta veriler yine geçerlidir.
- Önce PDF'lerdeki metin ayrıştırılır. Çok az metin bulunursa ilk sayfalar görsellere dönüştürülür ve modele iletilir; eklenen dosya bloğu `[PDF content rendered to images]` yer tutucusunu kullanır.

PDF ayrıştırma, metin çıkarma ve sayfa oluşturma için `clawpdf` ile paketlenmiş PDFium WebAssembly çalışma zamanını kullanan, paketle birlikte gelen `document-extract` Plugin'i tarafından sağlanır.

URL getirme varsayılanları:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (istek başına URL tabanlı toplam `input_file` + `input_image` parça sayısı)
- İstekler koruma altındadır (DNS çözümleme, özel IP engelleme, yönlendirme sınırları, zaman aşımı süreleri).
- Her girdi türü için isteğe bağlı ana makine adı izin listeleri desteklenir (`files.urlAllowlist`, `images.urlAllowlist`): tam ana makine (`"cdn.example.com"`) veya joker karakterli alt alan adları (`"*.assets.example.com"`, kök alan adıyla eşleşmez). Boş veya belirtilmemiş izin listeleri, ana makine adı izin listesi kısıtlaması olmadığı anlamına gelir.
- URL tabanlı getirmeleri tamamen devre dışı bırakmak için `files.allowUrl: false` ve/veya `images.allowUrl: false` ayarlayın.

## Dosya + görsel sınırları (yapılandırma)

Varsayılanlar `gateway.http.endpoints.responses` altında ayarlanabilir:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 60000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image/heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

Belirtilmediğindeki varsayılanlar:

| Anahtar                  | Varsayılan |
| ------------------------ | ---------- |
| `maxBodyBytes`           | 20MB       |
| `maxUrlParts`            | 8          |
| `files.maxBytes`         | 5MB        |
| `files.maxChars`         | 60k        |
| `files.maxRedirects`     | 3          |
| `files.timeoutMs`        | 10s        |
| `files.pdf.maxPages`     | 4          |
| `files.pdf.maxPixels`    | 4,000,000  |
| `files.pdf.minTextChars` | 200        |
| `images.maxBytes`        | 10MB       |
| `images.maxRedirects`    | 3          |
| `images.timeoutMs`       | 10s        |

HEIC/HEIF `input_image` kaynakları, sağlayıcıya teslim edilmeden önce paylaşılan OpenClaw görsel işleyicisi (Rastermill) aracılığıyla JPEG'e dönüştürülür. Rastermill, harici codec desteği gerektiren biçimler için sistem dönüştürücüsüne (`sips`, ImageMagick, GraphicsMagick veya ffmpeg) geri döner.

Güvenlik notu: URL izin listeleri, getirme işleminden önce ve yönlendirme adımlarında uygulanır. Bir ana makine adını izin listesine eklemek, özel/dahili IP engellemesini atlatmaz. İnternete açık Gateway'ler için uygulama düzeyindeki korumalara ek olarak ağ çıkış denetimleri uygulayın. Bkz. [Güvenlik](/tr/gateway/security).

## Akış (SSE)

Sunucu Tarafından Gönderilen Olayları almak için `stream: true` ayarlayın:

- `Content-Type: text/event-stream`
- Her olay satırı `event: <type>` ve `data: <json>` biçimindedir
- Akış `data: [DONE]` ile sona erer

Şu anda yayımlanan olay türleri: `response.created`, `response.in_progress`, `response.output_item.added`, `response.content_part.added`, `response.output_text.delta`, `response.output_text.done`, `response.content_part.done`, `response.output_item.done`, `response.completed`, `response.failed` (hata durumunda).

## Kullanım

Temel sağlayıcı token sayılarını bildirdiğinde `usage` doldurulur. OpenClaw, bu sayaçlar alt durum/oturum yüzeylerine ulaşmadan önce `input_tokens` / `output_tokens` ve `prompt_tokens` / `completion_tokens` dâhil olmak üzere yaygın OpenAI tarzı diğer adları normalleştirir.

## Hatalar

Hatalar aşağıdaki gibi bir JSON nesnesi kullanır:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Yaygın durumlar: `400` geçersiz istek gövdesi, `401` eksik/geçersiz kimlik doğrulama, `403` eksik operatör kapsamı, `405` yanlış yöntem, `429` çok fazla başarısız kimlik doğrulama girişimi (`Retry-After` ile).

## Örnekler

Akışsız:

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

Akışlı:

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```

## İlgili

- [OpenAI sohbet tamamlamaları](/tr/gateway/openai-http-api)
- [Operatör kapsamları](/tr/gateway/operator-scopes)
- [OpenAI](/tr/providers/openai)

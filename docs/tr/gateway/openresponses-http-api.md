---
read_when:
    - OpenResponses API ile iletişim kuran istemcileri entegre etme
    - Öğe tabanlı girdiler, istemci araç çağrıları veya SSE olayları istiyorsunuz
summary: Gateway'den OpenResponses uyumlu /v1/responses HTTP uç noktasını kullanıma sunun
title: OpenResponses API'si
x-i18n:
    generated_at: "2026-05-06T09:14:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69d46dc448a8856a6f3213f2fbfdba000a342ec4dcf258435b7029102cfb8119
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

OpenClaw'ın Gateway'i OpenResponses uyumlu bir `POST /v1/responses` uç noktası sunabilir.

Bu uç nokta **varsayılan olarak devre dışıdır**. Önce yapılandırmada etkinleştirin.

- `POST /v1/responses`
- Gateway ile aynı port (WS + HTTP çoklama): `http://<gateway-host>:<port>/v1/responses`

Kaputun altında istekler normal bir Gateway agent çalıştırması olarak yürütülür (`openclaw agent` ile aynı kod yolu), bu nedenle yönlendirme/izinler/yapılandırma Gateway'inizle eşleşir.

## Kimlik doğrulama, güvenlik ve yönlendirme

Operasyonel davranış [OpenAI Sohbet Tamamlamaları](/tr/gateway/openai-http-api) ile eşleşir:

- eşleşen Gateway HTTP kimlik doğrulama yolunu kullanın:
  - paylaşılan gizli kimlik doğrulaması (`gateway.auth.mode="token"` veya `"password"`): `Authorization: Bearer <token-or-password>`
  - güvenilen proxy kimlik doğrulaması (`gateway.auth.mode="trusted-proxy"`): yapılandırılmış güvenilen bir proxy kaynağından kimlik farkında proxy üstbilgileri; aynı ana makine local loopback proxy'leri açıkça `gateway.auth.trustedProxy.allowLoopback = true` gerektirir
  - özel giriş açık kimlik doğrulaması (`gateway.auth.mode="none"`): kimlik doğrulama üstbilgisi yok
- uç noktayı gateway örneği için tam operatör erişimi olarak değerlendirin
- paylaşılan gizli kimlik doğrulama modları (`token` ve `password`) için daha dar bearer bildirimli `x-openclaw-scopes` değerlerini yoksayın ve normal tam operatör varsayılanlarını geri yükleyin
- güvenilen kimlik taşıyan HTTP modları için (örneğin güvenilen proxy kimlik doğrulaması veya `gateway.auth.mode="none"`), mevcut olduğunda `x-openclaw-scopes` değerini dikkate alın; aksi halde normal operatör varsayılan kapsam kümesine geri dönün
- agent'ları `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` veya `x-openclaw-agent-id` ile seçin
- seçilen agent'ın arka uç modelini geçersiz kılmak istediğinizde `x-openclaw-model` kullanın
- açık oturum yönlendirmesi için `x-openclaw-session-key` kullanın
- varsayılan olmayan sentetik giriş kanalı bağlamı istediğinizde `x-openclaw-message-channel` kullanın

Kimlik doğrulama matrisi:

- `gateway.auth.mode="token"` veya `"password"` + `Authorization: Bearer ...`
  - paylaşılan gateway operatör gizliliğine sahip olunduğunu kanıtlar
  - daha dar `x-openclaw-scopes` değerlerini yoksayar
  - tam varsayılan operatör kapsam kümesini geri yükler:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - bu uç noktadaki sohbet turlarını sahip-gönderen turları olarak değerlendirir
- güvenilen kimlik taşıyan HTTP modları (örneğin güvenilen proxy kimlik doğrulaması veya özel girişte `gateway.auth.mode="none"`)
  - üstbilgi mevcut olduğunda `x-openclaw-scopes` değerini dikkate alır
  - üstbilgi yoksa normal operatör varsayılan kapsam kümesine geri döner
  - yalnızca çağıran kapsamları açıkça daraltıp `operator.admin` değerini atladığında sahip semantiğini kaybeder

Bu uç noktayı `gateway.http.endpoints.responses.enabled` ile etkinleştirin veya devre dışı bırakın.

Aynı uyumluluk yüzeyi şunları da içerir:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Agent hedefli modellerin, `openclaw/default` değerinin, embeddings geçişinin ve arka uç model geçersiz kılmalarının birlikte nasıl çalıştığına ilişkin kanonik açıklama için [OpenAI Sohbet Tamamlamaları](/tr/gateway/openai-http-api#agent-first-model-contract) ve [Model listesi ve agent yönlendirmesi](/tr/gateway/openai-http-api#model-list-and-agent-routing) bölümlerine bakın.

## Oturum davranışı

Varsayılan olarak uç nokta **istek başına durumsuzdur** (her çağrıda yeni bir oturum anahtarı oluşturulur).

İstek bir OpenResponses `user` dizesi içerirse Gateway bundan kararlı bir oturum anahtarı türetir, böylece tekrarlanan çağrılar bir agent oturumunu paylaşabilir.

## İstek biçimi (desteklenir)

İstek, öğe tabanlı girişle OpenResponses API'sini izler. Geçerli destek:

- `input`: dize veya öğe nesneleri dizisi.
- `instructions`: sistem prompt'una birleştirilir.
- `tools`: istemci araç tanımları (function araçları).
- `tool_choice`: istemci araçlarını filtreler veya zorunlu kılar.
- `stream`: SSE akışını etkinleştirir.
- `max_output_tokens`: en iyi çabayla çıktı sınırı (sağlayıcıya bağlı).
- `user`: kararlı oturum yönlendirmesi.

Kabul edilir ancak **şu anda yoksayılır**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Desteklenir:

- `previous_response_id`: İstek aynı agent/kullanıcı/istenen-oturum kapsamı içinde kaldığında OpenClaw önceki yanıt oturumunu yeniden kullanır.

## Öğeler (giriş)

### `message`

Roller: `system`, `developer`, `user`, `assistant`.

- `system` ve `developer` sistem prompt'una eklenir.
- En son `user` veya `function_call_output` öğesi "geçerli ileti" olur.
- Önceki kullanıcı/assistant iletileri bağlam için geçmiş olarak dahil edilir.

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

Şema uyumluluğu için kabul edilir, ancak prompt oluşturulurken yoksayılır.

## Araçlar (istemci tarafı function araçları)

Araçları `tools: [{ type: "function", function: { name, description?, parameters? } }]` ile sağlayın.

Agent bir aracı çağırmaya karar verirse yanıt bir `function_call` çıktı öğesi döndürür.
Ardından turu sürdürmek için `function_call_output` ile bir takip isteği gönderirsiniz.

## Görseller (`input_image`)

Base64 veya URL kaynaklarını destekler:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

İzin verilen MIME türleri (geçerli): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
Maksimum boyut (geçerli): 10MB.

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

İzin verilen MIME türleri (geçerli): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

Maksimum boyut (geçerli): 5MB.

Geçerli davranış:

- Dosya içeriği çözümlenir ve kullanıcı iletisine değil **sistem prompt'una** eklenir,
  böylece geçici kalır (oturum geçmişinde kalıcılaştırılmaz).
- Çözümlenen dosya metni eklenmeden önce **güvenilmeyen harici içerik** olarak sarmalanır,
  böylece dosya baytları güvenilen talimatlar olarak değil, veri olarak değerlendirilir.
- Enjekte edilen blok
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` gibi açık sınır işaretçileri kullanır ve bir
  `Source: External` meta veri satırı içerir.
- Bu dosya girişi yolu, prompt bütçesini korumak için uzun `SECURITY NOTICE:` başlığını bilinçli olarak atlar; sınır işaretçileri ve meta veriler yine de yerinde kalır.
- PDF'ler önce metin için ayrıştırılır. Az metin bulunursa ilk sayfalar
  görsellere rasterleştirilip modele iletilir ve enjekte edilen dosya bloğu
  `[PDF content rendered to images]` yer tutucusunu kullanır.

PDF ayrıştırması, Node dostu eski `pdfjs-dist` derlemesini (worker yok) kullanan birlikte gelen `document-extract` Plugin'i tarafından sağlanır. Modern PDF.js derlemesi tarayıcı worker'ları/DOM global'leri bekler, bu nedenle Gateway'de kullanılmaz.

URL getirme varsayılanları:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (istek başına toplam URL tabanlı `input_file` + `input_image` parçaları)
- İstekler korumalıdır (DNS çözümleme, özel IP engelleme, yönlendirme sınırları, zaman aşımları).
- Girdi türü başına isteğe bağlı ana makine adı izin listeleri desteklenir (`files.urlAllowlist`, `images.urlAllowlist`).
  - Tam ana makine: `"cdn.example.com"`
  - Joker alt etki alanları: `"*.assets.example.com"` (apex ile eşleşmez)
  - Boş veya atlanmış izin listeleri, ana makine adı izin listesi kısıtlaması olmadığı anlamına gelir.
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
            maxChars: 200000,
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

Atlandığında varsayılanlar:

- `maxBodyBytes`: 20MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5MB
- `files.maxChars`: 200k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4,000,000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10s
- HEIC/HEIF `input_image` kaynakları kabul edilir ve sağlayıcıya teslim edilmeden önce JPEG'e normalize edilir.

Güvenlik notu:

- URL izin listeleri getirme öncesinde ve yönlendirme sıçramalarında uygulanır.
- Bir ana makine adını izin listesine almak özel/dahili IP engellemeyi atlatmaz.
- İnternete açık gateway'ler için uygulama düzeyi korumalara ek olarak ağ çıkış denetimleri uygulayın.
  Bkz. [Güvenlik](/tr/gateway/security).

## Akış (SSE)

Server-Sent Events (SSE) almak için `stream: true` ayarlayın:

- `Content-Type: text/event-stream`
- Her olay satırı `event: <type>` ve `data: <json>` şeklindedir
- Akış `data: [DONE]` ile biter

Şu anda yayımlanan olay türleri:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (hatada)

## Kullanım

Temel sağlayıcı token sayılarını raporladığında `usage` doldurulur.
OpenClaw, bu sayaçlar aşağı akış durum/oturum yüzeylerine ulaşmadan önce yaygın OpenAI tarzı diğer adları normalize eder; bunlara `input_tokens` / `output_tokens` ve `prompt_tokens` / `completion_tokens` dahildir.

## Hatalar

Hatalar şu şekilde bir JSON nesnesi kullanır:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Yaygın durumlar:

- `401` eksik/geçersiz kimlik doğrulama
- `400` geçersiz istek gövdesi
- `405` yanlış yöntem

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

Akış:

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
- [OpenAI](/tr/providers/openai)

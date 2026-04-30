---
read_when:
    - OpenResponses API'sini kullanan istemcileri entegre etme
    - Öğe tabanlı girdiler, istemci araç çağrıları veya SSE olayları istiyorsunuz
summary: Gateway üzerinden OpenResponses uyumlu /v1/responses HTTP uç noktasını kullanıma açın
title: OpenResponses API'si
x-i18n:
    generated_at: "2026-04-30T09:23:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1cfba4c2572fab2d2ef6bceecd1ae0a022850c46125c62d5a5f3969d07d03aff
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

OpenClaw’ın Gateway’i OpenResponses uyumlu bir `POST /v1/responses` endpoint’i sunabilir.

Bu endpoint **varsayılan olarak devre dışıdır**. Önce yapılandırmada etkinleştirin.

- `POST /v1/responses`
- Gateway ile aynı port (WS + HTTP multiplex): `http://<gateway-host>:<port>/v1/responses`

Arka planda, istekler normal bir Gateway ajan çalıştırması olarak yürütülür (`openclaw agent` ile aynı kod yolu), bu nedenle yönlendirme/izinler/yapılandırma Gateway’inizle eşleşir.

## Kimlik doğrulama, güvenlik ve yönlendirme

Operasyonel davranış [OpenAI Chat Completions](/tr/gateway/openai-http-api) ile eşleşir:

- eşleşen Gateway HTTP kimlik doğrulama yolunu kullanın:
  - paylaşılan gizli kimlik doğrulaması (`gateway.auth.mode="token"` veya `"password"`): `Authorization: Bearer <token-or-password>`
  - güvenilir proxy kimlik doğrulaması (`gateway.auth.mode="trusted-proxy"`): yapılandırılmış güvenilir bir proxy kaynağından kimlik duyarlı proxy üstbilgileri; aynı ana makinedeki loopback proxy’leri açıkça `gateway.auth.trustedProxy.allowLoopback = true` gerektirir
  - özel girişte açık kimlik doğrulama (`gateway.auth.mode="none"`): kimlik doğrulama üstbilgisi yok
- endpoint’i gateway örneği için tam operatör erişimi olarak ele alın
- paylaşılan gizli kimlik doğrulama modları (`token` ve `password`) için, daha dar bearer tarafından beyan edilen `x-openclaw-scopes` değerlerini yok sayın ve normal tam operatör varsayılanlarını geri yükleyin
- güvenilir kimlik taşıyan HTTP modları için (örneğin güvenilir proxy kimlik doğrulaması veya `gateway.auth.mode="none"`), mevcut olduğunda `x-openclaw-scopes` değerini dikkate alın, aksi halde normal operatör varsayılan kapsam kümesine geri dönün
- ajanları `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` veya `x-openclaw-agent-id` ile seçin
- seçilen ajanın arka uç modelini geçersiz kılmak istediğinizde `x-openclaw-model` kullanın
- açık oturum yönlendirmesi için `x-openclaw-session-key` kullanın
- varsayılan olmayan sentetik giriş kanalı bağlamı istediğinizde `x-openclaw-message-channel` kullanın

Kimlik doğrulama matrisi:

- `gateway.auth.mode="token"` veya `"password"` + `Authorization: Bearer ...`
  - paylaşılan gateway operatör gizlisine sahip olunduğunu kanıtlar
  - daha dar `x-openclaw-scopes` değerlerini yok sayar
  - tam varsayılan operatör kapsam kümesini geri yükler:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - bu endpoint’teki sohbet dönüşlerini sahip-gönderen dönüşleri olarak ele alır
- güvenilir kimlik taşıyan HTTP modları (örneğin güvenilir proxy kimlik doğrulaması veya özel girişte `gateway.auth.mode="none"`)
  - üstbilgi mevcut olduğunda `x-openclaw-scopes` değerini dikkate alır
  - üstbilgi yoksa normal operatör varsayılan kapsam kümesine geri döner
  - yalnızca çağıran açıkça kapsamları daralttığında ve `operator.admin` öğesini atladığında sahip semantiğini kaybeder

Bu endpoint’i `gateway.http.endpoints.responses.enabled` ile etkinleştirin veya devre dışı bırakın.

Aynı uyumluluk yüzeyi ayrıca şunları içerir:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Ajan hedefli modellerin, `openclaw/default`, embeddings geçişinin ve arka uç model geçersiz kılmalarının birlikte nasıl çalıştığına ilişkin kanonik açıklama için [OpenAI Chat Completions](/tr/gateway/openai-http-api#agent-first-model-contract) ve [Model listesi ve ajan yönlendirmesi](/tr/gateway/openai-http-api#model-list-and-agent-routing) bölümlerine bakın.

## Oturum davranışı

Varsayılan olarak endpoint **istek başına durumsuzdur** (her çağrıda yeni bir oturum anahtarı oluşturulur).

İstek bir OpenResponses `user` dizesi içeriyorsa Gateway bundan kararlı bir oturum anahtarı türetir, böylece tekrarlanan çağrılar bir ajan oturumunu paylaşabilir.

## İstek biçimi (desteklenen)

İstek, öğe tabanlı girişle OpenResponses API’sini izler. Mevcut destek:

- `input`: dize veya öğe nesneleri dizisi.
- `instructions`: sistem prompt’una birleştirilir.
- `tools`: istemci araç tanımları (işlev araçları).
- `tool_choice`: istemci araçlarını filtreler veya zorunlu kılar.
- `stream`: SSE akışını etkinleştirir.
- `max_output_tokens`: en iyi çabayla çıktı sınırı (sağlayıcıya bağlı).
- `user`: kararlı oturum yönlendirmesi.

Kabul edilir ancak **şu anda yok sayılır**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Desteklenen:

- `previous_response_id`: OpenClaw, istek aynı ajan/kullanıcı/istenen oturum kapsamı içinde kaldığında önceki yanıt oturumunu yeniden kullanır.

## Öğeler (giriş)

### `message`

Roller: `system`, `developer`, `user`, `assistant`.

- `system` ve `developer` sistem prompt’una eklenir.
- En son `user` veya `function_call_output` öğesi “geçerli ileti” olur.
- Önceki kullanıcı/asistan iletileri bağlam için geçmiş olarak dahil edilir.

### `function_call_output` (dönüş tabanlı araçlar)

Araç sonuçlarını modele geri gönderin:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` ve `item_reference`

Şema uyumluluğu için kabul edilir ancak prompt oluşturulurken yok sayılır.

## Araçlar (istemci tarafı işlev araçları)

Araçları `tools: [{ type: "function", function: { name, description?, parameters? } }]` ile sağlayın.

Ajan bir aracı çağırmaya karar verirse yanıt bir `function_call` çıktı öğesi döndürür.
Ardından dönüşe devam etmek için `function_call_output` ile takip isteği gönderirsiniz.

## Görseller (`input_image`)

Base64 veya URL kaynaklarını destekler:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

İzin verilen MIME türleri (mevcut): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
Maksimum boyut (mevcut): 10MB.

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

İzin verilen MIME türleri (mevcut): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

Maksimum boyut (mevcut): 5MB.

Mevcut davranış:

- Dosya içeriği çözülür ve kullanıcı iletisine değil **sistem prompt’una** eklenir, böylece geçici kalır (oturum geçmişinde kalıcı olmaz).
- Çözülen dosya metni eklenmeden önce **güvenilmeyen harici içerik** olarak sarılır, böylece dosya baytları güvenilir talimatlar değil, veri olarak ele alınır.
- Enjekte edilen blok `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` gibi açık sınır işaretçileri kullanır ve bir `Source: External` meta veri satırı içerir.
- Bu dosya girişi yolu, prompt bütçesini korumak için uzun `SECURITY NOTICE:` banner’ını bilinçli olarak atlar; sınır işaretçileri ve meta veriler yine de yerinde kalır.
- PDF’ler önce metin için ayrıştırılır. Çok az metin bulunursa ilk sayfalar görsellere rasterleştirilir ve modele geçirilir; enjekte edilen dosya bloğu `[PDF content rendered to images]` yer tutucusunu kullanır.

PDF ayrıştırma, Node dostu `pdfjs-dist` legacy derlemesini (worker yok) kullanan paketli `document-extract` plugin’i tarafından sağlanır. Modern PDF.js derlemesi tarayıcı worker’ları/DOM globallerini bekler, bu nedenle Gateway’de kullanılmaz.

URL getirme varsayılanları:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (istek başına toplam URL tabanlı `input_file` + `input_image` parçası)
- İstekler korumalıdır (DNS çözümleme, özel IP engelleme, yönlendirme sınırları, zaman aşımları).
- İsteğe bağlı ana makine adı izin listeleri her giriş türü için desteklenir (`files.urlAllowlist`, `images.urlAllowlist`).
  - Tam ana makine: `"cdn.example.com"`
  - Joker alt alan adları: `"*.assets.example.com"` (apex ile eşleşmez)
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
- HEIC/HEIF `input_image` kaynakları kabul edilir ve sağlayıcıya teslimden önce JPEG’e normalleştirilir.

Güvenlik notu:

- URL izin listeleri getirme öncesinde ve yönlendirme adımlarında uygulanır.
- Bir ana makine adını izin listesine almak, özel/dahili IP engellemeyi atlatmaz.
- İnternete açık gateway’ler için uygulama düzeyi korumalara ek olarak ağ çıkış denetimleri uygulayın.
  Bkz. [Güvenlik](/tr/gateway/security).

## Akış (SSE)

Server-Sent Events (SSE) almak için `stream: true` ayarlayın:

- `Content-Type: text/event-stream`
- Her olay satırı `event: <type>` ve `data: <json>` biçimindedir
- Akış `data: [DONE]` ile biter

Şu anda yayılan olay türleri:

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

Temel sağlayıcı token sayılarını bildirdiğinde `usage` doldurulur.
OpenClaw, bu sayaçlar aşağı akış durum/oturum yüzeylerine ulaşmadan önce `input_tokens` / `output_tokens` ve `prompt_tokens` / `completion_tokens` dahil yaygın OpenAI tarzı takma adları normalleştirir.

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

- [OpenAI chat completions](/tr/gateway/openai-http-api)
- [OpenAI](/tr/providers/openai)

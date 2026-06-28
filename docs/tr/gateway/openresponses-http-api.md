---
read_when:
    - OpenResponses API ile konuşan istemcileri entegre etme
    - Öğe tabanlı girdiler, istemci araç çağrıları veya SSE olayları istiyorsunuz
summary: Gateway'ten OpenResponses uyumlu bir /v1/responses HTTP uç noktası sun
title: OpenResponses API
x-i18n:
    generated_at: "2026-06-28T00:36:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbc41a14f5c585a0fb0aae96fb3d2376f94cdb77f41bcd7cc5e7998a27673c44
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

OpenClaw'ın Gateway'i OpenResponses uyumlu bir `POST /v1/responses` uç noktası sunabilir.

Bu uç nokta **varsayılan olarak devre dışıdır**. Önce yapılandırmada etkinleştirin.

- `POST /v1/responses`
- Gateway ile aynı bağlantı noktası (WS + HTTP multiplex): `http://<gateway-host>:<port>/v1/responses`

Arka planda istekler normal bir Gateway agent çalıştırması olarak yürütülür (`openclaw agent` ile aynı kod yolu), bu nedenle yönlendirme/izinler/yapılandırma Gateway'inizle eşleşir.

## Kimlik doğrulama, güvenlik ve yönlendirme

Operasyonel davranış [OpenAI Chat Completions](/tr/gateway/openai-http-api) ile eşleşir:

- eşleşen Gateway HTTP kimlik doğrulama yolunu kullanın:
  - paylaşılan gizli anahtar kimlik doğrulaması (`gateway.auth.mode="token"` veya `"password"`): `Authorization: Bearer <token-or-password>`
  - güvenilir proxy kimlik doğrulaması (`gateway.auth.mode="trusted-proxy"`): yapılandırılmış bir güvenilir proxy kaynağından kimlik farkındalıklı proxy üst bilgileri; aynı ana makine local loopback proxy'leri açıkça `gateway.auth.trustedProxy.allowLoopback = true` gerektirir
  - güvenilir proxy yerel doğrudan geri dönüşü: `Forwarded`, `X-Forwarded-*` veya `X-Real-IP` üst bilgileri olmayan aynı ana makine çağırıcıları `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` kullanabilir
  - özel giriş açık kimlik doğrulaması (`gateway.auth.mode="none"`): kimlik doğrulama üst bilgisi yok
- uç noktayı gateway örneği için tam operatör erişimi olarak ele alın
- paylaşılan gizli anahtar kimlik doğrulama modları (`token` ve `password`) için, daha dar bearer tarafından bildirilen `x-openclaw-scopes` değerlerini yok sayın ve normal tam operatör varsayılanlarını geri yükleyin
- güvenilir kimlik taşıyan HTTP modları için (örneğin güvenilir proxy kimlik doğrulaması veya `gateway.auth.mode="none"`), mevcut olduğunda `x-openclaw-scopes` değerini onurlandırın, aksi halde normal operatör varsayılan kapsam kümesine geri dönün
- agent'ları `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` veya `x-openclaw-agent-id` ile seçin
- seçilen agent'ın arka uç modelini geçersiz kılmak istediğinizde `x-openclaw-model` kullanın
- açık oturum yönlendirmesi için `x-openclaw-session-key` kullanın
- varsayılan olmayan sentetik giriş kanalı bağlamı istediğinizde `x-openclaw-message-channel` kullanın

Kimlik doğrulama matrisi:

- `gateway.auth.mode="token"` veya `"password"` + `Authorization: Bearer ...`
  - paylaşılan gateway operatör gizli anahtarına sahip olunduğunu kanıtlar
  - daha dar `x-openclaw-scopes` değerlerini yok sayar
  - tam varsayılan operatör kapsam kümesini geri yükler:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - bu uç noktadaki sohbet turlarını sahip-gönderen turları olarak ele alır
- güvenilir kimlik taşıyan HTTP modları (örneğin güvenilir proxy kimlik doğrulaması veya özel girişte `gateway.auth.mode="none"`)
  - üst bilgi mevcut olduğunda `x-openclaw-scopes` değerini onurlandırır
  - üst bilgi yoksa normal operatör varsayılan kapsam kümesine geri döner
  - yalnızca çağırıcı kapsamları açıkça daraltıp `operator.admin` değerini atladığında sahip semantiğini kaybeder

Bu uç noktayı `gateway.http.endpoints.responses.enabled` ile etkinleştirin veya devre dışı bırakın.

Aynı uyumluluk yüzeyi şunları da içerir:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Agent hedefli modellerin, `openclaw/default` değerinin, embeddings geçişinin ve arka uç model geçersiz kılmalarının birlikte nasıl çalıştığına dair kanonik açıklama için [OpenAI Chat Completions](/tr/gateway/openai-http-api#agent-first-model-contract) ve [Model listesi ve agent yönlendirme](/tr/gateway/openai-http-api#model-list-and-agent-routing) bölümlerine bakın.

## Oturum davranışı

Varsayılan olarak uç nokta **istek başına durum tutmaz** (her çağrıda yeni bir oturum anahtarı oluşturulur).

İstek bir OpenResponses `user` dizesi içeriyorsa Gateway bundan kararlı bir oturum anahtarı türetir, böylece yinelenen çağrılar bir agent oturumunu paylaşabilir.

## İstek şekli (desteklenen)

İstek, öğe tabanlı girişle OpenResponses API'sini izler. Mevcut destek:

- `input`: dize veya öğe nesneleri dizisi.
- `instructions`: sistem istemiyle birleştirilir.
- `tools`: istemci araç tanımları (function tools).
- `tool_choice`: istemci araçlarını filtrelemek veya zorunlu kılmak için `"auto"`, `"none"`, `"required"` veya `{ "type": "function", "name": "..." }`.
- `stream`: SSE akışını etkinleştirir.
- `max_output_tokens`: en iyi çabayla çıktı sınırı (sağlayıcıya bağlı).
- `temperature`: sağlayıcıya iletilen en iyi çabayla örnekleme sıcaklığı. Sabit sunucu tarafı örnekleme kullanan ChatGPT tabanlı Codex Responses arka ucu tarafından yok sayılır.
- `top_p`: sağlayıcıya iletilen en iyi çabayla nucleus sampling. `temperature` ile aynı Codex Responses uyarısı geçerlidir.
- `user`: kararlı oturum yönlendirmesi.

Kabul edilen ancak **şu anda yok sayılan**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Desteklenen:

- `previous_response_id`: İstek aynı agent/user/istenen-oturum kapsamı içinde kaldığında OpenClaw önceki yanıt oturumunu yeniden kullanır.

## Öğeler (giriş)

### `message`

Roller: `system`, `developer`, `user`, `assistant`.

- `system` ve `developer` sistem istemine eklenir.
- En son `user` veya `function_call_output` öğesi "geçerli mesaj" olur.
- Daha önceki kullanıcı/assistant mesajları bağlam için geçmiş olarak eklenir.

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

Şema uyumluluğu için kabul edilir, ancak istem oluşturulurken yok sayılır.

## Araçlar (istemci tarafı function tools)

Araçları `tools: [{ type: "function", name, description?, parameters? }]` ile sağlayın.

Agent bir aracı çağırmaya karar verirse yanıt bir `function_call` çıktı öğesi döndürür. Ardından turu sürdürmek için `function_call_output` ile takip isteği gönderirsiniz.

`tool_choice: "required"` ve function ile sabitlenmiş `tool_choice` için uç nokta, açığa çıkarılan istemci function-tool kümesini daraltır, çalışma zamanına yanıtlamadan önce bir istemci aracı çağırmasını bildirir ve eşleşen yapılandırılmış bir istemci-aracı çağrısı içermiyorsa turu reddeder. Bu sözleşme, her dahili OpenClaw agent aracına değil, çağırıcı tarafından sağlanan HTTP `tools` listesine uygulanır. Akışsız istekler `api_error` ile `502` döndürür; akışlı istekler `response.failed` olayı yayar. Bu, `/v1/chat/completions` sözleşmesiyle eşleşir.

## Görseller (`input_image`)

Base64 veya URL kaynaklarını destekler:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

İzin verilen MIME türleri (güncel): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
En büyük boyut (güncel): 10MB.

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

İzin verilen MIME türleri (güncel): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

En büyük boyut (güncel): 5MB.

Güncel davranış:

- Dosya içeriği çözülür ve kullanıcı mesajına değil **sistem istemine** eklenir; böylece geçici kalır (oturum geçmişinde kalıcılaştırılmaz).
- Çözülen dosya metni, eklenmeden önce **güvenilmeyen harici içerik** olarak sarmalanır; böylece dosya baytları güvenilir talimatlar değil veri olarak ele alınır.
- Enjekte edilen blok `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` gibi açık sınır işaretçileri kullanır ve bir
  `Source: External` metadata satırı içerir.
- Bu dosya-girişi yolu, istem bütçesini korumak için uzun `SECURITY NOTICE:` başlığını bilinçli olarak atlar; sınır işaretçileri ve metadata yine de yerinde kalır.
- PDF'ler önce metin için ayrıştırılır. Az metin bulunursa ilk sayfalar görüntülere rasterize edilir ve modele geçirilir; enjekte edilen dosya bloğu `[PDF content rendered to images]` yer tutucusunu kullanır.

PDF ayrıştırma, metin çıkarma ve sayfa işleme için `clawpdf` ve onun paketlenmiş PDFium WebAssembly çalışma zamanını kullanan birlikte gelen `document-extract` Plugin'i tarafından sağlanır.

URL getirme varsayılanları:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (istek başına toplam URL tabanlı `input_file` + `input_image` parçası)
- İstekler korumalarla denetlenir (DNS çözümleme, özel IP engelleme, yönlendirme sınırları, zaman aşımları).
- İsteğe bağlı ana makine adı izin listeleri giriş türü başına desteklenir (`files.urlAllowlist`, `images.urlAllowlist`).
  - Tam ana makine: `"cdn.example.com"`
  - Joker alt alan adları: `"*.assets.example.com"` (apex ile eşleşmez)
  - Boş veya atlanmış izin listeleri, ana makine adı izin listesi kısıtlaması olmadığı anlamına gelir.
- URL tabanlı getirmeleri tamamen devre dışı bırakmak için `files.allowUrl: false` ve/veya `images.allowUrl: false` ayarlayın.

## Dosya + görüntü sınırları (yapılandırma)

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
- HEIC/HEIF `input_image` kaynakları bir sistem dönüştürücü mevcut olduğunda kabul edilir ve sağlayıcıya teslim edilmeden önce JPEG'e normalize edilir. Desteklenen dönüştürücüler macOS `sips`, ImageMagick, GraphicsMagick veya ffmpeg'dir.

Güvenlik notu:

- URL izin listeleri, getirmeden önce ve yönlendirme atlamalarında uygulanır.
- Bir ana makine adını izin listesine almak, özel/dahili IP engellemeyi baypas etmez.
- İnternete açık gateway'ler için uygulama düzeyi korumalara ek olarak ağ çıkış denetimleri uygulayın.
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

`usage`, temel sağlayıcı token sayılarını bildirdiğinde doldurulur.
OpenClaw, bu sayaçlar aşağı akış durum/oturum yüzeylerine ulaşmadan önce yaygın OpenAI tarzı alias'ları normalize eder; bunlara `input_tokens` / `output_tokens` ve `prompt_tokens` / `completion_tokens` dahildir.

## Hatalar

Hatalar şöyle bir JSON nesnesi kullanır:

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

- [OpenAI sohbet tamamlama](/tr/gateway/openai-http-api)
- [OpenAI](/tr/providers/openai)

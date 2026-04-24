---
read_when:
    - OpenResponses API konuşan istemcileri entegre etme
    - Öğe tabanlı girdiler, istemci araç çağrıları veya SSE olayları istiyorsunuz
summary: Gateway'den OpenResponses uyumlu bir `/v1/responses` HTTP uç noktası açığa çıkarın
title: OpenResponses API
x-i18n:
    generated_at: "2026-04-24T09:10:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73f2e075b78e5153633af17c3f59cace4516e5aaa88952d643cfafb9d0df8022
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

# OpenResponses API (HTTP)

OpenClaw Gateway, OpenResponses uyumlu bir `POST /v1/responses` uç noktası sunabilir.

Bu uç nokta varsayılan olarak **devre dışıdır**. Önce yapılandırmada etkinleştirin.

- `POST /v1/responses`
- Gateway ile aynı port (WS + HTTP çoklama): `http://<gateway-host>:<port>/v1/responses`

Arka planda istekler normal bir Gateway ajan çalıştırması olarak yürütülür (`openclaw agent`
ile aynı kod yolu), bu nedenle yönlendirme/izinler/yapılandırma Gateway'inizle eşleşir.

## Kimlik doğrulama, güvenlik ve yönlendirme

Operasyonel davranış [OpenAI Chat Completions](/tr/gateway/openai-http-api) ile eşleşir:

- eşleşen Gateway HTTP kimlik doğrulama yolunu kullanın:
  - paylaşılan gizli bilgi kimlik doğrulaması (`gateway.auth.mode="token"` veya `"password"`): `Authorization: Bearer <token-or-password>`
  - güvenilir proxy kimlik doğrulaması (`gateway.auth.mode="trusted-proxy"`): yapılandırılmış loopback dışı güvenilir proxy kaynağından gelen kimlik farkındalıklı proxy üstbilgileri
  - özel giriş açık kimlik doğrulaması (`gateway.auth.mode="none"`): kimlik doğrulama üstbilgisi yok
- uç noktayı Gateway örneği için tam operatör erişimi olarak değerlendirin
- paylaşılan gizli bilgi kimlik doğrulama kiplerinde (`token` ve `"password"`), daha dar bearer bildirimi yapan `x-openclaw-scopes` değerlerini yok sayın ve normal tam operatör varsayılanlarını geri yükleyin
- güvenilir kimlik taşıyan HTTP kiplerinde (örneğin güvenilir proxy kimlik doğrulaması veya `gateway.auth.mode="none"`), `x-openclaw-scopes` mevcutsa buna uyun, aksi durumda normal operatör varsayılan kapsam kümesine geri dönün
- ajanları `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` veya `x-openclaw-agent-id` ile seçin
- seçilen ajanın arka uç modelini geçersiz kılmak istediğinizde `x-openclaw-model` kullanın
- açık oturum yönlendirmesi için `x-openclaw-session-key` kullanın
- varsayılan olmayan sentetik giriş kanal bağlamı istediğinizde `x-openclaw-message-channel` kullanın

Kimlik doğrulama matrisi:

- `gateway.auth.mode="token"` veya `"password"` + `Authorization: Bearer ...`
  - paylaşılan Gateway operatör gizli bilgisine sahip olunduğunu kanıtlar
  - daha dar `x-openclaw-scopes` değerlerini yok sayar
  - tam varsayılan operatör kapsam kümesini geri yükler:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - bu uç noktadaki sohbet turlarını sahip-gönderen turları olarak değerlendirir
- güvenilir kimlik taşıyan HTTP kipleri (örneğin güvenilir proxy kimlik doğrulaması veya özel girişte `gateway.auth.mode="none"`)
  - üstbilgi varsa `x-openclaw-scopes` değerine uyar
  - üstbilgi yoksa normal operatör varsayılan kapsam kümesine geri döner
  - yalnızca çağıran açıkça kapsamları daraltır ve `operator.admin` içermezse sahip semantiğini kaybeder

Bu uç noktayı `gateway.http.endpoints.responses.enabled` ile etkinleştirin veya devre dışı bırakın.

Aynı uyumluluk yüzeyi ayrıca şunları da içerir:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Ajan hedefli modellerin, `openclaw/default` değerinin, embeddings geçişinin ve arka uç model geçersiz kılmalarının birlikte nasıl çalıştığına dair kanonik açıklama için bkz. [OpenAI Chat Completions](/tr/gateway/openai-http-api#agent-first-model-contract) ve [Model list and agent routing](/tr/gateway/openai-http-api#model-list-and-agent-routing).

## Oturum davranışı

Varsayılan olarak uç nokta istek başına **durumsuzdur** (her çağrıda yeni bir oturum anahtarı üretilir).

İstek bir OpenResponses `user` dizesi içeriyorsa Gateway bundan kararlı bir oturum anahtarı
türetir; böylece tekrarlanan çağrılar aynı ajan oturumunu paylaşabilir.

## İstek biçimi (desteklenen)

İstek, öğe tabanlı girdili OpenResponses API'yi izler. Geçerli destek:

- `input`: dize veya öğe nesneleri dizisi.
- `instructions`: sistem istemine birleştirilir.
- `tools`: istemci araç tanımları (function araçları).
- `tool_choice`: istemci araçlarını filtreler veya zorunlu kılar.
- `stream`: SSE akışını etkinleştirir.
- `max_output_tokens`: en iyi çaba ile çıktı sınırı (sağlayıcıya bağlı).
- `user`: kararlı oturum yönlendirmesi.

Kabul edilir ancak **şu anda yok sayılır**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Desteklenen:

- `previous_response_id`: OpenClaw, istek aynı ajan/kullanıcı/istenen oturum kapsamı içinde kaldığında önceki yanıt oturumunu yeniden kullanır.

## Öğeler (`input`)

### `message`

Roller: `system`, `developer`, `user`, `assistant`.

- `system` ve `developer`, sistem istemine eklenir.
- En son `user` veya `function_call_output` öğesi “geçerli mesaj” olur.
- Daha önceki kullanıcı/asistan mesajları bağlam için geçmişe dahil edilir.

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

## Araçlar (istemci tarafı function araçları)

Araçları `tools: [{ type: "function", function: { name, description?, parameters? } }]` ile sağlayın.

Ajan bir aracı çağırmaya karar verirse yanıt bir `function_call` çıktı öğesi döndürür.
Ardından turu sürdürmek için `function_call_output` içeren bir takip isteği gönderirsiniz.

## Görseller (`input_image`)

Base64 veya URL kaynaklarını destekler:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

İzin verilen MIME türleri (geçerli): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
Azami boyut (geçerli): 10MB.

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

Azami boyut (geçerli): 5MB.

Geçerli davranış:

- Dosya içeriği çözümlenir ve kullanıcı mesajına değil, **sistem istemine** eklenir;
  böylece geçici kalır (oturum geçmişinde kalıcılaştırılmaz).
- Çözülmüş dosya metni eklenmeden önce **güvenilmeyen harici içerik** olarak sarılır,
  böylece dosya baytları güvenilir talimatlar değil veri olarak değerlendirilir.
- Enjekte edilen blok şu gibi açık sınır işaretçileri kullanır:
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` ve bir
  `Source: External` meta veri satırı içerir.
- Bu dosya-girdi yolu, istem bütçesini korumak için kasıtlı olarak uzun `SECURITY NOTICE:` başlığını içermez;
  sınır işaretçileri ve meta veriler yine de yerinde kalır.
- PDF'ler önce metin için ayrıştırılır. Az metin bulunursa ilk sayfalar
  görsellere rasterize edilir ve modele geçirilir; enjekte edilen dosya bloğu
  `[PDF content rendered to images]` yer tutucusunu kullanır.

PDF ayrıştırma, Node dostu `pdfjs-dist` eski yapısını kullanır (worker yok). Modern
PDF.js yapısı tarayıcı worker'ları/DOM globalleri beklediğinden Gateway'de kullanılmaz.

URL getirme varsayılanları:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (istek başına toplam URL tabanlı `input_file` + `input_image` parçası)
- İstekler korunur (DNS çözümleme, özel IP engelleme, yönlendirme sınırları, zaman aşımları).
- İsteğe bağlı ana bilgisayar adı izin listeleri giriş türü başına desteklenir (`files.urlAllowlist`, `images.urlAllowlist`).
  - Tam ana bilgisayar: `"cdn.example.com"`
  - Joker alt alan adları: `"*.assets.example.com"` (apex'i eşleştirmez)
  - Boş veya atlanmış izin listeleri, ana bilgisayar adı izin listesi kısıtı olmadığı anlamına gelir.
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

- URL izin listeleri getirmeden önce ve yönlendirme sıçramalarında uygulanır.
- Bir ana bilgisayar adına izin vermek, özel/iç IP engellemeyi atlatmaz.
- İnternete açık Gateway'lerde uygulama düzeyi korumalara ek olarak ağ çıkış denetimleri uygulayın.
  Bkz. [Security](/tr/gateway/security).

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
- `response.failed` (hata durumunda)

## Kullanım

`usage`, alttaki sağlayıcı belirteç sayılarını bildirdiğinde doldurulur.
OpenClaw, bu sayaçlar
alt durum/oturum yüzeylerine ulaşmadan önce yaygın OpenAI tarzı takma adları normalize eder;
buna `input_tokens` / `output_tokens`
ve `prompt_tokens` / `completion_tokens` dahildir.

## Hatalar

Hatalar şu biçimde bir JSON nesnesi kullanır:

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

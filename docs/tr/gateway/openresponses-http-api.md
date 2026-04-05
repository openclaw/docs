---
read_when:
    - OpenResponses API konuşan istemcileri entegre etme
    - Öğe tabanlı girdiler, istemci araç çağrıları veya SSE olayları istiyorsunuz
summary: Gateway’den OpenResponses uyumlu bir `/v1/responses` HTTP uç noktası sunun
title: OpenResponses API
x-i18n:
    generated_at: "2026-04-05T13:54:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: b3f2905fe45accf2699de8a561d15311720f249f9229d26550c16577428ea8a9
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

# OpenResponses API (HTTP)

OpenClaw’ın Gateway’i, OpenResponses uyumlu bir `POST /v1/responses` uç noktası sunabilir.

Bu uç nokta varsayılan olarak **devre dışıdır**. Önce yapılandırmada etkinleştirin.

- `POST /v1/responses`
- Gateway ile aynı port (WS + HTTP çoklama): `http://<gateway-host>:<port>/v1/responses`

Arka planda istekler normal bir Gateway agent çalıştırması olarak yürütülür (aynı kod yolu
`openclaw agent` ile kullanılır), bu nedenle yönlendirme/izinler/yapılandırma Gateway’inizle eşleşir.

## Kimlik doğrulama, güvenlik ve yönlendirme

İşletim davranışı [OpenAI Chat Completions](/gateway/openai-http-api) ile eşleşir:

- eşleşen Gateway HTTP kimlik doğrulama yolunu kullanın:
  - paylaşılan gizli kimlik doğrulaması (`gateway.auth.mode="token"` veya `"password"`): `Authorization: Bearer <token-or-password>`
  - trusted-proxy kimlik doğrulaması (`gateway.auth.mode="trusted-proxy"`): yapılandırılmış loopback dışı trusted proxy kaynağından gelen kimlik farkında proxy başlıkları
  - private-ingress açık kimlik doğrulama (`gateway.auth.mode="none"`): kimlik doğrulama başlığı yok
- uç noktayı gateway örneği için tam operatör erişimi olarak değerlendirin
- paylaşılan gizli kimlik doğrulama modlarında (`token` ve `password`), daha dar bearer bildirilen `x-openclaw-scopes` değerlerini yok sayın ve normal tam operatör varsayılanlarını geri yükleyin
- trusted kimlik taşıyan HTTP modlarında (örneğin trusted proxy kimlik doğrulaması veya `gateway.auth.mode="none"`), mevcutsa `x-openclaw-scopes` değerine uyun, aksi takdirde normal operatör varsayılan kapsam kümesine geri dönün
- agent seçimi için `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` veya `x-openclaw-agent-id` kullanın
- seçili agent’ın backend modelini geçersiz kılmak istediğinizde `x-openclaw-model` kullanın
- açık oturum yönlendirmesi için `x-openclaw-session-key` kullanın
- varsayılan olmayan sentetik ingress kanal bağlamı istediğinizde `x-openclaw-message-channel` kullanın

Kimlik doğrulama matrisi:

- `gateway.auth.mode="token"` veya `"password"` + `Authorization: Bearer ...`
  - paylaşılan gateway operatör gizlisine sahip olunduğunu kanıtlar
  - daha dar `x-openclaw-scopes` değerlerini yok sayar
  - tam varsayılan operatör kapsam kümesini geri yükler:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - bu uç noktadaki sohbet dönüşlerini owner-sender dönüşleri olarak ele alır
- trusted kimlik taşıyan HTTP modları (örneğin trusted proxy kimlik doğrulaması veya private ingress üzerinde `gateway.auth.mode="none"`)
  - başlık mevcut olduğunda `x-openclaw-scopes` değerine uyar
  - başlık yoksa normal operatör varsayılan kapsam kümesine geri döner
  - yalnızca çağıran kişi kapsamları açıkça daraltır ve `operator.admin` eklemezse owner semantiğini kaybeder

Bu uç noktayı `gateway.http.endpoints.responses.enabled` ile etkinleştirin veya devre dışı bırakın.

Aynı uyumluluk yüzeyi şunları da içerir:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Agent hedefli modellerin, `openclaw/default` değerinin, embeddings pass-through’unun ve backend model geçersiz kılmalarının nasıl birlikte çalıştığının kanonik açıklaması için [OpenAI Chat Completions](/gateway/openai-http-api#agent-first-model-contract) ve [Model list and agent routing](/gateway/openai-http-api#model-list-and-agent-routing) belgelerine bakın.

## Oturum davranışı

Varsayılan olarak bu uç nokta istek başına **durumsuzdur** (her çağrıda yeni bir oturum anahtarı oluşturulur).

İstek bir OpenResponses `user` dizesi içeriyorsa, Gateway bundan kararlı bir oturum anahtarı türetir;
böylece tekrarlanan çağrılar aynı agent oturumunu paylaşabilir.

## İstek şekli (desteklenen)

İstek, öğe tabanlı girdiyle OpenResponses API’yi izler. Mevcut destek:

- `input`: dize veya öğe nesneleri dizisi.
- `instructions`: sistem istemine birleştirilir.
- `tools`: istemci araç tanımları (function tools).
- `tool_choice`: istemci araçlarını filtreler veya zorunlu kılar.
- `stream`: SSE akışını etkinleştirir.
- `max_output_tokens`: best-effort çıktı sınırı (sağlayıcıya bağlıdır).
- `user`: kararlı oturum yönlendirmesi.

Kabul edilir ancak **şu anda yok sayılır**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Desteklenir:

- `previous_response_id`: OpenClaw, istek aynı agent/user/istenen-oturum kapsamı içinde kaldığında önceki yanıt oturumunu yeniden kullanır.

## Öğeler (girdi)

### `message`

Roller: `system`, `developer`, `user`, `assistant`.

- `system` ve `developer`, sistem istemine eklenir.
- En son `user` veya `function_call_output` öğesi “geçerli mesaj” olur.
- Daha önceki user/assistant mesajları bağlam için geçmişe dahil edilir.

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

Şema uyumluluğu için kabul edilir ancak istem oluşturulurken yok sayılır.

## Araçlar (istemci tarafı function tools)

Araçları `tools: [{ type: "function", function: { name, description?, parameters? } }]` ile sağlayın.

Agent bir aracı çağırmaya karar verirse, yanıt bir `function_call` çıktı öğesi döndürür.
Ardından dönüşe devam etmek için `function_call_output` ile bir takip isteği gönderirsiniz.

## Görseller (`input_image`)

Base64 veya URL kaynaklarını destekler:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

İzin verilen MIME türleri (mevcut): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
En büyük boyut (mevcut): 10MB.

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

En büyük boyut (mevcut): 5MB.

Mevcut davranış:

- Dosya içeriği çözülür ve kullanıcı mesajına değil **sistem istemine** eklenir,
  böylece geçici kalır (oturum geçmişinde kalıcı olmaz).
- Çözülen dosya metni eklenmeden önce **güvenilmeyen harici içerik** olarak sarılır,
  böylece dosya baytları güvenilir yönergeler değil veri olarak ele alınır.
- Eklenen blok, şu gibi açık sınır işaretçileri kullanır:
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` ve
  `Source: External` meta veri satırı içerir.
- Bu dosya-girdi yolu, istem bütçesini korumak için uzun `SECURITY NOTICE:` başlığını
  özellikle atlar; sınır işaretçileri ve meta veriler yine de yerinde kalır.
- PDF’ler önce metin için ayrıştırılır. Az metin bulunursa ilk sayfalar
  görsellere rasterize edilir ve modele geçirilir; eklenen dosya bloğu da
  `[PDF content rendered to images]` yer tutucusunu kullanır.

PDF ayrıştırma, Node uyumlu `pdfjs-dist` legacy derlemesini kullanır (worker yok). Modern
PDF.js derlemesi tarayıcı worker’ları/DOM global’leri bekler, bu nedenle Gateway’de kullanılmaz.

URL getirme varsayılanları:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (istek başına URL tabanlı toplam `input_file` + `input_image` parçası)
- İstekler korunur (DNS çözümleme, özel IP engelleme, yönlendirme sınırları, zaman aşımları).
- İsteğe bağlı ana bilgisayar allowlist’leri girdi türü başına desteklenir (`files.urlAllowlist`, `images.urlAllowlist`).
  - Tam ana bilgisayar: `"cdn.example.com"`
  - Joker alt etki alanları: `"*.assets.example.com"` (apex’i eşleştirmez)
  - Boş veya atlanmış allowlist’ler, ana bilgisayar allowlist kısıtlaması olmadığı anlamına gelir.
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
- HEIC/HEIF `input_image` kaynakları kabul edilir ve sağlayıcıya iletilmeden önce JPEG’e normalize edilir.

Güvenlik notu:

- URL allowlist’leri, getirmeden önce ve yönlendirme sıçramalarında uygulanır.
- Bir ana bilgisayarı allowlist’e almak, özel/dahili IP engellemesini aşmaz.
- İnternete açık gateway’lerde, uygulama düzeyi korumalara ek olarak ağ çıkış denetimleri uygulayın.
  Bkz. [Security](/gateway/security).

## Akış (SSE)

SSE (Server-Sent Events) almak için `stream: true` ayarlayın:

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

`usage`, alttaki sağlayıcı token sayılarını bildirdiğinde doldurulur.
OpenClaw, bu sayaçlar
aşağı akış durum/oturum yüzeylerine ulaşmadan önce yaygın OpenAI tarzı takma adları normalize eder;
bunlara `input_tokens` / `output_tokens`
ve `prompt_tokens` / `completion_tokens` dahildir.

## Hatalar

Hatalar şu gibi bir JSON nesnesi kullanır:

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

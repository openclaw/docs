---
read_when:
    - OpenAI Chat Completions bekleyen araçları entegre etme
summary: Gateway üzerinden OpenAI uyumlu bir /v1/chat/completions HTTP uç noktasını kullanıma açın
title: OpenAI sohbet tamamlamaları
x-i18n:
    generated_at: "2026-05-11T20:29:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: e71e25fc1299754ebc65d3998834dc5e9c03acfbd005387aef96f946be1d04a1
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw'ın Gateway'i küçük, OpenAI uyumlu bir Chat Completions uç noktası sunabilir.

Bu uç nokta **varsayılan olarak devre dışıdır**. Önce yapılandırmada etkinleştirin.

- `POST /v1/chat/completions`
- Gateway ile aynı bağlantı noktası (WS + HTTP çoklama): `http://<gateway-host>:<port>/v1/chat/completions`

Gateway'in OpenAI uyumlu HTTP yüzeyi etkinleştirildiğinde şunları da sunar:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Perde arkasında istekler normal bir Gateway aracı çalıştırması olarak yürütülür (`openclaw agent` ile aynı kod yolu), bu yüzden yönlendirme/izinler/yapılandırma Gateway'inizle eşleşir.

## Kimlik doğrulama

Gateway kimlik doğrulama yapılandırmasını kullanır.

Yaygın HTTP kimlik doğrulama yolları:

- paylaşılan gizli kimlik doğrulaması (`gateway.auth.mode="token"` veya `"password"`):
  `Authorization: Bearer <token-or-password>`
- güvenilir kimlik taşıyan HTTP kimlik doğrulaması (`gateway.auth.mode="trusted-proxy"`):
  yapılandırılmış kimlik farkındalıklı proxy üzerinden yönlendirin ve gerekli
  kimlik başlıklarını onun eklemesine izin verin
- özel giriş açık kimlik doğrulaması (`gateway.auth.mode="none"`):
  kimlik doğrulama başlığı gerekmez

Notlar:

- `gateway.auth.mode="token"` olduğunda `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`) kullanın.
- `gateway.auth.mode="password"` olduğunda `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) kullanın.
- `gateway.auth.mode="trusted-proxy"` olduğunda HTTP isteği yapılandırılmış
  güvenilir bir proxy kaynağından gelmelidir; aynı ana makine loopback proxy'leri açıkça
  `gateway.auth.trustedProxy.allowLoopback = true` gerektirir.
- `gateway.auth.rateLimit` yapılandırılmışsa ve çok fazla kimlik doğrulama hatası oluşursa, uç nokta `Retry-After` ile `429` döndürür.

## Güvenlik sınırı (önemli)

Bu uç noktayı gateway örneği için **tam operatör erişimli** bir yüzey olarak ele alın.

- Buradaki HTTP bearer kimlik doğrulaması dar bir kullanıcı başına kapsam modeli değildir.
- Bu uç nokta için geçerli bir Gateway token/parolası, sahip/operatör kimlik bilgisi gibi ele alınmalıdır.
- İstekler, güvenilir operatör eylemleriyle aynı denetim düzlemi aracı yolundan geçer.
- Bu uç noktada ayrı bir sahip olmayan/kullanıcı başına araç sınırı yoktur; çağıran burada Gateway kimlik doğrulamasını geçtiğinde OpenClaw bu çağıranı bu gateway için güvenilir operatör olarak ele alır.
- Paylaşılan gizli kimlik doğrulama modları (`token` ve `password`) için, çağıran daha dar bir `x-openclaw-scopes` başlığı gönderse bile uç nokta normal tam operatör varsayılanlarını geri yükler.
- Güvenilir kimlik taşıyan HTTP modları (örneğin güvenilir proxy kimlik doğrulaması veya `gateway.auth.mode="none"`) varsa `x-openclaw-scopes` değerini dikkate alır, aksi halde normal operatör varsayılan kapsam kümesine döner.
- Hedef aracı ilkesi hassas araçlara izin veriyorsa, bu uç nokta bunları kullanabilir.
- Bu uç noktayı yalnızca loopback/tailnet/özel giriş üzerinde tutun; doğrudan herkese açık internete açmayın.

Kimlik doğrulama matrisi:

- `gateway.auth.mode="token"` veya `"password"` + `Authorization: Bearer ...`
  - paylaşılan gateway operatör gizlisinin elde olduğunu kanıtlar
  - daha dar `x-openclaw-scopes` değerlerini yok sayar
  - tam varsayılan operatör kapsam kümesini geri yükler:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - bu uç noktadaki sohbet dönüşlerini sahip-gönderen dönüşleri olarak ele alır
- güvenilir kimlik taşıyan HTTP modları (örneğin güvenilir proxy kimlik doğrulaması veya özel girişte `gateway.auth.mode="none"`)
  - dıştaki güvenilir bir kimliği veya dağıtım sınırını doğrular
  - başlık mevcut olduğunda `x-openclaw-scopes` değerini dikkate alır
  - başlık yoksa normal operatör varsayılan kapsam kümesine döner
  - yalnızca çağıran kapsamları açıkça daraltıp `operator.admin` değerini atladığında sahip semantiğini kaybeder

Bkz. [Güvenlik](/tr/gateway/security) ve [Uzaktan erişim](/tr/gateway/remote).

## Aracı öncelikli model sözleşmesi

OpenClaw, OpenAI `model` alanını ham sağlayıcı model kimliği değil, bir **aracı hedefi** olarak ele alır.

- `model: "openclaw"` yapılandırılmış varsayılan aracıya yönlendirir.
- `model: "openclaw/default"` de yapılandırılmış varsayılan aracıya yönlendirir.
- `model: "openclaw/<agentId>"` belirli bir aracıya yönlendirir.

İsteğe bağlı istek başlıkları:

- `x-openclaw-model: <provider/model-or-bare-id>` seçili aracı için arka uç modelini geçersiz kılar.
- `x-openclaw-agent-id: <agentId>` uyumluluk geçersiz kılması olarak desteklenmeye devam eder.
- `x-openclaw-session-key: <sessionKey>` oturum yönlendirmesini tamamen denetler.
- `x-openclaw-message-channel: <channel>` kanal farkındalıklı istemler ve ilkeler için sentetik giriş kanalı bağlamını ayarlar.

Uyumluluk diğer adları hâlâ kabul edilir:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Uç noktayı etkinleştirme

`gateway.http.endpoints.chatCompletions.enabled` değerini `true` olarak ayarlayın:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

## Uç noktayı devre dışı bırakma

`gateway.http.endpoints.chatCompletions.enabled` değerini `false` olarak ayarlayın:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## Oturum davranışı

Varsayılan olarak uç nokta **istek başına durum bilgisi tutmaz** (her çağrıda yeni bir oturum anahtarı oluşturulur).

İstek bir OpenAI `user` dizesi içeriyorsa Gateway bundan kararlı bir oturum anahtarı türetir, böylece yinelenen çağrılar bir aracı oturumunu paylaşabilir.

## Bu yüzey neden önemlidir?

Bu, kendi barındırılan ön yüzler ve araçlar için en yüksek etkili uyumluluk kümesidir:

- Çoğu Open WebUI, LobeChat ve LibreChat kurulumu `/v1/models` bekler.
- Birçok RAG sistemi `/v1/embeddings` bekler.
- Mevcut OpenAI sohbet istemcileri genellikle `/v1/chat/completions` ile başlayabilir.
- Daha aracı-yerel istemciler giderek daha fazla `/v1/responses` tercih eder.

## Model listesi ve aracı yönlendirme

<AccordionGroup>
  <Accordion title="What does `/v1/models` return?">
    Bir OpenClaw aracı-hedef listesi.

    Döndürülen kimlikler `openclaw`, `openclaw/default` ve `openclaw/<agentId>` girdileridir.
    Bunları doğrudan OpenAI `model` değerleri olarak kullanın.

  </Accordion>
  <Accordion title="Does `/v1/models` list agents or sub-agents?">
    Arka uç sağlayıcı modellerini veya alt aracıları değil, üst düzey aracı hedeflerini listeler.

    Alt aracılar dahili yürütme topolojisi olarak kalır. Sözde modeller olarak görünmezler.

  </Accordion>
  <Accordion title="Why is `openclaw/default` included?">
    `openclaw/default`, yapılandırılmış varsayılan aracı için kararlı diğer addır.

    Bu, gerçek varsayılan aracı kimliği ortamlar arasında değişse bile istemcilerin tek, öngörülebilir bir kimlik kullanmaya devam edebileceği anlamına gelir.

  </Accordion>
  <Accordion title="How do I override the backend model?">
    `x-openclaw-model` kullanın.

    Örnekler:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Bunu atlarsanız seçili aracı normal yapılandırılmış model seçimiyle çalışır.

  </Accordion>
  <Accordion title="How do embeddings fit this contract?">
    `/v1/embeddings` aynı aracı-hedef `model` kimliklerini kullanır.

    `model: "openclaw/default"` veya `model: "openclaw/<agentId>"` kullanın.
    Belirli bir embedding modeli gerektiğinde bunu `x-openclaw-model` içinde gönderin.
    Bu başlık olmadan istek, seçili aracının normal embedding kurulumuna geçirilir.

  </Accordion>
</AccordionGroup>

## Akış (SSE)

Server-Sent Events (SSE) almak için `stream: true` ayarlayın:

- `Content-Type: text/event-stream`
- Her olay satırı `data: <json>` şeklindedir
- Akış `data: [DONE]` ile sona erer

## Sohbet aracı sözleşmesi

`/v1/chat/completions`, yaygın OpenAI Chat istemcileriyle uyumlu bir işlev-aracı alt kümesini destekler.

### Desteklenen istek alanları

- `tools`: `{ "type": "function", "function": { ... } }` dizisi
- `tool_choice`: `"auto"`, `"none"`
- `messages[*].role: "tool"` takip dönüşleri
- araç sonuçlarını önceki bir araç çağrısına bağlamak için `messages[*].tool_call_id`

### Desteklenmeyen varyantlar

Uç nokta, aşağıdakiler dahil desteklenmeyen araç varyantları için `400 invalid_request_error` döndürür:

- dizi olmayan `tools`
- işlev olmayan araç girdileri
- eksik `tool.function.name`
- `allowed_tools` ve `custom` gibi `tool_choice` varyantları
- `tool_choice: "required"` (henüz çalışma zamanında zorlanmıyor; katı zorlama uygulandığında desteklenecek)
- `tool_choice: { "type": "function", "function": { "name": "..." } }` (`required` ile aynı gerekçe)
- sağlanan `tools` ile eşleşmeyen `tool_choice.function.name` değerleri

### Akışsız araç yanıt şekli

Aracı araç çağırmaya karar verdiğinde yanıt şunu kullanır:

- `choices[0].finish_reason = "tool_calls"`
- Şunları içeren `choices[0].message.tool_calls[]` girdileri:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (JSON dizesi)

Araç çağrısından önceki asistan yorumu `choices[0].message.content` içinde döndürülür (boş olabilir).

### Akışlı araç yanıt şekli

`stream: true` olduğunda araç çağrıları artımlı SSE parçaları olarak yayılır:

- ilk asistan rol deltası
- isteğe bağlı asistan yorum deltaları
- araç kimliği ve argüman parçaları taşıyan bir veya daha fazla `delta.tool_calls` parçası
- `finish_reason: "tool_calls"` içeren son parça
- `data: [DONE]`

`stream_options.include_usage=true` ise `[DONE]` öncesinde sondaki bir kullanım parçası yayılır.

### Araç takip döngüsü

`tool_calls` alındıktan sonra istemci istenen işlevleri yürütmeli ve şunları içeren bir takip isteği göndermelidir:

- önceki asistan araç çağrısı mesajı
- eşleşen `tool_call_id` değerlerine sahip bir veya daha fazla `role: "tool"` mesajı

Bu, gateway aracı çalıştırmasının aynı akıl yürütme döngüsüne devam etmesini ve nihai asistan yanıtını üretmesini sağlar.

## Open WebUI hızlı kurulum

Temel bir Open WebUI bağlantısı için:

- Temel URL: `http://127.0.0.1:18789/v1`
- macOS üzerinde Docker temel URL'si: `http://host.docker.internal:18789/v1`
- API anahtarı: Gateway bearer token'ınız
- Model: `openclaw/default`

Beklenen davranış:

- `GET /v1/models`, `openclaw/default` değerini listelemelidir
- Open WebUI sohbet model kimliği olarak `openclaw/default` kullanmalıdır
- Bu aracı için belirli bir arka uç sağlayıcı/model istiyorsanız aracının normal varsayılan modelini ayarlayın veya `x-openclaw-model` gönderin

Hızlı smoke:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Bu `openclaw/default` döndürürse çoğu Open WebUI kurulumu aynı temel URL ve token ile bağlanabilir.

## Örnekler

Akışsız:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Akışlı:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.4' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Modelleri listeleme:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Bir modeli getirme:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Embeddings oluşturma:

```bash
curl -sS http://127.0.0.1:18789/v1/embeddings \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/text-embedding-3-small' \
  -d '{
    "model": "openclaw/default",
    "input": ["alpha", "beta"]
  }'
```

Notlar:

- `/v1/models`, ham sağlayıcı kataloglarını değil OpenClaw aracı hedeflerini döndürür.
- `openclaw/default` her zaman mevcuttur, böylece ortamlar arasında tek bir kararlı kimlik çalışır.
- Arka uç sağlayıcı/model geçersiz kılmaları OpenAI `model` alanına değil `x-openclaw-model` içine aittir.
- `/v1/embeddings`, `input` değerini dize veya dize dizisi olarak destekler.

## İlgili

- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
- [OpenAI](/tr/providers/openai)

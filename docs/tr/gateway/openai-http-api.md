---
read_when:
    - OpenAI Chat Completions bekleyen araçları entegre etme
summary: Gateway'den OpenAI uyumlu /v1/chat/completions HTTP uç noktasını kullanıma açın
title: OpenAI sohbet tamamlama işlemleri
x-i18n:
    generated_at: "2026-05-12T15:43:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 21d901ab70908d6e4e3770e716319b961348c2a7ff6ef9bb2d0ffc6952a073f2
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw'ın Gateway'i küçük, OpenAI uyumlu bir Sohbet Tamamlamaları uç noktası sunabilir.

Bu uç nokta **varsayılan olarak devre dışıdır**. Önce yapılandırmada etkinleştirin.

- `POST /v1/chat/completions`
- Gateway ile aynı port (WS + HTTP çoklama): `http://<gateway-host>:<port>/v1/chat/completions`

Gateway'in OpenAI uyumlu HTTP yüzeyi etkinleştirildiğinde şunları da sunar:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Altta istekler normal bir Gateway ajan çalıştırması olarak yürütülür (`openclaw agent` ile aynı kod yolu), bu nedenle yönlendirme/izinler/yapılandırma Gateway'inizle eşleşir.

## Kimlik doğrulama

Gateway kimlik doğrulama yapılandırmasını kullanır.

Yaygın HTTP kimlik doğrulama yolları:

- paylaşılan gizli kimlik doğrulaması (`gateway.auth.mode="token"` veya `"password"`):
  `Authorization: Bearer <token-or-password>`
- güvenilir kimlik taşıyan HTTP kimlik doğrulaması (`gateway.auth.mode="trusted-proxy"`):
  yapılandırılmış kimlik farkındalıklı proxy üzerinden yönlendirin ve gerekli
  kimlik başlıklarını eklemesine izin verin
- özel giriş açık kimlik doğrulaması (`gateway.auth.mode="none"`):
  kimlik doğrulama başlığı gerekmez

Notlar:

- `gateway.auth.mode="token"` olduğunda `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`) kullanın.
- `gateway.auth.mode="password"` olduğunda `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) kullanın.
- `gateway.auth.mode="trusted-proxy"` olduğunda HTTP isteği yapılandırılmış bir
  güvenilir proxy kaynağından gelmelidir; aynı ana makinedeki loopback proxy'leri açıkça
  `gateway.auth.trustedProxy.allowLoopback = true` gerektirir.
- `gateway.auth.rateLimit` yapılandırılmışsa ve çok fazla kimlik doğrulama hatası oluşursa uç nokta `Retry-After` ile `429` döndürür.

## Güvenlik sınırı (önemli)

Bu uç noktayı gateway örneği için **tam operatör erişimli** bir yüzey olarak ele alın.

- Buradaki HTTP bearer kimlik doğrulaması dar kapsamlı, kullanıcı başına bir kapsam modeli değildir.
- Bu uç nokta için geçerli bir Gateway token/parolası sahip/operatör kimlik bilgisi gibi ele alınmalıdır.
- İstekler, güvenilir operatör eylemleriyle aynı kontrol düzlemi ajan yolundan geçer.
- Bu uç noktada ayrı bir sahip olmayan/kullanıcı başına araç sınırı yoktur; bir çağıran burada Gateway kimlik doğrulamasını geçtikten sonra OpenClaw o çağıranı bu gateway için güvenilir operatör olarak ele alır.
- Paylaşılan gizli kimlik doğrulama modları (`token` ve `password`) için, çağıran daha dar bir `x-openclaw-scopes` başlığı gönderse bile uç nokta normal tam operatör varsayılanlarını geri yükler.
- Güvenilir kimlik taşıyan HTTP modları (örneğin güvenilir proxy kimlik doğrulaması veya `gateway.auth.mode="none"`) varsa `x-openclaw-scopes` değerini dikkate alır, yoksa normal operatör varsayılan kapsam kümesine geri döner.
- Hedef ajan ilkesi hassas araçlara izin veriyorsa bu uç nokta onları kullanabilir.
- Bu uç noktayı yalnızca loopback/tailnet/özel giriş üzerinde tutun; doğrudan genel internete açmayın.

Kimlik doğrulama matrisi:

- `gateway.auth.mode="token"` veya `"password"` + `Authorization: Bearer ...`
  - paylaşılan gateway operatör sırrına sahip olunduğunu kanıtlar
  - daha dar `x-openclaw-scopes` değerlerini yok sayar
  - tam varsayılan operatör kapsam kümesini geri yükler:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - bu uç noktadaki sohbet dönüşlerini sahip-gönderen dönüşleri olarak ele alır
- güvenilir kimlik taşıyan HTTP modları (örneğin güvenilir proxy kimlik doğrulaması veya özel girişte `gateway.auth.mode="none"`)
  - dıştaki bir güvenilir kimliği veya dağıtım sınırını doğrular
  - başlık mevcut olduğunda `x-openclaw-scopes` değerini dikkate alır
  - başlık yoksa normal operatör varsayılan kapsam kümesine geri döner
  - yalnızca çağıran kapsamları açıkça daraltıp `operator.admin` değerini atladığında sahip semantiğini kaybeder

Bkz. [Güvenlik](/tr/gateway/security) ve [Uzaktan erişim](/tr/gateway/remote).

## Ajan öncelikli model sözleşmesi

OpenClaw, OpenAI `model` alanını ham sağlayıcı model kimliği olarak değil, bir **ajan hedefi** olarak ele alır.

- `model: "openclaw"` yapılandırılmış varsayılan ajana yönlendirir.
- `model: "openclaw/default"` de yapılandırılmış varsayılan ajana yönlendirir.
- `model: "openclaw/<agentId>"` belirli bir ajana yönlendirir.

İsteğe bağlı istek başlıkları:

- `x-openclaw-model: <provider/model-or-bare-id>` seçilen ajan için arka uç modelini geçersiz kılar.
- `x-openclaw-agent-id: <agentId>` uyumluluk geçersiz kılması olarak desteklenmeye devam eder.
- `x-openclaw-session-key: <sessionKey>` oturum yönlendirmesini tamamen kontrol eder.
- `x-openclaw-message-channel: <channel>` kanal farkındalıklı istemler ve ilkeler için sentetik giriş kanalı bağlamını ayarlar.

Hâlâ kabul edilen uyumluluk takma adları:

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

İstek bir OpenAI `user` dizesi içerirse Gateway bundan kararlı bir oturum anahtarı türetir; böylece tekrarlanan çağrılar bir ajan oturumunu paylaşabilir.

## Bu yüzey neden önemlidir?

Bu, kendi barındırılan ön uçlar ve araçlar için en yüksek kaldıraçlı uyumluluk kümesidir:

- Çoğu Open WebUI, LobeChat ve LibreChat kurulumu `/v1/models` bekler.
- Birçok RAG sistemi `/v1/embeddings` bekler.
- Mevcut OpenAI sohbet istemcileri genellikle `/v1/chat/completions` ile başlayabilir.
- Daha ajan-yerel istemciler giderek daha fazla `/v1/responses` tercih eder.

## Model listesi ve ajan yönlendirmesi

<AccordionGroup>
  <Accordion title="`/v1/models` ne döndürür?">
    Bir OpenClaw ajan-hedef listesi.

    Döndürülen kimlikler `openclaw`, `openclaw/default` ve `openclaw/<agentId>` girdileridir.
    Bunları doğrudan OpenAI `model` değerleri olarak kullanın.

  </Accordion>
  <Accordion title="`/v1/models` ajanları mı yoksa alt ajanları mı listeler?">
    Arka uç sağlayıcı modellerini veya alt ajanları değil, üst düzey ajan hedeflerini listeler.

    Alt ajanlar dahili yürütme topolojisi olarak kalır. Sözde modeller olarak görünmezler.

  </Accordion>
  <Accordion title="`openclaw/default` neden dahil?">
    `openclaw/default`, yapılandırılmış varsayılan ajan için kararlı takma addır.

    Bu, gerçek varsayılan ajan kimliği ortamlar arasında değişse bile istemcilerin öngörülebilir tek bir kimliği kullanmaya devam edebileceği anlamına gelir.

  </Accordion>
  <Accordion title="Arka uç modelini nasıl geçersiz kılarım?">
    `x-openclaw-model` kullanın.

    Örnekler:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Bunu atlarsanız seçilen ajan normal yapılandırılmış model seçimiyle çalışır.

  </Accordion>
  <Accordion title="Embeddings bu sözleşmeye nasıl uyar?">
    `/v1/embeddings` aynı ajan-hedef `model` kimliklerini kullanır.

    `model: "openclaw/default"` veya `model: "openclaw/<agentId>"` kullanın.
    Belirli bir embedding modeline ihtiyacınız olduğunda bunu `x-openclaw-model` içinde gönderin.
    Bu başlık olmadan istek, seçilen ajanın normal embedding kurulumuna geçirilir.

  </Accordion>
</AccordionGroup>

## Akış (SSE)

Server-Sent Events (SSE) almak için `stream: true` ayarlayın:

- `Content-Type: text/event-stream`
- Her olay satırı `data: <json>` biçimindedir
- Akış `data: [DONE]` ile biter

## Sohbet aracı sözleşmesi

`/v1/chat/completions`, yaygın OpenAI Sohbet istemcileriyle uyumlu bir işlev-aracı alt kümesini destekler.

### Desteklenen istek alanları

- `tools`: `{ "type": "function", "function": { ... } }` dizisi
- `tool_choice`: `"auto"`, `"none"`
- `messages[*].role: "tool"` takip dönüşleri
- araç sonuçlarını önceki bir araç çağrısına geri bağlamak için `messages[*].tool_call_id`
- `max_completion_tokens`: sayı; toplam tamamlama token'ları için çağrı başına sınır (akıl yürütme token'ları dahil). Güncel OpenAI Sohbet Tamamlamaları alan adı; hem `max_completion_tokens` hem de `max_tokens` gönderildiğinde tercih edilir.
- `max_tokens`: sayı; geriye dönük uyumluluk için kabul edilen eski takma ad. `max_completion_tokens` de mevcut olduğunda yok sayılır.

Her iki alan da ayarlandığında değer, ajan stream-param kanalı üzerinden yukarı akış sağlayıcısına iletilir. Yukarı akış sağlayıcısına gönderilen gerçek wire alan adı sağlayıcı aktarımı tarafından seçilir: OpenAI ailesi uç noktaları için `max_completion_tokens`, yalnızca eski adı kabul eden sağlayıcılar için (Mistral ve Chutes gibi) `max_tokens`.

### Desteklenmeyen varyantlar

Uç nokta, aşağıdakiler dahil desteklenmeyen araç varyantları için `400 invalid_request_error` döndürür:

- dizi olmayan `tools`
- işlev olmayan araç girdileri
- eksik `tool.function.name`
- `allowed_tools` ve `custom` gibi `tool_choice` varyantları
- `tool_choice: "required"` (henüz çalışma zamanında zorlanmıyor; katı zorlama uygulandığında desteklenecek)
- `tool_choice: { "type": "function", "function": { "name": "..." } }` (`required` ile aynı gerekçe)
- sağlanan `tools` ile eşleşmeyen `tool_choice.function.name` değerleri

### Akışsız araç yanıtı şekli

Ajan araçları çağırmaya karar verdiğinde yanıt şunu kullanır:

- `choices[0].finish_reason = "tool_calls"`
- Şunları içeren `choices[0].message.tool_calls[]` girdileri:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (JSON dizesi)

Araç çağrısından önceki asistan yorumu `choices[0].message.content` içinde döndürülür (boş olabilir).

### Akışlı araç yanıtı şekli

`stream: true` olduğunda araç çağrıları artımlı SSE parçaları olarak yayımlanır:

- ilk asistan rol deltası
- isteğe bağlı asistan yorumu deltaları
- araç kimliği ve argüman parçaları taşıyan bir veya daha fazla `delta.tool_calls` parçası
- `finish_reason: "tool_calls"` içeren son parça
- `data: [DONE]`

`stream_options.include_usage=true` ise `[DONE]` öncesinde sonda bir kullanım parçası yayımlanır.

### Araç takip döngüsü

`tool_calls` alındıktan sonra istemci, istenen işlevleri yürütmeli ve şunları içeren bir takip isteği göndermelidir:

- önceki asistan araç-çağrı mesajı
- eşleşen `tool_call_id` içeren bir veya daha fazla `role: "tool"` mesajı

Bu, gateway ajan çalıştırmasının aynı akıl yürütme döngüsüne devam etmesini ve nihai asistan yanıtını üretmesini sağlar.

## Open WebUI hızlı kurulumu

Temel bir Open WebUI bağlantısı için:

- Temel URL: `http://127.0.0.1:18789/v1`
- macOS üzerinde Docker temel URL'si: `http://host.docker.internal:18789/v1`
- API anahtarı: Gateway bearer token'ınız
- Model: `openclaw/default`

Beklenen davranış:

- `GET /v1/models` `openclaw/default` listesini göstermelidir
- Open WebUI sohbet model kimliği olarak `openclaw/default` kullanmalıdır
- Bu ajan için belirli bir arka uç sağlayıcı/model istiyorsanız ajanın normal varsayılan modelini ayarlayın veya `x-openclaw-model` gönderin

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

Modelleri listele:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Bir modeli getir:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Embeddings oluştur:

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

- `/v1/models` ham sağlayıcı kataloglarını değil, OpenClaw aracı hedeflerini döndürür.
- `openclaw/default` her zaman mevcuttur; böylece tek bir kararlı kimlik ortamlar arasında çalışır.
- Arka uç sağlayıcı/model geçersiz kılmaları, OpenAI `model` alanında değil `x-openclaw-model` içinde yer almalıdır.
- `/v1/embeddings`, `input` için bir dize veya dize dizisini destekler.

## İlgili

- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
- [OpenAI](/tr/providers/openai)

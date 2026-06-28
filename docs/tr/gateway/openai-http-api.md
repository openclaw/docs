---
read_when:
    - OpenAI Chat Completions bekleyen araçları entegre etme
summary: Gateway’den OpenAI uyumlu /v1/chat/completions HTTP uç noktasını kullanıma açın
title: OpenAI sohbet tamamlamaları
x-i18n:
    generated_at: "2026-06-28T00:36:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8746f4f5964a5d0b948877b64b5d20440dea3aa45b36813c404cd06660792cf
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw'ın Gateway'i, küçük bir OpenAI uyumlu Chat Completions uç noktası sunabilir.

Bu uç nokta **varsayılan olarak devre dışıdır**. Önce yapılandırmada etkinleştirin.

- `POST /v1/chat/completions`
- Gateway ile aynı bağlantı noktası (WS + HTTP çoklama): `http://<gateway-host>:<port>/v1/chat/completions`

Gateway'in OpenAI uyumlu HTTP yüzeyi etkinleştirildiğinde, şunları da sunar:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Arka planda istekler normal bir Gateway ajan çalıştırması olarak yürütülür (`openclaw agent` ile aynı kod yolu), bu nedenle yönlendirme/izinler/yapılandırma Gateway'inizle eşleşir.

## Kimlik Doğrulama

Gateway kimlik doğrulama yapılandırmasını kullanır.

Yaygın HTTP kimlik doğrulama yolları:

- paylaşılan gizli anahtar kimlik doğrulaması (`gateway.auth.mode="token"` veya `"password"`):
  `Authorization: Bearer <token-or-password>`
- güvenilir kimlik taşıyan HTTP kimlik doğrulaması (`gateway.auth.mode="trusted-proxy"`):
  yapılandırılmış kimlik farkında proxy üzerinden yönlendirin ve gerekli
  kimlik başlıklarını enjekte etmesine izin verin
- özel giriş açık kimlik doğrulaması (`gateway.auth.mode="none"`):
  kimlik doğrulama başlığı gerekmez

Notlar:

- `gateway.auth.mode="token"` olduğunda, `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`) kullanın.
- `gateway.auth.mode="password"` olduğunda, `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) kullanın.
- `gateway.auth.mode="trusted-proxy"` olduğunda, HTTP isteği yapılandırılmış bir
  güvenilir proxy kaynağından gelmelidir; aynı ana makinedeki loopback proxy'leri açıkça
  `gateway.auth.trustedProxy.allowLoopback = true` gerektirir.
- Proxy'yi atlayan dahili aynı ana makine çağırıcıları, yerel doğrudan
  yedek yol olarak `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` kullanabilir.
  Bunun yerine herhangi bir `Forwarded`, `X-Forwarded-*` veya `X-Real-IP` başlık kanıtı
  isteği güvenilir proxy yolunda tutar.
- `gateway.auth.rateLimit` yapılandırılmışsa ve çok fazla kimlik doğrulama hatası oluşursa, uç nokta `Retry-After` ile `429` döndürür.

## Güvenlik sınırı (önemli)

Bu uç noktayı gateway örneği için **tam operatör erişimli** bir yüzey olarak ele alın.

- Buradaki HTTP bearer kimlik doğrulaması dar bir kullanıcı başına kapsam modeli değildir.
- Bu uç nokta için geçerli bir Gateway token/parolası, sahip/operatör kimlik bilgisi gibi ele alınmalıdır.
- İstekler, güvenilir operatör eylemleriyle aynı denetim düzlemi ajan yolundan geçer.
- Bu uç noktada ayrı bir sahip olmayan/kullanıcı başına araç sınırı yoktur; bir çağırıcı burada Gateway kimlik doğrulamasını geçtikten sonra, OpenClaw bu çağırıcıyı bu gateway için güvenilir operatör olarak ele alır.
- Paylaşılan gizli anahtar kimlik doğrulama modlarında (`token` ve `password`), çağırıcı daha dar bir `x-openclaw-scopes` başlığı gönderse bile uç nokta normal tam operatör varsayılanlarını geri yükler.
- Güvenilir kimlik taşıyan HTTP modları (örneğin güvenilir proxy kimlik doğrulaması veya `gateway.auth.mode="none"`) mevcut olduğunda `x-openclaw-scopes` değerine uyar ve aksi halde normal operatör varsayılan kapsam kümesine geri döner.
- Hedef ajan ilkesi hassas araçlara izin veriyorsa, bu uç nokta onları kullanabilir.
- Bu uç noktayı yalnızca loopback/tailnet/özel giriş üzerinde tutun; doğrudan genel internete açmayın.

Kimlik doğrulama matrisi:

- `gateway.auth.mode="token"` veya `"password"` + `Authorization: Bearer ...`
  - paylaşılan gateway operatör sırrına sahip olunduğunu kanıtlar
  - daha dar `x-openclaw-scopes` değerini yok sayar
  - tam varsayılan operatör kapsam kümesini geri yükler:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - bu uç noktadaki sohbet dönüşlerini sahip gönderen dönüşleri olarak ele alır
- güvenilir kimlik taşıyan HTTP modları (örneğin güvenilir proxy kimlik doğrulaması veya özel girişte `gateway.auth.mode="none"`)
  - bazı dış güvenilir kimliği veya dağıtım sınırını doğrular
  - başlık mevcut olduğunda `x-openclaw-scopes` değerine uyar
  - başlık yoksa normal operatör varsayılan kapsam kümesine geri döner
  - yalnızca çağırıcı kapsamları açıkça daraltıp `operator.admin` öğesini atladığında sahip semantiğini kaybeder
  - `x-openclaw-model` gibi sahip düzeyi istek denetimleri için `operator.admin` gerektirir

Bkz. [Güvenlik](/tr/gateway/security) ve [Uzaktan erişim](/tr/gateway/remote).

## Bu uç nokta ne zaman kullanılmalı

Mevcut bir gateway ile araçları veya güvenilir bir uygulama tarafı arka ucu tümleştiriyorsanız ve gateway operatör kimlik bilgilerini güvenle tutabiliyorsanız `/v1/chat/completions` kullanın.

- Entegrasyonunuz aynı gateway için yalnızca başka bir operatör/istemci yüzeyiyse, yeni bir yerleşik kanal eklemek yerine bunu tercih edin.
- Uzak bir gateway'e doğrudan bağlanan yerel mobil istemciler için [WebChat](/tr/web/webchat) veya [Gateway Protocol](/tr/gateway/protocol) tercih edin ve cihazın paylaşılan bir HTTP token/parolasına ihtiyaç duymaması için eşleştirilmiş cihaz önyükleme/cihaz token akışını uygulayın.
- Kendi kullanıcıları, odaları, Webhook teslimi veya giden aktarımı olan harici bir mesajlaşma ağıyla tümleştiriyorsanız bunun yerine bir kanal Plugin'i oluşturun. Bkz. [Plugin oluşturma](/tr/plugins/building-plugins).

## Ajan öncelikli model sözleşmesi

OpenClaw, OpenAI `model` alanını ham sağlayıcı model kimliği olarak değil, bir **ajan hedefi** olarak ele alır.

- `model: "openclaw"` yapılandırılmış varsayılan ajana yönlendirir.
- `model: "openclaw/default"` da yapılandırılmış varsayılan ajana yönlendirir.
- `model: "openclaw/<agentId>"` belirli bir ajana yönlendirir.

İsteğe bağlı istek başlıkları:

- `x-openclaw-model: <provider/model-or-bare-id>` seçilen ajan için arka uç modelini geçersiz kılar. Paylaşılan gizli anahtar bearer çağırıcıları bu başlığı kullanabilir. Güvenilir proxy veya `x-openclaw-scopes` içeren özel kimlik doğrulamasız giriş istekleri gibi kimlik taşıyan çağırıcılar `operator.admin` gerektirir; yalnızca yazma yetkili çağırıcılar `403 missing scope: operator.admin` alır.
- `x-openclaw-agent-id: <agentId>` uyumluluk geçersiz kılması olarak desteklenmeye devam eder.
- `x-openclaw-session-key: <sessionKey>` oturum yönlendirmesini açıkça denetler. Değer `subagent:`, `cron:` veya `acp:` gibi ayrılmış dahili oturum ad alanlarını kullanmamalıdır; bu istekler `400 invalid_request_error` ile reddedilir.
- `x-openclaw-message-channel: <channel>` kanal farkında istemler ve ilkeler için sentetik giriş kanalı bağlamını ayarlar.

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

Varsayılan olarak uç nokta **istek başına durumsuzdur** (her çağrıda yeni bir oturum anahtarı oluşturulur).

İstek bir OpenAI `user` dizesi içeriyorsa, Gateway bundan kararlı bir oturum anahtarı türetir; böylece tekrarlanan çağrılar bir ajan oturumunu paylaşabilir.

Özel uygulamalar için en güvenli varsayılan, konuşma iş parçacığı başına aynı `user` değerini yeniden kullanmaktır. Birden çok konuşmanın veya cihazın tek bir OpenClaw oturumunu paylaşmasını açıkça istemiyorsanız hesap düzeyi tanımlayıcılardan kaçının. `x-openclaw-session-key` değerini yalnızca birden çok istemci veya iş parçacığı arasında açık yönlendirme denetimine ihtiyaç duyduğunuzda kullanın ve `subagent:`, `cron:` veya `acp:` gibi ayrılmış dahili ad alanlarıyla başlamayan, uygulamaya ait anahtarlar seçin.

## Bu yüzey neden önemlidir

Bu, kendi barındırdığınız ön uçlar ve araçlar için en yüksek kaldıraçlı uyumluluk kümesidir:

- Çoğu Open WebUI, LobeChat ve LibreChat kurulumu `/v1/models` bekler.
- Birçok RAG sistemi `/v1/embeddings` bekler.
- Mevcut OpenAI sohbet istemcileri genellikle `/v1/chat/completions` ile başlayabilir.
- Daha ajan-yerel istemciler giderek daha fazla `/v1/responses` tercih eder.

## Model listesi ve ajan yönlendirme

<AccordionGroup>
  <Accordion title="`/v1/models` ne döndürür?">
    Bir OpenClaw ajan hedef listesi.

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
    `x-openclaw-model` kullanın. Bu sahip düzeyi bir geçersiz kılmadır: Gateway paylaşılan gizli anahtar bearer token/parola yolu ile çalışır ve güvenilir proxy kimlik doğrulaması gibi kimlik taşıyan HTTP yollarında `operator.admin` gerektirir.

    Örnekler:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Bunu atlarsanız, seçilen ajan normal yapılandırılmış model seçimiyle çalışır.

  </Accordion>
  <Accordion title="Embeddings bu sözleşmeye nasıl uyar?">
    `/v1/embeddings` aynı ajan hedefli `model` kimliklerini kullanır.

    `model: "openclaw/default"` veya `model: "openclaw/<agentId>"` kullanın.
    Belirli bir embedding modeline ihtiyaç duyduğunuzda, bunu paylaşılan gizli anahtar çağırıcısından veya `operator.admin` bulunan kimlik taşıyan çağırıcıdan `x-openclaw-model` içinde gönderin.
    Bu başlık olmadan istek, seçilen ajanın normal embedding kurulumuna iletilir.

  </Accordion>
</AccordionGroup>

## Akış (SSE)

Server-Sent Events (SSE) almak için `stream: true` ayarlayın:

- `Content-Type: text/event-stream`
- Her olay satırı `data: <json>` biçimindedir
- Akış `data: [DONE]` ile biter

## Sohbet aracı sözleşmesi

`/v1/chat/completions`, yaygın OpenAI Chat istemcileriyle uyumlu bir function-tool alt kümesini destekler.

### Desteklenen istek alanları

- `tools`: `{ "type": "function", "function": { ... } }` dizisi
- `tool_choice`: `"auto"`, `"none"`, `"required"` veya `{ "type": "function", "function": { "name": "..." } }`
- `messages[*].role: "tool"` takip dönüşleri
- `messages[*].tool_call_id` araç sonuçlarını önceki bir araç çağrısına geri bağlamak için
- `max_completion_tokens`: sayı; toplam tamamlama token'ları için çağrı başına üst sınır (akıl yürütme token'ları dahil). Geçerli OpenAI Chat Completions alan adı; hem `max_completion_tokens` hem de `max_tokens` gönderildiğinde tercih edilir.
- `max_tokens`: sayı; geriye dönük uyumluluk için kabul edilen eski takma ad. `max_completion_tokens` da mevcut olduğunda yok sayılır.
- `temperature`: sayı; agent stream-param kanalı üzerinden yukarı akış sağlayıcısına iletilen en iyi çaba örnekleme sıcaklığı.
- `top_p`: sayı; agent stream-param kanalı üzerinden yukarı akış sağlayıcısına iletilen en iyi çaba nucleus sampling.
- `frequency_penalty`: sayı; agent stream-param kanalı üzerinden yukarı akış sağlayıcısına iletilen en iyi çaba frequency penalty. Doğrulanan aralık: -2.0 ile 2.0 arası. Aralık dışı değerler için `400 invalid_request_error` döndürür.
- `presence_penalty`: sayı; agent stream-param kanalı üzerinden yukarı akış sağlayıcısına iletilen en iyi çaba presence penalty. Doğrulanan aralık: -2.0 ile 2.0 arası. Aralık dışı değerler için `400 invalid_request_error` döndürür.
- `seed`: sayı (tamsayı); agent stream-param kanalı üzerinden yukarı akış sağlayıcısına iletilen en iyi çaba seed. Tamsayı olmayan değerler için `400 invalid_request_error` döndürür.
- `stop`: dize veya en fazla 4 dizeden oluşan dizi; agent stream-param kanalı üzerinden yukarı akış sağlayıcısına iletilen en iyi çaba durdurma dizileri. 4'ten fazla dizi veya dize olmayan/boş girdiler için `400 invalid_request_error` döndürür.

Her iki token sınırı alanından biri ayarlandığında, değer agent stream-param kanalı üzerinden upstream sağlayıcıya iletilir. Upstream sağlayıcıya gönderilen gerçek wire alanı adı sağlayıcı transport'u tarafından seçilir: OpenAI ailesi endpoint'leri için `max_completion_tokens`, yalnızca eski adı kabul eden sağlayıcılar için (Mistral ve Chutes gibi) `max_tokens`. Örnekleme alanları (`temperature`, `top_p`, `frequency_penalty`, `presence_penalty`, `seed`) aynı stream-param kanalını izler; ChatGPT tabanlı Codex Responses backend'i, sabit örnekleme kullandığı için bunları sunucu tarafında çıkarır. `stop` da stream-param kanalı üzerinden gider ve transport'un stop alanına eşlenir (Chat Completions backend'leri için `stop`, Anthropic için `stop_sequences`); OpenAI Responses API'de stop parametresi yoktur, bu nedenle `stop` Responses destekli modellerde uygulanmaz.

### Desteklenmeyen varyantlar

Endpoint, aşağıdakiler dahil desteklenmeyen araç varyantları için `400 invalid_request_error` döndürür:

- dizi olmayan `tools`
- işlev olmayan araç girdileri
- eksik `tool.function.name`
- `allowed_tools` ve `custom` gibi `tool_choice` varyantları
- sağlanan `tools` ile eşleşmeyen `tool_choice.function.name` değerleri

`tool_choice: "required"` ve işleve sabitlenmiş `tool_choice` için endpoint, açığa çıkarılan istemci işlev-aracı kümesini daraltır, runtime'a yanıt vermeden önce bir istemci aracını çağırması talimatını verir ve agent yanıtı eşleşen yapılandırılmış bir istemci-aracı çağrısı içermiyorsa hata döndürür. Bu sözleşme, her dahili OpenClaw agent aracına değil, çağıranın sağladığı HTTP `tools` listesine uygulanır.

### Streaming olmayan araç yanıtı şekli

Agent araçları çağırmaya karar verdiğinde yanıt şunu kullanır:

- `choices[0].finish_reason = "tool_calls"`
- Şunları içeren `choices[0].message.tool_calls[]` girdileri:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (JSON dizesi)

Araç çağrısından önceki assistant yorumu `choices[0].message.content` içinde döndürülür (boş olabilir).

### Streaming araç yanıtı şekli

`stream: true` olduğunda, araç çağrıları artımlı SSE parçaları olarak yayınlanır:

- ilk assistant rol deltası
- isteğe bağlı assistant yorum deltaları
- araç kimliğini ve argüman parçalarını taşıyan bir veya daha fazla `delta.tool_calls` parçası
- `finish_reason: "tool_calls"` içeren son parça
- `data: [DONE]`

`stream_options.include_usage=true` ise, `[DONE]` öncesinde sonda bir kullanım parçası yayınlanır.

### Araç takip döngüsü

İstemci, `tool_calls` aldıktan sonra istenen işlevleri yürütmeli ve şunları içeren bir takip isteği göndermelidir:

- önceki assistant araç çağrısı mesajı
- eşleşen `tool_call_id` değerlerine sahip bir veya daha fazla `role: "tool"` mesajı

Bu, Gateway agent çalışmasının aynı muhakeme döngüsüne devam etmesini ve son assistant yanıtını üretmesini sağlar.

## Open WebUI hızlı kurulum

Temel bir Open WebUI bağlantısı için:

- Temel URL: `http://127.0.0.1:18789/v1`
- macOS üzerinde Docker temel URL'si: `http://host.docker.internal:18789/v1`
- API anahtarı: Gateway bearer token'ınız
- Model: `openclaw/default`

Beklenen davranış:

- `GET /v1/models`, `openclaw/default` değerini listelemelidir
- Open WebUI, sohbet model kimliği olarak `openclaw/default` kullanmalıdır
- Bu agent için belirli bir backend sağlayıcı/model istiyorsanız, agent'ın normal varsayılan modelini ayarlayın veya paylaşılan gizli anahtarlı bir çağırandan ya da `operator.admin` içeren kimlik taşıyan bir çağırandan `x-openclaw-model` gönderin

Hızlı smoke testi:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Bu `openclaw/default` döndürürse, çoğu Open WebUI kurulumu aynı temel URL ve token ile bağlanabilir.

## Örnekler

Tek bir uygulama konuşması için kararlı oturum:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "user": "conv:YOUR_CONVERSATION_ID",
    "messages": [{"role":"user","content":"Summarize my tasks for today"}]
  }'
```

Aynı agent oturumunu sürdürmek için bu konuşmanın sonraki çağrılarında aynı `user` değerini yeniden kullanın.

Streaming olmayan:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Streaming:

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

Tek bir modeli getir:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Embedding oluştur:

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

- `/v1/models`, ham sağlayıcı kataloglarını değil OpenClaw agent hedeflerini döndürür.
- `openclaw/default` her zaman bulunur; böylece tek bir kararlı kimlik ortamlar arasında çalışır.
- Backend sağlayıcı/model geçersiz kılmaları OpenAI `model` alanında değil, `x-openclaw-model` içinde olmalıdır. Kimlik taşıyan HTTP kimlik doğrulama yollarında bu header `operator.admin` gerektirir.
- `/v1/embeddings`, `input` değerini dize veya dize dizisi olarak destekler.

## İlgili

- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
- [OpenAI](/tr/providers/openai)

---
read_when:
    - OpenAI Chat Completions bekleyen araçları entegre etme
summary: Gateway'den OpenAI uyumlu /v1/chat/completions HTTP uç noktasını kullanıma açın
title: OpenAI sohbet tamamlamaları
x-i18n:
    generated_at: "2026-04-30T09:23:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a19f9d9d6d8ce6d605f8af5324ae3eb0c100c167609341c8dfb569970b0b2c9
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw’ın Gateway’i küçük bir OpenAI uyumlu Chat Completions uç noktası sunabilir.

Bu uç nokta **varsayılan olarak devre dışıdır**. Önce yapılandırmada etkinleştirin.

- `POST /v1/chat/completions`
- Gateway ile aynı port (WS + HTTP çoklama): `http://<gateway-host>:<port>/v1/chat/completions`

Gateway’in OpenAI uyumlu HTTP yüzeyi etkinleştirildiğinde şunları da sunar:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Perde arkasında istekler normal bir Gateway ajan çalıştırması olarak yürütülür (`openclaw agent` ile aynı kod yolu), bu yüzden yönlendirme/izinler/yapılandırma Gateway’inizle eşleşir.

## Kimlik doğrulama

Gateway kimlik doğrulama yapılandırmasını kullanır.

Yaygın HTTP kimlik doğrulama yolları:

- paylaşılan gizli anahtar kimlik doğrulaması (`gateway.auth.mode="token"` veya `"password"`):
  `Authorization: Bearer <token-or-password>`
- güvenilir kimlik taşıyan HTTP kimlik doğrulaması (`gateway.auth.mode="trusted-proxy"`):
  yapılandırılmış kimlik farkındalığı olan proxy üzerinden yönlendirin ve gerekli
  kimlik başlıklarını onun eklemesine izin verin
- özel giriş açık kimlik doğrulaması (`gateway.auth.mode="none"`):
  kimlik doğrulama başlığı gerekmez

Notlar:

- `gateway.auth.mode="token"` olduğunda `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`) kullanın.
- `gateway.auth.mode="password"` olduğunda `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) kullanın.
- `gateway.auth.mode="trusted-proxy"` olduğunda HTTP isteği yapılandırılmış
  güvenilir bir proxy kaynağından gelmelidir; aynı ana makinedeki loopback proxy’leri açıkça
  `gateway.auth.trustedProxy.allowLoopback = true` gerektirir.
- `gateway.auth.rateLimit` yapılandırılmışsa ve çok fazla kimlik doğrulama hatası olursa, uç nokta `Retry-After` ile `429` döndürür.

## Güvenlik sınırı (önemli)

Bu uç noktayı Gateway örneği için **tam operatör erişimli** bir yüzey olarak ele alın.

- Buradaki HTTP bearer kimlik doğrulaması dar bir kullanıcı başına kapsam modeli değildir.
- Bu uç nokta için geçerli bir Gateway belirteci/parolası, sahip/operatör kimlik bilgisi gibi ele alınmalıdır.
- İstekler, güvenilir operatör eylemleriyle aynı denetim düzlemi ajan yolundan geçer.
- Bu uç noktada ayrı bir sahip olmayan/kullanıcı başına araç sınırı yoktur; bir çağıran burada Gateway kimlik doğrulamasını geçtikten sonra OpenClaw bu çağıranı bu Gateway için güvenilir operatör olarak kabul eder.
- Paylaşılan gizli anahtar kimlik doğrulama modlarında (`token` ve `password`), çağıran daha dar bir `x-openclaw-scopes` başlığı gönderse bile uç nokta normal tam operatör varsayılanlarını geri yükler.
- Güvenilir kimlik taşıyan HTTP modları (örneğin güvenilir proxy kimlik doğrulaması veya `gateway.auth.mode="none"`) mevcut olduğunda `x-openclaw-scopes` değerine uyar; aksi halde normal operatör varsayılan kapsam kümesine geri döner.
- Hedef ajan ilkesi hassas araçlara izin veriyorsa bu uç nokta bunları kullanabilir.
- Bu uç noktayı yalnızca loopback/tailnet/özel giriş üzerinde tutun; doğrudan genel internete açmayın.

Kimlik doğrulama matrisi:

- `gateway.auth.mode="token"` veya `"password"` + `Authorization: Bearer ...`
  - paylaşılan Gateway operatör gizli anahtarına sahip olunduğunu kanıtlar
  - daha dar `x-openclaw-scopes` değerlerini yok sayar
  - tam varsayılan operatör kapsam kümesini geri yükler:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - bu uç noktadaki sohbet turlarını sahip-gönderen turları olarak ele alır
- güvenilir kimlik taşıyan HTTP modları (örneğin güvenilir proxy kimlik doğrulaması veya özel girişte `gateway.auth.mode="none"`)
  - dıştaki güvenilir bir kimliği veya dağıtım sınırını doğrular
  - başlık mevcut olduğunda `x-openclaw-scopes` değerine uyar
  - başlık yoksa normal operatör varsayılan kapsam kümesine geri döner
  - yalnızca çağıran kapsamları açıkça daraltıp `operator.admin` değerini atladığında sahip semantiğini kaybeder

Bkz. [Güvenlik](/tr/gateway/security) ve [Uzaktan erişim](/tr/gateway/remote).

## Ajan öncelikli model sözleşmesi

OpenClaw, OpenAI `model` alanını ham sağlayıcı model kimliği olarak değil, bir **ajan hedefi** olarak ele alır.

- `model: "openclaw"` yapılandırılmış varsayılan ajana yönlendirir.
- `model: "openclaw/default"` da yapılandırılmış varsayılan ajana yönlendirir.
- `model: "openclaw/<agentId>"` belirli bir ajana yönlendirir.

İsteğe bağlı istek başlıkları:

- `x-openclaw-model: <provider/model-or-bare-id>` seçili ajan için arka uç modelini geçersiz kılar.
- `x-openclaw-agent-id: <agentId>` uyumluluk geçersiz kılması olarak desteklenmeye devam eder.
- `x-openclaw-session-key: <sessionKey>` oturum yönlendirmesini tamamen denetler.
- `x-openclaw-message-channel: <channel>` kanal farkındalığı olan istemler ve ilkeler için sentetik giriş kanalı bağlamını ayarlar.

Hâlâ kabul edilen uyumluluk diğer adları:

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

İstek bir OpenAI `user` dizesi içeriyorsa Gateway bundan kararlı bir oturum anahtarı türetir; böylece tekrarlanan çağrılar bir ajan oturumunu paylaşabilir.

## Bu yüzey neden önemlidir?

Bu, kendi barındırılan ön uçlar ve araçlar için en yüksek kaldıraçlı uyumluluk kümesidir:

- Çoğu Open WebUI, LobeChat ve LibreChat kurulumu `/v1/models` bekler.
- Birçok RAG sistemi `/v1/embeddings` bekler.
- Mevcut OpenAI sohbet istemcileri genellikle `/v1/chat/completions` ile başlayabilir.
- Daha ajan yerel istemciler giderek daha fazla `/v1/responses` tercih eder.

## Model listesi ve ajan yönlendirmesi

<AccordionGroup>
  <Accordion title="`/v1/models` ne döndürür?">
    Bir OpenClaw ajan hedef listesi.

    Döndürülen kimlikler `openclaw`, `openclaw/default` ve `openclaw/<agentId>` girdileridir.
    Bunları doğrudan OpenAI `model` değerleri olarak kullanın.

  </Accordion>
  <Accordion title="`/v1/models` ajanları mı yoksa alt ajanları mı listeler?">
    Arka uç sağlayıcı modellerini veya alt ajanları değil, üst düzey ajan hedeflerini listeler.

    Alt ajanlar iç yürütme topolojisi olarak kalır. Sözde model olarak görünmezler.

  </Accordion>
  <Accordion title="`openclaw/default` neden dahil?">
    `openclaw/default`, yapılandırılmış varsayılan ajan için kararlı diğer addır.

    Bu, gerçek varsayılan ajan kimliği ortamlar arasında değişse bile istemcilerin öngörülebilir tek bir kimliği kullanmaya devam edebileceği anlamına gelir.

  </Accordion>
  <Accordion title="Arka uç modelini nasıl geçersiz kılarım?">
    `x-openclaw-model` kullanın.

    Örnekler:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Bunu atlarsanız seçili ajan normal yapılandırılmış model seçimiyle çalışır.

  </Accordion>
  <Accordion title="Embeddings bu sözleşmeye nasıl uyar?">
    `/v1/embeddings` aynı ajan hedefi `model` kimliklerini kullanır.

    `model: "openclaw/default"` veya `model: "openclaw/<agentId>"` kullanın.
    Belirli bir embedding modeli gerektiğinde bunu `x-openclaw-model` içinde gönderin.
    Bu başlık olmadan istek, seçili ajanın normal embedding kurulumuna iletilir.

  </Accordion>
</AccordionGroup>

## Akış (SSE)

Server-Sent Events (SSE) almak için `stream: true` ayarlayın:

- `Content-Type: text/event-stream`
- Her olay satırı `data: <json>` şeklindedir
- Akış `data: [DONE]` ile biter

## Open WebUI hızlı kurulumu

Temel bir Open WebUI bağlantısı için:

- Temel URL: `http://127.0.0.1:18789/v1`
- macOS üzerinde Docker temel URL’si: `http://host.docker.internal:18789/v1`
- API anahtarı: Gateway bearer belirteciniz
- Model: `openclaw/default`

Beklenen davranış:

- `GET /v1/models`, `openclaw/default` değerini listelemelidir
- Open WebUI, sohbet modeli kimliği olarak `openclaw/default` kullanmalıdır
- Bu ajan için belirli bir arka uç sağlayıcı/model istiyorsanız ajanın normal varsayılan modelini ayarlayın veya `x-openclaw-model` gönderin

Hızlı deneme:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Bu `openclaw/default` döndürürse çoğu Open WebUI kurulumu aynı temel URL ve belirteçle bağlanabilir.

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

Tek bir modeli getirme:

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

- `/v1/models`, ham sağlayıcı kataloglarını değil OpenClaw ajan hedeflerini döndürür.
- `openclaw/default` her zaman mevcuttur; böylece tek bir kararlı kimlik ortamlar arasında çalışır.
- Arka uç sağlayıcı/model geçersiz kılmaları OpenAI `model` alanına değil `x-openclaw-model` içine konur.
- `/v1/embeddings`, `input` değerini dize veya dize dizisi olarak destekler.

## İlgili

- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
- [OpenAI](/tr/providers/openai)

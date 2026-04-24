---
read_when:
    - OpenAI Chat Completions bekleyen araçları entegre etme
summary: Gateway’den OpenAI uyumlu bir `/v1/chat/completions` HTTP uç noktası sunun
title: OpenAI sohbet tamamlama işlemleri
x-i18n:
    generated_at: "2026-04-24T09:10:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55f581d56edbc23a8e8a6f8f1c5960db46042991abb3ee4436f477abafde2926
    source_path: gateway/openai-http-api.md
    workflow: 15
---

# OpenAI Chat Completions (HTTP)

OpenClaw’ın Gateway’i küçük bir OpenAI uyumlu Chat Completions uç noktası sunabilir.

Bu uç nokta varsayılan olarak **devre dışıdır**. Önce yapılandırmada etkinleştirin.

- `POST /v1/chat/completions`
- Gateway ile aynı port (WS + HTTP çoğullama): `http://<gateway-host>:<port>/v1/chat/completions`

Gateway’in OpenAI uyumlu HTTP yüzeyi etkinleştirildiğinde ayrıca şunları da sunar:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Arka planda istekler normal bir Gateway aracı çalıştırması olarak yürütülür (`openclaw agent` ile aynı kod yolu), bu nedenle yönlendirme/izinler/yapılandırma Gateway’inizle eşleşir.

## Kimlik doğrulama

Gateway kimlik doğrulama yapılandırmasını kullanır.

Yaygın HTTP kimlik doğrulama yolları:

- paylaşılan gizli kimlik doğrulama (`gateway.auth.mode="token"` veya `"password"`):
  `Authorization: Bearer <token-or-password>`
- güvenilen kimlik taşıyan HTTP kimlik doğrulama (`gateway.auth.mode="trusted-proxy"`):
  yapılandırılmış kimlik farkındalıklı proxy üzerinden yönlendirin ve gerekli
  kimlik üst bilgilerini onun enjekte etmesine izin verin
- özel girişte açık kimlik doğrulama (`gateway.auth.mode="none"`):
  kimlik doğrulama üst bilgisi gerekmez

Notlar:

- `gateway.auth.mode="token"` olduğunda `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`) kullanın.
- `gateway.auth.mode="password"` olduğunda `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) kullanın.
- `gateway.auth.mode="trusted-proxy"` olduğunda HTTP isteği yapılandırılmış,
  loopback olmayan güvenilen bir proxy kaynağından gelmelidir; aynı ana makinedeki loopback proxy’ler
  bu kipi karşılamaz.
- `gateway.auth.rateLimit` yapılandırılmışsa ve çok fazla kimlik doğrulama hatası oluşursa uç nokta `Retry-After` ile birlikte `429` döndürür.

## Güvenlik sınırı (önemli)

Bu uç noktayı Gateway örneği için **tam operatör erişimi** yüzeyi olarak değerlendirin.

- Buradaki HTTP bearer kimlik doğrulaması dar kapsamlı kullanıcı başına bir model değildir.
- Bu uç nokta için geçerli bir Gateway token/password değeri bir sahip/operatör kimlik bilgisi gibi değerlendirilmelidir.
- İstekler güvenilen operatör eylemleriyle aynı denetim düzlemi aracı yolundan geçer.
- Bu uç noktada ayrı bir sahip olmayan/kullanıcı başına araç sınırı yoktur; bir çağıran burada Gateway kimlik doğrulamasını geçtiğinde OpenClaw onu bu Gateway için güvenilen operatör olarak ele alır.
- Paylaşılan gizli kimlik doğrulama kiplerinde (`token` ve `password`), çağıran daha dar bir `x-openclaw-scopes` üst bilgisi gönderse bile uç nokta normal tam operatör varsayılanlarını geri yükler.
- Güvenilen kimlik taşıyan HTTP kipleri (örneğin güvenilen proxy kimlik doğrulaması veya `gateway.auth.mode="none"`), varsa `x-openclaw-scopes` değerini dikkate alır; yoksa normal operatör varsayılan kapsam kümesine geri döner.
- Hedef aracı ilkesi hassas araçlara izin veriyorsa bu uç nokta onları kullanabilir.
- Bu uç noktayı yalnızca loopback/tailnet/özel girişte tutun; doğrudan genel internete açmayın.

Kimlik doğrulama matrisi:

- `gateway.auth.mode="token"` veya `"password"` + `Authorization: Bearer ...`
  - paylaşılan Gateway operatör gizli bilgisinin elde bulunduğunu kanıtlar
  - daha dar `x-openclaw-scopes` değerlerini yok sayar
  - tam varsayılan operatör kapsam kümesini geri yükler:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - bu uç noktadaki sohbet dönüşlerini sahip-gönderen dönüşleri olarak ele alır
- güvenilen kimlik taşıyan HTTP kipleri (örneğin güvenilen proxy kimlik doğrulaması veya özel girişte `gateway.auth.mode="none"`)
  - bazı dış güvenilen kimlik veya dağıtım sınırlarını doğrular
  - üst bilgi mevcut olduğunda `x-openclaw-scopes` değerini dikkate alır
  - üst bilgi yoksa normal operatör varsayılan kapsam kümesine geri döner
  - yalnızca çağıran kapsamları açıkça daraltır ve `operator.admin` öğesini çıkarırsa sahip semantiğini kaybeder

Bkz. [Güvenlik](/tr/gateway/security) ve [Uzak erişim](/tr/gateway/remote).

## Önce aracı modeli sözleşmesi

OpenClaw, OpenAI `model` alanını ham bir sağlayıcı model kimliği değil, bir **aracı hedefi** olarak ele alır.

- `model: "openclaw"` yapılandırılmış varsayılan aracıya yönlendirilir.
- `model: "openclaw/default"` da yapılandırılmış varsayılan aracıya yönlendirilir.
- `model: "openclaw/<agentId>"` belirli bir aracıya yönlendirilir.

İsteğe bağlı istek üst bilgileri:

- `x-openclaw-model: <provider/model-or-bare-id>` seçilen aracı için arka uç modeli geçersiz kılar.
- `x-openclaw-agent-id: <agentId>` bir uyumluluk geçersiz kılması olarak desteklenmeye devam eder.
- `x-openclaw-session-key: <sessionKey>` oturum yönlendirmesini tamamen denetler.
- `x-openclaw-message-channel: <channel>` kanal farkındalıklı istemler ve ilkeler için sentetik giriş kanal bağlamını ayarlar.

Uyumluluk takma adları da kabul edilir:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Uç noktayı etkinleştirme

`gateway.http.endpoints.chatCompletions.enabled` değerini `true` yapın:

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

`gateway.http.endpoints.chatCompletions.enabled` değerini `false` yapın:

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

Varsayılan olarak uç nokta **istek başına durumsuzdur** (her çağrıda yeni bir oturum anahtarı üretilir).

İstek bir OpenAI `user` dizgesi içeriyorsa Gateway bundan kararlı bir oturum anahtarı türetir; böylece tekrarlanan çağrılar bir aracı oturumunu paylaşabilir.

## Bu yüzey neden önemlidir

Bu, kendi kendine barındırılan ön yüzler ve araçlar için en yüksek kaldıraçlı uyumluluk kümesidir:

- Çoğu Open WebUI, LobeChat ve LibreChat kurulumu `/v1/models` bekler.
- Birçok RAG sistemi `/v1/embeddings` bekler.
- Mevcut OpenAI sohbet istemcileri genellikle `/v1/chat/completions` ile başlayabilir.
- Daha aracı-yerel istemciler giderek daha fazla `/v1/responses` tercih ediyor.

## Model listesi ve aracı yönlendirmesi

<AccordionGroup>
  <Accordion title="`/v1/models` ne döndürür?">
    Bir OpenClaw aracı hedef listesi.

    Döndürülen kimlikler `openclaw`, `openclaw/default` ve `openclaw/<agentId>` girdileridir.
    Bunları doğrudan OpenAI `model` değerleri olarak kullanın.

  </Accordion>
  <Accordion title="`/v1/models` aracılar mı yoksa alt aracılar mı listeler?">
    Arka uç sağlayıcı modellerini veya alt aracıları değil, üst düzey aracı hedeflerini listeler.

    Alt aracılar dahili yürütme topolojisi olarak kalır. Sahte modeller olarak görünmezler.

  </Accordion>
  <Accordion title="Neden `openclaw/default` dahil edilir?">
    `openclaw/default`, yapılandırılmış varsayılan aracının kararlı takma adıdır.

    Bu, istemcilerin gerçek varsayılan aracı kimliği ortamlar arasında değişse bile tek bir öngörülebilir kimliği kullanmaya devam edebilmesi anlamına gelir.

  </Accordion>
  <Accordion title="Arka uç modelini nasıl geçersiz kılarım?">
    `x-openclaw-model` kullanın.

    Örnekler:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Bunu çıkarırsanız seçilen aracı normal yapılandırılmış model seçimiyle çalışır.

  </Accordion>
  <Accordion title="Embedding'ler bu sözleşmeye nasıl uyar?">
    `/v1/embeddings` aynı aracı hedefi `model` kimliklerini kullanır.

    `model: "openclaw/default"` veya `model: "openclaw/<agentId>"` kullanın.
    Belirli bir embedding modeli gerektiğinde bunu `x-openclaw-model` içinde gönderin.
    Bu üst bilgi olmadan istek seçilen aracının normal embedding kurulumundan geçer.

  </Accordion>
</AccordionGroup>

## Akış (SSE)

Server-Sent Events (SSE) almak için `stream: true` ayarlayın:

- `Content-Type: text/event-stream`
- Her olay satırı `data: <json>` şeklindedir
- Akış `data: [DONE]` ile biter

## Open WebUI hızlı kurulum

Temel bir Open WebUI bağlantısı için:

- Base URL: `http://127.0.0.1:18789/v1`
- macOS üzerinde Docker base URL: `http://host.docker.internal:18789/v1`
- API anahtarı: Gateway bearer token’ınız
- Model: `openclaw/default`

Beklenen davranış:

- `GET /v1/models`, `openclaw/default` listelemelidir
- Open WebUI, sohbet model kimliği olarak `openclaw/default` kullanmalıdır
- O aracı için belirli bir arka uç sağlayıcı/model istiyorsanız aracının normal varsayılan modelini ayarlayın veya `x-openclaw-model` gönderin

Hızlı smoke:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Bu `openclaw/default` döndürürse çoğu Open WebUI kurulumu aynı base URL ve token ile bağlanabilir.

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

- `/v1/models`, ham sağlayıcı kataloglarını değil, OpenClaw aracı hedeflerini döndürür.
- `openclaw/default` her zaman bulunur; böylece tek bir kararlı kimlik ortamlar arasında çalışır.
- Arka uç sağlayıcı/model geçersiz kılmaları OpenAI `model` alanında değil, `x-openclaw-model` içinde yer alır.
- `/v1/embeddings`, `input` değerini bir dizge veya dizge dizisi olarak destekler.

## İlgili

- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
- [OpenAI](/tr/providers/openai)

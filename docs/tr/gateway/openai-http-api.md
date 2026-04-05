---
read_when:
    - OpenAI Chat Completions bekleyen araçları entegre ederken
summary: Gateway'den OpenAI uyumlu bir `/v1/chat/completions` HTTP uç noktası sunun
title: OpenAI Chat Completions
x-i18n:
    generated_at: "2026-04-05T13:53:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: c374b2f32ce693a8c752e2b0a2532c5f0299ed280f9a0e97b1a9d73bcec37b95
    source_path: gateway/openai-http-api.md
    workflow: 15
---

# OpenAI Chat Completions (HTTP)

OpenClaw’ın Gateway'i küçük bir OpenAI uyumlu Chat Completions uç noktası sunabilir.

Bu uç nokta **varsayılan olarak devre dışıdır**. Önce config içinde etkinleştirin.

- `POST /v1/chat/completions`
- Gateway ile aynı bağlantı noktası (WS + HTTP çoklama): `http://<gateway-host>:<port>/v1/chat/completions`

Gateway'in OpenAI uyumlu HTTP yüzeyi etkinleştirildiğinde ayrıca şunları da sunar:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Arka planda istekler normal bir Gateway agent çalıştırması olarak yürütülür (`openclaw agent` ile aynı kod yolu), bu nedenle yönlendirme/izinler/config Gateway'inizle eşleşir.

## Kimlik doğrulama

Gateway auth config'ini kullanır.

Yaygın HTTP auth yolları:

- paylaşılan gizli bilgi auth'u (`gateway.auth.mode="token"` veya `"password"`):
  `Authorization: Bearer <token-or-password>`
- güvenilen kimlik taşıyan HTTP auth'u (`gateway.auth.mode="trusted-proxy"`):
  yapılandırılmış kimlik farkındalıklı proxy üzerinden yönlendirin ve onun gerekli
  kimlik başlıklarını eklemesine izin verin
- özel giriş açık auth'u (`gateway.auth.mode="none"`):
  auth başlığı gerekmez

Notlar:

- `gateway.auth.mode="token"` olduğunda `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`) kullanın.
- `gateway.auth.mode="password"` olduğunda `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) kullanın.
- `gateway.auth.mode="trusted-proxy"` olduğunda HTTP isteği, yapılandırılmış
  loopback olmayan güvenilen bir proxy kaynağından gelmelidir; aynı ana makinedeki loopback proxy'ler
  bu modu karşılamaz.
- `gateway.auth.rateLimit` yapılandırılmışsa ve çok fazla auth hatası oluşursa uç nokta `Retry-After` ile birlikte `429` döndürür.

## Güvenlik sınırı (önemli)

Bu uç noktayı, gateway örneği için **tam operatör erişimi** yüzeyi olarak değerlendirin.

- Buradaki HTTP bearer auth, dar kapsamlı kullanıcı başına bir kapsam modeli değildir.
- Bu uç nokta için geçerli bir Gateway token/parolası, bir sahip/operatör kimlik bilgisi gibi değerlendirilmelidir.
- İstekler, güvenilen operatör eylemleriyle aynı denetim düzlemi agent yolu üzerinden çalışır.
- Bu uç noktada ayrı bir sahip olmayan/kullanıcı başına araç sınırı yoktur; çağıran taraf burada Gateway auth'u geçtiğinde OpenClaw bu çağıranı bu gateway için güvenilen bir operatör olarak değerlendirir.
- Paylaşılan gizli bilgi auth modları için (`token` ve `password`), çağıran daha dar bir `x-openclaw-scopes` başlığı gönderse bile uç nokta normal tam operatör varsayılanlarını geri yükler.
- Güvenilen kimlik taşıyan HTTP modları (örneğin güvenilen proxy auth'u veya `gateway.auth.mode="none"`), varsa `x-openclaw-scopes` değerine uyar ve aksi halde normal operatör varsayılan kapsam kümesine geri döner.
- Hedef agent ilkesi hassas araçlara izin veriyorsa bu uç nokta bunları kullanabilir.
- Bu uç noktayı yalnızca loopback/tailnet/özel giriş üzerinde tutun; genel internete doğrudan açmayın.

Auth matrisi:

- `gateway.auth.mode="token"` veya `"password"` + `Authorization: Bearer ...`
  - paylaşılan gateway operatör gizli bilgisinin elde olduğunu kanıtlar
  - daha dar `x-openclaw-scopes` değerini yok sayar
  - tam varsayılan operatör kapsam kümesini geri yükler:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - bu uç noktadaki sohbet turlarını sahip-gönderen turları olarak değerlendirir
- güvenilen kimlik taşıyan HTTP modları (örneğin güvenilen proxy auth'u veya özel girişte `gateway.auth.mode="none"`)
  - dıştaki bazı güvenilen kimlik veya dağıtım sınırlarını kimlik doğrular
  - başlık mevcut olduğunda `x-openclaw-scopes` değerine uyar
  - başlık yoksa normal operatör varsayılan kapsam kümesine geri döner
  - yalnızca çağıran kapsamları açıkça daraltır ve `operator.admin` değerini atlar ise sahip anlamını kaybeder

Bkz. [Security](/gateway/security) ve [Remote access](/gateway/remote).

## Agent-first model sözleşmesi

OpenClaw, OpenAI `model` alanını ham bir sağlayıcı model kimliği olarak değil, bir **agent hedefi** olarak ele alır.

- `model: "openclaw"` yapılandırılmış varsayılan agent'a yönlendirilir.
- `model: "openclaw/default"` de yapılandırılmış varsayılan agent'a yönlendirilir.
- `model: "openclaw/<agentId>"` belirli bir agent'a yönlendirilir.

İsteğe bağlı istek başlıkları:

- `x-openclaw-model: <provider/model-or-bare-id>` seçili agent için arka uç modelini geçersiz kılar.
- `x-openclaw-agent-id: <agentId>` uyumluluk amaçlı geçersiz kılma olarak desteklenmeye devam eder.
- `x-openclaw-session-key: <sessionKey>` oturum yönlendirmesini tamamen denetler.
- `x-openclaw-message-channel: <channel>` kanal farkındalıklı istemler ve ilkeler için sentetik giriş kanal bağlamını ayarlar.

Uyumluluk takma adları hâlâ kabul edilir:

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

Varsayılan olarak uç nokta **istek başına durumsuzdur** (her çağrıda yeni bir oturum anahtarı üretilir).

İstek bir OpenAI `user` dizesi içeriyorsa Gateway bundan kararlı bir oturum anahtarı türetir; böylece tekrarlanan çağrılar bir agent oturumunu paylaşabilir.

## Bu yüzey neden önemlidir

Bu, kendi kendine barındırılan ön yüzler ve araçlar için en yüksek getirili uyumluluk kümesidir:

- Çoğu Open WebUI, LobeChat ve LibreChat kurulumu `/v1/models` bekler.
- Birçok RAG sistemi `/v1/embeddings` bekler.
- Mevcut OpenAI sohbet istemcileri genellikle `/v1/chat/completions` ile başlayabilir.
- Daha agent-yerel istemciler giderek `/v1/responses` tercih etmektedir.

## Model listesi ve agent yönlendirmesi

<AccordionGroup>
  <Accordion title="`/v1/models` ne döndürür?">
    Bir OpenClaw agent hedef listesi.

    Döndürülen kimlikler `openclaw`, `openclaw/default` ve `openclaw/<agentId>` girdileridir.
    Bunları doğrudan OpenAI `model` değerleri olarak kullanın.

  </Accordion>
  <Accordion title="`/v1/models` agent'ları mı yoksa alt agent'ları mı listeler?">
    Arka uç sağlayıcı modellerini veya alt agent'ları değil, üst düzey agent hedeflerini listeler.

    Alt agent'lar iç yürütme topolojisi olarak kalır. Sözde model olarak görünmezler.

  </Accordion>
  <Accordion title="`openclaw/default` neden dahil edilir?">
    `openclaw/default`, yapılandırılmış varsayılan agent için kararlı takma addır.

    Bu, istemcilerin gerçek varsayılan agent kimliği ortamlar arasında değişse bile tek bir öngörülebilir kimliği kullanmaya devam edebileceği anlamına gelir.

  </Accordion>
  <Accordion title="Arka uç modelini nasıl geçersiz kılarım?">
    `x-openclaw-model` kullanın.

    Örnekler:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.4`

    Bunu atarsanız seçilen agent normal yapılandırılmış model seçimiyle çalışır.

  </Accordion>
  <Accordion title="Embeddings bu sözleşmeye nasıl uyar?">
    `/v1/embeddings`, aynı agent hedefi `model` kimliklerini kullanır.

    `model: "openclaw/default"` veya `model: "openclaw/<agentId>"` kullanın.
    Belirli bir embedding modeline ihtiyacınız olduğunda bunu `x-openclaw-model` içinde gönderin.
    Bu başlık olmadan istek, seçilen agent'ın normal embedding kurulumuna iletilir.

  </Accordion>
</AccordionGroup>

## Akış (SSE)

Server-Sent Events (SSE) almak için `stream: true` ayarlayın:

- `Content-Type: text/event-stream`
- Her olay satırı `data: <json>` biçimindedir
- Akış `data: [DONE]` ile biter

## Open WebUI hızlı kurulum

Temel bir Open WebUI bağlantısı için:

- Temel URL: `http://127.0.0.1:18789/v1`
- macOS üzerinde Docker temel URL'si: `http://host.docker.internal:18789/v1`
- API anahtarı: Gateway bearer token'ınız
- Model: `openclaw/default`

Beklenen davranış:

- `GET /v1/models`, `openclaw/default` listelemelidir
- Open WebUI, sohbet modeli kimliği olarak `openclaw/default` kullanmalıdır
- Bu agent için belirli bir arka uç sağlayıcısı/modeli istiyorsanız agent'ın normal varsayılan modelini ayarlayın veya `x-openclaw-model` gönderin

Hızlı smoke testi:

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

Tek bir modeli getir:

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

- `/v1/models`, ham sağlayıcı kataloglarını değil, OpenClaw agent hedeflerini döndürür.
- `openclaw/default` her zaman vardır; böylece tek bir kararlı kimlik ortamlar arasında çalışır.
- Arka uç sağlayıcısı/modeli geçersiz kılmaları OpenAI `model` alanına değil, `x-openclaw-model` içine aittir.
- `/v1/embeddings`, `input` için bir dizeyi veya dize dizisini destekler.

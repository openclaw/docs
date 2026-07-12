---
read_when:
    - OpenAI Chat Completions'ı kullanan araçları entegre etme
summary: Gateway üzerinden OpenAI uyumlu bir /v1/chat/completions HTTP uç noktası sunun
title: OpenAI sohbet tamamlamaları
x-i18n:
    generated_at: "2026-07-12T12:18:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9b1fffd2ce3da881ecd91adbb7c5d10b1d7adbd99af9b2ea4544b62ecbaf1f32
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Gateway, OpenAI uyumlu küçük bir Chat Completions yüzeyi sunabilir. Bu özellik **varsayılan olarak devre dışıdır**.

Etkinleştirildiğinde, bunların tümünü Gateway ile aynı bağlantı noktasında sunar (WS + HTTP çoklama):

| Yöntem | Yol                    |
| ------ | ---------------------- |
| POST   | `/v1/chat/completions` |
| GET    | `/v1/models`           |
| GET    | `/v1/models/{id}`      |
| POST   | `/v1/embeddings`       |
| POST   | `/v1/responses`        |

İstekler normal bir Gateway ajan çalıştırması olarak (`openclaw agent` ile aynı kod yolu üzerinden) yürütülür; dolayısıyla yönlendirme, izinler ve yapılandırma Gateway'inizle eşleşir.

## Uç noktayı etkinleştirme

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

Devre dışı bırakmak için `enabled: false` olarak ayarlayın (veya bu ayarı atlayın).

## Güvenlik sınırı (önemli)

Bu uç noktayı Gateway örneğine **tam operatör erişimi** sağlıyor olarak değerlendirin:

- Bu uç nokta için geçerli bir Gateway belirteci/parolası, kullanıcı başına dar kapsamlı bir kimlik bilgisine değil, sahip/operatör kimlik bilgisine eşdeğerdir.
- İstekler, güvenilir operatör eylemleriyle aynı denetim düzlemi ajan yolundan geçer; dolayısıyla hedef ajanın ilkesi hassas araçlara izin veriyorsa bu uç nokta bunları kullanabilir.
- Yalnızca local loopback/tailnet/özel giriş üzerinde tutun. Genel internete açmayın.

Kimlik doğrulama matrisi:

| Kimlik doğrulama yolu                                                                                | Davranış                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"` veya `"password"` + `Authorization: Bearer ...`                          | Paylaşılan Gateway gizli bilgisinin elde bulundurulduğunu kanıtlar. Tüm `x-openclaw-scopes` üstbilgilerini yok sayar ve varsayılan operatör kapsamlarının tamamını geri yükler: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Sohbet turlarını sahip-gönderici turları olarak değerlendirir. |
| Kimlik taşıyan güvenilir HTTP (trusted-proxy kimlik doğrulaması veya özel girişte `gateway.auth.mode="none"`) | Mevcut olduğunda `x-openclaw-scopes` değerini dikkate alır; bulunmadığında varsayılan operatör kapsamlarına geri döner. Yalnızca çağıran kapsamları açıkça daraltıp `operator.admin` kapsamını atladığında sahip anlamını kaybeder. `x-openclaw-model` gibi sahip düzeyindeki denetimler için `operator.admin` gerektirir.                                              |

Bkz. [Operatör kapsamları](/tr/gateway/operator-scopes), [Güvenlik](/tr/gateway/security) ve [Uzaktan erişim](/tr/gateway/remote).

## Kimlik doğrulama

Gateway kimlik doğrulama yapılandırmasını kullanır (bu modun ayrıntıları için bkz. [Güvenilir proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth)):

| Mod                                 | Kimlik doğrulama yöntemi                                                                                                                                                                                   |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"`         | `Authorization: Bearer <token>`. `gateway.auth.token` veya `OPENCLAW_GATEWAY_TOKEN` aracılığıyla ayarlayın.                                                                                                 |
| `gateway.auth.mode="password"`      | `Authorization: Bearer <password>`. `gateway.auth.password` veya `OPENCLAW_GATEWAY_PASSWORD` aracılığıyla ayarlayın.                                                                                        |
| `gateway.auth.mode="trusted-proxy"` | Yapılandırılmış, kimlik bilgisine duyarlı proxy üzerinden yönlendirin; gerekli kimlik üstbilgilerini proxy ekler. Aynı makinedeki local loopback proxy'leri için açıkça `gateway.auth.trustedProxy.allowLoopback = true` ayarlanmalıdır. |
| `gateway.auth.mode="none"`          | Kimlik doğrulama üstbilgisi gerekmez (yalnızca özel giriş).                                                                                                                                                 |

Notlar:

- `trusted-proxy` Gateway'inde proxy'yi atlayan aynı makinedeki çağıranlar, doğrudan `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` kullanımına geri dönebilir. Herhangi bir `Forwarded`, `X-Forwarded-*` veya `X-Real-IP` üstbilgisi kanıtı, isteği bunun yerine trusted-proxy yolunda tutar.
- `gateway.auth.rateLimit` yapılandırılmışsa ve çok fazla kimlik doğrulama girişimi başarısız olursa uç nokta, `Retry-After` üstbilgisiyle birlikte `429` döndürür.

## Bu uç nokta ne zaman kullanılmalı?

- Entegrasyonunuz aynı Gateway için yalnızca başka bir operatör/istemci yüzeyiyse yeni bir yerleşik kanal eklemek yerine bunu tercih edin.
- Uzak bir Gateway'e doğrudan bağlanan yerel mobil istemcilerde, cihazın paylaşılan bir HTTP belirtecine/parolasına ihtiyaç duymaması için eşleştirilmiş cihaz önyükleme/cihaz belirteci akışıyla [WebChat](/tr/web/webchat) veya [Gateway Protokolü](/tr/gateway/protocol) kullanmayı tercih edin.
- Kendi kullanıcıları, odaları, Webhook teslimatı veya giden aktarımı olan harici bir mesajlaşma ağıyla entegrasyon yaparken bunun yerine bir kanal Plugin'i oluşturun. Bkz. [Plugin oluşturma](/tr/plugins/building-plugins).

## Ajan öncelikli model sözleşmesi

OpenClaw, OpenAI `model` alanını ham sağlayıcı model kimliği olarak değil, bir **ajan hedefi** olarak değerlendirir.

| `model` değeri                              | Yönlendirildiği hedef                                                                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw`                                  | Yapılandırılmış varsayılan ajan                                                                                                            |
| `openclaw/default`                          | Yapılandırılmış varsayılan ajan (kararlı takma ad; gerçek varsayılan ajan kimliği ortamlar arasında değişse bile kodda sabitlenmesi güvenlidir) |
| `openclaw/<agentId>` veya `openclaw:<agentId>` | Belirli ajan                                                                                                                            |
| `agent:<agentId>`                           | Belirli ajan (uyumluluk takma adı)                                                                                                         |

İsteğe bağlı istek üstbilgileri:

| Üstbilgi                                        | Etki                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `x-openclaw-model: <provider/model-or-bare-id>` | Seçilen ajanın arka uç modelini geçersiz kılar. Paylaşılan gizli bilgi taşıyıcısı kullanan çağıranlar bunu doğrudan kullanabilir; kimlik taşıyan çağıranlar (trusted-proxy veya `x-openclaw-scopes` içeren kimlik doğrulamasız özel giriş) için `operator.admin` gerekir, aksi hâlde `403 missing scope: operator.admin` döndürülür. |
| `x-openclaw-agent-id: <agentId>`                | Ajan seçimi için uyumluluk geçersiz kılması.                                                                                                                                                                                                                                                                                                             |
| `x-openclaw-session-key: <sessionKey>`          | Açık oturum yönlendirmesi. Ayrılmış bir iç ad alanı (`subagent:`, `cron:`, `acp:`) kullanıyorsa `400 invalid_request_error` ile reddedilir.                                                                                                                                                                                                               |
| `x-openclaw-message-channel: <channel>`         | Kanala duyarlı istemler/ilkeler için sentetik giriş kanalı bağlamını ayarlar.                                                                                                                                                                                                                                                                             |

`/v1/models`, arka uç sağlayıcı modellerini veya alt ajanları değil, üst düzey ajan hedeflerini (`openclaw`, `openclaw/default`, `openclaw/<agentId>`) listeler; alt ajanlar iç yürütme topolojisinde kalır. `x-openclaw-model` değerini atlarsanız seçilen ajan normal yapılandırılmış modeliyle çalışır.

`/v1/embeddings` aynı ajan hedefi `model` kimliklerini kullanır. Belirli bir gömme modeli seçmek için `x-openclaw-model` gönderin (paylaşılan gizli bilgi kullanan bir çağırandan veya `operator.admin` kapsamına sahip kimlik taşıyan bir çağırandan); aksi hâlde istek, seçilen ajanın normal gömme yapılandırmasını kullanır.

## Oturum davranışı

Uç nokta varsayılan olarak **her istek için durum bilgisizdir** (her çağrıda yeni bir oturum anahtarı oluşturulur).

İstek bir OpenAI `user` dizesi içeriyorsa Gateway, yinelenen çağrıların bir ajan oturumunu paylaşabilmesi için bu değerden kararlı bir oturum anahtarı türetir. Özel uygulamalarda her konuşma dizisi için aynı `user` değerini yeniden kullanın; birden fazla konuşmanın/cihazın tek bir OpenClaw oturumunu paylaşmasını istemiyorsanız hesap düzeyindeki tanımlayıcılardan kaçının. `x-openclaw-session-key` değerini yalnızca birden fazla istemci/dizi arasında açık yönlendirme denetimine ihtiyaç duyduğunuzda, yukarıdaki ayrılmış ad alanlarından kaçınan uygulamaya ait anahtarlarla kullanın.

## İstek sınırları (yapılandırma)

Varsayılan değerler `gateway.http.endpoints.chatCompletions` altında ayarlanabilir:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxImageParts: 8,
          maxTotalImageBytes: 20000000,
          images: {
            allowUrl: false,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
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

Atlandığında kullanılan varsayılanlar:

| Anahtar               | Varsayılan                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| `maxBodyBytes`        | 20MB                                                                                               |
| `maxImageParts`       | 8 (en son kullanıcı mesajından okunan en fazla `image_url` parçası)                                |
| `maxTotalImageBytes`  | 20MB (tek bir istekteki tüm `image_url` parçalarının toplam kodu çözülmüş bayt sayısı)              |
| `images.allowUrl`     | `false` (URL kaynaklı `image_url` parçaları etkinleştirilmedikçe reddedilir)                        |
| `images.maxBytes`     | Görsel başına 10MB                                                                                 |
| `images.maxRedirects` | 3                                                                                                  |
| `images.timeoutMs`    | 10s                                                                                                |

HEIC/HEIF `image_url` kaynakları kabul edilir ve sağlayıcıya teslim edilmeden önce paylaşılan OpenClaw görüntü işlemcisi (Rastermill) aracılığıyla JPEG'e dönüştürülür; harici codec desteği gerektiren biçimler için işlemci, sistem dönüştürücüsüne (`sips`, ImageMagick, GraphicsMagick veya ffmpeg) geri döner.

Güvenlik notu: Bir ana bilgisayar adını izin verilenler listesine eklemek, özel/dahili IP engellemesini atlamaz. İnternete açık Gateway'ler için uygulama düzeyindeki korumalara ek olarak ağ çıkış denetimleri uygulayın. Bkz. [Güvenlik](/tr/gateway/security).

## Sohbet aracı sözleşmesi

`/v1/chat/completions`, yaygın OpenAI Chat istemcileriyle uyumlu bir işlev aracı alt kümesini destekler.

### Desteklenen istek alanları

| Alan                       | Notlar                                                                                                                                                            |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools`                    | `{ "type": "function", "function": { ... } }` dizisi                                                                                                              |
| `tool_choice`              | `"auto"`, `"none"`, `"required"` veya `{ "type": "function", "function": { "name": "..." } }`                                                                      |
| `messages[*].role: "tool"` | Takip turları                                                                                                                                                      |
| `messages[*].tool_call_id` | Bir araç sonucunu önceki bir araç çağrısına bağlar                                                                                                                 |
| `max_completion_tokens`    | Sayı; toplam tamamlama belirteçleri için çağrı başına üst sınırdır (akıl yürütme belirteçleri dahil). Geçerli alan adıdır; hem bu hem de `max_tokens` gönderildiğinde kullanılır. |
| `max_tokens`               | Sayı; eski takma addır, `max_completion_tokens` da mevcutsa yok sayılır.                                                                                            |
| `temperature`              | 0-2 arasında sayı; mümkün olan en iyi şekilde üst sağlayıcıya iletilir. Aralık dışındaysa `400 invalid_request_error`.                                              |
| `top_p`                    | 0-1 arasında sayı; mümkün olan en iyi şekilde uygulanır. Aralık dışındaysa `400 invalid_request_error`.                                                             |
| `frequency_penalty`        | -2.0 ile 2.0 arasında sayı; mümkün olan en iyi şekilde uygulanır. Aralık dışındaysa `400 invalid_request_error`.                                                     |
| `presence_penalty`         | -2.0 ile 2.0 arasında sayı; mümkün olan en iyi şekilde uygulanır. Aralık dışındaysa `400 invalid_request_error`.                                                     |
| `seed`                     | Tam sayı; mümkün olan en iyi şekilde uygulanır. Tam sayı olmayan değerlerde `400 invalid_request_error`.                                                            |
| `stop`                     | Dize veya en fazla 4 dizelik dizi; mümkün olan en iyi şekilde uygulanır. 4'ten fazla dizi ya da dize olmayan/boş girdilerde `400 invalid_request_error`.             |

Tüm örnekleme ve belirteç üst sınırı alanları aynı ajan akış parametresi kanalı üzerinden taşınır ve mümkün olan en iyi şekilde iletilir:

- Belirteç üst sınırı: İletişim alanının adı sağlayıcı aktarımı tarafından seçilir: OpenAI ailesi uç noktaları için `max_completion_tokens`, yalnızca eski adı kabul eden sağlayıcılar (Mistral, Chutes) için `max_tokens`.
- `stop`, aktarımın durdurma alanına eşlenir: Chat Completions arka uçları için `stop`, Anthropic için `stop_sequences`. OpenAI Responses API'de durdurma parametresi bulunmadığından `stop`, Responses tabanlı modellerde uygulanmaz.
- ChatGPT tabanlı Codex Responses arka ucu, sabit sunucu tarafı örnekleme kullanır ve istek bu arka uca ulaşmadan önce `temperature`/`top_p` alanlarını (`max_output_tokens`, `metadata`, `prompt_cache_retention`, `service_tier` ile birlikte) kaldırır.

### Desteklenmeyen değişkenler

Şu durumlarda `400 invalid_request_error` döndürür:

- dizi olmayan `tools`, işlev olmayan araç girdileri veya eksik `tool.function.name`
- `allowed_tools` ve `custom` gibi `tool_choice` değişkenleri
- sağlanan bir araçla eşleşmeyen `tool_choice.function.name` değerleri

`tool_choice: "required"` ve işleve sabitlenmiş `tool_choice` için uç nokta, kullanıma sunulan istemci işlev aracı kümesini daraltır, çalışma zamanına yanıt vermeden önce bir istemci aracını çağırma talimatı verir ve ajan yanıtında eşleşen yapılandırılmış bir istemci aracı çağrısı yoksa hata verir. Bu, tüm dahili OpenClaw ajan araçlarına değil, çağıran tarafından sağlanan HTTP `tools` listesine uygulanır.

### Akışsız araç yanıtı biçimi

Ajan araçları çağırdığında yanıt şunları kullanır:

- `choices[0].finish_reason = "tool_calls"`
- `id`, `type: "function"`, `function.name`, `function.arguments` (JSON dizesi) içeren `choices[0].message.tool_calls[]` girdileri
- Araç çağrısından önceki yardımcı açıklaması, `choices[0].message.content` içinde (boş olabilir)

### Akışlı araç yanıtı biçimi

`stream: true` olduğunda araç çağrıları artımlı SSE parçaları olarak gelir: başlangıçta yardımcı rol deltası, isteğe bağlı yardımcı açıklaması deltaları, araç kimliği ve bağımsız değişken parçalarını taşıyan bir veya daha fazla `delta.tool_calls` parçası, ardından `finish_reason: "tool_calls"` içeren son parça ve `data: [DONE]`.

`stream_options.include_usage=true` ise `[DONE]` öncesinde sondaki bir kullanım parçası yayınlanır.

### Araç takip döngüsü

`tool_calls` alındıktan sonra istenen işlevleri yürütün ve önceki yardımcı araç çağrısı iletisiyle birlikte eşleşen `tool_call_id` değerlerine sahip bir veya daha fazla `role: "tool"` iletisi içeren bir takip isteği gönderin. Bu işlem, nihai yanıtı üretmek için aynı ajan akıl yürütme döngüsünü sürdürür.

## Akış (SSE)

Sunucu Tarafından Gönderilen Olayları almak için `stream: true` ayarlayın:

- `Content-Type: text/event-stream`
- Her olay satırı `data: <json>` biçimindedir
- Akış `data: [DONE]` ile sona erer

## Open WebUI hızlı kurulumu

- Temel URL: `http://127.0.0.1:18789/v1`
- macOS'ta Docker temel URL'si: `http://host.docker.internal:18789/v1`
- API anahtarı: Gateway taşıyıcı belirteciniz
- Model: `openclaw/default`

Beklenen davranış: `GET /v1/models`, `openclaw/default` değerini listeler ve Open WebUI bunu sohbet modeli kimliği olarak kullanır. Belirli bir arka uç sağlayıcısı/modeli için ajanın normal varsayılan modelini ayarlayın veya `x-openclaw-model` gönderin (paylaşılan gizli anahtar kullanan çağıran ya da `operator.admin` yetkisine sahip kimlik taşıyan çağıran).

Hızlı duman testi:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Bu komut `openclaw/default` döndürürse çoğu Open WebUI kurulumu aynı temel URL ve belirteçle bağlanabilir.

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

Aynı ajan oturumunu sürdürmek için bu konuşmaya yönelik sonraki çağrılarda aynı `user` değerini yeniden kullanın.

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

Gömme vektörleri oluşturma:

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

`/v1/embeddings`, `input` için dizeyi veya dize dizisini destekler.

## İlgili

- [Yapılandırma başvurusu](/tr/gateway/configuration-reference)
- [Operatör kapsamları](/tr/gateway/operator-scopes)
- [OpenAI](/tr/providers/openai)

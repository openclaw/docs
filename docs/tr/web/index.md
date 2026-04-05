---
read_when:
    - Gateway'e Tailscale üzerinden erişmek istiyorsunuz
    - Tarayıcıdaki Control UI ve yapılandırma düzenlemesini istiyorsunuz
summary: 'Gateway web yüzeyleri: Control UI, bağlama modları ve güvenlik'
title: Web
x-i18n:
    generated_at: "2026-04-05T14:14:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15f5643283f7d37235d3d8104897f38db27ac5a9fdef6165156fb542d0e7048c
    source_path: web/index.md
    workflow: 15
---

# Web (Gateway)

Gateway, Gateway WebSocket'i ile aynı bağlantı noktasından küçük bir **tarayıcı Control UI**'ı (Vite + Lit) sunar:

- varsayılan: `http://<host>:18789/`
- isteğe bağlı önek: `gateway.controlUi.basePath` ayarlayın (ör. `/openclaw`)

Yetenekler [Control UI](/web/control-ui) sayfasında yer alır.
Bu sayfa bağlama modlarına, güvenliğe ve web'e yönelik yüzeylere odaklanır.

## Webhook'lar

`hooks.enabled=true` olduğunda Gateway, aynı HTTP sunucusunda küçük bir webhook uç noktası da sunar.
Kimlik doğrulama + yükler için [Gateway configuration](/tr/gateway/configuration) → `hooks` bölümüne bakın.

## Yapılandırma (varsayılan olarak açık)

Control UI, varlıklar mevcut olduğunda (`dist/control-ui`) **varsayılan olarak etkindir**.
Bunu yapılandırma üzerinden denetleyebilirsiniz:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath isteğe bağlı
  },
}
```

## Tailscale erişimi

### Tümleşik Serve (önerilen)

Gateway'i loopback üzerinde tutun ve Tailscale Serve'ün bunu proxy'lemesine izin verin:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Ardından gateway'i başlatın:

```bash
openclaw gateway
```

Açın:

- `https://<magicdns>/` (veya yapılandırdığınız `gateway.controlUi.basePath`)

### Tailnet bind + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Ardından gateway'i başlatın (bu loopback olmayan örnek, paylaşılan gizli token
kimlik doğrulamasını kullanır):

```bash
openclaw gateway
```

Açın:

- `http://<tailscale-ip>:18789/` (veya yapılandırdığınız `gateway.controlUi.basePath`)

### Genel internet (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // veya OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Güvenlik notları

- Gateway kimlik doğrulaması varsayılan olarak gereklidir (token, parola, trusted-proxy veya etkinleştirildiğinde Tailscale Serve kimlik üstbilgileri).
- Loopback olmayan bağlamalar yine de gateway kimlik doğrulaması **gerektirir**. Pratikte bu, token/parola kimlik doğrulaması veya `gateway.auth.mode: "trusted-proxy"` kullanan kimlik farkındalıklı bir ters proxy anlamına gelir.
- Sihirbaz varsayılan olarak paylaşılan gizli kimlik doğrulaması oluşturur ve genellikle bir
  gateway token üretir (loopback üzerinde bile).
- Paylaşılan gizli modda UI, `connect.params.auth.token` veya
  `connect.params.auth.password` gönderir.
- Tailscale Serve veya `trusted-proxy` gibi kimlik taşıyan modlarda,
  WebSocket kimlik doğrulama denetimi bunun yerine istek üstbilgilerinden karşılanır.
- Loopback olmayan Control UI dağıtımları için `gateway.controlUi.allowedOrigins`
  değerini açıkça ayarlayın (tam origin'ler). Bu olmadan, gateway başlangıcı varsayılan olarak reddedilir.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`,
  Host üstbilgisi origin fallback modunu etkinleştirir, ancak bu tehlikeli bir güvenlik düşüşüdür.
- Serve ile, `gateway.auth.allowTailscale` `true` olduğunda
  Tailscale kimlik üstbilgileri Control UI/WebSocket kimlik doğrulamasını karşılayabilir
  (token/parola gerekmez).
  HTTP API uç noktaları bu Tailscale kimlik üstbilgilerini kullanmaz; bunun yerine
  gateway'in normal HTTP kimlik doğrulama modunu izlerler. Açık kimlik bilgileri gerektirmek için
  `gateway.auth.allowTailscale: false` ayarlayın. Bkz.
  [Tailscale](/tr/gateway/tailscale) ve [Security](/tr/gateway/security). Bu
  tokensız akış, gateway ana makinesinin güvenilir olduğunu varsayar.
- `gateway.tailscale.mode: "funnel"` için `gateway.auth.mode: "password"` (paylaşılan parola) gerekir.

## UI'ı oluşturma

Gateway, `dist/control-ui` içinden statik dosyalar sunar. Bunları şu komutla oluşturun:

```bash
pnpm ui:build # ilk çalıştırmada UI bağımlılıklarını otomatik yükler
```

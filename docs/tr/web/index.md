---
read_when:
    - Gateway'e Tailscale üzerinden erişmek istiyorsunuz
    - Tarayıcıdaki Control UI'yi ve yapılandırma düzenlemeyi istiyorsunuz
summary: 'Gateway web yüzeyleri: Control UI, bağlanma modları ve güvenlik'
title: Web
x-i18n:
    generated_at: "2026-04-24T09:38:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0336a6597cebf4a8a83d348abd3d59ff4b9bd7349a32c8a0a0093da0f656e97d
    source_path: web/index.md
    workflow: 15
---

Gateway, Gateway WebSocket ile aynı porttan küçük bir **tarayıcı Control UI** (Vite + Lit) sunar:

- varsayılan: `http://<host>:18789/`
- isteğe bağlı önek: `gateway.controlUi.basePath` ayarlayın (ör. `/openclaw`)

Yetenekler [Control UI](/tr/web/control-ui) içinde yer alır.
Bu sayfa bağlanma modlarına, güvenliğe ve web'e dönük yüzeylere odaklanır.

## Webhook'lar

`hooks.enabled=true` olduğunda Gateway, aynı HTTP sunucusunda küçük bir webhook uç noktası da açığa çıkarır.
Auth + payload'lar için bkz. [Gateway configuration](/tr/gateway/configuration) → `hooks`.

## Yapılandırma (varsayılan olarak açık)

Varlıklar mevcut olduğunda (`dist/control-ui`) Control UI **varsayılan olarak etkindir**.
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

Gateway'i loopback üzerinde tutun ve Tailscale Serve'in bunu proxy etmesine izin verin:

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

Ardından gateway'i başlatın (bu loopback olmayan örnek paylaşılan gizli anahtar token
auth kullanır):

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

- Gateway auth varsayılan olarak zorunludur (token, password, trusted-proxy veya etkinleştirildiğinde Tailscale Serve kimlik başlıkları).
- Loopback olmayan bind'ler de yine Gateway auth **gerektirir**. Pratikte bu, token/password auth veya `gateway.auth.mode: "trusted-proxy"` ile kimlik farkındalıklı bir reverse proxy anlamına gelir.
- Sihirbaz varsayılan olarak paylaşılan gizli anahtar auth oluşturur ve genellikle bir
  gateway token'ı üretir (loopback üzerinde bile).
- Paylaşılan gizli anahtar modunda UI, `connect.params.auth.token` veya
  `connect.params.auth.password` gönderir.
- Tailscale Serve veya `trusted-proxy` gibi kimlik taşıyan modlarda ise
  WebSocket auth denetimi bunun yerine istek başlıklarından karşılanır.
- Loopback olmayan Control UI dağıtımlarında `gateway.controlUi.allowedOrigins`
  değerini açıkça ayarlayın (tam origin'ler). Bu olmadan gateway başlangıcı varsayılan olarak reddedilir.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`,
  Host-header origin fallback modunu etkinleştirir, ancak bu tehlikeli bir güvenlik düşüşüdür.
- Serve ile `gateway.auth.allowTailscale` değeri `true` olduğunda
  Tailscale kimlik başlıkları Control UI/WebSocket auth'u karşılayabilir (token/password gerekmez).
  HTTP API uç noktaları bu Tailscale kimlik başlıklarını kullanmaz; bunun yerine
  gateway'in normal HTTP auth modunu izler. Açık kimlik bilgileri istemek için
  `gateway.auth.allowTailscale: false` ayarlayın. Bkz.
  [Tailscale](/tr/gateway/tailscale) ve [Security](/tr/gateway/security). Bu
  tokensız akış, gateway host'una güvenildiğini varsayar.
- `gateway.tailscale.mode: "funnel"` için `gateway.auth.mode: "password"` gerekir (paylaşılan password).

## UI'yi oluşturma

Gateway, `dist/control-ui` içinden statik dosyalar sunar. Bunları şu komutla oluşturun:

```bash
pnpm ui:build
```

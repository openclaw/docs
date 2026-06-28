---
read_when:
    - Tailscale üzerinden Gateway'e erişmek istiyorsunuz
    - Tarayıcı Control UI'sini ve yapılandırma düzenlemeyi istiyorsunuz
summary: 'Gateway web yüzeyleri: Kontrol kullanıcı arayüzü, bağlama modları ve güvenlik'
title: Web
x-i18n:
    generated_at: "2026-06-28T01:27:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c6b0c9f4ff53af295eb4eef7290d5d6b70c52543f57a9e83c7f8a635a2b35cd
    source_path: web/index.md
    workflow: 16
---

Gateway, Gateway WebSocket ile aynı porttan küçük bir **tarayıcı Denetim Arayüzü** (Vite + Lit) sunar:

- varsayılan: `http://<host>:18789/`
- `gateway.tls.enabled: true` ile: `https://<host>:18789/`
- isteğe bağlı önek: `gateway.controlUi.basePath` ayarını belirleyin (örn. `/openclaw`)

Yetenekler [Denetim Arayüzü](/tr/web/control-ui) içinde yer alır. Bu sayfanın geri kalanı bağlama kiplerine, güvenliğe ve web'e açık yüzeylere odaklanır.

## Webhook'lar

`hooks.enabled=true` olduğunda Gateway, aynı HTTP sunucusunda küçük bir Webhook uç noktası da sunar.
Kimlik doğrulama + yükler için [Gateway yapılandırması](/tr/gateway/configuration) → `hooks` bölümüne bakın.

## Yönetici HTTP RPC

Yönetici HTTP RPC, seçili Gateway denetim düzlemi yöntemlerini `POST /api/v1/admin/rpc` üzerinde sunar.
Varsayılan olarak kapalıdır ve yalnızca `admin-http-rpc` plugin'i etkinleştirildiğinde kaydedilir.
Kimlik doğrulama modeli, izin verilen yöntemler ve WebSocket karşılaştırması için [Yönetici HTTP RPC](/tr/plugins/admin-http-rpc) bölümüne bakın.

## Yapılandırma (varsayılan olarak açık)

Denetim Arayüzü, varlıklar mevcut olduğunda (`dist/control-ui`) **varsayılan olarak etkindir**.
Bunu yapılandırma üzerinden denetleyebilirsiniz:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Tailscale erişimi

### Tümleşik Serve (önerilir)

Gateway'i loopback üzerinde tutun ve Tailscale Serve'ün bunu proxy üzerinden aktarmasına izin verin:

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

### Tailnet bağlama + belirteç

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Ardından gateway'i başlatın (bu loopback olmayan örnek, paylaşılan gizli anahtar belirteci
kimlik doğrulamasını kullanır):

```bash
openclaw gateway
```

Açın:

- `http://<tailscale-ip>:18789/` (veya yapılandırdığınız `gateway.controlUi.basePath`)

### Herkese açık internet (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // or OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Güvenlik notları

- Gateway kimlik doğrulaması varsayılan olarak gereklidir (belirteç, parola, trusted-proxy veya etkinleştirildiğinde Tailscale Serve kimlik başlıkları).
- Loopback olmayan bağlamalar yine de gateway kimlik doğrulaması **gerektirir**. Pratikte bu, belirteç/parola kimlik doğrulaması veya `gateway.auth.mode: "trusted-proxy"` kullanan kimlik farkındalığına sahip bir ters proxy anlamına gelir.
- Sihirbaz varsayılan olarak paylaşılan gizli anahtar kimlik doğrulaması oluşturur ve genellikle bir
  gateway belirteci üretir (loopback üzerinde bile).
- Paylaşılan gizli anahtar kipinde, kullanıcı arayüzü `connect.params.auth.token` veya
  `connect.params.auth.password` gönderir.
- `gateway.tls.enabled: true` olduğunda, yerel pano ve durum yardımcıları
  `https://` pano URL'lerini ve `wss://` WebSocket URL'lerini işler.
- Tailscale Serve veya `trusted-proxy` gibi kimlik taşıyan kiplerde,
  WebSocket kimlik doğrulama denetimi bunun yerine istek başlıklarından karşılanır.
- Herkese açık loopback olmayan Denetim Arayüzü dağıtımları için `gateway.controlUi.allowedOrigins`
  değerini açıkça (tam kaynaklar olarak) ayarlayın. Özel aynı kaynaklı LAN/Tailnet yüklemeleri; loopback,
  RFC1918/link-local, `.local`, `.ts.net` ve Tailscale CGNAT ana makineleri için kabul edilir.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`, Host başlığı kaynak geri dönüş kipini
  etkinleştirir, ancak bu tehlikeli bir güvenlik zayıflatmasıdır.
- Serve ile, `gateway.auth.allowTailscale` `true` olduğunda Tailscale kimlik başlıkları
  Denetim Arayüzü/WebSocket kimlik doğrulamasını karşılayabilir (belirteç/parola gerekmez).
  HTTP API uç noktaları bu Tailscale kimlik başlıklarını kullanmaz; bunun yerine
  gateway'in normal HTTP kimlik doğrulama kipini izler. Açık kimlik bilgileri gerektirmek için
  `gateway.auth.allowTailscale: false` ayarını belirleyin. [Tailscale](/tr/gateway/tailscale) ve
  [Güvenlik](/tr/gateway/security) bölümlerine bakın. Bu belirteçsiz akış,
  gateway ana makinesinin güvenilir olduğunu varsayar.
- `gateway.tailscale.mode: "funnel"`, `gateway.auth.mode: "password"` (paylaşılan parola) gerektirir.

## Kullanıcı arayüzünü derleme

Gateway, statik dosyaları `dist/control-ui` konumundan sunar. Bunları şu komutla derleyin:

```bash
pnpm ui:build
```

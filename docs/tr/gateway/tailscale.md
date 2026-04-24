---
read_when:
    - Gateway Control UI'yi localhost dışına açma
    - Tailnet veya herkese açık pano erişimini otomatikleştirme
summary: Gateway panosu için entegre Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-04-24T09:12:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30bfe5fa2c9295dcf7164a1a89876d2e097f54d42bd261dfde973fddbd9185ce
    source_path: gateway/tailscale.md
    workflow: 15
---

# Tailscale (Gateway panosu)

OpenClaw, Gateway panosu ve WebSocket portu için Tailscale **Serve** (tailnet) veya **Funnel** (herkese açık) yapılandırmasını otomatik olarak yapabilir. Bu, Gateway'i loopback'e bağlı tutarken HTTPS, yönlendirme ve (Serve için) kimlik üstbilgilerini Tailscale'in sağlamasına olanak verir.

## Kipler

- `serve`: `tailscale serve` üzerinden yalnızca tailnet'e açık Serve. Gateway `127.0.0.1` üzerinde kalır.
- `funnel`: `tailscale funnel` üzerinden herkese açık HTTPS. OpenClaw paylaşılan bir parola gerektirir.
- `off`: Varsayılan (Tailscale otomasyonu yok).

## Kimlik doğrulama

El sıkışmayı denetlemek için `gateway.auth.mode` ayarlayın:

- `none` (yalnızca özel giriş)
- `token` (`OPENCLAW_GATEWAY_TOKEN` ayarlıysa varsayılan)
- `password` (`OPENCLAW_GATEWAY_PASSWORD` veya yapılandırma üzerinden paylaşılan gizli bilgi)
- `trusted-proxy` (kimlik farkındalıklı ters proxy; bkz. [Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth))

`tailscale.mode = "serve"` ve `gateway.auth.allowTailscale` `true` olduğunda,
Control UI/WebSocket kimlik doğrulaması belirteç/parola sağlamadan
Tailscale kimlik üstbilgilerini (`tailscale-user-login`) kullanabilir. OpenClaw,
kabul etmeden önce kimliği, yerel Tailscale
daemon'u (`tailscale whois`) üzerinden `x-forwarded-for` adresini çözümleyip üstbilgiyle eşleştirerek doğrular.
OpenClaw bir isteği yalnızca loopback'ten gelip
Tailscale'in `x-forwarded-for`, `x-forwarded-proto` ve `x-forwarded-host`
üstbilgilerini taşıdığında Serve olarak değerlendirir.
HTTP API uç noktaları (örneğin `/v1/*`, `/tools/invoke` ve `/api/channels/*`)
Tailscale kimlik üstbilgisi kimlik doğrulamasını kullanmaz. Bunlar yine de Gateway'in
normal HTTP kimlik doğrulama kipini izler: varsayılan olarak paylaşılan gizli bilgi kimlik doğrulaması veya bilerek yapılandırılmış bir trusted-proxy / özel giriş `none` kurulumu.
Bu belirteçsiz akış, Gateway ana bilgisayarına güvenildiğini varsayar. Aynı ana bilgisayarda
güvenilmeyen yerel kod çalışabiliyorsa `gateway.auth.allowTailscale` değerini kapatın ve
bunun yerine token/parola kimlik doğrulamasını zorunlu kılın.
Açık paylaşılan gizli bilgi kimlik bilgileri zorunlu olsun istiyorsanız `gateway.auth.allowTailscale: false`
ayarlayın ve `gateway.auth.mode: "token"` veya `"password"` kullanın.

## Yapılandırma örnekleri

### Yalnızca tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Açın: `https://<magicdns>/` (veya yapılandırdığınız `gateway.controlUi.basePath`)

### Yalnızca tailnet (Tailnet IP'sine bağla)

Gateway'in doğrudan Tailnet IP'sinde dinlemesini istiyorsanız bunu kullanın (Serve/Funnel yok).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Başka bir Tailnet cihazından bağlanın:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

Not: bu kipte loopback (`http://127.0.0.1:18789`) **çalışmaz**.

### Herkese açık internet (Funnel + paylaşılan parola)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

Diske parola commit etmek yerine `OPENCLAW_GATEWAY_PASSWORD` tercih edin.

## CLI örnekleri

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Notlar

- Tailscale Serve/Funnel, `tailscale` CLI'nin kurulu ve oturum açılmış olmasını gerektirir.
- `tailscale.mode: "funnel"`, herkese açık erişimi önlemek için kimlik doğrulama kipi `password` değilse başlatmayı reddeder.
- OpenClaw'ın kapanışta `tailscale serve`
  veya `tailscale funnel` yapılandırmasını geri almasını istiyorsanız `gateway.tailscale.resetOnExit` ayarlayın.
- `gateway.bind: "tailnet"` doğrudan Tailnet bağlamasıdır (HTTPS yok, Serve/Funnel yok).
- `gateway.bind: "auto"` loopback'i tercih eder; yalnızca Tailnet istiyorsanız `tailnet` kullanın.
- Serve/Funnel yalnızca **Gateway control UI + WS** yüzeyini açığa çıkarır. Node'lar
  aynı Gateway WS uç noktası üzerinden bağlanır; bu nedenle Serve, Node erişimi için de çalışabilir.

## Tarayıcı denetimi (uzak Gateway + yerel tarayıcı)

Gateway'i bir makinede çalıştırıyor ancak başka bir makinedeki tarayıcıyı sürmek istiyorsanız,
tarayıcı makinesinde bir **Node ana bilgisayarı** çalıştırın ve ikisini aynı tailnet üzerinde tutun.
Gateway, tarayıcı eylemlerini Node'a proxy'ler; ayrı bir denetim sunucusu veya Serve URL'si gerekmez.

Tarayıcı denetimi için Funnel'dan kaçının; Node pairing'i operatör erişimi gibi değerlendirin.

## Tailscale önkoşulları + sınırlar

- Serve, tailnet'inizde HTTPS etkin olmasını gerektirir; eksikse CLI bunu ister.
- Serve, Tailscale kimlik üstbilgilerini enjekte eder; Funnel etmez.
- Funnel, Tailscale v1.38.3+, MagicDNS, etkin HTTPS ve bir funnel düğüm özniteliği gerektirir.
- Funnel TLS üzerinden yalnızca `443`, `8443` ve `10000` portlarını destekler.
- macOS'ta Funnel, açık kaynak Tailscale uygulama varyantını gerektirir.

## Daha fazla bilgi

- Tailscale Serve genel bakış: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` komutu: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel genel bakış: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` komutu: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## İlgili

- [Uzak erişim](/tr/gateway/remote)
- [Keşif](/tr/gateway/discovery)
- [Kimlik Doğrulama](/tr/gateway/authentication)

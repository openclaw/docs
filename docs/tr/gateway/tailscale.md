---
read_when:
    - Gateway Control UI'yi localhost dışına açarken
    - tailnet veya genel pano erişimini otomatikleştirirken
summary: Gateway panosu için tümleşik Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-04-05T13:54:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ca5316e804e089c31a78ae882b3082444e082fb2b36b73679ffede20590cb2e
    source_path: gateway/tailscale.md
    workflow: 15
---

# Tailscale (Gateway panosu)

OpenClaw, Gateway panosu ve WebSocket bağlantı noktası için Tailscale **Serve** (tailnet) veya **Funnel** (genel) ayarlarını otomatik yapılandırabilir. Bu, Gateway'i loopback'e bağlı tutarken Tailscale'in HTTPS, yönlendirme ve (Serve için) kimlik başlıkları sağlamasına olanak tanır.

## Modlar

- `serve`: `tailscale serve` üzerinden yalnızca Tailnet için Serve. Gateway `127.0.0.1` üzerinde kalır.
- `funnel`: `tailscale funnel` üzerinden genel HTTPS. OpenClaw paylaşılan bir parola gerektirir.
- `off`: Varsayılan (Tailscale otomasyonu yok).

## Auth

El sıkışmayı denetlemek için `gateway.auth.mode` ayarlayın:

- `none` (yalnızca özel giriş)
- `token` (`OPENCLAW_GATEWAY_TOKEN` ayarlıysa varsayılan)
- `password` (`OPENCLAW_GATEWAY_PASSWORD` veya config üzerinden paylaşılan gizli bilgi)
- `trusted-proxy` (kimlik farkındalıklı ters proxy; bkz. [Trusted Proxy Auth](/gateway/trusted-proxy-auth))

`tailscale.mode = "serve"` olduğunda ve `gateway.auth.allowTailscale` `true` ise,
Control UI/WebSocket auth, bir token/parola sağlamadan Tailscale kimlik başlıklarını
(`tailscale-user-login`) kullanabilir. OpenClaw, yerel Tailscale
daemon'u (`tailscale whois`) üzerinden `x-forwarded-for` adresini çözümleyip kabul etmeden önce başlıkla eşleştirerek
kimliği doğrular.
OpenClaw bir isteği yalnızca loopback üzerinden gelip
Tailscale'in `x-forwarded-for`, `x-forwarded-proto` ve `x-forwarded-host`
başlıklarını içeriyorsa Serve olarak değerlendirir.
HTTP API uç noktaları (örneğin `/v1/*`, `/tools/invoke` ve `/api/channels/*`)
Tailscale kimlik başlığı auth'unu **kullanmaz**. Bunlar yine gateway'in
normal HTTP auth modunu izler: varsayılan olarak paylaşılan gizli bilgi auth'u veya kasıtlı olarak
yapılandırılmış trusted-proxy / private-ingress `none` kurulumu.
Bu token'sız akış, gateway ana makinesinin güvenilir olduğunu varsayar. Güvenilmeyen yerel kod
aynı ana makinede çalışabiliyorsa `gateway.auth.allowTailscale` değerini devre dışı bırakın ve
bunun yerine token/parola auth'u isteyin.
Açık paylaşılan gizli bilgi kimlik bilgileri zorunlu olsun istiyorsanız `gateway.auth.allowTailscale: false`
ayarlayın ve `gateway.auth.mode: "token"` veya `"password"` kullanın.

## Config örnekleri

### Yalnızca tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Açın: `https://<magicdns>/` (veya yapılandırılmış `gateway.controlUi.basePath`)

### Yalnızca tailnet (Tailnet IP'sine bağlanma)

Gateway'in doğrudan Tailnet IP'si üzerinde dinlemesini istiyorsanız bunu kullanın (Serve/Funnel yok).

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

Not: loopback (`http://127.0.0.1:18789`) bu modda **çalışmaz**.

### Genel internet (Funnel + paylaşılan parola)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

Parolayı diske kaydetmek yerine `OPENCLAW_GATEWAY_PASSWORD` tercih edin.

## CLI örnekleri

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Notlar

- Tailscale Serve/Funnel için `tailscale` CLI'nin kurulu ve oturum açılmış olması gerekir.
- `tailscale.mode: "funnel"`, genel erişimi önlemek için auth modu `password` olmadıkça başlatmayı reddeder.
- Kapatma sırasında OpenClaw'ın `tailscale serve`
  veya `tailscale funnel` config'ini geri almasını istiyorsanız `gateway.tailscale.resetOnExit` ayarlayın.
- `gateway.bind: "tailnet"` doğrudan bir Tailnet bağlamasıdır (HTTPS yok, Serve/Funnel yok).
- `gateway.bind: "auto"` loopback'i tercih eder; yalnızca Tailnet istiyorsanız `tailnet` kullanın.
- Serve/Funnel yalnızca **Gateway control UI + WS** yüzeyini açığa çıkarır. Düğümler
  aynı Gateway WS uç noktası üzerinden bağlanır, bu nedenle Serve düğüm erişimi için de çalışabilir.

## Tarayıcı kontrolü (uzak Gateway + yerel tarayıcı)

Gateway'i bir makinede çalıştırıyor ancak tarayıcıyı başka bir makinede sürmek istiyorsanız,
tarayıcı makinesinde bir **node host** çalıştırın ve her ikisini de aynı tailnet üzerinde tutun.
Gateway tarayıcı eylemlerini düğüme vekil olarak iletir; ayrı bir denetim sunucusu veya Serve URL'si gerekmez.

Tarayıcı kontrolü için Funnel kullanmaktan kaçının; düğüm eşleştirmesini operatör erişimi gibi değerlendirin.

## Tailscale ön koşulları + sınırlar

- Serve, tailnet'iniz için HTTPS'in etkin olmasını gerektirir; eksikse CLI istem gösterir.
- Serve, Tailscale kimlik başlıklarını ekler; Funnel eklemez.
- Funnel, Tailscale v1.38.3+, MagicDNS, HTTPS'in etkin olması ve bir funnel node niteliği gerektirir.
- Funnel TLS üzerinden yalnızca `443`, `8443` ve `10000` bağlantı noktalarını destekler.
- macOS'ta Funnel, Tailscale uygulamasının açık kaynak varyantını gerektirir.

## Daha fazla bilgi

- Tailscale Serve genel bakışı: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` komutu: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel genel bakışı: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` komutu: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

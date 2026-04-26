---
read_when:
    - Gateway Control UI'yi localhost dışına açma
    - tailnet veya genel pano erişimini otomatikleştirme
summary: Gateway panosu için entegre Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-04-26T11:32:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5966490f8e85774b5149ed29cf7fd4b108eb438f94f5f74a3e5aa3e3b39568a
    source_path: gateway/tailscale.md
    workflow: 15
---

OpenClaw, Gateway panosu ve WebSocket portu için Tailscale **Serve** (tailnet) veya **Funnel** (genel) yapılandırmasını otomatik yapabilir. Bu, Gateway'i loopback'e bağlı tutarken Tailscale'in HTTPS, yönlendirme ve (Serve için) kimlik üstbilgileri sağlamasına olanak tanır.

## Modlar

- `serve`: `tailscale serve` üzerinden yalnızca tailnet'e açık Serve. Gateway `127.0.0.1` üzerinde kalır.
- `funnel`: `tailscale funnel` üzerinden genel HTTPS. OpenClaw paylaşılan bir parola gerektirir.
- `off`: Varsayılan (Tailscale otomasyonu yok).

Durum ve denetim çıktısı, bu OpenClaw Serve/Funnel modu için **Tailscale exposure** kullanır. `off`, OpenClaw'ın Serve veya Funnel'ı yönetmediği anlamına gelir; yerel Tailscale daemon'unun durduğu veya çıkış yaptığı anlamına gelmez.

## Kimlik doğrulama

El sıkışmayı denetlemek için `gateway.auth.mode` ayarlayın:

- `none` (yalnızca özel giriş)
- `token` (`OPENCLAW_GATEWAY_TOKEN` ayarlandığında varsayılan)
- `password` (`OPENCLAW_GATEWAY_PASSWORD` veya config üzerinden paylaşılan sır)
- `trusted-proxy` (kimlik farkındalıklı reverse proxy; bkz. [Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth))

`tailscale.mode = "serve"` ve `gateway.auth.allowTailscale` değeri `true` olduğunda, Control UI/WebSocket kimlik doğrulaması token/parola vermeden Tailscale kimlik üstbilgilerini (`tailscale-user-login`) kullanabilir. OpenClaw, kimliği kabul etmeden önce yerel Tailscale daemon'u üzerinden `x-forwarded-for` adresini çözüp (`tailscale whois`) üstbilgiyle eşleştirerek kimliği doğrular. OpenClaw, bir isteği yalnızca loopback üzerinden Tailscale'in `x-forwarded-for`, `x-forwarded-proto` ve `x-forwarded-host` üstbilgileriyle geldiğinde Serve olarak değerlendirir.
Tarayıcı cihaz kimliği içeren Control UI operatör oturumları için bu doğrulanmış Serve yolu ayrıca cihaz eşleştirme gidiş-dönüşünü atlar. Bu, tarayıcı cihaz kimliğini atlamaz: cihazsız istemciler yine reddedilir ve node rolü veya Control UI dışı WebSocket bağlantıları yine normal eşleştirme ve kimlik doğrulama denetimlerini izler.
HTTP API uç noktaları (örneğin `/v1/*`, `/tools/invoke` ve `/api/channels/*`) Tailscale kimlik üstbilgisi kimlik doğrulamasını **kullanmaz**. Bunlar yine gateway'in normal HTTP kimlik doğrulama modunu izler: varsayılan olarak paylaşılan sır kimlik doğrulaması veya kasıtlı olarak yapılandırılmış trusted-proxy / özel giriş `none` kurulumu.
Bu tokensız akış, gateway ana makinesinin güvenilir olduğunu varsayar. Aynı ana makinede güvenilmeyen yerel kod çalışabiliyorsa `gateway.auth.allowTailscale` özelliğini devre dışı bırakın ve bunun yerine token/parola kimlik doğrulaması isteyin.
Açık paylaşılan sır kimlik bilgileri zorunlu olsun istiyorsanız `gateway.auth.allowTailscale: false` ayarlayın ve `gateway.auth.mode: "token"` veya `"password"` kullanın.

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

### Yalnızca tailnet (Tailnet IP'ye bağlanma)

Bunu, Gateway'in doğrudan Tailnet IP üzerinde dinlemesini istediğinizde kullanın (Serve/Funnel yok).

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

Not: bu modda loopback (`http://127.0.0.1:18789`) **çalışmaz**.

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

- Tailscale Serve/Funnel için `tailscale` CLI'nin kurulu ve giriş yapılmış olması gerekir.
- `tailscale.mode: "funnel"`, genel erişimi önlemek için kimlik doğrulama modu `password` olmadıkça başlatmayı reddeder.
- OpenClaw'ın kapanışta `tailscale serve` veya `tailscale funnel` yapılandırmasını geri almasını istiyorsanız `gateway.tailscale.resetOnExit` ayarlayın.
- `gateway.bind: "tailnet"` doğrudan bir Tailnet bağlamasıdır (HTTPS yok, Serve/Funnel yok).
- `gateway.bind: "auto"` loopback'i tercih eder; yalnızca Tailnet istiyorsanız `tailnet` kullanın.
- Serve/Funnel yalnızca **Gateway control UI + WS** yüzeyini açığa çıkarır. Node'lar aynı Gateway WS uç noktası üzerinden bağlandığından, node erişimi için de Serve kullanılabilir.

## Tarayıcı kontrolü (uzak Gateway + yerel tarayıcı)

Gateway'i bir makinede çalıştırıyor ancak başka bir makinedeki tarayıcıyı sürmek istiyorsanız, tarayıcı makinesinde bir **node host** çalıştırın ve her ikisini de aynı tailnet üzerinde tutun. Gateway, tarayıcı eylemlerini node'a proxy'ler; ayrı bir kontrol sunucusu veya Serve URL'si gerekmez.

Tarayıcı kontrolü için Funnel kullanmaktan kaçının; node eşleştirmesini operatör erişimi gibi değerlendirin.

## Tailscale önkoşulları + sınırlar

- Serve, tailnet'iniz için HTTPS etkin olmasını gerektirir; eksikse CLI yönlendirir.
- Serve, Tailscale kimlik üstbilgileri enjekte eder; Funnel etmez.
- Funnel, Tailscale v1.38.3+, MagicDNS, etkin HTTPS ve bir funnel node özniteliği gerektirir.
- Funnel, TLS üzerinden yalnızca `443`, `8443` ve `10000` portlarını destekler.
- macOS üzerinde Funnel, açık kaynak Tailscale uygulaması varyantını gerektirir.

## Daha fazla bilgi

- Tailscale Serve genel bakış: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` komutu: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel genel bakış: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` komutu: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## İlgili

- [Uzak erişim](/tr/gateway/remote)
- [Keşif](/tr/gateway/discovery)
- [Kimlik doğrulama](/tr/gateway/authentication)

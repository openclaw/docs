---
read_when:
    - Gateway Kontrol Arayüzünü localhost dışına açma
    - tailnet veya herkese açık pano erişimini otomatikleştirme
summary: Gateway panosu için entegre Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-04-30T09:25:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5bc0a90ce8105017f5f52bad4a40609711f4bd4538437916c020680d3e9eda4
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw, Gateway panosu ve WebSocket portu için Tailscale **Serve** (tailnet) veya **Funnel**'ı (genel) otomatik yapılandırabilir. Bu, Gateway'i loopback'e bağlı tutarken
Tailscale HTTPS, yönlendirme ve (Serve için) kimlik üst bilgileri sağlar.

## Modlar

- `serve`: `tailscale serve` üzerinden yalnızca Tailnet'e açık Serve. Gateway `127.0.0.1` üzerinde kalır.
- `funnel`: `tailscale funnel` üzerinden genel HTTPS. OpenClaw paylaşılan parola gerektirir.
- `off`: Varsayılan (Tailscale otomasyonu yok).

Durum ve denetim çıktısı, bu OpenClaw Serve/Funnel modu için **Tailscale maruziyeti**
ifadesini kullanır. `off`, OpenClaw'un Serve veya Funnel'ı yönetmediği anlamına gelir; yerel Tailscale daemon'unun durdurulduğu veya oturumunun kapatıldığı anlamına gelmez.

## Kimlik doğrulama

El sıkışmayı kontrol etmek için `gateway.auth.mode` değerini ayarlayın:

- `none` (yalnızca özel giriş)
- `token` (`OPENCLAW_GATEWAY_TOKEN` ayarlandığında varsayılan)
- `password` (`OPENCLAW_GATEWAY_PASSWORD` veya yapılandırma üzerinden paylaşılan gizli değer)
- `trusted-proxy` (kimlik farkındalıklı ters proxy; bkz. [Güvenilir Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth))

`tailscale.mode = "serve"` olduğunda ve `gateway.auth.allowTailscale` `true`
olduğunda, Control UI/WebSocket kimlik doğrulaması token/parola sağlamadan Tailscale kimlik üst bilgilerini
(`tailscale-user-login`) kullanabilir. OpenClaw, kimliği kabul etmeden önce
`x-forwarded-for` adresini yerel Tailscale daemon'u (`tailscale whois`) üzerinden çözümleyip üst bilgiyle eşleştirerek
doğrular.
OpenClaw, bir isteği yalnızca loopback'ten Tailscale'in `x-forwarded-for`, `x-forwarded-proto` ve `x-forwarded-host`
üst bilgileriyle geldiğinde Serve olarak ele alır.
Tarayıcı cihaz kimliği içeren Control UI operatör oturumları için bu
doğrulanmış Serve yolu, cihaz eşleştirme gidiş dönüşünü de atlar. Tarayıcı cihaz kimliğini
atlatmaz: cihazsız istemciler yine reddedilir ve node-role
veya Control UI olmayan WebSocket bağlantıları normal eşleştirme ve
kimlik doğrulama denetimlerini izlemeye devam eder.
HTTP API uç noktaları (örneğin `/v1/*`, `/tools/invoke` ve `/api/channels/*`)
Tailscale kimlik üst bilgisi kimlik doğrulamasını **kullanmaz**. Bunlar yine Gateway'in
normal HTTP kimlik doğrulama modunu izler: varsayılan olarak paylaşılan gizli değerle kimlik doğrulama veya kasıtlı olarak
yapılandırılmış trusted-proxy / özel giriş `none` kurulumu.
Bu tokensız akış, Gateway ana makinesinin güvenilir olduğunu varsayar. Aynı ana makinede güvenilmeyen yerel kod
çalışabiliyorsa, `gateway.auth.allowTailscale` değerini devre dışı bırakın ve bunun yerine
token/parola kimlik doğrulaması gerektirin.
Açık paylaşılan gizli değer kimlik bilgileri gerektirmek için `gateway.auth.allowTailscale: false`
ayarlayın ve `gateway.auth.mode: "token"` veya `"password"` kullanın.

## Yapılandırma örnekleri

### Yalnızca Tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Açın: `https://<magicdns>/` (veya yapılandırılmış `gateway.controlUi.basePath` değeriniz)

### Yalnızca Tailnet (Tailnet IP'ye bağlanma)

Gateway'in doğrudan Tailnet IP üzerinde dinlemesini istediğinizde bunu kullanın (Serve/Funnel yok).

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

<Note>
Loopback (`http://127.0.0.1:18789`) bu modda **çalışmaz**.
</Note>

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

Diske parola işlemek yerine `OPENCLAW_GATEWAY_PASSWORD` tercih edin.

## CLI örnekleri

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Notlar

- Tailscale Serve/Funnel, `tailscale` CLI'nin kurulu ve oturum açmış olmasını gerektirir.
- `tailscale.mode: "funnel"`, genel maruziyeti önlemek için kimlik doğrulama modu `password` olmadıkça başlamayı reddeder.
- OpenClaw'un kapanışta `tailscale serve`
  veya `tailscale funnel` yapılandırmasını geri almasını istiyorsanız `gateway.tailscale.resetOnExit` ayarlayın.
- `gateway.bind: "tailnet"` doğrudan Tailnet'e bağlanmadır (HTTPS yok, Serve/Funnel yok).
- `gateway.bind: "auto"` loopback'i tercih eder; yalnızca Tailnet istiyorsanız `tailnet` kullanın.
- Serve/Funnel yalnızca **Gateway control UI + WS** yüzeyini dışa açar. Node'lar aynı Gateway WS uç noktası üzerinden bağlanır, bu nedenle Serve node erişimi için çalışabilir.

## Tarayıcı denetimi (uzak Gateway + yerel tarayıcı)

Gateway'i bir makinede çalıştırıyor ancak başka bir makinedeki tarayıcıyı yönetmek istiyorsanız,
tarayıcı makinesinde bir **node host** çalıştırın ve ikisini de aynı tailnet'te tutun.
Gateway, tarayıcı eylemlerini node'a proxy'ler; ayrı bir denetim sunucusu veya Serve URL'si gerekmez.

Tarayıcı denetimi için Funnel'dan kaçının; node eşleştirmesini operatör erişimi gibi ele alın.

## Tailscale önkoşulları + sınırlar

- Serve, tailnet'iniz için HTTPS'nin etkin olmasını gerektirir; eksikse CLI sorar.
- Serve, Tailscale kimlik üst bilgilerini enjekte eder; Funnel etmez.
- Funnel, Tailscale v1.38.3+, MagicDNS, HTTPS'nin etkin olmasını ve bir funnel node özniteliği gerektirir.
- Funnel, TLS üzerinden yalnızca `443`, `8443` ve `10000` portlarını destekler.
- macOS üzerinde Funnel, açık kaynaklı Tailscale uygulama varyantını gerektirir.

## Daha fazla bilgi

- Tailscale Serve genel bakışı: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` komutu: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel genel bakışı: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` komutu: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## İlgili

- [Uzaktan erişim](/tr/gateway/remote)
- [Keşif](/tr/gateway/discovery)
- [Kimlik doğrulama](/tr/gateway/authentication)

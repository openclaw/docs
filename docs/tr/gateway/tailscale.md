---
read_when:
    - Gateway Kontrol Kullanıcı Arayüzünü localhost dışına açma
    - tailnet veya herkese açık gösterge paneli erişimini otomatikleştirme
summary: Gateway panosu için entegre Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-05-06T17:56:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89a2094dc5d9250b3af2dcc991e83099bdf6fc4039c86358ca57f7e58899196d
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw, Gateway panosu ve WebSocket bağlantı noktası için Tailscale **Serve** (tailnet) veya **Funnel** (genel) yapılandırmasını otomatik olarak yapabilir. Bu, Gateway’i loopback’e bağlı tutarken Tailscale’in HTTPS, yönlendirme ve (Serve için) kimlik başlıkları sağlamasını mümkün kılar.

## Modlar

- `serve`: `tailscale serve` üzerinden yalnızca Tailnet Serve. Gateway `127.0.0.1` üzerinde kalır.
- `funnel`: `tailscale funnel` üzerinden genel HTTPS. OpenClaw paylaşılan bir parola gerektirir.
- `off`: Varsayılan (Tailscale otomasyonu yok).

Durum ve denetim çıktısı, bu OpenClaw Serve/Funnel modu için **Tailscale görünürlüğü** ifadesini kullanır. `off`, OpenClaw’ın Serve veya Funnel yönetmediği anlamına gelir; yerel Tailscale daemon’unun durdurulduğu veya oturumunun kapatıldığı anlamına gelmez.

## Kimlik Doğrulama

El sıkışmayı kontrol etmek için `gateway.auth.mode` ayarını belirleyin:

- `none` (yalnızca özel giriş)
- `token` (`OPENCLAW_GATEWAY_TOKEN` ayarlandığında varsayılan)
- `password` (`OPENCLAW_GATEWAY_PASSWORD` veya yapılandırma üzerinden paylaşılan gizli değer)
- `trusted-proxy` (kimlik farkındalıklı ters proxy; bkz. [Güvenilen Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth))

`tailscale.mode = "serve"` olduğunda ve `gateway.auth.allowTailscale` `true` ise, Control UI/WebSocket kimlik doğrulaması token/parola sağlamadan Tailscale kimlik başlıklarını (`tailscale-user-login`) kullanabilir. OpenClaw, kabul etmeden önce `x-forwarded-for` adresini yerel Tailscale daemon’u (`tailscale whois`) üzerinden çözümleyip başlıkla eşleştirerek kimliği doğrular. OpenClaw bir isteği yalnızca loopback’ten geldiğinde ve Tailscale’in `x-forwarded-for`, `x-forwarded-proto` ve `x-forwarded-host` başlıklarını içerdiğinde Serve olarak değerlendirir.
Tarayıcı cihaz kimliği içeren Control UI operatör oturumlarında, bu doğrulanmış Serve yolu cihaz eşleştirme gidiş gelişini de atlar. Tarayıcı cihaz kimliğini baypas etmez: cihazsız istemciler yine reddedilir; düğüm rolü veya Control UI dışı WebSocket bağlantıları normal eşleştirme ve kimlik doğrulama denetimlerini izlemeye devam eder.
HTTP API uç noktaları (örneğin `/v1/*`, `/tools/invoke` ve `/api/channels/*`) Tailscale kimlik başlığı kimlik doğrulamasını **kullanmaz**. Bunlar Gateway’in normal HTTP kimlik doğrulama modunu izlemeye devam eder: varsayılan olarak paylaşılan gizli değer kimlik doğrulaması veya bilinçli olarak yapılandırılmış trusted-proxy / özel giriş `none` kurulumu.
Bu tokensız akış, Gateway ana makinesinin güvenilir olduğunu varsayar. Aynı ana makinede güvenilmeyen yerel kod çalışabiliyorsa, `gateway.auth.allowTailscale` ayarını devre dışı bırakın ve bunun yerine token/parola kimlik doğrulaması gerektirin.
Açık paylaşılan gizli değer kimlik bilgileri gerektirmek için `gateway.auth.allowTailscale: false` ayarını yapın ve `gateway.auth.mode: "token"` veya `"password"` kullanın.

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

Aç: `https://<magicdns>/` (veya yapılandırılmış `gateway.controlUi.basePath`)

### Yalnızca Tailnet (Tailnet IP’sine bağla)

Gateway’in doğrudan Tailnet IP’sinde dinlemesini istediğinizde bunu kullanın (Serve/Funnel yok).

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

Parolayı diske kaydetmek yerine `OPENCLAW_GATEWAY_PASSWORD` kullanmayı tercih edin.

## CLI örnekleri

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Notlar

- Tailscale Serve/Funnel, `tailscale` CLI’nin kurulu ve oturum açmış olmasını gerektirir.
- `tailscale.mode: "funnel"`, genel erişimi önlemek için kimlik doğrulama modu `password` değilse başlatmayı reddeder.
- OpenClaw’ın kapanışta `tailscale serve` veya `tailscale funnel` yapılandırmasını geri almasını istiyorsanız `gateway.tailscale.resetOnExit` ayarını belirleyin.
- `gateway.bind: "tailnet"` doğrudan Tailnet bağlamasıdır (HTTPS yok, Serve/Funnel yok).
- `gateway.bind: "auto"` loopback’i tercih eder; yalnızca Tailnet istiyorsanız `tailnet` kullanın.
- Serve/Funnel yalnızca **Gateway kontrol UI + WS** yüzeyini dışa açar. Düğümler aynı Gateway WS uç noktası üzerinden bağlanır, bu nedenle Serve düğüm erişimi için çalışabilir.

## Tarayıcı kontrolü (uzak Gateway + yerel tarayıcı)

Gateway’i bir makinede çalıştırıp tarayıcıyı başka bir makinede yönlendirmek istiyorsanız, tarayıcı makinesinde bir **düğüm ana makinesi** çalıştırın ve ikisini de aynı tailnet üzerinde tutun.
Gateway tarayıcı eylemlerini düğüme proxy’ler; ayrı bir kontrol sunucusu veya Serve URL’si gerekmez.

Tarayıcı kontrolü için Funnel’dan kaçının; düğüm eşleştirmesini operatör erişimi gibi değerlendirin.

## Tailscale önkoşulları + sınırlar

- Serve, tailnet’iniz için HTTPS’nin etkin olmasını gerektirir; eksikse CLI bunu sorar.
- Serve, Tailscale kimlik başlıklarını ekler; Funnel eklemez.
- Funnel, Tailscale v1.38.3+, MagicDNS, HTTPS etkinleştirilmiş olmasını ve bir funnel düğüm özniteliğini gerektirir.
- Funnel, TLS üzerinden yalnızca `443`, `8443` ve `10000` bağlantı noktalarını destekler.
- macOS üzerinde Funnel, açık kaynaklı Tailscale uygulama varyantını gerektirir.

## Daha fazla bilgi

- Tailscale Serve genel bakış: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` komutu: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel genel bakış: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` komutu: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## İlgili

- [Uzaktan erişim](/tr/gateway/remote)
- [Keşif](/tr/gateway/discovery)
- [Kimlik doğrulama](/tr/gateway/authentication)

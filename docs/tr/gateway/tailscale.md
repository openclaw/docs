---
read_when:
    - Gateway denetim kullanıcı arayüzünü localhost dışında kullanıma açma
    - tailnet veya herkese açık pano erişimini otomatikleştirme
summary: Gateway panosu için entegre Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-05-10T19:39:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3a90145b9884f31d43fabaddabe17e6ba017dabaec6e6e7d263dacefb33f1b6
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw, Gateway panosu ve WebSocket bağlantı noktası için Tailscale **Serve** (tailnet) veya **Funnel** (genel) yapılandırmasını otomatik olarak yapabilir. Bu, Gateway'in loopback'e bağlı kalmasını sağlarken Tailscale HTTPS, yönlendirme ve (Serve için) kimlik üstbilgileri sağlar.

## Modlar

- `serve`: `tailscale serve` üzerinden yalnızca tailnet'e açık Serve. Gateway `127.0.0.1` üzerinde kalır.
- `funnel`: `tailscale funnel` üzerinden genel HTTPS. OpenClaw paylaşılan bir parola gerektirir.
- `off`: Varsayılan (Tailscale otomasyonu yok).

Durum ve denetim çıktısı, bu OpenClaw Serve/Funnel modu için **Tailscale açıklığı** ifadesini kullanır. `off`, OpenClaw'ın Serve veya Funnel'ı yönetmediği anlamına gelir; yerel Tailscale daemon'unun durdurulduğu veya oturumunun kapatıldığı anlamına gelmez.

## Kimlik Doğrulama

El sıkışmayı denetlemek için `gateway.auth.mode` değerini ayarlayın:

- `none` (yalnızca özel giriş)
- `token` (`OPENCLAW_GATEWAY_TOKEN` ayarlandığında varsayılan)
- `password` (`OPENCLAW_GATEWAY_PASSWORD` veya yapılandırma üzerinden paylaşılan gizli değer)
- `trusted-proxy` (kimlik farkındalığı olan ters proxy; bkz. [Güvenilen Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth))

`tailscale.mode = "serve"` ve `gateway.auth.allowTailscale` `true` olduğunda, Control UI/WebSocket kimlik doğrulaması token/parola sağlamadan Tailscale kimlik üstbilgilerini (`tailscale-user-login`) kullanabilir. OpenClaw, kabul etmeden önce `x-forwarded-for` adresini yerel Tailscale daemon'u (`tailscale whois`) üzerinden çözümleyip üstbilgiyle eşleştirerek kimliği doğrular. OpenClaw bir isteği yalnızca loopback'ten Tailscale'in `x-forwarded-for`, `x-forwarded-proto` ve `x-forwarded-host` üstbilgileriyle geldiğinde Serve olarak değerlendirir.
Tarayıcı cihaz kimliği içeren Control UI operatör oturumları için bu doğrulanmış Serve yolu cihaz eşleştirme gidiş dönüşünü de atlar. Tarayıcı cihaz kimliğini atlamaz: cihazsız istemciler yine reddedilir ve node rolü veya Control UI dışı WebSocket bağlantıları normal eşleştirme ve kimlik doğrulama denetimlerini izlemeye devam eder.
HTTP API uç noktaları (örneğin `/v1/*`, `/tools/invoke` ve `/api/channels/*`) Tailscale kimlik üstbilgisi kimlik doğrulamasını **kullanmaz**. Bunlar yine Gateway'in normal HTTP kimlik doğrulama modunu izler: varsayılan olarak paylaşılan gizli değerle kimlik doğrulaması veya bilinçli olarak yapılandırılmış trusted-proxy / özel giriş `none` kurulumu.
Bu tokensız akış Gateway ana makinesinin güvenilir olduğunu varsayar. Güvenilmeyen yerel kod aynı ana makinede çalışabiliyorsa `gateway.auth.allowTailscale` değerini devre dışı bırakın ve bunun yerine token/parola kimlik doğrulaması gerektirin.
Açık paylaşılan gizli değer kimlik bilgileri gerektirmek için `gateway.auth.allowTailscale: false` ayarlayın ve `gateway.auth.mode: "token"` veya `"password"` kullanın.

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

### Yalnızca tailnet (Tailnet IP'ye bağla)

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

Parolayı diske commit etmek yerine `OPENCLAW_GATEWAY_PASSWORD` kullanmayı tercih edin.

## CLI örnekleri

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Notlar

- Tailscale Serve/Funnel, `tailscale` CLI'nin kurulu ve oturum açılmış olmasını gerektirir.
- `tailscale.mode: "funnel"`, genel açıklığı önlemek için kimlik doğrulama modu `password` değilse başlamayı reddeder.
- OpenClaw'ın kapatma sırasında `tailscale serve` veya `tailscale funnel` yapılandırmasını geri almasını istiyorsanız `gateway.tailscale.resetOnExit` ayarlayın.
- Harici olarak yapılandırılmış bir `tailscale funnel` rotasını Gateway yeniden başlatmaları boyunca canlı tutmak için `gateway.tailscale.preserveFunnel: true` ayarlayın. Etkinleştirildiğinde ve Gateway `mode: "serve"` ile çalıştığında, OpenClaw Serve'ü yeniden uygulamadan önce `tailscale funnel status` değerini denetler ve bir Funnel rotası Gateway bağlantı noktasını zaten kapsıyorsa bunu atlar. OpenClaw tarafından yönetilen Funnel'ın yalnızca parola politikası değişmez.
- `gateway.bind: "tailnet"` doğrudan Tailnet bağlamasıdır (HTTPS yok, Serve/Funnel yok).
- `gateway.bind: "auto"` loopback'i tercih eder; yalnızca Tailnet istiyorsanız `tailnet` kullanın.
- Serve/Funnel yalnızca **Gateway kontrol UI + WS** yüzeyini açığa çıkarır. Node'lar aynı Gateway WS uç noktası üzerinden bağlanır, bu nedenle Serve node erişimi için çalışabilir.

## Tarayıcı denetimi (uzak Gateway + yerel tarayıcı)

Gateway'i bir makinede çalıştırıyor ancak başka bir makinedeki tarayıcıyı yönetmek istiyorsanız, tarayıcı makinesinde bir **node host** çalıştırın ve ikisini de aynı tailnet üzerinde tutun. Gateway tarayıcı eylemlerini node'a proxy'ler; ayrı bir denetim sunucusu veya Serve URL'si gerekmez.

Tarayıcı denetimi için Funnel'dan kaçının; node eşleştirmesini operatör erişimi gibi ele alın.

## Tailscale ön koşulları + sınırlar

- Serve, tailnet'iniz için HTTPS'in etkin olmasını gerektirir; eksikse CLI bunu sorar.
- Serve, Tailscale kimlik üstbilgilerini enjekte eder; Funnel etmez.
- Funnel, Tailscale v1.38.3+, MagicDNS, HTTPS etkinliği ve bir funnel node özniteliği gerektirir.
- Funnel, TLS üzerinden yalnızca `443`, `8443` ve `10000` bağlantı noktalarını destekler.
- macOS üzerinde Funnel, açık kaynak Tailscale uygulama varyantını gerektirir.

## Daha fazla bilgi

- Tailscale Serve genel bakış: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` komutu: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel genel bakış: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` komutu: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## İlgili

- [Uzaktan erişim](/tr/gateway/remote)
- [Keşif](/tr/gateway/discovery)
- [Kimlik doğrulama](/tr/gateway/authentication)

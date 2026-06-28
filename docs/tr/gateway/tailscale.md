---
read_when:
    - Gateway Kontrol Arayüzünü localhost dışına açma
    - Tailnet veya herkese açık pano erişimini otomatikleştirme
summary: Gateway panosu için entegre Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-06-28T00:39:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35944eba19cd82d373b25c602b66d1b76f35ad63aa90767bb1c7ef75549fe905
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw, Gateway panosu ve WebSocket portu için Tailscale **Serve** (tailnet) veya **Funnel** (genel) ayarını otomatik yapılandırabilir. Bu, Gateway'in loopback'e bağlı kalmasını sağlarken Tailscale HTTPS, yönlendirme ve (Serve için) kimlik başlıkları sağlar.

## Modlar

- `serve`: `tailscale serve` üzerinden yalnızca tailnet'e açık Serve. Gateway `127.0.0.1` üzerinde kalır.
- `funnel`: `tailscale funnel` üzerinden genel HTTPS. OpenClaw paylaşılan bir parola gerektirir.
- `off`: Varsayılan (Tailscale otomasyonu yok).

Durum ve denetim çıktısı, bu OpenClaw Serve/Funnel modu için **Tailscale maruziyeti** ifadesini kullanır. `off`, OpenClaw'ın Serve veya Funnel'ı yönetmediği anlamına gelir; yerel Tailscale arka plan programının durdurulduğu veya oturumunun kapatıldığı anlamına gelmez.

## Kimlik Doğrulama

El sıkışmayı denetlemek için `gateway.auth.mode` değerini ayarlayın:

- `none` (yalnızca özel ingress)
- `token` (`OPENCLAW_GATEWAY_TOKEN` ayarlandığında varsayılan)
- `password` (`OPENCLAW_GATEWAY_PASSWORD` veya yapılandırma üzerinden paylaşılan gizli anahtar)
- `trusted-proxy` (kimlik farkındalıklı ters proxy; bkz. [Güvenilir Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth))

`tailscale.mode = "serve"` olduğunda ve `gateway.auth.allowTailscale` değeri `true` olduğunda, Control UI/WebSocket kimlik doğrulaması token/parola sağlamadan Tailscale kimlik başlıklarını (`tailscale-user-login`) kullanabilir. OpenClaw, kabul etmeden önce `x-forwarded-for` adresini yerel Tailscale arka plan programı (`tailscale whois`) üzerinden çözümleyip başlıkla eşleştirerek kimliği doğrular. OpenClaw bir isteği yalnızca loopback'ten Tailscale'in `x-forwarded-for`, `x-forwarded-proto` ve `x-forwarded-host` başlıklarıyla geldiğinde Serve olarak değerlendirir.
Tarayıcı cihaz kimliğini içeren Control UI operatör oturumları için, bu doğrulanmış Serve yolu cihaz eşleştirme gidiş dönüşünü de atlar. Tarayıcı cihaz kimliğini baypas etmez: cihazsız istemciler yine reddedilir ve node rolündeki veya Control UI dışı WebSocket bağlantıları normal eşleştirme ve kimlik doğrulama kontrollerini izlemeye devam eder.
HTTP API uç noktaları (örneğin `/v1/*`, `/tools/invoke` ve `/api/channels/*`) Tailscale kimlik başlığı kimlik doğrulamasını **kullanmaz**. Yine Gateway'in normal HTTP kimlik doğrulama modunu izlerler: varsayılan olarak paylaşılan gizli anahtar kimlik doğrulaması ya da bilinçli olarak yapılandırılmış güvenilir proxy / özel ingress `none` kurulumu.
Bu tokensız akış, Gateway ana makinesinin güvenilir olduğunu varsayar. Aynı ana makinede güvenilmeyen yerel kod çalışabiliyorsa `gateway.auth.allowTailscale` ayarını devre dışı bırakın ve bunun yerine token/parola kimlik doğrulaması gerektirin.
Açık paylaşılan gizli anahtar kimlik bilgilerini zorunlu kılmak için `gateway.auth.allowTailscale: false` ayarlayın ve `gateway.auth.mode: "token"` veya `"password"` kullanın.

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

Açın: `https://<magicdns>/` (veya yapılandırılmış `gateway.controlUi.basePath` değeriniz)

Control UI'ı cihaz ana makine adı yerine adlandırılmış bir Tailscale Service üzerinden dışa açmak için `gateway.tailscale.serviceName` değerini Service adı olarak ayarlayın:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

Yukarıdaki örnekte başlangıç, Service URL'sini cihaz ana makine adı yerine `https://openclaw.<tailnet-name>.ts.net/` olarak bildirir.
Tailscale Services, ana makinenin tailnet'inizde onaylı etiketli bir node olmasını gerektirir. Bu seçeneği etkinleştirmeden önce etiketi yapılandırın ve Service'i Tailscale içinde onaylayın; aksi takdirde `tailscale serve --service=...` Gateway başlangıcı sırasında başarısız olur.

### Yalnızca tailnet (Tailnet IP'sine bağlanma)

Gateway'in doğrudan Tailnet IP'sinde dinlemesini istediğinizde bunu kullanın (Serve/Funnel yok).

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

- Tailscale Serve/Funnel, `tailscale` CLI'ın kurulu ve oturum açmış olmasını gerektirir.
- `tailscale.mode: "funnel"`, genel maruziyeti önlemek için kimlik doğrulama modu `password` değilse başlamayı reddeder.
- `gateway.tailscale.serviceName` yalnızca Serve modu için geçerlidir ve `tailscale serve --service=<name>` komutuna geçirilir. Değer, Tailscale'in `svc:<dns-label>` Service adı biçimini kullanmalıdır; örneğin `svc:openclaw`. Tailscale, Service ana makinelerinin etiketli node'lar olmasını gerektirir ve Serve bunu yayımlayabilmeden önce Service'in yönetici konsolunda onaylanması gerekebilir.
- OpenClaw'ın kapanışta `tailscale serve` veya `tailscale funnel` yapılandırmasını geri almasını istiyorsanız `gateway.tailscale.resetOnExit` ayarını yapın.
- Harici olarak yapılandırılmış bir `tailscale funnel` rotasını Gateway yeniden başlatmaları boyunca canlı tutmak için `gateway.tailscale.preserveFunnel: true` ayarlayın. Etkinleştirildiğinde ve Gateway `mode: "serve"` ile çalıştığında, OpenClaw Serve'ü yeniden uygulamadan önce `tailscale funnel status` denetimi yapar ve bir Funnel rotası zaten Gateway portunu kapsıyorsa bunu atlar. OpenClaw tarafından yönetilen Funnel'ın yalnızca parola ilkesi değişmez.
- `gateway.bind: "tailnet"` doğrudan Tailnet bağlamadır (HTTPS yok, Serve/Funnel yok).
- `gateway.bind: "auto"` loopback'i tercih eder; yalnızca Tailnet istiyorsanız `tailnet` kullanın.
- Serve/Funnel yalnızca **Gateway kontrol UI + WS** öğesini dışa açar. Node'lar aynı Gateway WS uç noktası üzerinden bağlanır, bu nedenle Serve node erişimi için çalışabilir.

## Tarayıcı denetimi (uzak Gateway + yerel tarayıcı)

Gateway'i bir makinede çalıştırıyor ancak başka bir makinedeki tarayıcıyı yönetmek istiyorsanız, tarayıcı makinesinde bir **node ana makinesi** çalıştırın ve ikisini de aynı tailnet üzerinde tutun.
Gateway tarayıcı eylemlerini node'a proxy'ler; ayrı bir kontrol sunucusu veya Serve URL'si gerekmez.

Tarayıcı denetimi için Funnel'dan kaçının; node eşleştirmesini operatör erişimi gibi ele alın.

## Tailscale önkoşulları + sınırlar

- Serve, tailnet'iniz için HTTPS'in etkin olmasını gerektirir; eksikse CLI bunu sorar.
- Serve, Tailscale kimlik başlıklarını enjekte eder; Funnel etmez.
- Funnel, Tailscale v1.38.3+, MagicDNS, HTTPS etkinliği ve bir funnel node özniteliği gerektirir.
- Funnel, TLS üzerinden yalnızca `443`, `8443` ve `10000` portlarını destekler.
- macOS üzerinde Funnel, açık kaynak Tailscale uygulama varyantını gerektirir.

## Daha fazla bilgi

- Tailscale Serve genel bakışı: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` komutu: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel genel bakışı: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` komutu: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## İlgili

- [Uzaktan erişim](/tr/gateway/remote)
- [Keşif](/tr/gateway/discovery)
- [Kimlik doğrulama](/tr/gateway/authentication)

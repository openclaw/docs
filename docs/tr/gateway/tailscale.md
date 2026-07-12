---
read_when:
    - Gateway Kontrol Arayüzünü localhost dışından erişime açma
    - Tailnet veya herkese açık pano erişimini otomatikleştirme
summary: Gateway panosu için entegre Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-07-12T12:21:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e201a64ac427994401fae1b934d94e0c5afe976b4acd34d45b059978f5f1807e
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw, Gateway panosu ve WebSocket portu için Tailscale **Serve** (tailnet) veya **Funnel** (genel) yapılandırmasını otomatik olarak yapabilir. Böylece Gateway local loopback'a bağlı kalırken Tailscale HTTPS, yönlendirme ve (Serve için) kimlik üstbilgileri sağlar.

## Modlar

`gateway.tailscale.mode`:

| Mod             | Davranış                                                                     |
| --------------- | ---------------------------------------------------------------------------- |
| `serve`         | `tailscale serve` üzerinden yalnızca tailnet'e açık Serve. Gateway `127.0.0.1` üzerinde kalır. |
| `funnel`        | `tailscale funnel` üzerinden genel HTTPS. Paylaşılan parola gerektirir.       |
| `off` (varsayılan) | Tailscale otomasyonu yoktur.                                               |

Durum ve denetim çıktıları, bu OpenClaw Serve/Funnel modu için **Tailscale erişimi** ifadesini kullanır. `off`, OpenClaw'ın Serve veya Funnel'ı yönetmediği anlamına gelir; yerel Tailscale hizmetinin durdurulduğu veya oturumunun kapatıldığı anlamına gelmez.

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

Şunu açın: `https://<magicdns>/` (veya yapılandırdığınız `gateway.controlUi.basePath`)

Control UI'ı cihaz ana bilgisayar adı yerine adlandırılmış bir Tailscale Service üzerinden kullanıma açmak için `gateway.tailscale.serviceName` değerini Service adına ayarlayın:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

Başlangıçta cihaz ana bilgisayar adı yerine Service URL'si `https://openclaw.<tailnet-name>.ts.net/` olarak bildirilir. Tailscale Services, ana bilgisayarın tailnet'inizde onaylanmış ve etiketlenmiş bir Node olmasını gerektirir — bunu etkinleştirmeden önce etiketi yapılandırın ve Service'i Tailscale'de onaylayın; aksi takdirde Gateway başlatılırken `tailscale serve --service=...` başarısız olur.

### Yalnızca tailnet (Tailnet IP'sine bağlanma)

Gateway'in Serve/Funnel olmadan doğrudan Tailnet IP'sini dinlemesi için bunu kullanın:

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
Bağlanılabilir bir Tailnet IPv4 adresi mevcut olduğunda Gateway, aynı ana bilgisayardaki kimliği doğrulanmış istemciler için ayrıca `http://127.0.0.1:18789` adresini zorunlu kılar. Başlangıçta kullanılabilir bir Tailnet adresi yoksa yalnızca local loopback'a geri döner; doğrudan Tailnet erişimi eklemek için Tailscale kullanılabilir hâle geldikten sonra yeniden başlatın. Her iki yol da LAN veya genel erişim sağlamaz.
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

## Kimlik doğrulama

`gateway.auth.mode`, el sıkışmayı denetler:

| Mod                                                    | Kullanım amacı                                                                       |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `none`                                                 | Yalnızca özel giriş                                                                  |
| `token` (`OPENCLAW_GATEWAY_TOKEN` ayarlandığında varsayılan) | Paylaşılan belirteç                                                           |
| `password`                                             | `OPENCLAW_GATEWAY_PASSWORD` veya yapılandırma üzerinden paylaşılan gizli değer        |
| `trusted-proxy`                                        | Kimlik bilgisine duyarlı ters proxy; bkz. [Güvenilir Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth) |

### Tailscale kimlik üstbilgileri (yalnızca Serve)

`tailscale.mode: "serve"` ve `gateway.auth.allowTailscale` değeri `true` olduğunda Control UI/WebSocket kimlik doğrulaması, belirteç/parola yerine Tailscale kimlik üstbilgilerini (`tailscale-user-login`) kullanabilir. OpenClaw, isteğin `x-forwarded-for` adresini yerel Tailscale hizmeti (`tailscale whois`) üzerinden çözümleyip kabul etmeden önce üstbilgideki oturum açma bilgisiyle eşleştirerek üstbilgiyi doğrular. Bir istek, yalnızca local loopback üzerinden gelip Tailscale'in `x-forwarded-for`, `x-forwarded-proto` ve `x-forwarded-host` üstbilgilerini taşıdığında bu yola uygun olur.

Bu belirteçsiz akış, Gateway ana bilgisayarının güvenilir olduğunu varsayar. Güvenilmeyen yerel kod aynı ana bilgisayarda çalışabiliyorsa `gateway.auth.allowTailscale: false` olarak ayarlayın ve bunun yerine belirteç/parola ile kimlik doğrulamasını zorunlu kılın.

Atlamanın kapsamı:

- Yalnızca Control UI WebSocket kimlik doğrulama yüzeyine uygulanır. HTTP API uç noktaları (`/v1/*`, `/tools/invoke`, `/api/channels/*` vb.) hiçbir zaman Tailscale kimlik üstbilgisi doğrulamasını kullanmaz; her zaman Gateway'in normal HTTP kimlik doğrulama modunu izler.
- Tarayıcı cihaz kimliğini zaten taşıyan Control UI operatör oturumlarında doğrulanmış bir Tailscale kimliği, başlangıç belirteci/QR eşleştirme gidiş dönüşünü atlar.
- Cihaz kimliğinin kendisini atlamaz: cihazı olmayan istemciler yine reddedilir ve Node rolü bağlantıları normal eşleştirme ve kimlik doğrulama kontrollerinden geçmeye devam eder.

## Notlar

- Tailscale Serve/Funnel, `tailscale` CLI'ın yüklü ve oturum açmış olmasını gerektirir.
- `tailscale.mode: "funnel"`, genel erişimi önlemek için kimlik doğrulama modu `password` olmadığı sürece başlatmayı reddeder.
- `gateway.tailscale.serviceName` yalnızca Serve moduna uygulanır ve `tailscale serve --service=<name>` komutuna iletilir. Değer, Tailscale'in `svc:<dns-label>` biçimini kullanmalıdır; örneğin `svc:openclaw`. Tailscale, Service ana bilgisayarlarının etiketlenmiş Node'lar olmasını gerektirir ve Serve'in Service'i yayımlayabilmesi için yönetici konsolu onayı gerekebilir.
- `gateway.tailscale.resetOnExit`, kapanış sırasında `tailscale serve`/`tailscale funnel` yapılandırmasını geri alır.
- `gateway.tailscale.preserveFunnel: true`, harici olarak yapılandırılmış bir `tailscale funnel` rotasını Gateway yeniden başlatmaları boyunca etkin tutar. `mode: "serve"` ile OpenClaw, Serve'i yeniden uygulamadan önce `tailscale funnel status` durumunu denetler ve bir Funnel rotası Gateway portunu zaten kapsıyorsa bu işlemi atlar. OpenClaw tarafından yönetilen Funnel'ın yalnızca parola politikası değişmez.
- `gateway.bind: "tailnet"`, bir Tailnet IPv4 kullanılabilir olduğunda doğrudan Tailnet bağlantısının (HTTPS yok, Serve/Funnel yok) yanı sıra zorunlu yerel `127.0.0.1` adresini kullanır; aksi takdirde yalnızca local loopback'a geri döner.
- `gateway.bind: "auto"` local loopback'ı tercih eder; aynı ana bilgisayardaki local loopback erişimini korurken ağ erişimini Tailnet ile sınırlamak için `tailnet` kullanın.
- Serve/Funnel yalnızca **Gateway Control UI + WS**'yi kullanıma açar. Node'lar aynı Gateway WS uç noktası üzerinden bağlandığından Serve, Node erişimi için de çalışır.

### Tailscale ön koşulları ve sınırları

- Serve, tailnet'iniz için HTTPS'nin etkinleştirilmesini gerektirir; eksikse CLI sizden etkinleştirmenizi ister.
- Serve, Tailscale kimlik üstbilgileri ekler; Funnel eklemez.
- Funnel; Tailscale v1.38.3+, MagicDNS, etkinleştirilmiş HTTPS ve bir Funnel Node niteliği gerektirir.
- Funnel, TLS üzerinden yalnızca `443`, `8443` ve `10000` portlarını destekler.
- macOS'ta Funnel, açık kaynaklı Tailscale uygulaması sürümünü gerektirir.

## Tarayıcı denetimi (uzak Gateway + yerel tarayıcı)

Gateway'i bir makinede çalıştırıp başka bir makinedeki tarayıcıyı yönetmek için tarayıcı makinesinde bir **Node ana bilgisayarı** çalıştırın ve her ikisini de aynı tailnet'te tutun. Gateway, tarayıcı eylemlerini Node'a proxy'ler; ayrı bir denetim sunucusu veya Serve URL'si gerekmez.

Tarayıcı denetimi için Funnel kullanmaktan kaçının; Node eşleştirmesini operatör erişimi gibi değerlendirin.

## Daha fazla bilgi

- Tailscale Serve'a genel bakış: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` komutu: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel'a genel bakış: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` komutu: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## İlgili

- [Uzaktan erişim](/tr/gateway/remote)
- [Keşif](/tr/gateway/discovery)
- [Kimlik doğrulama](/tr/gateway/authentication)

---
read_when:
    - Gateway'e Tailscale üzerinden erişmek istiyorsunuz
    - Tarayıcı Denetim Arayüzü'nü ve yapılandırma düzenlemeyi istiyorsunuz
summary: 'Gateway web yüzeyleri: Denetim Arayüzü, bağlama modları ve güvenlik'
title: Web
x-i18n:
    generated_at: "2026-07-12T12:55:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 413fb029d95241f5c6043b28825727cdee52b2fa8cbe998fbbd6e3ff7b81467b
    source_path: web/index.md
    workflow: 16
---

Gateway, Gateway WebSocket ile aynı porttan küçük bir **tarayıcı Denetim Arayüzü** (Vite + Lit) sunar:

- varsayılan: `http://<host>:18789/`
- `gateway.tls.enabled: true` ile: `https://<host>:18789/`
- isteğe bağlı önek: `gateway.controlUi.basePath` değerini ayarlayın (ör. `/openclaw`)

Yetenekler [Denetim Arayüzü](/tr/web/control-ui) bölümünde açıklanır. Bu sayfa bağlama modlarını, güvenliği ve web'e yönelik diğer yüzeyleri ele alır.

## Yapılandırma (varsayılan olarak açık)

Varlıklar (`dist/control-ui`) mevcut olduğunda Denetim Arayüzü **varsayılan olarak etkindir**:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath isteğe bağlı
  },
}
```

## Webhook'lar

`hooks.enabled=true` olduğunda Gateway, aynı HTTP sunucusunda bir Webhook uç noktası da sunar. Kimlik doğrulama ve yükler için [Gateway yapılandırma başvurusu](/tr/gateway/configuration-reference#hooks) içindeki `hooks` bölümüne bakın.

## Yönetici HTTP RPC'si

`POST /api/v1/admin/rpc`, seçili Gateway denetim düzlemi yöntemlerini HTTP üzerinden sunar. Varsayılan olarak kapalıdır; yalnızca `admin-http-rpc` Plugin'i etkinleştirildiğinde kaydedilir. Kimlik doğrulama modeli, izin verilen yöntemler ve WebSocket API ile karşılaştırma için [Yönetici HTTP RPC'si](/tr/plugins/admin-http-rpc) bölümüne bakın.

## Tailscale erişimi

<Tabs>
  <Tab title="Tümleşik Serve (önerilen)">
    Gateway'i local loopback üzerinde tutun ve Tailscale Serve'ün buna proxy görevi görmesini sağlayın:

    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "serve" },
      },
    }
    ```

    Gateway'i başlatın:

    ```bash
    openclaw gateway
    ```

    `https://<magicdns>/` adresini (veya yapılandırdığınız `gateway.controlUi.basePath` yolunu) açın.

  </Tab>
  <Tab title="Tailnet bağlama + token">
    ```json5
    {
      gateway: {
        bind: "tailnet",
        controlUi: { enabled: true },
        auth: { mode: "token", token: "your-token" },
      },
    }
    ```

    Gateway'i başlatın (bu local loopback dışı örnek, paylaşılan gizli anahtar token kimlik doğrulamasını kullanır):

    ```bash
    openclaw gateway
    ```

    `http://<tailscale-ip>:18789/` adresini (veya yapılandırdığınız `gateway.controlUi.basePath` yolunu) açın.

  </Tab>
  <Tab title="Genel internet (Funnel)">
    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "funnel" },
        auth: { mode: "password" }, // veya OPENCLAW_GATEWAY_PASSWORD
      },
    }
    ```

    `tailscale.mode: "funnel"` için `gateway.auth.mode: "password"` gerekir; hem Serve hem de Funnel için `gateway.bind: "loopback"` gerekir.

  </Tab>
</Tabs>

## Güvenlik notları

- Gateway kimlik doğrulaması varsayılan olarak gereklidir: etkinleştirildiğinde token, parola, güvenilir proxy veya Tailscale Serve kimlik üstbilgileri.
- Local loopback dışı bağlamalar yine de Gateway kimlik doğrulaması **gerektirir**: token/parola kimlik doğrulaması veya `gateway.auth.mode: "trusted-proxy"` kullanan, kimlik bilincine sahip bir ters proxy.
- İlk katılım sihirbazı varsayılan olarak paylaşılan gizli anahtar kimlik doğrulaması oluşturur ve local loopback üzerinde bile genellikle bir Gateway token'ı üretir.
- Paylaşılan gizli anahtar modunda arayüz, WebSocket el sıkışması sırasında `connect.params.auth.token` veya `connect.params.auth.password` gönderir.
- `gateway.tls.enabled: true` olduğunda yerel pano/durum yardımcıları `https://` URL'lerini ve `wss://` WebSocket URL'lerini oluşturur.
- Kimlik taşıyan modlarda (Tailscale Serve, `trusted-proxy`) WebSocket kimlik doğrulama denetimi, paylaşılan gizli anahtar yerine istek üstbilgileriyle karşılanır.
- Genel kullanıma açık, local loopback dışı Denetim Arayüzü dağıtımlarında `gateway.controlUi.allowedOrigins` değerini açıkça ayarlayın (tam kaynaklar). Aynı kaynaktan yapılan özel yüklemeler; local loopback, RFC1918/bağlantı yerel, `.local`, `.ts.net` ve Tailscale CGNAT ana makineleri için bu ayar olmadan kabul edilir.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback: true`, Host üstbilgisi kaynak geri dönüşünü etkinleştirir; bu, tehlikeli bir güvenlik düşürmesidir.
- Serve ile `gateway.auth.allowTailscale: true` olduğunda Tailscale kimlik üstbilgileri, Denetim Arayüzü/WebSocket kimlik doğrulamasını karşılar (token/parola gerekmez). HTTP API uç noktaları Tailscale kimlik üstbilgilerini kullanmaz; her zaman Gateway'in normal HTTP kimlik doğrulama modunu izler. Serve üzerinden bile açık kimlik bilgileri gerektirmek için `gateway.auth.allowTailscale: false` olarak ayarlayın. Bu tokensız akış, Gateway ana makinesinin güvenilir olduğunu varsayar. [Tailscale](/tr/gateway/tailscale) ve [Güvenlik](/tr/gateway/security) bölümlerine bakın.

## Arayüzü derleme

Gateway, `dist/control-ui` konumundaki statik dosyaları sunar:

```bash
pnpm ui:build
```

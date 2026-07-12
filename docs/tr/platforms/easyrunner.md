---
read_when:
    - OpenClaw'u EasyRunner üzerinde dağıtma
    - Gateway'i EasyRunner'ın Caddy proxy'sinin arkasında çalıştırma
    - Barındırılan bir Gateway için kalıcı birimleri ve kimlik doğrulamayı seçme
summary: OpenClaw Gateway'i EasyRunner üzerinde Podman ve Caddy ile çalıştırın
title: EasyRunner
x-i18n:
    generated_at: "2026-07-12T12:25:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 80cbde016a8bf7662d4b4a056a3d122a423264179daf70b5705e8f10b0dad5cb
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner, OpenClaw Gateway'i Caddy proxy'sinin arkasında küçük, kapsayıcılaştırılmış bir uygulama olarak barındırır. Bu kılavuz, Podman uyumlu Compose uygulamalarını çalıştıran ve HTTPS bağlantılarını Caddy üzerinden sonlandıran bir EasyRunner ana makinesini varsayar.

## Başlamadan önce

- Kendisine yönlendirilmiş bir alan adına sahip EasyRunner sunucusu.
- Resmî OpenClaw imajı (`ghcr.io/openclaw/openclaw`) veya kendi derlemeniz.
- `/home/node/.openclaw` için kalıcı bir yapılandırma birimi.
- `/home/node/.openclaw/workspace` için kalıcı bir çalışma alanı birimi.
- Güçlü bir Gateway belirteci veya parolası.

Mümkün olduğunda cihaz kimlik doğrulamasını etkin tutun. Ters proxy'niz cihaz kimliğini doğru şekilde aktaramıyorsa önce güvenilir proxy ayarlarını düzeltin (bkz. [Güvenilir proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth)); tehlikeli kimlik doğrulama atlamalarını yalnızca tamamen özel ve operatör denetimindeki bir ağda kullanın.

## Compose uygulaması

Aşağıdaki yapıya sahip bir Compose dosyasıyla EasyRunner uygulaması oluşturun:

```yaml
services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:latest
    restart: unless-stopped
    environment:
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
      OPENCLAW_HOME: /home/node
      OPENCLAW_STATE_DIR: /home/node/.openclaw
      OPENCLAW_CONFIG_PATH: /home/node/.openclaw/openclaw.json
      OPENCLAW_WORKSPACE_DIR: /home/node/.openclaw/workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/home/node/.openclaw/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["node", "openclaw.mjs", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

`openclaw.example.com` değerini Gateway ana makine adınızla değiştirin. `OPENCLAW_GATEWAY_TOKEN` değerini uygulama tanımına kaydetmek yerine EasyRunner'ın gizli değer/ortam yöneticisinde saklayın. İmaj varsayılan olarak local loopback'e bağlandığından, Caddy'nin kapsayıcıya erişebilmesi için `command` içindeki açık `--bind lan --port 1455` ayarı gereklidir.

## OpenClaw'ı yapılandırma

Kalıcı yapılandırma biriminde Gateway'i yalnızca proxy üzerinden erişilebilir tutun ve kimlik doğrulamasını zorunlu kılın:

```json5
{
  gateway: {
    bind: "lan",
    port: 1455,
    auth: {
      token: "${OPENCLAW_GATEWAY_TOKEN}",
    },
  },
}
```

Caddy, Gateway için TLS bağlantılarını sonlandırıyorsa kimlik doğrulama denetimlerini genel olarak devre dışı bırakmak yerine tam proxy yolu için güvenilir proxy ayarlarını yapılandırın. Bkz. [Güvenilir proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth).

## Doğrulama

İş istasyonunuzdan:

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

EasyRunner ana makinesinden, `GET /healthz` (çalışırlık) ve `GET /readyz` (hazır olma durumu) kimlik doğrulaması gerektirmez ve imajın yerleşik kapsayıcı sağlık denetimini destekler. Ayrıca uygulama günlüklerinde dinleyen bir Gateway bulunduğunu ve başlangıç sırasında SecretRef, plugin veya kanal kimlik doğrulama hatası olmadığını kontrol edin.

## Güncellemeler ve yedeklemeler

- Yeni OpenClaw imajını çekin veya derleyin, ardından EasyRunner uygulamasını yeniden dağıtın.
- Güncellemelerden önce `openclaw-config` birimini yedekleyin. Bu birim `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json` ve yüklü plugin paketlerinin durumunu içerir.
- Aracılar buraya kalıcı proje verileri yazıyorsa `openclaw-workspace` birimini yedekleyin.
- Yapılandırma geçişlerini ve hizmet uyarılarını tespit etmek için büyük güncellemelerden sonra `openclaw doctor` komutunu çalıştırın.

## Sorun giderme

- `gateway probe` bağlanamıyor: Caddy ana makine adının uygulamaya yönlendirildiğini ve kapsayıcının `0.0.0.0:1455` üzerinde dinlediğini doğrulayın.
- Kimlik doğrulaması başarısız oluyor: EasyRunner gizli değerlerindeki ve yerel istemci komutundaki belirteci birlikte yenileyin.
- Geri yükleme sonrasında dosyaların sahibi root: imaj `node` (uid 1000) olarak çalışır; bu kullanıcının `/home/node/.openclaw` ve `/home/node/.openclaw/workspace` dizinlerine yazabilmesi için bağlanan birimlerin sahipliğini düzeltin.
- Tarayıcı veya kanal plugin'leri başarısız oluyor: gerekli harici ikili dosyaların, ağ çıkışının ve bağlanan kimlik bilgilerinin kapsayıcı içinde kullanılabilir olup olmadığını kontrol edin.

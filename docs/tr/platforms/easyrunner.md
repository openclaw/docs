---
read_when:
    - OpenClaw'u EasyRunner'da dağıtma
    - OpenClaw Gateway'i EasyRunner'ın Caddy proxy'sinin arkasında çalıştırma
    - Barındırılan bir Gateway için kalıcı birimleri ve kimlik doğrulamayı seçme
summary: OpenClaw Gateway’i Podman ve Caddy ile EasyRunner’da çalıştırın
title: EasyRunner
x-i18n:
    generated_at: "2026-06-28T00:47:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b6d67270e1b47ecbd67361edd018b531598d0365e2dacd594cb73c6b74c10478
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner, OpenClaw Gateway'i Caddy proxy'sinin arkasında küçük bir container'lı uygulama olarak barındırabilir. Bu kılavuz, Podman uyumlu Compose uygulamaları çalıştıran ve HTTPS'i Caddy üzerinden sunan bir EasyRunner host'u varsayar.

## Başlamadan önce

- Kendisine yönlendirilmiş bir alan adına sahip EasyRunner sunucusu.
- Derlenmiş veya yayımlanmış bir OpenClaw container imajı.
- `/home/node/.openclaw` için kalıcı bir yapılandırma volume'ü.
- `/workspace` için kalıcı bir çalışma alanı volume'ü.
- Güçlü bir Gateway token'ı veya parolası.

Mümkün olduğunda cihaz kimlik doğrulamasını etkin tutun. Reverse proxy dağıtımınız cihaz kimliğini doğru şekilde taşıyamıyorsa önce trusted-proxy ayarlarını düzeltin; tehlikeli kimlik doğrulama atlamalarını yalnızca tamamen özel, operatör denetimli bir ağ için kullanın.

## Compose uygulaması

Şuna benzer bir Compose dosyasıyla bir EasyRunner uygulaması oluşturun:

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
      OPENCLAW_WORKSPACE_DIR: /workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["openclaw", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

`openclaw.example.com` yerine Gateway host adınızı yazın. `OPENCLAW_GATEWAY_TOKEN` değerini uygulama tanımına commit etmek yerine EasyRunner'ın gizli değer/ortam yöneticisinde saklayın.

## OpenClaw'ı yapılandırma

Kalıcı yapılandırma volume'ü içinde Gateway'in yalnızca proxy üzerinden erişilebilir olmasını sağlayın ve kimlik doğrulama gerektirin:

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

Caddy, Gateway için TLS'i sonlandırıyorsa kimlik doğrulama denetimlerini genel olarak devre dışı bırakmak yerine tam proxy yolu için trusted proxy ayarlarını yapılandırın. Bkz. [Trusted proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth).

## Doğrulama

Çalışma istasyonunuzdan:

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

EasyRunner host'undan, dinleyen bir Gateway olduğunu ve başlangıçta SecretRef, Plugin veya kanal kimlik doğrulama hatası olmadığını doğrulamak için uygulama günlüklerini kontrol edin.

## Güncellemeler ve yedeklemeler

- Yeni OpenClaw imajını çekin veya derleyin, ardından EasyRunner uygulamasını yeniden dağıtın.
- Güncellemelerden önce `openclaw-config` volume'ünü yedekleyin.
- Agents orada kalıcı proje verileri yazıyorsa `openclaw-workspace` öğesini yedekleyin.
- Büyük güncellemelerden sonra yapılandırma migration'larını ve hizmet uyarılarını yakalamak için `openclaw doctor` çalıştırın.

## Sorun giderme

- `gateway probe` bağlanamıyor: Caddy host adının uygulamayı gösterdiğini ve container'ın `0.0.0.0:1455` üzerinde dinlediğini doğrulayın.
- Kimlik doğrulama başarısız oluyor: EasyRunner gizli değerlerindeki token'ı ve yerel istemci komutunu birlikte döndürün.
- Geri yüklemeden sonra dosyalar root'a ait oluyor: Bağlanan volume'leri, container kullanıcısının `/home/node/.openclaw` ve `/workspace` dizinlerine yazabileceği şekilde onarın.
- Tarayıcı veya kanal Plugin'leri başarısız oluyor: Gerekli harici binary'lerin, ağ çıkışının ve bağlanan kimlik bilgilerinin container içinde kullanılabilir olup olmadığını kontrol edin.

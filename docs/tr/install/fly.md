---
read_when:
    - OpenClaw'ı Fly.io üzerinde dağıtma
    - Fly birimlerini, gizli değerlerini ve ilk çalıştırma yapılandırmasını ayarlama
summary: OpenClaw için kalıcı depolama ve HTTPS ile adım adım Fly.io dağıtımı
title: Fly.io
x-i18n:
    generated_at: "2026-05-10T19:42:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2f6f56d22f01fc3729bafc47337e12dfad626a8b0bebb60bc4b49757d6cd1d3
    source_path: install/fly.md
    workflow: 16
---

**Hedef:** OpenClaw Gateway'in kalıcı depolama, otomatik HTTPS ve Discord/kanal erişimiyle bir [Fly.io](https://fly.io) makinesinde çalışması.

## Gerekenler

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) kurulu
- Fly.io hesabı (ücretsiz katman yeterlidir)
- Model kimlik doğrulaması: seçtiğiniz model sağlayıcısı için API anahtarı
- Kanal kimlik bilgileri: Discord bot belirteci, Telegram belirteci vb.

## Başlangıç için hızlı yol

1. Repoyu klonlayın → `fly.toml` dosyasını özelleştirin
2. Uygulama + volume oluşturun → gizli değerleri ayarlayın
3. `fly deploy` ile dağıtın
4. Yapılandırma oluşturmak için SSH ile bağlanın veya Control UI kullanın

<Steps>
  <Step title="Create the Fly app">
    ```bash
    # Clone the repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Create a new Fly app (pick your own name)
    fly apps create my-openclaw

    # Create a persistent volume (1GB is usually enough)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **İpucu:** Size yakın bir bölge seçin. Yaygın seçenekler: `lhr` (Londra), `iad` (Virginia), `sjc` (San Jose).

  </Step>

  <Step title="Configure fly.toml">
    `fly.toml` dosyasını uygulama adınıza ve gereksinimlerinize uyacak şekilde düzenleyin.

    **Güvenlik notu:** Varsayılan yapılandırma herkese açık bir URL sunar. Herkese açık IP'si olmayan güçlendirilmiş bir dağıtım için [Özel Dağıtım](#private-deployment-hardened) bölümüne bakın veya `deploy/fly.private.toml` kullanın.

    ```toml
    app = "my-openclaw"  # Your app name
    primary_region = "iad"

    [build]
      dockerfile = "Dockerfile"

    [env]
      NODE_ENV = "production"
      OPENCLAW_PREFER_PNPM = "1"
      OPENCLAW_STATE_DIR = "/data"
      NODE_OPTIONS = "--max-old-space-size=1536"

    [processes]
      app = "node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan"

    [http_service]
      internal_port = 3000
      force_https = true
      auto_stop_machines = false
      auto_start_machines = true
      min_machines_running = 1
      processes = ["app"]

    [[vm]]
      size = "shared-cpu-2x"
      memory = "2048mb"

    [mounts]
      source = "openclaw_data"
      destination = "/data"
    ```

    OpenClaw Docker imajı giriş noktası olarak `tini` kullanır. Fly işlem komutları Docker `CMD` değerini değiştirir, ancak `ENTRYPOINT` değerini değiştirmez; bu nedenle işlem yine `tini` altında çalışır.

    **Temel ayarlar:**

    | Ayar                           | Neden                                                                       |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Fly proxy'sinin Gateway'e ulaşabilmesi için `0.0.0.0` adresine bağlanır    |
    | `--allow-unconfigured`         | Yapılandırma dosyası olmadan başlatır (dosyayı sonrasında oluşturacaksınız) |
    | `internal_port = 3000`         | Fly sağlık kontrolleri için `--port 3000` (veya `OPENCLAW_GATEWAY_PORT`) ile eşleşmelidir |
    | `memory = "2048mb"`            | 512 MB çok küçüktür; 2 GB önerilir                                         |
    | `OPENCLAW_STATE_DIR = "/data"` | Durumu volume üzerinde kalıcı hale getirir                                  |

  </Step>

  <Step title="Set secrets">
    ```bash
    # Required: Gateway token (for non-loopback binding)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Model provider API keys
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Optional: Other providers
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Channel tokens
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **Notlar:**

    - Non-loopback bağlamalar (`--bind lan`) geçerli bir Gateway kimlik doğrulama yolu gerektirir. Bu Fly.io örneği `OPENCLAW_GATEWAY_TOKEN` kullanır, ancak `gateway.auth.password` veya doğru yapılandırılmış non-loopback `trusted-proxy` dağıtımı da gereksinimi karşılar.
    - Bu belirteçleri parola gibi ele alın.
    - Tüm API anahtarları ve belirteçler için yapılandırma dosyası yerine **env var kullanmayı tercih edin**. Bu, gizli değerlerin yanlışlıkla açığa çıkabileceği veya günlüklere yazılabileceği `openclaw.json` dışında tutulmasını sağlar.

  </Step>

  <Step title="Deploy">
    ```bash
    fly deploy
    ```

    İlk dağıtım Docker imajını derler (~2-3 dakika). Sonraki dağıtımlar daha hızlıdır.

    Dağıtımdan sonra doğrulayın:

    ```bash
    fly status
    fly logs
    ```

    Şunu görmelisiniz:

    ```
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="Create config file">
    Doğru bir yapılandırma oluşturmak için makineye SSH ile bağlanın:

    ```bash
    fly ssh console
    ```

    Yapılandırma dizinini ve dosyasını oluşturun:

    ```bash
    mkdir -p /data
    cat > /data/openclaw.json << 'EOF'
    {
      "agents": {
        "defaults": {
          "model": {
            "primary": "anthropic/claude-opus-4-6",
            "fallbacks": ["anthropic/claude-sonnet-4-6", "openai/gpt-5.4"]
          },
          "maxConcurrent": 4
        },
        "list": [
          {
            "id": "main",
            "default": true
          }
        ]
      },
      "auth": {
        "profiles": {
          "anthropic:default": { "mode": "token", "provider": "anthropic" },
          "openai:default": { "mode": "token", "provider": "openai" }
        }
      },
      "bindings": [
        {
          "agentId": "main",
          "match": { "channel": "discord" }
        }
      ],
      "channels": {
        "discord": {
          "enabled": true,
          "groupPolicy": "allowlist",
          "guilds": {
            "YOUR_GUILD_ID": {
              "channels": { "general": { "allow": true } },
              "requireMention": false
            }
          }
        }
      },
      "gateway": {
        "mode": "local",
        "bind": "auto",
        "controlUi": {
          "allowedOrigins": [
            "https://my-openclaw.fly.dev",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
          ]
        }
      },
      "meta": {}
    }
    EOF
    ```

    **Not:** `OPENCLAW_STATE_DIR=/data` ile yapılandırma yolu `/data/openclaw.json` olur.

    **Not:** `https://my-openclaw.fly.dev` değerini gerçek Fly uygulamanızın
    origin değeriyle değiştirin. Gateway başlangıcı, yapılandırma henüz yokken
    ilk önyüklemenin devam edebilmesi için yerel Control UI origin değerlerini
    çalışma zamanı `--bind` ve `--port` değerlerinden oluşturur, ancak Fly
    üzerinden tarayıcı erişimi için tam HTTPS origin değerinin
    `gateway.controlUi.allowedOrigins` içinde listelenmesi gerekir.

    **Not:** Discord belirteci şu kaynaklardan birinden gelebilir:

    - Ortam değişkeni: `DISCORD_BOT_TOKEN` (gizli değerler için önerilir)
    - Yapılandırma dosyası: `channels.discord.token`

    env var kullanıyorsanız yapılandırmaya belirteç eklemeniz gerekmez. Gateway `DISCORD_BOT_TOKEN` değerini otomatik olarak okur.

    Uygulamak için yeniden başlatın:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Access the Gateway">
    ### Control UI

    Tarayıcıda açın:

    ```bash
    fly open
    ```

    Veya `https://my-openclaw.fly.dev/` adresini ziyaret edin

    Yapılandırılmış paylaşılan gizli değerle kimlik doğrulaması yapın. Bu kılavuz
    `OPENCLAW_GATEWAY_TOKEN` içindeki Gateway belirtecini kullanır; parola
    kimlik doğrulamasına geçtiyseniz bunun yerine o parolayı kullanın.

    ### Günlükler

    ```bash
    fly logs              # Live logs
    fly logs --no-tail    # Recent logs
    ```

    ### SSH Konsolu

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Sorun giderme

### "Uygulama beklenen adreste dinlemiyor"

Gateway `0.0.0.0` yerine `127.0.0.1` adresine bağlanıyor.

**Düzeltme:** `fly.toml` içindeki işlem komutunuza `--bind lan` ekleyin.

### Sağlık kontrolleri başarısız / bağlantı reddedildi

Fly yapılandırılmış bağlantı noktasında Gateway'e ulaşamıyor.

**Düzeltme:** `internal_port` değerinin Gateway bağlantı noktasıyla eşleştiğinden emin olun (`--port 3000` veya `OPENCLAW_GATEWAY_PORT=3000` ayarlayın).

### OOM / Bellek Sorunları

Konteyner sürekli yeniden başlatılıyor veya sonlandırılıyor. Belirtiler: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` veya sessiz yeniden başlatmalar.

**Düzeltme:** `fly.toml` içinde belleği artırın:

```toml
[[vm]]
  memory = "2048mb"
```

Veya mevcut bir makineyi güncelleyin:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Not:** 512 MB çok küçüktür. 1 GB çalışabilir, ancak yük altında veya ayrıntılı günlükleme ile OOM yaşanabilir. **2 GB önerilir.**

### Gateway kilit sorunları

Gateway "zaten çalışıyor" hatalarıyla başlamayı reddediyor.

Bu, konteyner yeniden başlatıldığında ancak PID kilit dosyası volume üzerinde kaldığında olur.

**Düzeltme:** Kilit dosyasını silin:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

Kilit dosyası `/data/gateway.*.lock` konumundadır (bir alt dizinde değildir).

### Yapılandırma okunmuyor

`--allow-unconfigured` yalnızca başlangıç korumasını atlar. `/data/openclaw.json` oluşturmaz veya onarmaz; bu nedenle normal bir yerel Gateway başlangıcı istediğinizde gerçek yapılandırmanızın var olduğundan ve `gateway.mode="local"` içerdiğinden emin olun.

Yapılandırmanın var olduğunu doğrulayın:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### SSH üzerinden yapılandırma yazma

`fly ssh console -C` komutu kabuk yönlendirmesini desteklemez. Bir yapılandırma dosyası yazmak için:

```bash
# Use echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Or use sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Not:** Dosya zaten varsa `fly sftp` başarısız olabilir. Önce silin:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Durum kalıcı olmuyor

Yeniden başlatmadan sonra kimlik doğrulama profillerini, kanal/sağlayıcı durumunu
veya oturumları kaybediyorsanız durum dizini konteyner dosya sistemine yazıyordur.

**Düzeltme:** `fly.toml` içinde `OPENCLAW_STATE_DIR=/data` ayarlandığından emin olun ve yeniden dağıtın.

## Güncellemeler

```bash
# Pull latest changes
git pull

# Redeploy
fly deploy

# Check health
fly status
fly logs
```

### Makine komutunu güncelleme

Tam yeniden dağıtım yapmadan başlangıç komutunu değiştirmeniz gerekiyorsa:

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Not:** `fly deploy` sonrasında makine komutu `fly.toml` içindeki değere sıfırlanabilir. El ile değişiklik yaptıysanız dağıtımdan sonra bunları yeniden uygulayın.

## Özel dağıtım (güçlendirilmiş)

Varsayılan olarak Fly herkese açık IP'ler ayırır ve Gateway'inizi `https://your-app.fly.dev` adresinden erişilebilir hale getirir. Bu kullanışlıdır, ancak dağıtımınızın internet tarayıcıları (Shodan, Censys vb.) tarafından keşfedilebilir olduğu anlamına gelir.

**Herkese açık maruziyeti olmayan** güçlendirilmiş bir dağıtım için özel şablonu kullanın.

### Özel dağıtım ne zaman kullanılmalı

- Yalnızca **dışarı giden** çağrılar/mesajlar yapıyorsunuz (gelen Webhook yok)
- Herhangi bir Webhook geri çağrısı için **ngrok veya Tailscale** tünelleri kullanıyorsunuz
- Gateway'e tarayıcı yerine **SSH, proxy veya WireGuard** üzerinden erişiyorsunuz
- Dağıtımın **internet tarayıcılarından gizlenmesini** istiyorsunuz

### Kurulum

Standart yapılandırma yerine `deploy/fly.private.toml` kullanın:

```bash
# Deploy with private config
fly deploy -c deploy/fly.private.toml
```

Veya mevcut bir dağıtımı dönüştürün:

```bash
# List current IPs
fly ips list -a my-openclaw

# Release public IPs
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Switch to private config so future deploys don't re-allocate public IPs
# (remove [http_service] or deploy with the private template)
fly deploy -c deploy/fly.private.toml

# Allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

Bundan sonra `fly ips list` yalnızca `private` türünde bir IP göstermelidir:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Özel dağıtıma erişme

Herkese açık URL olmadığından şu yöntemlerden birini kullanın:

**Seçenek 1: Yerel proxy (en basiti)**

```bash
# Forward local port 3000 to the app
fly proxy 3000:3000 -a my-openclaw

# Then open http://localhost:3000 in browser
```

**Seçenek 2: WireGuard VPN**

```bash
# Create WireGuard config (one-time)
fly wireguard create

# Import to WireGuard client, then access via internal IPv6
# Example: http://[fdaa:x:x:x:x::x]:3000
```

**Seçenek 3: Yalnızca SSH**

```bash
fly ssh console -a my-openclaw
```

### Özel dağıtımda Webhook'lar

Genel erişime açmadan Webhook geri çağrılarına (Twilio, Telnyx vb.) ihtiyacınız varsa:

1. **ngrok tüneli** - ngrok'u konteyner içinde veya sidecar olarak çalıştırın
2. **Tailscale Funnel** - Belirli yolları Tailscale üzerinden açın
3. **Yalnızca giden** - Bazı sağlayıcılar (Twilio), Webhook olmadan giden aramalar için sorunsuz çalışır

ngrok ile örnek sesli arama yapılandırması:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          tunnel: { provider: "ngrok" },
          webhookSecurity: {
            allowedHosts: ["example.ngrok.app"],
          },
        },
      },
    },
  },
}
```

ngrok tüneli konteynerin içinde çalışır ve Fly uygulamasının kendisini açığa çıkarmadan genel bir Webhook URL'si sağlar. İletilen ana makine üstbilgilerinin kabul edilmesi için `webhookSecurity.allowedHosts` değerini genel tünel ana makine adına ayarlayın.

### Güvenlik avantajları

| Unsur            | Genel       | Özel    |
| ----------------- | ------------ | ---------- |
| İnternet tarayıcıları | Keşfedilebilir | Gizli     |
| Doğrudan saldırılar    | Mümkün     | Engellenir    |
| Kontrol arayüzü erişimi | Tarayıcı      | Proxy/VPN  |
| Webhook teslimi  | Doğrudan       | Tünel üzerinden |

## Notlar

- Fly.io **x86 mimarisi** kullanır (ARM değil)
- Dockerfile her iki mimariyle de uyumludur
- WhatsApp/Telegram ilk kurulumu için `fly ssh console` kullanın
- Kalıcı veriler `/data` konumundaki birimde bulunur
- Signal, Java + signal-cli gerektirir; özel bir imaj kullanın ve belleği 2 GB+ seviyesinde tutun.

## Maliyet

Önerilen yapılandırmayla (`shared-cpu-2x`, 2 GB RAM):

- Kullanıma bağlı olarak ayda ~$10-15
- Ücretsiz katman bir miktar kullanım hakkı içerir

Ayrıntılar için [Fly.io fiyatlandırmasına](https://fly.io/docs/about/pricing/) bakın.

## Sonraki adımlar

- Mesajlaşma kanallarını ayarlayın: [Kanallar](/tr/channels)
- Gateway'i yapılandırın: [Gateway yapılandırması](/tr/gateway/configuration)
- OpenClaw'ı güncel tutun: [Güncelleme](/tr/install/updating)

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Hetzner](/tr/install/hetzner)
- [Docker](/tr/install/docker)
- [VPS barındırma](/tr/vps)

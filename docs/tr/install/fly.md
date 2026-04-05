---
read_when:
    - OpenClaw'ı Fly.io üzerinde dağıtıyorsunuz
    - Fly volume'lerini, secrets'ları ve ilk çalıştırma yapılandırmasını ayarlıyorsunuz
summary: Kalıcı depolama ve HTTPS ile OpenClaw için adım adım Fly.io dağıtımı
title: Fly.io
x-i18n:
    generated_at: "2026-04-05T13:57:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5f8c2c03295d786c0d8df98f8a5ae9335fa0346a188b81aae3e07d566a2c0ef
    source_path: install/fly.md
    workflow: 15
---

# Fly.io Dağıtımı

**Amaç:** OpenClaw Gateway'in [Fly.io](https://fly.io) makinesi üzerinde kalıcı depolama, otomatik HTTPS ve Discord/kanal erişimiyle çalışması.

## Gerekenler

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) kurulu olmalı
- Fly.io hesabı (ücretsiz katman çalışır)
- Model kimlik doğrulaması: seçtiğiniz model sağlayıcısı için API anahtarı
- Kanal kimlik bilgileri: Discord bot token'ı, Telegram token'ı vb.

## Başlangıç için hızlı yol

1. Depoyu klonlayın → `fly.toml` dosyasını özelleştirin
2. Uygulama + volume oluşturun → secrets ayarlayın
3. `fly deploy` ile dağıtın
4. Yapılandırmayı oluşturmak için SSH ile bağlanın veya Kontrol UI'ı kullanın

<Steps>
  <Step title="Fly uygulamasını oluşturun">
    ```bash
    # Depoyu klonlayın
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Yeni bir Fly uygulaması oluşturun (kendi adınızı seçin)
    fly apps create my-openclaw

    # Kalıcı bir volume oluşturun (genellikle 1GB yeterlidir)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **İpucu:** Size yakın bir bölge seçin. Yaygın seçenekler: `lhr` (Londra), `iad` (Virginia), `sjc` (San Jose).

  </Step>

  <Step title="fly.toml dosyasını yapılandırın">
    Uygulama adınıza ve gereksinimlerinize uyacak şekilde `fly.toml` dosyasını düzenleyin.

    **Güvenlik notu:** Varsayılan yapılandırma herkese açık bir URL açığa çıkarır. Genel IP olmadan güçlendirilmiş bir dağıtım için [Private Deployment](#private-deployment-hardened) bölümüne bakın veya `fly.private.toml` kullanın.

    ```toml
    app = "my-openclaw"  # Uygulama adınız
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

    **Temel ayarlar:**

    | Ayar                           | Neden                                                                      |
    | ------------------------------ | -------------------------------------------------------------------------- |
    | `--bind lan`                   | Fly proxy'sinin gateway'e ulaşabilmesi için `0.0.0.0` üzerine bağlanır     |
    | `--allow-unconfigured`         | Yapılandırma dosyası olmadan başlatır (sonra oluşturacaksınız)             |
    | `internal_port = 3000`         | Fly sağlık denetimleri için `--port 3000` (veya `OPENCLAW_GATEWAY_PORT`) ile eşleşmelidir |
    | `memory = "2048mb"`            | 512MB çok küçüktür; 2GB önerilir                                           |
    | `OPENCLAW_STATE_DIR = "/data"` | Durumu volume üzerinde kalıcı hale getirir                                 |

  </Step>

  <Step title="Secrets ayarlayın">
    ```bash
    # Gerekli: Gateway token'ı (loopback olmayan bağlama için)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Model sağlayıcısı API anahtarları
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # İsteğe bağlı: Diğer sağlayıcılar
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Kanal token'ları
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **Notlar:**

    - Loopback olmayan bağlamalar (`--bind lan`) geçerli bir gateway kimlik doğrulama yolu gerektirir. Bu Fly.io örneği `OPENCLAW_GATEWAY_TOKEN` kullanır, ancak `gateway.auth.password` veya doğru yapılandırılmış loopback olmayan bir `trusted-proxy` dağıtımı da bu gereksinimi karşılar.
    - Bu token'lara parola gibi davranın.
    - Tüm API anahtarları ve token'lar için **yapılandırma dosyası yerine ortam değişkenlerini tercih edin**. Bu, secrets'ların yanlışlıkla açığa çıkabilecekleri veya günlüğe yazılabilecekleri `openclaw.json` dışında kalmasını sağlar.

  </Step>

  <Step title="Dağıtın">
    ```bash
    fly deploy
    ```

    İlk dağıtım Docker imajını oluşturur (~2-3 dakika). Sonraki dağıtımlar daha hızlıdır.

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

  <Step title="Yapılandırma dosyasını oluşturun">
    Uygun bir yapılandırma oluşturmak için makineye SSH ile bağlanın:

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
        "bind": "auto"
      },
      "meta": {}
    }
    EOF
    ```

    **Not:** `OPENCLAW_STATE_DIR=/data` ile yapılandırma yolu `/data/openclaw.json` olur.

    **Not:** Discord token'ı şu iki kaynaktan birinden gelebilir:

    - Ortam değişkeni: `DISCORD_BOT_TOKEN` (secrets için önerilir)
    - Yapılandırma dosyası: `channels.discord.token`

    Ortam değişkeni kullanıyorsanız token'ı yapılandırmaya eklemeniz gerekmez. Gateway `DISCORD_BOT_TOKEN` değerini otomatik olarak okur.

    Uygulamak için yeniden başlatın:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Gateway'e erişin">
    ### Kontrol UI

    Tarayıcıda açın:

    ```bash
    fly open
    ```

    Veya `https://my-openclaw.fly.dev/` adresini ziyaret edin

    Yapılandırılmış paylaşılan gizli anahtarla kimlik doğrulaması yapın. Bu kılavuz `OPENCLAW_GATEWAY_TOKEN` içindeki gateway token'ını kullanır; parola kimlik doğrulamasına geçtiyseniz bunun yerine o parolayı kullanın.

    ### Günlükler

    ```bash
    fly logs              # Canlı günlükler
    fly logs --no-tail    # Son günlükler
    ```

    ### SSH Konsolu

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Sorun giderme

### "App is not listening on expected address"

Gateway `0.0.0.0` yerine `127.0.0.1` üzerine bağlanıyor.

**Düzeltme:** `fly.toml` içindeki süreç komutunuza `--bind lan` ekleyin.

### Sağlık denetimleri başarısız / bağlantı reddedildi

Fly yapılandırılmış portta gateway'e ulaşamıyor.

**Düzeltme:** `internal_port` değerinin gateway portuyla eşleştiğinden emin olun (`--port 3000` veya `OPENCLAW_GATEWAY_PORT=3000` ayarlayın).

### OOM / Bellek sorunları

Kapsayıcı sürekli yeniden başlıyor veya sonlandırılıyor. İşaretler: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` veya sessiz yeniden başlatmalar.

**Düzeltme:** `fly.toml` içinde belleği artırın:

```toml
[[vm]]
  memory = "2048mb"
```

Veya mevcut bir makineyi güncelleyin:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Not:** 512MB çok küçüktür. 1GB çalışabilir ama yük altında veya ayrıntılı günlüklemeyle OOM olabilir. **2GB önerilir.**

### Gateway kilit sorunları

Gateway "already running" hatalarıyla başlamayı reddediyor.

Bu, kapsayıcı yeniden başlarken PID kilit dosyasının volume üzerinde kalması durumunda olur.

**Düzeltme:** Kilit dosyasını silin:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

Kilit dosyası `/data/gateway.*.lock` konumundadır (bir alt dizinde değil).

### Yapılandırma okunmuyor

`--allow-unconfigured` yalnızca başlangıç korumasını atlar. `/data/openclaw.json` oluşturmaz veya onarmaz, bu nedenle gerçek yapılandırmanızın mevcut olduğundan ve normal bir yerel gateway başlangıcı istediğinizde `gateway.mode="local"` içerdiğinden emin olun.

Yapılandırmanın var olduğunu doğrulayın:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Yapılandırmayı SSH ile yazma

`fly ssh console -C` komutu kabuk yönlendirmesini desteklemez. Bir yapılandırma dosyası yazmak için:

```bash
# echo + tee kullanın (yerelden uzağa borulayın)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Veya sftp kullanın
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Not:** Dosya zaten varsa `fly sftp` başarısız olabilir. Önce silin:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Durum kalıcı olmuyor

Yeniden başlatmadan sonra kimlik doğrulama profillerini, kanal/sağlayıcı durumunu veya oturumları kaybediyorsanız,
durum dizini kapsayıcı dosya sistemine yazıyor demektir.

**Düzeltme:** `fly.toml` içinde `OPENCLAW_STATE_DIR=/data` ayarlı olduğundan emin olun ve yeniden dağıtın.

## Güncellemeler

```bash
# Son değişiklikleri çekin
git pull

# Yeniden dağıtın
fly deploy

# Sağlığı denetleyin
fly status
fly logs
```

### Makine komutunu güncelleme

Tam yeniden dağıtım olmadan başlangıç komutunu değiştirmeniz gerekirse:

```bash
# Makine kimliğini alın
fly machines list

# Komutu güncelleyin
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Veya bellek artışıyla
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Not:** `fly deploy` sonrasında makine komutu `fly.toml` içindekine sıfırlanabilir. Elle değişiklik yaptıysanız bunları dağıtımdan sonra yeniden uygulayın.

## Özel Dağıtım (Güçlendirilmiş)

Varsayılan olarak Fly herkese açık IP'ler ayırır; bu da gateway'inizi `https://your-app.fly.dev` adresinde erişilebilir hale getirir. Bu kullanışlıdır ancak dağıtımınızın internet tarayıcıları (Shodan, Censys vb.) tarafından keşfedilebilir olduğu anlamına gelir.

**Genel açığa çıkma olmadan** güçlendirilmiş bir dağıtım için özel şablonu kullanın.

### Özel dağıtım ne zaman kullanılmalı

- Yalnızca **giden** çağrılar/mesajlar yapıyorsunuz (gelen webhook yok)
- Herhangi bir webhook geri çağrısı için **ngrok veya Tailscale** tünelleri kullanıyorsunuz
- Gateway'e tarayıcı yerine **SSH, proxy veya WireGuard** ile erişiyorsunuz
- Dağıtımın **internet tarayıcılarından gizli** olmasını istiyorsunuz

### Kurulum

Standart yapılandırma yerine `fly.private.toml` kullanın:

```bash
# Özel yapılandırmayla dağıtın
fly deploy -c fly.private.toml
```

Veya mevcut bir dağıtımı dönüştürün:

```bash
# Mevcut IP'leri listeleyin
fly ips list -a my-openclaw

# Genel IP'leri serbest bırakın
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Gelecekteki dağıtımlar genel IP'leri yeniden ayırmasın diye özel yapılandırmaya geçin
# ([http_service] bölümünü kaldırın veya özel şablonla dağıtın)
fly deploy -c fly.private.toml

# Yalnızca özel IPv6 ayırın
fly ips allocate-v6 --private -a my-openclaw
```

Bundan sonra `fly ips list` yalnızca `private` türünde bir IP göstermelidir:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Özel bir dağıtıma erişme

Genel URL olmadığı için şu yöntemlerden birini kullanın:

**Seçenek 1: Yerel proxy (en basit)**

```bash
# Yerel 3000 portunu uygulamaya iletin
fly proxy 3000:3000 -a my-openclaw

# Ardından tarayıcıda http://localhost:3000 açın
```

**Seçenek 2: WireGuard VPN**

```bash
# WireGuard yapılandırmasını oluşturun (bir kez)
fly wireguard create

# WireGuard istemcisine içe aktarın, sonra dahili IPv6 üzerinden erişin
# Örnek: http://[fdaa:x:x:x:x::x]:3000
```

**Seçenek 3: Yalnızca SSH**

```bash
fly ssh console -a my-openclaw
```

### Özel dağıtımda webhook'lar

Genel açığa çıkma olmadan webhook geri çağrılarına (Twilio, Telnyx vb.) ihtiyacınız varsa:

1. **ngrok tüneli** - ngrok'u kapsayıcı içinde veya sidecar olarak çalıştırın
2. **Tailscale Funnel** - belirli yolları Tailscale üzerinden açığa çıkarın
3. **Yalnızca giden** - bazı sağlayıcılar (Twilio) webhook olmadan da giden çağrılar için sorunsuz çalışır

ngrok ile örnek voice-call yapılandırması:

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

ngrok tüneli kapsayıcı içinde çalışır ve Fly uygulamasının kendisini açığa çıkarmadan herkese açık bir webhook URL'si sağlar. Yönlendirilen host başlıklarının kabul edilmesi için `webhookSecurity.allowedHosts` değerini genel tünel host adı olarak ayarlayın.

### Güvenlik avantajları

| Yön               | Genel        | Özel       |
| ----------------- | ------------ | ---------- |
| İnternet tarayıcıları | Keşfedilebilir | Gizli      |
| Doğrudan saldırılar | Mümkün       | Engelli    |
| Kontrol UI erişimi | Tarayıcı     | Proxy/VPN  |
| Webhook teslimi   | Doğrudan     | Tünel üzerinden |

## Notlar

- Fly.io **x86 mimarisi** kullanır (ARM değil)
- Dockerfile her iki mimariyle de uyumludur
- WhatsApp/Telegram başlangıç kurulumu için `fly ssh console` kullanın
- Kalıcı veriler `/data` üzerindeki volume içinde bulunur
- Signal, Java + signal-cli gerektirir; özel bir imaj kullanın ve belleği 2GB+ seviyesinde tutun.

## Maliyet

Önerilen yapılandırmayla (`shared-cpu-2x`, 2GB RAM):

- Kullanıma bağlı olarak ayda ~$10-15
- Ücretsiz katman bir miktar kota içerir

Ayrıntılar için [Fly.io pricing](https://fly.io/docs/about/pricing/) bölümüne bakın.

## Sonraki adımlar

- Mesajlaşma kanallarını ayarlayın: [Channels](/tr/channels)
- Gateway'i yapılandırın: [Gateway configuration](/gateway/configuration)
- OpenClaw'ı güncel tutun: [Updating](/install/updating)

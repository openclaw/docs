---
read_when:
    - OpenClaw'u Fly.io üzerinde dağıtma
    - Fly volume'larını, secret'ları ve ilk çalıştırma yapılandırmasını ayarlama
summary: Kalıcı depolama ve HTTPS ile OpenClaw için adım adım Fly.io dağıtımı
title: Fly.io
x-i18n:
    generated_at: "2026-04-26T11:33:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1fe13cb60aff6ee2159e1008d2af660b689d819d38893e9758c23e1edaf32e22
    source_path: install/fly.md
    workflow: 15
---

# Fly.io Dağıtımı

**Amaç:** [Fly.io](https://fly.io) makinesi üzerinde kalıcı depolama, otomatik HTTPS ve Discord/kanal erişimiyle çalışan bir OpenClaw Gateway.

## Gerekenler

- Yüklü [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Fly.io hesabı (ücretsiz katman yeterlidir)
- Model auth: seçtiğiniz model sağlayıcısı için API anahtarı
- Kanal kimlik bilgileri: Discord bot token'ı, Telegram token'ı vb.

## Yeni başlayanlar için hızlı yol

1. Repo'yu klonlayın → `fly.toml` dosyasını özelleştirin
2. Uygulama + volume oluşturun → secret'ları ayarlayın
3. `fly deploy` ile dağıtın
4. Yapılandırma oluşturmak için SSH ile girin veya Control UI kullanın

<Steps>
  <Step title="Fly uygulamasını oluşturun">
    ```bash
    # Repo'yu klonlayın
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
    `fly.toml` dosyasını uygulama adınıza ve gereksinimlerinize göre düzenleyin.

    **Güvenlik notu:** Varsayılan yapılandırma herkese açık bir URL sunar. Herkese açık IP olmadan güçlendirilmiş bir dağıtım için [Özel Dağıtım](#private-deployment-hardened) bölümüne bakın veya `fly.private.toml` kullanın.

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
    | `--bind lan`                   | Fly'ın proxy'sinin gateway'e ulaşabilmesi için `0.0.0.0` adresine bağlanır |
    | `--allow-unconfigured`         | Yapılandırma dosyası olmadan başlatır (sonra oluşturacaksınız)             |
    | `internal_port = 3000`         | Fly sağlık denetimleri için `--port 3000` (veya `OPENCLAW_GATEWAY_PORT`) ile eşleşmelidir |
    | `memory = "2048mb"`            | 512MB çok küçüktür; 2GB önerilir                                           |
    | `OPENCLAW_STATE_DIR = "/data"` | Durumu volume üzerinde kalıcı yapar                                        |

  </Step>

  <Step title="Secret'ları ayarlayın">
    ```bash
    # Gerekli: Gateway token'ı (loopback dışı bağlama için)
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

    - Loopback dışı bağlamalar (`--bind lan`) geçerli bir gateway auth yolu gerektirir. Bu Fly.io örneği `OPENCLAW_GATEWAY_TOKEN` kullanır, ancak `gateway.auth.password` veya doğru yapılandırılmış loopback dışı `trusted-proxy` dağıtımı da bu gereksinimi karşılar.
    - Bu token'ları parola gibi değerlendirin.
    - Tüm API anahtarları ve token'lar için **yapılandırma dosyası yerine ortam değişkenlerini tercih edin**. Böylece secret'lar yanlışlıkla açığa çıkabilecek veya loglanabilecek `openclaw.json` dosyasının dışında kalır.

  </Step>

  <Step title="Dağıtın">
    ```bash
    fly deploy
    ```

    İlk dağıtım Docker image'ını oluşturur (~2-3 dakika). Sonraki dağıtımlar daha hızlıdır.

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

  <Step title="Yapılandırma dosyası oluşturun">
    Uygun bir yapılandırma oluşturmak için makineye SSH ile girin:

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

    **Not:** `https://my-openclaw.fly.dev` değerini gerçek Fly uygulaması
    origin'iniz ile değiştirin. Gateway başlangıcı, yapılandırma
    var olmadan önce ilk açılışın ilerleyebilmesi için çalışma zamanı
    `--bind` ve `--port` değerlerinden yerel Control UI origin'lerini tohumlar,
    ancak Fly üzerinden tarayıcı erişimi için tam HTTPS origin'in yine de
    `gateway.controlUi.allowedOrigins` içinde listelenmesi gerekir.

    **Not:** Discord token'ı şu kaynaklardan biriyle gelebilir:

    - Ortam değişkeni: `DISCORD_BOT_TOKEN` (secret'lar için önerilir)
    - Yapılandırma dosyası: `channels.discord.token`

    Ortam değişkeni kullanıyorsanız token'ı yapılandırmaya eklemeniz gerekmez. Gateway, `DISCORD_BOT_TOKEN` değerini otomatik olarak okur.

    Uygulamak için yeniden başlatın:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Gateway'e erişin">
    ### Control UI

    Tarayıcıda açın:

    ```bash
    fly open
    ```

    Veya `https://my-openclaw.fly.dev/` adresini ziyaret edin

    Yapılandırılmış paylaşımlı secret ile kimlik doğrulayın. Bu kılavuz
    `OPENCLAW_GATEWAY_TOKEN` içindeki gateway token'ını kullanır; parola auth'una geçtiyseniz
    onun yerine o parolayı kullanın.

    ### Loglar

    ```bash
    fly logs              # Canlı loglar
    fly logs --no-tail    # Son loglar
    ```

    ### SSH Konsolu

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Sorun giderme

### "App is not listening on expected address"

Gateway `0.0.0.0` yerine `127.0.0.1` adresine bağlanıyor.

**Düzeltme:** `fly.toml` içindeki process komutunuza `--bind lan` ekleyin.

### Health checks failing / connection refused

Fly, yapılandırılmış portta gateway'e ulaşamıyor.

**Düzeltme:** `internal_port` değerinin gateway portuyla eşleştiğinden emin olun (`--port 3000` veya `OPENCLAW_GATEWAY_PORT=3000` ayarlayın).

### OOM / Bellek Sorunları

Konteyner sürekli yeniden başlıyor veya sonlandırılıyor. Belirtiler: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` veya sessiz yeniden başlatmalar.

**Düzeltme:** `fly.toml` içinde belleği artırın:

```toml
[[vm]]
  memory = "2048mb"
```

Veya mevcut bir makineyi güncelleyin:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Not:** 512MB çok küçüktür. 1GB çalışabilir ama yük altında veya ayrıntılı loglamayla OOM olabilir. **2GB önerilir.**

### Gateway Kilit Sorunları

Gateway "already running" hatalarıyla başlamayı reddediyor.

Bu, konteyner yeniden başlarken PID kilit dosyasının volume üzerinde kalıcı olması nedeniyle olur.

**Düzeltme:** Kilit dosyasını silin:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

Kilit dosyası `/data/gateway.*.lock` yolundadır (bir alt dizinde değil).

### Yapılandırma Okunmuyor

`--allow-unconfigured` yalnızca başlangıç korumasını atlar. `/data/openclaw.json` dosyasını oluşturmaz veya onarmaz; bu yüzden gerçek yapılandırmanızın var olduğundan ve normal bir yerel gateway başlangıcı istediğinizde `gateway.mode="local"` içerdiğinden emin olun.

Yapılandırmanın var olduğunu doğrulayın:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### SSH ile Yapılandırma Yazma

`fly ssh console -C` komutu shell yönlendirmesini desteklemez. Yapılandırma dosyası yazmak için:

```bash
# echo + tee kullanın (yerelden uzağa pipe)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Veya sftp kullanın
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Not:** Dosya zaten varsa `fly sftp` başarısız olabilir. Önce silin:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Durum Kalıcı Değil

Yeniden başlatmadan sonra auth profillerini, kanal/sağlayıcı durumunu veya oturumları kaybediyorsanız,
durum dizini konteyner dosya sistemine yazıyor demektir.

**Düzeltme:** `OPENCLAW_STATE_DIR=/data` değerinin `fly.toml` içinde ayarlı olduğundan emin olun ve yeniden dağıtın.

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

### Makine Komutunu Güncelleme

Tam yeniden dağıtım olmadan başlangıç komutunu değiştirmeniz gerekirse:

```bash
# Makine kimliğini alın
fly machines list

# Komutu güncelleyin
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Veya bellek artırımıyla
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Not:** `fly deploy` sonrasında makine komutu `fly.toml` içindekine sıfırlanabilir. Elle değişiklik yaptıysanız dağıtımdan sonra yeniden uygulayın.

## Özel Dağıtım (Güçlendirilmiş)

Varsayılan olarak Fly, herkese açık IP'ler ayırır ve gateway'inizi `https://your-app.fly.dev` adresinde erişilebilir yapar. Bu kullanışlıdır ancak dağıtımınızın internet tarayıcıları (Shodan, Censys vb.) tarafından keşfedilebilir olduğu anlamına gelir.

**Herkese açık görünürlüğü olmayan** güçlendirilmiş bir dağıtım için özel şablonu kullanın.

### Özel dağıtım ne zaman kullanılmalı

- Yalnızca **giden** çağrılar/mesajlar yapıyorsanız (gelen Webhook yoksa)
- Herhangi bir Webhook callback'i için **ngrok veya Tailscale** tünelleri kullanıyorsanız
- Gateway'e tarayıcı yerine **SSH, proxy veya WireGuard** ile erişiyorsanız
- Dağıtımınızın **internet tarayıcılarından gizli** olmasını istiyorsanız

### Kurulum

Standart yapılandırma yerine `fly.private.toml` kullanın:

```bash
# Özel yapılandırma ile dağıtın
fly deploy -c fly.private.toml
```

Veya mevcut bir dağıtımı dönüştürün:

```bash
# Geçerli IP'leri listeleyin
fly ips list -a my-openclaw

# Herkese açık IP'leri bırakın
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Gelecekteki dağıtımların herkese açık IP'leri yeniden ayırmaması için özel yapılandırmaya geçin
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

Herkese açık URL olmadığından şu yöntemlerden birini kullanın:

**Seçenek 1: Yerel proxy (en basit)**

```bash
# Yerel 3000 portunu uygulamaya iletin
fly proxy 3000:3000 -a my-openclaw

# Ardından tarayıcıda http://localhost:3000 açın
```

**Seçenek 2: WireGuard VPN**

```bash
# WireGuard yapılandırması oluşturun (tek seferlik)
fly wireguard create

# WireGuard istemcisine içe aktarın, ardından dahili IPv6 ile erişin
# Örnek: http://[fdaa:x:x:x:x::x]:3000
```

**Seçenek 3: Yalnızca SSH**

```bash
fly ssh console -a my-openclaw
```

### Özel dağıtım ile Webhook'lar

Herkese açık görünürlük olmadan Webhook callback'lerine (Twilio, Telnyx vb.) ihtiyacınız varsa:

1. **ngrok tüneli** - ngrok'u konteyner içinde veya sidecar olarak çalıştırın
2. **Tailscale Funnel** - belirli yolları Tailscale üzerinden açığa çıkarın
3. **Yalnızca giden** - bazı sağlayıcılar (Twilio) Webhook olmadan yalnızca giden çağrılarda sorunsuz çalışır

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

ngrok tüneli konteyner içinde çalışır ve Fly uygulamasının kendisini açığa çıkarmadan herkese açık bir Webhook URL'si sağlar. İletilen host başlıklarının kabul edilmesi için `webhookSecurity.allowedHosts` değerini herkese açık tünel ana makine adına ayarlayın.

### Güvenlik avantajları

| Boyut             | Herkese açık | Özel      |
| ----------------- | ------------ | --------- |
| İnternet tarayıcıları | Keşfedilebilir | Gizli     |
| Doğrudan saldırılar | Mümkün      | Engelli   |
| Control UI erişimi | Tarayıcı    | Proxy/VPN |
| Webhook teslimi   | Doğrudan     | Tünel üzerinden |

## Notlar

- Fly.io **x86 mimarisi** kullanır (ARM değil)
- Dockerfile her iki mimariyle de uyumludur
- WhatsApp/Telegram onboarding için `fly ssh console` kullanın
- Kalıcı veriler volume üzerinde `/data` içinde bulunur
- Signal, Java + signal-cli gerektirir; özel bir image kullanın ve belleği 2GB+ seviyesinde tutun.

## Maliyet

Önerilen yapılandırma ile (`shared-cpu-2x`, 2GB RAM):

- Kullanıma bağlı olarak yaklaşık aylık `$10-15`
- Ücretsiz katman bir miktar kullanım hakkı içerir

Ayrıntılar için bkz. [Fly.io pricing](https://fly.io/docs/about/pricing/).

## Sonraki adımlar

- Mesajlaşma kanallarını ayarlayın: [Channels](/tr/channels)
- Gateway'i yapılandırın: [Gateway configuration](/tr/gateway/configuration)
- OpenClaw'u güncel tutun: [Updating](/tr/install/updating)

## İlgili

- [Install overview](/tr/install)
- [Hetzner](/tr/install/hetzner)
- [Docker](/tr/install/docker)
- [VPS hosting](/tr/vps)

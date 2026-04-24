---
read_when:
    - OpenClaw’ı Fly.io üzerinde dağıtma
    - Fly volume’lerini, gizli bilgileri ve ilk çalıştırma yapılandırmasını ayarlama
summary: OpenClaw için kalıcı depolama ve HTTPS ile adım adım Fly.io dağıtımı
title: Fly.io
x-i18n:
    generated_at: "2026-04-24T09:15:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8913b6917c23de69865c57ec6a455f3e615bc65b09334edec0a3fe8ff69cf503
    source_path: install/fly.md
    workflow: 15
---

# Fly.io Dağıtımı

**Hedef:** OpenClaw Gateway’in [Fly.io](https://fly.io) makinesinde kalıcı depolama, otomatik HTTPS ve Discord/kanal erişimi ile çalışması.

## Gerekenler

- Kurulu [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Fly.io hesabı (ücretsiz katman yeterlidir)
- Model kimlik doğrulaması: seçtiğiniz model sağlayıcısı için API anahtarı
- Kanal kimlik bilgileri: Discord bot token’ı, Telegram token’ı vb.

## Başlangıç için hızlı yol

1. Depoyu klonlayın → `fly.toml` dosyasını özelleştirin
2. Uygulama + volume oluşturun → gizli bilgileri ayarlayın
3. `fly deploy` ile dağıtın
4. Yapılandırma oluşturmak için SSH ile bağlanın veya Control UI kullanın

<Steps>
  <Step title="Fly uygulamasını oluşturun">
    ```bash
    # Depoyu klonla
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Yeni bir Fly uygulaması oluştur (kendi adınızı seçin)
    fly apps create my-openclaw

    # Kalıcı bir volume oluştur (genellikle 1GB yeterlidir)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **İpucu:** Size yakın bir bölge seçin. Yaygın seçenekler: `lhr` (Londra), `iad` (Virginia), `sjc` (San Jose).

  </Step>

  <Step title="fly.toml dosyasını yapılandırın">
    `fly.toml` dosyasını uygulama adınıza ve gereksinimlerinize göre düzenleyin.

    **Güvenlik notu:** Varsayılan yapılandırma herkese açık bir URL sunar. Genel IP olmadan sağlamlaştırılmış bir dağıtım için [Özel Dağıtım](#private-deployment-hardened) bölümüne bakın veya `fly.private.toml` kullanın.

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

    | Ayar                           | Neden                                                                       |
    | ------------------------------ | ---------------------------------------------------------------------------- |
    | `--bind lan`                   | Gateway’i Fly proxy’sinin erişebilmesi için `0.0.0.0` adresine bağlar       |
    | `--allow-unconfigured`         | Yapılandırma dosyası olmadan başlatır (sonra siz oluşturacaksınız)           |
    | `internal_port = 3000`         | Fly sağlık denetimleri için `--port 3000` (veya `OPENCLAW_GATEWAY_PORT`) ile eşleşmelidir |
    | `memory = "2048mb"`            | 512MB çok küçüktür; 2GB önerilir                                             |
    | `OPENCLAW_STATE_DIR = "/data"` | Durumu volume üzerinde kalıcılaştırır                                        |

  </Step>

  <Step title="Gizli bilgileri ayarlayın">
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

    - Loopback dışı bağlamalar (`--bind lan`) geçerli bir Gateway kimlik doğrulama yolu gerektirir. Bu Fly.io örneği `OPENCLAW_GATEWAY_TOKEN` kullanır, ancak `gateway.auth.password` veya doğru yapılandırılmış loopback dışı `trusted-proxy` dağıtımı da gereksinimi karşılar.
    - Bu token’ları parola gibi değerlendirin.
    - Tüm API anahtarları ve token’lar için **yapılandırma dosyası yerine ortam değişkenlerini tercih edin**. Bu, gizli bilgileri yanlışlıkla açığa çıkabilecek veya günlüğe yazılabilecek `openclaw.json` dışında tutar.

  </Step>

  <Step title="Dağıtın">
    ```bash
    fly deploy
    ```

    İlk dağıtım Docker kalıbını oluşturur (~2-3 dakika). Sonraki dağıtımlar daha hızlıdır.

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

    **Not:** Discord token’ı şu kaynaklardan biriyle gelebilir:

    - Ortam değişkeni: `DISCORD_BOT_TOKEN` (gizli bilgiler için önerilir)
    - Yapılandırma dosyası: `channels.discord.token`

    Ortam değişkeni kullanıyorsanız token’ı yapılandırmaya eklemeniz gerekmez. Gateway `DISCORD_BOT_TOKEN` değerini otomatik olarak okur.

    Uygulamak için yeniden başlatın:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Gateway’e erişin">
    ### Control UI

    Tarayıcıda açın:

    ```bash
    fly open
    ```

    Veya `https://my-openclaw.fly.dev/` adresini ziyaret edin

    Yapılandırılmış paylaşılan gizli bilgi ile kimlik doğrulayın. Bu kılavuz
    `OPENCLAW_GATEWAY_TOKEN` içindeki Gateway token’ını kullanır; parola kimlik doğrulamasına geçtiyseniz
    onun yerine bu parolayı kullanın.

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

Gateway, `0.0.0.0` yerine `127.0.0.1` adresine bağlanıyor.

**Düzeltme:** `fly.toml` içindeki süreç komutunuza `--bind lan` ekleyin.

### Sağlık denetimleri başarısız / bağlantı reddedildi

Fly, yapılandırılmış portta Gateway’e ulaşamıyor.

**Düzeltme:** `internal_port` değerinin Gateway portuyla eşleştiğinden emin olun (`--port 3000` veya `OPENCLAW_GATEWAY_PORT=3000` ayarlayın).

### OOM / Bellek sorunları

Kapsayıcı yeniden başlatılmaya devam ediyor veya öldürülüyor. Belirtiler: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` veya sessiz yeniden başlatmalar.

**Düzeltme:** `fly.toml` içinde belleği artırın:

```toml
[[vm]]
  memory = "2048mb"
```

Veya mevcut bir makineyi güncelleyin:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Not:** 512MB çok küçüktür. 1GB çalışabilir ama yük altında veya ayrıntılı günlüklemede OOM olabilir. **2GB önerilir.**

### Gateway kilit sorunları

Gateway "already running" hatalarıyla başlamayı reddediyor.

Bu, kapsayıcı yeniden başlatıldığında ama PID kilit dosyası volume üzerinde kaldığında olur.

**Düzeltme:** Kilit dosyasını silin:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

Kilit dosyası `/data/gateway.*.lock` konumundadır (bir alt dizinde değil).

### Yapılandırma okunmuyor

`--allow-unconfigured` yalnızca başlangıç korumasını atlar. `/data/openclaw.json` dosyasını oluşturmaz veya onarmaz; bu yüzden gerçek yapılandırmanızın var olduğundan ve normal bir yerel Gateway başlangıcı istediğinizde `gateway.mode="local"` içerdiğinden emin olun.

Yapılandırmanın var olduğunu doğrulayın:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### SSH ile yapılandırma yazma

`fly ssh console -C` komutu kabuk yönlendirmesini desteklemez. Yapılandırma dosyası yazmak için:

```bash
# echo + tee kullan (yerelden uzağa borula)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Veya sftp kullan
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Not:** `fly sftp`, dosya zaten varsa başarısız olabilir. Önce silin:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Durum kalıcı değil

Yeniden başlatmadan sonra kimlik doğrulama profillerini, kanal/sağlayıcı durumunu veya oturumları kaybediyorsanız
durum dizini kapsayıcı dosya sistemine yazıyor demektir.

**Düzeltme:** `fly.toml` içinde `OPENCLAW_STATE_DIR=/data` ayarlı olduğundan emin olun ve yeniden dağıtın.

## Güncellemeler

```bash
# Son değişiklikleri çek
git pull

# Yeniden dağıt
fly deploy

# Sağlığı kontrol et
fly status
fly logs
```

### Makine komutunu güncelleme

Tam yeniden dağıtım olmadan başlangıç komutunu değiştirmeniz gerekirse:

```bash
# Makine kimliğini al
fly machines list

# Komutu güncelle
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Veya bellek artırımıyla
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Not:** `fly deploy` sonrasında makine komutu `fly.toml` içindekine sıfırlanabilir. Elle değişiklik yaptıysanız dağıtımdan sonra onları yeniden uygulayın.

## Özel Dağıtım (Sağlamlaştırılmış)

Varsayılan olarak Fly genel IP’ler ayırır, bu da Gateway’inizi `https://your-app.fly.dev` adresinde erişilebilir yapar. Bu kullanışlıdır ancak dağıtımınızın internet tarayıcıları (Shodan, Censys vb.) tarafından bulunabilir olduğu anlamına gelir.

**Genel maruziyet olmadan** sağlamlaştırılmış bir dağıtım için özel şablonu kullanın.

### Özel dağıtım ne zaman kullanılmalı

- Yalnızca **giden** çağrılar/mesajlar yapıyorsanız (gelen Webhook yoksa)
- Herhangi bir Webhook geri çağrısı için **ngrok veya Tailscale** tünelleri kullanıyorsanız
- Gateway’e tarayıcı yerine **SSH, proxy veya WireGuard** ile erişiyorsanız
- Dağıtımın **internet tarayıcılarından gizli** olmasını istiyorsanız

### Kurulum

Standart yapılandırma yerine `fly.private.toml` kullanın:

```bash
# Özel yapılandırmayla dağıt
fly deploy -c fly.private.toml
```

Veya mevcut bir dağıtımı dönüştürün:

```bash
# Geçerli IP'leri listele
fly ips list -a my-openclaw

# Genel IP'leri bırak
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Gelecekteki dağıtımların yeniden genel IP ayırmaması için özel yapılandırmaya geç
# ([http_service] bölümünü kaldırın veya özel şablonla dağıtın)
fly deploy -c fly.private.toml

# Yalnızca özel IPv6 ayır
fly ips allocate-v6 --private -a my-openclaw
```

Bundan sonra `fly ips list`, yalnızca `private` türü bir IP göstermelidir:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Özel dağıtıma erişim

Genel URL olmadığından şu yöntemlerden birini kullanın:

**Seçenek 1: Yerel proxy (en basit)**

```bash
# Yerel 3000 portunu uygulamaya yönlendir
fly proxy 3000:3000 -a my-openclaw

# Ardından tarayıcıda http://localhost:3000 açın
```

**Seçenek 2: WireGuard VPN**

```bash
# WireGuard yapılandırması oluştur (tek seferlik)
fly wireguard create

# WireGuard istemcisine içe aktarın, sonra dahili IPv6 üzerinden erişin
# Örnek: http://[fdaa:x:x:x:x::x]:3000
```

**Seçenek 3: Yalnızca SSH**

```bash
fly ssh console -a my-openclaw
```

### Özel dağıtımda Webhook’lar

Genel maruziyet olmadan Webhook geri çağrılarına (Twilio, Telnyx vb.) ihtiyacınız varsa:

1. **ngrok tüneli** - ngrok’u kapsayıcı içinde veya bir yan taşıyıcı olarak çalıştırın
2. **Tailscale Funnel** - belirli yolları Tailscale üzerinden açığa çıkarın
3. **Yalnızca giden** - bazı sağlayıcılar (Twilio) Webhook olmadan giden çağrılar için gayet iyi çalışır

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

ngrok tüneli kapsayıcı içinde çalışır ve Fly uygulamasını doğrudan açığa çıkarmadan genel bir Webhook URL’si sağlar. Yönlendirilen host üst bilgilerinin kabul edilmesi için `webhookSecurity.allowedHosts` değerini genel tünel ana makine adına ayarlayın.

### Güvenlik avantajları

| Yön               | Genel         | Özel        |
| ----------------- | ------------- | ----------- |
| İnternet tarayıcıları | Keşfedilebilir | Gizli     |
| Doğrudan saldırılar | Mümkün       | Engellenmiş |
| Control UI erişimi | Tarayıcı      | Proxy/VPN   |
| Webhook teslimi   | Doğrudan      | Tünel ile   |

## Notlar

- Fly.io **x86 mimarisi** kullanır (ARM değil)
- Dockerfile her iki mimariyle de uyumludur
- WhatsApp/Telegram onboarding için `fly ssh console` kullanın
- Kalıcı veriler volume üzerinde `/data` konumunda yaşar
- Signal, Java + `signal-cli` gerektirir; özel bir kalıp kullanın ve belleği 2GB+ düzeyinde tutun.

## Maliyet

Önerilen yapılandırmayla (`shared-cpu-2x`, 2GB RAM):

- Kullanıma bağlı olarak ~10-15$/ay
- Ücretsiz katman bir miktar kota içerir

Ayrıntılar için [Fly.io fiyatlandırması](https://fly.io/docs/about/pricing/) sayfasına bakın.

## Sonraki adımlar

- Mesajlaşma kanallarını kurun: [Kanallar](/tr/channels)
- Gateway’i yapılandırın: [Gateway yapılandırması](/tr/gateway/configuration)
- OpenClaw’ı güncel tutun: [Güncelleme](/tr/install/updating)

## İlgili

- [Kuruluma genel bakış](/tr/install)
- [Hetzner](/tr/install/hetzner)
- [Docker](/tr/install/docker)
- [VPS barındırma](/tr/vps)

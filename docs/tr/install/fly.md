---
read_when:
    - OpenClaw'u Fly.io üzerinde dağıtma
    - Fly birimlerini, gizli bilgileri ve ilk çalıştırma yapılandırmasını ayarlama
summary: Kalıcı depolama ve HTTPS ile OpenClaw’ın Fly.io’ya adım adım dağıtımı
title: Fly.io
x-i18n:
    generated_at: "2026-07-12T12:22:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2cb4203cdea9db2fa76ed60de01da67d550a75d538895b06732446d0f70e2f4
    source_path: install/fly.md
    workflow: 16
---

**Amaç:** Kalıcı depolama, otomatik HTTPS ve Discord/kanal erişimiyle bir [Fly.io](https://fly.io) makinesinde çalışan OpenClaw Gateway.

## Gereksinimler

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) yüklü olmalı
- Fly.io hesabı (ücretsiz katman yeterlidir)
- Model kimlik doğrulaması: seçtiğiniz model sağlayıcısı için API anahtarı
- Kanal kimlik bilgileri: Discord bot belirteci, Telegram belirteci vb.

## Yeni başlayanlar için hızlı yol

1. Depoyu klonlayın, `fly.toml` dosyasını özelleştirin
2. Uygulamayı ve birimi oluşturun, gizli değerleri ayarlayın
3. `fly deploy` ile dağıtın
4. Yapılandırmayı oluşturmak için SSH ile bağlanın veya Kontrol Arayüzünü kullanın

<Steps>
  <Step title="Fly uygulamasını oluşturun">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # kendi adınızı seçin
    fly apps create my-openclaw

    # genellikle 1 GB yeterlidir
    fly volumes create openclaw_data --size 1 --region iad
    ```

    Size yakın bir bölge seçin. Yaygın seçenekler: `lhr` (Londra), `iad` (Virginia), `sjc` (San Jose).

  </Step>

  <Step title="fly.toml dosyasını yapılandırın">
    `fly.toml` dosyasını uygulama adınıza ve gereksinimlerinize uyacak şekilde düzenleyin. Depoda izlenen `fly.toml`, aşağıda gösterilen genel şablondur; `deploy/fly.private.toml` ise güçlendirilmiş, genel IP içermeyen çeşittir (bkz. [Özel dağıtım](#private-deployment-hardened)).

    ```toml
    app = "my-openclaw"  # uygulamanızın adı
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

    OpenClaw Docker imajının giriş noktası `tini` olup varsayılan olarak `node openclaw.mjs gateway` çalıştırır. Fly `[processes]`, `ENTRYPOINT` değerine dokunmadan Docker `CMD` değerini değiştirir (burada aynı derlenmiş giriş noktası olan `node dist/index.js gateway ...` komutunu doğrudan çalıştırır); dolayısıyla süreç yine `tini` altında çalışır.

    **Temel ayarlar:**

    | Ayar                           | Nedeni                                                                      |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Fly'ın vekil sunucusunun Gateway'e erişebilmesi için `0.0.0.0` adresine bağlanır |
    | `--allow-unconfigured`         | Yapılandırma dosyası olmadan başlatır (dosyayı daha sonra oluşturursunuz)   |
    | `internal_port = 3000`         | Fly sağlık denetimleri için `--port 3000` (veya `OPENCLAW_GATEWAY_PORT`) ile eşleşmelidir |
    | `memory = "2048mb"`            | 512 MB çok azdır; 2 GB önerilir                                             |
    | `OPENCLAW_STATE_DIR = "/data"` | Durumu birimde kalıcı hâle getirir                                          |

  </Step>

  <Step title="Gizli değerleri ayarlayın">
    ```bash
    # gerekli: loopback olmayan bağlantı için gateway kimlik doğrulama belirteci
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # model sağlayıcısı API anahtarları
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # isteğe bağlı: diğer sağlayıcılar
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # kanal belirteçleri
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    Loopback olmayan bağlantılar (`--bind lan`) geçerli bir Gateway kimlik doğrulama yolu gerektirir. Bu örnekte `OPENCLAW_GATEWAY_TOKEN` kullanılır ancak `gateway.auth.password` veya doğru yapılandırılmış, loopback olmayan güvenilir vekil sunucu dağıtımı da bu gereksinimi karşılar. SecretRef sözleşmesi için [Gizli değer yönetimi](/tr/gateway/secrets) bölümüne bakın.

    Bu belirteçlere parola gibi davranın. Gizli değerlerin `openclaw.json` dosyasına girmemesi için API anahtarları ve belirteçlerde yapılandırma dosyası yerine ortam değişkenlerini/`fly secrets` komutunu tercih edin.

  </Step>

  <Step title="Dağıtın">
    ```bash
    fly deploy
    ```

    İlk dağıtım Docker imajını oluşturur. Dağıtımdan sonra doğrulayın:

    ```bash
    fly status
    fly logs
    ```

    HTTP/WebSocket dinleyicisi çalışmaya başladığında Gateway başlangıç günlüklerine `gateway ready` kaydedilir. Fly'ın kendi sağlık denetimi, `fly.toml` uyarınca `internal_port = 3000` değerini izler; imajın Docker `HEALTHCHECK` yönergesi ayrıca varsayılan 18789 numaralı bağlantı noktasında `/healthz` yolunu yoklar ancak bu dağıtım Gateway'i `--port 3000` ile geçersiz kıldığı için burada kullanılmaz.

  </Step>

  <Step title="Yapılandırma dosyasını oluşturun">
    Uygun bir yapılandırma oluşturmak için makineye SSH ile bağlanın:

    ```bash
    fly ssh console
    ```

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

    `OPENCLAW_STATE_DIR=/data` kullanıldığında yapılandırma yolu `/data/openclaw.json` olur.

    `https://my-openclaw.fly.dev` değerini gerçek Fly uygulamanızın kaynağıyla değiştirin. Gateway başlangıcı, yapılandırma henüz mevcut değilken ilk açılışın devam edebilmesi için çalışma zamanındaki `--bind` ve `--port` değerlerinden yerel Kontrol Arayüzü kaynaklarını oluşturur ancak Fly üzerinden tarayıcı erişimi için yine de tam HTTPS kaynağının `gateway.controlUi.allowedOrigins` içinde listelenmesi gerekir.

    Discord belirteci şu kaynaklardan birinden gelebilir:

    - `DISCORD_BOT_TOKEN` ortam değişkeni (gizli değerler için önerilir); yapılandırmaya eklemeniz gerekmez, Gateway bunu otomatik olarak okur
    - `channels.discord.token` yapılandırma alanı

    Uygulamak için yeniden başlatın:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Gateway'e erişin">
    ### Kontrol Arayüzü

    ```bash
    fly open
    ```

    Alternatif olarak `https://my-openclaw.fly.dev/` adresini ziyaret edin.

    Yapılandırılmış ortak gizli değerle kimlik doğrulaması yapın: `OPENCLAW_GATEWAY_TOKEN` içindeki Gateway belirteci veya parola tabanlı kimlik doğrulamaya geçtiyseniz parolanız.

    ### Günlükler

    ```bash
    fly logs              # canlı günlükler
    fly logs --no-tail    # son günlükler
    ```

    ### SSH konsolu

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Sorun giderme

### "Uygulama beklenen adresi dinlemiyor"

Gateway, `0.0.0.0` yerine `127.0.0.1` adresine bağlanıyor.

**Çözüm:** `fly.toml` içindeki süreç komutunuza `--bind lan` ekleyin.

### Sağlık denetimleri başarısız oluyor / bağlantı reddedildi

Fly, yapılandırılan bağlantı noktasından Gateway'e erişemiyor.

**Çözüm:** `internal_port` değerinin Gateway bağlantı noktasıyla (`--port 3000` veya `OPENCLAW_GATEWAY_PORT=3000`) eşleştiğinden emin olun.

### OOM / bellek sorunları

Kapsayıcı sürekli yeniden başlıyor veya sonlandırılıyor. Belirtiler: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` ya da açıklamasız yeniden başlatmalar.

**Çözüm:** `fly.toml` içindeki belleği artırın:

```toml
[[vm]]
  memory = "2048mb"
```

Veya mevcut bir makineyi güncelleyin:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

512 MB çok azdır. 1 GB çalışabilir ancak yük altında veya ayrıntılı günlük kaydı kullanılırken OOM oluşabilir. 2 GB önerilir.

### Gateway kilidi sorunları

Kapsayıcı yeniden başlatıldıktan sonra Gateway, "zaten çalışıyor" hatalarıyla başlamayı reddediyor.

Tek örnek kilit dosyası kalıcı `/data` biriminde değil, `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock` konumundadır (Linux: `/tmp/openclaw-<uid>/gateway.<hash>.lock`); bu nedenle kapsayıcının tamamen yeniden başlatılması normalde dosyayı kapsayıcı dosya sisteminin geri kalanıyla birlikte temizler. Kilit varlığını sürdürürse (örneğin kapsayıcı dosya sistemini koruyan bir `fly machine restart` sonrasında) ve başlatmayı engellerse kilidi elle kaldırın:

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### Yapılandırma okunmıyor

`--allow-unconfigured` yalnızca başlangıç korumasını atlar. `/data/openclaw.json` dosyasını oluşturmaz veya onarmaz; bu nedenle gerçek yapılandırmanızın mevcut olduğundan ve normal bir yerel Gateway başlangıcı için `"gateway": { "mode": "local" }` içerdiğinden emin olun.

Yapılandırmanın mevcut olduğunu doğrulayın:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Yapılandırmayı SSH üzerinden yazma

`fly ssh console -C`, kabuk yeniden yönlendirmesini desteklemez. Yapılandırma dosyası yazmak için:

```bash
# echo + tee (yerelden uzağa veri aktarın)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# veya sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

Dosya zaten mevcutsa `fly sftp` başarısız olabilir; önce dosyayı silin:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Durum kalıcı değil

Yeniden başlatma sonrasında kimlik doğrulama profillerini, kanal/sağlayıcı durumunu veya oturumları kaybediyorsanız durum dizini birim yerine kapsayıcı dosya sistemine yazılıyor demektir.

**Çözüm:** `fly.toml` içinde `OPENCLAW_STATE_DIR=/data` ayarının bulunduğundan emin olun ve yeniden dağıtın.

## Güncelleme

```bash
git pull
fly deploy
fly status
fly logs
```

Buradaki denetimli yol `git pull` + `fly deploy` birleşimidir: imajı Dockerfile dosyasından yeniden oluşturur; böylece CLI/Gateway sürümü, temel işletim sistemi imajı ve tüm Dockerfile değişiklikleri birlikte güncellenir. Çalışan kapsayıcı içinde `openclaw update` kullanmak aynı işlem değildir çünkü imaj, algılayabileceği bir `.git` çalışma kopyası ve npm tarafından yönetilen genel kurulum olmadan Docker ile oluşturulmuş bir `dist/` ağacı olarak sunulur; sanal makine tarzı kurulumlardaki bu akış için [Güncelleme](/tr/install/updating) bölümüne bakın.

### Makine komutunu güncelleme

Başlangıç komutunu tam bir yeniden dağıtım yapmadan değiştirmek için:

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# veya bellek artışıyla birlikte
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

Daha sonraki bir `fly deploy`, makine komutunu `fly.toml` içindeki değere geri döndürür; yeniden dağıtımdan sonra elle yaptığınız değişiklikleri tekrar uygulayın.

## Özel dağıtım (güçlendirilmiş)

Fly varsayılan olarak genel IP'ler tahsis eder; dolayısıyla Gateway'inize `https://your-app.fly.dev` adresinden erişilebilir ve internet tarayıcıları (Shodan, Censys vb.) tarafından keşfedilebilir.

**Genel IP içermeyen** güçlendirilmiş bir dağıtım için `deploy/fly.private.toml` kullanın: `[http_service]` bölümünü içermediğinden genel giriş tahsis edilmez.

### Özel dağıtım ne zaman kullanılmalı?

- Yalnızca giden çağrılar/mesajlar (gelen Webhook'lar yok)
- Webhook geri çağrılarını ngrok veya Tailscale tünelleri yönetiyorsa
- Gateway erişimi tarayıcı yerine SSH, vekil sunucu veya WireGuard üzerinden sağlanıyorsa
- Dağıtımın internet tarayıcılarından gizlenmesi gerekiyorsa

### Kurulum

```bash
fly deploy -c deploy/fly.private.toml
```

Veya mevcut bir dağıtımı dönüştürün:

```bash
# mevcut IP'leri listeleyin
fly ips list -a my-openclaw

# genel IP'leri serbest bırakın
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# gelecekteki dağıtımların yeniden genel IP tahsis etmemesi için özel yapılandırmaya geçin
fly deploy -c deploy/fly.private.toml

# yalnızca özel IPv6 tahsis edin
fly ips allocate-v6 --private -a my-openclaw
```

Bundan sonra `fly ips list` yalnızca `private` türünde bir IP göstermelidir:

```text
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Özel bir dağıtıma erişme

**Seçenek 1: yerel proxy (en basit)**

```bash
fly proxy 3000:3000 -a my-openclaw
# bir tarayıcıda http://localhost:3000 adresini açın
```

**Seçenek 2: WireGuard VPN**

```bash
fly wireguard create
# bir WireGuard istemcisine içe aktarın, ardından dahili IPv6 üzerinden erişin
# örnek: http://[fdaa:x:x:x:x::x]:3000
```

**Seçenek 3: yalnızca SSH**

```bash
fly ssh console -a my-openclaw
```

### Özel dağıtımda Webhook'lar

Herkese açık erişim olmadan Webhook geri çağrıları (Twilio, Telnyx vb.) için:

1. **ngrok tüneli**: ngrok'u konteynerin içinde veya yardımcı konteyner olarak çalıştırın
2. **Tailscale Funnel**: belirli yolları Tailscale aracılığıyla erişime açın
3. **Yalnızca giden**: bazı sağlayıcılar (Twilio), Webhook olmadan giden aramalar için çalışır

`plugins.entries.voice-call.config` altında ngrok ile örnek sesli arama yapılandırması:

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

ngrok tüneli konteynerin içinde çalışır ve Fly uygulamasının kendisini erişime açmadan herkese açık bir Webhook URL'si sağlar. İletilen ana makine üstbilgilerinin kabul edilmesi için `webhookSecurity.allowedHosts` değerini tünelin ana makine adı olarak ayarlayın.

### Güvenlik açısından ödünleşimler

| Konu              | Herkese açık     | Özel         |
| ----------------- | ---------------- | ------------ |
| İnternet tarayıcıları | Keşfedilebilir | Gizli        |
| Doğrudan saldırılar | Mümkün          | Engellenmiş  |
| Denetim kullanıcı arayüzü erişimi | Tarayıcı | Proxy/VPN |
| Webhook teslimi   | Doğrudan         | Tünel üzerinden |

## Notlar

- Fly.io x86 mimarisini kullanır; Dockerfile hem x86 hem de ARM ile uyumludur.
- WhatsApp/Telegram ilk kurulumu için `fly ssh console` kullanın.
- Kalıcı veriler `/data` konumundaki birimde bulunur.
- Signal, imajda signal-cli (Java tabanlı bir CLI) gerektirir; özel bir imaj kullanın ve belleği 2 GB veya üzerinde tutun.

## Maliyet

Önerilen yapılandırmayla (`shared-cpu-2x`, 2 GB RAM), kullanıma bağlı olarak aylık yaklaşık 10-15 ABD doları maliyet bekleyin; ücretsiz katman temel kullanım kotasının bir bölümünü karşılar. Güncel ücretler için [Fly.io fiyatlandırmasına](https://fly.io/docs/about/pricing/) bakın.

## Sonraki adımlar

- Mesajlaşma kanallarını ayarlayın: [Kanallar](/tr/channels)
- Gateway'i yapılandırın: [Gateway yapılandırması](/tr/gateway/configuration)
- OpenClaw'u güncel tutun: [Güncelleme](/tr/install/updating)

## İlgili

- [Kuruluma genel bakış](/tr/install)
- [Hetzner](/tr/install/hetzner)
- [Docker](/tr/install/docker)
- [VPS barındırma](/tr/vps)

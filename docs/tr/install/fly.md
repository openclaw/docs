---
read_when:
    - OpenClaw'u Fly.io üzerinde dağıtma
    - Fly birimlerini, gizli bilgileri ve ilk çalıştırma yapılandırmasını ayarlama
summary: Kalıcı depolama ve HTTPS ile OpenClaw için adım adım Fly.io dağıtımı
title: Fly.io
x-i18n:
    generated_at: "2026-07-16T17:19:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d2b5119c1df8ee077f4db4f44fa92c6ae0e2bf3c355c2117e0fd39146bb49875
    source_path: install/fly.md
    workflow: 16
---

**Hedef:** Kalıcı depolama, otomatik HTTPS ve Discord/kanal erişimiyle bir [Fly.io](https://fly.io) makinesinde çalışan OpenClaw Gateway.

## Gereksinimler

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) kurulu
- Fly.io hesabı (ücretsiz katman yeterlidir)
- Model kimlik doğrulaması: seçtiğiniz model sağlayıcısının API anahtarı
- Kanal kimlik bilgileri: Discord bot token'ı, Telegram token'ı vb.

## Başlangıç için hızlı yol

1. Depoyu klonlayın, `fly.toml` dosyasını özelleştirin
2. Uygulamayı ve birimi oluşturun, gizli değerleri ayarlayın
3. `fly deploy` ile dağıtın
4. Yapılandırmayı oluşturmak için SSH ile bağlanın veya Control UI'ı kullanın

<Steps>
  <Step title="Fly uygulamasını oluşturun">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # kendi adınızı seçin
    fly apps create my-openclaw

    # 1 GB genellikle yeterlidir
    fly volumes create openclaw_data --size 1 --region iad
    ```

    Size yakın bir bölge seçin. Yaygın seçenekler: `lhr` (Londra), `iad` (Virginia), `sjc` (San Jose).

  </Step>

  <Step title="fly.toml dosyasını yapılandırın">
    `fly.toml` dosyasını uygulama adınıza ve gereksinimlerinize uyacak şekilde düzenleyin. Depoda izlenen `fly.toml`, aşağıda gösterilen genel şablondur; `deploy/fly.private.toml` ise güçlendirilmiş, genel IP içermeyen varyanttır (bkz. [Özel dağıtım](#private-deployment-hardened)).

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

    OpenClaw Docker imajının giriş noktası `tini` olup varsayılan olarak `node openclaw.mjs gateway` çalıştırır. Fly `[processes]`, `ENTRYPOINT` öğesine dokunmadan Docker `CMD` öğesinin yerini alır (burada aynı derlenmiş giriş noktası olan `node dist/index.js gateway ...` doğrudan çalıştırılır); böylece işlem hâlâ `tini` altında çalışır.

    **Temel ayarlar:**

    | Ayar                           | Nedeni                                                                      |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Fly proxy'sinin Gateway'e erişebilmesi için `0.0.0.0` adresine bağlanır     |
    | `--allow-unconfigured`         | Yapılandırma dosyası olmadan başlatır (dosyayı daha sonra oluşturursunuz)   |
    | `internal_port = 3000`         | Fly sistem durumu denetimleri için `--port 3000` (veya `OPENCLAW_GATEWAY_PORT`) ile eşleşmelidir |
    | `memory = "2048mb"`            | 512 MB çok küçüktür; 2 GB önerilir                                          |
    | `OPENCLAW_STATE_DIR = "/data"` | Durumu birimde kalıcı hâle getirir                                          |

  </Step>

  <Step title="Gizli değerleri ayarlayın">
    ```bash
    # gerekli: geri döngü dışı bağlantı için Gateway kimlik doğrulama token'ı
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # model sağlayıcısı API anahtarları
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # isteğe bağlı: diğer sağlayıcılar
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # kanal token'ları
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    Geri döngü dışı bağlantılar (`--bind lan`) geçerli bir Gateway kimlik doğrulama yolu gerektirir. Bu örnekte `OPENCLAW_GATEWAY_TOKEN` kullanılır; ancak `gateway.auth.password` veya doğru yapılandırılmış, geri döngü dışı bir güvenilir proxy dağıtımı da gereksinimi karşılar. SecretRef sözleşmesi için [Gizli değer yönetimi](/tr/gateway/secrets) bölümüne bakın.

    Bu token'ları parola gibi koruyun. Gizli değerlerin `openclaw.json` dışında kalması için API anahtarları ve token'larda yapılandırma dosyası yerine ortam değişkenlerini/`fly secrets` tercih edin.

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

    HTTP/WebSocket dinleyicisi hazır olduğunda Gateway başlangıç günlüklerine `gateway ready` kaydedilir. Fly'ın kendi sistem durumu denetimi, `fly.toml` uyarınca `internal_port = 3000` öğesini izler; imajın Docker `HEALTHCHECK` yönergesi ayrıca varsayılan 18789 portunda `/healthz` öğesini yoklar. Bu dağıtım Gateway'i `--port 3000` olarak geçersiz kıldığı için bu port burada kullanılmaz.

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

    `https://my-openclaw.fly.dev` öğesini gerçek Fly uygulama kaynağınızla değiştirin. Gateway başlangıcı, ilk önyüklemenin yapılandırma mevcut olmadan ilerleyebilmesi için yerel Control UI kaynaklarını çalışma zamanı `--bind` ve `--port` değerlerinden oluşturur; ancak Fly üzerinden tarayıcı erişimi için yine de `gateway.controlUi.allowedOrigins` içinde tam HTTPS kaynağının listelenmesi gerekir.

    Discord token'ı şu iki kaynaktan birinden alınabilir:

    - Ortam değişkeni `DISCORD_BOT_TOKEN` (gizli değerler için önerilir); yapılandırmaya eklemeniz gerekmez, Gateway bunu otomatik olarak okur
    - Yapılandırma dosyası `channels.discord.token`

    Uygulamak için yeniden başlatın:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Gateway'e erişin">
    ### Control UI

    ```bash
    fly open
    ```

    Alternatif olarak `https://my-openclaw.fly.dev/` adresini ziyaret edin.

    Yapılandırılmış paylaşılan gizli değerle kimlik doğrulaması yapın: `OPENCLAW_GATEWAY_TOKEN` içindeki Gateway token'ı veya parola kimlik doğrulamasına geçtiyseniz parolanız.

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

### "Uygulama beklenen adreste dinlemiyor"

Gateway, `0.0.0.0` yerine `127.0.0.1` adresine bağlanıyor.

**Düzeltme:** `fly.toml` içindeki işlem komutunuza `--bind lan` ekleyin.

### Sistem durumu denetimleri başarısız oluyor / bağlantı reddediliyor

Fly, yapılandırılan port üzerinden Gateway'e erişemiyor.

**Düzeltme:** `internal_port` öğesinin Gateway portuyla (`--port 3000` veya `OPENCLAW_GATEWAY_PORT=3000`) eşleştiğinden emin olun.

### OOM / bellek sorunları

Kapsayıcı sürekli yeniden başlıyor veya sonlandırılıyor. Belirtiler: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` veya sessiz yeniden başlatmalar.

**Düzeltme:** `fly.toml` içindeki belleği artırın:

```toml
[[vm]]
  memory = "2048mb"
```

Alternatif olarak mevcut bir makineyi güncelleyin:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

512 MB çok küçüktür. 1 GB çalışabilir ancak yük altında veya ayrıntılı günlük kaydı kullanılırken OOM oluşabilir. 2 GB önerilir.

### Gateway kilidi sorunları

Gateway, kapsayıcı yeniden başlatıldıktan sonra "zaten çalışıyor" hatalarıyla başlamayı reddediyor.

Çalışma zamanı kilit dosyaları kalıcı `/data` biriminde değil, `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock`
ve `gateway.state.<hash>.lock` (Linux:
`/tmp/openclaw-<uid>/gateway.*.lock`) konumlarında bulunduğundan tam bir kapsayıcı yeniden başlatması
normalde bu dosyaları kapsayıcı dosya sisteminin geri kalanıyla birlikte temizler.
Bir kilit varlığını sürdürürse (örneğin kapsayıcı dosya sistemini koruyan bir
`fly machine restart`) ve başlangıcı engellerse kilidi elle kaldırın:

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### Yapılandırma okunmuyor

`--allow-unconfigured` yalnızca başlangıç korumasını atlar. `/data/openclaw.json` öğesini oluşturmaz veya onarmaz; bu nedenle gerçek yapılandırmanızın mevcut olduğundan ve normal bir yerel Gateway başlangıcı için `"gateway": { "mode": "local" }` içerdiğinden emin olun.

Yapılandırmanın mevcut olduğunu doğrulayın:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Yapılandırmayı SSH üzerinden yazma

`fly ssh console -C` kabuk yönlendirmesini desteklemez. Bir yapılandırma dosyası yazmak için:

```bash
# echo + tee (yerelden uzak sisteme aktarım)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# veya sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

Dosya zaten mevcutsa `fly sftp` başarısız olabilir; önce dosyayı silin:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Durum kalıcı olmuyor

Yeniden başlatmadan sonra kimlik doğrulama profillerini, kanal/sağlayıcı durumunu veya oturumları kaybediyorsanız durum dizini birim yerine kapsayıcı dosya sistemine yazılıyor demektir.

**Düzeltme:** `OPENCLAW_STATE_DIR=/data` öğesinin `fly.toml` içinde ayarlandığından emin olun ve yeniden dağıtın.

## Güncelleme

```bash
git pull
fly deploy
fly status
fly logs
```

Burada denetimli yol `git pull` + `fly deploy` şeklindedir: imajı Dockerfile'dan yeniden oluşturur; dolayısıyla CLI/Gateway sürümü, temel işletim sistemi imajı ve tüm Dockerfile değişiklikleri birlikte güncellenir. Çalışan kapsayıcının içindeki `openclaw update` aynı işlem değildir; çünkü imaj, algılayabileceği bir `.git` çalışma kopyası ve npm tarafından yönetilen genel bir kurulum bulunmayan, Docker ile oluşturulmuş bir `dist/` ağacı olarak sunulur. VM tarzı kurulumlardaki bu akış için [Güncelleme](/tr/install/updating) bölümüne bakın.

### Makine komutunu güncelleme

Başlangıç komutunu tam bir yeniden dağıtım yapmadan değiştirmek için:

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# veya bellek artışıyla
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

Daha sonraki bir `fly deploy`, makine komutunu `fly.toml` içinde bulunan değere sıfırlar; elle yapılan değişiklikleri yeniden dağıtımdan sonra tekrar uygulayın.

## Özel dağıtım (güçlendirilmiş)

Fly varsayılan olarak genel IP'ler tahsis eder; bu nedenle Gateway'inize `https://your-app.fly.dev` üzerinden erişilebilir ve internet tarayıcıları (Shodan, Censys vb.) tarafından keşfedilebilir.

**Genel IP olmadan** güçlendirilmiş bir dağıtım için `deploy/fly.private.toml` kullanın: `[http_service]` öğesini içermediğinden genel gelen trafik erişimi tahsis edilmez.

### Özel dağıtım ne zaman kullanılmalı?

- Yalnızca giden çağrılar/mesajlar (gelen Webhook yok)
- Tüm Webhook geri çağrılarını ngrok veya Tailscale tünelleri yönetir
- Gateway erişimi tarayıcı yerine SSH, proxy veya WireGuard üzerinden sağlanır
- Dağıtım internet tarayıcılarından gizlenmelidir

### Kurulum

```bash
fly deploy -c deploy/fly.private.toml
```

Alternatif olarak mevcut bir dağıtımı dönüştürün:

```bash
# mevcut IP'leri listele
fly ips list -a my-openclaw

# genel IP'leri serbest bırak
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# gelecekteki dağıtımların genel IP'leri yeniden tahsis etmemesi için özel yapılandırmaya geç
fly deploy -c deploy/fly.private.toml

# yalnızca özel IPv6 tahsis et
fly ips allocate-v6 --private -a my-openclaw
```

Bundan sonra, `fly ips list` yalnızca `private` türünde bir IP göstermelidir:

```text
SÜRÜM    IP                   TÜR              BÖLGE
v6       fdaa:x:x:x:x::x      özel             genel
```

### Özel bir dağıtıma erişme

**Seçenek 1: yerel proxy (en basit)**

```bash
fly proxy 3000:3000 -a my-openclaw
# bir tarayıcıda http://localhost:3000 adresini aç
```

**Seçenek 2: WireGuard VPN**

```bash
fly wireguard create
# bir WireGuard istemcisine içe aktar, ardından dahili IPv6 üzerinden eriş
# örnek: http://[fdaa:x:x:x:x::x]:3000
```

**Seçenek 3: yalnızca SSH**

```bash
fly ssh console -a my-openclaw
```

### Özel dağıtımla Webhook'lar

Genel erişime açmadan Webhook geri çağrıları (Twilio, Telnyx vb.) için:

1. **ngrok tüneli**: ngrok'u konteynerin içinde veya bir yardımcı konteyner olarak çalıştırın
2. **Tailscale Funnel**: belirli yolları Tailscale aracılığıyla erişime açın
3. **Yalnızca giden**: bazı sağlayıcılar (Twilio), Webhook'lar olmadan giden çağrılar için çalışır

`plugins.entries.voice-call.config` altında ngrok kullanılan örnek sesli arama yapılandırması:

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

ngrok tüneli konteynerin içinde çalışır ve Fly uygulamasını erişime açmadan genel bir Webhook URL'si sağlar. İletilen ana makine üstbilgilerinin kabul edilmesi için `webhookSecurity.allowedHosts` değerini tünel ana makine adına ayarlayın.

### Güvenlik ödünleşimleri

| Unsur                 | Genel         | Özel          |
| --------------------- | ------------- | ------------- |
| İnternet tarayıcıları | Keşfedilebilir | Gizli         |
| Doğrudan saldırılar   | Mümkün        | Engellenmiş   |
| Kontrol arayüzü erişimi | Tarayıcı    | Proxy/VPN     |
| Webhook teslimatı     | Doğrudan      | Tünel üzerinden |

## Notlar

- Fly.io x86 mimarisini kullanır; Dockerfile hem x86 hem de ARM ile uyumludur.
- WhatsApp/Telegram ilk kurulumu için `fly ssh console` kullanın.
- Kalıcı veriler, `/data` konumundaki birimde bulunur.
- Signal, imajda signal-cli (Java tabanlı bir CLI) gerektirir; özel bir imaj kullanın ve belleği 2GB+ düzeyinde tutun.

## Maliyet

Önerilen yapılandırmayla (`shared-cpu-2x`, 2GB RAM) kullanıma bağlı olarak ayda yaklaşık $10-15 maliyet bekleyin; ücretsiz katman temel kullanım kotasının bir kısmını karşılar. Güncel fiyatlar için [Fly.io fiyatlandırmasına](https://fly.io/docs/about/pricing/) bakın.

## Sonraki adımlar

- Mesajlaşma kanallarını ayarlayın: [Kanallar](/tr/channels)
- Gateway'i yapılandırın: [Gateway yapılandırması](/tr/gateway/configuration)
- OpenClaw'ı güncel tutun: [Güncelleme](/tr/install/updating)

## İlgili

- [Kuruluma genel bakış](/tr/install)
- [Hetzner](/tr/install/hetzner)
- [Docker](/tr/install/docker)
- [VPS barındırma](/tr/vps)

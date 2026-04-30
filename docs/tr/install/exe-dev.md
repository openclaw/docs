---
read_when:
    - Gateway için ucuz, her zaman açık bir Linux sunucusu istiyorsunuz
    - Kendi VPS’inizi çalıştırmadan uzaktan Kontrol Arayüzü erişimi istiyorsunuz
summary: Uzaktan erişim için OpenClaw Gateway'i exe.dev üzerinde çalıştırın (VM + HTTPS proxy)
title: exe.dev
x-i18n:
    generated_at: "2026-04-30T09:29:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: b571f9b29bb2cca0f311db4188c922b2f70ee91cb48b233cf9922e57a7f05340
    source_path: install/exe-dev.md
    workflow: 16
---

Hedef: OpenClaw Gateway'in bir exe.dev VM üzerinde çalışması ve dizüstü bilgisayarınızdan şu adres üzerinden erişilebilir olması: `https://<vm-name>.exe.xyz`

Bu sayfa, exe.dev'in varsayılan **exeuntu** imajını varsayar. Farklı bir dağıtım seçtiyseniz, paketleri buna göre eşleyin.

## Yeni başlayanlar için hızlı yol

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. Gerektiğinde kimlik doğrulama anahtarınızı/token'ınızı girin
3. VM'inizin yanındaki "Ajan" düğmesine tıklayın ve Shelley'nin provizyonu tamamlamasını bekleyin
4. `https://<vm-name>.exe.xyz/` adresini açın ve yapılandırılmış paylaşılan gizli değerle kimlik doğrulaması yapın (bu kılavuz varsayılan olarak token kimlik doğrulamasını kullanır, ancak `gateway.auth.mode` değerini değiştirirseniz parola kimlik doğrulaması da çalışır)
5. Bekleyen cihaz eşleştirme isteklerini `openclaw devices approve <requestId>` ile onaylayın

## Gerekenler

- exe.dev hesabı
- [exe.dev](https://exe.dev) sanal makinelerine `ssh exe.dev` erişimi (isteğe bağlı)

## Shelley ile otomatik kurulum

Shelley, [exe.dev](https://exe.dev)'in ajanı, istemimizle OpenClaw'ı anında kurabilir.
Kullanılan istem aşağıdaki gibidir:

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## Manuel kurulum

## 1) VM'i oluşturun

Cihazınızdan:

```bash
ssh exe.dev new
```

Ardından bağlanın:

```bash
ssh <vm-name>.exe.xyz
```

<Tip>
Bu VM'i **durum bilgili** tutun. OpenClaw, `openclaw.json`, ajan başına `auth-profiles.json`, oturumlar ve kanal/sağlayıcı durumunu `~/.openclaw/` altında, çalışma alanını ise `~/.openclaw/workspace/` altında saklar.
</Tip>

## 2) Önkoşulları kurun (VM üzerinde)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) OpenClaw'ı kurun

OpenClaw kurulum betiğini çalıştırın:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) OpenClaw'ı 8000 numaralı bağlantı noktasına proxy'lemek için nginx'i ayarlayın

`/etc/nginx/sites-enabled/default` dosyasını şu içerikle düzenleyin

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 8000;
    listen [::]:8000;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings for long-lived connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

İstemci tarafından sağlanan zincirleri korumak yerine yönlendirme başlıklarının üzerine yazın.
OpenClaw, yönlendirilen IP meta verilerine yalnızca açıkça yapılandırılmış proxy'lerden geldiğinde güvenir
ve ekleme tarzı `X-Forwarded-For` zincirleri sertleştirme riski olarak değerlendirilir.

## 5) OpenClaw'a erişin ve ayrıcalıkları verin

`https://<vm-name>.exe.xyz/` adresine erişin (onboarding çıktısındaki Kontrol UI çıktısına bakın). Kimlik doğrulaması isterse, VM'den yapılandırılmış paylaşılan gizli değeri yapıştırın. Bu kılavuz token kimlik doğrulamasını kullanır, bu yüzden `gateway.auth.token`
değerini `openclaw config get gateway.auth.token` ile alın (veya `openclaw doctor --generate-gateway-token` ile bir tane oluşturun).
Gateway'i parola kimlik doğrulamasına değiştirdiyseniz bunun yerine `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` kullanın.
Cihazları `openclaw devices list` ve `openclaw devices approve <requestId>` ile onaylayın. Emin değilseniz, tarayıcınızdan Shelley'yi kullanın!

## Uzak kanal kurulumu

Uzak ana makineler için, `config set` için çok sayıda SSH çağrısı yapmak yerine tek bir `config patch` çağrısını tercih edin. Gerçek token'ları VM ortamında veya `~/.openclaw/.env` içinde tutun ve `openclaw.json` içine yalnızca SecretRefs koyun.

VM üzerinde, servis ortamının ihtiyaç duyduğu gizli değerleri içerdiğinden emin olun:

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

Yerel makinenizden bir yama dosyası oluşturun ve VM'e aktarın:

```json5
// openclaw.remote.patch.json5
{
  secrets: {
    providers: {
      default: { source: "env" },
    },
  },
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
      },
    },
  },
}
```

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --dry-run' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw gateway restart && openclaw health'
```

İç içe bir izin listesinin tam olarak yama değeri olması gerektiğinde, örneğin bir Discord kanal izin listesini değiştirirken `--replace-path` kullanın:

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

## Uzak erişim

Uzak erişim, [exe.dev](https://exe.dev)'in kimlik doğrulaması tarafından yönetilir. Varsayılan olarak, 8000 numaralı bağlantı noktasından gelen HTTP trafiği e-posta kimlik doğrulamasıyla `https://<vm-name>.exe.xyz` adresine yönlendirilir.

## Güncelleme

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

Kılavuz: [Güncelleme](/tr/install/updating)

## İlgili

- [Uzak Gateway](/tr/gateway/remote)
- [Kurulum genel bakışı](/tr/install)

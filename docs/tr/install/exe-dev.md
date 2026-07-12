---
read_when:
    - Gateway için ucuz ve sürekli açık bir Linux ana makinesi istiyorsunuz
    - Kendi VPS’nizi çalıştırmadan uzaktan Kontrol Arayüzü erişimi istiyorsunuz
summary: Uzaktan erişim için OpenClaw Gateway'i exe.dev üzerinde çalıştırın (VM + HTTPS proxy)
title: exe.dev
x-i18n:
    generated_at: "2026-07-12T12:24:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a768511d2d7e4e4ec10bcdae83684417bde05286468b0534200f8dd5ec015f7b
    source_path: install/exe-dev.md
    workflow: 16
---

**Amaç:** OpenClaw Gateway'in bir [exe.dev](https://exe.dev) sanal makinesinde çalışması ve `https://<vm-name>.exe.xyz` adresinden erişilebilir olması.

Bu kılavuz, exe.dev'in varsayılan **exeuntu** kalıbını temel alır. Diğer dağıtımlarda paketleri uygun şekilde eşleştirin.

## Gereksinimler

- exe.dev hesabı
- exe.dev sanal makinelerine `ssh exe.dev` erişimi (manuel kurulum için isteğe bağlı)

## Başlangıç için hızlı yol

1. [https://exe.new/openclaw](https://exe.new/openclaw) adresini açın
2. Gerektiği şekilde kimlik doğrulama anahtarınızı/token'ınızı girin
3. Sanal makinenizin yanındaki "Agent" seçeneğine tıklayın ve Shelley'nin hazırlama işlemini tamamlamasını bekleyin
4. `https://<vm-name>.exe.xyz/` adresini açın ve yapılandırılmış paylaşılan gizli anahtarla kimlik doğrulayın (varsayılan olarak token kimlik doğrulaması kullanılır; `gateway.auth.mode` ayarını değiştirirseniz parola kimlik doğrulaması da çalışır)
5. Bekleyen cihaz eşleştirme isteklerini `openclaw devices approve <requestId>` ile onaylayın

## Shelley ile otomatik kurulum

exe.dev'in aracısı Shelley, OpenClaw'u bir istem aracılığıyla kurabilir:

```text
Bu sanal makinede OpenClaw'u (https://docs.openclaw.ai/install) kur. OpenClaw ilk kurulumunda etkileşimsiz ve riski kabul etme bayraklarını kullan. Sağlanan kimlik doğrulama bilgilerini veya token'ı gerektiği şekilde ekle. nginx'i, varsayılan etkin site yapılandırmasındaki kök konumda varsayılan 18789 numaralı porttan yönlendirme yapacak şekilde yapılandır ve WebSocket desteğini etkinleştirdiğinden emin ol. Eşleştirme, "openclaw devices list" ve "openclaw devices approve <request id>" komutlarıyla yapılır. Kontrol panelinde OpenClaw sağlık durumunun iyi olarak gösterildiğinden emin ol. exe.dev, 8000 numaralı porttan 80/443 numaralı portlara yönlendirmeyi ve HTTPS'i bizim için yönetir; bu nedenle nihai "erişilebilir" adres, port belirtilmeden <vm-name>.exe.xyz olmalıdır.
```

## Manuel kurulum

<Steps>
  <Step title="Sanal makineyi oluşturun">
    Cihazınızdan:

    ```bash
    ssh exe.dev new
    ```

    Ardından bağlanın:

    ```bash
    ssh <vm-name>.exe.xyz
    ```

    <Tip>
    Bu sanal makineyi **durum bilgisi kalıcı** olacak şekilde tutun. OpenClaw; `openclaw.json`, aracı başına `auth-profiles.json`, oturumlar ve kanal/sağlayıcı durumunu `~/.openclaw/` altında, çalışma alanını ise `~/.openclaw/workspace/` altında saklar.
    </Tip>

  </Step>

  <Step title="Ön koşulları kurun (sanal makinede)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl jq ca-certificates openssl
    ```
  </Step>

  <Step title="OpenClaw'u kurun">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="nginx'i 8000 numaralı porta proxy uygulayacak şekilde yapılandırın">
    `/etc/nginx/sites-enabled/default` dosyasını düzenleyin:

    ```nginx
    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        listen 8000;
        listen [::]:8000;

        server_name _;

        location / {
            proxy_pass http://127.0.0.1:18789;
            proxy_http_version 1.1;

            # WebSocket desteği
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            # Standart proxy üst bilgileri
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Uzun süreli bağlantılar için zaman aşımı ayarları
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }
    }
    ```

    İstemci tarafından sağlanan zincirleri korumak yerine yönlendirme üst bilgilerini üzerine yazarak değiştirin. OpenClaw, yönlendirilen IP meta verilerine yalnızca açıkça yapılandırılmış proxy'lerden geldiğinde güvenir ve ekleme tarzındaki `X-Forwarded-For` zincirleri güvenlik güçlendirmesi açısından riskli kabul edilir.

  </Step>

  <Step title="OpenClaw'a erişin ve cihazları onaylayın">
    `https://<vm-name>.exe.xyz/` adresini açın (ilk kurulumun Kontrol Arayüzü çıktısına bakın). Kimlik doğrulaması istenirse sanal makinede yapılandırılmış paylaşılan gizli anahtarı yapıştırın.

    Bu kılavuz varsayılan olarak token kimlik doğrulamasını kullanır; bu nedenle `gateway.auth.token` değerini `openclaw config get gateway.auth.token` ile alın veya `openclaw doctor --n` ile yeni bir tane oluşturun. Gateway'i parola kimlik doğrulamasına geçirdiyseniz bunun yerine `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` kullanın.

    Cihazları `openclaw devices list` ve `openclaw devices approve <requestId>` ile onaylayın. Emin değilseniz tarayıcınızdan Shelley'yi kullanın.

  </Step>
</Steps>

## Uzak kanal kurulumu

Uzak ana makinelerde, `config set` için çok sayıda SSH çağrısı yapmak yerine tek bir `config patch` çağrısını tercih edin. Gerçek token'ları sanal makine ortamında veya `~/.openclaw/.env` içinde tutun ve `openclaw.json` dosyasına yalnızca SecretRef'leri koyun. SecretRef sözleşmesinin tamamı için [Gizli anahtar yönetimi](/tr/gateway/secrets) bölümüne bakın.

Sanal makinede, hizmet ortamının ihtiyaç duyduğu gizli anahtarları içermesini sağlayın:

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

Yerel makinenizde bir yama dosyası oluşturun ve bunu sanal makineye aktarın:

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
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
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

İç içe bir izin verilenler listesinin tam olarak yama değeriyle aynı olması gerektiğinde `--replace-path` kullanın; örneğin bir Discord kanalının izin verilenler listesini değiştirmek için:

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

Kanal yapılandırma başvurusunun tamamı için [Discord](/tr/channels/discord) ve [Slack](/tr/channels/slack) bölümlerine bakın.

## Uzaktan erişim

exe.dev, uzaktan erişim için kimlik doğrulamasını yönetir. Varsayılan olarak 8000 numaralı porttan gelen HTTP trafiği, e-posta kimlik doğrulamasıyla `https://<vm-name>.exe.xyz` adresine yönlendirilir.

## Güncelleme

```bash
openclaw update
```

Kanal geçişleri ve manuel kurtarma için [Güncelleme](/tr/install/updating) bölümüne bakın.

## İlgili konular

- [Uzak Gateway](/tr/gateway/remote)
- [Kuruluma genel bakış](/tr/install)

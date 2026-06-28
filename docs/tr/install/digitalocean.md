---
read_when:
    - DigitalOcean'da OpenClaw kurulumu
    - OpenClaw için basit bir ücretli VPS mi arıyorsunuz?
summary: OpenClaw'u DigitalOcean Droplet üzerinde barındırma
title: DigitalOcean
x-i18n:
    generated_at: "2026-05-10T19:41:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ddfe3e6df5e48616584e912e12eede30a62f869fc307f586c9604c9c06c9e5b
    source_path: install/digitalocean.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw Gateway'i DigitalOcean Droplet üzerinde kalıcı olarak çalıştırın (1 GB Basic plan için ayda yaklaşık 6 ABD doları).

DigitalOcean, en basit ücretli VPS yoludur. Daha ucuz veya ücretsiz seçenekleri tercih ederseniz:

- [Hetzner](/tr/install/hetzner) — €3,79/ay, dolar başına daha fazla çekirdek/RAM.
- [Oracle Cloud](/tr/install/oracle) — Always Free ARM (4 OCPU'ya, 24 GB RAM'e kadar), ancak kayıt süreci sorunlu olabilir ve yalnızca ARM destekler.

## Ön Koşullar

- DigitalOcean hesabı ([kayıt](https://cloud.digitalocean.com/registrations/new))
- SSH anahtar çifti (veya parola ile kimlik doğrulaması kullanmaya istekli olmak)
- Yaklaşık 20 dakika

## Kurulum

<Steps>
  <Step title="Droplet oluşturun">
    <Warning>
    Temiz bir temel imaj kullanın (Ubuntu 24.04 LTS). Başlatma betiklerini ve güvenlik duvarı varsayılanlarını incelemediğiniz sürece üçüncü taraf Marketplace tek tık imajlarından kaçının.
    </Warning>

    1. [DigitalOcean](https://cloud.digitalocean.com/) hesabınıza giriş yapın.
    2. **Create > Droplets** seçeneğine tıklayın.
    3. Şunları seçin:
       - **Region:** Size en yakın bölge
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** SSH anahtarı (önerilir) veya parola
    4. **Create Droplet** seçeneğine tıklayın ve IP adresini not edin.

  </Step>

  <Step title="Bağlanın ve kurun">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Install Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Install OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash

    # Create the non-root user that will own OpenClaw state and services.
    adduser openclaw
    usermod -aG sudo openclaw
    loginctl enable-linger openclaw

    su - openclaw
    openclaw --version
    ```

    root kabuğunu yalnızca sistem başlangıç kurulumu için kullanın. Durumun `/home/openclaw/.openclaw/` altında tutulması ve Gateway'in bu kullanıcının systemd servisi olarak kurulması için OpenClaw komutlarını root olmayan `openclaw` kullanıcısı olarak çalıştırın.

  </Step>

  <Step title="İlk kurulumu çalıştırın">
    ```bash
    openclaw onboard --install-daemon
    ```

    Sihirbaz sizi model kimlik doğrulaması, kanal kurulumu, Gateway token oluşturma ve daemon kurulumu (systemd) boyunca yönlendirir.

  </Step>

  <Step title="Swap ekleyin (1 GB Droplet'ler için önerilir)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Gateway'i doğrulayın">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Control UI'ye erişin">
    Gateway varsayılan olarak loopback'e bağlanır. Bu seçeneklerden birini seçin.

    **Seçenek A: SSH tüneli (en basit)**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Ardından `http://localhost:18789` adresini açın.

    **Seçenek B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sudo sh
    sudo tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Ardından tailnet'inizdeki herhangi bir cihazdan `https://<magicdns>/` adresini açın.

    Tailscale Serve, Control UI ve WebSocket trafiğini tailnet kimlik başlıkları üzerinden doğrular; bu da Gateway ana makinesinin kendisinin güvenilir olduğunu varsayar. HTTP API uç noktaları bundan bağımsız olarak Gateway'in normal kimlik doğrulama modunu (token/parola) izler. Serve üzerinden açık paylaşılan gizli anahtar kimlik bilgileri gerektirmek için `gateway.auth.allowTailscale: false` ayarlayın ve `gateway.auth.mode: "token"` veya `"password"` kullanın.

    **Seçenek C: Tailnet bağlama (Serve yok)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Ardından `http://<tailscale-ip>:18789` adresini açın (token gerekir).

  </Step>
</Steps>

## Kalıcılık ve yedeklemeler

OpenClaw durumu şurada tutulur:

- `~/.openclaw/` — `openclaw.json`, ajan başına `auth-profiles.json`, kanal/sağlayıcı durumu ve oturum verileri.
- `~/.openclaw/workspace/` — ajan çalışma alanı (SOUL.md, bellek, yapıtlar).

Bunlar Droplet yeniden başlatmalarından sonra korunur. Taşınabilir bir anlık görüntü almak için:

```bash
openclaw backup create
```

DigitalOcean anlık görüntüleri tüm Droplet'i yedekler; `openclaw backup create` ana makineler arasında taşınabilirdir.

## 1 GB RAM ipuçları

6 ABD dolarlık Droplet yalnızca 1 GB RAM'e sahiptir. İşlerin sorunsuz ilerlemesi için:

- Yukarıdaki swap adımının `/etc/fstab` içinde olduğundan emin olun; böylece yeniden başlatmalardan sonra korunur.
- Yerel modeller yerine API tabanlı modelleri (Claude, GPT) tercih edin — yerel LLM çıkarımı 1 GB'a sığmaz.
- Büyük istemlerde OOM yaşıyorsanız `agents.defaults.model.primary` değerini daha küçük bir modele ayarlayın.
- `free -h` ve `htop` ile izleyin.

## Sorun Giderme

**Gateway başlamıyor** -- `openclaw doctor --non-interactive` çalıştırın ve günlükleri `journalctl --user -u openclaw-gateway.service -n 50` ile kontrol edin.

**Port zaten kullanımda** -- Süreci bulmak için `lsof -i :18789` çalıştırın, ardından durdurun.

**Bellek yetersiz** -- Swap'ın etkin olduğunu `free -h` ile doğrulayın. Hala OOM yaşıyorsanız yerel modeller yerine API tabanlı modelleri (Claude, GPT) kullanın veya 2 GB Droplet'e yükseltin.

## Sonraki adımlar

- [Kanallar](/tr/channels) -- Telegram, WhatsApp, Discord ve daha fazlasını bağlayın
- [Gateway yapılandırması](/tr/gateway/configuration) -- tüm yapılandırma seçenekleri
- [Güncelleme](/tr/install/updating) -- OpenClaw'ı güncel tutun

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Fly.io](/tr/install/fly)
- [Hetzner](/tr/install/hetzner)
- [VPS barındırma](/tr/vps)

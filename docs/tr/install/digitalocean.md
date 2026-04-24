---
read_when:
    - OpenClaw’ı DigitalOcean üzerinde kurma
    - OpenClaw için basit ücretli bir VPS arıyorsunuz
summary: OpenClaw’ı bir DigitalOcean Droplet üzerinde barındırma
title: DigitalOcean
x-i18n:
    generated_at: "2026-04-24T09:15:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b3d06a38e257f4a8ab88d1f228c659a6cf1a276fe91c8ba7b89a0084658a314
    source_path: install/digitalocean.md
    workflow: 15
---

Bir DigitalOcean Droplet üzerinde kalıcı bir OpenClaw Gateway çalıştırın.

## Ön koşullar

- DigitalOcean hesabı ([kayıt](https://cloud.digitalocean.com/registrations/new))
- SSH anahtar çifti (veya parola kimlik doğrulaması kullanma isteği)
- Yaklaşık 20 dakika

## Kurulum

<Steps>
  <Step title="Bir Droplet oluşturun">
    <Warning>
    Temiz bir temel kalıp kullanın (Ubuntu 24.04 LTS). Başlangıç betiklerini ve güvenlik duvarı varsayılanlarını incelemediğiniz sürece üçüncü taraf Marketplace 1-click kalıplarından kaçının.
    </Warning>

    1. [DigitalOcean](https://cloud.digitalocean.com/) hesabınıza giriş yapın.
    2. **Create > Droplets** seçeneğine tıklayın.
    3. Şunları seçin:
       - **Bölge:** Size en yakın olan
       - **Kalıp:** Ubuntu 24.04 LTS
       - **Boyut:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Kimlik doğrulama:** SSH anahtarı (önerilir) veya parola
    4. **Create Droplet** seçeneğine tıklayın ve IP adresini not alın.

  </Step>

  <Step title="Bağlanın ve kurun">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Node.js 24 kur
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # OpenClaw kur
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw --version
    ```

  </Step>

  <Step title="Onboarding’i çalıştırın">
    ```bash
    openclaw onboard --install-daemon
    ```

    Sihirbaz sizi model kimlik doğrulaması, kanal kurulumu, Gateway token üretimi ve daemon kurulumu (systemd) boyunca yönlendirir.

  </Step>

  <Step title="Swap ekleyin (1 GB Droplet’ler için önerilir)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Gateway’i doğrulayın">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Control UI’ye erişin">
    Gateway varsayılan olarak loopback’e bağlanır. Bu seçeneklerden birini seçin.

    **Seçenek A: SSH tüneli (en basit)**

    ```bash
    # Yerel makinenizden
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Ardından `http://localhost:18789` adresini açın.

    **Seçenek B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Ardından tailnet’inizdeki herhangi bir cihazdan `https://<magicdns>/` adresini açın.

    **Seçenek C: Tailnet bağlama (Serve yok)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Ardından `http://<tailscale-ip>:18789` adresini açın (token gerekir).

  </Step>
</Steps>

## Sorun giderme

**Gateway başlamıyor** -- `openclaw doctor --non-interactive` çalıştırın ve günlükleri `journalctl --user -u openclaw-gateway.service -n 50` ile kontrol edin.

**Port zaten kullanımda** -- Süreci bulmak için `lsof -i :18789` çalıştırın, sonra durdurun.

**Bellek yetersiz** -- Swap’in etkin olduğunu `free -h` ile doğrulayın. Hâlâ OOM oluyorsa yerel modeller yerine API tabanlı modeller (Claude, GPT) kullanın veya 2 GB Droplet’e yükseltin.

## Sonraki adımlar

- [Kanallar](/tr/channels) -- Telegram, WhatsApp, Discord ve daha fazlasını bağlayın
- [Gateway yapılandırması](/tr/gateway/configuration) -- tüm yapılandırma seçenekleri
- [Güncelleme](/tr/install/updating) -- OpenClaw’ı güncel tutun

## İlgili

- [Kuruluma genel bakış](/tr/install)
- [Fly.io](/tr/install/fly)
- [Hetzner](/tr/install/hetzner)
- [VPS barındırma](/tr/vps)

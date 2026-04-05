---
read_when:
    - OpenClaw'ı DigitalOcean üzerinde kurma
    - OpenClaw için basit bir ücretli VPS arama
summary: OpenClaw'ı bir DigitalOcean Droplet üzerinde barındırın
title: DigitalOcean
x-i18n:
    generated_at: "2026-04-05T13:56:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b161db8ec643d8313938a2453ce6242fc1ee8ea1fd2069916276f1aadeb71f1
    source_path: install/digitalocean.md
    workflow: 15
---

# DigitalOcean

Kalıcı bir OpenClaw Gateway'i bir DigitalOcean Droplet üzerinde çalıştırın.

## Ön koşullar

- DigitalOcean hesabı ([kayıt olun](https://cloud.digitalocean.com/registrations/new))
- SSH anahtar çifti (veya parola auth kullanmaya istekli olmanız)
- Yaklaşık 20 dakika

## Kurulum

<Steps>
  <Step title="Bir Droplet oluşturun">
    <Warning>
    Temiz bir temel imaj kullanın (Ubuntu 24.04 LTS). Başlangıç betiklerini ve güvenlik duvarı varsayılanlarını incelemediyseniz üçüncü taraf Marketplace 1-click imajlarından kaçının.
    </Warning>

    1. [DigitalOcean](https://cloud.digitalocean.com/) hesabınıza giriş yapın.
    2. **Create > Droplets** seçeneğine tıklayın.
    3. Şunları seçin:
       - **Region:** Size en yakın olan
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** SSH anahtarı (önerilir) veya parola
    4. **Create Droplet** seçeneğine tıklayın ve IP adresini not edin.

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

  <Step title="Onboarding'i çalıştırın">
    ```bash
    openclaw onboard --install-daemon
    ```

    Sihirbaz; model auth, kanal kurulumu, gateway token oluşturma ve daemon kurulumu (systemd) boyunca size rehberlik eder.

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
    Gateway varsayılan olarak loopback'e bağlanır. Şu seçeneklerden birini seçin.

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

    Ardından tailnet'inizdeki herhangi bir cihazdan `https://<magicdns>/` adresini açın.

    **Seçenek C: Tailnet bind (Serve yok)**

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

**Bellek yetersiz** -- `free -h` ile swap'in etkin olduğunu doğrulayın. Hâlâ OOM alıyorsanız yerel modeller yerine API tabanlı modeller kullanın (Claude, GPT) veya 2 GB'lık bir Droplet'e yükseltin.

## Sonraki adımlar

- [Channels](/tr/channels) -- Telegram, WhatsApp, Discord ve daha fazlasını bağlayın
- [Gateway configuration](/gateway/configuration) -- tüm yapılandırma seçenekleri
- [Updating](/install/updating) -- OpenClaw'ı güncel tutun

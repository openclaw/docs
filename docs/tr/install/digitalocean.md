---
read_when:
    - OpenClaw'ı DigitalOcean'da kurma
    - OpenClaw için basit bir ücretli VPS arıyorum
summary: OpenClaw'u bir DigitalOcean Droplet üzerinde barındırın
title: DigitalOcean
x-i18n:
    generated_at: "2026-05-06T09:18:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7aa09915d845c9ede27db794cac464490ba038e8e5e0a2ef0f5bfc62ef7e59ff
    source_path: install/digitalocean.md
    workflow: 16
---

DigitalOcean Droplet üzerinde kalıcı bir OpenClaw Gateway çalıştırın (1 GB Basic plan için yaklaşık 6 $/ay).

DigitalOcean, en basit ücretli VPS yoludur. Daha ucuz veya ücretsiz seçenekleri tercih ediyorsanız:

- [Hetzner](/tr/install/hetzner) — 3,79 €/ay, dolar başına daha fazla çekirdek/RAM.
- [Oracle Cloud](/tr/install/oracle) — Always Free ARM (en fazla 4 OCPU, 24 GB RAM), ancak kayıt süreci zahmetli olabilir ve yalnızca ARM'dır.

## Ön koşullar

- DigitalOcean hesabı ([kayıt](https://cloud.digitalocean.com/registrations/new))
- SSH anahtar çifti (veya parola kimlik doğrulaması kullanmaya istekli olmak)
- Yaklaşık 20 dakika

## Kurulum

<Steps>
  <Step title="Create a Droplet">
    <Warning>
    Temiz bir temel imaj kullanın (Ubuntu 24.04 LTS). Başlatma betiklerini ve güvenlik duvarı varsayılanlarını incelemediyseniz üçüncü taraf Marketplace tek tık imajlarından kaçının.
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

  <Step title="Connect and install">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Install Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Install OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw --version
    ```

  </Step>

  <Step title="Run onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Sihirbaz sizi model kimlik doğrulaması, kanal kurulumu, gateway token oluşturma ve daemon kurulumu (systemd) adımlarından geçirir.

  </Step>

  <Step title="Add swap (recommended for 1 GB Droplets)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Verify the gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Access the Control UI">
    Gateway varsayılan olarak loopback'e bağlanır. Bu seçeneklerden birini seçin.

    **Seçenek A: SSH tüneli (en basit)**

    ```bash
    # From your local machine
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

    Tailscale Serve, Control UI ve WebSocket trafiğinin kimliğini tailnet kimlik başlıkları üzerinden doğrular; bu, Gateway ana makinesinin kendisinin güvenilir olduğunu varsayar. HTTP API uç noktaları ne olursa olsun Gateway'in normal kimlik doğrulama modunu (token/parola) izler. Serve üzerinden açık paylaşılan gizli kimlik bilgileri gerektirmek için `gateway.auth.allowTailscale: false` ayarlayın ve `gateway.auth.mode: "token"` veya `"password"` kullanın.

    **Seçenek C: Tailnet bağlama (Serve yok)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Ardından `http://<tailscale-ip>:18789` adresini açın (token gerekir).

  </Step>
</Steps>

## Kalıcılık ve yedekler

OpenClaw durumu şurada bulunur:

- `~/.openclaw/` — `openclaw.json`, aracı başına `auth-profiles.json`, kanal/sağlayıcı durumu ve oturum verileri.
- `~/.openclaw/workspace/` — aracı çalışma alanı (SOUL.md, bellek, yapıtlar).

Bunlar Droplet yeniden başlatmalarından etkilenmez. Taşınabilir bir anlık görüntü almak için:

```bash
openclaw backup create
```

DigitalOcean anlık görüntüleri tüm Droplet'i yedekler; `openclaw backup create` ise ana makineler arasında taşınabilir.

## 1 GB RAM ipuçları

6 $'lık Droplet yalnızca 1 GB RAM'e sahiptir. İşlerin sorunsuz kalması için:

- Yeniden başlatmalardan sonra da kalması için yukarıdaki swap adımının `/etc/fstab` içinde olduğundan emin olun.
- Yerel modeller yerine API tabanlı modelleri (Claude, GPT) tercih edin — yerel LLM çıkarımı 1 GB'a sığmaz.
- Büyük prompt'larda OOM yaşarsanız `agents.defaults.model.primary` değerini daha küçük bir modele ayarlayın.
- `free -h` ve `htop` ile izleyin.

## Sorun giderme

**Gateway başlamıyor** -- `openclaw doctor --non-interactive` komutunu çalıştırın ve günlükleri `journalctl --user -u openclaw-gateway.service -n 50` ile kontrol edin.

**Port zaten kullanımda** -- Süreci bulmak için `lsof -i :18789` komutunu çalıştırın, ardından durdurun.

**Bellek yetersiz** -- Swap'ın etkin olduğunu `free -h` ile doğrulayın. Hâlâ OOM yaşıyorsanız yerel modeller yerine API tabanlı modeller (Claude, GPT) kullanın veya 2 GB Droplet'e yükseltin.

## Sonraki adımlar

- [Kanallar](/tr/channels) -- Telegram, WhatsApp, Discord ve daha fazlasını bağlayın
- [Gateway yapılandırması](/tr/gateway/configuration) -- tüm yapılandırma seçenekleri
- [Güncelleme](/tr/install/updating) -- OpenClaw'ı güncel tutun

## İlgili

- [Kurulum özeti](/tr/install)
- [Fly.io](/tr/install/fly)
- [Hetzner](/tr/install/hetzner)
- [VPS barındırma](/tr/vps)

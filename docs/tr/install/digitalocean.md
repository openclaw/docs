---
read_when:
    - DigitalOcean'da OpenClaw Kurulumu
    - OpenClaw için basit, ücretli bir VPS arıyorum
summary: OpenClaw'u bir DigitalOcean Droplet üzerinde barındırma
title: DigitalOcean
x-i18n:
    generated_at: "2026-07-12T12:24:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e124a59c079efda0c8e880018f2657fad784af1489ca3f98ed8ab609249e35bd
    source_path: install/digitalocean.md
    workflow: 16
---

DigitalOcean Droplet üzerinde kalıcı bir OpenClaw Gateway çalıştırın (1 GB Basic plan için ayda yaklaşık 6 ABD doları).

DigitalOcean, kullanımı kolay bir ücretli VPS seçeneğidir. Daha ucuz veya ücretsiz seçenekler için:

- [Hetzner](/tr/install/hetzner) -- dolar başına daha fazla çekirdek/RAM.
- [Oracle Cloud](/tr/install/oracle) -- Always Free ARM katmanı (4 OCPU ve 24 GB RAM'e kadar), ancak kaydolma süreci sorunlu olabilir ve yalnızca ARM desteklenir.

## Ön koşullar

- DigitalOcean hesabı ([kaydolun](https://cloud.digitalocean.com/registrations/new))
- SSH anahtar çifti (veya parola tabanlı kimlik doğrulama kullanmaya istekli olmanız)
- Yaklaşık 20 dakika

## Kurulum

<Steps>
  <Step title="Bir Droplet oluşturun">
    <Warning>
    Temiz bir temel kalıp (Ubuntu 24.04 LTS) kullanın. Başlatma betiklerini ve güvenlik duvarı varsayılanlarını incelemediğiniz üçüncü taraf Marketplace tek tıklamalı kalıplarından kaçının.
    </Warning>

    1. [DigitalOcean](https://cloud.digitalocean.com/) hesabınızda oturum açın.
    2. **Create > Droplets** seçeneğine tıklayın.
    3. Şunları seçin:
       - **Region:** Size en yakın bölge
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** SSH anahtarı (önerilen) veya parola
    4. **Create Droplet** seçeneğine tıklayın ve IP adresini not edin.

  </Step>

  <Step title="Bağlanın ve yükleyin">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Node.js 24'ü yükleyin
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # OpenClaw'u yükleyin
    curl -fsSL https://openclaw.ai/install.sh | bash

    # OpenClaw durumunun ve hizmetlerinin sahibi olacak root olmayan kullanıcıyı oluşturun.
    adduser openclaw
    usermod -aG sudo openclaw
    loginctl enable-linger openclaw

    su - openclaw
    openclaw --version
    ```

    Root kabuğunu yalnızca ilk sistem kurulumu için kullanın. Durumun `/home/openclaw/.openclaw/` altında tutulması ve Gateway'in bu kullanıcının systemd `--user` hizmeti olarak yüklenmesi için OpenClaw komutlarını root olmayan `openclaw` kullanıcısı olarak çalıştırın.

  </Step>

  <Step title="İlk yapılandırmayı çalıştırın">
    ```bash
    openclaw onboard --install-daemon
    ```

    Sihirbaz; model kimlik doğrulaması, kanal kurulumu, Gateway belirteci oluşturma ve daemon yükleme (systemd kullanıcı hizmeti) adımlarında size rehberlik eder.

  </Step>

  <Step title="Takas alanı ekleyin (1 GB Droplet'ler için önerilir)">
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

  <Step title="Kontrol Arayüzüne erişin">
    Gateway varsayılan olarak local loopback adresine bağlanır. Aşağıdaki seçeneklerden birini belirleyin.

    **Seçenek A: SSH tüneli (en basit)**

    ```bash
    # Yerel makinenizden
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

    Tailscale Serve, Kontrol Arayüzü ve WebSocket trafiğinin kimliğini tailnet kimlik üstbilgileri aracılığıyla doğrular; bu, Gateway ana makinesinin kendisine güvenildiğini varsayar. HTTP API uç noktaları ise bundan bağımsız olarak Gateway'in normal kimlik doğrulama modunu (belirteç/parola) izlemeye devam eder. Serve üzerinden açıkça paylaşılan gizli bilgi kimlik bilgileri gerektirmek için `gateway.auth.allowTailscale: false` ayarını yapın ve `gateway.auth.mode: "token"` veya `"password"` kullanın.

    **Seçenek C: Tailnet bağlantısı (Serve olmadan)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Ardından `http://<tailscale-ip>:18789` adresini açın (belirteç gerekir).

  </Step>
</Steps>

## Kalıcılık ve yedeklemeler

OpenClaw durumu şurada tutulur:

- `~/.openclaw/` -- `openclaw.json`, kanal/sağlayıcı kimlik bilgileri, aracı başına `auth-profiles.json` ve oturum verileri.
- `~/.openclaw/workspace/` -- aracı çalışma alanı (SOUL.md, bellek, yapıtlar).

Bunlar Droplet yeniden başlatmalarında korunur. Taşınabilir bir anlık görüntü oluşturmak için:

```bash
openclaw backup create
```

DigitalOcean anlık görüntüleri Droplet'in tamamını yedekler; `openclaw backup create` ise ana makineler arasında taşınabilir.

## 1 GB RAM için ipuçları

6 ABD dolarlık Droplet yalnızca 1 GB RAM'e sahiptir. Sistemin sorunsuz çalışmasını sağlamak için:

- Yeniden başlatmalardan sonra korunması için yukarıdaki takas alanı adımının `/etc/fstab` içinde bulunduğundan emin olun.
- Yerel modeller yerine API tabanlı modelleri (Claude, GPT) tercih edin; yerel LLM çıkarımı 1 GB'a sığmaz.
- Büyük istemlerde yetersiz bellek hatalarıyla karşılaşırsanız `agents.defaults.model.primary` değerini daha küçük bir modele ayarlayın.
- `free -h` ve `htop` ile izleyin.

## Sorun giderme

**Gateway başlatılmıyor** -- `openclaw doctor --non-interactive` komutunu çalıştırın ve `journalctl --user -u openclaw-gateway.service -n 50` ile günlükleri kontrol edin.

**Bağlantı noktası zaten kullanımda** -- Süreci bulmak için `lsof -i :18789` komutunu çalıştırın, ardından süreci durdurun.

**Bellek yetersiz** -- `free -h` ile takas alanının etkin olduğunu doğrulayın. Hâlâ yetersiz bellek hatalarıyla karşılaşıyorsanız yerel modeller yerine API tabanlı modellere (Claude, GPT) geçin veya 2 GB'lık bir Droplet'e yükseltin.

## Sonraki adımlar

- [Kanallar](/tr/channels) -- Telegram, WhatsApp, Discord ve diğerlerini bağlayın
- [Gateway yapılandırması](/tr/gateway/configuration) -- tüm yapılandırma seçenekleri
- [Güncelleme](/tr/install/updating) -- OpenClaw'u güncel tutun

## İlgili

- [Yüklemeye genel bakış](/tr/install)
- [Fly.io](/tr/install/fly)
- [Hetzner](/tr/install/hetzner)
- [VPS barındırma](/tr/vps)

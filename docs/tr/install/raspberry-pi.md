---
read_when:
    - OpenClaw'ı Raspberry Pi üzerinde kurma
    - OpenClaw'ı ARM cihazlarda çalıştırma
    - Ucuz, her zaman açık kişisel bir AI oluşturma
summary: OpenClaw'ı her zaman açık kendi kendine barındırma için Raspberry Pi üzerinde barındırın
title: Raspberry Pi
x-i18n:
    generated_at: "2026-04-24T09:17:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5fa11bf65f6db50b0864dabcf417f08c06e82a5ce067304f1cbfc189a4991a40
    source_path: install/raspberry-pi.md
    workflow: 15
---

Her zaman açık, kalıcı bir OpenClaw Gateway'i Raspberry Pi üzerinde çalıştırın. Pi yalnızca Gateway olduğu için (modeller API üzerinden bulutta çalışır), mütevazı bir Pi bile iş yükünü rahatça kaldırır.

## Önkoşullar

- 2 GB+ RAM'e sahip Raspberry Pi 4 veya 5 (4 GB önerilir)
- MicroSD kart (16 GB+) veya USB SSD (daha iyi performans)
- Resmi Pi güç kaynağı
- Ağ bağlantısı (Ethernet veya WiFi)
- 64-bit Raspberry Pi OS (gerekli -- 32-bit kullanmayın)
- Yaklaşık 30 dakika

## Kurulum

<Steps>
  <Step title="İşletim sistemini yazın">
    Başsız sunucu için masaüstü gerekmeyen **Raspberry Pi OS Lite (64-bit)** kullanın.

    1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/) indirin.
    2. İşletim sistemi seçin: **Raspberry Pi OS Lite (64-bit)**.
    3. Ayarlar penceresinde önceden yapılandırın:
       - Hostname: `gateway-host`
       - SSH'yi etkinleştirin
       - Kullanıcı adı ve parola ayarlayın
       - WiFi yapılandırın (Ethernet kullanmıyorsanız)
    4. SD karta veya USB sürücüye yazın, takın ve Pi'yi başlatın.

  </Step>

  <Step title="SSH ile bağlanın">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="Sistemi güncelleyin">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Saat dilimini ayarlayın (Cron ve hatırlatmalar için önemlidir)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Node.js 24 kurun">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="Swap ekleyin (2 GB veya daha az için önemli)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Düşük RAM'li cihazlar için swappiness değerini azaltın
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="OpenClaw'ı kurun">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Onboarding çalıştırın">
    ```bash
    openclaw onboard --install-daemon
    ```

    Sihirbazı takip edin. Başsız cihazlar için OAuth yerine API anahtarları önerilir. Başlamak için en kolay kanal Telegram'dır.

  </Step>

  <Step title="Doğrulayın">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Control UI'ye erişin">
    Bilgisayarınızda, Pi'den bir pano URL'si alın:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Ardından başka bir terminalde bir SSH tüneli oluşturun:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Yazdırılan URL'yi yerel tarayıcınızda açın. Her zaman açık uzak erişim için bkz. [Tailscale integration](/tr/gateway/tailscale).

  </Step>
</Steps>

## Performans ipuçları

**USB SSD kullanın** -- SD kartlar yavaştır ve çabuk yıpranır. USB SSD performansı ciddi biçimde artırır. Bkz. [Pi USB boot guide](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Modül derleme önbelleğini etkinleştirin** -- Daha düşük güçlü Pi ana bilgisayarlarında tekrarlanan CLI çağrılarını hızlandırır:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**Bellek kullanımını azaltın** -- Başsız kurulumlar için GPU belleğini serbest bırakın ve kullanılmayan hizmetleri kapatın:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

## Sorun giderme

**Bellek yetersiz** -- `free -h` ile swap'in etkin olduğunu doğrulayın. Kullanılmayan hizmetleri kapatın (`sudo systemctl disable cups bluetooth avahi-daemon`). Yalnızca API tabanlı modeller kullanın.

**Yavaş performans** -- SD kart yerine USB SSD kullanın. `vcgencmd get_throttled` ile CPU kısıtlamasını kontrol edin (`0x0` döndürmelidir).

**Hizmet başlamıyor** -- Günlükleri `journalctl --user -u openclaw-gateway.service --no-pager -n 100` ile kontrol edin ve `openclaw doctor --non-interactive` çalıştırın. Bu başsız bir Pi ise lingering'in etkin olduğunu da doğrulayın: `sudo loginctl enable-linger "$(whoami)"`.

**ARM ikili dosya sorunları** -- Bir skill "exec format error" ile başarısız olursa ikili dosyanın ARM64 yapısı olup olmadığını kontrol edin. Mimariyi `uname -m` ile doğrulayın (`aarch64` göstermelidir).

**WiFi kopuyor** -- WiFi güç yönetimini kapatın: `sudo iwconfig wlan0 power off`.

## Sonraki adımlar

- [Channels](/tr/channels) -- Telegram, WhatsApp, Discord ve daha fazlasını bağlayın
- [Gateway configuration](/tr/gateway/configuration) -- tüm yapılandırma seçenekleri
- [Updating](/tr/install/updating) -- OpenClaw'ı güncel tutun

## İlgili

- [Kuruluma genel bakış](/tr/install)
- [Linux sunucu](/tr/vps)
- [Platformlar](/tr/platforms)

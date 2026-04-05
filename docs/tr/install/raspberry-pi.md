---
read_when:
    - OpenClaw'ı bir Raspberry Pi üzerinde kuruyorsunuz
    - OpenClaw'ı ARM cihazlarda çalıştırıyorsunuz
    - Ucuz, her zaman açık kişisel bir AI sistemi oluşturuyorsunuz
summary: Her zaman açık self-hosting için OpenClaw'ı bir Raspberry Pi üzerinde barındırın
title: Raspberry Pi
x-i18n:
    generated_at: "2026-04-05T13:58:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 222ccbfb18a8dcec483adac6f5647dcb455c84edbad057e0ba2589a6da570b4c
    source_path: install/raspberry-pi.md
    workflow: 15
---

# Raspberry Pi

Kalıcı, her zaman açık bir OpenClaw Gateway'i Raspberry Pi üzerinde çalıştırın. Pi yalnızca gateway olduğu için (modeller API üzerinden bulutta çalışır), mütevazı bir Pi bile bu iş yükünü rahatça kaldırır.

## Ön koşullar

- 2 GB+ RAM'e sahip Raspberry Pi 4 veya 5 (4 GB önerilir)
- MicroSD kart (16 GB+) veya USB SSD (daha iyi performans)
- Resmi Pi güç kaynağı
- Ağ bağlantısı (Ethernet veya WiFi)
- 64-bit Raspberry Pi OS (gerekli -- 32-bit kullanmayın)
- Yaklaşık 30 dakika

## Kurulum

<Steps>
  <Step title="İşletim sistemini yazdırın">
    Başsız bir sunucu için masaüstüne gerek yoktur; **Raspberry Pi OS Lite (64-bit)** kullanın.

    1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/) indirin.
    2. İşletim sistemini seçin: **Raspberry Pi OS Lite (64-bit)**.
    3. Ayarlar iletişim kutusunda önceden şunları yapılandırın:
       - Ana bilgisayar adı: `gateway-host`
       - SSH'yi etkinleştirin
       - Kullanıcı adı ve parola ayarlayın
       - WiFi yapılandırın (Ethernet kullanmıyorsanız)
    4. SD kartınıza veya USB sürücünüze yazdırın, takın ve Pi'yi başlatın.

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

    # Saat dilimini ayarlayın (cron ve hatırlatıcılar için önemlidir)
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

  <Step title="Swap ekleyin (2 GB veya daha azı için önemlidir)">
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

  <Step title="Başlangıç kurulumunu çalıştırın">
    ```bash
    openclaw onboard --install-daemon
    ```

    Sihirbazı izleyin. Başsız cihazlar için OAuth yerine API anahtarları önerilir. Başlamak için en kolay kanal Telegram'dır.

  </Step>

  <Step title="Doğrulayın">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Kontrol UI'a erişin">
    Bilgisayarınızda, Pi'den bir pano URL'si alın:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Ardından başka bir terminalde bir SSH tüneli oluşturun:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Yazdırılan URL'yi yerel tarayıcınızda açın. Her zaman açık uzak erişim için [Tailscale integration](/gateway/tailscale) bölümüne bakın.

  </Step>
</Steps>

## Performans ipuçları

**USB SSD kullanın** -- SD kartlar yavaştır ve çabuk yıpranır. USB SSD performansı büyük ölçüde artırır. [Pi USB boot guide](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) bölümüne bakın.

**Modül derleme önbelleğini etkinleştirin** -- Daha düşük güçlü Pi host'larında tekrarlanan CLI çağrılarını hızlandırır:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**Bellek kullanımını azaltın** -- Başsız kurulumlar için GPU belleğini boşaltın ve kullanılmayan hizmetleri devre dışı bırakın:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

## Sorun giderme

**Bellek yetersiz** -- `free -h` ile swap'in etkin olduğunu doğrulayın. Kullanılmayan hizmetleri devre dışı bırakın (`sudo systemctl disable cups bluetooth avahi-daemon`). Yalnızca API tabanlı modeller kullanın.

**Yavaş performans** -- SD kart yerine USB SSD kullanın. `vcgencmd get_throttled` ile CPU yavaşlatmasını denetleyin (`0x0` döndürmelidir).

**Hizmet başlamıyor** -- Günlükleri `journalctl --user -u openclaw-gateway.service --no-pager -n 100` ile denetleyin ve `openclaw doctor --non-interactive` çalıştırın. Bu başsız bir Pi ise lingering'in etkin olduğunu da doğrulayın: `sudo loginctl enable-linger "$(whoami)"`.

**ARM ikili dosya sorunları** -- Bir skill "exec format error" ile başarısız olursa, ikili dosyanın ARM64 sürümü olup olmadığını denetleyin. Mimarinin doğruluğunu `uname -m` ile doğrulayın (`aarch64` göstermelidir).

**WiFi kopmaları** -- WiFi güç yönetimini devre dışı bırakın: `sudo iwconfig wlan0 power off`.

## Sonraki adımlar

- [Channels](/tr/channels) -- Telegram, WhatsApp, Discord ve daha fazlasını bağlayın
- [Gateway configuration](/gateway/configuration) -- tüm yapılandırma seçenekleri
- [Updating](/install/updating) -- OpenClaw'ı güncel tutun

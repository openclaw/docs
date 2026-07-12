---
read_when:
    - Raspberry Pi üzerinde OpenClaw kurulumu
    - OpenClaw'u ARM cihazlarda çalıştırma
    - Ucuz, her zaman açık kişisel bir yapay zekâ oluşturma
summary: Kesintisiz kendi sunucunuzda barındırma için OpenClaw'ı Raspberry Pi üzerinde çalıştırın
title: Raspberry Pi
x-i18n:
    generated_at: "2026-07-12T12:25:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60f8f3b23577155658d410993937ebe7c34c21f71c1bd7d9b0c453f15c4aa024
    source_path: install/raspberry-pi.md
    workflow: 16
---

Raspberry Pi üzerinde kalıcı, sürekli açık bir OpenClaw Gateway çalıştırın. Pi yalnızca Gateway görevini üstlendiğinden (modeller API aracılığıyla bulutta çalışır), mütevazı bir Pi bile iş yükünü rahatlıkla karşılar -- tipik donanım maliyeti **tek seferlik 35-80 ABD dolarıdır** ve aylık ücret yoktur.

## Donanım uyumluluğu

| Pi modeli   | RAM    | Çalışır mı? | Notlar                                      |
| ----------- | ------ | ----------- | ------------------------------------------- |
| Pi 5        | 4/8 GB | En iyi      | En hızlı seçenek, önerilir.                 |
| Pi 4        | 4 GB   | İyi         | Çoğu kullanıcı için ideal denge.            |
| Pi 4        | 2 GB   | Yeterli     | Takas alanı ekleyin.                         |
| Pi 4        | 1 GB   | Sınırlı     | Takas alanı ve asgari yapılandırmayla mümkün. |
| Pi 3B+      | 1 GB   | Yavaş       | Çalışır ancak ağırdır.                       |
| Pi Zero 2 W | 512 MB | Hayır       | Önerilmez.                                   |

**Minimum:** 1 GB RAM, 1 çekirdek, 500 MB boş disk alanı, 64 bit işletim sistemi.
**Önerilen:** 2 GB veya daha fazla RAM, 16 GB veya daha büyük SD kart (ya da USB SSD), Ethernet.

## Ön koşullar

- 2 GB veya daha fazla RAM'e sahip Raspberry Pi 4 ya da 5 (4 GB önerilir)
- MicroSD kart (16 GB veya üzeri) ya da USB SSD (daha iyi performans)
- Resmî Pi güç kaynağı
- Ağ bağlantısı (Ethernet veya WiFi)
- 64 bit Raspberry Pi OS (zorunludur -- 32 bit kullanmayın)
- Yaklaşık 30 dakika

## Kurulum

<Steps>
  <Step title="İşletim sistemini karta yazın">
    **Raspberry Pi OS Lite (64-bit)** kullanın -- ekransız bir sunucu için masaüstü gerekmez.

    1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/) uygulamasını indirin.
    2. İşletim sistemi olarak **Raspberry Pi OS Lite (64-bit)** seçeneğini belirleyin.
    3. Ayarlar iletişim kutusunda şunları önceden yapılandırın:
       - Ana makine adı: `gateway-host`
       - SSH'yi etkinleştirin
       - Kullanıcı adı ve parola belirleyin
       - WiFi'yi yapılandırın (Ethernet kullanmıyorsanız)
    4. İşletim sistemini SD kartınıza veya USB sürücünüze yazın, sürücüyü takın ve Pi'yi başlatın.

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

    # Set timezone (important for cron and reminders)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Node.js 24'ü yükleyin">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="Takas alanı ekleyin (2 GB veya daha az RAM için önemlidir)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Reduce swappiness for low-RAM devices
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="OpenClaw'ı yükleyin">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="İlk yapılandırmayı çalıştırın">
    ```bash
    openclaw onboard --install-daemon
    ```

    Sihirbazı izleyin. Ekransız cihazlarda OAuth yerine API anahtarları önerilir. Başlangıç için en kolay kanal Telegram'dır.

  </Step>

  <Step title="Doğrulayın">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Denetim arayüzüne erişin">
    Bilgisayarınızdan Pi üzerindeki kontrol paneli URL'sini alın:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Ardından başka bir terminalde SSH tüneli oluşturun:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Yazdırılan URL'yi yerel tarayıcınızda açın. Sürekli uzaktan erişim için [Tailscale entegrasyonuna](/tr/gateway/tailscale) bakın.

  </Step>
</Steps>

## Performans ipuçları

**USB SSD kullanın** -- SD kartlar yavaştır ve zamanla aşınır. USB SSD, performansı önemli ölçüde artırır ve daha fazla yazma döngüsüne dayanır; işletim sistemini SD kartta tutuyorsanız SSD'yi `OPENCLAW_STATE_DIR` için kullanın. [Pi USB önyükleme kılavuzuna](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) bakın.

**Modül derleme önbelleğini etkinleştirin** -- Daha düşük güçlü Pi ana makinelerinde tekrarlanan CLI çağrılarını hızlandırır. `OPENCLAW_NO_RESPAWN=1`, rutin Gateway yeniden başlatmalarını aynı süreç içinde tutarak ek süreç devirlerini önler ve küçük ana makinelerde PID takibini basitleştirir:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

`/tmp` yerine `/var/tmp` kullanın -- bazı dağıtımlar önyükleme sırasında `/tmp` dizinini temizleyerek ısıtılmış önbelleği siler.

**Bellek kullanımını azaltın** -- Ekransız kurulumlarda GPU belleğini serbest bırakın ve kullanılmayan hizmetleri devre dışı bırakın:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**Kararlı yeniden başlatmalar için systemd ek yapılandırması** -- Bu Pi ağırlıklı olarak OpenClaw çalıştırıyorsa hizmete bir ek yapılandırma ekleyin:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

Ardından `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service` komutunu çalıştırın. Ekransız bir Pi'de, kullanıcı hizmetinin oturum kapatıldıktan sonra çalışmayı sürdürmesi için kalıcı kullanıcı hizmetlerini bir kez etkinleştirin: `sudo loginctl enable-linger "$(whoami)"`.

## Önerilen model kurulumu

Pi yalnızca Gateway çalıştırdığından bulutta barındırılan API modellerini kullanın -- Pi üzerinde yerel LLM'ler çalıştırmayın; küçük modeller bile kullanışlı olamayacak kadar yavaştır:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": ["openai/gpt-5.4-mini"]
      }
    }
  }
}
```

## ARM ikili dosya notları

OpenClaw özelliklerinin çoğu ARM64 üzerinde değişiklik yapılmadan çalışır (Node.js, Telegram, WhatsApp/Baileys, Chromium). Zaman zaman ARM derlemesi bulunmayan ikili dosyalar genellikle Skills tarafından sağlanan isteğe bağlı Go/Rust CLI araçlarıdır. Mimarinin doğruluğunu `uname -m` ile denetleyin (`aarch64` göstermelidir), ardından kaynaktan derlemeye başvurmadan önce eksik ikili dosyanın sürüm sayfasında `linux-arm64` / `aarch64` yapılarının bulunup bulunmadığını kontrol edin.

## Kalıcılık ve yedeklemeler

OpenClaw durumu şu dizinlerde bulunur:

- `~/.openclaw/` -- `openclaw.json`, aracı başına `auth-profiles.json`, kanal/sağlayıcı durumu ve oturumlar.
- `~/.openclaw/workspace/` -- aracı çalışma alanı (SOUL.md, bellek, yapılar).

Bunlar yeniden başlatmalardan etkilenmez; hem performans hem de kullanım ömrü açısından SD kart yerine SSD kullanılmasından yararlanır. Taşınabilir bir anlık görüntü oluşturmak için:

```bash
openclaw backup create
```

## Sorun giderme

**Bellek yetersizliği** -- `free -h` ile takas alanının etkin olduğunu doğrulayın. Kullanılmayan hizmetleri devre dışı bırakın (`sudo systemctl disable cups bluetooth avahi-daemon`). Yalnızca API tabanlı modeller kullanın.

**Yavaş performans** -- SD kart yerine USB SSD kullanın. `vcgencmd get_throttled` ile işlemci kısıtlaması olup olmadığını kontrol edin (`0x0` döndürmelidir).

**Hizmet başlamıyor** -- `journalctl --user -u openclaw-gateway.service --no-pager -n 100` ile günlükleri kontrol edin ve `openclaw doctor --non-interactive` komutunu çalıştırın. Bu ekransız bir Pi ise kalıcı kullanıcı hizmetlerinin etkinleştirildiğini de doğrulayın: `sudo loginctl enable-linger "$(whoami)"`.

**ARM ikili dosya sorunları** -- Bir skill "exec format error" hatasıyla başarısız olursa ikili dosyanın ARM64 derlemesi olup olmadığını kontrol edin. Mimarinin doğruluğunu `uname -m` ile denetleyin (`aarch64` göstermelidir).

**WiFi bağlantısı kesiliyor** -- WiFi güç yönetimini devre dışı bırakın: `sudo iwconfig wlan0 power off`.

## Sonraki adımlar

- [Kanallar](/tr/channels) -- Telegram, WhatsApp, Discord ve diğerlerini bağlayın
- [Gateway yapılandırması](/tr/gateway/configuration) -- tüm yapılandırma seçenekleri
- [Güncelleme](/tr/install/updating) -- OpenClaw'ı güncel tutun

## İlgili içerikler

- [Kuruluma genel bakış](/tr/install)
- [Linux sunucusu](/tr/vps)
- [Platformlar](/tr/platforms)

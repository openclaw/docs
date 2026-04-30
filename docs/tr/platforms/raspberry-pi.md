---
read_when:
    - OpenClaw'ı Raspberry Pi üzerinde kurma
    - OpenClaw'ı ARM cihazlarda çalıştırma
    - Ucuz ve sürekli açık bir kişisel yapay zeka oluşturma
summary: Raspberry Pi'de OpenClaw (düşük maliyetli kendi kendine barındırılan kurulum)
title: Raspberry Pi (platformu)
x-i18n:
    generated_at: "2026-04-30T09:33:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5a277499ee8759f766984b3fd2097dbd55f2f34ba6169fdfc2eb9dd53d6bb7c
    source_path: platforms/raspberry-pi.md
    workflow: 16
---

# Raspberry Pi üzerinde OpenClaw

## Hedef

Tek seferlik **~35-80 $** maliyetle (aylık ücret yok) Raspberry Pi üzerinde kalıcı, her zaman açık bir OpenClaw Gateway çalıştırın.

Şunlar için mükemmel:

- 7/24 kişisel yapay zeka asistanı
- Ev otomasyonu merkezi
- Düşük güç tüketimli, her zaman erişilebilir Telegram/WhatsApp botu

## Donanım gereksinimleri

| Pi Modeli       | RAM     | Çalışır mı? | Notlar                                  |
| --------------- | ------- | ----------- | --------------------------------------- |
| **Pi 5**        | 4GB/8GB | ✅ En iyi   | En hızlı, önerilir                      |
| **Pi 4**        | 4GB     | ✅ İyi      | Çoğu kullanıcı için ideal nokta         |
| **Pi 4**        | 2GB     | ✅ Uygun    | Çalışır, swap ekleyin                   |
| **Pi 4**        | 1GB     | ⚠️ Sıkışık  | Swap ile mümkün, en düşük yapılandırma  |
| **Pi 3B+**      | 1GB     | ⚠️ Yavaş    | Çalışır ama ağır kalır                  |
| **Pi Zero 2 W** | 512MB   | ❌          | Önerilmez                               |

**Minimum özellikler:** 1GB RAM, 1 çekirdek, 500MB disk  
**Önerilen:** 2GB+ RAM, 64 bit OS, 16GB+ SD kart (veya USB SSD)

## Gerekenler

- Raspberry Pi 4 veya 5 (2GB+ önerilir)
- MicroSD kart (16GB+) veya USB SSD (daha iyi performans)
- Güç kaynağı (resmi Pi PSU önerilir)
- Ağ bağlantısı (Ethernet veya WiFi)
- ~30 dakika

## 1) OS’yi yazdırın

**Raspberry Pi OS Lite (64-bit)** kullanın; headless sunucu için masaüstü gerekmez.

1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/) indirin
2. OS seçin: **Raspberry Pi OS Lite (64-bit)**
3. Ön yapılandırma için dişli simgesine (⚙️) tıklayın:
   - Ana makine adını ayarlayın: `gateway-host`
   - SSH’yi etkinleştirin
   - Kullanıcı adı/parola ayarlayın
   - WiFi yapılandırın (Ethernet kullanmıyorsanız)
4. SD kartınıza / USB sürücünüze yazdırın
5. Pi’ye takın ve başlatın

## 2) SSH ile bağlanın

```bash
ssh user@gateway-host
# or use the IP address
ssh user@192.168.x.x
```

## 3) Sistem Kurulumu

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y git curl build-essential

# Set timezone (important for cron/reminders)
sudo timedatectl set-timezone America/Chicago  # Change to your timezone
```

## 4) Node.js 24 (ARM64) yükleyin

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should show v24.x.x
npm --version
```

## 5) Swap ekleyin (2GB veya daha az için önemli)

Swap, bellek yetersizliği kaynaklı çökmeleri önler:

```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize for low RAM (reduce swappiness)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) OpenClaw yükleyin

### Seçenek A: standart kurulum (önerilir)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### Seçenek B: hacklenebilir kurulum (kurcalamak için)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

Hacklenebilir kurulum, günlükler ve koda doğrudan erişim sağlar; ARM’ye özgü sorunlarda hata ayıklamak için kullanışlıdır.

## 7) Onboarding çalıştırın

```bash
openclaw onboard --install-daemon
```

Sihirbazı izleyin:

1. **Gateway modu:** Yerel
2. **Kimlik doğrulama:** API anahtarları önerilir (OAuth headless Pi üzerinde sorunlu olabilir)
3. **Kanallar:** Başlamak için en kolayı Telegram
4. **Daemon:** Evet (systemd)

## 8) Kurulumu doğrulayın

```bash
# Check status
openclaw status

# Check service (standard install = systemd user unit)
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 9) OpenClaw Dashboard’a erişin

`user@gateway-host` değerini Pi kullanıcı adınız ve ana makine adınız ya da IP adresinizle değiştirin.

Bilgisayarınızda, Pi’den yeni bir Dashboard URL’si yazdırmasını isteyin:

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

Komut `Dashboard URL:` yazdırır. `gateway.auth.token` değerinin nasıl
yapılandırıldığına bağlı olarak URL düz bir `http://127.0.0.1:18789/` bağlantısı
veya `#token=...` içeren bir bağlantı olabilir.

Bilgisayarınızda başka bir terminalde SSH tünelini oluşturun:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Ardından yazdırılan Dashboard URL’sini yerel tarayıcınızda açın.

UI shared-secret kimlik doğrulaması isterse yapılandırılmış token’ı veya parolayı
Control UI ayarlarına yapıştırın. Token kimlik doğrulaması için `gateway.auth.token`
(veya `OPENCLAW_GATEWAY_TOKEN`) kullanın.

Her zaman açık uzaktan erişim için [Tailscale](/tr/gateway/tailscale) bölümüne bakın.

---

## Performans iyileştirmeleri

### USB SSD kullanın (Büyük iyileştirme)

SD kartlar yavaştır ve aşınır. USB SSD performansı ciddi ölçüde artırır:

```bash
# Check if booting from USB
lsblk
```

Kurulum için [Pi USB önyükleme kılavuzuna](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) bakın.

### CLI başlangıcını hızlandırın (modül derleme önbelleği)

Daha düşük güçlü Pi ana makinelerinde, tekrarlanan CLI çalıştırmalarını hızlandırmak için Node’un modül derleme önbelleğini etkinleştirin:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Notlar:

- `NODE_COMPILE_CACHE` sonraki çalıştırmaları hızlandırır (`status`, `health`, `--help`).
- `/var/tmp`, yeniden başlatmalardan `/tmp` değerine göre daha iyi sağ çıkar.
- `OPENCLAW_NO_RESPAWN=1`, CLI’ın kendini yeniden başlatmasından kaynaklanan ek başlangıç maliyetini önler.
- İlk çalıştırma önbelleği ısıtır; sonraki çalıştırmalar en fazla faydayı sağlar.

### systemd başlangıç ayarı (isteğe bağlı)

Bu Pi çoğunlukla OpenClaw çalıştırıyorsa yeniden başlatma oynaklığını azaltmak
ve başlangıç ortamını kararlı tutmak için bir servis drop-in’i ekleyin:

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

Ardından uygulayın:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

Mümkünse soğuk başlatmalarda SD kartın rastgele I/O darboğazlarından kaçınmak
için OpenClaw durumunu/önbelleğini SSD destekli depolamada tutun.

Bu headless bir Pi ise kullanıcı servisinin oturumu kapattıktan sonra da devam
etmesi için lingering’i bir kez etkinleştirin:

```bash
sudo loginctl enable-linger "$(whoami)"
```

`Restart=` ilkeleri otomatik kurtarmaya nasıl yardımcı olur:
[systemd servis kurtarmayı otomatikleştirebilir](https://www.redhat.com/en/blog/systemd-automate-recovery).

### Bellek kullanımını azaltın

```bash
# Disable GPU memory allocation (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Disable Bluetooth if not needed
sudo systemctl disable bluetooth
```

### Kaynakları izleyin

```bash
# Check memory
free -h

# Check CPU temperature
vcgencmd measure_temp

# Live monitoring
htop
```

---

## ARM’ye özgü notlar

### İkili uyumluluk

Çoğu OpenClaw özelliği ARM64 üzerinde çalışır, ancak bazı harici ikili dosyalar ARM derlemeleri gerektirebilir:

| Araç              | ARM64 Durumu | Notlar                                      |
| ----------------- | ------------ | ------------------------------------------ |
| Node.js           | ✅           | Çok iyi çalışır                            |
| WhatsApp (Baileys)| ✅           | Saf JS, sorun yok                          |
| Telegram          | ✅           | Saf JS, sorun yok                          |
| gog (Gmail CLI)   | ⚠️           | ARM sürümü olup olmadığını kontrol edin    |
| Chromium (browser)| ✅           | `sudo apt install chromium-browser`        |

Bir Skill başarısız olursa ikili dosyasının ARM derlemesi olup olmadığını kontrol edin. Birçok Go/Rust aracı bunu sağlar; bazıları sağlamaz.

### 32 bit ve 64 bit

**Her zaman 64 bit OS kullanın.** Node.js ve birçok modern araç bunu gerektirir. Şununla kontrol edin:

```bash
uname -m
# Should show: aarch64 (64-bit) not armv7l (32-bit)
```

---

## Önerilen model kurulumu

Pi yalnızca Gateway olduğundan (modeller bulutta çalışır), API tabanlı modeller kullanın:

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

**Pi üzerinde yerel LLM çalıştırmayı denemeyin**; küçük modeller bile çok yavaştır. Ağır işi Claude/GPT’ye bırakın.

---

## Önyüklemede otomatik başlatma

Onboarding bunu ayarlar, ancak doğrulamak için:

```bash
# Check service is enabled
systemctl --user is-enabled openclaw-gateway.service

# Enable if not
systemctl --user enable openclaw-gateway.service

# Start on boot
systemctl --user start openclaw-gateway.service
```

---

## Sorun giderme

### Bellek yetersizliği (OOM)

```bash
# Check memory
free -h

# Add more swap (see Step 5)
# Or reduce services running on the Pi
```

### Yavaş performans

- SD kart yerine USB SSD kullanın
- Kullanılmayan servisleri devre dışı bırakın: `sudo systemctl disable cups bluetooth avahi-daemon`
- CPU throttling kontrol edin: `vcgencmd get_throttled` (`0x0` döndürmelidir)

### Servis başlamıyor

```bash
# Check logs
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# Common fix: rebuild
cd ~/openclaw  # if using hackable install
npm run build
systemctl --user restart openclaw-gateway.service
```

### ARM ikili dosya sorunları

Bir Skill "exec format error" ile başarısız olursa:

1. İkili dosyanın ARM64 derlemesi olup olmadığını kontrol edin
2. Kaynaktan derlemeyi deneyin
3. Veya ARM desteği olan bir Docker container kullanın

### WiFi kopmaları

WiFi üzerindeki headless Pi’ler için:

```bash
# Disable WiFi power management
sudo iwconfig wlan0 power off

# Make permanent
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## Maliyet karşılaştırması

| Kurulum        | Tek Seferlik Maliyet | Aylık Maliyet | Notlar                          |
| -------------- | -------------------- | ------------- | ------------------------------- |
| **Pi 4 (2GB)** | ~$45                 | $0            | + güç (~$5/yıl)                 |
| **Pi 4 (4GB)** | ~$55                 | $0            | Önerilen                        |
| **Pi 5 (4GB)** | ~$60                 | $0            | En iyi performans               |
| **Pi 5 (8GB)** | ~$80                 | $0            | Fazla güçlü ama geleceğe dönük  |
| DigitalOcean   | $0                   | $6/ay         | $72/yıl                         |
| Hetzner        | $0                   | €3.79/ay      | ~$50/yıl                        |

**Başa baş noktası:** Bir Pi, bulut VPS’ye kıyasla ~6-12 ayda kendini amorti eder.

---

## İlgili

- [Linux kılavuzu](/tr/platforms/linux) — genel Linux kurulumu
- [DigitalOcean kılavuzu](/tr/install/digitalocean) — bulut alternatifi
- [Hetzner kılavuzu](/tr/install/hetzner) — Docker kurulumu
- [Tailscale](/tr/gateway/tailscale) — uzaktan erişim
- [Nodes](/tr/nodes) — dizüstü bilgisayarınızı/telefonunuzu Pi Gateway ile eşleştirin

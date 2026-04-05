---
read_when:
    - Raspberry Pi üzerinde OpenClaw kurma
    - ARM cihazlarda OpenClaw çalıştırma
    - Ucuz, her zaman açık kişisel bir yapay zeka oluşturma
summary: Raspberry Pi üzerinde OpenClaw (uygun bütçeli self-hosted kurulum)
title: Raspberry Pi (Platform)
x-i18n:
    generated_at: "2026-04-05T14:01:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07f34e91899b7e0a31d9b944f3cb0cfdd4ecdeba58b619ae554379abdbf37eaf
    source_path: platforms/raspberry-pi.md
    workflow: 15
---

# Raspberry Pi üzerinde OpenClaw

## Amaç

Bir Raspberry Pi üzerinde kalıcı, her zaman açık bir OpenClaw Gateway çalıştırın; tek seferlik maliyet yaklaşık **$35-80** olsun (aylık ücret yok).

Şunlar için idealdir:

- 7/24 kişisel yapay zeka asistanı
- Ev otomasyonu merkezi
- Düşük güç tüketimli, her zaman erişilebilir Telegram/WhatsApp botu

## Donanım Gereksinimleri

| Pi Modeli       | RAM     | Çalışır mı? | Notlar                             |
| --------------- | ------- | ----------- | ---------------------------------- |
| **Pi 5**        | 4GB/8GB | ✅ En iyi   | En hızlı, önerilir                 |
| **Pi 4**        | 4GB     | ✅ İyi      | Çoğu kullanıcı için ideal denge    |
| **Pi 4**        | 2GB     | ✅ Tamam    | Çalışır, swap ekleyin              |
| **Pi 4**        | 1GB     | ⚠️ Sınırlı  | Swap ile mümkün, minimal yapılandırma |
| **Pi 3B+**      | 1GB     | ⚠️ Yavaş    | Çalışır ama yavaştır               |
| **Pi Zero 2 W** | 512MB   | ❌          | Önerilmez                          |

**Minimum özellikler:** 1GB RAM, 1 çekirdek, 500MB disk  
**Önerilen:** 2GB+ RAM, 64 bit OS, 16GB+ SD kart (veya USB SSD)

## İhtiyacınız olanlar

- Raspberry Pi 4 veya 5 (2GB+ önerilir)
- MicroSD kart (16GB+) veya USB SSD (daha iyi performans)
- Güç adaptörü (resmi Pi PSU önerilir)
- Ağ bağlantısı (Ethernet veya WiFi)
- Yaklaşık 30 dakika

## 1) OS’yi flashlayın

Headless bir sunucu için masaüstüne gerek yoktur; **Raspberry Pi OS Lite (64-bit)** kullanın.

1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/) dosyasını indirin
2. OS seçin: **Raspberry Pi OS Lite (64-bit)**
3. Ön yapılandırma için dişli simgesine (⚙️) tıklayın:
   - Ana makine adını ayarlayın: `gateway-host`
   - SSH’yi etkinleştirin
   - Kullanıcı adı/parola ayarlayın
   - WiFi yapılandırın (Ethernet kullanmıyorsanız)
4. SD kartınıza / USB sürücünüze flashlayın
5. Pi’yi takın ve başlatın

## 2) SSH ile bağlanın

```bash
ssh user@gateway-host
# veya IP adresini kullanın
ssh user@192.168.x.x
```

## 3) Sistem Kurulumu

```bash
# Sistemi güncelleyin
sudo apt update && sudo apt upgrade -y

# Gerekli temel paketleri kurun
sudo apt install -y git curl build-essential

# Saat dilimini ayarlayın (cron/hatırlatıcılar için önemlidir)
sudo timedatectl set-timezone America/Chicago  # Kendi saat diliminizle değiştirin
```

## 4) Node.js 24 kurun (ARM64)

```bash
# NodeSource üzerinden Node.js kurun
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Doğrulayın
node --version  # v24.x.x göstermeli
npm --version
```

## 5) Swap ekleyin (2GB veya daha az için önemli)

Swap, bellek yetersizliği nedeniyle oluşan çökmeleri önler:

```bash
# 2GB swap dosyası oluşturun
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Kalıcı hale getirin
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Düşük RAM için optimize edin (swappiness değerini azaltın)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) OpenClaw kurun

### Seçenek A: Standart kurulum (önerilir)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### Seçenek B: Hacklenebilir kurulum (kurcalamak için)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

Hacklenebilir kurulum, günlükler ve koda doğrudan erişim sağlar — ARM’e özgü sorunları ayıklamak için kullanışlıdır.

## 7) Onboarding çalıştırın

```bash
openclaw onboard --install-daemon
```

Sihirbazı takip edin:

1. **Gateway mode:** Local
2. **Auth:** API anahtarları önerilir (OAuth, headless Pi üzerinde sorun çıkarabilir)
3. **Channels:** Başlamak için en kolayı Telegram’dır
4. **Daemon:** Evet (systemd)

## 8) Kurulumu doğrulayın

```bash
# Durumu kontrol edin
openclaw status

# Hizmeti kontrol edin (standart kurulum = systemd kullanıcı birimi)
systemctl --user status openclaw-gateway.service

# Günlükleri görüntüleyin
journalctl --user -u openclaw-gateway.service -f
```

## 9) OpenClaw Dashboard’a erişin

`user@gateway-host` değerini Pi kullanıcı adınız ve ana makine adınız ya da IP adresinizle değiştirin.

Bilgisayarınızda, Pi’den yeni bir dashboard URL’si yazdırmasını isteyin:

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

Komut `Dashboard URL:` yazdırır. `gateway.auth.token`
nasıl yapılandırıldığına bağlı olarak URL düz bir `http://127.0.0.1:18789/` bağlantısı olabilir veya
`#token=...` içerebilir.

Bilgisayarınızdaki başka bir terminalde SSH tünelini oluşturun:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Ardından yazdırılan Dashboard URL’sini yerel tarayıcınızda açın.

UI ortak gizli anahtar kimlik doğrulaması isterse, yapılandırılmış token veya parolayı
Control UI ayarlarına yapıştırın. Token kimlik doğrulaması için `gateway.auth.token` (veya
`OPENCLAW_GATEWAY_TOKEN`) kullanın.

Her zaman açık uzaktan erişim için bkz. [Tailscale](/tr/gateway/tailscale).

---

## Performans Optimizasyonları

### USB SSD kullanın (büyük iyileştirme)

SD kartlar yavaştır ve çabuk yıpranır. USB SSD performansı ciddi ölçüde artırır:

```bash
# USB'den önyüklenip önyüklenmediğini kontrol edin
lsblk
```

Kurulum için [Pi USB önyükleme kılavuzu](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) sayfasına bakın.

### CLI başlangıcını hızlandırın (modül derleme önbelleği)

Düşük güçlü Pi ana makinelerinde, tekrarlanan CLI çalıştırmalarını hızlandırmak için Node’un modül derleme önbelleğini etkinleştirin:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Notlar:

- `NODE_COMPILE_CACHE`, sonraki çalıştırmaları hızlandırır (`status`, `health`, `--help`).
- `/var/tmp`, yeniden başlatmalarda `/tmp`'ye göre daha iyi korunur.
- `OPENCLAW_NO_RESPAWN=1`, CLI’nin kendini yeniden başlatmasından kaynaklanan ek başlangıç maliyetini önler.
- İlk çalıştırma önbelleği ısıtır; sonraki çalıştırmalar en fazla fayda sağlar.

### systemd başlangıç ayarı ince ayarı (isteğe bağlı)

Bu Pi çoğunlukla OpenClaw çalıştırıyorsa, yeniden başlatma
titreşimini azaltmak ve başlangıç ortamını sabit tutmak için bir servis drop-in ekleyin:

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

Sonra uygulayın:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

Mümkünse, soğuk başlangıçlar sırasında SD kartın
rastgele G/Ç darboğazlarını önlemek için OpenClaw durumunu/önbelleğini SSD destekli depolamada tutun.

Bu headless bir Pi ise, kullanıcı hizmetinin oturum kapatma sonrası da devam etmesi için lingering’i bir kez etkinleştirin:

```bash
sudo loginctl enable-linger "$(whoami)"
```

`Restart=` ilkelerinin otomatik kurtarmaya nasıl yardımcı olduğu:
[systemd hizmet kurtarmayı otomatikleştirebilir](https://www.redhat.com/en/blog/systemd-automate-recovery).

### Bellek kullanımını azaltın

```bash
# GPU bellek ayırmasını kapatın (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Gerekli değilse Bluetooth'u devre dışı bırakın
sudo systemctl disable bluetooth
```

### Kaynakları izleyin

```bash
# Belleği kontrol edin
free -h

# CPU sıcaklığını kontrol edin
vcgencmd measure_temp

# Canlı izleme
htop
```

---

## ARM’e özgü notlar

### İkili uyumluluk

OpenClaw özelliklerinin çoğu ARM64 üzerinde çalışır, ancak bazı harici ikili dosyalar ARM derlemeleri gerektirebilir:

| Araç              | ARM64 Durumu | Notlar                              |
| ----------------- | ------------ | ----------------------------------- |
| Node.js           | ✅           | Çok iyi çalışır                     |
| WhatsApp (Baileys) | ✅          | Tamamen JS, sorun yok               |
| Telegram          | ✅           | Tamamen JS, sorun yok               |
| gog (Gmail CLI)   | ⚠️           | ARM sürümünü kontrol edin           |
| Chromium (browser) | ✅          | `sudo apt install chromium-browser` |

Bir skill başarısız olursa, ikili dosyanın ARM derlemesi olup olmadığını kontrol edin. Birçok Go/Rust aracı vardır; bazılarında yoktur.

### 32 bit ve 64 bit

**Her zaman 64 bit OS kullanın.** Node.js ve birçok modern araç bunu gerektirir. Şu komutla kontrol edin:

```bash
uname -m
# Şunu göstermeli: aarch64 (64 bit), armv7l (32 bit) değil
```

---

## Önerilen model kurulumu

Pi yalnızca Gateway olduğu için (modeller bulutta çalışır), API tabanlı modeller kullanın:

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

**Pi üzerinde yerel LLM çalıştırmaya çalışmayın** — küçük modeller bile çok yavaştır. Ağır işi Claude/GPT yapsın.

---

## Açılışta otomatik başlatma

Onboarding bunu ayarlar, ancak doğrulamak için:

```bash
# Hizmet etkin mi kontrol edin
systemctl --user is-enabled openclaw-gateway.service

# Etkin değilse etkinleştirin
systemctl --user enable openclaw-gateway.service

# Açılışta başlatın
systemctl --user start openclaw-gateway.service
```

---

## Sorun Giderme

### Bellek yetersizliği (OOM)

```bash
# Belleği kontrol edin
free -h

# Daha fazla swap ekleyin (bkz. Adım 5)
# Veya Pi üzerinde çalışan hizmet sayısını azaltın
```

### Yavaş performans

- SD kart yerine USB SSD kullanın
- Kullanılmayan hizmetleri devre dışı bırakın: `sudo systemctl disable cups bluetooth avahi-daemon`
- CPU throttling durumunu kontrol edin: `vcgencmd get_throttled` (`0x0` döndürmelidir)

### Hizmet başlamıyor

```bash
# Günlükleri kontrol edin
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# Yaygın düzeltme: yeniden derleyin
cd ~/openclaw  # hacklenebilir kurulum kullanıyorsanız
npm run build
systemctl --user restart openclaw-gateway.service
```

### ARM ikili dosya sorunları

Bir skill "exec format error" ile başarısız olursa:

1. İkili dosyanın ARM64 derlemesi olup olmadığını kontrol edin
2. Kaynaktan derlemeyi deneyin
3. Veya ARM destekli bir Docker container kullanın

### WiFi kopmaları

WiFi kullanan headless Pi’ler için:

```bash
# WiFi güç yönetimini kapatın
sudo iwconfig wlan0 power off

# Kalıcı hale getirin
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## Maliyet karşılaştırması

| Kurulum         | Tek seferlik maliyet | Aylık maliyet | Notlar                    |
| --------------- | -------------------- | ------------- | ------------------------- |
| **Pi 4 (2GB)**  | ~$45                 | $0            | + elektrik (~$5/yıl)      |
| **Pi 4 (4GB)**  | ~$55                 | $0            | Önerilir                  |
| **Pi 5 (4GB)**  | ~$60                 | $0            | En iyi performans         |
| **Pi 5 (8GB)**  | ~$80                 | $0            | Gereğinden fazla ama geleceğe dönük |
| DigitalOcean    | $0                   | $6/ay         | $72/yıl                   |
| Hetzner         | $0                   | €3.79/ay      | ~$50/yıl                  |

**Başabaş noktası:** Bir Pi, bulut VPS’e kıyasla yaklaşık 6-12 ay içinde kendini amorti eder.

---

## Ayrıca bkz.

- [Linux guide](/platforms/linux) — genel Linux kurulumu
- [DigitalOcean guide](/tr/install/digitalocean) — bulut alternatifi
- [Hetzner guide](/tr/install/hetzner) — Docker kurulumu
- [Tailscale](/tr/gateway/tailscale) — uzaktan erişim
- [Nodes](/nodes) — dizüstü bilgisayarınızı/telefonunuzu Pi gateway ile eşleştirin

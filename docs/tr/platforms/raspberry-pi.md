---
read_when:
    - Raspberry Pi üzerinde OpenClaw kurma
    - OpenClaw'ı ARM cihazlarda çalıştırma
    - Ucuz, her zaman açık kişisel bir AI kurma
summary: Raspberry Pi üzerinde OpenClaw (düşük bütçeli self-hosted kurulum)
title: Raspberry Pi (platform)
x-i18n:
    generated_at: "2026-04-24T09:20:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 79a2e8edf3c2853deddece8d52dc87b9a5800643b4d866acd80db3a83ca9b270
    source_path: platforms/raspberry-pi.md
    workflow: 15
---

# Raspberry Pi üzerinde OpenClaw

## Amaç

Raspberry Pi üzerinde **yaklaşık 35-80$** tek seferlik maliyetle (aylık ücret olmadan) kalıcı, her zaman açık bir OpenClaw Gateway çalıştırın.

Şunlar için mükemmeldir:

- 7/24 kişisel AI asistanı
- Ev otomasyonu merkezi
- Düşük güç tüketimli, her zaman erişilebilir Telegram/WhatsApp botu

## Donanım Gereksinimleri

| Pi Modeli       | RAM     | Çalışır mı? | Notlar                             |
| --------------- | ------- | ----------- | ---------------------------------- |
| **Pi 5**        | 4GB/8GB | ✅ En iyisi | En hızlı, önerilen                 |
| **Pi 4**        | 4GB     | ✅ İyi      | Çoğu kullanıcı için ideal denge    |
| **Pi 4**        | 2GB     | ✅ Uygun    | Çalışır, swap ekleyin              |
| **Pi 4**        | 1GB     | ⚠️ Dar      | Swap ile mümkün, minimal yapılandırma |
| **Pi 3B+**      | 1GB     | ⚠️ Yavaş    | Çalışır ama hantaldır              |
| **Pi Zero 2 W** | 512MB   | ❌          | Önerilmez                          |

**Minimum özellikler:** 1GB RAM, 1 çekirdek, 500MB disk  
**Önerilen:** 2GB+ RAM, 64-bit OS, 16GB+ SD kart (veya USB SSD)

## Gerekenler

- Raspberry Pi 4 veya 5 (2GB+ önerilir)
- MicroSD kart (16GB+) veya USB SSD (daha iyi performans)
- Güç kaynağı (resmi Pi PSU önerilir)
- Ağ bağlantısı (Ethernet veya WiFi)
- Yaklaşık 30 dakika

## 1) OS'yi yazdırın

**Raspberry Pi OS Lite (64-bit)** kullanın — başsız sunucu için masaüstü gerekmez.

1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/) indirin
2. OS olarak **Raspberry Pi OS Lite (64-bit)** seçin
3. Ön yapılandırma için dişli simgesine (⚙️) tıklayın:
   - Ana makine adını ayarlayın: `gateway-host`
   - SSH'yi etkinleştirin
   - Kullanıcı adı/parola ayarlayın
   - WiFi yapılandırın (Ethernet kullanmıyorsanız)
4. SD kartınıza / USB sürücünüze yazdırın
5. Pi'yi takın ve başlatın

## 2) SSH ile bağlanın

```bash
ssh user@gateway-host
# veya IP adresini kullanın
ssh user@192.168.x.x
```

## 3) Sistem Kurulumu

```bash
# Sistemi güncelle
sudo apt update && sudo apt upgrade -y

# Temel paketleri kur
sudo apt install -y git curl build-essential

# Saat dilimini ayarla (cron/hatırlatıcılar için önemli)
sudo timedatectl set-timezone America/Chicago  # Kendi saat diliminizle değiştirin
```

## 4) Node.js 24 kurun (ARM64)

```bash
# NodeSource üzerinden Node.js kur
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Doğrula
node --version  # v24.x.x göstermeli
npm --version
```

## 5) Swap ekleyin (2GB veya altı için önemli)

Swap, bellek yetersizliği çöküşlerini önler:

```bash
# 2GB swap dosyası oluştur
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Kalıcı yap
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Düşük RAM için optimize et (swappiness azalt)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) OpenClaw'ı kurun

### Seçenek A: Standart kurulum (önerilen)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### Seçenek B: Hackable kurulum (kurcalamak için)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

Hackable kurulum size günlükler ve koda doğrudan erişim verir — ARM'e özgü sorunları hata ayıklamak için yararlıdır.

## 7) İlk katılımı çalıştırın

```bash
openclaw onboard --install-daemon
```

Sihirbazı izleyin:

1. **Gateway modu:** Local
2. **Auth:** API anahtarları önerilir (OAuth başsız Pi üzerinde nazlı olabilir)
3. **Kanallar:** Başlamak için en kolayı Telegram'dır
4. **Daemon:** Evet (systemd)

## 8) Kurulumu doğrulayın

```bash
# Durumu kontrol et
openclaw status

# Hizmeti kontrol et (standart kurulum = systemd user unit)
systemctl --user status openclaw-gateway.service

# Günlükleri görüntüle
journalctl --user -u openclaw-gateway.service -f
```

## 9) OpenClaw Panosuna erişin

`user@gateway-host` kısmını Pi kullanıcı adınız ve ana makine adınız veya IP adresinizle değiştirin.

Bilgisayarınızda, Pi'den yeni bir pano URL'si yazdırmasını isteyin:

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

Ardından yazdırılan Dashboard URL'sini yerel tarayıcınızda açın.

UI paylaşılan gizli anahtar auth isterse, yapılandırılmış belirteci veya parolayı
Control UI ayarlarına yapıştırın. Belirteç auth için `gateway.auth.token` (veya
`OPENCLAW_GATEWAY_TOKEN`) kullanın.

Her zaman açık uzak erişim için bkz. [Tailscale](/tr/gateway/tailscale).

---

## Performans Optimizasyonları

### USB SSD kullanın (büyük iyileştirme)

SD kartlar yavaştır ve çabuk yıpranır. Bir USB SSD performansı dramatik biçimde artırır:

```bash
# USB'den önyüklenip önyüklenmediğini kontrol et
lsblk
```

Kurulum için [Pi USB boot guide](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) sayfasına bakın.

### CLI başlangıcını hızlandırın (modül derleme önbelleği)

Düşük güçlü Pi ana makinelerinde, yinelenen CLI çalıştırmalarını hızlandırmak için Node'un modül derleme önbelleğini etkinleştirin:

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
- `OPENCLAW_NO_RESPAWN=1`, CLI kendi kendini yeniden başlatmasından gelen ek başlangıç maliyetini önler.
- İlk çalıştırma önbelleği ısıtır; sonraki çalıştırmalar en çok bundan yararlanır.

### systemd başlangıç ayarı (isteğe bağlı)

Bu Pi çoğunlukla OpenClaw çalıştırıyorsa, yeniden başlatma
jitter'ını azaltmak ve başlangıç ortamını kararlı tutmak için hizmete bir drop-in ekleyin:

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

Mümkünse soğuk başlangıçlarda SD kart
rastgele I/O darboğazlarını önlemek için OpenClaw durumunu/önbelleğini SSD destekli depolama üzerinde tutun.

Bu başsız bir Pi ise, kullanıcı hizmetinin oturum kapatmadan sonra da yaşaması için bir kez lingering etkinleştirin:

```bash
sudo loginctl enable-linger "$(whoami)"
```

`Restart=` ilkelerinin otomatik kurtarmaya nasıl yardımcı olduğu:
[systemd hizmet kurtarmasını otomatikleştirebilir](https://www.redhat.com/en/blog/systemd-automate-recovery).

### Bellek kullanımını azaltın

```bash
# GPU bellek ayırmayı devre dışı bırak (başsız)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Gerek yoksa Bluetooth'u devre dışı bırak
sudo systemctl disable bluetooth
```

### Kaynakları izleyin

```bash
# Belleği kontrol et
free -h

# CPU sıcaklığını kontrol et
vcgencmd measure_temp

# Canlı izleme
htop
```

---

## ARM'e özgü Notlar

### İkili uyumluluğu

Çoğu OpenClaw özelliği ARM64 üzerinde çalışır, ancak bazı harici ikililer ARM derlemeleri gerektirebilir:

| Araç               | ARM64 Durumu | Notlar                              |
| ------------------ | ------------ | ----------------------------------- |
| Node.js            | ✅           | Çok iyi çalışır                     |
| WhatsApp (Baileys) | ✅           | Saf JS, sorun yok                   |
| Telegram           | ✅           | Saf JS, sorun yok                   |
| gog (Gmail CLI)    | ⚠️           | ARM sürümü olup olmadığını kontrol edin |
| Chromium (tarayıcı) | ✅          | `sudo apt install chromium-browser` |

Bir skill başarısız olursa, ikilisinin ARM derlemesi olup olmadığını kontrol edin. Birçok Go/Rust aracı vardır; bazılarında yoktur.

### 32-bit ve 64-bit

**Her zaman 64-bit OS kullanın.** Node.js ve birçok modern araç buna ihtiyaç duyar. Şununla kontrol edin:

```bash
uname -m
# Şunu göstermeli: aarch64 (64-bit), armv7l (32-bit) değil
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

**Pi üzerinde yerel LLM çalıştırmaya çalışmayın** — küçük modeller bile çok yavaştır. Ağır işi Claude/GPT'ye bırakın.

---

## Önyüklemede otomatik başlatma

İlk katılım bunu kurar, ama doğrulamak için:

```bash
# Hizmet etkin mi kontrol et
systemctl --user is-enabled openclaw-gateway.service

# Değilse etkinleştir
systemctl --user enable openclaw-gateway.service

# Önyüklemede başlat
systemctl --user start openclaw-gateway.service
```

---

## Sorun giderme

### Bellek yetersizliği (OOM)

```bash
# Belleği kontrol et
free -h

# Daha fazla swap ekle (5. adıma bakın)
# Veya Pi üzerinde çalışan hizmetleri azaltın
```

### Yavaş performans

- SD kart yerine USB SSD kullanın
- Kullanılmayan hizmetleri devre dışı bırakın: `sudo systemctl disable cups bluetooth avahi-daemon`
- CPU kısıtlamasını kontrol edin: `vcgencmd get_throttled` (`0x0` döndürmelidir)

### Hizmet başlamıyor

```bash
# Günlükleri kontrol et
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# Yaygın düzeltme: yeniden derle
cd ~/openclaw  # hackable kurulum kullanıyorsanız
npm run build
systemctl --user restart openclaw-gateway.service
```

### ARM ikili sorunları

Bir skill "exec format error" ile başarısız olursa:

1. İkilinin ARM64 derlemesi olup olmadığını kontrol edin
2. Kaynaktan derlemeyi deneyin
3. Veya ARM desteği olan Docker kapsayıcısı kullanın

### WiFi kopmaları

WiFi kullanan başsız Pi'ler için:

```bash
# WiFi güç yönetimini devre dışı bırak
sudo iwconfig wlan0 power off

# Kalıcı yap
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## Maliyet karşılaştırması

| Kurulum         | Tek Seferlik Maliyet | Aylık Maliyet | Notlar                     |
| --------------- | -------------------- | ------------- | -------------------------- |
| **Pi 4 (2GB)**  | ~$45                 | $0            | + elektrik (~$5/yıl)       |
| **Pi 4 (4GB)**  | ~$55                 | $0            | Önerilen                   |
| **Pi 5 (4GB)**  | ~$60                 | $0            | En iyi performans          |
| **Pi 5 (8GB)**  | ~$80                 | $0            | Fazla ama geleceğe dayanıklı |
| DigitalOcean    | $0                   | $6/ay         | $72/yıl                    |
| Hetzner         | $0                   | €3.79/ay      | ~$50/yıl                   |

**Başabaş noktası:** Pi, bulut VPS'e kıyasla kendini yaklaşık 6-12 ayda amorti eder.

---

## İlgili

- [Linux kılavuzu](/tr/platforms/linux) — genel Linux kurulumu
- [DigitalOcean kılavuzu](/tr/install/digitalocean) — bulut alternatifi
- [Hetzner kılavuzu](/tr/install/hetzner) — Docker kurulumu
- [Tailscale](/tr/gateway/tailscale) — uzak erişim
- [Node'lar](/tr/nodes) — dizüstü bilgisayarınızı/telefonunuzu Pi gateway ile eşleştirin

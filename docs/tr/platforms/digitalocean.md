---
read_when:
    - DigitalOcean üzerinde OpenClaw kurulumu yapma
    - OpenClaw için ucuz VPS barındırma arama
summary: DigitalOcean üzerinde OpenClaw (basit ücretli VPS seçeneği)
title: DigitalOcean (Platform)
x-i18n:
    generated_at: "2026-04-05T14:00:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ee4ad84c421f87064534a4fb433df1f70304502921841ec618318ed862d4092
    source_path: platforms/digitalocean.md
    workflow: 15
---

# DigitalOcean üzerinde OpenClaw

## Amaç

DigitalOcean üzerinde **aylık 6 $** karşılığında kalıcı bir OpenClaw Gateway çalıştırın (veya rezerve fiyatlandırma ile aylık 4 $).

Aylık 0 $ maliyetli bir seçenek istiyorsanız ve ARM + sağlayıcıya özgü kurulumla uğraşmayı sorun etmiyorsanız, [Oracle Cloud kılavuzuna](/tr/install/oracle) bakın.

## Maliyet Karşılaştırması (2026)

| Sağlayıcı    | Plan            | Özellikler             | Aylık fiyat | Notlar                                |
| ------------ | --------------- | ---------------------- | ----------- | ------------------------------------- |
| Oracle Cloud | Always Free ARM | en fazla 4 OCPU, 24GB RAM | $0          | ARM, sınırlı kapasite / kayıt zorlukları |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM        | €3.79 (~$4) | En ucuz ücretli seçenek               |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM        | $6          | Kolay arayüz, iyi dokümantasyon       |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM        | $6          | Çok sayıda konum                      |
| Linode       | Nanode          | 1 vCPU, 1GB RAM        | $5          | Artık Akamai'nin bir parçası          |

**Bir sağlayıcı seçme:**

- DigitalOcean: en basit kullanıcı deneyimi + öngörülebilir kurulum (bu kılavuz)
- Hetzner: iyi fiyat/performans ([Hetzner kılavuzuna](/tr/install/hetzner) bakın)
- Oracle Cloud: aylık 0 $ olabilir, ancak daha kaprislidir ve yalnızca ARM destekler ([Oracle kılavuzuna](/tr/install/oracle) bakın)

---

## Ön koşullar

- DigitalOcean hesabı ([200 $ ücretsiz krediyle kaydolun](https://m.do.co/c/signup))
- SSH anahtar çifti (veya parola kimlik doğrulamasını kullanmaya istekli olmak)
- ~20 dakika

## 1) Bir Droplet oluşturun

<Warning>
Temiz bir temel imaj kullanın (Ubuntu 24.04 LTS). Başlangıç betiklerini ve güvenlik duvarı varsayılanlarını incelemediğiniz sürece üçüncü taraf Marketplace 1 tıkla imajlardan kaçının.
</Warning>

1. [DigitalOcean](https://cloud.digitalocean.com/) hesabınıza giriş yapın
2. **Create → Droplets** seçeneğine tıklayın
3. Şunları seçin:
   - **Region:** Size (veya kullanıcılarınıza) en yakın olan
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic → Regular → **$6/mo** (1 vCPU, 1GB RAM, 25GB SSD)
   - **Authentication:** SSH anahtarı (önerilir) veya parola
4. **Create Droplet** seçeneğine tıklayın
5. IP adresini not edin

## 2) SSH ile bağlanın

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) OpenClaw'ı yükleyin

```bash
# Sistemi güncelle
apt update && apt upgrade -y

# Node.js 24 yükle
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# OpenClaw'ı yükle
curl -fsSL https://openclaw.ai/install.sh | bash

# Doğrula
openclaw --version
```

## 4) İlk kurulumu çalıştırın

```bash
openclaw onboard --install-daemon
```

Sihirbaz size şu adımlarda yol gösterecektir:

- Model kimlik doğrulaması (API anahtarları veya OAuth)
- Kanal kurulumu (Telegram, WhatsApp, Discord vb.)
- Gateway belirteci (otomatik oluşturulur)
- Daemon kurulumu (systemd)

## 5) Gateway'i doğrulayın

```bash
# Durumu kontrol et
openclaw status

# Hizmeti kontrol et
systemctl --user status openclaw-gateway.service

# Günlükleri görüntüle
journalctl --user -u openclaw-gateway.service -f
```

## 6) Dashboard'a erişin

Gateway varsayılan olarak loopback'e bağlanır. Control UI'a erişmek için:

**Seçenek A: SSH Tüneli (önerilir)**

```bash
# Yerel makinenizden
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Ardından açın: http://localhost:18789
```

**Seçenek B: Tailscale Serve (HTTPS, yalnızca loopback)**

```bash
# Droplet üzerinde
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Gateway'i Tailscale Serve kullanacak şekilde yapılandır
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

Açın: `https://<magicdns>/`

Notlar:

- Serve, Gateway'i yalnızca loopback'te tutar ve Tailscale kimlik başlıkları aracılığıyla Control UI/WebSocket trafiğinin kimliğini doğrular (belirteçsiz kimlik doğrulaması güvenilir gateway host varsayar; HTTP API'leri bu Tailscale başlıklarını kullanmaz ve bunun yerine gateway'in normal HTTP kimlik doğrulama modunu izler).
- Bunun yerine açık paylaşımlı gizli anahtar kimlik bilgileri gerektirmek için `gateway.auth.allowTailscale: false` ayarlayın ve `gateway.auth.mode: "token"` veya `"password"` kullanın.

**Seçenek C: Tailnet bind (Serve yok)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

Açın: `http://<tailscale-ip>:18789` (belirteç gereklidir).

## 7) Kanallarınızı bağlayın

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# QR kodunu tarayın
```

Diğer sağlayıcılar için [Kanallar](/tr/channels) bölümüne bakın.

---

## 1GB RAM için optimizasyonlar

6 dolarlık droplet yalnızca 1GB RAM'e sahiptir. Her şeyin sorunsuz çalışmasını sağlamak için:

### Swap ekleyin (önerilir)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Daha hafif bir model kullanın

OOM hataları alıyorsanız, şunları değerlendirin:

- Yerel modeller yerine API tabanlı modeller kullanmak (Claude, GPT)
- `agents.defaults.model.primary` değerini daha küçük bir modele ayarlamak

### Belleği izleyin

```bash
free -h
htop
```

---

## Kalıcılık

Tüm durum verileri şurada tutulur:

- `~/.openclaw/` — `openclaw.json`, aracı başına `auth-profiles.json`, kanal/sağlayıcı durumu ve oturum verileri
- `~/.openclaw/workspace/` — çalışma alanı (SOUL.md, bellek vb.)

Bunlar yeniden başlatmalardan sonra korunur. Bunları düzenli olarak yedekleyin:

```bash
openclaw backup create
```

---

## Oracle Cloud ücretsiz alternatifi

Oracle Cloud, burada yer alan herhangi bir ücretli seçenekten çok daha güçlü olan **Always Free** ARM instance'ları sunar — aylık 0 $ karşılığında.

| Elde edeceğiniz | Özellikler             |
| --------------- | ---------------------- |
| **4 OCPU**      | ARM Ampere A1          |
| **24GB RAM**    | Fazlasıyla yeterli     |
| **200GB storage** | Blok depolama        |
| **Süresiz ücretsiz** | Kredi kartı ücreti yok |

**Dikkat edilmesi gerekenler:**

- Kayıt işlemi sorunlu olabilir (başarısız olursa yeniden deneyin)
- ARM mimarisi — çoğu şey çalışır, ancak bazı ikili dosyalar ARM sürümleri gerektirir

Tam kurulum kılavuzu için [Oracle Cloud](/tr/install/oracle) bölümüne bakın. Kayıt ipuçları ve kayıt süreciyle ilgili sorun giderme için bu [topluluk kılavuzuna](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) bakın.

---

## Sorun giderme

### Gateway başlamıyor

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service --no-pager -n 50
```

### Bağlantı noktası zaten kullanımda

```bash
lsof -i :18789
kill <PID>
```

### Bellek yetersiz

```bash
# Belleği kontrol et
free -h

# Daha fazla swap ekle
# Veya 12 $/ay droplet'e yükseltin (2GB RAM)
```

---

## Ayrıca bakın

- [Hetzner kılavuzu](/tr/install/hetzner) — daha ucuz, daha güçlü
- [Docker kurulumu](/tr/install/docker) — container tabanlı kurulum
- [Tailscale](/tr/gateway/tailscale) — güvenli uzaktan erişim
- [Yapılandırma](/tr/gateway/configuration) — tam yapılandırma başvurusu

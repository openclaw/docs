---
read_when:
    - DigitalOcean üzerinde OpenClaw kurulumu
    - OpenClaw için ucuz VPS barındırma arıyorsunuz
summary: DigitalOcean üzerinde OpenClaw (basit ücretli VPS seçeneği)
title: DigitalOcean (platform)
x-i18n:
    generated_at: "2026-04-24T09:18:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9d286f243f38ed910a3229f195be724f9f96481036380d8c8194ff298d39c87
    source_path: platforms/digitalocean.md
    workflow: 15
---

# DigitalOcean üzerinde OpenClaw

## Hedef

DigitalOcean üzerinde **ayda 6 $** karşılığında (veya rezerve fiyatlandırma ile ayda 4 $) kalıcı bir OpenClaw Gateway çalıştırmak.

Ayda 0 $'lık bir seçenek istiyorsanız ve ARM + sağlayıcıya özgü kurulum sizi rahatsız etmiyorsa [Oracle Cloud kılavuzu](/tr/install/oracle) belgesine bakın.

## Maliyet karşılaştırması (2026)

| Sağlayıcı    | Plan            | Özellikler              | Aylık fiyat | Notlar                                 |
| ------------ | --------------- | ----------------------- | ----------- | -------------------------------------- |
| Oracle Cloud | Always Free ARM | en fazla 4 OCPU, 24GB RAM | $0        | ARM, sınırlı kapasite / kayıt zorlukları |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM         | €3.79 (~$4) | En ucuz ücretli seçenek                |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM         | $6          | Kolay arayüz, iyi belgeler             |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM         | $6          | Çok sayıda konum                       |
| Linode       | Nanode          | 1 vCPU, 1GB RAM         | $5          | Artık Akamai'nin parçası               |

**Sağlayıcı seçimi:**

- DigitalOcean: en basit kullanıcı deneyimi + öngörülebilir kurulum (bu kılavuz)
- Hetzner: iyi fiyat/performans (bkz. [Hetzner kılavuzu](/tr/install/hetzner))
- Oracle Cloud: ayda 0 $ olabilir, ancak daha hassastır ve yalnızca ARM'dir (bkz. [Oracle kılavuzu](/tr/install/oracle))

---

## Önkoşullar

- DigitalOcean hesabı ([200 $ ücretsiz kredi ile kayıt](https://m.do.co/c/signup))
- SSH anahtar çifti (veya parola kimlik doğrulaması kullanmaya istekli olma)
- ~20 dakika

## 1) Bir Droplet oluşturun

<Warning>
Temiz bir temel imaj kullanın (Ubuntu 24.04 LTS). Başlangıç betiklerini ve güvenlik duvarı varsayılanlarını incelemediğiniz sürece üçüncü taraf Marketplace tek tıklama imajlarından kaçının.
</Warning>

1. [DigitalOcean](https://cloud.digitalocean.com/) hesabınıza giriş yapın
2. **Create → Droplets** seçeneğine tıklayın
3. Şunları seçin:
   - **Region:** Size (veya kullanıcılarınıza) en yakın bölge
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic → Regular → **$6/mo** (1 vCPU, 1GB RAM, 25GB SSD)
   - **Authentication:** SSH anahtarı (önerilir) veya parola
4. **Create Droplet** seçeneğine tıklayın
5. IP adresini not edin

## 2) SSH ile bağlanın

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) OpenClaw'ı kurun

```bash
# Sistemi güncelle
apt update && apt upgrade -y

# Node.js 24 kur
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# OpenClaw kur
curl -fsSL https://openclaw.ai/install.sh | bash

# Doğrula
openclaw --version
```

## 4) İlk kullanım akışını çalıştırın

```bash
openclaw onboard --install-daemon
```

Sihirbaz size şu konularda rehberlik eder:

- Model kimlik doğrulaması (API anahtarları veya OAuth)
- Kanal kurulumu (Telegram, WhatsApp, Discord vb.)
- Gateway token'ı (otomatik üretilir)
- Daemon kurulumu (systemd)

## 5) Gateway'i doğrulayın

```bash
# Durumu denetle
openclaw status

# Hizmeti denetle
systemctl --user status openclaw-gateway.service

# Günlükleri görüntüle
journalctl --user -u openclaw-gateway.service -f
```

## 6) Dashboard'a erişin

Gateway varsayılan olarak loopback'e bağlanır. Control UI'ye erişmek için:

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

- Serve, Gateway'i yalnızca loopback olarak tutar ve Control UI/WebSocket trafiğinin kimliğini Tailscale identity başlıkları üzerinden doğrular (tokensız kimlik doğrulama, güvenilen gateway ana makinesini varsayar; HTTP API'leri bu Tailscale başlıklarını kullanmaz ve bunun yerine gateway'in normal HTTP kimlik doğrulama modunu izler).
- Bunun yerine açık paylaşılan gizli anahtar kimlik bilgileri zorunlu olsun istiyorsanız `gateway.auth.allowTailscale: false` ayarlayın ve `gateway.auth.mode: "token"` veya `"password"` kullanın.

**Seçenek C: Tailnet bind (Serve yok)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

Açın: `http://<tailscale-ip>:18789` (token gerekir).

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

Diğer sağlayıcılar için bkz. [Channels](/tr/channels).

---

## 1GB RAM için optimizasyonlar

6 $'lık droplet yalnızca 1GB RAM'e sahiptir. Her şeyin sorunsuz çalışmasını sağlamak için:

### Swap ekleyin (önerilir)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Daha hafif bir model kullanın

OOM sorunları yaşıyorsanız şunları değerlendirin:

- Yerel modeller yerine API tabanlı modeller kullanmak (Claude, GPT)
- `agents.defaults.model.primary` değerini daha küçük bir modele ayarlamak

### Belleği izleyin

```bash
free -h
htop
```

---

## Kalıcılık

Tüm durum şu konumlarda bulunur:

- `~/.openclaw/` — `openclaw.json`, agent başına `auth-profiles.json`, kanal/sağlayıcı durumu ve oturum verileri
- `~/.openclaw/workspace/` — çalışma alanı (`SOUL.md`, bellek vb.)

Bunlar yeniden başlatmalardan sonra da korunur. Düzenli olarak yedekleyin:

```bash
openclaw backup create
```

---

## Ücretsiz Oracle Cloud alternatifi

Oracle Cloud, burada listelenen ücretli seçeneklerin herhangi birinden belirgin biçimde daha güçlü olan **Always Free** ARM instance'ları sunar — ayda 0 $ karşılığında.

| Ne elde edersiniz | Özellikler             |
| ----------------- | ---------------------- |
| **4 OCPU**        | ARM Ampere A1          |
| **24GB RAM**      | Fazlasıyla yeterli     |
| **200GB storage** | Block volume           |
| **Forever free**  | Kredi kartı ücreti yok |

**Dikkat edilmesi gerekenler:**

- Kayıt süreci hassas olabilir (başarısız olursa yeniden deneyin)
- ARM mimarisi — çoğu şey çalışır, ancak bazı ikili dosyalar ARM derlemeleri gerektirir

Tam kurulum kılavuzu için bkz. [Oracle Cloud](/tr/install/oracle). Kayıt ipuçları ve kayıt süreci sorun giderme için bu [topluluk kılavuzuna](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) bakın.

---

## Sorun giderme

### Gateway başlamıyor

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service --no-pager -n 50
```

### Port zaten kullanımda

```bash
lsof -i :18789
kill <PID>
```

### Bellek yetersiz

```bash
# Belleği denetle
free -h

# Daha fazla swap ekle
# Veya ayda 12 $'lık droplet'e yükselt (2GB RAM)
```

---

## İlgili

- [Hetzner kılavuzu](/tr/install/hetzner) — daha ucuz, daha güçlü
- [Docker kurulumu](/tr/install/docker) — kapsayıcılaştırılmış kurulum
- [Tailscale](/tr/gateway/tailscale) — güvenli uzak erişim
- [Yapılandırma](/tr/gateway/configuration) — tam yapılandırma başvurusu

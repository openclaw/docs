---
read_when:
    - DigitalOcean'da OpenClaw Kurulumu
    - OpenClaw için ucuz VPS barındırma arayışı
summary: DigitalOcean üzerinde OpenClaw (basit ücretli VPS seçeneği)
title: DigitalOcean (platform)
x-i18n:
    generated_at: "2026-04-30T09:32:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13df486b81590d6350f4b33f5460069fee21881631970d5f4ae34f6ce956407e
    source_path: platforms/digitalocean.md
    workflow: 16
---

# DigitalOcean'da OpenClaw

## Hedef

DigitalOcean üzerinde **$6/ay** karşılığında (veya rezerve fiyatlandırmayla $4/ay) kalıcı bir OpenClaw Gateway çalıştırın.

$0/ay seçeneği istiyorsanız ve ARM + sağlayıcıya özgü kurulum sizin için sorun değilse [Oracle Cloud kılavuzuna](/tr/install/oracle) bakın.

## Maliyet karşılaştırması (2026)

| Sağlayıcı    | Plan            | Özellikler            | Fiyat/ay    | Notlar                                |
| ------------ | --------------- | --------------------- | ----------- | ------------------------------------- |
| Oracle Cloud | Always Free ARM | 4 OCPU'ya kadar, 24GB RAM | $0       | ARM, sınırlı kapasite / kayıt tuhaflıkları |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM       | €3.79 (~$4) | En ucuz ücretli seçenek               |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM       | $6          | Kolay UI, iyi dokümantasyon           |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM       | $6          | Çok sayıda konum                      |
| Linode       | Nanode          | 1 vCPU, 1GB RAM       | $5          | Artık Akamai'nin parçası              |

**Sağlayıcı seçimi:**

- DigitalOcean: en basit kullanıcı deneyimi + öngörülebilir kurulum (bu kılavuz)
- Hetzner: iyi fiyat/performans (bkz. [Hetzner kılavuzu](/tr/install/hetzner))
- Oracle Cloud: $0/ay olabilir, ancak daha nazlıdır ve yalnızca ARM destekler (bkz. [Oracle kılavuzu](/tr/install/oracle))

---

## Önkoşullar

- DigitalOcean hesabı ([$200 ücretsiz krediyle kaydolun](https://m.do.co/c/signup))
- SSH anahtar çifti (veya parola kimlik doğrulaması kullanma isteği)
- ~20 dakika

## 1) Bir Droplet oluşturun

<Warning>
Temiz bir temel imaj kullanın (Ubuntu 24.04 LTS). Başlatma betiklerini ve güvenlik duvarı varsayılanlarını incelemediyseniz üçüncü taraf Marketplace tek tık imajlarından kaçının.
</Warning>

1. [DigitalOcean](https://cloud.digitalocean.com/) hesabınıza giriş yapın
2. **Create → Droplets** seçeneğine tıklayın
3. Şunları seçin:
   - **Bölge:** Size (veya kullanıcılarınıza) en yakın olan
   - **İmaj:** Ubuntu 24.04 LTS
   - **Boyut:** Basic → Regular → **$6/ay** (1 vCPU, 1GB RAM, 25GB SSD)
   - **Kimlik doğrulama:** SSH anahtarı (önerilir) veya parola
4. **Create Droplet** seçeneğine tıklayın
5. IP adresini not edin

## 2) SSH üzerinden bağlanın

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) OpenClaw yükleyin

```bash
# Sistemi güncelle
apt update && apt upgrade -y

# Node.js 24 yükle
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# OpenClaw yükle
curl -fsSL https://openclaw.ai/install.sh | bash

# Doğrula
openclaw --version
```

## 4) Onboarding çalıştırın

```bash
openclaw onboard --install-daemon
```

Sihirbaz size şunlarda yol gösterecek:

- Model kimlik doğrulaması (API anahtarları veya OAuth)
- Kanal kurulumu (Telegram, WhatsApp, Discord vb.)
- Gateway belirteci (otomatik oluşturulur)
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

Gateway varsayılan olarak loopback'e bağlanır. Kontrol arayüzüne erişmek için:

**Seçenek A: SSH tüneli (önerilir)**

```bash
# Yerel makinenizden
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Sonra şunu açın: http://localhost:18789
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

- Serve, Gateway'i yalnızca loopback'te tutar ve Kontrol arayüzü/WebSocket trafiğini Tailscale kimlik başlıkları üzerinden doğrular (belirteçsiz kimlik doğrulaması güvenilen Gateway host'unu varsayar; HTTP API'leri bu Tailscale başlıklarını kullanmaz ve bunun yerine Gateway'in normal HTTP kimlik doğrulama modunu izler).
- Bunun yerine açık paylaşılan gizli kimlik bilgileri zorunlu olsun istiyorsanız `gateway.auth.allowTailscale: false` ayarlayın ve `gateway.auth.mode: "token"` veya `"password"` kullanın.

**Seçenek C: Tailnet bağlama (Serve yok)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

Açın: `http://<tailscale-ip>:18789` (belirteç gerekir).

## 7) Kanallarınızı bağlayın

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# QR kodunu tara
```

Diğer sağlayıcılar için [Kanallar](/tr/channels) bölümüne bakın.

---

## 1GB RAM için optimizasyonlar

$6'lık Droplet yalnızca 1GB RAM'e sahiptir. İşlerin sorunsuz çalışmasını sağlamak için:

### Swap ekleyin (önerilir)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Daha hafif bir model kullanın

OOM sorunlarıyla karşılaşıyorsanız şunları değerlendirin:

- Yerel modeller yerine API tabanlı modeller (Claude, GPT) kullanmak
- `agents.defaults.model.primary` değerini daha küçük bir modele ayarlamak

### Belleği izleyin

```bash
free -h
htop
```

---

## Kalıcılık

Tüm durum şurada bulunur:

- `~/.openclaw/` — `openclaw.json`, ajan başına `auth-profiles.json`, kanal/sağlayıcı durumu ve oturum verileri
- `~/.openclaw/workspace/` — çalışma alanı (SOUL.md, bellek vb.)

Bunlar yeniden başlatmalardan sonra korunur. Düzenli olarak yedekleyin:

```bash
openclaw backup create
```

---

## Oracle Cloud ücretsiz alternatifi

Oracle Cloud, buradaki tüm ücretli seçeneklerden belirgin şekilde daha güçlü olan **Always Free** ARM örnekleri sunar — $0/ay.

| Aldıklarınız       | Özellikler       |
| ------------------ | ---------------- |
| **4 OCPU**         | ARM Ampere A1    |
| **24GB RAM**       | Fazlasıyla yeterli |
| **200GB depolama** | Blok birimi      |
| **Sonsuza dek ücretsiz** | Kredi kartı ücreti yok |

**Dikkat edilmesi gerekenler:**

- Kayıt nazlı olabilir (başarısız olursa tekrar deneyin)
- ARM mimarisi — çoğu şey çalışır, ancak bazı ikili dosyalar ARM derlemeleri gerektirir

Tam kurulum kılavuzu için [Oracle Cloud](/tr/install/oracle) bölümüne bakın. Kayıt ipuçları ve kayıt süreci sorun giderme için bu [topluluk kılavuzuna](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) bakın.

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
# Veya $12/ay Droplet'e yükselt (2GB RAM)
```

---

## İlgili

- [Hetzner kılavuzu](/tr/install/hetzner) — daha ucuz, daha güçlü
- [Docker kurulumu](/tr/install/docker) — container tabanlı kurulum
- [Tailscale](/tr/gateway/tailscale) — güvenli uzaktan erişim
- [Yapılandırma](/tr/gateway/configuration) — tam yapılandırma başvurusu

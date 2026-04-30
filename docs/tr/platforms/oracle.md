---
read_when:
    - Oracle Cloud üzerinde OpenClaw kurulumu
    - OpenClaw için düşük maliyetli VPS barındırma arayışı
    - Küçük bir sunucuda 7/24 OpenClaw çalıştırmak istiyorum
summary: Oracle Cloud’da OpenClaw (Always Free ARM)
title: Oracle Cloud (platform)
x-i18n:
    generated_at: "2026-04-30T09:33:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: d86af91bd924ad08535a21fa481ce551e8c19f1a6cd82b61c335da7a068a09f0
    source_path: platforms/oracle.md
    workflow: 16
---

# Oracle Cloud (OCI) üzerinde OpenClaw

## Amaç

Oracle Cloud'un **Always Free** ARM katmanında kalıcı bir OpenClaw Gateway çalıştırın.

Oracle’ın ücretsiz katmanı OpenClaw için çok uygun olabilir (özellikle zaten bir OCI hesabınız varsa), ancak bazı ödünleri vardır:

- ARM mimarisi (çoğu şey çalışır, ancak bazı ikili dosyalar yalnızca x86 olabilir)
- Kapasite ve kayıt süreci sorunlu olabilir

## Maliyet karşılaştırması (2026)

| Sağlayıcı    | Plan            | Özellikler             | Fiyat/ay | Notlar                    |
| ------------ | --------------- | ---------------------- | -------- | ------------------------- |
| Oracle Cloud | Always Free ARM | 4 OCPU, 24 GB RAM'e kadar | $0       | ARM, sınırlı kapasite     |
| Hetzner      | CX22            | 2 vCPU, 4 GB RAM       | ~ $4     | En ucuz ücretli seçenek   |
| DigitalOcean | Basic           | 1 vCPU, 1 GB RAM       | $6       | Kolay UI, iyi dokümantasyon |
| Vultr        | Cloud Compute   | 1 vCPU, 1 GB RAM       | $6       | Çok sayıda konum          |
| Linode       | Nanode          | 1 vCPU, 1 GB RAM       | $5       | Artık Akamai'nin parçası  |

---

## Ön koşullar

- Oracle Cloud hesabı ([kayıt](https://www.oracle.com/cloud/free/)) — sorun yaşarsanız [topluluk kayıt kılavuzuna](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) bakın
- Tailscale hesabı ([tailscale.com](https://tailscale.com) adresinde ücretsiz)
- ~30 dakika

## 1) Bir OCI Instance oluşturun

1. [Oracle Cloud Console](https://cloud.oracle.com/) içinde oturum açın
2. **Compute → Instances → Create Instance** yoluna gidin
3. Yapılandırın:
   - **Ad:** `openclaw`
   - **İmaj:** Ubuntu 24.04 (aarch64)
   - **Şekil:** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPU'lar:** 2 (veya 4'e kadar)
   - **Bellek:** 12 GB (veya 24 GB'a kadar)
   - **Önyükleme birimi:** 50 GB (200 GB'a kadar ücretsiz)
   - **SSH anahtarı:** Genel anahtarınızı ekleyin
4. **Create** düğmesine tıklayın
5. Genel IP adresini not edin

**İpucu:** Instance oluşturma işlemi "Out of capacity" hatasıyla başarısız olursa farklı bir kullanılabilirlik alanı deneyin veya daha sonra tekrar deneyin. Ücretsiz katman kapasitesi sınırlıdır.

## 2) Bağlanın ve güncelleyin

```bash
# Connect via public IP
ssh ubuntu@YOUR_PUBLIC_IP

# Update system
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**Not:** `build-essential`, bazı bağımlılıkların ARM üzerinde derlenmesi için gereklidir.

## 3) Kullanıcıyı ve ana makine adını yapılandırın

```bash
# Set hostname
sudo hostnamectl set-hostname openclaw

# Set password for ubuntu user
sudo passwd ubuntu

# Enable lingering (keeps user services running after logout)
sudo loginctl enable-linger ubuntu
```

## 4) Tailscale'i kurun

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

Bu, Tailscale SSH'yi etkinleştirir; böylece tailnet’inizdeki herhangi bir cihazdan `ssh openclaw` ile bağlanabilirsiniz — genel IP gerekmez.

Doğrulayın:

```bash
tailscale status
```

**Bundan sonra Tailscale üzerinden bağlanın:** `ssh ubuntu@openclaw` (veya Tailscale IP'sini kullanın).

## 5) OpenClaw'ı kurun

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

"How do you want to hatch your bot?" istemi geldiğinde **"Do this later"** seçeneğini belirleyin.

> Not: ARM yerel derleme sorunları yaşarsanız Homebrew'e geçmeden önce sistem paketleriyle başlayın (ör. `sudo apt install -y build-essential`).

## 6) Gateway'i yapılandırın (loopback + token kimlik doğrulama) ve Tailscale Serve'ü etkinleştirin

Varsayılan olarak token kimlik doğrulamasını kullanın. Öngörülebilirdir ve herhangi bir “insecure auth” Control UI bayrağı gerektirmez.

```bash
# Keep the Gateway private on the VM
openclaw config set gateway.bind loopback

# Require auth for the Gateway + Control UI
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Expose over Tailscale Serve (HTTPS + tailnet access)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

Buradaki `gateway.trustedProxies=["127.0.0.1"]`, yalnızca yerel Tailscale Serve proxy'sinin iletilen IP/yerel istemci işleme davranışı içindir. Bu, `gateway.auth.mode: "trusted-proxy"` **değildir**. Diff görüntüleyici rotaları bu kurulumda kapalı-başarısız davranışı korur: iletilmiş proxy üstbilgileri olmayan ham `127.0.0.1` görüntüleyici istekleri `Diff not found` döndürebilir. Ekler için `mode=file` / `mode=both` kullanın veya paylaşılabilir görüntüleyici bağlantılarına ihtiyacınız varsa uzaktan görüntüleyicileri bilinçli olarak etkinleştirip `plugins.entries.diffs.config.viewerBaseUrl` ayarlayın (veya bir proxy `baseUrl` geçirin).

## 7) Doğrulayın

```bash
# Check version
openclaw --version

# Check daemon status
systemctl --user status openclaw-gateway.service

# Check Tailscale Serve
tailscale serve status

# Test local response
curl http://localhost:18789
```

## 8) VCN güvenliğini sıkılaştırın

Her şey çalıştığına göre, Tailscale dışındaki tüm trafiği engellemek için VCN'i sıkılaştırın. OCI'nin Virtual Cloud Network'ü ağ kenarında bir güvenlik duvarı gibi davranır — trafik instance'ınıza ulaşmadan önce engellenir.

1. OCI Console'da **Networking → Virtual Cloud Networks** bölümüne gidin
2. VCN'inize → **Security Lists** → Default Security List öğesine tıklayın
3. Aşağıdakiler dışındaki tüm giriş kurallarını **kaldırın**:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. Varsayılan çıkış kurallarını koruyun (tüm giden trafiğe izin ver)

Bu, ağ kenarında 22 numaralı bağlantı noktasında SSH'yi, HTTP'yi, HTTPS'yi ve diğer her şeyi engeller. Bundan sonra yalnızca Tailscale üzerinden bağlanabilirsiniz.

---

## Control UI'ya erişin

Tailscale ağınızdaki herhangi bir cihazdan:

```
https://openclaw.<tailnet-name>.ts.net/
```

`<tailnet-name>` değerini tailnet adınızla değiştirin (`tailscale status` içinde görünür).

SSH tüneli gerekmez. Tailscale şunları sağlar:

- HTTPS şifrelemesi (otomatik sertifikalar)
- Tailscale kimliği üzerinden kimlik doğrulama
- Tailnet’inizdeki herhangi bir cihazdan erişim (dizüstü bilgisayar, telefon vb.)

---

## Güvenlik: VCN + Tailscale (önerilen temel yapı)

VCN sıkılaştırılmışken (yalnızca UDP 41641 açık) ve Gateway loopback'e bağlanmışken güçlü bir derinlemesine savunma elde edersiniz: genel trafik ağ kenarında engellenir ve yönetici erişimi tailnet’iniz üzerinden gerçekleşir.

Bu kurulum çoğu zaman, yalnızca İnternet geneli SSH kaba kuvvet saldırılarını durdurmak için ek ana makine tabanlı güvenlik duvarı kurallarına olan _ihtiyacı_ ortadan kaldırır — ancak yine de işletim sistemini güncel tutmalı, `openclaw security audit` çalıştırmalı ve yanlışlıkla herkese açık arayüzlerde dinlemediğinizi doğrulamalısınız.

### Zaten korunanlar

| Geleneksel adım        | Gerekli mi? | Neden                                                                        |
| ---------------------- | ----------- | ---------------------------------------------------------------------------- |
| UFW güvenlik duvarı    | Hayır       | VCN, trafik instance'a ulaşmadan önce engeller                                |
| fail2ban               | Hayır       | 22 numaralı bağlantı noktası VCN'de engellenirse kaba kuvvet saldırısı olmaz  |
| sshd sıkılaştırması    | Hayır       | Tailscale SSH, sshd kullanmaz                                                 |
| Root oturumunu kapatma | Hayır       | Tailscale sistem kullanıcılarını değil, Tailscale kimliğini kullanır          |
| Yalnızca SSH anahtarı kimlik doğrulaması | Hayır | Tailscale, tailnet’iniz üzerinden kimlik doğrular                             |
| IPv6 sıkılaştırması    | Genellikle hayır | VCN/alt ağ ayarlarınıza bağlıdır; gerçekte neyin atanıp açığa çıktığını doğrulayın |

### Yine de önerilenler

- **Kimlik bilgisi izinleri:** `chmod 700 ~/.openclaw`
- **Güvenlik denetimi:** `openclaw security audit`
- **Sistem güncellemeleri:** Düzenli olarak `sudo apt update && sudo apt upgrade`
- **Tailscale'i izleyin:** [Tailscale admin konsolundaki](https://login.tailscale.com/admin) cihazları gözden geçirin

### Güvenlik duruşunu doğrulayın

```bash
# Confirm no public ports listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely
sudo systemctl disable --now ssh
```

---

## Geri dönüş: SSH tüneli

Tailscale Serve çalışmıyorsa bir SSH tüneli kullanın:

```bash
# From your local machine (via Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Ardından `http://localhost:18789` adresini açın.

---

## Sorun giderme

### Instance oluşturma başarısız oluyor ("Out of capacity")

Ücretsiz katman ARM instance'ları popülerdir. Şunları deneyin:

- Farklı kullanılabilirlik alanı
- Yoğun olmayan saatlerde yeniden deneme (sabah erken)
- Şekil seçerken "Always Free" filtresini kullanma

### Tailscale bağlanmıyor

```bash
# Check status
sudo tailscale status

# Re-authenticate
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Gateway başlamıyor

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### Control UI'ya erişilemiyor

```bash
# Verify Tailscale Serve is running
tailscale serve status

# Check gateway is listening
curl http://localhost:18789

# Restart if needed
systemctl --user restart openclaw-gateway.service
```

### ARM ikili dosya sorunları

Bazı araçların ARM derlemeleri olmayabilir. Kontrol edin:

```bash
uname -m  # Should show aarch64
```

Çoğu npm paketi sorunsuz çalışır. İkili dosyalar için `linux-arm64` veya `aarch64` yayınlarını arayın.

---

## Kalıcılık

Tüm durum şurada bulunur:

- `~/.openclaw/` — `openclaw.json`, ajan başına `auth-profiles.json`, kanal/sağlayıcı durumu ve oturum verileri
- `~/.openclaw/workspace/` — çalışma alanı (SOUL.md, bellek, yapıtlar)

Düzenli olarak yedekleyin:

```bash
openclaw backup create
```

---

## İlgili

- [Gateway uzaktan erişim](/tr/gateway/remote) — diğer uzaktan erişim desenleri
- [Tailscale entegrasyonu](/tr/gateway/tailscale) — eksiksiz Tailscale dokümanları
- [Gateway yapılandırması](/tr/gateway/configuration) — tüm yapılandırma seçenekleri
- [DigitalOcean kılavuzu](/tr/install/digitalocean) — ücretli + daha kolay kayıt istiyorsanız
- [Hetzner kılavuzu](/tr/install/hetzner) — Docker tabanlı alternatif

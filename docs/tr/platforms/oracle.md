---
read_when:
    - Oracle Cloud üzerinde OpenClaw kurma
    - OpenClaw için düşük maliyetli VPS barındırma arıyorsunuz
    - Küçük bir sunucuda 7/24 OpenClaw istiyorsunuz
summary: Oracle Cloud üzerinde OpenClaw (Always Free ARM)
title: Oracle Cloud (platform)
x-i18n:
    generated_at: "2026-04-24T09:20:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18b2e55d330457e18bc94f1e7d7744a3cc3b0c0ce99654a61e9871c21e2c3e35
    source_path: platforms/oracle.md
    workflow: 15
---

# Oracle Cloud üzerinde OpenClaw (OCI)

## Amaç

Kalıcı bir OpenClaw Gateway'i Oracle Cloud'un **Always Free** ARM katmanında çalıştırın.

Oracle'ın ücretsiz katmanı OpenClaw için çok uygun olabilir (özellikle zaten bir OCI hesabınız varsa), ancak bazı ödünleşimleri vardır:

- ARM mimarisi (çoğu şey çalışır, ama bazı ikili dosyalar yalnızca x86 olabilir)
- Kapasite ve kayıt süreci nazlı olabilir

## Maliyet Karşılaştırması (2026)

| Sağlayıcı     | Plan            | Özellikler              | Fiyat/ay | Notlar                |
| ------------- | --------------- | ----------------------- | -------- | --------------------- |
| Oracle Cloud  | Always Free ARM | en fazla 4 OCPU, 24GB RAM | $0     | ARM, sınırlı kapasite |
| Hetzner       | CX22            | 2 vCPU, 4GB RAM         | ~ $4     | En ucuz ücretli seçenek |
| DigitalOcean  | Basic           | 1 vCPU, 1GB RAM         | $6       | Kolay UI, iyi belgeler |
| Vultr         | Cloud Compute   | 1 vCPU, 1GB RAM         | $6       | Çok sayıda konum      |
| Linode        | Nanode          | 1 vCPU, 1GB RAM         | $5       | Artık Akamai'nin parçası |

---

## Önkoşullar

- Oracle Cloud hesabı ([kayıt](https://www.oracle.com/cloud/free/)) — sorun yaşarsanız [topluluk kayıt rehberine](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) bakın
- Tailscale hesabı ([tailscale.com](https://tailscale.com) üzerinde ücretsiz)
- ~30 dakika

## 1) Bir OCI Instance oluşturun

1. [Oracle Cloud Console](https://cloud.oracle.com/) içine giriş yapın
2. **Compute → Instances → Create Instance** yoluna gidin
3. Şunları yapılandırın:
   - **Ad:** `openclaw`
   - **İmaj:** Ubuntu 24.04 (aarch64)
   - **Şekil:** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPU'lar:** 2 (veya en fazla 4)
   - **Bellek:** 12 GB (veya en fazla 24 GB)
   - **Boot volume:** 50 GB (en fazla 200 GB ücretsiz)
   - **SSH anahtarı:** Genel anahtarınızı ekleyin
4. **Create** seçeneğine tıklayın
5. Genel IP adresini not edin

**İpucu:** Instance oluşturma "Out of capacity" ile başarısız olursa farklı bir availability domain deneyin veya daha sonra tekrar deneyin. Ücretsiz katman kapasitesi sınırlıdır.

## 2) Bağlanın ve güncelleyin

```bash
# Genel IP üzerinden bağlanın
ssh ubuntu@YOUR_PUBLIC_IP

# Sistemi güncelleyin
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**Not:** `build-essential`, bazı bağımlılıkların ARM derlemesi için gereklidir.

## 3) Kullanıcıyı ve hostname'i yapılandırın

```bash
# Hostname ayarlayın
sudo hostnamectl set-hostname openclaw

# ubuntu kullanıcısı için parola ayarlayın
sudo passwd ubuntu

# Lingering'i etkinleştirin (çıkış yaptıktan sonra kullanıcı hizmetlerini çalışır tutar)
sudo loginctl enable-linger ubuntu
```

## 4) Tailscale kurun

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

Bu, Tailscale SSH'yi etkinleştirir; böylece tailnet'inizdeki herhangi bir cihazdan `ssh openclaw` ile bağlanabilirsiniz — genel IP gerekmez.

Doğrulayın:

```bash
tailscale status
```

**Bundan sonra Tailscale ile bağlanın:** `ssh ubuntu@openclaw` (veya Tailscale IP'sini kullanın).

## 5) OpenClaw'ı kurun

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

"How do you want to hatch your bot?" sorulduğunda **"Do this later"** seçin.

> Not: ARM yerel derleme sorunları yaşarsanız önce Homebrew'e yönelmeden sistem paketleriyle başlayın (ör. `sudo apt install -y build-essential`).

## 6) Gateway'i yapılandırın (loopback + token auth) ve Tailscale Serve'ü etkinleştirin

Varsayılan olarak token kimlik doğrulaması kullanın. Öngörülebilirdir ve "insecure auth" türü Control UI bayraklarına ihtiyaç bırakmaz.

```bash
# Gateway'i VM üzerinde özel tutun
openclaw config set gateway.bind loopback

# Gateway + Control UI için kimlik doğrulama zorunlu olsun
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Tailscale Serve üzerinden açığa çıkarın (HTTPS + tailnet erişimi)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

Buradaki `gateway.trustedProxies=["127.0.0.1"]`, yalnızca yerel Tailscale Serve proxy'sinin yönlendirilmiş IP/yerel istemci işlemesi içindir. Bu, `gateway.auth.mode: "trusted-proxy"` anlamına gelmez. Diff görüntüleyici yolları bu kurulumda fail-closed davranışını korur: yönlendirilmiş proxy üstbilgileri olmayan ham `127.0.0.1` görüntüleyici istekleri `Diff not found` döndürebilir. Ekler için `mode=file` / `mode=both` kullanın veya paylaşılabilir görüntüleyici bağlantılarına ihtiyacınız varsa bilerek uzak görüntüleyicileri etkinleştirip `plugins.entries.diffs.config.viewerBaseUrl` ayarlayın (veya bir proxy `baseUrl` geçin).

## 7) Doğrulayın

```bash
# Sürümü kontrol edin
openclaw --version

# Daemon durumunu kontrol edin
systemctl --user status openclaw-gateway.service

# Tailscale Serve durumunu kontrol edin
tailscale serve status

# Yerel yanıtı test edin
curl http://localhost:18789
```

## 8) VCN Güvenliğini Sıkılaştırın

Artık her şey çalıştığına göre, VCN'yi yalnızca Tailscale'e izin verecek şekilde sıkılaştırın. OCI'nin Virtual Cloud Network'ü ağ kenarında güvenlik duvarı gibi davranır — trafik instance'ınıza ulaşmadan önce engellenir.

1. OCI Console içinde **Networking → Virtual Cloud Networks** yoluna gidin
2. VCN'nizi seçin → **Security Lists** → Default Security List
3. Şunlar dışındaki tüm ingress kurallarını **kaldırın**:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. Varsayılan egress kurallarını koruyun (tüm giden trafiğe izin ver)

Bu, ağ kenarında 22 numaralı porttaki SSH'yi, HTTP'yi, HTTPS'i ve diğer her şeyi engeller. Bundan sonra yalnızca Tailscale üzerinden bağlanabilirsiniz.

---

## Control UI'ye erişin

Tailscale ağınızdaki herhangi bir cihazdan:

```
https://openclaw.<tailnet-name>.ts.net/
```

`<tailnet-name>` yerine tailnet adınızı koyun (`tailscale status` içinde görünür).

SSH tüneli gerekmez. Tailscale şunları sağlar:

- HTTPS şifreleme (otomatik sertifikalar)
- Tailscale kimliği üzerinden kimlik doğrulama
- Tailnet'inizdeki herhangi bir cihazdan erişim (dizüstü bilgisayar, telefon vb.)

---

## Güvenlik: VCN + Tailscale (önerilen temel çizgi)

VCN sıkılaştırılmışken (yalnızca UDP 41641 açık) ve Gateway loopback'e bağlıyken güçlü bir defense-in-depth elde edersiniz: genel trafik ağ kenarında engellenir ve yönetici erişimi tailnet'iniz üzerinden gerçekleşir.

Bu kurulum çoğu zaman internet genelindeki SSH brute force'u durdurmak için ek host tabanlı güvenlik duvarı kurallarına duyulan ihtiyacı _ortadan kaldırır_ — ancak yine de OS'yi güncel tutmalı, `openclaw security audit` çalıştırmalı ve yanlışlıkla genel arayüzlerde dinlemediğinizi doğrulamalısınız.

### Zaten korunmuş olanlar

| Geleneksel Adım     | Gerekli mi? | Neden                                                                      |
| ------------------- | ----------- | -------------------------------------------------------------------------- |
| UFW güvenlik duvarı | Hayır       | Trafik instance'a ulaşmadan önce VCN engeller                              |
| fail2ban            | Hayır       | Port 22 VCN'de engelliyse brute force yok                                  |
| sshd sağlamlaştırma | Hayır       | Tailscale SSH, sshd kullanmaz                                              |
| Root girişini kapat | Hayır       | Tailscale sistem kullanıcılarını değil, Tailscale kimliğini kullanır       |
| Yalnızca SSH anahtarı kimlik doğrulaması | Hayır | Tailscale, tailnet'iniz üzerinden kimlik doğrular              |
| IPv6 sağlamlaştırma | Genellikle hayır | VCN/subnet ayarlarınıza bağlıdır; gerçekte ne atandığını/açıldığını doğrulayın |

### Hâlâ Önerilenler

- **Kimlik bilgisi izinleri:** `chmod 700 ~/.openclaw`
- **Güvenlik denetimi:** `openclaw security audit`
- **Sistem güncellemeleri:** düzenli olarak `sudo apt update && sudo apt upgrade`
- **Tailscale izleme:** [Tailscale admin console](https://login.tailscale.com/admin) içinde cihazları gözden geçirin

### Güvenlik Duruşunu Doğrulayın

```bash
# Hiçbir genel portun dinlemediğini doğrulayın
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Tailscale SSH'nin etkin olduğunu doğrulayın
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# İsteğe bağlı: sshd'yi tamamen devre dışı bırakın
sudo systemctl disable --now ssh
```

---

## Yedek: SSH Tüneli

Tailscale Serve çalışmıyorsa SSH tüneli kullanın:

```bash
# Yerel makinenizden (Tailscale üzerinden)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Ardından `http://localhost:18789` açın.

---

## Sorun giderme

### Instance oluşturma başarısız oluyor ("Out of capacity")

Ücretsiz katman ARM instance'ları popülerdir. Şunları deneyin:

- Farklı availability domain
- Yoğun olmayan saatlerde yeniden deneyin (sabah erken saatler)
- Şekil seçerken "Always Free" filtresini kullanın

### Tailscale bağlanmıyor

```bash
# Durumu kontrol edin
sudo tailscale status

# Yeniden kimlik doğrulayın
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Gateway başlamıyor

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### Control UI'ye ulaşılamıyor

```bash
# Tailscale Serve'ün çalıştığını doğrulayın
tailscale serve status

# Gateway'in dinlediğini kontrol edin
curl http://localhost:18789

# Gerekirse yeniden başlatın
systemctl --user restart openclaw-gateway.service
```

### ARM ikili dosya sorunları

Bazı araçların ARM yapıları olmayabilir. Kontrol edin:

```bash
uname -m  # aarch64 göstermelidir
```

Çoğu npm paketi sorunsuz çalışır. İkili dosyalar için `linux-arm64` veya `aarch64` sürümlerini arayın.

---

## Kalıcılık

Tüm durum şu konumlarda yaşar:

- `~/.openclaw/` — `openclaw.json`, ajan başına `auth-profiles.json`, kanal/sağlayıcı durumu ve oturum verileri
- `~/.openclaw/workspace/` — çalışma alanı (`SOUL.md`, bellek, artefaktlar)

Düzenli olarak yedek alın:

```bash
openclaw backup create
```

---

## İlgili

- [Gateway uzak erişim](/tr/gateway/remote) — diğer uzak erişim desenleri
- [Tailscale entegrasyonu](/tr/gateway/tailscale) — tam Tailscale belgeleri
- [Gateway yapılandırması](/tr/gateway/configuration) — tüm yapılandırma seçenekleri
- [DigitalOcean rehberi](/tr/install/digitalocean) — ücretli + daha kolay kayıt istiyorsanız
- [Hetzner rehberi](/tr/install/hetzner) — Docker tabanlı alternatif

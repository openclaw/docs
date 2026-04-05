---
read_when:
    - Oracle Cloud'da OpenClaw kuruyorsanız
    - OpenClaw için düşük maliyetli VPS barındırma arıyorsanız
    - Küçük bir sunucuda 7/24 OpenClaw istiyorsanız
summary: Oracle Cloud'da OpenClaw (Always Free ARM)
title: Oracle Cloud (Platform)
x-i18n:
    generated_at: "2026-04-05T14:01:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a42cdf2d18e964123894d382d2d8052c6b8dbb0b3c7dac914477c4a2a0a244f
    source_path: platforms/oracle.md
    workflow: 15
---

# Oracle Cloud'da OpenClaw (OCI)

## Amaç

Oracle Cloud'un **Always Free** ARM katmanında kalıcı bir OpenClaw Gateway çalıştırmak.

Oracle'ın ücretsiz katmanı OpenClaw için harika bir seçenek olabilir (özellikle zaten bir OCI hesabınız varsa), ancak bazı ödünleşmelerle gelir:

- ARM mimarisi (çoğu şey çalışır, ancak bazı ikili dosyalar yalnızca x86 olabilir)
- Kapasite ve kayıt süreci sorunlu olabilir

## Maliyet Karşılaştırması (2026)

| Sağlayıcı     | Plan            | Özellikler             | Fiyat/ay | Notlar               |
| ------------- | --------------- | ---------------------- | -------- | -------------------- |
| Oracle Cloud  | Always Free ARM | en fazla 4 OCPU, 24GB RAM | $0       | ARM, sınırlı kapasite |
| Hetzner       | CX22            | 2 vCPU, 4GB RAM        | ~ $4     | En ucuz ücretli seçenek |
| DigitalOcean  | Basic           | 1 vCPU, 1GB RAM        | $6       | Kolay arayüz, iyi belgeler |
| Vultr         | Cloud Compute   | 1 vCPU, 1GB RAM        | $6       | Çok sayıda konum     |
| Linode        | Nanode          | 1 vCPU, 1GB RAM        | $5       | Artık Akamai'nin parçası |

---

## Önkoşullar

- Oracle Cloud hesabı ([kayıt](https://www.oracle.com/cloud/free/)) — sorun yaşarsanız [topluluk kayıt kılavuzuna](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) bakın
- Tailscale hesabı ([tailscale.com](https://tailscale.com) üzerinde ücretsiz)
- ~30 dakika

## 1) OCI Instance oluşturun

1. [Oracle Cloud Console](https://cloud.oracle.com/) hesabınıza giriş yapın
2. **Compute → Instances → Create Instance** bölümüne gidin
3. Şunları yapılandırın:
   - **Ad:** `openclaw`
   - **İmaj:** Ubuntu 24.04 (aarch64)
   - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPU'lar:** 2 (veya en fazla 4)
   - **Bellek:** 12 GB (veya en fazla 24 GB)
   - **Boot volume:** 50 GB (200 GB'a kadar ücretsiz)
   - **SSH key:** Genel anahtarınızı ekleyin
4. **Create** düğmesine tıklayın
5. Genel IP adresini not edin

**İpucu:** Instance oluşturma "Out of capacity" hatasıyla başarısız olursa farklı bir erişilebilirlik alanı deneyin veya daha sonra yeniden deneyin. Ücretsiz katman kapasitesi sınırlıdır.

## 2) Bağlanın ve güncelleyin

```bash
# Genel IP üzerinden bağlanın
ssh ubuntu@YOUR_PUBLIC_IP

# Sistemi güncelleyin
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**Not:** Bazı bağımlılıkların ARM üzerinde derlenmesi için `build-essential` gereklidir.

## 3) Kullanıcıyı ve ana makine adını yapılandırın

```bash
# Ana makine adını ayarlayın
sudo hostnamectl set-hostname openclaw

# ubuntu kullanıcısı için parola ayarlayın
sudo passwd ubuntu

# lingering özelliğini etkinleştirin (kullanıcı hizmetlerini oturum kapattıktan sonra çalışır tutar)
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

**Bundan sonra Tailscale üzerinden bağlanın:** `ssh ubuntu@openclaw` (veya Tailscale IP'sini kullanın).

## 5) OpenClaw kurun

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

"How do you want to hatch your bot?" istemi geldiğinde **"Do this later"** seçeneğini seçin.

> Not: ARM yerel derleme sorunlarıyla karşılaşırsanız, Homebrew'e yönelmeden önce sistem paketleriyle başlayın (ör. `sudo apt install -y build-essential`).

## 6) Gateway'i yapılandırın (loopback + token auth) ve Tailscale Serve'ü etkinleştirin

Varsayılan olarak token auth kullanın. Bu yöntem öngörülebilirdir ve herhangi bir "insecure auth" Control UI işaretine ihtiyaç duymaz.

```bash
# Gateway'i VM üzerinde gizli tutun
openclaw config set gateway.bind loopback

# Gateway + Control UI için kimlik doğrulaması zorunlu kılın
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Tailscale Serve üzerinden yayınlayın (HTTPS + tailnet erişimi)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

Buradaki `gateway.trustedProxies=["127.0.0.1"]` yalnızca yerel Tailscale Serve proxy'sinin iletilen IP/yerel istemci işlemesi içindir. Bu, **`gateway.auth.mode: "trusted-proxy"` değildir**. Diff görüntüleyici yolları bu kurulumda hata durumunda kapalı kalma davranışını korur: iletilen proxy üstbilgileri olmayan ham `127.0.0.1` görüntüleyici istekleri `Diff not found` döndürebilir. Ekler için `mode=file` / `mode=both` kullanın veya paylaşılabilir görüntüleyici bağlantılarına ihtiyacınız varsa uzak görüntüleyicileri bilinçli olarak etkinleştirip `plugins.entries.diffs.config.viewerBaseUrl` değerini ayarlayın (veya bir proxy `baseUrl` geçin).

## 7) Doğrulayın

```bash
# Sürümü kontrol edin
openclaw --version

# Arka plan hizmeti durumunu kontrol edin
systemctl --user status openclaw-gateway.service

# Tailscale Serve durumunu kontrol edin
tailscale serve status

# Yerel yanıtı test edin
curl http://localhost:18789
```

## 8) VCN güvenliğini sıkılaştırın

Her şey çalıştıktan sonra Tailscale dışındaki tüm trafiği engellemek için VCN'yi sıkılaştırın. OCI'nin Virtual Cloud Network'ü ağ kenarında güvenlik duvarı görevi görür — trafik instance'ınıza ulaşmadan engellenir.

1. OCI Console'da **Networking → Virtual Cloud Networks** bölümüne gidin
2. VCN'nize tıklayın → **Security Lists** → Default Security List
3. Şunlar dışındaki tüm gelen kurallarını **kaldırın**:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. Varsayılan giden kurallarını koruyun (tüm giden trafiğe izin ver)

Bu, ağ kenarında 22 numaralı bağlantı noktasındaki SSH'yi, HTTP'yi, HTTPS'yi ve diğer her şeyi engeller. Bundan sonra yalnızca Tailscale üzerinden bağlanabilirsiniz.

---

## Control UI'ye erişin

Tailscale ağınızdaki herhangi bir cihazdan:

```
https://openclaw.<tailnet-name>.ts.net/
```

`<tailnet-name>` yerine tailnet adınızı yazın (`tailscale status` içinde görünür).

SSH tüneline gerek yoktur. Tailscale şunları sağlar:

- HTTPS şifreleme (otomatik sertifikalar)
- Tailscale kimliği üzerinden kimlik doğrulama
- Tailnet'inizdeki herhangi bir cihazdan erişim (dizüstü bilgisayar, telefon vb.)

---

## Güvenlik: VCN + Tailscale (önerilen temel yapı)

VCN sıkılaştırıldığında (yalnızca UDP 41641 açık) ve Gateway loopback'e bağlandığında, güçlü bir katmanlı savunma elde edersiniz: genel trafik ağ kenarında engellenir ve yönetici erişimi tailnet'iniz üzerinden gerçekleşir.

Bu kurulum, yalnızca İnternet genelindeki SSH kaba kuvvet saldırılarını durdurmak için ek ana makine tabanlı güvenlik duvarı kurallarına olan _ihtiyacı_ çoğu zaman ortadan kaldırır — ancak yine de işletim sistemini güncel tutmalı, `openclaw security audit` çalıştırmalı ve yanlışlıkla genel arayüzlerde dinleme yapmadığınızı doğrulamalısınız.

### Zaten korunuyor

| Geleneksel Adım     | Gerekli mi?  | Neden                                                                       |
| ------------------- | ------------ | ---------------------------------------------------------------------------- |
| UFW güvenlik duvarı | Hayır        | Trafik instance'a ulaşmadan önce VCN engeller                               |
| fail2ban            | Hayır        | 22 numaralı bağlantı noktası VCN'de engelliyse kaba kuvvet yoktur          |
| sshd sıkılaştırma   | Hayır        | Tailscale SSH, sshd kullanmaz                                                |
| Root girişini kapat | Hayır        | Tailscale sistem kullanıcılarını değil, Tailscale kimliğini kullanır         |
| Yalnızca SSH anahtarı kimlik doğrulaması | Hayır | Tailscale, tailnet'iniz üzerinden kimlik doğrular                  |
| IPv6 sıkılaştırma   | Genellikle hayır | VCN/alt ağ ayarlarınıza bağlıdır; gerçekte neyin atanıp açığa çıktığını doğrulayın |

### Yine de önerilir

- **Kimlik bilgisi izinleri:** `chmod 700 ~/.openclaw`
- **Güvenlik denetimi:** `openclaw security audit`
- **Sistem güncellemeleri:** düzenli olarak `sudo apt update && sudo apt upgrade`
- **Tailscale'i izleyin:** [Tailscale yönetici konsolu](https://login.tailscale.com/admin) içindeki cihazları gözden geçirin

### Güvenlik duruşunu doğrulayın

```bash
# Genel bağlantı noktalarının dinlemediğini doğrulayın
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Tailscale SSH'nin etkin olduğunu doğrulayın
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# İsteğe bağlı: sshd'yi tamamen devre dışı bırakın
sudo systemctl disable --now ssh
```

---

## Geri dönüş seçeneği: SSH Tüneli

Tailscale Serve çalışmıyorsa SSH tüneli kullanın:

```bash
# Yerel makinenizden (Tailscale üzerinden)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Ardından `http://localhost:18789` adresini açın.

---

## Sorun giderme

### Instance oluşturma başarısız oluyor ("Out of capacity")

Ücretsiz katman ARM instance'ları popülerdir. Şunları deneyin:

- Farklı erişilebilirlik alanı
- Yoğun olmayan saatlerde yeniden deneyin (sabah erken saatler)
- Shape seçerken "Always Free" filtresini kullanın

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

Bazı araçların ARM derlemeleri olmayabilir. Şunu kontrol edin:

```bash
uname -m  # aarch64 göstermelidir
```

Çoğu npm paketi sorunsuz çalışır. İkili dosyalar için `linux-arm64` veya `aarch64` sürümlerini arayın.

---

## Kalıcılık

Tüm durum verileri şurada bulunur:

- `~/.openclaw/` — `openclaw.json`, ajan başına `auth-profiles.json`, kanal/sağlayıcı durumu ve oturum verileri
- `~/.openclaw/workspace/` — çalışma alanı (SOUL.md, bellek, yapıtlar)

Düzenli olarak yedekleyin:

```bash
openclaw backup create
```

---

## Ayrıca bkz.

- [Gateway uzaktan erişim](/tr/gateway/remote) — diğer uzaktan erişim düzenleri
- [Tailscale entegrasyonu](/tr/gateway/tailscale) — tam Tailscale belgeleri
- [Gateway yapılandırması](/tr/gateway/configuration) — tüm yapılandırma seçenekleri
- [DigitalOcean kılavuzu](/tr/install/digitalocean) — ücretli + daha kolay kayıt istiyorsanız
- [Hetzner kılavuzu](/tr/install/hetzner) — Docker tabanlı alternatif

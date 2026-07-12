---
read_when:
    - Oracle Cloud'da OpenClaw kurulumu
    - OpenClaw için ücretsiz VPS barındırma hizmeti arıyorsunuz
    - Küçük bir sunucuda 7/24 OpenClaw istiyorsanız
summary: OpenClaw'u Oracle Cloud'un Daima Ücretsiz ARM katmanında barındırın
title: Oracle Cloud
x-i18n:
    generated_at: "2026-07-12T12:25:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e1eb95b6bc8ad73e1492a03d8ebe32d89c80e58347614e6ae12d2d3d926d577
    source_path: install/oracle.md
    workflow: 16
---

Oracle Cloud'un **Always Free** ARM katmanında (4 OCPU, 24 GB RAM ve 200 GB depolamaya kadar) kalıcı bir OpenClaw Gateway'i ücretsiz çalıştırın.

## Ön koşullar

- Oracle Cloud hesabı ([kaydolun](https://www.oracle.com/cloud/free/)) -- sorun yaşarsanız [topluluk kayıt kılavuzuna](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) bakın
- Tailscale hesabı ([tailscale.com](https://tailscale.com) adresinde ücretsiz)
- Bir SSH anahtar çifti
- Yaklaşık 30 dakika

## Kurulum

<Steps>
  <Step title="Bir OCI örneği oluşturun">
    1. [Oracle Cloud Console](https://cloud.oracle.com/) üzerinde oturum açın.
    2. **Compute > Instances > Create Instance** yoluna gidin.
    3. Şunları yapılandırın:
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (veya 4'e kadar)
       - **Memory:** 12 GB (veya 24 GB'a kadar)
       - **Boot volume:** 50 GB (200 GB'a kadar ücretsiz)
       - **SSH key:** Açık anahtarınızı ekleyin
    4. **Create** düğmesine tıklayın ve genel IP adresini not edin.

    <Tip>
    Örnek oluşturma işlemi "Out of capacity" hatasıyla başarısız olursa farklı bir kullanılabilirlik etki alanı deneyin veya daha sonra yeniden deneyin. Ücretsiz katman kapasitesi sınırlıdır.
    </Tip>

  </Step>

  <Step title="Bağlanın ve sistemi güncelleyin">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    Bazı bağımlılıkların ARM üzerinde derlenmesi için `build-essential` gereklidir.

  </Step>

  <Step title="Kullanıcıyı ve ana bilgisayar adını yapılandırın">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Kalıcılığı etkinleştirmek, kullanıcı hizmetlerinin oturum kapatıldıktan sonra çalışmaya devam etmesini sağlar.

  </Step>

  <Step title="Tailscale'i yükleyin">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    Bundan sonra Tailscale üzerinden bağlanın: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="OpenClaw'u yükleyin">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    "How do you want to hatch your bot?" sorulduğunda **Do this later** seçeneğini belirleyin.

  </Step>

  <Step title="Gateway'i yapılandırın">
    Güvenli uzaktan erişim için Tailscale Serve ile token kimlik doğrulamasını kullanın.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    Buradaki `gateway.trustedProxies=["127.0.0.1"]` yalnızca yerel Tailscale Serve proxy'sinin iletilen IP/yerel istemci işlemesi içindir. Bu, `gateway.auth.mode: "trusted-proxy"` **değildir**. Bu kurulumda fark görüntüleyici rotaları güvenli biçimde kapalı kalma davranışını korur: iletilen proxy üstbilgileri bulunmayan ham `127.0.0.1` görüntüleyici istekleri `Diff not found` döndürür. Ekler için `mode=file` / `mode=both` kullanın ya da paylaşılabilir görüntüleyici bağlantılarına ihtiyacınız varsa uzaktan görüntüleyicileri bilinçli olarak etkinleştirip `plugins.entries.diffs.config.viewerBaseUrl` değerini ayarlayın (veya bir proxy `baseUrl` değeri iletin).

  </Step>

  <Step title="VCN güvenliğini sıkılaştırın">
    Ağ sınırında Tailscale dışındaki tüm trafiği engelleyin:

    1. OCI Console'da **Networking > Virtual Cloud Networks** yoluna gidin.
    2. VCN'nize, ardından **Security Lists > Default Security List** seçeneğine tıklayın.
    3. `0.0.0.0/0 UDP 41641` (Tailscale) dışındaki tüm giriş kurallarını **Remove**.
    4. Varsayılan çıkış kurallarını koruyun (tüm giden trafiğe izin verin).

    Bu işlem ağ sınırında 22 numaralı bağlantı noktasındaki SSH'yi, HTTP'yi, HTTPS'yi ve diğer her şeyi engeller. Bu noktadan sonra yalnızca Tailscale üzerinden bağlanabilirsiniz.

  </Step>

  <Step title="Doğrulayın">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Kontrol Arayüzü'ne tailnet'inizdeki herhangi bir cihazdan erişin:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    `<tailnet-name>` yerine tailnet adınızı yazın (`tailscale status` çıktısında görülebilir).

  </Step>
</Steps>

## Güvenlik durumunu doğrulayın

VCN sıkılaştırıldığında (yalnızca UDP 41641 açıkken) ve Gateway loopback'e bağlandığında genel trafik ağ sınırında engellenir ve yönetici erişimi yalnızca tailnet ile sınırlandırılır. Bu, geleneksel VPS sıkılaştırma adımlarından birkaçına duyulan ihtiyacı ortadan kaldırır:

| Geleneksel adım                    | Gerekli mi?       | Nedeni                                                                          |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------- |
| UFW güvenlik duvarı                | Hayır             | VCN, trafiği örneğe ulaşmadan önce engeller.                                    |
| fail2ban                           | Hayır             | 22 numaralı bağlantı noktası VCN'de engellenir; kaba kuvvet saldırı yüzeyi yoktur. |
| sshd sıkılaştırması                | Hayır             | Tailscale SSH, sshd kullanmaz.                                                  |
| Kök kullanıcı oturumunu devre dışı bırakma | Hayır     | Tailscale, sistem kullanıcılarıyla değil tailnet kimliğiyle kimlik doğrular.    |
| Yalnızca SSH anahtarıyla kimlik doğrulama | Hayır     | Aynı nedenle -- tailnet kimliği sistem SSH anahtarlarının yerini alır.          |
| IPv6 sıkılaştırması                | Genellikle hayır  | VCN/alt ağ ayarlarına bağlıdır; gerçekten neyin atandığını/açığa çıkarıldığını doğrulayın. |

Yine de önerilenler:

- Kimlik bilgisi dosyalarının izinlerini kısıtlamak için `chmod 700 ~/.openclaw`.
- OpenClaw'a özgü güvenlik durumu denetimi için `openclaw security audit`.
- İşletim sistemi yamaları için düzenli olarak `sudo apt update && sudo apt upgrade`.
- [Tailscale yönetim konsolundaki](https://login.tailscale.com/admin) cihazları düzenli aralıklarla gözden geçirin.

Hızlı doğrulama komutları:

```bash
# Genel bağlantı noktalarının dinlemede olmadığını doğrulayın
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Tailscale SSH'nin etkin olduğunu doğrulayın
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# İsteğe bağlı: Tailscale SSH'nin çalıştığı doğrulandıktan sonra sshd'yi tamamen devre dışı bırakın
sudo systemctl disable --now ssh
```

## ARM notları

Always Free katmanı ARM (`aarch64`) kullanır. OpenClaw özelliklerinin çoğu sorunsuz çalışır; az sayıda yerel ikili dosyanın ARM derlemelerine ihtiyacı vardır:

- Node.js, Telegram, WhatsApp (Baileys): saf JavaScript olduğundan sorun yoktur.
- Yerel kod içeren çoğu npm paketi: önceden derlenmiş `linux-arm64` yapıtları mevcuttur.
- İsteğe bağlı CLI yardımcıları (ör. Skills tarafından sunulan Go/Rust ikili dosyaları): yüklemeden önce bir `aarch64` / `linux-arm64` sürümü olup olmadığını kontrol edin.

Mimariyi `uname -m` ile doğrulayın (`aarch64` yazdırmalıdır). ARM derlemesi olmayan ikili dosyaları kaynaktan yükleyin veya atlayın.

## Kalıcılık ve yedeklemeler

OpenClaw durumu şu konumlarda bulunur:

- `~/.openclaw/` -- `openclaw.json`, aracı başına `auth-profiles.json`, kanal/sağlayıcı durumu ve oturum verileri.
- `~/.openclaw/workspace/` -- aracı çalışma alanı (SOUL.md, bellek, yapıtlar).

Bunlar yeniden başlatmalardan etkilenmez. Taşınabilir bir anlık görüntü almak için:

```bash
openclaw backup create
```

## Alternatif: SSH tüneli

Tailscale Serve çalışmıyorsa yerel makinenizden bir SSH tüneli kullanın:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Ardından `http://localhost:18789` adresini açın.

## Sorun giderme

**Örnek oluşturma başarısız oluyor ("Out of capacity")** -- Ücretsiz katman ARM örnekleri yoğun talep görür. Farklı bir kullanılabilirlik etki alanı deneyin veya yoğun olmayan saatlerde yeniden deneyin.

**Tailscale bağlanmıyor** -- Yeniden kimlik doğrulamak için `sudo tailscale up --ssh --hostname=openclaw --reset` komutunu çalıştırın.

**Gateway başlamıyor** -- `openclaw doctor --non-interactive` komutunu çalıştırın ve günlükleri `journalctl --user -u openclaw-gateway.service -n 50` ile denetleyin.

**ARM ikili dosyası sorunları** -- Çoğu npm paketi ARM64 üzerinde çalışır. Yerel ikili dosyalar için `linux-arm64` veya `aarch64` sürümlerini arayın. Mimariyi `uname -m` ile doğrulayın.

## Sonraki adımlar

- [Kanallar](/tr/channels) -- Telegram, WhatsApp, Discord ve daha fazlasını bağlayın
- [Gateway yapılandırması](/tr/gateway/configuration) -- tüm yapılandırma seçenekleri
- [Güncelleme](/tr/install/updating) -- OpenClaw'u güncel tutun

## İlgili

- [Kuruluma genel bakış](/tr/install)
- [GCP](/tr/install/gcp)
- [VPS barındırma](/tr/vps)

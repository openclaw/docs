---
read_when:
    - Oracle Cloud’da OpenClaw kurulumu
    - OpenClaw için ücretsiz VPS barındırma arıyorum
    - Küçük bir sunucuda 7/24 OpenClaw çalıştırmak istiyorum
summary: OpenClaw'u Oracle Cloud'un Always Free ARM katmanında barındırın
title: Oracle Cloud
x-i18n:
    generated_at: "2026-05-06T09:19:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9115c83c7a78b78d8b6701b028a2f6e9f08a71f7fff14b7b45f1610b8052c14e
    source_path: install/oracle.md
    workflow: 16
---

Ücretsiz olarak Oracle Cloud'un **Always Free** ARM katmanında (4 OCPU'ya, 24 GB RAM'e, 200 GB depolamaya kadar) kalıcı bir OpenClaw Gateway çalıştırın.

## Önkoşullar

- Oracle Cloud hesabı ([kayıt](https://www.oracle.com/cloud/free/)) -- sorun yaşarsanız [topluluk kayıt kılavuzuna](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) bakın
- Tailscale hesabı ([tailscale.com](https://tailscale.com) adresinde ücretsiz)
- Bir SSH anahtar çifti
- Yaklaşık 30 dakika

## Kurulum

<Steps>
  <Step title="Bir OCI örneği oluşturun">
    1. [Oracle Cloud Console](https://cloud.oracle.com/) üzerinde oturum açın.
    2. **Compute > Instances > Create Instance** bölümüne gidin.
    3. Yapılandırın:
       - **Ad:** `openclaw`
       - **İmaj:** Ubuntu 24.04 (aarch64)
       - **Şekil:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPU'lar:** 2 (veya 4'e kadar)
       - **Bellek:** 12 GB (veya 24 GB'a kadar)
       - **Önyükleme birimi:** 50 GB (200 GB'a kadar ücretsiz)
       - **SSH anahtarı:** Açık anahtarınızı ekleyin
    4. **Create** öğesine tıklayın ve genel IP adresini not edin.

    <Tip>
    Örnek oluşturma "Out of capacity" hatasıyla başarısız olursa farklı bir kullanılabilirlik etki alanı deneyin veya daha sonra yeniden deneyin. Ücretsiz katman kapasitesi sınırlıdır.
    </Tip>

  </Step>

  <Step title="Bağlanın ve sistemi güncelleyin">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    Bazı bağımlılıkların ARM derlemesi için `build-essential` gereklidir.

  </Step>

  <Step title="Kullanıcıyı ve ana makine adını yapılandırın">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Linger'ı etkinleştirmek, oturum kapatıldıktan sonra kullanıcı hizmetlerinin çalışmaya devam etmesini sağlar.

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

    "How do you want to hatch your bot?" sorulduğunda **Do this later** öğesini seçin.

  </Step>

  <Step title="Gateway'i yapılandırın">
    Güvenli uzaktan erişim için Tailscale Serve ile belirteç kimlik doğrulamasını kullanın.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    Buradaki `gateway.trustedProxies=["127.0.0.1"]` yalnızca yerel Tailscale Serve proxy'sinin iletilen IP/yerel istemci işlemesi içindir. Bu, `gateway.auth.mode: "trusted-proxy"` **değildir**. Diff görüntüleyici rotaları bu kurulumda kapalı başarısız davranışı korur: iletilen proxy üst bilgileri olmadan yapılan ham `127.0.0.1` görüntüleyici istekleri `Diff not found` döndürebilir. Ekler için `mode=file` / `mode=both` kullanın veya paylaşılabilir görüntüleyici bağlantılarına ihtiyacınız varsa uzaktan görüntüleyicileri bilinçli olarak etkinleştirip `plugins.entries.diffs.config.viewerBaseUrl` değerini ayarlayın (ya da bir proxy `baseUrl` geçirin).

  </Step>

  <Step title="VCN güvenliğini kilitleyin">
    Ağ sınırında Tailscale dışındaki tüm trafiği engelleyin:

    1. OCI Console'da **Networking > Virtual Cloud Networks** bölümüne gidin.
    2. VCN'nize, ardından **Security Lists > Default Security List** öğesine tıklayın.
    3. `0.0.0.0/0 UDP 41641` (Tailscale) dışındaki tüm giriş kurallarını **kaldırın**.
    4. Varsayılan çıkış kurallarını koruyun (tüm dış trafiğe izin ver).

    Bu, ağ sınırında 22 numaralı bağlantı noktasındaki SSH'yi, HTTP'yi, HTTPS'yi ve diğer her şeyi engeller. Bu noktadan sonra yalnızca Tailscale üzerinden bağlanabilirsiniz.

  </Step>

  <Step title="Doğrulayın">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Control UI'ye tailnet'inizdeki herhangi bir cihazdan erişin:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    `<tailnet-name>` değerini tailnet adınızla değiştirin (`tailscale status` içinde görünür).

  </Step>
</Steps>

## Güvenlik duruşunu doğrulayın

VCN kilitliyken (yalnızca UDP 41641 açık) ve Gateway loopback'e bağlıyken, genel trafik ağ sınırında engellenir ve yönetici erişimi yalnızca tailnet üzerinden olur. Bu, birkaç geleneksel VPS sertleştirme adımına olan ihtiyacı ortadan kaldırır:

| Geleneksel adım    | Gerekli mi? | Neden                                                                     |
| ------------------ | ----------- | ------------------------------------------------------------------------- |
| UFW güvenlik duvarı | Hayır      | VCN, trafiği örneğe ulaşmadan önce engeller.                              |
| fail2ban           | Hayır       | 22 numaralı bağlantı noktası VCN'de engellenir; brute-force yüzeyi yoktur. |
| sshd sertleştirme  | Hayır       | Tailscale SSH, sshd kullanmaz.                                            |
| Root oturum açmayı devre dışı bırakma | Hayır | Tailscale, sistem kullanıcılarıyla değil tailnet kimliğiyle kimlik doğrular. |
| Yalnızca SSH anahtarıyla kimlik doğrulama | Hayır | Aynı nedenle; tailnet kimliği sistem SSH anahtarlarının yerini alır. |
| IPv6 sertleştirme  | Genellikle hayır | VCN/alt ağ ayarlarına bağlıdır; gerçekten neyin atandığını/açığa çıktığını doğrulayın. |

Yine de önerilir:

- Kimlik bilgisi dosyası izinlerini kısıtlamak için `chmod 700 ~/.openclaw`.
- OpenClaw'a özgü duruş denetimi için `openclaw security audit`.
- İşletim sistemi yamaları için düzenli `sudo apt update && sudo apt upgrade`.
- [Tailscale yönetici konsolundaki](https://login.tailscale.com/admin) cihazları düzenli olarak gözden geçirin.

Hızlı doğrulama komutları:

```bash
# Confirm no public ports are listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely once Tailscale SSH is confirmed working
sudo systemctl disable --now ssh
```

## ARM notları

Always Free katmanı ARM'dir (`aarch64`). Çoğu OpenClaw özelliği sorunsuz çalışır; az sayıda yerel ikilinin ARM derlemesine ihtiyacı vardır:

- Node.js, Telegram, WhatsApp (Baileys): saf JavaScript, sorun yok.
- Yerel kod içeren çoğu npm paketi: önceden derlenmiş `linux-arm64` yapıtları mevcuttur.
- İsteğe bağlı CLI yardımcıları (ör. Skills tarafından gönderilen Go/Rust ikilileri): yüklemeden önce bir `aarch64` / `linux-arm64` sürümü olup olmadığını kontrol edin.

Mimariyi `uname -m` ile doğrulayın (`aarch64` yazdırmalıdır). ARM derlemesi olmayan ikililer için kaynaktan yükleyin veya bunları atlayın.

## Kalıcılık ve yedekler

OpenClaw durumu şunların altında bulunur:

- `~/.openclaw/` — `openclaw.json`, ajan başına `auth-profiles.json`, kanal/sağlayıcı durumu ve oturum verileri.
- `~/.openclaw/workspace/` — ajan çalışma alanı (SOUL.md, bellek, yapıtlar).

Bunlar yeniden başlatmalardan sonra korunur. Taşınabilir bir anlık görüntü almak için:

```bash
openclaw backup create
```

## Geri dönüş: SSH tüneli

Tailscale Serve çalışmıyorsa yerel makinenizden bir SSH tüneli kullanın:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Ardından `http://localhost:18789` adresini açın.

## Sorun giderme

**Örnek oluşturma başarısız oluyor ("Out of capacity")** -- Ücretsiz katman ARM örnekleri popülerdir. Farklı bir kullanılabilirlik etki alanı deneyin veya yoğun olmayan saatlerde yeniden deneyin.

**Tailscale bağlanmıyor** -- Yeniden kimlik doğrulamak için `sudo tailscale up --ssh --hostname=openclaw --reset` çalıştırın.

**Gateway başlamıyor** -- `openclaw doctor --non-interactive` çalıştırın ve günlükleri `journalctl --user -u openclaw-gateway.service -n 50` ile kontrol edin.

**ARM ikili sorunları** -- Çoğu npm paketi ARM64 üzerinde çalışır. Yerel ikililer için `linux-arm64` veya `aarch64` sürümlerini arayın. Mimariyi `uname -m` ile doğrulayın.

## Sonraki adımlar

- [Kanallar](/tr/channels) -- Telegram, WhatsApp, Discord ve daha fazlasını bağlayın
- [Gateway yapılandırması](/tr/gateway/configuration) -- tüm yapılandırma seçenekleri
- [Güncelleme](/tr/install/updating) -- OpenClaw'u güncel tutun

## İlgili

- [Yükleme özeti](/tr/install)
- [GCP](/tr/install/gcp)
- [VPS barındırma](/tr/vps)

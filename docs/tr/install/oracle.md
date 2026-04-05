---
read_when:
    - Oracle Cloud üzerinde OpenClaw kurma
    - OpenClaw için ücretsiz VPS barındırma arama
    - Küçük bir sunucuda 7/24 OpenClaw isteme
summary: OpenClaw'ı Oracle Cloud'un Always Free ARM katmanında barındırın
title: Oracle Cloud
x-i18n:
    generated_at: "2026-04-05T13:58:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6915f8c428cfcbc215ba6547273df6e7b93212af6590827a3853f15617ba245e
    source_path: install/oracle.md
    workflow: 15
---

# Oracle Cloud

Oracle Cloud'un **Always Free** ARM katmanında (4 OCPU, 24 GB RAM, 200 GB depolamaya kadar) hiçbir ücret ödemeden kalıcı bir OpenClaw Gateway çalıştırın.

## Ön koşullar

- Oracle Cloud hesabı ([kayıt](https://www.oracle.com/cloud/free/)) -- sorun yaşarsanız [topluluk kayıt kılavuzuna](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) bakın
- Tailscale hesabı ([tailscale.com](https://tailscale.com) üzerinden ücretsiz)
- Bir SSH anahtar çifti
- Yaklaşık 30 dakika

## Kurulum

<Steps>
  <Step title="Bir OCI örneği oluşturun">
    1. [Oracle Cloud Console](https://cloud.oracle.com/) hesabınıza giriş yapın.
    2. **Compute > Instances > Create Instance** yoluna gidin.
    3. Şunları yapılandırın:
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (veya 4'e kadar)
       - **Memory:** 12 GB (veya 24 GB'a kadar)
       - **Boot volume:** 50 GB (200 GB'a kadar ücretsiz)
       - **SSH key:** Genel anahtarınızı ekleyin
    4. **Create** düğmesine tıklayın ve genel IP adresini not alın.

    <Tip>
    Örnek oluşturma işlemi "Out of capacity" hatasıyla başarısız olursa farklı bir availability domain deneyin veya daha sonra tekrar deneyin. Ücretsiz katman kapasitesi sınırlıdır.
    </Tip>

  </Step>

  <Step title="Bağlanın ve sistemi güncelleyin">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential`, bazı bağımlılıkların ARM üzerinde derlenmesi için gereklidir.

  </Step>

  <Step title="Kullanıcıyı ve ana makine adını yapılandırın">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Linger'ı etkinleştirmek, kullanıcı hizmetlerinin oturum kapatıldıktan sonra da çalışmasını sağlar.

  </Step>

  <Step title="Tailscale kurun">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    Bundan sonra Tailscale üzerinden bağlanın: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="OpenClaw'ı kurun">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    "How do you want to hatch your bot?" sorulduğunda **Do this later** seçeneğini seçin.

  </Step>

  <Step title="Gateway'i yapılandırın">
    Güvenli uzak erişim için Tailscale Serve ile birlikte token auth kullanın.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    Buradaki `gateway.trustedProxies=["127.0.0.1"]` yalnızca yerel Tailscale Serve proxy'sinin iletilen IP/yerel istemci işlemesi içindir. Bu **`gateway.auth.mode: "trusted-proxy"` değildir**. Diff görüntüleyici yolları bu kurulumda fail-closed davranışını korur: iletilen proxy başlıkları olmadan yapılan ham `127.0.0.1` görüntüleyici istekleri `Diff not found` döndürebilir. Ekler için `mode=file` / `mode=both` kullanın ya da paylaşılabilir görüntüleyici bağlantılarına ihtiyacınız varsa uzak görüntüleyicileri bilinçli olarak etkinleştirip `plugins.entries.diffs.config.viewerBaseUrl` değerini ayarlayın (veya bir proxy `baseUrl` iletin).

  </Step>

  <Step title="VCN güvenliğini sıkılaştırın">
    Ağ sınırında Tailscale dışındaki tüm trafiği engelleyin:

    1. OCI Console'da **Networking > Virtual Cloud Networks** bölümüne gidin.
    2. VCN'nize tıklayın, ardından **Security Lists > Default Security List** seçeneğine gidin.
    3. `0.0.0.0/0 UDP 41641` (Tailscale) dışında tüm ingress kurallarını **kaldırın**.
    4. Varsayılan egress kurallarını koruyun (tüm giden trafiğe izin ver).

    Bu işlem ağ sınırında 22 numaralı bağlantı noktasındaki SSH, HTTP, HTTPS ve diğer her şeyi engeller. Bu noktadan sonra yalnızca Tailscale üzerinden bağlanabilirsiniz.

  </Step>

  <Step title="Doğrulayın">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Tailnet'inizdeki herhangi bir cihazdan Control UI'ye erişin:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    `<tailnet-name>` yerine tailnet adınızı yazın (`tailscale status` çıktısında görünür).

  </Step>
</Steps>

## Geri dönüş: SSH tüneli

Tailscale Serve çalışmıyorsa yerel makinenizden bir SSH tüneli kullanın:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Ardından `http://localhost:18789` adresini açın.

## Sorun giderme

**Örnek oluşturma başarısız oluyor ("Out of capacity")** -- Ücretsiz katman ARM örnekleri popülerdir. Farklı bir availability domain deneyin veya yoğun olmayan saatlerde yeniden deneyin.

**Tailscale bağlanmıyor** -- Yeniden kimlik doğrulamak için `sudo tailscale up --ssh --hostname=openclaw --reset` çalıştırın.

**Gateway başlamıyor** -- `openclaw doctor --non-interactive` çalıştırın ve günlükleri `journalctl --user -u openclaw-gateway.service -n 50` ile kontrol edin.

**ARM ikili sorunları** -- Çoğu npm paketi ARM64 üzerinde çalışır. Doğal ikililer için `linux-arm64` veya `aarch64` sürümlerini arayın. Mimarinizi `uname -m` ile doğrulayın.

## Sonraki adımlar

- [Channels](/tr/channels) -- Telegram, WhatsApp, Discord ve daha fazlasını bağlayın
- [Gateway configuration](/gateway/configuration) -- tüm yapılandırma seçenekleri
- [Updating](/install/updating) -- OpenClaw'ı güncel tutun

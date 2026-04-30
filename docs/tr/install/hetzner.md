---
read_when:
    - OpenClaw’ın dizüstü bilgisayarınızda değil, bir bulut VPS üzerinde 7/24 çalışmasını istiyorsunuz
    - Kendi VPS'nizde üretim sınıfı, sürekli çalışan bir Gateway istiyorsunuz
    - Kalıcılık, ikili dosyalar ve yeniden başlatma davranışı üzerinde tam denetim istiyorsunuz
    - OpenClaw'ı Hetzner veya benzer bir sağlayıcıda Docker üzerinde çalıştırıyorsunuz
summary: OpenClaw Gateway'i kalıcı durum ve içine gömülü ikili dosyalarla ucuz bir Hetzner VPS'sinde (Docker) 7/24 çalıştırın
title: Hetzner
x-i18n:
    generated_at: "2026-04-30T09:29:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96b5b54bfd8d976c575ecffcd229106fc322b9a53828a9d7358f583434b7bbc2
    source_path: install/hetzner.md
    workflow: 16
---

# Hetzner üzerinde OpenClaw (Docker, Üretim VPS Kılavuzu)

## Amaç

Docker kullanarak Hetzner VPS üzerinde kalıcı duruma, imaja gömülü ikili dosyalara ve güvenli yeniden başlatma davranışına sahip, sürekli çalışan bir OpenClaw Gateway çalıştırın.

“~5$ karşılığında 7/24 OpenClaw” istiyorsanız, bu en basit güvenilir kurulumdur.
Hetzner fiyatları değişir; en küçük Debian/Ubuntu VPS’i seçin ve OOM hatalarıyla karşılaşırsanız ölçeği büyütün.

Güvenlik modeli hatırlatması:

- Şirket içinde paylaşılan ajanlar, herkes aynı güven sınırı içindeyse ve çalışma zamanı yalnızca iş amaçlıysa uygundur.
- Katı ayrım sağlayın: özel VPS/çalışma zamanı + özel hesaplar; bu host üzerinde kişisel Apple/Google/tarayıcı/parola yöneticisi profilleri bulundurmayın.
- Kullanıcılar birbirine karşı adversary ise Gateway/host/OS kullanıcısına göre ayırın.

Bkz. [Güvenlik](/tr/gateway/security) ve [VPS barındırma](/tr/vps).

## Ne yapıyoruz (basit ifadeyle)?

- Küçük bir Linux sunucusu kirala (Hetzner VPS)
- Docker kur (yalıtılmış uygulama çalışma zamanı)
- OpenClaw Gateway’i Docker içinde başlat
- Host üzerinde `~/.openclaw` + `~/.openclaw/workspace` kalıcı hale getir (yeniden başlatmalardan/yeniden derlemelerden etkilenmez)
- Control UI’ye dizüstü bilgisayarınızdan bir SSH tüneli üzerinden eriş

Bağlanan bu `~/.openclaw` durumu `openclaw.json`, her ajan için
`agents/<agentId>/agent/auth-profiles.json` ve `.env` içerir.

Gateway’e şu yollarla erişilebilir:

- Dizüstü bilgisayarınızdan SSH port yönlendirme
- Güvenlik duvarını ve token’ları kendiniz yönetiyorsanız doğrudan port açma

Bu kılavuz Hetzner üzerinde Ubuntu veya Debian varsayar.  
Başka bir Linux VPS kullanıyorsanız paketleri buna göre eşleyin.
Genel Docker akışı için bkz. [Docker](/tr/install/docker).

---

## Hızlı yol (deneyimli operatörler)

1. Hetzner VPS oluşturun
2. Docker kurun
3. OpenClaw deposunu klonlayın
4. Kalıcı host dizinleri oluşturun
5. `.env` ve `docker-compose.yml` yapılandırın
6. Gerekli ikili dosyaları imaja gömün
7. `docker compose up -d`
8. Kalıcılığı ve Gateway erişimini doğrulayın

---

## Gerekenler

- Root erişimli Hetzner VPS
- Dizüstü bilgisayarınızdan SSH erişimi
- SSH + kopyala/yapıştır konusunda temel rahatlık
- ~20 dakika
- Docker ve Docker Compose
- Model kimlik doğrulama bilgileri
- İsteğe bağlı sağlayıcı kimlik bilgileri
  - WhatsApp QR
  - Telegram bot token’ı
  - Gmail OAuth

---

<Steps>
  <Step title="VPS’i oluşturun">
    Hetzner’da bir Ubuntu veya Debian VPS oluşturun.

    Root olarak bağlanın:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Bu kılavuz VPS’in durum bilgisi tuttuğunu varsayar.
    Onu atılabilir altyapı gibi ele almayın.

  </Step>

  <Step title="Docker kurun (VPS üzerinde)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    Doğrulayın:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="OpenClaw deposunu klonlayın">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Bu kılavuz, ikili dosya kalıcılığını garanti etmek için özel bir imaj oluşturacağınızı varsayar.

  </Step>

  <Step title="Kalıcı host dizinleri oluşturun">
    Docker container’ları geçicidir.
    Tüm uzun ömürlü durum host üzerinde yaşamalıdır.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Ortam değişkenlerini yapılandırın">
    Depo kökünde `.env` oluşturun.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    `OPENCLAW_GATEWAY_TOKEN` değerini, bunu açıkça `.env` üzerinden
    yönetmek istemediğiniz sürece boş bırakın; OpenClaw ilk başlatmada
    yapılandırmaya rastgele bir Gateway token’ı yazar. Bir anahtarlık parolası
    oluşturun ve `GOG_KEYRING_PASSWORD` içine yapıştırın:

    ```bash
    openssl rand -hex 32
    ```

    **Bu dosyayı commit etmeyin.**

    Bu `.env` dosyası `OPENCLAW_GATEWAY_TOKEN` gibi container/çalışma zamanı ortam değişkenleri içindir.
    Saklanan sağlayıcı OAuth/API anahtarı kimlik doğrulaması bağlanan
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` içinde yaşar.

  </Step>

  <Step title="Docker Compose yapılandırması">
    `docker-compose.yml` oluşturun veya güncelleyin.

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # Recommended: keep the Gateway loopback-only on the VPS; access via SSH tunnel.
          # To expose it publicly, remove the `127.0.0.1:` prefix and firewall accordingly.
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` yalnızca başlangıç kolaylığı içindir; düzgün bir Gateway yapılandırmasının yerine geçmez. Dağıtımınız için yine de kimlik doğrulamayı (`gateway.auth.token` veya parola) ayarlayın ve güvenli bind ayarları kullanın.

  </Step>

  <Step title="Paylaşılan Docker VM çalışma zamanı adımları">
    Yaygın Docker host akışı için paylaşılan çalışma zamanı kılavuzunu kullanın:

    - [Gerekli ikili dosyaları imaja gömün](/tr/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Derleyin ve başlatın](/tr/install/docker-vm-runtime#build-and-launch)
    - [Nerede ne kalıcı olur](/tr/install/docker-vm-runtime#what-persists-where)
    - [Güncellemeler](/tr/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner’a özgü erişim">
    Paylaşılan derleme ve başlatma adımlarından sonra, tüneli açmak için aşağıdaki kurulumu tamamlayın:

    **Önkoşul:** VPS sshd yapılandırmanızın TCP yönlendirmeye izin verdiğinden emin olun. SSH yapılandırmanızı sıkılaştırdıysanız `/etc/ssh/sshd_config` dosyasını kontrol edin ve şunu ayarlayın:

    ```
    AllowTcpForwarding local
    ```

    `local`, sunucudan uzak yönlendirmeleri engellerken dizüstü bilgisayarınızdan `ssh -L` yerel yönlendirmelerine izin verir. Bunu `no` olarak ayarlamak tünelin şu hatayla başarısız olmasına neden olur:
    `channel 3: open failed: administratively prohibited: open failed`

    TCP yönlendirmenin etkin olduğunu doğruladıktan sonra SSH hizmetini yeniden başlatın
    (`systemctl restart ssh`) ve tüneli dizüstü bilgisayarınızdan çalıştırın:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Açın:

    `http://127.0.0.1:18789/`

    Yapılandırılmış paylaşılan sırrı yapıştırın. Bu kılavuz varsayılan olarak Gateway token’ını kullanır; parola kimlik doğrulamasına geçtiyseniz bunun yerine o parolayı kullanın.

  </Step>
</Steps>

Paylaşılan kalıcılık haritası [Docker VM Çalışma Zamanı](/tr/install/docker-vm-runtime#what-persists-where) içinde bulunur.

## Kod Olarak Altyapı (Terraform)

Kod olarak altyapı iş akışlarını tercih eden ekipler için, topluluk tarafından bakımı yapılan bir Terraform kurulumu şunları sağlar:

- Uzak durum yönetimiyle modüler Terraform yapılandırması
- cloud-init üzerinden otomatik sağlama
- Dağıtım betikleri (bootstrap, deploy, backup/restore)
- Güvenlik sıkılaştırma (güvenlik duvarı, UFW, yalnızca SSH erişimi)
- Gateway erişimi için SSH tüneli yapılandırması

**Depolar:**

- Altyapı: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker yapılandırması: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Bu yaklaşım yukarıdaki Docker kurulumunu tekrarlanabilir dağıtımlar, sürüm kontrollü altyapı ve otomatik felaket kurtarma ile tamamlar.

<Note>
Topluluk tarafından bakımı yapılır. Sorunlar veya katkılar için yukarıdaki depo bağlantılarına bakın.
</Note>

## Sonraki adımlar

- Mesajlaşma kanallarını ayarlayın: [Kanallar](/tr/channels)
- Gateway’i yapılandırın: [Gateway yapılandırması](/tr/gateway/configuration)
- OpenClaw’ı güncel tutun: [Güncelleme](/tr/install/updating)

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Fly.io](/tr/install/fly)
- [Docker](/tr/install/docker)
- [VPS barındırma](/tr/vps)

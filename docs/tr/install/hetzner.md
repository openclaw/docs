---
read_when:
    - OpenClaw'ı dizüstü bilgisayarınızda değil, bir bulut VPS üzerinde 7/24 çalıştırmak istiyorsunuz
    - Kendi VPS'inizde üretim düzeyinde, her zaman açık bir Gateway istiyorsunuz
    - Kalıcılık, ikili dosyalar ve yeniden başlatma davranışı üzerinde tam denetim istiyorsunuz
    - OpenClaw'u Docker'da, Hetzner veya benzer bir sağlayıcı üzerinde çalıştırıyorsunuz
summary: OpenClaw Gateway'i ucuz bir Hetzner VPS (Docker) üzerinde kalıcı durum ve gömülü ikili dosyalarla 7/24 çalıştırın
title: Hetzner
x-i18n:
    generated_at: "2026-05-06T09:19:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2625a028b6242f653d29b8f45035bf2d796c5c60453582cf269fd1c3776eca52
    source_path: install/hetzner.md
    workflow: 16
---

# Hetzner’da OpenClaw (Docker, Production VPS Kılavuzu)

## Amaç

Docker kullanarak Hetzner VPS üzerinde kalıcı duruma, gömülü ikili dosyalara ve güvenli yeniden başlatma davranışına sahip kalıcı bir OpenClaw Gateway çalıştırın.

"~5$ karşılığında 7/24 OpenClaw" istiyorsanız, bu en basit güvenilir kurulumdur.
Hetzner fiyatları değişir; en küçük Debian/Ubuntu VPS’i seçin ve OOM hatalarıyla karşılaşırsanız ölçeği büyütün.

Güvenlik modeli hatırlatması:

- Şirket içinde paylaşılan ajanlar, herkes aynı güven sınırındaysa ve runtime yalnızca iş amaçlıysa uygundur.
- Sıkı ayrım sağlayın: adanmış VPS/runtime + adanmış hesaplar; bu host üzerinde kişisel Apple/Google/tarayıcı/parola yöneticisi profilleri bulundurmayın.
- Kullanıcılar birbirine karşı hasmane olabiliyorsa, gateway/host/OS kullanıcısına göre ayırın.

Bkz. [Güvenlik](/tr/gateway/security) ve [VPS barındırma](/tr/vps).

## Ne yapıyoruz (basit ifadeyle)?

- Küçük bir Linux sunucu kiralama (Hetzner VPS)
- Docker kurma (izole uygulama runtime’ı)
- OpenClaw Gateway’i Docker içinde başlatma
- Host üzerinde `~/.openclaw` + `~/.openclaw/workspace` kalıcı hale getirme (yeniden başlatmalardan/yeniden derlemelerden sonra korunur)
- Dizüstü bilgisayarınızdan bir SSH tüneli üzerinden Control UI’ye erişme

Bağlanan `~/.openclaw` durumu `openclaw.json`, ajan başına
`agents/<agentId>/agent/auth-profiles.json` ve `.env` içerir.

Gateway’e şu yollarla erişilebilir:

- Dizüstü bilgisayarınızdan SSH port yönlendirme
- Güvenlik duvarını ve token’ları kendiniz yönetiyorsanız doğrudan port açma

Bu kılavuz Hetzner üzerinde Ubuntu veya Debian varsayar.  
Başka bir Linux VPS kullanıyorsanız paketleri buna göre eşleştirin.
Genel Docker akışı için bkz. [Docker](/tr/install/docker).

---

## Hızlı yol (deneyimli operatörler)

1. Hetzner VPS sağlayın
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
  - Telegram bot token
  - Gmail OAuth

---

<Steps>
  <Step title="VPS sağlayın">
    Hetzner’da bir Ubuntu veya Debian VPS oluşturun.

    Root olarak bağlanın:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Bu kılavuz VPS’in durum bilgili olduğunu varsayar.
    Onu atılabilir altyapı olarak ele almayın.

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

    Bu kılavuz, ikili dosya kalıcılığını garanti etmek için özel bir imaj derleyeceğinizi varsayar.

  </Step>

  <Step title="Kalıcı host dizinleri oluşturun">
    Docker container’ları geçicidir.
    Uzun ömürlü tüm durum host üzerinde yaşamalıdır.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Sahipliği container kullanıcısına ayarlayın (uid 1000):
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

    `OPENCLAW_GATEWAY_TOKEN` değerini, özellikle `.env` üzerinden
    yönetmek istemiyorsanız boş bırakın; OpenClaw ilk başlangıçta
    yapılandırmaya rastgele bir gateway token yazar. Bir keyring parolası
    üretin ve `GOG_KEYRING_PASSWORD` içine yapıştırın:

    ```bash
    openssl rand -hex 32
    ```

    **Bu dosyayı commit etmeyin.**

    Bu `.env` dosyası `OPENCLAW_GATEWAY_TOKEN` gibi container/runtime env değerleri içindir.
    Saklanan sağlayıcı OAuth/API anahtarı kimlik doğrulaması, bağlanan
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
          # Önerilen: Gateway’i VPS üzerinde yalnızca loopback’e açık tutun; SSH tüneliyle erişin.
          # Herkese açık hale getirmek için `127.0.0.1:` ön ekini kaldırın ve güvenlik duvarını buna göre ayarlayın.
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

    `--allow-unconfigured` yalnızca ilk kurulum kolaylığı içindir; düzgün bir gateway yapılandırmasının yerine geçmez. Dağıtımınız için yine de kimlik doğrulamayı (`gateway.auth.token` veya parola) ayarlayın ve güvenli bind ayarları kullanın.

  </Step>

  <Step title="Paylaşılan Docker VM runtime adımları">
    Ortak Docker host akışı için paylaşılan runtime kılavuzunu kullanın:

    - [Gerekli ikili dosyaları imaja gömün](/tr/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Derleyin ve başlatın](/tr/install/docker-vm-runtime#build-and-launch)
    - [Nerede ne kalıcı olur](/tr/install/docker-vm-runtime#what-persists-where)
    - [Güncellemeler](/tr/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner’a özel erişim">
    Paylaşılan derleme ve başlatma adımlarından sonra tüneli açmak için aşağıdaki kurulumu tamamlayın:

    **Ön koşul:** VPS sshd yapılandırmanızın TCP yönlendirmesine izin verdiğinden emin olun. SSH yapılandırmanızı sıkılaştırdıysanız `/etc/ssh/sshd_config` dosyasını kontrol edin ve şunu ayarlayın:

    ```
    AllowTcpForwarding local
    ```

    `local`, sunucudan uzak yönlendirmeleri engellerken dizüstü bilgisayarınızdan `ssh -L` yerel yönlendirmelerine izin verir. `no` olarak ayarlanması tünelin şu hatayla başarısız olmasına neden olur:
    `channel 3: open failed: administratively prohibited: open failed`

    TCP yönlendirmenin etkin olduğunu doğruladıktan sonra SSH servisini yeniden başlatın
    (`systemctl restart ssh`) ve tüneli dizüstü bilgisayarınızdan çalıştırın:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Açın:

    `http://127.0.0.1:18789/`

    Yapılandırılan paylaşılan sırrı yapıştırın. Bu kılavuz varsayılan olarak gateway token’ını kullanır; parola kimlik doğrulamasına geçtiyseniz bunun yerine o parolayı kullanın.

  </Step>
</Steps>

Paylaşılan kalıcılık haritası [Docker VM Runtime](/tr/install/docker-vm-runtime#what-persists-where) içinde bulunur.

## Kod Olarak Altyapı (Terraform)

Kod olarak altyapı iş akışlarını tercih eden ekipler için topluluk tarafından sürdürülen bir Terraform kurulumu şunları sağlar:

- Uzak durum yönetimli modüler Terraform yapılandırması
- cloud-init aracılığıyla otomatik sağlama
- Dağıtım betikleri (bootstrap, deploy, backup/restore)
- Güvenlik sıkılaştırma (güvenlik duvarı, UFW, yalnızca SSH erişimi)
- Gateway erişimi için SSH tüneli yapılandırması

**Depolar:**

- Altyapı: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker yapılandırması: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Bu yaklaşım, yukarıdaki Docker kurulumunu tekrarlanabilir dağıtımlar, sürüm kontrollü altyapı ve otomatik olağanüstü durum kurtarma ile tamamlar.

<Note>
Topluluk tarafından sürdürülür. Sorunlar veya katkılar için yukarıdaki depo bağlantılarına bakın.
</Note>

## Sonraki adımlar

- Mesajlaşma kanallarını kurun: [Kanallar](/tr/channels)
- Gateway’i yapılandırın: [Gateway yapılandırması](/tr/gateway/configuration)
- OpenClaw’ı güncel tutun: [Güncelleme](/tr/install/updating)

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Fly.io](/tr/install/fly)
- [Docker](/tr/install/docker)
- [VPS barındırma](/tr/vps)

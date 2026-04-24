---
read_when:
    - OpenClaw'ın bir bulut VPS üzerinde 7/24 çalışmasını istiyorsunuz (dizüstü bilgisayarınızda değil)
    - Kendi VPS'inizde üretim sınıfı, her zaman açık bir Gateway istiyorsunuz
    - Kalıcılık, ikili dosyalar ve yeniden başlatma davranışı üzerinde tam denetim istiyorsunuz
    - OpenClaw'ı Hetzner veya benzeri bir sağlayıcıda Docker içinde çalıştırıyorsunuz
summary: OpenClaw Gateway'i ucuz bir Hetzner VPS üzerinde 7/24 çalıştırın (Docker ile), kalıcı durum ve içine gömülü ikili dosyalarla
title: Hetzner
x-i18n:
    generated_at: "2026-04-24T09:16:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9d5917add7afea31426ef587577af21ed18f09302cbf8e542f547a6530ff38b
    source_path: install/hetzner.md
    workflow: 15
---

# Hetzner üzerinde OpenClaw (Docker, Üretim VPS Rehberi)

## Amaç

Kalıcı durum, içine gömülü ikili dosyalar ve güvenli yeniden başlatma davranışı ile Docker kullanarak Hetzner VPS üzerinde kalıcı bir OpenClaw Gateway çalıştırın.

“Yaklaşık 5 dolara 7/24 OpenClaw” istiyorsanız bu en basit güvenilir kurulumdur.
Hetzner fiyatları değişir; en küçük Debian/Ubuntu VPS'i seçin ve OOM yaşarsanız büyütün.

Güvenlik modeli hatırlatması:

- Şirket içinde paylaşılan ajanlar, herkes aynı güven sınırı içindeyse ve çalışma zamanı yalnızca iş amaçlıysa uygundur.
- Sıkı ayrım koruyun: adanmış VPS/çalışma zamanı + adanmış hesaplar; o ana bilgisayarda kişisel Apple/Google/browser/password-manager profilleri olmasın.
- Kullanıcılar birbirine karşı çekişmeliyse gateway/host/OS kullanıcısı bazında ayırın.

Bkz. [Security](/tr/gateway/security) ve [VPS hosting](/tr/vps).

## Ne yapıyoruz (basit anlatımla)?

- Küçük bir Linux sunucusu kiralıyoruz (Hetzner VPS)
- Docker kuruyoruz (yalıtılmış uygulama çalışma zamanı)
- Docker içinde OpenClaw Gateway'i başlatıyoruz
- `~/.openclaw` + `~/.openclaw/workspace` dizinlerini ana bilgisayarda kalıcı tutuyoruz (yeniden başlatmalarda/yeniden derlemelerde korunur)
- Dizüstü bilgisayarınızdan SSH tüneli ile Control UI'ye erişiyoruz

Bağlanan bu `~/.openclaw` durumu şunları içerir: `openclaw.json`, ajan başına
`agents/<agentId>/agent/auth-profiles.json` ve `.env`.

Gateway'e şu yollarla erişilebilir:

- Dizüstü bilgisayarınızdan SSH port yönlendirme
- Güvenlik duvarını ve token'ları kendiniz yönetiyorsanız doğrudan port açma

Bu rehber Hetzner üzerinde Ubuntu veya Debian varsayar.  
Başka bir Linux VPS kullanıyorsanız paketleri buna göre eşleyin.
Genel Docker akışı için [Docker](/tr/install/docker) sayfasına bakın.

---

## Hızlı yol (deneyimli operatörler)

1. Hetzner VPS sağlayın
2. Docker kurun
3. OpenClaw deposunu klonlayın
4. Kalıcı ana bilgisayar dizinlerini oluşturun
5. `.env` ve `docker-compose.yml` yapılandırın
6. Gerekli ikili dosyaları imajın içine gömün
7. `docker compose up -d`
8. Kalıcılığı ve Gateway erişimini doğrulayın

---

## Gerekenler

- root erişimli Hetzner VPS
- Dizüstü bilgisayarınızdan SSH erişimi
- SSH + kopyala/yapıştır ile temel rahatlık
- ~20 dakika
- Docker ve Docker Compose
- Model kimlik doğrulama bilgileri
- İsteğe bağlı sağlayıcı kimlik bilgileri
  - WhatsApp QR
  - Telegram bot token'ı
  - Gmail OAuth

---

<Steps>
  <Step title="VPS'i sağlayın">
    Hetzner içinde Ubuntu veya Debian VPS oluşturun.

    root olarak bağlanın:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Bu rehber VPS'in durumlu olduğunu varsayar.
    Onu atılabilir altyapı olarak değerlendirmeyin.

  </Step>

  <Step title="Docker'ı kurun (VPS üzerinde)">
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

    Bu rehber, ikili dosya kalıcılığını garanti etmek için özel bir imaj oluşturacağınızı varsayar.

  </Step>

  <Step title="Kalıcı ana bilgisayar dizinleri oluşturun">
    Docker container'ları geçicidir.
    Tüm uzun ömürlü durum ana bilgisayarda yaşamalıdır.

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

    `OPENCLAW_GATEWAY_TOKEN` değerini, açıkça
    `.env` üzerinden yönetmek istemiyorsanız boş bırakın; OpenClaw ilk başlatmada
    yapılandırmaya rastgele bir Gateway token'ı yazar. Bir keyring parolası üretin ve
    bunu `GOG_KEYRING_PASSWORD` içine yapıştırın:

    ```bash
    openssl rand -hex 32
    ```

    **Bu dosyayı commit etmeyin.**

    Bu `.env` dosyası `OPENCLAW_GATEWAY_TOKEN` gibi container/çalışma zamanı ortamı içindir.
    Saklanan sağlayıcı OAuth/API anahtarı kimlik doğrulaması, bağlanan
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` içinde bulunur.

  </Step>

  <Step title="Docker Compose yapılandırması">
    `docker-compose.yml` dosyasını oluşturun veya güncelleyin.

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
          # Önerilen: Gateway'i VPS üzerinde yalnızca loopback'e açık tutun; SSH tüneli ile erişin.
          # Herkese açık yapmak için `127.0.0.1:` önekini kaldırın ve güvenlik duvarını buna göre yapılandırın.
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

    `--allow-unconfigured` yalnızca başlangıç kolaylığı içindir; düzgün Gateway yapılandırmasının yerine geçmez. Yine de dağıtımınız için auth (`gateway.auth.token` veya parola) ayarlayın ve güvenli bind ayarları kullanın.

  </Step>

  <Step title="Paylaşılan Docker VM çalışma zamanı adımları">
    Ortak Docker host akışı için paylaşılan çalışma zamanı rehberini kullanın:

    - [Gerekli ikili dosyaları imajın içine gömün](/tr/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Derleyin ve başlatın](/tr/install/docker-vm-runtime#build-and-launch)
    - [Nerede ne kalıcıdır](/tr/install/docker-vm-runtime#what-persists-where)
    - [Güncellemeler](/tr/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner'e özgü erişim">
    Paylaşılan derleme ve başlatma adımlarından sonra dizüstü bilgisayarınızdan tünel açın:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Açın:

    `http://127.0.0.1:18789/`

    Yapılandırılmış paylaşılan gizli bilgiyi yapıştırın. Bu rehber varsayılan olarak Gateway token'ını
    kullanır; parola kimlik doğrulamasına geçtiyseniz onun yerine o parolayı kullanın.

  </Step>
</Steps>

Paylaşılan kalıcılık haritası [Docker VM Runtime](/tr/install/docker-vm-runtime#what-persists-where) içinde bulunur.

## Infrastructure as Code (Terraform)

Infrastructure-as-code iş akışlarını tercih eden ekipler için, topluluk tarafından sürdürülen bir Terraform kurulumu şunları sağlar:

- Uzak durum yönetimli modüler Terraform yapılandırması
- cloud-init aracılığıyla otomatik sağlama
- Dağıtım betikleri (bootstrap, deploy, backup/restore)
- Güvenlik sağlamlaştırması (güvenlik duvarı, UFW, yalnızca SSH erişimi)
- Gateway erişimi için SSH tünel yapılandırması

**Depolar:**

- Altyapı: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker yapılandırması: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Bu yaklaşım; yeniden üretilebilir dağıtımlar, sürüm kontrollü altyapı ve otomatik felaket kurtarma ile yukarıdaki Docker kurulumunu tamamlar.

> **Not:** Topluluk tarafından sürdürülür. Sorunlar veya katkılar için yukarıdaki depo bağlantılarına bakın.

## Sonraki adımlar

- Mesajlaşma kanallarını ayarlayın: [Channels](/tr/channels)
- Gateway'i yapılandırın: [Gateway configuration](/tr/gateway/configuration)
- OpenClaw'ı güncel tutun: [Updating](/tr/install/updating)

## İlgili

- [Kuruluma genel bakış](/tr/install)
- [Fly.io](/tr/install/fly)
- [Docker](/tr/install/docker)
- [VPS hosting](/tr/vps)

---
read_when:
    - OpenClaw’ın bir bulut VPS üzerinde (dizüstü bilgisayarınızda değil) 7/24 çalışmasını istiyorsunuz
    - Kendi VPS’inizde üretim düzeyinde, her zaman açık bir Gateway istiyorsunuz
    - Kalıcılık, ikili dosyalar ve yeniden başlatma davranışı üzerinde tam denetim istiyorsunuz
    - OpenClaw’ı Hetzner veya benzer bir sağlayıcıda Docker içinde çalıştırıyorsunuz
summary: OpenClaw Gateway’i ucuz bir Hetzner VPS üzerinde (Docker) dayanıklı durum ve gömülü ikili dosyalarla 7/24 çalıştırın
title: Hetzner
x-i18n:
    generated_at: "2026-04-19T01:11:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32f5e552ea87970b89c762059bc27f22e0aa3abf001307cae8829b9f1c713a42
    source_path: install/hetzner.md
    workflow: 15
---

# Hetzner’da OpenClaw (Docker, Üretim VPS Rehberi)

## Amaç

OpenClaw Gateway’i bir Hetzner VPS üzerinde Docker kullanarak, dayanıklı durum, gömülü ikili dosyalar ve güvenli yeniden başlatma davranışıyla kalıcı olarak çalıştırın.

“Yaklaşık 5$’a 7/24 OpenClaw” istiyorsanız, bu en basit güvenilir kurulumdur.
Hetzner fiyatları değişir; en küçük Debian/Ubuntu VPS’i seçin ve OOM’lara çarparsanız ölçeği büyütün.

Güvenlik modeli hatırlatması:

- Herkes aynı güven sınırı içindeyse ve çalışma zamanı yalnızca iş amaçlıysa, şirket tarafından paylaşılan ajanlar uygundur.
- Sıkı ayrımı koruyun: ayrılmış VPS/çalışma zamanı + ayrılmış hesaplar; bu ana makinede kişisel Apple/Google/tarayıcı/parola yöneticisi profilleri olmasın.
- Kullanıcılar birbirine karşı düşmanca olabiliyorsa, gateway/ana makine/OS kullanıcısı bazında ayırın.

Bkz. [Güvenlik](/tr/gateway/security) ve [VPS barındırma](/tr/vps).

## Ne yapıyoruz (basitçe)?

- Küçük bir Linux sunucusu kiralayın (Hetzner VPS)
- Docker’ı kurun (yalıtılmış uygulama çalışma zamanı)
- OpenClaw Gateway’i Docker içinde başlatın
- Ana makinede `~/.openclaw` + `~/.openclaw/workspace` dizinlerini kalıcı hale getirin (yeniden başlatma/yeniden derleme sonrasında korunur)
- SSH tüneli üzerinden dizüstü bilgisayarınızdan Control UI’ye erişin

Bağlanan bu `~/.openclaw` durumu; `openclaw.json`, ajan başına
`agents/<agentId>/agent/auth-profiles.json` ve `.env` dosyalarını içerir.

Gateway’e şu yollarla erişilebilir:

- Dizüstü bilgisayarınızdan SSH port yönlendirme
- Güvenlik duvarı ve token yönetimini kendiniz yapıyorsanız doğrudan port açma

Bu rehber, Hetzner üzerinde Ubuntu veya Debian kullandığınızı varsayar.  
Başka bir Linux VPS kullanıyorsanız, paketleri buna göre eşleştirin.
Genel Docker akışı için bkz. [Docker](/tr/install/docker).

---

## Hızlı yol (deneyimli operatörler)

1. Hetzner VPS sağlayın
2. Docker kurun
3. OpenClaw deposunu klonlayın
4. Kalıcı ana makine dizinleri oluşturun
5. `.env` ve `docker-compose.yml` dosyalarını yapılandırın
6. Gerekli ikili dosyaları imaja gömün
7. `docker compose up -d`
8. Kalıcılığı ve Gateway erişimini doğrulayın

---

## Gerekenler

- root erişimine sahip Hetzner VPS
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
  <Step title="VPS’i sağlayın">
    Hetzner’da bir Ubuntu veya Debian VPS oluşturun.

    root olarak bağlanın:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Bu rehber, VPS’in durum bilgili olduğunu varsayar.
    Bunu tek kullanımlık bir altyapı olarak değerlendirmeyin.

  </Step>

  <Step title="Docker’ı kurun (VPS üzerinde)">
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

    Bu rehber, ikili dosya kalıcılığını garanti etmek için özel bir imaj derleyeceğinizi varsayar.

  </Step>

  <Step title="Kalıcı ana makine dizinleri oluşturun">
    Docker kapsayıcıları geçicidir.
    Uzun ömürlü tüm durum ana makinede tutulmalıdır.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Sahipliği kapsayıcı kullanıcısına ayarlayın (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Ortam değişkenlerini yapılandırın">
    Depo kök dizininde `.env` oluşturun.

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
    yönetmek istemiyorsanız boş bırakın; OpenClaw ilk başlatmada
    yapılandırmaya rastgele bir gateway token’ı yazar. Bir anahtarlık
    parolası üretin ve `GOG_KEYRING_PASSWORD` alanına yapıştırın:

    ```bash
    openssl rand -hex 32
    ```

    **Bu dosyayı commit etmeyin.**

    Bu `.env` dosyası, `OPENCLAW_GATEWAY_TOKEN` gibi kapsayıcı/çalışma zamanı ortam değişkenleri içindir.
    Kaydedilen sağlayıcı OAuth/API anahtarı kimlik doğrulaması, bağlanan
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` içinde tutulur.

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
          # Önerilir: Gateway’i VPS üzerinde yalnızca loopback olarak tutun; SSH tüneliyle erişin.
          # Bunu herkese açık hale getirmek için `127.0.0.1:` önekini kaldırın ve güvenlik duvarını buna göre yapılandırın.
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

    `--allow-unconfigured` yalnızca ilk kurulum kolaylığı içindir; uygun bir gateway yapılandırmasının yerine geçmez. Yine de kimlik doğrulamayı (`gateway.auth.token` veya parola) ayarlayın ve dağıtımınız için güvenli bağlama ayarları kullanın.

  </Step>

  <Step title="Paylaşılan Docker VM çalışma zamanı adımları">
    Ortak Docker ana makine akışı için paylaşılan çalışma zamanı rehberini kullanın:

    - [Gerekli ikili dosyaları imaja gömün](/tr/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Derleyin ve başlatın](/tr/install/docker-vm-runtime#build-and-launch)
    - [Neyin nerede kalıcı olduğu](/tr/install/docker-vm-runtime#what-persists-where)
    - [Güncellemeler](/tr/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner’a özgü erişim">
    Paylaşılan derleme ve başlatma adımlarından sonra, dizüstü bilgisayarınızdan tünel kurun:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Açın:

    `http://127.0.0.1:18789/`

    Yapılandırılmış paylaşılan gizli anahtarı yapıştırın. Bu rehber varsayılan olarak gateway token’ını kullanır; parola tabanlı kimlik doğrulamaya geçtiyseniz bunun yerine o parolayı kullanın.

  </Step>
</Steps>

Paylaşılan kalıcılık haritası [Docker VM Runtime](/tr/install/docker-vm-runtime#what-persists-where) bölümünde bulunur.

## Infrastructure as Code (Terraform)

Altyapıyı kod olarak yöneten iş akışlarını tercih eden ekipler için, topluluk tarafından sürdürülen bir Terraform kurulumu şunları sağlar:

- Uzak durum yönetimine sahip modüler Terraform yapılandırması
- cloud-init ile otomatik sağlama
- Dağıtım betikleri (önyükleme, dağıtım, yedekleme/geri yükleme)
- Güvenlik sıkılaştırması (güvenlik duvarı, UFW, yalnızca SSH erişimi)
- Gateway erişimi için SSH tüneli yapılandırması

**Depolar:**

- Altyapı: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker yapılandırması: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Bu yaklaşım, yukarıdaki Docker kurulumunu yeniden üretilebilir dağıtımlar, sürüm kontrollü altyapı ve otomatik felaket kurtarma ile tamamlar.

> **Not:** Topluluk tarafından sürdürülür. Sorunlar veya katkılar için yukarıdaki depo bağlantılarına bakın.

## Sonraki adımlar

- Mesajlaşma kanallarını ayarlayın: [Kanallar](/tr/channels)
- Gateway’i yapılandırın: [Gateway yapılandırması](/tr/gateway/configuration)
- OpenClaw’ı güncel tutun: [Güncelleme](/tr/install/updating)

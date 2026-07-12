---
read_when:
    - OpenClaw'ın dizüstü bilgisayarınızda değil, bulut tabanlı bir VPS üzerinde 7/24 çalışmasını istiyorsunuz
    - Kendi VPS'inizde üretim kalitesinde, her zaman açık bir Gateway istiyorsunuz
    - Kalıcılık, ikili dosyalar ve yeniden başlatma davranışı üzerinde tam denetim istiyorsunuz
    - OpenClaw'ı Hetzner veya benzer bir sağlayıcıda Docker içinde çalıştırıyorsunuz
summary: Kalıcı durum ve yerleşik ikili dosyalarla OpenClaw Gateway'i uygun fiyatlı bir Hetzner VPS'te (Docker) 7/24 çalıştırın
title: Hetzner
x-i18n:
    generated_at: "2026-07-12T12:24:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8ffebc0ce725fd219d13d0a556940327e70dab810b8fbee0b365c4870dc7109b
    source_path: install/hetzner.md
    workflow: 16
---

Docker kullanarak bir Hetzner VPS üzerinde kalıcı durum, imaja gömülü ikili dosyalar ve güvenli yeniden başlatma davranışıyla sürekli çalışan bir OpenClaw Gateway çalıştırın.

Hetzner fiyatları değişebilir; gereksinimlerinizi karşılayan en küçük Debian/Ubuntu VPS'yi seçin ve bellek yetersizliği (OOM) sorunları yaşarsanız kapasiteyi artırın.

Gateway'e dizüstü bilgisayarınızdan SSH port yönlendirmesiyle veya güvenlik duvarını ve token'ları kendiniz yönetiyorsanız doğrudan port erişimiyle bağlanabilirsiniz.

Güvenlik modeli hatırlatması:

- Herkes aynı güven sınırı içindeyse ve çalışma zamanı yalnızca iş amaçlıysa şirket genelinde paylaşılan ajanların kullanılması uygundur.
- Katı ayrım uygulayın: özel VPS/çalışma zamanı + özel hesaplar; bu sunucuda kişisel Apple/Google/tarayıcı/parola yöneticisi profilleri bulundurmayın.
- Kullanıcılar birbirlerine karşı kötü niyetli olabilecekse onları Gateway, sunucu veya işletim sistemi kullanıcısına göre ayırın.

Bkz. [Güvenlik](/tr/gateway/security) ve [VPS barındırma](/tr/vps).

Bu kılavuz, Hetzner üzerinde Ubuntu veya Debian kullandığınızı varsayar. Başka bir Linux VPS kullanıyorsanız paketleri uygun şekilde eşleştirin. Genel Docker akışı için bkz. [Docker](/tr/install/docker).

## Gereksinimler

- Root erişimine sahip Hetzner VPS
- Dizüstü bilgisayarınızdan SSH erişimi
- Docker ve Docker Compose
- Model kimlik doğrulama bilgileri
- İsteğe bağlı sağlayıcı kimlik bilgileri (WhatsApp QR kodu, Telegram bot token'ı, Gmail OAuth)
- Yaklaşık 20 dakika

## Hızlı yol

1. Hetzner VPS'yi sağlayın
2. Docker'ı yükleyin
3. OpenClaw deposunu klonlayın
4. Kalıcı sunucu dizinlerini oluşturun
5. `.env` ve `docker-compose.yml` dosyalarını yapılandırın
6. Gerekli ikili dosyaları imaja gömün
7. `docker compose up -d`
8. Kalıcılığı ve Gateway erişimini doğrulayın

<Steps>
  <Step title="VPS'yi sağlayın">
    Hetzner'da bir Ubuntu veya Debian VPS oluşturun, ardından root olarak bağlanın:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    VPS'yi atılabilir altyapı olarak değil, durum bilgisi taşıyan bir sistem olarak değerlendirin.

  </Step>

  <Step title="Docker'ı yükleyin (VPS üzerinde)">
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

    Bu kılavuz, imaja gömdüğünüz tüm ikili dosyaların yeniden başlatmalardan sonra korunması için özel bir imaj oluşturur.

  </Step>

  <Step title="Kalıcı sunucu dizinlerini oluşturun">
    Docker konteynerleri geçicidir; uzun süre saklanması gereken tüm durum sunucuda bulunmalıdır.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Sahipliği konteyner kullanıcısına ayarlayın (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Ortam değişkenlerini yapılandırın">
    Depo kökünde `.env` dosyasını oluşturun:

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

    Kararlı Gateway token'ını `.env` üzerinden yönetmek için
    `OPENCLAW_GATEWAY_TOKEN` değerini ayarlayın; aksi takdirde istemcilerin
    yeniden başlatmalar arasında çalışmasına güvenmeden önce `gateway.auth.token`
    ayarını yapılandırın. İkisi de ayarlanmamışsa OpenClaw, o başlatma için
    yalnızca çalışma zamanında geçerli bir token kullanır. `GOG_KEYRING_PASSWORD`
    için bir anahtarlık parolası oluşturun:

    ```bash
    openssl rand -hex 32
    ```

    **Bu dosyayı depoya işlemeyin.** Dosya, `OPENCLAW_GATEWAY_TOKEN` gibi
    konteyner/çalışma zamanı ortam değişkenlerini içerir. Saklanan sağlayıcı
    OAuth/API anahtarı kimlik doğrulama bilgileri, bağlanan
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` dosyasında bulunur.

  </Step>

  <Step title="Docker Compose yapılandırması">
    `docker-compose.yml` dosyasını oluşturun veya güncelleyin:

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
          # Önerilen: Gateway'i VPS üzerinde yalnızca yerel geri döngüden erişilebilir tutun; SSH tüneli üzerinden erişin.
          # Herkese açık hâle getirmek için `127.0.0.1:` önekini kaldırın ve güvenlik duvarını buna göre yapılandırın.
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

    `--allow-unconfigured` yalnızca ilk kurulumu kolaylaştırmak içindir; gerçek Gateway yapılandırmasının yerine geçmez. Dağıtımınız için yine de kimlik doğrulamayı (`gateway.auth.token` veya parola) ve güvenli bir bağlama modunu ayarlayın.

  </Step>

  <Step title="Paylaşılan Docker VM çalışma zamanı adımları">
    Ortak Docker sunucusu akışı için paylaşılan çalışma zamanı kılavuzunu izleyin:

    - [Gerekli ikili dosyaları imaja gömün](/tr/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Derleyin ve başlatın](/tr/install/docker-vm-runtime#build-and-launch)
    - [Nelerin nerede kalıcı olduğu](/tr/install/docker-vm-runtime#what-persists-where)
    - [Güncellemeler](/tr/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner'a özgü erişim">
    Paylaşılan derleme ve başlatma adımlarından sonra tüneli açın.

    **Ön koşul:** VPS'nizin sshd yapılandırmasının TCP yönlendirmesine izin
    verdiğinden emin olun. SSH yapılandırmanızı sıkılaştırdıysanız
    `/etc/ssh/sshd_config` dosyasını kontrol edin ve şunu ayarlayın:

    ```text
    AllowTcpForwarding local
    ```

    `local`, sunucudan uzak yönlendirmeleri engellerken dizüstü bilgisayarınızdan
    `ssh -L` ile yerel yönlendirmelere izin verir. Bu değeri `no` olarak ayarlamak,
    tünelin şu hatayla başarısız olmasına neden olur:
    `channel 3: open failed: administratively prohibited: open failed`

    TCP yönlendirmenin etkin olduğunu doğruladıktan sonra SSH hizmetini yeniden
    başlatın (`systemctl restart ssh`) ve tüneli dizüstü bilgisayarınızdan çalıştırın:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    `http://127.0.0.1:18789/` adresini açın ve yapılandırılmış paylaşılan gizli
    bilgiyi yapıştırın. Bu kılavuz varsayılan olarak Gateway token'ını kullanır;
    parola tabanlı kimlik doğrulamaya geçtiyseniz bunun yerine yapılandırdığınız
    parolayı kullanın.

  </Step>
</Steps>

Paylaşılan kalıcılık eşlemesi [Docker VM Çalışma Zamanı](/tr/install/docker-vm-runtime#what-persists-where) bölümünde yer alır.

## Kod Olarak Altyapı (Terraform)

Kod olarak altyapı iş akışlarını tercih eden ekipler için topluluk tarafından sürdürülen bir Terraform kurulumu şunları sağlar:

- Uzak durum yönetimine sahip modüler Terraform yapılandırması
- cloud-init aracılığıyla otomatik kaynak sağlama
- Dağıtım betikleri (ilk kurulum, dağıtım, yedekleme/geri yükleme)
- Güvenlik sıkılaştırması (güvenlik duvarı, UFW, yalnızca SSH erişimi)
- Gateway erişimi için SSH tüneli yapılandırması

**Depolar:**

- Altyapı: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker yapılandırması: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Bu yaklaşım, yukarıdaki Docker kurulumunu yeniden üretilebilir dağıtımlar, sürüm denetimli altyapı ve otomatik olağanüstü durum kurtarma özellikleriyle tamamlar.

<Note>
Topluluk tarafından sürdürülmektedir. Sorunlar veya katkılar için yukarıdaki depo bağlantılarına bakın.
</Note>

## Sonraki adımlar

- Mesajlaşma kanallarını kurun: [Kanallar](/tr/channels)
- Gateway'i yapılandırın: [Gateway yapılandırması](/tr/gateway/configuration)
- OpenClaw'ı güncel tutun: [Güncelleme](/tr/install/updating)

## İlgili

- [Kuruluma genel bakış](/tr/install)
- [Fly.io](/tr/install/fly)
- [Docker](/tr/install/docker)
- [VPS barındırma](/tr/vps)

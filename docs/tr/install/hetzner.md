---
read_when:
    - OpenClaw'ın 7/24 bir bulut VPS üzerinde çalışmasını istiyorsunuz (dizüstü bilgisayarınızda değil)
    - Kendi VPS'inizde üretim düzeyinde, her zaman açık bir Gateway istiyorsunuz
    - Kalıcılık, ikili dosyalar ve yeniden başlatma davranışı üzerinde tam denetim istiyorsunuz
    - OpenClaw'ı Hetzner veya benzeri bir sağlayıcıda Docker içinde çalıştırıyorsunuz
summary: Kalıcı durum, imaj içine gömülü ikili dosyalar ve güvenli yeniden başlatma davranışıyla OpenClaw Gateway'i ucuz bir Hetzner VPS üzerinde 7/24 çalıştırın
title: Hetzner
x-i18n:
    generated_at: "2026-04-05T13:57:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: d859e4c0943040b022835f320708f879a11eadef70f2816cf0f2824eaaf165ef
    source_path: install/hetzner.md
    workflow: 15
---

# Hetzner üzerinde OpenClaw (Docker, Üretim VPS Kılavuzu)

## Hedef

OpenClaw Gateway'i Hetzner VPS üzerinde Docker kullanarak; kalıcı durum, imaj içine gömülü ikili dosyalar ve güvenli yeniden başlatma davranışıyla çalıştırmak.

“Yaklaşık $5'a 7/24 OpenClaw” istiyorsanız bu en basit güvenilir kurulumdur.
Hetzner fiyatları değişir; en küçük Debian/Ubuntu VPS'i seçin ve OOM yaşamaya başlarsanız büyütün.

Güvenlik modeli hatırlatması:

- Herkes aynı güven sınırındaysa ve çalışma zamanı yalnızca iş amaçlıysa şirket içinde paylaşılan aracılar uygundur.
- Sıkı ayrımı koruyun: ayrılmış VPS/çalışma zamanı + ayrılmış hesaplar; o ana makinede kişisel Apple/Google/browser/password-manager profilleri bulunmamalı.
- Kullanıcılar birbirine karşı hasım olabiliyorsa gateway/host/OS kullanıcısı bazında ayırın.

Bkz. [Security](/gateway/security) ve [VPS hosting](/vps).

## Ne yapıyoruz (basit anlatım)

- Küçük bir Linux sunucusu kiralayın (Hetzner VPS)
- Docker kurun (yalıtılmış uygulama çalışma zamanı)
- Docker içinde OpenClaw Gateway'i başlatın
- `~/.openclaw` + `~/.openclaw/workspace` klasörlerini ana makinede kalıcı tutun (yeniden başlatma/yeniden derlemede korunur)
- Control UI'ye dizüstü bilgisayarınızdan SSH tüneli üzerinden erişin

Mount edilen `~/.openclaw` durumu şunları içerir: `openclaw.json`, aracı başına
`agents/<agentId>/agent/auth-profiles.json` ve `.env`.

Gateway'e şu yollarla erişilebilir:

- Dizüstü bilgisayarınızdan SSH port yönlendirme
- Güvenlik duvarını ve token'ları kendiniz yönetirseniz doğrudan port açma

Bu kılavuz Hetzner üzerinde Ubuntu veya Debian varsayar.  
Başka bir Linux VPS üzerindeyseniz paketleri buna göre eşleyin.
Genel Docker akışı için bkz. [Docker](/install/docker).

---

## Hızlı yol (deneyimli operatörler)

1. Hetzner VPS sağlayın
2. Docker kurun
3. OpenClaw deposunu clone edin
4. Kalıcı ana makine dizinlerini oluşturun
5. `.env` ve `docker-compose.yml` dosyalarını yapılandırın
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
- Model auth kimlik bilgileri
- İsteğe bağlı sağlayıcı kimlik bilgileri
  - WhatsApp QR
  - Telegram bot token'ı
  - Gmail OAuth

---

<Steps>
  <Step title="VPS'i sağlayın">
    Hetzner içinde bir Ubuntu veya Debian VPS oluşturun.

    root olarak bağlanın:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Bu kılavuz VPS'in durum bilgili olduğunu varsayar.
    Onu tek kullanımlık altyapı olarak değerlendirmeyin.

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

  <Step title="OpenClaw deposunu clone edin">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Bu kılavuz, ikili dosya kalıcılığını garanti etmek için özel bir imaj oluşturacağınızı varsayar.

  </Step>

  <Step title="Kalıcı ana makine dizinlerini oluşturun">
    Docker kapsayıcıları geçicidir.
    Tüm uzun ömürlü durum ana makinede yaşamalıdır.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Sahipliği kapsayıcı kullanıcısına ayarla (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Ortam değişkenlerini yapılandırın">
    Depo kökünde `.env` oluşturun.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=change-me-now
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=change-me-now
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Güçlü gizli veriler üretin:

    ```bash
    openssl rand -hex 32
    ```

    **Bu dosyayı commit etmeyin.**

    Bu `.env` dosyası, `OPENCLAW_GATEWAY_TOKEN` gibi kapsayıcı/çalışma zamanı env değerleri içindir.
    Saklanan sağlayıcı OAuth/API anahtarı auth bilgileri, mount edilen
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` içinde yaşar.

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
          # Önerilen: Gateway'i VPS üzerinde yalnızca loopback olarak tutun; SSH tüneliyle erişin.
          # Herkese açık sunmak için `127.0.0.1:` önekini kaldırın ve güvenlik duvarını buna göre yapılandırın.
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

    `--allow-unconfigured`, yalnızca bootstrap kolaylığı içindir; doğru gateway yapılandırmasının yerine geçmez. Yine de auth (`gateway.auth.token` veya password) ayarlayın ve dağıtımınız için güvenli bind ayarları kullanın.

  </Step>

  <Step title="Paylaşılan Docker VM çalışma zamanı adımları">
    Yaygın Docker host akışı için paylaşılan çalışma zamanı kılavuzunu kullanın:

    - [Gerekli ikili dosyaları imajın içine gömün](/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Derleyin ve başlatın](/install/docker-vm-runtime#build-and-launch)
    - [Nerede ne kalıcı olur](/install/docker-vm-runtime#what-persists-where)
    - [Güncellemeler](/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner'e özgü erişim">
    Paylaşılan derleme ve başlatma adımlarından sonra dizüstü bilgisayarınızdan tünel açın:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Şunu açın:

    `http://127.0.0.1:18789/`

    Yapılandırılmış paylaşılan gizli veriyi yapıştırın. Bu kılavuz varsayılan olarak gateway token kullanır; password auth'a geçtiyseniz onun yerine parolayı kullanın.

  </Step>
</Steps>

Paylaşılan kalıcılık haritası [Docker VM Runtime](/install/docker-vm-runtime#what-persists-where) içinde bulunur.

## Infrastructure as Code (Terraform)

Infrastructure as Code iş akışlarını tercih eden ekipler için topluluk tarafından sürdürülen bir Terraform kurulumu şunları sağlar:

- Uzak durum yönetimiyle modüler Terraform yapılandırması
- cloud-init ile otomatik sağlama
- Dağıtım betikleri (bootstrap, dağıtım, yedekleme/geri yükleme)
- Güvenlik sağlamlaştırması (firewall, UFW, yalnızca SSH erişimi)
- gateway erişimi için SSH tüneli yapılandırması

**Depolar:**

- Altyapı: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker yapılandırması: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Bu yaklaşım; yeniden üretilebilir dağıtımlar, sürüm kontrollü altyapı ve otomatik felaket kurtarma ile yukarıdaki Docker kurulumunu tamamlar.

> **Not:** Topluluk tarafından sürdürülür. Sorunlar veya katkılar için yukarıdaki depo bağlantılarına bakın.

## Sonraki adımlar

- Mesajlaşma kanallarını kurun: [Channels](/tr/channels)
- Gateway'i yapılandırın: [Gateway configuration](/gateway/configuration)
- OpenClaw'ı güncel tutun: [Updating](/install/updating)

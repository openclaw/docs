---
read_when:
    - OpenClaw'un GCP üzerinde 7/24 çalışmasını istiyorsunuz
    - Kendi sanal makinenizde üretim kalitesinde, sürekli çalışan bir Gateway istiyorsunuz
    - Kalıcılık, ikili dosyalar ve yeniden başlatma davranışı üzerinde tam denetim istiyorsunuz
summary: Kalıcı durumla bir GCP Compute Engine sanal makinesinde (Docker) OpenClaw Gateway'i 7/24 çalıştırın
title: GCP
x-i18n:
    generated_at: "2026-07-12T11:53:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ca46b2ee78731162261cae6ea5a26b718be6035b998fa92e4ee5c9ea2e7ae07
    source_path: install/gcp.md
    workflow: 16
---

Dayanıklı durum, imaja yerleştirilmiş ikili dosyalar ve güvenli yeniden başlatma davranışıyla Docker kullanarak bir GCP Compute Engine sanal makinesinde kalıcı bir OpenClaw Gateway çalıştırın.

Fiyatlandırma makine türüne ve bölgeye göre değişir; iş yükünüze uygun en küçük sanal makineyi seçin ve bellek yetersizliğiyle karşılaşırsanız ölçeği büyütün.

Gateway'e dizüstü bilgisayarınızdan SSH bağlantı noktası yönlendirmesiyle veya güvenlik duvarını ve token'ları kendiniz yönetiyorsanız bağlantı noktasını doğrudan açarak erişebilirsiniz.

Bu kılavuzda GCP Compute Engine üzerinde Debian kullanılır. Ubuntu da kullanılabilir; paketleri buna göre eşleştirin. Genel Docker akışı için [Docker](/tr/install/docker) sayfasına bakın.

## Gereksinimler

- GCP hesabı (`e2-micro` ücretsiz katmana uygundur)
- `gcloud` CLI veya [Cloud Console](https://console.cloud.google.com)
- Dizüstü bilgisayarınızdan SSH erişimi
- Docker ve Docker Compose
- Model kimlik doğrulama bilgileri
- İsteğe bağlı sağlayıcı kimlik bilgileri (WhatsApp QR, Telegram bot token'ı, Gmail OAuth)
- Yaklaşık 20-30 dakika

## Hızlı yol

1. Bir GCP projesi oluşturun, faturalandırmayı ve Compute Engine API'yi etkinleştirin
2. Bir Compute Engine sanal makinesi oluşturun (`e2-small`, Debian 12, 20 GB)
3. Sanal makineye SSH ile bağlanıp Docker'ı yükleyin
4. OpenClaw deposunu klonlayın
5. Kalıcı ana makine dizinlerini oluşturun
6. `.env` ve `docker-compose.yml` dosyalarını yapılandırın
7. Gerekli ikili dosyaları imaja yerleştirin, derleyin ve başlatın

<Steps>
  <Step title="gcloud CLI'yi yükleyin (veya Console'u kullanın)">
    [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install) adresinden yükleyin, ardından:

    ```bash
    gcloud init
    gcloud auth login
    ```

    Alternatif olarak aşağıdaki tüm adımları [Cloud Console](https://console.cloud.google.com) web arayüzü üzerinden gerçekleştirin.

  </Step>

  <Step title="Bir GCP projesi oluşturun">
    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    gcloud services enable compute.googleapis.com
    ```

    [console.cloud.google.com/billing](https://console.cloud.google.com/billing) adresinden faturalandırmayı etkinleştirin (Compute Engine için gereklidir).

    Console'daki eşdeğeri: IAM & Admin > Create Project yolunu izleyin, faturalandırmayı etkinleştirin, ardından APIs & Services > Enable APIs > "Compute Engine API" > Enable yolunu izleyin.

  </Step>

  <Step title="Sanal makineyi oluşturun">
    | Tür       | Özellikler               | Maliyet                   | Notlar                                               |
    | --------- | ------------------------ | ------------------------- | ---------------------------------------------------- |
    | e2-medium | 2 vCPU, 4 GB RAM         | Aylık yaklaşık 25 ABD doları | Yerel Docker derlemeleri için en güvenilir seçenek |
    | e2-small  | 2 vCPU, 2 GB RAM         | Aylık yaklaşık 12 ABD doları | Docker derlemesi için önerilen en düşük seçenek    |
    | e2-micro  | 2 vCPU (paylaşımlı), 1 GB RAM | Ücretsiz katmana uygun | Docker derlemesi sırasında bellek yetersizliği nedeniyle sık sık başarısız olur (çıkış 137) |

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

  </Step>

  <Step title="Sanal makineye SSH ile bağlanın">
    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Console: Compute Engine panosunda sanal makinenin yanındaki "SSH" seçeneğine tıklayın.

    Sanal makine oluşturulduktan sonra SSH anahtarının yayılması 1-2 dakika sürebilir; bağlantı reddedilirse bekleyip yeniden deneyin.

  </Step>

  <Step title="Docker'ı yükleyin (sanal makinede)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Grup değişikliğinin geçerli olması için oturumu kapatıp yeniden açın, ardından SSH ile tekrar bağlanın:

    ```bash
    exit
    ```

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
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

    Bu kılavuz, imaja yerleştirdiğiniz ikili dosyaların yeniden başlatmalardan sonra korunması için özel bir imaj derler.

  </Step>

  <Step title="Kalıcı ana makine dizinlerini oluşturun">
    Docker konteynerleri geçicidir; uzun ömürlü tüm durum ana makinede bulunmalıdır.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Ortam değişkenlerini yapılandırın">
    Depo kökünde `.env` dosyasını oluşturun:

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Kararlı Gateway token'ını `.env` üzerinden yönetmek için `OPENCLAW_GATEWAY_TOKEN`
    değerini ayarlayın; aksi takdirde yeniden başlatmalar boyunca istemcilere
    güvenmeden önce `gateway.auth.token` değerini yapılandırın. İkisi de
    ayarlanmamışsa OpenClaw bu başlatma için yalnızca çalışma zamanına özgü bir
    token kullanır. `GOG_KEYRING_PASSWORD` için bir anahtarlık parolası oluşturun:

    ```bash
    openssl rand -hex 32
    ```

    **Bu dosyayı commit etmeyin.** Dosya, `OPENCLAW_GATEWAY_TOKEN` gibi
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
          # Önerilen: Gateway'i sanal makinede yalnızca loopback üzerinden erişilebilir tutun; SSH tüneliyle erişin.
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

    `--allow-unconfigured` yalnızca ilk kurulum kolaylığı içindir; gerçek Gateway yapılandırmasının yerine geçmez. Dağıtımınız için yine de kimlik doğrulamayı (`gateway.auth.token` veya parola) ve güvenli bir bağlama modunu ayarlayın.

  </Step>

  <Step title="Paylaşılan Docker sanal makinesi çalışma zamanı adımları">
    Genel Docker ana makine akışı için paylaşılan çalışma zamanı kılavuzunu izleyin:

    - [Gerekli ikili dosyaları imaja yerleştirin](/tr/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Derleyin ve başlatın](/tr/install/docker-vm-runtime#build-and-launch)
    - [Nelerin nerede kalıcı olduğu](/tr/install/docker-vm-runtime#what-persists-where)
    - [Güncellemeler](/tr/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP'ye özgü başlatma notları">
    `pnpm install --frozen-lockfile` sırasında derleme `Killed` veya `exit code 137` hatasıyla başarısız olursa sanal makinenin belleği tükenmiştir. En az `e2-small`, ilk derlemelerin daha güvenilir olması için ise `e2-medium` kullanın.

    LAN'a bağlanırken (`OPENCLAW_GATEWAY_BIND=lan`) devam etmeden önce güvenilir bir tarayıcı kökeni yapılandırın:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Değiştirdiyseniz `18789` değerini yapılandırdığınız bağlantı noktasıyla değiştirin.

  </Step>

  <Step title="Dizüstü bilgisayarınızdan erişin">
    Gateway bağlantı noktasını yönlendirmek için bir SSH tüneli oluşturun:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Tarayıcınızda `http://127.0.0.1:18789/` adresini açın.

    Temiz bir pano bağlantısını yeniden yazdırın:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Kullanıcı arayüzü paylaşılan gizli anahtarla kimlik doğrulaması isterse yapılandırılmış
    token'ı veya parolayı Control UI ayarlarına yapıştırın (bu Docker akışı
    varsayılan olarak bir token yazar; parola ile kimlik doğrulamaya geçtiyseniz
    bunun yerine yapılandırdığınız parolayı kullanın).

    Control UI `unauthorized` veya `disconnected (1008): pairing required` gösterirse tarayıcı cihazını onaylayın:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Paylaşılan kalıcılık eşlemesi için [Docker Sanal Makinesi Çalışma Zamanı](/tr/install/docker-vm-runtime#what-persists-where) ve [güncelleme akışı](/tr/install/docker-vm-runtime#updates) bölümlerine bakın.

  </Step>
</Steps>

## Sorun giderme

**SSH bağlantısı reddedildi**

Sanal makine oluşturulduktan sonra SSH anahtarının yayılması 1-2 dakika sürebilir. Bekleyip yeniden deneyin.

**OS Login sorunları**

OS Login profilinizi kontrol edin:

```bash
gcloud compute os-login describe-profile
```

Hesabınızın gerekli IAM izinlerine (Compute OS Login veya Compute OS Admin Login) sahip olduğundan emin olun.

**Bellek yetersizliği (OOM)**

Docker derlemesi `Killed` ve `exit code 137` hatasıyla başarısız olursa sanal makine bellek yetersizliği nedeniyle sonlandırılmıştır:

```bash
# Önce sanal makineyi durdurun
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Makine türünü değiştirin
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Sanal makineyi başlatın
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

## Hizmet hesapları (güvenlik için en iyi uygulama)

Kişisel kullanım için varsayılan kullanıcı hesabınız yeterlidir. Otomasyon veya CI/CD için en az izinlere sahip özel bir hizmet hesabı oluşturun:

```bash
gcloud iam service-accounts create openclaw-deploy \
  --display-name="OpenClaw Deployment"

gcloud projects add-iam-policy-binding my-openclaw-project \
  --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"
```

Otomasyon için Owner rolünü kullanmaktan kaçının; çalışan en dar kapsamlı rolü kullanın. [Rolleri anlama](https://cloud.google.com/iam/docs/understanding-roles) sayfasına bakın.

## Sonraki adımlar

- Mesajlaşma kanallarını ayarlayın: [Kanallar](/tr/channels)
- Yerel cihazları Node olarak eşleştirin: [Node'lar](/tr/nodes)
- Gateway'i yapılandırın: [Gateway yapılandırması](/tr/gateway/configuration)

## İlgili

- [Kuruluma genel bakış](/tr/install)
- [Azure](/tr/install/azure)
- [VPS barındırma](/tr/vps)

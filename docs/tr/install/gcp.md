---
read_when:
    - OpenClaw'ın GCP üzerinde 7/24 çalışmasını istiyorsunuz
    - Kendi sanal makinenizde üretim düzeyinde, her zaman açık bir Gateway istiyorsunuz
    - Kalıcılık, ikili dosyalar ve yeniden başlatma davranışı üzerinde tam denetim istiyorsunuz
summary: OpenClaw Gateway'i kalıcı durumla bir GCP Compute Engine VM'sinde (Docker) 7/24 çalıştırın
title: GCP
x-i18n:
    generated_at: "2026-05-06T09:18:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: eefd3a324ababdaa3072cda5354c1d59ddfe80c2f88f24a4ad21208f54636e89
    source_path: install/gcp.md
    workflow: 16
---

Kalıcı duruma, imaj içine eklenmiş ikili dosyalara ve güvenli yeniden başlatma davranışına sahip Docker kullanarak bir GCP Compute Engine VM üzerinde kalıcı bir OpenClaw Gateway çalıştırın.

"~$5-12/ay karşılığında 7/24 OpenClaw" istiyorsanız, bu Google Cloud üzerinde güvenilir bir kurulumdur.
Fiyatlandırma makine türüne ve bölgeye göre değişir; iş yükünüze uyan en küçük VM’yi seçin ve OOM yaşarsanız ölçek büyütün.

## Ne yapıyoruz (basit anlatımla)?

- Bir GCP projesi oluşturup faturalandırmayı etkinleştirin
- Bir Compute Engine VM oluşturun
- Docker’ı kurun (yalıtılmış uygulama çalışma zamanı)
- Docker içinde OpenClaw Gateway’i başlatın
- `~/.openclaw` + `~/.openclaw/workspace` dizinlerini ana makinede kalıcı hale getirin (yeniden başlatmalardan/yeniden derlemelerden etkilenmez)
- Dizüstü bilgisayarınızdan SSH tüneli üzerinden Control UI’a erişin

Bağlanan `~/.openclaw` durumu `openclaw.json`, ajan başına
`agents/<agentId>/agent/auth-profiles.json` ve `.env` dosyalarını içerir.

Gateway’e şu yollarla erişilebilir:

- Dizüstü bilgisayarınızdan SSH port yönlendirme
- Güvenlik duvarını ve tokenları kendiniz yönetiyorsanız doğrudan port açma

Bu kılavuz GCP Compute Engine üzerinde Debian kullanır.
Ubuntu da çalışır; paketleri buna göre eşleştirin.
Genel Docker akışı için bkz. [Docker](/tr/install/docker).

---

## Hızlı yol (deneyimli operatörler)

1. GCP projesi oluşturun + Compute Engine API’yi etkinleştirin
2. Compute Engine VM oluşturun (e2-small, Debian 12, 20GB)
3. VM’ye SSH ile bağlanın
4. Docker’ı kurun
5. OpenClaw deposunu klonlayın
6. Kalıcı ana makine dizinleri oluşturun
7. `.env` ve `docker-compose.yml` yapılandırın
8. Gerekli ikili dosyaları imaja ekleyin, derleyin ve başlatın

---

## Gerekenler

- GCP hesabı (e2-micro için ücretsiz katmana uygun)
- gcloud CLI kurulu (veya Cloud Console kullanın)
- Dizüstü bilgisayarınızdan SSH erişimi
- SSH + kopyala/yapıştır konusunda temel rahatlık
- ~20-30 dakika
- Docker ve Docker Compose
- Model kimlik doğrulama bilgileri
- İsteğe bağlı sağlayıcı kimlik bilgileri
  - WhatsApp QR
  - Telegram bot tokenı
  - Gmail OAuth

---

<Steps>
  <Step title="gcloud CLI kurun (veya Console kullanın)">
    **Seçenek A: gcloud CLI** (otomasyon için önerilir)

    [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install) adresinden kurun

    Başlatın ve kimlik doğrulaması yapın:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **Seçenek B: Cloud Console**

    Tüm adımlar web UI üzerinden [https://console.cloud.google.com](https://console.cloud.google.com) adresinde yapılabilir

  </Step>

  <Step title="Bir GCP projesi oluşturun">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    Faturalandırmayı [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) adresinde etkinleştirin (Compute Engine için gereklidir).

    Compute Engine API’yi etkinleştirin:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. IAM & Admin > Create Project bölümüne gidin
    2. Adlandırın ve oluşturun
    3. Proje için faturalandırmayı etkinleştirin
    4. APIs & Services > Enable APIs bölümüne gidin > "Compute Engine API" arayın > Enable

  </Step>

  <Step title="VM oluşturun">
    **Makine türleri:**

    | Tür       | Özellikler              | Maliyet            | Notlar                                       |
    | --------- | ----------------------- | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM         | ~$25/ay            | Yerel Docker derlemeleri için en güvenilir   |
    | e2-small  | 2 vCPU, 2GB RAM         | ~$12/ay            | Docker derlemesi için önerilen minimum       |
    | e2-micro  | 2 vCPU (paylaşımlı), 1GB RAM | Ücretsiz katmana uygun | Docker derlemesinde OOM (exit 137) ile sıkça başarısız olur |

    **CLI:**

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

    **Console:**

    1. Compute Engine > VM instances > Create instance bölümüne gidin
    2. Ad: `openclaw-gateway`
    3. Bölge: `us-central1`, Zone: `us-central1-a`
    4. Makine türü: `e2-small`
    5. Önyükleme diski: Debian 12, 20GB
    6. Oluşturun

  </Step>

  <Step title="VM’ye SSH ile bağlanın">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Compute Engine panosunda VM’nizin yanındaki "SSH" düğmesine tıklayın.

    Not: VM oluşturulduktan sonra SSH anahtar yayılımı 1-2 dakika sürebilir. Bağlantı reddedilirse bekleyin ve tekrar deneyin.

  </Step>

  <Step title="Docker’ı kurun (VM üzerinde)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Grup değişikliğinin etkili olması için çıkış yapıp tekrar giriş yapın:

    ```bash
    exit
    ```

    Ardından tekrar SSH ile bağlanın:

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

    Bu kılavuz, ikili dosya kalıcılığını garanti etmek için özel bir imaj derleyeceğinizi varsayar.

  </Step>

  <Step title="Kalıcı ana makine dizinleri oluşturun">
    Docker kapsayıcıları geçicidir.
    Uzun ömürlü tüm durum ana makinede yaşamalıdır.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Ortam değişkenlerini yapılandırın">
    Depo kökünde `.env` oluşturun.

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

    Açıkça `.env` üzerinden yönetmek istemediğiniz sürece
    `OPENCLAW_GATEWAY_TOKEN` alanını boş bırakın; OpenClaw ilk başlatmada
    yapılandırmaya rastgele bir gateway tokenı yazar. Bir keyring parolası oluşturup
    `GOG_KEYRING_PASSWORD` içine yapıştırın:

    ```bash
    openssl rand -hex 32
    ```

    **Bu dosyayı commit etmeyin.**

    Bu `.env` dosyası `OPENCLAW_GATEWAY_TOKEN` gibi kapsayıcı/çalışma zamanı ortamı içindir.
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
          # Önerilen: Gateway’i VM üzerinde yalnızca loopback’te tutun; SSH tüneli üzerinden erişin.
          # Herkese açık hale getirmek için `127.0.0.1:` önekini kaldırın ve güvenlik duvarını buna göre yapılandırın.
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

    `--allow-unconfigured` yalnızca bootstrap kolaylığı içindir; doğru gateway yapılandırmasının yerine geçmez. Yine de dağıtımınız için kimlik doğrulamayı (`gateway.auth.token` veya parola) ayarlayın ve güvenli bind ayarları kullanın.

  </Step>

  <Step title="Paylaşılan Docker VM çalışma zamanı adımları">
    Ortak Docker ana makine akışı için paylaşılan çalışma zamanı kılavuzunu kullanın:

    - [Gerekli ikili dosyaları imaja ekleyin](/tr/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Derleyin ve başlatın](/tr/install/docker-vm-runtime#build-and-launch)
    - [Ne nerede kalıcı olur](/tr/install/docker-vm-runtime#what-persists-where)
    - [Güncellemeler](/tr/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP’ye özgü başlatma notları">
    GCP’de derleme `pnpm install --frozen-lockfile` sırasında `Killed` veya `exit code 137` ile başarısız olursa VM’nin belleği yetersizdir. Minimum `e2-small` kullanın veya ilk derlemelerin daha güvenilir olması için `e2-medium` kullanın.

    LAN’a bind ederken (`OPENCLAW_GATEWAY_BIND=lan`), devam etmeden önce güvenilir bir tarayıcı kaynağı yapılandırın:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Gateway portunu değiştirdiyseniz `18789` değerini yapılandırdığınız portla değiştirin.

  </Step>

  <Step title="Dizüstü bilgisayarınızdan erişin">
    Gateway portunu yönlendirmek için bir SSH tüneli oluşturun:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Tarayıcınızda açın:

    `http://127.0.0.1:18789/`

    Temiz bir pano bağlantısını yeniden yazdırın:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    UI paylaşılan gizli kimlik doğrulaması isterse yapılandırılmış tokenı veya
    parolayı Control UI ayarlarına yapıştırın. Bu Docker akışı varsayılan olarak
    bir token yazar; kapsayıcı yapılandırmasını parola kimlik doğrulamasına
    geçirirseniz bunun yerine o parolayı kullanın.

    Control UI `unauthorized` veya `disconnected (1008): pairing required` gösterirse tarayıcı cihazını onaylayın:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Paylaşılan kalıcılık ve güncelleme başvurusuna tekrar mı ihtiyacınız var?
    Bkz. [Docker VM Runtime](/tr/install/docker-vm-runtime#what-persists-where) ve [Docker VM Runtime güncellemeleri](/tr/install/docker-vm-runtime#updates).

  </Step>
</Steps>

---

## Sorun giderme

**SSH bağlantısı reddedildi**

VM oluşturulduktan sonra SSH anahtar yayılımı 1-2 dakika sürebilir. Bekleyin ve tekrar deneyin.

**OS Login sorunları**

OS Login profilinizi kontrol edin:

```bash
gcloud compute os-login describe-profile
```

Hesabınızın gerekli IAM izinlerine sahip olduğundan emin olun (Compute OS Login veya Compute OS Admin Login).

**Bellek yetersiz (OOM)**

Docker derlemesi `Killed` ve `exit code 137` ile başarısız olursa VM OOM nedeniyle sonlandırılmıştır. e2-small’a (minimum) veya e2-medium’a (güvenilir yerel derlemeler için önerilir) yükseltin:

```bash
# Önce VM’yi durdurun
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Makine türünü değiştirin
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# VM’yi başlatın
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## Hizmet hesapları (güvenlik için en iyi uygulama)

Kişisel kullanım için varsayılan kullanıcı hesabınız yeterlidir.

Otomasyon veya CI/CD işlem hatları için minimum izinlere sahip özel bir hizmet hesabı oluşturun:

1. Bir hizmet hesabı oluşturun:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Compute Instance Admin rolünü (veya daha dar özel bir rolü) verin:

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

Otomasyon için Owner rolünü kullanmaktan kaçının. En az ayrıcalık ilkesini uygulayın.

IAM rol ayrıntıları için bkz. [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles).

---

## Sonraki adımlar

- Mesajlaşma kanallarını ayarlayın: [Kanallar](/tr/channels)
- Yerel cihazları düğümler olarak eşleştirin: [Düğümler](/tr/nodes)
- Gateway'i yapılandırın: [Gateway yapılandırması](/tr/gateway/configuration)

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Azure](/tr/install/azure)
- [VPS barındırma](/tr/vps)

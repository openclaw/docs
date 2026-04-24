---
read_when:
    - OpenClaw'ın GCP üzerinde 7/24 çalışmasını istiyorsunuz
    - Kendi VM'inizde üretim sınıfı, her zaman açık bir Gateway istiyorsunuz
    - Kalıcılık, ikili dosyalar ve yeniden başlatma davranışı üzerinde tam denetim istiyorsunuz
summary: Kalıcı durum ile OpenClaw Gateway'i GCP Compute Engine VM üzerinde (Docker) 7/24 çalıştırın
title: GCP
x-i18n:
    generated_at: "2026-04-24T09:16:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c1416170484d4b9735dccf8297fd93bcf929b198ce4ead23ce8d0cea918c38c
    source_path: install/gcp.md
    workflow: 15
---

# GCP Compute Engine üzerinde OpenClaw (Docker, Üretim VPS Kılavuzu)

## Amaç

OpenClaw Gateway'i GCP Compute Engine VM üzerinde Docker kullanarak, kalıcı durum, görsele derlenmiş ikili dosyalar ve güvenli yeniden başlatma davranışıyla çalıştırın.

"OpenClaw'ı 7/24 ~$5-12/ay" çalıştırmak istiyorsanız, bu Google Cloud üzerinde güvenilir bir kurulumdur.
Fiyatlandırma makine türüne ve bölgeye göre değişir; iş yükünüze uyan en küçük VM'i seçin ve OOM yaşarsanız büyütün.

## Ne yapıyoruz (basitçe)?

- Bir GCP projesi oluşturup faturalandırmayı etkinleştireceğiz
- Bir Compute Engine VM oluşturacağız
- Docker kuracağız (yalıtılmış uygulama çalışma zamanı)
- OpenClaw Gateway'i Docker içinde başlatacağız
- Sunucuda `~/.openclaw` + `~/.openclaw/workspace` kalıcılaştıracağız (yeniden başlatma/yeniden derlemelerde korunur)
- SSH tüneliyle dizüstünüzden Control UI'a erişeceğiz

Bağlanan bu `~/.openclaw` durumu; `openclaw.json`, aracı başına
`agents/<agentId>/agent/auth-profiles.json` ve `.env` dosyalarını içerir.

Gateway'e şu yollarla erişilebilir:

- Dizüstünüzden SSH port yönlendirme
- Güvenlik duvarı ve token'ları kendiniz yönetiyorsanız doğrudan port açma

Bu kılavuz, GCP Compute Engine üzerinde Debian kullanır.
Ubuntu da çalışır; paketleri buna göre eşleyin.
Genel Docker akışı için bkz. [Docker](/tr/install/docker).

---

## Hızlı yol (deneyimli operatörler)

1. GCP projesi oluşturun + Compute Engine API'yi etkinleştirin
2. Compute Engine VM oluşturun (e2-small, Debian 12, 20GB)
3. VM'e SSH ile bağlanın
4. Docker kurun
5. OpenClaw deposunu clone edin
6. Kalıcı sunucu dizinleri oluşturun
7. `.env` ve `docker-compose.yml` dosyalarını yapılandırın
8. Gerekli ikili dosyaları görsele derleyin, derleyin ve başlatın

---

## Gerekenler

- GCP hesabı (e2-micro için free tier uygunluğu)
- yüklü gcloud CLI (veya Cloud Console kullanın)
- dizüstünüzden SSH erişimi
- SSH + kopyala/yapıştır ile temel rahatlık
- ~20-30 dakika
- Docker ve Docker Compose
- model auth kimlik bilgileri
- isteğe bağlı sağlayıcı kimlik bilgileri
  - WhatsApp QR
  - Telegram bot token'ı
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

    Tüm adımlar [https://console.cloud.google.com](https://console.cloud.google.com) adresindeki web UI üzerinden yapılabilir

  </Step>

  <Step title="Bir GCP projesi oluşturun">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    Faturalandırmayı [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) adresinden etkinleştirin (Compute Engine için gereklidir).

    Compute Engine API'yi etkinleştirin:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. IAM & Admin > Create Project bölümüne gidin
    2. Ad verin ve oluşturun
    3. Proje için faturalandırmayı etkinleştirin
    4. APIs & Services > Enable APIs bölümüne gidin > "Compute Engine API" aratın > Enable

  </Step>

  <Step title="VM'i oluşturun">
    **Makine türleri:**

    | Tür       | Özellikler               | Maliyet            | Notlar                                       |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM          | ~$25/ay            | Yerel Docker derlemeleri için en güvenilir   |
    | e2-small  | 2 vCPU, 2GB RAM          | ~$12/ay            | Docker derlemesi için önerilen minimum       |
    | e2-micro  | 2 vCPU (paylaşımlı), 1GB RAM | Free tier uygun | Docker derlemesi OOM ile sık sık başarısız olur (exit 137) |

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
    4. Machine type: `e2-small`
    5. Boot disk: Debian 12, 20GB
    6. Oluşturun

  </Step>

  <Step title="VM'e SSH ile bağlanın">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Compute Engine panosunda VM'inizin yanındaki "SSH" düğmesine tıklayın.

    Not: SSH anahtarı yayılımı VM oluşturulduktan sonra 1-2 dakika sürebilir. Bağlantı reddedilirse bekleyin ve yeniden deneyin.

  </Step>

  <Step title="Docker'ı kurun (VM üzerinde)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Grup değişikliğinin etkili olması için oturumu kapatıp yeniden açın:

    ```bash
    exit
    ```

    Sonra tekrar SSH ile bağlanın:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
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

    Bu kılavuz, ikili kalıcılığını garanti etmek için özel bir görsel derleyeceğinizi varsayar.

  </Step>

  <Step title="Kalıcı sunucu dizinleri oluşturun">
    Docker container'ları geçicidir.
    Tüm uzun ömürlü durumlar sunucuda yaşamalıdır.

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

    `OPENCLAW_GATEWAY_TOKEN` değerini, açıkça
    `.env` üzerinden yönetmek istemediğiniz sürece boş bırakın; OpenClaw ilk başlatmada
    config'e rastgele bir gateway token yazar. Bir keyring parolası üretin ve
    `GOG_KEYRING_PASSWORD` içine yapıştırın:

    ```bash
    openssl rand -hex 32
    ```

    **Bu dosyayı commit etmeyin.**

    Bu `.env` dosyası `OPENCLAW_GATEWAY_TOKEN` gibi container/çalışma zamanı env değişkenleri içindir.
    Saklanan sağlayıcı OAuth/API-key auth bilgileri bağlanan
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
          # Önerilen: Gateway'i VM üzerinde yalnızca loopback olacak şekilde tutun; SSH tüneliyle erişin.
          # Herkese açmak için `127.0.0.1:` önekini kaldırın ve güvenlik duvarını buna göre yapılandırın.
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

    `--allow-unconfigured` yalnızca bootstrap kolaylığı içindir, uygun gateway yapılandırmasının yerine geçmez. Yine de dağıtımınız için auth (`gateway.auth.token` veya password) ayarlayın ve güvenli bind ayarları kullanın.

  </Step>

  <Step title="Paylaşılan Docker VM çalışma zamanı adımları">
    Yaygın Docker sunucu akışı için paylaşılan çalışma zamanı kılavuzunu kullanın:

    - [Gerekli ikili dosyaları görsele derleyin](/tr/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Derleyin ve başlatın](/tr/install/docker-vm-runtime#build-and-launch)
    - [Ne nerede kalıcı olur](/tr/install/docker-vm-runtime#what-persists-where)
    - [Güncellemeler](/tr/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP'ye özgü başlatma notları">
    GCP üzerinde, derleme `pnpm install --frozen-lockfile` sırasında `Killed` veya `exit code 137` ile başarısız olursa, VM'in belleği yetersizdir. İlk derlemelerde daha güvenilir olmak için minimum `e2-small`, tercihen `e2-medium` kullanın.

    LAN'e bind ederken (`OPENCLAW_GATEWAY_BIND=lan`), devam etmeden önce güvenilir browser origin yapılandırın:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Gateway portunu değiştirdiyseniz `18789` yerine yapılandırdığınız portu kullanın.

  </Step>

  <Step title="Dizüstünüzden erişin">
    Gateway portunu iletmek için bir SSH tüneli oluşturun:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Browser'ınızda açın:

    `http://127.0.0.1:18789/`

    Temiz dashboard bağlantısını yeniden yazdırın:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    UI paylaşılan gizli auth isterse, yapılandırılmış token veya
    parolayı Control UI ayarlarına yapıştırın. Bu Docker akışı varsayılan olarak
    token yazar; container config'ini password auth'a geçirirseniz, onun yerine
    o parolayı kullanın.

    Control UI `unauthorized` veya `disconnected (1008): pairing required` gösterirse browser cihazını onaylayın:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Paylaşılan kalıcılık ve güncelleme başvurusuna yeniden mi ihtiyacınız var?
    Bkz. [Docker VM Runtime](/tr/install/docker-vm-runtime#what-persists-where) ve [Docker VM Runtime updates](/tr/install/docker-vm-runtime#updates).

  </Step>
</Steps>

---

## Sorun giderme

**SSH bağlantısı reddedildi**

SSH anahtarı yayılımı VM oluşturulduktan sonra 1-2 dakika sürebilir. Bekleyin ve yeniden deneyin.

**OS Login sorunları**

OS Login profilinizi kontrol edin:

```bash
gcloud compute os-login describe-profile
```

Hesabınızın gerekli IAM izinlerine sahip olduğundan emin olun (Compute OS Login veya Compute OS Admin Login).

**Bellek yetersizliği (OOM)**

Docker derlemesi `Killed` ve `exit code 137` ile başarısız olursa, VM OOM nedeniyle sonlandırılmıştır. Güvenilir yerel derlemeler için e2-small (minimum) veya e2-medium (önerilen) sürümüne yükseltin:

```bash
# Önce VM'i durdurun
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Makine türünü değiştirin
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# VM'i başlatın
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## Hizmet hesapları (güvenlik için en iyi uygulama)

Kişisel kullanım için varsayılan kullanıcı hesabınız uygundur.

Otomasyon veya CI/CD ardışıkları için, en az izinle ayrılmış bir hizmet hesabı oluşturun:

1. Bir hizmet hesabı oluşturun:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Compute Instance Admin rolü verin (veya daha dar bir özel rol):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

Otomasyon için Owner rolünü kullanmaktan kaçının. En az ayrıcalık ilkesini kullanın.

IAM rol ayrıntıları için bkz. [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles).

---

## Sonraki adımlar

- Mesajlaşma kanallarını ayarlayın: [Channels](/tr/channels)
- Yerel cihazları Node olarak eşleştirin: [Nodes](/tr/nodes)
- Gateway'i yapılandırın: [Gateway configuration](/tr/gateway/configuration)

## İlgili

- [Install overview](/tr/install)
- [Azure](/tr/install/azure)
- [VPS hosting](/tr/vps)

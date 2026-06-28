---
read_when:
    - OpenClaw'ı GCP üzerinde 7/24 çalıştırmak istiyorsunuz
    - Kendi VM'inizde üretim düzeyinde, her zaman açık bir Gateway istiyorsunuz
    - Kalıcılık, ikili dosyalar ve yeniden başlatma davranışı üzerinde tam denetim istiyorsunuz
summary: OpenClaw Gateway'i kalıcı durumla bir GCP Compute Engine VM üzerinde (Docker) 7/24 çalıştırın
title: GCP
x-i18n:
    generated_at: "2026-05-06T17:57:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 678253bd90f0694668400ffddba957e442f8aaed3f5308af3c2481940e104733
    source_path: install/gcp.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Dayanıklı durum, yerleşik ikili dosyalar ve güvenli yeniden başlatma davranışıyla Docker kullanarak bir GCP Compute Engine VM üzerinde kalıcı bir OpenClaw Gateway çalıştırın.

"OpenClaw 24/7 için ~$5-12/ay" istiyorsanız, bu Google Cloud üzerinde güvenilir bir kurulumdur.
Fiyatlandırma makine türüne ve bölgeye göre değişir; iş yükünüze uyan en küçük VM'i seçin ve OOM yaşarsanız ölçeği büyütün.

## Ne yapıyoruz (basitçe)?

- Bir GCP projesi oluşturup faturalandırmayı etkinleştirin
- Bir Compute Engine VM oluşturun
- Docker kurun (yalıtılmış uygulama çalışma zamanı)
- OpenClaw Gateway'i Docker içinde başlatın
- Ana makinede `~/.openclaw` + `~/.openclaw/workspace` durumunu kalıcı hale getirin (yeniden başlatmalardan/yeniden derlemelerden sonra korunur)
- Control UI'ye dizüstü bilgisayarınızdan bir SSH tüneliyle erişin

Bağlanan bu `~/.openclaw` durumu `openclaw.json`, ajan başına
`agents/<agentId>/agent/auth-profiles.json` ve `.env` dosyasını içerir.

Gateway şu yollarla erişilebilir:

- Dizüstü bilgisayarınızdan SSH port yönlendirme
- Güvenlik duvarını ve token'ları kendiniz yönetiyorsanız doğrudan port açma

Bu kılavuz GCP Compute Engine üzerinde Debian kullanır.
Ubuntu da çalışır; paketleri buna göre eşleştirin.
Genel Docker akışı için bkz. [Docker](/tr/install/docker).

---

## Hızlı yol (deneyimli operatörler)

1. GCP projesi oluşturun + Compute Engine API'yi etkinleştirin
2. Compute Engine VM oluşturun (e2-small, Debian 12, 20GB)
3. VM'e SSH ile bağlanın
4. Docker kurun
5. OpenClaw deposunu klonlayın
6. Kalıcı ana makine dizinleri oluşturun
7. `.env` ve `docker-compose.yml` yapılandırın
8. Gerekli ikili dosyaları imaja yerleştirin, derleyin ve başlatın

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
  - Telegram bot token
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

    1. IAM & Admin > Create Project'e gidin
    2. Adlandırın ve oluşturun
    3. Proje için faturalandırmayı etkinleştirin
    4. APIs & Services > Enable APIs'ye gidin > "Compute Engine API" arayın > etkinleştirin

  </Step>

  <Step title="VM'i oluşturun">
    **Makine türleri:**

    | Tür       | Özellikler              | Maliyet            | Notlar                                       |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM          | ~$25/ay            | Yerel Docker derlemeleri için en güvenilir   |
    | e2-small  | 2 vCPU, 2GB RAM          | ~$12/ay            | Docker derlemesi için önerilen minimum       |
    | e2-micro  | 2 vCPU (paylaşımlı), 1GB RAM | Ücretsiz katmana uygun | Docker derlemesinde sık sık OOM ile başarısız olur (exit 137) |

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

    1. Compute Engine > VM instances > Create instance'a gidin
    2. Ad: `openclaw-gateway`
    3. Bölge: `us-central1`, Zon: `us-central1-a`
    4. Makine türü: `e2-small`
    5. Önyükleme diski: Debian 12, 20GB
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

  <Step title="Docker kurun (VM üzerinde)">
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
    Tüm uzun ömürlü durum ana makinede yaşamalıdır.

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

    Kararlı gateway token'ını `.env` üzerinden yönetmek istediğinizde
    `OPENCLAW_GATEWAY_TOKEN` ayarlayın; aksi takdirde yeniden başlatmalar
    arasında istemcilere güvenmeden önce `gateway.auth.token` yapılandırın.
    İki kaynak da yoksa OpenClaw bu başlatma için yalnızca çalışma zamanına
    ait bir token kullanır. Bir keyring parolası oluşturun ve
    `GOG_KEYRING_PASSWORD` içine yapıştırın:

    ```bash
    openssl rand -hex 32
    ```

    **Bu dosyayı commit etmeyin.**

    Bu `.env` dosyası `OPENCLAW_GATEWAY_TOKEN` gibi kapsayıcı/çalışma zamanı
    env değerleri içindir. Saklanan sağlayıcı OAuth/API anahtarı kimlik
    doğrulaması, bağlanan
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
          # Recommended: keep the Gateway loopback-only on the VM; access via SSH tunnel.
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

    `--allow-unconfigured` yalnızca önyükleme kolaylığı içindir; uygun bir gateway yapılandırmasının yerine geçmez. Yine de dağıtımınız için kimlik doğrulamayı (`gateway.auth.token` veya parola) ayarlayın ve güvenli bind ayarları kullanın.

  </Step>

  <Step title="Paylaşılan Docker VM çalışma zamanı adımları">
    Ortak Docker ana makine akışı için paylaşılan çalışma zamanı kılavuzunu kullanın:

    - [Gerekli ikili dosyaları imaja yerleştirin](/tr/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Derleyin ve başlatın](/tr/install/docker-vm-runtime#build-and-launch)
    - [Nerede ne kalıcı olur](/tr/install/docker-vm-runtime#what-persists-where)
    - [Güncellemeler](/tr/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP'ye özgü başlatma notları">
    GCP üzerinde derleme `pnpm install --frozen-lockfile` sırasında `Killed` veya `exit code 137` ile başarısız olursa, VM'in belleği tükenmiştir. En az `e2-small` kullanın; daha güvenilir ilk derlemeler için `e2-medium` kullanın.

    LAN'a bind ederken (`OPENCLAW_GATEWAY_BIND=lan`), devam etmeden önce güvenilir bir tarayıcı origin'i yapılandırın:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Gateway portunu değiştirdiyseniz `18789` yerine yapılandırdığınız portu kullanın.

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

    UI paylaşılan gizli anahtar kimlik doğrulaması isterse, yapılandırılmış token'ı
    veya parolayı Control UI ayarlarına yapıştırın. Bu Docker akışı varsayılan
    olarak bir token yazar; kapsayıcı yapılandırmasını parola kimlik doğrulamasına
    geçirirseniz bunun yerine o parolayı kullanın.

    Control UI `unauthorized` veya `disconnected (1008): pairing required` gösterirse, tarayıcı cihazını onaylayın:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Paylaşılan kalıcılık ve güncelleme referansına tekrar mı ihtiyacınız var?
    Bkz. [Docker VM Runtime](/tr/install/docker-vm-runtime#what-persists-where) ve [Docker VM Runtime güncellemeleri](/tr/install/docker-vm-runtime#updates).

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

**Bellek yetersiz (OOM)**

Docker derlemesi `Killed` ve `exit code 137` ile başarısız olursa, VM OOM nedeniyle sonlandırılmıştır. e2-small (minimum) veya e2-medium'e (güvenilir yerel derlemeler için önerilir) yükseltin:

```bash
# Stop the VM first
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Change machine type
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Start the VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## Hizmet hesapları (güvenlik için en iyi uygulama)

Kişisel kullanım için varsayılan kullanıcı hesabınız yeterlidir.

Otomasyon veya CI/CD işlem hatları için en düşük izinlerle ayrılmış bir hizmet hesabı oluşturun:

1. Bir hizmet hesabı oluşturun:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Compute Instance Admin rolünü (veya daha dar bir özel rolü) verin:

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

Otomasyon için Owner rolünü kullanmaktan kaçının. En az ayrıcalık ilkesini kullanın.

IAM rol ayrıntıları için bkz. [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles).

---

## Sonraki adımlar

- Mesajlaşma kanallarını ayarlayın: [Kanallar](/tr/channels)
- Yerel cihazları Node'lar olarak eşleyin: [Node'lar](/tr/nodes)
- Gateway'i yapılandırın: [Gateway yapılandırması](/tr/gateway/configuration)

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Azure](/tr/install/azure)
- [VPS barındırma](/tr/vps)

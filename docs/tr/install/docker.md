---
read_when:
    - Yerel kurulumlar yerine kapsayıcılı bir gateway istiyorsunuz.
    - Docker akışını doğruluyorsunuz.
summary: OpenClaw için isteğe bağlı Docker tabanlı kurulum ve ilk kurulum
title: Docker
x-i18n:
    generated_at: "2026-04-26T11:33:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3483dafa6c8baa0d4ad12df1a457e07e3c8b4182a2c5e1649bc8db66ff4c676c
    source_path: install/docker.md
    workflow: 15
---

Docker **isteğe bağlıdır**. Yalnızca kapsayıcılı bir gateway istiyorsanız veya Docker akışını doğrulamak istiyorsanız kullanın.

## Docker benim için uygun mu?

- **Evet**: yalıtılmış, atılabilir bir gateway ortamı istiyorsunuz veya OpenClaw'ı yerel kurulum olmadan bir host üzerinde çalıştırmak istiyorsunuz.
- **Hayır**: kendi makinenizde çalışıyorsunuz ve yalnızca en hızlı geliştirme döngüsünü istiyorsunuz. Bunun yerine normal kurulum akışını kullanın.
- **Sandboxing notu**: varsayılan sandbox arka ucu, sandboxing etkin olduğunda Docker kullanır, ancak sandboxing varsayılan olarak kapalıdır ve tam gateway'in Docker içinde çalışmasını **gerektirmez**. SSH ve OpenShell sandbox arka uçları da mevcuttur. Bkz. [Sandboxing](/tr/gateway/sandboxing).

## Önkoşullar

- Docker Desktop (veya Docker Engine) + Docker Compose v2
- İmaj derlemesi için en az 2 GB RAM (`pnpm install`, 1 GB hostlarda çıkış 137 ile OOM-kill olabilir)
- İmajlar ve günlükler için yeterli disk
- VPS/herkese açık bir host üzerinde çalışıyorsanız
  [Ağ erişimi için güvenlik sağlamlaştırmasını](/tr/gateway/security),
  özellikle Docker `DOCKER-USER` güvenlik duvarı ilkesini gözden geçirin.

## Kapsayıcılı Gateway

<Steps>
  <Step title="İmajı derleyin">
    Repo kökünden kurulum betiğini çalıştırın:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Bu, gateway imajını yerelde derler. Bunun yerine önceden derlenmiş bir imaj kullanmak için:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Önceden derlenmiş imajlar
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw) üzerinde yayımlanır.
    Yaygın etiketler: `main`, `latest`, `<version>` (ör. `2026.2.26`).

  </Step>

  <Step title="İlk kurulumu tamamlayın">
    Kurulum betiği ilk kurulumu otomatik olarak çalıştırır. Şunları yapar:

    - sağlayıcı API anahtarlarını ister
    - bir gateway belirteci üretir ve `.env` dosyasına yazar
    - gateway'i Docker Compose ile başlatır

    Kurulum sırasında, başlangıç öncesi ilk kurulum ve yapılandırma yazımları
    doğrudan `openclaw-gateway` üzerinden çalışır. `openclaw-cli`, yalnızca
    gateway kapsayıcısı zaten var olduktan sonra çalıştırdığınız komutlar içindir.

  </Step>

  <Step title="Control UI'yi açın">
    Tarayıcınızda `http://127.0.0.1:18789/` adresini açın ve Ayarlar'a yapılandırılmış
    paylaşılan gizli bilgiyi yapıştırın. Kurulum betiği varsayılan olarak `.env` dosyasına bir belirteç yazar;
    kapsayıcı yapılandırmasını password auth'a geçirirseniz bunun yerine o
    parolayı kullanın.

    URL'ye yeniden mi ihtiyacınız var?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Kanalları yapılandırın (isteğe bağlı)">
    Mesajlaşma kanalları eklemek için CLI kapsayıcısını kullanın:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Belgeler: [WhatsApp](/tr/channels/whatsapp), [Telegram](/tr/channels/telegram), [Discord](/tr/channels/discord)

  </Step>
</Steps>

### Elle akış

Kurulum betiğini kullanmak yerine her adımı kendiniz çalıştırmayı tercih ederseniz:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
`docker compose` komutunu repo kökünden çalıştırın. `OPENCLAW_EXTRA_MOUNTS`
veya `OPENCLAW_HOME_VOLUME` etkinleştirdiyseniz, kurulum betiği `docker-compose.extra.yml` yazar;
bunu `-f docker-compose.yml -f docker-compose.extra.yml` ile dahil edin.
</Note>

<Note>
`openclaw-cli`, `openclaw-gateway` ile aynı ağ namespace'ini paylaştığı için
başlangıç sonrası bir araçtır. `docker compose up -d openclaw-gateway` öncesinde, ilk kurulum
ve kurulum zamanı yapılandırma yazımlarını `openclaw-gateway` üzerinden
`--no-deps --entrypoint node` ile çalıştırın.
</Note>

### Ortam değişkenleri

Kurulum betiği şu isteğe bağlı ortam değişkenlerini kabul eder:

| Değişken                                  | Amaç                                                            |
| ----------------------------------------- | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                          | Yerelde derlemek yerine uzak bir imaj kullan                    |
| `OPENCLAW_DOCKER_APT_PACKAGES`            | Derleme sırasında ek apt paketleri kur                          |
| `OPENCLAW_EXTENSIONS`                     | Derleme zamanında Plugin bağımlılıklarını önceden kur           |
| `OPENCLAW_EXTRA_MOUNTS`                   | Ek host bind mount'ları (virgülle ayrılmış `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                    | `/home/node` yolunu adlandırılmış Docker volume içinde kalıcı tut |
| `OPENCLAW_SANDBOX`                        | Sandbox bootstrap'e katıl (`1`, `true`, `yes`, `on`)           |
| `OPENCLAW_DOCKER_SOCKET`                  | Docker soket yolunu geçersiz kıl                                |
| `OPENCLAW_DISABLE_BONJOUR`                | Bonjour/mDNS duyurusunu devre dışı bırak (Docker için varsayılan `1`) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`| Paketlenmiş Plugin kaynak bind-mount overlay'lerini devre dışı bırak |
| `OTEL_EXPORTER_OTLP_ENDPOINT`             | OpenTelemetry dışa aktarımı için paylaşılan OTLP/HTTP toplayıcı uç noktası |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`           | İzler, ölçümler veya günlükler için sinyal özel OTLP uç noktaları |
| `OTEL_EXPORTER_OTLP_PROTOCOL`             | OTLP protokol geçersiz kılması. Bugün yalnızca `http/protobuf` desteklenir |
| `OTEL_SERVICE_NAME`                       | OpenTelemetry kaynakları için kullanılan hizmet adı             |
| `OTEL_SEMCONV_STABILITY_OPT_IN`           | En yeni deneysel GenAI anlamsal özniteliklerine katıl           |
| `OPENCLAW_OTEL_PRELOADED`                 | Biri önceden yüklenmişse ikinci bir OpenTelemetry SDK başlatmayı atla |

Bakımcılar, paketlenmiş bir imaja karşı paketlenmiş Plugin kaynağını test etmek için
bir Plugin kaynak dizinini kendi paketlenmiş kaynak yolunun üzerine bağlayabilir; örneğin
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Bu bağlanan kaynak dizini, aynı Plugin kimliği için eşleşen derlenmiş
`/app/dist/extensions/synology-chat` paketinin üzerine yazılır.

### Gözlemlenebilirlik

OpenTelemetry dışa aktarımı, Gateway kapsayıcısından OTLP
toplayıcınıza doğru giden çıkış trafiğidir. Yayımlanmış bir Docker portu gerektirmez. İmajı
yerelde derliyorsanız ve paketlenmiş OpenTelemetry dışa aktarıcısının imaj içinde
mevcut olmasını istiyorsanız, çalışma zamanı bağımlılıklarını dahil edin:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Resmî OpenClaw Docker sürüm imajı, paketlenmiş
`diagnostics-otel` Plugin kaynağını içerir. İmaja ve önbellek durumuna bağlı olarak
Gateway, Plugin ilk kez etkinleştirildiğinde yine de Plugin-yerel OpenTelemetry çalışma zamanı bağımlılıklarını aşamalayabilir; bu nedenle
ilk açılışın paket kayıt defterine erişmesine izin verin veya sürüm hattınızda imajı önceden ısıtın. Dışa aktarımı etkinleştirmek için
yapılandırmada `diagnostics-otel` Plugin'ine izin verin ve bunu etkinleştirin, sonra
`diagnostics.otel.enabled=true` ayarlayın veya
[OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry) içindeki yapılandırma örneğini kullanın. Toplayıcı auth üstbilgileri
Docker ortam değişkenleri üzerinden değil, `diagnostics.otel.headers` aracılığıyla
yapılandırılır.

Prometheus metrikleri zaten yayımlanmış olan Gateway portunu kullanır. Önce
`diagnostics-prometheus` Plugin'ini etkinleştirin, sonra şurayı kazıyın:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Bu rota Gateway auth ile korunur. Ayrı bir herkese açık `/metrics` portu veya
kimlik doğrulamasız reverse-proxy yolu açmayın. Bkz.
[Prometheus metrikleri](/tr/gateway/prometheus).

### Sağlık denetimleri

Kapsayıcı probe uç noktaları (auth gerekmez):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker imajı, `/healthz` uç noktasını yoklayan yerleşik bir `HEALTHCHECK` içerir.
Denetimler sürekli başarısız olursa Docker kapsayıcıyı `unhealthy` olarak işaretler ve
orkestrasyon sistemleri onu yeniden başlatabilir veya değiştirebilir.

Kimlik doğrulamalı derin sağlık anlık görüntüsü:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN ve loopback

`scripts/docker/setup.sh`, `http://127.0.0.1:18789` üzerinden host erişimi
Docker port yayımlama ile çalışsın diye varsayılan olarak `OPENCLAW_GATEWAY_BIND=lan` ayarlar.

- `lan` (varsayılan): host tarayıcı ve host CLI yayımlanmış gateway portuna erişebilir.
- `loopback`: yalnızca kapsayıcı ağ namespace'i içindeki süreçler
  gateway'e doğrudan erişebilir.

<Note>
`gateway.bind` içinde host takma adları (`0.0.0.0` veya `127.0.0.1`) değil, bind modu değerleri (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) kullanın.
</Note>

### Bonjour / mDNS

Docker bridge ağı genellikle Bonjour/mDNS multicast trafiğini
(`224.0.0.251:5353`) güvenilir biçimde iletmez. Bu nedenle paketlenmiş Compose kurulumu varsayılan olarak
`OPENCLAW_DISABLE_BONJOUR=1` kullanır; böylece bridge multicast trafiğini düşürdüğünde Gateway çöküp
yeniden başlama döngüsüne girmez veya duyuruyu sürekli yeniden başlatmaz.

Docker hostları için yayımlanmış Gateway URL'sini, Tailscale'i veya geniş alan DNS-SD'yi kullanın.
`OPENCLAW_DISABLE_BONJOUR=0` değerini yalnızca host networking, macvlan,
veya mDNS multicast'in çalıştığı bilinen başka bir ağda çalıştırırken ayarlayın.

Tuzaklar ve sorun giderme için bkz. [Bonjour keşfi](/tr/gateway/bonjour).

### Depolama ve kalıcılık

Docker Compose, `OPENCLAW_CONFIG_DIR` değerini `/home/node/.openclaw` üzerine ve
`OPENCLAW_WORKSPACE_DIR` değerini `/home/node/.openclaw/workspace` üzerine bind-mount yapar; böylece bu yollar
kapsayıcı değiştirildiğinde de kalır.

Bu bağlanan yapılandırma dizini, OpenClaw'ın şunları tuttuğu yerdir:

- davranış yapılandırması için `openclaw.json`
- saklanan sağlayıcı OAuth/API anahtarı auth bilgileri için `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` gibi env tabanlı çalışma zamanı gizli bilgileri için `.env`

VM dağıtımlarında tam kalıcılık ayrıntıları için bkz.
[Docker VM Runtime - Neler nerede kalıcıdır](/tr/install/docker-vm-runtime#what-persists-where).

**Disk büyümesi sıcak noktaları:** `/tmp/openclaw/` altındaki `media/`, oturum JSONL dosyaları, `cron/runs/*.jsonl`
ve dönen dosya günlüklerini izleyin.

### Shell yardımcıları (isteğe bağlı)

Günlük Docker yönetimini kolaylaştırmak için `ClawDock` kurun:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

ClawDock'u eski `scripts/shell-helpers/clawdock-helpers.sh` ham yolundan kurduysanız, yerel yardımcı dosyanızın yeni konumu izlemesi için yukarıdaki kurulum komutunu yeniden çalıştırın.

Ardından `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` vb. kullanın.
Tüm komutlar için `clawdock-help` çalıştırın.
Tam yardımcı kılavuzu için bkz. [ClawDock](/tr/install/clawdock).

<AccordionGroup>
  <Accordion title="Docker gateway için ajan sandbox'ını etkinleştir">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Özel soket yolu (ör. rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Betik, sandbox önkoşulları geçtikten sonra `docker.sock` bağlar. Eğer
    sandbox kurulumu tamamlanamazsa, betik `agents.defaults.sandbox.mode`
    değerini `off` konumuna sıfırlar.

  </Accordion>

  <Accordion title="Otomasyon / CI (etkileşimsiz)">
    `-T` ile Compose pseudo-TTY ayırmayı devre dışı bırakın:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Paylaşılan ağ güvenliği notu">
    `openclaw-cli`, CLI komutlarının gateway'e `127.0.0.1` üzerinden erişebilmesi için `network_mode: "service:openclaw-gateway"` kullanır. Bunu paylaşılan bir güven sınırı olarak değerlendirin. Compose yapılandırması `openclaw-cli` üzerinde `NET_RAW`/`NET_ADMIN` yetkilerini kaldırır ve `no-new-privileges` özelliğini etkinleştirir.
  </Accordion>

  <Accordion title="İzinler ve EACCES">
    İmaj `node` (uid 1000) kullanıcısıyla çalışır. `/home/node/.openclaw` üzerinde izin hataları görüyorsanız, host bind mount'larınızın uid 1000'e ait olduğundan emin olun:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Daha hızlı yeniden derlemeler">
    Bağımlılık katmanları önbelleğe alınacak şekilde Dockerfile'ınızı sıralayın. Bu, lockfile'lar değişmedikçe `pnpm install` işleminin yeniden çalışmasını önler:

    ```dockerfile
    FROM node:24-bookworm
    RUN curl -fsSL https://bun.sh/install | bash
    ENV PATH="/root/.bun/bin:${PATH}"
    RUN corepack enable
    WORKDIR /app
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
    COPY ui/package.json ./ui/package.json
    COPY scripts ./scripts
    RUN pnpm install --frozen-lockfile
    COPY . .
    RUN pnpm build
    RUN pnpm ui:install
    RUN pnpm ui:build
    ENV NODE_ENV=production
    CMD ["node","dist/index.js"]
    ```

  </Accordion>

  <Accordion title="İleri düzey kullanıcı kapsayıcı seçenekleri">
    Varsayılan imaj güvenlik önceliklidir ve root olmayan `node` kullanıcısıyla çalışır. Daha tam özellikli bir kapsayıcı için:

    1. **`/home/node` dizinini kalıcı hale getirin**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Sistem bağımlılıklarını imaja yerleştirin**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwright tarayıcılarını kurun**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Tarayıcı indirmelerini kalıcı hale getirin**: `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` ayarlayın ve
       `OPENCLAW_HOME_VOLUME` veya `OPENCLAW_EXTRA_MOUNTS` kullanın.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (başsız Docker)">
    Sihirbazda OpenAI Codex OAuth'u seçerseniz, bir tarayıcı URL'si açar. Docker veya başsız kurulumlarda, ulaştığınız tam yönlendirme URL'sini kopyalayın ve auth'u tamamlamak için sihirbaza geri yapıştırın.
  </Accordion>

  <Accordion title="Temel imaj meta verileri">
    Ana Docker imajı `node:24-bookworm` kullanır ve `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` ve diğerlerini içeren OCI temel imaj
    açıklamalarını yayımlar. Bkz.
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### VPS üzerinde mi çalıştırıyorsunuz?

İkili dosya hazırlama, kalıcılık ve güncellemeler dahil
paylaşılan VM dağıtım adımları için [Hetzner (Docker VPS)](/tr/install/hetzner) ve
[Docker VM Runtime](/tr/install/docker-vm-runtime) sayfalarına bakın.

## Agent Sandbox

Docker arka ucuyla `agents.defaults.sandbox` etkin olduğunda, gateway
ajan araç yürütmesini (shell, dosya okuma/yazma vb.) yalıtılmış Docker
kapsayıcıları içinde çalıştırırken gateway'in kendisi host üzerinde kalır. Bu, tüm
gateway'i kapsayıcı içine almadan güvenilmeyen veya çok kiracılı ajan oturumları
etrafında sert bir duvar sağlar.

Sandbox kapsamı ajan başına (varsayılan), oturum başına veya paylaşımlı olabilir. Her kapsam
kendi çalışma alanını `/workspace` altında bağlanmış olarak alır. Ayrıca
izin ver/reddet araç ilkeleri, ağ yalıtımı, kaynak sınırları ve tarayıcı
kapsayıcıları da yapılandırabilirsiniz.

Tam yapılandırma, imajlar, güvenlik notları ve çok ajanlı profiller için bkz.:

- [Sandboxing](/tr/gateway/sandboxing) -- tam sandbox başvurusu
- [OpenShell](/tr/gateway/openshell) -- sandbox kapsayıcılarına etkileşimli shell erişimi
- [Çok Ajanlı Sandbox ve Araçlar](/tr/tools/multi-agent-sandbox-tools) -- ajan başına geçersiz kılmalar

### Hızlı etkinleştirme

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
      },
    },
  },
}
```

Varsayılan sandbox imajını derleyin:

```bash
scripts/sandbox-setup.sh
```

## Sorun giderme

<AccordionGroup>
  <Accordion title="İmaj eksik veya sandbox kapsayıcısı başlamıyor">
    Sandbox imajını
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    ile derleyin veya `agents.defaults.sandbox.docker.image` değerini özel imajınıza ayarlayın.
    Kapsayıcılar oturum başına gerektiğinde otomatik oluşturulur.
  </Accordion>

  <Accordion title="Sandbox içinde izin hataları">
    `docker.user` değerini bağlanan çalışma alanı sahipliğiyle eşleşen bir UID:GID olarak ayarlayın
    veya çalışma alanı klasörünün sahipliğini değiştirin.
  </Accordion>

  <Accordion title="Özel araçlar sandbox içinde bulunamıyor">
    OpenClaw komutları `sh -lc` (login shell) ile çalıştırır; bu,
    `/etc/profile` dosyasını kaynak alır ve PATH'i sıfırlayabilir.
    Özel araç yollarınızı başa eklemek için `docker.env.PATH` ayarlayın
    veya Dockerfile'ınıza `/etc/profile.d/` altında bir betik ekleyin.
  </Accordion>

  <Accordion title="İmaj derleme sırasında OOM-killed (çıkış 137)">
    VM'nin en az 2 GB RAM'e ihtiyacı vardır. Daha büyük bir makine sınıfı kullanın ve yeniden deneyin.
  </Accordion>

  <Accordion title="Control UI'de yetkisiz veya eşleştirme gerekli">
    Yeni bir dashboard bağlantısı alın ve tarayıcı cihazını onaylayın:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Daha fazla ayrıntı: [Dashboard](/tr/web/dashboard), [Cihazlar](/tr/cli/devices).

  </Accordion>

  <Accordion title="Gateway hedefi ws://172.x.x.x gösteriyor veya Docker CLI'den eşleştirme hataları alınıyor">
    Gateway modunu ve bind değerini sıfırlayın:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## İlgili

- [Kuruluma genel bakış](/tr/install) — tüm kurulum yöntemleri
- [Podman](/tr/install/podman) — Docker'a Podman alternatifi
- [ClawDock](/tr/install/clawdock) — Docker Compose topluluk kurulumu
- [Güncelleme](/tr/install/updating) — OpenClaw'ı güncel tutma
- [Yapılandırma](/tr/gateway/configuration) — kurulum sonrası gateway yapılandırması

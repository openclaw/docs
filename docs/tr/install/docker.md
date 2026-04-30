---
read_when:
    - Yerel kurulumlar yerine konteynerleştirilmiş bir Gateway istiyorsunuz
    - Docker akışını doğruluyorsunuz
summary: OpenClaw için isteğe bağlı Docker tabanlı kurulum ve ilk kullanıma hazırlık
title: Docker
x-i18n:
    generated_at: "2026-04-30T09:28:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: c67a6351afb09961ff3b2e95a132acff7f33b02d3b67330d4608c46e3c18f63a
    source_path: install/docker.md
    workflow: 16
---

Docker **isteğe bağlıdır**. Yalnızca konteynerleştirilmiş bir Gateway istiyorsanız veya Docker akışını doğrulamak istiyorsanız kullanın.

## Docker benim için doğru mu?

- **Evet**: yalıtılmış, geçici bir Gateway ortamı istiyorsunuz veya OpenClaw’ı yerel kurulumlar olmadan bir sunucuda çalıştırmak istiyorsunuz.
- **Hayır**: kendi makinenizde çalışıyorsunuz ve yalnızca en hızlı geliştirme döngüsünü istiyorsunuz. Bunun yerine normal kurulum akışını kullanın.
- **Sandboxing notu**: varsayılan sandbox arka ucu, sandboxing etkinleştirildiğinde Docker kullanır, ancak sandboxing varsayılan olarak kapalıdır ve tam Gateway’in Docker içinde çalışmasını **gerektirmez**. SSH ve OpenShell sandbox arka uçları da kullanılabilir. Bkz. [Sandboxing](/tr/gateway/sandboxing).

## Ön koşullar

- Docker Desktop (veya Docker Engine) + Docker Compose v2
- İmaj derlemesi için en az 2 GB RAM (`pnpm install`, 1 GB sunucularda çıkış 137 ile OOM tarafından sonlandırılabilir)
- İmajlar ve günlükler için yeterli disk alanı
- Bir VPS/genel sunucuda çalıştırıyorsanız,
  [Ağ erişimine açma için güvenlik sertleştirmesi](/tr/gateway/security)
  bölümünü, özellikle Docker `DOCKER-USER` güvenlik duvarı politikasını inceleyin.

## Konteynerleştirilmiş Gateway

<Steps>
  <Step title="Build the image">
    Repo kökünden kurulum betiğini çalıştırın:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Bu, Gateway imajını yerelde derler. Bunun yerine önceden derlenmiş bir imaj kullanmak için:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Önceden derlenmiş imajlar
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    üzerinde yayımlanır.
    Yaygın etiketler: `main`, `latest`, `<version>` (örn. `2026.2.26`).

  </Step>

  <Step title="Complete onboarding">
    Kurulum betiği onboarding’i otomatik olarak çalıştırır. Şunları yapar:

    - sağlayıcı API anahtarlarını ister
    - bir Gateway token’ı üretir ve `.env` dosyasına yazar
    - Gateway’i Docker Compose üzerinden başlatır

    Kurulum sırasında, başlatma öncesi onboarding ve yapılandırma yazma işlemleri
    doğrudan `openclaw-gateway` üzerinden çalışır. `openclaw-cli`, Gateway
    konteyneri zaten mevcut olduktan sonra çalıştırdığınız komutlar içindir.

  </Step>

  <Step title="Open the Control UI">
    Tarayıcınızda `http://127.0.0.1:18789/` adresini açın ve yapılandırılmış
    paylaşılan gizli değeri Settings’e yapıştırın. Kurulum betiği varsayılan
    olarak `.env` dosyasına bir token yazar; konteyner yapılandırmasını parola
    kimlik doğrulamasına geçirirseniz bunun yerine o parolayı kullanın.

    URL’ye yeniden mi ihtiyacınız var?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configure channels (optional)">
    Mesajlaşma kanalları eklemek için CLI konteynerini kullanın:

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

### Manuel akış

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
veya `OPENCLAW_HOME_VOLUME` etkinleştirdiyseniz, kurulum betiği `docker-compose.extra.yml`
dosyasını yazar; bunu `-f docker-compose.yml -f docker-compose.extra.yml` ile dahil edin.
</Note>

<Note>
`openclaw-cli`, `openclaw-gateway` ile aynı ağ ad alanını paylaştığı için
başlatma sonrası kullanılan bir araçtır. `docker compose up -d openclaw-gateway`
öncesinde onboarding’i ve kurulum zamanı yapılandırma yazma işlemlerini
`--no-deps --entrypoint node` ile `openclaw-gateway` üzerinden çalıştırın.
</Note>

### Ortam değişkenleri

Kurulum betiği şu isteğe bağlı ortam değişkenlerini kabul eder:

| Değişken                                   | Amaç                                                            |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Yerelde derlemek yerine uzak bir imaj kullanır                  |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Derleme sırasında ek apt paketleri kurar (boşlukla ayrılmış)    |
| `OPENCLAW_EXTENSIONS`                      | Derleme zamanında Plugin bağımlılıklarını önceden kurar (boşlukla ayrılmış adlar) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Ek ana makine bind mount’ları (virgülle ayrılmış `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | `/home/node` yolunu adlandırılmış bir Docker volume içinde kalıcı tutar |
| `OPENCLAW_PLUGIN_STAGE_DIR`                | Üretilen paketli Plugin bağımlılıkları ve mirror’lar için konteyner yolu |
| `OPENCLAW_SANDBOX`                         | Sandbox bootstrap’a katılır (`1`, `true`, `yes`, `on`)          |
| `OPENCLAW_SKIP_ONBOARDING`                 | Etkileşimli onboarding adımını atlar (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Docker socket yolunu geçersiz kılar                             |
| `OPENCLAW_DISABLE_BONJOUR`                 | Bonjour/mDNS duyurusunu devre dışı bırakır (Docker için varsayılan `1`) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Paketli Plugin kaynak bind-mount overlay’lerini devre dışı bırakır |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | OpenTelemetry dışa aktarımı için paylaşılan OTLP/HTTP collector endpoint’i |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Trace, metrik veya günlükler için sinyale özgü OTLP endpoint’leri |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP protokol geçersiz kılması. Bugün yalnızca `http/protobuf` desteklenir |
| `OTEL_SERVICE_NAME`                        | OpenTelemetry kaynakları için kullanılan hizmet adı             |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | En yeni deneysel GenAI anlamsal özniteliklerine katılır         |
| `OPENCLAW_OTEL_PRELOADED`                  | Bir OpenTelemetry SDK önceden yüklüyse ikinci bir SDK başlatmayı atlar |

Bakımcılar, paketlenmiş bir imaja karşı paketli Plugin kaynağını, örneğin
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`
ile tek bir Plugin kaynak dizinini paketlenmiş kaynak yolunun üzerine mount ederek test edebilir.
Bu mount edilen kaynak dizini, aynı Plugin id’si için eşleşen derlenmiş
`/app/dist/extensions/synology-chat` paketini geçersiz kılar.

### Gözlemlenebilirlik

OpenTelemetry dışa aktarımı, Gateway konteynerinden OTLP collector’ınıza
giden yöndedir. Yayımlanmış bir Docker portu gerektirmez. İmajı yerelde
derliyorsanız ve paketli OpenTelemetry exporter’ın imaj içinde kullanılabilir
olmasını istiyorsanız, çalışma zamanı bağımlılıklarını dahil edin:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Resmi OpenClaw Docker release imajı paketli `diagnostics-otel` Plugin kaynağını
içerir. İmaja ve önbellek durumuna bağlı olarak, Plugin ilk kez etkinleştirildiğinde
Gateway yine de Plugin’e yerel OpenTelemetry çalışma zamanı bağımlılıklarını
hazırlayabilir; bu nedenle ilk başlatmanın paket registry’sine erişmesine izin
verin veya imajı release hattınızda önceden ısıtın. Dışa aktarımı etkinleştirmek
için yapılandırmada `diagnostics-otel` Plugin’e izin verip etkinleştirin, ardından
`diagnostics.otel.enabled=true` ayarlayın veya
[OpenTelemetry dışa aktarımı](/tr/gateway/opentelemetry) bölümündeki yapılandırma
örneğini kullanın. Collector kimlik doğrulama başlıkları Docker ortam değişkenleri
üzerinden değil, `diagnostics.otel.headers` üzerinden yapılandırılır.

Prometheus metrikleri zaten yayımlanmış Gateway portunu kullanır.
`diagnostics-prometheus` Plugin’i etkinleştirin, ardından scrape edin:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Rota Gateway kimlik doğrulamasıyla korunur. Ayrı bir genel `/metrics` portu
veya kimliği doğrulanmamış reverse-proxy yolu açmayın. Bkz.
[Prometheus metrikleri](/tr/gateway/prometheus).

### Sağlık kontrolleri

Konteyner probe endpoint’leri (kimlik doğrulama gerekmez):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker imajı, `/healthz` adresine ping atan yerleşik bir `HEALTHCHECK` içerir.
Kontroller başarısız olmaya devam ederse Docker konteyneri `unhealthy` olarak
işaretler ve orchestration sistemleri onu yeniden başlatabilir veya değiştirebilir.

Kimliği doğrulanmış derin sağlık anlık görüntüsü:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN ve loopback karşılaştırması

`scripts/docker/setup.sh`, Docker port yayımlamasıyla ana makinenin
`http://127.0.0.1:18789` erişiminin çalışması için varsayılan olarak
`OPENCLAW_GATEWAY_BIND=lan` ayarlar.

- `lan` (varsayılan): ana makine tarayıcısı ve ana makine CLI’si yayımlanan Gateway portuna erişebilir.
- `loopback`: yalnızca konteyner ağ ad alanı içindeki işlemler Gateway’e doğrudan erişebilir.

<Note>
`gateway.bind` içinde bind modu değerlerini kullanın (`lan` / `loopback` / `custom` /
`tailnet` / `auto`); `0.0.0.0` veya `127.0.0.1` gibi ana makine takma adlarını kullanmayın.
</Note>

### Ana Makine Yerel Sağlayıcıları

OpenClaw Docker içinde çalıştığında, konteyner içindeki `127.0.0.1` ana makineniz
değil, konteynerin kendisidir. Ana makinede çalışan AI sağlayıcıları için
`host.docker.internal` kullanın:

| Sağlayıcı | Ana makine varsayılan URL’si | Docker kurulum URL’si              |
| --------- | ---------------------------- | ---------------------------------- |
| LM Studio | `http://127.0.0.1:1234`      | `http://host.docker.internal:1234` |
| Ollama    | `http://127.0.0.1:11434`     | `http://host.docker.internal:11434` |

Paketli Docker kurulumu, LM Studio ve Ollama onboarding varsayılanları olarak
bu ana makine URL’lerini kullanır ve `docker-compose.yml`, Linux Docker Engine
için `host.docker.internal` adını Docker’ın ana makine Gateway’ine eşler.
Docker Desktop macOS ve Windows üzerinde aynı hostname’i zaten sağlar.

Ana makine hizmetleri ayrıca Docker’dan erişilebilen bir adreste dinlemelidir:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Kendi Compose dosyanızı veya `docker run` komutunuzu kullanıyorsanız aynı ana
makine eşlemesini kendiniz ekleyin, örneğin
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Docker bridge ağı genellikle Bonjour/mDNS multicast’i (`224.0.0.251:5353`)
güvenilir şekilde iletmez. Bu nedenle paketli Compose kurulumu varsayılan olarak
`OPENCLAW_DISABLE_BONJOUR=1` kullanır; böylece Gateway, bridge multicast trafiğini
düşürdüğünde crash-loop’a girmez veya duyuruyu tekrar tekrar yeniden başlatmaz.

Docker sunucuları için yayımlanmış Gateway URL’sini, Tailscale’i veya geniş alan
DNS-SD’yi kullanın. `OPENCLAW_DISABLE_BONJOUR=0` değerini yalnızca host networking,
macvlan veya mDNS multicast’in çalıştığı bilinen başka bir ağ ile çalıştırırken ayarlayın.

Tuzaklar ve sorun giderme için bkz. [Bonjour keşfi](/tr/gateway/bonjour).

### Depolama ve kalıcılık

Docker Compose, `OPENCLAW_CONFIG_DIR` değerini `/home/node/.openclaw` yoluna ve
`OPENCLAW_WORKSPACE_DIR` değerini `/home/node/.openclaw/workspace` yoluna bind-mount
eder; böylece bu yollar konteyner değişiminden sonra da korunur. Değişkenlerden
biri ayarlanmamışsa, paketli `docker-compose.yml` `${HOME}/.openclaw` değerine
(çalışma alanı mount’u için `${HOME}/.openclaw/workspace` değerine) veya `HOME`
kendisi de yoksa `/tmp/.openclaw` değerine geri döner. Bu, yalın ortamlarda
`docker compose up` komutunun boş kaynaklı volume belirtimi üretmesini engeller.

OpenClaw bu mount edilen yapılandırma dizininde şunları tutar:

- davranış yapılandırması için `openclaw.json`
- saklanan sağlayıcı OAuth/API anahtarı kimlik doğrulaması için `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` gibi ortam destekli çalışma zamanı gizli değerleri için `.env`

Birlikte gelen Plugin çalışma zamanı bağımlılıkları ve aynalanmış çalışma zamanı dosyaları kullanıcı yapılandırması değil, oluşturulmuş durumdur. Compose bunları `/var/lib/openclaw/plugin-runtime-deps` konumuna bağlanan adlandırılmış Docker birimi `openclaw-plugin-runtime-deps` içinde saklar. Bu sık değişen ağacı ana makine yapılandırma bind mount'unun dışında tutmak, soğuk Gateway başlangıcı sırasında yavaş Docker Desktop/WSL dosya işlemlerini ve eski Windows tanıtıcılarını önler.

Varsayılan Compose dosyası, `openclaw-gateway` ve `openclaw-cli` için `OPENCLAW_PLUGIN_STAGE_DIR` değerini bu yola ayarlar; böylece `openclaw doctor --fix`, kanal oturum açma/kurulum komutları ve Gateway başlangıcının tümü aynı oluşturulmuş çalışma zamanı birimini kullanır.

VM dağıtımlarında kalıcılıkla ilgili tüm ayrıntılar için bkz.
[Docker VM Çalışma Zamanı - Nerede ne kalıcı olur](/tr/install/docker-vm-runtime#what-persists-where).

**Disk büyümesi sıcak noktaları:** `media/`, oturum JSONL dosyaları, `cron/runs/*.jsonl`, `openclaw-plugin-runtime-deps` Docker birimi ve `/tmp/openclaw/` altındaki dönen dosya günlüklerini izleyin.

### Kabuk yardımcıları (isteğe bağlı)

Günlük Docker yönetimini kolaylaştırmak için `ClawDock` kurun:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

ClawDock'u eski `scripts/shell-helpers/clawdock-helpers.sh` ham yolundan kurduysanız, yerel yardımcı dosyanızın yeni konumu takip etmesi için yukarıdaki kurulum komutunu yeniden çalıştırın.

Ardından `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` vb. kullanın. Tüm komutlar için
`clawdock-help` çalıştırın.
Tam yardımcı kılavuzu için bkz. [ClawDock](/tr/install/clawdock).

<AccordionGroup>
  <Accordion title="Docker Gateway için ajan sandbox'ını etkinleştirme">
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

    Betik `docker.sock` dosyasını yalnızca sandbox ön koşulları geçtikten sonra bağlar. Sandbox kurulumu tamamlanamazsa betik `agents.defaults.sandbox.mode` değerini `off` olarak sıfırlar.

  </Accordion>

  <Accordion title="Otomasyon / CI (etkileşimsiz)">
    Compose pseudo-TTY ayırmayı `-T` ile devre dışı bırakın:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Paylaşılan ağ güvenliği notu">
    `openclaw-cli`, CLI komutlarının Gateway'e `127.0.0.1` üzerinden erişebilmesi için `network_mode: "service:openclaw-gateway"` kullanır. Bunu paylaşılan bir güven sınırı olarak ele alın. Compose yapılandırması `NET_RAW`/`NET_ADMIN` değerlerini kaldırır ve `openclaw-cli` üzerinde `no-new-privileges` etkinleştirir.
  </Accordion>

  <Accordion title="İzinler ve EACCES">
    İmaj `node` (uid 1000) olarak çalışır. `/home/node/.openclaw` üzerinde izin hataları görürseniz, ana makine bind mount'larınızın uid 1000'e ait olduğundan emin olun:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Daha hızlı yeniden derlemeler">
    Dockerfile'ınızı bağımlılık katmanları önbelleğe alınacak şekilde sıralayın. Bu, lockfile'lar değişmediği sürece `pnpm install` komutunun yeniden çalıştırılmasını önler:

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

  <Accordion title="İleri düzey kullanıcı konteyner seçenekleri">
    Varsayılan imaj güvenlik önceliklidir ve root olmayan `node` olarak çalışır. Daha kapsamlı özelliklere sahip bir konteyner için:

    1. **`/home/node` kalıcı olsun**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Sistem bağımlılıklarını imaja ekleyin**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwright tarayıcılarını kurun**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Tarayıcı indirmelerini kalıcı yapın**: `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` ayarlayın ve `OPENCLAW_HOME_VOLUME` veya `OPENCLAW_EXTRA_MOUNTS` kullanın.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (başsız Docker)">
    Sihirbazda OpenAI Codex OAuth seçerseniz bir tarayıcı URL'si açılır. Docker veya başsız kurulumlarda, ulaştığınız tam yönlendirme URL'sini kopyalayın ve kimlik doğrulamayı tamamlamak için sihirbaza geri yapıştırın.
  </Accordion>

  <Accordion title="Temel imaj meta verileri">
    Ana Docker çalışma zamanı imajı `node:24-bookworm-slim` kullanır ve `org.opencontainers.image.base.name`, `org.opencontainers.image.source` ve diğerleri dahil OCI temel imaj açıklamalarını yayımlar. Node temel özeti Dependabot Docker temel imaj PR'ları aracılığıyla yenilenir; sürüm derlemeleri distro yükseltme katmanı çalıştırmaz. Bkz.
    [OCI imaj açıklamaları](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### VPS üzerinde mi çalıştırıyorsunuz?

İkili dosyayı imaja ekleme, kalıcılık ve güncellemeler dahil paylaşılan VM dağıtım adımları için bkz. [Hetzner (Docker VPS)](/tr/install/hetzner) ve
[Docker VM Çalışma Zamanı](/tr/install/docker-vm-runtime).

## Ajan sandbox'ı

`agents.defaults.sandbox` Docker arka ucu ile etkinleştirildiğinde Gateway, ajan araç yürütmesini (kabuk, dosya okuma/yazma vb.) izole Docker konteynerleri içinde çalıştırırken Gateway'in kendisi ana makinede kalır. Bu, tüm Gateway'i konteynerleştirmeden güvenilmeyen veya çok kiracılı ajan oturumlarının etrafında sert bir sınır sağlar.

Sandbox kapsamı ajan başına (varsayılan), oturum başına veya paylaşılan olabilir. Her kapsam kendi çalışma alanını `/workspace` konumuna bağlı olarak alır. Ayrıca izin verme/engelleme araç ilkeleri, ağ izolasyonu, kaynak sınırları ve tarayıcı konteynerleri yapılandırabilirsiniz.

Tam yapılandırma, imajlar, güvenlik notları ve çok ajanlı profiller için bkz.:

- [Sandboxing](/tr/gateway/sandboxing) -- tam sandbox başvurusu
- [OpenShell](/tr/gateway/openshell) -- sandbox konteynerlerine etkileşimli kabuk erişimi
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
  <Accordion title="İmaj eksik veya sandbox konteyneri başlamıyor">
    Sandbox imajını
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    ile derleyin veya `agents.defaults.sandbox.docker.image` değerini özel imajınıza ayarlayın.
    Konteynerler gerektiğinde oturum başına otomatik oluşturulur.
  </Accordion>

  <Accordion title="Sandbox içinde izin hataları">
    `docker.user` değerini bağlı çalışma alanınızın sahipliğiyle eşleşen bir UID:GID olarak ayarlayın veya çalışma alanı klasörünün sahipliğini değiştirin.
  </Accordion>

  <Accordion title="Özel araçlar sandbox içinde bulunamıyor">
    OpenClaw komutları `sh -lc` (oturum açma kabuğu) ile çalıştırır; bu da `/etc/profile` dosyasını kaynak olarak yükler ve PATH'i sıfırlayabilir. Özel araç yollarınızı başa eklemek için `docker.env.PATH` ayarlayın veya Dockerfile'ınızda `/etc/profile.d/` altına bir betik ekleyin.
  </Accordion>

  <Accordion title="İmaj derleme sırasında OOM nedeniyle sonlandırıldı (çıkış 137)">
    VM'nin en az 2 GB RAM'e ihtiyacı vardır. Daha büyük bir makine sınıfı kullanın ve yeniden deneyin.
  </Accordion>

  <Accordion title="Control UI içinde yetkisiz veya eşleme gerekli">
    Yeni bir pano bağlantısı alın ve tarayıcı cihazını onaylayın:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Daha fazla ayrıntı: [Pano](/tr/web/dashboard), [Cihazlar](/tr/cli/devices).

  </Accordion>

  <Accordion title="Gateway hedefi ws://172.x.x.x gösteriyor veya Docker CLI'dan eşleme hataları geliyor">
    Gateway modunu ve bağlamayı sıfırlayın:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## İlgili

- [Kurulum Özeti](/tr/install) — tüm kurulum yöntemleri
- [Podman](/tr/install/podman) — Docker alternatifi Podman
- [ClawDock](/tr/install/clawdock) — Docker Compose topluluk kurulumu
- [Güncelleme](/tr/install/updating) — OpenClaw'ı güncel tutma
- [Yapılandırma](/tr/gateway/configuration) — kurulumdan sonra Gateway yapılandırması

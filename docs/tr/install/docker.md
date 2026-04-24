---
read_when:
    - Yerel kurulumlar yerine kapsayıcılaştırılmış bir Gateway istiyorsunuz
    - Docker akışını doğruluyorsunuz
summary: OpenClaw için isteğe bağlı Docker tabanlı kurulum ve ilk kullanım akışı
title: Docker
x-i18n:
    generated_at: "2026-04-24T09:15:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee6bfd2d4ad8b4629c5077d401b8fec36e71b250da3cccdd9ec3cb9c2abbdfc2
    source_path: install/docker.md
    workflow: 15
---

Docker **isteğe bağlıdır**. Yalnızca kapsayıcılaştırılmış bir Gateway istiyorsanız veya Docker akışını doğrulamak istiyorsanız kullanın.

## Docker benim için doğru mu?

- **Evet**: yalıtılmış, kolayca silinip yeniden oluşturulabilen bir Gateway ortamı istiyorsanız veya OpenClaw'ı yerel kurulum olmadan bir ana makinede çalıştırmak istiyorsanız.
- **Hayır**: kendi makinenizde çalışıyorsanız ve yalnızca en hızlı geliştirme döngüsünü istiyorsanız. Bunun yerine normal kurulum akışını kullanın.
- **Sandbox notu**: varsayılan sandbox arka ucu, sandbox etkinleştirildiğinde Docker kullanır; ancak sandbox varsayılan olarak kapalıdır ve tam Gateway'in Docker içinde çalışmasını **gerektirmez**. SSH ve OpenShell sandbox arka uçları da kullanılabilir. Bkz. [Sandboxing](/tr/gateway/sandboxing).

## Önkoşullar

- Docker Desktop (veya Docker Engine) + Docker Compose v2
- İmaj derlemesi için en az 2 GB RAM (`pnpm install`, 1 GB ana makinelerde 137 çıkış koduyla OOM-kill olabilir)
- İmajlar ve günlükler için yeterli disk alanı
- VPS/genel erişime açık bir ana makinede çalıştırıyorsanız
  [Ağ erişimi için güvenlik sıkılaştırması](/tr/gateway/security) belgesini,
  özellikle Docker `DOCKER-USER` güvenlik duvarı ilkesini inceleyin.

## Kapsayıcılaştırılmış Gateway

<Steps>
  <Step title="İmajı derleyin">
    Depo kökünden kurulum betiğini çalıştırın:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Bu, Gateway imajını yerelde derler. Bunun yerine önceden derlenmiş bir imaj kullanmak için:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Önceden derlenmiş imajlar
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw) üzerinde yayımlanır.
    Yaygın etiketler: `main`, `latest`, `<version>` (ör. `2026.2.26`).

  </Step>

  <Step title="İlk kullanım kurulumunu tamamlayın">
    Kurulum betiği ilk kullanım akışını otomatik olarak çalıştırır. Şunları yapar:

    - sağlayıcı API anahtarlarını ister
    - bir gateway token üretir ve bunu `.env` dosyasına yazar
    - Gateway'i Docker Compose ile başlatır

    Kurulum sırasında, başlangıç öncesi ilk kullanım akışı ve yapılandırma yazımları doğrudan
    `openclaw-gateway` üzerinden çalışır. `openclaw-cli`, yalnızca Gateway kapsayıcısı
    zaten mevcut olduktan sonra çalıştırdığınız komutlar içindir.

  </Step>

  <Step title="Control UI'yi açın">
    Tarayıcınızda `http://127.0.0.1:18789/` adresini açın ve yapılandırılmış
    paylaşılan gizli anahtarı Settings içine yapıştırın. Kurulum betiği varsayılan olarak `.env`
    dosyasına bir token yazar; kapsayıcı yapılandırmasını parola kimlik doğrulamasına geçirirseniz bunun yerine
    bu parolayı kullanın.

    URL'ye tekrar mı ihtiyacınız var?

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

### El ile akış

Kurulum betiğini kullanmak yerine her adımı kendiniz çalıştırmak istiyorsanız:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
`docker compose` komutunu depo kökünden çalıştırın. `OPENCLAW_EXTRA_MOUNTS`
veya `OPENCLAW_HOME_VOLUME` etkinleştirdiyseniz, kurulum betiği `docker-compose.extra.yml`
dosyasını yazar; bunu `-f docker-compose.yml -f docker-compose.extra.yml` ile ekleyin.
</Note>

<Note>
`openclaw-cli`, `openclaw-gateway`'in ağ ad alanını paylaştığı için
başlangıç sonrası bir araçtır. `docker compose up -d openclaw-gateway` komutundan önce, ilk kullanım akışını
ve kurulum zamanındaki yapılandırma yazımlarını `openclaw-gateway` üzerinden
`--no-deps --entrypoint node` ile çalıştırın.
</Note>

### Ortam değişkenleri

Kurulum betiği şu isteğe bağlı ortam değişkenlerini kabul eder:

| Değişken                     | Amaç                                                            |
| ---------------------------- | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`             | Yerelde derlemek yerine uzak bir imaj kullanır                  |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Derleme sırasında ek apt paketleri kurar (boşlukla ayrılmış)  |
| `OPENCLAW_EXTENSIONS`        | Derleme zamanında Plugin bağımlılıklarını önceden kurar (boşlukla ayrılmış adlar) |
| `OPENCLAW_EXTRA_MOUNTS`      | Ek ana makine bind mount'ları (virgülle ayrılmış `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`       | `/home/node` dizinini adlandırılmış bir Docker volume içinde kalıcı hâle getirir |
| `OPENCLAW_SANDBOX`           | Sandbox bootstrap'e isteğe bağlı katılım sağlar (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`     | Docker socket yolunu geçersiz kılar                             |

### Sağlık denetimleri

Kapsayıcı probe uç noktaları (kimlik doğrulama gerekmez):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # canlılık
curl -fsS http://127.0.0.1:18789/readyz     # hazır olma
```

Docker imajı, `/healthz` adresine ping atan yerleşik bir `HEALTHCHECK` içerir.
Denetimler sürekli başarısız olursa Docker kapsayıcıyı `unhealthy` olarak işaretler ve
orkestrasyon sistemleri onu yeniden başlatabilir veya değiştirebilir.

Kimlik doğrulamalı ayrıntılı sağlık anlık görüntüsü:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN ve loopback

`scripts/docker/setup.sh`, Docker port yayımlama ile
ana makineden `http://127.0.0.1:18789` erişiminin çalışması için varsayılan olarak `OPENCLAW_GATEWAY_BIND=lan` ayarlar.

- `lan` (varsayılan): ana makine tarayıcısı ve ana makine CLI'si yayımlanan Gateway portuna erişebilir.
- `loopback`: yalnızca kapsayıcı ağ ad alanı içindeki işlemler
  doğrudan Gateway'e erişebilir.

<Note>
`0.0.0.0` veya `127.0.0.1` gibi ana makine takma adları yerine `gateway.bind` içinde bağlama modu değerlerini (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) kullanın.
</Note>

### Depolama ve kalıcılık

Docker Compose, `OPENCLAW_CONFIG_DIR` dizinini `/home/node/.openclaw` yoluna ve
`OPENCLAW_WORKSPACE_DIR` dizinini `/home/node/.openclaw/workspace` yoluna bind mount eder; böylece bu yollar
kapsayıcı değiştirildikten sonra da korunur.

Bu bağlanan yapılandırma dizini, OpenClaw'ın şunları tuttuğu yerdir:

- davranış yapılandırması için `openclaw.json`
- saklanan sağlayıcı OAuth/API anahtarı kimlik doğrulaması için `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` gibi env destekli çalışma zamanı gizli anahtarları için `.env`

VM dağıtımlarındaki kalıcılık ayrıntılarının tamamı için bkz.
[Docker VM Runtime - Hangi veriler nerede kalır](/tr/install/docker-vm-runtime#what-persists-where).

**Disk büyümesinin yoğun olduğu alanlar:** `media/`, oturum JSONL dosyaları, `cron/runs/*.jsonl`
ve `/tmp/openclaw/` altındaki dönen dosya günlüklerini izleyin.

### Kabuk yardımcıları (isteğe bağlı)

Günlük Docker yönetimini kolaylaştırmak için `ClawDock` kurun:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

ClawDock'u eski `scripts/shell-helpers/clawdock-helpers.sh` raw yolundan kurduysanız, yerel yardımcı dosyanızın yeni konumu izlemesi için yukarıdaki kurulum komutunu yeniden çalıştırın.

Ardından `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` vb. komutları kullanın.
Tüm komutlar için `clawdock-help` çalıştırın.
Tam yardımcı kılavuzu için bkz. [ClawDock](/tr/install/clawdock).

<AccordionGroup>
  <Accordion title="Docker Gateway için agent sandbox'ı etkinleştirme">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Özel socket yolu (ör. rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Betik, `docker.sock` dosyasını yalnızca sandbox önkoşulları geçtikten sonra bağlar. Eğer
    sandbox kurulumu tamamlanamazsa betik `agents.defaults.sandbox.mode`
    değerini `off` konumuna sıfırlar.

  </Accordion>

  <Accordion title="Otomasyon / CI (etkileşimsiz)">
    Compose sahte TTY tahsisini `-T` ile devre dışı bırakın:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Paylaşılan ağ güvenliği notu">
    `openclaw-cli`, CLI
    komutlarının Gateway'e `127.0.0.1` üzerinden ulaşabilmesi için `network_mode: "service:openclaw-gateway"` kullanır. Bunu paylaşılan bir
    güven sınırı olarak değerlendirin. Compose yapılandırması `NET_RAW`/`NET_ADMIN` yetkilerini kaldırır ve
    `openclaw-cli` üzerinde `no-new-privileges` seçeneğini etkinleştirir.
  </Accordion>

  <Accordion title="İzinler ve EACCES">
    İmaj `node` (uid 1000) kullanıcısıyla çalışır. Eğer
    `/home/node/.openclaw` üzerinde izin hataları görüyorsanız, ana makine bind mount'larınızın uid 1000'e ait olduğundan emin olun:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Daha hızlı yeniden derlemeler">
    Dockerfile'ınızı bağımlılık katmanları önbelleğe alınacak şekilde sıralayın. Bu, lockfile'lar değişmediği sürece
    `pnpm install` komutunun yeniden çalıştırılmasını önler:

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

  <Accordion title="İleri düzey kapsayıcı seçenekleri">
    Varsayılan imaj güvenlik önceliklidir ve root olmayan `node` kullanıcısıyla çalışır. Daha
    tam özellikli bir kapsayıcı için:

    1. **`/home/node` dizinini kalıcı yapın**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Sistem bağımlılıklarını imaja ekleyin**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwright tarayıcılarını kurun**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Tarayıcı indirmelerini kalıcı yapın**: şu değeri ayarlayın:
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` ve
       `OPENCLAW_HOME_VOLUME` veya `OPENCLAW_EXTRA_MOUNTS` kullanın.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (başsız Docker)">
    Sihirbazda OpenAI Codex OAuth seçerseniz bir tarayıcı URL'si açılır. Docker
    veya başsız kurulumlarda, indiğiniz tam yönlendirme URL'sini kopyalayıp
    kimlik doğrulamayı tamamlamak için yeniden sihirbaza yapıştırın.
  </Accordion>

  <Accordion title="Temel imaj meta verileri">
    Ana Docker imajı `node:24-bookworm` kullanır ve
    `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` ve diğerleri dahil OCI temel imaj
    ek açıklamalarını yayımlar. Bkz.
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### VPS üzerinde mi çalıştırıyorsunuz?

İkili dosya hazırlama, kalıcılık ve güncellemeler dahil
paylaşımlı VM dağıtım adımları için [Hetzner (Docker VPS)](/tr/install/hetzner) ve
[Docker VM Runtime](/tr/install/docker-vm-runtime) belgelerine bakın.

## Agent Sandbox

`agents.defaults.sandbox`, Docker arka ucuyla etkinleştirildiğinde Gateway,
tüm Gateway'i kapsayıcılaştırmak yerine agent araç yürütmesini (shell, dosya okuma/yazma vb.)
yalıtılmış Docker kapsayıcıları içinde çalıştırır, kendisi ise ana makinede kalır. Bu size
güvenilmeyen veya çok kiracılı agent oturumları etrafında güçlü bir yalıtım duvarı sağlar.

Sandbox kapsamı agent başına (varsayılan), oturum başına veya paylaşımlı olabilir. Her kapsam,
`/workspace` yoluna bağlanan kendi çalışma alanını alır. Ayrıca
izin/verme araç ilkeleri, ağ yalıtımı, kaynak sınırları ve tarayıcı
kapsayıcıları da yapılandırabilirsiniz.

Tam yapılandırma, imajlar, güvenlik notları ve çok agent'lı profiller için bkz.:

- [Sandboxing](/tr/gateway/sandboxing) -- sandbox için tam başvuru
- [OpenShell](/tr/gateway/openshell) -- sandbox kapsayıcılarına etkileşimli kabuk erişimi
- [Multi-Agent Sandbox and Tools](/tr/tools/multi-agent-sandbox-tools) -- agent başına geçersiz kılmalar

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
    Kapsayıcılar ihtiyaç duyulduğunda oturum başına otomatik olarak oluşturulur.
  </Accordion>

  <Accordion title="Sandbox içinde izin hataları">
    `docker.user` değerini bağlanan çalışma alanı sahipliğinizle eşleşen bir UID:GID olarak ayarlayın
    veya çalışma alanı klasörünün sahibini değiştirin.
  </Accordion>

  <Accordion title="Sandbox içinde özel araçlar bulunamıyor">
    OpenClaw komutları `sh -lc` ile çalıştırır (login shell); bu da
    `/etc/profile` dosyasını kaynak alır ve PATH değerini sıfırlayabilir. Özel araç yollarınızı
    öne eklemek için `docker.env.PATH` değerini ayarlayın veya Dockerfile'ınıza `/etc/profile.d/` altında bir betik ekleyin.
  </Accordion>

  <Accordion title="İmaj derlemesi sırasında OOM-kill (çıkış 137)">
    VM en az 2 GB RAM gerektirir. Daha büyük bir makine sınıfı kullanın ve yeniden deneyin.
  </Accordion>

  <Accordion title="Control UI içinde Unauthorized veya eşleme gerekli">
    Yeni bir pano bağlantısı alın ve tarayıcı cihazını onaylayın:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Daha fazla ayrıntı: [Dashboard](/tr/web/dashboard), [Devices](/tr/cli/devices).

  </Accordion>

  <Accordion title="Gateway hedefi ws://172.x.x.x gösteriyor veya Docker CLI'den eşleme hataları geliyor">
    Gateway modunu ve bağlamayı sıfırlayın:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## İlgili

- [Kuruluma Genel Bakış](/tr/install) — tüm kurulum yöntemleri
- [Podman](/tr/install/podman) — Docker'a Podman alternatifi
- [ClawDock](/tr/install/clawdock) — Docker Compose topluluk kurulumu
- [Güncelleme](/tr/install/updating) — OpenClaw'ı güncel tutma
- [Yapılandırma](/tr/gateway/configuration) — kurulumdan sonra Gateway yapılandırması

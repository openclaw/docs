---
read_when:
    - Yerel kurulumlar yerine kapsayıcılaştırılmış bir gateway istediğinizde
    - Docker akışını doğruladığınızda
summary: OpenClaw için isteğe bağlı Docker tabanlı kurulum ve onboarding
title: Docker
x-i18n:
    generated_at: "2026-04-05T13:57:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4628362d52597f85e72c214efe96b2923c7a59a8592b3044dc8c230318c515b8
    source_path: install/docker.md
    workflow: 15
---

# Docker (isteğe bağlı)

Docker **isteğe bağlıdır**. Yalnızca kapsayıcılaştırılmış bir gateway istiyorsanız veya Docker akışını doğrulamak istiyorsanız kullanın.

## Docker benim için doğru seçim mi?

- **Evet**: yalıtılmış, geçici bir gateway ortamı istiyorsanız veya OpenClaw'ı yerel kurulum olmadan bir ana makinede çalıştırmak istiyorsanız.
- **Hayır**: kendi makinenizde çalışıyorsanız ve yalnızca en hızlı geliştirme döngüsünü istiyorsanız. Bunun yerine normal kurulum akışını kullanın.
- **Sandboxing notu**: agent sandboxing de Docker kullanır, ancak tam gateway'in Docker içinde çalışmasını gerektirmez. Bkz. [Sandboxing](/gateway/sandboxing).

## Ön koşullar

- Docker Desktop (veya Docker Engine) + Docker Compose v2
- İmaj derlemesi için en az 2 GB RAM (`pnpm install`, 1 GB ana makinelerde 137 çıkış koduyla OOM-killed olabilir)
- İmajlar ve günlükler için yeterli disk alanı
- VPS/genel ana makine üzerinde çalıştırıyorsanız
  [Ağ erişimi için güvenlik sertleştirmesi](/gateway/security) bölümünü,
  özellikle Docker `DOCKER-USER` güvenlik duvarı ilkesini inceleyin.

## Kapsayıcılaştırılmış Gateway

<Steps>
  <Step title="İmajı derleyin">
    Depo kökünden kurulum betiğini çalıştırın:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Bu, gateway imajını yerel olarak derler. Bunun yerine önceden derlenmiş bir imaj kullanmak için:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Önceden derlenmiş imajlar
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw) üzerinde yayımlanır.
    Yaygın etiketler: `main`, `latest`, `<version>` (ör. `2026.2.26`).

  </Step>

  <Step title="Onboarding'i tamamlayın">
    Kurulum betiği onboarding'i otomatik olarak çalıştırır. Şunları yapar:

    - sağlayıcı API anahtarlarını ister
    - bir gateway token'ı üretir ve bunu `.env` içine yazar
    - gateway'i Docker Compose ile başlatır

    Kurulum sırasında, başlangıç öncesi onboarding ve config yazımları doğrudan
    `openclaw-gateway` üzerinden çalışır. `openclaw-cli`, yalnızca
    gateway kapsayıcısı zaten var olduktan sonra çalıştırdığınız komutlar içindir.

  </Step>

  <Step title="Control UI'yi açın">
    Tarayıcınızda `http://127.0.0.1:18789/` adresini açın ve yapılandırılmış
    paylaşılan gizli bilgiyi Ayarlar içine yapıştırın. Kurulum betiği varsayılan
    olarak `.env` içine bir token yazar; kapsayıcı config'ini parola auth'una geçirirseniz
    onun yerine bu parolayı kullanın.

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

Kurulum betiğini kullanmak yerine her adımı kendiniz çalıştırmayı tercih ediyorsanız:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.mode local
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.bind lan
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.controlUi.allowedOrigins \
  '["http://localhost:18789","http://127.0.0.1:18789"]' --strict-json
docker compose up -d openclaw-gateway
```

<Note>
`docker compose` komutunu depo kökünden çalıştırın. `OPENCLAW_EXTRA_MOUNTS`
veya `OPENCLAW_HOME_VOLUME` etkinleştirdiyseniz kurulum betiği `docker-compose.extra.yml` yazar;
bunu `-f docker-compose.yml -f docker-compose.extra.yml` ile dahil edin.
</Note>

<Note>
`openclaw-cli`, `openclaw-gateway` ağ ad alanını paylaştığı için
başlatma sonrası bir araçtır. `docker compose up -d openclaw-gateway` öncesinde onboarding
ve kurulum zamanı config yazımlarını `openclaw-gateway` üzerinden
`--no-deps --entrypoint node` ile çalıştırın.
</Note>

### Ortam değişkenleri

Kurulum betiği şu isteğe bağlı ortam değişkenlerini kabul eder:

| Değişken                      | Amaç                                                             |
| ----------------------------- | ---------------------------------------------------------------- |
| `OPENCLAW_IMAGE`              | Yerel derleme yerine uzak bir imaj kullanır                      |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Derleme sırasında ek apt paketleri kurar (boşlukla ayrılmış)     |
| `OPENCLAW_EXTENSIONS`         | Derleme zamanında uzantı bağımlılıklarını önceden kurar (boşlukla ayrılmış adlar) |
| `OPENCLAW_EXTRA_MOUNTS`       | Ek ana makine bind mount'ları (virgülle ayrılmış `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`        | `/home/node` dizinini adlandırılmış bir Docker volume içinde kalıcı hale getirir |
| `OPENCLAW_SANDBOX`            | Sandbox bootstrap kullanımına açıkça izin verir (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`      | Docker soketi yolunu geçersiz kılar                              |

### Sağlık denetimleri

Kapsayıcı yoklama uç noktaları (auth gerekmez):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # canlılık
curl -fsS http://127.0.0.1:18789/readyz     # hazır olma
```

Docker imajı, `/healthz` uç noktasını yoklayan yerleşik bir `HEALTHCHECK` içerir.
Denetimler sürekli başarısız olursa Docker kapsayıcıyı `unhealthy` olarak işaretler ve
orkestrasyon sistemleri bunu yeniden başlatabilir veya değiştirebilir.

Auth gerektiren ayrıntılı sağlık anlık görüntüsü:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN ve loopback

`scripts/docker/setup.sh`, Docker bağlantı noktası yayımlamasıyla
ana makineden `http://127.0.0.1:18789` erişimi çalışsın diye varsayılan olarak `OPENCLAW_GATEWAY_BIND=lan` ayarlar.

- `lan` (varsayılan): ana makine tarayıcısı ve ana makine CLI'si yayımlanmış gateway bağlantı noktasına erişebilir.
- `loopback`: yalnızca kapsayıcı ağ ad alanı içindeki süreçler
  doğrudan gateway'e erişebilir.

<Note>
`0.0.0.0` veya `127.0.0.1` gibi ana makine takma adlarını değil,
`gateway.bind` içindeki bağlama modu değerlerini (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) kullanın.
</Note>

### Depolama ve kalıcılık

Docker Compose, `OPENCLAW_CONFIG_DIR` dizinini `/home/node/.openclaw` yoluna ve
`OPENCLAW_WORKSPACE_DIR` dizinini `/home/node/.openclaw/workspace` yoluna bind-mount eder; bu yüzden bu yollar
kapsayıcı değiştirildiğinde korunur.

Bu bağlı config dizini, OpenClaw'ın şunları tuttuğu yerdir:

- davranış config'i için `openclaw.json`
- saklanan sağlayıcı OAuth/API-key auth'u için `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` gibi env tabanlı çalışma zamanı gizli bilgileri için `.env`

VM dağıtımlarındaki tam kalıcılık ayrıntıları için bkz.
[Docker VM Runtime - What persists where](/install/docker-vm-runtime#what-persists-where).

**Disk büyümesi sıcak noktaları:** `media/`, oturum JSONL dosyaları, `cron/runs/*.jsonl`
ve `/tmp/openclaw/` altındaki dönen dosya günlüklerini izleyin.

### Shell yardımcıları (isteğe bağlı)

Günlük Docker yönetimini kolaylaştırmak için `ClawDock` kurun:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

ClawDock'u eski `scripts/shell-helpers/clawdock-helpers.sh` ham yolundan kurduysanız yerel yardımcı dosyanızın yeni konumu izlemesi için yukarıdaki kurulum komutunu yeniden çalıştırın.

Ardından `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` vb. kullanın.
Tüm komutlar için `clawdock-help` çalıştırın.
Tam yardımcı kılavuzu için [ClawDock](/install/clawdock) bölümüne bakın.

<AccordionGroup>
  <Accordion title="Docker gateway için agent sandbox'ı etkinleştirme">
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

    Betik, sandbox ön koşulları geçtikten sonra `docker.sock` dosyasını bağlar.
    Sandbox kurulumu tamamlanamazsa betik `agents.defaults.sandbox.mode`
    değerini `off` olarak sıfırlar.

  </Accordion>

  <Accordion title="Otomasyon / CI (etkileşimsiz)">
    Compose sözde-TTY ayırmayı `-T` ile devre dışı bırakın:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Paylaşılan ağ güvenlik notu">
    `openclaw-cli`, CLI
    komutlarının `127.0.0.1` üzerinden gateway'e erişebilmesi için `network_mode: "service:openclaw-gateway"` kullanır.
    Bunu paylaşılan bir güven sınırı olarak değerlendirin. Compose config'i `NET_RAW`/`NET_ADMIN` yetkilerini kaldırır ve
    `openclaw-cli` üzerinde `no-new-privileges` etkinleştirir.
  </Accordion>

  <Accordion title="İzinler ve EACCES">
    İmaj `node` (uid 1000) olarak çalışır. Eğer
    `/home/node/.openclaw` üzerinde izin hataları görüyorsanız ana makine bind mount'larınızın uid 1000 sahibi olduğundan emin olun:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Daha hızlı yeniden derlemeler">
    Dockerfile'ınızı bağımlılık katmanları önbelleğe alınacak şekilde sıralayın. Bu,
    kilit dosyaları değişmediği sürece `pnpm install` komutunun yeniden çalıştırılmasını önler:

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
    Varsayılan imaj güvenlik önceliklidir ve root olmayan `node` kullanıcısı olarak çalışır. Daha
    tam özellikli bir kapsayıcı için:

    1. **`/home/node` kalıcı hale getirin**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Sistem bağımlılıklarını imaja ekleyin**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Playwright tarayıcılarını kurun**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Tarayıcı indirmelerini kalıcı hale getirin**: şunu ayarlayın
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` ve
       `OPENCLAW_HOME_VOLUME` veya `OPENCLAW_EXTRA_MOUNTS` kullanın.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Sihirbazda OpenAI Codex OAuth seçerseniz bir tarayıcı URL'si açılır. Docker veya headless kurulumlarda ulaştığınız tam yönlendirme URL'sini kopyalayın ve auth'u tamamlamak için
    sihirbaza geri yapıştırın.
  </Accordion>

  <Accordion title="Temel imaj meta verileri">
    Ana Docker imajı `node:24-bookworm` kullanır ve
    `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` ve diğerlerini içeren OCI temel imaj ek açıklamalarını yayımlar. Bkz.
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### VPS üzerinde mi çalıştırıyorsunuz?

İkili hazırlama, kalıcılık ve güncellemeler dahil
paylaşılan VM dağıtım adımları için [Hetzner (Docker VPS)](/install/hetzner) ve
[Docker VM Runtime](/install/docker-vm-runtime) bölümlerine bakın.

## Agent Sandbox

`agents.defaults.sandbox` etkin olduğunda gateway, agent araç yürütmesini
(shell, dosya okuma/yazma vb.) yalıtılmış Docker kapsayıcıları içinde çalıştırırken
gateway'in kendisi ana makinede kalır. Bu size güvenilmeyen veya
çok kiracılı agent oturumları etrafında sert bir sınır sağlar; tüm gateway'i kapsayıcılaştırmanız gerekmez.

Sandbox kapsamı agent başına (varsayılan), oturum başına veya paylaşılan olabilir. Her kapsam
`/workspace` üzerine bağlı kendi çalışma alanını alır. Ayrıca
izin/verme aracı ilkeleri, ağ yalıtımı, kaynak sınırları ve tarayıcı kapsayıcıları da yapılandırabilirsiniz.

Tam config, imajlar, güvenlik notları ve çok agent'lı profiller için bkz.:

- [Sandboxing](/gateway/sandboxing) -- tam sandbox başvurusu
- [OpenShell](/gateway/openshell) -- sandbox kapsayıcılarına etkileşimli shell erişimi
- [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) -- agent başına geçersiz kılmalar

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

## Sorun Giderme

<AccordionGroup>
  <Accordion title="İmaj eksik veya sandbox kapsayıcısı başlamıyor">
    Sandbox imajını
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    ile derleyin veya `agents.defaults.sandbox.docker.image` değerini özel imajınıza ayarlayın.
    Kapsayıcılar istek üzerine oturum başına otomatik oluşturulur.
  </Accordion>

  <Accordion title="Sandbox içinde izin hataları">
    `docker.user` değerini bağlı çalışma alanı sahipliğiyle eşleşen bir UID:GID olarak ayarlayın
    veya çalışma alanı klasörünün sahibini değiştirin.
  </Accordion>

  <Accordion title="Özel araçlar sandbox içinde bulunamıyor">
    OpenClaw komutları `sh -lc` ile (login shell) çalıştırır; bu
    `/etc/profile` dosyasını yükler ve PATH değerini sıfırlayabilir. Özel araç yollarınızı
    başa eklemek için `docker.env.PATH` ayarlayın veya Dockerfile içinde `/etc/profile.d/` altına bir betik ekleyin.
  </Accordion>

  <Accordion title="İmaj derlemesi sırasında OOM-killed (çıkış 137)">
    VM en az 2 GB RAM gerektirir. Daha büyük bir makine sınıfı kullanın ve tekrar deneyin.
  </Accordion>

  <Accordion title="Control UI içinde Unauthorized veya pairing required">
    Yeni bir dashboard bağlantısı alın ve tarayıcı cihazını onaylayın:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Daha fazla ayrıntı: [Dashboard](/web/dashboard), [Devices](/cli/devices).

  </Accordion>

  <Accordion title="Gateway hedefi Docker CLI'den ws://172.x.x.x veya pairing errors gösteriyor">
    Gateway modunu ve bağlamayı sıfırlayın:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.mode local
    docker compose run --rm openclaw-cli config set gateway.bind lan
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## İlgili

- [Install Overview](/install) — tüm kurulum yöntemleri
- [Podman](/install/podman) — Docker için Podman alternatifi
- [ClawDock](/install/clawdock) — Docker Compose topluluk kurulumu
- [Updating](/install/updating) — OpenClaw'ı güncel tutma
- [Configuration](/gateway/configuration) — kurulum sonrası gateway config'i

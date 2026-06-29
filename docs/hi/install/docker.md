---
read_when:
    - आप local इंस्टॉल के बजाय एक containerized gateway चाहते हैं
    - आप Docker प्रवाह को सत्यापित कर रहे हैं
summary: OpenClaw के लिए वैकल्पिक Docker-आधारित सेटअप और ऑनबोर्डिंग
title: Docker
x-i18n:
    generated_at: "2026-06-28T23:20:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f28b60449da7e4194fa32cc4681a0d276612b91e68af30a81dfab0dc89e02d1f
    source_path: install/docker.md
    workflow: 16
---

Docker **वैकल्पिक** है। इसका उपयोग केवल तब करें जब आप कंटेनरीकृत gateway चाहते हों या Docker flow को सत्यापित करना चाहते हों।

## क्या Docker मेरे लिए सही है?

- **हाँ**: आप एक अलग-थलग, अस्थायी gateway परिवेश चाहते हैं या OpenClaw को ऐसे host पर चलाना चाहते हैं जहाँ local installs न हों।
- **नहीं**: आप अपनी मशीन पर चला रहे हैं और बस सबसे तेज dev loop चाहते हैं। इसके बजाय सामान्य install flow का उपयोग करें।
- **Sandboxing नोट**: जब sandboxing सक्षम होती है, default sandbox backend Docker का उपयोग करता है, लेकिन sandboxing default रूप से बंद होती है और पूरे gateway को Docker में चलाने की **आवश्यकता नहीं** होती। SSH और OpenShell sandbox backends भी उपलब्ध हैं। [Sandboxing](/hi/gateway/sandboxing) देखें।

## पूर्वापेक्षाएँ

- Docker Desktop (या Docker Engine) + Docker Compose v2
- image build के लिए कम से कम 2 GB RAM (`pnpm install` 1 GB hosts पर exit 137 के साथ OOM-killed हो सकता है)
- images और logs के लिए पर्याप्त disk
- यदि VPS/public host पर चला रहे हैं, तो
  [network exposure के लिए security hardening](/hi/gateway/security) की समीक्षा करें,
  विशेष रूप से Docker `DOCKER-USER` firewall policy।

## कंटेनरीकृत gateway

<Steps>
  <Step title="Image बनाएँ">
    repo root से setup script चलाएँ:

    ```bash
    ./scripts/docker/setup.sh
    ```

    यह gateway image को local रूप से बनाता है। इसके बजाय pre-built image का उपयोग करने के लिए:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Pre-built images पहले
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw) पर प्रकाशित की जाती हैं।
    GHCR release automation, pinned deployments,
    और provenance checks के लिए primary registry है। वही release workflow उन hosts के लिए `openclaw/openclaw` पर official
    Docker Hub mirror भी प्रकाशित करता है जो Docker Hub पसंद करते हैं:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    `ghcr.io/openclaw/openclaw` या `openclaw/openclaw` का उपयोग करें। community
    Docker Hub mirrors से बचें क्योंकि OpenClaw उनके release timing,
    rebuilds, या retention policy को नियंत्रित नहीं करता। सामान्य official tags: `main`, `latest`,
    `<version>` (जैसे `2026.2.26`), और beta versions जैसे
    `2026.2.26-beta.1`। Beta tags `latest` या `main` को move नहीं करते।

  </Step>

  <Step title="Airgapped rerun">
    offline hosts पर, पहले image transfer और load करें:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` सत्यापित करता है कि `OPENCLAW_IMAGE` पहले से local रूप से मौजूद है, implicit Compose pulls और builds को अक्षम करता है, फिर सामान्य setup flow चलाता है जैसे
    `.env` synchronization, permission fixes, onboarding, gateway config sync,
    और Compose startup।

    यदि `OPENCLAW_SANDBOX=1`, offline setup configured default
    और `OPENCLAW_DOCKER_SOCKET` के पीछे daemon पर active per-agent sandbox images भी जाँचता है। Docker-backed browser images में वर्तमान OpenClaw browser contract label भी होना चाहिए। जब कोई required image गायब या
    incompatible होती है, setup sandbox configuration बदले बिना exit करता है, बजाय unusable sandbox के साथ success report करने के।

  </Step>

  <Step title="Onboarding पूरा करें">
    setup script onboarding अपने-आप चलाती है। यह:

    - provider API keys के लिए prompt करेगी
    - gateway token generate करेगी और उसे `.env` में लिखेगी
    - auth-profile secret key directory बनाएगी
    - Docker Compose के माध्यम से gateway शुरू करेगी

    setup के दौरान, pre-start onboarding और config writes सीधे
    `openclaw-gateway` के माध्यम से चलते हैं। `openclaw-cli` उन commands के लिए है जिन्हें आप gateway container पहले से मौजूद होने के बाद चलाते हैं।

  </Step>

  <Step title="Control UI खोलें">
    अपने browser में `http://127.0.0.1:18789/` खोलें और configured
    shared secret को Settings में paste करें। setup script default रूप से `.env` में token लिखती है; यदि आप container config को password auth में switch करते हैं, तो इसके बजाय वह
    password उपयोग करें।

    URL फिर चाहिए?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Channels configure करें (वैकल्पिक)">
    messaging channels जोड़ने के लिए CLI container का उपयोग करें:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Docs: [WhatsApp](/hi/channels/whatsapp), [Telegram](/hi/channels/telegram), [Discord](/hi/channels/discord)

  </Step>
</Steps>

### Manual flow

यदि आप setup script का उपयोग करने के बजाय प्रत्येक step स्वयं चलाना पसंद करते हैं:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
`docker compose` repo root से चलाएँ। यदि आपने `OPENCLAW_EXTRA_MOUNTS`
या `OPENCLAW_HOME_VOLUME` सक्षम किया है, तो setup script `docker-compose.extra.yml` लिखती है;
इसे किसी भी standard override file के बाद शामिल करें, उदाहरण के लिए
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`
जब दोनों override files मौजूद हों।
</Note>

<Note>
क्योंकि `openclaw-cli`, `openclaw-gateway` का network namespace साझा करता है, यह एक
post-start tool है। `docker compose up -d openclaw-gateway` से पहले, onboarding
और setup-time config writes को `openclaw-gateway` के माध्यम से
`--no-deps --entrypoint node` के साथ चलाएँ।
</Note>

### Environment variables

setup script ये optional environment variables स्वीकार करती है:

| Variable                                   | Purpose                                                               |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | local build करने के बजाय remote image का उपयोग करें                        |
| `OPENCLAW_IMAGE_APT_PACKAGES`              | build के दौरान extra apt packages install करें (space-separated)             |
| `OPENCLAW_IMAGE_PIP_PACKAGES`              | build के दौरान extra Python packages install करें (space-separated)          |
| `OPENCLAW_EXTENSIONS`                      | build time पर plugin dependencies pre-install करें (space-separated names) |
| `OPENCLAW_EXTRA_MOUNTS`                    | extra host bind mounts (comma-separated `source:target[:opts]`)       |
| `OPENCLAW_HOME_VOLUME`                     | `/home/node` को named Docker volume में persist करें                         |
| `OPENCLAW_SANDBOX`                         | sandbox bootstrap में opt in करें (`1`, `true`, `yes`, `on`)                |
| `OPENCLAW_SKIP_ONBOARDING`                 | interactive onboarding step छोड़ें (`1`, `true`, `yes`, `on`)       |
| `OPENCLAW_DOCKER_SOCKET`                   | Docker socket path override करें                                           |
| `OPENCLAW_DISABLE_BONJOUR`                 | Bonjour/mDNS advertising अक्षम करें (Docker के लिए default `1`)         |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | bundled plugin source bind-mount overlays अक्षम करें                     |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | OpenTelemetry export के लिए shared OTLP/HTTP collector endpoint          |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | traces, metrics, या logs के लिए signal-specific OTLP endpoints           |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP protocol override। आज केवल `http/protobuf` supported है       |
| `OTEL_SERVICE_NAME`                        | OpenTelemetry resources के लिए उपयोग किया गया service name                         |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | latest experimental GenAI semantic attributes में opt in करें               |
| `OPENCLAW_OTEL_PRELOADED`                  | जब कोई preloaded हो, second OpenTelemetry SDK शुरू करना छोड़ें        |

official Docker image Homebrew ship नहीं करती। onboarding के दौरान, OpenClaw
brew-only skill dependency installers को तब छिपाता है जब वह `brew` के बिना Linux
container में चल रहा होता है; वे dependencies custom image द्वारा प्रदान की जानी चाहिए
या manually install की जानी चाहिए। Debian packages से उपलब्ध dependencies के लिए, image build के दौरान
`OPENCLAW_IMAGE_APT_PACKAGES` का उपयोग करें। legacy
`OPENCLAW_DOCKER_APT_PACKAGES` नाम अभी भी स्वीकार किया जाता है।
Python dependencies के लिए, `OPENCLAW_IMAGE_PIP_PACKAGES` का उपयोग करें। यह image build के दौरान
`python3 -m pip install --break-system-packages` चलाता है, इसलिए
package versions pin करें और केवल उन package indexes का उपयोग करें जिन पर आप भरोसा करते हैं।

Maintainers packaged image के विरुद्ध bundled plugin source test कर सकते हैं, एक plugin source directory को उसके packaged source path पर mount करके, उदाहरण के लिए
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`।
वह mounted source directory उसी plugin id के लिए matching compiled
`/app/dist/extensions/synology-chat` bundle को override करती है।

### Observability

OpenTelemetry export Gateway container से आपके OTLP
collector तक outbound होता है। इसके लिए published Docker port की आवश्यकता नहीं है। यदि आप image
local रूप से build करते हैं और bundled OpenTelemetry exporter image के अंदर उपलब्ध चाहते हैं,
तो इसकी runtime dependencies शामिल करें:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

packaged Docker installs में export सक्षम करने से पहले ClawHub से official `@openclaw/diagnostics-otel` Plugin install करें।
Custom source-built images अब भी local plugin source को
`OPENCLAW_EXTENSIONS=diagnostics-otel` के साथ शामिल कर सकती हैं। export सक्षम करने के लिए, config में
`diagnostics-otel` Plugin को allow और enable करें, फिर
`diagnostics.otel.enabled=true` set करें या [OpenTelemetry
export](/hi/gateway/opentelemetry) में config example का उपयोग करें। Collector auth headers
`diagnostics.otel.headers` के माध्यम से configure होते हैं, Docker environment variables के माध्यम से नहीं।

Prometheus metrics पहले से published Gateway port का उपयोग करते हैं। Install करें
`clawhub:@openclaw/diagnostics-prometheus`, `diagnostics-prometheus` Plugin enable करें, फिर scrape करें:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

route Gateway authentication द्वारा protected है। अलग
public `/metrics` port या unauthenticated reverse-proxy path expose न करें। देखें
[Prometheus metrics](/hi/gateway/prometheus).

### Health checks

Container probe endpoints (auth required नहीं):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker image में built-in `HEALTHCHECK` शामिल है जो `/healthz` को ping करता है।
यदि checks लगातार fail होते हैं, तो Docker container को `unhealthy` mark करता है और
orchestration systems उसे restart या replace कर सकते हैं।

Authenticated deep health snapshot:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN बनाम loopback

`scripts/docker/setup.sh` default रूप से `OPENCLAW_GATEWAY_BIND=lan` रखता है ताकि
`http://127.0.0.1:18789` तक host access Docker port publishing के साथ काम करे।

- `lan` (default): host browser और host CLI published gateway port तक पहुँच सकते हैं।
- `loopback`: केवल container network namespace के अंदर की processes सीधे
  gateway तक पहुँच सकती हैं।

<Note>
`gateway.bind` में bind mode values (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) का उपयोग करें, `0.0.0.0` या `127.0.0.1` जैसे host aliases नहीं।
</Note>

### Host Local Providers

जब OpenClaw Docker में चलता है, तो container के अंदर `127.0.0.1` container
स्वयं होता है, आपकी host machine नहीं। host पर चलने वाले AI providers के लिए `host.docker.internal` का उपयोग करें:

| प्रदाता  | होस्ट डिफ़ॉल्ट URL         | Docker सेटअप URL                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

बंडल किया गया Docker सेटअप उन होस्ट URL को LM Studio और Ollama
ऑनबोर्डिंग डिफ़ॉल्ट के रूप में उपयोग करता है, और `docker-compose.yml` Linux Docker Engine के लिए `host.docker.internal` को
Docker के होस्ट Gateway से मैप करता है। Docker Desktop macOS और Windows पर
पहले से वही होस्टनाम उपलब्ध कराता है।

होस्ट सेवाओं को Docker से पहुंच योग्य पते पर भी सुनना चाहिए:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

यदि आप अपनी Compose फ़ाइल या `docker run` कमांड का उपयोग करते हैं, तो वही होस्ट
मैपिंग स्वयं जोड़ें, उदाहरण के लिए
`--add-host=host.docker.internal:host-gateway`.

### Docker में Claude CLI बैकएंड

आधिकारिक OpenClaw Docker इमेज Claude Code को पहले से इंस्टॉल नहीं करती। उस
कंटेनर उपयोगकर्ता के अंदर Claude Code इंस्टॉल करें और लॉग इन करें जो OpenClaw चलाता है, फिर
उस कंटेनर होम को स्थायी रखें ताकि इमेज अपग्रेड बाइनरी या Claude प्रमाणीकरण
स्थिति को मिटा न दें।

नए Docker इंस्टॉल के लिए, सेटअप चलाने से पहले एक स्थायी `/home/node` वॉल्यूम
सक्षम करें:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

मौजूदा Docker इंस्टॉल के लिए, पहले स्टैक रोकें और सेटअप दोबारा चलाने से पहले वर्तमान
Docker `.env` मान फिर से लोड करें। सेटअप स्क्रिप्ट `.env` को स्वयं नहीं पढ़ती;
यह वर्तमान शेल और डिफ़ॉल्ट से `.env` को फिर से लिखती है। जनरेट किए गए `.env` के लिए, चलाएँ:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

यदि आपके `.env` में ऐसे मान हैं जिन्हें आपका शेल स्रोत नहीं कर सकता, तो पहले उन
मौजूदा मानों को मैन्युअल रूप से फिर से export करें जिन पर आप निर्भर हैं, जैसे `OPENCLAW_IMAGE`, पोर्ट, bind मोड,
कस्टम पथ, `OPENCLAW_EXTRA_MOUNTS`, sandbox, और skip-onboarding सेटिंग्स।
जनरेट किया गया overlay `openclaw-gateway` और
`openclaw-cli` दोनों के लिए होम वॉल्यूम माउंट करता है।

बाकी कमांड जनरेट किए गए Compose overlay के साथ चलाएँ ताकि दोनों सेवाएँ
स्थायी होम माउंट करें। यदि आपका सेटअप `docker-compose.override.yml` भी उपयोग करता है,
तो उसे `docker-compose.extra.yml` से पहले शामिल करें।

उस स्थायी होम में Claude Code इंस्टॉल करें:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

नेटिव इंस्टॉलर `claude` बाइनरी को
`/home/node/.local/bin/claude` के अंतर्गत लिखता है। OpenClaw को वह कंटेनर पथ उपयोग करने के लिए कहें:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

उसी स्थायी कंटेनर होम के अंदर से लॉग इन करें और सत्यापित करें:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth login
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth status --text
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models auth login \
  --provider anthropic --method cli --set-default
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models list --provider anthropic
```

उसके बाद, आप बंडल किए गए `claude-cli` बैकएंड का उपयोग कर सकते हैं:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` नेटिव Claude Code इंस्टॉल को
`/home/node/.local/bin` और `/home/node/.local/share/claude` के अंतर्गत, साथ ही Claude Code
सेटिंग्स और प्रमाणीकरण स्थिति को `/home/node/.claude` और `/home/node/.claude.json` के अंतर्गत स्थायी रखता है।
Claude CLI के पुनः उपयोग के लिए केवल `/home/node/.openclaw` को स्थायी रखना पर्याप्त नहीं है। यदि
आप होम वॉल्यूम के बजाय `OPENCLAW_EXTRA_MOUNTS` उपयोग करते हैं, तो उन सभी
Claude पथों को दोनों Docker सेवाओं में माउंट करें।

<Note>
साझा उत्पादन ऑटोमेशन या अनुमानित Anthropic बिलिंग के लिए,
Anthropic API-key पथ को प्राथमिकता दें। Claude CLI पुनः उपयोग Claude Code के इंस्टॉल किए गए
संस्करण, खाता लॉगिन, बिलिंग, और अपडेट व्यवहार का अनुसरण करता है।
</Note>

### Bonjour / mDNS

Docker bridge networking आमतौर पर Bonjour/mDNS multicast
(`224.0.0.251:5353`) को विश्वसनीय रूप से forward नहीं करता। इसलिए बंडल किया गया Compose सेटअप डिफ़ॉल्ट रूप से
`OPENCLAW_DISABLE_BONJOUR=1` रखता है ताकि bridge द्वारा multicast ट्रैफ़िक छोड़ने पर Gateway crash-loop न करे या बार-बार
विज्ञापन restart न करे।

Docker होस्ट के लिए प्रकाशित Gateway URL, Tailscale, या wide-area DNS-SD का उपयोग करें।
`OPENCLAW_DISABLE_BONJOUR=0` केवल तब सेट करें जब host networking, macvlan,
या किसी अन्य नेटवर्क पर चला रहे हों जहाँ mDNS multicast के काम करने की पुष्टि हो।

समस्याओं और troubleshooting के लिए, [Bonjour discovery](/hi/gateway/bonjour) देखें।

### स्टोरेज और स्थायित्व

Docker Compose `OPENCLAW_CONFIG_DIR` को `/home/node/.openclaw` पर bind-mount करता है,
`OPENCLAW_WORKSPACE_DIR` को `/home/node/.openclaw/workspace` पर, और
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` को `/home/node/.config/openclaw` पर, ताकि वे
पथ कंटेनर बदलने के बाद भी बने रहें। जब कोई variable unset हो, तो बंडल किया गया
`docker-compose.yml` `${HOME}` के अंतर्गत fallback करता है, या जब `HOME` स्वयं भी
न हो तो `/tmp` पर। इससे bare environments पर `docker compose up` खाली-source
volume spec उत्सर्जित करने से बचता है।

वह माउंट की गई config directory वह जगह है जहाँ OpenClaw रखता है:

- व्यवहार config के लिए `openclaw.json`
- संग्रहीत प्रदाता OAuth/API-key auth के लिए `agents/<agentId>/agent/auth-profiles.json`
- env-backed runtime secrets जैसे `OPENCLAW_GATEWAY_TOKEN` के लिए `.env`

auth-profile secret key directory OAuth-backed auth profile token material के लिए उपयोग की जाने वाली
स्थानीय encryption key संग्रहीत करती है। इसे अपने Docker host state के साथ रखें,
लेकिन `OPENCLAW_CONFIG_DIR` से अलग।

इंस्टॉल किए गए डाउनलोड करने योग्य plugins अपनी package state को माउंट किए गए
OpenClaw home के अंतर्गत संग्रहीत करते हैं, इसलिए plugin install records और package roots कंटेनर
बदलने के बाद भी बने रहते हैं। Gateway startup bundled-plugin dependency trees जनरेट नहीं करता।

VM deployments पर पूर्ण persistence विवरण के लिए,
[Docker VM Runtime - What persists where](/hi/install/docker-vm-runtime#what-persists-where) देखें।

**डिस्क वृद्धि hotspots:** `media/`, session JSONL files, shared
SQLite state database, installed plugin package roots, और rolling file logs
`/tmp/openclaw/` के अंतर्गत देखें।

### शेल helpers (वैकल्पिक)

दैनिक Docker प्रबंधन को आसान बनाने के लिए, `ClawDock` इंस्टॉल करें:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

यदि आपने ClawDock को पुराने `scripts/shell-helpers/clawdock-helpers.sh` raw path से इंस्टॉल किया था, तो ऊपर दिया install command दोबारा चलाएँ ताकि आपकी local helper file नई जगह को track करे।

फिर `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, आदि का उपयोग करें। सभी commands के लिए
`clawdock-help` चलाएँ।
पूर्ण helper guide के लिए [ClawDock](/hi/install/clawdock) देखें।

<AccordionGroup>
  <Accordion title="Docker gateway के लिए agent sandbox सक्षम करें">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Custom socket path (जैसे rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    स्क्रिप्ट `docker.sock` को केवल sandbox prerequisites पास होने के बाद माउंट करती है। यदि
    sandbox setup पूरा नहीं हो सकता, तो स्क्रिप्ट `agents.defaults.sandbox.mode`
    को `off` पर reset करती है। Codex code-mode turns अब भी Codex
    `workspace-write` तक सीमित रहते हैं जब OpenClaw sandbox सक्रिय हो; host Docker socket को
    agent sandbox containers में माउंट न करें।

  </Accordion>

  <Accordion title="Automation / CI (non-interactive)">
    Compose pseudo-TTY allocation को `-T` के साथ अक्षम करें:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Shared-network security note">
    `openclaw-cli` `network_mode: "service:openclaw-gateway"` उपयोग करता है ताकि CLI
    commands `127.0.0.1` पर gateway तक पहुँच सकें। इसे साझा
    trust boundary मानें। compose config `NET_RAW`/`NET_ADMIN` हटाता है और
    `openclaw-gateway` और `openclaw-cli` दोनों पर
    `no-new-privileges` सक्षम करता है।
  </Accordion>

  <Accordion title="openclaw-cli में Docker Desktop DNS failures">
    कुछ Docker Desktop setups में `NET_RAW` drop होने के बाद shared-network
    `openclaw-cli` sidecar से DNS lookups विफल हो जाते हैं, जो
    `openclaw plugins install` जैसे npm-backed commands के दौरान `EAI_AGAIN` के रूप में दिखाई देता है।
    सामान्य gateway operation के लिए default hardened compose file रखें। नीचे दिया गया
    local override Docker की default capabilities restore करके CLI container की security posture को ढीला करता है,
    इसलिए इसे केवल उस one-off CLI
    command के लिए उपयोग करें जिसे package registry access चाहिए, अपने default Compose
    invocation के रूप में नहीं:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    यदि आपने पहले से long-running `openclaw-cli` container बनाया है, तो उसे
    उसी override के साथ फिर से बनाएँ। `docker compose exec` और `docker exec` पहले से बनाए गए container पर
    Linux capabilities नहीं बदल सकते।

  </Accordion>

  <Accordion title="Permissions और EACCES">
    इमेज `node` (uid 1000) के रूप में चलती है। यदि आपको
    `/home/node/.openclaw` पर permission errors दिखाई दें, तो सुनिश्चित करें कि आपके host bind mounts uid 1000 के स्वामित्व में हैं:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    वही mismatch plugin warning के रूप में भी दिख सकता है, जैसे
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    जिसके बाद `plugin present but blocked` आता है। इसका मतलब है कि process uid और
    mounted plugin directory owner मेल नहीं खाते। container को
    default uid 1000 के रूप में चलाना और bind mount ownership ठीक करना प्राथमिकता दें। केवल तब
    `/path/to/openclaw-config/npm` को `root:root` पर chown करें जब आप लंबे समय तक
    OpenClaw को root के रूप में जानबूझकर चलाते हैं।

  </Accordion>

  <Accordion title="तेज़ rebuilds">
    अपनी Dockerfile को इस तरह order करें कि dependency layers cache हों। इससे lockfiles बदलने तक
    `pnpm install` दोबारा चलाने से बचता है:

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

  <Accordion title="Power-user container options">
    default image security-first है और non-root `node` के रूप में चलती है। अधिक
    full-featured container के लिए:

    1. **`/home/node` को स्थायी रखें**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **सिस्टम निर्भरताएँ image में शामिल करें**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Python निर्भरताएँ image में शामिल करें**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Playwright Chromium को image में शामिल करें**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **या Playwright browsers को किसी स्थायी volume में install करें**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **browser downloads को स्थायी रखें**: `OPENCLAW_HOME_VOLUME` या
       `OPENCLAW_EXTRA_MOUNTS` का उपयोग करें। OpenClaw Linux पर Docker image के
       Playwright-प्रबंधित Chromium का अपने-आप पता लगा लेता है।

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (हेडलेस Docker)">
    अगर आप wizard में OpenAI Codex OAuth चुनते हैं, तो यह एक browser URL खोलता है। Docker या हेडलेस setups में, जिस पूरे redirect URL पर आप पहुँचते हैं उसे copy करें और auth पूरा करने के लिए उसे वापस wizard में paste करें।
  </Accordion>

  <Accordion title="बेस image metadata">
    मुख्य Docker runtime image `node:24-bookworm-slim` का उपयोग करती है और लंबे समय तक चलने वाले containers में zombie processes को reap करने और signals को सही तरह से संभालने के लिए entrypoint init process (PID 1) के रूप में `tini` शामिल करती है। यह `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source`, और अन्य सहित OCI base-image annotations प्रकाशित करती है। Node base digest को
    Dependabot Docker base-image PRs के ज़रिए refresh किया जाता है; release builds कोई distro upgrade layer नहीं चलाते।
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md) देखें।
  </Accordion>
</AccordionGroup>

### VPS पर चला रहे हैं?

binary baking, persistence, और updates सहित shared VM deployment steps के लिए
[Hetzner (Docker VPS)](/hi/install/hetzner) और
[Docker VM Runtime](/hi/install/docker-vm-runtime) देखें।

## एजेंट सैंडबॉक्स

जब `agents.defaults.sandbox` Docker backend के साथ enabled हो, तो Gateway
agent tool execution (shell, file read/write, आदि) को isolated Docker
containers के अंदर चलाता है, जबकि Gateway खुद host पर रहता है। इससे आपको पूरे
Gateway को containerize किए बिना untrusted या multi-tenant agent sessions के
चारों ओर एक मज़बूत दीवार मिलती है।

Sandbox scope per-agent (default), per-session, या shared हो सकता है। हर scope
को `/workspace` पर mounted अपना workspace मिलता है। आप allow/deny tool policies,
network isolation, resource limits, और browser containers भी configure कर सकते हैं।

पूरी configuration, images, security notes, और multi-agent profiles के लिए देखें:

- [Sandboxing](/hi/gateway/sandboxing) -- पूरा sandbox संदर्भ
- [OpenShell](/hi/gateway/openshell) -- sandbox containers के लिए interactive shell access
- [Multi-Agent Sandbox and Tools](/hi/tools/multi-agent-sandbox-tools) -- per-agent overrides

### जल्दी enable करें

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

default sandbox image build करें (source checkout से):

```bash
scripts/sandbox-setup.sh
```

source checkout के बिना npm installs के लिए, inline `docker build` commands के लिए [Sandboxing § Images and setup](/hi/gateway/sandboxing#images-and-setup) देखें।

## समस्या निवारण

<AccordionGroup>
  <Accordion title="Image गायब है या sandbox container शुरू नहीं हो रहा">
    sandbox image को
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (source checkout) या [Sandboxing § Images and setup](/hi/gateway/sandboxing#images-and-setup) से inline `docker build` command (npm install) के साथ build करें,
    या `agents.defaults.sandbox.docker.image` को अपनी custom image पर set करें।
    Containers demand पर per session अपने-आप बनाए जाते हैं।
  </Accordion>

  <Accordion title="sandbox में permission errors">
    `docker.user` को ऐसे UID:GID पर set करें जो आपके mounted workspace ownership से match करता हो,
    या workspace folder को chown करें।
  </Accordion>

  <Accordion title="sandbox में custom tools नहीं मिले">
    OpenClaw `sh -lc` (login shell) के साथ commands चलाता है, जो
    `/etc/profile` को source करता है और PATH reset कर सकता है। अपने
    custom tool paths को prepend करने के लिए `docker.env.PATH` set करें, या अपनी Dockerfile में `/etc/profile.d/` के तहत script जोड़ें।
  </Accordion>

  <Accordion title="image build के दौरान OOM-killed (exit 137)">
    VM को कम से कम 2 GB RAM चाहिए। बड़ा machine class उपयोग करें और फिर retry करें।
  </Accordion>

  <Accordion title="Control UI में Unauthorized या pairing required">
    नया dashboard link fetch करें और browser device approve करें:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    और विवरण: [Dashboard](/hi/web/dashboard), [Devices](/hi/cli/devices).

  </Accordion>

  <Accordion title="Gateway target ws://172.x.x.x दिखाता है या Docker CLI से pairing errors आते हैं">
    Gateway mode और bind reset करें:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## संबंधित

- [Install Overview](/hi/install) — सभी installation methods
- [Podman](/hi/install/podman) — Docker का Podman alternative
- [ClawDock](/hi/install/clawdock) — Docker Compose community setup
- [Updating](/hi/install/updating) — OpenClaw को up to date रखना
- [Configuration](/hi/gateway/configuration) — install के बाद Gateway configuration

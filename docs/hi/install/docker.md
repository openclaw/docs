---
read_when:
    - आप local installs के बजाय एक containerized gateway चाहते हैं
    - आप Docker फ़्लो को मान्य कर रहे हैं
summary: OpenClaw के लिए वैकल्पिक Docker-आधारित सेटअप और ऑनबोर्डिंग
title: Docker
x-i18n:
    generated_at: "2026-07-01T12:59:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c5dac26b3e9c31cf563610b2c419872233ad0ac79d28052125a33c0ee6d3b7bc
    source_path: install/docker.md
    workflow: 16
---

Docker **वैकल्पिक** है। इसे केवल तब उपयोग करें जब आपको कंटेनरीकृत Gateway चाहिए या Docker प्रवाह को सत्यापित करना हो।

## क्या Docker मेरे लिए सही है?

- **हाँ**: आपको एक अलग-थलग, अस्थायी Gateway वातावरण चाहिए या स्थानीय इंस्टॉल के बिना किसी होस्ट पर OpenClaw चलाना है।
- **नहीं**: आप अपनी मशीन पर चला रहे हैं और बस सबसे तेज़ डेवलपमेंट लूप चाहते हैं। इसके बजाय सामान्य इंस्टॉल प्रवाह का उपयोग करें।
- **सैंडबॉक्सिंग नोट**: सैंडबॉक्सिंग सक्षम होने पर डिफ़ॉल्ट सैंडबॉक्स बैकएंड Docker का उपयोग करता है, लेकिन सैंडबॉक्सिंग डिफ़ॉल्ट रूप से बंद है और पूरे Gateway को Docker में चलाने की **आवश्यकता नहीं** है। SSH और OpenShell सैंडबॉक्स बैकएंड भी उपलब्ध हैं। देखें [सैंडबॉक्सिंग](/hi/gateway/sandboxing).

## पूर्वापेक्षाएँ

- Docker Desktop (या Docker Engine) + Docker Compose v2
- इमेज बिल्ड के लिए कम से कम 2 GB RAM (`pnpm install` 1 GB होस्ट पर exit 137 के साथ OOM-किल हो सकता है)
- इमेज और लॉग के लिए पर्याप्त डिस्क
- यदि VPS/सार्वजनिक होस्ट पर चला रहे हैं, तो
  [नेटवर्क एक्सपोज़र के लिए सुरक्षा सुदृढ़ीकरण](/hi/gateway/security) की समीक्षा करें,
  विशेष रूप से Docker `DOCKER-USER` फ़ायरवॉल नीति।

## कंटेनरीकृत Gateway

<Steps>
  <Step title="Build the image">
    रेपो रूट से, सेटअप स्क्रिप्ट चलाएँ:

    ```bash
    ./scripts/docker/setup.sh
    ```

    यह Gateway इमेज को स्थानीय रूप से बिल्ड करता है। इसके बजाय पहले से बनी इमेज उपयोग करने के लिए:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    पहले से बनी इमेज पहले
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw) पर प्रकाशित होती हैं।
    GHCR रिलीज़ ऑटोमेशन, पिन किए गए डिप्लॉयमेंट,
    और provenance जाँचों के लिए प्राथमिक रजिस्ट्री है। वही रिलीज़ वर्कफ़्लो उन होस्ट के लिए
    `openclaw/openclaw` पर आधिकारिक Docker Hub मिरर भी प्रकाशित करता है जो Docker Hub पसंद करते हैं:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    `ghcr.io/openclaw/openclaw` या `openclaw/openclaw` का उपयोग करें। कम्युनिटी
    Docker Hub मिरर से बचें क्योंकि OpenClaw उनके रिलीज़ समय,
    रीबिल्ड या रिटेंशन नीति को नियंत्रित नहीं करता। सामान्य आधिकारिक टैग: `main`, `latest`,
    `<version>` (जैसे `2026.2.26`), और beta संस्करण जैसे
    `2026.2.26-beta.1`। Beta टैग `latest` या `main` को नहीं बदलते।

  </Step>

  <Step title="Airgapped rerun">
    ऑफ़लाइन होस्ट पर, पहले इमेज ट्रांसफ़र और लोड करें:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` सत्यापित करता है कि `OPENCLAW_IMAGE` पहले से स्थानीय रूप से मौजूद है, अंतर्निहित Compose pull और build को अक्षम करता है, फिर सामान्य सेटअप प्रवाह चलाता है जैसे
    `.env` सिंक्रोनाइज़ेशन, अनुमति सुधार, ऑनबोर्डिंग, Gateway कॉन्फ़िग सिंक,
    और Compose स्टार्टअप।

    यदि `OPENCLAW_SANDBOX=1` है, तो ऑफ़लाइन सेटअप
    `OPENCLAW_DOCKER_SOCKET` के पीछे daemon पर कॉन्फ़िगर की गई डिफ़ॉल्ट
    और सक्रिय प्रति-agent सैंडबॉक्स इमेज भी जाँचता है। Docker-समर्थित ब्राउज़र इमेज में
    वर्तमान OpenClaw ब्राउज़र कॉन्ट्रैक्ट लेबल भी होना चाहिए। जब आवश्यक इमेज गुम या
    असंगत हो, तो सेटअप अनुपयोगी सैंडबॉक्स के साथ सफलता रिपोर्ट करने के बजाय
    सैंडबॉक्स कॉन्फ़िगरेशन बदले बिना बाहर निकलता है।

  </Step>

  <Step title="Complete onboarding">
    सेटअप स्क्रिप्ट ऑनबोर्डिंग अपने आप चलाती है। यह:

    - provider API keys के लिए संकेत देगी
    - Gateway token जनरेट करके उसे `.env` में लिखेगी
    - auth-profile secret key डायरेक्टरी बनाएगी
    - Docker Compose के माध्यम से Gateway शुरू करेगी

    सेटअप के दौरान, प्री-स्टार्ट ऑनबोर्डिंग और कॉन्फ़िग लिखना
    सीधे `openclaw-gateway` के माध्यम से चलता है। `openclaw-cli` उन कमांड के लिए है जिन्हें आप
    Gateway कंटेनर पहले से मौजूद होने के बाद चलाते हैं।

  </Step>

  <Step title="Open the Control UI">
    अपने ब्राउज़र में `http://127.0.0.1:18789/` खोलें और कॉन्फ़िगर किया गया
    साझा secret Settings में पेस्ट करें। सेटअप स्क्रिप्ट डिफ़ॉल्ट रूप से `.env` में token लिखती है;
    यदि आप कंटेनर कॉन्फ़िग को password auth पर स्विच करते हैं, तो उसके बजाय वह
    password उपयोग करें।

    URL फिर से चाहिए?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configure channels (optional)">
    messaging channels जोड़ने के लिए CLI कंटेनर का उपयोग करें:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    दस्तावेज़: [WhatsApp](/hi/channels/whatsapp), [Telegram](/hi/channels/telegram), [Discord](/hi/channels/discord)

  </Step>
</Steps>

### मैनुअल प्रवाह

यदि आप सेटअप स्क्रिप्ट उपयोग करने के बजाय प्रत्येक चरण स्वयं चलाना पसंद करते हैं:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
रेपो रूट से `docker compose` चलाएँ। यदि आपने `OPENCLAW_EXTRA_MOUNTS`
या `OPENCLAW_HOME_VOLUME` सक्षम किया है, तो सेटअप स्क्रिप्ट `docker-compose.extra.yml` लिखती है;
किसी भी मानक override फ़ाइल के बाद इसे शामिल करें, उदाहरण के लिए
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`
जब दोनों override फ़ाइलें मौजूद हों।
</Note>

<Note>
क्योंकि `openclaw-cli`, `openclaw-gateway` के नेटवर्क namespace को साझा करता है, यह
पोस्ट-स्टार्ट टूल है। `docker compose up -d openclaw-gateway` से पहले, ऑनबोर्डिंग
और सेटअप-समय कॉन्फ़िग लिखना `openclaw-gateway` के माध्यम से
`--no-deps --entrypoint node` के साथ चलाएँ।
</Note>

### Environment variables

सेटअप स्क्रिप्ट ये वैकल्पिक environment variables स्वीकार करती है:

| Variable                                        | उद्देश्य                                                               |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | स्थानीय रूप से बिल्ड करने के बजाय रिमोट इमेज उपयोग करें                        |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | बिल्ड के दौरान अतिरिक्त apt packages इंस्टॉल करें (स्पेस से अलग किए हुए)             |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | बिल्ड के दौरान अतिरिक्त Python packages इंस्टॉल करें (स्पेस से अलग किए हुए)          |
| `OPENCLAW_EXTENSIONS`                           | बिल्ड समय पर Plugin dependencies पहले से इंस्टॉल करें (स्पेस से अलग नाम) |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | स्थानीय source-build Node options को override करें                          |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | स्थानीय source-build tsdown heap को MB में override करें                     |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | केवल-runtime स्थानीय इमेज बिल्ड के दौरान declaration output छोड़ें        |
| `OPENCLAW_EXTRA_MOUNTS`                         | अतिरिक्त host bind mounts (कॉमा से अलग `source:target[:opts]`)       |
| `OPENCLAW_HOME_VOLUME`                          | नामित Docker volume में `/home/node` persist करें                         |
| `OPENCLAW_SANDBOX`                              | sandbox bootstrap के लिए opt in करें (`1`, `true`, `yes`, `on`)                |
| `OPENCLAW_SKIP_ONBOARDING`                      | interactive onboarding चरण छोड़ें (`1`, `true`, `yes`, `on`)       |
| `OPENCLAW_DOCKER_SOCKET`                        | Docker socket path override करें                                           |
| `OPENCLAW_DISABLE_BONJOUR`                      | Bonjour/mDNS advertising अक्षम करें (Docker के लिए डिफ़ॉल्ट `1`)         |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | bundled Plugin source bind-mount overlays अक्षम करें                     |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | OpenTelemetry export के लिए साझा OTLP/HTTP collector endpoint          |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | traces, metrics, या logs के लिए signal-specific OTLP endpoints           |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | OTLP protocol override. आज केवल `http/protobuf` समर्थित है       |
| `OTEL_SERVICE_NAME`                             | OpenTelemetry resources के लिए उपयोग किया गया service name                         |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | latest experimental GenAI semantic attributes के लिए opt in करें               |
| `OPENCLAW_OTEL_PRELOADED`                       | जब कोई पहले से preloaded हो तो दूसरा OpenTelemetry SDK शुरू करना छोड़ें        |

आधिकारिक Docker इमेज Homebrew के साथ नहीं आती। ऑनबोर्डिंग के दौरान, OpenClaw
Linux कंटेनर में `brew` के बिना चलने पर brew-only skill dependency installers छिपाता है;
वे dependencies custom image द्वारा उपलब्ध कराई जानी चाहिए या मैन्युअल रूप से इंस्टॉल की जानी चाहिए।
Debian packages से उपलब्ध dependencies के लिए, image build के दौरान
`OPENCLAW_IMAGE_APT_PACKAGES` का उपयोग करें। legacy
`OPENCLAW_DOCKER_APT_PACKAGES` नाम अब भी स्वीकार किया जाता है।
Python dependencies के लिए, `OPENCLAW_IMAGE_PIP_PACKAGES` का उपयोग करें। यह image build के दौरान
`python3 -m pip install --break-system-packages` चलाता है, इसलिए package versions pin करें
और केवल उन package indexes का उपयोग करें जिन पर आपको भरोसा है।
Source builds `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS` को डिफ़ॉल्ट रूप से
`--max-old-space-size=8192` पर सेट करते हैं और
`OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` unset छोड़ते हैं ताकि tsdown wrapper
container memory limits का सम्मान कर सके। वे
`OPENCLAW_DOCKER_BUILD_SKIP_DTS=1` भी डिफ़ॉल्ट करते हैं क्योंकि runtime images build के बाद declaration
files prune कर देती हैं। यदि Docker `ResourceExhausted`, `cannot allocate
memory` रिपोर्ट करता है, या `tsdown` के दौरान abort होता है, तो Docker builder memory limit बढ़ाएँ या
छोटे explicit heaps के साथ फिर प्रयास करें, उदाहरण के लिए
`OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096`.

Maintainers packaged image के विरुद्ध bundled Plugin source का परीक्षण कर सकते हैं
एक Plugin source directory को उसके packaged source path पर mount करके, उदाहरण के लिए
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
वह mounted source directory उसी Plugin id के लिए matching compiled
`/app/dist/extensions/synology-chat` bundle को override करती है।

### Observability

OpenTelemetry export Gateway कंटेनर से आपके OTLP
collector की ओर outbound है। इसके लिए प्रकाशित Docker port की आवश्यकता नहीं है। यदि आप image
स्थानीय रूप से build करते हैं और bundled OpenTelemetry exporter को image के अंदर उपलब्ध रखना चाहते हैं,
तो इसकी runtime dependencies शामिल करें:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

packaged Docker installs में export सक्षम करने से पहले ClawHub से आधिकारिक
`@openclaw/diagnostics-otel` Plugin इंस्टॉल करें। Custom source-built images अब भी
local Plugin source को
`OPENCLAW_EXTENSIONS=diagnostics-otel` के साथ शामिल कर सकती हैं। export सक्षम करने के लिए,
config में `diagnostics-otel` Plugin को allow और enable करें, फिर
`diagnostics.otel.enabled=true` सेट करें या [OpenTelemetry
export](/hi/gateway/opentelemetry) में config example उपयोग करें। Collector auth headers
`diagnostics.otel.headers` के माध्यम से कॉन्फ़िगर होते हैं, Docker environment variables के माध्यम से नहीं।

Prometheus metrics पहले से प्रकाशित Gateway port का उपयोग करते हैं। इंस्टॉल करें
`clawhub:@openclaw/diagnostics-prometheus`, `diagnostics-prometheus`
Plugin सक्षम करें, फिर scrape करें:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

यह route Gateway authentication द्वारा सुरक्षित है। अलग public
`/metrics` port या unauthenticated reverse-proxy path expose न करें। देखें
[Prometheus metrics](/hi/gateway/prometheus).

### Health checks

Container probe endpoints (auth आवश्यक नहीं):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker इमेज में एक अंतर्निहित `HEALTHCHECK` शामिल है, जो `/healthz` को पिंग करता है।
यदि जांचें लगातार विफल होती रहती हैं, तो Docker कंटेनर को `unhealthy` के रूप में चिह्नित करता है और
ऑर्केस्ट्रेशन सिस्टम उसे पुनः आरंभ या बदल सकते हैं।

प्रमाणित गहन स्वास्थ्य स्नैपशॉट:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN बनाम loopback

`scripts/docker/setup.sh` डिफ़ॉल्ट रूप से `OPENCLAW_GATEWAY_BIND=lan` सेट करता है, ताकि
`http://127.0.0.1:18789` तक होस्ट पहुंच Docker पोर्ट पब्लिशिंग के साथ काम करे।

- `lan` (डिफ़ॉल्ट): होस्ट ब्राउज़र और होस्ट CLI प्रकाशित gateway पोर्ट तक पहुंच सकते हैं।
- `loopback`: केवल कंटेनर नेटवर्क नेमस्पेस के अंदर की प्रक्रियाएं ही
  gateway तक सीधे पहुंच सकती हैं।

<Note>
`gateway.bind` में बाइंड मोड मान (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) उपयोग करें, `0.0.0.0` या `127.0.0.1` जैसे होस्ट उपनाम नहीं।
</Note>

### होस्ट स्थानीय प्रदाता

जब OpenClaw Docker में चलता है, तो कंटेनर के अंदर `127.0.0.1` कंटेनर
स्वयं होता है, आपकी होस्ट मशीन नहीं। होस्ट पर चलने वाले AI प्रदाताओं के लिए
`host.docker.internal` उपयोग करें:

| प्रदाता  | होस्ट डिफ़ॉल्ट URL         | Docker सेटअप URL                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

बंडल किया गया Docker सेटअप LM Studio और Ollama ऑनबोर्डिंग डिफ़ॉल्ट के रूप में
उन होस्ट URL का उपयोग करता है, और `docker-compose.yml` Linux Docker Engine के लिए
`host.docker.internal` को Docker के होस्ट gateway पर मैप करता है। Docker Desktop macOS और Windows पर
पहले से वही होस्टनाम उपलब्ध कराता है।

होस्ट सेवाओं को Docker से पहुंच योग्य पते पर भी सुनना चाहिए:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

यदि आप अपनी Compose फ़ाइल या `docker run` कमांड उपयोग करते हैं, तो वही होस्ट
मैपिंग स्वयं जोड़ें, उदाहरण के लिए
`--add-host=host.docker.internal:host-gateway`।

### Docker में Claude CLI बैकएंड

आधिकारिक OpenClaw Docker इमेज Claude Code को पहले से इंस्टॉल नहीं करती। Claude Code को
उस कंटेनर उपयोगकर्ता के अंदर इंस्टॉल करें और लॉग इन करें जो OpenClaw चलाता है, फिर
उस कंटेनर होम को स्थायी रखें ताकि इमेज अपग्रेड बाइनरी या Claude प्रमाणीकरण
स्थिति को मिटा न दें।

नए Docker इंस्टॉल के लिए, सेटअप चलाने से पहले स्थायी `/home/node` वॉल्यूम सक्षम करें:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

मौजूदा Docker इंस्टॉल के लिए, पहले स्टैक रोकें और सेटअप फिर से चलाने से पहले वर्तमान
Docker `.env` मान दोबारा लोड करें। सेटअप स्क्रिप्ट अपने आप
`.env` नहीं पढ़ती; वह वर्तमान शेल और डिफ़ॉल्ट से `.env` फिर से लिखती है।
जनरेट की गई `.env` के लिए, चलाएं:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

यदि आपकी `.env` में ऐसे मान हैं जिन्हें आपका शेल सोर्स नहीं कर सकता, तो जिन
मौजूदा मानों पर आप निर्भर हैं उन्हें पहले मैन्युअल रूप से फिर से एक्सपोर्ट करें, जैसे `OPENCLAW_IMAGE`, पोर्ट, बाइंड मोड,
कस्टम पथ, `OPENCLAW_EXTRA_MOUNTS`, सैंडबॉक्स, और skip-onboarding सेटिंग्स।
जनरेट किया गया ओवरले `openclaw-gateway` और
`openclaw-cli` दोनों के लिए होम वॉल्यूम माउंट करता है।

बाकी कमांड जनरेट किए गए Compose ओवरले के साथ चलाएं ताकि दोनों सेवाएं
स्थायी होम माउंट करें। यदि आपका सेटअप `docker-compose.override.yml` भी उपयोग करता है,
तो उसे `docker-compose.extra.yml` से पहले शामिल करें।

उस स्थायी होम में Claude Code इंस्टॉल करें:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

नेटिव इंस्टॉलर `claude` बाइनरी को
`/home/node/.local/bin/claude` के अंतर्गत लिखता है। OpenClaw को वह कंटेनर पथ उपयोग करने के लिए बताएं:

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

उसके बाद, आप बंडल किया गया `claude-cli` बैकएंड उपयोग कर सकते हैं:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` नेटिव Claude Code इंस्टॉल को
`/home/node/.local/bin` और `/home/node/.local/share/claude` के अंतर्गत, साथ ही Claude Code
सेटिंग्स और प्रमाणीकरण स्थिति को `/home/node/.claude` और `/home/node/.claude.json` के अंतर्गत बनाए रखता है।
केवल `/home/node/.openclaw` को स्थायी रखना Claude CLI पुनः उपयोग के लिए पर्याप्त नहीं है। यदि
आप होम वॉल्यूम के बजाय `OPENCLAW_EXTRA_MOUNTS` उपयोग करते हैं, तो उन सभी
Claude पथों को दोनों Docker सेवाओं में माउंट करें।

<Note>
साझा उत्पादन ऑटोमेशन या अनुमानित Anthropic बिलिंग के लिए,
Anthropic API-key पथ को प्राथमिकता दें। Claude CLI पुनः उपयोग Claude Code के इंस्टॉल किए गए
संस्करण, खाते के लॉगिन, बिलिंग, और अपडेट व्यवहार का अनुसरण करता है।
</Note>

### Bonjour / mDNS

Docker ब्रिज नेटवर्किंग आम तौर पर Bonjour/mDNS मल्टीकास्ट
(`224.0.0.251:5353`) को भरोसेमंद ढंग से फ़ॉरवर्ड नहीं करती। इसलिए बंडल किया गया Compose सेटअप डिफ़ॉल्ट रूप से
`OPENCLAW_DISABLE_BONJOUR=1` सेट करता है ताकि ब्रिज द्वारा मल्टीकास्ट ट्रैफ़िक छोड़ने पर Gateway क्रैश-लूप न करे या विज्ञापन को बार-बार
पुनः आरंभ न करे।

Docker होस्ट के लिए प्रकाशित Gateway URL, Tailscale, या wide-area DNS-SD उपयोग करें।
`OPENCLAW_DISABLE_BONJOUR=0` केवल तब सेट करें जब host networking, macvlan,
या किसी ऐसे नेटवर्क के साथ चला रहे हों जहां mDNS मल्टीकास्ट का काम करना ज्ञात हो।

सावधानियों और समस्या निवारण के लिए, [Bonjour discovery](/hi/gateway/bonjour) देखें।

### स्टोरेज और स्थायित्व

Docker Compose `OPENCLAW_CONFIG_DIR` को `/home/node/.openclaw`,
`OPENCLAW_WORKSPACE_DIR` को `/home/node/.openclaw/workspace`, और
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` को `/home/node/.config/openclaw` पर बाइंड-माउंट करता है, इसलिए वे
पथ कंटेनर बदलने के बाद भी बने रहते हैं। जब कोई भी वैरिएबल सेट न हो, तो बंडल किया गया
`docker-compose.yml` `${HOME}` के अंतर्गत फ़ॉलबैक करता है, या जब `HOME` स्वयं भी
मौजूद न हो तो `/tmp` पर। इससे खाली वातावरणों पर `docker compose up` खाली-स्रोत
वॉल्यूम स्पेक उत्सर्जित नहीं करता।

वह माउंट की गई कॉन्फ़िग डायरेक्टरी वह जगह है जहां OpenClaw रखता है:

- व्यवहार कॉन्फ़िग के लिए `openclaw.json`
- संग्रहीत प्रदाता OAuth/API-key प्रमाणीकरण के लिए `agents/<agentId>/agent/auth-profiles.json`
- `OPENCLAW_GATEWAY_TOKEN` जैसे env-backed रनटाइम सीक्रेट्स के लिए `.env`

auth-profile सीक्रेट कुंजी डायरेक्टरी OAuth-backed auth profile token सामग्री के लिए उपयोग की जाने वाली
स्थानीय एन्क्रिप्शन कुंजी संग्रहीत करती है। इसे अपने Docker होस्ट स्टेट के साथ रखें,
लेकिन `OPENCLAW_CONFIG_DIR` से अलग रखें।

इंस्टॉल किए गए डाउनलोड योग्य plugins अपनी पैकेज स्थिति को माउंट किए गए
OpenClaw होम के अंतर्गत संग्रहीत करते हैं, इसलिए plugin इंस्टॉल रिकॉर्ड और पैकेज रूट कंटेनर
बदलने के बाद भी बने रहते हैं। Gateway स्टार्टअप बंडल किए गए-plugin निर्भरता ट्री जनरेट नहीं करता।

VM डिप्लॉयमेंट पर पूर्ण स्थायित्व विवरण के लिए, देखें
[Docker VM Runtime - What persists where](/hi/install/docker-vm-runtime#what-persists-where).

**डिस्क वृद्धि हॉटस्पॉट:** `/tmp/openclaw/` के अंतर्गत `media/`, सत्र JSONL फ़ाइलें, साझा
SQLite स्टेट डेटाबेस, इंस्टॉल किए गए plugin पैकेज रूट, और रोलिंग फ़ाइल लॉग पर नज़र रखें।

### शेल हेल्पर (वैकल्पिक)

दिन-प्रतिदिन के Docker प्रबंधन को आसान बनाने के लिए, `ClawDock` इंस्टॉल करें:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

यदि आपने ClawDock को पुराने `scripts/shell-helpers/clawdock-helpers.sh` raw पथ से इंस्टॉल किया था, तो ऊपर दिया गया इंस्टॉल कमांड फिर से चलाएं ताकि आपकी स्थानीय हेल्पर फ़ाइल नए स्थान को ट्रैक करे।

फिर `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, आदि उपयोग करें। सभी कमांड के लिए
`clawdock-help` चलाएं।
पूर्ण हेल्पर गाइड के लिए [ClawDock](/hi/install/clawdock) देखें।

<AccordionGroup>
  <Accordion title="Docker gateway के लिए एजेंट सैंडबॉक्स सक्षम करें">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    कस्टम सॉकेट पथ (उदा. rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    स्क्रिप्ट `docker.sock` को केवल sandbox पूर्वापेक्षाएं पास होने के बाद माउंट करती है। यदि
    sandbox सेटअप पूरा नहीं हो पाता, तो स्क्रिप्ट `agents.defaults.sandbox.mode`
    को `off` पर रीसेट कर देती है। OpenClaw sandbox सक्रिय रहते हुए Codex code-mode turns अब भी Codex
    `workspace-write` तक सीमित रहते हैं; होस्ट Docker सॉकेट को
    एजेंट sandbox कंटेनरों में माउंट न करें।

  </Accordion>

  <Accordion title="ऑटोमेशन / CI (गैर-इंटरैक्टिव)">
    `-T` के साथ Compose pseudo-TTY आवंटन अक्षम करें:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="साझा-नेटवर्क सुरक्षा नोट">
    `openclaw-cli` `network_mode: "service:openclaw-gateway"` उपयोग करता है ताकि CLI
    कमांड `127.0.0.1` पर gateway तक पहुंच सकें। इसे साझा
    भरोसा सीमा मानें। compose कॉन्फ़िग `openclaw-gateway` और `openclaw-cli` दोनों पर
    `NET_RAW`/`NET_ADMIN` हटाता है और
    `no-new-privileges` सक्षम करता है।
  </Accordion>

  <Accordion title="openclaw-cli में Docker Desktop DNS विफलताएं">
    कुछ Docker Desktop सेटअप `NET_RAW` हटाए जाने के बाद साझा-नेटवर्क
    `openclaw-cli` sidecar से DNS लुकअप में विफल होते हैं, जो
    `openclaw plugins install` जैसे npm-backed कमांड के दौरान `EAI_AGAIN` के रूप में दिखता है।
    सामान्य gateway संचालन के लिए डिफ़ॉल्ट hardened compose फ़ाइल बनाए रखें। नीचे दिया गया
    स्थानीय override Docker की डिफ़ॉल्ट क्षमताएं बहाल करके CLI कंटेनर की सुरक्षा स्थिति को
    ढीला करता है, इसलिए इसे केवल उस एकबारगी CLI
    कमांड के लिए उपयोग करें जिसे पैकेज रजिस्ट्री पहुंच चाहिए, अपनी डिफ़ॉल्ट Compose
    invocation के रूप में नहीं:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    यदि आपने पहले से लंबे समय तक चलने वाला `openclaw-cli` कंटेनर बनाया है, तो उसे
    उसी override के साथ फिर से बनाएं। `docker compose exec` और `docker exec` पहले से बने
    कंटेनर पर Linux capabilities नहीं बदल सकते।

  </Accordion>

  <Accordion title="अनुमतियां और EACCES">
    इमेज `node` (uid 1000) के रूप में चलती है। यदि आपको
    `/home/node/.openclaw` पर अनुमति त्रुटियां दिखें, तो सुनिश्चित करें कि आपके होस्ट bind mounts uid 1000 के स्वामित्व में हैं:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    वही mismatch plugin चेतावनी के रूप में भी दिख सकता है, जैसे
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    जिसके बाद `plugin present but blocked` आता है। इसका अर्थ है कि प्रक्रिया uid और
    माउंट की गई plugin डायरेक्टरी के मालिक में असहमति है। कंटेनर को
    डिफ़ॉल्ट uid 1000 के रूप में चलाने और bind mount ownership ठीक करने को प्राथमिकता दें। केवल
    `/path/to/openclaw-config/npm` को `root:root` पर chown करें यदि आप जानबूझकर
    OpenClaw को लंबे समय तक root के रूप में चलाते हैं।

  </Accordion>

  <Accordion title="तेज़ rebuilds">
    अपनी Dockerfile को इस तरह व्यवस्थित करें कि dependency layers कैश हों। इससे lockfiles बदलने तक
    `pnpm install` को फिर से चलाने से बचा जा सकता है:

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

  <Accordion title="पावर-यूज़र कंटेनर विकल्प">
    डिफ़ॉल्ट इमेज सुरक्षा-प्रथम है और गैर-root `node` के रूप में चलती है। अधिक
    सुविधापूर्ण कंटेनर के लिए:

    1. **`/home/node` को स्थायी रखें**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **सिस्टम निर्भरताएं इमेज में शामिल करें**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Python निर्भरताएं इमेज में शामिल करें**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Playwright Chromium इमेज में शामिल करें**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **या Playwright ब्राउज़र को स्थायी वॉल्यूम में इंस्टॉल करें**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **ब्राउज़र डाउनलोड स्थायी रखें**: `OPENCLAW_HOME_VOLUME` या
       `OPENCLAW_EXTRA_MOUNTS` का उपयोग करें। OpenClaw Linux पर Docker इमेज के
       Playwright-प्रबंधित Chromium का अपने-आप पता लगा लेता है।

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (हेडलेस Docker)">
    यदि आप विज़ार्ड में OpenAI Codex OAuth चुनते हैं, तो यह एक ब्राउज़र URL खोलता है। Docker
    या हेडलेस सेटअप में, जिस पूरे रीडायरेक्ट URL पर आप पहुंचते हैं उसे कॉपी करें और
    प्रमाणीकरण पूरा करने के लिए उसे वापस विज़ार्ड में पेस्ट करें।
  </Accordion>

  <Accordion title="बेस इमेज मेटाडेटा">
    मुख्य Docker रनटाइम इमेज `node:24-bookworm-slim` का उपयोग करती है और लंबे समय तक चलने वाले कंटेनरों में zombie प्रक्रियाओं को reap करने और signals को सही ढंग से हैंडल करने के लिए entrypoint init process (PID 1) के रूप में `tini` शामिल करती है। यह `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source`, और अन्य सहित OCI बेस-इमेज annotations प्रकाशित करती है। Node बेस digest
    Dependabot Docker बेस-इमेज PRs के माध्यम से
    refreshed किया जाता है; रिलीज़ builds distro upgrade layer नहीं चलाते।
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md) देखें।
  </Accordion>
</AccordionGroup>

### VPS पर चला रहे हैं?

binary baking, persistence, और updates सहित साझा VM deployment steps के लिए
[Hetzner (Docker VPS)](/hi/install/hetzner) और
[Docker VM Runtime](/hi/install/docker-vm-runtime) देखें।

## एजेंट सैंडबॉक्स

जब `agents.defaults.sandbox` Docker बैकएंड के साथ सक्षम होता है, तो Gateway
एजेंट टूल निष्पादन (shell, file read/write, आदि) को पृथक Docker
कंटेनरों के अंदर चलाता है, जबकि Gateway स्वयं host पर रहता है। इससे आपको पूरे
Gateway को containerize किए बिना अविश्वसनीय या multi-tenant एजेंट sessions के
चारों ओर मजबूत अलगाव मिलता है।

Sandbox scope प्रति-एजेंट (डिफ़ॉल्ट), प्रति-session, या shared हो सकता है। हर scope को
`/workspace` पर mounted अपना workspace मिलता है। आप
allow/deny tool policies, network isolation, resource limits, और browser
containers भी configure कर सकते हैं।

पूर्ण configuration, images, security notes, और multi-agent profiles के लिए, देखें:

- [सैंडबॉक्सिंग](/hi/gateway/sandboxing) -- पूरा sandbox reference
- [OpenShell](/hi/gateway/openshell) -- sandbox containers तक interactive shell access
- [मल्टी-एजेंट सैंडबॉक्स और टूल्स](/hi/tools/multi-agent-sandbox-tools) -- प्रति-एजेंट overrides

### तुरंत सक्षम करें

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

डिफ़ॉल्ट सैंडबॉक्स इमेज बनाएँ (सोर्स चेकआउट से):

```bash
scripts/sandbox-setup.sh
```

सोर्स चेकआउट के बिना npm इंस्टॉल के लिए, इनलाइन `docker build` कमांड के लिए [सैंडबॉक्सिंग § इमेज और सेटअप](/hi/gateway/sandboxing#images-and-setup) देखें।

## समस्या निवारण

<AccordionGroup>
  <Accordion title="इमेज गायब है या सैंडबॉक्स कंटेनर शुरू नहीं हो रहा">
    सैंडबॉक्स इमेज
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (सोर्स चेकआउट) या [सैंडबॉक्सिंग § इमेज और सेटअप](/hi/gateway/sandboxing#images-and-setup) (npm इंस्टॉल) से इनलाइन `docker build` कमांड के साथ बनाएँ,
    या `agents.defaults.sandbox.docker.image` को अपनी कस्टम इमेज पर सेट करें।
    कंटेनर मांग पर प्रति सत्र अपने-आप बनाए जाते हैं।
  </Accordion>

  <Accordion title="सैंडबॉक्स में अनुमति त्रुटियाँ">
    `docker.user` को ऐसे UID:GID पर सेट करें जो आपके माउंट किए गए वर्कस्पेस के स्वामित्व से मेल खाता हो,
    या वर्कस्पेस फ़ोल्डर पर chown करें।
  </Accordion>

  <Accordion title="कस्टम टूल सैंडबॉक्स में नहीं मिले">
    OpenClaw `sh -lc` (लॉगिन शेल) के साथ कमांड चलाता है, जो
    `/etc/profile` को सोर्स करता है और PATH को रीसेट कर सकता है। अपने
    कस्टम टूल पाथ पहले जोड़ने के लिए `docker.env.PATH` सेट करें, या अपनी Dockerfile में `/etc/profile.d/` के अंतर्गत एक स्क्रिप्ट जोड़ें।
  </Accordion>

  <Accordion title="इमेज बिल्ड के दौरान OOM-killed (exit 137)">
    VM को कम से कम 2 GB RAM चाहिए। बड़ी मशीन क्लास का उपयोग करें और फिर से प्रयास करें।
  </Accordion>

  <Accordion title="Control UI में अनधिकृत या पेयरिंग आवश्यक">
    नया डैशबोर्ड लिंक प्राप्त करें और ब्राउज़र डिवाइस को स्वीकृत करें:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    अधिक विवरण: [डैशबोर्ड](/hi/web/dashboard), [डिवाइस](/hi/cli/devices).

  </Accordion>

  <Accordion title="Gateway लक्ष्य ws://172.x.x.x दिखाता है या Docker CLI से पेयरिंग त्रुटियाँ आती हैं">
    Gateway मोड और बाइंड रीसेट करें:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## संबंधित

- [इंस्टॉल अवलोकन](/hi/install) — सभी इंस्टॉलेशन विधियाँ
- [Podman](/hi/install/podman) — Docker का Podman विकल्प
- [ClawDock](/hi/install/clawdock) — Docker Compose समुदाय सेटअप
- [अपडेट करना](/hi/install/updating) — OpenClaw को अद्यतित रखना
- [कॉन्फ़िगरेशन](/hi/gateway/configuration) — इंस्टॉल के बाद gateway कॉन्फ़िगरेशन

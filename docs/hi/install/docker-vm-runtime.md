---
read_when:
    - आप Docker के साथ क्लाउड VM पर OpenClaw तैनात कर रहे हैं
    - आपको साझा बाइनरी बेक, persistence, और अपडेट flow की ज़रूरत है
summary: लंबे समय तक चलने वाले OpenClaw Gateway होस्ट के लिए साझा Docker VM रनटाइम चरण
title: Docker VM रनटाइम
x-i18n:
    generated_at: "2026-06-28T23:19:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6a01c20ac6b85a32167fd1d897368ee0ebc6997cbc95a25f831ea7dd2e623c9
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

GCP, Hetzner और समान VPS प्रदाताओं जैसे VM-आधारित Docker इंस्टॉलेशन के लिए साझा runtime चरण।

## आवश्यक बाइनरीज़ को इमेज में बेक करें

चलते हुए कंटेनर के अंदर बाइनरीज़ इंस्टॉल करना एक जाल है।
runtime पर इंस्टॉल की गई कोई भी चीज़ restart पर खो जाएगी।

Skills के लिए आवश्यक सभी बाहरी बाइनरीज़ इमेज build time पर इंस्टॉल होनी चाहिए।

नीचे दिए गए उदाहरण केवल तीन सामान्य बाइनरीज़ दिखाते हैं:

- Gmail access के लिए `gog` (`gogcli` से)
- Google Places के लिए `goplaces`
- WhatsApp के लिए `wacli`

ये उदाहरण हैं, पूरी सूची नहीं।
आप इसी पैटर्न का उपयोग करके जितनी ज़रूरत हो उतनी बाइनरीज़ इंस्टॉल कर सकते हैं।

यदि आप बाद में नई Skills जोड़ते हैं जो अतिरिक्त बाइनरीज़ पर निर्भर करती हैं, तो आपको:

1. Dockerfile अपडेट करना होगा
2. इमेज फिर से बनानी होगी
3. कंटेनरों को restart करना होगा

**उदाहरण Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Example binary 1: Gmail CLI (gogcli — installs as `gog`)
# Copy the current Linux asset URL from https://github.com/steipete/gogcli/releases
RUN curl -L https://github.com/steipete/gogcli/releases/latest/download/gogcli_linux_amd64.tar.gz \
  | tar -xzO gog > /usr/local/bin/gog; \
  chmod +x /usr/local/bin/gog

# Example binary 2: Google Places CLI
# Copy the current Linux asset URL from https://github.com/steipete/goplaces/releases
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_linux_amd64.tar.gz \
  | tar -xzO goplaces > /usr/local/bin/goplaces; \
  chmod +x /usr/local/bin/goplaces

# Example binary 3: WhatsApp CLI
# Copy the current Linux asset URL from https://github.com/steipete/wacli/releases
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli-linux-amd64.tar.gz \
  | tar -xzO wacli > /usr/local/bin/wacli; \
  chmod +x /usr/local/bin/wacli

# Add more binaries below using the same pattern

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

<Note>
ऊपर दिए गए URL उदाहरण हैं। ARM-आधारित VM के लिए, `arm64` assets चुनें। पुनरुत्पादनीय builds के लिए, versioned release URL pin करें।
</Note>

## Build और launch

```bash
docker compose build
docker compose up -d openclaw-gateway
```

यदि `pnpm install --frozen-lockfile` के दौरान build `Killed` या `exit code 137` के साथ विफल होता है, तो VM में memory कम है।
फिर से कोशिश करने से पहले बड़ी machine class का उपयोग करें।

बाइनरीज़ सत्यापित करें:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

अपेक्षित output:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Gateway सत्यापित करें:

```bash
docker compose logs -f openclaw-gateway
```

अपेक्षित output:

```
[gateway] listening on ws://0.0.0.0:18789
```

## क्या कहाँ persist होता है

OpenClaw Docker में चलता है, लेकिन Docker सत्य का स्रोत नहीं है।
सभी long-lived state को restarts, rebuilds और reboots के बाद भी बने रहना चाहिए।

| घटक                | स्थान                                                   | persistence mechanism   | नोट्स                                                        |
| ------------------- | ------------------------------------------------------ | ---------------------- | ------------------------------------------------------------- |
| Gateway config      | `/home/node/.openclaw/`                                | होस्ट volume mount     | `openclaw.json`, `.env` शामिल हैं                            |
| Model auth profiles | `/home/node/.openclaw/agents/`                         | होस्ट volume mount     | `agents/<agentId>/agent/auth-profiles.json` (OAuth, API keys) |
| Auth profile key    | `/home/node/.config/openclaw/`                         | होस्ट volume mount     | OAuth auth profile token material के लिए स्थानीय encryption key |
| Skill configs       | `/home/node/.openclaw/skills/`                         | होस्ट volume mount     | Skill-level state                                             |
| Agent workspace     | `/home/node/.openclaw/workspace/`                      | होस्ट volume mount     | code और agent artifacts                                      |
| WhatsApp session    | `/home/node/.openclaw/`                                | होस्ट volume mount     | QR login को सुरक्षित रखता है                                 |
| Gmail keyring       | `/home/node/.openclaw/`                                | होस्ट volume + password | `GOG_KEYRING_PASSWORD` आवश्यक है                              |
| Plugin packages     | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | होस्ट volume mount     | downloadable Plugin package roots                             |
| External binaries   | `/usr/local/bin/`                                      | Docker image           | build time पर बेक करना आवश्यक है                             |
| Node runtime        | कंटेनर filesystem                                      | Docker image           | हर image build पर फिर से बनता है                             |
| OS packages         | कंटेनर filesystem                                      | Docker image           | runtime पर इंस्टॉल न करें                                    |
| Docker container    | अस्थायी                                               | restartable            | नष्ट करना सुरक्षित है                                         |

## Updates

VM पर OpenClaw अपडेट करने के लिए:

```bash
git pull
docker compose build
docker compose up -d
```

## संबंधित

- [Docker](/hi/install/docker)
- [Podman](/hi/install/podman)
- [ClawDock](/hi/install/clawdock)

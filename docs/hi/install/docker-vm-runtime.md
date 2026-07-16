---
read_when:
    - आप Docker के साथ क्लाउड VM पर OpenClaw परिनियोजित कर रहे हैं
    - आपको साझा बाइनरी निर्माण, स्थायित्व और अपडेट प्रवाह की आवश्यकता है
summary: दीर्घकालिक OpenClaw Gateway होस्ट के लिए साझा Docker VM रनटाइम चरण
title: Docker VM रनटाइम
x-i18n:
    generated_at: "2026-07-16T15:25:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d1c474b1f826077ac03c7aaa1e334ed2f38d2de2770f32f2cc907846ecc8bb19
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

GCP, Hetzner और समान VPS प्रदाताओं जैसे VM-आधारित Docker इंस्टॉलेशन के लिए साझा रनटाइम चरण।

## आवश्यक बाइनरी को इमेज में शामिल करें

चल रहे कंटेनर के भीतर बाइनरी इंस्टॉल करना एक जाल है: रनटाइम पर इंस्टॉल की गई हर चीज़
पुनः आरंभ होने पर खो जाती है। किसी skill को जिन बाहरी बाइनरी की आवश्यकता है, उन सभी को
बिल्ड के समय इमेज में शामिल करें।

नीचे दिए गए उदाहरण वर्णानुक्रम में केवल तीन बाइनरी शामिल करते हैं:

- `gog` (जो `gogcli` से है) Gmail एक्सेस के लिए
- `goplaces` Google Places के लिए
- `wacli` WhatsApp के लिए

ये उदाहरण हैं, पूरी सूची नहीं। इसी पैटर्न का उपयोग करके अपनी
skills की आवश्यकता के अनुसार जितनी बाइनरी चाहिए, इंस्टॉल करें। बाद में जब आप ऐसी skill जोड़ें जिसे नई
बाइनरी की आवश्यकता हो:

1. Dockerfile अपडेट करें।
2. इमेज फिर से बिल्ड करें।
3. कंटेनर पुनः आरंभ करें।

**Dockerfile का उदाहरण**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# उदाहरण बाइनरी 1: Gmail CLI (gogcli — `gog` के रूप में इंस्टॉल होती है)
# वर्तमान Linux एसेट URL को https://github.com/steipete/gogcli/releases से कॉपी करें
RUN curl -L https://github.com/steipete/gogcli/releases/latest/download/gogcli_linux_amd64.tar.gz \
  | tar -xzO gog > /usr/local/bin/gog; \
  chmod +x /usr/local/bin/gog

# उदाहरण बाइनरी 2: Google Places CLI
# वर्तमान Linux एसेट URL को https://github.com/steipete/goplaces/releases से कॉपी करें
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_linux_amd64.tar.gz \
  | tar -xzO goplaces > /usr/local/bin/goplaces; \
  chmod +x /usr/local/bin/goplaces

# उदाहरण बाइनरी 3: WhatsApp CLI
# वर्तमान Linux एसेट URL को https://github.com/steipete/wacli/releases से कॉपी करें
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli-linux-amd64.tar.gz \
  | tar -xzO wacli > /usr/local/bin/wacli; \
  chmod +x /usr/local/bin/wacli

# इसी पैटर्न का उपयोग करके नीचे और बाइनरी जोड़ें

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
ऊपर दिए गए URL उदाहरण हैं। ARM-आधारित VM के लिए `arm64` एसेट चुनें। पुनरुत्पाद्य बिल्ड के लिए, संस्करणयुक्त रिलीज़ URL पिन करें।
</Note>

## बिल्ड करें और शुरू करें

```bash
docker compose build
docker compose up -d openclaw-gateway
```

यदि `pnpm install --frozen-lockfile` के दौरान बिल्ड `Killed` या निकास कोड 137 के साथ विफल हो जाता है, तो VM में मेमोरी समाप्त हो गई है। पुनः प्रयास करने से पहले बड़े मशीन वर्ग का उपयोग करें।

बाइनरी सत्यापित करें:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

अपेक्षित आउटपुट:

```text
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

सत्यापित करें कि Gateway चालू है:

```bash
docker compose logs -f openclaw-gateway
curl -fsS http://127.0.0.1:18789/healthz
```

`/healthz` द्वारा 200 प्रतिक्रिया लौटना पुष्टि करता है कि Gateway प्रक्रिया सुन रही है और स्वस्थ है; अंतर्निहित इमेज `HEALTHCHECK` उसी एंडपॉइंट को पोल करती है।

## क्या कहाँ स्थायी रहता है

OpenClaw Docker में चलता है, लेकिन Docker सत्य का स्रोत नहीं है। सभी दीर्घकालिक अवस्थाओं को पुनः आरंभ, पुनर्निर्माण और रीबूट के बाद भी बने रहना चाहिए।

| घटक                    | स्थान                                                   | स्थायित्व तंत्र            | टिप्पणियाँ                                                                                                           |
| ---------------------- | ------------------------------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Gateway कॉन्फ़िगरेशन   | `/home/node/.openclaw/`                                | होस्ट वॉल्यूम माउंट         | इसमें `openclaw.json` शामिल है                                                                                       |
| चैनल/प्रदाता क्रेडेंशियल | `/home/node/.openclaw/credentials/`                    | होस्ट वॉल्यूम माउंट         | चैनल और प्रदाता की क्रेडेंशियल सामग्री                                                                                 |
| मॉडल प्रमाणीकरण प्रोफ़ाइल | `/home/node/.openclaw/agents/`                         | होस्ट वॉल्यूम माउंट         | `agents/<agentId>/agent/auth-profiles.json` (OAuth, API कुंजियाँ)                                                       |
| लेगेसी OAuth कुंजी फ़ाइल | `/home/node/.config/openclaw/`                         | होस्ट वॉल्यूम माउंट         | माइग्रेशन-पूर्व OAuth साइडकार के लिए केवल-पठन संगतता; `openclaw doctor --fix` इन्हें `auth-profiles.json` में माइग्रेट करता है |
| Skill कॉन्फ़िगरेशन     | `/home/node/.openclaw/skills/`                         | होस्ट वॉल्यूम माउंट         | Skill-स्तरीय अवस्था                                                                                                   |
| एजेंट कार्यक्षेत्र      | `/home/node/.openclaw/workspace/`                      | होस्ट वॉल्यूम माउंट         | कोड और एजेंट आर्टिफ़ैक्ट                                                                                               |
| WhatsApp सत्र          | `/home/node/.openclaw/`                                | होस्ट वॉल्यूम माउंट         | QR लॉगिन सुरक्षित रखता है                                                                                              |
| Gmail कीरिंग           | `/home/node/.openclaw/`                                | होस्ट वॉल्यूम + पासवर्ड     | `GOG_KEYRING_PASSWORD` आवश्यक है                                                                                     |
| Plugin पैकेज           | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | होस्ट वॉल्यूम माउंट         | डाउनलोड किए जा सकने वाले Plugin पैकेज रूट                                                                              |
| बाहरी बाइनरी           | `/usr/local/bin/`                                      | Docker इमेज                | बिल्ड के समय शामिल करना आवश्यक है                                                                                      |
| Node रनटाइम            | कंटेनर फ़ाइल सिस्टम                                    | Docker इमेज                | प्रत्येक इमेज बिल्ड पर फिर से बनाया जाता है                                                                             |
| OS पैकेज               | कंटेनर फ़ाइल सिस्टम                                    | Docker इमेज                | रनटाइम पर इंस्टॉल न करें                                                                                                |
| Docker कंटेनर          | अस्थायी                                                 | पुनः आरंभ करने योग्य        | नष्ट करना सुरक्षित है                                                                                                  |

## अपडेट

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

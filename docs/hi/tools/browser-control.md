---
read_when:
    - local control API के माध्यम से एजेंट ब्राउज़र की स्क्रिप्टिंग या डिबगिंग
    - '`openclaw browser` CLI संदर्भ खोज रहे हैं'
    - स्नैपशॉट और संदर्भों के साथ कस्टम ब्राउज़र ऑटोमेशन जोड़ना
summary: OpenClaw ब्राउज़र नियंत्रण API, CLI संदर्भ, और स्क्रिप्टिंग कार्रवाइयाँ
title: ब्राउज़र नियंत्रण API
x-i18n:
    generated_at: "2026-06-29T00:16:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ccfd1ec996b0fc211e2aefa0554e0fa5c7b0899ca981836134a3741b38bf7600
    source_path: tools/browser-control.md
    workflow: 16
---

सेटअप, कॉन्फ़िगरेशन, और समस्या-निवारण के लिए, [Browser](/hi/tools/browser) देखें।
यह पेज स्थानीय नियंत्रण HTTP API, `openclaw browser`
CLI, और स्क्रिप्टिंग पैटर्न (स्नैपशॉट, refs, waits, debug flows) के लिए संदर्भ है।

## नियंत्रण API (वैकल्पिक)

केवल स्थानीय इंटीग्रेशन के लिए, Gateway एक छोटा loopback HTTP API उपलब्ध कराता है।
यह स्टैंडअलोन सर्वर opt-in है — HTTP endpoints उपलब्ध होने से पहले gateway सेवा environment में
environment variable `OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` सेट करें
और gateway restart करें। इस variable के बिना browser control runtime फिर भी CLI और
agent tools के माध्यम से काम करता है, लेकिन loopback control port पर कुछ भी listen नहीं करता।

- स्थिति/start/stop: `GET /`, `POST /start`, `POST /stop`
- टैब: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- स्नैपशॉट/screenshot: `GET /snapshot`, `POST /screenshot`
- क्रियाएँ: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- डाउनलोड: `POST /download`, `POST /wait/download`
- अनुमतियाँ: `POST /permissions/grant`
- Debugging: `GET /console`, `POST /pdf`
- Debugging: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- नेटवर्क: `POST /response/body`
- स्थिति: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- स्थिति: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- सेटिंग्स: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

सभी endpoints `?profile=<name>` स्वीकार करते हैं। `POST /start?headless=true` persisted
browser config बदले बिना स्थानीय managed profiles के लिए one-shot headless launch का अनुरोध करता है; attach-only, remote CDP, और existing-session profiles
उस override को reject करते हैं क्योंकि OpenClaw उन browser processes को launch नहीं करता।

tab endpoints के लिए, `targetId` compatibility field name है। `GET /tabs` या `POST /tabs/open` से
`suggestedTargetId` पास करना बेहतर है; `t1` जैसे labels और `tabId`
handles भी स्वीकार किए जाते हैं। Raw CDP target ids और unique raw
target-id prefixes अभी भी काम करते हैं, लेकिन वे volatile diagnostic handles हैं।

अगर shared-secret gateway auth configured है, तो browser HTTP routes को भी auth चाहिए:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` या उस password के साथ HTTP Basic auth

नोट्स:

- यह standalone loopback browser API trusted-proxy या
  Tailscale Serve identity headers consume **नहीं** करता।
- अगर `gateway.auth.mode` `none` या `trusted-proxy` है, तो ये loopback browser
  routes उन identity-bearing modes को inherit नहीं करते; इन्हें केवल loopback-only रखें।

### `/act` error contract

`POST /act` route-level validation और
policy failures के लिए structured error response का उपयोग करता है:

```json
{ "error": "<message>", "code": "ACT_*" }
```

मौजूदा `code` values:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` missing या unrecognized है।
- `ACT_INVALID_REQUEST` (HTTP 400): action payload normalization या validation में fail हुआ।
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` किसी unsupported action kind के साथ उपयोग किया गया।
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (या `wait --fn`) config द्वारा disabled है।
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): top-level या batched `targetId` request target से conflict करता है।
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): action existing-session profiles के लिए supported नहीं है।

अन्य runtime failures अभी भी `code` field के बिना `{ "error": "<message>" }` return कर सकते हैं।

### Playwright requirement

कुछ features (navigate/act/AI snapshot/role snapshot, element screenshots,
PDF) के लिए Playwright चाहिए। अगर Playwright installed नहीं है, तो वे endpoints
स्पष्ट 501 error return करते हैं।

Playwright के बिना भी क्या काम करता है:

- ARIA snapshots
- Role-style accessibility snapshots (`--interactive`, `--compact`,
  `--depth`, `--efficient`) जब per-tab CDP WebSocket उपलब्ध हो। यह
  inspection और ref discovery के लिए fallback है; Playwright मुख्य
  action engine रहता है।
- managed `openclaw` browser के लिए page screenshots जब per-tab CDP
  WebSocket उपलब्ध हो
- `existing-session` / Chrome MCP profiles के लिए page screenshots
- snapshot output से `existing-session` ref-based screenshots (`--ref`)

किन चीज़ों को अभी भी Playwright चाहिए:

- `navigate`
- `act`
- AI snapshots जो Playwright के native AI snapshot format पर निर्भर हैं
- CSS-selector element screenshots (`--element`)
- full browser PDF export

Element screenshots `--full-page` को भी reject करते हैं; route `fullPage is
not supported for element screenshots` return करता है।

अगर आपको `Playwright is not available in this gateway build` दिखता है, तो packaged
Gateway में core browser runtime dependency missing है। OpenClaw reinstall या update करें,
फिर gateway restart करें। Docker के लिए, नीचे दिखाए अनुसार Chromium
browser binaries भी install करें।

#### Docker Playwright install

अगर आपका Gateway Docker में चलता है, तो `npx playwright` से बचें (npm override conflicts)।
custom images के लिए, image में Chromium bake करें:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

existing image के लिए, bundled CLI के माध्यम से install करें:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

browser downloads persist करने के लिए, `PLAYWRIGHT_BROWSERS_PATH` सेट करें (उदाहरण के लिए,
`/home/node/.cache/ms-playwright`) और सुनिश्चित करें कि `/home/node`
`OPENCLAW_HOME_VOLUME` या bind mount के माध्यम से persisted है। OpenClaw Linux पर persisted
Chromium को auto-detect करता है। [Docker](/hi/install/docker) देखें।

## यह कैसे काम करता है (internal)

एक छोटा loopback control server HTTP requests स्वीकार करता है और CDP के माध्यम से Chromium-based browsers से connect करता है। Advanced actions (click/type/snapshot/PDF) CDP के ऊपर Playwright से होकर जाते हैं; जब Playwright missing होता है, तो केवल non-Playwright operations उपलब्ध होते हैं। agent को एक stable interface दिखता है जबकि local/remote browsers और profiles नीचे स्वतंत्र रूप से swap होते रहते हैं।

## CLI quick reference

सभी commands किसी specific profile को target करने के लिए `--browser-profile <name>`, और machine-readable output के लिए `--json` स्वीकार करते हैं।

<AccordionGroup>

<Accordion title="Basics: status, tabs, open/focus/close">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # one-shot local managed headless launch
openclaw browser stop            # also clears emulation on attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # shortcut for current tab
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Inspection: screenshot, snapshot, console, errors, requests">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # or --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Actions: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # or e12 for role refs
openclaw browser click-coords 120 340        # viewport coordinates
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser upload media://inbound/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="State: cookies, storage, offline, headers, geo, device">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear to remove
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

नोट्स:

- `upload` और `dialog` **arming** calls हैं; chooser/dialog trigger करने वाले click/press से पहले इन्हें run करें। अगर कोई action modal खोलता है, तो action response में `blockedByDialog` और `browserState.dialogs.pending` शामिल होते हैं; सीधे respond करने के लिए वह `dialogId` पास करें। OpenClaw के बाहर handled dialogs `browserState.dialogs.recent` के तहत दिखाई देते हैं।
- `click`/`type`/etc के लिए `snapshot` से `ref` चाहिए (numeric `12`, role ref `e12`, या actionable ARIA ref `ax12`)। CSS selectors actions के लिए जानबूझकर supported नहीं हैं। जब visible viewport position ही एकमात्र reliable target हो, तो `click-coords` का उपयोग करें।
- Download और trace paths OpenClaw temp roots तक constrained हैं: `/tmp/openclaw{,/downloads}` (fallback: `${os.tmpdir()}/openclaw/...`)।
- `upload` OpenClaw temp uploads root और
  OpenClaw-managed inbound media से files स्वीकार करता है। Managed inbound media को
  `media://inbound/<id>`, sandbox-relative `media/inbound/<id>`, या managed inbound media directory के अंदर resolved
  path के रूप में referenced किया जा सकता है। Nested media refs,
  traversal, symlinks, hardlinks, और arbitrary local paths अभी भी rejected हैं।
- `upload` `--input-ref` या `--element` के माध्यम से file inputs directly set भी कर सकता है।

Stable tab ids और labels Chromium raw-target replacement के बाद भी बने रहते हैं जब OpenClaw
replacement tab को prove कर सके, जैसे same URL या form submission के बाद एक single old tab का
single new tab बनना। Raw target ids अभी भी volatile हैं; scripts में
`tabs` से `suggestedTargetId` prefer करें।

Snapshot flags एक नजर में:

- `--format ai` (Playwright के साथ डिफ़ॉल्ट): संख्यात्मक संदर्भों वाला AI स्नैपशॉट (`aria-ref="<n>"`)।
- `--format aria`: `axN` संदर्भों वाला accessibility tree। जब Playwright उपलब्ध होता है, OpenClaw संदर्भों को backend DOM ids के साथ live page से बांधता है ताकि आगे की कार्रवाइयां उनका उपयोग कर सकें; अन्यथा आउटपुट को केवल निरीक्षण के लिए मानें।
- `--efficient` (या `--mode efficient`): compact role snapshot preset। इसे डिफ़ॉल्ट बनाने के लिए `browser.snapshotDefaults.mode: "efficient"` सेट करें ([Gateway configuration](/hi/gateway/configuration-reference#browser) देखें)।
- `--interactive`, `--compact`, `--depth`, `--selector` `ref=e12` संदर्भों वाला role snapshot बाध्य करते हैं। `--frame "<iframe>"` role snapshots को iframe तक सीमित करता है।
- Playwright के साथ, `--labels` overlay किए गए ref labels वाला screenshot जोड़ता है
  (`MEDIA:<path>` प्रिंट करता है) और साथ में हर ref के bounding
  box वाला `annotations` array देता है। `screenshot` पर, Playwright-backed labels `--full-page`,
  `--ref`, और `--element` के साथ काम करते हैं; `snapshot` पर, साथ वाला screenshot
  केवल viewport तक सीमित रहता है। Existing-session/chrome-mcp profiles page screenshots पर
  overlay labels render करते हैं लेकिन `annotations` वापस नहीं करते या Playwright
  full-page/ref/element projection helper का उपयोग नहीं करते। Playwright या chrome-mcp के बिना,
  labeled screenshots उपलब्ध नहीं होते।
- `--urls` खोजे गए link destinations को AI snapshots में जोड़ता है।

## स्नैपशॉट और संदर्भ

OpenClaw दो "snapshot" शैलियों का समर्थन करता है:

- **AI snapshot (numeric refs)**: `openclaw browser snapshot` (डिफ़ॉल्ट; `--format ai`)
  - आउटपुट: एक text snapshot जिसमें numeric refs शामिल होते हैं।
  - कार्रवाइयां: `openclaw browser click 12`, `openclaw browser type 23 "hello"`।
  - आंतरिक रूप से, ref को Playwright के `aria-ref` के माध्यम से resolve किया जाता है।

- **Role snapshot (`e12` जैसे role refs)**: `openclaw browser snapshot --interactive` (या `--compact`, `--depth`, `--selector`, `--frame`)
  - आउटपुट: `[ref=e12]` (और वैकल्पिक `[nth=1]`) वाली role-based list/tree।
  - कार्रवाइयां: `openclaw browser click e12`, `openclaw browser highlight e12`।
  - आंतरिक रूप से, ref को `getByRole(...)` (duplicates के लिए `nth()` सहित) के माध्यम से resolve किया जाता है।
  - overlay किए गए `e12` labels वाला screenshot शामिल करने के लिए `--labels` जोड़ें। Playwright-backed profiles पर
    यह प्रति-ref bounding-box metadata भी लौटाता है
    (`annotations[]`)।
  - जब link text अस्पष्ट हो और agent को ठोस
    navigation targets चाहिए हों, तब `--urls` जोड़ें।

- **ARIA snapshot (`ax12` जैसे ARIA refs)**: `openclaw browser snapshot --format aria`
  - आउटपुट: structured nodes के रूप में accessibility tree।
  - कार्रवाइयां: `openclaw browser click ax12` तब काम करता है जब snapshot path
    Playwright और Chrome backend DOM ids के जरिए ref को bind कर सकता है।
- यदि Playwright उपलब्ध नहीं है, तो ARIA snapshots अभी भी
  निरीक्षण के लिए उपयोगी हो सकते हैं, लेकिन refs actionable नहीं हो सकते। जब आपको action refs चाहिए हों,
  `--format ai` या `--interactive` के साथ फिर से snapshot लें।
- raw-CDP fallback path के लिए Docker proof: `pnpm test:docker:browser-cdp-snapshot`
  CDP के साथ Chromium शुरू करता है, `browser doctor --deep` चलाता है, और सत्यापित करता है कि role
  snapshots में link URLs, cursor-promoted clickables, और iframe metadata शामिल हैं।

Ref व्यवहार:

- Refs **navigations के बीच स्थिर नहीं रहते**; यदि कुछ विफल हो, तो `snapshot` फिर से चलाएं और नया ref उपयोग करें।
- `/act` action-triggered replacement के बाद मौजूदा raw `targetId` लौटाता है
  जब वह replacement tab को साबित कर सकता है। आगे के commands के लिए
  stable tab ids/labels का उपयोग जारी रखें।
- यदि role snapshot `--frame` के साथ लिया गया था, तो role refs अगले role snapshot तक उस iframe तक सीमित रहते हैं।
- अज्ञात या stale `axN` refs Playwright के `aria-ref` selector पर
  गिरने के बजाय तुरंत विफल होते हैं। ऐसा होने पर उसी tab पर fresh snapshot चलाएं।

## Wait power-ups

आप केवल समय/text से अधिक चीज़ों पर wait कर सकते हैं:

- URL के लिए wait करें (Playwright द्वारा समर्थित globs):
  - `openclaw browser wait --url "**/dash"`
- load state के लिए wait करें:
  - `openclaw browser wait --load networkidle`
  - managed `openclaw` और raw/remote CDP profiles पर समर्थित। `user` और `existing-session` profiles `networkidle` को reject करते हैं; वहां `--url`, `--text`, selector, या `--fn` waits उपयोग करें।
- JS predicate के लिए wait करें:
  - `openclaw browser wait --fn "window.ready===true"`
- selector के visible होने तक wait करें:
  - `openclaw browser wait "#main"`

इन्हें मिलाकर उपयोग किया जा सकता है:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Debug workflows

जब कोई action विफल हो (जैसे "not visible", "strict mode violation", "covered"):

1. `openclaw browser snapshot --interactive`
2. `click <ref>` / `type <ref>` उपयोग करें (interactive mode में role refs को प्राथमिकता दें)
3. यदि यह फिर भी विफल हो: Playwright क्या target कर रहा है यह देखने के लिए `openclaw browser highlight <ref>`
4. यदि page अजीब व्यवहार करे:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. गहरी debugging के लिए: trace record करें:
   - `openclaw browser trace start`
   - issue को reproduce करें
   - `openclaw browser trace stop` (`TRACE:<path>` प्रिंट करता है)

## JSON output

`--json` scripting और structured tooling के लिए है।

उदाहरण:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON में Role snapshots में `refs` और एक छोटा `stats` block (lines/chars/refs/interactive) शामिल होता है ताकि tools payload size और density के बारे में reason कर सकें।

## State और environment knobs

ये "site को X की तरह व्यवहार कराएं" workflows के लिए उपयोगी हैं:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (legacy `set headers --json '{"X-Debug":"1"}'` समर्थित रहता है)
- HTTP basic auth: `set credentials user pass` (या `--clear`)
- Geolocation: `set geo <lat> <lon> --origin "https://example.com"` (या `--clear`)
- Media: `set media dark|light|no-preference|none`
- Timezone / locale: `set timezone ...`, `set locale ...`
- Device / viewport:
  - `set device "iPhone 14"` (Playwright device presets)
  - `set viewport 1280 720`

## Security और privacy

- openclaw browser profile में logged-in sessions हो सकते हैं; इसे संवेदनशील मानें।
- `browser act kind=evaluate` / `openclaw browser evaluate` और `wait --fn`
  page context में arbitrary JavaScript execute करते हैं। Prompt injection इसे steer कर सकता है।
  यदि आपको इसकी जरूरत नहीं है तो `browser.evaluateEnabled=false` से इसे disable करें।
- `openclaw browser evaluate --fn` function source, expression, या
  statement body स्वीकार करता है। Statement bodies को async functions के रूप में wrap किया जाता है, इसलिए
  जो value आप वापस चाहते हैं उसके लिए `return` उपयोग करें। जब
  page-side function को default evaluate timeout से अधिक समय चाहिए हो सकता है, तब `--timeout-ms <ms>` उपयोग करें।
- logins और anti-bot notes (X/Twitter, आदि) के लिए, [Browser login + X/Twitter posting](/hi/tools/browser-login) देखें।
- Gateway/node host को private रखें (loopback या tailnet-only)।
- Remote CDP endpoints शक्तिशाली होते हैं; उन्हें tunnel और protect करें।

Strict-mode उदाहरण (private/internal destinations को डिफ़ॉल्ट रूप से block करें):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## संबंधित

- [Browser](/hi/tools/browser) - overview, configuration, profiles, security
- [Browser login](/hi/tools/browser-login) - sites में sign in करना
- [Browser Linux troubleshooting](/hi/tools/browser-linux-troubleshooting)
- [Browser WSL2 troubleshooting](/hi/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

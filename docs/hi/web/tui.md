---
read_when:
    - आप TUI का शुरुआती-अनुकूल walkthrough चाहते हैं
    - आपको TUI सुविधाओं, कमांड और शॉर्टकट की पूरी सूची चाहिए
summary: 'टर्मिनल UI (TUI): Gateway से कनेक्ट करें या एम्बेडेड मोड में स्थानीय रूप से चलाएँ'
title: TUI
x-i18n:
    generated_at: "2026-06-29T00:27:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed02875ea5dcb8cef987d16fe11701eba11160525caf9791f74c610b1b6bec6e
    source_path: web/tui.md
    workflow: 16
---

## त्वरित शुरुआत

### Gateway मोड

1. Gateway शुरू करें।

```bash
openclaw gateway
```

2. TUI खोलें।

```bash
openclaw tui
```

3. संदेश टाइप करें और Enter दबाएँ।

रिमोट Gateway:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

यदि आपका Gateway पासवर्ड auth का उपयोग करता है, तो `--password` का उपयोग करें।

### स्थानीय मोड

Gateway के बिना TUI चलाएँ:

```bash
openclaw chat
# or
openclaw tui --local
```

नोट:

- `openclaw chat` और `openclaw terminal`, `openclaw tui --local` के alias हैं।
- `--local` को `--url`, `--token`, या `--password` के साथ जोड़ा नहीं जा सकता।
- स्थानीय मोड embedded agent runtime का सीधे उपयोग करता है। अधिकांश स्थानीय tools काम करते हैं, लेकिन केवल-Gateway सुविधाएँ उपलब्ध नहीं होतीं।
- config file में authored settings होने के बाद, `openclaw` और `openclaw crestodian` भी इसी TUI shell का उपयोग करते हैं, जहाँ Crestodian स्थानीय setup और repair chat backend होता है।

## आपको क्या दिखता है

- Header: connection URL, मौजूदा agent, मौजूदा session।
- Chat log: user messages, assistant replies, system notices, tool cards।
- Status line: connection/run state (connecting, running, streaming, idle, error)।
- Footer: agent + session + model + goal state + think/fast/verbose/trace/reasoning + token counts + deliver। जब `tui.footer.showRemoteHost` सक्षम होता है, तो रिमोट Gateway connections connection host भी दिखाते हैं।
- Input: autocomplete वाला text editor।

## मानसिक मॉडल: agents + sessions

- Agents unique slugs होते हैं (जैसे `main`, `research`)। Gateway सूची expose करता है।
- Sessions मौजूदा agent से संबंधित होते हैं।
- Session keys `agent:<agentId>:<sessionKey>` के रूप में संग्रहीत होते हैं।
  - यदि आप `/session main` टाइप करते हैं, तो TUI इसे `agent:<currentAgent>:main` में expand करता है।
  - यदि आप `/session agent:other:main` टाइप करते हैं, तो आप स्पष्ट रूप से उस agent session पर switch करते हैं।
- Session scope:
  - `per-sender` (default): हर agent के पास कई sessions होते हैं।
  - `global`: TUI हमेशा `global` session का उपयोग करता है (picker खाली हो सकता है)।
- मौजूदा agent + session हमेशा footer में दिखाई देते हैं।
- non-local URL-backed connections के लिए Gateway host दिखाने के लिए, इससे opt in करें:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  Loopback और embedded local connections कभी host label नहीं दिखाते।

- यदि session में [goal](/hi/tools/goal) है, तो footer उसकी compact state दिखाता है,
  जैसे `Pursuing goal`, `Goal paused (/goal resume)`, या
  `Goal achieved`।
- `--session` के बिना शुरू करने पर, gateway-mode TUI उसी gateway, agent, और session scope के लिए last selected session resume करता है, यदि वह session अभी भी मौजूद है। `--session`, `/session`, `/new`, या `/reset` पास करना स्पष्ट ही रहता है।

## भेजना + delivery

- Messages Gateway को भेजे जाते हैं; providers को delivery default रूप से off होती है।
- TUI, WebChat की तरह एक internal source surface है, generic outbound channel नहीं। visible replies के लिए `tools.message` की आवश्यकता रखने वाले harnesses active TUI turn को targetless `message.send` से satisfy कर सकते हैं; explicit provider delivery अभी भी सामान्य configured channels का उपयोग करती है और कभी `lastChannel` पर fallback नहीं करती।
- Turn delivery on करें:
  - `/deliver on`
  - या Settings panel
  - या `openclaw tui --deliver` के साथ शुरू करें

## Pickers + overlays

- Model picker: उपलब्ध models की सूची दिखाएँ और session override set करें।
- Agent picker: कोई अलग agent चुनें।
- Session picker: मौजूदा agent के लिए पिछले 7 दिनों में updated अधिकतम 50 sessions दिखाता है। पुराने known session पर जाने के लिए `/session <key>` का उपयोग करें।
- Settings: deliver, tool output expansion, और thinking visibility toggle करें।

## Keyboard shortcuts

- Enter: message भेजें
- Esc: active run abort करें
- Ctrl+C: input clear करें (exit करने के लिए दो बार दबाएँ)
- Ctrl+D: exit
- Ctrl+L: model picker
- Ctrl+G: agent picker
- Ctrl+P: session picker
- Ctrl+O: tool output expansion toggle करें
- Ctrl+T: thinking visibility toggle करें (history reload करता है)

## Slash commands

Core:

- `/help`
- `/status`
- `/agent <id>` (या `/agents`)
- `/session <key>` (या `/sessions`)
- `/model <provider/model>` (या `/models`)

Session controls:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default` session override clear करता है)
- `/goal [status] | /goal start <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Session lifecycle:

- `/new` या `/reset` (session reset करें)
- `/abort` (active run abort करें)
- `/settings`
- `/exit`

केवल local mode:

- `/auth [provider]` TUI के अंदर provider auth/login flow खोलता है।

अन्य Gateway slash commands (उदाहरण के लिए, `/context`) Gateway को forward किए जाते हैं और system output के रूप में दिखाए जाते हैं। [Slash commands](/hi/tools/slash-commands) देखें।

## Local shell commands

- TUI host पर local shell command चलाने के लिए किसी line के आगे `!` लगाएँ।
- TUI local execution allow करने के लिए प्रति session एक बार prompt करता है; decline करने पर session के लिए `!` disabled रहता है।
- Commands TUI working directory में fresh, non-interactive shell में चलते हैं (कोई persistent `cd`/env नहीं)।
- Local shell commands अपने environment में `OPENCLAW_SHELL=tui-local` प्राप्त करते हैं।
- अकेला `!` सामान्य message के रूप में भेजा जाता है; leading spaces local exec trigger नहीं करते।

## local TUI से configs repair करें

जब मौजूदा config पहले से validate होता है और आप चाहते हैं कि
embedded agent उसी machine पर इसे inspect करे, docs से compare करे,
और running Gateway पर निर्भर हुए बिना drift repair करने में मदद करे, तब local mode का उपयोग करें।

यदि `openclaw config validate` पहले से fail हो रहा है, तो पहले `openclaw configure`
या `openclaw doctor --fix` से शुरू करें। `openclaw chat` invalid-
config guard को bypass नहीं करता।

Typical loop:

1. local mode शुरू करें:

```bash
openclaw chat
```

2. agent से पूछें कि आप क्या check कराना चाहते हैं, उदाहरण के लिए:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. exact evidence और validation के लिए local shell commands का उपयोग करें:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. `openclaw config set` या `openclaw configure` से narrow changes apply करें, फिर `!openclaw config validate` फिर से चलाएँ।
5. यदि Doctor automatic migration या repair recommend करता है, तो उसे review करें और `!openclaw doctor --fix` चलाएँ।

Tips:

- `openclaw.json` को हाथ से edit करने के बजाय `openclaw config set` या `openclaw configure` को प्राथमिकता दें।
- `openclaw docs "<query>"` उसी machine से live docs index search करता है।
- जब आपको structured schema और SecretRef/resolvability errors चाहिए हों, तो `openclaw config validate --json` उपयोगी है।

## Tool output

- Tool calls args + results वाले cards के रूप में दिखते हैं।
- Ctrl+O collapsed/expanded views के बीच toggle करता है।
- Tools चलने के दौरान, partial updates उसी card में stream होते हैं।

## Terminal colors

- TUI assistant body text को आपके terminal के default foreground में रखता है ताकि dark और light terminals दोनों readable रहें।
- यदि आपका terminal light background उपयोग करता है और auto-detection गलत है, तो `openclaw tui` launch करने से पहले `OPENCLAW_THEME=light` set करें।
- इसके बजाय original dark palette force करने के लिए, `OPENCLAW_THEME=dark` set करें।

## History + streaming

- Connect होने पर, TUI latest history load करता है (default 200 messages)।
- Streaming responses finalized होने तक in place update होते हैं।
- TUI richer tool cards के लिए agent tool events भी listen करता है।

## Connection details

- TUI Gateway के साथ `mode: "tui"` के रूप में register करता है।
- Reconnects system message दिखाते हैं; event gaps log में surfaced होते हैं।

## Options

- `--local`: local embedded agent runtime के विरुद्ध चलाएँ
- `--url <url>`: Gateway WebSocket URL (config या `ws://127.0.0.1:<port>` default होता है)
- `--token <token>`: Gateway token (यदि required हो)
- `--password <password>`: Gateway password (यदि required हो)
- `--session <key>`: Session key (default: `main`, या scope global होने पर `global`)
- `--deliver`: assistant replies provider तक deliver करें (default off)
- `--thinking <level>`: sends के लिए thinking level override करें
- `--message <text>`: connect होने के बाद initial message भेजें
- `--timeout-ms <ms>`: Agent timeout ms में (default `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: load करने के लिए history entries (default `200`)

<Warning>
जब आप `--url` set करते हैं, तो TUI config या environment credentials पर fallback नहीं करता। `--token` या `--password` स्पष्ट रूप से pass करें। Missing explicit credentials error है। local mode में, `--url`, `--token`, या `--password` pass न करें।
</Warning>

## Troubleshooting

message भेजने के बाद कोई output नहीं:

- Gateway connected और idle/busy है, यह confirm करने के लिए TUI में `/status` चलाएँ।
- Gateway logs check करें: `openclaw logs --follow`।
- confirm करें कि agent run कर सकता है: `openclaw status` और `openclaw models status`।
- यदि आप chat channel में messages expect करते हैं, तो delivery enable करें (`/deliver on` या `--deliver`)।

## Connection troubleshooting

- `disconnected`: सुनिश्चित करें कि Gateway चल रहा है और आपके `--url/--token/--password` correct हैं।
- picker में कोई agents नहीं: `openclaw agents list` और अपना routing config check करें।
- Empty session picker: आप global scope में हो सकते हैं या अभी कोई sessions नहीं हो सकते।

## Related

- [Control UI](/hi/web/control-ui) — web-based control interface
- [Config](/hi/cli/config) — `openclaw.json` inspect, validate, और edit करें
- [Doctor](/hi/cli/doctor) — guided repair और migration checks
- [CLI Reference](/hi/cli) — पूरा CLI command reference

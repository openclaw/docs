---
read_when:
    - CLI से Gateway चलाना (डेव या सर्वर)
    - Debugging Gateway auth, bind modes, और connectivity
    - Bonjour (स्थानीय + वाइड-एरिया DNS-SD) के माध्यम से Gateway खोजना
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — gateways चलाएँ, क्वेरी करें, और खोजें
title: Gateway
x-i18n:
    generated_at: "2026-07-01T05:42:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 80f329ebd154f6fd0e87869c498c58fc6d5276a21934f8a36837653bd68a2d22
    source_path: cli/gateway.md
    workflow: 16
---

Gateway OpenClaw का WebSocket सर्वर है (channels, nodes, sessions, hooks)। इस पेज के subcommands `openclaw gateway …` के अंतर्गत रहते हैं।

<CardGroup cols={3}>
  <Card title="Bonjour खोज" href="/hi/gateway/bonjour">
    स्थानीय mDNS + wide-area DNS-SD सेटअप।
  </Card>
  <Card title="खोज अवलोकन" href="/hi/gateway/discovery">
    OpenClaw gateways का विज्ञापन और खोज कैसे करता है।
  </Card>
  <Card title="कॉन्फ़िगरेशन" href="/hi/gateway/configuration">
    शीर्ष-स्तरीय gateway config keys।
  </Card>
</CardGroup>

## Gateway चलाएँ

स्थानीय Gateway process चलाएँ:

```bash
openclaw gateway
```

Foreground alias:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="स्टार्टअप व्यवहार">
    - डिफ़ॉल्ट रूप से, Gateway तब तक शुरू होने से इनकार करता है जब तक `~/.openclaw/openclaw.json` में `gateway.mode=local` सेट न हो। ad-hoc/dev runs के लिए `--allow-unconfigured` का उपयोग करें।
    - `openclaw onboard --mode local` और `openclaw setup` से `gateway.mode=local` लिखे जाने की अपेक्षा है। अगर फ़ाइल मौजूद है लेकिन `gateway.mode` नहीं है, तो इसे implicit रूप से local mode मानने के बजाय टूटी या clobbered config मानकर सुधारें।
    - अगर फ़ाइल मौजूद है और `gateway.mode` नहीं है, तो Gateway इसे संदिग्ध config क्षति मानता है और आपके लिए "guess local" करने से इनकार करता है।
    - auth के बिना loopback से आगे bind करना रोका गया है (safety guardrail)।
    - `lan`, `tailnet`, और `custom` अभी IPv4-only BYOH paths पर resolve होते हैं।
    - IPv6-only BYOH आज इस path पर natively supported नहीं है। अगर host खुद IPv6-only है, तो IPv4 sidecar या proxy का उपयोग करें।
    - authorized होने पर `SIGUSR1` in-process restart trigger करता है (`commands.restart` डिफ़ॉल्ट रूप से enabled है; manual restart रोकने के लिए `commands.restart: false` सेट करें, जबकि gateway tool/config apply/update allowed रहते हैं)।
    - `SIGINT`/`SIGTERM` handlers gateway process रोकते हैं, लेकिन वे कोई custom terminal state restore नहीं करते। अगर आप CLI को TUI या raw-mode input के साथ wrap करते हैं, तो exit से पहले terminal restore करें।

  </Accordion>
</AccordionGroup>

### विकल्प

<ParamField path="--port <port>" type="number">
  WebSocket port (default config/env से आता है; आम तौर पर `18789`)।
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Listener bind mode। `lan`, `tailnet`, और `custom` अभी IPv4-only paths पर resolve होते हैं।
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Auth mode override।
</ParamField>
<ParamField path="--token <token>" type="string">
  Token override (process के लिए `OPENCLAW_GATEWAY_TOKEN` भी set करता है)।
</ParamField>
<ParamField path="--password <password>" type="string">
  Password override।
</ParamField>
<ParamField path="--password-file <path>" type="string">
  gateway password को file से पढ़ें।
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Gateway को Tailscale के ज़रिए expose करें।
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  shutdown पर Tailscale serve/funnel config reset करें।
</ParamField>
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  आज IPv4 address की अपेक्षा करता है। IPv6-only BYOH के लिए, Gateway के सामने IPv4 sidecar या proxy रखें और OpenClaw को उस IPv4 endpoint पर point करें।
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  config में `gateway.mode=local` के बिना gateway start allow करें। यह केवल ad-hoc/dev bootstrap के लिए startup guard bypass करता है; config file लिखता या repair नहीं करता।
</ParamField>
<ParamField path="--dev" type="boolean">
  missing होने पर dev config + workspace बनाएँ (`BOOTSTRAP.md` skip करता है)।
</ParamField>
<ParamField path="--reset" type="boolean">
  dev config + credentials + sessions + workspace reset करें (`--dev` आवश्यक है)।
</ParamField>
<ParamField path="--force" type="boolean">
  start करने से पहले selected port पर कोई existing listener kill करें।
</ParamField>
<ParamField path="--verbose" type="boolean">
  Verbose logs।
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  console में केवल CLI backend logs दिखाएँ (और stdout/stderr enable करें)।
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Websocket log style।
</ParamField>
<ParamField path="--compact" type="boolean">
  `--ws-log compact` के लिए alias।
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  raw model stream events को jsonl में log करें।
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Raw stream jsonl path।
</ParamField>

## Gateway restart करें

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` running Gateway से active work preflight करने और active work drain होने के बाद एक coalesced restart schedule करने को कहता है। डिफ़ॉल्ट safe restart configured `gateway.reload.deferralTimeoutMs` (default 5 minutes) तक active work का wait करता है; जब वह budget expire होता है तो restart force किया जाता है। indefinite safe wait के लिए `gateway.reload.deferralTimeoutMs` को `0` पर set करें, जो कभी force नहीं करता। Plain `restart` existing service-manager behavior रखता है; `--force` immediate override path बना रहता है।

`openclaw gateway restart --safe --skip-deferral` `--safe` जैसा ही OpenClaw-aware coordinated restart चलाता है, लेकिन active-work deferral gate bypass करता है ताकि blockers reported होने पर भी Gateway restart तुरंत emit करे। इसे operator escape hatch के रूप में use करें जब कोई deferral stuck task run से pinned हो गया हो और सिर्फ `--safe` `gateway.reload.deferralTimeoutMs` से bounded हो सकता हो। `--skip-deferral` के लिए `--safe` आवश्यक है।

<Warning>
Inline `--password` local process listings में expose हो सकता है। `--password-file`, env, या SecretRef-backed `gateway.auth.password` को प्राथमिकता दें।
</Warning>

### Gateway profiling

- Gateway startup के दौरान phase timings log करने के लिए `OPENCLAW_GATEWAY_STARTUP_TRACE=1` set करें, जिसमें per-phase `eventLoopMax` delay और installed-index, manifest registry, startup planning, और owner-map work के लिए plugin lookup-table timings शामिल हैं।
- restart signal handling, active-work drain, shutdown phases, next start, ready timing, और memory metrics के लिए restart-scoped `restart trace:` lines log करने हेतु `OPENCLAW_GATEWAY_RESTART_TRACE=1` set करें।
- external QA harnesses के लिए best-effort JSONL startup diagnostics timeline लिखने हेतु `OPENCLAW_DIAGNOSTICS=timeline` को `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` के साथ set करें। आप config में `diagnostics.flags: ["timeline"]` से भी flag enable कर सकते हैं; path फिर भी env-provided है। event-loop samples शामिल करने के लिए `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` जोड़ें।
- पहले `pnpm build` चलाएँ, फिर built CLI entry के विरुद्ध Gateway startup benchmark करने के लिए `pnpm test:startup:gateway -- --runs 5 --warmup 1` चलाएँ। benchmark first process output, `/healthz`, `/readyz`, startup trace timings, event-loop delay, और plugin lookup-table timing details record करता है।
- पहले `pnpm build` चलाएँ, फिर macOS या Linux पर built CLI entry के विरुद्ध in-process Gateway restart benchmark करने के लिए `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` चलाएँ। restart benchmark SIGUSR1 का उपयोग करता है, child process में startup और restart traces दोनों enable करता है, और next `/healthz`, next `/readyz`, downtime, ready timing, CPU, RSS, और restart trace metrics record करता है।
- `/healthz` को liveness और `/readyz` को usable readiness मानें। Trace lines और benchmark output owner attribution के लिए हैं; एक trace span या एक sample को complete performance conclusion न मानें।

## running Gateway query करें

सभी query commands WebSocket RPC का उपयोग करते हैं।

<Tabs>
  <Tab title="Output modes">
    - Default: human-readable (TTY में colored)।
    - `--json`: machine-readable JSON (कोई styling/spinner नहीं)।
    - `--no-color` (या `NO_COLOR=1`): human layout बनाए रखते हुए ANSI disable करें।

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: Gateway WebSocket URL।
    - `--token <token>`: Gateway token।
    - `--password <password>`: Gateway password।
    - `--timeout <ms>`: timeout/budget (command के अनुसार बदलता है)।
    - `--expect-final`: "final" response का wait करें (agent calls)।

  </Tab>
</Tabs>

<Note>
जब आप `--url` set करते हैं, CLI config या environment credentials पर fall back नहीं करता। `--token` या `--password` explicit रूप से pass करें। Missing explicit credentials error है।
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

HTTP `/healthz` endpoint liveness probe है: server के HTTP answer कर पाने पर यह return करता है। HTTP `/readyz` endpoint अधिक strict है और startup plugin sidecars, channels, या configured hooks के settle होते समय red रहता है। Local या authenticated detailed readiness responses में event-loop delay, event-loop utilization, CPU core ratio, और `degraded` flag के साथ `eventLoop` diagnostic block शामिल होता है।

<ParamField path="--port <port>" type="number">
  इस port पर local loopback Gateway target करें। यह health call के लिए `OPENCLAW_GATEWAY_URL` और `OPENCLAW_GATEWAY_PORT` override करता है।
</ParamField>

### `gateway usage-cost`

session logs से usage-cost summaries fetch करें।

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  शामिल करने के लिए days की संख्या।
</ParamField>
<ParamField path="--agent <id>" type="string">
  cost summary को एक configured agent id तक scope करें।
</ParamField>
<ParamField path="--all-agents" type="boolean">
  सभी configured agents में cost summary aggregate करें। `--agent` के साथ combine नहीं किया जा सकता।
</ParamField>

### `gateway stability`

running Gateway से recent diagnostic stability recorder fetch करें।

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  शामिल करने के लिए recent events की maximum संख्या (max `1000`)।
</ParamField>
<ParamField path="--type <type>" type="string">
  diagnostic event type से filter करें, जैसे `payload.large` या `diagnostic.memory.pressure`।
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  केवल diagnostic sequence number के बाद के events शामिल करें।
</ParamField>
<ParamField path="--bundle [path]" type="string">
  running Gateway को call करने के बजाय persisted stability bundle पढ़ें। state directory के अंतर्गत newest bundle के लिए `--bundle latest` (या सिर्फ `--bundle`) use करें, या bundle JSON path सीधे pass करें।
</ParamField>
<ParamField path="--export" type="boolean">
  stability details print करने के बजाय shareable support diagnostics zip लिखें।
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` के लिए output path।
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy और bundle behavior">
    - Records operational metadata रखते हैं: event names, counts, byte sizes, memory readings, queue/session state, approval ids, channel/plugin names, और redacted session summaries। वे chat text, webhook bodies, tool outputs, raw request या response bodies, tokens, cookies, secret values, hostnames, या raw session ids नहीं रखते। recorder को पूरी तरह disable करने के लिए `diagnostics.enabled: false` set करें।
    - fatal Gateway exits, shutdown timeouts, और restart startup failures पर, जब recorder के पास events होते हैं, OpenClaw वही diagnostic snapshot `~/.openclaw/logs/stability/openclaw-stability-*.json` में लिखता है। newest bundle को `openclaw gateway stability --bundle latest` से inspect करें; `--limit`, `--type`, और `--since-seq` bundle output पर भी apply होते हैं।

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

bug reports से attach करने के लिए designed local diagnostics zip लिखें। privacy model और bundle contents के लिए [Diagnostics Export](/hi/gateway/diagnostics) देखें।

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  आउटपुट zip पथ। डिफ़ॉल्ट रूप से state निर्देशिका के अंतर्गत एक समर्थन निर्यात होता है।
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  शामिल की जाने वाली सैनिटाइज़ की गई लॉग पंक्तियों की अधिकतम संख्या।
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  निरीक्षण किए जाने वाले लॉग bytes की अधिकतम संख्या।
</ParamField>
<ParamField path="--url <url>" type="string">
  health snapshot के लिए Gateway WebSocket URL।
</ParamField>
<ParamField path="--token <token>" type="string">
  health snapshot के लिए Gateway token।
</ParamField>
<ParamField path="--password <password>" type="string">
  health snapshot के लिए Gateway password।
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Status/health snapshot timeout।
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  संचित stability bundle lookup छोड़ें।
</ParamField>
<ParamField path="--json" type="boolean">
  लिखे गए पथ, आकार और manifest को JSON के रूप में प्रिंट करें।
</ParamField>

निर्यात में एक manifest, Markdown सारांश, config shape, सैनिटाइज़ किए गए config विवरण, सैनिटाइज़ किए गए log सारांश, सैनिटाइज़ किए गए Gateway status/health snapshots, और मौजूद होने पर नवीनतम stability bundle शामिल होता है।

इसे साझा करने के लिए बनाया गया है। यह debugging में मदद करने वाले परिचालन विवरण रखता है, जैसे सुरक्षित OpenClaw log fields, subsystem names, status codes, durations, configured modes, ports, plugin ids, provider ids, non-secret feature settings, और redacted operational log messages। यह chat text, webhook bodies, tool outputs, credentials, cookies, account/message identifiers, prompt/instruction text, hostnames, और secret values को छोड़ता या redact करता है। जब LogTape-style message user/chat/tool payload text जैसा दिखता है, तो निर्यात केवल यह रखता है कि message छोड़ा गया था और उसका byte count।

### `gateway status`

`gateway status` Gateway service (launchd/systemd/schtasks) और connectivity/auth capability की वैकल्पिक probe दिखाता है।

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  स्पष्ट probe target जोड़ें। Configured remote + localhost की probe फिर भी की जाती है।
</ParamField>
<ParamField path="--token <token>" type="string">
  probe के लिए token auth।
</ParamField>
<ParamField path="--password <password>" type="string">
  probe के लिए password auth।
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Probe timeout।
</ParamField>
<ParamField path="--no-probe" type="boolean">
  connectivity probe छोड़ें (केवल-service दृश्य)।
</ParamField>
<ParamField path="--deep" type="boolean">
  system-level services को भी scan करें।
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  डिफ़ॉल्ट connectivity probe को read probe में upgrade करें और उस read probe के विफल होने पर non-zero exit करें। `--no-probe` के साथ जोड़ा नहीं जा सकता।
</ParamField>

<AccordionGroup>
  <Accordion title="Status semantics">
    - local CLI config missing या invalid होने पर भी `gateway status` diagnostics के लिए उपलब्ध रहता है।
    - डिफ़ॉल्ट `gateway status` service state, WebSocket connect, और handshake time पर दिखाई देने वाली auth capability साबित करता है। यह read/write/admin operations साबित नहीं करता।
    - Diagnostic probes first-time device auth के लिए non-mutating हैं: वे मौजूद होने पर मौजूदा cached device token का reuse करते हैं, लेकिन केवल status check करने के लिए नई CLI device identity या read-only device pairing record नहीं बनाते।
    - `gateway status` संभव होने पर probe auth के लिए configured auth SecretRefs resolve करता है।
    - यदि इस command path में required auth SecretRef unresolved है, तो probe connectivity/auth विफल होने पर `gateway status --json` `rpc.authWarning` report करता है; `--token`/`--password` स्पष्ट रूप से pass करें या पहले secret source resolve करें।
    - यदि probe सफल होती है, तो false positives से बचने के लिए unresolved auth-ref warnings suppress कर दी जाती हैं।
    - probing enabled होने पर, JSON output में `gateway.version` शामिल होता है जब running Gateway उसे report करता है; यदि follow-up handshake probe version metadata नहीं दे सकता, तो `--require-rpc` `status.runtimeVersion` RPC payload पर fall back कर सकता है।
    - scripts और automation में `--require-rpc` का उपयोग करें जब listening service पर्याप्त न हो और आपको read-scope RPC calls भी healthy चाहिए हों।
    - `--deep` extra launchd/systemd/schtasks installs के लिए best-effort scan जोड़ता है। जब multiple gateway-like services detect होती हैं, human output cleanup hints print करता है और warn करता है कि अधिकतर setups को प्रति machine एक gateway चलाना चाहिए।
    - `--deep` recent Gateway supervisor restart handoff भी report करता है जब service process external supervisor restart के लिए cleanly exited हो।
    - `--deep` plugin-aware mode (`pluginValidation: "full"`) में config validation चलाता है और configured plugin manifest warnings (उदाहरण के लिए missing channel config metadata) surface करता है ताकि install और update smoke checks उन्हें पकड़ सकें। डिफ़ॉल्ट `gateway status` fast read-only path रखता है जो plugin validation छोड़ता है।
    - Human output resolved file log path के साथ CLI-vs-service config paths/validity snapshot शामिल करता है ताकि profile या state-dir drift diagnose करने में मदद मिले।

  </Accordion>
  <Accordion title="Linux systemd auth-drift checks">
    - Linux systemd installs पर, service auth drift checks unit से `Environment=` और `EnvironmentFile=` दोनों values पढ़ते हैं (जिसमें `%h`, quoted paths, multiple files, और optional `-` files शामिल हैं)।
    - Drift checks merged runtime env (पहले service command env, फिर process env fallback) का उपयोग करके `gateway.auth.token` SecretRefs resolve करते हैं।
    - यदि token auth effectively active नहीं है (explicit `gateway.auth.mode` of `password`/`none`/`trusted-proxy`, या mode unset जहां password win कर सकता है और कोई token candidate win नहीं कर सकता), तो token-drift checks config token resolution छोड़ देते हैं।

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` "debug everything" command है। यह हमेशा probe करता है:

- आपका configured remote gateway (यदि set है), और
- localhost (loopback) **भले ही remote configured हो**।

यदि आप `--url` pass करते हैं, तो वह explicit target दोनों से पहले जोड़ दिया जाता है। Human output targets को इस प्रकार label करता है:

- `URL (explicit)`
- `Remote (configured)` या `Remote (configured, inactive)`
- `Local loopback`

<Note>
यदि multiple probe targets reachable हैं, तो यह उन सभी को print करता है। SSH tunnel, TLS/proxy URL, और configured remote URL सभी उसी gateway की ओर point कर सकते हैं, भले ही उनके transport ports अलग हों; `multiple_gateways` distinct या identity-ambiguous reachable gateways के लिए reserved है। Multiple gateways supported हैं जब आप isolated profiles (जैसे, rescue bot) use करते हैं, लेकिन अधिकतर installs फिर भी एक single gateway चलाते हैं।
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  local loopback probe target और SSH tunnel remote port के लिए यह port उपयोग करें। `--url` के बिना, यह configured gateway environment URL, environment port, या remote targets के बजाय local loopback target चुनता है।
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` का मतलब है कि कम से कम एक target ने WebSocket connect accept किया।
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` report करता है कि probe auth के बारे में क्या prove कर सकी। यह reachability से अलग है।
    - `Read probe: ok` का मतलब है कि read-scope detail RPC calls (`health`/`status`/`system-presence`/`config.get`) भी सफल हुईं।
    - `Read probe: limited - missing scope: operator.read` का मतलब है कि connect सफल हुआ लेकिन read-scope RPC limited है। इसे **degraded** reachability के रूप में report किया जाता है, full failure के रूप में नहीं।
    - `Connect: ok` के बाद `Read probe: failed` का मतलब है कि Gateway ने WebSocket connection accept किया, लेकिन follow-up read diagnostics timed out या failed। यह भी **degraded** reachability है, unreachable Gateway नहीं।
    - `gateway status` की तरह, probe existing cached device auth reuse करता है लेकिन first-time device identity या pairing state create नहीं करता।
    - Exit code non-zero केवल तब होता है जब कोई probed target reachable नहीं है।

  </Accordion>
  <Accordion title="JSON output">
    Top level:

    - `ok`: कम से कम एक target reachable है।
    - `degraded`: कम से कम एक target ने connection accept किया लेकिन full detail RPC diagnostics complete नहीं किए।
    - `capability`: reachable targets में देखी गई best capability (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope`, या `unknown`)।
    - `primaryTargetId`: इस order में active winner मानने के लिए best target: explicit URL, SSH tunnel, configured remote, फिर local loopback।
    - `warnings[]`: `code`, `message`, और optional `targetIds` के साथ best-effort warning records।
    - `network`: current config और host networking से निकाले गए local loopback/tailnet URL hints।
    - `discovery.timeoutMs` और `discovery.count`: इस probe pass के लिए इस्तेमाल किया गया actual discovery budget/result count।

    Per target (`targets[].connect`):

    - `ok`: connect + degraded classification के बाद reachability।
    - `rpcOk`: full detail RPC success।
    - `scopeLimited`: missing operator scope के कारण detail RPC failed।

    Per target (`targets[].auth`):

    - `role`: उपलब्ध होने पर `hello-ok` में report की गई auth role।
    - `scopes`: उपलब्ध होने पर `hello-ok` में report किए गए granted scopes।
    - `capability`: उस target के लिए surfaced auth capability classification।

  </Accordion>
  <Accordion title="Common warning codes">
    - `ssh_tunnel_failed`: SSH tunnel setup failed; command direct probes पर fall back हो गया।
    - `multiple_gateways`: distinct gateway identities reachable थीं, या OpenClaw यह prove नहीं कर सका कि reachable targets वही gateway हैं। उसी gateway के लिए SSH tunnel, proxy URL, या configured remote URL यह warning trigger नहीं करता।
    - `auth_secretref_unresolved`: failed target के लिए configured auth SecretRef resolve नहीं हो सका।
    - `probe_scope_limited`: WebSocket connect सफल हुआ, लेकिन read probe missing `operator.read` से limited थी।

  </Accordion>
</AccordionGroup>

#### Remote over SSH (Mac app parity)

macOS app का "Remote over SSH" mode local port-forward का उपयोग करता है ताकि remote gateway (जो केवल loopback से bound हो सकता है) `ws://127.0.0.1:<port>` पर reachable हो जाए।

CLI equivalent:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` या `user@host:port` (port defaults to `22`)।
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Identity file।
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  resolved discovery endpoint (`local.` plus the configured wide-area domain, if any) से पहले discovered gateway host को SSH target के रूप में चुनें। TXT-only hints ignored हैं।
</ParamField>

Config (optional, used as defaults):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Low-level RPC helper।

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  params के लिए JSON object string।
</ParamField>
<ParamField path="--url <url>" type="string">
  Gateway WebSocket URL।
</ParamField>
<ParamField path="--token <token>" type="string">
  Gateway token।
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway password।
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  Timeout budget।
</ParamField>
<ParamField path="--expect-final" type="boolean">
  मुख्य रूप से agent-style RPCs के लिए जो final payload से पहले intermediate events stream करते हैं।
</ParamField>
<ParamField path="--json" type="boolean">
  Machine-readable JSON output।
</ParamField>

<Note>
`--params` valid JSON होना चाहिए।
</Note>

## Gateway service प्रबंधित करें

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### wrapper के साथ इंस्टॉल करें

जब managed service को किसी दूसरे executable के माध्यम से शुरू करना हो, जैसे secrets manager shim या run-as helper, तब `--wrapper` का उपयोग करें। wrapper को सामान्य Gateway args मिलते हैं और अंततः उन args के साथ `openclaw` या Node को exec करने की ज़िम्मेदारी उसी की होती है।

```bash
cat > ~/.local/bin/openclaw-doppler <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec doppler run --project my-project --config production -- openclaw "$@"
EOF
chmod +x ~/.local/bin/openclaw-doppler

openclaw gateway install --wrapper ~/.local/bin/openclaw-doppler --force
openclaw gateway restart
```

आप environment के माध्यम से भी wrapper सेट कर सकते हैं। `gateway install` सत्यापित करता है कि path एक executable file है, wrapper को service `ProgramArguments` में लिखता है, और बाद के forced reinstalls, updates, और doctor repairs के लिए service environment में `OPENCLAW_WRAPPER` को बनाए रखता है।

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

बनाए रखे गए wrapper को हटाने के लिए, reinstall करते समय `OPENCLAW_WRAPPER` खाली करें:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Command options">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Lifecycle behavior">
    - managed service को restart करने के लिए `gateway restart` का उपयोग करें। restart substitute के रूप में `gateway stop` और `gateway start` को chain न करें।
    - macOS पर, `gateway stop` default रूप से `launchctl bootout` का उपयोग करता है, जो disable को बनाए रखे बिना current boot session से LaunchAgent को हटाता है — KeepAlive auto-recovery future crashes के लिए active रहती है और `gateway start` manual `launchctl enable` के बिना cleanly re-enable करता है। KeepAlive और RunAtLoad को persistently suppress करने के लिए `--disable` पास करें, ताकि gateway अगले explicit `gateway start` तक respawn न हो; इसका उपयोग तब करें जब manual stop को reboots या system restarts के बाद भी बना रहना चाहिए।
    - `gateway restart --safe` running Gateway से active work को preflight करने और active work drain होने के बाद एक coalesced restart schedule करने को कहता है। default safe restart configured `gateway.reload.deferralTimeoutMs` (default 5 minutes) तक active work की प्रतीक्षा करता है; जब वह budget समाप्त हो जाता है, restart forced होता है। ऐसे indefinite safe wait के लिए जो कभी force नहीं करता, `gateway.reload.deferralTimeoutMs` को `0` पर सेट करें। `--safe` को `--force` या `--wait` के साथ combine नहीं किया जा सकता।
    - `gateway restart --wait 30s` उस restart के लिए configured restart drain budget को override करता है। bare numbers milliseconds होते हैं; `s`, `m`, और `h` जैसी units स्वीकार की जाती हैं। `--wait 0` indefinite प्रतीक्षा करता है।
    - `gateway restart --safe --skip-deferral` OpenClaw-aware safe restart चलाता है लेकिन deferral gate को bypass करता है, ताकि blockers report होने पर भी Gateway restart तुरंत emit करे। stuck-task-run deferrals के लिए operator escape hatch; `--safe` आवश्यक है।
    - `gateway restart --force` active-work drain को skip करता है और तुरंत restart करता है। इसका उपयोग तब करें जब operator listed task blockers का पहले ही inspection कर चुका हो और gateway को अभी वापस चाहता हो।
    - Lifecycle commands scripting के लिए `--json` स्वीकार करते हैं।

  </Accordion>
  <Accordion title="Auth and SecretRefs at install time">
    - जब token auth को token की आवश्यकता होती है और `gateway.auth.token` SecretRef-managed है, तो `gateway install` सत्यापित करता है कि SecretRef resolvable है, लेकिन resolved token को service environment metadata में persist नहीं करता।
    - यदि token auth को token की आवश्यकता है और configured token SecretRef unresolved है, तो install fallback plaintext persist करने के बजाय fail closed होता है।
    - `gateway run` पर password auth के लिए inline `--password` के बजाय `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, या SecretRef-backed `gateway.auth.password` को प्राथमिकता दें।
    - inferred auth mode में, shell-only `OPENCLAW_GATEWAY_PASSWORD` install token requirements को relax नहीं करता; managed service install करते समय durable config (`gateway.auth.password` या config `env`) का उपयोग करें।
    - यदि `gateway.auth.token` और `gateway.auth.password` दोनों configured हैं और `gateway.auth.mode` unset है, तो install तब तक blocked रहता है जब तक mode explicit रूप से set न हो।

  </Accordion>
</AccordionGroup>

## gateways खोजें (Bonjour)

`gateway discover` Gateway beacons (`_openclaw-gw._tcp`) के लिए scan करता है।

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): कोई domain चुनें (example: `openclaw.internal.`) और split DNS + DNS server setup करें; [Bonjour](/hi/gateway/bonjour) देखें।

सिर्फ वे gateways जिनमें Bonjour discovery enabled है (default), beacon advertise करते हैं।

Wide-area discovery records में ये TXT hints शामिल हो सकते हैं:

- `role` (gateway role hint)
- `transport` (transport hint, e.g. `gateway`)
- `gatewayPort` (WebSocket port, usually `18789`)
- `sshPort` (सिर्फ full discovery mode; जब यह absent होता है तो clients default SSH targets को `22` पर रखते हैं)
- `tailnetDns` (MagicDNS hostname, जब available हो)
- `gatewayTls` / `gatewayTlsSha256` (TLS enabled + cert fingerprint)
- `cliPath` (सिर्फ full discovery mode)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Per-command timeout (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  Machine-readable output (styling/spinner को भी disable करता है).
</ParamField>

Examples:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI `local.` और configured wide-area domain को scan करता है, जब कोई enabled हो।
- JSON output में `wsUrl` resolved service endpoint से derived होता है, `lanHost` या `tailnetDns` जैसे TXT-only hints से नहीं।
- `local.` mDNS और wide-area DNS-SD पर, `sshPort` और `cliPath` केवल तब published होते हैं जब `discovery.mdns.mode` `full` हो।

</Note>

## संबंधित

- [CLI reference](/hi/cli)
- [Gateway runbook](/hi/gateway)

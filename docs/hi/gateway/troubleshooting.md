---
read_when:
    - समस्या निवारण हब ने आपको गहन निदान के लिए यहां भेजा है
    - आपको सटीक कमांडों के साथ स्थिर लक्षण-आधारित रनबुक सेक्शन चाहिए
sidebarTitle: Troubleshooting
summary: Gateway, चैनल, ऑटोमेशन, नोड्स, और ब्राउज़र के लिए गहन समस्या-निवारण रनबुक
title: समस्या निवारण
x-i18n:
    generated_at: "2026-06-28T23:15:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ce8e8aed5c3e00be5b093875222962c22883472802e164534dae32adc5365c5
    source_path: gateway/troubleshooting.md
    workflow: 16
---

यह पेज विस्तृत रनबुक है। अगर आप पहले तेज़ ट्रायाज फ़्लो चाहते हैं, तो [/help/troubleshooting](/hi/help/troubleshooting) से शुरू करें।

## कमांड क्रम

पहले इन्हें इसी क्रम में चलाएँ:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

अपेक्षित स्वस्थ संकेत:

- `openclaw gateway status` में `Runtime: running`, `Connectivity probe: ok`, और `Capability: ...` लाइन दिखती है।
- `openclaw doctor` कोई अवरोधक कॉन्फ़िगरेशन/सेवा समस्या रिपोर्ट नहीं करता।
- `openclaw channels status --probe` हर खाते के लिए लाइव ट्रांसपोर्ट स्थिति दिखाता है और, जहाँ समर्थित हो, `works` या `audit ok` जैसे probe/audit परिणाम दिखाता है।

## अपडेट के बाद

इसे तब उपयोग करें जब अपडेट पूरा हो जाए लेकिन Gateway डाउन हो, चैनल खाली हों, या
मॉडल कॉल 401 के साथ विफल होने लगें।

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

देखें:

- `openclaw status` / `openclaw status --all` में `Update restart`। लंबित या
  विफल handoff में चलाने के लिए अगला कमांड शामिल होता है।
- Channels के अंतर्गत `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`।
  इसका अर्थ है कि चैनल कॉन्फ़िगरेशन अभी भी मौजूद है, लेकिन चैनल लोड होने से पहले Plugin
  रजिस्ट्रेशन विफल हो गया।
- दोबारा auth के बाद provider 401। `openclaw doctor --fix` पुराने
  प्रति-agent OAuth auth shadow की जाँच करता है और पुरानी प्रतियाँ हटाता है ताकि सभी agents
  वर्तमान साझा profile resolve करें।

## Split brain installs और नया कॉन्फ़िगरेशन guard

इसे तब उपयोग करें जब अपडेट के बाद gateway सेवा अप्रत्याशित रूप से बंद हो जाए, या logs दिखाएँ कि कोई `openclaw` binary उस version से पुरानी है जिसने आख़िरी बार `openclaw.json` लिखा था।

OpenClaw कॉन्फ़िगरेशन writes पर `meta.lastTouchedVersion` की मुहर लगाता है। Read-only commands अब भी नए OpenClaw द्वारा लिखे गए कॉन्फ़िगरेशन को inspect कर सकते हैं, लेकिन process और service mutations पुराने binary से आगे बढ़ने से मना कर देते हैं। अवरुद्ध actions में gateway service start, stop, restart, uninstall, forced service reinstall, service-mode gateway startup, और `gateway --force` port cleanup शामिल हैं।

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="PATH ठीक करें">
    `PATH` ठीक करें ताकि `openclaw` नए install पर resolve हो, फिर action दोबारा चलाएँ।
  </Step>
  <Step title="gateway service को दोबारा install करें">
    नए install से इच्छित gateway service को दोबारा install करें:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="पुराने wrappers हटाएँ">
    पुराने system package या पुराने wrapper entries हटाएँ जो अब भी पुराने `openclaw` binary की ओर point करते हैं।
  </Step>
</Steps>

<Warning>
केवल जानबूझकर downgrade या emergency recovery के लिए, single command के लिए `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` सेट करें। सामान्य संचालन के लिए इसे unset रखें।
</Warning>

## rollback के बाद protocol mismatch

इसे तब उपयोग करें जब OpenClaw downgrade या roll back करने के बाद logs में `protocol mismatch` लगातार print हो रहा हो। इसका अर्थ है कि पुराना Gateway चल रहा है, लेकिन कोई नया local client process अभी भी ऐसे protocol range के साथ reconnect करने की कोशिश कर रहा है जिसे पुराना Gateway बोल नहीं सकता।

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

देखें:

- Gateway logs में `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>`।
- `openclaw gateway status --deep` में `Established clients:` या `openclaw doctor --deep` में `Gateway clients`। यह Gateway port से जुड़े active TCP clients सूचीबद्ध करता है, जिनमें OS अनुमति दे तो PIDs और command lines भी शामिल होते हैं।
- कोई client process जिसकी command line उस नए OpenClaw install या wrapper की ओर point करती है जिससे आपने roll back किया था।

ठीक करें:

1. `gateway status --deep` द्वारा दिखाए गए stale OpenClaw client process को stop या restart करें।
2. OpenClaw embed करने वाले apps या wrappers restart करें, जैसे local dashboards, editors, app-server helpers, या लंबे समय तक चलने वाले `openclaw logs --follow` shells।
3. `openclaw gateway status --deep` या `openclaw doctor --deep` दोबारा चलाएँ और पुष्टि करें कि stale client PID चला गया है।

पुराने Gateway को नया incompatible protocol स्वीकार कराने की कोशिश न करें। Protocol bumps wire contract की रक्षा करते हैं; rollback recovery process/version cleanup की समस्या है।

## Skill symlink path escape के रूप में छोड़ा गया

इसे तब उपयोग करें जब logs में यह शामिल हो:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw हर skill root को containment boundary मानता है। `~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills`, या
`~/.openclaw/skills` के अंतर्गत symlink तब छोड़ा जाता है जब उसका real target उस root के बाहर resolve हो,
जब तक target स्पष्ट रूप से trusted न हो।

link inspect करें:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

यदि target intentional है, तो direct skill root और
allowed symlink target दोनों configure करें:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

फिर नया session शुरू करें या skills watcher के refresh होने की प्रतीक्षा करें। यदि running process config change से पहले का है, तो
gateway restart करें।

`~`, `/`, या पूरे synced project folder जैसे broad targets का उपयोग न करें।
`allowSymlinkTargets` को उस वास्तविक skill root तक scoped रखें जिसमें trusted
`SKILL.md` directories हैं।

यदि Skill Workshop apply को उन trusted symlinked
workspace skill paths के माध्यम से भी write करना चाहिए, तो `skills.workshop.allowSymlinkTargetWrites` enable करें। इसे
read-only shared skill roots के लिए disabled रखें।

संबंधित:

- [Skills config](/hi/tools/skills-config#symlinked-skill-roots)
- [Configuration examples](/hi/gateway/configuration-examples#symlinked-sibling-skill-repo)

## लंबे context के लिए Anthropic 429 extra usage required

इसे तब उपयोग करें जब logs/errors में शामिल हो: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`।

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

देखें:

- चुना गया Anthropic model GA-capable 1M Claude 4.x model है, या model में legacy `params.context1m: true` है।
- वर्तमान Anthropic credential long-context usage के लिए eligible नहीं है।
- Requests केवल उन long sessions/model runs पर fail होती हैं जिन्हें 1M context path चाहिए।

ठीक करने के विकल्प:

<Steps>
  <Step title="standard context window उपयोग करें">
    standard-window model पर switch करें, या पुराने
    model config से legacy `context1m` हटाएँ जो 1M context के लिए GA-capable नहीं है।
  </Step>
  <Step title="eligible credential उपयोग करें">
    ऐसा Anthropic credential उपयोग करें जो long-context requests के लिए eligible हो, या Anthropic API key पर switch करें।
  </Step>
  <Step title="fallback models configure करें">
    fallback models configure करें ताकि Anthropic long-context requests reject होने पर runs जारी रहें।
  </Step>
</Steps>

संबंधित:

- [Anthropic](/hi/providers/anthropic)
- [Token use and costs](/hi/reference/token-use)
- [मुझे Anthropic से HTTP 429 क्यों दिख रहा है?](/hi/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Upstream 403 blocked responses

इसे तब उपयोग करें जब upstream LLM provider generic `403` लौटाए, जैसे
`Your request was blocked`।

यह न मानें कि यह हमेशा OpenClaw configuration issue है। Response किसी upstream security layer से
आ सकता है, जैसे CDN, WAF, bot-management rule, या
OpenAI-compatible endpoint के सामने reverse proxy।

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

देखें:

- एक ही provider के अंतर्गत multiple models एक ही तरह fail हो रहे हों
- normal provider API error के बजाय HTML या generic security text
- उसी request time के provider-side security events
- एक छोटा direct `curl` probe सफल हो रहा हो जबकि normal SDK-shaped requests fail हों

जब evidence WAF/CDN block की ओर point करे, तो provider-side filtering पहले ठीक करें।
OpenClaw द्वारा उपयोग किए जाने वाले API path के लिए narrowly scoped allow या skip rule को प्राथमिकता दें,
और पूरी site के लिए protection disable करने से बचें।

<Warning>
सफल minimal `curl` यह guarantee नहीं करता कि real SDK-style requests भी
उसी upstream security layer से pass होंगी।
</Warning>

संबंधित:

- [OpenAI-compatible endpoints](/hi/gateway/configuration-reference#openai-compatible-endpoints)
- [Provider configuration](/hi/providers)
- [Logs](/hi/logging)

## Local OpenAI-compatible backend direct probes pass करता है लेकिन agent runs fail होते हैं

इसे तब उपयोग करें जब:

- `curl ... /v1/models` काम करता है
- छोटे direct `/v1/chat/completions` calls काम करते हैं
- OpenClaw model runs केवल normal agent turns पर fail होते हैं

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

देखें:

- direct छोटे calls succeed होते हैं, लेकिन OpenClaw runs केवल larger prompts पर fail होते हैं
- `model_not_found` या 404 errors, भले ही direct `/v1/chat/completions`
  उसी bare model id के साथ काम करता हो
- backend errors कि `messages[].content` string expect कर रहा है
- OpenAI-compatible local backend के साथ intermittent `incomplete turn detected ... stopReason=stop payloads=0` warnings
- backend crashes जो केवल larger prompt-token counts या full agent runtime prompts के साथ दिखते हैं

<AccordionGroup>
  <Accordion title="सामान्य signatures">
    - local MLX/vLLM-style server के साथ `model_not_found` → verify करें कि `baseUrl` में `/v1` शामिल है, `/v1/chat/completions` backends के लिए `api` `"openai-completions"` है, और `models.providers.<provider>.models[].id` bare provider-local id है। इसे provider prefix के साथ एक बार select करें, उदाहरण के लिए `mlx/mlx-community/Qwen3-30B-A3B-6bit`; catalog entry को `mlx-community/Qwen3-30B-A3B-6bit` रखें।
    - `messages[...].content: invalid type: sequence, expected a string` → backend structured Chat Completions content parts reject करता है। Fix: `models.providers.<provider>.models[].compat.requiresStringContent: true` सेट करें।
    - `validation.keys` या allowed message keys जैसे `["role","content"]` → backend Chat Completions messages पर OpenAI-style replay metadata reject करता है। Fix: `models.providers.<provider>.models[].compat.strictMessageKeys: true` सेट करें।
    - `incomplete turn detected ... stopReason=stop payloads=0` → backend ने Chat Completions request complete की लेकिन उस turn के लिए कोई user-visible assistant text नहीं लौटाया। OpenClaw खाली OpenAI-compatible turns को replay-safe रूप में एक बार retry करता है; persistent failures का आमतौर पर मतलब है कि backend empty/non-text content emit कर रहा है या final-answer text suppress कर रहा है।
    - direct छोटे requests succeed होते हैं, लेकिन OpenClaw agent runs backend/model crashes के साथ fail होते हैं (उदाहरण के लिए कुछ `inferrs` builds पर Gemma) → OpenClaw transport संभवतः पहले से सही है; backend larger agent-runtime prompt shape पर fail हो रहा है।
    - tools disable करने के बाद failures घटते हैं लेकिन गायब नहीं होते → tool schemas pressure का हिस्सा थे, लेकिन बाकी issue अब भी upstream model/server capacity या backend bug है।

  </Accordion>
  <Accordion title="ठीक करने के विकल्प">
    1. string-only Chat Completions backends के लिए `compat.requiresStringContent: true` सेट करें।
    2. strict Chat Completions backends के लिए `compat.strictMessageKeys: true` सेट करें जो हर message पर केवल `role` और `content` accept करते हैं।
    3. उन models/backends के लिए `compat.supportsTools: false` सेट करें जो OpenClaw के tool schema surface को भरोसेमंद ढंग से handle नहीं कर सकते।
    4. जहाँ संभव हो prompt pressure घटाएँ: छोटा workspace bootstrap, छोटी session history, हल्का local model, या stronger long-context support वाला backend।
    5. यदि छोटे direct requests pass होते रहते हैं जबकि OpenClaw agent turns अब भी backend के भीतर crash करते हैं, तो इसे upstream server/model limitation मानें और accepted payload shape के साथ वहाँ repro file करें।
  </Accordion>
</AccordionGroup>

संबंधित:

- [कॉन्फ़िगरेशन](/hi/gateway/configuration)
- [स्थानीय मॉडल](/hi/gateway/local-models)
- [OpenAI-संगत एंडपॉइंट](/hi/gateway/configuration-reference#openai-compatible-endpoints)

## कोई जवाब नहीं

अगर चैनल चालू हैं लेकिन कोई उत्तर नहीं देता, तो कुछ भी दोबारा कनेक्ट करने से पहले रूटिंग और नीति जांचें।

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

देखें:

- DM भेजने वालों के लिए पेयरिंग लंबित है।
- समूह मेंशन गेटिंग (`requireMention`, `mentionPatterns`)।
- चैनल/समूह allowlist में असंगति।

सामान्य संकेत:

- `drop guild message (mention required` → मेंशन तक समूह संदेश अनदेखा किया गया।
- `pairing request` → भेजने वाले को अनुमोदन चाहिए।
- `blocked` / `allowlist` → भेजने वाला/चैनल नीति से फ़िल्टर किया गया था।

संबंधित:

- [चैनल समस्या निवारण](/hi/channels/troubleshooting)
- [समूह](/hi/channels/groups)
- [पेयरिंग](/hi/channels/pairing)

## डैशबोर्ड कंट्रोल UI कनेक्टिविटी

जब डैशबोर्ड/कंट्रोल UI कनेक्ट न हो, तो URL, प्रमाणीकरण मोड, और सुरक्षित संदर्भ संबंधी मान्यताओं की पुष्टि करें।

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

देखें:

- सही probe URL और dashboard URL।
- क्लाइंट और Gateway के बीच प्रमाणीकरण मोड/टोकन असंगति।
- जहां डिवाइस पहचान आवश्यक है, वहां HTTP उपयोग।

अगर अपडेट के बाद स्थानीय ब्राउज़र `127.0.0.1:18789` से कनेक्ट नहीं हो सकता, तो पहले
स्थानीय Gateway सेवा को पुनर्प्राप्त करें और पुष्टि करें कि वह डैशबोर्ड सर्व कर रही है:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

अगर `curl` OpenClaw HTML लौटाता है, तो Gateway काम कर रहा है और बाकी समस्या
शायद ब्राउज़र कैश, कोई पुराना डीप लिंक, या पुरानी टैब स्थिति है। सीधे
`http://127.0.0.1:18789` खोलें और डैशबोर्ड से नेविगेट करें। अगर restart
से सेवा चालू नहीं रहती, तो `openclaw gateway start` चलाएं और फिर से
`openclaw gateway status` जांचें।

<AccordionGroup>
  <Accordion title="कनेक्ट / प्रमाणीकरण संकेत">
    - `device identity required` → असुरक्षित संदर्भ या डिवाइस प्रमाणीकरण गायब।
    - `origin not allowed` → ब्राउज़र `Origin` `gateway.controlUi.allowedOrigins` में नहीं है (या आप स्पष्ट allowlist के बिना non-loopback ब्राउज़र origin से कनेक्ट कर रहे हैं)।
    - `device nonce required` / `device nonce mismatch` → क्लाइंट चुनौती-आधारित डिवाइस प्रमाणीकरण फ्लो पूरा नहीं कर रहा है (`connect.challenge` + `device.nonce`)।
    - `device signature invalid` / `device signature expired` → क्लाइंट ने मौजूदा हैंडशेक के लिए गलत payload (या पुराना timestamp) साइन किया।
    - `AUTH_TOKEN_MISMATCH` के साथ `canRetryWithDeviceToken=true` → क्लाइंट cached device token के साथ एक भरोसेमंद retry कर सकता है।
    - वह cached-token retry paired device token के साथ संग्रहित cached scope set का फिर से उपयोग करता है। स्पष्ट `deviceToken` / स्पष्ट `scopes` callers इसके बजाय अपना अनुरोधित scope set रखते हैं।
    - `AUTH_SCOPE_MISMATCH` → device token पहचाना गया, लेकिन उसके स्वीकृत scopes इस connect request को कवर नहीं करते; साझा gateway token घुमाने के बजाय फिर से pair करें या अनुरोधित scope contract अनुमोदित करें।
    - उस retry path के बाहर, connect auth precedence पहले स्पष्ट shared token/password है, फिर स्पष्ट `deviceToken`, फिर संग्रहित device token, फिर bootstrap token।
    - async Tailscale Serve Control UI path पर, उसी `{scope, ip}` के लिए विफल प्रयासों को limiter द्वारा विफलता रिकॉर्ड करने से पहले serial किया जाता है। इसलिए उसी client से दो खराब concurrent retries दूसरे प्रयास पर दो सामान्य mismatches के बजाय `retry later` दिखा सकती हैं।
    - ब्राउज़र-origin loopback client से `too many failed authentication attempts (retry later)` → उसी normalized `Origin` से दोहराई गई विफलताएं अस्थायी रूप से locked out हैं; दूसरा localhost origin अलग bucket उपयोग करता है।
    - उस retry के बाद बार-बार `unauthorized` → shared token/device token drift; token config refresh करें और जरूरत हो तो device token को फिर से approve/rotate करें।
    - `gateway connect failed:` → गलत host/port/url target।

  </Accordion>
</AccordionGroup>

### प्रमाणीकरण detail codes quick map

अगली कार्रवाई चुनने के लिए विफल `connect` response से `error.details.code` का उपयोग करें:

| Detail code                  | अर्थ                                                                                                                                                                                      | अनुशंसित कार्रवाई                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | क्लाइंट ने आवश्यक shared token नहीं भेजा।                                                                                                                                                 | क्लाइंट में token paste/set करें और retry करें। डैशबोर्ड paths के लिए: `openclaw config get gateway.auth.token` फिर Control UI settings में paste करें।                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Shared token gateway auth token से मेल नहीं खाया।                                                                                                                                               | अगर `canRetryWithDeviceToken=true` है, तो एक trusted retry की अनुमति दें। Cached-token retries संग्रहित approved scopes का फिर से उपयोग करती हैं; स्पष्ट `deviceToken` / `scopes` callers requested scopes रखते हैं। अगर अभी भी विफल हो, तो [token drift recovery checklist](/hi/cli/devices#token-drift-recovery-checklist) चलाएं। |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Cached per-device token पुराना या revoked है।                                                                                                                                                 | [devices CLI](/hi/cli/devices) का उपयोग करके device token rotate/re-approve करें, फिर reconnect करें।                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | Device token valid है, लेकिन उसकी approved role/scopes इस connect request को कवर नहीं करतीं।                                                                                                       | Device को re-pair करें या requested scope contract approve करें; इसे shared-token drift न मानें।                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | Device identity को approval चाहिए। `not-paired`, `scope-upgrade`, `role-upgrade`, या `metadata-upgrade` के लिए `error.details.reason` जांचें, और मौजूद होने पर `requestId` / `remediationHint` का उपयोग करें। | Pending request approve करें: `openclaw devices list` फिर `openclaw devices approve <requestId>`। Requested access की समीक्षा के बाद scope/role upgrades भी यही flow उपयोग करते हैं।                                                                                                               |

<Note>
Shared gateway token/password से authenticated direct loopback backend RPCs को CLI के paired-device scope baseline पर निर्भर नहीं होना चाहिए। अगर subagents या अन्य internal calls अब भी `scope-upgrade` के साथ fail होती हैं, तो verify करें कि caller `client.id: "gateway-client"` और `client.mode: "backend"` उपयोग कर रहा है और कोई explicit `deviceIdentity` या device token force नहीं कर रहा है।
</Note>

Device auth v2 migration check:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

अगर logs nonce/signature errors दिखाते हैं, तो connecting client को update करें और verify करें:

<Steps>
  <Step title="connect.challenge की प्रतीक्षा करें">
    Client gateway-issued `connect.challenge` की प्रतीक्षा करता है।
  </Step>
  <Step title="payload sign करें">
    Client challenge-bound payload sign करता है।
  </Step>
  <Step title="device nonce भेजें">
    Client उसी challenge nonce के साथ `connect.params.device.nonce` भेजता है।
  </Step>
</Steps>

अगर `openclaw devices rotate` / `revoke` / `remove` अप्रत्याशित रूप से denied है:

- paired-device token sessions केवल **अपने** device को manage कर सकते हैं, जब तक caller के पास `operator.admin` भी न हो
- `openclaw devices rotate --scope ...` केवल वही operator scopes request कर सकता है जो caller session के पास पहले से हैं

संबंधित:

- [कॉन्फ़िगरेशन](/hi/gateway/configuration) (gateway auth modes)
- [Control UI](/hi/web/control-ui)
- [Devices](/hi/cli/devices)
- [Remote access](/hi/gateway/remote)
- [Trusted proxy auth](/hi/gateway/trusted-proxy-auth)

## Gateway सेवा नहीं चल रही

इसका उपयोग तब करें जब सेवा installed हो लेकिन process चालू न रहे।

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

देखें:

- exit hints के साथ `Runtime: stopped`।
- Service config mismatch (`Config (cli)` बनाम `Config (service)`)।
- Port/listener conflicts।
- `--deep` उपयोग होने पर अतिरिक्त launchd/systemd/schtasks installs।
- `Other gateway-like services detected (best effort)` cleanup hints।

<AccordionGroup>
  <Accordion title="सामान्य संकेत">
    - `Gateway start blocked: set gateway.mode=local` या `existing config is missing gateway.mode` → local gateway mode enabled नहीं है, या config file clobber होकर `gateway.mode` खो चुकी है। Fix: अपने config में `gateway.mode="local"` set करें, या expected local-mode config restamp करने के लिए `openclaw onboard --mode local` / `openclaw setup` दोबारा चलाएं। अगर आप Podman के जरिए OpenClaw चला रहे हैं, तो default config path `~/.openclaw/openclaw.json` है।
    - `refusing to bind gateway ... without auth` → valid gateway auth path (token/password, या configured होने पर trusted-proxy) के बिना non-loopback bind।
    - `another gateway instance is already listening` / `EADDRINUSE` → port conflict।
    - `Other gateway-like services detected (best effort)` → stale या parallel launchd/systemd/schtasks units मौजूद हैं। अधिकांश setups को प्रति machine एक gateway रखना चाहिए; अगर आपको एक से अधिक चाहिए, तो ports + config/state/workspace isolate करें। देखें [/gateway#multiple-gateways-same-host](/hi/gateway#multiple-gateways-same-host)।
    - doctor से `System-level OpenClaw gateway service detected` → user-level service missing होने पर systemd system unit मौजूद है। Doctor को user service install करने देने से पहले duplicate हटाएं या disable करें, या अगर system unit intended supervisor है तो `OPENCLAW_SERVICE_REPAIR_POLICY=external` set करें।
    - `Gateway service port does not match current gateway config` → installed supervisor अभी भी पुराने `--port` को pin करता है। `openclaw doctor --fix` या `openclaw gateway install --force` चलाएं, फिर gateway service restart करें।

  </Accordion>
</AccordionGroup>

संबंधित:

- [Background exec और process tool](/hi/gateway/background-process)
- [कॉन्फ़िगरेशन](/hi/gateway/configuration)
- [Doctor](/hi/gateway/doctor)

## macOS gateway चुपचाप response देना बंद कर देता है, फिर dashboard छूने पर resume करता है

इसका उपयोग तब करें जब macOS host पर channels (Telegram, WhatsApp, आदि) कई मिनटों से घंटों तक शांत हो जाते हैं, और gateway Control UI खोलते ही, SSH करते ही, या host से किसी और तरह interact करते ही वापस आता दिखता है। आमतौर पर `openclaw status` में कोई स्पष्ट symptom नहीं होता क्योंकि जब तक आप देखते हैं gateway फिर से alive हो चुका होता है।

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

इनकी तलाश करें:

- `~/.openclaw/logs/stability/` में एक या अधिक `*-uncaught_exception.json` बंडल, जिनमें `error.code` किसी अस्थायी नेटवर्क कोड जैसे `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH`, या `ECONNREFUSED` पर सेट हो।
- `pmset -g log` की ऐसी पंक्तियां जैसे `Entering Sleep state due to 'Maintenance Sleep'` या `en0 driver is slow (msg: WillChangeState to 0)`, जो क्रैश टाइमस्टैम्प से मेल खाती हों। Power Nap / Maintenance Sleep वाई-फाई ड्राइवर को थोड़ी देर के लिए state 0 में डाल देता है; उस विंडो में पहुंचने वाला कोई भी आउटबाउंड `connect()` `ENETDOWN` के साथ विफल हो सकता है, भले ही होस्ट पर अन्यथा पूरी नेटवर्क कनेक्टिविटी हो।
- `launchctl print` आउटपुट जिसमें कई हालिया `runs` और एक एग्जिट कोड के साथ `state = not running` दिखे, खासकर जब क्रैश और अगले लॉन्च के बीच का अंतर सेकंड के बजाय लगभग एक घंटे का हो। macOS launchd क्रैश बर्स्ट के बाद एक अदस्तावेजीकृत respawn-protection gate लागू करता है, जो `KeepAlive=true` का सम्मान करना तब तक बंद कर सकता है जब तक कोई बाहरी ट्रिगर, जैसे इंटरैक्टिव लॉगिन, डैशबोर्ड कनेक्शन, या `launchctl kickstart`, उसे फिर से सक्रिय न करे।

सामान्य संकेत:

- ऐसा stability बंडल जिसका `error.code` `ENETDOWN` या संबंधित कोड हो, और कॉल स्टैक Node `net` `lookupAndConnect` / `Socket.connect` की ओर संकेत करे। OpenClaw `2026.5.26` और उससे नए संस्करण इन्हें सौम्य अस्थायी नेटवर्क त्रुटियों के रूप में वर्गीकृत करते हैं, इसलिए ये अब टॉप-लेवल uncaught handler तक नहीं पहुंचतीं; अगर आप पुराने रिलीज पर हैं, तो पहले अपग्रेड करें।
- लंबी शांत अवधियां जो Control UI से कनेक्ट करते ही या होस्ट में SSH करते ही समाप्त हो जाती हैं: उपयोगकर्ता-दृश्यमान गतिविधि launchd के respawn gate को फिर से सक्रिय करती है, न कि डैशबोर्ड द्वारा Gateway के साथ किया गया कोई काम।
- दिन भर `runs` संख्या बढ़ना, लेकिन `~/Library/Logs/openclaw/gateway.log` में उसके अनुरूप `received SIG*; shutting down` पंक्ति न होना: साफ शटडाउन सिग्नल लॉग करते हैं; अस्थायी क्रैश ऐसा नहीं करते।

क्या करें:

1. अगर आप `2026.5.26` से पहले का रिलीज चला रहे हैं, तो **Gateway अपग्रेड करें**। अपग्रेड के बाद, भविष्य की `ENETDOWN` त्रुटियां प्रक्रिया समाप्त करने के बजाय चेतावनियों के रूप में लॉग होती हैं।
2. Mac mini / डेस्कटॉप होस्ट पर **maintenance sleep गतिविधि कम करें**, जिन्हें हमेशा-ऑन सर्वर के रूप में चलना है:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   यह अंतर्निहित ड्राइवर फ्लैप को काफी कम करता है, लेकिन पूरी तरह समाप्त नहीं करता। सिस्टम इन फ्लैग्स के बावजूद TCP keepalive और mDNS रखरखाव के लिए कुछ maintenance sleeps कर सकता है।

3. **एक liveness watchdog जोड़ें** ताकि भविष्य का क्रैश बर्स्ट, जिसे launchd पार्क कर दे, जल्दी पकड़ा जा सके:

   ```bash
   # Example launchd-aware liveness check, suitable for a 5-minute cron or LaunchAgent
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   उद्देश्य respawn gate को बाहरी रूप से फिर से सक्रिय करना है; macOS पर क्रैश बर्स्ट के बाद केवल `KeepAlive=true` पर्याप्त नहीं है।

संबंधित:

- [macOS प्लेटफॉर्म नोट्स](/hi/platforms/macos)
- [लॉगिंग](/hi/logging)
- [Doctor](/hi/gateway/doctor)

## अधिक मेमोरी उपयोग के दौरान Gateway बाहर निकलता है

इसका उपयोग तब करें जब Gateway लोड के दौरान गायब हो जाए, supervisor OOM-शैली restart रिपोर्ट करे, या लॉग में `critical memory pressure bundle written` का उल्लेख हो।

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

इनकी तलाश करें:

- नवीनतम stability बंडल में `Reason: diagnostic.memory.pressure.critical`।
- `critical/rss_threshold`, `critical/heap_threshold`, या `critical/rss_growth` के साथ `Memory pressure:`।
- heap सीमा के पास `V8 heap:` मान।
- `Largest session files:` प्रविष्टियां जैसे `agents/<agent>/sessions/<session>.jsonl` या `sessions/<session>.jsonl`।
- जब Gateway किसी container या memory-limited service के अंदर चलता है, तो Linux cgroup memory counters।

सामान्य संकेत:

- restart से थोड़ी देर पहले `critical memory pressure bundle written` दिखाई देता है → OpenClaw ने pre-OOM stability बंडल कैप्चर किया। इसे `openclaw gateway stability --bundle latest` से जांचें।
- Gateway लॉग में `memory pressure: level=critical ... memoryPressureSnapshot=disabled` दिखाई देता है → OpenClaw ने critical memory pressure पहचाना, लेकिन pre-OOM stability snapshot बंद है।
- `Largest session files:` बहुत बड़े redacted transcript path की ओर संकेत करता है → retained session history कम करें, session growth जांचें, या restart से पहले पुराने transcripts को active store से बाहर ले जाएं।
- `V8 heap:` used bytes heap सीमा के करीब हैं → prompt/session pressure कम करें, concurrent work घटाएं, या workload अपेक्षित होने की पुष्टि के बाद ही Node heap limit बढ़ाएं।
- `Memory pressure: critical/rss_growth` → एक sampling window के अंदर memory तेजी से बढ़ी। किसी बड़े import, runaway tool output, repeated retries, या queued agent work के batch के लिए नवीनतम लॉग जांचें।
- Critical memory pressure लॉग में दिखाई देता है लेकिन कोई बंडल मौजूद नहीं है → यह डिफॉल्ट है। भविष्य के critical memory pressure events पर pre-OOM stability बंडल कैप्चर करने के लिए `diagnostics.memoryPressureSnapshot: true` सेट करें।

stability बंडल payload-free है। इसमें operational memory evidence और redacted relative file paths शामिल होते हैं, message text, webhook bodies, credentials, tokens, cookies, या raw session ids नहीं। raw logs कॉपी करने के बजाय bug reports में diagnostics export अटैच करें।

संबंधित:

- [Gateway स्वास्थ्य](/hi/gateway/health)
- [Diagnostics export](/hi/gateway/diagnostics)
- [Sessions](/hi/cli/sessions)

## Gateway ने अमान्य config अस्वीकार किया

इसका उपयोग तब करें जब Gateway startup `Invalid config` के साथ विफल हो या hot reload logs कहें
कि उसने अमान्य edit छोड़ दिया।

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

इनकी तलाश करें:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- active config के पास timestamped `openclaw.json.rejected.*` file
- अगर `doctor --fix` ने broken direct edit repair किया है, तो timestamped `openclaw.json.clobbered.*` file
- OpenClaw प्रत्येक config path के लिए नवीनतम 32 `.clobbered.*` files रखता है और पुरानी files rotate करता है

<AccordionGroup>
  <Accordion title="क्या हुआ">
    - startup, hot reload, या OpenClaw-owned write के दौरान config validate नहीं हुआ।
    - Gateway startup `openclaw.json` को फिर से लिखने के बजाय fail closed करता है।
    - Hot reload अमान्य external edits को छोड़ देता है और current runtime config active रखता है।
    - OpenClaw-owned writes commit से पहले अमान्य/destructive payloads को reject करते हैं और `.rejected.*` save करते हैं।
    - `openclaw doctor --fix` repair का मालिक है। यह rejected payload को `.clobbered.*` के रूप में सुरक्षित रखते हुए non-JSON prefixes हटा सकता है या last-known-good copy restore कर सकता है।
    - जब एक config path के लिए कई repairs होते हैं, तो OpenClaw पुरानी `.clobbered.*` files rotate करता है ताकि newest repaired payload फिर भी उपलब्ध रहे।

  </Accordion>
  <Accordion title="जांचें और repair करें">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="सामान्य संकेत">
    - `.clobbered.*` मौजूद है → doctor ने active config repair करते समय broken external edit सुरक्षित रखा।
    - `.rejected.*` मौजूद है → OpenClaw-owned config write commit से पहले schema या clobber checks में विफल हुआ।
    - `Config write rejected:` → write ने required shape हटाने, file को बहुत कम करने, या invalid config persist करने की कोशिश की।
    - `config reload skipped (invalid config):` → direct edit validation में विफल हुआ और running Gateway ने उसे अनदेखा किया।
    - `Invalid config at ...` → Gateway services boot होने से पहले startup विफल हुआ।
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good`, या `size-drop-vs-last-good:*` → OpenClaw-owned write इसलिए reject हुआ क्योंकि उसने last-known-good backup की तुलना में fields या size खो दिया।
    - `Config last-known-good promotion skipped` → candidate में redacted secret placeholders जैसे `***` थे।

  </Accordion>
  <Accordion title="Fix विकल्प">
    1. doctor को prefixed/clobbered config repair करने या last-known-good restore करने देने के लिए `openclaw doctor --fix` चलाएं।
    2. `.clobbered.*` या `.rejected.*` से केवल intended keys कॉपी करें, फिर उन्हें `openclaw config set` या `config.patch` से apply करें।
    3. restart करने से पहले `openclaw config validate` चलाएं।
    4. अगर आप हाथ से edit करते हैं, तो पूरा JSON5 config रखें, केवल वह partial object नहीं जिसे आप बदलना चाहते थे।
  </Accordion>
</AccordionGroup>

संबंधित:

- [Config](/hi/cli/config)
- [Configuration: hot reload](/hi/gateway/configuration#config-hot-reload)
- [Configuration: strict validation](/hi/gateway/configuration#strict-validation)
- [Doctor](/hi/gateway/doctor)

## Gateway probe चेतावनियां

इसका उपयोग तब करें जब `openclaw gateway probe` किसी चीज तक पहुंचता है, लेकिन फिर भी warning block प्रिंट करता है।

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

इनकी तलाश करें:

- JSON output में `warnings[].code` और `primaryTargetId`।
- चेतावनी SSH fallback, multiple gateways, missing scopes, या unresolved auth refs के बारे में है या नहीं।

सामान्य संकेत:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH setup विफल हुआ, लेकिन command ने फिर भी direct configured/loopback targets आजमाए।
- `multiple reachable gateway identities detected` → अलग-अलग gateways ने उत्तर दिया, या OpenClaw यह साबित नहीं कर सका कि reachable targets वही Gateway हैं। उसी Gateway के लिए SSH tunnel, proxy URL, या configured remote URL को multiple transports वाला एक Gateway माना जाता है, भले ही transport ports अलग हों।
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → connect काम कर गया, लेकिन detail RPC scope-limited है; device identity pair करें या `operator.read` वाले credentials उपयोग करें।
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → connect काम कर गया, लेकिन पूरा diagnostic RPC set timed out या failed हुआ। इसे degraded diagnostics वाला reachable Gateway मानें; `--json` output में `connect.ok` और `connect.rpcOk` की तुलना करें।
- `Capability: pairing-pending` या `gateway closed (1008): pairing required` → Gateway ने उत्तर दिया, लेकिन इस client को normal operator access से पहले अभी pairing/approval चाहिए।
- unresolved `gateway.auth.*` / `gateway.remote.*` SecretRef warning text → failed target के लिए इस command path में auth material उपलब्ध नहीं था।

संबंधित:

- [Gateway](/hi/cli/gateway)
- [एक ही host पर multiple gateways](/hi/gateway#multiple-gateways-same-host)
- [Remote access](/hi/gateway/remote)

## Channel connected है, messages flow नहीं हो रहे

अगर channel state connected है लेकिन message flow बंद है, तो policy, permissions, और channel specific delivery rules पर ध्यान दें।

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

इनकी तलाश करें:

- DM policy (`pairing`, `allowlist`, `open`, `disabled`)।
- Group allowlist और mention requirements।
- Missing channel API permissions/scopes।

सामान्य संकेत:

- `mention required` → group mention policy ने message ignore किया।
- `pairing` / pending approval traces → sender approved नहीं है।
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → channel auth/permissions issue।

संबंधित:

- [Channel troubleshooting](/hi/channels/troubleshooting)
- [Discord](/hi/channels/discord)
- [Telegram](/hi/channels/telegram)
- [WhatsApp](/hi/channels/whatsapp)

## Cron और Heartbeat delivery

अगर Cron या Heartbeat नहीं चला या deliver नहीं हुआ, तो पहले scheduler state verify करें, फिर delivery target।

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

यह देखें:

- Cron सक्षम है और अगला wake मौजूद है।
- Job run history status (`ok`, `skipped`, `error`)।
- Heartbeat skip reasons (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`)।

<AccordionGroup>
  <Accordion title="सामान्य signatures">
    - `cron: scheduler disabled; jobs will not run automatically` → cron अक्षम है।
    - `cron: timer tick failed` → scheduler tick विफल हुआ; file/log/runtime त्रुटियां जांचें।
    - `heartbeat skipped` with `reason=quiet-hours` → सक्रिय घंटों की window के बाहर।
    - `heartbeat skipped` with `reason=empty-heartbeat-file` → `HEARTBEAT.md` मौजूद है, लेकिन इसमें केवल खाली, comment, header, fence, या empty-checklist scaffolding है, इसलिए OpenClaw model call को छोड़ देता है।
    - `heartbeat skipped` with `reason=no-tasks-due` → `HEARTBEAT.md` में `tasks:` block है, लेकिन इस tick पर कोई task due नहीं है।
    - `heartbeat: unknown accountId` → heartbeat delivery target के लिए अमान्य account id।
    - `heartbeat skipped` with `reason=dm-blocked` → heartbeat target DM-style destination में resolve हुआ, जबकि `agents.defaults.heartbeat.directPolicy` (या per-agent override) `block` पर set है।

  </Accordion>
</AccordionGroup>

संबंधित:

- [Heartbeat](/hi/gateway/heartbeat)
- [Scheduled tasks](/hi/automation/cron-jobs)
- [Scheduled tasks: समस्या निवारण](/hi/automation/cron-jobs#troubleshooting)

## Node paired है, tool विफल होता है

यदि कोई Node paired है लेकिन tools विफल होते हैं, तो foreground, permission, और approval state को अलग करके जांचें।

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

यह देखें:

- अपेक्षित capabilities के साथ Node online है।
- camera/mic/location/screen के लिए OS permission grants।
- Exec approvals और allowlist state।

सामान्य signatures:

- `NODE_BACKGROUND_UNAVAILABLE` → node app foreground में होना चाहिए।
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → OS permission मौजूद नहीं है।
- `SYSTEM_RUN_DENIED: approval required` → exec approval लंबित है।
- `SYSTEM_RUN_DENIED: allowlist miss` → command allowlist द्वारा blocked है।

संबंधित:

- [Exec approvals](/hi/tools/exec-approvals)
- [Node समस्या निवारण](/hi/nodes/troubleshooting)
- [Nodes](/hi/nodes/index)

## Browser tool विफल होता है

इसे तब उपयोग करें जब browser tool actions विफल हों, भले ही gateway स्वयं स्वस्थ हो।

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

यह देखें:

- क्या `plugins.allow` set है और उसमें `browser` शामिल है।
- मान्य browser executable path।
- CDP profile reachability।
- `existing-session` / `user` profiles के लिए local Chrome availability।

<AccordionGroup>
  <Accordion title="Plugin / executable signatures">
    - `unknown command "browser"` or `unknown command 'browser'` → bundled browser plugin को `plugins.allow` ने exclude कर दिया है।
    - browser tool missing / unavailable while `browser.enabled=true` → `plugins.allow` में `browser` शामिल नहीं है, इसलिए plugin कभी load नहीं हुआ।
    - `Failed to start Chrome CDP on port` → browser process launch होने में विफल रहा।
    - `browser.executablePath not found` → configured path अमान्य है।
    - `browser.cdpUrl must be http(s) or ws(s)` → configured CDP URL `file:` या `ftp:` जैसी unsupported scheme का उपयोग करता है।
    - `browser.cdpUrl has invalid port` → configured CDP URL में खराब या सीमा से बाहर port है।
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → मौजूदा gateway install में core browser runtime dependency नहीं है; OpenClaw को reinstall या update करें, फिर gateway restart करें। ARIA snapshots और basic page screenshots अब भी काम कर सकते हैं, लेकिन navigation, AI snapshots, CSS-selector element screenshots, और PDF export unavailable रहेंगे।

  </Accordion>
  <Accordion title="Chrome MCP / existing-session signatures">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session अभी selected browser data dir से attach नहीं कर सका। browser inspect page खोलें, remote debugging सक्षम करें, browser खुला रखें, पहले attach prompt को approve करें, फिर retry करें। यदि signed-in state आवश्यक नहीं है, तो managed `openclaw` profile को प्राथमिकता दें।
    - `No Chrome tabs found for profile="user"` → Chrome MCP attach profile में कोई open local Chrome tabs नहीं हैं।
    - `Remote CDP for profile "<name>" is not reachable` → configured remote CDP endpoint gateway host से reachable नहीं है।
    - `Browser attachOnly is enabled ... not reachable` or `Browser attachOnly is enabled and CDP websocket ... is not reachable` → attach-only profile में कोई reachable target नहीं है, या HTTP endpoint ने answer दिया लेकिन CDP WebSocket फिर भी open नहीं हो सका।

  </Accordion>
  <Accordion title="Element / screenshot / upload signatures">
    - `fullPage is not supported for element screenshots` → screenshot request ने `--full-page` को `--ref` या `--element` के साथ मिला दिया।
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` screenshot calls को page capture या snapshot `--ref` उपयोग करना चाहिए, CSS `--element` नहीं।
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP upload hooks को snapshot refs चाहिए, CSS selectors नहीं।
    - `existing-session file uploads currently support one file at a time.` → Chrome MCP profiles पर प्रति call एक upload भेजें।
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP profiles पर dialog hooks timeout overrides support नहीं करते।
    - `existing-session type does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session profiles पर `act:type` के लिए `timeoutMs` omit करें, या custom timeout आवश्यक होने पर managed/CDP browser profile उपयोग करें।
    - `existing-session evaluate does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session profiles पर `act:evaluate` के लिए `timeoutMs` omit करें, या custom timeout आवश्यक होने पर managed/CDP browser profile उपयोग करें।
    - `response body is not supported for existing-session profiles yet.` → `responsebody` के लिए अभी भी managed browser या raw CDP profile आवश्यक है।
    - stale viewport / dark-mode / locale / offline overrides on attach-only or remote CDP profiles → पूरे gateway को restart किए बिना active control session close करने और Playwright/CDP emulation state release करने के लिए `openclaw browser stop --browser-profile <name>` चलाएं।

  </Accordion>
</AccordionGroup>

संबंधित:

- [Browser (OpenClaw-managed)](/hi/tools/browser)
- [Browser समस्या निवारण](/hi/tools/browser-linux-troubleshooting)

## यदि आपने upgrade किया और अचानक कुछ टूट गया

अधिकांश post-upgrade टूट-फूट config drift या अब enforce हो रहे stricter defaults के कारण होती है।

<AccordionGroup>
  <Accordion title="1. Auth और URL override behavior बदल गया">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    क्या जांचें:

    - यदि `gateway.mode=remote` है, तो CLI calls remote को target कर सकती हैं, जबकि आपकी local service ठीक है।
    - Explicit `--url` calls stored credentials पर fall back नहीं करतीं।

    सामान्य signatures:

    - `gateway connect failed:` → गलत URL target।
    - `unauthorized` → endpoint reachable है, लेकिन auth गलत है।

  </Accordion>
  <Accordion title="2. Bind और auth guardrails अधिक सख्त हैं">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    क्या जांचें:

    - Non-loopback binds (`lan`, `tailnet`, `custom`) को valid gateway auth path चाहिए: shared token/password auth, या सही ढंग से configured non-loopback `trusted-proxy` deployment।
    - `gateway.token` जैसी पुरानी keys `gateway.auth.token` को replace नहीं करतीं।

    सामान्य signatures:

    - `refusing to bind gateway ... without auth` → valid gateway auth path के बिना non-loopback bind।
    - `Connectivity probe: failed` while runtime is running → gateway alive है लेकिन current auth/url के साथ inaccessible है।

  </Accordion>
  <Accordion title="3. Pairing और device identity state बदल गई">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    क्या जांचें:

    - dashboard/nodes के लिए pending device approvals।
    - policy या identity changes के बाद pending DM pairing approvals।

    सामान्य signatures:

    - `device identity required` → device auth satisfied नहीं है।
    - `pairing required` → sender/device approved होना चाहिए।

  </Accordion>
</AccordionGroup>

यदि checks के बाद भी service config और runtime में असहमति है, तो उसी profile/state directory से service metadata reinstall करें:

```bash
openclaw gateway install --force
openclaw gateway restart
```

संबंधित:

- [Authentication](/hi/gateway/authentication)
- [Background exec और process tool](/hi/gateway/background-process)
- [Gateway-owned pairing](/hi/gateway/pairing)

## संबंधित

- [Doctor](/hi/gateway/doctor)
- [FAQ](/hi/help/faq)
- [Gateway runbook](/hi/gateway)

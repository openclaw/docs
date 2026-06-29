---
read_when:
    - सुरक्षित बिन या कस्टम safe-bin प्रोफ़ाइल कॉन्फ़िगर करना
    - Slack/Discord/Telegram या अन्य चैट चैनलों पर अनुमोदन अग्रेषित करना
    - किसी चैनल के लिए नेटिव अनुमोदन क्लाइंट लागू करना
summary: 'उन्नत exec अनुमोदन: सुरक्षित bins, इंटरप्रेटर बाइंडिंग, अनुमोदन अग्रेषण, नेटिव डिलीवरी'
title: Exec अनुमोदन — उन्नत
x-i18n:
    generated_at: "2026-06-29T00:18:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d936e1a1567d204981eec7c3262cf11f2af8fc1ed6213182954c2324718a270
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

उन्नत exec-अनुमोदन विषय: `safeBins` फास्ट-पाथ, interpreter/runtime
बाइंडिंग, और chat channels में approval-forwarding (native delivery सहित)।
मुख्य policy और approval flow के लिए, [Exec अनुमोदन](/hi/tools/exec-approvals) देखें।

## सुरक्षित बिन्स (केवल stdin)

`tools.exec.safeBins` **केवल-stdin** binaries की एक छोटी सूची परिभाषित करता है (उदाहरण के लिए `cut`) जो allowlist mode में स्पष्ट allowlist entries के **बिना** चल सकते हैं। सुरक्षित बिन्स positional file args और path-like tokens को अस्वीकार करते हैं, इसलिए वे केवल incoming stream पर काम कर सकते हैं। इसे stream filters के लिए संकीर्ण fast-path मानें, सामान्य trust list नहीं।

<Warning>
interpreter या runtime binaries (उदाहरण के लिए `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) को `safeBins` में **न** जोड़ें। यदि कोई command code evaluate कर सकता है, subcommands execute कर सकता है, या design से files पढ़ सकता है, तो explicit allowlist entries को प्राथमिकता दें और approval prompts enabled रखें। Custom safe bins को `tools.exec.safeBinProfiles.<bin>` में एक explicit profile परिभाषित करनी होगी।
</Warning>

Default सुरक्षित बिन्स:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` और `sort` default list में नहीं हैं। यदि आप opt in करते हैं, तो उनके non-stdin workflows के लिए explicit allowlist entries रखें। safe-bin mode में `grep` के लिए, pattern को `-e`/`--regexp` के साथ दें; positional pattern form अस्वीकार कर दिया जाता है ताकि file operands को ambiguous positionals के रूप में छिपाकर न भेजा जा सके।

### Argv validation और denied flags

Validation केवल argv shape से deterministic है (कोई host filesystem existence
checks नहीं), जो allow/deny अंतरों से file-existence oracle behavior को रोकता है। Default safe bins के लिए file-oriented options denied हैं; long options fail-closed validate किए जाते हैं (unknown flags और ambiguous abbreviations अस्वीकार किए जाते हैं)।

Safe-bin profile के अनुसार denied flags:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe bins stdin-only segments के लिए execution time पर argv tokens को **literal text** के रूप में treat करने के लिए भी बाध्य करते हैं (कोई globbing नहीं और कोई `$VARS` expansion नहीं), इसलिए `*` या `$HOME/...` जैसे patterns का उपयोग file reads छिपाकर करने के लिए नहीं किया जा सकता।

### Trusted binary directories

Safe bins को trusted binary directories (system defaults और optional `tools.exec.safeBinTrustedDirs`) से resolve होना चाहिए। `PATH` entries कभी auto-trusted नहीं होतीं। Default trusted directories जानबूझकर न्यूनतम हैं: `/bin`, `/usr/bin`। यदि आपका safe-bin executable package-manager/user paths में है (उदाहरण के लिए `/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), तो उन्हें स्पष्ट रूप से `tools.exec.safeBinTrustedDirs` में जोड़ें।

### Shell chaining, wrappers, और multiplexers

Shell chaining (`&&`, `||`, `;`) की अनुमति है जब हर top-level segment allowlist को satisfy करता है (safe bins या skill auto-allow सहित)। Redirections allowlist mode में unsupported रहती हैं। Command substitution (`$()` / backticks) allowlist parsing के दौरान अस्वीकार की जाती है, double quotes के अंदर भी; यदि आपको literal `$()` text चाहिए तो single quotes का उपयोग करें।

macOS companion-app approvals पर, shell control या expansion syntax (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) वाला raw shell text allowlist miss माना जाता है जब तक कि shell binary स्वयं allowlisted न हो।

Shell wrappers (`bash|sh|zsh ... -c/-lc`) के लिए, request-scoped env overrides एक छोटी explicit allowlist (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`) तक घटाए जाते हैं।

Allowlist mode में `allow-always` decisions के लिए, ज्ञात dispatch wrappers (`env`,
`flock`, `nice`, `nohup`, `stdbuf`, `timeout`) wrapper path के बजाय inner executable path को persist करते हैं। Shell multiplexers (`busybox`, `toybox`) shell applets (`sh`, `ash`, आदि) के लिए उसी तरह unwrapped किए जाते हैं। यदि किसी wrapper या multiplexer को सुरक्षित रूप से unwrap नहीं किया जा सकता, तो कोई allowlist entry automatically persisted नहीं होती।

यदि आप `python3` या `node` जैसे interpreters को allowlist करते हैं, तो `tools.exec.strictInlineEval=true` को प्राथमिकता दें ताकि inline eval को अभी भी explicit approval की आवश्यकता हो। Strict mode में, `allow-always` अभी भी benign interpreter/script invocations को persist कर सकता है, लेकिन inline-eval carriers automatically persisted नहीं होते।

### Safe bins बनाम allowlist

| विषय            | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| लक्ष्य             | संकीर्ण stdin filters को auto-allow करना                        | विशिष्ट executables पर स्पष्ट रूप से trust करना                                              |
| Match type       | Executable name + safe-bin argv policy                 | Resolved executable path glob, या PATH-invoked commands के लिए bare command-name glob |
| Argument scope   | Safe-bin profile और literal-token rules द्वारा restricted | Default रूप से path match; optional `argPattern` parsed argv को restrict कर सकता है              |
| सामान्य उदाहरण | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, custom CLIs                                     |
| सर्वोत्तम उपयोग         | Pipelines में low-risk text transforms                  | व्यापक behavior या side effects वाला कोई भी tool                                     |

Configuration location:

- `safeBins` config (`tools.exec.safeBins` या per-agent `agents.list[].tools.exec.safeBins`) से आता है।
- `safeBinTrustedDirs` config (`tools.exec.safeBinTrustedDirs` या per-agent `agents.list[].tools.exec.safeBinTrustedDirs`) से आता है।
- `safeBinProfiles` config (`tools.exec.safeBinProfiles` या per-agent `agents.list[].tools.exec.safeBinProfiles`) से आता है। Per-agent profile keys global keys को override करती हैं।
- allowlist entries host-local approvals file में `agents.<id>.allowlist` के अंतर्गत रहती हैं (या Control UI / `openclaw approvals allowlist ...` के माध्यम से)।
- `openclaw security audit` `tools.exec.safe_bins_interpreter_unprofiled` के साथ चेतावनी देता है जब interpreter/runtime bins explicit profiles के बिना `safeBins` में दिखाई देते हैं।
- `openclaw doctor --fix` missing custom `safeBinProfiles.<bin>` entries को `{}` के रूप में scaffold कर सकता है (बाद में review और tighten करें)। Interpreter/runtime bins auto-scaffolded नहीं होते।

Custom profile उदाहरण:
__OC_I18N_900000__
यदि आप `jq` को स्पष्ट रूप से `safeBins` में opt करते हैं, तो OpenClaw अभी भी safe-bin
mode में `env` builtin को अस्वीकार करता है ताकि `jq -n env` explicit allowlist path
या approval prompt के बिना host process environment dump न कर सके।

## Interpreter/runtime commands

Approval-backed interpreter/runtime runs जानबूझकर conservative हैं:

- Exact argv/cwd/env context हमेशा bound होता है।
- Direct shell script और direct runtime file forms best-effort रूप से एक concrete local
  file snapshot से bound होते हैं।
- Common package-manager wrapper forms जो अभी भी एक direct local file पर resolve होते हैं (उदाहरण के लिए
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) binding से पहले unwrapped किए जाते हैं।
- यदि OpenClaw interpreter/runtime command के लिए ठीक एक concrete local file identify नहीं कर सकता
  (उदाहरण के लिए package scripts, eval forms, runtime-specific loader chains, या ambiguous multi-file
  forms), तो approval-backed execution उस semantic coverage का दावा करने के बजाय denied होता है जो उसके पास नहीं है।
- उन workflows के लिए, sandboxing, अलग host boundary, या explicit trusted
  allowlist/full workflow को प्राथमिकता दें जहाँ operator व्यापक runtime semantics स्वीकार करता है।

जब approvals आवश्यक होते हैं, exec tool तुरंत approval id के साथ return करता है। बाद के approved-run system events (`Exec finished`, और configured होने पर `Exec running`) correlate करने के लिए उस id का उपयोग करें।
यदि timeout से पहले कोई decision नहीं आता, तो request को approval timeout माना जाता है और terminal host-command denial के रूप में surfaced किया जाता है। Originating session वाले main-agent async approvals के लिए, OpenClaw उस session को internal followup के साथ resume भी करता है ताकि agent देख सके कि command बाद में missing result repair करने के बजाय चली ही नहीं।

### Followup delivery behavior

Approved async exec finish होने के बाद, OpenClaw उसी session में followup `agent` turn भेजता है।
Denied async approvals denial status के लिए वही main-session followup path उपयोग करते हैं, लेकिन वे elevated runtime handoffs register नहीं करते और command नहीं चलाते। Resumable main session के बिना denials या तो suppressed होते हैं या कोई safe direct route मौजूद होने पर उसके माध्यम से reported होते हैं।

- यदि valid external delivery target मौजूद है (deliverable channel plus target `to`), followup delivery उसी channel का उपयोग करती है।
- Webchat-only या external target के बिना internal-session flows में, followup delivery session-only रहती है (`deliver: false`)।
- यदि caller कोई resolvable external channel न होने पर strict external delivery explicitly request करता है, तो request `INVALID_REQUEST` के साथ fail होती है।
- यदि `bestEffortDeliver` enabled है और कोई external channel resolve नहीं हो सकता, तो fail होने के बजाय delivery session-only में downgraded हो जाती है।

## Chat channels में approval forwarding

आप exec approval prompts को किसी भी chat channel (plugin channels सहित) में forward कर सकते हैं और उन्हें `/approve` के साथ approve कर सकते हैं। यह normal outbound delivery pipeline का उपयोग करता है।

Config:
__OC_I18N_900001__
Chat में reply करें:
__OC_I18N_900002__
`/approve` command exec approvals और plugin approvals दोनों संभालता है। यदि ID किसी pending exec approval से match नहीं करती, तो यह automatically plugin approvals को check करता है।

### Plugin approval forwarding

Plugin approval forwarding exec approvals की तरह ही delivery pipeline का उपयोग करता है, लेकिन इसकी अपनी
independent config `approvals.plugin` के अंतर्गत होती है। एक को enable या disable करने से दूसरे पर असर नहीं पड़ता।
Plugin-authoring behavior, request fields, और decision semantics के लिए,
[Plugin permission requests](/plugins/plugin-permission-requests) देखें।
__OC_I18N_900003__
Config shape `approvals.exec` के समान है: `enabled`, `mode`, `agentFilter`,
`sessionFilter`, और `targets` उसी तरह काम करते हैं।

Shared interactive replies support करने वाले channels exec और
plugin approvals दोनों के लिए वही approval buttons render करते हैं। Shared interactive UI के बिना channels `/approve`
instructions के साथ plain text पर fall back करते हैं।
Plugin approval requests available decisions को restrict कर सकती हैं। Approval surfaces request के
declared decision set का उपयोग करते हैं, और Gateway ऐसे decision को submit करने के attempts reject करता है जो offered नहीं था।

### किसी भी channel पर same-chat approvals

जब exec या plugin approval request deliverable chat surface से originate होती है, तो वही chat
default रूप से इसे `/approve` के साथ approve कर सकता है। यह मौजूदा Web UI और terminal UI flows के अलावा Slack, Matrix, और
Microsoft Teams जैसे channels पर भी लागू होता है।

यह साझा टेक्स्ट-कमांड पथ उस बातचीत के लिए सामान्य चैनल प्रमाणीकरण मॉडल का उपयोग करता है। यदि
मूल चैट पहले से ही कमांड भेज सकती है और जवाब प्राप्त कर सकती है, तो अनुमोदन अनुरोधों को अब
केवल लंबित रहने के लिए अलग नेटिव डिलीवरी अडैप्टर की आवश्यकता नहीं होती।

Discord और Telegram भी उसी चैट में `/approve` का समर्थन करते हैं, लेकिन वे चैनल तब भी
प्राधिकरण के लिए अपनी हल की गई अनुमोदक सूची का उपयोग करते हैं, भले ही नेटिव अनुमोदन डिलीवरी अक्षम हो।

Telegram और अन्य नेटिव अनुमोदन क्लाइंट के लिए जो सीधे Gateway को कॉल करते हैं,
यह fallback जानबूझकर केवल "approval not found" विफलताओं तक सीमित है। वास्तविक
exec अनुमोदन अस्वीकृति/त्रुटि चुपचाप Plugin अनुमोदन के रूप में पुनः प्रयास नहीं करती।

### नेटिव अनुमोदन डिलीवरी

कुछ चैनल नेटिव अनुमोदन क्लाइंट के रूप में भी काम कर सकते हैं। नेटिव क्लाइंट साझा उसी-चैट `/approve`
प्रवाह के ऊपर अनुमोदक DM, मूल-चैट fanout, और चैनल-विशिष्ट इंटरैक्टिव अनुमोदन UX जोड़ते हैं।

जब नेटिव अनुमोदन कार्ड/बटन उपलब्ध हों, तो वही नेटिव UI प्राथमिक
एजेंट-सामना पथ होता है। एजेंट को अलग से डुप्लिकेट सादा चैट
`/approve` कमांड echo नहीं करनी चाहिए, जब तक कि टूल परिणाम यह न कहे कि चैट अनुमोदन उपलब्ध नहीं हैं या
मैन्युअल अनुमोदन ही बचा हुआ एकमात्र पथ है।

यदि कोई नेटिव अनुमोदन क्लाइंट कॉन्फ़िगर है लेकिन मूल चैनल के लिए कोई नेटिव runtime सक्रिय नहीं है,
तो OpenClaw स्थानीय deterministic `/approve` prompt को दृश्यमान रखता है। यदि नेटिव runtime सक्रिय है
और डिलीवरी का प्रयास करता है लेकिन किसी target को कार्ड प्राप्त नहीं होता, तो OpenClaw उसी चैट में fallback notice भेजता है,
जिसमें ठीक `/approve <id> <decision>` कमांड होती है ताकि अनुरोध फिर भी हल किया जा सके।

सामान्य मॉडल:

- host exec policy अब भी तय करती है कि exec अनुमोदन आवश्यक है या नहीं
- `approvals.exec` अनुमोदन prompts को अन्य चैट destinations पर forward करने को नियंत्रित करता है
- `channels.<channel>.execApprovals` नियंत्रित करता है कि Discord, Slack, Telegram, और समान
  चैनल-विशिष्ट नेटिव क्लाइंट सक्षम हैं या नहीं
- Slack Plugin अनुमोदन Slack के नेटिव अनुमोदन क्लाइंट का उपयोग कर सकते हैं जब अनुरोध Slack से आता है
  और Slack Plugin अनुमोदक हल हो जाते हैं; `approvals.plugin` Plugin अनुमोदनों को Slack
  sessions या targets पर route भी कर सकता है, भले ही Slack exec अनुमोदन अक्षम हों
- Google Chat नेटिव अनुमोदन कार्ड Google
  Chat spaces या threads से शुरू होने वाले exec और Plugin अनुमोदनों को संभालते हैं, जब स्थिर `users/<id>` अनुमोदक `dm.allowFrom` या
  `defaultTo` से हल होते हैं; वे निर्णयों के लिए reaction events का उपयोग नहीं करते
- WhatsApp और Signal reaction अनुमोदन डिलीवरी `approvals.exec` और
  `approvals.plugin` से gated होती है; उनके पास `channels.<channel>.execApprovals` blocks नहीं होते

नेटिव अनुमोदन क्लाइंट DM-first डिलीवरी को अपने-आप सक्षम करते हैं जब ये सभी सत्य हों:

- चैनल नेटिव अनुमोदन डिलीवरी का समर्थन करता है
- अनुमोदक स्पष्ट `execApprovals.approvers` या owner
  identity जैसे `commands.ownerAllowFrom` से हल किए जा सकते हैं
- `channels.<channel>.execApprovals.enabled` unset है या `"auto"` है

किसी नेटिव अनुमोदन क्लाइंट को स्पष्ट रूप से अक्षम करने के लिए `enabled: false` सेट करें। अनुमोदक हल होने पर
इसे force-enable करने के लिए `enabled: true` सेट करें। सार्वजनिक मूल-चैट डिलीवरी
`channels.<channel>.execApprovals.target` के माध्यम से स्पष्ट रहती है।

FAQ: [चैट अनुमोदनों के लिए दो exec अनुमोदन config क्यों हैं?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`
- Google Chat: स्थिर अनुमोदकों को `channels.googlechat.dm.allowFrom` या
  `channels.googlechat.defaultTo` से कॉन्फ़िगर करें; कोई `execApprovals` block आवश्यक नहीं है
- WhatsApp: अनुमोदन prompts को WhatsApp पर route करने के लिए `approvals.exec` और `approvals.plugin` का उपयोग करें
- Signal: अनुमोदन prompts को Signal पर route करने के लिए `approvals.exec` और `approvals.plugin` का उपयोग करें

ये नेटिव अनुमोदन क्लाइंट साझा उसी-चैट `/approve` flow और साझा अनुमोदन buttons के ऊपर
DM routing और वैकल्पिक channel fanout जोड़ते हैं।

साझा व्यवहार:

- Slack, Matrix, Microsoft Teams, और समान deliverable chats उसी-चैट `/approve` के लिए सामान्य channel auth model
  का उपयोग करते हैं
- जब कोई नेटिव अनुमोदन क्लाइंट auto-enable होता है, तो default नेटिव delivery target अनुमोदक DMs होते हैं
- Discord और Telegram के लिए, केवल हल किए गए अनुमोदक approve या deny कर सकते हैं
- Discord अनुमोदक स्पष्ट (`execApprovals.approvers`) हो सकते हैं या `commands.ownerAllowFrom` से अनुमानित हो सकते हैं
- Telegram अनुमोदक स्पष्ट (`execApprovals.approvers`) हो सकते हैं या `commands.ownerAllowFrom` से अनुमानित हो सकते हैं
- Slack अनुमोदक स्पष्ट (`execApprovals.approvers`) हो सकते हैं या `commands.ownerAllowFrom` से अनुमानित हो सकते हैं
- Slack Plugin अनुमोदन DMs `allowFrom` और account default
  routing से Slack Plugin अनुमोदकों का उपयोग करते हैं, Slack exec अनुमोदकों का नहीं
- Slack नेटिव buttons अनुमोदन id kind को preserve करते हैं, इसलिए `plugin:` ids दूसरी Slack-local fallback layer
  के बिना Plugin अनुमोदनों को हल कर सकते हैं
- Google Chat नेटिव cards message text में manual `/approve` fallback को preserve करते हैं लेकिन card button
  callbacks केवल opaque action tokens ले जाते हैं; approval id और decision server-side
  pending state से recover किए जाते हैं
- WhatsApp emoji अनुमोदन exec और Plugin prompts दोनों को केवल तब संभालते हैं जब matching top-level
  forwarding family सक्षम हो और WhatsApp पर route करे; target-only WhatsApp forwarding साझा forwarding path पर रहती है
  जब तक कि वह उसी नेटिव origin target से match न करे
- Signal reaction अनुमोदन exec और Plugin prompts दोनों को केवल तब संभालते हैं जब matching top-level
  forwarding family सक्षम हो और Signal पर route करे। Direct same-chat Signal exec approvals
  explicit approvers के बिना local `/approve` fallback को suppress कर सकते हैं; Signal reaction resolution
  अब भी `channels.signal.allowFrom` या `defaultTo` से explicit Signal approvers मांगता है।
- Matrix नेटिव DM/channel routing और reaction shortcuts exec और Plugin अनुमोदन दोनों संभालते हैं;
  Plugin authorization अब भी `channels.matrix.dm.allowFrom` से आता है
- Matrix नेटिव prompts पहले prompt
  event पर `com.openclaw.approval` custom event content शामिल करते हैं ताकि OpenClaw-aware Matrix clients structured approval state पढ़ सकें जबकि stock clients
  plain-text `/approve` fallback रखते हैं
- requester को अनुमोदक होना आवश्यक नहीं है
- मूल चैट `/approve` से सीधे approve कर सकती है जब वह चैट पहले से commands और replies का समर्थन करती है
- नेटिव Discord approval buttons approval id kind के अनुसार route करते हैं: `plugin:` ids
  सीधे Plugin approvals पर जाते हैं, बाकी सब exec approvals पर जाते हैं
- नेटिव Telegram approval buttons `/approve` जैसा ही bounded exec-to-plugin fallback follow करते हैं
- जब नेटिव `target` origin-chat delivery सक्षम करता है, तो approval prompts command text शामिल करते हैं
- लंबित exec approvals default रूप से 30 minutes के बाद expire होते हैं
- यदि कोई operator UI या configured approval client अनुरोध accept नहीं कर सकता, तो prompt `askFallback` पर fallback करता है

संवेदनशील owner-only group commands जैसे `/diagnostics` और `/export-trajectory` अनुमोदन prompts और final results के लिए private
owner routing का उपयोग करते हैं। OpenClaw पहले उसी surface पर private route आज़माता है
जहां owner ने command चलाई थी। यदि उस surface पर कोई private owner route नहीं है, तो यह
`commands.ownerAllowFrom` से पहले उपलब्ध owner route पर fallback करता है, ताकि Discord group command
फिर भी approval और result को owner के Telegram DM पर भेज सके जब Telegram configured
primary private interface हो। group chat को केवल छोटा acknowledgement मिलता है।

Telegram अनुमोदक DMs (`target: "dm"`) पर डिफ़ॉल्ट होता है। जब आप चाहते हैं कि अनुमोदन प्रॉम्प्ट मूल Telegram चैट/टॉपिक में भी दिखाई दें, तो आप `channel` या `both` पर स्विच कर सकते हैं। Telegram फ़ोरम टॉपिक्स के लिए, OpenClaw अनुमोदन प्रॉम्प्ट और अनुमोदन के बाद के फ़ॉलो-अप के लिए टॉपिक को सुरक्षित रखता है।

देखें:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC प्रवाह
__OC_I18N_900004__
सुरक्षा नोट्स:

- Unix सॉकेट मोड `0600`, टोकन `exec-approvals.json` में संग्रहीत।
- समान-UID पीयर जाँच।
- चैलेंज/रिस्पॉन्स (nonce + HMAC token + request hash) + छोटा TTL।

## अक्सर पूछे जाने वाले प्रश्न

### अनुमोदन लक्ष्य पर `accountId` और `threadId` कब उपयोग किए जाएंगे?

जब चैनल में कई कॉन्फ़िगर की गई पहचानें हों और अनुमोदन प्रॉम्प्ट को किसी विशिष्ट खाते से ही भेजना हो, तब `accountId` का उपयोग करें। जब गंतव्य टॉपिक्स या थ्रेड्स का समर्थन करता हो और प्रॉम्प्ट को शीर्ष-स्तरीय चैट के बजाय उसी थ्रेड के अंदर रहना चाहिए, तब `threadId` का उपयोग करें।

एक ठोस Telegram उदाहरण फ़ोरम टॉपिक्स और दो Telegram bot खातों वाला एक ऑपरेशंस सुपरग्रुप है। `to` मान सुपरग्रुप का नाम देता है, `accountId` bot खाता चुनता है, और `threadId` फ़ोरम टॉपिक चुनता है:
__OC_I18N_900005__
इस सेटअप के साथ, फ़ॉरवर्ड किए गए exec अनुमोदन `ops-bot` Telegram खाते द्वारा चैट `-1001234567890` के टॉपिक `77` में पोस्ट किए जाते हैं। `accountId` के बिना लक्ष्य चैनल के डिफ़ॉल्ट खाते का उपयोग करता है, और `threadId` के बिना लक्ष्य शीर्ष-स्तरीय गंतव्य पर पोस्ट करता है।

### जब अनुमोदन किसी सत्र में भेजे जाते हैं, तो क्या उस सत्र में कोई भी उन्हें अनुमोदित कर सकता है?

नहीं। सत्र डिलीवरी केवल यह नियंत्रित करती है कि प्रॉम्प्ट कहाँ दिखाई देता है। यह अपने आप उस चैट के हर प्रतिभागी को अनुमोदन का अधिकार नहीं देती।

सामान्य समान-चैट `/approve` के लिए, भेजने वाले को उस चैनल सत्र में कमांड्स के लिए पहले से अधिकृत होना चाहिए। यदि चैनल स्पष्ट अनुमोदन अनुमोदकों को उजागर करता है, तो वे अनुमोदक `/approve` कार्रवाई को अधिकृत कर सकते हैं, भले ही वे उस सत्र में अन्यथा कमांड-अधिकृत न हों।

कुछ चैनल अधिक सख्त होते हैं। Discord, Telegram, Matrix, Slack नेटिव अनुमोदन DMs, और समान नेटिव अनुमोदन क्लाइंट अनुमोदन प्राधिकरण के लिए अपनी रिज़ॉल्व की गई अनुमोदक सूचियों का उपयोग करते हैं। उदाहरण के लिए, Telegram फ़ोरम-टॉपिक अनुमोदन प्रॉम्प्ट टॉपिक में सभी को दिखाई दे सकता है, लेकिन केवल `channels.telegram.execApprovals.approvers` या `commands.ownerAllowFrom` से रिज़ॉल्व किए गए संख्यात्मक Telegram उपयोगकर्ता IDs ही उसे अनुमोदित या अस्वीकार कर सकते हैं।

## संबंधित

- [Exec अनुमोदन](/hi/tools/exec-approvals) — मुख्य नीति और अनुमोदन प्रवाह
- [Exec टूल](/hi/tools/exec)
- [Elevated मोड](/hi/tools/elevated)
- [Skills](/hi/tools/skills) — skill-समर्थित ऑटो-अनुमति व्यवहार

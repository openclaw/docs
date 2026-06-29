---
read_when:
    - OpenClaw बग के लिए लाइव दृश्य QA बनाना या चलाना
    - किसी पुल अनुरोध के लिए पहले और बाद का सत्यापन जोड़ना
    - Discord, Slack, WhatsApp या अन्य लाइव ट्रांसपोर्ट परिदृश्य जोड़ना
    - स्क्रीनशॉट, ब्राउज़र ऑटोमेशन, या VNC एक्सेस की ज़रूरत वाले QA रन को डीबग करना
summary: 'Mantis OpenClaw बग्स को लाइव ट्रांसपोर्ट्स पर पुन: उत्पन्न करने, पहले और बाद के प्रमाण कैप्चर करने, और आर्टिफैक्ट्स को PRs से संलग्न करने के लिए दृश्य एंड-टू-एंड सत्यापन प्रणाली है।'
title: मैंटिस
x-i18n:
    generated_at: "2026-06-28T22:58:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9de83fac9bfa64b4828dab96fcbf5fac33466c7ede9406472801dc7322bf3ae
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis उन बगों के लिए OpenClaw एंड-टू-एंड सत्यापन सिस्टम है जिन्हें वास्तविक
रनटाइम, वास्तविक परिवहन, और दृश्य प्रमाण की जरूरत होती है। यह किसी ज्ञात खराब
ref के विरुद्ध एक scenario चलाता है, evidence कैप्चर करता है, वही scenario
candidate ref के विरुद्ध चलाता है, और तुलना को artifacts के रूप में प्रकाशित
करता है जिन्हें maintainer किसी PR या स्थानीय command से जांच सकता है।

Mantis Discord से शुरू होता है क्योंकि Discord हमें एक उच्च-मूल्य वाली पहली lane
देता है: वास्तविक bot auth, वास्तविक guild channels, reactions, threads, native
commands, और browser UI जहां इंसान दृश्य रूप से पुष्टि कर सकते हैं कि transport
ने क्या दिखाया।

## लक्ष्य

- किसी GitHub issue या PR से बग को उसी transport shape के साथ पुनरुत्पादित करना
  जिसे users देखते हैं।
- fix लागू करने से पहले baseline ref पर **before** artifact कैप्चर करना।
- fix लागू करने के बाद candidate ref पर **after** artifact कैप्चर करना।
- जब भी संभव हो deterministic oracle का उपयोग करना, जैसे Discord REST reaction
  read या channel transcript check।
- जब बग की कोई दृश्य UI surface हो तो screenshots कैप्चर करना।
- agent-controlled CLI से locally और GitHub से remotely चलना।
- login, browser automation, या provider auth अटकने पर VNC rescue के लिए पर्याप्त
  machine state सुरक्षित रखना।
- run blocked होने, manual VNC help की जरूरत होने, या finish होने पर operator
  Discord channel में संक्षिप्त status पोस्ट करना।

## गैर-लक्ष्य

- Mantis unit tests का replacement नहीं है। fix समझ आने के बाद Mantis run को
  सामान्यतः एक छोटे regression test में बदलना चाहिए।
- Mantis सामान्य तेज CI gate नहीं है। यह धीमा है, live credentials का उपयोग करता
  है, और उन बगों के लिए आरक्षित है जहां live environment मायने रखता है।
- सामान्य operation के लिए Mantis को किसी इंसान की जरूरत नहीं होनी चाहिए। Manual
  VNC rescue path है, happy path नहीं।
- Mantis artifacts, logs, screenshots, Markdown reports, या PR comments में raw
  secrets store नहीं करता।

## स्वामित्व

Mantis OpenClaw QA stack में रहता है।

- OpenClaw scenario runtime, transport adapters, evidence schema, और
  `pnpm openclaw qa mantis` के अंतर्गत local CLI का मालिक है।
- QA Lab live transport harness pieces, browser capture helpers, और artifact
  writers का मालिक है।
- जब remote VM की जरूरत होती है, Crabbox warmed Linux machines का मालिक है।
- GitHub Actions remote workflow entrypoint और artifact retention का मालिक है।
- ClawSweeper GitHub comment routing का मालिक है: maintainer commands parse करना,
  workflow dispatch करना, और अंतिम PR comment पोस्ट करना।
- जब किसी scenario को agentic setup, debugging, या stuck-state reporting की जरूरत
  होती है, OpenClaw agents Codex के जरिए Mantis चलाते हैं।

यह boundary transport knowledge को OpenClaw में, machine scheduling को
Crabbox में, और maintainer workflow glue को ClawSweeper में रखती है।

## Command shape

पहला local command Discord bot, guild, channel, message send, reaction send, और
artifact path को verify करता है:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

local before और after runner यह shape स्वीकार करता है:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

runner output directory के अंतर्गत detached baseline और candidate worktrees बनाता
है, dependencies install करता है, प्रत्येक ref build करता है, scenario को
`--allow-failures` के साथ चलाता है, फिर `baseline/`, `candidate/`,
`comparison.json`, और `mantis-report.md` लिखता है। पहले Discord scenario के लिए,
सफल verification का अर्थ है कि baseline status `fail` है और candidate status
`pass` है।

दूसरा Discord before/after probe thread attachments को target करता है:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

वह scenario driver bot से parent message पोस्ट करता है, वास्तविक Discord thread
बनाता है, repo-local `filePath` के साथ OpenClaw की `message.thread-reply` action
call करता है, फिर SUT reply और attachment filename के लिए thread poll करता है।
baseline screenshot reply को बिना attachment के दिखाता है; candidate screenshot
अपेक्षित `mantis-thread-report.md` attachment दिखाता है।

पहला VM/browser primitive desktop smoke है:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

यह Crabbox desktop machine lease करता है या reuse करता है, VNC session के भीतर
visible browser शुरू करता है, desktop कैप्चर करता है, artifacts को local output
directory में वापस pull करता है, और reconnect command को report में लिखता है।
command default रूप से Hetzner provider का उपयोग करता है क्योंकि यह Mantis lane
में working desktop/VNC coverage वाला पहला provider है। किसी अन्य Crabbox fleet
के विरुद्ध चलाते समय इसे `--provider`, `--crabbox-bin`, या
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` से override करें।

उपयोगी desktop smoke flags:

- `--lease-id <cbx_...>` या `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` warmed desktop को reuse करता है।
- `--browser-url <url>` visible browser में खोले गए page को बदलता है।
- `--html-file <path>` repo-local HTML artifact को visible browser में render करता है। Mantis इसका उपयोग generated Discord status-reaction timeline को वास्तविक Crabbox desktop के जरिए capture करने के लिए करता है।
- `--browser-profile-dir <remote-path>` remote Chrome user-data-dir को reuse करता है ताकि persistent Mantis desktop runs के बीच logged in रह सके। इसे long-lived Discord Web viewer profile के लिए उपयोग करें।
- `--browser-profile-archive-env <name>` browser launch करने से पहले named environment variable से base64 `.tgz` Chrome user-data-dir archive restore करता है। इसे Discord Web जैसे logged-in witnesses के लिए उपयोग करें। default env var `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64` है।
- `--video-duration <seconds>` MP4 capture length नियंत्रित करता है। slow logged-in web apps के लिए लंबी duration उपयोग करें जिन्हें settle होने में समय चाहिए।
- `--keep-lease` या `OPENCLAW_MANTIS_KEEP_VM=1` newly created passing lease को VNC inspection के लिए open रखता है। failed runs default रूप से lease keep करते हैं जब कोई lease बनाया गया था ताकि operator reconnect कर सके।
- `--class`, `--idle-timeout`, और `--ttl` machine size और lease lifetime tune करते हैं।

Discord Web evidence के लिए, Mantis bot token के बजाय dedicated viewer account का
उपयोग करता है। live Discord API scenario oracle रहता है: यह वास्तविक thread
बनाता है, SUT `thread-reply` भेजता है, और Discord REST के जरिए attachment check
करता है। जब `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` set होता है, scenario
Discord Web URL artifact भी लिखता है। जब `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` set
होता है, यह उस thread को इतने समय तक उपलब्ध छोड़ता है कि logged-in browser उसे
open और record कर सके।

GitHub workflow candidate thread URL को Discord Web में खोलता है, screenshot
capture करता है, MP4 record करता है, और जब Crabbox media tooling उपलब्ध हो तो
trimmed GIF preview generate करता है। `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`
के जरिए configured persistent viewer profile path को प्राथमिकता दें, क्योंकि
full Chrome profile archives GitHub की secret-size limit से बड़े हो सकते हैं।
small/bootstrap profiles के लिए, workflow
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` से base64 `.tgz` archive भी restore
कर सकता है। यदि कोई profile source configured नहीं है, workflow फिर भी
deterministic baseline/candidate attachment screenshots publish करता है और notice
log करता है कि logged-in Discord Web witness skip किया गया।

पहला full desktop transport primitive Slack desktop smoke है:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

यह Crabbox desktop machine lease करता है या reuse करता है, current checkout को
VM में sync करता है, उस VM के भीतर `pnpm openclaw qa slack` चलाता है, VNC browser
में Slack Web खोलता है, visible desktop capture करता है, और Slack QA artifacts
तथा VNC screenshot दोनों को local output directory में वापस copy करता है। यह
पहला Mantis shape है जहां SUT OpenClaw gateway और browser दोनों समान Linux
desktop VM के भीतर रहते हैं।

`--gateway-setup` के साथ, command `$HOME/.openclaw-mantis/slack-openclaw` पर
persistent disposable OpenClaw home तैयार करता है, selected channel के लिए Slack
Socket Mode configuration patch करता है, port `38973` पर `openclaw gateway run`
शुरू करता है, और VNC session में Chrome running रखता है। यह "मुझे Slack और
running claw वाला Linux desktop छोड़ दें" mode है; जब `--gateway-setup` omitted
होता है, bot-to-bot Slack QA lane default रहती है।

`--credential-source env` के लिए आवश्यक inputs:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- remote model lane के लिए `OPENCLAW_LIVE_OPENAI_KEY`। यदि locally केवल
  `OPENAI_API_KEY` set है, तो Mantis Crabbox invoke करने से पहले उसे
  `OPENCLAW_LIVE_OPENAI_KEY` पर map करता है ताकि Crabbox का `OPENCLAW_*` env forwarding
  उसे VM में ले जा सके।

`--gateway-setup --credential-source convex` के साथ, Mantis VM बनाने से पहले
shared pool से Slack SUT credential lease करता है और leased channel id, Socket
Mode app token, और bot token को desktop के भीतर `OPENCLAW_MANTIS_SLACK_*`
runtime env के रूप में forward करता है। इससे GitHub workflows thin रहते हैं: उन्हें
केवल Convex broker secret चाहिए, raw Slack bot या app tokens नहीं।

उपयोगी Slack desktop flags:

- `--lease-id <cbx_...>` उस machine के विरुद्ध rerun करता है जहां operator पहले ही VNC के जरिए Slack Web में logged in है।
- `--gateway-setup` केवल bot-to-bot QA lane चलाने के बजाय VM में persistent OpenClaw Slack gateway शुरू करता है।
- `--keep-lease` success के बाद gateway VM को VNC inspection के लिए open रखता है; `--no-keep-lease` artifacts collect करने के बाद इसे stop करता है।
- `--slack-url <url>` specific Slack Web URL खोलता है। इसके बिना, जब SUT bot token उपलब्ध हो, Mantis Slack `auth.test` से `https://app.slack.com/client/<team>/<channel>` derive करता है।
- `--slack-channel-id <id>` gateway setup द्वारा उपयोग की गई Slack channel allowlist नियंत्रित करता है।
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` VM के भीतर persistent Chrome profile नियंत्रित करता है। default `$HOME/.config/openclaw-mantis/slack-chrome-profile` है, ताकि manual Slack Web login समान lease पर reruns में बचा रहे।
- `--credential-source convex --credential-role ci` direct Slack env tokens के बजाय shared credential pool का उपयोग करता है।
- `--provider-mode`, `--model`, `--alt-model`, और `--fast` Slack live lane को pass through करते हैं।

Approval checkpoint runs CI-safe visual proof के लिए Slack API message snapshots
को checkpoint PNGs में render करते हैं। `slack-desktop-smoke.png` Slack Web का
proof केवल तब है जब lease ऐसे warm browser profile का उपयोग करता है जो पहले से
logged in है।

GitHub smoke workflow `Mantis Discord Smoke` है। पहले real scenario के लिए before
और after GitHub workflow `Mantis Discord Status Reactions` है। यह स्वीकार करता
है:

- `baseline_ref`: वह ref जिससे queued-only behavior reproduce होने की अपेक्षा है।
- `candidate_ref`: वह ref जिससे `queued -> thinking -> done` दिखने की अपेक्षा है।

यह workflow harness ref checkout करता है, अलग baseline और candidate worktrees
build करता है, प्रत्येक worktree के विरुद्ध `discord-status-reactions-tool-only`
चलाता है, और `baseline/`, `candidate/`, `comparison.json`, तथा
`mantis-report.md` को Actions artifacts के रूप में upload करता है। यह प्रत्येक
lane की timeline HTML को Crabbox desktop browser में भी render करता है और PR
comment में deterministic timeline PNGs के साथ वे VNC screenshots publish करता
है। वही PR comment `crabbox media preview` द्वारा generated lightweight
motion-trimmed GIF previews embed करता है, matching motion-trimmed MP4 clips से
link करता है, और deep inspection के लिए full desktop MP4 files रखता है। त्वरित
review के लिए screenshots inline रहते हैं। workflow `openclaw/crabbox` main से
Crabbox CLI build करता है ताकि अगले Crabbox binary release cut होने से पहले यह
current desktop/browser lease flags का उपयोग कर सके।

`Mantis Scenario` जेनेरिक मैनुअल एंट्रीपॉइंट है। यह `scenario_id`,
`candidate_ref`, वैकल्पिक `baseline_ref`, और वैकल्पिक `pr_number` लेता है, फिर
scenario-स्वामित्व वाला वर्कफ़्लो डिस्पैच करता है। रैपर जानबूझकर पतला है:
scenario वर्कफ़्लो अभी भी अपना transport सेटअप, क्रेडेंशियल, VM क्लास,
अपेक्षित oracle, और आर्टिफैक्ट मैनिफ़ेस्ट स्वामित्व में रखते हैं।

`Mantis Slack Desktop Smoke` पहला Slack VM वर्कफ़्लो है। यह trusted candidate
ref को अलग वर्कट्री में चेक आउट करता है, Crabbox Linux डेस्कटॉप lease करता है,
उस candidate के विरुद्ध `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` चलाता है,
VNC ब्राउज़र में Slack Web खोलता है, डेस्कटॉप रिकॉर्ड करता है,
`crabbox media preview` से motion-trimmed प्रीव्यू जनरेट करता है, पूरा आर्टिफैक्ट
डायरेक्टरी अपलोड करता है, और वैकल्पिक रूप से target PR पर inline evidence
comment पोस्ट करता है। डेस्कटॉप lease के लिए इसका डिफ़ॉल्ट AWS है और यह manual
provider input उपलब्ध कराता है ताकि operator AWS capacity धीमी या अनुपलब्ध होने पर
Hetzner पर स्विच कर सकें। इस lane का उपयोग तब करें जब आप केवल bot-to-bot Slack
transcript के बजाय "Slack और चल रहे claw वाला Linux desktop" चाहते हों।

`Mantis Telegram Live` मौजूदा Telegram live QA lane को उसी PR evidence pipeline
में लपेटता है। यह trusted candidate ref को अलग वर्कट्री में चेक आउट करता है,
`pnpm openclaw qa telegram --credential-source convex
--credential-role ci` चलाता है, Telegram QA summary, `qa-evidence.json`, और report
artifacts से `mantis-evidence.json` manifest लिखता है, redacted evidence HTML को
Crabbox desktop browser के माध्यम से render करता है, `crabbox media preview` से
motion-trimmed GIF जनरेट करता है, और PR number उपलब्ध होने पर inline PR evidence
comment पोस्ट करता है। यह lane logged-in Telegram Web proof के बजाय QA-evidence
visual है: Telegram Bot API स्थिर live message evidence देता है, लेकिन सामान्य
Mantis automation के लिए Telegram Web login state आवश्यक नहीं है।

`Mantis Telegram Desktop Proof` agentic native Telegram Desktop before/after
wrapper है। कोई maintainer इसे PR comment से
`@openclaw-mantis telegram desktop proof`, Actions UI से freeform instructions,
या generic `Mantis Scenario` dispatcher के माध्यम से trigger कर सकता है। Workflow
PR, baseline ref, candidate ref, और maintainer instructions Codex को देता है।
Agent PR पढ़ता है, तय करता है कि कौन-सा Telegram-visible behavior change को prove
करता है, baseline और candidate के लिए real-user Crabbox Telegram Desktop proof
lane चलाता है, native GIFs उपयोगी होने तक iterate करता है, paired `motionPreview`
artifacts को `mantis-evidence.json` में लिखता है, bundle अपलोड करता है, और PR
number उपलब्ध होने पर 2-column PR evidence table पोस्ट करता है।

Human-in-the-loop Telegram desktop setup के लिए, scenario builder का उपयोग करें:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Builder Crabbox desktop lease या reuse करता है, native Linux Telegram Desktop
binary install करता है, वैकल्पिक रूप से user-session archive restore करता है,
leased Telegram SUT bot token के साथ OpenClaw configure करता है, port `38974` पर
`openclaw gateway run` start करता है, leased private group में driver-bot readiness
message पोस्ट करता है, फिर visible VNC desktop से screenshot और MP4 capture करता
है। Bot token कभी Telegram Desktop में log in नहीं करता; यह केवल OpenClaw को
configure करता है। Desktop viewer एक अलग Telegram user session है, जिसे
`--telegram-profile-archive-env <name>` से restore किया जाता है या VNC के माध्यम से
manually बनाया जाता है और `--keep-lease` के साथ alive रखा जाता है।

उपयोगी Telegram desktop builder flags:

- `--lease-id <cbx_...>` उस VM के विरुद्ध rerun करता है जहां operator ने पहले से Telegram Desktop में log in किया है।
- `--telegram-profile-archive-env <name>` उस env var से base64 `.tgz` Telegram Desktop profile archive पढ़ता है और launch से पहले restore करता है।
- `--telegram-profile-dir <remote-path>` remote Telegram Desktop profile directory नियंत्रित करता है। डिफ़ॉल्ट `$HOME/.local/share/TelegramDesktop` है।
- `--no-gateway-setup` OpenClaw configure किए बिना Telegram Desktop install और open करता है।
- `--credential-source convex --credential-role ci` direct Telegram env tokens के बजाय shared credential broker का उपयोग करता है।

हर PR-publishing scenario अपनी report के पास `mantis-evidence.json` लिखता है।
यह schema scenario code और GitHub comments के बीच handoff है:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord Status Reactions QA",
  "summary": "Human-readable top summary for the PR comment.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "queued-only" },
    "candidate": { "sha": "...", "status": "pass", "expected": "queued -> thinking -> done" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Baseline queued-only",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Baseline Discord timeline",
      "width": 420
    }
  ]
}
```

Artifact `path` values manifest directory के सापेक्ष होते हैं। `targetPath`
values configured Mantis R2/S3 artifact prefix के अंतर्गत relative paths होते हैं।
Publisher path traversal reject करता है और optional previews या videos अनुपलब्ध
होने पर `"required": false` चिह्नित entries skip करता है।

समर्थित artifact kinds:

- `timeline`: deterministic scenario screenshot, आमतौर पर before/after।
- `desktopScreenshot`: VNC/browser desktop screenshot।
- `motionPreview`: desktop recording से जनरेट किया गया inline animated GIF।
- `motionClip`: static lead-in और tail हटाने वाला motion-trimmed MP4।
- `fullVideo`: गहरी inspection के लिए full MP4 recording।
- `metadata`: JSON/log sidecar।
- `report`: Markdown report।

Reusable publisher `scripts/mantis/publish-pr-evidence.mjs` है। Workflows इसे
manifest, target PR, artifact target root, comment marker, Actions artifact URL,
run URL, और request source के साथ call करते हैं। यह declared artifacts को
configured Mantis R2/S3 bucket में upload करता है, inline images/previews और
linked videos के साथ summary-first PR comment बनाता है, फिर मौजूदा marker comment
update करता है या नया बनाता है। Workflows public URLs के साथ
`https://artifacts.openclaw.ai` के अंतर्गत `openclaw-crabbox-artifacts` पर publish
करते हैं। वे bucket, region, और public URL values सीधे provide करते हैं। Reusable
publisher को इनकी आवश्यकता होती है:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`

आप status-reactions run को सीधे PR comment से भी trigger कर सकते हैं:

```text
@openclaw-mantis discord status reactions
```

Comment trigger जानबूझकर narrow है। यह केवल write, maintain, या admin access वाले
users के pull request comments पर चलता है, और यह केवल Discord status-reaction
requests पहचानता है। डिफ़ॉल्ट रूप से यह known bad baseline ref और current PR head
SHA को candidate के रूप में उपयोग करता है। Maintainers किसी भी ref को override कर
सकते हैं:

```text
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
```

Telegram live QA को PR comment से भी trigger किया जा सकता है:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

डिफ़ॉल्ट रूप से यह current PR head SHA को candidate के रूप में उपयोग करता है और
`telegram-status-command` चलाता है। Maintainers किसी specific ref या pre-warmed
Crabbox desktop की आवश्यकता होने पर `candidate=...`, `provider=aws|hetzner`, और
`lease=<cbx_...>` override कर सकते हैं।

ClawSweeper command examples:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

पहला command explicit और scenario-focused है। दूसरा बाद में labels, changed files,
और ClawSweeper review findings से किसी PR या issue को recommended Mantis scenarios
पर map कर सकता है।

## Run lifecycle

1. Credentials acquire करें।
2. VM allocate या reuse करें।
3. जब scenario को UI evidence चाहिए हो, desktop/browser profile prepare करें।
4. Baseline ref के लिए clean checkout prepare करें।
5. Dependencies install करें और केवल वही build करें जिसकी scenario को आवश्यकता है।
6. Isolated state directory के साथ child OpenClaw Gateway start करें।
7. Live transport, provider, model, और browser profile configure करें।
8. Scenario run करें और baseline evidence capture करें।
9. Gateway stop करें और logs preserve करें।
10. उसी VM में candidate ref prepare करें।
11. वही scenario run करें और candidate evidence capture करें।
12. Oracle results और visual evidence compare करें।
13. Markdown, JSON, logs, screenshots, और optional trace artifacts लिखें।
14. GitHub Actions artifacts upload करें।
15. संक्षिप्त PR या Discord status message पोस्ट करें।

Scenario दो अलग तरीकों से fail हो सकना चाहिए:

- **Bug reproduced**: baseline expected तरीके से fail हुआ।
- **Harness failure**: bug oracle meaningful होने से पहले environment setup, credentials, Discord API, browser, या
  provider fail हुआ।

Final report को इन cases को अलग रखना चाहिए ताकि maintainers flaky environment को
product behavior के साथ confuse न करें।

## Discord MVP

पहले scenario को guild channels में Discord status reactions target करना चाहिए,
जहां source reply delivery mode `message_tool_only` है।

यह अच्छा Mantis seed क्यों है:

- यह Discord में triggering message पर reactions के रूप में visible है।
- इसके पास Discord message reaction state के माध्यम से strong REST oracle है।
- यह real OpenClaw Gateway, Discord bot auth, message dispatch,
  source reply delivery mode, status reaction state, और model turn lifecycle को exercise करता है।
- यह इतना narrow है कि first implementation honest बनी रहती है।

Expected scenario shape:

```yaml
id: discord-status-reactions-tool-only
transport: discord
baseline:
  expect:
    reproduced: true
candidate:
  expect:
    fixed: true
config:
  messages:
    ackReaction: "👀"
    ackReactionScope: "group-mentions"
    groupChat:
      visibleReplies: "message_tool"
    statusReactions:
      enabled: true
      timing:
        debounceMs: 0
discord:
  requireMention: true
  notifyChannel: operator-notify
evidence:
  rest:
    messageReactions: true
  browser:
    screenshotMessageRow: true
```

Baseline evidence में queued acknowledgement reaction दिखना चाहिए लेकिन tool-only
mode में lifecycle transition नहीं। Candidate evidence में lifecycle status
reactions चलते दिखने चाहिए जब `messages.statusReactions.enabled` explicit रूप से
true हो।

Executable first slice opt-in Discord live QA scenario है:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

यह SUT को always-on guild handling, `visibleReplies:
"message_tool"`, `ackReaction: "👀"`, और explicit status reactions के साथ configure
करता है। Oracle real Discord triggering message poll करता है और observed sequence
`👀 -> 🤔 -> 👍` की अपेक्षा करता है। Artifacts में
`discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html`, और
`discord-status-reactions-tool-only-timeline.png` शामिल हैं।

## मौजूदा QA pieces

Mantis को zero से start करने के बजाय मौजूदा private QA stack पर build करना चाहिए:

- `pnpm openclaw qa discord` पहले से driver और SUT bots के साथ live Discord lane चलाता है।
- Live transport runner पहले से `.artifacts/qa-e2e/` के अंतर्गत reports, QA evidence, और
  transport-specific artifacts लिखता है।
- Convex credential leases पहले से shared live transport credentials तक exclusive access देते हैं।
- Browser control service पहले से screenshots, snapshots,
  headless managed profiles, और remote CDP profiles support करता है।
- QA Lab के पास पहले से transport-shaped testing के लिए debugger UI और bus है।

पहला Mantis implementation इन pieces के ऊपर एक thin before/after runner, और एक
visual evidence layer हो सकता है।

## Evidence model

हर run एक stable artifact directory लिखता है:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-summary.json
  baseline/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  candidate/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  comparison.json
  run.log
```

`mantis-summary.json` मशीन-पठनीय सत्य का स्रोत होना चाहिए। Markdown रिपोर्ट PR टिप्पणियों और मानवीय समीक्षा के लिए है।

सारांश में ये शामिल होने चाहिए:

- परीक्षण किए गए refs और SHAs
- ट्रांसपोर्ट और परिदृश्य id
- मशीन प्रदाता और मशीन id या lease id
- गुप्त मानों के बिना क्रेडेंशियल स्रोत
- बेसलाइन परिणाम
- कैंडिडेट परिणाम
- क्या बग बेसलाइन पर पुनरुत्पादित हुआ
- क्या कैंडिडेट ने उसे ठीक किया
- आर्टिफैक्ट पथ
- सैनिटाइज की गई सेटअप या क्लीनअप समस्याएं

स्क्रीनशॉट प्रमाण हैं, secrets नहीं। फिर भी उन्हें redaction अनुशासन चाहिए: निजी चैनल नाम, उपयोगकर्ता नाम, या संदेश सामग्री दिखाई दे सकती है। सार्वजनिक PRs के लिए, जब तक redaction कहानी मजबूत न हो, inline images के बजाय GitHub Actions artifact links को प्राथमिकता दें।

## ब्राउज़र और VNC

ब्राउज़र lane के दो मोड हैं:

- **Headless automation**: CI के लिए डिफॉल्ट। Chrome CDP सक्षम करके चलता है, और Playwright या OpenClaw browser control स्क्रीनशॉट कैप्चर करता है।
- **VNC rescue**: उसी VM पर सक्षम, जब login, MFA, Discord anti-automation, या दृश्य debugging के लिए इंसान की जरूरत हो।

Discord observer browser profile इतना persistent होना चाहिए कि हर run में login न करना पड़े, लेकिन personal browser state से isolated होना चाहिए। कोई profile Mantis machine pool से संबंधित होता है, developer laptop से नहीं।

जब Mantis अटकता है, तो वह इन चीजों के साथ Discord status message पोस्ट करता है:

- run id
- scenario id
- machine provider
- artifact directory
- उपलब्ध होने पर VNC या noVNC connection instructions
- छोटा blocker text

पहला private deployment ये messages मौजूदा operator channel पर पोस्ट कर सकता है और बाद में dedicated Mantis channel पर जा सकता है।

## मशीनें

पहले remote implementation के लिए Mantis को Crabbox के माध्यम से AWS को प्राथमिकता देनी चाहिए। Crabbox हमें warmed machines, lease tracking, hydration, logs, results, और cleanup देता है। अगर AWS capacity बहुत धीमी या अनुपलब्ध हो, तो उसी machine interface के पीछे Hetzner provider जोड़ें।

न्यूनतम VM आवश्यकताएं:

- desktop-capable Chrome या Chromium install वाला Linux
- browser automation के लिए CDP access
- rescue के लिए VNC या noVNC
- Node 22 और pnpm
- OpenClaw checkout और dependency cache
- Playwright इस्तेमाल होने पर Playwright Chromium browser cache
- एक OpenClaw Gateway, एक browser, और एक model run के लिए पर्याप्त CPU और memory
- Discord, GitHub, model providers, और credential broker तक outbound access

VM को expected credential या browser profile stores के बाहर long-lived raw secrets नहीं रखने चाहिए।

## Secrets

Secrets remote runs के लिए GitHub organization या repository secrets में, और local runs के लिए local operator-controlled secret file में रहते हैं।

अनुशंसित secret names:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- public GitHub artifact uploads के लिए `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

दीर्घकाल में, Convex credential pool live transport credentials के लिए सामान्य स्रोत बना रहना चाहिए। GitHub secrets broker और fallback lanes को bootstrap करते हैं। Discord status-reactions workflow Mantis Crabbox secrets को वापस उन `CRABBOX_COORDINATOR` और `CRABBOX_COORDINATOR_TOKEN` environment variables से map करता है जिनकी Crabbox CLI अपेक्षा करती है। सादे `CRABBOX_*` GitHub secret names compatibility fallback के रूप में स्वीकार बने रहते हैं।

Mantis runner को कभी ये print नहीं करना चाहिए:

- Discord bot tokens
- provider API keys
- browser cookies
- auth profile contents
- VNC passwords
- raw credential payloads

Public artifact uploads को bot, guild, channel, और message ids जैसे Discord target metadata को भी redact करना चाहिए। GitHub smoke workflow इसी कारण `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` सक्षम करता है।

अगर कोई token गलती से issue, PR, chat, या log में paste हो जाए, तो नया secret store होने के बाद उसे rotate करें।

## GitHub artifacts और PR comments

Mantis workflows को पूरे evidence bundle को short-lived Actions artifact के रूप में upload करना चाहिए। जब workflow bug report या fix PR के लिए चलाया जाए, तो उसे configured Mantis R2/S3 bucket में redacted inline media भी publish करना चाहिए और उस bug या fix PR पर inline before/after screenshots के साथ comment upsert करना चाहिए। primary proof को केवल generic QA automation PR पर पोस्ट न करें। Raw logs, observed messages, और अन्य bulky evidence Actions artifact में रहते हैं।

Production workflows को वे comments Mantis GitHub App से पोस्ट करने चाहिए, `github-actions[bot]` से नहीं। app id और private key को `MANTIS_GITHUB_APP_ID` और `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions secrets के रूप में store करें। workflow upsert key के रूप में hidden marker इस्तेमाल करता है, token उसे edit कर सके तो उस comment को update करता है, और जब पुराने bot-owned marker को edit नहीं किया जा सकता, तो नया Mantis-owned comment बनाता है।

PR comment छोटा और दृश्य होना चाहिए:

```md
Mantis Discord Status Reactions QA

Summary: Mantis reran the reported Discord status-reaction bug against the known
bad baseline and the candidate fix. The baseline reproduced the bug, while the
candidate showed the expected queued -> thinking -> done sequence.

- Scenario: `discord-status-reactions-tool-only`
- Run: <workflow run link>
- Artifact: <artifact link>
- Baseline: `<status>` at `<sha>`
- Candidate: `<status>` at `<sha>`

| Baseline            | Candidate           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

जब run इसलिए fail हो कि harness fail हुआ, तो comment में candidate fail होने का संकेत देने के बजाय यही कहना चाहिए।

## Private deployment notes

Private deployment में पहले से Mantis Discord application हो सकती है। जब उसके पास सही bot permissions हों और उसे सुरक्षित रूप से rotate किया जा सकता हो, तो दूसरी app बनाने के बजाय उसी application का reuse करें।

शुरुआती operator notification channel को secrets या deployment configuration के माध्यम से set करें। पहले यह किसी मौजूदा maintainer या operations channel की ओर point कर सकता है, फिर dedicated Mantis channel बनने के बाद वहां move कर सकता है।

इस document में guild ids, channel ids, bot tokens, browser cookies, या VNC passwords न डालें। उन्हें GitHub secrets, credential broker, या operator के local secret store में store करें।

## परिदृश्य जोड़ना

Mantis scenario में ये declare होने चाहिए:

- id और title
- transport
- required credentials
- baseline ref policy
- candidate ref policy
- OpenClaw config patch
- setup steps
- stimulus
- expected baseline oracle
- expected candidate oracle
- visual capture targets
- timeout budget
- cleanup steps

Scenarios को छोटे, typed oracles को प्राथमिकता देनी चाहिए:

- reaction bugs के लिए Discord reaction state
- threading bugs के लिए Discord message references
- Slack bugs के लिए Slack thread ts और reaction API state
- email bugs के लिए email message ids और headers
- जब UI ही एकमात्र भरोसेमंद observable हो, तब browser screenshots

Vision checks additive होने चाहिए। अगर platform API bug साबित कर सकता है, तो API को pass/fail oracle के रूप में इस्तेमाल करें और screenshots को human confidence के लिए रखें।

## Provider expansion

Discord के बाद, वही runner ये जोड़ सकता है:

- Slack: reactions, threads, app mentions, modals, file uploads.
- Email: जहां connectors पर्याप्त नहीं हैं, वहां `gog` का उपयोग करके Gmail auth और message threading.
- WhatsApp: QR login, re-identification, message delivery, media, reactions.
- Telegram: उपलब्ध होने पर group mention gating, commands, reactions.
- Matrix: encrypted rooms, thread या reply relations, restart resume.

हर transport में एक सस्ता smoke scenario और एक या अधिक bug-class scenarios होने चाहिए। महंगे visual scenarios opt-in रहने चाहिए।

## खुले प्रश्न

- मौजूदा Mantis bot reuse होने पर कौन सा Discord bot driver होना चाहिए, और कौन सा SUT?
- observer browser login को पहले phase के लिए human Discord account, test account, या केवल bot-readable REST evidence इस्तेमाल करना चाहिए?
- GitHub को PRs के लिए Mantis artifacts कितने समय तक retain करने चाहिए?
- ClawSweeper को maintainer command की प्रतीक्षा करने के बजाय Mantis की automatic recommendation कब करनी चाहिए?
- public PRs के लिए upload से पहले screenshots redact या crop किए जाने चाहिए?

---
read_when:
    - चैनल कनेक्टिविटी या Gateway स्वास्थ्य का निदान
    - स्वास्थ्य जांच CLI कमांड और विकल्पों को समझना
summary: Health check कमांड और Gateway स्वास्थ्य निगरानी
title: स्वास्थ्य जांच
x-i18n:
    generated_at: "2026-06-28T23:08:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d6475bef9fead191c11a801151d4fab76c47034d3f30f90a18c15d6e32b5d26
    source_path: gateway/health.md
    workflow: 16
---

अनुमान लगाए बिना चैनल कनेक्टिविटी सत्यापित करने की संक्षिप्त मार्गदर्शिका।

## त्वरित जांचें

- `openclaw status` — स्थानीय सारांश: gateway पहुंच/मोड, अपडेट संकेत, लिंक किए गए चैनल auth की उम्र, सत्र + हाल की गतिविधि।
- `openclaw status --all` — पूर्ण स्थानीय निदान (केवल-पठन, रंगीन, डिबगिंग के लिए पेस्ट करना सुरक्षित)।
- `openclaw status --deep` — चल रहे gateway से लाइव स्वास्थ्य जांच मांगता है (`health` with `probe:true`), समर्थित होने पर प्रति-अकाउंट चैनल जांच सहित।
- `openclaw health` — चल रहे gateway से उसका स्वास्थ्य स्नैपशॉट मांगता है (केवल WS; CLI से कोई सीधा चैनल socket नहीं)।
- `openclaw health --verbose` — लाइव स्वास्थ्य जांच बाध्य करता है और gateway कनेक्शन विवरण प्रिंट करता है।
- `openclaw health --json` — मशीन-पठनीय स्वास्थ्य स्नैपशॉट आउटपुट।
- agent को invoke किए बिना स्थिति उत्तर पाने के लिए WhatsApp/WebChat में `/status` को स्वतंत्र संदेश के रूप में भेजें।
- लॉग: `/tmp/openclaw/openclaw-*.log` को tail करें और `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound` के लिए filter करें।

Discord और अन्य chat providers के लिए, session rows socket liveness नहीं हैं।
`openclaw sessions`, Gateway `sessions.list`, और agent `sessions_list` tool
संग्रहीत conversation state पढ़ते हैं। कोई provider reconnect कर सकता है और किसी नए session row के materialize होने से पहले स्वस्थ channel
status दिखा सकता है। लाइव connectivity checks के लिए ऊपर दिए गए channel status और
health commands का उपयोग करें।

## गहन निदान

- Disk पर creds: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime हाल का होना चाहिए)।
- Session store: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (path को config में override किया जा सकता है)। Count और हाल के recipients `status` के जरिए दिखाए जाते हैं।
- Relink flow: जब status codes 409–515 या logs में `loggedOut` दिखाई दें, तब `openclaw channels logout && openclaw channels login --verbose`। (नोट: QR login flow pairing के बाद status 515 के लिए एक बार auto-restart करता है।)
- Diagnostics default रूप से enabled हैं। Gateway operational facts record करता है जब तक `diagnostics.enabled: false` set न हो। Memory events RSS/heap byte counts, threshold pressure, और growth pressure record करते हैं। Critical memory pressure gateway logger के जरिए log होता है। जब `diagnostics.memoryPressureSnapshot: true` set हो, critical memory pressure V8 heap stats, उपलब्ध होने पर Linux cgroup counters, active resource counts, और redacted relative path द्वारा सबसे बड़ी session/transcript files के साथ pre-OOM stability bundle भी लिखता है। Liveness warnings event-loop delay, event-loop utilization, CPU-core ratio, और active/waiting/queued session counts record करती हैं जब process चल रहा हो लेकिन saturated हो। Oversized-payload events record करते हैं कि क्या reject, truncate, या chunk किया गया, साथ ही उपलब्ध होने पर sizes और limits भी। वे message text, attachment contents, webhook body, raw request या response body, tokens, cookies, या secret values record नहीं करते। वही Heartbeat bounded stability recorder शुरू करता है, जो `openclaw gateway stability` या `diagnostics.stability` Gateway RPC के जरिए उपलब्ध है। Fatal Gateway exits, shutdown timeouts, और restart startup failures latest recorder snapshot को `~/.openclaw/logs/stability/` के अंतर्गत persist करते हैं जब events मौजूद हों; critical memory pressure भी ऐसा केवल तब करता है जब `diagnostics.memoryPressureSnapshot: true` set हो। नए saved bundle को `openclaw gateway stability --bundle latest` से inspect करें।
- Bug reports के लिए, `openclaw gateway diagnostics export` चलाएं और generated zip attach करें। Export एक Markdown summary, newest stability bundle, sanitized log metadata, sanitized Gateway status/health snapshots, और config shape को combine करता है। इसे share करने के लिए बनाया गया है: chat text, webhook bodies, tool outputs, credentials, cookies, account/message identifiers, और secret values omit या redact किए जाते हैं। [Diagnostics Export](/hi/gateway/diagnostics) देखें।

## Health monitor config

- `gateway.channelHealthCheckMinutes`: gateway कितनी बार channel health check करता है। Default: `5`। Health-monitor restarts को globally disable करने के लिए `0` set करें।
- `gateway.channelStaleEventThresholdMinutes`: health monitor द्वारा connected channel को stale मानकर restart करने से पहले वह कितनी देर idle रह सकता है। Default: `30`। इसे `gateway.channelHealthCheckMinutes` से greater than or equal रखें।
- `gateway.channelMaxRestartsPerHour`: प्रति channel/account health-monitor restarts के लिए rolling one-hour cap। Default: `10`।
- `channels.<provider>.healthMonitor.enabled`: global monitoring enabled रखते हुए किसी specific channel के लिए health-monitor restarts disable करें।
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: multi-account override जो channel-level setting पर वरीयता पाता है।
- ये per-channel overrides उन built-in channel monitors पर लागू होते हैं जो आज इन्हें expose करते हैं: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram, और WhatsApp।

## Uptime monitoring

External uptime monitoring services को dedicated `/health` endpoint का उपयोग करना चाहिए, `/v1/chat/completions` का नहीं।

- **उपयोग करें:** `GET /health` — तुरंत response, कोई session create नहीं, कोई LLM call नहीं, `{"ok":true,"status":"live"}` return करता है
- **उपयोग न करें:** health checks के लिए `/v1/chat/completions` — हर request skill snapshot, context assembly, और LLM calls के साथ full agent session create करती है

जब कोई `x-openclaw-session-key` header या `user` field provide नहीं किया जाता, `/v1/chat/completions` हर request के लिए नया random session generate करता है। हर 15 मिनट ping करने वाली monitoring services ~96 sessions/day create करती हैं, जिनमें से हर एक 4–22KB consume करता है। समय के साथ इससे session store bloat होता है और context window overflow हो सकता है।

### Monitoring service setup examples

- **BetterStack:** Health check URL को `https://<your-gateway-host>:<port>/health` पर set करें
- **UptimeRobot:** URL `https://<your-gateway-host>:<port>/health` के साथ नया HTTP monitor add करें
- **Generic:** Gateway स्वस्थ होने पर `/health` पर कोई भी HTTP GET `{"ok":true}` के साथ 200 return करता है

## जब कुछ fail हो

- `logged out` या status 409–515 → `openclaw channels logout` फिर `openclaw channels login` से relink करें।
- Gateway unreachable → इसे start करें: `openclaw gateway --port 18789` (port busy हो तो `--force` use करें)।
- कोई inbound messages नहीं → confirm करें कि linked phone online है और sender allowed है (`channels.whatsapp.allowFrom`); group chats के लिए, सुनिश्चित करें कि allowlist + mention rules match करते हैं (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`)।

## Dedicated "health" command

`openclaw health` चल रहे gateway से उसका health snapshot मांगता है (CLI से कोई direct channel
sockets नहीं)। Default रूप से यह fresh cached gateway snapshot return कर सकता है; फिर
gateway background में उस cache को refresh करता है। `openclaw health --verbose` इसके बजाय
live probe बाध्य करता है। Command उपलब्ध होने पर linked creds/auth age,
per-channel probe summaries, session-store summary, और probe duration report करता है। Gateway unreachable होने या probe fail/timeout होने पर यह
non-zero exit करता है।

Options:

- `--json`: machine-readable JSON output
- `--timeout <ms>`: default 10s probe timeout override करें
- `--verbose`: live probe बाध्य करें और gateway connection details print करें
- `--debug`: `--verbose` का alias

Health snapshot में शामिल हैं: `ok` (boolean), `ts` (timestamp), `durationMs` (probe time), per-channel status, agent availability, और session-store summary।

## संबंधित

- [Gateway runbook](/hi/gateway)
- [Diagnostics export](/hi/gateway/diagnostics)
- [Gateway troubleshooting](/hi/gateway/troubleshooting)

---
read_when:
    - आपको जानना होगा कि कौन-से env vars लोड होते हैं, और किस क्रम में
    - आप Gateway में अनुपलब्ध API कुंजियों को डीबग कर रहे हैं
    - आप प्रदाता प्रमाणीकरण या परिनियोजन परिवेशों का दस्तावेज़ीकरण कर रहे हैं
summary: OpenClaw पर्यावरण चरों को कहाँ लोड करता है और प्राथमिकता क्रम
title: पर्यावरण चर
x-i18n:
    generated_at: "2026-06-28T23:15:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e36f93efe29f9cc0e9942659c323a635d21fcaa436427dcb21f5694e5d0458b
    source_path: help/environment.md
    workflow: 16
---

OpenClaw कई स्रोतों से environment variables खींचता है। नियम है **मौजूदा मानों को कभी override न करें**।
Workspace `.env` फ़ाइलें कम-विश्वसनीय स्रोत हैं: OpenClaw precedence लागू करने से पहले workspace `.env` से provider credentials और सुरक्षित runtime controls को अनदेखा करता है।

## Precedence (सबसे ऊँचा → सबसे नीचा)

1. **Process environment** (Gateway प्रक्रिया के पास parent shell/daemon से पहले से जो है)।
2. **मौजूदा working directory में `.env`** (dotenv default; override नहीं करता; provider credentials और सुरक्षित runtime controls अनदेखे किए जाते हैं)।
3. **Global `.env`** `~/.openclaw/.env` पर (अर्थात `$OPENCLAW_STATE_DIR/.env`; provider API keys के लिए अनुशंसित; override नहीं करता)।
4. **Config `env` block** `~/.openclaw/openclaw.json` में (केवल missing होने पर लागू)।
5. **Optional login-shell import** (`env.shellEnv.enabled` या `OPENCLAW_LOAD_SHELL_ENV=1`), केवल missing expected keys के लिए लागू।

Ubuntu के fresh installs पर, जो default state dir का उपयोग करते हैं, OpenClaw global `.env` के बाद `~/.config/openclaw/gateway.env` को compatibility fallback के रूप में भी मानता है। यदि दोनों फ़ाइलें मौजूद हैं और असहमत हैं, तो OpenClaw `~/.openclaw/.env` रखता है और warning print करता है।

यदि config file पूरी तरह missing है, तो step 4 skip हो जाता है; shell import enabled होने पर फिर भी चलता है।

## Provider credentials और workspace `.env`

Provider API keys केवल workspace `.env` में न रखें। OpenClaw workspace `.env` फ़ाइलों से provider credential environment variables को अनदेखा करता है, जिनमें `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, और `FIRECRAWL_API_KEY` जैसी common keys शामिल हैं।

Provider credentials के लिए इन trusted sources में से किसी एक का उपयोग करें:

- Gateway process environment, जैसे shell, launchd/systemd unit, container secret, या CI secret।
- Global runtime dotenv file `~/.openclaw/.env` या `$OPENCLAW_STATE_DIR/.env` पर।
- Config `env` block `~/.openclaw/openclaw.json` में।
- Optional login-shell import जब `env.shellEnv.enabled` या `OPENCLAW_LOAD_SHELL_ENV=1` enabled हो।

यदि आपने पहले provider keys केवल workspace `.env` में store की थीं, तो उन्हें ऊपर दिए गए trusted sources में से किसी एक में move करें। Workspace `.env` अब भी ordinary project variables दे सकता है जो credentials, endpoint redirects, host overrides, या `OPENCLAW_*` runtime controls नहीं हैं।

Security rationale के लिए [Workspace `.env` files](/hi/gateway/security#workspace-env-files) देखें।

## Config `env` block

Inline env vars set करने के दो equivalent तरीके (दोनों non-overriding हैं):

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

Config `env` block केवल literal string values स्वीकार करता है। यह
`file:...` values expand नहीं करता; उदाहरण के लिए, `XAI_API_KEY: "file:secrets/xai-api-key.txt"`
providers को उसी exact string के रूप में pass किया जाता है।

File-backed provider keys के लिए, credential field पर SecretRef का उपयोग करें जो
इसे support करता है:

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

Supported fields के लिए [Secrets Management](/hi/gateway/secrets) और
[SecretRef credential surface](/hi/reference/secretref-credential-surface) देखें।

## Shell env import

`env.shellEnv` आपका login shell चलाता है और केवल **missing** expected keys import करता है:

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

Env var equivalents:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Exec shell snapshots

Non-Windows Gateway hosts पर, bash और zsh `exec` commands default रूप से startup snapshot का उपयोग करते हैं।
इस path को disable करने के लिए Gateway process environment में `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` set करें।
Values `false`, `no`, और `off` भी इसे disable करते हैं। Per-call `exec.env` values
snapshots toggle नहीं कर सकते या snapshot cache redirect नहीं कर सकते।

## Runtime-injected env vars

OpenClaw spawned child processes में context markers भी inject करता है:

- `OPENCLAW_SHELL=exec`: `exec` tool के माध्यम से चलाए गए commands के लिए set।
- `OPENCLAW_SHELL=acp`: ACP runtime backend process spawns के लिए set (उदाहरण `acpx`)।
- `OPENCLAW_SHELL=acp-client`: `openclaw acp client` के लिए set जब वह ACP bridge process spawn करता है।
- `OPENCLAW_SHELL=tui-local`: local TUI `!` shell commands के लिए set।
- `OPENCLAW_CLI=1`: CLI entry point द्वारा spawned child processes के लिए set।

ये runtime markers हैं (required user config नहीं)। इन्हें shell/profile logic में
context-specific rules लागू करने के लिए उपयोग किया जा सकता है।

## UI env vars

- `OPENCLAW_THEME=light`: जब आपके terminal का background light हो, light TUI palette force करें।
- `OPENCLAW_THEME=dark`: dark TUI palette force करें।
- `COLORFGBG`: यदि आपका terminal इसे export करता है, तो OpenClaw TUI palette auto-pick करने के लिए background color hint का उपयोग करता है।

## Config में env var substitution

आप `${VAR_NAME}` syntax का उपयोग करके config string values में env vars को सीधे reference कर सकते हैं:

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

पूरी जानकारी के लिए [Configuration: Env var substitution](/hi/gateway/configuration-reference#env-var-substitution) देखें।

## Secret refs बनाम `${ENV}` strings

OpenClaw दो env-driven patterns support करता है:

- Config values में `${VAR}` string substitution।
- उन fields के लिए SecretRef objects (`{ source: "env", provider: "default", id: "VAR" }`) जो secrets references support करते हैं।

दोनों activation time पर process env से resolve होते हैं। SecretRef details [Secrets Management](/hi/gateway/secrets) में documented हैं।
Config `env` block स्वयं SecretRefs या `file:...`
shorthand values resolve नहीं करता।

## Path-related env vars

| Variable                 | Purpose                                                                                                                                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Internal OpenClaw path defaults (`~/.openclaw/`, agent dirs, sessions, credentials, installer onboarding, और default dev checkout) के लिए उपयोग की जाने वाली home directory override करें। OpenClaw को dedicated service user के रूप में चलाते समय उपयोगी। |
| `OPENCLAW_STATE_DIR`     | State directory override करें (default `~/.openclaw`)।                                                                                                                                                                                   |
| `OPENCLAW_CONFIG_PATH`   | Config file path override करें (default `~/.openclaw/openclaw.json`)।                                                                                                                                                                    |
| `OPENCLAW_INCLUDE_ROOTS` | Directories की path-list जहाँ `$include` directives config directory के बाहर files resolve कर सकते हैं (default: none — `$include` config dir तक सीमित है)। Tilde-expanded।                                                         |

## Logging

| Variable                         | Purpose                                                                                                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | File और console दोनों के लिए log level override करें (जैसे `debug`, `trace`)। Config में `logging.level` और `logging.consoleLevel` पर precedence लेता है। Invalid values warning के साथ ignored होते हैं। |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Global debug logs enable किए बिना `info` level पर targeted model request/response timing diagnostics emit करें।                                                                                  |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Model payload diagnostics: `summary`, `tools`, या `full-redacted`। `full-redacted` capped और redacted है लेकिन prompt/message text शामिल कर सकता है।                                               |
| `OPENCLAW_DEBUG_SSE`             | Streaming diagnostics: first/done timing के लिए `events`, पहले पाँच redacted SSE events शामिल करने के लिए `peek`।                                                                                 |
| `OPENCLAW_DEBUG_CODE_MODE`       | Code-mode model-surface diagnostics, जिसमें provider-tool hiding और exec/wait-only enforcement शामिल हैं।                                                                                          |

### `OPENCLAW_HOME`

Set होने पर, `OPENCLAW_HOME` internal OpenClaw path defaults के लिए system home directory (`$HOME` / `os.homedir()`) को replace करता है। इसमें default state directory, config path, agent directories, credentials, installer onboarding workspace, और `openclaw update --channel dev` द्वारा उपयोग किया जाने वाला default dev checkout शामिल है।

**Precedence:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > Android पर Termux `PREFIX` home fallback > `os.homedir()`

**Example** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` को tilde path पर भी set किया जा सकता है (जैसे `~/svc`), जो use से पहले उसी OS home fallback chain का उपयोग करके expanded होता है।

Explicit path variables जैसे `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, और `OPENCLAW_GIT_DIR` फिर भी precedence लेते हैं। OS-account tasks जैसे shell startup file detection, package-manager setup, और host `~` expansion अब भी real system home का उपयोग कर सकते हैं।

## nvm users: web_fetch TLS failures

यदि Node.js **nvm** के माध्यम से installed था (system package manager नहीं), तो built-in `fetch()` 
nvm के bundled CA store का उपयोग करता है, जिसमें modern root CAs missing हो सकते हैं (Let’s Encrypt के लिए ISRG Root X1/X2,
DigiCert Global Root G2, आदि)। इससे अधिकांश HTTPS sites पर `web_fetch` `"fetch failed"` के साथ fail होता है।

Linux पर, OpenClaw nvm को automatically detect करता है और actual startup environment में fix apply करता है:

- `openclaw gateway install` systemd service environment में `NODE_EXTRA_CA_CERTS` लिखता है
- `openclaw` CLI entrypoint Node startup से पहले `NODE_EXTRA_CA_CERTS` set करके खुद को re-exec करता है

**Manual fix (पुराने versions या direct `node ...` launches के लिए):**

OpenClaw start करने से पहले variable export करें:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

इस variable के लिए केवल `~/.openclaw/.env` में लिखने पर rely न करें; Node process startup पर
`NODE_EXTRA_CA_CERTS` पढ़ता है।

## Legacy environment variables

OpenClaw केवल `OPENCLAW_*` environment variables पढ़ता है। Earlier releases से legacy
`CLAWDBOT_*` और `MOLTBOT_*` prefixes silently
ignored होते हैं।

यदि startup पर Gateway process पर इनमें से कोई भी अब भी set है, तो OpenClaw एक
single Node deprecation warning (`OPENCLAW_LEGACY_ENV_VARS`) emit करता है, जिसमें
detected prefixes और total count listed होते हैं। Legacy prefix को `OPENCLAW_` से replace करके प्रत्येक value rename करें (उदाहरण `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`); old names का कोई effect नहीं होता।

## Related

- [Gateway configuration](/hi/gateway/configuration)
- [FAQ: env vars and .env loading](/hi/help/faq#env-vars-and-env-loading)
- [Models overview](/hi/concepts/models)

---
read_when:
    - प्रदाता क्रेडेंशियल्स और `auth-profiles.json` refs के लिए SecretRefs कॉन्फ़िगर करना
    - प्रोडक्शन में सीक्रेट्स को सुरक्षित रूप से रीलोड, ऑडिट, कॉन्फ़िगर और लागू करना
    - स्टार्टअप fail-fast, निष्क्रिय-सतह फ़िल्टरिंग, और अंतिम-ज्ञात-अच्छे व्यवहार को समझना
sidebarTitle: Secrets management
summary: 'Secrets प्रबंधन: SecretRef अनुबंध, runtime snapshot व्यवहार, और सुरक्षित एक-तरफा scrubbing'
title: सीक्रेट प्रबंधन
x-i18n:
    generated_at: "2026-06-28T23:13:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d90346b1e4abc39cf1ab314c242f0b976aa83ee06f6dfeb787aafb19fa90de9
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw additive SecretRefs का समर्थन करता है ताकि समर्थित क्रेडेंशियल्स को कॉन्फ़िगरेशन में plaintext के रूप में संग्रहीत करने की आवश्यकता न हो।

<Note>
Plaintext अभी भी काम करता है। SecretRefs प्रत्येक क्रेडेंशियल के लिए opt-in हैं।
</Note>

<Warning>
Plaintext क्रेडेंशियल्स एजेंट-पठनीय बने रहते हैं यदि वे उन फ़ाइलों में संग्रहीत हैं जिन्हें
एजेंट निरीक्षण कर सकता है, जिनमें `openclaw.json`, `auth-profiles.json`, `.env`, या
जनरेट की गई `agents/*/agent/models.json` फ़ाइलें शामिल हैं। SecretRefs उस स्थानीय blast
radius को केवल तब घटाते हैं जब हर समर्थित क्रेडेंशियल माइग्रेट हो चुका हो और
`openclaw secrets audit --check` कोई plaintext secret residue रिपोर्ट न करे।
</Warning>

## लक्ष्य और रनटाइम मॉडल

Secrets को इन-मेमरी रनटाइम स्नैपशॉट में resolve किया जाता है।

- Resolution activation के दौरान eager होता है, request paths पर lazy नहीं।
- जब कोई प्रभावी रूप से सक्रिय SecretRef resolve नहीं हो पाता, startup तुरंत fail होता है।
- Reload atomic swap का उपयोग करता है: पूर्ण सफलता, या last-known-good snapshot बनाए रखें।
- SecretRef policy violations (उदाहरण के लिए SecretRef input के साथ OAuth-mode auth profiles) runtime swap से पहले activation को fail करते हैं।
- Runtime requests केवल active in-memory snapshot से पढ़ते हैं।
- पहली सफल config activation/load के बाद, runtime code paths उस active in-memory snapshot को तब तक पढ़ते रहते हैं जब तक सफल reload उसे swap नहीं कर देता।
- Outbound delivery paths भी उसी active snapshot से पढ़ते हैं (उदाहरण के लिए Discord reply/thread delivery और Telegram action sends); वे हर send पर SecretRefs को फिर से resolve नहीं करते।

इससे secret-provider outages hot request paths से दूर रहते हैं।

## एजेंट-access boundary

SecretRefs समर्थित config और generated model surfaces में credentials को persist होने से बचाते हैं,
लेकिन वे process-isolation boundary नहीं हैं। यदि कोई plaintext credential disk पर ऐसे path में रहता है
जिसे agent पढ़ सकता है, तो agent file या shell tools का उपयोग करके उस file को inspect कर
API-level redaction को bypass कर सकता है।

Production deployments के लिए जहाँ agent-accessible files scope में हैं, SecretRef migration को
complete केवल तब मानें जब ये सभी true हों:

- समर्थित credentials plaintext values के बजाय SecretRefs का उपयोग करते हैं
- legacy plaintext residue को `openclaw.json`,
  `auth-profiles.json`, `.env`, और generated `models.json` files से scrub किया गया है
- migration के बाद `openclaw secrets audit --check` clean है
- कोई भी शेष unsupported या rotating credentials operating
  system isolation, container isolation, या external credential proxy से protected हैं

इसीलिए audit/configure/apply workflow एक security migration gate है, केवल
convenience helper नहीं।

<Warning>
SecretRefs arbitrary readable files को safe नहीं बनाते। Backups, copied configs,
पुराने generated model catalogs, और unsupported credential classes को production secrets की तरह treat करना होगा
जब तक उन्हें delete न किया जाए, agent trust
boundary से बाहर move न किया जाए, या separate isolation layer से protected न किया जाए।
</Warning>

## Active-surface filtering

SecretRefs केवल प्रभावी रूप से active surfaces पर validate किए जाते हैं।

- Enabled surfaces: unresolved refs startup/reload को block करते हैं।
- Inactive surfaces: unresolved refs startup/reload को block नहीं करते।
- Inactive refs code `SECRETS_REF_IGNORED_INACTIVE_SURFACE` के साथ non-fatal diagnostics emit करते हैं।

<AccordionGroup>
  <Accordion title="Examples of inactive surfaces">
    - Disabled channel/account entries.
    - Top-level channel credentials जिन्हें कोई enabled account inherit नहीं करता।
    - Disabled tool/feature surfaces.
    - Web search provider-specific keys जिन्हें `tools.web.search.provider` द्वारा select नहीं किया गया है। Auto mode (provider unset) में, keys provider auto-detection के लिए precedence के अनुसार consult की जाती हैं जब तक कोई resolve न हो जाए। Selection के बाद, non-selected provider keys को selected होने तक inactive treat किया जाता है।
    - Sandbox SSH auth material (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData`, plus per-agent overrides) केवल तब active होता है जब effective sandbox backend default agent या enabled agent के लिए `ssh` हो।
    - `gateway.remote.token` / `gateway.remote.password` SecretRefs active हैं यदि इनमें से कोई एक true है:
      - `gateway.mode=remote`
      - `gateway.remote.url` configured है
      - `gateway.tailscale.mode` `serve` या `funnel` है
      - उन remote surfaces के बिना local mode में:
        - `gateway.remote.token` तब active होता है जब token auth win कर सकता है और कोई env/auth token configured नहीं है।
        - `gateway.remote.password` केवल तब active होता है जब password auth win कर सकता है और कोई env/auth password configured नहीं है।
    - `gateway.auth.token` SecretRef startup auth resolution के लिए inactive है जब `OPENCLAW_GATEWAY_TOKEN` set है, क्योंकि env token input उस runtime के लिए wins करता है।

  </Accordion>
</AccordionGroup>

## Gateway auth surface diagnostics

जब `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token`, या `gateway.remote.password` पर SecretRef configured होता है, gateway startup/reload surface state को explicitly log करता है:

- `active`: SecretRef effective auth surface का हिस्सा है और must resolve.
- `inactive`: SecretRef इस runtime के लिए ignored है क्योंकि कोई दूसरी auth surface wins करती है, या remote auth disabled/not active है।

ये entries `SECRETS_GATEWAY_AUTH_SURFACE` के साथ log की जाती हैं और active-surface policy द्वारा उपयोग किया गया reason शामिल करती हैं, ताकि आप देख सकें कि credential को active या inactive क्यों treat किया गया।

## Onboarding reference preflight

जब onboarding interactive mode में चलता है और आप SecretRef storage चुनते हैं, OpenClaw saving से पहले preflight validation चलाता है:

- Env refs: env var name validate करता है और confirm करता है कि setup के दौरान non-empty value visible है।
- Provider refs (`file` या `exec`): provider selection validate करता है, `id` resolve करता है, और resolved value type check करता है।
- Quickstart reuse path: जब `gateway.auth.token` पहले से SecretRef है, onboarding probe/dashboard bootstrap से पहले उसे resolve करता है (`env`, `file`, और `exec` refs के लिए) उसी fail-fast gate का उपयोग करके।

यदि validation fail होता है, onboarding error दिखाता है और आपको retry करने देता है।

## SecretRef contract

हर जगह एक object shape का उपयोग करें:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    समर्थित SecretInput fields exact string shorthands भी accept करते हैं:

    ```json5
    "${OPENAI_API_KEY}"
    "$OPENAI_API_KEY"
    ```

    Validation:

    - `provider` must match `^[a-z][a-z0-9_-]{0,63}$`
    - `id` must match `^[A-Z][A-Z0-9_]{0,127}$`

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    Validation:

    - `provider` must match `^[a-z][a-z0-9_-]{0,63}$`
    - `id` must be an absolute JSON pointer (`/...`)
    - RFC6901 escaping in segments: `~` => `~0`, `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    Validation:

    - `provider` must match `^[a-z][a-z0-9_-]{0,63}$`
    - `id` must match `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (`secret#json_key` जैसे selectors support करता है)
    - `id` में slash-delimited path segments के रूप में `.` या `..` नहीं होना चाहिए (उदाहरण के लिए `a/../b` rejected है)

  </Tab>
</Tabs>

## Provider config

Providers को `secrets.providers` के अंतर्गत define करें:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // or "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
      "team-secrets": {
        source: "exec",
        pluginIntegration: {
          pluginId: "acme-secrets",
          integrationId: "secret-store",
        },
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Env provider">
    - Optional allowlist via `allowlist`.
    - Missing/empty env values fail resolution.

  </Accordion>
  <Accordion title="File provider">
    - `path` से local file पढ़ता है।
    - `mode: "json"` JSON object payload expect करता है और `id` को pointer के रूप में resolve करता है।
    - `mode: "singleValue"` ref id `"value"` expect करता है और file contents return करता है।
    - Path को ownership/permission checks pass करने होंगे।
    - Windows fail-closed note: यदि किसी path के लिए ACL verification unavailable है, resolution fail होता है। केवल trusted paths के लिए, path security checks bypass करने हेतु उस provider पर `allowInsecurePath: true` set करें।

  </Accordion>
  <Accordion title="Exec provider">
    - Configured absolute binary path चलाता है, shell नहीं।
    - Default रूप से, `command` को regular file की ओर point करना चाहिए (symlink नहीं)।
    - Symlink command paths allow करने के लिए `allowSymlinkCommand: true` set करें (उदाहरण के लिए Homebrew shims)। OpenClaw resolved target path validate करता है।
    - Package-manager paths के लिए `allowSymlinkCommand` को `trustedDirs` के साथ pair करें (उदाहरण के लिए `["/opt/homebrew"]`)।
    - Timeout, no-output timeout, output byte limits, env allowlist, और trusted dirs support करता है।
    - Windows fail-closed note: यदि command path के लिए ACL verification unavailable है, resolution fail होता है। केवल trusted paths के लिए, path security checks bypass करने हेतु उस provider पर `allowInsecurePath: true` set करें।
    - Plugin-managed exec providers copied `command`/`args` के बजाय `pluginIntegration` का उपयोग कर सकते हैं। OpenClaw startup/reload के दौरान installed plugin manifest से current command details resolve करता है। यदि plugin
      disabled, removed, untrusted है, या अब integration declare नहीं करता,
      तो उस provider का उपयोग करने वाले active SecretRefs fail closed होते हैं।

    Request payload (stdin):

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    Response payload (stdout):

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    Optional per-id errors:

    ```json
    {
      "protocolVersion": 1,
      "values": {},
      "errors": { "providers/openai/apiKey": { "message": "not found" } }
    }
    ```

  </Accordion>
</AccordionGroup>

## File-backed API keys

Config `env` block में `file:...` strings न डालें। `env` block
literal और non-overriding है, इसलिए `file:...` resolve नहीं होता।

इसके बजाय supported credential field पर file SecretRef का उपयोग करें:

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

`mode: "singleValue"` के लिए, SecretRef `id` `"value"` है। 
`mode: "json"` के लिए, `"/providers/xai/apiKey"` जैसा absolute JSON pointer उपयोग करें।

SecretRefs accept करने वाले config fields के लिए [SecretRef credential surface](/hi/reference/secretref-credential-surface) देखें।

## Exec integration examples

<AccordionGroup>
  <Accordion title="1Password CLI">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
            trustedDirs: ["/opt/homebrew"],
            args: ["read", "op://Personal/OpenClaw QA API Key/password"],
            passEnv: ["HOME"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
  <Accordion title="Bitwarden Secrets Manager (`bws`)">
    जब आप चाहते हैं कि SecretRef आईडी Bitwarden Secrets Manager आइटम कुंजियों से मैप हों, तो resolver wrapper का उपयोग करें। रिपॉज़िटरी में
    `scripts/secrets/openclaw-bws-resolver.mjs` शामिल है; इसे उस होस्ट पर, जो Gateway चलाता है, किसी absolute
    trusted path पर इंस्टॉल या कॉपी करें।

    आवश्यकताएँ:

    - Gateway होस्ट पर Bitwarden Secrets Manager CLI (`bws`) इंस्टॉल हो।
    - `BWS_ACCESS_TOKEN` Gateway सेवा के लिए उपलब्ध हो।
    - resolver को `PATH` पास किया गया हो, या `BWS_BIN` absolute `bws`
      बाइनरी पथ पर सेट हो।
    - self-hosted Bitwarden instance का उपयोग करते समय environment में `BWS_SERVER_URL` सेट होना चाहिए।

    ```json5
    {
      secrets: {
        providers: {
          bws: {
            source: "exec",
            command: "/usr/local/bin/openclaw-bws-resolver.mjs",
            passEnv: ["BWS_ACCESS_TOKEN", "BWS_SERVER_URL", "PATH", "BWS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "bws",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    resolver अनुरोधित आईडी को batch करता है, `bws secret list` चलाता है, और matching secret `key` fields के लिए
    values लौटाता है। ऐसी keys का उपयोग करें जो exec
    SecretRef id contract को पूरा करती हों, जैसे `openclaw/providers/openai/apiKey`; underscore वाली env-var
    style keys resolver चलने से पहले ही अस्वीकार कर दी जाती हैं। यदि एक से अधिक visible Bitwarden secret में वही requested key है, तो resolver
    किसी एक को चुनने के बजाय उस id को ambiguous मानकर विफल करता है। config अपडेट करने के बाद,
    resolver path सत्यापित करें:

    ```bash
    openclaw secrets audit --allow-exec
    ```

  </Accordion>
  <Accordion title="HashiCorp Vault CLI">
    ```json5
    {
      secrets: {
        providers: {
          vault_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/vault",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
            trustedDirs: ["/opt/homebrew"],
            args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
            passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "vault_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
  <Accordion title="password-store (`pass`)">
    जब आप चाहते हैं कि SecretRef ids सीधे
    `pass` entries से मैप हों, तो एक छोटा resolver wrapper उपयोग करें। इसे ऐसे absolute path में executable के रूप में save करें जो
    आपके exec-provider path checks पास करता हो, उदाहरण के लिए
    `/usr/local/bin/openclaw-pass-resolver`। `#!/usr/bin/env node` shebang
    resolver process `PATH` से `node` resolve करता है, इसलिए
    `passEnv` में `PATH` शामिल करें। यदि `pass` उस `PATH` पर नहीं है, तो parent
    environment में `PASS_BIN` सेट करें और उसे भी `passEnv` में शामिल करें:

    ```js
    #!/usr/bin/env node
    const { spawnSync } = require("node:child_process");

    let stdin = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      stdin += chunk;
    });
    process.stdin.on("error", (err) => {
      process.stderr.write(`${err.message}\n`);
      process.exit(1);
    });
    process.stdin.on("end", () => {
      let request;
      try {
        request = JSON.parse(stdin || "{}");
      } catch (err) {
        process.stderr.write(`Failed to parse request: ${err.message}\n`);
        process.exit(1);
      }

      const passBin = process.env.PASS_BIN || "pass";
      const values = {};
      const errors = {};

      for (const id of request.ids ?? []) {
        const result = spawnSync(passBin, ["show", id], { encoding: "utf8" });
        if (result.status === 0) {
          values[id] = result.stdout.split(/\r?\n/, 1)[0] ?? "";
        } else {
          errors[id] = { message: (result.stderr || `pass exited ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    फिर exec provider configure करें और `apiKey` को `pass` entry path पर point करें:

    ```json5
    {
      secrets: {
        providers: {
          pass_store: {
            source: "exec",
            command: "/usr/local/bin/openclaw-pass-resolver",
            passEnv: ["PATH", "HOME", "GNUPGHOME", "GPG_TTY", "PASSWORD_STORE_DIR", "PASS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "pass_store",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    secret को `pass` entry की पहली line पर रखें, या यदि आप इसके बजाय पूरा `pass show` output लौटाना चाहते हैं तो
    wrapper को customize करें। config update करने के बाद, static audit और exec resolver path दोनों verify करें:

    ```bash
    openclaw secrets audit --check
    openclaw secrets audit --allow-exec
    ```

  </Accordion>
  <Accordion title="sops">
    ```json5
    {
      secrets: {
        providers: {
          sops_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/sops",
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
            trustedDirs: ["/opt/homebrew"],
            args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
            passEnv: ["SOPS_AGE_KEY_FILE"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "sops_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## MCP सर्वर environment variables

`plugins.entries.acpx.config.mcpServers` के माध्यम से configured MCP सर्वर env vars SecretInput का समर्थन करते हैं। इससे API keys और tokens plaintext config से बाहर रहते हैं:

```json5
{
  plugins: {
    entries: {
      acpx: {
        enabled: true,
        config: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  source: "env",
                  provider: "default",
                  id: "MCP_GITHUB_PAT",
                },
              },
            },
          },
        },
      },
    },
  },
}
```

Plaintext string values अभी भी काम करते हैं। `${MCP_SERVER_API_KEY}` जैसे env-template refs और SecretRef objects, MCP सर्वर process spawn होने से पहले gateway activation के दौरान resolve किए जाते हैं। अन्य SecretRef surfaces की तरह, unresolved refs activation को केवल तब block करते हैं जब `acpx` plugin प्रभावी रूप से active हो।

## Sandbox SSH auth material

core `ssh` sandbox backend SSH auth material के लिए SecretRefs का भी समर्थन करता है:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Runtime व्यवहार:

- OpenClaw इन refs को sandbox activation के दौरान resolve करता है, हर SSH call के दौरान lazily नहीं।
- Resolved values restrictive permissions के साथ temp files में लिखे जाते हैं और generated SSH config में उपयोग होते हैं।
- यदि effective sandbox backend `ssh` नहीं है, तो ये refs inactive रहते हैं और startup block नहीं करते।

## समर्थित credential surface

Canonical supported और unsupported credentials यहां सूचीबद्ध हैं:

- [SecretRef Credential Surface](/hi/reference/secretref-credential-surface)

<Note>
Runtime-minted या rotating credentials और OAuth refresh material को read-only SecretRef resolution से जानबूझकर बाहर रखा गया है।
</Note>

## आवश्यक व्यवहार और precedence

- ref के बिना field: unchanged।
- ref वाला field: activation के दौरान active surfaces पर required।
- यदि plaintext और ref दोनों मौजूद हैं, तो supported precedence paths पर ref precedence लेता है।
- redaction sentinel `__OPENCLAW_REDACTED__` internal config redaction/restore के लिए reserved है और literal submitted config data के रूप में rejected है।

Warning और audit signals:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (runtime warning)
- `REF_SHADOWED` (audit finding जब `auth-profiles.json` credentials `openclaw.json` refs पर precedence लेते हैं)

Google Chat compatibility behavior:

- `serviceAccountRef` plaintext `serviceAccount` पर precedence लेता है।
- sibling ref set होने पर plaintext value ignored होती है।

## Activation triggers

Secret activation इन पर चलता है:

- Startup (preflight plus final activation)
- Config reload hot-apply path
- Config reload restart-check path
- `secrets.reload` के माध्यम से manual reload
- Gateway config write RPC preflight (`config.set` / `config.apply` / `config.patch`) submitted config payload के भीतर active-surface SecretRef resolvability के लिए, edits persist करने से पहले

Activation contract:

- Success snapshot को atomically swap करता है।
- Startup failure gateway startup abort करता है।
- Runtime reload failure last-known-good snapshot बनाए रखता है।
- Write-RPC preflight failure submitted config को reject करता है और disk config तथा active runtime snapshot दोनों को unchanged रखता है।
- outbound helper/tool call को explicit per-call channel token देने से SecretRef activation trigger नहीं होता; activation points startup, reload, और explicit `secrets.reload` ही रहते हैं।

## Degraded और recovered signals

जब healthy state के बाद reload-time activation fail होता है, OpenClaw degraded secrets state में enter करता है।

One-shot system event और log codes:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Behavior:

- Degraded: runtime last-known-good snapshot बनाए रखता है।
- Recovered: अगले successful activation के बाद एक बार emitted।
- पहले से degraded रहते हुए repeated failures warnings log करते हैं, लेकिन events spam नहीं करते।
- Startup fail-fast degraded events emit नहीं करता क्योंकि runtime कभी active हुआ ही नहीं।

## Command-path resolution

Command paths gateway snapshot RPC के माध्यम से supported SecretRef resolution में opt कर सकते हैं।

दो broad behaviors हैं:

<Tabs>
  <Tab title="सख्त कमांड पथ">
    उदाहरण के लिए `openclaw memory` रिमोट-मेमोरी पथ और `openclaw qr --remote` जब उसे रिमोट साझा-सीक्रेट refs की आवश्यकता होती है। वे सक्रिय स्नैपशॉट से पढ़ते हैं और आवश्यक SecretRef उपलब्ध न होने पर तुरंत विफल हो जाते हैं।
  </Tab>
  <Tab title="रीड-ओनली कमांड पथ">
    उदाहरण के लिए `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit`, और रीड-ओनली doctor/config मरम्मत फ़्लो। वे भी सक्रिय स्नैपशॉट को प्राथमिकता देते हैं, लेकिन उस कमांड पथ में लक्षित SecretRef उपलब्ध न होने पर रुकने के बजाय सीमित रूप से जारी रहते हैं।

    रीड-ओनली व्यवहार:

    - जब Gateway चल रहा हो, ये कमांड पहले सक्रिय स्नैपशॉट से पढ़ते हैं।
    - यदि Gateway resolution अधूरा है या Gateway उपलब्ध नहीं है, तो वे विशिष्ट कमांड सतह के लिए लक्षित स्थानीय fallback आज़माते हैं।
    - यदि लक्षित SecretRef फिर भी उपलब्ध नहीं है, तो कमांड सीमित रीड-ओनली आउटपुट और स्पष्ट डायग्नॉस्टिक्स जैसे "configured but unavailable in this command path" के साथ जारी रहता है।
    - यह सीमित व्यवहार केवल कमांड-स्थानीय है। यह रनटाइम startup, reload, या send/auth पथों को कमजोर नहीं करता।

  </Tab>
</Tabs>

अन्य नोट्स:

- backend secret rotation के बाद स्नैपशॉट refresh `openclaw secrets reload` द्वारा संभाला जाता है।
- इन कमांड पथों द्वारा उपयोग की गई Gateway RPC विधि: `secrets.resolve`.

## ऑडिट और कॉन्फ़िगर वर्कफ़्लो

डिफ़ॉल्ट ऑपरेटर फ़्लो:

<Steps>
  <Step title="वर्तमान स्थिति का ऑडिट करें">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="SecretRefs कॉन्फ़िगर और लागू करें">
    ```bash
    openclaw secrets configure --apply
    ```
  </Step>
  <Step title="दोबारा ऑडिट करें">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

जब तक दोबारा ऑडिट साफ़ न हो, migration को पूरा न मानें। यदि ऑडिट
अभी भी at rest plaintext values रिपोर्ट करता है, तो agent-access जोखिम अभी भी मौजूद है
भले ही runtime APIs redacted values लौटाएँ।

यदि आप `configure` के दौरान apply करने के बजाय कोई योजना सहेजते हैं, तो दोबारा ऑडिट से पहले
उस सहेजी गई योजना को `openclaw secrets apply --from <plan-path>` के साथ लागू करें।

<AccordionGroup>
  <Accordion title="secrets audit">
    निष्कर्षों में शामिल हैं:

    - at rest plaintext values (`openclaw.json`, `auth-profiles.json`, `.env`, और generated `agents/*/agent/models.json`)
    - generated `models.json` entries में plaintext sensitive provider header residues
    - unresolved refs
    - precedence shadowing (`auth-profiles.json` का `openclaw.json` refs पर प्राथमिकता लेना)
    - legacy residues (`auth.json`, OAuth reminders)

    Exec नोट:

    - डिफ़ॉल्ट रूप से, audit command side effects से बचने के लिए exec SecretRef resolvability checks छोड़ देता है।
    - audit के दौरान exec providers निष्पादित करने के लिए `openclaw secrets audit --allow-exec` का उपयोग करें।

    Header residue नोट:

    - Sensitive provider header detection नाम-heuristic आधारित है (सामान्य auth/credential header names और fragments जैसे `authorization`, `x-api-key`, `token`, `secret`, `password`, और `credential`)।

  </Accordion>
  <Accordion title="secrets configure">
    इंटरैक्टिव सहायक जो:

    - पहले `secrets.providers` कॉन्फ़िगर करता है (`env`/`file`/`exec`, add/edit/remove)
    - आपको एक agent scope के लिए `openclaw.json` और `auth-profiles.json` में supported secret-bearing fields चुनने देता है
    - target picker में सीधे नया `auth-profiles.json` mapping बना सकता है
    - SecretRef विवरण (`source`, `provider`, `id`) कैप्चर करता है
    - preflight resolution चलाता है
    - तुरंत apply कर सकता है

    Exec नोट:

    - जब तक `--allow-exec` सेट न हो, preflight exec SecretRef checks छोड़ देता है।
    - यदि आप सीधे `configure --apply` से apply करते हैं और plan में exec refs/providers शामिल हैं, तो apply चरण के लिए भी `--allow-exec` सेट रखें।

    उपयोगी मोड:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    `configure` apply defaults:

    - targeted providers के लिए `auth-profiles.json` से matching static credentials scrub करें
    - `auth.json` से legacy static `api_key` entries scrub करें
    - `<config-dir>/.env` से matching known secret lines scrub करें

  </Accordion>
  <Accordion title="secrets apply">
    सहेजी गई योजना लागू करें:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Exec नोट:

    - जब तक `--allow-exec` सेट न हो, dry-run exec checks छोड़ देता है।
    - write mode exec SecretRefs/providers वाली योजनाओं को तब तक अस्वीकार करता है जब तक `--allow-exec` सेट न हो।

    strict target/path contract details और exact rejection rules के लिए, [Secrets Apply Plan Contract](/hi/gateway/secrets-plan-contract) देखें।

  </Accordion>
</AccordionGroup>

## वन-वे सुरक्षा नीति

<Warning>
OpenClaw जानबूझकर historical plaintext secret values वाले rollback backups नहीं लिखता।
</Warning>

सुरक्षा मॉडल:

- write mode से पहले preflight सफल होना चाहिए
- commit से पहले runtime activation validate किया जाता है
- apply atomic file replacement और failure पर best-effort restore का उपयोग करके files update करता है

## Legacy auth compatibility नोट्स

static credentials के लिए, runtime अब plaintext legacy auth storage पर निर्भर नहीं है।

- Runtime credential source resolved in-memory snapshot है।
- Legacy static `api_key` entries मिलने पर scrub की जाती हैं।
- OAuth-related compatibility behavior अलग रहता है।

## Web UI नोट

कुछ SecretInput unions को form mode की तुलना में raw editor mode में कॉन्फ़िगर करना आसान होता है।

## संबंधित

- [Authentication](/hi/gateway/authentication) — auth setup
- [CLI: secrets](/hi/cli/secrets) — CLI commands
- [Environment Variables](/hi/help/environment) — environment precedence
- [SecretRef Credential Surface](/hi/reference/secretref-credential-surface) — credential surface
- [Secrets Apply Plan Contract](/hi/gateway/secrets-plan-contract) — plan contract details
- [Security](/hi/gateway/security) — security posture

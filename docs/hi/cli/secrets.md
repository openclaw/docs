---
read_when:
    - रनटाइम पर secret refs को फिर से resolve करना
    - प्लेनटेक्स्ट अवशेषों और अनसुलझे संदर्भों का ऑडिट करना
    - SecretRefs कॉन्फ़िगर करना और एक-तरफ़ा स्क्रब परिवर्तन लागू करना
summary: '`openclaw secrets` के लिए CLI संदर्भ (reload, audit, configure, apply)'
title: गोपनीय जानकारी
x-i18n:
    generated_at: "2026-06-28T22:52:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6fe1933ca6a9f2a24fbbe20fa3b83bf8f6493ea6c94061e135b4e1b48c33d62c
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

सक्रिय रनटाइम स्नैपशॉट को स्वस्थ रखने और SecretRefs प्रबंधित करने के लिए `openclaw secrets` का उपयोग करें.

कमांड भूमिकाएं:

- `reload`: Gateway RPC (`secrets.reload`) जो refs को फिर से resolve करता है और केवल पूरी सफलता पर रनटाइम स्नैपशॉट बदलता है (कोई config write नहीं).
- `audit`: plaintext, unresolved refs, और precedence drift के लिए configuration/auth/generated-model stores और legacy residues का read-only scan (exec refs छोड़े जाते हैं, जब तक `--allow-exec` सेट न हो).
- `configure`: provider setup, target mapping, और preflight के लिए interactive planner (TTY आवश्यक).
- `apply`: saved plan execute करें (`--dry-run` केवल validation के लिए; dry-run default रूप से exec checks छोड़ता है, और write mode exec-containing plans को reject करता है जब तक `--allow-exec` सेट न हो), फिर targeted plaintext residues scrub करें.

अनुशंसित operator loop:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

यदि आपके plan में `exec` SecretRefs/providers शामिल हैं, तो dry-run और write apply दोनों commands पर `--allow-exec` पास करें.

CI/gates के लिए exit code note:

- `audit --check` findings पर `1` लौटाता है.
- unresolved refs `2` लौटाते हैं.

संबंधित:

- Secrets guide: [Secrets Management](/hi/gateway/secrets)
- Credential surface: [SecretRef Credential Surface](/hi/reference/secretref-credential-surface)
- Security guide: [Security](/hi/gateway/security)

## रनटाइम स्नैपशॉट reload करें

secret refs को फिर से resolve करें और runtime snapshot को atomically swap करें.

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Notes:

- Gateway RPC method `secrets.reload` का उपयोग करता है.
- यदि resolution विफल होता है, तो Gateway last-known-good snapshot रखता है और error लौटाता है (कोई partial activation नहीं).
- JSON response में `warningCount` शामिल है.

Options:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--json`

## Audit

OpenClaw state को इनके लिए scan करें:

- plaintext secret storage
- unresolved refs
- precedence drift (`auth-profiles.json` credentials द्वारा `openclaw.json` refs को shadow करना)
- generated `agents/*/agent/models.json` residues (provider `apiKey` values और sensitive provider headers)
- legacy residues (legacy auth store entries, OAuth reminders)

Header residue note:

- Sensitive provider header detection name-heuristic based है (common auth/credential header names और fragments जैसे `authorization`, `x-api-key`, `token`, `secret`, `password`, और `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Exit behavior:

- `--check` findings पर non-zero exit करता है.
- unresolved refs higher-priority non-zero code के साथ exit करते हैं.

Report shape highlights:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- finding codes:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## Configure (interactive helper)

Provider और SecretRef changes interactively बनाएं, preflight चलाएं, और optionally apply करें:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Flow:

- Provider setup पहले (`add/edit/remove` for `secrets.providers` aliases).
- Credential mapping दूसरे चरण में (fields select करें और `{source, provider, id}` refs assign करें).
- Preflight और optional apply अंत में.

Flags:

- `--providers-only`: केवल `secrets.providers` configure करें, credential mapping skip करें.
- `--skip-provider-setup`: provider setup skip करें और credentials को existing providers से map करें.
- `--agent <id>`: `auth-profiles.json` target discovery और writes को एक agent store तक scope करें.
- `--allow-exec`: preflight/apply के दौरान exec SecretRef checks allow करें (provider commands execute हो सकते हैं).

Notes:

- Interactive TTY आवश्यक है.
- आप `--providers-only` को `--skip-provider-setup` के साथ combine नहीं कर सकते.
- `configure` selected agent scope के लिए `openclaw.json` और `auth-profiles.json` में secret-bearing fields को target करता है.
- `configure` picker flow में सीधे नए `auth-profiles.json` mappings बनाने का support करता है.
- Canonical supported surface: [SecretRef Credential Surface](/hi/reference/secretref-credential-surface).
- यह apply से पहले preflight resolution करता है.
- यदि preflight/apply में exec refs शामिल हैं, तो दोनों steps के लिए `--allow-exec` set रखें.
- Generated plans default रूप से scrub options (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson` सभी enabled) पर रहते हैं.
- Apply path scrubbed plaintext values के लिए one-way है.
- `--apply` के बिना, CLI preflight के बाद भी `Apply this plan now?` prompt करता है.
- `--apply` (और `--yes` नहीं) के साथ, CLI एक extra irreversible confirmation prompt करता है.
- `--json` plan + preflight report print करता है, लेकिन command को अभी भी interactive TTY चाहिए.

Exec provider safety note:

- Homebrew installs अक्सर `/opt/homebrew/bin/*` के तहत symlinked binaries expose करते हैं.
- `allowSymlinkCommand: true` केवल trusted package-manager paths के लिए जरूरत होने पर set करें, और इसे `trustedDirs` (उदाहरण `["/opt/homebrew"]`) के साथ pair करें.
- Windows पर, यदि provider path के लिए ACL verification unavailable है, तो OpenClaw fail closed करता है. केवल trusted paths के लिए, path security checks bypass करने हेतु उस provider पर `allowInsecurePath: true` set करें.

## Saved plan apply करें

पहले generate किए गए plan को apply या preflight करें:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

Exec behavior:

- `--dry-run` files write किए बिना preflight validate करता है.
- exec SecretRef checks dry-run में default रूप से skip किए जाते हैं.
- write mode उन plans को reject करता है जिनमें exec SecretRefs/providers हों, जब तक `--allow-exec` set न हो.
- किसी भी mode में exec provider checks/execution opt in करने के लिए `--allow-exec` उपयोग करें.

Plan contract details (allowed target paths, validation rules, और failure semantics):

- [Secrets Apply Plan Contract](/hi/gateway/secrets-plan-contract)

`apply` क्या update कर सकता है:

- `openclaw.json` (SecretRef targets + provider upserts/deletes)
- `auth-profiles.json` (provider-target scrubbing)
- legacy `auth.json` residues
- `~/.openclaw/.env` known secret keys जिनके values migrate किए गए थे

## Rollback backups क्यों नहीं

`secrets apply` जानबूझकर पुराने plaintext values वाले rollback backups नहीं लिखता.

Safety strict preflight + failure पर best-effort in-memory restore वाले atomic-ish apply से आती है.

## Example

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

यदि `audit --check` अभी भी plaintext findings report करता है, तो शेष reported target paths update करें और audit फिर चलाएं.

## Related

- [CLI reference](/hi/cli)
- [Secrets management](/hi/gateway/secrets)

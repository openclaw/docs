---
read_when:
    - आप किसी एजेंट कार्य के लिए एक अलग शाखा और चेकआउट चाहते हैं
    - आप worktree कार्यस्थानों के साथ Workboard कार्ड कॉन्फ़िगर कर रहे हैं
    - आपको OpenClaw द्वारा प्रबंधित वर्कट्री को पुनर्स्थापित या साफ़ करना है
summary: स्वचालित स्नैपशॉट और क्लीनअप के साथ अलग-थलग git चेकआउट में एजेंट कार्य चलाएँ
title: प्रबंधित वर्कट्रीज़
x-i18n:
    generated_at: "2026-07-20T06:53:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a8541b95eb264950f6ff248da0a5c4ab5fa0881a90d5f782bc1e33edd0a0c5d2
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

प्रबंधित worktree किसी एजेंट कार्य को उसकी अपनी git शाखा और checkout देते हैं, बिना स्रोत repository के भीतर अस्थायी directory रखे। OpenClaw उन्हें अपनी state directory के अंतर्गत बनाता है, shared state database में दर्ज करता है, और हटाने से पहले उनकी tracked तथा non-ignored untracked सामग्री के snapshot बनाता है।

## लेआउट और नाम

प्रत्येक worktree यहाँ स्थित होता है:

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

repository fingerprint, canonical git common directory और origin URL पर SHA-256 hash के पहले 16 hexadecimal वर्ण होते हैं। दिया गया नाम `[a-z0-9][a-z0-9-]{0,63}` से मेल खाना चाहिए। नाम न होने पर OpenClaw `wt-` और उसके बाद आठ random hexadecimal वर्ण उत्पन्न करता है।

OpenClaw अनुरोधित base ref पर `openclaw/<name>` शाखा बनाता है। base ref न होने पर यह `origin` को fetch करता है, उपलब्ध होने पर remote default शाखा का उपयोग करता है, और repository के offline होने या उपयोग योग्य remote न होने पर local `HEAD` पर fallback करता है।

## ignored फ़ाइलें उपलब्ध कराना

चुनी गई ignored, untracked फ़ाइलों को नए worktree में copy करने के लिए स्रोत repository के root पर `.worktreeinclude` जोड़ें। फ़ाइल gitignore-pattern syntax का उपयोग करती है, प्रत्येक line में एक pattern और `#` comments होते हैं:

```gitignore
.env.local
fixtures/generated/**
```

केवल वे फ़ाइलें पात्र हैं जिन्हें git ignored और untracked दोनों के रूप में report करता है। tracked फ़ाइलें git के माध्यम से पहले से मौजूद होती हैं और इस चरण में कभी copy नहीं की जातीं। OpenClaw पहले से मौजूद destination फ़ाइलों को overwrite या परिवर्तित नहीं करता, symlink की गई directories को follow नहीं करता, और copy की गई फ़ाइलों के modes सुरक्षित रखता है। यह केवल वास्तव में बनाए गए paths दर्ज करता है, इसलिए बाद में manifest में किए गए edits उन फ़ाइलों को cleanup protection से नहीं हटा सकते।

## repository setup चलाना

यदि स्रोत repository में `.openclaw/worktree-setup.sh` मौजूद और executable है, तो OpenClaw नए worktree को current directory बनाकर इसे चलाता है। script को ये प्राप्त होते हैं:

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

nonzero exit creation को abort कर देता है और नया worktree तथा शाखा हटा देता है। यह repository-local contract है; इसके लिए कोई OpenClaw config key नहीं है।

## session worktree

सक्रिय एजेंट के git workspace से worktree-backed session के साथ एक isolated chat शुरू करें: Control UI के New session page पर **Worktree** सक्षम करें (जहाँ base-branch picker और वैकल्पिक worktree नाम भी उपलब्ध हैं), या iOS पर Chat actions menu अथवा Android पर New Chat के पास overflow action का उपयोग करें। यह विकल्प केवल git-backed एजेंट के लिए उपलब्ध है, जहाँ client के पास यह capability हो; जो clients इसकी preflight जाँच नहीं कर सकते, वे इसके बजाय Gateway error दिखाते हैं।

वर्तमान कार्य के बाहर पुष्टि किए गए follow-up work का पता चलने पर coding agents `spawn_task` को भी call कर सकते हैं। Control UI कुछ शुरू किए बिना suggestion chip दिखाता है, जबकि Gateway-backed TUI समान actions वाला interactive prompt दिखाता है। **worktree में शुरू करें** चुनने पर सुझाए गए project से एक नया session-owned worktree बनता है और self-contained prompt उसकी पहली turn के रूप में भेजा जाता है; suggestion dismiss करने पर repository अपरिवर्तित रहती है। suggestions और उनकी IDs अस्थायी हैं तथा Gateway restart के बाद बनी नहीं रहतीं।

OpenClaw ये tools केवल actionable Gateway UI वाले operator sessions को उपलब्ध कराता है। channel sessions और local/embedded TUI sessions को ये तब तक प्राप्त नहीं होते, जब तक उन surfaces के पास portable typed task-action contract न हो।

परिणामी managed worktree का स्वामित्व session के पास होता है, और उस session में प्रत्येक agent run उसके checkout का उपयोग करता है। जब workspace repository की subdirectory हो, तो worktree repository root पर anchored होता है और session उसके भीतर matching subdirectory से चलता है। session worktree creation method के `operator.write` scope का उपयोग करता है, लेकिन repository checkout hooks और `.openclaw/worktree-setup.sh` चरण केवल `operator.admin` callers के लिए चलते हैं क्योंकि वे repository code execute करते हैं; `.worktreeinclude` provisioning फिर भी प्रत्येक caller पर लागू होती है। session को delete करने पर worktree केवल तभी हटता है, जब ऐसा करना lossless हो। dirty worktrees या unpushed commits वाली शाखाएँ उपलब्ध रहती हैं; hourly cleanup, 7 idle days के बाद session worktrees के snapshot बनाता है और हाल की session activity को worktree activity मानता है। हटाए गए worktrees नीचे बताए अनुसार उनके snapshots से restore किए जा सकते हैं।

जब कोई task configured agent workspace के अलावा किसी अन्य project को target करता है, तब `sessions.create` में `worktree: true` के साथ absolute `cwd` शामिल हो सकता है। उस explicit host path के लिए `operator.admin` आवश्यक है; सामान्य worktree chat creation `operator.write` ही रहता है और configured workspace पर anchored रहता है।

base ref और worktree नाम चुनने के लिए `sessions.create`, `worktree: true` के साथ `worktreeBaseRef` और `worktreeName` भी स्वीकार करता है (शाखा `openclaw/<name>` बनती है); दोनों `operator.write` पर रहते हैं। बनाया गया worktree create result में लौटाया जाता है और session row पर `worktree: { id, branch, repoRoot }` के रूप में persist किया जाता है, ताकि session lists checkout और शाखा दिखा सकें। session delete करने पर संरक्षित dirty checkout को चुपचाप छोड़ने के बजाय `worktreePreserved` के रूप में report किया जाता है।

## snapshots, cleanup और restore

हटाने की प्रक्रिया पहले tracked और non-ignored untracked फ़ाइलों वाला synthetic commit बनाती है, फिर उसे `refs/openclaw/snapshots/<id>` पर pin करती है। ignored फ़ाइलें repository object database में कभी प्रवेश नहीं करतीं। OpenClaw वास्तव में provision की गई ignored फ़ाइलों को ही chunked shared-state database rows में store करता है; दर्ज path set authoritative रहता है, भले ही `.worktreeinclude` बाद में बदल जाए या गायब हो जाए। restore उन bytes को immutable snapshot से पढ़ता है और उनके पूर्ण modes दोबारा लागू करता है। जब किसी दर्ज path का snapshot सुरक्षित रूप से नहीं बनाया जा सकता, तो automatic cleanup live worktree को सुरक्षित रखता है। snapshot creation विफल होने पर removal रुक जाता है। explicit force delete snapshot के बिना जारी रह सकता है।

OpenClaw ये cleanup rules लागू करता है:

- run समाप्त होने पर यह worktree केवल तभी हटाता है, जब `git status --porcelain` खाली हो और `git log HEAD --not --remotes --oneline` को कोई unpushed commit न मिले। अन्यथा यह केवल activity lock release करता है।
- hourly cleanup, 7 days से अधिक समय से idle unlocked Workboard- और session-owned worktrees के snapshot बनाता और उन्हें हटाता है, भले ही वे dirty हों। manual worktrees कभी automatically नहीं हटाए जाते।
- snapshot records 30 days तक restore किए जा सकते हैं। इसके बाद cleanup snapshot ref और registry row delete कर देता है।
- एक live OpenClaw process lock और कोई भी foreign या unrecognized git worktree lock, worktree को garbage collection से सुरक्षित रखते हैं।

restore मूल pre-snapshot commit पर `openclaw/<name>` को दोबारा बनाता है, फिर snapshot differences को unstaged modifications और untracked फ़ाइलों के रूप में rebuild करता है। इससे synthetic snapshot commit शाखा history से बाहर रहता है। snapshot ref provenance के रूप में दर्ज रहता है।

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

Settings के अंतर्गत Control UI का **Worktrees** page समान actions के साथ base-branch picker द्वारा creation भी उपलब्ध कराता है, प्रत्येक worktree का owner (manual, Workboard, या उसके chat की link सहित owning session) दिखाता है, और removal में failed snapshot report होने पर force retry प्रदान करता है।

## Gateway methods

| method               | उद्देश्य                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `worktrees.list`     | सक्रिय और restore किए जा सकने वाले worktree records की सूची बनाएँ।                            |
| `worktrees.branches` | base-ref pickers के लिए repository की local और remote branches की सूची बनाएँ।    |
| `worktrees.create`   | नामित managed worktree बनाएँ या दोबारा उपयोग करें।                               |
| `worktrees.remove`   | worktree का snapshot बनाएँ और उसे हटाएँ। forced removals `snapshotError` report करते हैं। |
| `worktrees.restore`  | हटाए गए worktree को उसके snapshot से restore करें।                           |
| `worktrees.gc`       | idle, orphan और retention cleanup अभी चलाएँ।                            |

`worktrees.list` के लिए `operator.read` आवश्यक है, और mutating methods के लिए `operator.admin` आवश्यक है। configured agent workspaces के लिए `worktrees.branches` को `operator.write` चाहिए, जबकि किसी अन्य host path के लिए `operator.admin` आवश्यक है (`sessions.create` cwd bar से मेल खाते हुए)। यह केवल मौजूदा refs पढ़ता है और कभी fetch नहीं करता, तथा remote-only branches remote-qualified (`origin/feature-a`) लौटती हैं ताकि लौटाया गया प्रत्येक नाम base ref के रूप में resolve हो।

## Workboard workspaces

bundled [Workboard Plugin](/hi/plugins/workboard) card workspace को managed worktree के रूप में materialize कर सकता है:

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` स्रोत git checkout की पहचान करता है। `branch` वैकल्पिक है और base ref बनता है। full-host caller के लिए Workboard `wb-<card-id>` बनाता या दोबारा उपयोग करता है, managed checkout को working directory बनाकर subagent चलाता है, और resolved path तथा शाखा को वापस card में लिखता है। full-host materialization के लिए Gateway clients को `operator.admin` चाहिए। run समाप्त होने पर Workboard checkout को केवल तभी हटाता है, जब उसका lossless होना प्रमाणित हो; dirty work या unpushed commits उपलब्ध रहते हैं।

workspace-bound caller के लिए `path` और repository root का target agent workspace से ठीक-ठीक मेल खाना आवश्यक है। इसके बाद Workboard सीधे उस directory में चलता है और managed worktree को host पर materialize करने के बजाय directory workspace दर्ज करता है। target को उसी workspace के लिए writable, non-shared Docker sandbox का उपयोग करना चाहिए, उसके live container hash का requested mounts और policy से मेल खाना आवश्यक है, और उसे elevated execution, host control, host-wide sessions, persisted host/node execution या unclassified Plugin और MCP tools expose नहीं करने चाहिए। यदि target policy या live container इससे व्यापक है, तो dispatch card को unclaimed छोड़ देता है और incompatible state report करता है।

---
read_when:
    - execの承認やallowlistを設定する
    - macOS appでexec承認UXを実装する
    - sandbox escape promptとその影響を確認する
summary: Execの承認、allowlist、sandbox escape prompt
title: Execの承認
x-i18n:
    generated_at: "2026-04-24T05:24:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d7c5cd24e7c1831d5a865da6fa20f4c23280a0ec12b9e8f7f3245170a05a37d
    source_path: tools/exec-approvals.md
    workflow: 15
---

Exec approvalsは、sandbox化されたagentが実ホスト（`gateway` または `node`）でcommandを実行することを許可するための、**companion app / node hostのguardrail** です。安全インターロックとして、commandは policy + allowlist + （任意の）user approval がすべて合意した場合にのみ許可されます。Exec approvalsは、tool policyおよびelevated gatingの**上に積み重なります**（ただし、elevatedが `full` に設定されている場合はapprovalをスキップします）。

<Note>
有効policyは、`tools.exec.*` とapprovals defaultの**より厳しい方**です。approvals fieldが省略されている場合は、`tools.exec` の値が使われます。host execは、そのマシン上のローカルapprovals stateも使います。`~/.openclaw/exec-approvals.json` にあるhost-localの `ask: "always"` は、sessionやconfig defaultが `ask: "on-miss"` を要求していても、引き続きpromptを出します。
</Note>

## 有効policyの確認

- `openclaw approvals get`, `... --gateway`, `... --node <id|name|ip>` — 要求されたpolicy、host policy source、有効結果を表示します。
- `openclaw exec-policy show` — ローカルマシンでのマージ済みview。
- `openclaw exec-policy set|preset` — ローカルで要求されたpolicyとローカルhost approvals fileを1ステップで同期します。

ローカルscopeが `host=node` を要求すると、`exec-policy show` は、そのscopeをローカルapprovals fileがsource of truthであるかのように見せるのではなく、ランタイムではnode-managedとして報告します。

companion app UIが**利用できない**場合、通常ならpromptが必要になるrequestは、**ask fallback**（デフォルト: deny）で解決されます。

<Tip>
ネイティブchat approval clientは、保留中approval messageにchannel固有のaffordanceを埋め込めます。たとえばMatrixはreaction shortcut（`✅`
1回だけ許可、`❌` deny、`♾️` 常に許可）を埋め込みつつ、fallbackとしてmessage内に `/approve ...`
commandも残します。
</Tip>

## 適用場所

Exec approvalsは、実行host上でローカルに強制されます:

- **gateway host** → gatewayマシン上の `openclaw` process
- **node host** → node runner（macOS companion appまたはheadless node host）

trust modelに関する注記:

- Gateway-authenticated callerは、そのGatewayに対するtrusted operatorです。
- paired nodeは、そのtrusted operator capabilityをnode hostへ拡張します。
- Exec approvalsは偶発的な実行リスクを減らしますが、per-user auth boundaryではありません。
- 承認済みnode-host runは、canonical execution contextをbindingします: canonical cwd、正確な argv、存在する場合のenv
  binding、および適用可能な場合の固定されたexecutable path。
- shell scriptおよびinterpreter/runtime fileの直接実行では、OpenClawは
  1つの具体的なローカルfile operandもbindingしようとします。approval後かつ実行前にそのbound fileが変更された場合、
  実行内容がdriftした状態で実行する代わりに、そのrunはdenyされます。
- このfile bindingは意図的にbest-effortであり、あらゆる
  interpreter/runtime loader pathの完全なsemantic modelではありません。approval modeがbindingすべき具体的なローカル
  fileをちょうど1つ特定できない場合、完全カバーを装う代わりにapproval-backed runの発行を拒否します。

macOSの分割:

- **node host service** は、ローカルIPC経由で `system.run` を **macOS app** に転送します。
- **macOS app** はapprovalを強制し、UI contextでcommandを実行します。

## 設定と保存場所

approvalは、実行host上のローカルJSON fileに保存されます:

`~/.openclaw/exec-approvals.json`

schema例:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## 承認なしの「YOLO」mode

approval promptなしでhost execを動かしたい場合は、**両方** のpolicy layerを開く必要があります:

- OpenClaw config内のrequested exec policy（`tools.exec.*`）
- `~/.openclaw/exec-approvals.json` 内のhost-local approvals policy

これは、明示的に厳しくしない限り、現在のデフォルトhost動作です:

- `tools.exec.security`: `gateway`/`node` では `full`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

重要な区別:

- `tools.exec.host=auto` は、execをどこで実行するかを選びます: 利用可能ならsandbox、そうでなければgateway。
- YOLOは、host execをどう承認するかを選びます: `security=full` と `ask=off`。
- 独自のnoninteractive permission modeを公開するCLI-backed providerは、このpolicyに従えます。
  Claude CLIは、OpenClawのrequested exec policyが
  YOLOの場合に `--permission-mode bypassPermissions` を追加します。そのbackend動作をoverrideするには、
  `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` 配下に明示的なClaude argを設定してください。たとえば
  `--permission-mode default`, `acceptEdits`, `bypassPermissions` です。
- YOLO modeでは、OpenClawは、設定されたhost exec policyの上に別個のheuristicなcommand-obfuscation approval gateやscript-preflight rejection layerを追加しません。
- `auto` は、sandbox化sessionからgateway routingを自由overrideできることを意味しません。`host=node` のper-call requestは `auto` から許可されますが、`host=gateway` はsandbox runtimeがアクティブでない場合にのみ `auto` から許可されます。安定したnon-auto defaultが必要なら、`tools.exec.host` を設定するか、`/exec host=...` を明示的に使ってください。

より保守的な構成にしたい場合は、どちらかのlayerを `allowlist` / `on-miss`
または `deny` に戻してください。

gateway-hostの永続「never prompt」構成:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

次に、host approvals fileも一致するように設定します:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

現在のマシンで同じgateway-host policyを設定するローカルshortcut:

```bash
openclaw exec-policy preset yolo
```

このローカルshortcutは、次の両方を更新します:

- ローカル `tools.exec.host/security/ask`
- ローカル `~/.openclaw/exec-approvals.json` default

これは意図的にlocal-onlyです。gateway-hostまたはnode-host approvalを
リモート変更する必要がある場合は、引き続き `openclaw approvals set --gateway` または
`openclaw approvals set --node <id|name|ip>` を使ってください。

node hostでは、同じapprovals fileをそのnodeに適用します:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

重要なlocal-only制限:

- `openclaw exec-policy` はnode approvalを同期しません
- `openclaw exec-policy set --host node` は拒否されます
- node exec approvalはランタイム時にnodeから取得されるため、node対象の更新には `openclaw approvals --node ...` を使う必要があります

session-only shortcut:

- `/exec security=full ask=off` は現在のsessionだけを変更します。
- `/elevated full` は、break-glass shortcutであり、そのsessionのexec approvalもスキップします。

host approvals fileがconfigより厳しいままなら、より厳しいhost policyが引き続き優先されます。

## Policyノブ

### Security（`exec.security`）

- **deny**: すべてのhost exec requestをブロックする。
- **allowlist**: allowlistされたcommandだけを許可する。
- **full**: すべてを許可する（elevatedと同等）。

### Ask（`exec.ask`）

- **off**: promptしない。
- **on-miss**: allowlistに一致しない場合のみpromptする。
- **always**: すべてのcommandでpromptする。
- effective ask modeが `always` の場合、`allow-always` のdurable trustでもpromptは抑止されません

### Ask fallback（`askFallback`）

promptが必要だがUIに到達できない場合、fallbackが決定します:

- **deny**: ブロック。
- **allowlist**: allowlistに一致する場合のみ許可。
- **full**: 許可。

### Inline interpreter eval hardening（`tools.exec.strictInlineEval`）

`tools.exec.strictInlineEval=true` の場合、OpenClawは、interpreter binary自体がallowlistされていても、inline code-eval形式をapproval-onlyとして扱います。

例:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

これは、1つの安定したfile operandにきれいに対応しないinterpreter loaderに対するdefense-in-depthです。strict modeでは:

- これらのcommandには引き続き明示的approvalが必要です。
- `allow-always` は、それらに対する新しいallowlist entryを自動永続化しません。

## Allowlist（agentごと）

allowlistは **agentごと** です。複数のagentが存在する場合は、macOS appで
編集中のagentを切り替えてください。patternは **大文字小文字を区別しないglob match** です。
patternは **binary path** に解決されるべきです（basenameだけのentryは無視されます）。
レガシーの `agents.default` entryは、読み込み時に `agents.main` へ移行されます。
`echo ok && pwd` のようなshell chainでは、各top-level segmentがすべてallowlist ruleを満たす必要があります。

例:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

各allowlist entryは次を追跡します:

- **id** UI identityに使う安定UUID（任意）
- **last used** timestamp
- **last used command**
- **last resolved path**

## Skill CLIの自動許可

**Auto-allow skill CLIs** が有効な場合、既知のskillで参照されるexecutableは、node上（macOS nodeまたはheadless node host）ではallowlist済みとして扱われます。これは
Gateway RPC経由の `skills.bins` を使ってskill bin listを取得します。厳密な手動allowlistが必要なら、これを無効にしてください。

重要なtrustに関する注記:

- これは、手動path allowlist entryとは別の**暗黙の利便allowlist** です。
- Gatewayとnodeが同じtrust boundary内にあるtrusted operator environment向けです。
- 厳格な明示的trustが必要なら、`autoAllowSkills: false` のままにし、手動path allowlist entryだけを使ってください。

## Safe binとapproval forwarding

safe bin（stdin-only fast-path）、interpreter bindingの詳細、および
Slack/Discord/Telegramへのapproval prompt転送（またはそれらをネイティブ
approval clientとして実行する方法）については、[Exec approvals — advanced](/ja-JP/tools/exec-approvals-advanced) を参照してください。

<!-- moved to /tools/exec-approvals-advanced -->

## Control UIでの編集

**Control UI → Nodes → Exec approvals** cardを使って、default、agentごとの
override、allowlistを編集します。scope（Defaultsまたはagent）を選び、policyを調整し、
allowlist patternを追加/削除してから、**Save** を押してください。UIにはpatternごとの **last used** metadataも表示されるため、listを整理しやすくなっています。

target selectorは **Gateway**（ローカルapproval）または **Node** を選びます。Nodeは
`system.execApprovals.get/set` を広告している必要があります（macOS appまたはheadless node host）。
まだexec approvalを広告していないnodeでは、ローカルの
`~/.openclaw/exec-approvals.json` を直接編集してください。

CLI: `openclaw approvals` はgatewayまたはnodeの編集をサポートします（[Approvals CLI](/ja-JP/cli/approvals) を参照）。

## Approvalフロー

promptが必要な場合、gatewayは `exec.approval.requested` をoperator clientへbroadcastします。
Control UIとmacOS appは `exec.approval.resolve` でそれを解決し、その後gatewayが
承認済みrequestをnode hostへ転送します。

`host=node` では、approval requestにcanonical `systemRunPlan` payloadが含まれます。gatewayは、
承認済み `system.run`
requestを転送する際に、そのplanを権威あるcommand/cwd/session contextとして使います。

これは非同期approvalのレイテンシで重要です:

- node exec pathは、最初に1つのcanonical planを準備する
- approval recordには、そのplanとbinding metadataが保存される
- 承認後、最終的に転送される `system.run` callは、後からのcaller編集を信用せず、
  保存済みplanを再利用する
- approval request作成後にcallerが `command`, `rawCommand`, `cwd`, `agentId`, または
  `sessionKey` を変更すると、gatewayはその転送runをapproval mismatchとして拒否する

## System event

Exec lifecycleはsystem messageとして表面化されます:

- `Exec running`（commandがrunning notice thresholdを超えた場合のみ）
- `Exec finished`
- `Exec denied`

これらは、nodeがeventを報告した後にagentのsessionへ投稿されます。
Gateway-host exec approvalも、command完了時（および任意で、thresholdより長く実行されたとき）に同じlifecycle eventを発行します。
approval-gated execでは、これらのmessage内でapproval idが `runId` として再利用されるため、容易に相関付けできます。

## Denied approvalの挙動

非同期exec approvalがdenyされると、OpenClawはagentがsession内で同じcommandの
以前のrunのoutputを再利用することを防ぎます。deny reasonは、利用可能なcommand outputが存在しないという明示的なガイダンス付きで渡されるため、agentが新しいoutputがあるかのように主張したり、以前成功したrunのstaleなresultを使ってdenyされたcommandを繰り返したりすることを防ぎます。

## 影響

- **full** は強力です。可能な限りallowlistを優先してください。
- **ask** は、高速なapprovalを可能にしつつ、あなたをloop内に留めます。
- agentごとのallowlistにより、あるagentのapprovalが他のagentへ漏れるのを防げます。
- approvalは、**authorized sender** からのhost exec requestにのみ適用されます。unauthorized senderは `/exec` を発行できません。
- `/exec security=full` はauthorized operator向けのsession-level convenienceであり、設計上approvalをスキップします。host execを強制的にブロックしたい場合は、approvals securityを `deny` に設定するか、tool policyで `exec` toolをdenyしてください。

## 関連

<CardGroup cols={2}>
  <Card title="Exec approvals — advanced" href="/ja-JP/tools/exec-approvals-advanced" icon="gear">
    Safe bin、interpreter binding、chatへのapproval forwarding。
  </Card>
  <Card title="Exec tool" href="/ja-JP/tools/exec" icon="terminal">
    shell command実行tool。
  </Card>
  <Card title="Elevated mode" href="/ja-JP/tools/elevated" icon="shield-exclamation">
    approvalもスキップするbreak-glass path。
  </Card>
  <Card title="Sandboxing" href="/ja-JP/gateway/sandboxing" icon="box">
    sandbox modeとworkspace access。
  </Card>
  <Card title="Security" href="/ja-JP/gateway/security" icon="lock">
    セキュリティモデルとhardening。
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    どの制御をいつ使うべきか。
  </Card>
  <Card title="Skills" href="/ja-JP/tools/skills" icon="sparkles">
    Skillに支えられたauto-allow動作。
  </Card>
</CardGroup>

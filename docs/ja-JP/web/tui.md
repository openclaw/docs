---
read_when:
    - TUIの初心者向けウォークスルーが必要な場合
    - TUIの機能、command、shortcutの完全な一覧が必要な場合
summary: 'Terminal UI（TUI）: Gatewayに接続する、またはローカルでembedded modeとして実行する'
title: TUI
x-i18n:
    generated_at: "2026-04-24T05:28:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6168ab6cec8e0069f660ddcfca03275c407b613b6eb756aa6ef7e97f2312effe
    source_path: web/tui.md
    workflow: 15
---

## クイックスタート

### Gateway mode

1. Gatewayを起動します。

```bash
openclaw gateway
```

2. TUIを開きます。

```bash
openclaw tui
```

3. メッセージを入力してEnterを押します。

リモートGateway:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Gatewayがpassword authを使っている場合は `--password` を使ってください。

### Local mode

GatewayなしでTUIを実行します:

```bash
openclaw chat
# or
openclaw tui --local
```

注記:

- `openclaw chat` と `openclaw terminal` は `openclaw tui --local` のaliasです。
- `--local` は `--url`, `--token`, `--password` と組み合わせられません。
- local modeはembedded agent runtimeを直接使います。ほとんどのローカルtoolは動作しますが、Gateway専用機能は利用できません。

## 表示されるもの

- Header: 接続URL、現在のagent、現在のsession。
- Chat log: user message、assistant reply、system notice、tool card。
- Status line: 接続/run状態（connecting、running、streaming、idle、error）。
- Footer: 接続状態 + agent + session + model + think/fast/verbose/trace/reasoning + token count + deliver。
- Input: autocomplete付きtext editor。

## メンタルモデル: agent + session

- agentは一意のslugです（例: `main`, `research`）。Gatewayがそのlistを公開します。
- sessionは現在のagentに属します。
- session keyは `agent:<agentId>:<sessionKey>` として保存されます。
  - `/session main` と入力すると、TUIはそれを `agent:<currentAgent>:main` に展開します。
  - `/session agent:other:main` と入力すると、そのagent sessionへ明示的に切り替わります。
- Session scope:
  - `per-sender`（デフォルト）: 各agentは多数のsessionを持ちます。
  - `global`: TUIは常に `global` sessionを使います（pickerは空の場合があります）。
- 現在のagent + sessionは常にfooterに表示されます。

## 送信 + 配信

- messageはGatewayへ送信されます。providerへの配信はデフォルトでoffです。
- turn配信をonにする:
  - `/deliver on`
  - またはSettings panel
  - または `openclaw tui --deliver` で開始

## Picker + overlay

- Model picker: 利用可能なmodelを一覧表示し、session overrideを設定します。
- Agent picker: 別のagentを選択します。
- Session picker: 現在のagentのsessionだけを表示します。
- Settings: deliver、tool output expansion、thinking visibilityを切り替えます。

## キーボードshortcut

- Enter: message送信
- Esc: アクティブrunをabort
- Ctrl+C: inputをクリア（2回押すと終了）
- Ctrl+D: 終了
- Ctrl+L: model picker
- Ctrl+G: agent picker
- Ctrl+P: session picker
- Ctrl+O: tool output expansionを切り替え
- Ctrl+T: thinking visibilityを切り替え（historyを再読み込み）

## スラッシュコマンド

Core:

- `/help`
- `/status`
- `/agent <id>`（または `/agents`）
- `/session <key>`（または `/sessions`）
- `/model <provider/model>`（または `/models`）

Session control:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>`（alias: `/elev`）
- `/activation <mention|always>`
- `/deliver <on|off>`

Session lifecycle:

- `/new` または `/reset`（sessionをreset）
- `/abort`（アクティブrunをabort）
- `/settings`
- `/exit`

Local modeのみ:

- `/auth [provider]` はprovider auth/login flowをTUI内で開きます。

その他のGateway slash command（たとえば `/context`）はGatewayへ転送され、system outputとして表示されます。[Slash commands](/ja-JP/tools/slash-commands) を参照してください。

## ローカルshell command

- 行頭に `!` を付けると、TUI host上でローカルshell commandを実行します。
- TUIはsessionごとに1回だけ、ローカル実行を許可するか確認します。拒否すると、そのsessionでは `!` は無効のままです。
- commandは、TUI working directory内の新しい非対話shellで実行されます（永続的な `cd` / envはありません）。
- ローカルshell commandは、環境内で `OPENCLAW_SHELL=tui-local` を受け取ります。
- 単独の `!` は通常のmessageとして送信されます。先頭のspaceはlocal execをトリガーしません。

## ローカルTUIからconfigを修復する

現在のconfigがすでにvalidateを通っていて、embedded agentに同じマシン上でそれを確認させ、
docsと比較し、実行中のGatewayに依存せずにdrift修正を支援させたい場合はlocal modeを使ってください。

もし `openclaw config validate` がすでに失敗しているなら、先に `openclaw configure`
または `openclaw doctor --fix` から始めてください。`openclaw chat` はinvalid-
config guardを回避しません。

典型的な流れ:

1. local modeを開始する:

```bash
openclaw chat
```

2. 何を確認してほしいかagentに依頼します。例:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. 正確な証拠とvalidationにはlocal shell commandを使います:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. `openclaw config set` または `openclaw configure` で狭い変更を適用し、その後 `!openclaw config validate` を再実行します。
5. Doctorが自動migrationまたはrepairを勧めたら、それを確認して `!openclaw doctor --fix` を実行します。

ヒント:

- `openclaw.json` を手編集するより、`openclaw config set` または `openclaw configure` を優先してください。
- `openclaw docs "<query>"` は、同じマシンからlive docs indexを検索します。
- `openclaw config validate --json` は、構造化されたschemaおよびSecretRef/resolvability errorが欲しい場合に便利です。

## Tool output

- tool callは、args + result付きのcardとして表示されます。
- Ctrl+Oで折りたたみ/展開viewを切り替えます。
- tool実行中は、partial updateが同じcardにstreamされます。

## Terminal color

- TUIはassistant本文textをterminalのデフォルトforegroundのままに保つため、dark terminalでもlight terminalでも読みやすさが保たれます。
- terminalがlight backgroundを使っていて自動検出が誤っている場合は、`openclaw tui` 起動前に `OPENCLAW_THEME=light` を設定してください。
- 元のdark paletteを強制したい場合は、代わりに `OPENCLAW_THEME=dark` を設定してください。

## History + streaming

- 接続時、TUIは最新historyを読み込みます（デフォルト200 message）。
- streaming responseはfinalizeされるまでその場で更新されます。
- TUIはagent tool eventもlistenし、より豊かなtool cardを表示します。

## 接続の詳細

- TUIは `mode: "tui"` としてGatewayに登録されます。
- reconnect時にはsystem messageが表示され、event gapはlogに表面化されます。

## オプション

- `--local`: ローカルembedded agent runtimeに対して実行
- `--url <url>`: Gateway WebSocket URL（デフォルトはconfigまたは `ws://127.0.0.1:<port>`）
- `--token <token>`: Gateway token（必要な場合）
- `--password <password>`: Gateway password（必要な場合）
- `--session <key>`: Session key（デフォルト: `main`。scopeがglobalなら `global`）
- `--deliver`: assistant replyをproviderへ配信する（デフォルトoff）
- `--thinking <level>`: 送信時のthinking levelをoverride
- `--message <text>`: 接続後に初期messageを送信
- `--timeout-ms <ms>`: agent timeout（ms単位。デフォルトは `agents.defaults.timeoutSeconds`）
- `--history-limit <n>`: 読み込むhistory entry数（デフォルト `200`）

注記: `--url` を設定すると、TUIはconfigやenvironment credentialへフォールバックしません。
`--token` または `--password` を明示的に渡してください。明示的credentialがないのはerrorです。
local modeでは、`--url`, `--token`, `--password` を渡さないでください。

## トラブルシューティング

message送信後に出力がない:

- TUI内で `/status` を実行し、Gatewayが接続済みでidle/busyか確認する。
- Gateway logを確認する: `openclaw logs --follow`。
- agentが実行可能か確認する: `openclaw status` と `openclaw models status`。
- chat channelへのmessageを期待しているなら、配信を有効化してください（`/deliver on` または `--deliver`）。

## 接続トラブルシューティング

- `disconnected`: Gatewayが動作していること、および `--url/--token/--password` が正しいことを確認する。
- pickerにagentがない: `openclaw agents list` とrouting configを確認する。
- session pickerが空: global scopeか、まだsessionが存在しない可能性があります。

## 関連

- [Control UI](/ja-JP/web/control-ui) — Webベースのcontrol interface
- [Config](/ja-JP/cli/config) — `openclaw.json` の確認、validate、編集
- [Doctor](/ja-JP/cli/doctor) — ガイド付きrepairとmigration check
- [CLI Reference](/ja-JP/cli) — 完全なCLI commandリファレンス

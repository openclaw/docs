---
read_when:
    - セットアップ後にコマンドなしで openclaw を実行し、Crestodian を理解したい
    - OpenClaw を検査または修復するには、設定不要で安全な方法が必要です。
    - あなたはメッセージチャネルのレスキューモードを設計または有効化しています
summary: Crestodian の CLI リファレンスとセキュリティモデル、configless-safe なセットアップおよび修復ヘルパー
title: Crestodian
x-i18n:
    generated_at: "2026-07-06T21:47:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3431623efcecd920bb9977192b65539083a3fd7aed115747b23408f037cd973d
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian は OpenClaw のローカルセットアップ、修復、設定ヘルパーです。通常のエージェント経路が壊れている場合でも到達できます。`openclaw.json` が存在しない、または無効な場合、Gateway が停止している場合、Plugin コマンド登録が利用できない場合、まだエージェントが設定されていない場合でも実行できます。

## 起動するタイミング

サブコマンドなしで `openclaw` を実行すると、設定状態に基づいてルーティングされます。

- 設定がない、または作成済み設定がない状態で存在する場合（空、または `$schema`/`meta` キーのみ）: クラシックオンボーディングを開始します。
- 設定は存在するが検証に失敗する場合: Crestodian を開始します。
- 設定が存在し有効な場合: 通常のエージェント TUI を開きます（到達可能な設定済み Gateway に対して、または到達可能なものがなければローカルで）。Crestodian に到達するには、TUI 内で `/crestodian` を使用するか、`openclaw crestodian` を直接実行します。

`openclaw crestodian` を実行すると、設定状態に関係なく常に Crestodian を明示的に開始します。`openclaw --help` と `openclaw --version` は通常の高速経路を維持します。

非対話の bare `openclaw`（TTY なし）は、ルートヘルプを出力する代わりに短いメッセージで終了します。新規インストールでは非対話オンボーディングを示し、設定が無効な場合は `openclaw crestodian --message "status"` を示し、設定が有効な場合は `openclaw agent --local ...` を示します。

`openclaw onboard --modern` は、モダンオンボーディングのプレビューとして Crestodian を開始します。通常の `openclaw onboard` はクラシックオンボーディングを維持します。

## Crestodian が表示する内容

対話型 Crestodian は、`openclaw tui` と同じ TUI シェルを Crestodian チャットバックエンド付きで開きます。起動時の挨拶には次が含まれます。

- 設定の有効性とデフォルトエージェント
- Crestodian が使用しているモデルまたは決定的プランナー経路
- 最初の起動プローブからの Gateway 到達性
- 次に推奨されるデバッグアクション

開始するためだけにシークレットをダンプしたり Plugin CLI コマンドを読み込んだりしません。

詳細なインベントリには `status` を使用します。設定パス、ドキュメント/ソースパス、ローカル CLI プローブ、キー/トークンの存在、エージェント、モデル、Gateway の詳細が表示されます。

Crestodian は通常のエージェントと同じ参照探索を使用します。Git チェックアウトではローカルの `docs/` とソースツリーを指します。npm インストールではバンドルされたドキュメントを使用し、[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw) にリンクし、ドキュメントだけでは不十分な場合はソースを確認するよう案内します。

## 例

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work model openai/gpt-5.5" --yes
openclaw crestodian --message "set default model openai/gpt-5.5" --yes
openclaw onboard --modern
```

Crestodian TUI 内では次を使用します。

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
plugin uninstall openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## 操作と承認

Crestodian はアドホックに設定を編集する代わりに、型付き操作を使用します。

読み取り専用で即時実行されるもの: 概要の表示、エージェント一覧、インストール済み Plugin 一覧、ClawHub Plugin の検索、モデル/バックエンド状態の表示、状態/ヘルスチェックの実行、Gateway 到達性の確認、対話的修正なしの doctor 実行、設定検証、監査ログパスの表示。ガイド付きチャンネルセットアップ（`connect telegram`）の開始も即時実行されます。ウィザード自体が明示的な回答を収集し、最後にのみコミットします。

永続的で、会話上の承認（または直接コマンドの `--yes`）が必要なもの: 設定の書き込み、`config set`、`config set-ref`、セットアップ/オンボーディングのブートストラップ、デフォルトモデルの変更、Gateway の起動/停止/再起動、エージェント作成、Plugin のインストールまたはアンインストール、設定または状態を書き換える doctor 修復の実行。

承認は自分の言葉で行います。曖昧でない返信（「はい」「もちろん」「進めて」「今はしない」）は閉じた決定的リストから解決され、それ以外は、あなたのメッセージと保留中の提案だけを見る別のホスト実行モデル呼び出しによって判定されます。会話モデル自体が自己承認することはありません。曖昧な返信では提案が保留のままとなり、会話が再度確認します。使用可能なモデルがない場合は、閉じた決定的リストのみが適用されます。

適用された書き込みは `~/.openclaw/audit/crestodian.jsonl` に記録されます。探索は監査されません。適用された操作と書き込みのみが対象です。

チャンネルセットアップは、ホストがマスク入力をサポートしている場合、ホストされた会話として実行できます。ローカル Crestodian TUI は機密性の高いウィザード回答を受け付けません。代わりに `openclaw channels add --channel <channel>` に案内します。この対話プロンプトは認証情報をマスクします。

## セットアップブートストラップ

`setup` はチャットファーストのオンボーディングブートストラップです。型付き設定操作を通じてのみ書き込み、最初に承認を求めます。

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

モデルが設定されていない場合、setup は次の順序で最初に使用可能なバックエンドを選び、何を選んだかを伝えます。

1. 既存の明示的なモデル（すでに設定済みの場合）。
2. `OPENAI_API_KEY` -> `openai/gpt-5.5`
3. `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-8`
4. Claude Code CLI -> `claude-cli/claude-opus-4-8`
5. Codex -> Codex app-server ハーネス経由の `openai/gpt-5.5`
6. Gemini CLI -> `google-gemini-cli/gemini-3.1-pro-preview`

利用可能なものがない場合でも、setup はデフォルトワークスペースを書き込み、モデルは未設定のままにします。Codex/Claude Code/Gemini CLI をインストールまたはログインするか、`OPENAI_API_KEY`/`ANTHROPIC_API_KEY` を公開してから、setup を再実行してください。

macOS アプリは、`crestodian.setup.detect` と `crestodian.setup.activate` の Gateway メソッドを通じて同じラダーを実行します。detect は検出した再利用可能なバックエンドをすべて一覧表示し、activate は候補を 1 つライブテストします（実際の「OK と返信」補完）。テストが通過した後にのみ、モデル、ワークスペース、Gateway のデフォルトを永続化します。失敗した候補は設定を変更しません。アプリは自動的にラダーを下り、最後に Gateway のアクティブなテキスト推論プロバイダー Plugin から入力された手動キー/トークン手順を提示します。選択されたプロバイダーがスターターモデルと設定を所有し、認証情報も保存前に同じ方法で検証されます。

## AI 会話

対話型 Crestodian は AI のみです。型付きコマンドに見えるものを含むすべてのメッセージは、通常の OpenClaw エージェントと同じ埋め込みエージェントループを通り、型付き操作をラップする単一のリングゼロ `crestodian` ツールに制限されます。読み取りアクションは自由に実行され、変更にはその正確な操作に対する会話上の承認が必要です（「操作と承認」を参照）。適用されたすべての書き込みは監査され、再検証されます。エージェントセッションは永続化されるため、custodian は実際の複数ターン記憶を持ちます。最初に設定済みの OpenClaw モデルを使用します。使用可能なモデルがない場合は、セットアップラダー順で、マシン上にすでに存在するローカルランタイムにフォールバックします。

- Claude Code CLI: `claude-cli/claude-opus-4-8`（エージェントループ。リングゼロツールは MCP 経由で提供されます。下記の信頼モデルを参照）
- Codex app-server ハーネス: `openai/gpt-5.5`（単一ツール許可リストが強制されたエージェントループ）
- Gemini CLI: `google-gemini-cli/gemini-3.1-pro-preview`（エージェントループ。MCP 経由のリングゼロツール）

エージェントループが利用できない場合、Crestodian は制限付きの単一ターンプランナーに低下し、使用可能なモデルがまったくない場合にのみ決定的な型付きコマンドに低下します。プランナーは設定を直接変更できません。リクエストを Crestodian の型付きコマンドのいずれかに変換する必要があり、通常の承認/監査ルールが適用されます。Crestodian は何かを実行する前に、使用したモデルと解釈されたコマンドを出力します。フォールバックプランナーのターンは一時的で、ランタイムがサポートする場合はツール無効であり、一時的なワークスペース/セッションを使用します。

型付きコマンド文法はアンカーされています。メッセージはコマンドに完全一致するか、会話です。質問や自然な表現（「なぜ Gateway が停止したのか」）が操作をトリガーすることはありません。それらは AI によって回答されます。

シークレット衛生の例外が 1 つあります。機密パス（トークン、キー、パスワード）への完全一致の `config set` は、モデルに到達しません。これは決定的経路で実行され、提案は墨消しされ、値は AI に見える履歴でマスクされます。シークレットには `config set-ref <path> env <ENV_VAR>` を優先してください。

メッセージチャンネルのレスキューモードは、モデル支援プランナーを使用しません。リモートレスキューは決定的なままなので、壊れた、または侵害された通常のエージェント経路が設定エディターとして使用されることはありません。

### CLI ハーネスの信頼モデル

埋め込みランタイムと Codex app-server ハーネスは、リングゼロ制限を直接強制します。実行には `crestodian` ツールのみを含むツール許可リストが含まれます。CLI ハーネス（Claude Code、Gemini CLI）は OpenClaw ツール許可リストを強制できません。CLI はそのネイティブツールと独自の権限ポリシーを所有するため、制限を求められた場合 OpenClaw は失敗して閉じます。CLI ハーネスモデルでは、Crestodian は代わりに次を行います。

- `crestodian` ツールのみを提供する専用 MCP サーバーを注入し、実行時の OpenClaw の通常 MCP ツール面を置き換えます（Claude Code では、生成された設定が `--strict-mcp-config` で適用されるため、他の MCP サーバーは読み込まれません）。
- すべての設定変更をツールの承認および監査契約内に保持します。読み取りは自由に実行され、書き込みには会話上の yes が必要で、適用されたすべての書き込みは監査され再検証されます。
- ネイティブツール（ファイル読み取り、シェル）はハーネスに任せます。それらは、このマシン上の通常の OpenClaw エージェント実行と同じ権限姿勢に従います。OpenClaw のデフォルト exec 設定では Claude Code は権限をバイパスして実行され、制限された `tools.exec` 設定では CLI 独自の権限ポリシーにフォールバックします。

Crestodian セッションだけが crestodian MCP サーバーを取得します。通常のエージェント実行がこのツールを見ることはありません。CLI ハーネスモデル上の Crestodian セッションは、同じホスト上の通常のローカルエージェント実行と同様に扱ってください。リングゼロツールは、設定修復のために監査され承認ゲート付きの経路を追加しますが、ハーネスのネイティブツールがファイルを直接触ることを防ぎません。Codex app-server フォールバックと API キーモデルは厳格な単一ツールループを強制します。強い制限が必要な場合はそれらを優先してください。

## エージェントへの切り替え

自然言語セレクターを使って Crestodian を離れ、通常の TUI を開きます。

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`、`openclaw chat`、`openclaw terminal` は通常のエージェント TUI を直接開きます。Crestodian は開始しません。通常の TUI に切り替えた後は、`/crestodian` で Crestodian に戻ります。任意で後続リクエストを付けられます。

```text
/crestodian
/crestodian restart gateway
```

## メッセージレスキューモード

メッセージレスキューモードは、Crestodian のメッセージチャンネルエントリポイントです。通常のエージェントが停止しているが、信頼済みチャンネル（たとえば WhatsApp）がまだコマンドを受信できる場合に使用します。

サポートされるコマンド: `/crestodian <request>`。レスキューは正確な型付きコマンド文法のみを受け付けます。自然言語はヒント付きで拒否され、操作として推測されることはなく、モデルが参照されることもありません。

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

エージェント作成は、ローカルまたはレスキュー経由でもキューに入れられます。

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

リモートレスキューは管理者面であり、通常のチャットではなくリモート設定修復として扱う必要があります。

リモートレスキューのセキュリティ契約:

- エージェント/セッションでサンドボックス化が有効な場合は無効化される。Crestodian はリモートレスキューを拒否し、ローカル CLI 修復へ誘導する。
- 既定の有効状態は `auto`: 信頼された YOLO 操作でのみリモートレスキューを許可する。この状態では、ランタイムはすでにサンドボックスなしのローカル権限を持つ（`tools.exec.security` は `full` に解決され、`tools.exec.ask` は `off` に解決され、サンドボックスモードは `off`）。
- 明示的な所有者 ID が必要。ワイルドカード送信者ルール、開かれたグループポリシー、未認証 Webhook、匿名チャネルは不可。
- 既定では所有者 DM のみ。グループ/チャネルでのレスキューには明示的なオプトインが必要。
- Plugin の検索と一覧表示は読み取り専用。Plugin のインストールは実行可能コードをダウンロードするため、常にローカル限定（それ以外が有効でもレスキューではブロック）。Plugin のアンインストールは永続的なレスキュー操作として承認できる。
- リモートレスキューではローカル TUI を開いたり、対話型エージェントセッションへ切り替えたりできない。エージェントの引き継ぎにはローカルの `openclaw` を使用する。
- レスキューモードでも、永続的な書き込みには承認が必要。
- 適用されたすべてのレスキュー操作は監査される。メッセージチャネルのレスキューは、チャネル、アカウント、送信者、送信元アドレスのメタデータを記録する。設定を変更する操作では、変更前後の設定ハッシュも記録する。
- シークレットは決してエコーされない。SecretRef 検査は値ではなく利用可否を報告する。
- Gateway が稼働している場合、レスキューは Gateway の型付き操作を優先する。停止している場合、レスキューは通常のエージェントループに依存しない最小限のローカル修復サーフェスのみを使用する。

設定形式:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
      "pendingTtlMinutes": 15,
    },
  },
}
```

- `enabled`: `"auto"`（既定）は、有効なランタイムが YOLO でサンドボックス化がオフの場合にのみレスキューを許可する。`false` はメッセージチャネルレスキューを一切許可しない。`true` は所有者/チャネルのチェックに合格した場合にレスキューを明示的に許可する（それでもサンドボックス化による拒否の対象）。
- `ownerDmOnly`: レスキューを所有者へのダイレクトメッセージに制限する。既定は `true`。
- `pendingTtlMinutes`: 保留中のレスキュー書き込みが、期限切れになる前に `/crestodian yes` 承認を待つ時間。既定は `15`。

リモートレスキューは Docker レーンでカバーされる:

```bash
pnpm test:docker:crestodian-rescue
```

設定なしのローカルプランナーのフォールバックは次でカバーされる:

```bash
pnpm test:docker:crestodian-planner
```

オプトインのライブチャネルコマンドサーフェスのスモークでは、`/crestodian status` に加えて、レスキューハンドラーを通した永続的な承認ラウンドトリップをチェックする:

```bash
pnpm test:live:crestodian-rescue-channel
```

明示的な Crestodian コマンドによる設定なしのセットアップは次でカバーされる:

```bash
pnpm test:docker:crestodian-first-run
```

このレーンは空の状態ディレクトリから開始し、最新の onboard Crestodian エントリポイントを検証し、既定モデルを設定し、追加のエージェントを作成し、Plugin の有効化とトークン SecretRef を通じて Discord を設定し、設定を検証し、監査ログをチェックする。QA Lab には、同じ Ring 0 フロー用のリポジトリ裏付けシナリオがある:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Doctor](/ja-JP/cli/doctor)
- [TUI](/ja-JP/cli/tui)
- [サンドボックス](/ja-JP/cli/sandbox)
- [セキュリティ](/ja-JP/cli/security)

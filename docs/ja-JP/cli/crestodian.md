---
read_when:
    - セットアップ後にコマンドなしで openclaw を実行し、Crestodian について理解したい場合
    - OpenClawを検査または修復するには、設定なしでも安全な方法が必要です
    - メッセージチャネルのレスキューモードを設計または有効化している
summary: Crestodian の CLI リファレンスとセキュリティモデル、設定不要で安全なセットアップおよび修復ヘルパー
title: Crestodian
x-i18n:
    generated_at: "2026-07-05T17:41:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: da05f022b0fbff985b89a96e29ef5e987e97e017a5e40d50dfe0daf7eb03bf4f
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian は OpenClaw のローカルセットアップ、修復、構成ヘルパーです。通常のエージェント経路が壊れているときでも到達可能なままです。`openclaw.json` が存在しない、または無効な場合、Gateway が停止している場合、Plugin コマンド登録が利用できない場合、まだエージェントが構成されていない場合でも実行できます。

## 起動するタイミング

サブコマンドなしで `openclaw` を実行すると、構成状態に基づいてルーティングされます。

- 構成が存在しない、または作成済み設定がない状態で存在する（空、または `$schema`/`meta` キーのみ）: クラシックなオンボーディングを開始します。
- 構成は存在するが検証に失敗する: Crestodian を開始します。
- 構成が存在し有効: 通常のエージェント TUI を開きます（到達可能な構成済み Gateway に対して、または到達可能なものがない場合はローカルで）。Crestodian に到達するには、TUI 内で `/crestodian` を使うか、`openclaw crestodian` を直接実行します。

`openclaw crestodian` を実行すると、構成状態に関係なく常に Crestodian を明示的に開始します。`openclaw --help` と `openclaw --version` は通常の高速経路を維持します。

非対話型の素の `openclaw`（TTY なし）は、ルートヘルプを出力する代わりに短いメッセージで終了します。新規インストールでは非対話型オンボーディングを示し、構成が無効な場合は `openclaw crestodian --message "status"` を示し、構成が有効な場合は `openclaw agent --local ...` を示します。

`openclaw onboard --modern` は、モダンオンボーディングプレビューとして Crestodian を開始します。通常の `openclaw onboard` はクラシックなオンボーディングを維持します。

## Crestodian が表示するもの

対話型 Crestodian は、`openclaw tui` と同じ TUI シェルを Crestodian チャットバックエンドで開きます。起動時の挨拶には以下が含まれます。

- 構成の有効性とデフォルトエージェント
- Crestodian が使用しているモデル、または決定的プランナー経路
- 最初の起動プローブから見た Gateway 到達性
- 次に推奨されるデバッグ操作

起動するためだけにシークレットを出力したり、Plugin CLI コマンドを読み込んだりすることはありません。

詳細なインベントリには `status` を使います。構成パス、docs/source パス、ローカル CLI プローブ、API キーの有無、エージェント、モデル、Gateway の詳細が表示されます。

Crestodian は通常のエージェントと同じ参照検出を使います。Git チェックアウトではローカルの `docs/` とソースツリーを指し、npm インストールではバンドル済みドキュメントを使い、[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw) にリンクします。ドキュメントだけでは不十分な場合はソースを確認するよう案内します。

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

Crestodian TUI 内:

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

Crestodian は、その場限りに構成を編集するのではなく、型付き操作を使います。

読み取り専用で即時実行されるもの: 概要の表示、エージェント一覧、インストール済みPlugin一覧、ClawHub Plugin の検索、モデル/バックエンド状態の表示、status/health チェックの実行、Gateway 到達性の確認、対話型修正なしでの doctor 実行、構成検証、監査ログパスの表示。

永続的で、会話上の承認（または直接コマンドの `--yes`）が必要なもの: 構成の書き込み、`config set`、`config set-ref`、セットアップ/オンボーディングブートストラップ、デフォルトモデルの変更、Gateway の開始/停止/再起動、エージェント作成、Plugin のインストールまたはアンインストール、構成または状態を書き換える doctor 修復の実行。

適用された書き込みは `~/.openclaw/audit/crestodian.jsonl` に記録されます。検出は監査されません。適用された操作と書き込みのみが対象です。

チャネルセットアップは、ホストがマスク入力をサポートしている場合、ホストされた会話として実行できます。ローカルの Crestodian TUI は機密性の高いウィザード回答を受け付けません。代わりに `openclaw channels add --channel <channel>` に誘導し、その対話型プロンプトが認証情報をマスクします。

## セットアップブートストラップ

`setup` はチャット優先のオンボーディングブートストラップです。型付き構成操作を通じてのみ書き込み、先に承認を求めます。

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

モデルが構成されていない場合、setup は次の順序で最初に利用可能なバックエンドを選び、何を選んだかを通知します。

1. すでに構成されている場合は、既存の明示的なモデル。
2. `OPENAI_API_KEY` -> `openai/gpt-5.5`
3. `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-8`
4. Claude Code CLI -> `claude-cli/claude-opus-4-8`
5. Codex -> Codex app-server ハーネス経由の `openai/gpt-5.5`
6. Gemini CLI -> `google-gemini-cli/gemini-3.1-pro-preview`

利用可能なものがない場合でも、setup はデフォルトワークスペースを書き込み、モデルは未設定のままにします。Codex/Claude Code/Gemini CLI をインストールまたはログインするか、`OPENAI_API_KEY`/`ANTHROPIC_API_KEY` を公開してから、setup を再度実行します。

macOS アプリは、`crestodian.setup.detect` と `crestodian.setup.activate` Gateway メソッドを通じて同じラダーを実行します。detect は見つけた再利用可能なバックエンドをすべて一覧表示し、activate は候補を 1 つライブテスト（実際の「OK で返信」補完）し、テストが通った後でのみモデル、ワークスペース、Gateway のデフォルトを永続化します。失敗した候補は構成を変更しません。アプリは自動的にラダーを下り、最後に手動の API キーステップ（Anthropic、OpenAI、または Google）を提示し、保存前に同じ方法で検証します。

## モデル支援プランナー

対話型 Crestodian は AI 優先です。正確な型付きコマンドは即座に決定的に実行されます。それ以外のすべてのメッセージは通常の OpenClaw エージェントと同じ埋め込みエージェントループを通り、型付き操作をラップするリングゼロの `crestodian` ツール 1 つに制限されます。読み取り操作は自由に実行され、変更にはその正確な操作に対する会話上の yes が必要で、適用されたすべての書き込みは監査され再検証されます。エージェントセッションは永続化されるため、カストディアンは実際のマルチターンメモリを持ちます。まず構成済みの OpenClaw モデルを使い、利用可能なモデルがない場合は、そのマシンにすでに存在するローカルランタイムにフォールバックします。

- Claude Code CLI: `claude-cli/claude-opus-4-8`（エージェントループ。リングゼロツールは MCP 経由で提供されます。下の信頼モデルを参照）
- Codex app-server ハーネス: `openai/gpt-5.5`（単一ツール許可リストを強制するエージェントループ）

エージェントループが利用できない場合、Crestodian は境界付けられたシングルターンプランナーへ劣化し、どのモデルもない場合は決定的な型付きコマンドへ劣化します。プランナーは構成を直接変更できません。リクエストを Crestodian の型付きコマンドの 1 つへ変換する必要があり、通常の承認/監査ルールが適用されます。Crestodian は、何かを実行する前に、使用したモデルと解釈したコマンドを出力します。フォールバックプランナーのターンは一時的で、ランタイムがサポートしている場合はツール無効化され、一時的なワークスペース/セッションを使います。

メッセージチャネル救出モードは、モデル支援プランナーを一切使いません。リモート救出は決定的なままなので、壊れた、または侵害された通常のエージェント経路を構成エディタとして使うことはできません。

### CLI ハーネス信頼モデル

埋め込みランタイムと Codex app-server ハーネスは、リングゼロ制限を直接強制します。実行には `crestodian` ツールのみを含むツール許可リストが付与されます。CLI ハーネス（Claude Code、Gemini CLI）は OpenClaw ツール許可リストを強制できません。CLI がネイティブツールと独自の権限ポリシーを所有しているため、制限を求められた場合 OpenClaw は失敗として閉じます。CLI ハーネスモデルでは、Crestodian は代わりに次を行います。

- `crestodian` ツールだけを提供する専用 MCP サーバーを注入し、その実行に対して OpenClaw の通常の MCP ツールサーフェスを置き換えます（Claude Code では生成された構成が `--strict-mcp-config` で適用されるため、他の MCP サーバーは読み込まれません）。
- すべての構成変更をツールの承認と監査契約の内側に保ちます。読み取りは自由に実行され、書き込みには会話上の yes が必要で、適用されたすべての書き込みは監査され再検証されます。
- ネイティブツール（ファイル読み取り、シェル）はハーネスに任せます。それらはこのマシン上の通常の OpenClaw エージェント実行と同じ権限姿勢に従います。OpenClaw のデフォルト exec 設定では Claude Code は権限をバイパスして実行され、制限された `tools.exec` 構成では CLI 独自の権限ポリシーへフォールバックします。

Crestodian MCP サーバーを受け取るのは Crestodian セッションだけです。通常のエージェント実行がこのツールを見ることはありません。CLI ハーネスモデル上の Crestodian セッションは、同じホスト上の通常のローカルエージェント実行と同様に扱ってください。リングゼロツールは、構成修復のために監査され承認ゲートされた経路を追加しますが、ハーネスのネイティブツールがファイルに直接触れることは防ぎません。Codex app-server フォールバックと API キーモデルは厳格な単一ツールループを強制します。強い制限が必要な場合はそちらを優先してください。

## エージェントへの切り替え

Crestodian を離れて通常の TUI を開くには、自然言語のセレクタを使います。

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`、`openclaw chat`、`openclaw terminal` は通常のエージェント TUI を直接開きます。Crestodian は開始しません。通常の TUI に切り替えた後は、`/crestodian` で Crestodian に戻れます。任意で後続リクエストも付けられます。

```text
/crestodian
/crestodian restart gateway
```

## メッセージ救出モード

メッセージ救出モードは、Crestodian のメッセージチャネルエントリポイントです。通常のエージェントが停止していても、信頼済みチャネル（たとえば WhatsApp）がまだコマンドを受信している場合に使います。

サポートされるコマンド: `/crestodian <request>`。

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

エージェント作成もローカルまたは救出経由でキューに入れられます。

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

リモート救出は管理者サーフェスであり、通常のチャットではなくリモート構成修復として扱う必要があります。

リモート救出のセキュリティ契約:

- エージェント/セッションでサンドボックス化が有効な場合は無効です。Crestodian はリモート救出を拒否し、ローカル CLI 修復を示します。
- デフォルトの実効状態は `auto` です。信頼済み YOLO 操作でのみリモート救出を許可します。この場合、ランタイムはすでにサンドボックスなしのローカル権限を持っています（`tools.exec.security` は `full` に解決され、`tools.exec.ask` は `off` に解決され、サンドボックスモードは `off`）。
- 明示的な所有者 ID が必要です。ワイルドカード送信者ルール、オープングループポリシー、未認証 Webhook、匿名チャネルは使えません。
- デフォルトでは所有者 DM のみです。グループ/チャネル救出には明示的なオプトインが必要です。
- Plugin 検索と一覧は読み取り専用です。Plugin インストールは実行可能コードをダウンロードするため、常にローカル専用です（他の条件で有効な場合でも救出ではブロックされます）。Plugin アンインストールは永続的な救出操作として承認できます。
- リモート救出はローカル TUI を開いたり、対話型エージェントセッションへ切り替えたりできません。エージェント引き継ぎにはローカルの `openclaw` を使います。
- 永続的な書き込みには、救出モードでも承認が必要です。
- 適用されたすべての救出操作は監査されます。メッセージチャネル救出は、チャネル、アカウント、送信者、送信元アドレスのメタデータを記録します。構成を変更する操作は、変更前後の構成ハッシュも記録します。
- シークレットは決してエコーされません。SecretRef 検査は値ではなく可用性を報告します。
- Gateway が稼働している場合、救出は Gateway の型付き操作を優先します。停止している場合、救出は通常のエージェントループに依存しない最小限のローカル修復サーフェスのみを使います。

構成の形:

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

- `enabled`: `"auto"` (デフォルト) は、有効なランタイムが YOLO でサンドボックス化がオフの場合にのみレスキューを許可します。`false` はメッセージチャネルのレスキューを許可しません。`true` は所有者/チャネルチェックに合格した場合にレスキューを明示的に許可します (ただし、サンドボックス化による拒否の対象には引き続きなります)。
- `ownerDmOnly`: レスキューを所有者へのダイレクトメッセージに制限します。デフォルトは `true` です。
- `pendingTtlMinutes`: 保留中のレスキュー書き込みが期限切れになる前に、`/crestodian yes` 承認のために開いたままになる時間です。デフォルトは `15` です。

リモートレスキューは Docker レーンでカバーされています。

```bash
pnpm test:docker:crestodian-rescue
```

設定なしのローカルプランナーフォールバックは以下でカバーされています。

```bash
pnpm test:docker:crestodian-planner
```

オプトインのライブチャネルコマンドサーフェスのスモークは、`/crestodian status` に加えて、レスキューハンドラーを通じた永続的な承認ラウンドトリップをチェックします。

```bash
pnpm test:live:crestodian-rescue-channel
```

明示的な Crestodian コマンドによる設定なしのセットアップは以下でカバーされています。

```bash
pnpm test:docker:crestodian-first-run
```

このレーンは空の状態ディレクトリから開始し、最新のオンボード Crestodian エントリーポイントを検証し、デフォルトモデルを設定し、追加のエージェントを作成し、Plugin の有効化とトークン SecretRef を通じて Discord を設定し、設定を検証し、監査ログをチェックします。QA Lab には、同じ Ring 0 フローに対応するリポジトリ backed のシナリオがあります。

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Doctor](/ja-JP/cli/doctor)
- [TUI](/ja-JP/cli/tui)
- [サンドボックス](/ja-JP/cli/sandbox)
- [セキュリティ](/ja-JP/cli/security)

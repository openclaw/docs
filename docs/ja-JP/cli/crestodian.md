---
read_when:
    - 推論のセットアップが完了し、残りの設定を Crestodian に任せたい場合
    - ローカルのセットアップエージェントを使用して OpenClaw を調査または修復する必要があります
    - メッセージチャネルのレスキューモードを設計または有効化している場合
summary: 推論ベースの Crestodian セットアップおよび修復ヘルパーの CLI リファレンスとセキュリティモデル
title: クレストディアン
x-i18n:
    generated_at: "2026-07-11T22:05:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af4861a48fb26159cb8e0c29d08ab5c3776283eb5392dcbe08c9a28d01f4abf5
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

対話型 Crestodian は、OpenClaw のローカルセットアップ、修復、設定を行うエージェントです。有効なデフォルトモデルが実際のターンを完了した後にのみ起動します。新規インストールでは最初に推論を確立し、不正な設定は従来の doctor パスで処理されます。

## 起動するタイミング

サブコマンドなしで `openclaw` を実行すると、設定状態に基づいて処理が振り分けられます。

- 設定が存在しない、または存在してもユーザーが記述した設定がない（空、あるいは `$schema`/`meta` キーのみ）場合: ライブ AI 検証を伴うガイド付きオンボーディングを開始します。
- 設定は存在するが検証に失敗する場合: 従来のオンボーディングを開始し、問題を報告して `openclaw doctor` の実行を案内します。
- 設定が存在し有効な場合: 通常のエージェント TUI を開きます。設定済みの Gateway に到達でき、そのデフォルトエージェントにモデルがある場合は、オンボーディングや Crestodian を経由せず、その UI に直接移動します。後で Crestodian を使用するには、TUI 内で `/crestodian` を使用するか、`openclaw crestodian` を直接実行します。

`openclaw crestodian` を実行すると、まず設定済みのデフォルトモデルをライブテストします。ターンが成功すると Crestodian が起動します。対話モードで失敗した場合はガイド付き推論セットアップが開き、候補が合格すると Crestodian に引き継がれます。推論が利用できない場合、ワンショット、JSON、その他の非対話リクエストは失敗し、`openclaw onboard` を実行するよう案内します。`openclaw --help` と `openclaw --version` は通常の高速パスを維持します。

非対話環境でサブコマンドなしの `openclaw` を実行した場合（TTY なし）、ルートヘルプを表示せず、短いメッセージを出力して終了します。新規または無効なインストールでは非対話オンボーディングを案内し、設定が有効な場合は `openclaw agent --local ...` を案内します。

`openclaw onboard --modern` は Crestodian の互換エイリアスとして残りますが、同じ推論ゲートを使用します。推論が動作していればチャットを開き、対話モードで失敗した場合はガイド付き推論セットアップを開始し、非対話モードで失敗した場合はオンボーディングの案内を表示して終了します。`openclaw onboard --classic` は、手順を順番に進める完全なウィザードを開きます。

## Crestodian に表示される内容

対話型 Crestodian は、`openclaw tui` と同じ TUI シェルを Crestodian チャットバックエンドで開きます。起動時の挨拶には次の内容が含まれます。

- 設定の有効性とデフォルトエージェント
- Crestodian が使用している検証済みモデル
- 最初の起動プローブによる Gateway の到達可能性
- 次に推奨されるデバッグ操作

起動するだけのためにシークレットを出力したり、Plugin の CLI コマンドを読み込んだりすることはありません。

詳細な一覧を確認するには `status` を使用します。設定パス、ドキュメント／ソースのパス、ローカル CLI プローブ、キー／トークンの有無、エージェント、モデル、Gateway の詳細が表示されます。

Crestodian は通常のエージェントと同じ参照先検出を使用します。Git チェックアウトではローカルの `docs/` とソースツリーを参照し、npm インストールでは同梱ドキュメントと [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw) へのリンクを使用します。また、ドキュメントだけでは不十分な場合はソースを確認するよう案内します。

## 例

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work" --yes
openclaw crestodian --message "set default model openai/gpt-5.6" --yes
openclaw onboard --modern
```

Crestodian TUI 内では次のように操作します。

```text
status
health
doctor
validate config
setup
setup workspace ~/Projects/work
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
configure model provider
set default model openai/gpt-5.6
channels
channel info slack
connect slack
open channel wizard for slack
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## 操作と承認

Crestodian は、設定をその場しのぎで編集するのではなく、型付き操作を使用します。

読み取り専用操作は即座に実行されます。概要の表示、エージェントの一覧表示、インストール済み Plugin の一覧表示、ClawHub Plugin の検索、モデル／バックエンド状態の表示、ステータス／ヘルスチェックの実行、Gateway の到達可能性確認、対話的修正を伴わない doctor の実行、設定の検証、監査ログパスの表示が該当します。

ガイド付きチャンネルセットアップ（`connect telegram`）の開始も即座に実行されます。そのウィザードが明示的な回答を収集し、結果として生じる書き込みを管理します。

永続的な操作には対話による承認が必要です（直接コマンドでは `--yes` も使用できます）。設定の書き込み、`config set`、`config set-ref`、セットアップ／オンボーディングのブートストラップ、デフォルトモデルの変更、Gateway の起動／停止／再起動、エージェントの作成、Plugin のインストールが該当します。

doctor による修復は Crestodian 内では利用できません。セッションを動作させているプロバイダー、認証、またはデフォルトエージェントの推論ルートが書き換えられる可能性があるためです。Crestodian を終了し、ターミナルで `openclaw doctor --fix` を実行してください。読み取り専用の `doctor` は Crestodian 内でも引き続き利用できます。

新しいエージェントは、ライブ検証済みのデフォルト推論ルートを継承します。エージェント ID `crestodian` は、特権を持つ仮想管理エージェント用に予約されているため、通常のエージェントとして作成できません。

`config set` と `config set-ref` では、推論プロバイダーの資格情報、トップレベルの `auth.*`、モデルカタログ、CLI バックエンド、デフォルト／エージェント別モデルルート、エージェントのパラメーター／ツール、ルートの `tools.*` など、推論ルートの状態を変更できません。`env.*`、`secrets.*`、`plugins.*`、`$include` 配下への直接書き込みも、資格情報の解決やプロバイダーの有効化を置き換える可能性があるため拒否されます。Gateway とチャンネルの認証は通常の設定対象のままです。型付きの Plugin／チャンネルワークフローと、設定済みルートに対する `set default model <provider/model>` を使用してください。このコマンドは保存前にルートをライブテストします。プロバイダー／認証アクセスを設定または修復するには、Crestodian を終了して `openclaw onboard` を実行してください。

Crestodian 内では Plugin のアンインストールが拒否されます。プロバイダー Plugin を削除すると、セッションを動作させている推論ルートが無効になる可能性があるためです。Crestodian を終了し、ターミナルから `openclaw plugins uninstall <id>` を実行してください。

承認は自分の言葉で行えます。曖昧でない返答（「はい」「もちろん」「進めて」「今はしない」）は、閉じた決定論的なリストに基づいて判定されます。設定済みルートが個別の補完呼び出しをサポートしている場合、その他の返答は、あなたのメッセージと保留中の提案だけを使って分類できます。自己承認できない会話モデル自体が分類することはありません。分類不能または曖昧な返答では提案が保留されたままとなり、会話内で再度確認されます。

適用された書き込みは `~/.openclaw/audit/crestodian.jsonl` に記録されます。検出処理は監査されず、適用された操作と書き込みだけが監査対象です。

チャンネルセットアップは、シークレットが必要になるまでホストされた会話として実行できます。ローカルの Crestodian TUI では、ターミナルのチャット入力が見えるため、機密性の高いウィザード回答を受け付けません。選択したチャンネルをマスク入力対応のターミナルウィザードへ引き継ぐ `open channel wizard` が即座に提示されます。後で `openclaw channels add --channel <channel>` を実行することもできます。

### マスク入力対応チャンネルセットアップへの切り替え

ローカルチャットからマスク入力対応のチャンネルウィザードへ制御を引き渡せます。

```text
open channel wizard for slack
channel info slack
```

`open channel wizard for <channel>` は、チャット TUI の終了後にマスク入力対応のチャンネルセットアップを開きます。先に `channel info <channel>` を使用すると、チャンネルのラベル、セットアップ状態、前提条件の概要、ドキュメントへのリンクを確認できます。

Crestodian は自身のセッション内からプロバイダー／認証アクセスを変更しません。セッション自体がその推論ルートに依存しているためです。モデルプロバイダーのセットアップまたは修復では、`configure model provider` はウィザードの開始や設定の書き込みを行わず、終了してオンボーディングを実行するよう案内します。Crestodian を終了して `openclaw onboard` を実行してください。オンボーディングは資格情報を一時的に準備し、実際のライブターンを完了したルートだけを保存します。オンボーディングが成功したら、Crestodian を再度起動してください。

## セットアップのブートストラップ

`setup` は、ガイド付きオンボーディングですでに推論が確立された後、残りのワークスペースと Gateway の状態を設定します。型付き設定操作だけを通じて書き込みを行い、最初に承認を求めます。

```text
setup
setup workspace ~/Projects/work
```

`setup` は検証済みの有効なモデルを維持します。推論を設定したり置き換えたりすることはありません。

推論が存在しない場合やライブチェックに失敗する場合は、Crestodian を終了して `openclaw onboard` を実行してください。ガイド付きオンボーディングは、設定済みモデル、API キー、認証済みローカル CLI を検出し、各候補に実際の応答を求め、合格したルートだけを永続化します。その境界を越えると Crestodian が即座に起動し、ワークスペース、Gateway、チャンネル、エージェント、Plugin、その他のオプション機能を設定できるようになります。

macOS アプリは、デフォルトエージェントにすでにモデルが設定された Gateway に到達した場合、この一連の処理を完全に省略し、通常のエージェント UI を開きます。
新規または不完全な Gateway の場合、アプリは `crestodian.setup.detect` と `crestodian.setup.activate` の Gateway メソッドを通じて推論の候補選択処理を進めます。detect は検出したすべてのバックエンド候補を一覧表示し、activate は候補を 1 つライブテストします（実際に「reply with OK」への補完を実行します）。テストが成功した後にのみ、そのルートに必要なモデル、資格情報、プロバイダー／ランタイムの状態を永続化します。ワークスペースと Gateway のデフォルト設定は Crestodian 用として残ります。失敗した候補によって設定が変更されることはありません。アプリは自動的に候補を順番に試し、最後に、Gateway で有効なテキスト推論プロバイダー Plugin から候補が入力された手動のキー／トークン設定手順を提示します。選択したプロバイダーが初期モデルと設定を所有し、資格情報も保存前に同じ方法で検証されます。

Codex の監督やその他のオプションの Plugin 機能は、この推論有効化トランザクションの対象外です。推論が動作し、Crestodian が起動してから設定してください。既存の Plugin ポリシーと明示的な監督のオプトアウトは、推論セットアップ中に変更されません。

## AI 会話

対話型 Crestodian の自由形式の会話は、通常の OpenClaw エージェントと同じエージェントループを通じて実行されますが、型付き操作をラップするリングゼロの OpenClaw 権限ツール `crestodian` 1 つだけに制限されます。読み取り操作は自由に実行され、変更操作にはその特定の操作に対する対話による承認が必要です（「操作と承認」を参照）。適用されたすべての書き込みは監査され、再検証されます。エージェントセッションは永続化されるため、Crestodian は実際の複数ターンのメモリを保持します。検証済みの推論ルートが後で動作しなくなった場合は、`openclaw onboard` に戻って修復してから続行してください。

ホストは自然言語リクエストを操作として解析しません。コマンドのように見えるテキストや「gateway が停止したのはなぜ？」のような質問を含む自由形式のメッセージは AI に送られ、AI が `crestodian` ツールを通じてリクエストを型付き操作に対応付けます。

変更操作が保留中の場合、閉じたリストに含まれる曖昧でない承認または拒否の表現だけが、推論なしで判定されます。曖昧な同意は個別に設定された補完呼び出しへ送られ、それ以外の場合は安全側に倒して拒否されます。構造化されたウィザードフィールドと正確なホストナビゲーションは UI コントロールであり、自然言語による操作解析ではありません。シークレットの衛生管理に関して特に重要な例外があります。機密パス（トークン、キー、パスワード）への正確な `config set` はモデルに一切送信されません。ホストが秘匿化された提案を作成し、AI に表示される履歴では値がマスクされます。シークレットには `config set-ref <path> env <ENV_VAR>` を使用することを推奨します。

メッセージチャンネルのレスキューモードでは、モデル支援プランナーを一切使用しません。通常のエージェントパスが壊れている、または侵害されている場合でも、設定エディターとして悪用されないように、リモートレスキューは決定論的に動作します。

### CLI ハーネスの信頼モデル

組み込みランタイムと Codex app-server ハーネスは、リングゼロ制限を直接適用します。実行には `crestodian` ツールだけを含む OpenClaw ツール許可リストが設定されます。Codex では、その実行に対して環境、ネイティブ実行、マルチエージェント、ゴール、アプリ／Plugin、スキル／MCP、ウェブ検索、`request_user_input` の各機能も OpenClaw が無効化します。Codex は動作しないネイティブの `update_plan` ユーティリティを引き続き注入します。このユーティリティはモデルの一時的なチェックリストを更新できますが、ファイルや OpenClaw の設定を書き込むことはできません。CLI ハーネスは OpenClaw の許可リストを使用しないため、Crestodian が受け入れるのは、独自のツール選択契約によって同等の制限を証明できるバックエンドだけです。

- Claude Code を含む選択可能なバックエンドは、ネイティブツールの選択が空で、MCP ツール `crestodian` が 1 つだけの状態で起動します。Claude が生成する MCP 設定には `--strict-mcp-config` が適用されるため、ほかの MCP サーバーは読み込まれません。
- ネイティブツールを宣言しないバックエンドには、同じ専用の Crestodian MCP サーバーが提供されます。
- 常時有効または不明なネイティブツールを持つバックエンドは、推論前にフェイルクローズします。これらは Crestodian セッションをホストできません。

crestodian MCP サーバーが提供されるのは Crestodian セッションだけであり、通常のエージェント実行でこのツールが表示されることはありません。そのため、選択可能かつネイティブツールなしの CLI バックエンドと API キーモデルでは、文字どおり単一ツールのループが強制されます。Codex app-server モデルでは、単一の OpenClaw 権限ツールと、実際の処理を行わないネイティブ計画ユーティリティが強制されます。3 つのケースすべてで、セットアップによる書き込みは Crestodian の監査対象の承認契約内に限定されます。

Gemini CLI は通常のエージェントでは引き続き利用できますが、推論ゲートに必要なツールなしのプローブを強制できないため、Crestodian をホストできません。

## エージェントへの切り替え

自然言語のセレクターを使用して Crestodian を終了し、通常の TUI を開きます。

```text
エージェントと話す
work エージェントと話す
main エージェントに切り替える
```

`openclaw tui`、`openclaw chat`、`openclaw terminal` は通常のエージェント TUI を直接開きます。Crestodian は起動しません。通常の TUI に切り替えた後、`/crestodian` を使用すると Crestodian に戻ります。必要に応じて、後続のリクエストを指定できます。

```text
/crestodian
/crestodian restart gateway
```

## メッセージレスキューモード

メッセージレスキューモードは、Crestodian に対するメッセージチャネルのエントリーポイントです。通常のエージェントが停止していても、信頼済みのチャネル（WhatsApp など）が引き続きコマンドを受信できる場合に使用します。

これは決定論的な緊急コマンドハンドラーであり、会話型の Crestodian エージェントではありません。新規セットアップのブートストラップも、Crestodian チャットの推論ゲートの緩和も行いません。

サポートされるコマンドは `/crestodian <request>` です。レスキューでは、入力された正確なコマンド文法だけを受け付けます。自然言語はヒントとともに拒否され、操作として推測されることはなく、モデルが参照されることもありません。

```text
信頼済みのオーナー DM 内のあなた: /crestodian status
OpenClaw: Crestodian レスキューモード。Gateway に到達可能: いいえ。設定が有効: いいえ。
あなた: /crestodian restart gateway
OpenClaw: 計画: Gateway を再起動します。適用するには /crestodian yes と返信してください。
あなた: /crestodian yes
OpenClaw: 適用しました。監査エントリを書き込みました。
```

エージェントの作成は、ローカルまたはレスキュー経由でキューに追加することもできます。

```text
create agent work workspace ~/Projects/work model openai/gpt-5.6-sol
/crestodian create agent work workspace ~/Projects/work
```

エージェントの作成で指定できるのは、現在ライブ検証済みのデフォルトモデルだけです。そのルートを継承するには、モデルを省略します。

リモートレスキューは管理者向けの機能であり、通常のチャットではなく、リモート設定修復と同様に扱う必要があります。

リモートレスキューのセキュリティ契約:

- エージェントまたはセッションでサンドボックスが有効な場合は無効になります。Crestodian はリモートレスキューを拒否し、ローカル CLI による修復を案内します。
- デフォルトの実効状態は `auto` です。ランタイムがサンドボックスなしのローカル権限をすでに持つ、信頼済みの YOLO 操作の場合にのみリモートレスキューを許可します（サンドボックスモードが `off` で、`tools.exec.security` が `full` に解決され、`tools.exec.ask` が `off` に解決される場合）。
- 明示的なオーナー ID が必要です。ワイルドカードの送信者ルール、開放されたグループポリシー、未認証の Webhook、匿名チャネルは使用できません。
- デフォルトではオーナーの DM のみに限定されます。グループまたはチャネルでのレスキューには、明示的なオプトインが必要です。
- Plugin の検索と一覧表示は読み取り専用です。Plugin のインストールは実行可能コードをダウンロードするため、常にローカル限定です（ほかの条件で有効な場合でも、レスキューではブロックされます）。Plugin のアンインストールは、ローカルの Crestodian とレスキューの両方で拒否されます。ターミナルから `openclaw plugins uninstall <id>` を実行してください。
- リモートレスキューでは、ローカル TUI を開くことも、対話型エージェントセッションに切り替えることもできません。エージェントへの引き継ぎには、ローカルの `openclaw` を使用してください。
- 永続的な書き込みには、レスキューモードでも引き続き承認が必要です。
- 適用されたすべてのレスキュー操作は監査されます。メッセージチャネルのレスキューでは、チャネル、アカウント、送信者、送信元アドレスのメタデータが記録されます。設定を変更する操作では、変更前後の設定ハッシュも記録されます。
- シークレットが表示されることはありません。SecretRef の検査では、値ではなく利用可否が報告されます。
- Gateway が稼働している場合、レスキューでは Gateway の型付き操作が優先されます。停止している場合は、通常のエージェントループに依存しない最小限のローカル修復機能だけが使用されます。

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

- `enabled`: `"auto"`（デフォルト）は、実効ランタイムが YOLO で、サンドボックスが無効な場合にのみレスキューを許可します。`false` はメッセージチャネルのレスキューを一切許可しません。`true` は、オーナーとチャネルのチェックに合格した場合にレスキューを明示的に許可します（サンドボックスによる拒否は引き続き適用されます）。
- `ownerDmOnly`: レスキューをオーナーからのダイレクトメッセージに限定します。デフォルトは `true` です。
- `pendingTtlMinutes`: 保留中のレスキュー書き込みが期限切れになるまで、`/crestodian yes` による承認を待機する時間です。デフォルトは `15` です。

リモートレスキューは、次の Docker レーンでテストされます。

```bash
pnpm test:docker:crestodian-rescue
```

オプトインのライブチャネルコマンド機能のスモークテストでは、`/crestodian status` と、レスキューハンドラーを介した永続的な承認の往復処理を確認します。

```bash
pnpm test:live:crestodian-rescue-channel
```

推論ゲート付きのパッケージ版ワンショットセットアップは、次のテストで確認されます。

```bash
pnpm test:docker:crestodian-first-run
```

このパッケージ版 CLI レーンは空の状態ディレクトリから開始し、推論なしでは Crestodian がフェイルクローズすることを確認します。次に、パッケージ版の有効化モジュールを通じて偽の Claude をテストし、有効化します。その後でのみ、曖昧なリクエストがプランナーに渡されて型付きセットアップに解決されます。続いて、追加のエージェントの作成、Plugin の有効化とトークンの SecretRef を介した Discord の設定、設定の検証、監査ログの確認を行うワンショットコマンドが実行されます。このレーンはゲートと操作を補足する証拠であり、対話型オンボーディングや、Crestodian のエージェント、ツール、承認に関する会話は実行しません。以下の QA Lab シナリオは、同じ Docker レーンにリダイレクトされます。

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [Doctor](/ja-JP/cli/doctor)
- [TUI](/ja-JP/cli/tui)
- [サンドボックス](/ja-JP/cli/sandbox)
- [セキュリティ](/ja-JP/cli/security)

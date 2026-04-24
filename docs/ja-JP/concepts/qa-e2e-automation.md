---
read_when:
    - qa-lab または qa-channel を拡張する場合
    - リポジトリに裏打ちされた QA シナリオを追加する 경우
    - Gateway ダッシュボードを中心に、より高い現実性の QA 自動化を構築する場合
summary: qa-lab、qa-channel、シード済みシナリオ、プロトコルレポート向けのプライベート QA 自動化の形態
title: QA E2E 自動化
x-i18n:
    generated_at: "2026-04-24T04:54:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: bbde51169a1572dc6753ab550ca29ca98abb2394e8991a8482bd7b66ea80ce76
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

プライベート QA スタックは、単一のユニットテストよりも現実的で、
チャネル形状に近い方法で OpenClaw を検証することを目的としています。

現在の構成要素:

- `extensions/qa-channel`: DM、チャネル、スレッド、
  リアクション、編集、削除のサーフェスを持つ合成メッセージチャネル。
- `extensions/qa-lab`: トランスクリプトを観察し、
  受信メッセージを注入し、Markdown レポートを書き出すためのデバッガー UI と QA バス。
- `qa/`: キックオフタスクとベースライン QA
  シナリオ用の、リポジトリに裏打ちされたシードアセット。

現在の QA オペレーターフローは、2 ペインの QA サイトです。

- 左: エージェントを表示する Gateway ダッシュボード（Control UI）。
- 右: Slack 風トランスクリプトとシナリオプランを表示する QA Lab。

実行するには:

```bash
pnpm qa:lab:up
```

これにより QA サイトがビルドされ、Docker ベースの Gateway レーンが起動し、
オペレーターまたは自動化ループがエージェントに QA ミッションを与え、
実際のチャネル動作を観察し、何が機能し、何が失敗し、何がブロックされたままかを記録できる
QA Lab ページが公開されます。

Docker イメージを毎回再ビルドせずに、QA Lab UI をより高速に反復したい場合は、
バインドマウントされた QA Lab バンドルでスタックを起動してください。

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` は Docker サービスを事前ビルド済みイメージ上で維持し、
`extensions/qa-lab/web/dist` を `qa-lab` コンテナにバインドマウントします。`qa:lab:watch`
は変更時にそのバンドルを再ビルドし、QA Lab のアセットハッシュが変わるとブラウザーが自動再読み込みされます。

トランスポート実体の Matrix スモークレーンを実行するには、次を実行します。

```bash
pnpm openclaw qa matrix
```

このレーンは、使い捨ての Tuwunel homeserver を Docker 内に用意し、一時的な
driver、SUT、observer ユーザーを登録し、1 つのプライベートルームを作成した後、
QA Gateway 子プロセス内で実際の Matrix Plugin を実行します。ライブトランスポートレーンでは、子 config をテスト対象トランスポートにスコープするため、Matrix は子 config 内で `qa-channel` なしで実行されます。構造化レポートアーティファクトと、結合された stdout/stderr ログを、選択された Matrix QA 出力ディレクトリに書き出します。外側の `scripts/run-node.mjs` のビルド/ランチャー出力も取得するには、`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` をリポジトリローカルのログファイルに設定してください。

トランスポート実体の Telegram スモークレーンを実行するには、次を実行します。

```bash
pnpm openclaw qa telegram
```

このレーンは、使い捨てサーバーを用意する代わりに、1 つの実際のプライベート Telegram グループを対象にします。`OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` に加え、同じプライベートグループ内にある 2 つの異なるボットが必要です。SUT ボットには Telegram username が必要で、ボット間観察は、両方のボットで `@BotFather` 内の Bot-to-Bot Communication Mode を有効にしていると最も安定します。
いずれかのシナリオが失敗すると、このコマンドは非ゼロで終了します。終了コードを失敗にしたくないがアーティファクトは欲しい場合は `--allow-failures` を使用してください。
Telegram レポートとサマリーには、driver メッセージ送信リクエストから観察された SUT 返信までの返信ごとの RTT が含まれ、canary から開始します。

トランスポート実体の Discord スモークレーンを実行するには、次を実行します。

```bash
pnpm openclaw qa discord
```

このレーンは、2 つのボットを持つ 1 つの実際のプライベート Discord guild channel を対象にします。1 つは harness によって制御される driver ボット、もう 1 つは同梱の Discord Plugin を通じて子 OpenClaw Gateway によって起動される SUT ボットです。環境変数による認証情報を使う場合、`OPENCLAW_QA_DISCORD_GUILD_ID`、`OPENCLAW_QA_DISCORD_CHANNEL_ID`、`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`、`OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` が必要です。
このレーンは、チャネルメンション処理を検証し、SUT ボットがネイティブな `/help` コマンドを Discord に登録していることを確認します。
いずれかのシナリオが失敗すると、このコマンドは非ゼロで終了します。終了コードを失敗にしたくないがアーティファクトは欲しい場合は `--allow-failures` を使用してください。

ライブトランスポートレーンは現在、それぞれが独自のシナリオ一覧形状を発明するのではなく、
1 つのより小さな共通契約を共有します。

`qa-channel` は依然として広範な合成プロダクト動作スイートであり、
ライブトランスポートのカバレッジマトリクスには含まれません。

| レーン   | Canary | メンションゲーティング | 許可リストブロック | トップレベル返信 | 再起動再開 | スレッド追従 | スレッド分離 | リアクション観察 | Help コマンド | ネイティブコマンド登録 |
| -------- | ------ | ---------------------- | ------------------ | ---------------- | ---------- | ------------ | ------------ | ---------------- | ------------- | ---------------------- |
| Matrix   | x      | x                      | x                  | x                | x          | x            | x            | x                |               |                        |
| Telegram | x      | x                      |                    |                  |            |              |              |                  | x             |                        |
| Discord  | x      | x                      |                    |                  |            |              |              |                  |               | x                      |

これにより、`qa-channel` は広範なプロダクト動作スイートとして維持される一方で、
Matrix、Telegram、および今後のライブトランスポートは 1 つの明示的なトランスポート契約チェックリストを共有します。

Docker を QA 経路に持ち込まずに、使い捨て Linux VM レーンを実行するには、次を実行します。

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

これにより、新しい Multipass guest が起動し、依存関係をインストールし、guest 内で OpenClaw をビルドし、
`qa suite` を実行した後、通常の QA レポートとサマリーをホスト上の `.artifacts/qa-e2e/...` にコピーします。
シナリオ選択の動作は、ホスト上の `qa suite` と同じものを再利用します。
ホスト実行と Multipass スイート実行はどちらも、デフォルトで分離された Gateway worker により、選択された複数のシナリオを並列実行します。`qa-channel` のデフォルト並列数は 4 で、選択されたシナリオ数によって上限が決まります。worker 数を調整するには `--concurrency <count>`、直列実行には `--concurrency 1` を使用してください。
いずれかのシナリオが失敗すると、このコマンドは非ゼロで終了します。終了コードを失敗にしたくないがアーティファクトは欲しい場合は `--allow-failures` を使用してください。
ライブ実行では、guest で実用的なサポート済み QA 認証入力が転送されます。env ベースのプロバイダーキー、QA ライブプロバイダー config パス、および存在する場合の `CODEX_HOME` です。`--output-dir` はリポジトリルート配下に置いて、guest がマウントされた workspace 経由で書き戻せるようにしてください。

## リポジトリに裏打ちされたシード

シードアセットは `qa/` にあります。

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

これらは、QA プランが人間にもエージェントにも見えるように、意図的に git に置かれています。

`qa-lab` は汎用の Markdown ランナーのままであるべきです。各シナリオ Markdown ファイルは
1 回のテスト実行のソースオブトゥルースであり、次を定義する必要があります。

- シナリオメタデータ
- 任意の category、capability、lane、risk メタデータ
- docs とコードの参照
- 任意の Plugin 要件
- 任意の Gateway config パッチ
- 実行可能な `qa-flow`

`qa-flow` を支える再利用可能なランタイムサーフェスは、汎用かつ横断的なままであることが許容されます。たとえば、Markdown シナリオは、トランスポート側ヘルパーと、埋め込み Control UI を Gateway の `browser.request` シーム経由で操作するブラウザー側ヘルパーを組み合わせることができます。特別扱いのランナーを追加する必要はありません。

シナリオファイルは、ソースツリーフォルダーではなく、プロダクト機能ごとにグループ化するべきです。ファイルが移動してもシナリオ ID は安定に保ち、実装の追跡可能性には `docsRefs` と `codeRefs` を使ってください。

ベースライン一覧は、少なくとも次をカバーできるだけの広さを保つべきです。

- DM とチャネルチャット
- スレッド動作
- メッセージアクションのライフサイクル
- Cron コールバック
- memory recall
- モデル切り替え
- サブエージェント handoff
- リポジトリ読み取りとドキュメント読み取り
- Lobster Invaders のような小さなビルドタスク 1 つ

## プロバイダーモックレーン

`qa suite` には 2 つのローカルプロバイダーモックレーンがあります。

- `mock-openai` は、シナリオ認識型の OpenClaw モックです。これは、リポジトリに裏打ちされた QA とパリティゲート向けの、デフォルトの決定論的モックレーンのままです。
- `aimock` は、実験的なプロトコル、フィクスチャ、record/replay、カオスカバレッジのために AIMock ベースのプロバイダーサーバーを起動します。これは追加的なものであり、`mock-openai` シナリオディスパッチャーを置き換えるものではありません。

プロバイダーレーン実装は `extensions/qa-lab/src/providers/` 配下にあります。
各プロバイダーは、そのデフォルト、ローカルサーバー起動、Gateway モデル config、
auth-profile ステージング要件、live/mock の capability フラグを所有します。共有 suite と Gateway コードは、プロバイダー名で分岐するのではなく、プロバイダーレジストリを経由してルーティングするべきです。

## トランスポートアダプター

`qa-lab` は、Markdown QA シナリオ用の汎用トランスポートシームを所有します。
`qa-channel` はそのシーム上の最初のアダプターですが、設計目標はより広く、
将来の実体または合成チャネルも、トランスポート固有の QA ランナーを追加するのではなく、
同じ suite ランナーに接続できるようにすることです。

アーキテクチャレベルでの分担は次のとおりです。

- `qa-lab` は、汎用のシナリオ実行、worker 並列性、アーティファクト書き込み、レポート作成を所有します。
- トランスポートアダプターは、Gateway config、準備完了、受信および送信の観察、トランスポートアクション、正規化されたトランスポート状態を所有します。
- `qa/scenarios/` 配下の Markdown シナリオファイルがテスト実行を定義し、`qa-lab` はそれらを実行する再利用可能なランタイムサーフェスを提供します。

新しいチャネルアダプター向けのメンテナー向け導入ガイダンスは
[Testing](/ja-JP/help/testing#adding-a-channel-to-qa) にあります。

## レポート

`qa-lab` は、観察されたバスタイムラインから Markdown のプロトコルレポートを出力します。
レポートは次に答えるべきです。

- 何が機能したか
- 何が失敗したか
- 何がブロックされたままだったか
- どのフォローアップシナリオを追加する価値があるか

キャラクターとスタイルのチェックについては、同じシナリオを複数のライブモデル
参照で実行し、判定付き Markdown レポートを書き出してください。

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.4,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

このコマンドは Docker ではなく、ローカルの QA Gateway 子プロセスを実行します。character eval
シナリオでは、`SOUL.md` を通じてペルソナを設定し、その後、チャット、workspace ヘルプ、
小さなファイルタスクなどの通常のユーザーターンを実行するべきです。候補モデルには、
評価中であることを知らせてはいけません。このコマンドは各完全な
トランスクリプトを保持し、基本的な実行統計を記録した後、サポートされる場合は
`xhigh` reasoning を伴う fast モードで judge モデルに依頼して、自然さ、雰囲気、ユーモアで実行を順位付けさせます。
プロバイダーを比較する場合は `--blind-judge-models` を使ってください。judge プロンプトは引き続き
すべてのトランスクリプトと実行状態を受け取りますが、候補 ref は `candidate-01` のような
中立ラベルに置き換えられます。レポートは解析後に順位を実際の ref に戻して対応付けます。
候補実行ではデフォルトで `high` thinking を使用し、GPT-5.4 では `medium`、
それをサポートする古い OpenAI eval ref では `xhigh` を使用します。特定の候補を個別に上書きするには
`--model provider/model,thinking=<level>` を使ってください。`--thinking <level>` は引き続き
グローバルなフォールバックを設定し、旧来の `--model-thinking <provider/model=level>` 形式も
互換性のために維持されています。
OpenAI の候補 ref はデフォルトで fast モードを使うため、プロバイダーがサポートしていれば
優先処理が使われます。単一の候補または judge で上書きが必要な場合は、`,fast`、`,no-fast`、または `,fast=false` を個別に追加してください。すべての候補モデルで fast モードを強制的にオンにしたい場合にのみ `--fast` を渡してください。候補と judge の実行時間はベンチマーク分析のためレポートに記録されますが、judge プロンプトでは速度で順位付けしないよう明示されます。
候補モデルと judge モデルの実行は、どちらもデフォルトで並列数 16 です。プロバイダー制限やローカル Gateway の負荷によって実行がうるさくなりすぎる場合は、
`--concurrency` または `--judge-concurrency` を下げてください。
候補 `--model` が渡されない場合、character eval はデフォルトで
`openai/gpt-5.4`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5`、
`google/gemini-3.1-pro-preview` を使います。
`--judge-model` が渡されない場合、judge はデフォルトで
`openai/gpt-5.4,thinking=xhigh,fast` と
`anthropic/claude-opus-4-6,thinking=high` を使います。

## 関連ドキュメント

- [Testing](/ja-JP/help/testing)
- [QA Channel](/ja-JP/channels/qa-channel)
- [ダッシュボード](/ja-JP/web/dashboard)

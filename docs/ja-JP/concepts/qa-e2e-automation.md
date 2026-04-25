---
read_when:
    - qa-labまたはqa-channelの拡張
    - リポジトリに裏付けられたQAシナリオの追加
    - Gatewayダッシュボードを中心とした、より高い現実性を持つQA自動化の構築
summary: qa-lab、qa-channel、シード済みシナリオ、プロトコルレポート向けの非公開QA自動化の構成
title: QA E2E自動化
x-i18n:
    generated_at: "2026-04-25T18:17:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: be2cfc97a33519e0c4263dc7da356136b10ddcbeef436ab821e645688b6b2cfc
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

この非公開QAスタックは、単一のユニットテストよりも、
より現実的でチャネル形状に近い方法でOpenClawを検証することを目的としています。

現在の構成要素:

- `extensions/qa-channel`: DM、チャネル、スレッド、
  リアクション、編集、削除の各サーフェスを持つ合成メッセージチャネル。
- `extensions/qa-lab`: トランスクリプトの観察、
  受信メッセージの注入、Markdownレポートのエクスポートを行うためのデバッガUIとQAバス。
- `qa/`: キックオフタスクとベースラインQA
  シナリオ向けの、リポジトリに裏付けられたシードアセット。

現在のQAオペレーターのフローは、2ペインのQAサイトです。

- 左: agentを表示するGatewayダッシュボード（Control UI）。
- 右: Slack風のトランスクリプトとシナリオ計画を表示するQA Lab。

次のコマンドで実行します。

```bash
pnpm qa:lab:up
```

これによりQAサイトがビルドされ、Dockerベースのgatewayレーンが起動し、
QA Labページが公開されます。ここでオペレーターまたは自動化ループはagentにQA
ミッションを与え、実際のチャネル動作を観察し、何が機能し、何が失敗し、何が
ブロックされたままかを記録できます。

Dockerイメージを毎回再ビルドせずに、より高速にQA Lab UIを反復したい場合は、
バインドマウントされたQA Labバンドルでスタックを起動します。

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` は、Dockerサービスを事前ビルド済みイメージ上で維持しつつ、
`extensions/qa-lab/web/dist` を `qa-lab` コンテナにバインドマウントします。`qa:lab:watch`
は変更時にそのバンドルを再ビルドし、QA Labアセットハッシュが変わるとブラウザは自動再読み込みされます。

実際のトランスポートを使うMatrixスモークレーンを実行するには、次を使います。

```bash
pnpm openclaw qa matrix
```

このレーンは、Docker内に使い捨てのTuwunel homeserverをプロビジョニングし、
一時的なdriver、SUT、observerユーザーを登録し、1つのプライベートルームを作成してから、
実際のMatrix PluginをQA gateway子プロセス内で実行します。ライブトランスポートレーンは、
子設定をテスト対象トランスポートに限定したままにするため、Matrixは子設定内で
`qa-channel` なしで実行されます。構造化レポートアーティファクトと、
結合された stdout/stderr ログは、選択されたMatrix QA出力ディレクトリに書き込まれます。
外側の `scripts/run-node.mjs` のビルド/ランチャー出力も取得するには、
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` をリポジトリローカルのログファイルに設定します。
Matrixの進行状況はデフォルトで出力されます。`OPENCLAW_QA_MATRIX_TIMEOUT_MS` は
実行全体を制限し、`OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` はクリーンアップを制限するため、
Dockerの停止処理がハングした場合でも、処理が止まる代わりに正確な復旧コマンドが報告されます。

実際のトランスポートを使うTelegramスモークレーンを実行するには、次を使います。

```bash
pnpm openclaw qa telegram
```

このレーンは、使い捨てサーバーをプロビジョニングする代わりに、実在する1つのプライベートTelegramグループを対象にします。これには `OPENCLAW_QA_TELEGRAM_GROUP_ID`、
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要で、さらに同じ
プライベートグループ内に2つの異なるbotが必要です。SUT botはTelegram usernameを持っている必要があり、
両方のbotで `@BotFather` 内のBot-to-Bot Communication Modeが有効になっていると、
bot同士の観測が最も安定して動作します。
いずれかのシナリオが失敗すると、このコマンドは非ゼロで終了します。終了コードを失敗にせず
アーティファクトだけ欲しい場合は、`--allow-failures` を使います。
Telegramのレポートとサマリーには、canaryから始まる、driverメッセージ送信リクエストから
観測されたSUT返信までの返信ごとのRTTが含まれます。

プールされたライブ認証情報を使う前に、次を実行します。

```bash
pnpm openclaw qa credentials doctor
```

このdoctorはConvex broker envをチェックし、エンドポイント設定を検証し、
maintainer secretが存在する場合はadmin/list到達性を確認します。secretについては
設定済み/未設定の状態のみを報告します。

実際のトランスポートを使うDiscordスモークレーンを実行するには、次を使います。

```bash
pnpm openclaw qa discord
```

このレーンは、2つのbotを持つ実在する1つのプライベートDiscord guild channelを対象にします。1つは
ハーネスが制御するdriver bot、もう1つはバンドル済みDiscord Pluginを通じて
子OpenClaw gatewayが起動するSUT botです。env認証情報を使う場合、
`OPENCLAW_QA_DISCORD_GUILD_ID`、`OPENCLAW_QA_DISCORD_CHANNEL_ID`、
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`、
`OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` が必要です。
このレーンはチャネルメンション処理を検証し、SUT botがネイティブの `/help` コマンドを
Discordに登録済みであることを確認します。
いずれかのシナリオが失敗すると、このコマンドは非ゼロで終了します。終了コードを失敗にせず
アーティファクトだけ欲しい場合は、`--allow-failures` を使います。

ライブトランスポートレーンは、各レーンが独自のシナリオリスト形状を作る代わりに、
より小さな1つの共通コントラクトを共有するようになりました。

`qa-channel` は引き続き広範な合成プロダクト動作スイートであり、ライブトランスポートの
カバレッジマトリクスには含まれません。

| レーン | Canary | メンションゲート | Allowlist block | トップレベル返信 | 再起動復帰 | スレッドフォローアップ | スレッド分離 | リアクション観測 | Help command | ネイティブコマンド登録 |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              |                 |                 |                |                  |                  |                      |              | x                           |

これにより、`qa-channel` は広範なプロダクト動作スイートとして維持される一方で、Matrix、
Telegram、および将来のライブトランスポートは、明示的な1つのトランスポートコントラクト
チェックリストを共有できます。

QA経路にDockerを持ち込まずに、使い捨てのLinux VMレーンを実行するには、次を使います。

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

これにより、新しいMultipass guestが起動し、依存関係がインストールされ、
guest内でOpenClawがビルドされ、`qa suite` が実行された後、通常のQAレポートと
サマリーがホスト上の `.artifacts/qa-e2e/...` にコピーされます。
シナリオ選択動作は、ホスト上の `qa suite` と同じものを再利用します。
ホストとMultipassのsuite実行では、デフォルトで複数の選択シナリオが分離されたgateway workerで並列実行されます。`qa-channel` のデフォルト並列数は4で、
選択シナリオ数によって上限がかかります。worker数を調整するには `--concurrency <count>` を、
直列実行には `--concurrency 1` を使います。
いずれかのシナリオが失敗すると、このコマンドは非ゼロで終了します。終了コードを失敗にせず
アーティファクトだけ欲しい場合は、`--allow-failures` を使います。
ライブ実行では、guestで実用的なサポート対象QA認証入力が転送されます。envベースのprovider key、
QAライブprovider設定パス、そして存在する場合は `CODEX_HOME` です。guestが
マウントされたワークスペースを通じて書き戻せるよう、`--output-dir` はリポジトリルート配下に保ってください。

## リポジトリに裏付けられたシード

シードアセットは `qa/` にあります。

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

これらは、QA計画が人間とagentの両方から見えるよう、意図的にgit内に置かれています。

`qa-lab` は汎用的なmarkdownランナーのままであるべきです。各シナリオmarkdownファイルは
1回のテスト実行に対する唯一の情報源であり、次を定義する必要があります。

- シナリオメタデータ
- 任意の category、capability、lane、risk メタデータ
- docs と code の参照
- 任意の Plugin 要件
- 任意の gateway config patch
- 実行可能な `qa-flow`

`qa-flow` を支える再利用可能なランタイムサーフェスは、汎用的かつ横断的なままでいて構いません。たとえば、markdownシナリオは、特別扱いのランナーを追加せずに、
Gateway `browser.request` シームを通じて埋め込みControl UIを駆動するブラウザ側ヘルパーと、
トランスポート側ヘルパーを組み合わせることができます。

シナリオファイルはソースツリーのフォルダではなく、プロダクト機能ごとにグループ化するべきです。
ファイルを移動してもシナリオIDは安定したままにし、実装の追跡可能性には `docsRefs` と `codeRefs` を使います。

ベースライン一覧は、次をカバーできる程度に十分広く保つべきです。

- DMとチャネルチャット
- スレッド動作
- メッセージアクションのライフサイクル
- Cron コールバック
- メモリ再呼び出し
- モデル切り替え
- subagentハンドオフ
- リポジトリ読み取りとドキュメント読み取り
- Lobster Invadersのような小さなビルドタスクを1つ

## Providerモックレーン

`qa suite` には2つのローカルproviderモックレーンがあります。

- `mock-openai` は、シナリオ認識型のOpenClawモックです。これは引き続き、
  リポジトリに裏付けられたQAとパリティゲートのためのデフォルトの決定論的モックレーンです。
- `aimock` は、実験的なプロトコル、
  fixture、record/replay、chaos カバレッジのためのAIMockベースproviderサーバーを起動します。これは追加要素であり、`mock-openai` シナリオディスパッチャを置き換えるものではありません。

Providerレーンの実装は `extensions/qa-lab/src/providers/` 配下にあります。
各providerは、自身のデフォルト、ローカルサーバー起動、gateway model config、
auth-profile staging要件、ライブ/モックのcapabilityフラグを所有します。共通のsuiteと
gatewayコードは、provider名で分岐するのではなく、provider registryを通してルーティングする必要があります。

## トランスポートアダプター

`qa-lab` は、markdown QAシナリオ向けの汎用トランスポートシームを所有しています。
`qa-channel` はそのシーム上の最初のアダプターですが、設計上の対象はより広く、
将来の実在または合成チャネルも、トランスポート固有のQAランナーを追加するのではなく、
同じsuiteランナーに組み込まれるべきです。

アーキテクチャ上の分割は次のとおりです。

- `qa-lab` は汎用的なシナリオ実行、worker並列性、アーティファクト書き込み、レポートを所有します。
- トランスポートアダプターはgateway config、準備完了、受信および送信の観測、トランスポートアクション、正規化されたトランスポート状態を所有します。
- `qa/scenarios/` 配下のmarkdownシナリオファイルがテスト実行を定義し、それを実行する再利用可能なランタイムサーフェスは `qa-lab` が提供します。

新しいチャネルアダプター向けの、メンテナー向け導入ガイダンスは
[テスト](/ja-JP/help/testing#adding-a-channel-to-qa) にあります。

## レポート

`qa-lab` は、観測されたバスタイムラインからMarkdownのプロトコルレポートをエクスポートします。
このレポートは次の問いに答えるべきです。

- 何が機能したか
- 何が失敗したか
- 何がブロックされたままだったか
- どのフォローアップシナリオを追加する価値があるか

キャラクターとスタイルのチェックについては、同じシナリオを複数のライブmodel refで実行し、
評価済みのMarkdownレポートを書き出します。

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

このコマンドは、DockerではなくローカルのQA gateway子プロセスを実行します。character eval
シナリオでは、`SOUL.md` を通じてペルソナを設定し、その後、チャット、ワークスペース支援、
小さなファイルタスクなどの通常のユーザーターンを実行する必要があります。候補modelには、
評価中であることを伝えてはいけません。このコマンドは各完全トランスクリプトを保持し、
基本的な実行統計を記録したうえで、対応している場合は `xhigh` 推論を使ったfast modeで
judge modelに対し、自然さ、雰囲気、ユーモアで実行結果を順位付けするよう求めます。
providerを比較する場合は `--blind-judge-models` を使用してください。judge promptには
引き続きすべてのトランスクリプトと実行ステータスが渡されますが、候補refは
`candidate-01` のような中立ラベルに置き換えられます。レポートでは、解析後に順位付けを
実際のrefへ対応付け直します。

候補実行のデフォルトは `high` thinking で、GPT-5.5 では `medium`、それをサポートする
旧OpenAI eval refでは `xhigh` です。特定の候補は
`--model provider/model,thinking=<level>` でインライン上書きできます。`--thinking <level>` は
引き続きグローバルなフォールバックを設定し、古い
`--model-thinking <provider/model=level>` 形式も互換性のため維持されています。

OpenAI候補refは、providerが対応している場合に優先処理が使われるよう、デフォルトでfast modeです。単一の候補またはjudgeに上書きが必要な場合は、インラインで `,fast`、`,no-fast`、
または `,fast=false` を追加してください。すべての候補modelでfast modeを強制的に有効にしたい場合にのみ `--fast` を渡します。候補とjudgeの実行時間はベンチマーク分析のためにレポートへ記録されますが、judge promptでは明示的に速度で順位付けしないよう指示されます。

候補とjudge modelの実行はどちらもデフォルトで並列数16です。provider制限やローカルgateway
負荷によって実行結果のノイズが大きくなる場合は、`--concurrency` または
`--judge-concurrency` を下げてください。

候補 `--model` が渡されない場合、character eval のデフォルトは
`openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5`、および
`google/gemini-3.1-pro-preview` です。

`--judge-model` が渡されない場合、judgeのデフォルトは
`openai/gpt-5.5,thinking=xhigh,fast` と
`anthropic/claude-opus-4-6,thinking=high` です。

## 関連ドキュメント

- [テスト](/ja-JP/help/testing)
- [QA Channel](/ja-JP/channels/qa-channel)
- [ダッシュボード](/ja-JP/web/dashboard)

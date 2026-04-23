---
read_when:
    - qa-lab または qa-channel の拡張
    - リポジトリバックの QA シナリオの追加
    - Gateway ダッシュボードを中心に、より高い現実性の QA 自動化を構築する
summary: qa-lab、qa-channel、シード済みシナリオ、プロトコルレポート向けのプライベート QA 自動化の構成
title: QA E2E 自動化
x-i18n:
    generated_at: "2026-04-23T14:03:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: a967a74d2e70b042e9443c5ec954902b820d2e5a22cbecd9be74af13b9085553
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA E2E 自動化

プライベート QA スタックは、単一のユニットテストよりも、より現実的でチャネル形状に近い方法で OpenClaw を検証することを目的としています。

現在の構成要素:

- `extensions/qa-channel`: DM、チャネル、スレッド、リアクション、編集、削除の画面を備えた合成メッセージチャネル。
- `extensions/qa-lab`: トランスクリプトの観察、受信メッセージの注入、Markdown レポートのエクスポートを行うためのデバッガ UI と QA バス。
- `qa/`: キックオフタスクとベースライン QA シナリオのためのリポジトリバックのシードアセット。

現在の QA オペレーターフローは、2 ペインの QA サイトです。

- 左: エージェントを表示する Gateway ダッシュボード（Control UI）。
- 右: Slack ライクなトランスクリプトとシナリオプランを表示する QA Lab。

実行方法:

```bash
pnpm qa:lab:up
```

これにより QA サイトがビルドされ、Docker バックの gateway lane が起動し、オペレーターまたは自動化ループがエージェントに QA ミッションを与え、実際のチャネル動作を観察し、何が機能したか、失敗したか、ブロックされたままかを記録できる QA Lab ページが公開されます。

毎回 Docker イメージを再ビルドせずに QA Lab UI をより高速に反復したい場合は、bind mount された QA Lab バンドルでスタックを起動します。

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` は、Docker サービスを事前ビルド済みイメージ上で維持しつつ、`extensions/qa-lab/web/dist` を `qa-lab` コンテナに bind mount します。`qa:lab:watch` は変更時にそのバンドルを再ビルドし、QA Lab のアセットハッシュが変わるとブラウザーは自動リロードされます。

転送が実際に行われる Matrix smoke lane を実行するには、次を使います。

```bash
pnpm openclaw qa matrix
```

この lane は、使い捨ての Tuwunel homeserver を Docker でプロビジョニングし、一時的な driver、SUT、observer ユーザーを登録し、1 つのプライベートルームを作成してから、QA gateway child 内で実際の Matrix Plugin を実行します。ライブ転送 lane は child config をテスト対象の転送に限定して保つため、Matrix は child config に `qa-channel` を含めずに実行されます。構造化レポートアーティファクトと、結合された stdout/stderr ログは、選択した Matrix QA 出力ディレクトリに書き込まれます。外側の `scripts/run-node.mjs` のビルド/ランチャー出力も取り込むには、`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` をリポジトリローカルのログファイルに設定してください。

転送が実際に行われる Telegram smoke lane を実行するには、次を使います。

```bash
pnpm openclaw qa telegram
```

この lane は、使い捨てサーバーをプロビジョニングする代わりに、1 つの実在するプライベート Telegram グループを対象にします。`OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要であり、同じプライベートグループ内に 2 つの異なるボットが必要です。SUT ボットには Telegram ユーザー名が必要で、ボット間観測は、両方のボットで `@BotFather` の Bot-to-Bot Communication Mode が有効な場合に最もよく機能します。
いずれかのシナリオが失敗すると、このコマンドは非ゼロで終了します。失敗終了コードなしでアーティファクトだけが必要な場合は `--allow-failures` を使ってください。
Telegram レポートと要約には、canary から始まる、driver メッセージ送信リクエストから観測された SUT 返信までの返信ごとの RTT が含まれます。

ライブ転送 lane は、各 lane が独自のシナリオ一覧形式を発明するのではなく、より小さな 1 つの共有契約を使うようになりました。

`qa-channel` は引き続き広範な合成プロダクト動作スイートであり、ライブ転送カバレッジマトリクスには含まれません。

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

これにより、`qa-channel` は広範なプロダクト動作スイートとして維持される一方で、Matrix、Telegram、および今後のライブ転送は、1 つの明示的な転送契約チェックリストを共有します。

QA パスに Docker を持ち込まずに、使い捨て Linux VM lane を実行するには、次を使います。

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

これにより、新しい Multipass guest が起動され、依存関係がインストールされ、guest 内で OpenClaw がビルドされ、`qa suite` が実行され、その後通常の QA レポートと要約が host 上の `.artifacts/qa-e2e/...` にコピーされます。
シナリオ選択動作は、host 上の `qa suite` と同じものが再利用されます。
host と Multipass の suite 実行は、既定で、分離された gateway worker を使って複数の選択済みシナリオを並列実行します。`qa-channel` の既定並列数は 4 で、選択したシナリオ数が上限です。worker 数を調整するには `--concurrency <count>`、直列実行には `--concurrency 1` を使ってください。
いずれかのシナリオが失敗すると、このコマンドは非ゼロで終了します。失敗終了コードなしでアーティファクトだけが必要な場合は `--allow-failures` を使ってください。
ライブ実行では、guest に対して実用的なサポート済み QA 認証入力、つまり env ベースの provider key、QA ライブ provider config パス、および存在する場合の `CODEX_HOME` が転送されます。guest が mount 済みワークスペース経由で書き戻せるように、`--output-dir` はリポジトリルート配下に置いてください。

## リポジトリバックのシード

シードアセットは `qa/` にあります。

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

これらは意図的に git に置かれており、QA プランが人間とエージェントの両方に見えるようになっています。

`qa-lab` は汎用の Markdown ランナーのままであるべきです。各シナリオ Markdown ファイルは 1 回のテスト実行の唯一の情報源であり、次を定義すべきです。

- シナリオメタデータ
- 任意の category、capability、lane、risk メタデータ
- docs と code の参照
- 任意の Plugin 要件
- 任意の gateway config patch
- 実行可能な `qa-flow`

`qa-flow` を支える再利用可能なランタイム画面は、汎用かつ横断的なままで構いません。たとえば、Markdown シナリオは、`browser.request` seam を通じて埋め込み Control UI を操作するブラウザー側ヘルパーと転送側ヘルパーを組み合わせることができ、特別扱いのランナーを追加する必要はありません。

シナリオファイルは、ソースツリーフォルダーではなく、プロダクト機能ごとにグループ化すべきです。ファイルが移動してもシナリオ ID は安定させ、実装のトレーサビリティには `docsRefs` と `codeRefs` を使ってください。

ベースライン一覧は、次をカバーするのに十分広いままであるべきです。

- DM とチャネルチャット
- スレッド動作
- メッセージアクションのライフサイクル
- Cron コールバック
- メモリ想起
- モデル切り替え
- subagent handoff
- リポジトリ読み取りとドキュメント読み取り
- Lobster Invaders のような小さなビルドタスク 1 件

## provider mock lane

`qa suite` には 2 つのローカル provider mock lane があります。

- `mock-openai` はシナリオ対応の OpenClaw mock です。リポジトリバック QA と parity gate 向けの既定の決定的 mock lane のままです。
- `aimock` は、実験的なプロトコル、fixture、record/replay、chaos カバレッジ向けに AIMock バックの provider サーバーを起動します。これは追加的なものであり、`mock-openai` シナリオディスパッチャーを置き換えるものではありません。

provider lane の実装は `extensions/qa-lab/src/providers/` 配下にあります。各 provider は、既定値、ローカルサーバー起動、gateway model config、auth-profile staging 要件、および live/mock capability flags を所有します。共有 suite および gateway コードは、provider 名で分岐するのではなく、provider registry を経由してルーティングすべきです。

## 転送アダプター

`qa-lab` は Markdown QA シナリオ向けの汎用転送 seam を所有します。
`qa-channel` はその seam 上の最初のアダプターですが、設計目標はより広く、将来の実在または合成チャネルも、転送専用の QA ランナーを追加するのではなく、同じ suite runner に接続できるようにすることです。

アーキテクチャレベルでは、分割は次のとおりです。

- `qa-lab` は、汎用シナリオ実行、worker 並列実行、アーティファクト書き込み、レポート作成を所有します。
- 転送アダプターは、gateway config、準備完了、受信と送信の観察、転送アクション、正規化済み転送状態を所有します。
- `qa/scenarios/` 配下の Markdown シナリオファイルがテスト実行を定義し、`qa-lab` はそれを実行する再利用可能ランタイム画面を提供します。

新しいチャネルアダプター向けの maintainer 向け導入ガイダンスは [Testing](/ja-JP/help/testing#adding-a-channel-to-qa) にあります。

## レポート

`qa-lab` は、観測されたバスタイムラインから Markdown のプロトコルレポートをエクスポートします。
レポートは次に答えるべきです。

- 何が機能したか
- 何が失敗したか
- 何がブロックされたままだったか
- どのフォローアップシナリオを追加する価値があるか

キャラクターとスタイルのチェックには、同じシナリオを複数の live model ref で実行し、評価済み Markdown レポートを書き出します。

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=xhigh \
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

このコマンドは Docker ではなく、ローカルの QA gateway child process を実行します。character eval シナリオは `SOUL.md` を通じて persona を設定し、その後チャット、ワークスペース支援、小さなファイルタスクのような通常のユーザーターンを実行すべきです。候補モデルには、それが評価されていることを伝えるべきではありません。このコマンドは各完全トランスクリプトを保持し、基本的な実行統計を記録したうえで、judge model に fast mode と `xhigh` reasoning で実行の自然さ、雰囲気、ユーモアに基づく順位付けを依頼します。
provider を比較する場合は `--blind-judge-models` を使ってください。judge prompt は引き続きすべてのトランスクリプトと実行状態を受け取りますが、候補 ref は `candidate-01` のような中立ラベルに置き換えられます。レポートは解析後に順位を実際の ref に戻して対応付けます。
候補実行の既定は `high` thinking で、対応する OpenAI モデルでは `xhigh` です。特定候補を個別指定するには `--model provider/model,thinking=<level>` を使ってください。`--thinking <level>` は引き続きグローバルなフォールバックを設定し、古い `--model-thinking <provider/model=level>` 形式も互換性のため維持されています。
OpenAI 候補 ref は、provider が対応している場合に優先処理が使われるよう、既定で fast mode です。単一候補または judge だけ上書きしたい場合は、個別指定で `,fast`、`,no-fast`、または `,fast=false` を追加してください。すべての候補モデルで fast mode を強制したい場合にのみ `--fast` を渡してください。候補および judge の実行時間はベンチマーク分析のためにレポートへ記録されますが、judge prompt では速度で順位付けしないよう明示されます。
候補モデルと judge model の実行は、どちらも既定で並列数 16 です。provider 制限またはローカル gateway 負荷によって実行がうるさすぎる場合は、`--concurrency` または `--judge-concurrency` を下げてください。
候補 `--model` が渡されない場合、character eval の既定は `openai/gpt-5.4`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、`moonshot/kimi-k2.5`、`google/gemini-3.1-pro-preview` です。
judge `--judge-model` が渡されない場合、judge の既定は `openai/gpt-5.4,thinking=xhigh,fast` と `anthropic/claude-opus-4-6,thinking=high` です。

## 関連ドキュメント

- [Testing](/ja-JP/help/testing)
- [QA Channel](/ja-JP/channels/qa-channel)
- [Dashboard](/ja-JP/web/dashboard)

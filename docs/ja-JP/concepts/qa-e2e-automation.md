---
read_when:
    - qa-labまたはqa-channelの拡張
    - リポジトリに裏付けられたQAシナリオの追加
    - Gatewayダッシュボードを中心とした、より現実性の高いQA自動化の構築
summary: qa-lab、qa-channel、シード済みシナリオ、プロトコルレポート向けの非公開QA自動化の構成
title: QA E2E自動化
x-i18n:
    generated_at: "2026-04-10T04:43:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 357d6698304ff7a8c4aa8a7be97f684d50f72b524740050aa761ac0ee68266de
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# QA E2E自動化

非公開QAスタックは、単一のユニットテストではできない、より現実的でチャネルに即した形でOpenClawを検証することを目的としています。

現在の構成要素:

- `extensions/qa-channel`: DM、チャネル、スレッド、リアクション、編集、削除の各サーフェスを備えた合成メッセージチャネル。
- `extensions/qa-lab`: トランスクリプトの観察、受信メッセージの注入、Markdownレポートのエクスポートを行うためのデバッガUIとQAバス。
- `qa/`: キックオフタスクとベースラインQAシナリオ向けの、リポジトリに裏付けられたシードアセット。

現在のQAオペレーターフローは2ペインのQAサイトです:

- 左: エージェントを表示するGatewayダッシュボード（Control UI）。
- 右: Slack風のトランスクリプトとシナリオ計画を表示するQA Lab。

次のコマンドで実行します:

```bash
pnpm qa:lab:up
```

これによりQAサイトがビルドされ、Dockerベースのgatewayレーンが起動し、オペレーターまたは自動化ループがエージェントにQAミッションを与え、実際のチャネル動作を観察し、何が機能したか、何が失敗したか、何がブロックされたままだったかを記録できるQA Labページが公開されます。

Dockerイメージを毎回再ビルドせずにQA Lab UIをより高速に反復したい場合は、バインドマウントされたQA Labバンドルでスタックを起動します:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` は、事前ビルド済みイメージ上でDockerサービスを維持しつつ、`extensions/qa-lab/web/dist` を `qa-lab` コンテナにバインドマウントします。`qa:lab:watch` は変更時にそのバンドルを再ビルドし、QA Labのアセットハッシュが変わるとブラウザは自動リロードされます。

DockerをQAパスに持ち込まない使い捨てのLinux VMレーンでは、次を実行します:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

これにより新しいMultipassゲストが起動し、依存関係がインストールされ、ゲスト内でOpenClawがビルドされ、`qa suite` が実行された後、通常のQAレポートとサマリーがホスト上の `.artifacts/qa-e2e/...` にコピーされます。
ホスト上の `qa suite` と同じシナリオ選択動作を再利用します。
ライブ実行では、ゲストで実用的な対応済みQA認証入力、つまり環境変数ベースのプロバイダーキー、QAライブプロバイダー設定パス、存在する場合は `CODEX_HOME` が転送されます。ゲストがマウントされたワークスペース経由で書き戻せるように、`--output-dir` はリポジトリルート配下に保ってください。

## リポジトリに裏付けられたシード

シードアセットは `qa/` にあります:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

これらは、QA計画が人間にもエージェントにも見えるよう、意図的にgitに含められています。ベースライン一覧は、次をカバーできる程度に十分広く保つべきです:

- DMとチャネルチャット
- スレッド動作
- メッセージアクションのライフサイクル
- cronコールバック
- メモリーの再想起
- モデル切り替え
- サブエージェントのハンドオフ
- リポジトリ読み取りとドキュメント読み取り
- Lobster Invadersのような小さなビルドタスク1件

## レポート

`qa-lab` は、観察されたバスタイムラインからMarkdownのプロトコルレポートをエクスポートします。
レポートでは次に答える必要があります:

- 何が機能したか
- 何が失敗したか
- 何がブロックされたままだったか
- どのフォローアップシナリオを追加する価値があるか

キャラクターとスタイルのチェックでは、同じシナリオを複数のライブモデル参照で実行し、評価済みのMarkdownレポートを書き出します:

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

このコマンドはDockerではなく、ローカルのQA gateway子プロセスを実行します。character evalシナリオでは、`SOUL.md` を通じてペルソナを設定し、その後にチャット、ワークスペース支援、小規模なファイルタスクなどの通常のユーザーターンを実行する必要があります。候補モデルには、それが評価されていることを知らせてはいけません。コマンドは各完全なトランスクリプトを保持し、基本的な実行統計を記録した後、自然さ、雰囲気、ユーモアに基づいて実行結果を順位付けするよう、高速モードで `xhigh` 推論を使ってjudgeモデルに依頼します。
プロバイダーを比較する際は `--blind-judge-models` を使ってください。judgeプロンプトには依然としてすべてのトランスクリプトと実行ステータスが渡されますが、候補参照は `candidate-01` のような中立ラベルに置き換えられます。レポートは解析後に順位を実際の参照へ再マッピングします。
候補実行のデフォルトは `high` thinking で、対応しているOpenAIモデルでは `xhigh` になります。特定の候補を上書きするには、`--model provider/model,thinking=<level>` をインラインで指定します。`--thinking <level>` は引き続きグローバルなフォールバックを設定し、古い `--model-thinking <provider/model=level>` 形式も互換性のため維持されています。
OpenAI候補参照はデフォルトで高速モードになっており、プロバイダーが対応している場合は優先処理が使われます。単一の候補またはjudgeで上書きが必要な場合は、`,fast`、`,no-fast`、または `,fast=false` をインラインで追加してください。すべての候補モデルで高速モードを強制的に有効にしたい場合にのみ `--fast` を渡してください。候補とjudgeの所要時間はベンチマーク分析のためレポートに記録されますが、judgeプロンプトでは速度で順位付けしないよう明示されています。
候補実行とjudgeモデル実行は、どちらもデフォルトで同時実行数16です。プロバイダー制限やローカルgateway負荷によって実行がノイジーになりすぎる場合は、`--concurrency` または `--judge-concurrency` を下げてください。
候補 `--model` が渡されない場合、character evalのデフォルトは `openai/gpt-5.4`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、`moonshot/kimi-k2.5`、`google/gemini-3.1-pro-preview` です。
`--judge-model` が渡されない場合、judgeのデフォルトは `openai/gpt-5.4,thinking=xhigh,fast` と `anthropic/claude-opus-4-6,thinking=high` です。

## 関連ドキュメント

- [Testing](/ja-JP/help/testing)
- [QA Channel](/ja-JP/channels/qa-channel)
- [Dashboard](/web/dashboard)

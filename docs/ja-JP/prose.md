---
read_when:
    - .prose ワークフローファイルを実行または作成する場合
    - OpenProse Pluginを有効にする場合
    - OpenProse が OpenClaw のプリミティブにどのように対応付けられるかを理解する必要があります
sidebarTitle: OpenProse
summary: OpenProse は、マルチエージェント AI セッション向けの Markdown ファーストなワークフロー形式です。OpenClaw では、`/prose` スラッシュコマンドとスキルパックを備えた Plugin として提供されます。
title: OpenProse
x-i18n:
    generated_at: "2026-07-11T22:35:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b04eb23bf827fbec6db11c1e95993e7f6c617451c5f4fda771ad078674c12bc
    source_path: prose.md
    workflow: 16
---

OpenProse は、AI セッションをオーケストレーションするための、移植可能な Markdown ファーストのワークフロー形式です。OpenClaw では、OpenProse の Skills パックと `/prose` スラッシュコマンドをインストールする Plugin として提供されます。プログラムは `.prose` ファイルに記述し、明示的な制御フローで複数のサブエージェントを起動できます。

<CardGroup cols={3}>
  <Card title="インストール" icon="download" href="#install">
    OpenProse Plugin を有効にして、Gateway を再起動します。
  </Card>
  <Card title="プログラムを実行" icon="play" href="#slash-command">
    `/prose run` を使用して、`.prose` ファイルまたはリモートプログラムを実行します。
  </Card>
  <Card title="プログラムを作成" icon="pencil" href="#example-parallel-research-and-synthesis">
    並列および逐次ステップを使用するマルチエージェントワークフローを作成します。
  </Card>
</CardGroup>

## インストール

<Steps>
  <Step title="Plugin を有効にする">
    OpenProse は同梱されていますが、デフォルトでは無効です。次のコマンドで有効にします。

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="Gateway を再起動する">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="確認する">
    ```bash
    openclaw plugins list | grep prose
    ```

    `open-prose` が有効になっていることを確認します。これで、チャットで `/prose` Skills コマンドを使用できます。

  </Step>
</Steps>

リポジトリのチェックアウトから Plugin を直接インストールすることもできます。
`openclaw plugins install ./extensions/open-prose`

## スラッシュコマンド

OpenProse は、ユーザーが呼び出せる Skills コマンドとして `/prose` を登録します。

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

`/prose run <handle/slug>` は `https://p.prose.md/<handle>/<slug>` に解決されます。直接指定した URL は、`web_fetch` ツールを使用してそのまま取得されます。

トップレベルのリモート実行は明示的に行います。`.prose` プログラム内のリモートインポートは推移的なコード依存関係です。OpenProse はリモートの `use` ターゲットを取得する前に、解決済みのインポート一覧を表示し、その実行についてオペレーターが正確に `approve remote prose imports` と返信することを要求します。

## できること

- 明示的な並列処理によるマルチエージェントの調査と統合。
- 反復可能で承認によって安全性を確保したワークフロー（コードレビュー、インシデントのトリアージ、コンテンツパイプライン）。
- サポートされているエージェントランタイム間で実行できる、再利用可能な `.prose` プログラム。

## 例：並列調査と統合

```prose
# Research + synthesis with two agents running in parallel.

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
  context: { findings, draft }
```

## OpenClaw ランタイムへの対応付け

OpenProse プログラムは、OpenClaw の基本要素に次のように対応します。

| OpenProse の概念           | OpenClaw ツール                                  |
| ------------------------- | ----------------------------------------------- |
| セッションの起動 / Task ツール | `sessions_spawn`                                |
| ファイルの読み取り / 書き込み | `read` / `write`                                |
| Web 取得                   | `web_fetch`（POST が必要な場合は `exec` + curl） |

<Warning>
  ツールの許可リストで `sessions_spawn`、`read`、`write`、または
  `web_fetch` がブロックされている場合、OpenProse プログラムは失敗します。
  [ツール許可リストの設定](/ja-JP/gateway/config-tools)を確認してください。
</Warning>

## ファイルの場所

OpenProse は、ワークスペース内の `.prose/` 以下に状態を保持します。

```text
.prose/
├── .env                      # config (key=value), e.g. OPENPROSE_POSTGRES_URL
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose     # copy of the running program
│       ├── state.md          # execution state
│       ├── bindings/
│       ├── imports/          # nested remote program runs
│       └── agents/
└── agents/                   # project-scoped persistent agents
```

プロジェクト間で共有されるユーザーレベルの永続エージェントは、次の場所に保存されます。

```text
~/.prose/agents/
```

## 状態バックエンド

<AccordionGroup>
  <Accordion title="ファイルシステム（デフォルト）">
    状態は、ワークスペース内の `.prose/runs/...` に書き込まれます。追加の依存関係は必要ありません。
  </Accordion>
  <Accordion title="コンテキスト内">
    一時的な状態をコンテキストウィンドウに保持します。`--in-context` で選択します。
    小規模で短時間のプログラムに適しています。
  </Accordion>
  <Accordion title="sqlite（実験的）">
    `--state=sqlite` で選択します。`PATH` 上に `sqlite3` バイナリが必要です
    （存在しない場合はファイルシステムにフォールバックします）。状態は
    `.prose/runs/{id}/state.db` に保存されます。
  </Accordion>
  <Accordion title="postgres（実験的）">
    `--state=postgres` で選択します。`psql` と、`OPENPROSE_POSTGRES_URL`
    に指定した接続文字列が必要です（`.prose/.env` に設定します）。

    <Warning>
      Postgres の認証情報はサブエージェントのログに記録されます。専用の最小権限データベースを使用してください。
    </Warning>

  </Accordion>
</AccordionGroup>

## セキュリティ

`.prose` ファイルはコードとして扱ってください。リモートの `use` インポートを含め、実行前に内容を確認してください。トップレベルの `/prose run https://...` リクエストは明示的に実行されますが、推移的なリモートインポートは、取得または実行される前に実行ごとの承認が必要です。副作用を制御するには、OpenClaw のツール許可リストと承認ゲートを使用してください。決定的で承認ゲート付きのワークフローについては、[Lobster](/ja-JP/tools/lobster)と比較してください。

## 関連項目

<CardGroup cols={2}>
  <Card title="Skills リファレンス" href="/ja-JP/tools/skills" icon="puzzle-piece">
    OpenProse の Skills パックが読み込まれる仕組みと、適用されるゲートについて説明します。
  </Card>
  <Card title="サブエージェント" href="/ja-JP/tools/subagents" icon="users">
    OpenClaw ネイティブのマルチエージェント連携レイヤーです。
  </Card>
  <Card title="テキスト読み上げ" href="/ja-JP/tools/tts" icon="volume-high">
    ワークフローに音声出力を追加します。
  </Card>
  <Card title="スラッシュコマンド" href="/ja-JP/tools/slash-commands" icon="terminal">
    `/prose` を含む、利用可能なすべてのチャットコマンドです。
  </Card>
</CardGroup>

公式サイト：[https://www.prose.md](https://www.prose.md)

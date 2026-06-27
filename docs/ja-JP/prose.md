---
read_when:
    - .prose ワークフローファイルを実行または作成したい
    - OpenProse Pluginを有効にする必要があります
    - OpenProse が OpenClaw のプリミティブにどのように対応するかを理解する必要があります
sidebarTitle: OpenProse
summary: OpenProse は、マルチエージェント AI セッション向けの Markdown ファーストなワークフロー形式です。OpenClaw では、/prose スラッシュコマンドと skill pack を備えた plugin として提供されます。
title: OpenProse
x-i18n:
    generated_at: "2026-06-27T12:38:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde819215f99055c2a83ec32ed6e0700994654ca2d1d9c9dda98b71545f8a012
    source_path: prose.md
    workflow: 16
---

OpenProse は、AI セッションをオーケストレーションするためのポータブルな Markdown ファーストのワークフロー形式です。OpenClaw では、OpenProse skill
pack と `/prose` スラッシュコマンドをインストールする Plugin として提供されます。プログラムは `.prose` ファイルに置かれ、明示的な制御フローで複数のサブエージェントを起動できます。

<CardGroup cols={3}>
  <Card title="インストール" icon="download" href="#install">
    OpenProse Plugin を有効にし、Gateway を再起動します。
  </Card>
  <Card title="プログラムを実行" icon="play" href="#slash-command">
    `/prose run` を使って `.prose` ファイルまたはリモートプログラムを実行します。
  </Card>
  <Card title="プログラムを書く" icon="pencil" href="#example">
    並列ステップと順次ステップを使ってマルチエージェントワークフローを作成します。
  </Card>
</CardGroup>

## インストール

<Steps>
  <Step title="Plugin を有効にする">
    バンドル済み Plugin はデフォルトで無効です。OpenProse を有効にします。

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="Gateway を再起動する">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="検証する">
    ```bash
    openclaw plugins list | grep prose
    ```

    `open-prose` が有効として表示されるはずです。`/prose` skill コマンドがチャットで利用可能になります。

  </Step>
</Steps>

ローカルチェックアウトの場合: `openclaw plugins install ./path/to/local/open-prose-plugin`

## スラッシュコマンド

OpenProse は `/prose` を、ユーザーが呼び出せる skill コマンドとして登録します。

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

`/prose run <handle/slug>` は `https://p.prose.md/<handle>/<slug>` に解決されます。
直接 URL は `web_fetch` ツールを使ってそのまま取得されます。

トップレベルのリモート実行は明示的です。`.prose` プログラム内のリモートインポートは推移的なコード依存関係です。OpenProse がリモートの `use` ターゲットを取得する前に、解決済みインポート一覧を表示し、その実行についてオペレーターが正確に `approve remote prose imports` と返信することを要求します。

## できること

- 明示的な並列性を備えたマルチエージェントの調査と統合。
- 繰り返し可能で承認安全なワークフロー（コードレビュー、インシデントトリアージ、コンテンツパイプライン）。
- サポート対象のエージェントランタイム間で実行できる再利用可能な `.prose` プログラム。

## 例: 並列調査と統合

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

## OpenClaw ランタイムの対応

OpenProse プログラムは OpenClaw プリミティブに対応します。

| OpenProse の概念         | OpenClaw ツール    |
| ------------------------- | ---------------- |
| セッション起動 / Task ツール | `sessions_spawn` |
| ファイル読み取り / 書き込み         | `read` / `write` |
| Web 取得                 | `web_fetch`      |

<Warning>
  ツール許可リストが `sessions_spawn`、`read`、`write`、または
  `web_fetch` をブロックしている場合、OpenProse プログラムは失敗します。
  [ツール許可リスト設定](/ja-JP/gateway/config-tools)を確認してください。
</Warning>

## ファイルの場所

OpenProse はワークスペース内の `.prose/` に状態を保持します。

```text
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

ユーザーレベルの永続エージェントは次に配置されます。

```text
~/.prose/agents/
```

## 状態バックエンド

<AccordionGroup>
  <Accordion title="filesystem（デフォルト）">
    状態はワークスペース内の `.prose/runs/...` に書き込まれます。追加の依存関係は不要です。
  </Accordion>
  <Accordion title="in-context">
    コンテキストウィンドウ内に保持される一時的な状態です。小規模で短命なプログラムに適しています。
  </Accordion>
  <Accordion title="sqlite（実験的）">
    `PATH` 上に `sqlite3` バイナリが必要です。
  </Accordion>
  <Accordion title="postgres（実験的）">
    `psql` と接続文字列が必要です。

    <Warning>
      Postgres 認証情報はサブエージェントのログに流れます。専用の最小権限データベースを使用してください。
    </Warning>

  </Accordion>
</AccordionGroup>

## セキュリティ

`.prose` ファイルはコードのように扱ってください。リモートの `use` インポートを含め、実行前にレビューしてください。トップレベルの `/prose run https://...` リクエストは明示的ですが、推移的なリモートインポートは、取得または実行される前に実行ごとの承認が必要です。OpenClaw のツール許可リストと承認ゲートを使って副作用を制御してください。決定論的で承認ゲート付きのワークフローについては、[Lobster](/ja-JP/tools/lobster) と比較してください。

## 関連

<CardGroup cols={2}>
  <Card title="Skills リファレンス" href="/ja-JP/tools/skills" icon="puzzle-piece">
    OpenProse の skill pack がどのように読み込まれ、どのゲートが適用されるか。
  </Card>
  <Card title="サブエージェント" href="/ja-JP/tools/subagents" icon="users">
    OpenClaw のネイティブなマルチエージェント調整レイヤー。
  </Card>
  <Card title="テキスト読み上げ" href="/ja-JP/tools/tts" icon="volume-high">
    ワークフローに音声出力を追加します。
  </Card>
  <Card title="スラッシュコマンド" href="/ja-JP/tools/slash-commands" icon="terminal">
    /prose を含む、利用可能なすべてのチャットコマンド。
  </Card>
</CardGroup>

公式サイト: [https://www.prose.md](https://www.prose.md)

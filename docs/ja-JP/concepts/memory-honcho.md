---
read_when:
    - セッションやチャネルをまたいで機能する永続メモリが必要な場合
    - AIを活用した記憶の想起とユーザーモデリングが必要な場合
summary: Honcho PluginによるAIネイティブなセッション横断メモリ
title: Honchoメモリ
x-i18n:
    generated_at: "2026-07-11T22:06:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fadcf6d8e2505ab4fe6a81340695b7c8fee49c3cb4889665af13389941619117
    source_path: concepts/memory-honcho.md
    workflow: 16
---

[Honcho](https://honcho.dev) は、外部 Plugin を通じて OpenClaw に AI ネイティブなメモリを追加します。専用サービスに会話を永続化し、時間をかけてユーザーとエージェントのモデルを構築することで、ワークスペースの Markdown ファイルを超えたセッション横断コンテキストをエージェントに提供します。

## 提供される機能

- **セッション横断メモリ** - 会話は各ターンの後に永続化されるため、セッションのリセット、Compaction、チャンネルの切り替えをまたいでコンテキストが引き継がれます。
- **ユーザーモデリング** - Honcho は、各ユーザーのプロファイル（設定、事実、コミュニケーションスタイル）と、エージェントのプロファイル（人格、学習した振る舞い）を維持します。
- **セマンティック検索** - 現在のセッションだけでなく、過去の会話から得られた観察結果を検索します。
- **マルチエージェント認識** - 親エージェントは生成したサブエージェントを自動的に追跡し、子セッションでは親がオブザーバーとして追加されます。

## 利用可能なツール

Honcho は、会話中にエージェントが使用できるツールを登録します。

**データ取得（高速、LLM 呼び出しなし）：**

| ツール                      | 機能                                                   |
| --------------------------- | ------------------------------------------------------ |
| `honcho_context`            | セッションを横断した完全なユーザー表現                 |
| `honcho_search_conclusions` | 保存された結論に対するセマンティック検索               |
| `honcho_search_messages`    | セッションを横断してメッセージを検索（送信者、日付で絞り込み） |
| `honcho_session`            | 現在のセッション履歴と要約                             |

**Q&A（LLM を使用）：**

| ツール       | 機能                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------- |
| `honcho_ask` | ユーザーについて質問します。事実の確認には `depth='quick'`、統合的な分析には `'thorough'` を使用します |

## はじめに

Plugin をインストールしてセットアップを実行します。

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

セットアップコマンドでは API 認証情報の入力を求め、設定を書き込み、必要に応じて既存のワークスペースメモリファイルを移行します。

<Info>
Honcho は、完全にローカル（セルフホスト）で実行することも、`api.honcho.dev` のマネージド API を介して実行することもできます。セルフホストのオプションでは外部依存関係は必要ありません。
</Info>

## 設定

設定は `plugins.entries["openclaw-honcho"].config` にあります。

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // omit for self-hosted
          workspaceId: "openclaw", // memory isolation
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

セルフホストのインスタンスでは、`baseUrl` にローカルサーバー（たとえば `http://localhost:8000`）を指定し、API キーを省略します。

## 既存メモリの移行

既存のワークスペースメモリファイル（`USER.md`、`MEMORY.md`、`IDENTITY.md`、`memory/`、`canvas/`）がある場合、`openclaw honcho setup` がそれらを検出し、移行を提案します。

<Info>
移行は非破壊的です。ファイルは Honcho にアップロードされ、元のファイルが削除または移動されることはありません。
</Info>

## 仕組み

AI の各ターン後に、会話が Honcho に永続化されます。ユーザーとエージェントの両方のメッセージが観察されるため、Honcho は時間をかけてモデルを構築し、洗練できます。

会話中、Honcho ツールは OpenClaw の `before_prompt_build` Plugin フックでサービスに問い合わせ、モデルがプロンプトを受け取る前に関連するコンテキストを注入します。

## Honcho と組み込みメモリの比較

|                   | 組み込み / QMD                       | Honcho                                |
| ----------------- | ------------------------------------ | ------------------------------------- |
| **ストレージ**    | ワークスペースの Markdown ファイル   | 専用サービス（ローカルまたはホスト型） |
| **セッション横断** | メモリファイル経由                   | 自動、組み込み                         |
| **ユーザーモデリング** | 手動（MEMORY.md に書き込み）     | 自動プロファイル                       |
| **検索**          | ベクトル + キーワード（ハイブリッド） | 観察結果に対するセマンティック検索     |
| **マルチエージェント** | 追跡なし                         | 親子関係の認識                         |
| **依存関係**      | なし（組み込み）または QMD バイナリ  | Plugin のインストール                  |

Honcho と組み込みメモリシステムは併用できます。QMD が設定されている場合、Honcho のセッション横断メモリと併せてローカルの Markdown ファイルを検索するための追加ツールが利用可能になります。

## CLI コマンド

```bash
openclaw honcho setup                        # Configure API key and migrate files
openclaw honcho status                       # Check connection status
openclaw honcho ask <question>               # Query Honcho about the user
openclaw honcho search <query> [-k N] [-d D] # Semantic search over memory
```

## 関連資料

- [Plugin のソースコード](https://github.com/plastic-labs/openclaw-honcho)
- [Honcho ドキュメント](https://docs.honcho.dev)
- [Honcho OpenClaw 統合ガイド](https://docs.honcho.dev/v3/guides/integrations/openclaw)

## 関連項目

- [メモリの概要](/ja-JP/concepts/memory)
- [組み込みメモリエンジン](/ja-JP/concepts/memory-builtin)
- [QMD メモリエンジン](/ja-JP/concepts/memory-qmd)
- [コンテキストエンジン](/ja-JP/concepts/context-engine)

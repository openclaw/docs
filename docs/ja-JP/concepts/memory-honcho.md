---
read_when:
    - セッションやチャネルをまたいで機能する永続メモリが必要な場合
    - AI による想起とユーザーモデリングを利用したい
summary: Honcho plugin による AI ネイティブなクロスセッションメモリ
title: Honcho メモリ
x-i18n:
    generated_at: "2026-07-05T11:13:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fadcf6d8e2505ab4fe6a81340695b7c8fee49c3cb4889665af13389941619117
    source_path: concepts/memory-honcho.md
    workflow: 16
---

[Honcho](https://honcho.dev) は、外部Pluginを通じてOpenClawにAIネイティブなメモリを追加します。会話を専用サービスに永続化し、時間をかけてユーザーとエージェントのモデルを構築することで、ワークスペースのMarkdownファイルを超えたセッション横断コンテキストをエージェントに提供します。

## 提供内容

- **セッション横断メモリ** - 会話は各ターン後に永続化されるため、セッションのリセット、Compaction、チャネル切り替えをまたいでコンテキストが引き継がれます。
- **ユーザーモデリング** - Honchoは各ユーザーのプロファイル（設定、事実、コミュニケーションスタイル）と、エージェントのプロファイル（人格、学習された振る舞い）を維持します。
- **セマンティック検索** - 現在のセッションだけでなく、過去の会話からの観測内容を検索します。
- **マルチエージェント認識** - 親エージェントは生成されたサブエージェントを自動的に追跡し、子セッションには親がオブザーバーとして追加されます。

## 利用可能なツール

Honchoは、エージェントが会話中に使用できるツールを登録します。

**データ取得（高速、LLM呼び出しなし）:**

| ツール                      | 機能                                                   |
| --------------------------- | ------------------------------------------------------ |
| `honcho_context`            | セッションを横断した完全なユーザー表現                 |
| `honcho_search_conclusions` | 保存された結論に対するセマンティック検索               |
| `honcho_search_messages`    | セッションを横断してメッセージを検索（送信者、日付で絞り込み） |
| `honcho_session`            | 現在のセッション履歴と要約                             |

**Q&A（LLM駆動）:**

| ツール       | 機能                                                                 |
| ------------ | -------------------------------------------------------------------- |
| `honcho_ask` | ユーザーについて質問します。事実には `depth='quick'`、統合には `'thorough'` |

## はじめに

Pluginをインストールしてセットアップを実行します。

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

セットアップコマンドはAPI認証情報の入力を求め、設定を書き込み、必要に応じて既存のワークスペースメモリファイルを移行します。

<Info>
Honchoは完全にローカル（セルフホスト）で実行することも、`api.honcho.dev` のマネージドAPI経由で実行することもできます。セルフホストオプションでは外部依存関係は不要です。
</Info>

## 設定

設定は `plugins.entries["openclaw-honcho"].config` 配下にあります。

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

セルフホストインスタンスでは、`baseUrl` をローカルサーバー（例: `http://localhost:8000`）に向け、APIキーは省略します。

## 既存メモリの移行

既存のワークスペースメモリファイル（`USER.md`、`MEMORY.md`、`IDENTITY.md`、`memory/`、`canvas/`）がある場合、`openclaw honcho setup` が検出して移行を提案します。

<Info>
移行は非破壊的です - ファイルはHonchoにアップロードされます。元のファイルが削除または移動されることはありません。
</Info>

## 仕組み

AIの各ターン後、会話はHonchoに永続化されます。ユーザーとエージェントの両方のメッセージが観測され、Honchoは時間をかけてモデルを構築し、改善できます。

会話中、HonchoツールはOpenClawの `before_prompt_build` Pluginフック中にサービスへクエリし、モデルがプロンプトを見る前に関連コンテキストを注入します。

## Honchoと組み込みメモリの比較

|                   | 組み込み / QMD              | Honcho                              |
| ----------------- | --------------------------- | ----------------------------------- |
| **ストレージ**    | ワークスペースMarkdownファイル | 専用サービス（ローカルまたはホスト） |
| **セッション横断** | メモリファイル経由          | 自動、組み込み                      |
| **ユーザーモデリング** | 手動（MEMORY.mdに書き込み） | 自動プロファイル                    |
| **検索**          | ベクトル + キーワード（ハイブリッド） | 観測内容に対するセマンティック      |
| **マルチエージェント** | 追跡されない              | 親子認識                            |
| **依存関係**      | なし（組み込み）またはQMDバイナリ | Pluginインストール                  |

Honchoと組み込みメモリシステムは連携できます。QMDが設定されている場合、Honchoのセッション横断メモリと並行してローカルMarkdownファイルを検索する追加ツールが利用可能になります。

## CLIコマンド

```bash
openclaw honcho setup                        # Configure API key and migrate files
openclaw honcho status                       # Check connection status
openclaw honcho ask <question>               # Query Honcho about the user
openclaw honcho search <query> [-k N] [-d D] # Semantic search over memory
```

## 関連情報

- [Pluginソースコード](https://github.com/plastic-labs/openclaw-honcho)
- [Honchoドキュメント](https://docs.honcho.dev)
- [Honcho OpenClaw統合ガイド](https://docs.honcho.dev/v3/guides/integrations/openclaw)

## 関連項目

- [メモリ概要](/ja-JP/concepts/memory)
- [組み込みメモリエンジン](/ja-JP/concepts/memory-builtin)
- [QMDメモリエンジン](/ja-JP/concepts/memory-qmd)
- [コンテキストエンジン](/ja-JP/concepts/context-engine)

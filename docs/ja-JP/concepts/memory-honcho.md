---
read_when:
    - セッションやチャンネルをまたいで機能する永続メモリが欲しい場合
    - AI を活用した想起とユーザーモデリングが欲しい場合
summary: Honcho Plugin による AI ネイティブなクロスセッションメモリ
title: Honchoメモリ
x-i18n:
    generated_at: "2026-04-24T04:53:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: d77af5c7281a4abafc184e426b1c37205a6d06a196b50353c1abbf67cc93bb97
    source_path: concepts/memory-honcho.md
    workflow: 15
---

[Honcho](https://honcho.dev) は OpenClaw に AI ネイティブなメモリを追加します。会話を専用サービスに永続化し、時間をかけてユーザーとエージェントのモデルを構築することで、ワークスペースの Markdown ファイルを超えたクロスセッションコンテキストをエージェントに提供します。

## 提供されるもの

- **クロスセッションメモリ** -- 会話は各ターン後に永続化されるため、コンテキストはセッションリセット、Compaction、チャンネル切り替えをまたいで維持されます。
- **ユーザーモデリング** -- Honcho は各ユーザーについてのプロファイル（好み、事実、コミュニケーションスタイル）と、エージェントについてのプロファイル（性格、学習された振る舞い）を維持します。
- **セマンティック検索** -- 現在のセッションだけでなく、過去の会話から得られた観察内容を検索できます。
- **マルチエージェント対応** -- 親エージェントは生成した sub-agent を自動的に追跡し、親は子セッションの observer として追加されます。

## 利用可能な tools

Honcho は、会話中にエージェントが使える tools を登録します。

**データ取得（高速、LLM 呼び出しなし）:**

| Tool | 説明 |
| --------------------------- | ------------------------------------------------------ |
| `honcho_context` | セッション全体にわたる完全なユーザー表現 |
| `honcho_search_conclusions` | 保存された結論に対するセマンティック検索 |
| `honcho_search_messages` | セッション全体のメッセージ検索（送信者、日付で絞り込み可能） |
| `honcho_session` | 現在のセッション履歴と要約 |

**Q&A（LLM 活用）:**

| Tool | 説明 |
| ------------ | ------------------------------------------------------------------------- |
| `honcho_ask` | ユーザーについて質問します。事実には `depth='quick'`、統合的な要約には `'thorough'` を使います |

## はじめに

Plugin をインストールしてセットアップを実行します。

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

setup コマンドは API 認証情報を尋ね、config を書き込み、必要に応じて既存のワークスペースメモリファイルを移行します。

<Info>
Honcho は完全にローカル（セルフホスト）でも、`api.honcho.dev` のマネージド API 経由でも実行できます。セルフホスト構成では外部依存関係は不要です。
</Info>

## 設定

設定は `plugins.entries["openclaw-honcho"].config` 配下にあります。

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // セルフホストでは省略
          workspaceId: "openclaw", // メモリ分離
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

セルフホストのインスタンスでは、`baseUrl` をローカルサーバー（たとえば `http://localhost:8000`）に向け、API key は省略してください。

## 既存メモリの移行

既存のワークスペースメモリファイル（`USER.md`, `MEMORY.md`, `IDENTITY.md`, `memory/`, `canvas/`）がある場合、`openclaw honcho setup` はそれらを検出し、移行を提案します。

<Info>
移行は非破壊です -- ファイルは Honcho にアップロードされます。元のファイルが削除または移動されることはありません。
</Info>

## 仕組み

各 AI ターンの後、会話は Honcho に永続化されます。ユーザーとエージェントの両方のメッセージが観測されるため、Honcho は時間をかけてモデルを構築し、洗練させていきます。

会話中、Honcho tools は `before_prompt_build` フェーズでサービスに問い合わせ、モデルがプロンプトを見る前に関連コンテキストを注入します。これにより、正確なターン境界と適切な想起が保証されます。

## Honcho と組み込みメモリの比較

|                   | 組み込み / QMD | Honcho |
| ----------------- | ---------------------------- | ----------------------------------- |
| **ストレージ** | ワークスペース Markdown ファイル | 専用サービス（ローカルまたはホスト型） |
| **クロスセッション** | メモリファイル経由 | 自動、組み込み |
| **ユーザーモデリング** | 手動（`MEMORY.md` に書く） | 自動プロファイル |
| **検索** | ベクトル + キーワード（ハイブリッド） | 観察内容に対するセマンティック検索 |
| **マルチエージェント** | 追跡されない | 親/子の対応あり |
| **依存関係** | なし（組み込み）または QMD バイナリ | Plugin インストール |

Honcho と組み込みメモリシステムは一緒に使えます。QMD が設定されている場合、Honcho のクロスセッションメモリと並行してローカル Markdown ファイルを検索するための追加 tools が利用可能になります。

## CLI コマンド

```bash
openclaw honcho setup                        # API key を設定してファイルを移行
openclaw honcho status                       # 接続状態を確認
openclaw honcho ask <question>               # ユーザーについて Honcho に問い合わせる
openclaw honcho search <query> [-k N] [-d D] # メモリに対するセマンティック検索
```

## さらに読む

- [Plugin source code](https://github.com/plastic-labs/openclaw-honcho)
- [Honcho documentation](https://docs.honcho.dev)
- [Honcho OpenClaw integration guide](https://docs.honcho.dev/v3/guides/integrations/openclaw)
- [Memory](/ja-JP/concepts/memory) -- OpenClaw メモリの概要
- [Context Engines](/ja-JP/concepts/context-engine) -- Plugin コンテキストエンジンの仕組み

## 関連

- [メモリ概要](/ja-JP/concepts/memory)
- [組み込みメモリエンジン](/ja-JP/concepts/memory-builtin)
- [QMD メモリエンジン](/ja-JP/concepts/memory-qmd)

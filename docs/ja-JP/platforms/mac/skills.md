---
read_when:
    - macOS Skills 設定 UI の更新
    - Skills のゲーティングまたはインストール動作の変更
summary: macOS Skills 設定 UI と Gateway によるステータス
title: Skills (macOS)
x-i18n:
    generated_at: "2026-06-27T12:05:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ecc470f1645051e03ab4f51bcb4972da4853c690354bc8ea18a89fcd387d413
    source_path: platforms/mac/skills.md
    workflow: 16
---

macOS アプリは Gateway 経由で OpenClaw Skills を表示します。ローカルでは Skills を解析しません。

## データソース

- `skills.status`（Gateway）は、すべての Skills に加えて適格性と不足している要件
  （バンドルされた Skills の許可リストによるブロックを含む）を返します。
- 要件は各 `SKILL.md` の `metadata.openclaw.requires` から派生します。

## インストールアクション

- `metadata.openclaw.install` はインストールオプション（brew/node/go/uv）を定義します。
- アプリは `skills.install` を呼び出して、Gateway ホスト上でインストーラーを実行します。
- オペレーター所有の `security.installPolicy` は、インストーラーメタデータが実行される前に、Gateway 経由の Skills
  インストールをブロックできます。インストール時の組み込み dangerous-code
  ブロックは、Skills インストールフローの一部ではありません。
- すべてのインストールオプションが `download` の場合、Gateway はすべてのダウンロード
  選択肢を表示します。
- それ以外の場合、Gateway は現在の
  インストール設定とホスト上のバイナリを使用して、優先インストーラーを 1 つ選択します。`skills.install.preferBrew` が有効で `brew` が存在する場合は Homebrew が最初で、その後 `uv`、`skills.install.nodeManager` で設定された
  Node マネージャー、その後に `go` や `download` などのフォールバックが続きます。
- Node インストールラベルは、`yarn` を含め、設定された Node マネージャーを反映します。

## 環境/API キー

- アプリはキーを `~/.openclaw/openclaw.json` の `skills.entries.<skillKey>` の下に保存します。
- `skills.update` は `enabled`、`apiKey`、`env` にパッチを適用します。

## リモートモード

- インストールと設定の更新は Gateway ホスト上で行われます（ローカルの Mac ではありません）。

## 関連

- [Skills](/ja-JP/tools/skills)
- [macOS アプリ](/ja-JP/platforms/macos)

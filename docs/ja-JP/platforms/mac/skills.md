---
read_when:
    - macOS の Skills 設定 UI の更新
    - Skills のゲーティングまたはインストール動作の変更
summary: macOSのSkills設定UIとGatewayを利用したステータス
title: Skills（macOS）
x-i18n:
    generated_at: "2026-07-11T22:24:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd9d8f1190320889029335e008c3605bd4bf0194f83398cedd4ae658fd90065c
    source_path: platforms/mac/skills.md
    workflow: 16
---

macOS アプリは Gateway 経由で OpenClaw の Skills を表示します。Skills をローカルで解析することはありません。

## データソース

- `skills.status`（Gateway）は、すべての Skills に加え、利用可否と不足している要件（同梱 Skills に対する許可リストによるブロックを含む）を返します。
- 要件は、各 `SKILL.md` の `metadata.openclaw.requires` から取得されます。

## インストール操作

- `metadata.openclaw.install` は、インストール方法（brew/node/go/uv/download）を定義します。
- アプリは `skills.install` を呼び出し、Gateway ホスト上でインストーラーを実行します。
- 運用者が管理する `security.installPolicy`（`enabled`、`targets`、`exec`）により、インストーラーのメタデータが実行される前に、Gateway 経由の Skill インストールをブロックできます。組み込みの危険コードスキャン（Plugin のインストールで使用）は、Skill のインストールフローには組み込まれていません。
- すべてのインストール方法が `download` の場合、Gateway はすべてのダウンロード方法を提示します。
- それ以外の場合、Gateway は現在のインストール設定（`skills.install.preferBrew`、`skills.install.nodeManager`）とホスト上のバイナリに基づいて、優先するインストーラーを1つ選択します。`preferBrew` が有効で `brew` が存在する場合はまず Homebrew、次に `uv`、設定済みの Node マネージャー、利用可能であれば（`preferBrew` がなくても）再び Homebrew、次に `go`、最後に `download` の順です。
- Node のインストールラベルには、`yarn` を含む、設定済みの Node マネージャーが反映されます。

## 環境変数/API キー

- アプリは、`~/.openclaw/openclaw.json` の `skills.entries.<skillKey>` 以下にキーを保存します。
- `skills.update` は、`enabled`、`apiKey`、`env` を更新します。

## リモートモード

- インストールと設定の更新は、ローカルの Mac ではなく Gateway ホスト上で行われます。

## 関連項目

- [Skills](/ja-JP/tools/skills)
- [macOS アプリ](/ja-JP/platforms/macos)

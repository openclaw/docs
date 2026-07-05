---
read_when:
    - macOS Skills 設定 UI の更新
    - Skills のゲート制御またはインストール動作の変更
summary: macOS Skills 設定 UI と gateway バックエンドのステータス
title: Skills (macOS)
x-i18n:
    generated_at: "2026-07-05T11:30:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd9d8f1190320889029335e008c3605bd4bf0194f83398cedd4ae658fd90065c
    source_path: platforms/mac/skills.md
    workflow: 16
---

macOSアプリはGateway経由でOpenClaw Skillsを表示します。ローカルではSkillsを解析しません。

## データソース

- `skills.status` (gateway) は、バンドルSkillsの許可リストブロックを含め、すべてのSkillsに加えて適格性と不足している要件を返します。
- 要件は各`SKILL.md`の`metadata.openclaw.requires`から取得されます。

## インストールアクション

- `metadata.openclaw.install`はインストールオプション (brew/node/go/uv/download) を定義します。
- アプリは`skills.install`を呼び出し、Gatewayホスト上でインストーラーを実行します。
- オペレーター所有の`security.installPolicy` (`enabled`、`targets`、`exec`) は、インストーラーメタデータが実行される前に、Gatewayに基づくSkillのインストールをブロックできます。組み込みの危険コードスキャン (Pluginインストールに使用) は、Skillインストールフローには接続されていません。
- すべてのインストールオプションが`download`の場合、Gatewayはすべてのダウンロード選択肢を表示します。
- それ以外の場合、Gatewayは現在のインストール設定 (`skills.install.preferBrew`、`skills.install.nodeManager`) とホストのバイナリに基づいて、優先インストーラーを1つ選択します。`preferBrew`が有効で`brew`が存在する場合はHomebrewが最優先され、次に`uv`、設定されたNodeマネージャー、利用可能な場合はHomebrew ( `preferBrew`なしでも)、`go`、`download`の順です。
- Nodeインストールラベルには、`yarn`を含め、設定されたNodeマネージャーが反映されます。

## 環境/APIキー

- アプリはキーを`~/.openclaw/openclaw.json`の`skills.entries.<skillKey>`配下に保存します。
- `skills.update`は`enabled`、`apiKey`、`env`にパッチを適用します。

## リモートモード

- インストールと設定の更新は、ローカルのMacではなくGatewayホスト上で行われます。

## 関連

- [Skills](/ja-JP/tools/skills)
- [macOSアプリ](/ja-JP/platforms/macos)

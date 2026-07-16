---
read_when:
    - OS のサポート状況またはインストール先を探す
    - Gateway の実行場所を決める
summary: プラットフォームサポートの概要（Gateway + コンパニオンアプリ）
title: プラットフォーム
x-i18n:
    generated_at: "2026-07-16T11:47:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 40494f8567c0159d9b6024c174cf0f316a45b46c633a578efaf2388f679a88f2
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw コアは TypeScript で記述されています。正規の状態ストアが `node:sqlite` を使用するため、**Node は必須のランタイムです**。Bun は引き続き依存関係のインストールとパッケージスクリプトに使用できます。詳しくは [Bun](/ja-JP/install/bun) を参照してください。

Windows Hub、macOS（メニューバーアプリ）、モバイル Node（iOS/Android）向けのコンパニオンアプリがあります。Linux コンパニオンアプリは計画中ですが、Gateway は現在完全にサポートされています。Windows では、デスクトップアプリには Windows Hub、ターミナル中心の使用にはネイティブ PowerShell インストール、Linux との互換性が最も高い Gateway ランタイムには WSL2 を選択してください。

## OS を選択

- macOS: [macOS](/ja-JP/platforms/macos)
- iOS: [iOS](/ja-JP/platforms/ios)
- Android: [Android](/ja-JP/platforms/android)
- Windows: [Windows](/ja-JP/platforms/windows)
- Linux: [Linux](/ja-JP/platforms/linux)

## VPS とホスティング

- VPS ハブ: [VPS ホスティング](/ja-JP/vps)
- Fly.io: [Fly.io](/ja-JP/install/fly)
- Hetzner（Docker）: [Hetzner](/ja-JP/install/hetzner)
- GCP（Compute Engine）: [GCP](/ja-JP/install/gcp)
- Azure（Linux VM）: [Azure](/ja-JP/install/azure)
- exe.dev（VM + HTTPS プロキシ）: [exe.dev](/ja-JP/install/exe-dev)
- EasyRunner（Podman + Caddy）: [EasyRunner](/ja-JP/platforms/easyrunner)

## よく使うリンク

- インストールガイド: [はじめに](/ja-JP/start/getting-started)
- Windows Hub: [Windows](/ja-JP/platforms/windows)
- Gateway 運用手順書: [Gateway](/ja-JP/gateway)
- Gateway の設定: [設定](/ja-JP/gateway/configuration)
- サービスの状態: `openclaw gateway status`

## Gateway サービスのインストール（CLI）

次のいずれかを使用してください（すべてサポートされています）。

- ウィザード（推奨）: `openclaw onboard --install-daemon`
- 直接インストール: `openclaw gateway install`
- 設定フロー: `openclaw configure` → **Gateway サービス**を選択
- 修復／移行: `openclaw doctor`（サービスのインストールまたは修復を提案します）

サービスの対象は OS によって異なります。

- macOS: LaunchAgent（`ai.openclaw.gateway`、または名前付きプロファイルの場合は `ai.openclaw.<profile>`）
- Linux/WSL2: systemd ユーザーサービス（`openclaw-gateway[-<profile>].service`）
- ネイティブ Windows: Scheduled Task（`OpenClaw Gateway` または `OpenClaw Gateway (<profile>)`）。タスク作成が拒否された場合は、ユーザーごとの Startup フォルダーにあるログイン項目へフォールバックします

## 関連項目

- [インストールの概要](/ja-JP/install)
- [Windows Hub](/ja-JP/platforms/windows)
- [macOS アプリ](/ja-JP/platforms/macos)
- [iOS アプリ](/ja-JP/platforms/ios)

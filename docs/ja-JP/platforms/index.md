---
read_when:
    - OS サポートまたはインストールパスを探している
    - Gateway をどこで実行するかを決める
summary: プラットフォームサポート概要（Gateway + コンパニオンアプリ）
title: プラットフォーム
x-i18n:
    generated_at: "2026-06-27T12:01:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d6edfaf9c4b1f1bc824d4bddf8263244902676dd5df98da556a8a5f35afe566
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw コアは TypeScript で書かれています。**Node が推奨ランタイムです**。
Bun は Gateway には推奨されません。WhatsApp と
Telegram チャンネルで既知の問題があります。詳細は [Bun（実験的）](/ja-JP/install/bun) を参照してください。

Windows Hub、macOS（メニューバーアプリ）、モバイルノード
（iOS/Android）向けのコンパニオンアプリがあります。Linux コンパニオンアプリは計画中ですが、Gateway は現在完全に
サポートされています。Windows では、デスクトップアプリには Windows Hub、ターミナル中心の利用にはネイティブの
PowerShell インストール、最も Linux 互換性の高い Gateway ランタイムには WSL2 を選択してください。

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

## 共通リンク

- インストールガイド: [はじめに](/ja-JP/start/getting-started)
- Windows Hub: [Windows](/ja-JP/platforms/windows)
- Gateway ランブック: [Gateway](/ja-JP/gateway)
- Gateway 設定: [設定](/ja-JP/gateway/configuration)
- サービス状態: `openclaw gateway status`

## Gateway サービスのインストール（CLI）

次のいずれかを使用します（すべてサポート対象）:

- ウィザード（推奨）: `openclaw onboard --install-daemon`
- 直接実行: `openclaw gateway install`
- 設定フロー: `openclaw configure` → **Gateway サービス**を選択
- 修復/移行: `openclaw doctor`（サービスのインストールまたは修正を提案）

サービスのターゲットは OS によって異なります:

- macOS: LaunchAgent（`ai.openclaw.gateway` または `ai.openclaw.<profile>`、レガシー `com.openclaw.*`）
- Linux/WSL2: systemd ユーザーサービス（`openclaw-gateway[-<profile>].service`）
- ネイティブ Windows: スケジュール タスク（`OpenClaw Gateway` または `OpenClaw Gateway (<profile>)`）。タスク作成が拒否された場合は、ユーザーごとの Startup フォルダーのログイン項目フォールバックを使用

## 関連

- [インストール概要](/ja-JP/install)
- [Windows Hub](/ja-JP/platforms/windows)
- [macOS アプリ](/ja-JP/platforms/macos)
- [iOS アプリ](/ja-JP/platforms/ios)

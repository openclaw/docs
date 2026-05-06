---
read_when:
    - OS サポートやインストールパスを探している場合
    - Gateway をどこで実行するかを決める
summary: プラットフォームサポート概要（Gateway + コンパニオンアプリ）
title: プラットフォーム
x-i18n:
    generated_at: "2026-05-06T05:12:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd1fbd1af8b03a12014d91b2f300fb8ec65b9c42c38ada2b9ca089181140a75c
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw コアは TypeScript で書かれています。**Node が推奨ランタイムです**。
Bun は Gateway には推奨されません。WhatsApp と
Telegram チャネルで既知の問題があります。詳細は [Bun (実験的)](/ja-JP/install/bun) を参照してください。

macOS（メニューバーアプリ）とモバイルノード（iOS/Android）向けのコンパニオンアプリがあります。Windows と
Linux のコンパニオンアプリは計画中ですが、Gateway は現在完全にサポートされています。
Windows 向けのネイティブコンパニオンアプリも計画中です。Gateway は WSL2 経由での利用が推奨されます。

## OS を選択する

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

## 共通リンク

- インストールガイド: [はじめに](/ja-JP/start/getting-started)
- Gateway ランブック: [Gateway](/ja-JP/gateway)
- Gateway 設定: [設定](/ja-JP/gateway/configuration)
- サービスステータス: `openclaw gateway status`

## Gateway サービスのインストール（CLI）

次のいずれかを使用します（すべてサポートされています）。

- ウィザード（推奨）: `openclaw onboard --install-daemon`
- 直接: `openclaw gateway install`
- 設定フロー: `openclaw configure` → **Gateway サービス**を選択
- 修復/移行: `openclaw doctor`（サービスのインストールまたは修復を提案します）

サービスターゲットは OS によって異なります。

- macOS: LaunchAgent（`ai.openclaw.gateway` または `ai.openclaw.<profile>`、レガシーは `com.openclaw.*`）
- Linux/WSL2: systemd ユーザーサービス（`openclaw-gateway[-<profile>].service`）
- ネイティブ Windows: スケジュールされたタスク（`OpenClaw Gateway` または `OpenClaw Gateway (<profile>)`）。タスク作成が拒否された場合は、ユーザーごとの Startup フォルダーのログイン項目にフォールバックします

## 関連

- [インストール概要](/ja-JP/install)
- [macOS アプリ](/ja-JP/platforms/macos)
- [iOS アプリ](/ja-JP/platforms/ios)

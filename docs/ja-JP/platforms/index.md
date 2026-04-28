---
read_when:
- OS サポートやインストール方法を探している場合
- Gateway をどこで実行するか決める場合
summary: プラットフォーム対応の概要（Gateway + コンパニオンアプリ）
title: Platforms
x-i18n:
  generated_at: '2026-04-24T05:07:32Z'
  refreshed_at: '2026-04-28T04:45:00Z'
  model: gpt-5.4
  provider: openai
  source_hash: 3ebed9f219f3072ef760006eef47ca78f87169c40a6098c3585dfaf6169fc594
  source_path: platforms/index.md
  workflow: 15
---

OpenClaw core は TypeScript で書かれています。**Node が推奨ランタイム**です。
Gateway に Bun は推奨されません。WhatsApp と
Telegram チャンネルで既知の問題があります。詳細は [Bun (experimental)](/ja-JP/install/bun) を参照してください。

コンパニオンアプリは macOS（メニューバーアプリ）とモバイル Node（iOS/Android）向けに存在します。Windows と
Linux のコンパニオンアプリも計画中ですが、Gateway 自体は現時点で完全にサポートされています。
Windows 向けのネイティブコンパニオンアプリも計画中です。Gateway は WSL2 経由の利用が推奨されます。

## OS を選ぶ

- macOS: [macOS](/ja-JP/platforms/macos)
- iOS: [iOS](/ja-JP/platforms/ios)
- Android: [Android](/ja-JP/platforms/android)
- Windows: [Windows](/ja-JP/platforms/windows)
- Linux: [Linux](/ja-JP/platforms/linux)

## VPS とホスティング

- VPS ハブ: [VPS hosting](/ja-JP/vps)
- Fly.io: [Fly.io](/ja-JP/install/fly)
- Hetzner（Docker）: [Hetzner](/ja-JP/install/hetzner)
- GCP（Compute Engine）: [GCP](/ja-JP/install/gcp)
- Azure（Linux VM）: [Azure](/ja-JP/install/azure)
- exe.dev（VM + HTTPS proxy）: [exe.dev](/ja-JP/install/exe-dev)

## 共通リンク

- インストールガイド: [Getting Started](/ja-JP/start/getting-started)
- Gateway runbook: [Gateway](/ja-JP/gateway)
- Gateway 設定: [Configuration](/ja-JP/gateway/configuration)
- サービス状態: `openclaw gateway status`

## Gateway service インストール（CLI）

次のいずれかを使ってください（すべてサポートされています）。

- ウィザード（推奨）: `openclaw onboard --install-daemon`
- 直接: `openclaw gateway install`
- Configure フロー: `openclaw configure` → **Gateway service** を選択
- 修復/移行: `openclaw doctor`（service のインストールまたは修復を提案します）

service ターゲットは OS に依存します。

- macOS: LaunchAgent（`ai.openclaw.gateway` または `ai.openclaw.<profile>`、旧式は `com.openclaw.*`）
- Linux/WSL2: systemd ユーザー service（`openclaw-gateway[-<profile>].service`）
- ネイティブ Windows: Scheduled Task（`OpenClaw Gateway` または `OpenClaw Gateway (<profile>)`）。task 作成が拒否された場合はユーザーごとの Startup-folder ログイン項目にフォールバック

## 関連

- [Install overview](/ja-JP/install)
- [macOS app](/ja-JP/platforms/macos)
- [iOS app](/ja-JP/platforms/ios)

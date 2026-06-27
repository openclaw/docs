---
read_when:
    - Android ノードのペアリングまたは再接続
    - Android Gateway の検出または認証のデバッグ
    - チャット履歴のクライアント間の一致を検証する
summary: Android アプリ（node）：接続ランブック + 接続/チャット/音声/キャンバス コマンドサーフェス
title: Android アプリ
x-i18n:
    generated_at: "2026-06-27T12:00:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c02d4921c3f3011c09e564d83b773a7c155d17a82a6e70d3fd3e973597142f1
    source_path: platforms/android.md
    workflow: 16
---

<Note>
公式 Android アプリは [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) で入手できます。これはコンパニオンノードであり、実行中の OpenClaw Gateway が必要です。ソースコードも [OpenClaw repository](https://github.com/openclaw/openclaw) の `apps/android` 配下で公開されています。ビルド手順は [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) を参照してください。
</Note>

## サポート概要

- ロール: コンパニオンノードアプリ (Android は Gateway をホストしません)。
- Gateway 必須: はい (macOS、Linux、または WSL2 経由の Windows で実行します)。
- インストール: アプリは [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN)、Gateway は [はじめに](/ja-JP/start/getting-started)、その後 [ペアリング](/ja-JP/channels/pairing)。
- Gateway: [ランブック](/ja-JP/gateway) + [設定](/ja-JP/gateway/configuration)。
  - プロトコル: [Gateway プロトコル](/ja-JP/gateway/protocol) (ノード + コントロールプレーン)。

## システム制御

システム制御 (launchd/systemd) は Gateway ホスト上にあります。[Gateway](/ja-JP/gateway) を参照してください。

## 接続ランブック

Android ノードアプリ ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android は Gateway WebSocket に直接接続し、デバイスペアリング (`role: node`) を使用します。

Tailscale または公開ホストでは、Android に安全なエンドポイントが必要です。

- 推奨: `https://<magicdns>` / `wss://<magicdns>` を使った Tailscale Serve / Funnel
- サポート対象: 実際の TLS エンドポイントを持つその他の任意の `wss://` Gateway URL
- クリアテキストの `ws://` は、プライベート LAN アドレス / `.local` ホストに加え、`localhost`、`127.0.0.1`、Android エミュレータブリッジ (`10.0.2.2`) で引き続きサポートされます

### 前提条件

- 「master」マシンで Gateway を実行できる。
- Android デバイス/エミュレータから Gateway WebSocket に到達できる。
  - mDNS/NSD を使った同一 LAN、**または**
  - Wide-Area Bonjour / ユニキャスト DNS-SD を使った同一 Tailscale tailnet (下記参照)、**または**
  - 手動の Gateway ホスト/ポート (フォールバック)
- tailnet/公開モバイルペアリングでは、生の tailnet IP `ws://` エンドポイントは使用しません。代わりに Tailscale Serve または別の `wss://` URL を使用してください。
- Gateway マシン上で (または SSH 経由で) CLI (`openclaw`) を実行できる。

### 1) Gateway を起動する

```bash
openclaw gateway --port 18789 --verbose
```

ログで次のような内容が表示されることを確認します。

- `listening on ws://0.0.0.0:18789`

Tailscale 経由のリモート Android アクセスでは、生の tailnet バインドではなく Serve/Funnel を推奨します。

```bash
openclaw gateway --tailscale serve
```

これにより、Android に安全な `wss://` / `https://` エンドポイントが提供されます。プレーンな `gateway.bind: "tailnet"` 設定だけでは、別途 TLS を終端しない限り、初回のリモート Android ペアリングには不十分です。

### 2) 検出を確認する (任意)

Gateway マシンから:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

その他のデバッグメモ: [Bonjour](/ja-JP/gateway/bonjour)。

広域検出ドメインも設定している場合は、次と比較します。

```bash
openclaw gateway discover --json
```

これは `local.` と設定済みの広域ドメインを一度に表示し、TXT のみのヒントではなく解決済みのサービスエンドポイントを使用します。

#### ユニキャスト DNS-SD による tailnet (ウィーン ⇄ ロンドン) 検出

Android の NSD/mDNS 検出はネットワークをまたげません。Android ノードと Gateway が別々のネットワーク上にあり、Tailscale で接続されている場合は、代わりに Wide-Area Bonjour / ユニキャスト DNS-SD を使用してください。

検出だけでは tailnet/公開 Android ペアリングには不十分です。検出されたルートにも安全なエンドポイント (`wss://` または Tailscale Serve) が必要です。

1. Gateway ホスト上に DNS-SD ゾーン (例: `openclaw.internal.`) を設定し、`_openclaw-gw._tcp` レコードを公開します。
2. 選択したドメインがその DNS サーバーを指すように Tailscale split DNS を設定します。

詳細と CoreDNS 設定例: [Bonjour](/ja-JP/gateway/bonjour)。

### 3) Android から接続する

Android アプリで:

- アプリは **フォアグラウンドサービス** (永続通知) によって Gateway 接続を維持します。
- **接続** タブを開きます。
- **セットアップコード** または **手動** モードを使用します。
- 検出がブロックされている場合は、**詳細コントロール** で手動のホスト/ポートを使用します。プライベート LAN ホストでは `ws://` が引き続き動作します。Tailscale/公開ホストでは TLS をオンにし、`wss://` / Tailscale Serve エンドポイントを使用します。

初回ペアリングが成功した後、Android は起動時に自動再接続します。

- 手動エンドポイント (有効な場合)、それ以外は
- 最後に検出された Gateway (ベストエフォート)。

### Presence alive ビーコン

認証済みノードセッションが接続した後、またフォアグラウンドサービスが接続中のままアプリがバックグラウンドへ移動したとき、Android は `event: "node.presence.alive"` で `node.event` を呼び出します。Gateway は、認証済みノードデバイス ID が判明した後にのみ、ペアリング済みノード/デバイスメタデータ上の `lastSeenAtMs`/`lastSeenReason` としてこれを記録します。

アプリは、Gateway の応答に `handled: true` が含まれる場合にのみ、ビーコンが正常に記録されたものとしてカウントします。古い Gateway は `{ "ok": true }` で `node.event` に確認応答する場合があります。この応答には互換性がありますが、永続的な最終確認更新としてはカウントされません。

### 4) ペアリングを承認する (CLI)

Gateway マシンで:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

ペアリングの詳細: [ペアリング](/ja-JP/channels/pairing)。

任意: Android ノードが常に厳密に制御されたサブネットから接続する場合、明示的な CIDR または正確な IP を指定して、初回ノードの自動承認を有効化できます。

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

これはデフォルトでは無効です。要求されたスコープがない新規の `role: node` ペアリングにのみ適用されます。オペレーター/ブラウザのペアリング、およびロール、スコープ、メタデータ、公開鍵の変更は、引き続き手動承認が必要です。

### 5) ノードが接続済みであることを確認する

- ノードステータス経由:

  ```bash
  openclaw nodes status
  ```

- Gateway 経由:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) チャット + 履歴

Android のチャットタブはセッション選択をサポートします (デフォルトは `main`、加えて既存の他のセッション)。

- 履歴: `chat.history` (表示用に正規化済み。インラインディレクティブタグは表示テキストから削除され、プレーンテキストのツール呼び出し XML ペイロード (`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、切り詰められたツール呼び出しブロックを含む) と漏出した ASCII/全角のモデル制御トークンは削除され、正確な `NO_REPLY` / `no_reply` などの純粋なサイレントトークンのアシスタント行は省略され、サイズが大きすぎる行はプレースホルダーに置き換えられる場合があります)
- 送信: `chat.send`
- プッシュ更新 (ベストエフォート): `chat.subscribe` → `event:"chat"`

### 7) Canvas + カメラ

#### Gateway Canvas ホスト (Web コンテンツに推奨)

ノードに、エージェントがディスク上で編集できる実際の HTML/CSS/JS を表示させたい場合は、ノードを Gateway canvas ホストに向けます。

<Note>
ノードは Gateway HTTP サーバー (`gateway.port` と同じポート、デフォルトは `18789`) から Canvas を読み込みます。
</Note>

1. Gateway ホスト上に `~/.openclaw/workspace/canvas/index.html` を作成します。

2. ノードをそこへ移動します (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

tailnet (任意): 両方のデバイスが Tailscale 上にある場合は、`.local` の代わりに MagicDNS 名または tailnet IP を使用します。例: `http://<gateway-magicdns>:18789/__openclaw__/canvas/`。

このサーバーはライブリロードクライアントを HTML に注入し、ファイル変更時に再読み込みします。
Gateway は `/__openclaw__/a2ui/` も提供しますが、Android アプリはリモート A2UI ページを表示専用として扱います。アクション対応 A2UI コマンドは、メッセージを適用する前に、バンドルされたアプリ所有の A2UI ページを使用します。

Canvas コマンド (フォアグラウンドのみ):

- `canvas.eval`、`canvas.snapshot`、`canvas.navigate` (デフォルトのスキャフォールドに戻るには `{"url":""}` または `{"url":"/"}` を使用)。`canvas.snapshot` は `{ format, base64 }` を返します (デフォルトは `format="jpeg"`)。
- A2UI: `canvas.a2ui.push`、`canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` はレガシーエイリアス)。これらのコマンドは、アクション対応レンダリングにバンドルされたアプリ所有の A2UI ページを使用します。

カメラコマンド (フォアグラウンドのみ。権限で制御):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

パラメーターと CLI ヘルパーについては [カメラノード](/ja-JP/nodes/camera) を参照してください。

### 8) 音声 + 拡張 Android コマンドサーフェス

- 音声タブ: Android には 2 つの明示的なキャプチャモードがあります。**Mic** は手動の音声タブセッションで、一時停止ごとにチャットターンとして送信し、アプリがフォアグラウンドを離れるか、ユーザーが音声タブを離れると停止します。**Talk** は継続的な Talk Mode で、オフに切り替えられるかノードが切断されるまでリスニングを続けます。
- Talk Mode は、キャプチャ開始前に既存のフォアグラウンドサービスを `connectedDevice` から `connectedDevice|microphone` に昇格し、Talk Mode 停止時に降格します。ノードサービスは `CHANGE_NETWORK_STATE` とともに `FOREGROUND_SERVICE_CONNECTED_DEVICE` を宣言します。Android 14+ ではさらに、`FOREGROUND_SERVICE_MICROPHONE` 宣言、`RECORD_AUDIO` ランタイム許可、ランタイムでのマイクサービス種別も必要です。
- デフォルトでは、Android Talk はネイティブ音声認識、Gateway チャット、設定済みの Gateway Talk プロバイダー経由の `talk.speak` を使用します。ローカルシステム TTS は、`talk.speak` が利用できない場合にのみ使用されます。
- Android Talk は、`talk.realtime.mode` が `realtime` で、`talk.realtime.transport` が `gateway-relay` の場合にのみ、リアルタイム Gateway リレーを使用します。
- 音声ウェイクは Android UX/ランタイムでは引き続き無効です。
- 追加の Android コマンドファミリー (利用可否はデバイス、権限、ユーザー設定に依存):
  - `device.status`、`device.info`、`device.permissions`、`device.health`
  - `device.apps` は **Settings > Phone Capabilities > Installed Apps** が有効な場合のみ。デフォルトではランチャーに表示されるアプリを一覧表示します。
  - `notifications.list`、`notifications.actions` (下記の [通知転送](#notification-forwarding) を参照)
  - `photos.latest`
  - `contacts.search`、`contacts.add`
  - `calendar.events`、`calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`、`motion.pedometer`

## アシスタントエントリポイント

Android は、システムアシスタントのトリガー (Google Assistant) からの OpenClaw 起動をサポートします。設定されている場合、ホームボタンの長押し、または「Hey Google, OpenClaw に聞いて...」と言うことでアプリが開き、プロンプトがチャット入力欄に渡されます。

これは、アプリマニフェストで宣言された Android **App Actions** メタデータを使用します。Gateway 側で追加設定は不要です。アシスタントインテントは Android アプリ内で完全に処理され、通常のチャットメッセージとして転送されます。

<Note>
App Actions の利用可否は、デバイス、Google Play Services のバージョン、ユーザーが OpenClaw をデフォルトのアシスタントアプリに設定しているかどうかに依存します。
</Note>

## 通知転送

Android はデバイス通知をイベントとして Gateway に転送できます。どの通知をいつ転送するかを絞り込むためのコントロールが複数あります。

| キー                             | 型             | 説明                                                                                              |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | これらのパッケージ名からの通知のみを転送します。設定されている場合、他のすべてのパッケージは無視されます。 |
| `notifications.denyPackages`     | string[]       | これらのパッケージ名からの通知は決して転送しません。`allowPackages` の後に適用されます。              |
| `notifications.quietHours.start` | string (HH:mm) | 静かな時間帯ウィンドウの開始 (ローカルデバイス時刻)。このウィンドウ中は通知が抑制されます。            |
| `notifications.quietHours.end`   | string (HH:mm) | 静かな時間帯ウィンドウの終了。                                                                     |
| `notifications.rateLimit`        | number         | パッケージごとの 1 分あたりの最大転送通知数。超過した通知は破棄されます。                            |

通知ピッカーも、転送される通知イベントに対してより安全な挙動を使用し、機密性の高いシステム通知の偶発的な転送を防ぎます。

設定例:

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
通知の転送には Android の Notification Listener 権限が必要です。アプリはセットアップ中にこれを求めます。
</Note>

## 関連

- [iOS アプリ](/ja-JP/platforms/ios)
- [Nodes](/ja-JP/nodes)
- [Android Node のトラブルシューティング](/ja-JP/nodes/troubleshooting)

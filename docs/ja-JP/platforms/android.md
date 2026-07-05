---
read_when:
    - Android ノードのペアリングまたは再接続
    - Android Gateway の検出または認証のデバッグ
    - チャット履歴の同等性をクライアント間で検証する
summary: 'Android アプリ (node): 接続ランブック + Connect/Chat/Voice/Canvas コマンドサーフェス'
title: Androidアプリ
x-i18n:
    generated_at: "2026-07-05T11:34:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a6eb5e4028c9b53f77f97335773adf6e7f4aec422eaad728566e0b9a98962f1
    source_path: platforms/android.md
    workflow: 16
---

<Note>
公式 Android アプリは [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) で入手できます。これはコンパニオンノードであり、実行中の OpenClaw Gateway が必要です。ソース: [apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android)（[ビルド手順](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)）。
</Note>

## サポート概要

- 役割: コンパニオンノードアプリ（Android は Gateway をホストしません）。
- Gateway 必須: はい（macOS、Linux、または WSL2 経由の Windows で実行します）。
- インストール: アプリは [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN)、Gateway は [はじめに](/ja-JP/start/getting-started)、その後 [ペアリング](/ja-JP/channels/pairing)。
- Gateway: [ランブック](/ja-JP/gateway) + [設定](/ja-JP/gateway/configuration)。
  - プロトコル: [Gateway プロトコル](/ja-JP/gateway/protocol)（ノード + コントロールプレーン）。

システム制御（launchd/systemd）は Gateway ホスト上にあります — [Gateway](/ja-JP/gateway) を参照してください。

## 接続ランブック

Android ノードアプリ ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android は Gateway WebSocket に直接接続し、デバイスペアリング（`role: node`）を使用します。

Tailscale または公開ホストの場合、Android にはセキュアなエンドポイントが必要です。

- 推奨: Tailscale Serve / Funnel と `https://<magicdns>` / `wss://<magicdns>`
- これもサポート: 実際の TLS エンドポイントを持つその他の `wss://` Gateway URL
- 平文の `ws://` は、プライベート LAN アドレス / `.local` ホストに加え、`localhost`、`127.0.0.1`、Android エミュレータブリッジ（`10.0.2.2`）で引き続きサポートされます

### 前提条件

- 別のマシン上で Gateway が実行中（または SSH 経由で到達可能）。
- Android デバイス/エミュレータが gateway WebSocket に到達できること:
  - mDNS/NSD を使う同一 LAN、**または**
  - Wide-Area Bonjour / ユニキャスト DNS-SD を使う同一 Tailscale tailnet（下記参照）、**または**
  - 手動 gateway ホスト/ポート（フォールバック）
- Tailnet/公開モバイルペアリングでは、生の tailnet IP `ws://` エンドポイントは使用しません。代わりに Tailscale Serve または別の `wss://` URL を使用してください。
- ペアリングリクエストを承認するため、gateway マシン上（または SSH 経由）で `openclaw` CLI が利用可能であること。

### 1. Gateway を起動する

```bash
openclaw gateway --port 18789 --verbose
```

ログに次のような内容が表示されることを確認します。

- `listening on ws://0.0.0.0:18789`

Tailscale 経由でリモート Android アクセスを行う場合、生の tailnet バインドではなく Serve/Funnel を推奨します。

```bash
openclaw gateway --tailscale serve
```

これにより、Android にセキュアな `wss://` / `https://` エンドポイントが提供されます。初回のリモート Android ペアリングでは、別途 TLS を終端しない限り、単純な `gateway.bind: "tailnet"` 設定だけでは不十分です。

### 2. 検出を確認する（任意）

gateway マシンから:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

追加のデバッグメモ: [Bonjour](/ja-JP/gateway/bonjour)。

wide-area 検出ドメインも設定している場合は、次と比較します。

```bash
openclaw gateway discover --json
```

これは TXT のみのヒントではなく解決済みのサービスエンドポイントを使用し、`local.` と設定済みの wide-area ドメインを 1 回で表示します。

#### ユニキャスト DNS-SD によるクロスネットワーク検出

Android の NSD/mDNS 検出はネットワークをまたぎません。Android ノードと gateway が別々のネットワーク上にあり、Tailscale で接続されている場合は、代わりに Wide-Area Bonjour / ユニキャスト DNS-SD を使用します。検出だけでは tailnet/公開 Android ペアリングには十分ではありません。検出された経路には引き続きセキュアなエンドポイント（`wss://` または Tailscale Serve）が必要です。

1. gateway ホスト上に DNS-SD ゾーン（例: `openclaw.internal.`）を設定し、`_openclaw-gw._tcp` レコードを公開します。
2. 選択したドメインについて、その DNS サーバーを指す Tailscale split DNS を設定します。

詳細と CoreDNS 設定例: [Bonjour](/ja-JP/gateway/bonjour)。

### 3. Android から接続する

Android アプリ内:

- アプリは **foreground service**（永続通知）を介して gateway 接続を維持します。
- **Connect** タブを開きます。
- **Setup Code** または **Manual** モードを使用します。
- 検出がブロックされている場合は、**Advanced controls** で手動ホスト/ポートを使用します。プライベート LAN ホストでは `ws://` が引き続き機能します。Tailscale/公開ホストでは、TLS をオンにして `wss://` / Tailscale Serve エンドポイントを使用します。

初回ペアリングが成功した後、Android は起動時に自動再接続します。手動エンドポイント（有効な場合）、それ以外は最後に検出された gateway（ベストエフォート）です。

### Presence alive ビーコン

認証済みノードセッションが接続された後、foreground service がまだ接続中のままアプリがバックグラウンドに移動すると、Android は `event: "node.presence.alive"` を指定して `node.event` を呼び出します。gateway は、認証済みノードデバイス ID が判明した後にのみ、ペアリング済みノード/デバイスメタデータ上の `lastSeenAtMs`/`lastSeenReason` としてこれを記録します。

アプリは、gateway レスポンスに `handled: true` が含まれる場合にのみ、ビーコンが正常に記録されたとカウントします。古い gateway は `{ "ok": true }` で `node.event` を確認応答する場合があります。このレスポンスには互換性がありますが、永続的な最終確認時刻の更新としてはカウントされません。

### 4. ペアリングを承認する（CLI）

gateway マシン上で:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

ペアリングの詳細: [ペアリング](/ja-JP/channels/pairing)。

任意: Android ノードが常に厳密に制御されたサブネットから接続する場合、明示的な CIDR または正確な IP を指定して初回ノード自動承認にオプトインできます。

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

これはデフォルトで無効です。要求スコープのない新規の `role: node` ペアリングにのみ適用されます。オペレーター/ブラウザのペアリング、およびロール、スコープ、メタデータ、公開鍵の変更は、引き続き手動承認が必要です。

### 5. ノードが接続されていることを確認する

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. チャット + 履歴

Android の Chat タブはセッション選択（デフォルト `main`、およびその他の既存セッション）をサポートします。

- 履歴: `chat.history`（表示用に正規化済み — インラインディレクティブタグ、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`、および切り詰められたバリアント）、漏えいした ASCII/全角モデル制御トークンは削除されます。正確な `NO_REPLY` / `no_reply` などのサイレントトークン assistant 行は省略されます。過大な行はプレースホルダーに置き換えられる場合があります）
- 送信: `chat.send`
- プッシュ更新（ベストエフォート）: `chat.subscribe` -> `event:"chat"`

### 7. Canvas + カメラ

#### Gateway Canvas ホスト（Web コンテンツに推奨）

エージェントがディスク上で編集できる実際の HTML/CSS/JS をノードに表示させるには、ノードを Gateway canvas ホストに向けます。

<Note>
ノードは Gateway HTTP サーバー（`gateway.port` と同じポート、デフォルト `18789`）から canvas を読み込みます。
</Note>

1. gateway ホスト上に `~/.openclaw/workspace/canvas/index.html` を作成します。
2. ノードをそこに移動します（LAN）:

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet（任意）: 両方のデバイスが Tailscale 上にある場合は、`.local` の代わりに MagicDNS 名または tailnet IP を使用します。例: `http://<gateway-magicdns>:18789/__openclaw__/canvas/`。

このサーバーは HTML にライブリロードクライアントを注入し、ファイル変更時に再読み込みします。Gateway は `/__openclaw__/a2ui/` も提供しますが、Android アプリはリモート A2UI ページをレンダリング専用として扱います。アクション対応の A2UI コマンドは、バンドルされたアプリ所有の A2UI ページを使用します。

Canvas コマンド（フォアグラウンドのみ）:

- `canvas.eval`、`canvas.snapshot`、`canvas.navigate`（デフォルトの scaffold に戻るには `{"url":""}` または `{"url":"/"}` を使用します）。`canvas.snapshot` は `{ format, base64 }` を返します（デフォルト `format="jpeg"`）。
- A2UI: `canvas.a2ui.push`、`canvas.a2ui.reset`（`canvas.a2ui.pushJSONL` レガシーエイリアス）。これらは、アクション対応レンダリングにバンドルされたアプリ所有の A2UI ページを使用します。

カメラコマンド（フォアグラウンドのみ、権限で制御）: `camera.snap`（jpg）、`camera.clip`（mp4）。パラメータと CLI ヘルパーについては [Camera node](/ja-JP/nodes/camera) を参照してください。

### 8. 音声 + 拡張 Android コマンドサーフェス

- Voice タブ: Android には 2 つの明示的なキャプチャモードがあります。**Mic** は手動の Voice タブセッションで、各ポーズをチャットターンとして送信し、アプリがフォアグラウンドを離れるかユーザーが Voice タブを離れると停止します。**Talk** は継続的な Talk Mode で、オフに切り替えられるかノードが切断されるまでリスニングを続けます。
- Talk Mode は、キャプチャ開始前に既存の foreground service を `connectedDevice` から `connectedDevice|microphone` に昇格し、Talk Mode 停止時に降格します。ノードサービスは `CHANGE_NETWORK_STATE` とともに `FOREGROUND_SERVICE_CONNECTED_DEVICE` を宣言します。Android 14+ ではさらに、`FOREGROUND_SERVICE_MICROPHONE` 宣言、`RECORD_AUDIO` ランタイム許可、実行時の microphone サービスタイプが必要です。
- デフォルトでは、Android Talk はネイティブ音声認識、Gateway チャット、および設定済み gateway Talk プロバイダー経由の `talk.speak` を使用します。ローカルシステム TTS は `talk.speak` が利用できない場合にのみ使用されます。
- Android Talk は、`talk.realtime.mode` が `realtime` で、`talk.realtime.transport` が `gateway-relay` の場合にのみ、リアルタイム Gateway リレーを使用します。
- Voice wake はソース（`VoiceWakeMode`）に実装されていますが、出荷中のアプリランタイムは接続時に常に `off` を強制します。現時点でユーザー向けトグルはありません。
- 追加の Android コマンドファミリー（利用可否はデバイス、権限、ユーザー設定に依存します）:
  - `device.status`、`device.info`、`device.permissions`、`device.health`
  - `device.apps` は **Settings > Phone Capabilities > Installed Apps** が有効な場合のみ。デフォルトではランチャーに表示されるアプリを一覧表示します（完全な一覧には `includeNonLaunchable` を渡します）。
  - `notifications.list`、`notifications.actions`（下記の [通知転送](#notification-forwarding) を参照）
  - `photos.latest`
  - `contacts.search`、`contacts.add`
  - `calendar.events`、`calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`、`motion.pedometer`

## Assistant エントリポイント

Android は、システムアシスタントトリガー（Google Assistant）から OpenClaw を起動することをサポートします。ホームボタンを長押しする（または別の `ACTION_ASSIST` トリガーを使う）とアプリが開きます。「Hey Google, ask OpenClaw `<prompt>`」と言うと、アプリが宣言した App Actions クエリパターンに一致し、プロンプトがチャットコンポーザーに渡されますが、自動送信はされません。

これは、アプリマニフェストで宣言された Android **App Actions**（`shortcuts.xml` capability）を使用します。gateway 側の設定は不要です。assistant intent は完全に Android アプリ内で処理されます。

<Note>
App Actions の利用可否は、デバイス、Google Play Services のバージョン、ユーザーが OpenClaw をデフォルトの assistant アプリに設定しているかどうかに依存します。
</Note>

## 通知転送

Android はデバイス通知を `node.event` 項目として gateway に転送できます。これは gateway/`openclaw.json` 設定ではなく、アプリの Settings シート内で**デバイス上**に設定します。

| 設定                        | 説明                                                                                                                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 通知イベントの転送          | マスタートグル。デフォルトではオフ。先に通知リスナーアクセスを付与する必要があります。                                                                                                               |
| パッケージフィルター        | **許可リスト**（一覧にあるパッケージ ID のみ転送）または **ブロックリスト**（デフォルト: 一覧にある ID 以外のすべてのパッケージ）。転送ループを防ぐため、ブロックリストモードでは OpenClaw 自身のパッケージは常に除外されます。 |
| 静音時間                    | 転送を抑制するローカルの HH:mm 開始/終了ウィンドウ。デフォルトでは無効。有効化するとデフォルトは `22:00`-`07:00` になります。                                                                        |
| 最大イベント数 / 分         | 転送される通知のデバイスごとのレート制限。デフォルトは 20。                                                                                                                                          |
| ルートセッションキー        | 任意。転送された通知イベントを、デバイスのデフォルト通知ルートではなく特定のセッションに固定します。                                                                                                 |

<Note>
通知転送には Android の通知リスナー権限が必要です。アプリはセットアップ中にこれを求めます。
</Note>

## 関連

- [iOS アプリ](/ja-JP/platforms/ios)
- [ノード](/ja-JP/nodes)
- [Android ノードのトラブルシューティング](/ja-JP/nodes/troubleshooting)

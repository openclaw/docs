---
read_when:
    - Android nodeのpairingまたは再接続
    - Android gateway discoveryまたはauthのデバッグ
    - クライアント間でチャット履歴の同等性を検証する
summary: 'Android app（node）: 接続ランブック + Connect/Chat/Voice/Canvasコマンドsurface'
title: Android app
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:35:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a47c07e3301ad7b98f4827c9c34c42b7ba2f92c55aabd7b49606ab688191b66
    source_path: platforms/android.md
    workflow: 15
---

> **注:** Androidアプリはまだ一般公開されていません。ソースコードは [OpenClaw repository](https://github.com/openclaw/openclaw) の `apps/android` 以下で公開されています。Java 17 と Android SDK を使って自分でビルドできます（`./gradlew :app:assemblePlayDebug`）。ビルド手順については [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) を参照してください。

## サポート概要

- 役割: コンパニオンNodeアプリ（AndroidはGatewayをホストしません）。
- Gatewayが必要: はい（macOS、Linux、または Windows の WSL2 上で実行します）。
- インストール: [はじめに](/ja-JP/start/getting-started) + [ペアリング](/ja-JP/channels/pairing)。
- Gateway: [Runbook](/ja-JP/gateway) + [設定](/ja-JP/gateway/configuration)。
  - プロトコル: [Gatewayプロトコル](/ja-JP/gateway/protocol)（nodes + control plane）。

## システム制御

システム制御（launchd/systemd）はGatewayホスト上にあります。[Gateway](/ja-JP/gateway) を参照してください。

## 接続Runbook

Android node app ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

AndroidはGateway WebSocketに直接接続し、デバイスペアリング（`role: node`）を使用します。

Tailscale または公開ホストでは、Androidにはセキュアなエンドポイントが必要です。

- 推奨: `https://<magicdns>` / `wss://<magicdns>` を使う Tailscale Serve / Funnel
- こちらもサポート: 実際のTLSエンドポイントを持つその他の `wss://` Gateway URL
- 平文の `ws://` は、プライベートLANアドレス / `.local` ホスト、および `localhost`、`127.0.0.1`、Androidエミュレーターブリッジ（`10.0.2.2`）では引き続きサポートされます

### 前提条件

- 「master」マシン上でGatewayを実行できること。
- Androidデバイス / エミュレーターがgateway WebSocketに到達できること:
  - mDNS/NSD を使った同一LAN上、**または**
  - Wide-Area Bonjour / unicast DNS-SD を使った同一 Tailscale tailnet 上（下記参照）、**または**
  - 手動のgateway host/port（フォールバック）
- tailnet / 公開モバイルペアリングでは、生のtailnet IP `ws://` エンドポイントは**使用しません**。代わりに Tailscale Serve または別の `wss://` URL を使用してください。
- gatewayマシン上でCLI（`openclaw`）を実行できること（または SSH 経由）。

### 1) Gatewayを起動する

```bash
openclaw gateway --port 18789 --verbose
```

ログに次のような内容が表示されることを確認してください。

- `listening on ws://0.0.0.0:18789`

Tailscale 経由でAndroidからリモートアクセスする場合は、生のtailnet bindではなく Serve / Funnel を推奨します。

```bash
openclaw gateway --tailscale serve
```

これにより、Androidにセキュアな `wss://` / `https://` エンドポイントが提供されます。プレーンな `gateway.bind: "tailnet"` 設定だけでは、TLSを別途終端しない限り、初回のリモートAndroidペアリングには不十分です。

### 2) 検出を確認する（任意）

gatewayマシンから:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

デバッグに関する詳細は: [Bonjour](/ja-JP/gateway/bonjour)。

Wide-Area discovery domain も設定している場合は、次と比較してください。

```bash
openclaw gateway discover --json
```

これにより、`local.` と設定済みのwide-area domainが1回で表示され、TXTのみのヒントではなく解決済みの
service endpointが使われます。

#### unicast DNS-SD による tailnet（Vienna ⇄ London）検出

Androidの NSD/mDNS 検出はネットワークをまたげません。Android node と gateway が別ネットワークにありつつ Tailscale で接続されている場合は、代わりに Wide-Area Bonjour / unicast DNS-SD を使用してください。

検出だけでは tailnet / 公開Androidペアリングには不十分です。検出された経路でも、引き続きセキュアなエンドポイント（`wss://` または Tailscale Serve）が必要です。

1. gatewayホスト上に DNS-SD zone（例: `openclaw.internal.`）をセットアップし、`_openclaw-gw._tcp` レコードを公開します。
2. そのDNSサーバーを向くように、選択したdomainに対する Tailscale split DNS を設定します。

詳細と CoreDNS 設定例は: [Bonjour](/ja-JP/gateway/bonjour)。

### 3) Androidから接続する

Androidアプリで:

- アプリは **foreground service**（常駐通知）を通じてgateway接続を維持します。
- **Connect** タブを開きます。
- **Setup Code** または **Manual** モードを使います。
- 検出がブロックされる場合は、**Advanced controls** で手動の host/port を使います。プライベートLANホストでは `ws://` が引き続き使えます。Tailscale / 公開ホストでは、TLSを有効にして `wss://` / Tailscale Serve エンドポイントを使ってください。

最初のペアリングが成功すると、Androidは起動時に自動再接続します。

- 手動エンドポイント（有効な場合）、それ以外では
- 最後に検出されたgateway（ベストエフォート）。

### 4) ペアリングを承認する（CLI）

gatewayマシン上で:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

ペアリングの詳細: [ペアリング](/ja-JP/channels/pairing)。

任意: Android node が常に厳密に管理されたサブネットから接続する場合、
明示的なCIDRまたは完全一致IPを使って、初回のnode自動承認を有効化できます。

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

これはデフォルトでは無効です。適用対象は、要求されたスコープがない
新規の `role: node` ペアリングのみです。operator/browserペアリング、および role、scope、metadata、または
公開鍵に変更がある場合は、引き続き手動承認が必要です。

### 5) node が接続されていることを確認する

- nodes のステータス経由:

  ```bash
  openclaw nodes status
  ```

- Gateway 経由:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) チャット + 履歴

AndroidのChatタブはセッション選択をサポートしています（デフォルトは `main`、加えて既存の他セッションも使用可能）。

- 履歴: `chat.history`（表示用に正規化済み。インライン directive tag は
  表示テキストから除去され、プレーンテキストのtool-call XML payload（
  `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、
  `<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および
  途中で切り詰められたtool-callブロックを含む）や、漏出した ASCII / 全角の model control token
  は除去され、正確に `NO_REPLY` / `no_reply` である純粋な silent-token assistant row は省略され、
  サイズが大きすぎる row はプレースホルダーに置き換えられる場合があります）
- 送信: `chat.send`
- 更新のプッシュ（ベストエフォート）: `chat.subscribe` → `event:"chat"`

### 7) Canvas + カメラ

#### Gateway Canvas Host（Webコンテンツ向け推奨）

node に、エージェントがディスク上で編集できる実際の HTML/CSS/JS を表示させたい場合は、node を Gateway canvas host に向けてください。

注: nodes は Gateway HTTP サーバー（`gateway.port` と同じポート、デフォルト `18789`）から canvas を読み込みます。

1. gatewayホスト上に `~/.openclaw/workspace/canvas/index.html` を作成します。

2. node をそこへ移動させます（LAN）:

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

tailnet（任意）: 両方のデバイスが Tailscale 上にある場合は、`.local` の代わりに MagicDNS 名または tailnet IP を使います。例: `http://<gateway-magicdns>:18789/__openclaw__/canvas/`。

このサーバーは live-reload client を HTML に注入し、ファイル変更時に再読み込みします。
A2UI host は `http://<gateway-host>:18789/__openclaw__/a2ui/` にあります。

Canvas コマンド（フォアグラウンド時のみ）:

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate`（デフォルトの scaffold に戻るには `{"url":""}` または `{"url":"/"}` を使います）。`canvas.snapshot` は `{ format, base64 }` を返します（デフォルト `format="jpeg"`）。
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset`（`canvas.a2ui.pushJSONL` は従来のエイリアス）

カメラコマンド（フォアグラウンド時のみ、権限による制御あり）:

- `camera.snap`（jpg）
- `camera.clip`（mp4）

パラメータとCLIヘルパーについては [Camera node](/ja-JP/nodes/camera) を参照してください。

### 8) 音声 + 拡張されたAndroidコマンドサーフェス

- Voiceタブ: Androidには2つの明示的なキャプチャモードがあります。**Mic** は手動のVoiceタブセッションで、各ポーズを1つのチャットターンとして送信し、アプリがフォアグラウンドを離れるか、ユーザーがVoiceタブを離れると停止します。**Talk** は継続的なTalk Modeで、オフに切り替えるか node が切断されるまで聞き続けます。
- Talk Mode は、キャプチャ開始前に既存の foreground service を `dataSync` から `dataSync|microphone` に昇格し、Talk Mode 停止時に元へ戻します。Android 14+ では、`FOREGROUND_SERVICE_MICROPHONE` 宣言、`RECORD_AUDIO` のランタイム許可、および実行時の microphone service type が必要です。
- 音声応答では、設定されたgateway Talk providerを通じて `talk.speak` を使用します。ローカルのシステムTTSは、`talk.speak` が利用できない場合にのみ使われます。
- 音声ウェイクは Android の UX / ランタイムでは引き続き無効です。
- 追加のAndroidコマンドファミリー（利用可否はデバイス + 権限に依存）:
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions`（下記の [通知転送](#notification-forwarding) を参照）
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## アシスタントのエントリーポイント

Androidは、システムのアシスタント起動トリガー（Google
Assistant）からの OpenClaw 起動をサポートしています。設定すると、
ホームボタンを長押しするか、「Hey Google, ask
OpenClaw...」と言うことでアプリが開き、プロンプトがチャットコンポーザーに渡されます。

これは、アプリマニフェストで宣言された Android の **App Actions** metadata を使用します。gateway側で
追加設定は不要です。assistant intent は完全に Android アプリ側で処理され、
通常のチャットメッセージとして転送されます。

<Note>
App Actions を利用できるかどうかは、デバイス、Google Play Services のバージョン、
およびユーザーが OpenClaw をデフォルトの assistant app に設定しているかどうかに依存します。
</Note>

## 通知転送

Androidは、デバイス通知をイベントとしてgatewayに転送できます。いくつかの制御項目により、どの通知をいつ転送するかの範囲を指定できます。

| Key                              | Type           | Description                                                                 |
| -------------------------------- | -------------- | --------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | これらのパッケージ名からの通知のみを転送します。設定されている場合、その他すべてのパッケージは無視されます。 |
| `notifications.denyPackages`     | string[]       | これらのパッケージ名からの通知は絶対に転送しません。`allowPackages` の後に適用されます。 |
| `notifications.quietHours.start` | string (HH:mm) | サイレント時間帯の開始（デバイスのローカル時刻）。この時間帯の通知は抑制されます。 |
| `notifications.quietHours.end`   | string (HH:mm) | サイレント時間帯の終了。 |
| `notifications.rateLimit`        | number         | パッケージごと・1分あたりに転送する通知の最大数。超過した通知は破棄されます。 |

通知ピッカーは、転送される通知イベントに対してより安全な動作も使用し、機密性の高いシステム通知が誤って転送されるのを防ぎます。

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
通知転送には Android の Notification Listener 権限が必要です。アプリはセットアップ中にこの権限を要求します。
</Note>

## 関連

- [iOS app](/ja-JP/platforms/ios)
- [Nodes](/ja-JP/nodes)
- [Android node troubleshooting](/ja-JP/nodes/troubleshooting)

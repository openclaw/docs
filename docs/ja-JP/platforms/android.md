---
read_when:
    - Androidノードのペアリングまたは再接続
    - Android Gateway の検出または認証のデバッグ
    - クライアント間のチャット履歴の同等性を検証する
summary: 'Android アプリ (node): 接続ランブック + Connect/Chat/Voice/Canvas コマンドサーフェス'
title: Android アプリ
x-i18n:
    generated_at: "2026-04-30T05:22:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: ae8bec406a006165f124f305e00c848f5527d43dba3cbcd07bd0d7e6f0dcc247
    source_path: platforms/android.md
    workflow: 16
---

<Note>
Android アプリはまだ一般公開されていません。ソースコードは [OpenClaw repository](https://github.com/openclaw/openclaw) の `apps/android` にあります。Java 17 と Android SDK (`./gradlew :app:assemblePlayDebug`) を使って自分でビルドできます。ビルド手順は [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) を参照してください。
</Note>

## サポート状況

- 役割: コンパニオン Node アプリ (Android は Gateway をホストしません)。
- Gateway 必須: はい (macOS、Linux、または WSL2 経由の Windows で実行します)。
- インストール: [はじめに](/ja-JP/start/getting-started) + [ペアリング](/ja-JP/channels/pairing)。
- Gateway: [ランブック](/ja-JP/gateway) + [設定](/ja-JP/gateway/configuration)。
  - プロトコル: [Gateway プロトコル](/ja-JP/gateway/protocol) (Node + コントロールプレーン)。

## システム制御

システム制御 (launchd/systemd) は Gateway ホスト上にあります。[Gateway](/ja-JP/gateway) を参照してください。

## 接続ランブック

Android Node アプリ ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android は Gateway WebSocket に直接接続し、デバイスペアリング (`role: node`) を使用します。

Tailscale または公開ホストでは、Android にセキュアなエンドポイントが必要です。

- 推奨: `https://<magicdns>` / `wss://<magicdns>` を使う Tailscale Serve / Funnel
- こちらもサポート: 実際の TLS エンドポイントを持つその他の `wss://` Gateway URL
- 平文の `ws://` は、プライベート LAN アドレス / `.local` ホストに加え、`localhost`、`127.0.0.1`、Android エミュレーターのブリッジ (`10.0.2.2`) で引き続きサポートされます

### 前提条件

- 「マスター」マシンで Gateway を実行できる。
- Android デバイス/エミュレーターが Gateway WebSocket に到達できる。
  - mDNS/NSD を使う同一 LAN、**または**
  - Wide-Area Bonjour / ユニキャスト DNS-SD を使う同じ Tailscale tailnet (下記参照)、**または**
  - 手動の Gateway ホスト/ポート (フォールバック)
- Tailnet/公開モバイルペアリングでは、生の tailnet IP の `ws://` エンドポイントは使用しません。代わりに Tailscale Serve または別の `wss://` URL を使用してください。
- Gateway マシン上で (または SSH 経由で) CLI (`openclaw`) を実行できる。

### 1) Gateway を起動する

```bash
openclaw gateway --port 18789 --verbose
```

ログで次のような表示があることを確認します。

- `listening on ws://0.0.0.0:18789`

Tailscale 経由で Android からリモートアクセスする場合は、生の tailnet バインドではなく Serve/Funnel を推奨します。

```bash
openclaw gateway --tailscale serve
```

これにより Android にセキュアな `wss://` / `https://` エンドポイントが提供されます。単純な `gateway.bind: "tailnet"` 設定だけでは、TLS を別途終端しない限り、初回のリモート Android ペアリングには十分ではありません。

### 2) 検出を確認する (任意)

Gateway マシンから:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

追加のデバッグメモ: [Bonjour](/ja-JP/gateway/bonjour)。

Wide-area 検出ドメインも設定している場合は、次と比較します。

```bash
openclaw gateway discover --json
```

これにより `local.` と設定済みの wide-area ドメインが 1 回で表示され、TXT のみのヒントではなく解決済みのサービスエンドポイントが使用されます。

#### ユニキャスト DNS-SD による Tailnet (ウィーン ⇄ ロンドン) 検出

Android の NSD/mDNS 検出はネットワークを越えません。Android Node と Gateway が異なるネットワーク上にあり、Tailscale で接続されている場合は、代わりに Wide-Area Bonjour / ユニキャスト DNS-SD を使用してください。

検出だけでは tailnet/公開 Android ペアリングには不十分です。検出された経路にも、セキュアなエンドポイント (`wss://` または Tailscale Serve) が必要です。

1. Gateway ホスト上に DNS-SD ゾーン (例: `openclaw.internal.`) を設定し、`_openclaw-gw._tcp` レコードを公開します。
2. 選択したドメインについて、その DNS サーバーを指す Tailscale split DNS を設定します。

詳細と CoreDNS 設定例: [Bonjour](/ja-JP/gateway/bonjour)。

### 3) Android から接続する

Android アプリで:

- アプリは **foreground service** (永続通知) により Gateway 接続を維持します。
- **Connect** タブを開きます。
- **Setup Code** または **Manual** モードを使用します。
- 検出がブロックされている場合は、**Advanced controls** で手動のホスト/ポートを使用します。プライベート LAN ホストでは `ws://` が引き続き動作します。Tailscale/公開ホストでは TLS を有効にし、`wss://` / Tailscale Serve エンドポイントを使用します。

初回のペアリングに成功した後、Android は起動時に自動再接続します。

- 手動エンドポイント (有効な場合)、それ以外は
- 最後に検出された Gateway (ベストエフォート)。

### Presence alive ビーコン

認証済み Node セッションが接続した後、foreground service がまだ接続されている状態でアプリがバックグラウンドに移動すると、Android は `event: "node.presence.alive"` を指定して `node.event` を呼び出します。Gateway は、認証済み Node デバイス ID が判明した後にのみ、これをペアリング済み Node/デバイスメタデータの `lastSeenAtMs`/`lastSeenReason` として記録します。

アプリは、Gateway レスポンスに `handled: true` が含まれる場合にのみ、ビーコンが正常に記録されたものとして扱います。古い Gateway は `{ "ok": true }` で `node.event` を確認応答する場合があります。このレスポンスには互換性がありますが、永続的な last-seen 更新としてはカウントされません。

### 4) ペアリングを承認する (CLI)

Gateway マシン上で:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

ペアリングの詳細: [ペアリング](/ja-JP/channels/pairing)。

任意: Android Node が常に厳密に制御されたサブネットから接続する場合は、明示的な CIDR または正確な IP を指定して、初回の Node 自動承認を有効にできます。

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

これはデフォルトで無効です。要求されたスコープがない新規の `role: node` ペアリングにのみ適用されます。オペレーター/ブラウザのペアリング、および role、scope、metadata、または公開鍵の変更には、引き続き手動承認が必要です。

### 5) Node が接続されていることを確認する

- Node ステータス経由:

  ```bash
  openclaw nodes status
  ```

- Gateway 経由:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) チャット + 履歴

Android の Chat タブはセッション選択をサポートしています (デフォルトは `main`、加えて既存の他セッション)。

- 履歴: `chat.history` (表示用に正規化済み。インラインディレクティブタグは表示テキストから除去され、プレーンテキストのツール呼び出し XML ペイロード (`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む) と、漏れた ASCII/全角のモデル制御トークンは除去され、完全一致の `NO_REPLY` / `no_reply` など純粋なサイレントトークンの assistant 行は省略され、過大な行はプレースホルダーに置き換えられる場合があります)
- 送信: `chat.send`
- プッシュ更新 (ベストエフォート): `chat.subscribe` → `event:"chat"`

### 7) Canvas + カメラ

#### Gateway Canvas Host (Web コンテンツに推奨)

Node に、エージェントがディスク上で編集できる実際の HTML/CSS/JS を表示させたい場合は、Node を Gateway Canvas Host に向けます。

<Note>
Node は Gateway HTTP サーバー (`gateway.port` と同じポート、デフォルトは `18789`) から Canvas を読み込みます。
</Note>

1. Gateway ホスト上に `~/.openclaw/workspace/canvas/index.html` を作成します。

2. Node をそこへ移動させます (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (任意): 両方のデバイスが Tailscale 上にある場合は、`.local` の代わりに MagicDNS 名または tailnet IP を使用します。例: `http://<gateway-magicdns>:18789/__openclaw__/canvas/`。

このサーバーは live-reload クライアントを HTML に注入し、ファイル変更時に再読み込みします。
A2UI ホストは `http://<gateway-host>:18789/__openclaw__/a2ui/` にあります。

Canvas コマンド (フォアグラウンドのみ):

- `canvas.eval`、`canvas.snapshot`、`canvas.navigate` (デフォルトのスキャフォールドに戻るには `{"url":""}` または `{"url":"/"}` を使用します)。`canvas.snapshot` は `{ format, base64 }` を返します (デフォルトは `format="jpeg"`)。
- A2UI: `canvas.a2ui.push`、`canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` はレガシーエイリアス)

カメラコマンド (フォアグラウンドのみ、権限で制御):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

パラメーターと CLI ヘルパーについては [Camera Node](/ja-JP/nodes/camera) を参照してください。

### 8) 音声 + 拡張された Android コマンドサーフェス

- Voice タブ: Android には 2 つの明示的なキャプチャモードがあります。**Mic** は手動の Voice タブセッションで、各ポーズをチャットターンとして送信し、アプリがフォアグラウンドを離れるかユーザーが Voice タブを離れると停止します。**Talk** は継続的な Talk Mode で、オフに切り替えるか Node が切断されるまでリスニングを続けます。
- Talk Mode はキャプチャ開始前に既存の foreground service を `dataSync` から `dataSync|microphone` に昇格し、Talk Mode 停止時に元に戻します。Android 14+ では、`FOREGROUND_SERVICE_MICROPHONE` 宣言、`RECORD_AUDIO` ランタイム許可、および実行時の microphone service type が必要です。
- 音声応答は、設定済みの Gateway Talk プロバイダーを通じて `talk.speak` を使用します。ローカルシステム TTS は、`talk.speak` が利用できない場合にのみ使用されます。
- 音声ウェイクは Android UX/ランタイムで無効のままです。
- 追加の Android コマンドファミリー (利用可否はデバイス + 権限に依存):
  - `device.status`、`device.info`、`device.permissions`、`device.health`
  - `notifications.list`、`notifications.actions` (下記の [通知転送](#notification-forwarding) を参照)
  - `photos.latest`
  - `contacts.search`、`contacts.add`
  - `calendar.events`、`calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`、`motion.pedometer`

## Assistant エントリーポイント

Android は、システム assistant トリガー (Google Assistant) から OpenClaw を起動することをサポートしています。設定すると、ホームボタンを長押しするか、「Hey Google, ask OpenClaw...」と言うことでアプリが開き、プロンプトがチャットコンポーザーに渡されます。

これは、アプリマニフェストで宣言された Android **App Actions** メタデータを使用します。Gateway 側で追加の設定は不要です。assistant intent は Android アプリ内で完全に処理され、通常のチャットメッセージとして転送されます。

<Note>
App Actions の利用可否は、デバイス、Google Play Services のバージョン、およびユーザーが OpenClaw をデフォルトの assistant アプリに設定しているかどうかに依存します。
</Note>

## 通知転送

Android はデバイス通知をイベントとして Gateway に転送できます。どの通知をいつ転送するかをスコープ指定できる制御がいくつかあります。

| キー                             | 型             | 説明                                                                                              |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | これらのパッケージ名からの通知のみを転送します。設定されている場合、他のすべてのパッケージは無視されます。 |
| `notifications.denyPackages`     | string[]       | これらのパッケージ名からの通知は決して転送しません。`allowPackages` の後に適用されます。           |
| `notifications.quietHours.start` | string (HH:mm) | 静音時間帯の開始 (ローカルデバイス時刻)。この時間帯中は通知が抑制されます。                       |
| `notifications.quietHours.end`   | string (HH:mm) | 静音時間帯の終了。                                                                                |
| `notifications.rateLimit`        | number         | パッケージごとの 1 分あたりの最大転送通知数。超過した通知は破棄されます。                         |

通知ピッカーは、転送される通知イベントに対してより安全な動作も使用し、機密性の高いシステム通知の誤転送を防ぎます。

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
通知転送には Android Notification Listener 権限が必要です。アプリはセットアップ中にこれを求めます。
</Note>

## 関連

- [iOS アプリ](/ja-JP/platforms/ios)
- [Nodes](/ja-JP/nodes)
- [Android Node トラブルシューティング](/ja-JP/nodes/troubleshooting)

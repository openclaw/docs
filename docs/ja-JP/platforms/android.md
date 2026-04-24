---
read_when:
    - |-
      Android Nodeのペアリングまたは再接続＿日本assistant to=functions.read კომენტary  ฝ่ายขายออนไลน์ 】【。】【”】【json
      {"path":"/home/runner/work/docs/docs/source/docs/AGENTS.md","offset":1,"limit":200}
    - Android gateway discoveryまたは認証をデバッグしている場合
    - クライアント間でチャット履歴の同等性を検証している場合
summary: 'Androidアプリ（Node）: 接続ランブック + Connect/Chat/Voice/Canvasコマンドインターフェース'
title: |-
    Androidアプリ＿日本assistant to=functions.read  კომენტary 夫妻性生活影片  北京赛车开 招商总代  天天中彩票不_JSON  天天中彩票提现  ฝ่ายขายข่าวెలేశారు เงินไทยฟรี  ฝ่ายขายข่าว?
    {"path":"/home/runner/work/docs/docs/source/AGENTS.md","offset":1,"limit":120}
x-i18n:
    generated_at: "2026-04-24T05:07:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31b538a5bf45e78fde34e77a31384295b3e96f2fff6b3adfe37e5c569d858472
    source_path: platforms/android.md
    workflow: 15
---

> **注意:** Androidアプリはまだ一般公開されていません。ソースコードは[OpenClaw repository](https://github.com/openclaw/openclaw)の`apps/android`以下で公開されています。Java 17とAndroid SDKを使って自分でビルドできます（`./gradlew :app:assemblePlayDebug`）。ビルド手順は[apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)を参照してください。

## サポート概要

- 役割: コンパニオンNodeアプリ（AndroidはGatewayをホストしません）。
- Gateway必須: はい（macOS、Linux、またはWindowsのWSL2上で実行してください）。
- インストール: [はじめに](/ja-JP/start/getting-started) + [Pairing](/ja-JP/channels/pairing)。
- Gateway: [Runbook](/ja-JP/gateway) + [Configuration](/ja-JP/gateway/configuration)。
  - プロトコル: [Gateway protocol](/ja-JP/gateway/protocol)（Node + control plane）。

## システム制御

システム制御（launchd/systemd）はGatewayホスト側にあります。[Gateway](/ja-JP/gateway)を参照してください。

## 接続ランブック

Android Nodeアプリ ⇄（mDNS/NSD + WebSocket）⇄ **Gateway**

AndroidはGateway WebSocketへ直接接続し、デバイスペアリング（`role: node`）を使います。

Tailscaleまたは公開ホストでは、Androidには安全なエンドポイントが必要です。

- 推奨: Tailscale Serve / Funnelによる`https://<magicdns>` / `wss://<magicdns>`
- サポート対象: 実TLSエンドポイントを持つその他の`wss://` Gateway URL
- 平文の`ws://`も、プライベートLANアドレス / `.local`ホスト、さらに`localhost`、`127.0.0.1`、Androidエミュレーターブリッジ（`10.0.2.2`）では引き続きサポートされます

### 前提条件

- 「master」マシン上でGatewayを実行できること。
- Androidデバイス/エミュレーターがgateway WebSocketへ到達できること:
  - 同一LAN上でmDNS/NSDを使う、**または**
  - 同一Tailscale tailnet上でWide-Area Bonjour / unicast DNS-SDを使う（詳細は後述）、**または**
  - 手動でgateway host/portを指定する（フォールバック）
- tailnet/公開モバイルペアリングでは、生のtailnet IP `ws://`エンドポイントは使用しません。代わりにTailscale Serveまたは別の`wss://` URLを使用してください。
- gatewayマシン上でCLI（`openclaw`）を実行できること（またはSSH経由）。

### 1) Gatewayを起動する

```bash
openclaw gateway --port 18789 --verbose
```

ログに次のような表示があることを確認してください。

- `listening on ws://0.0.0.0:18789`

Tailscale経由でAndroidからリモートアクセスする場合は、生のtailnet bindではなくServe/Funnelを推奨します。

```bash
openclaw gateway --tailscale serve
```

これにより、Android向けの安全な`wss://` / `https://`エンドポイントが得られます。プレーンな`gateway.bind: "tailnet"`設定だけでは、TLSを別途終端しない限り、初回のリモートAndroidペアリングには不十分です。

### 2) discoveryを確認する（任意）

gatewayマシン上で:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

デバッグメモの詳細: [Bonjour](/ja-JP/gateway/bonjour)。

wide-area discoveryドメインも設定している場合は、次と比較してください。

```bash
openclaw gateway discover --json
```

これにより、`local.`と設定済みwide-areaドメインが1回で表示され、TXTのみのヒントではなく解決済みの
サービスエンドポイントが使われます。

#### tailnet（Vienna ⇄ London）でのunicast DNS-SD discovery

AndroidのNSD/mDNS discoveryはネットワークをまたぎません。Android Nodeとgatewayが異なるネットワーク上にありつつTailscaleで接続されている場合は、Wide-Area Bonjour / unicast DNS-SDを使用してください。

discoveryだけでは、tailnet/公開Androidペアリングには不十分です。discoveryされた経路にも引き続き安全なエンドポイント（`wss://`またはTailscale Serve）が必要です。

1. gatewayホスト上にDNS-SDゾーン（例: `openclaw.internal.`）を設定し、`_openclaw-gw._tcp`レコードを公開します。
2. そのDNSサーバーを指すように、選択したドメイン用のTailscale split DNSを設定します。

詳細およびCoreDNS設定例: [Bonjour](/ja-JP/gateway/bonjour)。

### 3) Androidから接続する

Androidアプリ内で:

- アプリは、**foreground service**（永続通知）を通じてgateway接続を維持します。
- **Connect**タブを開きます。
- **Setup Code**または**Manual**モードを使います。
- discoveryがブロックされている場合は、**Advanced controls**で手動のhost/portを使います。プライベートLANホストでは、`ws://`が引き続き使えます。Tailscale/公開ホストでは、TLSを有効にして`wss://` / Tailscale Serveエンドポイントを使用してください。

初回ペアリングが成功すると、Androidは起動時に自動再接続します。

- 手動エンドポイント（有効な場合）、それ以外では
- 最後にdiscoveryされたgateway（ベストエフォート）。

### 4) ペアリングを承認する（CLI）

gatewayマシン上で:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

ペアリング詳細: [Pairing](/ja-JP/channels/pairing)。

### 5) Nodeが接続されていることを確認する

- nodes status経由:

  ```bash
  openclaw nodes status
  ```

- Gateway経由:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) チャット + 履歴

AndroidのChatタブはセッション選択をサポートします（デフォルトの`main`に加え、既存の他のセッションも）。

- 履歴: `chat.history`（表示用に正規化済み。インラインdirectiveタグは表示テキストから
  削除され、プレーンテキストのtool-call XMLペイロード（`<tool_call>...</tool_call>`、
  `<function_call>...</function_call>`、
  `<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、
  および切り詰められたtool-callブロックを含む）や漏れたASCII/全角のモデル制御トークンは削除され、
  完全に無音トークンだけのassistant行（たとえば完全一致の`NO_REPLY` /
  `no_reply`）は省かれ、巨大すぎる行はプレースホルダーに置き換えられる場合があります）
- 送信: `chat.send`
- 更新のpush（ベストエフォート）: `chat.subscribe` → `event:"chat"`

### 7) Canvas + camera

#### Gateway Canvas Host（Webコンテンツに推奨）

Nodeに、エージェントがディスク上で編集できる実際のHTML/CSS/JSを表示させたい場合は、NodeをGateway canvas hostへ向けてください。

注意: Nodeは、Gateway HTTPサーバー（`gateway.port`と同じポート、デフォルト`18789`）からcanvasを読み込みます。

1. gatewayホスト上に`~/.openclaw/workspace/canvas/index.html`を作成します。

2. Nodeをそこへ遷移させます（LAN）:

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

tailnet（任意）: 両デバイスがTailscale上にある場合は、`.local`の代わりにMagicDNS名またはtailnet IPを使います。例: `http://<gateway-magicdns>:18789/__openclaw__/canvas/`。

このサーバーは、HTMLにlive-reload clientを注入し、ファイル変更時に再読み込みします。
A2UI hostは`http://<gateway-host>:18789/__openclaw__/a2ui/`にあります。

Canvasコマンド（foreground時のみ）:

- `canvas.eval`、`canvas.snapshot`、`canvas.navigate`（デフォルトscaffoldへ戻るには`{"url":""}`または`{"url":"/"}`を使います）。`canvas.snapshot`は`{ format, base64 }`を返します（デフォルト`format="jpeg"`）。
- A2UI: `canvas.a2ui.push`、`canvas.a2ui.reset`（`canvas.a2ui.pushJSONL`はレガシーalias）

Cameraコマンド（foreground時のみ、permission制御あり）:

- `camera.snap`（jpg）
- `camera.clip`（mp4）

パラメーターとCLIヘルパーについては[Camera node](/ja-JP/nodes/camera)を参照してください。

### 8) Voice + 拡張Androidコマンドインターフェース

- Voice: AndroidはVoiceタブで単一のマイクオン/オフフローを使い、transcript取得と`talk.speak`再生を行います。`talk.speak`が使えない場合のみローカルシステムTTSが使われます。アプリがforegroundを離れるとVoiceは停止します。
- Voice wake/talk-modeトグルは、現在AndroidのUX/ランタイムから削除されています。
- 追加のAndroidコマンドファミリー（可用性はデバイス + permissionに依存）:
  - `device.status`、`device.info`、`device.permissions`、`device.health`
  - `notifications.list`、`notifications.actions`（下記の[Notification forwarding](#notification-forwarding)を参照）
  - `photos.latest`
  - `contacts.search`、`contacts.add`
  - `calendar.events`、`calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`、`motion.pedometer`

## アシスタント起点

Androidは、システムアシスタントトリガー（Google
Assistant）からのOpenClaw起動をサポートします。設定されている場合、ホームボタン長押しまたは「Hey Google, ask
OpenClaw...」と言うとアプリが開き、プロンプトがチャットcomposerへ渡されます。

これは、アプリmanifest内で宣言されたAndroid **App Actions**メタデータを使用します。gateway側では追加設定は不要です。アシスタントintentは完全にAndroidアプリ内で処理され、通常のチャットメッセージとして転送されます。

<Note>
App Actionsの可用性は、デバイス、Google Play Servicesのバージョン、およびユーザーがOpenClawをデフォルトアシスタントアプリとして設定しているかどうかに依存します。
</Note>

## Notification forwarding

Androidは、デバイス通知をイベントとしてgatewayへ転送できます。いくつかの制御によって、どの通知をいつ転送するかの範囲を指定できます。

| キー | 型 | 説明 |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | これらのパッケージ名からの通知のみ転送します。設定されている場合、他のすべてのパッケージは無視されます。 |
| `notifications.denyPackages`     | string[]       | これらのパッケージ名からの通知は決して転送しません。`allowPackages`の後に適用されます。 |
| `notifications.quietHours.start` | string (HH:mm) | quiet hoursウィンドウの開始（ローカルデバイス時刻）。この時間帯は通知が抑止されます。 |
| `notifications.quietHours.end`   | string (HH:mm) | quiet hoursウィンドウの終了。 |
| `notifications.rateLimit`        | number         | パッケージごとに1分あたり転送する通知の最大数。超過分は破棄されます。 |

通知ピッカーも、転送される通知イベントに対してより安全な動作を使用し、機密性の高いシステム通知の誤転送を防ぎます。

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
Notification forwardingにはAndroidのNotification Listener permissionが必要です。アプリはセットアップ中にこれを要求します。
</Note>

## 関連

- [iOS app](/ja-JP/platforms/ios)
- [Nodes](/ja-JP/nodes)
- [Android node troubleshooting](/ja-JP/nodes/troubleshooting)

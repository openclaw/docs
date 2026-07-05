---
read_when:
    - Androidノードのペアリングまたは再接続
    - Android Gateway の検出または認証のデバッグ
    - リモート Mac から Android デバイスをミラーリングまたは操作する
    - チャット履歴のクライアント間の同等性を検証する
summary: 'Android アプリ（node）: 接続ランブック + Connect/Chat/Voice/Canvas コマンドサーフェス'
title: Android アプリ
x-i18n:
    generated_at: "2026-07-05T20:18:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb86ad2c7e4966b110e7e760c537e681c9a71207b06f01ac4daa123b52cdded7
    source_path: platforms/android.md
    workflow: 16
---

<Note>
公式 Android アプリは [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) で入手できます。これはコンパニオンノードであり、実行中の OpenClaw Gateway が必要です。ソース: [apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android)（[ビルド手順](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)）。
</Note>

## サポート状況

- 役割: コンパニオンノードアプリ（Android は Gateway をホストしません）。
- Gateway が必要: はい（macOS、Linux、または WSL2 経由の Windows で実行します）。
- インストール: アプリは [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN)、Gateway は [はじめに](/ja-JP/start/getting-started)、その後 [ペアリング](/ja-JP/channels/pairing)。
- Gateway: [ランブック](/ja-JP/gateway) + [設定](/ja-JP/gateway/configuration)。
  - プロトコル: [Gateway プロトコル](/ja-JP/gateway/protocol)（ノード + コントロールプレーン）。

システム制御（launchd/systemd）は Gateway ホスト上にあります — [Gateway](/ja-JP/gateway) を参照してください。

## リモート Mac から Android をミラーリングして制御する

[scrcpy](https://github.com/Genymobile/scrcpy) は、Android 画面を macOS ウィンドウにミラーリングし、
Android Debug Bridge (ADB) 経由でキーボードとポインター入力を転送します。これはオペレーター側の
ワークフローであり、OpenClaw ノード接続とは別です。Android デバイスと
Mac が異なる場所にあり、同じプライベート Tailscale ネットワークを共有している場合に便利です。

### 始める前に

- Android デバイスと Mac に Tailscale をインストールし、両方を同じ tailnet に接続します。
- Android で **開発者向けオプション** と **USB デバッグ** を有効にします。Android 16 では **ワイヤレス
  デバッグ** は **設定 > システム > 開発者向けオプション** の下にあります。[Android 開発者向け
  オプション](https://developer.android.com/studio/debug/dev-options) を参照してください。
- Mac に scrcpy と ADB をインストールします:

  ```bash
  brew install scrcpy
  brew install --cask android-platform-tools
  ```

- 初回接続時は Android デバイスを操作できる状態にしておきます。その Mac がデバイスを制御できるようになる前に、Android は各 Mac の ADB
  キーを承認する必要があります。

### TCP 経由の ADB を有効にする

初期セットアップでは、Android デバイスを USB で信頼済みコンピューターに接続し、その
デバッグプロンプトを承認します。その後、次を実行します:

```bash
adb devices
adb tcpip 5555
```

これで USB を切断できます。デバイスの再起動またはデバッグのリセット後にポート 5555 がリッスンしなくなった場合は、
このローカルセットアップ手順を繰り返します。Android 11 以降では、
**ワイヤレス デバッグ > ペアリング コードでデバイスをペア設定** と `adb pair` で初期信頼を確立することもできます。

### コントローラー Mac のみを許可する

制限的な grants を持つ tailnet では、コントローラー Mac が Android デバイス上の TCP ポート 5555 に到達できるよう明示的に許可する必要があります。
tailnet ポリシーに狭いルールを追加し、例のアドレスを
2 台のデバイスの安定した Tailscale IP に置き換えます:

```json5
{
  grants: [
    {
      src: ["<remote-mac-tailnet-ip>"],
      dst: ["<android-tailnet-ip>"],
      ip: ["tcp:5555"],
    },
  ],
}
```

ホストエイリアスやその他のセレクターについては [Tailscale grants](https://tailscale.com/docs/reference/syntax/grants) を参照してください。
このポートを公開インターネットに許可したり、Funnel で公開したりしないでください。承認済み ADB
クライアントはデバイスを広範に制御できます。

### 接続してミラーリングを開始する

リモート Mac で:

```bash
adb connect <android-tailnet-ip>:5555
adb devices
scrcpy --serial <android-tailnet-ip>:5555
```

この Mac からの初回 `adb connect` では、Android に認証ダイアログが表示されます。デバイスのロックを解除し、
キーのフィンガープリントを確認し、Mac が信頼できる場合にのみ **このコンピューターから常に許可** を選択します。
成功した `adb devices` エントリは `device` で終わります。`unauthorized` は、デバイス上のプロンプトが
承認されていないことを意味します。

scrcpy ウィンドウが開いたら、直接使用するか、[Peekaboo](https://peekaboo.sh/) などの macOS 画面自動化ツールで
対象にします。scrcpy は表示と入力を運びます。Tailscale はプライベート
ネットワーク経路だけを提供します。

### トラブルシューティング

- `Connection timed out`: TCP 5555 の tailnet grant を確認します。成功した `tailscale ping` は
  ピア到達性を証明しますが、この TCP ポートがポリシーで許可されていることは証明しません。Mac から
  `nc -vz <android-tailnet-ip> 5555` でテストします。
- `unauthorized`: Android のロックを解除してリモート Mac の ADB キーを承認するか、**ワイヤレス デバッグ > ペア設定済みデバイス** の下にある古いワークステーションを削除して
  再度ペアリングします。
- `Connection refused`: ローカルで再接続し、`adb tcpip 5555` をもう一度実行します。
- 複数のデバイスが表示される: 明示的な `--serial <android-tailnet-ip>:5555` 引数を維持します。

完了したら、scrcpy を閉じて ADB を切断します:

```bash
adb disconnect <android-tailnet-ip>:5555
```

## 接続ランブック

Android ノードアプリ ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android は Gateway WebSocket に直接接続し、デバイスペアリング（`role: node`）を使用します。

Tailscale または公開ホストの場合、Android にはセキュアなエンドポイントが必要です:

- 推奨: `https://<magicdns>` / `wss://<magicdns>` を使う Tailscale Serve / Funnel
- 併用可能: 実際の TLS エンドポイントを持つその他の `wss://` Gateway URL
- 平文 `ws://` は、プライベート LAN アドレス / `.local` ホストに加えて、`localhost`、`127.0.0.1`、Android エミュレーターブリッジ（`10.0.2.2`）で引き続きサポートされます

### 前提条件

- 別のマシンで Gateway が実行中（または SSH 経由で到達可能）。
- Android デバイス/エミュレーターが Gateway WebSocket に到達できる:
  - mDNS/NSD を使う同一 LAN、**または**
  - Wide-Area Bonjour / ユニキャスト DNS-SD を使う同一 Tailscale tailnet（下記参照）、**または**
  - 手動 gateway ホスト/ポート（フォールバック）
- Tailnet/公開モバイルペアリングでは、生の tailnet IP `ws://` エンドポイントは使用しません。代わりに Tailscale Serve または別の `wss://` URL を使用します。
- ペアリングリクエストを承認するために、gateway マシンで `openclaw` CLI が利用可能（または SSH 経由で利用可能）。

### 1. Gateway を起動する

```bash
openclaw gateway --port 18789 --verbose
```

ログに次のような内容があることを確認します:

- `listening on ws://0.0.0.0:18789`

Tailscale 経由のリモート Android アクセスでは、生の tailnet バインドではなく Serve/Funnel を推奨します:

```bash
openclaw gateway --tailscale serve
```

これにより、Android にセキュアな `wss://` / `https://` エンドポイントが提供されます。別途 TLS を終端しない限り、単純な `gateway.bind: "tailnet"` セットアップだけでは初回のリモート Android ペアリングには十分ではありません。

### 2. 検出を確認する（任意）

gateway マシンから:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

その他のデバッグメモ: [Bonjour](/ja-JP/gateway/bonjour)。

ワイドエリア検出ドメインも設定している場合は、次と比較します:

```bash
openclaw gateway discover --json
```

これは、TXT のみのヒントではなく解決済みサービスエンドポイントを使用し、`local.` と設定済みワイドエリアドメインを 1 回の実行で表示します。

#### ユニキャスト DNS-SD によるクロスネットワーク検出

Android の NSD/mDNS 検出はネットワークをまたぎません。Android ノードと gateway が異なるネットワーク上にあり、Tailscale で接続されている場合は、代わりに Wide-Area Bonjour / ユニキャスト DNS-SD を使用します。検出だけでは tailnet/公開 Android ペアリングには不十分です。検出された経路にもセキュアなエンドポイント（`wss://` または Tailscale Serve）が必要です:

1. gateway ホスト上に DNS-SD ゾーン（例: `openclaw.internal.`）をセットアップし、`_openclaw-gw._tcp` レコードを公開します。
2. 選択したドメインに対して、その DNS サーバーを指す Tailscale split DNS を設定します。

詳細と CoreDNS 設定例: [Bonjour](/ja-JP/gateway/bonjour)。

### 3. Android から接続する

Android アプリで:

- アプリは **フォアグラウンドサービス**（永続通知）を介して gateway 接続を維持します。
- **接続** タブを開きます。
- **セットアップコード** または **手動** モードを使用します。
- 検出がブロックされている場合は、**詳細コントロール** で手動ホスト/ポートを使用します。プライベート LAN ホストでは `ws://` が引き続き機能します。Tailscale/公開ホストでは、TLS を有効にし、`wss://` / Tailscale Serve エンドポイントを使用します。

初回ペアリングに成功した後、Android は起動時に自動再接続します。有効な場合は手動エンドポイント、そうでなければ最後に検出された gateway（ベストエフォート）に接続します。

### Presence alive ビーコン

認証済みノードセッションが接続した後、およびフォアグラウンドサービスがまだ接続中のままアプリがバックグラウンドに移動したとき、Android は `event: "node.presence.alive"` で `node.event` を呼び出します。gateway は、認証済みノードデバイス ID が判明した後にのみ、これをペア済みノード/デバイスメタデータ上の `lastSeenAtMs`/`lastSeenReason` として記録します。

アプリは、gateway 応答に `handled: true` が含まれる場合にのみ、ビーコンが正常に記録されたものとして数えます。古い gateway は `{ "ok": true }` で `node.event` を確認応答する場合があります。この応答は互換性がありますが、永続的な last-seen 更新としては数えません。

### 4. ペアリングを承認する（CLI）

gateway マシンで:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

ペアリングの詳細: [ペアリング](/ja-JP/channels/pairing)。

任意: Android ノードが常に厳密に制御されたサブネットから接続する場合は、明示的な CIDR または完全一致 IP を使って初回ノード自動承認にオプトインできます:

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

これはデフォルトでは無効です。リクエストされたスコープがない新しい `role: node` ペアリングにのみ適用されます。オペレーター/ブラウザのペアリング、およびロール、スコープ、メタデータ、公開鍵の変更は、引き続き手動承認が必要です。

### 5. ノードが接続されていることを確認する

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. チャット + 履歴

Android Chat タブはセッション選択をサポートします（デフォルトは `main`、加えて他の既存セッション）:

- 履歴: `chat.history`（表示用に正規化済み — インラインディレクティブタグ、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`、および切り詰められたバリアント）、漏出した ASCII/全角モデル制御トークンは除去されます。正確な `NO_REPLY` / `no_reply` のような無音トークンの assistant 行は省略されます。過大な行はプレースホルダーに置き換えられる場合があります）
- 送信: `chat.send`
- プッシュ更新（ベストエフォート）: `chat.subscribe` -> `event:"chat"`

### 7. Canvas + カメラ

#### Gateway Canvas ホスト（Web コンテンツに推奨）

エージェントがディスク上で編集できる実際の HTML/CSS/JS をノードに表示させるには、ノードを Gateway canvas ホストに向けます。

<Note>
ノードは Gateway HTTP サーバー（`gateway.port` と同じポート、デフォルトは `18789`）から canvas を読み込みます。
</Note>

1. gateway ホスト上に `~/.openclaw/workspace/canvas/index.html` を作成します。
2. ノードをそこに移動します（LAN）:

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet（任意）: 両方のデバイスが Tailscale 上にある場合は、`.local` の代わりに MagicDNS 名または tailnet IP を使用します。例: `http://<gateway-magicdns>:18789/__openclaw__/canvas/`。

このサーバーは HTML にライブリロードクライアントを注入し、ファイル変更時に再読み込みします。Gateway は `/__openclaw__/a2ui/` も提供しますが、Android アプリはリモート A2UI ページをレンダリング専用として扱います。アクション可能な A2UI コマンドは、バンドルされたアプリ所有の A2UI ページを使用します。

Canvas コマンド（フォアグラウンドのみ）:

- `canvas.eval`、`canvas.snapshot`、`canvas.navigate`（デフォルトのスキャフォールドに戻るには `{"url":""}` または `{"url":"/"}` を使用します）。`canvas.snapshot` は `{ format, base64 }` を返します（デフォルトは `format="jpeg"`）。
- A2UI: `canvas.a2ui.push`、`canvas.a2ui.reset`（`canvas.a2ui.pushJSONL` はレガシーエイリアス）。これらは、アクション可能なレンダリングにバンドルされたアプリ所有の A2UI ページを使用します。

カメラコマンド（フォアグラウンドのみ、権限で保護）: `camera.snap`（jpg）、`camera.clip`（mp4）。パラメーターと CLI ヘルパーについては [カメラノード](/ja-JP/nodes/camera) を参照してください。

### 8. 音声 + 拡張 Android コマンドサーフェス

- Voice タブ: Android には 2 つの明示的なキャプチャモードがあります。**マイク**は手動の Voice タブセッションで、各ポーズをチャットターンとして送信し、アプリがフォアグラウンドを離れるか、ユーザーが Voice タブを離れると停止します。**Talk**は継続的なトークモードで、オフに切り替えるかノードが切断されるまでリスニングを続けます。
- トークモードは、キャプチャ開始前に既存のフォアグラウンドサービスを `connectedDevice` から `connectedDevice|microphone` に昇格し、トークモード停止時に降格します。ノードサービスは `CHANGE_NETWORK_STATE` とともに `FOREGROUND_SERVICE_CONNECTED_DEVICE` を宣言します。Android 14 以降では、`FOREGROUND_SERVICE_MICROPHONE` 宣言、`RECORD_AUDIO` ランタイム許可、実行時のマイクサービス種別も必要です。
- デフォルトでは、Android Talk はネイティブ音声認識、Gateway チャット、設定済みの Gateway Talk プロバイダー経由の `talk.speak` を使用します。ローカルシステム TTS は、`talk.speak` が利用できない場合にのみ使用されます。
- Android Talk は、`talk.realtime.mode` が `realtime` で、`talk.realtime.transport` が `gateway-relay` の場合にのみ、リアルタイム Gateway リレーを使用します。
- Voice wake はソース内（`VoiceWakeMode`）に実装されていますが、出荷版アプリのランタイムは接続時に常に `off` を強制します。現時点でユーザー向けの切り替えはありません。
- 追加の Android コマンドファミリー（利用可否はデバイス、権限、ユーザー設定によって異なります）:
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - **設定 > 電話機能 > インストール済みアプリ**が有効な場合のみ `device.apps`。デフォルトではランチャーに表示されるアプリを一覧表示します（完全な一覧には `includeNonLaunchable` を渡します）。
  - `notifications.list`, `notifications.actions`（以下の[通知転送](#notification-forwarding)を参照）
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## アシスタントのエントリーポイント

Android は、システムアシスタントトリガー（Google Assistant）から OpenClaw を起動できます。ホームボタンの長押し（または別の `ACTION_ASSIST` トリガー）でアプリが開きます。「Hey Google, ask OpenClaw `<prompt>`」と言うと、アプリで宣言された App Actions クエリパターンに一致し、プロンプトが自動送信されずにチャットコンポーザーへ渡されます。

これは、アプリマニフェストで宣言された Android **App Actions**（`shortcuts.xml` capability）を使用します。Gateway 側の設定は不要です。アシスタントインテントは Android アプリだけで処理されます。

<Note>
App Actions の利用可否は、デバイス、Google Play Services のバージョン、ユーザーが OpenClaw をデフォルトのアシスタントアプリに設定しているかどうかによって異なります。
</Note>

## 通知転送

Android は、デバイス通知を `node.event` 項目として Gateway に転送できます。これは gateway/`openclaw.json` 設定ではなく、アプリの設定シート内で**デバイス上**に設定します。

| 設定                     | 説明                                                                                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 通知イベントを転送 | マスタートグル。デフォルトではオフです。先に Notification Listener Access を付与する必要があります。                                                                                                              |
| パッケージフィルター              | **許可リスト**（一覧にあるパッケージ ID のみ転送）または**ブロックリスト**（デフォルト: 一覧にある ID 以外のすべてのパッケージ）。転送ループを防ぐため、OpenClaw 自身のパッケージはブロックリストモードで常に除外されます。 |
| サイレント時間                 | 転送を抑制するローカル HH:mm 開始/終了ウィンドウ。デフォルトでは無効で、有効化すると `22:00`-`07:00` がデフォルトになります。                                                                                |
| 最大イベント数 / 分         | 転送通知のデバイス単位のレート制限。デフォルトは 20 です。                                                                                                                                          |
| ルートセッションキー           | 任意。転送された通知イベントを、デバイスのデフォルト通知ルートではなく特定のセッションに固定します。                                                                               |

<Note>
通知転送には Android Notification Listener 権限が必要です。アプリはセットアップ中にこれを求めます。
</Note>

## 関連項目

- [iOS アプリ](/ja-JP/platforms/ios)
- [ノード](/ja-JP/nodes)
- [Android ノードのトラブルシューティング](/ja-JP/nodes/troubleshooting)

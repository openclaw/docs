---
read_when:
    - Android Node のペアリングまたは再接続
    - Android の Gateway 検出または認証のデバッグ
    - リモートのMacからAndroidデバイスをミラーリングまたは操作する
    - クライアント間でのチャット履歴の一致を確認する
summary: Android アプリ（Node）：接続手順書 + Connect/Chat/Voice/Canvas コマンドサーフェス
title: Android アプリ
x-i18n:
    generated_at: "2026-07-16T11:43:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8ac11a1d0eb0c601048843ec80c9c76a4ebf76f2c80680ae2a43cb84fc6ec263
    source_path: platforms/android.md
    workflow: 16
---

<Note>
公式 Android アプリは [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) および、対応する [GitHub Releases](https://github.com/openclaw/openclaw/releases) の署名済みスタンドアロン APK として提供されています。これはコンパニオン Node であり、稼働中の OpenClaw Gateway が必要です。ソース: [apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android)（[ビルド手順](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)）。
</Note>

## サポート概要

- 役割: コンパニオン Node アプリ（Android は Gateway をホストしません）。
- Gateway が必要: はい（macOS、Linux、または WSL2 経由の Windows で実行します）。
- インストール: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN)、または対応する [GitHub Release](https://github.com/openclaw/openclaw/releases) の `OpenClaw-Android.apk`。Gateway については[はじめに](/ja-JP/start/getting-started)、続いて[ペアリング](/ja-JP/channels/pairing)を参照してください。
- Gateway: [運用手順書](/ja-JP/gateway) + [設定](/ja-JP/gateway/configuration)。
  - プロトコル: [Gateway プロトコル](/ja-JP/gateway/protocol)（Node + コントロールプレーン）。

システム制御（launchd/systemd）は Gateway ホスト上にあります。詳細は [Gateway](/ja-JP/gateway) を参照してください。

## Google Play 以外からのインストール

通常の最終版および修正版の GitHub Releases には、ユニバーサル `OpenClaw-Android.apk` と `OpenClaw-Android-SHA256SUMS.txt` が含まれます。APK はリリースタグからビルドされ、OpenClaw Android リリースキーで署名され、GitHub Actions のプロベナンスが付与されています。

両方のアセットが記載されている[リリース](https://github.com/openclaw/openclaw/releases)を選択し、サイドロードする前に、その正確なタグをダウンロードして検証します。

```bash
release_tag=vYYYY.M.PATCH
gh release download "$release_tag" \
  --repo openclaw/openclaw \
  --pattern OpenClaw-Android.apk \
  --pattern OpenClaw-Android-SHA256SUMS.txt
sha256sum --check OpenClaw-Android-SHA256SUMS.txt
gh attestation verify OpenClaw-Android.apk \
  --repo openclaw/openclaw \
  --signer-workflow openclaw/openclaw/.github/workflows/android-release.yml \
  --source-ref "refs/tags/${release_tag}" \
  --deny-self-hosted-runners
```

<Warning>
Google Play 版とスタンドアロン APK 版では更新チャネルが異なり、署名 ID も異なる場合があります。チャネルを切り替える前に、Android で既存のアプリのアンインストールが必要になる場合があり、その際にアプリのローカルデータが削除されます。通常の更新では、1 つのチャネルを継続して使用してください。
</Warning>

## リモートの Mac から Android をミラーリングして操作する

[scrcpy](https://github.com/Genymobile/scrcpy) は、Android の画面を macOS ウィンドウにミラーリングし、
Android Debug Bridge（ADB）経由でキーボードとポインターの入力を転送します。これは OpenClaw の Node 接続とは別の、
オペレーター側のワークフローです。Android デバイスと Mac が別の場所にありながら、
同じプライベート Tailscale ネットワークを共有している場合に便利です。

### 始める前に

- Android デバイスと Mac に Tailscale をインストールし、両方を同じ tailnet に接続します。
- Android で **Developer options** と **USB debugging** を有効にします。Android 16 では **Wireless
  debugging** は **Settings > System > Developer options** にあります。[Android の開発者向け
  オプション](https://developer.android.com/studio/debug/dev-options)を参照してください。
- Mac に scrcpy と ADB をインストールします。

  ```bash
  brew install scrcpy
  brew install --cask android-platform-tools
  ```

- 初回接続時には Android デバイスを操作できる状態にしておきます。その Mac がデバイスを操作できるようにするには、Android で各 Mac の ADB
  キーを承認する必要があります。

### TCP 経由で ADB を有効にする

初期設定では、Android デバイスを USB で信頼できるコンピューターに接続し、
デバッグの確認プロンプトを承認します。その後、次を実行します。

```bash
adb devices
adb tcpip 5555
```

これで USB を取り外せます。デバイスの再起動またはデバッグ設定のリセット後にポート 5555 が待ち受けを停止した場合は、
このローカル設定手順を繰り返してください。Android 11 以降では、
**Wireless debugging > Pair device with pairing code** と `adb pair` を使用して初回の信頼関係を確立することもできます。

### コントローラーの Mac のみを許可する

制限付き grant を使用する tailnet では、コントローラーの Mac から Android デバイスの TCP ポート 5555 へのアクセスを
明示的に許可する必要があります。次の例のアドレスを 2 台のデバイスの固定 Tailscale IP に置き換えて、
tailnet ポリシーに範囲を限定したルールを追加します。

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

ホストエイリアスやその他のセレクターについては、[Tailscale grants](https://tailscale.com/docs/reference/syntax/grants) を参照してください。
このポートをパブリックインターネットに許可したり、Funnel で公開したりしないでください。認証済みの ADB
クライアントはデバイスを広範囲に操作できます。

### 接続してミラーリングを開始する

リモートの Mac で次を実行します。

```bash
adb connect <android-tailnet-ip>:5555
adb devices
scrcpy --serial <android-tailnet-ip>:5555
```

この Mac から初めて `adb connect` を実行すると、Android に認証ダイアログが表示されます。デバイスのロックを解除し、
キーのフィンガープリントを確認して、Mac が信頼できる場合にのみ **Always allow from this computer** を選択します。
成功した `adb devices` エントリの末尾は `device` になります。`unauthorized` は、デバイス上のプロンプトが
まだ承認されていないことを示します。

scrcpy ウィンドウが開いたら、直接操作するか、
[Peekaboo](https://peekaboo.sh/) などの macOS 画面自動化ツールの対象にします。scrcpy は画面と入力を転送し、Tailscale は
プライベートネットワーク経路のみを提供します。

### トラブルシューティング

- `Connection timed out`: TCP 5555 に対する tailnet grant を確認します。`tailscale ping` が成功しても、
  ピアに到達できることを証明するだけで、この TCP ポートがポリシーで許可されていることは証明されません。Mac から
  `nc -vz <android-tailnet-ip> 5555` を実行してテストしてください。
- `unauthorized`: Android のロックを解除してリモート Mac の ADB キーを承認するか、**Wireless debugging > Paired devices** から古いワークステーションを
  削除して、再度ペアリングします。
- `Connection refused`: ローカルで再接続し、`adb tcpip 5555` をもう一度実行します。
- 複数のデバイスが表示される場合: 明示的な `--serial <android-tailnet-ip>:5555` 引数を使用し続けます。

完了したら、scrcpy を閉じて ADB を切断します。

```bash
adb disconnect <android-tailnet-ip>:5555
```

## 接続運用手順書

Android Node アプリ ⇄（mDNS/NSD + WebSocket）⇄ **Gateway**

Android は Gateway WebSocket に直接接続し、デバイスペアリング（`role: node`）を使用します。

Tailscale またはパブリックホストでは、Android にセキュアなエンドポイントが必要です。

- 推奨: `https://<magicdns>` / `wss://<magicdns>` を使用する Tailscale Serve / Funnel
- サポート対象: 実際の TLS エンドポイントを持つ、その他の任意の `wss://` Gateway URL
- 平文の `ws://` は、プライベート LAN アドレス / `.local` ホストに加え、`localhost`、`127.0.0.1`、Android エミュレーターブリッジ（`10.0.2.2`）でも引き続きサポートされます。非 local loopback の設定では、制限付きオペレーターアクセスが自動的に使用されます

### 前提条件

- 別のマシン上で Gateway が稼働していること（または SSH 経由で到達可能であること）。
- Android デバイス/エミュレーターから Gateway WebSocket に到達できること:
  - mDNS/NSD を使用する同一 LAN、**または**
  - Wide-Area Bonjour / ユニキャスト DNS-SD を使用する同一 Tailscale tailnet（後述）、**または**
  - Gateway のホスト/ポートを手動指定（フォールバック）
- tailnet/パブリック環境でのモバイルペアリングでは、生の tailnet IP の `ws://` エンドポイントを使用しません。代わりに Tailscale Serve または別の `wss://` URL を使用してください。
- ペアリング要求を承認するため、Gateway マシン上（または SSH 経由）で `openclaw` CLI が使用可能であること。

### 1. Gateway を起動する

```bash
openclaw gateway --port 18789 --verbose
```

ログに次のような内容が表示されることを確認します。

- `listening on ws://0.0.0.0:18789`

Tailscale 経由で Android からリモートアクセスする場合は、生の tailnet バインドではなく Serve/Funnel を推奨します。

```bash
openclaw gateway --tailscale serve
```

これにより、Android でセキュアな `wss://` / `https://` エンドポイントを使用できます。TLS を別途終端しない限り、単純な `gateway.bind: "tailnet"` 設定だけでは、Android から初回のリモートペアリングを行うには不十分です。

### 2. 検出を確認する（任意）

Gateway マシンで次を実行します。

```bash
dns-sd -B _openclaw-gw._tcp local.
```

デバッグに関する詳細: [Bonjour](/ja-JP/gateway/bonjour)。

広域検出ドメインも設定している場合は、次の結果と比較します。

```bash
openclaw gateway discover --json
```

これは、TXT のヒントだけでなく解決済みのサービスエンドポイントを使用して、`local.` と設定済みの広域ドメインを 1 回で表示します。

#### ユニキャスト DNS-SD によるネットワーク間検出

Android の NSD/mDNS 検出はネットワークを越えません。Android Node と Gateway が異なるネットワーク上にあり、Tailscale で接続されている場合は、代わりに Wide-Area Bonjour / ユニキャスト DNS-SD を使用します。tailnet/パブリック環境で Android をペアリングするには、検出だけでは不十分です。検出された経路にもセキュアなエンドポイント（`wss://` または Tailscale Serve）が必要です。

1. Gateway ホストで DNS-SD ゾーン（例: `openclaw.internal.`）を設定し、`_openclaw-gw._tcp` レコードを公開します。
2. 選択したドメインをその DNS サーバーに向けるよう、Tailscale のスプリット DNS を設定します。

詳細と CoreDNS の設定例: [Bonjour](/ja-JP/gateway/bonjour)。

### 3. Android から接続する

Android アプリで次を行います。

- アプリは **foreground service**（常駐通知）によって Gateway 接続を維持します。
- **Connect** タブを開きます。
- **Setup Code** または **Manual** モードを使用します。
- 検出がブロックされている場合は、**Advanced controls** でホスト/ポートを手動指定します。プライベート LAN ホストでは、`ws://` を引き続き使用できます。Tailscale/パブリックホストでは TLS を有効にして、`wss://` / Tailscale Serve エンドポイントを使用します。

初回のペアリングに成功すると、Android は起動時に、アクティブなペアリング済み Gateway に自動的に再接続します（検出された Gateway についてはベストエフォートであり、ネットワーク上で可視である必要があります）。

公式のセットアップコードでは、Android を Node として接続し、デフォルトで `wss://` 経由の完全な Gateway オペレーター
アクセスを許可します。平文の非 local loopback `ws://` 設定では、
Bearer Token の安全性を確保するため、制限付きアクセスが自動的に使用されます。**Settings → Gateway** には
**Full** または **Limited** アクセスが表示されます。制限付き接続の場合は、
`wss://` または Tailscale Serve を設定し、Control UI または
`openclaw qr` で新しい完全アクセスコードを生成して、そのページでスキャンまたは貼り付けて再接続します。制限付きプロファイルを
使用するオペレーターは、Control UI で **Limited access** を選択するか、
`openclaw qr --limited` を実行できます。

### 複数の Gateway

アプリはペアリング済みのすべての Gateway のレジストリを保持するため、再度ペアリングせずに切り替えられます。

- **Settings -> Gateways** にはペアリング済みの Gateway が一覧表示され、アクティブなものにはマークが付きます。エントリをタップすると切り替わります。アプリは現在のセッションを終了し、選択した Gateway に再接続します。
- 複数の Gateway がペアリングされている場合、**Connect** タブにクイックスイッチャーが表示されます。
- 認証情報、デバイストークン、TLS の信頼情報、チャット履歴、キューに入ったオフラインメッセージは Gateway ごとに保存されます。切り替えても Gateway 間で状態が混在することはなく、オフライン中にキューに入ったメッセージは、そのメッセージの送信先として作成された Gateway にのみ配信されます。
- **Forget** は、Gateway のレジストリエントリとともに、認証情報、デバイストークン、TLS ピン、キャッシュされたチャットを削除します。

### プレゼンス維持ビーコン

認証済みの Node セッションが接続された後、および foreground service が接続されたままアプリがバックグラウンドに移行したとき、Android は `event: "node.presence.alive"` を指定して `node.event` を呼び出します。Gateway は、認証済み Node のデバイス ID が判明した後にのみ、ペアリング済み Node/デバイスのメタデータにこれを `lastSeenAtMs`/`lastSeenReason` として記録します。

Gateway の応答に `handled: true` が含まれる場合にのみ、アプリはビーコンが正常に記録されたとみなします。古い Gateway は `{ "ok": true }` で `node.event` を確認応答する場合があります。この応答には互換性がありますが、永続的な最終確認時刻の更新としてはカウントされません。

### 4. ペアリングを承認する（CLI）

Gateway マシンで次を実行します。

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

ペアリングの詳細：[ペアリング](/ja-JP/channels/pairing)。

任意：Android Node が常に厳密に管理されたサブネットから接続する場合は、明示的な CIDR または正確な IP を指定して、初回の Node 自動承認を有効にできます。

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

これはデフォルトでは無効です。要求されたスコープがない、新規の `role: node` ペアリングにのみ適用されます。オペレーター／ブラウザーのペアリング、およびロール、スコープ、メタデータ、公開鍵の変更には、引き続き手動承認が必要です。

### 5. Node の接続を確認する

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. チャットと履歴

Android のチャットタブでは、セッションを選択できます（デフォルトは `main`、その他の既存セッションも選択可能）。

- 履歴：`chat.history`（表示用に正規化されます。インラインのディレクティブタグ、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`、および切り詰められたバリアント）、漏洩した ASCII／全角のモデル制御トークンは除去されます。正確に `NO_REPLY`／`no_reply` のようなサイレントトークンのみのアシスタント行は省略されます。大きすぎる行はプレースホルダーに置き換えられる場合があります）
- 送信：`chat.send`
- 永続的な送信：すべての送信内容（テキスト、選択した画像、ボイスメモ）は、ネットワークへの接続を試みる前に、Gateway ごとのデバイス上の送信トレイへ記録されるため、アプリが終了しても送信済みの入力は失われません。オフライン中にキューへ入った送信内容は、再接続時に安定した冪等性キーを使用して順番に配信されます。送信内容は、そのターンが正規の `chat.history` に表示された後にのみ処理済みとなり、確認応答だけでは配信の証明として扱われません。不確定な結果（確認応答の消失、送信中のアプリ強制終了、トランスクリプトへの書き込み前の Gateway 再起動）は、自動再送信されず、明示的な **再試行**／**削除** 操作を備えた表示行として示されます。スラッシュコマンドは再接続後に自動で再実行されず、明示的な再試行を待機します。キューの上限は Gateway ごとに 50 件のメッセージと 48 MB の添付ファイルデータで、未送信の行は 48 時間後に期限切れになります。一度も送信されていない入力欄の下書きは、プロセスをまたいで永続化されません。
- プッシュ更新（ベストエフォート）：`chat.subscribe` -> `event:"chat"`
- 読み上げ：アシスタントのメッセージを長押しして **読み上げ** を選択すると、音声で聞くことができます。音声は設定済みの TTS プロバイダーチェーンを使用して Gateway の `tts.speak` で生成され、Gateway が音声を生成できない場合はデバイス上のシステム TTS が使用されます。セッションの切り替え、新規チャット、アプリのバックグラウンド移行、またはチャットを閉じると再生が停止します。

### 7. Canvas とカメラ

#### Gateway Canvas ホスト（Web コンテンツに推奨）

エージェントがディスク上で編集できる実際の HTML/CSS/JS を Node に表示させるには、Node の接続先を Gateway Canvas ホストに設定します。

<Note>
Node は Gateway HTTP サーバー（`gateway.port` と同じポート、デフォルトは `18789`）から Canvas を読み込みます。
</Note>

1. Gateway ホスト上に `~/.openclaw/workspace/canvas/index.html` を作成します。
2. Node をそこへ移動させます（LAN）。

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet（任意）：両方のデバイスが Tailscale 上にある場合は、`.local` の代わりに MagicDNS 名または tailnet IP（例：`http://<gateway-magicdns>:18789/__openclaw__/canvas/`）を使用します。

このサーバーは HTML にライブリロードクライアントを挿入し、ファイル変更時に再読み込みします。Gateway は `/__openclaw__/a2ui/` も提供しますが、Android アプリはリモート A2UI ページを表示専用として扱います。アクション対応の A2UI コマンドでは、アプリにバンドルされ、アプリが所有する A2UI ページを使用します。

Canvas コマンド（フォアグラウンドのみ）：

- `canvas.eval`、`canvas.snapshot`、`canvas.navigate`（デフォルトのスキャフォールドへ戻るには `{"url":""}` または `{"url":"/"}` を使用します）。`canvas.snapshot` は `{ format, base64 }`（デフォルトは `format="jpeg"`）を返します。
- A2UI：`canvas.a2ui.push`、`canvas.a2ui.reset`（`canvas.a2ui.pushJSONL` はレガシーエイリアス）。これらは、アクション対応の表示に、アプリにバンドルされ、アプリが所有する A2UI ページを使用します。

カメラコマンド（フォアグラウンドのみ、権限が必要）：`camera.snap`（jpg）、`camera.clip`（mp4）。パラメーターと CLI ヘルパーについては、[カメラ Node](/ja-JP/nodes/camera)を参照してください。

### 8. 音声と拡張された Android コマンドサーフェス

- 音声タブ：Android には明示的な 2 つのキャプチャモードがあります。**マイク** は、音声タブで手動開始するセッションで、一時停止するたびにチャットターンとして送信し、アプリがフォアグラウンドから離れるか、ユーザーが音声タブを離れると停止します。**トーク** は継続的なトークモードで、オフに切り替えるか Node が切断されるまで聞き取りを続けます。
- トークモードでは、キャプチャ開始前に既存のフォアグラウンドサービスを `connectedDevice` から `connectedDevice|microphone` へ昇格させ、トークモードの停止時に降格させます。Node サービスは `FOREGROUND_SERVICE_CONNECTED_DEVICE` を `CHANGE_NETWORK_STATE` とともに宣言します。Android 14+ ではさらに、`FOREGROUND_SERVICE_MICROPHONE` の宣言、`RECORD_AUDIO` のランタイム許可、および実行時のマイクサービス種別が必要です。
- デフォルトでは、Android のトークはネイティブ音声認識、Gateway チャット、および設定済みの Gateway トークプロバイダー経由の `talk.speak` を使用します。ローカルのシステム TTS は、`talk.speak` が利用できない場合にのみ使用されます。
- Android のトークがリアルタイム Gateway リレーを使用するのは、`talk.realtime.mode` が `realtime` であり、かつ `talk.realtime.transport` が `gateway-relay` の場合のみです。
- Android は `voiceWake` 機能を公開しません。音声入力には **マイク** または **トーク** を使用してください。
- 追加の Android コマンドファミリー（利用可否はデバイス、権限、ユーザー設定によって異なります）：
  - `device.status`、`device.info`、`device.permissions`、`device.health`
  - `device.apps` は **Settings > Phone Capabilities > Installed Apps** が有効な場合のみ使用できます。デフォルトではランチャーに表示されるアプリを一覧表示します（完全な一覧には `includeNonLaunchable` を渡します）。
  - `notifications.list`、`notifications.actions`（後述の[通知転送](#notification-forwarding)を参照）
  - `photos.latest`
  - `contacts.search`、`contacts.add`
  - `calendar.events`、`calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`、`motion.pedometer`

### 9. ワークスペースファイル（読み取り専用）

ホームの概要には **ファイル** カードがあり、読み取り専用の `agents.workspace.list`／`agents.workspace.get` Gateway RPC を介して、アクティブなエージェントのワークスペースを参照できます。ディレクトリ階層の移動、テキストと画像のプレビュー、Android の共有シートを介したエクスポートに対応しています。書き込み操作はなく、プレビューのサイズは Gateway によって制限されます。

## コマンド承認の確認

`operator.admin` を持つオペレーター接続、または Gateway が明示的に対象として指定した、ペアリング済みの
`operator.approvals` 接続では、**設定 -> 承認** から保留中の実行リクエストを確認できます。アプリはボタンを有効にする前に
Gateway のサニタイズ済み承認レコードを読み込み、セキュリティ警告と、そのリクエストで提示される正確な選択肢を表示し、
承認 ID と所有者種別を Gateway へ送信します。

承認状態は Control UI および対応するチャットサーフェスと共有されます。最初に確定された回答が採用されます。別のサーフェスが先に回答した場合でも、Android にはその正規の結果が表示されます。解決レスポンスが失われた場合や Gateway が切断された場合、アプリは操作をロックしたまま承認を再読み込みしてから、別の選択肢を提示します。

統合承認メソッドより前の Gateway では、リリース済みの実行専用メソッドへフォールバックします。保留中の確認は引き続き機能しますが、保持されるターミナル状態と、より詳細なサーフェス間の結果を利用するには、更新済みの Gateway が必要です。

## アシスタントのエントリーポイント

Android では、システムアシスタントのトリガー（Google Assistant）から OpenClaw を起動できます。ホームボタンを長押しするか、別の `ACTION_ASSIST` トリガーを使用するとアプリが開きます。「Hey Google, ask OpenClaw `<prompt>`」と言うと、アプリが宣言した App Actions のクエリパターンに一致し、プロンプトが自動送信されずにチャット入力欄へ渡されます。

これは、アプリのマニフェストで宣言された Android の **App Actions**（`shortcuts.xml` 機能）を使用します。Gateway 側の設定は不要です。アシスタントのインテントは、Android アプリのみで処理されます。

<Note>
App Actions の利用可否は、デバイス、Google Play Services のバージョン、およびユーザーが OpenClaw をデフォルトのアシスタントアプリとして設定しているかどうかによって異なります。
</Note>

## 通知転送

Android は、デバイスの通知を `node.event` 項目として Gateway へ転送できます。これは Gateway／`openclaw.json` の設定ではなく、アプリの設定シートで**デバイス上に設定**します。

| 設定                     | 説明                                                                                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 通知イベントを転送 | マスタートグル。デフォルトではオフです。最初に通知リスナーへのアクセスを許可する必要があります。                                                                                                              |
| パッケージフィルター              | **許可リスト**（一覧にあるパッケージ ID のみ転送）または **ブロックリスト**（デフォルト：一覧にある ID 以外のすべてのパッケージ）。転送ループを防ぐため、ブロックリストモードでは OpenClaw 自身のパッケージが常に除外されます。 |
| サイレント時間                 | 転送を抑止するローカルの HH:mm 形式の開始／終了時間帯。デフォルトでは無効で、有効にするとデフォルトは `22:00`～`07:00` です。                                                                                |
| 1 分あたりの最大イベント数         | 転送される通知に対するデバイスごとのレート制限。デフォルトは 20 です。                                                                                                                                          |
| ルートセッションキー           | 任意。転送された通知イベントを、デバイスのデフォルト通知ルートではなく、特定のセッションに固定します。                                                                               |

<Note>
通知転送には Android の通知リスナー権限が必要です。アプリはセットアップ中にこの権限を要求します。
</Note>

WhatsApp、WhatsApp Business、Telegram、Telegram X、Discord、Signal の通知は常に除外されます。これらのメッセージはすでにネイティブの OpenClaw チャネルセッションによって管理されているため、Android の通知を別の Node イベントとして転送すると、返信が誤った会話へルーティングされる可能性があります。

## 関連項目

- [iOS アプリ](/ja-JP/platforms/ios)
- [Node](/ja-JP/nodes)
- [Android Node のトラブルシューティング](/ja-JP/nodes/troubleshooting)

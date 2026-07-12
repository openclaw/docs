---
read_when:
    - Android Nodeのペアリングまたは再接続
    - Android の Gateway 検出または認証のデバッグ
    - リモートのMacからAndroidデバイスをミラーリングまたは操作する
    - クライアント間でのチャット履歴の一致を検証する
summary: Android アプリ（Node）：接続ランブック + Connect/Chat/Voice/Canvas コマンドサーフェス
title: Androidアプリ
x-i18n:
    generated_at: "2026-07-12T14:35:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7cba1a3db2743dc9145ba5cd3eb3129b87952d7ec4090afd2776bb71a590627b
    source_path: platforms/android.md
    workflow: 16
---

<Note>
公式 Android アプリは [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) および、対応する [GitHub Releases](https://github.com/openclaw/openclaw/releases) で署名済みのスタンドアロン APK として提供されています。これはコンパニオン Node であり、稼働中の OpenClaw Gateway が必要です。ソース: [apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android)（[ビルド手順](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)）。
</Note>

## サポート概要

- 役割: コンパニオン Node アプリ（Android は Gateway をホストしません）。
- Gateway の必要性: 必須（macOS、Linux、または WSL2 経由の Windows で実行します）。
- インストール: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN)、または対応する [GitHub Release](https://github.com/openclaw/openclaw/releases) の `OpenClaw-Android.apk`。Gateway については[はじめに](/ja-JP/start/getting-started)、続いて[ペアリング](/ja-JP/channels/pairing)を参照してください。
- Gateway: [運用手順書](/ja-JP/gateway) + [設定](/ja-JP/gateway/configuration)。
  - プロトコル: [Gateway プロトコル](/ja-JP/gateway/protocol)（Node + コントロールプレーン）。

システム制御（launchd/systemd）は Gateway ホスト上にあります。詳しくは [Gateway](/ja-JP/gateway) を参照してください。

## Google Play 以外からのインストール

通常の最終版および修正版 GitHub Releases には、ユニバーサル版の `OpenClaw-Android.apk` と `OpenClaw-Android-SHA256SUMS.txt` が含まれています。APK はリリースタグからビルドされ、OpenClaw Android リリースキーで署名され、GitHub Actions のプロベナンスが付与されています。

両方のアセットが掲載されている[リリース](https://github.com/openclaw/openclaw/releases)を選択し、サイドローディングする前に、その正確なタグをダウンロードして検証します。

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
Google Play 版とスタンドアロン APK 版では更新チャネルが異なり、署名 ID も異なる場合があります。チャネルを切り替える際、Android で既存アプリのアンインストールが必要になることがあり、その場合はローカルのアプリデータが削除されます。通常の更新では、同じチャネルを使い続けてください。
</Warning>

## リモートの Mac から Android をミラーリングして操作する

[scrcpy](https://github.com/Genymobile/scrcpy) は Android の画面を macOS ウィンドウにミラーリングし、
Android Debug Bridge（ADB）を介してキーボードとポインターの入力を転送します。これは OpenClaw の Node 接続とは別の、
オペレーター側のワークフローです。Android デバイスと Mac が異なる場所にありながら、同じプライベート
Tailscale ネットワークを共有している場合に便利です。

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

- 初回接続時は Android デバイスを操作できる状態にしておきます。その Mac がデバイスを制御するには、Android 側で各 Mac の ADB
  キーを承認する必要があります。

### TCP 経由の ADB を有効にする

初期設定では、Android デバイスを USB で信頼できるコンピューターに接続し、デバッグの確認プロンプトを
承認します。次に、以下を実行します。

```bash
adb devices
adb tcpip 5555
```

これで USB を取り外せます。デバイスの再起動またはデバッグのリセット後にポート 5555 が待ち受けを停止した場合は、
このローカル設定手順を繰り返します。Android 11 以降では、
**Wireless debugging > Pair device with pairing code** と `adb pair` を使用して最初の信頼関係を確立することもできます。

### コントローラーとなる Mac のみを許可する

制限の厳しい許可設定を使用する tailnet では、コントローラーとなる Mac から Android デバイスの TCP ポート 5555 への
アクセスを明示的に許可する必要があります。次の例のアドレスを 2 台のデバイスの固定 Tailscale IP に置き換え、
tailnet ポリシーに限定的なルールを追加します。

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

ホストエイリアスやその他のセレクターについては、[Tailscale の許可設定](https://tailscale.com/docs/reference/syntax/grants)を参照してください。このポートを
パブリックインターネットに許可したり、Funnel で公開したりしないでください。認証された ADB
クライアントはデバイスを広範囲に制御できます。

### 接続してミラーリングを開始する

リモートの Mac で以下を実行します。

```bash
adb connect <android-tailnet-ip>:5555
adb devices
scrcpy --serial <android-tailnet-ip>:5555
```

この Mac から初めて `adb connect` を実行すると、Android に認証ダイアログが表示されます。デバイスのロックを解除し、
キーのフィンガープリントを確認します。Mac が信頼できる場合にのみ **Always allow from this computer** を選択してください。
`adb devices` の接続成功時のエントリは `device` で終わります。`unauthorized` はデバイス上のプロンプトが
まだ承認されていないことを意味します。

scrcpy ウィンドウが開いたら、直接使用するか、
[Peekaboo](https://peekaboo.sh/) などの macOS 画面自動化ツールで対象にします。scrcpy が画面表示と入力を担い、Tailscale は
プライベートネットワーク経路のみを提供します。

### トラブルシューティング

- `Connection timed out`: TCP 5555 に対する tailnet の許可設定を確認します。`tailscale ping` が成功しても、
  ピアへの到達性が確認できるだけで、この TCP ポートがポリシーで許可されていることは証明できません。Mac から
  `nc -vz <android-tailnet-ip> 5555` でテストしてください。
- `unauthorized`: Android のロックを解除してリモート Mac の ADB キーを承認するか、**Wireless debugging > Paired devices** で
  古いワークステーションを削除して再度ペアリングします。
- `Connection refused`: ローカルで再接続し、`adb tcpip 5555` をもう一度実行します。
- 複数のデバイスが表示される: 明示的な `--serial <android-tailnet-ip>:5555` 引数を維持します。

終了したら、scrcpy を閉じて ADB を切断します。

```bash
adb disconnect <android-tailnet-ip>:5555
```

## 接続運用手順

Android Node アプリ ⇄（mDNS/NSD + WebSocket）⇄ **Gateway**

Android は Gateway WebSocket に直接接続し、デバイスペアリング（`role: node`）を使用します。

Tailscale またはパブリックホストでは、Android に安全なエンドポイントが必要です。

- 推奨: Tailscale Serve / Funnel と `https://<magicdns>` / `wss://<magicdns>`
- その他の対応: 実際の TLS エンドポイントを持つ任意の `wss://` Gateway URL
- 平文の `ws://` は、プライベート LAN アドレス / `.local` ホストに加え、`localhost`、`127.0.0.1`、Android エミュレーターブリッジ（`10.0.2.2`）で引き続きサポートされます

### 前提条件

- 別のマシンで Gateway が稼働していること（または SSH 経由で到達可能であること）。
- Android デバイス/エミュレーターから Gateway WebSocket に到達できること。
  - mDNS/NSD を使用する同一 LAN、**または**
  - Wide-Area Bonjour / ユニキャスト DNS-SD を使用する同一 Tailscale tailnet（以下を参照）、**または**
  - Gateway のホスト/ポートを手動指定（フォールバック）
- tailnet/パブリックモバイルのペアリングでは、tailnet の生 IP を使った `ws://` エンドポイントは使用**しません**。代わりに Tailscale Serve または別の `wss://` URL を使用してください。
- ペアリング要求を承認するため、Gateway マシン上（または SSH 経由）で `openclaw` CLI を使用できること。

### 1. Gateway を起動する

```bash
openclaw gateway --port 18789 --verbose
```

ログに次のような表示があることを確認します。

- `listening on ws://0.0.0.0:18789`

Tailscale 経由で Android からリモートアクセスする場合は、tailnet への直接バインドではなく Serve/Funnel を推奨します。

```bash
openclaw gateway --tailscale serve
```

これにより、Android で安全な `wss://` / `https://` エンドポイントを使用できます。TLS を別途終端しない限り、単純な `gateway.bind: "tailnet"` 設定だけでは、初回のリモート Android ペアリングには不十分です。

### 2. 検出を確認する（任意）

Gateway マシンから以下を実行します。

```bash
dns-sd -B _openclaw-gw._tcp local.
```

デバッグに関するその他の注意事項: [Bonjour](/ja-JP/gateway/bonjour)。

広域検出ドメインも設定している場合は、次の結果と比較してください。

```bash
openclaw gateway discover --json
```

これにより、TXT のヒントだけでなく解決済みのサービスエンドポイントを使用して、`local.` と設定済みの広域ドメインが一度に表示されます。

#### ユニキャスト DNS-SD によるネットワーク間検出

Android の NSD/mDNS 検出はネットワークを越えません。Android Node と Gateway が異なるネットワーク上にあり、Tailscale で接続されている場合は、代わりに Wide-Area Bonjour / ユニキャスト DNS-SD を使用します。tailnet/パブリック環境での Android ペアリングには検出だけでは不十分です。検出された経路にも安全なエンドポイント（`wss://` または Tailscale Serve）が必要です。

1. Gateway ホスト上に DNS-SD ゾーン（例: `openclaw.internal.`）を設定し、`_openclaw-gw._tcp` レコードを公開します。
2. 選択したドメインの Tailscale スプリット DNS がその DNS サーバーを参照するように設定します。

詳細と CoreDNS の設定例: [Bonjour](/ja-JP/gateway/bonjour)。

### 3. Android から接続する

Android アプリで以下を行います。

- アプリは **フォアグラウンドサービス**（常駐通知）を使用して Gateway 接続を維持します。
- **Connect** タブを開きます。
- **Setup Code** または **Manual** モードを使用します。
- 検出がブロックされている場合は、**Advanced controls** でホスト/ポートを手動指定します。プライベート LAN ホストでは `ws://` を引き続き使用できます。Tailscale/パブリックホストでは TLS を有効にし、`wss://` / Tailscale Serve エンドポイントを使用します。

最初のペアリングに成功すると、Android は起動時にアクティブなペアリング済み Gateway に自動再接続します（検出された Gateway についてはベストエフォートであり、ネットワーク上で検出可能である必要があります）。

### 複数の Gateway

アプリはペアリングしたすべての Gateway のレジストリを保持するため、再ペアリングせずに切り替えられます。

- **Settings -> Gateways** にはペアリング済みの Gateway が一覧表示され、アクティブなものには印が付きます。エントリをタップすると切り替わり、アプリは現在のセッションを終了して、選択した Gateway に再接続します。
- 複数の Gateway がペアリングされている場合、**Connect** タブにクイックスイッチャーが表示されます。
- 認証情報、デバイストークン、TLS の信頼情報、チャット履歴、キューに入ったオフラインメッセージは Gateway ごとに保存されます。切り替えても Gateway 間で状態が混在することはなく、オフライン中にキューに入ったメッセージは、そのメッセージの送信先として記録された Gateway にのみ配信されます。
- **Forget** は、Gateway のレジストリエントリと、その認証情報、デバイストークン、TLS ピン、キャッシュ済みチャットを削除します。

### Presence 生存ビーコン

認証済み Node セッションが接続された後、およびフォアグラウンドサービスが接続を維持したままアプリがバックグラウンドに移行したとき、Android は `event: "node.presence.alive"` を指定して `node.event` を呼び出します。Gateway は、認証済み Node のデバイス ID が判明した後にのみ、ペアリング済み Node/デバイスのメタデータへこれを `lastSeenAtMs`/`lastSeenReason` として記録します。

アプリは、Gateway の応答に `handled: true` が含まれる場合にのみ、ビーコンが正常に記録されたと判断します。古い Gateway は `{ "ok": true }` で `node.event` を確認応答する場合があります。この応答には互換性がありますが、永続的な最終確認時刻の更新としてはカウントされません。

### 4. ペアリングを承認する（CLI）

Gateway マシンで以下を実行します。

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

ペアリングの詳細: [ペアリング](/ja-JP/channels/pairing)。

任意: Android Node が常に厳密に管理されたサブネットから接続する場合、明示的な CIDR または正確な IP を指定して、初回 Node ペアリングの自動承認を有効にできます。

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

これはデフォルトでは無効です。要求されたスコープがない新規の `role: node` ペアリングにのみ適用されます。オペレーター/ブラウザーのペアリング、およびロール、スコープ、メタデータ、公開鍵の変更には、引き続き手動承認が必要です。

### 5. Node が接続されていることを確認する

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. チャット + 履歴

Android の Chat タブはセッション選択（デフォルトは `main`、および既存のその他のセッション）に対応しています。

- 履歴: `chat.history`（表示用に正規化済み — インラインディレクティブタグ、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`、および途中で切り詰められた派生形）、漏出した ASCII／全角のモデル制御トークンは除去されます。正確に `NO_REPLY`／`no_reply` だけを含む行など、サイレントトークンのアシスタント行は省略されます。サイズ超過の行はプレースホルダーに置き換えられる場合があります）
- 送信: `chat.send`
- 永続的な送信: すべての送信（テキスト、選択した画像、ボイスメモ）は、ネットワーク接続を試みる前に Gateway ごとのデバイス上の送信トレイへ記録されるため、アプリが終了しても送信済みの入力は失われません。オフライン中にキューへ追加された送信は、再接続時に安定した冪等性キーを使用して順番に配信されます。送信は、そのターンが正規の `chat.history` に表示された後にのみ完了扱いとなり、確認応答だけでは配信の証明とはみなされません。結果が不明確な場合（確認応答の喪失、送信途中でのアプリ終了、トランスクリプト書き込み前の Gateway 再起動）は、自動再送信せず、明示的な **再試行**／**削除** 操作を備えた表示行として示されます。スラッシュコマンドは再接続後に自動で再実行されず、明示的に再試行されるまで保留されます。キューには上限（Gateway ごとに 50 件のメッセージと 48 MB の添付ファイルデータ）があり、未送信の行は 48 時間後に期限切れになります。送信されていない入力欄の下書きは、プロセス終了後まで永続化されません。
- プッシュ更新（ベストエフォート）: `chat.subscribe` -> `event:"chat"`
- 読み上げ: アシスタントのメッセージを長押しして **読み上げ** を選択すると音声で聞けます。音声は、設定済みの TTS プロバイダーチェーンを使用して Gateway の `tts.speak` で生成され、Gateway が音声を生成できない場合はデバイス上のシステム TTS が使用されます。セッションの切り替え、新しいチャットの開始、アプリのバックグラウンド移行、またはチャットを閉じると再生は停止します。

### 7. Canvas とカメラ

#### Gateway Canvas ホスト（Web コンテンツに推奨）

エージェントがディスク上で編集できる実際の HTML／CSS／JS を Node に表示させるには、Node の接続先を Gateway Canvas ホストに設定します。

<Note>
Node は Gateway HTTP サーバー（`gateway.port` と同じポート、デフォルトは `18789`）から Canvas を読み込みます。
</Note>

1. Gateway ホストに `~/.openclaw/workspace/canvas/index.html` を作成します。
2. Node からそのファイルへ移動します（LAN）:

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet（任意）: 両方のデバイスが Tailscale 上にある場合は、`.local` の代わりに MagicDNS 名または tailnet IP を使用します（例: `http://<gateway-magicdns>:18789/__openclaw__/canvas/`）。

このサーバーは HTML にライブリロードクライアントを注入し、ファイルの変更時に再読み込みします。Gateway は `/__openclaw__/a2ui/` も提供しますが、Android アプリはリモート A2UI ページを表示専用として扱います。アクション対応の A2UI コマンドでは、アプリにバンドルされ、アプリが所有する A2UI ページを使用します。

Canvas コマンド（フォアグラウンドのみ）:

- `canvas.eval`、`canvas.snapshot`、`canvas.navigate`（デフォルトのスキャフォールドに戻るには `{"url":""}` または `{"url":"/"}` を使用します）。`canvas.snapshot` は `{ format, base64 }` を返します（デフォルトは `format="jpeg"`）。
- A2UI: `canvas.a2ui.push`、`canvas.a2ui.reset`（`canvas.a2ui.pushJSONL` は従来のエイリアス）。これらはアクション対応の表示に、アプリにバンドルされ、アプリが所有する A2UI ページを使用します。

カメラコマンド（フォアグラウンドのみ、権限が必要）: `camera.snap`（jpg）、`camera.clip`（mp4）。パラメーターと CLI ヘルパーについては、[カメラ Node](/ja-JP/nodes/camera)を参照してください。

### 8. 音声と拡張された Android コマンドサーフェス

- 音声タブ: Android には 2 つの明示的なキャプチャモードがあります。**マイク** は手動の音声タブセッションで、各無音区間をチャットターンとして送信し、アプリがフォアグラウンドを離れるか、ユーザーが音声タブを離れると停止します。**トーク** は継続的なトークモードで、オフに切り替えるか Node が切断されるまで聞き取りを続けます。
- トークモードはキャプチャ開始前に、既存のフォアグラウンドサービスを `connectedDevice` から `connectedDevice|microphone` に昇格させ、トークモードの停止時に元へ戻します。Node サービスは `CHANGE_NETWORK_STATE` とともに `FOREGROUND_SERVICE_CONNECTED_DEVICE` を宣言します。Android 14+ ではさらに、`FOREGROUND_SERVICE_MICROPHONE` の宣言、実行時の `RECORD_AUDIO` 権限付与、および実行時のマイクサービス種別が必要です。
- デフォルトでは、Android のトークはネイティブ音声認識、Gateway チャット、および設定済みの Gateway トークプロバイダーを介した `talk.speak` を使用します。ローカルのシステム TTS は、`talk.speak` が利用できない場合にのみ使用されます。
- Android のトークがリアルタイム Gateway リレーを使用するのは、`talk.realtime.mode` が `realtime` で、かつ `talk.realtime.transport` が `gateway-relay` の場合のみです。
- Android は `voiceWake` 機能を公開しません。音声入力には **マイク** または **トーク** を使用してください。
- 追加の Android コマンドファミリー（利用可否はデバイス、権限、ユーザー設定によって異なります）:
  - `device.status`、`device.info`、`device.permissions`、`device.health`
  - `device.apps` は **Settings > Phone Capabilities > Installed Apps** が有効な場合のみ利用できます。デフォルトではランチャーに表示されるアプリを一覧表示します（完全な一覧を取得するには `includeNonLaunchable` を渡します）。
  - `notifications.list`、`notifications.actions`（後述の[通知転送](#notification-forwarding)を参照）
  - `photos.latest`
  - `contacts.search`、`contacts.add`
  - `calendar.events`、`calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`、`motion.pedometer`

### 9. ワークスペースファイル（読み取り専用）

ホームの概要には **ファイル** カードがあり、読み取り専用の `agents.workspace.list`／`agents.workspace.get` Gateway RPC を介して、アクティブなエージェントのワークスペースを参照できます。ディレクトリの掘り下げ、テキストと画像のプレビュー、Android の共有シートを介したエクスポートに対応しています。書き込み操作はなく、プレビューのサイズは Gateway によって制限されます。

## コマンド承認の確認

`operator.admin` を持つオペレーター接続、または Gateway が明示的に対象として指定したペアリング済みの
`operator.approvals` 接続は、**Settings -> Approvals** で保留中の exec リクエストを確認できます。アプリはボタンを有効にする前に
Gateway のサニタイズ済み承認レコードを読み込み、セキュリティ警告と、そのリクエストで提示された正確な選択肢を表示してから、
承認 ID と所有者種別を Gateway に送信します。

承認状態は Control UI および対応するチャットサーフェスと共有されます。最初に確定された回答が採用されます。別のサーフェスが先に回答した場合でも、
Android はその正規の結果を表示します。解決レスポンスが失われた場合や Gateway が切断された場合、
アプリは操作をロックしたままにし、別の判断を提示する前に承認を再度読み込みます。

統一された承認メソッドより前の Gateway では、出荷済みの
exec 固有メソッドにフォールバックします。保留中の確認は引き続き機能しますが、保持されたターミナル状態と
より詳細なサーフェス横断の結果を利用するには、更新済みの Gateway が必要です。

## アシスタントのエントリーポイント

Android は、システムアシスタントのトリガー（Google Assistant）からの OpenClaw 起動をサポートします。ホームボタンを長押しする（または別の `ACTION_ASSIST` トリガーを使用する）とアプリが開きます。「Hey Google, ask OpenClaw `<prompt>`」と言うと、アプリで宣言された App Actions のクエリパターンに一致し、プロンプトが自動送信されずにチャット入力欄へ渡されます。

これは、アプリマニフェストで宣言された Android の **App Actions**（`shortcuts.xml` 機能）を使用します。Gateway 側の設定は不要です。アシスタントのインテントは Android アプリ内だけで処理されます。

<Note>
App Actions を利用できるかどうかは、デバイス、Google Play Services のバージョン、およびユーザーが OpenClaw をデフォルトのアシスタントアプリとして設定しているかどうかによって異なります。
</Note>

## 通知転送

Android はデバイス通知を `node.event` 項目として Gateway に転送できます。これは Gateway／`openclaw.json` の設定ではなく、アプリの Settings シートで **デバイス上** に設定します。

| 設定                        | 説明                                                                                                                                                                                                                  |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Forward Notification Events | マスタートグル。デフォルトはオフです。最初に Notification Listener Access を付与する必要があります。                                                                                                                  |
| Package Filter              | **Allowlist**（一覧にあるパッケージ ID のみを転送）または **Blocklist**（デフォルト: 一覧にある ID 以外のすべてのパッケージ）。転送ループを防ぐため、Blocklist モードでは OpenClaw 自身のパッケージが常に除外されます。 |
| Quiet Hours                 | 転送を抑制するローカルの HH:mm 形式の開始／終了時間帯。デフォルトでは無効で、有効化するとデフォルト値は `22:00`-`07:00` です。                                                                                          |
| Max Events / Minute         | 転送される通知に対するデバイスごとのレート制限。デフォルトは 20 です。                                                                                                                                                |
| Route Session Key           | 任意。転送された通知イベントを、デバイスのデフォルト通知ルートではなく、特定のセッションに固定します。                                                                                                                |

<Note>
通知転送には Android の Notification Listener 権限が必要です。アプリはセットアップ中にこの権限を求めます。
</Note>

WhatsApp、WhatsApp Business、Telegram、Telegram X、Discord、Signal の通知は常に除外されます。これらのメッセージはすでにネイティブの OpenClaw チャネルセッションによって管理されています。Android の通知を別個の Node イベントとして転送すると、誤った会話を通じて返信がルーティングされる可能性があります。

## 関連項目

- [iOS アプリ](/ja-JP/platforms/ios)
- [Node](/ja-JP/nodes)
- [Android Node のトラブルシューティング](/ja-JP/nodes/troubleshooting)

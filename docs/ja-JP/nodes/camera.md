---
read_when:
    - Node プラットフォームでのカメラキャプチャの追加または変更
    - エージェントがアクセス可能な MEDIA 一時ファイルワークフローの拡張
summary: 写真や短い動画クリップを撮影するための、iOS、Android、macOS、Linux Nodeでのカメラキャプチャ
title: カメラ撮影
x-i18n:
    generated_at: "2026-07-14T13:50:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 8fff8302863b63209222d87b350238dd2f01e18d06ce1783036b3cefaca14020
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw は、ペアリングされた **iOS**、**Android**、**macOS**、**Linux** の各 Node 上でのエージェントワークフロー向けカメラ撮影をサポートしています。Gateway `node.invoke` を介して、写真の撮影（`jpg`）または短い動画クリップの撮影（`mp4`、音声は任意）が可能です。

すべてのカメラアクセスは、プラットフォームごとにユーザーが制御できる設定によって制限されます。

## iOS Node

### iOS のユーザー設定

- iOS Settings タブ → **Camera** → **Allow Camera**（`camera.enabled`）。
  - デフォルト: **オン**（キーが存在しない場合は有効として扱われます）。
  - オフの場合: `camera.*` コマンドは `CAMERA_DISABLED` を返します。

### iOS コマンド（Gateway `node.invoke` 経由）

- `camera.list`
  - レスポンスペイロード: `devices` — `{ id, name, position, deviceType }` の配列。

- `camera.snap`
  - パラメーター:
    - `facing`: `front|back`（デフォルト: `front`）
    - `maxWidth`: 数値（任意、デフォルト `1600`）
    - `quality`: `0..1`（任意、デフォルト `0.9`、`[0.05, 1.0]` に制限）
    - `format`: 現在は `jpg`
    - `delayMs`: 数値（任意、デフォルト `0`、内部で `10000` を上限として制限）
    - `deviceId`: 文字列（任意、`camera.list` から取得）
  - レスポンスペイロード: `format: "jpg"`、`base64`、`width`、`height`。
  - ペイロード保護: base64 エンコード後のペイロードを 5MB 未満に収めるため、写真は再圧縮されます。

- `camera.clip`
  - パラメーター:
    - `facing`: `front|back`（デフォルト: `front`）
    - `durationMs`: 数値（デフォルト `3000`、`[250, 60000]` に制限）
    - `includeAudio`: ブール値（デフォルト `true`）
    - `format`: 現在は `mp4`
    - `deviceId`: 文字列（任意、`camera.list` から取得）
  - レスポンスペイロード: `format: "mp4"`、`base64`、`durationMs`、`hasAudio`。

### iOS のフォアグラウンド要件

`canvas.*` と同様に、iOS Node は**フォアグラウンド**でのみ `camera.*` コマンドを許可します。バックグラウンドからの呼び出しは `NODE_BACKGROUND_UNAVAILABLE` を返します。

### CLI ヘルパー

メディアファイルを取得する最も簡単な方法は、デコードしたメディアを一時ファイルへ書き込み、保存先のパスを表示する CLI ヘルパーを使用することです。

```bash
openclaw nodes camera snap --node <id>                 # デフォルト: 前面 + 背面の両方（MEDIA 行 2 行）
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

`nodes camera snap` のデフォルトは `--facing both` で、エージェントに両方の視点を提供するために前面と背面の両方を撮影します。単一の向きのみを明示するには `--device-id` を渡します（`--device-id` が設定されている場合、`both` は拒否されます）。独自のラッパーを構築しない限り、出力ファイルは一時ファイル（OS の一時ディレクトリ内）です。

## Android Node

### Android のユーザー設定

- Android Settings シート → **Camera** → **Allow Camera**（`camera.enabled`）。
  - **新規インストールではデフォルトでオフです。** この設定の導入以前から存在するインストールは**オン**へ移行されるため、アップグレードによって以前は機能していたカメラアクセスが通知なく失われることはありません。
  - オフの場合: `camera.*` コマンドは `CAMERA_DISABLED: enable Camera in Settings` を返します。

### 権限

- `camera.snap` と `camera.clip` の両方に `CAMERA` が必要です。権限がない場合または拒否された場合は `CAMERA_PERMISSION_REQUIRED` を返します。
- `includeAudio` が `true` の場合、`camera.clip` には `RECORD_AUDIO` が必要です。権限がない場合または拒否された場合は `MIC_PERMISSION_REQUIRED` を返します。

可能な場合、アプリは実行時権限を求めるプロンプトを表示します。

### Android のフォアグラウンド要件

`canvas.*` と同様に、Android Node は**フォアグラウンド**でのみ `camera.*` コマンドを許可します。バックグラウンドからの呼び出しは `NODE_BACKGROUND_UNAVAILABLE: command requires foreground` を返します。

### Android コマンド（Gateway `node.invoke` 経由）

- `camera.list`
  - レスポンスペイロード: `devices` — `{ id, name, position, deviceType }` の配列。

- `camera.snap`
  - パラメーター: `facing`（`front|back`、デフォルト `front`）、`quality`（デフォルト `0.95`、`[0.1, 1.0]` に制限）、`maxWidth`（デフォルト `1600`）、`deviceId`（任意、不明な ID は `INVALID_REQUEST` で失敗）。
  - レスポンスペイロード: `format: "jpg"`、`base64`、`width`、`height`。
  - ペイロード保護: base64 を 5MB 未満に収めるため再圧縮されます（iOS と同じ上限）。

- `camera.clip`
  - パラメーター: `facing`（デフォルト `front`）、`durationMs`（デフォルト `3000`、`[200, 60000]` に制限）、`includeAudio`（デフォルト `true`）、`deviceId`（任意）。
  - レスポンスペイロード: `format: "mp4"`、`base64`、`durationMs`、`hasAudio`。
  - ペイロード保護: base64 エンコード前の生 MP4 は 18MB を上限とします。上限を超えるクリップは `PAYLOAD_TOO_LARGE` で失敗します（`durationMs` を小さくして再試行してください）。

## macOS アプリ

### macOS のユーザー設定

macOS コンパニオンアプリには次のチェックボックスがあります。

- **Settings → General → Allow Camera**（`openclaw.cameraEnabled`）。
  - デフォルト: **オフ**。
  - オフの場合: カメラリクエストは `CAMERA_DISABLED: enable Camera in Settings` を返します。

### CLI ヘルパー（Node の呼び出し）

メインの `openclaw` CLI を使用して、macOS Node 上でカメラコマンドを呼び出します。

```bash
openclaw nodes camera list --node <id>                     # カメラ ID を一覧表示
openclaw nodes camera snap --node <id>                     # 保存先のパスを表示
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # 保存先のパスを表示
openclaw nodes camera clip --node <id> --duration-ms 3000   # 保存先のパスを表示（レガシーフラグ）
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- 上書きされない限り、`openclaw nodes camera snap` のデフォルトは `maxWidth=1600` です。
- `camera.snap` は、ウォームアップと露出の安定後、撮影前に `delayMs`（デフォルト 2000ms、`[0, 10000]` に制限）待機します。
- base64 を 5MB 未満に収めるため、写真のペイロードは再圧縮されます。

## Linux Node ホスト

同梱の Linux Node Plugin は、CLI の `openclaw node` サービスにカメラ撮影機能を追加します。ヘッドレスホスト上で動作し、Linux デスクトップアプリは必要ありません。

カメラアクセスはデフォルトでオフです。Plugin エントリで有効にしてから Node サービスを再起動し、Gateway のアドバタイズ情報を再構築してください。

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          camera: { enabled: true },
        },
      },
    },
  },
}
```

要件:

- V4L2 入力、`libx264`、AAC をサポートする FFmpeg
- Node サービスのユーザーが読み取り可能な `/dev/video*` デバイス。一般的なディストリビューションでは、そのユーザーを `video` グループに追加します
- デフォルトの `includeAudio: true` を使用するクリップの場合、デフォルトソースが設定された、動作する PulseAudio サーバーまたは PipeWire の PulseAudio 互換レイヤー

Linux は、`camera.list` から撮影可能かつ読み取り可能な V4L2 デバイスパスを返します。FFmpeg は各 `/dev/video*` 候補を検査し、メタデータ専用または出力専用の Node を除外します。デバイスの `position` は `unknown` であるため、`deviceId` を指定せずに向きを要求すると、前面または背面カメラであると見なす代わりに、`unknown` 位置の写真またはクリップを 1 つ生成します。ホストに複数のカメラがある場合は `deviceId` を使用してください。`camera.snap` は `delayMs` に FFmpeg の入力ウォームアップを使用し、幅を制限しながらアスペクト比を維持します。`camera.clip` はマイク音声を MP4 の音声トラックとして録音します。OpenClaw は意図的に単独のマイクコマンドを提供していません。

この Plugin は MP4 動画に `libx264` を使用し、コーデックを暗黙に変更しません。必要な入力またはエンコーダーを備えていない FFmpeg ビルドは `CAMERA_UNAVAILABLE` を返します。25MB の base64 ペイロード上限を超える写真およびクリップは `PAYLOAD_TOO_LARGE` で失敗します。

`camera.snap` と `camera.clip` は引き続き危険なコマンドです。撮影を有効化する意図がある場合にのみ `gateway.nodes.allowCommands` に追加してください。Plugin を有効にするだけでは Gateway ポリシーを迂回しません。

## 安全性と実用上の制限

- カメラとマイクへのアクセスでは、通常の OS 権限プロンプトが表示されます（また、`Info.plist` に用途説明文字列が必要です）。
- Node のペイロードが大きくなりすぎることを避けるため、動画クリップは 60s を上限とします（base64 のオーバーヘッドとメッセージ制限を考慮）。

## macOS の画面動画（OS レベル）

カメラではなく_画面_動画を撮影するには、macOS コンパニオンを使用します。

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # 保存先のパスを表示
```

macOS の **Screen Recording** 権限（TCC）が必要です。

## 関連項目

- [画像とメディアのサポート](/ja-JP/nodes/images)
- [メディア理解](/ja-JP/nodes/media-understanding)
- [位置情報コマンド](/ja-JP/nodes/location-command)

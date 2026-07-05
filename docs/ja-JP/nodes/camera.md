---
read_when:
    - iOS/Android ノードまたは macOS でのカメラキャプチャの追加または変更
    - エージェントがアクセス可能な MEDIA 一時ファイルワークフローの拡張
summary: エージェント利用向けのカメラ撮影（iOS/Android ノード + macOS アプリ）：写真（jpg）と短い動画クリップ（mp4）
title: カメラ撮影
x-i18n:
    generated_at: "2026-07-05T11:34:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 38555c98886f6cd74ddacabc049da353cdb023e7f99aba81a272021cd8a0e33d
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw は、ペアリング済みの **iOS**、**Android**、**macOS** ノード上のエージェントワークフロー向けにカメラキャプチャをサポートします。Gateway `node.invoke` 経由で、写真 (`jpg`) または短い動画クリップ (`mp4`、音声は任意) をキャプチャできます。

すべてのカメラアクセスは、プラットフォームごとのユーザー制御設定によって保護されています。

## iOS ノード

### iOS ユーザー設定

- iOS Settings タブ → **Camera** → **Allow Camera** (`camera.enabled`)。
  - デフォルト: **オン** (キーがない場合は有効として扱われます)。
  - オフの場合: `camera.*` コマンドは `CAMERA_DISABLED` を返します。

### iOS コマンド (Gateway `node.invoke` 経由)

- `camera.list`
  - レスポンスペイロード: `devices` — `{ id, name, position, deviceType }` の配列。

- `camera.snap`
  - パラメーター:
    - `facing`: `front|back` (デフォルト: `front`)
    - `maxWidth`: 数値 (任意、デフォルト `1600`)
    - `quality`: `0..1` (任意、デフォルト `0.9`、`[0.05, 1.0]` にクランプ)
    - `format`: 現在は `jpg`
    - `delayMs`: 数値 (任意、デフォルト `0`、内部的に `10000` が上限)
    - `deviceId`: 文字列 (任意、`camera.list` から取得)
  - レスポンスペイロード: `format: "jpg"`、`base64`、`width`、`height`。
  - ペイロードガード: 写真は再圧縮され、base64 エンコード済みペイロードが 5MB 未満に保たれます。

- `camera.clip`
  - パラメーター:
    - `facing`: `front|back` (デフォルト: `front`)
    - `durationMs`: 数値 (デフォルト `3000`、`[250, 60000]` にクランプ)
    - `includeAudio`: ブール値 (デフォルト `true`)
    - `format`: 現在は `mp4`
    - `deviceId`: 文字列 (任意、`camera.list` から取得)
  - レスポンスペイロード: `format: "mp4"`、`base64`、`durationMs`、`hasAudio`。

### iOS のフォアグラウンド要件

`canvas.*` と同様に、iOS ノードは **フォアグラウンド** でのみ `camera.*` コマンドを許可します。バックグラウンド呼び出しは `NODE_BACKGROUND_UNAVAILABLE` を返します。

### CLI ヘルパー

メディアファイルを取得する最も簡単な方法は CLI ヘルパーを使うことです。これはデコード済みメディアを一時ファイルに書き込み、保存先パスを出力します。

```bash
openclaw nodes camera snap --node <id>                 # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

`nodes camera snap` はデフォルトで `--facing both` になり、エージェントに両方の視点を提供するために前面と背面の両方をキャプチャします。単一の明示的な向きとともに `--device-id` を渡してください (`--device-id` が設定されている場合、`both` は拒否されます)。出力ファイルは独自のラッパーを構築しない限り、一時ファイル (OS の一時ディレクトリ内) です。

## Android ノード

### Android ユーザー設定

- Android Settings シート → **Camera** → **Allow Camera** (`camera.enabled`)。
  - **新規インストールではデフォルトでオフです。** この設定より前の既存インストールは **オン** に移行されるため、アップグレードによって以前は動作していたカメラアクセスが黙って失われることはありません。
  - オフの場合: `camera.*` コマンドは `CAMERA_DISABLED: enable Camera in Settings` を返します。

### 権限

- `CAMERA` は `camera.snap` と `camera.clip` の両方で必要です。権限がない、または拒否されている場合は `CAMERA_PERMISSION_REQUIRED` を返します。
- `includeAudio` が `true` の場合、`camera.clip` には `RECORD_AUDIO` が必要です。権限がない、または拒否されている場合は `MIC_PERMISSION_REQUIRED` を返します。

アプリは可能な場合、実行時権限を求めます。

### Android のフォアグラウンド要件

`canvas.*` と同様に、Android ノードは **フォアグラウンド** でのみ `camera.*` コマンドを許可します。バックグラウンド呼び出しは `NODE_BACKGROUND_UNAVAILABLE: command requires foreground` を返します。

### Android コマンド (Gateway `node.invoke` 経由)

- `camera.list`
  - レスポンスペイロード: `devices` — `{ id, name, position, deviceType }` の配列。

- `camera.snap`
  - パラメーター: `facing` (`front|back`、デフォルト `front`)、`quality` (デフォルト `0.95`、`[0.1, 1.0]` にクランプ)、`maxWidth` (デフォルト `1600`)、`deviceId` (任意、不明な ID は `INVALID_REQUEST` で失敗)。
  - レスポンスペイロード: `format: "jpg"`、`base64`、`width`、`height`。
  - ペイロードガード: base64 を 5MB 未満に保つため再圧縮されます (iOS と同じ上限)。

- `camera.clip`
  - パラメーター: `facing` (デフォルト `front`)、`durationMs` (デフォルト `3000`、`[200, 60000]` にクランプ)、`includeAudio` (デフォルト `true`)、`deviceId` (任意)。
  - レスポンスペイロード: `format: "mp4"`、`base64`、`durationMs`、`hasAudio`。
  - ペイロードガード: 生の MP4 は base64 エンコード前に 18MB が上限です。サイズ超過のクリップは `PAYLOAD_TOO_LARGE` で失敗します (`durationMs` を短くして再試行してください)。

## macOS アプリ

### macOS ユーザー設定

macOS コンパニオンアプリにはチェックボックスがあります。

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)。
  - デフォルト: **オフ**。
  - オフの場合: カメラリクエストは `CAMERA_DISABLED: enable Camera in Settings` を返します。

### CLI ヘルパー (node invoke)

メインの `openclaw` CLI を使用して、macOS ノード上でカメラコマンドを呼び出します。

```bash
openclaw nodes camera list --node <id>                     # list camera ids
openclaw nodes camera snap --node <id>                     # prints saved path
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # prints saved path
openclaw nodes camera clip --node <id> --duration-ms 3000   # prints saved path (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- `openclaw nodes camera snap` は上書きされない限り、デフォルトで `maxWidth=1600` です。
- `camera.snap` はウォームアップ/露出安定の後、キャプチャ前に `delayMs` (デフォルト 2000ms、`[0, 10000]` にクランプ) 待機します。
- 写真ペイロードは再圧縮され、base64 が 5MB 未満に保たれます。

## 安全性 + 実用上の制限

- カメラとマイクへのアクセスは通常の OS 権限プロンプトをトリガーします (また、`Info.plist` に用途説明文字列が必要です)。
- 動画クリップは、ノードペイロードが過大になるのを避けるため 60 秒に制限されています (base64 のオーバーヘッドとメッセージ制限のため)。

## macOS 画面動画 (OS レベル)

_画面_ 動画 (カメラではない) には、macOS コンパニオンを使用します。

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints saved path
```

macOS の **Screen Recording** 権限 (TCC) が必要です。

## 関連

- [画像とメディアのサポート](/ja-JP/nodes/images)
- [メディア理解](/ja-JP/nodes/media-understanding)
- [位置情報コマンド](/ja-JP/nodes/location-command)

---
read_when:
    - iOS/Android NodeまたはmacOSでのカメラ撮影の追加・変更
    - エージェントがアクセス可能な MEDIA 一時ファイルワークフローの拡張
summary: エージェントが使用するカメラ撮影（iOS/Android Node + macOSアプリ）：写真（jpg）および短い動画クリップ（mp4）
title: カメラ撮影
x-i18n:
    generated_at: "2026-07-11T22:21:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 38555c98886f6cd74ddacabc049da353cdb023e7f99aba81a272021cd8a0e33d
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw は、ペアリングされた **iOS**、**Android**、**macOS** Node 上のエージェントワークフローでカメラ撮影をサポートしています。Gateway の `node.invoke` を介して写真（`jpg`）または短い動画クリップ（`mp4`、音声は任意）を撮影できます。

すべてのカメラアクセスは、各プラットフォームでユーザーが制御できる設定によって制限されます。

## iOS Node

### iOS のユーザー設定

- iOS の Settings タブ → **Camera** → **Allow Camera**（`camera.enabled`）。
  - デフォルト：**オン**（キーが存在しない場合は有効として扱われます）。
  - オフの場合：`camera.*` コマンドは `CAMERA_DISABLED` を返します。

### iOS コマンド（Gateway の `node.invoke` 経由）

- `camera.list`
  - レスポンスペイロード：`devices` — `{ id, name, position, deviceType }` の配列。

- `camera.snap`
  - パラメーター：
    - `facing`：`front|back`（デフォルト：`front`）
    - `maxWidth`：数値（任意、デフォルトは `1600`）
    - `quality`：`0..1`（任意、デフォルトは `0.9`、`[0.05, 1.0]` の範囲に制限）
    - `format`：現在は `jpg`
    - `delayMs`：数値（任意、デフォルトは `0`、内部では上限 `10000`）
    - `deviceId`：文字列（任意、`camera.list` から取得）
  - レスポンスペイロード：`format: "jpg"`、`base64`、`width`、`height`。
  - ペイロード保護：base64 エンコードされたペイロードが 5MB 未満になるように写真を再圧縮します。

- `camera.clip`
  - パラメーター：
    - `facing`：`front|back`（デフォルト：`front`）
    - `durationMs`：数値（デフォルトは `3000`、`[250, 60000]` の範囲に制限）
    - `includeAudio`：真偽値（デフォルト：`true`）
    - `format`：現在は `mp4`
    - `deviceId`：文字列（任意、`camera.list` から取得）
  - レスポンスペイロード：`format: "mp4"`、`base64`、`durationMs`、`hasAudio`。

### iOS のフォアグラウンド要件

`canvas.*` と同様に、iOS Node は**フォアグラウンド**でのみ `camera.*` コマンドを許可します。バックグラウンドでの呼び出しは `NODE_BACKGROUND_UNAVAILABLE` を返します。

### CLI ヘルパー

メディアファイルを取得する最も簡単な方法は、デコードしたメディアを一時ファイルに書き込み、保存先のパスを表示する CLI ヘルパーを使用することです。

```bash
openclaw nodes camera snap --node <id>                 # デフォルト：前面 + 背面の両方（MEDIA 行 2 行）
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

`nodes camera snap` のデフォルトは `--facing both` で、エージェントに両方の視点を提供するため、前面と背面の両方を撮影します。単一の向きを明示して `--device-id` を渡してください（`--device-id` が設定されている場合、`both` は拒否されます）。独自のラッパーを構築しない限り、出力ファイルは一時ファイルです（OS の一時ディレクトリ内）。

## Android Node

### Android のユーザー設定

- Android の Settings シート → **Camera** → **Allow Camera**（`camera.enabled`）。
  - **新規インストールではデフォルトでオフです。** この設定が導入される前から存在するインストールは、アップグレードによって以前は動作していたカメラアクセスが通知なく失われないように、**オン**へ移行されます。
  - オフの場合：`camera.*` コマンドは `CAMERA_DISABLED: enable Camera in Settings` を返します。

### 権限

- `camera.snap` と `camera.clip` の両方に `CAMERA` が必要です。権限がないか拒否されている場合は `CAMERA_PERMISSION_REQUIRED` を返します。
- `includeAudio` が `true` の場合、`camera.clip` には `RECORD_AUDIO` が必要です。権限がないか拒否されている場合は `MIC_PERMISSION_REQUIRED` を返します。

可能な場合、アプリは実行時権限を求めるプロンプトを表示します。

### Android のフォアグラウンド要件

`canvas.*` と同様に、Android Node は**フォアグラウンド**でのみ `camera.*` コマンドを許可します。バックグラウンドでの呼び出しは `NODE_BACKGROUND_UNAVAILABLE: command requires foreground` を返します。

### Android コマンド（Gateway の `node.invoke` 経由）

- `camera.list`
  - レスポンスペイロード：`devices` — `{ id, name, position, deviceType }` の配列。

- `camera.snap`
  - パラメーター：`facing`（`front|back`、デフォルトは `front`）、`quality`（デフォルトは `0.95`、`[0.1, 1.0]` の範囲に制限）、`maxWidth`（デフォルトは `1600`）、`deviceId`（任意、不明な ID の場合は `INVALID_REQUEST` で失敗）。
  - レスポンスペイロード：`format: "jpg"`、`base64`、`width`、`height`。
  - ペイロード保護：base64 が 5MB 未満になるように再圧縮します（iOS と同じ上限）。

- `camera.clip`
  - パラメーター：`facing`（デフォルトは `front`）、`durationMs`（デフォルトは `3000`、`[200, 60000]` の範囲に制限）、`includeAudio`（デフォルトは `true`）、`deviceId`（任意）。
  - レスポンスペイロード：`format: "mp4"`、`base64`、`durationMs`、`hasAudio`。
  - ペイロード保護：base64 エンコード前の未加工 MP4 は 18MB に制限されます。上限を超えたクリップは `PAYLOAD_TOO_LARGE` で失敗します（`durationMs` を短くして再試行してください）。

## macOS アプリ

### macOS のユーザー設定

macOS コンパニオンアプリには、次のチェックボックスがあります。

- **Settings → General → Allow Camera**（`openclaw.cameraEnabled`）。
  - デフォルト：**オフ**。
  - オフの場合：カメラリクエストは `CAMERA_DISABLED: enable Camera in Settings` を返します。

### CLI ヘルパー（Node 呼び出し）

メインの `openclaw` CLI を使用して、macOS Node 上でカメラコマンドを呼び出します。

```bash
openclaw nodes camera list --node <id>                     # カメラ ID を一覧表示
openclaw nodes camera snap --node <id>                     # 保存先のパスを表示
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # 保存先のパスを表示
openclaw nodes camera clip --node <id> --duration-ms 3000   # 保存先のパスを表示（従来のフラグ）
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- `openclaw nodes camera snap` は、上書きしない限りデフォルトで `maxWidth=1600` を使用します。
- `camera.snap` は、ウォームアップと露出の安定後、撮影前に `delayMs`（デフォルトは 2000ms、`[0, 10000]` の範囲に制限）だけ待機します。
- 写真のペイロードは、base64 が 5MB 未満になるように再圧縮されます。

## 安全性と実用上の制限

- カメラとマイクへのアクセスでは、通常の OS 権限プロンプトが表示されます（また、`Info.plist` に用途説明文字列が必要です）。
- Node のペイロードが過大になることを避けるため、動画クリップは 60 秒に制限されます（base64 のオーバーヘッドとメッセージ上限を考慮）。

## macOS の画面動画（OS レベル）

カメラではなく_画面_の動画を撮影するには、macOS コンパニオンを使用します。

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # 保存先のパスを表示
```

macOS の **Screen Recording** 権限（TCC）が必要です。

## 関連項目

- [画像とメディアのサポート](/ja-JP/nodes/images)
- [メディアの理解](/ja-JP/nodes/media-understanding)
- [位置情報コマンド](/ja-JP/nodes/location-command)

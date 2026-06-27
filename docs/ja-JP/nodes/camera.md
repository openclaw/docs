---
read_when:
    - iOS/Android ノードまたは macOS でのカメラキャプチャの追加または変更
    - エージェントがアクセス可能な MEDIA 一時ファイルワークフローの拡張
summary: エージェント利用向けのカメラ撮影（iOS/Android ノード + macOS アプリ）：写真（jpg）と短い動画クリップ（mp4）
title: カメラキャプチャ
x-i18n:
    generated_at: "2026-06-27T11:53:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cb02b1e0e5d68e537dc699bcabacfb48b7beaf07459bf47800810a721191795
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw はエージェントワークフロー向けに **カメラキャプチャ** をサポートしています。

- **iOS ノード**（Gateway 経由でペアリング）: `node.invoke` 経由で **写真**（`jpg`）または **短い動画クリップ**（`mp4`、任意で音声付き）をキャプチャします。
- **Android ノード**（Gateway 経由でペアリング）: `node.invoke` 経由で **写真**（`jpg`）または **短い動画クリップ**（`mp4`、任意で音声付き）をキャプチャします。
- **macOS アプリ**（Gateway 経由のノード）: `node.invoke` 経由で **写真**（`jpg`）または **短い動画クリップ**（`mp4`、任意で音声付き）をキャプチャします。

すべてのカメラアクセスは **ユーザーが制御する設定** によって制限されます。

## iOS ノード

### ユーザー設定（デフォルトはオン）

- iOS Settings タブ → **Camera** → **Allow Camera**（`camera.enabled`）
  - デフォルト: **オン**（キーがない場合は有効として扱われます）。
  - オフの場合: `camera.*` コマンドは `CAMERA_DISABLED` を返します。

### コマンド（Gateway `node.invoke` 経由）

- `camera.list`
  - レスポンスペイロード:
    - `devices`: `{ id, name, position, deviceType }` の配列

- `camera.snap`
  - パラメーター:
    - `facing`: `front|back`（デフォルト: `front`）
    - `maxWidth`: 数値（任意。iOS ノードでのデフォルトは `1600`）
    - `quality`: `0..1`（任意。デフォルトは `0.9`）
    - `format`: 現在は `jpg`
    - `delayMs`: 数値（任意。デフォルトは `0`）
    - `deviceId`: 文字列（任意。`camera.list` から取得）
  - レスポンスペイロード:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - ペイロードガード: base64 ペイロードが 5 MB 未満に収まるよう、写真は再圧縮されます。

- `camera.clip`
  - パラメーター:
    - `facing`: `front|back`（デフォルト: `front`）
    - `durationMs`: 数値（デフォルトは `3000`、最大 `60000` にクランプ）
    - `includeAudio`: 真偽値（デフォルトは `true`）
    - `format`: 現在は `mp4`
    - `deviceId`: 文字列（任意。`camera.list` から取得）
  - レスポンスペイロード:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### フォアグラウンド要件

`canvas.*` と同様に、iOS ノードは **フォアグラウンド** でのみ `camera.*` コマンドを許可します。バックグラウンドでの呼び出しは `NODE_BACKGROUND_UNAVAILABLE` を返します。

### CLI ヘルパー

メディアファイルを取得する最も簡単な方法は CLI ヘルパーを使うことです。これはデコードしたメディアを一時ファイルに書き込み、保存先パスを出力します。

例:

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

注:

- `nodes camera snap` は、エージェントに両方の視点を渡すため、デフォルトで **両方** の向きを使用します。
- 独自のラッパーを作成しない限り、出力ファイルは一時ファイル（OS の一時ディレクトリ内）です。

## Android ノード

### Android ユーザー設定（デフォルトはオン）

- Android Settings シート → **Camera** → **Allow Camera**（`camera.enabled`）
  - デフォルト: **オン**（キーがない場合は有効として扱われます）。
  - オフの場合: `camera.*` コマンドは `CAMERA_DISABLED` を返します。

### 権限

- Android ではランタイム権限が必要です:
  - `camera.snap` と `camera.clip` の両方に `CAMERA`。
  - `includeAudio=true` の場合、`camera.clip` に `RECORD_AUDIO`。

権限がない場合、可能であればアプリがプロンプトを表示します。拒否された場合、`camera.*` リクエストは
`*_PERMISSION_REQUIRED` エラーで失敗します。

### Android フォアグラウンド要件

`canvas.*` と同様に、Android ノードは **フォアグラウンド** でのみ `camera.*` コマンドを許可します。バックグラウンドでの呼び出しは `NODE_BACKGROUND_UNAVAILABLE` を返します。

### Android コマンド（Gateway `node.invoke` 経由）

- `camera.list`
  - レスポンスペイロード:
    - `devices`: `{ id, name, position, deviceType }` の配列

### ペイロードガード

base64 ペイロードが 5 MB 未満に収まるよう、写真は再圧縮されます。

## macOS アプリ

### ユーザー設定（デフォルトはオフ）

macOS コンパニオンアプリはチェックボックスを公開します。

- **Settings → General → Allow Camera**（`openclaw.cameraEnabled`）
  - デフォルト: **オフ**
  - オフの場合: カメラリクエストは「ユーザーによりカメラが無効化されています」を返します。

### CLI ヘルパー（ノード呼び出し）

メインの `openclaw` CLI を使用して、macOS ノード上でカメラコマンドを呼び出します。

例:

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints saved path
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints saved path
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints saved path (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

注:

- `openclaw nodes camera snap` は、上書きされない限りデフォルトで `maxWidth=1600` を使用します。
- macOS では、`camera.snap` はウォームアップと露出安定後、キャプチャ前に `delayMs`（デフォルト 2000ms）だけ待機します。
- base64 が 5 MB 未満に収まるよう、写真ペイロードは再圧縮されます。

## 安全性と実用上の制限

- カメラとマイクへのアクセスでは、通常の OS 権限プロンプトが表示されます（また、Info.plist に用途説明文字列が必要です）。
- 動画クリップは、ノードペイロードが大きくなりすぎるのを避けるために制限されています（現在は `<= 60s`。base64 のオーバーヘッドとメッセージ制限のため）。

## macOS 画面動画（OS レベル）

_画面_ 動画（カメラではない）には、macOS コンパニオンを使用します。

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints saved path
```

注:

- macOS の **Screen Recording** 権限（TCC）が必要です。

## 関連

- [画像とメディアのサポート](/ja-JP/nodes/images)
- [メディア理解](/ja-JP/nodes/media-understanding)
- [位置情報コマンド](/ja-JP/nodes/location-command)

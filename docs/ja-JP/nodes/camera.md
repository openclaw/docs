---
read_when:
    - iOS/Android NodesまたはmacOSでカメラ撮影を追加または変更する
    - エージェントが利用できるMEDIA一時ファイルワークフローを拡張する
summary: 'エージェント利用のためのカメラ撮影（iOS/Android Nodes + macOSアプリ）: 写真（jpg）と短い動画クリップ（mp4）'
title: カメラ撮影
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T05:06:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 33e23a382cdcea57e20ab1466bf32e54dd17e3b7918841dbd6d3ebf59547ad93
    source_path: nodes/camera.md
    workflow: 15
---

OpenClawは、エージェントワークフロー向けの**カメラ撮影**をサポートしています:

- **iOS node**（Gateway経由でペアリング）: `node.invoke` 経由で**写真**（`jpg`）または**短い動画クリップ**（`mp4`、任意で音声付き）を撮影
- **Android node**（Gateway経由でペアリング）: `node.invoke` 経由で**写真**（`jpg`）または**短い動画クリップ**（`mp4`、任意で音声付き）を撮影
- **macOSアプリ**（Gateway経由のnode）: `node.invoke` 経由で**写真**（`jpg`）または**短い動画クリップ**（`mp4`、任意で音声付き）を撮影

すべてのカメラアクセスは、**ユーザー制御設定**の背後で制御されます。

## iOS node

### ユーザー設定（デフォルトでオン）

- iOS Settingsタブ → **Camera** → **Allow Camera**（`camera.enabled`）
  - デフォルト: **オン**（キーがない場合は有効として扱われます）。
  - オフのとき: `camera.*` コマンドは `CAMERA_DISABLED` を返します。

### コマンド（Gateway `node.invoke` 経由）

- `camera.list`
  - レスポンスペイロード:
    - `devices`: `{ id, name, position, deviceType }` の配列

- `camera.snap`
  - パラメータ:
    - `facing`: `front|back`（デフォルト: `front`）
    - `maxWidth`: number（任意。iOS nodeではデフォルト `1600`）
    - `quality`: `0..1`（任意。デフォルト `0.9`）
    - `format`: 現在は `jpg`
    - `delayMs`: number（任意。デフォルト `0`）
    - `deviceId`: string（任意。`camera.list` から）
  - レスポンスペイロード:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - ペイロードガード: 写真は、base64ペイロードが5 MB未満になるよう再圧縮されます。

- `camera.clip`
  - パラメータ:
    - `facing`: `front|back`（デフォルト: `front`）
    - `durationMs`: number（デフォルト `3000`、最大 `60000` に制限）
    - `includeAudio`: boolean（デフォルト `true`）
    - `format`: 現在は `mp4`
    - `deviceId`: string（任意。`camera.list` から）
  - レスポンスペイロード:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### foreground要件

`canvas.*` と同様に、iOS nodeは **foreground** でのみ `camera.*` コマンドを許可します。backgroundからの呼び出しは `NODE_BACKGROUND_UNAVAILABLE` を返します。

### CLIヘルパー（一時ファイル + MEDIA）

添付ファイルを取得する最も簡単な方法はCLIヘルパーを使うことです。これはデコード済みメディアを一時ファイルへ書き出し、`MEDIA:<path>` を表示します。

例:

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

注記:

- `nodes camera snap` は、エージェントに両方の視点を渡すため、デフォルトで **両方** の向きを使います。
- 自分でラッパーを作らない限り、出力ファイルは一時ファイルです（OSのtempディレクトリ内）。

## Android node

### Androidユーザー設定（デフォルトでオン）

- Android Settingsシート → **Camera** → **Allow Camera**（`camera.enabled`）
  - デフォルト: **オン**（キーがない場合は有効として扱われます）。
  - オフのとき: `camera.*` コマンドは `CAMERA_DISABLED` を返します。

### 権限

- Androidでは実行時権限が必要です:
  - `camera.snap` と `camera.clip` の両方に `CAMERA`
  - `includeAudio=true` の `camera.clip` に `RECORD_AUDIO`

権限がない場合、可能ならアプリがプロンプトを表示します。拒否された場合、`camera.*` リクエストは `*_PERMISSION_REQUIRED` エラーで失敗します。

### Androidのforeground要件

`canvas.*` と同様に、Android nodeは **foreground** でのみ `camera.*` コマンドを許可します。backgroundからの呼び出しは `NODE_BACKGROUND_UNAVAILABLE` を返します。

### Androidコマンド（Gateway `node.invoke` 経由）

- `camera.list`
  - レスポンスペイロード:
    - `devices`: `{ id, name, position, deviceType }` の配列

### ペイロードガード

写真は、base64ペイロードが5 MB未満になるよう再圧縮されます。

## macOSアプリ

### ユーザー設定（デフォルトでオフ）

macOS companionアプリはチェックボックスを提供します:

- **Settings → General → Allow Camera**（`openclaw.cameraEnabled`）
  - デフォルト: **オフ**
  - オフのとき: カメラリクエストは「Camera disabled by user」を返します。

### CLIヘルパー（node invoke）

メインの `openclaw` CLIを使って、macOS node上のカメラコマンドを呼び出します。

例:

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints MEDIA:<path> (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

注記:

- `openclaw nodes camera snap` は、上書きしない限りデフォルトで `maxWidth=1600` を使います。
- macOSでは、`camera.snap` は撮影前に、ウォームアップ/露出安定後の `delayMs`（デフォルト2000ms）を待ちます。
- 写真ペイロードは、base64が5 MB未満になるよう再圧縮されます。

## 安全性 + 実用上の制限

- カメラとマイクのアクセスでは、通常のOS権限プロンプトが表示されます（Info.plist内のusage stringも必要です）。
- 動画クリップは、nodeペイロードの肥大化（base64オーバーヘッド + メッセージ上限）を避けるため、上限があります（現在 `<= 60s`）。

## macOS画面動画（OSレベル）

_screen_ 動画（カメラではない）には、macOS companionを使います:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints MEDIA:<path>
```

注記:

- macOSの **Screen Recording** 権限（TCC）が必要です。

## 関連

- [画像とメディアサポート](/ja-JP/nodes/images)
- [メディア理解](/ja-JP/nodes/media-understanding)
- [位置情報コマンド](/ja-JP/nodes/location-command)

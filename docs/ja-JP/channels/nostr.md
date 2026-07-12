---
read_when:
    - OpenClawでNostr経由のDMを受信したい場合
    - 分散型メッセージングを設定しています
summary: NIP-04暗号化メッセージを使用するNostr DMチャネル
title: Nostr
x-i18n:
    generated_at: "2026-07-11T22:02:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31fa283f706036a37795ddad71602058ba94388a9cb01044927c4bb2d83ba4a8
    source_path: channels/nostr.md
    workflow: 16
---

Nostr は、Nostr リレー経由で NIP-04 暗号化ダイレクトメッセージを OpenClaw が受信して応答できる、ダウンロード可能なチャンネル Plugin（`@openclaw/nostr`）です。Gateway ごとに 1 アカウントで、DM のみに対応します。

## インストール

```bash
openclaw plugins install @openclaw/nostr
```

現在の公式リリースタグに追従するには、バージョンを付けないパッケージ指定を使用します。再現可能なインストールが必要な場合にのみ、正確なバージョンを固定してください。

ローカルチェックアウトから使用する場合（開発ワークフロー）:

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Plugin のインストール後または有効化後に Gateway を再起動します。Plugin をインストールすると、オンボーディング（`openclaw onboard`）と `openclaw channels add` で、共有チャンネルカタログから Nostr を利用できるようになります。

### 非対話型セットアップ

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

キーを設定に保存せず、環境内に `NOSTR_PRIVATE_KEY` を保持するには `--use-env` を使用します（デフォルトアカウントのみ）。

## クイックセットアップ

1. Nostr キーペアを生成します（必要な場合）:

```bash
# nak を使用
nak key generate
```

2. 設定に追加します:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
    },
  },
}
```

3. キーをエクスポートします:

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. Gateway を再起動します。

## 設定リファレンス

| キー         | 型       | デフォルト                                  | 説明                                                         |
| ------------ | -------- | ------------------------------------------- | ------------------------------------------------------------ |
| `privateKey` | 文字列   | 必須                                        | `nsec` または 16 進形式の秘密鍵。シークレット参照を使用可能 |
| `relays`     | 文字列[] | `['wss://relay.damus.io', 'wss://nos.lol']` | リレー URL（WebSocket）                                      |
| `dmPolicy`   | 文字列   | `pairing`                                   | DM アクセスポリシー                                          |
| `allowFrom`  | 文字列[] | `[]`                                        | 許可する送信者の公開鍵                                       |
| `enabled`    | 真偽値   | `true`                                      | チャンネルの有効化／無効化                                   |
| `name`       | 文字列   | -                                           | 表示名                                                       |
| `profile`    | オブジェクト | -                                        | NIP-01 プロファイルメタデータ                                |

## プロファイルメタデータ

プロファイルデータは、NIP-01 の `kind:0` イベントとして公開されます。Control UI（Channels -> Nostr -> Profile）から管理するか、設定内で直接指定できます。

例:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "パーソナルアシスタント DM ボット",
        picture: "https://example.com/avatar.png",
        banner: "https://example.com/banner.png",
        website: "https://example.com",
        nip05: "openclaw@example.com",
        lud16: "openclaw@example.com",
      },
    },
  },
}
```

注記:

- プロファイル URL には `https://` を使用する必要があります。
- リレーからインポートすると、フィールドが統合され、ローカルの上書き設定が維持されます。

## アクセス制御

### DM ポリシー

- **ペアリング**（デフォルト）: 不明な送信者にペアリングコードを送信します。
- **許可リスト**: `allowFrom` に含まれる公開鍵からのみ DM を受け付けます。
- **公開**: 誰からでも受信 DM を受け付けます（`allowFrom: ["*"]` が必要）。
- **無効**: 受信 DM を無視します。

適用に関する注記:

- 受信イベントの署名は、送信者ポリシーの適用および NIP-04 復号より前に検証されるため、偽造イベントは早期に拒否されます。
- ペアリング応答は、元の DM 本文を復号または処理せずに送信されます。
- 受信 DM にはレート制限（全体および送信者単位）が適用され、サイズ超過のペイロードは復号前に破棄されます。

### 許可リストの例

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      dmPolicy: "allowlist",
      allowFrom: ["npub1abc...", "npub1xyz..."],
    },
  },
}
```

## キー形式

使用可能な形式:

- **秘密鍵:** `nsec...` または 64 文字の 16 進数
- **公開鍵（`allowFrom`）:** `npub...` または 16 進数

## リレー

デフォルト: `relay.damus.io` と `nos.lol`。

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nostr.wine"],
    },
  },
}
```

ヒント:

- 冗長性を確保するため、2～3 個のリレーを使用してください。
- リレーを増やしすぎないでください（遅延や重複の原因になります）。
- 有料リレーを使用すると信頼性が向上する場合があります。
- テストにはローカルリレーを使用できます（`ws://localhost:7777`）。

## プロトコル対応

| NIP    | 状態     | 説明                                      |
| ------ | -------- | ----------------------------------------- |
| NIP-01 | 対応済み | 基本イベント形式とプロファイルメタデータ |
| NIP-04 | 対応済み | 暗号化 DM（`kind:4`）                     |
| NIP-17 | 対応予定 | ギフトラップされた DM                     |
| NIP-44 | 対応予定 | バージョン付き暗号化                      |

## テスト

### ローカルリレー

```bash
# strfry を起動
docker run -p 7777:7777 ghcr.io/hoytech/strfry
```

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["ws://localhost:7777"],
    },
  },
}
```

### 手動テスト

1. Gateway のログまたは `openclaw channels status` から、ボットの公開鍵を確認します（16 進数。必要に応じてクライアントで npub に変換します）。
2. Nostr クライアント（Amethyst、Damus など）を開きます。
3. ボットの公開鍵宛てに DM を送信します。
4. 応答を確認します。

## トラブルシューティング

### メッセージを受信できない

- 秘密鍵が有効であることを確認してください。
- リレー URL に到達可能で、`wss://`（ローカルの場合は `ws://`）を使用していることを確認してください。
- `enabled` が `false` でないことを確認してください。
- Gateway のログでリレー接続エラーを確認してください。

### 応答を送信できない

- リレーが書き込みを許可していることを確認してください。
- 外向き接続を確認してください。
- リレーのレート制限に注意してください。

### 応答が重複する

- 複数のリレーを使用している場合に発生する可能性があります。
- メッセージはイベント ID によって重複排除され、最初の配信のみが応答をトリガーします。

## セキュリティ

- 秘密鍵を絶対にコミットしないでください。
- キーには環境変数を使用してください。
- 本番環境のボットでは `allowlist` の使用を検討してください。
- 署名は送信者ポリシーより前に検証され、送信者ポリシーは復号より前に適用されるため、偽造イベントは早期に拒否され、不明な送信者が完全な暗号処理を強制することはできません。

## 制限事項（MVP）

- ダイレクトメッセージのみ（グループチャットには非対応）。
- メディア添付には非対応。
- NIP-04 のみ（NIP-17 ギフトラップへの対応を予定）。

## 関連項目

- [チャンネル概要](/ja-JP/channels) — 対応しているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM の認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンション制御
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと堅牢化

---
read_when:
    - OpenClaw に Nostr 経由でダイレクトメッセージを受信させたい場合
    - 分散型メッセージングをセットアップしています
summary: NIP-04 暗号化メッセージによる Nostr DM チャネル
title: Nostr
x-i18n:
    generated_at: "2026-05-02T22:16:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6158c22c0ffc5aea56d0ac2b68955f30c3a785013dba5410cbd70f9b689dc3c
    source_path: channels/nostr.md
    workflow: 16
    postprocess_version: locale-links-v1
---

**ステータス:** 任意のバンドル Plugin（設定されるまでデフォルトでは無効）。

Nostr はソーシャルネットワーキング向けの分散プロトコルです。このチャンネルにより、OpenClaw は NIP-04 経由で暗号化されたダイレクトメッセージ（DM）を受信し、返信できます。

## バンドル Plugin

現在の OpenClaw リリースでは Nostr がバンドル Plugin として同梱されるため、通常のパッケージ済みビルドでは別途インストールする必要はありません。

### 古いインストール/カスタムインストール

- オンボーディング（`openclaw onboard`）と `openclaw channels add` は、引き続き共有チャンネルカタログから Nostr を表示します。
- ビルドからバンドルされた Nostr が除外されている場合は、npm パッケージを直接インストールしてください。

```bash
openclaw plugins install @openclaw/nostr
```

現在の公式リリースタグに追従するには、素のパッケージを使用します。再現可能なインストールが必要な場合にのみ、正確なバージョンを固定してください。

ローカルチェックアウトを使用する場合（開発ワークフロー）:

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Plugin のインストール後、または有効化後に Gateway を再起動してください。

### 非対話型セットアップ

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

キーを config に保存する代わりに `NOSTR_PRIVATE_KEY` を環境に保持するには、`--use-env` を使用します。

## クイックセットアップ

1. 必要に応じて Nostr キーペアを生成します:

```bash
# Using nak
nak key generate
```

2. config に追加します:

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

| キー         | 型       | デフォルト                                  | 説明                                    |
| ------------ | -------- | ------------------------------------------- | --------------------------------------- |
| `privateKey` | string   | 必須                                        | `nsec` または hex 形式の秘密鍵          |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | リレー URL（WebSocket）                 |
| `dmPolicy`   | string   | `pairing`                                   | DM アクセスポリシー                     |
| `allowFrom`  | string[] | `[]`                                        | 許可された送信者 pubkey                 |
| `enabled`    | boolean  | `true`                                      | チャンネルを有効化/無効化              |
| `name`       | string   | -                                           | 表示名                                  |
| `profile`    | object   | -                                           | NIP-01 プロファイルメタデータ           |

## プロファイルメタデータ

プロファイルデータは NIP-01 `kind:0` イベントとして公開されます。Control UI（チャンネル -> Nostr -> プロファイル）から管理するか、config で直接設定できます。

例:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Personal assistant DM bot",
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

注意:

- プロファイル URL は `https://` を使用する必要があります。
- リレーからインポートすると、フィールドがマージされ、ローカルの上書き設定は保持されます。

## アクセス制御

### DM ポリシー

- **pairing**（デフォルト）: 不明な送信者にはペアリングコードが送信されます。
- **allowlist**: `allowFrom` 内の pubkey のみが DM できます。
- **open**: 公開の受信 DM（`allowFrom: ["*"]` が必要）。
- **disabled**: 受信 DM を無視します。

適用に関する注意:

- 受信イベントの署名は送信者ポリシーと NIP-04 復号の前に検証されるため、偽造イベントは早期に拒否されます。
- ペアリング返信は元の DM 本文を処理せずに送信されます。
- 受信 DM はレート制限され、サイズが大きすぎるペイロードは復号前に破棄されます。

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

受け入れられる形式:

- **秘密鍵:** `nsec...` または 64 文字の hex
- **Pubkey（`allowFrom`）:** `npub...` または hex

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

- 冗長性のために 2〜3 個のリレーを使用します。
- 多すぎるリレーは避けてください（レイテンシ、重複）。
- 有料リレーは信頼性を向上できる場合があります。
- ローカルリレーはテストに適しています（`ws://localhost:7777`）。

## プロトコル対応

| NIP    | ステータス | 説明                                      |
| ------ | ---------- | ----------------------------------------- |
| NIP-01 | 対応       | 基本イベント形式 + プロファイルメタデータ |
| NIP-04 | 対応       | 暗号化 DM（`kind:4`）                     |
| NIP-17 | 予定       | ギフトラップ DM                           |
| NIP-44 | 予定       | バージョン付き暗号化                      |

## テスト

### ローカルリレー

```bash
# Start strfry
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

1. ログから bot の pubkey（npub）を確認します。
2. Nostr クライアント（Damus、Amethyst など）を開きます。
3. bot の pubkey に DM します。
4. 応答を確認します。

## トラブルシューティング

### メッセージを受信できない

- 秘密鍵が有効であることを確認します。
- リレー URL に到達可能で、`wss://`（またはローカルでは `ws://`）を使用していることを確認します。
- `enabled` が `false` ではないことを確認します。
- リレー接続エラーについて Gateway ログを確認します。

### 応答を送信できない

- リレーが書き込みを受け入れることを確認します。
- 送信接続を確認します。
- リレーのレート制限に注意します。

### 重複した応答

- 複数のリレーを使用している場合は想定される動作です。
- メッセージはイベント ID で重複排除され、最初の配信のみが応答をトリガーします。

## セキュリティ

- 秘密鍵をコミットしないでください。
- キーには環境変数を使用してください。
- 本番 bot では `allowlist` を検討してください。
- 署名は送信者ポリシーの前に検証され、送信者ポリシーは復号前に適用されるため、偽造イベントは早期に拒否され、不明な送信者が完全な暗号処理を強制することはできません。

## 制限事項（MVP）

- ダイレクトメッセージのみ（グループチャットなし）。
- メディア添付なし。
- NIP-04 のみ（NIP-17 ギフトラップは予定）。

## 関連

- [チャンネル概要](/ja-JP/channels) — 対応しているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化

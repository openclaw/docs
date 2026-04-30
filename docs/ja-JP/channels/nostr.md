---
read_when:
    - OpenClaw で Nostr 経由のダイレクトメッセージを受信したい
    - 分散型メッセージングを設定しています
summary: NIP-04暗号化メッセージ経由のNostr DMチャネル
title: Nostr
x-i18n:
    generated_at: "2026-04-30T04:59:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 545d68077c9fe81d5fa5a17262d37e3688185a1fb12d67b8b1053b27b96c3c7f
    source_path: channels/nostr.md
    workflow: 16
---

**ステータス:** 任意のバンドルPlugin (設定されるまではデフォルトで無効)。

Nostrはソーシャルネットワーキング向けの分散型プロトコルです。このチャネルにより、OpenClawはNIP-04経由で暗号化されたダイレクトメッセージ (DM) を受信して応答できます。

## バンドルPlugin

現在のOpenClawリリースはNostrをバンドルPluginとして同梱しているため、通常のパッケージ化された
ビルドでは別途インストールは不要です。

### 古い/カスタムインストール

- オンボーディング (`openclaw onboard`) と `openclaw channels add` は引き続き、共有チャネルカタログから
  Nostrを表示します。
- ビルドがバンドルNostrを除外している場合は、公開されていれば現在のnpmパッケージをインストールします。

```bash
openclaw plugins install @openclaw/nostr
```

npmがOpenClaw所有のパッケージを非推奨として報告する場合は、より新しいnpmパッケージが公開されるまで、現在のパッケージ化されたOpenClawビルドまたはローカルチェックアウトを使用してください。

ローカルチェックアウトを使用します (開発ワークフロー):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Pluginをインストールまたは有効化した後、Gatewayを再起動します。

### 非対話型セットアップ

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

キーを設定に保存する代わりに、`NOSTR_PRIVATE_KEY` を環境に保持するには `--use-env` を使用します。

## クイックセットアップ

1. 必要に応じてNostr鍵ペアを生成します:

```bash
# Using nak
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

4. Gatewayを再起動します。

## 設定リファレンス

| キー          | 型     | デフォルト                                     | 説明                         |
| ------------ | -------- | ------------------------------------------- | ----------------------------------- |
| `privateKey` | string   | 必須                                    | `nsec` またはhex形式の秘密鍵 |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | リレーURL (WebSocket)              |
| `dmPolicy`   | string   | `pairing`                                   | DMアクセスポリシー                    |
| `allowFrom`  | string[] | `[]`                                        | 許可された送信者pubkey              |
| `enabled`    | boolean  | `true`                                      | チャネルを有効化/無効化              |
| `name`       | string   | -                                           | 表示名                        |
| `profile`    | object   | -                                           | NIP-01プロフィールメタデータ             |

## プロフィールメタデータ

プロフィールデータはNIP-01 `kind:0` イベントとして公開されます。Control UI (Channels -> Nostr -> Profile) から管理するか、設定に直接指定できます。

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

注:

- プロフィールURLは `https://` を使用する必要があります。
- リレーからインポートするとフィールドがマージされ、ローカルの上書きが保持されます。

## アクセス制御

### DMポリシー

- **pairing** (デフォルト): 未知の送信者にはペアリングコードが返されます。
- **allowlist**: `allowFrom` 内のpubkeyだけがDMできます。
- **open**: 公開インバウンドDM (`allowFrom: ["*"]` が必要)。
- **disabled**: インバウンドDMを無視します。

適用に関する注:

- インバウンドイベントの署名は送信者ポリシーとNIP-04復号の前に検証されるため、偽造イベントは早期に拒否されます。
- ペアリング返信は元のDM本文を処理せずに送信されます。
- インバウンドDMはレート制限され、過大なペイロードは復号前に破棄されます。

### allowlistの例

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

## 鍵形式

受け付ける形式:

- **秘密鍵:** `nsec...` または64文字のhex
- **Pubkey (`allowFrom`):** `npub...` またはhex

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

- 冗長性のために2〜3個のリレーを使用します。
- リレーを増やしすぎないでください (レイテンシ、重複)。
- 有料リレーは信頼性を向上できます。
- ローカルリレーはテストに適しています (`ws://localhost:7777`)。

## プロトコルサポート

| NIP    | ステータス    | 説明                           |
| ------ | --------- | ------------------------------------- |
| NIP-01 | サポート済み | 基本イベント形式 + プロフィールメタデータ |
| NIP-04 | サポート済み | 暗号化DM (`kind:4`)              |
| NIP-17 | 計画中   | ギフトラップされたDM                      |
| NIP-44 | 計画中   | バージョン付き暗号化                  |

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

1. ログからボットのpubkey (npub) を控えます。
2. Nostrクライアント (Damus、Amethystなど) を開きます。
3. ボットのpubkeyにDMします。
4. 応答を確認します。

## トラブルシューティング

### メッセージを受信できない

- 秘密鍵が有効であることを確認します。
- リレーURLに到達可能であり、`wss://` (ローカルの場合は `ws://`) を使用していることを確認します。
- `enabled` が `false` ではないことを確認します。
- Gatewayログでリレー接続エラーを確認します。

### 応答を送信できない

- リレーが書き込みを受け付けることを確認します。
- アウトバウンド接続を確認します。
- リレーのレート制限に注意します。

### 応答が重複する

- 複数のリレーを使用している場合は想定される動作です。
- メッセージはイベントIDで重複排除され、最初の配信だけが応答をトリガーします。

## セキュリティ

- 秘密鍵を絶対にコミットしないでください。
- キーには環境変数を使用します。
- 本番ボットでは `allowlist` を検討してください。
- 署名は送信者ポリシーの前に検証され、送信者ポリシーは復号前に適用されるため、偽造イベントは早期に拒否され、未知の送信者が完全な暗号処理を強制することはできません。

## 制限事項 (MVP)

- ダイレクトメッセージのみ (グループチャットなし)。
- メディア添付なし。
- NIP-04のみ (NIP-17ギフトラップを計画中)。

## 関連

- [チャネル概要](/ja-JP/channels) — サポートされるすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化

---
read_when:
    - OpenClaw が Nostr 経由で DM を受信するようにしたい
    - 分散型メッセージングを設定しています
summary: NIP-04 暗号化メッセージ経由の Nostr DM チャネル
title: Nostr
x-i18n:
    generated_at: "2026-07-05T11:04:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31fa283f706036a37795ddad71602058ba94388a9cb01044927c4bb2d83ba4a8
    source_path: channels/nostr.md
    workflow: 16
---

Nostr は、Nostr リレー経由で NIP-04 暗号化ダイレクトメッセージを OpenClaw が受信して応答できるようにする、ダウンロード可能なチャネルプラグイン (`@openclaw/nostr`) です。Gateway ごとに 1 アカウント、DM のみです。

## インストール

```bash
openclaw plugins install @openclaw/nostr
```

現在の公式リリースタグに追従するには、素のパッケージ指定を使用します。再現可能なインストールが必要な場合にのみ、正確なバージョンを固定してください。

ローカルチェックアウトから（開発ワークフロー）:

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Plugin をインストールまたは有効化した後は、Gateway を再起動してください。Plugin がインストールされると、オンボーディング (`openclaw onboard`) と `openclaw channels add` で、共有チャネルカタログから Nostr が表示されます。

### 非対話セットアップ

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

キーを設定に保存する代わりに、環境内の `NOSTR_PRIVATE_KEY` を保持するには `--use-env` を使用します（デフォルトアカウントのみ）。

## クイックセットアップ

1. 必要に応じて Nostr キーペアを生成します:

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

4. Gateway を再起動します。

## 設定リファレンス

| キー         | 型       | デフォルト                                  | 説明                                                        |
| ------------ | -------- | ------------------------------------------- | ----------------------------------------------------------- |
| `privateKey` | string   | required                                    | `nsec` または hex 形式の秘密鍵。シークレット参照を使用可能 |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | リレー URL (WebSocket)                                      |
| `dmPolicy`   | string   | `pairing`                                   | DM アクセスポリシー                                        |
| `allowFrom`  | string[] | `[]`                                        | 許可された送信者 pubkey                                    |
| `enabled`    | boolean  | `true`                                      | チャネルを有効化/無効化                                    |
| `name`       | string   | -                                           | 表示名                                                      |
| `profile`    | object   | -                                           | NIP-01 プロファイルメタデータ                              |

## プロファイルメタデータ

プロファイルデータは NIP-01 `kind:0` イベントとして公開されます。Control UI (Channels -> Nostr -> Profile) から管理することも、設定で直接指定することもできます。

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

注記:

- プロファイル URL は `https://` を使用する必要があります。
- リレーからインポートするとフィールドがマージされ、ローカルの上書きが保持されます。

## アクセス制御

### DM ポリシー

- **pairing**（デフォルト）: 不明な送信者はペアリングコードを受け取ります。
- **allowlist**: `allowFrom` 内の pubkey のみが DM できます。
- **open**: 公開インバウンド DM（`allowFrom: ["*"]` が必要）。
- **disabled**: インバウンド DM を無視します。

適用に関する注記:

- インバウンドイベントの署名は、送信者ポリシーと NIP-04 復号の前に検証されるため、偽造イベントは早期に拒否されます。
- ペアリング返信は、元の DM 本文を復号または処理せずに送信されます。
- インバウンド DM はレート制限され（グローバルおよび送信者ごと）、サイズ超過ペイロードは復号前に破棄されます。

### allowlist の例

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

使用できる形式:

- **秘密鍵:** `nsec...` または 64 文字の hex
- **Pubkey (`allowFrom`):** `npub...` または hex

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

- 冗長性のために 2-3 個のリレーを使用します。
- リレーが多すぎる状態は避けます（レイテンシ、重複）。
- 有料リレーは信頼性を改善できる場合があります。
- ローカルリレーはテストに適しています (`ws://localhost:7777`)。

## プロトコルサポート

| NIP    | ステータス | 説明                                      |
| ------ | ---------- | ----------------------------------------- |
| NIP-01 | 対応       | 基本イベント形式 + プロファイルメタデータ |
| NIP-04 | 対応       | 暗号化 DM (`kind:4`)                      |
| NIP-17 | 計画中     | ギフトラップ DM                           |
| NIP-44 | 計画中     | バージョン付き暗号化                      |

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

1. Gateway ログまたは `openclaw channels status` からボットの pubkey を控えます（hex。必要に応じてクライアントで npub に変換してください）。
2. Nostr クライアント（Amethyst、Damus など）を開きます。
3. ボットの pubkey に DM します。
4. 応答を確認します。

## トラブルシューティング

### メッセージを受信できない

- 秘密鍵が有効であることを確認します。
- リレー URL に到達可能で、`wss://`（ローカルの場合は `ws://`）を使用していることを確認します。
- `enabled` が `false` でないことを確認します。
- リレー接続エラーについて Gateway ログを確認します。

### 応答を送信できない

- リレーが書き込みを受け付けることを確認します。
- アウトバウンド接続を確認します。
- リレーのレート制限に注意します。

### 応答が重複する

- 複数のリレーを使用している場合は想定される動作です。
- メッセージはイベント ID で重複排除され、最初の配信のみが応答をトリガーします。

## セキュリティ

- 秘密鍵をコミットしないでください。
- キーには環境変数を使用してください。
- 本番環境のボットでは `allowlist` を検討してください。
- 署名は送信者ポリシーの前に検証され、送信者ポリシーは復号の前に適用されるため、偽造イベントは早期に拒否され、不明な送信者が完全な暗号処理を強制することはできません。

## 制限事項 (MVP)

- ダイレクトメッセージのみ（グループチャットなし）。
- メディア添付なし。
- NIP-04 のみ（NIP-17 ギフトラップは計画中）。

## 関連

- [チャネル概要](/ja-JP/channels) — 対応しているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと堅牢化

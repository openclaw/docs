---
read_when:
    - OpenClaw 用に Zalo Personal を設定する
    - Zalo Personal のログインまたはメッセージフローのデバッグ
summary: ネイティブ zca-js（QRログイン）による Zalo 個人アカウント対応、機能、および設定
title: Zalo 個人用
x-i18n:
    generated_at: "2026-05-06T17:52:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: d56cbf0a6300709e9fe23421cd134acc68852d0025f305c73413308f412349e8
    source_path: channels/zalouser.md
    workflow: 16
---

Status: 実験的。この連携は、OpenClaw 内のネイティブ `zca-js` を使って **個人用 Zalo アカウント**を自動化します。

<Warning>
これは非公式の連携であり、アカウントの停止や禁止につながる可能性があります。自己責任で使用してください。
</Warning>

## バンドル済み Plugin

Zalo Personal は現在の OpenClaw リリースではバンドル済み Plugin として同梱されているため、通常のパッケージビルドでは別途インストールする必要はありません。

古いビルドを使用している場合、または Zalo Personal を除外したカスタムインストールを使用している場合は、npm パッケージを直接インストールしてください。

- CLI でインストール: `openclaw plugins install @openclaw/zalouser`
- 固定バージョン: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- またはソースチェックアウトから: `openclaw plugins install ./path/to/local/zalouser-plugin`
- 詳細: [Plugin](/ja-JP/tools/plugin)

外部の `zca`/`openzca` CLI バイナリは不要です。

## クイックセットアップ（初心者向け）

1. Zalo Personal Plugin が利用可能であることを確認します。
   - 現在のパッケージ版 OpenClaw リリースにはすでに同梱されています。
   - 古いインストールやカスタムインストールでは、上記のコマンドで手動追加できます。
2. ログインします（QR、Gateway マシン上）:
   - `openclaw channels login --channel zalouser`
   - Zalo モバイルアプリで QR コードをスキャンします。
3. チャネルを有効にします。

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. Gateway を再起動します（またはセットアップを完了します）。
5. DM アクセスのデフォルトはペアリングです。初回連絡時にペアリングコードを承認します。

## 概要

- `zca-js` を介して完全にプロセス内で実行されます。
- ネイティブイベントリスナーを使用して受信メッセージを受け取ります。
- JS API を通じて返信を直接送信します（テキスト/メディア/リンク）。
- Zalo Bot API が利用できない「個人アカウント」ユースケース向けに設計されています。

## 命名

チャネル ID は `zalouser` です。これは **個人用 Zalo ユーザーアカウント**（非公式）を自動化することを明示するためです。`zalo` は、将来の公式 Zalo API 連携の可能性のために予約しています。

## ID の検索（ディレクトリ）

ディレクトリ CLI を使用して、ピア/グループとその ID を検出します。

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 制限

- 送信テキストは約 2000 文字に分割されます（Zalo クライアントの制限）。
- ストリーミングはデフォルトでブロックされます。

## アクセス制御（DM）

`channels.zalouser.dmPolicy` は `pairing | allowlist | open | disabled` をサポートします（デフォルト: `pairing`）。

`channels.zalouser.allowFrom` には安定した Zalo ユーザー ID を使用してください。対話型セットアップ中は、入力した名前を Plugin のプロセス内連絡先検索を使って ID に解決できます。

生の名前が設定に残っている場合、起動時の解決は `channels.zalouser.dangerouslyAllowNameMatching: true` が有効な場合にのみ行われます。このオプトインがない場合、実行時の送信者チェックは ID のみで行われ、生の名前は認可では無視されます。

次で承認します。

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## グループアクセス（任意）

- デフォルト: `channels.zalouser.groupPolicy = "open"`（グループを許可）。未設定時のデフォルトを上書きするには `channels.defaults.groupPolicy` を使用します。
- allowlist に制限するには:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups`（キーは安定したグループ ID にしてください。名前は `channels.zalouser.dangerouslyAllowNameMatching: true` が有効な場合にのみ起動時に ID に解決されます）
  - `channels.zalouser.groupAllowFrom`（許可されたグループ内のどの送信者が bot を起動できるかを制御します）
- すべてのグループをブロック: `channels.zalouser.groupPolicy = "disabled"`。
- 設定ウィザードはグループ allowlist の入力を求めることができます。
- 起動時、OpenClaw は allowlist 内のグループ名/ユーザー名を ID に解決し、そのマッピングをログに記録します。ただし `channels.zalouser.dangerouslyAllowNameMatching: true` が有効な場合のみです。
- グループ allowlist の照合はデフォルトで ID のみです。未解決の名前は、`channels.zalouser.dangerouslyAllowNameMatching: true` が有効でない限り、認証では無視されます。
- `channels.zalouser.dangerouslyAllowNameMatching: true` は、可変の起動時名前解決と実行時グループ名照合を再度有効にする緊急時互換モードです。
- `groupAllowFrom` が未設定の場合、実行時はグループ送信者チェックに `allowFrom` をフォールバックとして使用します。
- 送信者チェックは、通常のグループメッセージと制御コマンド（例: `/new`、`/reset`）の両方に適用されます。

例:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### グループメンションゲーティング

- `channels.zalouser.groups.<group>.requireMention` は、グループ返信にメンションが必要かどうかを制御します。
- 解決順序: 正確なグループ ID/名前 -> 正規化されたグループスラッグ -> `*` -> デフォルト（`true`）。
- これは allowlist に含まれるグループとオープングループモードの両方に適用されます。
- bot メッセージを引用すると、グループ有効化の暗黙的なメンションとして扱われます。
- 認可済みの制御コマンド（例: `/new`）はメンションゲーティングをバイパスできます。
- メンションが必要なためにグループメッセージがスキップされた場合、OpenClaw はそれを保留中のグループ履歴として保存し、次に処理されるグループメッセージに含めます。
- グループ履歴制限のデフォルトは `messages.groupChat.historyLimit`（フォールバック `50`）です。アカウントごとに `channels.zalouser.historyLimit` で上書きできます。

例:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## マルチアカウント

アカウントは OpenClaw 状態内の `zalouser` プロファイルに対応します。例:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## 入力中表示、リアクション、配信確認

- OpenClaw は返信をディスパッチする前に入力中イベントを送信します（ベストエフォート）。
- メッセージリアクションアクション `react` は、チャネルアクション内の `zalouser` でサポートされます。
  - メッセージから特定のリアクション絵文字を削除するには `remove: true` を使用します。
  - リアクションのセマンティクス: [リアクション](/ja-JP/tools/reactions)
- イベントメタデータを含む受信メッセージについて、OpenClaw は delivered + seen の確認応答を送信します（ベストエフォート）。

## トラブルシューティング

**ログインが保持されない:**

- `openclaw channels status --probe`
- 再ログイン: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**allowlist/グループ名が解決されない:**

- `allowFrom`/`groupAllowFrom` には数値 ID を使用し、`groups` には安定したグループ ID を使用してください。正確な友だち名/グループ名が意図的に必要な場合は、`channels.zalouser.dangerouslyAllowNameMatching: true` を有効にします。

**古い CLI ベースのセットアップからアップグレードした場合:**

- 古い外部 `zca` プロセス前提を削除します。
- チャネルは現在、外部 CLI バイナリなしで OpenClaw 内に完全に組み込まれて実行されます。

## 関連

- [チャネル概要](/ja-JP/channels) — サポートされているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの挙動とメンションゲーティング
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと堅牢化

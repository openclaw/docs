---
read_when:
    - OpenClaw向けZalo Personalのセットアップ
    - Zalo Personalのログインまたはメッセージフローのデバッグ
summary: ネイティブのzca-js（QRログイン）によるZalo個人アカウントサポート、その機能、および設定
title: Zalo personal
x-i18n:
    generated_at: "2026-04-24T04:48:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18a7edbe3e7a65861628f004ecf6cf2b924b531ba7271d14fa37a6834cdd2545
    source_path: channels/zalouser.md
    workflow: 15
---

# Zalo Personal（非公式）

ステータス: 実験的。この連携は、OpenClaw内でネイティブ`zca-js`を使って**個人Zaloアカウント**を自動化します。

> **警告:** これは非公式の連携であり、アカウント停止/凍結の原因となる可能性があります。自己責任で使用してください。

## バンドルPlugin

Zalo Personalは現在のOpenClawリリースでバンドルPluginとして提供されているため、通常のパッケージビルドでは別途インストールは不要です。

古いビルドや、Zalo Personalを含まないカスタムインストールを使用している場合は、手動でインストールしてください。

- CLIでインストール: `openclaw plugins install @openclaw/zalouser`
- またはソースチェックアウトから: `openclaw plugins install ./path/to/local/zalouser-plugin`
- 詳細: [Plugins](/ja-JP/tools/plugin)

外部の`zca`/`openzca` CLIバイナリは不要です。

## クイックセットアップ（初心者向け）

1. Zalo Personal Pluginが利用可能であることを確認します。
   - 現在のパッケージ版OpenClawリリースにはすでに同梱されています。
   - 古い/カスタムインストールでは、上記コマンドで手動追加できます。
2. ログインします（QR、Gatewayマシン上）。
   - `openclaw channels login --channel zalouser`
   - ZaloモバイルアプリでQRコードをスキャンします。
3. チャネルを有効化します。

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

4. Gatewayを再起動します（またはセットアップを完了します）。
5. DMアクセスのデフォルトはペアリングです。初回接触時にペアリングコードを承認してください。

## これは何か

- `zca-js`を通じて完全にプロセス内で動作します。
- ネイティブイベントリスナーを使用して受信メッセージを受け取ります。
- JS APIを通じて直接返信を送信します（テキスト/メディア/リンク）。
- Zalo Bot APIが利用できない「個人アカウント」用途向けに設計されています。

## 命名

チャネルIDは`zalouser`です。これにより、これが**個人Zaloユーザーアカウント**（非公式）を自動化するものであることを明確にしています。`zalo`は、将来の公式Zalo API連携向けに予約しています。

## IDの確認（directory）

directory CLIを使用して、peer/グループとそのIDを見つけます。

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 制限

- 送信テキストは約2000文字にチャンク化されます（Zaloクライアントの制限）。
- ストリーミングはデフォルトでブロックされます。

## アクセス制御（DM）

`channels.zalouser.dmPolicy`は次をサポートします: `pairing | allowlist | open | disabled`（デフォルト: `pairing`）。

`channels.zalouser.allowFrom`はユーザーIDまたは名前を受け付けます。セットアップ時に、名前はPluginのプロセス内連絡先検索を使ってIDへ解決されます。

承認方法:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## グループアクセス（任意）

- デフォルト: `channels.zalouser.groupPolicy = "open"`（グループ許可）。未設定時のデフォルトを上書きするには`channels.defaults.groupPolicy`を使用します。
- 許可リストに制限するには:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups`（キーには安定したグループIDを使うべきです。可能な場合、起動時に名前はIDへ解決されます）
  - `channels.zalouser.groupAllowFrom`（許可されたグループ内でどの送信者がボットをトリガーできるかを制御します）
- すべてのグループをブロック: `channels.zalouser.groupPolicy = "disabled"`。
- 設定ウィザードでは、グループ許可リストの入力を促すことができます。
- 起動時に、OpenClawは許可リスト内のグループ/ユーザー名をIDへ解決し、その対応をログに記録します。
- グループ許可リストの一致は、デフォルトではIDのみです。解決されなかった名前は、`channels.zalouser.dangerouslyAllowNameMatching: true`が有効でない限り、認証では無視されます。
- `channels.zalouser.dangerouslyAllowNameMatching: true`は、変更可能なグループ名一致を再有効化する緊急用の互換モードです。
- `groupAllowFrom`が未設定の場合、実行時にはグループ送信者チェックで`allowFrom`にフォールバックします。
- 送信者チェックは、通常のグループメッセージと制御コマンド（たとえば`/new`、`/reset`）の両方に適用されます。

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

### グループのメンションゲーティング

- `channels.zalouser.groups.<group>.requireMention`は、グループ返信にメンションが必要かどうかを制御します。
- 解決順序: 正確なグループID/名前 -> 正規化されたグループslug -> `*` -> デフォルト（`true`）。
- これは許可リスト対象グループとオープングループモードの両方に適用されます。
- ボットメッセージの引用は、グループ有効化における暗黙のメンションとして扱われます。
- 認可された制御コマンド（たとえば`/new`）は、メンションゲーティングをバイパスできます。
- メンションが必要なためにグループメッセージがスキップされた場合、OpenClawはそれを保留中のグループ履歴として保存し、次に処理されるグループメッセージに含めます。
- グループ履歴上限のデフォルトは`messages.groupChat.historyLimit`（フォールバック`50`）です。アカウントごとに`channels.zalouser.historyLimit`で上書きできます。

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

アカウントはOpenClaw state内の`zalouser`プロファイルに対応します。例:

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

## タイピング、リアクション、および配信確認

- OpenClawは返信を送信する前にタイピングイベントを送信します（ベストエフォート）。
- メッセージリアクションアクション`react`は、チャネルアクション内の`zalouser`でサポートされています。
  - メッセージから特定のリアクション絵文字を削除するには`remove: true`を使用します。
  - リアクションのセマンティクス: [Reactions](/ja-JP/tools/reactions)
- イベントメタデータを含む受信メッセージについては、OpenClawは配信済み + 既読の確認を送信します（ベストエフォート）。

## トラブルシューティング

**ログインが維持されない:**

- `openclaw channels status --probe`
- 再ログイン: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**許可リスト/グループ名が解決されなかった:**

- `allowFrom` / `groupAllowFrom` / `groups`では数値ID、または正確な友だち名/グループ名を使用してください。

**古いCLIベースのセットアップからアップグレードした場合:**

- 古い外部`zca`プロセス前提は削除してください。
- このチャネルは現在、外部CLIバイナリなしで完全にOpenClaw内で動作します。

## 関連

- [Channels Overview](/ja-JP/channels) — サポートされているすべてのチャネル
- [Pairing](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [Groups](/ja-JP/channels/groups) — グループチャットの動作とメンションゲーティング
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング

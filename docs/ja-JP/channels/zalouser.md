---
read_when:
    - OpenClaw 用に Zalo Personal を設定する
    - Zalo Personalのログインまたはメッセージフローのデバッグ
summary: ネイティブ zca-js（QRログイン）による Zalo 個人アカウント対応、機能、設定
title: Zalo 個人用
x-i18n:
    generated_at: "2026-04-30T05:02:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 581a427f7fa37b0fa204f6b813c767eaa7af1f577baf2ac6ea3a31bf23ca6a49
    source_path: channels/zalouser.md
    workflow: 16
---

ステータス: 実験的です。この連携は、OpenClaw 内でネイティブの `zca-js` を使用して **個人用 Zalo アカウント**を自動化します。

<Warning>
これは非公式の連携であり、アカウントの停止または禁止につながる可能性があります。自己責任で使用してください。
</Warning>

## バンドル済みPlugin

Zalo Personal は現在の OpenClaw リリースではバンドル済みPluginとして同梱されているため、通常の
パッケージ化されたビルドでは別途インストールは不要です。

古いビルドを使用している場合、または Zalo Personal を除外したカスタムインストールを使用している場合は、
公開済みの現在の npm パッケージをインストールしてください。

- CLI 経由でインストール: `openclaw plugins install @openclaw/zalouser`
- またはソースチェックアウトから: `openclaw plugins install ./path/to/local/zalouser-plugin`
- 詳細: [Plugins](/ja-JP/tools/plugin)

npm が OpenClaw 所有のパッケージを非推奨として報告する場合は、新しい npm パッケージが
公開されるまで、現在のパッケージ化された OpenClaw ビルドまたはローカルチェックアウトパスを使用してください。

外部の `zca`/`openzca` CLI バイナリは不要です。

## クイックセットアップ（初心者向け）

1. Zalo Personal Plugin が利用可能であることを確認します。
   - 現在のパッケージ化された OpenClaw リリースには、すでに同梱されています。
   - 古いインストールやカスタムインストールでは、上記のコマンドで手動追加できます。
2. ログインします（QR、Gateway マシン上）:
   - `openclaw channels login --channel zalouser`
   - Zalo モバイルアプリで QR コードをスキャンします。
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

4. Gateway を再起動します（またはセットアップを完了します）。
5. DM アクセスのデフォルトはペアリングです。初回連絡時にペアリングコードを承認してください。

## 概要

- `zca-js` 経由で完全にプロセス内で実行されます。
- ネイティブイベントリスナーを使用して受信メッセージを受け取ります。
- JS API（テキスト/メディア/リンク）を通じて直接返信を送信します。
- Zalo Bot API が利用できない「個人アカウント」ユースケース向けに設計されています。

## 命名

チャネル ID は `zalouser` です。これにより、これが **個人用 Zalo ユーザーアカウント**（非公式）を自動化するものであることを明示しています。`zalo` は、将来の公式 Zalo API 連携用に予約しています。

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

`channels.zalouser.allowFrom` はユーザー ID または名前を受け付けます。セットアップ中、名前は Plugin のプロセス内連絡先検索を使用して ID に解決されます。

承認方法:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## グループアクセス（任意）

- デフォルト: `channels.zalouser.groupPolicy = "open"`（グループを許可）。未設定時のデフォルトを上書きするには `channels.defaults.groupPolicy` を使用します。
- 許可リストに制限するには:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups`（キーは安定したグループ ID にしてください。可能な場合、名前は起動時に ID に解決されます）
  - `channels.zalouser.groupAllowFrom`（許可されたグループ内のどの送信者がボットを起動できるかを制御します）
- すべてのグループをブロック: `channels.zalouser.groupPolicy = "disabled"`。
- 設定ウィザードでは、グループ許可リストの入力を求めることができます。
- 起動時、OpenClaw は許可リスト内のグループ/ユーザー名を ID に解決し、そのマッピングをログに記録します。
- グループ許可リストの照合は、デフォルトでは ID のみです。未解決の名前は、`channels.zalouser.dangerouslyAllowNameMatching: true` が有効でない限り、認証では無視されます。
- `channels.zalouser.dangerouslyAllowNameMatching: true` は、変更可能なグループ名照合を再有効化する緊急互換モードです。
- `groupAllowFrom` が未設定の場合、ランタイムはグループ送信者チェックで `allowFrom` にフォールバックします。
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

### グループメンションによるゲート

- `channels.zalouser.groups.<group>.requireMention` は、グループ返信にメンションが必要かどうかを制御します。
- 解決順序: 正確なグループ ID/名前 -> 正規化されたグループスラッグ -> `*` -> デフォルト（`true`）。
- これは許可リスト内のグループとオープングループモードの両方に適用されます。
- ボットメッセージの引用は、グループ起動の暗黙的なメンションとして扱われます。
- 認可済みの制御コマンド（例: `/new`）は、メンションゲートをバイパスできます。
- メンションが必要なためにグループメッセージがスキップされた場合、OpenClaw はそれを保留中のグループ履歴として保存し、次に処理されるグループメッセージに含めます。
- グループ履歴の制限は、デフォルトで `messages.groupChat.historyLimit`（フォールバック `50`）です。アカウントごとに `channels.zalouser.historyLimit` で上書きできます。

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

## 複数アカウント

アカウントは OpenClaw の状態内の `zalouser` プロファイルに対応します。例:

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

- OpenClaw は返信を送信する前に、入力中イベントを送信します（ベストエフォート）。
- メッセージリアクションアクション `react` は、チャネルアクション内の `zalouser` でサポートされています。
  - メッセージから特定のリアクション絵文字を削除するには `remove: true` を使用します。
  - リアクションのセマンティクス: [Reactions](/ja-JP/tools/reactions)
- イベントメタデータを含む受信メッセージについて、OpenClaw は配信済み + 既読の確認を送信します（ベストエフォート）。

## トラブルシューティング

**ログインが保持されない場合:**

- `openclaw channels status --probe`
- 再ログイン: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**許可リスト/グループ名が解決されない場合:**

- `allowFrom`/`groupAllowFrom`/`groups` では数値 ID、または正確なフレンド/グループ名を使用します。

**古い CLI ベースのセットアップからアップグレードした場合:**

- 古い外部 `zca` プロセスに関する前提をすべて削除します。
- このチャネルは現在、外部 CLI バイナリなしで完全に OpenClaw 内で実行されます。

## 関連

- [チャネル概要](/ja-JP/channels) — サポートされているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化

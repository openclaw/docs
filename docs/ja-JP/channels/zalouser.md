---
read_when:
    - OpenClaw 向け Zalo Personal のセットアップ
    - Zalo Personal のログインまたはメッセージフローのデバッグ
summary: ネイティブの zca-js（QR ログイン）による Zalo 個人アカウントのサポート、機能、設定
title: Zalo 個人用
x-i18n:
    generated_at: "2026-07-11T22:04:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 962697c4a56dfb733fe4973e23129ccb365506e35c09e673365842f45a837949
    source_path: channels/zalouser.md
    workflow: 16
---

ステータス: 実験的。この連携はネイティブの `zca-js` を使用し、外部 CLI バイナリを使わずに、プロセス内で**個人用 Zalo アカウント**を自動操作します。

<Warning>
これは非公式の連携であり、アカウントの一時停止や禁止につながる可能性があります。自己責任で使用してください。
</Warning>

## インストール

Zalo Personal は公式の外部 Plugin であり、コアには同梱されていません。使用前にインストールしてください。

```bash
openclaw plugins install @openclaw/zalouser
```

- バージョンを固定する: `openclaw plugins install @openclaw/zalouser@<version>`
- ソースチェックアウトからインストールする: `openclaw plugins install ./path/to/local/zalouser-plugin`
- 詳細: [Plugin](/ja-JP/tools/plugin)

## クイックセットアップ

1. Plugin をインストールします（上記参照）。
2. ログインします（Gateway マシン上で QR を使用）。
   - `openclaw channels login --channel zalouser`
   - Zalo モバイルアプリで QR コードをスキャンします。
3. チャンネルを有効にします。

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
5. DM アクセスのデフォルトはペアリングです。最初の連絡時にペアリングコードを承認してください。

## 概要

- `zca-js` ライブラリにより、完全にプロセス内で動作します（外部の `zca`/`openzca` バイナリは使用しません）。
- ネイティブイベントリスナー（`message`、`error`）を使用して受信メッセージを受け取ります。
- JS API を通じて返信（テキスト、メディア、リンク）を直接送信します。
- Zalo Bot API を利用できない「個人アカウント」のユースケース向けに設計されています。

## 命名

チャンネル ID は `zalouser` です。これは、**個人用 Zalo ユーザーアカウント**を自動操作する非公式連携であることを明示するためです。`zalo` は、将来提供される可能性がある公式 Zalo API 連携用に予約されています。

## ID の検索（ディレクトリ）

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 制限

- 送信テキストは 2,000 文字単位に分割されます（Zalo クライアントの制限）。
- ストリーミングには対応していません。

## アクセス制御（DM）

`channels.zalouser.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: `pairing`）。

`channels.zalouser.allowFrom` には、安定した Zalo ユーザー ID を使用してください。静的な送信者アクセスグループ（`accessGroup:<name>`）も参照できます。対話型セットアップでは、入力した名前を Plugin のプロセス内連絡先検索によって ID に解決できます。

設定に未加工の名前が残っている場合、`channels.zalouser.dangerouslyAllowNameMatching: true` が有効なときに限り、起動時に解決されます。このオプトインがない場合、実行時の送信者チェックは ID のみを使用し、未加工の名前は認可時に無視されます。

次のコマンドで承認します。

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## グループアクセス（任意）

- デフォルト: `channels.zalouser.groupPolicy = "allowlist"`（グループには明示的な許可リストエントリが必要です）。
- すべてのグループを開放する: `channels.zalouser.groupPolicy = "open"`。
- すべてのグループをブロックする: `channels.zalouser.groupPolicy = "disabled"`。
- `groupPolicy = "allowlist"` の場合:
  - `channels.zalouser.groups` のキーには安定したグループ ID を使用してください。`channels.zalouser.dangerouslyAllowNameMatching: true` が有効な場合に限り、名前が起動時に ID に解決されます。
  - `channels.zalouser.groupAllowFrom` は、許可されたグループ内でどの送信者がボットを起動できるかを制御します。静的な送信者アクセスグループは `accessGroup:<name>` で参照できます。
- 設定ウィザードでは、グループの許可リストを入力するよう求めることができます。
- グループ許可リストの照合は、デフォルトでは ID のみを使用します。`channels.zalouser.dangerouslyAllowNameMatching: true` が有効でない限り、解決されていない名前は認証時に無視されます。
- `channels.zalouser.dangerouslyAllowNameMatching: true` は、変更可能な起動時の名前解決と実行時のグループ名照合を再び有効にする、緊急用の互換モードです。
- 通常のグループメッセージでは、`groupAllowFrom` は `allowFrom` に**フォールバックしません**。許可リストに登録されたグループで空のままにすると、そのグループはすべての送信者に対して開放されます。認可された制御コマンド（例: `/new`）は例外です。`groupAllowFrom` が空の場合、コマンド送信者チェックは `allowFrom` にフォールバックします。

例:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { enabled: true },
        "Work Chat": { enabled: true },
      },
    },
  },
}
```

<Note>
`channels.zalouser.groups.<id>.allow` は以前のフィールド名です。現在の設定では `enabled` を使用します。`openclaw doctor --fix` は `allow` を `enabled` に自動的に移行します。
</Note>

### グループでのメンション制御

- `channels.zalouser.groups.<group>.requireMention` は、グループで返信するためにメンションを必須とするかどうかを制御します。
- 解決順序: グループ ID -> `group:<id>` エイリアス -> グループ名/スラッグ（名前に基づく候補は `dangerouslyAllowNameMatching: true` の場合のみ適用）-> `*` -> デフォルト（`true`）。
- 許可リストに登録されたグループと、グループ開放モードの両方に適用されます。
- ボットのメッセージを引用すると、グループを起動するための暗黙的なメンションとして扱われます。
- 認可された制御コマンド（例: `/new`）は、メンション制御を回避できます。
- メンションが必須であるためグループメッセージがスキップされた場合、OpenClaw はそのメッセージを保留中のグループ履歴として保存し、次に処理されるグループメッセージに含めます。
- グループ履歴の上限: `channels.zalouser.historyLimit`、次に `messages.groupChat.historyLimit`、その後フォールバック値の `50`。

例:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { enabled: true, requireMention: true },
        "Work Chat": { enabled: true, requireMention: false },
      },
    },
  },
}
```

## 複数アカウント

アカウントは、OpenClaw の状態内にある `zalouser` プロファイルに対応付けられます。例:

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

## 環境変数

プロファイルの選択には環境変数も使用できます。

| 変数               | 用途                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| `ZALOUSER_PROFILE` | チャンネルまたはアカウント設定で `profile` が設定されていない場合に使用するプロファイル名です。 |
| `ZCA_PROFILE`      | 以前のフォールバックです。`ZALOUSER_PROFILE` が設定されていない場合にのみ使用されます。          |

プロファイル名は、OpenClaw の状態に保存された Zalo ログイン認証情報を選択します。解決順序:

1. 設定内の明示的な `profile`。
2. `ZALOUSER_PROFILE`。
3. `ZCA_PROFILE`。
4. デフォルト以外のアカウントではアカウント ID、デフォルトアカウントでは `default`。

複数アカウントを設定する場合、1 つの環境変数によって複数のアカウントが同じログインセッションを共有しないよう、設定内の各アカウントに `profile` を設定することを推奨します。

## 入力中表示、リアクション、配信確認

- OpenClaw は返信を送信する前に入力中イベントを送信します（ベストエフォート）。
- チャンネルアクションでは、メッセージリアクションアクション `react` が `zalouser` でサポートされています。
  - メッセージから特定のリアクション絵文字を削除するには、`remove: true` を使用します。
  - リアクションの動作: [リアクション](/ja-JP/tools/reactions)
- イベントメタデータを含む受信メッセージに対して、OpenClaw は配信済みと既読の確認を送信します（ベストエフォート）。

## トラブルシューティング

**ログイン状態が維持されない場合:**

- `openclaw channels status --probe`
- 再ログイン: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**許可リストまたはグループ名を解決できない場合:**

- `allowFrom`/`groupAllowFrom` には数値 ID を使用し、`groups` には安定したグループ ID を使用してください。正確な友達名やグループ名を意図的に使用する必要がある場合は、`channels.zalouser.dangerouslyAllowNameMatching: true` を有効にしてください。

**以前の外部 `zca`/CLI ベースのセットアップからアップグレードした場合:**

- 外部の `zca` プロセスを前提とする設定をすべて削除してください。このチャンネルは現在、外部 CLI バイナリを使わず、`zca-js` により完全にプロセス内で動作します。

## 関連項目

- [チャンネルの概要](/ja-JP/channels) - サポートされているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) - DM の認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンション制御
- [チャンネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと堅牢化

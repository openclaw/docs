---
read_when:
    - OpenClaw 用の Zalo Personal の設定
    - Zalo Personal のログインまたはメッセージフローのデバッグ
summary: Zalo 個人アカウントのネイティブ zca-js（QR ログイン）経由のサポート、機能、および設定
title: Zalo 個人用
x-i18n:
    generated_at: "2026-07-05T11:08:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 962697c4a56dfb733fe4973e23129ccb365506e35c09e673365842f45a837949
    source_path: channels/zalouser.md
    workflow: 16
---

ステータス: 実験的。この連携は、外部 CLI バイナリなしで、ネイティブの `zca-js` を介してインプロセスで **個人用 Zalo アカウント**を自動化します。

<Warning>
これは非公式の連携であり、アカウントの停止または禁止につながる可能性があります。自己責任で使用してください。
</Warning>

## インストール

Zalo Personal は公式の外部 Plugin であり、core にはバンドルされていません。使用前にインストールしてください。

```bash
openclaw plugins install @openclaw/zalouser
```

- バージョンを固定する: `openclaw plugins install @openclaw/zalouser@<version>`
- ソース checkout から: `openclaw plugins install ./path/to/local/zalouser-plugin`
- 詳細: [Plugin](/ja-JP/tools/plugin)

## クイック設定

1. Plugin をインストールします（上記）。
2. ログインします（QR、Gateway マシン上）:
   - `openclaw channels login --channel zalouser`
   - Zalo モバイルアプリで QR コードをスキャンします。
3. channel を有効にします。

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

4. Gateway を再起動します（または設定を完了します）。
5. DM アクセスはデフォルトで pairing です。初回接触時に pairing コードを承認します。

## これは何か

- `zca-js` ライブラリを介して完全にインプロセスで動作します（外部 `zca`/`openzca` バイナリなし）。
- ネイティブイベントリスナー（`message`、`error`）を使用して受信メッセージを受け取ります。
- JS API を通じて直接返信を送信します（テキスト/メディア/リンク）。
- Zalo Bot API が利用できない「個人アカウント」用途向けに設計されています。

## 命名

Channel id は `zalouser` です。これは **個人用 Zalo ユーザーアカウント**（非公式）を自動化することを明示するためです。`zalo` は、将来の公式 Zalo API 連携の可能性のために予約されています。

## ID の検索（directory）

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 制限

- 送信テキストは 2000 文字に分割されます（Zalo クライアントの制限）。
- Streaming はサポートされていません。

## アクセス制御（DM）

`channels.zalouser.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: `pairing`）。

`channels.zalouser.allowFrom` には安定した Zalo ユーザー ID を使用する必要があります。静的な送信者アクセスグループ（`accessGroup:<name>`）も参照できます。対話型設定では、入力した名前を Plugin のインプロセス連絡先検索を使って ID に解決できます。

生の名前が config に残っている場合、startup 時の解決は `channels.zalouser.dangerouslyAllowNameMatching: true` が有効な場合のみ行われます。この opt-in がない場合、runtime の送信者チェックは ID のみで行われ、生の名前は認可では無視されます。

承認方法:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## グループアクセス（任意）

- デフォルト: `channels.zalouser.groupPolicy = "allowlist"`（グループには明示的な allowlist エントリが必要です）。
- すべてのグループを開放: `channels.zalouser.groupPolicy = "open"`。
- すべてのグループをブロック: `channels.zalouser.groupPolicy = "disabled"`。
- `groupPolicy = "allowlist"` の場合:
  - `channels.zalouser.groups` のキーには安定したグループ ID を使用する必要があります。名前は startup 時に `channels.zalouser.dangerouslyAllowNameMatching: true` が有効な場合のみ ID に解決されます。
  - `channels.zalouser.groupAllowFrom` は、許可されたグループ内のどの送信者が bot を起動できるかを制御します。静的な送信者アクセスグループは `accessGroup:<name>` で参照できます。
- configure ウィザードは、グループ allowlist の入力を促すことができます。
- グループ allowlist の照合はデフォルトで ID のみです。未解決の名前は、`channels.zalouser.dangerouslyAllowNameMatching: true` が有効でない限り auth では無視されます。
- `channels.zalouser.dangerouslyAllowNameMatching: true` は、可変な startup 時の名前解決と runtime のグループ名照合を再び有効にする break-glass 互換モードです。
- `groupAllowFrom` は通常のグループメッセージでは `allowFrom` にフォールバック**しません**。allowlist に登録されたグループでこれを空にすると、そのグループは任意の送信者に開放されます。認可済みの制御コマンド（例: `/new`）は例外です。`groupAllowFrom` が空の場合、コマンド送信者チェックは `allowFrom` にフォールバックします。

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
`channels.zalouser.groups.<id>.allow` は legacy フィールド名です。現在の config は `enabled` を使用します。`openclaw doctor --fix` は `allow` を `enabled` に自動的に移行します。
</Note>

### グループメンションゲート

- `channels.zalouser.groups.<group>.requireMention` は、グループ返信にメンションが必要かどうかを制御します。
- 解決順序: group id -> `group:<id>` alias -> group name/slug（名前ベースの候補は `dangerouslyAllowNameMatching: true` の場合のみ適用）-> `*` -> デフォルト（`true`）。
- allowlist に登録されたグループと open group モードの両方に適用されます。
- bot メッセージを引用すると、グループ起動の暗黙的なメンションとして扱われます。
- 認可済みの制御コマンド（例: `/new`）は、メンションゲートをバイパスできます。
- メンションが必要なためにグループメッセージがスキップされた場合、OpenClaw はそれを pending group history として保存し、次に処理されるグループメッセージに含めます。
- グループ履歴の上限: `channels.zalouser.historyLimit`、次に `messages.groupChat.historyLimit`、最後に fallback の `50`。

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

## マルチアカウント

アカウントは OpenClaw state 内の `zalouser` profile にマッピングされます。例:

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

Profile 選択は環境変数からも取得できます。

| 変数               | 目的                                                                       |
| ------------------ | -------------------------------------------------------------------------- |
| `ZALOUSER_PROFILE` | channel または account config で `profile` が設定されていない場合に使用する profile 名。 |
| `ZCA_PROFILE`      | legacy fallback。`ZALOUSER_PROFILE` が設定されていない場合のみ使用されます。 |

Profile 名は、OpenClaw state に保存された Zalo ログイン認証情報を選択します。解決順序:

1. config 内の明示的な `profile`。
2. `ZALOUSER_PROFILE`。
3. `ZCA_PROFILE`。
4. 非デフォルトアカウントの場合は account id、デフォルトアカウントの場合は `default`。

マルチアカウント設定では、1 つの環境変数によって複数のアカウントが同じログインセッションを共有しないように、config 内の各アカウントに `profile` を設定することを推奨します。

## 入力中表示、リアクション、配信確認

- OpenClaw は返信を dispatch する前に typing event を送信します（best-effort）。
- Message reaction action `react` は、channel actions 内の `zalouser` でサポートされています。
  - メッセージから特定の reaction emoji を削除するには `remove: true` を使用します。
  - Reaction のセマンティクス: [Reactions](/ja-JP/tools/reactions)
- event metadata を含む受信メッセージについて、OpenClaw は delivered + seen acknowledgements を送信します（best-effort）。

## トラブルシューティング

**ログインが保持されない:**

- `openclaw channels status --probe`
- 再ログイン: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Allowlist/group name が解決されない:**

- `allowFrom`/`groupAllowFrom` には数値 ID を使用し、`groups` には安定したグループ ID を使用してください。正確な友人/グループ名が意図的に必要な場合は、`channels.zalouser.dangerouslyAllowNameMatching: true` を有効にしてください。

**古い外部 `zca`/CLI ベースの設定からアップグレードした場合:**

- 外部 `zca` プロセスに関する前提をすべて取り除いてください。この channel は現在、外部 CLI バイナリなしで `zca-js` を介して完全にインプロセスで動作します。

## 関連

- [Channels Overview](/ja-JP/channels) - サポートされるすべての channel
- [Pairing](/ja-JP/channels/pairing) - DM 認証と pairing flow
- [Groups](/ja-JP/channels/groups) - グループチャットの behavior とメンションゲート
- [Channel Routing](/ja-JP/channels/channel-routing) - メッセージの session routing
- [Security](/ja-JP/gateway/security) - アクセスモデルと hardening

---
read_when:
    - OpenClaw 用 Zalo Personal の設定
    - Zalo Personal のログインまたはメッセージフローのデバッグ
summary: ネイティブ zca-js（QR ログイン）による Zalo 個人アカウント対応、機能、設定
title: Zalo 個人
x-i18n:
    generated_at: "2026-06-27T10:45:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdd331d118bfc0d9aba90ac5e42c2ba52e010eafba1342bd3523c64642057dc6
    source_path: channels/zalouser.md
    workflow: 16
---

ステータス: 実験的。この連携は、OpenClaw 内のネイティブ `zca-js` を通じて **個人 Zalo アカウント**を自動化します。

<Warning>
これは非公式の連携であり、アカウントの停止または禁止につながる可能性があります。自己責任で使用してください。
</Warning>

## バンドル Plugin

Zalo Personal は現在の OpenClaw リリースではバンドル Plugin として同梱されているため、通常の
パッケージ版ビルドでは別途インストールは不要です。

Zalo Personal を含まない古いビルドまたはカスタムインストールを使用している場合は、
npm パッケージを直接インストールしてください。

- CLI でインストール: `openclaw plugins install @openclaw/zalouser`
- 固定バージョン: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- またはソースチェックアウトから: `openclaw plugins install ./path/to/local/zalouser-plugin`
- 詳細: [Plugin](/ja-JP/tools/plugin)

外部の `zca`/`openzca` CLI バイナリは不要です。

## 簡単セットアップ（初心者向け）

1. Zalo Personal Plugin が利用可能であることを確認します。
   - 現在のパッケージ版 OpenClaw リリースにはすでに同梱されています。
   - 古いインストールやカスタムインストールでは、上記のコマンドで手動追加できます。
2. ログインします（QR、Gateway マシン上）:
   - `openclaw channels login --channel zalouser`
   - Zalo モバイルアプリで QR コードをスキャンします。
3. チャンネルを有効化します。

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
5. DM アクセスはデフォルトでペアリングです。初回接触時にペアリングコードを承認します。

## 概要

- `zca-js` を通じて完全にプロセス内で実行されます。
- ネイティブイベントリスナーを使用して受信メッセージを受け取ります。
- JS API（テキスト/メディア/リンク）を通じて返信を直接送信します。
- Zalo Bot API が利用できない「個人アカウント」のユースケース向けに設計されています。

## 命名

チャンネル ID は `zalouser` です。これは **個人 Zalo ユーザーアカウント**（非公式）を自動化することを明示するためです。将来の公式 Zalo API 連携の可能性に備えて、`zalo` は予約しています。

## ID の検索（ディレクトリ）

ディレクトリ CLI を使用してピア/グループとその ID を検出します。

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 制限

- 送信テキストは約 2000 文字ごとに分割されます（Zalo クライアントの制限）。
- ストリーミングはデフォルトでブロックされます。

## アクセス制御（DM）

`channels.zalouser.dmPolicy` は `pairing | allowlist | open | disabled` をサポートします（デフォルト: `pairing`）。

`channels.zalouser.allowFrom` には安定した Zalo ユーザー ID を使用してください。静的な送信者アクセスグループ（`accessGroup:<name>`）も参照できます。対話型セットアップ中に入力した名前は、Plugin のプロセス内連絡先検索を使用して ID に解決できます。

生の名前が設定に残っている場合、起動時の解決は `channels.zalouser.dangerouslyAllowNameMatching: true` が有効な場合にのみ行われます。このオプトインがない場合、実行時の送信者チェックは ID のみで行われ、生の名前は認可では無視されます。

承認方法:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## グループアクセス（任意）

- デフォルト: `channels.zalouser.groupPolicy = "open"`（グループを許可）。未設定時のデフォルトを上書きするには `channels.defaults.groupPolicy` を使用します。
- allowlist に制限するには:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups`（キーには安定したグループ ID を使用してください。名前は `channels.zalouser.dangerouslyAllowNameMatching: true` が有効な場合にのみ起動時に ID へ解決されます）
  - `channels.zalouser.groupAllowFrom`（許可されたグループ内のどの送信者が bot を起動できるかを制御します。静的な送信者アクセスグループは `accessGroup:<name>` で参照できます）
- すべてのグループをブロック: `channels.zalouser.groupPolicy = "disabled"`。
- 設定ウィザードはグループ allowlist の入力を求めることができます。
- 起動時、OpenClaw は allowlist 内のグループ名/ユーザー名を ID に解決し、そのマッピングをログに記録します。ただし、これは `channels.zalouser.dangerouslyAllowNameMatching: true` が有効な場合にのみ行われます。
- グループ allowlist の照合はデフォルトで ID のみです。未解決の名前は、`channels.zalouser.dangerouslyAllowNameMatching: true` が有効でない限り、認証では無視されます。
- `channels.zalouser.dangerouslyAllowNameMatching: true` は、変更可能な起動時の名前解決と実行時のグループ名照合を再有効化する緊急互換モードです。
- `groupAllowFrom` が未設定の場合、実行時はグループ送信者チェックで `allowFrom` にフォールバックします。
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

### グループメンションゲート

- `channels.zalouser.groups.<group>.requireMention` は、グループ返信にメンションを必須とするかどうかを制御します。
- 解決順序: 正確なグループ ID/名前 -> 正規化されたグループスラッグ -> `*` -> デフォルト（`true`）。
- これは allowlist に登録されたグループとオープングループモードの両方に適用されます。
- bot メッセージの引用は、グループ起動の暗黙的なメンションとして扱われます。
- 認可済みの制御コマンド（例: `/new`）はメンションゲートをバイパスできます。
- メンションが必須のためにグループメッセージがスキップされた場合、OpenClaw はそれを保留中のグループ履歴として保存し、次に処理されるグループメッセージに含めます。
- グループ履歴の上限はデフォルトで `messages.groupChat.historyLimit`（フォールバック `50`）です。アカウントごとに `channels.zalouser.historyLimit` で上書きできます。

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

アカウントは OpenClaw 状態内の `zalouser` プロファイルにマッピングされます。例:

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

Zalo Personal Plugin は、環境変数からプロファイル選択を読み取ることもできます。

- `ZALOUSER_PROFILE`: チャンネルまたはアカウント設定で `profile` が設定されていない場合に使用するプロファイル名。
- `ZCA_PROFILE`: レガシーのフォールバックプロファイル名。`ZALOUSER_PROFILE` が設定されていない場合にのみ使用されます。

プロファイル名は、OpenClaw 状態に保存された Zalo ログイン認証情報を選択します。解決順序は次のとおりです。

1. 設定内の明示的な `profile`。
2. `ZALOUSER_PROFILE`。
3. `ZCA_PROFILE`。
4. デフォルト以外のアカウントではアカウント ID、デフォルトアカウントでは `default`。

マルチアカウント構成では、1 つの環境変数によって複数のアカウントが同じログイン
セッションを共有しないように、設定で各アカウントに `profile` を設定することを推奨します。

## 入力中表示、リアクション、配信確認

- OpenClaw は返信を送信する前に入力中イベントを送信します（ベストエフォート）。
- メッセージリアクションアクション `react` は、チャンネルアクション内の `zalouser` でサポートされています。
  - メッセージから特定のリアクション絵文字を削除するには `remove: true` を使用します。
  - リアクションのセマンティクス: [リアクション](/ja-JP/tools/reactions)
- イベントメタデータを含む受信メッセージについて、OpenClaw は配信済み + 既読確認を送信します（ベストエフォート）。

## トラブルシューティング

**ログインが保持されない場合:**

- `openclaw channels status --probe`
- 再ログイン: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**allowlist/グループ名が解決されない場合:**

- `allowFrom`/`groupAllowFrom` には数値 ID を使用し、`groups` には安定したグループ ID を使用します。正確な友達名/グループ名が意図的に必要な場合は、`channels.zalouser.dangerouslyAllowNameMatching: true` を有効にしてください。

**古い CLI ベースのセットアップからアップグレードした場合:**

- 古い外部 `zca` プロセスに関する前提を削除します。
- このチャンネルは現在、外部 CLI バイナリなしで OpenClaw 内で完全に実行されます。

## 関連

- [チャンネル概要](/ja-JP/channels) — サポートされているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化

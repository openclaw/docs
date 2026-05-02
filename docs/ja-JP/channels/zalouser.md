---
read_when:
    - OpenClaw 用に Zalo Personal を設定する
    - Zalo Personal のログインまたはメッセージフローのデバッグ
summary: ネイティブ zca-js（QR ログイン）による Zalo 個人アカウントのサポート、機能、設定
title: Zalo 個人用
x-i18n:
    generated_at: "2026-05-02T22:17:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0096775e0017e504130f2e19e05ab8114eadb873a9e11f79ea8f0dd91297567f
    source_path: channels/zalouser.md
    workflow: 16
---

ステータス: 実験的。この連携は、OpenClaw内のネイティブ`zca-js`を介して**個人用Zaloアカウント**を自動化します。

<Warning>
これは非公式の連携であり、アカウントの停止や禁止につながる可能性があります。自己責任で使用してください。
</Warning>

## バンドル済みPlugin

Zalo Personalは現在のOpenClawリリースにバンドル済みPluginとして含まれているため、通常の
パッケージ版ビルドでは別途インストールする必要はありません。

古いビルドを使っている場合、またはZalo Personalを除外したカスタムインストールを使っている場合は、
npmパッケージを直接インストールしてください。

- CLI経由でインストール: `openclaw plugins install @openclaw/zalouser`
- 固定バージョン: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- またはソースチェックアウトから: `openclaw plugins install ./path/to/local/zalouser-plugin`
- 詳細: [Plugins](/ja-JP/tools/plugin)

外部の`zca`/`openzca` CLIバイナリは不要です。

## 簡単セットアップ（初心者向け）

1. Zalo Personal Pluginが利用可能であることを確認します。
   - 現在のパッケージ版OpenClawリリースにはすでにバンドルされています。
   - 古いインストールやカスタムインストールでは、上記のコマンドで手動追加できます。
2. ログインします（QR、Gatewayマシン上）:
   - `openclaw channels login --channel zalouser`
   - ZaloモバイルアプリでQRコードをスキャンします。
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

4. Gatewayを再起動します（またはセットアップを完了します）。
5. DMアクセスはデフォルトでペアリングです。初回接触時にペアリングコードを承認してください。

## 概要

- 完全に`zca-js`経由でプロセス内実行されます。
- ネイティブイベントリスナーを使って受信メッセージを受け取ります。
- JS APIを通じて返信を直接送信します（テキスト/メディア/リンク）。
- Zalo Bot APIを利用できない「個人アカウント」ユースケース向けに設計されています。

## 命名

チャネルIDは`zalouser`です。これにより、これが**個人用Zaloユーザーアカウント**（非公式）を自動化するものだと明示しています。将来の公式Zalo API連携の可能性に備えて、`zalo`は予約しています。

## IDの確認（ディレクトリ）

ディレクトリCLIを使ってピア/グループとそのIDを確認します。

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 制限

- 送信テキストは約2000文字ごとに分割されます（Zaloクライアントの制限）。
- ストリーミングはデフォルトでブロックされます。

## アクセス制御（DM）

`channels.zalouser.dmPolicy`は次をサポートします: `pairing | allowlist | open | disabled`（デフォルト: `pairing`）。

`channels.zalouser.allowFrom`にはユーザーIDまたは名前を指定できます。セットアップ中、名前はPluginのプロセス内連絡先検索を使ってIDに解決されます。

承認方法:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## グループアクセス（任意）

- デフォルト: `channels.zalouser.groupPolicy = "open"`（グループを許可）。未設定時のデフォルトを上書きするには`channels.defaults.groupPolicy`を使います。
- 許可リストに制限するには:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups`（キーは安定したグループIDにする必要があります。可能な場合、起動時に名前がIDへ解決されます）
  - `channels.zalouser.groupAllowFrom`（許可されたグループ内のどの送信者がボットを起動できるかを制御します）
- すべてのグループをブロック: `channels.zalouser.groupPolicy = "disabled"`。
- 設定ウィザードではグループ許可リストの入力を求めることができます。
- 起動時、OpenClawは許可リスト内のグループ/ユーザー名をIDに解決し、そのマッピングをログに記録します。
- グループ許可リストの照合はデフォルトでIDのみです。未解決の名前は、`channels.zalouser.dangerouslyAllowNameMatching: true`が有効でない限り、認証では無視されます。
- `channels.zalouser.dangerouslyAllowNameMatching: true`は、変更可能なグループ名照合を再度有効にする非常用の互換モードです。
- `groupAllowFrom`が未設定の場合、ランタイムはグループ送信者チェックに`allowFrom`へフォールバックします。
- 送信者チェックは通常のグループメッセージと制御コマンド（例: `/new`、`/reset`）の両方に適用されます。

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

- `channels.zalouser.groups.<group>.requireMention`は、グループ返信にメンションが必要かどうかを制御します。
- 解決順序: 完全一致のグループID/名前 -> 正規化されたグループスラッグ -> `*` -> デフォルト（`true`）。
- これは許可リスト済みグループとオープングループモードの両方に適用されます。
- ボットメッセージを引用すると、グループ有効化の暗黙的なメンションとして扱われます。
- 認可済みの制御コマンド（例: `/new`）はメンションゲートをバイパスできます。
- メンションが必要なためグループメッセージがスキップされた場合、OpenClawはそれを保留中のグループ履歴として保存し、次に処理されるグループメッセージに含めます。
- グループ履歴の制限はデフォルトで`messages.groupChat.historyLimit`（フォールバックは`50`）です。アカウントごとに`channels.zalouser.historyLimit`で上書きできます。

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

アカウントはOpenClawの状態内の`zalouser`プロファイルにマップされます。例:

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

- OpenClawは返信をディスパッチする前に入力中イベントを送信します（ベストエフォート）。
- メッセージリアクションアクション`react`は、チャネルアクション内の`zalouser`でサポートされています。
  - メッセージから特定のリアクション絵文字を削除するには`remove: true`を使います。
  - リアクションのセマンティクス: [リアクション](/ja-JP/tools/reactions)
- イベントメタデータを含む受信メッセージについては、OpenClawは配信済み + 既読の確認を送信します（ベストエフォート）。

## トラブルシューティング

**ログインが維持されない:**

- `openclaw channels status --probe`
- 再ログイン: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**許可リスト/グループ名が解決されない:**

- `allowFrom`/`groupAllowFrom`/`groups`では数値ID、または完全一致の友だち/グループ名を使います。

**古いCLIベースのセットアップからアップグレードした場合:**

- 古い外部`zca`プロセスを前提とした設定を削除します。
- このチャネルは現在、外部CLIバイナリなしでOpenClaw内で完全に実行されます。

## 関連

- [チャネル概要](/ja-JP/channels) — サポートされているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化

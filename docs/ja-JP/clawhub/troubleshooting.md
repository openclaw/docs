---
read_when:
    - ClawHub CLI または OpenClaw レジストリコマンドが失敗する
    - パッケージをインストール、公開、または更新できません
summary: ClawHub のサインイン、インストール、公開、同期、更新、および API の問題のトラブルシューティング。
x-i18n:
    generated_at: "2026-05-11T20:25:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# トラブルシューティング

## `clawhub login` でブラウザーが開くが完了しない

CLI はブラウザーログイン中に短時間だけ動作するローカルコールバックサーバーを起動します。

- ブラウザーが `http://127.0.0.1:<port>/callback` に到達できることを確認します。
- コールバックが届かない場合は、ローカルファイアウォール、VPN、プロキシルールを確認します。
- ヘッドレス環境では、ClawHub のウェブ UI で API トークンを作成し、次を実行します。

```bash
clawhub login --token clh_...
```

## `whoami` または `publish` が `Unauthorized` (401) を返す

- `clawhub login` でもう一度サインインします。
- カスタム設定パスを使用している場合は、`CLAWHUB_CONFIG_PATH` が現在のトークンを含む
  ファイルを指していることを確認します。
- API トークンを使用している場合は、ウェブ UI で取り消されていないことを確認します。

## 検索またはインストールが `Rate limit exceeded` (429) を返す

レスポンス内の再試行情報を確認します。

- `Retry-After`: 再試行前に待機する秒数。
- `RateLimit-Remaining` と `RateLimit-Limit`: 現在の割り当て。
- `RateLimit-Reset` または `X-RateLimit-Reset`: リセットのタイミング。

多くのユーザーが 1 つの送信元 IP を共有している場合、各ユーザーが数件のリクエストしか送信していなくても、匿名 IP の制限に達することがあります。可能な場合はサインインし、報告された待機時間の後に再試行してください。

## プロキシ環境で検索またはインストールが失敗する

CLI は標準のプロキシ変数に対応しています。

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

対応する名前には、`HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy`、および
`http_proxy` が含まれます。

## Skills が検索に表示されない

- 正確なスラッグまたは所有者ページが分かる場合は確認します。
- リリースが公開されており、スキャンまたはモデレーションで保留されていないことを確認します。
- Skills の所有者である場合は、サインインして調査します。

```bash
clawhub inspect <skill-slug>
```

所有者に表示される診断情報で、スキャン、アップロードゲート、またはモデレーションの状態が説明される場合があります。

## 必須メタデータが欠落しているため公開に失敗する

Skills については、`SKILL.md` のフロントマターを確認します。ユーザーとスキャナーがパッケージを理解できるように、必須の環境変数とツールを宣言する必要があります。

プラグインについては、`package.json` の互換性メタデータを確認します。コードプラグインの公開には、`openclaw.compat.pluginApi` や
`openclaw.build.openclawVersion` などの OpenClaw 互換性フィールドが必要です。

まず公開ペイロードをプレビューします。

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub 所有者またはソースのエラーで公開に失敗する

ClawHub は GitHub の ID とソース帰属を使用して、パッケージをその公開者に関連付けます。

- パッケージを所有している、または公開できる GitHub アカウントでサインインしていることを確認します。
- ソース URL が公開されているか、ClawHub からアクセスできることを確認します。
- GitHub ソースでは、`owner/repo`、`owner/repo@ref`、または完全な GitHub URL を使用します。

## `sync` が Skills が見つからないと言う

`sync` は `SKILL.md` または `skill.md` を含むフォルダーを探します。

スキャンしたいルートを指定します。

```bash
clawhub sync --root /path/to/skills
```

何が公開されるか不明な場合は、まずプレビューします。

```bash
clawhub sync --all --dry-run --no-input
```

## ローカル変更があるため `update` が拒否される

ローカルファイルは、ClawHub が認識しているどのバージョンとも一致しません。次のいずれかを選択します。

- ローカル編集を保持し、更新をスキップします。
- 公開済みバージョンで上書きします。

```bash
clawhub update <slug> --force
```

- 編集済みのコピーを新しいスラッグまたはフォークとして公開します。

## OpenClaw でプラグインのインストールに失敗する

- 明示的な ClawHub ソースを使用します。

```bash
openclaw plugins install clawhub:<package>
```

- パッケージ詳細ページで、スキャン状態と互換性メタデータを確認します。
- 使用中の OpenClaw バージョンが、パッケージで示されている
  互換性範囲を満たしていることを確認します。
- パッケージが非表示、保留、またはブロックされている場合、所有者が問題を解決するまでインストールできないことがあります。

## 公開 API リクエストが失敗する

- `429` の再試行ヘッダーに従い、公開リストおよび検索レスポンスをキャッシュします。
- ユーザーを正規の ClawHub リストへ戻すリンクを示します。
- 非表示、非公開、保留中、またはモデレーションでブロックされたコンテンツを、公開 API サーフェスの外部にミラーしないでください。

エンドポイントの詳細については、[HTTP API](/ja-JP/clawhub/http-api) を参照してください。

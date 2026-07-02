---
read_when:
    - ClawHub CLI または OpenClaw registry コマンドが失敗する
    - パッケージをインストール、公開、または更新できない
summary: ClawHub のサインイン、インストール、公開、更新、API の問題をトラブルシューティングします。
x-i18n:
    generated_at: "2026-07-02T13:58:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# トラブルシューティング

## `clawhub login` がブラウザーを開くが完了しない

CLI はブラウザーログイン中に短命のローカルコールバックサーバーを起動します。

- ブラウザーが `http://127.0.0.1:<port>/callback` に到達できることを確認してください。
- コールバックが届かない場合は、ローカルファイアウォール、VPN、プロキシルールを確認してください。
- ヘッドレス環境では、ClawHub の Web UI で API トークンを作成して次を実行します。

```bash
clawhub login --token clh_...
```

## `whoami` または `publish` が `Unauthorized` (401) を返す

- `clawhub login` で再度サインインしてください。
- カスタム設定パスを使っている場合は、`CLAWHUB_CONFIG_PATH` が現在のトークンを含む
  ファイルを指していることを確認してください。
- API トークンを使っている場合は、Web UI で取り消されていないことを確認してください。

## 検索またはインストールが `Rate limit exceeded` (429) を返す

レスポンス内のリトライ情報を確認してください。

- `Retry-After`: 再試行まで待機する秒数。
- `RateLimit-Limit`: このリクエストに適用された制限。
- `RateLimit-Remaining`: ヘッダーが存在する場合の正確な残り割り当て。`429` では `0` です。
- `RateLimit-Reset` または `X-RateLimit-Reset`: リセット時刻。

多数のユーザーが 1 つの送信元 IP を共有している場合、各ユーザーが少数のリクエストしか送信していなくても、
匿名 IP 制限に達することがあります。可能な場合はサインインし、報告された遅延後に再試行してください。

## 検索またはインストールがプロキシ越しで失敗する

CLI は標準のプロキシ変数を尊重します。

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

サポートされる名前には、`HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy`、および
`http_proxy` が含まれます。

## skill が検索に表示されない

- 正確な slug または owner ページが分かる場合は確認してください。
- リリースが公開されており、スキャンやモデレーションで保留されていないことを確認してください。
- skill の所有者である場合は、サインインして検査します。

```bash
clawhub inspect @openclaw/demo
```

所有者に表示される診断で、スキャン、アップロードゲート、またはモデレーションの状態が説明される場合があります。

## 必須メタデータがないため公開に失敗する

skills については、`SKILL.md` の frontmatter を確認してください。ユーザーとスキャナーがパッケージを理解できるように、
必要な環境変数とツールを宣言する必要があります。

plugins については、`package.json` の互換性メタデータを確認してください。コード Plugin の公開には、
`openclaw.compat.pluginApi` や `openclaw.build.openclawVersion` などの OpenClaw 互換性フィールドが必要です。

まず公開ペイロードをプレビューします。

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub owner または source エラーで公開に失敗する

ClawHub は GitHub の ID とソース帰属を使って、パッケージをその公開者に結び付けます。

- パッケージを所有している、または公開できる GitHub アカウントでサインインしていることを確認してください。
- source URL が公開されている、または ClawHub からアクセス可能であることを確認してください。
- GitHub ソースには、`owner/repo`、`owner/repo@ref`、または完全な GitHub URL を使用してください。

## namespace が取得済みまたは予約済みのため公開に失敗する

owner handle、org namespace、package scope、skill
slug、または package name がすでに取得済みまたは予約済みであるため公開に失敗する場合は、まずその namespace と一致する owner で公開していることを確認してください。Plugin パッケージでは、
`@example-org/example-plugin` のような scoped name は、対応する
`example-org` owner として公開する必要があります。

自分の org、project、または brand が正当な namespace owner であると考えているが、
現在の ClawHub owner を管理できない場合は、公開可能で機密でない証拠を添えて
[Org / Namespace Claim issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
を開いてください。証拠のガイダンスと公開 issue に含めない内容については、
[Org and Namespace Claims](/clawhub/namespace-claims) を参照してください。

## `sync` が skills が見つからなかったと言う

`sync` は `SKILL.md` または `skill.md` を含むフォルダーを探します。

スキャンしたいルートを指定してください。

```bash
clawhub sync --root /path/to/skills
```

何が公開されるか不明な場合は、まずプレビューしてください。

```bash
clawhub sync --all --dry-run --no-input
```

## ローカル変更のため `update` が拒否される

ローカルファイルは ClawHub が認識しているどのバージョンとも一致しません。次のいずれかを選択してください。

- ローカル編集を保持して更新をスキップする。
- 公開済みバージョンで上書きする。

```bash
clawhub update @openclaw/demo --force
```

- 編集したコピーを新しい slug または fork として公開する。

## OpenClaw で Plugin のインストールに失敗する

- 明示的な ClawHub ソースを使用してください。

```bash
openclaw plugins install clawhub:<package>
```

- スキャン状態と互換性メタデータについて、パッケージの詳細ページを確認してください。
- 使用している OpenClaw バージョンが、パッケージで提示されている
  互換性範囲を満たしていることを確認してください。
- パッケージが hidden、held、または blocked の場合、owner が問題を解決するまで
  インストールできないことがあります。

## Public API リクエストが失敗する

- `429` のリトライヘッダーを尊重し、公開 list/search レスポンスをキャッシュしてください。
- ユーザーを正規の ClawHub listing に戻すリンクを示してください。
- hidden、private、held、または moderation-blocked のコンテンツを
  public API surface の外にミラーしないでください。

エンドポイントの詳細については [HTTP API](/clawhub/http-api) を参照してください。

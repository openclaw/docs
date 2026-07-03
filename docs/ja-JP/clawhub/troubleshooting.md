---
read_when:
    - ClawHub CLI または OpenClaw レジストリコマンドが失敗する
    - パッケージをインストール、公開、または更新できない
summary: ClawHub のサインイン、インストール、公開、更新、API の問題をトラブルシューティングします。
x-i18n:
    generated_at: "2026-07-03T02:42:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# トラブルシューティング

## `clawhub login` がブラウザーを開くが完了しない

CLI はブラウザーログイン中に短時間だけ動作するローカルコールバックサーバーを起動します。

- ブラウザーが `http://127.0.0.1:<port>/callback` に到達できることを確認してください。
- コールバックが届かない場合は、ローカルファイアウォール、VPN、プロキシのルールを確認してください。
- ヘッドレス環境では、ClawHub の Web UI で API トークンを作成し、次を実行してください。

```bash
clawhub login --token clh_...
```

## `whoami` または `publish` が `Unauthorized` (401) を返す

- `clawhub login` で再度サインインしてください。
- カスタム設定パスを使用している場合は、`CLAWHUB_CONFIG_PATH` が現在のトークンを含むファイルを指していることを確認してください。
- API トークンを使用している場合は、Web UI で取り消されていないことを確認してください。

## 検索またはインストールが `Rate limit exceeded` (429) を返す

レスポンス内の再試行情報を確認してください。

- `Retry-After`: 再試行前に待機する秒数。
- `RateLimit-Limit`: このリクエストに適用された制限。
- `RateLimit-Remaining`: ヘッダーが存在する場合の正確な残り予算。`429` では `0` です。
- `RateLimit-Reset` または `X-RateLimit-Reset`: リセットのタイミング。

多くのユーザーが 1 つの送信元 IP を共有している場合、各ユーザーが少数のリクエストしか送信していなくても、匿名 IP 制限に達することがあります。可能な場合はサインインし、報告された遅延の後に再試行してください。

## プロキシ配下で検索またはインストールが失敗する

CLI は標準のプロキシ変数に従います。

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

サポートされる名前には、`HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy`、`http_proxy` が含まれます。

## スキルが検索に表示されない

- 正確な slug、または分かっている場合は owner ページを確認してください。
- リリースが公開されており、スキャンやモデレーションで保留されていないことを確認してください。
- そのスキルを所有している場合は、サインインして調べてください。

```bash
clawhub inspect @openclaw/demo
```

owner に表示される診断情報で、スキャン、アップロードゲート、またはモデレーション状態が説明される場合があります。

## 必須メタデータが不足しているため publish が失敗する

スキルの場合は、`SKILL.md` の frontmatter を確認してください。ユーザーとスキャナーがパッケージを理解できるように、必須の環境変数とツールを宣言する必要があります。

プラグインの場合は、`package.json` の互換性メタデータを確認してください。code-plugin の publish には、`openclaw.compat.pluginApi` や `openclaw.build.openclawVersion` などの OpenClaw 互換性フィールドが必要です。

まず publish ペイロードをプレビューしてください。

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub owner または source エラーで publish が失敗する

ClawHub は GitHub の ID と source 帰属情報を使用して、パッケージを公開者に関連付けます。

- パッケージを所有している、または公開できる GitHub アカウントでサインインしていることを確認してください。
- source URL が公開されているか、ClawHub からアクセス可能であることを確認してください。
- GitHub source の場合は、`owner/repo`、`owner/repo@ref`、または完全な GitHub URL を使用してください。

## 名前空間が請求済みまたは予約済みのため publish が失敗する

owner ハンドル、組織名前空間、パッケージスコープ、スキル slug、またはパッケージ名がすでに請求済みまたは予約済みであるため publish が失敗する場合は、まずその名前空間に一致する owner で公開していることを確認してください。プラグインパッケージの場合、`@example-org/example-plugin` のようなスコープ付き名は、一致する `example-org` owner として公開する必要があります。

自分の組織、プロジェクト、またはブランドが正当な名前空間 owner であると考えているものの、現在の ClawHub owner を管理できない場合は、公開可能で機密ではない証拠を添えて [組織 / 名前空間請求 issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml) を開いてください。証拠に関するガイダンスと、公開 issue に含めないものについては、[組織と名前空間の請求](/clawhub/namespace-claims) を参照してください。

## `sync` がスキルを見つけられなかったと表示する

`sync` は `SKILL.md` または `skill.md` を含むフォルダーを探します。

スキャンしたいルートを指定してください。

```bash
clawhub sync --root /path/to/skills
```

何が publish されるか不明な場合は、まずプレビューしてください。

```bash
clawhub sync --all --dry-run --no-input
```

## ローカル変更のため `update` が拒否される

ローカルファイルが、ClawHub が認識しているどのバージョンとも一致しません。次のいずれかを選択してください。

- ローカル編集を保持し、更新をスキップする。
- 公開済みバージョンで上書きする。

```bash
clawhub update @openclaw/demo --force
```

- 編集済みコピーを新しい slug またはフォークとして公開する。

## OpenClaw でプラグインのインストールが失敗する

- 明示的な ClawHub source を使用してください。

```bash
openclaw plugins install clawhub:<package>
```

- スキャン状態と互換性メタデータについて、パッケージ詳細ページを確認してください。
- 使用している OpenClaw バージョンが、パッケージで公表されている互換性範囲を満たしていることを確認してください。
- パッケージが非表示、保留中、またはブロック中の場合、owner が問題を解決するまでインストールできない場合があります。

## Public API リクエストが失敗する

- `429` の再試行ヘッダーに従い、公開リスト/検索レスポンスをキャッシュしてください。
- ユーザーを正規の ClawHub リストへ戻すリンクを設定してください。
- 非表示、非公開、保留中、またはモデレーションでブロックされたコンテンツを Public API サーフェス外にミラーしないでください。

エンドポイントの詳細については、[HTTP API](/clawhub/http-api) を参照してください。

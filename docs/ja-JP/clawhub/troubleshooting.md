---
read_when:
    - ClawHub CLI または OpenClaw レジストリコマンドが失敗する
    - パッケージをインストール、公開、または更新できない
summary: ClawHub のサインイン、インストール、公開、更新、API に関する問題のトラブルシューティング。
x-i18n:
    generated_at: "2026-07-12T14:21:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# トラブルシューティング

## `clawhub login` でブラウザーが開くが完了しない

CLI はブラウザーでのログイン中、短時間だけ有効なローカルコールバックサーバーを起動します。

- ブラウザーから `http://127.0.0.1:<port>/callback` にアクセスできることを確認してください。
- コールバックが届かない場合は、ローカルファイアウォール、VPN、プロキシのルールを確認してください。
- ヘッドレス環境では、ClawHub の Web UI で API トークンを作成し、次を実行します。

```bash
clawhub login --token clh_...
```

## `whoami` または `publish` が `Unauthorized` (401) を返す

- `clawhub login` で再度サインインしてください。
- カスタム設定パスを使用している場合は、`CLAWHUB_CONFIG_PATH` が現在のトークンを含む
  ファイルを指していることを確認してください。
- API トークンを使用している場合は、Web UI で取り消されていないことを確認してください。

## 検索またはインストールで `Rate limit exceeded` (429) が返される

レスポンス内の再試行情報を確認してください。

- `Retry-After`: 再試行までの待機秒数。
- `RateLimit-Limit`: このリクエストに適用される上限。
- `RateLimit-Remaining`: ヘッダーが存在する場合の、正確な残りリクエスト枠。`429` の場合は `0` です。
- `RateLimit-Reset` または `X-RateLimit-Reset`: リセットのタイミング。

多くのユーザーが 1 つの送信元 IP を共有している場合、各ユーザーが数件のリクエストしか
送信していなくても、匿名 IP の上限に達することがあります。可能な場合はサインインし、
通知された待機時間の経過後に再試行してください。

## プロキシ環境で検索またはインストールに失敗する

CLI は標準のプロキシ変数に従います。

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

サポートされる名前には、`HTTPS_PROXY`、`HTTP_PROXY`、`https_proxy`、
`http_proxy` があります。

## Skills が検索に表示されない

- 正確なスラッグまたは所有者ページが分かっている場合は、それを確認してください。
- リリースが公開されており、スキャンまたはモデレーションによって保留されていないことを確認してください。
- その Skills を所有している場合は、サインインして確認します。

```bash
clawhub inspect @openclaw/demo
```

所有者に表示される診断情報から、スキャン、アップロードゲート、またはモデレーションの状態を確認できる場合があります。

## 必須メタデータがないため公開に失敗する

Skills の場合は、`SKILL.md` の frontmatter を確認してください。ユーザーとスキャナーがパッケージを理解できるように、
必須の環境変数とツールを宣言する必要があります。

Plugin の場合は、`package.json` の互換性メタデータを確認してください。コード Plugin の公開には、
`openclaw.compat.pluginApi` や `openclaw.build.openclawVersion` などの
OpenClaw 互換性フィールドが必要です。

まず公開ペイロードをプレビューします。

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub の所有者またはソースのエラーにより公開に失敗する

ClawHub は GitHub の ID とソース帰属情報を使用して、パッケージとその
公開者を関連付けます。

- パッケージを所有している、または公開できる GitHub アカウントでサインインしていることを
  確認してください。
- ソース URL が公開されているか、ClawHub からアクセスできることを確認してください。
- GitHub ソースには、`owner/repo`、`owner/repo@ref`、または完全な GitHub URL を使用してください。

## 名前空間が取得済みまたは予約済みのため公開に失敗する

所有者ハンドル、組織の名前空間、パッケージスコープ、Skills の
スラッグ、またはパッケージ名がすでに取得済みか予約済みであるため公開に失敗した場合は、まず
その名前空間と一致する所有者として公開していることを確認してください。Plugin パッケージの場合、
`@example-org/example-plugin` のようなスコープ付きの名前は、対応する
`example-org` 所有者として公開する必要があります。

自分の組織、プロジェクト、またはブランドが正当な名前空間所有者であるにもかかわらず、
現在の ClawHub 所有者を管理できない場合は、公開可能で機密性のない証拠を添えて
[組織／名前空間の権利申請 Issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
を作成してください。必要な証拠と公開 Issue に含めてはならない情報については、
[組織と名前空間の権利申請](/clawhub/namespace-claims)を参照してください。

## `sync` で Skills が見つからなかったと表示される

`sync` は `SKILL.md` または `skill.md` を含むフォルダーを検索します。

スキャン対象のルートを指定します。

```bash
clawhub sync --root /path/to/skills
```

何が公開されるか不明な場合は、まずプレビューしてください。

```bash
clawhub sync --all --dry-run --no-input
```

## ローカルの変更が原因で `update` が拒否される

ローカルファイルが、ClawHub が把握しているどのバージョンとも一致しません。次のいずれかを選択してください。

- ローカルの編集を保持し、更新をスキップする。
- 公開済みバージョンで上書きする。

```bash
clawhub update @openclaw/demo --force
```

- 編集したコピーを新しいスラッグまたはフォークとして公開する。

## OpenClaw で Plugin のインストールに失敗する

- ClawHub ソースを明示的に指定します。

```bash
openclaw plugins install clawhub:<package>
```

- パッケージの詳細ページで、スキャン状態と互換性メタデータを確認してください。
- 使用中の OpenClaw バージョンが、パッケージに記載されている
  互換性の範囲を満たしていることを確認してください。
- パッケージが非表示、保留、またはブロックされている場合は、所有者が問題を解決するまで
  インストールできない可能性があります。

## パブリック API リクエストに失敗する

- `429` の再試行ヘッダーに従い、公開リスト／検索レスポンスをキャッシュしてください。
- ユーザーを ClawHub の正規リストへ誘導してください。
- 非表示、非公開、保留中、またはモデレーションでブロックされたコンテンツを、
  パブリック API の範囲外にミラーリングしないでください。

エンドポイントの詳細については、[HTTP API](/clawhub/http-api)を参照してください。

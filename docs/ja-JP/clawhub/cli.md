---
read_when:
    - ClawHub CLI の使用
    - インストール、更新、公開のデバッグ
summary: 'CLI リファレンス: コマンド、フラグ、設定、ロックファイルの動作。'
x-i18n:
    generated_at: "2026-06-28T00:10:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70aabaeae7b205e0ef30de010624e18c471baf214ff5e07ac1db8139fccb1c27
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

CLI パッケージ: `clawhub`、bin: `clawhub`。

npm または pnpm でグローバルにインストールします。

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

次に確認します。

```bash
clawhub --help
clawhub login
clawhub whoami
```

## グローバルフラグ

- `--workdir <dir>`: 作業ディレクトリ (デフォルト: cwd。設定されている場合は Clawdbot ワークスペースにフォールバック)
- `--dir <dir>`: workdir 配下のインストールディレクトリ (デフォルト: `skills`)
- `--site <url>`: ブラウザログイン用のベース URL (デフォルト: `https://clawhub.ai`)
- `--registry <url>`: API ベース URL (デフォルト: 検出されたもの。それ以外は `https://clawhub.ai`)
- `--no-input`: プロンプトを無効化

対応する環境変数:

- `CLAWHUB_SITE` (レガシー `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (レガシー `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (レガシー `CLAWDHUB_WORKDIR`)

### HTTP プロキシ

CLI は、企業プロキシや制限付きネットワークの背後にあるシステム向けに、
標準の HTTP プロキシ環境変数を尊重します。

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

これらの変数のいずれかが設定されている場合、CLI は送信リクエストを
指定されたプロキシ経由でルーティングします。`HTTPS_PROXY` は HTTPS リクエストに、
`HTTP_PROXY` は通常の HTTP に使用されます。`NO_PROXY` / `no_proxy` は、
特定のホストまたはドメインでプロキシをバイパスするために尊重されます。

これは、直接の外向き接続がブロックされているシステムで必要です
(例: Docker コンテナ、プロキシ経由のインターネットのみを持つ Hetzner VPS、企業
ファイアウォール)。

例:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

プロキシ変数が設定されていない場合、動作は変わりません (直接接続)。

## 設定ファイル

API トークンとキャッシュされたレジストリ URL を保存します。

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` または `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- レガシーフォールバック: `clawhub/config.json` がまだ存在せず、`clawdhub/config.json` が存在する場合、CLI はレガシーパスを再利用します
- 上書き: `CLAWHUB_CONFIG_PATH` (レガシー `CLAWDHUB_CONFIG_PATH`)

## コマンド

### `login` / `auth login`

- デフォルト: ブラウザで `<site>/cli/auth` を開き、ループバックコールバック経由で完了します。
- ヘッドレス: `clawhub login --token clh_...`
- リモート/ヘッドレスの対話形式: `clawhub login --device` はコードを表示し、`<site>/cli/device` で認可するまで待機します。

### `whoami`

- `/api/v1/whoami` 経由で保存済みトークンを検証します。

### `token`

- 保存済み API トークンを標準出力に出力します。
- ローカルログイントークンを CI シークレット設定コマンドへパイプする場合に便利です。

### `star <skill>` / `unstar <skill>`

- スキルをハイライトに追加/削除します。
- `POST /api/v1/stars/<slug>` と `DELETE /api/v1/stars/<slug>` を呼び出します。
- `--yes` は確認をスキップします。

### `search <query...>`

- `/api/v1/search?q=...` を呼び出します。
- 出力には、スキルのスラッグ、所有者ハンドル、表示名、関連度スコアが含まれます。
- 検索では、ダウンロード人気度より前に、スラッグ/名前のトークン完全一致が優先されます。`map` のような単独のスラッグトークンは、`amap` 内の部分文字列よりも `personal-map` に強く一致します。
- 人気度は小さなランキング事前要素であり、上位表示を保証するものではありません。
- スキルが表示されるべきなのに表示されない場合は、メタデータ名を変更する前に、ログインした状態で `clawhub inspect @owner/slug` を実行し、所有者に表示されるモデレーション診断を確認してください。

### `explore`

- `/api/v1/skills?limit=...&sort=createdAt` 経由で最新のスキルを一覧表示します (`createdAt` 降順でソート)。
- フラグ:
  - `--limit <n>` (1-200、デフォルト: 25)
  - `--sort newest|updated|rating|downloads|trending` (デフォルト: newest)。互換性のため、レガシーインストールのソートエイリアスも引き続き動作します。
  - `--json` (機械可読出力)
- 出力: `<slug>  v<version>  <age>  <summary>` (summary は 50 文字に切り詰め)。

### `inspect @owner/slug`

- インストールせずにスキルのメタデータとバージョンファイルを取得します。
- `--version <version>`: 特定のバージョンを調査します (デフォルト: 最新)。
- `--tag <tag>`: タグ付きバージョンを調査します (例: `latest`)。
- `--versions`: バージョン履歴を一覧表示します (最初のページ)。
- `--limit <n>`: 一覧表示する最大バージョン数 (1-200)。
- `--files`: 選択したバージョンのファイルを一覧表示します。
- `--file <path>`: 生のファイル内容を取得します (テキストファイルのみ、200KB 制限)。
- `--json`: 機械可読出力。

### `install @owner/slug`

- 指定された所有者とスキルの最新バージョンを解決します。
- `/api/v1/download` 経由で zip をダウンロードします。
- `<workdir>/<dir>/<slug>` に展開します。
- ピン留めされたスキルの上書きを拒否します。先に `clawhub unpin <skill>` を実行してください。
- 書き込み先:
  - `<workdir>/.clawhub/lock.json` (レガシー `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (レガシー `.clawdhub`)

### `uninstall <skill>`

- `<workdir>/<dir>/<slug>` を削除し、lockfile エントリを削除します。
- ログイン中は、現在のインストール数を無効化できるように
  ベストエフォートでテレメトリを送信します。
- 対話形式: 確認を求めます。
- 非対話形式 (`--no-input`): `--yes` が必要です。

### `list`

- `<workdir>/.clawhub/lock.json` (レガシー `.clawdhub`) を読み取ります。
- `clawhub pin` で固定されたスキルの横に、任意の理由を含めて `pinned` を表示します。

### `pin <skill>`

- インストール済みスキルを lockfile 内でピン留め済みとしてマークします。
- `--reason <text>` は、スキルが固定されている理由を記録します。
- ピン留めされたスキルは `update --all` でスキップされ、直接の `update <skill>` では拒否されます。
- ピン留めされたスキルは、ローカルのバイト列が誤って置き換えられないように `install --force` も拒否します。

### `unpin <skill>`

- インストール済みスキルから lockfile のピン留めを削除し、以後の更新で変更できるようにします。

### `update [@owner/slug]` / `update --all`

- ローカルファイルからフィンガープリントを計算します。
- フィンガープリントが既知のバージョンと一致する場合: プロンプトは表示されません。
- フィンガープリントが一致しない場合:
  - デフォルトでは拒否します
  - `--force` で上書きします (対話形式の場合はプロンプト)
- ピン留めされたスキルは `--force` でも更新されません。
- `update <skill>` はピン留めされたスキルに対して即座に失敗し、先に `clawhub unpin <skill>` を実行するように伝えます。
- `update --all` はピン留めされたスラッグをスキップし、何が固定されたままかの概要を出力します。

### `skill publish <path>`

- ローカルバンドルのフィンガープリントを ClawHub と比較し、
  内容がすでに公開済みの場合は正常終了します。
- 新しいスキルのデフォルトは `1.0.0` です。変更されたスキルのデフォルトは次のパッチ
  バージョンです。
- `--version <version>` はバージョンを明示的に選択し、内容が既存バージョンと一致していても
  公開します。
- `--dry-run` はアップロードせずに公開を解決します。`--json` は
  機械可読の結果を出力します。
- `--owner <handle>` は、実行者にパブリッシャーアクセスがある場合に、
  組織/ユーザーのパブリッシャーハンドル配下で公開します。
- `--migrate-owner` は、新しい
  バージョンを公開しながら既存のスキルを `--owner` に移動します。両方のパブリッシャーに対する管理者/所有者アクセスが必要です。
- 所有者とレビューの動作は `docs/publishing.md` で説明されています。
- スキルを公開するとは、ClawHub 上で `MIT-0` の下にリリースされることを意味します。
- 公開されたスキルは、帰属表示なしで自由に使用、変更、再配布できます。
- ClawHub は有料スキルやスキル単位の価格設定をサポートしていません。
- レガシーエイリアス: `publish <path>`。

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

ClawHub の再利用可能な
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
ワークフローは、1 つの `skill_path`、または `root` (デフォルト: `skills`) 直下の各スキル
フォルダーに対して `skill publish` を呼び出します。変更のないスキルはスキップされ、
同じ自動パッチバージョン動作を使用します。

トークンなしでプレビューするには `dry_run: true` を設定します。実際の公開には
`clawhub_token` シークレットが必要です。

### `sync`

- 現在の workdir、設定済みのスキルディレクトリ、および任意の
  `--root <dir>` フォルダーをスキャンし、`SKILL.md` または
  `skill.md` を含むローカルスキルフォルダーを探します。
- 各ローカルスキルのフィンガープリントを ClawHub と比較し、新規または
  変更されたスキルのみを公開します。
- 新しいスキルは `1.0.0` として公開されます。変更されたスキルはデフォルトで次のパッチバージョン
  を公開します。より大きな semver ステップで進めるべき更新バッチには `--bump minor|major` を使用します。
- `--dry-run` はアップロードせずに公開計画を表示します。`--json` は
  機械可読の計画を出力します。
- `--all` は、新規または変更されたすべてのスキルをプロンプトなしで公開します。
  `--all` がない場合、対話型ターミナルでは公開するスキルを選択できます。
- `--owner <handle>` は、実行者にパブリッシャーアクセスがある場合に、
  組織/ユーザーのパブリッシャーハンドル配下で公開します。
- `sync` は一方向の公開のみです。インストール、更新、ダウンロード、
  インストール/ダウンロードのテレメトリ報告は行いません。

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- `clawhub login` が必要です。
- `POST /api/v1/skills/-/scan` を通じて ClawHub ClawScan を実行し、その後スキャンが終端状態になるまでポーリングします。
- スキャンは非同期で、完了まで時間がかかる場合があります。キューに入っている間、ターミナルのスピナーは現在の優先スキャン位置と、前にあるスキャン数を表示します。
- 公開済みスキャンには、所有権またはパブリッシャー管理アクセスが必要です。モデレーター/管理者は `clawhub-admin` を通じて同じバックエンドを使用できます。
- `--update` は `--slug` と併用する場合にのみ有効です。成功した公開済みスキャン結果を、選択されたバージョンへ書き戻します。
- `--output <file.zip>` は、`manifest.json`、`clawscan.json`、`skillspector.json`、`static-analysis.json`、`virustotal.json`、`README.md` を含む完全なレポートアーカイブをダウンロードします。
- `--json` は自動化向けに完全なポーリング応答を出力します。
- ローカルパスのスキャンはサポートされなくなりました。新しいバージョンをアップロードしてから、`scan download` を使用して、その送信済みバージョンに保存されたスキャン結果を取得してください。

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- `clawhub login` が必要です。
- 送信済みのスキルまたは Plugin バージョンについて、保存済みのスキャンレポート ZIP をダウンロードします。ClawHub のセキュリティチェックでブロックまたは非表示にされたバージョンも含まれます。
- スキルのダウンロードはスキルスラッグを使用し、デフォルトは `--kind skill` です。
- Plugin のダウンロードはパッケージ名を使用し、`--kind plugin` が必要です。
- 作者が ClawHub によってブロックされた正確な送信済みバージョンを調査できるように、`--version` は必須です。
- `--output <file.zip>` は出力先パスを選択します。

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub は、スキルリポジトリおよびカタログリポジトリ向けに
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/8f98128aab28627477a3858081a13b76cba6f5d6/.github/workflows/skill-publish.yml)
で公式の再利用可能ワークフローを提供しています。

典型的なカタログ設定:

```yaml
name: Skill Publish

on:
  pull_request:
  workflow_dispatch:

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

注記:

- カタログリポジトリでは、`root` のデフォルトは `skills` です。
- 1 つのスキルフォルダーを処理するには `skill_path: skills/review-helper` を渡します。
- `owner` は CLI の `--owner` フラグに対応します。認証済みユーザーとして公開する場合は省略します。
- V1 のスキル公開は `clawhub_token` を使用します。GitHub OIDC の信頼された公開は、今のところパッケージのみです。

### `delete <skill>`

- `--version` なしでは、Skill を論理削除する（所有者、モデレーター、または管理者）。
- `DELETE /api/v1/skills/{slug}` を呼び出す。
- 所有者が開始した論理削除では、スラッグが 30 日間予約される。このコマンドは有効期限を表示する。
- `--version <version>` は、フェイルクローズのバージョン固有ルートを通じて、所有している最新ではない 1 つのバージョンを完全に削除する。
  削除されたバージョンは復元または再公開できない。現在の最新バージョンを削除する前に、置き換えを公開すること。プラットフォームスタッフは、このバージョン限定フローで所有権を迂回しない。
- `--reason <text>` は、Skill 全体の論理削除と監査ログにモデレーションメモを記録する。
- `--note <text>` は `--reason` のエイリアス。
- `--yes` は確認をスキップする。

### `undelete <skill>`

- 非表示の Skill を復元する（所有者、モデレーター、または管理者）。
- バージョンの削除取り消しはない。完全に削除されたバージョンは復元できない。
- `POST /api/v1/skills/{slug}/undelete` を呼び出す。
- `--reason <text>` は、Skill と監査ログにモデレーションメモを記録する。
- `--note <text>` は `--reason` のエイリアス。
- `--yes` は確認をスキップする。

### `hide <skill>`

- Skill を非表示にする（所有者、モデレーター、または管理者）。
- `delete` のエイリアス。

### `unhide <skill>`

- Skill の非表示を解除する（所有者、モデレーター、または管理者）。
- `undelete` のエイリアス。

### `skill rename <skill> <new-name>`

- 所有している Skill の名前を変更し、以前のスラッグをリダイレクトエイリアスとして保持する。
- `POST /api/v1/skills/{slug}/rename` を呼び出す。
- `--yes` は確認をスキップする。

### `skill merge <source> <target>`

- 所有している 1 つの Skill を、所有している別の Skill にマージする。
- ソーススラッグは公開一覧に表示されなくなり、ターゲットへのリダイレクトエイリアスになる。
- `POST /api/v1/skills/{sourceSlug}/merge` を呼び出す。
- `--yes` は確認をスキップする。

### `transfer`

- 所有権移転ワークフロー。
- ユーザーハンドルへの移転では、受信者が承認する保留中のリクエストが作成される。
- org/パブリッシャーハンドルへの移転は、実行者が現在の所有者と移転先パブリッシャーの両方に管理者アクセス権を持つ場合にのみ、即時適用される。
- サブコマンド:
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- エンドポイント:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- `GET /api/v1/packages` と `GET /api/v1/packages/search` を通じて、統合パッケージカタログを閲覧または検索する。
- Plugin およびその他のパッケージファミリー項目にはこれを使用する。トップレベルの `search` は Skill 検索サーフェスのまま。
- フラグ:
  - `--family skill|code-plugin|bundle-plugin`
  - `--official`
  - `--executes-code`
  - `--target <target>`, `--os <os>`, `--arch <arch>`, `--libc <libc>`
  - `--requires-browser`, `--requires-desktop`, `--requires-native-deps`
  - `--requires-external-service`, `--external-service <name>`
  - `--binary <name>`, `--os-permission <name>`
  - `--artifact-kind legacy-zip|npm-pack`
  - `--npm-mirror`
  - `--limit <n>`（1-100、デフォルト: 25）
  - `--json`

例:

```bash
clawhub package explore --family code-plugin
clawhub package explore --family code-plugin --os darwin --requires-desktop
clawhub package explore --family code-plugin --artifact-kind npm-pack
clawhub package explore --npm-mirror
clawhub package explore episodic-claw --family code-plugin
```

### `package inspect <name>`

- インストールせずにパッケージメタデータを取得する。
- Plugin メタデータ、互換性、検証、ソース、バージョン/ファイル調査にはこれを使用する。
- `--version <version>`: 特定のバージョンを調査する（デフォルト: 最新）。
- `--tag <tag>`: タグ付きバージョンを調査する（例: `latest`）。
- `--versions`: バージョン履歴を一覧表示する（最初のページ）。
- `--limit <n>`: 一覧表示する最大バージョン数（1-100）。
- `--files`: 選択したバージョンのファイルを一覧表示する。
- `--file <path>`: 生のファイル内容を取得する（テキストファイルのみ、200KB 制限）。
- `--json`: 機械可読出力。

### `package download <name>`

- `GET /api/v1/packages/{name}/versions/{version}/artifact` を通じてパッケージバージョンを解決する。
- リゾルバーの `downloadUrl` からアーティファクトをダウンロードする。
- すべてのアーティファクトについて ClawHub SHA-256 を検証する。
- ClawPack npm-pack アーティファクトでは、npm `sha512` integrity、npm shasum、および tarball の `package.json` の名前/バージョンも検証する。
- レガシー ZIP バージョンはレガシー ZIP ルートを通じてダウンロードする。
- フラグ:
  - `--version <version>`: 特定のバージョンをダウンロードする。
  - `--tag <tag>`: タグ付きバージョンをダウンロードする（デフォルト: `latest`）。
  - `-o, --output <path>`: 出力ファイルまたはディレクトリ。
  - `--force`: 既存の出力ファイルを上書きする。
  - `--json`: 機械可読出力。

例:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- ローカルアーティファクトの ClawHub SHA-256、npm `sha512` integrity、npm shasum を計算する。
- `--package` を指定すると、ClawHub から期待されるメタデータを解決し、ローカルファイルを公開済みアーティファクトメタデータと比較する。
- 直接ダイジェストフラグを指定すると、ネットワーク検索なしで検証する。
- フラグ:
  - `--package <name>`: 期待されるアーティファクトメタデータを解決するパッケージ名。
  - `--version <version>` または `--tag <tag>`: 期待されるパッケージバージョン。
  - `--sha256 <hex>`: 期待される ClawHub SHA-256。
  - `--npm-integrity <sri>`: 期待される npm integrity。
  - `--npm-shasum <sha1>`: 期待される npm shasum。
  - `--json`: 機械可読出力。

例:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- ClawHub CLI に同梱された Plugin Inspector を、ローカル Plugin パッケージフォルダーに対して実行する。
- デフォルトでは、ローカル OpenClaw チェックアウトを探したりインポートしたりせず、オフライン/静的検証を行う。
- 厳格な互換性エラーはゼロ以外で終了する。警告のみの検出結果は表示されるが、ゼロで終了する。
- フラグ:
  - `--out <dir>`: Plugin Inspector レポートをこのディレクトリに書き込む。
  - `--openclaw <path>`: 明示的なローカル OpenClaw チェックアウトに対して調査する。
  - `--runtime`: ランタイムキャプチャを有効にする。Plugin コードをインポートする。
  - `--allow-execute`: 分離されたワークスペースでランタイムキャプチャを許可する。
  - `--no-mock-sdk`: ランタイムキャプチャ中のモック OpenClaw SDK を無効にする。
  - `--json`: 機械可読出力。

例:

```bash
clawhub package validate ./example-plugin
```

検証でパッケージ、マニフェスト、SDK インポート、またはアーティファクトの検出結果が報告された場合は、[Plugin 検証の修正](/ja-JP/clawhub/plugin-validation-fixes)を参照してから、コマンドを再実行する。

### `package delete <name>`

- `--version` なしでは、パッケージとすべてのリリースを論理削除する。
- `--version <version>` は、フェイルクローズのバージョン固有ルートを通じて、所有している最新ではない 1 つのリリースを完全に削除する。
  削除されたバージョンは復元または再公開できない。現在の最新バージョンを削除する前に、置き換えを公開すること。このバージョン限定フローには、パッケージ所有者または org パブリッシャー管理者が必要であり、プラットフォームスタッフはパッケージ所有権を迂回しない。
- パッケージ全体の論理削除には、パッケージ所有者、org パブリッシャー所有者/管理者、プラットフォームモデレーター、またはプラットフォーム管理者が必要。
- フラグ:
  - `--version <version>`: 最新ではない 1 つのバージョンを完全に削除する。
  - `--yes`: 確認をスキップする。
  - `--json`: 機械可読出力。

例:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- 論理削除されたパッケージとリリースを復元する。
- バージョンの削除取り消しはない。完全に削除されたバージョンは復元できない。
- パッケージ所有者、org パブリッシャー所有者/管理者、プラットフォームモデレーター、またはプラットフォーム管理者が必要。
- `POST /api/v1/packages/{name}/undelete` を呼び出す。
- フラグ:
  - `--yes`: 確認をスキップする。
  - `--json`: 機械可読出力。

例:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- パッケージを別のパブリッシャーへ移転する。
- プラットフォーム管理者が実行する場合を除き、現在のパッケージ所有者と移転先パブリッシャーの両方に管理者アクセス権が必要。
- スコープ付きパッケージ名は、一致するスコープ所有者に移転する必要がある。
- `POST /api/v1/packages/{name}/transfer` を呼び出す。
- フラグ:
  - `--to <owner>`: 移転先パブリッシャーハンドル。
  - `--reason <text>`: 任意の監査理由。
  - `--json`: 機械可読出力。

例:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- パッケージをモデレーターに報告するための認証済みコマンド。
- `POST /api/v1/packages/{name}/report` を呼び出す。
- 報告はパッケージレベルで、任意でバージョンに紐づけられ、レビューのためにモデレーターに表示される。
- 報告だけでパッケージが自動的に非表示になったり、ダウンロードがブロックされたりすることはない。
- フラグ:
  - `--version <version>`: 報告に添付する任意のパッケージバージョン。
  - `--reason <text>`: 必須の報告理由。
  - `--json`: 機械可読出力。

例:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- パッケージのモデレーション表示状態を確認するための所有者コマンド。
- `GET /api/v1/packages/{name}/moderation` を呼び出す。
- 現在のパッケージスキャン状態、未解決報告数、最新リリースの手動モデレーション状態、ダウンロードブロック状態、モデレーション理由を表示する。
- フラグ:
  - `--json`: 機械可読出力。

例:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- パッケージが将来の OpenClaw 利用に対応できる状態かどうかを確認する。
- `GET /api/v1/packages/{name}/readiness` を呼び出す。
- 公式ステータス、ClawPack の利用可否、アーティファクトダイジェスト、ソース由来、OpenClaw 互換性、ホストターゲット、環境メタデータ、スキャン状態に関するブロッカーを報告する。
- フラグ:
  - `--json`: 機械可読出力。

例:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- バンドルされた OpenClaw Plugin を置き換える可能性があるパッケージについて、オペレーター向けの移行状態を表示する。
- `package readiness` と同じ計算済み readiness エンドポイントを呼び出すが、移行に焦点を当てた状態、最新バージョン、公式パッケージ状態、チェック、ブロッカーを表示する。
- フラグ:
  - `--json`: 機械可読出力。

例:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- 認証済みユーザーが所有する org パブリッシャーを作成する。
- ハンドルは小文字に正規化され、`@` 付きでもなしでも渡せる。
- 新しく作成された org パブリッシャーは、デフォルトでは信頼済み/公式ではない。
- ハンドルが既存のパブリッシャー、ユーザー、または予約済みルートですでに使用されている場合は失敗する。

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- `POST /api/v1/packages` を介してコード Plugin またはバンドル Plugin を公開します。
- `<source>` は以下を受け付けます:
  - ローカルフォルダーパス: `./my-plugin`
  - ローカル ClawPack npm-pack tarball: `./my-plugin-1.2.3.tgz`
  - GitHub リポジトリ: `owner/repo` または `owner/repo@ref`
  - GitHub URL: `https://github.com/owner/repo`
- メタデータは、`package.json`、`openclaw.plugin.json`、および
  `.codex-plugin/plugin.json`、`.claude-plugin/plugin.json`、`.cursor-plugin/plugin.json` などの
  実際の OpenClaw バンドルマーカーから自動検出されます。
- `.tgz` ソースは ClawPack として扱われます。CLI は正確な npm-pack
  バイト列をアップロードし、抽出された `package/` の内容は検証と
  メタデータの事前入力にのみ使用します。
- コード Plugin フォルダーは、アップロード前に ClawPack npm tarball にパックされるため、
  OpenClaw インストールは正確なアーティファクトを検証できます。バンドル Plugin フォルダーは引き続き
  抽出ファイルの公開パスを使用します。
- GitHub ソースでは、ソース帰属がリポジトリ、解決済みコミット、ref、サブパスから自動入力されます。
- ローカルフォルダーでは、origin remote が GitHub を指している場合、ソース帰属がローカル git から自動検出されます。
- 外部コード Plugin は、`openclaw.compat.pluginApi` と
  `openclaw.build.openclawVersion` を明示的に宣言する必要があります。
  トップレベルの `package.json.version` は、公開検証のフォールバックとして使用されません。
- `--dry-run` は、アップロードせずに解決済みの公開ペイロードをプレビューします。
- `--json` は CI 向けに機械可読出力を出力します。
- `--owner <handle>` は、アクターに公開者アクセス権がある場合、ユーザーまたは組織の公開者ハンドルの下で公開します。
- スコープ付きパッケージ名は、選択した所有者と一致する必要があります。`docs/publishing.md` を参照してください。
- 既存のフラグ（`--family`、`--name`、`--version`、`--source-repo`、`--source-commit`、`--source-ref`、`--source-path`）は、引き続きオーバーライドとして機能します。
- 非公開 GitHub リポジトリには `GITHUB_TOKEN` が必要です。

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### 推奨ローカルフロー

ライブリリースを作成する前に、解決済みのパッケージメタデータと
ソース帰属を確認できるよう、まず `--dry-run` を使用します:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### ローカルフォルダーフロー

コード Plugin では、フォルダー公開により、パッケージフォルダーから ClawPack アーティファクトがビルドされてアップロードされます:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` 用の最小 `package.json`

外部コード Plugin には、`package.json` 内に少量の OpenClaw メタデータが必要です。
この最小マニフェストで正常な公開には十分です:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2"
    }
  }
}
```

必須フィールド:

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

注:

- `package.json.version` はパッケージのリリースバージョンですが、
  OpenClaw の互換性/ビルド検証のフォールバックとしては使用されません。
- `openclaw.hostTargets` と `openclaw.environment` は任意のメタデータです。
  ClawHub は存在する場合にそれらを表示することがありますが、公開には必須ではありません。
- `openclaw.compat.minGatewayVersion` と
  `openclaw.build.pluginSdkVersion` は、より詳細な互換性メタデータを公開したい場合の任意の追加項目です。
- 古い `clawhub` CLI リリースを使用している場合は、公開前にアップグレードして、
  ローカルの事前チェックがアップロード前に実行されるようにしてください。
- 検証で修復コードが報告された場合は、
  [Plugin 検証修正](/ja-JP/clawhub/plugin-validation-fixes) を参照してください。

#### GitHub Actions

ClawHub は、Plugin リポジトリ向けに
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/8f98128aab28627477a3858081a13b76cba6f5d6/.github/workflows/package-publish.yml)
の公式再利用可能ワークフローも提供しています。

一般的な呼び出し元設定:

```yaml
name: Package Publish

on:
  pull_request:
  workflow_dispatch:
  push:
    tags:
      - "v*"

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch' || startsWith(github.ref, 'refs/tags/')
    permissions:
      contents: read
      id-token: write
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

注:

- 再利用可能ワークフローは、デフォルトで `source` を呼び出し元リポジトリに設定します。
- モノレポでは、ワークフローが Plugin
  パッケージフォルダーを公開するように `source_path` を渡します。例: `source_path: extensions/codex`。
- 再利用可能ワークフローは、安定版タグまたは完全なコミット SHA に固定してください。`@main` からリリース公開を実行しないでください。
- `pull_request` では、CI に影響を残さないよう `dry_run: true` を使用してください。
- 実際の公開は、`workflow_dispatch` やタグプッシュなどの信頼済みイベントに限定する必要があります。
- シークレットなしの信頼済み公開は `workflow_dispatch` でのみ機能します。タグプッシュには引き続き `clawhub_token` が必要です。
- 初回公開、信頼されていないパッケージ、または緊急公開に備えて、`clawhub_token` を利用可能にしておいてください。
- ワークフローは JSON 結果をアーティファクトとしてアップロードし、ワークフロー出力として公開します。

### `package trusted-publisher get <name>`

- パッケージの GitHub Actions 信頼済み公開者設定を表示します。
- 設定後にこれを使用して、リポジトリ、ワークフローファイル名、
  および任意の環境固定を確認します。
- フラグ:
  - `--json`: 機械可読出力。

例:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- 既存のパッケージに GitHub Actions 信頼済み公開者設定を関連付けるか、置き換えます。
- パッケージは、通常の手動またはトークン認証済み
  `clawhub package publish` によって先に作成されている必要があります。
- 設定後、将来サポート対象の GitHub Actions 公開では、
  長期有効な ClawHub トークンなしで OIDC/信頼済み公開を使用できます。
- `--repository <repo>` は `owner/repo` である必要があります。
- `--workflow-filename <file>` は
  `.github/workflows/` 内のワークフローファイル名と一致する必要があります。
- `--environment <name>` は任意です。設定されている場合、OIDC クレーム内の GitHub Actions
  environment は完全に一致する必要があります。
- ClawHub は、このコマンドの実行時に設定済みの GitHub リポジトリを検証します。
  公開リポジトリは公開 GitHub メタデータを通じて検証できます。非公開
  リポジトリでは、ClawHub がそのリポジトリへの GitHub アクセス権を持つ必要があります。たとえば、
  将来の ClawHub GitHub App インストールや、別の認可済み
  GitHub 統合を通じて実現します。
- フラグ:
  - `--repository <repo>`: GitHub リポジトリ。例: `openclaw/example-plugin`。
  - `--workflow-filename <file>`: ワークフローファイル名。例: `package-publish.yml`。
  - `--environment <name>`: 任意の完全一致 GitHub Actions environment。
  - `--json`: 機械可読出力。

例:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- パッケージから信頼済み公開者設定を削除します。
- ワークフロー、リポジトリ、または環境固定を
  無効化または再作成する必要がある場合のロールバックとして使用します。
- 将来の実際の公開は、設定が再度行われるまで通常の認証済み公開を使用する必要があります。
- フラグ:
  - `--json`: 機械可読出力。

例:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### インストールテレメトリ

- ログイン中に `clawhub install <slug>` の後で送信されます。ただし
  `CLAWHUB_DISABLE_TELEMETRY=1` が設定されている場合を除きます。
- レポートはベストエフォートです。テレメトリが利用できなくても、インストールコマンドは失敗しません。
- 詳細: `docs/telemetry.md`。

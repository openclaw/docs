---
read_when:
    - ClawHub CLI の使用
    - インストール、更新、公開のデバッグ
summary: 'CLI リファレンス: コマンド、フラグ、設定、lockfile の動作。'
x-i18n:
    generated_at: "2026-07-02T17:29:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 57fee67174cf491721e8479a48a11b66e23260ce4899d2ee5437add05880748e
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
- `--registry <url>`: API ベース URL (デフォルト: 検出値、それ以外は `https://clawhub.ai`)
- `--no-input`: プロンプトを無効化

環境変数の対応:

- `CLAWHUB_SITE` (レガシー `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (レガシー `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (レガシー `CLAWDHUB_WORKDIR`)

### HTTP プロキシ

CLI は、企業プロキシや制限されたネットワークの背後にあるシステム向けに、標準の HTTP プロキシ環境変数を尊重します。

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

これらの変数のいずれかが設定されている場合、CLI は送信リクエストを指定されたプロキシ経由でルーティングします。`HTTPS_PROXY` は HTTPS リクエストに、`HTTP_PROXY` は通常の HTTP に使用されます。`NO_PROXY` / `no_proxy` は、特定のホストまたはドメインでプロキシをバイパスするために尊重されます。

これは、直接の送信接続がブロックされているシステム (例: Docker コンテナ、プロキシ経由のみのインターネットを持つ Hetzner VPS、企業ファイアウォール) で必要です。

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

- デフォルト: ブラウザで `<site>/cli/auth` を開き、ループバックコールバックで完了します。
- ヘッドレス: `clawhub login --token clh_...`
- リモート/ヘッドレス対話型: `clawhub login --device` はコードを出力し、`<site>/cli/device` で認可する間待機します。

### `whoami`

- `/api/v1/whoami` 経由で保存済みトークンを検証します。

### `token`

- 保存済み API トークンを stdout に出力します。
- ローカルログイントークンを CI シークレット設定コマンドへパイプする場合に便利です。

### `star <skill>` / `unstar <skill>`

- ハイライトにスキルを追加/削除します。
- `POST /api/v1/stars/<slug>` と `DELETE /api/v1/stars/<slug>` を呼び出します。
- `--yes` は確認をスキップします。

### `search <query...>`

- `/api/v1/search?q=...` を呼び出します。
- 出力には、スキルの slug、所有者ハンドル、表示名、関連度スコアが含まれます。
- 検索では、ダウンロード人気度よりも先に、slug/name トークンの完全一致が優先されます。`map` のような単独の slug トークンは、`amap` 内の部分文字列よりも `personal-map` に強く一致します。
- 人気度は小さなランキング事前要素であり、最上位掲載を保証するものではありません。
- 表示されるべきスキルが表示されない場合は、メタデータ名を変更する前に、ログインした状態で `clawhub inspect @owner/slug` を実行し、所有者に見えるモデレーション診断を確認してください。

### `explore`

- `/api/v1/skills?limit=...&sort=createdAt` 経由で最新のスキルを一覧表示します (`createdAt` desc でソート)。
- フラグ:
  - `--limit <n>` (1-200、デフォルト: 25)
  - `--sort newest|updated|rating|downloads|trending` (デフォルト: newest)。レガシーのインストールソートエイリアスも互換性のため引き続き動作します。
  - `--json` (機械可読出力)
- 出力: `<slug>  v<version>  <age>  <summary>` (summary は 50 文字に切り詰められます)。

### `inspect @owner/slug`

- インストールせずにスキルメタデータとバージョンファイルを取得します。
- `--version <version>`: 特定のバージョンを調査します (デフォルト: latest)。
- `--tag <tag>`: タグ付きバージョンを調査します (例: `latest`)。
- `--versions`: バージョン履歴を一覧表示します (最初のページ)。
- `--limit <n>`: 一覧表示する最大バージョン数 (1-200)。
- `--files`: 選択したバージョンのファイルを一覧表示します。
- `--file <path>`: raw ファイル内容を取得します (テキストファイルのみ、200KB 制限)。
- `--json`: 機械可読出力。

### `install @owner/slug`

- 指定された所有者とスキルの最新バージョンを解決します。
- `/api/v1/download` 経由で zip をダウンロードします。
- `<workdir>/<dir>/<slug>` に展開します。
- pinned されたスキルの上書きを拒否します。先に `clawhub unpin <skill>` を実行してください。
- 書き込み先:
  - `<workdir>/.clawhub/lock.json` (レガシー `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (レガシー `.clawdhub`)

### `uninstall <skill>`

- `<workdir>/<dir>/<slug>` を削除し、lockfile エントリを削除します。
- ログイン中は、現在のインストール数を無効化できるようベストエフォートのテレメトリを送信します。
- 対話型: 確認を求めます。
- 非対話型 (`--no-input`): `--yes` が必要です。

### `list`

- `<workdir>/.clawhub/lock.json` (レガシー `.clawdhub`) を読み取ります。
- `clawhub pin` で固定されたスキルの横に、任意の理由も含めて `pinned` を表示します。

### `pin <skill>`

- インストール済みスキルを lockfile 内で pinned としてマークします。
- `--reason <text>` はスキルが固定されている理由を記録します。
- pinned されたスキルは `update --all` でスキップされ、直接の `update <skill>` では拒否されます。
- pinned されたスキルは `install --force` も拒否するため、ローカルのバイト列が誤って置き換えられることはありません。

### `unpin <skill>`

- インストール済みスキルから lockfile の pin を削除し、今後の更新で変更できるようにします。

### `update [@owner/slug]` / `update --all`

- ローカルファイルから fingerprint を計算します。
- fingerprint が既知のバージョンと一致する場合: プロンプトはありません。
- fingerprint が一致しない場合:
  - デフォルトでは拒否します
  - `--force` で上書きします (対話型の場合はプロンプト)
- pinned されたスキルは `--force` でも更新されません。
- `update <skill>` は pinned されたスキルでは即座に失敗し、先に `clawhub unpin <skill>` を実行するよう伝えます。
- `update --all` は pinned された slug をスキップし、固定されたままの内容の概要を出力します。

### `skill publish <path>`

- ローカルバンドルの fingerprint を ClawHub と比較し、内容がすでに公開済みの場合は正常終了します。
- 新しいスキルのデフォルトは `1.0.0` です。変更済みスキルのデフォルトは次のパッチバージョンです。
- `--version <version>` はバージョンを明示的に選択し、内容が既存バージョンと一致している場合でも公開します。
- `--dry-run` はアップロードせずに公開を解決します。`--json` は機械可読の結果を出力します。
- `--owner <handle>` は、アクターに publisher アクセスがある場合、org/user publisher ハンドル配下で公開します。
- `--migrate-owner` は、新しいバージョンを公開しながら既存のスキルを `--owner` に移動します。両方の publisher で admin/owner アクセスが必要です。
- 所有者とレビューの動作は `docs/publishing.md` で説明されています。
- スキルを公開することは、ClawHub 上で `MIT-0` の下にリリースされることを意味します。
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
ワークフローは、1 つの `skill_path`、または `root` 配下 (デフォルト: `skills`) の直下にある各スキルフォルダに対して `skill publish` を呼び出します。変更されていないスキルはスキップされ、同じ自動パッチバージョン動作が使用されます。

トークンなしでプレビューするには `dry_run: true` を設定します。実際の公開には `clawhub_token` シークレットが必要です。

### `sync`

- 現在の workdir、設定された skills ディレクトリ、および `--root <dir>` フォルダをスキャンし、`SKILL.md` または `skill.md` を含むローカルスキルフォルダを探します。
- 各ローカルスキルの fingerprint を ClawHub と比較し、新規または変更済みのスキルのみを公開します。
- 新しいスキルは `1.0.0` として公開されます。変更済みスキルはデフォルトで次のパッチバージョンを公開します。より大きな semver ステップに移動すべき更新バッチには `--bump minor|major` を使用します。
- `--dry-run` はアップロードせずに公開計画を表示します。`--json` は機械可読の計画を出力します。
- `--all` は、プロンプトなしで新規または変更済みのすべてのスキルを公開します。`--all` がない場合、対話型ターミナルでは公開するスキルを選択できます。
- `--owner <handle>` は、アクターに publisher アクセスがある場合、org/user publisher ハンドル配下で公開します。
- `sync` は一方向の公開のみです。インストール、更新、ダウンロード、インストール/ダウンロードテレメトリの報告は行いません。

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- `clawhub login` が必要です。
- `POST /api/v1/skills/-/scan` を通じて ClawHub ClawScan を実行し、スキャンが終端状態になるまでポーリングします。
- スキャンは非同期であり、完了まで時間がかかる場合があります。キュー中は、ターミナルスピナーに現在の優先スキャン位置と前方にあるスキャン数が表示されます。
- 公開済みスキャンには、所有権または publisher 管理アクセスが必要です。モデレーター/admin は `clawhub-admin` を通じて同じバックエンドを使用できます。
- `--update` は `--slug` と一緒の場合のみ有効です。成功した公開済みスキャン結果を選択したバージョンへ書き戻します。
- `--output <file.zip>` は、`manifest.json`、`clawscan.json`、`skillspector.json`、`static-analysis.json`、`virustotal.json`、`README.md` を含む完全なレポートアーカイブをダウンロードします。
- `--json` は自動化向けに完全なポーリングレスポンスを出力します。
- ローカルパススキャンはサポートされなくなりました。新しいバージョンをアップロードしてから、`scan download` を使用して、その送信済みバージョンの保存済みスキャン結果を取得してください。

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- `clawhub login` が必要です。
- ClawHub セキュリティチェックでブロックまたは非表示にされたバージョンを含め、送信済みのスキルまたは Plugin バージョンの保存済みスキャンレポート ZIP をダウンロードします。
- スキルのダウンロードはスキル slug を使用し、デフォルトは `--kind skill` です。
- Plugin のダウンロードはパッケージ名を使用し、`--kind plugin` が必要です。
- ClawHub がブロックした正確な送信済みバージョンを作者が調査できるように、`--version` が必要です。
- `--output <file.zip>` は宛先パスを選択します。

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub は、スキルリポジトリとカタログリポジトリ向けに、公式の再利用可能なワークフローを
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/a89bfaf61d1bb5e0bfa7a92cf35b76c7e404e1ca/.github/workflows/skill-publish.yml)
で提供しています。

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

- `root` はカタログリポジトリではデフォルトで `skills` です。
- 1 つのスキルフォルダを処理するには `skill_path: skills/review-helper` を渡します。
- `owner` は CLI の `--owner` フラグに対応します。認証済みユーザーとして公開する場合は省略します。
- V1 スキル公開は `clawhub_token` を使用します。GitHub OIDC 信頼済み公開は現時点ではパッケージ専用です。

### `delete <skill>`

- `--version` なしでは、skill をソフト削除します（owner、moderator、admin）。
- `DELETE /api/v1/skills/{slug}` を呼び出します。
- owner が開始したソフト削除では slug が 30日間予約され、コマンドは有効期限時刻を出力します。
- `--version <version>` は、fail-closed なバージョン固有ルートを通じて、所有している latest ではない 1つのバージョンを完全に削除します。
  削除されたバージョンは復元も再公開もできません。現在の latest バージョンを削除する前に、代替を公開してください。platform staff は、このバージョン専用フローで所有権をバイパスしません。
- `--reason <text>` は、skill 全体のソフト削除と監査ログに moderation note を記録します。
- `--note <text>` は `--reason` のエイリアスです。
- `--yes` は確認をスキップします。

### `undelete <skill>`

- 非表示の skill を復元します（owner、moderator、admin）。
- バージョンの undelete はありません。完全に削除されたバージョンは復元できません。
- `POST /api/v1/skills/{slug}/undelete` を呼び出します。
- `--reason <text>` は、skill と監査ログに moderation note を記録します。
- `--note <text>` は `--reason` のエイリアスです。
- `--yes` は確認をスキップします。

### `hide <skill>`

- skill を非表示にします（owner、moderator、admin）。
- `delete` のエイリアスです。

### `unhide <skill>`

- skill の非表示を解除します（owner、moderator、admin）。
- `undelete` のエイリアスです。

### `skill rename <skill> <new-name>`

- 所有している skill の名前を変更し、以前の slug をリダイレクトエイリアスとして保持します。
- `POST /api/v1/skills/{slug}/rename` を呼び出します。
- `--yes` は確認をスキップします。

### `skill merge <source> <target>`

- 所有している skill を、所有している別の skill にマージします。
- source slug は公開一覧への表示を停止し、target へのリダイレクトエイリアスになります。
- `POST /api/v1/skills/{sourceSlug}/merge` を呼び出します。
- `--yes` は確認をスキップします。

### `transfer`

- 所有権移譲ワークフローです。
- user handle への移譲では、受信者が承認する保留中リクエストが作成されます。
- org/publisher handle への移譲は、actor が現在の owner と移譲先 publisher の両方に admin access を持つ場合にのみ即時適用されます。
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

- `GET /api/v1/packages` と `GET /api/v1/packages/search` を通じて、統合 package catalog を閲覧または検索します。
- plugins とその他の package-family エントリにはこれを使用してください。トップレベルの `search` は引き続き skill 検索サーフェスです。
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

- インストールせずに package metadata を取得します。
- plugin metadata、互換性、検証、source、version/file inspection にはこれを使用してください。
- `--version <version>`: 特定のバージョンを inspect します（デフォルト: latest）。
- `--tag <tag>`: tag 付きバージョンを inspect します（例: `latest`）。
- `--versions`: バージョン履歴を一覧表示します（最初のページ）。
- `--limit <n>`: 一覧表示する最大バージョン数（1-100）。
- `--files`: 選択したバージョンのファイルを一覧表示します。
- `--file <path>`: raw file content を取得します（text files のみ、200KB 上限）。
- `--json`: machine-readable output。

### `package download <name>`

- `GET /api/v1/packages/{name}/versions/{version}/artifact` を通じて package version を解決します。
- resolver の `downloadUrl` から artifact をダウンロードします。
- すべての artifacts について ClawHub SHA-256 を検証します。
- ClawPack npm-pack artifacts では、npm `sha512` integrity、npm shasum、tarball の `package.json` name/version も検証します。
- Legacy ZIP バージョンは legacy ZIP route を通じてダウンロードします。
- フラグ:
  - `--version <version>`: 特定のバージョンをダウンロードします。
  - `--tag <tag>`: tag 付きバージョンをダウンロードします（デフォルト: `latest`）。
  - `-o, --output <path>`: 出力ファイルまたはディレクトリ。
  - `--force`: 既存の出力ファイルを上書きします。
  - `--json`: machine-readable output。

例:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- ローカル artifact について ClawHub SHA-256、npm `sha512` integrity、npm shasum を計算します。
- `--package` を指定すると、ClawHub から expected metadata を解決し、ローカルファイルを公開済み artifact metadata と比較します。
- direct digest flags を指定すると、network lookup なしで検証します。
- フラグ:
  - `--package <name>`: expected artifact metadata を解決する package name。
  - `--version <version>` または `--tag <tag>`: expected package version。
  - `--sha256 <hex>`: expected ClawHub SHA-256。
  - `--npm-integrity <sri>`: expected npm integrity。
  - `--npm-shasum <sha1>`: expected npm shasum。
  - `--json`: machine-readable output。

例:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- ClawHub CLI に同梱された Plugin Inspector を、ローカル plugin package folder に対して実行します。
- デフォルトでは、ローカル OpenClaw checkout を検索または import せずに、offline/static validation を行います。
- hard compatibility errors は non-zero で終了します。warning-only findings は出力されますが、zero で終了します。
- フラグ:
  - `--out <dir>`: Plugin Inspector reports をこのディレクトリに書き込みます。
  - `--openclaw <path>`: 明示的なローカル OpenClaw checkout に対して inspect します。
  - `--runtime`: runtime capture を有効にします。plugin code を import します。
  - `--allow-execute`: isolated workspace で runtime capture を許可します。
  - `--no-mock-sdk`: runtime capture 中の mocked OpenClaw SDK を無効にします。
  - `--json`: machine-readable output。

例:

```bash
clawhub package validate ./example-plugin
```

validation が package、manifest、SDK import、artifact の finding を報告した場合は、
[Plugin validation fixes](/clawhub/plugin-validation-fixes) を参照してから、コマンドを再実行してください。

### `package delete <name>`

- `--version` なしでは、package とすべての releases をソフト削除します。
- `--version <version>` は、fail-closed なバージョン固有ルートを通じて、所有している latest ではない 1つの release を完全に削除します。
  削除されたバージョンは復元も再公開もできません。現在の latest バージョンを削除する前に、代替を公開してください。このバージョン専用フローには package owner または org publisher admin が必要です。platform staff は package ownership をバイパスしません。
- whole-package soft-delete には package owner、org publisher owner/admin、platform moderator、または platform admin が必要です。
- フラグ:
  - `--version <version>`: latest ではない 1つのバージョンを完全に削除します。
  - `--yes`: 確認をスキップします。
  - `--json`: machine-readable output。

例:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- ソフト削除された package と releases を復元します。
- バージョンの undelete はありません。完全に削除されたバージョンは復元できません。
- package owner、org publisher owner/admin、platform moderator、または platform admin が必要です。
- `POST /api/v1/packages/{name}/undelete` を呼び出します。
- フラグ:
  - `--yes`: 確認をスキップします。
  - `--json`: machine-readable output。

例:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- package を別の publisher に移譲します。
- platform admin によって実行される場合を除き、現在の package owner と移譲先 publisher の両方に対する admin access が必要です。
- scoped package names は、一致する scope owner に移譲する必要があります。
- `POST /api/v1/packages/{name}/transfer` を呼び出します。
- フラグ:
  - `--to <owner>`: 移譲先 publisher handle。
  - `--reason <text>`: 任意の audit reason。
  - `--json`: machine-readable output。

例:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- package を moderators に報告するための authenticated command です。
- `POST /api/v1/packages/{name}/report` を呼び出します。
- reports は package-level で、任意でバージョンに関連付けられ、moderators がレビューできるようになります。
- reports 自体は packages を自動的に非表示にしたり、downloads をブロックしたりしません。
- フラグ:
  - `--version <version>`: report に添付する任意の package version。
  - `--reason <text>`: 必須の report reason。
  - `--json`: machine-readable output。

例:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- package moderation visibility を確認するための owner command です。
- `GET /api/v1/packages/{name}/moderation` を呼び出します。
- 現在の package scan state、open report count、latest release manual moderation state、download block state、moderation reasons を表示します。
- フラグ:
  - `--json`: machine-readable output。

例:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- package が将来の OpenClaw consumption に対応できる状態かどうかを確認します。
- `GET /api/v1/packages/{name}/readiness` を呼び出します。
- official status、ClawPack availability、artifact digest、source provenance、OpenClaw compatibility、host targets、environment metadata、scan state の blockers を報告します。
- フラグ:
  - `--json`: machine-readable output。

例:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- bundled OpenClaw plugin を置き換える可能性がある package について、operator-oriented migration status を表示します。
- `package readiness` と同じ computed readiness endpoint を呼び出しますが、migration-focused status、latest version、official-package state、checks、blockers を出力します。
- フラグ:
  - `--json`: machine-readable output。

例:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- authenticated user が所有する org publisher を作成します。
- handle は lowercase に正規化され、`@` ありでもなしでも渡せます。
- 新しく作成された org publishers は、デフォルトでは trusted/official ではありません。
- handle が既存の publisher、user、または reserved route にすでに使われている場合は失敗します。

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- `POST /api/v1/packages` 経由でコードPluginまたはバンドルPluginを公開します。
- `<source>` には以下を指定できます:
  - ローカルフォルダーパス: `./my-plugin`
  - ローカル ClawPack npm-pack tarball: `./my-plugin-1.2.3.tgz`
  - GitHub リポジトリ: `owner/repo` または `owner/repo@ref`
  - GitHub URL: `https://github.com/owner/repo`
- メタデータは `package.json`、`openclaw.plugin.json`、および
  `.codex-plugin/plugin.json`、`.claude-plugin/plugin.json`、`.cursor-plugin/plugin.json`
  などの実際の OpenClaw バンドルマーカーから自動検出されます。
- `.tgz` ソースは ClawPack として扱われます。CLI は正確な npm-pack
  バイト列をアップロードし、展開された `package/` の内容は検証と
  メタデータの事前入力にのみ使用します。
- コードPluginフォルダーはアップロード前に ClawPack npm tarball にパックされるため、
  OpenClaw のインストールは正確なアーティファクトを検証できます。バンドルPluginフォルダーは引き続き
  展開ファイルの公開パスを使用します。
- GitHub ソースでは、ソース帰属はリポジトリ、解決済みコミット、ref、サブパスから自動入力されます。
- ローカルフォルダーでは、origin リモートが GitHub を指している場合、ソース帰属はローカル git から自動検出されます。
- 外部コードPluginは `openclaw.compat.pluginApi` と
  `openclaw.build.openclawVersion` を明示的に宣言する必要があります。
  トップレベルの `package.json.version` は公開検証のフォールバックとして使用されません。
- `--dry-run` はアップロードせずに、解決済みの公開ペイロードをプレビューします。
- `--json` は CI 向けに機械可読な出力を生成します。
- `--owner <handle>` は、アクターがパブリッシャー権限を持つ場合、ユーザーまたは org のパブリッシャーハンドル配下で公開します。
- スコープ付きパッケージ名は選択した所有者と一致する必要があります。`docs/publishing.md` を参照してください。
- 既存のフラグ（`--family`、`--name`、`--version`、`--source-repo`、`--source-commit`、`--source-ref`、`--source-path`）は引き続きオーバーライドとして機能します。
- プライベート GitHub リポジトリには `GITHUB_TOKEN` が必要です。

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### 推奨ローカルフロー

まず `--dry-run` を使用して、ライブリリースを作成する前に、解決済みのパッケージメタデータと
ソース帰属を確認できるようにします:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### ローカルフォルダーフロー

コードPluginでは、フォルダー公開によりパッケージフォルダーから ClawPack アーティファクトがビルドされ、
アップロードされます:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` 用の最小 `package.json`

外部コードPluginでは、`package.json` に少量の OpenClaw メタデータが必要です。
この最小マニフェストで公開に成功するには十分です:

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

注記:

- `package.json.version` はパッケージのリリースバージョンですが、
  OpenClaw の互換性/ビルド検証のフォールバックとしては使用されません。
- `openclaw.hostTargets` と `openclaw.environment` は任意のメタデータです。
  ClawHub は存在する場合にそれらを表示することがありますが、公開には必須ではありません。
- より詳細な互換性メタデータを公開したい場合は、
  `openclaw.compat.minGatewayVersion` と
  `openclaw.build.pluginSdkVersion` を任意の追加項目として使用できます。
- 古い `clawhub` CLI リリースを使用している場合は、アップロード前にローカルの事前チェックが実行されるよう、
  公開前にアップグレードしてください。
- 検証で修復コードが報告された場合は、
  [Plugin検証の修正](/clawhub/plugin-validation-fixes) を参照してください。

#### GitHub Actions

ClawHub は、Plugin リポジトリ向けに公式の再利用可能ワークフローも
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/a89bfaf61d1bb5e0bfa7a92cf35b76c7e404e1ca/.github/workflows/package-publish.yml)
で提供しています。

一般的な呼び出し側の設定:

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

注記:

- 再利用可能ワークフローは、デフォルトで `source` を呼び出し側リポジトリに設定します。
- モノレポでは、ワークフローが Plugin パッケージフォルダーを公開するように `source_path` を渡してください。
  例: `source_path: extensions/codex`。
- 再利用可能ワークフローは安定タグまたは完全なコミット SHA に固定してください。`@main` からリリース公開を実行しないでください。
- `pull_request` では CI を汚染しないように `dry_run: true` を使用してください。
- 実際の公開は、`workflow_dispatch` やタグプッシュなどの信頼されたイベントに限定してください。
- シークレットなしの信頼できる公開は `workflow_dispatch` でのみ機能します。タグプッシュには引き続き `clawhub_token` が必要です。
- 初回公開、信頼されていないパッケージ、または緊急時の公開に備えて、`clawhub_token` を利用可能にしておいてください。
- ワークフローは JSON 結果をアーティファクトとしてアップロードし、ワークフロー出力として公開します。

### `package trusted-publisher get <name>`

- パッケージの GitHub Actions 信頼できるパブリッシャー設定を表示します。
- 設定後にこれを使用して、リポジトリ、ワークフローファイル名、
  および任意の環境固定を確認します。
- フラグ:
  - `--json`: 機械可読な出力。

例:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- 既存のパッケージに GitHub Actions 信頼できるパブリッシャー設定を関連付けるか置き換えます。
- パッケージは、通常の手動またはトークン認証済みの
  `clawhub package publish` を通じて先に作成しておく必要があります。
- 設定後、今後サポートされる GitHub Actions の公開では、
  長期有効な ClawHub トークンなしで OIDC/信頼できる公開を使用できます。
- `--repository <repo>` は `owner/repo` である必要があります。
- `--workflow-filename <file>` は `.github/workflows/` 内のワークフローファイル名と一致する必要があります。
- `--environment <name>` は任意です。設定されている場合、OIDC クレーム内の GitHub Actions
  環境は完全に一致する必要があります。
- ClawHub はこのコマンドの実行時に、設定された GitHub リポジトリを検証します。
  パブリックリポジトリは GitHub の公開メタデータを通じて検証できます。プライベート
  リポジトリでは、たとえば将来の ClawHub GitHub App インストールや、別の認可済み
  GitHub 連携を通じて、ClawHub がそのリポジトリへの GitHub アクセスを持っている必要があります。
- フラグ:
  - `--repository <repo>`: GitHub リポジトリ。例: `openclaw/example-plugin`。
  - `--workflow-filename <file>`: ワークフローファイル名。例: `package-publish.yml`。
  - `--environment <name>`: 任意の完全一致 GitHub Actions 環境。
  - `--json`: 機械可読な出力。

例:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- パッケージから信頼できるパブリッシャー設定を削除します。
- ワークフロー、リポジトリ、または環境固定を無効化または再作成する必要がある場合のロールバックとして使用します。
- 今後の実際の公開は、設定が再度行われるまで通常の認証済み公開を使用する必要があります。
- フラグ:
  - `--json`: 機械可読な出力。

例:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### インストールテレメトリ

- ログイン済みで `CLAWHUB_DISABLE_TELEMETRY=1` が設定されていない場合、
  `clawhub install <slug>` の後に送信されます。
- レポートはベストエフォートです。テレメトリが利用できなくても、インストールコマンドは失敗しません。
- 詳細: `docs/telemetry.md`。

---
read_when:
    - ClawHub CLI の使用
    - インストール、更新、公開のデバッグ
summary: 'CLI リファレンス: コマンド、フラグ、設定、ロックファイルの動作。'
x-i18n:
    generated_at: "2026-06-27T10:46:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05b8bf0da5b68472d0685b75e3942b5f63b10a8f2dcd797ad1cbb662eac12060
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

次に検証します。

```bash
clawhub --help
clawhub login
clawhub whoami
```

## グローバルフラグ

- `--workdir <dir>`: 作業ディレクトリ (デフォルト: cwd; 設定されている場合は Clawdbot ワークスペースにフォールバック)
- `--dir <dir>`: workdir 配下のインストールディレクトリ (デフォルト: `skills`)
- `--site <url>`: ブラウザログイン用のベース URL (デフォルト: `https://clawhub.ai`)
- `--registry <url>`: API ベース URL (デフォルト: 検出されたもの、なければ `https://clawhub.ai`)
- `--no-input`: プロンプトを無効化

対応する環境変数:

- `CLAWHUB_SITE` (レガシー `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (レガシー `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (レガシー `CLAWDHUB_WORKDIR`)

### HTTP プロキシ

CLI は、企業プロキシや制限付きネットワークの背後にあるシステム向けに、標準の HTTP プロキシ環境変数を尊重します。

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

これらの変数のいずれかが設定されている場合、CLI は指定されたプロキシを通して外向きリクエストをルーティングします。`HTTPS_PROXY` は HTTPS リクエストに使用され、`HTTP_PROXY` は通常の HTTP に使用されます。`NO_PROXY` / `no_proxy` は、特定のホストまたはドメインでプロキシをバイパスするために尊重されます。

これは、直接の外向き接続がブロックされているシステム (例: Docker コンテナ、プロキシ経由のみインターネット接続できる Hetzner VPS、企業ファイアウォール) で必要です。

例:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

プロキシ変数が設定されていない場合、挙動は変わりません (直接接続)。

## 設定ファイル

API トークンとキャッシュされたレジストリ URL を保存します。

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` または `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- レガシーフォールバック: `clawhub/config.json` がまだ存在せず、`clawdhub/config.json` が存在する場合、CLI はレガシーパスを再利用します
- オーバーライド: `CLAWHUB_CONFIG_PATH` (レガシー `CLAWDHUB_CONFIG_PATH`)

## コマンド

### `login` / `auth login`

- デフォルト: ブラウザで `<site>/cli/auth` を開き、ループバックコールバックで完了します。
- ヘッドレス: `clawhub login --token clh_...`
- リモート/ヘッドレスの対話型: `clawhub login --device` はコードを出力し、`<site>/cli/device` で認可されるまで待機します。

### `whoami`

- 保存されたトークンを `/api/v1/whoami` 経由で検証します。

### `token`

- 保存された API トークンを stdout に出力します。
- ローカルログイントークンを CI シークレット設定コマンドへパイプする場合に便利です。

### `star <skill>` / `unstar <skill>`

- Skills からハイライトへ追加/削除します。
- `POST /api/v1/stars/<slug>` と `DELETE /api/v1/stars/<slug>` を呼び出します。
- `--yes` は確認をスキップします。

### `search <query...>`

- `/api/v1/search?q=...` を呼び出します。
- 出力には Skills の slug、所有者ハンドル、表示名、関連度スコアが含まれます。
- 検索では、ダウンロード人気度より前に、完全な slug/name トークン一致が優先されます。`map` のような単独の slug トークンは、`amap` 内の部分文字列よりも `personal-map` に強く一致します。
- 人気度は小さなランキング事前確率であり、上位配置を保証するものではありません。
- Skills が表示されるべきなのに表示されない場合は、ログインした状態で `clawhub inspect @owner/slug` を実行し、メタデータ名を変更する前に所有者に表示されるモデレーション診断を確認してください。

### `explore`

- `/api/v1/skills?limit=...&sort=createdAt` 経由で最新の Skills を一覧表示します (`createdAt` の降順でソート)。
- フラグ:
  - `--limit <n>` (1-200、デフォルト: 25)
  - `--sort newest|updated|rating|downloads|trending` (デフォルト: newest)。互換性のため、レガシーのインストールソートエイリアスも引き続き動作します。
  - `--json` (機械可読出力)
- 出力: `<slug>  v<version>  <age>  <summary>` (summary は 50 文字に切り詰められます)。

### `inspect @owner/slug`

- インストールせずに Skills メタデータとバージョンファイルを取得します。
- `--version <version>`: 特定のバージョンを調べます (デフォルト: latest)。
- `--tag <tag>`: タグ付きバージョンを調べます (例: `latest`)。
- `--versions`: バージョン履歴を一覧表示します (最初のページ)。
- `--limit <n>`: 一覧表示する最大バージョン数 (1-200)。
- `--files`: 選択したバージョンのファイルを一覧表示します。
- `--file <path>`: 生のファイル内容を取得します (テキストファイルのみ、200KB 制限)。
- `--json`: 機械可読出力。

### `install @owner/slug`

- 指定された所有者と Skills の最新バージョンを解決します。
- `/api/v1/download` 経由で zip をダウンロードします。
- `<workdir>/<dir>/<slug>` に展開します。
- pin された Skills の上書きを拒否します。先に `clawhub unpin <skill>` を実行してください。
- 書き込み先:
  - `<workdir>/.clawhub/lock.json` (レガシー `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (レガシー `.clawdhub`)

### `uninstall <skill>`

- `<workdir>/<dir>/<slug>` を削除し、ロックファイルのエントリを削除します。
- ログイン中はベストエフォートのテレメトリを送信し、現在のインストール数を非アクティブ化できるようにします。
- 対話型: 確認を求めます。
- 非対話型 (`--no-input`): `--yes` が必要です。

### `list`

- `<workdir>/.clawhub/lock.json` (レガシー `.clawdhub`) を読み取ります。
- `clawhub pin` で固定された Skills の横に、任意の理由を含めて `pinned` を表示します。

### `pin <skill>`

- インストール済みの Skills をロックファイル内で pinned としてマークします。
- `--reason <text>` は Skills が固定されている理由を記録します。
- pinned Skills は `update --all` でスキップされ、直接の `update <skill>` では拒否されます。
- pinned Skills は `install --force` も拒否するため、ローカルのバイト列が誤って置き換えられることはありません。

### `unpin <skill>`

- インストール済みの Skills からロックファイルの pin を削除し、今後の更新で変更できるようにします。

### `update [@owner/slug]` / `update --all`

- ローカルファイルからフィンガープリントを計算します。
- フィンガープリントが既知のバージョンと一致する場合: プロンプトなし。
- フィンガープリントが一致しない場合:
  - デフォルトでは拒否します
  - `--force` で上書きします (対話型の場合はプロンプト)
- pinned Skills は `--force` でも更新されません。
- `update <skill>` は pinned Skills に対して即座に失敗し、先に `clawhub unpin <skill>` を実行するよう伝えます。
- `update --all` は pinned slug をスキップし、固定されたままの内容の概要を出力します。

### `skill publish <path>`

- ローカルバンドルのフィンガープリントを ClawHub と比較し、内容がすでに公開済みの場合は正常終了します。
- 新しい Skills はデフォルトで `1.0.0` になります。変更された Skills はデフォルトで次のパッチバージョンになります。
- `--version <version>` はバージョンを明示的に選択し、内容が既存バージョンと一致する場合でも公開します。
- `--dry-run` はアップロードせずに公開を解決します。`--json` は機械可読な結果を出力します。
- `--owner <handle>` は、実行者が公開者アクセス権を持つ場合に、組織/ユーザー公開者ハンドル配下で公開します。
- `--migrate-owner` は、新しいバージョンを公開しながら既存の Skills を `--owner` へ移動します。両方の公開者に対する admin/owner アクセス権が必要です。
- 所有者とレビューの挙動は `docs/publishing.md` で説明されています。
- Skills を公開するとは、ClawHub 上で `MIT-0` の下にリリースされることを意味します。
- 公開された Skills は、帰属表示なしで自由に使用、変更、再配布できます。
- ClawHub は有料 Skills や Skills ごとの価格設定をサポートしていません。
- レガシーエイリアス: `publish <path>`。

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

ClawHub の再利用可能な
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
ワークフローは、1 つの `skill_path`、または `root` (デフォルト: `skills`) 配下の直下の各 Skills フォルダに対して `skill publish` を呼び出します。変更のない Skills をスキップし、同じ自動パッチバージョン挙動を使用します。

トークンなしでプレビューするには `dry_run: true` を設定します。実際の公開には `clawhub_token` シークレットが必要です。

### `sync`

- 現在の workdir、設定された Skills ディレクトリ、および任意の `--root <dir>` フォルダをスキャンし、`SKILL.md` または `skill.md` を含むローカル Skills フォルダを探します。
- 各ローカル Skills のフィンガープリントを ClawHub と比較し、新規または変更された Skills のみを公開します。
- 新しい Skills は `1.0.0` として公開されます。変更された Skills はデフォルトで次のパッチバージョンを公開します。より大きな semver ステップで進めるべき更新バッチには `--bump minor|major` を使用します。
- `--dry-run` はアップロードせずに公開計画を表示します。`--json` は機械可読な計画を出力します。
- `--all` はプロンプトなしで新規または変更されたすべての Skills を公開します。`--all` がない場合、対話型端末では公開する Skills を選択できます。
- `--owner <handle>` は、実行者が公開者アクセス権を持つ場合に、組織/ユーザー公開者ハンドル配下で公開します。
- `sync` は一方向の公開のみです。インストール、更新、ダウンロード、インストール/ダウンロードテレメトリの報告は行いません。

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- `clawhub login` が必要です。
- `POST /api/v1/skills/-/scan` 経由で ClawHub ClawScan を実行し、その後スキャンが終端状態になるまでポーリングします。
- スキャンは非同期で、完了まで時間がかかる場合があります。キューに入っている間、端末スピナーは現在の優先スキャン位置と前にあるスキャン数を表示します。
- 公開済みスキャンには所有権または公開者管理アクセス権が必要です。モデレーター/admin は `clawhub-admin` 経由で同じバックエンドを使用できます。
- `--update` は `--slug` と一緒の場合のみ有効です。成功した公開済みスキャン結果を選択したバージョンへ書き戻します。
- `--output <file.zip>` は、`manifest.json`、`clawscan.json`、`skillspector.json`、`static-analysis.json`、`virustotal.json`、`README.md` を含む完全なレポートアーカイブをダウンロードします。
- `--json` は自動化用に完全なポーリングレスポンスを出力します。
- ローカルパススキャンはサポートされなくなりました。新しいバージョンをアップロードしてから、`scan download` を使用して、その送信済みバージョンの保存済みスキャン結果を取得してください。

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- `clawhub login` が必要です。
- 送信済みの Skills または Plugin バージョンについて、ClawHub セキュリティチェックでブロックまたは非表示にされたバージョンを含め、保存済みスキャンレポート ZIP をダウンロードします。
- Skills のダウンロードでは Skills slug を使用し、デフォルトは `--kind skill` です。
- Plugin のダウンロードではパッケージ名を使用し、`--kind plugin` が必要です。
- ClawHub がブロックした正確な送信済みバージョンを作成者が調査できるように、`--version` が必要です。
- `--output <file.zip>` は宛先パスを選択します。

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub は、Skills リポジトリとカタログリポジトリ向けに公式の再利用可能ワークフローを
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/6a18bea5764179d5b301dedfdd5d2b488dc4bc83/.github/workflows/skill-publish.yml)
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

- `root` はカタログリポジトリではデフォルトで `skills` になります。
- 1 つの Skills フォルダを処理するには `skill_path: skills/review-helper` を渡します。
- `owner` は CLI の `--owner` フラグに対応します。認証済みユーザーとして公開する場合は省略します。
- V1 Skills 公開では `clawhub_token` を使用します。GitHub OIDC の信頼された公開は、現時点ではパッケージ専用です。

### `delete <skill>`

- `--version` なしでは、スキルをソフト削除します（所有者、モデレーター、または管理者）。
- `DELETE /api/v1/skills/{slug}` を呼び出します。
- 所有者が開始したソフト削除では、slug が 30 日間予約されます。コマンドは有効期限を出力します。
- `--version <version>` は、フェイルクローズなバージョン固有のルートを通じて、所有している最新ではない 1 つのバージョンを完全に削除します。
  削除されたバージョンは復元または再公開できません。現在の最新バージョンを削除する前に、置き換えを公開してください。プラットフォームスタッフは、このバージョン専用フローで所有権をバイパスしません。
- `--reason <text>` は、スキル全体のソフト削除と監査ログにモデレーションメモを記録します。
- `--note <text>` は `--reason` のエイリアスです。
- `--yes` は確認をスキップします。

### `undelete <skill>`

- 非表示のスキルを復元します（所有者、モデレーター、または管理者）。
- バージョンの削除取り消しはありません。完全に削除されたバージョンは復元できません。
- `POST /api/v1/skills/{slug}/undelete` を呼び出します。
- `--reason <text>` は、スキルと監査ログにモデレーションメモを記録します。
- `--note <text>` は `--reason` のエイリアスです。
- `--yes` は確認をスキップします。

### `hide <skill>`

- スキルを非表示にします（所有者、モデレーター、または管理者）。
- `delete` のエイリアスです。

### `unhide <skill>`

- スキルの非表示を解除します（所有者、モデレーター、または管理者）。
- `undelete` のエイリアスです。

### `skill rename <skill> <new-name>`

- 所有しているスキルの名前を変更し、以前の slug をリダイレクトエイリアスとして保持します。
- `POST /api/v1/skills/{slug}/rename` を呼び出します。
- `--yes` は確認をスキップします。

### `skill merge <source> <target>`

- 所有している 1 つのスキルを、所有している別のスキルにマージします。
- ソース slug は公開一覧に表示されなくなり、ターゲットへのリダイレクトエイリアスになります。
- `POST /api/v1/skills/{sourceSlug}/merge` を呼び出します。
- `--yes` は確認をスキップします。

### `transfer`

- 所有権移管ワークフロー。
- ユーザーハンドルへの移管では、受信者が承認する保留中のリクエストが作成されます。
- org/publisher ハンドルへの移管は、実行者が現在の所有者と移管先 publisher の両方に管理者アクセス権を持つ場合にのみ即時適用されます。
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

- `GET /api/v1/packages` と `GET /api/v1/packages/search` を通じて、統合パッケージカタログを閲覧または検索します。
- これは plugins とその他のパッケージファミリーのエントリに使用します。トップレベルの `search` は引き続きスキル検索サーフェスです。
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

- インストールせずにパッケージメタデータを取得します。
- これは Plugin メタデータ、互換性、検証、ソース、バージョン/ファイルの検査に使用します。
- `--version <version>`: 特定のバージョンを検査します（デフォルト: latest）。
- `--tag <tag>`: タグ付きバージョンを検査します（例: `latest`）。
- `--versions`: バージョン履歴を一覧表示します（最初のページ）。
- `--limit <n>`: 一覧表示する最大バージョン数（1-100）。
- `--files`: 選択したバージョンのファイルを一覧表示します。
- `--file <path>`: 生のファイル内容を取得します（テキストファイルのみ、200KB 制限）。
- `--json`: 機械可読の出力。

### `package download <name>`

- `GET /api/v1/packages/{name}/versions/{version}/artifact` を通じてパッケージバージョンを解決します。
- リゾルバーの `downloadUrl` からアーティファクトをダウンロードします。
- すべてのアーティファクトについて ClawHub SHA-256 を検証します。
- ClawPack npm-pack アーティファクトでは、npm `sha512` integrity、npm shasum、tarball の `package.json` name/version も検証します。
- レガシー ZIP バージョンはレガシー ZIP ルートを通じてダウンロードします。
- フラグ:
  - `--version <version>`: 特定のバージョンをダウンロードします。
  - `--tag <tag>`: タグ付きバージョンをダウンロードします（デフォルト: `latest`）。
  - `-o, --output <path>`: 出力ファイルまたはディレクトリ。
  - `--force`: 既存の出力ファイルを上書きします。
  - `--json`: 機械可読の出力。

例:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- ローカルアーティファクトについて ClawHub SHA-256、npm `sha512` integrity、npm shasum を計算します。
- `--package` を指定すると、ClawHub から期待されるメタデータを解決し、ローカルファイルを公開済みアーティファクトメタデータと比較します。
- 直接ダイジェストフラグを指定すると、ネットワーク検索なしで検証します。
- フラグ:
  - `--package <name>`: 期待されるアーティファクトメタデータを解決するパッケージ名。
  - `--version <version>` または `--tag <tag>`: 期待されるパッケージバージョン。
  - `--sha256 <hex>`: 期待される ClawHub SHA-256。
  - `--npm-integrity <sri>`: 期待される npm integrity。
  - `--npm-shasum <sha1>`: 期待される npm shasum。
  - `--json`: 機械可読の出力。

例:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- ローカル Plugin パッケージフォルダーに対して、ClawHub CLI に同梱された Plugin Inspector を実行します。
- ローカルの OpenClaw チェックアウトを探したりインポートしたりせず、デフォルトではオフライン/静的検証を行います。
- 重大な互換性エラーでは非ゼロで終了します。警告のみの検出結果は出力されますが、終了コードはゼロです。
- フラグ:
  - `--out <dir>`: Plugin Inspector レポートをこのディレクトリに書き込みます。
  - `--openclaw <path>`: 明示的なローカル OpenClaw チェックアウトに対して検査します。
  - `--runtime`: ランタイムキャプチャを有効にします。Plugin コードをインポートします。
  - `--allow-execute`: 分離されたワークスペースでランタイムキャプチャを許可します。
  - `--no-mock-sdk`: ランタイムキャプチャ中のモック OpenClaw SDK を無効にします。
  - `--json`: 機械可読の出力。

例:

```bash
clawhub package validate ./example-plugin
```

検証でパッケージ、manifest、SDK インポート、またはアーティファクトの検出結果が報告された場合は、[Plugin validation fixes](/ja-JP/clawhub/plugin-validation-fixes) を参照してから、コマンドを再実行してください。

### `package delete <name>`

- `--version` なしでは、パッケージとすべてのリリースをソフト削除します。
- `--version <version>` は、フェイルクローズなバージョン固有のルートを通じて、所有している最新ではない 1 つのリリースを完全に削除します。
  削除されたバージョンは復元または再公開できません。現在の最新バージョンを削除する前に、置き換えを公開してください。このバージョン専用フローには、パッケージ所有者または org publisher 管理者が必要です。プラットフォームスタッフはパッケージ所有権をバイパスしません。
- パッケージ全体のソフト削除には、パッケージ所有者、org publisher の owner/admin、プラットフォームモデレーター、またはプラットフォーム管理者が必要です。
- フラグ:
  - `--version <version>`: 最新ではない 1 つのバージョンを完全に削除します。
  - `--yes`: 確認をスキップします。
  - `--json`: 機械可読の出力。

例:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- ソフト削除されたパッケージとリリースを復元します。
- バージョンの削除取り消しはありません。完全に削除されたバージョンは復元できません。
- パッケージ所有者、org publisher の owner/admin、プラットフォームモデレーター、またはプラットフォーム管理者が必要です。
- `POST /api/v1/packages/{name}/undelete` を呼び出します。
- フラグ:
  - `--yes`: 確認をスキップします。
  - `--json`: 機械可読の出力。

例:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- パッケージを別の publisher に移管します。
- プラットフォーム管理者によって実行される場合を除き、現在のパッケージ所有者と移管先 publisher の両方への管理者アクセス権が必要です。
- スコープ付きパッケージ名は、一致するスコープ所有者に移管する必要があります。
- `POST /api/v1/packages/{name}/transfer` を呼び出します。
- フラグ:
  - `--to <owner>`: 移管先 publisher ハンドル。
  - `--reason <text>`: 任意の監査理由。
  - `--json`: 機械可読の出力。

例:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- パッケージをモデレーターに報告するための認証済みコマンド。
- `POST /api/v1/packages/{name}/report` を呼び出します。
- 報告はパッケージレベルで、任意でバージョンに関連付けられ、レビューのためにモデレーターに表示されます。
- 報告自体がパッケージを自動的に非表示にしたり、ダウンロードをブロックしたりすることはありません。
- フラグ:
  - `--version <version>`: 報告に添付する任意のパッケージバージョン。
  - `--reason <text>`: 必須の報告理由。
  - `--json`: 機械可読の出力。

例:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- パッケージのモデレーション可視性を確認するための所有者コマンド。
- `GET /api/v1/packages/{name}/moderation` を呼び出します。
- 現在のパッケージスキャン状態、オープンな報告数、最新リリースの手動モデレーション状態、ダウンロードブロック状態、モデレーション理由を表示します。
- フラグ:
  - `--json`: 機械可読の出力。

例:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- パッケージが将来の OpenClaw 消費に対応できているかを確認します。
- `GET /api/v1/packages/{name}/readiness` を呼び出します。
- 公式ステータス、ClawPack の可用性、アーティファクトダイジェスト、ソース来歴、OpenClaw 互換性、ホストターゲット、環境メタデータ、スキャン状態に関するブロッカーを報告します。
- フラグ:
  - `--json`: 機械可読の出力。

例:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- 同梱 OpenClaw Plugin を置き換える可能性があるパッケージについて、オペレーター向けの移行状態を表示します。
- `package readiness` と同じ計算済み readiness エンドポイントを呼び出しますが、移行に焦点を当てた状態、最新バージョン、公式パッケージ状態、チェック、ブロッカーを出力します。
- フラグ:
  - `--json`: 機械可読の出力。

例:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- 認証済みユーザーが所有する org publisher を作成します。
- ハンドルは小文字に正規化され、`@` ありでもなしでも渡せます。
- 新しく作成された org publisher は、デフォルトでは trusted/official ではありません。
- ハンドルが既存の publisher、ユーザー、または予約済みルートですでに使用されている場合は失敗します。

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- `POST /api/v1/packages` 経由でコードPluginまたはバンドルPluginを公開します。
- `<source>` は次を受け付けます:
  - ローカルフォルダーパス: `./my-plugin`
  - ローカルClawPack npm-pack tarball: `./my-plugin-1.2.3.tgz`
  - GitHubリポジトリ: `owner/repo` または `owner/repo@ref`
  - GitHub URL: `https://github.com/owner/repo`
- メタデータは `package.json`、`openclaw.plugin.json`、および
  `.codex-plugin/plugin.json`、`.claude-plugin/plugin.json`、`.cursor-plugin/plugin.json`
  などの実際のOpenClawバンドルマーカーから自動検出されます。
- `.tgz` ソースはClawPackとして扱われます。CLIは正確なnpm-pack
  バイトをアップロードし、抽出された `package/` の内容は検証と
  メタデータの事前入力にのみ使用します。
- コードPluginフォルダーはアップロード前にClawPack npm tarballへパックされるため、
  OpenClawインストールは正確なアーティファクトを検証できます。バンドルPluginフォルダーは引き続き
  抽出ファイルの公開パスを使用します。
- GitHubソースでは、ソース帰属がリポジトリ、解決済みコミット、ref、サブパスから自動入力されます。
- ローカルフォルダーでは、origin remoteがGitHubを指している場合、ソース帰属がローカルgitから自動検出されます。
- 外部コードPluginは `openclaw.compat.pluginApi` と
  `openclaw.build.openclawVersion` を明示的に宣言する必要があります。
  トップレベルの `package.json.version` は公開検証のフォールバックとして使用されません。
- `--dry-run` はアップロードせずに、解決された公開ペイロードをプレビューします。
- `--json` はCI向けに機械可読な出力を生成します。
- `--owner <handle>` は、アクターがパブリッシャーアクセス権を持つ場合に、ユーザーまたは組織のパブリッシャーハンドル配下で公開します。
- スコープ付きパッケージ名は選択した所有者と一致する必要があります。`docs/publishing.md` を参照してください。
- 既存のフラグ（`--family`、`--name`、`--version`、`--source-repo`、`--source-commit`、`--source-ref`、`--source-path`）は引き続き上書きとして機能します。
- プライベートGitHubリポジトリには `GITHUB_TOKEN` が必要です。

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### 推奨ローカルフロー

ライブリリースを作成する前に、解決されたパッケージメタデータと
ソース帰属を確認できるよう、まず `--dry-run` を使用します:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### ローカルフォルダーフロー

コードPluginの場合、フォルダー公開はパッケージフォルダーからClawPackアーティファクトをビルドしてアップロードします:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` 向けの最小 `package.json`

外部コードPluginでは、`package.json` に少量のOpenClawメタデータが必要です。
この最小マニフェストで公開を正常に行うには十分です:

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

- `package.json.version` はパッケージのリリースバージョンですが、OpenClawの互換性/ビルド検証のフォールバックとしては使用されません。
- `openclaw.hostTargets` と `openclaw.environment` は任意のメタデータです。
  ClawHubは存在する場合に表示することがありますが、公開には必須ではありません。
- `openclaw.compat.minGatewayVersion` と
  `openclaw.build.pluginSdkVersion` は、より詳細な互換性メタデータを公開したい場合の任意の追加項目です。
- 古い `clawhub` CLIリリースを使用している場合は、公開前にアップグレードして、
  アップロード前にローカル事前チェックが実行されるようにしてください。
- 検証で修復コードが報告された場合は、
  [Plugin検証の修正](/ja-JP/clawhub/plugin-validation-fixes)を参照してください。

#### GitHub Actions

ClawHubは、Pluginリポジトリ向けに
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/6a18bea5764179d5b301dedfdd5d2b488dc4bc83/.github/workflows/package-publish.yml)
にある公式の再利用可能ワークフローも提供しています。

一般的な呼び出し元の設定:

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

- 再利用可能ワークフローは、デフォルトで `source` を呼び出し元リポジトリに設定します。
- モノレポでは、ワークフローがPluginパッケージフォルダーを公開するように
  `source_path` を渡します。例: `source_path: extensions/codex`。
- 再利用可能ワークフローは安定したタグまたは完全なコミットSHAに固定してください。`@main` からリリース公開を実行しないでください。
- `pull_request` では、CIを汚染しないよう `dry_run: true` を使用してください。
- 実際の公開は、`workflow_dispatch` やタグpushなどの信頼できるイベントに限定してください。
- シークレットなしの信頼できる公開は `workflow_dispatch` でのみ機能します。タグpushには引き続き `clawhub_token` が必要です。
- 初回公開、信頼できないパッケージ、または緊急公開のために `clawhub_token` を利用可能にしておいてください。
- ワークフローはJSON結果をアーティファクトとしてアップロードし、ワークフロー出力として公開します。

### `package trusted-publisher get <name>`

- パッケージのGitHub Actions信頼できるパブリッシャー設定を表示します。
- 設定を行った後、リポジトリ、ワークフローファイル名、
  および任意の環境固定を確認するために使用します。
- フラグ:
  - `--json`: 機械可読な出力。

例:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- 既存のパッケージにGitHub Actions信頼できるパブリッシャー設定を追加または置き換えます。
- パッケージは、通常の手動またはトークン認証済みの
  `clawhub package publish` を通じて先に作成されている必要があります。
- 設定後、今後サポート対象のGitHub Actions公開では、
  長期有効なClawHubトークンなしでOIDC/信頼できる公開を使用できます。
- `--repository <repo>` は `owner/repo` である必要があります。
- `--workflow-filename <file>` は `.github/workflows/` 内のワークフローファイル名と一致する必要があります。
- `--environment <name>` は任意です。設定されている場合、OIDCクレーム内のGitHub Actions環境は完全一致する必要があります。
- ClawHubは、このコマンドの実行時に設定されたGitHubリポジトリを検証します。
  パブリックリポジトリはパブリックGitHubメタデータを通じて検証できます。プライベート
  リポジトリでは、将来のClawHub GitHub Appインストールや別の認可済み
  GitHub連携などを通じて、ClawHubがそのリポジトリへのGitHubアクセスを持つ必要があります。
- フラグ:
  - `--repository <repo>`: GitHubリポジトリ。例: `openclaw/example-plugin`。
  - `--workflow-filename <file>`: ワークフローファイル名。例: `package-publish.yml`。
  - `--environment <name>`: 任意の完全一致GitHub Actions環境。
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
- 今後の実際の公開では、設定が再度行われるまで通常の認証済み公開を使用する必要があります。
- フラグ:
  - `--json`: 機械可読な出力。

例:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### インストールテレメトリ

- ログイン中に `clawhub install <slug>` の後で送信されます。ただし
  `CLAWHUB_DISABLE_TELEMETRY=1` が設定されている場合を除きます。
- レポートはベストエフォートです。テレメトリが利用できない場合でも、インストールコマンドは失敗しません。
- 詳細: `docs/telemetry.md`。

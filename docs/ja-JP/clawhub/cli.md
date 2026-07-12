---
read_when:
    - ClawHub CLI の使用方法
    - インストール、更新、公開のデバッグ
summary: CLI リファレンス：コマンド、フラグ、設定、ロックファイルの動作。
x-i18n:
    generated_at: "2026-07-12T21:22:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 498d27d82a34ad43af9fc7bc0d40e844c6a14ededc8a017d6fa33768eec4b452
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

CLI パッケージ: `clawhub`、バイナリ: `clawhub`。

npm または pnpm でグローバルにインストールします。

```bash
npm i -g clawhub
# または
pnpm add -g clawhub
```

次に確認します。

```bash
clawhub --help
clawhub login
clawhub whoami
```

## グローバルフラグ

- `--workdir <dir>`: 作業ディレクトリ（デフォルト: cwd。設定されている場合は Clawdbot ワークスペースにフォールバック）
- `--dir <dir>`: workdir 配下のインストールディレクトリ（デフォルト: `skills`）
- `--site <url>`: ブラウザログイン用のベース URL（デフォルト: `https://clawhub.ai`）
- `--registry <url>`: API ベース URL（デフォルト: 検出された URL。それ以外の場合は `https://clawhub.ai`）
- `--no-input`: プロンプトを無効化

同等の環境変数:

- `CLAWHUB_SITE`（旧 `CLAWDHUB_SITE`）
- `CLAWHUB_REGISTRY`（旧 `CLAWDHUB_REGISTRY`）
- `CLAWHUB_WORKDIR`（旧 `CLAWDHUB_WORKDIR`）

### HTTP プロキシ

CLI は、企業プロキシや制限されたネットワークの背後にあるシステム向けに、標準の HTTP プロキシ環境変数に対応しています。

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

これらの変数のいずれかが設定されている場合、CLI は指定されたプロキシを経由して外向きリクエストを送信します。HTTPS リクエストには `HTTPS_PROXY`、通常の HTTP には `HTTP_PROXY` が使用されます。特定のホストまたはドメインでプロキシを迂回するため、`NO_PROXY` / `no_proxy` も適用されます。

これは、直接の外向き接続がブロックされているシステム（Docker コンテナ、プロキシ経由でのみインターネット接続できる Hetzner VPS、企業ファイアウォールなど）で必要です。

例:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "検索クエリ"
```

プロキシ変数が設定されていない場合、動作は変わりません（直接接続）。

## 設定ファイル

API トークンとキャッシュされたレジストリ URL を保存します。

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` または `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- 旧形式へのフォールバック: `clawhub/config.json` がまだ存在せず、`clawdhub/config.json` が存在する場合、CLI は旧パスを再利用します
- オーバーライド: `CLAWHUB_CONFIG_PATH`（旧 `CLAWDHUB_CONFIG_PATH`）

## コマンド

### `login` / `auth login`

- デフォルト: ブラウザで `<site>/cli/auth` を開き、ループバックコールバックを介して完了します。
- ヘッドレス: `clawhub login --token clh_...`
- リモート/ヘッドレス対話モード: `clawhub login --device` はコードを表示し、`<site>/cli/device` で認可されるまで待機します。

### `whoami`

- `/api/v1/whoami` を介して保存済みトークンを検証します。

### `token`

- 保存済み API トークンを標準出力に出力します。
- ローカルログインのトークンを CI シークレット設定コマンドへパイプする際に便利です。

### `star <skill>` / `unstar <skill>`

- Skills をハイライトに追加、またはハイライトから削除します。
- `POST /api/v1/stars/<slug>` および `DELETE /api/v1/stars/<slug>` を呼び出します。
- `--yes` は確認を省略します。

### `search <query...>`

- `/api/v1/search?q=...` を呼び出します。
- 出力には Skills の slug、所有者ハンドル、表示名、関連度スコアが含まれます。
- 検索では、ダウンロード人気度よりも slug/名前の完全なトークン一致が優先されます。`map` のような単独の slug トークンは、`amap` 内の部分文字列よりも `personal-map` に強く一致します。
- 人気度はランキングにおける小さな事前要因であり、最上位への表示を保証するものではありません。
- Skills が表示されるはずなのに表示されない場合は、メタデータの名前を変更する前に、ログインした状態で `clawhub inspect @owner/slug` を実行し、所有者に表示されるモデレーション診断を確認してください。

### `explore`

- `/api/v1/skills?limit=...&sort=createdAt` を介して最新の Skills を一覧表示します（`createdAt` の降順で並べ替え）。
- フラグ:
  - `--limit <n>`（1-200、デフォルト: 25）
  - `--sort newest|updated|rating|downloads|trending`（デフォルト: newest）。互換性のため、旧インストール並べ替えエイリアスも引き続き機能します。
  - `--json`（機械可読出力）
- 出力: `<slug>  v<version>  <age>  <summary>`（概要は 50 文字に切り詰められます）。

### `inspect @owner/slug`

- インストールせずに Skills のメタデータとバージョンファイルを取得します。
- `--version <version>`: 特定のバージョンを調査します（デフォルト: 最新）。
- `--tag <tag>`: タグ付きバージョンを調査します（例: `latest`）。
- `--versions`: バージョン履歴を一覧表示します（最初のページ）。
- `--limit <n>`: 一覧表示する最大バージョン数（1-200）。
- `--files`: 選択したバージョンのファイルを一覧表示します。
- `--file <path>`: 未加工のファイル内容を取得します（テキストファイルのみ、上限 200KB）。
- `--json`: 機械可読出力。

### `install @owner/slug`

- 指定された所有者と Skills の最新バージョンを解決します。
- `/api/v1/download` を介して zip をダウンロードします。
- `<workdir>/<dir>/<slug>` に展開します。
- ピン留めされた Skills の上書きを拒否します。先に `clawhub unpin <skill>` を実行してください。
- 以下を書き込みます。
  - `<workdir>/.clawhub/lock.json`（旧 `.clawdhub`）
  - `<skill>/.clawhub/origin.json`（旧 `.clawdhub`）

### `uninstall <skill>`

- `<workdir>/<dir>/<slug>` を削除し、ロックファイルのエントリを削除します。
- ログイン中はベストエフォート方式のテレメトリを送信し、現在のインストール数を無効化できるようにします。
- 対話モード: 確認を求めます。
- 非対話モード（`--no-input`）: `--yes` が必要です。

### `list`

- `<workdir>/.clawhub/lock.json`（旧 `.clawdhub`）を読み取ります。
- `clawhub pin` で固定された Skills の横に、任意の理由を含めて `pinned` を表示します。

### `pin <skill>`

- インストール済みの Skills をロックファイル内でピン留め済みとしてマークします。
- `--reason <text>` は Skills を固定する理由を記録します。
- ピン留めされた Skills は `update --all` でスキップされ、直接の `update <skill>` では拒否されます。
- ピン留めされた Skills は `install --force` も拒否するため、ローカルのバイト列が誤って置換されることはありません。

### `unpin <skill>`

- インストール済みの Skills からロックファイルのピンを削除し、今後の更新で変更できるようにします。

### `update [@owner/slug]` / `update --all`

- ローカルファイルからフィンガープリントを計算します。
- フィンガープリントが既知のバージョンと一致する場合: プロンプトは表示されません。
- フィンガープリントが一致しない場合:
  - デフォルトでは拒否します
  - `--force` で上書きします（対話モードの場合はプロンプトを表示）
- ピン留めされた Skills は `--force` でも更新されません。
- `update <skill>` はピン留めされた Skills に対して即座に失敗し、先に `clawhub unpin <skill>` を実行するよう案内します。
- `update --all` はピン留めされた slug をスキップし、固定されたままの項目の概要を表示します。

### `skill publish <path>`

- ローカルバンドルのフィンガープリントを ClawHub と比較し、内容がすでに公開済みの場合は正常終了します。
- 新しい Skills のデフォルトは `1.0.0`、変更された Skills のデフォルトは次のパッチバージョンです。
- `--version <version>` はバージョンを明示的に選択し、内容が既存バージョンと一致する場合でも公開します。
- `--dry-run` はアップロードせずに公開処理を解決し、`--json` は機械可読な結果を出力します。
- `--owner <handle>` は、実行者が公開者アクセス権を持つ場合、組織/ユーザーの公開者ハンドル配下で公開します。
- `--migrate-owner` は、新しいバージョンを公開しながら、既存の Skills を `--owner` に移動します。両方の公開者に対する管理者/所有者アクセス権が必要です。
- 所有者とレビューの動作については `docs/publishing.md` で説明しています。
- Skills を公開すると、ClawHub 上で `MIT-0` の下にリリースされます。
- 公開された Skills は、帰属表示なしで自由に使用、変更、再配布できます。
- ClawHub は有料の Skills や Skills ごとの価格設定をサポートしていません。
- 旧エイリアス: `publish <path>`。

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

ClawHub の再利用可能な
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
ワークフローは、1 つの `skill_path`、または `root`（デフォルト: `skills`）直下にある各 Skills フォルダーに対して `skill publish` を呼び出します。変更されていない Skills はスキップし、同じ自動パッチバージョン動作を使用します。

トークンなしでプレビューするには `dry_run: true` を設定します。実際の公開には `clawhub_token` シークレットが必要です。

### `sync`

- 現在の workdir、設定済みの Skills ディレクトリ、および任意の `--root <dir>` フォルダーを走査し、`SKILL.md` または `skill.md` を含むローカルの Skills フォルダーを検索します。
- 各ローカル Skills のフィンガープリントを ClawHub と比較し、新規または変更された Skills のみを公開します。
- 新しい Skills は `1.0.0`、変更された Skills はデフォルトで次のパッチバージョンとして公開されます。より大きな semver ステップで進める更新バッチには `--bump minor|major` を使用します。
- `--dry-run` はアップロードせずに公開計画を表示し、`--json` は機械可読な計画を出力します。
- `--all` は、確認せずにすべての新規または変更された Skills を公開します。`--all` を指定しない場合、対話型ターミナルで公開する Skills を選択できます。
- `--owner <handle>` は、実行者が公開者アクセス権を持つ場合、組織/ユーザーの公開者ハンドル配下で公開します。
- `sync` は一方向の公開のみを行います。インストール、更新、ダウンロード、インストール/ダウンロードのテレメトリ報告は行いません。

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- `clawhub login` が必要です。
- `POST /api/v1/skills/-/scan` を介して ClawHub ClawScan を実行し、スキャンが終了状態になるまでポーリングします。
- スキャンは非同期であり、完了まで時間がかかる場合があります。キューに入っている間、ターミナルのスピナーには現在の優先スキャン位置と先行するスキャン数が表示されます。
- 公開済みのスキャンには、所有権または公開者管理アクセス権が必要です。モデレーター/管理者は `clawhub-admin` を介して同じバックエンドを使用できます。
- `--update` は `--slug` と組み合わせた場合にのみ有効です。成功した公開済みスキャン結果を、選択したバージョンに書き戻します。
- `--output <file.zip>` は、`manifest.json`、`clawscan.json`、`skillspector.json`、`static-analysis.json`、`virustotal.json`、`README.md` を含む完全なレポートアーカイブをダウンロードします。
- `--json` は自動化用に完全なポーリングレスポンスを出力します。
- ローカルパスのスキャンはサポートされなくなりました。新しいバージョンをアップロードしてから、`scan download` を使用して、その送信済みバージョンに保存されたスキャン結果を取得してください。

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- `clawhub login` が必要です。
- 送信済みの Skills または Plugin バージョンについて保存されたスキャンレポート ZIP をダウンロードします。ClawHub のセキュリティチェックによってブロックまたは非表示にされたバージョンも含まれます。
- Skills のダウンロードには Skills の slug を使用し、デフォルトは `--kind skill` です。
- Plugin のダウンロードにはパッケージ名を使用し、`--kind plugin` が必要です。
- 作成者が ClawHub によってブロックされた正確な送信済みバージョンを調査できるよう、`--version` は必須です。
- `--output <file.zip>` で保存先パスを選択します。

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub は、Skills リポジトリおよびカタログリポジトリ向けの公式な再利用可能ワークフローを
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/873b7e9a3403dbaa2c66ef15b655803562bd63c0/.github/workflows/skill-publish.yml)
で提供しています。

一般的なカタログ設定:

```yaml
name: Skills の公開

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
- 1 つの Skills フォルダーを処理するには、`skill_path: skills/review-helper` を渡します。
- `owner` は CLI の `--owner` フラグに対応します。認証済みユーザーとして公開する場合は省略します。
- V1 の Skills 公開では `clawhub_token` を使用します。GitHub OIDC の信頼された公開は、現時点ではパッケージ専用です。

### `delete <skill>`

- `--version` を指定しない場合、Skills を論理削除します（所有者、モデレーター、または管理者）。
- `DELETE /api/v1/skills/{slug}` を呼び出します。
- 所有者が開始した論理削除では slug が 30 日間予約され、コマンドに有効期限が表示されます。
- `--version <version>` は、所有する最新ではないバージョンを、フェイルクローズ方式の
  バージョン固有ルートを通じて完全に削除します。
  削除したバージョンは復元も再公開もできません。現在の最新バージョンを削除する前に、
  代替バージョンを公開してください。このバージョン限定フローでは、プラットフォームスタッフも所有権を迂回できません。
- `--reason <text>` は、Skills 全体の論理削除と監査ログにモデレーションメモを記録します。
- `--note <text>` は `--reason` のエイリアスです。
- `--yes` は確認を省略します。

### `undelete <skill>`

- 非表示の Skills を復元します（所有者、モデレーター、または管理者）。
- バージョンの削除取消はありません。完全に削除されたバージョンは復元できません。
- `POST /api/v1/skills/{slug}/undelete` を呼び出します。
- `--reason <text>` は、Skills と監査ログにモデレーションメモを記録します。
- `--note <text>` は `--reason` のエイリアスです。
- `--yes` は確認を省略します。

### `hide <skill>`

- Skills を非表示にします（所有者、モデレーター、または管理者）。
- `delete` のエイリアスです。

### `unhide <skill>`

- Skills の非表示を解除します（所有者、モデレーター、または管理者）。
- `undelete` のエイリアスです。

### `skill rename <skill> <new-name>`

- 所有する Skills の名前を変更し、以前の slug をリダイレクトエイリアスとして保持します。
- `POST /api/v1/skills/{slug}/rename` を呼び出します。
- `--yes` は確認を省略します。

### `skill merge <source> <target>`

- 所有する 1 つの Skills を、所有する別の Skills に統合します。
- 統合元の slug は公開一覧に表示されなくなり、統合先へのリダイレクトエイリアスになります。
- `POST /api/v1/skills/{sourceSlug}/merge` を呼び出します。
- `--yes` は確認を省略します。

### `transfer`

- 所有権移譲ワークフロー。
- ユーザーハンドルへの移譲では保留中のリクエストが作成され、受信者が承認します。
- 組織またはパブリッシャーのハンドルへの移譲は、実行者が現在の所有者と移譲先パブリッシャーの
  両方に対する管理者アクセス権を持つ場合にのみ、直ちに適用されます。
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

- `GET /api/v1/packages` および `GET /api/v1/packages/search` を介して、統合パッケージカタログを閲覧または検索します。
- Plugin やその他のパッケージファミリーのエントリにはこれを使用します。トップレベルの `search` は引き続き Skills の検索インターフェースです。
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

- インストールせずにパッケージのメタデータを取得します。
- Plugin のメタデータ、互換性、検証、ソース、およびバージョンやファイルの調査にはこれを使用します。
- `--version <version>`: 特定のバージョンを調査します（デフォルト: 最新）。
- `--tag <tag>`: タグ付きバージョン（例: `latest`）を調査します。
- `--versions`: バージョン履歴を一覧表示します（最初のページ）。
- `--limit <n>`: 一覧表示するバージョンの最大数（1-100）。
- `--files`: 選択したバージョンのファイルを一覧表示します。
- `--file <path>`: ファイルの生の内容を取得します（テキストファイルのみ、上限 200KB）。
- `--json`: 機械可読形式の出力。

### `package download <name>`

- `GET /api/v1/packages/{name}/versions/{version}/artifact` を通じて
  パッケージのバージョンを解決します。
- リゾルバーの `downloadUrl` からアーティファクトをダウンロードします。
- すべてのアーティファクトについて ClawHub SHA-256 を検証します。
- ClawPack npm-pack アーティファクトについては、npm の `sha512` 整合性、
  npm shasum、および tarball 内の `package.json` の名前とバージョンも検証します。
- レガシー ZIP バージョンは、レガシー ZIP ルートを通じてダウンロードします。
- フラグ:
  - `--version <version>`: 特定のバージョンをダウンロードします。
  - `--tag <tag>`: タグ付きバージョンをダウンロードします（デフォルト: `latest`）。
  - `-o, --output <path>`: 出力ファイルまたはディレクトリ。
  - `--force`: 既存の出力ファイルを上書きします。
  - `--json`: 機械可読形式の出力。

例:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- ローカルアーティファクトの ClawHub SHA-256、npm `sha512` 整合性、および npm shasum を
  計算します。
- `--package` を指定すると、ClawHub から期待されるメタデータを解決し、
  ローカルファイルを公開済みアーティファクトのメタデータと比較します。
- ダイジェストフラグを直接指定すると、ネットワーク検索なしで検証します。
- フラグ:
  - `--package <name>`: 期待されるアーティファクトのメタデータを解決するパッケージ名。
  - `--version <version>` または `--tag <tag>`: 期待されるパッケージバージョン。
  - `--sha256 <hex>`: 期待される ClawHub SHA-256。
  - `--npm-integrity <sri>`: 期待される npm 整合性。
  - `--npm-shasum <sha1>`: 期待される npm shasum。
  - `--json`: 機械可読形式の出力。

例:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- ローカルの Plugin パッケージフォルダーに対して、ClawHub CLI に同梱された Plugin Inspector を
  実行します。
- デフォルトでは、ローカルの OpenClaw チェックアウトを検出またはインポートせず、
  オフラインの静的検証を行います。
- 重大な互換性エラーがある場合、ゼロ以外の終了コードで終了します。警告のみの検出結果は出力されますが、
  終了コードはゼロです。
- フラグ:
  - `--out <dir>`: Plugin Inspector のレポートをこのディレクトリに書き込みます。
  - `--openclaw <path>`: 明示的に指定したローカルの OpenClaw チェックアウトに対して調査します。
  - `--runtime`: ランタイムキャプチャを有効にします。Plugin コードをインポートします。
  - `--allow-execute`: 分離されたワークスペースでランタイムキャプチャを許可します。
  - `--no-mock-sdk`: ランタイムキャプチャ中にモック化された OpenClaw SDK を無効にします。
  - `--json`: 機械可読形式の出力。

例:

```bash
clawhub package validate ./example-plugin
```

検証でパッケージ、マニフェスト、SDK インポート、またはアーティファクトに関する問題が報告された場合は、
[Plugin 検証の修正](/clawhub/plugin-validation-fixes)を参照してから、コマンドを再実行してください。

### `package delete <name>`

- `--version` を指定しない場合、パッケージとすべてのリリースを論理削除します。
- `--version <version>` は、所有する最新ではないリリースを、フェイルクローズ方式の
  バージョン固有ルートを通じて完全に削除します。
  削除したバージョンは復元も再公開もできません。現在の最新バージョンを削除する前に、
  代替バージョンを公開してください。このバージョン限定フローには、パッケージ所有者または組織パブリッシャーの
  管理者であることが必要です。プラットフォームスタッフもパッケージの所有権を迂回できません。
- パッケージ全体の論理削除には、パッケージ所有者、組織パブリッシャーの所有者または管理者、プラットフォームの
  モデレーター、またはプラットフォーム管理者であることが必要です。
- フラグ:
  - `--version <version>`: 最新ではない 1 つのバージョンを完全に削除します。
  - `--yes`: 確認を省略します。
  - `--json`: 機械可読形式の出力。

例:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- 論理削除されたパッケージとリリースを復元します。
- バージョンの削除取消はありません。完全に削除されたバージョンは復元できません。
- パッケージ所有者、組織パブリッシャーの所有者または管理者、プラットフォームのモデレーター、
  またはプラットフォーム管理者であることが必要です。
- `POST /api/v1/packages/{name}/undelete` を呼び出します。
- フラグ:
  - `--yes`: 確認を省略します。
  - `--json`: 機械可読形式の出力。

例:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- パッケージを別のパブリッシャーに移譲します。
- プラットフォーム管理者が実行する場合を除き、現在のパッケージ所有者と移譲先
  パブリッシャーの両方に対する管理者アクセス権が必要です。
- スコープ付きパッケージ名は、一致するスコープ所有者に移譲する必要があります。
- `POST /api/v1/packages/{name}/transfer` を呼び出します。
- フラグ:
  - `--to <owner>`: 移譲先パブリッシャーのハンドル。
  - `--reason <text>`: 任意の監査理由。
  - `--json`: 機械可読形式の出力。

例:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- パッケージをモデレーターに報告するための、認証済みコマンドです。
- `POST /api/v1/packages/{name}/report` を呼び出します。
- 報告はパッケージ単位で、必要に応じてバージョンに関連付けられ、
  レビューのためにモデレーターに表示されます。
- 報告だけでパッケージが自動的に非表示になったり、ダウンロードがブロックされたりすることはありません。
- フラグ:
  - `--version <version>`: 報告に関連付ける任意のパッケージバージョン。
  - `--reason <text>`: 必須の報告理由。
  - `--json`: 機械可読形式の出力。

例:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "疑わしいネイティブペイロード"
```

### `package moderation-status`

- パッケージのモデレーション上の公開状態を確認するための所有者向けコマンドです。
- `GET /api/v1/packages/{name}/moderation` を呼び出します。
- 現在のパッケージスキャン状態、未解決の報告数、最新リリースの手動
  モデレーション状態、ダウンロードのブロック状態、およびモデレーション理由を表示します。
- フラグ:
  - `--json`: 機械可読形式の出力。

例:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- パッケージが将来 OpenClaw で利用できる状態かどうかを確認します。
- `GET /api/v1/packages/{name}/readiness` を呼び出します。
- 公式ステータス、ClawPack の可用性、アーティファクトのダイジェスト、
  ソースの来歴、OpenClaw との互換性、ホストターゲット、環境メタデータ、
  およびスキャン状態に関する阻害要因を報告します。
- フラグ:
  - `--json`: 機械可読形式の出力。

例:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- 同梱されている OpenClaw Plugin を置き換える可能性があるパッケージについて、
  運用担当者向けの移行状態を表示します。
- `package readiness` と同じ計算済み準備状況エンドポイントを呼び出しますが、
  移行に重点を置いた状態、最新バージョン、公式パッケージの状態、チェック、および
  阻害要因を出力します。
- フラグ:
  - `--json`: 機械可読形式の出力。

例:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- 認証済みユーザーが所有する組織パブリッシャーを作成します。
- ハンドルは小文字に正規化され、`@` の有無にかかわらず指定できます。
- 新しく作成された組織パブリッシャーは、デフォルトでは信頼済みでも公式でもありません。
- ハンドルが既存のパブリッシャー、ユーザー、または予約済みルートですでに使用されている場合は失敗します。

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- `POST /api/v1/packages` を介してコード Plugin またはバンドル Plugin を公開します。
- `<source>` には以下を指定できます。
  - ローカルフォルダーパス: `./my-plugin`
  - ローカルの ClawPack npm-pack tarball: `./my-plugin-1.2.3.tgz`
  - GitHub リポジトリ: `owner/repo` または `owner/repo@ref`
  - GitHub URL: `https://github.com/owner/repo`
- メタデータは、`package.json`、`openclaw.plugin.json`、および
  `.codex-plugin/plugin.json`、`.claude-plugin/plugin.json`、
  `.cursor-plugin/plugin.json` などの実際の OpenClaw バンドルマーカーから自動検出されます。
- `.tgz` ソースは ClawPack として扱われます。CLI は npm-pack の正確な
  バイト列をアップロードし、展開された `package/` の内容は検証と
  メタデータの事前入力にのみ使用します。
- コード Plugin のフォルダーはアップロード前に ClawPack npm tarball にパッケージ化されるため、
  OpenClaw のインストール時に正確なアーティファクトを検証できます。バンドル Plugin のフォルダーでは引き続き
  展開済みファイルの公開パスを使用します。
- GitHub ソースの場合、ソース帰属情報にはリポジトリ、解決済みコミット、ref、サブパスが自動入力されます。
- ローカルフォルダーの場合、origin リモートが GitHub を指していれば、ソース帰属情報がローカル git から自動検出されます。
- 外部コード Plugin では、`openclaw.compat.pluginApi` と
  `openclaw.build.openclawVersion` を明示的に宣言する必要があります。
  トップレベルの `package.json.version` は公開検証のフォールバックとして使用されません。
- `--dry-run` は、アップロードせずに解決済みの公開ペイロードをプレビューします。
- `--json` は、CI 用の機械可読出力を生成します。
- `--owner <handle>` は、実行者に公開者アクセス権がある場合、ユーザーまたは組織の公開者ハンドルで公開します。
- スコープ付きパッケージ名は、選択した所有者と一致する必要があります。`docs/publishing.md` を参照してください。
- 既存のフラグ（`--family`、`--name`、`--version`、`--source-repo`、`--source-commit`、`--source-ref`、`--source-path`）は、引き続きオーバーライドとして使用できます。
- 非公開 GitHub リポジトリには `GITHUB_TOKEN` が必要です。

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### 推奨ローカルフロー

実際のリリースを作成する前に、解決済みのパッケージメタデータと
ソース帰属情報を確認できるよう、まず `--dry-run` を使用してください。

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### ローカルフォルダーフロー

コード Plugin の場合、フォルダー公開ではパッケージフォルダーから ClawPack アーティファクトをビルドして
アップロードします。

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` 用の最小限の `package.json`

外部コード Plugin では、`package.json` に少量の OpenClaw メタデータが
必要です。次の最小限のマニフェストで正常に公開できます。

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
  OpenClaw の互換性／ビルド検証のフォールバックとしては使用されません。
- `openclaw.hostTargets` と `openclaw.environment` は任意のメタデータです。
  存在する場合は ClawHub に表示されることがありますが、公開には必須ではありません。
- より詳細な互換性メタデータを公開する場合、`openclaw.compat.minGatewayVersion` と
  `openclaw.build.pluginSdkVersion` を任意で追加できます。
- 古いリリースの `clawhub` CLI を使用している場合は、アップロード前に
  ローカルの事前チェックが実行されるよう、公開前にアップグレードしてください。
- 検証で修復コードが報告された場合は、
  [Plugin 検証の修正方法](/clawhub/plugin-validation-fixes)を参照してください。

#### GitHub Actions

ClawHub では、Plugin リポジトリ向けに
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/873b7e9a3403dbaa2c66ef15b655803562bd63c0/.github/workflows/package-publish.yml)
で公式の再利用可能なワークフローも提供しています。

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

注:

- 再利用可能なワークフローでは、`source` のデフォルトは呼び出し元リポジトリです。
- モノレポでは、ワークフローが Plugin パッケージフォルダーを公開するように
  `source_path` を渡します。例: `source_path: extensions/codex`
- 再利用可能なワークフローは、安定版タグまたは完全なコミット SHA に固定してください。`@main` からリリース公開を実行しないでください。
- CI を汚染しないよう、`pull_request` では `dry_run: true` を使用してください。
- 実際の公開は、`workflow_dispatch` やタグのプッシュなど、信頼できるイベントに限定してください。
- シークレットを使わない信頼済み公開は `workflow_dispatch` でのみ機能します。タグのプッシュには引き続き `clawhub_token` が必要です。
- 初回公開、信頼されていないパッケージ、または緊急時の公開に備えて、`clawhub_token` を利用可能な状態にしてください。
- ワークフローは JSON 結果をアーティファクトとしてアップロードし、ワークフロー出力として公開します。

### `package trusted-publisher get <name>`

- パッケージの GitHub Actions 信頼済み公開者設定を表示します。
- 設定後にこれを使用して、リポジトリ、ワークフローファイル名、
  および任意の environment 固定を確認します。
- フラグ:
  - `--json`: 機械可読出力。

例:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- 既存パッケージに GitHub Actions 信頼済み公開者設定を関連付けるか、置き換えます。
- まず通常の手動公開またはトークン認証済みの
  `clawhub package publish` でパッケージを作成する必要があります。
- 設定後は、今後サポート対象の GitHub Actions 公開で、
  長期有効な ClawHub トークンを使わずに OIDC／信頼済み公開を使用できます。
- `--repository <repo>` は `owner/repo` 形式である必要があります。
- `--workflow-filename <file>` は、`.github/workflows/` 内の
  ワークフローファイル名と一致する必要があります。
- `--environment <name>` は任意です。設定した場合、OIDC クレーム内の GitHub Actions
  environment と完全に一致する必要があります。
- ClawHub は、このコマンドの実行時に設定済みの GitHub リポジトリを検証します。
  公開リポジトリは、公開 GitHub メタデータを通じて検証できます。非公開
  リポジトリの場合、たとえば将来の ClawHub GitHub App のインストールや、別の承認済み
  GitHub インテグレーションを通じて、ClawHub がそのリポジトリへの GitHub アクセス権を持つ必要があります。
- フラグ:
  - `--repository <repo>`: GitHub リポジトリ。例: `openclaw/example-plugin`
  - `--workflow-filename <file>`: ワークフローファイル名。例: `package-publish.yml`
  - `--environment <name>`: 任意の、完全一致する GitHub Actions environment。
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
- ワークフロー、リポジトリ、または environment 固定を無効化するか
  再作成する必要がある場合に、ロールバックとして使用します。
- 設定を再度行うまで、今後の実際の公開では通常の認証済み公開を使用する必要があります。
- フラグ:
  - `--json`: 機械可読出力。

例:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### インストールテレメトリ

- ログイン中に `clawhub install <slug>` を実行した後、
  `CLAWHUB_DISABLE_TELEMETRY=1` が設定されていない場合に送信されます。
- レポート送信はベストエフォートです。テレメトリを利用できなくても
  インストールコマンドは失敗しません。
- 詳細: `docs/telemetry.md`。

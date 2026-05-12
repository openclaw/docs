---
read_when:
    - ClawHub CLIの使用
    - インストール、更新、公開、または同期のデバッグ
summary: 'CLI リファレンス: コマンド、フラグ、設定、ロックファイル、同期動作。'
x-i18n:
    generated_at: "2026-05-12T12:49:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 541fb8367e70fab6aaa9fd622a0c2753170d7cd2afa5e4e02681d606bb45ea8c
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

- `--workdir <dir>`: 作業ディレクトリ (デフォルト: cwd、設定されている場合は Clawdbot ワークスペースにフォールバック)
- `--dir <dir>`: workdir 配下のインストール先ディレクトリ (デフォルト: `skills`)
- `--site <url>`: ブラウザログイン用のベース URL (デフォルト: `https://clawhub.ai`)
- `--registry <url>`: API ベース URL (デフォルト: 検出されたもの、それ以外は `https://clawhub.ai`)
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

これらの変数のいずれかが設定されている場合、CLI は送信リクエストを指定されたプロキシ経由でルーティングします。`HTTPS_PROXY` は HTTPS リクエストに、`HTTP_PROXY` はプレーン HTTP に使用されます。`NO_PROXY` / `no_proxy` は、特定のホストまたはドメインでプロキシを迂回するために尊重されます。

これは、直接のアウトバウンド接続がブロックされているシステムで必要です (例: Docker コンテナ、プロキシ専用インターネットの Hetzner VPS、企業ファイアウォール)。

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
- リモート/ヘッドレス対話型: `clawhub login --device` はコードを表示し、`<site>/cli/device` で認可されるまで待機します。

### `whoami`

- `/api/v1/whoami` 経由で保存済みトークンを検証します。

### `star <slug>` / `unstar <slug>`

- ハイライトにスキルを追加/削除します。
- `POST /api/v1/stars/<slug>` と `DELETE /api/v1/stars/<slug>` を呼び出します。
- `--yes` は確認をスキップします。

### `search <query...>`

- `/api/v1/search?q=...` を呼び出します。
- 検索では、ダウンロード人気度よりも完全一致のスラッグ/名前トークン一致が優先されます。`map` のような単独のスラッグトークンは、`amap` 内の部分文字列よりも `personal-map` に強く一致します。
- ダウンロード数は小さな人気度の事前情報であり、上位表示を保証するものではありません。
- スキルが表示されるべきなのに表示されない場合は、メタデータ名を変更する前に、ログインした状態で `clawhub inspect <slug>` を実行し、オーナーに表示されるモデレーション診断を確認してください。

### `explore`

- `/api/v1/skills?limit=...&sort=createdAt` 経由で最新のスキルを一覧表示します (`createdAt` の降順でソート)。
- フラグ:
  - `--limit <n>` (1-200、デフォルト: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (デフォルト: newest)
  - `--json` (機械可読出力)
- 出力: `<slug>  v<version>  <age>  <summary>` (summary は 50 文字に切り詰め)。

### `inspect <slug>`

- インストールせずにスキルのメタデータとバージョンファイルを取得します。
- `--version <version>`: 特定のバージョンを検査します (デフォルト: 最新)。
- `--tag <tag>`: タグ付きバージョンを検査します (例: `latest`)。
- `--versions`: バージョン履歴を一覧表示します (最初のページ)。
- `--limit <n>`: 一覧表示する最大バージョン数 (1-200)。
- `--files`: 選択したバージョンのファイルを一覧表示します。
- `--file <path>`: 生のファイル内容を取得します (テキストファイルのみ、200KB 制限)。
- `--json`: 機械可読出力。

### `install <slug>`

- `/api/v1/skills/<slug>` 経由で最新バージョンを解決します。
- `/api/v1/download` 経由で zip をダウンロードします。
- `<workdir>/<dir>/<slug>` に展開します。
- pin されたスキルの上書きを拒否します。先に `clawhub unpin <slug>` を実行してください。
- 書き込み先:
  - `<workdir>/.clawhub/lock.json` (レガシー `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (レガシー `.clawdhub`)

### `uninstall <slug>`

- `<workdir>/<dir>/<slug>` を削除し、lockfile エントリを削除します。
- 対話型: 確認を求めます。
- 非対話型 (`--no-input`): `--yes` が必要です。

### `list`

- `<workdir>/.clawhub/lock.json`（レガシーの `.clawdhub`）を読み取ります。
- `clawhub pin` で固定されたスキルの横に `pinned` を表示し、任意の理由も含めます。

### `pin <slug>`

- インストール済みのスキルを lockfile 内でピン留めとしてマークします。
- `--reason <text>` は、そのスキルを固定している理由を記録します。
- ピン留めされたスキルは `update --all` でスキップされ、直接の `update <slug>` では拒否されます。
- ピン留めされたスキルは `install --force` も拒否するため、ローカルのバイト列が誤って置き換えられることはありません。

### `unpin <slug>`

- インストール済みのスキルから lockfile のピン留めを削除し、以後の更新で変更できるようにします。

### `update [slug]` / `update --all`

- ローカルファイルからフィンガープリントを計算します。
- フィンガープリントが既知のバージョンと一致する場合: プロンプトは表示されません。
- フィンガープリントが一致しない場合:
  - デフォルトでは拒否します
  - `--force` で上書きします（または対話環境ではプロンプト）
- ピン留めされたスキルは、`--force` でも更新されません。
- `update <slug>` はピン留めされた slug では即座に失敗し、先に `clawhub unpin <slug>` を実行するよう伝えます。
- `update --all` はピン留めされた slug をスキップし、固定されたままのものの概要を出力します。

### `skill publish <path>`

- `POST /api/v1/skills`（multipart）経由で公開します。
- semver が必要です: `--version 1.2.3`。
- `--owner <handle>` は、アクターが公開者アクセス権を持つ場合に、
  org/user 公開者ハンドルの下で公開します。
- `--migrate-owner` は、新しいバージョンを公開しながら既存のスキルを `--owner` に移動します。
  両方の公開者で admin/owner アクセス権が必要です。
- owner とレビューの動作は `docs/publishing.md` で説明されています。
- スキルを公開すると、ClawHub 上で `MIT-0` の下にリリースされます。
- 公開されたスキルは、帰属表示なしで自由に使用、変更、再配布できます。
- ClawHub は有料スキルやスキルごとの価格設定をサポートしていません。
- `--clawscan-note <text>` は ClawScan note を追加します。この note は、ネットワークアクセス、
  ネイティブホストアクセス、プロバイダー固有の認証情報など、通常とは異なって見える可能性のある動作について、
  ClawScan にコンテキストを提供します。この note は公開されたバージョンに保存されます。
- レガシーエイリアス: `publish <path>`。

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- スキルをソフト削除します（owner、moderator、または admin）。
- `DELETE /api/v1/skills/{slug}` を呼び出します。
- owner によるソフト削除では slug が 30 日間予約されます。このコマンドは有効期限を出力します。
- `--reason <text>` は、スキルと監査ログに moderation note を記録します。
- `--note <text>` は `--reason` のエイリアスです。
- `--yes` は確認をスキップします。

### `undelete <slug>`

- 非表示のスキルを復元します（owner、moderator、または admin）。
- `POST /api/v1/skills/{slug}/undelete` を呼び出します。
- `--reason <text>` は、スキルと監査ログに moderation note を記録します。
- `--note <text>` は `--reason` のエイリアスです。
- `--yes` は確認をスキップします。

### `hide <slug>`

- スキルを非表示にします（owner、moderator、または admin）。
- `delete` のエイリアスです。

### `unhide <slug>`

- スキルの非表示を解除します（owner、moderator、または admin）。
- `undelete` のエイリアスです。

### `skill rename <slug> <new-slug>`

- 所有しているスキルの名前を変更し、以前の slug をリダイレクトエイリアスとして保持します。
- `POST /api/v1/skills/{slug}/rename` を呼び出します。
- `--yes` は確認をスキップします。

### `skill merge <source-slug> <target-slug>`

- 所有しているスキルを、所有している別のスキルにマージします。
- ソース slug は公開一覧に表示されなくなり、ターゲットへのリダイレクトエイリアスになります。
- `POST /api/v1/skills/{sourceSlug}/merge` を呼び出します。
- `--yes` は確認をスキップします。

### `transfer`

- 所有権移譲ワークフローです。
- ユーザーハンドルへの移譲では、受信者が承認する保留中のリクエストを作成します。
- org/publisher ハンドルへの移譲は、アクターが現在の owner と移譲先の公開者の両方に
  admin アクセス権を持つ場合にのみ即時適用されます。
- サブコマンド:
  - `transfer request <slug> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <slug> [--yes]`
  - `transfer reject <slug> [--yes]`
  - `transfer cancel <slug> [--yes]`
- エンドポイント:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- `GET /api/v1/packages` と `GET /api/v1/packages/search` 経由で、統合パッケージカタログを閲覧または検索します。
- plugins とその他のパッケージファミリーエントリにはこれを使用してください。トップレベルの `search` は引き続きスキル検索サーフェスです。
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
- plugin メタデータ、互換性、検証、ソース、バージョン/ファイルの調査にはこれを使用してください。
- `--version <version>`: 特定のバージョンを調査します（デフォルト: latest）。
- `--tag <tag>`: タグ付きバージョンを調査します（例: `latest`）。
- `--versions`: バージョン履歴を一覧表示します（最初のページ）。
- `--limit <n>`: 一覧表示する最大バージョン数（1-100）。
- `--files`: 選択したバージョンのファイルを一覧表示します。
- `--file <path>`: 生のファイル内容を取得します（テキストファイルのみ、200KB 制限）。
- `--json`: 機械可読の出力です。

### `package download <name>`

- `GET /api/v1/packages/{name}/versions/{version}/artifact` 経由で
  パッケージバージョンを解決します。
- resolver の `downloadUrl` からアーティファクトをダウンロードします。
- すべてのアーティファクトについて ClawHub SHA-256 を検証します。
- ClawPack npm-pack アーティファクトでは、npm `sha512` integrity、
  npm shasum、tarball の `package.json` name/version も検証します。
- レガシー ZIP バージョンはレガシー ZIP ルート経由でダウンロードされます。
- フラグ:
  - `--version <version>`: 特定のバージョンをダウンロードします。
  - `--tag <tag>`: タグ付きバージョンをダウンロードします（デフォルト: `latest`）。
  - `-o, --output <path>`: 出力ファイルまたはディレクトリ。
  - `--force`: 既存の出力ファイルを上書きします。
  - `--json`: 機械可読の出力です。

例:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- ローカルアーティファクトについて ClawHub SHA-256、npm `sha512` integrity、npm shasum を計算します。
- `--package` を指定すると、ClawHub から期待されるメタデータを解決し、
  ローカルファイルを公開済みアーティファクトメタデータと比較します。
- 直接 digest フラグを指定すると、ネットワーク参照なしで検証します。
- フラグ:
  - `--package <name>`: 期待されるアーティファクトメタデータを解決するパッケージ名。
  - `--version <version>` または `--tag <tag>`: 期待されるパッケージバージョン。
  - `--sha256 <hex>`: 期待される ClawHub SHA-256。
  - `--npm-integrity <sri>`: 期待される npm integrity。
  - `--npm-shasum <sha1>`: 期待される npm shasum。
  - `--json`: 機械可読の出力です。

例:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- パッケージとすべてのリリースをソフト削除します。
- パッケージ所有者、org パブリッシャーの所有者/admin、プラットフォームモデレーター、
  またはプラットフォーム admin が必要です。
- フラグ:
  - `--yes`: 確認をスキップします。
  - `--json`: 機械可読出力。

例:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- ソフト削除されたパッケージとリリースを復元します。
- パッケージ所有者、org パブリッシャーの所有者/admin、プラットフォームモデレーター、
  またはプラットフォーム admin が必要です。
- `POST /api/v1/packages/{name}/undelete` を呼び出します。
- フラグ:
  - `--yes`: 確認をスキップします。
  - `--json`: 機械可読出力。

例:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- パッケージを別のパブリッシャーに移管します。
- プラットフォーム admin が実行する場合を除き、現在のパッケージ所有者と移管先
  パブリッシャーの両方への admin アクセスが必要です。
- スコープ付きパッケージ名は、一致するスコープ所有者へ移管する必要があります。
- `POST /api/v1/packages/{name}/transfer` を呼び出します。
- フラグ:
  - `--to <owner>`: 移管先パブリッシャーハンドル。
  - `--reason <text>`: 任意の監査理由。
  - `--json`: 機械可読出力。

例:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- パッケージをモデレーターに報告するための認証済みコマンドです。
- `POST /api/v1/packages/{name}/report` を呼び出します。
- 報告はパッケージ単位で、任意でバージョンに紐づけられ、
  レビューのためにモデレーターに表示されます。
- 報告自体は、パッケージを自動的に非表示にしたりダウンロードをブロックしたりしません。
- フラグ:
  - `--version <version>`: 報告に紐づける任意のパッケージバージョン。
  - `--reason <text>`: 必須の報告理由。
  - `--json`: 機械可読出力。

例:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- パッケージのモデレーション可視性を確認する所有者向けコマンドです。
- `GET /api/v1/packages/{name}/moderation` を呼び出します。
- 現在のパッケージスキャン状態、未解決の報告数、最新リリースの手動
  モデレーション状態、ダウンロードブロック状態、モデレーション理由を表示します。
- フラグ:
  - `--json`: 機械可読出力。

例:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- パッケージが将来の OpenClaw での利用に対応できているか確認します。
- `GET /api/v1/packages/{name}/readiness` を呼び出します。
- 公式ステータス、ClawPack の可用性、アーティファクトダイジェスト、
  ソース来歴、OpenClaw 互換性、ホストターゲット、環境メタデータ、
  スキャン状態に関するブロッカーを報告します。
- フラグ:
  - `--json`: 機械可読出力。

例:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- バンドル済み OpenClaw plugin を置き換える可能性があるパッケージについて、
  オペレーター向けの移行状態を表示します。
- `package readiness` と同じ算出済み readiness エンドポイントを呼び出しますが、
  移行に焦点を当てたステータス、最新バージョン、公式パッケージ状態、チェック、
  ブロッカーを出力します。
- フラグ:
  - `--json`: 機械可読出力。

例:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- `POST /api/v1/packages` 経由でコード plugin またはバンドル plugin を公開します。
- `<source>` は次を受け付けます:
  - ローカルフォルダーパス: `./my-plugin`
  - ローカル ClawPack npm-pack tarball: `./my-plugin-1.2.3.tgz`
  - GitHub repo: `owner/repo` または `owner/repo@ref`
  - GitHub URL: `https://github.com/owner/repo`
- メタデータは、`package.json`、`openclaw.plugin.json`、
  `.codex-plugin/plugin.json`、`.claude-plugin/plugin.json`、`.cursor-plugin/plugin.json`
  などの実際の OpenClaw バンドルマーカーから自動検出されます。
- `.tgz` ソースは ClawPack として扱われます。CLI は正確な npm-pack
  バイト列をアップロードし、展開された `package/` の内容は検証と
  メタデータの事前入力にのみ使用します。
- コード plugin フォルダーは、アップロード前に ClawPack npm tarball に
  パックされるため、OpenClaw インストールは正確なアーティファクトを検証できます。
  バンドル plugin フォルダーは引き続き展開ファイルの公開パスを使用します。
- GitHub ソースでは、ソース帰属が repo、解決済みコミット、ref、サブパスから自動入力されます。
- ローカルフォルダーでは、origin remote が GitHub を指している場合、ソース帰属がローカル git から自動検出されます。
- 外部コード plugin は `openclaw.compat.pluginApi` と
  `openclaw.build.openclawVersion` を明示的に宣言する必要があります。
  トップレベルの `package.json.version` は公開検証のフォールバックとして使用されません。
- `--dry-run` は、アップロードせずに解決済みの公開ペイロードをプレビューします。
- `--json` は CI 向けに機械可読出力を出力します。
- `--owner <handle>` は、アクターがパブリッシャーアクセスを持つ場合に、ユーザーまたは org パブリッシャーハンドル配下で公開します。
- `--clawscan-note <text>` は ClawScan メモを追加します。このメモは、ネットワークアクセス、
  ネイティブホストアクセス、プロバイダー固有の認証情報など、通常とは異なって見える可能性がある挙動について
  ClawScan にコンテキストを提供します。このメモは公開されたリリースに保存されます。
- スコープ付きパッケージ名は選択された所有者と一致する必要があります。`docs/publishing.md` を参照してください。
- 既存のフラグ (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) は引き続き上書きとして機能します。
- プライベート GitHub repo には `GITHUB_TOKEN` が必要です。

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### 推奨されるローカルフロー

ライブリリースを作成する前に、解決済みのパッケージメタデータと
ソース帰属を確認できるよう、まず `--dry-run` を使用します:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### ローカルフォルダーフロー

コード plugin では、フォルダー公開はパッケージフォルダーから ClawPack
アーティファクトをビルドしてアップロードします:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` 向けの最小 `package.json`

外部コード plugin には、`package.json` 内に少量の OpenClaw メタデータが必要です。
この最小マニフェストで公開を成功させるには十分です:

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

- `package.json.version` はパッケージリリースバージョンですが、
  OpenClaw の互換性/ビルド検証のフォールバックとしては使用されません。
- `openclaw.hostTargets` と `openclaw.environment` は任意のメタデータです。
  存在する場合、ClawHub はそれらを表示することがありますが、公開には必須ではありません。
- `openclaw.compat.minGatewayVersion` と
  `openclaw.build.pluginSdkVersion` は、より詳細な互換性メタデータを公開したい場合の任意の追加項目です。
- 古い `clawhub` CLI リリースを使用している場合は、アップロード前にローカルのプリフライトチェックが実行されるよう、
  公開前にアップグレードしてください。

#### GitHub Actions

ClawHub は plugin repo 向けに、公式の再利用可能 workflow も
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/be77f0626d9e4b52c465670ba411882be1ac3a2d/.github/workflows/package-publish.yml)
で提供しています。

典型的な呼び出し元設定:

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

- 再利用可能 workflow は、デフォルトで `source` を呼び出し元 repo にします。
- monorepo では、workflow が plugin
  パッケージフォルダーを公開するように `source_path` を渡します。たとえば `source_path: extensions/codex` です。
- 再利用可能 workflow は安定版タグまたは完全なコミット SHA に固定してください。`@main` からリリース公開を実行しないでください。
- CI が汚染されないよう、`pull_request` では `dry_run: true` を使用する必要があります。
- 実際の公開は、`workflow_dispatch` やタグ push などの信頼されたイベントに限定する必要があります。
- シークレットなしの信頼済み公開は `workflow_dispatch` でのみ機能します。タグ push には引き続き `clawhub_token` が必要です。
- 初回公開、信頼されていないパッケージ、または緊急時の公開に備えて `clawhub_token` を利用可能にしておいてください。
- workflow は JSON 結果をアーティファクトとしてアップロードし、workflow 出力として公開します。

### `sync`

- ローカル skill フォルダーをスキャンし、新規または変更されたものを公開します。
- ルートには任意のフォルダーを指定できます。skills ディレクトリ、または `SKILL.md` を持つ単一の skill フォルダーです。
- `~/.clawdbot/clawdbot.json` が存在する場合、Clawdbot skill ルートを自動追加します:
  - `agent.workspace/skills` (メインエージェント)
  - `routing.agents.*.workspace/skills` (エージェントごと)
  - `~/.clawdbot/skills` (共有)
  - `skills.load.extraDirs` (共有パック)
- `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` と `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR` を尊重します。
- フラグ:
  - `--root <dir...>` 追加のスキャンルート
  - `--all` 確認なしでアップロード
  - `--dry-run` プランのみ表示
  - `--bump patch|minor|major` (デフォルト: patch)
  - `--changelog <text>` (非対話)
  - `--tags a,b,c` (デフォルト: latest)
  - `--concurrency <n>` (デフォルト: 4)

テレメトリー:

- ログイン中に `sync` 実行時、`CLAWHUB_DISABLE_TELEMETRY=1` (レガシー `CLAWDHUB_DISABLE_TELEMETRY=1`) が設定されていない限り送信されます。
- 詳細: `docs/telemetry.md`。

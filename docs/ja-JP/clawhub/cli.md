---
read_when:
    - ClawHub CLI の使用
    - インストール、更新、公開、同期のデバッグ
summary: 'CLI リファレンス: コマンド、フラグ、設定、ロックファイル、同期の挙動。'
x-i18n:
    generated_at: "2026-05-12T23:28:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: f3600e5539372490924ee884c03d2417b80d25aab519d8260897b2268c2f7b46
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

- `--workdir <dir>`: 作業ディレクトリ（デフォルト: cwd。設定されている場合は Clawdbot ワークスペースにフォールバック）
- `--dir <dir>`: workdir 配下のインストールディレクトリ（デフォルト: `skills`）
- `--site <url>`: ブラウザログイン用のベース URL（デフォルト: `https://clawhub.ai`）
- `--registry <url>`: API ベース URL（デフォルト: 検出された値、それ以外は `https://clawhub.ai`）
- `--no-input`: プロンプトを無効化

環境変数の対応値:

- `CLAWHUB_SITE`（レガシー `CLAWDHUB_SITE`）
- `CLAWHUB_REGISTRY`（レガシー `CLAWDHUB_REGISTRY`）
- `CLAWHUB_WORKDIR`（レガシー `CLAWDHUB_WORKDIR`）

### HTTP プロキシ

CLI は、企業プロキシや制限されたネットワークの背後にあるシステム向けに、標準の HTTP プロキシ環境変数に従います。

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

これらの変数のいずれかが設定されている場合、CLI は指定されたプロキシ経由でアウトバウンドリクエストをルーティングします。`HTTPS_PROXY` は HTTPS リクエストに、`HTTP_PROXY` は通常の HTTP に使用されます。`NO_PROXY` / `no_proxy` は、特定のホストまたはドメインについてプロキシをバイパスするために尊重されます。

これは、直接のアウトバウンド接続がブロックされているシステム（例: Docker コンテナ、プロキシ専用インターネットの Hetzner VPS、企業ファイアウォール）で必要です。

例:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

プロキシ変数が設定されていない場合、動作は変わりません（直接接続）。

## 設定ファイル

API トークンとキャッシュされたレジストリ URL を保存します。

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` または `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- レガシーフォールバック: `clawhub/config.json` がまだ存在せず、`clawdhub/config.json` が存在する場合、CLI はレガシーパスを再利用します
- 上書き: `CLAWHUB_CONFIG_PATH`（レガシー `CLAWDHUB_CONFIG_PATH`）

## コマンド

### `login` / `auth login`

- デフォルト: ブラウザで `<site>/cli/auth` を開き、loopback コールバック経由で完了します。
- ヘッドレス: `clawhub login --token clh_...`
- リモート/ヘッドレス対話型: `clawhub login --device` はコードを表示し、`<site>/cli/device` で認可するまで待機します。

### `whoami`

- `/api/v1/whoami` 経由で保存済みトークンを検証します。

### `star <slug>` / `unstar <slug>`

- ハイライトに skill を追加/削除します。
- `POST /api/v1/stars/<slug>` と `DELETE /api/v1/stars/<slug>` を呼び出します。
- `--yes` は確認をスキップします。

### `search <query...>`

- `/api/v1/search?q=...` を呼び出します。
- 検索では、ダウンロード人気度よりも先に、完全一致する slug/name トークンが優先されます。`map` のような単独の slug トークンは、`amap` 内の部分文字列よりも `personal-map` に強く一致します。
- ダウンロード数は小さな人気度の事前要因であり、上位配置を保証するものではありません。
- 表示されるべき skill が表示されない場合は、メタデータの名前変更前に、ログインした状態で `clawhub inspect <slug>` を実行して、所有者に表示されるモデレーション診断を確認してください。

### `explore`

- `/api/v1/skills?limit=...&sort=createdAt` 経由で最新の skills を一覧表示します（`createdAt` の降順でソート）。
- フラグ:
  - `--limit <n>`（1-200、デフォルト: 25）
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending`（デフォルト: newest）
  - `--json`（機械可読出力）
- 出力: `<slug>  v<version>  <age>  <summary>`（summary は 50 文字に切り詰め）。

### `inspect <slug>`

- インストールせずに skill メタデータとバージョンファイルを取得します。
- `--version <version>`: 特定のバージョンを調査します（デフォルト: latest）。
- `--tag <tag>`: タグ付きバージョンを調査します（例: `latest`）。
- `--versions`: バージョン履歴を一覧表示します（最初のページ）。
- `--limit <n>`: 一覧表示する最大バージョン数（1-200）。
- `--files`: 選択したバージョンのファイルを一覧表示します。
- `--file <path>`: 生のファイル内容を取得します（テキストファイルのみ、200KB 制限）。
- `--json`: 機械可読出力。

### `install <slug>`

- `/api/v1/skills/<slug>` 経由で最新バージョンを解決します。
- `/api/v1/download` 経由で zip をダウンロードします。
- `<workdir>/<dir>/<slug>` に展開します。
- ピン留めされた skills の上書きを拒否します。先に `clawhub unpin <slug>` を実行してください。
- 書き込み先:
  - `<workdir>/.clawhub/lock.json`（レガシー `.clawdhub`）
  - `<skill>/.clawhub/origin.json`（レガシー `.clawdhub`）

### `uninstall <slug>`

- `<workdir>/<dir>/<slug>` を削除し、ロックファイルのエントリを削除します。
- 対話型: 確認を求めます。
- 非対話型（`--no-input`）: `--yes` が必要です。

### `list`

- `<workdir>/.clawhub/lock.json`（レガシー `.clawdhub`）を読み取ります。
- `clawhub pin` で固定された Skills の横に、任意の理由を含めて `pinned` を表示します。

### `pin <slug>`

- インストール済みの Skill を lockfile で pinned としてマークします。
- `--reason <text>` は、その Skill を固定する理由を記録します。
- 固定された Skills は `update --all` でスキップされ、直接の `update <slug>` は拒否されます。
- 固定された Skills は `install --force` も拒否するため、ローカルのバイト列が誤って置き換えられることはありません。

### `unpin <slug>`

- インストール済み Skill から lockfile の pin を削除し、今後の更新で変更できるようにします。

### `update [slug]` / `update --all`

- ローカルファイルからフィンガープリントを計算します。
- フィンガープリントが既知のバージョンと一致する場合: プロンプトは表示されません。
- フィンガープリントが一致しない場合:
  - デフォルトでは拒否します
  - `--force` で上書きします（対話モードの場合はプロンプト）
- 固定された Skills は `--force` でも更新されません。
- `update <slug>` は固定された slug に対してすぐに失敗し、先に `clawhub unpin <slug>` を実行するよう伝えます。
- `update --all` は固定された slug をスキップし、固定されたままの項目の概要を出力します。

### `skill publish <path>`

- `POST /api/v1/skills`（multipart）経由で公開します。
- semver が必要です: `--version 1.2.3`。
- `--owner <handle>` は、アクターが publisher アクセス権を持つ場合に、org/user publisher handle の下で公開します。
- `--migrate-owner` は、新しいバージョンの公開時に既存の Skill を `--owner` に移動します。両方の publisher に対する admin/owner アクセスが必要です。
- owner とレビューの動作は `docs/publishing.md` で説明されています。
- Skill を公開すると、ClawHub 上で `MIT-0` のもとにリリースされます。
- 公開済み Skills は、帰属表示なしで自由に使用、変更、再配布できます。
- ClawHub は有料 Skills や Skill ごとの価格設定をサポートしていません。
- `--clawscan-note <text>` は ClawScan note を追加します。この note は、ネットワークアクセス、ネイティブホストアクセス、プロバイダー固有の認証情報など、通常とは異なって見える可能性がある動作について ClawScan にコンテキストを提供します。この note は公開されたバージョンに保存されます。
- レガシーエイリアス: `publish <path>`。

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- Skill をソフト削除します（owner、moderator、または admin）。
- `DELETE /api/v1/skills/{slug}` を呼び出します。
- owner が開始したソフト削除では slug が 30 日間予約され、コマンドは期限時刻を出力します。
- `--reason <text>` は Skill と監査ログに moderation note を記録します。
- `--note <text>` は `--reason` のエイリアスです。
- `--yes` は確認をスキップします。

### `undelete <slug>`

- 非表示の Skill を復元します（owner、moderator、または admin）。
- `POST /api/v1/skills/{slug}/undelete` を呼び出します。
- `--reason <text>` は Skill と監査ログに moderation note を記録します。
- `--note <text>` は `--reason` のエイリアスです。
- `--yes` は確認をスキップします。

### `hide <slug>`

- Skill を非表示にします（owner、moderator、または admin）。
- `delete` のエイリアスです。

### `unhide <slug>`

- Skill の非表示を解除します（owner、moderator、または admin）。
- `undelete` のエイリアスです。

### `skill rename <slug> <new-slug>`

- 所有している Skill の名前を変更し、以前の slug をリダイレクトエイリアスとして保持します。
- `POST /api/v1/skills/{slug}/rename` を呼び出します。
- `--yes` は確認をスキップします。

### `skill merge <source-slug> <target-slug>`

- 所有している 1 つの Skill を、所有している別の Skill にマージします。
- source slug は公開一覧に表示されなくなり、target へのリダイレクトエイリアスになります。
- `POST /api/v1/skills/{sourceSlug}/merge` を呼び出します。
- `--yes` は確認をスキップします。

### `transfer`

- 所有権移譲ワークフローです。
- user handle への移譲は、受信者が承認する保留中のリクエストを作成します。
- org/publisher handle への移譲は、アクターが現在の owner と移譲先 publisher の両方に admin アクセスを持つ場合にのみ、即時に適用されます。
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
- これは plugins やその他の package-family エントリに使用します。トップレベルの `search` は引き続き Skill 検索サーフェスです。
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
- `--json`: 機械可読出力。

### `package download <name>`

- `GET /api/v1/packages/{name}/versions/{version}/artifact` 経由でパッケージバージョンを解決します。
- resolver の `downloadUrl` から artifact をダウンロードします。
- すべての artifact について ClawHub SHA-256 を検証します。
- ClawPack npm-pack artifact については、npm `sha512` integrity、npm shasum、および tarball の `package.json` name/version も検証します。
- レガシー ZIP バージョンはレガシー ZIP ルート経由でダウンロードします。
- フラグ:
  - `--version <version>`: 特定のバージョンをダウンロードします。
  - `--tag <tag>`: タグ付きバージョンをダウンロードします（デフォルト: `latest`）。
  - `-o, --output <path>`: 出力ファイルまたはディレクトリ。
  - `--force`: 既存の出力ファイルを上書きします。
  - `--json`: 機械可読出力。

例:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- ローカル artifact について、ClawHub SHA-256、npm `sha512` integrity、npm shasum を計算します。
- `--package` を指定すると、ClawHub から期待されるメタデータを解決し、ローカルファイルを公開済み artifact メタデータと比較します。
- 直接 digest フラグを指定すると、ネットワーク lookup なしで検証します。
- フラグ:
  - `--package <name>`: 期待される artifact メタデータを解決するパッケージ名。
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

### `package delete <name>`

- パッケージとすべてのリリースをソフト削除します。
- パッケージ所有者、組織パブリッシャーの所有者/管理者、プラットフォームモデレーター、
  またはプラットフォーム管理者が必要です。
- フラグ:
  - `--yes`: 確認をスキップします。
  - `--json`: 機械可読出力。

例:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- ソフト削除されたパッケージとリリースを復元します。
- パッケージ所有者、組織パブリッシャーの所有者/管理者、プラットフォームモデレーター、
  またはプラットフォーム管理者が必要です。
- `POST /api/v1/packages/{name}/undelete` を呼び出します。
- フラグ:
  - `--yes`: 確認をスキップします。
  - `--json`: 機械可読出力。

例:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- パッケージを別のパブリッシャーへ移管します。
- プラットフォーム管理者が実行する場合を除き、現在のパッケージ所有者と移管先
  パブリッシャーの両方への管理者アクセスが必要です。
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

- モデレーターへパッケージを報告するための認証済みコマンドです。
- `POST /api/v1/packages/{name}/report` を呼び出します。
- 報告はパッケージ単位で、任意でバージョンに紐づけられ、レビューのため
  モデレーターに表示されます。
- 報告自体がパッケージを自動的に非表示にしたり、ダウンロードをブロックしたりすることはありません。
- フラグ:
  - `--version <version>`: 報告に添付する任意のパッケージバージョン。
  - `--reason <text>`: 必須の報告理由。
  - `--json`: 機械可読出力。

例:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- パッケージのモデレーション表示状態を確認する所有者向けコマンドです。
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

- パッケージが将来の OpenClaw 利用に対応できる状態かどうかを確認します。
- `GET /api/v1/packages/{name}/readiness` を呼び出します。
- 公式ステータス、ClawPack の利用可否、アーティファクトダイジェスト、
  ソース来歴、OpenClaw 互換性、ホストターゲット、環境メタデータ、
  スキャン状態に関するブロッカーを報告します。
- フラグ:
  - `--json`: 機械可読出力。

例:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- バンドル済み OpenClaw Plugin を置き換える可能性があるパッケージについて、
  オペレーター向けの移行状態を表示します。
- `package readiness` と同じ計算済み readiness エンドポイントを呼び出しますが、
  移行に焦点を当てた状態、最新バージョン、公式パッケージ状態、チェック、
  ブロッカーを出力します。
- フラグ:
  - `--json`: 機械可読出力。

例:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- `POST /api/v1/packages` 経由でコードPluginまたはバンドルPluginを公開します。
- `<source>` は次を受け付けます:
  - ローカルフォルダーパス: `./my-plugin`
  - ローカル ClawPack npm-pack tarball: `./my-plugin-1.2.3.tgz`
  - GitHub リポジトリ: `owner/repo` または `owner/repo@ref`
  - GitHub URL: `https://github.com/owner/repo`
- メタデータは `package.json`、`openclaw.plugin.json`、および
  `.codex-plugin/plugin.json`、`.claude-plugin/plugin.json`、`.cursor-plugin/plugin.json`
  などの実際の OpenClaw バンドルマーカーから自動検出されます。
- `.tgz` ソースは ClawPack として扱われます。CLI は正確な npm-pack
  バイトをアップロードし、抽出された `package/` の内容は検証と
  メタデータ事前入力にのみ使用します。
- コードPluginフォルダーはアップロード前に ClawPack npm tarball へパックされるため、
  OpenClaw インストールは正確なアーティファクトを検証できます。バンドルPluginフォルダーは引き続き
  抽出ファイルの公開パスを使用します。
- GitHub ソースでは、ソース帰属がリポジトリ、解決済みコミット、ref、サブパスから自動入力されます。
- ローカルフォルダーでは、origin リモートが GitHub を指している場合、ソース帰属がローカル git から自動検出されます。
- 外部コードPluginは `openclaw.compat.pluginApi` と
  `openclaw.build.openclawVersion` を明示的に宣言する必要があります。
  トップレベルの `package.json.version` は公開検証のフォールバックとして使用されません。
- `--dry-run` は、アップロードせずに解決済み公開ペイロードをプレビューします。
- `--json` は CI 向けに機械可読出力を生成します。
- `--owner <handle>` は、アクターにパブリッシャーアクセスがある場合、ユーザーまたは組織のパブリッシャーハンドル配下で公開します。
- `--clawscan-note <text>` は ClawScan ノートを追加します。このノートは ClawScan に、
  ネットワークアクセス、ネイティブホストアクセス、プロバイダー固有の認証情報など、
  通常とは異なって見える可能性がある動作のコンテキストを提供します。このノートは
  公開されたリリースに保存されます。
- スコープ付きパッケージ名は選択した所有者と一致する必要があります。`docs/publishing.md` を参照してください。
- 既存のフラグ (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) は引き続き上書きとして機能します。
- プライベート GitHub リポジトリには `GITHUB_TOKEN` が必要です。

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### 推奨されるローカルフロー

まず `--dry-run` を使用して、ライブリリースを作成する前に解決済みパッケージメタデータと
ソース帰属を確認します:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### ローカルフォルダーフロー

コードPluginでは、フォルダー公開はパッケージフォルダーから ClawPack アーティファクトをビルドしてアップロードします:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` 用の最小 `package.json`

外部コードPluginには、`package.json` 内に少量の OpenClaw メタデータが必要です。
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

- `package.json.version` はパッケージのリリースバージョンですが、OpenClaw
  互換性/ビルド検証のフォールバックとしては使用されません。
- `openclaw.hostTargets` と `openclaw.environment` は任意のメタデータです。
  存在する場合、ClawHub が表示することがありますが、公開には必須ではありません。
- `openclaw.compat.minGatewayVersion` と
  `openclaw.build.pluginSdkVersion` は、より詳細な互換性メタデータを公開したい場合の任意の追加項目です。
- 古い `clawhub` CLI リリースを使用している場合は、アップロード前にローカルのプリフライトチェックが実行されるよう、
  公開前にアップグレードしてください。

#### GitHub Actions

ClawHub は Plugin リポジトリ向けに、公式の再利用可能ワークフローも
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/af96221ebb197e2af09f44870046ced4ded4aea0/.github/workflows/package-publish.yml)
で提供しています。

典型的な呼び出し側セットアップ:

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

- 再利用可能ワークフローは、既定で `source` を呼び出し側リポジトリに設定します。
- モノレポでは、ワークフローが Plugin パッケージフォルダーを公開するよう `source_path` を渡します。
  例: `source_path: extensions/codex`。
- 再利用可能ワークフローは安定版タグまたは完全なコミット SHA に固定してください。`@main` からリリース公開を実行しないでください。
- `pull_request` は `dry_run: true` を使用して、CI が汚染されないようにしてください。
- 実際の公開は、`workflow_dispatch` やタグプッシュなど信頼済みイベントに限定してください。
- シークレットなしの信頼済み公開は `workflow_dispatch` でのみ機能します。タグプッシュには引き続き `clawhub_token` が必要です。
- 初回公開、未信頼パッケージ、または緊急公開のために `clawhub_token` を利用可能にしておいてください。
- ワークフローは JSON 結果をアーティファクトとしてアップロードし、ワークフロー出力として公開します。

### `sync`

- ローカルの Skill フォルダーをスキャンし、新規または変更済みのものを公開します。
- ルートには任意のフォルダーを指定できます。Skills ディレクトリ、または `SKILL.md` を持つ単一の Skill フォルダーです。
- `~/.clawdbot/clawdbot.json` が存在する場合、Clawdbot Skill ルートを自動追加します:
  - `agent.workspace/skills` (メインエージェント)
  - `routing.agents.*.workspace/skills` (エージェントごと)
  - `~/.clawdbot/skills` (共有)
  - `skills.load.extraDirs` (共有パック)
- `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` と `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR` を尊重します。
- フラグ:
  - `--root <dir...>` 追加のスキャンルート
  - `--all` プロンプトなしでアップロード
  - `--dry-run` 計画のみを表示
  - `--bump patch|minor|major` (既定: patch)
  - `--changelog <text>` (非対話)
  - `--tags a,b,c` (既定: latest)
  - `--concurrency <n>` (既定: 4)

テレメトリ:

- ログイン中の `sync` 実行時に送信されます。ただし `CLAWHUB_DISABLE_TELEMETRY=1` (レガシー `CLAWDHUB_DISABLE_TELEMETRY=1`) の場合を除きます。
- 詳細: `docs/telemetry.md`。

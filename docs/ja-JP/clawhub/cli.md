---
read_when:
    - ClawHub CLI の使用
    - インストール、更新、公開、同期のデバッグ
summary: 'CLI リファレンス: コマンド、フラグ、設定、ロックファイル、同期動作。'
x-i18n:
    generated_at: "2026-05-11T22:19:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: abbe12a07f8947f8c65ba6eaae6fa6ff7fb8bfb12fbcb339abccd12225a2e791
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
- `--registry <url>`: API ベース URL (デフォルト: 検出されたもの、それ以外は `https://clawhub.ai`)
- `--no-input`: プロンプトを無効化

同等の環境変数:

- `CLAWHUB_SITE` (レガシー `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (レガシー `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (レガシー `CLAWDHUB_WORKDIR`)

### HTTP プロキシ

CLI は、企業プロキシや制限されたネットワークの背後にあるシステム向けに、標準の HTTP プロキシ環境変数に従います。

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

これらの変数のいずれかが設定されている場合、CLI は送信リクエストを指定されたプロキシ経由でルーティングします。HTTPS リクエストには `HTTPS_PROXY` が使用され、プレーン HTTP には `HTTP_PROXY` が使用されます。特定のホストまたはドメインでプロキシをバイパスするために、`NO_PROXY` / `no_proxy` が尊重されます。

これは、直接の送信接続がブロックされているシステムで必要です (例: Docker コンテナ、プロキシ専用インターネットの Hetzner VPS、企業ファイアウォール)。

例:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

プロキシ変数が設定されていない場合、動作は変更されません (直接接続)。

## 設定ファイル

API トークンとキャッシュされたレジストリ URL を保存します。

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` または `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- レガシーフォールバック: `clawhub/config.json` がまだ存在せず、`clawdhub/config.json` が存在する場合、CLI はレガシーパスを再利用します
- オーバーライド: `CLAWHUB_CONFIG_PATH` (レガシー `CLAWDHUB_CONFIG_PATH`)

## コマンド

### `login` / `auth login`

- デフォルト: ブラウザで `<site>/cli/auth` を開き、loopback コールバック経由で完了します。
- ヘッドレス: `clawhub login --token clh_...`
- リモート/ヘッドレス対話式: `clawhub login --device` はコードを出力し、`<site>/cli/device` で認可する間待機します。

### `whoami`

- `/api/v1/whoami` 経由で保存済みトークンを検証します。

### `star <slug>` / `unstar <slug>`

- ハイライトにスキルを追加/削除します。
- `POST /api/v1/stars/<slug>` と `DELETE /api/v1/stars/<slug>` を呼び出します。
- `--yes` は確認をスキップします。

### `search <query...>`

- `/api/v1/search?q=...` を呼び出します。
- 検索では、ダウンロード人気度よりも先に、slug/name トークンの完全一致が優先されます。`map` のような単独の slug トークンは、`amap` 内の部分文字列よりも `personal-map` に強く一致します。
- ダウンロード数は小さな人気度の事前情報であり、上位表示を保証するものではありません。
- スキルが表示されるべきなのに表示されない場合は、メタデータ名を変更する前に、ログインした状態で `clawhub inspect <slug>` を実行し、所有者に表示されるモデレーション診断を確認します。

### `explore`

- `/api/v1/skills?limit=...&sort=createdAt` 経由で最新のスキルを一覧表示します (`createdAt` の降順でソート)。
- フラグ:
  - `--limit <n>` (1-200、デフォルト: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (デフォルト: newest)
  - `--json` (機械可読出力)
- 出力: `<slug>  v<version>  <age>  <summary>` (summary は 50 文字に切り詰め)。

### `inspect <slug>`

- インストールせずにスキルのメタデータとバージョンファイルを取得します。
- `--version <version>`: 特定のバージョンを調べます (デフォルト: 最新)。
- `--tag <tag>`: タグ付けされたバージョンを調べます (例: `latest`)。
- `--versions`: バージョン履歴を一覧表示します (最初のページ)。
- `--limit <n>`: 一覧表示する最大バージョン数 (1-200)。
- `--files`: 選択したバージョンのファイルを一覧表示します。
- `--file <path>`: 生のファイル内容を取得します (テキストファイルのみ、200KB 制限)。
- `--json`: 機械可読出力。

### `install <slug>`

- `/api/v1/skills/<slug>` 経由で最新バージョンを解決します。
- `/api/v1/download` 経由で zip をダウンロードします。
- `<workdir>/<dir>/<slug>` に展開します。
- ピン留めされたスキルの上書きを拒否します。先に `clawhub unpin <slug>` を実行してください。
- 書き込み先:
  - `<workdir>/.clawhub/lock.json` (レガシー `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (レガシー `.clawdhub`)

### `uninstall <slug>`

- `<workdir>/<dir>/<slug>` を削除し、lockfile エントリを削除します。
- 対話式: 確認を求めます。
- 非対話式 (`--no-input`): `--yes` が必要です。

### `list`

- `<workdir>/.clawhub/lock.json`（従来の `.clawdhub`）を読み取ります。
- `clawhub pin` で凍結されたスキルの横に `pinned` を表示し、任意の理由も含めます。

### `pin <slug>`

- インストール済みスキルをロックファイル内でピン留め済みとしてマークします。
- `--reason <text>` はスキルが凍結されている理由を記録します。
- ピン留めされたスキルは `update --all` でスキップされ、直接の `update <slug>` では拒否されます。
- ピン留めされたスキルは `install --force` も拒否するため、ローカルのバイト列が誤って置き換えられることはありません。

### `unpin <slug>`

- インストール済みスキルからロックファイルのピン留めを削除し、以後の更新で変更できるようにします。

### `update [slug]` / `update --all`

- ローカルファイルからフィンガープリントを計算します。
- フィンガープリントが既知のバージョンと一致する場合: プロンプトは表示されません。
- フィンガープリントが一致しない場合:
  - デフォルトでは拒否します
  - `--force` で上書きします（対話型の場合はプロンプト）
- ピン留めされたスキルは `--force` でも更新されません。
- `update <slug>` はピン留めされた slug に対して即座に失敗し、先に `clawhub unpin <slug>` を実行するよう案内します。
- `update --all` はピン留めされた slug をスキップし、凍結されたままの内容の概要を出力します。

### `skill publish <path>`

- `POST /api/v1/skills`（multipart）経由で公開します。
- semver が必要です: `--version 1.2.3`。
- `--owner <handle>` は、アクターに公開者アクセス権がある場合に、組織/ユーザーの公開者ハンドル配下で公開します。
- `--migrate-owner` は、新しいバージョンの公開時に既存のスキルを `--owner` に移動します。両方の公開者に対する管理者/所有者アクセス権が必要です。
- 所有者とレビューの動作は `docs/publishing.md` で説明されています。
- スキルを公開するとは、ClawHub 上で `MIT-0` としてリリースされることを意味します。
- 公開されたスキルは、帰属表示なしで自由に使用、変更、再配布できます。
- ClawHub は有料スキルやスキル単位の価格設定をサポートしていません。
- `--clawscan-note <text>` は ClawScan の注記を追加します。この注記は、ネットワークアクセス、ネイティブホストアクセス、プロバイダー固有の認証情報など、それ以外では通常と異なって見える可能性がある動作について、ClawScan にコンテキストを与えます。この注記は公開されたバージョンに保存されます。
- 従来のエイリアス: `publish <path>`。

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- スキルをソフト削除します（所有者、モデレーター、または管理者）。
- `DELETE /api/v1/skills/{slug}` を呼び出します。
- 所有者が開始したソフト削除では slug が 30 日間予約されます。このコマンドは有効期限を出力します。
- `--reason <text>` はスキルと監査ログにモデレーション注記を記録します。
- `--note <text>` は `--reason` のエイリアスです。
- `--yes` は確認をスキップします。

### `undelete <slug>`

- 非表示のスキルを復元します（所有者、モデレーター、または管理者）。
- `POST /api/v1/skills/{slug}/undelete` を呼び出します。
- `--reason <text>` はスキルと監査ログにモデレーション注記を記録します。
- `--note <text>` は `--reason` のエイリアスです。
- `--yes` は確認をスキップします。

### `hide <slug>`

- スキルを非表示にします（所有者、モデレーター、または管理者）。
- `delete` のエイリアスです。

### `unhide <slug>`

- スキルの非表示を解除します（所有者、モデレーター、または管理者）。
- `undelete` のエイリアスです。

### `skill rename <slug> <new-slug>`

- 所有しているスキルの名前を変更し、以前の slug をリダイレクトエイリアスとして保持します。
- `POST /api/v1/skills/{slug}/rename` を呼び出します。
- `--yes` は確認をスキップします。

### `skill merge <source-slug> <target-slug>`

- 所有しているスキルを別の所有しているスキルにマージします。
- ソース slug は公開一覧に表示されなくなり、ターゲットへのリダイレクトエイリアスになります。
- `POST /api/v1/skills/{sourceSlug}/merge` を呼び出します。
- `--yes` は確認をスキップします。

### `transfer`

- 所有権移管ワークフローです。
- ユーザーハンドルへの移管では、受信者が承諾する保留中のリクエストが作成されます。
- 組織/公開者ハンドルへの移管は、アクターが現在の所有者と移管先公開者の両方に対する管理者アクセス権を持つ場合にのみ即時適用されます。
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

- `GET /api/v1/packages` と `GET /api/v1/packages/search` を介して統合パッケージカタログを閲覧または検索します。
- Plugin やその他のパッケージファミリー項目にはこれを使用します。トップレベルの `search` は引き続きスキル検索のサーフェスです。
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
- Plugin のメタデータ、互換性、検証、ソース、バージョン/ファイルの検査に使用します。
- `--version <version>`: 特定のバージョンを検査します（デフォルト: latest）。
- `--tag <tag>`: タグ付きバージョンを検査します（例: `latest`）。
- `--versions`: バージョン履歴を一覧表示します（最初のページ）。
- `--limit <n>`: 一覧表示する最大バージョン数（1-100）。
- `--files`: 選択したバージョンのファイルを一覧表示します。
- `--file <path>`: 生のファイル内容を取得します（テキストファイルのみ、200KB 制限）。
- `--json`: 機械可読出力です。

### `package download <name>`

- `GET /api/v1/packages/{name}/versions/{version}/artifact` を介してパッケージバージョンを解決します。
- リゾルバーの `downloadUrl` からアーティファクトをダウンロードします。
- すべてのアーティファクトについて ClawHub SHA-256 を検証します。
- ClawPack npm-pack アーティファクトでは、npm `sha512` integrity、npm shasum、および tarball の `package.json` name/version も検証します。
- 従来の ZIP バージョンは従来の ZIP ルートを介してダウンロードされます。
- フラグ:
  - `--version <version>`: 特定のバージョンをダウンロードします。
  - `--tag <tag>`: タグ付きバージョンをダウンロードします（デフォルト: `latest`）。
  - `-o, --output <path>`: 出力ファイルまたはディレクトリ。
  - `--force`: 既存の出力ファイルを上書きします。
  - `--json`: 機械可読出力です。

例:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- ローカルアーティファクトについて ClawHub SHA-256、npm `sha512` integrity、npm shasum を計算します。
- `--package` を指定すると、ClawHub から期待されるメタデータを解決し、ローカルファイルを公開済みアーティファクトのメタデータと比較します。
- 直接のダイジェストフラグを指定すると、ネットワーク検索なしで検証します。
- フラグ:
  - `--package <name>`: 期待されるアーティファクトメタデータを解決するパッケージ名。
  - `--version <version>` または `--tag <tag>`: 期待されるパッケージバージョン。
  - `--sha256 <hex>`: 期待される ClawHub SHA-256。
  - `--npm-integrity <sri>`: 期待される npm integrity。
  - `--npm-shasum <sha1>`: 期待される npm shasum。
  - `--json`: 機械可読出力です。

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
  - `--json`: 機械可読な出力。

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
  - `--json`: 機械可読な出力。

例:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- パッケージを別のパブリッシャーに移管します。
- プラットフォーム管理者が実行する場合を除き、現在のパッケージ所有者と移管先
  パブリッシャーの両方への管理者アクセスが必要です。
- スコープ付きパッケージ名は、一致するスコープ所有者に移管する必要があります。
- `POST /api/v1/packages/{name}/transfer` を呼び出します。
- フラグ:
  - `--to <owner>`: 移管先パブリッシャーハンドル。
  - `--reason <text>`: 任意の監査理由。
  - `--json`: 機械可読な出力。

例:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- パッケージをモデレーターに報告するための認証済みコマンドです。
- `POST /api/v1/packages/{name}/report` を呼び出します。
- 報告はパッケージ単位で、任意でバージョンに関連付けられ、レビューのため
  モデレーターに表示されます。
- 報告だけでパッケージが自動的に非表示になったり、ダウンロードがブロックされたりすることはありません。
- フラグ:
  - `--version <version>`: 報告に添付する任意のパッケージバージョン。
  - `--reason <text>`: 必須の報告理由。
  - `--json`: 機械可読な出力。

例:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- パッケージのモデレーション表示状態を確認するための所有者向けコマンドです。
- `GET /api/v1/packages/{name}/moderation` を呼び出します。
- 現在のパッケージスキャン状態、未解決の報告数、最新リリースの手動
  モデレーション状態、ダウンロードブロック状態、モデレーション理由を表示します。
- フラグ:
  - `--json`: 機械可読な出力。

例:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- パッケージが将来の OpenClaw での利用に対応できているかを確認します。
- `GET /api/v1/packages/{name}/readiness` を呼び出します。
- 公式ステータス、ClawPack の可用性、アーティファクトダイジェスト、
  ソース来歴、OpenClaw 互換性、ホストターゲット、環境メタデータ、
  スキャン状態に関するブロッカーを報告します。
- フラグ:
  - `--json`: 機械可読な出力。

例:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- バンドルされた OpenClaw プラグインを置き換える可能性があるパッケージについて、
  オペレーター向けの移行状態を表示します。
- `package readiness` と同じ計算済み readiness エンドポイントを呼び出しますが、
  移行に焦点を当てた状態、最新バージョン、公式パッケージ状態、チェック、
  ブロッカーを出力します。
- フラグ:
  - `--json`: 機械可読な出力。

例:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- `POST /api/v1/packages` を介してコードプラグインまたはバンドルプラグインを公開します。
- `<source>` は次を受け付けます:
  - ローカルフォルダーパス: `./my-plugin`
  - ローカル ClawPack npm-pack tarball: `./my-plugin-1.2.3.tgz`
  - GitHub リポジトリ: `owner/repo` または `owner/repo@ref`
  - GitHub URL: `https://github.com/owner/repo`
- メタデータは `package.json`、`openclaw.plugin.json`、および
  `.codex-plugin/plugin.json`、`.claude-plugin/plugin.json`、
  `.cursor-plugin/plugin.json` などの実際の OpenClaw バンドルマーカーから自動検出されます。
- `.tgz` ソースは ClawPack として扱われます。CLI は正確な npm-pack
  バイト列をアップロードし、展開された `package/` 内容は検証と
  メタデータの事前入力にのみ使用します。
- コードプラグインフォルダーはアップロード前に ClawPack npm tarball にパックされるため、
  OpenClaw インストールで正確なアーティファクトを検証できます。バンドルプラグインフォルダーは引き続き
  展開ファイル公開パスを使用します。
- GitHub ソースの場合、ソース帰属はリポジトリ、解決済みコミット、ref、サブパスから自動入力されます。
- ローカルフォルダーの場合、origin リモートが GitHub を指していれば、ソース帰属はローカル git から自動検出されます。
- 外部コードプラグインは `openclaw.compat.pluginApi` と
  `openclaw.build.openclawVersion` を明示的に宣言する必要があります。
  トップレベルの `package.json.version` は公開検証のフォールバックとして使用されません。
- `--dry-run` はアップロードせずに、解決済みの公開ペイロードをプレビューします。
- `--json` は CI 向けに機械可読な出力を生成します。
- `--owner <handle>` は、実行者がパブリッシャーアクセス権を持つ場合に、ユーザーまたは組織のパブリッシャーハンドル配下で公開します。
- `--clawscan-note <text>` は ClawScan ノートを追加します。このノートは ClawScan に、
  ネットワークアクセス、ネイティブホストアクセス、プロバイダー固有の認証情報など、
  通常とは異なって見える可能性がある動作の文脈を提供します。このノートは
  公開されたリリースに保存されます。
- スコープ付きパッケージ名は、選択した所有者と一致する必要があります。`docs/publishing.md` を参照してください。
- 既存のフラグ (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) は、引き続き上書きとして機能します。
- プライベート GitHub リポジトリには `GITHUB_TOKEN` が必要です。

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### 推奨されるローカルフロー

ライブリリースを作成する前に、まず `--dry-run` を使用して、解決済みのパッケージメタデータと
ソース帰属を確認します:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### ローカルフォルダーフロー

コードプラグインの場合、フォルダー公開はパッケージフォルダーから ClawPack アーティファクトをビルドしてアップロードします:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` 用の最小 `package.json`

外部コードプラグインには、`package.json` 内に少量の OpenClaw メタデータが必要です。この最小マニフェストがあれば、公開に成功できます:

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
  OpenClaw 互換性/ビルド検証のフォールバックとしては使用されません。
- `openclaw.hostTargets` と `openclaw.environment` は任意のメタデータです。
  存在する場合、ClawHub が表示することがありますが、公開に必須ではありません。
- `openclaw.compat.minGatewayVersion` と
  `openclaw.build.pluginSdkVersion` は、より詳細な互換性メタデータを公開したい場合の任意の追加項目です。
- 古い `clawhub` CLI リリースを使用している場合は、アップロード前にローカルの事前チェックが実行されるよう、公開前にアップグレードしてください。

#### GitHub Actions

ClawHub は、プラグインリポジトリ向けに
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/c51cfe2459f3482c315a7c8c71b2efd2637bb0e8/.github/workflows/package-publish.yml)
で公式の再利用可能ワークフローも提供しています。

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

- 再利用可能ワークフローの `source` は、デフォルトで呼び出し元リポジトリになります。
- モノレポの場合は、ワークフローがプラグインパッケージフォルダーを公開するように
  `source_path` を渡します。例: `source_path: extensions/codex`。
- 再利用可能ワークフローは、安定タグまたは完全なコミット SHA に固定してください。リリース公開を `@main` から実行しないでください。
- `pull_request` は `dry_run: true` を使用し、CI を汚染しないようにしてください。
- 実際の公開は、`workflow_dispatch` やタグプッシュなどの信頼できるイベントに限定してください。
- シークレットなしの信頼済み公開は `workflow_dispatch` でのみ機能します。タグプッシュには引き続き `clawhub_token` が必要です。
- 初回公開、信頼されていないパッケージ、または緊急対応の公開に備えて、`clawhub_token` を利用可能にしておいてください。
- ワークフローは JSON 結果をアーティファクトとしてアップロードし、ワークフロー出力として公開します。

### `sync`

- ローカルのスキルフォルダーをスキャンし、新規または変更済みのものを公開します。
- ルートには任意のフォルダーを指定できます。スキルディレクトリ、または `SKILL.md` を持つ単一のスキルフォルダーです。
- `~/.clawdbot/clawdbot.json` が存在する場合、Clawdbot スキルルートを自動追加します:
  - `agent.workspace/skills` (メインエージェント)
  - `routing.agents.*.workspace/skills` (エージェントごと)
  - `~/.clawdbot/skills` (共有)
  - `skills.load.extraDirs` (共有パック)
- `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` および `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR` を尊重します。
- フラグ:
  - `--root <dir...>` 追加のスキャンルート
  - `--all` 確認なしでアップロード
  - `--dry-run` 計画のみを表示
  - `--bump patch|minor|major` (デフォルト: patch)
  - `--changelog <text>` (非対話)
  - `--tags a,b,c` (デフォルト: latest)
  - `--concurrency <n>` (デフォルト: 4)

テレメトリ:

- ログイン中の `sync` 時に送信されます。ただし `CLAWHUB_DISABLE_TELEMETRY=1` (レガシー `CLAWDHUB_DISABLE_TELEMETRY=1`) の場合を除きます。
- 詳細: `docs/telemetry.md`。

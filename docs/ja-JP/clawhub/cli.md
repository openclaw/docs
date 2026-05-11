---
read_when:
    - ClawHub CLI の使用
    - インストール、更新、公開、同期のデバッグ
summary: 'CLI リファレンス: コマンド、フラグ、設定、ロックファイル、同期動作。'
x-i18n:
    generated_at: "2026-05-11T20:23:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b07c0a4cf2896ac8ffbaf9d65b913523a565a7030c9c255c0d27e0af7ad28b4
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

CLI パッケージ: `clawhub`、bin: `clawhub`。

npm または pnpm でグローバルにインストールします:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

次に確認します:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## グローバルフラグ

- `--workdir <dir>`: 作業ディレクトリ (デフォルト: cwd; 設定されている場合は Clawdbot ワークスペースにフォールバック)
- `--dir <dir>`: workdir 配下のインストールディレクトリ (デフォルト: `skills`)
- `--site <url>`: ブラウザログイン用のベース URL (デフォルト: `https://clawhub.ai`)
- `--registry <url>`: API ベース URL (デフォルト: 検出されたもの、それ以外は `https://clawhub.ai`)
- `--no-input`: プロンプトを無効化

対応する環境変数:

- `CLAWHUB_SITE` (レガシー `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (レガシー `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (レガシー `CLAWDHUB_WORKDIR`)

### HTTP プロキシ

CLI は、企業プロキシや制限付きネットワークの背後にあるシステム向けに、標準の HTTP プロキシ環境変数を尊重します:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

これらの変数のいずれかが設定されている場合、CLI は送信リクエストを指定されたプロキシ経由でルーティングします。`HTTPS_PROXY` は HTTPS リクエストに、`HTTP_PROXY` は通常の HTTP に使用されます。`NO_PROXY` / `no_proxy` は、特定のホストまたはドメインでプロキシをバイパスするために尊重されます。

これは、直接の送信接続がブロックされているシステムで必要です (例: Docker コンテナ、プロキシ経由のインターネットのみを持つ Hetzner VPS、企業ファイアウォール)。

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
- リモート/ヘッドレス対話式: `clawhub login --device` はコードを出力し、`<site>/cli/device` で認可するまで待機します。

### `whoami`

- `/api/v1/whoami` 経由で保存済みトークンを検証します。

### `star <slug>` / `unstar <slug>`

- ハイライトにスキルを追加/削除します。
- `POST /api/v1/stars/<slug>` と `DELETE /api/v1/stars/<slug>` を呼び出します。
- `--yes` は確認をスキップします。

### `search <query...>`

- `/api/v1/search?q=...` を呼び出します。
- 検索では、ダウンロード数による人気度より前に、完全一致する slug/name トークンの一致が優先されます。`map` のような単独の slug トークンは、`amap` 内の部分文字列よりも `personal-map` に強く一致します。
- ダウンロード数は小さな人気度の事前情報であり、上位表示を保証するものではありません。
- スキルが表示されるはずなのに表示されない場合は、メタデータの名前を変更する前に、ログインした状態で `clawhub inspect <slug>` を実行して、所有者に表示されるモデレーション診断を確認します。

### `explore`

- `/api/v1/skills?limit=...&sort=createdAt` 経由で最新のスキルを一覧表示します (`createdAt` 降順でソート)。
- フラグ:
  - `--limit <n>` (1-200、デフォルト: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (デフォルト: newest)
  - `--json` (機械可読出力)
- 出力: `<slug>  v<version>  <age>  <summary>` (summary は 50 文字に切り詰め)。

### `inspect <slug>`

- インストールせずにスキルのメタデータとバージョンファイルを取得します。
- `--version <version>`: 特定のバージョンを検査します (デフォルト: latest)。
- `--tag <tag>`: タグ付きバージョンを検査します (例: `latest`)。
- `--versions`: バージョン履歴を一覧表示します (最初のページ)。
- `--limit <n>`: 一覧表示する最大バージョン数 (1-200)。
- `--files`: 選択したバージョンのファイルを一覧表示します。
- `--file <path>`: 生のファイル内容を取得します (テキストファイルのみ; 200KB 制限)。
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

- `<workdir>/.clawhub/lock.json`（レガシーの `.clawdhub`）を読み取ります。
- `clawhub pin` で凍結されたスキルの横に `pinned` を表示し、任意の理由も含めます。

### `pin <slug>`

- インストール済みスキルをロックファイルでピン留め済みとしてマークします。
- `--reason <text>` はスキルが凍結された理由を記録します。
- ピン留めされたスキルは `update --all` でスキップされ、直接の `update <slug>` では拒否されます。
- ピン留めされたスキルは `install --force` も拒否するため、ローカルのバイト列が誤って置き換えられることはありません。

### `unpin <slug>`

- インストール済みスキルからロックファイルのピン留めを削除し、今後の更新で変更できるようにします。

### `update [slug]` / `update --all`

- ローカルファイルからフィンガープリントを計算します。
- フィンガープリントが既知のバージョンと一致する場合: プロンプトはありません。
- フィンガープリントが一致しない場合:
  - デフォルトでは拒否します
  - `--force` で上書きします（または対話型の場合はプロンプト）
- ピン留めされたスキルは `--force` でも更新されません。
- `update <slug>` はピン留めされたスラッグでは即座に失敗し、先に `clawhub unpin <slug>` を実行するよう伝えます。
- `update --all` はピン留めされたスラッグをスキップし、凍結されたままの内容の概要を出力します。

### `skill publish <path>`

- `POST /api/v1/skills`（multipart）経由で公開します。
- semver が必要です: `--version 1.2.3`。
- `--owner <handle>` は、アクターにパブリッシャーアクセスがある場合に、org/user パブリッシャーハンドルの下で公開します。
- `--migrate-owner` は、新しいバージョンを公開しながら既存のスキルを `--owner` に移動します。両方のパブリッシャーで admin/owner アクセスが必要です。
- 所有者とレビューの動作は `docs/publishing.md` で説明されています。
- スキルを公開するとは、ClawHub 上で `MIT-0` の下にリリースされることを意味します。
- 公開されたスキルは、帰属表示なしで自由に使用、変更、再配布できます。
- ClawHub は有料スキルやスキル単位の価格設定をサポートしていません。
- レガシーエイリアス: `publish <path>`。

### `delete <slug>`

- スキルをソフト削除します（owner、moderator、または admin）。
- `DELETE /api/v1/skills/{slug}` を呼び出します。
- 所有者が開始したソフト削除では、スラッグが 30 日間予約されます。このコマンドは有効期限を出力します。
- `--reason <text>` はスキルと監査ログにモデレーションメモを記録します。
- `--note <text>` は `--reason` のエイリアスです。
- `--yes` は確認をスキップします。

### `undelete <slug>`

- 非表示のスキルを復元します（owner、moderator、または admin）。
- `POST /api/v1/skills/{slug}/undelete` を呼び出します。
- `--reason <text>` はスキルと監査ログにモデレーションメモを記録します。
- `--note <text>` は `--reason` のエイリアスです。
- `--yes` は確認をスキップします。

### `hide <slug>`

- スキルを非表示にします（owner、moderator、または admin）。
- `delete` のエイリアスです。

### `unhide <slug>`

- スキルを再表示します（owner、moderator、または admin）。
- `undelete` のエイリアスです。

### `skill rename <slug> <new-slug>`

- 所有しているスキルの名前を変更し、以前のスラッグをリダイレクトエイリアスとして保持します。
- `POST /api/v1/skills/{slug}/rename` を呼び出します。
- `--yes` は確認をスキップします。

### `skill merge <source-slug> <target-slug>`

- 所有しているスキルを、別の所有しているスキルにマージします。
- ソーススラッグは公開一覧に表示されなくなり、ターゲットへのリダイレクトエイリアスになります。
- `POST /api/v1/skills/{sourceSlug}/merge` を呼び出します。
- `--yes` は確認をスキップします。

### `skill rescan <slug>`

- 最新の公開済みスキルバージョンについてセキュリティ再スキャンをリクエストします。
- 所有者とパブリッシャー管理者は、バージョンごとの復旧上限まで自分のスキルを再スキャンできます。
- プラットフォームの moderator と admin は任意のスキルを再スキャンでき、所有者の復旧上限ではブロックされません。ただし、バージョンごとに同時に実行できる再スキャンは 1 つだけです。
- `POST /api/v1/skills/{slug}/rescan` を呼び出します。
- フラグ:
  - `--yes`: 確認をスキップします。
  - `--json`: 機械可読出力。

例:

```bash
clawhub skill rescan suspicious-skill --yes
```

### `transfer`

- 所有権移転ワークフロー。
- ユーザーハンドルへの移転では、受信者が承認する保留中のリクエストが作成されます。
- org/publisher ハンドルへの移転は、アクターが現在の所有者と移転先パブリッシャーの両方に admin アクセスを持つ場合にのみ即時適用されます。
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
- Plugin やその他のパッケージファミリー項目にはこれを使用します。トップレベルの `search` は引き続きスキル検索サーフェスです。
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
- Plugin メタデータ、互換性、検証、ソース、バージョン/ファイルの検査にはこれを使用します。
- `--version <version>`: 特定のバージョンを検査します（デフォルト: latest）。
- `--tag <tag>`: タグ付きバージョンを検査します（例: `latest`）。
- `--versions`: バージョン履歴を一覧表示します（最初のページ）。
- `--limit <n>`: 一覧表示する最大バージョン数（1-100）。
- `--files`: 選択したバージョンのファイルを一覧表示します。
- `--file <path>`: 生のファイル内容を取得します（テキストファイルのみ、200KB 制限）。
- `--json`: 機械可読出力。

### `package download <name>`

- `GET /api/v1/packages/{name}/versions/{version}/artifact` 経由でパッケージバージョンを解決します。
- リゾルバーの `downloadUrl` からアーティファクトをダウンロードします。
- すべてのアーティファクトについて ClawHub SHA-256 を検証します。
- ClawPack npm-pack アーティファクトでは、npm `sha512` integrity、npm shasum、tarball の `package.json` name/version も検証します。
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

- ローカルアーティファクトについて、ClawHub SHA-256、npm `sha512` integrity、npm shasum を計算します。
- `--package` を指定すると、ClawHub から想定メタデータを解決し、ローカルファイルを公開済みアーティファクトメタデータと比較します。
- 直接のダイジェストフラグを指定すると、ネットワーク検索なしで検証します。
- フラグ:
  - `--package <name>`: 想定アーティファクトメタデータを解決するパッケージ名。
  - `--version <version>` または `--tag <tag>`: 想定パッケージバージョン。
  - `--sha256 <hex>`: 想定される ClawHub SHA-256。
  - `--npm-integrity <sri>`: 想定される npm integrity。
  - `--npm-shasum <sha1>`: 想定される npm shasum。
  - `--json`: 機械可読出力。

例:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- パッケージとすべてのリリースをソフト削除します。
- パッケージ所有者、org 発行者の所有者/管理者、プラットフォームモデレーター、
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
- パッケージ所有者、org 発行者の所有者/管理者、プラットフォームモデレーター、
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

- パッケージを別の発行者へ移管します。
- プラットフォーム管理者が実行する場合を除き、現在のパッケージ所有者と移管先
  発行者の両方への管理者アクセスが必要です。
- スコープ付きパッケージ名は、一致するスコープ所有者へ移管する必要があります。
- `POST /api/v1/packages/{name}/transfer` を呼び出します。
- フラグ:
  - `--to <owner>`: 移管先発行者ハンドル。
  - `--reason <text>`: 任意の監査理由。
  - `--json`: 機械可読出力。

例:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package rescan <name>`

- 最新の公開済みパッケージリリースに対するセキュリティ再スキャンを要求します。
- 所有者と発行者管理者は、リリースごとの回復上限まで自分のパッケージを
  再スキャンできます。
- プラットフォームモデレーターと管理者は任意のパッケージを再スキャンでき、
  所有者の回復上限によってブロックされません。ただし、リリースごとに同時に実行できる
  再スキャンは 1 件のみです。
- `POST /api/v1/packages/{name}/rescan` を呼び出します。
- フラグ:
  - `--yes`: 確認をスキップします。
  - `--json`: 機械可読出力。

例:

```bash
clawhub package rescan @openclaw/example-plugin --yes
```

### `package report`

- パッケージをモデレーターに報告するための認証済みコマンドです。
- `POST /api/v1/packages/{name}/report` を呼び出します。
- 報告はパッケージ単位で、任意でバージョンに紐付けられ、レビューのために
  モデレーターへ表示されます。
- 報告だけでパッケージが自動的に非表示になったり、ダウンロードがブロックされたりすることはありません。
- フラグ:
  - `--version <version>`: 報告に添付する任意のパッケージバージョン。
  - `--reason <text>`: 必須の報告理由。
  - `--json`: 機械可読出力。

例:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package appeal`

- リリースモデレーションに異議申し立てを行うための所有者/発行者コマンドです。
- `POST /api/v1/packages/{name}/appeal` を呼び出します。
- 異議申し立ては、隔離、取り消し、不審、または悪意ありとされた
  リリースに対して受け付けられます。
- フラグ:
  - `--version <version>`: 必須のパッケージバージョン。
  - `--message <text>`: 必須の異議申し立てメッセージ。
  - `--json`: 機械可読出力。

例:

```bash
clawhub package appeal @openclaw/example-plugin --version 1.2.3 --message "linked source release explains the native binary"
```

### `package moderation-status`

- パッケージのモデレーション可視性を確認するための所有者コマンドです。
- `GET /api/v1/packages/{name}/moderation` を呼び出します。
- 現在のパッケージスキャン状態、未解決報告数、最新リリースの手動
  モデレーション状態、ダウンロードブロック状態、モデレーション理由を表示します。
- フラグ:
  - `--json`: 機械可読出力。

例:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- パッケージが今後の OpenClaw での利用に対応できる状態かを確認します。
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

- `POST /api/v1/packages` 経由でコード Plugin またはバンドル Plugin を公開します。
- `<source>` は次を受け付けます:
  - ローカルフォルダーパス: `./my-plugin`
  - ローカル ClawPack npm-pack tarball: `./my-plugin-1.2.3.tgz`
  - GitHub リポジトリ: `owner/repo` または `owner/repo@ref`
  - GitHub URL: `https://github.com/owner/repo`
- メタデータは、`package.json`、`openclaw.plugin.json`、および
  `.codex-plugin/plugin.json`、`.claude-plugin/plugin.json`、`.cursor-plugin/plugin.json`
  などの実際の OpenClaw バンドルマーカーから自動検出されます。
- `.tgz` ソースは ClawPack として扱われます。CLI は正確な npm-pack
  バイト列をアップロードし、抽出された `package/` 内容は検証と
  メタデータの事前入力にのみ使用します。
- コード Plugin フォルダーはアップロード前に ClawPack npm tarball へパックされるため、
  OpenClaw インストールは正確なアーティファクトを検証できます。バンドル Plugin フォルダーは引き続き
  抽出ファイルの公開パスを使用します。
- GitHub ソースでは、ソース帰属はリポジトリ、解決済みコミット、ref、サブパスから自動入力されます。
- ローカルフォルダーでは、origin リモートが GitHub を指している場合、ソース帰属はローカル git から自動検出されます。
- 外部コード Plugin は `openclaw.compat.pluginApi` と
  `openclaw.build.openclawVersion` を明示的に宣言する必要があります。
  トップレベルの `package.json.version` は公開検証のフォールバックとして使用されません。
- `--dry-run` は、アップロードせずに解決済みの公開ペイロードをプレビューします。
- `--json` は CI 向けに機械可読出力を出力します。
- `--owner <handle>` は、アクターが発行者アクセスを持つ場合にユーザーまたは org 発行者ハンドル配下で公開します。
- スコープ付きパッケージ名は、選択した所有者と一致する必要があります。`docs/publishing.md` を参照してください。
- 既存のフラグ (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) は引き続き上書きとして機能します。
- プライベート GitHub リポジトリには `GITHUB_TOKEN` が必要です。

#### 推奨されるローカルフロー

ライブリリースを作成する前に、解決済みのパッケージメタデータと
ソース帰属を確認できるよう、まず `--dry-run` を使用します:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### ローカルフォルダーフロー

コード Plugin では、フォルダー公開によりパッケージフォルダーから
ClawPack アーティファクトをビルドしてアップロードします:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` 用の最小 `package.json`

外部コード Plugin には、`package.json` 内に少量の OpenClaw メタデータが
必要です。この最小マニフェストで公開に成功するには十分です:

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
  ClawHub は存在する場合にそれらを表示することがありますが、公開に必須ではありません。
- より詳細な互換性メタデータを公開したい場合、`openclaw.compat.minGatewayVersion` と
  `openclaw.build.pluginSdkVersion` は任意の追加項目です。
- 古い `clawhub` CLI リリースを使用している場合は、アップロード前に
  ローカルの事前チェックが実行されるよう、公開前にアップグレードしてください。

#### GitHub Actions

ClawHub は Plugin リポジトリ向けに、公式の再利用可能ワークフローも
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/8ed84813808a116d30aebe4357bb367b0786bb9c/.github/workflows/package-publish.yml)
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

- 再利用可能ワークフローは、デフォルトで `source` を呼び出し元リポジトリにします。
- モノレポでは、ワークフローが Plugin パッケージフォルダーを公開するように、
  `source_path` を渡します。例: `source_path: extensions/codex`。
- 再利用可能ワークフローは、安定タグまたは完全なコミット SHA に固定してください。`@main` からリリース公開を実行しないでください。
- `pull_request` では、CI を汚染しないよう `dry_run: true` を使用してください。
- 実際の公開は、`workflow_dispatch` やタグ push などの信頼済みイベントに限定してください。
- シークレットなしの信頼済み公開は `workflow_dispatch` でのみ機能します。タグ push には引き続き `clawhub_token` が必要です。
- 初回公開、信頼できないパッケージ、または緊急公開に備えて、`clawhub_token` を利用可能にしておいてください。
- ワークフローは JSON 結果をアーティファクトとしてアップロードし、ワークフロー出力として公開します。

### `sync`

- ローカル skill フォルダーをスキャンし、新規または変更されたものを公開します。
- ルートには任意のフォルダーを指定できます。skills ディレクトリ、または `SKILL.md` を含む単一の skill フォルダーです。
- `~/.clawdbot/clawdbot.json` が存在する場合、Clawdbot skill ルートを自動追加します:
  - `agent.workspace/skills` (メインエージェント)
  - `routing.agents.*.workspace/skills` (エージェントごと)
  - `~/.clawdbot/skills` (共有)
  - `skills.load.extraDirs` (共有パック)
- `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` と `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR` を尊重します。
- フラグ:
  - `--root <dir...>` 追加のスキャンルート
  - `--all` プロンプトなしでアップロード
  - `--dry-run` 計画のみ表示
  - `--bump patch|minor|major` (デフォルト: patch)
  - `--changelog <text>` (非対話)
  - `--tags a,b,c` (デフォルト: latest)
  - `--concurrency <n>` (デフォルト: 4)

テレメトリ:

- ログイン中の `sync` で送信されます。ただし `CLAWHUB_DISABLE_TELEMETRY=1` (レガシー `CLAWDHUB_DISABLE_TELEMETRY=1`) の場合を除きます。
- 詳細: `docs/telemetry.md`。

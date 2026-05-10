---
read_when:
    - ClawHub CLI の使用
    - インストール、更新、公開、同期のデバッグ
summary: 'CLI リファレンス: コマンド、フラグ、設定、ロックファイル、同期動作。'
x-i18n:
    generated_at: "2026-05-10T19:25:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: af8e43780c82c9d540bf99e677788df8913532adb3d237d20d96f575f621eae3
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

その後、確認します。

```bash
clawhub --help
clawhub login
clawhub whoami
```

## グローバルフラグ

- `--workdir <dir>`: 作業ディレクトリ (デフォルト: cwd。設定されている場合は Clawdbot ワークスペースにフォールバック)
- `--dir <dir>`: workdir 配下のインストール先ディレクトリ (デフォルト: `skills`)
- `--site <url>`: ブラウザログイン用のベース URL (デフォルト: `https://clawhub.ai`)
- `--registry <url>`: API ベース URL (デフォルト: 検出されたもの。なければ `https://clawhub.ai`)
- `--no-input`: プロンプトを無効化

環境変数での対応:

- `CLAWHUB_SITE` (レガシー `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (レガシー `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (レガシー `CLAWDHUB_WORKDIR`)

### HTTP プロキシ

CLI は、企業プロキシや制限されたネットワークの背後にあるシステム向けに、
標準の HTTP プロキシ環境変数を尊重します。

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

これらの変数のいずれかが設定されている場合、CLI は指定されたプロキシ経由で
外向きリクエストをルーティングします。`HTTPS_PROXY` は HTTPS リクエストに、`HTTP_PROXY`
は通常の HTTP に使用されます。`NO_PROXY` / `no_proxy` は、特定のホストやドメインで
プロキシをバイパスするために尊重されます。

これは、直接の外向き接続がブロックされているシステムで必要です
(例: Docker コンテナ、プロキシ経由のみインターネットに接続できる Hetzner VPS、企業
ファイアウォール)。

例:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

プロキシ変数が設定されていない場合、挙動は変わりません (直接接続)。

## 設定ファイル

API トークン + キャッシュされたレジストリ URL を保存します。

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` または `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- レガシーフォールバック: `clawhub/config.json` がまだ存在せず、`clawdhub/config.json` が存在する場合、CLI はレガシーパスを再利用します
- 上書き: `CLAWHUB_CONFIG_PATH` (レガシー `CLAWDHUB_CONFIG_PATH`)

## コマンド

### `login` / `auth login`

- デフォルト: ブラウザで `<site>/cli/auth` を開き、ループバックコールバック経由で完了します。
- ヘッドレス: `clawhub login --token clh_...`
- リモート/ヘッドレス対話式: `clawhub login --device` はコードを表示し、`<site>/cli/device` で承認するまで待機します。

### `whoami`

- `/api/v1/whoami` 経由で保存済みトークンを検証します。

### `star <slug>` / `unstar <slug>`

- ハイライトにスキルを追加/削除します。
- `POST /api/v1/stars/<slug>` と `DELETE /api/v1/stars/<slug>` を呼び出します。
- `--yes` は確認をスキップします。

### `search <query...>`

- `/api/v1/search?q=...` を呼び出します。
- 検索では、ダウンロード人気よりも完全な slug/name トークン一致が優先されます。`map` のような単独の slug トークンは、`amap` 内の部分文字列よりも `personal-map` に強く一致します。
- ダウンロード数は小さな人気度の事前情報であり、上位表示を保証するものではありません。
- スキルが表示されるべきなのに表示されない場合は、メタデータ名を変更する前に、ログインした状態で `clawhub inspect <slug>` を実行し、所有者に見えるモデレーション診断を確認してください。

### `explore`

- `/api/v1/skills?limit=...&sort=createdAt` 経由で最新のスキルを一覧表示します (`createdAt` の降順でソート)。
- フラグ:
  - `--limit <n>` (1-200、デフォルト: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (デフォルト: newest)
  - `--json` (機械可読出力)
- 出力: `<slug>  v<version>  <age>  <summary>` (summary は 50 文字に切り詰め)。

### `inspect <slug>`

- インストールせずにスキルのメタデータとバージョンファイルを取得します。
- `--version <version>`: 特定のバージョンを調査します (デフォルト: latest)。
- `--tag <tag>`: タグ付きバージョンを調査します (例: `latest`)。
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

- `<workdir>/.clawhub/lock.json` (レガシー `.clawdhub`) を読み取ります。
- `clawhub pin` で固定されたスキルの横に、任意の理由も含めて `pinned` を表示します。

### `pin <slug>`

- インストール済みスキルをロックファイルでピン留めとしてマークします。
- `--reason <text>` は、そのスキルを固定する理由を記録します。
- ピン留めされたスキルは `update --all` でスキップされ、直接の `update <slug>` では拒否されます。
- ピン留めされたスキルは `install --force` も拒否するため、ローカルのバイト列が誤って置き換えられることはありません。

### `unpin <slug>`

- インストール済みスキルからロックファイルのピン留めを削除し、以後の更新で変更できるようにします。

### `update [slug]` / `update --all`

- ローカルファイルからフィンガープリントを計算します。
- フィンガープリントが既知のバージョンと一致する場合: プロンプトは表示されません。
- フィンガープリントが一致しない場合:
  - デフォルトでは拒否します
  - `--force` で上書きします（対話モードの場合はプロンプト）
- ピン留めされたスキルは `--force` でも更新されません。
- `update <slug>` はピン留めされたスラッグでは即座に失敗し、先に `clawhub unpin <slug>` を実行するよう伝えます。
- `update --all` はピン留めされたスラッグをスキップし、固定されたままのものの概要を出力します。

### `skill publish <path>`

- `POST /api/v1/skills`（multipart）経由で公開します。
- semver が必要です: `--version 1.2.3`。
- `--owner <handle>` は、アクターにパブリッシャーアクセス権がある場合に、組織/ユーザーのパブリッシャーハンドル配下で公開します。
- `--migrate-owner` は、新しいバージョンを公開しながら既存のスキルを `--owner` に移動します。両方のパブリッシャーで管理者/所有者アクセス権が必要です。
- 所有者とレビューの動作は `docs/publishing.md` で説明されています。
- スキルを公開すると、ClawHub 上で `MIT-0` としてリリースされます。
- 公開されたスキルは、帰属表示なしで自由に使用、変更、再配布できます。
- ClawHub は有料スキルやスキル単位の価格設定をサポートしていません。
- レガシーエイリアス: `publish <path>`。

### `delete <slug>`

- スキルをソフト削除します（所有者、モデレーター、または管理者）。
- `DELETE /api/v1/skills/{slug}` を呼び出します。
- 所有者によるソフト削除では、スラッグが30日間予約されます。このコマンドは有効期限を出力します。
- `--reason <text>` は、スキルと監査ログにモデレーションメモを記録します。
- `--note <text>` は `--reason` のエイリアスです。
- `--yes` は確認をスキップします。

### `undelete <slug>`

- 非表示のスキルを復元します（所有者、モデレーター、または管理者）。
- `POST /api/v1/skills/{slug}/undelete` を呼び出します。
- `--reason <text>` は、スキルと監査ログにモデレーションメモを記録します。
- `--note <text>` は `--reason` のエイリアスです。
- `--yes` は確認をスキップします。

### `hide <slug>`

- スキルを非表示にします（所有者、モデレーター、または管理者）。
- `delete` のエイリアスです。

### `unhide <slug>`

- スキルの非表示を解除します（所有者、モデレーター、または管理者）。
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

- 最新の公開済みスキルバージョンに対するセキュリティ再スキャンをリクエストします。
- 所有者とパブリッシャー管理者は、バージョンごとの復旧上限まで自分のスキルを再スキャンできます。
- プラットフォームのモデレーターと管理者は任意のスキルを再スキャンでき、所有者の復旧上限によってブロックされません。ただし、バージョンごとに同時に実行できる再スキャンは1つだけです。
- `POST /api/v1/skills/{slug}/rescan` を呼び出します。
- フラグ:
  - `--yes`: 確認をスキップします。
  - `--json`: 機械可読な出力。

例:

```bash
clawhub skill rescan suspicious-skill --yes
```

### `transfer`

- 所有権移転ワークフロー。
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

- `GET /api/v1/packages` と `GET /api/v1/packages/search` 経由で統合パッケージカタログを閲覧または検索します。
- Plugin やその他のパッケージファミリー項目にはこれを使用します。トップレベルの `search` は引き続きスキル検索面です。
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
- Plugin メタデータ、互換性、検証、ソース、バージョン/ファイルの調査にはこれを使用します。
- `--version <version>`: 特定のバージョンを調査します（デフォルト: latest）。
- `--tag <tag>`: タグ付きバージョンを調査します（例: `latest`）。
- `--versions`: バージョン履歴を一覧表示します（最初のページ）。
- `--limit <n>`: 一覧表示する最大バージョン数（1-100）。
- `--files`: 選択したバージョンのファイルを一覧表示します。
- `--file <path>`: 生のファイル内容を取得します（テキストファイルのみ、200KB 上限）。
- `--json`: 機械可読な出力。

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
  - `--json`: 機械可読な出力。

例:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- ローカルアーティファクトについて、ClawHub SHA-256、npm `sha512` integrity、npm shasum を計算します。
- `--package` を指定すると、ClawHub から期待されるメタデータを解決し、ローカルファイルを公開済みアーティファクトメタデータと比較します。
- 直接ダイジェストフラグを指定すると、ネットワーク検索なしで検証します。
- フラグ:
  - `--package <name>`: 期待されるアーティファクトメタデータを解決するパッケージ名。
  - `--version <version>` または `--tag <tag>`: 期待されるパッケージバージョン。
  - `--sha256 <hex>`: 期待される ClawHub SHA-256。
  - `--npm-integrity <sri>`: 期待される npm integrity。
  - `--npm-shasum <sha1>`: 期待される npm shasum。
  - `--json`: 機械可読な出力。

例:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- パッケージとすべてのリリースをソフト削除します。
- パッケージオーナー、組織パブリッシャーのオーナー/管理者、プラットフォームモデレーター、
  またはプラットフォーム管理者が必要です。
- フラグ:
  - `--yes`: 確認をスキップします。
  - `--json`: 機械判読可能な出力。

例:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package rescan <name>`

- 最新の公開済みパッケージリリースに対するセキュリティ再スキャンをリクエストします。
- オーナーとパブリッシャー管理者は、リリースごとの
  復旧上限まで自分のパッケージを再スキャンできます。
- プラットフォームモデレーターと管理者は任意のパッケージを再スキャンでき、
  オーナーの復旧上限にはブロックされません。ただし、リリースごとに同時に実行できる再スキャンは1つだけです。
- `POST /api/v1/packages/{name}/rescan` を呼び出します。
- フラグ:
  - `--yes`: 確認をスキップします。
  - `--json`: 機械判読可能な出力。

例:

```bash
clawhub package rescan @openclaw/example-plugin --yes
```

### `package report`

- パッケージをモデレーターに報告するための認証済みコマンドです。
- `POST /api/v1/packages/{name}/report` を呼び出します。
- 報告はパッケージ単位で、任意でバージョンに紐付けられ、レビューのために
  モデレーターに表示されます。
- 報告だけでパッケージが自動的に非表示になったり、ダウンロードがブロックされたりすることはありません。
- フラグ:
  - `--version <version>`: 報告に紐付ける任意のパッケージバージョン。
  - `--reason <text>`: 必須の報告理由。
  - `--json`: 機械判読可能な出力。

例:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package appeal`

- リリースモデレーションに異議申し立てするためのオーナー/パブリッシャー用コマンドです。
- `POST /api/v1/packages/{name}/appeal` を呼び出します。
- 異議申し立ては、隔離済み、取り消し済み、疑わしい、または悪意ありとされた
  リリースに対して受け付けられます。
- フラグ:
  - `--version <version>`: 必須のパッケージバージョン。
  - `--message <text>`: 必須の異議申し立てメッセージ。
  - `--json`: 機械判読可能な出力。

例:

```bash
clawhub package appeal @openclaw/example-plugin --version 1.2.3 --message "linked source release explains the native binary"
```

### `package moderation-status`

- パッケージのモデレーション可視性を確認するためのオーナー用コマンドです。
- `GET /api/v1/packages/{name}/moderation` を呼び出します。
- 現在のパッケージスキャン状態、未処理の報告数、最新リリースの手動
  モデレーション状態、ダウンロードブロック状態、モデレーション理由を表示します。
- フラグ:
  - `--json`: 機械判読可能な出力。

例:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- パッケージが今後の OpenClaw での利用に対応できているかを確認します。
- `GET /api/v1/packages/{name}/readiness` を呼び出します。
- 公式ステータス、ClawPack の利用可否、アーティファクトダイジェスト、
  ソースの来歴、OpenClaw 互換性、ホストターゲット、環境メタデータ、
  およびスキャン状態に関するブロッカーを報告します。
- フラグ:
  - `--json`: 機械判読可能な出力。

例:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- バンドルされた OpenClaw plugin を置き換える可能性があるパッケージの、
  オペレーター向け移行状態を表示します。
- `package readiness` と同じ計算済み readiness エンドポイントを呼び出しますが、
  移行に焦点を当てた状態、最新バージョン、公式パッケージ状態、チェック、
  およびブロッカーを出力します。
- フラグ:
  - `--json`: 機械判読可能な出力。

例:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- `POST /api/v1/packages` を通じてコード plugin またはバンドル plugin を公開します。
- `<source>` は以下を受け付けます:
  - ローカルフォルダーパス: `./my-plugin`
  - ローカル ClawPack npm-pack tarball: `./my-plugin-1.2.3.tgz`
  - GitHub リポジトリ: `owner/repo` または `owner/repo@ref`
  - GitHub URL: `https://github.com/owner/repo`
- メタデータは `package.json`、`openclaw.plugin.json`、および
  `.codex-plugin/plugin.json`、`.claude-plugin/plugin.json`、`.cursor-plugin/plugin.json`
  などの実際の OpenClaw バンドルマーカーから自動検出されます。
- `.tgz` ソースは ClawPack として扱われます。CLI は正確な npm-pack
  バイト列をアップロードし、抽出された `package/` の内容は検証と
  メタデータの事前入力にのみ使用します。
- コード plugin フォルダーは、OpenClaw のインストール時に正確なアーティファクトを検証できるよう、
  アップロード前に ClawPack npm tarball にパックされます。バンドル plugin フォルダーは引き続き
  抽出ファイル公開パスを使用します。
- GitHub ソースでは、ソース属性がリポジトリ、解決済みコミット、ref、およびサブパスから自動入力されます。
- ローカルフォルダーでは、origin リモートが GitHub を指している場合、ソース属性がローカル git から自動検出されます。
- 外部コード plugin は `openclaw.compat.pluginApi` と
  `openclaw.build.openclawVersion` を明示的に宣言する必要があります。
  トップレベルの `package.json.version` は、公開検証のフォールバックとして使用されません。
- `--dry-run` は、アップロードせずに解決済みの公開ペイロードをプレビューします。
- `--json` は CI 向けに機械判読可能な出力を出力します。
- `--owner <handle>` は、アクターがパブリッシャーアクセス権を持つ場合、ユーザーまたは組織パブリッシャーハンドルの下で公開します。
- スコープ付きパッケージ名は、選択したオーナーと一致する必要があります。`docs/publishing.md` を参照してください。
- 既存のフラグ (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) は引き続き上書きとして機能します。
- プライベート GitHub リポジトリには `GITHUB_TOKEN` が必要です。

#### 推奨ローカルフロー

ライブリリースを作成する前に、解決済みのパッケージメタデータと
ソース属性を確認できるよう、まず `--dry-run` を使用します:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### ローカルフォルダーフロー

コード plugin では、フォルダー公開によりパッケージフォルダーから ClawPack アーティファクトをビルドしてアップロードします:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` 用の最小 `package.json`

外部コード plugin には、`package.json` に少量の OpenClaw メタデータが必要です。
この最小マニフェストで公開は成功します:

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
  OpenClaw 互換性/ビルド検証のフォールバックとしては使用されません。
- `openclaw.hostTargets` と `openclaw.environment` は任意のメタデータです。
  存在する場合、ClawHub がそれらを表示することがありますが、公開には必須ではありません。
- `openclaw.compat.minGatewayVersion` と
  `openclaw.build.pluginSdkVersion` は、より詳細な互換性メタデータを公開したい場合の任意の追加項目です。
- 古い `clawhub` CLI リリースを使用している場合は、アップロード前に
  ローカルの事前チェックが実行されるよう、公開前にアップグレードしてください。

#### GitHub Actions

ClawHub は、plugin リポジトリ向けに公式の再利用可能ワークフロー
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/2dcaf25d23c4e19b9c14f705c2ce1fd1dc2949c1/.github/workflows/package-publish.yml)
も同梱しています。

典型的な呼び出し元の設定:

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
- モノレポでは、ワークフローが plugin パッケージフォルダーを公開するよう `source_path` を渡します。
  例: `source_path: extensions/codex`。
- 再利用可能ワークフローは、安定タグまたは完全なコミット SHA にピン留めしてください。`@main` からリリース公開を実行しないでください。
- `pull_request` では、CI が汚染されないよう `dry_run: true` を使用する必要があります。
- 実際の公開は、`workflow_dispatch` やタグ push などの信頼済みイベントに限定する必要があります。
- シークレットなしの信頼済み公開は `workflow_dispatch` でのみ機能します。タグ push には引き続き `clawhub_token` が必要です。
- 初回公開、信頼されていないパッケージ、または緊急公開のために `clawhub_token` を利用可能な状態にしておいてください。
- ワークフローは JSON 結果をアーティファクトとしてアップロードし、ワークフロー出力として公開します。

### `sync`

- ローカルの skill フォルダーをスキャンし、新規または変更されたものを公開します。
- ルートには任意のフォルダーを指定できます。skills ディレクトリ、または `SKILL.md` を含む単一の skill フォルダーです。
- `~/.clawdbot/clawdbot.json` が存在する場合、Clawdbot の skill ルートを自動追加します:
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

- ログイン中の `sync` 実行時に送信されます。ただし、`CLAWHUB_DISABLE_TELEMETRY=1` (レガシー `CLAWDHUB_DISABLE_TELEMETRY=1`) の場合を除きます。
- 詳細: `docs/telemetry.md`。

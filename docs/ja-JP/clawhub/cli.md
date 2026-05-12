---
read_when:
    - ClawHub CLI の使用
    - インストール、更新、公開、同期のデバッグ
summary: 'CLI リファレンス: コマンド、フラグ、設定、ロックファイル、同期動作。'
x-i18n:
    generated_at: "2026-05-12T04:09:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: b42231f76dee1ffc66585e72ce3d370658a362225ad858e7c72726f991287aa2
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

- `--workdir <dir>`: 作業ディレクトリ (デフォルト: cwd。設定済みの場合は Clawdbot ワークスペースにフォールバック)
- `--dir <dir>`: workdir 配下のインストールディレクトリ (デフォルト: `skills`)
- `--site <url>`: ブラウザログイン用のベース URL (デフォルト: `https://clawhub.ai`)
- `--registry <url>`: API ベース URL (デフォルト: 検出されたもの、それ以外は `https://clawhub.ai`)
- `--no-input`: プロンプトを無効化

対応する環境変数:

- `CLAWHUB_SITE` (レガシー `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (レガシー `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (レガシー `CLAWDHUB_WORKDIR`)

### HTTP プロキシ

CLI は、企業プロキシや制限されたネットワークの背後にあるシステム向けに、標準の HTTP プロキシ環境変数に従います。

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

これらの変数のいずれかが設定されている場合、CLI は送信リクエストを指定されたプロキシ経由でルーティングします。`HTTPS_PROXY` は HTTPS リクエストに、`HTTP_PROXY` は通常の HTTP に使用されます。`NO_PROXY` / `no_proxy` は、特定のホストやドメインでプロキシをバイパスするために尊重されます。

これは、直接の送信接続がブロックされているシステムで必要です (例: Docker コンテナ、プロキシ専用インターネットの Hetzner VPS、企業ファイアウォール)。

例:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

プロキシ変数が設定されていない場合、動作は変わりません (直接接続)。

## 設定ファイル

API トークン + キャッシュされたレジストリ URL を保存します。

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` または `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- レガシーフォールバック: `clawhub/config.json` がまだ存在せず、`clawdhub/config.json` が存在する場合、CLI はレガシーパスを再利用します
- オーバーライド: `CLAWHUB_CONFIG_PATH` (レガシー `CLAWDHUB_CONFIG_PATH`)

## コマンド

### `login` / `auth login`

- デフォルト: ブラウザで `<site>/cli/auth` を開き、loopback コールバック経由で完了します。
- ヘッドレス: `clawhub login --token clh_...`
- リモート/ヘッドレスの対話型: `clawhub login --device` はコードを表示し、`<site>/cli/device` で認可している間待機します。

### `whoami`

- 保存済みトークンを `/api/v1/whoami` 経由で検証します。

### `star <slug>` / `unstar <slug>`

- ハイライトにスキルを追加/削除します。
- `POST /api/v1/stars/<slug>` と `DELETE /api/v1/stars/<slug>` を呼び出します。
- `--yes` は確認をスキップします。

### `search <query...>`

- `/api/v1/search?q=...` を呼び出します。
- 検索では、ダウンロード人気度よりも先に、完全一致する slug/name トークンの一致が優先されます。`map` のような単独の slug トークンは、`amap` 内の部分文字列よりも `personal-map` により強く一致します。
- ダウンロード数は小さな人気度の事前要素であり、上位表示を保証するものではありません。
- スキルが表示されるべきなのに表示されない場合は、メタデータの名前変更前に、ログインした状態で `clawhub inspect <slug>` を実行し、所有者に見えるモデレーション診断を確認してください。

### `explore`

- `/api/v1/skills?limit=...&sort=createdAt` 経由で最新のスキルを一覧表示します (`createdAt` desc でソート)。
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
- `--file <path>`: raw ファイル内容を取得します (テキストファイルのみ、200KB 制限)。
- `--json`: 機械可読出力。

### `install <slug>`

- `/api/v1/skills/<slug>` 経由で最新バージョンを解決します。
- `/api/v1/download` 経由で zip をダウンロードします。
- `<workdir>/<dir>/<slug>` に展開します。
- pinned スキルの上書きを拒否します。先に `clawhub unpin <slug>` を実行してください。
- 書き込み先:
  - `<workdir>/.clawhub/lock.json` (レガシー `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (レガシー `.clawdhub`)

### `uninstall <slug>`

- `<workdir>/<dir>/<slug>` を削除し、lockfile エントリを削除します。
- 対話型: 確認を求めます。
- 非対話型 (`--no-input`): `--yes` が必要です。

### `list`

- `<workdir>/.clawhub/lock.json`（従来の `.clawdhub`）を読み取ります。
- `clawhub pin` で固定された skills の横に、任意の理由を含めて `pinned` を表示します。

### `pin <slug>`

- インストール済み skill をロックファイル内で pinned としてマークします。
- `--reason <text>` は skill が固定されている理由を記録します。
- Pinned skills は `update --all` ではスキップされ、直接の `update <slug>` では拒否されます。
- Pinned skills は `install --force` も拒否するため、ローカルのバイト列が誤って置き換えられることはありません。

### `unpin <slug>`

- インストール済み skill からロックファイルの pin を削除し、以後の更新で変更できるようにします。

### `update [slug]` / `update --all`

- ローカルファイルから fingerprint を計算します。
- fingerprint が既知のバージョンと一致する場合: プロンプトは表示されません。
- fingerprint が一致しない場合:
  - 既定では拒否します
  - `--force`（または対話式の場合はプロンプト）で上書きします
- Pinned skills は `--force` でも更新されません。
- `update <slug>` は pinned slugs に対して即座に失敗し、先に `clawhub unpin <slug>` を実行するよう通知します。
- `update --all` は pinned slugs をスキップし、何が固定されたままかの要約を出力します。

### `skill publish <path>`

- `POST /api/v1/skills`（multipart）経由で公開します。
- semver が必要です: `--version 1.2.3`。
- `--owner <handle>` は、actor に publisher アクセスがある場合に、org/user publisher handle の下で公開します。
- `--migrate-owner` は、新しいバージョンを公開しながら既存の skill を `--owner` に移動します。両方の publishers に対する admin/owner アクセスが必要です。
- owner と review の挙動は `docs/publishing.md` で説明されています。
- skill を公開すると、ClawHub 上で `MIT-0` の下にリリースされます。
- 公開された skills は、帰属表示なしで自由に使用、変更、再配布できます。
- ClawHub は有料 skills や skill ごとの価格設定をサポートしていません。
- `--clawscan-note <text>` は ClawScan note を追加します。この note は、ネットワークアクセス、ネイティブホストアクセス、provider 固有の認証情報など、通常とは異なって見える可能性がある挙動について ClawScan にコンテキストを提供します。この note は公開されたバージョンに保存されます。
- 従来のエイリアス: `publish <path>`。

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- skill を soft-delete します（owner、moderator、または admin）。
- `DELETE /api/v1/skills/{slug}` を呼び出します。
- owner が開始した soft deletes は slug を 30 日間予約し、コマンドは有効期限を出力します。
- `--reason <text>` は skill と audit log に moderation note を記録します。
- `--note <text>` は `--reason` のエイリアスです。
- `--yes` は確認をスキップします。

### `undelete <slug>`

- 非表示の skill を復元します（owner、moderator、または admin）。
- `POST /api/v1/skills/{slug}/undelete` を呼び出します。
- `--reason <text>` は skill と audit log に moderation note を記録します。
- `--note <text>` は `--reason` のエイリアスです。
- `--yes` は確認をスキップします。

### `hide <slug>`

- skill を非表示にします（owner、moderator、または admin）。
- `delete` のエイリアスです。

### `unhide <slug>`

- skill の非表示を解除します（owner、moderator、または admin）。
- `undelete` のエイリアスです。

### `skill rename <slug> <new-slug>`

- 所有している skill の名前を変更し、以前の slug をリダイレクトエイリアスとして保持します。
- `POST /api/v1/skills/{slug}/rename` を呼び出します。
- `--yes` は確認をスキップします。

### `skill merge <source-slug> <target-slug>`

- 所有している skill を、別の所有している skill にマージします。
- source slug は公開一覧に表示されなくなり、target へのリダイレクトエイリアスになります。
- `POST /api/v1/skills/{sourceSlug}/merge` を呼び出します。
- `--yes` は確認をスキップします。

### `transfer`

- 所有権 transfer ワークフローです。
- user handles への transfers は、受信者が承諾する pending request を作成します。
- org/publisher handles への transfers は、actor が現在の owner と destination publisher の両方に admin アクセスを持つ場合にのみ即時適用されます。
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
- plugins とその他の package-family entries にはこれを使用してください。トップレベルの `search` は引き続き skill 検索サーフェスです。
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
  - `--limit <n>`（1-100、既定値: 25）
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
- plugin metadata、compatibility、verification、source、version/file inspection にはこれを使用してください。
- `--version <version>`: 特定のバージョンを検査します（既定値: latest）。
- `--tag <tag>`: タグ付きバージョンを検査します（例: `latest`）。
- `--versions`: バージョン履歴を一覧表示します（最初のページ）。
- `--limit <n>`: 一覧表示する最大バージョン数（1-100）。
- `--files`: 選択されたバージョンのファイルを一覧表示します。
- `--file <path>`: raw file content を取得します（テキストファイルのみ、200KB 制限）。
- `--json`: 機械可読な出力です。

### `package download <name>`

- `GET /api/v1/packages/{name}/versions/{version}/artifact` 経由で package version を解決します。
- resolver の `downloadUrl` から artifact をダウンロードします。
- すべての artifacts について ClawHub SHA-256 を検証します。
- ClawPack npm-pack artifacts については、npm `sha512` integrity、npm shasum、tarball の `package.json` name/version も検証します。
- 従来の ZIP バージョンは legacy ZIP route 経由でダウンロードします。
- フラグ:
  - `--version <version>`: 特定のバージョンをダウンロードします。
  - `--tag <tag>`: タグ付きバージョンをダウンロードします（既定値: `latest`）。
  - `-o, --output <path>`: 出力ファイルまたはディレクトリです。
  - `--force`: 既存の出力ファイルを上書きします。
  - `--json`: 機械可読な出力です。

例:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- ローカル artifact について ClawHub SHA-256、npm `sha512` integrity、npm shasum を計算します。
- `--package` を指定すると、ClawHub から expected metadata を解決し、ローカルファイルを公開済み artifact metadata と比較します。
- 直接 digest flags を指定すると、ネットワーク検索なしで検証します。
- フラグ:
  - `--package <name>`: expected artifact metadata を解決する package name です。
  - `--version <version>` または `--tag <tag>`: 期待される package version です。
  - `--sha256 <hex>`: 期待される ClawHub SHA-256 です。
  - `--npm-integrity <sri>`: 期待される npm integrity です。
  - `--npm-shasum <sha1>`: 期待される npm shasum です。
  - `--json`: 機械可読な出力です。

例:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- パッケージとすべてのリリースを論理削除します。
- パッケージオーナー、組織パブリッシャーのオーナー/管理者、プラットフォームモデレーター、
  またはプラットフォーム管理者が必要です。
- フラグ:
  - `--yes`: 確認をスキップします。
  - `--json`: 機械可読出力。

例:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- 論理削除されたパッケージとリリースを復元します。
- パッケージオーナー、組織パブリッシャーのオーナー/管理者、プラットフォームモデレーター、
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

- パッケージを別のパブリッシャーに移管します。
- プラットフォーム管理者が実行する場合を除き、現在のパッケージオーナーと移管先
  パブリッシャーの両方に対する管理者アクセス権が必要です。
- スコープ付きパッケージ名は、一致するスコープオーナーへ移管する必要があります。
- `POST /api/v1/packages/{name}/transfer` を呼び出します。
- フラグ:
  - `--to <owner>`: 移管先パブリッシャーのハンドル。
  - `--reason <text>`: 任意の監査理由。
  - `--json`: 機械可読出力。

例:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- モデレーターにパッケージを報告するための認証済みコマンドです。
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

### `package moderation-status`

- パッケージのモデレーション表示状態を確認するためのオーナー向けコマンドです。
- `GET /api/v1/packages/{name}/moderation` を呼び出します。
- 現在のパッケージスキャン状態、オープンな報告数、最新リリースの手動
  モデレーション状態、ダウンロードブロック状態、モデレーション理由を表示します。
- フラグ:
  - `--json`: 機械可読出力。

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
  - `--json`: 機械可読出力。

例:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- バンドルされた OpenClaw プラグインを置き換える可能性があるパッケージについて、
  オペレーター向けの移行状態を表示します。
- `package readiness` と同じ算出済み readiness エンドポイントを呼び出しますが、
  移行に焦点を当てた状態、最新バージョン、公式パッケージ状態、チェック、
  ブロッカーを出力します。
- フラグ:
  - `--json`: 機械可読出力。

例:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- `POST /api/v1/packages` 経由でコードプラグインまたはバンドルプラグインを公開します。
- `<source>` は次を受け付けます:
  - ローカルフォルダーパス: `./my-plugin`
  - ローカル ClawPack npm-pack tarball: `./my-plugin-1.2.3.tgz`
  - GitHub リポジトリ: `owner/repo` または `owner/repo@ref`
  - GitHub URL: `https://github.com/owner/repo`
- メタデータは、`package.json`、`openclaw.plugin.json`、および
  `.codex-plugin/plugin.json`、`.claude-plugin/plugin.json`、`.cursor-plugin/plugin.json`
  などの実際の OpenClaw バンドルマーカーから自動検出されます。
- `.tgz` ソースは ClawPack として扱われます。CLI は正確な npm-pack
  バイト列をアップロードし、抽出された `package/` の内容は検証と
  メタデータの事前入力にのみ使用します。
- コードプラグインフォルダーはアップロード前に ClawPack npm tarball にパックされるため、
  OpenClaw インストールでは正確なアーティファクトを検証できます。バンドルプラグインフォルダーは引き続き
  抽出済みファイルの公開パスを使用します。
- GitHub ソースでは、リポジトリ、解決済みコミット、ref、サブパスからソース帰属が自動入力されます。
- ローカルフォルダーでは、origin リモートが GitHub を指している場合、ローカル git からソース帰属が自動検出されます。
- 外部コードプラグインは `openclaw.compat.pluginApi` と
  `openclaw.build.openclawVersion` を明示的に宣言する必要があります。
  トップレベルの `package.json.version` は公開検証のフォールバックとして使用されません。
- `--dry-run` は、アップロードせずに解決済みの公開ペイロードをプレビューします。
- `--json` は CI 向けに機械可読出力を出力します。
- `--owner <handle>` は、実行者がパブリッシャーアクセス権を持つ場合に、ユーザーまたは組織パブリッシャーのハンドル配下で公開します。
- `--clawscan-note <text>` は ClawScan のメモを追加します。このメモは、ネットワークアクセス、
  ネイティブホストアクセス、プロバイダー固有の認証情報など、通常とは異なって見える可能性がある挙動について
  ClawScan に文脈を提供します。このメモは公開されたリリースに保存されます。
- スコープ付きパッケージ名は、選択したオーナーと一致する必要があります。`docs/publishing.md` を参照してください。
- 既存のフラグ（`--family`、`--name`、`--version`、`--source-repo`、`--source-commit`、`--source-ref`、`--source-path`）は、上書きとして引き続き機能します。
- プライベート GitHub リポジトリには `GITHUB_TOKEN` が必要です。

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### 推奨ローカルフロー

まず `--dry-run` を使用し、実際のリリースを作成する前に解決済みのパッケージメタデータと
ソース帰属を確認します:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### ローカルフォルダーフロー

コードプラグインの場合、フォルダー公開はパッケージフォルダーから ClawPack アーティファクトを
ビルドしてアップロードします:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `--family code-plugin` 用の最小 `package.json`

外部コードプラグインには、`package.json` 内に少量の OpenClaw メタデータが必要です。
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

- `package.json.version` はパッケージのリリースバージョンですが、OpenClaw 互換性/ビルド検証の
  フォールバックとしては使用されません。
- `openclaw.hostTargets` と `openclaw.environment` は任意のメタデータです。
  それらが存在する場合、ClawHub が表示することがありますが、公開には必須ではありません。
- より詳細な互換性メタデータを公開したい場合、`openclaw.compat.minGatewayVersion` と
  `openclaw.build.pluginSdkVersion` は任意の追加項目です。
- 古い `clawhub` CLI リリースを使用している場合は、アップロード前にローカルの事前チェックが実行されるよう、
  公開前にアップグレードしてください。

#### GitHub Actions

ClawHub は、プラグインリポジトリ向けに公式の再利用可能ワークフロー
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/53b64d1d911106dab570eb6260e6ee977e9eefcd/.github/workflows/package-publish.yml)
も提供しています。

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

- 再利用可能ワークフローは、既定で `source` を呼び出し元リポジトリに設定します。
- モノレポでは、ワークフローがプラグインのパッケージフォルダーを公開するように `source_path` を渡します。
  例: `source_path: extensions/codex`。
- 再利用可能ワークフローは、安定版タグまたは完全なコミット SHA に固定してください。`@main` からリリース公開を実行しないでください。
- `pull_request` では `dry_run: true` を使用し、CI が汚染されないようにしてください。
- 実際の公開は、`workflow_dispatch` やタグプッシュなどの信頼済みイベントに限定してください。
- シークレットなしの信頼済み公開は `workflow_dispatch` でのみ機能します。タグプッシュでは引き続き `clawhub_token` が必要です。
- 初回公開、信頼されていないパッケージ、または緊急公開用に `clawhub_token` を利用可能にしておいてください。
- ワークフローは JSON 結果をアーティファクトとしてアップロードし、ワークフロー出力として公開します。

### `sync`

- ローカルのスキルフォルダーをスキャンし、新規または変更済みのものを公開します。
- ルートには任意のフォルダーを指定できます。スキルディレクトリ、または `SKILL.md` を含む単一のスキルフォルダーです。
- `~/.clawdbot/clawdbot.json` が存在する場合、Clawdbot スキルルートを自動追加します:
  - `agent.workspace/skills`（メインエージェント）
  - `routing.agents.*.workspace/skills`（エージェントごと）
  - `~/.clawdbot/skills`（共有）
  - `skills.load.extraDirs`（共有パック）
- `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` と `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR` を尊重します。
- フラグ:
  - `--root <dir...>` 追加のスキャンルート
  - `--all` プロンプトなしでアップロード
  - `--dry-run` 計画のみを表示
  - `--bump patch|minor|major`（既定: patch）
  - `--changelog <text>`（非対話）
  - `--tags a,b,c`（既定: latest）
  - `--concurrency <n>`（既定: 4）

テレメトリ:

- ログイン済みの場合、`CLAWHUB_DISABLE_TELEMETRY=1`（レガシー `CLAWDHUB_DISABLE_TELEMETRY=1`）でない限り、`sync` 中に送信されます。
- 詳細: `docs/telemetry.md`。

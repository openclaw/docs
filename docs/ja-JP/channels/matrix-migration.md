---
read_when:
    - 既存の Matrix インストールをアップグレードする
    - 暗号化された Matrix 履歴とデバイス状態の移行
summary: OpenClaw が以前の Matrix Plugin をインプレースでアップグレードする方法。暗号化状態のリカバリ制限と手動リカバリ手順を含みます。
title: Matrix 移行
x-i18n:
    generated_at: "2026-07-05T11:02:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6607045ac7760dc9d1ecdb1dd3d3885a7213d4e6f45eb32fd9a47c76f178c8c
    source_path: channels/matrix-migration.md
    workflow: 16
---

以前の公開 `matrix` Plugin から現在の実装へアップグレードします。

ほとんどのユーザーでは、アップグレードはそのまま行われます。

- Plugin は `@openclaw/matrix` のままです
- チャネルは `matrix` のままです
- 設定は `channels.matrix` 配下のままです
- キャッシュ済み認証情報は `~/.openclaw/credentials/matrix/` 配下のままです
- ランタイム状態は `~/.openclaw/matrix/` 配下のままです

設定キーをリネームしたり、新しい名前で Plugin を再インストールしたりする必要はありません。
ルートの `openclaw` パッケージには、Matrix ランタイムコードや Matrix SDK
依存関係はもうバンドルされません。`openclaw channels status` で Matrix が設定済みなのに
Plugin がインストールされていないと表示される場合は、`openclaw doctor --fix` または
`openclaw plugins install @openclaw/matrix` を実行してください。Matrix SDK パッケージを
ルートの OpenClaw パッケージへインストールしないでください。

## 移行が自動的に行うこと

Matrix 移行は、Gateway の起動時（読み込まれた Matrix Plugin 経由）、[`openclaw doctor --fix`](/ja-JP/gateway/doctor) の実行時、そして Matrix クライアントの起動時に古いディスク上の状態がまだ見つかった場合のフォールバックとして実行されます。実行可能な移行手順がディスク上の状態を変更する前に、OpenClaw は対象を絞った復旧スナップショットを作成または再利用します。

`openclaw update` を使う場合、正確なトリガーは OpenClaw のインストール方法によって異なります。

- ソースインストールでは、更新フロー中に非対話型の `openclaw doctor --fix` パスを実行し、その後デフォルトで Gateway を再起動します
- パッケージマネージャーによるインストールでは、パッケージを更新し、`openclaw doctor --non-interactive --fix` を実行してから、デフォルトの Gateway 再起動により起動時に Matrix 移行を完了させます
- `openclaw update --no-restart` を使う場合、起動時に裏付けられた Matrix 移行は、後で `openclaw doctor --fix` を実行して Gateway を再起動するまで延期されます

自動移行の対象は次のとおりです。

- `~/Backups/openclaw-migrations/` 配下で移行前スナップショットを作成または再利用する
- キャッシュ済みの Matrix 認証情報を再利用する
- 同じアカウント選択と `channels.matrix` 設定を維持する
- ターゲットアカウントを安全に解決できる場合、古いフラットな Matrix 同期ストアと crypto ストアを現在のアカウントスコープの場所へ移動する
- ファイルベースのサイドカー状態（`bot-storage.json` 同期キャッシュ、`recovery-key.json`、`legacy-crypto-migration.json`、IndexedDB スナップショット）を Matrix SQLite 状態へインポートする。移行済みファイルは `.migrated` サフィックス付きでアーカイブされます
- 以前に保存された Matrix ルームキー バックアップ復号キーを、古い rust crypto ストアから抽出する（そのキーがローカルに存在する場合）
- 同じ Matrix アカウント、homeserver、ユーザー、デバイスについて、後でアクセストークンが変更された場合に最も完全な既存のトークンハッシュ ストレージルートを再利用する
- Matrix アクセストークンが変更されてもアカウント/デバイス ID が同じままだった場合、保留中の暗号化状態復元メタデータについて兄弟トークンハッシュ ストレージルートをスキャンする
- 次回の Matrix 起動時に、バックアップ済みルームキーを新しい crypto ストアへ復元する

スナップショットの詳細:

- OpenClaw は、スナップショットが成功した後に `~/.openclaw/matrix/migration-snapshot.json` にマーカーファイルを書き込み、以後の起動時および修復パスで同じアーカイブを再利用できるようにします。
- これらの自動 Matrix 移行スナップショットは、設定 + 状態のみをバックアップします（`includeWorkspace: false`）。
- たとえば `userId` または `accessToken` がまだ不足しているため Matrix に警告のみの移行状態しかない場合、実行可能な Matrix 変更がないため OpenClaw はまだスナップショットを作成しません。
- スナップショット手順が失敗した場合、OpenClaw は復旧ポイントなしで状態を変更する代わりに、その実行での Matrix 移行をスキップします。

複数アカウントのアップグレードについて:

- フラットな Matrix ストア（`~/.openclaw/matrix/bot-storage.json` と `~/.openclaw/matrix/crypto/`）は単一ストア レイアウト由来のため、OpenClaw は解決済みの Matrix アカウントターゲット 1 つにしか移行できません
- 既にアカウントスコープ化されているレガシー Matrix ストアは、設定済みの Matrix アカウントごとに検出され、準備されます

## 移行が自動的にはできないこと

以前の公開 Matrix Plugin は、Matrix ルームキー バックアップを自動的には作成しませんでした。ローカル crypto 状態を永続化し、デバイス検証を要求していましたが、ルームキーが homeserver にバックアップされることは保証していませんでした。

そのため、一部の暗号化されたインストールは部分的にしか移行できません。

OpenClaw が自動的に復旧できないもの:

- バックアップされたことがないローカル専用ルームキー
- `homeserver`、`userId`、または `accessToken` がまだ利用できず、ターゲット Matrix アカウントをまだ解決できない場合の暗号化状態
- 古い crypto ストアにアカウントの記録済みデバイス ID がない場合の暗号化状態
- 複数の Matrix アカウントが設定されているが `channels.matrix.defaultAccount` が設定されていない場合の、1 つの共有フラット Matrix ストアの自動移行
- 標準の Matrix パッケージではなくリポジトリパスに固定されているカスタム Plugin パスのインストール（`openclaw doctor` によって表示されます）
- 古いストアにバックアップ済みキーがあったものの復号キーをローカルに保持していなかった場合の、欠落した復旧キー

古いインストールに、バックアップされたことのないローカル専用の暗号化履歴があった場合、アップグレード後も一部の古い暗号化メッセージは読めないままになることがあります。

## 推奨アップグレードフロー

1. OpenClaw と Matrix Plugin を通常どおり更新します。
   起動時に Matrix 移行をすぐ完了できるよう、`--no-restart` なしの通常の `openclaw update` を推奨します。
2. 次を実行します。

   ```bash
   openclaw doctor --fix
   ```

   Matrix に実行可能な移行作業がある場合、doctor はまず移行前スナップショットを作成または再利用し、アーカイブパスを出力します。

3. Gateway を起動または再起動します。
4. 現在の検証状態とバックアップ状態を確認します。

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. 修復する Matrix アカウントの復旧キーを、アカウント固有の環境変数に入れます。単一のデフォルトアカウントでは、`MATRIX_RECOVERY_KEY` で問題ありません。複数アカウントでは、たとえば `MATRIX_RECOVERY_KEY_ASSISTANT` のようにアカウントごとに 1 つの変数を使い、コマンドに `--account assistant` を追加します。

6. OpenClaw から復旧キーが必要だと表示された場合、対応するアカウントに対してコマンドを実行します。

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. このデバイスがまだ未検証の場合、対応するアカウントに対してコマンドを実行します。

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   復旧キーが受け付けられ、バックアップが使用可能でも、`Cross-signing verified`
   がまだ `no` の場合は、別の Matrix クライアントから自己検証を完了します。

   ```bash
   openclaw matrix verify self
   ```

   別の Matrix クライアントでリクエストを承認し、絵文字または数字を比較し、
   一致する場合にのみ `yes` と入力します。このコマンドは、成功を報告する前に Matrix
   ID の完全な信頼を待ちます。

8. 復旧不能な古い履歴を意図的に放棄し、今後のメッセージ用に新しいバックアップ基準を作りたい場合は、次を実行します。

   ```bash
   openclaw matrix verify backup reset --yes
   ```

   古い復旧キーで新しいバックアップを解除できないようにする必要がある場合にのみ、`--rotate-recovery-key` を追加します。

9. サーバー側のキー バックアップがまだ存在しない場合は、今後の復旧のために作成します。

   ```bash
   openclaw matrix verify bootstrap
   ```

## 暗号化された移行の仕組み

暗号化された移行は 2 段階のプロセスです。

1. 起動時または `openclaw doctor --fix` が、暗号化移行が実行可能な場合に移行前スナップショットを作成または再利用し、その後 Matrix Plugin にバンドルされた crypto インスペクターを通じて古い Matrix rust crypto ストアを検査します。
2. バックアップ復号キーが見つかった場合、OpenClaw はそれを Matrix SQLite 状態へインポートし、ルームキー復元を保留中としてマークします。
3. 次回の Matrix 起動時に、OpenClaw はバックアップ済みルームキーを新しい crypto ストアへ自動的に復元します。途中でアクセストークンがローテーションされた場合も、保留中の復元状態は兄弟トークンハッシュ ストレージルートからも取得されます。

古いストアが、バックアップされたことのないルームキーを報告した場合、OpenClaw は復旧に成功したふりをせず警告します。

## よくあるメッセージとその意味

### アップグレードと検出メッセージ

`Matrix plugin upgraded in place.`（doctor）または `matrix: plugin upgraded in place for account "..."`（起動時）

- 意味: 古いディスク上の Matrix 状態が検出され、現在のレイアウトへ移行されました。
- 対応: 同じ出力に警告も含まれていない限り、何もする必要はありません。

`Matrix migration snapshot created before applying Matrix upgrades.` / `Matrix migration snapshot reused before applying Matrix upgrades.`

- 意味: doctor が Matrix 状態を変更する前に復旧アーカイブを作成したか、既存のスナップショットマーカーを見つけ、重複バックアップを作成する代わりにそのアーカイブを再利用しました。起動時は同じ内容が `matrix: created pre-migration backup snapshot: ...` / `matrix: reusing existing pre-migration backup snapshot: ...` としてログに記録されます。
- 対応: 移行の成功を確認するまで、出力されたアーカイブパスを保持してください。

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- 意味: 古い Matrix 状態は存在しますが、Matrix が設定されていないため OpenClaw はそれを現在の Matrix アカウントに対応付けられません。
- 対応: `channels.matrix` を設定し、その後 `openclaw doctor --fix` を再実行するか Gateway を再起動してください。

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 意味: OpenClaw は古い状態を見つけましたが、正確な現在のアカウント/デバイスルートをまだ特定できません。
- 対応: 動作する Matrix ログインで Gateway を一度起動するか、キャッシュ済み認証情報が存在した後に `openclaw doctor --fix` を再実行してください。

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 意味: OpenClaw は 1 つの共有フラット Matrix ストアを見つけましたが、どの名前付き Matrix アカウントが受け取るべきかを推測することを拒否しています。
- 対応: `channels.matrix.defaultAccount` を意図したアカウントに設定し、その後 `openclaw doctor --fix` を再実行するか Gateway を再起動してください。

ブロックされているストアが古い暗号化 crypto ストアの場合、同じ 3 つの警告は `Legacy Matrix encrypted state detected at ...` というプレフィックスでも表示されます。

`Matrix legacy sync store not migrated because the target already exists (...)` / `Matrix legacy crypto store not migrated because the target already exists (...)`

- 意味: 新しいアカウントスコープの場所に同期ストアまたは crypto ストアが既にあるため、OpenClaw は自動的に上書きしませんでした。
- 対応: 競合するターゲットを手動で削除または移動する前に、現在のアカウントが正しいことを確認してください。

`Failed migrating Matrix legacy sync store (...)` または `Failed migrating Matrix legacy crypto store (...)`

- 意味: OpenClaw は古い Matrix 状態の移動を試みましたが、ファイルシステム操作が失敗しました。
- 対応: ファイルシステム権限とディスク状態を確認し、その後 `openclaw doctor --fix` を再実行してください。

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- 意味: OpenClaw は古い Matrix 状態を検出しましたが、移行はまだ ID または認証情報データの不足でブロックされています。起動時は `matrix: migration remains in a warning-only state; no pre-migration snapshot was needed yet` としてログに記録されます。
- 対応: Matrix ログインまたは設定セットアップを完了し、その後 `openclaw doctor --fix` を再実行するか Gateway を再起動してください。

`Legacy Matrix encrypted state was detected, but the Matrix crypto inspector is unavailable.`

- 意味: OpenClaw は古い暗号化 Matrix 状態を見つけましたが、Matrix Plugin ビルドに古い rust crypto ストアを検査する crypto インスペクターモジュールがありません。
- 対応: Matrix Plugin を再インストールまたは修復（`openclaw plugins install @openclaw/matrix`、またはリポジトリチェックアウトの場合は `openclaw plugins install ./path/to/local/matrix-plugin`）し、その後 `openclaw doctor --fix` を再実行するか Gateway を再起動してください。

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- 意味: OpenClawは、先に復旧スナップショットを作成できなかったため、Matrix状態の変更を拒否しました。
- 対処: バックアップエラーを解消してから、`openclaw doctor --fix`を再実行するか、Gatewayを再起動します。

`Failed migrating legacy Matrix client storage: ...`

- 意味: Matrixクライアント側フォールバックが古いストレージを見つけましたが、移行に失敗しました。OpenClawは、完了済みの移動をロールバックし、新しいストアで暗黙に起動するのではなく、そのフォールバックを中止します。このエラーは、フラットストアの対象アカウントが現在起動中のアカウントと異なる場合にも表示されます。
- 対処: ファイルシステムの権限や競合を確認し、古い状態をそのまま保持して、エラーを修正した後に再試行します。

`Matrix is installed from a custom path: ...`

- 意味: Matrixはパスインストールに固定されているため、メインライン更新では既定のMatrixパッケージに自動的に置き換えられません。
- 対処: 既定のMatrix Pluginに戻したい場合は、`openclaw plugins install @openclaw/matrix`で再インストールします。

### 暗号化状態の復旧メッセージ

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- 意味: バックアップ済みのルームキーが新しい暗号ストアに正常に復元されました。
- 対処: 通常は何もする必要はありません。

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- 意味: 一部の古いルームキーは古いローカルストアにのみ存在し、Matrixバックアップにアップロードされたことがありませんでした。準備中には、同じ制限が`Legacy Matrix encrypted state for account "..." contains N room key(s) that were never backed up.`として報告されます。
- 対処: 別の検証済みクライアントからそれらのキーを手動で復旧できない限り、一部の古い暗号化履歴は利用できないままになると考えてください。

`Legacy Matrix encrypted state detected at ... but no device ID was found for account "..."`

- 意味: 古い暗号ストアには、どのMatrixデバイスに属していたかが記録されていないため、OpenClawは安全に検査できません。
- 対処: 古い暗号化履歴は自動的には復旧できません。OpenClawはそれなしで続行します。

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- 意味: バックアップは存在しますが、OpenClawは復旧キーを自動的に復旧できませんでした。
- 対処: `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`を実行します（キーを引数として渡すより推奨されます）。

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- 意味: OpenClawは古い暗号化ストアを見つけましたが、復旧を準備するのに十分な安全性で検査できませんでした。
- 対処: `openclaw doctor --fix`を再実行します。繰り返す場合は、古い状態ディレクトリをそのまま保持し、別の検証済みMatrixクライアントと`printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`を使って復旧します。

`Legacy Matrix backup key was found for account "...", but Matrix SQLite state already contains a different recovery key. Leaving the existing state unchanged.`

- 意味: OpenClawはバックアップキーの競合を検出し、現在の復旧キー状態を自動的に上書きすることを拒否しました。
- 対処: 復元コマンドを再試行する前に、どの復旧キーが正しいかを確認してください。

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- 意味: これは古いストレージ形式の厳しい制限です。
- 対処: バックアップ済みのキーは引き続き復元できますが、ローカルのみの暗号化履歴は利用できないままになる可能性があります。

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- 意味: 新しいPluginが復元を試行しましたが、Matrixがエラーを返しました。
- 対処: `openclaw matrix verify backup status`を実行し、必要に応じて`printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`で再試行します。

### 手動復旧メッセージ

`openclaw matrix verify status`と`openclaw matrix verify backup status`は、このデバイスでルームキーバックアップが正常でない場合に、`Backup issue:`行と`Next steps:`ガイダンスを出力します。

| バックアップの問題 | 意味 | 修正 |
| --------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `no room-key backup exists on the homeserver` | 復元元がありません | ルームキーバックアップを作成するには`openclaw matrix verify bootstrap` |
| `backup decryption key is not loaded on this device` | キーは存在しますが、ここでは有効ではありません | `openclaw matrix verify backup restore`。それでもキーを読み込めない場合は、`--recovery-key-stdin`経由で復旧キーをパイプします |
| `backup decryption key could not be loaded from secret storage (...)` | シークレットストレージの読み込みに失敗したか、サポートされていません | 復旧キーをパイプします: `printf '%s\n' "$MATRIX_RECOVERY_KEY" \| openclaw matrix verify backup restore --recovery-key-stdin` |
| `backup key mismatch (...)` | 保存済みキーが有効なサーバーバックアップと一致しません | 有効なサーバーバックアップキーで`verify backup restore --recovery-key-stdin`を再実行するか、新しいベースライン用に`verify backup reset --yes`を実行します |
| `backup signature chain is not trusted by this device` | デバイスはまだクロス署名チェーンを信頼していません | `verify device --recovery-key-stdin`を実行し、信頼がまだ不完全な場合は別の検証済みクライアントから`verify self`を実行します |
| `backup exists but is not active on this device` | サーバーバックアップは存在しますが、ローカルセッションが非アクティブです | 先にデバイスを検証してから、`openclaw matrix verify backup status`で再確認します |
| `backup trust state could not be fully determined` | 診断は決定的ではありませんでした | `openclaw matrix verify status --verbose` |

その他の復旧エラー:

`Matrix recovery key is required`

- 意味: 復旧キーが必要な復旧手順で、復旧キーを指定せずに実行しました。
- 対処: `--recovery-key-stdin`を付けてコマンドを再実行します。例: `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`。

`Invalid Matrix recovery key: ...`

- 意味: 指定されたキーを解析できないか、期待される形式と一致しませんでした。
- 対処: Matrixクライアントまたは復旧キーのエクスポートにある正確な復旧キーで再試行します。

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- 意味: 復旧キーにより利用可能なバックアップ素材のロックは解除されましたが、Matrixはこのデバイスに対する完全なクロス署名ID信頼をまだ確立していません。コマンド出力で`Recovery key accepted`、`Backup usable`、`Cross-signing verified`、`Device verified by owner`を確認してください。
- 対処: `openclaw matrix verify self`を実行し、別のMatrixクライアントでリクエストを承認し、SASを比較して、一致する場合にのみ`yes`と入力します。現在のクロス署名IDを意図的に置き換えたい場合にのみ、`printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`を使用してください。

復旧不能な古い暗号化履歴の喪失を受け入れる場合は、代わりに`openclaw matrix verify backup reset --yes`で現在のバックアップベースラインをリセットできます。保存済みバックアップシークレットが壊れている場合、そのリセットによりシークレットストレージも修復されるため、再起動後に新しいバックアップキーを正しく読み込めます。

### カスタムPluginインストールメッセージ

`Matrix is installed from a custom path that no longer exists: ...`

- 意味: Pluginインストール記録が、すでに存在しないローカルパスを指しています。
- 対処: `openclaw plugins install @openclaw/matrix`で再インストールします。リポジトリチェックアウトから実行している場合は、`openclaw plugins install ./path/to/local/matrix-plugin`を使用します。`openclaw doctor --fix`でも、古いMatrix Plugin参照を削除できます。

## 暗号化履歴がまだ戻らない場合

次のチェックを順番に実行します。

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

バックアップの復元に成功しても一部の古いルームの履歴がまだ見つからない場合、それらの見つからないキーは以前のPluginによってバックアップされていなかった可能性があります。

## 今後のメッセージ用に新しく始めたい場合

復旧不能な古い暗号化履歴の喪失を受け入れ、今後に向けてクリーンなバックアップベースラインだけが必要な場合は、次のコマンドを順番に実行します。

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

その後もデバイスが未検証の場合は、MatrixクライアントからSAS絵文字または10進コードを比較し、一致することを確認して検証を完了します。

## 関連

- [Matrix](/ja-JP/channels/matrix): チャンネルのセットアップと設定。
- [Matrixプッシュルール](/ja-JP/channels/matrix-push-rules): 通知ルーティング。
- [Doctor](/ja-JP/gateway/doctor): ヘルスチェックと自動移行トリガー。
- [移行ガイド](/ja-JP/install/migrating): すべての移行パス（マシン移動、システム間インポート）。
- [Plugins](/ja-JP/tools/plugin): Pluginのインストールと登録。

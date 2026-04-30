---
read_when:
    - 既存の Matrix インストールのアップグレード
    - 暗号化された Matrix 履歴とデバイス状態の移行
summary: OpenClawが以前の Matrix Plugin をインプレースでアップグレードする方法。暗号化状態のリカバリ制限と手動リカバリ手順を含む。
title: Matrix の移行
x-i18n:
    generated_at: "2026-04-30T04:59:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: fff409eef1b7da7be4b63d8459a62b8365a04adf989f271a2f2c4aef46e90716
    source_path: channels/matrix-migration.md
    workflow: 16
---

以前の公開 `matrix` プラグインから現在の実装へアップグレードします。

ほとんどのユーザーでは、アップグレードはそのまま適用されます。

- プラグインは `@openclaw/matrix` のままです
- チャンネルは `matrix` のままです
- 設定は `channels.matrix` 配下のままです
- キャッシュ済み認証情報は `~/.openclaw/credentials/matrix/` 配下のままです
- ランタイム状態は `~/.openclaw/matrix/` 配下のままです

設定キーをリネームしたり、新しい名前でプラグインを再インストールしたりする必要はありません。

## 移行が自動で行うこと

Gateway の起動時、および [`openclaw doctor --fix`](/ja-JP/gateway/doctor) を実行したときに、OpenClaw は古い Matrix 状態の修復を自動で試みます。
実行可能な Matrix 移行手順がディスク上の状態を変更する前に、OpenClaw は焦点を絞ったリカバリースナップショットを作成するか、既存のものを再利用します。

`openclaw update` を使用する場合、正確なトリガーは OpenClaw のインストール方法によって異なります。

- ソースインストールでは、更新フロー中に `openclaw doctor --fix` を実行し、その後デフォルトで Gateway を再起動します
- パッケージマネージャーによるインストールでは、パッケージを更新し、非対話の doctor パスを実行してから、デフォルトの Gateway 再起動に任せて起動時に Matrix 移行を完了させます
- `openclaw update --no-restart` を使用する場合、起動に紐づく Matrix 移行は、後で `openclaw doctor --fix` を実行して Gateway を再起動するまで延期されます

自動移行の対象は次のとおりです。

- `~/Backups/openclaw-migrations/` 配下に移行前スナップショットを作成または再利用する
- キャッシュ済みの Matrix 認証情報を再利用する
- 同じアカウント選択と `channels.matrix` 設定を維持する
- 最も古いフラットな Matrix 同期ストアを、現在のアカウントスコープの場所へ移動する
- 対象アカウントを安全に解決できる場合、最も古いフラットな Matrix 暗号ストアを、現在のアカウントスコープの場所へ移動する
- 以前に保存された Matrix ルームキー バックアップ復号キーが古い rust 暗号ストアからローカルに存在する場合、それを抽出する
- 後でアクセストークンが変わったときに、同じ Matrix アカウント、ホームサーバー、ユーザーについて、既存の最も完全なトークンハッシュ保存ルートを再利用する
- Matrix アクセストークンが変わってもアカウント/デバイス ID が同じままの場合、保留中の暗号化状態復元メタデータを探して、兄弟トークンハッシュ保存ルートをスキャンする
- 次回の Matrix 起動時に、バックアップ済みルームキーを新しい暗号ストアへ復元する

スナップショットの詳細:

- OpenClaw は、スナップショットの成功後に `~/.openclaw/matrix/migration-snapshot.json` にマーカーファイルを書き込み、後続の起動および修復パスが同じアーカイブを再利用できるようにします。
- これらの自動 Matrix 移行スナップショットは、設定と状態のみをバックアップします（`includeWorkspace: false`）。
- Matrix に警告のみの移行状態しかない場合、たとえば `userId` または `accessToken` がまだ不足している場合、実行可能な Matrix 変更がないため、OpenClaw はまだスナップショットを作成しません。
- スナップショット手順が失敗した場合、OpenClaw はリカバリーポイントなしに状態を変更する代わりに、その実行での Matrix 移行をスキップします。

複数アカウントのアップグレードについて:

- 最も古いフラットな Matrix ストア（`~/.openclaw/matrix/bot-storage.json` と `~/.openclaw/matrix/crypto/`）は単一ストアレイアウト由来のため、OpenClaw は解決済みの Matrix アカウント対象 1 つにしか移行できません
- すでにアカウントスコープになっているレガシー Matrix ストアは、設定済みの Matrix アカウントごとに検出され、準備されます

## 移行が自動でできないこと

以前の公開 Matrix プラグインは、Matrix ルームキーバックアップを自動作成しませんでした。ローカル暗号状態を永続化し、デバイス検証を要求していましたが、ルームキーがホームサーバーにバックアップされることは保証していませんでした。

そのため、一部の暗号化済みインストールは部分的にしか移行できません。

OpenClaw は次を自動復旧できません。

- バックアップされたことのないローカルのみのルームキー
- `homeserver`、`userId`、または `accessToken` がまだ利用できず、対象 Matrix アカウントをまだ解決できない場合の暗号化状態
- 複数の Matrix アカウントが設定されているが `channels.matrix.defaultAccount` が設定されていない場合の、共有された 1 つのフラットな Matrix ストアの自動移行
- 標準 Matrix パッケージではなくリポジトリパスに固定されたカスタムプラグインパスのインストール
- 古いストアにバックアップ済みキーがあったものの、復号キーをローカルに保持していなかった場合の不足したリカバリーキー

現在の警告範囲:

- カスタム Matrix プラグインパスのインストールは、Gateway 起動時と `openclaw doctor` の両方で表示されます

古いインストールに、バックアップされたことのないローカルのみの暗号化履歴があった場合、アップグレード後も一部の古い暗号化メッセージは読めないままになることがあります。

## 推奨アップグレードフロー

1. OpenClaw と Matrix プラグインを通常どおり更新します。
   起動時に Matrix 移行をすぐ完了できるように、`--no-restart` なしの通常の `openclaw update` を推奨します。
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

5. 修復している Matrix アカウントのリカバリーキーを、アカウント固有の環境変数に入れます。単一のデフォルトアカウントでは、`MATRIX_RECOVERY_KEY` で問題ありません。複数アカウントの場合は、たとえば `MATRIX_RECOVERY_KEY_ASSISTANT` のようにアカウントごとに 1 つの変数を使い、コマンドに `--account assistant` を追加します。

6. リカバリーキーが必要だと OpenClaw から示された場合は、対応するアカウントで次のコマンドを実行します。

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. このデバイスがまだ未検証の場合は、対応するアカウントで次のコマンドを実行します。

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   リカバリーキーが受け入れられ、バックアップが利用可能でも、`Cross-signing verified`
   がまだ `no` の場合は、別の Matrix クライアントから自己検証を完了します。

   ```bash
   openclaw matrix verify self
   ```

   別の Matrix クライアントでリクエストを承認し、絵文字または数字を比較し、
   一致する場合にのみ `yes` と入力します。このコマンドは、`Cross-signing verified` が `yes` になった後にのみ正常終了します。

8. 復旧不能な古い履歴を意図的に放棄し、今後のメッセージ用に新しいバックアップ基準を作成したい場合は、次を実行します。

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. サーバー側のキーバックアップがまだ存在しない場合は、将来の復旧のために作成します。

   ```bash
   openclaw matrix verify bootstrap
   ```

## 暗号化移行の仕組み

暗号化移行は 2 段階のプロセスです。

1. 暗号化移行が実行可能な場合、起動時または `openclaw doctor --fix` が移行前スナップショットを作成または再利用します。
2. 起動時または `openclaw doctor --fix` が、アクティブな Matrix プラグインインストールを通じて古い Matrix 暗号ストアを検査します。
3. バックアップ復号キーが見つかった場合、OpenClaw はそれを新しいリカバリーキーフローへ書き込み、ルームキー復元を保留中としてマークします。
4. 次回の Matrix 起動時に、OpenClaw はバックアップ済みルームキーを新しい暗号ストアへ自動復元します。

古いストアが、バックアップされたことのないルームキーを報告した場合、OpenClaw は復旧が成功したふりをするのではなく警告します。

## よくあるメッセージとその意味

### アップグレードおよび検出メッセージ

`Matrix plugin upgraded in place.`

- 意味: ディスク上の古い Matrix 状態が検出され、現在のレイアウトへ移行されました。
- 対処: 同じ出力に警告も含まれていない限り、何もする必要はありません。

`Matrix migration snapshot created before applying Matrix upgrades.`

- 意味: OpenClaw は Matrix 状態を変更する前にリカバリーアーカイブを作成しました。
- 対処: 移行が成功したことを確認するまで、出力されたアーカイブパスを保持してください。

`Matrix migration snapshot reused before applying Matrix upgrades.`

- 意味: OpenClaw は既存の Matrix 移行スナップショットマーカーを見つけ、重複したバックアップを作成する代わりにそのアーカイブを再利用しました。
- 対処: 移行が成功したことを確認するまで、出力されたアーカイブパスを保持してください。

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- 意味: 古い Matrix 状態は存在しますが、Matrix が設定されていないため、OpenClaw はそれを現在の Matrix アカウントに対応付けできません。
- 対処: `channels.matrix` を設定し、その後 `openclaw doctor --fix` を再実行するか Gateway を再起動します。

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 意味: OpenClaw は古い状態を見つけましたが、正確な現在のアカウント/デバイスルートをまだ特定できません。
- 対処: 動作する Matrix ログインで Gateway を一度起動するか、キャッシュ済み認証情報が存在した後で `openclaw doctor --fix` を再実行します。

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 意味: OpenClaw は共有された 1 つのフラットな Matrix ストアを見つけましたが、どの名前付き Matrix アカウントが受け取るべきかを推測することを拒否しています。
- 対処: `channels.matrix.defaultAccount` を意図したアカウントに設定し、その後 `openclaw doctor --fix` を再実行するか Gateway を再起動します。

`Matrix legacy sync store not migrated because the target already exists (...)`

- 意味: 新しいアカウントスコープの場所に同期ストアまたは暗号ストアがすでにあるため、OpenClaw は自動で上書きしませんでした。
- 対処: 競合する対象を手動で削除または移動する前に、現在のアカウントが正しいものであることを確認してください。

`Failed migrating Matrix legacy sync store (...)` または `Failed migrating Matrix legacy crypto store (...)`

- 意味: OpenClaw は古い Matrix 状態を移動しようとしましたが、ファイルシステム操作が失敗しました。
- 対処: ファイルシステムの権限とディスク状態を調べ、その後 `openclaw doctor --fix` を再実行します。

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- 意味: OpenClaw は古い暗号化済み Matrix ストアを見つけましたが、それを接続する現在の Matrix 設定がありません。
- 対処: `channels.matrix` を設定し、その後 `openclaw doctor --fix` を再実行するか Gateway を再起動します。

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 意味: 暗号化ストアは存在しますが、OpenClaw はそれがどの現在のアカウント/デバイスに属するかを安全に判断できません。
- 対処: 動作する Matrix ログインで Gateway を一度起動するか、キャッシュ済み認証情報が利用可能になった後で `openclaw doctor --fix` を再実行します。

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 意味: OpenClaw は共有された 1 つのフラットなレガシー暗号ストアを見つけましたが、どの名前付き Matrix アカウントが受け取るべきかを推測することを拒否しています。
- 対処: `channels.matrix.defaultAccount` を意図したアカウントに設定し、その後 `openclaw doctor --fix` を再実行するか Gateway を再起動します。

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- 意味: OpenClaw は古い Matrix 状態を検出しましたが、移行はまだ不足している ID または認証情報データでブロックされています。
- 対処: Matrix ログインまたは設定セットアップを完了し、その後 `openclaw doctor --fix` を再実行するか Gateway を再起動します。

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- 意味: OpenClaw は古い暗号化済み Matrix 状態を見つけましたが、通常そのストアを検査する Matrix Plugin からヘルパーエントリポイントを読み込めませんでした。
- 対処方法: Matrix Plugin を再インストールまたは修復し（`openclaw plugins install @openclaw/matrix`、またはリポジトリのチェックアウトでは `openclaw plugins install ./path/to/local/matrix-plugin`）、その後 `openclaw doctor --fix` を再実行するか Gateway を再起動します。
- npm が OpenClaw 所有の Matrix パッケージを非推奨として報告する場合は、新しい npm パッケージが公開されるまで、現在のパッケージ化済み OpenClaw ビルドに同梱された
  Plugin、またはローカルチェックアウトパスを使用してください。

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- 意味: OpenClaw は Plugin ルートを抜け出す、または Plugin 境界チェックに失敗するヘルパーファイルパスを見つけたため、そのインポートを拒否しました。
- 対処方法: 信頼できるパスから Matrix Plugin を再インストールし、その後 `openclaw doctor --fix` を再実行するか Gateway を再起動します。

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- 意味: OpenClaw は先に復旧スナップショットを作成できなかったため、Matrix 状態の変更を拒否しました。
- 対処方法: バックアップエラーを解決してから、`openclaw doctor --fix` を再実行するか Gateway を再起動します。

`Failed migrating legacy Matrix client storage: ...`

- 意味: Matrix クライアント側のフォールバックが古いフラットストレージを見つけましたが、移動に失敗しました。OpenClaw は、何も知らせずに新しいストアで起動する代わりに、このフォールバックを中断するようになりました。
- 対処方法: ファイルシステムの権限や競合を調査し、古い状態をそのまま保持して、エラーを修正してから再試行します。

`Matrix is installed from a custom path: ...`

- 意味: Matrix はパスインストールに固定されているため、メインラインの更新ではリポジトリ標準の Matrix パッケージに自動的に置き換えられません。
- 対処方法: デフォルトの Matrix Plugin に戻したい場合は、`openclaw plugins install @openclaw/matrix` で再インストールします。
- npm が OpenClaw 所有の Matrix パッケージを非推奨として報告する場合は、新しい npm パッケージが公開されるまで、現在のパッケージ化済み OpenClaw ビルドに同梱された
  Plugin を使用してください。

### 暗号化状態の復旧メッセージ

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- 意味: バックアップ済みのルームキーが新しい暗号化ストアへ正常に復元されました。
- 対処方法: 通常は何もする必要はありません。

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- 意味: 一部の古いルームキーは古いローカルストアにのみ存在し、Matrix バックアップへ一度もアップロードされていませんでした。
- 対処方法: 別の検証済みクライアントからそれらのキーを手動で復旧できない限り、一部の古い暗号化履歴は引き続き利用できない可能性があります。

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- 意味: バックアップは存在しますが、OpenClaw は復旧キーを自動的に復旧できませんでした。
- 対処方法: `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` を実行します。

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- 意味: OpenClaw は古い暗号化ストアを見つけましたが、復旧を準備できるほど安全には検査できませんでした。
- 対処方法: `openclaw doctor --fix` を再実行します。繰り返す場合は、古い状態ディレクトリをそのまま保持し、別の検証済み Matrix クライアントと `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` を使用して復旧します。

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- 意味: OpenClaw はバックアップキーの競合を検出し、現在の recovery-key ファイルを自動的に上書きすることを拒否しました。
- 対処方法: 復元コマンドを再試行する前に、どの復旧キーが正しいかを確認してください。

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- 意味: これは古いストレージ形式の厳しい制限です。
- 対処方法: バックアップ済みのキーは引き続き復元できますが、ローカルのみの暗号化履歴は利用できないままになる可能性があります。

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- 意味: 新しい Plugin が復元を試みましたが、Matrix がエラーを返しました。
- 対処方法: `openclaw matrix verify backup status` を実行し、必要に応じて `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` で再試行します。

### 手動復旧メッセージ

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- 意味: OpenClaw はバックアップキーがあるはずだと認識していますが、このデバイスでは有効になっていません。
- 対処方法: `openclaw matrix verify backup restore` を実行します。必要に応じて `MATRIX_RECOVERY_KEY` を設定し、`printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` を実行します。

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- 意味: このデバイスには現在、復旧キーが保存されていません。
- 対処方法: `MATRIX_RECOVERY_KEY` を設定し、`printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` を実行してから、バックアップを復元します。

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- 意味: 保存されているキーが有効な Matrix バックアップと一致しません。
- 対処方法: `MATRIX_RECOVERY_KEY` に正しいキーを設定し、`printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` を実行します。

復旧不能な古い暗号化履歴を失うことを受け入れる場合は、代わりに
`openclaw matrix verify backup reset --yes` で現在のバックアップ基準をリセットできます。保存されているバックアップシークレットが壊れている場合、そのリセットによってシークレットストレージも再作成され、再起動後に
新しいバックアップキーが正しく読み込まれることがあります。

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- 意味: バックアップは存在しますが、このデバイスはまだクロス署名チェーンを十分に信頼していません。
- 対処方法: `MATRIX_RECOVERY_KEY` を設定し、`printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` を実行します。

`Matrix recovery key is required`

- 意味: 復旧キーが必要な場面で、復旧キーを指定せずに復旧手順を試みました。
- 対処方法: たとえば `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` のように、`--recovery-key-stdin` を付けてコマンドを再実行します。

`Invalid Matrix recovery key: ...`

- 意味: 指定されたキーを解析できなかったか、想定される形式と一致しませんでした。
- 対処方法: Matrix クライアントまたは recovery-key ファイルにある正確な復旧キーで再試行します。

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- 意味: OpenClaw は復旧キーを適用できましたが、Matrix はこのデバイスに対する完全なクロス署名 ID 信頼をまだ
  確立していません。コマンド出力で `Recovery key accepted`、`Backup usable`、
  `Cross-signing verified`、`Device verified by owner` を確認してください。
- 対処方法: `openclaw matrix verify self` を実行し、別の
  Matrix クライアントで要求を承認し、SAS を比較して、一致する場合にのみ `yes` と入力します。この
  コマンドは、成功を報告する前に完全な Matrix ID 信頼を待機します。
  現在のクロス署名 ID を意図的に置き換えたい場合にのみ、
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  を使用してください。

`Matrix key backup is not active on this device after loading from secret storage.`

- 意味: シークレットストレージから、このデバイス上で有効なバックアップセッションを生成できませんでした。
- 対処方法: 先にデバイスを検証し、その後 `openclaw matrix verify backup status` で再確認します。

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- 意味: このデバイスは、デバイス検証が完了するまでシークレットストレージから復元できません。
- 対処方法: 先に `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` を実行します。

### カスタム Plugin インストールメッセージ

`Matrix is installed from a custom path that no longer exists: ...`

- 意味: Plugin インストール記録が、存在しなくなったローカルパスを指しています。
- 対処方法: `openclaw plugins install @openclaw/matrix` で再インストールします。リポジトリのチェックアウトから実行している場合は、`openclaw plugins install ./path/to/local/matrix-plugin` を使用します。
- npm が OpenClaw 所有の Matrix パッケージを非推奨として報告する場合は、新しい npm パッケージが公開されるまで、現在のパッケージ化済み OpenClaw ビルドに同梱された
  Plugin、またはローカルチェックアウトパスを使用してください。

## 暗号化履歴がまだ戻らない場合

次のチェックを順番に実行します。

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

バックアップが正常に復元されても、一部の古いルームで履歴がまだ欠けている場合、それらの欠落キーは以前の Plugin によっておそらく一度もバックアップされていません。

## 今後のメッセージのために新しく始めたい場合

復旧不能な古い暗号化履歴を失うことを受け入れ、今後に向けてクリーンなバックアップ基準だけが必要な場合は、次のコマンドを順番に実行します。

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

その後もデバイスが未検証の場合は、Matrix クライアントから SAS 絵文字または 10 進コードを比較し、一致することを確認して検証を完了してください。

## 関連項目

- [Matrix](/ja-JP/channels/matrix): チャネルのセットアップと設定。
- [Matrix プッシュルール](/ja-JP/channels/matrix-push-rules): 通知ルーティング。
- [Doctor](/ja-JP/gateway/doctor): ヘルスチェックと自動移行トリガー。
- [移行ガイド](/ja-JP/install/migrating): すべての移行パス（マシン移動、クロスシステムインポート）。
- [Plugins](/ja-JP/tools/plugin): Plugin のインストールと登録。

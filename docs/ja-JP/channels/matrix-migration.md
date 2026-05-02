---
read_when:
    - 既存の Matrix インストールをアップグレードする
    - 暗号化された Matrix 履歴とデバイス状態の移行
summary: OpenClaw が以前の Matrix Plugin をインプレースでアップグレードする方法。暗号化状態の復旧制限と手動復旧手順を含む。
title: Matrix の移行
x-i18n:
    generated_at: "2026-05-02T22:16:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8bc9b875fef0ae08978061a9fc7cbb076617009d79487ca8329e03076103b32c
    source_path: channels/matrix-migration.md
    workflow: 16
---

以前の公開 `matrix` Plugin から現在の実装へアップグレードします。

ほとんどのユーザーでは、アップグレードはそのまま実行されます。

- Plugin は `@openclaw/matrix` のままです
- チャンネルは `matrix` のままです
- 設定は `channels.matrix` 配下のままです
- キャッシュされた認証情報は `~/.openclaw/credentials/matrix/` 配下のままです
- ランタイム状態は `~/.openclaw/matrix/` 配下のままです

設定キーを名前変更したり、Plugin を新しい名前で再インストールしたりする必要はありません。

## 移行で自動的に行われること

Gateway の起動時、および [`openclaw doctor --fix`](/ja-JP/gateway/doctor) を実行したとき、OpenClaw は古い Matrix 状態の修復を自動的に試みます。
実行可能な Matrix 移行手順がディスク上の状態を変更する前に、OpenClaw は対象を絞ったリカバリースナップショットを作成または再利用します。

`openclaw update` を使用する場合、正確なトリガーは OpenClaw のインストール方法によって異なります。

- ソースインストールでは、更新フロー中に `openclaw doctor --fix` を実行し、その後デフォルトで Gateway を再起動します
- パッケージマネージャーによるインストールでは、パッケージを更新し、非対話型の doctor パスを実行した後、起動時に Matrix 移行を完了できるようデフォルトの Gateway 再起動に依存します
- `openclaw update --no-restart` を使用した場合、起動に裏付けられた Matrix 移行は、後で `openclaw doctor --fix` を実行して Gateway を再起動するまで延期されます

自動移行の対象は次のとおりです。

- `~/Backups/openclaw-migrations/` 配下に移行前スナップショットを作成または再利用する
- キャッシュ済みの Matrix 認証情報を再利用する
- 同じアカウント選択と `channels.matrix` 設定を維持する
- 最も古いフラットな Matrix 同期ストアを現在のアカウントスコープの場所へ移動する
- ターゲットアカウントを安全に解決できる場合、最も古いフラットな Matrix 暗号ストアを現在のアカウントスコープの場所へ移動する
- 以前に保存された Matrix ルームキー バックアップ復号キーを、ローカルに存在する場合は古い rust 暗号ストアから抽出する
- 後でアクセストークンが変更された場合、同じ Matrix アカウント、ホームサーバー、ユーザーについて、最も完全な既存のトークンハッシュ ストレージルートを再利用する
- Matrix アクセストークンが変更されてもアカウント/デバイス ID が同じままの場合、保留中の暗号化状態復元メタデータを兄弟トークンハッシュ ストレージルートからスキャンする
- 次回の Matrix 起動時に、バックアップ済みルームキーを新しい暗号ストアへ復元する

スナップショットの詳細:

- OpenClaw は、スナップショットが成功した後、`~/.openclaw/matrix/migration-snapshot.json` にマーカーファイルを書き込みます。これにより、後続の起動パスや修復パスで同じアーカイブを再利用できます。
- これらの自動 Matrix 移行スナップショットは、設定と状態のみをバックアップします（`includeWorkspace: false`）。
- Matrix に警告のみの移行状態しかない場合、たとえば `userId` または `accessToken` がまだ欠けている場合、実行可能な Matrix 変更がないため、OpenClaw はまだスナップショットを作成しません。
- スナップショット手順が失敗した場合、OpenClaw はリカバリーポイントなしで状態を変更する代わりに、その実行での Matrix 移行をスキップします。

複数アカウントのアップグレードについて:

- 最も古いフラットな Matrix ストア（`~/.openclaw/matrix/bot-storage.json` と `~/.openclaw/matrix/crypto/`）は単一ストア レイアウトに由来するため、OpenClaw はそれを解決済みの 1 つの Matrix アカウント ターゲットにのみ移行できます
- すでにアカウントスコープになっているレガシー Matrix ストアは検出され、設定済みの Matrix アカウントごとに準備されます

## 移行で自動的にはできないこと

以前の公開 Matrix Plugin は、Matrix ルームキー バックアップを自動的には作成しませんでした。ローカル暗号状態を永続化し、デバイス検証を要求していましたが、ルームキーがホームサーバーへバックアップされることは保証していませんでした。

つまり、一部の暗号化済みインストールは部分的にしか移行できません。

OpenClaw が自動的に復旧できないものは次のとおりです。

- 一度もバックアップされなかったローカルのみのルームキー
- `homeserver`、`userId`、または `accessToken` がまだ利用できないため、ターゲット Matrix アカウントをまだ解決できない場合の暗号化状態
- 複数の Matrix アカウントが設定されているが `channels.matrix.defaultAccount` が設定されていない場合の、1 つの共有フラット Matrix ストアの自動移行
- 標準の Matrix パッケージではなくリポジトリパスに固定されたカスタム Plugin パス インストール
- 古いストアにバックアップ済みキーがあったが、復号キーをローカルに保持していなかった場合の欠落したリカバリーキー

現在の警告範囲:

- カスタム Matrix Plugin パス インストールは、Gateway 起動時と `openclaw doctor` の両方で表示されます

古いインストールに、一度もバックアップされなかったローカルのみの暗号化履歴があった場合、アップグレード後も一部の古い暗号化メッセージは読めないままになることがあります。

## 推奨アップグレードフロー

1. OpenClaw と Matrix Plugin を通常どおり更新します。
   Matrix 移行を起動時にすぐ完了できるよう、`--no-restart` なしのプレーンな `openclaw update` を推奨します。
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

5. 修復対象の Matrix アカウントのリカバリーキーを、アカウント固有の環境変数に入れます。単一のデフォルトアカウントであれば、`MATRIX_RECOVERY_KEY` で問題ありません。複数アカウントの場合は、たとえば `MATRIX_RECOVERY_KEY_ASSISTANT` のようにアカウントごとに 1 つの変数を使用し、コマンドに `--account assistant` を追加します。

6. OpenClaw がリカバリーキーが必要だと示した場合、対応するアカウントでコマンドを実行します。

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. このデバイスがまだ未検証の場合、対応するアカウントでコマンドを実行します。

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   リカバリーキーが受け入れられ、バックアップが使用可能であっても、`Cross-signing verified`
   がまだ `no` の場合は、別の Matrix クライアントから自己検証を完了します。

   ```bash
   openclaw matrix verify self
   ```

   別の Matrix クライアントでリクエストを承認し、絵文字または小数を比較し、
   一致する場合にのみ `yes` と入力します。コマンドは、`Cross-signing verified` が `yes` になった後にのみ
   正常終了します。

8. 復旧不能な古い履歴を意図的に破棄し、今後のメッセージ用に新しいバックアップ基準を作成したい場合は、次を実行します。

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. サーバー側のキーバックアップがまだ存在しない場合は、今後の復旧用に作成します。

   ```bash
   openclaw matrix verify bootstrap
   ```

## 暗号化移行の仕組み

暗号化移行は 2 段階のプロセスです。

1. 暗号化移行が実行可能な場合、起動時または `openclaw doctor --fix` が移行前スナップショットを作成または再利用します。
2. 起動時または `openclaw doctor --fix` が、アクティブな Matrix Plugin インストールを通じて古い Matrix 暗号ストアを検査します。
3. バックアップ復号キーが見つかった場合、OpenClaw はそれを新しいリカバリーキーフローに書き込み、ルームキー復元を保留中としてマークします。
4. 次回の Matrix 起動時に、OpenClaw はバックアップ済みルームキーを新しい暗号ストアへ自動的に復元します。

古いストアが一度もバックアップされなかったルームキーを報告した場合、OpenClaw は復旧が成功したふりをする代わりに警告します。

## 一般的なメッセージとその意味

### アップグレードと検出メッセージ

`Matrix plugin upgraded in place.`

- 意味: ディスク上の古い Matrix 状態が検出され、現在のレイアウトへ移行されました。
- 対応: 同じ出力に警告も含まれていない限り、何もする必要はありません。

`Matrix migration snapshot created before applying Matrix upgrades.`

- 意味: OpenClaw は Matrix 状態を変更する前にリカバリーアーカイブを作成しました。
- 対応: 移行が成功したことを確認するまで、出力されたアーカイブパスを保持してください。

`Matrix migration snapshot reused before applying Matrix upgrades.`

- 意味: OpenClaw は既存の Matrix 移行スナップショット マーカーを見つけ、重複バックアップを作成する代わりにそのアーカイブを再利用しました。
- 対応: 移行が成功したことを確認するまで、出力されたアーカイブパスを保持してください。

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- 意味: 古い Matrix 状態は存在しますが、Matrix が設定されていないため、OpenClaw はそれを現在の Matrix アカウントへ対応付けできません。
- 対応: `channels.matrix` を設定してから、`openclaw doctor --fix` を再実行するか Gateway を再起動してください。

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 意味: OpenClaw は古い状態を見つけましたが、正確な現在のアカウント/デバイス ルートをまだ特定できません。
- 対応: 動作する Matrix ログインで Gateway を一度起動するか、キャッシュ済み認証情報が存在するようになった後で `openclaw doctor --fix` を再実行してください。

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 意味: OpenClaw は 1 つの共有フラット Matrix ストアを見つけましたが、どの名前付き Matrix アカウントが受け取るべきかを推測することを拒否しています。
- 対応: `channels.matrix.defaultAccount` を意図したアカウントに設定してから、`openclaw doctor --fix` を再実行するか Gateway を再起動してください。

`Matrix legacy sync store not migrated because the target already exists (...)`

- 意味: 新しいアカウントスコープの場所に同期ストアまたは暗号ストアがすでに存在するため、OpenClaw は自動的には上書きしませんでした。
- 対応: 競合するターゲットを手動で削除または移動する前に、現在のアカウントが正しいものであることを確認してください。

`Failed migrating Matrix legacy sync store (...)` または `Failed migrating Matrix legacy crypto store (...)`

- 意味: OpenClaw は古い Matrix 状態を移動しようとしましたが、ファイルシステム操作が失敗しました。
- 対応: ファイルシステム権限とディスク状態を確認してから、`openclaw doctor --fix` を再実行してください。

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- 意味: OpenClaw は古い暗号化 Matrix ストアを見つけましたが、それを関連付ける現在の Matrix 設定がありません。
- 対応: `channels.matrix` を設定してから、`openclaw doctor --fix` を再実行するか Gateway を再起動してください。

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 意味: 暗号化ストアは存在しますが、OpenClaw はそれが属する現在のアカウント/デバイスを安全に判断できません。
- 対応: 動作する Matrix ログインで Gateway を一度起動するか、キャッシュ済み認証情報が利用可能になった後で `openclaw doctor --fix` を再実行してください。

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 意味: OpenClaw は 1 つの共有フラットなレガシー暗号ストアを見つけましたが、どの名前付き Matrix アカウントが受け取るべきかを推測することを拒否しています。
- 対応: `channels.matrix.defaultAccount` を意図したアカウントに設定してから、`openclaw doctor --fix` を再実行するか Gateway を再起動してください。

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- 意味: OpenClaw は古い Matrix 状態を検出しましたが、移行はまだ ID または認証情報データの不足によってブロックされています。
- 対応: Matrix ログインまたは設定セットアップを完了してから、`openclaw doctor --fix` を再実行するか Gateway を再起動してください。

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- 意味: OpenClaw は古い暗号化 Matrix 状態を見つけましたが、通常そのストアを検査する Matrix Plugin からヘルパー エントリーポイントを読み込めませんでした。
- 対応: Matrix Plugin を再インストールまたは修復（`openclaw plugins install @openclaw/matrix`、またはリポジトリチェックアウトの場合は `openclaw plugins install ./path/to/local/matrix-plugin`）してから、`openclaw doctor --fix` を再実行するか Gateway を再起動してください。

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- 意味: OpenClawは、Pluginルートの外へ出る、またはPlugin境界チェックに失敗するヘルパーファイルパスを検出したため、そのインポートを拒否しました。
- 対処方法: 信頼できるパスからMatrix Pluginを再インストールしてから、`openclaw doctor --fix`を再実行するか、gatewayを再起動します。

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- 意味: OpenClawは、先に復旧用スナップショットを作成できなかったため、Matrixの状態を変更することを拒否しました。
- 対処方法: バックアップエラーを解決してから、`openclaw doctor --fix`を再実行するか、gatewayを再起動します。

`Failed migrating legacy Matrix client storage: ...`

- 意味: Matrixクライアント側のフォールバックが古いフラットストレージを検出しましたが、移動に失敗しました。OpenClawは現在、新しいストアで黙って起動するのではなく、そのフォールバックを中止します。
- 対処方法: ファイルシステムの権限や競合を確認し、古い状態をそのまま保持したうえで、エラーを修正してから再試行します。

`Matrix is installed from a custom path: ...`

- 意味: Matrixはパス指定のインストールに固定されているため、メインライン更新によってリポジトリ標準のMatrixパッケージに自動的に置き換えられることはありません。
- 対処方法: デフォルトのMatrix Pluginに戻したい場合は、`openclaw plugins install @openclaw/matrix`で再インストールします。

### 暗号化状態の復旧メッセージ

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- 意味: バックアップ済みのルームキーは新しい暗号化ストアへ正常に復元されました。
- 対処方法: 通常は何も必要ありません。

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- 意味: 一部の古いルームキーは古いローカルストアにのみ存在し、Matrixバックアップへアップロードされていませんでした。
- 対処方法: 別の検証済みクライアントからそれらのキーを手動で復旧できない限り、一部の古い暗号化履歴は引き続き利用できない可能性があります。

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- 意味: バックアップは存在しますが、OpenClawは復旧キーを自動的に復元できませんでした。
- 対処方法: `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`を実行します。

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- 意味: OpenClawは古い暗号化ストアを検出しましたが、復旧準備に十分な安全性で検査できませんでした。
- 対処方法: `openclaw doctor --fix`を再実行します。繰り返し発生する場合は、古い状態ディレクトリをそのまま保持し、別の検証済みMatrixクライアントと`printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`を使って復旧します。

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- 意味: OpenClawはバックアップキーの競合を検出し、現在の復旧キーファイルの自動上書きを拒否しました。
- 対処方法: 復元コマンドを再試行する前に、どの復旧キーが正しいかを確認します。

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- 意味: これは古いストレージ形式の厳しい制限です。
- 対処方法: バックアップ済みのキーは引き続き復元できますが、ローカルのみの暗号化履歴は利用できないままになる可能性があります。

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- 意味: 新しいPluginが復元を試みましたが、Matrixがエラーを返しました。
- 対処方法: `openclaw matrix verify backup status`を実行し、必要に応じて`printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`で再試行します。

### 手動復旧メッセージ

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- 意味: OpenClawはバックアップキーがあるはずだと認識していますが、このデバイスでは有効になっていません。
- 対処方法: `openclaw matrix verify backup restore`を実行します。必要に応じて、`MATRIX_RECOVERY_KEY`を設定し、`printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`を実行します。

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- 意味: このデバイスには現在、復旧キーが保存されていません。
- 対処方法: `MATRIX_RECOVERY_KEY`を設定し、`printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`を実行してから、バックアップを復元します。

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- 意味: 保存されているキーが、アクティブなMatrixバックアップと一致しません。
- 対処方法: `MATRIX_RECOVERY_KEY`を正しいキーに設定し、`printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`を実行します。

復旧不能な古い暗号化履歴を失うことを受け入れる場合は、代わりに
`openclaw matrix verify backup reset --yes`で現在のバックアップ基準をリセットできます。保存済みのバックアップシークレットが壊れている場合、そのリセットによってシークレットストレージも再作成され、再起動後に新しいバックアップキーを正しく読み込めるようになる場合があります。

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- 意味: バックアップは存在しますが、このデバイスはまだクロス署名チェーンを十分に強く信頼していません。
- 対処方法: `MATRIX_RECOVERY_KEY`を設定し、`printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`を実行します。

`Matrix recovery key is required`

- 意味: 復旧キーが必要な復旧手順で、復旧キーを指定せずに実行しようとしました。
- 対処方法: `--recovery-key-stdin`を付けてコマンドを再実行します。例: `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`。

`Invalid Matrix recovery key: ...`

- 意味: 指定されたキーを解析できなかったか、想定される形式と一致しませんでした。
- 対処方法: Matrixクライアントまたは復旧キーファイルの正確な復旧キーで再試行します。

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- 意味: OpenClawは復旧キーを適用できましたが、Matrixはまだこのデバイスに対する完全なクロス署名ID信頼を確立していません。コマンド出力で`Recovery key accepted`、`Backup usable`、`Cross-signing verified`、`Device verified by owner`を確認します。
- 対処方法: `openclaw matrix verify self`を実行し、別のMatrixクライアントでリクエストを受け入れ、SASを比較し、一致する場合にのみ`yes`と入力します。このコマンドは、成功を報告する前に完全なMatrix ID信頼を待ちます。現在のクロス署名IDを意図的に置き換えたい場合にのみ、`printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`を使用します。

`Matrix key backup is not active on this device after loading from secret storage.`

- 意味: シークレットストレージから、このデバイス上のアクティブなバックアップセッションが生成されませんでした。
- 対処方法: まずデバイスを検証し、その後`openclaw matrix verify backup status`で再確認します。

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- 意味: このデバイスは、デバイス検証が完了するまでシークレットストレージから復元できません。
- 対処方法: まず`printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`を実行します。

### カスタムPluginインストールメッセージ

`Matrix is installed from a custom path that no longer exists: ...`

- 意味: Pluginインストール記録が、すでに存在しないローカルパスを指しています。
- 対処方法: `openclaw plugins install @openclaw/matrix`で再インストールします。リポジトリチェックアウトから実行している場合は、`openclaw plugins install ./path/to/local/matrix-plugin`を使用します。

## 暗号化履歴がまだ戻らない場合

次のチェックを順番に実行します。

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

バックアップが正常に復元されても、一部の古いルームで履歴がまだ欠落している場合、それらの欠落したキーは以前のPluginによってバックアップされていなかった可能性があります。

## 今後のメッセージ用に最初から始めたい場合

復旧不能な古い暗号化履歴を失うことを受け入れ、今後に向けてクリーンなバックアップ基準だけが必要な場合は、次のコマンドを順番に実行します。

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

その後もデバイスが未検証のままの場合は、MatrixクライアントからSAS絵文字または10進コードを比較し、一致することを確認して検証を完了します。

## 関連

- [Matrix](/ja-JP/channels/matrix): チャンネルのセットアップと設定。
- [Matrixプッシュルール](/ja-JP/channels/matrix-push-rules): 通知ルーティング。
- [Doctor](/ja-JP/gateway/doctor): ヘルスチェックと自動移行トリガー。
- [移行ガイド](/ja-JP/install/migrating): すべての移行パス（マシン移動、システム間インポート）。
- [Plugin](/ja-JP/tools/plugin): Pluginのインストールと登録。

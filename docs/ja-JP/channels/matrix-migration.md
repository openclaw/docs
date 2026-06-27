---
read_when:
    - 既存の Matrix インストールをアップグレードする
    - 暗号化された Matrix 履歴とデバイス状態の移行
summary: OpenClaw が以前の Matrix Plugin をその場でアップグレードする方法。暗号化された状態の復旧制限と手動復旧手順を含みます。
title: Matrix 移行
x-i18n:
    generated_at: "2026-06-27T10:37:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 796d27aa3f08388b78e005d5e93ee4a04bc9ae9bb1f214b83c3ba19165042755
    source_path: channels/matrix-migration.md
    workflow: 16
---

以前の公開 `matrix` Plugin から現在の実装へアップグレードします。

ほとんどのユーザーでは、アップグレードはその場で行われます。

- Plugin は `@openclaw/matrix` のままです
- チャネルは `matrix` のままです
- 設定は `channels.matrix` の下に残ります
- キャッシュ済み認証情報は `~/.openclaw/credentials/matrix/` の下に残ります
- ランタイム状態は `~/.openclaw/matrix/` の下に残ります

設定キーをリネームしたり、新しい名前で Plugin を再インストールしたりする必要はありません。  
ルートの `openclaw` パッケージには、Matrix ランタイムコードや Matrix SDK
依存関係が同梱されなくなりました。更新後に `openclaw channels status` で Matrix が設定済みと表示されるものの
Plugin が見つからない場合は、`openclaw doctor --fix` または
`openclaw plugins install @openclaw/matrix` を実行してください。Matrix SDK パッケージを
ルートの OpenClaw パッケージへインストールしないでください。

## 移行が自動的に行うこと

Gateway の起動時、および [`openclaw doctor --fix`](/ja-JP/gateway/doctor) を実行したとき、OpenClaw は古い Matrix 状態の自動修復を試みます。  
実行可能な Matrix 移行ステップがディスク上の状態を変更する前に、OpenClaw は対象を絞ったリカバリスナップショットを作成または再利用します。

`openclaw update` を使用する場合、正確なトリガーは OpenClaw のインストール方法によって異なります。

- ソースインストールでは、更新フロー中に `openclaw doctor --fix` を実行し、その後デフォルトで Gateway を再起動します
- パッケージマネージャーによるインストールでは、パッケージを更新し、非対話型の doctor パスを実行してから、デフォルトの Gateway 再起動に任せて起動時に Matrix 移行を完了します
- `openclaw update --no-restart` を使用した場合、起動に基づく Matrix 移行は、後で `openclaw doctor --fix` を実行して Gateway を再起動するまで延期されます

自動移行の対象は次のとおりです。

- `~/Backups/openclaw-migrations/` の下に移行前スナップショットを作成または再利用する
- キャッシュ済みの Matrix 認証情報を再利用する
- 同じアカウント選択と `channels.matrix` 設定を維持する
- 最も古いフラットな Matrix 同期ストアを現在のアカウントスコープの場所へ移動する
- 対象アカウントを安全に解決できる場合、最も古いフラットな Matrix 暗号ストアを現在のアカウントスコープの場所へ移動する
- 以前に保存された Matrix ルームキーバックアップ復号キーがローカルに存在する場合、古い rust 暗号ストアからそのキーを抽出する
- 後でアクセストークンが変更されたとき、同じ Matrix アカウント、homeserver、ユーザーに対して最も完全な既存のトークンハッシュストレージルートを再利用する
- Matrix アクセストークンが変更されてもアカウントやデバイスの ID が同じままの場合、保留中の暗号化状態復元メタデータを兄弟トークンハッシュストレージルートからスキャンする
- 次回の Matrix 起動時に、バックアップ済みルームキーを新しい暗号ストアへ復元する

スナップショットの詳細:

- OpenClaw は、スナップショット成功後に `~/.openclaw/matrix/migration-snapshot.json` へマーカーファイルを書き込み、以後の起動や修復パスで同じアーカイブを再利用できるようにします。
- これらの自動 Matrix 移行スナップショットは、設定と状態のみをバックアップします（`includeWorkspace: false`）。
- Matrix に警告のみの移行状態しかない場合、たとえば `userId` または `accessToken` がまだ欠けている場合、実行可能な Matrix 変更がないため、OpenClaw はまだスナップショットを作成しません。
- スナップショット手順が失敗した場合、OpenClaw はリカバリポイントなしに状態を変更する代わりに、その実行での Matrix 移行をスキップします。

複数アカウントのアップグレードについて:

- 最も古いフラットな Matrix ストア（`~/.openclaw/matrix/bot-storage.json` と `~/.openclaw/matrix/crypto/`）は単一ストアレイアウトに由来するため、OpenClaw はそれを解決済みの 1 つの Matrix アカウント対象にしか移行できません
- すでにアカウントスコープ化されたレガシー Matrix ストアは、設定済みの Matrix アカウントごとに検出され、準備されます

## 移行が自動的には行えないこと

以前の公開 Matrix Plugin は、Matrix ルームキーバックアップを**自動作成しませんでした**。ローカル暗号状態を永続化し、デバイス検証を要求していましたが、ルームキーが homeserver にバックアップされることは保証していませんでした。

つまり、一部の暗号化されたインストールは部分的にしか移行できません。

OpenClaw が自動的に復旧できないものは次のとおりです。

- 一度もバックアップされていないローカル専用のルームキー
- `homeserver`、`userId`、または `accessToken` がまだ利用できないため、対象 Matrix アカウントをまだ解決できない場合の暗号化状態
- 複数の Matrix アカウントが設定されているが `channels.matrix.defaultAccount` が設定されていない場合の、1 つの共有フラット Matrix ストアの自動移行
- 標準の Matrix パッケージではなくリポジトリパスに固定されたカスタム Plugin パスインストール
- 古いストアにバックアップ済みキーがあったものの、復号キーをローカルに保持していなかった場合の欠落したリカバリキー

現在の警告範囲:

- カスタム Matrix Plugin パスインストールは、Gateway 起動時と `openclaw doctor` の両方で表示されます

古いインストールに、一度もバックアップされていないローカル専用の暗号化履歴があった場合、アップグレード後も一部の古い暗号化メッセージは読めないままになる可能性があります。

## 推奨アップグレードフロー

1. OpenClaw と Matrix Plugin を通常どおり更新します。  
   起動時に Matrix 移行をすぐ完了できるよう、`--no-restart` なしの通常の `openclaw update` を推奨します。
2. 次を実行します。

   ```bash
   openclaw doctor --fix
   ```

   Matrix に実行可能な移行作業がある場合、doctor はまず移行前スナップショットを作成または再利用し、アーカイブパスを表示します。

3. Gateway を起動または再起動します。
4. 現在の検証とバックアップ状態を確認します。

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. 修復対象の Matrix アカウントのリカバリキーを、アカウント固有の環境変数に入れます。単一のデフォルトアカウントでは、`MATRIX_RECOVERY_KEY` で問題ありません。複数アカウントでは、たとえば `MATRIX_RECOVERY_KEY_ASSISTANT` のようにアカウントごとに 1 つの変数を使用し、コマンドに `--account assistant` を追加します。

6. OpenClaw がリカバリキーが必要だと伝えた場合、該当するアカウントに対してコマンドを実行します。

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. このデバイスがまだ未検証の場合、該当するアカウントに対してコマンドを実行します。

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   リカバリキーが受け入れられ、バックアップが利用可能でも、`Cross-signing verified`
   がまだ `no` の場合は、別の Matrix クライアントから自己検証を完了します。

   ```bash
   openclaw matrix verify self
   ```

   別の Matrix クライアントでリクエストを承認し、絵文字または数字を比較して、
   一致する場合にのみ `yes` と入力します。このコマンドは、
   `Cross-signing verified` が `yes` になった後にのみ正常終了します。

8. 復旧不能な古い履歴を意図的に破棄し、今後のメッセージ用に新しいバックアップ基準を作りたい場合は、次を実行します。

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
2. 起動時または `openclaw doctor --fix` が、アクティブな Matrix Plugin インストールを通じて古い Matrix 暗号ストアを検査します。
3. バックアップ復号キーが見つかった場合、OpenClaw はそれを新しいリカバリキーフローへ書き込み、ルームキー復元を保留中としてマークします。
4. 次回の Matrix 起動時に、OpenClaw はバックアップ済みルームキーを新しい暗号ストアへ自動的に復元します。

古いストアが一度もバックアップされていないルームキーを報告した場合、OpenClaw は復旧が成功したふりをせず警告します。

## よくあるメッセージとその意味

### アップグレードと検出のメッセージ

`Matrix plugin upgraded in place.`

- 意味: 古いディスク上の Matrix 状態が検出され、現在のレイアウトへ移行されました。
- 対処: 同じ出力に警告も含まれていない限り、何もする必要はありません。

`Matrix migration snapshot created before applying Matrix upgrades.`

- 意味: OpenClaw は Matrix 状態を変更する前にリカバリアーカイブを作成しました。
- 対処: 移行が成功したことを確認するまで、表示されたアーカイブパスを保持してください。

`Matrix migration snapshot reused before applying Matrix upgrades.`

- 意味: OpenClaw は既存の Matrix 移行スナップショットマーカーを見つけ、重複バックアップを作成する代わりにそのアーカイブを再利用しました。
- 対処: 移行が成功したことを確認するまで、表示されたアーカイブパスを保持してください。

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- 意味: 古い Matrix 状態は存在しますが、Matrix が設定されていないため、OpenClaw はそれを現在の Matrix アカウントへ対応付けられません。
- 対処: `channels.matrix` を設定してから、`openclaw doctor --fix` を再実行するか Gateway を再起動してください。

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 意味: OpenClaw は古い状態を見つけましたが、正確な現在のアカウント/デバイスルートをまだ特定できません。
- 対処: 動作する Matrix ログインで Gateway を一度起動するか、キャッシュ済み認証情報が存在するようになってから `openclaw doctor --fix` を再実行してください。

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 意味: OpenClaw は 1 つの共有フラット Matrix ストアを見つけましたが、どの名前付き Matrix アカウントが受け取るべきかを推測することを拒否しています。
- 対処: `channels.matrix.defaultAccount` を意図したアカウントに設定してから、`openclaw doctor --fix` を再実行するか Gateway を再起動してください。

`Matrix legacy sync store not migrated because the target already exists (...)`

- 意味: 新しいアカウントスコープの場所に同期ストアまたは暗号ストアがすでにあるため、OpenClaw は自動的に上書きしませんでした。
- 対処: 競合する対象を手動で削除または移動する前に、現在のアカウントが正しいものであることを確認してください。

`Failed migrating Matrix legacy sync store (...)` または `Failed migrating Matrix legacy crypto store (...)`

- 意味: OpenClaw は古い Matrix 状態を移動しようとしましたが、ファイルシステム操作に失敗しました。
- 対処: ファイルシステムの権限とディスク状態を確認してから、`openclaw doctor --fix` を再実行してください。

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- 意味: OpenClaw は古い暗号化 Matrix ストアを見つけましたが、それを接続する現在の Matrix 設定がありません。
- 対処: `channels.matrix` を設定してから、`openclaw doctor --fix` を再実行するか Gateway を再起動してください。

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 意味: 暗号化ストアは存在しますが、OpenClaw はそれがどの現在のアカウント/デバイスに属するかを安全に判断できません。
- 対処: 動作する Matrix ログインで Gateway を一度起動するか、キャッシュ済み認証情報が利用可能になってから `openclaw doctor --fix` を再実行してください。

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 意味: OpenClaw は 1 つの共有フラットなレガシー暗号ストアを見つけましたが、どの名前付き Matrix アカウントが受け取るべきかを推測することを拒否しています。
- 対処: `channels.matrix.defaultAccount` を意図したアカウントに設定してから、`openclaw doctor --fix` を再実行するか Gateway を再起動してください。

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- 意味: OpenClaw は古い Matrix 状態を検出しましたが、移行はまだ ID または認証情報データの不足によってブロックされています。
- 対処: Matrix ログインまたは設定セットアップを完了してから、`openclaw doctor --fix` を再実行するか Gateway を再起動してください。

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- 意味: OpenClaw は古い暗号化済み Matrix 状態を見つけましたが、通常そのストアを検査する Matrix plugin からヘルパーエントリポイントを読み込めませんでした。
- 対処方法: Matrix plugin を再インストールまたは修復し（`openclaw plugins install @openclaw/matrix`、またはリポジトリチェックアウトの場合は `openclaw plugins install ./path/to/local/matrix-plugin`）、その後 `openclaw doctor --fix` を再実行するか、gateway を再起動します。

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- 意味: OpenClaw は、plugin ルートの外へ抜ける、または plugin 境界チェックに失敗するヘルパーファイルパスを見つけたため、インポートを拒否しました。
- 対処方法: 信頼できるパスから Matrix plugin を再インストールし、その後 `openclaw doctor --fix` を再実行するか、gateway を再起動します。

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- 意味: OpenClaw は、先に復旧用スナップショットを作成できなかったため、Matrix 状態の変更を拒否しました。
- 対処方法: バックアップエラーを解消し、その後 `openclaw doctor --fix` を再実行するか、gateway を再起動します。

`Failed migrating legacy Matrix client storage: ...`

- 意味: Matrix クライアント側フォールバックが古いフラットストレージを見つけましたが、移動に失敗しました。OpenClaw は、何も知らせずに新しいストアで開始する代わりに、そのフォールバックを中止するようになりました。
- 対処方法: ファイルシステム権限や競合を確認し、古い状態をそのまま保持して、エラーを修正してから再試行します。

`Matrix is installed from a custom path: ...`

- 意味: Matrix はパスインストールに固定されているため、メインライン更新ではリポジトリの標準 Matrix パッケージに自動置換されません。
- 対処方法: デフォルトの Matrix plugin に戻したい場合は、`openclaw plugins install @openclaw/matrix` で再インストールします。

### 暗号化済み状態の復旧メッセージ

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- 意味: バックアップ済みのルームキーが新しい暗号ストアへ正常に復元されました。
- 対処方法: 通常は何も必要ありません。

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- 意味: 一部の古いルームキーは古いローカルストアにのみ存在し、Matrix バックアップへアップロードされたことがありませんでした。
- 対処方法: 別の検証済みクライアントからそれらのキーを手動で復旧できない限り、一部の古い暗号化履歴は利用できないままになると想定してください。

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- 意味: バックアップは存在しますが、OpenClaw は復旧キーを自動で復元できませんでした。
- 対処方法: `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` を実行します。

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- 意味: OpenClaw は古い暗号化済みストアを見つけましたが、復旧準備に十分な安全性で検査できませんでした。
- 対処方法: `openclaw doctor --fix` を再実行します。繰り返す場合は、古い状態ディレクトリをそのまま保持し、別の検証済み Matrix クライアントと `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` を使って復旧します。

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- 意味: OpenClaw はバックアップキーの競合を検出し、現在の recovery-key ファイルを自動で上書きすることを拒否しました。
- 対処方法: 復元コマンドを再試行する前に、どの復旧キーが正しいか確認します。

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- 意味: これは古いストレージ形式の厳格な制限です。
- 対処方法: バックアップ済みのキーは引き続き復元できますが、ローカルにのみある暗号化履歴は利用できないままになる可能性があります。

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- 意味: 新しい plugin が復元を試みましたが、Matrix がエラーを返しました。
- 対処方法: `openclaw matrix verify backup status` を実行し、必要に応じて `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` で再試行します。

### 手動復旧メッセージ

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- 意味: OpenClaw はバックアップキーがあるはずだと認識していますが、このデバイスでは有効になっていません。
- 対処方法: `openclaw matrix verify backup restore` を実行するか、必要に応じて `MATRIX_RECOVERY_KEY` を設定して `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` を実行します。

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- 意味: このデバイスには現在、復旧キーが保存されていません。
- 対処方法: `MATRIX_RECOVERY_KEY` を設定し、`printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` を実行してから、バックアップを復元します。

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- 意味: 保存されているキーが有効な Matrix バックアップと一致しません。
- 対処方法: `MATRIX_RECOVERY_KEY` に正しいキーを設定し、`printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` を実行します。

復旧不能な古い暗号化履歴を失うことを許容する場合は、代わりに
`openclaw matrix verify backup reset --yes` で現在のバックアップ基準線をリセットできます。
保存済みのバックアップシークレットが壊れている場合、そのリセットによりシークレットストレージも再作成され、再起動後に新しいバックアップキーを正しく読み込めるようになることがあります。

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- 意味: バックアップは存在しますが、このデバイスはまだクロス署名チェーンを十分強く信頼していません。
- 対処方法: `MATRIX_RECOVERY_KEY` を設定し、`printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` を実行します。

`Matrix recovery key is required`

- 意味: 復旧キーが必要な場面で、復旧キーを指定せずに復旧手順を試みました。
- 対処方法: たとえば `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` のように、`--recovery-key-stdin` を付けてコマンドを再実行します。

`Invalid Matrix recovery key: ...`

- 意味: 指定されたキーを解析できないか、期待される形式と一致しませんでした。
- 対処方法: Matrix クライアントまたは recovery-key ファイルにある正確な復旧キーで再試行します。

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- 意味: OpenClaw は復旧キーを適用できましたが、Matrix はまだこのデバイスに対して完全なクロス署名 ID 信頼を
  確立していません。コマンド出力で `Recovery key accepted`、`Backup usable`、
  `Cross-signing verified`、`Device verified by owner` を確認してください。
- 対処方法: `openclaw matrix verify self` を実行し、別の
  Matrix クライアントでリクエストを承認し、SAS を比較して、一致する場合にのみ `yes` と入力します。
  コマンドは、成功を報告する前に完全な Matrix ID 信頼を待ちます。現在のクロス署名 ID を意図的に置き換えたい場合にのみ、
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  を使用してください。

`Matrix key backup is not active on this device after loading from secret storage.`

- 意味: シークレットストレージから、このデバイスで有効なバックアップセッションが生成されませんでした。
- 対処方法: 先にデバイスを検証し、その後 `openclaw matrix verify backup status` で再確認します。

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- 意味: デバイス検証が完了するまで、このデバイスはシークレットストレージから復元できません。
- 対処方法: 先に `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` を実行します。

### カスタム plugin インストールメッセージ

`Matrix is installed from a custom path that no longer exists: ...`

- 意味: plugin インストール記録が、すでに存在しないローカルパスを指しています。
- 対処方法: `openclaw plugins install @openclaw/matrix` で再インストールするか、リポジトリチェックアウトから実行している場合は `openclaw plugins install ./path/to/local/matrix-plugin` を使います。

## 暗号化履歴がまだ戻らない場合

次の確認を順番に実行します。

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

バックアップの復元に成功しても一部の古いルームに履歴がまだない場合、その不足しているキーは以前の plugin によってバックアップされていなかった可能性が高いです。

## 今後のメッセージ用に新しく始めたい場合

復旧不能な古い暗号化履歴を失うことを許容し、今後に向けたクリーンなバックアップ基準線だけが必要な場合は、次のコマンドを順番に実行します。

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

その後もデバイスが未検証の場合は、Matrix クライアントから SAS 絵文字または10進コードを比較し、一致することを確認して検証を完了します。

## 関連

- [Matrix](/ja-JP/channels/matrix): チャネルのセットアップと設定。
- [Matrix プッシュルール](/ja-JP/channels/matrix-push-rules): 通知ルーティング。
- [Doctor](/ja-JP/gateway/doctor): ヘルスチェックと自動移行トリガー。
- [移行ガイド](/ja-JP/install/migrating): すべての移行パス（マシン移動、クロスシステムインポート）。
- [Plugins](/ja-JP/tools/plugin): plugin のインストールと登録。

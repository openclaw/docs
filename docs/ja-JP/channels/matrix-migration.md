---
read_when:
    - 既存の Matrix インストールのアップグレード
    - 暗号化された Matrix の履歴とデバイス状態の移行
summary: 暗号化状態の復旧に関する制限と手動復旧手順を含め、OpenClaw が以前の Matrix Plugin をインプレースでアップグレードする仕組み。
title: Matrix の移行
x-i18n:
    generated_at: "2026-07-12T14:20:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 33d5ac134338c8032ca1507ceee6eade2d37b3c86f0045fb883304ad208cd5e5
    source_path: channels/matrix-migration.md
    workflow: 16
---

以前の公開 `matrix` plugin から現在の実装へアップグレードします。

ほとんどのユーザーは、そのままアップグレードできます。

- plugin は引き続き `@openclaw/matrix`
- チャンネルは引き続き `matrix`
- 設定は引き続き `channels.matrix` 配下
- キャッシュされた認証情報は引き続き `~/.openclaw/credentials/matrix/` 配下
- ランタイム状態は引き続き `~/.openclaw/matrix/` 配下

設定キーの名前を変更したり、新しい名前でpluginを再インストールしたりする必要はありません。
ルートの `openclaw` パッケージには、MatrixのランタイムコードやMatrix SDKの
依存関係が含まれなくなりました。`openclaw channels status` でMatrixが設定済みと表示される一方、
pluginがインストールされていない場合は、`openclaw doctor --fix` または
`openclaw plugins install @openclaw/matrix` を実行してください。Matrix SDKパッケージを
ルートのOpenClawパッケージにインストールしないでください。

## 移行によって自動的に行われること

Matrixの移行は、[`openclaw doctor --fix`](/ja-JP/gateway/doctor) の実行時に行われます。また、Matrixクライアントの起動時にSQLiteストアの隣にファイルベースのサイドカー状態が残っている場合は、フォールバックとして実行されます。

自動移行の対象は次のとおりです。

- キャッシュされたMatrix認証情報の再利用
- 同じアカウント選択と `channels.matrix` 設定の維持
- ファイルベースのサイドカー状態（`bot-storage.json` 同期キャッシュ、`recovery-key.json`、`legacy-crypto-migration.json`、IndexedDBスナップショット）のMatrix SQLite状態へのインポート。移行済みファイルは `.migrated` サフィックス付きでアーカイブされます
- 後からアクセストークンが変更された場合でも、同じMatrixアカウント、ホームサーバー、ユーザー、デバイスに対して、既存のうち最も完全なトークンハッシュストレージルートを再利用

## 2026.4より前のOpenClawリリースからのアップグレード

2026.6系列までのリリースでは、元のフラットな単一ストアの
Matrixレイアウト（`~/.openclaw/matrix/bot-storage.json` と
`~/.openclaw/matrix/crypto/`）も移行し、古いRust暗号化ストアから
暗号化状態を復旧する準備を行っていました。現在のリリースには、この移行処理は含まれていません。

まだフラットレイアウトを使用しているインストールをアップグレードする場合は、まず
2026.6リリースへアップグレードし、`openclaw doctor --fix` を実行してから、Gatewayを
一度起動し、フラットストアと復旧可能なルームキーを移行してください。その後、
最新リリースへ更新してください。

以前の公開Matrix pluginは、Matrixのルームキーバックアップを自動的には作成して**いませんでした**。古いインストールに一度もバックアップされなかったローカル限定の暗号化履歴がある場合、移行方法にかかわらず、アップグレード後も一部の古い暗号化メッセージを読めない可能性があります。

## 推奨アップグレード手順

1. OpenClawとMatrix pluginを通常どおり更新します。
2. 次を実行します。

   ```bash
   openclaw doctor --fix
   ```

3. Gatewayを起動または再起動します。
4. 現在の検証状態とバックアップ状態を確認します。

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. 修復するMatrixアカウントのリカバリーキーを、アカウント固有の環境変数に設定します。単一のデフォルトアカウントでは、`MATRIX_RECOVERY_KEY` で問題ありません。複数のアカウントでは、アカウントごとに1つの変数を使用します。たとえば `MATRIX_RECOVERY_KEY_ASSISTANT` を使用し、コマンドに `--account assistant` を追加します。

6. リカバリーキーが必要だとOpenClawに表示された場合は、該当するアカウントに対してコマンドを実行します。

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. このデバイスがまだ未検証の場合は、該当するアカウントに対してコマンドを実行します。

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   リカバリーキーが受け入れられ、バックアップが利用可能でも、`Cross-signing verified`
   がまだ `no` の場合は、別のMatrixクライアントから自己検証を完了します。

   ```bash
   openclaw matrix verify self
   ```

   別のMatrixクライアントでリクエストを承認し、絵文字または数字を比較して、
   一致する場合にのみ `yes` と入力します。このコマンドは、完全なMatrix
   アイデンティティの信頼が確立されるまで待機してから、成功を報告します。

8. 復旧不能な古い履歴を意図的に破棄し、今後のメッセージ用に新しいバックアップの基準状態を作成する場合は、次を実行します。

   ```bash
   openclaw matrix verify backup reset --yes
   ```

   古いリカバリーキーで新しいバックアップを解除できないようにする場合にのみ、`--rotate-recovery-key` を追加します。

9. サーバー側のキーバックアップがまだ存在しない場合は、今後の復旧用に作成します。

   ```bash
   openclaw matrix verify bootstrap
   ```

## 一般的なメッセージとその意味

`Failed migrating legacy Matrix client storage: ...`

- 意味：Matrixクライアント側のフォールバックがファイルベースのサイドカー状態を検出しましたが、SQLiteへのインポートに失敗しました。OpenClawは、新しいストアで暗黙的に起動するのではなく、完了済みの移動をロールバックして、そのフォールバックを中止します。
- 対処方法：ファイルシステムの権限や競合を確認し、古い状態をそのまま維持して、エラーを修正した後に再試行します。

`Matrix is installed from a custom path: ...`

- 意味：Matrixはパス指定でインストールされた状態に固定されているため、メインラインの更新ではデフォルトのMatrixパッケージへ自動的に置き換えられません。
- 対処方法：デフォルトのMatrix pluginに戻す場合は、`openclaw plugins install @openclaw/matrix` で再インストールします。

`Matrix is installed from a custom path that no longer exists: ...`

- 意味：pluginのインストール記録が、既に存在しないローカルパスを指しています。
- 対処方法：`openclaw plugins install @openclaw/matrix` で再インストールします。リポジトリのチェックアウトから実行している場合は、`openclaw plugins install ./path/to/local/matrix-plugin` を使用します。`openclaw doctor --fix` でも、古いMatrix pluginの参照を削除できます。

### 手動復旧メッセージ

`openclaw matrix verify status` と `openclaw matrix verify backup status` は、このデバイス上でルームキーバックアップが正常でない場合に、`Backup issue:` 行と `Next steps:` のガイダンスを出力します。

| バックアップの問題                                                    | 意味                                               | 修正方法                                                                                                                                  |
| --------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `no room-key backup exists on the homeserver`                         | 復元元がありません                                 | `openclaw matrix verify bootstrap` でルームキーバックアップを作成します                                                                   |
| `backup decryption key is not loaded on this device`                  | キーは存在しますが、このデバイスでは有効ではありません | `openclaw matrix verify backup restore`。それでもキーを読み込めない場合は、`--recovery-key-stdin` でリカバリーキーをパイプ入力します       |
| `backup decryption key could not be loaded from secret storage (...)` | シークレットストレージからの読み込みに失敗したか、サポートされていません | リカバリーキーをパイプ入力します：`printf '%s\n' "$MATRIX_RECOVERY_KEY" \| openclaw matrix verify backup restore --recovery-key-stdin`      |
| `backup key mismatch (...)`                                           | 保存されたキーが有効なサーバーバックアップと一致しません | 有効なサーバーバックアップキーを使用して `verify backup restore --recovery-key-stdin` を再実行するか、`verify backup reset --yes` で新しい基準状態を作成します |
| `backup signature chain is not trusted by this device`                | デバイスがクロス署名チェーンをまだ信頼していません | `verify device --recovery-key-stdin` を実行し、信頼がまだ不完全な場合は、別の検証済みクライアントから `verify self` を実行します           |
| `backup exists but is not active on this device`                      | サーバーバックアップは存在しますが、ローカルセッションでは無効です | まずデバイスを検証し、その後 `openclaw matrix verify backup status` で再確認します                                                         |
| `backup trust state could not be fully determined`                    | 診断では結論を得られませんでした                   | `openclaw matrix verify status --verbose`                                                                                                 |

その他の復旧エラー：

`Matrix recovery key is required`

- 意味：リカバリーキーが必要な復旧手順を、リカバリーキーを指定せずに実行しました。
- 対処方法：`--recovery-key-stdin` を指定してコマンドを再実行します。例：`printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`。

`Invalid Matrix recovery key: ...`

- 意味：指定されたキーを解析できなかったか、想定された形式と一致しませんでした。
- 対処方法：Matrixクライアントまたはリカバリーキーのエクスポートから取得した正確なリカバリーキーで再試行します。

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- 意味：リカバリーキーによって使用可能なバックアップデータを解除できましたが、Matrixはこのデバイスに対する完全なクロス署名アイデンティティの信頼をまだ確立していません。コマンド出力で `Recovery key accepted`、`Backup usable`、`Cross-signing verified`、`Device verified by owner` を確認してください。
- 対処方法：`openclaw matrix verify self` を実行し、別のMatrixクライアントでリクエストを承認してSASを比較し、一致する場合にのみ `yes` と入力します。現在のクロス署名アイデンティティを意図的に置き換える場合にのみ、`printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing` を使用します。

復旧不能な古い暗号化履歴が失われることを受け入れる場合は、代わりに
`openclaw matrix verify backup reset --yes` で現在のバックアップの基準状態をリセットできます。
保存されたバックアップシークレットが壊れている場合、このリセットではシークレットストレージも修復されるため、
再起動後に新しいバックアップキーを正しく読み込めるようになります。

## 暗号化履歴がまだ復元されない場合

次の確認を順番に実行します。

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

バックアップが正常に復元されても、一部の古いルームの履歴が欠落したままの場合、欠落しているキーは以前のpluginによって一度もバックアップされなかった可能性があります。

## 今後のメッセージ用に新しく開始する場合

復旧不能な古い暗号化履歴が失われることを受け入れ、今後に向けてクリーンなバックアップの基準状態だけを作成する場合は、次のコマンドを順番に実行します。

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

その後もデバイスが未検証の場合は、MatrixクライアントでSASの絵文字または数字コードを比較し、一致することを確認して検証を完了します。

## 関連項目

- [Matrix](/ja-JP/channels/matrix)：チャンネルのセットアップと設定。
- [Matrixプッシュルール](/ja-JP/channels/matrix-push-rules)：通知ルーティング。
- [Doctor](/ja-JP/gateway/doctor)：健全性チェックと自動移行のトリガー。
- [移行ガイド](/ja-JP/install/migrating)：すべての移行方法（マシン間の移動、システム間のインポート）。
- [Plugins](/ja-JP/tools/plugin)：pluginのインストールと登録。

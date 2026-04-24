---
read_when:
    - 既存の Matrix インストールをアップグレードする場合
    - 暗号化された Matrix 履歴とデバイス状態を移行する場合
summary: OpenClaw が以前の Matrix Plugin をその場でアップグレードする仕組み（暗号化状態の復旧限界と手動復旧手順を含む）。
title: Matrix 移行
x-i18n:
    generated_at: "2026-04-24T05:04:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: e8210f5fbe476148736417eec29dfb5e27c132c6a0bb80753ce254129c14da4f
    source_path: install/migrating-matrix.md
    workflow: 15
---

このページでは、以前の公開 `matrix` Plugin から現在の実装へのアップグレードを扱います。

ほとんどのユーザーにとって、アップグレードはその場で行われます。

- Plugin は `@openclaw/matrix` のままです
- channel は `matrix` のままです
- config は `channels.matrix` 配下のままです
- キャッシュされた認証情報は `~/.openclaw/credentials/matrix/` 配下のままです
- ランタイム状態は `~/.openclaw/matrix/` 配下のままです

config キーの名前変更や、新しい名前での Plugin 再インストールは不要です。

## 移行で自動的に行われること

gateway 起動時、および [`openclaw doctor --fix`](/ja-JP/gateway/doctor) 実行時に、OpenClaw は古い Matrix 状態を自動修復しようとします。
実際にディスク上の状態を変更する Matrix 移行ステップの前に、OpenClaw は専用の復旧スナップショットを作成するか再利用します。

`openclaw update` を使う場合、正確なトリガーは OpenClaw のインストール方法によって異なります。

- ソースインストールでは、更新フロー中に `openclaw doctor --fix` を実行し、その後デフォルトで gateway を再起動します
- パッケージマネージャー経由のインストールでは、パッケージを更新し、非対話の doctor パスを実行し、その後デフォルトの gateway 再起動に任せて起動時に Matrix 移行を完了させます
- `openclaw update --no-restart` を使う場合、起動ベースの Matrix 移行は、後で `openclaw doctor --fix` を実行して gateway を再起動するまで延期されます

自動移行でカバーされるもの:

- `~/Backups/openclaw-migrations/` 配下に、移行前スナップショットを作成または再利用すること
- キャッシュ済み Matrix 認証情報の再利用
- 同じアカウント選択と `channels.matrix` config の維持
- 最も古いフラットな Matrix sync store を、現在のアカウントスコープの場所へ移動すること
- 対象アカウントを安全に解決できる場合、最も古いフラットな Matrix crypto store を現在のアカウントスコープの場所へ移動すること
- 古い rust crypto store に以前保存されていた Matrix room-key backup 復号鍵が存在する場合、それを抽出すること
- 同じ Matrix アカウント、homeserver、user に対して、後で access token が変更された場合でも、最も完全な既存 token-hash ストレージルートを再利用すること
- Matrix access token は変わったが account/device identity が同じままの場合、保留中の暗号化状態復元メタデータを sibling token-hash ストレージルートからスキャンすること
- 次回 Matrix 起動時に、バックアップされた room key を新しい crypto store へ復元すること

スナップショットの詳細:

- OpenClaw はスナップショット成功後に `~/.openclaw/matrix/migration-snapshot.json` に marker file を書き込み、その後の起動や修復パスで同じアーカイブを再利用できるようにします。
- これらの自動 Matrix 移行スナップショットは config + state のみをバックアップします（`includeWorkspace: false`）。
- `userId` や `accessToken` がまだ不足しているなど、Matrix に警告のみの移行状態しかない場合、OpenClaw はまだスナップショットを作成しません。これは、実際に変更可能な Matrix 変更がまだないためです。
- スナップショット手順が失敗した場合、OpenClaw は復旧ポイントなしで状態を変更する代わりに、その実行では Matrix 移行をスキップします。

複数アカウントのアップグレードについて:

- 最も古いフラット Matrix store（`~/.openclaw/matrix/bot-storage.json` と `~/.openclaw/matrix/crypto/`）は単一ストア構成由来なので、OpenClaw が移行できるのは解決済みの 1 つの Matrix アカウント対象のみです
- すでにアカウントスコープ化されているレガシー Matrix store は、設定済みの各 Matrix アカウントごとに検出・準備されます

## 自動ではできないこと

以前の公開 Matrix Plugin は、**Matrix room-key backup を自動作成していませんでした**。ローカル crypto state を永続化し、デバイス検証を要求していましたが、room key が homeserver にバックアップされることは保証していませんでした。

そのため、一部の暗号化済みインストールでは移行が部分的にしかできません。

OpenClaw が自動復旧できないもの:

- 一度もバックアップされていないローカル専用 room key
- `homeserver`、`userId`、`accessToken` がまだ利用できず、対象 Matrix アカウントをまだ解決できないために復旧できない暗号化状態
- 複数の Matrix アカウントが設定されているのに `channels.matrix.defaultAccount` が設定されていない場合の、1 つの共有フラット Matrix store の自動移行
- 標準 Matrix パッケージではなく repo path に固定されたカスタム Plugin path インストール
- 古い store にバックアップ済み key があったが、復号鍵をローカルに保持していなかった場合の recovery key 不足

現在の警告スコープ:

- カスタム Matrix Plugin path インストールは、gateway 起動時と `openclaw doctor` の両方で通知されます

古いインストールに、一度もバックアップされていないローカル専用の暗号化履歴があった場合、アップグレード後も一部の古い暗号化メッセージは読み取れないまま残る可能性があります。

## 推奨アップグレードフロー

1. OpenClaw と Matrix Plugin を通常どおり更新します。
   起動時に Matrix 移行をすぐ完了できるよう、`--no-restart` なしの通常の `openclaw update` を推奨します。
2. 次を実行します。

   ```bash
   openclaw doctor --fix
   ```

   Matrix に実行可能な移行作業がある場合、doctor は最初に移行前スナップショットを作成または再利用し、アーカイブパスを表示します。

3. gateway を起動または再起動します。
4. 現在の検証状態とバックアップ状態を確認します。

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. OpenClaw が recovery key が必要だと伝えた場合は、次を実行します。

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. このデバイスがまだ未検証なら、次を実行します。

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

7. 復旧不能な古い履歴を意図的に破棄し、将来のメッセージに向けて新しいバックアップ基準を作りたい場合は、次を実行します。

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. サーバー側 key backup がまだ存在しない場合は、将来の復旧用に作成します。

   ```bash
   openclaw matrix verify bootstrap
   ```

## 暗号化移行の仕組み

暗号化移行は 2 段階のプロセスです。

1. 起動時または `openclaw doctor --fix` 実行時に、暗号化移行が実行可能なら、移行前スナップショットを作成または再利用します。
2. 起動時または `openclaw doctor --fix` 実行時に、アクティブな Matrix Plugin インストールを通して古い Matrix crypto store を検査します。
3. backup decryption key が見つかった場合、OpenClaw はそれを新しい recovery-key フローに書き込み、room-key restore を保留状態としてマークします。
4. 次回 Matrix 起動時に、OpenClaw はバックアップされた room key を新しい crypto store に自動復元します。

古い store が、一度もバックアップされていない room key を報告した場合、OpenClaw は復旧成功を装うのではなく警告を出します。

## よくあるメッセージとその意味

### アップグレードと検出メッセージ

`Matrix plugin upgraded in place.`

- 意味: 古いディスク上の Matrix 状態が検出され、現在のレイアウトに移行されました。
- 対処: 同じ出力に警告も含まれていない限り、何もする必要はありません。

`Matrix migration snapshot created before applying Matrix upgrades.`

- 意味: OpenClaw は Matrix 状態を変更する前に復旧アーカイブを作成しました。
- 対処: 移行成功を確認するまで、表示されたアーカイブパスを保持してください。

`Matrix migration snapshot reused before applying Matrix upgrades.`

- 意味: OpenClaw は既存の Matrix migration snapshot marker を見つけ、重複バックアップを作成する代わりにそのアーカイブを再利用しました。
- 対処: 移行成功を確認するまで、表示されたアーカイブパスを保持してください。

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- 意味: 古い Matrix 状態は存在しますが、Matrix がまだ設定されていないため、OpenClaw はそれを現在の Matrix アカウントに対応付けられません。
- 対処: `channels.matrix` を設定し、その後 `openclaw doctor --fix` を再実行するか gateway を再起動してください。

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 意味: OpenClaw は古い状態を見つけましたが、現在の正確な account/device root をまだ決定できません。
- 対処: 動作する Matrix login で一度 gateway を起動するか、キャッシュ済み認証情報が存在する状態で `openclaw doctor --fix` を再実行してください。

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 意味: OpenClaw は 1 つの共有フラット Matrix store を見つけましたが、どの名前付き Matrix アカウントに渡すべきかを推測することを拒否しています。
- 対処: `channels.matrix.defaultAccount` を意図したアカウントに設定し、その後 `openclaw doctor --fix` を再実行するか gateway を再起動してください。

`Matrix legacy sync store not migrated because the target already exists (...)`

- 意味: 新しいアカウントスコープの場所にすでに sync または crypto store が存在するため、OpenClaw は自動上書きを行いませんでした。
- 対処: 競合している対象を手動で削除または移動する前に、現在のアカウントが正しいことを確認してください。

`Failed migrating Matrix legacy sync store (...)` または `Failed migrating Matrix legacy crypto store (...)`

- 意味: OpenClaw は古い Matrix 状態を移動しようとしましたが、ファイルシステム操作が失敗しました。
- 対処: ファイルシステム権限とディスク状態を確認し、その後 `openclaw doctor --fix` を再実行してください。

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- 意味: OpenClaw は古い暗号化 Matrix store を見つけましたが、現在の Matrix config がないため、それを関連付ける先がありません。
- 対処: `channels.matrix` を設定し、その後 `openclaw doctor --fix` を再実行するか gateway を再起動してください。

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 意味: 暗号化 store は存在しますが、それがどの現在の account/device に属するかを OpenClaw が安全に判断できません。
- 対処: 動作する Matrix login で一度 gateway を起動するか、キャッシュ済み認証情報が利用可能な状態で `openclaw doctor --fix` を再実行してください。

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 意味: OpenClaw は 1 つの共有フラットなレガシー crypto store を見つけましたが、それをどの名前付き Matrix アカウントに渡すべきかを推測することを拒否しています。
- 対処: `channels.matrix.defaultAccount` を意図したアカウントに設定し、その後 `openclaw doctor --fix` を再実行するか gateway を再起動してください。

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- 意味: OpenClaw は古い Matrix 状態を検出しましたが、移行はまだ identity または credential データ不足でブロックされています。
- 対処: Matrix login または config 設定を完了し、その後 `openclaw doctor --fix` を再実行するか gateway を再起動してください。

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- 意味: OpenClaw は古い暗号化 Matrix 状態を見つけましたが、その store を通常検査する Matrix Plugin の helper entrypoint をロードできませんでした。
- 対処: Matrix Plugin を再インストールまたは修復し（`openclaw plugins install @openclaw/matrix`、または repo checkout なら `openclaw plugins install ./path/to/local/matrix-plugin`）、その後 `openclaw doctor --fix` を再実行するか gateway を再起動してください。

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- 意味: OpenClaw は Plugin root を逸脱する helper file path、または Plugin boundary チェックに失敗する path を見つけたため、その import を拒否しました。
- 対処: 信頼できる path から Matrix Plugin を再インストールし、その後 `openclaw doctor --fix` を再実行するか gateway を再起動してください。

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- 意味: OpenClaw は、最初に復旧スナップショットを作成できなかったため、Matrix 状態の変更を拒否しました。
- 対処: バックアップエラーを解消し、その後 `openclaw doctor --fix` を再実行するか gateway を再起動してください。

`Failed migrating legacy Matrix client storage: ...`

- 意味: Matrix クライアント側フォールバックが古いフラットストレージを見つけましたが、移動に失敗しました。OpenClaw は現在、そのフォールバックを黙って新しい store で開始する代わりに中止します。
- 対処: ファイルシステム権限や競合を確認し、古い状態はそのまま保持して、エラー修正後に再試行してください。

`Matrix is installed from a custom path: ...`

- 意味: Matrix は path install に固定されているため、通常の更新では repo の標準 Matrix パッケージに自動置換されません。
- 対処: デフォルト Matrix Plugin に戻したい場合は `openclaw plugins install @openclaw/matrix` で再インストールしてください。

### 暗号化状態復旧メッセージ

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- 意味: バックアップ済み room key が新しい crypto store に正常に復元されました。
- 対処: 通常は何も不要です。

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- 意味: 一部の古い room key は古いローカル store にしか存在せず、Matrix backup に一度もアップロードされていませんでした。
- 対処: 別の検証済みクライアントからそれらの key を手動復旧できない限り、一部の古い暗号化履歴は利用不能のまま残ることを想定してください。

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- 意味: バックアップは存在しますが、OpenClaw は recovery key を自動復旧できませんでした。
- 対処: `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` を実行してください。

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- 意味: OpenClaw は古い暗号化 store を見つけましたが、復旧準備に十分な安全性でそれを検査できませんでした。
- 対処: `openclaw doctor --fix` を再実行してください。繰り返される場合は、古い state directory をそのまま保持し、別の検証済み Matrix クライアントと `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` を使って復旧してください。

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- 意味: OpenClaw は backup key の競合を検出し、現在の recovery-key file を自動上書きすることを拒否しました。
- 対処: restore コマンドを再試行する前に、どの recovery key が正しいかを確認してください。

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- 意味: これは古い保存形式のハードリミットです。
- 対処: バックアップ済み key は復元できますが、ローカル専用の暗号化履歴は利用不能のまま残る可能性があります。

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- 意味: 新しい Plugin が restore を試みましたが、Matrix がエラーを返しました。
- 対処: `openclaw matrix verify backup status` を実行し、必要に応じて `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` で再試行してください。

### 手動復旧メッセージ

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- 意味: OpenClaw は backup key があるはずだと認識していますが、このデバイスでは有効になっていません。
- 対処: `openclaw matrix verify backup restore` を実行するか、必要なら `--recovery-key` を渡してください。

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- 意味: このデバイスには現在 recovery key が保存されていません。
- 対処: まず recovery key でデバイスを検証し、その後 backup を復元してください。

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- 意味: 保存されている key が、アクティブな Matrix backup と一致しません。
- 対処: 正しい key で `openclaw matrix verify device "<your-recovery-key>"` を再実行してください。

復旧不能な古い暗号化履歴を失うことを受け入れるなら、代わりに
`openclaw matrix verify backup reset --yes` で現在の backup baseline を reset できます。保存済み backup secret が壊れている場合、その reset によって secret storage も再作成され、
再起動後に新しい backup key が正しく読み込まれることがあります。

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- 意味: backup は存在しますが、このデバイスは cross-signing chain をまだ十分強く信頼していません。
- 対処: `openclaw matrix verify device "<your-recovery-key>"` を再実行してください。

`Matrix recovery key is required`

- 意味: recovery key が必要な復旧手順を、key を渡さずに実行しようとしました。
- 対処: recovery key を付けてコマンドを再実行してください。

`Invalid Matrix recovery key: ...`

- 意味: 指定された key が parse できないか、期待形式と一致しませんでした。
- 対処: Matrix クライアントまたは recovery-key file にある正確な recovery key で再試行してください。

`Matrix device is still unverified after applying recovery key. Verify your recovery key and ensure cross-signing is available.`

- 意味: key は適用されましたが、デバイスはまだ検証を完了できませんでした。
- 対処: 正しい key を使ったこと、およびそのアカウントで cross-signing が利用可能であることを確認してから再試行してください。

`Matrix key backup is not active on this device after loading from secret storage.`

- 意味: secret storage からは、このデバイス上でアクティブな backup session が作られませんでした。
- 対処: まずデバイスを検証し、その後 `openclaw matrix verify backup status` で再確認してください。

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- 意味: このデバイスでは、デバイス検証が完了するまで secret storage から restore できません。
- 対処: まず `openclaw matrix verify device "<your-recovery-key>"` を実行してください。

### カスタム Plugin インストールメッセージ

`Matrix is installed from a custom path that no longer exists: ...`

- 意味: Plugin install record が、すでに存在しないローカル path を指しています。
- 対処: `openclaw plugins install @openclaw/matrix` で再インストールするか、repo checkout から実行している場合は `openclaw plugins install ./path/to/local/matrix-plugin` を使ってください。

## 暗号化履歴がまだ戻らない場合

次のチェックを順番に実行してください。

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

backup が正常に復元されても一部の古い room に履歴がまだない場合、その不足している key は、おそらく以前の Plugin では一度もバックアップされていませんでした。

## 今後のメッセージのために新しく始めたい場合

復旧不能な古い暗号化履歴を失うことを受け入れ、今後に向けてクリーンな backup baseline だけが欲しい場合は、次のコマンドを順に実行してください。

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

その後もデバイスが未検証のままなら、Matrix クライアント側で SAS の絵文字または 10 進コードを比較し、一致していることを確認して検証を完了してください。

## 関連ページ

- [Matrix](/ja-JP/channels/matrix)
- [Doctor](/ja-JP/gateway/doctor)
- [Migrating](/ja-JP/install/migrating)
- [Plugins](/ja-JP/tools/plugin)

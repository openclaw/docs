---
read_when:
    - ローカルの OpenClaw 状態用に、正式にサポートされたバックアップアーカイブが必要な場合
    - 1つのOpenClaw SQLiteデータベースについて、コンパクトで検証済みのスナップショットが必要です
    - リセットまたはアンインストールする前に、対象となるパスをプレビューしたい場合
summary: '`openclaw backup` の CLI リファレンス（アーカイブと SQLite スナップショット）'
title: バックアップ
x-i18n:
    generated_at: "2026-07-14T13:34:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 6f52d6c96feb08862d2f666c0ed777f5ecb12713a10d6a8ec4cc0374d015250d
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

OpenClaw の状態、設定、認証プロファイル、チャンネル／プロバイダーの認証情報、セッション、および必要に応じてワークスペースのローカルバックアップアーカイブを作成します。

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T08-00-00.000+08-00-openclaw-backup.tar.gz
openclaw backup sqlite create --global --repository ~/Backups/openclaw-sqlite
openclaw backup sqlite create --agent main --repository ~/Backups/openclaw-sqlite
openclaw backup sqlite list --repository ~/Backups/openclaw-sqlite
openclaw backup sqlite verify ~/Backups/openclaw-sqlite/<snapshot-id>
openclaw backup sqlite verify ~/Backups/openclaw-sqlite/<snapshot-id> --scratch ~/Private/openclaw-scratch
openclaw backup sqlite restore ~/Backups/openclaw-sqlite/<snapshot-id> --target ./restored/openclaw.sqlite
```

## 注記

- アーカイブには、解決済みのソースパスとアーカイブレイアウトを記載した `manifest.json` が埋め込まれます。
- デフォルトの出力は、現在の作業ディレクトリに作成されるタイムスタンプ付きの `.tar.gz` アーカイブです。タイムスタンプ付きファイル名にはマシンのローカルタイムゾーンが使用され、UTC オフセットが含まれます。現在の作業ディレクトリがバックアップ対象のソースツリー内にある場合、OpenClaw はデフォルトのアーカイブ保存先としてホームディレクトリを使用します。
- 既存のアーカイブファイルは上書きされません。自己包含を防ぐため、ソースの状態／ワークスペースツリー内の出力パスは拒否されます。
- `openclaw backup verify <archive>` は、アーカイブにルートマニフェストが正確に 1 つ含まれていることを確認し、ディレクトリトラバーサル形式のアーカイブパスと SQLite サイドカーを拒否し、マニフェストで宣言されたすべてのペイロードが存在することを確認し、各 SQLite スナップショットのファイル形式を検証し、OpenClaw の正規データベースに対して完全な整合性チェックとロールチェックを実行します。専用の Plugin スキーマは、所有者が定義した SQLite 機能を必要とする場合があるため、不透明なものとして扱われます。`openclaw backup create --verify` は、アーカイブの書き込み直後にこの検証を実行します。
- `openclaw backup create --only-config` は、アクティブな JSON 設定ファイルのみをバックアップします。

## SQLite スナップショット

広範な状態アーカイブではなく、OpenClaw が所有する 1 つの SQLite データベース用の可搬性のある成果物が必要な場合は、`openclaw backup sqlite` を使用します。

スナップショット作成では、名前付きソースを正確に 1 つ指定できます。

| コマンド                                                         | データベース               |
| --------------------------------------------------------------- | ---------------------- |
| `openclaw backup sqlite create --global --repository <dir>`     | OpenClaw の共有状態  |
| `openclaw backup sqlite create --agent <id> --repository <dir>` | エージェントごとのデータベース 1 つ |

リポジトリには、コミット済みスナップショットごとに 1 つのディレクトリが含まれます。各スナップショットディレクトリには、正確に次のものが含まれます。

- `manifest.json`
- `database.sqlite`

スナップショット作成では、読み取り前に稼働中のデータベースを検証し、SQLite の `VACUUM INTO` を使用してコミット済みの WAL 状態をコンパクトなデータベースに取り込み、生成されたデータベースを再度検証し、既存のパスを上書きせずに完成したディレクトリを公開します。グローバルスナップショットでは、一時的な配信キューの行を削除してから再度コンパクト化するため、削除済みのキューペイロードが空きページに保持されることはありません。

可搬性のある成果物として、稼働中の `.sqlite`、`-wal`、`-shm`、または `-journal` ファイルをコピーしないでください。完成したスナップショットディレクトリのみをコピーしてください。

SQLite スナップショットには、認証プロファイル、セッション状態、Plugin の状態、およびその他の機密レコードが含まれる可能性があります。リポジトリは、稼働中の OpenClaw 状態ディレクトリと同じ権限、暗号化、保持ポリシー、および保存先制限で保護してください。

### 検証と復元

```bash
openclaw backup sqlite verify <snapshot-directory>
openclaw backup sqlite restore <snapshot-directory> --target <new-database-path>
```

検証では、厳密なマニフェスト形式、成果物のサイズと SHA-256、SQLite の整合性、外部キー、スキーマバージョン、データベースのロールと所有者、および OpenClaw が所有するインデックス定義を確認します。

検証では、パス名の競合によって SQLite が検査するバイト列を差し替えられないように、内容が固定された非公開コピーを検証します。デフォルトでは、その一時コピーはスナップショットリポジトリの隣に作成され、コマンドが戻る前に削除されます。ステージングルートとその祖先チェーンでは、他のユーザーによる置換を防止する必要があります。POSIX ルートは現在のユーザーが所有し、グループおよび全ユーザーによる書き込みが不可でなければなりません。`/tmp` のような sticky 属性を持つ祖先は、ユーザー所有の子に対して許可されます。ステージングを公開したり置換可能にしたりする macOS の ACL 許可は拒否されます。Windows のルートと祖先は、現在のユーザーまたは信頼された OS プリンシパルが所有し、信頼されていない主体によるステージングへのアクセスを拒否する ACL が設定されている必要があります。読み取り専用マウントまたはネットワーク共有の場合は、同等の暗号化と保存先制御を備えたストレージ上の `--scratch <existing-private-directory>` を渡します。

スナップショット作成では、データベースのバイト列をステージングまたは公開する前に、同じ所有者、ACL、祖先、およびパス同一性のチェックをリポジトリに適用します。

復元では検証を繰り返し、新しいターゲットにのみ書き込みます。既存のターゲット、`-wal`、`-shm`、または `-journal` サイドカーがある場合は拒否し、稼働中の OpenClaw データベースをインプレースで置換することはありません。ターゲットの親には、検証用スクラッチと同じパスセキュリティ要件が適用されます。復元したデータベースの有効化は、明示的なオフラインのオペレーター操作として残されます。

スナップショットリポジトリはローカルディレクトリです。スケジュール設定、アップロード、保持、増分 WAL バンドル、フェイルオーバー、および起動時の復元動作は、意図的にこのコマンドの対象外とされています。

## バックアップされる内容

`openclaw backup create` は、ローカルの OpenClaw インストールからソースを計画します。

- 状態ディレクトリ（通常は `~/.openclaw`）
- アクティブな設定ファイルのパス
- 状態ディレクトリ外に存在する場合の、解決済み `credentials/` ディレクトリ
- `--no-include-workspace` を渡さない限り、現在の設定から検出されたワークスペースディレクトリ

認証プロファイルとその他のエージェントごとのランタイム状態は、状態ディレクトリ内の SQLite（`agents/<agentId>/agent/openclaw-agent.sqlite`）に保存されるため、状態バックアップエントリによって自動的に対象となります。

`--only-config` は、状態、認証情報ディレクトリ、およびワークスペースの検出をスキップし、アクティブな設定ファイルのパスのみをアーカイブします。

OpenClaw は、アーカイブを構築する前にパスを正規化します。設定、認証情報ディレクトリ、またはワークスペースがすでに状態ディレクトリ内にある場合、それらは個別のトップレベルバックアップソースとして重複しません。存在しないパスはスキップされます。

アーカイブ作成中、OpenClaw は `tar` が読み取る前に、稼働中に変更されることが分かっているパスを除外します。これにより、記録されたファイルサイズと同時書き込みとの競合を回避します。このフィルターは、バックアップ対象の各状態ディレクトリ配下に次の状態ディレクトリ相対ルールを適用します。

| 状態ディレクトリからの相対範囲                         | スキップされるファイルサフィックス         |
| -------------------------------------------- | ----------------------------- |
| `sessions/**`                                | `.jsonl`, `.log`              |
| `agents/<agentId>/sessions/**`               | `.jsonl`, `.log`              |
| `cron/runs/**`                               | `.jsonl`, `.log`              |
| `logs/**`                                    | `.jsonl`, `.log`              |
| `delivery-queue/**`                          | `.json`, `.delivered`, `.tmp` |
| `session-delivery-queue/**`                  | `.json`, `.delivered`, `.tmp` |
| バックアップ対象の状態ディレクトリ配下の任意のパス | `.sock`, `.pid`, `.tmp`       |

これらのルールは、状態ディレクトリ外のワークスペースファイルを除外しません。また、表に一致する完成済みのトランスクリプトファイルとログファイルも除外するため、必要な場合はそれらのレコードを別途保持してください。JSON 結果の `skippedVolatileCount` は、意図的に除外されたファイル数を報告します。

状態ディレクトリ配下の SQLite データベースは `VACUUM INTO` でコンパクト化されるため、削除済みページの残留データはアーカイブに入りません。また、稼働中の WAL／SHM ファイルはコピーされません。利用できない所有者定義の SQLite 機能を必要とする Plugin 所有のデータベースは、生のページコピーにフォールバックせず、安全側に倒して失敗します。ワークスペースバックアップを通じて含まれる SQLite ファイルはワークスペースファイルとしてコピーされ、コンパクト化の保証対象にはなりません。

状態ディレクトリの `extensions/` ツリー配下にあるインストール済み Plugin のソースファイルとマニフェストファイルは含まれますが、ネストされた `node_modules/` 依存関係ツリーは、再構築可能なインストール成果物としてスキップされます。アーカイブを復元した後、復元された Plugin が依存関係の欠落を報告する場合は、`openclaw plugins update <id>` を使用するか、`openclaw plugins install <spec> --force` で再インストールしてください。

## 無効な設定での動作

`openclaw backup` は通常の設定事前チェックを迂回するため、復旧中にも使用できます。ワークスペースの検出は有効な設定に依存するため、設定ファイルが存在するものの無効で、ワークスペースのバックアップが引き続き有効になっている場合、`openclaw backup create` は即座に失敗します。

この状況で部分バックアップを行うには、`--no-include-workspace` を指定して再実行します。これにより、状態、設定、および外部の認証情報ディレクトリを対象に含めたまま、ワークスペースの検出を完全にスキップします。

`--only-config` はワークスペース検出のために設定を解析しないため、設定が不正な場合でも機能します。

## サイズとパフォーマンス

OpenClaw には、組み込みの最大バックアップサイズやファイルごとのサイズ制限はありません。実際の制限は、次の要因によって決まります。

- 一時アーカイブの書き込みと最終アーカイブに使用できる空き容量
- 大規模なワークスペースツリーを走査して `.tar.gz` に圧縮する時間
- `--verify` または `openclaw backup verify` でアーカイブを再走査する時間
- 保存先ファイルシステムの動作：OpenClaw は上書きしないハードリンクによる公開手順を優先し、ハードリンクがサポートされていない場合は排他的コピーにフォールバックします

通常、アーカイブサイズを最も大きく左右するのは大規模なワークスペースです。より小さく高速なバックアップには `--no-include-workspace` を、最小のアーカイブには `--only-config` を使用してください。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)

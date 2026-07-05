---
read_when:
    - コマンド権限に auto、ask、allowlist、full、deny のいずれかを選択する
    - tools.exec.mode を通じて Codex Guardian レビュー済み承認を設定する
    - OpenClaw exec 承認と ACPX ハーネス権限の比較
summary: ホスト exec、Codex Guardian 承認、ACPX ハーネスセッションの権限モード
title: 権限モード
x-i18n:
    generated_at: "2026-07-05T11:56:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f580e66508c1f69e868ed26a62d88a675f86a4d1ca738650dc5af82e967f3ac3
    source_path: tools/permission-modes.md
    workflow: 16
---

権限モードは、エージェントがホストコマンドを実行したり、ファイルを書き込んだり、追加アクセスをバックエンドハーネスに要求したりする前に、どれだけの権限を持つかを決定します。

<Note>
  権限モードは `tools.exec.host=auto` とは別です。`tools.exec.host`
  はコマンドを実行する場所を選びます。`tools.exec.mode` はホスト exec が
  どのように承認されるかを選びます。
</Note>

## 推奨デフォルト

すべてのミスを人間へのプロンプトにせず、有用なホストアクセスを必要とするコーディングエージェントには `auto` を使用します。

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

次に、有効なポリシーを確認します。

```bash
openclaw exec-policy show
```

## OpenClaw ホスト exec モード

`tools.exec.mode` はホスト `exec` の正規化されたポリシーサーフェスです。各モードは、基盤となる `security`（allowlist の厳格さ）と `ask`（ミス時のプロンプト）のペアに解決されます。

| モード      | security / ask          | 動作                                                                                          | 使用する場面                                            |
| ----------- | ----------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `deny`      | `deny` / `off`          | ホスト exec を完全にブロックします。                                                          | ホストコマンドを許可しない場合。                        |
| `allowlist` | `allowlist` / `off`     | allowlist に含まれるコマンドのみを実行し、ミスは静かに拒否します。                            | 安全だと分かっているコマンドセットがある場合。          |
| `ask`       | `allowlist` / `on-miss` | allowlist に一致するものを実行し、ミス時は人間に確認します。                                  | すべての新しいコマンドを人間がレビューすべき場合。      |
| `auto`      | `allowlist` / `on-miss` | allowlist に一致するものを実行し、ミスは人間の承認にフォールバックする前に自動レビューへ送ります。 | コーディングセッションに実用的な保護付きアクセスが必要な場合。 |
| `full`      | `full` / `off`          | プロンプトなしでホスト exec を実行します。                                                     | この信頼済みホスト/セッションで承認ゲートをスキップすべき場合。 |

`ask` と `auto` は同じ allowlist/ask 設定を共有します。`auto` はさらにネイティブ自動レビュアーを有効にし、ミスを自ら判断して、安全に承認できない場合だけ設定済みの人間承認ルートへ委ねます。

完全なホスト exec ポリシー、ローカル承認ファイル、allowlist スキーマ、安全なバイナリ、転送動作については、[Exec 承認](/ja-JP/tools/exec-approvals)を参照してください。

## Codex Guardian マッピング

ネイティブ Codex アプリサーバーセッションでは、ローカルの Codex 要件が許す場合、`tools.exec.mode: "auto"` は Codex を Guardian レビュー済み承認へ向かわせます。典型的な結果値は次のとおりです。

| Codex フィールド    | 典型的な値        |
| ------------------- | ----------------- |
| `approvalPolicy`    | `on-request`      |
| `approvalsReviewer` | `auto_review`     |
| `sandbox`           | `workspace-write` |

`auto` モードは、設定済みの Codex サンドボックス/承認オーバーライドよりもこのポリシーを優先するため、`approvalPolicy: "never"` と `sandbox: "danger-full-access"` のような従来の安全でない組み合わせは保持されません。`tools.exec.mode: "deny"` と `"allowlist"` は、Codex アプリサーバーのローカル実行を完全にブロックします。承認なしの姿勢を意図的に使いたい場合にのみ、`tools.exec.mode: "full"` を使用してください。

アプリサーバーのセットアップ、認証順序、ネイティブ Codex ランタイムの詳細については、[Codex ハーネス](/ja-JP/plugins/codex-harness)を参照してください。

## ACPX ハーネス権限

ACPX セッションは非対話型のため、TTY 権限プロンプトをクリックできません。ACPX は `plugins.entries.acpx.config` 配下の別個のハーネスレベル設定を使用します。

| 設定                        | 値              | 意味                                      |
| --------------------------- | --------------- | ----------------------------------------- |
| `permissionMode`            | `approve-reads` | 読み取りのみを自動承認します。            |
| `permissionMode`            | `approve-all`   | 書き込みとシェルコマンドを自動承認します。 |
| `permissionMode`            | `deny-all`      | すべての権限プロンプトを拒否します。      |
| `nonInteractivePermissions` | `fail`          | プロンプトが必要になる場合は中止します。  |
| `nonInteractivePermissions` | `deny`          | 可能な場合はプロンプトを拒否して続行します。 |

ACPX 権限は OpenClaw exec 承認とは別に設定します。

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

`approve-all` は、プロンプトなしハーネスセッションに相当する ACPX の非常用設定として使用します。セットアップの詳細と失敗モードについては、[ACP エージェントセットアップ](/ja-JP/tools/acp-agents-setup#permission-configuration)を参照してください。

## モードの選択

| 目的                                           | 設定                                                        |
| ---------------------------------------------- | ----------------------------------------------------------- |
| ホストコマンドを完全にブロックする             | `tools.exec.mode: "deny"`                                   |
| 安全だと分かっているコマンドのみを実行させる   | `tools.exec.mode: "allowlist"`                              |
| 新しいコマンド形状ごとに人間へ確認する         | `tools.exec.mode: "ask"`                                    |
| 人間の前に Codex/OpenClaw 自動レビューを使用する | `tools.exec.mode: "auto"`                                   |
| ホスト exec 承認を完全にスキップする           | `tools.exec.mode: "full"` と一致するホスト承認ファイル      |
| 非対話型 ACPX セッションに write/exec を許可する | `plugins.entries.acpx.config.permissionMode: "approve-all"` |

モード変更後もコマンドがプロンプトを出したり失敗したりする場合は、両方のレイヤーを確認します。

```bash
openclaw approvals get
openclaw exec-policy show
```

ホスト exec は、OpenClaw 設定とホストローカル承認ファイルのうち、より厳格な結果を使用します。ACPX ハーネス権限はホスト exec 承認を緩めず、ホスト exec 承認も ACPX ハーネスプロンプトを緩めません。

## 関連

- [Exec 承認](/ja-JP/tools/exec-approvals)
- [Exec 承認 - 詳細](/ja-JP/tools/exec-approvals-advanced)
- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [ACP エージェントセットアップ](/ja-JP/tools/acp-agents-setup#permission-configuration)

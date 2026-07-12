---
read_when:
    - コマンド権限で auto、ask、allowlist、full、deny のいずれかを選択する
    - tools.exec.mode を使用した Codex Guardian レビュー済み承認の設定
    - OpenClaw の exec 承認と ACPX ハーネス権限の比較
summary: ホスト実行の権限モード、Codex Guardian の承認、ACPX ハーネスセッション
title: 権限モード
x-i18n:
    generated_at: "2026-07-11T22:45:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f580e66508c1f69e868ed26a62d88a675f86a4d1ca738650dc5af82e967f3ac3
    source_path: tools/permission-modes.md
    workflow: 16
---

権限モードは、エージェントがホストコマンドを実行したり、ファイルを書き込んだり、バックエンドハーネスに追加アクセスを要求したりする前に、どの程度の権限を持つかを決定します。

<Note>
  権限モードは `tools.exec.host=auto` とは別のものです。`tools.exec.host`
  はコマンドを実行する場所を選択します。`tools.exec.mode` はホストでの exec を
  どのように承認するかを選択します。
</Note>

## 推奨されるデフォルト

すべての不一致で人間への確認を発生させることなく、実用的なホストアクセスを必要とするコーディングエージェントには `auto` を使用します。

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

次に、有効なポリシーを確認します。

```bash
openclaw exec-policy show
```

## OpenClaw のホスト exec モード

`tools.exec.mode` は、ホスト `exec` 用に正規化されたポリシー設定です。各モードは、基盤となる `security`（許可リストの厳格さ）と `ask`（不一致時の確認）の組み合わせに解決されます。

| モード      | security / ask          | 動作                                                                                                    | 使用する状況                                              |
| ----------- | ----------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `deny`      | `deny` / `off`          | ホストでの exec を完全にブロックします。                                                               | ホストコマンドを一切許可しない場合。                      |
| `allowlist` | `allowlist` / `off`     | 許可リストに登録されたコマンドのみ実行し、不一致は通知せずに拒否します。                                | 安全性が確認済みのコマンドセットがある場合。              |
| `ask`       | `allowlist` / `on-miss` | 許可リストに一致するコマンドを実行し、不一致の場合は人間に確認します。                                  | 新しいコマンドを毎回人間が確認する必要がある場合。        |
| `auto`      | `allowlist` / `on-miss` | 許可リストに一致するコマンドを実行し、不一致は人間の承認にフォールバックする前に自動レビューへ送ります。 | コーディングセッションに、保護された実用的アクセスが必要な場合。 |
| `full`      | `full` / `off`          | 確認なしでホストでの exec を実行します。                                                               | この信頼済みホストまたはセッションで承認ゲートを省略する場合。 |

`ask` と `auto` は同じ許可リストおよび確認設定を共有します。`auto` はさらにネイティブの自動レビュー機能を有効にします。この機能は不一致を自ら判定し、安全に承認できない場合にのみ、設定された人間の承認経路へ判断を委ねます。

ホストでの exec に関する完全なポリシー、ローカル承認ファイル、許可リストのスキーマ、安全なバイナリ、および転送動作については、[Exec の承認](/ja-JP/tools/exec-approvals)を参照してください。

## Codex Guardian の対応関係

ネイティブ Codex app-server セッションでは、ローカルの Codex 要件で許可されている場合、`tools.exec.mode: "auto"` によって Codex は Guardian によるレビュー付き承認を使用するようになります。通常、次の値になります。

| Codex フィールド     | 通常の値          |
| -------------------- | ----------------- |
| `approvalPolicy`     | `on-request`      |
| `approvalsReviewer`  | `auto_review`     |
| `sandbox`            | `workspace-write` |

`auto` モードは、設定済みの Codex サンドボックスや承認のオーバーライドよりもこのポリシーを優先します。そのため、`approvalPolicy: "never"` と `sandbox: "danger-full-access"` の組み合わせのような、従来の安全でない構成は維持されません。`tools.exec.mode: "deny"` と `"allowlist"` は、Codex app-server のローカル実行を完全にブロックします。承認を行わない構成を意図的に使用する場合にのみ、`tools.exec.mode: "full"` を使用してください。

app-server のセットアップ、認証順序、およびネイティブ Codex ランタイムの詳細については、[Codex ハーネス](/ja-JP/plugins/codex-harness)を参照してください。

## ACPX ハーネスの権限

ACPX セッションは非対話型であるため、TTY の権限確認をクリックできません。ACPX は、`plugins.entries.acpx.config` 以下にある個別のハーネスレベル設定を使用します。

| 設定                        | 値              | 意味                                         |
| --------------------------- | --------------- | -------------------------------------------- |
| `permissionMode`            | `approve-reads` | 読み取りのみを自動承認します。               |
| `permissionMode`            | `approve-all`   | 書き込みとシェルコマンドを自動承認します。   |
| `permissionMode`            | `deny-all`      | すべての権限確認を拒否します。               |
| `nonInteractivePermissions` | `fail`          | 確認が必要になった場合は中止します。         |
| `nonInteractivePermissions` | `deny`          | 確認を拒否し、可能であれば処理を続行します。 |

ACPX の権限は、OpenClaw の exec 承認とは別に設定します。

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

確認なしのハーネスセッションに相当する ACPX の緊急時用設定として、`approve-all` を使用します。セットアップの詳細と失敗モードについては、[ACP エージェントのセットアップ](/ja-JP/tools/acp-agents-setup#permission-configuration)を参照してください。

## モードの選択

| 目的                                              | 設定                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| ホストコマンドを完全にブロックする                | `tools.exec.mode: "deny"`                                          |
| 安全性が確認済みのコマンドのみ実行する            | `tools.exec.mode: "allowlist"`                                     |
| 新しいコマンド形式ごとに人間へ確認する            | `tools.exec.mode: "ask"`                                           |
| 人間による確認の前に Codex/OpenClaw の自動レビューを使用する | `tools.exec.mode: "auto"`                                          |
| ホストでの exec の承認を完全に省略する             | `tools.exec.mode: "full"` と対応するホスト承認ファイル              |
| 非対話型 ACPX セッションで書き込みや実行を行う     | `plugins.entries.acpx.config.permissionMode: "approve-all"`         |

モードを変更した後もコマンドで確認が表示されたり失敗したりする場合は、両方のレイヤーを調べてください。

```bash
openclaw approvals get
openclaw exec-policy show
```

ホストでの exec には、OpenClaw の設定とホストローカルの承認ファイルのうち、より厳格な結果が適用されます。ACPX ハーネスの権限によってホストでの exec の承認が緩和されることはなく、ホストでの exec の承認によって ACPX ハーネスの確認が緩和されることもありません。

## 関連項目

- [Exec の承認](/ja-JP/tools/exec-approvals)
- [Exec の承認 - 高度な設定](/ja-JP/tools/exec-approvals-advanced)
- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [ACP エージェントのセットアップ](/ja-JP/tools/acp-agents-setup#permission-configuration)

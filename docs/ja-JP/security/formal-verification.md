---
permalink: /security/formal-verification/
read_when:
    - 正式なセキュリティモデルの保証または制限のレビュー
    - TLA+/TLC セキュリティモデルチェックの再現または更新
summary: OpenClaw の最もリスクの高い経路を対象とした、機械検証済みのセキュリティモデル。
title: 形式検証（セキュリティモデル）
x-i18n:
    generated_at: "2026-07-11T22:41:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86342f6e2f54c08d5e0f8a08d0d488459650a6ace35e985ff886f847540202c9
    source_path: security/formal-verification.md
    workflow: 16
---

OpenClawの形式的セキュリティモデル（現在はTLA+/TLC）は、明示的に記載された前提条件の下で、特にリスクの高い経路（認可、セッション分離、ツールのゲーティング、設定ミスに対する安全性）が意図されたポリシーを適用することを、機械的検証に基づいて論証します。

> 注: 一部の古いリンクでは、以前のプロジェクト名が使われている場合があります。

## これは何か

実行可能で、攻撃者の視点に基づくセキュリティ回帰テストスイートです。

- 各主張には、有限状態空間で実行可能なモデル検査があります。
- 多くの主張には、現実的なバグの種類に対する反例トレースを生成する、対となるネガティブモデルがあります。

これは、OpenClawがあらゆる点で安全であることの証明では**ありません**。また、TypeScript実装全体を検証するものでもありません。

## モデルの所在

モデルは別のリポジトリで管理されています: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models)。

<Note>
現在、そのリポジトリにはアクセスできません（本稿執筆時点では、GitHubが「Repository not found」を返します）。引き続きアクセスできない場合は、モデルが削除されたと判断する前に、OpenClawのメンテナーチャンネルで現在の所在を確認してください。
</Note>

## 注意事項

- これらはモデルであり、TypeScript実装全体ではありません。モデルとコードの間に差異が生じる可能性があります。
- 結果は、TLCが探索する状態空間の範囲に限定されます。結果が正常でも、モデル化された前提条件と境界を超えた安全性を意味するわけではありません。
- 一部の主張は、明示的な環境上の前提条件（たとえば、正しいデプロイと正しい設定入力）に依存します。

## 結果の再現

モデルのリポジトリをクローンし、TLCを実行します。

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ が必要です（TLCはJVM上で動作します）。
# リポジトリには固定バージョンのtla2tools.jarが同梱され、
# bin/tlcとMakeターゲットが用意されています。

make <target>
```

このリポジトリへのCI統合はまだありません。今後の改善として、公開アーティファクト（反例トレース、実行ログ）を伴うCI実行モデルや、小規模な有界検査向けのホスト型「このモデルを実行」ワークフローを追加できます。

## 主張とターゲット

### Gatewayの公開とオープンGatewayの設定ミス

**主張:** 認証なしでループバック外にバインドすると、リモートから侵害される可能性が生じ、公開範囲が拡大します。モデルの前提条件では、トークンまたはパスワードによって未認証の攻撃者を阻止できます。

| 結果           | ターゲット                                                       |
| -------------- | ---------------------------------------------------------------- |
| 正常           | `make gateway-exposure-v2`, `make gateway-exposure-v2-protected` |
| 異常（想定どおり） | `make gateway-exposure-v2-negative`                              |

モデルのリポジトリにある`docs/gateway-exposure-matrix.md`も参照してください。

### Nodeのexecパイプライン（最もリスクの高い機能）

**主張:** モデルでは、`exec host=node`には、（a）Nodeコマンドの許可リストと宣言済みコマンド、および（b）設定されている場合は実行時の承認が必要です。承認は、再利用攻撃を防ぐためトークン化されます。

| 結果           | ターゲット                                                      |
| -------------- | --------------------------------------------------------------- |
| 正常           | `make nodes-pipeline`, `make approvals-token`                   |
| 異常（想定どおり） | `make nodes-pipeline-negative`, `make approvals-token-negative` |

### ペアリングストア（DMゲーティング）

**主張:** ペアリング要求では、TTLと保留中の要求数の上限が守られます。

| 結果           | ターゲット                                           |
| -------------- | ---------------------------------------------------- |
| 正常           | `make pairing`, `make pairing-cap`                   |
| 異常（想定どおり） | `make pairing-negative`, `make pairing-cap-negative` |

### 受信ゲーティング（メンションと制御コマンドによる迂回）

**主張:** メンションを必要とするグループコンテキストでは、認可されていない制御コマンドでメンションゲーティングを迂回することはできません。

| 結果           | ターゲット                     |
| -------------- | ------------------------------ |
| 正常           | `make ingress-gating`          |
| 異常（想定どおり） | `make ingress-gating-negative` |

### ルーティングとセッションキーの分離

**主張:** 明示的にリンクまたは設定されていない限り、異なる相手からのDMが同じセッションに統合されることはありません。

| 結果           | ターゲット                        |
| -------------- | --------------------------------- |
| 正常           | `make routing-isolation`          |
| 異常（想定どおり） | `make routing-isolation-negative` |

## v1++モデル: 並行処理、再試行、トレースの正確性

非アトミックな更新、再試行、メッセージのファンアウトなど、現実の障害モードに対する忠実度を高める後続モデルです。

### ペアリングストアの並行処理と冪等性

**主張:** ペアリングストアは、処理が交錯する場合でも`MaxPending`と冪等性を適用します。確認後の書き込みはアトミックまたはロック済みでなければならず、更新によって重複が作成されてはなりません。具体的には、並行要求によってチャンネルの`MaxPending`を超えることはなく、同じ`(channel, sender)`に対する要求や更新を繰り返しても、有効な保留中の行が重複して作成されることはありません。

| 結果           | ターゲット                                                                                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 正常           | `make pairing-race`（アトミックまたはロック済みの上限確認）、`make pairing-idempotency`、`make pairing-refresh`、`make pairing-refresh-race`                                 |
| 異常（想定どおり） | `make pairing-race-negative`（非アトミックな開始・コミット間の上限競合）、`make pairing-idempotency-negative`、`make pairing-refresh-negative`、`make pairing-refresh-race-negative` |

### 受信トレースの関連付けと冪等性

**主張:** 受信処理は、ファンアウト全体でトレースの関連付けを維持し、プロバイダーによる再試行に対して冪等です。1つの外部イベントが複数の内部メッセージになる場合でも、すべての部分が同じトレース／イベント識別情報を保持します。再試行による二重処理は発生しません。プロバイダーのイベントIDがない場合、異なるイベントを誤って破棄しないよう、重複排除では安全なキー（たとえばトレースID）が代替として使用されます。

| 結果           | ターゲット                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 正常           | `make ingress-trace`, `make ingress-trace2`, `make ingress-idempotency`, `make ingress-dedupe-fallback`                                     |
| 異常（想定どおり） | `make ingress-trace-negative`, `make ingress-trace2-negative`, `make ingress-idempotency-negative`, `make ingress-dedupe-fallback-negative` |

### ルーティングの`dmScope`優先順位と`identityLinks`

**主張:** ルーティングはデフォルトでDMセッションを分離し、チャンネルの優先順位とIDリンクを通じて明示的に設定されている場合にのみ、セッションを統合します。チャンネル固有の`dmScope`によるオーバーライドは、グローバルのデフォルトより優先されます。`identityLinks`は明示的にリンクされたグループ内でのみセッションを統合し、無関係な相手間では統合しません。

| 結果           | ターゲット                                                                |
| -------------- | ------------------------------------------------------------------------- |
| 正常           | `make routing-precedence`, `make routing-identitylinks`                   |
| 異常（想定どおり） | `make routing-precedence-negative`, `make routing-identitylinks-negative` |

## 関連項目

- [脅威モデル](/ja-JP/security/THREAT-MODEL-ATLAS)
- [脅威モデルへの貢献](/ja-JP/security/CONTRIBUTING-THREAT-MODEL)
- [インシデント対応](/ja-JP/security/incident-response)

---
permalink: /security/formal-verification/
read_when:
    - 形式的なセキュリティモデルの保証または制限のレビュー
    - TLA+/TLC セキュリティモデルチェックの再現または更新
summary: OpenClawの最高リスクのパス向けに機械検証されたセキュリティモデル。
title: 形式検証（セキュリティモデル）
x-i18n:
    generated_at: "2026-07-05T11:50:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86342f6e2f54c08d5e0f8a08d0d488459650a6ace35e985ff886f847540202c9
    source_path: security/formal-verification.md
    workflow: 16
---

OpenClaw の形式的セキュリティモデル（現時点では TLA+/TLC）は、特定の最高リスク経路（認可、セッション分離、ツールゲーティング、誤設定の安全性）が、明示された前提条件のもとで意図したポリシーを強制することについて、機械検査済みの論拠を提供します。

> 注: 一部の古いリンクは以前のプロジェクト名を参照している場合があります。

## これは何か

実行可能な、攻撃者駆動のセキュリティ回帰スイートです。

- 各主張には、有限状態空間で実行可能なモデル検査があります。
- 多くの主張には、現実的なバグの種類について反例トレースを生成する、対応する否定モデルがあります。

これは、OpenClaw があらゆる面で安全であることの**証明ではなく**、TypeScript 実装全体を検証するものでもありません。

## モデルの場所

モデルは別リポジトリで保守されています: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models)。

<Note>
そのリポジトリは現在到達できません（本稿執筆時点で GitHub は「Repository not found」を返します）。まだ壊れている場合は、モデルが削除されたと想定する前に、OpenClaw メンテナーチャンネルで現在の場所を確認してください。
</Note>

## 注意事項

- これらはモデルであり、TypeScript 実装全体ではありません。モデルとコードの間にずれが生じる可能性があります。
- 結果は TLC が探索する状態空間に制限されます。Green は、モデル化された前提と境界を超えたセキュリティを意味しません。
- 一部の主張は、明示的な環境前提（たとえば、正しいデプロイと正しい設定入力）に依存します。

## 結果の再現

モデルリポジトリをクローンして TLC を実行します。

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ required (TLC runs on the JVM).
# The repo vendors a pinned tla2tools.jar and provides bin/tlc plus Make targets.

make <target>
```

このリポジトリへの CI 統合はまだありません。将来の反復では、公開アーティファクト（反例トレース、実行ログ）付きの CI 実行モデルや、小さな有界検査向けのホスト型「このモデルを実行」ワークフローを追加できる可能性があります。

## 主張とターゲット

### Gateway 公開とオープン Gateway の誤設定

**主張:** 認証なしで loopback を超えてバインドすると、リモート侵害が可能になり露出が増える可能性があります。モデルの前提では、トークン/パスワードは未認証の攻撃者をブロックします。

| 結果           | ターゲット                                                       |
| -------------- | ---------------------------------------------------------------- |
| Green          | `make gateway-exposure-v2`, `make gateway-exposure-v2-protected` |
| Red（想定） | `make gateway-exposure-v2-negative`                              |

モデルリポジトリ内の `docs/gateway-exposure-matrix.md` も参照してください。

### Node exec パイプライン（最高リスク機能）

**主張:** モデルでは、`exec host=node` には (a) node コマンド許可リストと宣言済みコマンド、および (b) 設定されている場合はライブ承認が必要です。承認はリプレイを防ぐためにトークン化されます。

| 結果           | ターゲット                                                      |
| -------------- | --------------------------------------------------------------- |
| Green          | `make nodes-pipeline`, `make approvals-token`                   |
| Red（想定） | `make nodes-pipeline-negative`, `make approvals-token-negative` |

### ペアリングストア（DM ゲーティング）

**主張:** ペアリング要求は TTL と保留中要求の上限を尊重します。

| 結果           | ターゲット                                           |
| -------------- | ---------------------------------------------------- |
| Green          | `make pairing`, `make pairing-cap`                   |
| Red（想定） | `make pairing-negative`, `make pairing-cap-negative` |

### Ingress ゲーティング（メンションと制御コマンドのバイパス）

**主張:** メンションを必要とするグループコンテキストでは、未認可の制御コマンドはメンションゲーティングをバイパスできません。

| 結果           | ターゲット                     |
| -------------- | ------------------------------ |
| Green          | `make ingress-gating`          |
| Red（想定） | `make ingress-gating-negative` |

### ルーティングとセッションキー分離

**主張:** 明示的にリンクまたは設定されていない限り、異なるピアからの DM は同じセッションに統合されません。

| 結果           | ターゲット                        |
| -------------- | --------------------------------- |
| Green          | `make routing-isolation`          |
| Red（想定） | `make routing-isolation-negative` |

## v1++ モデル: 並行性、リトライ、トレースの正確性

現実世界の障害モード（非アトミック更新、リトライ、メッセージのファンアウト）に関する忠実度を高める後続モデルです。

### ペアリングストアの並行性と冪等性

**主張:** ペアリングストアは、インターリーブ下でも `MaxPending` と冪等性を強制します。check-then-write はアトミック/ロック済みでなければならず、refresh は重複を作成してはなりません。具体的には、並行リクエストはチャネルの `MaxPending` を超えることができず、同じ `(channel, sender)` に対する繰り返しリクエスト/refresh は重複するライブ保留行を作成しません。

| 結果           | ターゲット                                                                                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Green          | `make pairing-race`（アトミック/ロック済みの上限チェック）, `make pairing-idempotency`, `make pairing-refresh`, `make pairing-refresh-race`                                |
| Red（想定） | `make pairing-race-negative`（非アトミックな begin/commit の上限競合）, `make pairing-idempotency-negative`, `make pairing-refresh-negative`, `make pairing-refresh-race-negative` |

### Ingress トレース相関と冪等性

**主張:** 取り込みはファンアウト全体でトレース相関を保持し、プロバイダーのリトライ下で冪等です。1 つの外部イベントが複数の内部メッセージになる場合、すべての部分が同じトレース/イベント ID を保持します。リトライは二重処理されません。プロバイダーイベント ID が欠落している場合、重複排除は（たとえばトレース ID のような）安全なキーにフォールバックし、別個のイベントを誤って削除しないようにします。

| 結果           | ターゲット                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Green          | `make ingress-trace`, `make ingress-trace2`, `make ingress-idempotency`, `make ingress-dedupe-fallback`                                     |
| Red（想定） | `make ingress-trace-negative`, `make ingress-trace2-negative`, `make ingress-idempotency-negative`, `make ingress-dedupe-fallback-negative` |

### ルーティング dmScope 優先順位と identityLinks

**主張:** ルーティングはデフォルトで DM セッションを分離し、明示的に設定された場合にのみ、チャネル優先順位と ID リンクを通じてセッションを統合します。チャネル固有の `dmScope` オーバーライドはグローバルデフォルトより優先されます。`identityLinks` は明示的にリンクされたグループ内でのみセッションを統合し、無関係なピア間では統合しません。

| 結果           | ターゲット                                                                |
| -------------- | ------------------------------------------------------------------------- |
| Green          | `make routing-precedence`, `make routing-identitylinks`                   |
| Red（想定） | `make routing-precedence-negative`, `make routing-identitylinks-negative` |

## 関連

- [脅威モデル](/ja-JP/security/THREAT-MODEL-ATLAS)
- [脅威モデルへの貢献](/ja-JP/security/CONTRIBUTING-THREAT-MODEL)
- [インシデント対応](/ja-JP/security/incident-response)

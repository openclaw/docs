---
permalink: /security/formal-verification/
read_when:
    - 形式的なセキュリティモデルの保証や限界を確認する
    - TLA+/TLC セキュリティモデルチェックの再現または更新
summary: OpenClaw の最もリスクの高いパス向けの機械検証済みセキュリティモデル。
title: 形式検証（セキュリティモデル）
x-i18n:
    generated_at: "2026-05-06T05:18:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 298b92f27abb8321be807fe4d95c7cd568a0fb8f543d168863b2adb9b3ddcde4
    source_path: security/formal-verification.md
    workflow: 16
    postprocess_version: locale-links-v1
---

このページは、OpenClaw の**形式的セキュリティモデル**（現時点では TLA+/TLC。必要に応じて追加）を追跡します。

> 注: 一部の古いリンクは以前のプロジェクト名を参照している場合があります。

**目標（北極星）:** 明示的な前提の下で、OpenClaw が意図したセキュリティポリシー（認可、セッション分離、ツールゲーティング、誤設定の安全性）を強制することについて、機械検証された論拠を提供する。

**これが（現時点で）何であるか:** 実行可能で、攻撃者主導の**セキュリティ回帰スイート**:

- 各主張には、有限状態空間に対する実行可能なモデルチェックがあります。
- 多くの主張には、現実的なバグクラスの反例トレースを生成する、対応する**否定モデル**があります。

**これが（まだ）何ではないか:** 「OpenClaw はあらゆる面でセキュアである」こと、または TypeScript 実装全体が正しいことの証明。

## モデルの場所

モデルは別リポジトリで保守されています: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models)。

## 重要な注意事項

- これらは**モデル**であり、TypeScript 実装全体ではありません。モデルとコードの間にずれが生じる可能性があります。
- 結果は TLC が探索した状態空間によって制限されます。「グリーン」は、モデル化された前提と境界を超えたセキュリティを意味しません。
- 一部の主張は、明示的な環境前提（例: 正しいデプロイ、正しい設定入力）に依存します。

## 結果の再現

現時点では、結果はモデルリポジトリをローカルにクローンし、TLC を実行することで再現します（下記参照）。将来の反復では、以下を提供できる可能性があります:

- 公開アーティファクト（反例トレース、実行ログ）付きの CI 実行モデル
- 小さく有界なチェック向けのホスト型「このモデルを実行」ワークフロー

はじめに:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ required (TLC runs on the JVM).
# The repo vendors a pinned `tla2tools.jar` (TLA+ tools) and provides `bin/tlc` + Make targets.

make <target>
```

### Gateway の公開とオープン Gateway の誤設定

**主張:** 認証なしでループバックを超えてバインドすると、リモート侵害が可能になる、または公開範囲が増加する可能性がある。トークン/パスワードは未認証の攻撃者をブロックする（モデルの前提に従う）。

- グリーン実行:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- レッド（想定どおり）:
  - `make gateway-exposure-v2-negative`

関連も参照: モデルリポジトリ内の `docs/gateway-exposure-matrix.md`。

### Node 実行パイプライン（最もリスクの高い機能）

**主張:** `exec host=node` には、(a) node コマンドの許可リストと宣言済みコマンド、(b) 設定時のライブ承認が必要です。承認は（モデル内で）リプレイを防ぐためにトークン化されます。

- グリーン実行:
  - `make nodes-pipeline`
  - `make approvals-token`
- レッド（想定どおり）:
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### ペアリングストア（DM ゲーティング）

**主張:** ペアリング要求は TTL と保留中要求の上限を尊重します。

- グリーン実行:
  - `make pairing`
  - `make pairing-cap`
- レッド（想定どおり）:
  - `make pairing-negative`
  - `make pairing-cap-negative`

### 受信ゲーティング（メンション + 制御コマンドのバイパス）

**主張:** メンションを必要とするグループコンテキストでは、認可されていない「制御コマンド」はメンションゲーティングをバイパスできません。

- グリーン:
  - `make ingress-gating`
- レッド（想定どおり）:
  - `make ingress-gating-negative`

### ルーティング/セッションキー分離

**主張:** 明示的にリンク/設定されていない限り、異なるピアからの DM は同じセッションにまとめられません。

- グリーン:
  - `make routing-isolation`
- レッド（想定どおり）:
  - `make routing-isolation-negative`

## v1++: 追加の有界モデル（並行性、リトライ、トレースの正しさ）

これらは、現実世界の障害モード（非アトミック更新、リトライ、メッセージのファンアウト）に関する忠実度を高める後続モデルです。

### ペアリングストアの並行性 / 冪等性

**主張:** ペアリングストアは、インターリーブの下でも `MaxPending` と冪等性を強制する必要があります（つまり、「チェックしてから書き込む」はアトミックまたはロック済みでなければならず、更新によって重複が作成されてはいけません）。

意味すること:

- 並行要求の下でも、チャネルの `MaxPending` を超えることはできません。
- 同じ `(channel, sender)` に対する繰り返し要求/更新は、重複するライブの保留行を作成してはいけません。

- グリーン実行:
  - `make pairing-race`（アトミック/ロック済みの上限チェック）
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- レッド（想定どおり）:
  - `make pairing-race-negative`（非アトミックな begin/commit 上限競合）
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### 受信トレース相関 / 冪等性

**主張:** 取り込みでは、ファンアウト全体でトレース相関を保持し、プロバイダーのリトライに対して冪等である必要があります。

意味すること:

- 1 つの外部イベントが複数の内部メッセージになる場合、すべての部分が同じトレース/イベント ID を保持します。
- リトライによって二重処理が発生しません。
- プロバイダーのイベント ID が欠落している場合、重複排除は安全なキー（例: トレース ID）にフォールバックし、異なるイベントを削除しないようにします。

- グリーン:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- レッド（想定どおり）:
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### ルーティング dmScope の優先順位 + identityLinks

**主張:** ルーティングはデフォルトで DM セッションを分離し、明示的に設定された場合（チャネルの優先順位 + ID リンク）にのみセッションをまとめる必要があります。

意味すること:

- チャネル固有の dmScope オーバーライドは、グローバル既定値より優先される必要があります。
- identityLinks は、明示的にリンクされたグループ内でのみまとめるべきで、無関係なピア間でまとめてはいけません。

- グリーン:
  - `make routing-precedence`
  - `make routing-identitylinks`
- レッド（想定どおり）:
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## 関連

- [脅威モデル](/ja-JP/security/THREAT-MODEL-ATLAS)
- [脅威モデルへの貢献](/ja-JP/security/CONTRIBUTING-THREAT-MODEL)

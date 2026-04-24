---
permalink: /security/formal-verification/
read_when:
    - 形式的セキュリティモデルの保証や限界を確認すること
    - TLA+/TLC セキュリティモデルチェックを再現または更新すること
summary: OpenClaw の最高リスク経路に対する機械検証済みセキュリティモデル。
title: 形式検証（セキュリティモデル）
x-i18n:
    generated_at: "2026-04-24T05:20:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f50fa9118a80054b8d556cd4f1901b2d5fcb37fb0866bd5357a1b0a46c74116
    source_path: security/formal-verification.md
    workflow: 15
---

このページでは、OpenClaw の**形式的セキュリティモデル**（現時点では TLA+/TLC。必要に応じて追加）を追跡します。

> 注: 古いリンクの中には、以前のプロジェクト名を参照しているものがあります。

**目標（北極星）:** OpenClaw が、明示された仮定の下で、
意図したセキュリティポリシー（認可、セッション分離、tool ゲーティング、設定ミスに対する安全性）を強制していることを、
機械検証された形で主張できるようにすること。

**現時点でこれが何であるか:** 実行可能で、攻撃者駆動の**セキュリティ回帰スイート**です。

- 各主張には、有限状態空間に対する実行可能なモデルチェックがあります。
- 多くの主張には、現実的なバグクラスに対する反例トレースを生成する対応する**ネガティブモデル**があります。

**まだこれではないもの:** 「OpenClaw があらゆる点で安全である」という証明でも、TypeScript 実装全体が正しいという証明でもありません。

## モデルの場所

モデルは別リポジトリで管理されています: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models)。

## 重要な注意事項

- これらは完全な TypeScript 実装ではなく**モデル**です。モデルとコードの乖離は起こりえます。
- 結果は TLC が探索した状態空間に制約されます。「green」であっても、モデル化された仮定と範囲を超えた安全性を意味しません。
- 一部の主張は、明示的な環境上の仮定（たとえば正しいデプロイ、正しい設定入力）に依存します。

## 結果の再現

現時点では、結果は models リポジトリをローカルに clone し、TLC を実行することで再現します（下記参照）。将来的には次のようなものが考えられます。

- 公開 artifact（反例トレース、実行ログ）付きの CI 実行モデル
- 小規模で範囲が限定されたチェック向けの、ホスト型「このモデルを実行する」ワークフロー

はじめに:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ が必要です（TLC は JVM 上で動作します）。
# このリポジトリには固定版の `tla2tools.jar`（TLA+ tools）が含まれ、`bin/tlc` と Make target が提供されています。

make <target>
```

### Gateway 公開と open gateway 設定ミス

**主張:** loopback を超えて auth なしで bind すると、リモート侵害が可能になったり、露出が増えたりします。token/password は、モデルの仮定の下で unauth 攻撃者をブロックします。

- Green 実行:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Red（期待どおり）:
  - `make gateway-exposure-v2-negative`

models リポジトリ内の `docs/gateway-exposure-matrix.md` も参照してください。

### Node exec パイプライン（最高リスク capability）

**主張:** `exec host=node` には、(a) Node command allowlist と declared command、(b) 設定されている場合はライブ承認、が必要です。承認はリプレイ防止のためモデル内で token 化されています。

- Green 実行:
  - `make nodes-pipeline`
  - `make approvals-token`
- Red（期待どおり）:
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### ペアリングストア（DM ゲーティング）

**主張:** ペアリングリクエストは TTL と pending-request cap を尊重します。

- Green 実行:
  - `make pairing`
  - `make pairing-cap`
- Red（期待どおり）:
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Ingress ゲーティング（mention + control-command バイパス）

**主張:** mention 必須の group コンテキストでは、認可されていない「control command」が mention ゲーティングをバイパスすることはできません。

- Green:
  - `make ingress-gating`
- Red（期待どおり）:
  - `make ingress-gating-negative`

### ルーティング/セッションキー分離

**主張:** 別々の peer からの DM は、明示的にリンクまたは設定されていない限り、同じセッションに集約されません。

- Green:
  - `make routing-isolation`
- Red（期待どおり）:
  - `make routing-isolation-negative`

## v1++: 追加の範囲限定モデル（並行性、再試行、トレース正確性）

これらは、現実世界の障害モード（非アトミック更新、再試行、メッセージ fan-out）に対する忠実度を高める追加モデルです。

### ペアリングストアの並行性 / 冪等性

**主張:** ペアリングストアは、並行実行下でも `MaxPending` と冪等性を強制すべきです（つまり「check-then-write」はアトミック / ロックされていなければならず、refresh は重複を作ってはいけない）。

意味すること:

- 並行リクエスト下で、チャンネルごとの `MaxPending` を超えられない。
- 同じ `(channel, sender)` に対する繰り返しリクエスト/refresh は、重複した live pending 行を作ってはならない。

- Green 実行:
  - `make pairing-race`（アトミック/ロックされた cap check）
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Red（期待どおり）:
  - `make pairing-race-negative`（非アトミックな begin/commit cap race）
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Ingress トレース相関 / 冪等性

**主張:** ingest は fan-out をまたいでトレース相関を保持し、provider の再試行下でも冪等であるべきです。

意味すること:

- 1 つの外部 event が複数の内部メッセージになる場合、そのすべての部分が同じ trace/event identity を保持する。
- 再試行で二重処理が起きない。
- provider event ID が欠けている場合、distinct な event を落とさないよう、dedupe は安全なキー（たとえば trace ID）にフォールバックする。

- Green:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- Red（期待どおり）:
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### ルーティング dmScope 優先順位 + identityLinks

**主張:** ルーティングはデフォルトで DM セッションを分離し、明示的に設定された場合にのみセッションを集約しなければなりません（channel 優先順位 + identity link）。

意味すること:

- channel 固有の dmScope 上書きは、グローバルデフォルトより優先されなければならない。
- identityLinks は、無関係な peer 間ではなく、明示的にリンクされたグループ内でのみセッションを集約すべきです。

- Green:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Red（期待どおり）:
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## 関連

- [Threat model](/ja-JP/security/THREAT-MODEL-ATLAS)
- [Contributing to the threat model](/ja-JP/security/CONTRIBUTING-THREAT-MODEL)

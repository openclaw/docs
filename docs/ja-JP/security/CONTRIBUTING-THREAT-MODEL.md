---
read_when:
    - セキュリティ上の発見事項や脅威シナリオを提供したい場合
    - 脅威モデルをレビューまたは更新する場合
summary: OpenClaw の脅威モデルに貢献する方法
title: 脅威モデルへの貢献
x-i18n:
    generated_at: "2026-04-24T05:20:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 21cf130c2d8641b66b87de86a3ea718cd7c751c29ed9bf5e0bd76b43d65d0964
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 15
---

# OpenClaw 脅威モデルへの貢献

OpenClaw をより安全にするための協力に感謝します。この脅威モデルは生きたドキュメントであり、セキュリティの専門家でなくても、誰からの貢献でも歓迎します。

## 貢献の方法

### 脅威を追加する

まだカバーしていない攻撃ベクトルやリスクを見つけましたか。 [openclaw/trust](https://github.com/openclaw/trust/issues) に issue を作成し、自分の言葉で説明してください。フレームワークを知っていたり、すべての項目を埋められたりする必要はありません。シナリオを説明するだけで大丈夫です。

**あると助かる情報（必須ではありません）:**

- 攻撃シナリオと、それがどのように悪用され得るか
- 影響を受ける OpenClaw の部分（CLI、gateway、channels、ClawHub、MCP servers など）
- 重大度の見立て（low / medium / high / critical）
- 関連する研究、CVE、実例へのリンク

ATLAS へのマッピング、脅威 ID、リスク評価はレビュー時にこちらで処理します。そうした詳細を含めたい場合はもちろん歓迎ですが、期待されているわけではありません。

> **これは脅威モデルへの追加のためのものであり、実際の脆弱性報告のためのものではありません。** 悪用可能な脆弱性を見つけた場合は、責任ある開示手順について [Trust page](https://trust.openclaw.ai) を参照してください。

### 緩和策を提案する

既存の脅威に対処するアイデアがありますか。その脅威を参照した issue または PR を開いてください。有用な緩和策は具体的で実行可能なものです。たとえば「rate limiting を実装する」よりも、「gateway で送信者ごとに 1 分あたり 10 メッセージの rate limiting」を行う、のほうが良いです。

### 攻撃チェーンを提案する

攻撃チェーンは、複数の脅威がどのように組み合わさって現実的な攻撃シナリオになるかを示します。危険な組み合わせが見えたら、その手順と攻撃者がどう連鎖させるかを説明してください。形式的なテンプレートよりも、実際に攻撃がどう展開するかの短いナラティブのほうが価値があります。

### 既存コンテンツを修正または改善する

typo、説明の明確化、古い情報、より良い例など — PR を歓迎します。issue は不要です。

## 私たちが使っているもの

### MITRE ATLAS

この脅威モデルは [MITRE ATLAS](https://atlas.mitre.org/)（Adversarial Threat Landscape for AI Systems）に基づいています。これは prompt injection、tool misuse、agent exploitation のような AI/ML 脅威向けに特別に設計されたフレームワークです。貢献するのに ATLAS を知っている必要はありません。提出内容はレビュー中にこちらでフレームワークへマッピングします。

### 脅威 ID

各脅威には `T-EXEC-003` のような ID が付きます。カテゴリは次のとおりです。

| Code    | Category                                   |
| ------- | ------------------------------------------ |
| RECON   | Reconnaissance - 情報収集     |
| ACCESS  | Initial access - 侵入             |
| EXEC    | Execution - 悪意ある動作の実行      |
| PERSIST | Persistence - アクセスの維持           |
| EVADE   | Defense evasion - 検知回避       |
| DISC    | Discovery - 環境の把握 |
| EXFIL   | Exfiltration - データの窃取               |
| IMPACT  | Impact - 破壊または妨害              |

ID はレビュー時にメンテナーが割り当てます。自分で選ぶ必要はありません。

### リスクレベル

| Level        | Meaning                                                           |
| ------------ | ----------------------------------------------------------------- |
| **Critical** | システム全体の完全侵害、または高い可能性 + 重大な影響      |
| **High**     | 大きな被害が起こりやすい、または中程度の可能性 + 重大な影響 |
| **Medium**   | 中程度のリスク、または低い可能性 + 高い影響                    |
| **Low**      | 可能性が低く、影響も限定的                                       |

リスクレベルに自信がない場合は、影響だけを説明してください。こちらで評価します。

## レビュープロセス

1. **Triage** - 新しい提出は 48 時間以内にレビューします
2. **Assessment** - 実現可能性を確認し、ATLAS マッピングと脅威 ID を割り当て、リスクレベルを検証します
3. **Documentation** - フォーマットと内容が完全であることを確認します
4. **Merge** - 脅威モデルと可視化に追加します

## リソース

- [ATLAS Website](https://atlas.mitre.org/)
- [ATLAS Techniques](https://atlas.mitre.org/techniques/)
- [ATLAS Case Studies](https://atlas.mitre.org/studies/)
- [OpenClaw Threat Model](/ja-JP/security/THREAT-MODEL-ATLAS)

## 連絡先

- **セキュリティ脆弱性:** 報告手順については [Trust page](https://trust.openclaw.ai) を参照してください
- **脅威モデルに関する質問:** [openclaw/trust](https://github.com/openclaw/trust/issues) に issue を作成してください
- **一般的な会話:** Discord の #security channel

## 謝辞

脅威モデルへの貢献者は、重要な貢献に対して、脅威モデルの謝辞、リリースノート、および OpenClaw security hall of fame で認識されます。

## 関連

- [Threat model](/ja-JP/security/THREAT-MODEL-ATLAS)
- [Formal verification](/ja-JP/security/formal-verification)

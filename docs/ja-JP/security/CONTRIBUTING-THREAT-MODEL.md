---
read_when:
    - セキュリティ上の発見事項や脅威シナリオを提供したい
    - 脅威モデルのレビューまたは更新
summary: OpenClaw 脅威モデルへのコントリビュート方法
title: 脅威モデルへの貢献
x-i18n:
    generated_at: "2026-07-05T11:46:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e2e5cd95e8a2bf5ee4bd167afedfadf9aa876e4260e2d0bfb5f414cd4255410
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
---

[脅威モデル](/ja-JP/security/THREAT-MODEL-ATLAS)は継続的に更新されるドキュメントです。誰でも貢献できます。セキュリティやMITRE ATLASの背景知識は必要ありません。

<Note>
これは脅威モデルへの追加用であり、実際の脆弱性を報告するためのものではありません。悪用可能な脆弱性を見つけた場合は、代わりに[Trustページ](https://trust.openclaw.ai)の責任ある開示手順に従ってください。
</Note>

## 貢献方法

**脅威を追加する。** [openclaw/trust](https://github.com/openclaw/trust/issues)でissueを開き、攻撃シナリオを自分の言葉で説明してください。以下は役立ちますが必須ではありません。

- 攻撃シナリオと、それがどのように悪用され得るか。
- 影響を受けるコンポーネント（CLI、Gateway、チャネル、ClawHub、MCPサーバーなど）。
- 深刻度の見積もり（低 / 中 / 高 / 重大）。
- 関連する研究、CVE、または実世界の例へのリンク。

メンテナーはレビュー中にATLASマッピング、脅威ID、リスクレベルを割り当てます。

**緩和策を提案する。** その脅威を参照するissueまたはPRを開いてください。具体的で実行可能にしてください。「Gatewayで送信者ごとに10 messages/minuteのレート制限を行う」は、「レート制限を実装する」よりも有用です。

**攻撃チェーンを提案する。** 攻撃チェーンは、複数の脅威がどのように組み合わさって現実的なシナリオになるかを示します。手順と、攻撃者がそれらをどのように連鎖させるかを説明してください。短い物語形式の説明のほうが、正式なテンプレートよりも有効です。

**既存コンテンツを修正または改善する。** 誤字、明確化、古い情報、より良い例など: PRを歓迎します。issueは不要です。

## フレームワーク参照

脅威は、プロンプトインジェクション、ツールの誤用、エージェントの悪用など、AI/ML固有の脅威のためのフレームワークである[MITRE ATLAS](https://atlas.mitre.org/)（Adversarial Threat Landscape for AI Systems）にマッピングされます。貢献するためにATLASを知っている必要はありません。メンテナーがレビュー中に提出内容をマッピングします。

**脅威ID。** 各脅威には`T-EXEC-003`のようなIDが付与され、レビュー中にメンテナーが割り当てます。

| コード  | カテゴリ                                   |
| ------- | ------------------------------------------ |
| RECON   | 偵察 - 情報収集                            |
| ACCESS  | 初期アクセス - 侵入の獲得                  |
| EXEC    | 実行 - 悪意あるアクションの実行            |
| PERSIST | 永続化 - アクセスの維持                    |
| EVADE   | 防御回避 - 検出の回避                      |
| DISC    | 発見 - 環境についての把握                  |
| EXFIL   | 流出 - データの窃取                        |
| IMPACT  | 影響 - 損害または妨害                      |

**リスクレベル。** レベルがわからない場合は、影響を説明するだけでかまいません。メンテナーが評価します。

| レベル     | 意味                                                          |
| ---------- | ------------------------------------------------------------- |
| **重大**   | システム全体の侵害、または高い可能性 + 重大な影響             |
| **高**     | 重大な損害が発生する可能性が高い、または中程度の可能性 + 重大な影響 |
| **中**     | 中程度のリスク、または低い可能性 + 高い影響                   |
| **低**     | 発生可能性が低く、影響が限定的                                |

## レビュープロセス

1. **トリアージ** - 新しい提出は48時間以内にレビューされます。
2. **評価** - メンテナーが実現可能性を検証し、ATLASマッピングと脅威IDを割り当て、リスクレベルを検証します。
3. **ドキュメント化** - フォーマットと完全性を確認します。
4. **マージ** - 脅威モデルと可視化に追加されます。

## リソース

- [ATLASウェブサイト](https://atlas.mitre.org/)
- [ATLASテクニック](https://atlas.mitre.org/techniques/)
- [ATLASケーススタディ](https://atlas.mitre.org/studies/)

## 連絡先

- **セキュリティ脆弱性:** 報告手順は[Trustページ](https://trust.openclaw.ai)、または`security@openclaw.ai`。
- **脅威モデルに関する質問:** [openclaw/trust](https://github.com/openclaw/trust/issues)でissueを開いてください。
- **一般チャット:** Discordの`#security`チャネル。

## 表彰

脅威モデルへの貢献者は、脅威モデルの謝辞、リリースノート、および重要な貢献に対するOpenClawセキュリティ殿堂で表彰されます。

## 関連

- [脅威モデル](/ja-JP/security/THREAT-MODEL-ATLAS)
- [インシデント対応](/ja-JP/security/incident-response)
- [形式検証](/ja-JP/security/formal-verification)

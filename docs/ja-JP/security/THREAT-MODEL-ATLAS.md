---
read_when:
    - セキュリティ態勢や脅威シナリオを見直している場合
    - セキュリティ機能や監査対応に取り組んでいる場合
summary: MITRE ATLAS フレームワークに対応付けた OpenClaw の脅威モデル
title: 脅威モデル（MITRE ATLAS）
x-i18n:
    generated_at: "2026-04-24T05:20:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: e628bf60015a76d3015a7aab7b51649bdcfd2e99db148368e580839db16d2342
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 15
---

# OpenClaw 脅威モデル v1.0

## MITRE ATLAS フレームワーク

**バージョン:** 1.0-draft
**最終更新:** 2026-02-04
**手法:** MITRE ATLAS + データフロー図
**フレームワーク:** [MITRE ATLAS](https://atlas.mitre.org/)（Adversarial Threat Landscape for AI Systems）

### フレームワークの出典

この脅威モデルは、AI / ML システムに対する敵対的脅威を文書化するための業界標準フレームワークである [MITRE ATLAS](https://atlas.mitre.org/) に基づいています。ATLAS は [MITRE](https://www.mitre.org/) が AI セキュリティコミュニティと協力して保守しています。

**主要な ATLAS リソース:**

- [ATLAS Techniques](https://atlas.mitre.org/techniques/)
- [ATLAS Tactics](https://atlas.mitre.org/tactics/)
- [ATLAS Case Studies](https://atlas.mitre.org/studies/)
- [ATLAS GitHub](https://github.com/mitre-atlas/atlas-data)
- [Contributing to ATLAS](https://atlas.mitre.org/resources/contribute)

### この脅威モデルへのコントリビュート

これは OpenClaw コミュニティによって保守される生きたドキュメントです。コントリビュートのガイドラインは [CONTRIBUTING-THREAT-MODEL.md](/ja-JP/security/CONTRIBUTING-THREAT-MODEL) を参照してください:

- 新しい脅威の報告
- 既存脅威の更新
- 攻撃チェーンの提案
- 緩和策の提案

---

## 1. はじめに

### 1.1 目的

この脅威モデルは、AI / ML システム向けに特化して設計された MITRE ATLAS フレームワークを用いて、OpenClaw AI agent platform と ClawHub skill marketplace に対する敵対的脅威を文書化します。

### 1.2 スコープ

| コンポーネント           | 対象 | 注記                                            |
| ------------------------ | ---- | ----------------------------------------------- |
| OpenClaw Agent Runtime   | Yes  | コア agent 実行、tool call、セッション         |
| Gateway                  | Yes  | 認証、ルーティング、チャネル統合                |
| Channel Integrations     | Yes  | WhatsApp, Telegram, Discord, Signal, Slack など |
| ClawHub Marketplace      | Yes  | Skill 公開、モデレーション、配布                |
| MCP Servers              | Yes  | 外部ツールプロバイダ                            |
| User Devices             | Partial | モバイルアプリ、デスクトップクライアント     |

### 1.3 スコープ外

この脅威モデルでは、明示的にスコープ外とされるものはありません。

---

## 2. システムアーキテクチャ

### 2.1 信頼境界

```
┌─────────────────────────────────────────────────────────────────┐
│                    非信頼ゾーン                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 信頼境界 1: チャネルアクセス                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • デバイスペアリング（DM 1h / node 猶予期間 5m）         │   │
│  │  • AllowFrom / AllowList 検証                           │   │
│  │  • Token / Password / Tailscale 認証                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 信頼境界 2: セッション分離                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   AGENT SESSIONS                          │   │
│  │  • Session key = agent:channel:peer                       │   │
│  │  • エージェントごとのツールポリシー                       │   │
│  │  • Transcript logging                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 信頼境界 3: ツール実行                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  実行 sandbox                             │   │
│  │  • Docker sandbox または Host（exec-approvals）          │   │
│  │  • Node リモート実行                                      │   │
│  │  • SSRF 保護（DNS pinning + IP blocking）                │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 信頼境界 4: 外部コンテンツ                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              取得された URL / EMAIL / WEBHOOK            │   │
│  │  • 外部コンテンツラップ（XML タグ）                       │   │
│  │  • セキュリティ通知の注入                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 信頼境界 5: サプライチェーン                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Skill 公開（semver、SKILL.md 必須）                   │   │
│  │  • パターンベースのモデレーションフラグ                   │   │
│  │  • VirusTotal スキャン（近日対応）                        │   │
│  │  • GitHub アカウント年齢確認                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 データフロー

| フロー | ソース  | 宛先        | データ               | 保護                 |
| ------ | ------- | ----------- | -------------------- | -------------------- |
| F1     | Channel | Gateway     | ユーザーメッセージ   | TLS, AllowFrom       |
| F2     | Gateway | Agent       | ルーティング済みメッセージ | セッション分離   |
| F3     | Agent   | Tools       | ツール呼び出し       | ポリシー強制         |
| F4     | Agent   | External    | web_fetch リクエスト | SSRF blocking        |
| F5     | ClawHub | Agent       | Skill コード         | モデレーション、スキャン |
| F6     | Agent   | Channel     | 応答                 | 出力フィルタリング   |

---

## 3. ATLAS tactic ごとの脅威分析

### 3.1 Reconnaissance (AML.TA0002)

#### T-RECON-001: Agent エンドポイント検出

| 属性                    | 値                                                                   |
| ----------------------- | -------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0006 - Active Scanning                                          |
| **説明**                | 攻撃者が公開された OpenClaw gateway エンドポイントをスキャンする     |
| **攻撃ベクトル**        | ネットワークスキャン、shodan クエリ、DNS 列挙                        |
| **影響コンポーネント**  | Gateway、公開 API エンドポイント                                     |
| **現在の緩和策**        | Tailscale 認証オプション、デフォルトで loopback に bind              |
| **残留リスク**          | Medium - 公開 gateway は発見可能                                     |
| **推奨事項**            | 安全なデプロイを文書化し、discovery エンドポイントにレート制限を追加 |

#### T-RECON-002: チャネル統合の探索

| 属性                    | 値                                                               |
| ----------------------- | ---------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0006 - Active Scanning                                      |
| **説明**                | 攻撃者がメッセージングチャネルを探索し、AI 管理アカウントを特定する |
| **攻撃ベクトル**        | テストメッセージ送信、応答パターン観察                           |
| **影響コンポーネント**  | すべてのチャネル統合                                             |
| **現在の緩和策**        | 特になし                                                         |
| **残留リスク**          | Low - 発見だけでは得られる価値が限定的                           |
| **推奨事項**            | 応答タイミングのランダム化を検討する                             |

---

### 3.2 Initial Access (AML.TA0004)

#### T-ACCESS-001: ペアリングコードの傍受

| 属性                    | 値                                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0040 - AI Model Inference API Access                                                                      |
| **説明**                | 攻撃者がペアリング猶予期間中にペアリングコードを傍受する（DM チャネルペアリングで 1h、node ペアリングで 5m） |
| **攻撃ベクトル**        | 肩越しの覗き見、ネットワーク盗聴、ソーシャルエンジニアリング                                                   |
| **影響コンポーネント**  | デバイスペアリングシステム                                                                                     |
| **現在の緩和策**        | 1h 失効（DM pairing）/ 5m 失効（node pairing）、既存チャネル経由でコード送信                                  |
| **残留リスク**          | Medium - 猶予期間が悪用可能                                                                                    |
| **推奨事項**            | 猶予期間を短縮し、確認ステップを追加する                                                                       |

#### T-ACCESS-002: AllowFrom なりすまし

| 属性                    | 値                                                                           |
| ----------------------- | ---------------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0040 - AI Model Inference API Access                                    |
| **説明**                | 攻撃者がチャネル内で許可済み送信者 ID をなりすます                           |
| **攻撃ベクトル**        | チャネル依存 — 電話番号 spoofing、username impersonation                     |
| **影響コンポーネント**  | チャネルごとの AllowFrom 検証                                                |
| **現在の緩和策**        | チャネル固有の ID 検証                                                       |
| **残留リスク**          | Medium - 一部チャネルは spoofing に脆弱                                      |
| **推奨事項**            | チャネルごとのリスクを文書化し、可能な場合は暗号学的検証を追加する           |

#### T-ACCESS-003: Token 窃取

| 属性                    | 値                                                          |
| ----------------------- | ----------------------------------------------------------- |
| **ATLAS ID**            | AML.T0040 - AI Model Inference API Access                   |
| **説明**                | 攻撃者が設定ファイルから認証 token を盗む                   |
| **攻撃ベクトル**        | マルウェア、不正デバイスアクセス、設定バックアップの露出    |
| **影響コンポーネント**  | `~/.openclaw/credentials/`, config ストレージ               |
| **現在の緩和策**        | ファイル権限                                                |
| **残留リスク**          | High - token が平文保存されている                           |
| **推奨事項**            | 保存時 token 暗号化を実装し、token rotation を追加する      |

---

### 3.3 Execution (AML.TA0005)

#### T-EXEC-001: 直接プロンプトインジェクション

| 属性                    | 値                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0051.000 - LLM Prompt Injection: Direct                                                |
| **説明**                | 攻撃者が crafted prompt を送信して agent の動作を操作する                                  |
| **攻撃ベクトル**        | 敵対的な指示を含むチャネルメッセージ                                                        |
| **影響コンポーネント**  | Agent LLM、すべての入力面                                                                   |
| **現在の緩和策**        | パターン検出、外部コンテンツラップ                                                          |
| **残留リスク**          | Critical - 検出のみでブロックしない。高度な攻撃は容易に回避できる                          |
| **推奨事項**            | 多層防御、出力検証、機微な操作へのユーザー確認を実装する                                   |

#### T-EXEC-002: 間接プロンプトインジェクション

| 属性                    | 値                                                          |
| ----------------------- | ----------------------------------------------------------- |
| **ATLAS ID**            | AML.T0051.001 - LLM Prompt Injection: Indirect              |
| **説明**                | 攻撃者が取得コンテンツ内に悪意ある指示を埋め込む            |
| **攻撃ベクトル**        | 悪意ある URL、汚染された email、侵害された Webhook          |
| **影響コンポーネント**  | web_fetch、email ingestion、外部データソース                |
| **現在の緩和策**        | XML タグとセキュリティ通知によるコンテンツラップ            |
| **残留リスク**          | High - LLM が wrapper 指示を無視する可能性がある            |
| **推奨事項**            | コンテンツ sanitization と実行コンテキスト分離を実装する    |

#### T-EXEC-003: ツール引数インジェクション

| 属性                    | 値                                                           |
| ----------------------- | ------------------------------------------------------------ |
| **ATLAS ID**            | AML.T0051.000 - LLM Prompt Injection: Direct                 |
| **説明**                | 攻撃者がプロンプトインジェクションを通じてツール引数を操作する |
| **攻撃ベクトル**        | ツールパラメータ値に影響する crafted prompt                  |
| **影響コンポーネント**  | すべてのツール呼び出し                                       |
| **現在の緩和策**        | 危険コマンドに対する exec 承認                               |
| **残留リスク**          | High - ユーザー判断に依存                                    |
| **推奨事項**            | 引数検証と parameterized tool call を実装する                |

#### T-EXEC-004: Exec 承認バイパス

| 属性                    | 値                                                           |
| ----------------------- | ------------------------------------------------------------ |
| **ATLAS ID**            | AML.T0043 - Craft Adversarial Data                           |
| **説明**                | 攻撃者が承認 allowlist を回避するコマンドを作成する          |
| **攻撃ベクトル**        | コマンド難読化、alias 悪用、path 操作                        |
| **影響コンポーネント**  | exec-approvals.ts, command allowlist                         |
| **現在の緩和策**        | allowlist + ask mode                                         |
| **残留リスク**          | High - コマンド sanitization がない                          |
| **推奨事項**            | コマンド正規化を実装し、blocklist を拡張する                 |

---

### 3.4 Persistence (AML.TA0006)

#### T-PERSIST-001: 悪意ある Skill のインストール

| 属性                    | 値                                                                     |
| ----------------------- | ---------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0010.001 - Supply Chain Compromise: AI Software                   |
| **説明**                | 攻撃者が ClawHub に悪意ある skill を公開する                           |
| **攻撃ベクトル**        | アカウント作成、隠れた悪意あるコードを含む skill の公開                |
| **影響コンポーネント**  | ClawHub, skill loading, agent execution                                |
| **現在の緩和策**        | GitHub アカウント年齢確認、パターンベースのモデレーションフラグ        |
| **残留リスク**          | Critical - sandboxing なし、レビュー限定的                             |
| **推奨事項**            | VirusTotal 統合（進行中）、skill sandboxing、コミュニティレビュー      |

#### T-PERSIST-002: Skill 更新汚染

| 属性                    | 値                                                           |
| ----------------------- | ------------------------------------------------------------ |
| **ATLAS ID**            | AML.T0010.001 - Supply Chain Compromise: AI Software         |
| **説明**                | 攻撃者が人気 skill を侵害し、悪意ある更新を push する        |
| **攻撃ベクトル**        | アカウント侵害、skill 所有者へのソーシャルエンジニアリング   |
| **影響コンポーネント**  | ClawHub versioning, auto-update flows                        |
| **現在の緩和策**        | バージョン fingerprinting                                    |
| **残留リスク**          | High - 自動更新で悪意あるバージョンを取得し得る              |
| **推奨事項**            | 更新署名、rollback 機能、version pinning を実装する          |

#### T-PERSIST-003: Agent 設定改ざん

| 属性                    | 値                                                           |
| ----------------------- | ------------------------------------------------------------ |
| **ATLAS ID**            | AML.T0010.002 - Supply Chain Compromise: Data                |
| **説明**                | 攻撃者が agent 設定を変更してアクセスを永続化する            |
| **攻撃ベクトル**        | config ファイル変更、settings injection                      |
| **影響コンポーネント**  | Agent config、tool policies                                  |
| **現在の緩和策**        | ファイル権限                                                 |
| **残留リスク**          | Medium - ローカルアクセスが必要                              |
| **推奨事項**            | config integrity 検証と、config 変更の監査ログを実装する     |

---

### 3.5 Defense Evasion (AML.TA0007)

#### T-EVADE-001: モデレーションパターン回避

| 属性                    | 値                                                                   |
| ----------------------- | -------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0043 - Craft Adversarial Data                                   |
| **説明**                | 攻撃者がモデレーションパターンを回避する skill コンテンツを作成する  |
| **攻撃ベクトル**        | Unicode homoglyph、encoding トリック、dynamic loading                |
| **影響コンポーネント**  | ClawHub moderation.ts                                                |
| **現在の緩和策**        | パターンベースの `FLAG_RULES`                                        |
| **残留リスク**          | High - 単純 regex は容易に回避される                                 |
| **推奨事項**            | 振る舞い解析（VirusTotal Code Insight）と AST ベース検出を追加する   |

#### T-EVADE-002: コンテンツ wrapper 逸脱

| 属性                    | 値                                                          |
| ----------------------- | ----------------------------------------------------------- |
| **ATLAS ID**            | AML.T0043 - Craft Adversarial Data                          |
| **説明**                | 攻撃者が XML wrapper コンテキストを逸脱するコンテンツを作る |
| **攻撃ベクトル**        | タグ操作、コンテキスト混乱、指示上書き                      |
| **影響コンポーネント**  | 外部コンテンツラップ                                        |
| **現在の緩和策**        | XML タグ + セキュリティ通知                                 |
| **残留リスク**          | Medium - 新しい逸脱手法が定期的に見つかる                   |
| **推奨事項**            | 複数の wrapper 層と出力側検証                               |

---

### 3.6 Discovery (AML.TA0008)

#### T-DISC-001: ツール列挙

| 属性                    | 値                                                           |
| ----------------------- | ------------------------------------------------------------ |
| **ATLAS ID**            | AML.T0040 - AI Model Inference API Access                    |
| **説明**                | 攻撃者がプロンプトを通じて利用可能ツールを列挙する           |
| **攻撃ベクトル**        | 「どんなツールを持っていますか？」型のクエリ                 |
| **影響コンポーネント**  | Agent tool registry                                          |
| **現在の緩和策**        | 特になし                                                     |
| **残留リスク**          | Low - ツールは一般に文書化されている                         |
| **推奨事項**            | ツール可視性制御を検討する                                   |

#### T-DISC-002: セッションデータ抽出

| 属性                    | 値                                                           |
| ----------------------- | ------------------------------------------------------------ |
| **ATLAS ID**            | AML.T0040 - AI Model Inference API Access                    |
| **説明**                | 攻撃者がセッションコンテキストから機微データを抽出する       |
| **攻撃ベクトル**        | 「何を話しましたか？」型クエリ、コンテキスト探索             |
| **影響コンポーネント**  | セッショントランスクリプト、コンテキストウィンドウ           |
| **現在の緩和策**        | 送信者ごとのセッション分離                                   |
| **残留リスク**          | Medium - セッション内データにはアクセス可能                  |
| **推奨事項**            | コンテキスト内の機微データ秘匿化を実装する                   |

---

### 3.7 Collection & Exfiltration (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: web_fetch を使ったデータ窃取

| 属性                    | 値                                                                    |
| ----------------------- | --------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0009 - Collection                                                |
| **説明**                | 攻撃者が agent に外部 URL へ送信させることでデータを流出させる        |
| **攻撃ベクトル**        | prompt injection により agent が attacker サーバーへデータを POST する |
| **影響コンポーネント**  | web_fetch ツール                                                      |
| **現在の緩和策**        | 内部ネットワーク向け SSRF blocking                                    |
| **残留リスク**          | High - 外部 URL は許可されている                                      |
| **推奨事項**            | URL allowlist とデータ分類意識を実装する                              |

#### T-EXFIL-002: 不正メッセージ送信

| 属性                    | 値                                                                 |
| ----------------------- | ------------------------------------------------------------------ |
| **ATLAS ID**            | AML.T0009 - Collection                                             |
| **説明**                | 攻撃者が agent に機微データを含むメッセージを送らせる              |
| **攻撃ベクトル**        | prompt injection により agent が attacker へメッセージ送信         |
| **影響コンポーネント**  | Message ツール、チャネル統合                                       |
| **現在の緩和策**        | outbound messaging gating                                           |
| **残留リスク**          | Medium - gating が回避される可能性                                 |
| **推奨事項**            | 新規受信者には明示確認を要求する                                   |

#### T-EXFIL-003: 認証情報ハーベスティング

| 属性                    | 値                                                           |
| ----------------------- | ------------------------------------------------------------ |
| **ATLAS ID**            | AML.T0009 - Collection                                       |
| **説明**                | 悪意ある skill が agent コンテキストから認証情報を収集する   |
| **攻撃ベクトル**        | skill コードが環境変数や config ファイルを読む               |
| **影響コンポーネント**  | Skill 実行環境                                               |
| **現在の緩和策**        | skill に特化したものは特になし                               |
| **残留リスク**          | Critical - skill は agent 権限で実行される                   |
| **推奨事項**            | skill sandboxing と認証情報分離                              |

---

### 3.8 Impact (AML.TA0011)

#### T-IMPACT-001: 不正コマンド実行

| 属性                    | 値                                                           |
| ----------------------- | ------------------------------------------------------------ |
| **ATLAS ID**            | AML.T0031 - Erode AI Model Integrity                         |
| **説明**                | 攻撃者がユーザーシステム上で任意コマンドを実行する           |
| **攻撃ベクトル**        | prompt injection と exec approval bypass の組み合わせ        |
| **影響コンポーネント**  | Bash ツール、コマンド実行                                    |
| **現在の緩和策**        | Exec approvals、Docker sandbox オプション                    |
| **残留リスク**          | Critical - sandbox なしの host 実行                          |
| **推奨事項**            | sandbox をデフォルトにし、approval UX を改善する             |

#### T-IMPACT-002: リソース枯渇（DoS）

| 属性                    | 値                                                           |
| ----------------------- | ------------------------------------------------------------ |
| **ATLAS ID**            | AML.T0031 - Erode AI Model Integrity                         |
| **説明**                | 攻撃者が API クレジットや計算リソースを使い果たす            |
| **攻撃ベクトル**        | 自動メッセージ flood、高コストな tool call                   |
| **影響コンポーネント**  | Gateway、agent sessions、API provider                        |
| **現在の緩和策**        | なし                                                         |
| **残留リスク**          | High - レート制限がない                                      |
| **推奨事項**            | 送信者ごとのレート制限とコスト予算を実装する                 |

#### T-IMPACT-003: 評判の毀損

| 属性                    | 値                                                            |
| ----------------------- | ------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0031 - Erode AI Model Integrity                          |
| **説明**                | 攻撃者が agent に有害 / 攻撃的な内容を送信させる              |
| **攻撃ベクトル**        | prompt injection により不適切な応答を引き起こす               |
| **影響コンポーネント**  | 出力生成、チャネルメッセージング                              |
| **現在の緩和策**        | LLM provider のコンテンツポリシー                             |
| **残留リスク**          | Medium - provider filter は不完全                             |
| **推奨事項**            | 出力フィルタ層とユーザー制御を実装する                        |

---

## 4. ClawHub サプライチェーン分析

### 4.1 現在のセキュリティ制御

| 制御                    | 実装                        | 効果                                                              |
| ----------------------- | --------------------------- | ----------------------------------------------------------------- |
| GitHub アカウント年齢   | `requireGitHubAccountAge()` | Medium - 新規攻撃者のハードルを上げる                             |
| Path Sanitization       | `sanitizePath()`            | High - path traversal を防ぐ                                      |
| File Type Validation    | `isTextFile()`              | Medium - テキストファイルのみに限定するが、それでも悪意はあり得る |
| サイズ上限              | 合計 50MB bundle            | High - リソース枯渇を防ぐ                                         |
| 必須 SKILL.md           | 読み取り必須                | Low なセキュリティ価値 - 情報提供のみ                             |
| Pattern Moderation      | moderation.ts 内 `FLAG_RULES` | Low - 容易に回避される                                         |
| Moderation Status       | `moderationStatus` field    | Medium - 手動レビューが可能                                       |

### 4.2 モデレーションフラグパターン

`moderation.ts` 内の現在のパターン:

```javascript
// Known-bad identifiers
/(keepcold131\/ClawdAuthenticatorTool|ClawdAuthenticatorTool)/i

// Suspicious keywords
/(malware|stealer|phish|phishing|keylogger)/i
/(api[-_ ]?key|token|password|private key|secret)/i
/(wallet|seed phrase|mnemonic|crypto)/i
/(discord\.gg|webhook|hooks\.slack)/i
/(curl[^\n]+\|\s*(sh|bash))/i
/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd)/i
```

**制限事項:**

- slug, displayName, summary, frontmatter, metadata, file path しか見ていない
- 実際の skill コード内容は解析していない
- 単純 regex は難読化で容易に回避できる
- 振る舞い解析がない

### 4.3 計画中の改善

| 改善項目               | ステータス                                | 影響                                                              |
| ---------------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| VirusTotal 統合        | 進行中                                    | High - Code Insight による振る舞い解析                            |
| コミュニティ報告       | Partial（`skillReports` table は存在）    | Medium                                                            |
| 監査ログ               | Partial（`auditLogs` table は存在）       | Medium                                                            |
| バッジシステム         | 実装済み                                  | Medium - `highlighted`, `official`, `deprecated`, `redactionApproved` |

---

## 5. リスクマトリクス

### 5.1 発生可能性 vs 影響

| 脅威 ID       | 発生可能性 | 影響     | リスクレベル | 優先度 |
| ------------- | ---------- | -------- | ------------ | ------ |
| T-EXEC-001    | High       | Critical | **Critical** | P0     |
| T-PERSIST-001 | High       | Critical | **Critical** | P0     |
| T-EXFIL-003   | Medium     | Critical | **Critical** | P0     |
| T-IMPACT-001  | Medium     | Critical | **High**     | P1     |
| T-EXEC-002    | High       | High     | **High**     | P1     |
| T-EXEC-004    | Medium     | High     | **High**     | P1     |
| T-ACCESS-003  | Medium     | High     | **High**     | P1     |
| T-EXFIL-001   | Medium     | High     | **High**     | P1     |
| T-IMPACT-002  | High       | Medium   | **High**     | P1     |
| T-EVADE-001   | High       | Medium   | **Medium**   | P2     |
| T-ACCESS-001  | Low        | High     | **Medium**   | P2     |
| T-ACCESS-002  | Low        | High     | **Medium**   | P2     |
| T-PERSIST-002 | Low        | High     | **Medium**   | P2     |

### 5.2 クリティカルパス攻撃チェーン

**攻撃チェーン 1: Skill ベースのデータ窃取**

```
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(悪意ある skill を公開) → (モデレーションを回避) → (認証情報を収集)
```

**攻撃チェーン 2: Prompt Injection から RCE**

```
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(プロンプトを注入) → (exec 承認を回避) → (コマンドを実行)
```

**攻撃チェーン 3: 取得コンテンツ経由の間接インジェクション**

```
T-EXEC-002 → T-EXFIL-001 → External exfiltration
(URL コンテンツを汚染) → (agent が取得して指示に従う) → (データが攻撃者へ送られる)
```

---

## 6. 推奨事項まとめ

### 6.1 即時対応（P0）

| ID    | 推奨事項                                      | 対応する脅威                 |
| ----- | --------------------------------------------- | ---------------------------- |
| R-001 | VirusTotal 統合を完了する                     | T-PERSIST-001, T-EVADE-001   |
| R-002 | skill sandboxing を実装する                   | T-PERSIST-001, T-EXFIL-003   |
| R-003 | 機微な操作に対する出力検証を追加する          | T-EXEC-001, T-EXEC-002       |

### 6.2 短期（P1）

| ID    | 推奨事項                                     | 対応する脅威   |
| ----- | -------------------------------------------- | -------------- |
| R-004 | レート制限を実装する                         | T-IMPACT-002   |
| R-005 | 保存時 token 暗号化を追加する                | T-ACCESS-003   |
| R-006 | exec approval UX と検証を改善する            | T-EXEC-004     |
| R-007 | web_fetch 向け URL allowlisting を実装する   | T-EXFIL-001    |

### 6.3 中期（P2）

| ID    | 推奨事項                                              | 対応する脅威    |
| ----- | ----------------------------------------------------- | --------------- |
| R-008 | 可能な場所で暗号学的チャネル検証を追加する            | T-ACCESS-002    |
| R-009 | config integrity 検証を実装する                       | T-PERSIST-003   |
| R-010 | 更新署名と version pinning を追加する                 | T-PERSIST-002   |

---

## 7. 付録

### 7.1 ATLAS technique 対応表

| ATLAS ID      | technique 名                   | OpenClaw の脅威                                                    |
| ------------- | ------------------------------ | ------------------------------------------------------------------ |
| AML.T0006     | Active Scanning                | T-RECON-001, T-RECON-002                                           |
| AML.T0009     | Collection                     | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                              |
| AML.T0010.001 | Supply Chain: AI Software      | T-PERSIST-001, T-PERSIST-002                                       |
| AML.T0010.002 | Supply Chain: Data             | T-PERSIST-003                                                      |
| AML.T0031     | Erode AI Model Integrity       | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                           |
| AML.T0040     | AI Model Inference API Access  | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002   |
| AML.T0043     | Craft Adversarial Data         | T-EXEC-004, T-EVADE-001, T-EVADE-002                               |
| AML.T0051.000 | LLM Prompt Injection: Direct   | T-EXEC-001, T-EXEC-003                                             |
| AML.T0051.001 | LLM Prompt Injection: Indirect | T-EXEC-002                                                         |

### 7.2 主要セキュリティファイル

| パス                                | 役割                        | リスクレベル |
| ----------------------------------- | --------------------------- | ------------ |
| `src/infra/exec-approvals.ts`       | コマンド承認ロジック        | **Critical** |
| `src/gateway/auth.ts`               | Gateway 認証                | **Critical** |
| `src/infra/net/ssrf.ts`             | SSRF 保護                   | **Critical** |
| `src/security/external-content.ts`  | Prompt injection 緩和       | **Critical** |
| `src/agents/sandbox/tool-policy.ts` | ツールポリシー強制          | **Critical** |
| `src/routing/resolve-route.ts`      | セッション分離              | **Medium**   |

### 7.3 用語集

| 用語                 | 定義                                                      |
| -------------------- | --------------------------------------------------------- |
| **ATLAS**            | MITRE の Adversarial Threat Landscape for AI Systems      |
| **ClawHub**          | OpenClaw の skill marketplace                             |
| **Gateway**          | OpenClaw のメッセージルーティングおよび認証レイヤー       |
| **MCP**              | Model Context Protocol - ツールプロバイダインターフェース |
| **Prompt Injection** | 悪意ある指示が入力に埋め込まれる攻撃                      |
| **Skill**            | OpenClaw agent 向けのダウンロード可能拡張                 |
| **SSRF**             | Server-Side Request Forgery                               |

---

_この脅威モデルは生きたドキュメントです。セキュリティ問題は security@openclaw.ai に報告してください_

## 関連

- [Formal verification](/ja-JP/security/formal-verification)
- [脅威モデルへのコントリビュート](/ja-JP/security/CONTRIBUTING-THREAT-MODEL)

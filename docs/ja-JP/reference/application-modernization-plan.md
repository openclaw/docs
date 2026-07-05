---
read_when:
    - 広範な OpenClaw アプリケーション近代化パスを計画する
    - アプリまたは Control UI 作業向けフロントエンド実装標準の更新
    - 幅広い製品品質レビューを段階的なエンジニアリング作業に変える
summary: 包括的なアプリケーションモダナイゼーション計画とフロントエンドデリバリーのスキル更新
title: アプリケーションのモダナイゼーション計画
x-i18n:
    generated_at: "2026-07-05T11:48:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 94d9afca6acbf19a93c265bb98f0fc0fcd85da8808680fa41d29d8c198bacb88
    source_path: reference/application-modernization-plan.md
    workflow: 16
---

## 目標

広範なリファクタリングでリスクを隠したり現在のワークフローを壊したりせずに、アプリケーションをよりクリーンで高速、保守しやすいプロダクトへ近づける。触れた各サーフェスに証拠を添えて、小さくレビュー可能な単位で着地させる。

## 原則

- 境界が明確に churn、性能コスト、またはユーザーに見えるバグを引き起こしていると実証できる場合を除き、現在のアーキテクチャを維持する。
- 各 issue には最小の正しいパッチを優先し、それを繰り返す。
- 必須の修正と任意の磨き込みを分離し、メンテナーが主観的な判断を待たずに価値の高い作業を着地できるようにする。
- Plugin 向けの挙動はドキュメント化し、後方互換性を保つ。
- 回帰が修正されたと主張する前に、出荷済みの挙動、依存関係の契約、テストを検証する。
- 主要なユーザーパスを先に改善する: オンボーディング、認証、チャット、プロバイダー設定、Plugin 管理、診断。

## フェーズ 1: ベースライン監査

変更前に現在のアプリケーションを棚卸しする。

- 上位のユーザーワークフローと、それらを所有するコードサーフェスを特定する。
- 使われていない操作、重複した設定、不明瞭なエラー状態、高コストなレンダリングパスを列挙する。
- 各サーフェスの現在の検証コマンドを記録する。
- issue を必須、推奨、任意としてマークする。
- 特に API、セキュリティ、リリース、Plugin 契約の変更について、オーナーレビューが必要な既知のブロッカーを文書化する。

完了の定義:

- repo-root のファイル参照を含む issue リストが 1 つある。
- 各 issue に重大度、オーナーサーフェス、想定されるユーザー影響、提案された検証パスがある。
- 必須修正に推測ベースのクリーンアップ項目が混在していない。

## フェーズ 2: プロダクトと UX の整理

目に見えるワークフローを優先し、混乱を取り除く。

- モデル認証、Gateway ステータス、Plugin 設定周りのオンボーディング文言と空状態を引き締める。
- 実行可能なアクションがない場合は、使われていない操作を削除または無効化する。
- 壊れやすいレイアウト前提の背後に隠すのではなく、レスポンシブ幅全体で重要なアクションを見える状態に保つ。
- 繰り返されるステータス文言を統合し、エラーに単一の信頼できる情報源を持たせる。
- コア設定を高速に保ちながら、詳細設定には段階的開示を追加する。

推奨検証:

- 初回セットアップと既存ユーザー起動の手動ハッピーパス。
- ルーティング、設定の永続化、ステータス導出ロジックに対する焦点を絞ったテスト。
- 変更されたレスポンシブサーフェスのブラウザスクリーンショット。

## フェーズ 3: フロントエンドアーキテクチャの引き締め

大規模な書き換えなしに保守性を高める。

- 繰り返される UI 状態変換を、狭く型付けされたヘルパーへ移す。
- データ取得、永続化、表示の責務を分離して保つ。
- 新しい抽象化よりも、既存のフック、ストア、コンポーネントパターンを優先する。
- 結合を減らす、またはテストを明確にする場合に限り、肥大化したコンポーネントを分割する。
- ローカルなパネル操作のために広範なグローバル状態を導入することを避ける。

必須ガードレール:

- ファイル分割の副作用として公開挙動を変更しない。
- メニュー、ダイアログ、タブ、キーボードナビゲーションのアクセシビリティ挙動を保つ。
- ローディング、空、エラー、楽観的状態が引き続きレンダリングされることを検証する。

## フェーズ 4: 性能と信頼性

広範な理論上の最適化ではなく、測定された痛点を対象にする。

- 起動、ルート遷移、大きなリスト、チャット transcript のコストを測定する。
- プロファイリングで価値が証明された場合は、繰り返し発生する高コストな派生データをメモ化されたセレクターまたはキャッシュ済みヘルパーに置き換える。
- ホットパス上の回避可能なネットワークスキャンまたはファイルシステムスキャンを減らす。
- モデルペイロード構築前に、プロンプト、レジストリ、ファイル、Plugin、ネットワーク入力の決定的な順序を保つ。
- ホットヘルパーと契約境界に軽量な回帰テストを追加する。

完了の定義:

- 各性能変更が、ベースライン、想定される影響、実際の影響、残っているギャップを記録している。
- 安価な測定が可能な場合、直感だけに基づく性能パッチは着地しない。

## フェーズ 5: 型、契約、テストの堅牢化

ユーザーと Plugin 作者が依存する境界点の正確性を高める。

- ゆるいランタイム文字列を、判別共用体または閉じたコードリストに置き換える。
- 外部入力を既存のスキーマヘルパーまたは zod で検証する。
- Plugin マニフェスト、プロバイダーカタログ、Gateway プロトコルメッセージ、設定移行の挙動の周辺に契約テストを追加する。
- 互換性パスは、起動時の隠れた移行ではなく、doctor または修復フローに置く。
- テスト専用に Plugin 内部へ結合することを避け、SDK ファサードとドキュメント化された barrels を使用する。

推奨検証:

- `pnpm check:changed`
- 変更されたすべての境界に対するターゲットテスト。
- lazy boundary、パッケージング、公開サーフェスが変更される場合は `pnpm build`。

## フェーズ 6: ドキュメントとリリース準備

ユーザー向けドキュメントを挙動と整合させる。

- 挙動、API、設定、オンボーディング、Plugin の変更に合わせてドキュメントを更新する。
- changelog エントリはユーザーに見える変更にのみ追加する。
- Plugin 用語はユーザー向けのままにし、内部パッケージ名はコントリビューターに必要な場合にのみ使用する。
- リリースとインストール手順が現在のコマンドサーフェスと引き続き一致していることを確認する。

完了の定義:

- 関連ドキュメントが挙動変更と同じブランチで更新されている。
- 触れた場合、生成ドキュメントまたは API drift チェックが通っている。
- 引き継ぎで、スキップした検証とその理由を明示している。

## 推奨される最初の単位

スコープを絞った Control UI とオンボーディングの見直しから始める:

- 初回セットアップ、プロバイダー認証の準備状態、Gateway ステータス、Plugin 設定サーフェスを監査する。
- 使われていないアクションを削除し、失敗状態を明確にする。
- ステータス導出と設定の永続化について、焦点を絞ったテストを追加または更新する。
- `pnpm check:changed` を実行する。

これにより、アーキテクチャリスクを限定しながら高いユーザー価値を得られる。

## フロントエンド skill 更新

このセクションは、モダナイゼーションタスクで提供されたフロントエンド向け `SKILL.md` を更新するために使用する。このガイダンスを repo-local な OpenClaw skill として採用する場合は、まず `.agents/skills/openclaw-frontend/SKILL.md` を作成し、そのターゲット skill に属する frontmatter を保持したうえで、本文ガイダンスを次の内容で追加または置き換える。

```markdown
# Frontend Delivery Standards

Use this skill when implementing or reviewing user-facing React, Next.js,
desktop webview, or app UI work.

## Operating rules

- Start from the existing product workflow and code conventions.
- Prefer the smallest correct patch that improves the current user path.
- Separate required fixes from optional polish in the handoff.
- Do not build marketing pages when the request is for an application surface.
- Keep actions visible and usable across supported viewport sizes.
- Remove dead affordances instead of leaving controls that cannot act.
- Preserve loading, empty, error, success, and permission states.
- Use existing design-system components, hooks, stores, and icons before adding
  new primitives.

## Implementation checklist

1. Identify the primary user task and the component or route that owns it.
2. Read the local component patterns before editing.
3. Patch the narrowest surface that solves the issue.
4. Add responsive constraints for fixed-format controls, toolbars, grids, and
   counters so text and hover states cannot resize the layout unexpectedly.
5. Keep data loading, state derivation, and rendering responsibilities clear.
6. Add tests when logic, persistence, routing, permissions, or shared helpers
   change.
7. Verify the main happy path and the most relevant edge case.

## Visual quality gates

- Text must fit inside its container on mobile and desktop.
- Toolbars may wrap, but controls must remain reachable.
- Buttons should use familiar icons when the icon is clearer than text.
- Cards should be used for repeated items, modals, and framed tools, not for
  every page section.
- Avoid one-note color palettes and decorative backgrounds that compete with
  operational content.
- Dense product surfaces should optimize for scanning, comparison, and repeated
  use.

## Handoff format

Report:

- What changed.
- What user behavior changed.
- Required validation that passed.
- Any validation skipped and the concrete reason.
- Optional follow-up work, clearly separated from required fixes.
```

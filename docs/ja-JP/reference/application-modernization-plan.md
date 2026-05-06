---
read_when:
    - 広範な OpenClaw アプリケーションのモダナイゼーション作業を計画する
    - アプリまたは Control UI 作業向けのフロントエンド実装標準の更新
    - 広範な製品品質レビューを段階的なエンジニアリング作業に落とし込む
summary: フロントエンドデリバリーのスキル更新を含む包括的なアプリケーションモダナイゼーション計画
title: アプリケーションモダナイゼーション計画
x-i18n:
    generated_at: "2026-05-06T09:09:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c97bd9c76492b9e7beb0a2623f583a54b5461bebb848fa3ac7e4495322f6456
    source_path: reference/application-modernization-plan.md
    workflow: 16
---

## 目標

現在のワークフローを壊したり、広範なリファクタリングにリスクを隠したりすることなく、
アプリケーションをよりクリーンで高速、保守しやすいプロダクトへ進める。作業は、
触れた各サーフェスの証拠を伴う、小さくレビュー可能な単位で着地させる。

## 原則

- 境界が明確に変更の多発、パフォーマンスコスト、またはユーザーに見えるバグを引き起こしている場合を除き、現在のアーキテクチャを維持する。
- 各問題に対して最小の正しいパッチを優先し、それを繰り返す。
- 必須の修正と任意の磨き込みを分け、メンテナーが主観的な判断を待たずに高価値の作業を取り込めるようにする。
- plugin 向けの挙動は文書化し、後方互換性を保つ。
- リグレッションが修正されたと主張する前に、出荷済みの挙動、依存関係の契約、テストを検証する。
- 主要なユーザーパスを先に良くする: オンボーディング、認証、チャット、プロバイダー設定、plugin 管理、診断。

## フェーズ 1: ベースライン監査

変更する前に現在のアプリケーションを棚卸しする。

- 主要なユーザーワークフローと、それらを所有するコードサーフェスを特定する。
- 使われていない操作要素、重複した設定、不明瞭なエラー状態、高コストなレンダリングパスを列挙する。
- 各サーフェスの現在の検証コマンドを記録する。
- 問題を必須、推奨、任意に分類する。
- 所有者レビューが必要な既知のブロッカーを文書化する。特に API、セキュリティ、リリース、plugin 契約の変更。

完了の定義:

- リポジトリルート基準のファイル参照付きの問題リストが 1 つある。
- 各問題に重要度、所有サーフェス、想定されるユーザー影響、提案する検証パスがある。
- 推測に基づくクリーンアップ項目が必須修正に混ざっていない。

## フェーズ 2: プロダクトと UX のクリーンアップ

見えるワークフローを優先し、混乱を取り除く。

- モデル認証、Gateway 状態、plugin 設定まわりのオンボーディング文言と空状態を引き締める。
- 実行できるアクションがない使われていない操作要素を削除または無効化する。
- 重要なアクションを脆いレイアウト前提の背後に隠すのではなく、レスポンシブ幅全体で見える状態に保つ。
- 繰り返される状態文言を統合し、エラーの信頼できる情報源を 1 つにする。
- 中核のセットアップを高速に保ちながら、高度な設定には段階的開示を追加する。

推奨される検証:

- 初回セットアップと既存ユーザー起動の手動ハッピーパス。
- ルーティング、設定永続化、状態導出ロジックに対する集中テスト。
- 変更されたレスポンシブサーフェスのブラウザスクリーンショット。

## フェーズ 3: フロントエンドアーキテクチャの引き締め

広範な書き換えなしに保守性を改善する。

- 繰り返しの UI 状態変換を、狭く型付けされたヘルパーへ移す。
- データ取得、永続化、表示の責務を分けて保つ。
- 新しい抽象化よりも、既存のフック、ストア、コンポーネントパターンを優先する。
- 過大なコンポーネントの分割は、結合度を下げるかテストを明確にする場合にのみ行う。
- ローカルなパネル操作のために広範なグローバル状態を導入しない。

必須ガードレール:

- ファイル分割の副作用として公開挙動を変更しない。
- メニュー、ダイアログ、タブ、キーボードナビゲーションのアクセシビリティ挙動を維持する。
- 読み込み、空、エラー、楽観的状態が引き続きレンダリングされることを検証する。

## フェーズ 4: パフォーマンスと信頼性

広範で理論的な最適化ではなく、測定された痛点を対象にする。

- 起動、ルート遷移、大きなリスト、チャットトランスクリプトのコストを測定する。
- プロファイリングで価値が証明された箇所では、繰り返し発生する高コストな派生データをメモ化セレクターまたはキャッシュ済みヘルパーに置き換える。
- ホットパスで避けられるネットワークまたはファイルシステムスキャンを減らす。
- モデルペイロード構築前に、プロンプト、レジストリ、ファイル、plugin、ネットワーク入力の決定的な順序を保つ。
- ホットなヘルパーと契約境界に軽量なリグレッションテストを追加する。

完了の定義:

- 各パフォーマンス変更は、ベースライン、期待される影響、実際の影響、残る差分を記録する。
- 安価な測定が利用可能な場合、直感だけに基づくパフォーマンスパッチは着地させない。

## フェーズ 5: 型、契約、テストの強化

ユーザーと plugin 作者が依存する境界点の正しさを高める。

- 緩いランタイム文字列を判別共用体または閉じたコードリストに置き換える。
- 外部入力を既存のスキーマヘルパーまたは zod で検証する。
- plugin マニフェスト、プロバイダーカタログ、Gateway プロトコルメッセージ、設定移行挙動のまわりに契約テストを追加する。
- 互換性パスは、起動時の隠れた移行ではなく doctor または修復フローに置く。
- plugin 内部へのテスト専用の結合を避け、SDK ファサードと文書化済みのバレルを使う。

推奨される検証:

- `pnpm check:changed`
- 変更されたすべての境界に対する対象テスト。
- 遅延境界、パッケージング、公開サーフェスが変更される場合は `pnpm build`。

## フェーズ 6: ドキュメントとリリース準備

ユーザー向けドキュメントを挙動と揃えて保つ。

- 挙動、API、設定、オンボーディング、plugin 変更に合わせてドキュメントを更新する。
- ユーザーに見える変更にのみ changelog エントリを追加する。
- plugin 用語はユーザー向けに保ち、内部パッケージ名はコントリビューターに必要な場合にのみ使う。
- リリース手順とインストール手順が現在のコマンドサーフェスとまだ一致していることを確認する。

完了の定義:

- 関連ドキュメントが挙動変更と同じブランチで更新されている。
- 触れた場合、生成ドキュメントまたは API ドリフトチェックが通る。
- 引き継ぎには、スキップした検証とスキップした理由を明記する。

## 推奨される最初の単位

スコープを絞った Control UI とオンボーディングの確認から始める:

- 初回セットアップ、プロバイダー認証準備状況、Gateway 状態、plugin 設定サーフェスを監査する。
- 使われていないアクションを削除し、失敗状態を明確にする。
- 状態導出と設定永続化の集中テストを追加または更新する。
- `pnpm check:changed` を実行する。

これにより、アーキテクチャリスクを抑えながら高いユーザー価値を得られる。

## フロントエンド skill 更新

このセクションは、モダナイゼーションタスクで提供されるフロントエンド重視の `SKILL.md` を更新するために使う。このガイダンスをリポジトリローカルの OpenClaw skill として採用する場合は、まず `.agents/skills/openclaw-frontend/SKILL.md` を作成し、そのターゲット skill に属する frontmatter を保持してから、本文ガイダンスを次の内容で追加または置き換える。

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

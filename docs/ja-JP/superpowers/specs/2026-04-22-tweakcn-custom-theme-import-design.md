---
x-i18n:
    generated_at: "2026-05-02T22:22:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9f2b5783c5762ebe7b5db108a89692e653c515138110b4fa9d23663e2ccbbd5
    source_path: superpowers/specs/2026-04-22-tweakcn-custom-theme-import-design.md
    workflow: 16
---

# Tweakcn カスタムテーマインポート設計

ステータス: 2026-04-22 に端末で承認済み

## 概要

tweakcn の共有リンクからインポートできる、ブラウザー ローカルのカスタム Control UI テーマスロットを正確に1つ追加する。既存の組み込みテーマファミリーは `claw`、`knot`、`dash` のままにする。新しい `custom` ファミリーは通常の OpenClaw テーマファミリーと同じように動作し、インポートされた tweakcn ペイロードに light と dark の両方のトークンセットが含まれる場合、`light`、`dark`、`system` モードをサポートする。

インポートされたテーマは、残りの Control UI 設定とともに現在のブラウザープロファイルにのみ保存される。gateway config には書き込まれず、デバイス間やブラウザー間で同期されない。

## 問題

Control UI のテーマシステムは現在、3つのハードコードされたテーマファミリーに閉じている。

- `ui/src/ui/theme.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/styles/base.css`

ユーザーは組み込みファミリーとモードバリアントを切り替えられるが、リポジトリの CSS を編集せずに tweakcn からテーマを取り込むことはできない。求められている成果は汎用テーマシステムより小さい。3つの組み込みを維持し、tweakcn リンクから置き換え可能な、ユーザー制御のインポート済みスロットを1つ追加する。

## 目標

- 既存の組み込みテーマファミリーを変更しない。
- テーマライブラリではなく、インポート済みカスタムスロットを正確に1つ追加する。
- tweakcn 共有リンクまたは直接の `https://tweakcn.com/r/themes/{id}` URL を受け付ける。
- インポートされたテーマをブラウザーのローカルストレージにのみ永続化する。
- インポート済みスロットを既存の `light`、`dark`、`system` モードコントロールで動作させる。
- 失敗時の動作を安全に保つ。不正なインポートがアクティブな UI テーマを壊してはならない。

## 非目標

- 複数テーマのライブラリやブラウザー ローカルのインポート一覧は作らない。
- Gateway 側の永続化やデバイス間同期は行わない。
- 任意の CSS エディターや生のテーマ JSON エディターは作らない。
- tweakcn からリモートフォントアセットを自動読み込みしない。
- 片方のモードしか公開していない tweakcn ペイロードをサポートしようとしない。
- Control UI に必要な継ぎ目を超える、リポジトリ全体のテーマリファクタリングは行わない。

## 既に決定済みのユーザー判断

- 3つの組み込みテーマを維持する。
- tweakcn ベースのインポートスロットを1つ追加する。
- インポートされたテーマは Gateway config ではなくブラウザーに保存する。
- インポート済みスロットで `light`、`dark`、`system` をサポートする。
- 次のインポートでカスタムスロットを上書きすることを意図した動作とする。

## 推奨アプローチ

4つ目のテーマファミリー ID、`custom` を Control UI のテーマモデルに追加する。`custom` ファミリーは、有効な tweakcn インポートが存在する場合にのみ選択可能になる。インポートされたペイロードは OpenClaw 固有のカスタムテーマレコードに正規化され、残りの UI 設定とともにブラウザーのローカルストレージに保存される。

実行時に、OpenClaw は解決済みのカスタム CSS 変数ブロックを定義する、管理対象の `<style>` タグをレンダリングする。

```css
:root[data-theme="custom"] { ... }
:root[data-theme="custom-light"] { ... }
```

これにより、カスタムテーマ変数を `custom` ファミリーにスコープし、インライン CSS 変数が組み込みファミリーに漏れることを避ける。

## アーキテクチャ

### テーマモデル

`ui/src/ui/theme.ts` を更新する。

- `ThemeName` を拡張して `custom` を含める。
- `ResolvedTheme` を拡張して `custom` と `custom-light` を含める。
- `VALID_THEME_NAMES` を拡張する。
- `resolveTheme()` を更新し、`custom` が既存ファミリーの動作を反映するようにする。
  - `custom + dark` -> `custom`
  - `custom + light` -> `custom-light`
  - `custom + system` -> OS 設定に基づいて `custom` または `custom-light`

`custom` にはレガシーエイリアスを追加しない。

### 永続化モデル

`ui/src/ui/storage.ts` の `UiSettings` 永続化に、任意のカスタムテーマペイロードを1つ追加する。

- `customTheme?: ImportedCustomTheme`

推奨される保存形状:

```ts
type ImportedCustomTheme = {
  sourceUrl: string;
  themeId: string;
  label: string;
  importedAt: string;
  light: Record<string, string>;
  dark: Record<string, string>;
};
```

注記:

- `sourceUrl` は正規化後の元のユーザー入力を保存する。
- `themeId` は URL から抽出した tweakcn テーマ ID。
- `label` は存在する場合は tweakcn の `name` フィールド、それ以外は `Custom`。
- `light` と `dark` は、raw tweakcn ペイロードではなく、既に正規化された OpenClaw トークンマップ。
- インポートされたペイロードは他のブラウザー ローカル設定の横に置かれ、同じローカルストレージ文書にシリアライズされる。
- 保存済みのカスタムテーマデータが読み込み時に欠落しているか無効な場合は、ペイロードを無視し、永続化されたファミリーが `custom` だった場合は `theme: "claw"` にフォールバックする。

### 実行時適用

Control UI ランタイムに、`ui/src/ui/app-settings.ts` と `ui/src/ui/theme.ts` の近くが所有する、狭いカスタムテーマスタイルシートマネージャーを追加する。

責務:

- `document.head` 内に安定した `<style id="openclaw-custom-theme">` タグを1つ作成または更新する。
- 有効なカスタムテーマペイロードが存在する場合にのみ CSS を出力する。
- ペイロードがクリアされたときは style タグの内容を削除する。
- 組み込みファミリーの CSS は `ui/src/styles/base.css` に保持する。インポートされたトークンをチェックイン済みスタイルシートに差し込まない。

このマネージャーは、設定が読み込まれる、保存される、インポートされる、またはクリアされるたびに実行される。

### Light モードセレクター

実装では、`custom-light` を特別扱いするのではなく、ファミリー横断の light スタイルには `data-theme-mode="light"` を優先するべきである。既存のセレクターが `data-theme="light"` に固定されていて、すべての light ファミリーに適用する必要がある場合は、この作業の一部として広げる。

## インポート UX

`ui/src/ui/views/config.ts` の `Appearance` セクションを更新する。

- `Claw`、`Knot`、`Dash` の横に `Custom` テーマカードを追加する。
- インポート済みカスタムテーマが存在しない場合は、カードを無効として表示する。
- テーマグリッドの下に次を含むインポートパネルを追加する。
  - tweakcn 共有リンクまたは `/r/themes/{id}` URL 用のテキスト入力を1つ
  - `Import` ボタンを1つ
  - カスタムペイロードが既に存在する場合の `Replace` 経路を1つ
  - カスタムペイロードが既に存在する場合の `Clear` アクションを1つ
- ペイロードが存在する場合は、インポートされたテーマのラベルとソースホストを表示する。
- アクティブなテーマが `custom` の場合、置き換えのインポートは即時に適用される。
- アクティブなテーマが `custom` ではない場合、インポートはユーザーが `Custom` カードを選択するまで新しいペイロードを保存するだけにする。

`ui/src/ui/views/config-quick.ts` のクイック設定テーマピッカーでも、ペイロードが存在する場合にのみ `Custom` を表示するべきである。

## URL 解析とリモート取得

ブラウザーのインポート経路は次を受け付ける。

- `https://tweakcn.com/themes/{id}`
- `https://tweakcn.com/r/themes/{id}`

実装では両方の形式を次に正規化するべきである。

- `https://tweakcn.com/r/themes/{id}`

その後、ブラウザーは正規化された `/r/themes/{id}` エンドポイントを直接 fetch する。

外部ペイロードには狭いスキーマバリデーターを使う。これは信頼できない外部境界なので、zod スキーマが望ましい。

必須のリモートフィールド:

- トップレベルの `name` は任意の文字列
- `cssVars.theme` は任意のオブジェクト
- `cssVars.light` はオブジェクト
- `cssVars.dark` はオブジェクト

`cssVars.light` または `cssVars.dark` のどちらかが欠落している場合は、インポートを拒否する。これは意図的である。承認済みの製品動作は完全なモードサポートであり、欠落した片側をベストエフォートで合成することではない。

## トークンマッピング

tweakcn 変数を盲目的にミラーしない。限定されたサブセットを OpenClaw トークンに正規化し、残りをヘルパーで導出する。

### 直接インポートされるトークン

各 tweakcn モードブロックから:

- `background`
- `foreground`
- `card`
- `card-foreground`
- `popover`
- `popover-foreground`
- `primary`
- `primary-foreground`
- `secondary`
- `secondary-foreground`
- `muted`
- `muted-foreground`
- `accent`
- `accent-foreground`
- `destructive`
- `destructive-foreground`
- `border`
- `input`
- `ring`
- `radius`

存在する場合、共有の `cssVars.theme` から:

- `font-sans`
- `font-mono`

モードブロックが `font-sans`、`font-mono`、または `radius` を上書きする場合は、モードローカルの値が優先される。

### OpenClaw 用に導出されるトークン

インポーターは、インポートされたベース色から OpenClaw 専用変数を導出する。

- `--bg-accent`
- `--bg-elevated`
- `--bg-hover`
- `--panel`
- `--panel-strong`
- `--panel-hover`
- `--chrome`
- `--chrome-strong`
- `--text`
- `--text-strong`
- `--chat-text`
- `--muted`
- `--muted-strong`
- `--accent-hover`
- `--accent-muted`
- `--accent-subtle`
- `--accent-glow`
- `--focus`
- `--focus-ring`
- `--focus-glow`
- `--secondary`
- `--secondary-foreground`
- `--danger`
- `--danger-muted`
- `--danger-subtle`

導出ルールは、独立してテストできるように純粋なヘルパー内に置く。正確な色混合式は実装詳細だが、ヘルパーは2つの制約を満たす必要がある。

- インポートされたテーマの意図に近い読みやすいコントラストを保つ
- 同じインポート済みペイロードに対して安定した出力を生成する

### v1 で無視されるトークン

これらの tweakcn トークンは最初のバージョンでは意図的に無視される。

- `chart-*`
- `sidebar-*`
- `font-serif`
- `shadow-*`
- `tracking-*`
- `letter-spacing`
- `spacing`

これにより、現在の Control UI が実際に必要とするトークンにスコープを保つ。

### フォント

フォントスタック文字列は存在する場合にインポートされるが、OpenClaw は v1 ではリモートフォントアセットを読み込まない。インポートされたスタックがブラウザーで利用できないフォントを参照している場合は、通常のフォールバック動作が適用される。

## 失敗時の動作

不正なインポートは閉じた状態で失敗しなければならない。

- 無効な URL 形式: インライン検証エラーを表示し、fetch しない。
- サポートされないホストまたはパス形状: インライン検証エラーを表示し、fetch しない。
- ネットワーク失敗、非 OK レスポンス、または不正な JSON: インラインエラーを表示し、現在保存されているペイロードを変更しない。
- スキーマ失敗または light/dark ブロックの欠落: インラインエラーを表示し、現在保存されているペイロードを変更しない。
- クリアアクション:
  - 保存済みのカスタムペイロードを削除する
  - 管理対象のカスタム style タグの内容を削除する
  - `custom` がアクティブな場合は、テーマファミリーを `claw` に戻す
- 初回読み込み時の無効な保存済みカスタムペイロード:
  - 保存済みペイロードを無視する
  - カスタム CSS を出力しない
  - 永続化されたテーマファミリーが `custom` だった場合は、`claw` にフォールバックする

失敗したインポートが、部分的なカスタム CSS 変数を適用した状態でアクティブな document を残すことは、どの時点でもあってはならない。

## 実装で変更が想定されるファイル

主要ファイル:

- `ui/src/ui/theme.ts`
- `ui/src/ui/storage.ts`
- `ui/src/ui/app-settings.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/ui/views/config-quick.ts`
- `ui/src/styles/base.css`

新規ヘルパーの可能性:

- `ui/src/ui/custom-theme.ts`

テスト:

- `ui/src/ui/app-settings.test.ts`
- `ui/src/ui/storage.node.test.ts`
- `ui/src/ui/views/config.browser.test.ts`
- URL 解析とペイロード正規化用の新しい重点テスト

## テスト

最小実装カバレッジ:

- 共有リンク URL を tweakcn テーマ ID に解析する
- `/themes/{id}` と `/r/themes/{id}` を fetch URL に正規化する
- サポートされないホストと不正な ID を拒否する
- tweakcn ペイロードの形状を検証する
- 有効な tweakcn ペイロードを、正規化された OpenClaw の light と dark のトークンマップにマップする
- ブラウザー ローカル設定でカスタムペイロードを読み込み、保存する
- `light`、`dark`、`system` に対して `custom` を解決する
- ペイロードが存在しない場合、`Custom` の選択を無効にする
- `custom` が既にアクティブな場合、インポートされたテーマを即時に適用する
- アクティブなカスタムテーマがクリアされた場合、`claw` にフォールバックする

手動検証ターゲット:

- Settings から既知の tweakcn テーマをインポートする
- `light`、`dark`、`system` を切り替える
- `custom` と組み込みファミリーを切り替える
- ページを再読み込みし、インポートされたカスタムテーマがローカルに保持されていることを確認する

## ロールアウトメモ

この機能は意図的に小さくしている。ユーザーが後で複数のインポート済みテーマ、名前変更、エクスポート、またはデバイス間同期を求めた場合は、後続の設計として扱う。この実装でテーマライブラリ抽象を先に作り込まない。

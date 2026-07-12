---
read_when:
    - GitHub またはローカル環境から Mantis Slack デスクトップ QA を実行する
    - Mantis Slack デスクトップの実行遅延をデバッグする
    - ソース、事前ハイドレーション済み、またはウォームリースモードの選択
    - スクリーンショットと動画の証拠を PR に投稿する
summary: Mantis Slack デスクトップ QA の運用手順書：GitHub ディスパッチ、ローカル CLI、ウォーム VNC リース、ハイドレートモード、タイミングの解釈、アーティファクト、および障害対応。
title: Mantis Slack デスクトップ運用手順書
x-i18n:
    generated_at: "2026-07-11T22:10:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3e956d99fc43a7b6fe65e2e820812b0e0e8b9e32badd25be27c74d302ab30dc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack デスクトップ QA は、Linux デスクトップ、VNC による復旧、Slack Web、実際の OpenClaw Gateway、スクリーンショット、動画、PR の証拠コメントを必要とする Slack 系のバグ向けの実 UI レーンです。ユニットテストやヘッドレスの Slack ライブレーンではバグを証明できない場合に使用します。

## ストレージモデル

Mantis は次の 3 つのストレージレイヤーを使用します。

- **プロバイダーイメージ** - Crabbox が所有し、クラウドプロバイダーアカウントに保存されます。
  マシンの機能（Chrome/Chromium、ffmpeg、scrot、
  Node/corepack/pnpm、ネイティブビルドツール）と空のキャッシュディレクトリを保持します。
- **ウォームリース状態** - 現在のオペレーターセッションが所有します。リースが有効な間、ログイン済みのブラウザプロファイル、`/var/cache/crabbox/pnpm`、準備済みのソースチェックアウトを保持できます。
- **Mantis アーティファクト** - OpenClaw の実行が所有します。
  `.artifacts/qa-e2e/mantis/...` 配下に置かれ、GitHub Actions がアップロードし、Mantis
  GitHub App が PR にインラインの証拠をコメントします。

シークレット、ブラウザ Cookie、Slack のログイン状態、リポジトリのチェックアウト、`node_modules`、`dist/` をプロバイダーイメージに組み込まないでください。

## GitHub ディスパッチ

`main` からワークフローを実行します。

```bash
gh workflow run mantis-slack-desktop-smoke.yml \
  --ref main \
  -f candidate_ref=<trusted-ref-or-sha> \
  -f pr_number=<pr-number> \
  -f scenario_id=slack-canary \
  -f crabbox_provider=aws \
  -f keep_vm=false \
  -f hydrate_mode=source
```

このワークフローは実際の認証情報を使用するため、`candidate_ref` は制限されています。現在の `main` の履歴上にあるコミット、リリースタグ、または `openclaw/openclaw` のオープンな PR の head に解決される必要があります。

ワークフローは次のものを生成します。

- アップロードされるアーティファクト `mantis-slack-desktop-smoke-<run-id>-<attempt>`
- Mantis GitHub App による PR のインラインコメント
- `slack-desktop-smoke.png`、`slack-desktop-smoke.mp4`
- `slack-desktop-smoke-preview.gif`、`slack-desktop-smoke-change.mp4`
- `mantis-slack-desktop-smoke-summary.json`、`mantis-slack-desktop-smoke-report.md`
- リモートログ: `slack-desktop-command.log`、`openclaw-gateway.log`、`chrome.log`、`ffmpeg.log`

PR コメントは、非表示の `<!-- mantis-slack-desktop-smoke -->` マーカーを介して同じ場所で更新されます。

## ローカル CLI

コールド状態のソースによる証明:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --credential-source convex \
  --credential-role maintainer \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --scenario slack-canary \
  --hydrate-mode source
```

VNC で復旧するために VM を維持します。

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

VNC を開きます。

```bash
crabbox vnc --provider aws --id <cbx_id> --open
```

ウォームリースを再利用します。

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

再利用するリモートワークスペースにすでに `node_modules` とビルド済みの `dist/` がある場合に限り、`--hydrate-mode prehydrated` を使用してください。それ以外の場合、Mantis は安全側に倒して失敗します。

ネイティブ Slack 承認 UI を証明します。

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

`--approval-checkpoints` と `--gateway-setup` は同時に使用できません。明示的に承認チェックポイント用の `--scenario` を渡さない限り、オプトインの `slack-approval-exec-native` および `slack-approval-plugin-native` シナリオを実行します。それ以外の Slack シナリオは VM の起動前に拒否されます。Slack QA ランナーは、実際の Slack API メッセージを観測して各チェックポイントの JSON ファイルを書き込み、その後リモートウォッチャーがそのメッセージを `approval-checkpoints/<scenario>-pending.png` および `approval-checkpoints/<scenario>-resolved.png` にレンダリングします。チェックポイント JSON、メッセージの証拠、ack JSON、またはレンダリングされたスクリーンショットのいずれかが存在しないか空の場合、実行は失敗します。

コールド状態の GitHub Actions リースには Slack Web の Cookie がないため、ブラウザキャプチャには Slack のサインイン画面が表示されることがあります。承認チェックポイントの証明では、`slack-desktop-smoke.png` ではなく、レンダリングされたチェックポイント画像と Slack QA アーティファクトを信頼してください。ブラウザのスクリーンショット自体に Slack Web を表示する必要がある場合に限り、Slack Web に手動ログインしたプロファイルを持つ、維持されたウォームリースを使用してください。

## ハイドレートモード

| モード        | 使用する場合                                | リモートでの動作                                                                        | トレードオフ                                               |
| ------------- | ------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `source`      | 通常の PR 証明、コールドマシン、CI          | VM 内で `pnpm install --frozen-lockfile --prefer-offline` と `pnpm build` を実行します | 最も低速ですが、ソースチェックアウトの証明として最も強力です |
| `prehydrated` | 再利用リースを意図的に準備した場合          | 既存の `node_modules` と `dist/` が必須で、インストールとビルドをスキップします        | 高速ですが、オペレーターが管理するウォームリースでのみ有効です |

GitHub Actions は、VM を実行する前に必ず候補のチェックアウトを準備します。その pnpm ストアは、OS、Node のバージョン、ロックファイルをキーとしてキャッシュされます。VM での `source` 実行も、存在する場合は `/var/cache/crabbox/pnpm` を再利用します。

## 所要時間の解釈

`mantis-slack-desktop-smoke-report.md` には各フェーズの所要時間が含まれます。

- `crabbox.warmup` - クラウドプロバイダーの起動、デスクトップとブラウザの準備、SSH。
- `crabbox.inspect` - リースメタデータの検索。
- `credentials.prepare` - Convex 認証情報リースの取得。
- `crabbox.remote_run` - 同期、ブラウザの起動、OpenClaw のインストールとビルドまたはハイドレート検証、Gateway の起動、スクリーンショット、動画キャプチャ。
- `artifacts.copy` - VM から rsync でコピー。

Crabbox がゼロ以外のリモートステータスを返した場合でも、OpenClaw Gateway のセットアップが完了したこと、または Slack QA コマンド自体が正常終了したことを証明するメタデータを Mantis がコピーできた場合、`crabbox.remote_run` は `accepted` を示すことがあります。`accepted` はシナリオの失敗ではなく、説明付きの合格として扱ってください。

実行が遅い場合:

- ウォームアップが大半を占める: より優れた Crabbox プロバイダーイメージを事前作成または昇格します。
- `source` で `remote_run` が大半を占める: ウォームリースを使用するか、pnpm ストアの再利用を改善するか、マシンの前提条件をプロバイダーイメージへ移します。
- `prehydrated` で `remote_run` が大半を占める: リモートワークスペースが実際には準備できていないか、Gateway、ブラウザ、Slack のセットアップに時間がかかっています。
- アーティファクトのコピーが大半を占める: 動画サイズとアーティファクトディレクトリの内容を確認します。

## 証拠チェックリスト

適切な PR コメントには次の内容が表示されます。

- シナリオ ID と候補 SHA
- GitHub Actions 実行 URL とアーティファクト URL
- インラインの承認チェックポイントスクリーンショット、またはログイン済みウォームリースから取得した Slack Web のスクリーンショット
- 利用可能な場合はインラインのアニメーションプレビュー
- 完全版 MP4 とトリミング済み MP4 のリンク
- 合否ステータスとレポートの所要時間の概要

スクリーンショットや動画をリポジトリにコミットしないでください。GitHub Actions のアーティファクトまたは PR コメントに保持してください。

## 障害への対処

VM の実行前にワークフローが失敗した場合は、まず Actions ジョブを確認してください。一般的な原因は、信頼されていない `candidate_ref`、環境シークレットの不足、または候補のインストールやビルドの失敗です。

VM の実行が失敗してもスクリーンショットがコピーされている場合は、次を確認します。

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

実行でリースを維持した場合は、レポートに記載された `crabbox vnc ...` コマンドで VNC を開き、完了後にリースを停止します。

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Slack のログインが期限切れになった場合は、維持されたリース上の VNC で修復し、`--lease-id` を指定して再実行してください。そのブラウザプロファイルをプロバイダーイメージに組み込まないでください。

## 関連項目

- [QA の概要](/ja-JP/concepts/qa-e2e-automation)
- [Slack チャンネル](/ja-JP/channels/slack)
- [テスト](/ja-JP/help/testing)

---
read_when:
    - GitHub またはローカルから Mantis Slack デスクトップ QA を実行する
    - 遅い Mantis Slack デスクトップ実行のデバッグ
    - ソース、事前ハイドレーション済み、ウォームリースモードの選択
    - スクリーンショットと動画の証拠をPRに投稿する
summary: 'Mantis Slack デスクトップ QA のオペレーターランブック: GitHub ディスパッチ、ローカル CLI、ウォーム VNC リース、hydrate モード、タイミングの解釈、アーティファクト、失敗時の処理。'
title: Mantis Slack デスクトップ版ランブック
x-i18n:
    generated_at: "2026-05-06T05:01:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83ca8792b53e5b14e592c2cbec6f6adfc936834e19f340f8e5eb3d467ecd3209
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack デスクトップ QA は、Linux デスクトップ、VNC レスキュー、Slack Web、実際の OpenClaw Gateway、スクリーンショット、動画、PR 証拠コメントを必要とする Slack クラスのバグ向けの実 UI レーンです。

ユニットテストやヘッドレス Slack ライブレーンではバグを証明できない場合に使用します。

## ストレージモデル

Mantis は 3 つの異なるストレージ層を使用します。

- プロバイダーイメージ: Crabbox が所有し、クラウドプロバイダーアカウントに保存されます。
  Chrome/Chromium、ffmpeg、scrot、Node/corepack/pnpm、ネイティブビルドツール、空のキャッシュディレクトリなどのマシン機能を含みます。
- ウォームリース状態: 現在のオペレーターセッションが所有します。リースが有効な間、ログイン済みブラウザープロファイル、`/var/cache/crabbox/pnpm`、準備済みソースチェックアウトを含めることができます。
- Mantis アーティファクト: OpenClaw の実行が所有します。`.artifacts/qa-e2e/mantis/...` 配下に置かれ、その後 GitHub Actions がアップロードし、Mantis GitHub App が PR にインライン証拠をコメントします。

シークレット、ブラウザークッキー、Slack ログイン状態、リポジトリチェックアウト、`node_modules`、`dist/` を事前焼き込み済みプロバイダーイメージに入れないでください。

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

ワークフローはライブ認証情報を使用するため、許可される `candidate_ref` 値は意図的に狭く設定されています。現在の `main` の祖先、リリースタグ、または `openclaw/openclaw` からのオープン PR ヘッドです。

ワークフローは以下を書き込みます。

- アップロード済みアーティファクト: `mantis-slack-desktop-smoke-<run-id>-<attempt>`;
- Mantis GitHub App からのインライン PR コメント;
- `slack-desktop-smoke.png`;
- `slack-desktop-smoke.mp4`;
- `slack-desktop-smoke-preview.gif`;
- `slack-desktop-smoke-change.mp4`;
- `mantis-slack-desktop-smoke-summary.json`;
- `mantis-slack-desktop-smoke-report.md`;
- `slack-desktop-command.log`、`openclaw-gateway.log`、`chrome.log`、`ffmpeg.log` などのリモートログ。

PR コメントは非表示の `<!-- mantis-slack-desktop-smoke -->` マーカーによってその場で更新されます。

## ローカル CLI

コールドソース証明:

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

VNC レスキュー用に VM を保持します。

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

再利用するリモートワークスペースにすでに `node_modules` とビルド済みの `dist/` がある場合にのみ、`--hydrate-mode prehydrated` を使用します。それらがない場合、Mantis は安全側で失敗します。

## ハイドレートモード

| モード          | 使用する場合                                  | リモート動作                                                                       | トレードオフ                                                 |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | 通常の PR 証明、コールドマシン、CI        | VM 内で `pnpm install --frozen-lockfile --prefer-offline` と `pnpm build` を実行します | 最も遅いが、最も強いソースチェックアウト証明                 |
| `prehydrated` | 再利用リースを意図的に準備した場合 | 既存の `node_modules` と `dist/` が必要です。インストール/ビルドをスキップします                     | 高速ですが、オペレーター管理のウォームリースに対してのみ有効です |

GitHub Actions は VM 実行前に常に候補チェックアウトを準備します。その pnpm ストアは OS、Node バージョン、ロックファイルでキャッシュされます。VM ソース実行も、存在する場合は `/var/cache/crabbox/pnpm` を使用します。

## タイミングの解釈

`mantis-slack-desktop-smoke-report.md` にはフェーズごとのタイミングが含まれます。

- `crabbox.warmup`: クラウドプロバイダーの起動、デスクトップ/ブラウザーの準備完了、SSH。
- `crabbox.inspect`: リースメタデータの検索。
- `credentials.prepare`: Convex 認証情報リースの取得。
- `crabbox.remote_run`: 同期、ブラウザー起動、OpenClaw のインストール/ビルドまたはハイドレート検証、Gateway 起動、スクリーンショット、動画キャプチャ。
- `artifacts.copy`: VM からの rsync 戻し。

Mantis が OpenClaw Gateway が生きていてセットアップが完了したことを証明するメタデータをコピーした後に Crabbox がゼロ以外のリモートステータスを返した場合、`crabbox.remote_run` は `accepted` とマークされることがあります。`accepted` は失敗したシナリオではなく、説明付きの合格として扱ってください。

実行が遅い場合:

- warmup が支配的: より良い Crabbox プロバイダーイメージを事前焼き込みするか昇格します;
- `source` で remote_run が支配的: ウォームリースを使用する、pnpm ストア再利用を改善する、またはマシン前提条件をプロバイダーイメージに移動します;
- `prehydrated` で remote_run が支配的: リモートワークスペースが実際には準備できていない、または Gateway/ブラウザー/Slack セットアップが遅い状態です;
- アーティファクトコピーが支配的: 動画サイズとアーティファクトディレクトリの内容を調べます。

## 証拠チェックリスト

良い PR コメントには以下を表示する必要があります。

- シナリオ ID と候補 SHA;
- GitHub Actions 実行 URL;
- アーティファクト URL;
- インラインスクリーンショット;
- 利用可能な場合はインラインアニメーションプレビュー;
- 完全な MP4 とトリミング済み MP4 のリンク;
- 合格/失敗ステータス;
- 添付レポート内のタイミング概要。

スクリーンショットや動画をリポジトリにコミットしないでください。GitHub Actions アーティファクトまたは PR コメントに保持します。

## 失敗時の処理

ワークフローが VM 実行前に失敗した場合は、まず Actions ジョブを調べます。典型的な原因は、信頼されていない `candidate_ref`、環境シークレットの不足、または候補のインストール/ビルド失敗です。

VM 実行が失敗したもののスクリーンショットがコピーし戻されている場合は、以下を調べます。

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

実行がリースを保持していた場合は、レポートの `crabbox vnc ...` コマンドで VNC を開きます。完了したらリースを停止します。

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Slack ログインの有効期限が切れた場合は、保持されたリース上の VNC で修復し、`--lease-id` で再実行します。そのブラウザープロファイルをプロバイダーイメージに焼き込まないでください。

## 関連

- [QA 概要](/ja-JP/concepts/qa-e2e-automation)
- [Slack チャンネル](/ja-JP/channels/slack)
- [テスト](/ja-JP/help/testing)

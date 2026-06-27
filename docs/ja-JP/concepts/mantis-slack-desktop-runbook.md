---
read_when:
    - GitHub またはローカルから Mantis Slack デスクトップ QA を実行する
    - Mantis Slack デスクトップ実行が遅い場合のデバッグ
    - source、prehydrated、warm-lease モードの選択
    - PR にスクリーンショットと動画の証拠を投稿する
summary: 'Mantis Slack デスクトップ QA のためのオペレーター用ランブック: GitHub dispatch、ローカル CLI、ウォーム VNC リース、hydrate モード、タイミングの解釈、アーティファクト、失敗時の処理。'
title: Mantis Slack デスクトップ ランブック
x-i18n:
    generated_at: "2026-06-27T11:09:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9310b460a4da84afab72f9e5b5515a94e74b4f4a5030332bd2021d60deb07cc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack デスクトップ QA は、Linux デスクトップ、VNC レスキュー、Slack Web、実際の OpenClaw gateway、スクリーンショット、動画、PR エビデンスコメントを必要とする Slack クラスのバグ向けの実 UI レーンです。

ユニットテストやヘッドレス Slack ライブレーンではバグを証明できない場合に使用します。

## ストレージモデル

Mantis は 3 つの異なるストレージ層を使用します。

- プロバイダーイメージ: Crabbox が所有し、クラウドプロバイダーアカウントに保存されます。
  Chrome/Chromium、ffmpeg、scrot、Node/corepack/pnpm、ネイティブビルドツール、空のキャッシュディレクトリなどのマシン機能を含みます。
- ウォームリース状態: 現在のオペレーターセッションが所有します。リースが有効な間、ログイン済みブラウザプロファイル、`/var/cache/crabbox/pnpm`、準備済みソースチェックアウトを含められます。
- Mantis アーティファクト: OpenClaw 実行が所有します。`.artifacts/qa-e2e/mantis/...` 配下に置かれ、その後 GitHub Actions がアップロードし、Mantis GitHub App が PR にインラインエビデンスをコメントします。

シークレット、ブラウザ Cookie、Slack ログイン状態、リポジトリチェックアウト、`node_modules`、`dist/` を事前ベイク済みプロバイダーイメージに入れてはいけません。

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

許可される `candidate_ref` の値は、ワークフローがライブ認証情報を使用するため意図的に狭くされています。現在の `main` の祖先、リリースタグ、または `openclaw/openclaw` からのオープン PR head です。

ワークフローは次を書き込みます。

- アップロードされたアーティファクト: `mantis-slack-desktop-smoke-<run-id>-<attempt>`;
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

再利用するリモートワークスペースにすでに `node_modules` とビルド済み `dist/` がある場合にのみ、`--hydrate-mode prehydrated` を使用します。それらがない場合、Mantis は安全側に失敗します。

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

承認チェックポイントモードは `--gateway-setup` と同時に使用できません。明示的な承認チェックポイント `--scenario` フラグを渡さない限り、オプトインの `slack-approval-exec-native` と `slack-approval-plugin-native` シナリオを実行します。他の Slack シナリオは VM が起動する前に拒否されます。Slack QA ランナーは、観測した実際の Slack API メッセージから各チェックポイント JSON ファイルを書き込み、その後リモートウォッチャーがそのメッセージスナップショットを `approval-checkpoints/<scenario>-pending.png` と `approval-checkpoints/<scenario>-resolved.png` にレンダリングします。チェックポイント JSON、メッセージエビデンス、ack JSON、レンダリング済みスクリーンショットのいずれかが欠落または空の場合、実行は失敗します。

コールド GitHub Actions リースには Slack Web Cookie がないため、ブラウザキャプチャが Slack サインイン画面に到達することがあります。承認チェックポイント証明では、`slack-desktop-smoke.png` ではなく、レンダリング済みチェックポイント画像と Slack QA アーティファクトを信頼してください。ブラウザスクリーンショット自体に Slack Web を表示する必要がある場合にのみ、手動でログインした Slack Web プロファイルを持つ保持済みウォームリースを使用します。

## ハイドレートモード

| モード          | 使用する場合                                  | リモート動作                                                                       | トレードオフ                                                 |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | 通常の PR 証明、コールドマシン、CI        | VM 内で `pnpm install --frozen-lockfile --prefer-offline` と `pnpm build` を実行します | 最も遅いが、最も強いソースチェックアウト証明                 |
| `prehydrated` | 再利用リースを意図的に準備済みの場合 | 既存の `node_modules` と `dist/` を要求し、install/build をスキップします                     | 高速だが、オペレーター管理のウォームリースでのみ有効 |

GitHub Actions は常に VM 実行の前に候補チェックアウトを準備します。その pnpm ストアは OS、Node バージョン、lockfile によってキャッシュされます。VM のソース実行も、存在する場合は `/var/cache/crabbox/pnpm` を使用します。

## タイミングの解釈

`mantis-slack-desktop-smoke-report.md` にはフェーズタイミングが含まれます。

- `crabbox.warmup`: クラウドプロバイダーの起動、デスクトップ/ブラウザの準備完了、SSH。
- `crabbox.inspect`: リースメタデータの検索。
- `credentials.prepare`: Convex 認証情報リースの取得。
- `crabbox.remote_run`: 同期、ブラウザ起動、OpenClaw の install/build または hydrate 検証、gateway 起動、スクリーンショット、動画キャプチャ。
- `artifacts.copy`: VM から rsync で戻す処理。

Mantis が OpenClaw gateway セットアップの完了、または Slack QA コマンド自体の正常終了を証明するメタデータをコピーした後に Crabbox がゼロ以外のリモートステータスを返した場合、`crabbox.remote_run` は `accepted` とマークされることがあります。`accepted` は失敗したシナリオではなく、説明付きの成功として扱ってください。

実行が遅い場合:

- warmup が支配的: より良い Crabbox プロバイダーイメージを事前ベイクまたは昇格する;
- `source` で remote_run が支配的: ウォームリースを使う、pnpm ストアの再利用を改善する、またはマシン前提条件をプロバイダーイメージへ移す;
- `prehydrated` で remote_run が支配的: リモートワークスペースが実際には準備できていない、または gateway/browser/Slack セットアップが遅い;
- artifact copy が支配的: 動画サイズとアーティファクトディレクトリ内容を調べる。

## エビデンスチェックリスト

良い PR コメントには次を表示する必要があります。

- シナリオ ID と候補 SHA;
- GitHub Actions 実行 URL;
- アーティファクト URL;
- インライン承認チェックポイントスクリーンショット、またはログイン済みウォームリースからの Slack Web スクリーンショット;
- 利用可能な場合はインラインアニメーションプレビュー;
- フル MP4 とトリミング済み MP4 のリンク;
- 合否ステータス;
- 添付レポート内のタイミングサマリー。

スクリーンショットや動画をリポジトリにコミットしないでください。GitHub Actions アーティファクトまたは PR コメントに保持してください。

## 失敗時の対応

ワークフローが VM 実行前に失敗した場合は、まず Actions ジョブを調べます。典型的な原因は、信頼されていない `candidate_ref`、環境シークレットの欠落、または候補の install/build 失敗です。

VM 実行が失敗したがスクリーンショットがコピーされている場合は、次を調べます。

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

Slack ログインの有効期限が切れていた場合は、保持済みリース上の VNC で修復し、`--lease-id` で再実行します。そのブラウザプロファイルをプロバイダーイメージにベイクしないでください。

## 関連

- [QA 概要](/ja-JP/concepts/qa-e2e-automation)
- [Slack チャンネル](/ja-JP/channels/slack)
- [テスト](/ja-JP/help/testing)

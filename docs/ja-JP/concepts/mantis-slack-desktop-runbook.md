---
read_when:
    - GitHub またはローカルから Mantis Slack デスクトップ QA を実行する
    - Mantis Slack デスクトップ実行が遅い場合のデバッグ
    - ソース、事前ハイドレーション済み、またはウォームリースモードの選択
    - PR にスクリーンショットと動画の証拠を投稿する
summary: 'Mantis Slack デスクトップ QA 向けのオペレーターランブック: GitHub dispatch、ローカル CLI、ウォーム VNC リース、ハイドレートモード、タイミング解釈、アーティファクト、失敗時の処理。'
title: Mantis Slack デスクトップランブック
x-i18n:
    generated_at: "2026-07-05T11:16:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3e956d99fc43a7b6fe65e2e820812b0e0e8b9e32badd25be27c74d302ab30dc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack デスクトップ QA は、Linux デスクトップ、VNC レスキュー、Slack Web、実際の OpenClaw gateway、スクリーンショット、動画、PR エビデンスコメントが必要な Slack 系バグ向けの実 UI レーンです。単体テストやヘッドレスの Slack ライブレーンでバグを証明できない場合に使用します。

## ストレージモデル

Mantis は 3 つのストレージレイヤーを使用します。

- **プロバイダーイメージ** - Crabbox が所有し、クラウドプロバイダーアカウントに保存されます。
  マシン機能 (Chrome/Chromium、ffmpeg、scrot、
  Node/corepack/pnpm、ネイティブビルドツール) と空のキャッシュディレクトリを保持します。
- **ウォームリース状態** - 現在のオペレーターセッションが所有します。リースが有効な間は、
  ログイン済みブラウザープロファイル、`/var/cache/crabbox/pnpm`、準備済みのソース
  チェックアウトを保持できます。
- **Mantis アーティファクト** - OpenClaw 実行が所有します。
  `.artifacts/qa-e2e/mantis/...` 配下に配置されます。GitHub Actions がそれらをアップロードし、Mantis
  GitHub App が PR にインラインエビデンスをコメントします。

シークレット、ブラウザー Cookie、Slack ログイン状態、リポジトリチェックアウト、
`node_modules`、`dist/` をプロバイダーイメージに埋め込まないでください。

## GitHub dispatch

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

`candidate_ref` は、ワークフローがライブ認証情報を使用するため制限されています。現在の `main` の祖先、リリースタグ、または
`openclaw/openclaw` のオープン PR head に解決される必要があります。

ワークフローは次を生成します。

- アップロード済みアーティファクト `mantis-slack-desktop-smoke-<run-id>-<attempt>`
- Mantis GitHub App からのインライン PR コメント
- `slack-desktop-smoke.png`, `slack-desktop-smoke.mp4`
- `slack-desktop-smoke-preview.gif`, `slack-desktop-smoke-change.mp4`
- `mantis-slack-desktop-smoke-summary.json`, `mantis-slack-desktop-smoke-report.md`
- リモートログ: `slack-desktop-command.log`, `openclaw-gateway.log`, `chrome.log`, `ffmpeg.log`

PR コメントは、非表示の `<!-- mantis-slack-desktop-smoke -->` マーカーを使って同じ場所で更新されます。

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

`--hydrate-mode prehydrated` は、再利用するリモートワークスペースにすでに
`node_modules` とビルド済みの `dist/` がある場合にのみ使用してください。それ以外の場合、Mantis は fail closed します。

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

`--approval-checkpoints` は `--gateway-setup` と同時に使用できません。明示的な承認チェックポイント
`--scenario` を渡さない限り、オプトインの `slack-approval-exec-native` と
`slack-approval-plugin-native` シナリオを実行します。それ以外の Slack シナリオは、VM が起動する前に拒否されます。Slack QA ランナーは、観測した実際の Slack API メッセージから各チェックポイント JSON ファイルを書き込み、その後リモートウォッチャーがそのメッセージを
`approval-checkpoints/<scenario>-pending.png` と
`approval-checkpoints/<scenario>-resolved.png` にレンダリングします。いずれかのチェックポイント JSON、メッセージエビデンス、ack JSON、またはレンダリング済みスクリーンショットが欠落しているか空の場合、実行は失敗します。

コールド GitHub Actions リースには Slack Web Cookie がないため、ブラウザーキャプチャが Slack サインイン画面になる場合があります。承認チェックポイント証明では、
`slack-desktop-smoke.png` ではなく、レンダリング済みチェックポイント画像と Slack QA アーティファクトを信頼してください。ブラウザースクリーンショット自体で Slack Web を表示する必要がある場合にのみ、手動でログイン済みの Slack Web プロファイルを持つ保持済みウォームリースを使用してください。

## Hydrate モード

| モード          | 使用する場合                                  | リモートでの動作                                                                       | トレードオフ                                                 |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | 通常の PR 証明、コールドマシン、CI        | VM 内で `pnpm install --frozen-lockfile --prefer-offline` と `pnpm build` を実行します | 最も遅いが、最も強いソースチェックアウト証明                 |
| `prehydrated` | 再利用リースを意図的に準備済みの場合 | 既存の `node_modules` と `dist/` を要求し、インストールとビルドをスキップします                     | 高速ですが、オペレーターが制御するウォームリースでのみ有効です |

GitHub Actions は、VM 実行前に常に候補チェックアウトを準備します。その pnpm ストアは、OS、Node バージョン、ロックファイルでキャッシュされます。VM の `source` 実行も、存在する場合は `/var/cache/crabbox/pnpm` を再利用します。

## タイミングの解釈

`mantis-slack-desktop-smoke-report.md` にはフェーズごとのタイミングが含まれます。

- `crabbox.warmup` - クラウドプロバイダーの起動、デスクトップ/ブラウザーの準備完了、SSH。
- `crabbox.inspect` - リースメタデータの参照。
- `credentials.prepare` - Convex 認証情報リースの取得。
- `crabbox.remote_run` - 同期、ブラウザー起動、OpenClaw インストール/ビルドまたは
  hydrate 検証、gateway 起動、スクリーンショット、動画キャプチャ。
- `artifacts.copy` - VM からの rsync によるコピー戻し。

Crabbox がゼロ以外のリモートステータスを返したものの、Mantis が OpenClaw gateway セットアップ完了または Slack QA コマンド自体の正常終了を証明するメタデータをコピーできた場合、
`crabbox.remote_run` は `accepted` を表示することがあります。`accepted` は失敗シナリオではなく、説明付きの成功として扱ってください。

実行が遅い場合:

- ウォームアップが支配的: より良い Crabbox プロバイダーイメージを事前に焼き込むか昇格します。
- `source` で `remote_run` が支配的: ウォームリースを使用するか、pnpm ストアの再利用を改善するか、マシン前提条件をプロバイダーイメージへ移します。
- `prehydrated` で `remote_run` が支配的: リモートワークスペースが実際には準備できていなかったか、gateway/ブラウザー/Slack セットアップが遅い状態です。
- アーティファクトコピーが支配的: 動画サイズとアーティファクトディレクトリの内容を確認します。

## エビデンスチェックリスト

良い PR コメントには次が表示されます。

- シナリオ ID と候補 SHA
- GitHub Actions 実行 URL とアーティファクト URL
- インライン承認チェックポイントスクリーンショット、またはログイン済みウォームリースからの Slack Web スクリーンショット
- 利用可能な場合のインラインアニメーションプレビュー
- フル MP4 とトリミング済み MP4 のリンク
- 成功/失敗ステータスとレポートのタイミングサマリー

スクリーンショットや動画をリポジトリにコミットしないでください。それらは GitHub Actions アーティファクトまたは PR コメントに保持してください。

## 失敗時の対応

VM 実行前にワークフローが失敗した場合は、まず Actions ジョブを確認します。
一般的な原因: 信頼されていない `candidate_ref`、環境シークレットの欠落、候補のインストール/ビルド失敗。

VM 実行は失敗したがスクリーンショットがコピーされている場合は、次を確認します。

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

実行がリースを保持した場合は、レポートの `crabbox vnc ...` コマンドで VNC を開き、完了後にリースを停止します。

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Slack ログインの有効期限が切れている場合は、保持済みリース上の VNC で修復し、
`--lease-id` を使って再実行します。そのブラウザープロファイルをプロバイダーイメージに埋め込まないでください。

## 関連

- [QA 概要](/ja-JP/concepts/qa-e2e-automation)
- [Slack チャンネル](/ja-JP/channels/slack)
- [テスト](/ja-JP/help/testing)

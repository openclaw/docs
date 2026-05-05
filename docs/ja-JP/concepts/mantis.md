---
read_when:
    - OpenClaw のバグ向けライブ視覚的品質保証の構築または実行
    - プルリクエストに変更前後の検証を追加する
    - Discord、Slack、WhatsApp、またはその他のライブトランスポートシナリオの追加
    - スクリーンショット、ブラウザー自動化、または VNC アクセスが必要な QA 実行のデバッグ
summary: Mantis は、ライブトランスポート上で OpenClaw のバグを再現し、修正前後のエビデンスをキャプチャし、アーティファクトを PR に添付するための視覚的なエンドツーエンド検証システムです。
title: カマキリ
x-i18n:
    generated_at: "2026-05-05T08:25:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b287e2832e3e49de6b3cb65aeb1d381a36fc30ce9c94dc5b6b4d7e928c2706c
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis は、実際のランタイム、実際のトランスポート、可視の証拠を必要とするバグのための OpenClaw エンドツーエンド検証システムです。既知の不正 ref に対してシナリオを実行して証拠を取得し、同じシナリオを候補 ref に対して実行して、その比較をメンテナーが PR またはローカルコマンドから確認できるアーティファクトとして公開します。

Mantis は Discord から始まります。Discord は、実際の bot 認証、実際のギルドチャンネル、リアクション、スレッド、ネイティブコマンド、人間がトランスポートに表示された内容を視覚的に確認できるブラウザー UI という、高価値な最初のレーンを提供するためです。

## 目標

- GitHub issue または PR のバグを、ユーザーが見るものと同じトランスポート形状で再現する。
- 修正を適用する前に、ベースライン ref 上で **修正前** アーティファクトを取得する。
- 修正を適用した後に、候補 ref 上で **修正後** アーティファクトを取得する。
- 可能な限り、Discord REST リアクション読み取りやチャンネルトランスクリプト確認などの決定的オラクルを使用する。
- バグに可視の UI サーフェスがある場合はスクリーンショットを取得する。
- エージェント制御の CLI からローカルで実行し、GitHub からリモートで実行する。
- ログイン、ブラウザー自動化、またはプロバイダー認証が詰まったときに VNC で救出できるよう、十分なマシン状態を保持する。
- 実行がブロックされた場合、手動 VNC 支援が必要な場合、または完了した場合に、オペレーター用 Discord チャンネルへ簡潔なステータスを投稿する。

## 非目標

- Mantis はユニットテストの代替ではありません。Mantis 実行は通常、修正が理解された後に、より小さな回帰テストへ落とし込まれるべきです。
- Mantis は通常の高速 CI ゲートではありません。より遅く、ライブ認証情報を使用し、ライブ環境が重要なバグに限定されます。
- Mantis は通常運用で人間を必要とするべきではありません。手動 VNC は救出経路であり、正常系ではありません。
- Mantis はアーティファクト、ログ、スクリーンショット、Markdown レポート、PR コメントに raw シークレットを保存しません。

## 所有範囲

Mantis は OpenClaw QA スタックに属します。

- OpenClaw は、`pnpm openclaw qa mantis` 配下のシナリオランタイム、トランスポートアダプター、証拠スキーマ、ローカル CLI を所有する。
- QA Lab は、ライブトランスポートハーネスの部品、ブラウザー取得ヘルパー、アーティファクトライターを所有する。
- Crabbox は、リモート VM が必要な場合のウォーム済み Linux マシンを所有する。
- GitHub Actions は、リモートワークフローのエントリーポイントとアーティファクト保持を所有する。
- ClawSweeper は、GitHub コメントのルーティング、つまりメンテナーコマンドの解析、ワークフローのディスパッチ、最終 PR コメントの投稿を所有する。
- OpenClaw エージェントは、シナリオにエージェント的なセットアップ、デバッグ、または詰まり状態の報告が必要な場合に、Codex 経由で Mantis を操作する。

この境界により、トランスポートの知識は OpenClaw に、マシンスケジューリングは Crabbox に、メンテナーワークフローの接着部分は ClawSweeper に保たれます。

## コマンド形式

最初のローカルコマンドは、Discord bot、ギルド、チャンネル、メッセージ送信、リアクション送信、アーティファクトパスを検証します。

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

ローカルの修正前/修正後ランナーは、次の形状を受け付けます。

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

ランナーは、出力ディレクトリ配下に detached なベースラインおよび候補 worktree を作成し、依存関係をインストールし、各 ref をビルドし、`--allow-failures` 付きでシナリオを実行してから、`baseline/`、`candidate/`、`comparison.json`、`mantis-report.md` を書き込みます。最初の Discord シナリオでは、検証成功はベースラインステータスが `fail`、候補ステータスが `pass` であることを意味します。

最初の VM/ブラウザープリミティブはデスクトップスモークです。

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

これは Crabbox デスクトップマシンをリースまたは再利用し、VNC セッション内で可視ブラウザーを起動し、デスクトップを取得し、アーティファクトをローカル出力ディレクトリへ戻し、再接続コマンドをレポートへ書き込みます。このコマンドは、Mantis レーンでデスクトップ/VNC カバレッジが動作している最初のプロバイダーであるため、デフォルトで Hetzner プロバイダーを使用します。別の Crabbox フリートに対して実行するときは、`--provider`、`--crabbox-bin`、または `OPENCLAW_MANTIS_CRABBOX_PROVIDER` で上書きします。

有用なデスクトップスモークフラグ:

- `--lease-id <cbx_...>` または `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` は、ウォーム済みデスクトップを再利用します。
- `--browser-url <url>` は、可視ブラウザーで開くページを変更します。
- `--html-file <path>` は、repo-local な HTML アーティファクトを可視ブラウザーでレンダリングします。Mantis はこれを使って、生成された Discord ステータスリアクションのタイムラインを実際の Crabbox デスクトップ経由で取得します。
- `--keep-lease` または `OPENCLAW_MANTIS_KEEP_VM=1` は、新しく作成されて成功したリースを VNC 検査のために開いたままにします。失敗した実行では、オペレーターが再接続できるよう、リースが作成された場合はデフォルトで保持します。
- `--class`、`--idle-timeout`、`--ttl` は、マシンサイズとリース有効期間を調整します。

最初の完全なデスクトップトランスポートプリミティブは Slack デスクトップスモークです。

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

これは Crabbox デスクトップマシンをリースまたは再利用し、現在のチェックアウトを VM に同期し、その VM 内で `pnpm openclaw qa slack` を実行し、VNC ブラウザーで Slack Web を開き、可視デスクトップを取得し、Slack QA アーティファクトと VNC スクリーンショットの両方をローカル出力ディレクトリへコピーします。これは、SUT OpenClaw Gateway とブラウザーの両方が同じ Linux デスクトップ VM 内に存在する、最初の Mantis 形状です。

`--gateway-setup` を指定すると、このコマンドは `$HOME/.openclaw-mantis/slack-openclaw` に永続的な使い捨て OpenClaw home を準備し、選択したチャンネル向けに Slack Socket Mode 設定をパッチし、ポート `38973` で `openclaw gateway run` を起動し、VNC セッション内で Chrome を実行し続けます。これは「Slack と claw が動いている Linux デスクトップを残す」モードです。`--gateway-setup` を省略した場合は、bot-to-bot Slack QA レーンが引き続きデフォルトです。

`--credential-source env` に必要な入力:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- リモートモデルレーン用の `OPENCLAW_LIVE_OPENAI_KEY`。ローカルで `OPENAI_API_KEY` のみが設定されている場合、Mantis は Crabbox を呼び出す前にそれを `OPENCLAW_LIVE_OPENAI_KEY` へマッピングし、Crabbox の `OPENCLAW_*` env 転送で VM 内へ運べるようにします。

有用な Slack デスクトップフラグ:

- `--lease-id <cbx_...>` は、オペレーターがすでに VNC 経由で Slack Web にログインしたマシンに対して再実行します。
- `--gateway-setup` は、bot-to-bot QA レーンのみを実行する代わりに、VM 内で永続的な OpenClaw Slack Gateway を起動します。
- `--slack-url <url>` は、特定の Slack Web URL を開きます。指定しない場合、SUT bot token が利用可能なら、Mantis は Slack `auth.test` から `https://app.slack.com/client/<team>/<channel>` を導出します。
- `--slack-channel-id <id>` は、Gateway セットアップで使用される Slack チャンネル allowlist を制御します。
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` は、VM 内の永続 Chrome プロファイルを制御します。デフォルトは `$HOME/.config/openclaw-mantis/slack-chrome-profile` なので、手動の Slack Web ログインは同じリース上の再実行でも保持されます。
- `--credential-source convex --credential-role ci` は、直接の Slack env token ではなく共有認証情報プールを使用します。
- `--provider-mode`、`--model`、`--alt-model`、`--fast` は、Slack ライブレーンへそのまま渡されます。

GitHub スモークワークフローは `Mantis Discord Smoke` です。最初の実シナリオの修正前/修正後 GitHub ワークフローは `Mantis Discord Status Reactions` です。これは次を受け付けます。

- `baseline_ref`: queued-only の動作を再現することが期待される ref。
- `candidate_ref`: `queued -> thinking -> done` を表示することが期待される ref。

これはワークフローハーネス ref をチェックアウトし、ベースラインと候補の worktree を別々にビルドし、各 worktree に対して `discord-status-reactions-tool-only` を実行し、`baseline/`、`candidate/`、`comparison.json`、`mantis-report.md` を Actions アーティファクトとしてアップロードします。また、各レーンのタイムライン HTML を Crabbox デスクトップブラウザーでレンダリングし、それらの VNC スクリーンショットを、決定的なタイムライン PNG と並べて PR コメントに公開します。同じ PR コメントには、`crabbox media preview` で生成された軽量な motion-trimmed GIF プレビューを埋め込み、対応する motion-trimmed MP4 クリップへリンクし、詳細検査用に完全なデスクトップ MP4 ファイルを保持します。スクリーンショットは素早くレビューできるよう inline のままにします。このワークフローは、次の Crabbox バイナリリリースが切られる前に現在のデスクトップ/ブラウザーリースフラグを使用できるよう、`openclaw/crabbox` main から Crabbox CLI をビルドします。

`Mantis Scenario` は汎用の手動エントリーポイントです。`scenario_id`、`candidate_ref`、任意の `baseline_ref`、任意の `pr_number` を受け取り、シナリオ所有のワークフローをディスパッチします。このラッパーは意図的に薄く保たれています。シナリオワークフローは引き続き、自身のトランスポートセットアップ、認証情報、VM クラス、期待オラクル、アーティファクトマニフェストを所有します。

`Mantis Slack Desktop Smoke` は最初の Slack VM ワークフローです。信頼済みの候補 ref を別の worktree にチェックアウトし、Crabbox Linux デスクトップをリースし、その候補に対して `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` を実行し、VNC ブラウザーで Slack Web を開き、デスクトップを録画し、`crabbox media preview` で motion-trimmed プレビューを生成し、完全なアーティファクトディレクトリをアップロードし、必要に応じて対象 PR に inline 証拠コメントを投稿します。bot-to-bot Slack トランスクリプトのみではなく、「Slack と claw が動いている Linux デスクトップ」が欲しい場合にこのレーンを使用します。

PR 公開シナリオはすべて、レポートの隣に `mantis-evidence.json` を書き込みます。このスキーマは、シナリオコードと GitHub コメントの間の引き渡しです。

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord Status Reactions QA",
  "summary": "Human-readable top summary for the PR comment.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "queued-only" },
    "candidate": { "sha": "...", "status": "pass", "expected": "queued -> thinking -> done" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Baseline queued-only",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Baseline Discord timeline",
      "width": 420
    }
  ]
}
```

アーティファクトの `path` 値は、マニフェストディレクトリからの相対パスです。`targetPath` 値は、`qa-artifacts` ブランチの公開ディレクトリ配下の相対パスです。公開ツールはパストラバーサルを拒否し、任意のプレビューまたは動画が利用できない場合は `"required": false` とマークされたエントリをスキップします。

対応しているアーティファクト種別:

- `timeline`: 決定的なシナリオスクリーンショット。通常は修正前/修正後。
- `desktopScreenshot`: VNC/ブラウザーデスクトップスクリーンショット。
- `motionPreview`: デスクトップ録画から生成された inline アニメーション GIF。
- `motionClip`: 静的な冒頭と末尾を除去した motion-trimmed MP4。
- `fullVideo`: 詳細検査用の完全な MP4 録画。
- `metadata`: JSON/log サイドカー。
- `report`: Markdown レポート。

再利用可能な公開ツールは `scripts/mantis/publish-pr-evidence.mjs` です。ワークフローは、マニフェスト、対象 PR、`qa-artifacts` 対象ルート、コメントマーカー、Actions アーティファクト URL、実行 URL、リクエストソースを指定してこれを呼び出します。これは宣言されたアーティファクトを `qa-artifacts` ブランチへコピーし、inline 画像/プレビューとリンク付き動画を含む summary-first な PR コメントを構築してから、既存のマーカーコメントを更新するか新規作成します。

PR コメントから status-reactions 実行を直接トリガーすることもできます。

```text
@Mantis discord status reactions
```

コメントトリガーは意図的に狭く作られています。これは、write、maintain、または admin アクセスを持つユーザーによる pull request コメントでのみ実行され、Discord status-reaction リクエストのみを認識します。デフォルトでは、既知の不正ベースライン ref と現在の PR head SHA を候補として使用します。メンテナーはいずれの ref も上書きできます。

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper コマンド例:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

最初のコマンドは明示的で、シナリオに焦点を当てています。2番目は後で、ラベル、変更ファイル、ClawSweeper レビュー結果から、PR
または issue を推奨 Mantis シナリオに対応付けられます。

## 実行ライフサイクル

1. 認証情報を取得する。
2. VM を割り当てるか再利用する。
3. シナリオで UI エビデンスが必要な場合は、デスクトップまたはブラウザプロファイルを準備する。
4. ベースライン ref 用のクリーンなチェックアウトを準備する。
5. 依存関係をインストールし、シナリオに必要なものだけをビルドする。
6. 分離された状態ディレクトリで子 OpenClaw Gateway を起動する。
7. ライブトランスポート、プロバイダー、モデル、ブラウザプロファイルを設定する。
8. シナリオを実行し、ベースラインのエビデンスを取得する。
9. Gateway を停止し、ログを保存する。
10. 同じ VM で候補 ref を準備する。
11. 同じシナリオを実行し、候補のエビデンスを取得する。
12. オラクル結果と視覚的エビデンスを比較する。
13. Markdown、JSON、ログ、スクリーンショット、任意のトレースアーティファクトを書き出す。
14. GitHub Actions アーティファクトをアップロードする。
15. 簡潔な PR または Discord ステータスメッセージを投稿する。

シナリオは、2つの異なる方法で失敗できる必要があります。

- **バグ再現**: ベースラインが期待どおりの形で失敗した。
- **ハーネス失敗**: 環境セットアップ、認証情報、Discord API、ブラウザ、または
  プロバイダーが、バグオラクルに意味が出る前に失敗した。

最終レポートでは、保守担当者が不安定な環境と製品動作を混同しないように、これらのケースを分ける必要があります。

## Discord の MVP

最初のシナリオは、ソース返信配信モードが `message_tool_only` のギルドチャンネルにおける Discord ステータスリアクションを対象にする必要があります。

これが Mantis のよい初期シードである理由:

- トリガー元メッセージ上のリアクションとして Discord に表示される。
- Discord メッセージリアクション状態を通じた強力な REST オラクルがある。
- 実際の OpenClaw Gateway、Discord ボット認証、メッセージディスパッチ、
  ソース返信配信モード、ステータスリアクション状態、モデルターンライフサイクルを実行する。
- 最初の実装を誠実に保てる程度に範囲が狭い。

想定されるシナリオ形状:

```yaml
id: discord-status-reactions-tool-only
transport: discord
baseline:
  expect:
    reproduced: true
candidate:
  expect:
    fixed: true
config:
  messages:
    ackReaction: "👀"
    ackReactionScope: "group-mentions"
    groupChat:
      visibleReplies: "message_tool"
    statusReactions:
      enabled: true
      timing:
        debounceMs: 0
discord:
  requireMention: true
  notifyChannel: operator-notify
evidence:
  rest:
    messageReactions: true
  browser:
    screenshotMessageRow: true
```

ベースラインのエビデンスは、キュー済みの確認リアクションは表示する一方で、tool-only モードでは
ライフサイクル遷移がないことを示す必要があります。候補のエビデンスは、`messages.statusReactions.enabled` が明示的に
true のときにライフサイクルステータスリアクションが実行されることを示す必要があります。

実行可能な最初のスライスは、オプトインの Discord ライブ QA シナリオです。

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

これは、常時有効なギルド処理、`visibleReplies:
"message_tool"`、`ackReaction: "👀"`、明示的なステータスリアクションで SUT を設定します。オラクルは
実際の Discord トリガーメッセージをポーリングし、観測されたシーケンス
`👀 -> 🤔 -> 👍` を期待します。アーティファクトには `discord-qa-reaction-timelines.json`、
`discord-status-reactions-tool-only-timeline.html`、および
`discord-status-reactions-tool-only-timeline.png` が含まれます。

## 既存の QA 構成要素

Mantis はゼロから始めるのではなく、既存のプライベート QA スタックの上に構築する必要があります。

- `pnpm openclaw qa discord` は、ドライバーと SUT ボットを使うライブ Discord レーンをすでに実行する。
- ライブトランスポートランナーは、レポートと観測メッセージの
  アーティファクトを `.artifacts/qa-e2e/` 配下にすでに書き出す。
- Convex 認証情報リースは、共有ライブ
  トランスポート認証情報への排他的アクセスをすでに提供する。
- ブラウザ制御サービスは、スクリーンショット、スナップショット、
  ヘッドレス管理プロファイル、リモート CDP プロファイルをすでにサポートしている。
- QA Lab には、トランスポート形状のテスト用デバッガー UI とバスがすでにある。

最初の Mantis 実装は、これらの構成要素に対する薄い before/after ランナーと、
1つの視覚的エビデンス層で構成できます。

## エビデンスモデル

すべての実行は、安定したアーティファクトディレクトリを書き出します。

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-summary.json
  baseline/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  candidate/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  comparison.json
  run.log
```

`mantis-summary.json` は、機械可読な信頼できる情報源である必要があります。
Markdown レポートは PR コメントと人間によるレビュー用です。

サマリーには次を含める必要があります。

- テストした ref と SHA
- トランスポートとシナリオ ID
- マシンプロバイダーとマシン ID またはリース ID
- シークレット値を含まない認証情報ソース
- ベースライン結果
- 候補結果
- バグがベースラインで再現したかどうか
- 候補がそれを修正したかどうか
- アーティファクトパス
- サニタイズ済みのセットアップまたはクリーンアップ問題

スクリーンショットはエビデンスであり、シークレットではありません。それでも秘匿化の規律が必要です。
非公開チャンネル名、ユーザー名、またはメッセージ内容が含まれる可能性があります。公開 PR では、
秘匿化の話がより強固になるまで、インライン画像より GitHub Actions アーティファクトリンクを優先します。

## ブラウザと VNC

ブラウザレーンには2つのモードがあります。

- **ヘッドレス自動化**: CI のデフォルト。Chrome は CDP を有効にして実行され、
  Playwright または OpenClaw ブラウザ制御がスクリーンショットを取得する。
- **VNC レスキュー**: ログイン、MFA、Discord の自動化対策、
  または視覚的デバッグで人間が必要な場合に、同じ VM 上で有効にする。

Discord オブザーバーブラウザプロファイルは、毎回ログインしなくて済む程度に永続的である必要がありますが、
個人のブラウザ状態からは分離されている必要があります。プロファイルは開発者のラップトップではなく、
Mantis マシンプールに属します。

Mantis が停止した場合、次を含む Discord ステータスメッセージを投稿します。

- 実行 ID
- シナリオ ID
- マシンプロバイダー
- アーティファクトディレクトリ
- 利用可能な場合は VNC または noVNC 接続手順
- 短いブロッカー説明

最初のプライベートデプロイメントでは、これらのメッセージを既存のオペレーターチャンネルに投稿し、後で専用の Mantis チャンネルに移行できます。

## マシン

Mantis は最初のリモート実装で Crabbox 経由の AWS を優先する必要があります。
Crabbox は、ウォーム済みマシン、リース追跡、ハイドレーション、ログ、結果、
クリーンアップを提供します。AWS の容量が遅すぎる、または利用できない場合は、同じマシンインターフェイスの背後に Hetzner プロバイダーを追加します。

最小 VM 要件:

- デスクトップ対応 Chrome または Chromium がインストールされた Linux
- ブラウザ自動化用の CDP アクセス
- レスキュー用の VNC または noVNC
- Node 22 と pnpm
- OpenClaw チェックアウトと依存関係キャッシュ
- Playwright を使用する場合は Playwright Chromium ブラウザキャッシュ
- 1つの OpenClaw Gateway、1つのブラウザ、1つのモデル実行に十分な CPU とメモリ
- Discord、GitHub、モデルプロバイダー、認証情報ブローカーへのアウトバウンドアクセス

VM は、想定された認証情報ストアまたはブラウザプロファイルストアの外に、長期存続する生のシークレットを保持してはいけません。

## シークレット

シークレットは、リモート実行では GitHub 組織またはリポジトリシークレットに、ローカル実行では
ローカルのオペレーター管理シークレットファイルに置きます。

推奨シークレット名:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` for public GitHub artifact uploads
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

長期的には、Convex 認証情報プールがライブ
トランスポート認証情報の通常のソースであり続ける必要があります。GitHub シークレットはブローカーとフォールバックレーンをブートストラップします。
Discord ステータスリアクションワークフローは、Mantis Crabbox シークレットを
Crabbox CLI が期待する `CRABBOX_COORDINATOR` および `CRABBOX_COORDINATOR_TOKEN` 環境変数に対応付けます。プレーンな `CRABBOX_*` GitHub シークレット名も
互換性フォールバックとして引き続き受け付けます。

Mantis ランナーは、次を絶対に出力してはいけません。

- Discord ボットトークン
- プロバイダー API キー
- ブラウザ Cookie
- 認証プロファイル内容
- VNC パスワード
- 生の認証情報ペイロード

公開アーティファクトアップロードでは、ボット、
ギルド、チャンネル、メッセージ ID などの Discord ターゲットメタデータも秘匿化する必要があります。GitHub スモークワークフローは、この理由で
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` を有効にします。

トークンが誤って issue、PR、チャット、またはログに貼り付けられた場合は、
新しいシークレットが保存された後でローテーションします。

## GitHub アーティファクトと PR コメント

Mantis ワークフローは、完全なエビデンスバンドルを短命の Actions
アーティファクトとしてアップロードする必要があります。ワークフローがバグレポートまたは修正 PR に対して実行される場合は、
秘匿化済み PNG スクリーンショットも `qa-artifacts` ブランチに公開し、そのバグまたは修正 PR 上のコメントを upsert して、
インラインの before/after スクリーンショットを含める必要があります。一次証拠を汎用 QA 自動化 PR にだけ投稿してはいけません。生ログ、観測メッセージ、
その他の大きなエビデンスは Actions アーティファクトに残します。

本番ワークフローは、それらのコメントを `github-actions[bot]` ではなく
Mantis GitHub App で投稿する必要があります。アプリ ID と秘密鍵は
`MANTIS_GITHUB_APP_ID` および `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions
シークレットとして保存します。ワークフローは隠しマーカーを upsert キーとして使用し、
トークンが編集できる場合はそのコメントを更新し、古いボット所有マーカーを編集できない場合は
Mantis 所有の新しいコメントを作成します。

PR コメントは短く、視覚的である必要があります。

```md
Mantis Discord Status Reactions QA

Summary: Mantis reran the reported Discord status-reaction bug against the known
bad baseline and the candidate fix. The baseline reproduced the bug, while the
candidate showed the expected queued -> thinking -> done sequence.

- Scenario: `discord-status-reactions-tool-only`
- Run: <workflow run link>
- Artifact: <artifact link>
- Baseline: `<status>` at `<sha>`
- Candidate: `<status>` at `<sha>`

| Baseline            | Candidate           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

ハーネス失敗によって実行が失敗した場合、コメントは候補が失敗したと示唆するのではなく、
その旨を述べる必要があります。

## プライベートデプロイメントの注意事項

プライベートデプロイメントには、すでに Mantis Discord アプリケーションがある場合があります。適切なボット権限があり、
安全にローテーションできる場合は、別のアプリを作成せず、そのアプリケーションを再利用します。

初期のオペレーター通知チャンネルは、シークレットまたはデプロイメント設定で指定します。
最初は既存の保守担当者チャンネルまたは運用チャンネルを指し、専用の Mantis チャンネルができたらそこへ移動できます。

ギルド ID、チャンネル ID、ボットトークン、ブラウザ Cookie、または VNC パスワードをこのドキュメントに記載してはいけません。
それらは GitHub シークレット、認証情報ブローカー、または
オペレーターのローカルシークレットストアに保存します。

## シナリオの追加

Mantis シナリオは次を宣言する必要があります。

- ID とタイトル
- トランスポート
- 必要な認証情報
- ベースライン ref ポリシー
- 候補 ref ポリシー
- OpenClaw 設定パッチ
- セットアップ手順
- 刺激
- 期待されるベースラインオラクル
- 期待される候補オラクル
- 視覚的キャプチャ対象
- タイムアウト予算
- クリーンアップ手順

シナリオは、小さく型付けされたオラクルを優先する必要があります。

- リアクションバグには Discord リアクション状態
- スレッド化バグには Discord メッセージ参照
- Slack バグには Slack スレッド ts とリアクション API 状態
- メールバグにはメールメッセージ ID とヘッダー
- UI が唯一の信頼できる観測対象である場合はブラウザスクリーンショット

ビジョンチェックは追加的である必要があります。プラットフォーム API がバグを証明できる場合は、
API を合否オラクルとして使用し、スクリーンショットは人間の確信のために保持します。

## プロバイダー拡張

Discord の後、同じランナーで次を追加できます。

- Slack: リアクション、スレッド、アプリメンション、モーダル、ファイルアップロード。
- Email: コネクターだけでは不十分な場合の、`gog` を使用した Gmail 認証とメッセージスレッド化。
- WhatsApp: QR ログイン、再識別、メッセージ配信、メディア、リアクション。
- Telegram: グループメンションのゲート、コマンド、利用可能な場合のリアクション。
- Matrix: 暗号化されたルーム、スレッドまたは返信関係、再起動後の再開。

各トランスポートには、1 つの低コストなスモークシナリオと、1 つ以上のバグ種別シナリオを用意する必要があります。高コストなビジュアルシナリオはオプトインのままにする必要があります。

## 未解決の質問

- 既存の Mantis ボットを再利用する場合、どの Discord ボットをドライバーにし、どれを SUT にするべきか？
- オブザーバーのブラウザログインでは、最初のフェーズで人間の Discord アカウント、テストアカウント、またはボットで読み取り可能な REST 証拠のみのどれを使用するべきか？
- GitHub は PR の Mantis アーティファクトをどのくらい保持するべきか？
- ClawSweeper はメンテナーコマンドを待たずに、いつ自動的に Mantis を推奨するべきか？
- 公開 PR にアップロードする前に、スクリーンショットを墨消しまたはクロップするべきか？

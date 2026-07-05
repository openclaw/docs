---
read_when:
    - OpenClawを新しいノートパソコンまたはサーバーに移行する
    - 別のエージェントシステムから移行していて、状態を保持したい場合
    - インプレースの Plugin をアップグレードしている
summary: '移行ハブ: システム間インポート、マシン間移行、Plugin アップグレード'
title: 移行ガイド
x-i18n:
    generated_at: "2026-07-05T11:33:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7961f78bc654d328cb91a6ef982b6e47740fd831aec9249c8ffed3225dd0ccf
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw は3つの移行パスをサポートしています。別のエージェントシステムからのインポート、既存インストールの新しいマシンへの移動、Plugin のインプレースアップグレードです。

## 別のエージェントシステムからインポート

同梱の移行プロバイダーは、手順、MCP サーバー、Skills、モデル設定、（オプトインの）API キーを OpenClaw に取り込みます。変更前にプランがプレビューされ、レポート内のシークレットは伏せられ、適用処理は検証済みバックアップで保護されます。

<CardGroup cols={2}>
  <Card title="Claude から移行" href="/ja-JP/install/migrating-claude" icon="brain">
    `CLAUDE.md`、MCP サーバー、Skills、プロジェクトコマンドを含む Claude Code と Claude Desktop の状態をインポートします。
  </Card>
  <Card title="Hermes から移行" href="/ja-JP/install/migrating-hermes" icon="feather">
    Hermes の設定、プロバイダー、MCP サーバー、メモリ、Skills、サポート対象の `.env` キーをインポートします。
  </Card>
</CardGroup>

CLI のエントリーポイントは [`openclaw migrate`](/ja-JP/cli/migrate) です。オンボーディングでも、既知のソースを検出した場合に移行を提案できます（`openclaw onboard --flow import`）。

## OpenClaw を新しいマシンへ移動

**状態ディレクトリ**（デフォルトでは `~/.openclaw/`）と**ワークスペース**をコピーして、次を保持します。

- **設定** — `openclaw.json` とすべての Gateway 設定。
- **認証** — エージェントごとの `auth-profiles.json`（API キーと OAuth）、および `credentials/` 配下のチャンネルまたはプロバイダー状態。
- **セッション** — 会話履歴とエージェント状態。
- **チャンネル状態** — WhatsApp ログイン、Telegram セッションなど。
- **ワークスペースファイル** — `MEMORY.md`、`USER.md`、Skills、プロンプト。

<Tip>
古いマシンで `openclaw status` を実行して、状態ディレクトリのパスを確認します。カスタムプロファイルでは `~/.openclaw-<profile>/`、または `OPENCLAW_STATE_DIR` で設定したパスを使用します。
</Tip>

### 移行手順

<Steps>
  <Step title="Gateway を停止してバックアップ">
    **古い**マシンで、コピー中にファイルが変更されないよう Gateway を停止してから、アーカイブします。

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    複数のプロファイル（例: `~/.openclaw-work`）を使用している場合は、それぞれを個別にアーカイブします。

  </Step>

  <Step title="新しいマシンに OpenClaw をインストール">
    新しいマシンに CLI（必要であれば Node も）を[インストール](/ja-JP/install)します。オンボーディングで新しい `~/.openclaw/` が作成されても問題ありません。次の手順で上書きします。
  </Step>

  <Step title="状態ディレクトリとワークスペースをコピー">
    `scp`、`rsync -a`、または外部ドライブでアーカイブを転送し、展開します。

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    隠しディレクトリが含まれていること、ファイルの所有者が Gateway を実行するユーザーと一致していることを確認します。

  </Step>

  <Step title="doctor を実行して検証">
    新しいマシンで [Doctor](/ja-JP/gateway/doctor) を実行し、設定移行を適用してサービスを修復します。

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

Telegram または Discord がデフォルトの環境変数フォールバック（`TELEGRAM_BOT_TOKEN` または `DISCORD_BOT_TOKEN`）を使用している場合は、移行した状態ディレクトリの `.env` にそれらのキーが含まれていることを、シークレット値を出力せずに確認します。

```bash
awk -F= '/^(TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN)=/ { print $1 "=present" }' ~/.openclaw/.env
```

`openclaw doctor` は、有効なデフォルトの Telegram または Discord アカウントに設定済みトークンがなく、対応する環境変数を doctor プロセスが利用できない場合にも警告します。

### よくある落とし穴

<AccordionGroup>
  <Accordion title="プロファイルまたは状態ディレクトリの不一致">
    古い Gateway が `--profile` または `OPENCLAW_STATE_DIR` を使用していて、新しい Gateway がそれを使用していない場合、チャンネルはログアウト状態に見え、セッションは空になります。移行したものと**同じ**プロファイルまたは状態ディレクトリで Gateway を起動し、その後 `openclaw doctor` を再実行します。
  </Accordion>

  <Accordion title="openclaw.json だけをコピーしている">
    設定ファイルだけでは不十分です。モデル認証プロファイルは `agents/<agentId>/agent/auth-profiles.json` 配下にあり、チャンネルとプロバイダーの状態は `credentials/` 配下にあります。必ず**状態ディレクトリ全体**を移行してください。
  </Accordion>

  <Accordion title="権限と所有者">
    root でコピーした場合やユーザーを切り替えた場合、Gateway が認証情報を読み取れないことがあります。状態ディレクトリとワークスペースの所有者が、Gateway を実行するユーザーであることを確認します。
  </Accordion>

  <Accordion title="リモートモード">
    UI が**リモート** Gateway を参照している場合、セッションとワークスペースを所有しているのはリモートホストです。ローカルのノート PC ではなく、Gateway ホスト自体を移行してください。[FAQ](/ja-JP/help/faq#where-things-live-on-disk) を参照してください。
  </Accordion>

  <Accordion title="バックアップ内のシークレット">
    状態ディレクトリには、認証プロファイル、チャンネル認証情報、その他のプロバイダー状態が含まれます。バックアップは暗号化して保存し、安全でない転送経路を避け、漏えいが疑われる場合はキーをローテーションしてください。
  </Accordion>
</AccordionGroup>

### 検証チェックリスト

新しいマシンで、次を確認します。

- [ ] `openclaw status` で Gateway が実行中と表示される。
- [ ] チャンネルが引き続き接続されている（再ペアリング不要）。
- [ ] ダッシュボードが開き、既存のセッションが表示される。
- [ ] ワークスペースファイル（メモリ、設定）が存在する。

## Plugin をインプレースアップグレード

インプレースの Plugin アップグレードでは、同じ Plugin ID と設定キーを保持しつつ、ディスク上の状態を現在のレイアウトへ移動する場合があります。Plugin 固有のアップグレードガイドは、それぞれのチャンネルの近くにあります。

- [Matrix 移行](/ja-JP/channels/matrix-migration): 暗号化状態の復旧制限、自動スナップショット動作、手動復旧コマンド。

## 関連

- [`openclaw migrate`](/ja-JP/cli/migrate): システム間インポートの CLI リファレンス。
- [インストール概要](/ja-JP/install): すべてのインストール方法。
- [Doctor](/ja-JP/gateway/doctor): 移行後のヘルスチェック。
- [アンインストール](/ja-JP/install/uninstall): OpenClaw をきれいに削除する。

---
read_when:
    - OpenClaw を新しいノートパソコンまたはサーバーに移行する場合
    - 別のエージェントシステムから移行し、状態を維持したい場合
    - 既存の場所にあるPluginをアップグレードしています
summary: 移行ハブ：システム間インポート、マシン間移行、Plugin のアップグレード
title: 移行ガイド
x-i18n:
    generated_at: "2026-07-11T22:21:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7961f78bc654d328cb91a6ef982b6e47740fd831aec9249c8ffed3225dd0ccf
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw は、別のエージェントシステムからのインポート、既存のインストール環境の新しいマシンへの移行、Plugin のインプレースアップグレードという 3 つの移行パスをサポートしています。

## 別のエージェントシステムからインポートする

同梱の移行プロバイダーは、手順、MCP サーバー、Skills、モデル設定、オプトインの API キーを OpenClaw に取り込みます。変更前に計画がプレビューされ、レポートではシークレットが伏せられ、適用時には検証済みのバックアップが作成されます。

<CardGroup cols={2}>
  <Card title="Claude から移行" href="/ja-JP/install/migrating-claude" icon="brain">
    `CLAUDE.md`、MCP サーバー、Skills、プロジェクトコマンドを含む Claude Code と Claude Desktop の状態をインポートします。
  </Card>
  <Card title="Hermes から移行" href="/ja-JP/install/migrating-hermes" icon="feather">
    Hermes の設定、プロバイダー、MCP サーバー、メモリ、Skills、サポートされている `.env` キーをインポートします。
  </Card>
</CardGroup>

CLI のエントリーポイントは [`openclaw migrate`](/ja-JP/cli/migrate) です。既知の移行元を検出した場合、オンボーディングから移行を選択することもできます（`openclaw onboard --flow import`）。

## OpenClaw を新しいマシンに移行する

次のものを保持するには、**状態ディレクトリ**（デフォルトでは `~/.openclaw/`）と**ワークスペース**をコピーします。

- **設定** — `openclaw.json` とすべての Gateway 設定。
- **認証** — エージェントごとの `auth-profiles.json`（API キーと OAuth）、および `credentials/` 配下のチャンネルまたはプロバイダーの状態。
- **セッション** — 会話履歴とエージェントの状態。
- **チャンネルの状態** — WhatsApp のログイン、Telegram のセッションなど。
- **ワークスペースファイル** — `MEMORY.md`、`USER.md`、Skills、プロンプト。

<Tip>
古いマシンで `openclaw status` を実行し、状態ディレクトリのパスを確認します。カスタムプロファイルでは `~/.openclaw-<profile>/`、または `OPENCLAW_STATE_DIR` で設定されたパスを使用します。
</Tip>

### 移行手順

<Steps>
  <Step title="Gateway を停止してバックアップする">
    コピー中にファイルが変更されないよう、**古い**マシンで Gateway を停止してからアーカイブします。

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    複数のプロファイル（例：`~/.openclaw-work`）を使用している場合は、それぞれを個別にアーカイブします。

  </Step>

  <Step title="新しいマシンに OpenClaw をインストールする">
    新しいマシンに CLI（必要に応じて Node も）を[インストール](/ja-JP/install)します。オンボーディングによって新しい `~/.openclaw/` が作成されても問題ありません。次の手順で上書きします。
  </Step>

  <Step title="状態ディレクトリとワークスペースをコピーする">
    `scp`、`rsync -a`、または外部ドライブを使用してアーカイブを転送し、展開します。

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    隠しディレクトリが含まれていること、およびファイルの所有者が Gateway を実行するユーザーと一致していることを確認します。

  </Step>

  <Step title="doctor を実行して確認する">
    新しいマシンで [Doctor](/ja-JP/gateway/doctor) を実行し、設定の移行を適用してサービスを修復します。

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

Telegram または Discord がデフォルトの環境変数フォールバック（`TELEGRAM_BOT_TOKEN` または `DISCORD_BOT_TOKEN`）を使用している場合は、シークレット値を表示せずに、移行した状態ディレクトリの `.env` にこれらのキーが含まれていることを確認します。

```bash
awk -F= '/^(TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN)=/ { print $1 "=present" }' ~/.openclaw/.env
```

`openclaw doctor` は、有効になっているデフォルトの Telegram または Discord アカウントにトークンが設定されておらず、対応する環境変数を doctor プロセスから利用できない場合にも警告します。

### よくある問題

<AccordionGroup>
  <Accordion title="プロファイルまたは状態ディレクトリの不一致">
    古い Gateway が `--profile` または `OPENCLAW_STATE_DIR` を使用していて、新しい Gateway がそれを使用していない場合、チャンネルはログアウトしているように表示され、セッションは空になります。移行したものと**同じ**プロファイルまたは状態ディレクトリを使用して Gateway を起動し、`openclaw doctor` を再実行します。
  </Accordion>

  <Accordion title="openclaw.json だけをコピーしている">
    設定ファイルだけでは不十分です。モデルの認証プロファイルは `agents/<agentId>/agent/auth-profiles.json` に、チャンネルとプロバイダーの状態は `credentials/` に保存されています。必ず**状態ディレクトリ全体**を移行してください。
  </Accordion>

  <Accordion title="権限と所有権">
    root としてコピーした場合やユーザーを変更した場合、Gateway が認証情報を読み取れないことがあります。状態ディレクトリとワークスペースの所有者が Gateway を実行するユーザーであることを確認してください。
  </Accordion>

  <Accordion title="リモートモード">
    UI が**リモート**の Gateway を参照している場合、セッションとワークスペースはリモートホストが保持しています。ローカルのノートパソコンではなく、Gateway ホスト自体を移行してください。[よくある質問](/ja-JP/help/faq#where-things-live-on-disk)を参照してください。
  </Accordion>

  <Accordion title="バックアップ内のシークレット">
    状態ディレクトリには、認証プロファイル、チャンネルの認証情報、その他のプロバイダー状態が含まれています。バックアップは暗号化して保存し、安全でない転送経路を避け、漏えいした可能性がある場合はキーをローテーションしてください。
  </Accordion>
</AccordionGroup>

### 確認チェックリスト

新しいマシンで次を確認します。

- [ ] `openclaw status` で Gateway が実行中と表示される。
- [ ] チャンネルが引き続き接続されている（再ペアリングは不要）。
- [ ] ダッシュボードを開くことができ、既存のセッションが表示される。
- [ ] ワークスペースファイル（メモリ、設定）が存在する。

## Plugin をインプレースアップグレードする

Plugin のインプレースアップグレードでは、同じ Plugin ID と設定キーを保持しますが、ディスク上の状態を現在のレイアウトに移動する場合があります。Plugin 固有のアップグレードガイドは、対応するチャンネルのドキュメントにあります。

- [Matrix の移行](/ja-JP/channels/matrix-migration)：暗号化された状態の復旧制限、自動スナップショットの動作、手動復旧コマンド。

## 関連項目

- [`openclaw migrate`](/ja-JP/cli/migrate)：システム間インポートの CLI リファレンス。
- [インストールの概要](/ja-JP/install)：すべてのインストール方法。
- [Doctor](/ja-JP/gateway/doctor)：移行後の健全性チェック。
- [アンインストール](/ja-JP/install/uninstall)：OpenClaw をクリーンに削除する方法。

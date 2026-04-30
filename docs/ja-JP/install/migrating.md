---
read_when:
    - OpenClawを新しいノートパソコンまたはサーバーに移行する
    - 別のエージェントシステムから移行してきて、状態を保持したい場合
    - Plugin をインプレースでアップグレードしています
summary: '移行ハブ: システム間のインポート、マシン間の移動、Plugin のアップグレード'
title: 移行ガイド
x-i18n:
    generated_at: "2026-04-30T05:21:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2a1dc86ed367a0b92cdc0d5189123bb045d327be944516f564dac723f324c97
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw は、3 つの移行パスをサポートしています。別のエージェントシステムからのインポート、既存インストールの新しいマシンへの移動、Plugin のインプレースアップグレードです。

## 別のエージェントシステムからインポートする

同梱の移行プロバイダーを使用して、指示、MCP サーバー、Skills、モデル設定、（オプトインの）API キーを OpenClaw に取り込みます。変更前にプランがプレビューされ、レポート内のシークレットは伏せられ、適用は検証済みバックアップによって保護されます。

<CardGroup cols={2}>
  <Card title="Claude から移行する" href="/ja-JP/install/migrating-claude" icon="brain">
    `CLAUDE.md`、MCP サーバー、Skills、プロジェクトコマンドを含む Claude Code と Claude Desktop の状態をインポートします。
  </Card>
  <Card title="Hermes から移行する" href="/ja-JP/install/migrating-hermes" icon="feather">
    Hermes の設定、プロバイダー、MCP サーバー、メモリ、Skills、サポートされる `.env` キーをインポートします。
  </Card>
</CardGroup>

CLI のエントリーポイントは [`openclaw migrate`](/ja-JP/cli/migrate) です。オンボーディングでも、既知のソースを検出した場合に移行を提案できます（`openclaw onboard --flow import`）。

## OpenClaw を新しいマシンへ移動する

**状態ディレクトリ**（デフォルトでは `~/.openclaw/`）と**ワークスペース**をコピーして、以下を保持します。

- **設定** — `openclaw.json` とすべての Gateway 設定。
- **認証** — エージェントごとの `auth-profiles.json`（API キーと OAuth）、および `credentials/` 配下のチャネルまたはプロバイダーの状態。
- **セッション** — 会話履歴とエージェント状態。
- **チャネル状態** — WhatsApp ログイン、Telegram セッションなど。
- **ワークスペースファイル** — `MEMORY.md`、`USER.md`、Skills、プロンプト。

<Tip>
古いマシンで `openclaw status` を実行し、状態ディレクトリのパスを確認してください。カスタムプロファイルでは `~/.openclaw-<profile>/`、または `OPENCLAW_STATE_DIR` で設定されたパスを使用します。
</Tip>

### 移行手順

<Steps>
  <Step title="Gateway を停止してバックアップする">
    **古い**マシンで、コピー中にファイルが変更されないよう Gateway を停止し、その後アーカイブします。

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    複数のプロファイル（例: `~/.openclaw-work`）を使用している場合は、それぞれを個別にアーカイブしてください。

  </Step>

  <Step title="新しいマシンに OpenClaw をインストールする">
    新しいマシンに CLI（必要なら Node も）を[インストール](/ja-JP/install)します。オンボーディングが新しい `~/.openclaw/` を作成しても問題ありません。次の手順で上書きします。
  </Step>

  <Step title="状態ディレクトリとワークスペースをコピーする">
    `scp`、`rsync -a`、または外部ドライブでアーカイブを転送し、その後展開します。

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    隠しディレクトリが含まれていること、ファイルの所有者が Gateway を実行するユーザーと一致していることを確認してください。

  </Step>

  <Step title="doctor を実行して検証する">
    新しいマシンで [Doctor](/ja-JP/gateway/doctor) を実行し、設定の移行を適用してサービスを修復します。

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

### よくある落とし穴

<AccordionGroup>
  <Accordion title="プロファイルまたは状態ディレクトリの不一致">
    古い Gateway が `--profile` または `OPENCLAW_STATE_DIR` を使用していて、新しい Gateway がそれを使用していない場合、チャネルはログアウト状態に見え、セッションは空になります。移行したものと**同じ**プロファイルまたは状態ディレクトリで Gateway を起動し、その後 `openclaw doctor` を再実行してください。
  </Accordion>

  <Accordion title="openclaw.json だけをコピーする">
    設定ファイルだけでは不十分です。モデル認証プロファイルは `agents/<agentId>/agent/auth-profiles.json` 配下にあり、チャネルとプロバイダーの状態は `credentials/` 配下にあります。必ず状態ディレクトリ**全体**を移行してください。
  </Accordion>

  <Accordion title="権限と所有者">
    root としてコピーした場合やユーザーを切り替えた場合、Gateway が認証情報を読み取れないことがあります。状態ディレクトリとワークスペースが、Gateway を実行するユーザーの所有になっていることを確認してください。
  </Accordion>

  <Accordion title="リモートモード">
    UI が**リモート** Gateway を指している場合、セッションとワークスペースはリモートホストが保持しています。ローカルのノートパソコンではなく、Gateway ホスト自体を移行してください。[FAQ](/ja-JP/help/faq#where-things-live-on-disk) を参照してください。
  </Accordion>

  <Accordion title="バックアップ内のシークレット">
    状態ディレクトリには、認証プロファイル、チャネル認証情報、その他のプロバイダー状態が含まれます。バックアップは暗号化して保存し、安全でない転送経路を避け、漏えいが疑われる場合はキーをローテーションしてください。
  </Accordion>
</AccordionGroup>

### 検証チェックリスト

新しいマシンで、以下を確認してください。

- [ ] `openclaw status` が Gateway の実行中を示している。
- [ ] チャネルが引き続き接続されている（再ペアリング不要）。
- [ ] ダッシュボードが開き、既存のセッションが表示される。
- [ ] ワークスペースファイル（メモリ、設定）が存在する。

## Plugin をインプレースアップグレードする

インプレースの Plugin アップグレードでは、同じ Plugin ID と設定キーを保持しますが、ディスク上の状態を現在のレイアウトへ移動する場合があります。Plugin 固有のアップグレードガイドは、対応するチャネルの近くにあります。

- [Matrix 移行](/ja-JP/channels/matrix-migration): 暗号化状態の復旧制限、自動スナップショットの動作、手動復旧コマンド。

## 関連

- [`openclaw migrate`](/ja-JP/cli/migrate): システム間インポートの CLI リファレンス。
- [インストール概要](/ja-JP/install): すべてのインストール方法。
- [Doctor](/ja-JP/gateway/doctor): 移行後の健全性チェック。
- [アンインストール](/ja-JP/install/uninstall): OpenClaw をクリーンに削除する。

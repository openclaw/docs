---
read_when:
    - 新しいノート PC / サーバーに OpenClaw を移行する場合
    - セッション、認証、チャネルログイン（WhatsApp など）を保持したい場合
summary: OpenClaw のインストールを別のマシンへ移動（移行）する
title: 移行ガイド
x-i18n:
    generated_at: "2026-04-24T05:04:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c14be563d1eb052726324678cf2784efffc2341aa17f662587fdabe1d8ec1e2
    source_path: install/migrating.md
    workflow: 15
---

# OpenClaw を新しいマシンへ移行する

このガイドでは、オンボーディングをやり直さずに OpenClaw Gateway を新しいマシンへ移行します。

## 移行されるもの

**state ディレクトリ**（デフォルトでは `~/.openclaw/`）と **workspace** をコピーすると、次を保持できます。

- **Config** -- `openclaw.json` とすべての Gateway 設定
- **Auth** -- エージェントごとの `auth-profiles.json`（API キー + OAuth）、および `credentials/` 配下のチャネル/プロバイダー状態
- **Sessions** -- 会話履歴とエージェント状態
- **チャネル状態** -- WhatsApp ログイン、Telegram セッションなど
- **Workspace ファイル** -- `MEMORY.md`、`USER.md`、Skills、プロンプト

<Tip>
古いマシンで `openclaw status` を実行して、state ディレクトリのパスを確認してください。
カスタム profile では `~/.openclaw-<profile>/`、または `OPENCLAW_STATE_DIR` で設定されたパスが使われます。
</Tip>

## 移行手順

<Steps>
  <Step title="Gateway を停止してバックアップする">
    **古い**マシンで、コピー中にファイルが変化しないよう Gateway を停止し、その後アーカイブします。

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    複数の profile（たとえば `~/.openclaw-work`）を使っている場合は、それぞれを個別にアーカイブしてください。

  </Step>

  <Step title="新しいマシンに OpenClaw をインストールする">
    新しいマシンに CLI（必要なら Node も）を[インストール](/ja-JP/install)してください。
    オンボーディングで新しい `~/.openclaw/` が作られても問題ありません。次の手順で上書きします。
  </Step>

  <Step title="state ディレクトリと workspace をコピーする">
    `scp`、`rsync -a`、または外付けドライブでアーカイブを転送し、展開します。

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    隠しディレクトリが含まれていること、およびファイル所有権が Gateway を実行するユーザーに一致していることを確認してください。

  </Step>

  <Step title="Doctor を実行して確認する">
    新しいマシンで [Doctor](/ja-JP/gateway/doctor) を実行し、config 移行を適用してサービスを修復します。

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

## よくある落とし穴

<AccordionGroup>
  <Accordion title="Profile または state-dir の不一致">
    古い Gateway が `--profile` または `OPENCLAW_STATE_DIR` を使っていて、新しい環境でそれを使っていない場合、
    チャネルはログアウトされたように見え、session は空になります。
    移行したものと**同じ** profile または state-dir で Gateway を起動し、その後 `openclaw doctor` を再実行してください。
  </Accordion>

  <Accordion title="openclaw.json だけをコピーしている">
    config ファイルだけでは不十分です。モデル auth profile は
    `agents/<agentId>/agent/auth-profiles.json` 配下にあり、チャネル/プロバイダー状態は引き続き
    `credentials/` 配下にあります。必ず state ディレクトリ**全体**を移行してください。
  </Accordion>

  <Accordion title="権限と所有権">
    root でコピーした、またはユーザーを切り替えた場合、Gateway が認証情報を読めなくなることがあります。
    state ディレクトリと workspace が、Gateway を実行するユーザーによって所有されていることを確認してください。
  </Accordion>

  <Accordion title="Remote mode">
    UI が**リモート** Gateway を指している場合、sessions と workspace はリモートホスト側が所有します。
    ローカルノート PC ではなく、Gateway ホスト自体を移行してください。[FAQ](/ja-JP/help/faq#where-things-live-on-disk) を参照してください。
  </Accordion>

  <Accordion title="バックアップ内のシークレット">
    state ディレクトリには auth profile、チャネル認証情報、そのほかの
    プロバイダー状態が含まれます。
    バックアップは暗号化して保存し、安全でない転送経路は避け、露出の疑いがある場合はキーをローテーションしてください。
  </Accordion>
</AccordionGroup>

## 確認チェックリスト

新しいマシンで次を確認してください。

- [ ] `openclaw status` で Gateway が実行中と表示される
- [ ] チャネルが引き続き接続されている（再ペアリング不要）
- [ ] ダッシュボードが開き、既存の session が表示される
- [ ] Workspace ファイル（memory、config）が存在する

## 関連

- [Install overview](/ja-JP/install)
- [Matrix migration](/ja-JP/install/migrating-matrix)
- [Uninstall](/ja-JP/install/uninstall)

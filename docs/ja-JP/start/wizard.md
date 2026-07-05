---
read_when:
    - CLI オンボーディングの実行または設定
    - 新しいマシンをセットアップする
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI オンボーディング: Gateway、ワークスペース、チャンネル、Skills のガイド付きセットアップ'
title: オンボーディング (CLI)
x-i18n:
    generated_at: "2026-07-05T11:51:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd88690ba0b2be207299afece73eac465b528f4e97f4f5a0f889f69a97fb0e47
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

CLI オンボーディングは、macOS、Linux、Windows（ネイティブまたは WSL2）で推奨されるターミナルセットアップ手順です。ローカル Gateway（またはリモート Gateway への接続）に加えて、チャンネル、Skills、ワークスペース既定値を、1つのガイド付きフローで設定します。`openclaw setup` は同じフローを実行します（[Setup](/ja-JP/cli/setup) では `--baseline` の設定のみのバリアントを扱います）。Windows デスクトップユーザーは [Windows Hub](/ja-JP/platforms/windows) から始めることもできます。

プロバイダーへのサインイン、チャンネルのペアリング、デーモンのインストール、Skills のダウンロードにより、クイックセットアップの所要時間が延びる場合があります。任意の手順はスキップでき、後で `openclaw configure` を使って再実行できます。

<Info>
最速で最初のチャットを始めるには、チャンネル設定を完全にスキップします。`openclaw dashboard` を実行し、Control UI からブラウザーでチャットします。ドキュメント: [Dashboard](/ja-JP/web/dashboard)。
</Info>

## ロケール

ウィザードは固定のオンボーディング文言をローカライズします。解決順序は `OPENCLAW_LOCALE`、`LC_ALL`、`LC_MESSAGES`、`LANG`、最後に英語です。対応ロケール: `en`、`zh-CN`、`zh-TW`。

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

製品名、コマンド、設定キー、URL、プロバイダー ID、モデル ID、plugin/チャンネルラベルは、ロケールに関係なく英語のままです。

後で再設定するには:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` は非対話モードを意味しません。スクリプトでは `--non-interactive` を使用します（[CLI automation](/ja-JP/start/wizard-cli-automation) を参照）。
</Note>

<Tip>
オンボーディングには、プロバイダーを選択できる Web 検索ステップが含まれます: Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily。一部は API キーが必要で、それ以外はキー不要です。これは後で `openclaw configure --section web` で設定できます。ドキュメント: [Web tools](/ja-JP/tools/web)。
</Tip>

## QuickStart と Advanced

オンボーディングは、**QuickStart**（既定値）と **Advanced**（完全な制御）の選択から始まります。プロンプトをスキップするには、`--flow quickstart` または `--flow advanced`（エイリアス `manual`）を渡します。

<Tabs>
  <Tab title="QuickStart (defaults)">
    - ローカル Gateway、loopback バインド
    - ワークスペース既定値（または既存のワークスペース）
    - Gateway ポート **18789**
    - Gateway 認証 **Token**（loopback でも自動生成）
    - ツールポリシー: 新規セットアップでは `tools.profile: "coding"`（既存の明示的なプロファイルは保持されます）
    - DM 分離: 新規セットアップでは `session.dmScope: "per-channel-peer"`。詳細: [CLI setup reference](/ja-JP/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 公開 **オフ**
    - Telegram と WhatsApp の DM は既定で **allowlist**: Telegram は数値の Telegram ユーザー ID を要求し、WhatsApp は電話番号を要求します

  </Tab>
  <Tab title="Advanced (full control)">
    - すべてのステップを表示します: モード、ワークスペース、Gateway、チャンネル、デーモン、Skills

  </Tab>
</Tabs>

リモートモード（`--mode remote`）は常に advanced フローを使用します。このマシンを別の場所にある Gateway へ接続する設定だけを行い、リモートホスト上に何かをインストールしたり変更したりすることはありません。

## オンボーディングで設定される内容

ローカルモード（既定）では、次のステップを順に進みます。

1. **モデル/認証** - プロバイダー認証フロー（API キー、OAuth、またはプロバイダー固有の手動認証）を選択します。Custom Provider（OpenAI 互換、OpenAI Responses 互換、Anthropic 互換、または Unknown 自動検出）も含まれます。既定モデルを選択します。
   セキュリティ上の注意: このエージェントがツールを実行したり、webhook/hook コンテンツを処理したりする場合は、利用可能な最も強力な最新世代モデルを優先し、ツールポリシーを厳格に保ってください。弱い、または古い階層はプロンプトインジェクションを受けやすくなります。
   非対話実行では、`--secret-input-mode ref` により、平文の API キー値の代わりに環境変数ベースの参照が保存されます。参照先の環境変数は事前に設定されている必要があり、未設定の場合オンボーディングは即座に失敗します。対話型のシークレット参照モードでは、環境変数または設定済みプロバイダー参照（`file` または `exec`）を指すことができ、保存前に高速な事前チェックが行われます。
2. **ワークスペース** - エージェントファイル用のディレクトリ（既定は `~/.openclaw/workspace`）。ブートストラップファイルを配置します。
3. **Gateway** - ポート、バインドアドレス、認証モード、Tailscale 公開。対話型トークンモードでは、平文トークン保存（既定）を選ぶか、SecretRef の使用を選択します。非対話の SecretRef パス: `--gateway-token-ref-env <ENV_VAR>`。
4. **チャンネル** - 組み込みおよび公式 plugin のチャットチャンネル。Discord、Feishu、Google Chat、iMessage、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp などが含まれます。
5. **デーモン** - LaunchAgent（macOS）、systemd ユーザーユニット（Linux/WSL2）、またはユーザーごとのスタートアップフォルダーへのフォールバック付きのネイティブ Windows Scheduled Task をインストールします。
   トークン認証が必要で、`gateway.auth.token` が SecretRef 管理の場合、デーモンのインストールはそれを検証しますが、解決済みトークンを supervisor サービス環境メタデータへ永続化しません。未解決の SecretRef は、案内とともにインストールをブロックします。`gateway.auth.mode` が未設定の状態で `gateway.auth.token` と `gateway.auth.password` の両方が設定されている場合は、モードを明示的に設定するまでインストールがブロックされます。
6. **ヘルスチェック** - Gateway を起動し、到達可能であることを確認します。
7. **Skills** - 推奨 Skills と任意の依存関係をインストールします。

<Note>
オンボーディングを再実行しても、明示的に **Reset** を選択しない限り（または `--reset` を渡さない限り）、何も消去されません。CLI の `--reset` は既定で設定、認証情報、セッションを対象にします。ワークスペースも削除するには `--reset-scope full` を使用します。設定が無効であるかレガシーキーを含む場合、オンボーディングは先に `openclaw doctor` を実行するよう求めます。
</Note>

`--flow import` は、新規セットアップの代わりに検出された移行フロー（例: Hermes）を実行します。[Migrate](/ja-JP/cli/migrate) と [Install](/ja-JP/install/migrating-hermes) 配下の移行ガイドを参照してください。`openclaw onboard --modern` は、従来のウィザードの代わりに、対話型のセットアップ/修復アシスタントである [Crestodian](/ja-JP/cli/crestodian) を起動します。

## 別のエージェントを追加する

`openclaw agents add <name>` を使用すると、独自のワークスペース、セッション、認証プロファイルを持つ別のエージェントを作成できます。`--workspace` なしで実行すると、名前、ワークスペース、認証、チャンネル、バインディングの対話型フローが始まります。これは完全な `openclaw onboard` ウィザードではありません。

設定される項目:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

注記:

- 既定のワークスペース: `~/.openclaw/workspace-<agentId>`（または `agents.defaults.workspace` が設定されている場合はその配下）。
- 受信メッセージをこのエージェントへルーティングするには `bindings` を追加します（オンボーディングでこれを行うこともできます）。
- 非対話フラグ: `--model`、`--agent-dir`、`--bind`、`--non-interactive`。

## 完全なリファレンス

詳細なステップごとの動作と設定出力については、[CLI setup reference](/ja-JP/start/wizard-cli-reference) を参照してください。
非対話の例については、[CLI automation](/ja-JP/start/wizard-cli-automation) を参照してください。
完全なフラグリファレンスについては、[`openclaw onboard`](/ja-JP/cli/onboard) を参照してください。

## 関連ドキュメント

- CLI コマンドリファレンス: [`openclaw onboard`](/ja-JP/cli/onboard)
- オンボーディング概要: [Onboarding overview](/ja-JP/start/onboarding-overview)
- macOS アプリのオンボーディング: [Onboarding](/ja-JP/start/onboarding)
- エージェントの初回実行儀式: [Agent Bootstrapping](/ja-JP/start/bootstrapping)

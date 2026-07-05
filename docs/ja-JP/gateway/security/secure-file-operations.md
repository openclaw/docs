---
read_when:
    - ファイルアクセス、アーカイブ展開、ワークスペースストレージ、または plugin ファイルシステムヘルパーの変更
summary: OpenClaw がローカルファイルアクセスを安全に処理する方法と、任意の fs-safe Python ヘルパーがデフォルトで無効になっている理由
title: 安全なファイル操作
x-i18n:
    generated_at: "2026-07-05T11:23:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c8edf36ddbb8c8bc1edc52ecdf481affe5395d1779c679a40439167dfe70299
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
---

OpenClaw は、セキュリティに敏感なローカルファイル操作に [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) を使用します。ルート境界内の読み書き、アトミック置換、アーカイブ展開、一時ワークスペース、JSON 状態、シークレットファイル処理が対象です。

これは、信頼されていないパス名を受け取る信頼済み OpenClaw コード向けの **ライブラリガードレール**であり、サンドボックスではありません。実際の影響範囲を定義するのは、ホストのファイルシステム権限、OS ユーザー、コンテナ、エージェント/ツールポリシーです。

## デフォルト: Python ヘルパーなし

OpenClaw は、fs-safe の POSIX Python ヘルパーをデフォルトで **オフ**に設定します。

- オペレーターが明示的に有効化しない限り、ゲートウェイは永続的な Python サイドカーを起動すべきではないため。
- ほとんどのインストールでは、追加の親ディレクトリ変更ハードニングを必要としないため。
- Python を無効化することで、デスクトップ、Docker、CI、バンドルアプリ環境全体でランタイム動作を予測しやすく保てるため。

OpenClaw が変更するのは _デフォルト_ のみです。明示的な設定は常に優先されます。

```bash
# Default OpenClaw behavior: Node-only fs-safe fallbacks.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Opt into the helper when available, falling back if unavailable.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Fail closed if the helper cannot start.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Optional explicit interpreter path.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

汎用の fs-safe 環境変数名も機能します: `FS_SAFE_PYTHON_MODE` と `FS_SAFE_PYTHON`。

ヘルパーがセキュリティ体制の一部である場合は、`auto` ではなく `require` を使用してください。`auto` は、ヘルパーを起動できない場合に Node のみの動作へ静かにフォールバックします。

## Python なしで保護される内容

ヘルパーがオフでも、OpenClaw は fs-safe の Node のみのガードレールを引き続き利用します。

- 相対パスの脱出 (`..`)、絶対パス、素の名前だけが許可される場所でのパス区切り文字を拒否する。
- その場限りの `path.resolve(...).startsWith(...)` チェックではなく、信頼済みルートハンドルを通じて操作を解決する。
- そのポリシーを必要とする API で、シンボリックリンクとハードリンクのパターンを拒否する。
- API がファイル内容を返す、または消費する場合に、ID チェック付きでファイルを開く。
- 状態/設定ファイルを、アトミックな兄弟一時ファイル + リネームで書き込む。
- 読み取りとアーカイブ展開にバイト制限を適用する。
- API が要求する場合に、シークレットと状態ファイルへプライベートなファイルモードを適用する。

これは、OpenClaw の通常の脅威モデルをカバーします。つまり、単一の信頼済みオペレーター境界内で、信頼済みゲートウェイコードが信頼されていないモデル/Plugin/チャネルのパス入力を処理する場合です。

## Python が追加するもの

POSIX では、任意のヘルパーが 1 つの永続 Python プロセスを維持し、親ディレクトリの変更に fd 相対のファイルシステム操作を使用します。対象は、リネーム、削除、mkdir、stat/list、および一部の書き込みパスです。

これにより、同じ UID の別プロセスが検証と変更の間に親ディレクトリを差し替える競合ウィンドウが狭まります。OpenClaw が操作する同じディレクトリを、信頼されていないローカルプロセスが変更できるホストでの多層防御です。

デプロイにそのリスクがあり、Python が存在することが保証されている場合は、次を設定してください。

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

## Plugin とコアのガイダンス

- Plugin 向けのファイルアクセスでは、パスがメッセージ、モデル出力、設定、または Plugin 入力に由来する場合、生の `fs` ではなく `openclaw/plugin-sdk/*` ヘルパーを通すべきです。
- コアコードでは、`src/infra/*` 配下の fs-safe ラッパーを使用し、OpenClaw のプロセスポリシーが一貫して適用されるようにするべきです。
- アーカイブ展開では、明示的なサイズ、エントリ数、リンク、宛先の制限を指定して、fs-safe のアーカイブヘルパーを使用するべきです。
- シークレットでは、OpenClaw のシークレットヘルパー、または fs-safe のシークレット/プライベート状態ヘルパーを使用するべきです。`fs.writeFile` の周りでモードチェックを自作しないでください。
- 敵対的なローカルユーザーの分離では、fs-safe だけに依存しないでください。別々の OS ユーザー/ホストで別々のゲートウェイを実行するか、サンドボックスを使用してください。

関連: [セキュリティ](/ja-JP/gateway/security)、[サンドボックス](/ja-JP/gateway/sandboxing)、[Exec 承認](/ja-JP/tools/exec-approvals)、[シークレット](/ja-JP/gateway/secrets)。

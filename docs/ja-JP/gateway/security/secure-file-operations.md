---
read_when:
    - ファイルアクセス、アーカイブ展開、ワークスペースストレージ、またはPlugin ファイルシステムヘルパーの変更
summary: OpenClaw がローカルファイルアクセスを安全に扱う方法と、任意の fs-safe Python ヘルパーがデフォルトでオフになっている理由
title: 安全なファイル操作
x-i18n:
    generated_at: "2026-05-06T05:07:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19d5b31ec2f2c7ab1033bdb55a701c60468dfac58142f726ecbc9ac933f68e30
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
---

OpenClaw は、セキュリティ上重要なローカルファイル操作に [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) を使用します。ルート境界内の読み書き、アトミック置換、アーカイブ展開、一時ワークスペース、JSON 状態、シークレットファイルの扱いが対象です。

目的は、信頼できないパス名を受け取る信頼済みの OpenClaw コードに対して、一貫した**ライブラリのガードレール**を提供することです。これはサンドボックスではありません。実際の影響範囲は、ホストのファイルシステム権限、OS ユーザー、コンテナ、エージェント/ツールポリシーによって引き続き定義されます。

## デフォルト: Python ヘルパーなし

OpenClaw は、fs-safe の POSIX Python ヘルパーをデフォルトで**オフ**にします。

理由:

- Gateway は、オペレーターが明示的に選択しない限り、永続的な Python サイドカーを起動すべきではありません。
- 多くのインストールでは、親ディレクトリ変更に対する追加の堅牢化は必要ありません。
- Python を無効にすることで、デスクトップ、Docker、CI、バンドルされたアプリ環境全体で、パッケージ/ランタイムの挙動がより予測しやすくなります。

OpenClaw が変更するのはデフォルトだけです。モードを明示的に設定した場合、fs-safe はそれを尊重します。

```bash
# Default OpenClaw behavior: Node-only fs-safe fallbacks.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Opt into the helper when available, falling back if unavailable.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Fail closed if the helper cannot start.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Optional explicit interpreter.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

汎用の fs-safe 名も機能します: `FS_SAFE_PYTHON_MODE` と `FS_SAFE_PYTHON`。

## Python なしでも保護されるもの

ヘルパーがオフの場合でも、OpenClaw は以下に fs-safe の Node パスを使用します。

- `..` のような相対パスの脱出、絶対パス、名前のみが許可される場所でのパス区切り文字を拒否する。
- アドホックな `path.resolve(...).startsWith(...)` チェックではなく、信頼済みルートハンドルを通じて操作を解決する。
- そのポリシーを必要とする API で、シンボリックリンクとハードリンクのパターンを拒否する。
- API がファイル内容を返す、または消費する場所で、識別チェック付きでファイルを開く。
- 状態/設定ファイルに対して、同階層の一時ファイルを使ったアトミック書き込みを行う。
- 読み取りとアーカイブ展開にバイト制限を適用する。
- API が要求する場所で、シークレットと状態ファイルにプライベートモードを適用する。

これらの保護は、OpenClaw の通常の脅威モデルをカバーします。つまり、単一の信頼済みオペレーター境界内で、信頼済みの Gateway コードが、信頼できないモデル/Plugin/チャネルのパス入力を扱う場合です。

## Python が追加するもの

POSIX では、fs-safe の任意のヘルパーは 1 つの永続的な Python プロセスを維持し、rename、remove、mkdir、stat/list、一部の書き込みパスなど、親ディレクトリの変更に fd 相対のファイルシステム操作を使用します。

これにより、別のプロセスが検証と変更の間に親ディレクトリを差し替えられる、同一 UID の競合ウィンドウが狭まります。OpenClaw が操作している同じディレクトリを、信頼できないローカルプロセスが変更できるホストに対する多層防御です。

デプロイにそのリスクがあり、Python が必ず存在する場合は、次を使用してください。

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

ヘルパーがセキュリティ姿勢の一部である場合は、`auto` ではなく `require` を使用してください。`auto` は、ヘルパーが利用できない場合に、意図的に Node のみの挙動へフォールバックします。

## Plugin とコアのガイダンス

- Plugin 向けのファイルアクセスでは、パスがメッセージ、モデル出力、設定、Plugin 入力から来る場合、raw `fs` ではなく `openclaw/plugin-sdk/*` ヘルパーを使用するべきです。
- コアコードでは、OpenClaw のプロセスポリシーが一貫して適用されるように、`src/infra/*` 配下のローカル fs-safe ラッパーを使用するべきです。
- アーカイブ展開では、サイズ、エントリ数、リンク、宛先の制限を明示した fs-safe アーカイブヘルパーを使用するべきです。
- シークレットには、OpenClaw のシークレットヘルパー、または fs-safe のシークレット/プライベート状態ヘルパーを使用するべきです。`fs.writeFile` の周囲でモードチェックを独自実装しないでください。
- 敵対的なローカルユーザーからの分離が必要な場合、fs-safe のみに依存しないでください。別々の OS ユーザー/ホストで別々の Gateway を実行するか、サンドボックス化を使用してください。

関連: [セキュリティ](/ja-JP/gateway/security)、[サンドボックス化](/ja-JP/gateway/sandboxing)、[実行の承認](/ja-JP/tools/exec-approvals)、[シークレット](/ja-JP/gateway/secrets)。

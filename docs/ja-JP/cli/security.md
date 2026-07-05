---
read_when:
    - config/state の簡易セキュリティ監査を実行したい
    - 安全な「修正」提案（権限、デフォルトの厳格化）を適用する
summary: CLI reference for `openclaw security`（一般的なセキュリティ上の落とし穴を監査して修正）
title: セキュリティ
x-i18n:
    generated_at: "2026-07-05T11:13:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 49b80cc444995556a657798e62f4547acd2360e5feb5fe15e547933bbef98c4e
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

セキュリティツール: 監査と任意の安全な修正。関連: [セキュリティ](/ja-JP/gateway/security)。

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --auth password --password <password>
openclaw security audit --fix
openclaw security audit --json
```

## 監査モード

通常の `security audit` は、コールドな config/ファイルシステム/読み取り専用パスに留まります。Plugin ランタイムのセキュリティコレクターは検出しないため、定期監査でインストール済みのすべての Plugin ランタイムを読み込むことはありません。`--deep` はベストエフォートのライブ Gateway プローブと、Plugin が所有するセキュリティ監査コレクターを追加します (明示的な内部呼び出し元も、すでに適切なランタイムスコープを持っている場合は、それらのコレクターを有効化できます)。

Gateway パスワード認証が起動時にのみ指定されている場合は、監査が `hooks.token` と照合できるよう、同じ値を `--auth password --password <password>` で渡してください。

## チェック内容

**DM/信頼モデル**

- 複数の DM 送信者がメインセッションを共有している場合に警告し、共有 inbox 向けに安全な DM モード `session.dmScope="per-channel-peer"` (複数アカウントのチャネルでは `per-account-channel-peer`) を推奨します。これは協調的な共有 inbox の堅牢化であり、相互に信頼されていないオペレーター同士の分離ではありません。その場合は別々の gateway (または別々の OS ユーザー/ホスト) で信頼境界を分けてください。
- config が共有ユーザーの ingress の可能性を示す場合 (たとえば open DM/group policy、設定済みの group target、ワイルドカード sender rule)、`security.trust_model.multi_user_heuristic` を出力します。OpenClaw のデフォルトの信頼モデルはパーソナルアシスタント (1 人のオペレーター) であり、敵対的なマルチテナント分離ではありません。意図的な共有ユーザー構成では、すべてのセッションを sandbox 化し、ファイルシステムアクセスをワークスペーススコープに限定し、個人/プライベートの ID や資格情報をそのランタイムに置かないでください。
- 小規模モデル (`<=300B` パラメーター) が sandbox 化なしで、web/browser ツールを有効にして使われている場合に警告します。

**Webhook/hooks**

起動時に非致命的なセキュリティ警告をログ出力し、監査では `hooks.token` がアクティブな Gateway 共有シークレット認証値 (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN`、`gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) を再利用していることを検出します。また、次の場合にも警告します。

- `hooks.token` が短い
- `hooks.path="/"`
- `hooks.defaultSessionKey` が未設定
- `hooks.allowedAgentIds` が無制限
- リクエストの `sessionKey` override が有効
- `hooks.allowedSessionKeyPrefixes` なしで override が有効

永続化された再利用中の `hooks.token` をローテーションするには `openclaw doctor --fix` を実行し、その後、外部 hook 送信元を新しい token を使うよう更新してください。

**Sandbox/tools**

- sandbox モードがオフの状態で sandbox Docker 設定が構成されている場合に警告します。
- `gateway.nodes.denyCommands` が効果のないパターン風/不明なエントリを使っている場合に警告します (マッチングは厳密な node command-name のみで、shell-text filtering ではありません)。
- `gateway.nodes.allowCommands` が危険な node command を明示的に有効化している場合に警告します。
- グローバルの `tools.profile="minimal"` が agent tool profile によって override されている場合に警告します。
- write/edit ツールが無効でも、制約のある sandbox ファイルシステム境界なしで `exec` がまだ利用可能な場合に警告します。
- open DM または group が、sandbox/workspace guard なしで runtime/filesystem ツールを公開している場合に警告します。
- permissive な tool policy の下で、インストール済み Plugin ツールに到達できる可能性がある場合に警告します。

**Sandbox browser**

- sandbox browser が Docker `bridge` network を `sandbox.browser.cdpSourceRange` なしで使っている場合に警告します。
- `host` や `container:*` namespace join を含む、危険な sandbox Docker network mode を検出します。
- 既存の sandbox browser Docker container に hash label が欠落/古い場合 (たとえば `openclaw.browserConfigEpoch` が欠落した移行前の container) に警告し、`openclaw sandbox recreate --browser --all` を推奨します。

**Network/discovery**

- `gateway.allowRealIpFallback=true` を検出します (proxy の設定ミスがある場合の header spoofing risk)。
- `discovery.mdns.mode="full"` を検出します (mDNS TXT record 経由の metadata leakage)。
- `gateway.auth.mode="none"` によって、共有シークレットなしで Gateway HTTP API (`/tools/invoke` と有効化された任意の `/v1/*` endpoint) に到達可能になる場合に警告します。

**Plugins/channels**

- npm ベースの Plugin/hook install record が pin されていない、integrity metadata がない、または現在インストールされている package version から drift している場合に警告します。
- channel allowlist が stable ID ではなく可変の名前/email/tag に依存している場合に警告します (Discord、Slack、Google Chat、Microsoft Teams、Mattermost、IRC の該当スコープ)。

`dangerous`/`dangerously` で始まる設定は、明示的な break-glass operator override です。これらを有効にすること自体は、セキュリティ脆弱性レポートではありません。危険なパラメーターの完全な一覧は、[セキュリティ](/ja-JP/gateway/security) の「安全でないまたは危険なフラグの要約」を参照してください。

## SecretRef の動作

`security audit` は、対象パスについて、サポートされている SecretRef を読み取り専用モードで解決します。現在の command path で SecretRef が利用できない場合、監査はクラッシュせず続行し、代わりに `secretDiagnostics` を報告します。`--token` と `--password` は、その command invocation の deep-probe auth だけを override します。config や SecretRef mapping は書き換えません。

## 抑制

意図的な継続的 findings は `security.audit.suppressions` で受け入れます。各 suppression は正確な `checkId` に一致し、大文字小文字を区別しない `titleIncludes` および/または `detailIncludes` substring で絞り込めます。

```json
{
  "security": {
    "audit": {
      "suppressions": [
        {
          "checkId": "plugins.tools_reachable_permissive_policy",
          "detailIncludes": "Enabled extension plugins: gbrain",
          "reason": "trusted local operator plugin"
        }
      ]
    }
  }
}
```

抑制された findings は、アクティブな `summary` と `findings` list から削除されます。JSON 出力では監査可能性のために `suppressedFindings` の下に保持されます。suppressions が構成されている場合、アクティブな出力にも、監査がフィルター済みであることを読者が分かるように、抑制不能な `security.audit.suppressions.active` info finding が保持されます。危険な config flag は finding ごとに 1 つの flag として出力されるため、ある危険な flag を受け入れても、同じ `config.insecure_or_dangerous_flags` checkId を共有する他の有効な flag は隠されません。

suppressions は継続的リスクを隠せるため、agent-run shell command 経由で追加または削除するには、信頼済みローカル automation 向けに exec がすでに `security="full"` と `ask="off"` で実行されていない限り、exec approval が必要です。

## JSON 出力

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

`--fix --json` では、出力に fix action と final report の両方が含まれます。

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` が変更する内容

安全で決定的な remediation を適用します。

- 一般的な `groupPolicy="open"` を `groupPolicy="allowlist"` に切り替えます (サポートされる channel の account variant を含む)
- WhatsApp の group policy が `allowlist` に切り替わる場合、保存済みの `allowFrom` file が存在し、config に `allowFrom` がまだ定義されていなければ、その list から `groupAllowFrom` を seed します
- `logging.redactSensitive` を `"off"` から `"tools"` に設定します
- state/config と一般的な機密ファイル (`credentials/*.json`、`auth-profiles.json`、`sessions.json`、session `*.jsonl`) の permission を厳格化します
- `openclaw.json` から参照される config include file も厳格化します
- POSIX host では `chmod`、Windows では `icacls` reset を使用します

`--fix` が**行わない**こと:

- token/password/API key のローテーション
- tool (`gateway`、`cron`、`exec` など) の無効化
- gateway bind/auth/network exposure choice の変更
- plugins/skills の削除または書き換え

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [セキュリティ監査](/ja-JP/gateway/security)

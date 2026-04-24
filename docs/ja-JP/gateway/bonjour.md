---
read_when:
    - macOS/iOS での Bonjour 検出の問題をデバッグする
    - mDNS のサービス種別、TXT レコード、または検出 UX を変更する
summary: Bonjour/mDNS 検出とデバッグ（Gateway ビーコン、クライアント、よくある障害モード）
title: Bonjour 検出
x-i18n:
    generated_at: "2026-04-24T04:55:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5d9099ce178aca1e6e443281133928f886de965245ad0fb02ce91a27aad3989
    source_path: gateway/bonjour.md
    workflow: 15
---

# Bonjour / mDNS 検出

OpenClaw は、アクティブな Gateway（WebSocket エンドポイント）を検出するために Bonjour（mDNS / DNS‑SD）を使用します。
マルチキャストの `local.` ブラウズは**LAN 限定の利便機能**です。ネットワークをまたぐ検出では、
同じビーコンを設定済みの広域 DNS-SD ドメイン経由でも公開できます。検出は依然として
ベストエフォートであり、SSH や Tailnet ベースの接続性の代替には**なりません**。

## Tailscale 上の広域 Bonjour（ユニキャスト DNS-SD）

Node と gateway が異なるネットワーク上にある場合、マルチキャスト mDNS はその
境界を越えません。同じ検出 UX を維持したい場合は、Tailscale 上で **unicast DNS‑SD**
（「Wide‑Area Bonjour」）に切り替えることができます。

高レベルな手順:

1. gateway ホスト上で DNS サーバーを実行する（Tailnet 経由で到達可能であること）。
2. 専用ゾーン配下に `_openclaw-gw._tcp` の DNS‑SD レコードを公開する
   （例: `openclaw.internal.`）。
3. 選択したドメインがその DNS サーバー経由で解決されるように、Tailscale の **split DNS** を設定する
   （iOS を含むクライアント向け）。

OpenClaw は任意の検出ドメインをサポートします。`openclaw.internal.` は単なる例です。
iOS/Android ノードは `local.` と設定済みの広域ドメインの両方をブラウズします。

### Gateway 設定（推奨）

```json5
{
  gateway: { bind: "tailnet" }, // tailnet のみ（推奨）
  discovery: { wideArea: { enabled: true } }, // 広域 DNS-SD 公開を有効化
}
```

### 1 回だけの DNS サーバー設定（gateway ホスト）

```bash
openclaw dns setup --apply
```

これにより CoreDNS がインストールされ、次のように設定されます。

- gateway の Tailscale インターフェース上でのみポート 53 を listen する
- 選択したドメイン（例: `openclaw.internal.`）を `~/.openclaw/dns/<domain>.db` から配信する

Tailnet に接続されたマシンから検証します。

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS 設定

Tailscale 管理コンソールで:

- gateway の tailnet IP（UDP/TCP 53）を向く nameserver を追加する。
- 検出ドメインがその nameserver を使うように split DNS を追加する。

クライアントが tailnet DNS を受け入れるようになると、iOS ノードと CLI 検出は
マルチキャストなしで検出ドメイン内の `_openclaw-gw._tcp` をブラウズできます。

### Gateway リスナーのセキュリティ（推奨）

Gateway WS ポート（デフォルト `18789`）はデフォルトで loopback に bind します。LAN/tailnet
アクセスでは、明示的に bind し、認証を有効のまま維持してください。

tailnet 専用セットアップでは:

- `~/.openclaw/openclaw.json` で `gateway.bind: "tailnet"` を設定する。
- Gateway を再起動する（または macOS メニューバーアプリを再起動する）。

## 何が広告されるか

`_openclaw-gw._tcp` を広告するのは Gateway のみです。

## サービス種別

- `_openclaw-gw._tcp` — gateway トランスポートビーコン（macOS/iOS/Android ノードで使用）。

## TXT キー（非シークレットのヒント）

Gateway は UI フローを便利にするため、非シークレットの小さなヒントを広告します。

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>`（Gateway WS + HTTP）
- `gatewayTls=1`（TLS 有効時のみ）
- `gatewayTlsSha256=<sha256>`（TLS 有効かつフィンガープリントが利用可能な場合のみ）
- `canvasPort=<port>`（canvas host が有効な場合のみ。現在は `gatewayPort` と同じ）
- `transport=gateway`
- `tailnetDns=<magicdns>`（Tailnet が利用可能な場合の任意ヒント）
- `sshPort=<port>`（mDNS full mode のみ。広域 DNS-SD では省略されることがあります）
- `cliPath=<path>`（mDNS full mode のみ。広域 DNS-SD でもリモートインストールのヒントとして書き込まれます）

セキュリティ注記:

- Bonjour/mDNS TXT レコードは**認証されません**。クライアントは TXT を権威あるルーティング情報として扱ってはいけません。
- クライアントは解決済みサービスエンドポイント（SRV + A/AAAA）を使ってルーティングすべきです。`lanHost`、`tailnetDns`、`gatewayPort`、`gatewayTlsSha256` はヒントとしてのみ扱ってください。
- SSH の自動ターゲティングも同様に、TXT のみのヒントではなく解決済みサービスホストを使うべきです。
- TLS pinning では、広告された `gatewayTlsSha256` によって以前保存された pin が上書きされることは絶対にあってはなりません。
- iOS/Android ノードは、検出ベースの直接接続を**TLS 専用**として扱い、初回フィンガープリントを信頼する前に明示的なユーザー確認を要求すべきです。

## macOS でのデバッグ

便利な組み込みツール:

- インスタンスをブラウズ:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- 1 つのインスタンスを解決（`<instance>` を置き換え）:

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

ブラウズは動作するのに解決に失敗する場合、通常は LAN ポリシーまたは
mDNS リゾルバーの問題です。

## Gateway ログでのデバッグ

Gateway はローテーションログファイルを書き込みます（起動時に
`gateway log file: ...` と表示されます）。`bonjour:` 行、特に次のようなものを確認してください。

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## iOS ノードでのデバッグ

iOS ノードは `NWBrowser` を使って `_openclaw-gw._tcp` を検出します。

ログを取得するには:

- 設定 → Gateway → 詳細設定 → **Discovery Debug Logs**
- 設定 → Gateway → 詳細設定 → **Discovery Logs** → 再現 → **Copy**

ログには、browser の状態遷移と result-set の変化が含まれます。

## よくある障害モード

- **Bonjour はネットワークをまたがない**: Tailnet または SSH を使ってください。
- **マルチキャストがブロックされている**: 一部の Wi‑Fi ネットワークでは mDNS が無効です。
- **スリープ / インターフェース変動**: macOS は一時的に mDNS 結果を落とすことがあります。再試行してください。
- **ブラウズは動くが解決に失敗する**: マシン名はシンプルに保ってください（絵文字や
  句読点を避ける）。その後 Gateway を再起動してください。サービスインスタンス名は
  ホスト名から導出されるため、複雑すぎる名前は一部のリゾルバーを混乱させることがあります。

## エスケープされたインスタンス名（`\032`）

Bonjour/DNS‑SD は、サービスインスタンス名内のバイトを 10 進の `\DDD`
シーケンスとしてエスケープすることがよくあります（例: スペースは `\032` になります）。

- これは protocol レベルでは正常です。
- UI は表示用にデコードすべきです（iOS では `BonjourEscapes.decode` を使用）。

## 無効化 / 設定

- `OPENCLAW_DISABLE_BONJOUR=1` で広告を無効化します（旧式: `OPENCLAW_DISABLE_BONJOUR`）。
- `~/.openclaw/openclaw.json` 内の `gateway.bind` が Gateway の bind mode を制御します。
- `OPENCLAW_SSH_PORT` は、`sshPort` が広告されるときの SSH ポートを上書きします（旧式: `OPENCLAW_SSH_PORT`）。
- `OPENCLAW_TAILNET_DNS` は TXT に MagicDNS ヒントを公開します（旧式: `OPENCLAW_TAILNET_DNS`）。
- `OPENCLAW_CLI_PATH` は広告される CLI パスを上書きします（旧式: `OPENCLAW_CLI_PATH`）。

## 関連ドキュメント

- 検出ポリシーとトランスポート選択: [Discovery](/ja-JP/gateway/discovery)
- Node ペアリング + 承認: [Gateway pairing](/ja-JP/gateway/pairing)

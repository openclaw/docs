---
read_when:
    - macOS/iOS での Bonjour 検出問題のデバッグ
    - mDNS サービスタイプ、TXT レコード、または検出 UX の変更
summary: Bonjour/mDNS 検出 + デバッグ（Gateway ビーコン、クライアント、一般的な失敗モード）
title: Bonjour 検出
x-i18n:
    generated_at: "2026-07-05T11:17:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0526c9e20dd02d143ae7aa4c8e1e6830763763e95c9a74c4d73332c5e5e155e
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw は Bonjour（mDNS/DNS-SD）を使って、アクティブな Gateway（WebSocket エンドポイント）を検出できます。マルチキャストの `local.` ブラウズは **LAN 専用の利便機能**です。バンドルされた `bonjour` Plugin が LAN 広告を所有し、macOS ホストでは自動開始、Linux、Windows、コンテナ化された Gateway デプロイではオプトインです。同じビーコンは、クロスネットワーク検出用に設定済みの広域 DNS-SD ドメイン経由でも公開できます。検出はベストエフォートであり、SSH や Tailnet ベースの接続を置き換えるものでは**ありません**。

## Tailscale 経由の広域 Bonjour（ユニキャスト DNS-SD）

ノードと Gateway が異なるネットワーク上にある場合、マルチキャスト mDNS は境界を越えられません。Tailscale 経由の **ユニキャスト DNS-SD**（「広域 Bonjour」）に切り替えることで、同じ検出 UX を維持できます。

1. Gateway ホスト上で、Tailnet 経由で到達可能な DNS サーバーを実行します。
2. 専用ゾーン（例: `openclaw.internal.`）の下で `_openclaw-gw._tcp` の DNS-SD レコードを公開します。
3. iOS を含むクライアントで、選択したドメインがその DNS サーバー経由で解決されるように Tailscale **split DNS** を設定します。

上記の `openclaw.internal.` は単なる例です。OpenClaw は任意の検出ドメインをサポートします。iOS/Android ノードは `local.` と設定済みの広域ドメインの両方をブラウズします。

### Gateway 設定

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true, domain: "openclaw.internal" } },
}
```

`discovery.wideArea.domain` は、未設定時のフォールバックとして `OPENCLAW_WIDE_AREA_DOMAIN` 環境変数も受け入れます。

### 1 回限りの DNS サーバー設定（Gateway ホスト、macOS のみ）

```bash
openclaw dns setup --apply
```

このコマンドは macOS 専用で、Homebrew と実行中の Tailscale 接続が必要です。CoreDNS（`brew install coredns`）をインストールし、次のように設定します。

- Gateway の Tailscale インターフェース上だけでポート 53 をリッスンする
- 選択したドメイン（例: `openclaw.internal.`）を `~/.openclaw/dns/<domain>.db` から提供する

何もインストールせずにプラン（ドメイン、ゾーンファイルのパス、検出された Tailnet IP、推奨設定）をプレビューするには、最初に `--apply` なしで実行します。

Tailnet に接続されたマシンから検証します。

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS 設定

Tailscale 管理コンソールで次を行います。

- Gateway の Tailnet IP（UDP/TCP 53）を指すネームサーバーを追加します。
- 検出ドメインがそのネームサーバーを使うように split DNS を追加します。

クライアントが Tailnet DNS を受け入れると、iOS ノードと CLI 検出は、マルチキャストなしで検出ドメイン内の `_openclaw-gw._tcp` をブラウズできます。

### Gateway リスナーのセキュリティ

Gateway WS ポート（デフォルト `18789`）は、デフォルトではループバックにバインドします。LAN/Tailnet アクセスでは明示的にバインドし、認証を有効なままにしてください。Tailnet 専用セットアップでは、`~/.openclaw/openclaw.json` に `gateway.bind: "tailnet"` を設定し、Gateway（または macOS メニューバーアプリ）を再起動します。

## 広告するもの

`_openclaw-gw._tcp` を広告するのは Gateway だけです。LAN マルチキャスト広告は、有効化されている場合にバンドルされた `bonjour` Plugin から行われます。広域 DNS-SD 公開は Gateway 所有のままです。

## サービスタイプ

- `_openclaw-gw._tcp` - Gateway トランスポートビーコン。macOS/iOS/Android ノードで使用されます。

## TXT キー（非秘密のヒント）

| キー                          | 存在する場合                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `role=gateway`                | 常に。                                                                         |
| `displayName=<friendly name>` | 常に。                                                                         |
| `lanHost=<hostname>.local`    | 常に。                                                                         |
| `gatewayPort=<port>`          | 常に（Gateway WS + HTTP）。                                                    |
| `transport=gateway`           | 常に。                                                                         |
| `gatewayTls=1`                | TLS が有効な場合のみ。                                                         |
| `gatewayTlsSha256=<sha256>`   | TLS が有効で、フィンガープリントが利用可能な場合のみ。                         |
| `gatewayDirectReachable=1`    | Gateway に直接到達可能な場合のみ（リレー/プロキシパス経由だけではない場合）。 |
| `canvasPort=<port>`           | Canvas ホストが有効な場合のみ。現在は `gatewayPort` と同じです。               |
| `tailnetDns=<magicdns>`       | mDNS フルモードのみ。Tailnet が利用可能な場合の任意のヒント。                  |
| `sshPort=<port>`              | フルモードのみ。最小モードとオフモードでは省略されます。                       |
| `cliPath=<path>`              | フルモードのみ。最小モードとオフモードでは省略されます。                       |

セキュリティ上の注意:

- Bonjour/mDNS TXT レコードは**認証されません**。クライアントは TXT を権威あるルーティング情報として扱ってはいけません。
- クライアントは解決されたサービスエンドポイント（SRV + A/AAAA）を使ってルーティングするべきです。`lanHost`、`tailnetDns`、`gatewayPort`、`gatewayTlsSha256` はヒントとしてのみ扱ってください。
- SSH の自動ターゲット指定も同様に、TXT のみのヒントではなく、解決されたサービスホストを使うべきです。
- TLS ピンニングでは、広告された `gatewayTlsSha256` によって、以前に保存されたピンが上書きされることがあってはなりません。
- iOS/Android ノードは、検出ベースの直接接続を **TLS のみ**として扱い、初回フィンガープリントを信頼する前に明示的なユーザー確認を要求するべきです。

## macOS でのデバッグ

組み込みツール:

```bash
# Browse instances
dns-sd -B _openclaw-gw._tcp local.

# Resolve one instance (replace <instance>)
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

ブラウズは動作するのに解決が失敗する場合、通常は LAN ポリシーまたは mDNS リゾルバーの問題に当たっています。

## Gateway ログでのデバッグ

Gateway はローテーションログファイルを書き込みます（起動時に `gateway log file: ...` として出力されます）。特に次のような `bonjour:` 行を探してください。

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

ウォッチドッグは、アクティブな `probing`、`announcing`、および新しい競合リネームを進行中の状態として扱います。サービスが `announced` に到達しない場合、OpenClaw は広告主を再作成し、失敗が繰り返された後は、永久に再広告し続ける代わりに、その Gateway プロセスの Bonjour を無効化します。

Bonjour は、広告される `.local` ホストに、DNS ラベルとして有効な場合はシステムホスト名を使用します。システムホスト名にスペース、アンダースコア、またはその他の無効な DNS ラベル文字が含まれる場合、OpenClaw は `openclaw.local` にフォールバックします。明示的なホストラベルが必要な場合は、Gateway を起動する前に `OPENCLAW_MDNS_HOSTNAME=<name>` を設定します。

## iOS ノードでのデバッグ

iOS ノードは `NWBrowser` を使って `_openclaw-gw._tcp` を検出します。

ログを取得するには、Settings -> Gateway -> Advanced -> **Discovery Debug Logs**、次に Settings -> Gateway -> Advanced -> **Discovery Logs** -> 再現 -> **Copy** の順に操作します。ログにはブラウザーの状態遷移と結果セットの変更が含まれます。

## Bonjour を有効にする場合

Bonjour は、macOS ホストで空設定の Gateway 起動時に自動開始します。これは、ローカルアプリと近くの iOS/Android ノードが同一 LAN 検出に依存することが多いためです。

Linux、Windows、または別の非 macOS ホストで同一 LAN の自動検出が有用な場合は、明示的に有効化します。

```bash
openclaw plugins enable bonjour
```

有効化されている場合、Bonjour は公開する TXT メタデータの量を決めるために `discovery.mdns.mode` を使用します。同じモードは、広域 DNS-SD レコード内の任意の TXT ヒントも制御します。モード:

| モード              | 動作                                                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`（デフォルト） | コア TXT キーのみ。`sshPort`、`cliPath`、`tailnetDns` を省略します。                                                                                         |
| `full`              | `sshPort`、`cliPath`、`tailnetDns` を追加します。クライアントがこれらのヒントを必要とする場合に使用します。                                                  |
| `off`               | Plugin の有効化状態を変えずに LAN マルチキャストを抑制します。`discovery.wideArea.enabled` が true の場合、広域 DNS-SD は引き続き最小ビーコンを公開できます。 |

## Bonjour を無効にする場合

LAN マルチキャスト広告が不要、利用不可、または有害な場合は、Bonjour を無効のままにします。よくあるケースは、非 macOS サーバー、Docker ブリッジネットワーク、WSL、または mDNS マルチキャストをドロップするネットワークポリシーです。Gateway は公開 URL、SSH、Tailnet、または広域 DNS-SD 経由で到達可能なままです。不安定なのは LAN 自動検出だけです。

デプロイメント範囲の問題には環境変数による上書きを使います（Docker イメージ、サービスファイル、起動スクリプト、一回限りのデバッグに安全です。環境がなくなると消えます）。

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

その OpenClaw 設定でバンドルされた LAN 検出 Plugin を意図的にオフにしたい場合は、Plugin 設定を使います。

```bash
openclaw plugins disable bonjour
```

## Docker の注意点

バンドルされた Bonjour Plugin は、`OPENCLAW_DISABLE_BONJOUR` が未設定の場合、検出されたコンテナ内で LAN マルチキャスト広告を自動的に無効化します。Docker ブリッジネットワークは通常、コンテナと LAN の間で mDNS マルチキャスト（`224.0.0.251:5353`）を転送しないため、コンテナから広告しても検出が機能することはほとんどありません。

注意点:

- Bonjour は macOS ホストで自動開始し、それ以外ではオプトインです。無効のままにしても Gateway は停止せず、LAN マルチキャスト広告だけをスキップします。
- Bonjour を無効にしても `gateway.bind` は変わりません。Docker は引き続きデフォルトで `OPENCLAW_GATEWAY_BIND=lan` になるため、公開されたホストポートは機能します。
- Bonjour を無効にしても広域 DNS-SD は無効になりません。Gateway とノードが同じ LAN 上にない場合は、広域検出または Tailnet を使用してください。
- Docker 外で同じ `OPENCLAW_CONFIG_DIR` を再利用しても、コンテナの自動無効化ポリシーは永続化されません。
- `OPENCLAW_DISABLE_BONJOUR=0` は、ホストネットワーク、macvlan、または mDNS マルチキャストが通ることが分かっている別のネットワークの場合にのみ設定してください。強制的に無効化するには `1` に設定します。

## 無効化された Bonjour のトラブルシューティング

Docker 設定後にノードが Gateway を自動検出しなくなった場合:

1. Gateway が自動、強制オン、または強制オフのどのモードで実行されているかを確認します。

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Gateway 自体が公開ポート経由で到達可能か確認します。

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Bonjour が無効な場合は直接ターゲットを使用します。
   - Control UI またはローカルツール: `http://127.0.0.1:18789`
   - LAN クライアント: `http://<gateway-host>:18789`
   - クロスネットワーククライアント: Tailnet MagicDNS、Tailnet IP、SSH トンネル、または広域 DNS-SD

4. Docker 内で Bonjour Plugin を意図的に有効化し、`OPENCLAW_DISABLE_BONJOUR=0` で広告を強制した場合は、ホストからマルチキャストをテストします。

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   ブラウズ結果が空、または Gateway ログに ciao ウォッチドッグのキャンセルが繰り返し表示される場合は、`OPENCLAW_DISABLE_BONJOUR=1` に戻し、直接ルートまたは Tailnet ルートを使用してください。

## 一般的な失敗モード

- **Bonjour はネットワークを越えません**: Tailnet または SSH を使用します。
- **マルチキャストがブロックされています**: 一部の Wi-Fi ネットワークでは mDNS が無効化されています。
- **アドバタイザーが probing/announcing のまま止まる**: マルチキャストがブロックされたホスト、コンテナブリッジ、WSL、またはインターフェイスの切り替わりにより、ciao アドバタイザーが未アナウンス状態のままになることがあります。OpenClaw は数回再試行し、その後アドバタイザーを永遠に再起動するのではなく、現在の Gateway プロセスで Bonjour を無効化します。
- **Docker ブリッジネットワーク**: 検出されたコンテナ内では Bonjour が自動的に無効化されます。`OPENCLAW_DISABLE_BONJOUR=0` は、ホスト、macvlan、または別の mDNS 対応ネットワークでのみ設定します。
- **スリープ/インターフェイスの切り替わり**: macOS では mDNS の結果が一時的に失われることがあります。再試行してください。
- **ブラウズは機能するが解決に失敗する**: マシン名はシンプルに保ち（絵文字や句読点を避ける）、その後 Gateway を再起動します。サービスインスタンス名はホスト名から派生するため、過度に複雑な名前は一部のリゾルバーを混乱させることがあります。

## エスケープされたインスタンス名（`\032`）

Bonjour/DNS-SD は、サービスインスタンス名内のバイトを 10 進数の `\DDD` シーケンスとしてエスケープすることがよくあります（スペースは `\032` になります）。これはプロトコルレベルでは通常の動作です。UI では表示用にデコードする必要があります（iOS は `BonjourEscapes.decode` を使用します）。

## 有効化 / 無効化 / 設定

| 設定                                                 | 効果                                                                              |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `openclaw plugins enable bonjour`                    | デフォルトで有効化されていないホストで、同梱の LAN 検出プラグインを有効化します。 |
| `openclaw plugins disable bonjour`                   | 同梱プラグインを無効化することで、LAN マルチキャスト広告を無効化します。           |
| `OPENCLAW_DISABLE_BONJOUR=1`（または `true`/`yes`/`on`）  | プラグイン設定を変更せずに LAN マルチキャスト広告を無効化します。                |
| `OPENCLAW_DISABLE_BONJOUR=0`（または `false`/`no`/`off`） | 検出されたコンテナ内を含め、LAN マルチキャスト広告を強制的に有効化します。        |
| `discovery.mdns.mode`                                | `off` \| `minimal`（デフォルト）\| `full` — 上記のモードを参照。                  |
| `gateway.bind`                                       | `~/.openclaw/openclaw.json` 内の Gateway バインドモードを制御します。              |
| `OPENCLAW_SSH_PORT`                                  | `sshPort` が広告される場合（full モード）、SSH ポートを上書きします。             |
| `OPENCLAW_TAILNET_DNS`                               | mDNS full モードが有効な場合、TXT に MagicDNS ヒントを公開します。                |
| `OPENCLAW_CLI_PATH`                                  | 広告される CLI パスを上書きします（full モード）。                                |

macOS ホストでは、同梱の LAN 検出プラグインがデフォルトで自動起動します。Bonjour プラグインが有効で `OPENCLAW_DISABLE_BONJOUR` が未設定の場合、Bonjour は通常のホストで広告し、検出されたコンテナ内（Docker、Fly.io machines、一般的なコンテナランタイム）では自動的に無効化されます。

## 関連ドキュメント

- 検出ポリシーとトランスポート選択: [検出](/ja-JP/gateway/discovery)
- Node ペアリング + 承認: [Gateway ペアリング](/ja-JP/gateway/pairing)

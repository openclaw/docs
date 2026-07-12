---
read_when:
    - macOS/iOS での Bonjour 検出問題のデバッグ
    - mDNS サービスタイプ、TXT レコード、または検出 UX の変更
summary: Bonjour/mDNS 検出とデバッグ（Gateway ビーコン、クライアント、一般的な障害モード）
title: Bonjour 検出
x-i18n:
    generated_at: "2026-07-11T22:09:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0526c9e20dd02d143ae7aa4c8e1e6830763763e95c9a74c4d73332c5e5e155e
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw は Bonjour（mDNS/DNS-SD）を使用して、稼働中の Gateway（WebSocket エンドポイント）を検出できます。マルチキャスト `local.` ブラウジングは **LAN 専用の利便機能**です。バンドルされた `bonjour` Plugin が LAN アドバタイズを担い、macOS ホストでは自動起動し、Linux、Windows、コンテナ化された Gateway デプロイではオプトインで有効になります。同じビーコンを、設定済みの広域 DNS-SD ドメイン経由で公開し、ネットワークをまたいで検出することもできます。検出はベストエフォートであり、SSH や Tailnet ベースの接続に代わるものでは**ありません**。

## Tailscale 経由の広域 Bonjour（ユニキャスト DNS-SD）

Node と Gateway が異なるネットワーク上にある場合、マルチキャスト mDNS は境界を越えられません。Tailscale 経由の **ユニキャスト DNS-SD**（「広域 Bonjour」）に切り替えることで、同じ検出 UX を維持できます。

1. Tailnet 経由で到達可能な DNS サーバーを Gateway ホスト上で実行します。
2. 専用ゾーン（例: `openclaw.internal.`）配下に `_openclaw-gw._tcp` の DNS-SD レコードを公開します。
3. iOS を含むクライアントで、選択したドメインがその DNS サーバー経由で名前解決されるよう、Tailscale の **スプリット DNS**を設定します。

上記の `openclaw.internal.` は単なる例です。OpenClaw は任意の検出ドメインをサポートします。iOS/Android Node は `local.` と設定済みの広域ドメインの両方をブラウズします。

### Gateway の設定

```json5
{
  gateway: { bind: "tailnet" }, // Tailnet のみ（推奨）
  discovery: { wideArea: { enabled: true, domain: "openclaw.internal" } },
}
```

`discovery.wideArea.domain` が未設定の場合、フォールバックとして `OPENCLAW_WIDE_AREA_DOMAIN` 環境変数も使用できます。

### DNS サーバーの初回セットアップ（Gateway ホスト、macOS のみ）

```bash
openclaw dns setup --apply
```

このコマンドは macOS 専用で、Homebrew と稼働中の Tailscale 接続が必要です。CoreDNS（`brew install coredns`）をインストールし、次のように設定します。

- Gateway の Tailscale インターフェース上でのみポート 53 をリッスンする
- `~/.openclaw/dns/<domain>.db` から選択したドメイン（例: `openclaw.internal.`）を提供する

何もインストールせずに計画（ドメイン、ゾーンファイルのパス、検出された Tailnet IP、推奨設定）を確認するには、まず `--apply` なしで実行します。

Tailnet に接続されたマシンから検証します。

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale の DNS 設定

Tailscale 管理コンソールで、次の操作を行います。

- Gateway の Tailnet IP（UDP/TCP 53）を指すネームサーバーを追加します。
- 検出ドメインがそのネームサーバーを使用するよう、スプリット DNS を追加します。

クライアントが Tailnet DNS を受け入れると、iOS Node と CLI 検出はマルチキャストなしで、検出ドメイン内の `_openclaw-gw._tcp` をブラウズできます。

### Gateway リスナーのセキュリティ

Gateway の WS ポート（デフォルト `18789`）は、デフォルトでループバックにバインドされます。LAN/Tailnet からアクセスする場合は明示的にバインドし、認証を有効なままにしてください。Tailnet 専用の構成では、`~/.openclaw/openclaw.json` に `gateway.bind: "tailnet"` を設定し、Gateway（または macOS メニューバーアプリ）を再起動します。

## アドバタイズ対象

`_openclaw-gw._tcp` をアドバタイズするのは Gateway のみです。LAN マルチキャストのアドバタイズは、有効化されている場合にバンドルされた `bonjour` Plugin が行います。広域 DNS-SD の公開は引き続き Gateway が担います。

## サービスタイプ

- `_openclaw-gw._tcp` - macOS/iOS/Android Node が使用する Gateway トランスポートビーコン。

## TXT キー（機密情報ではないヒント）

| キー                          | 存在する条件                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `role=gateway`                | 常に存在します。                                                               |
| `displayName=<friendly name>` | 常に存在します。                                                               |
| `lanHost=<hostname>.local`    | 常に存在します。                                                               |
| `gatewayPort=<port>`          | 常に存在します（Gateway WS + HTTP）。                                          |
| `transport=gateway`           | 常に存在します。                                                               |
| `gatewayTls=1`                | TLS が有効な場合のみ。                                                         |
| `gatewayTlsSha256=<sha256>`   | TLS が有効で、フィンガープリントを取得できる場合のみ。                         |
| `gatewayDirectReachable=1`    | Gateway に直接到達できる場合のみ（リレー／プロキシ経路のみではない場合）。     |
| `canvasPort=<port>`           | Canvas ホストが有効な場合のみ。現在は `gatewayPort` と同じです。               |
| `tailnetDns=<magicdns>`       | mDNS フルモードのみ。Tailnet が利用可能な場合のオプションのヒントです。        |
| `sshPort=<port>`              | フルモードのみ。最小モードとオフモードでは省略されます。                       |
| `cliPath=<path>`              | フルモードのみ。最小モードとオフモードでは省略されます。                       |

セキュリティ上の注意:

- Bonjour/mDNS の TXT レコードは**認証されていません**。クライアントは TXT を権威あるルーティング情報として扱ってはなりません。
- クライアントは、名前解決されたサービスエンドポイント（SRV + A/AAAA）を使用してルーティングする必要があります。`lanHost`、`tailnetDns`、`gatewayPort`、`gatewayTlsSha256` はヒントとしてのみ扱ってください。
- SSH の自動ターゲット選択でも同様に、TXT のヒントだけではなく、名前解決されたサービスホストを使用する必要があります。
- TLS ピンニングでは、アドバタイズされた `gatewayTlsSha256` によって、以前に保存したピンを上書きすることは決して許可してはなりません。
- iOS/Android Node は、検出に基づく直接接続を **TLS 専用**として扱い、初回のフィンガープリントを信頼する前に、ユーザーの明示的な確認を必須とする必要があります。

## macOS でのデバッグ

組み込みツール:

```bash
# インスタンスをブラウズ
dns-sd -B _openclaw-gw._tcp local.

# 1 つのインスタンスを名前解決（<instance> を置換）
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

ブラウズは機能するのに名前解決が失敗する場合、通常は LAN ポリシーまたは mDNS リゾルバーの問題です。

## Gateway ログでのデバッグ

Gateway はローテーションされるログファイルに書き込みます（起動時に `gateway log file: ...` と表示されます）。特に次のような `bonjour:` 行を確認してください。

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

ウォッチドッグは、進行中の状態としてアクティブな `probing`、`announcing`、および直近の競合による名前変更を扱います。サービスが `announced` に到達しない場合、OpenClaw はアドバタイザーを再作成し、失敗が繰り返された後は無期限に再アドバタイズし続けるのではなく、その Gateway プロセスの Bonjour を無効化します。

Bonjour は、有効な DNS ラベルである場合、アドバタイズする `.local` ホストにシステムのホスト名を使用します。システムのホスト名にスペース、アンダースコア、またはその他の無効な DNS ラベル文字が含まれる場合、OpenClaw は `openclaw.local` にフォールバックします。明示的なホストラベルが必要な場合は、Gateway を起動する前に `OPENCLAW_MDNS_HOSTNAME=<name>` を設定してください。

## iOS Node でのデバッグ

iOS Node は `NWBrowser` を使用して `_openclaw-gw._tcp` を検出します。

ログを取得するには、Settings -> Gateway -> Advanced -> **Discovery Debug Logs** を開き、次に Settings -> Gateway -> Advanced -> **Discovery Logs** -> 再現 -> **Copy** の順に操作します。ログにはブラウザーの状態遷移と結果セットの変更が含まれます。

## Bonjour を有効にするタイミング

ローカルアプリと近くの iOS/Android Node は同一 LAN 上での検出に依存することが多いため、macOS ホストで設定が空の状態から Gateway を起動すると、Bonjour は自動起動します。

Linux、Windows、またはその他の macOS 以外のホストで、同一 LAN 上の自動検出が役立つ場合は、明示的に有効化します。

```bash
openclaw plugins enable bonjour
```

有効化されている場合、Bonjour は `discovery.mdns.mode` を使用して公開する TXT メタデータの量を決定します。同じモードが、広域 DNS-SD レコード内のオプションの TXT ヒントも制御します。モードは次のとおりです。

| モード              | 動作                                                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`（デフォルト） | コア TXT キーのみ。`sshPort`、`cliPath`、`tailnetDns` を省略します。                                                                                       |
| `full`              | `sshPort`、`cliPath`、`tailnetDns` を追加します。クライアントがこれらのヒントを必要とする場合に使用します。                                                   |
| `off`               | Plugin の有効化状態を変更せずに LAN マルチキャストを抑制します。`discovery.wideArea.enabled` が true の場合、広域 DNS-SD は引き続き最小ビーコンを公開できます。 |

## Bonjour を無効にするタイミング

LAN マルチキャストのアドバタイズが不要、利用不能、または有害な場合は、Bonjour を無効のままにしてください。一般的な例として、macOS 以外のサーバー、Docker ブリッジネットワーク、WSL、または mDNS マルチキャストを破棄するネットワークポリシーがあります。Gateway は公開 URL、SSH、Tailnet、または広域 DNS-SD を通じて引き続き到達可能です。信頼できなくなるのは LAN 自動検出のみです。

デプロイ単位の問題には環境変数による上書きを使用します（Docker イメージ、サービスファイル、起動スクリプト、一時的なデバッグで安全に使用でき、環境がなくなると設定も消えます）。

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

その OpenClaw 設定で、バンドルされた LAN 検出 Plugin を意図的に無効化する場合は、Plugin 設定を使用します。

```bash
openclaw plugins disable bonjour
```

## Docker の注意点

バンドルされた Bonjour Plugin は、`OPENCLAW_DISABLE_BONJOUR` が未設定のとき、コンテナを検出すると LAN マルチキャストのアドバタイズを自動的に無効化します。Docker ブリッジネットワークは通常、コンテナと LAN の間で mDNS マルチキャスト（`224.0.0.251:5353`）を転送しないため、コンテナからアドバタイズしても検出が機能することはほとんどありません。

注意点:

- Bonjour は macOS ホストでは自動起動し、それ以外ではオプトインです。無効のままにしても Gateway は停止せず、LAN マルチキャストのアドバタイズだけが省略されます。
- Bonjour を無効化しても `gateway.bind` は変更されません。Docker は引き続きデフォルトで `OPENCLAW_GATEWAY_BIND=lan` を使用するため、公開されたホストポートは機能します。
- Bonjour を無効化しても広域 DNS-SD は無効になりません。Gateway と Node が同じ LAN 上にない場合は、広域検出または Tailnet を使用してください。
- Docker 外で同じ `OPENCLAW_CONFIG_DIR` を再利用しても、コンテナの自動無効化ポリシーは永続化されません。
- `OPENCLAW_DISABLE_BONJOUR=0` は、ホストネットワーク、macvlan、または mDNS マルチキャストが通過すると確認されている別のネットワークでのみ設定してください。強制的に無効化するには `1` に設定します。

## 無効化された Bonjour のトラブルシューティング

Docker のセットアップ後に Node が Gateway を自動検出しなくなった場合:

1. Gateway が自動、強制オン、強制オフのどのモードで実行されているか確認します。

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. 公開されたポート経由で Gateway 自体に到達できることを確認します。

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Bonjour が無効な場合は直接ターゲットを使用します。
   - Control UI またはローカルツール: `http://127.0.0.1:18789`
   - LAN クライアント: `http://<gateway-host>:18789`
   - ネットワークをまたぐクライアント: Tailnet MagicDNS、Tailnet IP、SSH トンネル、または広域 DNS-SD

4. Docker で Bonjour Plugin を意図的に有効化し、`OPENCLAW_DISABLE_BONJOUR=0` でアドバタイズを強制した場合は、ホストからマルチキャストをテストします。

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   ブラウズ結果が空の場合、または Gateway ログに ciao ウォッチドッグのキャンセルが繰り返し表示される場合は、`OPENCLAW_DISABLE_BONJOUR=1` に戻し、直接経路または Tailnet 経路を使用してください。

## 一般的な障害モード

- **Bonjour はネットワークを越えない**: Tailnet または SSH を使用してください。
- **マルチキャストがブロックされている**: 一部の Wi-Fi ネットワークでは mDNS が無効になっています。
- **アドバタイザーがプローブ中/アナウンス中のまま停止する**: マルチキャストがブロックされたホスト、コンテナブリッジ、WSL、またはインターフェースの頻繁な変化により、ciao アドバタイザーが未アナウンス状態のままになることがあります。OpenClaw は数回再試行した後、アドバタイザーを永続的に再起動し続ける代わりに、現在の Gateway プロセスで Bonjour を無効にします。
- **Docker ブリッジネットワーク**: 検出されたコンテナ内では Bonjour が自動的に無効になります。`OPENCLAW_DISABLE_BONJOUR=0` は、ホスト、macvlan、またはその他の mDNS 対応ネットワークでのみ設定してください。
- **スリープ/インターフェースの頻繁な変化**: macOS では mDNS の結果が一時的に取得できなくなる場合があります。再試行してください。
- **ブラウズは成功するが名前解決に失敗する**: マシン名を単純にして（絵文字や句読点は避けてください）、Gateway を再起動してください。サービスインスタンス名はホスト名から生成されるため、複雑すぎる名前は一部のリゾルバーを混乱させる可能性があります。

## エスケープされたインスタンス名（`\032`）

Bonjour/DNS-SD では、サービスインスタンス名内のバイトが 10 進数の `\DDD` シーケンスとしてエスケープされることがよくあります（スペースは `\032` になります）。これはプロトコルレベルでは正常です。UI では表示用にデコードする必要があります（iOS では `BonjourEscapes.decode` を使用します）。

## 有効化 / 無効化 / 設定

| 設定                                                 | 効果                                                                                                  |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `openclaw plugins enable bonjour`                    | デフォルトで有効になっていないホストで、同梱の LAN 検出 Plugin を有効にします。                       |
| `openclaw plugins disable bonjour`                   | 同梱の Plugin を無効にすることで、LAN マルチキャスト広告を無効にします。                              |
| `OPENCLAW_DISABLE_BONJOUR=1`（または `true`/`yes`/`on`）  | Plugin 設定を変更せずに、LAN マルチキャスト広告を無効にします。                                      |
| `OPENCLAW_DISABLE_BONJOUR=0`（または `false`/`no`/`off`） | 検出されたコンテナ内を含め、LAN マルチキャスト広告を強制的に有効にします。                            |
| `discovery.mdns.mode`                                | `off` \| `minimal`（デフォルト）\| `full` — 上記のモードを参照してください。                         |
| `gateway.bind`                                       | `~/.openclaw/openclaw.json` 内の Gateway バインドモードを制御します。                                |
| `OPENCLAW_SSH_PORT`                                  | `sshPort` が広告される場合に SSH ポートを上書きします（フルモード）。                                |
| `OPENCLAW_TAILNET_DNS`                               | mDNS フルモードが有効な場合に、TXT で MagicDNS ヒントを公開します。                                  |
| `OPENCLAW_CLI_PATH`                                  | 広告される CLI パスを上書きします（フルモード）。                                                    |

macOS ホストでは、同梱の LAN 検出 Plugin がデフォルトで自動起動します。Bonjour Plugin が有効で、`OPENCLAW_DISABLE_BONJOUR` が未設定の場合、Bonjour は通常のホストでは広告を行い、検出されたコンテナ（Docker、Fly.io マシン、および一般的なコンテナランタイム）内では自動的に無効になります。

## 関連ドキュメント

- 検出ポリシーとトランスポートの選択: [検出](/ja-JP/gateway/discovery)
- Node のペアリングと承認: [Gateway のペアリング](/ja-JP/gateway/pairing)

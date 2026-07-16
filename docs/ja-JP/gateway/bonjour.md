---
read_when:
    - macOS/iOS での Bonjour 検出問題のデバッグ
    - mDNS サービスタイプ、TXT レコード、または検出 UX の変更
summary: Bonjour/mDNS ディスカバリとデバッグ（Gateway ビーコン、クライアント、一般的な障害モード）
title: Bonjour 検出
x-i18n:
    generated_at: "2026-07-16T11:41:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 42a46dc34e94dc86ee0432b12fcb59b3855371c745d79825a00aa557e1369160
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw は Bonjour（mDNS/DNS-SD）を使用して、アクティブな Gateway（WebSocket エンドポイント）を検出できます。マルチキャスト `local.` ブラウジングは、**LAN 専用の利便機能**です。バンドルされた `bonjour` Plugin が LAN アドバタイズを担い、macOS ホストでは自動起動し、Linux、Windows、およびコンテナ化された Gateway デプロイではオプトインで有効になります。同じビーコンを、設定済みの広域 DNS-SD ドメイン経由で公開し、ネットワークをまたいだ検出に使用することもできます。検出はベストエフォートであり、SSH または Tailnet ベースの接続に代わるものでは**ありません**。

## Tailscale 経由の広域 Bonjour（ユニキャスト DNS-SD）

Node と Gateway が異なるネットワーク上にある場合、マルチキャスト mDNS は境界を越えられません。Tailscale 経由の**ユニキャスト DNS-SD**（「広域 Bonjour」）に切り替えることで、同じ検出 UX を維持できます。

1. Tailnet 経由で到達可能な DNS サーバーを Gateway ホスト上で実行します。
2. 専用ゾーン（例: `openclaw.internal.`）配下に `_openclaw-gw._tcp` の DNS-SD レコードを公開します。
3. iOS を含むクライアントで、選択したドメインがその DNS サーバーを介して名前解決されるよう、Tailscale の **split DNS** を設定します。

上記の `openclaw.internal.` は単なる例です。OpenClaw は任意の検出ドメインをサポートします。iOS/Android Node は、`local.` と設定済みの広域ドメインの両方をブラウズします。

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

このコマンドは macOS 専用であり、Homebrew と実行中の Tailscale 接続が必要です。CoreDNS（`brew install coredns`）をインストールし、次のように設定します。

- Gateway の Tailscale インターフェース上でのみポート 53 をリッスンする
- `~/.openclaw/dns/<domain>.db` から選択したドメイン（例: `openclaw.internal.`）を提供する

最初に `--apply` なしで実行すると、何もインストールせずに計画（ドメイン、ゾーンファイルのパス、検出された Tailnet IP、推奨設定）をプレビューできます。

Tailnet に接続されたマシンから検証します。

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale の DNS 設定

Tailscale 管理コンソールで、次の操作を行います。

- Gateway の Tailnet IP（UDP/TCP 53）を参照するネームサーバーを追加します。
- 検出ドメインがそのネームサーバーを使用するよう、split DNS を追加します。

クライアントが Tailnet DNS を受け入れると、iOS Node と CLI 検出は、マルチキャストを使用せずに検出ドメイン内の `_openclaw-gw._tcp` をブラウズできます。

### Gateway リスナーのセキュリティ

Gateway の WS ポート（デフォルトは `18789`）は、デフォルトでループバックにバインドされます。LAN/Tailnet からアクセスするには明示的にバインドし、認証を有効なままにしてください。Tailnet 専用構成では、`~/.openclaw/openclaw.json` で `gateway.bind: "tailnet"` を設定し、Gateway（または macOS メニューバーアプリ）を再起動します。

## アドバタイズされるもの

`_openclaw-gw._tcp` をアドバタイズするのは Gateway のみです。有効な場合、LAN マルチキャストアドバタイズはバンドルされた `bonjour` Plugin が行います。広域 DNS-SD の公開は引き続き Gateway が担います。

## サービスタイプ

- `_openclaw-gw._tcp` - macOS/iOS/Android Node が使用する Gateway トランスポートビーコン。

## TXT キー（機密ではないヒント）

| キー                           | 存在する条件                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `role=gateway`                | 常時。                                                                        |
| `displayName=<friendly name>` | 常時。                                                                        |
| `lanHost=<hostname>.local`    | 常時。                                                                        |
| `gatewayPort=<port>`          | 常時（Gateway WS + HTTP）。                                                    |
| `transport=gateway`           | 常時。                                                                        |
| `gatewayTls=1`                | TLS が有効な場合のみ。                                                      |
| `gatewayTlsSha256=<sha256>`   | TLS が有効で、フィンガープリントを利用できる場合のみ。                       |
| `gatewayDirectReachable=1`    | Gateway に直接到達できる場合のみ（リレー/プロキシ経路のみを介する場合を除く）。 |
| `canvasPort=<port>`           | Canvas ホストが有効な場合のみ。現在は `gatewayPort` と同じです。     |
| `tailnetDns=<magicdns>`       | mDNS フルモードのみ。Tailnet を利用できる場合の任意のヒント。                  |
| `sshPort=<port>`              | フルモードのみ。最小モードとオフモードでは省略されます。                              |
| `cliPath=<path>`              | フルモードのみ。最小モードとオフモードでは省略されます。                              |

セキュリティ上の注意:

- Bonjour/mDNS TXT レコードは**認証されていません**。クライアントは TXT を信頼できるルーティング情報として扱ってはなりません。
- クライアントは、名前解決されたサービスエンドポイント（SRV + A/AAAA）を使用してルーティングする必要があります。`lanHost`、`tailnetDns`、`gatewayPort`、および `gatewayTlsSha256` はヒントとしてのみ扱ってください。
- SSH の自動ターゲット設定でも同様に、TXT のみのヒントではなく、名前解決されたサービスホストを使用する必要があります。
- TLS ピン留めでは、アドバタイズされた `gatewayTlsSha256` によって、以前に保存されたピンが上書きされることを決して許可してはなりません。
- iOS/Android Node は、検出に基づく直接接続を **TLS 専用**として扱い、初回のフィンガープリントを信頼する前にユーザーの明示的な確認を必須とする必要があります。

## macOS でのデバッグ

組み込みツール:

```bash
# インスタンスをブラウズ
dns-sd -B _openclaw-gw._tcp local.

# 1 つのインスタンスを名前解決（<instance> を置き換える）
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

ブラウズは機能するものの名前解決に失敗する場合、通常は LAN ポリシーまたは mDNS リゾルバーの問題が発生しています。

## Gateway ログでのデバッグ

Gateway はローテーションログファイルを書き込みます（起動時に `gateway log file: ...` として出力されます）。特に次の `bonjour:` 行を確認してください。

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao netmask assertion ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`

OpenClaw は各 Bonjour サービスを一度だけ起動し、プローブ、再試行、名前競合の解決、およびインターフェース変更時の再公開を mDNS レスポンダーに任せます。これにより、通常のネットワーク変動中に公開試行が重複することを防ぎます。内部の自己プローブメッセージが繰り返されても Gateway ログがあふれないよう、それらは抑制されます。

同じホストから複数の OpenClaw Gateway がアドバタイズされる場合、サービスインスタンス名を一意に保つため、Bonjour によって `(2)` や `(3)` などのサフィックスが追加されることがあります。これらのサフィックスは通常の競合解決であり、OCM の監視が重複していることを示すものではありません。

Bonjour は、有効な DNS ラベルである場合、アドバタイズされる `.local` ホストにシステムのホスト名を使用します。システムのホスト名にスペース、アンダースコア、またはその他の無効な DNS ラベル文字が含まれている場合、OpenClaw は `openclaw.local` にフォールバックします。明示的なホストラベルが必要な場合は、Gateway を起動する前に `OPENCLAW_MDNS_HOSTNAME=<name>` を設定します。

## iOS Node でのデバッグ

iOS Node は `NWBrowser` を使用して `_openclaw-gw._tcp` を検出します。

ログを取得するには、Settings -> Gateway -> Advanced -> **Discovery Debug Logs**、続いて Settings -> Gateway -> Advanced -> **Discovery Logs** -> 再現 -> **Copy** の順に操作します。ログには、ブラウザーの状態遷移と結果セットの変更が含まれます。

## Bonjour を有効にする場合

macOS ホストで設定が空の状態から Gateway を起動すると、Bonjour は自動起動します。これは、ローカルアプリと近くの iOS/Android Node が同じ LAN 上での検出を一般的に使用するためです。

Linux、Windows、またはその他の macOS 以外のホストで同一 LAN 上の自動検出が有用な場合は、明示的に有効にします。

```bash
openclaw plugins enable bonjour
```

有効な場合、Bonjour は `discovery.mdns.mode` を使用して公開する TXT メタデータの量を決定します。同じモードで、広域 DNS-SD レコード内の任意の TXT ヒントも制御します。モード:

| モード                | 動作                                                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`（デフォルト） | コア TXT キーのみ。`sshPort`、`cliPath`、`tailnetDns` は省略されます。                                                                                                 |
| `full`              | `sshPort`、`cliPath`、`tailnetDns` を追加します。クライアントがこれらのヒントを必要とする場合に使用してください。                                                                                  |
| `off`               | Plugin の有効状態を変更せずに LAN マルチキャストを抑制します。`discovery.wideArea.enabled` が true の場合、広域 DNS-SD は引き続き最小ビーコンを公開できます。 |

## Bonjour を無効にする場合

LAN マルチキャストアドバタイズが不要、利用不可能、または有害な場合は、Bonjour を無効のままにしてください。一般的な例として、macOS 以外のサーバー、Docker ブリッジネットワーク、WSL、または mDNS マルチキャストを破棄するネットワークポリシーがあります。Gateway は、公開 URL、SSH、Tailnet、または広域 DNS-SD を介して引き続き到達可能です。信頼性が低下するのは LAN 自動検出のみです。

デプロイ単位の問題には、環境変数による上書きを使用します（Docker イメージ、サービスファイル、起動スクリプト、一時的なデバッグに安全です。環境がなくなると設定も消えます）。

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

その OpenClaw 設定で、バンドルされた LAN 検出 Plugin を意図的に無効化する場合は、Plugin 設定を使用します。

```bash
openclaw plugins disable bonjour
```

## Docker の注意点

バンドルされた Bonjour Plugin は、コンテナが検出され、`OPENCLAW_DISABLE_BONJOUR` が未設定の場合、LAN マルチキャストアドバタイズを自動的に無効化します。通常、Docker ブリッジネットワークはコンテナと LAN の間で mDNS マルチキャスト（`224.0.0.251:5353`）を転送しないため、コンテナからアドバタイズしても検出が機能することはほとんどありません。

注意点:

- Bonjour は macOS ホストでは自動起動し、それ以外ではオプトインです。無効のままでも Gateway は停止しません。スキップされるのは LAN マルチキャストアドバタイズのみです。
- Bonjour を無効にしても `gateway.bind` は変更されません。Docker のデフォルトは引き続き `OPENCLAW_GATEWAY_BIND=lan` であるため、公開されたホストポートは機能します。
- Bonjour を無効にしても広域 DNS-SD は無効になりません。Gateway と Node が同じ LAN 上にない場合は、広域検出または Tailnet を使用してください。
- Docker の外部で同じ `OPENCLAW_CONFIG_DIR` を再利用しても、コンテナの自動無効化ポリシーは保持されません。
- ホストネットワーク、macvlan、または mDNS マルチキャストが通過することが確認されている別のネットワークでのみ `OPENCLAW_DISABLE_BONJOUR=0` を設定してください。強制的に無効化するには `1` に設定します。

## 無効化された Bonjour のトラブルシューティング

Docker のセットアップ後に Node が Gateway を自動検出しなくなった場合:

1. Gateway が自動、強制有効、強制無効のどのモードで実行されているか確認します。

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. 公開ポートを介して Gateway 自体に到達できることを確認します。

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Bonjour が無効な場合は、直接ターゲットを使用します。
   - Control UI またはローカルツール: `http://127.0.0.1:18789`
   - LAN クライアント: `http://<gateway-host>:18789`
   - ネットワークをまたぐクライアント: Tailnet MagicDNS、Tailnet IP、SSH トンネル、または広域 DNS-SD

4. Docker で Bonjour Plugin を意図的に有効にし、`OPENCLAW_DISABLE_BONJOUR=0` でアドバタイズを強制した場合は、ホストからマルチキャストをテストします。

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   ブラウズ結果が空の場合、または Gateway ログに ciao のプローブ失敗が繰り返し表示される場合は、`OPENCLAW_DISABLE_BONJOUR=1` に戻し、直接接続または Tailnet 経路を使用してください。

## 一般的な障害モード

- **Bonjour はネットワークを越えません**: Tailnet または SSH を使用してください。
- **マルチキャストがブロックされている**: 一部の Wi-Fi ネットワークでは mDNS が無効になっています。
- **アドバタイザーがプローブ中またはアナウンス中のまま停止している**: マルチキャストがブロックされたホスト、コンテナブリッジ、WSL、またはインターフェースの頻繁な変動により、レスポンダーが未アナウンス状態のままになることがあります。Gateway は、直接接続、SSH、Tailnet、または広域 DNS-SD ルートを通じて引き続き利用できます。マルチキャストを利用できない場合は、`discovery.mdns.mode: "off"` または `OPENCLAW_DISABLE_BONJOUR=1` を使用して LAN Bonjour を無効にしてください。
- **Docker ブリッジネットワーク**: 検出されたコンテナ内では Bonjour が自動的に無効になります。`OPENCLAW_DISABLE_BONJOUR=0` は、ホスト、macvlan、またはその他の mDNS 対応ネットワークでのみ設定してください。
- **スリープまたはインターフェースの変動**: macOS では mDNS の結果が一時的に取得できなくなることがあります。再試行してください。
- **ブラウズは機能するが名前解決に失敗する**: マシン名を単純なものにして（絵文字や句読点は避けてください）、Gateway を再起動してください。サービスインスタンス名はホスト名から生成されるため、複雑すぎる名前は一部のリゾルバーを混乱させることがあります。

## エスケープされたインスタンス名 (`\032`)

Bonjour/DNS-SD は、多くの場合、サービスインスタンス名のバイトを 10 進数の `\DDD` シーケンスとしてエスケープします（スペースは `\032` になります）。これはプロトコルレベルでは正常です。UI では表示用にデコードする必要があります（iOS は `BonjourEscapes.decode` を使用します）。

## 有効化 / 無効化 / 設定

| 設定                                              | 効果                                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `openclaw plugins enable bonjour`                    | デフォルトで有効になっていないホスト上で、同梱の LAN 検出 Plugin を有効にします。 |
| `openclaw plugins disable bonjour`                   | 同梱の Plugin を無効にすることで、LAN マルチキャスト広告を無効にします。               |
| `OPENCLAW_DISABLE_BONJOUR=1` (または `true`/`yes`/`on`)  | Plugin 設定を変更せずに、LAN マルチキャスト広告を無効にします。                |
| `OPENCLAW_DISABLE_BONJOUR=0` (または `false`/`no`/`off`) | 検出されたコンテナ内を含め、LAN マルチキャスト広告を強制的に有効にします。        |
| `discovery.mdns.mode`                                | `off` \| `minimal`（デフォルト）\| `full` — 上記のモードを参照してください。                         |
| `gateway.bind`                                       | `~/.openclaw/openclaw.json` の Gateway バインドモードを制御します。                    |
| `OPENCLAW_SSH_PORT`                                  | `sshPort` がアドバタイズされる場合（フルモード）に SSH ポートを上書きします。                  |
| `OPENCLAW_TAILNET_DNS`                               | mDNS フルモードが有効な場合、TXT に MagicDNS ヒントを公開します。                  |
| `OPENCLAW_CLI_PATH`                                  | アドバタイズされる CLI パスを上書きします（フルモード）。                                    |

macOS ホストでは、同梱の LAN 検出 Plugin がデフォルトで自動起動します。Bonjour Plugin が有効で、`OPENCLAW_DISABLE_BONJOUR` が未設定の場合、Bonjour は通常のホスト上でアドバタイズし、検出されたコンテナ（Docker、Fly.io マシン、および一般的なコンテナランタイム）内では自動的に無効になります。

## 関連ドキュメント

- 検出ポリシーとトランスポートの選択: [検出](/ja-JP/gateway/discovery)
- Node のペアリングと承認: [Gateway のペアリング](/ja-JP/gateway/pairing)

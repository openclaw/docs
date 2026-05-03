---
read_when:
    - macOS/iOS の Bonjour 検出問題のデバッグ
    - mDNS のサービス種別、TXT レコード、または検出 UX の変更
summary: Bonjour/mDNS 検出 + デバッグ（Gateway ビーコン、クライアント、一般的な障害モード）
title: Bonjour 検出
x-i18n:
    generated_at: "2026-05-03T21:31:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2975fea03bc8fe8ccbd57f7a4ca8c15a59fb21b3f92c2b77b9a57ae4ebd5d374
    source_path: gateway/bonjour.md
    workflow: 16
---

# Bonjour / mDNS 検出

OpenClaw は Bonjour (mDNS / DNS-SD) を使用して、アクティブな Gateway (WebSocket エンドポイント) を検出できます。
マルチキャスト `local.` ブラウジングは **LAN のみの利便機能**です。バンドルされた `bonjour`
plugin が LAN アドバタイズを所有します。これは macOS ホストでは自動起動し、
Linux、Windows、コンテナ化された Gateway デプロイではオプトインです。ネットワークをまたぐ検出では、同じ
ビーコンを、設定済みのワイドエリア DNS-SD ドメインを通じて公開することもできます。検出は
引き続きベストエフォートであり、SSH や Tailnet ベースの接続性を置き換えるものでは**ありません**。

## Tailscale 上のワイドエリア Bonjour (ユニキャスト DNS-SD)

ノードと gateway が異なるネットワーク上にある場合、マルチキャスト mDNS は境界を越えません。
Tailscale 上で **ユニキャスト DNS‑SD** (「ワイドエリア Bonjour」) に切り替えることで、
同じ検出 UX を維持できます。

大まかな手順:

1. gateway ホスト上で DNS サーバーを実行します (Tailnet 経由で到達可能)。
2. 専用ゾーン配下に `_openclaw-gw._tcp` の DNS‑SD レコードを公開します
   (例: `openclaw.internal.`)。
3. Tailscale **スプリット DNS** を設定し、選択したドメインがクライアント (iOS を含む) に対してその
   DNS サーバーで解決されるようにします。

OpenClaw は任意の検出ドメインをサポートします。`openclaw.internal.` は単なる例です。
iOS/Android ノードは `local.` と設定済みのワイドエリアドメインの両方をブラウズします。

### Gateway 設定 (推奨)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet のみ (推奨)
  discovery: { wideArea: { enabled: true } }, // ワイドエリア DNS-SD 公開を有効化
}
```

### 1 回限りの DNS サーバーセットアップ (gateway ホスト)

```bash
openclaw dns setup --apply
```

これにより CoreDNS がインストールされ、次のように設定されます。

- gateway の Tailscale インターフェイス上だけでポート 53 を listen する
- 選択したドメイン (例: `openclaw.internal.`) を `~/.openclaw/dns/<domain>.db` から提供する

tailnet 接続済みのマシンから検証します。

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS 設定

Tailscale 管理コンソールで:

- gateway の tailnet IP (UDP/TCP 53) を指すネームサーバーを追加します。
- 検出ドメインがそのネームサーバーを使用するようにスプリット DNS を追加します。

クライアントが tailnet DNS を受け入れると、iOS ノードと CLI 検出は
マルチキャストなしで検出ドメイン内の `_openclaw-gw._tcp` をブラウズできます。

### Gateway リスナーのセキュリティ (推奨)

Gateway WS ポート (デフォルト `18789`) はデフォルトでループバックに bind します。LAN/tailnet
アクセスの場合は、明示的に bind し、認証を有効のままにしてください。

tailnet のみのセットアップでは:

- `~/.openclaw/openclaw.json` で `gateway.bind: "tailnet"` を設定します。
- Gateway を再起動します (または macOS メニューバーアプリを再起動します)。

## 何がアドバタイズされるか

Gateway だけが `_openclaw-gw._tcp` をアドバタイズします。LAN マルチキャストアドバタイズは、
plugin が有効な場合にバンドルされた `bonjour` plugin によって提供されます。ワイドエリア
DNS-SD 公開は引き続き Gateway が所有します。

## サービスタイプ

- `_openclaw-gw._tcp` — gateway トランスポートビーコン (macOS/iOS/Android ノードで使用)。

## TXT キー (秘密ではないヒント)

Gateway は UI フローを便利にするため、小さな秘密ではないヒントをアドバタイズします。

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (TLS が有効な場合のみ)
- `gatewayTlsSha256=<sha256>` (TLS が有効でフィンガープリントが利用可能な場合のみ)
- `canvasPort=<port>` (canvas ホストが有効な場合のみ。現在は `gatewayPort` と同じ)
- `transport=gateway`
- `tailnetDns=<magicdns>` (mDNS full モードのみ、Tailnet が利用可能な場合の任意のヒント)
- `sshPort=<port>` (mDNS full モードのみ。ワイドエリア DNS-SD では省略される場合があります)
- `cliPath=<path>` (mDNS full モードのみ。ワイドエリア DNS-SD でもリモートインストール用ヒントとして書き込みます)

セキュリティメモ:

- Bonjour/mDNS TXT レコードは**認証されていません**。クライアントは TXT を権威あるルーティング情報として扱ってはいけません。
- クライアントは解決されたサービスエンドポイント (SRV + A/AAAA) を使用してルーティングする必要があります。`lanHost`、`tailnetDns`、`gatewayPort`、`gatewayTlsSha256` はヒントとしてのみ扱ってください。
- SSH 自動ターゲット指定も同様に、TXT のみのヒントではなく、解決されたサービスホストを使用する必要があります。
- TLS ピンニングでは、アドバタイズされた `gatewayTlsSha256` が以前に保存されたピンを上書きすることを絶対に許可してはいけません。
- iOS/Android ノードは、検出ベースの直接接続を **TLS のみ**として扱い、初回フィンガープリントを信頼する前に明示的なユーザー確認を要求する必要があります。

## macOS でのデバッグ

便利な組み込みツール:

- インスタンスをブラウズ:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- 1 つのインスタンスを解決 (`<instance>` を置換):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

ブラウジングは機能するのに解決が失敗する場合、通常は LAN ポリシーまたは
mDNS リゾルバーの問題に当たっています。

## Gateway ログでのデバッグ

Gateway はローリングログファイルを書き込みます (起動時に
`gateway log file: ...` として出力されます)。特に次のような `bonjour:` 行を探してください。

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour は、有効な DNS ラベルである場合、アドバタイズされる `.local` ホストにシステムホスト名を使用します。
システムホスト名にスペース、アンダースコア、またはその他の無効な DNS ラベル文字が含まれる場合、
OpenClaw は `openclaw.local` にフォールバックします。明示的なホストラベルが必要な場合は、
Gateway を開始する前に `OPENCLAW_MDNS_HOSTNAME=<name>` を設定してください。

## iOS ノードでのデバッグ

iOS ノードは `NWBrowser` を使用して `_openclaw-gw._tcp` を検出します。

ログを取得するには:

- Settings → Gateway → Advanced → **検出デバッグログ**
- Settings → Gateway → Advanced → **検出ログ** → 再現 → **コピー**

ログにはブラウザー状態遷移と結果セットの変更が含まれます。

## Bonjour を有効化するタイミング

macOS ホストでの空設定 Gateway 起動では、ローカルアプリと近くの iOS/Android ノードが
同一 LAN 検出に依存することが多いため、Bonjour は自動起動します。

Linux、Windows、またはその他の非 macOS ホストで同一 LAN 自動検出が有用な場合は、
Bonjour を明示的に有効化します。

```bash
openclaw plugins enable bonjour
```

有効化されている場合、Bonjour は `discovery.mdns.mode` を使用して公開する TXT メタデータの量を決定します。
デフォルトモードは `minimal` です。ローカルクライアントが `cliPath` または `sshPort` ヒントを必要とする場合にのみ
`full` を使用し、plugin の有効化状態を変更せずに LAN マルチキャストを抑制するには `off` を使用します。

## Bonjour を無効化するタイミング

LAN マルチキャストアドバタイズが不要、利用不可、または有害な場合は、Bonjour を無効のままにしてください。
一般的なケースは、非 macOS サーバー、Docker ブリッジネットワーキング、
WSL、または mDNS マルチキャストをドロップするネットワークポリシーです。そのような環境でも
Gateway は公開 URL、SSH、Tailnet、またはワイドエリア
DNS-SD 経由で到達可能ですが、LAN 自動検出は信頼できません。

問題がデプロイスコープの場合は、既存の環境オーバーライドを優先してください。

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

これは plugin 設定を変更せずに LAN マルチキャストアドバタイズを無効化します。
設定は環境が消えると消えるため、Docker イメージ、サービスファイル、起動スクリプト、単発の
デバッグに安全です。

その OpenClaw 設定でバンドルされた LAN 検出 plugin を意図的にオフにしたい場合は、
plugin 設定を使用します。

```bash
openclaw plugins disable bonjour
```

## Docker の注意点

バンドルされた Bonjour plugin は、`OPENCLAW_DISABLE_BONJOUR` が未設定の場合、検出された
コンテナ内で LAN マルチキャストアドバタイズを自動的に無効化します。Docker ブリッジネットワークは通常、
コンテナと LAN の間で mDNS マルチキャスト (`224.0.0.251:5353`) を転送しないため、
コンテナからアドバタイズしても検出が機能することはまれです。

重要な注意点:

- Bonjour は macOS ホストで自動起動し、それ以外ではオプトインです。有効にしないままでも
  Gateway は停止せず、LAN マルチキャストアドバタイズをスキップするだけです。
- Bonjour を無効化しても `gateway.bind` は変更されません。Docker は引き続きデフォルトで
  `OPENCLAW_GATEWAY_BIND=lan` を使用するため、公開ホストポートは機能できます。
- Bonjour を無効化してもワイドエリア DNS-SD は無効化されません。Gateway とノードが同じ LAN 上にない場合は、
  ワイドエリア検出または Tailnet を使用してください。
- Docker の外部で同じ `OPENCLAW_CONFIG_DIR` を再利用しても、
  コンテナの自動無効化ポリシーは永続化されません。
- `OPENCLAW_DISABLE_BONJOUR=0` は、mDNS マルチキャストが通ることが分かっているホストネットワーキング、macvlan、または別の
  ネットワークでのみ設定してください。強制的に無効化するには `1` に設定します。

## 無効化された Bonjour のトラブルシューティング

Docker セットアップ後にノードが Gateway を自動検出しなくなった場合:

1. Gateway が auto、forced-on、forced-off のどのモードで実行されているか確認します。

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Gateway 自体が公開ポート経由で到達可能か確認します。

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Bonjour が無効な場合は直接ターゲットを使用します:
   - Control UI またはローカルツール: `http://127.0.0.1:18789`
   - LAN クライアント: `http://<gateway-host>:18789`
   - ネットワークをまたぐクライアント: Tailnet MagicDNS、Tailnet IP、SSH トンネル、または
     ワイドエリア DNS-SD

4. Docker で Bonjour plugin を意図的に有効化し、
   `OPENCLAW_DISABLE_BONJOUR=0` でアドバタイズを強制した場合は、ホストからマルチキャストをテストします。

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   ブラウジング結果が空、または Gateway ログに ciao watchdog のキャンセルが繰り返し表示される場合は、
   `OPENCLAW_DISABLE_BONJOUR=1` に戻し、直接ルートまたは
   Tailnet ルートを使用してください。

## よくある障害モード

- **Bonjour はネットワークを越えない**: Tailnet または SSH を使用してください。
- **マルチキャストがブロックされている**: 一部の Wi‑Fi ネットワークは mDNS を無効化します。
- **アドバタイザーが probing/announcing で詰まる**: マルチキャストがブロックされたホスト、
  コンテナブリッジ、WSL、またはインターフェイスの churn により、ciao アドバタイザーが
  non-announced 状態のままになることがあります。OpenClaw は数回再試行した後、
  アドバタイザーを永遠に再起動する代わりに、現在の Gateway プロセスで Bonjour を無効化します。
- **Docker ブリッジネットワーキング**: Bonjour は検出されたコンテナ内で自動無効化されます。
  `OPENCLAW_DISABLE_BONJOUR=0` は、ホスト、macvlan、またはその他の
  mDNS 対応ネットワークでのみ設定してください。
- **スリープ / インターフェイスの churn**: macOS は一時的に mDNS 結果をドロップすることがあります。再試行してください。
- **ブラウズは機能するが解決に失敗する**: マシン名は単純にしてください (絵文字や
  句読点を避ける)。その後 Gateway を再起動してください。サービスインスタンス名は
  ホスト名から派生するため、過度に複雑な名前は一部のリゾルバーを混乱させることがあります。

## エスケープされたインスタンス名 (`\032`)

Bonjour/DNS‑SD は、サービスインスタンス名内のバイトを 10 進数の `\DDD`
シーケンスとしてエスケープすることがよくあります (例: スペースは `\032` になります)。

- これはプロトコルレベルでは正常です。
- UI は表示用にデコードする必要があります (iOS は `BonjourEscapes.decode` を使用します)。

## 有効化 / 無効化 / 設定

- macOS ホストは、デフォルトでバンドルされた LAN 検出 plugin を自動起動します。
- `openclaw plugins enable bonjour` は、デフォルトで有効化されていないホスト上でバンドルされた LAN 検出 plugin を有効化します。
- `openclaw plugins disable bonjour` は、バンドルされた plugin を無効化することで LAN マルチキャストアドバタイズを無効化します。
- `OPENCLAW_DISABLE_BONJOUR=1` は、plugin 設定を変更せずに LAN マルチキャストアドバタイズを無効化します。受け入れられる truthy 値は `1`、`true`、`yes`、`on` です (レガシー: `OPENCLAW_DISABLE_BONJOUR`)。
- `OPENCLAW_DISABLE_BONJOUR=0` は、検出されたコンテナ内を含め、LAN マルチキャストアドバタイズを強制的にオンにします。受け入れられる falsy 値は `0`、`false`、`no`、`off` です。
- Bonjour plugin が有効で `OPENCLAW_DISABLE_BONJOUR` が未設定の場合、Bonjour は通常のホストではアドバタイズし、検出されたコンテナ内では自動無効化されます。
- `~/.openclaw/openclaw.json` の `gateway.bind` は Gateway bind モードを制御します。
- `OPENCLAW_SSH_PORT` は、`sshPort` がアドバタイズされる場合に SSH ポートを上書きします (レガシー: `OPENCLAW_SSH_PORT`)。
- `OPENCLAW_TAILNET_DNS` は、mDNS full モードが有効な場合に TXT 内で MagicDNS ヒントを公開します (レガシー: `OPENCLAW_TAILNET_DNS`)。
- `OPENCLAW_CLI_PATH` は、アドバタイズされる CLI パスを上書きします (レガシー: `OPENCLAW_CLI_PATH`)。

## 関連ドキュメント

- 検出ポリシーとトランスポート選択: [検出](/ja-JP/gateway/discovery)
- ノードのペアリング + 承認: [Gateway ペアリング](/ja-JP/gateway/pairing)

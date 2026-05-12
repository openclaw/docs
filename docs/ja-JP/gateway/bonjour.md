---
read_when:
    - macOS/iOS での Bonjour 検出問題のデバッグ
    - mDNS サービスタイプ、TXT レコード、または検出 UX の変更
summary: Bonjour/mDNS の探索 + デバッグ（Gateway ビーコン、クライアント、よくある失敗モード）
title: Bonjour 検出
x-i18n:
    generated_at: "2026-05-12T12:50:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 05892ee8f0dc880f68f7cf024de9452b8d999ff1af3c7ca9850fb4f2d732af0c
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw は Bonjour (mDNS / DNS-SD) を使用して、アクティブな Gateway (WebSocket エンドポイント) を検出できます。
マルチキャストの `local.` ブラウジングは **LAN 専用の利便機能**です。同梱の `bonjour`
Plugin が LAN 広告を所有します。macOS ホストでは自動起動し、Linux、Windows、
コンテナ化された Gateway デプロイではオプトインです。クロスネットワーク検出では、同じ
ビーコンを構成済みのワイドエリア DNS-SD ドメイン経由でも公開できます。検出は
引き続きベストエフォートであり、SSH や Tailnet ベースの接続を置き換えるものでは**ありません**。

## Tailscale 上のワイドエリア Bonjour (ユニキャスト DNS-SD)

ノードとゲートウェイが異なるネットワーク上にある場合、マルチキャスト mDNS は
境界を越えません。Tailscale 上の **ユニキャスト DNS-SD**
(「ワイドエリア Bonjour」) に切り替えることで、同じ検出 UX を維持できます。

概要手順:

1. Gateway ホスト上で DNS サーバーを実行します (Tailnet 経由で到達可能)。
2. 専用ゾーン配下に `_openclaw-gw._tcp` の DNS-SD レコードを公開します
   (例: `openclaw.internal.`)。
3. Tailscale の **スプリット DNS** を構成し、選択したドメインがクライアント
   (iOS を含む) からその DNS サーバー経由で解決されるようにします。

OpenClaw は任意の検出ドメインをサポートします。`openclaw.internal.` は単なる例です。
iOS/Android ノードは `local.` と構成済みのワイドエリアドメインの両方をブラウズします。

### Gateway 構成 (推奨)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### 1 回限りの DNS サーバー設定 (Gateway ホスト)

```bash
openclaw dns setup --apply
```

これにより CoreDNS がインストールされ、次のように構成されます。

- Gateway の Tailscale インターフェイス上でのみポート 53 をリッスンする
- `~/.openclaw/dns/<domain>.db` から選択したドメイン (例: `openclaw.internal.`) を提供する

tailnet 接続済みマシンから検証します。

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS 設定

Tailscale 管理コンソールで:

- Gateway の tailnet IP (UDP/TCP 53) を指すネームサーバーを追加します。
- 検出ドメインがそのネームサーバーを使用するようにスプリット DNS を追加します。

クライアントが tailnet DNS を受け入れると、iOS ノードと CLI 検出はマルチキャストなしで
検出ドメイン内の `_openclaw-gw._tcp` をブラウズできます。

### Gateway リスナーのセキュリティ (推奨)

Gateway WS ポート (デフォルト `18789`) はデフォルトでループバックにバインドされます。LAN/tailnet
アクセスでは、明示的にバインドし、認証を有効なままにしてください。

tailnet 専用セットアップの場合:

- `~/.openclaw/openclaw.json` で `gateway.bind: "tailnet"` を設定します。
- Gateway を再起動します (または macOS メニューバーアプリを再起動します)。

## 何が広告されるか

Gateway のみが `_openclaw-gw._tcp` を広告します。LAN マルチキャスト広告は、
Plugin が有効な場合に同梱の `bonjour` Plugin によって提供されます。ワイドエリア
DNS-SD 公開は引き続き Gateway が所有します。

## サービスタイプ

- `_openclaw-gw._tcp` - Gateway トランスポートビーコン (macOS/iOS/Android ノードで使用)。

## TXT キー (非シークレットのヒント)

Gateway は UI フローを便利にするため、小さな非シークレットのヒントを広告します。

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (TLS が有効な場合のみ)
- `gatewayTlsSha256=<sha256>` (TLS が有効でフィンガープリントを利用できる場合のみ)
- `canvasPort=<port>` (キャンバスホストが有効な場合のみ。現在は `gatewayPort` と同じ)
- `transport=gateway`
- `tailnetDns=<magicdns>` (mDNS フルモードのみ。Tailnet を利用できる場合の任意ヒント)
- `sshPort=<port>` (フルモードのみ。minimal モードと off モードでは省略)
- `cliPath=<path>` (フルモードのみ。minimal モードと off モードでは省略)

セキュリティノート:

- Bonjour/mDNS TXT レコードは**認証されません**。クライアントは TXT を権威あるルーティング情報として扱ってはいけません。
- クライアントは解決済みサービスエンドポイント (SRV + A/AAAA) を使用してルーティングする必要があります。`lanHost`、`tailnetDns`、`gatewayPort`、`gatewayTlsSha256` はヒントとしてのみ扱います。
- SSH 自動ターゲティングも同様に、TXT のみのヒントではなく、解決済みサービスホストを使用する必要があります。
- TLS ピンニングでは、広告された `gatewayTlsSha256` によって、以前保存したピンを上書きすることを決して許可してはいけません。
- iOS/Android ノードは、検出ベースの直接接続を **TLS のみ**として扱い、初回フィンガープリントを信頼する前に明示的なユーザー確認を要求する必要があります。

## macOS でのデバッグ

便利な組み込みツール:

- インスタンスをブラウズする:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- 1 つのインスタンスを解決する (`<instance>` を置き換えてください):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

ブラウズは動作するが解決が失敗する場合、通常は LAN ポリシーまたは
mDNS リゾルバーの問題に当たっています。

## Gateway ログでのデバッグ

Gateway はローリングログファイルを書き込みます (起動時に
`gateway log file: ...` として表示されます)。特に次のような `bonjour:` 行を探してください。

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

watchdog は、アクティブな `probing`、`announcing`、および新しい競合リネームを
進行中の状態として扱います。サービスが `announced` に到達しない場合、OpenClaw は最終的に
advertiser を再作成し、失敗が繰り返された後は、永遠に再広告し続けるのではなく、その
Gateway プロセスの Bonjour を無効化します。

Bonjour は、システムホスト名が有効な DNS ラベルである場合、広告される `.local` ホストに
システムホスト名を使用します。システムホスト名にスペース、アンダースコア、またはその他の
無効な DNS ラベル文字が含まれる場合、OpenClaw は `openclaw.local` にフォールバックします。
明示的なホストラベルが必要な場合は、Gateway を起動する前に
`OPENCLAW_MDNS_HOSTNAME=<name>` を設定してください。

## iOS ノードでのデバッグ

iOS ノードは `NWBrowser` を使用して `_openclaw-gw._tcp` を検出します。

ログを取得するには:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → 再現 → **Copy**

ログには、ブラウザー状態の遷移と結果セットの変更が含まれます。

## Bonjour を有効にするタイミング

Bonjour は、macOS ホストで空の構成の Gateway 起動時に自動起動します。これは、
ローカルアプリと近くの iOS/Android ノードが同一 LAN 検出に依存することが多いためです。

Linux、Windows、またはその他の非 macOS ホストで同一 LAN 自動検出が役立つ場合は、
Bonjour を明示的に有効にします。

```bash
openclaw plugins enable bonjour
```

有効な場合、Bonjour は `discovery.mdns.mode` を使用して、公開する TXT メタデータの量を決定します。
同じモードは、ワイドエリア DNS-SD レコード内の任意の TXT ヒントも制御します。
デフォルトモードは `minimal` です。クライアントが `cliPath` または
`sshPort` ヒントを必要とする場合にのみ `full` を使用してください。Plugin の有効化状態を変更せずに
LAN マルチキャストを抑制するには `off` を使用します。`discovery.wideArea.enabled` が true の場合、
ワイドエリア DNS-SD は引き続き minimal Gateway ビーコンを公開できます。

## Bonjour を無効にするタイミング

LAN マルチキャスト広告が不要、利用不可、または有害な場合は、Bonjour を無効のままにしてください。
一般的なケースは、非 macOS サーバー、Docker ブリッジネットワーク、WSL、または mDNS マルチキャストを
ドロップするネットワークポリシーです。これらの環境でも Gateway は公開 URL、SSH、Tailnet、または
ワイドエリア DNS-SD 経由で到達可能ですが、LAN 自動検出は信頼できません。

問題がデプロイ範囲に限定される場合は、既存の環境オーバーライドを優先します。

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

これにより、Plugin 構成を変更せずに LAN マルチキャスト広告が無効になります。
Docker イメージ、サービスファイル、起動スクリプト、単発のデバッグに安全です。環境が消えると
設定も消えるためです。

その OpenClaw 構成で同梱の LAN 検出 Plugin を意図的にオフにしたい場合は、Plugin 構成を使用します。

```bash
openclaw plugins disable bonjour
```

## Docker の注意点

同梱の Bonjour Plugin は、`OPENCLAW_DISABLE_BONJOUR` が未設定の場合、検出された
コンテナ内で LAN マルチキャスト広告を自動的に無効化します。Docker ブリッジネットワークは通常、
コンテナと LAN の間で mDNS マルチキャスト (`224.0.0.251:5353`) を転送しないため、
コンテナからの広告で検出が動作することはほとんどありません。

重要な注意点:

- Bonjour は macOS ホストでは自動起動し、それ以外ではオプトインです。無効のままにしても
  Gateway は停止しません。LAN マルチキャスト広告をスキップするだけです。
- Bonjour を無効にしても `gateway.bind` は変更されません。Docker は引き続き
  `OPENCLAW_GATEWAY_BIND=lan` をデフォルトとするため、公開ホストポートは動作できます。
- Bonjour を無効にしてもワイドエリア DNS-SD は無効になりません。Gateway とノードが同じ LAN にない場合は、
  ワイドエリア検出または Tailnet を使用してください。
- Docker 外部で同じ `OPENCLAW_CONFIG_DIR` を再利用しても、コンテナの自動無効化ポリシーは永続化されません。
- `OPENCLAW_DISABLE_BONJOUR=0` は、ホストネットワーク、macvlan、または mDNS マルチキャストが
  通過することが分かっている別のネットワークの場合にのみ設定します。強制的に無効化するには `1` に設定します。

## 無効化された Bonjour のトラブルシューティング

Docker セットアップ後にノードが Gateway を自動検出しなくなった場合:

1. Gateway が auto、forced-on、forced-off のどのモードで実行されているか確認します。

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Gateway 自体が公開ポート経由で到達可能であることを確認します。

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Bonjour が無効な場合は直接ターゲットを使用します。
   - コントロール UI またはローカルツール: `http://127.0.0.1:18789`
   - LAN クライアント: `http://<gateway-host>:18789`
   - クロスネットワーククライアント: Tailnet MagicDNS、Tailnet IP、SSH トンネル、または
     ワイドエリア DNS-SD

4. Docker 内で Bonjour Plugin を意図的に有効化し、`OPENCLAW_DISABLE_BONJOUR=0` で広告を強制した場合は、
   ホストからマルチキャストをテストします。

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   ブラウズ結果が空、または Gateway ログに ciao watchdog のキャンセルが繰り返し表示される場合は、
   `OPENCLAW_DISABLE_BONJOUR=1` に戻し、直接ルートまたは Tailnet ルートを使用してください。

## 一般的な失敗モード

- **Bonjour はネットワークをまたぎません**: Tailnet または SSH を使用してください。
- **マルチキャストがブロックされている**: 一部の Wi-Fi ネットワークは mDNS を無効にします。
- **Advertiser が probing/announcing で詰まる**: マルチキャストがブロックされたホスト、
  コンテナブリッジ、WSL、またはインターフェイスの変動により、ciao advertiser が
  non-announced 状態のままになることがあります。OpenClaw は数回再試行した後、advertiser を
  永遠に再起動するのではなく、現在の Gateway プロセスの Bonjour を無効化します。
- **Docker ブリッジネットワーク**: Bonjour は検出されたコンテナ内で自動的に無効化されます。
  `OPENCLAW_DISABLE_BONJOUR=0` は、ホスト、macvlan、またはその他の
  mDNS 対応ネットワークの場合にのみ設定してください。
- **スリープ / インターフェイスの変動**: macOS は一時的に mDNS 結果を失うことがあります。再試行してください。
- **ブラウズは動作するが解決が失敗する**: マシン名をシンプルに保ち (絵文字や
  句読点を避ける)、その後 Gateway を再起動してください。サービスインスタンス名は
  ホスト名から派生するため、過度に複雑な名前は一部のリゾルバーを混乱させる可能性があります。

## エスケープされたインスタンス名 (`\032`)

Bonjour/DNS-SD は、サービスインスタンス名内のバイトを 10 進数の `\DDD`
シーケンスとしてエスケープすることがよくあります (例: スペースは `\032` になります)。

- これはプロトコルレベルでは正常です。
- UI は表示用にデコードする必要があります (iOS は `BonjourEscapes.decode` を使用します)。

## 有効化 / 無効化 / 構成

- macOS ホストは、バンドルされた LAN 検出 Plugin をデフォルトで自動起動します。
- `openclaw plugins enable bonjour` は、デフォルトで有効化されていないホストで、バンドルされた LAN 検出 Plugin を有効化します。
- `openclaw plugins disable bonjour` は、バンドルされた Plugin を無効化することで LAN マルチキャストアドバタイズを無効化します。
- `OPENCLAW_DISABLE_BONJOUR=1` は、Plugin 設定を変更せずに LAN マルチキャストアドバタイズを無効化します。受け付けられる truthy 値は `1`、`true`、`yes`、`on` です（レガシー: `OPENCLAW_DISABLE_BONJOUR`）。
- `OPENCLAW_DISABLE_BONJOUR=0` は、検出されたコンテナ内を含め、LAN マルチキャストアドバタイズを強制的に有効化します。受け付けられる falsy 値は `0`、`false`、`no`、`off` です。
- Bonjour Plugin が有効で、`OPENCLAW_DISABLE_BONJOUR` が未設定の場合、Bonjour は通常のホストでアドバタイズし、検出されたコンテナ内では自動的に無効化されます。
- `~/.openclaw/openclaw.json` の `gateway.bind` は Gateway のバインドモードを制御します。
- `OPENCLAW_SSH_PORT` は、`sshPort` がアドバタイズされるときの SSH ポートを上書きします（レガシー: `OPENCLAW_SSH_PORT`）。
- `OPENCLAW_TAILNET_DNS` は、mDNS フルモードが有効なときに TXT で MagicDNS ヒントを公開します（レガシー: `OPENCLAW_TAILNET_DNS`）。
- `OPENCLAW_CLI_PATH` は、アドバタイズされる CLI パスを上書きします（レガシー: `OPENCLAW_CLI_PATH`）。

## 関連ドキュメント

- 検出ポリシーとトランスポート選択: [検出](/ja-JP/gateway/discovery)
- Node ペアリング + 承認: [Gateway ペアリング](/ja-JP/gateway/pairing)

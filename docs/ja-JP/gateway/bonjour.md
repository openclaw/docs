---
read_when:
    - macOS/iOS での Bonjour 検出問題のデバッグ
    - mDNS サービス種別、TXT レコード、検出 UX の変更
summary: Bonjour/mDNS の検出とデバッグ（Gateway ビーコン、クライアント、一般的な失敗モード）
title: Bonjour 検出
x-i18n:
    generated_at: "2026-05-06T05:04:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7b7d029e6eb6bee90eb96e7ea169ecadf3bda6d969b2450349c5716a950e205
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw は Bonjour (mDNS / DNS-SD) を使用して、アクティブな Gateway (WebSocket エンドポイント) を検出できます。
マルチキャストの `local.` ブラウズは **LAN 専用の利便機能**です。バンドルされた `bonjour`
plugin が LAN アドバタイズを所有します。macOS ホストでは自動起動し、
Linux、Windows、コンテナ化された Gateway デプロイではオプトインです。クロスネットワーク検出では、同じ
ビーコンを構成済みの広域 DNS-SD ドメイン経由で公開することもできます。検出は
引き続きベストエフォートであり、SSH や Tailnet ベースの接続を置き換えるものでは**ありません**。

## Tailscale 経由の広域 Bonjour (ユニキャスト DNS-SD)

ノードと Gateway が異なるネットワーク上にある場合、マルチキャスト mDNS はその
境界を越えません。Tailscale 経由で **ユニキャスト DNS-SD**
(「広域 Bonjour」) に切り替えることで、同じ検出 UX を維持できます。

概要手順:

1. Gateway ホスト上で DNS サーバーを実行します (Tailnet 経由で到達可能)。
2. 専用ゾーン
   (例: `openclaw.internal.`) の下に `_openclaw-gw._tcp` の DNS-SD レコードを公開します。
3. 選択したドメインがクライアント (iOS を含む) でその
   DNS サーバー経由で解決されるように、Tailscale **スプリット DNS** を構成します。

OpenClaw は任意の検出ドメインをサポートします。`openclaw.internal.` は単なる例です。
iOS/Android ノードは `local.` と構成済みの広域ドメインの両方をブラウズします。

### Gateway 設定 (推奨)

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

- Gateway の Tailscale インターフェイス上のポート 53 のみでリッスンする
- 選択したドメイン (例: `openclaw.internal.`) を `~/.openclaw/dns/<domain>.db` から提供する

tailnet 接続済みのマシンから検証します。

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS 設定

Tailscale 管理コンソールで:

- Gateway の tailnet IP (UDP/TCP 53) を指すネームサーバーを追加します。
- 検出ドメインがそのネームサーバーを使うようにスプリット DNS を追加します。

クライアントが tailnet DNS を受け入れると、iOS ノードと CLI 検出は
マルチキャストなしで、検出ドメイン内の `_openclaw-gw._tcp` をブラウズできます。

### Gateway リスナーのセキュリティ (推奨)

Gateway WS ポート (デフォルト `18789`) はデフォルトでループバックにバインドします。LAN/tailnet
アクセスでは、明示的にバインドして認証を有効のままにします。

tailnet 専用の設定では:

- `~/.openclaw/openclaw.json` で `gateway.bind: "tailnet"` を設定します。
- Gateway を再起動します (または macOS メニューバーアプリを再起動します)。

## アドバタイズするもの

Gateway のみが `_openclaw-gw._tcp` をアドバタイズします。LAN マルチキャストアドバタイズは、
plugin が有効な場合にバンドルされた `bonjour` plugin によって提供されます。広域
DNS-SD 公開は引き続き Gateway が所有します。

## サービスタイプ

- `_openclaw-gw._tcp` - Gateway トランスポートビーコン (macOS/iOS/Android ノードで使用)。

## TXT キー (秘密ではないヒント)

Gateway は UI フローを便利にするため、小さな非秘密のヒントをアドバタイズします。

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (TLS が有効な場合のみ)
- `gatewayTlsSha256=<sha256>` (TLS が有効でフィンガープリントが利用可能な場合のみ)
- `canvasPort=<port>` (キャンバスホストが有効な場合のみ。現在は `gatewayPort` と同じ)
- `transport=gateway`
- `tailnetDns=<magicdns>` (mDNS full モードのみ、Tailnet が利用可能な場合の任意のヒント)
- `sshPort=<port>` (mDNS full モードのみ。広域 DNS-SD では省略される場合があります)
- `cliPath=<path>` (mDNS full モードのみ。広域 DNS-SD でもリモートインストールのヒントとして書き込みます)

セキュリティメモ:

- Bonjour/mDNS TXT レコードは**認証されません**。クライアントは TXT を信頼できるルーティング情報として扱ってはいけません。
- クライアントは解決済みサービスエンドポイント (SRV + A/AAAA) を使用してルーティングする必要があります。`lanHost`、`tailnetDns`、`gatewayPort`、`gatewayTlsSha256` はヒントとしてのみ扱います。
- SSH 自動ターゲット設定も同様に、TXT のみのヒントではなく、解決済みサービスホストを使用する必要があります。
- TLS ピンニングでは、アドバタイズされた `gatewayTlsSha256` が以前保存されたピンを上書きすることを決して許可してはいけません。
- iOS/Android ノードは、検出ベースの直接接続を **TLS のみ**として扱い、初回フィンガープリントを信頼する前に明示的なユーザー確認を要求する必要があります。

## macOS でのデバッグ

便利な組み込みツール:

- インスタンスをブラウズ:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- 1 つのインスタンスを解決 (`<instance>` を置き換え):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

ブラウズは成功するが解決が失敗する場合、通常は LAN ポリシーまたは
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
システムホスト名にスペース、アンダースコア、またはその他の
無効な DNS ラベル文字が含まれる場合、OpenClaw は `openclaw.local` にフォールバックします。
明示的なホストラベルが必要な場合は、Gateway を起動する前に
`OPENCLAW_MDNS_HOSTNAME=<name>` を設定してください。

## iOS ノードでのデバッグ

iOS ノードは `NWBrowser` を使用して `_openclaw-gw._tcp` を検出します。

ログを取得するには:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → 再現 → **Copy**

ログにはブラウザー状態遷移と結果セットの変更が含まれます。

## Bonjour を有効にする場合

Bonjour は、macOS ホストで空設定の Gateway 起動時に自動起動します。これは、
ローカルアプリと近くの iOS/Android ノードが同一 LAN 検出に依存することが多いためです。

Linux、Windows、または別の非 macOS ホストで同一 LAN の自動検出が有用な場合は、
Bonjour を明示的に有効にします。

```bash
openclaw plugins enable bonjour
```

有効な場合、Bonjour は公開する TXT メタデータの量を `discovery.mdns.mode` で決定します。
デフォルトモードは `minimal` です。ローカルクライアントが
`cliPath` または `sshPort` ヒントを必要とする場合のみ `full` を使用し、
plugin の有効化状態を変えずに LAN マルチキャストを抑制するには `off` を使用します。

## Bonjour を無効にする場合

LAN マルチキャストアドバタイズが不要、利用不能、または有害な場合は、Bonjour を無効のままにします。
一般的なケースは、非 macOS サーバー、Docker ブリッジネットワーク、
WSL、または mDNS マルチキャストを破棄するネットワークポリシーです。これらの環境では
Gateway は公開 URL、SSH、Tailnet、または広域
DNS-SD 経由で引き続き到達可能ですが、LAN 自動検出は信頼できません。

問題がデプロイ範囲のものである場合は、既存の環境オーバーライドを優先します。

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

これにより、plugin 設定を変更せずに LAN マルチキャストアドバタイズが無効になります。
この設定は環境が消えると消えるため、Docker イメージ、サービスファイル、起動スクリプト、一時的な
デバッグに安全です。

その OpenClaw 設定でバンドルされた LAN
検出 plugin を意図的にオフにしたい場合は、plugin 設定を使用します。

```bash
openclaw plugins disable bonjour
```

## Docker の注意点

バンドルされた Bonjour plugin は、`OPENCLAW_DISABLE_BONJOUR` が未設定の場合、検出された
コンテナ内で LAN マルチキャストアドバタイズを自動的に無効にします。Docker ブリッジネットワークは
通常、コンテナと LAN の間で mDNS マルチキャスト (`224.0.0.251:5353`) を転送しないため、
コンテナからアドバタイズしても検出が機能することはほとんどありません。

重要な注意点:

- Bonjour は macOS ホストでは自動起動し、それ以外ではオプトインです。
  無効のままにしても Gateway は停止せず、LAN マルチキャストアドバタイズをスキップするだけです。
- Bonjour を無効にしても `gateway.bind` は変更されません。Docker は引き続きデフォルトで
  `OPENCLAW_GATEWAY_BIND=lan` を使用するため、公開ホストポートは動作できます。
- Bonjour を無効にしても広域 DNS-SD は無効になりません。Gateway とノードが同じ LAN 上にない場合は、広域検出
  または Tailnet を使用します。
- Docker の外で同じ `OPENCLAW_CONFIG_DIR` を再利用しても、
  コンテナの自動無効化ポリシーは永続化されません。
- mDNS マルチキャストが通ることが分かっているホストネットワーク、macvlan、または別の
  ネットワークでのみ `OPENCLAW_DISABLE_BONJOUR=0` を設定します。強制的に無効にするには `1` を設定します。

## 無効化された Bonjour のトラブルシューティング

Docker 設定後にノードが Gateway を自動検出しなくなった場合:

1. Gateway が auto、forced-on、forced-off のどのモードで実行されているかを確認します。

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Gateway 自体が公開ポート経由で到達可能であることを確認します。

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Bonjour が無効な場合は直接ターゲットを使用します。
   - Control UI またはローカルツール: `http://127.0.0.1:18789`
   - LAN クライアント: `http://<gateway-host>:18789`
   - クロスネットワーククライアント: Tailnet MagicDNS、Tailnet IP、SSH トンネル、または
     広域 DNS-SD

4. Docker 内で Bonjour plugin を意図的に有効にし、
   `OPENCLAW_DISABLE_BONJOUR=0` でアドバタイズを強制した場合は、ホストからマルチキャストをテストします。

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   ブラウズ結果が空であるか、Gateway ログに ciao watchdog
   キャンセルの繰り返しが表示される場合は、`OPENCLAW_DISABLE_BONJOUR=1` を復元し、直接または
   Tailnet ルートを使用します。

## 一般的な失敗モード

- **Bonjour はネットワークを越えません**: Tailnet または SSH を使用してください。
- **マルチキャストがブロックされています**: 一部の Wi-Fi ネットワークは mDNS を無効にしています。
- **アドバタイザーが probing/announcing で停止している**: マルチキャストがブロックされたホスト、
  コンテナブリッジ、WSL、またはインターフェイスの変動により、ciao アドバタイザーが
  非アナウンス状態のままになることがあります。OpenClaw は数回再試行した後、
  アドバタイザーを永遠に再起動するのではなく、現在の Gateway プロセスで Bonjour を無効にします。
- **Docker ブリッジネットワーク**: Bonjour は検出されたコンテナ内で自動無効化されます。
  `OPENCLAW_DISABLE_BONJOUR=0` は、ホスト、macvlan、または別の
  mDNS 対応ネットワークでのみ設定してください。
- **スリープ / インターフェイス変動**: macOS は一時的に mDNS 結果を落とす場合があります。再試行してください。
- **ブラウズは成功するが解決が失敗する**: マシン名を単純に保ち (絵文字や
  句読点を避ける)、その後 Gateway を再起動してください。サービスインスタンス名は
  ホスト名から派生するため、過度に複雑な名前は一部のリゾルバーを混乱させることがあります。

## エスケープされたインスタンス名 (`\032`)

Bonjour/DNS-SD は、多くの場合、サービスインスタンス名のバイトを 10 進の `\DDD`
シーケンスとしてエスケープします (例: スペースは `\032` になります)。

- これはプロトコルレベルでは正常です。
- UI は表示用にデコードする必要があります (iOS は `BonjourEscapes.decode` を使用します)。

## 有効化 / 無効化 / 設定

- macOS ホストは、デフォルトでバンドルされた LAN 検出 plugin を自動起動します。
- `openclaw plugins enable bonjour` は、デフォルトで有効化されていないホスト上で、バンドルされた LAN 検出 plugin を有効にします。
- `openclaw plugins disable bonjour` は、バンドルされた plugin を無効にすることで LAN マルチキャストアドバタイズを無効にします。
- `OPENCLAW_DISABLE_BONJOUR=1` は、plugin 設定を変更せずに LAN マルチキャストアドバタイズを無効にします。受け付ける真値は `1`、`true`、`yes`、`on` です (レガシー: `OPENCLAW_DISABLE_BONJOUR`)。
- `OPENCLAW_DISABLE_BONJOUR=0` は、検出されたコンテナ内を含めて LAN マルチキャストアドバタイズを強制的に有効にします。受け付ける偽値は `0`、`false`、`no`、`off` です。
- Bonjour plugin が有効で `OPENCLAW_DISABLE_BONJOUR` が未設定の場合、Bonjour は通常のホストでアドバタイズし、検出されたコンテナ内では自動無効化します。
- `~/.openclaw/openclaw.json` の `gateway.bind` は Gateway バインドモードを制御します。
- `OPENCLAW_SSH_PORT` は、`sshPort` がアドバタイズされる場合に SSH ポートを上書きします (レガシー: `OPENCLAW_SSH_PORT`)。
- `OPENCLAW_TAILNET_DNS` は、mDNS full モードが有効な場合に TXT 内で MagicDNS ヒントを公開します (レガシー: `OPENCLAW_TAILNET_DNS`)。
- `OPENCLAW_CLI_PATH` は、アドバタイズされる CLI パスを上書きします (レガシー: `OPENCLAW_CLI_PATH`)。

## 関連ドキュメント

- 検出ポリシーとトランスポート選択: [検出](/ja-JP/gateway/discovery)
- ノードのペアリング + 承認: [Gateway ペアリング](/ja-JP/gateway/pairing)

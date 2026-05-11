---
read_when:
    - macOS/iOS での Bonjour 検出問題のデバッグ
    - mDNS サービスタイプ、TXT レコード、または検出 UX の変更
summary: Bonjour/mDNS 検出 + デバッグ（Gateway ビーコン、クライアント、一般的な障害モード）
title: Bonjour 検出
x-i18n:
    generated_at: "2026-05-11T20:29:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03bd9403591a389c06d3131e4c110d4ccf711eee56cbe9a5c9baed2b6df8fb80
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw は Bonjour (mDNS / DNS-SD) を使用して、アクティブな Gateway (WebSocket エンドポイント) を検出できます。
マルチキャスト `local.` ブラウズは **LAN のみの利便機能** です。同梱の `bonjour`
Plugin が LAN 広告を担います。macOS ホストでは自動起動し、
Linux、Windows、コンテナ化された Gateway デプロイではオプトインです。クロスネットワーク検出では、同じ
ビーコンを構成済みの広域 DNS-SD ドメイン経由でも公開できます。検出は
引き続きベストエフォートであり、SSH や Tailnet ベースの接続を置き換えるものでは **ありません**。

## Tailscale 経由の広域 Bonjour (ユニキャスト DNS-SD)

Node と Gateway が異なるネットワーク上にある場合、マルチキャスト mDNS はその
境界を越えません。Tailscale 経由の **ユニキャスト DNS-SD**
(「広域 Bonjour」) に切り替えることで、同じ検出 UX を維持できます。

大まかな手順:

1. Gateway ホスト上で DNS サーバーを実行します (Tailnet 経由で到達可能)。
2. 専用ゾーン
   (例: `openclaw.internal.`) 配下で `_openclaw-gw._tcp` の DNS-SD レコードを公開します。
3. Tailscale **split DNS** を構成し、選択したドメインがクライアント (iOS を含む) でその
   DNS サーバーを介して解決されるようにします。

OpenClaw は任意の検出ドメインをサポートします。`openclaw.internal.` は単なる例です。
iOS/Android Node は `local.` と構成済みの広域ドメインの両方をブラウズします。

### Gateway 構成 (推奨)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### 1 回限りの DNS サーバーセットアップ (Gateway ホスト)

```bash
openclaw dns setup --apply
```

これは CoreDNS をインストールし、次のように構成します。

- Gateway の Tailscale インターフェイス上でのみポート 53 を listen する
- 選択したドメイン (例: `openclaw.internal.`) を `~/.openclaw/dns/<domain>.db` から提供する

tailnet 接続済みマシンから検証します。

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS 設定

Tailscale 管理コンソールで:

- Gateway の tailnet IP (UDP/TCP 53) を指すネームサーバーを追加します。
- 検出ドメインがそのネームサーバーを使用するよう split DNS を追加します。

クライアントが tailnet DNS を受け入れると、iOS Node と CLI 検出はマルチキャストなしで
検出ドメイン内の `_openclaw-gw._tcp` をブラウズできます。

### Gateway リスナーのセキュリティ (推奨)

Gateway WS ポート (デフォルト `18789`) はデフォルトでループバックにバインドされます。LAN/tailnet
アクセスの場合は明示的にバインドし、認証を有効のままにしてください。

tailnet のみのセットアップの場合:

- `~/.openclaw/openclaw.json` で `gateway.bind: "tailnet"` を設定します。
- Gateway を再起動します (または macOS メニューバーアプリを再起動します)。

## 何が広告するか

Gateway のみが `_openclaw-gw._tcp` を広告します。LAN マルチキャスト広告は、
Plugin が有効な場合に同梱の `bonjour` Plugin によって提供されます。広域
DNS-SD 公開は引き続き Gateway が所有します。

## サービスタイプ

- `_openclaw-gw._tcp` - Gateway トランスポートビーコン (macOS/iOS/Android Node が使用)。

## TXT キー (非シークレットのヒント)

Gateway は UI フローを便利にするため、小さな非シークレットのヒントを広告します。

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (TLS が有効な場合のみ)
- `gatewayTlsSha256=<sha256>` (TLS が有効でフィンガープリントが利用可能な場合のみ)
- `canvasPort=<port>` (キャンバスホストが有効な場合のみ。現在は `gatewayPort` と同じ)
- `transport=gateway`
- `tailnetDns=<magicdns>` (mDNS フルモードのみ。Tailnet が利用可能な場合の任意ヒント)
- `sshPort=<port>` (mDNS フルモードのみ。広域 DNS-SD では省略される場合があります)
- `cliPath=<path>` (mDNS フルモードのみ。広域 DNS-SD でもリモートインストール用ヒントとして書き込みます)

セキュリティメモ:

- Bonjour/mDNS TXT レコードは **認証されていません**。クライアントは TXT を権威あるルーティング情報として扱ってはいけません。
- クライアントは解決済みサービスエンドポイント (SRV + A/AAAA) を使用してルーティングするべきです。`lanHost`、`tailnetDns`、`gatewayPort`、`gatewayTlsSha256` はヒントとしてのみ扱ってください。
- SSH 自動ターゲット指定も同様に、TXT のみのヒントではなく、解決済みサービスホストを使用するべきです。
- TLS ピンニングでは、広告された `gatewayTlsSha256` が以前に保存されたピンを上書きすることを絶対に許可してはいけません。
- iOS/Android Node は、検出ベースの直接接続を **TLS のみ** として扱い、初回フィンガープリントを信頼する前に明示的なユーザー確認を要求するべきです。

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

ブラウズは機能するが解決に失敗する場合、通常は LAN ポリシーまたは
mDNS リゾルバーの問題に遭遇しています。

## Gateway ログでのデバッグ

Gateway はローリングログファイルを書き込みます (起動時に
`gateway log file: ...` として出力されます)。`bonjour:` 行、特に次を確認してください。

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

ウォッチドッグは、アクティブな `probing`、`announcing`、新しい競合リネームを
進行中状態として扱います。サービスが `announced` に到達しない場合、OpenClaw は最終的に
広告元を再作成し、失敗が繰り返された後は、いつまでも再広告する代わりに、その
Gateway プロセスで Bonjour を無効にします。

Bonjour は、有効な DNS ラベルである場合、広告される `.local` ホストにシステムホスト名を使用します。
システムホスト名にスペース、アンダースコア、またはその他の無効な DNS ラベル文字が含まれる場合、
OpenClaw は `openclaw.local` にフォールバックします。明示的なホストラベルが必要な場合は、
Gateway を起動する前に `OPENCLAW_MDNS_HOSTNAME=<name>` を設定してください。

## iOS Node でのデバッグ

iOS Node は `NWBrowser` を使用して `_openclaw-gw._tcp` を検出します。

ログを取得するには:

- 設定 → Gateway → 詳細 → **検出デバッグログ**
- 設定 → Gateway → 詳細 → **検出ログ** → 再現 → **コピー**

ログにはブラウザー状態遷移と結果セットの変更が含まれます。

## Bonjour を有効にするタイミング

ローカルアプリと近くの iOS/Android Node が同一 LAN 検出に依存することが多いため、
macOS ホストで空構成の Gateway を起動すると Bonjour は自動起動します。

Linux、Windows、または別の非 macOS ホストで同一 LAN の自動検出が有用な場合は、
Bonjour を明示的に有効にします。

```bash
openclaw plugins enable bonjour
```

有効な場合、Bonjour は `discovery.mdns.mode` を使用して公開する TXT メタデータ量を決定します。
デフォルトモードは `minimal` です。ローカルクライアントが
`cliPath` または `sshPort` ヒントを必要とする場合のみ `full` を使用し、Plugin の有効化状態を
変更せずに LAN マルチキャストを抑止するには `off` を使用します。

## Bonjour を無効にするタイミング

LAN マルチキャスト広告が不要、利用不能、または有害な場合は Bonjour を無効のままにします。
一般的なケースは、非 macOS サーバー、Docker ブリッジネットワーク、
WSL、または mDNS マルチキャストを破棄するネットワークポリシーです。これらの環境では、
Gateway は公開 URL、SSH、Tailnet、または広域
DNS-SD 経由で引き続き到達可能ですが、LAN 自動検出は信頼できません。

問題がデプロイ範囲に限られる場合は、既存の環境オーバーライドを優先してください。

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

これは Plugin 構成を変更せずに LAN マルチキャスト広告を無効にします。
環境が消えると設定も消えるため、Docker イメージ、サービスファイル、起動スクリプト、単発の
デバッグに安全です。

その OpenClaw 構成で同梱の LAN
検出 Plugin を意図的にオフにしたい場合は、Plugin 構成を使用します。

```bash
openclaw plugins disable bonjour
```

## Docker の注意点

同梱の Bonjour Plugin は、`OPENCLAW_DISABLE_BONJOUR` が未設定の場合、検出された
コンテナ内で LAN マルチキャスト広告を自動的に無効にします。Docker ブリッジネットワークは
通常、コンテナと LAN の間で mDNS マルチキャスト (`224.0.0.251:5353`) を転送しないため、
コンテナから広告しても検出が機能することはほとんどありません。

重要な注意点:

- Bonjour は macOS ホストでは自動起動し、それ以外ではオプトインです。無効のままにしても
  Gateway は停止しません。LAN マルチキャスト広告をスキップするだけです。
- Bonjour を無効にしても `gateway.bind` は変更されません。Docker は引き続きデフォルトで
  `OPENCLAW_GATEWAY_BIND=lan` を使用するため、公開ホストポートは機能できます。
- Bonjour を無効にしても広域 DNS-SD は無効になりません。Gateway と Node が同じ LAN 上にない場合は、
  広域検出または Tailnet を使用してください。
- Docker 外で同じ `OPENCLAW_CONFIG_DIR` を再利用しても、
  コンテナの自動無効化ポリシーは永続化されません。
- `OPENCLAW_DISABLE_BONJOUR=0` は、ホストネットワーク、macvlan、または mDNS マルチキャストが通過することが
  分かっている別のネットワークでのみ設定してください。強制的に無効化するには `1` に設定します。

## 無効化された Bonjour のトラブルシューティング

Docker セットアップ後に Node が Gateway を自動検出しなくなった場合:

1. Gateway が auto、forced-on、または forced-off モードのどれで実行されているか確認します。

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
     広域 DNS-SD

4. Docker で Bonjour Plugin を意図的に有効にし、`OPENCLAW_DISABLE_BONJOUR=0` で広告を強制した場合は、
   ホストからマルチキャストをテストします。

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   ブラウズ結果が空、または Gateway ログに ciao ウォッチドッグのキャンセルが繰り返し表示される場合は、
   `OPENCLAW_DISABLE_BONJOUR=1` に戻し、直接ルートまたは
   Tailnet ルートを使用してください。

## よくある失敗モード

- **Bonjour はネットワークを越えません**: Tailnet または SSH を使用してください。
- **マルチキャストがブロックされている**: 一部の Wi-Fi ネットワークでは mDNS が無効化されています。
- **広告元が probing/announcing で停止する**: マルチキャストがブロックされたホスト、
  コンテナブリッジ、WSL、またはインターフェイスの変動により、ciao 広告元が
  non-announced 状態のままになることがあります。OpenClaw は数回再試行し、その後は広告元を
  永久に再起動する代わりに、現在の Gateway プロセスで Bonjour を無効にします。
- **Docker ブリッジネットワーク**: 検出されたコンテナでは Bonjour が自動的に無効になります。
  `OPENCLAW_DISABLE_BONJOUR=0` は、ホスト、macvlan、または別の
  mDNS 対応ネットワークでのみ設定してください。
- **スリープ / インターフェイス変動**: macOS では mDNS 結果が一時的に消える場合があります。再試行してください。
- **ブラウズは機能するが解決に失敗する**: マシン名をシンプルに保ち (絵文字や
  句読点を避ける)、その後 Gateway を再起動してください。サービスインスタンス名は
  ホスト名から派生するため、過度に複雑な名前は一部のリゾルバーを混乱させる可能性があります。

## エスケープされたインスタンス名 (`\032`)

Bonjour/DNS-SD は、多くの場合、サービスインスタンス名内のバイトを 10 進数の `\DDD`
シーケンスとしてエスケープします (例: スペースは `\032` になります)。

- これはプロトコルレベルでは正常です。
- UI では表示用にデコードするべきです (iOS は `BonjourEscapes.decode` を使用します)。

## 有効化 / 無効化 / 構成

- macOS ホストでは、同梱の LAN 検出Pluginがデフォルトで自動起動します。
- `openclaw plugins enable bonjour` は、デフォルトで有効化されていないホスト上で同梱の LAN 検出Pluginを有効にします。
- `openclaw plugins disable bonjour` は、同梱Pluginを無効にすることで LAN マルチキャスト広告を無効にします。
- `OPENCLAW_DISABLE_BONJOUR=1` は、Plugin設定を変更せずに LAN マルチキャスト広告を無効にします。受け入れられる真値は `1`、`true`、`yes`、`on` です（レガシー: `OPENCLAW_DISABLE_BONJOUR`）。
- `OPENCLAW_DISABLE_BONJOUR=0` は、検出されたコンテナ内も含めて LAN マルチキャスト広告を強制的に有効にします。受け入れられる偽値は `0`、`false`、`no`、`off` です。
- Bonjour Pluginが有効で、`OPENCLAW_DISABLE_BONJOUR` が未設定の場合、Bonjour は通常のホスト上で広告し、検出されたコンテナ内では自動的に無効になります。
- `~/.openclaw/openclaw.json` の `gateway.bind` は Gateway のバインドモードを制御します。
- `OPENCLAW_SSH_PORT` は、`sshPort` が広告される場合の SSH ポートを上書きします（レガシー: `OPENCLAW_SSH_PORT`）。
- `OPENCLAW_TAILNET_DNS` は、mDNS フルモードが有効な場合に TXT で MagicDNS ヒントを公開します（レガシー: `OPENCLAW_TAILNET_DNS`）。
- `OPENCLAW_CLI_PATH` は、広告される CLI パスを上書きします（レガシー: `OPENCLAW_CLI_PATH`）。

## 関連ドキュメント

- 検出ポリシーとトランスポート選択: [検出](/ja-JP/gateway/discovery)
- Node のペアリング + 承認: [Gateway ペアリング](/ja-JP/gateway/pairing)

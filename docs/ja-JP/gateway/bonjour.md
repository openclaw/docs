---
read_when:
    - macOS/iOS での Bonjour 検出問題のデバッグ
    - mDNS サービスタイプ、TXT レコード、または検出 UX の変更
summary: Bonjour/mDNS 検出 + デバッグ（Gateway ビーコン、クライアント、および一般的な障害モード）
title: Bonjour 検出
x-i18n:
    generated_at: "2026-04-30T05:11:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0720451843aae0509949324e51f3a23dc69e366e68de851c595ce76c8ab0eec9
    source_path: gateway/bonjour.md
    workflow: 16
---

# Bonjour / mDNS 検出

OpenClaw は Bonjour (mDNS / DNS‑SD) を使用して、アクティブな Gateway (WebSocket エンドポイント) を検出します。
マルチキャストの `local.` ブラウズは **LAN 専用の利便機能** です。同梱の `bonjour`
Plugin が LAN アドバタイズを担当し、デフォルトで有効になっています。ネットワークをまたぐ検出では、
同じビーコンを、設定済みの広域 DNS-SD ドメイン経由でも公開できます。
検出は引き続きベストエフォートであり、SSH や Tailnet ベースの接続を置き換えるものでは**ありません**。

## Tailscale 上の広域 Bonjour (ユニキャスト DNS-SD)

ノードと Gateway が異なるネットワーク上にある場合、マルチキャスト mDNS は境界を越えません。
Tailscale 上で **ユニキャスト DNS‑SD** (「Wide‑Area Bonjour」) に切り替えることで、
同じ検出 UX を維持できます。

大まかな手順:

1. Gateway ホスト上で DNS サーバーを実行します (Tailnet 経由で到達可能)。
2. 専用ゾーン配下で `_openclaw-gw._tcp` の DNS‑SD レコードを公開します
   (例: `openclaw.internal.`)。
3. Tailscale の **split DNS** を設定し、選択したドメインがクライアント (iOS を含む) で
   その DNS サーバー経由で解決されるようにします。

OpenClaw は任意の検出ドメインをサポートします。`openclaw.internal.` は単なる例です。
iOS/Android ノードは `local.` と設定済みの広域ドメインの両方をブラウズします。

### Gateway 設定 (推奨)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### DNS サーバーの初回セットアップ (Gateway ホスト)

```bash
openclaw dns setup --apply
```

これにより CoreDNS がインストールされ、次のように設定されます。

- Gateway の Tailscale インターフェイス上でのみポート 53 をリッスンする
- 選択したドメイン (例: `openclaw.internal.`) を `~/.openclaw/dns/<domain>.db` から提供する

tailnet 接続済みのマシンから検証します。

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS 設定

Tailscale 管理コンソールで次を行います。

- Gateway の tailnet IP (UDP/TCP 53) を指すネームサーバーを追加します。
- 検出ドメインがそのネームサーバーを使用するように split DNS を追加します。

クライアントが tailnet DNS を受け入れると、iOS ノードと CLI 検出は
マルチキャストなしで検出ドメイン内の `_openclaw-gw._tcp` をブラウズできます。

### Gateway リスナーのセキュリティ (推奨)

Gateway WS ポート (デフォルト `18789`) はデフォルトでループバックにバインドされます。LAN/tailnet
アクセスでは、明示的にバインドし、認証を有効のままにしてください。

tailnet 専用セットアップの場合:

- `~/.openclaw/openclaw.json` で `gateway.bind: "tailnet"` を設定します。
- Gateway を再起動します (または macOS メニューバーアプリを再起動します)。

## アドバタイズされるもの

Gateway のみが `_openclaw-gw._tcp` をアドバタイズします。LAN マルチキャストアドバタイズは
同梱の `bonjour` Plugin によって提供されます。広域 DNS-SD 公開は引き続き
Gateway が所有します。

## サービスタイプ

- `_openclaw-gw._tcp` — Gateway トランスポートビーコン (macOS/iOS/Android ノードで使用)。

## TXT キー (非シークレットのヒント)

Gateway は UI フローを便利にするため、小さな非シークレットのヒントをアドバタイズします。

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
- `cliPath=<path>` (mDNS フルモードのみ。広域 DNS-SD でもリモートインストールのヒントとして書き込まれます)

セキュリティ上の注意:

- Bonjour/mDNS TXT レコードは**認証されていません**。クライアントは TXT を権威あるルーティング情報として扱ってはいけません。
- クライアントは解決済みサービスエンドポイント (SRV + A/AAAA) を使用してルーティングするべきです。`lanHost`、`tailnetDns`、`gatewayPort`、`gatewayTlsSha256` はヒントとしてのみ扱ってください。
- SSH の自動ターゲット指定も同様に、TXT のみのヒントではなく、解決済みサービスホストを使用するべきです。
- TLS ピンニングでは、アドバタイズされた `gatewayTlsSha256` が以前に保存されたピンを上書きできるようにしてはいけません。
- iOS/Android ノードは、検出ベースの直接接続を **TLS のみ** として扱い、初回フィンガープリントを信頼する前に明示的なユーザー確認を要求するべきです。

## macOS でのデバッグ

便利な組み込みツール:

- インスタンスをブラウズする:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- 1 つのインスタンスを解決する (`<instance>` を置き換えます):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

ブラウズは成功するが解決が失敗する場合、通常は LAN ポリシーまたは
mDNS リゾルバーの問題に遭遇しています。

## Gateway ログでのデバッグ

Gateway はローリングログファイルに書き込みます (起動時に
`gateway log file: ...` として表示されます)。特に次のような `bonjour:` 行を探してください。

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour は、システムホスト名が有効な DNS ラベルである場合、アドバタイズされる `.local` ホストに
そのシステムホスト名を使用します。システムホスト名にスペース、アンダースコア、またはその他の
無効な DNS ラベル文字が含まれる場合、OpenClaw は `openclaw.local` にフォールバックします。
明示的なホストラベルが必要な場合は、Gateway を起動する前に
`OPENCLAW_MDNS_HOSTNAME=<name>` を設定してください。

## iOS ノードでのデバッグ

iOS ノードは `NWBrowser` を使用して `_openclaw-gw._tcp` を検出します。

ログを取得するには:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → 再現 → **Copy**

ログにはブラウザー状態遷移と結果セットの変更が含まれます。

## Bonjour を無効にするタイミング

LAN マルチキャストアドバタイズが利用できない、または有害な場合にのみ Bonjour を無効にしてください。
一般的なケースは、Docker ブリッジネットワーク、WSL、または mDNS マルチキャストをドロップする
ネットワークポリシーの背後で Gateway が実行されている場合です。これらの環境でも Gateway は
公開 URL、SSH、Tailnet、または広域 DNS-SD 経由で到達可能ですが、
LAN 自動検出は信頼できません。

問題がデプロイ範囲に限定される場合は、既存の環境オーバーライドを優先してください。

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

これは Plugin 設定を変更せずに LAN マルチキャストアドバタイズを無効にします。
この設定は環境が消えると消えるため、Docker イメージ、サービスファイル、起動スクリプト、一回限りの
デバッグに安全です。

その OpenClaw 設定で、同梱の LAN 検出 Plugin を意図的にオフにしたい場合にのみ
Plugin 設定を使用してください。

```bash
openclaw plugins disable bonjour
```

## Docker の注意点

同梱の Bonjour Plugin は、`OPENCLAW_DISABLE_BONJOUR` が未設定の場合、検出された
コンテナ内で LAN マルチキャストアドバタイズを自動的に無効にします。Docker ブリッジネットワークは
通常、コンテナと LAN の間で mDNS マルチキャスト (`224.0.0.251:5353`) を転送しないため、
コンテナからアドバタイズしても検出が機能することはほとんどありません。

重要な注意点:

- Bonjour を無効にしても Gateway は停止しません。LAN マルチキャストアドバタイズだけを停止します。
- Bonjour を無効にしても `gateway.bind` は変更されません。Docker は引き続き
  `OPENCLAW_GATEWAY_BIND=lan` をデフォルトにするため、公開ホストポートは機能できます。
- Bonjour を無効にしても広域 DNS-SD は無効になりません。Gateway とノードが同じ LAN 上にない場合は、
  広域検出または Tailnet を使用してください。
- Docker 外で同じ `OPENCLAW_CONFIG_DIR` を再利用しても、コンテナの自動無効化ポリシーは永続化されません。
- `OPENCLAW_DISABLE_BONJOUR=0` は、ホストネットワーク、macvlan、または mDNS マルチキャストが通過することが
  既知の別のネットワークでのみ設定してください。強制的に無効化するには `1` を設定します。

## 無効化された Bonjour のトラブルシューティング

Docker セットアップ後にノードが Gateway を自動検出しなくなった場合:

1. Gateway が自動、強制オン、または強制オフのどのモードで実行されているか確認します。

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
     広域 DNS-SD

4. `OPENCLAW_DISABLE_BONJOUR=0` で Docker 内の Bonjour を意図的に有効にした場合は、
   ホストからマルチキャストをテストします。

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   ブラウズ結果が空、または Gateway ログに ciao watchdog のキャンセルが繰り返し表示される場合は、
   `OPENCLAW_DISABLE_BONJOUR=1` に戻し、直接ルートまたは Tailnet ルートを使用してください。

## 一般的な失敗モード

- **Bonjour はネットワークを越えません**: Tailnet または SSH を使用してください。
- **マルチキャストがブロックされている**: 一部の Wi‑Fi ネットワークは mDNS を無効にします。
- **アドバタイザーが probing/announcing で停止する**: マルチキャストがブロックされたホスト、
  コンテナブリッジ、WSL、またはインターフェイスの変動により、ciao アドバタイザーが
  non-announced 状態のままになることがあります。OpenClaw は数回再試行した後、アドバタイザーを
  永久に再起動するのではなく、現在の Gateway プロセスで Bonjour を無効にします。
- **Docker ブリッジネットワーク**: Bonjour は検出されたコンテナ内で自動的に無効になります。
  `OPENCLAW_DISABLE_BONJOUR=0` は、ホスト、macvlan、またはその他の
  mDNS 対応ネットワークでのみ設定してください。
- **スリープ / インターフェイスの変動**: macOS は一時的に mDNS 結果を落とすことがあります。再試行してください。
- **ブラウズは成功するが解決が失敗する**: マシン名はシンプルに保ち (絵文字や
  句読点を避ける)、その後 Gateway を再起動してください。サービスインスタンス名は
  ホスト名から派生するため、過度に複雑な名前は一部のリゾルバーを混乱させる可能性があります。

## エスケープされたインスタンス名 (`\032`)

Bonjour/DNS‑SD は、サービスインスタンス名内のバイトを 10 進数の `\DDD`
シーケンスとしてエスケープすることがよくあります (例: スペースは `\032` になります)。

- これはプロトコルレベルでは正常です。
- UI は表示用にデコードするべきです (iOS は `BonjourEscapes.decode` を使用します)。

## 無効化 / 設定

- `openclaw plugins disable bonjour` は、同梱 Plugin を無効化することで LAN マルチキャストアドバタイズを無効にします。
- `openclaw plugins enable bonjour` は、デフォルトの LAN 検出 Plugin を復元します。
- `OPENCLAW_DISABLE_BONJOUR=1` は、Plugin 設定を変更せずに LAN マルチキャストアドバタイズを無効にします。受け入れられる truthy 値は `1`、`true`、`yes`、`on` です (レガシー: `OPENCLAW_DISABLE_BONJOUR`)。
- `OPENCLAW_DISABLE_BONJOUR=0` は、検出されたコンテナ内を含めて LAN マルチキャストアドバタイズを強制的に有効にします。受け入れられる falsy 値は `0`、`false`、`no`、`off` です。
- `OPENCLAW_DISABLE_BONJOUR` が未設定の場合、Bonjour は通常のホストでアドバタイズし、検出されたコンテナ内では自動的に無効になります。
- `~/.openclaw/openclaw.json` の `gateway.bind` は Gateway のバインドモードを制御します。
- `OPENCLAW_SSH_PORT` は、`sshPort` がアドバタイズされるときの SSH ポートを上書きします (レガシー: `OPENCLAW_SSH_PORT`)。
- `OPENCLAW_TAILNET_DNS` は、mDNS フルモードが有効な場合に TXT で MagicDNS ヒントを公開します (レガシー: `OPENCLAW_TAILNET_DNS`)。
- `OPENCLAW_CLI_PATH` は、アドバタイズされる CLI パスを上書きします (レガシー: `OPENCLAW_CLI_PATH`)。

## 関連ドキュメント

- 検出ポリシーとトランスポート選択: [検出](/ja-JP/gateway/discovery)
- ノードのペアリング + 承認: [Gateway ペアリング](/ja-JP/gateway/pairing)

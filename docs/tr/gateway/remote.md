---
read_when:
    - Uzak Gateway kurulumlarını çalıştırma veya sorun giderme
summary: Gateway WS ve tailnet'ler kullanarak SSH tünelleri üzerinden uzak erişim
title: Uzak erişim
x-i18n:
    generated_at: "2026-04-24T09:11:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66eebbe3762134f29f982201d7e79a789624b96042bd931e07d9855710d64bfe
    source_path: gateway/remote.md
    workflow: 15
---

# Uzak erişim (SSH, tüneller ve tailnet'ler)

Bu repo, özel bir host üzerinde (masaüstü/sunucu) çalışan tek bir Gateway'i (ana Gateway) koruyup istemcileri ona bağlayarak “SSH üzerinden uzak” kullanımı destekler.

- **Operatörler (siz / macOS uygulaması)** için: SSH tünelleme evrensel fallback'tir.
- **Node'lar (iOS/Android ve gelecekteki cihazlar)** için: gerektiğinde (LAN/tailnet veya SSH tüneli) **Gateway WebSocket**'e bağlanın.

## Temel fikir

- Gateway WebSocket, yapılandırılmış portunuzda **local loopback**'e bağlanır (varsayılan 18789).
- Uzak kullanım için bu local loopback portunu SSH üzerinden iletirsiniz (veya bir tailnet/VPN kullanıp daha az tünel açarsınız).

## Yaygın VPN/tailnet kurulumları (agent'in yaşadığı yer)

**Gateway host**'unu “agent'in yaşadığı yer” olarak düşünün. Oturumların, auth profillerinin, kanalların ve durumun sahibidir.
Dizüstü/masaüstü bilgisayarınız (ve Node'lar) bu host'a bağlanır.

### 1) Tailnet'inizde her zaman açık Gateway (VPS veya ev sunucusu)

Gateway'i kalıcı bir host üzerinde çalıştırın ve ona **Tailscale** veya SSH üzerinden erişin.

- **En iyi UX:** `gateway.bind: "loopback"` ayarını koruyun ve Control UI için **Tailscale Serve** kullanın.
- **Fallback:** local loopback'i koruyun + erişmesi gereken herhangi bir makineden SSH tüneli açın.
- **Örnekler:** [exe.dev](/tr/install/exe-dev) (kolay VM) veya [Hetzner](/tr/install/hetzner) (üretim VPS).

Bu, dizüstü bilgisayarınız sık uyku moduna girse bile agent'in her zaman açık kalmasını istediğinizde idealdir.

### 2) Ev masaüstü bilgisayarı Gateway'i çalıştırır, dizüstü bilgisayar uzaktan denetler

Dizüstü bilgisayar agent'i çalıştırmaz. Uzak bağlantı kurar:

- macOS uygulamasının **Remote over SSH** modunu kullanın (Settings → General → “OpenClaw runs”).
- Uygulama tüneli açar ve yönetir; böylece WebChat + sağlık denetimleri “olması gerektiği gibi” çalışır.

Runbook: [macOS remote access](/tr/platforms/mac/remote).

### 3) Dizüstü bilgisayar Gateway'i çalıştırır, diğer makinelerden uzak erişim

Gateway'i yerelde tutun ama güvenli şekilde açığa çıkarın:

- Diğer makinelerden dizüstü bilgisayara SSH tüneli açın, veya
- Tailscale Serve ile Control UI'yi sunun ve Gateway'i yalnızca local loopback'te tutun.

Kılavuz: [Tailscale](/tr/gateway/tailscale) ve [Web overview](/tr/web).

## Komut akışı (ne nerede çalışır)

Tek bir Gateway servisi durum + kanalların sahibidir. Node'lar çevre birimleridir.

Akış örneği (Telegram → Node):

- Telegram mesajı **Gateway**'e gelir.
- Gateway **agent**'i çalıştırır ve bir Node aracı çağırıp çağırmamaya karar verir.
- Gateway, **Node**'u Gateway WebSocket üzerinden çağırır (`node.*` RPC).
- Node sonucu döndürür; Gateway Telegram'a geri yanıt verir.

Notlar:

- **Node'lar Gateway servisini çalıştırmaz.** Bilerek yalıtılmış profiller çalıştırmadığınız sürece host başına yalnızca bir Gateway çalışmalıdır (bkz. [Multiple gateways](/tr/gateway/multiple-gateways)).
- macOS uygulamasındaki “Node mode”, Gateway WebSocket üzerinden bir Node istemcisinden ibarettir.

## SSH tüneli (CLI + araçlar)

Uzak Gateway WS'ye yerel bir tünel oluşturun:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Tünel açıkken:

- `openclaw health` ve `openclaw status --deep`, artık uzak Gateway'e `ws://127.0.0.1:18789` üzerinden ulaşır.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` ve `openclaw gateway call` da gerektiğinde iletilen URL'yi `--url` ile hedefleyebilir.

Not: `18789` yerine yapılandırılmış `gateway.port` değerini (veya `--port`/`OPENCLAW_GATEWAY_PORT`) kullanın.
Not: `--url` geçtiğinizde CLI, yapılandırma veya ortam kimlik bilgilerine fallback yapmaz.
`--token` veya `--password` alanını açıkça ekleyin. Açık kimlik bilgisi olmaması hatadır.

## CLI uzak varsayılanları

CLI komutlarının varsayılan olarak kullanması için uzak bir hedefi kalıcı hale getirebilirsiniz:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

Gateway yalnızca local loopback'te ise URL'yi `ws://127.0.0.1:18789` olarak bırakın ve önce SSH tünelini açın.

## Kimlik bilgisi önceliği

Gateway kimlik bilgisi çözümlemesi, call/probe/status yolları ve Discord exec-approval izleme genelinde tek bir paylaşılan sözleşmeyi izler. Node-host aynı temel sözleşmeyi bir yerel mod istisnasıyla kullanır (`gateway.remote.*` alanlarını bilerek yok sayar):

- Açık kimlik bilgileri (`--token`, `--password` veya araç `gatewayToken`) açık auth kabul eden call yollarında her zaman önceliklidir.
- URL geçersiz kılma güvenliği:
  - CLI URL geçersiz kılmaları (`--url`) örtük yapılandırma/ortam kimlik bilgilerini asla yeniden kullanmaz.
  - Ortam URL geçersiz kılmaları (`OPENCLAW_GATEWAY_URL`) yalnızca env kimlik bilgilerini kullanabilir (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Yerel mod varsayılanları:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (uzak fallback yalnızca yerel auth token girdisi ayarlanmamışsa uygulanır)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (uzak fallback yalnızca yerel auth password girdisi ayarlanmamışsa uygulanır)
- Uzak mod varsayılanları:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-host yerel mod istisnası: `gateway.remote.token` / `gateway.remote.password` yok sayılır.
- Uzak probe/status token denetimleri varsayılan olarak katıdır: uzak modu hedeflerken yalnızca `gateway.remote.token` kullanırlar (yerel token fallback'i yoktur).
- Gateway env geçersiz kılmaları yalnızca `OPENCLAW_GATEWAY_*` kullanır.

## SSH üzerinden sohbet arayüzü

WebChat artık ayrı bir HTTP portu kullanmaz. SwiftUI sohbet arayüzü doğrudan Gateway WebSocket'e bağlanır.

- `18789` portunu SSH üzerinden iletin (yukarıya bakın), sonra istemcileri `ws://127.0.0.1:18789` adresine bağlayın.
- macOS'ta tüneli otomatik yöneten uygulamanın “Remote over SSH” modunu tercih edin.

## macOS uygulaması "Remote over SSH"

macOS menü çubuğu uygulaması aynı kurulumu uçtan uca yönetebilir (uzak durum denetimleri, WebChat ve Voice Wake iletimi).

Runbook: [macOS remote access](/tr/platforms/mac/remote).

## Güvenlik kuralları (uzak/VPN)

Kısa sürüm: gerçekten bind etmeniz gerektiğinden emin değilseniz **Gateway'i yalnızca local loopback'te tutun**.

- **Local loopback + SSH/Tailscale Serve**, en güvenli varsayılandır (genel açığa çıkış yok).
- Düz metin `ws://`, varsayılan olarak yalnızca local loopback içindir. Güvenilir özel ağlar için,
  istemci sürecinde acil durum seçeneği olarak
  `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ayarlayın. Bunun `openclaw.json` eşdeğeri yoktur; bu,
  WebSocket bağlantısını yapan istemcinin süreç ortamında bulunmalıdır.
- **Local loopback olmayan bind'ler** (`lan`/`tailnet`/`custom` veya local loopback kullanılamadığında `auto`), Gateway auth kullanmalıdır: token, password veya `gateway.auth.mode: "trusted-proxy"` olan kimlik farkındalıklı reverse proxy.
- `gateway.remote.token` / `.password`, istemci kimlik bilgisi kaynaklarıdır. Tek başlarına sunucu auth'unu yapılandırmazlar.
- Yerel call yolları, yalnızca `gateway.auth.*` ayarlanmamışsa `gateway.remote.*` alanlarını fallback olarak kullanabilir.
- `gateway.auth.token` / `gateway.auth.password`, SecretRef üzerinden açıkça yapılandırılmış ve çözümlenmemişse çözümleme kapalı başarısız olur (uzak fallback maskeleyemez).
- `gateway.remote.tlsFingerprint`, `wss://` kullanılırken uzak TLS sertifikasını sabitler.
- **Tailscale Serve**, `gateway.auth.allowTailscale: true` olduğunda kimlik başlıkları üzerinden Control UI/WebSocket trafiğini kimlik doğrulayabilir; HTTP API uç noktaları bu Tailscale başlık auth'unu kullanmaz ve bunun yerine Gateway'in normal HTTP auth modunu izler. Bu token'sız akış, Gateway host'unun güvenilir olduğunu varsayar. Her yerde paylaşılan gizli anahtar auth'u istiyorsanız bunu `false` yapın.
- **Trusted-proxy** auth, yalnızca local loopback olmayan kimlik farkındalıklı proxy kurulumları içindir.
  Aynı host üzerindeki local loopback reverse proxy'ler `gateway.auth.mode: "trusted-proxy"` koşulunu karşılamaz.
- Tarayıcı denetimini operatör erişimi gibi ele alın: yalnızca tailnet + bilinçli Node eşleştirmesi.

Ayrıntılı inceleme: [Security](/tr/gateway/security).

### macOS: LaunchAgent ile kalıcı SSH tüneli

Uzak bir Gateway'e bağlanan macOS istemcileri için en kolay kalıcı kurulum, SSH `LocalForward` yapılandırma girdisi ile yeniden başlatmalarda ve çöküşlerde tüneli canlı tutan bir LaunchAgent kullanır.

#### Adım 1: SSH yapılandırması ekleyin

`~/.ssh/config` dosyasını düzenleyin:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

`<REMOTE_IP>` ve `<REMOTE_USER>` alanlarını kendi değerlerinizle değiştirin.

#### Adım 2: SSH anahtarını kopyalayın (bir kereye mahsus)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Adım 3: Gateway token'ını yapılandırın

Yeniden başlatmalardan sonra da kalıcı olması için token'ı yapılandırmada saklayın:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Adım 4: LaunchAgent oluşturun

Bunu `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist` olarak kaydedin:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### Adım 5: LaunchAgent'i yükleyin

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Tünel girişte otomatik başlar, çökmede yeniden başlar ve iletilen portu canlı tutar.

Not: daha eski bir kurulumdan kalma `com.openclaw.ssh-tunnel` LaunchAgent'iniz varsa bunu unload edin ve silin.

#### Sorun giderme

Tünelin çalışıp çalışmadığını kontrol edin:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Tüneli yeniden başlatın:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Tüneli durdurun:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Yapılandırma girdisi                 | Ne yapar                                                     |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Yerel 18789 portunu uzak 18789 portuna iletir                |
| `ssh -N`                             | Uzak komut çalıştırmadan SSH (yalnızca port iletimi)         |
| `KeepAlive`                          | Tünel çökerse otomatik yeniden başlatır                      |
| `RunAtLoad`                          | LaunchAgent girişte yüklendiğinde tüneli başlatır            |

## İlgili

- [Tailscale](/tr/gateway/tailscale)
- [Authentication](/tr/gateway/authentication)
- [Remote gateway setup](/tr/gateway/remote-gateway-readme)

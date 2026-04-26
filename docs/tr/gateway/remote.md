---
read_when:
    - Uzak Gateway kurulumlarını çalıştırma veya sorun giderme
summary: SSH tünelleri (Gateway WS) ve tailnet'ler kullanarak uzak erişim
title: Uzak erişim
x-i18n:
    generated_at: "2026-04-26T11:30:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 208f0e6a4dbb342df878ea99d70606327efdfd3df36b07dfa3e68aafcae98e5c
    source_path: gateway/remote.md
    workflow: 15
---

Bu repo, tek bir Gateway'i (ana) ayrılmış bir host'ta (masaüstü/sunucu) çalıştırıp istemcileri ona bağlayarak “SSH üzerinden uzak” desteği sunar.

- **Operatörler (siz / macOS uygulaması)** için: SSH tünelleme evrensel geri dönüş yoludur.
- **Node'lar (iOS/Android ve gelecekteki cihazlar)** için: gerektiğinde Gateway **WebSocket**'e bağlanın (LAN/tailnet veya SSH tüneli).

## Temel fikir

- Gateway WebSocket, yapılandırılmış portunuzda **loopback**'e bağlanır (varsayılan 18789).
- Uzak kullanım için bu loopback portunu SSH üzerinden iletirsiniz (veya bir tailnet/VPN kullanıp daha az tünel açarsınız).

## Yaygın VPN/tailnet kurulumları (ajanın yaşadığı yer)

**Gateway host**'unu “ajanın yaşadığı yer” olarak düşünün. Oturumların, auth profillerinin, kanalların ve durumun sahibidir.
Dizüstünüz/masaüstünüz (ve Node'lar) bu host'a bağlanır.

### 1) Tailnet'inizde her zaman açık Gateway (VPS veya ev sunucusu)

Gateway'i kalıcı bir host'ta çalıştırın ve ona **Tailscale** veya SSH üzerinden ulaşın.

- **En iyi UX:** `gateway.bind: "loopback"` olarak bırakın ve Control UI için **Tailscale Serve** kullanın.
- **Geri dönüş:** loopback olarak bırakın + erişim gereken her makineden SSH tüneli açın.
- **Örnekler:** [exe.dev](/tr/install/exe-dev) (kolay VM) veya [Hetzner](/tr/install/hetzner) (üretim VPS).

Bu, dizüstünüz sık sık uykuya geçiyorsa ama ajanın her zaman açık kalmasını istiyorsanız idealdir.

### 2) Gateway ev masaüstünde çalışır, dizüstü uzaktan denetimdir

Dizüstü ajanı **çalıştırmaz**. Uzak bağlanır:

- macOS uygulamasının **Remote over SSH** modunu kullanın (Settings → General → “OpenClaw runs”).
- Uygulama tüneli açar ve yönetir; böylece WebChat + sağlık denetimleri “sorunsuz” çalışır.

Çalıştırma kılavuzu: [macOS uzak erişim](/tr/platforms/mac/remote).

### 3) Gateway dizüstünde çalışır, diğer makinelerden uzak erişim

Gateway'i yerelde tutun ama güvenli biçimde açığa çıkarın:

- diğer makinelerden dizüstüne SSH tüneli açın veya
- Control UI'yi Tailscale Serve ile sunun ve Gateway'i yalnızca loopback olarak tutun.

Kılavuz: [Tailscale](/tr/gateway/tailscale) ve [Web genel bakış](/tr/web).

## Komut akışı (ne nerede çalışır)

Tek bir Gateway servisi durum + kanalların sahibidir. Node'lar çevre birimleridir.

Akış örneği (Telegram → Node):

- Telegram mesajı **Gateway**'e gelir.
- Gateway **ajanı** çalıştırır ve bir Node aracı çağırıp çağırmayacağına karar verir.
- Gateway, **Node**'u Gateway WebSocket üzerinden çağırır (`node.*` RPC).
- Node sonucu döndürür; Gateway Telegram'a geri yanıt verir.

Notlar:

- **Node'lar gateway servisini çalıştırmaz.** Bilerek yalıtılmış profiller çalıştırmıyorsanız host başına yalnızca bir gateway çalışmalıdır (bkz. [Birden çok Gateway](/tr/gateway/multiple-gateways)).
- macOS uygulaması “node mode”, yalnızca Gateway WebSocket üzerinden bir Node istemcisidir.

## SSH tüneli (CLI + araçlar)

Uzak Gateway WS'ye yerel bir tünel oluşturun:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Tünel açıkken:

- `openclaw health` ve `openclaw status --deep` artık `ws://127.0.0.1:18789` üzerinden uzak Gateway'e ulaşır.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` ve `openclaw gateway call` da gerektiğinde iletilen URL'yi `--url` ile hedefleyebilir.

Not: `18789` yerine yapılandırdığınız `gateway.port` değerini (veya `--port`/`OPENCLAW_GATEWAY_PORT`) kullanın.
Not: `--url` geçirdiğinizde CLI, yapılandırma veya ortam kimlik bilgilerine geri dönmez.
`--token` veya `--password` değerini açıkça ekleyin. Açık kimlik bilgileri eksikse bu bir hatadır.

## CLI uzak varsayılanları

CLI komutlarının varsayılan olarak kullanması için bir uzak hedefi kalıcı yapabilirsiniz:

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

Gateway yalnızca loopback ise URL'yi `ws://127.0.0.1:18789` olarak bırakın ve önce SSH tünelini açın.
macOS uygulamasının SSH tüneli taşımasında keşfedilen gateway host adları
`gateway.remote.sshTarget` içinde bulunmalıdır; `gateway.remote.url` yerel tünel URL'si olarak kalır.

## Kimlik bilgisi önceliği

Gateway kimlik bilgisi çözümleme; çağrı/probe/durum yolları ve Discord exec-onay izleme genelinde tek bir paylaşılan sözleşmeyi izler. Node-host aynı temel sözleşmeyi tek bir yerel mod istisnasıyla kullanır (`gateway.remote.*` değerlerini bilerek yok sayar):

- Açık kimlik bilgileri (`--token`, `--password` veya araç `gatewayToken`) açık kimlik doğrulamayı kabul eden çağrı yollarında her zaman kazanır.
- URL geçersiz kılma güvenliği:
  - CLI URL geçersiz kılmaları (`--url`) örtük yapılandırma/env kimlik bilgilerini asla yeniden kullanmaz.
  - Env URL geçersiz kılmaları (`OPENCLAW_GATEWAY_URL`) yalnızca env kimlik bilgilerini kullanabilir (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Yerel mod varsayılanları:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (uzak geri dönüş yalnızca yerel auth token girdisi ayarlanmamışsa uygulanır)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (uzak geri dönüş yalnızca yerel auth password girdisi ayarlanmamışsa uygulanır)
- Uzak mod varsayılanları:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-host yerel mod istisnası: `gateway.remote.token` / `gateway.remote.password` yok sayılır.
- Uzak probe/durum token denetimleri varsayılan olarak katıdır: uzak modu hedeflerken yalnızca `gateway.remote.token` kullanırlar (yerel token geri dönüşü yoktur).
- Gateway env geçersiz kılmaları yalnızca `OPENCLAW_GATEWAY_*` kullanır.

## SSH üzerinden sohbet UI

WebChat artık ayrı bir HTTP portu kullanmaz. SwiftUI sohbet UI doğrudan Gateway WebSocket'e bağlanır.

- `18789` portunu SSH üzerinden iletin (yukarıya bakın), sonra istemcileri `ws://127.0.0.1:18789` adresine bağlayın.
- macOS'ta, tüneli otomatik yöneten uygulamanın “Remote over SSH” modunu tercih edin.

## macOS uygulaması "Remote over SSH"

macOS menü çubuğu uygulaması aynı kurulumu uçtan uca yönetebilir (uzak durum denetimleri, WebChat ve Voice Wake iletimi).

Çalıştırma kılavuzu: [macOS uzak erişim](/tr/platforms/mac/remote).

## Güvenlik kuralları (uzak/VPN)

Kısa sürüm: gerçekten bağlama gerektiğinden emin olmadıkça **Gateway'i yalnızca loopback** olarak tutun.

- **Loopback + SSH/Tailscale Serve** en güvenli varsayılandır (kamusal açığa çıkma yok).
- Düz metin `ws://` varsayılan olarak yalnızca loopback içindir. Güvenilen özel ağlar için istemci sürecinde son çare olarak `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ayarlayın. Bunun `openclaw.json` eşdeğeri yoktur; bu, WebSocket bağlantısını yapan istemci için süreç ortamı olmalıdır.
- **Loopback dışı bağlamalar** (`lan`/`tailnet`/`custom` veya loopback kullanılamadığında `auto`) gateway auth kullanmalıdır: token, password veya `gateway.auth.mode: "trusted-proxy"` ile kimlik farkında bir ters proxy.
- `gateway.remote.token` / `.password`, istemci kimlik bilgisi kaynaklarıdır. Sunucu auth'u tek başına yapılandırmazlar.
- Yerel çağrı yolları, yalnızca `gateway.auth.*` ayarlanmamışsa geri dönüş olarak `gateway.remote.*` kullanabilir.
- `gateway.auth.token` / `gateway.auth.password`, SecretRef üzerinden açıkça yapılandırılmış ama çözümlenmemişse çözümleme kapalı güvenlik modeliyle başarısız olur (uzak geri dönüş bunu maskeleyemez).
- `gateway.remote.tlsFingerprint`, `wss://` kullanırken uzak TLS sertifikasını sabitler.
- **Tailscale Serve**, `gateway.auth.allowTailscale: true` olduğunda Control UI/WebSocket trafiğini kimlik başlıklarıyla doğrulayabilir; HTTP API uç noktaları bu Tailscale başlık doğrulamasını kullanmaz ve bunun yerine gateway'in normal HTTP auth modunu izler. Bu tokensız akış, gateway host'una güvenildiğini varsayar. Her yerde paylaşılan gizli auth istiyorsanız bunu `false` yapın.
- **Trusted-proxy** auth, yalnızca loopback dışı kimlik farkında proxy kurulumları içindir.
  Aynı host loopback ters proxy'leri `gateway.auth.mode: "trusted-proxy"` koşulunu karşılamaz.
- Browser denetimini operatör erişimi gibi ele alın: yalnızca tailnet + bilinçli Node eşleştirmesi.

Derinlemesine: [Güvenlik](/tr/gateway/security).

### macOS: LaunchAgent ile kalıcı SSH tüneli

Uzak bir gateway'e bağlanan macOS istemcileri için en kolay kalıcı kurulum, bir SSH `LocalForward` yapılandırma girdisi ile yeniden başlatmalar ve çökmeler boyunca tüneli canlı tutan bir LaunchAgent kullanır.

#### Adım 1: SSH yapılandırması ekleyin

`~/.ssh/config` dosyasını düzenleyin:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

`<REMOTE_IP>` ve `<REMOTE_USER>` değerlerini kendi bilgilerinizle değiştirin.

#### Adım 2: SSH anahtarını kopyalayın (tek seferlik)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Adım 3: gateway token'ını yapılandırın

Yeniden başlatmalarda korunması için token'ı yapılandırmada saklayın:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Adım 4: LaunchAgent'i oluşturun

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

Tünel girişte otomatik başlayacak, çökmede yeniden başlayacak ve iletilen portu canlı tutacaktır.

Not: eski bir kurulumdan kalma `com.openclaw.ssh-tunnel` LaunchAgent'iniz varsa onu kaldırıp silin.

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

| Config entry                         | What it does                                                    |
| ------------------------------------ | --------------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | Yerel 18789 portunu uzak 18789 portuna iletir                  |
| `ssh -N`                             | Uzak komut yürütmeden SSH (yalnızca port iletme)               |
| `KeepAlive`                          | Tünel çökerse otomatik olarak yeniden başlatır                 |
| `RunAtLoad`                          | LaunchAgent girişte yüklendiğinde tüneli başlatır              |

## İlgili

- [Tailscale](/tr/gateway/tailscale)
- [Kimlik doğrulama](/tr/gateway/authentication)
- [Uzak gateway kurulumu](/tr/gateway/remote-gateway-readme)

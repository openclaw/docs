---
read_when:
    - Uzak Gateway kurulumlarını çalıştırma veya bu kurulumlarda sorun giderme
summary: SSH tünelleri (Gateway WS) ve tailnet'ler ile uzaktan erişim
title: Uzaktan erişim
x-i18n:
    generated_at: "2026-04-30T09:24:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 116ffba71801d3363eba293997ee4a5c8ad083a82298e57e68f678510263650a
    source_path: gateway/remote.md
    workflow: 16
---

Bu repo, özel bir ana makinede (masaüstü/sunucu) çalışan tek bir Gateway’i (master) tutup istemcileri ona bağlayarak “SSH üzerinden uzak” çalışmayı destekler.

- **Operatörler (siz / macOS uygulaması)** için: SSH tünelleme evrensel yedektir.
- **Node’lar (iOS/Android ve gelecekteki cihazlar)** için: Gateway **WebSocket**’ine bağlanın (gerektiğinde LAN/tailnet veya SSH tüneli).

## Temel fikir

- Gateway WebSocket, yapılandırılmış portunuzda **loopback**’e bağlanır (varsayılan 18789).
- Uzak kullanım için bu loopback portunu SSH üzerinden iletirsiniz (veya bir tailnet/VPN kullanıp daha az tünel kurarsınız).

## Yaygın VPN ve tailnet kurulumları

**Gateway ana makinesini**, agent’ın yaşadığı yer olarak düşünün. Oturumlar, kimlik doğrulama profilleri, kanallar ve durum ona aittir. Dizüstü bilgisayarınız, masaüstünüz ve Node’lar bu ana makineye bağlanır.

### Tailnet’inizde sürekli açık Gateway

Gateway’i kalıcı bir ana makinede (VPS veya ev sunucusu) çalıştırın ve ona **Tailscale** veya SSH ile erişin.

- **En iyi UX:** `gateway.bind: "loopback"` değerini koruyun ve Control UI için **Tailscale Serve** kullanın.
- **Yedek:** loopback’i koruyun ve erişim gerektiren herhangi bir makineden SSH tüneli açın.
- **Örnekler:** [exe.dev](/tr/install/exe-dev) (kolay VM) veya [Hetzner](/tr/install/hetzner) (üretim VPS).

Dizüstü bilgisayarınız sık sık uykuya geçiyor ama agent’ın sürekli açık kalmasını istiyorsanız idealdir.

### Ev masaüstü Gateway’i çalıştırır

Dizüstü bilgisayar agent’ı **çalıştırmaz**. Uzaktan bağlanır:

- macOS uygulamasının **SSH Üzerinden Uzak** modunu kullanın (Settings → General → OpenClaw runs).
- Uygulama tüneli açar ve yönetir, böylece WebChat ve sağlık kontrolleri doğrudan çalışır.

Runbook: [macOS uzak erişim](/tr/platforms/mac/remote).

### Dizüstü bilgisayar Gateway’i çalıştırır

Gateway’i yerel tutun ama güvenli şekilde dışa açın:

- Diğer makinelerden dizüstü bilgisayara SSH tüneli açın veya
- Control UI’ı Tailscale Serve ile sunun ve Gateway’i yalnızca loopback’te tutun.

Kılavuzlar: [Tailscale](/tr/gateway/tailscale) ve [Web genel bakış](/tr/web).

## Komut akışı (nerede ne çalışır)

Tek bir gateway servisi duruma + kanallara sahip olur. Node’lar çevre birimleridir.

Akış örneği (Telegram → node):

- Telegram mesajı **Gateway**’e gelir.
- Gateway **agent**’ı çalıştırır ve bir node aracını çağırıp çağırmayacağına karar verir.
- Gateway, Gateway WebSocket üzerinden **node**’u çağırır (`node.*` RPC).
- Node sonucu döndürür; Gateway yanıtı Telegram’a geri gönderir.

Notlar:

- **Node’lar gateway servisini çalıştırmaz.** İzole profilleri kasıtlı olarak çalıştırmadığınız sürece ana makine başına yalnızca bir gateway çalışmalıdır (bkz. [Birden çok gateway](/tr/gateway/multiple-gateways)).
- macOS uygulamasındaki “node mode”, Gateway WebSocket üzerinden çalışan yalnızca bir node istemcisidir.

## SSH tüneli (CLI + araçlar)

Uzak Gateway WS’ye yerel bir tünel oluşturun:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Tünel açıkken:

- `openclaw health` ve `openclaw status --deep` artık `ws://127.0.0.1:18789` üzerinden uzak gateway’e ulaşır.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` ve `openclaw gateway call` gerektiğinde `--url` ile iletilen URL’yi hedefleyebilir.

<Note>
`18789` yerine yapılandırılmış `gateway.port` değerinizi (veya `--port` ya da `OPENCLAW_GATEWAY_PORT`) kullanın.
</Note>

<Warning>
`--url` verdiğinizde CLI, yapılandırmaya veya ortam kimlik bilgilerine geri dönmez. `--token` veya `--password` değerini açıkça ekleyin. Açık kimlik bilgilerinin eksik olması hatadır.
</Warning>

## CLI uzak varsayılanları

CLI komutlarının varsayılan olarak kullanması için uzak hedefi kalıcı hale getirebilirsiniz:

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

Gateway yalnızca loopback ise URL’yi `ws://127.0.0.1:18789` olarak tutun ve önce SSH tünelini açın.
macOS uygulamasının SSH tüneli taşımasında, bulunan gateway ana makine adları
`gateway.remote.sshTarget` içine girer; `gateway.remote.url` yerel tünel URL’si olarak kalır.

## Kimlik bilgisi önceliği

Gateway kimlik bilgisi çözümlemesi, call/probe/status yolları ve Discord exec-onay izleme genelinde tek bir paylaşılan sözleşmeyi izler. Node-host aynı temel sözleşmeyi bir yerel mod istisnasıyla kullanır (`gateway.remote.*` değerlerini kasıtlı olarak yok sayar):

- Açık kimlik bilgileri (`--token`, `--password` veya araç `gatewayToken`), açık kimlik doğrulamayı kabul eden call yollarında her zaman kazanır.
- URL geçersiz kılma güvenliği:
  - CLI URL geçersiz kılmaları (`--url`) örtük config/env kimlik bilgilerini asla yeniden kullanmaz.
  - Env URL geçersiz kılmaları (`OPENCLAW_GATEWAY_URL`) yalnızca env kimlik bilgilerini kullanabilir (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Yerel mod varsayılanları:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (uzak yedek yalnızca yerel auth token girdisi ayarlanmamışsa uygulanır)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (uzak yedek yalnızca yerel auth password girdisi ayarlanmamışsa uygulanır)
- Uzak mod varsayılanları:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-host yerel mod istisnası: `gateway.remote.token` / `gateway.remote.password` yok sayılır.
- Uzak probe/status token kontrolleri varsayılan olarak katıdır: uzak modu hedeflerken yalnızca `gateway.remote.token` kullanırlar (yerel token yedeği yoktur).
- Gateway env geçersiz kılmaları yalnızca `OPENCLAW_GATEWAY_*` kullanır.

## SSH üzerinden Chat UI

WebChat artık ayrı bir HTTP portu kullanmaz. SwiftUI chat UI doğrudan Gateway WebSocket’e bağlanır.

- SSH üzerinden `18789` portunu iletin (yukarıya bakın), ardından istemcileri `ws://127.0.0.1:18789` adresine bağlayın.
- macOS’ta, tüneli otomatik yöneten uygulamanın “Remote over SSH” modunu tercih edin.

## macOS uygulamasında SSH Üzerinden Uzak

macOS menü çubuğu uygulaması aynı kurulumu uçtan uca yürütebilir (uzak durum kontrolleri, WebChat ve Voice Wake iletimi).

Runbook: [macOS uzak erişim](/tr/platforms/mac/remote).

## Güvenlik kuralları (uzak/VPN)

Kısa sürüm: Bir bağlama ihtiyacınız olduğundan emin değilseniz **Gateway’i yalnızca loopback’te tutun**.

- **Loopback + SSH/Tailscale Serve** en güvenli varsayılandır (genel erişim yok).
- Düz metin `ws://` varsayılan olarak yalnızca loopback içindir. Güvenilir özel ağlar için,
  istemci sürecinde `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ayarını
  acil durum seçeneği olarak belirleyin. Bunun `openclaw.json` eşdeğeri yoktur; bu,
  WebSocket bağlantısını kuran istemci için süreç ortamı olmalıdır.
- **Loopback dışı bind’lar** (`lan`/`tailnet`/`custom` veya loopback kullanılamadığında `auto`) gateway auth kullanmalıdır: token, password veya `gateway.auth.mode: "trusted-proxy"` ile kimlik farkındalıklı ters proxy.
- `gateway.remote.token` / `.password` istemci kimlik bilgisi kaynaklarıdır. Tek başlarına sunucu auth yapılandırmazlar.
- Yerel call yolları, yalnızca `gateway.auth.*` ayarlanmamışsa yedek olarak `gateway.remote.*` kullanabilir.
- `gateway.auth.token` / `gateway.auth.password` SecretRef üzerinden açıkça yapılandırılmış ve çözümlenememişse çözümleme güvenli şekilde başarısız olur (uzak yedek ile maskeleme yoktur).
- `wss://` kullanılırken `gateway.remote.tlsFingerprint`, uzak TLS sertifikasını sabitler.
- **Tailscale Serve**, `gateway.auth.allowTailscale: true` olduğunda Control UI/WebSocket trafiğini kimlik
  başlıklarıyla doğrulayabilir; HTTP API uç noktaları bu Tailscale başlık auth’unu
  kullanmaz ve bunun yerine gateway’in normal HTTP
  auth modunu izler. Bu tokensız akış, gateway ana makinesinin güvenilir olduğunu varsayar. Her yerde
  paylaşımlı gizli anahtar auth istiyorsanız bunu `false` olarak ayarlayın.
- **Trusted-proxy** auth varsayılan olarak loopback dışı kimlik farkındalıklı proxy kurulumları bekler.
  Aynı ana makinedeki loopback ters proxy’leri açıkça `gateway.auth.trustedProxy.allowLoopback = true` gerektirir.
- Tarayıcı kontrolünü operatör erişimi gibi ele alın: yalnızca tailnet + bilinçli node eşleştirme.

Ayrıntılı inceleme: [Güvenlik](/tr/gateway/security).

### macOS: LaunchAgent ile kalıcı SSH tüneli

Uzak bir gateway’e bağlanan macOS istemcileri için en kolay kalıcı kurulum, yeniden başlatmalar ve çökmeler boyunca tüneli canlı tutmak için bir SSH `LocalForward` config girdisi ile LaunchAgent kullanır.

#### 1. Adım: SSH config ekleyin

`~/.ssh/config` dosyasını düzenleyin:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

`<REMOTE_IP>` ve `<REMOTE_USER>` değerlerini kendi değerlerinizle değiştirin.

#### 2. Adım: SSH anahtarını kopyalayın (tek seferlik)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### 3. Adım: gateway token’ını yapılandırın

Yeniden başlatmalar arasında kalıcı olması için token’ı config içinde saklayın:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### 4. Adım: LaunchAgent oluşturun

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

#### 5. Adım: LaunchAgent’ı yükleyin

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Tünel oturum açıldığında otomatik başlayacak, çökme durumunda yeniden başlayacak ve iletilen portu canlı tutacaktır.

<Note>
Eski bir kurulumdan kalan `com.openclaw.ssh-tunnel` LaunchAgent varsa onu unload edip silin.
</Note>

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

| Config girdisi                       | Ne yapar                                                     |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Yerel port 18789’u uzak port 18789’a iletir                  |
| `ssh -N`                             | Uzak komut çalıştırmadan SSH (yalnızca port iletme)          |
| `KeepAlive`                          | Tünel çökerse otomatik olarak yeniden başlatır               |
| `RunAtLoad`                          | LaunchAgent oturum açılışında yüklendiğinde tüneli başlatır |

## İlgili

- [Tailscale](/tr/gateway/tailscale)
- [Kimlik doğrulama](/tr/gateway/authentication)
- [Uzak gateway kurulumu](/tr/gateway/remote-gateway-readme)

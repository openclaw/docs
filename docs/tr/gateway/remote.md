---
read_when:
    - Uzak gateway kurulumlarını çalıştırma veya sorunlarını giderme
summary: Gateway WS, SSH tünelleri ve tailnet'ler kullanarak uzaktan erişim
title: Uzaktan erişim
x-i18n:
    generated_at: "2026-07-03T23:40:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb6fd38698480f1dff93a6e4819082711e8e4395556a2fd85a8eb772ef6fbe31
    source_path: gateway/remote.md
    workflow: 16
---

Bu repo, ayrılmış bir ana makinede (masaüstü/sunucu) tek bir Gateway'i (master) çalışır durumda tutarak ve istemcileri ona bağlayarak uzaktan Gateway erişimini destekler.

- **Operatörler (siz / macOS uygulaması)** için: Gateway erişilebilirse doğrudan LAN/Tailnet WebSocket en basit seçenektir; SSH tünelleme evrensel yedektir.
- **Düğümler (iOS/Android ve gelecekteki cihazlar)** için: Gateway **WebSocket**'ine bağlanın (gerektiğinde LAN/tailnet veya SSH tüneli).

## Temel fikir

- Gateway WebSocket genellikle yapılandırılmış bağlantı noktanızda **local loopback**'e bağlanır (varsayılan 18789).
- Uzaktan kullanım için bunu Tailscale Serve veya güvenilir bir LAN/Tailnet bağlaması üzerinden açın ya da local loopback bağlantı noktasını SSH üzerinden iletin.

## Yaygın VPN ve tailnet kurulumları

**Gateway ana makinesini**, ajanın yaşadığı yer olarak düşünün. Oturumlara, kimlik doğrulama profillerine, kanallara ve duruma o sahip olur. Dizüstü bilgisayarınız, masaüstünüz ve düğümleriniz bu ana makineye bağlanır.

### Tailnet'inizde her zaman açık Gateway

Gateway'i kalıcı bir ana makinede (VPS veya ev sunucusu) çalıştırın ve ona **Tailscale** veya SSH ile ulaşın.

- **En iyi UX:** `gateway.bind: "loopback"` değerini koruyun ve Control UI için **Tailscale Serve** kullanın.
- **Güvenilir LAN/Tailnet:** Gateway'i özel bir arayüze bağlayın ve `gateway.remote.transport: "direct"` ile doğrudan bağlanın.
- **Yedek:** loopback'i koruyun ve erişim gerektiren herhangi bir makineden SSH tüneli kullanın.
- **Örnekler:** [exe.dev](/tr/install/exe-dev) (kolay VM) veya [Hetzner](/tr/install/hetzner) (üretim VPS'i).

Dizüstü bilgisayarınız sık sık uyku moduna geçiyor ama ajanın her zaman açık kalmasını istiyorsanız idealdir.

### Home desktop Gateway'i çalıştırır

Dizüstü bilgisayar ajanı çalıştırmaz. Uzaktan bağlanır:

- macOS uygulamasının uzak modunu kullanın (Settings → General → OpenClaw runs).
- Gateway LAN/Tailnet üzerinde erişilebilir olduğunda uygulama doğrudan bağlanır veya SSH'yi seçtiğinizde bir SSH tüneli açar ve yönetir.

Runbook: [macOS uzaktan erişim](/tr/platforms/mac/remote).

### Laptop Gateway'i çalıştırır

Gateway'i yerel tutun ama güvenli şekilde açın:

- Diğer makinelerden dizüstü bilgisayara SSH tüneli kurun veya
- Control UI'yi Tailscale Serve ile sunun ve Gateway'i yalnızca loopback'te tutun.

Kılavuzlar: [Tailscale](/tr/gateway/tailscale) ve [Web'e genel bakış](/tr/web).

## Komut akışı (ne nerede çalışır)

Tek bir Gateway hizmeti durum + kanallara sahip olur. Düğümler çevre birimleridir.

Akış örneği (Telegram → düğüm):

- Telegram mesajı **Gateway**'e gelir.
- Gateway **ajanı** çalıştırır ve bir düğüm aracını çağırıp çağırmayacağına karar verir.
- Gateway, Gateway WebSocket üzerinden **düğümü** çağırır (`node.*` RPC).
- Düğüm sonucu döndürür; Gateway yanıtı Telegram'a geri gönderir.

Notlar:

- **Düğümler Gateway hizmetini çalıştırmaz.** Bilerek yalıtılmış profiller çalıştırmıyorsanız ana makine başına yalnızca bir Gateway çalışmalıdır (bkz. [Birden çok Gateway](/tr/gateway/multiple-gateways)).
- macOS uygulaması "düğüm modu", Gateway WebSocket üzerinden çalışan bir düğüm istemcisinden ibarettir.

## SSH tüneli (CLI + araçlar)

Uzak Gateway WS'ye yerel bir tünel oluşturun:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Tünel açıkken:

- `openclaw health` ve `openclaw status --deep` artık `ws://127.0.0.1:18789` üzerinden uzak Gateway'e ulaşır.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` ve `openclaw gateway call` gerektiğinde `--url` ile iletilen URL'yi de hedefleyebilir.

<Note>
`18789` değerini yapılandırılmış `gateway.port` değerinizle (veya `--port` ya da `OPENCLAW_GATEWAY_PORT`) değiştirin.
</Note>

<Warning>
`--url` geçirdiğinizde CLI yapılandırmaya veya ortam kimlik bilgilerine geri dönmez. `--token` veya `--password` değerini açıkça ekleyin. Açık kimlik bilgilerinin eksik olması hatadır.
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

Gateway yalnızca loopback olduğunda URL'yi `ws://127.0.0.1:18789` olarak tutun ve önce SSH tünelini açın.
macOS uygulamasının SSH tüneli taşımasında, keşfedilen Gateway ana makine adları
`gateway.remote.sshTarget` içine aittir; `gateway.remote.url` yerel tünel URL'si olarak kalır.
Bu bağlantı noktaları farklıysa, `gateway.remote.remotePort` değerini SSH ana makinesindeki Gateway bağlantı noktasına ayarlayın.
Ana makine anahtarı doğrulaması varsayılan olarak katıdır. Yönetilen takma adlar
`gateway.remote.sshHostKeyPolicy: "openssh"` ile etkin OpenSSH güven ilkesini açıkça kullanabilir; bunu etkinleştirmeden önce eşleşen kullanıcı ve sistem
SSH ayarlarını gözden geçirin.

Güvenilir bir LAN veya Tailnet üzerinde zaten erişilebilir olan Gateway için doğrudan modu kullanın:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      transport: "direct",
      url: "ws://192.168.0.202:18789",
      token: "your-token",
    },
  },
}
```

## Kimlik bilgisi önceliği

Gateway kimlik bilgisi çözümlemesi çağrı/probe/durum yolları ve Discord exec-onayı izleme genelinde tek bir ortak sözleşmeyi izler. Node-host, bir yerel mod istisnasıyla aynı temel sözleşmeyi kullanır (`gateway.remote.*` değerlerini bilerek yok sayar):

- Açık kimlik bilgileri (`--token`, `--password` veya araç `gatewayToken`), açık kimlik doğrulamayı kabul eden çağrı yollarında her zaman kazanır.
- URL geçersiz kılma güvenliği:
  - CLI URL geçersiz kılmaları (`--url`) örtük yapılandırma/ortam kimlik bilgilerini asla yeniden kullanmaz.
  - Ortam URL geçersiz kılmaları (`OPENCLAW_GATEWAY_URL`) yalnızca ortam kimlik bilgilerini kullanabilir (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Yerel mod varsayılanları:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (uzak yedek yalnızca yerel kimlik doğrulama token girdisi ayarlanmamışsa uygulanır)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (uzak yedek yalnızca yerel kimlik doğrulama password girdisi ayarlanmamışsa uygulanır)
- Uzak mod varsayılanları:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-host yerel mod istisnası: `gateway.remote.token` / `gateway.remote.password` yok sayılır.
- Uzak probe/durum token denetimleri varsayılan olarak katıdır: uzak modu hedeflerken yalnızca `gateway.remote.token` kullanırlar (yerel token yedeği yoktur).
- Gateway ortam geçersiz kılmaları yalnızca `OPENCLAW_GATEWAY_*` kullanır.

## Chat UI uzaktan erişim

WebChat artık ayrı bir HTTP bağlantı noktası kullanmaz. SwiftUI sohbet UI'si doğrudan Gateway WebSocket'e bağlanır.

- `18789` değerini SSH üzerinden iletin (yukarıya bakın), ardından istemcileri `ws://127.0.0.1:18789` adresine bağlayın.
- LAN/Tailnet doğrudan modu için istemcileri yapılandırılmış özel `ws://` veya güvenli `wss://` URL'sine bağlayın.
- macOS'te, seçilen taşımayı otomatik olarak yöneten uygulamanın uzak modunu tercih edin.

## macOS uygulaması uzak modu

macOS menü çubuğu uygulaması aynı kurulumu baştan sona yönetebilir (uzak durum denetimleri, WebChat ve Voice Wake iletme).

Runbook: [macOS uzaktan erişim](/tr/platforms/mac/remote).

## Güvenlik kuralları (uzak/VPN)

Kısa sürüm: Gerektiğinden emin değilseniz **Gateway'i yalnızca loopback'te tutun**.

- **Loopback + SSH/Tailscale Serve** en güvenli varsayılandır (genel açılım yok).
- Düz metin `ws://`; loopback, LAN, link-local, `.local`, `.ts.net` ve Tailscale CGNAT ana makineleri için kabul edilir. Genel uzak ana makineler `wss://` kullanmalıdır.
- **Loopback dışı bağlamalar** (`lan`/`tailnet`/`custom` veya loopback kullanılamadığında `auto`) Gateway kimlik doğrulaması kullanmalıdır: token, password veya `gateway.auth.mode: "trusted-proxy"` içeren kimlik farkındalıklı ters proxy.
- `gateway.remote.token` / `.password` istemci kimlik bilgisi kaynaklarıdır. Bunlar sunucu kimlik doğrulamasını tek başlarına yapılandırmaz.
- Yerel çağrı yolları, yalnızca `gateway.auth.*` ayarlanmamışsa `gateway.remote.*` değerlerini yedek olarak kullanabilir.
- `gateway.auth.token` / `gateway.auth.password` SecretRef üzerinden açıkça yapılandırılmış ve çözümlenmemişse, çözümleme kapalı hata verir (uzak yedek maskelemesi yok).
- `gateway.remote.tlsFingerprint`, macOS doğrudan modu dahil `wss://` kullanırken uzak TLS sertifikasını sabitler. Yapılandırılmış veya daha önce saklanmış bir pin olmadan macOS, yalnızca normal sistem güveni geçtikten sonra ilk kullanım sertifikasını pinler; macOS'in zaten güvenmediği kendinden imzalı veya özel CA Gateway'leri açık bir fingerprint ya da SSH üzerinden Remote gerektirir.
- **Tailscale Serve**, `gateway.auth.allowTailscale: true` olduğunda Control UI/WebSocket trafiğinin kimliğini kimlik
  başlıklarıyla doğrulayabilir; HTTP API uç noktaları bu Tailscale başlık kimlik doğrulamasını
  kullanmaz ve bunun yerine Gateway'in normal HTTP kimlik doğrulama modunu izler. Bu tokensız akış Gateway ana makinesinin güvenilir olduğunu varsayar. Her yerde paylaşılan gizli anahtar kimlik doğrulaması istiyorsanız bunu
  `false` olarak ayarlayın.
- **Trusted-proxy** kimlik doğrulaması varsayılan olarak loopback dışı kimlik farkındalıklı proxy kurulumları bekler.
  Aynı ana makinedeki loopback ters proxy'leri açıkça `gateway.auth.trustedProxy.allowLoopback = true` gerektirir.
- Tarayıcı denetimini operatör erişimi gibi ele alın: yalnızca tailnet + bilinçli düğüm eşleştirme.

Derinlemesine inceleme: [Güvenlik](/tr/gateway/security).

### macOS: LaunchAgent ile kalıcı SSH tüneli

Uzak Gateway'e bağlanan macOS istemcileri için en kolay kalıcı kurulum, yeniden başlatmalar ve çökmeler arasında tüneli canlı tutmak üzere bir SSH `LocalForward` yapılandırma girdisi ve bir LaunchAgent kullanır.

#### Adım 1: SSH yapılandırması ekleyin

`~/.ssh/config` dosyasını düzenleyin:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

`<REMOTE_IP>` ve `<REMOTE_USER>` değerlerini kendi değerlerinizle değiştirin.

#### Adım 2: SSH anahtarını kopyalayın (bir kez)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Adım 3: Gateway token'ını yapılandırın

Token'ı yapılandırmada saklayın, böylece yeniden başlatmalar arasında kalıcı olur:

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

#### Adım 5: LaunchAgent'ı yükleyin

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Tünel girişte otomatik olarak başlayacak, çökmede yeniden başlayacak ve iletilen bağlantı noktasını canlı tutacaktır.

<Note>
Eski bir kurulumdan kalma `com.openclaw.ssh-tunnel` LaunchAgent'ınız varsa onu unload edip silin.
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

| Yapılandırma girdisi                 | Ne yapar                                                     |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Yerel bağlantı noktası 18789'u uzak bağlantı noktası 18789'a iletir |
| `ssh -N`                             | Uzak komut yürütmeden SSH (yalnızca bağlantı noktası iletme) |
| `KeepAlive`                          | Çökerse tüneli otomatik olarak yeniden başlatır              |
| `RunAtLoad`                          | LaunchAgent girişte yüklendiğinde tüneli başlatır            |

## İlgili

- [Tailscale](/tr/gateway/tailscale)
- [Kimlik doğrulama](/tr/gateway/authentication)
- [Uzak Gateway kurulumu](/tr/gateway/remote-gateway-readme)

---
read_when:
    - Uzak gateway kurulumlarını çalıştırma veya sorun giderme
summary: Gateway WS, SSH tünelleri ve tailnet’ler kullanarak uzaktan erişim
title: Uzaktan erişim
x-i18n:
    generated_at: "2026-06-28T00:37:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5f885026fe76acb46f49955c6e485e08714a5cc5e90c165d20e25cea1acf864
    source_path: gateway/remote.md
    workflow: 16
---

Bu repo, ayrılmış bir ana makinede (masaüstü/sunucu) tek bir Gateway'i (ana) çalışır durumda tutup istemcileri ona bağlayarak uzak gateway erişimini destekler.

- **operatörler (siz / macOS uygulaması)** için: Gateway erişilebilir olduğunda doğrudan LAN/Tailnet WebSocket en basit seçenektir; SSH tünelleme evrensel yedektir.
- **düğümler (iOS/Android ve gelecekteki cihazlar)** için: Gerektiğinde LAN/tailnet veya SSH tüneli üzerinden Gateway **WebSocket**'ine bağlanın.

## Temel fikir

- Gateway WebSocket genellikle yapılandırdığınız bağlantı noktasında **loopback**'e bağlanır (varsayılan 18789).
- Uzak kullanım için bunu Tailscale Serve veya güvenilen bir LAN/Tailnet bağlaması üzerinden açın ya da loopback bağlantı noktasını SSH üzerinden iletin.

## Yaygın VPN ve tailnet kurulumları

**Gateway ana makinesini**, ajanın yaşadığı yer olarak düşünün. Oturumların, kimlik doğrulama profillerinin, kanalların ve durumun sahibi odur. Dizüstü bilgisayarınız, masaüstünüz ve düğümleriniz bu ana makineye bağlanır.

### Tailnet'inizde sürekli açık Gateway

Gateway'i kalıcı bir ana makinede (VPS veya ev sunucusu) çalıştırın ve ona **Tailscale** veya SSH üzerinden erişin.

- **En iyi kullanıcı deneyimi:** `gateway.bind: "loopback"` değerini koruyun ve Control UI için **Tailscale Serve** kullanın.
- **Güvenilen LAN/Tailnet:** Gateway'i özel bir arayüze bağlayın ve `gateway.remote.transport: "direct"` ile doğrudan bağlanın.
- **Yedek:** loopback'i koruyun ve erişim gereken herhangi bir makineden SSH tüneli kullanın.
- **Örnekler:** [exe.dev](/tr/install/exe-dev) (kolay VM) veya [Hetzner](/tr/install/hetzner) (üretim VPS).

Dizüstü bilgisayarınız sık sık uykuya geçiyor ancak ajanın her zaman açık olmasını istiyorsanız idealdir.

### Gateway ev masaüstünde çalışır

Dizüstü bilgisayar ajanı **çalıştırmaz**. Uzak olarak bağlanır:

- macOS uygulamasının uzak modunu kullanın (Ayarlar → Genel → OpenClaw çalışır).
- Uygulama, Gateway LAN/Tailnet üzerinde erişilebilir olduğunda doğrudan bağlanır veya SSH'yi seçtiğinizde bir SSH tüneli açıp yönetir.

Çalıştırma kılavuzu: [macOS uzak erişim](/tr/platforms/mac/remote).

### Gateway dizüstü bilgisayarda çalışır

Gateway'i yerel tutun ancak güvenli şekilde açın:

- Diğer makinelerden dizüstü bilgisayara SSH tüneli açın veya
- Control UI'yi Tailscale Serve ile sunun ve Gateway'i yalnızca loopback'te tutun.

Kılavuzlar: [Tailscale](/tr/gateway/tailscale) ve [Web genel bakış](/tr/web).

## Komut akışı (nerede ne çalışır)

Tek bir gateway hizmeti durumun + kanalların sahibidir. Düğümler çevresel bileşenlerdir.

Akış örneği (Telegram → düğüm):

- Telegram mesajı **Gateway**'e ulaşır.
- Gateway **ajanı** çalıştırır ve bir düğüm aracını çağırıp çağırmayacağına karar verir.
- Gateway, Gateway WebSocket üzerinden **düğümü** çağırır (`node.*` RPC).
- Düğüm sonucu döndürür; Gateway yanıtı Telegram'a geri gönderir.

Notlar:

- **Düğümler gateway hizmetini çalıştırmaz.** İzole profilleri bilinçli olarak çalıştırmadığınız sürece ana makine başına yalnızca bir gateway çalışmalıdır (bkz. [Birden fazla gateway](/tr/gateway/multiple-gateways)).
- macOS uygulaması "düğüm modu", Gateway WebSocket üzerinden çalışan yalnızca bir düğüm istemcisidir.

## SSH tüneli (CLI + araçlar)

Uzak Gateway WS'ye yerel tünel oluşturun:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Tünel açıkken:

- `openclaw health` ve `openclaw status --deep` artık uzak gateway'e `ws://127.0.0.1:18789` üzerinden ulaşır.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` ve `openclaw gateway call` gerektiğinde iletilmiş URL'yi `--url` ile hedefleyebilir.

<Note>
`18789` değerini yapılandırdığınız `gateway.port` (veya `--port` ya da `OPENCLAW_GATEWAY_PORT`) ile değiştirin.
</Note>

<Warning>
`--url` verdiğinizde CLI yapılandırmaya veya ortam kimlik bilgilerine geri dönmez. `--token` veya `--password` değerini açıkça ekleyin. Açık kimlik bilgilerinin eksik olması hatadır.
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

Gateway yalnızca loopback'teyken URL'yi `ws://127.0.0.1:18789` olarak tutun ve önce SSH tünelini açın.
macOS uygulamasının SSH tüneli taşımasında keşfedilen gateway ana makine adları
`gateway.remote.sshTarget` içine aittir; `gateway.remote.url` yerel tünel URL'si olarak kalır.
Bu bağlantı noktaları farklıysa `gateway.remote.remotePort` değerini SSH ana makinesindeki gateway bağlantı noktasına ayarlayın.

Güvenilen LAN veya Tailnet üzerinde zaten erişilebilir olan bir gateway için doğrudan modu kullanın:

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

Gateway kimlik bilgisi çözümleme, çağrı/probe/durum yolları ve Discord exec-onay izleme genelinde ortak bir sözleşmeyi izler. Node-host aynı temel sözleşmeyi tek bir yerel mod istisnasıyla kullanır (`gateway.remote.*` değerlerini bilinçli olarak yok sayar):

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
- Uzak probe/durum token kontrolleri varsayılan olarak katıdır: uzak modu hedeflerken yalnızca `gateway.remote.token` kullanırlar (yerel token yedeği yoktur).
- Gateway ortam geçersiz kılmaları yalnızca `OPENCLAW_GATEWAY_*` kullanır.

## Chat UI uzak erişimi

WebChat artık ayrı bir HTTP bağlantı noktası kullanmaz. SwiftUI sohbet arayüzü doğrudan Gateway WebSocket'e bağlanır.

- `18789` değerini SSH üzerinden iletin (yukarıya bakın), ardından istemcileri `ws://127.0.0.1:18789` adresine bağlayın.
- LAN/Tailnet doğrudan modu için istemcileri yapılandırılmış özel `ws://` veya güvenli `wss://` URL'sine bağlayın.
- macOS'ta, seçilen taşımayı otomatik olarak yöneten uygulamanın uzak modunu tercih edin.

## macOS uygulaması uzak modu

macOS menü çubuğu uygulaması aynı kurulumu uçtan uca yürütebilir (uzak durum kontrolleri, WebChat ve Voice Wake iletimi).

Çalıştırma kılavuzu: [macOS uzak erişim](/tr/platforms/mac/remote).

## Güvenlik kuralları (uzak/VPN)

Kısa sürüm: Bir bağlamaya ihtiyacınız olduğundan emin değilseniz **Gateway'i yalnızca loopback'te tutun**.

- **Loopback + SSH/Tailscale Serve** en güvenli varsayılandır (genel erişim yok).
- Düz metin `ws://`; loopback, LAN, link-local, `.local`, `.ts.net` ve Tailscale CGNAT ana makineleri için kabul edilir. Genel uzak ana makineler `wss://` kullanmalıdır.
- **Loopback dışı bağlamalar** (`lan`/`tailnet`/`custom` veya loopback kullanılamadığında `auto`) gateway kimlik doğrulaması kullanmalıdır: token, password veya `gateway.auth.mode: "trusted-proxy"` ile kimlik farkındalığı olan bir ters proxy.
- `gateway.remote.token` / `.password` istemci kimlik bilgisi kaynaklarıdır. Tek başlarına sunucu kimlik doğrulamasını yapılandırmazlar.
- Yerel çağrı yolları, yalnızca `gateway.auth.*` ayarlanmamışsa `gateway.remote.*` değerlerini yedek olarak kullanabilir.
- `gateway.auth.token` / `gateway.auth.password` SecretRef üzerinden açıkça yapılandırılmış ve çözümlenmemişse çözümleme kapalı başarısız olur (uzak yedek maskelemesi yok).
- `gateway.remote.tlsFingerprint`, macOS doğrudan modu dahil `wss://` kullanılırken uzak TLS sertifikasını sabitler. Yapılandırılmış veya daha önce saklanmış bir sabit yoksa macOS yalnızca normal sistem güveni geçtikten sonra ilk kullanım sertifikasını sabitler; macOS'un zaten güvenmediği self-signed veya özel CA gateway'leri açık bir fingerprint ya da SSH üzerinden Uzak gerektirir.
- **Tailscale Serve**, `gateway.auth.allowTailscale: true` olduğunda Control UI/WebSocket trafiğini kimlik
  başlıkları üzerinden doğrulayabilir; HTTP API uç noktaları bu Tailscale başlık kimlik doğrulamasını
  kullanmaz ve bunun yerine gateway'in normal HTTP kimlik doğrulama modunu izler. Bu tokensız akış gateway ana makinesinin güvenilir olduğunu varsayar. Her yerde paylaşılan gizli kimlik doğrulaması istiyorsanız bunu
  `false` olarak ayarlayın.
- **Trusted-proxy** kimlik doğrulaması varsayılan olarak loopback dışı kimlik farkındalığı olan proxy kurulumları bekler.
  Aynı ana makinedeki loopback ters proxy'leri açıkça `gateway.auth.trustedProxy.allowLoopback = true` gerektirir.
- Tarayıcı kontrolünü operatör erişimi gibi ele alın: yalnızca tailnet + bilinçli düğüm eşleştirme.

Derin inceleme: [Güvenlik](/tr/gateway/security).

### macOS: LaunchAgent ile kalıcı SSH tüneli

Uzak bir gateway'e bağlanan macOS istemcileri için en kolay kalıcı kurulum, SSH `LocalForward` yapılandırma girdisi ve tüneli yeniden başlatmalar ile çökmeler boyunca canlı tutan bir LaunchAgent kullanır.

#### 1. adım: SSH yapılandırması ekleyin

`~/.ssh/config` dosyasını düzenleyin:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

`<REMOTE_IP>` ve `<REMOTE_USER>` değerlerini kendi değerlerinizle değiştirin.

#### 2. adım: SSH anahtarını kopyalayın (tek seferlik)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### 3. adım: gateway token'ını yapılandırın

Token'ı yapılandırmada saklayın, böylece yeniden başlatmalar arasında kalıcı olur:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### 4. adım: LaunchAgent oluşturun

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

#### 5. adım: LaunchAgent'ı yükleyin

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Tünel oturum açıldığında otomatik olarak başlar, çökme durumunda yeniden başlar ve iletilen bağlantı noktasını canlı tutar.

<Note>
Eski bir kurulumdan kalma `com.openclaw.ssh-tunnel` LaunchAgent'ınız varsa onu kaldırın ve silin.
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

| Yapılandırma girdisi                 | Ne yapar                                                           |
| ------------------------------------ | ------------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Yerel bağlantı noktası 18789'u uzak bağlantı noktası 18789'a iletir |
| `ssh -N`                             | Uzak komut çalıştırmadan SSH (yalnızca bağlantı noktası iletme)     |
| `KeepAlive`                          | Tünel çökerse otomatik olarak yeniden başlatır                     |
| `RunAtLoad`                          | LaunchAgent oturum açılışında yüklendiğinde tüneli başlatır        |

## İlgili

- [Tailscale](/tr/gateway/tailscale)
- [Kimlik doğrulama](/tr/gateway/authentication)
- [Uzak gateway kurulumu](/tr/gateway/remote-gateway-readme)

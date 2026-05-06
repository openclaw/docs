---
read_when:
    - Uzak Gateway kurulumlarını çalıştırma veya sorun giderme
summary: SSH tünelleri (Gateway WS) ve tailnet'ler kullanarak uzaktan erişim
title: Uzaktan erişim
x-i18n:
    generated_at: "2026-05-06T09:14:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6272f4ee9fa52091d461cd70be05ccf01c209c3b26fe98a71752f6ea86ea448
    source_path: gateway/remote.md
    workflow: 16
---

Bu repo, özel bir ana makinede (masaüstü/sunucu) çalışan tek bir Gateway'i (ana) tutup istemcileri ona bağlayarak "SSH üzerinden uzak" kullanımını destekler.

- **Operatörler (siz / macOS uygulaması)** için: SSH tünelleme evrensel yedektir.
- **Node'lar (iOS/Android ve gelecekteki cihazlar)** için: Gateway **WebSocket**'ine bağlanın (gerektiğinde LAN/tailnet veya SSH tüneli).

## Temel fikir

- Gateway WebSocket, yapılandırılmış bağlantı noktanızda (varsayılan 18789) **local loopback**'e bağlanır.
- Uzak kullanım için bu local loopback bağlantı noktasını SSH üzerinden yönlendirirsiniz (veya tailnet/VPN kullanıp daha az tünellersiniz).

## Yaygın VPN ve tailnet kurulumları

**Gateway ana makinesini**, ajanın yaşadığı yer olarak düşünün. Oturumlar, kimlik doğrulama profilleri, kanallar ve durum ona aittir. Dizüstü bilgisayarınız, masaüstünüz ve Node'larınız bu ana makineye bağlanır.

### Tailnet'inizde her zaman açık Gateway

Gateway'i kalıcı bir ana makinede (VPS veya ev sunucusu) çalıştırın ve ona **Tailscale** veya SSH üzerinden erişin.

- **En iyi UX:** `gateway.bind: "loopback"` değerini koruyun ve Control UI için **Tailscale Serve** kullanın.
- **Yedek:** local loopback'i koruyun ve erişim gereken her makineden SSH tüneli kullanın.
- **Örnekler:** [exe.dev](/tr/install/exe-dev) (kolay VM) veya [Hetzner](/tr/install/hetzner) (üretim VPS'i).

Dizüstü bilgisayarınız sık uyku moduna giriyorsa ama ajanın her zaman açık kalmasını istiyorsanız idealdir.

### Gateway'i ev masaüstü çalıştırır

Dizüstü bilgisayar ajanı **çalıştırmaz**. Uzak olarak bağlanır:

- macOS uygulamasının **SSH üzerinden Uzak** modunu kullanın (Ayarlar → Genel → OpenClaw çalışır).
- Uygulama tüneli açar ve yönetir, böylece WebChat ve sağlık kontrolleri doğrudan çalışır.

Runbook: [macOS uzaktan erişim](/tr/platforms/mac/remote).

### Gateway'i dizüstü bilgisayar çalıştırır

Gateway'i yerel tutun ancak güvenli şekilde dışa açın:

- Diğer makinelerden dizüstü bilgisayara SSH tüneli açın veya
- Control UI'yi Tailscale Serve ile sunun ve Gateway'i yalnızca local loopback'te tutun.

Kılavuzlar: [Tailscale](/tr/gateway/tailscale) ve [Web genel bakış](/tr/web).

## Komut akışı (nerede ne çalışır)

Tek bir Gateway servisi durum + kanallara sahip olur. Node'lar çevre birimleridir.

Akış örneği (Telegram → Node):

- Telegram mesajı **Gateway**'e ulaşır.
- Gateway **ajanı** çalıştırır ve bir Node aracının çağrılıp çağrılmayacağına karar verir.
- Gateway, Gateway WebSocket üzerinden **Node**'u çağırır (`node.*` RPC).
- Node sonucu döndürür; Gateway Telegram'a yanıt verir.

Notlar:

- **Node'lar Gateway servisini çalıştırmaz.** Bilerek yalıtılmış profiller çalıştırmıyorsanız ana makine başına yalnızca bir Gateway çalışmalıdır (bkz. [Birden çok Gateway](/tr/gateway/multiple-gateways)).
- macOS uygulamasının "Node modu", Gateway WebSocket üzerinden çalışan bir Node istemcisidir.

## SSH tüneli (CLI + araçlar)

Uzak Gateway WS'ye yerel bir tünel oluşturun:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Tünel açıkken:

- `openclaw health` ve `openclaw status --deep` artık `ws://127.0.0.1:18789` üzerinden uzak Gateway'e ulaşır.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` ve `openclaw gateway call` da gerektiğinde `--url` ile yönlendirilmiş URL'yi hedefleyebilir.

<Note>
`18789` değerini yapılandırılmış `gateway.port` değerinizle (veya `--port` ya da `OPENCLAW_GATEWAY_PORT`) değiştirin.
</Note>

<Warning>
`--url` verdiğinizde CLI yapılandırmaya veya ortam kimlik bilgilerine geri dönmez. `--token` veya `--password` değerini açıkça ekleyin. Açık kimlik bilgilerinin eksik olması hatadır.
</Warning>

## CLI uzak varsayılanları

CLI komutlarının varsayılan olarak kullanması için bir uzak hedefi kalıcı hale getirebilirsiniz:

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

Gateway yalnızca local loopback'teyken URL'yi `ws://127.0.0.1:18789` olarak tutun ve önce SSH tünelini açın.
macOS uygulamasının SSH tünel aktarımında, keşfedilen Gateway ana makine adları
`gateway.remote.sshTarget` içinde yer alır; `gateway.remote.url` yerel tünel URL'si olarak kalır.

## Kimlik bilgisi önceliği

Gateway kimlik bilgisi çözümlemesi, çağrı/probe/durum yolları ve Discord yürütme onayı izleme genelinde ortak bir sözleşmeyi izler. Node-host aynı temel sözleşmeyi tek bir yerel mod istisnasıyla kullanır (`gateway.remote.*` değerlerini bilerek yok sayar):

- Açık kimlik bilgileri (`--token`, `--password` veya araç `gatewayToken`), açık kimlik doğrulamayı kabul eden çağrı yollarında her zaman kazanır.
- URL geçersiz kılma güvenliği:
  - CLI URL geçersiz kılmaları (`--url`) örtük yapılandırma/ortam kimlik bilgilerini asla yeniden kullanmaz.
  - Ortam URL geçersiz kılmaları (`OPENCLAW_GATEWAY_URL`) yalnızca ortam kimlik bilgilerini kullanabilir (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Yerel mod varsayılanları:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (uzak yedek yalnızca yerel kimlik doğrulama token girdisi ayarlanmamışsa uygulanır)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (uzak yedek yalnızca yerel kimlik doğrulama parola girdisi ayarlanmamışsa uygulanır)
- Uzak mod varsayılanları:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-host yerel mod istisnası: `gateway.remote.token` / `gateway.remote.password` yok sayılır.
- Uzak probe/durum token kontrolleri varsayılan olarak katıdır: uzak modu hedeflerken yalnızca `gateway.remote.token` kullanırlar (yerel token yedeği yoktur).
- Gateway ortam geçersiz kılmaları yalnızca `OPENCLAW_GATEWAY_*` kullanır.

## SSH üzerinden Chat UI

WebChat artık ayrı bir HTTP bağlantı noktası kullanmaz. SwiftUI sohbet UI'si doğrudan Gateway WebSocket'e bağlanır.

- `18789` bağlantı noktasını SSH üzerinden yönlendirin (yukarıya bakın), ardından istemcileri `ws://127.0.0.1:18789` adresine bağlayın.
- macOS'te, tüneli otomatik yöneten uygulamanın "SSH üzerinden Uzak" modunu tercih edin.

## macOS uygulaması SSH üzerinden Uzak

macOS menü çubuğu uygulaması aynı kurulumu uçtan uca yürütebilir (uzak durum kontrolleri, WebChat ve Voice Wake yönlendirmesi).

Runbook: [macOS uzaktan erişim](/tr/platforms/mac/remote).

## Güvenlik kuralları (uzak/VPN)

Kısa sürüm: **bir bağlama gerektiğinden emin değilseniz Gateway'i yalnızca local loopback'te tutun**.

- **Local loopback + SSH/Tailscale Serve** en güvenli varsayılandır (genel erişime açık değildir).
- Düz metin `ws://` varsayılan olarak yalnızca local loopback içindir. Güvenilen özel ağlar için,
  WebSocket bağlantısını kuran istemci sürecinde acil durum seçeneği olarak
  `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ayarlayın. Bunun `openclaw.json` eşdeğeri yoktur; bu, WebSocket bağlantısını kuran istemci için süreç
  ortamı olmalıdır.
- **Local loopback dışı bağlamalar** (`lan`/`tailnet`/`custom` veya local loopback kullanılamadığında `auto`) Gateway kimlik doğrulaması kullanmalıdır: token, parola veya `gateway.auth.mode: "trusted-proxy"` ile kimlik farkındalığı olan ters proxy.
- `gateway.remote.token` / `.password` istemci kimlik bilgisi kaynaklarıdır. Tek başlarına sunucu kimlik doğrulamasını yapılandırmazlar.
- Yerel çağrı yolları `gateway.auth.*` ayarlanmamışsa yalnızca yedek olarak `gateway.remote.*` kullanabilir.
- `gateway.auth.token` / `gateway.auth.password` SecretRef üzerinden açıkça yapılandırılmış ve çözümlenmemişse çözümleme güvenli şekilde başarısız olur (uzak yedekleme maskelemesi yoktur).
- `gateway.remote.tlsFingerprint`, `wss://` kullanırken uzak TLS sertifikasını sabitler.
- **Tailscale Serve**, `gateway.auth.allowTailscale: true` olduğunda Control UI/WebSocket trafiğinin kimliğini
  kimlik başlıkları üzerinden doğrulayabilir; HTTP API uç noktaları bu Tailscale başlık kimlik doğrulamasını
  kullanmaz ve bunun yerine Gateway'in normal HTTP kimlik doğrulama modunu izler.
  Bu tokensız akış, Gateway ana makinesinin güvenilir olduğunu varsayar. Her yerde
  paylaşılan gizli anahtar kimlik doğrulaması istiyorsanız bunu `false` olarak ayarlayın.
- **Trusted-proxy** kimlik doğrulaması varsayılan olarak local loopback dışı kimlik farkındalığı olan proxy kurulumları bekler.
  Aynı ana makinedeki local loopback ters proxy'leri için açıkça `gateway.auth.trustedProxy.allowLoopback = true` gerekir.
- Tarayıcı denetimini operatör erişimi gibi ele alın: yalnızca tailnet + bilinçli Node eşleştirme.

Derin inceleme: [Güvenlik](/tr/gateway/security).

### macOS: LaunchAgent üzerinden kalıcı SSH tüneli

Uzak bir Gateway'e bağlanan macOS istemcileri için en kolay kalıcı kurulum, yeniden başlatmalar ve çökmeler boyunca tüneli canlı tutmak için bir SSH `LocalForward` yapılandırma girdisi ile bir LaunchAgent kullanır.

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

#### 3. adım: Gateway token'ını yapılandırın

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

Tünel oturum açıldığında otomatik başlar, çökme durumunda yeniden başlar ve yönlendirilen bağlantı noktasını canlı tutar.

<Note>
Daha eski bir kurulumdan kalan `com.openclaw.ssh-tunnel` LaunchAgent'ınız varsa onu kaldırın ve silin.
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
| `LocalForward 18789 127.0.0.1:18789` | Yerel 18789 bağlantı noktasını uzak 18789 bağlantı noktasına yönlendirir |
| `ssh -N`                             | Uzak komut çalıştırmadan SSH (yalnızca bağlantı noktası yönlendirme) |
| `KeepAlive`                          | Tünel çökerse otomatik olarak yeniden başlatır               |
| `RunAtLoad`                          | LaunchAgent oturum açmada yüklendiğinde tüneli başlatır      |

## İlgili

- [Tailscale](/tr/gateway/tailscale)
- [Kimlik doğrulama](/tr/gateway/authentication)
- [Uzak Gateway kurulumu](/tr/gateway/remote-gateway-readme)

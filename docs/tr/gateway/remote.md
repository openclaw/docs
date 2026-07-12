---
read_when:
    - Uzak Gateway kurulumlarını çalıştırma veya sorunlarını giderme
summary: Gateway WS, SSH tünelleri ve tailnet'ler kullanarak uzaktan erişim
title: Uzaktan erişim
x-i18n:
    generated_at: "2026-07-12T12:19:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78daaad7bcb9f80072eaa2d6946bff9f28ba1ec4f95a68edb0d24cf7f9c3fec2
    source_path: gateway/remote.md
    workflow: 16
---

OpenClaw, bir ana makinede tek bir Gateway (yönetici) çalıştırır ve her istemciyi ona bağlar. Oturumlar, kimlik doğrulama profilleri, kanallar ve durum Gateway tarafından yönetilir; geri kalan her şey istemcidir.

- **Operatörler** (siz veya macOS uygulaması): Gateway erişilebiliyorsa doğrudan LAN/Tailnet WebSocket bağlantısı en basit seçenektir; SSH tünelleme evrensel geri dönüş seçeneğidir.
- **Node'lar** (iOS/Android ve diğer cihazlar): Gateway **WebSocket**'ine bağlanır (LAN/tailnet veya SSH tüneli).

## Temel fikir

Gateway WebSocket, varsayılan olarak `18789` numaralı bağlantı noktasında (`gateway.port`) **geri döngü** adresine bağlanır. Uzaktan kullanım için Tailscale Serve / güvenilir bir LAN-Tailnet bağlaması üzerinden erişime açın veya geri döngü bağlantı noktasını SSH üzerinden iletin.

## Topoloji seçenekleri

| Kurulum                                | Gateway'in çalıştığı yer                                                                                      | En uygun olduğu durum                                                                                                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tailnet'inizde sürekli açık Gateway    | Tailscale veya SSH üzerinden erişilen kalıcı ana makine (VPS veya ev sunucusu)                                | Sık sık uykuya geçen ancak ajanın sürekli açık kalmasına ihtiyaç duyan dizüstü bilgisayarlar. [exe.dev](/tr/install/exe-dev) (kolay VM) veya [Hetzner](/tr/install/hetzner) (üretim VPS'si) sayfalarına bakın. |
| Ev masaüstü bilgisayarı                | Masaüstü bilgisayar; dizüstü bilgisayar macOS uygulamasının uzak modu üzerinden bağlanır (Ayarlar → Bağlantı → OpenClaw çalışır) | Ajanı sürekli açık kalan donanımda tutmak. Çalıştırma kılavuzu: [macOS uzaktan erişim](/tr/platforms/mac/remote).                                                                    |
| Dizüstü bilgisayar                     | SSH tüneli veya Tailscale Serve üzerinden güvenli biçimde erişime açılan dizüstü bilgisayar (`gateway.bind: "loopback"` değerini koruyun) | Tek makineli kurulumlar. [Tailscale](/tr/gateway/tailscale) ve [Web](/tr/web) sayfalarına bakın.                                                                                        |

Sürekli açık ve dizüstü bilgisayar kurulumlarında `gateway.bind: "loopback"` değerini koruyup Control UI için **Tailscale Serve** veya `gateway.remote.transport: "direct"` ile güvenilir bir LAN/Tailnet bağlaması kullanmayı tercih edin. SSH tüneli, herhangi bir makineden çalışan geri dönüş seçeneğidir.

## Komut akışı (ne nerede çalışır)

Durum ve kanallar tek bir Gateway tarafından yönetilir; node'lar çevre birimleridir. Örnek (bir node aracına yönlendirilen Telegram mesajı):

1. Telegram mesajı **Gateway**'e ulaşır.
2. Gateway, bir node aracını çağırıp çağırmayacağına karar veren **ajanı** çalıştırır.
3. Gateway, Gateway WebSocket üzerinden **node'u** çağırır (`node.invoke` RPC).
4. Node sonucu döndürür; Gateway Telegram'a yanıt verir.

Node'lar Gateway hizmetini çalıştırmaz. Bilerek yalıtılmış profiller çalıştırmadığınız sürece ana makine başına yalnızca bir Gateway çalışmalıdır ([Birden fazla Gateway](/tr/gateway/multiple-gateways) sayfasına bakın). macOS uygulamasındaki "node modu", yalnızca Gateway WebSocket üzerinden çalışan bir node istemcisidir.

## SSH tüneli (CLI + araçlar)

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Tünel açıkken `openclaw health` ve `openclaw status --deep`, uzak Gateway'e `ws://127.0.0.1:18789` üzerinden erişir. `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` ve `openclaw gateway call` komutları da `--url` aracılığıyla iletilen bir URL'yi hedefleyebilir.

<Note>
`18789` değerini yapılandırılmış `gateway.port` değerinizle (veya `--port` / `OPENCLAW_GATEWAY_PORT` ile) değiştirin.
</Note>

<Warning>
`--url`, hiçbir zaman yapılandırma veya ortam kimlik bilgilerine geri dönmez. `--token` veya `--password` değerini açıkça iletin; bunlar olmadan istemci hiçbir kimlik bilgisi göndermez ve hedef Gateway kimlik doğrulaması gerektiriyorsa bağlantı başarısız olur.
</Warning>

## CLI uzak bağlantı varsayılanları

CLI komutlarının varsayılan olarak kullanması için bir uzak hedefi kalıcı olarak kaydedin:

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

Gateway yalnızca geri döngüye bağlıysa URL'yi `ws://127.0.0.1:18789` olarak tutun ve önce SSH tünelini açın. macOS uygulamasının SSH tüneli aktarımında, keşfedilen Gateway ana makine adı `gateway.remote.sshTarget` alanına (`user@host` veya `user@host:port`) girilir; `gateway.remote.url` yerel tünel URL'si olarak kalır. Uzak bağlantı noktası yerel bağlantı noktasından farklıysa `gateway.remote.remotePort` değerini ayarlayın.

Ana makine anahtarı doğrulaması varsayılan olarak katıdır (`gateway.remote.sshHostKeyPolicy: "strict"`). Bunun yerine etkin OpenSSH yapılandırmanıza devretmek için değeri `"openssh"` olarak ayarlayın; etkinleştirmeden önce kullanıcı ve sistem SSH ayarlarınızı gözden geçirin.

Güvenilir bir LAN veya Tailnet üzerinden zaten erişilebilen bir Gateway için doğrudan modu kullanın:

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

Gateway kimlik bilgilerinin çözümlenmesi, çağrı/yoklama/durum yolları ve Discord çalıştırma onayı izlemesi genelinde tek bir ortak sözleşmeyi izler. Node ana makinesi de bir yerel mod istisnasıyla aynı sözleşmeyi kullanır (`gateway.remote.*` değerlerini yok sayar).

- Açık kimlik bilgileri (`--token`, `--password` veya bir aracın `gatewayToken` değeri), açık kimlik doğrulamasını kabul eden çağrı yollarında her zaman önceliklidir.
- URL geçersiz kılma güvenliği:
  - CLI `--url`, örtük yapılandırma/ortam kimlik bilgilerini hiçbir zaman yeniden kullanmaz.
  - Ortam değişkeni `OPENCLAW_GATEWAY_URL`, yalnızca ortam kimlik bilgilerini (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) kullanabilir.
- Yerel mod varsayılanları:
  - belirteç: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (uzak değer yalnızca yerel belirteç ayarlanmamışsa geri dönüş olarak kullanılır)
  - parola: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (uzak değer yalnızca yerel parola ayarlanmamışsa geri dönüş olarak kullanılır)
- Uzak mod varsayılanları:
  - belirteç: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - parola: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node ana makinesinin yerel mod istisnası: `gateway.remote.token` / `gateway.remote.password` yok sayılır.
- Uzak yoklama/durum belirteci kontrolleri varsayılan olarak katıdır: uzak mod hedeflenirken yalnızca `gateway.remote.token` kullanılır (yerel belirtece geri dönüş yapılmaz).
- Gateway ortam geçersiz kılmaları yalnızca `OPENCLAW_GATEWAY_*` kullanır.

## Sohbet kullanıcı arayüzüne uzaktan erişim

WebChat'in ayrı bir HTTP bağlantı noktası yoktur; SwiftUI sohbet kullanıcı arayüzü doğrudan Gateway WebSocket'e bağlanır.

- `18789` bağlantı noktasını SSH üzerinden iletin (yukarıya bakın), ardından istemcileri `ws://127.0.0.1:18789` adresine bağlayın.
- LAN/Tailnet doğrudan modu için istemcileri yapılandırılmış özel `ws://` veya güvenli `wss://` URL'sine bağlayın.
- macOS'te uygulamanın uzak modu, seçilen aktarımı otomatik olarak yönetir.

## macOS uygulamasının uzak modu

macOS menü çubuğu uygulaması aynı kurulumu uçtan uca yönetir: uzak durum kontrolleri, WebChat ve Voice Wake iletimi. Çalıştırma kılavuzu: [macOS uzaktan erişim](/tr/platforms/mac/remote).

## Güvenlik kuralları (uzak/VPN)

Bir bağlamaya ihtiyacınız olduğundan emin değilseniz Gateway'i **yalnızca geri döngüye bağlı** tutun.

- **Geri döngü + SSH/Tailscale Serve** en güvenli varsayılandır (genel erişime açılmaz).
- Şifrelenmemiş `ws://`; geri döngü, özel/LAN (RFC 1918), bağlantı yerel, CGNAT, `.local` ve `.ts.net` ana makineleri için kabul edilir. Genel uzak ana makineler `wss://` kullanmalıdır.
- **Geri döngü dışı bağlamalar** (`lan`/`tailnet`/`custom` veya geri döngü kullanılamadığında `auto`) Gateway kimlik doğrulaması kullanmalıdır: belirteç, parola veya `gateway.auth.mode: "trusted-proxy"` kullanan kimlik duyarlı bir ters proxy.
- `gateway.remote.token` / `.password` istemci kimlik bilgisi kaynaklarıdır; sunucu kimlik doğrulamasını kendi başlarına yapılandırmazlar.
- Yerel çağrı yolları, yalnızca `gateway.auth.*` ayarlanmamışsa `gateway.remote.*` değerini geri dönüş olarak kullanabilir.
- `gateway.auth.token` / `gateway.auth.password`, SecretRef aracılığıyla açıkça yapılandırılmış ancak çözümlenememişse çözümleme kapalı biçimde başarısız olur (uzak geri dönüş hatayı gizlemez).
- `gateway.remote.tlsFingerprint`, macOS doğrudan modu da dahil olmak üzere `wss://` için uzak TLS sertifikasını sabitler. Kayıtlı bir sabitleme olmadan macOS, yalnızca normal sistem güven denetimi geçtikten sonraki ilk kullanımda sabitleme yapar; kendinden imzalı veya özel CA kullanan Gateway'ler açık bir parmak izi ya da SSH üzerinden uzak bağlantı gerektirir.
- **Tailscale Serve**, `gateway.auth.allowTailscale: true` olduğunda Control UI/WebSocket trafiğinin kimliğini kimlik başlıkları aracılığıyla doğrulayabilir. HTTP API uç noktaları bu başlık kimlik doğrulamasını kullanmaz ve bunun yerine Gateway'in normal HTTP kimlik doğrulama modunu izler. Belirteçsiz bu akış, Gateway ana makinesinin güvenilir olduğunu varsayar; her yerde paylaşılan gizli anahtar kimlik doğrulaması kullanmak için bunu `false` olarak ayarlayın.
- **Güvenilir proxy** kimlik doğrulaması varsayılan olarak geri döngü dışındaki kimlik duyarlı bir proxy bekler. Aynı ana makinedeki geri döngü ters proxy'leri için `gateway.auth.trustedProxy.allowLoopback = true` açıkça ayarlanmalıdır.
- Tarayıcı denetimini operatör erişimi gibi değerlendirin: yalnızca tailnet erişimi ve bilinçli node eşleştirmesi.

Ayrıntılı bilgi: [Güvenlik](/tr/gateway/security).

### macOS: LaunchAgent aracılığıyla kalıcı SSH tüneli

macOS istemcileri için en kolay kalıcı kurulum, bir SSH `LocalForward` yapılandırma girdisiyle birlikte yeniden başlatmalar ve çökmeler boyunca tüneli açık tutan bir LaunchAgent kullanır.

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

#### 3. adım: Gateway belirtecini yapılandırın

```bash
openclaw config set gateway.remote.token "<your-token>"
```

Uzak Gateway parola ile kimlik doğrulaması kullanıyorsa bunun yerine `gateway.remote.password` kullanın. `OPENCLAW_GATEWAY_TOKEN`, kabuk düzeyinde geçersiz kılma olarak hâlâ geçerlidir ancak kalıcı uzak istemci kurulumu `gateway.remote.token` / `gateway.remote.password` kullanır.

#### 4. adım: LaunchAgent'ı oluşturun

`~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist` olarak kaydedin:

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

Tünel oturum açıldığında otomatik olarak başlar, çökerse yeniden başlatılır ve iletilen bağlantı noktasını etkin tutar.

<Note>
Eski bir kurulumdan kalma `com.openclaw.ssh-tunnel` LaunchAgent'ınız varsa yüklemesini kaldırın ve silin.
</Note>

#### Sorun giderme

```bash
# Check if the tunnel is running
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789

# Restart the tunnel
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel

# Stop the tunnel
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Yapılandırma girdisi                  | İşlevi                                                               |
| ------------------------------------- | -------------------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789`  | Yerel 18789 bağlantı noktasını uzak 18789 bağlantı noktasına iletir |
| `ssh -N`                              | Uzak komutları çalıştırmadan SSH kullanır (yalnızca bağlantı noktası iletimi) |
| `KeepAlive`                           | Tünel çökerse otomatik olarak yeniden başlatır                       |
| `RunAtLoad`                           | LaunchAgent oturum açılışında yüklendiğinde tüneli başlatır          |

## İlgili konular

- [Tailscale](/tr/gateway/tailscale)
- [Kimlik doğrulama](/tr/gateway/authentication)
- [Uzak Gateway kurulumu](/tr/gateway/remote-gateway-readme)

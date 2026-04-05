---
read_when:
    - Uzak gateway kurulumlarını çalıştırıyor veya sorun gideriyorsunuz
summary: SSH tünelleri (Gateway WS) ve tailnet'ler kullanarak uzak erişim
title: Remote Access
x-i18n:
    generated_at: "2026-04-05T13:54:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8596fa2a7fd44117dfe92b70c9d8f28c0e16d7987adf0d0769a9eff71d5bc081
    source_path: gateway/remote.md
    workflow: 15
---

# Remote access (SSH, tüneller ve tailnet'ler)

Bu depo, tek bir Gateway'in (ana) özel bir host'ta (masaüstü/sunucu) çalışmaya devam etmesi ve istemcilerin ona bağlanmasıyla “SSH üzerinden uzak” kullanımı destekler.

- **Operatörler için (siz / macOS uygulaması)**: SSH tünelleme evrensel geri dönüş seçeneğidir.
- **Düğümler için (iOS/Android ve gelecekteki cihazlar)**: gerektiğinde **Gateway WebSocket**'e bağlanın (LAN/tailnet veya SSH tüneli üzerinden).

## Temel fikir

- Gateway WebSocket, yapılandırdığınız portta **loopback** üzerine bağlanır (varsayılan olarak 18789).
- Uzak kullanım için bu loopback portunu SSH üzerinden iletirsiniz (veya bir tailnet/VPN kullanıp daha az tünel kullanırsınız).

## Yaygın VPN/tailnet kurulumları (ajanın bulunduğu yer)

**Gateway host**'u “ajanın yaşadığı yer” olarak düşünün. Oturumlara, kimlik doğrulama profillerine, kanallara ve duruma o sahiptir.
Dizüstü/masaüstü bilgisayarınız (ve düğümler) bu host'a bağlanır.

### 1) Tailnet'inizde her zaman açık bir Gateway (VPS veya ev sunucusu)

Gateway'i kalıcı bir host üzerinde çalıştırın ve ona **Tailscale** veya SSH üzerinden erişin.

- **En iyi UX:** `gateway.bind: "loopback"` olarak bırakın ve Kontrol UI için **Tailscale Serve** kullanın.
- **Geri dönüş:** loopback'i koruyun + erişim gerektiren her makineden SSH tüneli açın.
- **Örnekler:** [exe.dev](/install/exe-dev) (kolay VM) veya [Hetzner](/install/hetzner) (üretim VPS'i).

Bu, dizüstü bilgisayarınız sık sık uyku moduna geçse bile ajanı her zaman açık tutmak istediğiniz durumlar için idealdir.

### 2) Evdeki masaüstü Gateway'i çalıştırır, dizüstü uzaktan kontrol eder

Dizüstü bilgisayar ajanı **çalıştırmaz**. Uzak olarak bağlanır:

- macOS uygulamasının **Remote over SSH** modunu kullanın (Ayarlar → Genel → “OpenClaw runs”).
- Uygulama tüneli açar ve yönetir, böylece WebChat + sağlık denetimleri “sorunsuzca” çalışır.

Çalıştırma kılavuzu: [macOS remote access](/platforms/mac/remote).

### 3) Dizüstü bilgisayar Gateway'i çalıştırır, diğer makinelerden uzaktan erişim sağlanır

Gateway'i yerel tutun ama güvenli şekilde açığa çıkarın:

- Diğer makinelerden dizüstüye SSH tüneli açın veya
- Tailscale Serve ile Kontrol UI'ı açığa çıkarın ve Gateway'i yalnızca loopback üzerinde tutun.

Kılavuz: [Tailscale](/gateway/tailscale) ve [Web overview](/web).

## Komut akışı (ne nerede çalışır)

Tek bir gateway hizmeti durum + kanallara sahiptir. Düğümler çevre birimleridir.

Akış örneği (Telegram → düğüm):

- Telegram mesajı **Gateway**'e gelir.
- Gateway **ajanı** çalıştırır ve bir düğüm aracı çağırıp çağırmayacağına karar verir.
- Gateway, Gateway WebSocket üzerinden **düğümü** çağırır (`node.*` RPC).
- Düğüm sonucu döndürür; Gateway de yanıtı Telegram'a geri yollar.

Notlar:

- **Düğümler gateway hizmetini çalıştırmaz.** Bilerek yalıtılmış profiller çalıştırmadığınız sürece host başına yalnızca bir gateway çalışmalıdır (bkz. [Multiple gateways](/gateway/multiple-gateways)).
- macOS uygulaması “node mode”, Gateway WebSocket üzerinden çalışan bir düğüm istemcisinden ibarettir.

## SSH tüneli (CLI + araçlar)

Uzak Gateway WS'ye yerel bir tünel oluşturun:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Tünel açıkken:

- `openclaw health` ve `openclaw status --deep` artık `ws://127.0.0.1:18789` üzerinden uzak gateway'e ulaşır.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` ve `openclaw gateway call` da gerektiğinde iletilen URL'yi `--url` ile hedefleyebilir.

Not: `18789` yerine yapılandırılmış `gateway.port` değerinizi (veya `--port`/`OPENCLAW_GATEWAY_PORT`) kullanın.
Not: `--url` geçirdiğinizde CLI, yapılandırma veya ortam kimlik bilgilerine geri dönmez.
`--token` veya `--password` değerini açıkça ekleyin. Açık kimlik bilgileri eksikse bu bir hatadır.

## CLI uzak varsayılanları

CLI komutlarının bunu varsayılan olarak kullanması için uzak hedefi kalıcı hale getirebilirsiniz:

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

Gateway yalnızca loopback üzerindeyse URL'yi `ws://127.0.0.1:18789` olarak bırakın ve önce SSH tünelini açın.

## Kimlik bilgisi önceliği

Gateway kimlik bilgisi çözümleme, çağrı/yoklama/durum yolları ve Discord exec-onay izleme boyunca tek bir ortak sözleşmeyi izler. Node-host aynı temel sözleşmeyi, bir yerel mod istisnasıyla kullanır (`gateway.remote.*` değerlerini bilerek yok sayar):

- Açık kimlik bilgileri (`--token`, `--password` veya araç `gatewayToken`) açık kimlik doğrulama kabul eden çağrı yollarında her zaman önceliklidir.
- URL geçersiz kılma güvenliği:
  - CLI URL geçersiz kılmaları (`--url`) hiçbir zaman örtük yapılandırma/ortam kimlik bilgilerini yeniden kullanmaz.
  - Ortam URL geçersiz kılmaları (`OPENCLAW_GATEWAY_URL`) yalnızca ortam kimlik bilgilerini kullanabilir (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Yerel mod varsayılanları:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (uzak geri dönüş yalnızca yerel kimlik doğrulama token girdisi ayarlanmamışsa uygulanır)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (uzak geri dönüş yalnızca yerel kimlik doğrulama parola girdisi ayarlanmamışsa uygulanır)
- Uzak mod varsayılanları:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-host yerel mod istisnası: `gateway.remote.token` / `gateway.remote.password` yok sayılır.
- Uzak probe/status token denetimleri varsayılan olarak katıdır: uzak modu hedeflerken yalnızca `gateway.remote.token` kullanırlar (yerel token geri dönüşü yoktur).
- Gateway ortam geçersiz kılmaları yalnızca `OPENCLAW_GATEWAY_*` kullanır.

## SSH üzerinden Chat UI

WebChat artık ayrı bir HTTP portu kullanmıyor. SwiftUI sohbet UI doğrudan Gateway WebSocket'e bağlanıyor.

- SSH üzerinden `18789` portunu iletin (yukarıya bakın), ardından istemcileri `ws://127.0.0.1:18789` adresine bağlayın.
- macOS'ta, tüneli otomatik yöneten uygulamanın “Remote over SSH” modunu tercih edin.

## macOS uygulamasında "Remote over SSH"

macOS menü çubuğu uygulaması aynı kurulumu uçtan uca yönetebilir (uzak durum denetimleri, WebChat ve Voice Wake yönlendirme).

Çalıştırma kılavuzu: [macOS remote access](/platforms/mac/remote).

## Güvenlik kuralları (uzak/VPN)

Kısa sürüm: gerçekten bağlama yapmanız gerektiğinden emin değilseniz **Gateway'i yalnızca loopback üzerinde tutun**.

- **Loopback + SSH/Tailscale Serve** en güvenli varsayılandır (genel açığa çıkma yok).
- Düz metin `ws://` varsayılan olarak yalnızca loopback içindir. Güvenilen özel ağlar için
  istemci sürecinde `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` değerini camı kır seçeneği olarak ayarlayın.
- **Loopback olmayan bağlamalar** (`lan`/`tailnet`/`custom` veya loopback kullanılamadığında `auto`) gateway kimlik doğrulaması kullanmalıdır: token, parola veya `gateway.auth.mode: "trusted-proxy"` ile kimlik farkında ters proxy.
- `gateway.remote.token` / `.password` istemci kimlik bilgisi kaynaklarıdır. Sunucu kimlik doğrulamasını kendiliklerinden yapılandırmazlar.
- Yerel çağrı yolları, yalnızca `gateway.auth.*` ayarlanmamışsa `gateway.remote.*` değerlerini geri dönüş olarak kullanabilir.
- `gateway.auth.token` / `gateway.auth.password`, SecretRef ile açıkça yapılandırılmış ancak çözümlenmemişse, çözümleme güvenli biçimde kapanır (uzak geri dönüş bunu maskeleyemez).
- `gateway.remote.tlsFingerprint`, `wss://` kullanılırken uzak TLS sertifikasını sabitler.
- **Tailscale Serve**, `gateway.auth.allowTailscale: true` olduğunda Kontrol UI/WebSocket trafiğini kimlik başlıklarıyla doğrulayabilir; HTTP API uç noktaları bu Tailscale başlık kimlik doğrulamasını kullanmaz ve bunun yerine gateway'in normal HTTP kimlik doğrulama modunu izler. Bu tokensiz akış, gateway host'una güvenildiğini varsayar. Her yerde paylaşılan gizli anahtar kimlik doğrulaması istiyorsanız bunu `false` yapın.
- **Trusted-proxy** kimlik doğrulaması yalnızca loopback olmayan, kimlik farkında proxy kurulumları içindir.
  Aynı host üzerindeki loopback ters proxy'ler `gateway.auth.mode: "trusted-proxy"` koşulunu sağlamaz.
- Tarayıcı denetimini operatör erişimi gibi değerlendirin: yalnızca tailnet + bilinçli düğüm eşleştirmesi.

Derinlemesine inceleme: [Security](/gateway/security).

### macOS: LaunchAgent ile kalıcı SSH tüneli

Uzak bir gateway'e bağlanan macOS istemcileri için en kolay kalıcı kurulum, SSH `LocalForward` yapılandırma girdisi ile yeniden başlatmalar ve çökmeler boyunca tüneli ayakta tutan bir LaunchAgent kullanır.

#### 1. adım: SSH yapılandırması ekleyin

`~/.ssh/config` dosyasını düzenleyin:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

`<REMOTE_IP>` ve `<REMOTE_USER>` yerlerine kendi değerlerinizi koyun.

#### 2. adım: SSH anahtarını kopyalayın (bir kez)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### 3. adım: gateway token'ını yapılandırın

Yeniden başlatmalar boyunca kalıcı olması için token'ı yapılandırmada saklayın:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### 4. adım: LaunchAgent'i oluşturun

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

#### 5. adım: LaunchAgent'i yükleyin

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Tünel oturum açıldığında otomatik başlar, çökme durumunda yeniden başlatılır ve iletilen portu etkin tutar.

Not: eski bir kurulumdan kalmış `com.openclaw.ssh-tunnel` LaunchAgent'iniz varsa onu unload edin ve silin.

#### Sorun giderme

Tünelin çalışıp çalışmadığını denetleyin:

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

| Yapılandırma girdisi                  | Yaptığı şey                                                 |
| ------------------------------------- | ----------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | Yerel 18789 portunu uzak 18789 portuna iletir               |
| `ssh -N`                              | Uzak komut çalıştırmadan SSH (yalnızca port yönlendirme) |
| `KeepAlive`                           | Tünel çökerse otomatik olarak yeniden başlatır              |
| `RunAtLoad`                           | LaunchAgent oturum açıldığında yüklendiğinde tüneli başlatır        |

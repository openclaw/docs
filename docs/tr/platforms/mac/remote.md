---
read_when:
    - Uzak Mac denetimini kurma veya hata ayıklama
summary: uzak bir OpenClaw gateway’ini kontrol etmek için macOS uygulama akışı
title: Uzaktan kontrol
x-i18n:
    generated_at: "2026-07-03T23:41:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d1ac5065011ef16085b3349ee7224fe3e806a6de61feaac2dcd5c9ed264227e
    source_path: platforms/mac/remote.md
    workflow: 16
---

Bu akış, macOS uygulamasının başka bir ana bilgisayarda (masaüstü/sunucu) çalışan bir OpenClaw Gateway için tam uzaktan kumanda gibi davranmasını sağlar. Uygulama, güvenilir LAN/Tailnet Gateway URL’lerine doğrudan bağlanabilir veya uzak Gateway yalnızca loopback ise bir SSH tünelini yönetebilir. Sağlık denetimleri, Voice Wake iletimi ve Web Chat, _Ayarlar → Genel_ bölümündeki aynı uzak yapılandırmayı yeniden kullanır.

## Modlar

- **Yerel (bu Mac)**: Her şey dizüstü bilgisayarda çalışır. SSH kullanılmaz.
- **SSH üzerinden uzak (varsayılan)**: OpenClaw komutları uzak ana bilgisayarda yürütülür. Mac uygulaması, seçtiğiniz kimlik/anahtar ve yerel bağlantı noktası yönlendirmesiyle birlikte `-o BatchMode` kullanarak bir SSH bağlantısı açar.
- **Doğrudan uzak (ws/wss)**: SSH tüneli yoktur. Mac uygulaması Gateway URL’sine doğrudan bağlanır (örneğin LAN, Tailscale, Tailscale Serve veya herkese açık bir HTTPS ters proxy üzerinden).

## Uzak aktarımlar

Uzak mod iki aktarımı destekler:

- **SSH tüneli** (varsayılan): Gateway bağlantı noktasını localhost’a yönlendirmek için `ssh -N -L ...` kullanır. Tünel loopback olduğu için Gateway, düğümün IP’sini `127.0.0.1` olarak görür.
- **Doğrudan (ws/wss)**: Doğrudan Gateway URL’sine bağlanır. Gateway gerçek istemci IP’sini görür.

Uygulama, uygulamanın sahip olduğu SSH süreçleri için SSH bağlantı çoklamasını ve kimlik doğrulama sonrası arka plana geçmeyi devre dışı bırakır; böylece seçili takma ad `ControlMaster` veya `ForkAfterAuthentication` etkinleştirse bile tam süreci izleyip yeniden başlatabilir.

Gateway kimlik bilgileri bu tünelden geçtiği için SSH ana bilgisayar anahtarı doğrulaması varsayılan olarak katıdır. Güven davranışını açıkça kullanmak istediğiniz yönetilen bir SSH takma adı için `openclaw-mac configure-remote --ssh-target <alias> --ssh-host-key-policy openssh` ile veya `gateway.remote.sshHostKeyPolicy` değerini `"openssh"` olarak ayarlayarak kabul edin. Bu kabul, etkin OpenSSH ana bilgisayar anahtarı politikasını kullanır; önce takma adı ve eşleşen tüm `Host *` veya sistem yapılandırmalarını gözden geçirin. Uygulamada veya `configure-remote` ile SSH hedefini değiştirmek, açıkça yeniden kabul etmediğiniz sürece politikayı `strict` olarak sıfırlar.

SSH tüneli modunda, keşfedilen LAN/tailnet ana bilgisayar adları
`gateway.remote.sshTarget` olarak kaydedilir. Uygulama `gateway.remote.url` değerini yerel
tünel uç noktasında tutar; örneğin `ws://127.0.0.1:18789`, böylece CLI, Web Chat ve
yerel düğüm ana bilgisayar hizmeti aynı güvenli loopback aktarımını kullanır.
Keşif hem ham Tailnet IP’leri hem de kararlı ana bilgisayar adları döndürdüğünde, uygulama
uzak bağlantıların adres değişikliklerine daha iyi dayanması için Tailscale MagicDNS veya LAN adlarını
tercih eder.
Yerel tünel bağlantı noktası uzak Gateway bağlantı noktasından farklıysa,
`gateway.remote.remotePort` değerini uzak ana bilgisayardaki bağlantı noktasına ayarlayın.

Uzak modda tarayıcı otomasyonu, yerel macOS uygulama düğümüne değil CLI düğüm ana bilgisayarına aittir. Uygulama mümkün olduğunda yüklü düğüm ana bilgisayar hizmetini başlatır; o Mac’ten tarayıcı denetimi gerekiyorsa
`openclaw node install ...` ve `openclaw node start` ile yükleyip/başlatın (veya
ön planda `openclaw node run ...` çalıştırın), ardından tarayıcı yetenekli
düğümü hedefleyin.

## Uzak ana bilgisayardaki önkoşullar

1. Node + pnpm’i yükleyin ve OpenClaw CLI’yi derleyin/yükleyin (`pnpm install && pnpm build && pnpm link --global`).
2. Etkileşimsiz kabuklar için `openclaw` komutunun PATH üzerinde olduğundan emin olun (gerekirse `/usr/local/bin` veya `/opt/homebrew/bin` içine symlink oluşturun).
3. Yalnızca SSH aktarımı için: anahtar kimlik doğrulamasıyla SSH’yi açın. LAN dışından kararlı erişilebilirlik için **Tailscale** IP’lerini öneririz.

## macOS uygulama kurulumu

Karşılama akışı olmadan uygulamayı önceden yapılandırmak için:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Güvenilir bir LAN veya Tailnet üzerinden zaten erişilebilen bir Gateway için SSH’yi tamamen atlayın:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Bu, uzak yapılandırmayı yazar, katılımı tamamlandı olarak işaretler ve uygulama başladığında
seçili aktarımın uygulama tarafından yönetilmesini sağlar.

1. _Ayarlar → Genel_ bölümünü açın.
2. **OpenClaw çalışır** altında **Uzak** seçeneğini seçin ve şunları ayarlayın:
   - **Aktarım**: **SSH tüneli** veya **Doğrudan (ws/wss)**.
   - **SSH hedefi**: `user@host` (isteğe bağlı `:port`).
     - Gateway aynı LAN’daysa ve Bonjour ile duyuruluyorsa, bu alanı otomatik doldurmak için keşfedilen listeden seçin.
   - **Gateway URL’si** (yalnızca Doğrudan): `wss://gateway.example.ts.net` (veya yerel/LAN için `ws://...`).
   - **Kimlik dosyası** (gelişmiş): anahtarınızın yolu.
   - **Proje kökü** (gelişmiş): komutlar için kullanılan uzak checkout yolu.
   - **CLI yolu** (gelişmiş): çalıştırılabilir bir `openclaw` giriş noktası/ikili dosyasına isteğe bağlı yol (duyuruluyorsa otomatik doldurulur).
3. **Uzağı test et** düğmesine basın. Başarı, uzak `openclaw status --json` komutunun doğru çalıştığını gösterir. Hatalar genellikle PATH/CLI sorunları anlamına gelir; çıkış 127, CLI’nin uzakta bulunamadığı anlamına gelir.
4. Sağlık denetimleri ve Web Chat artık otomatik olarak seçili aktarım üzerinden çalışır.

## Web Chat

- **SSH tüneli**: Web Chat, yönlendirilen WebSocket denetim bağlantı noktası (varsayılan 18789) üzerinden Gateway’e bağlanır.
- **Doğrudan (ws/wss)**: Web Chat doğrudan yapılandırılmış Gateway URL’sine bağlanır.
- Artık ayrı bir WebChat HTTP sunucusu yoktur.

## İzinler

- Uzak ana bilgisayar, yerelle aynı TCC onaylarına ihtiyaç duyar (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Bunları bir kez vermek için o makinede katılımı çalıştırın.
- Düğümler, ajanların nelerin kullanılabilir olduğunu bilmesi için izin durumlarını `node.list` / `node.describe` üzerinden duyurur.

## Güvenlik notları

- Uzak ana bilgisayarda loopback bağlamalarını tercih edin ve SSH, Tailscale Serve veya güvenilir bir Tailnet/LAN doğrudan URL’si üzerinden bağlanın.
- SSH tünelleme, varsayılan olarak zaten güvenilen bir ana bilgisayar anahtarı gerektirir. Ana bilgisayar anahtarına önce güvenin ki yapılandırılmış known-hosts dosyasında bulunsun, ya da OpenSSH güven politikasını kabul ettiğiniz yönetilen bir takma ad için açıkça `gateway.remote.sshHostKeyPolicy: "openssh"` seçin.
- Gateway’i loopback olmayan bir arayüze bağlarsanız geçerli Gateway kimlik doğrulaması zorunlu olsun: token, parola veya `gateway.auth.mode: "trusted-proxy"` kullanan kimlik farkında bir ters proxy.
- Bkz. [Güvenlik](/tr/gateway/security) ve [Tailscale](/tr/gateway/tailscale).

## WhatsApp oturum açma akışı (uzak)

- `openclaw channels login --verbose` komutunu **uzak ana bilgisayarda** çalıştırın. QR kodunu telefonunuzdaki WhatsApp ile tarayın.
- Kimlik doğrulama süresi dolarsa oturum açmayı o ana bilgisayarda yeniden çalıştırın. Sağlık denetimi bağlantı sorunlarını gösterir.

## Sorun giderme

- **çıkış 127 / bulunamadı**: `openclaw`, oturum açmayan kabuklar için PATH üzerinde değildir. `/etc/paths` dosyasına, kabuk rc dosyanıza ekleyin veya `/usr/local/bin`/`/opt/homebrew/bin` içine symlink oluşturun.
- **Sağlık yoklaması başarısız oldu**: SSH erişilebilirliğini, PATH’i ve Baileys’in oturum açmış olduğunu denetleyin (`openclaw status --json`).
- **Web Chat takıldı**: Gateway’in uzak ana bilgisayarda çalıştığını ve yönlendirilen bağlantı noktasının Gateway WS bağlantı noktasıyla eşleştiğini doğrulayın; UI sağlıklı bir WS bağlantısı gerektirir.
- **Düğüm IP’si 127.0.0.1 görünüyor**: SSH tüneliyle bu beklenir. Gateway’in gerçek istemci IP’sini görmesini istiyorsanız **Aktarım** seçeneğini **Doğrudan (ws/wss)** olarak değiştirin.
- **Dashboard çalışıyor ancak Mac yetenekleri çevrimdışı**: Bu, uygulamanın operatör/denetim bağlantısının sağlıklı olduğu, ancak eşlik eden düğüm bağlantısının bağlı olmadığı veya komut yüzeyinin eksik olduğu anlamına gelir. Menü çubuğu aygıt bölümünü açın ve Mac’in `paired · disconnected` olup olmadığını denetleyin. `wss://*.ts.net` Tailscale Serve uç noktaları için uygulama, sertifika rotasyonundan sonra eski kalmış TLS leaf pinlerini algılar, macOS yeni sertifikaya güvendiğinde eski pini temizler ve otomatik olarak yeniden dener. Sertifika sistem tarafından güvenilmiyorsa veya ana bilgisayar bir Tailscale Serve adı değilse, `gateway.remote.tlsFingerprint` değerini beklenen sertifika parmak izine ayarlayın, sertifikayı gözden geçirin veya **SSH üzerinden uzak** seçeneğine geçin.
- **Voice Wake**: tetikleme ifadeleri uzak modda otomatik olarak iletilir; ayrı bir iletici gerekmez.

## Bildirim sesleri

Betiklerden bildirim başına sesleri `openclaw` ve `node.invoke` ile seçin, örn.:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Uygulamada artık genel bir “varsayılan ses” anahtarı yoktur; çağıranlar her istek için bir ses (veya hiçbiri) seçer.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [Uzak erişim](/tr/gateway/remote)

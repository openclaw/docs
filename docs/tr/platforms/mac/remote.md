---
read_when:
    - Uzak Mac denetimini kurma veya hata ayıklama
summary: Uzak bir OpenClaw gateway'ini kontrol etmek için macOS uygulama akışı
title: Uzaktan kontrol
x-i18n:
    generated_at: "2026-06-28T00:49:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96ac4af5af9d3250f907818751120984106c3c7bcb1f3349d3f0678b4fefb120
    source_path: platforms/mac/remote.md
    workflow: 16
---

Bu akış, macOS uygulamasının başka bir ana bilgisayarda (masaüstü/sunucu) çalışan bir OpenClaw Gateway için tam bir uzaktan kumanda gibi davranmasını sağlar. Uygulama, güvenilen LAN/Tailnet Gateway URL'lerine doğrudan bağlanabilir veya uzak Gateway yalnızca loopback ise bir SSH tünelini yönetebilir. Sağlık denetimleri, Sesle Uyandırma iletimi ve Web Sohbet, _Ayarlar → Genel_ içindeki aynı uzak yapılandırmayı yeniden kullanır.

## Modlar

- **Yerel (bu Mac)**: Her şey dizüstü bilgisayarda çalışır. SSH yoktur.
- **SSH üzerinden uzak (varsayılan)**: OpenClaw komutları uzak ana bilgisayarda yürütülür. Mac uygulaması, `-o BatchMode` ile seçtiğiniz kimlik/anahtarı ve yerel port yönlendirmeyi kullanarak bir SSH bağlantısı açar.
- **Doğrudan uzak (ws/wss)**: SSH tüneli yoktur. Mac uygulaması Gateway URL'sine doğrudan bağlanır (örneğin LAN, Tailscale, Tailscale Serve veya herkese açık bir HTTPS ters proxy üzerinden).

## Uzak aktarımlar

Uzak mod iki aktarımı destekler:

- **SSH tüneli** (varsayılan): Gateway portunu localhost'a yönlendirmek için `ssh -N -L ...` kullanır. Tünel loopback olduğu için Gateway, Node IP'sini `127.0.0.1` olarak görür.
- **Doğrudan (ws/wss)**: Doğrudan Gateway URL'sine bağlanır. Gateway gerçek istemci IP'sini görür.

SSH tüneli modunda, keşfedilen LAN/tailnet ana bilgisayar adları
`gateway.remote.sshTarget` olarak kaydedilir. Uygulama `gateway.remote.url` değerini yerel
tünel uç noktasında tutar; örneğin `ws://127.0.0.1:18789`, böylece CLI, Web Sohbet ve
yerel Node ana bilgisayar hizmeti aynı güvenli loopback aktarımını kullanır.
Keşif hem ham Tailnet IP'leri hem de kararlı ana bilgisayar adları döndürdüğünde, uygulama
uzak bağlantıların adres değişikliklerinden daha iyi etkilenmemesi için Tailscale MagicDNS veya LAN adlarını
tercih eder.
Yerel tünel portu uzak Gateway portundan farklıysa,
`gateway.remote.remotePort` değerini uzak ana bilgisayardaki porta ayarlayın.

Uzak modda tarayıcı otomasyonu, yerel macOS uygulama Node'u tarafından değil,
CLI Node ana bilgisayarı tarafından sahiplenilir. Uygulama, mümkün olduğunda kurulu Node ana bilgisayar hizmetini
başlatır; o Mac'ten tarayıcı denetimine ihtiyacınız varsa,
`openclaw node install ...` ve `openclaw node start` ile kurup/başlatın (veya
`openclaw node run ...` komutunu ön planda çalıştırın), ardından tarayıcı yetenekli
Node'u hedefleyin.

## Uzak ana bilgisayardaki ön koşullar

1. Node + pnpm kurun ve OpenClaw CLI'ını derleyin/kurun (`pnpm install && pnpm build && pnpm link --global`).
2. Etkileşimsiz kabuklar için `openclaw` komutunun PATH üzerinde olduğundan emin olun (gerekirse `/usr/local/bin` veya `/opt/homebrew/bin` içine symlink oluşturun).
3. Yalnızca SSH aktarımı için: anahtar kimlik doğrulamasıyla SSH'yi açın. LAN dışından kararlı erişilebilirlik için **Tailscale** IP'lerini öneririz.

## macOS uygulama kurulumu

Uygulamayı karşılama akışı olmadan önceden yapılandırmak için:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Güvenilen bir LAN veya Tailnet üzerinde zaten erişilebilir olan bir Gateway için SSH'yi tamamen atlayın:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Bu işlem uzak yapılandırmayı yazar, onboarding'in tamamlandığını işaretler ve uygulama başlatıldığında
seçili aktarımın uygulama tarafından sahiplenilmesini sağlar.

1. _Ayarlar → Genel_ bölümünü açın.
2. **OpenClaw şurada çalışır** altında **Uzak** seçeneğini seçin ve şunları ayarlayın:
   - **Aktarım**: **SSH tüneli** veya **Doğrudan (ws/wss)**.
   - **SSH hedefi**: `user@host` (isteğe bağlı `:port`).
     - Gateway aynı LAN üzerindeyse ve Bonjour ile yayın yapıyorsa, bu alanı otomatik doldurmak için keşfedilen listeden seçin.
   - **Gateway URL'si** (yalnızca Doğrudan): `wss://gateway.example.ts.net` (veya yerel/LAN için `ws://...`).
   - **Kimlik dosyası** (gelişmiş): anahtarınızın yolu.
   - **Proje kökü** (gelişmiş): komutlar için kullanılan uzak checkout yolu.
   - **CLI yolu** (gelişmiş): çalıştırılabilir bir `openclaw` giriş noktası/ikili dosyası için isteğe bağlı yol (yayınlanıyorsa otomatik doldurulur).
3. **Uzağı test et** düğmesine basın. Başarı, uzak `openclaw status --json` komutunun doğru çalıştığını gösterir. Hatalar genellikle PATH/CLI sorunları anlamına gelir; çıkış 127, CLI'ın uzakta bulunamadığı anlamına gelir.
4. Sağlık denetimleri ve Web Sohbet artık seçili aktarım üzerinden otomatik olarak çalışır.

## Web Sohbet

- **SSH tüneli**: Web Sohbet, yönlendirilen WebSocket denetim portu (varsayılan 18789) üzerinden Gateway'e bağlanır.
- **Doğrudan (ws/wss)**: Web Sohbet, yapılandırılmış Gateway URL'sine doğrudan bağlanır.
- Artık ayrı bir WebChat HTTP sunucusu yoktur.

## İzinler

- Uzak ana bilgisayar, yerel ile aynı TCC onaylarına ihtiyaç duyar (Otomasyon, Erişilebilirlik, Ekran Kaydı, Mikrofon, Konuşma Tanıma, Bildirimler). Bunları bir kez vermek için o makinede onboarding'i çalıştırın.
- Node'lar izin durumlarını `node.list` / `node.describe` üzerinden yayınlar, böylece ajanlar nelerin kullanılabilir olduğunu bilir.

## Güvenlik notları

- Uzak ana bilgisayarda loopback bind'larını tercih edin ve SSH, Tailscale Serve veya güvenilen bir Tailnet/LAN doğrudan URL'si üzerinden bağlanın.
- SSH tünelleme katı ana bilgisayar anahtarı denetimi kullanır; ana bilgisayar anahtarına önce güvenin, böylece `~/.ssh/known_hosts` içinde var olur.
- Gateway'i loopback olmayan bir arabirime bind ederseniz, geçerli Gateway kimlik doğrulaması isteyin: token, parola veya `gateway.auth.mode: "trusted-proxy"` ile kimlik farkında bir ters proxy.
- Bkz. [Güvenlik](/tr/gateway/security) ve [Tailscale](/tr/gateway/tailscale).

## WhatsApp oturum açma akışı (uzak)

- `openclaw channels login --verbose` komutunu **uzak ana bilgisayarda** çalıştırın. QR kodunu telefonunuzdaki WhatsApp ile tarayın.
- Kimlik doğrulaması sona ererse oturum açmayı o ana bilgisayarda yeniden çalıştırın. Sağlık denetimi bağlantı sorunlarını gösterir.

## Sorun giderme

- **çıkış 127 / bulunamadı**: `openclaw`, oturum açmayan kabuklar için PATH üzerinde değildir. Bunu `/etc/paths` dosyasına veya kabuk rc dosyanıza ekleyin ya da `/usr/local/bin`/`/opt/homebrew/bin` içine symlink oluşturun.
- **Sağlık yoklaması başarısız oldu**: SSH erişilebilirliğini, PATH'i ve Baileys'in oturum açmış olduğunu denetleyin (`openclaw status --json`).
- **Web Sohbet takıldı**: Gateway'in uzak ana bilgisayarda çalıştığını ve yönlendirilen portun Gateway WS portuyla eşleştiğini doğrulayın; UI sağlıklı bir WS bağlantısı gerektirir.
- **Node IP'si 127.0.0.1 gösteriyor**: SSH tüneliyle beklenen durumdur. Gateway'in gerçek istemci IP'sini görmesini istiyorsanız **Aktarım** değerini **Doğrudan (ws/wss)** olarak değiştirin.
- **Pano çalışıyor ama Mac yetenekleri çevrimdışı**: Bu, uygulamanın operatör/denetim bağlantısının sağlıklı olduğu, ancak yardımcı Node bağlantısının bağlı olmadığı veya komut yüzeyinin eksik olduğu anlamına gelir. Menü çubuğu cihaz bölümünü açın ve Mac'in `paired · disconnected` olup olmadığını denetleyin. `wss://*.ts.net` Tailscale Serve uç noktaları için uygulama, sertifika rotasyonundan sonra eski kalmış miras TLS yaprak pin'lerini algılar, macOS yeni sertifikaya güvendiğinde eski pin'i temizler ve otomatik olarak yeniden dener. Sertifika sistem tarafından güvenilir değilse veya ana bilgisayar bir Tailscale Serve adı değilse, `gateway.remote.tlsFingerprint` değerini beklenen sertifika parmak izine ayarlayın, sertifikayı gözden geçirin veya **SSH üzerinden uzak** seçeneğine geçin.
- **Sesle Uyandırma**: tetikleme ifadeleri uzak modda otomatik olarak iletilir; ayrı bir iletici gerekmez.

## Bildirim sesleri

Bildirim başına sesleri `openclaw` ve `node.invoke` ile betiklerden seçin, ör.:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Uygulamada artık genel bir "varsayılan ses" anahtarı yoktur; çağıranlar her istek için bir ses (veya hiçbiri) seçer.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [Uzak erişim](/tr/gateway/remote)

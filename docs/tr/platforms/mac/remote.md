---
read_when:
    - Uzaktan Mac denetimini kurma veya hata ayıklama
summary: SSH üzerinden uzak bir OpenClaw Gateway'i kontrol etmeye yönelik macOS uygulama akışı
title: Uzaktan kontrol
x-i18n:
    generated_at: "2026-05-06T09:22:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: bd7eb110f4c3e6a52b4b9baeccce4ef9d02c01104c188940c28f245bc161894a
    source_path: platforms/mac/remote.md
    workflow: 16
---

Bu akış, macOS uygulamasının başka bir ana makinede (masaüstü/sunucu) çalışan bir OpenClaw gateway için tam bir uzaktan kumanda gibi davranmasını sağlar. Bu, uygulamanın **SSH üzerinden uzak** (uzaktan çalıştırma) özelliğidir. Tüm özellikler; sağlık kontrolleri, Voice Wake yönlendirme ve Web Chat, _Ayarlar → Genel_ bölümündeki aynı uzak SSH yapılandırmasını yeniden kullanır.

## Modlar

- **Yerel (bu Mac)**: Her şey dizüstü bilgisayarda çalışır. SSH kullanılmaz.
- **SSH üzerinden uzak (varsayılan)**: OpenClaw komutları uzak ana makinede yürütülür. Mac uygulaması, `-o BatchMode` ile seçtiğiniz kimlik/anahtar ve yerel port yönlendirme kullanarak bir SSH bağlantısı açar.
- **Doğrudan uzak (ws/wss)**: SSH tüneli yoktur. Mac uygulaması Gateway URL'sine doğrudan bağlanır (örneğin, Tailscale Serve veya genel bir HTTPS ters proxy üzerinden).

## Uzak aktarımlar

Uzak mod iki aktarımı destekler:

- **SSH tüneli** (varsayılan): Gateway portunu localhost'a yönlendirmek için `ssh -N -L ...` kullanır. Tünel loopback olduğundan Gateway düğümün IP'sini `127.0.0.1` olarak görür.
- **Doğrudan (ws/wss)**: Gateway URL'sine doğrudan bağlanır. Gateway gerçek istemci IP'sini görür.

SSH tüneli modunda, keşfedilen LAN/tailnet ana makine adları
`gateway.remote.sshTarget` olarak kaydedilir. Uygulama `gateway.remote.url`
değerini yerel tünel uç noktasında tutar; örneğin `ws://127.0.0.1:18789`,
böylece CLI, Web Chat ve yerel düğüm ana makine hizmeti aynı güvenli loopback
aktarımını kullanır.

Uzak modda tarayıcı otomasyonu, yerel macOS uygulama düğümü tarafından değil,
CLI düğüm ana makinesi tarafından sahiplenilir. Uygulama mümkün olduğunda
yüklü düğüm ana makine hizmetini başlatır; o Mac'ten tarayıcı denetimine
ihtiyacınız varsa `openclaw node install ...` ve `openclaw node start` ile
kurup başlatın (veya `openclaw node run ...` komutunu ön planda çalıştırın),
ardından tarayıcı destekli o düğümü hedefleyin.

## Uzak ana makinedeki ön koşullar

1. Node + pnpm kurun ve OpenClaw CLI'ı derleyip/kurun (`pnpm install && pnpm build && pnpm link --global`).
2. Etkileşimsiz kabuklar için `openclaw` komutunun PATH üzerinde olduğundan emin olun (gerekirse `/usr/local/bin` veya `/opt/homebrew/bin` içine symlink oluşturun).
3. Anahtar kimlik doğrulamasıyla SSH açın. LAN dışından kararlı erişilebilirlik için **Tailscale** IP'lerini öneririz.

## macOS uygulama kurulumu

1. _Ayarlar → Genel_ bölümünü açın.
2. **OpenClaw çalıştırma konumu** altında **SSH üzerinden uzak** seçeneğini seçin ve şunları ayarlayın:
   - **Aktarım**: **SSH tüneli** veya **Doğrudan (ws/wss)**.
   - **SSH hedefi**: `user@host` (isteğe bağlı `:port`).
     - Gateway aynı LAN üzerindeyse ve Bonjour ile kendini duyuruyorsa, bu alanı otomatik doldurmak için keşfedilen listeden seçin.
   - **Gateway URL'si** (yalnızca Doğrudan): `wss://gateway.example.ts.net` (veya yerel/LAN için `ws://...`).
   - **Kimlik dosyası** (gelişmiş): anahtarınızın yolu.
   - **Proje kökü** (gelişmiş): komutlar için kullanılan uzak checkout yolu.
   - **CLI yolu** (gelişmiş): çalıştırılabilir bir `openclaw` giriş noktası/ikili dosyası için isteğe bağlı yol (duyuruluyorsa otomatik doldurulur).
3. **Uzağı test et** düğmesine basın. Başarı, uzak `openclaw status --json` komutunun doğru çalıştığını gösterir. Hatalar genellikle PATH/CLI sorunları anlamına gelir; çıkış 127, CLI'ın uzakta bulunamadığı anlamına gelir.
4. Sağlık kontrolleri ve Web Chat artık bu SSH tüneli üzerinden otomatik çalışır.

## Web Chat

- **SSH tüneli**: Web Chat, yönlendirilmiş WebSocket denetim portu (varsayılan 18789) üzerinden Gateway'e bağlanır.
- **Doğrudan (ws/wss)**: Web Chat, yapılandırılmış Gateway URL'sine doğrudan bağlanır.
- Artık ayrı bir WebChat HTTP sunucusu yoktur.

## İzinler

- Uzak ana makinenin yerel makineyle aynı TCC onaylarına ihtiyacı vardır (Otomasyon, Erişilebilirlik, Ekran Kaydı, Mikrofon, Konuşma Tanıma, Bildirimler). Bunları bir kez vermek için o makinede onboarding çalıştırın.
- Düğümler, ajanların nelerin kullanılabilir olduğunu bilmesi için izin durumlarını `node.list` / `node.describe` üzerinden duyurur.

## Güvenlik notları

- Uzak ana makinede loopback bağlamalarını tercih edin ve SSH veya Tailscale üzerinden bağlanın.
- SSH tünelleme katı ana makine anahtarı denetimi kullanır; ana makine anahtarına önce güvenin ki `~/.ssh/known_hosts` içinde mevcut olsun.
- Gateway'i loopback olmayan bir arayüze bağlarsanız geçerli Gateway kimlik doğrulaması gerektirin: token, parola veya `gateway.auth.mode: "trusted-proxy"` ile kimlik farkındalıklı bir ters proxy.
- Bkz. [Güvenlik](/tr/gateway/security) ve [Tailscale](/tr/gateway/tailscale).

## WhatsApp oturum açma akışı (uzak)

- `openclaw channels login --verbose` komutunu **uzak ana makinede** çalıştırın. Telefonunuzdaki WhatsApp ile QR'yi tarayın.
- Kimlik doğrulama süresi dolarsa oturumu o ana makinede yeniden açın. Sağlık kontrolü bağlantı sorunlarını gösterecektir.

## Sorun giderme

- **çıkış 127 / bulunamadı**: `openclaw`, oturum açmayan kabuklar için PATH üzerinde değildir. `/etc/paths` dosyasına, kabuk rc dosyanıza ekleyin veya `/usr/local/bin`/`/opt/homebrew/bin` içine symlink oluşturun.
- **Sağlık yoklaması başarısız oldu**: SSH erişilebilirliğini, PATH'i ve Baileys oturumunun açık olduğunu kontrol edin (`openclaw status --json`).
- **Web Chat takıldı**: Gateway'in uzak ana makinede çalıştığını ve yönlendirilen portun Gateway WS portuyla eşleştiğini doğrulayın; UI sağlıklı bir WS bağlantısı gerektirir.
- **Düğüm IP'si 127.0.0.1 görünüyor**: SSH tüneliyle beklenen durumdur. Gateway'in gerçek istemci IP'sini görmesini istiyorsanız **Aktarım** ayarını **Doğrudan (ws/wss)** olarak değiştirin.
- **Dashboard çalışıyor ancak Mac yetenekleri çevrimdışı**: Bu, uygulamanın operatör/denetim bağlantısının sağlıklı olduğu, ancak yardımcı düğüm bağlantısının bağlı olmadığı veya komut yüzeyinin eksik olduğu anlamına gelir. Menü çubuğu cihaz bölümünü açın ve Mac'in `paired · disconnected` olup olmadığını kontrol edin. `wss://*.ts.net` Tailscale Serve uç noktaları için uygulama, sertifika rotasyonundan sonra eski kalmış legacy TLS leaf pinlerini algılar, macOS yeni sertifikaya güvendiğinde eski pini temizler ve otomatik olarak yeniden dener. Sertifika sistem tarafından güvenilir değilse veya ana makine bir Tailscale Serve adı değilse, sertifikayı gözden geçirin veya **SSH üzerinden uzak** seçeneğine geçin.
- **Voice Wake**: tetikleme ifadeleri uzak modda otomatik olarak yönlendirilir; ayrı bir yönlendirici gerekmez.

## Bildirim sesleri

`openclaw` ve `node.invoke` kullanan betiklerden bildirim başına ses seçin, örneğin:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Uygulamada artık genel bir "varsayılan ses" anahtarı yoktur; çağıranlar her istek için bir ses (veya hiçbiri) seçer.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [Uzak erişim](/tr/gateway/remote)

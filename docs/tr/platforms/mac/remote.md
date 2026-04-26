---
read_when:
    - Uzak Mac kontrolünü kurma veya hata ayıklama
summary: SSH üzerinden uzak bir OpenClaw gateway'ini denetlemek için macOS uygulama akışı
title: Uzaktan kontrol
x-i18n:
    generated_at: "2026-04-26T11:35:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4de4980fe378fc9b685cf7732d21a80c640088191308b8ef1d3df9f468cb5be2
    source_path: platforms/mac/remote.md
    workflow: 15
---

# Uzak OpenClaw (macOS ⇄ uzak ana makine)

Bu akış, macOS uygulamasının başka bir ana makinede (masaüstü/sunucu) çalışan bir OpenClaw gateway için tam bir uzaktan kontrol görevi görmesini sağlar. Bu, uygulamanın **SSH üzerinden Uzak** (uzaktan çalıştırma) özelliğidir. Tüm özellikler—sağlık kontrolleri, Voice Wake yönlendirmesi ve Web Chat—aynı uzak SSH yapılandırmasını _Ayarlar → Genel_ üzerinden yeniden kullanır.

## Modlar

- **Yerel (bu Mac)**: Her şey dizüstü bilgisayarda çalışır. SSH kullanılmaz.
- **SSH üzerinden Uzak (varsayılan)**: OpenClaw komutları uzak ana makinede yürütülür. Mac uygulaması `-o BatchMode`, seçtiğiniz kimlik/anahtar ve yerel bir port yönlendirmesi ile bir SSH bağlantısı açar.
- **Uzak doğrudan (ws/wss)**: SSH tüneli yoktur. Mac uygulaması doğrudan gateway URL'sine bağlanır (örneğin Tailscale Serve veya herkese açık bir HTTPS reverse proxy üzerinden).

## Uzak taşıma yöntemleri

Uzak mod iki taşıma yöntemini destekler:

- **SSH tüneli** (varsayılan): Gateway portunu localhost'a yönlendirmek için `ssh -N -L ...` kullanır. Tünel loopback olduğu için gateway, node IP'sini `127.0.0.1` olarak görür.
- **Doğrudan (ws/wss)**: Doğrudan gateway URL'sine bağlanır. Gateway gerçek istemci IP'sini görür.

SSH tüneli modunda, keşfedilen LAN/tailnet ana makine adları
`gateway.remote.sshTarget` olarak kaydedilir. Uygulama `gateway.remote.url`
değerini yerel tünel uç noktasında tutar; örneğin `ws://127.0.0.1:18789`; böylece CLI, Web Chat ve
yerel node-host hizmeti aynı güvenli loopback taşıma yöntemini kullanır.

Uzak modda tarayıcı otomasyonu, yerel macOS uygulaması node'una değil CLI node host'una aittir. Uygulama, mümkün olduğunda kurulu node host hizmetini başlatır; bu Mac'ten tarayıcı kontrolüne ihtiyacınız varsa, `openclaw node install ...` ve `openclaw node start` ile kurup başlatın (veya
ön planda `openclaw node run ...` çalıştırın), ardından tarayıcı özellikli
o node'u hedefleyin.

## Uzak ana makinede ön koşullar

1. Node + pnpm kurun ve OpenClaw CLI'ı derleyip kurun (`pnpm install && pnpm build && pnpm link --global`).
2. `openclaw` komutunun etkileşimli olmayan kabuklarda PATH üzerinde olduğundan emin olun (gerekirse `/usr/local/bin` veya `/opt/homebrew/bin` içine symlink oluşturun).
3. Anahtar kimlik doğrulamasıyla SSH'ı açın. LAN dışından kararlı erişilebilirlik için **Tailscale** IP'lerini öneririz.

## macOS uygulama kurulumu

1. _Ayarlar → Genel_ bölümünü açın.
2. **OpenClaw çalıştırma konumu** altında **SSH üzerinden Uzak** seçeneğini belirleyin ve şunları ayarlayın:
   - **Taşıma yöntemi**: **SSH tüneli** veya **Doğrudan (ws/wss)**.
   - **SSH hedefi**: `user@host` (isteğe bağlı `:port`).
     - Gateway aynı LAN üzerindeyse ve Bonjour yayıyorsa, bu alanı otomatik doldurmak için keşfedilen listeden seçin.
   - **Gateway URL'si** (yalnızca Doğrudan): `wss://gateway.example.ts.net` (veya yerel/LAN için `ws://...`).
   - **Kimlik dosyası** (gelişmiş): anahtarınızın yolu.
   - **Proje kökü** (gelişmiş): komutlar için kullanılan uzak checkout yolu.
   - **CLI yolu** (gelişmiş): çalıştırılabilir bir `openclaw` giriş noktası/ikili dosyası için isteğe bağlı yol (yayımlandığında otomatik doldurulur).
3. **Uzağı test et** düğmesine basın. Başarılı olması, uzak tarafta `openclaw status --json` komutunun doğru çalıştığını gösterir. Hatalar genellikle PATH/CLI sorunları anlamına gelir; 127 çıkış kodu, CLI'ın uzak tarafta bulunamadığını gösterir.
4. Sağlık kontrolleri ve Web Chat artık bu SSH tüneli üzerinden otomatik olarak çalışır.

## Web Chat

- **SSH tüneli**: Web Chat, yönlendirilmiş WebSocket kontrol portu (varsayılan 18789) üzerinden gateway'e bağlanır.
- **Doğrudan (ws/wss)**: Web Chat doğrudan yapılandırılmış gateway URL'sine bağlanır.
- Artık ayrı bir WebChat HTTP sunucusu yoktur.

## İzinler

- Uzak ana makine, yerel kurulumla aynı TCC izinlerine ihtiyaç duyar (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Bunları bir kez vermek için o makinede onboarding çalıştırın.
- Node'lar izin durumlarını `node.list` / `node.describe` üzerinden yayımlar; böylece aracıların nelerin kullanılabilir olduğunu bilmesi sağlanır.

## Güvenlik notları

- Uzak ana makinede loopback bind'leri tercih edin ve SSH veya Tailscale üzerinden bağlanın.
- SSH tünelleme katı host-key denetimi kullanır; önce host anahtarına güvenin ki `~/.ssh/known_hosts` içinde bulunsun.
- Gateway'i loopback dışı bir arayüze bind ederseniz, geçerli Gateway kimlik doğrulaması isteyin: token, parola veya `gateway.auth.mode: "trusted-proxy"` kullanan kimlik farkında bir reverse proxy.
- Bkz. [Güvenlik](/tr/gateway/security) ve [Tailscale](/tr/gateway/tailscale).

## WhatsApp giriş akışı (uzak)

- `openclaw channels login --verbose` komutunu **uzak ana makinede** çalıştırın. QR kodunu telefonunuzdaki WhatsApp ile tarayın.
- Kimlik doğrulama süresi dolarsa o ana makinede giriş işlemini yeniden çalıştırın. Sağlık kontrolü bağlantı sorunlarını gösterecektir.

## Sorun giderme

- **exit 127 / bulunamadı**: `openclaw`, giriş yapılmayan kabuklarda PATH üzerinde değil. Bunu `/etc/paths`, kabuk rc dosyanıza ekleyin veya `/usr/local/bin`/`/opt/homebrew/bin` içine symlink oluşturun.
- **Sağlık yoklaması başarısız oldu**: SSH erişilebilirliğini, PATH'i ve Baileys oturumunun açık olduğunu kontrol edin (`openclaw status --json`).
- **Web Chat takılıyor**: gateway'in uzak ana makinede çalıştığını ve yönlendirilen portun gateway WS portuyla eşleştiğini doğrulayın; kullanıcı arayüzü sağlıklı bir WS bağlantısı gerektirir.
- **Node IP'si 127.0.0.1 olarak görünüyor**: SSH tüneli ile bu beklenen bir durumdur. Gateway'in gerçek istemci IP'sini görmesini istiyorsanız **Taşıma yöntemi**ni **Doğrudan (ws/wss)** olarak değiştirin.
- **Voice Wake**: tetikleme ifadeleri uzak modda otomatik olarak yönlendirilir; ayrı bir yönlendirici gerekmez.

## Bildirim sesleri

Betiklerden `openclaw` ve `node.invoke` ile bildirim başına ses seçin, örneğin:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Artık uygulamada genel bir “varsayılan ses” anahtarı yoktur; çağıranlar her istek için bir ses (veya sessiz) seçer.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [Uzak erişim](/tr/gateway/remote)

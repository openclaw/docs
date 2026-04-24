---
read_when:
    - Uzak macOS denetimini kurma veya hata ayıklama
summary: SSH üzerinden uzak bir OpenClaw gateway'ini denetlemek için macOS uygulama akışı
title: Uzaktan denetim
x-i18n:
    generated_at: "2026-04-24T09:20:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1b436fe35db300f719cf3e72530e74914df6023509907d485670746c29656d8
    source_path: platforms/mac/remote.md
    workflow: 15
---

# Uzak OpenClaw (macOS ⇄ uzak ana makine)

Bu akış, macOS uygulamasının başka bir ana makinede (masaüstü/sunucu) çalışan bir OpenClaw gateway'i için tam uzaktan kumanda gibi davranmasını sağlar. Bu, uygulamanın **SSH üzerinden uzaktan** (remote run) özelliğidir. Sağlık denetimleri, Voice Wake iletimi ve Web Chat dahil tüm özellikler, _Settings → General_ altındaki aynı uzak SSH yapılandırmasını yeniden kullanır.

## Modlar

- **Yerel (bu Mac)**: Her şey dizüstü bilgisayarda çalışır. SSH kullanılmaz.
- **SSH üzerinden uzak (varsayılan)**: OpenClaw komutları uzak ana makinede yürütülür. Mac uygulaması, `-o BatchMode` ile birlikte seçtiğiniz kimlik/anahtar ve bir yerel port yönlendirmesiyle bir SSH bağlantısı açar.
- **Doğrudan uzak (ws/wss)**: SSH tüneli yoktur. Mac uygulaması doğrudan gateway URL'sine bağlanır (örneğin Tailscale Serve veya genel bir HTTPS reverse proxy üzerinden).

## Uzak taşıma türleri

Uzak mod iki taşıma türünü destekler:

- **SSH tüneli** (varsayılan): Gateway portunu localhost'a yönlendirmek için `ssh -N -L ...` kullanır. Tünel loopback olduğu için gateway node'un IP'sini `127.0.0.1` olarak görür.
- **Doğrudan (ws/wss)**: Doğrudan gateway URL'sine bağlanır. Gateway gerçek istemci IP'sini görür.

## Uzak ana makinede önkoşullar

1. Node + pnpm kurun ve OpenClaw CLI'yi derleyip kurun (`pnpm install && pnpm build && pnpm link --global`).
2. Etkileşimsiz shell'ler için `openclaw` komutunun PATH üzerinde olduğundan emin olun (gerekirse `/usr/local/bin` veya `/opt/homebrew/bin` içine symlink oluşturun).
3. Anahtar kimlik doğrulamasıyla SSH'ı açın. LAN dışı kararlı erişilebilirlik için **Tailscale** IP'lerini öneriyoruz.

## macOS uygulama kurulumu

1. _Settings → General_ bölümünü açın.
2. **OpenClaw runs** altında **SSH üzerinden uzak** seçin ve şunları ayarlayın:
   - **Transport**: **SSH tunnel** veya **Direct (ws/wss)**.
   - **SSH target**: `user@host` (isteğe bağlı `:port`).
     - Gateway aynı LAN üzerindeyse ve Bonjour yayımlıyorsa, bu alanı otomatik doldurmak için keşfedilen listeden seçin.
   - **Gateway URL** (yalnızca Direct): `wss://gateway.example.ts.net` (veya yerel/LAN için `ws://...`).
   - **Identity file** (gelişmiş): anahtarınızın yolu.
   - **Project root** (gelişmiş): komutlar için kullanılan uzak checkout yolu.
   - **CLI path** (gelişmiş): çalıştırılabilir bir `openclaw` giriş noktası/ikili dosyası için isteğe bağlı yol (yayımlandığında otomatik doldurulur).
3. **Test remote** düğmesine basın. Başarı, uzak `openclaw status --json` komutunun doğru çalıştığını gösterir. Hatalar genellikle PATH/CLI sorunları anlamına gelir; 127 çıkış kodu CLI'nin uzakta bulunamadığını gösterir.
4. Sağlık denetimleri ve Web Chat artık bu SSH tüneli üzerinden otomatik çalışır.

## Web Chat

- **SSH tüneli**: Web Chat, yönlendirilmiş WebSocket control portu üzerinden gateway'e bağlanır (varsayılan 18789).
- **Doğrudan (ws/wss)**: Web Chat, yapılandırılmış gateway URL'sine doğrudan bağlanır.
- Artık ayrı bir WebChat HTTP sunucusu yoktur.

## İzinler

- Uzak ana makine, yerelle aynı TCC izinlerine ihtiyaç duyar (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Bunları bir kez vermek için o makinede ilk kullanım akışını çalıştırın.
- Node'lar izin durumlarını `node.list` / `node.describe` üzerinden yayımlar, böylece agent'lar nelerin kullanılabildiğini bilir.

## Güvenlik notları

- Uzak ana makinede loopback bind tercih edin ve SSH veya Tailscale üzerinden bağlanın.
- SSH tünelleme strict host-key denetimi kullanır; bu nedenle önce ana makine anahtarına güvenin ki `~/.ssh/known_hosts` içinde bulunsun.
- Gateway'i loopback olmayan bir arayüze bağlarsanız geçerli Gateway kimlik doğrulaması zorunlu olsun: token, parola veya `gateway.auth.mode: "trusted-proxy"` kullanan kimlik farkındalıklı bir reverse proxy.
- Bkz. [Security](/tr/gateway/security) ve [Tailscale](/tr/gateway/tailscale).

## WhatsApp oturum açma akışı (uzak)

- `openclaw channels login --verbose` komutunu **uzak ana makinede** çalıştırın. QR kodunu telefonunuzdaki WhatsApp ile tarayın.
- Kimlik doğrulamanın süresi dolarsa o ana makinede oturum açmayı yeniden çalıştırın. Sağlık denetimi bağlantı sorunlarını gösterecektir.

## Sorun giderme

- **çıkış 127 / bulunamadı**: `openclaw`, login olmayan shell'ler için PATH üzerinde değildir. Bunu `/etc/paths`, shell rc dosyanıza ekleyin veya `/usr/local/bin`/`/opt/homebrew/bin` içine symlink oluşturun.
- **Sağlık probe'u başarısız oldu**: SSH erişilebilirliğini, PATH'i ve Baileys'in oturum açmış olduğunu denetleyin (`openclaw status --json`).
- **Web Chat takılıyor**: Gateway'in uzak ana makinede çalıştığını ve yönlendirilen portun gateway WS portuyla eşleştiğini doğrulayın; UI sağlıklı bir WS bağlantısı gerektirir.
- **Node IP'si 127.0.0.1 olarak görünüyor**: SSH tünelinde bu beklenen davranıştır. Gateway'in gerçek istemci IP'sini görmesini istiyorsanız **Transport** ayarını **Direct (ws/wss)** olarak değiştirin.
- **Voice Wake**: tetikleyici ifadeler uzak modda otomatik iletilir; ayrı bir iletici gerekmez.

## Bildirim sesleri

Betiklerden her bildirim için ses seçimini `openclaw` ve `node.invoke` ile yapın, örneğin:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Uzak gateway hazır" --sound Glass
```

Uygulamada artık genel bir “varsayılan ses” anahtarı yoktur; çağıran taraflar her istek için bir ses (veya hiç ses) seçer.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [Uzak erişim](/tr/gateway/remote)

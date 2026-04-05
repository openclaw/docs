---
read_when:
    - Uzak mac denetimini kurarken veya hata ayıklarken
summary: SSH üzerinden uzak bir OpenClaw gateway'ini denetlemek için macOS uygulaması akışı
title: Uzaktan Denetim
x-i18n:
    generated_at: "2026-04-05T14:00:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 96e46e603c2275d04596b5d1ae0fb6858bd1a102a727dc13924ffcd9808fdf7e
    source_path: platforms/mac/remote.md
    workflow: 15
---

# Uzak OpenClaw (macOS ⇄ uzak ana makine)

Bu akış, macOS uygulamasının başka bir ana makinede (masaüstü/sunucu) çalışan bir OpenClaw gateway'i için tam bir uzaktan denetim işlevi görmesini sağlar. Bu, uygulamanın **SSH üzerinden uzaktan** (remote run) özelliğidir. Tüm özellikler—sağlık denetimleri, Voice Wake yönlendirmesi ve Web Chat—_Settings → General_ içindeki aynı uzak SSH yapılandırmasını yeniden kullanır.

## Modlar

- **Local (this Mac)**: Her şey dizüstü bilgisayarda çalışır. SSH kullanılmaz.
- **Remote over SSH (default)**: OpenClaw komutları uzak ana makinede yürütülür. Mac uygulaması, `-o BatchMode` ile birlikte seçtiğiniz kimlik/anahtar ve yerel port yönlendirmesiyle bir SSH bağlantısı açar.
- **Remote direct (ws/wss)**: SSH tüneli yoktur. Mac uygulaması doğrudan gateway URL'sine bağlanır (örneğin Tailscale Serve veya genel bir HTTPS reverse proxy üzerinden).

## Uzak taşıma yöntemleri

Uzak mod iki taşıma yöntemini destekler:

- **SSH tunnel** (varsayılan): Gateway portunu localhost'a yönlendirmek için `ssh -N -L ...` kullanır. Tünel loopback olduğu için gateway düğümün IP adresini `127.0.0.1` olarak görür.
- **Direct (ws/wss)**: Doğrudan gateway URL'sine bağlanır. Gateway gerçek istemci IP'sini görür.

## Uzak ana makinedeki ön koşullar

1. Node + pnpm kurun ve OpenClaw CLI'yi derleyip kurun (`pnpm install && pnpm build && pnpm link --global`).
2. `openclaw` komutunun etkileşimsiz kabuklar için PATH üzerinde olduğundan emin olun (gerekirse `/usr/local/bin` veya `/opt/homebrew/bin` içine symlink oluşturun).
3. Anahtar kimlik doğrulamasıyla SSH erişimini açın. LAN dışı erişimde kararlı erişilebilirlik için **Tailscale** IP'lerini öneririz.

## macOS uygulaması kurulumu

1. _Settings → General_ bölümünü açın.
2. **OpenClaw runs** altında **Remote over SSH** seçeneğini belirleyin ve şunları ayarlayın:
   - **Transport**: **SSH tunnel** veya **Direct (ws/wss)**.
   - **SSH target**: `user@host` (isteğe bağlı `:port`).
     - Gateway aynı LAN üzerindeyse ve Bonjour yayımlıyorsa, bu alanı otomatik doldurmak için keşfedilen listeden seçin.
   - **Gateway URL** (yalnızca Direct): `wss://gateway.example.ts.net` (veya yerel/LAN için `ws://...`).
   - **Identity file** (gelişmiş): anahtarınızın yolu.
   - **Project root** (gelişmiş): komutlar için kullanılan uzak checkout yolu.
   - **CLI path** (gelişmiş): çalıştırılabilir bir `openclaw` giriş noktası/ikilisi için isteğe bağlı yol (yayımlandığında otomatik doldurulur).
3. **Test remote** seçeneğine basın. Başarı, uzak `openclaw status --json` komutunun doğru çalıştığını gösterir. Hatalar genellikle PATH/CLI sorunları anlamına gelir; çıkış kodu 127, CLI'nin uzakta bulunamadığı anlamına gelir.
4. Sağlık denetimleri ve Web Chat artık bu SSH tüneli üzerinden otomatik olarak çalışacaktır.

## Web Chat

- **SSH tunnel**: Web Chat, yönlendirilen WebSocket kontrol portu üzerinden gateway'e bağlanır (varsayılan 18789).
- **Direct (ws/wss)**: Web Chat doğrudan yapılandırılmış gateway URL'sine bağlanır.
- Artık ayrı bir WebChat HTTP sunucusu yoktur.

## İzinler

- Uzak ana makine, yerelle aynı TCC onaylarına ihtiyaç duyar (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Bunları bir kez vermek için onboarding işlemini o makinede çalıştırın.
- Düğümler, ajanların nelerin kullanılabilir olduğunu bilmesi için izin durumlarını `node.list` / `node.describe` üzerinden yayımlar.

## Güvenlik notları

- Uzak ana makinede loopback bağlamalarını tercih edin ve SSH veya Tailscale üzerinden bağlanın.
- SSH tünelleme katı ana makine anahtarı denetimi kullanır; önce ana makine anahtarına güvenin ki `~/.ssh/known_hosts` içinde bulunsun.
- Gateway'i loopback olmayan bir arayüze bağlarsanız, geçerli Gateway kimlik doğrulaması zorunlu olmalıdır: token, parola veya `gateway.auth.mode: "trusted-proxy"` ile kimlik farkında bir reverse proxy.
- Bkz. [Security](/tr/gateway/security) ve [Tailscale](/tr/gateway/tailscale).

## WhatsApp oturum açma akışı (uzak)

- `openclaw channels login --verbose` komutunu **uzak ana makinede** çalıştırın. QR kodunu telefonunuzdaki WhatsApp ile tarayın.
- Kimlik doğrulama süresi dolarsa o ana makinede oturum açmayı yeniden çalıştırın. Sağlık denetimi bağlantı sorunlarını gösterecektir.

## Sorun giderme

- **exit 127 / not found**: `openclaw`, login olmayan kabuklar için PATH üzerinde değildir. Bunu `/etc/paths`, kabuk rc dosyanıza ekleyin veya `/usr/local/bin`/`/opt/homebrew/bin` içine symlink oluşturun.
- **Health probe failed**: SSH erişilebilirliğini, PATH'i ve Baileys'in oturum açmış olduğunu kontrol edin (`openclaw status --json`).
- **Web Chat stuck**: Gateway'in uzak ana makinede çalıştığını ve yönlendirilen portun gateway WS portuyla eşleştiğini doğrulayın; kullanıcı arayüzü sağlıklı bir WS bağlantısı gerektirir.
- **Node IP shows 127.0.0.1**: SSH tünelinde bu beklenen davranıştır. Gateway'in gerçek istemci IP'sini görmesini istiyorsanız **Transport** seçeneğini **Direct (ws/wss)** olarak değiştirin.
- **Voice Wake**: tetikleyici ifadeler uzak modda otomatik olarak yönlendirilir; ayrı bir yönlendirici gerekmez.

## Bildirim sesleri

Komut dosyalarından `openclaw` ve `node.invoke` ile bildirim başına ses seçin, örneğin:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Artık uygulamada genel bir “varsayılan ses” geçişi yoktur; çağıranlar her istek için bir ses (veya hiçbiri) seçer.

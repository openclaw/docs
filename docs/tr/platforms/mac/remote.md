---
read_when:
    - Uzaktan Mac kontrolünü kurma veya hata ayıklama
summary: SSH üzerinden uzaktaki bir OpenClaw Gateway'i denetlemeye yönelik macOS uygulama akışı
title: Uzaktan kontrol
x-i18n:
    generated_at: "2026-04-30T16:29:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c63f752c3636a253220310c7c8e57a28549704b74b2f0370bac432bae28a7d3
    source_path: platforms/mac/remote.md
    workflow: 16
---

# Uzak OpenClaw (macOS ⇄ uzak ana makine)

Bu akış, macOS uygulamasının başka bir ana makinede (masaüstü/sunucu) çalışan bir OpenClaw Gateway için tam bir uzaktan kumanda gibi davranmasını sağlar. Bu, uygulamanın **Remote over SSH** (uzaktan çalıştırma) özelliğidir. Tüm özellikler (sağlık kontrolleri, Voice Wake iletimi ve Web Chat) _Settings → General_ bölümündeki aynı uzak SSH yapılandırmasını yeniden kullanır.

## Modlar

- **Yerel (bu Mac)**: Her şey dizüstü bilgisayarda çalışır. SSH kullanılmaz.
- **Remote over SSH (varsayılan)**: OpenClaw komutları uzak ana makinede yürütülür. Mac uygulaması, `-o BatchMode` ile seçtiğiniz kimlik/anahtarı ve yerel port yönlendirmesini kullanarak bir SSH bağlantısı açar.
- **Remote direct (ws/wss)**: SSH tüneli yoktur. Mac uygulaması Gateway URL’sine doğrudan bağlanır (örneğin, Tailscale Serve veya herkese açık bir HTTPS ters proxy üzerinden).

## Uzak aktarımlar

Uzak mod iki aktarımı destekler:

- **SSH tüneli** (varsayılan): Gateway portunu localhost’a yönlendirmek için `ssh -N -L ...` kullanır. Tünel loopback olduğu için Gateway, düğümün IP’sini `127.0.0.1` olarak görür.
- **Doğrudan (ws/wss)**: Gateway URL’sine doğrudan bağlanır. Gateway gerçek istemci IP’sini görür.

SSH tüneli modunda, keşfedilen LAN/tailnet ana makine adları
`gateway.remote.sshTarget` olarak kaydedilir. Uygulama `gateway.remote.url`
değerini yerel tünel uç noktasında tutar; örneğin `ws://127.0.0.1:18789`.
Böylece CLI, Web Chat ve yerel düğüm ana makine hizmeti aynı güvenli loopback
aktarımını kullanır.

Uzak modda tarayıcı otomasyonu yerel macOS uygulama düğümü tarafından değil,
CLI düğüm ana makinesi tarafından yönetilir. Uygulama mümkün olduğunda kurulu
düğüm ana makine hizmetini başlatır; o Mac’ten tarayıcı denetimine ihtiyacınız
varsa bunu `openclaw node install ...` ve `openclaw node start` ile
kurup/başlatın (veya `openclaw node run ...` komutunu ön planda çalıştırın),
ardından tarayıcı yetenekli o düğümü hedefleyin.

## Uzak ana makinedeki ön koşullar

1. Node + pnpm kurun ve OpenClaw CLI’yi derleyip/kurun (`pnpm install && pnpm build && pnpm link --global`).
2. Etkileşimsiz kabuklar için `openclaw` komutunun PATH üzerinde olduğundan emin olun (gerekirse `/usr/local/bin` veya `/opt/homebrew/bin` içine symlink oluşturun).
3. Anahtar kimlik doğrulamasıyla SSH’yi açın. LAN dışından kararlı erişilebilirlik için **Tailscale** IP’lerini öneririz.

## macOS uygulama kurulumu

1. _Settings → General_ bölümünü açın.
2. **OpenClaw runs** altında **Remote over SSH** seçin ve şunları ayarlayın:
   - **Aktarım**: **SSH tunnel** veya **Direct (ws/wss)**.
   - **SSH hedefi**: `user@host` (isteğe bağlı `:port`).
     - Gateway aynı LAN üzerindeyse ve Bonjour ile duyuru yapıyorsa, bu alanı otomatik doldurmak için keşfedilen listeden seçin.
   - **Gateway URL’si** (yalnızca Direct): `wss://gateway.example.ts.net` (veya yerel/LAN için `ws://...`).
   - **Kimlik dosyası** (gelişmiş): anahtarınızın yolu.
   - **Proje kökü** (gelişmiş): komutlar için kullanılan uzak checkout yolu.
   - **CLI yolu** (gelişmiş): çalıştırılabilir bir `openclaw` giriş noktası/ikili dosyasına isteğe bağlı yol (duyurulduğunda otomatik doldurulur).
3. **Test remote** düğmesine basın. Başarı, uzak `openclaw status --json` komutunun doğru çalıştığını gösterir. Hatalar genellikle PATH/CLI sorunları anlamına gelir; çıkış 127, CLI’nin uzakta bulunamadığı anlamına gelir.
4. Sağlık kontrolleri ve Web Chat artık bu SSH tüneli üzerinden otomatik olarak çalışır.

## Web Chat

- **SSH tüneli**: Web Chat, yönlendirilen WebSocket kontrol portu üzerinden Gateway’e bağlanır (varsayılan 18789).
- **Doğrudan (ws/wss)**: Web Chat, yapılandırılan Gateway URL’sine doğrudan bağlanır.
- Artık ayrı bir WebChat HTTP sunucusu yoktur.

## İzinler

- Uzak ana makine, yereldekiyle aynı TCC onaylarına ihtiyaç duyar (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Bunları bir kez vermek için o makinede onboarding çalıştırın.
- Düğümler izin durumlarını `node.list` / `node.describe` aracılığıyla duyurur, böylece aracılar nelerin kullanılabilir olduğunu bilir.

## Güvenlik notları

- Uzak ana makinede loopback bağlamalarını tercih edin ve SSH veya Tailscale üzerinden bağlanın.
- SSH tünelleme sıkı ana makine anahtarı denetimi kullanır; ana makine anahtarına önce güvenin ki `~/.ssh/known_hosts` içinde bulunsun.
- Gateway’i loopback olmayan bir arayüze bağlarsanız geçerli Gateway kimlik doğrulaması gerektirin: token, parola veya `gateway.auth.mode: "trusted-proxy"` kullanan kimlik farkındalıklı bir ters proxy.
- Bkz. [Güvenlik](/tr/gateway/security) ve [Tailscale](/tr/gateway/tailscale).

## WhatsApp oturum açma akışı (uzak)

- `openclaw channels login --verbose` komutunu **uzak ana makinede** çalıştırın. QR kodunu telefonunuzdaki WhatsApp ile tarayın.
- Kimlik doğrulaması süresi dolarsa oturum açmayı o ana makinede yeniden çalıştırın. Sağlık kontrolü bağlantı sorunlarını gösterir.

## Sorun giderme

- **çıkış 127 / bulunamadı**: `openclaw`, login olmayan kabuklar için PATH üzerinde değildir. `/etc/paths` dosyasına, kabuk rc dosyanıza ekleyin veya `/usr/local/bin`/`/opt/homebrew/bin` içine symlink oluşturun.
- **Sağlık yoklaması başarısız oldu**: SSH erişilebilirliğini, PATH’i ve Baileys oturumunun açık olduğunu kontrol edin (`openclaw status --json`).
- **Web Chat takılı kaldı**: Gateway’in uzak ana makinede çalıştığını ve yönlendirilen portun Gateway WS portuyla eşleştiğini doğrulayın; UI sağlıklı bir WS bağlantısı gerektirir.
- **Düğüm IP’si 127.0.0.1 gösteriyor**: SSH tüneliyle beklenen durumdur. Gateway’in gerçek istemci IP’sini görmesini istiyorsanız **Transport** değerini **Direct (ws/wss)** olarak değiştirin.
- **Dashboard çalışıyor ancak Mac yetenekleri çevrimdışı**: Bu, uygulamanın operatör/kontrol bağlantısının sağlıklı olduğu, ancak eşlik eden düğüm bağlantısının bağlı olmadığı veya komut yüzeyinin eksik olduğu anlamına gelir. Menü çubuğu cihaz bölümünü açın ve Mac’in `paired · disconnected` olup olmadığını kontrol edin. `wss://*.ts.net` Tailscale Serve uç noktaları için uygulama, sertifika rotasyonundan sonra eskimiş eski TLS leaf pin’lerini algılar, macOS yeni sertifikaya güvendiğinde eskimiş pin’i temizler ve otomatik olarak yeniden dener. Sertifika sistem tarafından güvenilir değilse veya ana makine bir Tailscale Serve adı değilse, sertifikayı gözden geçirin ya da **Remote over SSH** seçeneğine geçin.
- **Voice Wake**: tetikleme ifadeleri uzak modda otomatik olarak iletilir; ayrı bir iletici gerekmez.

## Bildirim sesleri

`openclaw` ve `node.invoke` kullanan betiklerden her bildirim için ses seçin, örneğin:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Uygulamada artık genel bir “varsayılan ses” anahtarı yoktur; çağıranlar her istek için bir ses seçer (veya hiç seçmez).

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [Uzak erişim](/tr/gateway/remote)

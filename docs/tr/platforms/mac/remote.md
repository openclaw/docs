---
read_when:
    - Uzak Mac denetimini ayarlama veya hata ayıklama
summary: Uzak bir OpenClaw Gateway'ini denetlemek için macOS uygulaması akışı
title: Uzaktan kontrol
x-i18n:
    generated_at: "2026-07-12T12:29:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd3ee71838737c1b8cf67d91d00b135283f4284400c75309646e62921e8c3633
    source_path: platforms/mac/remote.md
    workflow: 16
---

Bu akış, macOS uygulamasının başka bir ana makinede (masaüstü/sunucu) çalışan OpenClaw Gateway için tam kapsamlı bir uzaktan kumanda görevi görmesini sağlar. Uygulama, güvenilir LAN/Tailnet Gateway URL'lerine doğrudan bağlanır veya uzaktaki Gateway yalnızca local loopback üzerinden erişilebiliyorsa bir SSH tünelini yönetir. Sistem durumu kontrolleri, Sesle Uyandırma iletimi ve Web Sohbeti, _Ayarlar -> Genel_ bölümündeki aynı uzak yapılandırmayı yeniden kullanır.

## Modlar

- **Yerel (bu Mac)**: her şey dizüstü bilgisayarda çalışır; SSH kullanılmaz.
- **SSH üzerinden uzak (varsayılan)**: OpenClaw komutları uzak ana makinede çalışır. Uygulama, `-o BatchMode`, seçtiğiniz kimlik/anahtar ve yerel port yönlendirmesiyle bir SSH bağlantısı açar.
- **Doğrudan uzak (ws/wss)**: SSH tüneli kullanılmaz; uygulama doğrudan Gateway URL'sine bağlanır (LAN, Tailscale, Tailscale Serve veya genel kullanıma açık bir HTTPS ters proxy'si).

## Uzak aktarım yöntemleri

- **SSH tüneli** (varsayılan): Gateway portunu localhost'a yönlendirmek için `ssh -N -L ...` kullanır. Tünel local loopback olduğundan Gateway, Node IP'sini `127.0.0.1` olarak görür.
- **Doğrudan (ws/wss)**: doğrudan Gateway URL'sine bağlanır. Gateway gerçek istemci IP'sini görür.

Uygulama, seçilen takma ad `ControlMaster` veya `ForkAfterAuthentication` özelliğini etkinleştirse bile ilgili işlemi tam olarak izleyip yeniden başlatabilmek için kendi SSH işlemlerinde SSH bağlantı çoğullamasını ve kimlik doğrulama sonrası arka plana geçmeyi devre dışı bırakır.

Gateway kimlik bilgileri bu tünel üzerinden aktarıldığından SSH ana makine anahtarı doğrulaması varsayılan olarak katıdır. Yönetilen bir SSH takma adının kendi güven davranışını kullanmayı kabul etmek için `openclaw-mac configure-remote` aracılığıyla `--ssh-host-key-policy openssh` değerini ayarlayın veya doğrudan `gateway.remote.sshHostKeyPolicy` değerini `"openssh"` olarak belirleyin. Kabul etmeden önce takma adı ve eşleşen tüm `Host *` veya sistem yapılandırmalarını inceleyin. SSH hedefini değiştirmek (uygulamada veya `configure-remote` aracılığıyla), yeni hedef için açıkça yeniden kabul etmediğiniz sürece politikayı tekrar `strict` değerine sıfırlar.

SSH tüneli modunda keşfedilen LAN/tailnet ana makine adları `gateway.remote.sshTarget` olarak kaydedilir. Uygulama, CLI, Web Sohbeti ve yerel Node ana makine hizmetinin tümünün aynı local loopback aktarımını kullanması için `gateway.remote.url` değerini yerel tünel uç noktasında (örneğin `ws://127.0.0.1:18789`) tutar. Keşif hem ham Tailnet IP'lerini hem de kararlı ana makine adlarını döndürdüğünde uygulama, bağlantıların adres değişikliklerine karşı daha dayanıklı olması için Tailscale MagicDNS veya LAN adlarını tercih eder. Yerel tünel portu uzak Gateway portundan farklıysa `gateway.remote.remotePort` değerini uzak ana makinedeki porta ayarlayın.

Uzak moddaki tarayıcı otomasyonu, yerel macOS uygulaması Node'una değil CLI Node ana makinesine aittir. Uygulama, mümkün olduğunda kurulu Node ana makine hizmetini başlatır; ilgili Mac'ten tarayıcı denetimini etkinleştirmek için hizmeti `openclaw node install ...` ve `openclaw node start` ile kurup başlatın (veya `openclaw node run ...` komutunu ön planda çalıştırın), ardından tarayıcı özellikli Node'u hedefleyin.

## Uzak ana makinedeki ön koşullar

1. Node + pnpm'i kurun ve OpenClaw CLI'yi derleyip kurun (`pnpm install && pnpm build && pnpm link --global`).
2. Etkileşimsiz kabuklarda `openclaw` komutunun PATH üzerinde olduğundan emin olun (gerekirse `/usr/local/bin` veya `/opt/homebrew/bin` içine sembolik bağlantı oluşturun).
3. SSH aktarımı için: anahtar tabanlı SSH kimlik doğrulamasını yapılandırın. LAN dışından kararlı erişilebilirlik için Tailscale IP'leri önerilir.

## macOS uygulaması kurulumu

Uygulamayı karşılama akışı olmadan SSH üzerinden önceden yapılandırmak için:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway-host \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Güvenilir bir LAN veya Tailnet üzerinde zaten erişilebilen bir Gateway için SSH'yi tamamen atlayabilirsiniz:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Her iki biçim de `~/.openclaw/openclaw.json` dosyasını yazar, ilk kurulumu tamamlanmış olarak işaretler ve uygulamanın bir sonraki başlatmada seçilen aktarımın yönetimini üstlenmesini sağlar. `--local-port`/`--remote-port` için varsayılan değer `18789`'dur. Diğer bayraklar: `--password`, `--identity <path>`, `--ssh-host-key-policy <strict|openssh>`, `--project-root <path>`, `--cli-path <path>`, `--json`. Tam başvuru için `openclaw-mac configure-remote --help` komutunu çalıştırın.

Bunun yerine kullanıcı arayüzünden yapılandırmak için:

1. _Settings -> General_ bölümünü açın.
2. **OpenClaw runs** altında **Remote** seçeneğini belirleyip şunları ayarlayın:
   - **Transport**: **SSH tunnel** veya **Direct (ws/wss)**.
   - **SSH target**: `user@host` (isteğe bağlı `:port`). Gateway aynı LAN üzerindeyse ve Bonjour ile kendini duyuruyorsa bu alanı otomatik doldurmak için keşfedilenler listesinden seçin.
   - **Gateway URL** (yalnızca Direct): `wss://gateway.example.ts.net` (veya yerel/LAN için `ws://...`).
   - **Identity file** (gelişmiş): anahtarınızın yolu.
   - **Project root** (gelişmiş): komutlar için kullanılan uzak çalışma kopyası yolu.
   - **CLI path** (gelişmiş): çalıştırılabilir bir `openclaw` giriş noktasının/ikili dosyasının isteğe bağlı yolu (duyurulmuşsa otomatik doldurulur).
3. **Test remote** düğmesine basın. Başarı, uzak `openclaw status --json` komutunun doğru şekilde çalıştığı anlamına gelir. Hatalar genellikle PATH/CLI sorunlarını belirtir; 127 çıkış kodu, CLI'nin uzak ana makinede bulunamadığı anlamına gelir.
4. Sistem durumu kontrolleri ve Web Sohbeti artık seçilen aktarım üzerinden otomatik olarak çalışır.

## Web Sohbeti

- **SSH tüneli**: yönlendirilen WebSocket denetim portu (varsayılan 18789) üzerinden Gateway'e bağlanır.
- **Doğrudan (ws/wss)**: doğrudan yapılandırılmış Gateway URL'sine bağlanır.
- Ayrı bir Web Sohbeti HTTP sunucusu yoktur.

## İzinler

- Uzak ana makine, yerel sistemle aynı TCC onaylarına ihtiyaç duyar (Otomasyon, Erişilebilirlik, Ekran Kaydı, Mikrofon, Konuşma Tanıma, Bildirimler). Bunları vermek için ilk kurulumu o makinede bir kez çalıştırın.
- Node'lar, aracıların nelerin kullanılabilir olduğunu bilmesi için izin durumlarını `node.list` / `node.describe` aracılığıyla duyurur.

## Güvenlik notları

- Uzak ana makinede local loopback bağlamalarını tercih edin ve SSH, Tailscale Serve veya güvenilir bir Tailnet/LAN doğrudan URL'si üzerinden bağlanın.
- SSH tünelleme varsayılan olarak önceden güvenilmiş bir ana makine anahtarı gerektirir. Önce ana makine anahtarına güvenin (yapılandırılmış bilinen ana makineler dosyasına ekleyin) veya OpenSSH güven politikasını kabul ettiğiniz yönetilen bir takma ad için açıkça `gateway.remote.sshHostKeyPolicy: "openssh"` değerini ayarlayın.
- Gateway'i local loopback olmayan bir arayüze bağlarsanız geçerli Gateway kimlik doğrulamasını zorunlu kılın: token, parola veya `gateway.auth.mode: "trusted-proxy"` kullanan kimlik bilgisine duyarlı bir ters proxy.
- Bkz. [Güvenlik](/tr/gateway/security) ve [Tailscale](/tr/gateway/tailscale).

## WhatsApp oturum açma akışı (uzak)

- `openclaw channels login --channel whatsapp --verbose` komutunu **uzak ana makinede** çalıştırın. QR kodunu telefonunuzdaki WhatsApp ile tarayın.
- Kimlik doğrulamasının süresi dolarsa oturum açma işlemini ilgili ana makinede yeniden çalıştırın. Sistem durumu kontrolü bağlantı sorunlarını gösterir.

## Sorun giderme

| Belirti                                          | Neden / çözüm                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exit 127` / bulunamadı                          | Oturum açılmayan kabuklarda `openclaw`, PATH üzerinde değildir. `/etc/paths` dosyasına veya kabuk rc dosyanıza ekleyin ya da `/usr/local/bin`/`/opt/homebrew/bin` içine sembolik bağlantı oluşturun.                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Sistem durumu yoklaması başarısız oldu           | SSH erişilebilirliğini, PATH'i ve Baileys (WhatsApp) oturumunun açık olduğunu kontrol edin (`openclaw status --json`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Web Sohbeti takılı kaldı                         | Gateway'in uzak ana bilgisayarda çalıştığını ve yönlendirilen bağlantı noktasının Gateway WS bağlantı noktasıyla eşleştiğini doğrulayın; kullanıcı arayüzü sağlıklı bir WS bağlantısı gerektirir.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Node IP'si `127.0.0.1` olarak görünüyor          | SSH tünelinde bu beklenen bir durumdur. Gateway'in gerçek istemci IP'sini görmesini istiyorsanız **Aktarım** seçeneğini **Doğrudan (ws/wss)** olarak değiştirin.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Kontrol paneli çalışıyor ancak Mac özellikleri çevrimdışı | Operatör/denetim bağlantısı sağlıklı, ancak yardımcı Node bağlantısı kurulu değil veya komut yüzeyi eksik. Menü çubuğundaki aygıt bölümünü açın ve Mac'in `eşleştirildi · bağlantı kesildi` durumunda olup olmadığını kontrol edin. `wss://*.ts.net` Tailscale Serve uç noktalarında uygulama, sertifika yenilemesinden sonra eski TLS uç sertifikası sabitlemelerini algılar; macOS yeni sertifikaya güvendiğinde eski sabitlemeyi bir kez temizler ve otomatik olarak yeniden dener. Sertifika sistem tarafından güvenilir değilse veya ana bilgisayar bir Tailscale Serve adı değilse `gateway.remote.tlsFingerprint` değerini beklenen sertifika parmak izi olarak ayarlayın, sertifikayı inceleyin ya da **SSH üzerinden uzak bağlantı** seçeneğine geçin. |
| Sesle Uyandırma                                  | Tetikleyici ifadeler uzak modda otomatik olarak iletilir; ayrı bir iletici gerekmez.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

## Bildirim sesleri

Her bildirim için sesleri `openclaw nodes notify` komutuyla betiklerden seçin; örneğin:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Uygulamada genel bir varsayılan ses anahtarı yoktur; çağıranlar her istek için bir ses seçer (veya hiç ses seçmez).

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [Uzaktan erişim](/tr/gateway/remote)

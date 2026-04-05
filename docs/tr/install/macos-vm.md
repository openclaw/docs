---
read_when:
    - OpenClaw'ın ana macOS ortamınızdan yalıtılmasını istiyorsanız
    - Bir sandbox içinde iMessage entegrasyonu (BlueBubbles) istiyorsanız
    - Kopyalayabileceğiniz, sıfırlanabilir bir macOS ortamı istiyorsanız
    - Yerel ve barındırılan macOS VM seçeneklerini karşılaştırmak istiyorsanız
summary: Yalıtım veya iMessage gerektiğinde OpenClaw'ı sandbox içindeki bir macOS VM'de çalıştırın (yerel veya barındırılan)
title: macOS VM'ler
x-i18n:
    generated_at: "2026-04-05T13:57:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: b1f7c5691fd2686418ee25f2c38b1f9badd511daeef2906d21ad30fb523b013f
    source_path: install/macos-vm.md
    workflow: 15
---

# OpenClaw on macOS VM'ler (Sandboxing)

## Önerilen varsayılan (çoğu kullanıcı)

- Her zaman açık bir Ağ Geçidi ve düşük maliyet için **küçük bir Linux VPS**. Bkz. [VPS barındırma](/vps).
- Tam denetim ve tarayıcı otomasyonu için **konut IP'si** istiyorsanız **ayrı donanım** (Mac mini veya Linux kutusu). Birçok site veri merkezi IP'lerini engeller; bu yüzden yerel tarama genellikle daha iyi çalışır.
- **Hibrit:** Ağ Geçidi'ni ucuz bir VPS üzerinde tutun ve tarayıcı/UI otomasyonu gerektiğinde Mac'inizi bir **düğüm** olarak bağlayın. Bkz. [Düğümler](/nodes) ve [Ağ Geçidi remote](/gateway/remote).

macOS VM kullanın; özellikle macOS'e özgü yeteneklere (iMessage/BlueBubbles) ihtiyaç duyduğunuzda veya günlük kullandığınız Mac'ten sıkı yalıtım istediğinizde.

## macOS VM seçenekleri

### Apple Silicon Mac'inizde yerel VM (Lume)

Var olan Apple Silicon Mac'inizde [Lume](https://cua.ai/docs/lume) kullanarak OpenClaw'ı sandbox içindeki bir macOS VM'de çalıştırın.

Bu size şunları sağlar:

- Yalıtım içinde tam macOS ortamı (ana sisteminiz temiz kalır)
- BlueBubbles üzerinden iMessage desteği (Linux/Windows'ta mümkün değildir)
- VM'leri clone ederek anında sıfırlama
- Ek donanım veya bulut maliyeti olmadan kullanım

### Barındırılan Mac sağlayıcıları (bulut)

Bulutta macOS istiyorsanız, barındırılan Mac sağlayıcıları da çalışır:

- [MacStadium](https://www.macstadium.com/) (barındırılan Mac'ler)
- Diğer barındırılan Mac sağlayıcıları da çalışır; onların VM + SSH dokümanlarını izleyin

macOS VM'e SSH erişiminiz olduğunda aşağıdaki 6. adımdan devam edin.

---

## Hızlı yol (Lume, deneyimli kullanıcılar)

1. Lume'u kurun
2. `lume create openclaw --os macos --ipsw latest`
3. Setup Assistant'ı tamamlayın, Remote Login (SSH) etkinleştirin
4. `lume run openclaw --no-display`
5. SSH ile bağlanın, OpenClaw'ı kurun, kanalları yapılandırın
6. Tamam

---

## Gerekenler (Lume)

- Apple Silicon Mac (M1/M2/M3/M4)
- Ana sistemde macOS Sequoia veya daha yeni sürüm
- VM başına yaklaşık 60 GB boş disk alanı
- Yaklaşık 20 dakika

---

## 1) Lume'u kurun

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

`~/.local/bin` PATH içinde değilse:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Doğrulayın:

```bash
lume --version
```

Dokümanlar: [Lume Installation](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) macOS VM'yi oluşturun

```bash
lume create openclaw --os macos --ipsw latest
```

Bu komut macOS'u indirir ve VM'yi oluşturur. Bir VNC penceresi otomatik olarak açılır.

Not: İndirme, bağlantınıza bağlı olarak biraz zaman alabilir.

---

## 3) Setup Assistant'ı tamamlayın

VNC penceresinde:

1. Dili ve bölgeyi seçin
2. Apple ID'yi atlayın (veya daha sonra iMessage istiyorsanız giriş yapın)
3. Bir kullanıcı hesabı oluşturun (kullanıcı adı ve parolayı hatırlayın)
4. Tüm isteğe bağlı özellikleri atlayın

Kurulum tamamlandıktan sonra SSH'yi etkinleştirin:

1. System Settings → General → Sharing bölümünü açın
2. "Remote Login" seçeneğini etkinleştirin

---

## 4) VM IP adresini alın

```bash
lume get openclaw
```

IP adresini bulun (genellikle `192.168.64.x`).

---

## 5) VM'ye SSH ile bağlanın

```bash
ssh youruser@192.168.64.X
```

`youruser` yerine oluşturduğunuz hesabı, IP yerine de VM'nizin IP'sini yazın.

---

## 6) OpenClaw'ı kurun

VM içinde:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Model sağlayıcınızı (Anthropic, OpenAI vb.) ayarlamak için onboarding istemlerini izleyin.

---

## 7) Kanalları yapılandırın

Yapılandırma dosyasını düzenleyin:

```bash
nano ~/.openclaw/openclaw.json
```

Kanallarınızı ekleyin:

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
  },
}
```

Ardından WhatsApp'a giriş yapın (QR taratın):

```bash
openclaw channels login
```

---

## 8) VM'yi headless çalıştırın

VM'yi durdurun ve ekran olmadan yeniden başlatın:

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM arka planda çalışır. OpenClaw'ın arka plan hizmeti ağ geçidini çalışır durumda tutar.

Durumu kontrol etmek için:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Bonus: iMessage entegrasyonu

Bu, macOS üzerinde çalıştırmanın en güçlü özelliğidir. iMessage'ı OpenClaw'a eklemek için [BlueBubbles](https://bluebubbles.app) kullanın.

VM içinde:

1. BlueBubbles'ı bluebubbles.app üzerinden indirin
2. Apple ID'nizle giriş yapın
3. Web API'yi etkinleştirin ve bir parola belirleyin
4. BlueBubbles webhook'larını ağ geçidinize yönlendirin (örnek: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

OpenClaw yapılandırmanıza ekleyin:

```json5
{
  channels: {
    bluebubbles: {
      serverUrl: "http://localhost:1234",
      password: "your-api-password",
      webhookPath: "/bluebubbles-webhook",
    },
  },
}
```

Ağ geçidini yeniden başlatın. Artık aracınız iMessage gönderebilir ve alabilir.

Tam kurulum ayrıntıları: [BlueBubbles kanalı](/tr/channels/bluebubbles)

---

## Altın görüntü kaydedin

Daha fazla özelleştirmeden önce temiz durumunuzun anlık görüntüsünü alın:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

İstediğiniz zaman sıfırlayın:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## 7/24 çalıştırma

VM'yi şu yollarla açık tutun:

- Mac'inizi prize takılı tutarak
- System Settings → Energy Saver içinde uyku modunu devre dışı bırakarak
- Gerekirse `caffeinate` kullanarak

Gerçek anlamda her zaman açık kullanım için ayrı bir Mac mini veya küçük bir VPS düşünün. Bkz. [VPS barındırma](/vps).

---

## Sorun giderme

| Sorun                    | Çözüm                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------- |
| VM'ye SSH ile bağlanılamıyor | VM'nin System Settings bölümünde "Remote Login" seçeneğinin etkin olduğunu kontrol edin |
| VM IP görünmüyor         | VM'nin tamamen açılmasını bekleyin, `lume get openclaw` komutunu tekrar çalıştırın     |
| Lume komutu bulunamadı   | `~/.local/bin` yolunu PATH'inize ekleyin                                              |
| WhatsApp QR taranmıyor   | `openclaw channels login` çalıştırırken ana sistemde değil, VM içinde oturum açtığınızdan emin olun |

---

## İlgili dokümanlar

- [VPS barındırma](/vps)
- [Düğümler](/nodes)
- [Ağ Geçidi remote](/gateway/remote)
- [BlueBubbles kanalı](/tr/channels/bluebubbles)
- [Lume Quickstart](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI Reference](https://cua.ai/docs/lume/reference/cli-reference)
- [Unattended VM Setup](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (ileri düzey)
- [Docker Sandboxing](/install/docker) (alternatif yalıtım yaklaşımı)

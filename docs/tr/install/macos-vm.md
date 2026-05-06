---
read_when:
    - OpenClaw'ı ana macOS ortamınızdan yalıtmak istiyorsunuz
    - iMessage entegrasyonunu (BlueBubbles) bir korumalı alanda istiyorsunuz
    - Klonlayabileceğiniz sıfırlanabilir bir macOS ortamı istiyorsunuz
    - Yerel ve barındırılan macOS VM seçeneklerini karşılaştırmak istiyorsunuz
summary: Yalıtıma veya iMessage'a ihtiyacınız olduğunda OpenClaw'ı korumalı alan içindeki bir macOS VM'de (yerel veya barındırılan) çalıştırın
title: macOS sanal makineleri
x-i18n:
    generated_at: "2026-05-06T09:19:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2b6841f66e63606346f364bb1b1b9ca4a3d52558e3d8c6f129c5b89387c6968
    source_path: install/macos-vm.md
    workflow: 16
---

## Önerilen varsayılan (çoğu kullanıcı)

- Her zaman açık Gateway ve düşük maliyet için **küçük Linux VPS**. Bkz. [VPS barındırma](/tr/vps).
- Tam denetim ve tarayıcı otomasyonu için **konut IP'si** istiyorsanız **ayrılmış donanım** (Mac mini veya Linux kutusu). Birçok site veri merkezi IP'lerini engeller, bu nedenle yerel tarama çoğu zaman daha iyi çalışır.
- **Hibrit:** Gateway'i ucuz bir VPS üzerinde tutun ve tarayıcı/UI otomasyonuna ihtiyaç duyduğunuzda Mac'inizi **Node** olarak bağlayın. Bkz. [Node'lar](/tr/nodes) ve [Gateway uzaktan](/tr/gateway/remote).

macOS VM'yi yalnızca özellikle macOS'a özgü yeteneklere (iMessage/BlueBubbles) ihtiyaç duyduğunuzda veya günlük Mac'inizden katı bir yalıtım istediğinizde kullanın.

## macOS VM seçenekleri

### Apple Silicon Mac'inizde yerel VM (Lume)

Mevcut Apple Silicon Mac'inizde [Lume](https://cua.ai/docs/lume) kullanarak OpenClaw'u korumalı bir macOS VM içinde çalıştırın.

Bu size şunları sağlar:

- Yalıtılmış tam macOS ortamı (ana makineniz temiz kalır)
- BlueBubbles aracılığıyla iMessage desteği (Linux/Windows üzerinde imkansız)
- VM'leri klonlayarak anında sıfırlama
- Ek donanım veya bulut maliyeti yok

### Barındırılan Mac sağlayıcıları (bulut)

Bulutta macOS istiyorsanız, barındırılan Mac sağlayıcıları da çalışır:

- [MacStadium](https://www.macstadium.com/) (barındırılan Mac'ler)
- Diğer barındırılan Mac sağlayıcıları da çalışır; kendi VM + SSH belgelerini izleyin

Bir macOS VM'ye SSH erişiminiz olduğunda, aşağıdaki 6. adımdan devam edin.

---

## Hızlı yol (Lume, deneyimli kullanıcılar)

1. Lume'u yükleyin
2. `lume create openclaw --os macos --ipsw latest`
3. Setup Assistant'ı tamamlayın, Remote Login'i (SSH) etkinleştirin
4. `lume run openclaw --no-display`
5. SSH ile bağlanın, OpenClaw'u yükleyin, kanalları yapılandırın
6. Bitti

---

## Gerekenler (Lume)

- Apple Silicon Mac (M1/M2/M3/M4)
- Ana makinede macOS Sequoia veya daha yenisi
- VM başına ~60 GB boş disk alanı
- ~20 dakika

---

## 1) Lume'u yükleyin

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

`~/.local/bin` PATH'inizde değilse:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Doğrulayın:

```bash
lume --version
```

Belgeler: [Lume Kurulumu](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) macOS VM'yi oluşturun

```bash
lume create openclaw --os macos --ipsw latest
```

Bu komut macOS'u indirir ve VM'yi oluşturur. Bir VNC penceresi otomatik olarak açılır.

<Note>
İndirme, bağlantınıza bağlı olarak biraz zaman alabilir.
</Note>

---

## 3) Setup Assistant'ı tamamlayın

VNC penceresinde:

1. Dil ve bölge seçin
2. Apple ID'yi atlayın (veya iMessage'ı daha sonra istiyorsanız giriş yapın)
3. Bir kullanıcı hesabı oluşturun (kullanıcı adını ve parolayı unutmayın)
4. Tüm isteğe bağlı özellikleri atlayın

Kurulum tamamlandıktan sonra SSH'yi etkinleştirin:

1. System Settings → General → Sharing bölümünü açın
2. "Remote Login" özelliğini etkinleştirin

---

## 4) VM IP adresini alın

```bash
lume get openclaw
```

IP adresini arayın (genellikle `192.168.64.x`).

---

## 5) VM'ye SSH ile bağlanın

```bash
ssh youruser@192.168.64.X
```

`youruser` yerine oluşturduğunuz hesabı, IP yerine VM'nizin IP adresini yazın.

---

## 6) OpenClaw'u yükleyin

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

Ardından WhatsApp'a giriş yapın (QR tarayın):

```bash
openclaw channels login
```

---

## 8) VM'yi başsız çalıştırın

VM'yi durdurun ve ekran olmadan yeniden başlatın:

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM arka planda çalışır. OpenClaw'un daemon'u gateway'in çalışır durumda kalmasını sağlar.

Durumu kontrol etmek için:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Bonus: iMessage entegrasyonu

Bu, macOS üzerinde çalıştırmanın en güçlü özelliğidir. iMessage'ı OpenClaw'a eklemek için [BlueBubbles](https://bluebubbles.app) kullanın.

VM içinde:

1. BlueBubbles'ı bluebubbles.app adresinden indirin
2. Apple ID'nizle giriş yapın
3. Web API'yi etkinleştirin ve bir parola ayarlayın
4. BlueBubbles Webhook'larını gateway'inize yönlendirin (örnek: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

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

Gateway'i yeniden başlatın. Artık ajanınız iMessage gönderip alabilir.

Tam kurulum ayrıntıları: [BlueBubbles kanalı](/tr/channels/bluebubbles)

---

## Altın imaj kaydedin

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

VM'yi çalışır durumda tutmak için:

- Mac'inizi prize takılı tutun
- System Settings → Energy Saver içinde uyku modunu devre dışı bırakın
- Gerekirse `caffeinate` kullanın

Gerçek anlamda her zaman açık kullanım için ayrılmış bir Mac mini veya küçük bir VPS düşünün. Bkz. [VPS barındırma](/tr/vps).

---

## Sorun giderme

| Sorun                    | Çözüm                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------- |
| VM'ye SSH ile bağlanılamıyor | VM'nin System Settings bölümünde "Remote Login" etkinleştirilmiş mi kontrol edin |
| VM IP'si görünmüyor      | VM'nin tamamen açılmasını bekleyin, `lume get openclaw` komutunu tekrar çalıştırın |
| Lume komutu bulunamıyor  | `~/.local/bin` dizinini PATH'inize ekleyin                                         |
| WhatsApp QR taranmıyor   | `openclaw channels login` çalıştırırken VM'ye (ana makineye değil) giriş yaptığınızdan emin olun |

---

## İlgili belgeler

- [VPS barındırma](/tr/vps)
- [Node'lar](/tr/nodes)
- [Gateway uzaktan](/tr/gateway/remote)
- [BlueBubbles kanalı](/tr/channels/bluebubbles)
- [Lume Hızlı Başlangıç](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI Referansı](https://cua.ai/docs/lume/reference/cli-reference)
- [Katılımsız VM Kurulumu](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (gelişmiş)
- [Docker Korumalı Alanı](/tr/install/docker) (alternatif yalıtım yaklaşımı)

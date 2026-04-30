---
read_when:
    - OpenClaw'ın ana macOS ortamınızdan yalıtılmış olmasını istiyorsunuz
    - Korumalı alanda iMessage entegrasyonu (BlueBubbles) istiyorsunuz
    - Klonlayabileceğiniz sıfırlanabilir bir macOS ortamı istiyorsunuz
    - Yerel ve barındırılan macOS VM seçeneklerini karşılaştırmak istiyorsunuz
summary: Yalıtım veya iMessage gerektiğinde OpenClaw'ı korumalı alanlı bir macOS VM'de (yerel veya barındırılan) çalıştırın
title: macOS sanal makineleri
x-i18n:
    generated_at: "2026-04-30T09:30:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49cd3d420db02bcdb80378c3a91a1c1243e7be2012525c31de1dd49db397d560
    source_path: install/macos-vm.md
    workflow: 16
---

# macOS VM'lerinde OpenClaw (Sandboxing)

## Önerilen varsayılan (çoğu kullanıcı)

- Her zaman açık bir Gateway ve düşük maliyet için **küçük Linux VPS**. Bkz. [VPS barındırma](/tr/vps).
- Tarayıcı otomasyonu için tam kontrol ve **konut IP'si** istiyorsanız **özel donanım** (Mac mini veya Linux kutusu). Birçok site veri merkezi IP'lerini engeller, bu nedenle yerel gezinme genellikle daha iyi çalışır.
- **Hibrit:** Gateway'i ucuz bir VPS'te tutun ve tarayıcı/UI otomasyonuna ihtiyaç duyduğunuzda Mac'inizi **node** olarak bağlayın. Bkz. [Nodes](/tr/nodes) ve [Gateway uzak](/tr/gateway/remote).

Yalnızca özellikle macOS'a özgü yeteneklere (iMessage/BlueBubbles) ihtiyaç duyduğunuzda veya günlük Mac'inizden sıkı yalıtım istediğinizde macOS VM kullanın.

## macOS VM seçenekleri

### Apple Silicon Mac'inizde yerel VM (Lume)

Mevcut Apple Silicon Mac'inizde [Lume](https://cua.ai/docs/lume) kullanarak OpenClaw'ı sandbox'lı bir macOS VM içinde çalıştırın.

Bu size şunları sağlar:

- Yalıtım içinde tam macOS ortamı (ana makineniz temiz kalır)
- BlueBubbles üzerinden iMessage desteği (Linux/Windows'ta imkansız)
- VM'leri klonlayarak anında sıfırlama
- Ek donanım veya bulut maliyeti yok

### Barındırılan Mac sağlayıcıları (bulut)

Bulutta macOS istiyorsanız barındırılan Mac sağlayıcıları da çalışır:

- [MacStadium](https://www.macstadium.com/) (barındırılan Mac'ler)
- Diğer barındırılan Mac sağlayıcıları da çalışır; onların VM + SSH belgelerini izleyin

Bir macOS VM'ye SSH erişiminiz olduğunda aşağıdaki 6. adımdan devam edin.

---

## Hızlı yol (Lume, deneyimli kullanıcılar)

1. Lume'u kurun
2. `lume create openclaw --os macos --ipsw latest`
3. Kurulum Yardımcısı'nı tamamlayın, Remote Login'i (SSH) etkinleştirin
4. `lume run openclaw --no-display`
5. SSH ile bağlanın, OpenClaw'ı kurun, kanalları yapılandırın
6. Tamam

---

## Gerekenler (Lume)

- Apple Silicon Mac (M1/M2/M3/M4)
- Ana makinede macOS Sequoia veya daha yenisi
- VM başına yaklaşık 60 GB boş disk alanı
- Yaklaşık 20 dakika

---

## 1) Lume'u kurun

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

Bu, macOS'u indirir ve VM'yi oluşturur. Bir VNC penceresi otomatik olarak açılır.

<Note>
İndirme, bağlantınıza bağlı olarak biraz zaman alabilir.
</Note>

---

## 3) Kurulum Yardımcısı'nı tamamlayın

VNC penceresinde:

1. Dil ve bölge seçin
2. Apple ID'yi atlayın (veya daha sonra iMessage istiyorsanız giriş yapın)
3. Bir kullanıcı hesabı oluşturun (kullanıcı adını ve parolayı unutmayın)
4. Tüm isteğe bağlı özellikleri atlayın

Kurulum tamamlandıktan sonra SSH'yi etkinleştirin:

1. System Settings → General → Sharing'i açın
2. "Remote Login"i etkinleştirin

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

`youruser` yerine oluşturduğunuz hesabı, IP yerine VM'nizin IP'sini yazın.

---

## 6) OpenClaw'ı kurun

VM içinde:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Model sağlayıcınızı (Anthropic, OpenAI vb.) ayarlamak için ilk kurulum istemlerini izleyin.

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

## 8) VM'yi ekransız çalıştırın

VM'yi durdurun ve ekran olmadan yeniden başlatın:

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM arka planda çalışır. OpenClaw'ın daemon'u Gateway'in çalışmasını sürdürür.

Durumu kontrol etmek için:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Bonus: iMessage entegrasyonu

Bu, macOS'ta çalıştırmanın en önemli özelliğidir. OpenClaw'a iMessage eklemek için [BlueBubbles](https://bluebubbles.app) kullanın.

VM içinde:

1. BlueBubbles'ı bluebubbles.app adresinden indirin
2. Apple ID'nizle giriş yapın
3. Web API'yi etkinleştirin ve bir parola belirleyin
4. BlueBubbles webhooks'unu gateway'inize yönlendirin (örnek: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

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

Gateway'i yeniden başlatın. Artık agent'ınız iMessages gönderebilir ve alabilir.

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

Gerçek anlamda her zaman açık kullanım için özel bir Mac mini veya küçük bir VPS düşünün. Bkz. [VPS barındırma](/tr/vps).

---

## Sorun giderme

| Sorun                    | Çözüm                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------- |
| VM'ye SSH ile bağlanılamıyor | VM'nin System Settings içinde "Remote Login"in etkin olduğundan emin olun          |
| VM IP'si görünmüyor      | VM'nin tamamen açılmasını bekleyin, `lume get openclaw` komutunu tekrar çalıştırın |
| Lume komutu bulunamadı   | PATH'inize `~/.local/bin` ekleyin                                                  |
| WhatsApp QR taranmıyor   | `openclaw channels login` çalıştırırken VM'de (ana makinede değil) oturum açtığınızdan emin olun |

---

## İlgili belgeler

- [VPS barındırma](/tr/vps)
- [Nodes](/tr/nodes)
- [Gateway uzak](/tr/gateway/remote)
- [BlueBubbles kanalı](/tr/channels/bluebubbles)
- [Lume Hızlı Başlangıç](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI Başvurusu](https://cua.ai/docs/lume/reference/cli-reference)
- [Katılımsız VM Kurulumu](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (ileri düzey)
- [Docker Sandboxing](/tr/install/docker) (alternatif yalıtım yaklaşımı)

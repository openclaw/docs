---
read_when:
    - OpenClaw'un ana macOS ortamınızdan yalıtılmış olmasını istiyorsunuz
    - Bir korumalı alanda iMessage entegrasyonu istiyorsunuz
    - Klonlayabileceğiniz sıfırlanabilir bir macOS ortamı istiyorsunuz
    - Yerel ve barındırılan macOS VM seçeneklerini karşılaştırmak istiyorsunuz
summary: Yalıtım veya iMessage gerektiğinde OpenClaw'ı korumalı alana alınmış bir macOS VM'de (yerel veya barındırılan) çalıştırın
title: macOS sanal makineleri
x-i18n:
    generated_at: "2026-05-10T19:42:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3502ccaee51261573764440f9e782d2512e9da0332bd15eef3a5c4a83b0c2936
    source_path: install/macos-vm.md
    workflow: 16
---

## Önerilen varsayılan (çoğu kullanıcı)

- Her zaman açık Gateway ve düşük maliyet için **küçük Linux VPS**. Bkz. [VPS barındırma](/tr/vps).
- Tarayıcı otomasyonu için tam kontrol ve **konut IP adresi** istiyorsanız **özel donanım** (Mac mini veya Linux kutusu). Birçok site veri merkezi IP adreslerini engeller, bu nedenle yerel gezinme çoğu zaman daha iyi çalışır.
- **Hibrit:** Gateway'i ucuz bir VPS üzerinde tutun ve tarayıcı/UI otomasyonuna ihtiyaç duyduğunuzda Mac'inizi bir **Node** olarak bağlayın. Bkz. [Node'lar](/tr/nodes) ve [Gateway uzak bağlantısı](/tr/gateway/remote).

macOS'a özgü iMessage gibi yeteneklere özellikle ihtiyaç duyduğunuzda veya günlük Mac'inizden sıkı yalıtım istediğinizde bir macOS VM kullanın.

## macOS VM seçenekleri

### Apple Silicon Mac'inizde yerel VM (Lume)

Mevcut Apple Silicon Mac'inizde [Lume](https://cua.ai/docs/lume) kullanarak OpenClaw'ı korumalı bir macOS VM içinde çalıştırın.

Bu size şunları sağlar:

- Yalıtılmış tam macOS ortamı (ana makineniz temiz kalır)
- `imsg` üzerinden iMessage desteği (varsayılan yerel yol Linux/Windows üzerinde mümkün değildir)
- VM'leri klonlayarak anında sıfırlama
- Ek donanım veya bulut maliyeti yok

### Barındırılan Mac sağlayıcıları (bulut)

Bulutta macOS istiyorsanız, barındırılan Mac sağlayıcıları da çalışır:

- [MacStadium](https://www.macstadium.com/) (barındırılan Mac'ler)
- Diğer barındırılan Mac satıcıları da çalışır; onların VM + SSH belgelerini izleyin

Bir macOS VM'ye SSH erişiminiz olduğunda, aşağıdaki 6. adımdan devam edin.

---

## Hızlı yol (Lume, deneyimli kullanıcılar)

1. Lume'u yükleyin
2. `lume create openclaw --os macos --ipsw latest`
3. Kurulum Yardımcısı'nı tamamlayın, Uzaktan Oturum Açma'yı (SSH) etkinleştirin
4. `lume run openclaw --no-display`
5. SSH ile bağlanın, OpenClaw'ı yükleyin, kanalları yapılandırın
6. Tamamlandı

---

## Gerekenler (Lume)

- Apple Silicon Mac (M1/M2/M3/M4)
- Ana makinede macOS Sequoia veya sonrası
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

## 3) Kurulum Yardımcısı'nı tamamlayın

VNC penceresinde:

1. Dil ve bölge seçin
2. Apple ID'yi atlayın (veya daha sonra iMessage istiyorsanız giriş yapın)
3. Bir kullanıcı hesabı oluşturun (kullanıcı adını ve parolayı unutmayın)
4. Tüm isteğe bağlı özellikleri atlayın

Kurulum tamamlandıktan sonra SSH'yi etkinleştirin:

1. Sistem Ayarları → Genel → Paylaşım'ı açın
2. "Uzaktan Oturum Açma"yı etkinleştirin

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

`youruser` yerine oluşturduğunuz hesabı, IP yerine de VM'nizin IP adresini yazın.

---

## 6) OpenClaw'ı yükleyin

VM içinde:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Model sağlayıcınızı (Anthropic, OpenAI vb.) ayarlamak için başlangıç istemlerini izleyin.

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

VM'yi durdurun ve ekransız yeniden başlatın:

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM arka planda çalışır. OpenClaw'ın daemon'u Gateway'i çalışır durumda tutar.

Durumu kontrol etmek için:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Bonus: iMessage entegrasyonu

macOS üzerinde çalıştırmanın öne çıkan özelliği budur. Mesajlar'ı OpenClaw'a eklemek için `imsg` ile [iMessage](/tr/channels/imessage) kullanın.

VM içinde:

1. Mesajlar'a giriş yapın.
2. `imsg` yükleyin.
3. OpenClaw/`imsg` çalıştıran işleme Tam Disk Erişimi ve Otomasyon izni verin.
4. RPC desteğini `imsg rpc --help` ile doğrulayın.

OpenClaw yapılandırmanıza ekleyin:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
    },
  },
}
```

Gateway'i yeniden başlatın. Artık agent'ınız iMessage gönderebilir ve alabilir.

Tam kurulum ayrıntıları: [iMessage kanalı](/tr/channels/imessage)

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
- Sistem Ayarları → Enerji Tasarrufu içinde uyku modunu devre dışı bırakın
- Gerekirse `caffeinate` kullanın

Gerçek anlamda her zaman açık kullanım için özel bir Mac mini veya küçük bir VPS düşünün. Bkz. [VPS barındırma](/tr/vps).

---

## Sorun giderme

| Sorun                    | Çözüm                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------- |
| VM'ye SSH ile bağlanılamıyor | VM'nin Sistem Ayarları'nda "Uzaktan Oturum Açma"nın etkin olduğunu kontrol edin |
| VM IP'si görünmüyor      | VM'nin tamamen açılmasını bekleyin, `lume get openclaw` komutunu tekrar çalıştırın |
| Lume komutu bulunamadı   | `~/.local/bin` dizinini PATH'inize ekleyin                                         |
| WhatsApp QR taranmıyor   | `openclaw channels login` çalıştırırken VM'ye (ana makineye değil) giriş yaptığınızdan emin olun |

---

## İlgili belgeler

- [VPS barındırma](/tr/vps)
- [Node'lar](/tr/nodes)
- [Gateway uzak bağlantısı](/tr/gateway/remote)
- [iMessage kanalı](/tr/channels/imessage)
- [Lume Hızlı Başlangıç](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI Referansı](https://cua.ai/docs/lume/reference/cli-reference)
- [Katılımsız VM Kurulumu](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (ileri düzey)
- [Docker Korumalı Alanı](/tr/install/docker) (alternatif yalıtım yaklaşımı)

---
read_when:
    - OpenClaw'u ana macOS ortamınızdan yalıtmak istiyorsunuz
    - Korumalı bir alanda iMessage entegrasyonu istiyorsunuz
    - Klonlayabileceğiniz, sıfırlanabilir bir macOS ortamı istiyorsunuz
    - Yerel ve barındırılan macOS sanal makine seçeneklerini karşılaştırmak istiyorsunuz
summary: Yalıtım veya iMessage gerektiğinde OpenClaw'u korumalı bir macOS sanal makinesinde (yerel veya barındırılan) çalıştırın
title: macOS sanal makineleri
x-i18n:
    generated_at: "2026-07-12T11:54:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e6b963faaf40f65adce1081715bc295059b8bed278a8c71a05a86e04ad7a7a5
    source_path: install/macos-vm.md
    workflow: 16
---

## Önerilen varsayılan seçenek (çoğu kullanıcı için)

- Sürekli çalışan bir Gateway ve düşük maliyet için **küçük bir Linux VPS**. Bkz. [VPS barındırma](/tr/vps).
- Tam denetim ve tarayıcı otomasyonu için **konut IP'si** istiyorsanız **özel donanım** (Mac mini veya Linux bilgisayar). Birçok site veri merkezi IP'lerini engellediğinden yerel tarama genellikle daha iyi çalışır.
- **Hibrit**: Gateway'i ucuz bir VPS'te tutun ve tarayıcı/kullanıcı arayüzü otomasyonuna ihtiyaç duyduğunuzda Mac'inizi bir **Node** olarak bağlayın. Bkz. [Node'lar](/tr/nodes) ve [Uzak Gateway](/tr/gateway/remote).

macOS sanal makinesini yalnızca iMessage gibi macOS'e özgü özelliklere özellikle ihtiyaç duyduğunuzda veya günlük kullandığınız Mac'ten kesin olarak yalıtmak istediğinizde kullanın.

## macOS sanal makine seçenekleri

### Apple Silicon Mac'inizde yerel sanal makine (Lume)

Mevcut Apple Silicon Mac'inizde [Lume](https://cua.ai/docs/lume) kullanarak OpenClaw'u korumalı bir macOS sanal makinesinde çalıştırın. Bunun sağladıkları:

- Yalıtılmış tam macOS ortamı (ana sisteminiz temiz kalır)
- `imsg` aracılığıyla iMessage desteği; varsayılan yerel yöntem Linux/Windows üzerinde kullanılamaz
- Sanal makineleri klonlayarak anında sıfırlama
- Ek donanım veya bulut maliyeti yok

### Barındırılan Mac sağlayıcıları (bulut)

Bulutta macOS kullanmak istiyorsanız barındırılan Mac sağlayıcıları da uygundur:

- [MacStadium](https://www.macstadium.com/) (barındırılan Mac'ler)
- Diğer barındırılan Mac sağlayıcıları da kullanılabilir; sanal makine ve SSH belgelerini izleyin

Bir macOS sanal makinesine SSH erişimi sağladıktan sonra aşağıdaki [OpenClaw'u yükleme](#6-install-openclaw) bölümünden devam edin.

## Hızlı yol (Lume, deneyimli kullanıcılar)

1. Lume'u yükleyin.
2. `lume create openclaw --os macos --ipsw latest`
3. Ayarlama Yardımcısı'nı tamamlayın ve Remote Login'i (SSH) etkinleştirin.
4. `lume run openclaw --no-display`
5. SSH ile bağlanın, OpenClaw'u yükleyin ve kanalları yapılandırın.
6. Tamamlandı.

## Gereksinimler (Lume)

- Apple Silicon Mac (M1/M2/M3/M4)
- Ana sistemde macOS Sequoia veya sonraki bir sürüm
- Sanal makine başına yaklaşık 60 GB boş disk alanı
- Yaklaşık 20 dakika

## 1) Lume'u yükleyin

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

`~/.local/bin`, PATH'inizde değilse:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Doğrulayın:

```bash
lume --version
```

Belgeler: [Lume kurulumu](https://cua.ai/docs/lume/guide/getting-started/installation)

## 2) macOS sanal makinesini oluşturun

```bash
lume create openclaw --os macos --ipsw latest
```

Bu komut macOS'i indirir ve sanal makineyi oluşturur. Bir VNC penceresi otomatik olarak açılır.

<Note>
İndirme işlemi bağlantınıza bağlı olarak biraz zaman alabilir.
</Note>

## 3) Ayarlama Yardımcısı'nı tamamlayın

VNC penceresinde:

1. Dili ve bölgeyi seçin.
2. Apple ID adımını atlayın (veya daha sonra iMessage kullanmak istiyorsanız giriş yapın).
3. Bir kullanıcı hesabı oluşturun (kullanıcı adını ve parolayı unutmayın).
4. İsteğe bağlı tüm özellikleri atlayın.

Ayarlama tamamlandıktan sonra:

1. SSH'yi etkinleştirin: System Settings -> General -> Sharing bölümünde "Remote Login" seçeneğini etkinleştirin.
2. Ekransız sanal makine kullanımı için otomatik girişi etkinleştirin: System Settings -> Users & Groups bölümünde "Automatically log in as:" seçeneğini belirleyin ve sanal makine kullanıcısını seçin.

## 4) Sanal makinenin IP adresini alın

```bash
lume get openclaw
```

IP adresini bulun (genellikle `192.168.64.x`).

## 5) SSH ile sanal makineye bağlanın

```bash
ssh youruser@192.168.64.X
```

`youruser` değerini oluşturduğunuz hesapla, IP'yi ise sanal makinenizin IP'siyle değiştirin.

## 6) OpenClaw'u yükleyin

Sanal makinenin içinde:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Model sağlayıcınızı (Anthropic, OpenAI vb.) ayarlamak için ilk kullanım istemlerini izleyin.

## 7) Kanalları yapılandırın

Yapılandırma dosyasını düzenleyin:

```bash
nano ~/.openclaw/openclaw.json
```

Kanallarınızı ekleyin:

```json5
{
  channels: {
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
  },
}
```

Ardından WhatsApp'ta oturum açın (QR kodunu tarayın):

```bash
openclaw channels login
```

## 8) Sanal makineyi ekransız çalıştırın

Sanal makineyi durdurup ekran olmadan yeniden başlatın:

```bash
lume stop openclaw
lume run openclaw --no-display
```

Sanal makine arka planda çalışır; OpenClaw arka plan hizmeti Gateway'in çalışmasını sürdürür. Durumu denetlemek için:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

## Ek: iMessage entegrasyonu

Bu, macOS üzerinde çalıştırmanın en önemli özelliğidir. Mesajlar uygulamasını OpenClaw'a eklemek için `imsg` ile [iMessage](/tr/channels/imessage) kullanın.

Sanal makinenin içinde:

1. Mesajlar uygulamasında oturum açın.
2. `imsg` aracını yükleyin.
3. OpenClaw/`imsg` çalıştıran işleme Tam Disk Erişimi ve Otomasyon izni verin.
4. `imsg rpc --help` ile RPC desteğini doğrulayın.

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

Gateway'i yeniden başlatın. Aracınız artık iMessage gönderip alabilir. Tüm kurulum ayrıntıları: [iMessage kanalı](/tr/channels/imessage).

## Temiz bir kalıp görüntü kaydedin

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

## 7/24 çalıştırma

Sanal makineyi çalışır durumda tutmak için:

- Mac'inizi güç kaynağına bağlı tutun
- System Settings -> Energy Saver bölümünde uyku modunu devre dışı bırakın
- Gerekirse `caffeinate` kullanın

Gerçek anlamda sürekli çalışma için özel bir Mac mini veya küçük bir VPS kullanmayı değerlendirin. Bkz. [VPS barındırma](/tr/vps).

## Sorun giderme

| Sorun                            | Çözüm                                                                                                                 |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Sanal makineye SSH ile bağlanılamıyor | Sanal makinenin System Settings bölümünde "Remote Login" seçeneğinin etkin olduğunu denetleyin                    |
| Sanal makine IP'si görünmüyor    | Sanal makinenin tamamen açılmasını bekleyin ve `lume get openclaw` komutunu yeniden çalıştırın                         |
| Lume komutu bulunamıyor          | `~/.local/bin` dizinini PATH'inize ekleyin                                                                             |
| WhatsApp QR kodu taranmıyor      | `openclaw channels login` komutunu çalıştırırken ana sistemde değil, sanal makinede oturum açtığınızdan emin olun      |

## İlgili belgeler

- [VPS barındırma](/tr/vps)
- [Node'lar](/tr/nodes)
- [Uzak Gateway](/tr/gateway/remote)
- [iMessage kanalı](/tr/channels/imessage)
- [Lume hızlı başlangıç](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI başvurusu](https://cua.ai/docs/lume/reference/cli-reference)
- [Gözetimsiz sanal makine kurulumu](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (ileri düzey)
- [Docker korumalı alanı](/tr/install/docker) (alternatif yalıtım yaklaşımı)

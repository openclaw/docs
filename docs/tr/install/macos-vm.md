---
read_when:
    - OpenClaw'u ana macOS ortamınızdan yalıtmak istiyorsunuz
    - Bir sandbox içinde iMessage entegrasyonu istiyorsunuz
    - Klonlayabileceğiniz sıfırlanabilir bir macOS ortamı istiyorsunuz
    - Yerel ve barındırılan macOS VM seçeneklerini karşılaştırmak istiyorsunuz
summary: Yalıtım veya iMessage gerektiğinde OpenClaw'ı korumalı bir macOS VM'de (yerel ya da barındırılan) çalıştırın
title: macOS VM'leri
x-i18n:
    generated_at: "2026-06-28T00:44:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aee2fa0651b711f29d7d092da931bd924bc8ce8a5ca389cf8f189725fa586f3f
    source_path: install/macos-vm.md
    workflow: 16
---

## Önerilen varsayılan (çoğu kullanıcı)

- Her zaman açık bir Gateway ve düşük maliyet için **küçük Linux VPS**. Bkz. [VPS barındırma](/tr/vps).
- Tarayıcı otomasyonu için tam kontrol ve **konut IP'si** istiyorsanız **özel donanım** (Mac mini veya Linux kutusu). Birçok site veri merkezi IP'lerini engeller, bu yüzden yerel tarama genellikle daha iyi çalışır.
- **Hibrit:** Gateway'i ucuz bir VPS üzerinde tutun ve tarayıcı/UI otomasyonuna ihtiyaç duyduğunuzda Mac'inizi bir **node** olarak bağlayın. Bkz. [Nodes](/tr/nodes) ve [Gateway uzaktan](/tr/gateway/remote).

Özellikle iMessage gibi yalnızca macOS'a özgü yeteneklere ihtiyacınız olduğunda veya günlük kullandığınız Mac'ten katı yalıtım istediğinizde macOS VM kullanın.

## macOS VM seçenekleri

### Apple Silicon Mac'inizde yerel VM (Lume)

[Lume](https://cua.ai/docs/lume) kullanarak mevcut Apple Silicon Mac'inizde yalıtılmış bir macOS VM içinde OpenClaw çalıştırın.

Bu size şunları sağlar:

- Yalıtılmış tam macOS ortamı (ana makineniz temiz kalır)
- `imsg` üzerinden iMessage desteği (varsayılan yerel yol Linux/Windows üzerinde mümkün değildir)
- VM'leri klonlayarak anında sıfırlama
- Ek donanım veya bulut maliyeti yok

### Barındırılan Mac sağlayıcıları (bulut)

Bulutta macOS istiyorsanız, barındırılan Mac sağlayıcıları da çalışır:

- [MacStadium](https://www.macstadium.com/) (barındırılan Mac'ler)
- Diğer barındırılan Mac satıcıları da çalışır; onların VM + SSH belgelerini izleyin

Bir macOS VM'ye SSH erişiminiz olduğunda aşağıdaki 6. adımdan devam edin.

---

## Hızlı yol (Lume, deneyimli kullanıcılar)

1. Lume'u yükleyin
2. `lume create openclaw --os macos --ipsw latest`
3. Setup Assistant'ı tamamlayın, Remote Login'i (SSH) etkinleştirin
4. `lume run openclaw --no-display`
5. SSH ile bağlanın, OpenClaw'ı yükleyin, kanalları yapılandırın
6. Bitti

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

Bu, macOS'u indirir ve VM'yi oluşturur. Bir VNC penceresi otomatik olarak açılır.

<Note>
İndirme, bağlantınıza bağlı olarak biraz zaman alabilir.
</Note>

---

## 3) Setup Assistant'ı tamamlayın

VNC penceresinde:

1. Dil ve bölge seçin
2. Apple ID'yi atlayın (veya daha sonra iMessage istiyorsanız oturum açın)
3. Bir kullanıcı hesabı oluşturun (kullanıcı adını ve parolayı unutmayın)
4. Tüm isteğe bağlı özellikleri atlayın

Kurulum tamamlandıktan sonra:

1. SSH'yi etkinleştirin: System Settings -> General -> Sharing'i açın ve "Remote Login"i etkinleştirin.
2. Başsız VM kullanımı için otomatik oturum açmayı etkinleştirin: System Settings -> Users & Groups'u açın, "Automatically log in as:" öğesini seçin ve VM kullanıcısını seçin.

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

## 6) OpenClaw'ı yükleyin

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

VM'yi durdurun ve görüntüsüz yeniden başlatın:

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM arka planda çalışır. OpenClaw'ın daemon'u gateway'i çalışır tutar.

Durumu kontrol etmek için:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Bonus: iMessage entegrasyonu

Bu, macOS üzerinde çalıştırmanın en güçlü özelliğidir. Messages'ı OpenClaw'a eklemek için `imsg` ile [iMessage](/tr/channels/imessage) kullanın.

VM içinde:

1. Messages'a giriş yapın.
2. `imsg` yükleyin.
3. OpenClaw/`imsg` çalıştıran süreç için Full Disk Access ve Automation izni verin.
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

Gateway'i yeniden başlatın. Artık ajanınız iMessage gönderebilir ve alabilir.

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

VM'yi çalışır tutmak için:

- Mac'inizi prize takılı tutun
- System Settings → Energy Saver'da uyku modunu devre dışı bırakın
- Gerekirse `caffeinate` kullanın

Gerçek anlamda her zaman açık kullanım için özel bir Mac mini veya küçük bir VPS düşünün. Bkz. [VPS barındırma](/tr/vps).

---

## Sorun giderme

| Sorun                    | Çözüm                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| VM'ye SSH yapılamıyor    | VM'nin System Settings bölümünde "Remote Login"in etkin olduğundan emin olun                    |
| VM IP'si görünmüyor      | VM'nin tamamen açılmasını bekleyin, `lume get openclaw` komutunu tekrar çalıştırın              |
| Lume komutu bulunamadı   | `~/.local/bin` dizinini PATH'inize ekleyin                                                      |
| WhatsApp QR taranmıyor   | `openclaw channels login` çalıştırırken VM'de (ana makinede değil) oturum açtığınızdan emin olun |

---

## İlgili belgeler

- [VPS barındırma](/tr/vps)
- [Nodes](/tr/nodes)
- [Gateway uzaktan](/tr/gateway/remote)
- [iMessage kanalı](/tr/channels/imessage)
- [Lume Hızlı Başlangıç](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI Referansı](https://cua.ai/docs/lume/reference/cli-reference)
- [Katılımsız VM Kurulumu](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (ileri düzey)
- [Docker Sandboxing](/tr/install/docker) (alternatif yalıtım yaklaşımı)

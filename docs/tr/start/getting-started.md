---
read_when:
    - Sıfırdan ilk kurulum
    - Çalışan bir sohbete giden en hızlı yolu istiyorsunuz
summary: OpenClaw’ı dakikalar içinde kurun ve ilk sohbetinizi başlatın.
title: Başlarken
x-i18n:
    generated_at: "2026-05-07T13:26:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 295ce8fd03320027a77a3aef494f785f0fe58e0f57c72ee63f6f9aca68626c20
    source_path: start/getting-started.md
    workflow: 16
---

OpenClaw'ı kurun, ilk kurulum sihirbazını çalıştırın ve AI asistanınızla sohbet edin — tümü
yaklaşık 5 dakika içinde. Sonunda çalışan bir Gateway'e, yapılandırılmış kimlik doğrulamaya
ve çalışan bir sohbet oturumuna sahip olacaksınız.

## Gerekenler

- **Node.js** — Node 24 önerilir (Node 22.16+ da desteklenir)
- Bir model sağlayıcısından **API anahtarı** (Anthropic, OpenAI, Google vb.) — ilk kurulum sihirbazı sizden isteyecek

<Tip>
Node sürümünüzü `node --version` ile kontrol edin.
**Windows kullanıcıları:** hem yerel Windows hem de WSL2 desteklenir. WSL2 daha
kararlıdır ve tam deneyim için önerilir. Bkz. [Windows](/tr/platforms/windows).
Node kurmanız mı gerekiyor? Bkz. [Node kurulumu](/tr/install/node).
</Tip>

## Hızlı kurulum

<Steps>
  <Step title="OpenClaw'ı kur">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Kurulum Betiği Süreci"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    Diğer kurulum yöntemleri (Docker, Nix, npm): [Kurulum](/tr/install).
    </Note>

  </Step>
  <Step title="İlk kurulum sihirbazını çalıştır">
    ```bash
    openclaw onboard --install-daemon
    ```

    Sihirbaz, bir model sağlayıcısı seçme, API anahtarı ayarlama
    ve Gateway'i yapılandırma adımlarında size rehberlik eder. Yaklaşık 2 dakika sürer.

    Tam başvuru için bkz. [İlk kurulum (CLI)](/tr/start/wizard).

  </Step>
  <Step title="Gateway'in çalıştığını doğrula">
    ```bash
    openclaw gateway status
    ```

    Gateway'in 18789 numaralı bağlantı noktasını dinlediğini görmelisiniz.

  </Step>
  <Step title="Panoyu aç">
    ```bash
    openclaw dashboard
    ```

    Bu, Control UI'ı tarayıcınızda açar. Yüklenirse her şey çalışıyor demektir.

  </Step>
  <Step title="İlk mesajınızı gönderin">
    Control UI sohbetine bir mesaj yazın; bir AI yanıtı almalısınız.

    Bunun yerine telefonunuzdan mı sohbet etmek istiyorsunuz? Kurulumu en hızlı kanal
    [Telegram](/tr/channels/telegram)'dır (yalnızca bir bot token'ı). Tüm seçenekler için bkz. [Kanallar](/tr/channels).

  </Step>
</Steps>

<Accordion title="Gelişmiş: özel bir Control UI derlemesi bağlayın">
  Yerelleştirilmiş veya özelleştirilmiş bir pano derlemesini yönetiyorsanız,
  `gateway.controlUi.root` değerini derlenmiş statik varlıklarınızı ve
  `index.html` dosyasını içeren bir dizine yönlendirin.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Derlenmiş statik dosyalarınızı bu dizine kopyalayın.
```

Ardından şunu ayarlayın:

```json
{
  "gateway": {
    "controlUi": {
      "enabled": true,
      "root": "$HOME/.openclaw/control-ui-custom"
    }
  }
}
```

Gateway'i yeniden başlatın ve panoyu yeniden açın:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## Sırada ne var

<Columns>
  <Card title="Bir kanala bağlan" href="/tr/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo ve daha fazlası.
  </Card>
  <Card title="Eşleştirme ve güvenlik" href="/tr/channels/pairing" icon="shield">
    Agent'ınıza kimlerin mesaj gönderebileceğini kontrol edin.
  </Card>
  <Card title="Gateway'i yapılandır" href="/tr/gateway/configuration" icon="settings">
    Modeller, araçlar, sandbox ve gelişmiş ayarlar.
  </Card>
  <Card title="Araçlara göz at" href="/tr/tools" icon="wrench">
    Tarayıcı, exec, web araması, Skills ve Plugin'ler.
  </Card>
</Columns>

<Accordion title="Gelişmiş: ortam değişkenleri">
  OpenClaw'ı bir hizmet hesabı olarak çalıştırıyorsanız veya özel yollar istiyorsanız:

- `OPENCLAW_HOME` — dahili yol çözümlemesi için ana dizin
- `OPENCLAW_STATE_DIR` — durum dizinini geçersiz kıl
- `OPENCLAW_CONFIG_PATH` — yapılandırma dosyası yolunu geçersiz kıl

Tam başvuru: [Ortam değişkenleri](/tr/help/environment).
</Accordion>

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Kanallar genel bakışı](/tr/channels)
- [Kurulum](/tr/start/setup)

---
read_when:
    - İlk kez sıfırdan kurulum
    - Çalışan bir sohbete giden en hızlı yolu istiyorsunuz
summary: OpenClaw'u kurun ve ilk sohbetinizi dakikalar içinde çalıştırın.
title: Başlarken
x-i18n:
    generated_at: "2026-06-28T20:45:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 579ed2b4797dc851b0293b96a4177cc356641b6842fe45c4d48f4e8c224eef75
    source_path: start/getting-started.md
    workflow: 16
---

OpenClaw'u yükleyin, ilk kurulumu çalıştırın ve yapay zeka asistanınızla sohbet edin — hepsi
yaklaşık 5 dakika içinde. Sonunda çalışan bir Gateway'e, yapılandırılmış kimlik doğrulamaya
ve çalışan bir sohbet oturumuna sahip olacaksınız.

## Gerekenler

- **Node.js** — Node 24 önerilir (Node 22.19+ da desteklenir)
- Bir model sağlayıcısından **API anahtarı** (Anthropic, OpenAI, Google vb.) — ilk kurulum sizden isteyecek

<Tip>
Node sürümünüzü `node --version` ile kontrol edin.
**Windows kullanıcıları:** yerel Windows Hub uygulaması en kolay masaüstü yoludur. PowerShell yükleyicisi
ve WSL2 Gateway yolları da desteklenir. Bkz. [Windows](/tr/platforms/windows).
Node yüklemeniz mi gerekiyor? Bkz. [Node kurulumu](/tr/install/node).
</Tip>

## Hızlı kurulum

<Steps>
  <Step title="OpenClaw'u yükleyin">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Yükleme Betiği Süreci"
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
    Diğer yükleme yöntemleri (Docker, Nix, npm): [Yükleme](/tr/install).
    </Note>

  </Step>
  <Step title="İlk kurulumu çalıştırın">
    ```bash
    openclaw onboard --install-daemon
    ```

    Sihirbaz, model sağlayıcısı seçme, API anahtarı ayarlama
    ve Gateway'i yapılandırma adımlarında size rehberlik eder. QuickStart genellikle yalnızca birkaç dakika sürer, ancak
    sağlayıcı oturumu açma, kanal eşleştirme, daemon yükleme, ağ indirmeleri, Skills
    veya isteğe bağlı Plugin'ler tam ilk kurulumun daha uzun sürmesine neden olabilir. İsteğe bağlı
    adımları atlayabilir ve daha sonra `openclaw configure` ile geri dönebilirsiniz.

    Tam başvuru için bkz. [İlk kurulum (CLI)](/tr/start/wizard).

  </Step>
  <Step title="Gateway'in çalıştığını doğrulayın">
    ```bash
    openclaw gateway status
    ```

    Gateway'in 18789 bağlantı noktasını dinlediğini görmelisiniz.

  </Step>
  <Step title="Panoyu açın">
    ```bash
    openclaw dashboard
    ```

    Bu, tarayıcınızda Control UI'ı açar. Yüklenirse her şey çalışıyor demektir.

  </Step>
  <Step title="İlk mesajınızı gönderin">
    Control UI sohbetine bir mesaj yazın; bir yapay zeka yanıtı almalısınız.

    Bunun yerine telefonunuzdan sohbet etmek mi istiyorsunuz? Kurulumu en hızlı kanal
    [Telegram](/tr/channels/telegram) olur (yalnızca bir bot token'ı). Tüm seçenekler için bkz. [Kanallar](/tr/channels).

  </Step>
</Steps>

<Accordion title="Gelişmiş: özel bir Control UI derlemesi bağlayın">
  Yerelleştirilmiş veya özelleştirilmiş bir pano derlemesi yönetiyorsanız,
  `gateway.controlUi.root` değerini derlenmiş statik varlıklarınızı
  ve `index.html` dosyasını içeren bir dizine yönlendirin.

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

## Sonra ne yapmalı

<Columns>
  <Card title="Bir kanal bağlayın" href="/tr/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo ve daha fazlası.
  </Card>
  <Card title="Eşleştirme ve güvenlik" href="/tr/channels/pairing" icon="shield">
    Aracınıza kimlerin mesaj gönderebileceğini denetleyin.
  </Card>
  <Card title="Gateway'i yapılandırın" href="/tr/gateway/configuration" icon="settings">
    Modeller, araçlar, sandbox ve gelişmiş ayarlar.
  </Card>
  <Card title="Araçlara göz atın" href="/tr/tools" icon="wrench">
    Tarayıcı, exec, web araması, Skills ve Plugin'ler.
  </Card>
</Columns>

<Accordion title="Gelişmiş: ortam değişkenleri">
  OpenClaw'u bir hizmet hesabı olarak çalıştırıyorsanız veya özel yollar istiyorsanız:

- `OPENCLAW_HOME` — dahili yol çözümlemesi için ana dizin
- `OPENCLAW_STATE_DIR` — durum dizinini geçersiz kılın
- `OPENCLAW_CONFIG_PATH` — yapılandırma dosyası yolunu geçersiz kılın

Tam başvuru: [Ortam değişkenleri](/tr/help/environment).
</Accordion>

## İlgili

- [Yükleme genel bakışı](/tr/install)
- [Kanallar genel bakışı](/tr/channels)
- [Kurulum](/tr/start/setup)

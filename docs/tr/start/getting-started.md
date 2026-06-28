---
read_when:
    - Sıfırdan ilk kurulum
    - Çalışan bir sohbete giden en hızlı yolu istiyorsunuz
summary: OpenClaw'ı kurun ve ilk sohbetinizi dakikalar içinde başlatın.
title: Başlarken
x-i18n:
    generated_at: "2026-06-28T01:19:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 769682cfa35a361cc4adc49f010fed18cf897ce66e1404d07b631e4dede64de8
    source_path: start/getting-started.md
    workflow: 16
---

OpenClaw’u kurun, ilk kurulumu çalıştırın ve yapay zeka asistanınızla sohbet edin — tümü
yaklaşık 5 dakika içinde. Sonunda çalışan bir Gateway, yapılandırılmış kimlik doğrulama
ve çalışan bir sohbet oturumunuz olacak.

## Gerekenler

- **Node.js** — Node 24 önerilir (Node 22.19+ da desteklenir)
- Bir model sağlayıcısından **API anahtarı** (Anthropic, OpenAI, Google vb.) — ilk kurulum sizden bunu isteyecek

<Tip>
Node sürümünüzü `node --version` ile kontrol edin.
**Windows kullanıcıları:** yerel Windows Hub uygulaması en kolay masaüstü yoludur. PowerShell
kurucusu ve WSL2 Gateway yolları da desteklenir. Bkz. [Windows](/tr/platforms/windows).
Node kurmanız mı gerekiyor? Bkz. [Node kurulumu](/tr/install/node).
</Tip>

## Hızlı kurulum

<Steps>
  <Step title="OpenClaw’u kurun">
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
  <Step title="İlk kurulumu çalıştırın">
    ```bash
    openclaw onboard --install-daemon
    ```

    Sihirbaz, model sağlayıcısı seçme, API anahtarı ayarlama ve Gateway’i
    yapılandırma adımlarında size rehberlik eder. Yaklaşık 2 dakika sürer.

    Tam başvuru için bkz. [İlk kurulum (CLI)](/tr/start/wizard).

  </Step>
  <Step title="Gateway’in çalıştığını doğrulayın">
    ```bash
    openclaw gateway status
    ```

    Gateway’in 18789 numaralı bağlantı noktasını dinlediğini görmelisiniz.

  </Step>
  <Step title="Panoyu açın">
    ```bash
    openclaw dashboard
    ```

    Bu, Control UI’ı tarayıcınızda açar. Yüklenirse her şey çalışıyor demektir.

  </Step>
  <Step title="İlk mesajınızı gönderin">
    Control UI sohbetine bir mesaj yazın; bir yapay zeka yanıtı almalısınız.

    Bunun yerine telefonunuzdan sohbet etmek mi istiyorsunuz? Kurulumu en hızlı kanal
    [Telegram](/tr/channels/telegram) (yalnızca bir bot token’ı). Tüm seçenekler için bkz. [Kanallar](/tr/channels).

  </Step>
</Steps>

<Accordion title="Gelişmiş: özel bir Control UI derlemesi bağlayın">
  Yerelleştirilmiş veya özelleştirilmiş bir pano derlemesi yürütüyorsanız,
  `gateway.controlUi.root` değerini, derlenmiş statik varlıklarınızı ve
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

Gateway’i yeniden başlatın ve panoyu tekrar açın:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## Sonraki adımlar

<Columns>
  <Card title="Bir kanal bağlayın" href="/tr/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo ve daha fazlası.
  </Card>
  <Card title="Eşleştirme ve güvenlik" href="/tr/channels/pairing" icon="shield">
    Aracınıza kimin mesaj gönderebileceğini kontrol edin.
  </Card>
  <Card title="Gateway’i yapılandırın" href="/tr/gateway/configuration" icon="settings">
    Modeller, araçlar, sandbox ve gelişmiş ayarlar.
  </Card>
  <Card title="Araçlara göz atın" href="/tr/tools" icon="wrench">
    Tarayıcı, exec, web araması, skills ve plugins.
  </Card>
</Columns>

<Accordion title="Gelişmiş: ortam değişkenleri">
  OpenClaw’u bir hizmet hesabı olarak çalıştırıyorsanız veya özel yollar istiyorsanız:

- `OPENCLAW_HOME` — dahili yol çözümlemesi için ana dizin
- `OPENCLAW_STATE_DIR` — durum dizinini geçersiz kılar
- `OPENCLAW_CONFIG_PATH` — yapılandırma dosyası yolunu geçersiz kılar

Tam başvuru: [Ortam değişkenleri](/tr/help/environment).
</Accordion>

## İlgili

- [Kurulum özeti](/tr/install)
- [Kanallara genel bakış](/tr/channels)
- [Kurulum](/tr/start/setup)

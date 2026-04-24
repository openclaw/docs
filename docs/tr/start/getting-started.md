---
read_when:
    - Sıfırdan ilk kurulum
    - Çalışan bir sohbete giden en hızlı yolu istiyorsunuz
summary: OpenClaw'ı kurun ve ilk sohbetinizi dakikalar içinde başlatın.
title: Başlarken
x-i18n:
    generated_at: "2026-04-24T09:31:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe3f92b1464ebf0a5b631c293fa4a3e4b686fdb35c1152663428025dd3c01259
    source_path: start/getting-started.md
    workflow: 15
---

OpenClaw'ı kurun, onboarding'i çalıştırın ve AI asistanınızla sohbet edin — hepsi yaklaşık
5 dakika içinde. Sonunda çalışan bir Gateway, yapılandırılmış kimlik doğrulama
ve çalışan bir sohbet oturumunuz olacak.

## İhtiyacınız olanlar

- **Node.js** — Node 24 önerilir (Node 22.14+ da desteklenir)
- Bir model sağlayıcısından **API key** (Anthropic, OpenAI, Google vb.) — onboarding sizden isteyecektir

<Tip>
Node sürümünüzü `node --version` ile denetleyin.
**Windows kullanıcıları:** hem yerel Windows hem de WSL2 desteklenir. WSL2 daha
kararlıdır ve tam deneyim için önerilir. Bkz. [Windows](/tr/platforms/windows).
Node kurmanız mı gerekiyor? Bkz. [Node setup](/tr/install/node).
</Tip>

## Hızlı kurulum

<Steps>
  <Step title="OpenClaw'ı kurun">
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
  <Step title="Onboarding'i çalıştırın">
    ```bash
    openclaw onboard --install-daemon
    ```

    Sihirbaz; model sağlayıcı seçme, API key ayarlama
    ve Gateway yapılandırma adımlarında size rehberlik eder. Yaklaşık 2 dakika sürer.

    Tam başvuru için bkz. [Onboarding (CLI)](/tr/start/wizard).

  </Step>
  <Step title="Gateway'in çalıştığını doğrulayın">
    ```bash
    openclaw gateway status
    ```

    Gateway'in 18789 portunda dinlediğini görmelisiniz.

  </Step>
  <Step title="Panoyu açın">
    ```bash
    openclaw dashboard
    ```

    Bu, tarayıcınızda Control UI'yı açar. Yüklenirse her şey çalışıyordur.

  </Step>
  <Step title="İlk mesajınızı gönderin">
    Control UI sohbetine bir mesaj yazın; AI yanıtı almalısınız.

    Bunun yerine telefonunuzdan mı sohbet etmek istiyorsunuz? Kurulumu en hızlı kanal
    [Telegram](/tr/channels/telegram) olur (yalnızca bir bot token gerekir). Tüm seçenekler için [Channels](/tr/channels)
    bölümüne bakın.

  </Step>
</Steps>

<Accordion title="Gelişmiş: özel bir Control UI derlemesi bağlayın">
  Yerelleştirilmiş veya özelleştirilmiş bir pano derlemesi yönetiyorsanız,
  `gateway.controlUi.root` değerini derlenmiş statik
  varlıklarınızı ve `index.html` dosyanızı içeren bir dizine yönlendirin.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Derlenmiş statik dosyalarınızı bu dizine kopyalayın.
```

Sonra şunu ayarlayın:

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

## Sonraki adımda ne yapılmalı

<Columns>
  <Card title="Bir kanal bağlayın" href="/tr/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo ve daha fazlası.
  </Card>
  <Card title="Eşleme ve güvenlik" href="/tr/channels/pairing" icon="shield">
    Ajanınıza kimlerin mesaj gönderebileceğini denetleyin.
  </Card>
  <Card title="Gateway'i yapılandırın" href="/tr/gateway/configuration" icon="settings">
    Modeller, araçlar, sandbox ve gelişmiş ayarlar.
  </Card>
  <Card title="Araçlara göz atın" href="/tr/tools" icon="wrench">
    Tarayıcı, exec, web araması, Skills ve Plugin'ler.
  </Card>
</Columns>

<Accordion title="Gelişmiş: ortam değişkenleri">
  OpenClaw'ı bir hizmet hesabı olarak çalıştırıyorsanız veya özel yollar istiyorsanız:

- `OPENCLAW_HOME` — iç yol çözümlemesi için ana dizin
- `OPENCLAW_STATE_DIR` — durum dizinini geçersiz kılar
- `OPENCLAW_CONFIG_PATH` — yapılandırma dosyası yolunu geçersiz kılar

Tam başvuru: [Ortam değişkenleri](/tr/help/environment).
</Accordion>

## İlgili

- [Kuruluma genel bakış](/tr/install)
- [Kanallara genel bakış](/tr/channels)
- [Kurulum](/tr/start/setup)

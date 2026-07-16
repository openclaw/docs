---
read_when:
    - Sıfırdan ilk kurulum
    - Çalışan bir sohbete ulaşmanın en hızlı yolunu istiyorsunuz
summary: OpenClaw'u kurun ve ilk sohbetinizi dakikalar içinde başlatın.
title: Başlarken
x-i18n:
    generated_at: "2026-07-16T17:44:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f50073b059477636b94e128cec90b41dcc21c8bb132e34900e68409cacf70eb
    source_path: start/getting-started.md
    workflow: 16
---

OpenClaw'u yükleyin, ilk kurulumu çalıştırın ve yaklaşık 5 dakika içinde yapay zekâ asistanınızla sohbet edin. İşlemin sonunda çalışan bir Gateway'e, yapılandırılmış kimlik doğrulamaya ve çalışan bir sohbet oturumuna sahip olacaksınız.

## Gereksinimler

- **Node.js 22.22.3+, 24.15+ veya 25.9+** (önerilen varsayılan sürüm 24'tür)
- Bir model sağlayıcısından (Anthropic, OpenAI, Google vb.) alınmış **bir API anahtarı** — ilk kurulum sırasında bu anahtarı girmeniz istenir

<Tip>
Node sürümünüzü `node --version` ile kontrol edin.
**Windows kullanıcıları:** Yerel Windows Hub uygulaması, masaüstü için en kolay seçenektir. PowerShell yükleyicisi ve WSL2 Gateway seçenekleri de desteklenir. Bkz. [Windows](/tr/platforms/windows).
Node'u yüklemeniz mi gerekiyor? Bkz. [Node kurulumu](/tr/install/node).
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

    Sihirbaz; bir model sağlayıcısı seçme, API anahtarı belirleme ve Gateway'i yapılandırma adımlarında size rehberlik eder. QuickStart genellikle yalnızca birkaç dakika sürer ancak sağlayıcıda oturum açma, kanal eşleştirme, daemon yükleme, ağ indirmeleri, Skills veya isteğe bağlı pluginler tam ilk kurulumun daha uzun sürmesine neden olabilir. İsteğe bağlı adımları atlayıp daha sonra `openclaw configure` ile geri dönebilirsiniz.

    Tam başvuru için bkz. [İlk kurulum (CLI)](/tr/start/wizard).

  </Step>
  <Step title="Gateway'in çalıştığını doğrulayın">
    ```bash
    openclaw gateway status
    ```

    Gateway'in 18789 numaralı bağlantı noktasını dinlediğini görmelisiniz.

  </Step>
  <Step title="Panoyu açın">
    ```bash
    openclaw dashboard
    ```

    Bu komut, tarayıcınızda Control UI'ı açar. Sayfa yüklenirse her şey çalışıyor demektir.

  </Step>
  <Step title="İlk mesajınızı gönderin">
    Control UI sohbetine bir mesaj yazdığınızda yapay zekâdan yanıt almanız gerekir.

    Bunun yerine telefonunuzdan mı sohbet etmek istiyorsunuz? Kurulumu en hızlı kanal
    [Telegram](/tr/channels/telegram) seçeneğidir (yalnızca bir bot tokeni gerekir). Tüm seçenekler için bkz. [Kanallar](/tr/channels).

  </Step>
</Steps>

<Accordion title="Gelişmiş: özel bir Control UI derlemesi bağlama">
  Yerelleştirilmiş veya özelleştirilmiş bir pano derlemesinin bakımını yapıyorsanız
  `gateway.controlUi.root` değerini, derlenmiş statik varlıklarınızı ve
  `index.html` öğesini içeren bir dizine yönlendirin.

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

Gateway'i yeniden başlatıp panoyu yeniden açın:

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
    Agentınıza kimlerin mesaj gönderebileceğini denetleyin.
  </Card>
  <Card title="Gateway'i yapılandırın" href="/tr/gateway/configuration" icon="settings">
    Modeller, araçlar, korumalı alan ve gelişmiş ayarlar.
  </Card>
  <Card title="Araçlara göz atın" href="/tr/tools" icon="wrench">
    Tarayıcı, yürütme, web araması, Skills ve pluginler.
  </Card>
</Columns>

<Accordion title="Gelişmiş: ortam değişkenleri">
  OpenClaw'u bir hizmet hesabıyla çalıştırıyorsanız veya özel yollar kullanmak istiyorsanız:

- `OPENCLAW_HOME` — dahili yol çözümlemesi için ana dizin
- `OPENCLAW_STATE_DIR` — durum dizinini geçersiz kılar
- `OPENCLAW_CONFIG_PATH` — yapılandırma dosyasının yolunu geçersiz kılar

Tam başvuru: [Ortam değişkenleri](/tr/help/environment).
</Accordion>

## İlgili içerikler

- [Yüklemeye genel bakış](/tr/install)
- [Kanallara genel bakış](/tr/channels)
- [Kurulum](/tr/start/setup)

---
read_when:
    - Sıfırdan ilk kurulum
    - Çalışan bir sohbete ulaşmanın en hızlı yolunu istiyorsunuz
summary: OpenClaw'ı kurun ve dakikalar içinde ilk sohbetinizi başlatın.
title: Başlarken
x-i18n:
    generated_at: "2026-07-12T12:45:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 308ca58b8a11832b5a4c0d4634d1c88ef44681ef755a18d675bcff60b5aba929
    source_path: start/getting-started.md
    workflow: 16
---

OpenClaw'u yükleyin, ilk kurulumu çalıştırın ve yaklaşık 5 dakika içinde yapay zekâ asistanınızla sohbet edin. İşlemin sonunda çalışan bir Gateway'e, yapılandırılmış kimlik doğrulamaya ve çalışan bir sohbet oturumuna sahip olacaksınız.

## Gereksinimler

- **Node.js 22.19+, 23.11+ veya 24+** (önerilen varsayılan sürüm 24'tür)
- Bir model sağlayıcısından (Anthropic, OpenAI, Google vb.) **API anahtarı** — ilk kurulum sırasında sizden istenir

<Tip>
Node sürümünüzü `node --version` ile kontrol edin.
**Windows kullanıcıları:** yerel Windows Hub uygulaması, masaüstü için en kolay yöntemdir. PowerShell yükleyicisi ve WSL2 Gateway yöntemleri de desteklenir. Bkz. [Windows](/tr/platforms/windows).
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

    Sihirbaz; model sağlayıcısı seçme, API anahtarı ayarlama ve Gateway'i yapılandırma işlemlerinde size rehberlik eder. Hızlı Başlangıç genellikle yalnızca birkaç dakika sürer ancak sağlayıcıda oturum açma, kanal eşleştirme, arka plan hizmetini yükleme, ağ indirmeleri, Skills veya isteğe bağlı Plugin'ler tam ilk kurulumun daha uzun sürmesine neden olabilir. İsteğe bağlı adımları atlayıp daha sonra `openclaw configure` ile geri dönebilirsiniz.

    Tam başvuru için [İlk kurulum (CLI)](/tr/start/wizard) sayfasına bakın.

  </Step>
  <Step title="Gateway'in çalıştığını doğrulayın">
    ```bash
    openclaw gateway status
    ```

    Gateway'in 18789 numaralı bağlantı noktasında dinlediğini görmelisiniz.

  </Step>
  <Step title="Kontrol panelini açın">
    ```bash
    openclaw dashboard
    ```

    Bu komut, tarayıcınızda Denetim Arayüzü'nü açar. Yükleniyorsa her şey çalışıyor demektir.

  </Step>
  <Step title="İlk mesajınızı gönderin">
    Denetim Arayüzü sohbetine bir mesaj yazdığınızda yapay zekâdan yanıt almalısınız.

    Bunun yerine telefonunuzdan mı sohbet etmek istiyorsunuz? Kurulumu en hızlı kanal [Telegram](/tr/channels/telegram) kanalıdır (yalnızca bir bot belirteci gerekir). Tüm seçenekler için [Kanallar](/tr/channels) sayfasına bakın.

  </Step>
</Steps>

<Accordion title="Gelişmiş: özel bir Denetim Arayüzü derlemesi bağlayın">
  Yerelleştirilmiş veya özelleştirilmiş bir kontrol paneli derlemesinin bakımını yapıyorsanız `gateway.controlUi.root` değerini, derlenmiş statik varlıklarınızı ve `index.html` dosyasını içeren bir dizine yönlendirin.

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

Gateway'i yeniden başlatın ve kontrol panelini tekrar açın:

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
    Aracınıza kimlerin mesaj gönderebileceğini denetleyin.
  </Card>
  <Card title="Gateway'i yapılandırın" href="/tr/gateway/configuration" icon="settings">
    Modeller, araçlar, korumalı alan ve gelişmiş ayarlar.
  </Card>
  <Card title="Araçlara göz atın" href="/tr/tools" icon="wrench">
    Tarayıcı, çalıştırma, web araması, Skills ve Plugin'ler.
  </Card>
</Columns>

<Accordion title="Gelişmiş: ortam değişkenleri">
  OpenClaw'u bir hizmet hesabı olarak çalıştırıyorsanız veya özel yollar kullanmak istiyorsanız:

- `OPENCLAW_HOME` — dahili yol çözümlemesi için ana dizin
- `OPENCLAW_STATE_DIR` — durum dizinini geçersiz kılar
- `OPENCLAW_CONFIG_PATH` — yapılandırma dosyası yolunu geçersiz kılar

Tam başvuru: [Ortam değişkenleri](/tr/help/environment).
</Accordion>

## İlgili içerikler

- [Yüklemeye genel bakış](/tr/install)
- [Kanallara genel bakış](/tr/channels)
- [Kurulum](/tr/start/setup)

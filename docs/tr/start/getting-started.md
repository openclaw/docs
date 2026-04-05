---
read_when:
    - Sıfırdan ilk kurulum
    - Çalışan bir sohbete giden en hızlı yolu istiyorsunuz
summary: OpenClaw'ı kurun ve ilk sohbetinizi dakikalar içinde başlatın.
title: Başlangıç
x-i18n:
    generated_at: "2026-04-05T14:08:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: c43eee6f0d3f593e3cf0767bfacb3e0ae38f51a2615d594303786ae1d4a6d2c3
    source_path: start/getting-started.md
    workflow: 15
---

# Başlangıç

OpenClaw'ı kurun, onboarding'i çalıştırın ve AI asistanınızla sohbet edin — hepsi
yaklaşık 5 dakika içinde. Sonunda çalışan bir Gateway, yapılandırılmış kimlik doğrulama
ve çalışan bir sohbet oturumunuz olacak.

## Gerekenler

- **Node.js** — Node 24 önerilir (Node 22.14+ da desteklenir)
- Bir model sağlayıcısından **API anahtarı** (Anthropic, OpenAI, Google vb.) — onboarding sizden bunu isteyecektir

<Tip>
Node sürümünüzü `node --version` ile kontrol edin.
**Windows kullanıcıları:** hem yerel Windows hem de WSL2 desteklenir. WSL2 daha
kararlıdır ve tam deneyim için önerilir. Bkz. [Windows](/tr/platforms/windows).
Node kurmanız mı gerekiyor? Bkz. [Node kurulumu](/tr/install/node).
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

    Sihirbaz; model sağlayıcısı seçme, API anahtarı ayarlama
    ve Gateway yapılandırma adımlarında size yol gösterir. Yaklaşık 2 dakika sürer.

    Tam başvuru için bkz. [Onboarding (CLI)](/start/wizard).

  </Step>
  <Step title="Gateway'in çalıştığını doğrulayın">
    ```bash
    openclaw gateway status
    ```

    Gateway'in 18789 portunda dinlediğini görmelisiniz.

  </Step>
  <Step title="Kontrol panelini açın">
    ```bash
    openclaw dashboard
    ```

    Bu, tarayıcınızda Control UI'ı açar. Yükleniyorsa her şey çalışıyor demektir.

  </Step>
  <Step title="İlk mesajınızı gönderin">
    Control UI sohbetinde bir mesaj yazın; bir AI yanıtı almalısınız.

    Bunun yerine telefonunuzdan mı sohbet etmek istiyorsunuz? Kurulumu en hızlı olan kanal
    [Telegram](/tr/channels/telegram)'dır (yalnızca bir bot token gerekir). Tüm seçenekler
    için bkz. [Kanallar](/tr/channels).

  </Step>
</Steps>

<Accordion title="Gelişmiş: özel bir Control UI yapısını bağlayın">
  Yerelleştirilmiş veya özelleştirilmiş bir gösterge paneli yapısını yönetiyorsanız,
  `gateway.controlUi.root` değerini derlenmiş statik varlıklarınızı ve `index.html`
  dosyanızı içeren bir dizine yönlendirin.

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

## Sırada ne var

<Columns>
  <Card title="Bir kanal bağlayın" href="/tr/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo ve daha fazlası.
  </Card>
  <Card title="Eşleştirme ve güvenlik" href="/tr/channels/pairing" icon="shield">
    Ajanınıza kimin mesaj gönderebileceğini denetleyin.
  </Card>
  <Card title="Gateway'i yapılandırın" href="/tr/gateway/configuration" icon="settings">
    Modeller, araçlar, sandbox ve gelişmiş ayarlar.
  </Card>
  <Card title="Araçlara göz atın" href="/tools" icon="wrench">
    Tarayıcı, exec, web araması, skills ve plugin'ler.
  </Card>
</Columns>

<Accordion title="Gelişmiş: ortam değişkenleri">
  OpenClaw'ı bir hizmet hesabı olarak çalıştırıyorsanız veya özel yollar istiyorsanız:

- `OPENCLAW_HOME` — dahili yol çözümleme için ana dizin
- `OPENCLAW_STATE_DIR` — durum dizinini geçersiz kılar
- `OPENCLAW_CONFIG_PATH` — config dosyası yolunu geçersiz kılar

Tam başvuru: [Ortam değişkenleri](/tr/help/environment).
</Accordion>

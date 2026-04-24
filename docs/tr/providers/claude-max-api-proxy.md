---
read_when:
    - Claude Max aboneliğini OpenAI uyumlu araçlarla kullanmak istiyorsunuz
    - Claude Code CLI'yi saran yerel bir API sunucusu istiyorsunuz
    - Abonelik tabanlı ve API anahtarı tabanlı Anthropic erişimini değerlendirmek istiyorsunuz
summary: Claude subscription kimlik bilgilerini OpenAI uyumlu bir uç nokta olarak açığa çıkaran topluluk proxy'si
title: Claude Max API proxy'si
x-i18n:
    generated_at: "2026-04-24T09:25:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06c685c2f42f462a319ef404e4980f769e00654afb9637d873b98144e6a41c87
    source_path: providers/claude-max-api-proxy.md
    workflow: 15
---

**claude-max-api-proxy**, Claude Max/Pro aboneliğinizi OpenAI uyumlu bir API uç noktası olarak açığa çıkaran topluluk yapımı bir araçtır. Bu, OpenAI API biçimini destekleyen herhangi bir araçla aboneliğinizi kullanmanıza olanak tanır.

<Warning>
Bu yol yalnızca teknik uyumluluk içindir. Anthropic geçmişte bazı abonelik
kullanımlarını Claude Code dışındaki yerlerde engellemiştir. Bunu kullanıp kullanmamaya
kendiniz karar vermeli ve buna güvenmeden önce Anthropic'in güncel koşullarını doğrulamalısınız.
</Warning>

## Bunu neden kullanmalı?

| Yaklaşım                | Maliyet                                              | En uygun olduğu kullanım                     |
| ----------------------- | ---------------------------------------------------- | -------------------------------------------- |
| Anthropic API           | Belirteç başına ödeme (~Opus için girişte $15/M, çıkışta $75/M) | Üretim uygulamaları, yüksek hacim            |
| Claude Max aboneliği    | Aylık sabit $200                                     | Kişisel kullanım, geliştirme, sınırsız kullanım |

Claude Max aboneliğiniz varsa ve bunu OpenAI uyumlu araçlarla kullanmak istiyorsanız, bu proxy bazı iş akışlarında maliyeti azaltabilir. Üretimde kullanım için API anahtarları daha net ilke yoludur.

## Nasıl çalışır

```
Uygulamanız → claude-max-api-proxy → Claude Code CLI → Anthropic (abonelik üzerinden)
   (OpenAI biçimi)                  (biçimi dönüştürür)      (oturumunuzu kullanır)
```

Bu proxy:

1. `http://localhost:3456/v1/chat/completions` adresinde OpenAI biçimindeki istekleri kabul eder
2. Bunları Claude Code CLI komutlarına dönüştürür
3. Yanıtları OpenAI biçiminde döndürür (akış desteklenir)

## Başlangıç

<Steps>
  <Step title="Proxy'yi kurun">
    Node.js 20+ ve Claude Code CLI gerektirir.

    ```bash
    npm install -g claude-max-api-proxy

    # Claude CLI'nin kimlik doğrulamasının yapıldığını doğrulayın
    claude --version
    ```

  </Step>
  <Step title="Sunucuyu başlatın">
    ```bash
    claude-max-api
    # Sunucu http://localhost:3456 adresinde çalışır
    ```
  </Step>
  <Step title="Proxy'yi test edin">
    ```bash
    # Sağlık denetimi
    curl http://localhost:3456/health

    # Modelleri listele
    curl http://localhost:3456/v1/models

    # Sohbet tamamlama
    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="OpenClaw'ı yapılandırın">
    OpenClaw'ı özel OpenAI uyumlu bir uç nokta olarak proxy'ye yönlendirin:

    ```json5
    {
      env: {
        OPENAI_API_KEY: "not-needed",
        OPENAI_BASE_URL: "http://localhost:3456/v1",
      },
      agents: {
        defaults: {
          model: { primary: "openai/claude-opus-4" },
        },
      },
    }
    ```

  </Step>
</Steps>

## Yerleşik katalog

| Model Kimliği      | Eşlendiği şey   |
| ------------------ | --------------- |
| `claude-opus-4`    | Claude Opus 4   |
| `claude-sonnet-4`  | Claude Sonnet 4 |
| `claude-haiku-4`   | Claude Haiku 4  |

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Proxy tarzı OpenAI uyumlu notlar">
    Bu yol, diğer özel
    `/v1` arka uçlarıyla aynı proxy tarzı OpenAI uyumlu rotayı kullanır:

    - Yerel yalnızca OpenAI istek şekillendirmesi uygulanmaz
    - `service_tier` yok, Responses `store` yok, istem önbelleği ipuçları yok ve
      OpenAI muhakeme uyumluluğu payload şekillendirmesi yok
    - Gizli OpenClaw atıf başlıkları (`originator`, `version`, `User-Agent`)
      proxy URL'sine enjekte edilmez

  </Accordion>

  <Accordion title="macOS'ta LaunchAgent ile otomatik başlatma">
    Proxy'yi otomatik çalıştırmak için bir LaunchAgent oluşturun:

    ```bash
    cat > ~/Library/LaunchAgents/com.claude-max-api.plist << 'EOF'
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
      <key>Label</key>
      <string>com.claude-max-api</string>
      <key>RunAtLoad</key>
      <true/>
      <key>KeepAlive</key>
      <true/>
      <key>ProgramArguments</key>
      <array>
        <string>/usr/local/bin/node</string>
        <string>/usr/local/lib/node_modules/claude-max-api-proxy/dist/server/standalone.js</string>
      </array>
      <key>EnvironmentVariables</key>
      <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/opt/homebrew/bin:~/.local/bin:/usr/bin:/bin</string>
      </dict>
    </dict>
    </plist>
    EOF

    launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude-max-api.plist
    ```

  </Accordion>
</AccordionGroup>

## Bağlantılar

- **npm:** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub:** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **Sorunlar:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## Notlar

- Bu bir **topluluk aracı**dır; Anthropic veya OpenClaw tarafından resmi olarak desteklenmez
- Claude Code CLI kimlik doğrulaması yapılmış etkin bir Claude Max/Pro aboneliği gerektirir
- Proxy yerelde çalışır ve verileri herhangi bir üçüncü taraf sunucuya göndermez
- Akışlı yanıtlar tam olarak desteklenir

<Note>
Claude CLI veya API anahtarlarıyla yerel Anthropic entegrasyonu için bkz. [Anthropic provider](/tr/providers/anthropic). OpenAI/Codex abonelikleri için bkz. [OpenAI provider](/tr/providers/openai).
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Anthropic sağlayıcısı" href="/tr/providers/anthropic" icon="bolt">
    Claude CLI veya API anahtarlarıyla yerel OpenClaw entegrasyonu.
  </Card>
  <Card title="OpenAI sağlayıcısı" href="/tr/providers/openai" icon="robot">
    OpenAI/Codex abonelikleri için.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Tüm sağlayıcılar, model başvuruları ve yük devretme davranışına genel bakış.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    Tam yapılandırma başvurusu.
  </Card>
</CardGroup>

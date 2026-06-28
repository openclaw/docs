---
read_when:
    - Claude Max aboneliğini OpenAI uyumlu araçlarla kullanmak istiyorsunuz
    - Claude Code CLI'yi sarmalayan yerel bir API sunucusu istiyorsunuz
    - Abonelik tabanlı ve API anahtarı tabanlı Anthropic erişimini değerlendirmek istiyorsunuz
summary: Claude abonelik kimlik bilgilerini OpenAI uyumlu bir uç nokta olarak kullanıma sunan topluluk proxy'si
title: Claude Max API ara sunucusu
x-i18n:
    generated_at: "2026-06-28T01:09:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24bd2b4b56e4b8829e67f248d0e0a6bad53ccbd9ce98ee288bfa4de93508ef27
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy**, Claude Max/Pro aboneliğinizi OpenAI uyumlu bir API uç noktası olarak sunan bir topluluk aracıdır. Bu, aboneliğinizi OpenAI API biçimini destekleyen herhangi bir araçla kullanmanıza olanak tanır.

<Warning>
Bu yol yalnızca teknik uyumluluk içindir. Anthropic geçmişte Claude Code dışındaki bazı abonelik
kullanımlarını engellemiştir. Bunu kullanıp kullanmayacağınıza kendiniz karar vermeli
ve buna güvenmeden önce Anthropic'in güncel faturalandırma kurallarını doğrulamalısınız.

Anthropic'in güncel destek belgeleri, `claude -p` kullanımının Agent SDK/programlı kullanım olduğunu söylüyor.
15 Haziran 2026'dan itibaren abonelik planı kapsamındaki `claude -p` kullanımı önce ayrı bir
aylık Agent SDK kredisinden, ardından kullanım kredileri etkinleştirilmişse standart API ücretleri üzerinden
kullanım kredilerinden düşer.
</Warning>

## Bunu neden kullanmalısınız?

| Yaklaşım                  | Maliyet yolu                                             | En uygun olduğu durumlar                                  |
| ------------------------- | -------------------------------------------------------- | --------------------------------------------------------- |
| Anthropic API             | Claude Console veya bulut üzerinden token başına ödeme   | Üretim uygulamaları, paylaşılan otomasyon, hacimli kullanım |
| Claude abonelik proxy'si  | Claude Code / `claude -p` planı ve kredi kuralları       | Uyumlu araçlarla kişisel deneyler                         |

Claude Max veya Pro aboneliğiniz varsa ve bunu
OpenAI uyumlu araçlarla kullanmak istiyorsanız, bu proxy bazı kişisel iş akışlarına uygun olabilir. Bu,
sınırsız sabit ücretli bir yol değildir. API anahtarları, üretim kullanımı için daha net ilke ve faturalandırma yolu olmaya devam eder.

## Nasıl çalışır?

```
Your App → claude-max-api-proxy → Claude Code CLI / claude -p → Anthropic
     (OpenAI format)              (converts format)          (uses your login)
```

Proxy:

1. `http://localhost:3456/v1/chat/completions` adresinde OpenAI biçimli istekleri kabul eder
2. Bunları Claude Code CLI komutlarına dönüştürür
3. Yanıtları OpenAI biçiminde döndürür (akış desteklenir)

## Başlarken

<Steps>
  <Step title="Proxy'yi yükleyin">
    Node.js 22+ ve Claude Code CLI gerektirir.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    ```

  </Step>
  <Step title="Sunucuyu başlatın">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="Proxy'yi test edin">
    ```bash
    # Health check
    curl http://localhost:3456/health

    # List models
    curl http://localhost:3456/v1/models

    # Chat completion
    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="OpenClaw'ı yapılandırın">
    OpenClaw'ı özel bir OpenAI uyumlu uç nokta olarak proxy'ye yönlendirin:

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

| Model Kimliği     | Şuna Eşlenir    |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Proxy tarzı OpenAI uyumlu notlar">
    Bu yol, diğer özel
    `/v1` arka uçlarıyla aynı proxy tarzı OpenAI uyumlu rotayı kullanır:

    - Yerel yalnızca OpenAI istek şekillendirmesi uygulanmaz
    - `service_tier` yoktur, Responses `store` yoktur, prompt-cache ipuçları yoktur ve
      OpenAI reasoning uyumluluk yükü şekillendirmesi yoktur
    - Gizli OpenClaw atıf başlıkları (`originator`, `version`, `User-Agent`)
      proxy URL'sine enjekte edilmez

  </Accordion>

  <Accordion title="LaunchAgent ile macOS'te otomatik başlatma">
    Proxy'yi otomatik olarak çalıştırmak için bir LaunchAgent oluşturun:

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

## Notlar

- Bu, Anthropic veya OpenClaw tarafından resmi olarak desteklenmeyen bir **topluluk aracıdır**
- Claude Code CLI ile kimliği doğrulanmış etkin bir Claude Max/Pro aboneliği gerektirir
- Claude Code `claude -p` faturalandırma, kullanım kredisi ve hız sınırı davranışını devralır
- Proxy yerel olarak çalışır ve verileri herhangi bir üçüncü taraf sunucuya göndermez
- Akış yanıtları tamamen desteklenir

<Note>
Claude CLI veya API anahtarlarıyla yerel Anthropic entegrasyonu için bkz. [Anthropic provider](/tr/providers/anthropic). OpenAI/Codex abonelikleri için bkz. [OpenAI provider](/tr/providers/openai).
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Anthropic sağlayıcı" href="/tr/providers/anthropic" icon="bolt">
    Claude CLI veya API anahtarlarıyla yerel OpenClaw entegrasyonu.
  </Card>
  <Card title="OpenAI sağlayıcı" href="/tr/providers/openai" icon="robot">
    OpenAI/Codex abonelikleri için.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Tüm sağlayıcılar, model referansları ve yük devretme davranışına genel bakış.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    Tam yapılandırma referansı.
  </Card>
</CardGroup>

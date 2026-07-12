---
read_when:
    - Claude Max aboneliğini OpenAI uyumlu araçlarla kullanmak istiyorsunuz
    - Claude Code CLI'yi sarmalayan yerel bir API sunucusu istiyorsunuz
    - Abonelik tabanlı Anthropic erişimini API anahtarı tabanlı erişimle karşılaştırmak istiyorsunuz
summary: Claude abonelik kimlik bilgilerini OpenAI uyumlu bir uç nokta olarak sunan topluluk proxy'si
title: Claude Max API proxy'si
x-i18n:
    generated_at: "2026-07-12T12:41:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d0d9a70e14d7d444e57e9bcf169816fec4013a2680dfc9b1761e6ab32109e9f
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy**, bir Claude Max/Pro aboneliğini OpenAI uyumlu bir API uç noktası olarak sunan bir topluluk npm paketidir (OpenClaw plugini değildir); böylece OpenAI uyumlu herhangi bir aracı Anthropic API anahtarı yerine aboneliğinize yönlendirebilirsiniz.

<Warning>
Yalnızca teknik uyumluluk sağlar; resmî olarak onaylanmış bir yöntem değildir. Anthropic geçmişte Claude Code dışındaki bazı abonelik kullanımlarını engellemiştir; buna güvenmeden önce Anthropic'in güncel faturalandırma kurallarını doğrulayın.

Anthropic'in Claude Code belgeleri, `claude -p` komutunu Agent SDK/programatik kullanım olarak tanımlar. Anthropic'in 15 Haziran 2026 tarihli destek güncellemesi itibarıyla Claude Agent SDK, `claude -p` ve üçüncü taraf uygulama kullanımları, oturum açılmış aboneliğin kullanım sınırlarından düşülür (daha önce duyurulan ayrı Agent SDK kredi planı duraklatılmıştır). Anthropic'in [Agent SDK planı makalesine](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan), [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan) ve [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan) planı makalelerine ve OpenClaw'ın kendi Claude CLI faturalandırma notları için [Anthropic sağlayıcısına](/tr/providers/anthropic) bakın.
</Warning>

## Neden bunu kullanmalısınız?

| Yaklaşım                  | Maliyet yöntemi                                        | En uygun olduğu kullanım                       |
| ------------------------- | ------------------------------------------------------ | ---------------------------------------------- |
| Anthropic API anahtarı    | Claude Console üzerinden belirteç başına ödeme         | Üretim uygulamaları, paylaşılan otomasyon, hacim |
| Claude abonelik proxy'si  | Claude Code / `claude -p` planı ve kredi kuralları     | Uyumlu araçlarla kişisel deneyler               |

Bu proxy, bir Claude Max veya Pro aboneliğinin OpenAI uyumlu araçlarla çalışmasını sağlar. Sınırsız sabit ücretli bir yöntem değildir; Claude Code'un kullanım sınırlarını devralır. Üretim kullanımı için API anahtarları daha anlaşılır bir faturalandırma yöntemi olmaya devam eder.

## Nasıl çalışır?

```text
Uygulamanız -> claude-max-api-proxy -> Claude Code CLI / claude -p -> Anthropic
     (OpenAI biçimi)                 (biçimi dönüştürür)             (oturumunuzu kullanır)
```

Proxy, her istek için Claude Code CLI'yi bir alt süreç olarak başlatır, OpenAI biçimindeki sohbet isteklerini CLI istemlerine dönüştürür ve yanıtı OpenAI biçiminde akışla iletir (veya döndürür).

## Başlarken

<Steps>
  <Step title="Proxy'yi yükleyin">
    Node.js 20+ ve kimliği doğrulanmış bir Claude Code CLI gerektirir.

    ```bash
    npm install -g claude-max-api-proxy

    # Claude CLI kimlik doğrulamasını doğrulayın
    claude --version
    claude auth login   # henüz kimlik doğrulanmadıysa
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
    curl http://localhost:3456/health
    curl http://localhost:3456/v1/models

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

<Note>
Aşağıdaki model kimlikleri, OpenClaw'ın Anthropic model referansları değil, proxy'nin kendi kataloğudur. Her kimlik bir Claude Code CLI model diğer adına (`opus`, `sonnet`, `haiku`) eşlenir; dolayısıyla Anthropic bu diğer adı CLI'de her güncellediğinde temel model değişir. Belirli bir eşlemeye güvenmeden önce proxy'nin güncel README dosyasını kontrol edin.
</Note>

| Model kimliği      | CLI diğer adı | Güncel eşleme     |
| ------------------ | ------------- | ---------------- |
| `claude-opus-4`    | `opus`        | Claude Opus 4.5  |
| `claude-sonnet-4`  | `sonnet`      | Claude Sonnet 4  |
| `claude-haiku-4`   | `haiku`       | Claude Haiku 4   |

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Proxy tarzı OpenAI uyumluluk notları">
    Bu, kendi barındırdığınız diğer tüm OpenAI uyumlu arka uçlarla aynı yol olan OpenClaw'ın genel özel `/v1` OpenAI uyumlu yolunu kullanır:

    - Yalnızca yerel OpenAI için geçerli istek biçimlendirmesi uygulanmaz.
    - `/fast` ve `service_tier` yalnızca doğrudan `api.anthropic.com` trafiğine uygulanır; proxy yolları `service_tier` değerini değiştirmeden bırakır (bkz. [Anthropic sağlayıcısı hızlı modu](/tr/providers/anthropic#advanced-configuration)).
    - Responses `store`, istem önbelleği ipuçları veya OpenAI akıl yürütme uyumluluğu yük biçimlendirmesi yoktur.
    - OpenClaw'ın OpenAI/Codex ilişkilendirme başlıkları (`originator`, `version`, `User-Agent`) yalnızca yerel `api.openai.com` OAuth trafiğinde gönderilir; bu proxy gibi özel `OPENAI_BASE_URL` hedeflerine gönderilmez.

  </Accordion>

  <Accordion title="LaunchAgent ile macOS'ta otomatik başlatma">
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

- Claude Code'un `claude -p` faturalandırma, kullanım kredisi ve hız sınırı davranışını devralır.
- Yalnızca `127.0.0.1` adresine bağlanır; CLI'nin Anthropic'e yaptığı kendi çağrısı dışında hiçbir üçüncü taraf sunucuya veri göndermez.
- Akış yanıtları desteklenir.
- Kimlik doğrulama hataları başlangıçta kontrol edilmez ve yalnızca bir sohbet isteği gerçekten çalıştırıldığında ortaya çıkar; CLI'de kimlik doğrulanmamışsa sunucunun başlatmayı reddetmesi yerine ilk isteğin başarısız olmasını bekleyin.

<Note>
Claude CLI veya API anahtarlarıyla yerel Anthropic entegrasyonu için [Anthropic sağlayıcısına](/tr/providers/anthropic) bakın. OpenAI/Codex abonelikleri için [OpenAI sağlayıcısına](/tr/providers/openai) bakın.
</Note>

## İlgili içerikler

<CardGroup cols={2}>
  <Card title="Anthropic sağlayıcısı" href="/tr/providers/anthropic" icon="bolt">
    Claude CLI veya API anahtarlarıyla yerel OpenClaw entegrasyonu.
  </Card>
  <Card title="OpenAI sağlayıcısı" href="/tr/providers/openai" icon="robot">
    OpenAI/Codex abonelikleri için.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Tüm sağlayıcılara, model referanslarına ve yük devretme davranışına genel bakış.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    Tam yapılandırma referansı.
  </Card>
</CardGroup>

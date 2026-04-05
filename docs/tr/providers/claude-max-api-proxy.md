---
read_when:
    - Claude Max aboneliğini OpenAI uyumlu araçlarla kullanmak istiyorsunuz
    - Claude Code CLI'yi saran yerel bir API sunucusu istiyorsunuz
    - Abonelik tabanlı ve API anahtarı tabanlı Anthropic erişimini değerlendirmek istiyorsunuz
summary: Claude abonelik kimlik bilgilerini OpenAI uyumlu bir uç nokta olarak açığa çıkaran topluluk proxy'si
title: Claude Max API Proxy
x-i18n:
    generated_at: "2026-04-05T14:03:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e125a6a46e48371544adf1331137a1db51e93e905b8c44da482cf2fba180a09
    source_path: providers/claude-max-api-proxy.md
    workflow: 15
---

# Claude Max API Proxy

**claude-max-api-proxy**, Claude Max/Pro aboneliğinizi OpenAI uyumlu bir API uç noktası olarak sunan bir topluluk aracıdır. Bu, aboneliğinizi OpenAI API biçimini destekleyen herhangi bir araçla kullanmanıza olanak tanır.

<Warning>
Bu yol yalnızca teknik uyumluluk içindir. Anthropic geçmişte Claude Code dışındaki bazı abonelik
kullanımlarını engelledi. Bunu kullanıp kullanmayacağınıza kendiniz karar vermeli
ve buna güvenmeden önce Anthropic'in güncel şartlarını doğrulamalısınız.
</Warning>

## Bunu neden kullanmalısınız?

| Approach                | Cost                                                | Best For                                   |
| ----------------------- | --------------------------------------------------- | ------------------------------------------ |
| Anthropic API           | Token başına ödeme (~Opus için girişte $15/M, çıkışta $75/M) | Üretim uygulamaları, yüksek hacim          |
| Claude Max subscription | Sabit $200/ay                                       | Kişisel kullanım, geliştirme, sınırsız kullanım |

Claude Max aboneliğiniz varsa ve bunu OpenAI uyumlu araçlarla kullanmak istiyorsanız, bu proxy bazı iş akışları için maliyeti azaltabilir. Üretimde kullanım için API anahtarları hâlâ daha net politika yoludur.

## Nasıl çalışır

```
Uygulamanız → claude-max-api-proxy → Claude Code CLI → Anthropic (abonelik üzerinden)
     (OpenAI formatı)               (biçimi dönüştürür)   (oturumunuzu kullanır)
```

Proxy şunları yapar:

1. `http://localhost:3456/v1/chat/completions` adresinde OpenAI biçimli istekleri kabul eder
2. Bunları Claude Code CLI komutlarına dönüştürür
3. Yanıtları OpenAI biçiminde döndürür (akış desteklenir)

## Kurulum

```bash
# Node.js 20+ ve Claude Code CLI gerektirir
npm install -g claude-max-api-proxy

# Claude CLI'nin kimliği doğrulanmış olduğunu doğrulayın
claude --version
```

## Kullanım

### Sunucuyu başlatın

```bash
claude-max-api
# Sunucu http://localhost:3456 adresinde çalışır
```

### Test edin

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

### OpenClaw ile

OpenClaw'u özel OpenAI uyumlu bir uç nokta olarak proxy'ye yönlendirebilirsiniz:

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

Bu yol, diğer özel
`/v1` arka uçlarıyla aynı proxy tarzı OpenAI uyumlu rotayı kullanır:

- yerel yalnızca OpenAI istek şekillendirmesi uygulanmaz
- `service_tier`, Responses `store`, prompt-cache ipuçları ve
  OpenAI reasoning uyumluluk yük şekillendirmesi yoktur
- gizli OpenClaw ilişkilendirme üstbilgileri (`originator`, `version`, `User-Agent`)
  proxy URL'sine eklenmez

## Kullanılabilir Modeller

| Model ID          | Maps To         |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## macOS'ta otomatik başlatma

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

## Bağlantılar

- **npm:** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub:** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **Issues:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## Notlar

- Bu bir **topluluk aracıdır**, Anthropic veya OpenClaw tarafından resmî olarak desteklenmez
- Claude Code CLI kimliği doğrulanmış etkin bir Claude Max/Pro aboneliği gerektirir
- Proxy yerel olarak çalışır ve verileri herhangi bir üçüncü taraf sunucuya göndermez
- Akış yanıtları tam olarak desteklenir

## Ayrıca bkz.

- [Anthropic provider](/providers/anthropic) - Claude CLI veya API anahtarları ile yerel OpenClaw entegrasyonu
- [OpenAI provider](/providers/openai) - OpenAI/Codex abonelikleri için

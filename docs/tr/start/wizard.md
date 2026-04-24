---
read_when:
    - CLI ilk katılımını çalıştırma veya yapılandırma
    - Yeni bir makine kurma
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI ilk katılımı: gateway, çalışma alanı, kanallar ve Skills için yönlendirmeli kurulum'
title: İlk katılım (CLI)
x-i18n:
    generated_at: "2026-04-24T09:32:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 919a4ab57f42f663e98e77c967e08e7ad7afbb193bd048ca1dedc884002d3801
    source_path: start/wizard.md
    workflow: 15
---

CLI ilk katılımı, macOS,
Linux veya Windows'ta (WSL2 üzerinden; şiddetle önerilir) OpenClaw kurmanın **önerilen** yoludur.
Yerel bir Gateway'i veya uzak bir Gateway bağlantısını, ayrıca kanalları, Skills'i
ve çalışma alanı varsayılanlarını tek bir yönlendirmeli akışta yapılandırır.

```bash
openclaw onboard
```

<Info>
En hızlı ilk sohbet: Control UI'yi açın (kanal kurulumu gerekmez). Şunu çalıştırın:
`openclaw dashboard` ve tarayıcıda sohbet edin. Belgeler: [Dashboard](/tr/web/dashboard).
</Info>

Daha sonra yeniden yapılandırmak için:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json`, etkileşimsiz modu ima etmez. Betikler için `--non-interactive` kullanın.
</Note>

<Tip>
CLI ilk katılımı, Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG veya Tavily gibi sağlayıcılardan birini seçebileceğiniz bir web arama adımı içerir. Bazı sağlayıcılar
API anahtarı gerektirirken bazıları gerektirmez. Bunu daha sonra da
`openclaw configure --section web` ile yapılandırabilirsiniz. Belgeler: [Web araçları](/tr/tools/web).
</Tip>

## QuickStart ve Advanced

İlk katılım **QuickStart** (varsayılanlar) ve **Advanced** (tam denetim) ile başlar.

<Tabs>
  <Tab title="QuickStart (varsayılanlar)">
    - Yerel gateway (loopback)
    - Çalışma alanı varsayılanı (veya mevcut çalışma alanı)
    - Gateway portu **18789**
    - Gateway auth **Token** (loopback üzerinde bile otomatik oluşturulur)
    - Yeni yerel kurulumlar için araç ilkesi varsayılanı: `tools.profile: "coding"` (mevcut açık profil korunur)
    - DM yalıtımı varsayılanı: yerel ilk katılım, ayarlı değilse `session.dmScope: "per-channel-peer"` yazar. Ayrıntılar: [CLI Kurulum Başvurusu](/tr/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale açığa çıkarma **Kapalı**
    - Telegram + WhatsApp DM'leri varsayılan olarak **allowlist** olur (telefon numaranız sorulacaktır)
  </Tab>
  <Tab title="Advanced (tam denetim)">
    - Her adımı açığa çıkarır (mod, çalışma alanı, gateway, kanallar, daemon, Skills).
  </Tab>
</Tabs>

## İlk katılım neyi yapılandırır

**Yerel mod (varsayılan)** sizi şu adımlardan geçirir:

1. **Model/Auth** — API anahtarı, OAuth veya sağlayıcıya özgü manuel auth dahil olmak üzere desteklenen herhangi bir sağlayıcı/auth akışını seçin; buna Custom Provider da dahildir
   (OpenAI uyumlu, Anthropic uyumlu veya Unknown otomatik algılama). Varsayılan bir model seçin.
   Güvenlik notu: bu aracı araç çalıştıracaksa veya webhook/hooks içeriği işleyecekse, kullanılabilir en güçlü son nesil modeli tercih edin ve araç ilkesini katı tutun. Daha zayıf/eski katmanlara istem enjeksiyonu daha kolaydır.
   Etkileşimsiz çalıştırmalar için `--secret-input-mode ref`, auth profillerinde düz metin API anahtarı değerleri yerine ortam destekli ref'ler saklar.
   Etkileşimsiz `ref` modunda sağlayıcı ortam değişkeni ayarlanmış olmalıdır; o ortam değişkeni olmadan satır içi anahtar bayrakları geçirmek hızlıca başarısız olur.
   Etkileşimli çalıştırmalarda gizli başvuru modu seçildiğinde, kaydetmeden önce hızlı bir ön doğrulamayla bir ortam değişkenine veya yapılandırılmış bir sağlayıcı ref'ine (`file` veya `exec`) işaret edebilirsiniz.
   Anthropic için etkileşimli ilk katılım/yapılandırma, tercih edilen yerel yol olarak **Anthropic Claude CLI**'yi ve önerilen üretim yolu olarak **Anthropic API key**'i sunar. Anthropic setup-token da desteklenen token-auth yolu olarak kullanılabilir kalır.
2. **Çalışma alanı** — Aracı dosyalarının konumu (varsayılan `~/.openclaw/workspace`). Önyüklemeleme dosyalarını tohumlar.
3. **Gateway** — Port, bağlanma adresi, auth modu, Tailscale açığa çıkarma.
   Etkileşimli token modunda varsayılan düz metin token depolamayı seçin veya SecretRef'e dahil olun.
   Etkileşimsiz token SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanallar** — BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp ve daha fazlası gibi yerleşik ve paketlenmiş sohbet kanalları.
5. **Daemon** — LaunchAgent (macOS), systemd kullanıcı birimi (Linux/WSL2) veya yerel Windows Scheduled Task ile kullanıcı başına Startup-folder geri dönüşünü kurar.
   Token auth bir token gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa, daemon kurulumu bunu doğrular ancak çözümlenen token'ı gözetici hizmet ortam üst verisine kalıcı yazmaz.
   Token auth bir token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenmemişse, daemon kurulumu eyleme geçirilebilir rehberlikle engellenir.
   Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlı değilse, mod açıkça ayarlanana kadar daemon kurulumu engellenir.
6. **Sağlık denetimi** — Gateway'i başlatır ve çalıştığını doğrular.
7. **Skills** — Önerilen Skills'i ve isteğe bağlı bağımlılıkları kurar.

<Note>
Açıkça **Reset** seçmediğiniz sürece (veya `--reset` geçmediğiniz sürece) ilk katılımı yeniden çalıştırmak **hiçbir şeyi silmez**.
CLI `--reset` varsayılan olarak yapılandırma, kimlik bilgileri ve oturumları sıfırlar; çalışma alanını da dahil etmek için `--reset-scope full` kullanın.
Yapılandırma geçersizse veya eski anahtarlar içeriyorsa, ilk katılım önce `openclaw doctor` çalıştırmanızı ister.
</Note>

**Uzak mod** yalnızca yerel istemciyi başka bir yerdeki Gateway'e bağlanacak şekilde yapılandırır.
Uzak ana makinede hiçbir şey kurmaz veya değiştirmez.

## Başka bir aracı ekleyin

Kendi çalışma alanı,
oturumları ve auth profilleri olan ayrı bir aracı oluşturmak için `openclaw agents add <name>` kullanın. `--workspace` olmadan çalıştırmak ilk katılımı başlatır.

Ayarladıkları:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Notlar:

- Varsayılan çalışma alanları `~/.openclaw/workspace-<agentId>` biçimini izler.
- Gelen mesajları yönlendirmek için `bindings` ekleyin (ilk katılım bunu yapabilir).
- Etkileşimsiz bayraklar: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Tam başvuru

Ayrıntılı adım adım dökümler ve yapılandırma çıktıları için
bkz. [CLI Kurulum Başvurusu](/tr/start/wizard-cli-reference).
Etkileşimsiz örnekler için bkz. [CLI Otomasyonu](/tr/start/wizard-cli-automation).
RPC ayrıntıları dahil daha derin teknik başvuru için
bkz. [Onboarding Reference](/tr/reference/wizard).

## İlgili belgeler

- CLI komut başvurusu: [`openclaw onboard`](/tr/cli/onboard)
- İlk katılıma genel bakış: [İlk Katılıma Genel Bakış](/tr/start/onboarding-overview)
- macOS uygulaması ilk katılımı: [İlk katılım](/tr/start/onboarding)
- Aracı ilk çalıştırma ritüeli: [Aracı Önyüklemeleme](/tr/start/bootstrapping)

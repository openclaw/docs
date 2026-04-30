---
read_when:
    - CLI ilk kurulumunu çalıştırma veya yapılandırma
    - Yeni bir makine kurma
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI başlangıç kurulumu: Gateway, çalışma alanı, kanallar ve Skills için rehberli kurulum'
title: İlk kurulum (CLI)
x-i18n:
    generated_at: "2026-04-30T09:46:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9e9ee3af82ab9f4a1af5d20e3680eb932a9428cb914bbc08c9a2bf83c94ec158
    source_path: start/wizard.md
    workflow: 16
---

CLI onboarding, OpenClaw'ı macOS, Linux veya Windows üzerinde (WSL2 aracılığıyla; kesinlikle önerilir) kurmanın **önerilen** yoludur.
Tek bir rehberli akışta yerel bir Gateway veya uzak Gateway bağlantısının yanı sıra kanalları, Skills'i
ve çalışma alanı varsayılanlarını yapılandırır.

```bash
openclaw onboard
```

<Info>
En hızlı ilk sohbet: Control UI'ı açın (kanal kurulumu gerekmez). `openclaw dashboard`
komutunu çalıştırın ve tarayıcıda sohbet edin. Dokümanlar: [Dashboard](/tr/web/dashboard).
</Info>

Daha sonra yeniden yapılandırmak için:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json`, etkileşimsiz mod anlamına gelmez. Betikler için `--non-interactive` kullanın.
</Note>

<Tip>
CLI onboarding, Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG veya Tavily gibi bir sağlayıcı seçebileceğiniz
bir web arama adımı içerir. Bazı sağlayıcılar API anahtarı gerektirirken diğerleri
anahtarsızdır. Bunu daha sonra `openclaw configure --section web` ile de yapılandırabilirsiniz.
Dokümanlar: [Web araçları](/tr/tools/web).
</Tip>

## QuickStart ve Advanced

Onboarding, **QuickStart** (varsayılanlar) ile **Advanced** (tam denetim) seçenekleriyle başlar.

<Tabs>
  <Tab title="QuickStart (varsayılanlar)">
    - Yerel gateway (loopback)
    - Çalışma alanı varsayılanı (veya mevcut çalışma alanı)
    - Gateway bağlantı noktası **18789**
    - Gateway kimlik doğrulaması **Token** (loopback üzerinde bile otomatik oluşturulur)
    - Yeni yerel kurulumlar için araç ilkesi varsayılanı: `tools.profile: "coding"` (mevcut açık profil korunur)
    - DM izolasyonu varsayılanı: yerel onboarding, ayarlanmamışsa `session.dmScope: "per-channel-peer"` yazar. Ayrıntılar: [CLI Kurulum Başvurusu](/tr/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale dışa açımı **Kapalı**
    - Telegram + WhatsApp DM'leri varsayılan olarak **izin listesi** kullanır (telefon numaranız istenir)

  </Tab>
  <Tab title="Advanced (tam denetim)">
    - Her adımı açığa çıkarır (mod, çalışma alanı, gateway, kanallar, daemon, Skills).

  </Tab>
</Tabs>

## Onboarding neyi yapılandırır

**Yerel mod (varsayılan)** sizi şu adımlardan geçirir:

1. **Model/Kimlik Doğrulama** — Custom Provider dahil desteklenen herhangi bir sağlayıcı/kimlik doğrulama akışını (API anahtarı, OAuth veya sağlayıcıya özgü manuel kimlik doğrulama) seçin
   (OpenAI uyumlu, Anthropic uyumlu veya Unknown otomatik algılama). Varsayılan bir model seçin.
   Güvenlik notu: Bu agent araç çalıştıracak veya webhook/hooks içeriğini işleyecekse, mevcut en güçlü son nesil modeli tercih edin ve araç ilkesini sıkı tutun. Daha zayıf/eski katmanlar prompt-inject saldırılarına daha açıktır.
   Etkileşimsiz çalıştırmalarda, `--secret-input-mode ref` düz metin API anahtarı değerleri yerine kimlik doğrulama profillerinde env destekli referanslar saklar.
   Etkileşimsiz `ref` modunda, sağlayıcı env var ayarlanmış olmalıdır; bu env var olmadan satır içi anahtar bayrakları geçirmek hızlıca başarısız olur.
   Etkileşimli çalıştırmalarda, gizli referans modunu seçmek, kaydetmeden önce hızlı bir ön kontrol doğrulamasıyla bir ortam değişkenine veya yapılandırılmış bir sağlayıcı referansına (`file` veya `exec`) işaret etmenizi sağlar.
   Anthropic için etkileşimli onboarding/configure, tercih edilen yerel yol olarak **Anthropic Claude CLI**'ı ve önerilen üretim yolu olarak **Anthropic API key**'i sunar. Anthropic setup-token da desteklenen bir token-auth yolu olarak kullanılabilir kalır.
2. **Çalışma Alanı** — Agent dosyalarının konumu (varsayılan `~/.openclaw/workspace`). Başlangıç dosyalarını yerleştirir.
3. **Gateway** — Bağlantı noktası, bind adresi, kimlik doğrulama modu, Tailscale dışa açımı.
   Etkileşimli token modunda, varsayılan düz metin token depolamasını seçin veya SecretRef'e geçin.
   Etkileşimsiz token SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanallar** — BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp ve daha fazlası gibi yerleşik ve paketlenmiş sohbet kanalları.
5. **Daemon** — Bir LaunchAgent (macOS), systemd kullanıcı birimi (Linux/WSL2) veya kullanıcı başına Startup klasörü yedeğiyle yerel Windows Scheduled Task kurar.
   Token kimlik doğrulaması bir token gerektiriyorsa ve `gateway.auth.token` SecretRef ile yönetiliyorsa, daemon kurulumu bunu doğrular ancak çözümlenen token'ı supervisor hizmet ortamı meta verilerine kalıcı olarak yazmaz.
   Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenemiyorsa, daemon kurulumu uygulanabilir yönlendirmeyle engellenir.
   Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, mod açıkça ayarlanana kadar daemon kurulumu engellenir.
6. **Sağlık denetimi** — Gateway'i başlatır ve çalıştığını doğrular.
7. **Skills** — Önerilen Skills'i ve isteğe bağlı bağımlılıkları kurar.

<Note>
Onboarding'i yeniden çalıştırmak, açıkça **Reset** seçmediğiniz (veya `--reset` geçmediğiniz) sürece hiçbir şeyi silmez.
CLI `--reset` varsayılan olarak yapılandırma, kimlik bilgileri ve oturumları kapsar; çalışma alanını dahil etmek için `--reset-scope full` kullanın.
Yapılandırma geçersizse veya eski anahtarlar içeriyorsa, onboarding önce `openclaw doctor` çalıştırmanızı ister.
</Note>

**Uzak mod** yalnızca yerel istemciyi başka bir yerdeki Gateway'e bağlanacak şekilde yapılandırır.
Uzak ana makinede hiçbir şey kurmaz veya değiştirmez.

## Başka bir agent ekleyin

Kendi çalışma alanı, oturumları ve kimlik doğrulama profilleri olan ayrı bir agent oluşturmak için
`openclaw agents add <name>` kullanın. `--workspace` olmadan çalıştırmak onboarding'i başlatır.

Ayarladıkları:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Notlar:

- Varsayılan çalışma alanları `~/.openclaw/workspace-<agentId>` düzenini izler.
- Gelen mesajları yönlendirmek için `bindings` ekleyin (onboarding bunu yapabilir).
- Etkileşimsiz bayraklar: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Tam başvuru

Ayrıntılı adım adım dökümler ve yapılandırma çıktıları için
[CLI Kurulum Başvurusu](/tr/start/wizard-cli-reference) bölümüne bakın.
Etkileşimsiz örnekler için [CLI Otomasyonu](/tr/start/wizard-cli-automation) bölümüne bakın.
RPC ayrıntıları dahil daha derin teknik başvuru için
[Onboarding Başvurusu](/tr/reference/wizard) bölümüne bakın.

## İlgili dokümanlar

- CLI komut başvurusu: [`openclaw onboard`](/tr/cli/onboard)
- Onboarding genel bakışı: [Onboarding Genel Bakışı](/tr/start/onboarding-overview)
- macOS uygulaması onboarding: [Onboarding](/tr/start/onboarding)
- Agent ilk çalıştırma ritüeli: [Agent Bootstrapping](/tr/start/bootstrapping)

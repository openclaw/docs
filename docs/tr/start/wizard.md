---
read_when:
    - CLI onboarding’i çalıştırıyor veya yapılandırıyorsanız
    - Yeni bir makine kuruyorsanız
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI onboarding: gateway, çalışma alanı, kanallar ve Skills için rehberli kurulum'
title: Onboarding (CLI)
x-i18n:
    generated_at: "2026-04-05T14:09:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81e33fb4f8be30e7c2c6e0024bf9bdcf48583ca58eaf5fff5afd37a1cd628523
    source_path: start/wizard.md
    workflow: 15
---

# Onboarding (CLI)

CLI onboarding, OpenClaw’u macOS,
Linux veya Windows’ta (WSL2 üzerinden; güçlü şekilde önerilir) kurmanın **önerilen** yoludur.
Tek bir rehberli akışta yerel bir Gateway veya uzak bir Gateway bağlantısını, ayrıca kanalları, Skills’i
ve çalışma alanı varsayılanlarını yapılandırır.

```bash
openclaw onboard
```

<Info>
En hızlı ilk sohbet: Control UI’yi açın (kanal kurulumu gerekmez). Şunu çalıştırın:
`openclaw dashboard` ve tarayıcıda sohbet edin. Belgeler: [Dashboard](/web/dashboard).
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
CLI onboarding, Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG veya Tavily gibi bir sağlayıcı seçebileceğiniz bir web arama adımı içerir. Bazı sağlayıcılar
API anahtarı gerektirirken diğerleri anahtarsızdır. Bunu daha sonra
`openclaw configure --section web` ile de yapılandırabilirsiniz. Belgeler: [Web araçları](/tools/web).
</Tip>

## QuickStart ve Advanced

Onboarding, **QuickStart** (varsayılanlar) ile **Advanced** (tam denetim) arasında seçim yaparak başlar.

<Tabs>
  <Tab title="QuickStart (varsayılanlar)">
    - Yerel gateway (loopback)
    - Çalışma alanı varsayılanı (veya mevcut çalışma alanı)
    - Gateway portu **18789**
    - Gateway auth **Token** (loopback üzerinde bile otomatik oluşturulur)
    - Yeni yerel kurulumlar için varsayılan araç ilkesi: `tools.profile: "coding"` (mevcut açık profil korunur)
    - Varsayılan DM yalıtımı: yerel onboarding, ayarlı değilse `session.dmScope: "per-channel-peer"` yazar. Ayrıntılar: [CLI Kurulum Başvurusu](/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale görünürlüğü **Kapalı**
    - Telegram + WhatsApp DM’leri varsayılan olarak **izin listesi** kullanır (telefon numaranız istenir)
  </Tab>
  <Tab title="Advanced (tam denetim)">
    - Her adımı gösterir (mod, çalışma alanı, gateway, kanallar, daemon, Skills).
  </Tab>
</Tabs>

## Onboarding’in yapılandırdıkları

**Yerel mod (varsayılan)** sizi şu adımlardan geçirir:

1. **Model/Kimlik Doğrulama** — Custom Provider dahil olmak üzere desteklenen herhangi bir sağlayıcı/kimlik doğrulama akışını seçin (API anahtarı, OAuth veya sağlayıcıya özgü el ile kimlik doğrulama)
   (OpenAI uyumlu, Anthropic uyumlu veya bilinmeyen otomatik algılama). Varsayılan bir model seçin.
   Güvenlik notu: Bu ajan araç çalıştıracaksa veya webhook/hooks içeriğini işleyecekse, mevcut en güçlü yeni nesil modeli tercih edin ve araç ilkesini sıkı tutun. Daha zayıf/eski katmanlara istem enjeksiyonu yapmak daha kolaydır.
   Etkileşimsiz çalıştırmalarda `--secret-input-mode ref`, düz metin API anahtarı değerleri yerine kimlik doğrulama profillerinde ortam destekli ref’ler saklar.
   Etkileşimsiz `ref` modunda sağlayıcı ortam değişkeni ayarlanmış olmalıdır; bu ortam değişkeni olmadan satır içi anahtar bayrakları geçirmek hızlıca hata verir.
   Etkileşimli çalıştırmalarda, gizli başvuru modunu seçmek bir ortam değişkenine veya yapılandırılmış bir sağlayıcı ref’ine (`file` veya `exec`) işaret etmenizi sağlar; kaydetmeden önce hızlı bir ön doğrulama yapılır.
   Anthropic için etkileşimli onboarding/configure, yerel geri dönüş seçeneği olarak **Anthropic Claude CLI** ve önerilen üretim yolu olarak **Anthropic API key** sunar. Anthropic setup-token da yine eski/el ile OpenClaw yolu olarak kullanılabilir ve Anthropic’in OpenClaw’e özel **Extra Usage** faturalama beklentisi vardır.
2. **Çalışma alanı** — Ajan dosyalarının konumu (varsayılan `~/.openclaw/workspace`). Bootstrap dosyalarını hazırlar.
3. **Gateway** — Port, bind adresi, auth modu, Tailscale görünürlüğü.
   Etkileşimli token modunda varsayılan düz metin token depolamayı seçin veya SecretRef kullanımını tercih edin.
   Etkileşimsiz token SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanallar** — BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp ve daha fazlası gibi yerleşik ve paketli sohbet kanalları.
5. **Daemon** — LaunchAgent (macOS), systemd kullanıcı birimi (Linux/WSL2) veya kullanıcı başına Startup-folder geri dönüşü olan yerel Windows Scheduled Task kurar.
   Token auth bir token gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa, daemon kurulumu bunu doğrular ancak çözümlenmiş token’ı supervisor hizmet ortamı meta verilerine kalıcı olarak yazmaz.
   Token auth bir token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenmemişse, daemon kurulumu uygulanabilir yönlendirmeyle engellenir.
   Hem `gateway.auth.token` hem `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlı değilse, mod açıkça ayarlanana kadar daemon kurulumu engellenir.
6. **Sağlık kontrolü** — Gateway’i başlatır ve çalıştığını doğrular.
7. **Skills** — Önerilen Skills’i ve isteğe bağlı bağımlılıkları yükler.

<Note>
Onboarding’i yeniden çalıştırmak, siz açıkça **Reset** seçmediğiniz sürece (veya `--reset` geçmediğiniz sürece) hiçbir şeyi silmez.
CLI `--reset` varsayılan olarak yapılandırmayı, kimlik bilgilerini ve oturumları sıfırlar; çalışma alanını da dahil etmek için `--reset-scope full` kullanın.
Yapılandırma geçersizse veya eski anahtarlar içeriyorsa onboarding önce `openclaw doctor` çalıştırmanızı ister.
</Note>

**Uzak mod**, yalnızca yerel istemciyi başka bir yerdeki bir Gateway’e bağlanacak şekilde yapılandırır.
Uzak ana makinede hiçbir şeyi kurmaz veya değiştirmez.

## Başka bir ajan ekleme

Kendi çalışma alanı,
oturumları ve kimlik doğrulama profilleri olan ayrı bir ajan oluşturmak için `openclaw agents add <name>` kullanın. `--workspace` olmadan çalıştırmak onboarding’i başlatır.

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
[CLI Kurulum Başvurusu](/start/wizard-cli-reference) bölümüne bakın.
Etkileşimsiz örnekler için [CLI Otomasyonu](/start/wizard-cli-automation) bölümüne bakın.
RPC ayrıntıları dahil daha derin teknik başvuru için
[Onboarding Başvurusu](/reference/wizard) bölümüne bakın.

## İlgili belgeler

- CLI komut başvurusu: [`openclaw onboard`](/cli/onboard)
- Onboarding genel bakışı: [Onboarding Overview](/start/onboarding-overview)
- macOS uygulaması onboarding: [Onboarding](/start/onboarding)
- Ajanın ilk çalıştırma ritüeli: [Agent Bootstrapping](/start/bootstrapping)

---
read_when:
    - CLI başlangıç kurulumunu çalıştırma veya yapılandırma
    - Yeni bir makinenin kurulumu
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI onboarding: Gateway, çalışma alanı, kanallar ve Skills için rehberli kurulum'
title: İlk Kurulum (CLI)
x-i18n:
    generated_at: "2026-05-06T09:31:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4872c150950a811e5cdb8830fe635886f7c3ed0f1d62352b71be56feda64691
    source_path: start/wizard.md
    workflow: 16
---

CLI ilk kurulum, OpenClaw’u macOS, Linux veya Windows üzerinde (WSL2 ile; kesinlikle önerilir) kurmanın **önerilen** yoludur.
Tek bir yönlendirmeli akışta yerel bir Gateway veya uzak Gateway bağlantısını, ayrıca kanalları, Skills’i
ve çalışma alanı varsayılanlarını yapılandırır.

```bash
openclaw onboard
```

<Info>
En hızlı ilk sohbet: Control UI’ı açın (kanal kurulumu gerekmez). `openclaw dashboard` komutunu çalıştırın ve tarayıcıda sohbet edin. Belgeler: [Dashboard](/tr/web/dashboard).
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
CLI ilk kurulumunda Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG veya Tavily gibi bir sağlayıcı seçebileceğiniz
bir web arama adımı bulunur. Bazı sağlayıcılar API anahtarı gerektirirken
bazıları anahtarsızdır. Bunu daha sonra `openclaw configure --section web` ile de yapılandırabilirsiniz. Belgeler: [Web araçları](/tr/tools/web).
</Tip>

## QuickStart ve Advanced

İlk kurulum **QuickStart** (varsayılanlar) ile **Advanced** (tam kontrol) arasında seçimle başlar.

<Tabs>
  <Tab title="QuickStart (defaults)">
    - Yerel Gateway (local loopback)
    - Çalışma alanı varsayılanı (veya mevcut çalışma alanı)
    - Gateway bağlantı noktası **18789**
    - Gateway kimlik doğrulaması **Token** (local loopback üzerinde bile otomatik oluşturulur)
    - Yeni yerel kurulumlar için araç ilkesi varsayılanı: `tools.profile: "coding"` (mevcut açık profil korunur)
    - DM yalıtımı varsayılanı: yerel ilk kurulum, ayarlanmamışsa `session.dmScope: "per-channel-peer"` yazar. Ayrıntılar: [CLI Kurulum Başvurusu](/tr/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale dışa açma **Kapalı**
    - Telegram + WhatsApp DM’leri varsayılan olarak **izin listesi** kullanır (telefon numaranız istenir)

  </Tab>
  <Tab title="Advanced (full control)">
    - Her adımı gösterir (mod, çalışma alanı, Gateway, kanallar, daemon, Skills).

  </Tab>
</Tabs>

## İlk kurulumun yapılandırdıkları

**Yerel mod (varsayılan)** sizi şu adımlardan geçirir:

1. **Model/Kimlik Doğrulama** — Custom Provider dahil olmak üzere desteklenen herhangi bir sağlayıcıyı/kimlik doğrulama akışını (API anahtarı, OAuth veya sağlayıcıya özel manuel kimlik doğrulama) seçin
   (OpenAI uyumlu, Anthropic uyumlu veya Unknown otomatik algılama). Varsayılan bir model seçin.
   Güvenlik notu: Bu aracı araç çalıştıracak veya webhook/hooks içeriğini işleyecekse, mevcut en güçlü en yeni nesil modeli tercih edin ve araç ilkesini sıkı tutun. Daha zayıf/eski katmanlar prompt injection’a daha açıktır.
   Etkileşimsiz çalıştırmalarda `--secret-input-mode ref`, düz metin API anahtarı değerleri yerine kimlik doğrulama profillerinde ortam destekli referanslar saklar.
   Etkileşimsiz `ref` modunda sağlayıcı ortam değişkeni ayarlanmış olmalıdır; bu ortam değişkeni olmadan satır içi anahtar bayrakları geçirmek hızlıca başarısız olur.
   Etkileşimli çalıştırmalarda gizli referans modunu seçmek, kaydetmeden önce hızlı bir ön doğrulamayla bir ortam değişkenini veya yapılandırılmış bir sağlayıcı referansını (`file` ya da `exec`) göstermenizi sağlar.
   Anthropic için etkileşimli ilk kurulum/yapılandırma, tercih edilen yerel yol olarak **Anthropic Claude CLI**’ı ve önerilen üretim yolu olarak **Anthropic API anahtarı**nı sunar. Anthropic setup-token da desteklenen bir token kimlik doğrulama yolu olarak kullanılabilir kalır.
2. **Çalışma Alanı** — Aracı dosyalarının konumu (varsayılan `~/.openclaw/workspace`). Başlangıç dosyalarını ekler.
3. **Gateway** — Bağlantı noktası, bağlama adresi, kimlik doğrulama modu, Tailscale dışa açma.
   Etkileşimli token modunda, varsayılan düz metin token depolamayı seçin veya SecretRef’e geçin.
   Etkileşimsiz token SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanallar** — BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp ve daha fazlası gibi yerleşik ve paketli sohbet kanalları.
5. **Daemon** — Bir LaunchAgent (macOS), systemd kullanıcı birimi (Linux/WSL2) veya kullanıcı başına Startup klasörü yedeğiyle yerel Windows Scheduled Task kurar.
   Token kimlik doğrulaması bir token gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa, daemon kurulumu bunu doğrular ancak çözümlenen token’ı denetleyici servis ortamı meta verilerine kalıcı olarak yazmaz.
   Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenemiyorsa, daemon kurulumu uygulanabilir yönlendirmeyle engellenir.
   Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, mod açıkça ayarlanana kadar daemon kurulumu engellenir.
6. **Sağlık kontrolü** — Gateway’i başlatır ve çalıştığını doğrular.
7. **Skills** — Önerilen Skills’i ve isteğe bağlı bağımlılıkları kurar.

<Note>
İlk kurulumu yeniden çalıştırmak, açıkça **Sıfırla** seçeneğini seçmediğiniz (veya `--reset` geçirmediğiniz) sürece hiçbir şeyi silmez.
CLI `--reset` varsayılan olarak yapılandırmayı, kimlik bilgilerini ve oturumları kapsar; çalışma alanını dahil etmek için `--reset-scope full` kullanın.
Yapılandırma geçersizse veya eski anahtarlar içeriyorsa, ilk kurulum önce `openclaw doctor` çalıştırmanızı ister.
</Note>

**Uzak mod**, yalnızca yerel istemciyi başka bir yerdeki Gateway’e bağlanacak şekilde yapılandırır.
Uzak makinede hiçbir şey kurmaz veya değiştirmez.

## Başka bir aracı ekleme

Kendi çalışma alanı, oturumları ve kimlik doğrulama profilleri olan ayrı bir aracı oluşturmak için `openclaw agents add <name>` kullanın.
`--workspace` olmadan çalıştırmak ilk kurulumu başlatır.

Ayarladıkları:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Notlar:

- Varsayılan çalışma alanları `~/.openclaw/workspace-<agentId>` biçimini izler.
- Gelen iletileri yönlendirmek için `bindings` ekleyin (ilk kurulum bunu yapabilir).
- Etkileşimsiz bayraklar: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Tam başvuru

Ayrıntılı adım adım dökümler ve yapılandırma çıktıları için bkz.
[CLI Kurulum Başvurusu](/tr/start/wizard-cli-reference).
Etkileşimsiz örnekler için bkz. [CLI Otomasyonu](/tr/start/wizard-cli-automation).
RPC ayrıntıları dahil daha derin teknik başvuru için bkz.
[İlk Kurulum Başvurusu](/tr/reference/wizard).

## İlgili belgeler

- CLI komut başvurusu: [`openclaw onboard`](/tr/cli/onboard)
- İlk kurulum genel bakışı: [İlk Kurulum Genel Bakışı](/tr/start/onboarding-overview)
- macOS uygulama ilk kurulumu: [İlk Kurulum](/tr/start/onboarding)
- Aracı ilk çalıştırma ritüeli: [Aracı Başlatma](/tr/start/bootstrapping)

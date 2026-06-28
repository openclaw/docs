---
read_when:
    - CLI katılımını çalıştırma veya yapılandırma
    - Yeni bir makine kurma
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI ilk kurulum: Gateway, çalışma alanı, kanallar ve Skills için rehberli kurulum'
title: Katılım (CLI)
x-i18n:
    generated_at: "2026-06-28T20:45:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8abf6ac4644e0a49668cbfa1277f6eb3ac5b4fd822cd7805bb647c94ae76895f
    source_path: start/wizard.md
    workflow: 16
---

CLI ile ilk kurulum, macOS, Linux veya Windows üzerinde OpenClaw için **önerilen** terminal kurulum yoludur. Windows masaüstü kullanıcıları ayrıca
[Windows Hub](/tr/platforms/windows) ile başlayabilir.
Tek bir yönlendirmeli akışta yerel bir Gateway veya uzak Gateway bağlantısını, ayrıca kanalları, Skills'i
ve çalışma alanı varsayılanlarını yapılandırır.

```bash
openclaw onboard
```

QuickStart genellikle yalnızca birkaç dakika sürer, ancak sağlayıcı oturumu açma,
kanal eşleştirme, daemon kurulumu, ağ indirmeleri, Skills veya isteğe bağlı Plugin'ler
ek kurulum gerektirdiğinde tam ilk kurulum daha uzun sürebilir. Sihirbaz bu zaman çizelgesini
baştan gösterir ve isteğe bağlı adımlar atlanıp daha sonra
`openclaw configure` ile yeniden ele alınabilir.

## Yerel ayar

CLI sihirbazı sabit ilk kurulum metinlerini yerelleştirir. Yerel ayarı sırasıyla
`OPENCLAW_LOCALE`, ardından `LC_ALL`, ardından `LC_MESSAGES`, ardından `LANG` üzerinden çözer
ve İngilizceye geri döner. Desteklenen sihirbaz yerel ayarları `en`, `zh-CN` ve `zh-TW` değerleridir.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Adlar ve kararlı tanımlayıcılar olduğu gibi kalır: `OpenClaw`, `Gateway`, `Tailscale`,
komutlar, yapılandırma anahtarları, URL'ler, sağlayıcı kimlikleri, model kimlikleri ve plugin/kanal etiketleri
çevrilmez.

<Info>
En hızlı ilk sohbet: Control UI'yi açın (kanal kurulumu gerekmez). `openclaw dashboard` komutunu çalıştırın
ve tarayıcıda sohbet edin. Dokümanlar: [Dashboard](/tr/web/dashboard).
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
CLI ile ilk kurulum, Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG veya Tavily gibi bir sağlayıcı seçebileceğiniz
bir web arama adımı içerir. Bazı sağlayıcılar API anahtarı gerektirirken,
bazıları anahtarsızdır. Bunu daha sonra `openclaw configure --section web` ile de yapılandırabilirsiniz.
Dokümanlar: [Web araçları](/tr/tools/web).
</Tip>

## QuickStart ve Gelişmiş

İlk kurulum **QuickStart** (varsayılanlar) ile **Gelişmiş** (tam kontrol) seçenekleriyle başlar.

<Tabs>
  <Tab title="QuickStart (defaults)">
    - Yerel Gateway (loopback)
    - Çalışma alanı varsayılanı (veya mevcut çalışma alanı)
    - Gateway portu **18789**
    - Gateway kimlik doğrulaması **Token** (loopback üzerinde bile otomatik oluşturulur)
    - Yeni yerel kurulumlar için araç politikası varsayılanı: `tools.profile: "coding"` (mevcut açık profil korunur)
    - DM yalıtımı varsayılanı: yerel ilk kurulum, ayarlanmamışsa `session.dmScope: "per-channel-peer"` yazar. Ayrıntılar: [CLI Kurulum Başvurusu](/tr/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale erişimi **Kapalı**
    - Telegram + WhatsApp DM'leri varsayılan olarak **izin listesi** kullanır (telefon numaranız istenir)

  </Tab>
  <Tab title="Advanced (full control)">
    - Her adımı açar (mod, çalışma alanı, Gateway, kanallar, daemon, Skills).

  </Tab>
</Tabs>

## İlk kurulumun yapılandırdıkları

**Yerel mod (varsayılan)** sizi şu adımlardan geçirir:

1. **Model/Kimlik doğrulama** — Custom Provider dahil, desteklenen herhangi bir sağlayıcı/kimlik doğrulama akışını (API anahtarı, OAuth veya sağlayıcıya özgü manuel kimlik doğrulama) seçin
   (OpenAI uyumlu, Anthropic uyumlu veya Unknown otomatik algılama). Varsayılan bir model seçin.
   Güvenlik notu: Bu agent araç çalıştıracaksa veya Webhook/hooks içeriği işleyecekse, mevcut en güçlü en yeni nesil modeli tercih edin ve araç politikasını sıkı tutun. Daha zayıf/eski katmanlara prompt injection uygulamak daha kolaydır.
   Etkileşimsiz çalıştırmalarda `--secret-input-mode ref`, düz metin API anahtarı değerleri yerine auth profillerinde ortam destekli başvurular depolar.
   Etkileşimsiz `ref` modunda sağlayıcı env var ayarlanmış olmalıdır; bu env var olmadan satır içi anahtar bayrakları geçirmek hızlıca başarısız olur.
   Etkileşimli çalıştırmalarda gizli başvuru modunu seçmek, kaydetmeden önce hızlı bir ön doğrulamayla bir ortam değişkenine veya yapılandırılmış sağlayıcı başvurusuna (`file` veya `exec`) işaret etmenizi sağlar.
   Anthropic için etkileşimli ilk kurulum/configure, tercih edilen yerel yol olarak **Anthropic Claude CLI**'yi ve önerilen üretim yolu olarak **Anthropic API key**'i sunar. Anthropic setup-token da desteklenen bir token-auth yolu olarak kullanılabilir kalır.
2. **Çalışma alanı** — Agent dosyaları için konum (varsayılan `~/.openclaw/workspace`). Bootstrap dosyalarını ekler.
3. **Gateway** — Port, bağlama adresi, kimlik doğrulama modu, Tailscale erişimi.
   Etkileşimli token modunda varsayılan düz metin token depolamasını seçin veya SecretRef'e geçin.
   Etkileşimsiz token SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanallar** — iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp ve daha fazlası gibi yerleşik ve resmi Plugin sohbet kanalları.
5. **Daemon** — Bir LaunchAgent (macOS), systemd kullanıcı birimi (Linux/WSL2) veya kullanıcı başına Startup-folder geri dönüşüyle yerel Windows Scheduled Task kurar.
   Token kimlik doğrulaması bir token gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa, daemon kurulumu bunu doğrular ancak çözümlenen token'ı supervisor servis ortamı meta verilerine kalıcı olarak yazmaz.
   Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenemiyorsa, daemon kurulumu uygulanabilir yönlendirmeyle engellenir.
   Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, mod açıkça ayarlanana kadar daemon kurulumu engellenir.
6. **Sağlık kontrolü** — Gateway'i başlatır ve çalıştığını doğrular.
7. **Skills** — Önerilen Skills'i ve isteğe bağlı bağımlılıkları kurar.

<Note>
İlk kurulumu yeniden çalıştırmak, açıkça **Sıfırla** seçmediğiniz (veya `--reset` geçmediğiniz) sürece hiçbir şeyi silmez.
CLI `--reset` varsayılan olarak yapılandırmayı, kimlik bilgilerini ve oturumları kapsar; çalışma alanını dahil etmek için `--reset-scope full` kullanın.
Yapılandırma geçersizse veya eski anahtarlar içeriyorsa, ilk kurulum önce `openclaw doctor` çalıştırmanızı ister.
</Note>

**Uzak mod** yalnızca yerel istemciyi başka bir yerdeki Gateway'e bağlanacak şekilde yapılandırır.
Uzak ana makineye hiçbir şey kurmaz veya orada hiçbir şeyi değiştirmez.

## Başka bir agent ekleme

Kendi çalışma alanı, oturumları ve auth profilleri olan ayrı bir agent oluşturmak için
`openclaw agents add <name>` kullanın. `--workspace` olmadan çalıştırmak ilk kurulumu başlatır.

Ayarladıkları:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Notlar:

- Varsayılan çalışma alanları `~/.openclaw/workspace-<agentId>` biçimini izler.
- Gelen mesajları yönlendirmek için `bindings` ekleyin (ilk kurulum bunu yapabilir).
- Etkileşimsiz bayraklar: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Tam başvuru

Ayrıntılı adım adım açıklamalar ve yapılandırma çıktıları için
[CLI Kurulum Başvurusu](/tr/start/wizard-cli-reference) sayfasına bakın.
Etkileşimsiz örnekler için [CLI Otomasyonu](/tr/start/wizard-cli-automation) sayfasına bakın.
RPC ayrıntıları dahil daha derin teknik başvuru için
[İlk Kurulum Başvurusu](/tr/reference/wizard) sayfasına bakın.

## İlgili dokümanlar

- CLI komut başvurusu: [`openclaw onboard`](/tr/cli/onboard)
- İlk kurulum genel bakışı: [İlk Kurulum Genel Bakışı](/tr/start/onboarding-overview)
- macOS uygulaması ilk kurulumu: [İlk Kurulum](/tr/start/onboarding)
- Agent ilk çalıştırma ritüeli: [Agent Bootstrap](/tr/start/bootstrapping)

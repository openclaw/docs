---
read_when:
    - CLI ilk katılımını çalıştırma veya yapılandırma
    - Yeni bir makine kurma
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI ilk katılımı: Gateway, çalışma alanı, kanallar ve Skills için rehberli kurulum'
title: İlk Kurulum (CLI)
x-i18n:
    generated_at: "2026-06-28T01:19:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77bbf3d1f953ea2fca148090377f9537b00b657b2d7201c21aea902800815fd2
    source_path: start/wizard.md
    workflow: 16
---

CLI ile ilk kurulum, macOS, Linux veya Windows üzerinde OpenClaw için **önerilen** terminal kurulum yoludur. Windows masaüstü kullanıcıları
[Windows Hub](/tr/platforms/windows) ile de başlayabilir.
Tek bir rehberli akışta yerel bir Gateway veya uzak Gateway bağlantısını, ayrıca kanalları, Skills’i
ve çalışma alanı varsayılanlarını yapılandırır.

```bash
openclaw onboard
```

## Yerel Ayar

CLI sihirbazı sabit ilk kurulum metinlerini yerelleştirir. Yerel ayarı
`OPENCLAW_LOCALE`, ardından `LC_ALL`, ardından `LC_MESSAGES`, ardından `LANG` üzerinden çözer ve
İngilizceye geri döner. Desteklenen sihirbaz yerel ayarları `en`, `zh-CN` ve `zh-TW`’dir.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Adlar ve kararlı tanımlayıcılar birebir kalır: `OpenClaw`, `Gateway`, `Tailscale`,
komutlar, yapılandırma anahtarları, URL’ler, sağlayıcı kimlikleri, model kimlikleri ve Plugin/kanal etiketleri
çevrilmez.

<Info>
En hızlı ilk sohbet: Control UI’ı açın (kanal kurulumu gerekmez). `openclaw dashboard` çalıştırın ve tarayıcıda sohbet edin. Belgeler: [Dashboard](/tr/web/dashboard).
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
CLI ile ilk kurulum, Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG veya Tavily gibi bir sağlayıcı seçebileceğiniz bir web arama adımı içerir. Bazı sağlayıcılar
API anahtarı gerektirirken bazıları anahtarsızdır. Bunu daha sonra
`openclaw configure --section web` ile de yapılandırabilirsiniz. Belgeler: [Web araçları](/tr/tools/web).
</Tip>

## Hızlı Başlangıç ve Gelişmiş

İlk kurulum **Hızlı Başlangıç** (varsayılanlar) ile **Gelişmiş** (tam kontrol) arasında seçimle başlar.

<Tabs>
  <Tab title="Hızlı Başlangıç (varsayılanlar)">
    - Yerel gateway (loopback)
    - Çalışma alanı varsayılanı (veya mevcut çalışma alanı)
    - Gateway portu **18789**
    - Gateway kimlik doğrulaması **Token** (loopback üzerinde bile otomatik oluşturulur)
    - Yeni yerel kurulumlar için araç politikası varsayılanı: `tools.profile: "coding"` (mevcut açık profil korunur)
    - DM yalıtımı varsayılanı: yerel ilk kurulum, ayarlanmamışsa `session.dmScope: "per-channel-peer"` yazar. Ayrıntılar: [CLI Kurulum Başvurusu](/tr/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale açılımı **Kapalı**
    - Telegram + WhatsApp DM’leri varsayılan olarak **izin listesi** kullanır (telefon numaranız istenir)

  </Tab>
  <Tab title="Gelişmiş (tam kontrol)">
    - Her adımı gösterir (mod, çalışma alanı, gateway, kanallar, daemon, Skills).

  </Tab>
</Tabs>

## İlk kurulumun yapılandırdıkları

**Yerel mod (varsayılan)** sizi şu adımlardan geçirir:

1. **Model/Kimlik doğrulama** — Custom Provider dahil olmak üzere desteklenen herhangi bir sağlayıcı/kimlik doğrulama akışını (API anahtarı, OAuth veya sağlayıcıya özel elle kimlik doğrulama) seçin
   (OpenAI uyumlu, Anthropic uyumlu veya Unknown otomatik algılama). Varsayılan bir model seçin.
   Güvenlik notu: Bu agent araç çalıştıracak veya webhook/hooks içeriği işleyecekse, kullanılabilir en güçlü son nesil modeli tercih edin ve araç politikasını sıkı tutun. Daha zayıf/eski katmanlar prompt injection’a daha açıktır.
   Etkileşimsiz çalıştırmalarda `--secret-input-mode ref`, düz metin API anahtarı değerleri yerine kimlik doğrulama profillerinde ortam destekli başvurular saklar.
   Etkileşimsiz `ref` modunda sağlayıcı ortam değişkeni ayarlanmış olmalıdır; bu ortam değişkeni olmadan satır içi anahtar bayrakları geçirmek hızlıca başarısız olur.
   Etkileşimli çalıştırmalarda gizli başvuru modunu seçmek, kaydetmeden önce hızlı bir ön kontrol doğrulamasıyla bir ortam değişkenine veya yapılandırılmış bir sağlayıcı başvurusuna (`file` veya `exec`) işaret etmenizi sağlar.
   Anthropic için etkileşimli ilk kurulum/yapılandırma, tercih edilen yerel yol olarak **Anthropic Claude CLI**’ı ve önerilen üretim yolu olarak **Anthropic API key**’i sunar. Anthropic setup-token da desteklenen bir token kimlik doğrulama yolu olarak kullanılabilir kalır.
2. **Çalışma Alanı** — Agent dosyaları için konum (varsayılan `~/.openclaw/workspace`). Başlangıç dosyalarını ekler.
3. **Gateway** — Port, bind adresi, kimlik doğrulama modu, Tailscale açılımı.
   Etkileşimli token modunda varsayılan düz metin token depolamayı seçin veya SecretRef’e geçin.
   Etkileşimsiz token SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanallar** — iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp ve daha fazlası gibi yerleşik ve resmi Plugin sohbet kanalları.
5. **Daemon** — Bir LaunchAgent (macOS), systemd kullanıcı birimi (Linux/WSL2) veya kullanıcı başına Startup klasörü geri dönüşüyle yerel Windows Scheduled Task kurar.
   Token kimlik doğrulaması bir token gerektiriyorsa ve `gateway.auth.token` SecretRef tarafından yönetiliyorsa, daemon kurulumu bunu doğrular ancak çözümlenen token’ı supervisor hizmet ortamı meta verilerine kalıcı olarak yazmaz.
   Token kimlik doğrulaması bir token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenemiyorsa, daemon kurulumu uygulanabilir yönlendirmeyle engellenir.
   Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa, mod açıkça ayarlanana kadar daemon kurulumu engellenir.
6. **Sağlık denetimi** — Gateway’i başlatır ve çalıştığını doğrular.
7. **Skills** — Önerilen Skills’i ve isteğe bağlı bağımlılıkları kurar.

<Note>
İlk kurulumu yeniden çalıştırmak, açıkça **Sıfırla** seçmediğiniz (veya `--reset` geçmediğiniz) sürece hiçbir şeyi silmez.
CLI `--reset` varsayılan olarak yapılandırma, kimlik bilgileri ve oturumları kapsar; çalışma alanını dahil etmek için `--reset-scope full` kullanın.
Yapılandırma geçersizse veya eski anahtarlar içeriyorsa, ilk kurulum önce `openclaw doctor` çalıştırmanızı ister.
</Note>

**Uzak mod** yalnızca yerel istemciyi başka bir yerdeki Gateway’e bağlanacak şekilde yapılandırır.
Uzak makinede hiçbir şey kurmaz veya değiştirmez.

## Başka bir agent ekleme

Kendi çalışma alanına, oturumlarına ve kimlik doğrulama profillerine sahip ayrı bir agent oluşturmak için `openclaw agents add <name>` kullanın.
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

Ayrıntılı adım adım dökümler ve yapılandırma çıktıları için
[CLI Kurulum Başvurusu](/tr/start/wizard-cli-reference) sayfasına bakın.
Etkileşimsiz örnekler için [CLI Otomasyonu](/tr/start/wizard-cli-automation) sayfasına bakın.
RPC ayrıntıları dahil daha derin teknik başvuru için
[İlk Kurulum Başvurusu](/tr/reference/wizard) sayfasına bakın.

## İlgili belgeler

- CLI komut başvurusu: [`openclaw onboard`](/tr/cli/onboard)
- İlk kurulum genel bakışı: [İlk Kurulum Genel Bakışı](/tr/start/onboarding-overview)
- macOS uygulaması ilk kurulumu: [İlk Kurulum](/tr/start/onboarding)
- Agent ilk çalıştırma ritüeli: [Agent Başlatma](/tr/start/bootstrapping)

---
read_when:
    - CLI başlangıç kurulumunu çalıştırma veya yapılandırma
    - Yeni bir makine kurma
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI ile başlangıç: Gateway, çalışma alanı, kanallar ve Skills için rehberli kurulum'
title: İlk Kurulum (CLI)
x-i18n:
    generated_at: "2026-05-10T19:55:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6d8093f2375240f7a784b22c97c824a49b4d39b9217c0d1c0a1490bb15160700
    source_path: start/wizard.md
    workflow: 16
---

CLI ile ilk kurulum, OpenClaw'ı macOS, Linux veya Windows üzerinde
(WSL2 aracılığıyla; kesinlikle önerilir) kurmanın **önerilen** yoludur.
Tek bir rehberli akışta yerel bir Gateway veya uzak bir Gateway bağlantısının yanı sıra kanalları, Skills'i
ve çalışma alanı varsayılanlarını yapılandırır.

```bash
openclaw onboard
```

<Info>
En hızlı ilk sohbet: Control UI'ı açın (kanal kurulumu gerekmez).
`openclaw dashboard` komutunu çalıştırın ve tarayıcıda sohbet edin. Belgeler: [Dashboard](/tr/web/dashboard).
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
bir web araması adımı içerir. Bazı sağlayıcılar API anahtarı gerektirirken
bazıları anahtarsızdır. Bunu daha sonra
`openclaw configure --section web` ile de yapılandırabilirsiniz. Belgeler: [Web araçları](/tr/tools/web).
</Tip>

## Hızlı Başlangıç ve Gelişmiş

İlk kurulum **Hızlı Başlangıç** (varsayılanlar) ile **Gelişmiş** (tam denetim) seçenekleriyle başlar.

<Tabs>
  <Tab title="Hızlı Başlangıç (varsayılanlar)">
    - Yerel gateway (loopback)
    - Çalışma alanı varsayılanı (veya mevcut çalışma alanı)
    - Gateway bağlantı noktası **18789**
    - Gateway kimlik doğrulaması **Token** (loopback üzerinde bile otomatik oluşturulur)
    - Yeni yerel kurulumlar için araç ilkesi varsayılanı: `tools.profile: "coding"` (mevcut açık profil korunur)
    - DM yalıtımı varsayılanı: yerel ilk kurulum, ayarlanmamışsa `session.dmScope: "per-channel-peer"` yazar. Ayrıntılar: [CLI Kurulum Referansı](/tr/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale yayını **Kapalı**
    - Telegram + WhatsApp DM'leri varsayılan olarak **izin listesi** kullanır (telefon numaranız istenir)

  </Tab>
  <Tab title="Gelişmiş (tam denetim)">
    - Her adımı gösterir (mod, çalışma alanı, gateway, kanallar, daemon, Skills).

  </Tab>
</Tabs>

## İlk kurulumun yapılandırdıkları

**Yerel mod (varsayılan)** sizi şu adımlardan geçirir:

1. **Model/Kimlik Doğrulama** — Custom Provider dahil olmak üzere desteklenen herhangi bir sağlayıcıyı/kimlik doğrulama akışını (API anahtarı, OAuth veya sağlayıcıya özgü manuel kimlik doğrulama) seçin
   (OpenAI uyumlu, Anthropic uyumlu veya Unknown otomatik algılama). Varsayılan model seçin.
   Güvenlik notu: Bu agent araçları çalıştıracaksa veya webhook/hooks içeriğini işleyecekse mevcut en güçlü en yeni nesil modeli tercih edin ve araç ilkesini katı tutun. Daha zayıf/eski kademelere prompt enjeksiyonu yapmak daha kolaydır.
   Etkileşimsiz çalıştırmalarda `--secret-input-mode ref`, auth profillerinde düz metin API anahtarı değerleri yerine ortam destekli referansları saklar.
   Etkileşimsiz `ref` modunda sağlayıcı ortam değişkeni ayarlanmış olmalıdır; bu ortam değişkeni olmadan satır içi anahtar bayrakları geçirmek hızlıca başarısız olur.
   Etkileşimli çalıştırmalarda gizli referans modunu seçmek, kaydetmeden önce hızlı bir ön doğrulama ile bir ortam değişkenini veya yapılandırılmış bir sağlayıcı referansını (`file` veya `exec`) göstermenizi sağlar.
   Anthropic için etkileşimli ilk kurulum/yapılandırma, tercih edilen yerel yol olarak **Anthropic Claude CLI** ve önerilen üretim yolu olarak **Anthropic API key** sunar. Anthropic setup-token da desteklenen token kimlik doğrulama yolu olarak kullanılabilir kalır.
2. **Çalışma Alanı** — Agent dosyalarının konumu (varsayılan `~/.openclaw/workspace`). Önyükleme dosyalarını hazırlar.
3. **Gateway** — Bağlantı noktası, bağlama adresi, kimlik doğrulama modu, Tailscale yayını.
   Etkileşimli token modunda varsayılan düz metin token depolamayı seçin veya SecretRef'e geçin.
   Etkileşimsiz token SecretRef yolu: `--gateway-token-ref-env <ENV_VAR>`.
4. **Kanallar** — iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp ve daha fazlası gibi yerleşik ve paketlenmiş sohbet kanalları.
5. **Daemon** — Bir LaunchAgent (macOS), systemd kullanıcı birimi (Linux/WSL2) veya kullanıcı başına Başlangıç klasörü yedeğiyle yerel Windows Scheduled Task kurar.
   Token kimlik doğrulaması token gerektiriyorsa ve `gateway.auth.token` SecretRef ile yönetiliyorsa daemon kurulumu bunu doğrular ancak çözümlenen token'ı supervisor servis ortamı meta verilerine kalıcı olarak yazmaz.
   Token kimlik doğrulaması token gerektiriyorsa ve yapılandırılmış token SecretRef çözümlenemiyorsa daemon kurulumu uygulanabilir rehberlikle engellenir.
   Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa ve `gateway.auth.mode` ayarlanmamışsa daemon kurulumu, mod açıkça ayarlanana kadar engellenir.
6. **Sağlık kontrolü** — Gateway'i başlatır ve çalıştığını doğrular.
7. **Skills** — Önerilen Skills'i ve isteğe bağlı bağımlılıkları yükler.

<Note>
İlk kurulumu yeniden çalıştırmak, açıkça **Sıfırla** seçeneğini seçmediğiniz (veya `--reset` geçmediğiniz) sürece hiçbir şeyi silmez.
CLI `--reset` varsayılan olarak yapılandırma, kimlik bilgileri ve oturumları kapsar; çalışma alanını dahil etmek için `--reset-scope full` kullanın.
Yapılandırma geçersizse veya eski anahtarlar içeriyorsa ilk kurulum önce `openclaw doctor` çalıştırmanızı ister.
</Note>

**Uzak mod** yalnızca yerel istemciyi başka bir yerdeki Gateway'e bağlanacak şekilde yapılandırır.
Uzak host üzerinde hiçbir şey kurmaz veya değiştirmez.

## Başka bir agent ekleyin

Kendi çalışma alanı, oturumları ve auth profilleri olan ayrı bir agent oluşturmak için `openclaw agents add <name>` kullanın.
`--workspace` olmadan çalıştırmak ilk kurulumu başlatır.

Ayarladıkları:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Notlar:

- Varsayılan çalışma alanları `~/.openclaw/workspace-<agentId>` düzenini izler.
- Gelen mesajları yönlendirmek için `bindings` ekleyin (ilk kurulum bunu yapabilir).
- Etkileşimsiz bayraklar: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Tam referans

Ayrıntılı adım adım dökümler ve yapılandırma çıktıları için
[CLI Kurulum Referansı](/tr/start/wizard-cli-reference) bölümüne bakın.
Etkileşimsiz örnekler için [CLI Otomasyonu](/tr/start/wizard-cli-automation) bölümüne bakın.
RPC ayrıntıları dahil daha derin teknik referans için
[İlk Kurulum Referansı](/tr/reference/wizard) bölümüne bakın.

## İlgili belgeler

- CLI komut referansı: [`openclaw onboard`](/tr/cli/onboard)
- İlk kurulum genel bakışı: [İlk Kurulum Genel Bakışı](/tr/start/onboarding-overview)
- macOS uygulaması ilk kurulumu: [İlk Kurulum](/tr/start/onboarding)
- Agent ilk çalıştırma ritüeli: [Agent Önyükleme](/tr/start/bootstrapping)

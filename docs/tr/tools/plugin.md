---
read_when:
    - Eklentileri yüklerken veya yapılandırırken
    - Eklenti keşfini ve yükleme kurallarını anlamak
    - Codex/Claude uyumlu eklenti paketleriyle çalışmak
sidebarTitle: Install and Configure
summary: OpenClaw eklentilerini yükleyin, yapılandırın ve yönetin
title: Eklentiler
x-i18n:
    generated_at: "2026-04-05T14:13:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 707bd3625596f290322aeac9fecb7f4c6f45d595fdfb82ded7cbc8e04457ac7f
    source_path: tools/plugin.md
    workflow: 15
---

# Eklentiler

Eklentiler OpenClaw'ı yeni yeteneklerle genişletir: kanallar, model sağlayıcıları,
araçlar, Skills, konuşma, gerçek zamanlı transkripsiyon, gerçek zamanlı ses,
media-understanding, görüntü oluşturma, video oluşturma, web getirme, web
arama ve daha fazlası. Bazı eklentiler **çekirdek**tir (OpenClaw ile birlikte gelir),
diğerleri ise **harici**dir (topluluk tarafından npm üzerinde yayımlanır).

## Hızlı başlangıç

<Steps>
  <Step title="Nelerin yüklü olduğunu görün">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Bir eklenti yükleyin">
    ```bash
    # npm'den
    openclaw plugins install @openclaw/voice-call

    # Yerel bir dizinden veya arşivden
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Gateway'i yeniden başlatın">
    ```bash
    openclaw gateway restart
    ```

    Ardından yapılandırma dosyanızda `plugins.entries.\<id\>.config` altında yapılandırın.

  </Step>
</Steps>

Sohbet içinde yerel denetimi tercih ediyorsanız `commands.plugins: true` seçeneğini etkinleştirin ve şunları kullanın:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Yükleme yolu, CLI ile aynı çözücüyü kullanır: yerel yol/arşiv, açık
`clawhub:<pkg>` veya yalın paket tanımı (önce ClawHub, sonra npm geri dönüşü).

Yapılandırma geçersizse yükleme normalde kapalı güvenlik modeliyle başarısız olur ve sizi
`openclaw doctor --fix` komutuna yönlendirir. Tek kurtarma istisnası, şu seçeneğe katılan eklentiler için
dar kapsamlı bir paketlenmiş eklenti yeniden yükleme yoludur:
`openclaw.install.allowInvalidConfigRecovery`.

## Eklenti türleri

OpenClaw iki eklenti biçimini tanır:

| Biçim      | Nasıl çalışır                                                     | Örnekler                                               |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **Yerel**  | `openclaw.plugin.json` + çalışma zamanı modülü; işlem içinde çalışır | Resmi eklentiler, topluluk npm paketleri               |
| **Paket**  | Codex/Claude/Cursor uyumlu düzen; OpenClaw özelliklerine eşlenir  | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Her ikisi de `openclaw plugins list` altında görünür. Paket ayrıntıları için [Eklenti Paketleri](/tr/plugins/bundles) sayfasına bakın.

Yerel bir eklenti yazıyorsanız [Eklenti Geliştirme](/tr/plugins/building-plugins)
ve [Plugin SDK Genel Bakış](/tr/plugins/sdk-overview) ile başlayın.

## Resmi eklentiler

### Yüklenebilir (npm)

| Eklenti         | Paket                 | Belgeler                             |
| --------------- | --------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`    | [Matrix](/tr/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/tr/channels/msteams) |
| Nostr           | `@openclaw/nostr`     | [Nostr](/tr/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call`| [Voice Call](/tr/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`      | [Zalo](/tr/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/tr/plugins/zalouser)   |

### Çekirdek (OpenClaw ile birlikte gelir)

<AccordionGroup>
  <Accordion title="Model sağlayıcıları (varsayılan olarak etkin)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Bellek eklentileri">
    - `memory-core` — paketlenmiş bellek araması (`plugins.slots.memory` üzerinden varsayılan)
    - `memory-lancedb` — otomatik geri çağırma/yakalama ile isteğe bağlı yüklenen uzun süreli bellek (`plugins.slots.memory = "memory-lancedb"` olarak ayarlayın)
  </Accordion>

  <Accordion title="Konuşma sağlayıcıları (varsayılan olarak etkin)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Diğer">
    - `browser` — tarayıcı aracı, `openclaw browser` CLI, `browser.request` gateway yöntemi, tarayıcı çalışma zamanı ve varsayılan tarayıcı denetim hizmeti için paketlenmiş tarayıcı eklentisi (varsayılan olarak etkindir; değiştirmeden önce devre dışı bırakın)
    - `copilot-proxy` — VS Code Copilot Proxy köprüsü (varsayılan olarak devre dışı)
  </Accordion>
</AccordionGroup>

Üçüncü taraf eklentiler mi arıyorsunuz? [Topluluk Eklentileri](/tr/plugins/community) sayfasına bakın.

## Yapılandırma

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Alan            | Açıklama                                                  |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Ana anahtar (varsayılan: `true`)                          |
| `allow`          | Eklenti izin listesi (isteğe bağlı)                       |
| `deny`           | Eklenti engelleme listesi (isteğe bağlı; engelleme kazanır) |
| `load.paths`     | Ek eklenti dosyaları/dizinleri                            |
| `slots`          | Özel yuva seçicileri (ör. `memory`, `contextEngine`)      |
| `entries.\<id\>` | Eklenti başına açma/kapama + yapılandırma                 |

Yapılandırma değişiklikleri **Gateway yeniden başlatması gerektirir**. Gateway yapılandırma
izleme + işlem içi yeniden başlatma etkin şekilde çalışıyorsa (varsayılan `openclaw gateway` yolu),
bu yeniden başlatma genellikle yapılandırma yazımı tamamlandıktan kısa bir süre sonra otomatik olarak gerçekleştirilir.

<Accordion title="Eklenti durumları: devre dışı vs eksik vs geçersiz">
  - **Devre dışı**: eklenti vardır ancak etkinleştirme kuralları onu kapatmıştır. Yapılandırma korunur.
  - **Eksik**: yapılandırma, keşfin bulamadığı bir eklenti kimliğine başvurur.
  - **Geçersiz**: eklenti vardır ancak yapılandırması bildirilen şemayla eşleşmez.
</Accordion>

## Keşif ve öncelik

OpenClaw eklentileri şu sırayla tarar (ilk eşleşme kazanır):

<Steps>
  <Step title="Yapılandırma yolları">
    `plugins.load.paths` — açık dosya veya dizin yolları.
  </Step>

  <Step title="Çalışma alanı uzantıları">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` ve `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Genel uzantılar">
    `~/.openclaw/<plugin-root>/*.ts` ve `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Paketlenmiş eklentiler">
    OpenClaw ile birlikte gelir. Birçoğu varsayılan olarak etkindir (model sağlayıcıları, konuşma).
    Diğerleri açık etkinleştirme gerektirir.
  </Step>
</Steps>

### Etkinleştirme kuralları

- `plugins.enabled: false` tüm eklentileri devre dışı bırakır
- `plugins.deny` her zaman `allow` üzerinde önceliklidir
- `plugins.entries.\<id\>.enabled: false` o eklentiyi devre dışı bırakır
- Çalışma alanığı kaynaklı eklentiler varsayılan olarak **devre dışıdır** (açıkça etkinleştirilmelidir)
- Paketlenmiş eklentiler, aksi belirtilmedikçe yerleşik varsayılan açık kümesini izler
- Özel yuvalar, o yuva için seçilen eklentiyi zorla etkinleştirebilir

## Eklenti yuvaları (özel kategoriler)

Bazı kategoriler özeldir (aynı anda yalnızca biri etkin olabilir):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // veya devre dışı bırakmak için "none"
      contextEngine: "legacy", // veya bir eklenti kimliği
    },
  },
}
```

| Yuva            | Ne kontrol eder        | Varsayılan          |
| --------------- | ---------------------- | ------------------- |
| `memory`        | Etkin bellek eklentisi | `memory-core`       |
| `contextEngine` | Etkin bağlam motoru    | `legacy` (yerleşik) |

## CLI başvurusu

```bash
openclaw plugins list                       # kompakt envanter
openclaw plugins list --enabled            # yalnızca yüklü eklentiler
openclaw plugins list --verbose            # eklenti başına ayrıntı satırları
openclaw plugins list --json               # makine tarafından okunabilir envanter
openclaw plugins inspect <id>              # derin ayrıntı
openclaw plugins inspect <id> --json       # makine tarafından okunabilir
openclaw plugins inspect --all             # tüm filoya ait tablo
openclaw plugins info <id>                 # inspect takma adı
openclaw plugins doctor                    # tanılama

openclaw plugins install <package>         # yükle (önce ClawHub, sonra npm)
openclaw plugins install clawhub:<pkg>     # yalnızca ClawHub'dan yükle
openclaw plugins install <spec> --force    # mevcut yüklemenin üzerine yaz
openclaw plugins install <path>            # yerel yoldan yükle
openclaw plugins install -l <path>         # geliştirme için bağla (kopyalama yok)
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # tam çözümlenen npm tanımını kaydet
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id>             # tek bir eklentiyi güncelle
openclaw plugins update <id> --dangerously-force-unsafe-install
openclaw plugins update --all            # tümünü güncelle
openclaw plugins uninstall <id>          # yapılandırma/yükleme kayıtlarını kaldır
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Paketlenmiş eklentiler OpenClaw ile birlikte gelir. Birçoğu varsayılan olarak etkindir (örneğin
paketlenmiş model sağlayıcıları, paketlenmiş konuşma sağlayıcıları ve paketlenmiş tarayıcı
eklentesi). Diğer paketlenmiş eklentiler yine de `openclaw plugins enable <id>` gerektirir.

`--force`, mevcut yüklü bir eklentinin veya hook paketinin üzerine yerinde yazar.
Kaynak yolu yönetilen bir yükleme hedefine kopyalamak yerine yeniden kullanan
`--link` ile desteklenmez.

`--pin` yalnızca npm içindir. `--marketplace` ile desteklenmez, çünkü
pazar yeri yüklemeleri npm tanımı yerine pazar yeri kaynak meta verisini kalıcı olarak saklar.

`--dangerously-force-unsafe-install`, yerleşik tehlikeli kod tarayıcısındaki yanlış
pozitifler için cam kırma amaçlı bir geçersiz kılmadır. Eklenti yükleme ve
eklenti güncelleme işlemlerinin yerleşik `critical` bulgularını aşarak devam etmesine izin verir, ancak
eklenti `before_install` ilke bloklarını veya tarama başarısızlığına dayalı engellemeyi yine de atlamaz.

Bu CLI bayrağı yalnızca eklenti yükleme/güncelleme akışlarına uygulanır. Gateway destekli skill
bağımlılık yüklemeleri bunun yerine eşleşen `dangerouslyForceUnsafeInstall` istek
geçersiz kılmasını kullanır; `openclaw skills install` ise ayrı ClawHub
skill indirme/yükleme akışı olmaya devam eder.

Uyumlu paketler aynı eklenti listeleme/inceleme/etkinleştirme/devre dışı bırakma
akışına katılır. Mevcut çalışma zamanı desteği; paket skill'leri, Claude komut-skill'leri,
Claude `settings.json` varsayılanları, Claude `.lsp.json` ve manifest tarafından bildirilen
`lspServers` varsayılanları, Cursor komut-skill'leri ve uyumlu Codex hook
dizinlerini içerir.

`openclaw plugins inspect <id>` ayrıca algılanan paket yeteneklerini ve
paket destekli eklentiler için desteklenen veya desteklenmeyen MCP ve LSP sunucusu girdilerini de raporlar.

Pazar yeri kaynakları şu biçimlerden biri olabilir:
`~/.claude/plugins/known_marketplaces.json` içinden bir Claude bilinen pazar yeri adı,
yerel bir pazar yeri kökü veya `marketplace.json` yolu, `owner/repo` gibi bir GitHub kısa yazımı,
bir GitHub depo URL'si veya bir git URL'si. Uzak pazar yerleri için eklenti girdileri
klonlanan pazar yeri deposunun içinde kalmalı ve yalnızca göreli yol kaynaklarını kullanmalıdır.

Tam ayrıntılar için [`openclaw plugins` CLI başvurusu](/cli/plugins) sayfasına bakın.

## Eklenti API genel bakışı

Yerel eklentiler, `register(api)` metodunu açığa çıkaran bir giriş nesnesi dışa aktarır. Daha eski
eklentiler hâlâ eski bir takma ad olarak `activate(api)` kullanabilir, ancak yeni eklentiler
`register` kullanmalıdır.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw giriş nesnesini yükler ve eklenti etkinleştirmesi sırasında `register(api)` çağrısını yapar.
Yükleyici eski eklentiler için hâlâ `activate(api)` yöntemine geri döner,
ancak paketlenmiş eklentiler ve yeni harici eklentiler `register` yöntemini
genel sözleşme olarak kabul etmelidir.

Yaygın kayıt yöntemleri:

| Yöntem                                  | Ne kaydeder                |
| --------------------------------------- | -------------------------- |
| `registerProvider`                      | Model sağlayıcısı (LLM)    |
| `registerChannel`                       | Sohbet kanalı              |
| `registerTool`                          | Aracı aracı                |
| `registerHook` / `on(...)`              | Yaşam döngüsü hook'ları    |
| `registerSpeechProvider`                | Metinden sese / STT        |
| `registerRealtimeTranscriptionProvider` | Akış tabanlı STT           |
| `registerRealtimeVoiceProvider`         | Çift yönlü gerçek zamanlı ses |
| `registerMediaUnderstandingProvider`    | Görüntü/ses analizi        |
| `registerImageGenerationProvider`       | Görüntü oluşturma          |
| `registerVideoGenerationProvider`       | Video oluşturma            |
| `registerWebFetchProvider`              | Web getirme / kazıma sağlayıcısı |
| `registerWebSearchProvider`             | Web arama                  |
| `registerHttpRoute`                     | HTTP uç noktası            |
| `registerCommand` / `registerCli`       | CLI komutları              |
| `registerContextEngine`                 | Bağlam motoru              |
| `registerService`                       | Arka plan hizmeti          |

Türlenmiş yaşam döngüsü hook'ları için hook koruma davranışı:

- `before_tool_call`: `{ block: true }` nihaidir; daha düşük öncelikli işleyiciler atlanır.
- `before_tool_call`: `{ block: false }` etkisizdir ve daha önceki bir engeli kaldırmaz.
- `before_install`: `{ block: true }` nihaidir; daha düşük öncelikli işleyiciler atlanır.
- `before_install`: `{ block: false }` etkisizdir ve daha önceki bir engeli kaldırmaz.
- `message_sending`: `{ cancel: true }` nihaidir; daha düşük öncelikli işleyiciler atlanır.
- `message_sending`: `{ cancel: false }` etkisizdir ve daha önceki bir iptali kaldırmaz.

Tam türlenmiş hook davranışı için [SDK Genel Bakış](/tr/plugins/sdk-overview#hook-decision-semantics) sayfasına bakın.

## İlgili

- [Eklenti Geliştirme](/tr/plugins/building-plugins) — kendi eklentinizi oluşturun
- [Eklenti Paketleri](/tr/plugins/bundles) — Codex/Claude/Cursor paket uyumluluğu
- [Eklenti Manifesti](/tr/plugins/manifest) — manifest şeması
- [Araç Kaydetme](/tr/plugins/building-plugins#registering-agent-tools) — bir eklentiye aracı araçları ekleyin
- [Eklenti Dahili Yapısı](/tr/plugins/architecture) — yetenek modeli ve yükleme hattı
- [Topluluk Eklentileri](/tr/plugins/community) — üçüncü taraf listeleri

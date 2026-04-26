---
read_when:
    - OpenClaw'ın hangi araçları sağladığını anlamak istiyorsunuz
    - Araçları yapılandırmanız, izin vermeniz veya reddetmeniz gerekiyor
    - Yerleşik araçlar, Skills ve Plugin'ler arasında karar veriyorsunuz
summary: 'OpenClaw araçları ve Plugin''lerine genel bakış: ajanın neler yapabildiği ve nasıl genişletileceği'
title: Araçlar ve Plugin'ler
x-i18n:
    generated_at: "2026-04-26T11:42:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47cc0e2de5688328f7c11fcf86c0a2262b488c277f48416f584f5c7913f750c4
    source_path: tools/index.md
    workflow: 15
---

Ajanın metin üretmenin ötesinde yaptığı her şey **araçlar** üzerinden olur.
Araçlar, ajanın dosya okumasını, komut çalıştırmasını, web'de gezinmesini, mesaj
göndermesini ve cihazlarla etkileşime girmesini sağlar.

## Araçlar, Skills ve Plugin'ler

OpenClaw birlikte çalışan üç katmana sahiptir:

<Steps>
  <Step title="Araçlar ajanın çağırdığı şeydir">
    Araç, ajanın çağırabildiği türlenmiş bir işlevdir (ör. `exec`, `browser`,
    `web_search`, `message`). OpenClaw bir dizi **yerleşik araç** ile gelir ve
    Plugin'ler ek araçlar kaydedebilir.

    Ajan araçları, model API'ye gönderilen yapılandırılmış işlev tanımları olarak görür.

  </Step>

  <Step title="Skills ajana ne zaman ve nasıl kullanılacağını öğretir">
    Skill, sistem istemine eklenen bir markdown dosyasıdır (`SKILL.md`).
    Skills, ajana araçları etkili şekilde kullanması için bağlam, kısıtlar ve
    adım adım rehberlik sağlar. Skills çalışma alanınızda, paylaşılan
    klasörlerde bulunur veya Plugin'lerin içinde gelir.

    [Skills reference](/tr/tools/skills) | [Creating skills](/tr/tools/creating-skills)

  </Step>

  <Step title="Plugin'ler her şeyi birlikte paketler">
    Plugin, herhangi bir yetenek kombinasyonunu kaydedebilen bir pakettir:
    kanallar, model sağlayıcıları, araçlar, Skills, konuşma, gerçek zamanlı transkripsiyon,
    gerçek zamanlı ses, medya anlama, görsel üretimi, video üretimi,
    web fetch, web search ve daha fazlası. Bazı Plugin'ler **çekirdek**tir
    (OpenClaw ile gelir), diğerleri **harici**dir (topluluk tarafından npm'de yayımlanır).

    [Install and configure plugins](/tr/tools/plugin) | [Build your own](/tr/plugins/building-plugins)

  </Step>
</Steps>

## Yerleşik araçlar

Bu araçlar OpenClaw ile gelir ve herhangi bir Plugin kurmadan kullanılabilir:

| Araç                                       | Ne yapar                                                             | Sayfa                                                        |
| ------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Shell komutları çalıştırır, arka plan süreçlerini yönetir            | [Exec](/tr/tools/exec), [Exec Approvals](/tr/tools/exec-approvals) |
| `code_execution`                           | Sandbox içinde uzak Python analizi çalıştırır                        | [Code Execution](/tr/tools/code-execution)                      |
| `browser`                                  | Bir Chromium tarayıcısını denetler (gezinme, tıklama, ekran görüntüsü) | [Browser](/tr/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Web'de arama yapar, X gönderilerinde arama yapar, sayfa içeriği alır | [Web](/tr/tools/web), [Web Fetch](/tr/tools/web-fetch)             |
| `read` / `write` / `edit`                  | Çalışma alanında dosya G/Ç                                           |                                                              |
| `apply_patch`                              | Çok parçalı dosya yamaları                                           | [Apply Patch](/tr/tools/apply-patch)                            |
| `message`                                  | Tüm kanallarda mesaj gönderir                                        | [Agent Send](/tr/tools/agent-send)                              |
| `canvas`                                   | Node Canvas'ı sürer (sunum, eval, snapshot)                          |                                                              |
| `nodes`                                    | Eşleştirilmiş cihazları keşfeder ve hedefler                         |                                                              |
| `cron` / `gateway`                         | Zamanlanmış işleri yönetir; gateway'i inceler, yamalar, yeniden başlatır veya günceller |                                                              |
| `image` / `image_generate`                 | Görselleri analiz eder veya üretir                                   | [Image Generation](/tr/tools/image-generation)                  |
| `music_generate`                           | Müzik parçaları üretir                                               | [Music Generation](/tr/tools/music-generation)                  |
| `video_generate`                           | Videolar üretir                                                      | [Video Generation](/tr/tools/video-generation)                  |
| `tts`                                      | Tek seferlik metinden konuşmaya dönüştürme                           | [TTS](/tr/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Oturum yönetimi, durum ve alt-ajan orkestrasyonu                     | [Sub-agents](/tr/tools/subagents)                               |
| `session_status`                           | Hafif `/status` tarzı geri okuma ve oturum model geçersiz kılması    | [Session Tools](/tr/concepts/session-tool)                      |

Görsel işleri için analizde `image`, üretim veya düzenlemede `image_generate` kullanın. `openai/*`, `google/*`, `fal/*` veya varsayılan olmayan başka bir görsel sağlayıcısını hedeflerseniz, önce o sağlayıcının auth/API anahtarını yapılandırın.

Müzik işleri için `music_generate` kullanın. `google/*`, `minimax/*` veya varsayılan olmayan başka bir müzik sağlayıcısını hedeflerseniz, önce o sağlayıcının auth/API anahtarını yapılandırın.

Video işleri için `video_generate` kullanın. `qwen/*` veya varsayılan olmayan başka bir video sağlayıcısını hedeflerseniz, önce o sağlayıcının auth/API anahtarını yapılandırın.

İş akışı odaklı ses üretimi için ComfyUI gibi bir Plugin bunu kaydettiğinde
`music_generate` kullanın. Bu, metinden konuşmaya olan `tts` seçeneğinden ayrıdır.

`session_status`, oturumlar grubundaki hafif durum/geri okuma aracıdır.
Geçerli oturum hakkında `/status` tarzı soruları yanıtlar ve
isteğe bağlı olarak oturum başına model geçersiz kılması ayarlayabilir; `model=default`
bu geçersiz kılmayı temizler. `/status` gibi, en son transkript kullanım girdisinden
seyrek token/cache sayaçlarını ve etkin çalışma zamanı model etiketini doldurabilir.

`gateway`, gateway işlemleri için yalnızca sahibine açık çalışma zamanı aracıdır:

- Düzenlemelerden önce yol kapsamlı bir yapılandırma alt ağacı için `config.schema.lookup`
- Geçerli yapılandırma anlık görüntüsü + hash için `config.get`
- Yeniden başlatmalı kısmi yapılandırma güncellemeleri için `config.patch`
- Yalnızca tam yapılandırma değiştirme için `config.apply`
- Açık kendi kendini güncelleme + yeniden başlatma için `update.run`

Kısmi değişiklikler için `config.schema.lookup`, ardından `config.patch` tercih edin.
`config.apply` yalnızca tüm yapılandırmayı bilerek değiştirdiğinizde kullanılmalıdır.
Daha geniş yapılandırma belgeleri için [Configuration](/tr/gateway/configuration) ve
[Configuration reference](/tr/gateway/configuration-reference) belgelerine bakın.
Araç ayrıca `tools.exec.ask` veya `tools.exec.security` değerlerini değiştirmeyi reddeder;
eski `tools.bash.*` takma adları aynı korumalı exec yollarına normalleştirilir.

### Plugin tarafından sağlanan araçlar

Plugin'ler ek araçlar kaydedebilir. Bazı örnekler:

- [Diffs](/tr/tools/diffs) — diff görüntüleyici ve oluşturucu
- [LLM Task](/tr/tools/llm-task) — yapılandırılmış çıktı için yalnızca JSON LLM adımı
- [Lobster](/tr/tools/lobster) — sürdürülebilir onaylarla türlenmiş iş akışı çalışma zamanı
- [Music Generation](/tr/tools/music-generation) — iş akışı destekli sağlayıcılarla paylaşılan `music_generate` aracı
- [OpenProse](/tr/prose) — markdown öncelikli iş akışı orkestrasyonu
- [Tokenjuice](/tr/tools/tokenjuice) — gürültülü `exec` ve `bash` araç sonuçlarını sıkıştırır

## Araç yapılandırması

### İzin ve ret listeleri

Ajanın hangi araçları çağırabileceğini yapılandırmada `tools.allow` / `tools.deny`
ile denetleyin. Ret her zaman izne üstün gelir.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw, açık bir izin listesi çağrılabilir hiçbir araca çözülmediğinde kapalı şekilde başarısız olur.
Örneğin `tools.allow: ["query_db"]` yalnızca yüklü bir Plugin gerçekten
`query_db` kaydediyorsa çalışır. Hiçbir yerleşik, Plugin veya paketlenmiş MCP aracı
izin listesiyle eşleşmezse çalışma, model çağrısından önce durur; araç sonuçlarını
halüsinasyonla uydurabilecek salt metin çalışmasına devam etmez.

### Araç profilleri

`tools.profile`, `allow`/`deny` uygulanmadan önce temel bir izin listesi ayarlar.
Ajan başına geçersiz kılma: `agents.list[].tools.profile`.

| Profil      | İçerdikleri                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `full`      | Kısıtlama yoktur (ayarlanmamışla aynıdır)                                                                                                        |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                       |
| `minimal`   | Yalnızca `session_status`                                                                                                                        |

`coding`, hafif web araçlarını (`web_search`, `web_fetch`, `x_search`)
içerir ama tam tarayıcı denetim aracını içermez. Tarayıcı otomasyonu gerçek
oturumları ve oturum açmış profilleri sürebilir; bu yüzden bunu açıkça
`tools.alsoAllow: ["browser"]` veya ajan başına
`agents.list[].tools.alsoAllow: ["browser"]` ile ekleyin.

`coding` ve `messaging` profilleri ayrıca Plugin anahtarı `bundle-mcp`
altındaki yapılandırılmış paket MCP araçlarına da izin verir. Profilin normal
yerleşik araçlarını koruyup tüm yapılandırılmış MCP araçlarını gizlemesini
istediğinizde `tools.deny: ["bundle-mcp"]` ekleyin.
`minimal` profili paket MCP araçlarını içermez.

### Araç grupları

İzin/ret listelerinde `group:*` kısayollarını kullanın:

| Grup               | Araçlar                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash`, `exec` için bir takma ad olarak kabul edilir)                    |
| `group:fs`         | read, write, edit, apply_patch                                                                           |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                |
| `group:web`        | web_search, x_search, web_fetch                                                                          |
| `group:ui`         | browser, canvas                                                                                          |
| `group:automation` | cron, gateway                                                                                            |
| `group:messaging`  | message                                                                                                  |
| `group:nodes`      | nodes                                                                                                    |
| `group:agents`     | agents_list                                                                                              |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                               |
| `group:openclaw`   | Tüm yerleşik OpenClaw araçları (Plugin araçları hariç)                                                   |

`sessions_history`, sınırlandırılmış ve güvenlik filtresinden geçirilmiş bir
geri çağırma görünümü döndürür. Düşünme etiketlerini, `<relevant-memories>`
iskeletini, düz metin araç çağrısı XML yüklerini
(``<tool_call>...</tool_call>``,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` ve kırpılmış araç çağrısı blokları dahil),
düşürülmüş araç çağrısı iskeletini, sızmış ASCII/tam genişlikli model kontrol
token'larını ve bozuk MiniMax araç çağrısı XML'ini asistan metninden kaldırır;
ardından ham transkript dökümü gibi davranmak yerine redaksiyon/kırpma ve
gerekirse aşırı büyük satır yer tutucuları uygular.

### Sağlayıcıya özgü kısıtlamalar

Genel varsayılanları değiştirmeden belirli sağlayıcılar için araçları
kısıtlamak amacıyla `tools.byProvider` kullanın:

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```

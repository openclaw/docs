---
read_when:
    - OpenClaw'ın hangi araçları sağladığını anlamak istiyorsunuz
    - Araçları yapılandırmanız, izin vermeniz veya reddetmeniz gerekir
    - Yerleşik araçlar, Skills ve Plugin'ler arasında seçim yapıyorsunuz
summary: 'OpenClaw araçları ve Plugin''lerine genel bakış: ajanın neler yapabileceği ve nasıl genişletileceği'
title: Araçlar ve Pluginler
x-i18n:
    generated_at: "2026-05-10T19:57:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: b12b2d605c8fccb0de378f8a63fb92b8c3bad8abd3edf10bb79632d6ef6089fd
    source_path: tools/index.md
    workflow: 16
---

Aracının metin üretmenin ötesinde yaptığı her şey **araçlar** üzerinden gerçekleşir.
Araçlar, aracının dosya okumasını, komut çalıştırmasını, web’de gezinmesini, ileti
göndermesini ve cihazlarla etkileşime geçmesini sağlar.

## Araçlar, Skills ve Plugin’ler

OpenClaw birlikte çalışan üç katmana sahiptir:

<Steps>
  <Step title="Araçlar, aracının çağırdığı şeylerdir">
    Araç, aracının çağırabileceği tiplendirilmiş bir işlevdir (örn. `exec`, `browser`,
    `web_search`, `message`). OpenClaw bir dizi **yerleşik araç** ile gelir ve
    Plugin’ler ek araçlar kaydedebilir.

    Aracı, araçları model API’sine gönderilen yapılandırılmış işlev tanımları olarak görür.

  </Step>

  <Step title="Skills aracıya ne zaman ve nasıl yapılacağını öğretir">
    Skill, sistem istemine enjekte edilen bir markdown dosyasıdır (`SKILL.md`).
    Skills, araçları etkili şekilde kullanmak için aracıya bağlam, kısıtlar ve
    adım adım rehberlik sağlar. Skills çalışma alanınızda, paylaşılan klasörlerde
    bulunur veya Plugin’lerin içinde gelir.

    [Skills referansı](/tr/tools/skills) | [Skills oluşturma](/tr/tools/creating-skills)

  </Step>

  <Step title="Plugin’ler her şeyi birlikte paketler">
    Plugin, şu yeteneklerin herhangi bir birleşimini kaydedebilen bir pakettir:
    kanallar, model sağlayıcıları, araçlar, Skills, konuşma, gerçek zamanlı transkripsiyon,
    gerçek zamanlı ses, medya anlama, görüntü üretimi, video üretimi,
    web getirme, web arama ve daha fazlası. Bazı Plugin’ler **çekirdektir** (OpenClaw ile
    birlikte gelir), diğerleri **haricidir** (topluluk tarafından npm’de yayımlanır).

    [Plugin’leri kurun ve yapılandırın](/tr/tools/plugin) | [Kendi Plugin’inizi oluşturun](/tr/plugins/building-plugins)

  </Step>
</Steps>

## Yerleşik araçlar

Bu araçlar OpenClaw ile birlikte gelir ve herhangi bir Plugin kurmadan kullanılabilir:

| Araç                                      | Ne yapar                                                              | Sayfa                                                        |
| ----------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                        | Kabuk komutlarını çalıştırır, arka plan süreçlerini yönetir           | [Exec](/tr/tools/exec), [Exec Onayları](/tr/tools/exec-approvals)  |
| `code_execution`                          | Sandbox’ta uzaktan Python analizi çalıştırır                          | [Kod Yürütme](/tr/tools/code-execution)                         |
| `browser`                                 | Chromium tarayıcıyı kontrol eder (gezinme, tıklama, ekran görüntüsü)  | [Tarayıcı](/tr/tools/browser)                                   |
| `web_search` / `x_search` / `web_fetch`   | Web’de arama yapar, X gönderilerini arar, sayfa içeriğini getirir     | [Web](/tr/tools/web), [Web Getirme](/tr/tools/web-fetch)           |
| `read` / `write` / `edit`                 | Çalışma alanında dosya G/Ç                                             |                                                              |
| `apply_patch`                             | Çok parçalı dosya yamaları                                            | [Yama Uygula](/tr/tools/apply-patch)                            |
| `message`                                 | Tüm kanallar üzerinden ileti gönderir                                 | [Aracı Gönderimi](/tr/tools/agent-send)                         |
| `nodes`                                   | Eşleştirilmiş cihazları keşfeder ve hedefler                          |                                                              |
| `cron` / `gateway`                        | Zamanlanmış işleri yönetir; gateway’i inceler, yamalar, yeniden başlatır veya günceller |                                                              |
| `image` / `image_generate`                | Görüntüleri analiz eder veya üretir                                   | [Görüntü Üretimi](/tr/tools/image-generation)                   |
| `music_generate`                          | Müzik parçaları üretir                                                | [Müzik Üretimi](/tr/tools/music-generation)                     |
| `video_generate`                          | Videolar üretir                                                       | [Video Üretimi](/tr/tools/video-generation)                     |
| `tts`                                     | Tek seferlik metinden konuşmaya dönüştürme                            | [TTS](/tr/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Oturum yönetimi, durum ve alt aracı orkestrasyonu                     | [Alt aracılar](/tr/tools/subagents)                             |
| `session_status`                          | Hafif `/status` tarzı geri okuma ve oturum modeli geçersiz kılma      | [Oturum Araçları](/tr/concepts/session-tool)                    |

Görüntü çalışmaları için analizde `image`, üretim veya düzenlemede `image_generate` kullanın. `openai/*`, `google/*`, `fal/*` veya varsayılan olmayan başka bir görüntü sağlayıcısını hedefliyorsanız, önce o sağlayıcının kimlik doğrulamasını/API anahtarını yapılandırın.

Müzik çalışmaları için `music_generate` kullanın. `google/*`, `minimax/*` veya varsayılan olmayan başka bir müzik sağlayıcısını hedefliyorsanız, önce o sağlayıcının kimlik doğrulamasını/API anahtarını yapılandırın.

Video çalışmaları için `video_generate` kullanın. `qwen/*` veya varsayılan olmayan başka bir video sağlayıcısını hedefliyorsanız, önce o sağlayıcının kimlik doğrulamasını/API anahtarını yapılandırın.

İş akışı odaklı ses üretimi için, ComfyUI gibi bir Plugin bunu kaydettiğinde
`music_generate` kullanın. Bu, metinden konuşmaya dönüştürme olan `tts`’den ayrıdır.

`sessions` grubundaki hafif durum/geri okuma aracı `session_status`’tır.
Geçerli oturum hakkında `/status` tarzı soruları yanıtlar ve isteğe bağlı olarak
oturum başına model geçersiz kılması ayarlayabilir; `model=default` bu
geçersiz kılmayı temizler. `/status` gibi, son transkript kullanım girdisinden
seyrek token/önbellek sayaçlarını ve etkin çalışma zamanı model etiketini geriye dönük doldurabilir.

`gateway`, gateway işlemleri için yalnızca sahibin kullanabildiği çalışma zamanı aracıdır:

- Düzenlemelerden önce tek bir yol kapsamlı yapılandırma alt ağacı için `config.schema.lookup`
- Geçerli yapılandırma anlık görüntüsü + hash için `config.get`
- Yeniden başlatmayla kısmi yapılandırma güncellemeleri için `config.patch`
- Yalnızca tam yapılandırma değişimi için `config.apply`
- Açık self-update + yeniden başlatma için `update.run`

Kısmi değişikliklerde `config.schema.lookup`, ardından `config.patch` tercih edin. `config.apply`’ı
yalnızca tüm yapılandırmayı bilinçli olarak değiştirdiğinizde kullanın.
Daha geniş yapılandırma belgeleri için [Yapılandırma](/tr/gateway/configuration) ve
[Yapılandırma referansı](/tr/gateway/configuration-reference) sayfalarını okuyun.
Araç ayrıca `tools.exec.ask` veya `tools.exec.security` değerlerini değiştirmeyi reddeder;
eski `tools.bash.*` takma adları aynı korunan exec yollarına normalleştirilir.

### Plugin tarafından sağlanan araçlar

Plugin’ler ek araçlar kaydedebilir. Bazı örnekler:

- [Canvas](/tr/plugins/reference/canvas) — node Canvas kontrolü ve A2UI işleme için deneysel yerleşik Plugin
- [Diffs](/tr/tools/diffs) — diff görüntüleyici ve işleyici
- [LLM Görevi](/tr/tools/llm-task) — yapılandırılmış çıktı için yalnızca JSON LLM adımı
- [Lobster](/tr/tools/lobster) — sürdürülebilir onaylara sahip tiplendirilmiş iş akışı çalışma zamanı
- [Müzik Üretimi](/tr/tools/music-generation) — iş akışı destekli sağlayıcılara sahip paylaşılan `music_generate` aracı
- [OpenProse](/tr/prose) — markdown öncelikli iş akışı orkestrasyonu
- [Tokenjuice](/tr/tools/tokenjuice) — gürültülü `exec` ve `bash` araç sonuçlarını kompaktlaştırır

Plugin araçları yine de `api.registerTool(...)` ile yazılır ve
Plugin manifestinin `contracts.tools` listesinde bildirilir. OpenClaw, keşif sırasında
doğrulanmış araç tanımlayıcısını yakalar ve Plugin kaynağı ile sözleşmeye göre önbelleğe alır; böylece
sonraki araç planlaması Plugin çalışma zamanı yüklemesini atlayabilir. Araç yürütme yine de
sahip Plugin’i yükler ve canlı kayıtlı uygulamayı çağırır.

[Tool Search](/tr/tools/tool-search), büyük kataloglar için kompakt yüzeydir.
Her OpenClaw, MCP veya istemci aracı şemasını isteme koymak yerine,
OpenClaw modele `openclaw.tools.search`, `openclaw.tools.describe` ve
`openclaw.tools.call` içeren yalıtılmış bir Node çalışma zamanı verebilir.
Çağrılar yine Gateway üzerinden geri akar; böylece araç politikası,
onaylar, kancalar ve oturum günlükleri yetkili kalır.

## Araç yapılandırması

### İzin ve reddetme listeleri

Aracının hangi araçları çağırabileceğini yapılandırmadaki `tools.allow` / `tools.deny` ile
kontrol edin. Reddetme her zaman izinden üstündür.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw, açık bir izin listesi çağrılabilir hiçbir araca çözülmediğinde kapalı başarısız olur.
Örneğin, `tools.allow: ["query_db"]` yalnızca yüklenmiş bir Plugin gerçekten
`query_db` kaydediyorsa çalışır. İzin listesiyle eşleşen yerleşik, Plugin veya
yerleşik MCP aracı yoksa, çalışma model çağrısından önce durur; araç sonuçlarını
uydurabilecek metin-only bir çalışma olarak devam etmez.

### Araç profilleri

`tools.profile`, `allow`/`deny` uygulanmadan önce temel bir izin listesi ayarlar.
Aracı başına geçersiz kılma: `agents.list[].tools.profile`.

| Profil      | İçerdikleri                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Tüm çekirdek ve isteğe bağlı Plugin araçları; daha geniş komut/kontrol erişimi için kısıtsız temel                                               |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Yalnızca `session_status`                                                                                                                         |

<Note>
`tools.profile: "messaging"` kanal odaklı aracılar için bilinçli olarak dardır.
Dosya sistemi, çalışma zamanı, tarayıcı, canvas, düğümler, cron ve gateway kontrolü gibi
daha geniş komut/kontrol araçlarını dışarıda bırakır. Daha geniş komut/kontrol erişimi için
kısıtsız temel olarak `tools.profile: "full"` kullanın, ardından gerektiğinde
erişimi `tools.allow` / `tools.deny` ile daraltın.
</Note>

`coding` hafif web araçlarını (`web_search`, `web_fetch`, `x_search`) içerir,
ancak tam tarayıcı kontrol aracını içermez. Tarayıcı otomasyonu gerçek
oturumları ve oturum açılmış profilleri sürebilir; bu nedenle bunu
`tools.alsoAllow: ["browser"]` veya aracı başına
`agents.list[].tools.alsoAllow: ["browser"]` ile açıkça ekleyin.

<Note>
Kısıtlayıcı bir profil (`messaging`, `minimal`) altında `tools.exec` veya `tools.fs` yapılandırmak, profilin izin listesini örtük olarak genişletmez. Kısıtlayıcı bir profilin bu yapılandırılmış bölümleri kullanmasını istediğinizde açık `tools.alsoAllow` girdileri ekleyin (exec için örneğin `["exec", "process"]` veya fs için `["read", "write", "edit"]`). Bir yapılandırma bölümü eşleşen `alsoAllow` izni olmadan mevcut olduğunda OpenClaw başlangıçta bir uyarı günlüğe yazar.
</Note>

`coding` ve `messaging` profilleri, `bundle-mcp` Plugin anahtarı altında
yapılandırılmış bundle MCP araçlarına da izin verir. Bir profilin normal
yerleşiklerini koruyup yapılandırılmış tüm MCP araçlarını gizlemesini istediğinizde
`tools.deny: ["bundle-mcp"]` ekleyin. `minimal` profili bundle MCP araçlarını içermez.

Örnek (varsayılan olarak en geniş araç yüzeyi):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### Araç grupları

İzin/reddetme listelerinde `group:*` kısaltmalarını kullanın:

| Grup               | Araçlar                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash`, `exec` için bir takma ad olarak kabul edilir)                       |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | paketle gelen Canvas Plugin etkin olduğunda browser, canvas                                               |
| `group:automation` | heartbeat_respond, cron, gateway                                                                          |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list, update_plan                                                                                  |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Tüm yerleşik OpenClaw araçları (Plugin araçları hariç)                                                    |

`sessions_history` sınırlı, güvenlik filtresinden geçirilmiş bir hatırlama görünümü döndürür. Ham bir konuşma dökümü gibi davranmak yerine, düşünme etiketlerini, `<relevant-memories>` iskeletini, düz metin araç çağrısı XML
yüklerini (`<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` ve kesilmiş araç çağrısı blokları dahil),
indirgenmiş araç çağrısı iskeletini, sızmış ASCII/tam genişlikli model kontrol
belirteçlerini ve yardımcı metninden hatalı biçimlendirilmiş MiniMax araç çağrısı XML'ini çıkarır; ardından
redaksiyon/kesme uygular ve gerekirse aşırı büyük satır yer tutucuları kullanır.

### Sağlayıcıya özel kısıtlamalar

Genel varsayılanları değiştirmeden belirli sağlayıcılar için araçları kısıtlamak üzere `tools.byProvider` kullanın:

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

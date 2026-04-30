---
read_when:
    - OpenClaw'ın sunduğu araçları anlamak istiyorsunuz
    - Araçları yapılandırmanız, izin vermeniz veya reddetmeniz gerekir
    - Yerleşik araçlar, Skills ve Plugin'ler arasında karar veriyorsunuz
summary: 'OpenClaw araçları ve Plugin''lerine genel bakış: ajan neler yapabilir ve nasıl genişletilir'
title: Araçlar ve Pluginler
x-i18n:
    generated_at: "2026-04-30T09:49:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62cde740188c224af03b4425c7f6dfca9a12f95603066db5925724fc6a07dcf0
    source_path: tools/index.md
    workflow: 16
---

Aracın metin üretmenin ötesinde yaptığı her şey **araçlar** üzerinden gerçekleşir.
Araçlar, aracının dosyaları okumasını, komutları çalıştırmasını, web'de gezinmesini,
mesaj göndermesini ve cihazlarla etkileşime girmesini sağlar.

## Araçlar, Skills ve Plugin'ler

OpenClaw birlikte çalışan üç katmana sahiptir:

<Steps>
  <Step title="Araçlar, aracının çağırdığı şeylerdir">
    Bir araç, aracının çağırabileceği tiplendirilmiş bir fonksiyondur (ör. `exec`, `browser`,
    `web_search`, `message`). OpenClaw bir dizi **yerleşik araç** ile gelir ve
    Plugin'ler ek araçlar kaydedebilir.

    Aracı, araçları model API'sine gönderilen yapılandırılmış fonksiyon tanımları olarak görür.

  </Step>

  <Step title="Skills, aracıya ne zaman ve nasıl yapılacağını öğretir">
    Bir skill, sistem istemine enjekte edilen bir markdown dosyasıdır (`SKILL.md`).
    Skills, aracıya araçları etkili şekilde kullanması için bağlam, kısıtlar ve
    adım adım rehberlik sağlar. Skills çalışma alanınızda, paylaşılan klasörlerde
    bulunur veya Plugin'lerin içinde gelir.

    [Skills başvurusu](/tr/tools/skills) | [Skills oluşturma](/tr/tools/creating-skills)

  </Step>

  <Step title="Plugin'ler her şeyi birlikte paketler">
    Bir Plugin, şu yeteneklerin herhangi bir kombinasyonunu kaydedebilen bir pakettir:
    kanallar, model sağlayıcıları, araçlar, Skills, konuşma, gerçek zamanlı transkripsiyon,
    gerçek zamanlı ses, medya anlama, görüntü üretimi, video üretimi,
    web getirme, web araması ve daha fazlası. Bazı Plugin'ler **çekirdek**tir
    (OpenClaw ile birlikte gelir), diğerleri **harici**dir (topluluk tarafından npm'de yayımlanır).

    [Plugin'leri kurun ve yapılandırın](/tr/tools/plugin) | [Kendi Plugin'inizi oluşturun](/tr/plugins/building-plugins)

  </Step>
</Steps>

## Yerleşik araçlar

Bu araçlar OpenClaw ile birlikte gelir ve herhangi bir Plugin kurmadan kullanılabilir:

| Araç                                      | Ne yapar                                                              | Sayfa                                                        |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Kabuk komutlarını çalıştırır, arka plan süreçlerini yönetir            | [Exec](/tr/tools/exec), [Exec Onayları](/tr/tools/exec-approvals) |
| `code_execution`                           | Korumalı uzaktan Python analizi çalıştırır                             | [Code Execution](/tr/tools/code-execution)                      |
| `browser`                                  | Bir Chromium tarayıcısını kontrol eder (gezinme, tıklama, ekran görüntüsü) | [Browser](/tr/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Web'de arama yapar, X gönderilerinde arama yapar, sayfa içeriğini getirir | [Web](/tr/tools/web), [Web Fetch](/tr/tools/web-fetch)             |
| `read` / `write` / `edit`                  | Çalışma alanında dosya G/Ç işlemleri                                   |                                                              |
| `apply_patch`                              | Çok parçalı dosya yamaları                                             | [Apply Patch](/tr/tools/apply-patch)                            |
| `message`                                  | Tüm kanallar üzerinden mesaj gönderir                                  | [Agent Send](/tr/tools/agent-send)                              |
| `canvas`                                   | Node Canvas'ı yönetir (sunma, değerlendirme, anlık görüntü)            |                                                              |
| `nodes`                                    | Eşleştirilmiş cihazları keşfeder ve hedefler                           |                                                              |
| `cron` / `gateway`                         | Zamanlanmış işleri yönetir; Gateway'i inceler, yamalar, yeniden başlatır veya günceller |                                                              |
| `image` / `image_generate`                 | Görüntüleri analiz eder veya üretir                                    | [Image Generation](/tr/tools/image-generation)                  |
| `music_generate`                           | Müzik parçaları üretir                                                 | [Music Generation](/tr/tools/music-generation)                  |
| `video_generate`                           | Videolar üretir                                                        | [Video Generation](/tr/tools/video-generation)                  |
| `tts`                                      | Tek seferlik metinden konuşmaya dönüştürme                             | [TTS](/tr/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Oturum yönetimi, durum ve alt aracı orkestrasyonu                      | [Alt aracılar](/tr/tools/subagents)                             |
| `session_status`                           | Hafif `/status` tarzı geri okuma ve oturum modeli geçersiz kılma       | [Oturum Araçları](/tr/concepts/session-tool)                    |

Görüntü çalışmaları için analizde `image`, üretim veya düzenlemede `image_generate` kullanın. `openai/*`, `google/*`, `fal/*` veya başka bir varsayılan olmayan görüntü sağlayıcısını hedefliyorsanız, önce o sağlayıcının kimlik doğrulamasını/API anahtarını yapılandırın.

Müzik çalışmaları için `music_generate` kullanın. `google/*`, `minimax/*` veya başka bir varsayılan olmayan müzik sağlayıcısını hedefliyorsanız, önce o sağlayıcının kimlik doğrulamasını/API anahtarını yapılandırın.

Video çalışmaları için `video_generate` kullanın. `qwen/*` veya başka bir varsayılan olmayan video sağlayıcısını hedefliyorsanız, önce o sağlayıcının kimlik doğrulamasını/API anahtarını yapılandırın.

İş akışı odaklı ses üretimi için, ComfyUI gibi bir Plugin kaydettiğinde
`music_generate` kullanın. Bu, metinden konuşmaya için kullanılan `tts`'den ayrıdır.

`sessions` grubundaki hafif durum/geri okuma aracı `session_status`'tur.
Mevcut oturum hakkında `/status` tarzı soruları yanıtlar ve isteğe bağlı olarak
oturum başına model geçersiz kılma ayarlayabilir; `model=default` bu geçersiz
kılmayı temizler. `/status` gibi, seyrek token/önbellek sayaçlarını ve etkin
çalışma zamanı model etiketini en son transkript kullanım girdisinden geriye dönük doldurabilir.

`gateway`, Gateway işlemleri için yalnızca sahip tarafından kullanılan çalışma zamanı aracıdır:

- Düzenlemelerden önce tek bir yol kapsamlı yapılandırma alt ağacı için `config.schema.lookup`
- Geçerli yapılandırma anlık görüntüsü + hash için `config.get`
- Yeniden başlatma ile kısmi yapılandırma güncellemeleri için `config.patch`
- Yalnızca tam yapılandırma değişimi için `config.apply`
- Açık öz güncelleme + yeniden başlatma için `update.run`

Kısmi değişiklikler için önce `config.schema.lookup`, ardından `config.patch` kullanın. `config.apply` öğesini yalnızca tüm yapılandırmayı bilinçli olarak değiştirdiğinizde kullanın.
Daha geniş yapılandırma belgeleri için [Yapılandırma](/tr/gateway/configuration) ve
[Yapılandırma başvurusu](/tr/gateway/configuration-reference) sayfalarını okuyun.
Araç ayrıca `tools.exec.ask` veya `tools.exec.security` değerlerinin değiştirilmesini reddeder;
eski `tools.bash.*` takma adları aynı korumalı exec yollarına normalleştirilir.

### Plugin tarafından sağlanan araçlar

Plugin'ler ek araçlar kaydedebilir. Bazı örnekler:

- [Diff'ler](/tr/tools/diffs) — diff görüntüleyici ve işleyici
- [LLM Görevi](/tr/tools/llm-task) — yapılandırılmış çıktı için yalnızca JSON LLM adımı
- [Lobster](/tr/tools/lobster) — sürdürülebilir onaylara sahip tiplendirilmiş iş akışı çalışma zamanı
- [Müzik Üretimi](/tr/tools/music-generation) — iş akışı destekli sağlayıcılarla paylaşılan `music_generate` aracı
- [OpenProse](/tr/prose) — markdown öncelikli iş akışı orkestrasyonu
- [Tokenjuice](/tr/tools/tokenjuice) — gürültülü `exec` ve `bash` araç sonuçlarını sıkıştırır

## Araç yapılandırması

### İzin ve reddetme listeleri

Aracının hangi araçları çağırabileceğini yapılandırmada `tools.allow` / `tools.deny` ile
kontrol edin. Reddetme her zaman izne üstün gelir.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

Açık bir izin listesi çağrılabilir hiçbir araca çözümlenmediğinde OpenClaw kapalı başarısız olur.
Örneğin, `tools.allow: ["query_db"]` yalnızca yüklü bir Plugin gerçekten
`query_db` kaydediyorsa çalışır. Hiçbir yerleşik araç, Plugin veya paketlenmiş MCP aracı
izin listesiyle eşleşmezse, çalışma araç sonuçları uydurabilecek
yalnızca metin bir çalışma olarak devam etmek yerine model çağrısından önce durur.

### Araç profilleri

`tools.profile`, `allow`/`deny` uygulanmadan önce bir temel izin listesi ayarlar.
Aracı başına geçersiz kılma: `agents.list[].tools.profile`.

| Profil      | Neleri içerir                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Daha geniş komut/kontrol erişimi için sınırsız temel; `tools.profile` ayarlanmamış haliyle aynıdır                                                 |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Yalnızca `session_status`                                                                                                                         |

<Note>
`tools.profile: "messaging"` kanal odaklı aracılar için kasıtlı olarak dardır.
Dosya sistemi, çalışma zamanı, tarayıcı, canvas, nodes, cron ve Gateway kontrolü gibi
daha geniş komut/kontrol araçlarını dışarıda bırakır. Daha geniş komut/kontrol erişimi için
sınırsız temel olarak `tools.profile: "full"` kullanın, ardından gerektiğinde
`tools.allow` / `tools.deny` ile erişimi daraltın.
</Note>

`coding` hafif web araçlarını (`web_search`, `web_fetch`, `x_search`) içerir,
ancak tam tarayıcı kontrol aracını içermez. Tarayıcı otomasyonu gerçek
oturumları ve oturum açılmış profilleri yönetebilir, bu nedenle onu açıkça
`tools.alsoAllow: ["browser"]` veya aracı başına
`agents.list[].tools.alsoAllow: ["browser"]` ile ekleyin.

`coding` ve `messaging` profilleri, `bundle-mcp` Plugin anahtarı altında
yapılandırılmış paket MCP araçlarına da izin verir. Bir profilin normal yerleşiklerini
korumasını ama yapılandırılmış tüm MCP araçlarını gizlemesini istediğinizde
`tools.deny: ["bundle-mcp"]` ekleyin. `minimal` profili paket MCP araçlarını içermez.

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
| `group:runtime`    | exec, process, code_execution (`bash`, `exec` için bir diğer ad olarak kabul edilir)                       |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Tüm yerleşik OpenClaw araçları (Plugin araçlarını hariç tutar)                                            |

`sessions_history`, sınırlandırılmış ve güvenlik filtresinden geçirilmiş bir hatırlama görünümü döndürür. Düşünme etiketlerini, `<relevant-memories>` iskeletini, düz metin araç çağrısı XML yüklerini (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kesilmiş araç çağrısı blokları dahil), alt düzeye indirilmiş araç çağrısı iskeletini, sızmış ASCII/tam genişlikli model kontrol belirteçlerini ve asistan metnindeki hatalı biçimlendirilmiş MiniMax araç çağrısı XML'ini kaldırır; ardından ham bir konuşma dökümü gibi davranmak yerine redaksiyon/kısaltma ve olası aşırı büyük satır yer tutucuları uygular.

### Sağlayıcıya özgü kısıtlamalar

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

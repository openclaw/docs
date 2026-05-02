---
read_when:
    - OpenClaw'ın hangi araçları sağladığını anlamak istiyorsunuz
    - Araçları yapılandırmanız, onlara izin vermeniz veya onları reddetmeniz gerekir
    - Yerleşik araçlar, Skills ve Plugin'ler arasında seçim yapıyorsunuz
summary: 'OpenClaw araçları ve Plugin''lerine genel bakış: ajanın neler yapabileceği ve nasıl genişletileceği'
title: Araçlar ve Pluginler
x-i18n:
    generated_at: "2026-05-02T21:01:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 892eb520c14c13e4f55c80aa17ccd2578cc803796844c15cd71674cb2a0a8adf
    source_path: tools/index.md
    workflow: 16
---

OpenClaw, metin üretmenin ötesinde yaptığı her şeyi **araçlar** aracılığıyla yapar.
Araçlar, ajanın dosyaları okuma, komutları çalıştırma, web’de gezinme, mesaj
gönderme ve cihazlarla etkileşime girme yoludur.

## Araçlar, Skills ve Plugin'ler

OpenClaw birlikte çalışan üç katmana sahiptir:

<Steps>
  <Step title="Araçlar, ajanın çağırdığı şeylerdir">
    Araç, ajanın çağırabileceği türlendirilmiş bir işlevdir (ör. `exec`, `browser`,
    `web_search`, `message`). OpenClaw bir dizi **yerleşik araç** ile gelir ve
    Plugin'ler ek araçlar kaydedebilir.

    Ajan, araçları model API'sine gönderilen yapılandırılmış işlev tanımları olarak görür.

  </Step>

  <Step title="Skills, ajana ne zaman ve nasıl yapacağını öğretir">
    Skill, sistem istemine enjekte edilen bir markdown dosyasıdır (`SKILL.md`).
    Skills, araçları etkili kullanmak için ajana bağlam, kısıtlamalar ve adım adım
    rehberlik sağlar. Skills çalışma alanınızda, paylaşılan klasörlerde bulunur
    veya Plugin'lerin içinde gelir.

    [Skills başvurusu](/tr/tools/skills) | [Skills oluşturma](/tr/tools/creating-skills)

  </Step>

  <Step title="Plugin'ler her şeyi birlikte paketler">
    Plugin, şu yeteneklerin herhangi bir bileşimini kaydedebilen bir pakettir:
    kanallar, model sağlayıcıları, araçlar, Skills, konuşma, gerçek zamanlı transkripsiyon,
    gerçek zamanlı ses, medya anlama, görüntü oluşturma, video oluşturma,
    web getirme, web arama ve daha fazlası. Bazı Plugin'ler **çekirdek**tir
    (OpenClaw ile gelir), diğerleri **harici**dir (topluluk tarafından npm’de yayımlanır).

    [Plugin'leri yükleyin ve yapılandırın](/tr/tools/plugin) | [Kendi Plugin'inizi oluşturun](/tr/plugins/building-plugins)

  </Step>
</Steps>

## Yerleşik araçlar

Bu araçlar OpenClaw ile birlikte gelir ve herhangi bir Plugin yüklemeden kullanılabilir:

| Araç                                      | Ne yapar                                                             | Sayfa                                                        |
| ----------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                        | Kabuk komutlarını çalıştırır, arka plan işlemlerini yönetir          | [Exec](/tr/tools/exec), [Exec Onayları](/tr/tools/exec-approvals)  |
| `code_execution`                          | Korumalı alanda uzak Python analizi çalıştırır                       | [Kod Yürütme](/tr/tools/code-execution)                         |
| `browser`                                 | Bir Chromium tarayıcısını denetler (gezinme, tıklama, ekran görüntüsü) | [Tarayıcı](/tr/tools/browser)                                  |
| `web_search` / `x_search` / `web_fetch`   | Web’de arama yapar, X gönderilerini arar, sayfa içeriğini getirir    | [Web](/tr/tools/web), [Web Getirme](/tr/tools/web-fetch)           |
| `read` / `write` / `edit`                 | Çalışma alanında dosya G/Ç                                           |                                                              |
| `apply_patch`                             | Çok parçalı dosya yamaları                                           | [Yama Uygula](/tr/tools/apply-patch)                            |
| `message`                                 | Tüm kanallardan mesaj gönderir                                       | [Ajan Gönderimi](/tr/tools/agent-send)                          |
| `canvas`                                  | node Canvas’ı sürer (sunma, değerlendirme, anlık görüntü)            |                                                              |
| `nodes`                                   | Eşleştirilmiş cihazları keşfeder ve hedefler                         |                                                              |
| `cron` / `gateway`                        | Zamanlanmış işleri yönetir; gateway’i inceler, yamalar, yeniden başlatır veya günceller |                                      |
| `image` / `image_generate`                | Görüntüleri analiz eder veya oluşturur                               | [Görüntü Oluşturma](/tr/tools/image-generation)                 |
| `music_generate`                          | Müzik parçaları oluşturur                                            | [Müzik Oluşturma](/tr/tools/music-generation)                   |
| `video_generate`                          | Videolar oluşturur                                                   | [Video Oluşturma](/tr/tools/video-generation)                   |
| `tts`                                     | Tek seferlik metinden konuşmaya dönüştürme                           | [TTS](/tr/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Oturum yönetimi, durum ve alt ajan orkestrasyonu                     | [Alt ajanlar](/tr/tools/subagents)                              |
| `session_status`                          | Hafif `/status` tarzı geri okuma ve oturum modeli geçersiz kılma     | [Oturum Araçları](/tr/concepts/session-tool)                    |

Görüntü çalışmaları için analizde `image`, oluşturma veya düzenlemede `image_generate` kullanın. `openai/*`, `google/*`, `fal/*` veya başka bir varsayılan olmayan görüntü sağlayıcısını hedefliyorsanız, önce o sağlayıcının kimlik doğrulamasını/API anahtarını yapılandırın.

Müzik çalışmaları için `music_generate` kullanın. `google/*`, `minimax/*` veya başka bir varsayılan olmayan müzik sağlayıcısını hedefliyorsanız, önce o sağlayıcının kimlik doğrulamasını/API anahtarını yapılandırın.

Video çalışmaları için `video_generate` kullanın. `qwen/*` veya başka bir varsayılan olmayan video sağlayıcısını hedefliyorsanız, önce o sağlayıcının kimlik doğrulamasını/API anahtarını yapılandırın.

İş akışı odaklı ses oluşturma için, ComfyUI gibi bir Plugin kaydettiğinde
`music_generate` kullanın. Bu, metinden konuşmaya olan `tts`’den ayrıdır.

`sessions` grubundaki hafif durum/geri okuma aracı `session_status`’tur.
Geçerli oturum hakkında `/status` tarzı soruları yanıtlar ve isteğe bağlı olarak
oturum başına model geçersiz kılması ayarlayabilir; `model=default` bu
geçersiz kılmayı temizler. `/status` gibi, seyrek token/önbellek sayaçlarını ve
etkin çalışma zamanı model etiketini en son transkript kullanım girdisinden geriye dönük doldurabilir.

`gateway`, Gateway işlemleri için yalnızca sahibin kullanabildiği çalışma zamanı aracıdır:

- Düzenlemelerden önce yol kapsamlı tek bir yapılandırma alt ağacı için `config.schema.lookup`
- Geçerli yapılandırma anlık görüntüsü + hash için `config.get`
- Yeniden başlatmalı kısmi yapılandırma güncellemeleri için `config.patch`
- Yalnızca tam yapılandırma değiştirme için `config.apply`
- Açıkça öz güncelleme + yeniden başlatma için `update.run`

Kısmi değişikliklerde önce `config.schema.lookup`, sonra `config.patch` tercih edin. `config.apply` yalnızca tüm yapılandırmayı bilinçli olarak değiştirdiğinizde kullanın.
Daha geniş yapılandırma belgeleri için [Yapılandırma](/tr/gateway/configuration) ve
[Yapılandırma başvurusu](/tr/gateway/configuration-reference) sayfalarını okuyun.
Araç ayrıca `tools.exec.ask` veya `tools.exec.security` değerlerini değiştirmeyi reddeder;
eski `tools.bash.*` takma adları aynı korumalı exec yollarına normalleştirilir.

### Plugin tarafından sağlanan araçlar

Plugin'ler ek araçlar kaydedebilir. Bazı örnekler:

- [Farklar](/tr/tools/diffs) — fark görüntüleyici ve işleyici
- [LLM Görevi](/tr/tools/llm-task) — yapılandırılmış çıktı için yalnızca JSON LLM adımı
- [Lobster](/tr/tools/lobster) — sürdürülebilir onaylara sahip türlendirilmiş iş akışı çalışma zamanı
- [Müzik Oluşturma](/tr/tools/music-generation) — iş akışı destekli sağlayıcılarla paylaşılan `music_generate` aracı
- [OpenProse](/tr/prose) — markdown öncelikli iş akışı orkestrasyonu
- [Tokenjuice](/tr/tools/tokenjuice) — gürültülü `exec` ve `bash` araç sonuçlarını sıkıştırır

Plugin araçları yine `api.registerTool(...)` ile yazılır ve Plugin manifestinin
`contracts.tools` listesinde bildirilir. OpenClaw, doğrulanmış araç tanımlayıcısını
keşif sırasında yakalar ve Plugin kaynağına ve sözleşmeye göre önbelleğe alır; böylece
sonraki araç planlama Plugin çalışma zamanı yüklemesini atlayabilir. Araç yürütme yine
sahip Plugin'i yükler ve canlı kayıtlı uygulamayı çağırır.

## Araç yapılandırması

### İzin ve reddetme listeleri

Ajanın hangi araçları çağırabileceğini yapılandırmadaki `tools.allow` / `tools.deny`
üzerinden denetleyin. Reddetme her zaman izne üstün gelir.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

Açık bir izin listesi çağrılabilir hiçbir araca çözümlenmediğinde OpenClaw kapalı başarısız olur.
Örneğin, `tools.allow: ["query_db"]` yalnızca yüklenmiş bir Plugin gerçekten
`query_db` kaydediyorsa çalışır. İzin listesiyle eşleşen yerleşik, Plugin veya paketlenmiş
MCP aracı yoksa çalışma, araç sonuçları uydurabilecek metin-only bir çalışma olarak
devam etmek yerine model çağrısından önce durur.

### Araç profilleri

`tools.profile`, `allow`/`deny` uygulanmadan önce bir temel izin listesi ayarlar.
Ajan başına geçersiz kılma: `agents.list[].tools.profile`.

| Profil      | Neleri içerir                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Daha geniş komut/denetim erişimi için sınırsız temel; `tools.profile` ayarlanmamış bırakmakla aynıdır                                             |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Yalnızca `session_status`                                                                                                                         |

<Note>
`tools.profile: "messaging"` kanal odaklı ajanlar için bilinçli olarak dardır.
Dosya sistemi, çalışma zamanı, tarayıcı, canvas, nodes, Cron ve Gateway denetimi gibi
daha geniş komut/denetim araçlarını dışarıda bırakır. Daha geniş komut/denetim erişimi
için sınırsız temel olarak `tools.profile: "full"` kullanın, ardından gerektiğinde
erişimi `tools.allow` / `tools.deny` ile daraltın.
</Note>

`coding` hafif web araçlarını (`web_search`, `web_fetch`, `x_search`) içerir,
ancak tam tarayıcı denetim aracını içermez. Tarayıcı otomasyonu gerçek oturumları ve
oturum açılmış profilleri sürebilir; bu yüzden onu açıkça
`tools.alsoAllow: ["browser"]` veya ajan başına
`agents.list[].tools.alsoAllow: ["browser"]` ile ekleyin.

<Note>
Kısıtlayıcı bir profil (`messaging`, `minimal`) altında `tools.exec` veya `tools.fs` yapılandırmak, profilin izin listesini örtük olarak genişletmez. Kısıtlayıcı bir profilin bu yapılandırılmış bölümleri kullanmasını istediğinizde açık `tools.alsoAllow` girdileri ekleyin (örneğin exec için `["exec", "process"]` veya fs için `["read", "write", "edit"]`). OpenClaw, eşleşen bir `alsoAllow` izni olmadan yapılandırma bölümü bulunduğunda başlangıçta uyarı günlüğe yazar.
</Note>

`coding` ve `messaging` profilleri ayrıca `bundle-mcp` Plugin anahtarı altında
yapılandırılmış paket MCP araçlarına izin verir. Bir profilin normal yerleşik araçlarını
koruyup tüm yapılandırılmış MCP araçlarını gizlemesini istediğinizde
`tools.deny: ["bundle-mcp"]` ekleyin.
`minimal` profili paket MCP araçlarını içermez.

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
| `group:runtime`    | exec, process, code_execution (`bash`, `exec` için bir alias olarak kabul edilir)                         |
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
| `group:openclaw`   | Tüm yerleşik OpenClaw araçları (Plugin araçları hariç)                                                    |

`sessions_history`, sınırlı ve güvenlik filtresinden geçirilmiş bir hatırlama görünümü döndürür. Düşünme etiketlerini, `<relevant-memories>` iskeletini, düz metin araç çağrısı XML yüklerini (`<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` ve kısaltılmış araç çağrısı blokları dahil), indirgenmiş araç çağrısı iskeletini, sızmış ASCII/tam genişlikli model kontrol belirteçlerini ve asistan metninden bozuk biçimli MiniMax araç çağrısı XML'ini kaldırır; ardından ham bir transkript dökümü gibi davranmak yerine redaksiyon/kısaltma ve olası aşırı büyük satır yer tutucuları uygular.

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

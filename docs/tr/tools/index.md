---
read_when:
    - OpenClaw'ın hangi araçları sunduğunu anlamak istiyorsunuz
    - Araçları yapılandırmanız, araçlara izin vermeniz veya araçları reddetmeniz gerekir
    - Yerleşik araçlar, Skills ve Plugin'ler arasında karar veriyorsunuz
summary: 'OpenClaw araçlarına ve Plugin''lerine genel bakış: ajanın neler yapabileceği ve nasıl genişletileceği'
title: Araçlar ve Plugin'ler
x-i18n:
    generated_at: "2026-05-03T21:39:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d1f776639ec2a90d8c02418c4b2c62ae7534ea535f626bc1172f1301c32c6f0
    source_path: tools/index.md
    workflow: 16
---

Temsilcinin metin üretmenin ötesinde yaptığı her şey **araçlar** üzerinden gerçekleşir.
Araçlar, temsilcinin dosyaları okumasını, komutları çalıştırmasını, web'e göz atmasını,
mesaj göndermesini ve cihazlarla etkileşim kurmasını sağlar.

## Araçlar, Skills ve pluginler

OpenClaw birlikte çalışan üç katmana sahiptir:

<Steps>
  <Step title="Araçlar temsilcinin çağırdığı şeylerdir">
    Araç, temsilcinin çağırabileceği türlendirilmiş bir fonksiyondur (örn. `exec`, `browser`,
    `web_search`, `message`). OpenClaw bir dizi **yerleşik araç** ile gelir ve
    pluginler ek araçlar kaydedebilir.

    Temsilci, araçları model API'sine gönderilen yapılandırılmış fonksiyon tanımları olarak görür.

  </Step>

  <Step title="Skills temsilciye ne zaman ve nasıl yapılacağını öğretir">
    Skill, sistem istemine enjekte edilen bir markdown dosyasıdır (`SKILL.md`).
    Skills, araçları etkili şekilde kullanması için temsilciye bağlam, kısıtlar ve
    adım adım yönlendirme sağlar. Skills çalışma alanınızda, paylaşılan klasörlerde
    veya pluginlerin içinde yer alır.

    [Skills başvurusu](/tr/tools/skills) | [Skills oluşturma](/tr/tools/creating-skills)

  </Step>

  <Step title="Pluginler her şeyi birlikte paketler">
    Plugin, yeteneklerin herhangi bir birleşimini kaydedebilen bir pakettir:
    kanallar, model sağlayıcıları, araçlar, Skills, konuşma, gerçek zamanlı transkripsiyon,
    gerçek zamanlı ses, medya anlama, görüntü oluşturma, video oluşturma,
    web getirme, web arama ve daha fazlası. Bazı pluginler **çekirdektir** (OpenClaw ile
    birlikte gelir), diğerleri **haricidir** (topluluk tarafından npm'de yayımlanır).

    [Pluginleri kurun ve yapılandırın](/tr/tools/plugin) | [Kendiniz oluşturun](/tr/plugins/building-plugins)

  </Step>
</Steps>

## Yerleşik araçlar

Bu araçlar OpenClaw ile birlikte gelir ve herhangi bir plugin kurmadan kullanılabilir:

| Araç                                      | Ne yapar                                                             | Sayfa                                                        |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Kabuk komutlarını çalıştırır, arka plan süreçlerini yönetir           | [Exec](/tr/tools/exec), [Exec Onayları](/tr/tools/exec-approvals) |
| `code_execution`                           | Korumalı alana alınmış uzak Python analizi çalıştırır                 | [Kod Yürütme](/tr/tools/code-execution)                         |
| `browser`                                  | Bir Chromium tarayıcıyı kontrol eder (gezinme, tıklama, ekran görüntüsü) | [Tarayıcı](/tr/tools/browser)                                |
| `web_search` / `x_search` / `web_fetch`    | Web'de arama yapar, X gönderilerinde arama yapar, sayfa içeriğini getirir | [Web](/tr/tools/web), [Web Getirme](/tr/tools/web-fetch)       |
| `read` / `write` / `edit`                  | Çalışma alanında dosya G/Ç işlemleri                                  |                                                              |
| `apply_patch`                              | Çok parçalı dosya yamaları                                            | [Yama Uygula](/tr/tools/apply-patch)                            |
| `message`                                  | Tüm kanallarda mesaj gönderir                                         | [Temsilci Gönderimi](/tr/tools/agent-send)                      |
| `canvas`                                   | Node Canvas'ı yönetir (sunum, değerlendirme, anlık görüntü)           |                                                              |
| `nodes`                                    | Eşleştirilmiş cihazları keşfeder ve hedefler                          |                                                              |
| `cron` / `gateway`                         | Zamanlanmış işleri yönetir; gateway'i inceler, yamalar, yeniden başlatır veya günceller |                                        |
| `image` / `image_generate`                 | Görüntüleri analiz eder veya oluşturur                                | [Görüntü Oluşturma](/tr/tools/image-generation)                 |
| `music_generate`                           | Müzik parçaları oluşturur                                             | [Müzik Oluşturma](/tr/tools/music-generation)                   |
| `video_generate`                           | Videolar oluşturur                                                    | [Video Oluşturma](/tr/tools/video-generation)                   |
| `tts`                                      | Tek seferlik metinden konuşmaya dönüştürme                            | [TTS](/tr/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Oturum yönetimi, durum ve alt temsilci orkestrasyonu                  | [Alt temsilciler](/tr/tools/subagents)                          |
| `session_status`                           | Hafif `/status` tarzı geri okuma ve oturum modeli geçersiz kılma      | [Oturum Araçları](/tr/concepts/session-tool)                    |

Görüntü çalışmaları için analizde `image`, oluşturma veya düzenlemede `image_generate` kullanın. `openai/*`, `google/*`, `fal/*` veya varsayılan olmayan başka bir görüntü sağlayıcıyı hedeflerseniz, önce o sağlayıcının kimlik doğrulamasını/API anahtarını yapılandırın.

Müzik çalışmaları için `music_generate` kullanın. `google/*`, `minimax/*` veya varsayılan olmayan başka bir müzik sağlayıcıyı hedeflerseniz, önce o sağlayıcının kimlik doğrulamasını/API anahtarını yapılandırın.

Video çalışmaları için `video_generate` kullanın. `qwen/*` veya varsayılan olmayan başka bir video sağlayıcıyı hedeflerseniz, önce o sağlayıcının kimlik doğrulamasını/API anahtarını yapılandırın.

İş akışı güdümlü ses oluşturma için, ComfyUI gibi bir plugin kaydettiğinde
`music_generate` kullanın. Bu, metinden konuşmaya olan `tts`'den ayrıdır.

`sessions` grubundaki hafif durum/geri okuma aracı `session_status`'dir.
Geçerli oturum hakkında `/status` tarzı soruları yanıtlar ve isteğe bağlı olarak
oturum başına bir model geçersiz kılması ayarlayabilir; `model=default` bu
geçersiz kılmayı temizler. `/status` gibi, seyrek token/önbellek sayaçlarını ve
etkin çalışma zamanı model etiketini en son transkript kullanım girdisinden geriye dönük doldurabilir.

`gateway`, Gateway işlemleri için yalnızca sahibin kullanabildiği çalışma zamanı aracıdır:

- Düzenlemelerden önce yol kapsamlı bir yapılandırma alt ağacı için `config.schema.lookup`
- Geçerli yapılandırma anlık görüntüsü + hash için `config.get`
- Yeniden başlatmalı kısmi yapılandırma güncellemeleri için `config.patch`
- Yalnızca tam yapılandırma değişimi için `config.apply`
- Açık self-update + yeniden başlatma için `update.run`

Kısmi değişikliklerde önce `config.schema.lookup`, ardından `config.patch` tercih edin. `config.apply` aracını yalnızca tüm yapılandırmayı bilinçli olarak değiştirdiğinizde kullanın.
Daha geniş yapılandırma belgeleri için [Yapılandırma](/tr/gateway/configuration) ve
[Yapılandırma referansı](/tr/gateway/configuration-reference) sayfalarını okuyun.
Araç ayrıca `tools.exec.ask` veya `tools.exec.security` değerlerini değiştirmeyi reddeder;
eski `tools.bash.*` takma adları aynı korumalı exec yollarına normalleştirilir.

### Plugin tarafından sağlanan araçlar

Plugin'ler ek araçlar kaydedebilir. Bazı örnekler:

- [Farklar](/tr/tools/diffs) — diff görüntüleyici ve işleyici
- [LLM Görevi](/tr/tools/llm-task) — yapılandırılmış çıktı için yalnızca JSON kullanan LLM adımı
- [Lobster](/tr/tools/lobster) — sürdürülebilir onaylara sahip türlendirilmiş iş akışı çalışma zamanı
- [Müzik Üretimi](/tr/tools/music-generation) — iş akışı destekli sağlayıcılarla paylaşılan `music_generate` aracı
- [OpenProse](/tr/prose) — markdown öncelikli iş akışı orkestrasyonu
- [Tokenjuice](/tr/tools/tokenjuice) — gürültülü `exec` ve `bash` araç sonuçlarını sıkıştırır

Plugin araçları hâlâ `api.registerTool(...)` ile yazılır ve
Plugin manifestosunun `contracts.tools` listesinde bildirilir. OpenClaw,
doğrulanmış araç tanımlayıcısını keşif sırasında yakalar ve Plugin kaynağına ve sözleşmeye göre önbelleğe alır; böylece daha sonraki araç planlaması Plugin çalışma zamanının yüklenmesini atlayabilir. Araç yürütme yine de aracı sahiplenen Plugin'i yükler ve canlı kayıtlı uygulamayı çağırır.

## Araç yapılandırması

### İzin ve reddetme listeleri

Temsilcinin hangi araçları çağırabileceğini yapılandırmadaki `tools.allow` / `tools.deny` üzerinden kontrol edin. Reddetme her zaman izne üstün gelir.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

Açık bir izin listesi çağrılabilir hiçbir araca çözümlenmediğinde OpenClaw kapalı şekilde başarısız olur.
Örneğin, `tools.allow: ["query_db"]` yalnızca yüklü bir Plugin gerçekten `query_db` kaydediyorsa çalışır. Hiçbir yerleşik, Plugin veya paketlenmiş MCP aracı izin listesiyle eşleşmezse çalışma, araç sonuçlarını uydurabilecek yalnızca metin tabanlı bir çalışma olarak devam etmek yerine model çağrısından önce durur.

### Araç profilleri

`tools.profile`, `allow`/`deny` uygulanmadan önce temel bir izin listesi belirler.
Temsilci başına geçersiz kılma: `agents.list[].tools.profile`.

| Profil      | İçerdikleri                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Tüm çekirdek ve isteğe bağlı Plugin araçları; daha geniş komut/denetim erişimi için kısıtlamasız temel                                            |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Yalnızca `session_status`                                                                                                                         |

<Note>
`tools.profile: "messaging"` kanal odaklı temsilciler için özellikle dar tutulmuştur. Dosya sistemi, çalışma zamanı, tarayıcı, canvas, node'lar, Cron ve Gateway denetimi gibi daha geniş komut/denetim araçlarını dışarıda bırakır. Daha geniş komut/denetim erişimi için kısıtlamasız temel olarak `tools.profile: "full"` kullanın, ardından gerektiğinde `tools.allow` / `tools.deny` ile erişimi daraltın.
</Note>

`coding`, hafif web araçlarını (`web_search`, `web_fetch`, `x_search`) içerir,
ancak tam tarayıcı denetim aracını içermez. Tarayıcı otomasyonu gerçek
oturumları ve oturum açılmış profilleri sürebilir; bu nedenle bunu
`tools.alsoAllow: ["browser"]` veya temsilci başına
`agents.list[].tools.alsoAllow: ["browser"]` ile açıkça ekleyin.

<Note>
Kısıtlayıcı bir profil (`messaging`, `minimal`) altında `tools.exec` veya `tools.fs` yapılandırmak, profilin izin listesini örtük olarak genişletmez. Kısıtlayıcı bir profilin bu yapılandırılmış bölümleri kullanmasını istediğinizde açık `tools.alsoAllow` girdileri ekleyin (örneğin exec için `["exec", "process"]` veya fs için `["read", "write", "edit"]`). Bir yapılandırma bölümü eşleşen bir `alsoAllow` izni olmadan mevcut olduğunda OpenClaw başlangıçta bir uyarı günlüğe yazar.
</Note>

`coding` ve `messaging` profilleri, `bundle-mcp` Plugin anahtarı altında yapılandırılmış paket MCP araçlarına da izin verir. Bir profilin normal yerleşik araçlarını korumasını ancak tüm yapılandırılmış MCP araçlarını gizlemesini istediğinizde `tools.deny: ["bundle-mcp"]` ekleyin.
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
| `group:runtime`    | exec, process, code_execution (`bash`, `exec` için takma ad olarak kabul edilir)                         |
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

`sessions_history` sınırlı, güvenlik filtrelemesinden geçirilmiş bir hatırlama görünümü döndürür. Assistant metninden
düşünme etiketlerini, `<relevant-memories>` iskeletini, düz metin araç çağrısı XML
yüklerini (`<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` ve kesilmiş araç çağrısı blokları dahil),
seviyesi düşürülmüş araç çağrısı iskeletini, sızdırılmış ASCII/tam genişlikli model kontrol
belirteçlerini ve hatalı biçimlendirilmiş MiniMax araç çağrısı XML'ini kaldırır; ardından
ham transcript dökümü gibi davranmak yerine redaksiyon/kısaltma ve olası aşırı büyük satır
yer tutucuları uygular.

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

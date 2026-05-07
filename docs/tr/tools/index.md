---
read_when:
    - OpenClaw'ın hangi araçları sunduğunu anlamak istiyorsunuz
    - Araçları yapılandırmanız, bunlara izin vermeniz veya bunları reddetmeniz gerekir.
    - Yerleşik araçlar, Skills ve Plugin'ler arasında karar veriyorsunuz
summary: 'OpenClaw araçları ve Plugin''lerine genel bakış: ajanın neler yapabileceği ve nasıl genişletileceği'
title: Araçlar ve Plugin'ler
x-i18n:
    generated_at: "2026-05-07T13:26:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: e001a51222a1b838ded2498bcedc6bd95dbc0a8912850ad7de21e28b25c50790
    source_path: tools/index.md
    workflow: 16
---

Temsilcinin metin üretmenin ötesinde yaptığı her şey **araçlar** üzerinden gerçekleşir.
Araçlar, temsilcinin dosyaları okumasını, komut çalıştırmasını, web'de gezinmesini, mesaj
göndermesini ve cihazlarla etkileşime girmesini sağlar.

## Araçlar, skills ve plugin'ler

OpenClaw birlikte çalışan üç katmana sahiptir:

<Steps>
  <Step title="Araçlar, temsilcinin çağırdığı şeylerdir">
    Araç, temsilcinin çağırabileceği tipli bir fonksiyondur (örn. `exec`, `browser`,
    `web_search`, `message`). OpenClaw bir dizi **yerleşik araç** ile gelir ve
    plugin'ler ek araçlar kaydedebilir.

    Temsilci araçları, model API'sine gönderilen yapılandırılmış fonksiyon tanımları olarak görür.

  </Step>

  <Step title="Skills, temsilciye ne zaman ve nasıl yapacağını öğretir">
    Skill, sistem istemine enjekte edilen bir markdown dosyasıdır (`SKILL.md`).
    Skills, araçları etkili biçimde kullanması için temsilciye bağlam, kısıtlar ve
    adım adım rehberlik verir. Skills çalışma alanınızda, paylaşılan klasörlerde
    veya plugin'lerin içinde bulunur.

    [Skills başvurusu](/tr/tools/skills) | [Skills oluşturma](/tr/tools/creating-skills)

  </Step>

  <Step title="Plugin'ler her şeyi birlikte paketler">
    Plugin, yeteneklerin herhangi bir birleşimini kaydedebilen bir pakettir:
    kanallar, model sağlayıcıları, araçlar, skills, konuşma, gerçek zamanlı transkripsiyon,
    gerçek zamanlı ses, medya anlama, görüntü üretimi, video üretimi,
    web getirme, web araması ve daha fazlası. Bazı plugin'ler **çekirdektir**
    (OpenClaw ile birlikte gelir), bazıları ise **haricidir** (topluluk tarafından npm'de yayımlanır).

    [Plugin'leri kur ve yapılandır](/tr/tools/plugin) | [Kendininkini oluştur](/tr/plugins/building-plugins)

  </Step>
</Steps>

## Yerleşik araçlar

Bu araçlar OpenClaw ile birlikte gelir ve herhangi bir plugin kurmadan kullanılabilir:

| Araç                                      | Ne yapar                                                             | Sayfa                                                        |
| ----------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                        | Kabuk komutları çalıştırır, arka plan süreçlerini yönetir            | [Exec](/tr/tools/exec), [Exec Onayları](/tr/tools/exec-approvals) |
| `code_execution`                          | Korumalı alanda uzak Python analizi çalıştırır                       | [Kod Yürütme](/tr/tools/code-execution)                         |
| `browser`                                 | Bir Chromium tarayıcıyı kontrol eder (gezin, tıkla, ekran görüntüsü al) | [Tarayıcı](/tr/tools/browser)                                |
| `web_search` / `x_search` / `web_fetch`   | Web'de arama yapar, X gönderilerini arar, sayfa içeriğini getirir    | [Web](/tr/tools/web), [Web Getirme](/tr/tools/web-fetch)           |
| `read` / `write` / `edit`                 | Çalışma alanında dosya G/Ç'si                                        |                                                              |
| `apply_patch`                             | Çok parçalı dosya yamaları                                           | [Yama Uygula](/tr/tools/apply-patch)                            |
| `message`                                 | Tüm kanallar üzerinden mesaj gönderir                                | [Temsilci Gönderimi](/tr/tools/agent-send)                      |
| `nodes`                                   | Eşleştirilmiş cihazları keşfeder ve hedefler                         |                                                              |
| `cron` / `gateway`                        | Zamanlanmış işleri yönetir; Gateway'i inceler, yamalar, yeniden başlatır veya günceller |                                                    |
| `image` / `image_generate`                | Görüntüleri analiz eder veya üretir                                  | [Görüntü Üretimi](/tr/tools/image-generation)                   |
| `music_generate`                          | Müzik parçaları üretir                                               | [Müzik Üretimi](/tr/tools/music-generation)                     |
| `video_generate`                          | Videolar üretir                                                      | [Video Üretimi](/tr/tools/video-generation)                     |
| `tts`                                     | Tek seferlik metinden konuşmaya dönüştürme                           | [TTS](/tr/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Oturum yönetimi, durum ve alt temsilci orkestrasyonu                | [Alt temsilciler](/tr/tools/subagents)                          |
| `session_status`                          | Hafif `/status` tarzı geri okuma ve oturum modeli geçersiz kılma     | [Oturum Araçları](/tr/concepts/session-tool)                    |

Görüntü işleri için analizde `image`, üretim veya düzenlemede `image_generate` kullanın. `openai/*`, `google/*`, `fal/*` ya da başka bir varsayılan olmayan görüntü sağlayıcısını hedefliyorsanız önce bu sağlayıcının auth/API anahtarını yapılandırın.

Müzik işleri için `music_generate` kullanın. `google/*`, `minimax/*` ya da başka bir varsayılan olmayan müzik sağlayıcısını hedefliyorsanız önce bu sağlayıcının auth/API anahtarını yapılandırın.

Video işleri için `video_generate` kullanın. `qwen/*` ya da başka bir varsayılan olmayan video sağlayıcısını hedefliyorsanız önce bu sağlayıcının auth/API anahtarını yapılandırın.

İş akışı odaklı ses üretimi için, ComfyUI gibi bir plugin bunu kaydettiğinde
`music_generate` kullanın. Bu, metinden konuşmaya olan `tts`'den ayrıdır.

`sessions` grubundaki hafif durum/geri okuma aracı `session_status`'dur.
Geçerli oturum hakkında `/status` tarzı soruları yanıtlar ve isteğe bağlı olarak
oturum başına bir model geçersiz kılması ayarlayabilir; `model=default` bu
geçersiz kılmayı temizler. `/status` gibi, seyrek token/önbellek sayaçlarını ve
etkin çalışma zamanı model etiketini en son transkript kullanım girdisinden geriye dönük doldurabilir.

`gateway`, Gateway işlemleri için yalnızca sahibin kullanabildiği çalışma zamanı aracıdır:

- Düzenlemelerden önce yol kapsamlı tek bir yapılandırma alt ağacı için `config.schema.lookup`
- Geçerli yapılandırma anlık görüntüsü + hash için `config.get`
- Yeniden başlatmalı kısmi yapılandırma güncellemeleri için `config.patch`
- Yalnızca tam yapılandırma değişimi için `config.apply`
- Açık öz güncelleme + yeniden başlatma için `update.run`

Kısmi değişikliklerde önce `config.schema.lookup`, ardından `config.patch` tercih edin. `config.apply`'ı yalnızca tüm yapılandırmayı bilinçli olarak değiştirdiğinizde kullanın.
Daha geniş yapılandırma belgeleri için [Yapılandırma](/tr/gateway/configuration) ve
[Yapılandırma başvurusu](/tr/gateway/configuration-reference) sayfalarını okuyun.
Araç ayrıca `tools.exec.ask` veya `tools.exec.security` değiştirmeyi reddeder;
eski `tools.bash.*` takma adları aynı korumalı exec yollarına normalize edilir.

### Plugin tarafından sağlanan araçlar

Plugin'ler ek araçlar kaydedebilir. Bazı örnekler:

- [Canvas](/tr/plugins/reference/canvas) — node Canvas kontrolü ve A2UI işleme için deneysel paketli plugin
- [Diff'ler](/tr/tools/diffs) — diff görüntüleyici ve işleyici
- [LLM Görevi](/tr/tools/llm-task) — yapılandırılmış çıktı için yalnızca JSON LLM adımı
- [Lobster](/tr/tools/lobster) — sürdürülebilir onaylara sahip tipli iş akışı çalışma zamanı
- [Müzik Üretimi](/tr/tools/music-generation) — iş akışı destekli sağlayıcılarla paylaşılan `music_generate` aracı
- [OpenProse](/tr/prose) — markdown öncelikli iş akışı orkestrasyonu
- [Tokenjuice](/tr/tools/tokenjuice) — gürültülü `exec` ve `bash` araç sonuçlarını sıkıştırır

Plugin araçları yine `api.registerTool(...)` ile yazılır ve
plugin manifestinin `contracts.tools` listesinde bildirilir. OpenClaw doğrulanmış
araç tanımlayıcısını keşif sırasında yakalar ve plugin kaynağına ve sözleşmeye göre önbelleğe alır; böylece
sonraki araç planlaması plugin çalışma zamanını yüklemeyi atlayabilir. Araç yürütme yine
sahip plugin'i yükler ve canlı kayıtlı uygulamayı çağırır.

## Araç yapılandırması

### İzin ve engelleme listeleri

Temsilcinin hangi araçları çağırabileceğini yapılandırmadaki `tools.allow` / `tools.deny` ile
denetleyin. Engelleme her zaman izinden baskındır.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

Açık bir izin listesi çağrılabilir hiçbir araca çözümlenmediğinde OpenClaw kapalı başarısız olur.
Örneğin `tools.allow: ["query_db"]`, yalnızca yüklü bir plugin gerçekten
`query_db` kaydediyorsa çalışır. İzin listesiyle eşleşen hiçbir yerleşik, plugin veya paketli MCP aracı yoksa
çalıştırma, araç sonuçlarını halüsinasyonla üretebilecek
yalnızca metin bir çalıştırma olarak devam etmek yerine model çağrısından önce durur.

### Araç profilleri

`tools.profile`, `allow`/`deny` uygulanmadan önce temel izin listesini ayarlar.
Temsilci başına geçersiz kılma: `agents.list[].tools.profile`.

| Profil      | Neleri içerir                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Tüm çekirdek ve isteğe bağlı plugin araçları; daha geniş komut/kontrol erişimi için kısıtsız temel                                                |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Yalnızca `session_status`                                                                                                                         |

<Note>
`tools.profile: "messaging"`, kanal odaklı temsilciler için bilinçli olarak dardır.
Dosya sistemi, çalışma zamanı, tarayıcı, canvas, nodes, cron ve gateway kontrolü gibi
daha geniş komut/kontrol araçlarını dışarıda bırakır. Daha geniş komut/kontrol erişimi için
kısıtsız temel olarak `tools.profile: "full"` kullanın, ardından gerektiğinde
erişimi `tools.allow` / `tools.deny` ile daraltın.
</Note>

`coding` hafif web araçlarını (`web_search`, `web_fetch`, `x_search`) içerir
ancak tam tarayıcı kontrol aracını içermez. Tarayıcı otomasyonu gerçek
oturumları ve oturum açılmış profilleri sürebilir; bu yüzden bunu
`tools.alsoAllow: ["browser"]` ya da temsilci başına
`agents.list[].tools.alsoAllow: ["browser"]` ile açıkça ekleyin.

<Note>
Kısıtlayıcı bir profil (`messaging`, `minimal`) altında `tools.exec` veya `tools.fs` yapılandırmak, profilin izin listesini örtük olarak genişletmez. Kısıtlayıcı bir profilin bu yapılandırılmış bölümleri kullanmasını istediğinizde açık `tools.alsoAllow` girdileri ekleyin (örneğin exec için `["exec", "process"]` veya fs için `["read", "write", "edit"]`). Eşleşen bir `alsoAllow` izni olmadan bir yapılandırma bölümü mevcutsa OpenClaw başlangıçta bir uyarı günlüğe yazar.
</Note>

`coding` ve `messaging` profilleri ayrıca `bundle-mcp` plugin anahtarı altında
yapılandırılmış paket MCP araçlarına izin verir. Bir profilin normal yerleşik araçlarını koruyup
tüm yapılandırılmış MCP araçlarını gizlemesini istediğinizde `tools.deny: ["bundle-mcp"]` ekleyin.
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

İzin/engelleme listelerinde `group:*` kısaltmalarını kullanın:

| Grup               | Araçlar                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash`, `exec` için bir diğer ad olarak kabul edilir)                      |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | paketle gelen Canvas Plugin etkinleştirildiğinde browser, canvas                                          |
| `group:automation` | heartbeat_respond, cron, gateway                                                                          |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list, update_plan                                                                                  |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Tüm yerleşik OpenClaw araçları (Plugin araçları hariç)                                                    |

`sessions_history`, sınırlandırılmış ve güvenlik filtresinden geçirilmiş bir geri çağırma görünümü döndürür. Ham döküm dökümü gibi davranmak yerine düşünme etiketlerini, `<relevant-memories>` iskelesini, düz metin araç çağrısı XML yüklerini (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kırpılmış araç çağrısı blokları dahil), seviyesi düşürülmüş araç çağrısı iskelesini, sızmış ASCII/tam genişlikli model denetim belirteçlerini ve asistan metnindeki hatalı biçimlendirilmiş MiniMax araç çağrısı XML'ini ayıklar; ardından redaksiyon/kırpma ve olası aşırı büyük satır yer tutucularını uygular.

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

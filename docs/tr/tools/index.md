---
read_when:
    - OpenClaw'ın hangi araçları sağladığını anlamak istiyorsunuz
    - Araçları yapılandırmanız, izin vermeniz veya engellemeniz gerekiyor
    - Yerleşik araçlar, Skills ve Plugin'ler arasında karar veriyorsunuz
summary: 'OpenClaw araçları ve Plugin''lerine genel bakış: ajanın neler yapabildiği ve nasıl genişletileceği'
title: Araçlar ve Plugin'ler
x-i18n:
    generated_at: "2026-04-24T09:35:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9ab57fcb1b58875866721fbadba63093827698ed980afeb14274da601b34f11
    source_path: tools/index.md
    workflow: 15
---

Ajanın metin üretmenin ötesinde yaptığı her şey **araçlar** üzerinden gerçekleşir.
Araçlar, ajanın dosya okumasını, komut çalıştırmasını, web'de gezinmesini, mesaj
göndermesini ve cihazlarla etkileşmesini sağlar.

## Araçlar, Skills ve Plugin'ler

OpenClaw birlikte çalışan üç katmana sahiptir:

<Steps>
  <Step title="Araçlar, ajanın çağırdığı şeydir">
    Araç, ajanın çağırabildiği tiplenmiş bir işlevdir (örn. `exec`, `browser`,
    `web_search`, `message`). OpenClaw bir dizi **yerleşik araç** ile gelir ve
    Plugin'ler ek araçlar kaydedebilir.

    Ajan, araçları model API'sine gönderilen yapılandırılmış işlev tanımları olarak görür.

  </Step>

  <Step title="Skills, ajana ne zaman ve nasıl kullanılacağını öğretir">
    Skill, sistem istemine enjekte edilen bir markdown dosyasıdır (`SKILL.md`).
    Skills, ajana araçları etkili biçimde kullanması için bağlam, kısıtlar ve
    adım adım yönlendirme verir. Skills çalışma alanınızda, paylaşılan klasörlerde
    bulunabilir veya Plugin'lerin içinde gelebilir.

    [Skills başvurusu](/tr/tools/skills) | [Skills oluşturma](/tr/tools/creating-skills)

  </Step>

  <Step title="Plugin'ler her şeyi birlikte paketler">
    Plugin, kanallar, model sağlayıcıları, araçlar, Skills, konuşma, gerçek zamanlı transkripsiyon,
    gerçek zamanlı ses, medya anlama, görsel üretimi, video üretimi,
    web fetch, web search ve daha fazlası gibi herhangi bir yetenek kombinasyonunu kaydedebilen bir pakettir.
    Bazı Plugin'ler **çekirdek**tir (OpenClaw ile gelir), diğerleri **harici**dir
    (topluluk tarafından npm üzerinde yayımlanır).

    [Plugin'leri kurun ve yapılandırın](/tr/tools/plugin) | [Kendiniz oluşturun](/tr/plugins/building-plugins)

  </Step>
</Steps>

## Yerleşik araçlar

Bu araçlar OpenClaw ile birlikte gelir ve herhangi bir Plugin kurmadan kullanılabilir:

| Araç                                       | Ne yapar                                                            | Sayfa                                                        |
| ------------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Shell komutları çalıştırır, arka plan süreçlerini yönetir           | [Exec](/tr/tools/exec), [Exec Approvals](/tr/tools/exec-approvals) |
| `code_execution`                           | Sandbox içinde uzak Python analizi çalıştırır                       | [Code Execution](/tr/tools/code-execution)                      |
| `browser`                                  | Chromium tarayıcısını denetler (gezin, tıkla, ekran görüntüsü al)   | [Browser](/tr/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Web'de arama yapar, X gönderilerini arar, sayfa içeriği getirir     | [Web](/tr/tools/web), [Web Fetch](/tr/tools/web-fetch)             |
| `read` / `write` / `edit`                  | Çalışma alanında dosya G/Ç                                          |                                                              |
| `apply_patch`                              | Çok parçalı dosya yamaları                                          | [Apply Patch](/tr/tools/apply-patch)                            |
| `message`                                  | Tüm kanallar üzerinden mesaj gönderir                               | [Agent Send](/tr/tools/agent-send)                              |
| `canvas`                                   | Node Canvas'ı sürer (present, eval, snapshot)                       |                                                              |
| `nodes`                                    | Eşlenmiş cihazları keşfeder ve hedefler                             |                                                              |
| `cron` / `gateway`                         | Zamanlanmış işleri yönetir; Gateway'i inceler, yamalar, yeniden başlatır veya günceller |                                                              |
| `image` / `image_generate`                 | Görselleri analiz eder veya üretir                                  | [Image Generation](/tr/tools/image-generation)                  |
| `music_generate`                           | Müzik parçaları üretir                                              | [Music Generation](/tr/tools/music-generation)                  |
| `video_generate`                           | Video üretir                                                        | [Video Generation](/tr/tools/video-generation)                  |
| `tts`                                      | Tek seferlik metinden konuşmaya dönüştürme                          | [TTS](/tr/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Oturum yönetimi, durum ve alt ajan orkestrasyonu                    | [Sub-agents](/tr/tools/subagents)                               |
| `session_status`                           | Hafif `/status` tarzı geri okuma ve oturum model geçersiz kılması   | [Session Tools](/tr/concepts/session-tool)                      |

Görsel çalışmaları için analizde `image`, üretim veya düzenlemede `image_generate` kullanın. `openai/*`, `google/*`, `fal/*` veya başka bir varsayılan olmayan görsel sağlayıcıyı hedefliyorsanız önce o sağlayıcının auth/API anahtarını yapılandırın.

Müzik çalışmaları için `music_generate` kullanın. `google/*`, `minimax/*` veya başka bir varsayılan olmayan müzik sağlayıcısını hedefliyorsanız önce o sağlayıcının auth/API anahtarını yapılandırın.

Video çalışmaları için `video_generate` kullanın. `qwen/*` veya başka bir varsayılan olmayan video sağlayıcıyı hedefliyorsanız önce o sağlayıcının auth/API anahtarını yapılandırın.

İş akışı güdümlü ses üretimi için, ComfyUI gibi bir Plugin bunu kaydediyorsa
`music_generate` kullanın. Bu, metinden konuşmaya olan `tts`'den ayrıdır.

`session_status`, oturumlar grubundaki hafif durum/geri okuma aracıdır.
Geçerli oturum hakkında `/status` tarzı soruları yanıtlar ve
isteğe bağlı olarak oturum başına model geçersiz kılması ayarlayabilir; `model=default` bu
geçersiz kılmayı temizler. `/status` gibi, en son transkript kullanım girdisinden
seyrek token/cache sayaçlarını ve etkin çalışma zamanı model etiketini geriye doldurabilir.

`gateway`, Gateway işlemleri için yalnızca sahip tarafından kullanılabilen çalışma zamanı aracıdır:

- düzenlemelerden önce bir yol kapsamlı yapılandırma alt ağacı için `config.schema.lookup`
- geçerli yapılandırma anlık görüntüsü + hash için `config.get`
- yeniden başlatmalı kısmi yapılandırma güncellemeleri için `config.patch`
- yalnızca tam yapılandırma değiştirme için `config.apply`
- açık kendi kendine güncelleme + yeniden başlatma için `update.run`

Kısmi değişiklikler için önce `config.schema.lookup`, ardından `config.patch` tercih edin.
`config.apply` yalnızca tüm yapılandırmayı bilerek değiştirdiğinizde kullanın.
Bu araç ayrıca `tools.exec.ask` veya `tools.exec.security` değiştirmeyi de reddeder;
eski `tools.bash.*` takma adları aynı korunan exec yollarına normalize olur.

### Plugin tarafından sağlanan araçlar

Plugin'ler ek araçlar kaydedebilir. Bazı örnekler:

- [Diffs](/tr/tools/diffs) — diff görüntüleyici ve oluşturucu
- [LLM Task](/tr/tools/llm-task) — yapılandırılmış çıktı için yalnızca JSON LLM adımı
- [Lobster](/tr/tools/lobster) — devam ettirilebilir onaylarla tiplenmiş iş akışı çalışma zamanı
- [Music Generation](/tr/tools/music-generation) — iş akışı destekli sağlayıcılarla paylaşılan `music_generate` aracı
- [OpenProse](/tr/prose) — markdown öncelikli iş akışı orkestrasyonu
- [Tokenjuice](/tr/tools/tokenjuice) — gürültülü `exec` ve `bash` araç sonuçlarını sıkıştırır

## Araç yapılandırması

### İzin ve engelleme listeleri

Ajanın hangi araçları çağırabileceğini yapılandırmada
`tools.allow` / `tools.deny` ile denetleyin. Deny, her zaman allow üzerinde kazanır.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### Araç profilleri

`tools.profile`, `allow`/`deny` uygulanmadan önce temel bir izin listesi ayarlar.
Ajan başına geçersiz kılma: `agents.list[].tools.profile`.

| Profil      | İçerdikleri                                                                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Kısıtlama yok (ayarlanmamış ile aynı)                                                                                                         |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                     |
| `minimal`   | Yalnızca `session_status`                                                                                                                     |

`coding` ve `messaging` profilleri ayrıca
Plugin anahtarı `bundle-mcp` altında yapılandırılmış bundle MCP araçlarına da izin verir.
Bir profil normal yerleşik araçlarını korurken tüm yapılandırılmış MCP araçlarını gizlesin istiyorsanız
`tools.deny: ["bundle-mcp"]` ekleyin.
`minimal` profili bundle MCP araçlarını içermez.

### Araç grupları

İzin/engelleme listelerinde `group:*` kısayollarını kullanın:

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

`sessions_history`, sınırlı ve güvenlik filtreli bir geri çağırma görünümü döndürür. Düşünme etiketlerini, `<relevant-memories>` iskeletini, düz metin araç çağrısı XML yüklerini (bunlara `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` ve kırpılmış araç çağrısı blokları dahildir),
değer düşürülmüş araç çağrısı iskeletini, sızmış ASCII/tam genişlikli model denetim
token'larını ve yardımcı metin içindeki bozuk MiniMax araç çağrısı XML'ini temizler; sonra
ham bir transkript dökümü gibi davranmak yerine sansürleme/kırpma ve olası aşırı büyük satır yer tutucularını uygular.

### Sağlayıcıya özgü kısıtlamalar

Genel varsayılanları değiştirmeden belirli sağlayıcılar için araçları kısıtlamak üzere
`tools.byProvider` kullanın:

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

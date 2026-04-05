---
read_when:
    - OpenClaw'ın hangi araçları sunduğunu anlamak istiyorsunuz
    - Araçları yapılandırmanız, izin vermeniz veya engellemeniz gerekiyor
    - Yerleşik araçlar, Skills ve eklentiler arasında karar veriyorsunuz
summary: 'OpenClaw araçları ve eklentilerine genel bakış: ajanın neler yapabildiği ve nasıl genişletileceği'
title: Araçlar ve Eklentiler
x-i18n:
    generated_at: "2026-04-05T14:12:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17768048b23f980de5e502cc30fbddbadc2e26ae62f0f03c5ab5bbcdeea67e50
    source_path: tools/index.md
    workflow: 15
---

# Araçlar ve Eklentiler

Ajanın metin üretmenin ötesinde yaptığı her şey **araçlar** aracılığıyla gerçekleşir.
Araçlar, ajanın dosya okumasını, komut çalıştırmasını, web'de gezinmesini, mesaj
göndermesini ve cihazlarla etkileşime girmesini sağlar.

## Araçlar, Skills ve eklentiler

OpenClaw birlikte çalışan üç katmana sahiptir:

<Steps>
  <Step title="Araçlar, ajanın çağırdığı şeylerdir">
    Bir araç, ajanın çağırabileceği türlendirilmiş bir işlevdir (ör. `exec`, `browser`,
    `web_search`, `message`). OpenClaw bir dizi **yerleşik araç** ile gelir ve
    eklentiler ek araçlar kaydedebilir.

    Ajan, araçları model API'sine gönderilen yapılandırılmış işlev tanımları olarak görür.

  </Step>

  <Step title="Skills ajana ne zaman ve nasıl olduğunu öğretir">
    Bir Skill, sistem istemine eklenen bir markdown dosyasıdır (`SKILL.md`).
    Skills, ajana araçları etkili biçimde kullanması için bağlam, kısıtlar ve
    adım adım yönlendirme sağlar. Skills çalışma alanınızda, paylaşılan klasörlerde
    bulunur veya eklentilerin içinde gelir.

    [Skills başvurusu](/tools/skills) | [Skill oluşturma](/tools/creating-skills)

  </Step>

  <Step title="Eklentiler her şeyi birlikte paketler">
    Bir eklenti, yeteneklerin herhangi bir birleşimini kaydedebilen bir pakettir:
    kanallar, model sağlayıcıları, araçlar, Skills, konuşma, gerçek zamanlı transkripsiyon,
    gerçek zamanlı ses, medya anlama, görsel üretimi, video üretimi,
    web getirme, web arama ve daha fazlası. Bazı eklentiler **çekirdektir** (OpenClaw ile
    birlikte gelir), diğerleri **haricidir** (topluluk tarafından npm'de yayımlanır).

    [Eklenti kurma ve yapılandırma](/tools/plugin) | [Kendinizinkini oluşturun](/tr/plugins/building-plugins)

  </Step>
</Steps>

## Yerleşik araçlar

Bu araçlar OpenClaw ile birlikte gelir ve herhangi bir eklenti kurmadan kullanılabilir:

| Araç                                       | Ne yapar                                                              | Sayfa                                   |
| ------------------------------------------ | --------------------------------------------------------------------- | --------------------------------------- |
| `exec` / `process`                         | Kabuk komutlarını çalıştırır, arka plan süreçlerini yönetir           | [Exec](/tools/exec)                     |
| `code_execution`                           | Yalıtılmış uzak Python analizi çalıştırır                             | [Code Execution](/tools/code-execution) |
| `browser`                                  | Bir Chromium tarayıcısını kontrol eder (gezinti, tıklama, ekran görüntüsü) | [Browser](/tools/browser)               |
| `web_search` / `x_search` / `web_fetch`    | Web'de arama yapar, X gönderilerinde arama yapar, sayfa içeriği alır  | [Web](/tools/web)                       |
| `read` / `write` / `edit`                  | Çalışma alanında dosya G/Ç                                            |                                         |
| `apply_patch`                              | Çok hunk'lı dosya patch'leri                                          | [Apply Patch](/tools/apply-patch)       |
| `message`                                  | Tüm kanallar üzerinden mesaj gönderir                                 | [Agent Send](/tools/agent-send)         |
| `canvas`                                   | Düğüm Canvas'ı sürer (sunum, eval, snapshot)                          |                                         |
| `nodes`                                    | Eşleştirilmiş cihazları keşfeder ve hedefler                          |                                         |
| `cron` / `gateway`                         | Zamanlanmış işleri yönetir; gateway'i inceler, patch'ler, yeniden başlatır veya günceller |                                         |
| `image` / `image_generate`                 | Görselleri analiz eder veya oluşturur                                 |                                         |
| `tts`                                      | Tek seferlik metinden konuşmaya dönüştürme                            | [TTS](/tools/tts)                       |
| `sessions_*` / `subagents` / `agents_list` | Oturum yönetimi, durum ve alt ajan orkestrasyonu                      | [Sub-agents](/tools/subagents)          |
| `session_status`                           | Hafif `/status` tarzı geri okuma ve oturum modeli geçersiz kılma      | [Session Tools](/tr/concepts/session-tool) |

Görsel çalışmaları için analiz amacıyla `image`, oluşturma veya düzenleme amacıyla `image_generate` kullanın. `openai/*`, `google/*`, `fal/*` veya varsayılan olmayan başka bir görsel sağlayıcısını hedefliyorsanız önce o sağlayıcının auth/API anahtarını yapılandırın.

`session_status`, oturumlar grubundaki hafif durum/geri okuma aracıdır.
Geçerli oturumla ilgili `/status` tarzı soruları yanıtlar ve
isteğe bağlı olarak oturum başına model geçersiz kılma ayarlayabilir; `model=default` bu
geçersiz kılmayı temizler. `/status` gibi, seyrek belirteç/önbellek sayaçlarını ve
etkin çalışma zamanı model etiketini en son döküm kullanım girdisinden doldurabilir.

`gateway`, gateway işlemleri için yalnızca sahip tarafından kullanılabilen çalışma zamanı aracıdır:

- düzenlemelerden önce tek bir yol kapsamlı yapılandırma alt ağacı için `config.schema.lookup`
- geçerli yapılandırma anlık görüntüsü + hash için `config.get`
- yeniden başlatmalı kısmi yapılandırma güncellemeleri için `config.patch`
- yalnızca tam yapılandırma değiştirme için `config.apply`
- açık self-update + yeniden başlatma için `update.run`

Kısmi değişiklikler için önce `config.schema.lookup`, sonra `config.patch` tercih edin.
`config.apply` yalnızca tüm yapılandırmayı bilerek değiştirirken kullanılmalıdır.
Araç ayrıca `tools.exec.ask` veya `tools.exec.security` değerlerini değiştirmeyi reddeder;
eski `tools.bash.*` takma adları aynı korumalı exec yollarına normalize edilir.

### Eklenti tarafından sağlanan araçlar

Eklentiler ek araçlar kaydedebilir. Bazı örnekler:

- [Lobster](/tools/lobster) — devam ettirilebilir onaylarla türlendirilmiş iş akışı çalışma zamanı
- [LLM Task](/tools/llm-task) — yapılandırılmış çıktı için yalnızca JSON LLM adımı
- [Diffs](/tools/diffs) — diff görüntüleyici ve oluşturucu
- [OpenProse](/tr/prose) — markdown öncelikli iş akışı orkestrasyonu

## Araç yapılandırması

### İzin ve engelleme listeleri

Ajanın hangi araçları çağırabileceğini yapılandırmada `tools.allow` / `tools.deny` ile kontrol edin.
Engelleme her zaman izne üstün gelir.

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

| Profil      | İçerdikleri                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------ |
| `full`      | Kısıtlama yoktur (ayarlanmamışla aynıdır)                                                                    |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                   |
| `minimal`   | Yalnızca `session_status`                                                                                    |

### Araç grupları

İzin/engelleme listelerinde `group:*` kısayollarını kullanın:

| Grup               | Araçlar                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash`, `exec` için bir takma ad olarak kabul edilir)                     |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, tts                                                                                |
| `group:openclaw`   | Tüm yerleşik OpenClaw araçları (eklenti araçları hariç)                                                   |

`sessions_history`, sınırlı ve güvenlik filtresinden geçmiş bir geri çağırma görünümü döndürür. Bu görünüm,
thinking etiketlerini, `<relevant-memories>` iskeletini, düz metin araç çağrısı XML
yüklerini (şunlar dahil: `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` ve kırpılmış araç çağrısı blokları),
indirgenmiş araç çağrısı iskeletini, sızmış ASCII/tam genişlikli model kontrol
token'larını ve bozuk MiniMax araç çağrısı XML'ini asistan metninden çıkarır; ardından
ham bir döküm dökümü gibi davranmak yerine redaksiyon/kırpma ve olası aşırı büyük satır yer tutucuları uygular.

### Sağlayıcıya özgü kısıtlamalar

Küresel varsayılanları değiştirmeden belirli sağlayıcılar için araçları kısıtlamak üzere
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

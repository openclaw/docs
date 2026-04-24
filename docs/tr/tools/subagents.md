---
read_when:
    - Aracı üzerinden arka plan/paralel çalışma istiyorsunuz
    - You are changing sessions_spawn or sub-agent tool policy
    - Thread'e bağlı alt aracı oturumlarını uyguluyor veya sorun gideriyorsunuz
summary: 'Alt aracılar: sonuçları istekte bulunan sohbete geri duyuran yalıtılmış aracı çalıştırmaları oluşturma'
title: Alt aracılar
x-i18n:
    generated_at: "2026-04-24T09:37:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 23202b1761e372e547b02183cb68056043aed04b5620db8b222cbfc7e6cd97ab
    source_path: tools/subagents.md
    workflow: 15
---

Alt aracılar, mevcut bir aracı çalıştırmasından oluşturulan arka plan aracı çalıştırmalarıdır. Kendi oturumlarında (`agent:<agentId>:subagent:<uuid>`) çalışırlar ve bittiğinde sonuçlarını istekte bulunan sohbet kanalına **duyururlar**. Her alt aracı çalıştırması bir [background task](/tr/automation/tasks) olarak izlenir.

## Slash komutu

**Geçerli oturum** için alt aracı çalıştırmalarını incelemek veya denetlemek üzere `/subagents` kullanın:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Thread binding denetimleri:

Bu komutlar kalıcı thread binding'lerini destekleyen kanallarda çalışır. Aşağıdaki **Thread destekleyen kanallar** bölümüne bakın.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info`, çalıştırma meta verisini gösterir (durum, zaman damgaları, oturum kimliği, transcript yolu, temizlik).
Sınırlandırılmış, güvenlik filtreli bir geri çağırma görünümü için `sessions_history` kullanın; ham tam transcript'e ihtiyacınız olduğunda
diskteki transcript yolunu inceleyin.

### Spawn davranışı

`/subagents spawn`, dahili bir aktarma değil, kullanıcı komutu olarak bir arka plan alt aracısı başlatır ve çalıştırma bittiğinde istekte bulunan sohbete tek bir nihai tamamlama güncellemesi gönderir.

- Spawn komutu bloklamaz; hemen bir çalıştırma kimliği döndürür.
- Tamamlandığında alt aracı, istekte bulunan sohbet kanalına bir özet/sonuç mesajı duyurur.
- Tamamlama push tabanlıdır. Spawn edildikten sonra bitmesini
  beklemek için yalnızca döngü içinde `/subagents list`,
  `sessions_list` veya `sessions_history` sorgulamayın; durumları yalnızca hata ayıklama veya müdahale için gerektiğinde inceleyin.
- Tamamlandığında OpenClaw, duyuru temizleme akışı devam etmeden önce o alt aracı oturumu tarafından açılan izlenen tarayıcı sekmelerini/süreçlerini en iyi gayretle kapatır.
- Manuel spawn'larda teslim dayanıklıdır:
  - OpenClaw önce kararlı bir idempotency anahtarıyla doğrudan `agent` teslimini dener.
  - Doğrudan teslim başarısız olursa kuyruk yönlendirmesine fallback yapar.
  - Kuyruk yönlendirmesi de mevcut değilse duyuru, nihai vazgeçmeden önce kısa üstel geri çekilmeyle yeniden denenir.
- Tamamlama teslimi çözümlenmiş istekte bulunan rotayı korur:
  - thread'e bağlı veya konuşmaya bağlı tamamlama rotaları mevcutsa önceliklidir
  - tamamlama kaynağı yalnızca bir kanal sağlıyorsa OpenClaw, doğrudan teslimin yine çalışması için istekte bulunan oturumun çözümlenmiş rotasından (`lastChannel` / `lastTo` / `lastAccountId`) eksik hedefi/hesabı doldurur
- İstekte bulunan oturuma tamamlama devri, çalışma zamanında üretilmiş dahili bağlamdır (kullanıcı tarafından yazılmış metin değildir) ve şunları içerir:
  - `Result` (en son görünür `assistant` yanıt metni, aksi halde arındırılmış en son `tool`/`toolResult` metni; terminal başarısız çalıştırmalar yakalanmış yanıt metnini yeniden kullanmaz)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - kompakt çalışma zamanı/token istatistikleri
  - istekte bulunan aracının normal asistan sesiyle yeniden yazmasını söyleyen bir teslim talimatı (ham dahili meta veriyi iletmemeli)
- `--model` ve `--thinking`, o belirli çalıştırma için varsayılanları geçersiz kılar.
- Tamamlandıktan sonraki ayrıntıları ve çıktıyı incelemek için `info`/`log` kullanın.
- `/subagents spawn`, tek seferlik moddur (`mode: "run"`). Kalıcı thread'e bağlı oturumlar için `thread: true` ve `mode: "session"` ile `sessions_spawn` kullanın.
- ACP harness oturumları (Codex, Claude Code, Gemini CLI) için `runtime: "acp"` ile `sessions_spawn` kullanın ve özellikle tamamlamaları veya aracılar arası döngüleri hata ayıklarken [ACP Agents](/tr/tools/acp-agents) ve [ACP teslim modeli](/tr/tools/acp-agents#delivery-model) bölümüne bakın.

Birincil hedefler:

- Ana çalıştırmayı bloklamadan "araştırma / uzun görev / yavaş araç" işlerini paralelleştirmek.
- Alt aracıları varsayılan olarak yalıtılmış tutmak (oturum ayrımı + isteğe bağlı sandbox).
- Araç yüzeyini yanlış kullanımı zor olacak şekilde tutmak: alt aracılar varsayılan olarak oturum araçlarını **almaz**.
- Orkestratör kalıpları için yapılandırılabilir iç içe geçme derinliğini desteklemek.

Maliyet notu: her alt aracının varsayılan olarak **kendi** bağlamı ve token kullanımı vardır. Ağır veya
tekrarlayan görevler için alt aracılara daha ucuz bir model atayın ve ana aracınızı
daha yüksek kaliteli bir modelde tutun. Bunu `agents.defaults.subagents.model` veya aracı başına
geçersiz kılmalar üzerinden yapılandırabilirsiniz. Çocuk gerçekten istekte bulunanın mevcut transcript'ine ihtiyaç duyuyorsa aracı,
o tek spawn için `context: "fork"` isteyebilir.

## Araç

`sessions_spawn` kullanın:

- Bir alt aracı çalıştırması başlatır (`deliver: false`, global şerit: `subagent`)
- Sonra bir duyuru adımı çalıştırır ve duyuru yanıtını istekte bulunan sohbet kanalına gönderir
- Varsayılan model: siz `agents.defaults.subagents.model` (veya aracı başına `agents.list[].subagents.model`) ayarlamadıkça çağıranı devralır; açık bir `sessions_spawn.model` yine önceliklidir.
- Varsayılan thinking: siz `agents.defaults.subagents.thinking` (veya aracı başına `agents.list[].subagents.thinking`) ayarlamadıkça çağıranı devralır; açık bir `sessions_spawn.thinking` yine önceliklidir.
- Varsayılan çalıştırma zaman aşımı: `sessions_spawn.runTimeoutSeconds` atlanırsa OpenClaw ayarlıysa `agents.defaults.subagents.runTimeoutSeconds` kullanır; aksi halde `0`'a (zaman aşımı yok) fallback yapar.

Araç parametreleri:

- `task` (zorunlu)
- `label?` (isteğe bağlı)
- `agentId?` (isteğe bağlı; izin veriliyorsa başka bir aracı kimliği altında spawn)
- `model?` (isteğe bağlı; alt aracı modelini geçersiz kılar; geçersiz değerler atlanır ve alt aracı, araç sonucunda bir uyarıyla varsayılan modelde çalışır)
- `thinking?` (isteğe bağlı; alt aracı çalıştırması için thinking düzeyini geçersiz kılar)
- `runTimeoutSeconds?` (ayarlıysa varsayılan olarak `agents.defaults.subagents.runTimeoutSeconds`, aksi halde `0`; ayarlandığında alt aracı çalıştırması N saniye sonra iptal edilir)
- `thread?` (varsayılan `false`; `true` olduğunda bu alt aracı oturumu için kanal thread binding'i ister)
- `mode?` (`run|session`)
  - varsayılan `run` olur
  - `thread: true` ise ve `mode` atlanmışsa varsayılan `session` olur
  - `mode: "session"`, `thread: true` gerektirir
- `cleanup?` (`delete|keep`, varsayılan `keep`)
- `sandbox?` (`inherit|require`, varsayılan `inherit`; `require`, hedef çocuk çalışma zamanı sandbox içindeyse spawn'a izin verir, değilse reddeder)
- `context?` (`isolated|fork`, varsayılan `isolated`; yalnızca yerel alt aracılar)
  - `isolated` temiz bir çocuk transcript'i oluşturur ve varsayılandır.
  - `fork`, istekte bulunanın mevcut transcript'ini çocuk oturumuna dallandırır; böylece çocuk aynı konuşma bağlamıyla başlar.
  - `fork` yalnızca çocuk mevcut transcript'e ihtiyaç duyduğunda kullanılmalıdır. Kapsamlı işler için `context` vermeyin.
- `sessions_spawn`, kanal teslim parametrelerini (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`) kabul etmez. Teslim için spawn edilen çalıştırmadan `message`/`sessions_send` kullanın.

## Thread'e bağlı oturumlar

Bir kanal için thread binding'leri etkin olduğunda, bir alt aracı thread'e bağlı kalabilir; böylece o thread'deki takip kullanıcı mesajları aynı alt aracı oturumuna yönlenmeye devam eder.

### Thread destekleyen kanallar

- Discord (şu anda desteklenen tek kanal): kalıcı thread'e bağlı alt aracı oturumlarını (`thread: true` ile `sessions_spawn`), manuel thread denetimlerini (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) ve adaptör anahtarları `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` ve `channels.discord.threadBindings.spawnSubagentSessions` destekler.

Hızlı akış:

1. `thread: true` (ve isteğe bağlı `mode: "session"`) kullanarak `sessions_spawn` ile spawn edin.
2. OpenClaw etkin kanalda bu oturum hedefine bir thread oluşturur veya bağlar.
3. Bu thread'deki yanıtlar ve takip mesajları bağlı oturuma yönlendirilir.
4. Etkinsizlik nedeniyle otomatik odağı kaldırmayı incelemek/güncellemek için `/session idle`, sert üst sınırı denetlemek için `/session max-age` kullanın.
5. Elle ayırmak için `/unfocus` kullanın.

Manuel denetimler:

- `/focus <target>`, geçerli thread'i (veya bir tane oluşturur) bir alt aracı/oturum hedefine bağlar.
- `/unfocus`, geçerli bağlı thread için binding'i kaldırır.
- `/agents`, etkin çalıştırmaları ve binding durumunu listeler (`thread:<id>` veya `unbound`).
- `/session idle` ve `/session max-age` yalnızca odaklanmış bağlı thread'lerde çalışır.

Config anahtarları:

- Global varsayılan: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Kanal geçersiz kılma ve spawn otomatik bağlama anahtarları adaptöre özeldir. Yukarıdaki **Thread destekleyen kanallar** bölümüne bakın.

Geçerli adaptör ayrıntıları için bkz. [Configuration Reference](/tr/gateway/configuration-reference) ve [Slash commands](/tr/tools/slash-commands).

Allowlist:

- `agents.list[].subagents.allowAgents`: `agentId` üzerinden hedeflenebilecek aracı kimlikleri listesi (`["*"]` herhangi birine izin verir). Varsayılan: yalnızca istekte bulunan aracı.
- `agents.defaults.subagents.allowAgents`: istekte bulunan aracı kendi `subagents.allowAgents` değerini ayarlamıyorsa kullanılan varsayılan hedef aracı allowlist'i.
- Sandbox devralma koruması: istekte bulunan oturum sandbox içindeyse `sessions_spawn`, sandbox dışında çalışacak hedefleri reddeder.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: true olduğunda `agentId` vermeyen `sessions_spawn` çağrılarını engeller (açık profil seçimini zorlar). Varsayılan: false.

Keşif:

- Şu anda `sessions_spawn` için hangi aracı kimliklerine izin verildiğini görmek üzere `agents_list` kullanın.

Otomatik arşivleme:

- Alt aracı oturumları `agents.defaults.subagents.archiveAfterMinutes` sonrasında otomatik arşivlenir (varsayılan: 60).
- Arşivleme `sessions.delete` kullanır ve transcript'i `*.deleted.<timestamp>` olarak yeniden adlandırır (aynı klasör).
- `cleanup: "delete"`, duyurudan hemen sonra arşivler (yine de transcript'i yeniden adlandırarak tutar).
- Otomatik arşivleme en iyi gayretledir; gateway yeniden başlatılırsa bekleyen zamanlayıcılar kaybolur.
- `runTimeoutSeconds` otomatik arşivleme yapmaz; yalnızca çalıştırmayı durdurur. Oturum otomatik arşive kadar kalır.
- Otomatik arşivleme hem derinlik-1 hem derinlik-2 oturumlara eşit uygulanır.
- Tarayıcı temizliği arşiv temizliğinden ayrıdır: transcript/oturum kaydı tutulsa bile izlenen tarayıcı sekmeleri/süreçleri çalıştırma bittiğinde en iyi gayretle kapatılır.

## İç içe alt aracılar

Varsayılan olarak alt aracılar kendi alt aracılarını spawn edemez (`maxSpawnDepth: 1`). Bir düzey iç içe geçmeyi etkinleştirmek için `maxSpawnDepth: 2` ayarlayabilirsiniz; bu **orkestratör kalıbına** izin verir: ana → orkestratör alt aracı → işçi alt-alt aracılar.

### Nasıl etkinleştirilir

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // alt aracıların çocuk spawn etmesine izin ver (varsayılan: 1)
        maxChildrenPerAgent: 5, // aracı oturumu başına en fazla etkin çocuk (varsayılan: 5)
        maxConcurrent: 8, // global eşzamanlılık şeridi üst sınırı (varsayılan: 8)
        runTimeoutSeconds: 900, // atlandığında sessions_spawn için varsayılan zaman aşımı (0 = zaman aşımı yok)
      },
    },
  },
}
```

### Derinlik düzeyleri

| Derinlik | Oturum anahtarı biçimi                       | Rol                                         | Spawn edebilir mi?            |
| -------- | -------------------------------------------- | ------------------------------------------- | ----------------------------- |
| 0        | `agent:<id>:main`                            | Ana aracı                                   | Her zaman                     |
| 1        | `agent:<id>:subagent:<uuid>`                 | Alt aracı (`maxSpawnDepth >= 2` ise orkestratör) | Yalnızca `maxSpawnDepth >= 2` ise |
| 2        | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Alt-alt aracı (yaprak işçi)                 | Asla                          |

### Duyuru zinciri

Sonuçlar zincir boyunca yukarı akar:

1. Derinlik-2 işçi biter → ebeveynine (derinlik-1 orkestratör) duyurur
2. Derinlik-1 orkestratör duyuruyu alır, sonuçları sentezler, biter → ana aracıya duyurur
3. Ana aracı duyuruyu alır ve kullanıcıya teslim eder

Her düzey yalnızca doğrudan çocuklarından gelen duyuruları görür.

Operasyonel rehberlik:

- Çocuk işi bir kez başlatın ve `sessions_list`, `sessions_history`, `/subagents list` veya
  `exec` sleep komutları etrafında poll döngüleri kurmak yerine tamamlama olaylarını bekleyin.
- Bir çocuk tamamlama olayı, siz nihai yanıtı zaten gönderdikten sonra gelirse,
  doğru takip tam sessiz token `NO_REPLY` / `no_reply` olur.

### Derinliğe göre araç politikası

- Rol ve denetim kapsamı, spawn sırasında oturum meta verisine yazılır. Bu, düzleştirilmiş veya geri yüklenmiş oturum anahtarlarının yanlışlıkla yeniden orkestratör ayrıcalıkları kazanmasını engeller.
- **Derinlik 1 (orkestratör, `maxSpawnDepth >= 2` olduğunda)**: Çocuklarını yönetebilmesi için `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` alır. Diğer oturum/sistem araçları yine reddedilir.
- **Derinlik 1 (yaprak, `maxSpawnDepth == 1` olduğunda)**: Oturum aracı yoktur (geçerli varsayılan davranış).
- **Derinlik 2 (yaprak işçi)**: Oturum aracı yoktur — `sessions_spawn`, derinlik 2'de her zaman reddedilir. Daha fazla çocuk spawn edemez.

### Aracı başına spawn sınırı

Her aracı oturumu (herhangi bir derinlikte), aynı anda en fazla `maxChildrenPerAgent` (varsayılan: 5) etkin çocuğa sahip olabilir. Bu, tek bir orkestratörden kontrolden çıkan fan-out'u önler.

### Kademeli durdurma

Bir derinlik-1 orkestratörü durdurmak, tüm derinlik-2 çocuklarını otomatik olarak durdurur:

- Ana sohbette `/stop`, tüm derinlik-1 aracıları durdurur ve derinlik-2 çocuklarına kademeli olarak iner.
- `/subagents kill <id>`, belirli bir alt aracıyı durdurur ve çocuklarına kademeli olarak iner.
- `/subagents kill all`, istekte bulunan için tüm alt aracıları durdurur ve kademeli olarak iner.

## Kimlik doğrulama

Alt aracı auth'u, oturum türüne göre değil **aracı kimliğine** göre çözülür:

- Alt aracı oturum anahtarı `agent:<agentId>:subagent:<uuid>` olur.
- Auth store, o aracının `agentDir` dizininden yüklenir.
- Ana aracının auth profilleri bir **fallback** olarak birleştirilir; çakışmalarda aracı profilleri ana profilleri geçersiz kılar.

Not: birleştirme eklemelidir, bu yüzden ana profiller fallback olarak her zaman kullanılabilir. Aracı başına tamamen yalıtılmış auth henüz desteklenmiyor.

## Duyuru

Alt aracılar bir duyuru adımı üzerinden geri rapor verir:

- Duyuru adımı istekte bulunan oturumda değil, alt aracı oturumu içinde çalışır.
- Alt aracı tam olarak `ANNOUNCE_SKIP` yanıtını verirse hiçbir şey gönderilmez.
- En son asistan metni tam sessiz token `NO_REPLY` / `no_reply` ise,
  daha önce görünür ilerleme olsa bile duyuru çıktısı bastırılır.
- Aksi halde teslim, istekte bulunan derinliğine bağlıdır:
  - üst düzey istekte bulunan oturumlar, harici teslimli takip `agent` çağrısı kullanır (`deliver=true`)
  - iç içe istekte bulunan alt aracı oturumları, orkestratörün çocuk sonuçlarını oturum içinde sentezleyebilmesi için dahili takip enjeksiyonu alır (`deliver=false`)
  - iç içe istekte bulunan alt aracı oturumu yok olmuşsa OpenClaw, mümkünse o oturumun istekte bulunanına fallback yapar
- Üst düzey istekte bulunan oturumlar için tamamlama modu doğrudan teslim, önce bağlı konuşma/thread rotasını ve kanca geçersiz kılmasını çözümler, sonra eksik kanal-hedef alanlarını istekte bulunan oturumun saklanan rotasından doldurur. Bu, tamamlama kaynağı yalnızca kanalı tanımladığında bile tamamlamaları doğru sohbet/konu üzerinde tutar.
- Çocuk tamamlama toplaması, iç içe tamamlama bulguları oluşturulurken geçerli istekte bulunan çalıştırmasıyla sınırlanır; böylece eski önceki çalıştırma çocuk çıktıları geçerli duyuruya sızmaz.
- Duyuru yanıtları, kanal adaptörlerinde mevcut olduğunda thread/topic yönlendirmesini korur.
- Duyuru bağlamı, kararlı bir dahili olay bloğuna normalize edilir:
  - kaynak (`subagent` veya `cron`)
  - çocuk oturum anahtarı/kimliği
  - duyuru türü + görev etiketi
  - çalışma zamanı sonucundan türetilen durum satırı (`success`, `error`, `timeout` veya `unknown`)
  - en son görünür asistan metninden seçilen sonuç içeriği, aksi halde arındırılmış en son `tool`/`toolResult` metni; terminal başarısız çalıştırmalar yakalanmış yanıt metnini yeniden oynatmadan başarısızlık durumunu bildirir
  - ne zaman yanıt verileceğini ve ne zaman sessiz kalınacağını açıklayan bir takip talimatı
- `Status`, model çıktısından çıkarılmaz; çalışma zamanı sonuç sinyallerinden gelir.
- Zaman aşımında, çocuk yalnızca araç çağrılarına kadar gelebildiyse duyuru, ham araç çıktısını yeniden oynatmak yerine bu geçmişi kısa bir kısmi ilerleme özetine daraltabilir.

Duyuru payload'ları sonda bir istatistik satırı içerir (sarmalanmış olsa bile):

- Çalışma zamanı (ör. `runtime 5m12s`)
- Token kullanımı (girdi/çıktı/toplam)
- Model fiyatlandırması yapılandırılmışsa tahmini maliyet (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` ve transcript yolu (böylece ana aracı `sessions_history` ile geçmişi getirebilir veya dosyayı diskte inceleyebilir)
- Dahili meta veriler yalnızca orkestrasyon içindir; kullanıcıya dönük yanıtlar normal asistan sesiyle yeniden yazılmalıdır.

`sessions_history`, daha güvenli orkestrasyon yoludur:

- asistan geri çağırması önce normalize edilir:
  - thinking etiketleri çıkarılır
  - `<relevant-memories>` / `<relevant_memories>` iskele blokları çıkarılır
  - `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` ve
    `<function_calls>...</function_calls>` gibi düz metin araç çağrısı XML payload blokları,
    temiz kapanmayan kesilmiş payload'lar dahil, çıkarılır
  - düşürülmüş araç çağrısı/sonuç iskelesi ve historical-context işaretleri çıkarılır
  - `<|assistant|>`, diğer ASCII
    `<|...|>` token'ları ve tam genişlikli `<｜...｜>` varyantları gibi sızmış model denetim token'ları çıkarılır
  - bozuk MiniMax araç çağrısı XML'i çıkarılır
- kimlik bilgisi/token benzeri metinler redakte edilir
- uzun bloklar kesilebilir
- çok büyük geçmişlerde eski satırlar düşürülebilir veya aşırı büyük bir satır
  `[sessions_history omitted: message too large]` ile değiştirilebilir
- ham tam bayt düzeyinde transcript gerektiğinde diskteki transcript incelemesi fallback'tir

## Araç Politikası (alt aracı araçları)

Varsayılan olarak alt aracılar, oturum araçları ve sistem araçları hariç **tüm araçları** alır:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history`, burada da sınırlandırılmış, arındırılmış bir geri çağırma görünümü olarak kalır; ham transcript dökümü değildir.

`maxSpawnDepth >= 2` olduğunda, derinlik-1 orkestratör alt aracılar çocuklarını yönetebilmeleri için ek olarak `sessions_spawn`, `subagents`, `sessions_list` ve `sessions_history` alır.

Config ile geçersiz kılın:

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny kazanır
        deny: ["gateway", "cron"],
        // allow ayarlanırsa yalnızca izin ver moduna geçer (deny yine kazanır)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Eşzamanlılık

Alt aracılar ayrılmış, süreç içi bir kuyruk şeridi kullanır:

- Şerit adı: `subagent`
- Eşzamanlılık: `agents.defaults.subagents.maxConcurrent` (varsayılan `8`)

## Durdurma

- İstekte bulunan sohbette `/stop` göndermek, istekte bulunan oturumu iptal eder ve ondan oluşturulan etkin alt aracı çalıştırmalarını durdurur; iç içe çocuklara kademeli olarak iner.
- `/subagents kill <id>`, belirli bir alt aracıyı durdurur ve çocuklarına kademeli olarak iner.

## Sınırlamalar

- Alt aracı duyurusu **best-effort**'tür. Gateway yeniden başlatılırsa bekleyen "geri duyur" işi kaybolur.
- Alt aracılar yine de aynı gateway süreç kaynaklarını paylaşır; `maxConcurrent` değerini bir güvenlik supabı olarak düşünün.
- `sessions_spawn` her zaman bloklamaz: hemen `{ status: "accepted", runId, childSessionKey }` döndürür.
- Alt aracı bağlamı yalnızca `AGENTS.md` + `TOOLS.md` enjekte eder (`SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` veya `BOOTSTRAP.md` yoktur).
- Azami iç içe geçme derinliği 5'tir (`maxSpawnDepth` aralığı: 1–5). Çoğu kullanım durumu için derinlik 2 önerilir.
- `maxChildrenPerAgent`, oturum başına etkin çocuk sayısını sınırlar (varsayılan: 5, aralık: 1–20).

## İlgili

- [ACP agents](/tr/tools/acp-agents)
- [Multi-agent sandbox tools](/tr/tools/multi-agent-sandbox-tools)
- [Agent send](/tr/tools/agent-send)

---
read_when:
    - Aracı üzerinden arka plan/paralel çalışma istiyorsunuz
    - '`sessions_spawn` veya alt aracı araç ilkesini değiştiriyorsunuz'
    - İş parçacığına bağlı subagent oturumlarını uyguluyor veya sorun gideriyorsunuz
summary: 'Alt aracılar: sonucu istekte bulunan sohbet kanalına duyuran, yalıtılmış aracı çalıştırmaları başlatma'
title: Alt Aracılar
x-i18n:
    generated_at: "2026-04-05T14:14:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9df7cc35a3069ce4eb9c92a95df3ce5365a00a3fae92ff73def75461b58fec3f
    source_path: tools/subagents.md
    workflow: 15
---

# Alt Aracılar

Alt aracılar, mevcut bir aracı çalıştırmasından başlatılan arka plan aracı çalıştırmalarıdır. Kendi oturumlarında çalışırlar (`agent:<agentId>:subagent:<uuid>`) ve tamamlandıklarında sonuçlarını istekte bulunan sohbet kanalına **duyururlar**. Her alt aracı çalıştırması bir [background task](/tr/automation/tasks) olarak izlenir.

## Slash komutu

**Geçerli oturum** için alt aracı çalıştırmalarını incelemek veya denetlemek üzere `/subagents` kullanın:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

İş parçacığı bağlama denetimleri:

Bu komutlar, kalıcı iş parçacığı bağlarını destekleyen kanallarda çalışır. Aşağıdaki **İş parçacığını destekleyen kanallar** bölümüne bakın.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info`, çalıştırma meta verilerini gösterir (durum, zaman damgaları, oturum kimliği, döküm yolu, temizleme).
Sınırlı ve güvenlik filtreli bir geri çağırma görünümü için `sessions_history` kullanın; ham tam döküme ihtiyacınız olduğunda
disk üzerindeki döküm yolunu inceleyin.

### Başlatma davranışı

`/subagents spawn`, bir arka plan alt aracısını dahili bir aktarma olarak değil kullanıcı komutu olarak başlatır ve çalıştırma bittiğinde istekte bulunan sohbet kanalına tek bir son tamamlama güncellemesi gönderir.

- Başlatma komutu bloklamaz; bir çalıştırma kimliğini hemen döndürür.
- Tamamlandığında, alt aracı istekte bulunan sohbet kanalına bir özet/sonuç mesajı duyurur.
- Tamamlama itme tabanlıdır. Başlatıldıktan sonra, bitmesini beklemek için döngü içinde `/subagents list`,
  `sessions_list` veya `sessions_history` sorgulamayın; durumu yalnızca hata ayıklama veya müdahale gerektiğinde inceleyin.
- Tamamlandığında, OpenClaw, duyuru temizleme akışı devam etmeden önce bu alt aracı oturumunun açtığı izlenen tarayıcı sekmelerini/süreçlerini imkanlar dahilinde kapatır.
- Manuel başlatmalarda teslim dayanıklıdır:
  - OpenClaw önce kararlı bir idempotency anahtarıyla doğrudan `agent` teslimini dener.
  - Doğrudan teslim başarısız olursa kuyruk yönlendirmesine geri döner.
  - Kuyruk yönlendirmesi de kullanılamıyorsa, nihai vazgeçmeden önce duyuru kısa bir üstel geri çekilme ile yeniden denenir.
- Tamamlama teslimi çözümlenmiş istekte bulunan rota bilgisini korur:
  - mevcutsa, iş parçacığına bağlı veya konuşmaya bağlı tamamlama rotaları önceliklidir
  - tamamlama kaynağı yalnızca bir kanal sağlıyorsa, OpenClaw eksik hedef/hesap bilgisini istekte bulunan oturumun çözümlenmiş rotasından (`lastChannel` / `lastTo` / `lastAccountId`) doldurur; böylece doğrudan teslim yine çalışır
- İstekte bulunan oturuma yapılan tamamlama devri, çalışma zamanında üretilen dahili bağlamdır (kullanıcı tarafından yazılmış metin değildir) ve şunları içerir:
  - `Result` (en son görünür `assistant` yanıt metni, yoksa temizlenmiş en son tool/toolResult metni)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - kompakt çalışma zamanı/token istatistikleri
  - istekte bulunan aracının bunu ham dahili meta veri olarak iletmek yerine normal aracı sesiyle yeniden yazmasını söyleyen bir teslim talimatı
- `--model` ve `--thinking`, bu belirli çalıştırma için varsayılanları geçersiz kılar.
- Tamamlandıktan sonra ayrıntıları ve çıktıyı incelemek için `info`/`log` kullanın.
- `/subagents spawn` tek seferlik moddur (`mode: "run"`). Kalıcı iş parçacığına bağlı oturumlar için `thread: true` ve `mode: "session"` ile `sessions_spawn` kullanın.
- ACP harness oturumları için (Codex, Claude Code, Gemini CLI), `runtime: "acp"` ile `sessions_spawn` kullanın ve [ACP Agents](/tr/tools/acp-agents) bölümüne bakın.

Birincil hedefler:

- Ana çalıştırmayı engellemeden "araştırma / uzun görev / yavaş araç" işlerini paralelleştirmek.
- Alt aracıları varsayılan olarak yalıtılmış tutmak (oturum ayrımı + isteğe bağlı sandboxing).
- Araç yüzeyini kötü kullanımı zor olacak şekilde tutmak: alt aracılar varsayılan olarak oturum araçlarını almaz.
- Orkestratör desenleri için yapılandırılabilir iç içe geçme derinliğini desteklemek.

Maliyet notu: her alt aracının **kendi** bağlamı ve token kullanımı vardır. Ağır veya tekrarlayan görevler için
alt aracılar için daha ucuz bir model ayarlayın ve ana aracınızı daha yüksek kaliteli bir modelde tutun.
Bunu `agents.defaults.subagents.model` veya aracı başına geçersiz kılmalarla yapılandırabilirsiniz.

## Araç

` sessions_spawn` kullanın:

- Bir alt aracı çalıştırması başlatır (`deliver: false`, genel kulvar: `subagent`)
- Ardından bir duyuru adımı çalıştırır ve duyuru yanıtını istekte bulunan sohbet kanalına gönderir
- Varsayılan model: `agents.defaults.subagents.model` (veya aracı başına `agents.list[].subagents.model`) ayarlamadığınız sürece çağıranı devralır; açık bir `sessions_spawn.model` yine önceliklidir.
- Varsayılan düşünme düzeyi: `agents.defaults.subagents.thinking` (veya aracı başına `agents.list[].subagents.thinking`) ayarlamadığınız sürece çağıranı devralır; açık bir `sessions_spawn.thinking` yine önceliklidir.
- Varsayılan çalışma zaman aşımı: `sessions_spawn.runTimeoutSeconds` atlanırsa, OpenClaw ayarlıysa `agents.defaults.subagents.runTimeoutSeconds` kullanır; aksi halde `0`'a geri döner (zaman aşımı yok).

Araç parametreleri:

- `task` (zorunlu)
- `label?` (isteğe bağlı)
- `agentId?` (isteğe bağlı; izin veriliyorsa başka bir aracı kimliği altında başlatır)
- `model?` (isteğe bağlı; alt aracı modelini geçersiz kılar; geçersiz değerler atlanır ve alt aracı, araç sonucunda bir uyarıyla varsayılan modelde çalışır)
- `thinking?` (isteğe bağlı; alt aracı çalıştırması için düşünme düzeyini geçersiz kılar)
- `runTimeoutSeconds?` (ayarlandıysa varsayılan olarak `agents.defaults.subagents.runTimeoutSeconds`, aksi halde `0`; ayarlandığında, alt aracı çalıştırması N saniye sonra durdurulur)
- `thread?` (varsayılan `false`; `true` olduğunda, bu alt aracı oturumu için kanal iş parçacığı bağlaması ister)
- `mode?` (`run|session`)
  - varsayılan `run`'dır
  - `thread: true` ise ve `mode` atlanmışsa, varsayılan `session` olur
  - `mode: "session"` için `thread: true` gereklidir
- `cleanup?` (`delete|keep`, varsayılan `keep`)
- `sandbox?` (`inherit|require`, varsayılan `inherit`; `require`, hedef alt çalışma zamanı sandbox içinde değilse başlatmayı reddeder)
- `sessions_spawn`, kanal teslim parametrelerini kabul etmez (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Teslim için, başlatılan çalıştırmadan `message`/`sessions_send` kullanın.

## İş parçacığına bağlı oturumlar

Bir kanalda iş parçacığı bağları etkinleştirildiğinde, bir alt aracı bir iş parçacığına bağlı kalabilir; böylece o iş parçacığındaki sonraki kullanıcı mesajları aynı alt aracı oturumuna yönlendirilmeye devam eder.

### İş parçacığını destekleyen kanallar

- Discord (şu anda desteklenen tek kanal): kalıcı iş parçacığına bağlı subagent oturumlarını (`thread: true` ile `sessions_spawn`), manuel iş parçacığı denetimlerini (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) ve `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` ve `channels.discord.threadBindings.spawnSubagentSessions` bağdaştırıcı anahtarlarını destekler.

Hızlı akış:

1. `thread: true` (ve isteğe bağlı olarak `mode: "session"`) ile `sessions_spawn` kullanarak başlatın.
2. OpenClaw, etkin kanalda bu oturum hedefi için bir iş parçacığı oluşturur veya bağlar.
3. O iş parçacığındaki yanıtlar ve takip mesajları bağlı oturuma yönlendirilir.
4. Etkinsizlik nedeniyle otomatik odak kaldırmayı incelemek/güncellemek için `/session idle`, katı üst sınırı denetlemek için `/session max-age` kullanın.
5. Manuel olarak ayırmak için `/unfocus` kullanın.

Manuel denetimler:

- `/focus <target>` geçerli iş parçacığını (veya yeni bir tane oluşturarak) bir alt aracı/oturum hedefine bağlar.
- `/unfocus` geçerli bağlı iş parçacığının bağını kaldırır.
- `/agents` etkin çalıştırmaları ve bağ durumunu (`thread:<id>` veya `unbound`) listeler.
- `/session idle` ve `/session max-age` yalnızca odaklanmış bağlı iş parçacıkları için çalışır.

Config anahtarları:

- Genel varsayılan: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Kanal geçersiz kılmaları ve başlatmada otomatik bağlama anahtarları bağdaştırıcıya özeldir. Yukarıdaki **İş parçacığını destekleyen kanallar** bölümüne bakın.

Geçerli bağdaştırıcı ayrıntıları için [Configuration Reference](/tr/gateway/configuration-reference) ve [Slash commands](/tools/slash-commands) bölümlerine bakın.

İzin listesi:

- `agents.list[].subagents.allowAgents`: `agentId` ile hedeflenebilecek aracı kimliklerinin listesi (`["*"]` herhangi birine izin verir). Varsayılan: yalnızca istekte bulunan aracı.
- `agents.defaults.subagents.allowAgents`: istekte bulunan aracının kendi `subagents.allowAgents` ayarı yoksa kullanılan varsayılan hedef aracı izin listesi.
- Sandbox devralma koruması: istekte bulunan oturum sandbox içindeyse, `sessions_spawn` sandbox olmadan çalışacak hedefleri reddeder.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: true olduğunda, `agentId` atlayan `sessions_spawn` çağrılarını engeller (açık profil seçimini zorunlu kılar). Varsayılan: false.

Keşif:

- `sessions_spawn` için şu anda hangi aracı kimliklerine izin verildiğini görmek üzere `agents_list` kullanın.

Otomatik arşivleme:

- Alt aracı oturumları `agents.defaults.subagents.archiveAfterMinutes` sonrasında otomatik olarak arşivlenir (varsayılan: 60).
- Arşivleme `sessions.delete` kullanır ve dökümü `*.deleted.<timestamp>` olarak yeniden adlandırır (aynı klasörde).
- `cleanup: "delete"`, duyurudan hemen sonra arşivler (yine de dökümü yeniden adlandırarak korur).
- Otomatik arşivleme imkanlar dahilindedir; gateway yeniden başlatılırsa bekleyen zamanlayıcılar kaybolur.
- `runTimeoutSeconds` otomatik arşivleme yapmaz; yalnızca çalıştırmayı durdurur. Oturum otomatik arşive kadar kalır.
- Otomatik arşivleme hem derinlik-1 hem de derinlik-2 oturumlarına eşit şekilde uygulanır.
- Tarayıcı temizliği, arşiv temizliğinden ayrıdır: izlenen tarayıcı sekmeleri/süreçleri, döküm/oturum kaydı tutulsa bile çalıştırma bittiğinde imkanlar dahilinde kapatılır.

## İç içe Alt Aracılar

Varsayılan olarak alt aracılar kendi alt aracılarını başlatamaz (`maxSpawnDepth: 1`). `maxSpawnDepth: 2` ayarlayarak bir seviye iç içe geçmeyi etkinleştirebilirsiniz; bu, **orkestratör deseni**ne izin verir: ana → orkestratör alt aracı → çalışan alt-alt aracılar.

### Nasıl etkinleştirilir

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // alt aracıların çocuk başlatmasına izin ver (varsayılan: 1)
        maxChildrenPerAgent: 5, // aracı oturumu başına en fazla etkin çocuk (varsayılan: 5)
        maxConcurrent: 8, // genel eşzamanlılık kulvar sınırı (varsayılan: 8)
        runTimeoutSeconds: 900, // atlandığında sessions_spawn için varsayılan zaman aşımı (0 = zaman aşımı yok)
      },
    },
  },
}
```

### Derinlik düzeyleri

| Derinlik | Oturum anahtarı şekli                      | Rol                                             | Başlatabilir mi?             |
| -------- | ------------------------------------------ | ----------------------------------------------- | ---------------------------- |
| 0        | `agent:<id>:main`                          | Ana aracı                                       | Her zaman                    |
| 1        | `agent:<id>:subagent:<uuid>`               | Alt aracı (derinlik 2'ye izin veriliyorsa orkestratör) | Yalnızca `maxSpawnDepth >= 2` ise |
| 2        | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Alt-alt aracı (yaprak çalışan)                | Asla                         |

### Duyuru zinciri

Sonuçlar zincir boyunca yukarı akar:

1. Derinlik-2 çalışanı biter → üst öğesine (derinlik-1 orkestratör) duyurur
2. Derinlik-1 orkestratör duyuruyu alır, sonuçları sentezler, biter → ana öğeye duyurur
3. Ana aracı duyuruyu alır ve kullanıcıya teslim eder

Her düzey yalnızca doğrudan çocuklarından gelen duyuruları görür.

Operasyonel rehberlik:

- Çocuk işi bir kez başlatın ve tamamlanma olaylarını bekleyin; `sessions_list`, `sessions_history`, `/subagents list` veya `exec` sleep komutları etrafında yoklama döngüleri kurmayın.
- Bir çocuk tamamlama olayı, siz son yanıtı gönderdikten sonra gelirse, doğru takip yanıtı tam olarak sessiz belirteç `NO_REPLY` / `no_reply` olur.

### Derinliğe göre araç ilkesi

- Rol ve denetim kapsamı başlatma sırasında oturum meta verilerine yazılır. Bu, düz veya geri yüklenmiş oturum anahtarlarının yanlışlıkla yeniden orkestratör ayrıcalıkları kazanmasını engeller.
- **Derinlik 1 (orkestratör, `maxSpawnDepth >= 2` olduğunda)**: Çocuklarını yönetebilmesi için `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` alır. Diğer oturum/sistem araçları yine reddedilir.
- **Derinlik 1 (yaprak, `maxSpawnDepth == 1` olduğunda)**: Oturum aracı yoktur (geçerli varsayılan davranış).
- **Derinlik 2 (yaprak çalışan)**: Oturum aracı yoktur — `sessions_spawn`, derinlik 2'de her zaman reddedilir. Daha fazla çocuk başlatamaz.

### Aracı başına başlatma sınırı

Her aracı oturumu (herhangi bir derinlikte) aynı anda en fazla `maxChildrenPerAgent` (varsayılan: 5) etkin çocuğa sahip olabilir. Bu, tek bir orkestratörden kontrolden çıkan yelpazelenmeyi önler.

### Basamaklı durdurma

Bir derinlik-1 orkestratörü durdurmak, tüm derinlik-2 çocuklarını otomatik olarak durdurur:

- Ana sohbette `/stop`, tüm derinlik-1 aracılarını durdurur ve derinlik-2 çocuklarına kademeli olarak iner.
- `/subagents kill <id>`, belirli bir alt aracıyı durdurur ve çocuklarına kademeli olarak iner.
- `/subagents kill all`, istekte bulunan için tüm alt aracıları durdurur ve kademeli olarak iner.

## Kimlik doğrulama

Alt aracı kimlik doğrulaması, oturum türüne göre değil **aracı kimliğine** göre çözülür:

- Alt aracı oturum anahtarı `agent:<agentId>:subagent:<uuid>` biçimindedir.
- Kimlik doğrulama deposu, o aracının `agentDir` dizininden yüklenir.
- Ana aracının auth profilleri bir **yedek** olarak birleştirilir; çakışmalarda aracı profilleri ana profilleri geçersiz kılar.

Not: birleştirme eklemelidir; bu nedenle ana profiller her zaman yedek olarak kullanılabilir. Aracı başına tamamen yalıtılmış auth henüz desteklenmiyor.

## Duyuru

Alt aracılar bir duyuru adımıyla geri rapor verir:

- Duyuru adımı, istekte bulunan oturumda değil alt aracı oturumunda çalışır.
- Alt aracı tam olarak `ANNOUNCE_SKIP` ile yanıt verirse hiçbir şey gönderilmez.
- En son assistant metni tam olarak sessiz belirteç `NO_REPLY` / `no_reply` ise,
  daha önce görünür ilerleme olsa bile duyuru çıktısı bastırılır.
- Aksi halde teslim, istekte bulunanın derinliğine bağlıdır:
  - üst düzey istekte bulunan oturumları, harici teslimli (`deliver=true`) bir takip `agent` çağrısı kullanır
  - iç içe istekte bulunan subagent oturumları, orkestratörün çocuk sonuçlarını oturum içinde sentezleyebilmesi için dahili bir takip eklemesi (`deliver=false`) alır
  - iç içe istekte bulunan subagent oturumu artık yoksa, OpenClaw imkanlar dahilinde o oturumun istekte bulunanına geri döner
- Üst düzey istekte bulunan oturumları için, tamamlama modundaki doğrudan teslim önce bağlı konuşma/iş parçacığı rotasını ve hook geçersiz kılmasını çözümler, sonra eksik kanal-hedef alanlarını istekte bulunan oturumun saklanan rotasından doldurur. Bu, tamamlama kaynağı yalnızca kanalı tanımlasa bile tamamlamaları doğru sohbet/konu üzerinde tutar.
- İç içe tamamlama bulguları oluşturulurken, çocuk tamamlama toplaması geçerli istekte bulunan çalıştırma kapsamıyla sınırlanır; böylece önceki çalıştırmalardan kalan çocuk çıktıları geçerli duyuruya sızmaz.
- Duyuru yanıtları, kanal bağdaştırıcılarında mevcut olduğunda iş parçacığı/konu yönlendirmesini korur.
- Duyuru bağlamı, kararlı bir dahili olay bloğuna normalize edilir:
  - kaynak (`subagent` veya `cron`)
  - çocuk oturum anahtarı/kimliği
  - duyuru türü + görev etiketi
  - çalışma zamanı sonucundan türetilen durum satırı (`success`, `error`, `timeout` veya `unknown`)
  - en son görünür assistant metninden seçilen, yoksa temizlenmiş en son tool/toolResult metni olan sonuç içeriği
  - ne zaman yanıt verileceğini ve ne zaman sessiz kalınacağını açıklayan bir takip talimatı
- `Status`, model çıktısından çıkarılmaz; çalışma zamanı sonuç sinyallerinden gelir.
- Zaman aşımında, çocuk yalnızca araç çağrılarına kadar ilerlediyse, duyuru ham araç çıktısını yinelemek yerine bu geçmişi kısa bir kısmi ilerleme özetine indirgemebilir.

Duyuru yükleri, sarmalansalar bile sonda bir istatistik satırı içerir:

- Çalışma zamanı (ör. `runtime 5m12s`)
- Token kullanımı (girdi/çıktı/toplam)
- Model fiyatlandırması yapılandırıldıysa tahmini maliyet (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` ve döküm yolu (ana aracının geçmişi `sessions_history` ile alabilmesi veya dosyayı diskten inceleyebilmesi için)
- Dahili meta veriler yalnızca orkestrasyon içindir; kullanıcıya dönük yanıtlar normal aracı sesiyle yeniden yazılmalıdır.

`sessions_history`, daha güvenli orkestrasyon yoludur:

- önce assistant geri çağırması normalize edilir:
  - thinking etiketleri çıkarılır
  - `<relevant-memories>` / `<relevant_memories>` iskelet blokları çıkarılır
  - `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` ve
    `<function_calls>...</function_calls>` gibi düz metin tool-call XML yük blokları çıkarılır; düzgün kapanmayan kısaltılmış yükler de buna dahildir
  - düşürülmüş tool-call/result iskeletleri ve historical-context işaretçileri çıkarılır
  - `<|assistant|>`, diğer ASCII `<|...|>` belirteçleri ve tam genişlikli `<｜...｜>` varyantları gibi sızmış model kontrol belirteçleri çıkarılır
  - bozuk MiniMax tool-call XML'i çıkarılır
- kimlik bilgisi/token benzeri metinler sansürlenir
- uzun bloklar kısaltılabilir
- çok büyük geçmişlerde daha eski satırlar düşürülebilir veya aşırı büyük bir satır
  `[sessions_history omitted: message too large]`
  ile değiştirilebilir
- ham tam bayt döküme ihtiyaç duyduğunuzda, disk üzerindeki dökümü incelemek geri dönüş seçeneğidir

## Araç İlkesi (alt aracı araçları)

Varsayılan olarak alt aracılar, oturum araçları ve sistem araçları dışındaki **tüm araçları** alır:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

Buradaki `sessions_history` de sınırlı ve temizlenmiş bir geri çağırma görünümü olarak kalır; ham döküm boşaltması değildir.

`maxSpawnDepth >= 2` olduğunda, derinlik-1 orkestratör alt aracılar çocuklarını yönetebilmeleri için ayrıca `sessions_spawn`, `subagents`, `sessions_list` ve `sessions_history` alır.

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
        // reddetme önceliklidir
        deny: ["gateway", "cron"],
        // allow ayarlanırsa yalnızca izin verilen mod olur (deny yine önceliklidir)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Eşzamanlılık

Alt aracılar özel bir süreç içi kuyruk kulvarı kullanır:

- Kulvar adı: `subagent`
- Eşzamanlılık: `agents.defaults.subagents.maxConcurrent` (varsayılan `8`)

## Durdurma

- İstekte bulunan sohbette `/stop` göndermek, istekte bulunan oturumu iptal eder ve ondan başlatılan etkin alt aracı çalıştırmalarını durdurur; bu durum iç içe çocuklara da kademeli olarak uygulanır.
- `/subagents kill <id>`, belirli bir alt aracıyı durdurur ve çocuklarına kademeli olarak uygulanır.

## Sınırlamalar

- Alt aracı duyurusu **imkanlar dahilindedir**. Gateway yeniden başlatılırsa bekleyen "geri duyurma" işi kaybolur.
- Alt aracılar yine aynı gateway süreç kaynaklarını paylaşır; `maxConcurrent` değerini bir güvenlik supabı olarak değerlendirin.
- `sessions_spawn` her zaman bloklamaz: hemen `{ status: "accepted", runId, childSessionKey }` döndürür.
- Alt aracı bağlamı yalnızca `AGENTS.md` + `TOOLS.md` ekler (`SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` veya `BOOTSTRAP.md` yoktur).
- En yüksek iç içe geçme derinliği 5'tir (`maxSpawnDepth` aralığı: 1–5). Çoğu kullanım durumu için derinlik 2 önerilir.
- `maxChildrenPerAgent`, oturum başına etkin çocuk sayısını sınırlar (varsayılan: 5, aralık: 1–20).

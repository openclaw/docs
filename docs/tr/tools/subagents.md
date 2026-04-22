---
read_when:
    - Ajan üzerinden arka plan/paralel çalışma istiyorsunuz
    - '`sessions_spawn` veya alt ajan araç ilkesini değiştiriyorsunuz'
    - İş parçacığına bağlı alt ajan oturumlarını uyguluyor veya sorun gideriyorsunuz
summary: 'Alt ajanlar: sonuçları istek sahibi sohbete geri bildiren yalıtılmış ajan çalıştırmaları başlatma'
title: Alt Ajanlar
x-i18n:
    generated_at: "2026-04-22T04:28:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef8d8faa296bdc1b56079bd4a24593ba2e1aa02b9929a7a191b0d8498364ce4e
    source_path: tools/subagents.md
    workflow: 15
---

# Alt Ajanlar

Alt ajanlar, mevcut bir ajan çalıştırmasından başlatılan arka plan ajan çalıştırmalarıdır. Kendi oturumlarında çalışırlar (`agent:<agentId>:subagent:<uuid>`) ve tamamlandıklarında, sonuçlarını istek sahibinin sohbet kanalına geri **duyururlar**. Her alt ajan çalıştırması bir [background task](/tr/automation/tasks) olarak izlenir.

## Slash komutu

Geçerli oturum için alt ajan çalıştırmalarını incelemek veya denetlemek amacıyla `/subagents` kullanın:

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

İş parçacığı bağlama denetimleri:

Bu komutlar kalıcı iş parçacığı bağlarını destekleyen kanallarda çalışır. Aşağıdaki **İş parçacığını destekleyen kanallar** bölümüne bakın.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info`, çalıştırma meta verilerini gösterir (durum, zaman damgaları, oturum kimliği, transcript yolu, cleanup).
Sınırlandırılmış, güvenlik filtreli bir geri çağırma görünümü için `sessions_history` kullanın; ham tam transcript'e ihtiyacınız olduğunda
disk üzerindeki transcript yolunu inceleyin.

### Başlatma davranışı

`/subagents spawn`, iç yönlendirme olarak değil kullanıcı komutu olarak arka planda bir alt ajan başlatır ve çalıştırma tamamlandığında istek sahibinin sohbetine tek bir son tamamlama güncellemesi gönderir.

- Başlatma komutu bloklamaz; hemen bir çalıştırma kimliği döndürür.
- Tamamlandığında alt ajan, istek sahibinin sohbet kanalına geri bir özet/sonuç mesajı duyurur.
- Tamamlama push tabanlıdır. Başlatıldıktan sonra bitmesini
  beklemek için `/subagents list`, `sessions_list` veya `sessions_history` üzerinde döngü halinde sorgulama yapmayın;
  durumu yalnızca hata ayıklama veya müdahale gerektiğinde isteğe bağlı olarak inceleyin.
- Tamamlandığında OpenClaw, duyuru cleanup akışı devam etmeden önce o alt ajan oturumu tarafından açılmış izlenen tarayıcı sekmelerini/süreçlerini en iyi çaba ile kapatır.
- Elle başlatmalarda teslimat dayanıklıdır:
  - OpenClaw önce kararlı bir idempotency anahtarıyla doğrudan `agent` teslimatını dener.
  - Doğrudan teslimat başarısız olursa, kuyruk yönlendirmesine geri döner.
  - Kuyruk yönlendirmesi de kullanılabilir değilse, duyuru nihai vazgeçmeden önce kısa üstel backoff ile yeniden denenir.
- Tamamlama teslimatı çözümlenmiş istek sahibi rotasını korur:
  - mümkün olduğunda iş parçacığına bağlı veya konuşmaya bağlı tamamlama rotaları kazanır
  - tamamlama kaynağı yalnızca bir kanal sağlıyorsa, OpenClaw eksik hedef/hesap bilgisini istek sahibi oturumunun çözümlenmiş rotasından (`lastChannel` / `lastTo` / `lastAccountId`) doldurur; böylece doğrudan teslimat yine çalışır
- İstek sahibi oturumuna tamamlama devri, çalışma zamanında üretilmiş dahili bağlamdır (kullanıcı tarafından yazılmış metin değildir) ve şunları içerir:
  - `Result` (en son görünür `assistant` yanıt metni, aksi halde temizlenmiş en son `tool`/`toolResult` metni; sonu başarısız olan çalıştırmalar yakalanmış yanıt metnini yeniden kullanmaz)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - kompakt çalışma zamanı/token istatistikleri
  - istek sahibi ajana ham dahili meta veriyi iletmek yerine normal asistan sesiyle yeniden yazmasını söyleyen bir teslimat yönergesi
- `--model` ve `--thinking`, yalnızca o çalıştırma için varsayılanları geçersiz kılar.
- Tamamlandıktan sonra ayrıntıları ve çıktıyı incelemek için `info`/`log` kullanın.
- `/subagents spawn`, tek seferlik moddur (`mode: "run"`). Kalıcı iş parçacığına bağlı oturumlar için `thread: true` ve `mode: "session"` ile `sessions_spawn` kullanın.
- ACP harness oturumları için (Codex, Claude Code, Gemini CLI), `runtime: "acp"` ile `sessions_spawn` kullanın ve tamamlama veya ajandan ajana döngülerde hata ayıklarken özellikle [ACP delivery model](/tr/tools/acp-agents#delivery-model) olmak üzere [ACP Agents](/tr/tools/acp-agents) bölümüne bakın.

Birincil hedefler:

- Ana çalıştırmayı bloklamadan "araştırma / uzun görev / yavaş araç" işini paralelleştirmek.
- Alt ajanları varsayılan olarak yalıtılmış tutmak (oturum ayrımı + isteğe bağlı sandboxing).
- Araç yüzeyini kötüye kullanımı zor tutmak: alt ajanlar varsayılan olarak oturum araçlarını **almaz**.
- Orkestratör desenleri için yapılandırılabilir iç içe yerleşme derinliğini desteklemek.

Maliyet notu: her alt ajanın **kendi** bağlamı ve token kullanımı vardır. Ağır veya tekrarlayan
görevler için alt ajanlar adına daha ucuz bir model ayarlayın ve ana ajanınızı daha kaliteli bir modelde tutun.
Bunu `agents.defaults.subagents.model` veya ajan başına geçersiz kılmalar ile yapılandırabilirsiniz.

## Araç

`sessions_spawn` kullanın:

- Bir alt ajan çalıştırması başlatır (`deliver: false`, global hat: `subagent`)
- Sonra bir duyuru adımı çalıştırır ve duyuru yanıtını istek sahibinin sohbet kanalına gönderir
- Varsayılan model: `agents.defaults.subagents.model` (veya ajan başına `agents.list[].subagents.model`) ayarlamadığınız sürece çağıranı devralır; açık `sessions_spawn.model` yine kazanır.
- Varsayılan thinking: `agents.defaults.subagents.thinking` (veya ajan başına `agents.list[].subagents.thinking`) ayarlamadığınız sürece çağıranı devralır; açık `sessions_spawn.thinking` yine kazanır.
- Varsayılan çalıştırma zaman aşımı: `sessions_spawn.runTimeoutSeconds` atlanırsa OpenClaw ayarlı olduğunda `agents.defaults.subagents.runTimeoutSeconds` kullanır; aksi halde `0` değerine geri döner (zaman aşımı yok).

Araç parametreleri:

- `task` (zorunlu)
- `label?` (isteğe bağlı)
- `agentId?` (isteğe bağlı; izin veriliyorsa başka bir ajan kimliği altında başlatır)
- `model?` (isteğe bağlı; alt ajan modelini geçersiz kılar; geçersiz değerler atlanır ve alt ajan varsayılan model üzerinde çalışır; araç sonucunda bir uyarı verilir)
- `thinking?` (isteğe bağlı; alt ajan çalıştırması için thinking düzeyini geçersiz kılar)
- `runTimeoutSeconds?` (ayarlıysa varsayılan olarak `agents.defaults.subagents.runTimeoutSeconds`, aksi halde `0`; ayarlandığında alt ajan çalıştırması N saniye sonra durdurulur)
- `thread?` (varsayılan `false`; `true` olduğunda bu alt ajan oturumu için kanal iş parçacığı bağlaması ister)
- `mode?` (`run|session`)
  - varsayılan `run`'dır
  - `thread: true` ve `mode` atlanırsa varsayılan `session` olur
  - `mode: "session"` için `thread: true` gerekir
- `cleanup?` (`delete|keep`, varsayılan `keep`)
- `sandbox?` (`inherit|require`, varsayılan `inherit`; `require`, hedef alt çalışma zamanı sandbox'lı değilse başlatmayı reddeder)
- `sessions_spawn`, kanal teslimat parametrelerini kabul etmez (`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`). Teslimat için, başlatılan çalıştırmadan `message`/`sessions_send` kullanın.

## İş parçacığına bağlı oturumlar

Bir kanalda iş parçacığı bağları etkin olduğunda, bir alt ajan bir iş parçacığına bağlı kalabilir; böylece o iş parçacığındaki takip kullanıcı mesajları aynı alt ajan oturumuna yönlenmeye devam eder.

### İş parçacığını destekleyen kanallar

- Discord (şu anda desteklenen tek kanal): kalıcı iş parçacığına bağlı alt ajan oturumlarını (`thread: true` ile `sessions_spawn`), elle iş parçacığı denetimlerini (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) ve `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours` ve `channels.discord.threadBindings.spawnSubagentSessions` bağdaştırıcı anahtarlarını destekler.

Hızlı akış:

1. `thread: true` ile `sessions_spawn` kullanarak başlatın (isteğe bağlı olarak `mode: "session"` ile).
2. OpenClaw etkin kanalda o oturum hedefine bir iş parçacığı oluşturur veya bağlar.
3. O iş parçacığındaki yanıtlar ve takip mesajları bağlı oturuma yönlenir.
4. Etkinsizlik nedeniyle otomatik unfocus davranışını incelemek/güncellemek için `/session idle`, kesin sınırı denetlemek için `/session max-age` kullanın.
5. Elle ayırmak için `/unfocus` kullanın.

Elle denetimler:

- `/focus <target>`, geçerli iş parçacığını (veya yeni bir iş parçacığı oluşturarak) alt ajan/oturum hedefine bağlar.
- `/unfocus`, geçerli bağlı iş parçacığının bağını kaldırır.
- `/agents`, etkin çalıştırmaları ve bağ durumunu listeler (`thread:<id>` veya `unbound`).
- `/session idle` ve `/session max-age` yalnızca odaklanmış bağlı iş parçacıklarında çalışır.

Yapılandırma anahtarları:

- Genel varsayılan: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- Kanal geçersiz kılmaları ve başlatma otomatik bağlama anahtarları bağdaştırıcıya özgüdür. Yukarıdaki **İş parçacığını destekleyen kanallar** bölümüne bakın.

Güncel bağdaştırıcı ayrıntıları için [Configuration Reference](/tr/gateway/configuration-reference) ve [Slash commands](/tr/tools/slash-commands) bölümlerine bakın.

İzin listesi:

- `agents.list[].subagents.allowAgents`: `agentId` aracılığıyla hedeflenebilecek ajan kimlikleri listesi (`["*"]` herhangi birine izin verir). Varsayılan: yalnızca istek sahibi ajan.
- `agents.defaults.subagents.allowAgents`: istek sahibi ajan kendi `subagents.allowAgents` alanını ayarlamadığında kullanılan varsayılan hedef ajan izin listesi.
- Sandbox kalıtım koruması: istek sahibi oturum sandbox'lıysa, `sessions_spawn` sandbox'sız çalışacak hedefleri reddeder.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: true olduğunda `agentId` atlayan `sessions_spawn` çağrılarını engeller (açık profil seçimini zorlar). Varsayılan: false.

Keşif:

- `sessions_spawn` için şu anda hangi ajan kimliklerine izin verildiğini görmek üzere `agents_list` kullanın.

Otomatik arşivleme:

- Alt ajan oturumları `agents.defaults.subagents.archiveAfterMinutes` sonrasında otomatik arşivlenir (varsayılan: 60).
- Arşivleme, `sessions.delete` kullanır ve transcript'i `*.deleted.<timestamp>` olarak yeniden adlandırır (aynı klasörde).
- `cleanup: "delete"`, duyurudan hemen sonra arşivler (yeniden adlandırma yoluyla transcript yine korunur).
- Otomatik arşivleme en iyi çaba esaslıdır; Gateway yeniden başlarsa bekleyen zamanlayıcılar kaybolur.
- `runTimeoutSeconds` otomatik arşivleme yapmaz; yalnızca çalıştırmayı durdurur. Oturum otomatik arşivlemeye kadar kalır.
- Otomatik arşivleme hem derinlik-1 hem de derinlik-2 oturumlarına eşit şekilde uygulanır.
- Tarayıcı cleanup'ı arşiv cleanup'ından ayrıdır: transcript/oturum kaydı tutulsa bile, çalıştırma tamamlandığında izlenen tarayıcı sekmeleri/süreçleri en iyi çaba ile kapatılır.

## İç İçe Alt Ajanlar

Varsayılan olarak alt ajanlar kendi alt ajanlarını başlatamaz (`maxSpawnDepth: 1`). `maxSpawnDepth: 2` ayarlayarak bir düzey iç içe yerleşmeyi etkinleştirebilirsiniz; bu da **orkestratör deseni**ne izin verir: ana → orkestratör alt ajan → çalışan alt-alt ajanlar.

### Nasıl etkinleştirilir

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // alt ajanların çocuk başlatmasına izin ver (varsayılan: 1)
        maxChildrenPerAgent: 5, // ajan oturumu başına en fazla etkin çocuk (varsayılan: 5)
        maxConcurrent: 8, // global eşzamanlılık hattı sınırı (varsayılan: 8)
        runTimeoutSeconds: 900, // atlandığında sessions_spawn için varsayılan zaman aşımı (0 = zaman aşımı yok)
      },
    },
  },
}
```

### Derinlik düzeyleri

| Derinlik | Oturum anahtarı şekli                       | Rol                                           | Başlatabilir mi?              |
| -------- | ------------------------------------------- | --------------------------------------------- | ----------------------------- |
| 0        | `agent:<id>:main`                           | Ana ajan                                      | Her zaman                     |
| 1        | `agent:<id>:subagent:<uuid>`                | Alt ajan (`maxSpawnDepth >= 2` ise orkestratör) | Yalnızca `maxSpawnDepth >= 2` ise |
| 2        | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Alt-alt ajan (yaprak çalışan)                | Asla                          |

### Duyuru zinciri

Sonuçlar zincir boyunca yukarı akar:

1. Derinlik-2 çalışan tamamlanır → üstüne (derinlik-1 orkestratör) duyurur
2. Derinlik-1 orkestratör duyuruyu alır, sonuçları sentezler, tamamlanır → ana ajana duyurur
3. Ana ajan duyuruyu alır ve kullanıcıya teslim eder

Her düzey yalnızca doğrudan çocuklarından gelen duyuruları görür.

İşletimsel rehberlik:

- Çocuk işi bir kez başlatın ve `sessions_list`, `sessions_history`, `/subagents list` veya
  `exec` sleep komutları etrafında sorgulama döngüleri kurmak yerine tamamlama olaylarını bekleyin.
- Son yanıtı zaten gönderdikten sonra bir çocuk tamamlama olayı gelirse,
  doğru takip adımı tam sessiz belirteç olan `NO_REPLY` / `no_reply` olur.

### Derinliğe göre araç ilkesi

- Rol ve denetim kapsamı başlatma anında oturum meta verilerine yazılır. Bu, düzleştirilmiş veya geri yüklenmiş oturum anahtarlarının yanlışlıkla yeniden orkestratör ayrıcalıkları kazanmasını önler.
- **Derinlik 1 (orkestratör, `maxSpawnDepth >= 2` olduğunda)**: Çocuklarını yönetebilmesi için `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` alır. Diğer oturum/sistem araçları yine reddedilir.
- **Derinlik 1 (yaprak, `maxSpawnDepth == 1` olduğunda)**: Oturum aracı yoktur (mevcut varsayılan davranış).
- **Derinlik 2 (yaprak çalışan)**: Oturum aracı yoktur — `sessions_spawn` derinlik 2'de her zaman reddedilir. Daha fazla çocuk başlatamaz.

### Ajan başına başlatma sınırı

Her ajan oturumu (herhangi bir derinlikte) aynı anda en fazla `maxChildrenPerAgent` (varsayılan: 5) etkin çocuğa sahip olabilir. Bu, tek bir orkestratörden kontrolden çıkan fan-out durumunu önler.

### Kademeli durdurma

Bir derinlik-1 orkestratörü durdurmak, tüm derinlik-2 çocuklarını otomatik olarak durdurur:

- Ana sohbette `/stop`, tüm derinlik-1 ajanlarını durdurur ve derinlik-2 çocuklarına da kademeli olarak uygular.
- `/subagents kill <id>`, belirli bir alt ajanı durdurur ve çocuklarına da kademeli olarak uygular.
- `/subagents kill all`, istek sahibi için tüm alt ajanları durdurur ve kademeli olarak uygular.

## Kimlik doğrulama

Alt ajan kimlik doğrulaması, oturum türüne göre değil **ajan kimliğine** göre çözülür:

- Alt ajan oturum anahtarı `agent:<agentId>:subagent:<uuid>` biçimindedir.
- Auth deposu o ajanın `agentDir` dizininden yüklenir.
- Ana ajanın auth profilleri **geri dönüş** olarak birleştirilir; çakışmalarda ajan profilleri ana profilleri geçersiz kılar.

Not: birleştirme eklemelidir, bu nedenle ana profiller geri dönüş olarak her zaman kullanılabilir. Ajan başına tamamen yalıtılmış auth henüz desteklenmiyor.

## Duyuru

Alt ajanlar, bir duyuru adımı üzerinden geri rapor verir:

- Duyuru adımı, alt ajan oturumu içinde çalışır (istek sahibi oturumunda değil).
- Alt ajan tam olarak `ANNOUNCE_SKIP` yanıtı verirse hiçbir şey gönderilmez.
- En son asistan metni tam sessiz belirteç `NO_REPLY` / `no_reply` ise,
  daha önce görünür ilerleme olmuş olsa bile duyuru çıktısı bastırılır.
- Aksi halde teslimat, istek sahibi derinliğine bağlıdır:
  - üst düzey istek sahibi oturumları, harici teslimatlı takip `agent` çağrısı kullanır (`deliver=true`)
  - iç içe istek sahibi alt ajan oturumları, orkestratörün oturum içinde çocuk sonuçlarını sentezleyebilmesi için dahili takip enjeksiyonu alır (`deliver=false`)
  - iç içe bir istek sahibi alt ajan oturumu artık yoksa, OpenClaw mümkün olduğunda o oturumun istek sahibine geri döner
- Üst düzey istek sahibi oturumlarında, tamamlama modundaki doğrudan teslimat önce herhangi bir bağlı konuşma/iş parçacığı rotasını ve hook geçersiz kılmasını çözer, sonra eksik kanal hedef alanlarını istek sahibi oturumunun saklanan rotasından doldurur. Bu, tamamlama kaynağı yalnızca kanalı tanımladığında bile tamamlamaların doğru sohbet/başlıkta kalmasını sağlar.
- İç içe tamamlama bulguları oluşturulurken çocuk tamamlama toplaması geçerli istek sahibi çalıştırması ile kapsamlanır; böylece eski önceki çalıştırma çocuk çıktılarının mevcut duyuruya sızması önlenir.
- Duyuru yanıtları, kanal bağdaştırıcılarında mevcut olduğunda iş parçacığı/başlık yönlendirmesini korur.
- Duyuru bağlamı kararlı bir dahili olay bloğuna normalize edilir:
  - kaynak (`subagent` veya `cron`)
  - çocuk oturum anahtarı/kimliği
  - duyuru türü + görev etiketi
  - çalışma zamanı sonucundan türetilmiş durum satırı (`success`, `error`, `timeout` veya `unknown`)
  - en son görünür asistan metninden seçilen sonuç içeriği, aksi halde temizlenmiş en son `tool`/`toolResult` metni; sonu başarısız olan çalıştırmalar yakalanmış yanıt metnini yeniden oynatmadan başarısızlık durumu bildirir
  - ne zaman yanıt verilip ne zaman sessiz kalınacağını açıklayan takip yönergesi
- `Status`, model çıktısından çıkarılmaz; çalışma zamanı sonuç sinyallerinden gelir.
- Zaman aşımında, çocuk yalnızca araç çağrıları düzeyine kadar ilerlediyse, duyuru ham araç çıktısını yeniden oynatmak yerine bu geçmişi kısa bir kısmi ilerleme özetine daraltabilir.

Duyuru yükleri sonda bir istatistik satırı içerir (sarılmış olsa bile):

- Çalışma zamanı (ör. `runtime 5m12s`)
- Token kullanımı (girdi/çıktı/toplam)
- Model fiyatlandırması yapılandırılmışsa tahmini maliyet (`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId` ve transcript yolu (böylece ana ajan geçmişi `sessions_history` ile alabilir veya dosyayı disk üzerinde inceleyebilir)
- Dahili meta veriler yalnızca orkestrasyon içindir; kullanıcıya dönük yanıtlar normal asistan sesiyle yeniden yazılmalıdır.

`sessions_history`, daha güvenli orkestrasyon yoludur:

- asistan geri çağırması önce normalize edilir:
  - thinking etiketleri çıkarılır
  - `<relevant-memories>` / `<relevant_memories>` iskelet blokları çıkarılır
  - `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` ve
    `<function_calls>...</function_calls>` gibi düz metin araç çağrısı XML yük blokları çıkarılır; buna
    temiz şekilde hiç kapanmayan kırpılmış yükler de dahildir
  - düşürülmüş araç çağrısı/sonuç iskeleti ve tarihsel bağlam işaretleyicileri çıkarılır
  - `<|assistant|>`, diğer ASCII
    `<|...|>` belirteçleri ve tam genişlikli `<｜...｜>` varyantları gibi sızmış model denetim belirteçleri çıkarılır
  - bozuk MiniMax araç çağrısı XML'i çıkarılır
- kimlik bilgisi/token benzeri metinler redakte edilir
- uzun bloklar kırpılabilir
- çok büyük geçmişlerde eski satırlar düşürülebilir veya aşırı büyük bir satır
  `[sessions_history omitted: message too large]`
  ile değiştirilebilir
- ham disk üstü transcript incelemesi, tam bayt bayt transcript gerektiğinde geri dönüş yoludur

## Araç İlkesi (alt ajan araçları)

Varsayılan olarak alt ajanlar, oturum araçları ve sistem araçları dışındaki **tüm araçları** alır:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

Burada da `sessions_history`, sınırlandırılmış ve temizlenmiş bir geri çağırma görünümüdür; ham transcript dökümü değildir.

`maxSpawnDepth >= 2` olduğunda, derinlik-1 orkestratör alt ajanlar çocuklarını yönetebilmek için ek olarak `sessions_spawn`, `subagents`, `sessions_list` ve `sessions_history` alır.

Yapılandırma ile geçersiz kılın:

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
        // reddet kazanır
        deny: ["gateway", "cron"],
        // allow ayarlanırsa yalnızca allow olur (deny yine kazanır)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Eşzamanlılık

Alt ajanlar, ayrılmış bir süreç içi kuyruk hattı kullanır:

- Hat adı: `subagent`
- Eşzamanlılık: `agents.defaults.subagents.maxConcurrent` (varsayılan `8`)

## Durdurma

- İstek sahibi sohbette `/stop` göndermek, istek sahibi oturumunu durdurur ve ondan başlatılan tüm etkin alt ajan çalıştırmalarını durdurarak iç içe çocuklara kademeli olarak uygular.
- `/subagents kill <id>`, belirli bir alt ajanı durdurur ve çocuklarına kademeli olarak uygular.

## Sınırlamalar

- Alt ajan duyurusu **en iyi çaba esaslıdır**. Gateway yeniden başlarsa, bekleyen "geri duyur" işi kaybolur.
- Alt ajanlar yine aynı Gateway süreç kaynaklarını paylaşır; `maxConcurrent` değerini bir güvenlik valfi olarak değerlendirin.
- `sessions_spawn` her zaman bloklamaz: hemen `{ status: "accepted", runId, childSessionKey }` döndürür.
- Alt ajan bağlamı yalnızca `AGENTS.md` + `TOOLS.md` enjekte eder (`SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` veya `BOOTSTRAP.md` yoktur).
- En yüksek iç içe derinliği 5'tir (`maxSpawnDepth` aralığı: 1–5). Çoğu kullanım senaryosu için derinlik 2 önerilir.
- `maxChildrenPerAgent`, oturum başına etkin çocukları sınırlar (varsayılan: 5, aralık: 1–20).

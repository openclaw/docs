---
read_when:
    - Kodlama harness'lerini ACP üzerinden çalıştırma
    - Mesajlaşma kanallarında konuşmaya bağlı ACP oturumlarını ayarlama
    - Bir mesajlaşma kanalı konuşmasını kalıcı bir ACP oturumuna bağlama
    - ACP backend ve plugin bağlamasında sorun giderme
    - ACP tamamlama tesliminde veya agent-to-agent döngülerinde hata ayıklama
    - Sohbetten /acp komutlarını kullanma
summary: Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP ve diğer harness agent'ları için ACP çalışma zamanı oturumlarını kullanın
title: ACP Agents
x-i18n:
    generated_at: "2026-04-22T04:28:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71ae74200cb7581a68c4593fd7e510378267daaf7acbcd7667cde56335ebadea
    source_path: tools/acp-agents.md
    workflow: 15
---

# ACP Agents

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) oturumları, OpenClaw'ın harici kodlama harness'lerini (örneğin Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI ve desteklenen diğer ACPX harness'leri) bir ACP backend plugin'i üzerinden çalıştırmasına izin verir.

OpenClaw'a doğal dilde "bunu Codex'te çalıştır" veya "bir ileti dizisinde Claude Code başlat" dediğinizde, OpenClaw bu isteği yerel sub-agent çalışma zamanına değil ACP çalışma zamanına yönlendirmelidir. Her ACP oturumu oluşturma işlemi bir [arka plan görevi](/tr/automation/tasks) olarak izlenir.

Codex veya Claude Code'un mevcut OpenClaw kanal konuşmalarına doğrudan harici bir MCP istemcisi olarak bağlanmasını istiyorsanız
ACP yerine [`openclaw mcp serve`](/cli/mcp) kullanın.

## Hangi sayfayı istiyorum?

Birbirine yakın ve karıştırılması kolay üç yüzey vardır:

| Şunu yapmak istiyorsunuz...                                                             | Bunu kullanın                         | Notlar                                                                                                         |
| ---------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Codex, Claude Code, Gemini CLI veya başka bir harici harness'i OpenClaw _üzerinden_ çalıştırmak | Bu sayfa: ACP Agents                  | Sohbete bağlı oturumlar, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, arka plan görevleri, çalışma zamanı denetimleri |
| Bir OpenClaw Gateway oturumunu bir düzenleyici veya istemci için ACP sunucusu _olarak_ açığa çıkarmak | [`openclaw acp`](/cli/acp)            | Köprü modu. IDE/istemci stdio/WebSocket üzerinden OpenClaw ile ACP konuşur                                    |
| Yerel bir AI CLI'yi yalnızca metin tabanlı geri dönüş modeli olarak yeniden kullanmak    | [CLI Backends](/tr/gateway/cli-backends) | ACP değildir. OpenClaw araçları, ACP denetimleri veya harness çalışma zamanı yoktur                           |

## Bu kutudan çıktığı gibi çalışır mı?

Genellikle evet.

- Yeni kurulumlar artık paketlenmiş `acpx` çalışma zamanı plugin'i varsayılan olarak etkin gelecek şekilde gelir.
- Paketlenmiş `acpx` plugin'i, plugin'e özel sabitlenmiş `acpx` ikili dosyasını tercih eder.
- Başlangıçta OpenClaw bu ikili dosyayı yoklar ve gerekirse kendini onarır.
- Hızlı bir hazırlık denetimi istiyorsanız `/acp doctor` ile başlayın.

İlk kullanımda yine de şunlar olabilir:

- Hedef harness bağdaştırıcısı, o harness'i ilk kez kullandığınızda isteğe bağlı olarak `npx` ile getirilebilir.
- O harness için satıcı kimlik doğrulamasının ana makinede mevcut olması gerekir.
- Ana makinenin npm/ağ erişimi yoksa ilk çalıştırma bağdaştırıcı indirmeleri, önbellekler önceden ısıtılana veya bağdaştırıcı başka bir yolla kurulana kadar başarısız olabilir.

Örnekler:

- `/acp spawn codex`: OpenClaw, `acpx` önyüklemesi için hazır olmalıdır, ancak Codex ACP bağdaştırıcısı yine de ilk çalıştırma getirmesine ihtiyaç duyabilir.
- `/acp spawn claude`: Claude ACP bağdaştırıcısı için de aynı durum geçerlidir; ayrıca o ana makinede Claude tarafı kimlik doğrulaması da gerekir.

## Hızlı operatör akışı

Pratik bir `/acp` çalışma kılavuzu istediğinizde bunu kullanın:

1. Bir oturum başlatın:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Bağlı konuşmada veya ileti dizisinde çalışın (veya o oturum anahtarını açıkça hedefleyin).
3. Çalışma zamanı durumunu kontrol edin:
   - `/acp status`
4. Gerektiğinde çalışma zamanı seçeneklerini ayarlayın:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Bağlamı değiştirmeden etkin bir oturumu yönlendirin:
   - `/acp steer loglamayı sıkılaştır ve devam et`
6. Çalışmayı durdurun:
   - `/acp cancel` (geçerli turu durdur), veya
   - `/acp close` (oturumu kapat + bağları kaldır)

## İnsanlar için hızlı başlangıç

Doğal istek örnekleri:

- "Bu Discord kanalını Codex'e bağla."
- "Burada bir ileti dizisinde kalıcı bir Codex oturumu başlat ve odaklı tut."
- "Bunu tek seferlik bir Claude Code ACP oturumu olarak çalıştır ve sonucu özetle."
- "Bu iMessage sohbetini Codex'e bağla ve takipleri aynı çalışma alanında tut."
- "Bu görev için bir ileti dizisinde Gemini CLI kullan, sonra takipleri aynı ileti dizisinde tut."

OpenClaw'ın yapması gerekenler:

1. `runtime: "acp"` seçin.
2. İstenen harness hedefini çözümleyin (`agentId`, örneğin `codex`).
3. Geçerli konuşmayı bağlama isteniyorsa ve etkin kanal bunu destekliyorsa ACP oturumunu o konuşmaya bağlayın.
4. Aksi hâlde, ileti dizisi bağlama isteniyorsa ve geçerli kanal bunu destekliyorsa ACP oturumunu ileti dizisine bağlayın.
5. Sonraki bağlı mesajları odak kaldırılana/kapatılana/süresi dolana kadar aynı ACP oturumuna yönlendirin.

## ACP ve sub-agent'lar

Harici bir harness çalışma zamanı istediğinizde ACP kullanın. OpenClaw yerel devredilmiş çalıştırmalar istediğinizde sub-agent kullanın.

| Alan          | ACP oturumu                           | Sub-agent çalıştırması              |
| ------------- | ------------------------------------- | ----------------------------------- |
| Çalışma zamanı | ACP backend plugin'i (örneğin acpx)   | OpenClaw yerel sub-agent çalışma zamanı |
| Oturum anahtarı | `agent:<agentId>:acp:<uuid>`        | `agent:<agentId>:subagent:<uuid>`   |
| Ana komutlar  | `/acp ...`                            | `/subagents ...`                    |
| Başlatma aracı | `sessions_spawn` ile `runtime:"acp"` | `sessions_spawn` (varsayılan çalışma zamanı) |

Ayrıca bkz. [Sub-agents](/tr/tools/subagents).

## ACP, Claude Code'u nasıl çalıştırır

ACP üzerinden Claude Code için yığın şudur:

1. OpenClaw ACP oturum kontrol düzlemi
2. paketlenmiş `acpx` çalışma zamanı plugin'i
3. Claude ACP bağdaştırıcısı
4. Claude tarafı çalışma zamanı/oturum mekanizması

Önemli ayrım:

- ACP Claude; ACP denetimleri, oturum sürdürme, arka plan görevi takibi ve isteğe bağlı konuşma/ileti dizisi bağlama ile bir harness oturumudur.
- CLI backend'leri ayrı, yalnızca metin tabanlı yerel geri dönüş çalışma zamanlarıdır. Bkz. [CLI Backends](/tr/gateway/cli-backends).

Operatörler için pratik kural şudur:

- `/acp spawn`, bağlanabilir oturumlar, çalışma zamanı denetimleri veya kalıcı harness çalışması istiyorsanız: ACP kullanın
- ham CLI üzerinden basit yerel metin geri dönüşü istiyorsanız: CLI backends kullanın

## Bağlı oturumlar

### Geçerli konuşma bağları

Geçerli konuşmanın alt ileti dizisi oluşturmadan kalıcı bir ACP çalışma alanı olmasını istediğinizde `/acp spawn <harness> --bind here` kullanın.

Davranış:

- OpenClaw kanal taşımasını, kimlik doğrulamasını, güvenliği ve teslimi yönetmeye devam eder.
- Geçerli konuşma, başlatılan ACP oturum anahtarına sabitlenir.
- Bu konuşmadaki takip mesajları aynı ACP oturumuna yönlendirilir.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, oturumu kapatır ve geçerli konuşma bağını kaldırır.

Bunun pratikte anlamı:

- `--bind here`, aynı sohbet yüzeyini korur. Discord'da geçerli kanal aynı kanal olarak kalır.
- `--bind here`, yeni iş başlatıyorsanız yine de yeni bir ACP oturumu oluşturabilir. Bağ, bu oturumu geçerli konuşmaya iliştirir.
- `--bind here`, tek başına bir alt Discord ileti dizisi veya Telegram konusu oluşturmaz.
- ACP çalışma zamanı yine de kendi çalışma dizinine (`cwd`) veya backend tarafından yönetilen disk çalışma alanına sahip olabilir. Bu çalışma zamanı çalışma alanı sohbet yüzeyinden ayrıdır ve yeni bir mesajlaşma ileti dizisi anlamına gelmez.
- Farklı bir ACP agent'ına başlatıyor ve `--cwd` geçmiyorsanız OpenClaw varsayılan olarak isteği yapanın değil **hedef agent'ın** çalışma alanını devralır.
- Devralınan çalışma alanı yolu eksikse (`ENOENT`/`ENOTDIR`), OpenClaw yanlış ağacı sessizce yeniden kullanmak yerine backend varsayılan cwd değerine geri döner.
- Devralınan çalışma alanı mevcut ancak erişilemiyorsa (örneğin `EACCES`), başlatma `cwd` değerini düşürmek yerine gerçek erişim hatasını döndürür.

Zihinsel model:

- sohbet yüzeyi: insanların konuşmaya devam ettiği yer (`Discord channel`, `Telegram topic`, `iMessage chat`)
- ACP oturumu: OpenClaw'ın yönlendirdiği kalıcı Codex/Claude/Gemini çalışma zamanı durumu
- alt ileti dizisi/konu: yalnızca `--thread ...` ile oluşturulan isteğe bağlı ek mesajlaşma yüzeyi
- çalışma zamanı çalışma alanı: harness'in çalıştığı dosya sistemi konumu (`cwd`, depo checkout'u, backend çalışma alanı)

Örnekler:

- `/acp spawn codex --bind here`: bu sohbeti koru, bir Codex ACP oturumu başlat veya iliştir ve gelecekteki mesajları burada ona yönlendir
- `/acp spawn codex --thread auto`: OpenClaw bir alt ileti dizisi/konu oluşturabilir ve ACP oturumunu oraya bağlayabilir
- `/acp spawn codex --bind here --cwd /workspace/repo`: yukarıdakiyle aynı sohbet bağı, ancak Codex `/workspace/repo` içinde çalışır

Geçerli konuşma bağlama desteği:

- Geçerli konuşma bağlama desteği bildiren sohbet/mesajlaşma kanalları, paylaşılan konuşma bağlama yolu üzerinden `--bind here` kullanabilir.
- Özel ileti dizisi/konu anlambilimi olan kanallar, yine aynı paylaşılan arayüz arkasında kanala özgü kanonikleştirme sunabilir.
- `--bind here` her zaman "geçerli konuşmayı yerinde bağla" anlamına gelir.
- Genel geçerli konuşma bağları, paylaşılan OpenClaw bağ deposunu kullanır ve normal Gateway yeniden başlatmalarında korunur.

Notlar:

- `/acp spawn` üzerinde `--bind here` ve `--thread ...` birbirini dışlar.
- Discord'da `--bind here`, geçerli kanalı veya ileti dizisini yerinde bağlar. `spawnAcpSessions` yalnızca OpenClaw'ın `--thread auto|here` için alt ileti dizisi oluşturması gerektiğinde gerekir.
- Etkin kanal geçerli konuşma ACP bağlarını açığa çıkarmıyorsa OpenClaw açık bir desteklenmiyor mesajı döndürür.
- `resume` ve "yeni oturum" soruları kanal değil ACP oturumu sorularıdır. Geçerli sohbet yüzeyini değiştirmeden çalışma zamanı durumunu yeniden kullanabilir veya değiştirebilirsiniz.

### İleti dizisine bağlı oturumlar

Bir kanal bağdaştırıcısında ileti dizisi bağları etkinleştirildiğinde ACP oturumları ileti dizilerine bağlanabilir:

- OpenClaw bir ileti dizisini hedef ACP oturumuna bağlar.
- O ileti dizisindeki takip mesajları bağlı ACP oturumuna yönlendirilir.
- ACP çıktısı aynı ileti dizisine geri teslim edilir.
- Odak kaldırma/kapatma/arşivleme/boşta kalma zaman aşımı veya maksimum yaş sona ermesi bağı kaldırır.

İleti dizisi bağlama desteği bağdaştırıcıya özgüdür. Etkin kanal bağdaştırıcısı ileti dizisi bağlarını desteklemiyorsa OpenClaw açık bir desteklenmiyor/kullanılamıyor mesajı döndürür.

İleti dizisine bağlı ACP için gerekli özellik bayrakları:

- `acp.enabled=true`
- `acp.dispatch.enabled` varsayılan olarak açıktır (`false` ayarı ACP dispatch'i duraklatır)
- Kanal bağdaştırıcısına özgü ACP ileti dizisi başlatma bayrağı etkin
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### İleti dizisini destekleyen kanallar

- Oturum/ileti dizisi bağlama yeteneğini açığa çıkaran herhangi bir kanal bağdaştırıcısı.
- Mevcut yerleşik destek:
  - Discord ileti dizileri/kanalları
  - Telegram konuları (grup/süpergruplardaki forum konuları ve DM konuları)
- Plugin kanalları aynı bağlama arayüzü üzerinden destek ekleyebilir.

## Kanala özgü ayarlar

Geçici olmayan iş akışları için üst düzey `bindings[]` girdilerinde kalıcı ACP bağları yapılandırın.

### Bağlama modeli

- `bindings[].type="acp"`, kalıcı bir ACP konuşma bağını işaretler.
- `bindings[].match`, hedef konuşmayı tanımlar:
  - Discord kanalı veya ileti dizisi: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram forum konusu: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles DM/grup sohbeti: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Kararlı grup bağları için `chat_id:*` veya `chat_identifier:*` tercih edin.
  - iMessage DM/grup sohbeti: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Kararlı grup bağları için `chat_id:*` tercih edin.
- `bindings[].agentId`, sahip olan OpenClaw agent kimliğidir.
- İsteğe bağlı ACP geçersiz kılmaları `bindings[].acp` altında yaşar:
  - `mode` (`persistent` veya `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Agent başına çalışma zamanı varsayılanları

Agent başına ACP varsayılanlarını bir kez tanımlamak için `agents.list[].runtime` kullanın:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (harness kimliği, örneğin `codex` veya `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

ACP'ye bağlı oturumlar için geçersiz kılma önceliği:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. genel ACP varsayılanları (örneğin `acp.backend`)

Örnek:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

Davranış:

- OpenClaw, yapılandırılmış ACP oturumunun kullanılmadan önce var olduğundan emin olur.
- O kanal veya konudaki mesajlar yapılandırılmış ACP oturumuna yönlendirilir.
- Bağlı konuşmalarda `/new` ve `/reset`, aynı ACP oturum anahtarını yerinde sıfırlar.
- Geçici çalışma zamanı bağları (örneğin ileti dizisi odak akışları tarafından oluşturulanlar) mevcut oldukları yerde yine uygulanır.
- Açık bir `cwd` olmadan çapraz agent ACP başlatmalarında OpenClaw, hedef agent çalışma alanını agent yapılandırmasından devralır.
- Eksik devralınmış çalışma alanı yolları backend varsayılan cwd değerine geri döner; eksik olmayan erişim hataları ise başlatma hataları olarak görünür.

## ACP oturumlarını başlatma (arayüzler)

### `sessions_spawn` üzerinden

Bir agent turundan veya araç çağrısından ACP oturumu başlatmak için `runtime: "acp"` kullanın.

```json
{
  "task": "Depoyu aç ve başarısız testleri özetle",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Notlar:

- `runtime` varsayılan olarak `subagent` değerini alır; bu yüzden ACP oturumları için açıkça `runtime: "acp"` ayarlayın.
- `agentId` atlanırsa OpenClaw yapılandırılmışsa `acp.defaultAgent` kullanır.
- `mode: "session"`, kalıcı bağlı bir konuşma korumak için `thread: true` gerektirir.

Arayüz ayrıntıları:

- `task` (zorunlu): ACP oturumuna gönderilen ilk prompt.
- `runtime` (ACP için zorunlu): `"acp"` olmalıdır.
- `agentId` (isteğe bağlı): ACP hedef harness kimliği. Ayarlıysa `acp.defaultAgent` değerine geri döner.
- `thread` (isteğe bağlı, varsayılan `false`): desteklenen yerlerde ileti dizisi bağlama akışını ister.
- `mode` (isteğe bağlı): `run` (tek seferlik) veya `session` (kalıcı).
  - varsayılan `run`'dır
  - `thread: true` ve mode atlanırsa OpenClaw çalışma zamanı yoluna göre kalıcı davranışı varsayabilir
  - `mode: "session"` için `thread: true` gerekir
- `cwd` (isteğe bağlı): istenen çalışma zamanı çalışma dizini (backend/çalışma zamanı ilkesi tarafından doğrulanır). Atlanırsa ACP başlatma, yapılandırılmışsa hedef agent çalışma alanını devralır; eksik devralınmış yollar backend varsayılanlarına geri dönerken, gerçek erişim hataları geri döndürülür.
- `label` (isteğe bağlı): oturum/banner metninde kullanılan operatör odaklı etiket.
- `resumeSessionId` (isteğe bağlı): yeni bir tane oluşturmak yerine mevcut ACP oturumunu sürdürür. Agent konuşma geçmişini `session/load` aracılığıyla yeniden oynatır. `runtime: "acp"` gerektirir.
- `streamTo` (isteğe bağlı): `"parent"`, ilk ACP çalıştırma ilerleme özetlerini istek yapan oturuma sistem olayları olarak geri akıtır.
  - Kullanılabildiğinde kabul edilen yanıtlar, tam aktarma geçmişi için takip edebileceğiniz oturum kapsamlı bir JSONL günlüğüne (`<sessionId>.acp-stream.jsonl`) işaret eden `streamLogPath` içerir.

## Teslim modeli

ACP oturumları ya etkileşimli çalışma alanları ya da parent sahipli arka plan işleri olabilir. Teslim yolu bu biçime bağlıdır.

### Etkileşimli ACP oturumları

Etkileşimli oturumlar, görünür bir sohbet yüzeyinde konuşmayı sürdürmek içindir:

- `/acp spawn ... --bind here`, geçerli konuşmayı ACP oturumuna bağlar.
- `/acp spawn ... --thread ...`, bir kanal ileti dizisini/konusunu ACP oturumuna bağlar.
- Kalıcı yapılandırılmış `bindings[].type="acp"`, eşleşen konuşmaları aynı ACP oturumuna yönlendirir.

Bağlı konuşmadaki takip mesajları doğrudan ACP oturumuna yönlendirilir ve ACP çıktısı aynı kanal/ileti dizisi/konuya geri teslim edilir.

### Parent sahipli tek seferlik ACP oturumları

Başka bir agent çalıştırması tarafından başlatılan tek seferlik ACP oturumları, sub-agent'lara benzer arka plan alt öğeleridir:

- Parent, `sessions_spawn({ runtime: "acp", mode: "run" })` ile iş ister.
- Alt öğe kendi ACP harness oturumunda çalışır.
- Tamamlama, iç görev-tamamlama duyuru yolu üzerinden geri raporlanır.
- Kullanıcıya dönük bir yanıt faydalı olduğunda parent, alt öğe sonucunu normal assistant sesiyle yeniden yazar.

Bu yolu parent ile alt öğe arasında eşler arası sohbet olarak değerlendirmeyin. Alt öğenin zaten parent'a geri dönen bir tamamlama kanalı vardır.

### `sessions_send` ve A2A teslimi

`sessions_send`, başlatmadan sonra başka bir oturumu hedefleyebilir. Normal eş oturumlar için OpenClaw, mesajı enjekte ettikten sonra bir agent-to-agent (A2A) takip yolu kullanır:

- hedef oturumun yanıtını bekler
- isteğe bağlı olarak istek yapan ve hedefin sınırlı sayıda takip turu değiş tokuş etmesine izin verir
- hedeften bir duyuru mesajı üretmesini ister
- bu duyuruyu görünür kanala veya ileti dizisine teslim eder

Bu A2A yolu, gönderenin görünür bir takip ihtiyacı olduğu eşler arası gönderimler için bir geri dönüştür. İlgisiz bir oturumun bir ACP hedefini görebildiği ve ona mesaj gönderebildiği durumlarda, örneğin geniş `tools.sessions.visibility` ayarları altında etkin kalır.

OpenClaw, yalnızca istek yapan kendi parent sahipli tek seferlik ACP alt öğesinin parent'ı olduğunda A2A takibini atlar. Bu durumda görev tamamlamanın üstüne A2A çalıştırmak parent'ı alt öğenin sonucuyla uyandırabilir, parent'ın yanıtını tekrar alt öğeye iletebilir ve bir parent/alt öğe yankı döngüsü oluşturabilir. `sessions_send` sonucu, sonuçtan zaten tamamlama yolunun sorumlu olduğu bu sahip olunan alt öğe durumu için `delivery.status="skipped"` bildirir.

### Mevcut bir oturumu sürdürme

Sıfırdan başlatmak yerine önceki bir ACP oturumunu sürdürmek için `resumeSessionId` kullanın. Agent konuşma geçmişini `session/load` aracılığıyla yeniden oynatır, böylece önce olanların tam bağlamıyla kaldığı yerden devam eder.

```json
{
  "task": "Kaldığımız yerden devam et — kalan test hatalarını düzelt",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Yaygın kullanım durumları:

- Bir Codex oturumunu dizüstü bilgisayarınızdan telefonunuza devredin — agent'ınıza kaldığınız yerden devam etmesini söyleyin
- CLI içinde etkileşimli olarak başlattığınız bir kodlama oturumunu şimdi agent'ınız üzerinden başsız şekilde sürdürün
- Gateway yeniden başlatması veya boşta kalma zaman aşımı nedeniyle kesintiye uğrayan işi devam ettirin

Notlar:

- `resumeSessionId`, `runtime: "acp"` gerektirir — sub-agent çalışma zamanı ile kullanılırsa hata döndürür.
- `resumeSessionId`, üst akış ACP konuşma geçmişini geri yükler; `thread` ve `mode` ise oluşturduğunuz yeni OpenClaw oturumuna normal şekilde uygulanmaya devam eder, bu yüzden `mode: "session"` için yine `thread: true` gerekir.
- Hedef agent, `session/load` desteği sunmalıdır (Codex ve Claude Code sunar).
- Oturum kimliği bulunamazsa başlatma açık bir hatayla başarısız olur — yeni oturuma sessiz geri dönüş yoktur.

### Operatör smoke testi

Bir Gateway dağıtımından sonra ACP başlatmanın
yalnızca birim testlerini geçmediğini, gerçekten uçtan uca çalıştığını hızlıca canlı doğrulamak istediğinizde bunu kullanın.

Önerilen geçit:

1. Hedef ana makinedeki dağıtılmış Gateway sürümünü/commit'ini doğrulayın.
2. Dağıtılmış kaynağın
   `src/gateway/sessions-patch.ts` içindeki ACP soy kabulünü içerdiğini doğrulayın (`subagent:* or acp:* sessions`).
3. Canlı bir agent'a geçici bir ACPX köprü oturumu açın (örneğin
   `jpclawhq` üzerindeki `razor(main)`).
4. O agent'tan şu değerlerle `sessions_spawn` çağırmasını isteyin:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - görev: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Agent'ın şunları bildirdiğini doğrulayın:
   - `accepted=yes`
   - gerçek bir `childSessionKey`
   - doğrulayıcı hatası yok
6. Geçici ACPX köprü oturumunu temizleyin.

Canlı agent'a örnek prompt:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Notlar:

- Bilerek ileti dizisine bağlı kalıcı ACP oturumlarını test etmiyorsanız
  bu smoke testini `mode: "run"` üzerinde tutun.
- Temel geçit için `streamTo: "parent"` zorunlu kılmayın. Bu yol
  istek yapan/oturum yeteneklerine bağlıdır ve ayrı bir entegrasyon denetimidir.
- İleti dizisine bağlı `mode: "session"` testini, gerçek bir Discord ileti dizisi veya Telegram konusu üzerinden ikinci, daha zengin bir entegrasyon
  geçişi olarak ele alın.

## Sandbox uyumluluğu

ACP oturumları şu anda OpenClaw sandbox içinde değil, ana makine çalışma zamanında çalışır.

Geçerli sınırlamalar:

- İsteği yapan oturum sandbox içindeyse ACP başlatmaları hem `sessions_spawn({ runtime: "acp" })` hem de `/acp spawn` için engellenir.
  - Hata: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `runtime: "acp"` ile `sessions_spawn`, `sandbox: "require"` desteği sunmaz.
  - Hata: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Sandbox zorlamalı yürütme gerektiğinde `runtime: "subagent"` kullanın.

### `/acp` komutundan

Gerektiğinde sohbetten açık operatör denetimi için `/acp spawn` kullanın.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

Temel bayraklar:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

Bkz. [Slash Commands](/tr/tools/slash-commands).

## Oturum hedefi çözümlemesi

Çoğu `/acp` eylemi isteğe bağlı bir oturum hedefi kabul eder (`session-key`, `session-id` veya `session-label`).

Çözümleme sırası:

1. Açık hedef argümanı (veya `/acp steer` için `--session`)
   - önce anahtarı dener
   - sonra UUID biçimli oturum kimliğini
   - sonra etiketi
2. Geçerli ileti dizisi bağı (bu konuşma/ileti dizisi bir ACP oturumuna bağlıysa)
3. Geçerli istek yapan oturum geri dönüşü

Geçerli konuşma bağları ve ileti dizisi bağları, ikisi de 2. adıma katılır.

Hiçbir hedef çözümlemezse OpenClaw açık bir hata döndürür (`Unable to resolve session target: ...`).

## Başlatma bağlama kipleri

`/acp spawn`, `--bind here|off` destekler.

| Kip    | Davranış                                                           |
| ------ | ------------------------------------------------------------------ |
| `here` | Geçerli etkin konuşmayı yerinde bağla; etkin konuşma yoksa başarısız ol. |
| `off`  | Geçerli konuşma bağı oluşturma.                                    |

Notlar:

- `--bind here`, "bu kanalı veya sohbeti Codex destekli yap" için en basit operatör yoludur.
- `--bind here`, alt ileti dizisi oluşturmaz.
- `--bind here` yalnızca geçerli konuşma bağlama desteği açığa çıkaran kanallarda kullanılabilir.
- `--bind` ve `--thread`, aynı `/acp spawn` çağrısında birleştirilemez.

## Başlatma ileti dizisi kipleri

`/acp spawn`, `--thread auto|here|off` destekler.

| Kip    | Davranış                                                                                             |
| ------ | ---------------------------------------------------------------------------------------------------- |
| `auto` | Etkin bir ileti dizisindeyseniz: o ileti dizisini bağlar. Bir ileti dizisinin dışındaysanız: destekleniyorsa alt ileti dizisi oluşturur/bağlar. |
| `here` | Geçerli etkin ileti dizisini zorunlu kılar; içinde değilseniz başarısız olur.                       |
| `off`  | Bağlama yok. Oturum bağsız başlar.                                                                   |

Notlar:

- İleti dizisi bağlama yüzeyi olmayan yerlerde varsayılan davranış fiilen `off` olur.
- İleti dizisine bağlı başlatma, kanal ilkesi desteği gerektirir:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Alt ileti dizisi oluşturmadan geçerli konuşmayı sabitlemek istediğinizde `--bind here` kullanın.

## ACP denetimleri

Kullanılabilir komut ailesi:

- `/acp spawn`
- `/acp cancel`
- `/acp steer`
- `/acp close`
- `/acp status`
- `/acp set-mode`
- `/acp set`
- `/acp cwd`
- `/acp permissions`
- `/acp timeout`
- `/acp model`
- `/acp reset-options`
- `/acp sessions`
- `/acp doctor`
- `/acp install`

`/acp status`, etkin çalışma zamanı seçeneklerini ve kullanılabildiğinde hem çalışma zamanı düzeyindeki hem de backend düzeyindeki oturum tanımlayıcılarını gösterir.

Bazı denetimler backend yeteneklerine bağlıdır. Bir backend bir denetimi desteklemiyorsa OpenClaw açık bir desteklenmeyen-denetim hatası döndürür.

## ACP komut tarif kitabı

| Komut               | Yaptığı şey                                               | Örnek                                                        |
| ------------------- | --------------------------------------------------------- | ------------------------------------------------------------ |
| `/acp spawn`        | ACP oturumu oluşturur; isteğe bağlı geçerli bağ veya ileti dizisi bağı. | `/acp spawn codex --bind here --cwd /repo`                   |
| `/acp cancel`       | Hedef oturum için uçuş hâlindeki turu iptal eder.         | `/acp cancel agent:codex:acp:<uuid>`                         |
| `/acp steer`        | Çalışan oturuma yönlendirme talimatı gönderir.            | `/acp steer --session support inbox başarısız testlere öncelik ver` |
| `/acp close`        | Oturumu kapatır ve ileti dizisi hedeflerinin bağını kaldırır. | `/acp close`                                              |
| `/acp status`       | Backend, kip, durum, çalışma zamanı seçenekleri, yetenekler gösterir. | `/acp status`                                            |
| `/acp set-mode`     | Hedef oturum için çalışma zamanı kipini ayarlar.          | `/acp set-mode plan`                                         |
| `/acp set`          | Genel çalışma zamanı yapılandırma seçeneği yazımı.        | `/acp set model openai/gpt-5.4`                              |
| `/acp cwd`          | Çalışma zamanı çalışma dizini geçersiz kılmasını ayarlar. | `/acp cwd /Users/user/Projects/repo`                         |
| `/acp permissions`  | Onay ilkesi profilini ayarlar.                            | `/acp permissions strict`                                    |
| `/acp timeout`      | Çalışma zamanı zaman aşımını ayarlar (saniye).            | `/acp timeout 120`                                           |
| `/acp model`        | Çalışma zamanı model geçersiz kılmasını ayarlar.          | `/acp model anthropic/claude-opus-4-6`                       |
| `/acp reset-options` | Oturum çalışma zamanı seçenek geçersiz kılmalarını kaldırır. | `/acp reset-options`                                     |
| `/acp sessions`     | Depodan son ACP oturumlarını listeler.                    | `/acp sessions`                                              |
| `/acp doctor`       | Backend sağlığı, yetenekler, uygulanabilir düzeltmeler.   | `/acp doctor`                                                |
| `/acp install`      | Deterministik kurulum ve etkinleştirme adımlarını yazdırır. | `/acp install`                                            |

`/acp sessions`, geçerli bağlı veya isteği yapan oturum için depoyu okur. `session-key`, `session-id` veya `session-label` belirteçleri kabul eden komutlar, özel agent başına `session.store` kökleri dâhil Gateway oturum keşfi üzerinden hedefleri çözümler.

## Çalışma zamanı seçenek eşlemesi

`/acp`, kolaylık komutlarına ve genel bir ayarlayıcıya sahiptir.

Eşdeğer işlemler:

- `/acp model <id>`, çalışma zamanı yapılandırma anahtarı `model` değerine eşlenir.
- `/acp permissions <profile>`, çalışma zamanı yapılandırma anahtarı `approval_policy` değerine eşlenir.
- `/acp timeout <seconds>`, çalışma zamanı yapılandırma anahtarı `timeout` değerine eşlenir.
- `/acp cwd <path>`, çalışma zamanı cwd geçersiz kılmasını doğrudan günceller.
- `/acp set <key> <value>`, genel yoldur.
  - Özel durum: `key=cwd`, cwd geçersiz kılma yolunu kullanır.
- `/acp reset-options`, hedef oturum için tüm çalışma zamanı geçersiz kılmalarını temizler.

## acpx harness desteği (güncel)

Geçerli acpx yerleşik harness takma adları:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

OpenClaw acpx backend'ini kullandığında, acpx yapılandırmanız özel agent takma adları tanımlamıyorsa `agentId` için bu değerleri tercih edin.
Yerel Cursor kurulumunuz hâlâ ACP'yi `agent acp` olarak açığa çıkarıyorsa yerleşik varsayılanı değiştirmek yerine acpx yapılandırmanızda `cursor` agent komutunu geçersiz kılın.

Doğrudan acpx CLI kullanımı ayrıca `--agent <command>` ile rastgele bağdaştırıcıları hedefleyebilir, ancak bu ham kaçış kapağı normal OpenClaw `agentId` yolu değil, bir acpx CLI özelliğidir.

## Gerekli yapılandırma

Core ACP temel çizgisi:

```json5
{
  acp: {
    enabled: true,
    // İsteğe bağlı. Varsayılan true'dur; /acp denetimlerini korurken ACP dispatch'i duraklatmak için false ayarlayın.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

İleti dizisi bağlama yapılandırması kanal bağdaştırıcısına özgüdür. Discord için örnek:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

İleti dizisine bağlı ACP başlatma çalışmıyorsa önce bağdaştırıcı özellik bayrağını doğrulayın:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Geçerli konuşma bağları, alt ileti dizisi oluşturma gerektirmez. Etkin konuşma bağlamı ve ACP konuşma bağlarını açığa çıkaran bir kanal bağdaştırıcısı gerektirir.

Bkz. [Configuration Reference](/tr/gateway/configuration-reference).

## acpx backend'i için plugin kurulumu

Yeni kurulumlar, paketlenmiş `acpx` çalışma zamanı plugin'i varsayılan olarak etkin gelecek şekilde gönderilir; bu nedenle ACP
genellikle elle plugin kurulum adımı olmadan çalışır.

Şununla başlayın:

```text
/acp doctor
```

`acpx` devre dışı bıraktıysanız, onu `plugins.allow` / `plugins.deny` ile reddettiyseniz veya
yerel bir geliştirme checkout'una geçmek istiyorsanız açık plugin yolunu kullanın:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Geliştirme sırasında yerel çalışma alanı kurulumu:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Ardından backend sağlığını doğrulayın:

```text
/acp doctor
```

### acpx komutu ve sürüm yapılandırması

Varsayılan olarak paketlenmiş acpx backend plugin'i (`acpx`), plugin'e özel sabitlenmiş ikili dosyayı kullanır:

1. Komut varsayılan olarak ACPX plugin paketi içindeki plugin'e özel `node_modules/.bin/acpx` değeridir.
2. Beklenen sürüm varsayılan olarak extension sabitlemesine eşittir.
3. Başlangıç, ACP backend'ini hemen hazır değil olarak kaydeder.
4. Bir arka plan ensure işi `acpx --version` komutunu doğrular.
5. Plugin'e özel ikili dosya eksikse veya eşleşmiyorsa şu komutu çalıştırır:
   `npm install --omit=dev --no-save acpx@<pinned>` ve yeniden doğrular.

Plugin yapılandırmasında komutu/sürümü geçersiz kılabilirsiniz:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

Notlar:

- `command`, mutlak yol, göreli yol veya komut adı (`acpx`) kabul eder.
- Göreli yollar OpenClaw çalışma alanı dizininden çözülür.
- `expectedVersion: "any"`, strict sürüm eşleştirmesini devre dışı bırakır.
- `command`, özel bir ikili dosyaya/yola işaret ettiğinde plugin'e özel otomatik kurulum devre dışı kalır.
- Backend sağlık denetimi çalışırken OpenClaw başlangıcı engellemesiz kalır.

Bkz. [Plugins](/tr/tools/plugin).

### Otomatik bağımlılık kurulumu

OpenClaw'ı `npm install -g openclaw` ile genel olarak kurduğunuzda acpx
çalışma zamanı bağımlılıkları (platforma özgü ikili dosyalar)
bir postinstall kancasıyla otomatik kurulur. Otomatik kurulum başarısız olursa Gateway yine de
normal şekilde başlar ve eksik bağımlılığı `openclaw acp doctor` üzerinden bildirir.

### Plugin araçları MCP köprüsü

Varsayılan olarak ACPX oturumları, ACP harness'ine OpenClaw plugin tarafından kaydedilmiş araçları **açığa çıkarmaz**.

Codex veya Claude Code gibi ACP agent'larının, bellek geri çağırma/depolama gibi yüklü
OpenClaw plugin araçlarını çağırmasını istiyorsanız özel köprüyü etkinleştirin:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Bunun yaptığı şey:

- ACPX oturum
  önyüklemesine `openclaw-plugin-tools` adlı yerleşik bir MCP sunucusu enjekte eder.
- Yüklü ve etkin OpenClaw
  plugin'leri tarafından zaten kaydedilmiş plugin araçlarını açığa çıkarır.
- Özelliği açık ve varsayılan olarak kapalı tutar.

Güvenlik ve güven notları:

- Bu, ACP harness araç yüzeyini genişletir.
- ACP agent'ları yalnızca Gateway'de zaten etkin olan plugin araçlarına erişir.
- Bunu, o plugin'lerin
  OpenClaw içinde çalıştırılmasına izin vermekle aynı güven sınırı olarak değerlendirin.
- Etkinleştirmeden önce yüklü plugin'leri gözden geçirin.

Özel `mcpServers` eskisi gibi çalışmaya devam eder. Yerleşik plugin-tools köprüsü,
genel MCP sunucu yapılandırmasının yerine geçen değil, ek bir isteğe bağlı kolaylıktır.

### Çalışma zamanı zaman aşımı yapılandırması

Paketlenmiş `acpx` plugin'i, gömülü çalışma zamanı turlarını varsayılan olarak 120 saniyelik
zaman aşımıyla çalıştırır. Bu, Gemini CLI gibi daha yavaş harness'lere
ACP başlatma ve ilklendirmeyi tamamlama için yeterli zaman verir. Ana makinenizin
farklı bir çalışma zamanı sınırına ihtiyacı varsa bunu geçersiz kılın:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Bu değeri değiştirdikten sonra Gateway'yi yeniden başlatın.

### Sağlık yoklaması agent yapılandırması

Paketlenmiş `acpx` plugin'i, gömülü çalışma zamanı backend'inin hazır olup olmadığına karar verirken
bir harness agent'ını yoklar. Varsayılanı `codex`'tir. Dağıtımınız
farklı bir varsayılan ACP agent'ı kullanıyorsa probe agent'ını aynı kimliğe ayarlayın:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Bu değeri değiştirdikten sonra Gateway'yi yeniden başlatın.

## İzin yapılandırması

ACP oturumları etkileşimsiz çalışır — dosya yazma ve shell-exec izin istemlerini onaylamak veya reddetmek için TTY yoktur. acpx plugin'i, izinlerin nasıl ele alınacağını denetleyen iki yapılandırma anahtarı sunar:

Bu ACPX harness izinleri, OpenClaw exec onaylarından ayrıdır ve Claude CLI `--permission-mode bypassPermissions` gibi CLI-backend satıcı baypas bayraklarından da ayrıdır. ACPX `approve-all`, ACP oturumları için harness düzeyindeki cam kırma anahtarıdır.

### `permissionMode`

Harness agent'ının istem olmadan hangi işlemleri gerçekleştirebileceğini denetler.

| Değer            | Davranış                                                  |
| ---------------- | --------------------------------------------------------- |
| `approve-all`    | Tüm dosya yazmalarını ve shell komutlarını otomatik onaylar. |
| `approve-reads`  | Yalnızca okumaları otomatik onaylar; yazma ve exec istem gerektirir. |
| `deny-all`       | Tüm izin istemlerini reddeder.                              |

### `nonInteractivePermissions`

İzin istemi gösterilmesi gerekirdi ancak etkileşimli TTY mevcut olmadığında ne olacağını denetler (ACP oturumları için durum her zaman böyledir).

| Değer  | Davranış                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | Oturumu `AcpRuntimeError` ile durdurur. **(varsayılan)**          |
| `deny` | İzni sessizce reddeder ve devam eder (zarif uygun düzeye indirme). |

### Yapılandırma

Plugin yapılandırması üzerinden ayarlayın:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Bu değerleri değiştirdikten sonra Gateway'yi yeniden başlatın.

> **Önemli:** OpenClaw şu anda varsayılan olarak `permissionMode=approve-reads` ve `nonInteractivePermissions=fail` kullanır. Etkileşimsiz ACP oturumlarında, izin istemini tetikleyen herhangi bir yazma veya exec işlemi `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` hatasıyla başarısız olabilir.
>
> İzinleri kısıtlamanız gerekiyorsa, oturumlar çökme yerine zarif şekilde uygun düzeye indirgensin diye `nonInteractivePermissions` değerini `deny` olarak ayarlayın.

## Sorun giderme

| Belirti                                                                    | Olası neden                                                                     | Düzeltme                                                                                                                                                            |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                    | Backend plugin'i eksik veya devre dışı.                                         | Backend plugin'ini kurup etkinleştirin, ardından `/acp doctor` çalıştırın.                                                                                         |
| `ACP is disabled by policy (acp.enabled=false)`                            | ACP genel olarak devre dışı.                                                    | `acp.enabled=true` ayarlayın.                                                                                                                                       |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`          | Normal ileti dizisi mesajlarından dispatch devre dışı.                          | `acp.dispatch.enabled=true` ayarlayın.                                                                                                                              |
| `ACP agent "<id>" is not allowed by policy`                                | Agent izin listesinde değil.                                                    | İzin verilen `agentId` kullanın veya `acp.allowedAgents` değerini güncelleyin.                                                                                     |
| `Unable to resolve session target: ...`                                    | Hatalı anahtar/kimlik/etiket belirteci.                                         | `/acp sessions` çalıştırın, tam anahtarı/etiketi kopyalayın, yeniden deneyin.                                                                                      |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here`, etkin ve bağlanabilir bir konuşma olmadan kullanıldı.            | Hedef sohbet/kanala gidip yeniden deneyin veya bağsız başlatma kullanın.                                                                                            |
| `Conversation bindings are unavailable for <channel>.`                     | Bağdaştırıcıda geçerli konuşma ACP bağlama yeteneği yok.                        | Desteklenen yerlerde `/acp spawn ... --thread ...` kullanın, üst düzey `bindings[]` yapılandırın veya desteklenen bir kanala geçin.                               |
| `--thread here requires running /acp spawn inside an active ... thread`    | `--thread here`, ileti dizisi bağlamı dışında kullanıldı.                       | Hedef ileti dizisine gidin veya `--thread auto`/`off` kullanın.                                                                                                     |
| `Only <user-id> can rebind this channel/conversation/thread.`              | Başka bir kullanıcı etkin bağlama hedefinin sahibi.                             | Sahibi olarak yeniden bağlayın veya farklı bir konuşma ya da ileti dizisi kullanın.                                                                                 |
| `Thread bindings are unavailable for <channel>.`                           | Bağdaştırıcıda ileti dizisi bağlama yeteneği yok.                               | `--thread off` kullanın veya desteklenen bağdaştırıcı/kanala geçin.                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                         | ACP çalışma zamanı ana makine tarafındadır; isteği yapan oturum sandbox içindedir. | Sandbox içindeki oturumlardan `runtime="subagent"` kullanın veya ACP başlatmayı sandbox dışı bir oturumdan yapın.                                               |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`    | ACP çalışma zamanı için `sandbox="require"` istendi.                             | Zorunlu sandbox için `runtime="subagent"` kullanın veya ACP'yi sandbox dışı bir oturumdan `sandbox="inherit"` ile kullanın.                                       |
| Bağlı oturum için ACP meta verisi eksik                                    | Eski/silinmiş ACP oturum meta verisi.                                           | `/acp spawn` ile yeniden oluşturun, ardından yeniden bağlayın/ileti dizisine odaklanın.                                                                            |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`   | `permissionMode`, etkileşimsiz ACP oturumunda yazma/exec işlemlerini engelliyor. | `plugins.entries.acpx.config.permissionMode` değerini `approve-all` olarak ayarlayın ve Gateway'yi yeniden başlatın. Bkz. [İzin yapılandırması](#permission-configuration). |
| ACP oturumu az çıktı vererek erkenden başarısız oluyor                     | İzin istemleri `permissionMode`/`nonInteractivePermissions` tarafından engelleniyor. | Gateway günlüklerinde `AcpRuntimeError` arayın. Tam izin için `permissionMode=approve-all`; zarif uygun düzeye indirme için `nonInteractivePermissions=deny` ayarlayın. |
| ACP oturumu işi tamamladıktan sonra süresiz takılıyor                      | Harness süreci bitti ancak ACP oturumu tamamlandığını bildirmedi.               | `ps aux \| grep acpx` ile izleyin; eski süreçleri elle sonlandırın.                                                                                                 |

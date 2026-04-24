---
read_when:
    - Kodlama harness'lerini ACP üzerinden çalıştırma
    - Mesajlaşma kanallarında konuşmaya bağlı ACP oturumları kurma
    - Bir mesajlaşma kanalı konuşmasını kalıcı bir ACP oturumuna bağlama
    - ACP backend ve Plugin bağlantısını hata ayıklama
    - ACP tamamlama teslimini veya aracılar arası döngüleri hata ayıklama
    - Sohbetten `/acp` komutlarını işletme
summary: Claude Code, Cursor, Gemini CLI, açık Codex ACP fallback, OpenClaw ACP ve diğer harness aracılar için ACP çalışma zamanı oturumlarını kullanın
title: ACP aracılar
x-i18n:
    generated_at: "2026-04-24T09:33:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6d59c5aa858e7888c9188ec9fc7dd5bcb9c8a5458f40d6458a5157ebc16332c2
    source_path: tools/acp-agents.md
    workflow: 15
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) oturumları, OpenClaw'ın harici kodlama harness'lerini (örneğin Pi, Claude Code, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI ve desteklenen diğer ACPX harness'leri) bir ACP backend Plugin'i üzerinden çalıştırmasına olanak tanır.

OpenClaw'dan doğal dille geçerli konuşmada Codex'i bağlamasını veya denetlemesini isterseniz, OpenClaw yerel Codex app-server Plugin yolunu kullanmalıdır (`/codex bind`, `/codex threads`, `/codex resume`). `/acp`, ACP, acpx veya bir Codex arka plan alt oturumu isterseniz, OpenClaw Codex'i yine de ACP üzerinden yönlendirebilir. Her ACP oturum spawn'ı bir [background task](/tr/automation/tasks) olarak izlenir.

OpenClaw'dan doğal dille "bir thread içinde Claude Code başlatmasını" veya başka bir harici harness kullanmasını isterseniz, OpenClaw bu isteği yerel alt aracı çalışma zamanına değil ACP çalışma zamanına yönlendirmelidir.

Codex veya Claude Code'un mevcut OpenClaw kanal konuşmalarına doğrudan harici MCP istemcisi olarak bağlanmasını istiyorsanız,
ACP yerine [`openclaw mcp serve`](/tr/cli/mcp) kullanın.

## Hangi sayfayı istiyorum?

Kolayca karıştırılan üç yakın yüzey vardır:

| Şunu yapmak istiyorsunuz...                                                                    | Bunu kullanın                         | Notlar                                                                                                                                                           |
| ---------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Geçerli konuşmada Codex'i bağlamak veya denetlemek                                             | `/codex bind`, `/codex threads`       | Yerel Codex app-server yolu; bağlı sohbet yanıtları, görsel iletimi, model/hızlı/izinler, durdurma ve steer denetimlerini içerir. ACP açık fallback'tir |
| Claude Code, Gemini CLI, açık Codex ACP veya başka bir harici harness'i OpenClaw _üzerinden_ çalıştırmak | Bu sayfa: ACP aracılar           | Sohbete bağlı oturumlar, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, arka plan görevleri, çalışma zamanı denetimleri                                   |
| Bir OpenClaw Gateway oturumunu editör veya istemci için ACP sunucusu _olarak_ açmak           | [`openclaw acp`](/tr/cli/acp)            | Köprü modu. IDE/istemci OpenClaw ile stdio/WebSocket üzerinden ACP konuşur                                                                                       |
| Yerel bir AI CLI'ı yalnızca metin fallback modeli olarak yeniden kullanmak                     | [CLI Backends](/tr/gateway/cli-backends) | ACP değildir. OpenClaw araçları yok, ACP denetimleri yok, harness çalışma zamanı yok                                                                             |

## Bu kutudan çıktığı gibi çalışır mı?

Genellikle evet. Taze kurulumlar, varsayılan olarak etkin gelen paketlenmiş `acpx` çalışma zamanı Plugin'iyle gelir; bu, OpenClaw'ın başlangıçta probe edip kendi kendine onardığı Plugin'e özel sabitlenmiş bir `acpx` ikili dosyasıyla birlikte gelir. Hazırlık denetimi için `/acp doctor` çalıştırın.

İlk çalıştırma tuzakları:

- Hedef harness adaptörleri (Codex, Claude vb.), ilk kullanımda isteğe bağlı olarak `npx` ile getirilebilir.
- O harness için üretici auth'unun yine de sunucuda mevcut olması gerekir.
- Sunucuda npm veya ağ erişimi yoksa, önbellekler önceden ısıtılana veya adaptör başka yolla kurulana kadar ilk çalıştırma adaptör getirmeleri başarısız olur.

## Operatör runbook'u

Sohbetten hızlı `/acp` akışı:

1. **Spawn** — `/acp spawn claude --bind here`, `/acp spawn gemini --mode persistent --thread auto` veya açık `/acp spawn codex --bind here`
2. Bağlı konuşmada veya thread içinde **çalışın** (veya oturum anahtarını açıkça hedefleyin).
3. **Durumu kontrol edin** — `/acp status`
4. **İnce ayar yapın** — `/acp model <provider/model>`, `/acp permissions <profile>`, `/acp timeout <seconds>`
5. Bağlamı değiştirmeden **steer** edin — `/acp steer tighten logging and continue`
6. **Durdurun** — `/acp cancel` (geçerli tur) veya `/acp close` (oturum + binding'ler)

Yerel Codex Plugin'ine yönlenmesi gereken doğal dil tetikleyicileri:

- "Bu Discord kanalını Codex'e bağla."
- "Bu sohbeti Codex thread `<id>` öğesine ekle."
- "Codex thread'lerini göster, sonra bunu bağla."

Yerel Codex konuşma binding'i varsayılan sohbet-denetim yoludur, ancak etkileşimli Codex onay/araç akışları için bilerek tutucudur: OpenClaw dinamik araçları ve onay istemleri bu bağlı-sohbet yolu üzerinden henüz sunulmaz, bu nedenle bu istekler açık bir açıklamayla reddedilir. İş akışı OpenClaw dinamik araçlarına veya uzun süren etkileşimli onaylara bağlıysa Codex harness yolunu veya açık ACP fallback'ini kullanın.

ACP çalışma zamanına yönlenmesi gereken doğal dil tetikleyicileri:

- "Bunu tek seferlik Claude Code ACP oturumu olarak çalıştır ve sonucu özetle."
- "Bu görev için Gemini CLI'ı bir thread içinde kullan, sonra takipleri aynı thread içinde tut."
- "Codex'i ACP üzerinden arka plan thread'inde çalıştır."

OpenClaw, `runtime: "acp"` seçer, harness `agentId`'yi çözümler, destekleniyorsa geçerli konuşmaya veya thread'e bağlar ve kapatma/süre dolana kadar takipleri o oturuma yönlendirir. Codex bu yolu yalnızca ACP açıkça istendiğinde veya istenen arka plan çalışma zamanı hâlâ ACP gerektirdiğinde izler.

## ACP ve alt aracılar

Harici bir harness çalışma zamanı istediğinizde ACP kullanın. Codex konuşma binding/denetimi için yerel Codex app-server kullanın. OpenClaw-yerel devredilmiş çalıştırmalar istediğinizde alt aracıları kullanın.

| Alan          | ACP oturumu                           | Alt aracı çalıştırması              |
| ------------- | ------------------------------------- | ----------------------------------- |
| Çalışma zamanı | ACP backend Plugin'i (ör. acpx)      | OpenClaw yerel alt aracı çalışma zamanı |
| Oturum anahtarı | `agent:<agentId>:acp:<uuid>`        | `agent:<agentId>:subagent:<uuid>`   |
| Ana komutlar  | `/acp ...`                            | `/subagents ...`                    |
| Spawn aracı   | `runtime:"acp"` ile `sessions_spawn` | `sessions_spawn` (varsayılan çalışma zamanı) |

Ayrıca bkz. [Sub-agents](/tr/tools/subagents).

## ACP Claude Code'u nasıl çalıştırır

Claude Code için ACP yığını şöyledir:

1. OpenClaw ACP oturum denetim düzlemi
2. paketlenmiş `acpx` çalışma zamanı Plugin'i
3. Claude ACP adaptörü
4. Claude tarafı çalışma zamanı/oturum mekanizması

Önemli ayrım:

- ACP Claude, ACP denetimleri, oturum devam ettirme, arka plan görev izlemesi ve isteğe bağlı konuşma/thread binding'i olan bir harness oturumudur.
- CLI backend'leri ayrı, yalnızca metin kullanan yerel fallback çalışma zamanlarıdır. Bkz. [CLI Backends](/tr/gateway/cli-backends).

Operatörler için pratik kural şudur:

- `/acp spawn`, bağlanabilir oturumlar, çalışma zamanı denetimleri veya kalıcı harness çalışması istiyorsanız: ACP kullanın
- Ham CLI üzerinden basit yerel metin fallback'i istiyorsanız: CLI backend'lerini kullanın

## Bağlı oturumlar

### Geçerli konuşma binding'leri

`/acp spawn <harness> --bind here`, geçerli konuşmayı oluşturulan ACP oturumuna sabitler — alt thread yok, aynı sohbet yüzeyi. OpenClaw taşıma, auth, güvenlik ve teslimin sahibi olmaya devam eder; o konuşmadaki takip mesajları aynı oturuma yönlendirilir; `/new` ve `/reset` oturumu yerinde sıfırlar; `/acp close` binding'i kaldırır.

Zihinsel model:

- **sohbet yüzeyi** — insanların konuşmaya devam ettiği yer (Discord kanalı, Telegram konusu, iMessage sohbeti).
- **ACP oturumu** — OpenClaw'ın yönlendirdiği kalıcı Codex/Claude/Gemini çalışma zamanı durumu.
- **alt thread/topic** — yalnızca `--thread ...` ile oluşturulan isteğe bağlı ek mesajlaşma yüzeyi.
- **çalışma zamanı workspace'i** — harness'in çalıştığı dosya sistemi konumu (`cwd`, repo checkout, backend çalışma alanı). Sohbet yüzeyinden bağımsızdır.

Örnekler:

- `/codex bind` — bu sohbeti koru, yerel Codex app-server oluştur veya ekle, gelecekteki mesajları buraya yönlendir.
- `/codex model gpt-5.4`, `/codex fast on`, `/codex permissions yolo` — bağlı yerel Codex thread'ini sohbetten ince ayarla.
- `/codex stop` veya `/codex steer focus on the failing tests first` — etkin yerel Codex turunu denetle.
- `/acp spawn codex --bind here` — Codex için açık ACP fallback'i.
- `/acp spawn codex --thread auto` — OpenClaw bir alt thread/topic oluşturabilir ve oraya bağlayabilir.
- `/acp spawn codex --bind here --cwd /workspace/repo` — aynı sohbet binding'i, Codex `/workspace/repo` içinde çalışır.

Notlar:

- `--bind here` ile `--thread ...` birbirini dışlar.
- `--bind here` yalnızca geçerli konuşma binding'i bildiren kanallarda çalışır; aksi halde OpenClaw açık bir desteklenmiyor mesajı döndürür. Binding'ler gateway yeniden başlatmaları arasında kalıcıdır.
- Discord'da `spawnAcpSessions`, yalnızca OpenClaw'ın `--thread auto|here` için bir alt thread oluşturması gerektiğinde gerekir — `--bind here` için değil.
- Farklı bir ACP aracısına `--cwd` olmadan spawn ederseniz, OpenClaw varsayılan olarak **hedef aracının** çalışma alanını devralır. Eksik devralınan yollar (`ENOENT`/`ENOTDIR`) backend varsayılanına fallback yapar; diğer erişim hataları (ör. `EACCES`) spawn hataları olarak yüzeye çıkar.

### Thread'e bağlı oturumlar

Bir kanal adaptörü için thread binding'leri etkin olduğunda ACP oturumları thread'lere bağlanabilir:

- OpenClaw bir thread'i hedef ACP oturumuna bağlar.
- O thread içindeki takip mesajları bağlı ACP oturumuna yönlendirilir.
- ACP çıktısı aynı thread'e geri teslim edilir.
- Unfocus/close/archive/idle-timeout veya max-age süresi dolması binding'i kaldırır.

Thread binding desteği adaptöre özeldir. Etkin kanal adaptörü thread binding'lerini desteklemiyorsa OpenClaw açık bir desteklenmiyor/kullanılamıyor mesajı döndürür.

Thread'e bağlı ACP için gereken özellik bayrakları:

- `acp.enabled=true`
- `acp.dispatch.enabled` varsayılan olarak açıktır (ACP gönderimini duraklatmak için `false` ayarlayın)
- Kanal adaptörü ACP thread-spawn bayrağı etkin (adaptöre özgü)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Thread destekleyen kanallar

- Oturum/thread binding yeteneği sunan herhangi bir kanal adaptörü.
- Mevcut yerleşik destek:
  - Discord thread'leri/kanalları
  - Telegram konuları (gruplar/süpergruplardaki forum konuları ve DM konuları)
- Plugin kanalları aynı binding arayüzü üzerinden destek ekleyebilir.

## Kanala özgü ayarlar

Geçici olmayan iş akışları için kalıcı ACP binding'lerini üst düzey `bindings[]` girdilerinde yapılandırın.

### Binding modeli

- `bindings[].type="acp"`, kalıcı ACP konuşma binding'ini işaretler.
- `bindings[].match`, hedef konuşmayı tanımlar:
  - Discord kanal veya thread: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram forum konusu: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles DM/grup sohbeti: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Kararlı grup binding'leri için `chat_id:*` veya `chat_identifier:*` tercih edin.
  - iMessage DM/grup sohbeti: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Kararlı grup binding'leri için `chat_id:*` tercih edin.
- `bindings[].agentId`, sahip olan OpenClaw aracı kimliğidir.
- İsteğe bağlı ACP geçersiz kılmaları `bindings[].acp` altında bulunur:
  - `mode` (`persistent` veya `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Aracı başına çalışma zamanı varsayılanları

ACP varsayılanlarını aracı başına bir kez tanımlamak için `agents.list[].runtime` kullanın:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (harness kimliği, örneğin `codex` veya `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

ACP bağlı oturumları için geçersiz kılma önceliği:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. global ACP varsayılanları (örneğin `acp.backend`)

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

- OpenClaw, yapılandırılmış ACP oturumunun kullanımdan önce var olduğundan emin olur.
- O kanaldaki veya konudaki mesajlar, yapılandırılmış ACP oturumuna yönlendirilir.
- Bağlı konuşmalarda `/new` ve `/reset`, aynı ACP oturum anahtarını yerinde sıfırlar.
- Geçici çalışma zamanı binding'leri (örneğin thread-focus akışları tarafından oluşturulanlar), mevcut olduklarında yine uygulanır.
- Açık bir `cwd` olmadan çapraz aracı ACP spawn'larında, OpenClaw hedef aracı çalışma alanını aracı config'inden devralır.
- Eksik devralınan çalışma alanı yolları backend varsayılan `cwd` değerine fallback yapar; eksik olmayan erişim başarısızlıkları spawn hataları olarak yüzeye çıkar.

## ACP oturumlarını başlatma (arayüzler)

### `sessions_spawn` içinden

Bir aracı turundan veya araç çağrısından ACP oturumu başlatmak için `runtime: "acp"` kullanın.

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Notlar:

- `runtime` varsayılan olarak `subagent` olur, bu yüzden ACP oturumları için `runtime: "acp"` değerini açıkça ayarlayın.
- `agentId` atlanırsa, yapılandırılmış olduğunda OpenClaw `acp.defaultAgent` kullanır.
- `mode: "session"`, kalıcı bağlı konuşmayı korumak için `thread: true` gerektirir.

Arayüz ayrıntıları:

- `task` (zorunlu): ACP oturumuna gönderilen ilk prompt.
- `runtime` (ACP için zorunlu): `"acp"` olmalıdır.
- `agentId` (isteğe bağlı): ACP hedef harness kimliği. Ayarlıysa `acp.defaultAgent` değerine fallback yapar.
- `thread` (isteğe bağlı, varsayılan `false`): Desteklenen yerlerde thread binding akışını ister.
- `mode` (isteğe bağlı): `run` (tek seferlik) veya `session` (kalıcı).
  - varsayılan `run` olur
  - `thread: true` ise ve mode atlanmışsa, OpenClaw çalışma zamanı yoluna göre varsayılan olarak kalıcı davranış seçebilir
  - `mode: "session"`, `thread: true` gerektirir
- `cwd` (isteğe bağlı): İstenen çalışma zamanı çalışma dizini (backend/çalışma zamanı politikası tarafından doğrulanır). Atlanırsa ACP spawn, yapılandırılmış olduğunda hedef aracı çalışma alanını devralır; eksik devralınan yollar backend varsayılanlarına fallback yaparken gerçek erişim hataları döndürülür.
- `label` (isteğe bağlı): Oturum/banner metninde kullanılan operatör odaklı etiket.
- `resumeSessionId` (isteğe bağlı): Yeni bir oturum oluşturmak yerine mevcut bir ACP oturumunu sürdürür. Aracı, konuşma geçmişini `session/load` üzerinden yeniden oynatır. `runtime: "acp"` gerektirir.
- `streamTo` (isteğe bağlı): `"parent"`, ilk ACP çalıştırma ilerleme özetlerini sistem olayları olarak istekte bulunan oturuma geri akıtır.
  - Mevcut olduğunda kabul edilen yanıtlarda, tam aktarma geçmişi için takip edebileceğiniz oturum kapsamlı bir JSONL günlüğüne (`<sessionId>.acp-stream.jsonl`) işaret eden `streamLogPath` bulunur.
- `model` (isteğe bağlı): ACP alt oturumu için açık model geçersiz kılması. `runtime: "acp"` için dikkate alınır; böylece alt oturum sessizce hedef aracı varsayılanına fallback yapmak yerine istenen modeli kullanır.

## Teslim modeli

ACP oturumları etkileşimli çalışma alanları veya ebeveyne ait arka plan işleri olabilir. Teslim yolu bu şekle bağlıdır.

### Etkileşimli ACP oturumları

Etkileşimli oturumlar görünür bir sohbet yüzeyinde konuşmayı sürdürmek içindir:

- `/acp spawn ... --bind here`, geçerli konuşmayı ACP oturumuna bağlar.
- `/acp spawn ... --thread ...`, bir kanal thread/topic'ini ACP oturumuna bağlar.
- Kalıcı yapılandırılmış `bindings[].type="acp"`, eşleşen konuşmaları aynı ACP oturumuna yönlendirir.

Bağlı konuşmadaki takip mesajları doğrudan ACP oturumuna yönlendirilir ve ACP çıktısı aynı kanal/thread/topic'e geri teslim edilir.

### Ebeveyne ait tek seferlik ACP oturumları

Başka bir aracı çalıştırması tarafından oluşturulan tek seferlik ACP oturumları, alt aracılara benzer arka plan çocuklarıdır:

- Ebeveyn `sessions_spawn({ runtime: "acp", mode: "run" })` ile iş ister.
- Çocuk kendi ACP harness oturumunda çalışır.
- Tamamlama, iç görev-tamamlama duyuru yolu üzerinden geri raporlanır.
- Kullanıcıya dönük bir yanıt faydalı olduğunda ebeveyn, çocuk sonucunu normal asistan sesiyle yeniden yazar.

Bu yolu ebeveyn ve çocuk arasında eşler arası sohbet olarak görmeyin. Çocuğun zaten ebeveyne geri giden bir tamamlama kanalı vardır.

### `sessions_send` ve A2A teslimi

`sessions_send`, spawn sonrasında başka bir oturumu hedefleyebilir. Normal eş oturumları için OpenClaw, mesajı enjekte ettikten sonra aracıdan aracıya (A2A) takip yolunu kullanır:

- hedef oturumun yanıtını bekler
- isteğe bağlı olarak istekte bulunan ile hedefin sınırlı sayıda takip turu alışverişi yapmasına izin verir
- hedeften bir duyuru mesajı üretmesini ister
- bu duyuruyu görünür kanal veya thread'e teslim eder

Bu A2A yolu, gönderenin görünür bir takip istediği eş gönderimleri için fallback'tir. İlgisiz bir oturum ACP hedefini görebildiğinde ve ona mesaj gönderebildiğinde, örneğin geniş `tools.sessions.visibility` ayarları altında, etkin kalır.

OpenClaw, yalnızca istekte bulunan kendi ebeveynine ait tek seferlik ACP çocuğunun ebeveyni olduğunda A2A takibini atlar. Bu durumda görev tamamlamasının üstünde A2A çalıştırmak, ebeveyni çocuğun sonucuyla uyandırabilir, ebeveynin yanıtını tekrar çocuğa iletebilir ve ebeveyn/çocuk yankı döngüsü oluşturabilir. `sessions_send` sonucu, sahip olunan çocuk durumunda `delivery.status="skipped"` bildirir çünkü sonuçtan zaten tamamlama yolu sorumludur.

### Mevcut bir oturumu sürdürme

Yeni başlatmak yerine önceki bir ACP oturumunu sürdürmek için `resumeSessionId` kullanın. Aracı, konuşma geçmişini `session/load` üzerinden yeniden oynatır; böylece önce ne olduysa onun tam bağlamıyla devam eder.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Yaygın kullanım durumları:

- Bir Codex oturumunu dizüstünüzden telefonunuza devredin — aracınıza kaldığınız yerden devam etmesini söyleyin
- CLI'da etkileşimli olarak başlattığınız bir kodlama oturumuna şimdi aracınız üzerinden headless olarak devam edin
- Gateway yeniden başlatması veya idle timeout nedeniyle kesilen işi devam ettirin

Notlar:

- `resumeSessionId`, `runtime: "acp"` gerektirir — alt aracı çalışma zamanıyla kullanılırsa hata döndürür.
- `resumeSessionId`, upstream ACP konuşma geçmişini geri yükler; `thread` ve `mode` yine yeni oluşturduğunuz OpenClaw oturumuna normal şekilde uygulanır, bu nedenle `mode: "session"` hâlâ `thread: true` gerektirir.
- Hedef aracı `session/load` desteklemelidir (Codex ve Claude Code destekler).
- Oturum kimliği bulunamazsa, spawn açık bir hatayla başarısız olur — yeni oturuma sessiz fallback yoktur.

<Accordion title="Dağıtım sonrası smoke test">

Bir gateway dağıtımından sonra birim testlerine güvenmek yerine canlı uçtan uca denetim çalıştırın:

1. Hedef sunucuda dağıtılan gateway sürümünü ve commit'ini doğrulayın.
2. Canlı bir aracıya geçici bir ACPX bridge oturumu açın.
3. O aracının `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` ve `Reply with exactly LIVE-ACP-SPAWN-OK` göreviyle `sessions_spawn` çağırmasını isteyin.
4. `accepted=yes`, gerçek bir `childSessionKey` ve validator hatası olmadığını doğrulayın.
5. Geçici bridge oturumunu temizleyin.

Kapıyı `mode: "run"` üzerinde tutun ve `streamTo: "parent"` öğesini atlayın — thread'e bağlı `mode: "session"` ve stream-relay yolları ayrı, daha zengin entegrasyon geçişleridir.

</Accordion>

## Sandbox uyumluluğu

ACP oturumları şu anda OpenClaw sandbox'ı içinde değil, sunucu çalışma zamanında çalışır.

Mevcut sınırlamalar:

- İstekte bulunan oturum sandbox içindeyse ACP spawn'ları hem `sessions_spawn({ runtime: "acp" })` hem de `/acp spawn` için engellenir.
  - Hata: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `runtime: "acp"` ile `sessions_spawn`, `sandbox: "require"` desteklemez.
  - Hata: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Sandbox zorlamalı yürütme gerektiğinde `runtime: "subagent"` kullanın.

### `/acp` komutundan

Sohbetten açık operatör denetimi gerektiğinde `/acp spawn` kullanın.

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

## Oturum hedef çözümleme

Çoğu `/acp` eylemi isteğe bağlı bir oturum hedefini kabul eder (`session-key`, `session-id` veya `session-label`).

Çözümleme sırası:

1. Açık hedef bağımsız değişkeni (veya `/acp steer` için `--session`)
   - önce key dener
   - sonra UUID biçimli session id
   - sonra label
2. Geçerli thread binding'i (bu konuşma/thread bir ACP oturumuna bağlıysa)
3. Geçerli istekte bulunan oturum fallback'i

Geçerli konuşma binding'leri ve thread binding'leri, 2. adıma birlikte katılır.

Hiçbir hedef çözümlenmezse OpenClaw açık bir hata döndürür (`Unable to resolve session target: ...`).

## Spawn bind modları

`/acp spawn`, `--bind here|off` destekler.

| Mod    | Davranış                                                            |
| ------ | ------------------------------------------------------------------- |
| `here` | Geçerli etkin konuşmayı yerinde bağlar; etkin değilse başarısız olur. |
| `off`  | Geçerli konuşma binding'i oluşturmaz.                               |

Notlar:

- `--bind here`, “bu kanalı veya sohbeti Codex destekli yap” için en basit operatör yoludur.
- `--bind here` bir alt thread oluşturmaz.
- `--bind here` yalnızca geçerli konuşma binding desteğini sunan kanallarda kullanılabilir.
- `--bind` ve `--thread`, aynı `/acp spawn` çağrısında birleştirilemez.

## Spawn thread modları

`/acp spawn`, `--thread auto|here|off` destekler.

| Mod    | Davranış                                                                                             |
| ------ | ---------------------------------------------------------------------------------------------------- |
| `auto` | Etkin bir thread içindeyse: o thread'i bağlar. Thread dışındaysa: destekleniyorsa bir alt thread oluşturur/bağlar. |
| `here` | Geçerli etkin thread'i zorunlu kılar; içinde değilse başarısız olur.                                  |
| `off`  | Binding yok. Oturum bağlı olmadan başlar.                                                            |

Notlar:

- Thread binding olmayan yüzeylerde varsayılan davranış fiilen `off` olur.
- Thread'e bağlı spawn, kanal politika desteği gerektirir:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Alt thread oluşturmadan geçerli konuşmayı sabitlemek istediğinizde `--bind here` kullanın.

## ACP denetimleri

| Komut                | Ne yapar                                                  | Örnek                                                        |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------ |
| `/acp spawn`         | ACP oturumu oluşturur; isteğe bağlı geçerli bind veya thread bind. | `/acp spawn codex --bind here --cwd /repo`                   |
| `/acp cancel`        | Hedef oturum için uçuş halindeki turu iptal eder.         | `/acp cancel agent:codex:acp:<uuid>`                         |
| `/acp steer`         | Çalışan oturuma steer yönergesi gönderir.                 | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Oturumu kapatır ve thread hedeflerinin binding'ini kaldırır. | `/acp close`                                               |
| `/acp status`        | Backend, mod, durum, çalışma zamanı seçenekleri, yetenekleri gösterir. | `/acp status`                                          |
| `/acp set-mode`      | Hedef oturum için çalışma zamanı modunu ayarlar.          | `/acp set-mode plan`                                         |
| `/acp set`           | Genel çalışma zamanı config seçeneği yazımı.              | `/acp set model openai/gpt-5.4`                              |
| `/acp cwd`           | Çalışma zamanı çalışma dizini geçersiz kılmasını ayarlar. | `/acp cwd /Users/user/Projects/repo`                         |
| `/acp permissions`   | Onay politikası profilini ayarlar.                        | `/acp permissions strict`                                    |
| `/acp timeout`       | Çalışma zamanı zaman aşımını ayarlar (saniye).            | `/acp timeout 120`                                           |
| `/acp model`         | Çalışma zamanı model geçersiz kılmasını ayarlar.          | `/acp model anthropic/claude-opus-4-6`                       |
| `/acp reset-options` | Oturum çalışma zamanı seçenek geçersiz kılmalarını kaldırır. | `/acp reset-options`                                      |
| `/acp sessions`      | Store'dan son ACP oturumlarını listeler.                  | `/acp sessions`                                              |
| `/acp doctor`        | Backend sağlığı, yetenekler, eyleme dönük düzeltmeler.    | `/acp doctor`                                                |
| `/acp install`       | Deterministik kurulum ve etkinleştirme adımlarını yazdırır. | `/acp install`                                             |

`/acp status`, etkili çalışma zamanı seçeneklerini ve çalışma zamanı düzeyi ile backend düzeyi oturum tanımlayıcılarını gösterir. Bir backend bir yetenekten yoksunsa, desteklenmeyen denetim hataları açıkça yüzeye çıkar. `/acp sessions`, geçerli bağlı veya istekte bulunan oturum için store'u okur; hedef token'lar (`session-key`, `session-id` veya `session-label`) gateway oturum keşfi üzerinden çözülür; buna aracı başına özel `session.store` kökleri de dahildir.

## Çalışma zamanı seçenek eşlemesi

`/acp`, kolaylık komutları ve genel bir ayarlayıcı içerir.

Eşdeğer işlemler:

- `/acp model <id>`, çalışma zamanı config anahtarı `model` ile eşleşir.
- `/acp permissions <profile>`, çalışma zamanı config anahtarı `approval_policy` ile eşleşir.
- `/acp timeout <seconds>`, çalışma zamanı config anahtarı `timeout` ile eşleşir.
- `/acp cwd <path>`, çalışma zamanı cwd geçersiz kılmasını doğrudan günceller.
- `/acp set <key> <value>`, genel yoldur.
  - Özel durum: `key=cwd`, cwd geçersiz kılma yolunu kullanır.
- `/acp reset-options`, hedef oturum için tüm çalışma zamanı geçersiz kılmalarını temizler.

## acpx harness, Plugin kurulumu ve izinler

acpx harness yapılandırması (Claude Code / Codex / Gemini CLI takma adları),
plugin-tools ve OpenClaw-tools MCP köprüleri ve ACP izin modları için bkz.
[ACP agents — setup](/tr/tools/acp-agents-setup).

## Sorun giderme

| Belirti                                                                     | Olası neden                                                                     | Düzeltme                                                                                                                                                                   |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Backend Plugin'i eksik veya devre dışı.                                          | Backend Plugin'ini kurup etkinleştirin, sonra `/acp doctor` çalıştırın.                                                                                                   |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP global olarak devre dışı.                                                    | `acp.enabled=true` ayarlayın.                                                                                                                                              |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Normal thread mesajlarından gönderim devre dışı.                                 | `acp.dispatch.enabled=true` ayarlayın.                                                                                                                                     |
| `ACP agent "<id>" is not allowed by policy`                                 | Aracı allowlist içinde değil.                                                    | İzin verilen `agentId` kullanın veya `acp.allowedAgents` güncelleyin.                                                                                                      |
| `Unable to resolve session target: ...`                                     | Geçersiz key/id/label token'ı.                                                   | `/acp sessions` çalıştırın, tam key/label'ı kopyalayıp yeniden deneyin.                                                                                                   |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here`, etkin bağlanabilir konuşma olmadan kullanıldı.                    | Hedef sohbete/kanala geçip yeniden deneyin veya bağlanmamış spawn kullanın.                                                                                                |
| `Conversation bindings are unavailable for <channel>.`                      | Adaptörde geçerli konuşma ACP binding yeteneği yok.                              | Desteklenen yerde `/acp spawn ... --thread ...` kullanın, üst düzey `bindings[]` yapılandırın veya desteklenen kanala geçin.                                              |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here`, thread bağlamı dışında kullanıldı.                              | Hedef thread'e geçin veya `--thread auto`/`off` kullanın.                                                                                                                  |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Etkin binding hedefinin sahibi başka kullanıcı.                                  | Sahibi olarak yeniden bağlayın veya farklı konuşma ya da thread kullanın.                                                                                                   |
| `Thread bindings are unavailable for <channel>.`                            | Adaptörde thread binding yeteneği yok.                                           | `--thread off` kullanın veya desteklenen adaptöre/kanala geçin.                                                                                                           |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP çalışma zamanı sunucu taraflıdır; istekte bulunan oturum sandbox içindedir.  | Sandbox içindeki oturumlardan `runtime="subagent"` kullanın veya ACP spawn'ı sandbox olmayan bir oturumdan çalıştırın.                                                    |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACP çalışma zamanı için `sandbox="require"` istendi.                              | Zorunlu sandbox için `runtime="subagent"` kullanın veya sandbox olmayan bir oturumdan ACP'yi `sandbox="inherit"` ile kullanın.                                            |
| Bağlı oturum için ACP meta verisi eksik                                     | Eski/silinmiş ACP oturum meta verisi.                                            | `/acp spawn` ile yeniden oluşturun, sonra thread'i yeniden bağlayın/odaklayın.                                                                                            |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode`, etkileşimsiz ACP oturumunda yazma/exec işlemlerini engelliyor. | `plugins.entries.acpx.config.permissionMode` değerini `approve-all` yapın ve gateway'i yeniden başlatın. Bkz. [Permission configuration](/tr/tools/acp-agents-setup#permission-configuration). |
| ACP oturumu az çıktıyla erken başarısız oluyor                              | İzin istemleri `permissionMode`/`nonInteractivePermissions` tarafından engelleniyor. | `AcpRuntimeError` için gateway günlüklerini kontrol edin. Tam izinler için `permissionMode=approve-all`; zarif düşüş için `nonInteractivePermissions=deny` ayarlayın. |
| ACP oturumu iş tamamlandıktan sonra süresiz takılı kalıyor                  | Harness süreci bitti ama ACP oturumu tamamlandığını bildirmedi.                  | `ps aux \| grep acpx` ile izleyin; eski süreçleri elle sonlandırın.                                                                                                        |

## İlgili

- [Sub-agents](/tr/tools/subagents)
- [Multi-agent sandbox tools](/tr/tools/multi-agent-sandbox-tools)
- [Agent send](/tr/tools/agent-send)

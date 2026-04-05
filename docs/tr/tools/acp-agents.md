---
read_when:
    - ACP üzerinden kodlama harness'lerini çalıştırıyorsunuz
    - Mesajlaşma kanallarında konuşmaya bağlı ACP oturumları kuruyorsunuz
    - Bir mesaj kanalı konuşmasını kalıcı bir ACP oturumuna bağlıyorsunuz
    - ACP arka ucu ve plugin bağlantılarını gideriyorsunuz
    - Sohbetten /acp komutlarını çalıştırıyorsunuz
summary: Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP ve diğer harness ajanları için ACP çalışma zamanı oturumlarını kullanın
title: ACP Ajanları
x-i18n:
    generated_at: "2026-04-05T14:11:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47063abc8170129cd22808d9a4b23160d0f340f6dc789907589d349f68c12e3e
    source_path: tools/acp-agents.md
    workflow: 15
---

# ACP ajanları

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) oturumları, OpenClaw'ın bir ACP arka uç plugin'i üzerinden harici kodlama harness'lerini (örneğin Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI ve desteklenen diğer ACPX harness'leri) çalıştırmasına olanak tanır.

OpenClaw'dan doğal dille "bunu Codex'te çalıştır" veya "bir başlıkta Claude Code başlat" diye isterseniz, OpenClaw bu isteği ACP çalışma zamanına yönlendirmelidir (yerel alt ajan çalışma zamanına değil). Her ACP oturumu başlatma işlemi bir [arka plan görevi](/tr/automation/tasks) olarak izlenir.

Codex veya Claude Code'un mevcut OpenClaw kanal konuşmalarına doğrudan harici MCP istemcisi olarak bağlanmasını istiyorsanız, ACP yerine [`openclaw mcp serve`](/cli/mcp) kullanın.

## Hangi sayfayı istiyorum?

Kolayca karıştırılabilen üç yakın yüzey vardır:

| İstediğiniz şey...                                                                     | Bunu kullanın                              | Notlar                                                                                                            |
| -------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Codex, Claude Code, Gemini CLI veya başka bir harici harness'i OpenClaw _üzerinden_ çalıştırmak | Bu sayfa: ACP ajanları                     | Sohbete bağlı oturumlar, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, arka plan görevleri, çalışma zamanı denetimleri |
| Bir OpenClaw Gateway oturumunu bir düzenleyici veya istemci için ACP sunucusu _olarak_ açığa çıkarmak | [`openclaw acp`](/cli/acp)                 | Köprü modu. IDE/istemci stdio/WebSocket üzerinden OpenClaw ile ACP konuşur                                        |
| Yerel bir AI CLI'yi yalnızca metin tabanlı yedek model olarak yeniden kullanmak        | [CLI Arka Uçları](/tr/gateway/cli-backends)   | ACP değildir. OpenClaw araçları yoktur, ACP denetimleri yoktur, harness çalışma zamanı yoktur                     |

## Bu kutudan çıktığı gibi çalışır mı?

Genellikle evet.

- Yeni kurulumlar artık paketlenmiş `acpx` çalışma zamanı plugin'i varsayılan olarak etkin şekilde gelir.
- Paketlenmiş `acpx` plugin'i kendi plugin yerel sabitlenmiş `acpx` ikili dosyasını tercih eder.
- Başlangıçta OpenClaw bu ikiliyi yoklar ve gerekirse kendi kendine onarır.
- Hızlı bir hazır olma denetimi istiyorsanız `/acp doctor` ile başlayın.

İlk kullanımda yine de olabilecekler:

- Hedef bir harness bağdaştırıcısı, o harness'i ilk kullandığınızda `npx` ile isteğe bağlı olarak getirilebilir.
- Bu harness için sağlayıcı kimlik doğrulamasının yine de ana makinede mevcut olması gerekir.
- Ana makinede npm/ağ erişimi yoksa, ilk çalıştırma bağdaştırıcı indirmeleri önbellekler ısıtılana veya bağdaştırıcı başka bir şekilde kurulana kadar başarısız olabilir.

Örnekler:

- `/acp spawn codex`: OpenClaw `acpx` önyüklemesine hazır olmalıdır, ancak Codex ACP bağdaştırıcısı yine de ilk çalıştırmada getirilmeyi gerektirebilir.
- `/acp spawn claude`: Claude ACP bağdaştırıcısı için de durum aynıdır; ayrıca o ana makinede Claude tarafı kimlik doğrulaması gerekir.

## Hızlı operatör akışı

Pratik bir `/acp` runbook istediğinizde bunu kullanın:

1. Bir oturum başlatın:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Bağlı konuşmada veya başlıkta çalışın (veya o oturum anahtarını açıkça hedefleyin).
3. Çalışma zamanı durumunu denetleyin:
   - `/acp status`
4. Gerektikçe çalışma zamanı seçeneklerini ayarlayın:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Bağlamı değiştirmeden etkin bir oturuma yön verin:
   - `/acp steer günlüğü sıkılaştır ve devam et`
6. Çalışmayı durdurun:
   - `/acp cancel` (mevcut turu durdurur), veya
   - `/acp close` (oturumu kapatır + bağları kaldırır)

## İnsanlar için hızlı başlangıç

Doğal istek örnekleri:

- "Bu Discord kanalını Codex'e bağla."
- "Burada bir başlıkta kalıcı bir Codex oturumu başlat ve odaklı tut."
- "Bunu tek seferlik bir Claude Code ACP oturumu olarak çalıştır ve sonucu özetle."
- "Bu iMessage sohbetini Codex'e bağla ve takipleri aynı çalışma alanında tut."
- "Bu görev için bir başlıkta Gemini CLI kullan, sonra takipleri aynı başlıkta tut."

OpenClaw'ın yapması gerekenler:

1. `runtime: "acp"` seçmek.
2. İstenen harness hedefini çözmek (`agentId`, örneğin `codex`).
3. Mevcut konuşma bağı isteniyorsa ve etkin kanal bunu destekliyorsa, ACP oturumunu o konuşmaya bağlamak.
4. Aksi halde başlık bağı isteniyorsa ve mevcut kanal bunu destekliyorsa, ACP oturumunu o başlığa bağlamak.
5. Takip eden bağlı mesajları odağı kaldırılana/kapatılana/süresi dolana kadar aynı ACP oturumuna yönlendirmek.

## ACP ve alt ajanlar karşılaştırması

Harici bir harness çalışma zamanı istediğinizde ACP kullanın. OpenClaw yerel delege çalıştırmalar istediğinizde alt ajanları kullanın.

| Alan         | ACP oturumu                           | Alt ajan çalıştırması               |
| ------------ | ------------------------------------- | ----------------------------------- |
| Çalışma zamanı | ACP arka uç plugin'i (örneğin acpx) | OpenClaw yerel alt ajan çalışma zamanı |
| Oturum anahtarı | `agent:<agentId>:acp:<uuid>`        | `agent:<agentId>:subagent:<uuid>`   |
| Ana komutlar | `/acp ...`                            | `/subagents ...`                    |
| Başlatma aracı | `sessions_spawn` with `runtime:"acp"` | `sessions_spawn` (varsayılan çalışma zamanı) |

Ayrıca bkz. [Alt ajanlar](/tools/subagents).

## ACP, Claude Code'u nasıl çalıştırır

ACP üzerinden Claude Code için yığın şöyledir:

1. OpenClaw ACP oturum denetim düzlemi
2. paketlenmiş `acpx` çalışma zamanı plugin'i
3. Claude ACP bağdaştırıcısı
4. Claude tarafı çalışma zamanı/oturum mekanizması

Önemli ayrım:

- ACP Claude, doğrudan `claude-cli/...` yedek çalışma zamanı ile aynı şey değildir.
- ACP Claude; ACP denetimleri, oturum sürdürme, arka plan görevi takibi ve isteğe bağlı konuşma/başlık bağlama içeren bir harness oturumudur.
- `claude-cli/...` yalnızca metin tabanlı yerel bir CLI arka ucudur. Bkz. [CLI Arka Uçları](/tr/gateway/cli-backends).

Operatörler için pratik kural şudur:

- `/acp spawn`, bağlanabilir oturumlar, çalışma zamanı denetimleri veya kalıcı harness çalışması istiyorsanız: ACP kullanın
- ham CLI üzerinden basit yerel metin yedeği istiyorsanız: CLI arka uçlarını kullanın

## Bağlı oturumlar

### Mevcut konuşmaya bağlamalar

Geçerli konuşmanın, alt başlık oluşturmadan kalıcı bir ACP çalışma alanı olmasını istediğinizde `/acp spawn <harness> --bind here` kullanın.

Davranış:

- OpenClaw, kanal taşımasını, kimlik doğrulamayı, güvenliği ve teslimatı yönetmeye devam eder.
- Geçerli konuşma, başlatılan ACP oturum anahtarına sabitlenir.
- O konuşmadaki takip mesajları aynı ACP oturumuna yönlendirilir.
- `/new` ve `/reset` aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close` oturumu kapatır ve mevcut konuşma bağını kaldırır.

Bunun pratikte anlamı:

- `--bind here` aynı sohbet yüzeyini korur. Discord'da mevcut kanal aynı kanal olarak kalır.
- `--bind here`, yeni bir çalışma başlatıyorsanız yine de yeni bir ACP oturumu oluşturabilir. Bağ, bu oturumu mevcut konuşmaya ekler.
- `--bind here` kendi başına alt bir Discord başlığı veya Telegram konusu oluşturmaz.
- ACP çalışma zamanının yine de kendi çalışma dizini (`cwd`) veya arka uç tarafından yönetilen diskte bir çalışma alanı olabilir. Bu çalışma zamanı alanı sohbet yüzeyinden ayrıdır ve yeni bir mesajlaşma başlığı anlamına gelmez.
- Farklı bir ACP ajanına başlatma yaparsanız ve `--cwd` vermezseniz, OpenClaw varsayılan olarak isteği gönderenin değil **hedef ajanın** çalışma alanını devralır.
- Devralınan çalışma alanı yolu yoksa (`ENOENT`/`ENOTDIR`), OpenClaw yanlış ağacı sessizce yeniden kullanmak yerine arka uç varsayılan cwd'sine geri döner.
- Devralınan çalışma alanı varsa ancak erişilemiyorsa (örneğin `EACCES`), başlatma `cwd`'yi bırakmak yerine gerçek erişim hatasını döndürür.

Zihinsel model:

- sohbet yüzeyi: insanların konuşmaya devam ettiği yer (`Discord kanalı`, `Telegram konusu`, `iMessage sohbeti`)
- ACP oturumu: OpenClaw'ın yönlendirdiği kalıcı Codex/Claude/Gemini çalışma zamanı durumu
- alt başlık/konu: yalnızca `--thread ...` ile oluşturulan isteğe bağlı ek mesajlaşma yüzeyi
- çalışma zamanı çalışma alanı: harness'in çalıştığı dosya sistemi konumu (`cwd`, repo checkout, arka uç çalışma alanı)

Örnekler:

- `/acp spawn codex --bind here`: bu sohbeti korur, bir Codex ACP oturumu başlatır veya ona bağlanır ve gelecekteki mesajları buradan oraya yönlendirir
- `/acp spawn codex --thread auto`: OpenClaw bir alt başlık/konu oluşturabilir ve ACP oturumunu oraya bağlayabilir
- `/acp spawn codex --bind here --cwd /workspace/repo`: yukarıdaki ile aynı sohbet bağı, ancak Codex `/workspace/repo` içinde çalışır

Mevcut konuşma bağlama desteği:

- Geçerli konuşma bağlama desteği bildiren sohbet/mesaj kanalları, paylaşılan konuşma bağlama yolu üzerinden `--bind here` kullanabilir.
- Özel başlık/konu anlambilimi olan kanallar, yine aynı paylaşılan arayüz arkasında kanala özgü kanonikleştirme sağlayabilir.
- `--bind here` her zaman "geçerli konuşmayı yerinde bağla" anlamına gelir.
- Genel mevcut konuşma bağları, paylaşılan OpenClaw bağlama deposunu kullanır ve normal gateway yeniden başlatmalarında korunur.

Notlar:

- `/acp spawn` üzerinde `--bind here` ve `--thread ...` birbirini dışlar.
- Discord'da `--bind here`, mevcut kanalı veya başlığı yerinde bağlar. `spawnAcpSessions` yalnızca OpenClaw'ın `--thread auto|here` için alt bir başlık oluşturması gerektiğinde gerekir.
- Etkin kanal mevcut konuşma ACP bağlarını sunmuyorsa, OpenClaw açık bir desteklenmiyor mesajı döndürür.
- `resume` ve "yeni oturum" soruları kanal soruları değil, ACP oturumu sorularıdır. Geçerli sohbet yüzeyini değiştirmeden çalışma zamanı durumunu yeniden kullanabilir veya değiştirebilirsiniz.

### Başlığa bağlı oturumlar

Bir kanal bağdaştırıcısında başlık bağları etkinleştirildiğinde, ACP oturumları başlıklara bağlanabilir:

- OpenClaw bir başlığı hedef ACP oturumuna bağlar.
- O başlıktaki takip mesajları bağlı ACP oturumuna yönlendirilir.
- ACP çıktısı aynı başlığa geri teslim edilir.
- Odak kaldırma/kapatma/arşivleme/boşta kalma zaman aşımı veya maksimum yaş süresi dolması bağı kaldırır.

Başlık bağlama desteği bağdaştırıcıya özeldir. Etkin kanal bağdaştırıcısı başlık bağlarını desteklemiyorsa, OpenClaw açık bir desteklenmiyor/kullanılamıyor mesajı döndürür.

Başlığa bağlı ACP için gerekli özellik bayrakları:

- `acp.enabled=true`
- `acp.dispatch.enabled` varsayılan olarak açıktır (ACP dağıtımını duraklatmak için `false` ayarlayın)
- Kanal bağdaştırıcısı ACP başlık başlatma bayrağı etkin (bağdaştırıcıya özgü)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Başlık destekleyen kanallar

- Oturum/başlık bağlama yeteneğini açığa çıkaran herhangi bir kanal bağdaştırıcısı.
- Mevcut yerleşik destek:
  - Discord başlıkları/kanalları
  - Telegram konuları (gruplar/süper gruplardaki forum konuları ve DM konuları)
- Plugin kanalları aynı bağlama arayüzü üzerinden destek ekleyebilir.

## Kanala özgü ayarlar

Geçici olmayan iş akışları için, kalıcı ACP bağlarını üst düzey `bindings[]` girdilerinde yapılandırın.

### Bağlama modeli

- `bindings[].type="acp"` kalıcı bir ACP konuşma bağını işaretler.
- `bindings[].match` hedef konuşmayı tanımlar:
  - Discord kanalı veya başlığı: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram forum konusu: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles DM/grup sohbeti: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Kararlı grup bağları için `chat_id:*` veya `chat_identifier:*` tercih edin.
  - iMessage DM/grup sohbeti: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Kararlı grup bağları için `chat_id:*` tercih edin.
- `bindings[].agentId`, sahip OpenClaw ajan kimliğidir.
- İsteğe bağlı ACP geçersiz kılmaları `bindings[].acp` altında yaşar:
  - `mode` (`persistent` veya `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Ajan başına çalışma zamanı varsayılanları

Ajan başına ACP varsayılanlarını bir kez tanımlamak için `agents.list[].runtime` kullanın:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (harness kimliği, örneğin `codex` veya `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

ACP bağlı oturumlar için geçersiz kılma önceliği:

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

- OpenClaw, yapılandırılmış ACP oturumunun kullanımdan önce var olduğundan emin olur.
- O kanaldaki veya konudaki mesajlar yapılandırılmış ACP oturumuna yönlendirilir.
- Bağlı konuşmalarda `/new` ve `/reset`, aynı ACP oturum anahtarını yerinde sıfırlar.
- Geçici çalışma zamanı bağları (örneğin başlık odak akışları tarafından oluşturulanlar) mevcut oldukları yerde yine uygulanır.
- Açık bir `cwd` olmadan ajanlar arası ACP başlatmalarında OpenClaw, hedef ajan çalışma alanını ajan yapılandırmasından devralır.
- Eksik devralınmış çalışma alanı yolları arka uç varsayılan cwd'ye geri döner; eksik olmayan erişim hataları ise başlatma hatası olarak gösterilir.

## ACP oturumlarını başlatma (arayüzler)

### `sessions_spawn` üzerinden

Bir ajan turundan veya araç çağrısından ACP oturumu başlatmak için `runtime: "acp"` kullanın.

```json
{
  "task": "Repoyu aç ve başarısız testleri özetle",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Notlar:

- `runtime` varsayılan olarak `subagent` olur, bu yüzden ACP oturumları için `runtime: "acp"` değerini açıkça ayarlayın.
- `agentId` atlanırsa, yapılandırılmışsa OpenClaw `acp.defaultAgent` kullanır.
- `mode: "session"` kalıcı bağlı bir konuşma tutmak için `thread: true` gerektirir.

Arayüz ayrıntıları:

- `task` (zorunlu): ACP oturumuna gönderilen ilk istem.
- `runtime` (ACP için zorunlu): `"acp"` olmalıdır.
- `agentId` (isteğe bağlı): ACP hedef harness kimliği. Ayarlanmışsa `acp.defaultAgent` değerine geri düşer.
- `thread` (isteğe bağlı, varsayılan `false`): desteklenen yerlerde başlık bağlama akışını ister.
- `mode` (isteğe bağlı): `run` (tek seferlik) veya `session` (kalıcı).
  - varsayılan `run`'dır
  - `thread: true` ve mode atlanmışsa, OpenClaw çalışma zamanı yoluna göre varsayılan olarak kalıcı davranış seçebilir
  - `mode: "session"` için `thread: true` gerekir
- `cwd` (isteğe bağlı): istenen çalışma zamanı çalışma dizini (arka uç/çalışma zamanı ilkesi tarafından doğrulanır). Atlanırsa, ACP başlatma yapılandırılmışsa hedef ajan çalışma alanını devralır; eksik devralınan yollar arka uç varsayılanlarına geri düşer, gerçek erişim hataları ise döndürülür.
- `label` (isteğe bağlı): oturum/banner metninde kullanılan operatör odaklı etiket.
- `resumeSessionId` (isteğe bağlı): yeni bir oturum oluşturmak yerine mevcut ACP oturumunu sürdürür. Ajan konuşma geçmişini `session/load` ile yeniden oynatır. `runtime: "acp"` gerektirir.
- `streamTo` (isteğe bağlı): `"parent"` ilk ACP çalışma ilerleme özetlerini sistem olayları olarak isteği yapan oturuma geri akıtır.
  - Kullanılabildiğinde, kabul edilen yanıtlarda tam aktarma geçmişi için izleyebileceğiniz oturum kapsamlı bir JSONL günlük dosyasına (`<sessionId>.acp-stream.jsonl`) işaret eden `streamLogPath` bulunur.

### Mevcut bir oturumu sürdürme

Yeni başlatmak yerine önceki bir ACP oturumunu sürdürmek için `resumeSessionId` kullanın. Ajan konuşma geçmişini `session/load` üzerinden yeniden oynattığı için, önceki tam bağlamla kaldığı yerden devam eder.

```json
{
  "task": "Kaldığımız yerden devam et — kalan test hatalarını düzelt",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Yaygın kullanım durumları:

- Bir Codex oturumunu dizüstü bilgisayarınızdan telefonunuza devretmek — ajanınıza kaldığınız yerden devam etmesini söyleyin
- CLI'de etkileşimli olarak başlattığınız bir kodlama oturumunu artık ajanınız üzerinden başsız olarak sürdürmek
- Gateway yeniden başlatması veya boşta kalma zaman aşımı nedeniyle kesilen çalışmayı devam ettirmek

Notlar:

- `resumeSessionId` için `runtime: "acp"` gerekir — alt ajan çalışma zamanı ile kullanılırsa hata döner.
- `resumeSessionId`, üst akış ACP konuşma geçmişini geri yükler; `thread` ve `mode` yine de oluşturmakta olduğunuz yeni OpenClaw oturumuna normal şekilde uygulanır, bu nedenle `mode: "session"` için hâlâ `thread: true` gerekir.
- Hedef ajan `session/load` desteğine sahip olmalıdır (Codex ve Claude Code destekler).
- Oturum kimliği bulunamazsa, başlatma açık bir hata ile başarısız olur — yeni bir oturuma sessiz geri dönüş yoktur.

### Operatör smoke testi

Bir gateway dağıtımından sonra ACP başlatmanın yalnızca birim testlerini geçmekle kalmayıp gerçekten uçtan uca çalıştığını hızlıca canlı doğrulamak istediğinizde bunu kullanın.

Önerilen geçit:

1. Hedef ana makinede dağıtılmış gateway sürümünü/commit'ini doğrulayın.
2. Dağıtılmış kaynağın `src/gateway/sessions-patch.ts` içinde ACP soy kabulünü içerdiğini doğrulayın (`subagent:* or acp:* sessions`).
3. Canlı bir ajana geçici bir ACPX köprü oturumu açın (örneğin `jpclawhq` üzerinde `razor(main)`).
4. O ajandan şu özelliklerle `sessions_spawn` çağırmasını isteyin:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - görev: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Ajanın şunları bildirdiğini doğrulayın:
   - `accepted=yes`
   - gerçek bir `childSessionKey`
   - doğrulayıcı hatası yok
6. Geçici ACPX köprü oturumunu temizleyin.

Canlı ajana örnek istem:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Notlar:

- Kasıtlı olarak başlığa bağlı kalıcı ACP oturumlarını test etmiyorsanız bu smoke testini `mode: "run"` üzerinde tutun.
- Temel geçit için `streamTo: "parent"` gerektirmeyin. Bu yol, istekte bulunan/oturum yeteneklerine bağlıdır ve ayrı bir entegrasyon denetimidir.
- Başlığa bağlı `mode: "session"` testini gerçek bir Discord başlığından veya Telegram konusundan ikinci, daha zengin bir entegrasyon geçişi olarak ele alın.

## Sandbox uyumluluğu

ACP oturumları şu anda OpenClaw sandbox'ı içinde değil, ana makine çalışma zamanında çalışır.

Mevcut sınırlamalar:

- İstek yapan oturum sandbox içindeyse ACP başlatmaları hem `sessions_spawn({ runtime: "acp" })` hem de `/acp spawn` için engellenir.
  - Hata: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `runtime: "acp"` ile `sessions_spawn`, `sandbox: "require"` desteği sunmaz.
  - Hata: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Sandbox zorlamalı yürütme gerektiğinde `runtime: "subagent"` kullanın.

### `/acp` komutundan

Gerektiğinde sohbette açık operatör denetimi için `/acp spawn` kullanın.

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

Bkz. [Slash Komutları](/tools/slash-commands).

## Oturum hedefi çözümleme

Çoğu `/acp` eylemi isteğe bağlı bir oturum hedefi kabul eder (`session-key`, `session-id` veya `session-label`).

Çözümleme sırası:

1. Açık hedef argümanı (veya `/acp steer` için `--session`)
   - önce anahtarı dener
   - sonra UUID biçimli oturum kimliğini
   - sonra etiketi
2. Geçerli başlık bağı (bu konuşma/başlık bir ACP oturumuna bağlıysa)
3. Geçerli istek yapan oturumuna geri dönüş

Mevcut konuşma bağları ve başlık bağları 2. adıma katılır.

Hedef çözümlenemezse OpenClaw açık bir hata döndürür (`Unable to resolve session target: ...`).

## Başlatma bağlama modları

`/acp spawn`, `--bind here|off` desteği sunar.

| Mod    | Davranış                                                                |
| ------ | ----------------------------------------------------------------------- |
| `here` | Geçerli etkin konuşmayı yerinde bağlar; etkin bir konuşma yoksa başarısız olur. |
| `off`  | Mevcut konuşma bağı oluşturmaz.                                         |

Notlar:

- `--bind here`, "bu kanal veya sohbeti Codex destekli yap" için en basit operatör yoludur.
- `--bind here` bir alt başlık oluşturmaz.
- `--bind here` yalnızca mevcut konuşma bağlama desteği sunan kanallarda kullanılabilir.
- `--bind` ve `--thread` aynı `/acp spawn` çağrısında birlikte kullanılamaz.

## Başlatma başlık modları

`/acp spawn`, `--thread auto|here|off` desteği sunar.

| Mod    | Davranış                                                                                             |
| ------ | ---------------------------------------------------------------------------------------------------- |
| `auto` | Etkin bir başlıktaysanız: o başlığı bağlar. Başlık dışında: destekleniyorsa bir alt başlık oluşturur/bağlar. |
| `here` | Geçerli etkin başlığı zorunlu kılar; bir başlıkta değilse başarısız olur.                            |
| `off`  | Bağ yoktur. Oturum bağlı olmadan başlar.                                                             |

Notlar:

- Başlık bağlamayan yüzeylerde varsayılan davranış fiilen `off` olur.
- Başlığa bağlı başlatma kanal ilkesi desteği gerektirir:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Alt başlık oluşturmadan geçerli konuşmayı sabitlemek istediğinizde `--bind here` kullanın.

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

`/acp status`, etkin çalışma zamanı seçeneklerini ve mevcut olduğunda hem çalışma zamanı düzeyi hem de arka uç düzeyi oturum tanımlayıcılarını gösterir.

Bazı denetimler arka uç yeteneklerine bağlıdır. Arka uç bir denetimi desteklemiyorsa, OpenClaw açık bir desteklenmeyen denetim hatası döndürür.

## ACP komut yemek kitabı

| Komut                | Ne yapar                                                 | Örnek                                                        |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------------------ |
| `/acp spawn`         | ACP oturumu oluşturur; isteğe bağlı mevcut bağ veya başlık bağı. | `/acp spawn codex --bind here --cwd /repo`                   |
| `/acp cancel`        | Hedef oturum için devam eden turu iptal eder.            | `/acp cancel agent:codex:acp:<uuid>`                         |
| `/acp steer`         | Çalışan oturuma yönlendirme talimatı gönderir.           | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Oturumu kapatır ve başlık hedefi bağlarını kaldırır.     | `/acp close`                                                 |
| `/acp status`        | Arka uç, mod, durum, çalışma zamanı seçenekleri, yetenekleri gösterir. | `/acp status`                                                |
| `/acp set-mode`      | Hedef oturum için çalışma zamanı modunu ayarlar.         | `/acp set-mode plan`                                         |
| `/acp set`           | Genel çalışma zamanı yapılandırma seçeneği yazımı.       | `/acp set model openai/gpt-5.4`                              |
| `/acp cwd`           | Çalışma zamanı çalışma dizini geçersiz kılmasını ayarlar. | `/acp cwd /Users/user/Projects/repo`                         |
| `/acp permissions`   | Onay ilkesi profilini ayarlar.                           | `/acp permissions strict`                                    |
| `/acp timeout`       | Çalışma zamanı zaman aşımını (saniye) ayarlar.           | `/acp timeout 120`                                           |
| `/acp model`         | Çalışma zamanı model geçersiz kılmasını ayarlar.         | `/acp model anthropic/claude-opus-4-6`                       |
| `/acp reset-options` | Oturum çalışma zamanı seçenek geçersiz kılmalarını kaldırır. | `/acp reset-options`                                         |
| `/acp sessions`      | Depodan son ACP oturumlarını listeler.                   | `/acp sessions`                                              |
| `/acp doctor`        | Arka uç sağlığı, yetenekler, uygulanabilir düzeltmeler.  | `/acp doctor`                                                |
| `/acp install`       | Deterministik kurulum ve etkinleştirme adımlarını yazdırır. | `/acp install`                                               |

`/acp sessions`, depo verisini geçerli bağlı veya isteği yapan oturum için okur. `session-key`, `session-id` veya `session-label` belirteçlerini kabul eden komutlar, özel ajan başına `session.store` kökleri dahil olmak üzere hedefleri gateway oturum keşfi üzerinden çözümler.

## Çalışma zamanı seçenek eşlemesi

`/acp`, kolaylık komutları ve genel bir ayarlayıcı içerir.

Eşdeğer işlemler:

- `/acp model <id>`, çalışma zamanı yapılandırma anahtarı `model` ile eşleşir.
- `/acp permissions <profile>`, çalışma zamanı yapılandırma anahtarı `approval_policy` ile eşleşir.
- `/acp timeout <seconds>`, çalışma zamanı yapılandırma anahtarı `timeout` ile eşleşir.
- `/acp cwd <path>`, çalışma zamanı cwd geçersiz kılmasını doğrudan günceller.
- `/acp set <key> <value>`, genel yoldur.
  - Özel durum: `key=cwd`, cwd geçersiz kılma yolunu kullanır.
- `/acp reset-options`, hedef oturum için tüm çalışma zamanı geçersiz kılmalarını temizler.

## acpx harness desteği (mevcut)

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

OpenClaw acpx arka ucunu kullandığında, acpx yapılandırmanız özel ajan takma adları tanımlamıyorsa `agentId` için bu değerleri tercih edin.
Yerel Cursor kurulumunuz ACP'yi hâlâ `agent acp` olarak açığa çıkarıyorsa, yerleşik varsayılanı değiştirmek yerine acpx yapılandırmanızda `cursor` ajan komutunu geçersiz kılın.

Doğrudan acpx CLI kullanımı `--agent <command>` üzerinden keyfi bağdaştırıcıları da hedefleyebilir, ancak bu ham kaçış kapısı normal OpenClaw `agentId` yolu değil, acpx CLI özelliğidir.

## Gerekli yapılandırma

Temel ACP tabanı:

```json5
{
  acp: {
    enabled: true,
    // İsteğe bağlı. Varsayılan true'dur; /acp denetimlerini korurken ACP dağıtımını duraklatmak için false ayarlayın.
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

Başlık bağlama yapılandırması kanal bağdaştırıcısına özeldir. Discord için örnek:

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

Başlığa bağlı ACP başlatma çalışmıyorsa önce bağdaştırıcı özellik bayrağını doğrulayın:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Mevcut konuşma bağları alt başlık oluşturmayı gerektirmez. Etkin bir konuşma bağlamı ve ACP konuşma bağlarını açığa çıkaran bir kanal bağdaştırıcısı gerektirirler.

Bkz. [Yapılandırma Başvurusu](/tr/gateway/configuration-reference).

## acpx arka ucu için plugin kurulumu

Yeni kurulumlar paketlenmiş `acpx` çalışma zamanı plugin'i varsayılan olarak etkin gönderildiği için, ACP genellikle manuel bir plugin kurulum adımı olmadan çalışır.

Şununla başlayın:

```text
/acp doctor
```

`acpx` devre dışı bıraktıysanız, `plugins.allow` / `plugins.deny` ile engellediyseniz veya yerel bir geliştirme checkout'una geçmek istiyorsanız, açık plugin yolunu kullanın:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Geliştirme sırasında yerel çalışma alanı kurulumu:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Ardından arka uç sağlığını doğrulayın:

```text
/acp doctor
```

### acpx komut ve sürüm yapılandırması

Varsayılan olarak, paketlenmiş acpx arka uç plugin'i (`acpx`) plugin yerel sabitlenmiş ikiliyi kullanır:

1. Komut varsayılan olarak ACPX plugin paketi içindeki plugin yerel `node_modules/.bin/acpx` olur.
2. Beklenen sürüm varsayılan olarak extension sabitlemesine göre belirlenir.
3. Başlangıç, ACP arka ucunu anında hazır değil olarak kaydeder.
4. Arka plandaki bir ensure işi `acpx --version` doğrulaması yapar.
5. Plugin yerel ikili eksikse veya sürüm uyuşmuyorsa şu komutu çalıştırır:
   `npm install --omit=dev --no-save acpx@<pinned>` ve yeniden doğrular.

Plugin yapılandırmasında komut/sürümü geçersiz kılabilirsiniz:

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

- `command` mutlak yol, göreli yol veya komut adı (`acpx`) kabul eder.
- Göreli yollar OpenClaw çalışma alanı dizininden çözülür.
- `expectedVersion: "any"`, katı sürüm eşlemesini devre dışı bırakır.
- `command` özel bir ikili/yola işaret ettiğinde, plugin yerel otomatik kurulum devre dışı kalır.
- Arka uç sağlık denetimi çalışırken OpenClaw başlangıcı engelleyici olmadan devam eder.

Bkz. [Plugins](/tools/plugin).

### Otomatik bağımlılık kurulumu

OpenClaw'ı `npm install -g openclaw` ile global olarak yüklediğinizde, acpx
çalışma zamanı bağımlılıkları (platforma özgü ikili dosyalar) bir postinstall kancası ile otomatik olarak kurulur. Otomatik kurulum başarısız olursa, gateway yine normal şekilde başlar ve eksik bağımlılığı `openclaw acp doctor` aracılığıyla bildirir.

### Plugin araçları MCP köprüsü

Varsayılan olarak ACPX oturumları, OpenClaw plugin kayıtlı araçlarını ACP harness'ine **açığa çıkarmaz**.

Codex veya Claude Code gibi ACP ajanlarının memory recall/store gibi yüklü
OpenClaw plugin araçlarını çağırmasını istiyorsanız, özel köprüyü etkinleştirin:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Bunun yaptığı şey:

- ACPX oturumu önyüklemesine `openclaw-plugin-tools` adlı yerleşik bir MCP sunucusu enjekte eder.
- Yüklü ve etkin OpenClaw plugin'leri tarafından zaten kaydedilmiş plugin araçlarını açığa çıkarır.
- Özelliği açık ve varsayılan olarak kapalı tutar.

Güvenlik ve güven notları:

- Bu, ACP harness araç yüzeyini genişletir.
- ACP ajanları yalnızca gateway içinde zaten etkin olan plugin araçlarına erişim kazanır.
- Bunu, aynı plugin'lerin OpenClaw içinde yürütülmesine izin vermekle aynı güven sınırı olarak değerlendirin.
- Etkinleştirmeden önce yüklü plugin'leri gözden geçirin.

Özel `mcpServers` eskisi gibi çalışmaya devam eder. Yerleşik plugin araçları köprüsü, genel MCP sunucu yapılandırmasının yerine geçen değil, ek bir isteğe bağlı kolaylıktır.

## İzin yapılandırması

ACP oturumları etkileşimsiz çalışır — dosya yazma ve shell exec izin istemlerini onaylayıp reddetmek için bir TTY yoktur. acpx plugin'i, izinlerin nasıl ele alınacağını denetleyen iki yapılandırma anahtarı sağlar:

Bu ACPX harness izinleri, OpenClaw exec onaylarından ve Claude CLI `--permission-mode bypassPermissions` gibi CLI arka ucu sağlayıcı atlama bayraklarından ayrıdır. ACPX `approve-all`, ACP oturumları için harness düzeyindeki acil durum anahtarıdır.

### `permissionMode`

Harness ajanının hangi işlemleri istem göstermeden gerçekleştirebileceğini denetler.

| Değer           | Davranış                                                     |
| --------------- | ------------------------------------------------------------ |
| `approve-all`   | Tüm dosya yazmaları ve shell komutlarını otomatik onaylar.   |
| `approve-reads` | Yalnızca okumaları otomatik onaylar; yazma ve exec istem gerektirir. |
| `deny-all`      | Tüm izin istemlerini reddeder.                               |

### `nonInteractivePermissions`

İzin istemi gösterilmesi gerekirken etkileşimli TTY bulunmadığında ne olacağını denetler (ACP oturumları için her zaman böyledir).

| Değer  | Davranış                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | Oturumu `AcpRuntimeError` ile sonlandırır. **(varsayılan)**       |
| `deny` | İzni sessizce reddeder ve devam eder (zarif bozulma).             |

### Yapılandırma

Plugin yapılandırması üzerinden ayarlayın:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Bu değerleri değiştirdikten sonra gateway'i yeniden başlatın.

> **Önemli:** OpenClaw şu anda varsayılan olarak `permissionMode=approve-reads` ve `nonInteractivePermissions=fail` kullanır. Etkileşimsiz ACP oturumlarında, izin istemi tetikleyen herhangi bir yazma veya exec işlemi `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` ile başarısız olabilir.
>
> İzinleri kısıtlamanız gerekiyorsa, oturumlar çökme yerine zarif biçimde bozulsun diye `nonInteractivePermissions` değerini `deny` yapın.

## Sorun giderme

| Belirti                                                                    | Olası neden                                                                    | Düzeltme                                                                                                                                                               |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                    | Arka uç plugin'i eksik veya devre dışı.                                        | Arka uç plugin'ini kurup etkinleştirin, ardından `/acp doctor` çalıştırın.                                                                                            |
| `ACP is disabled by policy (acp.enabled=false)`                            | ACP genel olarak devre dışı.                                                   | `acp.enabled=true` ayarlayın.                                                                                                                                          |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`          | Normal başlık mesajlarından dağıtım devre dışı.                                | `acp.dispatch.enabled=true` ayarlayın.                                                                                                                                 |
| `ACP agent "<id>" is not allowed by policy`                                | Ajan izin listesinde değil.                                                    | İzin verilen `agentId` kullanın veya `acp.allowedAgents` güncelleyin.                                                                                                 |
| `Unable to resolve session target: ...`                                    | Hatalı anahtar/kimlik/etiket belirteci.                                        | `/acp sessions` çalıştırın, tam anahtar/etiketi kopyalayın, yeniden deneyin.                                                                                          |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here`, etkin bağlanabilir bir konuşma olmadan kullanıldı.             | Hedef sohbet/kanala gidip yeniden deneyin veya bağlı olmayan başlatma kullanın.                                                                                        |
| `Conversation bindings are unavailable for <channel>.`                     | Bağdaştırıcı mevcut konuşma ACP bağlama yeteneğine sahip değil.                | Destekleniyorsa `/acp spawn ... --thread ...` kullanın, üst düzey `bindings[]` yapılandırın veya desteklenen bir kanala geçin.                                       |
| `--thread here requires running /acp spawn inside an active ... thread`    | `--thread here` bir başlık bağlamı dışında kullanıldı.                         | Hedef başlığa geçin veya `--thread auto`/`off` kullanın.                                                                                                               |
| `Only <user-id> can rebind this channel/conversation/thread.`              | Etkin bağ hedefinin sahibi başka bir kullanıcı.                                | Sahibi olarak yeniden bağlayın veya farklı bir konuşma ya da başlık kullanın.                                                                                          |
| `Thread bindings are unavailable for <channel>.`                           | Bağdaştırıcı başlık bağlama yeteneğine sahip değil.                            | `--thread off` kullanın veya desteklenen bir bağdaştırıcı/kanala geçin.                                                                                                |
| `Sandboxed sessions cannot spawn ACP sessions ...`                         | ACP çalışma zamanı ana makine tarafındadır; isteği yapan oturum sandbox içindedir. | Sandbox içindeki oturumlardan `runtime="subagent"` kullanın veya ACP başlatmayı sandbox dışı bir oturumdan yapın.                                                     |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`    | ACP çalışma zamanı için `sandbox="require"` istendi.                           | Zorunlu sandbox için `runtime="subagent"` kullanın veya sandbox dışı bir oturumdan ACP'yi `sandbox="inherit"` ile kullanın.                                           |
| Bağlı oturum için ACP meta verisi eksik                                    | Eski/silinmiş ACP oturum meta verisi.                                          | `/acp spawn` ile yeniden oluşturun, ardından başlığı yeniden bağlayın/odaklayın.                                                                                      |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`   | `permissionMode`, etkileşimsiz ACP oturumunda yazma/exec işlemlerini engelliyor. | `plugins.entries.acpx.config.permissionMode` değerini `approve-all` yapın ve gateway'i yeniden başlatın. Bkz. [İzin yapılandırması](#permission-configuration).      |
| ACP oturumu çok az çıktı ile erkenden başarısız oluyor                     | İzin istemleri `permissionMode`/`nonInteractivePermissions` tarafından engelleniyor. | `AcpRuntimeError` için gateway günlüklerini kontrol edin. Tam izin için `permissionMode=approve-all`; zarif bozulma için `nonInteractivePermissions=deny` ayarlayın. |
| ACP oturumu işi tamamladıktan sonra belirsiz süreyle takılı kalıyor        | Harness işlemi tamamlandı ama ACP oturumu tamamlanmayı bildirmedi.             | `ps aux \| grep acpx` ile izleyin; eski işlemleri manuel olarak sonlandırın.                                                                                          |

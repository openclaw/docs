---
read_when:
    - Yürütme onaylarını veya izin listelerini yapılandırma
    - macOS uygulamasında yürütme onayı UX'ini uygulama
    - Sandbox'tan kaçış istemlerini ve bunların sonuçlarını gözden geçirme
sidebarTitle: Exec approvals
summary: 'Ana makine yürütme onayları: politika düğmeleri, izin listeleri ve YOLO/strict iş akışı'
title: Yürütme onayları
x-i18n:
    generated_at: "2026-04-26T11:41:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 868cee97882f7298a092bdcb9ec8fd058a5d7cb8745fad2edd712fabfb512e52
    source_path: tools/exec-approvals.md
    workflow: 15
---

Yürütme onayları, sandbox içindeki bir aracının gerçek bir ana makinede (`gateway` veya `node`) komut çalıştırmasına izin vermek için kullanılan **tamamlayıcı uygulama / node ana makine korumasıdır**. Bir güvenlik ara kilididir: komutlara yalnızca politika + izin listesi + (isteğe bağlı) kullanıcı onayı birlikte izin verdiğinde izin verilir. Yürütme onayları, araç politikasının ve yükseltilmiş geçitlemenin **üstüne** eklenir (yükseltilmiş `full` olarak ayarlanmışsa onaylar atlanır).

<Note>
Etkili politika, `tools.exec.*` ile onay varsayılanlarının **daha katı olanıdır**; bir onay alanı atlanırsa `tools.exec` değeri kullanılır. Ana makine yürütmesi, o makinedeki yerel onay durumunu da kullanır — `~/.openclaw/exec-approvals.json` içindeki ana makineye yerel `ask: "always"` değeri, oturum veya yapılandırma varsayılanları `ask: "on-miss"` istese bile sormaya devam eder.
</Note>

## Etkili politikayı inceleme

| Komut                                                           | Gösterdiği şey                                                                         |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | İstenen politika, ana makine politika kaynakları ve etkili sonuç.                      |
| `openclaw exec-policy show`                                      | Yerel makinedeki birleştirilmiş görünüm.                                                |
| `openclaw exec-policy set` / `preset`                            | Yerel istenen politikayı yerel ana makine onay dosyasıyla tek adımda eşzamanlar.       |

Yerel bir kapsam `host=node` istediğinde, `exec-policy show` çalışma zamanında bu kapsamı, yerel onay dosyası gerçeğin kaynağıymış gibi göstermek yerine node tarafından yönetilen olarak bildirir.

Tamamlayıcı uygulama UI'ı **kullanılamıyorsa**, normalde istem gösterecek her istek **ask fallback** ile çözülür (varsayılan: `deny`).

<Tip>
Yerel sohbet onay istemcileri, bekleyen onay iletisinde kanala özgü kullanım kolaylıkları ekleyebilir. Örneğin Matrix, yedek olarak iletide `/approve ...` komutlarını bırakırken tepki kısayollarını (`✅` bir kez izin ver, `❌` reddet, `♾️` her zaman izin ver) ekler.
</Tip>

## Nerede uygulanır

Yürütme onayları, yürütmenin yapıldığı ana makinede yerel olarak uygulanır:

- **Gateway ana makinesi** → gateway makinesindeki `openclaw` süreci.
- **Node ana makinesi** → node çalıştırıcısı (macOS tamamlayıcı uygulaması veya başsız node ana makinesi).

### Güven modeli

- Gateway ile kimliği doğrulanmış çağıranlar, o Gateway için güvenilir operatörlerdir.
- Eşleştirilmiş node'lar, bu güvenilir operatör yeteneğini node ana makinesine genişletir.
- Yürütme onayları yanlışlıkla yürütme riskini azaltır, ancak kullanıcı başına bir kimlik doğrulama sınırı **değildir**.
- Onaylanmış node ana makinesi çalıştırmaları kanonik yürütme bağlamını bağlar: kanonik cwd, tam argv, varsa env bağlaması ve uygunsa sabitlenmiş yürütülebilir yol.
- Kabuk betikleri ve doğrudan yorumlayıcı/çalışma zamanı dosya çağrıları için OpenClaw ayrıca tek bir somut yerel dosya işlenenini bağlamaya çalışır. Bu bağlanmış dosya onaydan sonra ama yürütmeden önce değişirse, kaymış içerik yürütülmek yerine çalışma reddedilir.
- Dosya bağlama bilerek en iyi çaba esaslıdır, her yorumlayıcı/çalışma zamanı yükleyici yolunun eksiksiz semantik modeli **değildir**. Onay modu bağlamak için tam olarak bir somut yerel dosya belirleyemezse, tam kapsama varmış gibi davranmak yerine onaya dayalı bir çalıştırma üretmeyi reddeder.

### macOS ayrımı

- **Node ana makinesi hizmeti**, `system.run` çağrılarını yerel IPC üzerinden **macOS uygulamasına** iletir.
- **macOS uygulaması**, onayları uygular ve komutu UI bağlamında çalıştırır.

## Ayarlar ve depolama

Onaylar, yürütmenin yapıldığı ana makinede yerel bir JSON dosyasında tutulur:

```text
~/.openclaw/exec-approvals.json
```

Örnek şema:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Politika düğmeleri

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` — tüm ana makine yürütme isteklerini engeller.
  - `allowlist` — yalnızca izin listesindeki komutlara izin verir.
  - `full` — her şeye izin verir (yükseltilmiş ile eşdeğer).
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` — asla sorma.
  - `on-miss` — yalnızca izin listesi eşleşmediğinde sor.
  - `always` — her komutta sor. Dayanıklı `allow-always` güveni, etkili sorma modu `always` olduğunda istemleri **bastırmaz**.
</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  İstem gerektiğinde ancak hiçbir UI erişilemediğinde çözüm.

- `deny` — engelle.
- `allowlist` — yalnızca izin listesi eşleşirse izin ver.
- `full` — izin ver.
  </ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  `true` olduğunda OpenClaw, yorumlayıcı ikilisi izin listesinde olsa bile satır içi kod değerlendirme biçimlerini yalnızca onaylı sayar. Tek bir kararlı dosya işlenenine temiz biçimde eşlenmeyen yorumlayıcı yükleyicileri için ek savunma katmanıdır.
</ParamField>

Katı modun yakaladığı örnekler:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Katı modda bu komutlar yine de açık onay gerektirir ve `allow-always` bunlar için yeni izin listesi girdilerini otomatik olarak kalıcı hâle getirmez.

## YOLO modu (onaysız)

Ana makine yürütmesinin onay istemleri olmadan çalışmasını istiyorsanız, **iki** politika katmanını da açmanız gerekir — OpenClaw yapılandırmasındaki istenen yürütme politikası (`tools.exec.*`) **ve** `~/.openclaw/exec-approvals.json` içindeki ana makineye yerel onay politikası.

Siz açıkça sıkılaştırmadıkça YOLO, varsayılan ana makine davranışıdır:

| Katman                | YOLO ayarı                 |
| --------------------- | -------------------------- |
| `tools.exec.security` | `gateway`/`node` üzerinde `full` |
| `tools.exec.ask`      | `off`                      |
| Ana makine `askFallback` | `full`                  |

<Warning>
**Önemli ayrımlar:**

- `tools.exec.host=auto`, yürütmenin **nerede** yapılacağını seçer: varsa sandbox içinde, yoksa gateway üzerinde.
- YOLO, ana makine yürütmesinin **nasıl** onaylandığını seçer: `security=full` artı `ask=off`.
- YOLO modunda OpenClaw, yapılandırılmış ana makine yürütme politikasının üstüne ayrı bir sezgisel komut gizleme onay geçidi veya betik ön kontrol reddetme katmanı eklemez.
- `auto`, sandbox içindeki bir oturumdan gateway yönlendirmesini serbest bir geçersiz kılma yapmaz. Çağrı başına `host=node` isteğine `auto` üzerinden izin verilir; `host=gateway` isteğine ise yalnızca etkin bir sandbox çalışma zamanı yoksa `auto` üzerinden izin verilir. Kararlı bir `auto` dışı varsayılan için `tools.exec.host` ayarlayın veya `/exec host=...` komutunu açıkça kullanın.
  </Warning>

Kendi etkileşimsiz izin modunu sunan CLI tabanlı sağlayıcılar bu politikayı izleyebilir. Claude CLI, OpenClaw'ın istenen yürütme politikası YOLO olduğunda `--permission-mode bypassPermissions` ekler. Bu arka uç davranışını `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` altında açık Claude argümanlarıyla geçersiz kılın — örneğin `--permission-mode default`, `acceptEdits` veya `bypassPermissions`.

Daha muhafazakâr bir kurulum istiyorsanız, herhangi bir katmanı yeniden `allowlist` / `on-miss` veya `deny` olarak sıkılaştırın.

### Kalıcı gateway ana makinesi "asla sorma" kurulumu

<Steps>
  <Step title="İstenen yapılandırma politikasını ayarlayın">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Ana makine onay dosyasını eşleştirin">
    ```bash
    openclaw approvals set --stdin <<'EOF'
    {
      version: 1,
      defaults: {
        security: "full",
        ask: "off",
        askFallback: "full"
      }
    }
    EOF
    ```
  </Step>
</Steps>

### Yerel kısayol

```bash
openclaw exec-policy preset yolo
```

Bu yerel kısayol şunların ikisini de günceller:

- Yerel `tools.exec.host/security/ask`.
- Yerel `~/.openclaw/exec-approvals.json` varsayılanları.

Bilerek yalnızca yereldir. Gateway ana makinesi veya node ana makinesi onaylarını uzaktan değiştirmek için `openclaw approvals set --gateway` veya `openclaw approvals set --node <id|name|ip>` kullanın.

### Node ana makinesi

Bir node ana makinesi için aynı onay dosyasını bunun yerine o node üzerinde uygulayın:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

<Note>
**Yalnızca yerel sınırlamalar:**

- `openclaw exec-policy`, node onaylarını eşzamanlamaz.
- `openclaw exec-policy set --host node` reddedilir.
- Node yürütme onayları çalışma zamanında node'dan alınır, bu nedenle node hedefli güncellemeler `openclaw approvals --node ...` kullanmalıdır.
  </Note>

### Yalnızca oturum kısayolu

- `/exec security=full ask=off` yalnızca geçerli oturumu değiştirir.
- `/elevated full`, o oturum için yürütme onaylarını da atlayan acil durum kısayoludur.

Ana makine onay dosyası yapılandırmadan daha katı kalırsa, daha katı ana makine politikası yine kazanır.

## İzin listesi (aracı başına)

İzin listeleri **aracı başınadır**. Birden fazla aracı varsa, macOS uygulamasında düzenlediğiniz aracıyı değiştirin. Desenler glob eşleşmeleridir.

Desenler çözümlenmiş ikili yol glob'ları veya yalın komut adı glob'ları olabilir. Yalın adlar yalnızca `PATH` üzerinden çağrılan komutlarla eşleşir; bu nedenle `rg`, komut `rg` olduğunda `/opt/homebrew/bin/rg` ile eşleşebilir, ancak `./rg` veya `/tmp/rg` ile eşleşmez. Belirli bir ikili konumuna güvenmek istiyorsanız yol glob'u kullanın.

Eski `agents.default` girdileri yükleme sırasında `agents.main` içine taşınır.
`echo ok && pwd` gibi kabuk zincirlerinde yine de her üst düzey bölümün izin listesi kurallarını karşılaması gerekir.

Örnekler:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Her izin listesi girdisi şunları izler:

| Alan              | Anlamı                           |
| ------------------ | -------------------------------- |
| `id`               | UI kimliği için kullanılan kararlı UUID |
| `lastUsedAt`       | Son kullanım zaman damgası       |
| `lastUsedCommand`  | Eşleşen son komut                |
| `lastResolvedPath` | Son çözümlenen ikili yolu        |

## Skill CLI'lerini otomatik izin verme

**Skill CLI'lerini otomatik izin ver** etkin olduğunda, bilinen Skills tarafından başvurulan yürütülebilir dosyalar node'larda (macOS node veya başsız node ana makinesi) izin listesinde kabul edilir. Bu, skill ikili listesini almak için Gateway RPC üzerinden `skills.bins` kullanır. Sıkı el ile izin listeleri istiyorsanız bunu devre dışı bırakın.

<Warning>
- Bu, el ile yol izin listesi girdilerinden ayrı **örtük bir kolaylık izin listesidir**.
- Gateway ile node'un aynı güven sınırında olduğu güvenilir operatör ortamları için tasarlanmıştır.
- Sıkı açık güven gerektiriyorsanız `autoAllowSkills: false` kullanın ve yalnızca el ile yol izin listesi girdileri kullanın.
</Warning>

## Güvenli ikili dosyalar ve onay iletme

Güvenli ikili dosyalar (yalnızca stdin hızlı yolu), yorumlayıcı bağlama ayrıntıları ve onay istemlerinin Slack/Discord/Telegram'a nasıl iletileceği (veya bunların yerel onay istemcileri olarak nasıl çalıştırılacağı) için bkz.
[Exec approvals — advanced](/tr/tools/exec-approvals-advanced).

## Control UI düzenleme

Varsayılanları, aracı başına geçersiz kılmaları ve izin listelerini düzenlemek için **Control UI → Nodes → Exec approvals** kartını kullanın. Bir kapsam seçin (Varsayılanlar veya bir aracı), politikayı ayarlayın, izin listesi desenleri ekleyin/kaldırın, sonra **Kaydet** seçeneğini kullanın. UI, listeyi düzenli tutabilmeniz için desen başına son kullanım meta verilerini gösterir.

Hedef seçici **Gateway**'i (yerel onaylar) veya bir **Node**'u seçer.
Node'lar `system.execApprovals.get/set` ilan etmelidir (macOS uygulaması veya başsız node ana makinesi). Bir node henüz yürütme onaylarını ilan etmiyorsa, yerel `~/.openclaw/exec-approvals.json` dosyasını doğrudan düzenleyin.

CLI: `openclaw approvals`, gateway veya node düzenlemeyi destekler — bkz.
[Approvals CLI](/tr/cli/approvals).

## Onay akışı

Bir istem gerektiğinde gateway, operatör istemcilerine
`exec.approval.requested` yayını yapar. Control UI ve macOS uygulaması bunu `exec.approval.resolve` ile çözer, ardından gateway onaylanan isteği node ana makinesine iletir.

`host=node` için onay istekleri kanonik bir `systemRunPlan`
yükü içerir. Gateway, onaylanan `system.run`
isteklerini iletirken bu planı yetkili komut/cwd/oturum bağlamı olarak kullanır.

Bu, eşzamansız onay gecikmesi için önemlidir:

- Node yürütme yolu baştan tek bir kanonik plan hazırlar.
- Onay kaydı bu planı ve bağlama meta verilerini depolar.
- Onaylandıktan sonra iletilen son `system.run` çağrısı, daha sonraki çağıran düzenlemelerine güvenmek yerine depolanan planı yeniden kullanır.
- Çağıran, onay isteği oluşturulduktan sonra `command`, `rawCommand`, `cwd`, `agentId` veya `sessionKey` değerlerini değiştirirse gateway iletilen çalıştırmayı onay uyuşmazlığı olarak reddeder.

## Sistem olayları

Yürütme yaşam döngüsü sistem iletileri olarak gösterilir:

- `Exec running` (yalnızca komut çalışma bildirimi eşiğini aşarsa).
- `Exec finished`.
- `Exec denied`.

Bunlar, node olayı bildirdikten sonra aracının oturumuna gönderilir.
Gateway ana makinesi yürütme onayları da komut bittiğinde aynı
yaşam döngüsü olaylarını yayar (ve isteğe bağlı olarak eşikten daha uzun süre çalıştığında).
Onay geçitli yürütmeler, kolay ilişkilendirme için bu iletilerde `runId` olarak onay kimliğini yeniden kullanır.

## Reddedilen onay davranışı

Eşzamansız bir yürütme onayı reddedildiğinde OpenClaw, aracının oturumda aynı komutun daha önceki bir çalıştırmasından gelen çıktıyı yeniden kullanmasını engeller. Red nedeni, komut çıktısının mevcut olmadığına dair açık yönlendirmeyle birlikte iletilir; bu da aracının yeni çıktı varmış gibi iddia etmesini veya daha önceki başarılı bir çalıştırmadan kalan eski sonuçlarla reddedilen komutu tekrarlamasını engeller.

## Sonuçlar

- **`full`** güçlüdür; mümkün olduğunda izin listelerini tercih edin.
- **`ask`** hızlı onaylara izin verirken sizi döngüde tutar.
- Aracı başına izin listeleri, bir aracının onaylarının diğerlerine sızmasını önler.
- Onaylar yalnızca **yetkili göndericilerden** gelen ana makine yürütme isteklerine uygulanır. Yetkisiz göndericiler `/exec` veremez.
- `/exec security=full`, yetkili operatörler için oturum düzeyinde bir kolaylıktır ve tasarım gereği onayları atlar. Ana makine yürütmesini kesin olarak engellemek için onay güvenliğini `deny` olarak ayarlayın veya araç politikasıyla `exec` aracını reddedin.

## İlgili

<CardGroup cols={2}>
  <Card title="Exec approvals — advanced" href="/tr/tools/exec-approvals-advanced" icon="gear">
    Güvenli ikili dosyalar, yorumlayıcı bağlama ve onayın sohbete iletilmesi.
  </Card>
  <Card title="Exec aracı" href="/tr/tools/exec" icon="terminal">
    Kabuk komutu yürütme aracı.
  </Card>
  <Card title="Yükseltilmiş mod" href="/tr/tools/elevated" icon="shield-exclamation">
    Onayları da atlayan acil durum yolu.
  </Card>
  <Card title="Sandboxing" href="/tr/gateway/sandboxing" icon="box">
    Sandbox modları ve çalışma alanı erişimi.
  </Card>
  <Card title="Güvenlik" href="/tr/gateway/security" icon="lock">
    Güvenlik modeli ve sağlamlaştırma.
  </Card>
  <Card title="Sandbox ve araç politikası ve elevated" href="/tr/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Her denetime ne zaman başvurulmalı.
  </Card>
  <Card title="Skills" href="/tr/tools/skills" icon="sparkles">
    Skill destekli otomatik izin verme davranışı.
  </Card>
</CardGroup>

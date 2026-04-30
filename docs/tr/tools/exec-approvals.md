---
read_when:
    - exec onaylarını veya izin listelerini yapılandırma
    - macOS uygulamasında exec onayı kullanıcı deneyimini uygulama
    - Sandbox kaçışı istemlerini ve bunların etkilerini inceleme
sidebarTitle: Exec approvals
summary: 'Host exec onayları: politika ayarları, izin listeleri ve YOLO/katı iş akışı'
title: Yürütme onayları
x-i18n:
    generated_at: "2026-04-30T09:48:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71c16d0e547c4dd42a351d37e37e97b681a062cd496d5e0cba923b54c8f5b0e9
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec onayları, korumalı alandaki bir ajanın gerçek bir ana makinede (`gateway` veya `node`) komut çalıştırmasına izin vermek için kullanılan **yardımcı uygulama / node ana makine güvenlik bariyeri**dir. Bir güvenlik kilidi: Komutlara yalnızca ilke + izin listesi + (isteğe bağlı) kullanıcı onayı birlikte kabul ettiğinde izin verilir. Exec onayları, araç ilkesinin ve yükseltilmiş kapının **üzerine eklenir** (`elevated` değeri onayları atlayan `full` olarak ayarlanmadığı sürece).

<Note>
Geçerli ilke, `tools.exec.*` ve onay varsayılanlarından **daha katı** olanıdır; bir onay alanı atlanırsa `tools.exec` değeri kullanılır. Ana makine exec işlemi ayrıca o makinedeki yerel onay durumunu da kullanır — `~/.openclaw/exec-approvals.json` içindeki ana makineye yerel `ask: "always"`, oturum veya yapılandırma varsayılanları `ask: "on-miss"` istese bile sormaya devam eder.
</Note>

## Geçerli ilkeyi inceleme

| Komut                                                            | Ne gösterir                                                                            |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | İstenen ilke, ana makine ilke kaynakları ve geçerli sonuç.                             |
| `openclaw exec-policy show`                                      | Yerel makinede birleştirilmiş görünüm.                                                 |
| `openclaw exec-policy set` / `preset`                            | Yerel istenen ilkeyi yerel ana makine onayları dosyasıyla tek adımda eşitler.          |

Yerel bir kapsam `host=node` istediğinde, `exec-policy show` bu kapsamı, yerel onaylar dosyasını doğruluk kaynağı gibi göstermek yerine çalışma zamanında node tarafından yönetiliyor olarak bildirir.

Yardımcı uygulama kullanıcı arayüzü **kullanılabilir değilse**, normalde istem gösterecek her istek **ask fallback** ile çözümlenir (varsayılan: `deny`).

<Tip>
Yerel sohbet onay istemcileri, bekleyen onay mesajında kanala özgü olanakları önceden yerleştirebilir. Örneğin Matrix, mesajda yedek olarak `/approve ...` komutlarını bırakmaya devam ederken tepki kısayollarını yerleştirir (`✅` bir kez izin ver, `❌` reddet, `♾️` her zaman izin ver).
</Tip>

## Nerede uygulanır

Exec onayları yürütme ana makinesinde yerel olarak uygulanır:

- **Gateway ana makinesi** → Gateway makinesindeki `openclaw` süreci.
- **Node ana makinesi** → node çalıştırıcısı (macOS yardımcı uygulaması veya başsız node ana makinesi).

### Güven modeli

- Gateway kimliği doğrulanmış çağıranlar, o Gateway için güvenilen operatörlerdir.
- Eşleştirilmiş node'lar, bu güvenilen operatör yeteneğini node ana makinesine genişletir.
- Exec onayları kazara yürütme riskini azaltır, ancak kullanıcı başına bir kimlik doğrulama sınırı **değildir**.
- Onaylanmış node ana makine çalıştırmaları kanonik yürütme bağlamını bağlar: kanonik cwd, tam argv, mevcut olduğunda env bağlaması ve uygulanabildiğinde sabitlenmiş yürütülebilir dosya yolu.
- Kabuk betikleri ve doğrudan yorumlayıcı/çalışma zamanı dosyası çağrıları için OpenClaw ayrıca tek bir somut yerel dosya işlenenini bağlamaya çalışır. Bu bağlı dosya onaydan sonra ancak yürütmeden önce değişirse, değişmiş içeriği yürütmek yerine çalışma reddedilir.
- Dosya bağlama bilinçli olarak en iyi çaba yaklaşımıdır, her yorumlayıcı/çalışma zamanı yükleyici yolunun eksiksiz bir anlamsal modeli **değildir**. Onay modu bağlanacak tam olarak bir somut yerel dosyayı belirleyemezse, tam kapsama varmış gibi davranmak yerine onay destekli bir çalışma üretmeyi reddeder.

### macOS ayrımı

- **Node ana makine hizmeti**, `system.run` çağrısını yerel IPC üzerinden **macOS uygulamasına** iletir.
- **macOS uygulaması** onayları uygular ve komutu kullanıcı arayüzü bağlamında yürütür.

## Ayarlar ve depolama

Onaylar, yürütme ana makinesindeki yerel bir JSON dosyasında bulunur:

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
          "source": "allow-always",
          "commandText": "rg -n TODO",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## İlke düğmeleri

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` — tüm ana makine exec isteklerini engelle.
  - `allowlist` — yalnızca izin listesindeki komutlara izin ver.
  - `full` — her şeye izin ver (yükseltilmişe eşdeğer).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` — asla sorma.
  - `on-miss` — yalnızca izin listesi eşleşmediğinde sor.
  - `always` — her komutta sor. `allow-always` kalıcı güveni, geçerli sorma modu `always` olduğunda istemleri **bastırmaz**.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  İstem gerektiğinde ancak hiçbir kullanıcı arayüzüne ulaşılamadığında çözüm.

- `deny` — engelle.
- `allowlist` — yalnızca izin listesi eşleşirse izin ver.
- `full` — izin ver.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  `true` olduğunda OpenClaw, yorumlayıcı ikilisi izin listesinde olsa bile satır içi kod değerlendirme biçimlerini yalnızca onayla çalışır kabul eder. Tek bir kararlı dosya işlenenine düzgün eşlenmeyen yorumlayıcı yükleyicileri için derinlemesine savunma sağlar.
</ParamField>

Katı modun yakaladığı örnekler:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Katı modda bu komutlar yine açık onay gerektirir ve `allow-always` bunlar için yeni izin listesi girdilerini otomatik olarak kalıcılaştırmaz.

## YOLO modu (onaysız)

Ana makine exec işleminin onay istemleri olmadan çalışmasını istiyorsanız **iki** ilke katmanını da açmalısınız — OpenClaw yapılandırmasındaki istenen exec ilkesi (`tools.exec.*`) **ve** `~/.openclaw/exec-approvals.json` içindeki ana makineye yerel onay ilkesi.

Açıkça sıkılaştırmadığınız sürece YOLO varsayılan ana makine davranışıdır:

| Katman                | YOLO ayarı                  |
| --------------------- | --------------------------- |
| `tools.exec.security` | `gateway`/`node` üzerinde `full` |
| `tools.exec.ask`      | `off`                       |
| Ana makine `askFallback` | `full`                    |

<Warning>
**Önemli ayrımlar:**

- `tools.exec.host=auto`, exec işleminin **nerede** çalışacağını seçer: varsa korumalı alan, yoksa gateway.
- YOLO, ana makine exec işleminin **nasıl** onaylanacağını seçer: `security=full` artı `ask=off`.
- YOLO modunda OpenClaw, yapılandırılmış ana makine exec ilkesinin üzerine ayrı bir sezgisel komut gizleme onay kapısı veya betik ön denetimi reddetme katmanı eklemez.
- `auto`, gateway yönlendirmesini korumalı alanlı bir oturumdan serbest bir geçersiz kılma yapmaz. `auto` içinden çağrı başına `host=node` isteğine izin verilir; `host=gateway` ise `auto` içinden yalnızca etkin bir korumalı alan çalışma zamanı yokken izinlidir. Kararlı bir otomatik olmayan varsayılan için `tools.exec.host` ayarlayın veya açıkça `/exec host=...` kullanın.

</Warning>

Kendi etkileşimsiz izin modlarını sunan CLI destekli sağlayıcılar bu ilkeyi izleyebilir. Claude CLI, OpenClaw'ın istenen exec ilkesi YOLO olduğunda `--permission-mode bypassPermissions` ekler. Bu backend davranışını `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` altında açık Claude argümanlarıyla geçersiz kılın — örneğin `--permission-mode default`, `acceptEdits` veya `bypassPermissions`.

Daha muhafazakar bir kurulum istiyorsanız katmanlardan birini tekrar `allowlist` / `on-miss` veya `deny` değerine sıkılaştırın.

### Kalıcı gateway ana makinesi "asla sorma" kurulumu

<Steps>
  <Step title="İstenen yapılandırma ilkesini ayarla">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Ana makine onayları dosyasını eşleştir">
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

Bu yerel kısayol ikisini de günceller:

- Yerel `tools.exec.host/security/ask`.
- Yerel `~/.openclaw/exec-approvals.json` varsayılanları.

Bu bilinçli olarak yalnızca yereldir. Gateway ana makinesi veya node ana makinesi onaylarını uzaktan değiştirmek için `openclaw approvals set --gateway` ya da `openclaw approvals set --node <id|name|ip>` kullanın.

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

- `openclaw exec-policy` node onaylarını eşitlemez.
- `openclaw exec-policy set --host node` reddedilir.
- Node exec onayları çalışma zamanında node'dan alınır, bu yüzden node hedefli güncellemeler `openclaw approvals --node ...` kullanmalıdır.

</Note>

### Yalnızca oturum kısayolu

- `/exec security=full ask=off` yalnızca geçerli oturumu değiştirir.
- `/elevated full`, o oturum için exec onaylarını da atlayan acil durum kısayoludur.

Ana makine onayları dosyası yapılandırmadan daha katı kalırsa, daha katı ana makine ilkesi yine kazanır.

## İzin listesi (ajan başına)

İzin listeleri **ajan başınadır**. Birden fazla ajan varsa macOS uygulamasında hangi ajanı düzenlediğinizi değiştirin. Kalıplar glob eşleşmeleridir.

Kalıplar çözümlenmiş ikili yol glob'ları veya yalın komut adı glob'ları olabilir. Yalın adlar yalnızca `PATH` üzerinden çağrılan komutlarla eşleşir; bu nedenle komut `rg` olduğunda `rg`, `/opt/homebrew/bin/rg` ile eşleşebilir, ancak `./rg` veya `/tmp/rg` ile **eşleşmez**. Belirli bir ikili konuma güvenmek istediğinizde bir yol glob'u kullanın.

Eski `agents.default` girdileri yükleme sırasında `agents.main` değerine taşınır. `echo ok && pwd` gibi kabuk zincirleri yine her üst düzey parçanın izin listesi kurallarını karşılamasını gerektirir.

Örnekler:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Her izin listesi girdisi şunları izler:

| Alan               | Anlam                            |
| ------------------ | -------------------------------- |
| `id`               | Kullanıcı arayüzü kimliği için kararlı UUID |
| `lastUsedAt`       | Son kullanım zaman damgası       |
| `lastUsedCommand`  | Eşleşen son komut                |
| `lastResolvedPath` | Son çözümlenen ikili yol         |

## Skill CLI'larına otomatik izin verme

**Skill CLI'larına otomatik izin ver** etkinleştirildiğinde, bilinen Skills tarafından başvurulan yürütülebilir dosyalar node'larda (macOS node veya başsız node ana makinesi) izin listesinde kabul edilir. Bu, Skill ikili dosya listesini almak için Gateway RPC üzerinden `skills.bins` kullanır. Katı manuel izin listeleri istiyorsanız bunu devre dışı bırakın.

<Warning>
- Bu, manuel yol izin listesi girdilerinden ayrı bir **örtük kolaylık izin listesidir**.
- Gateway ve node'un aynı güven sınırında olduğu güvenilir operatör ortamları için tasarlanmıştır.
- Katı açık güven gerekiyorsa `autoAllowSkills: false` değerini koruyun ve yalnızca manuel yol izin listesi girdilerini kullanın.

</Warning>

## Güvenli ikililer ve onay iletme

Güvenli ikililer (yalnızca stdin hızlı yolu), yorumlayıcı bağlama ayrıntıları ve onay istemlerinin Slack/Discord/Telegram'a nasıl iletileceği (veya yerel onay istemcileri olarak nasıl çalıştırılacağı) için [Exec onayları — gelişmiş](/tr/tools/exec-approvals-advanced) bölümüne bakın.

## Control UI düzenleme

Varsayılanları, ajan başına geçersiz kılmaları ve izin listelerini düzenlemek için **Control UI → Nodes → Exec approvals** kartını kullanın. Bir kapsam seçin (Varsayılanlar veya bir ajan), ilkeyi ayarlayın, izin listesi kalıpları ekleyin/kaldırın, ardından **Kaydet**. Kullanıcı arayüzü, listeyi düzenli tutabilmeniz için her kalıp başına son kullanım meta verilerini gösterir.

Hedef seçici **Gateway** (yerel onaylar) veya bir **Node** seçer.
Node'lar `system.execApprovals.get/set` desteğini duyurmalıdır (macOS uygulaması veya
başsız node ana makinesi). Bir node henüz exec onaylarını duyurmuyorsa,
yerel `~/.openclaw/exec-approvals.json` dosyasını doğrudan düzenleyin.

CLI: `openclaw approvals` gateway veya node düzenlemeyi destekler — bkz.
[Approvals CLI](/tr/cli/approvals).

## Onay akışı

Bir istem gerektiğinde gateway, operatör istemcilerine
`exec.approval.requested` yayınlar. Control UI ve macOS
uygulaması bunu `exec.approval.resolve` ile çözer, ardından gateway onaylanan
isteği node ana makinesine iletir.

`host=node` için onay istekleri standart bir `systemRunPlan`
yükü içerir. Gateway, onaylanan `system.run`
isteklerini iletirken bu planı yetkili komut/cwd/oturum bağlamı olarak kullanır.

Bu, zaman uyumsuz onay gecikmesi için önemlidir:

- Node exec yolu baştan tek bir standart plan hazırlar.
- Onay kaydı bu planı ve bağlama meta verilerini saklar.
- Onaylandıktan sonra, son iletilen `system.run` çağrısı daha sonraki çağıran düzenlemelerine güvenmek yerine saklanan planı yeniden kullanır.
- Çağıran, onay isteği oluşturulduktan sonra `command`, `rawCommand`, `cwd`, `agentId` veya `sessionKey` değerini değiştirirse gateway iletilen çalıştırmayı onay uyuşmazlığı olarak reddeder.

## Sistem olayları

Exec yaşam döngüsü sistem mesajları olarak gösterilir:

- `Exec running` (yalnızca komut, çalışıyor bildirimi eşiğini aşarsa).
- `Exec finished`.
- `Exec denied`.

Bunlar, node olayı bildirdikten sonra ajanın oturumuna gönderilir.
Gateway ana makineli exec onayları, komut tamamlandığında (ve isteğe bağlı olarak eşikten uzun çalıştığında)
aynı yaşam döngüsü olaylarını yayar.
Onay kapılı exec'ler, kolay ilişkilendirme için bu
mesajlarda onay kimliğini `runId` olarak yeniden kullanır.

## Reddedilen onay davranışı

Zaman uyumsuz bir exec onayı reddedildiğinde OpenClaw, ajanın
oturumdaki aynı komutun önceki herhangi bir çalıştırmasından gelen çıktıyı yeniden
kullanmasını engeller.
Reddetme nedeni, kullanılabilir komut çıktısı olmadığına dair açık yönlendirmeyle birlikte iletilir; bu da ajanın yeni çıktı olduğunu iddia etmesini veya
daha önce başarılı olmuş bir çalıştırmadan kalan eski sonuçlarla reddedilen komutu
tekrarlamasını durdurur.

## Sonuçlar

- **`full`** güçlüdür; mümkün olduğunda izin listelerini tercih edin.
- **`ask`** hızlı onaylara hâlâ izin verirken sizi sürecin içinde tutar.
- Ajan başına izin listeleri, bir ajanın onaylarının başkalarına sızmasını önler.
- Onaylar yalnızca **yetkili gönderenlerden** gelen ana makine exec isteklerine uygulanır. Yetkisiz gönderenler `/exec` veremez.
- `/exec security=full`, yetkili operatörler için oturum düzeyinde bir kolaylıktır ve tasarım gereği onayları atlar. Ana makine exec'i kesin olarak engellemek için onay güvenliğini `deny` olarak ayarlayın veya araç ilkesi üzerinden `exec` aracını reddedin.

## İlgili

<CardGroup cols={2}>
  <Card title="Gelişmiş exec onayları" href="/tr/tools/exec-approvals-advanced" icon="gear">
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
  <Card title="Sandbox ile araç ilkesi ile yükseltilmiş mod karşılaştırması" href="/tr/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Her bir denetimin ne zaman kullanılacağı.
  </Card>
  <Card title="Skills" href="/tr/tools/skills" icon="sparkles">
    Skill destekli otomatik izin verme davranışı.
  </Card>
</CardGroup>

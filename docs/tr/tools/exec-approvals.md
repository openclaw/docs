---
read_when:
    - exec onaylarını veya izin listelerini yapılandırma
    - macOS uygulamasında yürütme onayı kullanıcı deneyimini uygulama
    - Korumalı alandan kaçış istemlerini ve bunların etkilerini inceleme
sidebarTitle: Exec approvals
summary: 'Ana makinede yürütme onayları: politika ayarları, izin listeleri ve YOLO/katı iş akışı'
title: Yürütme onayları
x-i18n:
    generated_at: "2026-05-11T20:37:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2966a6f4633046941a9ef3267bad10f3a153956361b9f088fb3e29fcd3fcb99d
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec onayları, sandbox uygulanmış bir agent'ın gerçek bir ana makinede (`gateway` veya `node`) komut çalıştırmasına izin vermek için kullanılan **yardımcı uygulama / node ana makinesi güvenlik bariyeridir**. Bir güvenlik kilidi: komutlara yalnızca ilke + izin listesi + (isteğe bağlı) kullanıcı onayı aynı fikirde olduğunda izin verilir. Exec onayları, araç ilkesinin ve yükseltilmiş geçiş denetiminin **üzerine** eklenir (`elevated` `full` olarak ayarlanmadığı sürece; bu durumda onaylar atlanır).

<Note>
Etkin ilke, `tools.exec.*` ve onay varsayılanlarının **daha katı** olanıdır; bir onay alanı atlanırsa `tools.exec` değeri kullanılır. Ana makine exec'i ayrıca o makinedeki yerel onay durumunu kullanır - `~/.openclaw/exec-approvals.json` içindeki ana makineye yerel `ask: "always"`, oturum veya yapılandırma varsayılanları `ask: "on-miss"` istese bile sormaya devam eder.
</Note>

## Etkin ilkeyi inceleme

| Komut                                                            | Ne gösterir                                                                           |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | İstenen ilke, ana makine ilke kaynakları ve etkin sonuç.                              |
| `openclaw exec-policy show`                                      | Yerel makinenin birleştirilmiş görünümü.                                              |
| `openclaw exec-policy set` / `preset`                            | Yerel istenen ilkeyi yerel ana makine onayları dosyasıyla tek adımda eşitler.         |

Yerel bir kapsam `host=node` istediğinde, `exec-policy show` bu kapsamı yerel onaylar dosyasını doğruluk kaynağıymış gibi göstermek yerine çalışma zamanında node tarafından yönetiliyor olarak bildirir.

Yardımcı uygulama UI'ı **kullanılamıyorsa**, normalde istem gösterecek her istek **ask fallback** ile çözümlenir (varsayılan: `deny`).

<Tip>
Yerel sohbet onay istemcileri, bekleyen onay iletisinde kanala özgü kolaylıkları önceden yerleştirebilir. Örneğin Matrix, iletide yedek olarak `/approve ...` komutlarını bırakmaya devam ederken tepki kısayollarını (`✅` bir kez izin ver, `❌` reddet, `♾️` her zaman izin ver) önceden yerleştirir.
</Tip>

## Nerede uygulanır

Exec onayları yürütme ana makinesinde yerel olarak uygulanır:

- **Gateway ana makinesi** → Gateway makinesindeki `openclaw` işlemi.
- **Node ana makinesi** → node çalıştırıcısı (macOS yardımcı uygulaması veya başsız node ana makinesi).

### Güven modeli

- Gateway ile kimliği doğrulanmış çağıranlar, o Gateway için güvenilir operatörlerdir.
- Eşleştirilmiş node'lar, bu güvenilir operatör yeteneğini node ana makinesine taşır.
- Exec onayları yanlışlıkla yürütme riskini azaltır, ancak **kullanıcı başına bir kimlik doğrulama sınırı veya dosya sistemi salt okunur ilkesi değildir**.
- Onaylandıktan sonra bir komut, seçilen ana makine veya sandbox dosya sistemi izinlerine göre dosyaları değiştirebilir.
- Onaylanmış node ana makinesi çalıştırmaları kanonik yürütme bağlamını bağlar: kanonik cwd, tam argv, varsa env bağlaması ve uygulanabildiğinde sabitlenmiş yürütülebilir dosya yolu.
- Kabuk betikleri ve doğrudan yorumlayıcı/çalışma zamanı dosya çağrıları için OpenClaw ayrıca somut bir yerel dosya işlenenini bağlamaya çalışır. Bu bağlı dosya onaydan sonra ancak yürütmeden önce değişirse, çalışma sapmış içeriği yürütmek yerine reddedilir.
- Dosya bağlama bilinçli olarak en iyi çaba düzeyindedir; her yorumlayıcı/çalışma zamanı yükleyici yolunun **tam** anlamsal modeli değildir. Onay modu bağlanacak tam olarak bir somut yerel dosyayı belirleyemezse, tam kapsama sahipmiş gibi davranmak yerine onay destekli bir çalışma üretmeyi reddeder.

### macOS ayrımı

- **node ana makine hizmeti**, `system.run` çağrılarını yerel IPC üzerinden **macOS uygulamasına** iletir.
- **macOS uygulaması** onayları uygular ve komutu UI bağlamında yürütür.

## Ayarlar ve depolama

Onaylar yürütme ana makinesindeki yerel bir JSON dosyasında bulunur:

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
  - `deny` - tüm ana makine exec isteklerini engelle.
  - `allowlist` - yalnızca izin listesindeki komutlara izin ver.
  - `full` - her şeye izin ver (yükseltilmiş ile eşdeğer).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - hiçbir zaman istem gösterme.
  - `on-miss` - yalnızca izin listesi eşleşmediğinde istem göster.
  - `always` - her komutta istem göster. Etkin ask modu `always` olduğunda `allow-always` kalıcı güveni istemleri **bastırmaz**.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  İstem gerekli olduğunda ancak hiçbir UI'a ulaşılamadığında çözüm.

- `deny` - engelle.
- `allowlist` - yalnızca izin listesi eşleşirse izin ver.
- `full` - izin ver.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  `true` olduğunda OpenClaw, yorumlayıcı ikilisi izin listesinde olsa bile satır içi kod değerlendirme biçimlerini yalnızca onayla çalışır kabul eder. Tek bir kararlı dosya işlenenine temiz biçimde eşlenmeyen yorumlayıcı yükleyiciler için derinlemesine savunma sağlar.
</ParamField>

Katı modun yakaladığı örnekler:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Katı modda bu komutlar yine de açık onay gerektirir ve `allow-always` onlar için yeni izin listesi girdilerini otomatik olarak kalıcı hale getirmez.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Yalnızca exec onay istemlerindeki sunumu denetler. Etkinleştirildiğinde OpenClaw, Web onay istemlerinin komut belirteçlerini vurgulayabilmesi için ayrıştırıcıdan türetilmiş komut aralıkları ekleyebilir. Komut metni vurgulamayı etkinleştirmek için bunu `true` olarak ayarlayın.
</ParamField>

Bu ayar `security`, `ask`, izin listesi eşleşmesini, katı satır içi değerlendirme davranışını, onay iletmeyi veya komut yürütmeyi **değiştirmez**. Genel olarak `tools.exec.commandHighlighting` altında veya agent başına `agents.list[].tools.exec.commandHighlighting` altında ayarlanabilir.

## YOLO modu (onaysız)

Ana makine exec'inin onay istemleri olmadan çalışmasını istiyorsanız **her iki** ilke katmanını da açmanız gerekir - OpenClaw yapılandırmasındaki istenen exec ilkesi (`tools.exec.*`) **ve** `~/.openclaw/exec-approvals.json` içindeki ana makineye yerel onaylar ilkesi.

Açıkça sıkılaştırmadığınız sürece YOLO varsayılan ana makine davranışıdır:

| Katman                | YOLO ayarı                 |
| --------------------- | -------------------------- |
| `tools.exec.security` | `gateway`/`node` üzerinde `full` |
| `tools.exec.ask`      | `off`                      |
| Ana makine `askFallback` | `full`                  |

<Warning>
**Önemli ayrımlar:**

- `tools.exec.host=auto`, exec'in **nerede** çalışacağını seçer: varsa sandbox, aksi halde Gateway.
- YOLO, ana makine exec'inin **nasıl** onaylanacağını seçer: `security=full` artı `ask=off`.
- YOLO modunda OpenClaw, yapılandırılmış ana makine exec ilkesinin üzerine ayrı bir sezgisel komut gizleme onay kapısı veya betik ön kontrol reddi katmanı eklemez.
- `auto`, Gateway yönlendirmesini sandbox uygulanmış bir oturumdan serbest bir geçersiz kılma haline getirmez. `auto` içinden çağrı başına `host=node` isteğine izin verilir; `host=gateway` yalnızca etkin bir sandbox çalışma zamanı yokken `auto` içinden izinlidir. Kararlı bir otomatik olmayan varsayılan için `tools.exec.host` ayarlayın veya açıkça `/exec host=...` kullanın.

</Warning>

Kendi etkileşimsiz izin modlarını sunan CLI destekli sağlayıcılar bu ilkeyi izleyebilir. Claude CLI, OpenClaw'ın istenen exec ilkesi YOLO olduğunda `--permission-mode bypassPermissions` ekler. Bu backend davranışını `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` altında açık Claude argümanlarıyla geçersiz kılın - örneğin `--permission-mode default`, `acceptEdits` veya `bypassPermissions`.

Daha muhafazakar bir kurulum istiyorsanız katmanlardan birini tekrar `allowlist` / `on-miss` veya `deny` olarak sıkılaştırın.

### Kalıcı Gateway ana makinesi "asla istem gösterme" kurulumu

<Steps>
  <Step title="İstenen yapılandırma ilkesini ayarlayın">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Ana makine onayları dosyasını eşleştirin">
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

Bilerek yalnızca yereldir. Gateway ana makinesi veya node ana makinesi onaylarını uzaktan değiştirmek için `openclaw approvals set --gateway` veya `openclaw approvals set --node <id|name|ip>` kullanın.

### Node ana makinesi

Bir node ana makinesi için aynı onaylar dosyasını bunun yerine o node üzerinde uygulayın:

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
- Node exec onayları çalışma zamanında node'dan alınır, bu nedenle node hedefli güncellemeler `openclaw approvals --node ...` kullanmalıdır.

</Note>

### Yalnızca oturum kısayolu

- `/exec security=full ask=off` yalnızca geçerli oturumu değiştirir.
- `/elevated full`, o oturum için exec onaylarını da atlayan bir acil durum kısayoludur.

Ana makine onayları dosyası yapılandırmadan daha katı kalırsa, daha katı ana makine ilkesi yine kazanır.

## İzin listesi (agent başına)

İzin listeleri **agent başınadır**. Birden çok agent varsa, macOS uygulamasında hangi agent'ı düzenlediğinizi değiştirin. Kalıplar glob eşleşmeleridir.

Kalıplar çözümlenmiş ikili yol glob'ları veya yalın komut adı glob'ları olabilir. Yalın adlar yalnızca `PATH` üzerinden çağrılan komutlarla eşleşir; bu nedenle komut `rg` olduğunda `rg`, `/opt/homebrew/bin/rg` ile eşleşebilir, ancak `./rg` veya `/tmp/rg` ile **eşleşmez**. Belirli bir ikili konuma güvenmek istediğinizde bir yol glob'u kullanın.

Eski `agents.default` girdileri yüklemede `agents.main` öğesine taşınır. `echo ok && pwd` gibi kabuk zincirleri yine de her üst düzey segmentin izin listesi kurallarını karşılamasını gerektirir.

Örnekler:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### argPattern ile argümanları kısıtlama

Bir izin listesi girdisi bir ikiliyle ve belirli bir argüman şekliyle eşleşmeliyse `argPattern` ekleyin. OpenClaw, düzenli ifadeyi yürütülebilir dosya belirtecini (`argv[0]`) hariç tutarak ayrıştırılmış komut argümanlarına karşı değerlendirir. Elle yazılmış girdiler için argümanlar tek bir boşlukla birleştirilir; bu nedenle tam eşleşme gerektiğinde kalıbı sabitleyin.

```json
{
  "version": 1,
  "agents": {
    "main": {
      "allowlist": [
        {
          "pattern": "python3",
          "argPattern": "^safe\\.py$"
        }
      ]
    }
  }
}
```

Bu girdi `python3 safe.py` komutuna izin verir; `python3 other.py` bir izin listesi ıskalamasıdır. Aynı ikili için yalnızca yol içeren bir girdi de varsa eşleşmeyen argümanlar yine o yalnızca yol girdisine geri dönebilir. Amaç ikiliyi bildirilen argümanlarla kısıtlamak olduğunda yalnızca yol girdisini atlayın.

Onay akışları tarafından kaydedilen girdiler, tam argv eşleşmesi için
dahili bir ayırıcı biçimi kullanabilir. Kodlanmış değeri elle düzenlemek
yerine bu girdileri yeniden oluşturmak için UI'ı veya onay akışını tercih
edin. OpenClaw bir komut segmenti için argv'yi ayrıştıramazsa,
`argPattern` içeren girdiler eşleşmez.

Her izin listesi girdisi şunları destekler:

| Alan               | Anlam                                                         |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Çözümlenmiş ikili yol glob'u veya çıplak komut adı glob'u     |
| `argPattern`       | İsteğe bağlı argv regex'i; atlanan girdiler yalnızca yol içindir |
| `id`               | UI kimliği için kullanılan kararlı UUID                       |
| `source`           | `allow-always` gibi girdi kaynağı                             |
| `commandText`      | Bir onay akışı girdiyi oluşturduğunda yakalanan komut metni   |
| `lastUsedAt`       | Son kullanım zaman damgası                                    |
| `lastUsedCommand`  | Eşleşen son komut                                             |
| `lastResolvedPath` | Son çözümlenen ikili yol                                      |

## Skill CLI'lerini otomatik olarak izin ver

**Skill CLI'lerini otomatik olarak izin ver** etkinleştirildiğinde,
bilinen Skills tarafından başvurulan yürütülebilir dosyalar Node'larda
(macOS Node'u veya başsız Node host'u) izin listesine alınmış kabul edilir.
Bu, skill ikili listesini almak için Gateway RPC üzerinden `skills.bins`
kullanır. Katı elle yönetilen izin listeleri istiyorsanız bunu devre dışı bırakın.

<Warning>
- Bu, elle eklenen yol izin listesi girdilerinden ayrı bir **örtük kolaylık izin listesidir**.
- Gateway ile Node'un aynı güven sınırı içinde olduğu güvenilen operatör ortamları için tasarlanmıştır.
- Katı açık güven gerekiyorsa `autoAllowSkills: false` değerini koruyun ve yalnızca elle eklenen yol izin listesi girdilerini kullanın.

</Warning>

## Güvenli ikililer ve onay yönlendirme

Güvenli ikililer (yalnızca stdin hızlı yolu), yorumlayıcı bağlama ayrıntıları
ve onay istemlerini Slack/Discord/Telegram'a nasıl yönlendireceğiniz (veya
bunları yerel onay istemcileri olarak nasıl çalıştıracağınız) için bkz.
[Exec onayları - gelişmiş](/tr/tools/exec-approvals-advanced).

## Kontrol UI düzenleme

Varsayılanları, ajan başına geçersiz kılmaları ve izin listelerini düzenlemek
için **Kontrol UI → Node'lar → Exec onayları** kartını kullanın. Bir kapsam
seçin (Varsayılanlar veya bir ajan), ilkeyi ayarlayın, izin listesi kalıpları
ekleyin/kaldırın, ardından **Kaydet**'i seçin. UI, listeyi düzenli tutabilmeniz
için kalıp başına son kullanım meta verilerini gösterir.

Hedef seçici **Gateway**'i (yerel onaylar) veya bir **Node**'u seçer.
Node'lar `system.execApprovals.get/set` duyurmalıdır (macOS uygulaması veya
başsız Node host'u). Bir Node henüz exec onaylarını duyurmuyorsa yerel
`~/.openclaw/exec-approvals.json` dosyasını doğrudan düzenleyin.

CLI: `openclaw approvals` Gateway veya Node düzenlemeyi destekler - bkz.
[Onaylar CLI](/tr/cli/approvals).

## Onay akışı

Bir istem gerektiğinde Gateway, operatör istemcilerine
`exec.approval.requested` yayınlar. Kontrol UI ve macOS uygulaması bunu
`exec.approval.resolve` ile çözer, ardından Gateway onaylanan isteği
Node host'una iletir.

`host=node` için onay istekleri kanonik bir `systemRunPlan` yükü içerir.
Gateway, onaylanmış `system.run` isteklerini iletirken bu planı yetkili
komut/cwd/oturum bağlamı olarak kullanır.

Bu, asenkron onay gecikmesi için önemlidir:

- Node exec yolu baştan tek bir kanonik plan hazırlar.
- Onay kaydı bu planı ve bağlama meta verilerini saklar.
- Onaylandıktan sonra, iletilen son `system.run` çağrısı daha sonraki çağıran düzenlemelerine güvenmek yerine saklanan planı yeniden kullanır.
- Çağıran, onay isteği oluşturulduktan sonra `command`, `rawCommand`, `cwd`, `agentId` veya `sessionKey` değerini değiştirirse Gateway iletilen çalıştırmayı onay uyuşmazlığı olarak reddeder.

## Sistem olayları

Exec yaşam döngüsü sistem mesajları olarak gösterilir:

- `Exec running` (yalnızca komut, çalışıyor bildirimi eşiğini aşarsa).
- `Exec finished`.
- `Exec denied`.

Bunlar, Node olayı bildirdikten sonra ajanın oturumuna gönderilir.
Gateway host'lu exec onayları, komut tamamlandığında (ve isteğe bağlı olarak
eşikten daha uzun süre çalıştığında) aynı yaşam döngüsü olaylarını yayar.
Onay geçitli exec'ler, kolay ilişkilendirme için bu mesajlarda onay kimliğini
`runId` olarak yeniden kullanır.

## Reddedilen onay davranışı

Bir asenkron exec onayı reddedildiğinde OpenClaw, ajanın oturumda aynı komutun
daha önceki herhangi bir çalıştırmasından gelen çıktıyı yeniden kullanmasını
engeller. Ret nedeni, komut çıktısının mevcut olmadığına dair açık yönlendirmeyle
iletilir; bu da ajanın yeni çıktı olduğunu iddia etmesini veya reddedilen komutu
önceki başarılı bir çalıştırmadan kalan eski sonuçlarla yinelemesini durdurur.

## Etkileri

- **`full`** güçlüdür; mümkün olduğunda izin listelerini tercih edin.
- **`ask`** hızlı onaylara hâlâ izin verirken sizi döngüde tutar.
- Ajan başına izin listeleri, bir ajanın onaylarının başkalarına sızmasını önler.
- Onaylar yalnızca **yetkili gönderenlerden** gelen host exec isteklerine uygulanır. Yetkisiz gönderenler `/exec` veremez.
- `/exec security=full`, yetkili operatörler için oturum düzeyinde bir kolaylıktır ve tasarım gereği onayları atlar. Host exec'i kesin olarak engellemek için onay güvenliğini `deny` olarak ayarlayın veya araç ilkesi üzerinden `exec` aracını reddedin.

## İlgili

<CardGroup cols={2}>
  <Card title="Exec onayları - gelişmiş" href="/tr/tools/exec-approvals-advanced" icon="gear">
    Güvenli ikililer, yorumlayıcı bağlama ve sohbete onay yönlendirme.
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
    Güvenlik modeli ve sertleştirme.
  </Card>
  <Card title="Sandbox ve araç ilkesi ve yükseltilmiş" href="/tr/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Her bir kontrole ne zaman başvurulacağı.
  </Card>
  <Card title="Skills" href="/tr/tools/skills" icon="sparkles">
    Skill destekli otomatik izin davranışı.
  </Card>
</CardGroup>

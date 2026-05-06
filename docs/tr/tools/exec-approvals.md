---
read_when:
    - exec onaylarını veya izin listelerini yapılandırma
    - macOS uygulamasında exec onayı kullanıcı deneyimini uygulama
    - Sandbox kaçışı istemlerini ve bunların etkilerini gözden geçirme
sidebarTitle: Exec approvals
summary: 'Ana makine exec onayları: ilke ayarları, izin listeleri ve YOLO/strict iş akışı'
title: Çalıştırma onayları
x-i18n:
    generated_at: "2026-05-06T09:34:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: c404fbc80624e31603cfc3f9ca6318534d53e0277af107600c726f97e11b223b
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec onayları, sandbox içindeki bir ajanın gerçek bir host üzerinde (`gateway` veya `node`) komut çalıştırmasına izin vermek için kullanılan **eşlikçi uygulama / node host güvenlik korkuluğudur**. Bir güvenlik kilidi: komutlara yalnızca policy + allowlist + (isteğe bağlı) kullanıcı onayı birlikte izin verdiğinde izin verilir. Exec onayları, tool policy ve elevated gating’in **üzerine** eklenir (`elevated`, onayları atlayan `full` olarak ayarlanmadığı sürece).

<Note>
Geçerli policy, `tools.exec.*` ve onay varsayılanlarının **daha katı** olanıdır; bir onay alanı atlanırsa `tools.exec` değeri kullanılır. Host exec ayrıca o makinedeki yerel onay durumunu kullanır - `~/.openclaw/exec-approvals.json` içindeki host-local `ask: "always"`, oturum veya config varsayılanları `ask: "on-miss"` istese bile sormaya devam eder.
</Note>

## Geçerli policy’yi inceleme

| Komut                                                            | Ne gösterir                                                                           |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | İstenen policy, host policy kaynakları ve geçerli sonucu.                              |
| `openclaw exec-policy show`                                      | Yerel makine birleştirilmiş görünümü.                                                  |
| `openclaw exec-policy set` / `preset`                            | Yerel istenen policy’yi yerel host onayları dosyasıyla tek adımda eşitler.             |

Yerel bir scope `host=node` istediğinde, `exec-policy show` bu scope’u yerel onay dosyasını doğruluğun kaynağı gibi göstermenin yerine runtime’da node tarafından yönetilen olarak raporlar.

Eşlikçi uygulama UI’ı **kullanılamıyorsa**, normalde prompt gösterecek herhangi bir istek **ask fallback** ile çözümlenir (varsayılan: `deny`).

<Tip>
Yerel sohbet onay istemcileri, bekleyen onay mesajına kanala özel olanaklar ekleyebilir. Örneğin Matrix, `/approve ...` komutlarını mesajda fallback olarak bırakmaya devam ederken tepki kısayolları ekler (`✅` bir kez izin ver, `❌` reddet, `♾️` her zaman izin ver).
</Tip>

## Nerede uygulanır

Exec onayları, yürütme host’u üzerinde yerel olarak zorlanır:

- **Gateway host’u** → gateway makinesindeki `openclaw` işlemi.
- **Node host’u** → node runner (macOS eşlikçi uygulaması veya headless node host).

### Güven modeli

- Gateway kimliği doğrulanmış çağıranlar, o Gateway için güvenilir operatörlerdir.
- Eşleştirilmiş node’lar bu güvenilir operatör yeteneğini node host’a genişletir.
- Exec onayları kazara yürütme riskini azaltır, ancak kullanıcı başına bir auth sınırı **değildir**.
- Onaylanmış node-host çalıştırmaları kanonik yürütme bağlamını bağlar: kanonik cwd, tam argv, varsa env binding ve uygulanabildiğinde sabitlenmiş executable path.
- Shell script’leri ve doğrudan interpreter/runtime dosya çağrıları için OpenClaw ayrıca somut bir yerel dosya operand’ını bağlamaya çalışır. Bu bağlı dosya onaydan sonra ama yürütmeden önce değişirse, kaymış içerik yürütülmek yerine çalıştırma reddedilir.
- Dosya bağlama bilinçli olarak best-effort’tur, her interpreter/runtime loader path’inin eksiksiz bir semantik modeli **değildir**. Onay modu bağlamak için tam olarak bir somut yerel dosya belirleyemezse, tam kapsama varmış gibi davranmak yerine onay destekli çalıştırma üretmeyi reddeder.

### macOS ayrımı

- **node host service**, `system.run` çağrısını yerel IPC üzerinden **macOS uygulamasına** iletir.
- **macOS uygulaması** onayları uygular ve komutu UI bağlamında yürütür.

## Ayarlar ve depolama

Onaylar yürütme host’undaki yerel bir JSON dosyasında yaşar:

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

## Policy düğmeleri

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - tüm host exec isteklerini engeller.
  - `allowlist` - yalnızca allowlist’e alınmış komutlara izin verir.
  - `full` - her şeye izin verir (elevated ile eşdeğer).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - asla prompt gösterme.
  - `on-miss` - yalnızca allowlist eşleşmediğinde prompt göster.
  - `always` - her komutta prompt göster. Geçerli ask modu `always` olduğunda `allow-always` kalıcı güveni prompt’ları **bastırmaz**.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Prompt gerektiğinde ancak hiçbir UI erişilebilir olmadığında çözüm.

- `deny` - engelle.
- `allowlist` - yalnızca allowlist eşleşirse izin ver.
- `full` - izin ver.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  `true` olduğunda, OpenClaw interpreter binary’sinin kendisi allowlist’e alınmış olsa bile inline code-eval formlarını yalnızca onayla çalışır kabul eder. Tek bir kararlı dosya operand’ına temiz biçimde eşlenmeyen interpreter loader’ları için defense-in-depth.
</ParamField>

Strict mode’un yakaladığı örnekler:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Strict mode’da bu komutlar yine de açık onay gerektirir ve `allow-always` bunlar için otomatik olarak yeni allowlist girişleri kalıcılaştırmaz.

## YOLO modu (onaysız)

Host exec’in onay prompt’ları olmadan çalışmasını istiyorsanız **iki** policy katmanını da açmanız gerekir - OpenClaw config içindeki istenen exec policy (`tools.exec.*`) **ve** `~/.openclaw/exec-approvals.json` içindeki host-local onay policy’si.

YOLO, açıkça sıkılaştırmadığınız sürece varsayılan host davranışıdır:

| Katman                | YOLO ayarı                 |
| --------------------- | -------------------------- |
| `tools.exec.security` | `gateway`/`node` üzerinde `full` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**Önemli ayrımlar:**

- `tools.exec.host=auto`, exec’in **nerede** çalışacağını seçer: varsa sandbox, aksi halde gateway.
- YOLO, host exec’in **nasıl** onaylanacağını seçer: `security=full` artı `ask=off`.
- YOLO modunda OpenClaw, yapılandırılmış host exec policy’nin üzerine ayrı bir sezgisel komut gizleme onay kapısı veya script-preflight reddetme katmanı **eklemez**.
- `auto`, sandbox içindeki bir oturumdan gateway yönlendirmesini serbest bir override yapmaz. `auto` içinden çağrı başına `host=node` isteğine izin verilir; `host=gateway` ise `auto` içinden yalnızca etkin bir sandbox runtime yoksa izinlidir. Kararlı auto olmayan varsayılan için `tools.exec.host` ayarlayın veya açıkça `/exec host=...` kullanın.

</Warning>

Kendi noninteractive permission mode’unu açığa çıkaran CLI destekli sağlayıcılar bu policy’yi izleyebilir. Claude CLI, OpenClaw’ın istenen exec policy’si YOLO olduğunda `--permission-mode bypassPermissions` ekler. Bu backend davranışını `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` altında açık Claude argümanlarıyla override edin - örneğin `--permission-mode default`, `acceptEdits` veya `bypassPermissions`.

Daha muhafazakar bir kurulum istiyorsanız katmanlardan herhangi birini tekrar `allowlist` / `on-miss` veya `deny` seviyesine sıkılaştırın.

### Kalıcı gateway-host "asla prompt gösterme" kurulumu

<Steps>
  <Step title="İstenen config policy’sini ayarla">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Host onayları dosyasını eşleştir">
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

Bu bilinçli olarak yalnızca yereldir. Gateway-host veya node-host onaylarını uzaktan değiştirmek için `openclaw approvals set --gateway` veya `openclaw approvals set --node <id|name|ip>` kullanın.

### Node host

Bir node host için aynı onaylar dosyasını bunun yerine o node üzerinde uygulayın:

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
- Node exec onayları runtime’da node’dan alınır, bu nedenle node hedefli güncellemeler `openclaw approvals --node ...` kullanmalıdır.

</Note>

### Yalnızca oturum kısayolu

- `/exec security=full ask=off` yalnızca geçerli oturumu değiştirir.
- `/elevated full`, o oturum için exec onaylarını da atlayan bir break-glass kısayoludur.

Host onayları dosyası config’ten daha katı kalırsa daha katı host policy hâlâ kazanır.

## Allowlist (ajan başına)

Allowlist’ler **ajan başınadır**. Birden fazla ajan varsa macOS uygulamasında hangi ajanı düzenlediğinizi değiştirin. Pattern’ler glob eşleşmeleridir.

Pattern’ler çözümlenmiş binary path glob’ları veya yalın komut adı glob’ları olabilir. Yalın adlar yalnızca `PATH` üzerinden çağrılan komutlarla eşleşir; bu nedenle komut `rg` olduğunda `rg`, `/opt/homebrew/bin/rg` ile eşleşebilir, ancak `./rg` veya `/tmp/rg` ile **eşleşmez**. Belirli bir binary konumuna güvenmek istediğinizde path glob kullanın.

Eski `agents.default` girişleri yükleme sırasında `agents.main` konumuna geçirilir. `echo ok && pwd` gibi Shell zincirlerinde yine de her üst düzey segmentin allowlist kurallarını karşılaması gerekir.

Örnekler:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### argPattern ile argümanları kısıtlama

Bir allowlist girişi bir binary ve belirli bir argüman şekliyle eşleşmeliyse `argPattern` ekleyin. OpenClaw, regular expression’ı executable token (`argv[0]`) hariç tutularak ayrıştırılmış komut argümanlarına karşı değerlendirir. Elle yazılmış girişlerde argümanlar tek bir boşlukla birleştirilir, bu nedenle tam eşleşme gerektiğinde pattern’i anchor’layın.

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

Bu giriş `python3 safe.py` komutuna izin verir; `python3 other.py` bir allowlist miss olur. Aynı binary için yalnızca path içeren bir giriş de varsa, eşleşmeyen argümanlar yine de o yalnızca path içeren girişe fallback yapabilir. Amaç binary’yi bildirilen argümanlarla kısıtlamaksa yalnızca path içeren girişi atlayın.

Onay akışları tarafından kaydedilen girişler, tam argv eşleştirmesi için dahili bir separator formatı kullanabilir. Kodlanmış değeri elle düzenlemek yerine bu girişleri yeniden oluşturmak için UI’ı veya onay akışını tercih edin. OpenClaw bir komut segmenti için argv ayrıştıramazsa `argPattern` içeren girişler eşleşmez.

Her allowlist girişi şunları destekler:

| Alan               | Anlam                                                         |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Çözümlenmiş ikili dosya yolu glob’u veya yalın komut adı glob’u |
| `argPattern`       | İsteğe bağlı argv regex’i; atlanan girdiler yalnızca yoldur     |
| `id`               | UI kimliği için kullanılan kararlı UUID                        |
| `source`           | `allow-always` gibi girdi kaynağı                              |
| `commandText`      | Bir onay akışı girdiyi oluşturduğunda yakalanan komut metni    |
| `lastUsedAt`       | Son kullanılma zaman damgası                                   |
| `lastUsedCommand`  | Eşleşen son komut                                              |
| `lastResolvedPath` | Son çözümlenen ikili dosya yolu                                |

## Skill CLI’larını otomatik izinli yapma

**Skill CLI’larını otomatik izinli yapma** etkinleştirildiğinde, bilinen skills tarafından başvurulan çalıştırılabilir dosyalar node’larda (macOS node’u veya başsız node ana makinesi) izin listesine alınmış kabul edilir. Bu, skill bin listesini almak için Gateway RPC üzerinden `skills.bins` kullanır. Katı manuel izin listeleri istiyorsanız bunu devre dışı bırakın.

<Warning>
- Bu, manuel yol izin listesi girdilerinden ayrı bir **örtük kolaylık izin listesidir**.
- Gateway ve node’un aynı güven sınırı içinde olduğu güvenilir operatör ortamları için tasarlanmıştır.
- Katı açık güven gerekiyorsa `autoAllowSkills: false` değerini koruyun ve yalnızca manuel yol izin listesi girdilerini kullanın.

</Warning>

## Güvenli bin’ler ve onay yönlendirme

Güvenli bin’ler (yalnızca stdin hızlı yolu), yorumlayıcı bağlama ayrıntıları ve onay istemlerini Slack/Discord/Telegram’a nasıl yönlendireceğiniz (veya bunları yerel onay istemcileri olarak nasıl çalıştıracağınız) için bkz. [Exec approvals - advanced](/tr/tools/exec-approvals-advanced).

## Control UI düzenleme

Varsayılanları, ajan başına geçersiz kılmaları ve izin listelerini düzenlemek için **Control UI → Nodes → Exec approvals** kartını kullanın. Bir kapsam seçin (Varsayılanlar veya bir ajan), politikayı ayarlayın, izin listesi kalıpları ekleyip kaldırın, ardından **Kaydet**’e basın. UI, listeyi düzenli tutabilmeniz için kalıp başına son kullanım meta verilerini gösterir.

Hedef seçici **Gateway**’i (yerel onaylar) veya bir **Node**’u seçer. Node’lar `system.execApprovals.get/set` duyurusu yapmalıdır (macOS uygulaması veya başsız node ana makinesi). Bir node exec onaylarını henüz duyurmuyorsa yerel `~/.openclaw/exec-approvals.json` dosyasını doğrudan düzenleyin.

CLI: `openclaw approvals`, gateway veya node düzenlemeyi destekler - bkz. [Approvals CLI](/tr/cli/approvals).

## Onay akışı

Bir istem gerektiğinde gateway, operatör istemcilerine `exec.approval.requested` yayınlar. Control UI ve macOS uygulaması bunu `exec.approval.resolve` aracılığıyla çözer, ardından gateway onaylanan isteği node ana makinesine iletir.

`host=node` için onay istekleri kurallı bir `systemRunPlan` yükü içerir. Gateway, onaylanan `system.run` isteklerini iletirken bu planı yetkili komut/cwd/oturum bağlamı olarak kullanır.

Bu, asenkron onay gecikmesi için önemlidir:

- Node exec yolu, baştan tek bir kurallı plan hazırlar.
- Onay kaydı bu planı ve bağlama meta verilerini saklar.
- Onaylandıktan sonra, son iletilen `system.run` çağrısı daha sonraki çağıran düzenlemelerine güvenmek yerine saklanan planı yeniden kullanır.
- Çağıran, onay isteği oluşturulduktan sonra `command`, `rawCommand`, `cwd`, `agentId` veya `sessionKey` değerini değiştirirse gateway, iletilen çalıştırmayı onay uyuşmazlığı olarak reddeder.

## Sistem olayları

Exec yaşam döngüsü sistem mesajları olarak gösterilir:

- `Exec running` (yalnızca komut çalışıyor bildirimi eşiğini aşarsa).
- `Exec finished`.
- `Exec denied`.

Bunlar, node olayı bildirdikten sonra ajanın oturumuna gönderilir. Gateway ana makinesindeki exec onayları, komut tamamlandığında (ve isteğe bağlı olarak eşikten daha uzun süre çalıştığında) aynı yaşam döngüsü olaylarını yayar. Onay kapılı exec’ler, kolay korelasyon için bu mesajlarda onay kimliğini `runId` olarak yeniden kullanır.

## Reddedilen onay davranışı

Bir asenkron exec onayı reddedildiğinde OpenClaw, ajanın oturumdaki aynı komutun daha önceki herhangi bir çalıştırmasından gelen çıktıyı yeniden kullanmasını engeller. Red nedeni, hiçbir komut çıktısının kullanılamadığına dair açık yönlendirmeyle birlikte iletilir; bu da ajanın yeni çıktı olduğunu iddia etmesini veya reddedilen komutu önceki başarılı bir çalıştırmadan kalan eski sonuçlarla tekrarlamasını durdurur.

## Sonuçlar

- **`full`** güçlüdür; mümkün olduğunda izin listelerini tercih edin.
- **`ask`**, hızlı onaylara hâlâ izin verirken sizi döngünün içinde tutar.
- Ajan başına izin listeleri, bir ajanın onaylarının diğerlerine sızmasını önler.
- Onaylar yalnızca **yetkili gönderenlerden** gelen ana makine exec isteklerine uygulanır. Yetkisiz gönderenler `/exec` veremez.
- `/exec security=full`, yetkili operatörler için oturum düzeyinde bir kolaylıktır ve tasarım gereği onayları atlar. Ana makine exec’i katı biçimde engellemek için onay güvenliğini `deny` olarak ayarlayın veya araç politikası aracılığıyla `exec` aracını reddedin.

## İlgili

<CardGroup cols={2}>
  <Card title="Exec approvals - advanced" href="/tr/tools/exec-approvals-advanced" icon="gear">
    Güvenli bin’ler, yorumlayıcı bağlama ve sohbete onay yönlendirme.
  </Card>
  <Card title="Exec tool" href="/tr/tools/exec" icon="terminal">
    Kabuk komutu yürütme aracı.
  </Card>
  <Card title="Elevated mode" href="/tr/tools/elevated" icon="shield-exclamation">
    Onayları da atlayan acil durum yolu.
  </Card>
  <Card title="Sandboxing" href="/tr/gateway/sandboxing" icon="box">
    Sandbox modları ve çalışma alanı erişimi.
  </Card>
  <Card title="Security" href="/tr/gateway/security" icon="lock">
    Güvenlik modeli ve sağlamlaştırma.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/tr/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Her denetimin ne zaman kullanılacağı.
  </Card>
  <Card title="Skills" href="/tr/tools/skills" icon="sparkles">
    Skill destekli otomatik izin davranışı.
  </Card>
</CardGroup>

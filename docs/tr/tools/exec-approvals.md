---
read_when:
    - exec onaylarını veya izin listelerini yapılandırma
    - macOS uygulamasında exec onayı kullanıcı deneyimini uygulama
    - Sandbox kaçışı istemlerini ve bunların etkilerini inceleme
sidebarTitle: Exec approvals
summary: 'Ana makine yürütme onayları: politika ayarları, izin listeleri ve YOLO/katı iş akışı'
title: Komut çalıştırma onayları
x-i18n:
    generated_at: "2026-05-10T19:57:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8b1a9649161440bca445e318654b9a48a54ae1dbbca42349ac94b13ecc9fbfbd
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec onayları, korumalı alandaki bir aracının gerçek bir host üzerinde (`gateway` veya `node`) komut çalıştırmasına izin vermek için kullanılan **yardımcı uygulama / node host koruma sınırıdır**. Bir güvenlik kilidi: komutlara yalnızca policy + allowlist + (isteğe bağlı) kullanıcı onayı birlikte kabul ettiğinde izin verilir. Exec onayları, tool policy ve elevated gating **üzerine eklenir** (`elevated` `full` olarak ayarlanmışsa onaylar atlanır).

<Note>
Etkin policy, `tools.exec.*` ve onay varsayılanları arasındaki **daha katı** olandır; bir onay alanı atlanırsa `tools.exec` değeri kullanılır. Host exec ayrıca o makinedeki yerel onay durumunu kullanır - `~/.openclaw/exec-approvals.json` içinde hosta yerel bir `ask: "always"` ayarı, oturum veya config varsayılanları `ask: "on-miss"` istese bile sormaya devam eder.
</Note>

## Etkin policy'yi inceleme

| Komut                                                            | Ne gösterir                                                                            |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | İstenen policy, host policy kaynakları ve etkin sonuç.                                 |
| `openclaw exec-policy show`                                      | Yerel makinenin birleştirilmiş görünümü.                                               |
| `openclaw exec-policy set` / `preset`                            | Yerel istenen policy'yi yerel host onayları dosyasıyla tek adımda eşitler.             |

Yerel bir kapsam `host=node` istediğinde, `exec-policy show` bu kapsamı yerel onay dosyasını gerçeğin kaynağı gibi göstermek yerine çalışma zamanında node tarafından yönetiliyor olarak raporlar.

Yardımcı uygulama arayüzü **kullanılabilir değilse**, normalde istem gösterecek her istek **ask fallback** ile çözülür (varsayılan: `deny`).

<Tip>
Yerel chat onay istemcileri, bekleyen onay mesajına kanala özgü olanaklar ekleyebilir. Örneğin Matrix, `/approve ...` komutlarını mesajda yedek seçenek olarak bırakırken reaction kısayolları ekler (`✅` bir kez izin ver, `❌` reddet, `♾️` her zaman izin ver).
</Tip>

## Nerede uygulanır

Exec onayları yürütme hostunda yerel olarak zorunlu kılınır:

- **Gateway hostu** → gateway makinesindeki `openclaw` süreci.
- **Node hostu** → node çalıştırıcısı (macOS yardımcı uygulaması veya başsız node hostu).

### Güven modeli

- Gateway kimliği doğrulanmış çağırıcılar, o Gateway için güvenilen operatörlerdir.
- Eşleştirilmiş node'lar, bu güvenilen operatör yeteneğini node hostuna taşır.
- Exec onayları kazara yürütme riskini azaltır, ancak kullanıcı bazlı bir auth sınırı veya dosya sistemi salt okunur policy'si **değildir**.
- Onaylandıktan sonra bir komut, seçilen host veya korumalı alan dosya sistemi izinlerine göre dosyaları değiştirebilir.
- Onaylanmış node-host çalıştırmaları canonical yürütme bağlamını bağlar: canonical cwd, tam argv, varsa env binding ve uygulanabiliyorsa sabitlenmiş executable path.
- Shell scriptleri ve doğrudan interpreter/runtime dosya çağrıları için OpenClaw ayrıca somut bir yerel dosya operandı bağlamaya çalışır. Bu bağlı dosya onaydan sonra ama yürütmeden önce değişirse, değişmiş içeriği yürütmek yerine çalıştırma reddedilir.
- Dosya bağlama bilinçli olarak en iyi çabadır; her interpreter/runtime loader yolunun eksiksiz semantic modeli **değildir**. Onay modu bağlanacak tam olarak bir somut yerel dosyayı belirleyemezse, tam kapsama varmış gibi davranmak yerine onay destekli bir çalıştırma üretmeyi reddeder.

### macOS ayrımı

- **Node host servisi**, `system.run` çağrısını yerel IPC üzerinden **macOS uygulamasına** iletir.
- **macOS uygulaması** onayları zorunlu kılar ve komutu UI bağlamında yürütür.

## Ayarlar ve depolama

Onaylar yürütme hostundaki yerel bir JSON dosyasında bulunur:

```text
~/.openclaw/exec-approvals.json
```

Örnek schema:

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
  - `allowlist` - yalnızca allowlist'e alınmış komutlara izin verir.
  - `full` - her şeye izin verir (elevated ile eşdeğer).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - asla sormaz.
  - `on-miss` - yalnızca allowlist eşleşmediğinde sorar.
  - `always` - her komutta sorar. Etkin ask modu `always` olduğunda `allow-always` kalıcı güveni istemleri **bastırmaz**.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Bir istem gerektiğinde ancak hiçbir UI erişilebilir olmadığında çözüm.

- `deny` - engeller.
- `allowlist` - yalnızca allowlist eşleşirse izin verir.
- `full` - izin verir.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  `true` olduğunda OpenClaw, interpreter binary'sinin kendisi allowlist'te olsa bile inline code-eval biçimlerini yalnızca onayla çalıştırılabilir kabul eder. Tek bir kararlı dosya operandına temiz biçimde eşlenmeyen interpreter loader'ları için savunma derinliği sağlar.
</ParamField>

Strict modun yakaladığı örnekler:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Strict modda bu komutlar yine de açık onay gerektirir ve `allow-always` bunlar için yeni allowlist girdilerini otomatik olarak kalıcı hale getirmez.

## YOLO modu (onaysız)

Host exec'in onay istemleri olmadan çalışmasını istiyorsanız, **iki** policy katmanını da açmanız gerekir: OpenClaw config içindeki istenen exec policy (`tools.exec.*`) **ve** `~/.openclaw/exec-approvals.json` içindeki host-yerel onay policy'si.

YOLO, açıkça sıkılaştırmadığınız sürece varsayılan host davranışıdır:

| Katman                | YOLO ayarı                |
| --------------------- | ------------------------- |
| `tools.exec.security` | `gateway`/`node` üzerinde `full` |
| `tools.exec.ask`      | `off`                     |
| Host `askFallback`    | `full`                    |

<Warning>
**Önemli ayrımlar:**

- `tools.exec.host=auto`, exec'in **nerede** çalışacağını seçer: varsa korumalı alanda, yoksa gateway'de.
- YOLO, host exec'in **nasıl** onaylanacağını seçer: `security=full` ve `ask=off`.
- YOLO modunda OpenClaw, yapılandırılmış host exec policy'sinin üzerine ayrı bir heuristic command-obfuscation onay kapısı veya script-preflight red katmanı eklemez.
- `auto`, gateway yönlendirmesini korumalı alan oturumundan serbest bir override yapmaz. `auto` içinden çağrı bazında `host=node` isteğine izin verilir; `host=gateway` ise `auto` içinden yalnızca etkin bir korumalı alan runtime'ı yokken izinlidir. Kararlı, auto olmayan bir varsayılan için `tools.exec.host` ayarlayın veya açıkça `/exec host=...` kullanın.

</Warning>

Kendi noninteractive permission modunu sunan CLI destekli provider'lar bu policy'yi izleyebilir. Claude CLI, OpenClaw'ın istenen exec policy'si YOLO olduğunda `--permission-mode bypassPermissions` ekler. Bu backend davranışını `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` altında açık Claude argümanlarıyla override edin - örneğin `--permission-mode default`, `acceptEdits` veya `bypassPermissions`.

Daha korumacı bir kurulum istiyorsanız, katmanlardan birini yeniden `allowlist` / `on-miss` veya `deny` olarak sıkılaştırın.

### Kalıcı gateway-host "asla sorma" kurulumu

<Steps>
  <Step title="Set the requested config policy">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Match the host approvals file">
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

Bilinçli olarak yalnızca yereldir. Gateway-host veya node-host onaylarını uzaktan değiştirmek için `openclaw approvals set --gateway` veya `openclaw approvals set --node <id|name|ip>` kullanın.

### Node host

Bir node hostu için bunun yerine aynı onay dosyasını o node üzerinde uygulayın:

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
- `/elevated full`, o oturum için exec onaylarını da atlayan bir break-glass kısayoludur.

Host onayları dosyası config'ten daha katı kalırsa daha katı host policy yine kazanır.

## Allowlist (agent başına)

Allowlist'ler **agent başınadır**. Birden fazla agent varsa macOS uygulamasında düzenlediğiniz agent'ı değiştirin. Pattern'ler glob eşleşmeleridir.

Pattern'ler çözümlenmiş binary path glob'ları veya yalın command-name glob'ları olabilir. Yalın adlar yalnızca `PATH` üzerinden çağrılan komutlarla eşleşir; bu nedenle komut `rg` olduğunda `rg`, `/opt/homebrew/bin/rg` ile eşleşebilir, ancak `./rg` veya `/tmp/rg` ile **eşleşmez**. Belirli bir binary konumuna güvenmek istediğinizde path glob kullanın.

Eski `agents.default` girdileri yüklemede `agents.main` içine taşınır. `echo ok && pwd` gibi shell zincirlerinde yine de her üst seviye segmentin allowlist kurallarını karşılaması gerekir.

Örnekler:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Argümanları argPattern ile sınırlama

Bir allowlist girdisi bir binary ve belirli bir argüman şekliyle eşleşmeli olduğunda `argPattern` ekleyin. OpenClaw, regular expression'ı executable token (`argv[0]`) hariç tutarak ayrıştırılmış komut argümanlarına karşı değerlendirir. Elle yazılmış girdiler için argümanlar tek bir boşlukla birleştirilir; bu nedenle tam eşleşme gerektiğinde pattern'i anchor edin.

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

Bu girdi `python3 safe.py` komutuna izin verir; `python3 other.py` bir allowlist kaçırmasıdır. Aynı binary için yalnızca path içeren bir girdi de varsa, eşleşmeyen argümanlar yine de yalnızca path içeren o girdiye fallback yapabilir. Amaç binary'yi bildirilen argümanlarla sınırlamaksa yalnızca path içeren girdiyi atlayın.

Onay akışları tarafından kaydedilen girdiler, tam argv eşleşmesi için dahili bir separator biçimi kullanabilir. Encoded değeri elle düzenlemek yerine bu girdileri yeniden oluşturmak için UI veya onay akışını tercih edin. OpenClaw bir komut segmenti için argv ayrıştıramazsa `argPattern` içeren girdiler eşleşmez.

Her allowlist girdisi şunları destekler:

| Alan               | Anlam                                                         |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Çözümlenmiş ikili yol glob'u veya yalın komut adı glob'u      |
| `argPattern`       | İsteğe bağlı argv regex'i; atlanan girdiler yalnızca yoldur    |
| `id`               | UI kimliği için kullanılan kararlı UUID                       |
| `source`           | `allow-always` gibi girdi kaynağı                             |
| `commandText`      | Bir onay akışı girdiyi oluşturduğunda yakalanan komut metni   |
| `lastUsedAt`       | Son kullanım zaman damgası                                    |
| `lastUsedCommand`  | Eşleşen son komut                                             |
| `lastResolvedPath` | Son çözümlenen ikili yol                                      |

## Skill CLI'larını otomatik izinli yapma

**Skill CLI'larını otomatik izinli yapma** etkinleştirildiğinde, bilinen
skills tarafından başvurulan çalıştırılabilir dosyalar Node'larda (macOS
Node'u veya başsız Node host'u) izin listesinde kabul edilir. Bu, skill
ikili dosya listesini almak için Gateway RPC üzerinden `skills.bins`
kullanır. Katı manuel izin listeleri istiyorsanız bunu devre dışı bırakın.

<Warning>
- Bu, manuel yol izin listesi girdilerinden ayrı bir **örtük kolaylık izin listesidir**.
- Gateway ile Node'un aynı güven sınırı içinde olduğu güvenilir operatör ortamları için tasarlanmıştır.
- Katı açık güven gerektiriyorsanız `autoAllowSkills: false` değerini koruyun ve yalnızca manuel yol izin listesi girdilerini kullanın.

</Warning>

## Güvenli ikililer ve onay yönlendirme

Güvenli ikililer (yalnızca stdin hızlı yolu), yorumlayıcı bağlama ayrıntıları ve
onay istemlerini Slack/Discord/Telegram'a nasıl yönlendireceğiniz (veya bunları
yerel onay istemcileri olarak nasıl çalıştıracağınız) için
[Exec onayları - gelişmiş](/tr/tools/exec-approvals-advanced) sayfasına bakın.

## Denetim UI düzenlemesi

Varsayılanları, ajan başına geçersiz kılmaları ve izin listelerini düzenlemek için
**Denetim UI → Node'lar → Exec onayları** kartını kullanın. Bir kapsam seçin
(Varsayılanlar veya bir ajan), politikayı ayarlayın, izin listesi desenleri
ekleyin/kaldırın, ardından **Kaydet**'i seçin. UI, listeyi düzenli tutabilmeniz
için desen başına son kullanım meta verilerini gösterir.

Hedef seçici **Gateway** (yerel onaylar) veya bir **Node** seçer.
Node'lar `system.execApprovals.get/set` duyurusu yapmalıdır (macOS uygulaması
veya başsız Node host'u). Bir Node henüz exec onaylarını duyurmuyorsa,
yerel `~/.openclaw/exec-approvals.json` dosyasını doğrudan düzenleyin.

CLI: `openclaw approvals`, gateway veya node düzenlemeyi destekler - bkz.
[Onaylar CLI'ı](/tr/cli/approvals).

## Onay akışı

Bir istem gerektiğinde gateway, operatör istemcilerine
`exec.approval.requested` yayınlar. Denetim UI ve macOS uygulaması bunu
`exec.approval.resolve` ile çözer, ardından gateway onaylanan isteği
Node host'una iletir.

`host=node` için onay istekleri kanonik bir `systemRunPlan` yükü içerir.
Gateway, onaylanan `system.run` isteklerini iletirken bu planı yetkili
command/cwd/session bağlamı olarak kullanır.

Bu, asenkron onay gecikmesi için önemlidir:

- Node exec yolu, baştan tek bir kanonik plan hazırlar.
- Onay kaydı bu planı ve bağlama meta verilerini saklar.
- Onaylandıktan sonra son iletilen `system.run` çağrısı, daha sonraki çağıran düzenlemelerine güvenmek yerine saklanan planı yeniden kullanır.
- Çağıran, onay isteği oluşturulduktan sonra `command`, `rawCommand`, `cwd`, `agentId` veya `sessionKey` değerlerini değiştirirse gateway, iletilen çalıştırmayı onay uyuşmazlığı olarak reddeder.

## Sistem olayları

Exec yaşam döngüsü sistem mesajları olarak gösterilir:

- `Exec running` (yalnızca komut, çalışıyor bildirimi eşiğini aşarsa).
- `Exec finished`.
- `Exec denied`.

Bunlar, Node olayı bildirdikten sonra ajanın oturumuna gönderilir.
Gateway host'lu exec onayları, komut tamamlandığında aynı yaşam döngüsü
olaylarını yayar (ve isteğe bağlı olarak eşikten daha uzun çalıştığında da).
Onay kapılı exec'ler, kolay ilişkilendirme için bu mesajlarda onay kimliğini
`runId` olarak yeniden kullanır.

## Reddedilen onay davranışı

Bir asenkron exec onayı reddedildiğinde OpenClaw, ajanın oturumdaki aynı
komutun daha önceki bir çalıştırmasından gelen çıktıyı yeniden kullanmasını
engeller. Reddetme nedeni, hiçbir komut çıktısının mevcut olmadığına dair açık
yönlendirmeyle iletilir; bu da ajanın yeni çıktı olduğunu iddia etmesini veya
reddedilen komutu önceki başarılı bir çalıştırmadan kalan eski sonuçlarla
tekrarlamasını durdurur.

## Sonuçlar

- **`full`** güçlüdür; mümkün olduğunda izin listelerini tercih edin.
- **`ask`**, hızlı onaylara hâlâ izin verirken sizi döngüde tutar.
- Ajan başına izin listeleri, bir ajanın onaylarının diğerlerine sızmasını önler.
- Onaylar yalnızca **yetkili gönderenlerden** gelen host exec isteklerine uygulanır. Yetkisiz gönderenler `/exec` yayınlayamaz.
- `/exec security=full`, yetkili operatörler için oturum düzeyinde bir kolaylıktır ve tasarım gereği onayları atlar. Host exec'i kesin olarak engellemek için onay güvenliğini `deny` olarak ayarlayın veya araç politikası üzerinden `exec` aracını reddedin.

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
    Güvenlik modeli ve sağlamlaştırma.
  </Card>
  <Card title="Sandbox ile araç politikası ve yükseltilmiş mod karşılaştırması" href="/tr/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Hangi denetime ne zaman başvurulmalı.
  </Card>
  <Card title="Skills" href="/tr/tools/skills" icon="sparkles">
    Skill destekli otomatik izin davranışı.
  </Card>
</CardGroup>

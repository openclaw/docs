---
read_when:
    - Yürütme onaylarını veya izin listelerini yapılandırma
    - macOS uygulamasında exec onayı UX'ini uygulama
    - Sandbox'tan kaçış istemlerini ve bunların etkilerini gözden geçirme
sidebarTitle: Exec approvals
summary: 'Ana makine exec onayları: ilke ayarları, izin listeleri ve YOLO/katı iş akışı'
title: Yürütme onayları
x-i18n:
    generated_at: "2026-06-28T01:22:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a4a5c9c56da458fdb25d5fe698df305af17188695d8befc1d4cfd8e8333e96
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec onayları, korumalı alandaki bir aracının gerçek bir ana makinede (`gateway` veya `node`) komut çalıştırmasına izin vermek için kullanılan **yardımcı uygulama / Node ana makinesi güvenlik rayıdır**. Bir güvenlik kilidi: komutlara yalnızca politika + izin listesi + (isteğe bağlı) kullanıcı onayı birlikte kabul ettiğinde izin verilir. Exec onayları, araç politikasının ve yükseltilmiş geçit denetiminin **üzerine eklenir** (`full` olarak ayarlanmış yükseltilmiş mod hariç; bu durumda onaylar atlanır).

`deny`, `allowlist`, `ask`, `auto`, `full`, Codex Guardian eşlemesi ve ACPX harness izinlerine mod öncelikli bir genel bakış için bkz.
[İzin modları](/tr/tools/permission-modes).

<Note>
Etkili politika, `tools.exec.*` ve onay varsayılanlarının **daha katı** olanıdır; bir onay alanı atlanırsa `tools.exec` değeri kullanılır. Ana makine exec ayrıca o makinedeki yerel onay durumunu kullanır - yürütme ana makinesi onay dosyasındaki ana makineye yerel `ask: "always"`, oturum veya yapılandırma varsayılanları `ask: "on-miss"` istese bile sormaya devam eder.
</Note>

## Etkili politikayı inceleme

| Komut                                                            | Ne gösterir                                                                            |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | İstenen politika, ana makine politika kaynakları ve etkili sonuç.                      |
| `openclaw exec-policy show`                                      | Yerel makinenin birleştirilmiş görünümü.                                                |
| `openclaw exec-policy set` / `preset`                            | Yerel istenen politikayı yerel ana makine onay dosyasıyla tek adımda eşitler.           |

Yerel bir kapsam `host=node` istediğinde, `exec-policy show` bu kapsamı yerel onay dosyasını doğruluk kaynağı gibi göstermek yerine çalışma zamanında Node tarafından yönetiliyor olarak bildirir.

Yardımcı uygulama kullanıcı arayüzü **kullanılamıyorsa**, normalde istem gösterecek her istek **ask fallback** ile çözümlenir (varsayılan: `deny`).

<Tip>
Yerel sohbet onay istemcileri, bekleyen onay iletisinde kanala özel kolaylıkları önceden hazırlayabilir. Örneğin Matrix, `/approve ...` komutlarını iletide yedek olarak bırakırken tepki kısayolları hazırlar (`✅` bir kez izin ver, `❌` reddet, `♾️` her zaman izin ver).
</Tip>

## Nerede uygulanır

Exec onayları yürütme ana makinesinde yerel olarak zorunlu kılınır:

- **Gateway ana makinesi** → Gateway makinesindeki `openclaw` süreci.
- **Node ana makinesi** → Node çalıştırıcısı (macOS yardımcı uygulaması veya başsız Node ana makinesi).

### Güven modeli

- Gateway ile kimlik doğrulaması yapılmış çağıranlar, o Gateway için güvenilir operatörlerdir.
- Eşlenmiş Node'lar bu güvenilir operatör yeteneğini Node ana makinesine taşır.
- Exec onayları yanlışlıkla yürütme riskini azaltır, ancak **kullanıcı başına bir kimlik doğrulama sınırı veya dosya sistemi salt okunur politikası değildir**.
- Onaylandıktan sonra, bir komut seçilen ana makine veya korumalı alan dosya sistemi izinlerine göre dosyaları değiştirebilir.
- Onaylı Node ana makinesi çalıştırmaları kanonik yürütme bağlamını bağlar: kanonik cwd, kesin argv, varsa env bağlaması ve uygulanabiliyorsa sabitlenmiş yürütülebilir dosya yolu.
- Kabuk betikleri ve doğrudan yorumlayıcı/çalışma zamanı dosya çağrıları için OpenClaw ayrıca tek bir somut yerel dosya işlenenini bağlamaya çalışır. Bu bağlı dosya onaydan sonra ancak yürütmeden önce değişirse, kaymış içerik yürütülmek yerine çalışma reddedilir.
- Dosya bağlama kasıtlı olarak en iyi çaba düzeyindedir; her yorumlayıcı/çalışma zamanı yükleyici yolunun eksiksiz bir semantik modeli **değildir**. Onay modu bağlanacak tam olarak tek bir somut yerel dosyayı tanımlayamazsa, tam kapsama varmış gibi davranmak yerine onay destekli bir çalıştırma üretmeyi reddeder.

### macOS ayrımı

- **Node ana makine hizmeti**, `system.run` çağrısını yerel IPC üzerinden **macOS uygulamasına** iletir.
- **macOS uygulaması** onayları zorunlu kılar ve komutu kullanıcı arayüzü bağlamında yürütür.

## Ayarlar ve depolama

Onaylar yürütme ana makinesindeki yerel bir JSON dosyasında bulunur. `OPENCLAW_STATE_DIR` ayarlandığında dosya bu durum dizinini izler; aksi halde varsayılan OpenClaw durum dizinini kullanır:

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# otherwise
~/.openclaw/exec-approvals.json
```

Varsayılan onay soketi aynı kökü izler:
`$OPENCLAW_STATE_DIR/exec-approvals.sock` veya değişken ayarlı olmadığında `~/.openclaw/exec-approvals.sock`.

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

## Politika düğmeleri

### `tools.exec.mode`

`tools.exec.mode`, ana makine exec için tercih edilen normalleştirilmiş politika yüzeyidir.
Değerler şunlardır:

- `deny` - ana makine exec'i engelle.
- `allowlist` - yalnızca izin listesine alınmış komutları sormadan çalıştır.
- `ask` - izin listesi politikasını kullan ve eşleşmeyenlerde sor.
- `auto` - izin listesi politikasını kullan, belirleyici eşleşmeleri doğrudan çalıştır ve onay eşleşmeyenlerini insan onayı rotasına geri dönmeden önce OpenClaw'ın yerel otomatik inceleyicisine gönder.
- `full` - ana makine exec'i onay istemleri olmadan çalıştır.

Eski `tools.exec.security` / `tools.exec.ask` desteklenmeye devam eder ve daha dar oturum veya aracı kapsamında ayarlandığında hâlâ önceliklidir.

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - tüm ana makine exec isteklerini engelle.
  - `allowlist` - yalnızca izin listesine alınmış komutlara izin ver.
  - `full` - her şeye izin ver (yükseltilmiş ile eşdeğer).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  Ana makine exec için yapılandırılmış sorma politikası. `tools.exec.ask` ve ana makine onay varsayılanlarından gelen temel onay istemi davranışını denetler. Çağrı başına `ask` araç parametresi (bkz. [Exec aracı](/tr/tools/exec#parameters)) bu temeli yalnızca sıkılaştırabilir; kanal kökenli model çağrıları, etkili ana makine ask değeri `off` olduğunda bunu yok sayar.

- `off` - asla istem gösterme.
- `on-miss` - yalnızca izin listesi eşleşmediğinde istem göster.
- `always` - her komutta istem göster. Etkili ask modu `always` olduğunda `allow-always` kalıcı güveni istemleri **bastırmaz**.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  İstem gerektiğinde ancak hiçbir kullanıcı arayüzüne erişilemediğinde çözüm. Bu alan atlanırsa OpenClaw varsayılan olarak `deny` kullanır.

- `deny` - engelle.
- `allowlist` - yalnızca izin listesi eşleşirse izin ver.
- `full` - izin ver.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  `true` olduğunda OpenClaw, yorumlayıcı ikilisinin kendisi izin listesinde olsa bile satır içi kod değerlendirme biçimlerini yalnızca onayla çalışır kabul eder. Tek bir kararlı dosya işlenenine temiz biçimde eşlenmeyen yorumlayıcı yükleyicileri için katmanlı savunma sağlar.
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

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Yalnızca exec onay istemlerindeki sunumu denetler. Etkinleştirildiğinde OpenClaw, Web onay istemlerinin komut belirteçlerini vurgulayabilmesi için ayrıştırıcıdan türetilmiş komut aralıkları ekleyebilir. Komut metni vurgulamayı etkinleştirmek için `true` olarak ayarlayın.
</ParamField>

Bu ayar `security`, `ask`, izin listesi eşleşmesi, katı satır içi değerlendirme davranışı, onay iletimi veya komut yürütmeyi **değiştirmez**.
Genel olarak `tools.exec.commandHighlighting` altında veya aracı başına `agents.list[].tools.exec.commandHighlighting` altında ayarlanabilir.

## YOLO modu (onaysız)

Ana makine exec'in onay istemleri olmadan çalışmasını istiyorsanız, **her iki** politika katmanını da açmanız gerekir: OpenClaw yapılandırmasındaki istenen exec politikası (`tools.exec.*`) **ve** yürütme ana makinesi onay dosyasındaki ana makineye yerel onay politikası.

OpenClaw, atlanmış `askFallback` değerini varsayılan olarak `deny` yapar. Kullanıcı arayüzü olmayan bir onay isteminin izin vermeye geri dönmesi gerekiyorsa ana makine `askFallback` değerini açıkça `full` olarak ayarlayın.

| Katman                | YOLO ayarı                |
| --------------------- | ------------------------- |
| `tools.exec.security` | `gateway`/`node` üzerinde `full` |
| `tools.exec.ask`      | `off`                     |
| Ana makine `askFallback` | `full`                  |

<Warning>
**Önemli ayrımlar:**

- `tools.exec.host=auto`, exec'in **nerede** çalışacağını seçer: varsa korumalı alan, aksi halde Gateway.
- YOLO, ana makine exec'in **nasıl** onaylanacağını seçer: `security=full` artı `ask=off`.
- YOLO modunda OpenClaw, yapılandırılmış ana makine exec politikasının üzerine ayrı bir sezgisel komut gizleme onay geçidi veya betik ön kontrol reddi katmanı eklemez.
- `auto`, korumalı alan oturumundan Gateway yönlendirmesini serbest bir geçersiz kılmaya dönüştürmez. `auto` içinden çağrı başına `host=node` isteğine izin verilir; `host=gateway` ise `auto` içinden yalnızca etkin bir korumalı alan çalışma zamanı yokken izinlidir. Kararlı ve otomatik olmayan bir varsayılan için `tools.exec.host` ayarlayın veya açıkça `/exec host=...` kullanın.

</Warning>

Kendi etkileşimsiz izin modlarını sunan CLI destekli sağlayıcılar bu politikayı izleyebilir. Claude CLI, OpenClaw'ın etkili exec politikası YOLO olduğunda `--permission-mode bypassPermissions` ekler. OpenClaw tarafından yönetilen Claude canlı oturumlarında, OpenClaw'ın etkili exec politikası Claude'un yerel izin modu üzerinde yetkilidir: ham Claude arka uç argümanları başka bir mod belirtse bile YOLO canlı başlatmaları `--permission-mode bypassPermissions` olarak, kısıtlayıcı etkili exec politikası ise canlı başlatmaları `--permission-mode default` olarak normalleştirir.

Daha muhafazakâr bir kurulum istiyorsanız OpenClaw exec politikasını yeniden `allowlist` / `on-miss` veya `deny` değerlerine sıkılaştırın.

### Kalıcı Gateway ana makinesi "asla sorma" kurulumu

<Steps>
  <Step title="İstenen yapılandırma politikasını ayarla">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Ana makine onay dosyasını eşleştir">
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
- `askFallback: "full"` dahil yerel onay dosyası varsayılanları.

Kasıtlı olarak yalnızca yereldir. Gateway ana makinesi veya Node ana makinesi onaylarını uzaktan değiştirmek için `openclaw approvals set --gateway` veya `openclaw approvals set --node <id|name|ip>` kullanın.

### Node ana makinesi

Bir Node ana makinesi için bunun yerine aynı onay dosyasını o Node üzerinde uygulayın:

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

- `openclaw exec-policy`, Node onaylarını eşitlemez.
- `openclaw exec-policy set --host node` reddedilir.
- Node exec onayları çalışma zamanında Node'dan alınır; bu nedenle Node hedefli güncellemeler `openclaw approvals --node ...` kullanmalıdır.

</Note>

### Yalnızca oturum kısayolu

- `/exec security=full ask=off` yalnızca geçerli oturumu değiştirir.
- `/elevated full`, yalnızca istenen policy ve host onayları dosyası
  `security: "full"` ve `ask: "off"` olarak çözümlendiğinde exec onaylarını
  atlayan bir acil durum kısayoludur. `ask: "always"` gibi daha sıkı bir host
  dosyası yine de istem gösterir.

Host onayları dosyası yapılandırmadan daha sıkı kalırsa, daha sıkı host
policy yine kazanır.

## İzin listesi (aracı başına)

İzin listeleri **aracı başınadır**. Birden çok aracı varsa, macOS
uygulamasında hangi aracıyı düzenlediğinizi değiştirin. Desenler glob
eşleşmeleridir.

Desenler çözümlenmiş ikili yol glob’ları veya yalın komut adı glob’ları
olabilir. Yalın adlar yalnızca `PATH` üzerinden çağrılan komutlarla eşleşir;
bu nedenle komut `rg` olduğunda `rg`, `/opt/homebrew/bin/rg` ile eşleşebilir,
ancak `./rg` veya `/tmp/rg` ile **eşleşmez**. Belirli bir ikili konumuna
güvenmek istediğinizde yol glob’u kullanın.

Eski `agents.default` girdileri yükleme sırasında `agents.main` içine taşınır.
`echo ok && pwd` gibi shell zincirlerinde de her üst düzey segmentin izin
listesi kurallarını karşılaması gerekir.

Örnekler:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### argPattern ile argümanları kısıtlama

Bir izin listesi girdisinin bir ikiliyle ve belirli bir argüman şekliyle
eşleşmesi gerekiyorsa `argPattern` ekleyin. OpenClaw, düzenli ifadeyi
yürütülebilir token (`argv[0]`) hariç ayrıştırılmış komut argümanlarına göre
değerlendirir. Elle yazılan girdilerde argümanlar tek bir boşlukla
birleştirilir; bu nedenle tam eşleşmeye ihtiyacınız olduğunda deseni
sabitleyin.

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

Bu girdi `python3 safe.py` komutuna izin verir; `python3 other.py` izin
listesi kaçırmasıdır. Aynı ikili için yalnızca yol içeren bir girdi de varsa,
eşleşmeyen argümanlar yine bu yalnızca yol girdisine geri düşebilir. Amaç
ikiliyi bildirilen argümanlarla kısıtlamaksa yalnızca yol girdisini atlayın.

Onay akışları tarafından kaydedilen girdiler, tam argv eşleştirmesi için
dahili bir ayırıcı biçimi kullanabilir. Kodlanmış değeri elle düzenlemek
yerine bu girdileri yeniden oluşturmak için UI veya onay akışını tercih edin.
OpenClaw bir komut segmenti için argv ayrıştıramazsa, `argPattern` içeren
girdiler eşleşmez.

Her izin listesi girdisi şunları destekler:

| Alan               | Anlam                                                         |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Çözümlenmiş ikili yol glob’u veya yalın komut adı glob’u      |
| `argPattern`       | İsteğe bağlı argv regex’i; atlanan girdiler yalnızca yoldur   |
| `id`               | UI kimliği için kullanılan kararlı UUID                       |
| `source`           | `allow-always` gibi girdi kaynağı                             |
| `commandText`      | Bir onay akışı girdiyi oluşturduğunda yakalanan komut metni   |
| `lastUsedAt`       | Son kullanım zaman damgası                                    |
| `lastUsedCommand`  | Eşleşen son komut                                             |
| `lastResolvedPath` | Son çözümlenen ikili yolu                                     |

## Skills CLI’larını otomatik izinli sayma

**Skills CLI’larını otomatik izinli say** etkinleştirildiğinde, bilinen
Skills tarafından başvurulan yürütülebilirler Node’larda (macOS Node veya
headless Node host) izin listesinde kabul edilir. Bu, Skill ikili listesini
getirmek için Gateway RPC üzerinden `skills.bins` kullanır. Katı manuel izin
listeleri istiyorsanız bunu devre dışı bırakın.

<Warning>
- Bu, manuel yol izin listesi girdilerinden ayrı bir **örtük kolaylık izin listesidir**.
- Gateway ve Node’un aynı güven sınırı içinde olduğu güvenilir operatör ortamları için tasarlanmıştır.
- Katı açık güven gerektiriyorsanız, `autoAllowSkills: false` tutun ve yalnızca manuel yol izin listesi girdilerini kullanın.

</Warning>

## Güvenli ikililer ve onay iletme

Güvenli ikililer (yalnızca stdin hızlı yolu), yorumlayıcı bağlama ayrıntıları
ve onay istemlerini Slack/Discord/Telegram’a iletme (veya bunları yerel onay
istemcileri olarak çalıştırma) için
[Exec onayları - ileri düzey](/tr/tools/exec-approvals-advanced) sayfasına bakın.

## Control UI düzenleme

Varsayılanları, aracı başına geçersiz kılmaları ve izin listelerini düzenlemek
için **Control UI → Nodes → Exec approvals** kartını kullanın. Bir kapsam
seçin (Varsayılanlar veya bir aracı), policy’yi ayarlayın, izin listesi
desenleri ekleyin/kaldırın, ardından **Save** seçin. UI, listeyi düzenli
tutabilmeniz için her desenin son kullanım meta verilerini gösterir.

Hedef seçici **Gateway** (yerel onaylar) veya bir **Node** seçer. Node’lar
`system.execApprovals.get/set` duyurmalıdır (macOS uygulaması veya headless
Node host). Bir Node henüz exec onaylarını duyurmuyorsa, yerel onay dosyasını
doğrudan düzenleyin.

CLI: `openclaw approvals`, Gateway veya Node düzenlemeyi destekler; bkz.
[Onaylar CLI](/tr/cli/approvals).

## Onay akışı

Bir istem gerektiğinde Gateway, operatör istemcilerine
`exec.approval.requested` yayınlar. Control UI ve macOS uygulaması bunu
`exec.approval.resolve` ile çözer, ardından Gateway onaylanan isteği Node
host’a iletir.

`host=node` için onay istekleri kanonik bir `systemRunPlan` payload’u içerir.
Gateway, onaylanmış `system.run` isteklerini iletirken bu planı yetkili
command/cwd/session bağlamı olarak kullanır.

Bu, async onay gecikmesi için önemlidir:

- Node exec yolu baştan tek bir kanonik plan hazırlar.
- Onay kaydı bu planı ve bağlama meta verilerini saklar.
- Onaylandıktan sonra son iletilen `system.run` çağrısı, sonraki çağıran düzenlemelerine güvenmek yerine saklanan planı yeniden kullanır.
- Çağıran, onay isteği oluşturulduktan sonra `command`, `rawCommand`, `cwd`, `agentId` veya `sessionKey` değiştirirse Gateway iletilen çalıştırmayı onay uyumsuzluğu olarak reddeder.

## Sistem olayları

Exec yaşam döngüsü sistem mesajları olarak gösterilir:

- `Exec running` (yalnızca komut çalışma bildirimi eşiğini aşarsa).
- `Exec finished`.

Bunlar, Node olayı raporladıktan sonra aracının oturumuna gönderilir.
Reddedilen exec onayları host komutunun kendisi için terminaldir: komut
çalışmaz. Kaynak oturumu olan ana aracı async onaylarında OpenClaw, reddi o
oturuma dahili bir takip olarak geri gönderir; böylece aracı async komutu
beklemeyi bırakabilir ve eksik sonuç onarımından kaçınabilir. Oturum yoksa
veya oturum sürdürülemiyorsa OpenClaw yine de operatöre veya doğrudan sohbet
rotasına kısa bir red bildirebilir. Alt aracı oturumları için redler alt
aracıya geri gönderilmez.
Gateway-host exec onayları, komut tamamlandığında (ve isteğe bağlı olarak
eşikten daha uzun çalıştığında) aynı yaşam döngüsü olaylarını yayar. Onay
kapılı exec’ler, kolay korelasyon için bu mesajlarda onay kimliğini `runId`
olarak yeniden kullanır.

## Reddedilen onay davranışı

Bir async exec onayı reddedildiğinde OpenClaw, host komutunu terminal kabul
eder ve güvenli biçimde kapalı kalır. Ana aracı oturumlarında red, aracıya
async komutun çalışmadığını söyleyen dahili bir oturum takibi olarak iletilir.
Bu, eski komut çıktısını açığa çıkarmadan transcript sürekliliğini korur.
Oturum teslimi kullanılamıyorsa OpenClaw, güvenli bir rota varsa kısa bir
operatör veya doğrudan sohbet reddine geri düşer.

## Sonuçlar

- **`full`** güçlüdür; mümkün olduğunda izin listelerini tercih edin.
- **`ask`**, hızlı onaylara izin verirken sizi döngünün içinde tutar.
- Aracı başına izin listeleri, bir aracının onaylarının diğerlerine sızmasını önler.
- Onaylar yalnızca **yetkili göndericilerden** gelen host exec isteklerine uygulanır. Yetkisiz göndericiler `/exec` çalıştıramaz.
- `/exec security=full`, yetkili operatörler için oturum düzeyinde bir kolaylıktır ve tasarımı gereği onayları atlar. Host exec’i sert biçimde engellemek için onay güvenliğini `deny` olarak ayarlayın veya tool policy üzerinden `exec` aracını reddedin.

## İlgili

<CardGroup cols={2}>
  <Card title="Exec onayları - ileri düzey" href="/tr/tools/exec-approvals-advanced" icon="gear">
    Güvenli ikililer, yorumlayıcı bağlama ve sohbete onay iletme.
  </Card>
  <Card title="Exec aracı" href="/tr/tools/exec" icon="terminal">
    Shell komutu yürütme aracı.
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
  <Card title="Sandbox ve tool policy ve yükseltilmiş" href="/tr/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Her denetime ne zaman başvurulacağı.
  </Card>
  <Card title="Skills" href="/tr/tools/skills" icon="sparkles">
    Skill destekli otomatik izin davranışı.
  </Card>
</CardGroup>

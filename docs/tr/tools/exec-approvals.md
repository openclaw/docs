---
read_when:
    - exec onaylarını veya izin listelerini yapılandırma
    - macOS uygulamasında çalıştırma onayı kullanıcı deneyiminin uygulanması
    - Korumalı alandan kaçış istemlerini ve bunların etkilerini inceleme
sidebarTitle: Exec approvals
summary: 'Ana makinede komut yürütme onayları: ilke ayarları, izin listeleri ve YOLO/katı iş akışı'
title: Exec onayları
x-i18n:
    generated_at: "2026-07-12T12:48:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b44efdfe5a6c9f3cc978baef91d80d1f75d39627d3a16f5971800809a642a72c
    source_path: tools/exec-approvals.md
    workflow: 16
---

Çalıştırma onayları, korumalı alandaki bir aracının gerçek bir ana makinede (`gateway` veya `node`) komut çalıştırmasına izin veren **yardımcı uygulama / node ana makinesi güvenlik önlemidir**. Komutlar yalnızca politika + izin listesi + (isteğe bağlı) kullanıcı onayı birlikte izin verdiğinde çalışır. Onaylar, araç politikasının ve yükseltilmiş erişim denetiminin **üzerine eklenir** (yükseltilmiş `full` bunları atlar).

`deny`, `allowlist`, `ask`, `auto`, `full`, Codex Guardian eşlemesi ve ACPX çalıştırma düzeneği izinlerine kip odaklı genel bakış için [İzin kipleri](/tr/tools/permission-modes) bölümüne bakın.

<Note>
Geçerli politika, `tools.exec.*` ile onay varsayılanlarından **daha katı** olanıdır: onaylar yapılandırmadan türetilen güvenlik/sorma politikasını yalnızca sıkılaştırabilir, asla gevşetemez. Bir onay alanı belirtilmezse `tools.exec` değeri kullanılır. Ana makinede çalıştırma, ilgili makinedeki yerel onay durumunu da kullanır; çalıştırma ana makinesinin onay dosyasındaki yerel `ask: "always"` ayarı, oturum veya yapılandırma varsayılanları `ask: "on-miss"` istese bile sormaya devam eder.
</Note>

## Uygulandığı yerler

Çalıştırma onayları, çalıştırma ana makinesinde yerel olarak uygulanır:

- **Gateway ana makinesi** -> gateway makinesindeki `openclaw` işlemi.
- **Node ana makinesi** -> node çalıştırıcısı (macOS yardımcı uygulaması veya başsız node ana makinesi).

### Güven modeli

- Gateway tarafından kimliği doğrulanmış çağıranlar, ilgili Gateway için güvenilir operatörlerdir.
- Eşleştirilmiş node'lar, bu güvenilir operatör yeteneğini node ana makinesine taşır.
- Onaylar yanlışlıkla çalıştırma riskini azaltır ancak kullanıcı başına bir kimlik doğrulama sınırı veya dosya sistemi salt okunur politikası **değildir**.
- Bir komut onaylandıktan sonra, seçilen ana makine veya korumalı alan dosya sistemi izinlerine göre dosyaları değiştirebilir.
- Onaylanmış node ana makinesi çalıştırmaları standart çalıştırma bağlamını bağlar: cwd, tam argv, varsa env bağlaması ve geçerli olduğunda sabitlenmiş yürütülebilir dosya yolu.
- OpenClaw, kabuk betikleri ve doğrudan yorumlayıcı/çalışma zamanı dosyası çağrıları için ayrıca tek bir somut yerel dosya işlenenini bağlamaya çalışır. Bu dosya onaydan sonra ancak çalıştırmadan önce değişirse, değişmiş içeriği çalıştırmak yerine çalıştırma reddedilir.
- Dosya bağlama en iyi çabaya dayalıdır; her yorumlayıcı/çalışma zamanı yükleyici yolunun eksiksiz bir modeli değildir. Tam olarak bir somut yerel dosya belirlenemiyorsa OpenClaw, tam kapsama varmış gibi davranmak yerine onaya dayalı çalıştırma oluşturmayı reddeder.

### macOS ayrımı

- **Node ana makinesi hizmeti**, `system.run` çağrısını yerel IPC üzerinden **macOS uygulamasına** iletir.
- **macOS uygulaması**, onayları uygular ve komutu kullanıcı arayüzü bağlamında çalıştırır.

## Geçerli politikayı inceleme

| Komut                                                            | Gösterdiği bilgiler                                                                    |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | İstenen politika, ana makine politika kaynakları ve geçerli sonuç.                     |
| `openclaw exec-policy show`                                      | Yerel makinenin birleştirilmiş görünümü.                                               |
| `openclaw exec-policy set` / `preset`                            | Yerel istenen politikayı yerel ana makine onay dosyasıyla tek adımda eşitler.          |

<Note>
Oturum başına `/exec` geçersiz kılmaları dahil edilmez. Geçerli varsayılanları incelemek için ilgili oturumda `/exec` komutunu çalıştırın. [Oturum geçersiz kılmaları](/tr/tools/exec#session-overrides-exec) bölümüne bakın.
</Note>

Tam CLI başvurusu (bayraklar, JSON çıktısı, izin listesine ekleme/çıkarma): [Onaylar CLI](/tr/cli/approvals).

Yerel bir kapsam `host=node` istediğinde `exec-policy show`, yerel onay dosyasını doğruluk kaynağı olarak değerlendirmek yerine bu kapsamı çalışma zamanında node tarafından yönetiliyor olarak bildirir.

Yardımcı uygulama kullanıcı arayüzü **kullanılamıyorsa**, normalde istem gösterecek tüm istekler **sorma geri dönüşü** ile çözümlenir (varsayılan: `deny`).

<Tip>
Yerel sohbet onay istemcileri, bekleyen onay mesajına kanala özgü kolaylıklar ekleyebilir. Matrix, `/approve ...` komutunu yedek seçenek olarak mesajda tutarken tepki kısayolları (`✅` bir kez izin ver, `♾️` her zaman izin ver, `❌` reddet) ekler.
</Tip>

## Ayarlar ve depolama

Onaylar, çalıştırma ana makinesindeki yerel bir JSON dosyasında bulunur. `OPENCLAW_STATE_DIR` ayarlandığında dosya bu durum dizinini izler; aksi takdirde varsayılan OpenClaw durum dizinini kullanır:

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# aksi takdirde
~/.openclaw/exec-approvals.json
```

Varsayılan onay soketi aynı kök dizini izler:
`$OPENCLAW_STATE_DIR/exec-approvals.sock` veya değişken ayarlanmamışsa
`~/.openclaw/exec-approvals.sock`.

2026.6.6 öncesindeki sürümler dosyayı her zaman `~/.openclaw` altında tutuyordu. `OPENCLAW_STATE_DIR` başka bir konumu gösteriyorsa ve varsayılan dizinde hâlâ bir onay dosyası varsa, dosyayı durum dizinine aktarmak için `openclaw doctor --fix` komutunu bir kez doğrudan çalıştırın (özgün dosya `.migrated` son ekiyle arşivlenir). Etkileşimli doctor da aktarımı önizleyip onaylayabilir. Otomatik güncelleme ve Gateway izleme onarım çalıştırmaları durum dizinleri arasında hiçbir zaman aktarım yapmaz: geçici veya hazırlama amaçlı bir durum dizini, varsayılan kurulumun onaylarını ele geçirmemelidir. Aynı sınır, eski `plugin-binding-approvals.json` dosyalarının paylaşılan SQLite durumuna aktarılması için de geçerlidir.

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
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Politika ayarları

### `tools.exec.mode`

`tools.exec.mode`, ana makinede çalıştırma için tercih edilen normalleştirilmiş politika yüzeyidir:

| Değer       | Davranış                                                                                                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deny`      | Ana makinede çalıştırmayı engeller.                                                                                                                                                                      |
| `allowlist` | Yalnızca izin listesindeki komutları sormadan çalıştırır.                                                                                                                                                |
| `ask`       | İzin listesi politikasını kullanır ve eşleşme olmadığında sorar.                                                                                                                                         |
| `auto`      | İzin listesi politikasını kullanır, belirlenimci eşleşmeleri doğrudan çalıştırır ve onay eşleşmezliklerini bir insan onay yoluna başvurmadan önce OpenClaw'ın yerel otomatik inceleyicisine gönderir.        |
| `full`      | Ana makinede çalıştırmayı onay istemleri olmadan gerçekleştirir.                                                                                                                                         |

Eski `tools.exec.security` / `tools.exec.ask` ayarları desteklenmeye devam eder ve ilgili kapsamda `mode` ayarlanmamışsa uygulanır.

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - tüm ana makinede çalıştırma isteklerini engeller.
  - `allowlist` - yalnızca izin listesindeki komutlara izin verir.
  - `full` - her şeye izin verir (yükseltilmiş erişime eşdeğerdir).

Gateway/node ana makineleri için varsayılan değer `full` iken, bir `sandbox` ana makinesi bunun yerine varsayılan olarak `deny` kullanır.
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  Ana makinede çalıştırma için yapılandırılmış sorma politikasıdır. `tools.exec.ask` ve ana makine onay varsayılanlarından gelen temel onay istemi davranışını denetler. Varsayılan değer `off` şeklindedir. Çağrı başına `ask` araç parametresi ([Çalıştırma aracı](/tr/tools/exec#parameters) bölümüne bakın) bu temel davranışı yalnızca daha katı hâle getirebilir ve kanal kaynaklı model çağrıları, geçerli ana makine sorma ayarı `off` olduğunda bunu yok sayar.

- `off` - hiçbir zaman sorma.
- `on-miss` - yalnızca izin listesi eşleşmediğinde sor.
- `always` - her komutta sor. Geçerli sorma kipi `always` olduğunda kalıcı `allow-always` güveni istemleri **engellemez**.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  İstem gerektiğinde ancak hiçbir kullanıcı arayüzüne ulaşılamadığında (veya istem zaman aşımına uğradığında) kullanılacak çözüm. Belirtilmediğinde varsayılan değer `deny` şeklindedir.

- `deny` - engeller.
- `allowlist` - yalnızca izin listesi eşleşirse izin verir.
- `full` - izin verir.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  `true` olduğunda yorumlayıcı ikili dosyasının kendisi izin listesinde bulunsa bile satır içi kod değerlendirme biçimlerini yalnızca onayla çalıştırılabilir olarak değerlendirir. Tek bir kararlı dosya işlenenine düzgün biçimde eşlenmeyen yorumlayıcı yükleyicileri için derinlemesine savunma sağlar.
</ParamField>

Katı kipin yakaladığı örnekler: `python -c`, `node -e`/`--eval`/`-p`,
`ruby -e`, `perl -e`/`-E`, `php -r`, `lua -e`, `osascript -e` (ayrıca `awk`,
`sed`, `make`, `find -exec` ve `xargs` satır içi biçimleri).

Katı kipte bu komutlar inceleyici veya açık onay gerektirir. Komut uygulanabilir bir plana sahipse `tools.exec.mode: "auto"` ile inceleyici düşük riskli tek bir çalıştırmaya izin verebilir; aksi takdirde OpenClaw bir insana sorar.
İnceleyici geri dönüşüne ulaşan `Codex app-server` komut onayları, onay istekleri uygulanabilir ve çözümlenmiş bir yürütülebilir dosya sunmadığından bir insana sorar.
`allow-always`, satır içi değerlendirme komutları için yeni izin listesi girdilerini kalıcı hâle getirmez.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Yalnızca sunum amaçlıdır: etkinleştirildiğinde OpenClaw, Web onay istemlerinin komut belirteçlerini vurgulayabilmesi için ayrıştırıcıdan türetilmiş komut aralıkları ekleyebilir. `security`, `ask`, izin listesi eşleştirmesi, katı satır içi değerlendirme davranışı, onay iletimi veya komut çalıştırmayı **değiştirmez**.
</ParamField>

Genel olarak `tools.exec.commandHighlighting` altında veya aracı başına
`agents.list[].tools.exec.commandHighlighting` altında ayarlayın.

## YOLO kipi (onaysız)

Ana makinede çalıştırmayı onay istemleri olmadan gerçekleştirmek için **her iki** politika katmanını açın:
OpenClaw yapılandırmasındaki istenen çalıştırma politikası (`tools.exec.*`) **ve**
çalıştırma ana makinesinin onay dosyasındaki ana makineye özgü onay politikası.

Belirtilmeyen `askFallback` varsayılan olarak `deny` değerini kullanır. Kullanıcı arayüzü olmayan bir onay isteminin izin vermeye geri dönmesi gerekiyorsa ana makinenin `askFallback` değerini açıkça `full` olarak ayarlayın.

| Katman                | YOLO ayarı                 |
| --------------------- | -------------------------- |
| `tools.exec.security` | `gateway`/`node` üzerinde `full` |
| `tools.exec.ask`      | `off`                      |
| Ana makine `askFallback` | `full`                  |

<Warning>
**Önemli ayrımlar:**

- `tools.exec.host=auto`, çalıştırmanın **nerede** yapılacağını seçer: kullanılabiliyorsa korumalı alanda, aksi takdirde gateway'de.
- YOLO, ana makinede çalıştırmanın **nasıl** onaylanacağını seçer: `security=full` ve `ask=off`.
- YOLO, yapılandırılmış ana makinede çalıştırma politikasının üzerine ayrı bir sezgisel komut gizleme onay denetimi veya betik ön inceleme ret katmanı **eklemez**.
- `auto`, gateway yönlendirmesini korumalı alandaki bir oturumdan serbestçe geçersiz kılmaya izin vermez. Çağrı başına `host=node` isteğine `auto` üzerinden izin verilir; `host=gateway` isteğine ise `auto` üzerinden yalnızca etkin bir korumalı alan çalışma zamanı yoksa izin verilir. Kararlı ve otomatik olmayan bir varsayılan için `tools.exec.host` ayarını belirleyin veya açıkça `/exec host=...` kullanın.

</Warning>

Kendi etkileşimsiz izin modlarını sunan CLI destekli sağlayıcılar
bu politikayı izleyebilir. OpenClaw'ın etkin yürütme
politikası YOLO olduğunda Claude CLI,
`--permission-mode bypassPermissions` seçeneğini ekler. OpenClaw tarafından yönetilen canlı Claude oturumlarında, OpenClaw'ın
etkin yürütme politikası Claude'un yerel izin moduna göre belirleyicidir:
YOLO, canlı başlatmaları `--permission-mode bypassPermissions` olarak normalleştirir;
kısıtlayıcı etkin yürütme politikası ise ham Claude arka uç argümanları başka bir
mod belirtse bile canlı başlatmaları
`--permission-mode default` olarak normalleştirir.

Daha ihtiyatlı bir kurulum istiyorsanız OpenClaw yürütme politikasını yeniden
`allowlist` / `on-miss` veya `deny` olarak sıkılaştırın.

### Kalıcı Gateway ana makinesi için "asla sorma" kurulumu

<Steps>
  <Step title="İstenen yapılandırma politikasını ayarlayın">
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

Hem yerel `tools.exec.host/security/ask` değerlerini hem de yerel onaylar
dosyasının varsayılanlarını (`askFallback: "full"` dâhil) günceller. Bu komut kasıtlı olarak
yalnızca yerelde çalışır. Gateway ana makinesi veya Node ana makinesi onaylarını uzaktan değiştirmek için
`openclaw approvals set --gateway` ya da `openclaw approvals set --node
<id|name|ip>` kullanın.

Diğer yerleşik önayarlar: `cautious` (`host=gateway`, `security=allowlist`,
`ask=on-miss`, `askFallback=deny`) ve `deny-all` (`host=gateway`,
`security=deny`, `ask=off`, `askFallback=deny`). Aynı şekilde uygulayın:
`openclaw exec-policy preset cautious`.

Tam bir önayar yerine tek tek alanları ayarlamak için bu bayrakların herhangi bir alt kümesiyle
`openclaw exec-policy set --host <auto|sandbox|gateway|node> --security
<deny|allowlist|full> --ask <off|on-miss|always> --ask-fallback
<deny|allowlist|full>` kullanın.

### Node ana makinesi

Bunun yerine aynı onaylar dosyasını Node üzerinde uygulayın:

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
**Yalnızca yerelde çalışma sınırlamaları:**

- `openclaw exec-policy`, Node onaylarını eşitlemez.
- `openclaw exec-policy set --host node` reddedilir.
- Node yürütme onayları çalışma zamanında Node üzerinden alınır; bu nedenle Node hedefli güncellemelerde `openclaw approvals --node ...` kullanılmalıdır.

</Note>

### Yalnızca oturum için kısayol

- `/exec security=full ask=off` yalnızca geçerli oturumu değiştirir.
- `/elevated full`, yalnızca hem istenen politika hem de ana makine onayları dosyası
  `security: "full"` ve `ask: "off"` olarak çözümlendiğinde yürütme onaylarını atlayan
  acil durum kısayoludur. `ask:
"always"` gibi daha katı bir ana makine dosyası yine onay ister.

Ana makine onayları dosyası yapılandırmadan daha katı kalırsa daha katı ana makine
politikası yine geçerli olur.

## İzin listesi (temsilci başına)

İzin listeleri **temsilci başınadır**. Birden fazla temsilci varsa macOS uygulamasında
düzenlediğiniz temsilciyi değiştirin. Desenler glob eşleşmeleridir.

Desenler, çözümlenmiş ikili dosya yolu glob'ları veya yalnızca komut adından oluşan glob'lar olabilir.
Yalnızca ad içeren desenler sadece `PATH` üzerinden çağrılan komutlarla eşleşir; dolayısıyla komut `rg`
olduğunda `rg`, `/opt/homebrew/bin/rg` ile eşleşebilir ancak `./rg` veya
`/tmp/rg` ile **eşleşmez**. Belirli bir ikili dosya konumuna güvenmek için yol glob'u kullanın.

Eski `agents.default` girdileri yükleme sırasında `agents.main` konumuna taşınır.
`echo ok && pwd` gibi kabuk zincirlerinde her üst düzey bölümün
izin listesi kurallarını karşılaması gerekir.

Örnekler:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### argPattern ile argümanları kısıtlama

Bir izin listesi girdisinin bir ikili dosyayla ve belirli bir argüman biçimiyle
eşleşmesi gerektiğinde `argPattern` ekleyin. OpenClaw tüm ana makinelerde ECMAScript (JavaScript)
düzenli ifade semantiğini kullanır ve ifadeyi, çalıştırılabilir dosya belirteci (`argv[0]`)
hariç tutularak ayrıştırılmış komut argümanlarına karşı değerlendirir.
Elle oluşturulan girdilerde argümanlar tek bir boşlukla birleştirilir; bu nedenle
tam eşleşme gerektiğinde deseni sabitleyin.

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

Bu girdi `python3 safe.py` komutuna izin verir; `python3 other.py` bir izin listesi
eşleşme hatasıdır. Aynı ikili dosya için yalnızca yol içeren bir girdi de varsa eşleşmeyen
argümanlar yine yalnızca yol içeren bu girdiye geri dönebilir. Amaç ikili dosyayı bildirilen
argümanlarla sınırlamaksa yalnızca yol içeren girdiyi eklemeyin.

Onay akışları tarafından kaydedilen girdiler, tam argv eşleşmesi için dahili bir ayırıcı
biçimi kullanır. Kodlanmış değeri elle düzenlemek yerine bu girdileri yeniden oluşturmak için
kullanıcı arayüzünü veya onay akışını tercih edin. OpenClaw bir komut bölümü için argv'yi
ayrıştıramazsa `argPattern` içeren girdiler eşleşmez.

Her izin listesi girdisi şunları destekler:

| Alan               | Anlamı                                                        |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Çözümlenmiş ikili dosya yolu glob'u veya yalnızca komut adı glob'u |
| `argPattern`       | İsteğe bağlı ECMAScript argv düzenli ifadesi; belirtilmezse yalnızca yol |
| `id`               | Kararlı opak kimlik; yoksa UUID olarak oluşturulur             |
| `source`           | `allow-always` gibi girdi kaynağı                              |
| `commandText`      | Eski düz metin girdisi; yükleme sırasında atılır               |
| `lastUsedAt`       | Son kullanım zaman damgası                                     |
| `lastUsedCommand`  | Eşleşen son komut                                              |
| `lastResolvedPath` | Son çözümlenen ikili dosya yolu                                |

## Skills CLI'larına otomatik izin verme

**Skills CLI'larına otomatik izin verme** (`autoAllowSkills`) etkinleştirildiğinde, bilinen
Skills tarafından başvurulan çalıştırılabilir dosyalar Node'larda (macOS Node veya
başsız Node ana makinesi) izin listesine alınmış kabul edilir. Bu işlem, Skills ikili dosya
listesini almak için Gateway RPC üzerinden `skills.bins` kullanır. Katı ve elle yönetilen
izin listeleri istiyorsanız bunu devre dışı bırakın.

<Warning>
- Bu, elle oluşturulan yol izin listesi girdilerinden ayrı bir **örtük kolaylık izin listesidir**.
- Gateway ile Node'un aynı güven sınırında olduğu güvenilir operatör ortamları için tasarlanmıştır.
- Kesin ve açık güven gerekiyorsa `autoAllowSkills: false` değerini koruyun ve yalnızca elle oluşturulan yol izin listesi girdilerini kullanın.

</Warning>

## Güvenli ikili dosyalar ve onay yönlendirme

Güvenli ikili dosyalar (yalnızca stdin kullanan hızlı yol), yorumlayıcı bağlama ayrıntıları ve
onay istemlerinin Slack/Discord/Telegram'a nasıl yönlendirileceği (veya bunların yerel onay
istemcileri olarak nasıl çalıştırılacağı) için
[Yürütme onayları - gelişmiş](/tr/tools/exec-approvals-advanced) bölümüne bakın.

## Denetim kullanıcı arayüzünde düzenleme

Varsayılanları, temsilci başına geçersiz kılmaları ve izin listelerini düzenlemek için
**Denetim kullanıcı arayüzü -> Node'lar -> Yürütme onayları** kartını kullanın. Bir kapsam
(Varsayılanlar veya bir temsilci) seçin, politikayı ayarlayın, izin listesi desenleri ekleyin
veya kaldırın, ardından **Kaydet** seçeneğini kullanın. Kullanıcı arayüzü, listeyi düzenli
tutabilmeniz için desen başına son kullanım meta verilerini gösterir.

Hedef seçici **Gateway** (yerel onaylar) veya bir **Node** seçer.
Node'ların `system.execApprovals.get/set` özelliğini duyurması gerekir (macOS uygulaması veya
başsız Node ana makinesi). Bir Node henüz yürütme onaylarını duyurmuyorsa yerel
onaylar dosyasını doğrudan düzenleyin.

Windows yardımcı uygulaması dâhil bazı Node ana makineleri farklı bir onay
politikası biçimine sahiptir. Denetim kullanıcı arayüzü, ana makineye özgü bu politikaları salt okunur
olarak gösterir. Bunları düzenlemek için yardımcı uygulamayı veya yerel politika biçimiyle
`openclaw approvals set --node <id|name|ip>` komutunu kullanın; bkz.
[Onaylar CLI'sı](/tr/cli/approvals).

CLI: `openclaw approvals`, Gateway veya Node düzenlemeyi destekler; bkz.
[Onaylar CLI'sı](/tr/cli/approvals).

## Onay akışı

Onay istemi gerektiğinde Gateway, operatör istemcilerine
`exec.approval.requested` yayınlar. Denetim kullanıcı arayüzü ve macOS
uygulaması bunu `exec.approval.resolve` üzerinden çözümler; ardından Gateway,
onaylanan isteği Node ana makinesine iletir.

`host=node` için onay istekleri standart bir `systemRunPlan`
yükü içerir. Gateway, onaylanan `system.run` isteklerini iletirken bu planı
komut/cwd/oturum bağlamı için belirleyici kaynak olarak kullanır:

- Node yürütme yolu başlangıçta tek bir standart plan hazırlar.
- Onay kaydı bu planı ve bağlama meta verilerini saklar.
- Onaylandıktan sonra, son iletilen `system.run` çağrısı daha sonraki çağıran düzenlemelerine güvenmek yerine saklanan planı yeniden kullanır.
- Çağıran, onay isteği oluşturulduktan sonra `command`, `rawCommand`, `cwd`, `agentId` veya `sessionKey` değerini değiştirirse Gateway, iletilen çalıştırmayı onay uyuşmazlığı nedeniyle reddeder.

## Sistem olayları ve retler

Node tamamlanmayı bildirdikten sonra yürütme yaşam döngüsü, temsilcinin
oturumuna bir `Exec finished` sistem iletisi gönderir. OpenClaw ayrıca bir onay verildikten sonra
`tools.exec.approvalRunningNoticeMs` süresi dolduğunda (varsayılan `10000`; `0` devre dışı
bırakır) devam eden işlem bildirimi yayınlayabilir. Reddedilen yürütme onayları ana makine
komutu için sonlandırıcıdır: komut çalıştırılmaz.

- Kaynak oturumu bulunan ana temsilci eşzamansız onaylarında OpenClaw,
  reddi dahili bir takip iletisi olarak bu oturuma geri gönderir; böylece
  temsilci eşzamansız komutu beklemeyi bırakabilir ve eksik sonuç
  onarımını önleyebilir.
- Oturum yoksa veya oturum sürdürülemiyorsa OpenClaw yine de
  operatöre ya da doğrudan sohbet rotasına kısa bir ret bildirimi gönderebilir.
- Alt temsilci ve Cron oturumlarının retleri ilgili oturuma geri gönderilmez.

Gateway ana makinesi yürütme onayları da aynı tamamlanma yaşam döngüsü olayını yayınlar.
Onay geçitli yürütmeler, bekleyen isteği tamamlanma/ret iletisiyle ilişkilendirmek için
onay kimliğini yeniden kullanır (`Exec finished (gateway
id=...)` / `Exec denied (gateway id=...)`).

## Sonuçlar

- **`full`** güçlüdür; mümkün olduğunda izin listelerini tercih edin.
- **`ask`**, hızlı onaylara izin verirken sürece dâhil olmanızı sağlar.
- Temsilci başına izin listeleri, bir temsilcinin onaylarının diğerlerine sızmasını önler.
- Onaylar yalnızca **yetkili gönderenlerden** gelen ana makine yürütme isteklerine uygulanır. Yetkisiz gönderenler `/exec` kullanamaz.
- `/exec security=full`, yetkili operatörler için oturum düzeyinde bir kolaylıktır ve tasarım gereği onayları atlar. Ana makine yürütmesini kesin olarak engellemek için onay güvenliğini `deny` olarak ayarlayın veya araç politikası üzerinden `exec` aracını reddedin.

## İlgili bölümler

<CardGroup cols={2}>
  <Card title="Yürütme onayları - gelişmiş" href="/tr/tools/exec-approvals-advanced" icon="gear">
    Güvenli ikili dosyalar, yorumlayıcı bağlama ve onayların sohbete yönlendirilmesi.
  </Card>
  <Card title="Yürütme aracı" href="/tr/tools/exec" icon="terminal">
    Kabuk komutu çalıştırma aracı.
  </Card>
  <Card title="Yükseltilmiş mod" href="/tr/tools/elevated" icon="shield-exclamation">
    Onayları da atlayan acil durum yolu.
  </Card>
  <Card title="Korumalı alan kullanımı" href="/tr/gateway/sandboxing" icon="box">
    Korumalı alan modları ve çalışma alanı erişimi.
  </Card>
  <Card title="Güvenlik" href="/tr/gateway/security" icon="lock">
    Güvenlik modeli ve sıkılaştırma.
  </Card>
  <Card title="Korumalı alan, araç politikası ve yükseltilmiş mod karşılaştırması" href="/tr/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Her denetimin hangi durumda kullanılacağı.
  </Card>
  <Card title="Skills" href="/tr/tools/skills" icon="sparkles">
    Skills destekli otomatik izin davranışı.
  </Card>
</CardGroup>

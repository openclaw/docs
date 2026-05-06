---
read_when:
    - Ajanların düzeltmeleri veya yeniden kullanılabilir yordamları çalışma alanı Skills öğelerine dönüştürmesini istiyorsunuz
    - Prosedürel beceri belleğini yapılandırıyorsunuz
    - skill_workshop aracının davranışında hata ayıklıyorsunuz
    - Otomatik skill oluşturmayı etkinleştirip etkinleştirmemeye karar veriyorsunuz
summary: Yeniden kullanılabilir prosedürlerin inceleme, onay, karantina ve sıcak Skills yenileme ile çalışma alanı Skills olarak deneysel yakalanması
title: Skill atölyesi Plugin
x-i18n:
    generated_at: "2026-05-06T09:26:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03c4259777823d256bd00374858b9f47d310e727db360db37f9ba7ad3583d9dc
    source_path: plugins/skill-workshop.md
    workflow: 16
---

Skill Workshop **deneyseldir**. Varsayılan olarak devre dışıdır; yakalama
sezgiselleri ve gözden geçirici istemleri sürümler arasında değişebilir ve otomatik
yazmalar yalnızca bekleyen mod çıktısı önce gözden geçirildikten sonra güvenilir
çalışma alanlarında kullanılmalıdır.

Skill Workshop, çalışma alanı Skills'leri için prosedürel bellektir. Bir ajanın
yeniden kullanılabilir iş akışlarını, kullanıcı düzeltmelerini, zor kazanılmış
düzeltmeleri ve yinelenen tuzakları şu konumdaki `SKILL.md` dosyalarına
dönüştürmesini sağlar:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Bu, uzun vadeli bellekten farklıdır:

- **Bellek** olguları, tercihleri, varlıkları ve geçmiş bağlamı depolar.
- **Skills**, ajanın gelecekteki görevlerde izlemesi gereken yeniden kullanılabilir prosedürleri depolar.
- **Skill Workshop**, güvenlik denetimleri ve isteğe bağlı onayla, yararlı bir
  turdan kalıcı bir çalışma alanı becerisine giden köprüdür.

Skill Workshop, ajan şu tür bir prosedür öğrendiğinde yararlıdır:

- dış kaynaklı animasyonlu GIF varlıklarını doğrulama
- ekran görüntüsü varlıklarını değiştirme ve boyutları doğrulama
- depoya özgü bir QA senaryosu çalıştırma
- yinelenen bir sağlayıcı hatasını ayıklama
- eski bir yerel iş akışı notunu onarma

Şunlar için tasarlanmamıştır:

- "kullanıcı maviyi sever" gibi olgular
- geniş otobiyografik bellek
- ham döküm arşivleme
- sırlar, kimlik bilgileri veya gizli istem metni
- tekrarlanmayacak tek seferlik talimatlar

## Varsayılan durum

Paketli Plugin **deneyseldir** ve `plugins.entries.skill-workshop` içinde
açıkça etkinleştirilmediği sürece **varsayılan olarak devre dışıdır**.

Plugin bildirimi `enabledByDefault: true` ayarlamaz. Plugin yapılandırma
şemasındaki `enabled: true` varsayılanı yalnızca Plugin girdisi zaten seçilip
yüklendikten sonra geçerlidir.

Deneysel şu anlama gelir:

- Plugin, isteğe bağlı test ve iç kullanım için yeterince desteklenir
- öneri depolama, gözden geçirici eşikleri ve yakalama sezgiselleri gelişebilir
- bekleyen onay önerilen başlangıç modudur
- otomatik uygulama, paylaşılan veya düşmanca girdisi yoğun ortamlar için değil,
  güvenilir kişisel/çalışma alanı kurulumları içindir

## Etkinleştirme

En düşük güvenli yapılandırma:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "pending",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

Bu yapılandırmayla:

- `skill_workshop` aracı kullanılabilir
- açık yeniden kullanılabilir düzeltmeler bekleyen öneriler olarak kuyruğa alınır
- eşik tabanlı gözden geçirici geçişleri skill güncellemeleri önerebilir
- bekleyen bir öneri uygulanana kadar hiçbir skill dosyası yazılmaz

Otomatik yazmaları yalnızca güvenilir çalışma alanlarında kullanın:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "auto",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

`approvalPolicy: "auto"` yine aynı tarayıcıyı ve karantina yolunu kullanır.
Kritik bulguları olan önerileri uygulamaz.

## Yapılandırma

| Anahtar              | Varsayılan | Aralık / değerler                          | Anlam                                                                |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | Plugin girdisi yüklendikten sonra Plugin'i etkinleştirir.            |
| `autoCapture`        | `true`      | boolean                                     | Başarılı ajan turlarında tur sonrası yakalama/gözden geçirmeyi etkinleştirir. |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | Önerileri kuyruğa alır veya güvenli önerileri otomatik olarak yazar. |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | Açık düzeltme yakalamayı, LLM gözden geçiriciyi, ikisini birden veya hiçbirini seçer. |
| `reviewInterval`     | `15`        | `1..200`                                    | Bu kadar başarılı turdan sonra gözden geçiriciyi çalıştırır.         |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | Bu kadar gözlemlenen araç çağrısından sonra gözden geçiriciyi çalıştırır. |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | Gömülü gözden geçirici çalıştırması için zaman aşımı.                |
| `maxPending`         | `50`        | `1..200`                                    | Çalışma alanı başına tutulan en fazla bekleyen/karantinaya alınmış öneri. |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | Oluşturulan skill/destek dosyasının en büyük boyutu.                 |

Önerilen profiller:

```json5
// Tutucu: yalnızca açık araç kullanımı, otomatik yakalama yok.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Önce gözden geçirme: otomatik yakala, ancak onay gerektir.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Güvenilir otomasyon: güvenli önerileri hemen yaz.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Düşük maliyet: gözden geçirici LLM çağrısı yok, yalnızca açık düzeltme ifadeleri.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## Yakalama yolları

Skill Workshop'un üç yakalama yolu vardır.

### Araç önerileri

Model, yeniden kullanılabilir bir prosedür gördüğünde veya kullanıcı ondan bir
skill kaydetmesini/güncellemesini istediğinde doğrudan `skill_workshop` çağırabilir.

Bu en açık yoldur ve `autoCapture: false` ile bile çalışır.

### Sezgisel yakalama

`autoCapture` etkin olduğunda ve `reviewMode` `heuristic` veya `hybrid` olduğunda,
Plugin başarılı turları açık kullanıcı düzeltme ifadeleri için tarar:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

Sezgisel yöntem, en son eşleşen kullanıcı talimatından bir öneri oluşturur. Yaygın
iş akışları için skill adlarını seçmek üzere konu ipuçlarını kullanır:

- animasyonlu GIF görevleri -> `animated-gif-workflow`
- ekran görüntüsü veya varlık görevleri -> `screenshot-asset-workflow`
- QA veya senaryo görevleri -> `qa-scenario-workflow`
- GitHub PR görevleri -> `github-pr-workflow`
- geri dönüş -> `learned-workflows`

Sezgisel yakalama bilerek dardır. Genel döküm özetleme için değil, net düzeltmeler
ve tekrarlanabilir süreç notları içindir.

### LLM gözden geçirici

`autoCapture` etkin olduğunda ve `reviewMode` `llm` veya `hybrid` olduğunda, Plugin
eşiklere ulaşıldıktan sonra kompakt bir gömülü gözden geçirici çalıştırır.

Gözden geçirici şunları alır:

- son 12.000 karakterle sınırlandırılmış yakın tarihli döküm metni
- en fazla 12 mevcut çalışma alanı Skills'i
- her mevcut skill'den en fazla 2.000 karakter
- yalnızca JSON talimatları

Gözden geçiricinin araçları yoktur:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

Gözden geçirici ya `{ "action": "none" }` ya da bir öneri döndürür. `action` alanı `create`, `append` veya `replace` olur - ilgili bir skill zaten varsa `append`/`replace` tercih edin; `create` yalnızca uygun mevcut skill olmadığında kullanın.

Örnek `create`:

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "Media Asset QA",
  "reason": "Reusable animated media acceptance workflow",
  "description": "Validate externally sourced animated media before product use.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution.\n- Store a local approved copy.\n- Verify in product UI before final reply."
}
```

`append`, `section` + `body` ekler. `replace`, adlandırılmış skill içinde `oldText` değerini `newText` ile değiştirir.

## Öneri yaşam döngüsü

Oluşturulan her güncelleme şu alanlara sahip bir öneri olur:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- isteğe bağlı `agentId`
- isteğe bağlı `sessionId`
- `skillName`
- `title`
- `reason`
- `source`: `tool`, `agent_end` veya `reviewer`
- `status`
- `change`
- isteğe bağlı `scanFindings`
- isteğe bağlı `quarantineReason`

Öneri durumları:

- `pending` - onay bekliyor
- `applied` - `<workspace>/skills` konumuna yazıldı
- `rejected` - operatör/model tarafından reddedildi
- `quarantined` - kritik tarayıcı bulguları tarafından engellendi

Durum, Gateway durum dizini altında çalışma alanı başına saklanır:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Bekleyen ve karantinaya alınmış öneriler, skill adı ve değişiklik
yükü ile tekilleştirilir. Depo, en yeni bekleyen/karantinaya alınmış önerileri
`maxPending` sınırına kadar tutar.

## Araç referansı

Plugin bir agent aracı kaydeder:

```text
skill_workshop
```

### `status`

Etkin çalışma alanı için önerileri duruma göre sayar.

```json
{ "action": "status" }
```

Sonuç biçimi:

```json
{
  "workspaceDir": "/path/to/workspace",
  "pending": 1,
  "quarantined": 0,
  "applied": 3,
  "rejected": 0
}
```

### `list_pending`

Bekleyen önerileri listeler.

```json
{ "action": "list_pending" }
```

Başka bir durumu listelemek için:

```json
{ "action": "list_pending", "status": "applied" }
```

Geçerli `status` değerleri:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

Karantinaya alınmış önerileri listeler.

```json
{ "action": "list_quarantine" }
```

Otomatik yakalama hiçbir şey yapmıyor gibi göründüğünde ve günlüklerde
`skill-workshop: quarantined <skill>` geçtiğinde bunu kullanın.

### `inspect`

Bir öneriyi kimliğine göre getirir.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

Bir öneri oluşturur. `approvalPolicy: "pending"` (varsayılan) ile, yazmak yerine kuyruğa alır.

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "User established reusable GIF validation rules.",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify the URL resolves to image/gif.\n- Confirm it has multiple frames.\n- Record attribution and license.\n- Avoid hotlinking when a local asset is needed."
}
```

<AccordionGroup>
  <Accordion title="Force a safe write (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

  </Accordion>

  <Accordion title="Force pending under auto policy (apply: false)">

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

  </Accordion>

  <Accordion title="Append to a named section">

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

  </Accordion>

  <Accordion title="Replace exact text">

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

  </Accordion>
</AccordionGroup>

### `apply`

Bekleyen bir öneriyi uygular.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` karantinaya alınmış önerileri reddeder:

```text
quarantined proposal cannot be applied
```

### `reject`

Bir öneriyi reddedilmiş olarak işaretler.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

Mevcut veya önerilen bir skill dizini içine destek dosyası yazar.

İzin verilen üst düzey destek dizinleri:

- `references/`
- `templates/`
- `scripts/`
- `assets/`

Örnek:

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# Release Checklist\n\n- Run release docs.\n- Verify changelog.\n"
}
```

Destek dosyaları çalışma alanı kapsamlıdır, yol denetiminden geçer, `maxSkillBytes` ile bayt sınırına tabidir, taranır ve atomik olarak yazılır.

## Skill yazmaları

Skill Workshop yalnızca şunun altına yazar:

```text
<workspace>/skills/<normalized-skill-name>/
```

Skill adları normalleştirilir:

- küçük harfe çevrilir
- `[a-z0-9_-]` olmayan ardışık karakterler `-` olur
- baştaki/sondaki alfanümerik olmayan karakterler kaldırılır
- maksimum uzunluk 80 karakterdir
- son ad `[a-z0-9][a-z0-9_-]{1,79}` ile eşleşmelidir

`create` için:

- skill yoksa, Skill Workshop yeni bir `SKILL.md` yazar
- zaten varsa, Skill Workshop gövdeyi `## Workflow` bölümüne ekler

`append` için:

- skill varsa, Skill Workshop istenen bölüme ekler
- yoksa, Skill Workshop minimal bir skill oluşturur ve sonra ekler

`replace` için:

- skill zaten var olmalıdır
- `oldText` tam olarak mevcut olmalıdır
- yalnızca ilk tam eşleşme değiştirilir

Tüm yazmalar atomiktir ve bellek içi skills anlık görüntüsünü hemen yeniler; böylece yeni veya güncellenmiş skill, Gateway yeniden başlatması olmadan görünür hale gelebilir.

## Güvenlik modeli

Skill Workshop, oluşturulan `SKILL.md` içeriği ve destek dosyaları üzerinde bir güvenlik tarayıcısına sahiptir.

Kritik bulgular teklifleri karantinaya alır:

| Kural kimliği                          | Şunu yapan içeriği engeller...                                        |
| -------------------------------------- | --------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | ajana önceki/üst talimatları yok saymasını söyler                     |
| `prompt-injection-system`              | sistem promptlarına, geliştirici mesajlarına veya gizli talimatlara atıfta bulunur |
| `prompt-injection-tool`                | araç iznini/onayını atlatmayı teşvik eder                             |
| `shell-pipe-to-shell`                  | `sh`, `bash` veya `zsh` içine aktarılmış `curl`/`wget` içerir         |
| `secret-exfiltration`                  | env/süreç env verilerini ağ üzerinden gönderiyor gibi görünür         |

Uyarı bulguları tutulur ancak tek başına engellemez:

| Kural kimliği        | Şunlarda uyarır...                 |
| -------------------- | ---------------------------------- |
| `destructive-delete` | geniş kapsamlı `rm -rf` tarzı komutlar |
| `unsafe-permissions` | `chmod 777` tarzı izin kullanımı   |

Karantinaya alınan teklifler:

- `scanFindings` bilgisini tutar
- `quarantineReason` bilgisini tutar
- `list_quarantine` içinde görünür
- `apply` aracılığıyla uygulanamaz

Karantinaya alınmış bir tekliften kurtarmak için güvenli olmayan içerik kaldırılmış yeni ve güvenli bir teklif oluşturun. Depo JSON'unu elle düzenlemeyin.

## Prompt rehberliği

Etkinleştirildiğinde, Skill Workshop ajana kalıcı prosedürel bellek için `skill_workshop` kullanmasını söyleyen kısa bir prompt bölümü enjekte eder.

Rehberlik şunları vurgular:

- gerçekler/tercihler değil, prosedürler
- kullanıcı düzeltmeleri
- açık olmayan başarılı prosedürler
- tekrarlayan sorunlar
- bayat/zayıf/yanlış skill onarımını append/replace ile yapma
- uzun araç döngülerinden veya zor düzeltmelerden sonra yeniden kullanılabilir prosedürü kaydetme
- kısa emir kipinde skill metni
- transkript dökümleri yok

Yazma modu metni `approvalPolicy` ile değişir:

- pending modu: önerileri kuyruğa al; yalnızca açık onaydan sonra uygula
- auto modu: açıkça yeniden kullanılabilir olduğunda güvenli çalışma alanı skill güncellemelerini uygula

## Maliyetler ve çalışma zamanı davranışı

Sezgisel yakalama bir modeli çağırmaz.

LLM incelemesi, etkin/varsayılan ajan modeli üzerinde gömülü bir çalıştırma kullanır. Eşik tabanlıdır, bu nedenle varsayılan olarak her turda çalışmaz.

İnceleyici:

- mevcut olduğunda aynı yapılandırılmış sağlayıcı/model bağlamını kullanır
- çalışma zamanı ajan varsayılanlarına geri döner
- `reviewTimeoutMs` değerine sahiptir
- hafif bootstrap bağlamı kullanır
- araç içermez
- doğrudan hiçbir şey yazmaz
- yalnızca normal tarayıcıdan ve onay/karantina yolundan geçen bir teklif üretebilir

İnceleyici başarısız olursa, zaman aşımına uğrarsa veya geçersiz JSON döndürürse, Plugin bir uyarı/debug mesajı günlüğe yazar ve o inceleme geçişini atlar.

## Çalıştırma kalıpları

Kullanıcı şunları söylediğinde Skill Workshop kullanın:

- "next time, do X"
- "from now on, prefer Y"
- "make sure to verify Z"
- "save this as a workflow"
- "this took a while; remember the process"
- "update the local skill for this"

İyi skill metni:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

Kötü skill metni:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

Kötü sürümün kaydedilmemesi gereken nedenler:

- transkript biçiminde
- emir kipinde değil
- gürültülü, tek seferlik ayrıntılar içerir
- bir sonraki ajana ne yapacağını söylemez

## Hata ayıklama

Plugin'in yüklenip yüklenmediğini kontrol edin:

```bash
openclaw plugins list --enabled
```

Bir ajan/araç bağlamından teklif sayılarını kontrol edin:

```json
{ "action": "status" }
```

Bekleyen teklifleri inceleyin:

```json
{ "action": "list_pending" }
```

Karantinaya alınan teklifleri inceleyin:

```json
{ "action": "list_quarantine" }
```

Yaygın belirtiler:

| Belirti                              | Olası neden                                                                        | Kontrol                                                              |
| ------------------------------------ | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Araç kullanılamıyor                  | Plugin girdisi etkin değil                                                         | `plugins.entries.skill-workshop.enabled` ve `openclaw plugins list`  |
| Otomatik teklif görünmüyor           | `autoCapture: false`, `reviewMode: "off"` veya eşikler karşılanmadı                | Yapılandırma, teklif durumu, Gateway günlükleri                      |
| Sezgisel yakalama gerçekleşmedi      | Kullanıcı ifadesi düzeltme kalıplarıyla eşleşmedi                                  | Açık `skill_workshop.suggest` kullanın veya LLM inceleyiciyi etkinleştirin |
| İnceleyici teklif oluşturmadı        | İnceleyici `none`, geçersiz JSON döndürdü veya zaman aşımına uğradı                | Gateway günlükleri, `reviewTimeoutMs`, eşikler                       |
| Teklif uygulanmadı                   | `approvalPolicy: "pending"`                                                        | `list_pending`, sonra `apply`                                        |
| Teklif pending'den kayboldu          | Yinelenen teklif yeniden kullanıldı, maksimum pending budaması yapıldı veya uygulandı/reddedildi/karantinaya alındı | `status`, durum filtreleriyle `list_pending`, `list_quarantine`      |
| Skill dosyası var ama model kaçırıyor | Skill anlık görüntüsü yenilenmedi veya skill gating onu hariç tutuyor              | `openclaw skills` durumu ve çalışma alanı skill uygunluğu            |

İlgili günlükler:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## QA senaryoları

Repo destekli QA senaryoları:

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

Deterministik kapsamı çalıştırın:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

İnceleyici kapsamını çalıştırın:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

İnceleyici senaryosu bilinçli olarak ayrıdır çünkü `reviewMode: "llm"` etkinleştirir ve gömülü inceleyici geçişini çalıştırır.

## Otomatik uygulamanın ne zaman etkinleştirilmemesi gerekir

Şu durumlarda `approvalPolicy: "auto"` kullanmaktan kaçının:

- çalışma alanı hassas prosedürler içeriyorsa
- ajan güvenilmeyen girdi üzerinde çalışıyorsa
- skills geniş bir ekip genelinde paylaşılıyorsa
- promptları veya tarayıcı kurallarını hâlâ ayarlıyorsanız
- model sık sık düşmanca web/e-posta içeriği işliyorsa

Önce pending modunu kullanın. Auto moduna yalnızca ajanın o çalışma alanında önerdiği skills türünü inceledikten sonra geçin.

## İlgili belgeler

- [Skills](/tr/tools/skills)
- [Plugins](/tr/tools/plugin)
- [Test Etme](/tr/reference/test)

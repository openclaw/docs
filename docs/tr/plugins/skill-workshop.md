---
read_when:
    - Agent'lerin düzeltmeleri veya yeniden kullanılabilir prosedürleri çalışma alanı Skills'ine dönüştürmesini istiyorsunuz
    - Prosedürel skill belleğini yapılandırıyorsunuz
    - '`skill_workshop` araç davranışında hata ayıklıyorsunuz'
    - Otomatik Skill oluşturmayı etkinleştirip etkinleştirmemeye karar veriyorsunuz
summary: İnceleme, onay, karantina ve sıcak Skill yenilemesi ile yeniden kullanılabilir prosedürlerin çalışma alanı Skills'i olarak deneysel yakalanması
title: Skill workshop plugin'i
x-i18n:
    generated_at: "2026-04-24T09:24:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6063843bf15e639d7f5943db1bab52fbffce6ec30af350221d8b3cd711e227b
    source_path: plugins/skill-workshop.md
    workflow: 15
---

Skill Workshop **deneyseldir**. Varsayılan olarak devre dışıdır, yakalama
sezgiselleri ve reviewer prompt'ları sürümler arasında değişebilir ve otomatik
yazımlar yalnızca güvenilir çalışma alanlarında, önce bekleyen mod çıktısı incelendikten sonra kullanılmalıdır.

Skill Workshop, çalışma alanı Skills'i için prosedürel bellektir. Bir agent'in
yeniden kullanılabilir iş akışlarını, kullanıcı düzeltmelerini, zor kazanılmış düzeltmeleri ve tekrarlayan tuzakları şu konum altındaki `SKILL.md` dosyalarına dönüştürmesine izin verir:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Bu, uzun vadeli bellekten farklıdır:

- **Bellek**, gerçekleri, tercihleri, varlıkları ve geçmiş bağlamı depolar.
- **Skills**, agent'in gelecekteki görevlerde izlemesi gereken yeniden kullanılabilir prosedürleri depolar.
- **Skill Workshop**, yararlı bir turdan kalıcı bir çalışma alanı
  Skill'ine giden köprüdür; güvenlik denetimleri ve isteğe bağlı onay içerir.

Skill Workshop, agent aşağıdaki gibi bir prosedürü öğrendiğinde yararlıdır:

- dış kaynaklı hareketli GIF varlıklarını nasıl doğrulaması gerektiği
- ekran görüntüsü varlıklarını nasıl değiştireceği ve boyutları nasıl doğrulayacağı
- repo'ya özgü bir QA senaryosunun nasıl çalıştırılacağı
- tekrarlayan bir sağlayıcı hatasının nasıl hata ayıklanacağı
- eski bir yerel iş akışı notunun nasıl onarılacağı

Şunlar için tasarlanmamıştır:

- “kullanıcı maviyi sever” gibi gerçekler
- geniş otobiyografik bellek
- ham döküm arşivleme
- secret'lar, kimlik bilgileri veya gizli prompt metni
- tekrarlanmayacak tek seferlik talimatlar

## Varsayılan durum

Paketli plugin **deneyseldir** ve `plugins.entries.skill-workshop` içinde
açıkça etkinleştirilmedikçe varsayılan olarak **devre dışıdır**.

Plugin manifest'i `enabledByDefault: true` ayarlamaz. Plugin yapılandırma şeması içindeki `enabled: true`
varsayılanı yalnızca plugin girdisi zaten seçilip yüklendikten sonra geçerlidir.

Deneysel şunlar anlamına gelir:

- plugin, opt-in test ve dogfooding için yeterince desteklenir
- teklif depolama, reviewer eşikleri ve yakalama sezgiselleri gelişebilir
- bekleyen onay önerilen başlangıç modudur
- otomatik uygulama, paylaşılan veya düşmanca
  girdi ağırlıklı ortamlar için değil, güvenilir kişisel/çalışma alanı kurulumları içindir

## Etkinleştirme

Asgari güvenli yapılandırma:

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

- `skill_workshop` aracı kullanılabilir olur
- açık yeniden kullanılabilir düzeltmeler bekleyen teklifler olarak kuyruğa alınır
- eşik tabanlı reviewer geçişleri Skill güncellemeleri önerebilir
- bekleyen bir teklif uygulanana kadar hiçbir Skill dosyası yazılmaz

Otomatik yazımları yalnızca güvenilir çalışma alanlarında kullanın:

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

`approvalPolicy: "auto"` yine aynı tarayıcıyı ve karantina yolunu kullanır. Kritik bulguları olan teklifleri
uygulamaz.

## Yapılandırma

| Anahtar              | Varsayılan  | Aralık / değerler                            | Anlamı                                                               |
| -------------------- | ----------- | -------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                      | Plugin girdisi yüklendikten sonra plugin'i etkinleştirir.            |
| `autoCapture`        | `true`      | boolean                                      | Başarılı agent turlarından sonra otomatik yakalama/değerlendirmeyi etkinleştirir. |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                        | Teklifleri kuyruğa alır veya güvenli teklifleri otomatik yazar.      |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"`  | Açık düzeltme yakalamayı, LLM reviewer'ı, her ikisini veya hiçbirini seçer. |
| `reviewInterval`     | `15`        | `1..200`                                     | Bu kadar başarılı turdan sonra reviewer çalıştırılır.                |
| `reviewMinToolCalls` | `8`         | `1..500`                                     | Bu kadar gözlenen araç çağrısından sonra reviewer çalıştırılır.      |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                               | Gömülü reviewer çalıştırması için zaman aşımı.                       |
| `maxPending`         | `50`        | `1..200`                                     | Çalışma alanı başına tutulacak en fazla bekleyen/karantinaya alınmış teklif. |
| `maxSkillBytes`      | `40000`     | `1024..200000`                               | Üretilmiş Skill/destek dosyası için en büyük boyut.                  |

Önerilen profiller:

```json5
// Muhafazakâr: yalnızca açık araç kullanımı, otomatik yakalama yok.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Önce inceleme: otomatik yakala, ama onay gerektir.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Güvenilir otomasyon: güvenli teklifleri hemen yaz.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Düşük maliyet: reviewer LLM çağrısı yok, yalnızca açık düzeltme ifadeleri.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## Yakalama yolları

Skill Workshop'un üç yakalama yolu vardır.

### Araç önerileri

Model, yeniden kullanılabilir bir prosedür gördüğünde
veya kullanıcı ondan bir Skill kaydetmesini/güncellemesini istediğinde doğrudan `skill_workshop` çağırabilir.

Bu en açık yoldur ve `autoCapture: false` ile bile çalışır.

### Sezgisel yakalama

`autoCapture` etkinse ve `reviewMode` `heuristic` veya `hybrid` ise,
plugin başarılı turları açık kullanıcı düzeltme ifadeleri için tarar:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

Sezgisel, en son eşleşen kullanıcı talimatından bir teklif oluşturur. Yaygın iş akışları için Skill adlarını seçmek amacıyla
konu ipuçları kullanır:

- hareketli GIF görevleri -> `animated-gif-workflow`
- ekran görüntüsü veya varlık görevleri -> `screenshot-asset-workflow`
- QA veya senaryo görevleri -> `qa-scenario-workflow`
- GitHub PR görevleri -> `github-pr-workflow`
- fallback -> `learned-workflows`

Sezgisel yakalama bilerek dardır. Genel döküm özetleme için değil, açık düzeltmeler ve tekrar edebilir süreç notları içindir.

### LLM reviewer

`autoCapture` etkinse ve `reviewMode` `llm` veya `hybrid` ise, plugin
eşiklere ulaşıldığında kompakt bir gömülü reviewer çalıştırır.

Reviewer şunları alır:

- son 12.000 karakterle sınırlı son döküm metni
- en fazla 12 mevcut çalışma alanı Skill'i
- her mevcut Skill'den en fazla 2.000 karakter
- yalnızca JSON talimatları

Reviewer'ın aracı yoktur:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

Reviewer ya `{ "action": "none" }` ya da tek bir teklif döndürür. `action` alanı `create`, `append` veya `replace` olur — ilgili bir Skill zaten varsa `append`/`replace` tercih edin; yalnızca uygun mevcut bir Skill yoksa `create` kullanın.

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

`append`, `section` + `body` ekler. `replace`, adlandırılmış Skill içinde `oldText` değerini `newText` ile değiştirir.

## Teklif yaşam döngüsü

Her üretilmiş güncelleme şu alanlara sahip bir teklif olur:

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

Teklif durumları:

- `pending` - onay bekliyor
- `applied` - `<workspace>/skills` konumuna yazıldı
- `rejected` - operatör/model tarafından reddedildi
- `quarantined` - kritik tarayıcı bulguları nedeniyle engellendi

Durum, Gateway durum dizini altında çalışma alanı başına saklanır:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Bekleyen ve karantinaya alınmış teklifler, Skill adı ve değişiklik
payload'una göre tekilleştirilir. Depo, `maxPending`
üst sınırına kadar en yeni bekleyen/karantinaya alınmış teklifleri tutar.

## Araç başvurusu

Plugin tek bir agent aracı kaydeder:

```text
skill_workshop
```

### `status`

Etkin çalışma alanı için duruma göre teklifleri sayar.

```json
{ "action": "status" }
```

Sonuç şekli:

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

Bekleyen teklifleri listeler.

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

Karantinaya alınmış teklifleri listeler.

```json
{ "action": "list_quarantine" }
```

Bunu, otomatik yakalama hiçbir şey yapmıyor gibi göründüğünde ve günlüklerde
`skill-workshop: quarantined <skill>` geçtiğinde kullanın.

### `inspect`

Bir teklifi kimliğe göre getirir.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

Bir teklif oluşturur. `approvalPolicy: "pending"` (varsayılan) ile bu, yazmak yerine kuyruğa alır.

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
  <Accordion title="Güvenli yazmayı zorla (apply: true)">

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

  <Accordion title="Otomatik ilke altında bekleyen durumu zorla (apply: false)">

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

  <Accordion title="Adlandırılmış bir bölüme ekle">

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

  <Accordion title="Tam metni değiştir">

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

Bekleyen bir teklifi uygular.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply`, karantinaya alınmış teklifleri reddeder:

```text
quarantined proposal cannot be applied
```

### `reject`

Bir teklifi reddedilmiş olarak işaretler.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

Mevcut veya teklif edilen bir Skill dizini içinde destekleyici bir dosya yazar.

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

Destek dosyaları çalışma alanı kapsamlıdır, yol denetiminden geçer,
`maxSkillBytes` ile bayt sınırına tabi tutulur, taranır ve atomik olarak yazılır.

## Skill yazımları

Skill Workshop yalnızca şu konum altında yazar:

```text
<workspace>/skills/<normalized-skill-name>/
```

Skill adları normalize edilir:

- küçük harfe çevrilir
- `[a-z0-9_-]` dışındaki ardışık karakterler `-` olur
- baştaki/sondaki alfasayısal olmayan karakterler kaldırılır
- en fazla uzunluk 80 karakterdir
- son ad `[a-z0-9][a-z0-9_-]{1,79}` ile eşleşmelidir

`create` için:

- Skill yoksa Skill Workshop yeni bir `SKILL.md` yazar
- zaten varsa gövdeyi `## Workflow` altına ekler

`append` için:

- Skill varsa Skill Workshop istenen bölüme ekler
- yoksa Skill Workshop minimal bir Skill oluşturur ve sonra ekler

`replace` için:

- Skill zaten var olmalıdır
- `oldText` tam olarak mevcut olmalıdır
- yalnızca ilk tam eşleşme değiştirilir

Tüm yazımlar atomiktir ve bellek içi Skills anlık görüntüsünü hemen yeniler; böylece
yeni veya güncellenmiş Skill, Gateway yeniden başlatılmadan görünür olabilir.

## Güvenlik modeli

Skill Workshop, üretilen `SKILL.md` içeriği ve destek
dosyaları üzerinde bir güvenlik tarayıcısına sahiptir.

Kritik bulgular teklifleri karantinaya alır:

| Kural kimliği                          | Şu içeriği engeller...                                                |
| -------------------------------------- | --------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | agent'e önceki/daha üst talimatları yok saymasını söylüyorsa          |
| `prompt-injection-system`              | sistem prompt'larına, geliştirici mesajlarına veya gizli talimatlara atıf yapıyorsa |
| `prompt-injection-tool`                | araç izni/onayı atlamayı teşvik ediyorsa                              |
| `shell-pipe-to-shell`                  | `curl`/`wget` komutlarını `sh`, `bash` veya `zsh` içine pipe ediyorsa |
| `secret-exfiltration`                  | env/süreç env verilerini ağ üzerinden gönderiyor gibi görünüyorsa     |

Uyarı bulguları tutulur ama tek başına engellemez:

| Kural kimliği         | Şu durumlarda uyarır...             |
| --------------------- | ----------------------------------- |
| `destructive-delete`  | geniş `rm -rf` tarzı komutlar       |
| `unsafe-permissions`  | `chmod 777` tarzı izin kullanımı    |

Karantinaya alınmış teklifler:

- `scanFindings` alanını korur
- `quarantineReason` alanını korur
- `list_quarantine` içinde görünür
- `apply` üzerinden uygulanamaz

Karantinaya alınmış bir tekliften kurtulmak için, güvensiz içerik kaldırılmış
yeni güvenli bir teklif oluşturun. Depo JSON'unu elle düzenlemeyin.

## Prompt rehberliği

Skill Workshop etkin olduğunda, agent'e
kalıcı prosedürel bellek için `skill_workshop` kullanmasını söyleyen kısa bir prompt bölümü enjekte eder.

Rehberlik şunları vurgular:

- gerçekler/tercihler değil, prosedürler
- kullanıcı düzeltmeleri
- açık olmayan başarılı prosedürler
- tekrarlayan tuzaklar
- append/replace üzerinden eski/zayıf/yanlış Skill onarımı
- uzun araç döngülerinden veya zor düzeltmelerden sonra yeniden kullanılabilir prosedürü kaydetme
- kısa emir kipinde Skill metni
- döküm yığınları yok

Yazım modu metni `approvalPolicy` ile değişir:

- pending modu: önerileri kuyruğa al; yalnızca açık onaydan sonra uygula
- auto modu: açıkça yeniden kullanılabilir olduğunda güvenli çalışma alanı Skill güncellemelerini uygula

## Maliyetler ve çalışma zamanı davranışı

Sezgisel yakalama bir model çağırmaz.

LLM değerlendirmesi, etkin/varsayılan agent modeli üzerinde gömülü bir çalıştırma kullanır. Eşik tabanlıdır; bu nedenle varsayılan olarak her turda çalışmaz.

Reviewer:

- mümkün olduğunda aynı yapılandırılmış sağlayıcı/model bağlamını kullanır
- çalışma zamanı agent varsayılanlarına geri düşer
- `reviewTimeoutMs` kullanır
- hafif bootstrap bağlamı kullanır
- aracı yoktur
- doğrudan hiçbir şey yazmaz
- yalnızca normal tarayıcıdan ve
  onay/karantina yolundan geçen bir teklif üretebilir

Reviewer başarısız olursa, zaman aşımına uğrarsa veya geçersiz JSON döndürürse plugin bir
uyarı/hata ayıklama mesajı günlüğe yazar ve o değerlendirme geçişini atlar.

## İşletim desenleri

Skill Workshop'u kullanıcı şunları söylediğinde kullanın:

- “next time, do X”
- “from now on, prefer Y”
- “make sure to verify Z”
- “save this as a workflow”
- “this took a while; remember the process”
- “update the local skill for this”

İyi Skill metni:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

Zayıf Skill metni:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

Zayıf sürümün kaydedilmemesi gereken nedenler:

- döküm şeklindedir
- emir kipinde değildir
- gürültülü tek seferlik ayrıntılar içerir
- sonraki agent'e ne yapacağını söylemez

## Hata ayıklama

Plugin'in yüklenip yüklenmediğini kontrol edin:

```bash
openclaw plugins list --enabled
```

Bir agent/araç bağlamından teklif sayılarını kontrol edin:

```json
{ "action": "status" }
```

Bekleyen teklifleri inceleyin:

```json
{ "action": "list_pending" }
```

Karantinaya alınmış teklifleri inceleyin:

```json
{ "action": "list_quarantine" }
```

Yaygın belirtiler:

| Belirti                               | Olası neden                                                                         | Kontrol                                                               |
| ------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Araç kullanılamıyor                   | Plugin girdisi etkin değil                                                          | `plugins.entries.skill-workshop.enabled` ve `openclaw plugins list`   |
| Otomatik teklif görünmüyor            | `autoCapture: false`, `reviewMode: "off"` veya eşikler karşılanmadı                 | Yapılandırma, teklif durumu, Gateway günlükleri                       |
| Sezgisel yakalama yapmadı             | Kullanıcı ifadesi düzeltme desenleriyle eşleşmedi                                   | Açık `skill_workshop.suggest` kullanın veya LLM reviewer'ı etkinleştirin |
| Reviewer teklif oluşturmadı           | Reviewer `none`, geçersiz JSON döndürdü veya zaman aşımına uğradı                   | Gateway günlükleri, `reviewTimeoutMs`, eşikler                        |
| Teklif uygulanmıyor                   | `approvalPolicy: "pending"`                                                         | `list_pending`, ardından `apply`                                      |
| Teklif pending'den kayboldu           | Yinelenen teklif yeniden kullanıldı, max pending budaması oldu veya uygulandı/reddedildi/karantinaya alındı | `status`, durum filtreleriyle `list_pending`, `list_quarantine`       |
| Skill dosyası var ama model görmüyor  | Skill anlık görüntüsü yenilenmedi veya Skill geçitlemesi bunu dışlıyor              | `openclaw skills` durumu ve çalışma alanı Skill uygunluğu             |

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

Reviewer kapsamını çalıştırın:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

Reviewer senaryosu bilerek ayrıdır; çünkü
`reviewMode: "llm"` etkinleştirir ve gömülü reviewer geçişini dener.

## Auto apply ne zaman etkinleştirilmemeli

Şu durumlarda `approvalPolicy: "auto"` kullanmaktan kaçının:

- çalışma alanı hassas prosedürler içeriyorsa
- agent güvenilmeyen girdi üzerinde çalışıyorsa
- Skills geniş bir ekip arasında paylaşılıyorsa
- prompt'ları veya tarayıcı kurallarını hâlâ ayarlıyorsanız
- model sık sık düşmanca web/e-posta içeriği işliyorsa

Önce pending modunu kullanın. Yalnızca agent'in o çalışma alanında önerdiği
Skills türünü gözden geçirdikten sonra auto moduna geçin.

## İlgili belgeler

- [Skills](/tr/tools/skills)
- [Plugins](/tr/tools/plugin)
- [Testing](/tr/reference/test)

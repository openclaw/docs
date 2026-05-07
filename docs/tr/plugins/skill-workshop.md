---
read_when:
    - Ajanların düzeltmeleri veya yeniden kullanılabilir prosedürleri çalışma alanı Skills'lerine dönüştürmesini istiyorsunuz
    - Prosedürel beceri belleğini yapılandırıyorsunuz
    - skill_workshop aracının davranışında hata ayıklıyorsunuz
    - Otomatik beceri oluşturmayı etkinleştirip etkinleştirmemeye karar veriyorsunuz
summary: Yeniden kullanılabilir prosedürlerin inceleme, onay, karantina ve sıcak Skills yenileme ile çalışma alanı Skills olarak deneysel yakalanması
title: Skill atölyesi plugin’i
x-i18n:
    generated_at: "2026-05-07T13:24:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7dc89644a1ac1d7400b8a03d7a132c1e836b3aca96e66018710945637d5c393
    source_path: plugins/skill-workshop.md
    workflow: 16
---

Skill Workshop **deneyseldir**. Varsayılan olarak devre dışıdır; yakalama
sezgiselleri ve gözden geçirici istemleri sürümler arasında değişebilir ve
otomatik yazma işlemleri yalnızca güvenilen çalışma alanlarında, önce bekleyen mod
çıktısı incelendikten sonra kullanılmalıdır.

Skill Workshop, çalışma alanı Skills için prosedürel bellektir. Bir ajanın
yeniden kullanılabilir iş akışlarını, kullanıcı düzeltmelerini, güçlükle edinilmiş
düzeltmeleri ve yinelenen tuzakları şu konum altındaki `SKILL.md` dosyalarına
dönüştürmesini sağlar:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Bu, uzun vadeli bellekten farklıdır:

- **Bellek** olguları, tercihleri, varlıkları ve geçmiş bağlamı depolar.
- **Skills**, ajanın gelecekteki görevlerde izlemesi gereken yeniden kullanılabilir prosedürleri depolar.
- **Skill Workshop**, faydalı bir turdan kalıcı bir çalışma alanı becerisine giden,
  güvenlik kontrolleri ve isteğe bağlı onay içeren köprüdür.

Skill Workshop, ajan şu tür bir prosedür öğrendiğinde yararlıdır:

- harici kaynaklı animasyonlu GIF varlıklarının nasıl doğrulanacağı
- ekran görüntüsü varlıklarının nasıl değiştirileceği ve boyutların nasıl doğrulanacağı
- depoya özgü bir QA senaryosunun nasıl çalıştırılacağı
- yinelenen bir sağlayıcı hatasının nasıl ayıklanacağı
- bayat bir yerel iş akışı notunun nasıl onarılacağı

Şunlar için tasarlanmamıştır:

- "kullanıcı maviyi sever" gibi olgular
- geniş otobiyografik bellek
- ham konuşma dökümü arşivleme
- sırlar, kimlik bilgileri veya gizli istem metni
- tekrarlanmayacak tek seferlik talimatlar

## Varsayılan durum

Paketle gelen Plugin **deneyseldir** ve `plugins.entries.skill-workshop` içinde
açıkça etkinleştirilmediği sürece **varsayılan olarak devre dışıdır**.

Plugin manifesti `enabledByDefault: true` ayarlamaz. Plugin yapılandırma şeması
içindeki `enabled: true` varsayılanı yalnızca Plugin girdisi zaten seçilip
yüklendikten sonra geçerlidir.

Deneysel şu anlama gelir:

- Plugin, isteğe bağlı test ve dogfooding için yeterince desteklenir
- öneri depolama, gözden geçirici eşikleri ve yakalama sezgiselleri evrilebilir
- bekleyen onay önerilen başlangıç modudur
- otomatik uygulama, paylaşılan veya düşmanca girdisi yoğun ortamlar için değil,
  güvenilen kişisel/çalışma alanı kurulumları içindir

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
- eşik tabanlı gözden geçirici geçişleri beceri güncellemeleri önerebilir
- bekleyen bir öneri uygulanana kadar hiçbir beceri dosyası yazılmaz

Otomatik yazma işlemlerini yalnızca güvenilen çalışma alanlarında kullanın:

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

`approvalPolicy: "auto"` yine aynı tarayıcıyı ve karantina yolunu kullanır. Kritik bulguları olan önerileri uygulamaz.

## Yapılandırma

| Anahtar              | Varsayılan | Aralık / değerler                          | Anlam                                                                |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | Plugin girdisi yüklendikten sonra Plugin'i etkinleştirir.           |
| `autoCapture`        | `true`      | boolean                                     | Başarılı ajan turlarında tur sonrası yakalama/gözden geçirmeyi etkinleştirir. |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | Önerileri kuyruğa alır veya güvenli önerileri otomatik olarak yazar. |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | Açık düzeltme yakalamayı, LLM gözden geçiricisini, ikisini birden veya hiçbirini seçer. |
| `reviewInterval`     | `15`        | `1..200`                                    | Bu kadar başarılı turdan sonra gözden geçiriciyi çalıştırır.        |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | Bu kadar gözlemlenen araç çağrısından sonra gözden geçiriciyi çalıştırır. |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | Gömülü gözden geçirici çalışması için zaman aşımı.                  |
| `maxPending`         | `50`        | `1..200`                                    | Çalışma alanı başına tutulacak en fazla bekleyen/karantinaya alınmış öneri sayısı. |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | Oluşturulan beceri/destek dosyasının en büyük boyutu.               |

Önerilen profiller:

```json5
// Conservative: explicit tool use only, no automatic capture.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Review-first: capture automatically, but require approval.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Trusted automation: write safe proposals immediately.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Low-cost: no reviewer LLM call, only explicit correction phrases.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## Yakalama yolları

Skill Workshop'un üç yakalama yolu vardır.

### Araç önerileri

Model, yeniden kullanılabilir bir prosedür gördüğünde veya kullanıcı ondan bir beceriyi kaydetmesini/güncellemesini istediğinde doğrudan `skill_workshop` çağrısı yapabilir.

Bu en açık yoldur ve `autoCapture: false` ile bile çalışır.

### Sezgisel yakalama

`autoCapture` etkinleştirildiğinde ve `reviewMode` `heuristic` veya `hybrid` olduğunda,
Plugin başarılı turları açık kullanıcı düzeltme ifadeleri için tarar:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

Sezgisel yöntem, en son eşleşen kullanıcı talimatından bir öneri oluşturur. Yaygın iş akışları için beceri adlarını seçmek üzere konu ipuçlarını kullanır:

- animasyonlu GIF görevleri -> `animated-gif-workflow`
- ekran görüntüsü veya varlık görevleri -> `screenshot-asset-workflow`
- QA veya senaryo görevleri -> `qa-scenario-workflow`
- GitHub PR görevleri -> `github-pr-workflow`
- yedek -> `learned-workflows`

Sezgisel yakalama özellikle dar tutulmuştur. Genel konuşma dökümü özetleme için değil,
net düzeltmeler ve tekrarlanabilir süreç notları içindir.

### LLM gözden geçiricisi

`autoCapture` etkinleştirildiğinde ve `reviewMode` `llm` veya `hybrid` olduğunda,
Plugin eşiklere ulaşıldıktan sonra kompakt bir gömülü gözden geçirici çalıştırır.

Gözden geçirici şunları alır:

- son 12.000 karakterle sınırlandırılmış yakın tarihli konuşma dökümü metni
- en fazla 12 mevcut çalışma alanı Skills
- her mevcut beceriden en fazla 2.000 karakter
- yalnızca JSON talimatları

Gözden geçiricinin araçları yoktur:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

Gözden geçirici ya `{ "action": "none" }` ya da tek bir öneri döndürür. `action` alanı `create`, `append` veya `replace` olur - ilgili bir beceri zaten varsa `append`/`replace` tercih edin; `create` yalnızca mevcut hiçbir beceri uygun olmadığında kullanın.

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

`append`, `section` + `body` ekler. `replace`, adlandırılmış beceride `oldText` değerini `newText` ile değiştirir.

## Öneri yaşam döngüsü

Oluşturulan her güncelleme şu alanlara sahip bir öneriye dönüşür:

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

Durum, Gateway durum dizini altında her çalışma alanı için ayrı saklanır:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Bekleyen ve karantinaya alınan öneriler, skill adı ve değişiklik
yüküyle tekilleştirilir. Depo, en yeni bekleyen/karantinaya alınan önerileri
`maxPending` sınırına kadar tutar.

## Araç başvurusu

Plugin bir agent aracı kaydeder:

```text
skill_workshop
```

### `status`

Etkin çalışma alanı için önerileri duruma göre sayın.

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

Bekleyen önerileri listeleyin.

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

Karantinaya alınan önerileri listeleyin.

```json
{ "action": "list_quarantine" }
```

Otomatik yakalama hiçbir şey yapmıyor gibi göründüğünde ve günlüklerde
`skill-workshop: quarantined <skill>` geçtiğinde bunu kullanın.

### `inspect`

Kimliğe göre bir öneri getirin.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

Bir öneri oluşturun. `approvalPolicy: "pending"` (varsayılan) ile bu, yazmak yerine kuyruğa alır.

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
  <Accordion title="Otomatik modda anında yazma iste (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

`approvalPolicy: "pending"` ile `apply: true` yine de öneriyi kuyruğa alır. Gözden geçirin, ardından onaydan sonra
`apply` eylemini kullanın.

  </Accordion>

  <Accordion title="Otomatik ilke altında beklemeye zorla (apply: false)">

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

Bekleyen bir öneriyi uygulayın.

`approvalPolicy: "pending"` ile bu eylem, çalışma alanı skill'ini yazmadan önce operatör onayı ister.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply`, karantinaya alınan önerileri reddeder:

```text
quarantined proposal cannot be applied
```

### `reject`

Bir öneriyi reddedildi olarak işaretleyin.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

Mevcut veya önerilen bir skill dizininin içine destekleyici bir dosya yazın.

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

Destek dosyaları çalışma alanı kapsamındadır, yol denetiminden geçirilir, `maxSkillBytes` ile bayt açısından sınırlandırılır, taranır ve atomik olarak yazılır.

## Skill yazımları

Skill Workshop yalnızca şunun altına yazar:

```text
<workspace>/skills/<normalized-skill-name>/
```

Skill adları normalleştirilir:

- küçük harfe çevrilir
- `[a-z0-9_-]` olmayan diziler `-` olur
- baştaki/sondaki alfasayısal olmayan karakterler kaldırılır
- azami uzunluk 80 karakterdir
- son ad `[a-z0-9][a-z0-9_-]{1,79}` ile eşleşmelidir

`create` için:

- Skill yoksa Skill Workshop yeni bir `SKILL.md` yazar
- zaten varsa Skill Workshop gövdeyi `## Workflow` bölümüne ekler

`append` için:

- Skill varsa Skill Workshop istenen bölüme ekler
- yoksa Skill Workshop asgari bir Skill oluşturur ve ardından ekler

`replace` için:

- Skill zaten var olmalıdır
- `oldText` tam olarak bulunmalıdır
- yalnızca ilk tam eşleşme değiştirilir

Tüm yazımlar atomiktir ve bellek içi Skills anlık görüntüsünü hemen yeniler; böylece yeni veya güncellenmiş Skill, Gateway yeniden başlatması olmadan görünür hale gelebilir.

## Güvenlik modeli

Skill Workshop, oluşturulan `SKILL.md` içeriği ve destek dosyaları üzerinde bir güvenlik tarayıcısına sahiptir.

Kritik bulgular önerileri karantinaya alır:

| Kural kimliği                         | Şunu yapan içeriği engeller...                                        |
| -------------------------------------- | --------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | aracı önceki/üst talimatları yok saymaya yönlendiren                  |
| `prompt-injection-system`              | sistem istemlerine, geliştirici mesajlarına veya gizli talimatlara atıf yapan |
| `prompt-injection-tool`                | araç iznini/onayını atlatmayı teşvik eden                             |
| `shell-pipe-to-shell`                  | `sh`, `bash` veya `zsh` içine aktarılan `curl`/`wget` içeren          |
| `secret-exfiltration`                  | env/süreç env verilerini ağ üzerinden gönderiyor gibi görünen         |

Uyarı bulguları korunur ancak tek başlarına engellemez:

| Kural kimliği        | Şunun için uyarır...              |
| -------------------- | -------------------------------- |
| `destructive-delete` | geniş kapsamlı `rm -rf` tarzı komutlar |
| `unsafe-permissions` | `chmod 777` tarzı izin kullanımı |

Karantinaya alınmış öneriler:

- `scanFindings` öğesini korur
- `quarantineReason` öğesini korur
- `list_quarantine` içinde görünür
- `apply` üzerinden uygulanamaz

Karantinaya alınmış bir öneriden kurtulmak için güvenli olmayan içerik kaldırılmış yeni ve güvenli bir öneri oluşturun. Depo JSON dosyasını elle düzenlemeyin.

## İstem rehberliği

Etkinleştirildiğinde Skill Workshop, aracı kalıcı prosedürel bellek için `skill_workshop` kullanmaya yönlendiren kısa bir istem bölümü enjekte eder.

Rehberlik şunları vurgular:

- olgular/tercihler değil, prosedürler
- kullanıcı düzeltmeleri
- açık olmayan başarılı prosedürler
- yinelenen tuzaklar
- ekleme/değiştirme yoluyla eski/zayıf/yanlış Skill onarımı
- uzun araç döngülerinden veya zor düzeltmelerden sonra yeniden kullanılabilir prosedürü kaydetme
- kısa, emir kipindeki Skill metni
- transcript dökümleri yok

Yazma modu metni `approvalPolicy` ile değişir:

- bekleyen mod: önerileri kuyruğa al; açık onaydan sonra `apply` kullan
- otomatik mod: `apply: false` bunun yerine kuyruğa almadıkça güvenli çalışma alanı Skill güncellemelerini uygula

## Maliyetler ve çalışma zamanı davranışı

Sezgisel yakalama bir modeli çağırmaz.

LLM incelemesi, etkin/varsayılan aracı modeli üzerinde gömülü bir çalıştırma kullanır. Eşik tabanlıdır; bu yüzden varsayılan olarak her turda çalışmaz.

İnceleyici:

- mevcut olduğunda aynı yapılandırılmış sağlayıcı/model bağlamını kullanır
- çalışma zamanı aracı varsayılanlarına geri döner
- `reviewTimeoutMs` içerir
- hafif önyükleme bağlamı kullanır
- araç içermez
- doğrudan hiçbir şey yazmaz
- yalnızca normal tarayıcıdan ve onay/karantina yolundan geçen bir öneri üretebilir

İnceleyici başarısız olursa, zaman aşımına uğrarsa veya geçersiz JSON döndürürse Plugin bir uyarı/hata ayıklama mesajı kaydeder ve o inceleme geçişini atlar.

## Çalışma kalıpları

Kullanıcı şunları söylediğinde Skill Workshop kullanın:

- "next time, do X"
- "from now on, prefer Y"
- "make sure to verify Z"
- "save this as a workflow"
- "this took a while; remember the process"
- "update the local skill for this"

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

- transcript biçiminde
- emir kipinde değil
- gürültülü tek seferlik ayrıntılar içerir
- sonraki araca ne yapacağını söylemez

## Hata ayıklama

Plugin’in yüklenip yüklenmediğini kontrol edin:

```bash
openclaw plugins list --enabled
```

Bir aracı/araç bağlamından öneri sayılarını kontrol edin:

```json
{ "action": "status" }
```

Bekleyen önerileri inceleyin:

```json
{ "action": "list_pending" }
```

Karantinaya alınmış önerileri inceleyin:

```json
{ "action": "list_quarantine" }
```

Yaygın belirtiler:

| Belirti                              | Olası neden                                                                         | Kontrol                                                              |
| ------------------------------------ | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Araç kullanılamıyor                  | Plugin girdisi etkin değil                                                          | `plugins.entries.skill-workshop.enabled` ve `openclaw plugins list`  |
| Otomatik öneri görünmüyor            | `autoCapture: false`, `reviewMode: "off"` veya eşikler karşılanmadı                 | Yapılandırma, öneri durumu, Gateway günlükleri                       |
| Sezgisel yakalama yapmadı            | Kullanıcı ifadeleri düzeltme kalıplarıyla eşleşmedi                                 | Açık `skill_workshop.suggest` kullanın veya LLM inceleyicisini etkinleştirin |
| İnceleyici öneri oluşturmadı         | İnceleyici `none`, geçersiz JSON döndürdü veya zaman aşımına uğradı                 | Gateway günlükleri, `reviewTimeoutMs`, eşikler                       |
| Öneri uygulanmıyor                   | `approvalPolicy: "pending"`                                                         | `list_pending`, ardından `apply`                                     |
| Öneri bekleyenlerden kayboldu        | Yinelenen öneri yeniden kullanıldı, azami bekleyen budaması yapıldı veya uygulandı/reddedildi/karantinaya alındı | `status`, durum filtreleriyle `list_pending`, `list_quarantine`      |
| Skill dosyası var ancak model kaçırıyor | Skill anlık görüntüsü yenilenmedi veya Skill geçitlemesi onu dışlıyor              | `openclaw skills` durumu ve çalışma alanı Skill uygunluğu            |

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

İnceleyici senaryosu özellikle ayrıdır çünkü `reviewMode: "llm"` öğesini etkinleştirir ve gömülü inceleyici geçişini sınar.

## Otomatik uygulama ne zaman etkinleştirilmemeli

Şu durumlarda `approvalPolicy: "auto"` kullanmaktan kaçının:

- çalışma alanı hassas prosedürler içeriyorsa
- aracı güvenilmeyen girdi üzerinde çalışıyorsa
- Skills geniş bir ekip genelinde paylaşılıyorsa
- istemleri veya tarayıcı kurallarını hâlâ ayarlıyorsanız
- model sık sık düşmanca web/e-posta içeriği işliyorsa

Önce bekleyen modu kullanın. Otomatik moda yalnızca aracının o çalışma alanında önerdiği Skills türünü inceledikten sonra geçin.

## İlgili belgeler

- [Skills](/tr/tools/skills)
- [Plugins](/tr/tools/plugin)
- [Test Etme](/tr/reference/test)

---
read_when:
    - Aracıların düzeltmeleri veya yeniden kullanılabilir prosedürleri çalışma alanı Skills’ına dönüştürmesini istiyorsunuz
    - Prosedürel beceri belleğini yapılandırıyorsunuz
    - '`skill_workshop` aracı davranışını ayıklıyorsunuz'
    - Otomatik beceri oluşturmayı etkinleştirip etkinleştirmemeye karar veriyorsunuz
summary: İnceleme, onay, karantina ve anlık Skills yenilemesi ile yeniden kullanılabilir prosedürlerin çalışma alanı Skills olarak deneysel yakalanması
title: Skill Workshop Plugini
x-i18n:
    generated_at: "2026-04-22T04:26:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62dcb3e1a71999bfc39a95dc3d0984d3446c8a58f7d91a914dfc7256b4e79601
    source_path: plugins/skill-workshop.md
    workflow: 15
---

# Skill Workshop Plugini

Skill Workshop **deneyseldir**. Varsayılan olarak devre dışıdır, yakalama
sezgiselleri ve gözden geçiren istemleri sürümler arasında değişebilir ve
otomatik yazmalar yalnızca önce bekleyen mod çıktısı incelendikten sonra güvenilen çalışma alanlarında kullanılmalıdır.

Skill Workshop, çalışma alanı Skills için prosedürel bellektir. Bir aracının
yeniden kullanılabilir iş akışlarını, kullanıcı düzeltmelerini, zor elde edilen düzeltmeleri ve tekrarlayan sorun noktalarını şuradaki `SKILL.md` dosyalarına dönüştürmesine izin verir:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Bu, uzun vadeli bellekten farklıdır:

- **Memory** gerçekleri, tercihleri, varlıkları ve geçmiş bağlamı depolar.
- **Skills** aracının gelecekteki görevlerde izlemesi gereken yeniden kullanılabilir prosedürleri depolar.
- **Skill Workshop**, yararlı bir dönüşten kalıcı bir çalışma alanı becerisine
  giden köprüdür; güvenlik denetimleri ve isteğe bağlı onay içerir.

Skill Workshop, aracının şu gibi bir prosedürü öğrendiği durumlarda yararlıdır:

- dış kaynaklı animasyonlu GIF varlıklarını nasıl doğrulayacağı
- ekran görüntüsü varlıklarını nasıl değiştireceği ve boyutları nasıl doğrulayacağı
- depoya özgü bir QA senaryosunu nasıl çalıştıracağı
- tekrarlayan bir sağlayıcı arızasını nasıl ayıklayacağı
- bayat bir yerel iş akışı notunu nasıl onaracağı

Şunlar için tasarlanmamıştır:

- “kullanıcı maviyi sever” gibi gerçekler
- geniş otobiyografik bellek
- ham transcript arşivleme
- sırlar, kimlik bilgileri veya gizli istem metni
- tekrar etmeyecek tek seferlik talimatlar

## Varsayılan Durum

Paketlenmiş plugin **deneyseldir** ve `plugins.entries.skill-workshop` içinde
açıkça etkinleştirilmediği sürece **varsayılan olarak devre dışıdır**.

Plugin manifesti `enabledByDefault: true` ayarlamaz. Plugin yapılandırma şeması içindeki `enabled: true`
varsayılanı yalnızca plugin girdisi zaten seçilip yüklendikten sonra uygulanır.

Deneysel şu anlama gelir:

- plugin, isteğe bağlı test ve dogfooding için yeterince desteklenir
- öneri depolama, gözden geçiren eşikleri ve yakalama sezgiselleri gelişebilir
- bekleyen onay önerilen başlangıç modudur
- otomatik uygulama, güvenilen kişisel/çalışma alanı kurulumları içindir; paylaşılan veya düşmanca
  girdi ağırlıklı ortamlar için değildir

## Etkinleştir

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
- açık yeniden kullanılabilir düzeltmeler bekleyen öneriler olarak kuyruğa alınır
- eşik tabanlı gözden geçiren geçişleri beceri güncellemeleri önerebilir
- bekleyen bir öneri uygulanana kadar hiçbir beceri dosyası yazılmaz

Otomatik yazmaları yalnızca güvenilen çalışma alanlarında kullanın:

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
Kritik bulgular içeren önerileri uygulamaz.

## Yapılandırma

| Anahtar              | Varsayılan  | Aralık / değerler                            | Anlamı                                                              |
| -------------------- | ----------- | -------------------------------------------- | ------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                      | Plugin girdisi yüklendikten sonra plugin’i etkinleştirir.           |
| `autoCapture`        | `true`      | boolean                                      | Başarılı aracı dönüşlerinde dönüş sonrası yakalama/gözden geçirmeyi etkinleştirir. |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                        | Önerileri kuyruğa alır veya güvenli önerileri otomatik yazar.       |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"`  | Açık düzeltme yakalamayı, LLM gözden geçiricisini, ikisini veya hiçbirini seçer. |
| `reviewInterval`     | `15`        | `1..200`                                     | Gözden geçiriciyi bu kadar başarılı dönüşten sonra çalıştırır.      |
| `reviewMinToolCalls` | `8`         | `1..500`                                     | Gözden geçiriciyi bu kadar gözlenen araç çağrısından sonra çalıştırır. |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                               | Gömülü gözden geçiren çalıştırması için zaman aşımı.                |
| `maxPending`         | `50`        | `1..200`                                     | Çalışma alanı başına tutulan en fazla bekleyen/karantinadaki öneri. |
| `maxSkillBytes`      | `40000`     | `1024..200000`                               | Üretilen beceri/destek dosyası için en büyük boyut.                 |

Önerilen profiller:

```json5
// Muhafazakar: yalnızca açık araç kullanımı, otomatik yakalama yok.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Önce gözden geçir: otomatik yakala, ama onay gerektir.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Güvenilen otomasyon: güvenli önerileri hemen yaz.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Düşük maliyet: gözden geçiren LLM çağrısı yok, yalnızca açık düzeltme ifadeleri.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## Yakalama Yolları

Skill Workshop’un üç yakalama yolu vardır.

### Araç Önerileri

Model, yeniden kullanılabilir bir prosedür gördüğünde
veya kullanıcı ondan bir beceriyi kaydetmesini/güncellemesini istediğinde doğrudan `skill_workshop` çağırabilir.

Bu en açık yoldur ve `autoCapture: false` ile bile çalışır.

### Sezgisel Yakalama

`autoCapture` etkinse ve `reviewMode` `heuristic` veya `hybrid` ise,
plugin başarılı dönüşleri açık kullanıcı düzeltme ifadeleri için tarar:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

Sezgisel, eşleşen en son kullanıcı talimatından bir öneri oluşturur. Yaygın iş akışları için beceri adlarını seçmek üzere konu ipuçları kullanır:

- animasyonlu GIF görevleri -> `animated-gif-workflow`
- ekran görüntüsü veya varlık görevleri -> `screenshot-asset-workflow`
- QA veya senaryo görevleri -> `qa-scenario-workflow`
- GitHub PR görevleri -> `github-pr-workflow`
- yedek -> `learned-workflows`

Sezgisel yakalama kasten dardır. Genel transcript özetleme için değil, açık düzeltmeler ve tekrarlanabilir süreç notları içindir.

### LLM Gözden Geçiricisi

`autoCapture` etkinse ve `reviewMode` `llm` veya `hybrid` ise, plugin
eşiklere ulaşıldığında kompakt bir gömülü gözden geçirici çalıştırır.

Gözden geçirici şunları alır:

- son 12.000 karakterle sınırlı yakın tarihli transcript metni
- en fazla 12 mevcut çalışma alanı becerisi
- mevcut her beceriden en fazla 2.000 karakter
- yalnızca JSON talimatları

Gözden geçiricinin aracı yoktur:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

Şunu döndürebilir:

```json
{ "action": "none" }
```

veya bir beceri önerisi:

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

Ayrıca mevcut bir beceriye ekleme yapabilir:

```json
{
  "action": "append",
  "skillName": "qa-scenario-workflow",
  "title": "QA Scenario Workflow",
  "reason": "Animated media QA needs reusable checks",
  "description": "QA scenario workflow.",
  "section": "Workflow",
  "body": "- For animated GIF tasks, verify frame count and attribution before passing."
}
```

Veya mevcut bir becerideki tam metni değiştirebilir:

```json
{
  "action": "replace",
  "skillName": "screenshot-asset-workflow",
  "title": "Screenshot Asset Workflow",
  "reason": "Old validation missed image optimization",
  "oldText": "- Replace the screenshot asset.",
  "newText": "- Replace the screenshot asset, preserve dimensions, optimize the PNG, and run the relevant validation gate."
}
```

İlgili bir beceri zaten varsa `append` veya `replace` tercih edin. Yalnızca hiçbir mevcut beceri uymadığında `create` kullanın.

## Öneri Yaşam Döngüsü

Üretilen her güncelleme şu alanlarla bir öneri olur:

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
- `applied` - `<workspace>/skills` içine yazıldı
- `rejected` - operatör/model tarafından reddedildi
- `quarantined` - kritik tarayıcı bulguları nedeniyle engellendi

Durum, Gateway durum dizini altında çalışma alanı başına depolanır:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Bekleyen ve karantinadaki öneriler, beceri adı ve değişiklik yüküne göre yinelenmez. Depo, `maxPending` sınırına kadar en yeni bekleyen/karantinadaki önerileri tutar.

## Araç Başvurusu

Plugin bir aracı aracı kaydeder:

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

Karantinadaki önerileri listeler.

```json
{ "action": "list_quarantine" }
```

Otomatik yakalama hiçbir şey yapmıyor gibi göründüğünde ve günlüklerde
`skill-workshop: quarantined <skill>` geçtiğinde bunu kullanın.

### `inspect`

Kimliğe göre bir öneriyi getirir.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

Bir öneri oluşturur. `approvalPolicy: "pending"` ile bu varsayılan olarak kuyruğa alınır.

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

Güvenli bir yazmayı zorla:

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

`approvalPolicy: "auto"` olsa bile bekleyene zorla:

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

Bir bölüme ekle:

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

Tam metni değiştir:

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

### `apply`

Bekleyen bir öneriyi uygular.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply`, karantinadaki önerileri reddeder:

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

Mevcut veya önerilmiş bir beceri dizini içine bir destek dosyası yazar.

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

## Skill Yazımları

Skill Workshop yalnızca şuraya yazar:

```text
<workspace>/skills/<normalized-skill-name>/
```

Skill adları normalize edilir:

- küçük harfe çevrilir
- `[a-z0-9_-]` dışındaki diziler `-` olur
- baştaki/sondaki alfasayısal olmayan karakterler kaldırılır
- en büyük uzunluk 80 karakterdir
- son ad `[a-z0-9][a-z0-9_-]{1,79}` ile eşleşmelidir

`create` için:

- beceri yoksa Skill Workshop yeni bir `SKILL.md` yazar
- zaten varsa gövdeyi `## Workflow` bölümüne ekler

`append` için:

- beceri varsa Skill Workshop istenen bölüme ekler
- yoksa Skill Workshop asgari bir beceri oluşturur ve sonra ekler

`replace` için:

- beceri zaten var olmalıdır
- `oldText` tam olarak mevcut olmalıdır
- yalnızca ilk tam eşleşme değiştirilir

Tüm yazımlar atomiktir ve bellek içi skills anlık görüntüsünü hemen yeniler; böylece yeni veya güncellenmiş beceri Gateway yeniden başlatılmadan görünür hâle gelebilir.

## Güvenlik Modeli

Skill Workshop, üretilen `SKILL.md` içeriği ve destek dosyaları üzerinde bir güvenlik tarayıcısına sahiptir.

Kritik bulgular önerileri karantinaya alır:

| Kural kimliği                         | Şunu yapan içeriği engeller...                                         |
| ------------------------------------- | ----------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | aracının önceki/daha yüksek talimatları yok saymasını söyler            |
| `prompt-injection-system`             | sistem istemlerine, geliştirici mesajlarına veya gizli talimatlara atıfta bulunur |
| `prompt-injection-tool`               | araç izni/onayının atlatılmasını teşvik eder                            |
| `shell-pipe-to-shell`                 | `curl`/`wget` komutlarının `sh`, `bash` veya `zsh` içine pipe edilmesini içerir |
| `secret-exfiltration`                 | env/process env verilerini ağ üzerinden gönderiyor gibi görünür         |

Uyarı bulguları tutulur ama tek başlarına engellemez:

| Kural kimliği         | Şu durumlarda uyarır...               |
| --------------------- | ------------------------------------- |
| `destructive-delete`  | geniş `rm -rf` tarzı komutlar         |
| `unsafe-permissions`  | `chmod 777` tarzı izin kullanımı      |

Karantinadaki öneriler:

- `scanFindings` alanını korur
- `quarantineReason` alanını korur
- `list_quarantine` içinde görünür
- `apply` üzerinden uygulanamaz

Karantinaya alınmış bir öneriden kurtulmak için güvenli olmayan içerik kaldırılmış yeni bir güvenli öneri oluşturun. Depo JSON’unu elle düzenlemeyin.

## İstem Rehberliği

Etkinleştirildiğinde Skill Workshop, aracıya kalıcı prosedürel bellek için
`skill_workshop` kullanmasını söyleyen kısa bir istem bölümü enjekte eder.

Rehberlik şunları vurgular:

- gerçekler/tercihler değil, prosedürler
- kullanıcı düzeltmeleri
- açık olmayan başarılı prosedürler
- tekrarlayan sorun noktaları
- append/replace yoluyla bayat/zayıf/yanlış beceri onarımı
- uzun araç döngülerinden veya zor düzeltmelerden sonra yeniden kullanılabilir prosedürü kaydetme
- kısa emir kipinde beceri metni
- transcript dökümleri yok

Yazma modu metni `approvalPolicy` ile değişir:

- bekleyen mod: önerileri kuyruğa al; yalnızca açık onaydan sonra uygula
- otomatik mod: açıkça yeniden kullanılabilir olduğunda güvenli çalışma alanı beceri güncellemelerini uygula

## Maliyetler ve Çalışma Zamanı Davranışı

Sezgisel yakalama bir model çağırmaz.

LLM gözden geçirmesi, etkin/varsayılan aracı modeli üzerinde gömülü bir çalıştırma kullanır. Eşik tabanlıdır; bu nedenle varsayılan olarak her dönüşte çalışmaz.

Gözden geçirici:

- mümkün olduğunda aynı yapılandırılmış sağlayıcı/model bağlamını kullanır
- çalışma zamanı aracı varsayılanlarına geri düşer
- `reviewTimeoutMs` kullanır
- hafif bootstrap bağlamı kullanır
- araçsızdır
- doğrudan hiçbir şey yazmaz
- yalnızca normal tarayıcıdan ve
  onay/karantina yolundan geçen bir öneri üretebilir

Gözden geçirici başarısız olursa, zaman aşımına uğrarsa veya geçersiz JSON döndürürse, plugin bir uyarı/ayıklama mesajı günlüğe kaydeder ve o gözden geçirme geçişini atlar.

## Çalıştırma Desenleri

Kullanıcı şunları söylediğinde Skill Workshop kullanın:

- “bir dahaki sefere X yap”
- “bundan sonra Y’yi tercih et”
- “Z’yi doğruladığından emin ol”
- “bunu iş akışı olarak kaydet”
- “bu uzun sürdü; süreci hatırla”
- “bunun için yerel beceriyi güncelle”

İyi beceri metni:

```markdown
## Workflow

- GIF URL’sinin `image/gif` olarak çözüldüğünü doğrula.
- Dosyanın birden fazla kareye sahip olduğunu onayla.
- Kaynak URL’sini, lisansı ve atfı kaydet.
- Varlık ürünle birlikte gönderilecekse yerel bir kopya sakla.
- Son yanıttan önce yerel varlığın hedef UI’da görüntülendiğini doğrula.
```

Zayıf beceri metni:

```markdown
Kullanıcı bir GIF hakkında sordu ve ben iki web sitesinde arama yaptım. Sonra biri
Cloudflare tarafından engellendi. Son cevap atfın kontrol edilmesini söyledi.
```

Zayıf sürümün kaydedilmemesi gerekme nedenleri:

- transcript biçiminde
- emir kipinde değil
- gürültülü tek seferlik ayrıntılar içeriyor
- bir sonraki aracıya ne yapacağını söylemiyor

## Hata Ayıklama

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

Karantinadaki önerileri inceleyin:

```json
{ "action": "list_quarantine" }
```

Yaygın belirtiler:

| Belirti                             | Olası neden                                                                          | Denetim                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Araç kullanılamıyor                 | Plugin girdisi etkin değil                                                            | `plugins.entries.skill-workshop.enabled` ve `openclaw plugins list`  |
| Otomatik öneri görünmüyor           | `autoCapture: false`, `reviewMode: "off"` veya eşiklere ulaşılmadı                   | Yapılandırma, öneri durumu, Gateway günlükleri                       |
| Sezgisel yakalamadı                 | Kullanıcı ifadesi düzeltme kalıplarıyla eşleşmedi                                     | Açık `skill_workshop.suggest` kullanın veya LLM gözden geçiriciyi etkinleştirin |
| Gözden geçirici öneri oluşturmadı   | Gözden geçirici `none` döndürdü, geçersiz JSON döndürdü veya zaman aşımına uğradı    | Gateway günlükleri, `reviewTimeoutMs`, eşikler                       |
| Öneri uygulanmadı                   | `approvalPolicy: "pending"`                                                           | `list_pending`, ardından `apply`                                     |
| Öneri bekleyenden kayboldu          | Yinelenen öneri yeniden kullanıldı, en fazla bekleyen temizliği oldu veya uygulandı/reddedildi/karantinaya alındı | `status`, durum filtreleriyle `list_pending`, `list_quarantine`      |
| Beceri dosyası var ama model onu kaçırıyor | Beceri anlık görüntüsü yenilenmedi veya beceri geçitlemesi onu hariç tutuyor         | `openclaw skills` durumu ve çalışma alanı beceri uygunluğu           |

İlgili günlükler:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## QA Senaryoları

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

Gözden geçirici kapsamını çalıştırın:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

Gözden geçirici senaryosu kasten ayrıdır çünkü
`reviewMode: "llm"` etkinleştirir ve gömülü gözden geçiren geçişini çalıştırır.

## Otomatik Uygulama Ne Zaman Etkinleştirilmemeli

Şu durumlarda `approvalPolicy: "auto"` kullanmaktan kaçının:

- çalışma alanı hassas prosedürler içeriyorsa
- aracı güvenilmeyen girdi üzerinde çalışıyorsa
- beceriler geniş bir ekip arasında paylaşılıyorsa
- istemleri veya tarayıcı kurallarını hâlâ ayarlıyorsanız
- model sık sık düşmanca web/e-posta içeriğiyle çalışıyorsa

Önce bekleyen modu kullanın. Yalnızca aracının o çalışma alanında önerdiği beceri türlerini inceledikten sonra otomatik moda geçin.

## İlgili Dokümanlar

- [Skills](/tr/tools/skills)
- [Plugins](/tr/tools/plugin)
- [Testing](/tr/reference/test)

---
read_when:
    - Skill yükleme, kurulum veya geçitleme davranışını yapılandırma
    - Ajan başına Skill görünürlüğünü ayarlama
    - Skill Workshop sınırlarını veya onay politikasını ayarlama
sidebarTitle: Skills config
summary: Full reference for the skills.* yapılandırma şeması, ajan izin listeleri, atölye ayarları ve sandbox ortam değişkeni işleme.
title: Skills yapılandırması
x-i18n:
    generated_at: "2026-06-28T01:25:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c1ba6beb1e06e7090dd6669320a91893bf26abe71633914e7564aebb59c637f
    source_path: tools/skills-config.md
    workflow: 16
---

Skills yapılandırmasının çoğu `~/.openclaw/openclaw.json` içinde
`skills` altında bulunur. Aracıya özgü görünürlük
`agents.defaults.skills` ve `agents.list[].skills` altında bulunur.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm",
      allowUploadedArchives: false,
    },
    workshop: {
      autonomous: { enabled: false },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<Note>
  Yerleşik görüntü üretimi için `skills.entries` yerine
  `agents.defaults.imageGenerationModel` ve çekirdek `image_generate` aracını
  kullanın. Beceri girdileri yalnızca özel veya üçüncü taraf beceri iş akışları içindir.
</Note>

## Yükleme (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  En düşük öncelikte taranacak ek beceri dizinleri (paketlenmiş ve Plugin
  becerilerinden sonra). Yollar `~` desteğiyle genişletilir.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Sembolik bağlı beceri klasörlerinin, sembolik bağ yapılandırılmış kökün
  dışında olsa bile çözümlenebileceği güvenilir gerçek hedef dizinler. Bunu
  `<workspace>/skills/manager -> ~/Projects/manager/skills` gibi bilinçli
  kardeş depo düzenleri için kullanın. Bu listeyi dar tutun; `~` veya
  `~/Projects` gibi geniş köklere işaret etmeyin.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Beceri klasörlerini izleyin ve `SKILL.md` dosyaları değiştiğinde Skills
  anlık görüntüsünü yenileyin. Gruplanmış beceri kökleri altındaki iç içe
  dosyaları kapsar.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Beceri izleyici olayları için milisaniye cinsinden debounce penceresi.
</ParamField>

## Yükleme (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  `brew` kullanılabilir olduğunda Homebrew yükleyicilerini tercih edin.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Beceri yüklemeleri için Node paket yöneticisi tercihi. Bu yalnızca beceri
  yüklemelerini etkiler; Gateway çalışma zamanı yine de Node kullanmalıdır
  (Bun, WhatsApp/Telegram için önerilmez). npm, pnpm veya bun için
  `openclaw setup --node-manager` kullanın; Yarn destekli beceri yüklemeleri
  için `"yarn"` değerini elle ayarlayın.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Güvenilir `operator.admin` Gateway istemcilerinin `skills.upload.*` üzerinden
  hazırlanmış özel zip arşivlerini yüklemesine izin verin. Normal ClawHub
  yüklemeleri bu ayara ihtiyaç duymaz.
</ParamField>

## Operatör Yükleme İlkesi (`security.installPolicy`)

Operatörlerin, beceri ve Plugin yüklemelerini ana bilgisayara özgü ilkeyle
onaylamak veya engellemek için güvenilir bir yerel komuta ihtiyaç duyduğu
durumlarda `security.installPolicy` kullanın. İlke, OpenClaw kaynak materyali
hazırladıktan sonra ve yükleme ya da güncelleme devam etmeden önce çalışır.
ClawHub becerilerine, yüklenen becerilere, Git/yerel becerilere, beceri
bağımlılığı yükleyicilerine ve Plugin yükleme/güncelleme kaynaklarına uygulanır.

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // Omit targets to cover every supported target.
      targets: ["skill", "plugin"],
      exec: {
        source: "exec",
        command: "/usr/local/bin/openclaw-install-policy",
        args: ["--json"],
        timeoutMs: 10000,
        noOutputTimeoutMs: 10000,
        maxOutputBytes: 1048576,
        passEnv: ["OPENCLAW_STATE_DIR", "PATH"],
        env: { POLICY_MODE: "strict" },
        trustedDirs: ["/usr/local/bin"],
      },
    },
  },
}
```

<ParamField path="security.installPolicy.enabled" type="boolean" default="false">
  Operatörün sahibi olduğu yükleme ilkesini etkinleştirir. Geçerli bir `exec`
  komutu olmadan etkinleştirildiğinde, yüklemeler kapalı şekilde başarısız olur.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  İsteğe bağlı hedef filtresi. Atlandığında, yeni yüklemelerin beklenmedik
  şekilde açık başarısız olmaması için ilke desteklenen her hedefe uygulanır.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Güvenilir ilke yürütülebilir dosyasına mutlak yol. OpenClaw bunu kabuk
  olmadan çalıştırır ve kullanımdan önce yolu doğrular.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  `command` sonrasında iletilen statik bağımsız değişkenler.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Bir ilke kararı için en yüksek duvar saati çalışma süresi.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  İlke kapalı şekilde başarısız olmadan önce stdout veya stderr çıktısı olmadan
  geçebilecek en uzun süre.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  İlke sürecinden kabul edilen en yüksek birleşik stdout ve stderr bayt sayısı.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  İlke sürecine sağlanan değişmez ortam değişkenleri.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  OpenClaw sürecinden ilke sürecine kopyalanan ortam değişkeni adları. Yalnızca
  adlandırılmış değişkenler iletilir.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  İlke yürütülebilir dosyasını içerebilecek dizinlerin isteğe bağlı izin listesi.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Komut yolu sahipliği ve izin denetimlerini atlar. Yalnızca yol başka bir
  mekanizmayla korunuyorsa kullanın.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Yapılandırılmış komut yolunun sembolik bağ olmasına izin verir. Çözümlenen
  hedef yine de diğer yol denetimlerini karşılamalıdır. Yorumlayıcı betik
  bağımsız değişkenleri sembolik bağ değil, doğrudan normal dosyalar olmalıdır.
</ParamField>

İlke stdin üzerinde `protocolVersion: 1`, `openclawVersion`, `targetType`,
`targetName`, `sourcePath`, `sourcePathKind`, isteğe bağlı yapılandırılmış
`source`, yapılandırılmış `origin` ve `request` içeren bir JSON nesnesi alır.
stdout üzerine bir JSON nesnesi yazmalıdır:
`{ "protocolVersion": 1, "decision": "allow" }` veya
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Sıfır olmayan
çıkış, zaman aşımı, hatalı biçimlendirilmiş JSON, eksik alanlar veya
desteklenmeyen protokol sürümleri kapalı şekilde başarısız olur.

OpenClaw normal Gateway başlangıcı sırasında yükleme ilkesini çalıştırmaz. İlke
etkin ancak kullanılamaz olduğunda yüklemeler ve güncellemeler kapalı şekilde
başarısız olur. `openclaw doctor` statik doğrulama gerçekleştirir ve
`openclaw doctor --deep` yapılandırılmış komuta karşı sentetik bir yükleme
sondası çalıştırır.

Toplu güncellemeler ilkeyi hedef başına uygular: engellenen bir beceri veya
Plugin güncellemesi, ilkeyi devre dışı bırakmadan ya da gruptaki sonraki
hedefleri atlamadan o hedefte başarısız olur.

Örnek stdin:

```json
{
  "protocolVersion": 1,
  "openclawVersion": "2026.6.1",
  "targetType": "skill",
  "targetName": "weather",
  "sourcePath": "/var/folders/.../openclaw-skill-clawhub/root",
  "sourcePathKind": "directory",
  "source": {
    "kind": "clawhub",
    "authority": "openclaw",
    "mutable": false,
    "network": true
  },
  "origin": {
    "type": "clawhub",
    "registry": "https://clawhub.openclaw.ai",
    "slug": "weather",
    "version": "1.0.0"
  },
  "request": {
    "kind": "skill-install",
    "mode": "install",
    "requestedSpecifier": "clawhub:weather@1.0.0"
  },
  "skill": {
    "installId": "clawhub"
  }
}
```

Asgari ilke komutu:

```js
#!/usr/bin/env node

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  const request = JSON.parse(input);
  if (request.targetType === "plugin" && request.source?.kind === "local-path") {
    process.stdout.write(
      JSON.stringify({
        protocolVersion: 1,
        decision: "block",
        reason: "local plugin paths are not approved on this host",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## Paketlenmiş beceri izin listesi

<ParamField path="skills.allowBundled" type="string[]">
  Yalnızca **paketlenmiş** beceriler için isteğe bağlı izin listesi.
  Ayarlandığında, yalnızca listedeki paketlenmiş beceriler uygun olur. Yönetilen,
  aracı düzeyindeki ve çalışma alanı becerileri etkilenmez.
</ParamField>

## Beceri başına girdiler (`skills.entries`)

`entries` altındaki anahtarlar varsayılan olarak beceri `name` değeriyle
eşleşir. Bir beceri `metadata.openclaw.skillKey` tanımlıyorsa bunun yerine o
anahtarı kullanın. Kısa çizgili adları tırnak içine alın (JSON5 tırnaklı
anahtarlara izin verir).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false`, paketlenmiş veya yüklenmiş olsa bile beceriyi devre dışı bırakır.
  Paketlenmiş `coding-agent` becerisi isteğe bağlıdır; bunu `true` olarak
  ayarlayın ve `claude`, `codex`, `opencode` ya da desteklenen başka bir CLI'nin
  yüklü ve kimliği doğrulanmış olduğundan emin olun.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` bildiren beceriler için kolaylık alanı. Düz
  metin dizgisini veya SecretRef değerini destekler:
  `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Aracı çalıştırması için enjekte edilen ortam değişkenleri. Yalnızca değişken
  süreçte zaten ayarlı değilse enjekte edilir.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Özel beceri başına yapılandırma alanları için isteğe bağlı torba.
</ParamField>

## Aracı izin listeleri (`agents`)

Aynı makine/çalışma alanı beceri köklerini, ancak aracı başına farklı görünür
beceri kümesini istediğinizde aracı yapılandırmasını kullanın.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<ParamField path="agents.defaults.skills" type="string[]">
  `agents.list[].skills` değerini atlayan aracılar tarafından devralınan ortak
  temel izin listesi. Becerileri varsayılan olarak kısıtlamasız bırakmak için
  tamamen atlayın.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Bu aracı için açık nihai beceri kümesi. Açık listeler devralınan varsayılanları
  **değiştirir**; birleştirme yapmaz. Bu aracı için hiçbir beceri göstermemek
  üzere `[]` olarak ayarlayın.
</ParamField>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  `true` olduğunda aracılar, başarılı dönüşlerden sonra kalıcı konuşma
  sinyallerinden bekleyen öneriler oluşturabilir. Kullanıcı istemli beceri
  oluşturma, bu ayardan bağımsız olarak her zaman Skill Workshop üzerinden geçer.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending`, aracı tarafından başlatılan uygulama, reddetme veya karantinaya alma
  işlemlerinden önce operatör onayı gerektirir. `auto`, bu işlemlere onaysız
  izin verir.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Skill Workshop uygulamasının, gerçek hedefi `skills.load.allowSymlinkTargets`
  tarafından zaten güvenilir kabul edilen çalışma alanı beceri sembolik bağları
  üzerinden yazmasına izin verin. Oluşturulan öneri uygulamalarının bu paylaşılan
  beceri kökünü değiştirmesi gerekmiyorsa bunu devre dışı bırakın.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Workspace başına saklanan beklemedeki ve karantinaya alınmış tekliflerin azami sayısı.
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Teklif gövdesinin bayt cinsinden azami boyutu. Teklif açıklamaları,
  keşif ve listeleme çıktısında göründükleri için 160 bayt ile kesin olarak sınırlandırılır.
</ParamField>

## Sembolik bağlantılı Skills kökleri

Varsayılan olarak workspace, project-agent, extra-dir ve paketle gelen Skills kökleri
kapsama sınırlarıdır. `<workspace>/skills` altında bulunan ve kökün dışına çözümlenen
sembolik bağlantılı bir Skills klasörü, günlük iletisiyle atlanır.

Kasıtlı bir sembolik bağlantı düzenine izin vermek için güvenilir hedefi bildirin:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

Bu yapılandırmayla, `<workspace>/skills/manager -> ~/Projects/manager/skills`
realpath çözümlemesinden sonra kabul edilir. `extraDirs` kardeş depoyu doğrudan tarar;
`allowSymlinkTargets` mevcut düzenler için sembolik bağlantılı yolu korur.

Skill Workshop uygulama işlemi varsayılan olarak bu sembolik bağlantılar üzerinden yazmaz.
Workshop uygulama işleminin zaten güvenilir olan sembolik bağlantı hedefleri altındaki
Skills öğelerini değiştirmesine izin vermek için ayrıca etkinleştirin:

```json5
{
  skills: {
    load: {
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    workshop: {
      allowSymlinkTargetWrites: true,
    },
  },
}
```

Yönetilen `~/.openclaw/skills` ve kişisel `~/.agents/skills` dizinleri
Skills dizini sembolik bağlantılarını zaten kabul eder (Skills başına `SKILL.md`
kapsama sınırı yine de geçerlidir).

## Korumalı alandaki Skills ve ortam değişkenleri

<Warning>
  `skills.entries.<skill>.env` ve `apiKey` yalnızca **host** çalıştırmaları için geçerlidir.
  Korumalı alan içinde etkileri yoktur — `GEMINI_API_KEY` öğesine bağlı bir Skills,
  korumalı alana değişken ayrıca verilmediği sürece `apiKey not configured`
  hatasıyla başarısız olur.
</Warning>

Gizli değerleri bir Docker korumalı alanına şu şekilde geçirin:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          env: { GEMINI_API_KEY: "your-key-here" },
        },
      },
    },
  },
}
```

<Note>
  Docker daemon erişimi olan kullanıcılar, Docker metadata üzerinden
  `sandbox.docker.env` değerlerini inceleyebilir. Bu görünürlük kabul edilebilir
  değilse bağlanmış bir gizli dosya, özel bir imaj veya başka bir iletim yolu kullanın.
</Note>

## Yükleme sırası hatırlatıcısı

```text
workspace/skills      (highest)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
bundled skills
skills.load.extraDirs (lowest)
```

Skills ve yapılandırma değişiklikleri, watcher etkinse bir sonraki yeni oturumda
veya watcher bir değişiklik algıladığında bir sonraki agent turunda etkili olur.

## İlgili

<CardGroup cols={2}>
  <Card title="Skills referansı" href="/tr/tools/skills" icon="puzzle-piece">
    Skills öğelerinin ne olduğu, yükleme sırası, denetim ve SKILL.md biçimi.
  </Card>
  <Card title="Skills oluşturma" href="/tr/tools/creating-skills" icon="hammer">
    Özel workspace Skills öğeleri yazma.
  </Card>
  <Card title="Skill Workshop" href="/tr/tools/skill-workshop" icon="flask">
    Agent tarafından taslak haline getirilen Skills için teklif kuyruğu.
  </Card>
  <Card title="Slash komutları" href="/tr/tools/slash-commands" icon="terminal">
    Yerel slash komutu kataloğu ve sohbet yönergeleri.
  </Card>
</CardGroup>

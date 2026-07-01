---
read_when:
    - Skills yükleme, kurulum veya geçitleme davranışını yapılandırma
    - Ajan başına skill görünürlüğünü ayarlama
    - Skill Workshop sınırlarını veya onay politikasını ayarlama
sidebarTitle: Skills config
summary: skills.* yapılandırma şeması, ajan izin listeleri, atölye ayarları ve sandbox ortam değişkeni işleme için tam başvuru.
title: Skills yapılandırması
x-i18n:
    generated_at: "2026-07-01T08:26:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37251cd12162c3083b8b9e1a84c462233eb44656a84ca915705859a352c9557b
    source_path: tools/skills-config.md
    workflow: 16
---

Skills yapılandırmasının büyük bölümü
`~/.openclaw/openclaw.json` içinde `skills` altında bulunur. Aracıya özgü görünürlük
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
  `agents.defaults.imageGenerationModel` ile birlikte çekirdek `image_generate`
  aracını kullanın. Skill girdileri yalnızca özel veya üçüncü taraf skill iş akışları içindir.
</Note>

## Yükleme (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Taranacak ek skill dizinleri, en düşük öncelikte olacak şekilde (paketle gelen
  ve Plugin skill'lerden sonra). Yollar `~` desteğiyle genişletilir.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Sembolik bağlantılı skill klasörlerinin, sembolik bağlantı yapılandırılmış kökün dışında bulunsa bile
  çözümlenebileceği güvenilir gerçek hedef dizinler.
  Bunu `<workspace>/skills/manager -> ~/Projects/manager/skills` gibi
  kasıtlı kardeş repo yerleşimleri için kullanın. Bu listeyi
  dar tutun — `~` veya `~/Projects` gibi geniş kökleri göstermeyin.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Skill klasörlerini izleyin ve `SKILL.md` dosyaları değiştiğinde skills anlık görüntüsünü
  yenileyin. Gruplandırılmış skill kökleri altındaki iç içe dosyaları kapsar.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Skill izleyici olayları için milisaniye cinsinden debounce penceresi.
</ParamField>

## Kurulum (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  `brew` kullanılabilir olduğunda Homebrew kurucularını tercih edin.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Skill kurulumları için Node paket yöneticisi tercihi. Bu yalnızca skill
  kurulumlarını etkiler — Gateway çalışma zamanı yine Node kullanmalıdır (Bun,
  WhatsApp/Telegram için önerilmez). npm, pnpm veya bun için
  `openclaw setup --node-manager` kullanın; Yarn destekli skill kurulumları için
  `"yarn"` değerini elle ayarlayın.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Güvenilir `operator.admin` Gateway istemcilerinin `skills.upload.*` üzerinden
  hazırlanmış özel zip arşivlerini kurmasına izin verin. Normal ClawHub kurulumları
  bu ayara ihtiyaç duymaz.
</ParamField>

## Operatör Kurulum İlkesi (`security.installPolicy`)

Operatörlerin skill ve Plugin kurulumlarını ana makineye özgü ilkeyle onaylamak
veya engellemek için güvenilir bir yerel komuta ihtiyacı olduğunda
`security.installPolicy` kullanın. İlke, OpenClaw kaynak materyali hazırladıktan
sonra ve kurulum veya güncelleme devam etmeden önce çalışır. ClawHub skills,
yüklenen skills, Git/yerel skills, skill bağımlılık kurucuları ve Plugin
kurulum/güncelleme kaynakları için geçerlidir.

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
  Operatöre ait kurulum ilkesini etkinleştirir. Geçerli bir `exec` komutu olmadan
  etkinleştirildiğinde, kurulumlar kapalı başarısız olur.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  İsteğe bağlı hedef filtresi. Atlandığında, ilke desteklenen her hedefe uygulanır;
  böylece yeni kurulumlar beklenmedik şekilde açık başarısız olmaz.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Güvenilir ilke yürütülebilir dosyasına mutlak yol. OpenClaw bunu bir kabuk
  olmadan çalıştırır ve kullanmadan önce yolu doğrular.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  `command` sonrasında geçirilen statik argümanlar.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Tek bir ilke kararı için azami duvar saati çalışma süresi.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  İlke kapalı başarısız olmadan önce stdout veya stderr çıktısı olmadan geçebilecek
  azami süre.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  İlke sürecinden kabul edilen azami birleşik stdout ve stderr bayt sayısı.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  İlke sürecine sağlanan değişmez ortam değişkenleri.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  OpenClaw sürecinden ilke sürecine kopyalanan ortam değişkeni adları.
  Yalnızca adlandırılmış değişkenler geçirilir.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  İlke yürütülebilir dosyasını içerebilecek dizinlerin isteğe bağlı izin listesi.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Komut yolu sahipliği ve izin denetimlerini atlar. Yalnızca yol başka bir
  mekanizma tarafından korunuyorsa kullanın.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Yapılandırılmış komut yolunun sembolik bağlantı olmasına izin verir. Çözümlenen
  hedef yine de diğer yol denetimlerini karşılamalıdır. Yorumlayıcı betik
  argümanları sembolik bağlantı değil, doğrudan normal dosyalar olmalıdır.
</ParamField>

İlke stdin üzerinde `protocolVersion: 1`, `openclawVersion`, `targetType`,
`targetName`, `sourcePath`, `sourcePathKind`, isteğe bağlı yapılandırılmış
`source`, yapılandırılmış `origin` ve `request` içeren bir JSON nesnesi alır.
stdout üzerinde tek bir JSON nesnesi yazmalıdır:
`{ "protocolVersion": 1, "decision": "allow" }` veya
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Sıfır olmayan
çıkış, zaman aşımı, hatalı biçimlendirilmiş JSON, eksik alanlar veya
desteklenmeyen protokol sürümleri kapalı başarısız olur.

OpenClaw, normal Gateway başlatma sırasında kurulum ilkesini çalıştırmaz. İlke
etkin ancak kullanılamaz olduğunda kurulumlar ve güncellemeler kapalı başarısız
olur. `openclaw doctor` statik doğrulama yapar ve `openclaw doctor --deep`
yapılandırılmış komuta karşı yapay bir kurulum sondası yürütür.

Toplu güncellemeler ilkeyi hedef başına uygular: engellenen bir skill veya
Plugin güncellemesi, ilkeyi devre dışı bırakmadan ya da gruptaki sonraki
hedefleri atlamadan o hedef için başarısız olur.

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

## Paketle gelen skill izin listesi

<ParamField path="skills.allowBundled" type="string[]">
  Yalnızca **paketle gelen** skills için isteğe bağlı izin listesi. Ayarlandığında,
  yalnızca listedeki paketle gelen skills uygun olur. Yönetilen, aracı düzeyindeki
  ve çalışma alanı skills bundan etkilenmez.
</ParamField>

## Skill başına girdiler (`skills.entries`)

`entries` altındaki anahtarlar varsayılan olarak skill `name` değeriyle eşleşir.
Bir skill `metadata.openclaw.skillKey` tanımlıyorsa onun yerine bu anahtarı
kullanın. Tireli adları tırnak içine alın (JSON5 tırnaklı anahtarlara izin verir).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false`, paketle gelmiş veya kurulmuş olsa bile skill'i devre dışı bırakır.
  Paketle gelen `coding-agent` skill'i isteğe bağlıdır — bunu `true` olarak
  ayarlayın ve `claude`, `codex`, `opencode` veya desteklenen başka bir CLI'ın
  kurulu ve kimliği doğrulanmış olduğundan emin olun.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` bildiren skills için kolaylık alanı.
  Düz metin dizesini veya bir SecretRef'i destekler: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Aracı çalıştırması için enjekte edilen ortam değişkenleri. Yalnızca değişken
  süreçte zaten ayarlı değilse enjekte edilir.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Özel skill başına yapılandırma alanları için isteğe bağlı torba.
</ParamField>

## Aracı izin listeleri (`agents`)

Aynı makine/çalışma alanı skill köklerini ancak aracı başına farklı bir görünür
skill kümesini istediğinizde aracı yapılandırmasını kullanın.

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
  `agents.list[].skills` değerini atlayan aracılar tarafından devralınan paylaşılan
  temel izin listesi. Skills'in varsayılan olarak kısıtlanmaması için tamamen
  atlayın.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Bu aracı için açık nihai skill kümesi. Açık listeler devralınan varsayılanları
  **değiştirir** — birleştirmez. Bu aracıya hiçbir skill göstermemek için `[]`
  olarak ayarlayın.
</ParamField>

<Warning>
  Aracı skill izin listeleri, OpenClaw skill keşfi, istemler, slash komutu keşfi,
  sandbox eşitlemesi ve skill anlık görüntüleri için görünürlük ve yükleme
  filtresidir. Bunlar kabuk zamanı yetkilendirme sınırı değildir. Bir aracı ana
  makinede `exec` çalıştırabiliyorsa, o kabuk yine harici istemcileri
  çalıştırabilir veya yürütme kullanıcısına görünür ana makine dosyalarını,
  `~/.openclaw/skills/config/mcporter.json` gibi MCP istemci kayıtları dahil,
  okuyabilir. Aracı başına MCP yalıtımı için skill izin listelerini sandbox/OS
  kullanıcısı yalıtımıyla birleştirin, ana makine exec kullanımını reddedin veya
  sıkı şekilde izin listesine alın ve MCP sunucusunda aracı başına kimlik
  bilgilerini tercih edin.
</Warning>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  `true` olduğunda, aracılar başarılı dönüşlerden sonra kalıcı konuşma
  sinyallerinden bekleyen öneriler oluşturabilir. Kullanıcı istemli skill
  oluşturma, bu ayardan bağımsız olarak her zaman Skill Workshop üzerinden geçer.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending`, ajan tarafından başlatılan apply, reject veya quarantine işlemlerinden
  önce operatör onayı gerektirir. `auto`, bu işlemlere onay olmadan izin verir.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Skill Workshop apply işleminin, gerçek hedefi zaten
  `skills.load.allowSymlinkTargets` tarafından güvenilen çalışma alanı skill
  sembolik bağlantıları üzerinden yazmasına izin verin. Oluşturulan öneri apply
  işlemleri bu paylaşılan skill kökünü değiştirmemeliyse bunu devre dışı tutun.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Çalışma alanı başına saklanan en fazla bekleyen ve karantinaya alınmış öneri
  sayısı.
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Öneri gövdesinin bayt cinsinden en büyük boyutu. Öneri açıklamaları, keşif ve
  listeleme çıktısında göründükleri için 160 bayt ile kesin olarak sınırlıdır.
</ParamField>

## Sembolik bağlantılı skill kökleri

Varsayılan olarak çalışma alanı, proje ajanı, ek dizin ve paketlenmiş skill
kökleri kapsama sınırlarıdır. `<workspace>/skills` altında kökün dışına çözümlenen
sembolik bağlantılı bir skill klasörü, bir günlük iletisiyle atlanır.

Bilinçli bir sembolik bağlantı düzenine izin vermek için güvenilen hedefi
bildirin:

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
realpath çözümlemesinden sonra kabul edilir. `extraDirs` kardeş depoyu doğrudan
tarar; `allowSymlinkTargets` mevcut düzenler için sembolik bağlantılı yolu korur.

Skill Workshop apply varsayılan olarak bu sembolik bağlantılar üzerinden yazmaz.
Workshop apply işleminin zaten güvenilen sembolik bağlantı hedefleri altındaki
skills öğelerini değiştirmesine izin vermek için ayrıca etkinleştirin:

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

Yönetilen `~/.openclaw/skills` ve kişisel `~/.agents/skills` dizinleri zaten
skill dizini sembolik bağlantılarını kabul eder (skill başına `SKILL.md` kapsaması
yine de geçerlidir).

## Korumalı alana alınmış skills ve env vars

<Warning>
  `skills.entries.<skill>.env` ve `apiKey` yalnızca **host** çalıştırmaları için
  geçerlidir. Bir korumalı alan içinde etkileri yoktur — `GEMINI_API_KEY`
  değerine bağlı bir skill, korumalı alana değişken ayrıca verilmedikçe
  `apiKey not configured` hatasıyla başarısız olur.
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
  Docker daemon erişimi olan kullanıcılar, Docker üst verileri üzerinden
  `sandbox.docker.env` değerlerini inceleyebilir. Bu açığa çıkma kabul edilebilir
  değilse bağlı bir gizli dosya, özel bir image veya başka bir teslim yolu
  kullanın.
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

Skills ve yapılandırma değişiklikleri, izleyici etkinleştirildiğinde bir sonraki
yeni oturumda veya izleyici bir değişiklik algıladığında bir sonraki ajan turunda
etkili olur.

## İlgili

<CardGroup cols={2}>
  <Card title="Skills başvurusu" href="/tr/tools/skills" icon="puzzle-piece">
    Skills nedir, yükleme sırası, geçitleme ve SKILL.md biçimi.
  </Card>
  <Card title="Skills oluşturma" href="/tr/tools/creating-skills" icon="hammer">
    Özel çalışma alanı skills öğeleri yazma.
  </Card>
  <Card title="Skill Workshop" href="/tr/tools/skill-workshop" icon="flask">
    Ajan tarafından taslak oluşturulmuş skills için öneri kuyruğu.
  </Card>
  <Card title="Slash komutları" href="/tr/tools/slash-commands" icon="terminal">
    Yerel slash komut kataloğu ve sohbet yönergeleri.
  </Card>
</CardGroup>

---
read_when:
    - Skill yükleme, kurulum veya erişim denetimi davranışını yapılandırma
    - Ajan başına Skills görünürlüğünü ayarlama
    - Skill Atölyesi sınırlarını veya onay politikasını ayarlama
sidebarTitle: Skills config
summary: skills.* yapılandırma şeması, ajan izin listeleri, workshop ayarları ve sandbox ortam değişkeni yönetimi için eksiksiz başvuru kaynağı.
title: Skills yapılandırması
x-i18n:
    generated_at: "2026-07-12T12:54:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ed1ec20aa102b458a9485a1ada1bb7566c97d28b1f43caa28f52b3f5bdc381e
    source_path: tools/skills-config.md
    workflow: 16
---

Skills yapılandırmasının büyük bölümü
`~/.openclaw/openclaw.json` içindeki `skills` altında bulunur. Ajana özgü görünürlük
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
  Yerleşik görüntü oluşturma için `skills.entries` yerine
  `agents.defaults.imageGenerationModel` ile çekirdek `image_generate` aracını kullanın. Skill
  girdileri yalnızca özel veya üçüncü taraf Skill iş akışları içindir.
</Note>

## Yükleme (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  En düşük öncelikle (paketle gelen ve Plugin Skills öğelerinin altında)
  taranacak ek Skill dizinleri. Yollar `~` desteğiyle genişletilir.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Sembolik bağlantılı Skill klasörlerinin, sembolik bağlantı yapılandırılmış kökün
  dışında bulunsa bile çözümleyebileceği güvenilir gerçek hedef dizinler. Bunu
  `<workspace>/skills/manager -> ~/Projects/manager/skills` gibi bilinçli
  kardeş depo düzenleri için kullanın. Bu listeyi dar tutun; `~` veya
  `~/Projects` gibi geniş kökleri göstermeyin.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Skill klasörlerini izler ve `SKILL.md` dosyaları değiştiğinde Skills
  anlık görüntüsünü yeniler. Gruplanmış Skill kökleri altındaki iç içe dosyaları kapsar.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Skill izleyici olayları için milisaniye cinsinden gecikme giderme aralığı.
</ParamField>

## Kurulum (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  `brew` kullanılabilir olduğunda Homebrew kurucularını tercih eder.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Skill kurulumları için Node paket yöneticisi tercihi. Bu yalnızca Skill
  kurulumlarını etkiler; Gateway çalışma zamanı yine Node kullanmalıdır
  (WhatsApp/Telegram için Bun önerilmez). `openclaw setup --node-manager` ve
  `openclaw onboard --node-manager`, `npm`, `pnpm` veya `bun` değerlerini kabul eder;
  Yarn tabanlı Skill kurulumları için yapılandırmada doğrudan `"yarn"` ayarlayın.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Güvenilir `operator.admin` Gateway istemcilerinin `skills.upload.*` üzerinden
  hazırlanmış özel zip arşivlerini kurmasına izin verir. Normal ClawHub
  kurulumları bu ayara ihtiyaç duymaz.
</ParamField>

## Operatör Kurulum Politikası (`security.installPolicy`)

Operatörlerin Skill ve Plugin kurulumlarını ana makineye özgü politikayla
onaylamak veya engellemek için güvenilir bir yerel komuta ihtiyaç duyduğu durumlarda
`security.installPolicy` kullanın. Politika, OpenClaw kaynak materyalini hazırladıktan
sonra ve kurulum ya da güncelleme devam etmeden önce çalışır. ClawHub Skills,
yüklenen Skills, Git/yerel Skills, Skill bağımlılık kurucuları ve Plugin
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
  Operatörün yönettiği kurulum politikasını etkinleştirir. Geçerli bir `exec`
  komutu olmadan etkinleştirildiğinde kurulumlar güvenli biçimde reddedilir.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  İsteğe bağlı hedef filtresi. Belirtilmediğinde politika, yeni kurulumların
  beklenmedik biçimde açık kalmaması için desteklenen her hedefe uygulanır.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Güvenilir politika yürütülebilir dosyasının mutlak yolu. OpenClaw bunu kabuk
  olmadan çalıştırır ve kullanmadan önce yolu doğrular.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  `command` sonrasında geçirilen statik bağımsız değişkenler.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Tek bir politika kararı için azami gerçek zaman çalışma süresi.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Politika güvenli biçimde reddedilmeden önce stdout veya stderr çıktısı olmadan
  geçebilecek azami süre.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Politika sürecinden kabul edilen birleşik stdout ve stderr baytlarının azami sayısı.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Politika sürecine sağlanan değişmez ortam değişkenleri.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  OpenClaw sürecinden politika sürecine kopyalanan ortam değişkeni adları.
  Yalnızca adı belirtilen değişkenler geçirilir.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Politika yürütülebilir dosyasını içerebilecek dizinlerin isteğe bağlı izin listesi.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Komut yolu sahipliği ve izin denetimlerini atlar. Yalnızca yol başka bir
  mekanizmayla korunuyorsa kullanın.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Yapılandırılmış komut yolunun sembolik bağlantı olmasına izin verir. Çözümlenen
  hedef yine diğer yol denetimlerini karşılamalıdır. Yorumlayıcı betiği bağımsız
  değişkenleri sembolik bağlantılar değil, doğrudan normal dosyalar olmalıdır.
</ParamField>

Politika, stdin üzerinden `protocolVersion: 1`, `openclawVersion`, `targetType`,
`targetName`, `sourcePath`, `sourcePathKind`, isteğe bağlı yapılandırılmış `source`,
yapılandırılmış `origin` ve `request` içeren tek bir JSON nesnesi alır. stdout'a
tek bir JSON nesnesi yazmalıdır: `{ "protocolVersion": 1, "decision": "allow" }`
veya `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Sıfır
olmayan çıkış kodu, zaman aşımı, hatalı biçimlendirilmiş JSON, eksik alanlar veya
desteklenmeyen protokol sürümleri güvenli biçimde reddedilir.

OpenClaw, normal Gateway başlatma sırasında kurulum politikasını yürütmez.
Politika etkin ancak kullanılamaz olduğunda kurulumlar ve güncellemeler güvenli
biçimde reddedilir. `openclaw doctor` statik doğrulama gerçekleştirir;
`openclaw doctor --deep`, yapılandırılmış komuta karşı yapay bir kurulum
sondası yürütür.

Toplu güncellemeler politikayı hedef başına uygular: engellenen bir Skill veya
Plugin güncellemesi, politikayı devre dışı bırakmadan veya gruptaki sonraki hedefleri
atlamadan ilgili hedef için başarısız olur.

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

Asgari politika komutu:

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

## Paketle gelen Skills izin listesi

<ParamField path="skills.allowBundled" type="string[]">
  Yalnızca **paketle gelen** Skills için isteğe bağlı izin listesi. Ayarlandığında
  yalnızca listedeki paketle gelen Skills kullanılabilir olur. Yönetilen, ajan
  düzeyindeki ve çalışma alanındaki Skills bundan etkilenmez.
</ParamField>

## Skill başına girdiler (`skills.entries`)

`entries` altındaki anahtarlar varsayılan olarak Skill `name` değeriyle eşleşir.
Bir Skill `metadata.openclaw.skillKey` tanımlıyorsa bunun yerine o anahtarı
kullanın. Kısa çizgi içeren adları tırnak içine alın (JSON5, tırnaklı anahtarlara
izin verir).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false`, paketle gelmiş veya kurulmuş olsa bile Skill'i devre dışı bırakır.
  Paketle gelen `coding-agent` Skill'i isteğe bağlıdır; bunu `true` olarak
  ayarlayın ve `claude`, `codex`, `opencode` ya da desteklenen başka bir CLI'ın
  kurulu ve kimliği doğrulanmış olduğundan emin olun.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` bildiren Skills için kolaylık alanı.
  Düz metin dizesini veya bir SecretRef'i destekler:
  `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Ajan çalıştırması için enjekte edilen ortam değişkenleri. Yalnızca değişken
  süreçte zaten ayarlanmamışsa enjekte edilir.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Skill başına özel yapılandırma alanları için isteğe bağlı alan grubu.
</ParamField>

## Ajan izin listeleri (`agents`)

Aynı makine/çalışma alanı Skill köklerini ancak ajan başına farklı görünür Skill
kümesini istediğinizde ajan yapılandırmasını kullanın.

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
  `agents.list[].skills` belirtmeyen ajanların devraldığı ortak temel izin
  listesi. Skills öğelerini varsayılan olarak kısıtlamamak için tamamen
  belirtmeyin.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  İlgili ajan için açıkça belirtilmiş nihai Skill kümesi. Açık listeler,
  devralınan varsayılanların **yerine geçer**; birleştirilmez. İlgili ajana
  hiçbir Skill sunmamak için `[]` olarak ayarlayın.
</ParamField>

<Warning>
  Ajan Skill izin listeleri; OpenClaw Skill keşfi, istemler, eğik çizgi komutu
  keşfi, korumalı alan eşitlemesi ve Skill anlık görüntüleri için bir görünürlük
  ve yükleme filtresidir. Bunlar kabuk çalışma zamanında bir yetkilendirme
  sınırı değildir. Bir ajan ana makinede `exec` çalıştırabiliyorsa bu kabuk,
  harici istemcileri yine çalıştırabilir veya MCP istemci kayıtları
  (örneğin `~/.openclaw/skills/config/mcporter.json`) dahil olmak üzere yürütme
  kullanıcısının görebildiği ana makine dosyalarını okuyabilir. Ajan başına MCP
  yalıtımı için Skill izin listelerini korumalı alan/işletim sistemi kullanıcısı
  yalıtımıyla birleştirin, ana makine `exec` erişimini reddedin veya sıkı bir
  izin listesiyle sınırlandırın ve MCP sunucusunda ajan başına kimlik bilgilerini
  tercih edin.
</Warning>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  `true` olduğunda aracılar, başarılı turlardan sonra kalıcı konuşma
  sinyallerinden bekleyen öneriler oluşturabilir. Kullanıcı tarafından istenen Skills
  oluşturma işlemi, bu ayardan bağımsız olarak her zaman Skill Workshop
  üzerinden gerçekleştirilir.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending`, aracı tarafından başlatılan uygulama, reddetme veya karantinaya
  alma işlemlerinden önce operatör onayı gerektirir. `auto`, bu işlemlere onay
  olmadan izin verir.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Skill Workshop uygulamasının, gerçek hedefi `skills.load.allowSymlinkTargets`
  tarafından zaten güvenilir kabul edilen çalışma alanı Skills sembolik
  bağlantıları üzerinden yazmasına izin verir. Oluşturulan önerilerin
  uygulanması bu paylaşılan Skills kökünü değiştirmemeliyse bunu devre dışı
  bırakın.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Çalışma alanı başına saklanan bekleyen ve karantinaya alınmış önerilerin
  azami sayısıdır (izin verilen aralık: 1-200).
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Öneri gövdesinin bayt cinsinden azami boyutudur (izin verilen aralık:
  1024-200000). Öneri açıklamaları, keşif ve listeleme çıktısında göründükleri
  için ayrıca kesin olarak 160 baytla sınırlandırılır.
</ParamField>

Bu yapılandırmanın denetlediği öneri yaşam döngüsü, CLI komutları, aracı araç
parametreleri ve Gateway yöntemleri için [Skill Workshop](/tr/tools/skill-workshop)
sayfasına bakın.

## Sembolik bağlantılı Skills kökleri

Varsayılan olarak çalışma alanı, proje aracısı, ek dizin ve paketle gelen Skills
kökleri kapsama sınırlarıdır. `<workspace>/skills` altında bulunan ve kökün
dışına çözümlenen sembolik bağlantılı bir Skills klasörü, bir günlük iletisiyle
atlanır.

Kasıtlı bir sembolik bağlantı düzenine izin vermek için güvenilir hedefi
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

Bu yapılandırmayla `<workspace>/skills/manager -> ~/Projects/manager/skills`,
gerçek yol çözümlemesinden sonra kabul edilir. `extraDirs` kardeş depoyu
doğrudan tarar; `allowSymlinkTargets` mevcut düzenler için sembolik bağlantılı
yolu korur.

Skill Workshop uygulaması varsayılan olarak bu sembolik bağlantılar üzerinden
yazmaz. Workshop uygulamasının zaten güvenilir kabul edilen sembolik bağlantı
hedefleri altındaki Skills'i değiştirmesine izin vermek için ayrıca etkinleştirin:

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

Yönetilen `~/.openclaw/skills` ve kişisel `~/.agents/skills` dizinleri, Skills
dizini sembolik bağlantılarını zaten koşulsuz olarak kabul eder (Skills başına
`SKILL.md` kapsaması yine geçerlidir) — `allowSymlinkTargets` yalnızca çalışma
alanı, ek dizin ve proje aracısı (`<workspace>/.agents/skills`) kökleri için
gereklidir.

## Korumalı alandaki Skills ve ortam değişkenleri

<Warning>
  `skills.entries.<skill>.env` ve `apiKey` yalnızca **ana makine**
  çalıştırmalarına uygulanır. Korumalı alan içinde hiçbir etkileri yoktur —
  `GEMINI_API_KEY` değişkenine bağımlı bir Skills, değişken korumalı alana
  ayrıca verilmediği sürece `apiKey not configured` hatasıyla başarısız olur.
</Warning>

Gizli bilgileri bir Docker korumalı alanına şu şekilde aktarın:

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
  Docker daemon erişimine sahip kullanıcılar, `sandbox.docker.env` değerlerini
  Docker meta verileri üzerinden inceleyebilir. Bu açığa çıkma kabul edilemez
  olduğunda bağlanmış bir gizli bilgi dosyası, özel bir imaj veya başka bir
  aktarım yolu kullanın.
</Note>

## Yükleme sırası hatırlatması

```text
workspace/skills      (en yüksek)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
paketle gelen Skills
skills.load.extraDirs (en düşük)
```

İzleyici etkinleştirildiğinde Skills ve yapılandırma değişiklikleri bir sonraki
yeni oturumda ya da izleyici bir değişiklik algıladığında bir sonraki aracı
turunda geçerli olur.

## İlgili

<CardGroup cols={2}>
  <Card title="Skills referansı" href="/tr/tools/skills" icon="puzzle-piece">
    Skills'in ne olduğu, yükleme sırası, erişim denetimi ve SKILL.md biçimi.
  </Card>
  <Card title="Skills oluşturma" href="/tr/tools/creating-skills" icon="hammer">
    Özel çalışma alanı Skills'i yazma.
  </Card>
  <Card title="Skill Workshop" href="/tr/tools/skill-workshop" icon="flask">
    Aracı tarafından taslak hâline getirilen Skills için öneri kuyruğu.
  </Card>
  <Card title="Eğik çizgi komutları" href="/tr/tools/slash-commands" icon="terminal">
    Yerel eğik çizgi komutu kataloğu ve sohbet yönergeleri.
  </Card>
</CardGroup>

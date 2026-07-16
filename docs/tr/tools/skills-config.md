---
read_when:
    - Skill yükleme, kurulum veya erişim denetimi davranışını yapılandırma
    - Ajan başına Skills görünürlüğünü ayarlama
    - Skill Atölyesi sınırlarını veya onay politikasını ayarlama
sidebarTitle: Skills config
summary: skills.* yapılandırma şeması, ajan izin listeleri, atölye ayarları ve korumalı alan ortam değişkeni işleme süreçleri için eksiksiz başvuru kaynağı.
title: Skills yapılandırması
x-i18n:
    generated_at: "2026-07-16T17:59:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1633364a7333ba00f5f6c8d6f1f478b65e63bc97de23705e492eb980967ec521
    source_path: tools/skills-config.md
    workflow: 16
---

Çoğu Skills yapılandırması `~/.openclaw/openclaw.json` içindeki
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
      approvalPolicy: "auto",
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
  `agents.defaults.imageGenerationModel` ile temel `image_generate` aracını kullanın. Skill
  girdileri yalnızca özel veya üçüncü taraf skill iş akışları içindir.
</Note>

## Yükleme (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  En düşük öncelikte (paketle gelen ve Plugin skill'lerinin altında) taranacak
  ek skill dizinleri. Yollar `~` desteğiyle genişletilir.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Sembolik bağlantılı skill klasörlerinin, sembolik bağlantı yapılandırılmış
  kökün dışında olsa bile çözümleyebileceği güvenilir gerçek hedef dizinleri.
  Bunu `<workspace>/skills/manager -> ~/Projects/manager/skills` gibi kasıtlı kardeş depo
  düzenleri için kullanın. Bu listeyi dar tutun; `~` veya
  `~/Projects` gibi geniş kökleri göstermeyin.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Skill klasörlerini izleyin ve `SKILL.md` dosyaları değiştiğinde
  Skills anlık görüntüsünü yenileyin. Gruplandırılmış skill kökleri altındaki
  iç içe dosyaları kapsar.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Skill izleyici olayları için milisaniye cinsinden bekletme penceresi.
</ParamField>

## Kurulum (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  `brew` kullanılabiliyorsa Homebrew yükleyicilerini tercih edin.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Skill kurulumları için Node paket yöneticisi tercihi. Bu yalnızca skill
  kurulumlarını etkiler; standart durum deposu `node:sqlite` kullandığı
  için OpenClaw CLI ve Gateway çalışma zamanı Node gerektirir.
  `openclaw setup --node-manager` ve `openclaw onboard --node-manager`; `npm`,
  `pnpm` veya `bun` değerlerini kabul eder. Yarn
  destekli skill kurulumları için yapılandırmada doğrudan
  `"yarn"` ayarlayın.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Güvenilir `operator.admin` Gateway istemcilerinin
  `skills.upload.*` üzerinden hazırlanan özel zip arşivlerini kurmasına izin
  verin. Normal ClawHub kurulumları bu ayarı gerektirmez.
</ParamField>

## Operatör Kurulum Politikası (`security.installPolicy`)

Operatörlerin skill ve Plugin kurulumlarını ana makineye özgü politikayla
onaylamak veya engellemek için güvenilir bir yerel komuta ihtiyaç duyduğu
durumlarda `security.installPolicy` kullanın. Politika, OpenClaw kaynak materyalini
hazırladıktan sonra ve kurulum ya da güncelleme devam etmeden önce çalışır.
ClawHub skill'leri, yüklenen skill'ler, Git/yerel skill'ler, skill bağımlılığı
yükleyicileri ve Plugin kurulum/güncelleme kaynakları için geçerlidir.

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // Desteklenen her hedefi kapsamak için targets alanını atlayın.
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
  Operatöre ait kurulum politikasını etkinleştirir. Geçerli bir
  `exec` komutu olmadan etkinleştirildiğinde kurulumlar güvenli
  biçimde başarısız olur.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  İsteğe bağlı hedef filtresi. Atlandığında politika desteklenen her hedefe
  uygulanır; böylece yeni kurulumlar beklenmedik şekilde açık kalmaz.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Güvenilir politika yürütülebilir dosyasının mutlak yolu. OpenClaw bunu bir
  kabuk olmadan çalıştırır ve kullanmadan önce yolu doğrular.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  `command` sonrasında geçirilen sabit bağımsız değişkenler.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Tek bir politika kararı için azami gerçek zaman çalışma süresi.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Politika güvenli biçimde başarısız olmadan önce stdout veya stderr çıktısı
  alınmadan geçebilecek azami süre.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Politika işleminden kabul edilen birleşik stdout ve stderr çıktısının azami
  bayt sayısı.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Politika işlemine sağlanan değişmez ortam değişkenleri.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  OpenClaw işleminden politika işlemine kopyalanan ortam değişkeni adları.
  Yalnızca adlandırılmış değişkenler geçirilir.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Politika yürütülebilir dosyasını içerebilecek dizinlerin isteğe bağlı izin
  listesi.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Komut yolu sahipliği ve izin denetimlerini atlar. Yalnızca yol başka bir
  mekanizmayla korunuyorsa kullanın.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Yapılandırılmış komut yolunun sembolik bağlantı olmasına izin verir.
  Çözümlenen hedef yine de diğer yol denetimlerini karşılamalıdır. Yorumlayıcı
  betiği bağımsız değişkenleri sembolik bağlantı değil, doğrudan normal
  dosyalar olmalıdır.
</ParamField>

Politika stdin üzerinden `protocolVersion: 1`, `openclawVersion`,
`targetType`, `targetName`, `sourcePath`,
`sourcePathKind`, isteğe bağlı yapılandırılmış `source`,
yapılandırılmış `origin` ve `request` içeren tek bir JSON
nesnesi alır. stdout üzerine tek bir JSON nesnesi yazmalıdır:
`{ "protocolVersion": 1, "decision": "allow" }` veya `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Sıfır olmayan çıkış, zaman aşımı,
hatalı biçimlendirilmiş JSON, eksik alanlar veya desteklenmeyen protokol
sürümleri güvenli biçimde başarısız olur.

OpenClaw, normal Gateway başlatması sırasında kurulum politikasını çalıştırmaz.
Politika etkin ancak kullanılamaz olduğunda kurulumlar ve güncellemeler güvenli
biçimde başarısız olur. `openclaw doctor` statik doğrulama gerçekleştirir;
`openclaw doctor --deep` yapılandırılmış komuta karşı sentetik bir kurulum yoklaması
çalıştırır.

Toplu güncellemeler politikayı hedef başına uygular: engellenen bir skill veya
Plugin güncellemesi, politikayı devre dışı bırakmadan ya da toplu işlemdeki
sonraki hedefleri atlamadan o hedef için başarısız olur.

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
        reason: "yerel Plugin yolları bu ana makinede onaylanmıyor",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## Paketle gelen skill izin listesi

<ParamField path="skills.allowBundled" type="string[]">
  Yalnızca **paketle gelen** skill'ler için isteğe bağlı izin listesi.
  Ayarlandığında yalnızca listedeki paketle gelen skill'ler uygun olur.
  Yönetilen, aracı düzeyindeki ve çalışma alanı skill'leri bundan etkilenmez.
</ParamField>

## Skill başına girdiler (`skills.entries`)

`entries` altındaki anahtarlar varsayılan olarak skill
`name` değeriyle eşleşir. Bir skill `metadata.openclaw.skillKey` tanımlıyorsa
bunun yerine o anahtarı kullanın. Kısa çizgili adları tırnak içine alın
(JSON5, tırnaklı anahtarlara izin verir).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false`, paketle gelmiş veya kurulmuş olsa bile skill'i devre dışı
  bırakır. Paketle gelen `coding-agent` skill'i isteğe bağlıdır; bunu
  `true` olarak ayarlayın ve `claude`,
  `codex`, `opencode` ya da desteklenen başka bir CLI'ın
  kurulu ve kimliği doğrulanmış olduğundan emin olun.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` bildiren skill'ler için kolaylık alanı.
  Düz metin dizesini veya SecretRef'i destekler: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Aracı çalıştırması için eklenen ortam değişkenleri. Yalnızca değişken
  işlemde zaten ayarlanmamışsa eklenir.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Skill başına özel yapılandırma alanları için isteğe bağlı alan grubu.
</ParamField>

## Aracı izin listeleri (`agents`)

Aynı makine/çalışma alanı skill köklerini ancak aracı başına farklı bir görünür
skill kümesini istediğinizde aracı yapılandırmasını kullanın.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // paylaşılan temel küme
    },
    list: [
      { id: "writer" }, // github ve weather değerlerini devralır
      { id: "docs", skills: ["docs-search"] }, // varsayılanları tamamen değiştirir
      { id: "locked-down", skills: [] }, // skill yok
    ],
  },
}
```

<ParamField path="agents.defaults.skills" type="string[]">
  `agents.list[].skills` değerini atlayan aracılar tarafından devralınan paylaşılan
  temel izin listesi. Skills'ı varsayılan olarak kısıtlamamak için bunu tamamen
  atlayın.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Bu aracı için açık nihai skill kümesi. Açık listeler, devralınan varsayılanları
  **değiştirir**; birleştirmez. Bu aracıya hiçbir skill göstermemek için
  `[]` olarak ayarlayın.
</ParamField>

<Warning>
  Aracı skill izin listeleri; OpenClaw skill keşfi, istemler, eğik çizgi komutu
  keşfi, korumalı alan eşitlemesi ve skill anlık görüntüleri için bir görünürlük
  ve yükleme filtresidir. Bunlar kabuk zamanı yetkilendirme sınırı değildir.
  Bir aracı ana makine `exec` komutunu çalıştırabiliyorsa bu kabuk,
  `~/.openclaw/skills/config/mcporter.json` gibi MCP istemci kayıtları dahil olmak üzere harici
  istemcileri çalıştırmaya veya yürütme kullanıcısının görebildiği ana makine
  dosyalarını okumaya devam edebilir. Aracı başına MCP yalıtımı için skill izin
  listelerini korumalı alan/işletim sistemi kullanıcısı yalıtımıyla birleştirin,
  ana makine yürütmesini reddedin veya sıkı biçimde izin listesine alın ve MCP
  sunucusunda aracı başına kimlik bilgilerini tercih edin.
</Warning>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  `true` olduğunda OpenClaw, kalıcı düzeltmelerden bekleyen öneriler oluşturabilir
  ve sistem boşta kaldıktan sonra başarıyla tamamlanmış kapsamlı çalışmaları
  inceleyebilir. Bu, uygun işlemlerden sonra arka planda bir model çalıştırması
  ekleyebilir. Ayar `false` olduğunda kullanıcı istemiyle
  beceri oluşturma ve `/learn` çalışmaya devam eder.
</ParamField>

Uygunluk, gizlilik, maliyet, yalnızca öneri izinleri ve sorun giderme hakkında
bilgi için [Kendi kendine öğrenme](/tools/self-learning) bölümüne bakın.

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"auto"'>
  `auto`, ek bir onay istemi olmadan aracının uygulama, reddetme
  veya karantinaya alma işlemlerini başlatmasına izin verir. `pending`
  operatör onayı gerektirir.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Beceri Atölyesi'nin uygulama işleminin, gerçek hedefi `skills.load.allowSymlinkTargets`
  tarafından zaten güvenilir kabul edilen çalışma alanı beceri sembolik bağlantıları
  üzerinden yazmasına izin verin. Oluşturulan önerilerin uygulanması bu paylaşılan
  beceri kökünü değiştirmemeliyse bunu devre dışı bırakın.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Çalışma alanı başına tutulan bekleyen ve karantinaya alınmış önerilerin azami
  sayısı (izin verilen aralık: 1-200).
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Öneri gövdesinin bayt cinsinden azami boyutu (izin verilen aralık: 1024-200000).
  Öneri açıklamaları, keşif ve listeleme çıktısında göründükleri için ayrıca
  160 bayt ile kesin olarak sınırlandırılır.
</ParamField>

Bu yapılandırmanın denetlediği öneri yaşam döngüsü, CLI komutları, aracı araç
parametreleri ve Gateway yöntemleri için [Beceri Atölyesi](/tr/tools/skill-workshop)
bölümüne bakın.

## Sembolik bağlantılı beceri kökleri

Varsayılan olarak çalışma alanı, proje aracısı, ek dizin ve paketlenmiş beceri
kökleri kapsama sınırlarıdır. `<workspace>/skills` altında bulunan ve kökün dışına
çözümlenen sembolik bağlantılı bir beceri klasörü, bir günlük mesajıyla atlanır.

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

Bu yapılandırmayla `<workspace>/skills/manager -> ~/Projects/manager/skills`, gerçek yol çözümlemesinden sonra
kabul edilir. `extraDirs` kardeş depoyu doğrudan tarar;
`allowSymlinkTargets` mevcut düzenler için sembolik bağlantılı yolu korur.

Beceri Atölyesi'nin uygulama işlemi varsayılan olarak bu sembolik bağlantılar
üzerinden yazmaz. Atölye'nin uygulama işleminin zaten güvenilir kabul edilen
sembolik bağlantı hedefleri altındaki becerileri değiştirmesine izin vermek
için ayrıca etkinleştirin:

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

Yönetilen `~/.openclaw/skills` ve kişisel `~/.agents/skills` dizinleri,
beceri dizini sembolik bağlantılarını zaten koşulsuz olarak kabul eder
(her beceri için `SKILL.md` kapsamı yine geçerlidir) —
`allowSymlinkTargets` yalnızca çalışma alanı, ek dizin ve proje aracısı
(`<workspace>/.agents/skills`) kökleri için gereklidir.

## Korumalı alandaki beceriler ve ortam değişkenleri

<Warning>
  `skills.entries.<skill>.env` ve `apiKey` yalnızca **ana makine**
  çalıştırmaları için geçerlidir. Korumalı alan içinde hiçbir etkileri yoktur —
  `GEMINI_API_KEY` bağımlılığı olan bir beceri, değişken korumalı alana
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
  Docker daemon erişimi olan kullanıcılar, `sandbox.docker.env` değerlerini
  Docker meta verileri üzerinden inceleyebilir. Bu açığa çıkma kabul edilebilir
  değilse bağlanmış bir gizli bilgi dosyası, özel bir imaj veya başka bir
  teslim yolu kullanın.
</Note>

## Yükleme sırası hatırlatması

```text
workspace/skills      (en yüksek)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
paketlenmiş beceriler
skills.load.extraDirs (en düşük)
```

İzleyici etkinleştirildiğinde becerilerde ve yapılandırmada yapılan değişiklikler
bir sonraki yeni oturumda veya izleyici bir değişiklik algıladığında bir sonraki
aracı işleminde yürürlüğe girer.

## İlgili

<CardGroup cols={2}>
  <Card title="Beceriler başvurusu" href="/tr/tools/skills" icon="puzzle-piece">
    Becerilerin ne olduğu, yükleme sırası, koşullu etkinleştirme ve SKILL.md biçimi.
  </Card>
  <Card title="Beceri oluşturma" href="/tr/tools/creating-skills" icon="hammer">
    Özel çalışma alanı becerileri yazma.
  </Card>
  <Card title="Beceri Atölyesi" href="/tr/tools/skill-workshop" icon="flask">
    Aracı tarafından taslak hâline getirilen beceriler için öneri kuyruğu.
  </Card>
  <Card title="Kendi kendine öğrenme" href="/tools/self-learning" icon="brain">
    Tamamlanan çalışmalardan elde edilen ihtiyatlı, isteğe bağlı öneriler.
  </Card>
  <Card title="Eğik çizgi komutları" href="/tr/tools/slash-commands" icon="terminal">
    Yerel eğik çizgi komutu kataloğu ve sohbet yönergeleri.
  </Card>
</CardGroup>

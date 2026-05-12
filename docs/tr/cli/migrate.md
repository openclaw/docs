---
read_when:
    - Hermes veya başka bir ajan sisteminden OpenClaw'a geçiş yapmak istiyorsunuz
    - Plugin'e ait bir geçiş sağlayıcısı ekliyorsunuz
summary: '`openclaw migrate` için CLI referansı (durumu başka bir aracı sisteminden içe aktarın)'
title: Geçiş yap
x-i18n:
    generated_at: "2026-05-12T00:58:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95d31d2995d426c7886700c9e0e6c6fa0c013a27c0bfe7cf91380c8029d6df89
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Başka bir aracı sisteminden durumu, Plugin tarafından sahip olunan bir geçiş sağlayıcısı üzerinden içe aktarın. Paketle gelen sağlayıcılar Codex CLI durumunu, [Claude](/tr/install/migrating-claude) ve [Hermes](/tr/install/migrating-hermes) öğelerini kapsar; üçüncü taraf plugins ek sağlayıcılar kaydedebilir.

<Tip>
Kullanıcıya yönelik adım adım kılavuzlar için bkz. [Claude'dan Geçiş](/tr/install/migrating-claude) ve [Hermes'ten Geçiş](/tr/install/migrating-hermes). [Geçiş merkezi](/tr/install/migrating) tüm yolları listeler.
</Tip>

## Komutlar

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --plugin google-calendar
openclaw migrate apply codex --yes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  Kayıtlı bir geçiş sağlayıcısının adı, örneğin `hermes`. Yüklü sağlayıcıları görmek için `openclaw migrate list` çalıştırın.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Planı oluşturup durumu değiştirmeden çıkın.
</ParamField>
<ParamField path="--from <path>" type="string">
  Kaynak durum dizinini geçersiz kılın. Hermes varsayılan olarak `~/.hermes` kullanır.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Desteklenen kimlik bilgilerini içe aktarın. Varsayılan olarak kapalıdır.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Plan çakışmalar bildirdiğinde, uygulamanın mevcut hedefleri değiştirmesine izin verin.
</ParamField>
<ParamField path="--yes" type="boolean">
  Onay istemini atlayın. Etkileşimsiz modda gereklidir.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Beceri adına veya öğe kimliğine göre bir beceri kopyalama öğesi seçin. Birden fazla Skills geçirmek için bayrağı tekrarlayın. Atlandığında, etkileşimli Codex geçişleri bir onay kutusu seçici gösterir ve etkileşimsiz geçişler planlanan tüm Skills öğelerini korur.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Plugin adına veya öğe kimliğine göre bir Codex Plugin yükleme öğesi seçin. Birden fazla Codex plugins geçirmek için bayrağı tekrarlayın. Atlandığında, etkileşimli Codex geçişleri yerel bir Codex Plugin onay kutusu seçici gösterir ve etkileşimsiz geçişler planlanan tüm plugins öğelerini korur. Bu yalnızca Codex uygulama sunucusu envanteri tarafından keşfedilen kaynakta yüklü `openai-curated` Codex plugins için geçerlidir.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Uygulama öncesi yedeklemeyi atlayın. Yerel OpenClaw durumu varsa `--force` gerektirir.
</ParamField>
<ParamField path="--force" type="boolean">
  Uygulama aksi halde yedeklemeyi atlamayı reddedecekse `--no-backup` ile birlikte gereklidir.
</ParamField>
<ParamField path="--json" type="boolean">
  Planı veya uygulama sonucunu JSON olarak yazdırın. `--json` kullanılıp `--yes` kullanılmadığında, uygulama planı yazdırır ve durumu değiştirmez.
</ParamField>

## Güvenlik modeli

`openclaw migrate` önce önizleme yapar.

<AccordionGroup>
  <Accordion title="Uygulamadan önce önizleyin">
    Sağlayıcı, herhangi bir şey değişmeden önce çakışmalar, atlanan öğeler ve hassas öğeler dahil olmak üzere öğelendirilmiş bir plan döndürür. JSON planları, uygulama çıktısı ve geçiş raporları; API anahtarları, token'lar, yetkilendirme üstbilgileri, çerezler ve parolalar gibi gizli görünümlü iç içe anahtarları redakte eder.

    `openclaw migrate apply <provider>`, `--yes` ayarlanmadığı sürece durumu değiştirmeden önce planı önizler ve onay ister. Etkileşimsiz modda, uygulama `--yes` gerektirir.

  </Accordion>
  <Accordion title="Yedeklemeler">
    Uygulama, geçişi uygulamadan önce bir OpenClaw yedeği oluşturur ve doğrular. Henüz yerel OpenClaw durumu yoksa yedekleme adımı atlanır ve geçiş devam edebilir. Durum varken yedeklemeyi atlamak için hem `--no-backup` hem de `--force` geçirin.
  </Accordion>
  <Accordion title="Çakışmalar">
    Plan çakışmalar içerdiğinde uygulama devam etmeyi reddeder. Planı inceleyin, ardından mevcut hedefleri değiştirmek kasıtlıysa `--overwrite` ile yeniden çalıştırın. Sağlayıcılar, geçiş raporu dizininde üzerine yazılan dosyalar için yine de öğe düzeyinde yedekler yazabilir.
  </Accordion>
  <Accordion title="Gizli bilgiler">
    Gizli bilgiler varsayılan olarak asla içe aktarılmaz. Desteklenen kimlik bilgilerini içe aktarmak için `--include-secrets` kullanın.
  </Accordion>
</AccordionGroup>

## Claude sağlayıcısı

Paketle gelen Claude sağlayıcısı, varsayılan olarak Claude Code durumunu `~/.claude` konumunda algılar. Belirli bir Claude Code ana dizinini veya proje kökünü içe aktarmak için `--from <path>` kullanın.

<Tip>
Kullanıcıya yönelik adım adım kılavuz için bkz. [Claude'dan Geçiş](/tr/install/migrating-claude).
</Tip>

### Claude neleri içe aktarır

- Proje `CLAUDE.md` ve `.claude/CLAUDE.md` dosyalarını OpenClaw aracı çalışma alanına aktarır.
- Kullanıcı `~/.claude/CLAUDE.md` dosyasını çalışma alanı `USER.md` dosyasına ekler.
- Proje `.mcp.json`, Claude Code `~/.claude.json` ve Claude Desktop `claude_desktop_config.json` içindeki MCP sunucu tanımlarını aktarır.
- `SKILL.md` içeren Claude beceri dizinlerini aktarır.
- Claude komut Markdown dosyalarını yalnızca manuel çağrıyla kullanılan OpenClaw Skills öğelerine dönüştürür.

### Arşiv ve manuel inceleme durumu

Claude hook'ları, izinleri, ortam varsayılanları, yerel bellek, yol kapsamlı kurallar, alt aracılar, önbellekler, planlar ve proje geçmişi geçiş raporunda korunur veya manuel inceleme öğeleri olarak raporlanır. OpenClaw hook'ları yürütmez, geniş izin listelerini kopyalamaz veya OAuth/Desktop kimlik bilgisi durumunu otomatik olarak içe aktarmaz.

## Codex sağlayıcısı

Paketle gelen Codex sağlayıcısı, varsayılan olarak Codex CLI durumunu `~/.codex` konumunda veya bu ortam değişkeni ayarlandığında `CODEX_HOME` konumunda algılar. Belirli bir Codex ana dizininin envanterini çıkarmak için `--from <path>` kullanın.

OpenClaw Codex harness'a taşınırken ve yararlı kişisel Codex CLI varlıklarını bilinçli şekilde yükseltmek istediğinizde bu sağlayıcıyı kullanın. Yerel Codex uygulama sunucusu başlatmaları aracı başına `CODEX_HOME` ve `HOME` dizinleri kullanır, bu nedenle varsayılan olarak kişisel Codex CLI durumunuzu okumaz.

Etkileşimli bir terminalde `openclaw migrate codex` çalıştırmak tam planı önizler, ardından son uygulama onayından önce onay kutusu seçicileri açar. Önce beceri kopyalama öğeleri sorulur. Toplu seçim için `Toggle all on` veya `Toggle all off` kullanın; planlanan Skills işaretli başlar, çakışan Skills işaretsiz başlar ve `Skip for now` bu çalıştırmada beceri kopyalarını atlar ancak Plugin seçimine devam eder. Kaynakta yüklü derlenmiş Codex plugins geçirilebilir olduğunda ve `--plugin` sağlanmadığında, geçiş daha sonra Plugin adına göre yerel Codex Plugin aktivasyonu ister. Plugin öğeleri, hedef OpenClaw Codex Plugin yapılandırmasında o Plugin zaten yoksa işaretli başlar. Mevcut hedef plugins işaretsiz başlar ve `conflict: plugin exists` gibi bir çakışma ipucu gösterir; bu çalıştırmada hiçbir yerel Codex plugins geçirmemek için `Toggle all off` seçin veya uygulamadan önce durmak için `Skip for now` seçin. Betikli veya kesin çalıştırmalar için her beceri başına bir kez `--skill <name>` geçirin, örneğin:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Yerel Codex Plugin geçişini etkileşimsiz olarak bir veya daha fazla kaynakta yüklü derlenmiş plugins ile sınırlamak için `--plugin <name>` kullanın:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex neleri içe aktarır

- Codex'in `.system` önbelleği hariç, `$CODEX_HOME/skills` altındaki Codex CLI beceri dizinleri.
- Aracı başına sahiplik istediğinizde, geçerli OpenClaw aracı çalışma alanına kopyalanan `$HOME/.agents/skills` altındaki kişisel AgentSkills.
- Codex uygulama sunucusu `plugin/list` üzerinden keşfedilen kaynakta yüklü `openai-curated` Codex plugins. Uygulama, hedef uygulama sunucusu o Plugin'i zaten yüklü ve etkin olarak bildirse bile, seçilen her Plugin için uygulama sunucusu `plugin/install` çağırır. Geçirilen Codex plugins yalnızca yerel Codex harness'ı seçen oturumlarda kullanılabilir; Pi, normal OpenAI sağlayıcı çalıştırmaları, ACP konuşma bağlamaları veya diğer harness'lara sunulmaz.

### Manuel inceleme Codex durumu

Codex `config.toml`, yerel `hooks/hooks.json`, derlenmemiş marketplaces ve kaynakta yüklü derlenmiş plugins olmayan önbelleğe alınmış Plugin paketleri otomatik olarak etkinleştirilmez. Bunlar manuel inceleme için geçiş raporuna kopyalanır veya raporlanır.

Geçirilen kaynakta yüklü derlenmiş plugins için uygulama şunları yazar:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- seçilen her Plugin için `marketplaceName: "openai-curated"` ve `pluginName` içeren bir açık Plugin girdisi

Geçiş asla `plugins["*"]` yazmaz ve yerel marketplace önbellek yollarını asla saklamaz. Kimlik doğrulama gerektiren yüklemeler etkilenen Plugin öğesinde `status: "skipped"`, `reason: "auth_required"` ve temizlenmiş uygulama tanımlayıcıları ile raporlanır. Açık yapılandırma girdileri, siz yeniden yetkilendirip etkinleştirene kadar devre dışı olarak yazılır. Diğer yükleme hataları öğe kapsamlı `error` sonuçlarıdır.

Planlama sırasında Codex uygulama sunucusu Plugin envanteri kullanılamazsa geçiş, tüm geçişi başarısız kılmak yerine önbelleğe alınmış paket danışma öğelerine geri döner.

## Hermes sağlayıcısı

Paketle gelen Hermes sağlayıcısı, varsayılan olarak durumu `~/.hermes` konumunda algılar. Hermes başka bir yerdeyse `--from <path>` kullanın.

### Hermes neleri içe aktarır

- `config.yaml` içindeki varsayılan model yapılandırması.
- `providers` ve `custom_providers` içindeki yapılandırılmış model sağlayıcıları ve özel OpenAI uyumlu uç noktalar.
- `mcp_servers` veya `mcp.servers` içindeki MCP sunucu tanımları.
- `SOUL.md` ve `AGENTS.md` dosyalarını OpenClaw aracı çalışma alanına aktarır.
- `memories/MEMORY.md` ve `memories/USER.md` dosyalarını çalışma alanı bellek dosyalarına ekler.
- OpenClaw dosya belleği için bellek yapılandırması varsayılanları, ayrıca Honcho gibi harici bellek sağlayıcıları için arşiv veya manuel inceleme öğeleri.
- `skills/<name>/` altında `SKILL.md` dosyası içeren Skills.
- `skills.config` içindeki beceri başına yapılandırma değerleri.
- `.env` içindeki desteklenen API anahtarları, yalnızca `--include-secrets` ile.

### Desteklenen `.env` anahtarları

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Yalnızca arşiv durumu

OpenClaw'ın güvenle yorumlayamadığı Hermes durumu, manuel inceleme için geçiş raporuna kopyalanır, ancak canlı OpenClaw yapılandırmasına veya kimlik bilgilerine yüklenmez. Bu, OpenClaw'ın bunu otomatik olarak yürütebileceği veya güvenebileceği izlenimi vermeden opak ya da güvenli olmayan durumu korur:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

### Uygulamadan sonra

```bash
openclaw doctor
```

## Plugin sözleşmesi

Geçiş kaynakları plugins öğeleridir. Bir Plugin, sağlayıcı kimliklerini `openclaw.plugin.json` içinde bildirir:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Çalışma zamanında Plugin `api.registerMigrationProvider(...)` çağırır. Sağlayıcı `detect`, `plan` ve `apply` uygular. Çekirdek, CLI düzenlemesini, yedekleme politikasını, istemleri, JSON çıktısını ve çakışma ön denetimini sahiplenir. Çekirdek, incelenmiş planı `apply(ctx, plan)` içine geçirir ve sağlayıcılar uyumluluk için yalnızca bu argüman yoksa planı yeniden oluşturabilir.

Sağlayıcı plugins, öğe oluşturma ve özet sayımları için `openclaw/plugin-sdk/migration`, ayrıca çakışma farkındalığı olan dosya kopyaları, yalnızca arşiv rapor kopyaları, önbelleğe alınmış config-runtime sarmalayıcıları ve geçiş raporları için `openclaw/plugin-sdk/migration-runtime` kullanabilir.

## İlk kurulum entegrasyonu

Bir sağlayıcı bilinen bir kaynağı algıladığında ilk kurulum geçiş sunabilir. Hem `openclaw onboard --flow import` hem de `openclaw setup --wizard --import-from hermes` aynı Plugin geçiş sağlayıcısını kullanır ve uygulamadan önce yine de bir önizleme gösterir.

<Note>
İçe aktarma ile ilk katılım, temiz bir OpenClaw kurulumu gerektirir. Yerel durumunuz zaten varsa önce yapılandırmayı, kimlik bilgilerini, oturumları ve çalışma alanını sıfırlayın. Yedekle-üzerine yaz veya birleştirmeli içe aktarmalar, mevcut kurulumlar için özellik bayrağıyla sınırlandırılmıştır.
</Note>

## İlgili

- [Hermes'ten geçiş](/tr/install/migrating-hermes): kullanıcıya yönelik adım adım kılavuz.
- [Claude'dan geçiş](/tr/install/migrating-claude): kullanıcıya yönelik adım adım kılavuz.
- [Geçiş](/tr/install/migrating): OpenClaw'ı yeni bir makineye taşıyın.
- [Doctor](/tr/gateway/doctor): geçiş uygulandıktan sonra sağlık denetimi.
- [Plugin'ler](/tr/tools/plugin): plugin kurulumu ve kaydı.

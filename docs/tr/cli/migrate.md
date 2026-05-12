---
read_when:
    - Hermes veya başka bir ajan sisteminden OpenClaw’a geçiş yapmak istiyorsunuz
    - Plugin'e ait bir geçiş sağlayıcısı ekliyorsunuz
summary: '`openclaw migrate` için CLI başvurusu (başka bir ajan sisteminden durumu içe aktarma)'
title: Geçiş yapın
x-i18n:
    generated_at: "2026-05-12T23:30:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5103a85404f0204cc265df611449e9cd4b18347c6862a8b36d13838709896459
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Başka bir agent sisteminden Plugin tarafından sahiplenilen bir migration provider aracılığıyla durumu içe aktarın. Paketle gelen provider'lar Codex CLI durumunu, [Claude](/tr/install/migrating-claude) ve [Hermes](/tr/install/migrating-hermes) kapsamını içerir; üçüncü taraf Plugin'ler ek provider'lar kaydedebilir.

<Tip>
Kullanıcıya dönük adım adım anlatımlar için [Claude'dan geçiş](/tr/install/migrating-claude) ve [Hermes'ten geçiş](/tr/install/migrating-hermes) bölümlerine bakın. [migration merkezi](/tr/install/migrating) tüm yolları listeler.
</Tip>

## Komutlar

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate codex --plugin google-calendar --verify-plugin-apps --dry-run
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
  Kayıtlı bir migration provider'ın adı, örneğin `hermes`. Yüklü provider'ları görmek için `openclaw migrate list` çalıştırın.
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
  Plan çakışmalar bildirdiğinde apply işleminin mevcut hedefleri değiştirmesine izin verin.
</ParamField>
<ParamField path="--yes" type="boolean">
  Onay istemini atlayın. Etkileşimsiz modda gereklidir.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Skill adına veya öğe kimliğine göre bir skill kopyalama öğesi seçin. Birden fazla skill migrate etmek için bayrağı tekrarlayın. Atlandığında, etkileşimli Codex migration'ları bir checkbox seçici gösterir ve etkileşimsiz migration'lar planlanan tüm skills'i tutar.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Plugin adına veya öğe kimliğine göre bir Codex Plugin kurulum öğesi seçin. Birden fazla Codex Plugin'i migrate etmek için bayrağı tekrarlayın. Atlandığında, etkileşimli Codex migration'ları yerel bir Codex Plugin checkbox seçici gösterir ve etkileşimsiz migration'lar planlanan tüm Plugin'leri tutar. Bu yalnızca Codex app-server envanteri tarafından bulunan, kaynakta yüklü `openai-curated` Codex Plugin'leri için geçerlidir.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Yalnızca Codex. Yerel Plugin etkinleştirmeyi planlamadan önce yeni bir kaynak Codex app-server `app/list` gezintisini zorlayın. Migration planlamasını hızlı tutmak için varsayılan olarak kapalıdır.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Apply öncesi yedeklemeyi atlayın. Yerel OpenClaw durumu varsa `--force` gerektirir.
</ParamField>
<ParamField path="--force" type="boolean">
  Apply işlemi aksi halde yedeklemeyi atlamayı reddedecekse `--no-backup` ile birlikte gereklidir.
</ParamField>
<ParamField path="--json" type="boolean">
  Planı veya apply sonucunu JSON olarak yazdırın. `--json` ve `--yes` olmadan, apply planı yazdırır ve durumu değiştirmez.
</ParamField>

## Güvenlik modeli

`openclaw migrate` önce önizleme yapar.

<AccordionGroup>
  <Accordion title="Apply öncesi önizleme">
    Provider, herhangi bir şey değişmeden önce çakışmalar, atlanan öğeler ve hassas öğeler dahil olmak üzere öğelendirilmiş bir plan döndürür. JSON planları, apply çıktısı ve migration raporları API anahtarları, token'lar, authorization header'ları, çerezler ve parolalar gibi iç içe geçmiş gizli görünümlü anahtarları gizler.

    `openclaw migrate apply <provider>`, `--yes` ayarlanmadığı sürece durumu değiştirmeden önce planı önizler ve onay ister. Etkileşimsiz modda apply `--yes` gerektirir.

  </Accordion>
  <Accordion title="Yedeklemeler">
    Apply, migration'ı uygulamadan önce bir OpenClaw yedeği oluşturur ve doğrular. Henüz yerel OpenClaw durumu yoksa yedekleme adımı atlanır ve migration devam edebilir. Durum varken yedeklemeyi atlamak için hem `--no-backup` hem de `--force` iletin.
  </Accordion>
  <Accordion title="Çakışmalar">
    Planda çakışmalar olduğunda apply devam etmeyi reddeder. Planı gözden geçirin, ardından mevcut hedefleri değiştirmek amaçlıysa `--overwrite` ile yeniden çalıştırın. Provider'lar, üzerine yazılan dosyalar için migration rapor dizininde yine de öğe düzeyinde yedekler yazabilir.
  </Accordion>
  <Accordion title="Sırlar">
    Sırlar varsayılan olarak asla içe aktarılmaz. Desteklenen kimlik bilgilerini içe aktarmak için `--include-secrets` kullanın.
  </Accordion>
</AccordionGroup>

## Claude provider

Paketle gelen Claude provider, varsayılan olarak Claude Code durumunu `~/.claude` konumunda algılar. Belirli bir Claude Code ana dizinini veya proje kökünü içe aktarmak için `--from <path>` kullanın.

<Tip>
Kullanıcıya dönük adım adım anlatım için [Claude'dan geçiş](/tr/install/migrating-claude) bölümüne bakın.
</Tip>

### Claude neleri içe aktarır

- Proje `CLAUDE.md` ve `.claude/CLAUDE.md` dosyalarını OpenClaw agent çalışma alanına.
- Kullanıcı `~/.claude/CLAUDE.md` içeriğini çalışma alanı `USER.md` dosyasına ekler.
- Proje `.mcp.json`, Claude Code `~/.claude.json` ve Claude Desktop `claude_desktop_config.json` kaynaklarından MCP server tanımları.
- `SKILL.md` içeren Claude skill dizinleri.
- Yalnızca elle çağrılacak şekilde OpenClaw skills'e dönüştürülen Claude komut Markdown dosyaları.

### Arşiv ve elle inceleme durumu

Claude hook'ları, izinleri, ortam varsayılanları, yerel bellek, yol kapsamlı kurallar, subagent'lar, önbellekler, planlar ve proje geçmişi migration raporunda korunur veya elle inceleme öğeleri olarak raporlanır. OpenClaw hook'ları yürütmez, geniş allowlist'leri kopyalamaz veya OAuth/Desktop kimlik bilgisi durumunu otomatik olarak içe aktarmaz.

## Codex provider

Paketle gelen Codex provider, varsayılan olarak Codex CLI durumunu `~/.codex` konumunda veya bu ortam değişkeni ayarlanmışsa `CODEX_HOME` konumunda algılar. Belirli bir Codex ana dizinini envantere almak için `--from <path>` kullanın.

OpenClaw Codex harness'a geçerken ve yararlı kişisel Codex CLI varlıklarını bilinçli olarak yükseltmek istediğinizde bu provider'ı kullanın. Yerel Codex app-server başlatmaları agent başına `CODEX_HOME` ve `HOME` dizinlerini kullanır, bu nedenle varsayılan olarak kişisel Codex CLI durumunuzu okumazlar.

Etkileşimli bir terminalde `openclaw migrate codex` çalıştırmak tam planı önizler, ardından son apply onayından önce checkbox seçicileri açar. Skill kopyalama öğeleri önce sorulur. Toplu seçim için `Toggle all on` veya `Toggle all off` kullanın. Satırları açıp kapatmak için Space'e basın veya vurgulanan satırı etkinleştirip devam etmek için Enter'a basın. Planlanan skills işaretli başlar, çakışan skills işaretsiz başlar ve `Skip for now`, bu çalıştırmada skill kopyalarını atlarken yine de Plugin seçimine devam eder. Kaynakta yüklü curated Codex Plugin'ler migrate edilebilir olduğunda ve `--plugin` sağlanmadığında, migration ardından Plugin adına göre yerel Codex Plugin etkinleştirmesi ister. Hedef OpenClaw Codex Plugin yapılandırmasında o Plugin zaten yoksa Plugin öğeleri işaretli başlar. Mevcut hedef Plugin'ler işaretsiz başlar ve `conflict: plugin exists` gibi bir çakışma ipucu gösterir; bu çalıştırmada hiçbir yerel Codex Plugin'i migrate etmemek için `Toggle all off` seçin veya apply öncesinde durmak için `Skip for now` seçin. Betikli veya kesin çalıştırmalar için her skill başına bir kez `--skill <name>` iletin, örneğin:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Yerel Codex Plugin migration'ını etkileşimsiz olarak bir veya daha fazla kaynakta yüklü curated Plugin ile sınırlamak için `--plugin <name>` kullanın:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex neleri içe aktarır

- Codex'in `.system` önbelleği hariç, `$CODEX_HOME/skills` altındaki Codex CLI skill dizinleri.
- Agent başına sahiplik istediğinizde geçerli OpenClaw agent çalışma alanına kopyalanan, `$HOME/.agents/skills` altındaki kişisel AgentSkills.
- Codex app-server `plugin/list` aracılığıyla bulunan, kaynakta yüklü `openai-curated` Codex Plugin'leri. Planlama, etkinleştirilmiş her yüklü Plugin için `plugin/read` okur. App destekli Plugin'ler, kaynak Codex app-server account yanıtının bir ChatGPT abonelik hesabı olmasını gerektirir; ChatGPT olmayan veya eksik account yanıtları `codex_subscription_required` ile atlanır. Varsayılan olarak migration kaynak `app/list` çağırmaz, bu nedenle account gate'i geçen app destekli Plugin'ler kaynak app erişilebilirliği doğrulaması olmadan planlanır ve account arama taşıma hataları `codex_account_unavailable` ile atlanır. Migration'ın yeni bir kaynak `app/list` anlık görüntüsünü zorlamasını ve yerel etkinleştirmeyi planlamadan önce sahip olunan her app'in mevcut, etkin ve erişilebilir olmasını gerektirmesini istediğinizde `--verify-plugin-apps` iletin. Bu modda, account arama taşıma hataları kaynak app envanteri doğrulamasına düşer. Kaynak app envanteri anlık görüntüsü geçerli işlem için bellekte tutulur; migration çıktısına veya hedef yapılandırmaya yazılmaz. Devre dışı Plugin'ler, okunamayan Plugin ayrıntıları, abonelikle sınırlandırılmış kaynak account'lar ve doğrulama istendiğinde eksik app'ler, devre dışı app'ler, erişilemeyen app'ler veya kaynak app envanteri hataları, hedef yapılandırma girdileri yerine tipli nedenlerle elle atlanan öğeler haline gelir.
  Apply, hedef app-server o Plugin'i zaten yüklü ve etkin olarak raporlasa bile seçili her uygun Plugin için app-server `plugin/install` çağırır. Migrate edilmiş Codex Plugin'leri yalnızca yerel Codex harness'ı seçen oturumlarda kullanılabilir; Pi, normal OpenAI provider çalıştırmaları, ACP konuşma bağlamaları veya diğer harness'lara sunulmaz.

### Elle inceleme gereken Codex durumu

Codex `config.toml`, yerel `hooks/hooks.json`, curated olmayan marketplace'ler, kaynakta yüklü curated Plugin olmayan önbelleğe alınmış Plugin bundle'ları ve kaynak abonelik gate'inden geçemeyen kaynakta yüklü Plugin'ler otomatik olarak etkinleştirilmez. `--verify-plugin-apps` ayarlandığında, kaynak app envanteri gate'inden geçemeyen Plugin'ler de atlanır. Bunlar elle inceleme için migration raporuna kopyalanır veya orada raporlanır.

Migrate edilmiş, kaynakta yüklü curated Plugin'ler için apply şunları yazar:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- seçili her Plugin için `marketplaceName: "openai-curated"` ve `pluginName` içeren bir açık Plugin girdisi

Migration hiçbir zaman `plugins["*"]` yazmaz ve yerel marketplace önbellek yollarını asla saklamaz. Kaynak tarafı abonelik hataları, `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled` veya `plugin_read_unavailable` gibi tipli nedenlerle elle işlenecek öğelerde raporlanır. `--verify-plugin-apps` ile kaynak app envanteri hataları `app_inaccessible`, `app_disabled`, `app_missing` veya `app_inventory_unavailable` olarak da görünebilir. Atlanan Plugin'ler hedef yapılandırmaya yazılmaz.
Hedef tarafı kimlik doğrulama gerektiren kurulumlar, etkilenen Plugin öğesinde `status: "skipped"`, `reason: "auth_required"` ve temizlenmiş app tanımlayıcılarıyla raporlanır. Bunların açık yapılandırma girdileri, yeniden yetkilendirip etkinleştirene kadar devre dışı yazılır. Diğer kurulum hataları öğe kapsamlı `error` sonuçlarıdır.

Planlama sırasında Codex app-server Plugin envanteri kullanılamıyorsa migration tüm migration'ı başarısız kılmak yerine önbelleğe alınmış bundle danışma öğelerine geri döner.

## Hermes provider

Paketle gelen Hermes provider, varsayılan olarak `~/.hermes` konumundaki durumu algılar. Hermes başka bir yerdeyse `--from <path>` kullanın.

### Hermes neleri içe aktarır

- `config.yaml` dosyasından varsayılan model yapılandırması.
- `providers` ve `custom_providers` içinden yapılandırılmış model sağlayıcıları ve özel OpenAI uyumlu uç noktalar.
- `mcp_servers` veya `mcp.servers` içinden MCP sunucu tanımları.
- `SOUL.md` ve `AGENTS.md` dosyalarını OpenClaw aracı çalışma alanına.
- `memories/MEMORY.md` ve `memories/USER.md` dosyalarını çalışma alanı bellek dosyalarına eklenmiş şekilde.
- OpenClaw dosya belleği için bellek yapılandırması varsayılanları, ayrıca Honcho gibi harici bellek sağlayıcıları için arşiv veya manuel inceleme öğeleri.
- `skills/<name>/` altında bir `SKILL.md` dosyası içeren Skills.
- `skills.config` içinden Skills başına yapılandırma değerleri.
- `.env` içinden desteklenen API anahtarları, yalnızca `--include-secrets` ile.

### Desteklenen `.env` anahtarları

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Yalnızca arşiv durumu

OpenClaw'un güvenle yorumlayamadığı Hermes durumu, manuel inceleme için geçiş raporuna kopyalanır, ancak canlı OpenClaw yapılandırmasına veya kimlik bilgilerine yüklenmez. Bu, OpenClaw'un bunu otomatik olarak çalıştırabileceği ya da güvenebileceği izlenimini vermeden opak veya güvenli olmayan durumu korur:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

### Uyguladıktan sonra

```bash
openclaw doctor
```

## Plugin sözleşmesi

Geçiş kaynakları Plugin'lerdir. Bir Plugin, sağlayıcı kimliklerini `openclaw.plugin.json` içinde bildirir:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Çalışma zamanında Plugin `api.registerMigrationProvider(...)` çağrısını yapar. Sağlayıcı `detect`, `plan` ve `apply` uygular. Core, CLI orkestrasyonunu, yedekleme politikasını, istemleri, JSON çıktısını ve çakışma ön denetimini yönetir. Core, incelenmiş planı `apply(ctx, plan)` içine geçirir ve sağlayıcılar uyumluluk için yalnızca bu argüman yoksa planı yeniden oluşturabilir.

Sağlayıcı Plugin'leri öğe oluşturma ve özet sayıları için `openclaw/plugin-sdk/migration`, çakışma duyarlı dosya kopyaları, yalnızca arşiv rapor kopyaları, önbelleğe alınmış yapılandırma çalışma zamanı sarmalayıcıları ve geçiş raporları için de `openclaw/plugin-sdk/migration-runtime` kullanabilir.

## Onboarding entegrasyonu

Bir sağlayıcı bilinen bir kaynak algıladığında Onboarding geçiş sunabilir. Hem `openclaw onboard --flow import` hem de `openclaw setup --wizard --import-from hermes` aynı Plugin geçiş sağlayıcısını kullanır ve uygulamadan önce yine de bir önizleme gösterir.

<Note>
Onboarding içe aktarımları yeni bir OpenClaw kurulumu gerektirir. Zaten yerel durumunuz varsa önce yapılandırmayı, kimlik bilgilerini, oturumları ve çalışma alanını sıfırlayın. Yedekleme-artı-üzerine yazma veya birleştirme içe aktarımları mevcut kurulumlar için özellik bayrağına bağlıdır.
</Note>

## İlgili

- [Hermes'ten geçiş](/tr/install/migrating-hermes): kullanıcıya yönelik adım adım kılavuz.
- [Claude'dan geçiş](/tr/install/migrating-claude): kullanıcıya yönelik adım adım kılavuz.
- [Geçiş](/tr/install/migrating): OpenClaw'u yeni bir makineye taşıma.
- [Doctor](/tr/gateway/doctor): bir geçiş uygulandıktan sonra sağlık denetimi.
- [Plugin'ler](/tr/tools/plugin): Plugin kurulumu ve kaydı.

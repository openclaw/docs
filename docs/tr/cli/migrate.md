---
read_when:
    - Hermes veya başka bir ajan sisteminden OpenClaw'a geçiş yapmak istiyorsunuz
    - Plugin'e ait bir geçiş sağlayıcısı ekliyorsunuz
summary: '`openclaw migrate` için CLI başvurusu (başka bir ajan sisteminden durumu içe aktarma)'
title: Geçiş yap
x-i18n:
    generated_at: "2026-05-06T09:05:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 021d673f6e51f5c2320278f0a37830c9aa34cdb4628932be1c09714c375066e3
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Başka bir aracı sisteminden durumu, Plugin tarafından sahip olunan bir migration provider üzerinden içe aktarın. Paketle birlikte gelen sağlayıcılar Codex CLI durumunu, [Claude](/tr/install/migrating-claude) ve [Hermes](/tr/install/migrating-hermes) durumunu kapsar; üçüncü taraf Plugin sağlayıcıları ek sağlayıcılar kaydedebilir.

<Tip>
Kullanıcıya yönelik adım adım kılavuzlar için bkz. [Claude'dan geçiş](/tr/install/migrating-claude) ve [Hermes'ten geçiş](/tr/install/migrating-hermes). [Geçiş merkezi](/tr/install/migrating) tüm yolları listeler.
</Tip>

## Komutlar

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  Kayıtlı bir migration provider adı, örneğin `hermes`. Kurulu sağlayıcıları görmek için `openclaw migrate list` komutunu çalıştırın.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Planı oluşturun ve durumu değiştirmeden çıkın.
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
  Onay istemini atlayın. Etkileşimsiz modda zorunludur.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Skill adına veya öğe kimliğine göre bir skill kopyalama öğesi seçin. Birden fazla skill taşımak için bayrağı tekrarlayın. Atlandığında, etkileşimli Codex geçişleri bir onay kutusu seçici gösterir ve etkileşimsiz geçişler planlanan tüm Skills öğelerini korur.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Apply öncesi yedeklemeyi atlayın. Yerel OpenClaw durumu varsa `--force` gerektirir.
</ParamField>
<ParamField path="--force" type="boolean">
  Apply işlemi aksi halde yedeklemeyi atlamayı reddedecekse `--no-backup` ile birlikte zorunludur.
</ParamField>
<ParamField path="--json" type="boolean">
  Planı veya apply sonucunu JSON olarak yazdırın. `--json` ile ve `--yes` olmadan, apply planı yazdırır ve durumu değiştirmez.
</ParamField>

## Güvenlik modeli

`openclaw migrate` önce önizleme yapar.

<AccordionGroup>
  <Accordion title="Apply öncesi önizleme">
    Sağlayıcı, herhangi bir şey değişmeden önce çakışmalar, atlanan öğeler ve hassas öğeler dahil ayrıntılı bir plan döndürür. JSON planları, apply çıktısı ve geçiş raporları; API anahtarları, belirteçler, yetkilendirme üstbilgileri, çerezler ve parolalar gibi iç içe geçmiş gizli bilgiye benzer anahtarları maskeler.

    `openclaw migrate apply <provider>`, `--yes` ayarlanmadığı sürece durumu değiştirmeden önce planı önizler ve onay ister. Etkileşimsiz modda apply için `--yes` gerekir.

  </Accordion>
  <Accordion title="Yedeklemeler">
    Apply, geçişi uygulamadan önce bir OpenClaw yedeği oluşturur ve doğrular. Henüz yerel OpenClaw durumu yoksa yedekleme adımı atlanır ve geçiş devam edebilir. Durum varken yedeklemeyi atlamak için hem `--no-backup` hem de `--force` geçirin.
  </Accordion>
  <Accordion title="Çakışmalar">
    Planda çakışmalar olduğunda apply devam etmeyi reddeder. Planı inceleyin, ardından mevcut hedefleri değiştirmek kasıtlıysa `--overwrite` ile yeniden çalıştırın. Sağlayıcılar, migration report dizinindeki üzerine yazılan dosyalar için hâlâ öğe düzeyinde yedekler yazabilir.
  </Accordion>
  <Accordion title="Gizli bilgiler">
    Gizli bilgiler varsayılan olarak asla içe aktarılmaz. Desteklenen kimlik bilgilerini içe aktarmak için `--include-secrets` kullanın.
  </Accordion>
</AccordionGroup>

## Claude sağlayıcısı

Paketle birlikte gelen Claude sağlayıcısı, varsayılan olarak `~/.claude` konumundaki Claude Code durumunu algılar. Belirli bir Claude Code ana dizinini veya proje kökünü içe aktarmak için `--from <path>` kullanın.

<Tip>
Kullanıcıya yönelik bir adım adım kılavuz için bkz. [Claude'dan geçiş](/tr/install/migrating-claude).
</Tip>

### Claude neleri içe aktarır

- Proje `CLAUDE.md` ve `.claude/CLAUDE.md` dosyalarını OpenClaw aracı çalışma alanına.
- Kullanıcı `~/.claude/CLAUDE.md` içeriğini çalışma alanı `USER.md` dosyasına ekler.
- Proje `.mcp.json`, Claude Code `~/.claude.json` ve Claude Desktop `claude_desktop_config.json` dosyalarından MCP sunucu tanımları.
- `SKILL.md` içeren Claude skill dizinleri.
- Yalnızca manuel çağırmayla OpenClaw skills öğelerine dönüştürülen Claude komut Markdown dosyaları.

### Arşiv ve manuel inceleme durumu

Claude hooks, izinler, ortam varsayılanları, yerel bellek, yol kapsamlı kurallar, alt aracılar, önbellekler, planlar ve proje geçmişi migration report içinde korunur veya manuel inceleme öğeleri olarak raporlanır. OpenClaw hooks çalıştırmaz, geniş izin listelerini kopyalamaz veya OAuth/Desktop kimlik bilgisi durumunu otomatik olarak içe aktarmaz.

## Codex sağlayıcısı

Paketle birlikte gelen Codex sağlayıcısı, varsayılan olarak `~/.codex` konumundaki Codex CLI durumunu veya bu ortam değişkeni ayarlandığında `CODEX_HOME` konumunu algılar. Belirli bir Codex ana dizinini envanterlemek için `--from <path>` kullanın.

OpenClaw Codex harness ortamına geçerken ve yararlı kişisel Codex CLI varlıklarını bilinçli biçimde öne çıkarmak istediğinizde bu sağlayıcıyı kullanın. Yerel Codex app-server başlatmaları aracı başına `CODEX_HOME` ve `HOME` dizinleri kullanır, bu nedenle varsayılan olarak kişisel Codex CLI durumunuzu okumaz.

Etkileşimli bir terminalde `openclaw migrate codex` çalıştırmak tam planı önizler, ardından son apply onayından önce skill kopyalama öğeleri için bir onay kutusu seçici açar. Toplu seçim için `Toggle all on` veya `Toggle all off` kullanın; planlanan Skills işaretli başlar, çakışan Skills işaretsiz başlar ve `Skip for now`, apply yapmadan Skills öğelerini değiştirmeden bırakır. Betiklenmiş veya kesin çalıştırmalar için her skill başına bir kez `--skill <name>` geçirin, örneğin:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

### Codex neleri içe aktarır

- Codex'in `.system` önbelleği hariç, `$CODEX_HOME/skills` altındaki Codex CLI skill dizinleri.
- Aracı başına sahiplik istediğinizde mevcut OpenClaw aracı çalışma alanına kopyalanan `$HOME/.agents/skills` altındaki kişisel AgentSkills.

### Manuel incelemeli Codex durumu

Codex yerel Plugin, `config.toml` ve yerel `hooks/hooks.json` otomatik olarak etkinleştirilmez. Plugin; MCP sunucuları, uygulamalar, hooks veya başka çalıştırılabilir davranışlar sunabilir, bu nedenle sağlayıcı bunları OpenClaw içine yüklemek yerine inceleme için raporlar. Yapılandırma ve hook dosyaları manuel inceleme için migration report içine kopyalanır.

## Hermes sağlayıcısı

Paketle birlikte gelen Hermes sağlayıcısı, varsayılan olarak `~/.hermes` konumundaki durumu algılar. Hermes başka bir yerdeyse `--from <path>` kullanın.

### Hermes neleri içe aktarır

- `config.yaml` dosyasından varsayılan model yapılandırması.
- `providers` ve `custom_providers` içinden yapılandırılmış model sağlayıcıları ve özel OpenAI uyumlu uç noktalar.
- `mcp_servers` veya `mcp.servers` içinden MCP sunucu tanımları.
- `SOUL.md` ve `AGENTS.md` dosyalarını OpenClaw aracı çalışma alanına.
- `memories/MEMORY.md` ve `memories/USER.md` dosyalarını çalışma alanı bellek dosyalarına ekler.
- OpenClaw dosya belleği için bellek yapılandırması varsayılanları, ayrıca Honcho gibi harici bellek sağlayıcıları için arşiv veya manuel inceleme öğeleri.
- `skills/<name>/` altında `SKILL.md` dosyası içeren Skills.
- `skills.config` içinden skill başına yapılandırma değerleri.
- `.env` içinden desteklenen API anahtarları, yalnızca `--include-secrets` ile.

### Desteklenen `.env` anahtarları

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Yalnızca arşivlenen durum

OpenClaw tarafından güvenli biçimde yorumlanamayan Hermes durumu, manuel inceleme için migration report içine kopyalanır, ancak canlı OpenClaw yapılandırmasına veya kimlik bilgilerine yüklenmez. Bu, OpenClaw'ın bunu otomatik olarak çalıştırabileceğini veya güvenebileceğini varsaymadan opak ya da güvenli olmayan durumu korur:

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

Geçiş kaynakları Plugin'dir. Bir Plugin, sağlayıcı kimliklerini `openclaw.plugin.json` içinde bildirir:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Çalışma zamanında Plugin `api.registerMigrationProvider(...)` çağırır. Sağlayıcı `detect`, `plan` ve `apply` uygular. Core; CLI orkestrasyonunu, yedekleme politikasını, istemleri, JSON çıktısını ve çakışma ön denetimini sahiplenir. Core, incelenmiş planı `apply(ctx, plan)` içine geçirir ve sağlayıcılar yalnızca bu bağımsız değişken uyumluluk için yoksa planı yeniden oluşturabilir.

Sağlayıcı Plugin; öğe oluşturma ve özet sayıları için `openclaw/plugin-sdk/migration`, ayrıca çakışma farkındalıklı dosya kopyaları, yalnızca arşiv rapor kopyaları, önbelleğe alınmış config-runtime sarmalayıcıları ve migration report için `openclaw/plugin-sdk/migration-runtime` kullanabilir.

## Onboarding entegrasyonu

Onboarding, bir sağlayıcı bilinen bir kaynak algıladığında geçiş önerebilir. Hem `openclaw onboard --flow import` hem de `openclaw setup --wizard --import-from hermes` aynı Plugin migration provider öğesini kullanır ve apply öncesinde yine de bir önizleme gösterir.

<Note>
Onboarding içe aktarmaları temiz bir OpenClaw kurulumu gerektirir. Zaten yerel durumunuz varsa önce yapılandırmayı, kimlik bilgilerini, oturumları ve çalışma alanını sıfırlayın. Backup-plus-overwrite veya merge içe aktarmaları mevcut kurulumlar için özellik bayrağına bağlıdır.
</Note>

## İlgili

- [Hermes'ten geçiş](/tr/install/migrating-hermes): kullanıcıya yönelik adım adım kılavuz.
- [Claude'dan geçiş](/tr/install/migrating-claude): kullanıcıya yönelik adım adım kılavuz.
- [Geçiş](/tr/install/migrating): OpenClaw'ı yeni bir makineye taşıma.
- [Doctor](/tr/gateway/doctor): geçiş uygulandıktan sonra sağlık denetimi.
- [Plugins](/tr/tools/plugin): Plugin kurulumu ve kaydı.

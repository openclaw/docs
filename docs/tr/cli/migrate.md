---
read_when:
    - Hermes veya başka bir ajan sisteminden OpenClaw'a geçiş yapmak istiyorsunuz
    - Plugin'e ait bir migrasyon sağlayıcısı ekliyorsunuz
summary: '`openclaw migrate` için CLI referansı (başka bir ajan sisteminden durumu içe aktarın)'
title: Geçiş yap
x-i18n:
    generated_at: "2026-04-30T20:05:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffcd9e874bdaa0a5195e712d4fccd7b3d53034cb362c7f7462e9c7df72477b1a
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Başka bir aracı sisteminden durumu Plugin'e ait bir geçiş sağlayıcısı aracılığıyla içe aktarın. Paketle birlikte gelen sağlayıcılar Codex CLI durumunu, [Claude](/tr/install/migrating-claude) ve [Hermes](/tr/install/migrating-hermes) için geçişi kapsar; üçüncü taraf plugin'ler ek sağlayıcılar kaydedebilir.

<Tip>
Kullanıcıya dönük adım adım kılavuzlar için [Claude'dan geçiş](/tr/install/migrating-claude) ve [Hermes'ten geçiş](/tr/install/migrating-hermes) bölümlerine bakın. [Geçiş merkezi](/tr/install/migrating) tüm yolları listeler.
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
  Kayıtlı bir geçiş sağlayıcısının adı, örneğin `hermes`. Yüklü sağlayıcıları görmek için `openclaw migrate list` çalıştırın.
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
  Onay istemini atlayın. Etkileşimsiz modda gereklidir.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Skills adı veya öğe kimliğiyle bir skill kopyalama öğesi seçin. Birden fazla skill taşımak için bayrağı tekrarlayın. Atlandığında, etkileşimli Codex geçişleri bir onay kutusu seçici gösterir ve etkileşimsiz geçişler planlanan tüm skill'leri korur.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Uygulama öncesi yedeklemeyi atlayın. Yerel OpenClaw durumu varsa `--force` gerektirir.
</ParamField>
<ParamField path="--force" type="boolean">
  Apply işlemi aksi halde yedeklemeyi atlamayı reddedecekken `--no-backup` ile birlikte gereklidir.
</ParamField>
<ParamField path="--json" type="boolean">
  Planı veya apply sonucunu JSON olarak yazdırın. `--json` ve `--yes` olmadan, apply planı yazdırır ve durumu değiştirmez.
</ParamField>

## Güvenlik modeli

`openclaw migrate` önce önizleme yapar.

<AccordionGroup>
  <Accordion title="Apply öncesi önizleme">
    Sağlayıcı, herhangi bir şey değişmeden önce çakışmalar, atlanan öğeler ve hassas öğeler dahil olmak üzere öğelendirilmiş bir plan döndürür. JSON planları, apply çıktısı ve geçiş raporları API anahtarları, token'lar, yetkilendirme üst bilgileri, çerezler ve parolalar gibi gizli bilgiye benzeyen iç içe anahtarları maskeler.

    `openclaw migrate apply <provider>`, `--yes` ayarlanmadığı sürece durumu değiştirmeden önce planı önizler ve istem gösterir. Etkileşimsiz modda apply `--yes` gerektirir.

  </Accordion>
  <Accordion title="Yedeklemeler">
    Apply, geçişi uygulamadan önce bir OpenClaw yedeği oluşturur ve doğrular. Henüz yerel OpenClaw durumu yoksa yedekleme adımı atlanır ve geçiş devam edebilir. Durum varken yedeklemeyi atlamak için hem `--no-backup` hem de `--force` iletin.
  </Accordion>
  <Accordion title="Çakışmalar">
    Planda çakışmalar olduğunda apply devam etmeyi reddeder. Planı gözden geçirin, ardından mevcut hedefleri değiştirmek kasıtlıysa `--overwrite` ile yeniden çalıştırın. Sağlayıcılar, geçiş raporu dizininde üzerine yazılan dosyalar için yine de öğe düzeyinde yedekler yazabilir.
  </Accordion>
  <Accordion title="Gizli bilgiler">
    Gizli bilgiler varsayılan olarak asla içe aktarılmaz. Desteklenen kimlik bilgilerini içe aktarmak için `--include-secrets` kullanın.
  </Accordion>
</AccordionGroup>

## Claude sağlayıcısı

Paketle birlikte gelen Claude sağlayıcısı varsayılan olarak Claude Code durumunu `~/.claude` konumunda algılar. Belirli bir Claude Code ana dizinini veya proje kökünü içe aktarmak için `--from <path>` kullanın.

<Tip>
Kullanıcıya dönük adım adım kılavuz için [Claude'dan geçiş](/tr/install/migrating-claude) bölümüne bakın.
</Tip>

### Claude neleri içe aktarır

- Proje `CLAUDE.md` ve `.claude/CLAUDE.md` dosyalarını OpenClaw aracı çalışma alanına.
- Kullanıcı `~/.claude/CLAUDE.md` içeriğini çalışma alanı `USER.md` dosyasına ekler.
- MCP sunucu tanımlarını proje `.mcp.json`, Claude Code `~/.claude.json` ve Claude Desktop `claude_desktop_config.json` dosyalarından.
- `SKILL.md` içeren Claude skill dizinleri.
- Yalnızca manuel çağırmayla OpenClaw skill'lerine dönüştürülen Claude komut Markdown dosyaları.

### Arşiv ve manuel inceleme durumu

Claude hook'ları, izinleri, ortam varsayılanları, yerel bellek, yol kapsamlı kurallar, alt aracılar, önbellekler, planlar ve proje geçmişi geçiş raporunda korunur veya manuel inceleme öğeleri olarak bildirilir. OpenClaw hook'ları çalıştırmaz, geniş izin listelerini kopyalamaz veya OAuth/Desktop kimlik bilgisi durumunu otomatik olarak içe aktarmaz.

## Codex sağlayıcısı

Paketle birlikte gelen Codex sağlayıcısı varsayılan olarak Codex CLI durumunu `~/.codex` konumunda ya da bu ortam değişkeni ayarlanmışsa
`CODEX_HOME` konumunda algılar. Belirli bir Codex ana dizinini envantere almak için `--from <path>` kullanın.

OpenClaw Codex harness'a geçerken ve yararlı kişisel Codex CLI varlıklarını
bilinçli biçimde yükseltmek istediğinizde bu sağlayıcıyı kullanın. Yerel Codex app-server
başlatmaları aracı başına `CODEX_HOME` ve `HOME` dizinleri kullanır, bu nedenle varsayılan olarak
kişisel Codex CLI durumunuzu okumaz.

Etkileşimli bir terminalde `openclaw migrate codex` çalıştırmak tam
planı önizler, ardından son apply onayından önce skill kopyalama öğeleri için bir onay kutusu
seçici açar. Tüm skill'ler seçili başlar; bu aracıya kopyalanmasını istemediğiniz
herhangi bir skill'in seçimini kaldırın. Betikli veya kesin çalıştırmalar için her
skill başına bir kez `--skill <name>` iletin, örneğin:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

### Codex neleri içe aktarır

- Codex'in `.system` önbelleği hariç, `$CODEX_HOME/skills` altındaki Codex CLI skill dizinleri.
- Aracı başına sahiplik istediğinizde mevcut OpenClaw aracı çalışma alanına kopyalanan `$HOME/.agents/skills` altındaki kişisel AgentSkills.

### Manuel inceleme gerektiren Codex durumu

Codex yerel plugin'leri, `config.toml` ve yerel `hooks/hooks.json` otomatik olarak
etkinleştirilmez. Plugin'ler MCP sunucuları, uygulamalar, hook'lar veya başka
çalıştırılabilir davranışlar sunabilir; bu nedenle sağlayıcı bunları OpenClaw'a yüklemek yerine
inceleme için bildirir. Yapılandırma ve hook dosyaları manuel inceleme için geçiş raporuna
kopyalanır.

## Hermes sağlayıcısı

Paketle birlikte gelen Hermes sağlayıcısı varsayılan olarak durumu `~/.hermes` konumunda algılar. Hermes başka bir yerdeyse `--from <path>` kullanın.

### Hermes neleri içe aktarır

- `config.yaml` içinden varsayılan model yapılandırması.
- `providers` ve `custom_providers` içinden yapılandırılmış model sağlayıcıları ve özel OpenAI uyumlu uç noktalar.
- `mcp_servers` veya `mcp.servers` içinden MCP sunucu tanımları.
- `SOUL.md` ve `AGENTS.md` dosyalarını OpenClaw aracı çalışma alanına.
- `memories/MEMORY.md` ve `memories/USER.md` dosyalarını çalışma alanı bellek dosyalarına ekler.
- OpenClaw dosya belleği için bellek yapılandırma varsayılanları, ayrıca Honcho gibi harici bellek sağlayıcıları için arşiv veya manuel inceleme öğeleri.
- `skills/<name>/` altında `SKILL.md` dosyası içeren Skills.
- `skills.config` içinden skill başına yapılandırma değerleri.
- `.env` içinden desteklenen API anahtarları, yalnızca `--include-secrets` ile.

### Desteklenen `.env` anahtarları

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Yalnızca arşivlenen durum

OpenClaw'ın güvenle yorumlayamadığı Hermes durumu manuel inceleme için geçiş raporuna kopyalanır, ancak canlı OpenClaw yapılandırmasına veya kimlik bilgilerine yüklenmez. Bu, OpenClaw'ın bunu otomatik olarak çalıştırabileceğini veya güvenebileceğini varsaymadan opak ya da güvenli olmayan durumu korur:

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

Geçiş kaynakları plugin'lerdir. Bir plugin, sağlayıcı kimliklerini `openclaw.plugin.json` içinde bildirir:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Çalışma zamanında plugin `api.registerMigrationProvider(...)` çağırır. Sağlayıcı `detect`, `plan` ve `apply` uygular. Çekirdek CLI orkestrasyonunu, yedekleme politikasını, istemleri, JSON çıktısını ve çakışma ön denetimini sahiplenir. Çekirdek gözden geçirilmiş planı `apply(ctx, plan)` içine iletir ve sağlayıcılar planı yalnızca uyumluluk için bu bağımsız değişken yoksa yeniden oluşturabilir.

Sağlayıcı plugin'leri öğe oluşturma ve özet sayımları için `openclaw/plugin-sdk/migration`, ayrıca çakışma farkındalıklı dosya kopyaları, yalnızca arşiv raporu kopyaları, önbelleğe alınmış config-runtime sarmalayıcıları ve geçiş raporları için `openclaw/plugin-sdk/migration-runtime` kullanabilir.

## Onboarding entegrasyonu

Onboarding, bir sağlayıcı bilinen bir kaynak algıladığında geçiş sunabilir. Hem `openclaw onboard --flow import` hem de `openclaw setup --wizard --import-from hermes` aynı plugin geçiş sağlayıcısını kullanır ve uygulamadan önce yine de bir önizleme gösterir.

<Note>
Onboarding içe aktarımları yeni bir OpenClaw kurulumu gerektirir. Zaten yerel durumunuz varsa önce yapılandırmayı, kimlik bilgilerini, oturumları ve çalışma alanını sıfırlayın. Yedekleme-artı-üzerine yazma veya birleştirme içe aktarımları mevcut kurulumlar için özellik kapısına tabidir.
</Note>

## İlgili

- [Hermes'ten geçiş](/tr/install/migrating-hermes): kullanıcıya dönük adım adım kılavuz.
- [Claude'dan geçiş](/tr/install/migrating-claude): kullanıcıya dönük adım adım kılavuz.
- [Geçiş](/tr/install/migrating): OpenClaw'ı yeni bir makineye taşıyın.
- [Doctor](/tr/gateway/doctor): geçiş uygulandıktan sonra sağlık denetimi.
- [Plugins](/tr/tools/plugin): plugin kurulumu ve kaydı.

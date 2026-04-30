---
read_when:
    - Hermes veya başka bir ajan sisteminden OpenClaw'a geçmek istiyorsunuz
    - Plugin'e ait bir geçiş sağlayıcısı ekliyorsunuz
summary: '`openclaw migrate` için CLI referansı (başka bir ajan sisteminden durumu içe aktar)'
title: Geçiş Yap
x-i18n:
    generated_at: "2026-04-30T09:13:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3db14c16b8f9dcbf86a4f12558cf4e8555aa9a255637034fb804148996a225e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Bir Plugin’e ait taşıma sağlayıcısı üzerinden başka bir aracı sisteminden durum içe aktarın. Birlikte gelen sağlayıcılar [Claude](/tr/install/migrating-claude) ve [Hermes](/tr/install/migrating-hermes) desteği sunar; üçüncü taraf Plugin’ler ek sağlayıcılar kaydedebilir.

<Tip>
Kullanıcıya yönelik adım adım anlatımlar için [Claude’dan Taşıma](/tr/install/migrating-claude) ve [Hermes’ten Taşıma](/tr/install/migrating-hermes) bölümlerine bakın. [taşıma merkezi](/tr/install/migrating) tüm yolları listeler.
</Tip>

## Komutlar

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  Kayıtlı bir taşıma sağlayıcısının adı, örneğin `hermes`. Yüklü sağlayıcıları görmek için `openclaw migrate list` çalıştırın.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Planı oluştur ve durumu değiştirmeden çık.
</ParamField>
<ParamField path="--from <path>" type="string">
  Kaynak durum dizinini geçersiz kıl. Hermes varsayılan olarak `~/.hermes` kullanır.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Desteklenen kimlik bilgilerini içe aktar. Varsayılan olarak kapalıdır.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Plan çakışma bildirdiğinde uygulamanın mevcut hedefleri değiştirmesine izin ver.
</ParamField>
<ParamField path="--yes" type="boolean">
  Onay istemini atla. Etkileşimsiz modda zorunludur.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Uygulama öncesi yedeklemeyi atla. Yerel OpenClaw durumu varsa `--force` gerektirir.
</ParamField>
<ParamField path="--force" type="boolean">
  Uygulama aksi halde yedeklemeyi atlamayı reddedeceğinde `--no-backup` ile birlikte zorunludur.
</ParamField>
<ParamField path="--json" type="boolean">
  Planı veya uygulama sonucunu JSON olarak yazdır. `--json` ile ve `--yes` olmadan, apply planı yazdırır ve durumu değiştirmez.
</ParamField>

## Güvenlik modeli

`openclaw migrate` önce önizleme yapar.

<AccordionGroup>
  <Accordion title="Uygulamadan önce önizleme">
    Sağlayıcı, herhangi bir şey değişmeden önce çakışmalar, atlanan öğeler ve hassas öğeler dahil olmak üzere maddelendirilmiş bir plan döndürür. JSON planları, uygulama çıktısı ve taşıma raporları API anahtarları, token’lar, yetkilendirme üstbilgileri, çerezler ve parolalar gibi gizli bilgiye benzeyen iç içe anahtarları maskeler.

    `openclaw migrate apply <provider>`, `--yes` ayarlanmadıkça durumu değiştirmeden önce planı önizler ve onay ister. Etkileşimsiz modda apply için `--yes` gerekir.

  </Accordion>
  <Accordion title="Yedekler">
    Apply, taşımayı uygulamadan önce bir OpenClaw yedeği oluşturur ve doğrular. Henüz yerel OpenClaw durumu yoksa yedekleme adımı atlanır ve taşıma devam edebilir. Durum varken yedeklemeyi atlamak için hem `--no-backup` hem de `--force` geçirin.
  </Accordion>
  <Accordion title="Çakışmalar">
    Planda çakışmalar olduğunda apply devam etmeyi reddeder. Planı gözden geçirin, ardından mevcut hedefleri değiştirmek kasıtlıysa `--overwrite` ile yeniden çalıştırın. Sağlayıcılar, üzerine yazılan dosyalar için taşıma raporu dizininde hâlâ öğe düzeyinde yedekler yazabilir.
  </Accordion>
  <Accordion title="Gizli bilgiler">
    Gizli bilgiler varsayılan olarak asla içe aktarılmaz. Desteklenen kimlik bilgilerini içe aktarmak için `--include-secrets` kullanın.
  </Accordion>
</AccordionGroup>

## Claude sağlayıcısı

Birlikte gelen Claude sağlayıcısı, varsayılan olarak Claude Code durumunu `~/.claude` konumunda algılar. Belirli bir Claude Code ana dizinini veya proje kökünü içe aktarmak için `--from <path>` kullanın.

<Tip>
Kullanıcıya yönelik adım adım anlatım için [Claude’dan Taşıma](/tr/install/migrating-claude) bölümüne bakın.
</Tip>

### Claude neleri içe aktarır

- Proje `CLAUDE.md` ve `.claude/CLAUDE.md` dosyalarını OpenClaw aracı çalışma alanına.
- Kullanıcı `~/.claude/CLAUDE.md` içeriğini çalışma alanı `USER.md` dosyasına ekler.
- Proje `.mcp.json`, Claude Code `~/.claude.json` ve Claude Desktop `claude_desktop_config.json` içindeki MCP sunucu tanımları.
- `SKILL.md` içeren Claude skill dizinleri.
- OpenClaw skills’e dönüştürülen, yalnızca manuel çağrılan Claude komut Markdown dosyaları.

### Arşiv ve manuel inceleme durumu

Claude hook’ları, izinler, ortam varsayılanları, yerel bellek, yol kapsamlı kurallar, alt aracılar, önbellekler, planlar ve proje geçmişi taşıma raporunda korunur veya manuel inceleme öğeleri olarak bildirilir. OpenClaw hook’ları çalıştırmaz, geniş izin listelerini kopyalamaz veya OAuth/Desktop kimlik bilgisi durumunu otomatik olarak içe aktarmaz.

## Hermes sağlayıcısı

Birlikte gelen Hermes sağlayıcısı, varsayılan olarak durumu `~/.hermes` konumunda algılar. Hermes başka bir yerde bulunuyorsa `--from <path>` kullanın.

### Hermes neleri içe aktarır

- `config.yaml` içindeki varsayılan model yapılandırması.
- `providers` ve `custom_providers` içindeki yapılandırılmış model sağlayıcıları ve özel OpenAI uyumlu uç noktalar.
- `mcp_servers` veya `mcp.servers` içindeki MCP sunucu tanımları.
- `SOUL.md` ve `AGENTS.md` dosyalarını OpenClaw aracı çalışma alanına.
- `memories/MEMORY.md` ve `memories/USER.md` içeriklerini çalışma alanı bellek dosyalarına ekler.
- OpenClaw dosya belleği için bellek yapılandırması varsayılanları, ayrıca Honcho gibi harici bellek sağlayıcıları için arşiv veya manuel inceleme öğeleri.
- `skills/<name>/` altında `SKILL.md` dosyası içeren Skills.
- `skills.config` içindeki skill başına yapılandırma değerleri.
- `.env` içindeki desteklenen API anahtarları, yalnızca `--include-secrets` ile.

### Desteklenen `.env` anahtarları

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Yalnızca arşivlenen durum

OpenClaw’ın güvenli biçimde yorumlayamadığı Hermes durumu manuel inceleme için taşıma raporuna kopyalanır, ancak canlı OpenClaw yapılandırmasına veya kimlik bilgilerine yüklenmez. Bu, OpenClaw’ın onu otomatik olarak yürütebileceği veya güvenebileceği izlenimini vermeden opak ya da güvenli olmayan durumu korur:

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

Taşıma kaynakları Plugin’lerdir. Bir Plugin, sağlayıcı kimliklerini `openclaw.plugin.json` içinde bildirir:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Çalışma zamanında Plugin `api.registerMigrationProvider(...)` çağırır. Sağlayıcı `detect`, `plan` ve `apply` uygular. Core CLI düzenlemesini, yedekleme politikasını, istemleri, JSON çıktısını ve çakışma ön denetimini sahiplenir. Core, gözden geçirilmiş planı `apply(ctx, plan)` içine geçirir ve sağlayıcılar planı yalnızca uyumluluk için bu bağımsız değişken yoksa yeniden oluşturabilir.

Sağlayıcı Plugin’ler öğe oluşturma ve özet sayımları için `openclaw/plugin-sdk/migration`, ayrıca çakışma farkındalıklı dosya kopyaları, yalnızca arşiv rapor kopyaları, önbelleğe alınmış yapılandırma çalışma zamanı sarmalayıcıları ve taşıma raporları için `openclaw/plugin-sdk/migration-runtime` kullanabilir.

## Onboarding entegrasyonu

Onboarding, bir sağlayıcı bilinen bir kaynak algıladığında taşıma sunabilir. Hem `openclaw onboard --flow import` hem de `openclaw setup --wizard --import-from hermes` aynı Plugin taşıma sağlayıcısını kullanır ve uygulamadan önce yine bir önizleme gösterir.

<Note>
Onboarding içe aktarmaları yeni bir OpenClaw kurulumu gerektirir. Zaten yerel durumunuz varsa önce yapılandırmayı, kimlik bilgilerini, oturumları ve çalışma alanını sıfırlayın. Mevcut kurulumlar için yedekleme artı üzerine yazma veya birleştirme içe aktarmaları özellik bayrağına bağlıdır.
</Note>

## İlgili

- [Hermes’ten Taşıma](/tr/install/migrating-hermes): kullanıcıya yönelik adım adım anlatım.
- [Claude’dan Taşıma](/tr/install/migrating-claude): kullanıcıya yönelik adım adım anlatım.
- [Taşıma](/tr/install/migrating): OpenClaw’ı yeni bir makineye taşıyın.
- [Doctor](/tr/gateway/doctor): bir taşımayı uyguladıktan sonra sağlık denetimi.
- [Plugins](/tr/tools/plugin): Plugin kurulumu ve kaydı.

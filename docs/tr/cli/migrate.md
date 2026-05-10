---
read_when:
    - Hermes'ten veya başka bir ajan sisteminden OpenClaw'a geçmek istiyorsunuz
    - Plugin’e ait bir geçiş sağlayıcısı ekliyorsunuz
summary: '`openclaw migrate` için CLI başvurusu (durumu başka bir ajan sisteminden içe aktar)'
title: Geçiş yapın
x-i18n:
    generated_at: "2026-05-10T19:29:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb32f993d2412a97a1f91bf3f2b3ca1a653d1db3db75aa90d3b834bdc6acbb95
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Plugin sahipliğindeki bir geçiş sağlayıcısı üzerinden başka bir ajan sisteminden durumu içe aktarın. Birlikte gelen sağlayıcılar Codex CLI durumunu, [Claude](/tr/install/migrating-claude) ve [Hermes](/tr/install/migrating-hermes) kapsamaktadır; üçüncü taraf Plugin'ler ek sağlayıcılar kaydedebilir.

<Tip>
Kullanıcıya yönelik adım adım kılavuzlar için [Claude'dan Geçiş](/tr/install/migrating-claude) ve [Hermes'ten Geçiş](/tr/install/migrating-hermes) bölümlerine bakın. [Geçiş merkezi](/tr/install/migrating) tüm yolları listeler.
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
  Kayıtlı bir geçiş sağlayıcısının adı, örneğin `hermes`. Kurulu sağlayıcıları görmek için `openclaw migrate list` komutunu çalıştırın.
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
  Plan çakışma bildirdiğinde uygulamanın mevcut hedefleri değiştirmesine izin verin.
</ParamField>
<ParamField path="--yes" type="boolean">
  Onay istemini atlayın. Etkileşimsiz modda zorunludur.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Beceri adına veya öğe kimliğine göre tek bir beceri kopyalama öğesi seçin. Birden fazla beceriyi taşımak için bayrağı tekrarlayın. Atlandığında, etkileşimli Codex geçişleri bir onay kutusu seçici gösterir ve etkileşimsiz geçişler planlanan tüm becerileri korur.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Plugin adına veya öğe kimliğine göre tek bir Codex Plugin kurulum öğesi seçin. Birden fazla Codex Plugin'ini taşımak için bayrağı tekrarlayın. Atlandığında, etkileşimli Codex geçişleri yerel bir Codex Plugin onay kutusu seçici gösterir ve etkileşimsiz geçişler planlanan tüm Plugin'leri korur. Bu yalnızca Codex uygulama sunucusu envanteri tarafından keşfedilen, kaynaktan kurulu `openai-curated` Codex Plugin'leri için geçerlidir.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Uygulama öncesi yedeklemeyi atlayın. Yerel OpenClaw durumu varsa `--force` gerektirir.
</ParamField>
<ParamField path="--force" type="boolean">
  Uygulama aksi halde yedeklemeyi atlamayı reddedecekse `--no-backup` ile birlikte gereklidir.
</ParamField>
<ParamField path="--json" type="boolean">
  Planı veya uygulama sonucunu JSON olarak yazdırın. `--json` ve `--yes` olmadan, uygulama planı yazdırır ve durumu değiştirmez.
</ParamField>

## Güvenlik modeli

`openclaw migrate` önce önizleme yapar.

<AccordionGroup>
  <Accordion title="Uygulamadan önce önizleme">
    Sağlayıcı, herhangi bir şey değişmeden önce çakışmalar, atlanan öğeler ve hassas öğeler dahil olmak üzere öğelendirilmiş bir plan döndürür. JSON planları, uygulama çıktısı ve geçiş raporları API anahtarları, token'lar, yetkilendirme üstbilgileri, çerezler ve parolalar gibi gizli olabilecek iç içe anahtarları redakte eder.

    `openclaw migrate apply <provider>`, planı önizler ve `--yes` ayarlanmadıkça durumu değiştirmeden önce onay ister. Etkileşimsiz modda uygulama `--yes` gerektirir.

  </Accordion>
  <Accordion title="Yedekler">
    Uygulama, geçişi uygulamadan önce bir OpenClaw yedeği oluşturur ve doğrular. Henüz yerel OpenClaw durumu yoksa yedekleme adımı atlanır ve geçiş devam edebilir. Durum varken yedeği atlamak için hem `--no-backup` hem de `--force` iletin.
  </Accordion>
  <Accordion title="Çakışmalar">
    Plan çakışmalar içerdiğinde uygulama devam etmeyi reddeder. Planı gözden geçirin, ardından mevcut hedefleri değiştirmek bilinçli bir tercihse `--overwrite` ile yeniden çalıştırın. Sağlayıcılar, geçiş raporu dizinindeki üzerine yazılan dosyalar için yine de öğe düzeyinde yedekler yazabilir.
  </Accordion>
  <Accordion title="Gizli bilgiler">
    Gizli bilgiler varsayılan olarak asla içe aktarılmaz. Desteklenen kimlik bilgilerini içe aktarmak için `--include-secrets` kullanın.
  </Accordion>
</AccordionGroup>

## Claude sağlayıcısı

Birlikte gelen Claude sağlayıcısı, varsayılan olarak `~/.claude` konumundaki Claude Code durumunu algılar. Belirli bir Claude Code ana dizinini veya proje kökünü içe aktarmak için `--from <path>` kullanın.

<Tip>
Kullanıcıya yönelik bir adım adım kılavuz için [Claude'dan Geçiş](/tr/install/migrating-claude) bölümüne bakın.
</Tip>

### Claude neleri içe aktarır

- Proje `CLAUDE.md` ve `.claude/CLAUDE.md` dosyalarını OpenClaw ajan çalışma alanına.
- Kullanıcı `~/.claude/CLAUDE.md` içeriği çalışma alanı `USER.md` dosyasına eklenir.
- Proje `.mcp.json`, Claude Code `~/.claude.json` ve Claude Desktop `claude_desktop_config.json` dosyalarından MCP sunucu tanımları.
- `SKILL.md` içeren Claude beceri dizinleri.
- Yalnızca manuel çağırmayla OpenClaw becerilerine dönüştürülen Claude komut Markdown dosyaları.

### Arşiv ve manuel inceleme durumu

Claude kancaları, izinler, ortam varsayılanları, yerel bellek, yol kapsamlı kurallar, alt ajanlar, önbellekler, planlar ve proje geçmişi geçiş raporunda korunur veya manuel inceleme öğeleri olarak bildirilir. OpenClaw kancaları yürütmez, geniş izin listelerini kopyalamaz veya OAuth/Desktop kimlik bilgisi durumunu otomatik olarak içe aktarmaz.

## Codex sağlayıcısı

Birlikte gelen Codex sağlayıcısı, varsayılan olarak `~/.codex` konumundaki Codex CLI durumunu veya bu ortam değişkeni ayarlandığında `CODEX_HOME` konumunu algılar. Belirli bir Codex ana dizinini envanterlemek için `--from <path>` kullanın.

OpenClaw Codex harness'e geçerken ve kullanışlı kişisel Codex CLI varlıklarını bilinçli şekilde yükseltmek istediğinizde bu sağlayıcıyı kullanın. Yerel Codex uygulama sunucusu başlatmaları ajan başına `CODEX_HOME` ve `HOME` dizinlerini kullanır, bu nedenle varsayılan olarak kişisel Codex CLI durumunuzu okumazlar.

Etkileşimli bir terminalde `openclaw migrate codex` çalıştırmak tam planı önizler, ardından nihai uygulama onayından önce onay kutusu seçicilerini açar. Önce beceri kopyalama öğeleri sorulur. Toplu seçim için `Toggle all on` veya `Toggle all off` kullanın; planlanan beceriler işaretli başlar, çakışan beceriler işaretsiz başlar ve `Skip for now`, bu çalıştırmada beceri kopyalarını atlarken Plugin seçimine devam eder. Kaynaktan kurulu derlenmiş Codex Plugin'leri taşınabilir olduğunda ve `--plugin` sağlanmadığında, geçiş daha sonra Plugin adına göre yerel Codex Plugin etkinleştirmesi ister. Hedef OpenClaw Codex Plugin yapılandırmasında o Plugin zaten yoksa Plugin öğeleri işaretli başlar. Mevcut hedef Plugin'ler işaretsiz başlar ve `conflict: plugin exists` gibi bir çakışma ipucu gösterir; o çalıştırmada hiçbir yerel Codex Plugin'ini taşımamak için `Toggle all off` seçin veya uygulamadan önce durmak için `Skip for now` seçin. Betikli veya kesin çalıştırmalar için her beceri başına bir kez `--skill <name>` iletin, örneğin:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Yerel Codex Plugin geçişini etkileşimsiz olarak bir veya daha fazla kaynaktan kurulu derlenmiş Plugin ile sınırlamak için `--plugin <name>` kullanın:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex neleri içe aktarır

- Codex'in `.system` önbelleği hariç, `$CODEX_HOME/skills` altındaki Codex CLI beceri dizinleri.
- Ajan başına sahiplik istediğinizde geçerli OpenClaw ajan çalışma alanına kopyalanan `$HOME/.agents/skills` altındaki kişisel AgentSkills.
- Codex uygulama sunucusu `plugin/list` üzerinden keşfedilen, kaynaktan kurulu `openai-curated` Codex Plugin'leri. Uygulama, hedef uygulama sunucusu o Plugin'i zaten kurulu ve etkin bildiriyor olsa bile, seçilen her Plugin için uygulama sunucusu `plugin/install` çağırır. Taşınan Codex Plugin'leri yalnızca yerel Codex harness'i seçen oturumlarda kullanılabilir; Pi'ye, normal OpenAI sağlayıcı çalıştırmalarına, ACP konuşma bağlamalarına veya diğer harness'lere sunulmaz.

### Manuel inceleme Codex durumu

Codex `config.toml`, yerel `hooks/hooks.json`, derlenmemiş pazar yerleri ve kaynaktan kurulu derlenmiş Plugin olmayan önbelleğe alınmış Plugin paketleri otomatik olarak etkinleştirilmez. Bunlar manuel inceleme için geçiş raporuna kopyalanır veya raporda bildirilir.

Taşınan kaynaktan kurulu derlenmiş Plugin'ler için uygulama şunları yazar:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: false`
- seçilen her Plugin için `marketplaceName: "openai-curated"` ve `pluginName` içeren bir açık Plugin girdisi

Geçiş hiçbir zaman `plugins["*"]` yazmaz ve yerel pazar yeri önbellek yollarını asla saklamaz. Kimlik doğrulama gerektiren kurulumlar, etkilenen Plugin öğesinde `status: "skipped"`, `reason: "auth_required"` ve temizlenmiş uygulama tanımlayıcılarıyla bildirilir. Açık yapılandırma girdileri, yeniden yetkilendirip etkinleştirene kadar devre dışı yazılır. Diğer kurulum hataları öğe kapsamlı `error` sonuçlarıdır.

Planlama sırasında Codex uygulama sunucusu Plugin envanteri kullanılamıyorsa, geçiş tüm geçişi başarısız kılmak yerine önbelleğe alınmış paket danışma öğelerine geri döner.

## Hermes sağlayıcısı

Birlikte gelen Hermes sağlayıcısı, varsayılan olarak `~/.hermes` konumundaki durumu algılar. Hermes başka bir yerdeyse `--from <path>` kullanın.

### Hermes neleri içe aktarır

- `config.yaml` dosyasından varsayılan model yapılandırması.
- `providers` ve `custom_providers` içinden yapılandırılmış model sağlayıcıları ve özel OpenAI uyumlu uç noktalar.
- `mcp_servers` veya `mcp.servers` içinden MCP sunucu tanımları.
- `SOUL.md` ve `AGENTS.md` dosyalarını OpenClaw ajan çalışma alanına.
- `memories/MEMORY.md` ve `memories/USER.md` içerikleri çalışma alanı bellek dosyalarına eklenir.
- OpenClaw dosya belleği için bellek yapılandırması varsayılanları, ayrıca Honcho gibi harici bellek sağlayıcıları için arşiv veya manuel inceleme öğeleri.
- `skills/<name>/` altında `SKILL.md` dosyası içeren Skills.
- `skills.config` içinden beceri başına yapılandırma değerleri.
- `.env` dosyasından desteklenen API anahtarları, yalnızca `--include-secrets` ile.

### Desteklenen `.env` anahtarları

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Yalnızca arşiv durumu

OpenClaw'ın güvenle yorumlayamadığı Hermes durumu, manuel inceleme için geçiş raporuna kopyalanır, ancak canlı OpenClaw yapılandırmasına veya kimlik bilgilerine yüklenmez. Bu, OpenClaw'ın bunu otomatik olarak yürütebileceğini veya güvenebileceğini varsaymadan opak veya güvenli olmayan durumu korur:

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

Çalışma zamanında Plugin `api.registerMigrationProvider(...)` çağırır. Sağlayıcı `detect`, `plan` ve `apply` uygular. Çekirdek CLI orkestrasyonunu, yedekleme politikasını, istemleri, JSON çıktısını ve çakışma ön kontrolünü sahiplenir. Çekirdek, gözden geçirilmiş planı `apply(ctx, plan)` içine iletir ve sağlayıcılar yalnızca bu bağımsız değişken uyumluluk için yoksa planı yeniden oluşturabilir.

Sağlayıcı Plugin'ler öğe oluşturma ve özet sayıları için `openclaw/plugin-sdk/migration`, ayrıca çakışma farkındalıklı dosya kopyaları, yalnızca arşiv raporu kopyaları, önbelleğe alınmış yapılandırma çalışma zamanı sarmalayıcıları ve geçiş raporları için `openclaw/plugin-sdk/migration-runtime` kullanabilir.

## Onboarding entegrasyonu

Bir sağlayıcı bilinen bir kaynak algıladığında Onboarding geçiş sunabilir. Hem `openclaw onboard --flow import` hem de `openclaw setup --wizard --import-from hermes` aynı Plugin geçiş sağlayıcısını kullanır ve uygulamadan önce yine bir önizleme gösterir.

<Note>
Onboarding içe aktarmaları yeni bir OpenClaw kurulumu gerektirir. Zaten yerel durumunuz varsa önce yapılandırmayı, kimlik bilgilerini, oturumları ve çalışma alanını sıfırlayın. Yedekleyerek üzerine yazma veya birleştirme içe aktarmaları, mevcut kurulumlar için özellik bayrağına bağlıdır.
</Note>

## İlgili

- [Hermes'ten geçiş](/tr/install/migrating-hermes): kullanıcıya yönelik adım adım kılavuz.
- [Claude'dan geçiş](/tr/install/migrating-claude): kullanıcıya yönelik adım adım kılavuz.
- [Geçiş](/tr/install/migrating): OpenClaw'ı yeni bir makineye taşıyın.
- [Doctor](/tr/gateway/doctor): bir geçiş uyguladıktan sonra sağlık denetimi.
- [Pluginler](/tr/tools/plugin): plugin kurulumu ve kaydı.

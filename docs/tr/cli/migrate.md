---
read_when:
    - Hermes veya başka bir aracı sisteminden OpenClaw'a geçiş yapmak istiyorsunuz
    - Plugin tarafından sahiplenilen bir geçiş sağlayıcısı ekliyorsunuz
summary: '`openclaw migrate` için CLI başvurusu (başka bir ajan sisteminden durumu içe aktarın)'
title: Geçiş yap
x-i18n:
    generated_at: "2026-06-28T00:23:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90798fd24af0984e485753e251c87a5dd8fd0246e7c135a50e3532de93ba075e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Bir Plugin sahipli geçiş sağlayıcısı aracılığıyla başka bir ajan sisteminden durum içe aktarın. Paketle gelen sağlayıcılar Codex CLI durumunu, [Claude](/tr/install/migrating-claude) ve [Hermes](/tr/install/migrating-hermes) geçişlerini kapsar; üçüncü taraf Plugin'ler ek sağlayıcılar kaydedebilir.

<Tip>
Kullanıcıya yönelik adım adım kılavuzlar için [Claude'dan geçiş](/tr/install/migrating-claude) ve [Hermes'ten geçiş](/tr/install/migrating-hermes) sayfalarına bakın. [Geçiş merkezi](/tr/install/migrating) tüm yolları listeler.
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
  Kayıtlı bir geçiş sağlayıcısının adı, örneğin `hermes`. Yüklü sağlayıcıları görmek için `openclaw migrate list` çalıştırın.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Planı oluşturup durumu değiştirmeden çıkın.
</ParamField>
<ParamField path="--from <path>" type="string">
  Kaynak durum dizinini geçersiz kılın. Hermes varsayılan olarak `~/.hermes` kullanır.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Desteklenen kimlik bilgilerini sormadan içe aktarın. Etkileşimli uygulama, varsayılan olarak evet seçiliyken algılanan kimlik doğrulama bilgilerini içe aktarmadan önce sorar; etkileşimsiz `--yes`, bunları içe aktarmak için `--include-secrets` gerektirir.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  Etkileşimli istem dahil olmak üzere kimlik doğrulama bilgisi içe aktarımını atlayın.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Plan çakışma bildirdiğinde uygulamanın mevcut hedefleri değiştirmesine izin verin.
</ParamField>
<ParamField path="--yes" type="boolean">
  Onay istemini atlayın. Etkileşimsiz modda gereklidir.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Skill adına veya öğe kimliğine göre bir skill kopyalama öğesi seçin. Birden çok skill geçirmek için bayrağı tekrarlayın. Atlandığında, etkileşimli Codex geçişleri bir onay kutusu seçici gösterir ve etkileşimsiz geçişler planlanan tüm skill'leri korur.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Plugin adına veya öğe kimliğine göre bir Codex Plugin kurulum öğesi seçin. Birden çok Codex Plugin geçirmek için bayrağı tekrarlayın. Atlandığında, etkileşimli Codex geçişleri yerel bir Codex Plugin onay kutusu seçici gösterir ve etkileşimsiz geçişler planlanan tüm Plugin'leri korur. Bu yalnızca Codex app-server envanteri tarafından keşfedilen, kaynakta yüklü `openai-curated` Codex Plugin'leri için geçerlidir.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Yalnızca Codex. Yerel Plugin etkinleştirmeyi planlamadan önce taze bir kaynak Codex app-server `app/list` dolaşımını zorunlu kılın. Geçiş planlamasını hızlı tutmak için varsayılan olarak kapalıdır.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Uygulama öncesi yedeklemeyi atlayın. Yerel OpenClaw durumu varsa `--force` gerektirir.
</ParamField>
<ParamField path="--force" type="boolean">
  Uygulama aksi halde yedeklemeyi atlamayı reddedecekse `--no-backup` ile birlikte gereklidir.
</ParamField>
<ParamField path="--json" type="boolean">
  Planı veya uygulama sonucunu JSON olarak yazdırın. `--json` ile ve `--yes` olmadan, uygulama planı yazdırır ve durumu değiştirmez.
</ParamField>

## Güvenlik modeli

`openclaw migrate` önce önizleme yapar.

<AccordionGroup>
  <Accordion title="Uygulamadan önce önizleme">
    Sağlayıcı, herhangi bir şey değişmeden önce çakışmaları, atlanan öğeleri ve hassas öğeleri içeren öğelendirilmiş bir plan döndürür. JSON planları, uygulama çıktısı ve geçiş raporları API anahtarları, belirteçler, yetkilendirme üstbilgileri, çerezler ve parolalar gibi gizli bilgiye benzeyen iç içe anahtarları maskeler.

    `openclaw migrate apply <provider>`, `--yes` ayarlanmadığı sürece durumu değiştirmeden önce planı önizler ve onay ister. Etkileşimsiz modda uygulama `--yes` gerektirir.

  </Accordion>
  <Accordion title="Yedeklemeler">
    Uygulama, geçişi uygulamadan önce bir OpenClaw yedeği oluşturur ve doğrular. Henüz yerel OpenClaw durumu yoksa yedekleme adımı atlanır ve geçiş devam edebilir. Durum varken yedeklemeyi atlamak için hem `--no-backup` hem de `--force` iletin.
  </Accordion>
  <Accordion title="Çakışmalar">
    Plan çakışma içerdiğinde uygulama devam etmeyi reddeder. Planı gözden geçirin, ardından mevcut hedefleri değiştirmek kasıtlıysa `--overwrite` ile yeniden çalıştırın. Sağlayıcılar, üzerine yazılan dosyalar için geçiş raporu dizininde yine de öğe düzeyinde yedekler yazabilir.
  </Accordion>
  <Accordion title="Gizli bilgiler">
    Etkileşimli uygulama, varsayılan olarak evet seçiliyken algılanan kimlik doğrulama bilgilerini içe aktarıp aktarmamayı sorar. Bunları atlamak için `--no-auth-credentials` kullanın veya `--yes` ile gözetimsiz kimlik bilgisi içe aktarımı için `--include-secrets` kullanın.
  </Accordion>
</AccordionGroup>

## Claude sağlayıcısı

Paketle gelen Claude sağlayıcısı, Claude Code durumunu varsayılan olarak `~/.claude` konumunda algılar. Belirli bir Claude Code ana dizinini veya proje kökünü içe aktarmak için `--from <path>` kullanın.

<Tip>
Kullanıcıya yönelik adım adım kılavuz için [Claude'dan geçiş](/tr/install/migrating-claude) sayfasına bakın.
</Tip>

### Claude neleri içe aktarır

- Proje `CLAUDE.md` ve `.claude/CLAUDE.md` dosyalarını OpenClaw ajan çalışma alanına.
- Kullanıcı `~/.claude/CLAUDE.md` dosyasını çalışma alanı `USER.md` dosyasına ekler.
- Proje `.mcp.json`, Claude Code `~/.claude.json` ve Claude Desktop `claude_desktop_config.json` içindeki MCP sunucu tanımları.
- `SKILL.md` içeren Claude skill dizinleri.
- Yalnızca manuel çağırmayla OpenClaw skill'lerine dönüştürülen Claude komut Markdown dosyaları.

### Arşiv ve manuel inceleme durumu

Claude hook'ları, izinler, ortam varsayılanları, yerel bellek, yol kapsamlı kurallar, alt ajanlar, önbellekler, planlar ve proje geçmişi geçiş raporunda korunur veya manuel inceleme öğeleri olarak bildirilir. OpenClaw hook'ları çalıştırmaz, geniş izin listelerini kopyalamaz veya OAuth/Desktop kimlik bilgisi durumunu otomatik olarak içe aktarmaz.

## Codex sağlayıcısı

Paketle gelen Codex sağlayıcısı, Codex CLI durumunu varsayılan olarak `~/.codex` konumunda veya bu ortam değişkeni ayarlanmışsa `CODEX_HOME` konumunda algılar. Belirli bir Codex ana dizinini envantere almak için `--from <path>` kullanın.

OpenClaw Codex harness'a geçerken ve yararlı kişisel Codex CLI varlıklarını bilinçli olarak yükseltmek istediğinizde bu sağlayıcıyı kullanın. Yerel Codex app-server başlatmaları ajan başına bir `CODEX_HOME` kullanır, bu yüzden varsayılan olarak kişisel `~/.codex` dizininizi okumaz. Normal süreç `HOME` değeri yine de devralınır, bu nedenle Codex paylaşılan `$HOME/.agents/*` skills/Plugin pazar yeri girdilerini görebilir ve alt süreçler kullanıcı ana dizini yapılandırmasını ve belirteçlerini bulabilir.

Etkileşimli bir terminalde `openclaw migrate codex` çalıştırmak tüm planı önizler, ardından son uygulama onayından önce onay kutusu seçicileri açar. Skill kopyalama öğeleri önce sorulur. Toplu seçim için `Toggle all on` veya `Toggle all off` kullanın. Satırları açıp kapatmak için Space tuşuna basın veya vurgulanan satırı etkinleştirip devam etmek için Enter tuşuna basın. Planlanan skill'ler işaretli başlar, çakışan skill'ler işaretsiz başlar ve `Skip for now`, Plugin seçimine devam ederken bu çalıştırma için skill kopyalarını atlar. Kaynakta yüklü küratörlü Codex Plugin'leri geçirilebilir olduğunda ve `--plugin` sağlanmadığında, geçiş daha sonra Plugin adına göre yerel Codex Plugin etkinleştirmesi için sorar. Hedef OpenClaw Codex Plugin yapılandırmasında ilgili Plugin zaten yoksa Plugin öğeleri işaretli başlar. Mevcut hedef Plugin'ler işaretsiz başlar ve `conflict: plugin exists` gibi bir çakışma ipucu gösterir; o çalıştırmada hiçbir yerel Codex Plugin geçirmemek için `Toggle all off` seçin veya uygulamadan önce durmak için `Skip for now` seçin. Betikli veya kesin çalıştırmalar için, her skill başına bir kez `--skill <name>` iletin, örneğin:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Yerel Codex Plugin geçişini etkileşimsiz olarak kaynakta yüklü bir veya daha fazla küratörlü Plugin ile sınırlamak için `--plugin <name>` kullanın:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex neleri içe aktarır

- Codex'in `.system` önbelleği hariç, `$CODEX_HOME/skills` altındaki Codex CLI skill dizinleri.
- Ajan başına sahiplik istediğinizde geçerli OpenClaw ajan çalışma alanına kopyalanan `$HOME/.agents/skills` altındaki kişisel AgentSkills.
- Codex app-server `plugin/list` aracılığıyla keşfedilen, kaynakta yüklü `openai-curated` Codex Plugin'leri. Planlama, etkinleştirilmiş her yüklü Plugin için `plugin/read` okur. Uygulama destekli Plugin'ler, kaynak Codex app-server hesap yanıtının bir ChatGPT abonelik hesabı olmasını gerektirir; ChatGPT olmayan veya eksik hesap yanıtları `codex_subscription_required` ile atlanır. Varsayılan olarak geçiş, kaynak `app/list` çağırmaz; bu yüzden hesap kapısından geçen uygulama destekli Plugin'ler kaynak uygulama erişilebilirliği doğrulaması olmadan planlanır ve hesap arama taşıma hataları `codex_account_unavailable` ile atlanır. Geçişin taze bir kaynak `app/list` anlık görüntüsünü zorunlu kılmasını ve yerel etkinleştirmeyi planlamadan önce sahip olunan her uygulamanın mevcut, etkin ve erişilebilir olmasını gerektirmesini istediğinizde `--verify-plugin-apps` iletin. Bu modda hesap arama taşıma hataları kaynak uygulama envanteri doğrulamasına düşer. Kaynak uygulama envanteri anlık görüntüsü geçerli süreç için bellekte tutulur; geçiş çıktısına veya hedef yapılandırmaya yazılmaz. Devre dışı Plugin'ler, okunamayan Plugin ayrıntıları, abonelik kapılı kaynak hesapları ve doğrulama istendiğinde eksik uygulamalar, devre dışı uygulamalar, erişilemeyen uygulamalar veya kaynak uygulama envanteri hataları, hedef yapılandırma girdileri yerine türlendirilmiş nedenlerle manuel atlanan öğeler olur.
  Uygulama, seçilen her uygun Plugin için app-server `plugin/install` çağırır; hedef app-server bu Plugin'i zaten yüklü ve etkin olarak bildiriyor olsa bile. Geçirilen Codex Plugin'leri yalnızca yerel Codex harness'ı seçen oturumlarda kullanılabilir; OpenClaw sağlayıcı çalıştırmalarına, ACP konuşma bağlamalarına veya diğer harness'lara sunulmaz.

### Manuel inceleme Codex durumu

Codex `config.toml`, yerel `hooks/hooks.json`, küratörlü olmayan pazar yerleri, kaynakta yüklü küratörlü Plugin olmayan önbelleğe alınmış Plugin paketleri ve kaynak abonelik kapısından geçemeyen kaynakta yüklü Plugin'ler otomatik olarak etkinleştirilmez. `--verify-plugin-apps` ayarlandığında kaynak uygulama envanteri kapısından geçemeyen Plugin'ler de atlanır. Bunlar manuel inceleme için geçiş raporuna kopyalanır veya raporlanır.

Geçirilen kaynakta yüklü küratörlü Plugin'ler için uygulama şunları yazar:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- seçilen her Plugin için `marketplaceName: "openai-curated"` ve `pluginName` içeren bir açık Plugin girdisi

Geçiş hiçbir zaman `plugins["*"]` yazmaz ve yerel marketplace önbellek yollarını asla saklamaz. Kaynak tarafındaki abonelik hataları, manuel öğelerde `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled` veya `plugin_read_unavailable` gibi tipli nedenlerle bildirilir. `--verify-plugin-apps` ile kaynak uygulama envanteri hataları `app_inaccessible`, `app_disabled`, `app_missing` veya `app_inventory_unavailable` olarak da görünebilir. Atlanan Plugin'ler hedef yapılandırmaya yazılmaz.
Hedef tarafındaki kimlik doğrulaması gerektiren kurulumlar, etkilenen Plugin öğesinde `status: "skipped"`, `reason: "auth_required"` ve temizlenmiş uygulama tanımlayıcılarıyla bildirilir. Açık yapılandırma girdileri, yeniden yetkilendirip etkinleştirene kadar devre dışı olarak yazılır. Diğer kurulum hataları, öğe kapsamlı `error` sonuçlarıdır.

Planlama sırasında Codex uygulama sunucusu Plugin envanteri kullanılamıyorsa geçiş, tüm geçişi başarısız kılmak yerine önbelleğe alınmış paket danışma öğelerine geri döner.

## Hermes sağlayıcısı

Paketle birlikte gelen Hermes sağlayıcısı, varsayılan olarak durumu `~/.hermes` konumunda algılar. Hermes başka bir yerdeyse `--from <path>` kullanın.

### Hermes neleri içe aktarır

- `config.yaml` dosyasındaki varsayılan model yapılandırması.
- `providers` ve `custom_providers` içindeki yapılandırılmış model sağlayıcıları ve özel OpenAI uyumlu uç noktalar.
- `mcp_servers` veya `mcp.servers` içindeki MCP sunucusu tanımları.
- `SOUL.md` ve `AGENTS.md` dosyalarını OpenClaw aracı çalışma alanına.
- `memories/MEMORY.md` ve `memories/USER.md` dosyalarını çalışma alanı bellek dosyalarına eklenmiş olarak.
- OpenClaw dosya belleği için bellek yapılandırma varsayılanları, ayrıca Honcho gibi harici bellek sağlayıcıları için arşiv veya manuel inceleme öğeleri.
- `skills/<name>/` altında `SKILL.md` dosyası içeren Skills.
- `skills.config` içindeki Skills başına yapılandırma değerleri.
- Etkileşimli kimlik bilgisi geçişi kabul edildiğinde veya `--include-secrets` ayarlandığında, OpenCode `auth.json` dosyasındaki OpenCode OpenAI OAuth kimlik bilgileri. Hermes `auth.json` OAuth girdileri, manuel OpenAI yeniden yetkilendirmesi veya doctor onarımı için bildirilen eski durumdur.
- Etkileşimli kimlik bilgisi geçişi kabul edildiğinde veya `--include-secrets` ayarlandığında, Hermes `.env` ve OpenCode `auth.json` dosyalarındaki desteklenen API anahtarları ve token'lar.

### Desteklenen `.env` anahtarları

- `AI_GATEWAY_API_KEY`
- `ALIBABA_API_KEY`
- `ANTHROPIC_API_KEY`
- `ARCEEAI_API_KEY`
- `CEREBRAS_API_KEY`
- `CHUTES_API_KEY`
- `CLOUDFLARE_AI_GATEWAY_API_KEY`
- `COPILOT_GITHUB_TOKEN`
- `DASHSCOPE_API_KEY`
- `DEEPINFRA_API_KEY`
- `DEEPSEEK_API_KEY`
- `FIREWORKS_API_KEY`
- `GEMINI_API_KEY`
- `GH_TOKEN`
- `GITHUB_TOKEN`
- `GLM_API_KEY`
- `GOOGLE_API_KEY`
- `GROQ_API_KEY`
- `HF_TOKEN`
- `HUGGINGFACE_HUB_TOKEN`
- `KILOCODE_API_KEY`
- `KIMICODE_API_KEY`
- `KIMI_API_KEY`
- `MINIMAX_API_KEY`
- `MINIMAX_CODING_API_KEY`
- `MISTRAL_API_KEY`
- `MODELSTUDIO_API_KEY`
- `MOONSHOT_API_KEY`
- `NVIDIA_API_KEY`
- `OPENAI_API_KEY`
- `OPENCODE_API_KEY`
- `OPENCODE_GO_API_KEY`
- `OPENCODE_ZEN_API_KEY`
- `OPENROUTER_API_KEY`
- `QIANFAN_API_KEY`
- `QWEN_API_KEY`
- `TOGETHER_API_KEY`
- `VENICE_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`
- `ZAI_API_KEY`
- `Z_AI_API_KEY`

### Yalnızca arşiv durumu

OpenClaw'ın güvenli biçimde yorumlayamadığı Hermes durumu, manuel inceleme için geçiş raporuna kopyalanır; ancak canlı OpenClaw yapılandırmasına veya kimlik bilgilerine yüklenmez. Bu, OpenClaw'ın bunu otomatik olarak çalıştırabileceğini veya güvenebileceğini varsaymadan opak ya da güvenli olmayan durumu korur:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
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

Çalışma zamanında Plugin `api.registerMigrationProvider(...)` çağrısı yapar. Sağlayıcı `detect`, `plan` ve `apply` uygular. Çekirdek; CLI orkestrasyonunu, yedekleme ilkesini, istemleri, JSON çıktısını ve çakışma ön denetimini üstlenir. Çekirdek incelenmiş planı `apply(ctx, plan)` içine geçirir; sağlayıcılar yalnızca uyumluluk için bu bağımsız değişken yoksa planı yeniden oluşturabilir.

Sağlayıcı Plugin'leri, öğe oluşturma ve özet sayımları için `openclaw/plugin-sdk/migration`; çakışma farkındalıklı dosya kopyaları, yalnızca arşiv raporu kopyaları, önbelleğe alınmış yapılandırma çalışma zamanı sarmalayıcıları ve geçiş raporları için de `openclaw/plugin-sdk/migration-runtime` kullanabilir.

## Onboarding entegrasyonu

Onboarding, bir sağlayıcı bilinen bir kaynak algıladığında geçiş önerebilir. Hem `openclaw onboard --flow import` hem de `openclaw setup --wizard --import-from hermes` aynı Plugin geçiş sağlayıcısını kullanır ve uygulamadan önce yine bir önizleme gösterir.

<Note>
Onboarding içe aktarmaları taze bir OpenClaw kurulumu gerektirir. Zaten yerel durumunuz varsa önce yapılandırmayı, kimlik bilgilerini, oturumları ve çalışma alanını sıfırlayın. Yedekleme-artı-üzerine yazma veya birleştirme içe aktarmaları mevcut kurulumlar için özellik kapılıdır.
</Note>

## İlgili

- [Hermes'ten geçiş](/tr/install/migrating-hermes): kullanıcıya yönelik adım adım kılavuz.
- [Claude'dan geçiş](/tr/install/migrating-claude): kullanıcıya yönelik adım adım kılavuz.
- [Geçiş](/tr/install/migrating): OpenClaw'ı yeni bir makineye taşıyın.
- [Doctor](/tr/gateway/doctor): geçiş uygulandıktan sonra sağlık denetimi.
- [Plugins](/tr/tools/plugin): Plugin kurulumu ve kaydı.

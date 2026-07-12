---
read_when:
    - Hermes'ten veya başka bir ajan sisteminden OpenClaw'a geçiş yapmak istiyorsunuz
    - Plugin tarafından yönetilen bir geçiş sağlayıcısı ekliyorsunuz
summary: '`openclaw migrate` için CLI başvurusu (başka bir aracı sisteminden durumu içe aktarır)'
title: Geçir
x-i18n:
    generated_at: "2026-07-12T12:11:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1160373bfec09de8ec1bac6fbe8a218e8af7ec6a5896bc1fdfe6a0db158d50a1
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Plugin'e ait bir geçiş sağlayıcısı aracılığıyla başka bir ajan sisteminden durumu içe aktarın. Birlikte gelen sağlayıcılar Claude, Codex CLI ve [Hermes](/tr/install/migrating-hermes) desteği sunar; Plugin'ler ek sağlayıcılar kaydedebilir.

<Tip>
Kullanıcılara yönelik adım adım açıklamalar için [Claude'dan geçiş](/tr/install/migrating-claude) ve [Hermes'ten geçiş](/tr/install/migrating-hermes) sayfalarına bakın. [Geçiş merkezi](/tr/install/migrating) tüm yolları listeler.
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

Başka bayrak olmadan `openclaw migrate <provider>` çalıştırıldığında uygulama öncesinde plan oluşturulur, önizleme gösterilir ve (bir TTY'de) onay istenir. `openclaw migrate plan <provider>` ve `openclaw migrate apply <provider>`, aynı bayrakları kullanarak önizleme ve uygulama işlemlerini ayrı alt komutlara böler.

<ParamField path="<provider>" type="string">
  Kayıtlı bir geçiş sağlayıcısının adı; örneğin `hermes`. Yüklü sağlayıcıları görmek için `openclaw migrate list` komutunu çalıştırın.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Planı oluşturup durumu değiştirmeden çıkın.
</ParamField>
<ParamField path="--from <path>" type="string">
  Kaynak durum dizinini geçersiz kılın. Hermes varsayılan olarak `~/.hermes`, Codex `~/.codex` (veya `$CODEX_HOME`), Claude ise `~/.claude` kullanır.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Desteklenen kimlik bilgilerini onay istemeden içe aktarın. Etkileşimli uygulama, algılanan kimlik doğrulama bilgilerini içe aktarmadan önce varsayılan olarak evet seçili şekilde onay ister; etkileşimsiz `--yes` kullanımında bunları içe aktarmak için `--include-secrets` gerekir.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  Etkileşimli istem dahil olmak üzere kimlik doğrulama bilgilerinin içe aktarılmasını atlayın.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Plan çakışma bildirdiğinde uygulamanın mevcut hedefleri değiştirmesine izin verin.
</ParamField>
<ParamField path="--yes" type="boolean">
  Onay istemini atlayın. Etkileşimsiz modda gereklidir.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Skills adına veya öğe kimliğine göre kopyalanacak bir Skills öğesi seçin. Birden fazla Skills öğesini taşımak için bayrağı tekrarlayın. Belirtilmediğinde etkileşimli Codex geçişleri bir onay kutusu seçicisi gösterir, etkileşimsiz geçişler ise planlanan tüm Skills öğelerini korur.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Plugin adına veya öğe kimliğine göre bir Codex Plugin kurulum öğesi seçin. Birden fazla Codex Plugin'ini taşımak için bayrağı tekrarlayın. Belirtilmediğinde etkileşimli Codex geçişleri yerel bir Codex Plugin onay kutusu seçicisi gösterir, etkileşimsiz geçişler ise planlanan tüm Plugin'leri korur. Yalnızca Codex uygulama sunucusu envanteri tarafından keşfedilen ve kaynaktan yüklenmiş `openai-curated` Codex Plugin'leri için geçerlidir.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Yalnızca Codex. Yerel Plugin etkinleştirmesini planlamadan önce kaynak Codex uygulama sunucusunda yeni bir `app/list` taramasını zorunlu kılar. Geçiş planlamasını hızlı tutmak için varsayılan olarak kapalıdır.
</ParamField>
<ParamField path="--backup-output <path>" type="string">
  Geçiş öncesi yedek arşivinin yolu veya dizini. `openclaw backup create` komutuna iletilir.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Uygulama öncesi yedeklemeyi atlayın. Yerel OpenClaw durumu mevcutsa `--force` gerektirir.
</ParamField>
<ParamField path="--force" type="boolean">
  Aksi hâlde uygulamanın yedeklemeyi atlamayı reddedeceği durumlarda `--no-backup` ile birlikte gereklidir.
</ParamField>
<ParamField path="--json" type="boolean">
  Planı veya uygulama sonucunu JSON olarak yazdırın. `--json` kullanılıp `--yes` kullanılmadığında uygulama planı yazdırır ve durumu değiştirmez.
</ParamField>

## Güvenlik modeli

`openclaw migrate` önce önizleme yaklaşımını kullanır.

<AccordionGroup>
  <Accordion title="Uygulamadan önce önizleme">
    Sağlayıcı, herhangi bir değişiklik yapılmadan önce çakışmalar, atlanan öğeler ve hassas öğeler dahil olmak üzere ayrıntılı bir plan döndürür. JSON planları, uygulama çıktısı ve geçiş raporları; API anahtarları, belirteçler, yetkilendirme üstbilgileri, çerezler ve parolalar gibi iç içe geçmiş, gizli bilgi görünümündeki anahtarları maskeler.

    `openclaw migrate apply <provider>`, `--yes` ayarlanmadığı sürece durumu değiştirmeden önce planın önizlemesini gösterir ve onay ister. Etkileşimsiz modda uygulama için `--yes` gerekir.

  </Accordion>
  <Accordion title="Yedeklemeler">
    Uygulama, geçişi gerçekleştirmeden önce bir OpenClaw yedeği oluşturur ve doğrular. Henüz yerel OpenClaw durumu yoksa yedekleme adımı atlanır ve geçiş devam eder. Durum mevcutken yedeklemeyi atlamak için hem `--no-backup` hem de `--force` seçeneklerini kullanın.
  </Accordion>
  <Accordion title="Çakışmalar">
    Planda çakışmalar varsa uygulama devam etmeyi reddeder. Planı inceleyin; mevcut hedeflerin değiştirilmesi bilinçli bir seçimse `--overwrite` ile yeniden çalıştırın. Sağlayıcılar, üzerine yazılan dosyalar için geçiş raporu dizinine öğe düzeyinde yedekler yazmaya devam edebilir.
  </Accordion>
  <Accordion title="Gizli bilgiler">
    Etkileşimli uygulama, algılanan kimlik doğrulama bilgilerinin içe aktarılıp aktarılmayacağını varsayılan olarak evet seçili şekilde sorar. Bunları atlamak için `--no-auth-credentials`, `--yes` ile gözetimsiz kimlik bilgisi aktarımı için ise `--include-secrets` kullanın.
  </Accordion>
</AccordionGroup>

## Claude sağlayıcısı

Birlikte gelen Claude sağlayıcısı, varsayılan olarak `~/.claude` konumundaki Claude Code durumunu algılar. Belirli bir Claude Code ana dizinini veya proje kökünü içe aktarmak için `--from <path>` kullanın.

<Tip>
Kullanıcılara yönelik adım adım açıklama için [Claude'dan geçiş](/tr/install/migrating-claude) sayfasına bakın.
</Tip>

### Claude'un içe aktardıkları

- Proje `CLAUDE.md` ve `.claude/CLAUDE.md` dosyalarını OpenClaw ajan çalışma alanına (`AGENTS.md`) aktarır.
- Kullanıcıya ait `~/.claude/CLAUDE.md` içeriğini çalışma alanındaki `USER.md` dosyasına ekler.
- Proje `.mcp.json` dosyasından, Claude Code `~/.claude.json` dosyasından (proje başına girdileri dahil) ve Claude Desktop `claude_desktop_config.json` dosyasından MCP sunucu tanımlarını aktarır.
- `SKILL.md` içeren Claude Skills dizinlerini (kullanıcı `~/.claude/skills` ve proje `.claude/skills`) aktarır.
- Claude komut Markdown dosyalarını (kullanıcı `~/.claude/commands` ve proje `.claude/commands`) yalnızca elle çağrılabilen OpenClaw Skills öğelerine dönüştürür.

### Arşiv ve elle inceleme durumu

Claude kancaları, izinleri, ortam varsayılanları, proje `CLAUDE.local.md` dosyası, `.claude/rules`, kullanıcı ve proje `agents/` dizinleri ile proje geçmişi (`~/.claude` altındaki `projects`, `cache`, `plans`) geçiş raporunda korunur veya elle incelenecek öğeler olarak bildirilir. OpenClaw kancaları çalıştırmaz, geniş izin listelerini kopyalamaz veya OAuth/Desktop kimlik bilgisi durumunu otomatik olarak içe aktarmaz.

## Codex sağlayıcısı

Birlikte gelen Codex sağlayıcısı, varsayılan olarak `~/.codex` konumundaki veya bu ortam değişkeni ayarlanmışsa `CODEX_HOME` konumundaki Codex CLI durumunu algılar. Belirli bir Codex ana dizininin envanterini çıkarmak için `--from <path>` kullanın.

OpenClaw Codex çalışma düzeneğine geçerken ve yararlı kişisel Codex CLI varlıklarını bilinçli biçimde aktarmak istediğinizde bu sağlayıcıyı kullanın. Yerel Codex uygulama sunucusu başlatmaları ajan başına bir `CODEX_HOME` kullanır; bu nedenle varsayılan olarak kişisel `~/.codex` dizininizi okumaz. Normal işlem `HOME` değeri yine devralındığından Codex, paylaşılan `$HOME/.agents/*` Skills/Plugin pazar yeri girdilerini görebilir ve alt işlemler kullanıcı ana dizinindeki yapılandırmayı ve belirteçleri bulabilir.

Etkileşimli bir terminalde `openclaw migrate codex` çalıştırıldığında önce tam planın önizlemesi gösterilir, ardından son uygulama onayından önce onay kutusu seçicileri açılır. Önce Skills kopyalama öğeleri sorulur. Toplu seçim için `Toggle all on` veya `Toggle all off` kullanın. Satırları açıp kapatmak için Boşluk tuşuna, vurgulanan satırı etkinleştirip devam etmek için Enter tuşuna basın. Planlanan Skills öğeleri işaretli, çakışan Skills öğeleri işaretsiz başlar; `Skip for now`, Plugin seçimine devam ederken bu çalıştırmadaki Skills kopyalamalarını atlar. Kaynaktan yüklenmiş, seçilmiş Codex Plugin'leri taşınabilir durumdaysa ve `--plugin` belirtilmemişse geçiş, ardından Plugin adına göre yerel Codex Plugin etkinleştirmesi için seçim ister. Hedef OpenClaw Codex Plugin yapılandırmasında ilgili Plugin zaten yoksa Plugin öğeleri işaretli başlar. Mevcut hedef Plugin'ler işaretsiz başlar ve `conflict: plugin exists` gibi bir çakışma ipucu gösterir; o çalıştırmada hiçbir yerel Codex Plugin'ini taşımamak için `Toggle all off`, uygulamadan önce durmak için ise `Skip for now` seçeneğini belirleyin.

Betikli veya kesin çalıştırmalarda bir ya da daha fazla Skills öğesini veya Plugin'i açıkça seçin:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex'in içe aktardıkları

- Codex'in `.system` önbelleği hariç, `$CODEX_HOME/skills` altındaki Codex CLI Skills dizinleri.
- `$HOME/.agents/skills` altındaki kişisel AgentSkills öğeleri; ajan başına sahiplik için geçerli OpenClaw ajan çalışma alanına kopyalanır.
- Codex uygulama sunucusu `plugin/list` aracılığıyla keşfedilen, kaynaktan yüklenmiş `openai-curated` Codex Plugin'leri. Planlama, etkinleştirilmiş ve yüklü her Plugin için `plugin/read` çağrısını kullanır.

Uygulama destekli Plugin geçişinin ek denetimleri vardır:

- Uygulama destekli Plugin'ler, kaynak Codex uygulama sunucusu hesabının bir ChatGPT abonelik hesabı olmasını gerektirir. ChatGPT dışı hesap yanıtları veya eksik hesap yanıtları `codex_subscription_required` nedeniyle atlanır.
- Geçiş varsayılan olarak kaynakta `app/list` çağrısı yapmaz; dolayısıyla hesap denetimini geçen uygulama destekli Plugin'ler, kaynak uygulama erişilebilirliği doğrulanmadan planlanır ve hesap sorgusu aktarım hataları `codex_account_unavailable` nedeniyle atlanır.
- Yeni bir kaynak `app/list` anlık görüntüsünü zorlamak ve yerel etkinleştirmeyi planlamadan önce sahip olunan her uygulamanın mevcut, etkin ve erişilebilir olmasını şart koşmak için `--verify-plugin-apps` seçeneğini kullanın. Bu modda hesap sorgusu aktarım hataları, kaynak uygulama envanteri doğrulamasına geçer. Anlık görüntü yalnızca geçerli işlem boyunca bellekte tutulur; geçiş çıktısına veya hedef yapılandırmaya hiçbir zaman yazılmaz.

Devre dışı Plugin'ler, okunamayan Plugin ayrıntıları, abonelik denetimine takılan kaynak hesapları ve (`--verify-plugin-apps` ayarlandığında) eksik, devre dışı veya erişilemeyen uygulamalar, hedef yapılandırma girdileri yerine türü belirtilmiş nedenlere sahip ve elle incelenecek atlanmış öğelere dönüşür. Uygulama, hedef uygulama sunucusu ilgili Plugin'i zaten yüklü ve etkin olarak bildirse bile seçilen her uygun Plugin için uygulama sunucusunda `plugin/install` çağrısı yapar. Taşınan Codex Plugin'leri yalnızca yerel Codex çalışma düzeneğini seçen oturumlarda kullanılabilir; OpenClaw sağlayıcı çalıştırmalarına, ACP konuşma bağlamalarına veya diğer çalışma düzeneklerine sunulmaz.

### Elle incelenecek Codex durumu

Codex `config.toml`, yerel `hooks/hooks.json`, seçilmiş olmayan pazar yerleri, kaynaktan yüklenmiş seçilmiş Plugin niteliğinde olmayan önbelleğe alınmış Plugin paketleri ve kaynak abonelik denetiminde başarısız olan, kaynaktan yüklenmiş Plugin'ler otomatik olarak etkinleştirilmez. `--verify-plugin-apps` ayarlandığında kaynak uygulama envanteri denetiminde başarısız olan Plugin'ler de atlanır. Bunların tümü elle incelenmek üzere geçiş raporuna kopyalanır veya raporda bildirilir.

Kaynaktan yüklenmiş ve taşınmış seçilmiş Plugin'ler için uygulama şunları yazar:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- seçilen her Plugin için `marketplaceName: "openai-curated"` ve `pluginName` içeren açık bir Plugin girdisi

Geçiş hiçbir zaman `plugins["*"]` yazmaz ve yerel pazar yeri önbellek yollarını hiçbir zaman saklamaz.

Atlanan Plugin'ler hedef yapılandırmaya yazılmaz. Kaynak tarafındaki abonelik hataları, elle incelenecek öğelerde türü belirtilmiş nedenlerle bildirilir: `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled` veya `plugin_read_unavailable`. `--verify-plugin-apps` kullanıldığında, kaynak uygulama envanteri hataları ayrıca `app_inaccessible`, `app_disabled`, `app_missing` veya `app_inventory_unavailable` olarak görünebilir. Hedef tarafında kimlik doğrulama gerektiren kurulumlar, etkilenen Plugin öğesinde `status: "skipped"`, `reason: "auth_required"` ve arındırılmış uygulama tanımlayıcılarıyla bildirilir; bunlara ait açık yapılandırma girdileri, yeniden yetkilendirip etkinleştirene kadar devre dışı olarak yazılır. Diğer kurulum hataları, öğe kapsamlı `error` sonuçlarıdır.

Planlama sırasında Codex uygulama sunucusunun Plugin envanterine erişilemiyorsa geçiş, tüm geçişi başarısız kılmak yerine önbelleğe alınmış paket öneri öğelerine geri döner.

## Hermes sağlayıcısı

Paketle gelen Hermes sağlayıcısı, varsayılan olarak `~/.hermes` konumundaki durumu algılar. Hermes başka bir konumdaysa `--from <path>` kullanın.

### Hermes'in içe aktardıkları

- `config.yaml` dosyasındaki varsayılan model yapılandırması.
- `providers` ve `custom_providers` içindeki yapılandırılmış model sağlayıcıları ve özel OpenAI uyumlu uç noktalar.
- `mcp_servers` veya `mcp.servers` içindeki MCP sunucusu tanımları.
- OpenClaw aracısı çalışma alanına `SOUL.md` ve `AGENTS.md`.
- Çalışma alanı bellek dosyalarına eklenen `memories/MEMORY.md` ve `memories/USER.md`.
- OpenClaw dosya belleği için bellek yapılandırması varsayılanları ile Honcho gibi harici bellek sağlayıcılarına yönelik arşiv veya elle inceleme öğeleri.
- `skills/<name>/` altında bir `SKILL.md` dosyası içeren Skills.
- `skills.config` içindeki Skills başına yapılandırma değerleri.
- Etkileşimli kimlik bilgisi geçişi kabul edildiğinde veya `--include-secrets` ayarlandığında OpenCode `auth.json` dosyasındaki OpenCode OpenAI OAuth kimlik bilgileri. Hermes `auth.json` OAuth girdileri, OpenAI için elle yeniden kimlik doğrulama veya doctor onarımı gerektiren eski durum olarak bildirilir.
- Etkileşimli kimlik bilgisi geçişi kabul edildiğinde veya `--include-secrets` ayarlandığında Hermes `.env` ve OpenCode `auth.json` dosyalarındaki desteklenen API anahtarları ve belirteçler.

### Desteklenen `.env` anahtarları

`AI_GATEWAY_API_KEY`, `ALIBABA_API_KEY`, `ANTHROPIC_API_KEY`, `ARCEEAI_API_KEY`, `CEREBRAS_API_KEY`, `CHUTES_API_KEY`, `CLOUDFLARE_AI_GATEWAY_API_KEY`, `COPILOT_GITHUB_TOKEN`, `DASHSCOPE_API_KEY`, `DEEPINFRA_API_KEY`, `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY`, `GEMINI_API_KEY`, `GH_TOKEN`, `GITHUB_TOKEN`, `GLM_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `HF_TOKEN`, `HUGGINGFACE_HUB_TOKEN`, `KILOCODE_API_KEY`, `KIMICODE_API_KEY`, `KIMI_API_KEY`, `MINIMAX_API_KEY`, `MINIMAX_CODING_API_KEY`, `MISTRAL_API_KEY`, `MODELSTUDIO_API_KEY`, `MOONSHOT_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `OPENCODE_API_KEY`, `OPENCODE_GO_API_KEY`, `OPENCODE_ZEN_API_KEY`, `OPENROUTER_API_KEY`, `QIANFAN_API_KEY`, `QWEN_API_KEY`, `TOGETHER_API_KEY`, `VENICE_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`, `ZAI_API_KEY`, `Z_AI_API_KEY`.

### Yalnızca arşivlenen durum

OpenClaw'ın güvenli biçimde yorumlayamadığı Hermes durumu, elle incelenmek üzere geçiş raporuna kopyalanır ancak canlı OpenClaw yapılandırmasına veya kimlik bilgilerine yüklenmez. Böylece OpenClaw'ın bu durumu otomatik olarak yürütebildiği veya ona güvenebildiği varsayılmadan, belirsiz ya da güvenli olmayan durum korunur: `plugins/`, `sessions/`, `logs/`, `cron/`, `mcp-tokens/`, `state.db`.

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

Çalışma zamanında Plugin, `api.registerMigrationProvider(...)` çağrısını yapar. Sağlayıcı `detect`, `plan` ve `apply` işlevlerini uygular. CLI düzenlemesi, yedekleme politikası, istemler, JSON çıktısı ve çakışma ön denetimi çekirdeğin sorumluluğundadır. Çekirdek, incelenmiş planı `apply(ctx, plan)` işlevine geçirir; sağlayıcılar uyumluluk amacıyla planı yalnızca bu bağımsız değişken yoksa yeniden oluşturabilir.

Sağlayıcı Plugin'leri, öğe oluşturma ve özet sayımları için `openclaw/plugin-sdk/migration`; çakışmaları dikkate alan dosya kopyaları, yalnızca arşiv raporu kopyaları, önbelleğe alınmış yapılandırma çalışma zamanı sarmalayıcıları ve geçiş raporları için de `openclaw/plugin-sdk/migration-runtime` kullanabilir.

## İlk kurulum entegrasyonu

İlk kurulum, bir sağlayıcı bilinen bir kaynak algıladığında geçiş seçeneği sunabilir. Hem `openclaw onboard --flow import` hem de `openclaw setup --wizard --import-from hermes`, aynı Plugin geçiş sağlayıcısını kullanır ve uygulamadan önce yine bir önizleme gösterir.

<Note>
İlk kurulum içe aktarmaları yeni bir OpenClaw kurulumu gerektirir. Zaten yerel durumunuz varsa önce yapılandırmayı, kimlik bilgilerini, oturumları ve çalışma alanını sıfırlayın. Yedekleyip üzerine yazma veya birleştirme yoluyla içe aktarma, mevcut kurulumlarda özellik geçidiyle denetlenir.
</Note>

## İlgili konular

- [Hermes'ten geçiş](/tr/install/migrating-hermes): kullanıcıya yönelik adım adım kılavuz.
- [Claude'dan geçiş](/tr/install/migrating-claude): kullanıcıya yönelik adım adım kılavuz.
- [Geçiş](/tr/install/migrating): OpenClaw'ı yeni bir makineye taşıma.
- [Doctor](/tr/gateway/doctor): geçiş uygulandıktan sonra sistem durumu denetimi.
- [Plugin'ler](/tr/tools/plugin): Plugin kurulumu ve kaydı.

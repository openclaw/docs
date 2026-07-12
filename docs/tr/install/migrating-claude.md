---
read_when:
    - Claude Code veya Claude Desktop'tan geçiş yapıyorsunuz ve talimatları, MCP sunucularını ve Skills'i korumak istiyorsunuz
    - OpenClaw'un neleri otomatik olarak içe aktardığını ve nelerin yalnızca arşivde kaldığını anlamanız gerekir
summary: Önizlemeli içe aktarma ile Claude Code ve Claude Desktop yerel durumunu OpenClaw'a taşıyın
title: Claude'dan Geçiş
x-i18n:
    generated_at: "2026-07-12T12:25:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f31088b749a1bebe39b16f519b1817ffeb71ca31e8cbf46fd59db6ff603dbe0f
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw, yerel Claude durumunu paketle gelen Claude geçiş sağlayıcısı aracılığıyla içe aktarır. Sağlayıcı, durumu değiştirmeden önce her öğenin önizlemesini gösterir, planlarda ve raporlarda gizli bilgileri maskeler ve uygulamadan önce doğrulanmış bir yedek oluşturur.

<Note>
İlk kurulum sırasında içe aktarma, yeni bir OpenClaw kurulumu gerektirir. Zaten yerel OpenClaw durumunuz varsa önce yapılandırmayı, kimlik bilgilerini, oturumları ve çalışma alanını sıfırlayın ya da planı inceledikten sonra `--overwrite` ile doğrudan `openclaw migrate` kullanın.
</Note>

## İçe aktarmanın iki yolu

<Tabs>
  <Tab title="İlk kurulum sihirbazı">
    Sihirbaz, yerel Claude durumu algıladığında Claude seçeneğini sunar.

    ```bash
    openclaw onboard --flow import
    ```

    Ya da belirli bir kaynak belirtin:

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    Betikleştirilmiş veya tekrarlanabilir çalıştırmalar için `openclaw migrate` kullanın. Tam başvuru için [`openclaw migrate`](/tr/cli/migrate) sayfasına bakın.

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    Belirli bir Claude Code ana dizinini veya proje kökünü içe aktarmak için `--from <path>` ekleyin.

  </Tab>
</Tabs>

## İçe aktarılanlar

<AccordionGroup>
  <Accordion title="Talimatlar ve bellek">
    - Projedeki `CLAUDE.md` ve `.claude/CLAUDE.md` içeriği, OpenClaw aracısının çalışma alanındaki `AGENTS.md` dosyasına kopyalanır veya eklenir.
    - Kullanıcının `~/.claude/CLAUDE.md` içeriği, çalışma alanındaki `USER.md` dosyasına eklenir.

  </Accordion>
  <Accordion title="MCP sunucuları">
    MCP sunucu tanımları, mevcut olduklarında projedeki `.mcp.json`, Claude Code `~/.claude.json` ve Claude Desktop `claude_desktop_config.json` dosyalarından içe aktarılır.
  </Accordion>
  <Accordion title="Skills ve komutlar">
    - `SKILL.md` dosyası bulunan Claude Skills öğeleri, OpenClaw çalışma alanının Skills dizinine kopyalanır.
    - `.claude/commands/` veya `~/.claude/commands/` altındaki Claude komut Markdown dosyaları, `disable-model-invocation: true` ayarlı OpenClaw Skills öğelerine dönüştürülür.

  </Accordion>
</AccordionGroup>

## Yalnızca arşivde kalanlar

Sağlayıcı, elle incelenmeleri için bunları geçiş raporuna kopyalar ancak canlı OpenClaw yapılandırmasına **yüklemez**:

- Claude kancaları
- Claude izinleri ve geniş araç izin listeleri
- Claude ortam varsayılanları
- `CLAUDE.local.md`
- `.claude/rules/`
- `.claude/agents/` veya `~/.claude/agents/` altındaki Claude alt aracıları
- Claude Code önbellekleri, planları ve proje geçmişi dizinleri
- Claude Desktop uzantıları ve işletim sisteminde saklanan kimlik bilgileri

OpenClaw; kancaları çalıştırmayı, izin listelerine güvenmeyi veya anlaşılmaz OAuth ve Desktop kimlik bilgisi durumunu otomatik olarak çözmeyi reddeder. Arşivi inceledikten sonra ihtiyaç duyduklarınızı elle taşıyın.

## Kaynak seçimi

OpenClaw, `--from` kullanılmadığında `~/.claude` konumundaki varsayılan Claude Code ana dizinini, örneklenen Claude Code `~/.claude.json` durum dosyasını ve macOS'taki Claude Desktop MCP yapılandırmasını inceler.

`--from` bir proje kökünü gösterdiğinde OpenClaw yalnızca o projeye ait `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/` ve `.mcp.json` gibi Claude dosyalarını içe aktarır. Proje kökü içe aktarımı sırasında genel Claude ana dizininizi okumaz.

## Önerilen akış

<Steps>
  <Step title="Planın önizlemesini görüntüleyin">
    ```bash
    openclaw migrate claude --dry-run
    ```

    Plan; çakışmalar, atlanan öğeler ve iç içe MCP `env` veya `headers` alanlarında maskelenen hassas değerler dâhil olmak üzere değişecek her şeyi listeler.

  </Step>
  <Step title="Yedek alarak uygulayın">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw, uygulamadan önce bir yedek oluşturur ve doğrular.

  </Step>
  <Step title="Doctor'ı çalıştırın">
    ```bash
    openclaw doctor
    ```

    [Doctor](/tr/gateway/doctor), içe aktarma sonrasında yapılandırma veya durum sorunlarını denetler.

  </Step>
  <Step title="Yeniden başlatın ve doğrulayın">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Gateway'in sağlıklı olduğunu ve içe aktarılan talimatlarınızın, MCP sunucularınızın ve Skills öğelerinizin yüklendiğini doğrulayın.

  </Step>
</Steps>

## Çakışmaların işlenmesi

Plan çakışma bildirdiğinde (hedefte zaten bir dosya veya yapılandırma değeri bulunduğunda) uygulama devam etmeyi reddeder.

<Warning>
Yalnızca mevcut hedefi değiştirmek istiyorsanız komutu `--overwrite` ile yeniden çalıştırın. Sağlayıcılar, üzerine yazılan dosyalar için geçiş raporu dizinine yine de öğe düzeyinde yedekler yazabilir.
</Warning>

Yeni bir OpenClaw kurulumunda çakışmalar olağan değildir. Bunlar genellikle içe aktarmayı, kullanıcı düzenlemeleri bulunan bir kurulumda yeniden çalıştırdığınızda ortaya çıkar.

## Otomasyon için JSON çıktısı

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

Etkileşimli bir terminal dışında `migrate apply` için `--yes` gereklidir; bu seçenek olmadan OpenClaw uygulama yapmak yerine hata verir. Bu nedenle betikler ve CI, `--yes` seçeneğini açıkça iletmelidir. Önce `--dry-run --json` ile önizleme yapın, ardından plan doğru göründüğünde `--json --yes` ile uygulayın.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Claude durumu ~/.claude dışında bulunuyor">
    `--from /actual/path` (CLI) veya `--import-source /actual/path` (ilk kurulum) seçeneğini iletin.
  </Accordion>
  <Accordion title="İlk kurulum mevcut bir kuruluma içe aktarmayı reddediyor">
    İlk kurulum sırasında içe aktarma, yeni bir kurulum gerektirir. Durumu sıfırlayıp ilk kurulumu yeniden yapın veya `--overwrite` ve açık yedekleme denetimini destekleyen `openclaw migrate apply claude` komutunu doğrudan kullanın.
  </Accordion>
  <Accordion title="Claude Desktop'taki MCP sunucuları içe aktarılmadı">
    Claude Desktop, `claude_desktop_config.json` dosyasını platforma özgü bir yoldan okur. OpenClaw dosyayı otomatik olarak algılamadıysa `--from` seçeneğini bu dosyanın dizinine yöneltin.
  </Accordion>
  <Accordion title="Claude komutları, model çağrısı devre dışı bırakılmış Skills öğelerine dönüştü">
    Bu, tasarım gereğidir. Claude komutları kullanıcı tarafından tetiklendiğinden OpenClaw bunları `disable-model-invocation: true` ayarlı Skills öğeleri olarak içe aktarır. Aracının bunları otomatik olarak çağırmasını istiyorsanız her Skill öğesinin ön madde alanını düzenleyin.
  </Accordion>
</AccordionGroup>

## İlgili konular

- [`openclaw migrate`](/tr/cli/migrate): tam CLI başvurusu, Plugin sözleşmesi ve JSON yapıları.
- [Geçiş kılavuzu](/tr/install/migrating): tüm geçiş yolları.
- [Hermes'ten geçiş](/tr/install/migrating-hermes): diğer sistemler arası içe aktarma yolu.
- [İlk kurulum](/tr/cli/onboard): sihirbaz akışı ve etkileşimsiz seçenekler.
- [Doctor](/tr/gateway/doctor): geçiş sonrası sistem durumu denetimi.
- [Aracı çalışma alanı](/tr/concepts/agent-workspace): `AGENTS.md`, `USER.md` ve Skills öğelerinin bulunduğu yer.

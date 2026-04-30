---
read_when:
    - Claude Code veya Claude Desktop'tan geçiş yapıyor ve talimatları, MCP sunucularını ve Skills'i korumak istiyorsunuz
    - OpenClaw’un neleri otomatik olarak içe aktardığını ve nelerin yalnızca arşivde kaldığını anlamanız gerekir
summary: Claude Code ve Claude Desktop yerel durumunu önizlemeli bir içe aktarmayla OpenClaw'a taşıyın
title: Claude'dan geçiş
x-i18n:
    generated_at: "2026-04-30T09:29:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b44eda85f3a3714d7d360d04fdd2c99a692fa6491f12e73847c5f08d702a62c
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw, yerel Claude durumunu paketle birlikte gelen Claude migration sağlayıcısı aracılığıyla içe aktarır. Sağlayıcı, durumu değiştirmeden önce her öğeyi önizler, planlarda ve raporlarda gizli bilgileri redakte eder ve uygulamadan önce doğrulanmış bir yedek oluşturur.

<Note>
Onboarding içe aktarımları yeni bir OpenClaw kurulumu gerektirir. Zaten yerel OpenClaw durumunuz varsa önce yapılandırmayı, kimlik bilgilerini, oturumları ve çalışma alanını sıfırlayın veya planı gözden geçirdikten sonra `--overwrite` ile doğrudan `openclaw migrate` kullanın.
</Note>

## İçe aktarmanın iki yolu

<Tabs>
  <Tab title="Onboarding wizard">
    Sihirbaz, yerel Claude durumunu algıladığında Claude seçeneğini sunar.

    ```bash
    openclaw onboard --flow import
    ```

    Ya da belirli bir kaynağı gösterin:

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    Betikli veya tekrarlanabilir çalıştırmalar için `openclaw migrate` kullanın. Tam başvuru için [`openclaw migrate`](/tr/cli/migrate) sayfasına bakın.

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    Belirli bir Claude Code ana dizinini veya proje kökünü içe aktarmak için `--from <path>` ekleyin.

  </Tab>
</Tabs>

## Neler içe aktarılır

<AccordionGroup>
  <Accordion title="Instructions and memory">
    - Proje `CLAUDE.md` ve `.claude/CLAUDE.md` içeriği OpenClaw ajan çalışma alanındaki `AGENTS.md` dosyasına kopyalanır veya eklenir.
    - Kullanıcı `~/.claude/CLAUDE.md` içeriği çalışma alanındaki `USER.md` dosyasına eklenir.

  </Accordion>
  <Accordion title="MCP servers">
    MCP sunucu tanımları, mevcut olduğunda proje `.mcp.json`, Claude Code `~/.claude.json` ve Claude Desktop `claude_desktop_config.json` dosyalarından içe aktarılır.
  </Accordion>
  <Accordion title="Skills and commands">
    - `SKILL.md` dosyası olan Claude skills, OpenClaw çalışma alanı skills dizinine kopyalanır.
    - `.claude/commands/` veya `~/.claude/commands/` altındaki Claude komut Markdown dosyaları, `disable-model-invocation: true` ile OpenClaw skills öğelerine dönüştürülür.

  </Accordion>
</AccordionGroup>

## Neler yalnızca arşiv olarak kalır

Sağlayıcı bunları elle gözden geçirmek üzere migration raporuna kopyalar, ancak canlı OpenClaw yapılandırmasına **yüklemez**:

- Claude hook'ları
- Claude izinleri ve geniş araç izin listeleri
- Claude ortam varsayılanları
- `CLAUDE.local.md`
- `.claude/rules/`
- `.claude/agents/` veya `~/.claude/agents/` altındaki Claude alt ajanları
- Claude Code önbellekleri, planları ve proje geçmişi dizinleri
- Claude Desktop uzantıları ve işletim sisteminde saklanan kimlik bilgileri

OpenClaw hook'ları yürütmeyi, izin listelerine güvenmeyi veya opak OAuth ve Desktop kimlik bilgisi durumunu otomatik olarak çözmeyi reddeder. İhtiyacınız olanları arşivi gözden geçirdikten sonra elle taşıyın.

## Kaynak seçimi

`--from` olmadan OpenClaw, `~/.claude` konumundaki varsayılan Claude Code ana dizinini, örneklenen Claude Code `~/.claude.json` durum dosyasını ve macOS üzerindeki Claude Desktop MCP yapılandırmasını inceler.

`--from` bir proje kökünü gösterdiğinde OpenClaw yalnızca o projenin `CLAUDE.md`, `.claude/settings.json`, `.claude/commands/`, `.claude/skills/` ve `.mcp.json` gibi Claude dosyalarını içe aktarır. Proje kökü içe aktarımı sırasında global Claude ana dizininizi okumaz.

## Önerilen akış

<Steps>
  <Step title="Preview the plan">
    ```bash
    openclaw migrate claude --dry-run
    ```

    Plan; çakışmalar, atlanan öğeler ve iç içe MCP `env` veya `headers` alanlarından redakte edilen hassas değerler dahil olmak üzere değişecek her şeyi listeler.

  </Step>
  <Step title="Apply with backup">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw, uygulamadan önce bir yedek oluşturur ve doğrular.

  </Step>
  <Step title="Run doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/tr/gateway/doctor), içe aktarımdan sonra yapılandırma veya durum sorunlarını denetler.

  </Step>
  <Step title="Restart and verify">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Gateway'in sağlıklı olduğunu ve içe aktarılan talimatlarınızın, MCP sunucularınızın ve skills öğelerinizin yüklendiğini doğrulayın.

  </Step>
</Steps>

## Çakışma yönetimi

Plan çakışmalar bildirdiğinde uygulama devam etmeyi reddeder (hedefte zaten bir dosya veya yapılandırma değeri vardır).

<Warning>
`--overwrite` ile yalnızca mevcut hedefi değiştirmek bilinçli bir tercihse yeniden çalıştırın. Sağlayıcılar, üzerine yazılan dosyalar için migration raporu dizininde yine de öğe düzeyinde yedekler yazabilir.
</Warning>

Yeni bir OpenClaw kurulumu için çakışmalar olağan değildir. Genellikle içe aktarımı, zaten kullanıcı düzenlemeleri olan bir kurulumda yeniden çalıştırdığınızda ortaya çıkarlar.

## Otomasyon için JSON çıktısı

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

`--json` ile ve `--yes` olmadan, uygulama planı yazdırır ve durumu değiştirmez. Bu, CI ve paylaşılan betikler için en güvenli moddur.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Claude state lives outside ~/.claude">
    `--from /actual/path` (CLI) veya `--import-source /actual/path` (onboarding) iletin.
  </Accordion>
  <Accordion title="Onboarding refuses to import on an existing setup">
    Onboarding içe aktarımları yeni bir kurulum gerektirir. Ya durumu sıfırlayıp onboarding'i yeniden çalıştırın ya da doğrudan `openclaw migrate apply claude` kullanın; bu komut `--overwrite` ve açık yedekleme denetimini destekler.
  </Accordion>
  <Accordion title="MCP servers from Claude Desktop did not import">
    Claude Desktop, `claude_desktop_config.json` dosyasını platforma özgü bir yoldan okur. OpenClaw bunu otomatik algılamadıysa `--from` değerini o dosyanın dizinine yönlendirin.
  </Accordion>
  <Accordion title="Claude commands became skills with model invocation disabled">
    Tasarım gereği böyledir. Claude komutları kullanıcı tarafından tetiklenir, bu nedenle OpenClaw bunları `disable-model-invocation: true` ile skills olarak içe aktarır. Ajanın bunları otomatik çağırmasını istiyorsanız her skill'in frontmatter bölümünü düzenleyin.
  </Accordion>
</AccordionGroup>

## İlgili

- [`openclaw migrate`](/tr/cli/migrate): tam CLI başvurusu, plugin sözleşmesi ve JSON şekilleri.
- [Migration kılavuzu](/tr/install/migrating): tüm migration yolları.
- [Hermes'ten migration](/tr/install/migrating-hermes): diğer sistemler arası içe aktarma yolu.
- [Onboarding](/tr/cli/onboard): sihirbaz akışı ve etkileşimsiz bayraklar.
- [Doctor](/tr/gateway/doctor): migration sonrası sağlık denetimi.
- [Ajan çalışma alanı](/tr/concepts/agent-workspace): `AGENTS.md`, `USER.md` ve skills öğelerinin bulunduğu yer.

---
read_when:
    - Hermes'ten geliyorsunuz ve model yapılandırmanızı, istemlerinizi, belleğinizi ve Skills'inizi korumak istiyorsunuz
    - OpenClaw’ın neleri otomatik olarak içe aktardığını ve nelerin yalnızca arşivde kaldığını bilmek istiyorsunuz
    - Temiz, betiklerle yürütülen bir geçiş yoluna ihtiyacınız var (CI, yeni dizüstü bilgisayar, otomasyon)
summary: Hermes'ten OpenClaw'a önizlemeli, geri alınabilir bir içe aktarmayla geçin
title: Hermes'ten geçiş
x-i18n:
    generated_at: "2026-04-30T09:30:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01f8a71e524b31c85864be63e54fc8a2057ecb06a73aac9e6fb107fc0c49757d
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw, Hermes durumunu birlikte gelen bir geçiş sağlayıcısı aracılığıyla içe aktarır. Sağlayıcı, durumu değiştirmeden önce her şeyin önizlemesini gösterir, planlarda ve raporlarda gizli bilgileri redakte eder ve uygulamadan önce doğrulanmış bir yedek oluşturur.

<Note>
İçe aktarma işlemleri yeni bir OpenClaw kurulumu gerektirir. Zaten yerel OpenClaw durumunuz varsa önce yapılandırmayı, kimlik bilgilerini, oturumları ve çalışma alanını sıfırlayın veya planı inceledikten sonra `--overwrite` ile doğrudan `openclaw migrate` kullanın.
</Note>

## İçe aktarmanın iki yolu

<Tabs>
  <Tab title="İlk kurulum sihirbazı">
    En hızlı yol. Sihirbaz, Hermes'i `~/.hermes` konumunda algılar ve uygulamadan önce bir önizleme gösterir.

    ```bash
    openclaw onboard --flow import
    ```

    Ya da belirli bir kaynağı gösterin:

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    Betiklenmiş veya tekrarlanabilir çalıştırmalar için `openclaw migrate` kullanın. Tam başvuru için [`openclaw migrate`](/tr/cli/migrate) bölümüne bakın.

    ```bash
    openclaw migrate hermes --dry-run    # preview only
    openclaw migrate apply hermes --yes  # apply with confirmation skipped
    ```

    Hermes `~/.hermes` dışında bulunuyorsa `--from <path>` ekleyin.

  </Tab>
</Tabs>

## Neler içe aktarılır

<AccordionGroup>
  <Accordion title="Model yapılandırması">
    - Hermes `config.yaml` dosyasından varsayılan model seçimi.
    - `providers` ve `custom_providers` üzerinden yapılandırılmış model sağlayıcıları ve özel OpenAI uyumlu uç noktalar.

  </Accordion>
  <Accordion title="MCP sunucuları">
    `mcp_servers` veya `mcp.servers` üzerinden MCP sunucu tanımları.
  </Accordion>
  <Accordion title="Çalışma alanı dosyaları">
    - `SOUL.md` ve `AGENTS.md`, OpenClaw ajan çalışma alanına kopyalanır.
    - `memories/MEMORY.md` ve `memories/USER.md`, üzerlerine yazılmak yerine eşleşen OpenClaw bellek dosyalarına **eklenir**.

  </Accordion>
  <Accordion title="Bellek yapılandırması">
    OpenClaw dosya belleği için bellek yapılandırma varsayılanları. Honcho gibi harici bellek sağlayıcıları, bilinçli şekilde taşıyabilmeniz için arşiv veya elle inceleme öğeleri olarak kaydedilir.
  </Accordion>
  <Accordion title="Skills">
    `skills/<name>/` altında `SKILL.md` dosyası bulunan Skills, `skills.config` içindeki beceriye özel yapılandırma değerleriyle birlikte kopyalanır.
  </Accordion>
  <Accordion title="API anahtarları (isteğe bağlı)">
    Desteklenen `.env` anahtarlarını içe aktarmak için `--include-secrets` ayarlayın: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`. Bayrak olmadan gizli bilgiler hiçbir zaman kopyalanmaz.
  </Accordion>
</AccordionGroup>

## Yalnızca arşivde kalanlar

Sağlayıcı, elle inceleme için bunları geçiş raporu dizinine kopyalar, ancak canlı OpenClaw yapılandırmasına veya kimlik bilgilerine **yüklemez**:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

OpenClaw, biçimler ve güven varsayımları sistemler arasında farklılaşabileceği için bu durumu otomatik olarak yürütmeyi veya ona güvenmeyi reddeder. Arşivi inceledikten sonra ihtiyacınız olanları elle taşıyın.

## Önerilen akış

<Steps>
  <Step title="Planın önizlemesini gösterin">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    Plan; çakışmalar, atlanan öğeler ve tüm hassas öğeler dahil olmak üzere değişecek her şeyi listeler. Plan çıktısı, iç içe geçmiş gizli bilgi gibi görünen anahtarları redakte eder.

  </Step>
  <Step title="Yedekle uygulayın">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw, uygulamadan önce bir yedek oluşturur ve doğrular. API anahtarlarının içe aktarılması gerekiyorsa `--include-secrets` ekleyin.

  </Step>
  <Step title="Doctor çalıştırın">
    ```bash
    openclaw doctor
    ```

    [Doctor](/tr/gateway/doctor), bekleyen yapılandırma geçişlerini yeniden uygular ve içe aktarma sırasında ortaya çıkan sorunları denetler.

  </Step>
  <Step title="Yeniden başlatın ve doğrulayın">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Gateway'in sağlıklı olduğunu ve içe aktarılan modelinizin, belleğinizin ve skills'in yüklendiğini doğrulayın.

  </Step>
</Steps>

## Çakışma işleme

Plan çakışma bildirdiğinde uygulama devam etmeyi reddeder (hedefte zaten bir dosya veya yapılandırma değeri vardır).

<Warning>
Yalnızca mevcut hedefi değiştirmek bilinçli bir tercih olduğunda `--overwrite` ile yeniden çalıştırın. Sağlayıcılar, geçiş raporu dizininde üzerine yazılan dosyalar için yine de öğe düzeyinde yedekler yazabilir.
</Warning>

Yeni bir OpenClaw kurulumunda çakışmalar olağan değildir. Genellikle içe aktarmayı, zaten kullanıcı düzenlemeleri bulunan bir kurulumda yeniden çalıştırdığınızda görünürler.

Uygulama sırasında bir çakışma ortaya çıkarsa (örneğin bir yapılandırma dosyasında beklenmeyen bir yarış), Hermes kalan bağımlı yapılandırma öğelerini kısmen yazmak yerine `blocked by earlier apply conflict` nedeni ile `skipped` olarak işaretler. Geçiş raporu, özgün çakışmayı çözebilmeniz ve içe aktarmayı yeniden çalıştırabilmeniz için engellenen her öğeyi kaydeder.

## Gizli bilgiler

Gizli bilgiler varsayılan olarak hiçbir zaman içe aktarılmaz.

- Gizli olmayan durumu içe aktarmak için önce `openclaw migrate apply hermes --yes` çalıştırın.
- Desteklenen `.env` anahtarlarının da kopyalanmasını istiyorsanız `--include-secrets` ile yeniden çalıştırın.
- SecretRef tarafından yönetilen kimlik bilgileri için, içe aktarma tamamlandıktan sonra SecretRef kaynağını yapılandırın.

## Otomasyon için JSON çıktısı

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

`--json` ile ve `--yes` olmadan, uygulama planı yazdırır ve durumu değiştirmez. Bu, CI ve paylaşılan betikler için en güvenli moddur.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Uygulama çakışmalarla reddediliyor">
    Plan çıktısını inceleyin. Her çakışma kaynak yolunu ve mevcut hedefi belirtir. Her öğe için atlamaya, hedefi düzenlemeye veya `--overwrite` ile yeniden çalıştırmaya karar verin.
  </Accordion>
  <Accordion title="Hermes ~/.hermes dışında bulunuyor">
    `--from /actual/path` (CLI) veya `--import-source /actual/path` (ilk kurulum) geçirin.
  </Accordion>
  <Accordion title="İlk kurulum mevcut bir kurulumda içe aktarmayı reddediyor">
    İlk kurulum içe aktarmaları yeni bir kurulum gerektirir. Durumu sıfırlayıp yeniden ilk kurulumu yapın ya da `--overwrite` ve açık yedek denetimini destekleyen `openclaw migrate apply hermes` komutunu doğrudan kullanın.
  </Accordion>
  <Accordion title="API anahtarları içe aktarılmadı">
    `--include-secrets` gereklidir ve yalnızca yukarıda listelenen anahtarlar tanınır. `.env` içindeki diğer değişkenler yok sayılır.
  </Accordion>
</AccordionGroup>

## İlgili

- [`openclaw migrate`](/tr/cli/migrate): tam CLI başvurusu, Plugin sözleşmesi ve JSON şekilleri.
- [İlk kurulum](/tr/cli/onboard): sihirbaz akışı ve etkileşimsiz bayraklar.
- [Geçiş](/tr/install/migrating): bir OpenClaw kurulumunu makineler arasında taşıma.
- [Doctor](/tr/gateway/doctor): geçiş sonrası sağlık denetimi.
- [Ajan çalışma alanı](/tr/concepts/agent-workspace): `SOUL.md`, `AGENTS.md` ve bellek dosyalarının bulunduğu yer.

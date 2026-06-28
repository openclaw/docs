---
read_when:
    - Hermes'ten geliyorsunuz ve model yapılandırmanızı, istemlerinizi, belleğinizi ve becerilerinizi korumak istiyorsunuz
    - OpenClaw'ın neleri otomatik olarak içe aktardığını ve nelerin yalnızca arşivde kaldığını bilmek istiyorsunuz
    - Temiz, komut dosyasıyla yönetilen bir geçiş yoluna ihtiyacınız var (CI, yeni dizüstü bilgisayar, otomasyon)
summary: Önizlenen, geri alınabilir bir içe aktarma ile Hermes’ten OpenClaw’a geçin
title: Hermes'ten geçiş
x-i18n:
    generated_at: "2026-06-28T00:44:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f2a2bfea4fd276e3392261e8ecea09d147424636efb200ced1deb86ac0161b5
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw, Hermes durumunu paketlenmiş bir geçiş sağlayıcısı üzerinden içe aktarır. Sağlayıcı, durumu değiştirmeden önce her şeyi önizler, planlarda ve raporlarda sırları redakte eder ve uygulamadan önce doğrulanmış bir yedek oluşturur.

<Note>
İçe aktarımlar yeni bir OpenClaw kurulumu gerektirir. Zaten yerel OpenClaw durumunuz varsa önce yapılandırmayı, kimlik bilgilerini, oturumları ve çalışma alanını sıfırlayın ya da planı inceledikten sonra `--overwrite` ile doğrudan `openclaw migrate` kullanın.
</Note>

## İçe aktarmanın iki yolu

<Tabs>
  <Tab title="İlk kurulum sihirbazı">
    En hızlı yol. Sihirbaz Hermes'i `~/.hermes` konumunda algılar ve uygulamadan önce bir önizleme gösterir.

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
    - `providers` ve `custom_providers` içinden yapılandırılmış model sağlayıcıları ve özel OpenAI uyumlu uç noktalar.

  </Accordion>
  <Accordion title="MCP sunucuları">
    `mcp_servers` veya `mcp.servers` içinden MCP sunucu tanımları.
  </Accordion>
  <Accordion title="Çalışma alanı dosyaları">
    - `SOUL.md` ve `AGENTS.md`, OpenClaw ajan çalışma alanına kopyalanır.
    - `memories/MEMORY.md` ve `memories/USER.md`, üzerlerine yazılmak yerine eşleşen OpenClaw bellek dosyalarına **eklenir**.

  </Accordion>
  <Accordion title="Bellek yapılandırması">
    OpenClaw dosya belleği için bellek yapılandırması varsayılanları. Honcho gibi harici bellek sağlayıcıları, bilinçli şekilde taşıyabilmeniz için arşiv veya elle inceleme öğeleri olarak kaydedilir.
  </Accordion>
  <Accordion title="Skills">
    `skills/<name>/` altında bir `SKILL.md` dosyası bulunan Skills, `skills.config` içindeki Skill başına yapılandırma değerleriyle birlikte kopyalanır.
  </Accordion>
  <Accordion title="Kimlik doğrulama bilgileri">
    Etkileşimli `openclaw migrate`, kimlik doğrulama bilgilerini içe aktarmadan önce sorar ve varsayılan olarak evet seçilidir. Kabul edilen içe aktarımlar arasında OpenCode `auth.json` dosyasından OpenCode OpenAI OAuth kimlik bilgileri, OpenCode `auth.json` dosyasından OpenCode ve GitHub Copilot girdileri ve [desteklenen `.env` anahtarları](/tr/cli/migrate#supported-env-keys) yer alır. Hermes `auth.json` OAuth girdileri eski durumdur ve canlı kimlik doğrulamaya içe aktarılmak yerine elle yeniden kimlik doğrulama/doctor işi olarak gösterilir. Etkileşimsiz `openclaw migrate` kimlik bilgisi içe aktarımı için `--include-secrets`, bunu atlamak için `--no-auth-credentials` veya ilk kurulum sihirbazından içe aktarırken `--import-secrets` kullanın.
  </Accordion>
</AccordionGroup>

## Yalnızca arşivde kalanlar

Sağlayıcı bunları elle inceleme için geçiş raporu dizinine kopyalar, ancak canlı OpenClaw yapılandırmasına veya kimlik bilgilerine **yüklemez**:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

Biçimler ve güven varsayımları sistemler arasında değişebileceği için OpenClaw bu durumu otomatik olarak yürütmeyi veya ona güvenmeyi reddeder. Arşivi inceledikten sonra ihtiyacınız olanları elle taşıyın.

## Önerilen akış

<Steps>
  <Step title="Planı önizleyin">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    Plan, çakışmalar, atlanan öğeler ve hassas öğeler dahil değişecek her şeyi listeler. Plan çıktısı, iç içe geçmiş sır gibi görünen anahtarları redakte eder.

  </Step>
  <Step title="Yedekle uygulayın">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw uygulamadan önce bir yedek oluşturur ve doğrular. Bu etkileşimsiz örnek, gizli olmayan durumu içe aktarır. Kimlik bilgisi istemini yanıtlamak için `--yes` olmadan çalıştırın veya gözetimsiz çalıştırmalarda desteklenen kimlik bilgilerini dahil etmek için `--include-secrets` ekleyin.

  </Step>
  <Step title="Doctor çalıştırın">
    ```bash
    openclaw doctor
    ```

    [Doctor](/tr/gateway/doctor), bekleyen yapılandırma geçişlerini yeniden uygular ve içe aktarma sırasında ortaya çıkan sorunları kontrol eder.

  </Step>
  <Step title="Yeniden başlatın ve doğrulayın">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Gateway'in sağlıklı olduğunu ve içe aktarılan modelinizin, belleğinizin ve Skills'in yüklendiğini doğrulayın.

  </Step>
</Steps>

## Çakışma işleme

Plan çakışmalar bildirdiğinde (hedefte zaten bir dosya veya yapılandırma değeri varsa) uygulama devam etmeyi reddeder.

<Warning>
`--overwrite` ile yeniden çalıştırmayı yalnızca mevcut hedefi değiştirmek bilinçli bir tercihinizse yapın. Sağlayıcılar, geçiş raporu dizininde üzerine yazılan dosyalar için yine de öğe düzeyinde yedekler yazabilir.
</Warning>

Yeni bir OpenClaw kurulumu için çakışmalar olağan değildir. Genellikle içe aktarmayı zaten kullanıcı düzenlemeleri bulunan bir kurulumda yeniden çalıştırdığınızda görünürler.

Uygulama sırasında ortada bir çakışma ortaya çıkarsa (örneğin, bir yapılandırma dosyasında beklenmeyen bir yarış durumu), Hermes kalan bağımlı yapılandırma öğelerini kısmen yazmak yerine `blocked by earlier apply conflict` nedeniyle `skipped` olarak işaretler. Geçiş raporu, özgün çakışmayı çözebilmeniz ve içe aktarmayı yeniden çalıştırabilmeniz için engellenen her öğeyi kaydeder.

## Sırlar

Etkileşimli `openclaw migrate`, algılanan kimlik doğrulama bilgilerinin içe aktarılıp aktarılmayacağını sorar ve varsayılan olarak evet seçilidir.

- İstemi kabul etmek, OpenCode `auth.json` dosyasından OpenCode OpenAI OAuth kimlik bilgilerini, OpenCode `auth.json` dosyasından OpenCode ve GitHub Copilot girdilerini ve [desteklenen `.env` anahtarlarını](/tr/cli/migrate#supported-env-keys) içe aktarır. Hermes `auth.json` OAuth girdileri, elle OpenAI yeniden kimlik doğrulaması veya doctor onarımı için raporlanır.
- Yalnızca gizli olmayan durumu içe aktarmak için `--no-auth-credentials` kullanın veya istemde hayırı seçin.
- `--yes` ile gözetimsiz çalıştırırken `--include-secrets` kullanın.
- İlk kurulum sihirbazından kimlik bilgilerini içe aktarırken `--import-secrets` kullanın.
- SecretRef tarafından yönetilen kimlik bilgileri için, içe aktarma tamamlandıktan sonra SecretRef kaynağını yapılandırın.

## Otomasyon için JSON çıktısı

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

`--json` kullanıldığında ve `--yes` verilmediğinde, uygulama planı yazdırır ve durumu değiştirmez. Bu, CI ve paylaşılan betikler için en güvenli moddur.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Uygulama çakışmalar nedeniyle reddediliyor">
    Plan çıktısını inceleyin. Her çakışma kaynak yolunu ve mevcut hedefi belirtir. Öğeye göre atlamaya, hedefi düzenlemeye veya `--overwrite` ile yeniden çalıştırmaya karar verin.
  </Accordion>
  <Accordion title="Hermes ~/.hermes dışında bulunuyor">
    `--from /actual/path` (CLI) veya `--import-source /actual/path` (ilk kurulum) geçirin.
  </Accordion>
  <Accordion title="İlk kurulum mevcut bir kurulumda içe aktarmayı reddediyor">
    İlk kurulum içe aktarımları yeni bir kurulum gerektirir. Ya durumu sıfırlayıp ilk kurulumu yeniden yapın ya da `--overwrite` ve açık yedek kontrolünü destekleyen `openclaw migrate apply hermes` komutunu doğrudan kullanın.
  </Accordion>
  <Accordion title="API anahtarları içe aktarılmadı">
    Etkileşimli `openclaw migrate`, API anahtarlarını yalnızca kimlik bilgisi istemini kabul ettiğinizde içe aktarır. Etkileşimsiz `--yes` çalıştırmaları `--include-secrets` gerektirir; ilk kurulum içe aktarımları `--import-secrets` gerektirir. Yalnızca [desteklenen `.env` anahtarları](/tr/cli/migrate#supported-env-keys) tanınır; `.env` içindeki diğer değişkenler yok sayılır.
  </Accordion>
</AccordionGroup>

## İlgili

- [`openclaw migrate`](/tr/cli/migrate): tam CLI başvurusu, Plugin sözleşmesi ve JSON şekilleri.
- [İlk kurulum](/tr/cli/onboard): sihirbaz akışı ve etkileşimsiz bayraklar.
- [Geçiş](/tr/install/migrating): bir OpenClaw kurulumunu makineler arasında taşıma.
- [Doctor](/tr/gateway/doctor): geçiş sonrası sağlık kontrolü.
- [Ajan çalışma alanı](/tr/concepts/agent-workspace): `SOUL.md`, `AGENTS.md` ve bellek dosyalarının bulunduğu yer.

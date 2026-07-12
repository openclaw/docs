---
read_when:
    - Hermes'ten geliyorsunuz ve model yapılandırmanızı, istemlerinizi, belleğinizi ve Skills'i korumak istiyorsunuz
    - OpenClaw'ın neleri otomatik olarak içe aktardığını ve nelerin yalnızca arşivde kaldığını öğrenmek istiyorsunuz
    - Temiz, betiklerle yönetilen bir geçiş yoluna ihtiyacınız var (CI, yeni dizüstü bilgisayar, otomasyon)
summary: Ön izlemesi yapılabilen, geri alınabilir bir içe aktarmayla Hermes'ten OpenClaw'a geçin
title: Hermes'ten Geçiş
x-i18n:
    generated_at: "2026-07-12T12:22:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd9012efb084c00dfe55bb841fea3cc6908c08b528492f1552bf226f125961e6
    source_path: install/migrating-hermes.md
    workflow: 16
---

Paketle birlikte sunulan Hermes geçiş sağlayıcısı, `~/.hermes` konumundaki durumu algılar, uygulamadan önce her değişikliğin önizlemesini gösterir, planlarda ve raporlarda gizli bilgileri maskeler ve herhangi bir şeye dokunmadan önce doğrulanmış bir OpenClaw yedeği oluşturur.

<Note>
İçe aktarma işlemleri yeni bir OpenClaw kurulumu gerektirir. Zaten yerel OpenClaw durumunuz varsa önce yapılandırmayı, kimlik bilgilerini, oturumları ve çalışma alanını sıfırlayın ya da planı inceledikten sonra doğrudan `openclaw migrate apply hermes` komutunu `--overwrite` ile kullanın.
</Note>

## İçe aktarmanın iki yolu

<Tabs>
  <Tab title="İlk kurulum sihirbazı">
    `~/.hermes` konumundaki Hermes'i algılar ve uygulamadan önce bir önizleme gösterir.

    ```bash
    openclaw onboard --flow import
    ```

    Alternatif olarak belirli bir kaynağı belirtin:

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    Betiklerle çalıştırılan veya tekrarlanabilir işlemler için `openclaw migrate` kullanın. Tam başvuru için [`openclaw migrate`](/tr/cli/migrate) sayfasına bakın.

    ```bash
    openclaw migrate hermes --dry-run    # yalnızca önizleme
    openclaw migrate apply hermes --yes  # onay atlanarak uygula
    ```

    Hermes `~/.hermes` dışında bulunuyorsa `--from <path>` ekleyin.

  </Tab>
</Tabs>

## İçe aktarılanlar

<AccordionGroup>
  <Accordion title="Model yapılandırması">
    - Hermes `config.yaml` dosyasındaki varsayılan model seçimi.
    - `providers` ve `custom_providers` içindeki yapılandırılmış model sağlayıcıları ve özel OpenAI uyumlu uç noktalar.

  </Accordion>
  <Accordion title="MCP sunucuları">
    `mcp_servers` veya `mcp.servers` içindeki MCP sunucusu tanımları.
  </Accordion>
  <Accordion title="Çalışma alanı dosyaları">
    - `SOUL.md` ve `AGENTS.md`, OpenClaw aracısının çalışma alanına kopyalanır.
    - `memories/MEMORY.md` ve `memories/USER.md`, üzerlerine yazılmak yerine eşleşen OpenClaw bellek dosyalarının sonuna **eklenir**.

  </Accordion>
  <Accordion title="Bellek yapılandırması">
    OpenClaw dosya belleği için bellek yapılandırması varsayılanları. Honcho gibi harici bellek sağlayıcıları, bilinçli olarak taşıyabilmeniz için arşiv veya manuel inceleme öğeleri olarak kaydedilir.
  </Accordion>
  <Accordion title="Skills">
    `skills/<name>/` altında `SKILL.md` dosyası bulunan Skills, `skills.config` içindeki beceriye özgü yapılandırma değerleriyle birlikte kopyalanır.
  </Accordion>
  <Accordion title="Kimlik doğrulama bilgileri">
    Etkileşimli `openclaw migrate`, kimlik doğrulama bilgilerini içe aktarmadan önce sorar ve varsayılan olarak evet seçilidir. Kabul edildiğinde OpenCode'un `auth.json` dosyasındaki OpenCode OpenAI OAuth ve GitHub Copilot girdileri ile [desteklenen Hermes `.env` anahtarları](/tr/cli/migrate#supported-env-keys) içe aktarılır. Hermes'in kendi `auth.json` dosyasındaki OAuth girdileri eski durumdur: canlı kimlik doğrulamaya aktarılmak yerine manuel olarak yeniden kimlik doğrulama veya doctor işlemi gerektiren bir öğe olarak gösterilir. Etkileşimsiz bir çalıştırmada kimlik bilgilerini içe aktarmak için `--include-secrets`, kimlik bilgisi içe aktarımını tamamen atlamak için `--no-auth-credentials` ya da ilk kurulum sihirbazının `--import-secrets` bayrağını kullanın.
  </Accordion>
</AccordionGroup>

## Yalnızca arşivde kalanlar

Sağlayıcı, manuel inceleme için aşağıdakileri geçiş raporu dizinine kopyalar ancak bunları canlı OpenClaw yapılandırmasına veya kimlik bilgilerine **yüklemez**:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

Biçimler ve güven varsayımları sistemler arasında farklılaşabileceğinden OpenClaw bu durumu otomatik olarak yürütmeyi veya güvenilir kabul etmeyi reddeder. Arşivi inceledikten sonra ihtiyaç duyduklarınızı elle taşıyın.

## Önerilen akış

<Steps>
  <Step title="Planı önizleyin">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    Plan; çakışmalar, atlanan öğeler ve hassas öğeler dâhil değişecek her şeyi listeler. İç içe geçmiş ve gizli bilgiye benzeyen anahtarlar çıktıda maskelenir.

  </Step>
  <Step title="Yedek alarak uygulayın">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw, uygulamadan önce bir yedek oluşturur ve doğrular. Bu etkileşimsiz örnek yalnızca gizli olmayan durumu içe aktarır. Kimlik bilgileri sorusunu etkileşimli olarak yanıtlamak için `--yes` olmadan çalıştırın veya gözetimsiz bir çalıştırmada desteklenen kimlik bilgilerini dâhil etmek için `--include-secrets` ekleyin.

  </Step>
  <Step title="Doctor'ı çalıştırın">
    ```bash
    openclaw doctor
    ```

    [Doctor](/tr/gateway/doctor), bekleyen yapılandırma geçişlerini yeniden uygular ve içe aktarma sırasında oluşan sorunları denetler.

  </Step>
  <Step title="Yeniden başlatın ve doğrulayın">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Gateway'in sağlıklı olduğunu ve içe aktarılan modelinizin, belleğinizin ve Skills'in yüklendiğini doğrulayın.

  </Step>
</Steps>

## Çakışmaların işlenmesi

Plan çakışma bildirdiğinde (hedefte zaten bir dosya veya yapılandırma değeri bulunduğunda) uygulama işlemi devam etmeyi reddeder.

<Warning>
Yalnızca mevcut hedefi bilerek değiştirmek istediğinizde `--overwrite` ile yeniden çalıştırın. Sağlayıcılar, üzerine yazılan dosyalar için geçiş raporu dizinine öğe düzeyinde yedekler yazmaya devam edebilir.
</Warning>

Yeni bir kurulumda çakışmalar olağan dışıdır. Genellikle içe aktarma işlemini kullanıcı düzenlemeleri içeren bir kurulumda yeniden çalıştırdığınızda ortaya çıkarlar.

Uygulama sırasında bir çakışma ortaya çıkarsa (örneğin bir yapılandırma dosyasında beklenmeyen bir yarış durumu), Hermes kalan bağımlı yapılandırma öğelerini kısmen yazmak yerine `blocked by earlier apply conflict` gerekçesiyle `skipped` olarak işaretler. Geçiş raporu, asıl çakışmayı çözüp içe aktarma işlemini yeniden çalıştırabilmeniz için engellenen her öğeyi kaydeder.

## Gizli bilgiler

Etkileşimli `openclaw migrate`, algılanan kimlik doğrulama bilgilerini içe aktarmak isteyip istemediğinizi sorar ve varsayılan olarak evet seçilidir.

- Kabul edildiğinde OpenCode'un `auth.json` dosyasındaki OpenCode OpenAI OAuth ve GitHub Copilot girdileri ile [desteklenen `.env` anahtarları](/tr/cli/migrate#supported-env-keys) içe aktarılır. Hermes'in kendi `auth.json` dosyasındaki OAuth girdileri ise manuel OpenAI yeniden kimlik doğrulaması veya doctor onarımı için bildirilir.
- Yalnızca gizli olmayan durumu içe aktarmak için `--no-auth-credentials` kullanın veya istemde hayır yanıtını verin.
- Gözetimsiz bir `--yes` çalıştırmasında kimlik bilgilerini içe aktarmak için `--include-secrets` kullanın.
- Sihirbazdan kimlik bilgilerini içe aktarmak için ilk kurulum sihirbazının `--import-secrets` bayrağını kullanın.

## Otomasyon için JSON çıktısı

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

`--json` kullanıldığında ve `--yes` verilmediğinde uygulama işlemi planı yazdırır ve durumu değiştirmez; bu, CI ve paylaşılan betikler için en güvenli moddur.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Uygulama çakışmalar nedeniyle reddediliyor">
    Plan çıktısını inceleyin. Her çakışma kaynak yolunu ve mevcut hedefi belirtir. Her öğe için atlama, hedefi düzenleme veya `--overwrite` ile yeniden çalıştırma seçeneklerinden hangisini uygulayacağınıza karar verin.
  </Accordion>
  <Accordion title="Hermes ~/.hermes dışında bulunuyor">
    `--from /actual/path` (CLI) veya `--import-source /actual/path` (ilk kurulum) parametresini geçirin.
  </Accordion>
  <Accordion title="İlk kurulum, mevcut bir kuruluma içe aktarmayı reddediyor">
    İlk kurulum üzerinden içe aktarma yeni bir kurulum gerektirir. Durumu sıfırlayıp ilk kurulumu yeniden yapın veya `--overwrite` ve açık yedekleme denetimini destekleyen `openclaw migrate apply hermes` komutunu doğrudan kullanın.
  </Accordion>
  <Accordion title="API anahtarları içe aktarılmadı">
    Etkileşimli `openclaw migrate`, API anahtarlarını yalnızca kimlik bilgileri istemini kabul ettiğinizde içe aktarır. Etkileşimsiz `--yes` çalıştırmaları için `--include-secrets`, ilk kurulum üzerinden içe aktarma için `--import-secrets` gerekir. Yalnızca [desteklenen `.env` anahtarları](/tr/cli/migrate#supported-env-keys) tanınır; diğer `.env` değişkenleri yok sayılır.
  </Accordion>
</AccordionGroup>

## İlgili içerikler

- [`openclaw migrate`](/tr/cli/migrate): tam CLI başvurusu, Plugin sözleşmesi ve JSON biçimleri.
- [İlk kurulum](/tr/cli/onboard): sihirbaz akışı ve etkileşimsiz bayraklar.
- [Taşıma](/tr/install/migrating): bir OpenClaw kurulumunu makineler arasında taşıma.
- [Doctor](/tr/gateway/doctor): geçiş sonrası durum denetimi.
- [Aracı çalışma alanı](/tr/concepts/agent-workspace): `SOUL.md`, `AGENTS.md` ve bellek dosyalarının bulunduğu yer.

---
read_when:
    - Yeni kurulum, başlangıç yapılandırmasında takılma veya ilk çalıştırma hataları
    - Kimlik doğrulama ve sağlayıcı aboneliklerini seçme
    - docs.openclaw.ai'ye erişilemiyor, kontrol paneli açılamıyor, kurulum takılı kaldı
sidebarTitle: First-run FAQ
summary: 'SSS: hızlı başlangıç ve ilk çalıştırma kurulumu — kurulum, ilk kullanıma hazırlama, kimlik doğrulama, abonelikler, başlangıçtaki hatalar'
title: 'SSS: ilk çalıştırma kurulumu'
x-i18n:
    generated_at: "2026-05-12T00:58:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24ce8cda091fd7d1bdcb405d421a1a3cabb134c3cc36b42f11b9b3f97782794b
    source_path: help/faq-first-run.md
    workflow: 16
---

  Hızlı başlangıç ve ilk çalıştırma SSS. Günlük işlemler, modeller, kimlik doğrulama, oturumlar
  ve sorun giderme için ana [SSS](/tr/help/faq) bölümüne bakın.

  ## Hızlı başlangıç ve ilk çalıştırma kurulumu

  <AccordionGroup>
  <Accordion title="Takıldım, takılmayı aşmanın en hızlı yolu">
    **Makinenizi görebilen** yerel bir AI agent kullanın. Bu, Discord’da sormaktan çok daha etkilidir,
    çünkü çoğu "takıldım" durumu **yerel yapılandırma veya ortam sorunlarıdır** ve uzaktaki
    yardımcılar bunları inceleyemez.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Bu araçlar depoyu okuyabilir, komut çalıştırabilir, günlükleri inceleyebilir ve makine düzeyindeki
    kurulumunuzu (PATH, servisler, izinler, kimlik doğrulama dosyaları) düzeltmeye yardımcı olabilir.
    Onlara hacklenebilir (git) kurulum üzerinden **tam kaynak checkout** sağlayın:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Bu, OpenClaw’ı **bir git checkout’tan** kurar; böylece agent kodu + dokümanları okuyabilir ve
    çalıştırdığınız tam sürüm hakkında akıl yürütebilir. Daha sonra yükleyiciyi
    `--install-method git` olmadan yeniden çalıştırarak her zaman kararlı sürüme dönebilirsiniz.

    İpucu: agent’tan düzeltmeyi **planlamasını ve denetlemesini** isteyin (adım adım), sonra yalnızca
    gerekli komutları çalıştırın. Bu, değişiklikleri küçük ve denetlenmesi daha kolay tutar.

    Gerçek bir hata veya düzeltme bulursanız lütfen bir GitHub issue açın veya PR gönderin:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Şu komutlarla başlayın (yardım isterken çıktıları paylaşın):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Ne yaptıkları:

    - `openclaw status`: Gateway/agent sağlığı + temel yapılandırmanın hızlı özeti.
    - `openclaw models status`: sağlayıcı kimlik doğrulaması + model kullanılabilirliğini denetler.
    - `openclaw doctor`: yaygın yapılandırma/durum sorunlarını doğrular ve onarır.

    Diğer yararlı CLI denetimleri: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Hızlı hata ayıklama döngüsü: [Bir şey bozuksa ilk 60 saniye](/tr/help/faq#first-60-seconds-if-something-is-broken).
    Kurulum dokümanları: [Kurulum](/tr/install), [Yükleyici bayrakları](/tr/install/installer), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="Heartbeat atlamaya devam ediyor. Atlama nedenleri ne anlama geliyor?">
    Yaygın heartbeat atlama nedenleri:

    - `quiet-hours`: yapılandırılmış etkin saatler penceresinin dışında
    - `empty-heartbeat-file`: `HEARTBEAT.md` var ama yalnızca boş/yalnızca başlıklı iskelet içeriyor
    - `no-tasks-due`: `HEARTBEAT.md` görev modu etkin ama görev aralıklarının hiçbiri henüz gelmedi
    - `alerts-disabled`: tüm heartbeat görünürlüğü devre dışı (`showOk`, `showAlerts` ve `useIndicator` kapalı)

    Görev modunda, vadesi gelen zaman damgaları yalnızca gerçek bir heartbeat çalıştırması
    tamamlandıktan sonra ilerletilir. Atlanan çalıştırmalar görevleri tamamlandı olarak işaretlemez.

    Dokümanlar: [Heartbeat](/tr/gateway/heartbeat), [Otomasyon](/tr/automation).

  </Accordion>

  <Accordion title="OpenClaw’ı kurmak ve ayarlamak için önerilen yol">
    Depo, kaynaktan çalıştırmayı ve onboarding kullanmayı önerir:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Sihirbaz UI varlıklarını otomatik olarak da derleyebilir. Onboarding sonrasında Gateway’i genellikle **18789** portunda çalıştırırsınız.

    Kaynaktan (katkıda bulunanlar/geliştiriciler):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Henüz global kurulumunuz yoksa `pnpm openclaw onboard` ile çalıştırın.

  </Accordion>

  <Accordion title="Onboarding sonrasında dashboard’u nasıl açarım?">
    Sihirbaz, onboarding’den hemen sonra tarayıcınızı temiz (token içermeyen) bir dashboard URL’siyle açar ve bağlantıyı özette de yazdırır. Bu sekmeyi açık tutun; açılmadıysa yazdırılan URL’yi aynı makinede kopyalayıp yapıştırın.
  </Accordion>

  <Accordion title="Dashboard’da localhost ile remote için kimlik doğrulamayı nasıl yaparım?">
    **Localhost (aynı makine):**

    - `http://127.0.0.1:18789/` adresini açın.
    - Paylaşılan gizli anahtar kimlik doğrulaması isterse, yapılandırılmış token’ı veya parolayı Control UI ayarlarına yapıştırın.
    - Token kaynağı: `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`).
    - Parola kaynağı: `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`).
    - Henüz paylaşılan gizli anahtar yapılandırılmadıysa `openclaw doctor --generate-gateway-token` ile bir token oluşturun.

    **Localhost üzerinde değilse:**

    - **Tailscale Serve** (önerilir): bind’i loopback’te tutun, `openclaw gateway --tailscale serve` çalıştırın, `https://<magicdns>/` adresini açın. `gateway.auth.allowTailscale` `true` ise kimlik başlıkları Control UI/WebSocket kimlik doğrulamasını karşılar (yapıştırılmış paylaşılan gizli anahtar gerekmez, güvenilir gateway host varsayılır); HTTP API’leri, özel giriş için bilinçli olarak `none` veya trusted-proxy HTTP kimlik doğrulaması kullanmadığınız sürece yine de paylaşılan gizli anahtar kimlik doğrulaması gerektirir.
      Aynı istemciden gelen hatalı eşzamanlı Serve kimlik doğrulama denemeleri, başarısız kimlik doğrulama sınırlayıcısı bunları kaydetmeden önce sıralanır; bu nedenle ikinci hatalı yeniden deneme zaten `retry later` gösterebilir.
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` komutunu çalıştırın (veya parola kimlik doğrulamasını yapılandırın), `http://<tailscale-ip>:18789/` adresini açın, ardından eşleşen paylaşılan gizli anahtarı dashboard ayarlarına yapıştırın.
    - **Kimlik farkındalıklı reverse proxy**: Gateway’i güvenilir bir proxy’nin arkasında tutun, `gateway.auth.mode: "trusted-proxy"` yapılandırın, ardından proxy URL’sini açın. Aynı host üzerindeki loopback proxy’leri açıkça `gateway.auth.trustedProxy.allowLoopback = true` gerektirir.
    - **SSH tüneli**: `ssh -N -L 18789:127.0.0.1:18789 user@host` ardından `http://127.0.0.1:18789/` adresini açın. Paylaşılan gizli anahtar kimlik doğrulaması tünel üzerinden de geçerlidir; istenirse yapılandırılmış token’ı veya parolayı yapıştırın.

    Bind modları ve kimlik doğrulama ayrıntıları için [Dashboard](/tr/web/dashboard) ve [Web yüzeyleri](/tr/web) bölümlerine bakın.

  </Accordion>

  <Accordion title="Sohbet onayları için neden iki exec onay yapılandırması var?">
    Farklı katmanları kontrol ederler:

    - `approvals.exec`: onay istemlerini sohbet hedeflerine iletir
    - `channels.<channel>.execApprovals`: bu kanalın exec onayları için yerel onay istemcisi gibi davranmasını sağlar

    Host exec ilkesi hâlâ gerçek onay kapısıdır. Sohbet yapılandırması yalnızca onay
    istemlerinin nerede görüneceğini ve kişilerin bunları nasıl yanıtlayabileceğini kontrol eder.

    Çoğu kurulumda ikisine birden **ihtiyacınız yoktur**:

    - Sohbet zaten komutları ve yanıtları destekliyorsa, aynı sohbet `/approve` paylaşılan yol üzerinden çalışır.
    - Desteklenen yerel bir kanal onaylayanları güvenli biçimde çıkarabiliyorsa, `channels.<channel>.execApprovals.enabled` ayarlanmamış veya `"auto"` olduğunda OpenClaw artık önce DM yerel onayları otomatik etkinleştirir.
    - Yerel onay kartları/düğmeleri mevcut olduğunda birincil yol bu yerel UI’dır; agent, yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın tek yol olduğunu söylüyorsa manuel `/approve` komutu eklemelidir.
    - `approvals.exec` yalnızca istemlerin başka sohbetlere veya açık operasyon odalarına da iletilmesi gerektiğinde kullanın.
    - `channels.<channel>.execApprovals.target: "channel"` veya `"both"` yalnızca onay istemlerinin açıkça kaynak odaya/konuya geri gönderilmesini istediğinizde kullanın.
    - Plugin onayları yine ayrıdır: varsayılan olarak aynı sohbet `/approve` kullanırlar, isteğe bağlı `approvals.plugin` iletimi vardır ve yalnızca bazı yerel kanallar bunun üzerine plugin-onayı-yerel işlemeyi sürdürür.

    Kısa sürüm: iletme yönlendirme içindir, yerel istemci yapılandırması daha zengin kanala özgü UX içindir.
    Bkz. [Exec Onayları](/tr/tools/exec-approvals).

  </Accordion>

  <Accordion title="Hangi runtime’a ihtiyacım var?">
    Node **>= 22** gereklidir. `pnpm` önerilir. Gateway için Bun **önerilmez**.
  </Accordion>

  <Accordion title="Raspberry Pi üzerinde çalışır mı?">
    Evet. Gateway hafiftir; dokümanlar kişisel kullanım için **512MB-1GB RAM**, **1 çekirdek** ve yaklaşık **500MB**
    diskin yeterli olduğunu belirtir ve **Raspberry Pi 4’ün çalıştırabildiğini** not eder.

    Ek boşluk istiyorsanız (günlükler, medya, diğer servisler), **2GB önerilir**, ancak bu
    kesin bir minimum değildir.

    İpucu: küçük bir Pi/VPS Gateway’i barındırabilir; yerel ekran/kamera/canvas veya komut yürütme için
    dizüstü bilgisayarınızda/telefonunuzda **node’lar** eşleyebilirsiniz. Bkz. [Node’lar](/tr/nodes).

  </Accordion>

  <Accordion title="Raspberry Pi kurulumları için ipuçları var mı?">
    Kısa sürüm: çalışır, ancak pürüzler bekleyin.

    - **64 bit** işletim sistemi kullanın ve Node >= 22 tutun.
    - Günlükleri görebilmek ve hızlı güncelleyebilmek için **hacklenebilir (git) kurulumu** tercih edin.
    - Kanallar/skills olmadan başlayın, sonra bunları teker teker ekleyin.
    - Tuhaf ikili dosya sorunlarıyla karşılaşırsanız bu genellikle bir **ARM uyumluluğu** problemidir.

    Dokümanlar: [Linux](/tr/platforms/linux), [Kurulum](/tr/install).

  </Accordion>

  <Accordion title="Wake up my friend aşamasında takıldı / onboarding hatch olmuyor. Şimdi ne yapmalıyım?">
    Bu ekran Gateway’in erişilebilir ve kimlik doğrulaması yapılmış olmasına bağlıdır. TUI ayrıca ilk hatch sırasında
    "Wake up, my friend!" ifadesini otomatik gönderir. Bu satırı **yanıt olmadan**
    görürseniz ve token’lar 0’da kalırsa agent hiç çalışmamıştır.

    1. Gateway’i yeniden başlatın:

    ```bash
    openclaw gateway restart
    ```

    2. Durumu + kimlik doğrulamayı denetleyin:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Hâlâ takılıyorsa şunu çalıştırın:

    ```bash
    openclaw doctor
    ```

    Gateway remote ise tünel/Tailscale bağlantısının açık olduğundan ve UI’ın doğru Gateway’e
    yönlendirildiğinden emin olun. Bkz. [Remote erişim](/tr/gateway/remote).

  </Accordion>

  <Accordion title="Onboarding’i yeniden yapmadan kurulumumu yeni bir makineye (Mac mini) taşıyabilir miyim?">
    Evet. **Durum dizinini** ve **çalışma alanını** kopyalayın, ardından Doctor’ı bir kez çalıştırın. Bu,
    **her iki** konumu da kopyaladığınız sürece botunuzu "tamamen aynı" tutar (bellek, oturum geçmişi, kimlik doğrulama ve kanal
    durumu):

    1. Yeni makinede OpenClaw’ı kurun.
    2. Eski makineden `$OPENCLAW_STATE_DIR` (varsayılan: `~/.openclaw`) kopyalayın.
    3. Çalışma alanınızı kopyalayın (varsayılan: `~/.openclaw/workspace`).
    4. `openclaw doctor` çalıştırın ve Gateway servisini yeniden başlatın.

    Bu; yapılandırmayı, kimlik doğrulama profillerini, WhatsApp kimlik bilgilerini, oturumları ve belleği korur. Remote
    moddaysanız gateway host’un oturum deposuna ve çalışma alanına sahip olduğunu unutmayın.

    **Önemli:** yalnızca çalışma alanınızı GitHub’a commit/push ederseniz **bellek + bootstrap dosyalarını**
    yedeklemiş olursunuz, ancak oturum geçmişini veya kimlik doğrulamayı **yedeklemiş olmazsınız**. Bunlar
    `~/.openclaw/` altında yaşar (örneğin `~/.openclaw/agents/<agentId>/sessions/`).

    İlgili: [Taşıma](/tr/install/migrating), [Diskte şeylerin bulunduğu yer](/tr/help/faq#where-things-live-on-disk),
    [Agent çalışma alanı](/tr/concepts/agent-workspace), [Doctor](/tr/gateway/doctor),
    [Remote mod](/tr/gateway/remote).

  </Accordion>

  <Accordion title="En son sürümde nelerin yeni olduğunu nerede görebilirim?">
    GitHub changelog’unu kontrol edin:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    En yeni girdiler en üsttedir. Üst bölüm **Unreleased** olarak işaretliyse, bir sonraki tarihli
    bölüm en son yayımlanmış sürümdür. Girdiler **Öne Çıkanlar**, **Değişiklikler** ve
    **Düzeltmeler** altında gruplandırılır (gerektiğinde dokümanlar/diğer bölümlerle birlikte).

  </Accordion>

  <Accordion title="docs.openclaw.ai erişilemiyor (SSL hatası)">
    Bazı Comcast/Xfinity bağlantıları, Xfinity Advanced Security üzerinden `docs.openclaw.ai` adresini yanlışlıkla engeller.
    Bunu devre dışı bırakın veya `docs.openclaw.ai` adresini allowlist’e alın, ardından yeniden deneyin.
    Engelin kaldırılmasına yardımcı olmak için lütfen buradan bildirin: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Siteye hâlâ ulaşamıyorsanız dokümanlar GitHub’da yansıtılmıştır:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Kararlı ve beta arasındaki fark">
    **Kararlı** ve **beta**, ayrı kod hatları değil, **npm dist-tag** değerleridir:

    - `latest` = kararlı
    - `beta` = test için erken derleme

    Genellikle kararlı bir sürüm önce **beta** olarak yayınlanır, ardından açık bir
    yükseltme adımı aynı sürümü `latest` etiketine taşır. Bakımcılar gerektiğinde
    doğrudan `latest` olarak da yayınlayabilir. Bu nedenle beta ve kararlı,
    yükseltmeden sonra **aynı sürümü** gösterebilir.

    Nelerin değiştiğine bakın:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Tek satırlık kurulum komutları ve beta ile dev arasındaki fark için aşağıdaki akordiyona bakın.

  </Accordion>

  <Accordion title="Beta sürümünü nasıl kurarım ve beta ile dev arasındaki fark nedir?">
    **Beta**, npm dist-tag `beta` değeridir (yükseltmeden sonra `latest` ile eşleşebilir).
    **Dev**, `main` dalının hareketli ucudur (git); yayınlandığında npm dist-tag `dev` değerini kullanır.

    Tek satırlık komutlar (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows yükleyicisi (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Daha fazla ayrıntı: [Geliştirme kanalları](/tr/install/development-channels) ve [Yükleyici bayrakları](/tr/install/installer).

  </Accordion>

  <Accordion title="En son parçaları nasıl denerim?">
    İki seçenek:

    1. **Dev kanalı (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Bu, `main` dalına geçer ve kaynaktan günceller.

    2. **Değiştirilebilir kurulum (yükleyici sitesinden):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Bu size düzenleyebileceğiniz yerel bir repo verir; ardından git ile güncelleyebilirsiniz.

    Temiz bir klonu elle tercih ediyorsanız şunu kullanın:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Belgeler: [Güncelleme](/tr/cli/update), [Geliştirme kanalları](/tr/install/development-channels),
    [Kurulum](/tr/install).

  </Accordion>

  <Accordion title="Kurulum ve ilk yapılandırma genellikle ne kadar sürer?">
    Kabaca:

    - **Kurulum:** 2-5 dakika
    - **İlk yapılandırma:** yapılandırdığınız kanal/model sayısına bağlı olarak 5-15 dakika

    Takılı kalırsa [Yükleyici takıldı](#quick-start-and-first-run-setup)
    ve [Takıldım](#quick-start-and-first-run-setup) bölümündeki hızlı hata ayıklama döngüsünü kullanın.

  </Accordion>

  <Accordion title="Yükleyici takıldı mı? Nasıl daha fazla geri bildirim alırım?">
    Yükleyiciyi **ayrıntılı çıktı** ile yeniden çalıştırın:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Ayrıntılı beta kurulumu:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Değiştirilebilir (git) kurulum için:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows (PowerShell) eşdeğeri:

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Daha fazla seçenek: [Yükleyici bayrakları](/tr/install/installer).

  </Accordion>

  <Accordion title="Windows kurulumu git bulunamadı veya openclaw tanınmıyor diyor">
    İki yaygın Windows sorunu:

    **1) npm error spawn git / git bulunamadı**

    - **Git for Windows** kurun ve `git` komutunun PATH üzerinde olduğundan emin olun.
    - PowerShell'i kapatıp yeniden açın, ardından yükleyiciyi yeniden çalıştırın.

    **2) kurulumdan sonra openclaw tanınmıyor**

    - npm global bin klasörünüz PATH üzerinde değil.
    - Yolu kontrol edin:

      ```powershell
      npm config get prefix
      ```

    - Bu dizini kullanıcı PATH değişkeninize ekleyin (Windows'ta `\bin` soneki gerekmez; çoğu sistemde `%AppData%\npm` olur).
    - PATH güncellendikten sonra PowerShell'i kapatıp yeniden açın.

    En sorunsuz Windows kurulumunu istiyorsanız yerel Windows yerine **WSL2** kullanın.
    Belgeler: [Windows](/tr/platforms/windows).

  </Accordion>

  <Accordion title="Windows exec çıktısı bozuk Çince metin gösteriyor - ne yapmalıyım?">
    Bu genellikle yerel Windows kabuklarında konsol kod sayfası uyumsuzluğudur.

    Belirtiler:

    - `system.run`/`exec` çıktısı Çinceyi mojibake olarak gösterir
    - Aynı komut başka bir terminal profilinde düzgün görünür

    PowerShell'de hızlı geçici çözüm:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Ardından Gateway'i yeniden başlatın ve komutunuzu tekrar deneyin:

    ```powershell
    openclaw gateway restart
    ```

    Bunu hâlâ en son OpenClaw üzerinde yeniden üretebiliyorsanız şurada izleyin/bildirin:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Belgeler sorumu yanıtlamadı - nasıl daha iyi bir yanıt alırım?">
    Tam kaynak ve belgeler yerelde olsun diye **değiştirilebilir (git) kurulumu** kullanın, ardından
    botunuza (veya Claude/Codex'e) _o klasörden_ sorun; böylece repoyu okuyup kesin yanıt verebilir.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Daha fazla ayrıntı: [Kurulum](/tr/install) ve [Yükleyici bayrakları](/tr/install/installer).

  </Accordion>

  <Accordion title="OpenClaw'ı Linux'a nasıl kurarım?">
    Kısa yanıt: Linux kılavuzunu izleyin, ardından ilk yapılandırmayı çalıştırın.

    - Linux hızlı yolu + hizmet kurulumu: [Linux](/tr/platforms/linux).
    - Tam adım adım kılavuz: [Başlangıç](/tr/start/getting-started).
    - Yükleyici + güncellemeler: [Kurulum ve güncellemeler](/tr/install/updating).

  </Accordion>

  <Accordion title="OpenClaw'ı bir VPS'e nasıl kurarım?">
    Herhangi bir Linux VPS çalışır. Sunucuya kurun, ardından Gateway'e erişmek için SSH/Tailscale kullanın.

    Kılavuzlar: [exe.dev](/tr/install/exe-dev), [Hetzner](/tr/install/hetzner), [Fly.io](/tr/install/fly).
    Uzaktan erişim: [Gateway uzaktan erişim](/tr/gateway/remote).

  </Accordion>

  <Accordion title="Bulut/VPS kurulum kılavuzları nerede?">
    Yaygın sağlayıcılar için bir **barındırma merkezi** tutuyoruz. Birini seçip kılavuzu izleyin:

    - [VPS barındırma](/tr/vps) (tüm sağlayıcılar tek yerde)
    - [Fly.io](/tr/install/fly)
    - [Hetzner](/tr/install/hetzner)
    - [exe.dev](/tr/install/exe-dev)

    Bulutta çalışma şekli: **Gateway sunucuda çalışır** ve ona dizüstü bilgisayarınızdan/telefonunuzdan
    Control UI (veya Tailscale/SSH) üzerinden erişirsiniz. Durumunuz + çalışma alanınız
    sunucuda yaşar; bu yüzden ana makineyi doğruluk kaynağı olarak kabul edin ve yedekleyin.

    Yerel ekran/kamera/canvas erişimi sağlamak veya dizüstü bilgisayarınızda komut çalıştırmak için
    **düğümleri** (Mac/iOS/Android/headless) bu bulut Gateway ile eşleştirebilir,
    Gateway'i bulutta tutabilirsiniz.

    Merkez: [Platformlar](/tr/platforms). Uzaktan erişim: [Gateway uzaktan erişim](/tr/gateway/remote).
    Düğümler: [Düğümler](/tr/nodes), [Düğümler CLI](/tr/cli/nodes).

  </Accordion>

  <Accordion title="OpenClaw'dan kendini güncellemesini isteyebilir miyim?">
    Kısa yanıt: **mümkün, önerilmez**. Güncelleme akışı Gateway'i yeniden başlatabilir
    (bu etkin oturumu düşürür), temiz bir git checkout gerektirebilir ve
    onay isteyebilir. Daha güvenlisi: güncellemeleri operatör olarak bir kabuktan çalıştırın.

    CLI'yi kullanın:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Bir agent üzerinden otomatikleştirmeniz gerekiyorsa:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Belgeler: [Güncelleme](/tr/cli/update), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="İlk yapılandırma aslında ne yapar?">
    `openclaw onboard` önerilen kurulum yoludur. **Yerel modda** size şunları adım adım yaptırır:

    - **Model/kimlik doğrulama kurulumu** (sağlayıcı OAuth, API anahtarları, Anthropic setup-token ve LM Studio gibi yerel model seçenekleri)
    - **Çalışma alanı** konumu + başlangıç dosyaları
    - **Gateway ayarları** (bind/port/auth/tailscale)
    - **Kanallar** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage ve QQ Bot gibi paketlenmiş kanal plugins)
    - **Daemon kurulumu** (macOS'ta LaunchAgent; Linux/WSL2'de systemd kullanıcı birimi)
    - **Sağlık kontrolleri** ve **Skills** seçimi

    Ayrıca yapılandırılmış modeliniz bilinmiyorsa veya kimlik doğrulaması eksikse uyarır.

  </Accordion>

  <Accordion title="Bunu çalıştırmak için Claude veya OpenAI aboneliğine ihtiyacım var mı?">
    Hayır. OpenClaw'ı **API anahtarları** (Anthropic/OpenAI/diğerleri) veya
    **yalnızca yerel modeller** ile çalıştırabilirsiniz; böylece verileriniz cihazınızda kalır. Abonelikler (Claude
    Pro/Max veya OpenAI Codex), bu sağlayıcılarda kimlik doğrulamanın isteğe bağlı yollarıdır.

    OpenClaw'da Anthropic için pratik ayrım şudur:

    - **Anthropic API anahtarı**: normal Anthropic API faturalandırması
    - **OpenClaw'da Claude CLI / Claude abonelik kimlik doğrulaması**: Anthropic çalışanları
      bu kullanımın yeniden izinli olduğunu bize söyledi ve OpenClaw, Anthropic yeni bir
      politika yayımlamadığı sürece bu entegrasyon için `claude -p`
      kullanımını onaylı kabul ediyor

    Uzun ömürlü gateway ana makineleri için Anthropic API anahtarları hâlâ daha
    öngörülebilir kurulumdur. OpenAI Codex OAuth, OpenClaw gibi harici
    araçlar için açıkça desteklenir.

    OpenClaw ayrıca **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** ve
    **Z.AI / GLM Coding Plan** dahil başka barındırılan abonelik tarzı seçenekleri de destekler.

    Belgeler: [Anthropic](/tr/providers/anthropic), [OpenAI](/tr/providers/openai),
    [Qwen Cloud](/tr/providers/qwen),
    [MiniMax](/tr/providers/minimax), [GLM Modelleri](/tr/providers/glm),
    [Yerel modeller](/tr/gateway/local-models), [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="API anahtarı olmadan Claude Max aboneliğini kullanabilir miyim?">
    Evet.

    Anthropic çalışanları, OpenClaw tarzı Claude CLI kullanımının yeniden izinli olduğunu bize söyledi; bu nedenle
    OpenClaw, Anthropic yeni bir politika yayımlamadığı sürece bu entegrasyon için
    Claude abonelik kimlik doğrulamasını ve `claude -p` kullanımını onaylı kabul eder.
    En öngörülebilir sunucu tarafı kurulumu istiyorsanız bunun yerine Anthropic API anahtarı kullanın.

  </Accordion>

  <Accordion title="Claude abonelik kimlik doğrulamasını destekliyor musunuz (Claude Pro veya Max)?">
    Evet.

    Anthropic çalışanları bu kullanımın yeniden izinli olduğunu bize söyledi; bu nedenle OpenClaw,
    Anthropic yeni bir politika yayımlamadığı sürece bu entegrasyon için
    Claude CLI yeniden kullanımını ve `claude -p` kullanımını onaylı kabul eder.

    Anthropic setup-token hâlâ desteklenen bir OpenClaw token yolu olarak kullanılabilir, ancak OpenClaw artık mevcut olduğunda Claude CLI yeniden kullanımını ve `claude -p` kullanımını tercih eder.
    Üretim veya çok kullanıcılı iş yükleri için Anthropic API anahtarı kimlik doğrulaması hâlâ
    daha güvenli ve daha öngörülebilir seçimdir. OpenClaw'da başka abonelik tarzı barındırılan
    seçenekler istiyorsanız [OpenAI](/tr/providers/openai), [Qwen / Model
    Cloud](/tr/providers/qwen), [MiniMax](/tr/providers/minimax) ve [GLM
    Modelleri](/tr/providers/glm) bölümlerine bakın.

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Anthropic'ten neden HTTP 429 rate_limit_error görüyorum?">
    Bu, mevcut pencere için **Anthropic kota/hız sınırınızın** tükendiği anlamına gelir. **Claude CLI**
    kullanıyorsanız pencerenin sıfırlanmasını bekleyin veya planınızı yükseltin. **Anthropic API anahtarı**
    kullanıyorsanız kullanım/faturalandırma için Anthropic Console'u
    kontrol edin ve gerektiğinde sınırları artırın.

    Mesaj özellikle şuysa:
    `Extra usage is required for long context requests`, istek
    Anthropic'in 1M bağlam betasını (`context1m: true`) kullanmaya çalışıyordur. Bu yalnızca
    kimlik bilginiz uzun bağlam faturalandırmasına uygunsa çalışır (API anahtarı faturalandırması veya
    Extra Usage etkinleştirilmiş OpenClaw Claude-login yolu).

    İpucu: bir sağlayıcı hız sınırına takıldığında OpenClaw yanıt vermeye devam edebilsin diye bir **yedek model** ayarlayın.
    Bkz. [Modeller](/tr/cli/models), [OAuth](/tr/concepts/oauth) ve
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/tr/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock destekleniyor mu?">
    Evet. OpenClaw, paketle gelen bir **Amazon Bedrock (Converse)** sağlayıcısına sahiptir. AWS ortam işaretçileri mevcut olduğunda OpenClaw, akış/metin Bedrock kataloğunu otomatik keşfedebilir ve bunu örtük bir `amazon-bedrock` sağlayıcısı olarak birleştirebilir; aksi halde `plugins.entries.amazon-bedrock.config.discovery.enabled` ayarını açıkça etkinleştirebilir veya elle bir sağlayıcı girdisi ekleyebilirsiniz. Bkz. [Amazon Bedrock](/tr/providers/bedrock) ve [Model sağlayıcıları](/tr/providers/models). Yönetilen bir anahtar akışını tercih ediyorsanız, Bedrock önünde OpenAI uyumlu bir proxy hâlâ geçerli bir seçenektir.
  </Accordion>

  <Accordion title="Codex kimlik doğrulaması nasıl çalışır?">
    OpenClaw, OAuth (ChatGPT oturum açma) aracılığıyla **OpenAI Code (Codex)** desteği sunar. Yaygın kurulum için
    `openai/gpt-5.5` kullanın: ChatGPT/Codex abonelik kimlik doğrulaması artı
    yerel Codex uygulama sunucusu yürütmesi. `openai-codex/gpt-*` model başvuruları,
    `openclaw doctor --fix` tarafından onarılan eski yapılandırmadır. Doğrudan OpenAI API anahtarı
    erişimi, ajan olmayan OpenAI API yüzeyleri ve sıralı bir `openai-codex`
    API anahtarı profili üzerinden ajan modelleri için kullanılabilir olmaya devam eder.
    Bkz. [Model sağlayıcıları](/tr/concepts/model-providers) ve [Başlatma (CLI)](/tr/start/wizard).
  </Accordion>

  <Accordion title="OpenClaw neden hâlâ openai-codex ifadesinden bahsediyor?">
    `openai-codex`, ChatGPT/Codex OAuth için sağlayıcı ve kimlik doğrulama profili kimliğidir.
    Eski yapılandırmalar bunu model öneki olarak da kullanıyordu:

    - `openai/gpt-5.5` = ajan turları için yerel Codex çalışma zamanı ile ChatGPT/Codex abonelik kimlik doğrulaması
    - `openai-codex/gpt-5.5` = `openclaw doctor --fix` tarafından onarılan eski model rotası
    - `openai/gpt-5.5` artı sıralı bir `openai-codex` API anahtarı profili = bir OpenAI ajan modeli için API anahtarı kimlik doğrulaması
    - `openai-codex:...` = kimlik doğrulama profili kimliği, model başvurusu değil

    Doğrudan OpenAI Platform faturalandırma/sınır yolunu istiyorsanız
    `OPENAI_API_KEY` ayarlayın. ChatGPT/Codex abonelik kimlik doğrulamasını istiyorsanız
    `openclaw models auth login --provider openai-codex` ile oturum açın. Model başvurusunu
    `openai/gpt-5.5` olarak tutun; `openai-codex/*` model başvuruları,
    `openclaw doctor --fix` tarafından yeniden yazılan eski yapılandırmadır.

  </Accordion>

  <Accordion title="Codex OAuth sınırları neden ChatGPT web’den farklı olabilir?">
    Codex OAuth, OpenAI tarafından yönetilen, plana bağlı kota pencerelerini kullanır. Pratikte,
    ikisi de aynı hesaba bağlı olsa bile bu sınırlar ChatGPT web sitesi/uygulama deneyiminden
    farklı olabilir.

    OpenClaw, `openclaw models status` içinde şu anda görünür olan sağlayıcı
    kullanım/kota pencerelerini gösterebilir, ancak ChatGPT web haklarını doğrudan API erişimine
    dönüştürmez veya normalleştirmez. Doğrudan OpenAI Platform faturalandırma/sınır
    yolunu istiyorsanız, API anahtarıyla `openai/*` kullanın.

  </Accordion>

  <Accordion title="OpenAI abonelik kimlik doğrulamasını (Codex OAuth) destekliyor musunuz?">
    Evet. OpenClaw, **OpenAI Code (Codex) abonelik OAuth** özelliğini tamamen destekler.
    OpenAI, OpenClaw gibi harici araçlarda/iş akışlarında abonelik OAuth kullanımına
    açıkça izin verir. Başlatma, OAuth akışını sizin için çalıştırabilir.

    Bkz. [OAuth](/tr/concepts/oauth), [Model sağlayıcıları](/tr/concepts/model-providers) ve [Başlatma (CLI)](/tr/start/wizard).

  </Accordion>

  <Accordion title="Gemini CLI OAuth nasıl kurulur?">
    Gemini CLI, `openclaw.json` içinde bir istemci kimliği veya gizli anahtar değil, bir **Plugin kimlik doğrulama akışı** kullanır.

    Adımlar:

    1. Gemini CLI’yi yerel olarak kurun, böylece `gemini` `PATH` üzerinde olur
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin’i etkinleştirin: `openclaw plugins enable google`
    3. Oturum açın: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Oturum açtıktan sonraki varsayılan model: `google-gemini-cli/gemini-3-flash-preview`
    5. İstekler başarısız olursa Gateway ana makinesinde `GOOGLE_CLOUD_PROJECT` veya `GOOGLE_CLOUD_PROJECT_ID` ayarlayın

    Bu, OAuth belirteçlerini Gateway ana makinesindeki kimlik doğrulama profillerinde saklar. Ayrıntılar: [Model sağlayıcıları](/tr/concepts/model-providers).

  </Accordion>

  <Accordion title="Gündelik sohbetler için yerel model uygun mu?">
    Genellikle hayır. OpenClaw büyük bağlama ve güçlü güvenliğe ihtiyaç duyar; küçük kartlar kırpar ve sızdırır. Mecbursanız, yerel olarak çalıştırabildiğiniz **en büyük** model derlemesini çalıştırın (LM Studio) ve [/gateway/local-models](/tr/gateway/local-models) sayfasına bakın. Daha küçük/nicelenmiş modeller prompt injection riskini artırır - bkz. [Güvenlik](/tr/gateway/security).
  </Accordion>

  <Accordion title="Barındırılan model trafiğini belirli bir bölgede nasıl tutarım?">
    Bölgeye sabitlenmiş uç noktaları seçin. OpenRouter, MiniMax, Kimi ve GLM için ABD’de barındırılan seçenekler sunar; veriyi bölgede tutmak için ABD’de barındırılan varyantı seçin. Geri dönüşlerin kullanılabilir kalmasını sağlarken seçtiğiniz bölgesel sağlayıcıya uymak için `models.mode: "merge"` kullanarak Anthropic/OpenAI’yi bunların yanında listelemeye devam edebilirsiniz.
  </Accordion>

  <Accordion title="Bunu kurmak için Mac Mini satın almak zorunda mıyım?">
    Hayır. OpenClaw macOS veya Linux üzerinde çalışır (Windows, WSL2 üzerinden). Mac mini isteğe bağlıdır - bazı kişiler
    her zaman açık bir ana makine olarak bir tane satın alır, ancak küçük bir VPS, ev sunucusu veya Raspberry Pi sınıfı kutu da çalışır.

    Yalnızca **macOS’a özel araçlar** için Mac gerekir. iMessage için, Messages’a oturum açmış herhangi bir Mac’te `imsg` ile [iMessage](/tr/channels/imessage) kullanın. Gateway Linux üzerinde veya başka bir yerde çalışıyorsa, `channels.imessage.cliPath` değerini o Mac’te `imsg` çalıştıran bir SSH sarmalayıcıya ayarlayın. Başka macOS’a özel araçlar istiyorsanız, Gateway’i bir Mac’te çalıştırın veya bir macOS düğümünü eşleyin.

    Belgeler: [iMessage](/tr/channels/imessage), [Düğümler](/tr/nodes), [Mac uzak modu](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="iMessage desteği için Mac mini gerekir mi?">
    Messages’a oturum açmış **bir macOS cihazına** ihtiyacınız var. Bunun Mac mini olması **gerekmez** -
    herhangi bir Mac çalışır. `imsg` ile **[iMessage](/tr/channels/imessage) kullanın**; Gateway o Mac’te çalışabilir veya bir SSH sarmalayıcı `cliPath` ile başka yerde çalışabilir.

    Yaygın kurulumlar:

    - Gateway’i Linux/VPS üzerinde çalıştırın ve `channels.imessage.cliPath` değerini Messages’a oturum açmış bir Mac’te `imsg` çalıştıran bir SSH sarmalayıcıya ayarlayın.
    - En basit tek makine kurulumunu istiyorsanız her şeyi Mac üzerinde çalıştırın.

    Belgeler: [iMessage](/tr/channels/imessage), [Düğümler](/tr/nodes),
    [Mac uzak modu](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="OpenClaw çalıştırmak için Mac mini satın alırsam onu MacBook Pro’ma bağlayabilir miyim?">
    Evet. **Mac mini Gateway’i çalıştırabilir** ve MacBook Pro’nuz bir
    **düğüm** (eşlik eden cihaz) olarak bağlanabilir. Düğümler Gateway çalıştırmaz - bu cihazda ekran/kamera/kanvas ve `system.run` gibi ek
    yetenekler sağlar.

    Yaygın desen:

    - Gateway Mac mini üzerinde (her zaman açık).
    - MacBook Pro macOS uygulamasını veya bir düğüm ana makinesini çalıştırır ve Gateway ile eşleşir.
    - Görmek için `openclaw nodes status` / `openclaw nodes list` kullanın.

    Belgeler: [Düğümler](/tr/nodes), [Düğümler CLI](/tr/cli/nodes).

  </Accordion>

  <Accordion title="Bun kullanabilir miyim?">
    Bun **önerilmez**. Özellikle WhatsApp ve Telegram ile çalışma zamanı hataları görüyoruz.
    Kararlı gateway’ler için **Node** kullanın.

    Yine de Bun ile deneme yapmak istiyorsanız, bunu WhatsApp/Telegram olmayan üretim dışı bir gateway’de yapın.

  </Accordion>

  <Accordion title="Telegram: allowFrom içine ne yazılır?">
    `channels.telegram.allowFrom`, **insan gönderenin Telegram kullanıcı kimliğidir** (sayısal). Bot kullanıcı adı değildir.

    Kurulum yalnızca sayısal kullanıcı kimlikleri ister. Yapılandırmada zaten eski `@username` girdileriniz varsa, `openclaw doctor --fix` bunları çözümlemeyi deneyebilir.

    Daha güvenli (üçüncü taraf bot yok):

    - Botunuza DM gönderin, sonra `openclaw logs --follow` çalıştırın ve `from.id` değerini okuyun.

    Resmî Bot API:

    - Botunuza DM gönderin, sonra `https://api.telegram.org/bot<bot_token>/getUpdates` çağrısı yapın ve `message.from.id` değerini okuyun.

    Üçüncü taraf (daha az özel):

    - `@userinfobot` veya `@getidsbot` hesabına DM gönderin.

    Bkz. [/channels/telegram](/tr/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Birden fazla kişi, farklı OpenClaw örnekleriyle tek bir WhatsApp numarası kullanabilir mi?">
    Evet, **çok ajanlı yönlendirme** ile. Her gönderenin WhatsApp **DM**’ini (eş `kind: "direct"`, gönderen E.164 biçiminde ör. `+15551234567`) farklı bir `agentId` değerine bağlayın; böylece her kişi kendi çalışma alanını ve oturum deposunu alır. Yanıtlar hâlâ **aynı WhatsApp hesabından** gelir ve DM erişim denetimi (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) WhatsApp hesabı başına geneldir. Bkz. [Çok Ajanlı Yönlendirme](/tr/concepts/multi-agent) ve [WhatsApp](/tr/channels/whatsapp).
  </Accordion>

  <Accordion title='Bir "hızlı sohbet" ajanı ve bir "kodlama için Opus" ajanı çalıştırabilir miyim?'>
    Evet. Çok ajanlı yönlendirme kullanın: her ajana kendi varsayılan modelini verin, ardından gelen rotaları (sağlayıcı hesabı veya belirli eşler) her ajana bağlayın. Örnek yapılandırma [Çok Ajanlı Yönlendirme](/tr/concepts/multi-agent) içinde yer alır. Ayrıca bkz. [Modeller](/tr/concepts/models) ve [Yapılandırma](/tr/gateway/configuration).
  </Accordion>

  <Accordion title="Homebrew Linux üzerinde çalışır mı?">
    Evet. Homebrew Linux’u destekler (Linuxbrew). Hızlı kurulum:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    OpenClaw’ı systemd üzerinden çalıştırıyorsanız, hizmet PATH değerinin `/home/linuxbrew/.linuxbrew/bin` (veya brew önekinizi) içerdiğinden emin olun; böylece `brew` ile kurulan araçlar login olmayan kabuklarda çözümlenir.
    Son derlemeler ayrıca Linux systemd hizmetlerinde yaygın kullanıcı bin dizinlerini başa ekler (örneğin `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) ve ayarlandıklarında `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` ve `FNM_DIR` değerlerini dikkate alır.

  </Accordion>

  <Accordion title="Hacklenebilir git kurulumu ile npm kurulumu arasındaki fark">
    - **Hacklenebilir (git) kurulum:** tam kaynak checkout, düzenlenebilir, katkıda bulunanlar için en iyisi.
      Derlemeleri yerel olarak çalıştırır ve kod/belge yamalayabilirsiniz.
    - **npm kurulumu:** global CLI kurulumu, depo yok, "sadece çalıştır" için en iyisi.
      Güncellemeler npm dist-tag’lerinden gelir.

    Belgeler: [Başlarken](/tr/start/getting-started), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="Daha sonra npm ve git kurulumları arasında geçiş yapabilir miyim?">
    Evet. OpenClaw zaten kuruluysa `openclaw update --channel ...` kullanın.
    Bu **verilerinizi silmez** - yalnızca OpenClaw kod kurulumunu değiştirir.
    Durumunuz (`~/.openclaw`) ve çalışma alanınız (`~/.openclaw/workspace`) dokunulmadan kalır.

    npm’den git’e:

    ```bash
    openclaw update --channel dev
    ```

    git’ten npm’e:

    ```bash
    openclaw update --channel stable
    ```

    Planlanan mod geçişini önce önizlemek için `--dry-run` ekleyin. Güncelleyici
    Doctor takip işlemlerini çalıştırır, hedef kanal için Plugin kaynaklarını yeniler ve
    `--no-restart` geçmediğiniz sürece gateway’i yeniden başlatır.

    Kurucu da her iki modu zorlayabilir:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Yedekleme ipuçları: bkz. [Yedekleme stratejisi](/tr/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Gateway’i dizüstü bilgisayarımda mı yoksa VPS’te mi çalıştırmalıyım?">
    Kısa cevap: **7/24 güvenilirlik istiyorsanız, VPS kullanın**. En düşük
    sürtünmeyi istiyorsanız ve uyku/yeniden başlatmalar sizin için sorun değilse, yerel olarak çalıştırın.

    **Dizüstü bilgisayar (yerel Gateway)**

    - **Artılar:** sunucu maliyeti yok, yerel dosyalara doğrudan erişim, canlı tarayıcı penceresi.
    - **Eksiler:** uyku/ağ kopmaları = bağlantı kesilmeleri, işletim sistemi güncellemeleri/yeniden başlatmalar kesinti yaratır, uyanık kalması gerekir.

    **VPS / bulut**

    - **Artıları:** her zaman açık, kararlı ağ, dizüstü bilgisayarın uykuya geçmesiyle ilgili sorun yok, çalışır durumda tutması daha kolay.
    - **Eksileri:** genellikle başsız çalışır (ekran görüntüleri kullanın), yalnızca uzaktan dosya erişimi vardır, güncellemeler için SSH kullanmanız gerekir.

    **OpenClaw'a özel not:** WhatsApp/Telegram/Slack/Mattermost/Discord bir VPS üzerinden sorunsuz çalışır. Tek gerçek tercih noktası **başsız tarayıcı** ile görünür pencere arasındadır. Bkz. [Tarayıcı](/tr/tools/browser).

    **Önerilen varsayılan:** Daha önce Gateway bağlantı kopmaları yaşadıysanız VPS. Mac'i aktif olarak kullanıyorsanız ve yerel dosya erişimi ya da görünür bir tarayıcıyla UI otomasyonu istiyorsanız yerel kurulum harikadır.

  </Accordion>

  <Accordion title="OpenClaw'u özel bir makinede çalıştırmak ne kadar önemli?">
    Zorunlu değildir, ancak **güvenilirlik ve yalıtım için önerilir**.

    - **Özel ana makine (VPS/Mac mini/Pi):** her zaman açık, daha az uyku/yeniden başlatma kesintisi, daha temiz izinler, çalışır durumda tutması daha kolay.
    - **Paylaşılan dizüstü/masaüstü:** test ve aktif kullanım için tamamen uygundur, ancak makine uykuya geçtiğinde veya güncellendiğinde duraklamalar bekleyin.

    Her iki dünyanın da en iyisini istiyorsanız Gateway'i özel bir ana makinede tutun ve dizüstü bilgisayarınızı yerel ekran/kamera/exec araçları için bir **Node** olarak eşleştirin. Bkz. [Nodes](/tr/nodes).
    Güvenlik yönergeleri için [Güvenlik](/tr/gateway/security) bölümünü okuyun.

  </Accordion>

  <Accordion title="Minimum VPS gereksinimleri ve önerilen OS nedir?">
    OpenClaw hafiftir. Temel bir Gateway + bir sohbet kanalı için:

    - **Mutlak minimum:** 1 vCPU, 1GB RAM, ~500MB disk.
    - **Önerilen:** ek pay için 1-2 vCPU, 2GB RAM veya daha fazlası (günlükler, medya, birden fazla kanal). Node araçları ve tarayıcı otomasyonu kaynak tüketebilir.

    OS: **Ubuntu LTS** (veya herhangi bir modern Debian/Ubuntu) kullanın. Linux kurulum yolu en iyi burada test edilir.

    Dokümanlar: [Linux](/tr/platforms/linux), [VPS barındırma](/tr/vps).

  </Accordion>

  <Accordion title="OpenClaw'u bir VM içinde çalıştırabilir miyim ve gereksinimler nelerdir?">
    Evet. Bir VM'ye VPS ile aynı şekilde yaklaşın: her zaman açık, erişilebilir olmalı ve Gateway ile etkinleştirdiğiniz tüm kanallar için yeterli
    RAM'e sahip olmalıdır.

    Temel yönergeler:

    - **Mutlak minimum:** 1 vCPU, 1GB RAM.
    - **Önerilen:** birden fazla kanal, tarayıcı otomasyonu veya medya araçları çalıştırıyorsanız 2GB RAM veya daha fazlası.
    - **OS:** Ubuntu LTS veya başka bir modern Debian/Ubuntu.

    Windows kullanıyorsanız, **WSL2 en kolay VM tarzı kurulumdur** ve en iyi araç
    uyumluluğuna sahiptir. Bkz. [Windows](/tr/platforms/windows), [VPS barındırma](/tr/vps).
    macOS'u bir VM içinde çalıştırıyorsanız, bkz. [macOS VM](/tr/install/macos-vm).

  </Accordion>
</AccordionGroup>

## İlgili

- [SSS](/tr/help/faq) — ana SSS (modeller, oturumlar, Gateway, güvenlik, daha fazlası)
- [Kurulum genel bakışı](/tr/install)
- [Başlarken](/tr/start/getting-started)
- [Sorun giderme](/tr/help/troubleshooting)

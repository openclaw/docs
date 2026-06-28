---
read_when:
    - Yeni kurulum, başlangıç yapılandırmasında takılma veya ilk çalıştırma hataları
    - Kimlik doğrulama ve sağlayıcı aboneliklerini seçme
    - docs.openclaw.ai’ye erişilemiyor, gösterge paneli açılamıyor, kurulum takıldı
sidebarTitle: First-run FAQ
summary: 'SSS: hızlı başlangıç ve ilk çalıştırma kurulumu — kurulum, onboard, kimlik doğrulama, abonelikler, ilk hatalar'
title: 'SSS: ilk çalıştırma kurulumu'
x-i18n:
    generated_at: "2026-06-28T20:43:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ef4122bc0c3068806591ccdc1bf7f3eb5a81cc7efd2066d07f948fe953284be
    source_path: help/faq-first-run.md
    workflow: 16
---

  Hızlı başlangıç ve ilk çalıştırma SSS. Günlük işlemler, modeller, kimlik doğrulama, oturumlar
  ve sorun giderme için ana [SSS](/tr/help/faq) sayfasına bakın.

  ## Hızlı başlangıç ve ilk çalıştırma kurulumu

  <AccordionGroup>
  <Accordion title="Takıldım, en hızlı nasıl ilerlerim?">
    **Makinenizi görebilen** yerel bir AI agent kullanın. Bu, Discord'da sormaktan çok daha etkilidir,
    çünkü çoğu "takıldım" durumu, uzaktaki yardımcıların inceleyemeyeceği **yerel yapılandırma veya ortam sorunlarıdır**.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Bu araçlar repo'yu okuyabilir, komut çalıştırabilir, günlükleri inceleyebilir ve makine düzeyindeki
    kurulumunuzu (PATH, servisler, izinler, kimlik doğrulama dosyaları) düzeltmeye yardımcı olabilir. Onlara
    hacklenebilir (git) kurulum aracılığıyla **tam kaynak checkout'unu** verin:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Bu, OpenClaw'ı **bir git checkout'undan** kurar; böylece agent kodu + belgeleri okuyabilir ve
    çalıştırdığınız tam sürüm hakkında akıl yürütebilir. Daha sonra kurucuyu `--install-method git` olmadan
    yeniden çalıştırarak her zaman kararlı sürüme geri dönebilirsiniz.

    İpucu: agent'tan düzeltmeyi **planlamasını ve denetlemesini** (adım adım) isteyin, sonra yalnızca
    gerekli komutları çalıştırın. Bu, değişiklikleri küçük ve denetlemesi daha kolay tutar.

    Gerçek bir hata veya düzeltme keşfederseniz lütfen GitHub issue'su açın ya da PR gönderin:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Şu komutlarla başlayın (yardım isterken çıktıları paylaşın):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Ne yaparlar:

    - `openclaw status`: gateway/agent sağlığı + temel yapılandırmanın hızlı anlık görüntüsü.
    - `openclaw models status`: provider kimlik doğrulamasını + model kullanılabilirliğini kontrol eder.
    - `openclaw doctor`: yaygın yapılandırma/durum sorunlarını doğrular ve onarır.

    Diğer yararlı CLI kontrolleri: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Hızlı hata ayıklama döngüsü: [Bir şey bozuksa ilk 60 saniye](/tr/help/faq#first-60-seconds-if-something-is-broken).
    Kurulum belgeleri: [Kurulum](/tr/install), [Kurucu bayrakları](/tr/install/installer), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="Heartbeat sürekli atlanıyor. Atlama nedenleri ne anlama geliyor?">
    Yaygın heartbeat atlama nedenleri:

    - `quiet-hours`: yapılandırılmış aktif saatler penceresinin dışında
    - `empty-heartbeat-file`: `HEARTBEAT.md` var, ancak yalnızca boş, yorum, başlık, fence veya boş checklist iskeleti içeriyor
    - `no-tasks-due`: `HEARTBEAT.md` görev modu aktif, ancak görev aralıklarından hiçbiri henüz zamanı gelmiş değil
    - `alerts-disabled`: tüm heartbeat görünürlüğü devre dışı (`showOk`, `showAlerts` ve `useIndicator` hepsi kapalı)

    Görev modunda, zamanı gelen zaman damgaları yalnızca gerçek bir heartbeat çalışması
    tamamlandıktan sonra ilerletilir. Atlanan çalışmalar görevleri tamamlanmış olarak işaretlemez.

    Belgeler: [Heartbeat](/tr/gateway/heartbeat), [Otomasyon](/tr/automation).

  </Accordion>

  <Accordion title="OpenClaw'ı kurmak ve ayarlamak için önerilen yol">
    Repo, kaynaktan çalıştırmayı ve onboarding kullanmayı önerir:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Sihirbaz UI varlıklarını otomatik olarak da oluşturabilir. Onboarding sonrasında Gateway'i genellikle **18789** portunda çalıştırırsınız.

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

  <Accordion title="Onboarding sonrasında dashboard'u nasıl açarım?">
    Sihirbaz, onboarding'in hemen ardından tarayıcınızı temiz (token içermeyen) bir dashboard URL'siyle açar ve bağlantıyı özette de yazdırır. O sekmeyi açık tutun; açılmadıysa, yazdırılan URL'yi aynı makinede kopyalayıp yapıştırın.
  </Accordion>

  <Accordion title="Dashboard'da localhost ile uzak erişimde kimliği nasıl doğrularım?">
    **Localhost (aynı makine):**

    - `http://127.0.0.1:18789/` adresini açın.
    - Paylaşılan gizli anahtar kimlik doğrulaması isterse, yapılandırılmış token'ı veya parolayı Control UI ayarlarına yapıştırın.
    - Token kaynağı: `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`).
    - Parola kaynağı: `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`).
    - Henüz paylaşılan gizli anahtar yapılandırılmadıysa, `openclaw doctor --generate-gateway-token` ile bir token oluşturun.

    **Localhost değilse:**

    - **Tailscale Serve** (önerilir): bind loopback'i koruyun, `openclaw gateway --tailscale serve` çalıştırın, `https://<magicdns>/` adresini açın. `gateway.auth.allowTailscale` `true` ise, identity header'ları Control UI/WebSocket kimlik doğrulamasını karşılar (yapıştırılan paylaşılan gizli anahtar yoktur, güvenilir gateway host'u varsayılır); HTTP API'leri, bilinçli olarak private-ingress `none` veya trusted-proxy HTTP kimlik doğrulaması kullanmadığınız sürece yine de paylaşılan gizli anahtar kimlik doğrulaması gerektirir.
      Aynı istemciden gelen hatalı eşzamanlı Serve kimlik doğrulama denemeleri, failed-auth sınırlayıcısı onları kaydetmeden önce seri hale getirilir; bu nedenle ikinci hatalı yeniden deneme zaten `retry later` gösterebilir.
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` çalıştırın (veya parola kimlik doğrulamasını yapılandırın), `http://<tailscale-ip>:18789/` adresini açın, sonra eşleşen paylaşılan gizli anahtarı dashboard ayarlarına yapıştırın.
    - **Kimlik farkındalıklı reverse proxy**: Gateway'i güvenilir bir proxy arkasında tutun, `gateway.auth.mode: "trusted-proxy"` yapılandırın, sonra proxy URL'sini açın. Aynı host loopback proxy'leri açıkça `gateway.auth.trustedProxy.allowLoopback = true` gerektirir.
    - **SSH tüneli**: `ssh -N -L 18789:127.0.0.1:18789 user@host` ardından `http://127.0.0.1:18789/` adresini açın. Paylaşılan gizli anahtar kimlik doğrulaması tünel üzerinden de geçerlidir; istenirse yapılandırılmış token'ı veya parolayı yapıştırın.

    Bind modları ve kimlik doğrulama ayrıntıları için [Dashboard](/tr/web/dashboard) ve [Web yüzeyleri](/tr/web) sayfalarına bakın.

  </Accordion>

  <Accordion title="Sohbet onayları için neden iki exec approval yapılandırması var?">
    Farklı katmanları kontrol ederler:

    - `approvals.exec`: onay istemlerini sohbet hedeflerine iletir
    - `channels.<channel>.execApprovals`: o kanalın exec onayları için yerel bir onay istemcisi gibi davranmasını sağlar

    Host exec politikası hâlâ gerçek onay kapısıdır. Sohbet yapılandırması yalnızca onay
    istemlerinin nerede görüneceğini ve insanların bunları nasıl yanıtlayabileceğini kontrol eder.

    Çoğu kurulumda ikisine de ihtiyacınız **yoktur**:

    - Sohbet zaten komutları ve yanıtları destekliyorsa, aynı sohbet `/approve` paylaşılan yol üzerinden çalışır.
    - Desteklenen bir yerel kanal onaylayanları güvenli biçimde çıkarabiliyorsa, OpenClaw artık `channels.<channel>.execApprovals.enabled` ayarlanmamışsa veya `"auto"` ise DM öncelikli yerel onayları otomatik etkinleştirir.
    - Yerel onay kartları/düğmeleri mevcut olduğunda, o yerel UI birincil yoldur; agent yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın tek yol olduğunu söylüyorsa manuel `/approve` komutu eklemelidir.
    - `approvals.exec` yalnızca istemlerin başka sohbetlere veya açık ops odalarına da iletilmesi gerektiğinde kullanın.
    - `channels.<channel>.execApprovals.target: "channel"` veya `"both"` yalnızca onay istemlerinin kaynak oda/konuya geri gönderilmesini açıkça istediğinizde kullanın.
    - Plugin onayları ayrıca ayrıdır: varsayılan olarak aynı sohbet `/approve`, isteğe bağlı `approvals.plugin` yönlendirmesi kullanırlar ve yalnızca bazı yerel kanallar bunun üzerine plugin onayı yerel işleme özelliğini korur.

    Kısa sürüm: yönlendirme routing içindir, yerel istemci yapılandırması daha zengin kanala özel UX içindir.
    Bkz. [Exec Onayları](/tr/tools/exec-approvals).

  </Accordion>

  <Accordion title="Hangi runtime'a ihtiyacım var?">
    Node **>= 22** gereklidir. `pnpm` önerilir. Bun, Gateway için **önerilmez**.
  </Accordion>

  <Accordion title="Raspberry Pi üzerinde çalışır mı?">
    Evet. Gateway hafiftir - belgeler kişisel kullanım için **512MB-1GB RAM**, **1 çekirdek** ve yaklaşık **500MB**
    diskin yeterli olduğunu listeler ve bir **Raspberry Pi 4'ün çalıştırabileceğini** belirtir.

    Ek pay istiyorsanız (günlükler, medya, diğer servisler), **2GB önerilir**, ancak bu
    kesin bir minimum değildir.

    İpucu: küçük bir Raspberry Pi/VPS Gateway'i barındırabilir; yerel ekran/kamera/canvas veya komut yürütme için
    dizüstü bilgisayarınızda/telefonunuzda **node'ları** eşleştirebilirsiniz. Bkz. [Node'lar](/tr/nodes).

  </Accordion>

  <Accordion title="Raspberry Pi kurulumları için ipucu var mı?">
    Kısa sürüm: çalışır, ancak pürüzler bekleyin.

    - **64-bit** OS kullanın ve Node >= 22 tutun.
    - Günlükleri görebilmek ve hızlı güncellemek için **hacklenebilir (git) kurulumu** tercih edin.
    - Kanallar/skills olmadan başlayın, sonra bunları tek tek ekleyin.
    - Garip binary sorunlarıyla karşılaşırsanız, bu genellikle bir **ARM uyumluluğu** sorunudur.

    Belgeler: [Linux](/tr/platforms/linux), [Kurulum](/tr/install).

  </Accordion>

  <Accordion title="wake up my friend ekranında takıldı / onboarding hatch olmuyor. Şimdi ne yapmalıyım?">
    Bu ekran, Gateway'in erişilebilir ve kimliği doğrulanmış olmasına bağlıdır. TUI ayrıca ilk hatch sırasında
    "Wake up, my friend!" mesajını otomatik olarak gönderir. Bu satırı **yanıt olmadan** görüyorsanız
    ve token'lar 0'da kalıyorsa, agent hiç çalışmamıştır.

    1. Gateway'i yeniden başlatın:

    ```bash
    openclaw gateway restart
    ```

    2. Durum + kimlik doğrulamayı kontrol edin:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Hâlâ takılıyorsa şunu çalıştırın:

    ```bash
    openclaw doctor
    ```

    Gateway uzaktaysa, tünel/Tailscale bağlantısının açık olduğundan ve UI'ın
    doğru Gateway'e yönlendirildiğinden emin olun. Bkz. [Uzak erişim](/tr/gateway/remote).

  </Accordion>

  <Accordion title="Onboarding'i yeniden yapmadan kurulumumu yeni bir makineye (Mac mini) taşıyabilir miyim?">
    Evet. **Durum dizinini** ve **workspace'i** kopyalayın, sonra Doctor'ı bir kez çalıştırın. Bu,
    **her iki** konumu da kopyaladığınız sürece bot'unuzu "tamamen aynı" (memory, oturum geçmişi, kimlik doğrulama ve kanal
    durumu) tutar:

    1. Yeni makineye OpenClaw kurun.
    2. Eski makineden `$OPENCLAW_STATE_DIR` (varsayılan: `~/.openclaw`) kopyalayın.
    3. Workspace'inizi kopyalayın (varsayılan: `~/.openclaw/workspace`).
    4. `openclaw doctor` çalıştırın ve Gateway servisini yeniden başlatın.

    Bu, yapılandırmayı, kimlik doğrulama profillerini, WhatsApp kimlik bilgilerini, oturumları ve memory'yi korur. Uzak
    moddaysanız, session store ve workspace'in gateway host'una ait olduğunu unutmayın.

    **Önemli:** yalnızca workspace'inizi GitHub'a commit/push ederseniz,
    **memory + bootstrap dosyalarını** yedeklemiş olursunuz, ancak oturum geçmişini veya kimlik doğrulamayı **yedeklemiş olmazsınız**. Bunlar
    `~/.openclaw/` altında yaşar (örneğin `~/.openclaw/agents/<agentId>/sessions/`).

    İlgili: [Taşıma](/tr/install/migrating), [Diskte neler nerede bulunur](/tr/help/faq#where-things-live-on-disk),
    [Agent workspace](/tr/concepts/agent-workspace), [Doctor](/tr/gateway/doctor),
    [Uzak mod](/tr/gateway/remote).

  </Accordion>

  <Accordion title="En son sürümde nelerin yeni olduğunu nereden görürüm?">
    GitHub changelog'unu kontrol edin:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    En yeni girdiler en üsttedir. En üstteki bölüm **Unreleased** olarak işaretlenmişse, bir sonraki tarihli
    bölüm yayımlanmış en son sürümdür. Girdiler **Öne çıkanlar**, **Değişiklikler** ve
    **Düzeltmeler** (gerektiğinde belgeler/diğer bölümlerle birlikte) altında gruplanır.

  </Accordion>

  <Accordion title="docs.openclaw.ai'ye erişilemiyor (SSL hatası)">
    Bazı Comcast/Xfinity bağlantıları, Xfinity Advanced Security üzerinden `docs.openclaw.ai` adresini yanlışlıkla engeller.
    Bunu devre dışı bırakın veya `docs.openclaw.ai` adresini allowlist'e ekleyin, ardından tekrar deneyin.
    Engelini kaldırmamıza yardımcı olmak için lütfen burada bildirin: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Siteye hâlâ erişemiyorsanız dokümanlar GitHub’da yansıtılmıştır:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Kararlı ve beta arasındaki fark">
    **Kararlı** ve **beta**, ayrı kod hatları değil, **npm dist-tag** değerleridir:

    - `latest` = kararlı
    - `beta` = test için erken derleme

    Genellikle kararlı bir sürüm önce **beta** üzerine gelir, ardından açık bir
    yükseltme adımı aynı sürümü `latest` konumuna taşır. Bakımcılar gerektiğinde
    doğrudan `latest` üzerine de yayımlayabilir. Bu yüzden beta ve kararlı,
    yükseltmeden sonra **aynı sürümü** gösterebilir.

    Nelerin değiştiğini görün:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Kurulum tek satırlıkları ve beta ile dev arasındaki fark için aşağıdaki akordiyona bakın.

  </Accordion>

  <Accordion title="Beta sürümü nasıl kurarım ve beta ile dev arasındaki fark nedir?">
    **Beta**, npm dist-tag değeri olan `beta`’dır (yükseltmeden sonra `latest` ile eşleşebilir).
    **Dev**, `main` dalının hareketli başıdır (git); yayımlandığında npm dist-tag değeri olarak `dev` kullanır.

    Tek satırlıklar (macOS/Linux):

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

    2. **Düzenlenebilir kurulum (yükleyici sitesinden):**

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

    Dokümanlar: [Güncelle](/tr/cli/update), [Geliştirme kanalları](/tr/install/development-channels),
    [Kurulum](/tr/install).

  </Accordion>

  <Accordion title="Kurulum ve ilk yapılandırma genellikle ne kadar sürer?">
    Yaklaşık rehber:

    - **Kurulum:** 2-5 dakika
    - **QuickStart ilk yapılandırma:** genellikle birkaç dakika
    - **Tam ilk yapılandırma:** sağlayıcı oturum açma, kanal eşleştirme, daemon kurulumu,
      ağ indirmeleri, skills veya isteğe bağlı plugins ek kurulum gerektirdiğinde daha uzun sürer

    CLI sihirbazı bu zaman çizelgesini başta gösterir. İsteğe bağlı adımları atlayıp
    daha sonra `openclaw configure` ile geri dönebilirsiniz.

    Takılırsa [Yükleyici takıldı](#quick-start-and-first-run-setup)
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

    Düzenlenebilir (git) kurulum için:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows (PowerShell) karşılığı:

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
    - PowerShell’i kapatıp yeniden açın, ardından yükleyiciyi tekrar çalıştırın.

    **2) openclaw kurulumdan sonra tanınmıyor**

    - npm global bin klasörünüz PATH üzerinde değil.
    - Yolu kontrol edin:

      ```powershell
      npm config get prefix
      ```

    - Bu dizini kullanıcı PATH’inize ekleyin (Windows’ta `\bin` sonekine gerek yoktur; çoğu sistemde `%AppData%\npm` olur).
    - PATH’i güncelledikten sonra PowerShell’i kapatıp yeniden açın.

    Masaüstü kurulumu için yerel **Windows Hub** uygulamasını kullanın. Yalnızca terminal
    kurulumu için PowerShell yükleyicisi ve WSL2 Gateway yolları desteklenir.
    Dokümanlar: [Windows](/tr/platforms/windows).

  </Accordion>

  <Accordion title="Windows exec çıktısı bozuk Çince metin gösteriyor - ne yapmalıyım?">
    Bu genellikle yerel Windows kabuklarında konsol kod sayfası uyumsuzluğudur.

    Belirtiler:

    - `system.run`/`exec` çıktısı Çinceyi mojibake olarak işler
    - Aynı komut başka bir terminal profilinde düzgün görünür

    PowerShell’de hızlı geçici çözüm:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Ardından Gateway’i yeniden başlatın ve komutunuzu tekrar deneyin:

    ```powershell
    openclaw gateway restart
    ```

    Bunu en son OpenClaw’da hâlâ yeniden üretebiliyorsanız şurada takip edin/bildirin:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Dokümanlar sorumu yanıtlamadı - nasıl daha iyi bir yanıt alırım?">
    Tam kaynak ve dokümanlar yerelde olsun diye **düzenlenebilir (git) kurulumu** kullanın, ardından
    botunuza (veya Claude/Codex’e) _o klasörden_ sorun; böylece repoyu okuyup kesin yanıt verebilir.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Daha fazla ayrıntı: [Kurulum](/tr/install) ve [Yükleyici bayrakları](/tr/install/installer).

  </Accordion>

  <Accordion title="OpenClaw’ı Linux’a nasıl kurarım?">
    Kısa yanıt: Linux rehberini izleyin, ardından ilk yapılandırmayı çalıştırın.

    - Linux hızlı yolu + servis kurulumu: [Linux](/tr/platforms/linux).
    - Tam anlatım: [Başlarken](/tr/start/getting-started).
    - Yükleyici + güncellemeler: [Kurulum ve güncellemeler](/tr/install/updating).

  </Accordion>

  <Accordion title="OpenClaw’ı VPS üzerine nasıl kurarım?">
    Herhangi bir Linux VPS çalışır. Sunucuya kurun, ardından Gateway’e erişmek için SSH/Tailscale kullanın.

    Rehberler: [exe.dev](/tr/install/exe-dev), [Hetzner](/tr/install/hetzner), [Fly.io](/tr/install/fly).
    Uzaktan erişim: [Gateway uzaktan](/tr/gateway/remote).

  </Accordion>

  <Accordion title="Bulut/VPS kurulum rehberleri nerede?">
    Yaygın sağlayıcıları içeren bir **barındırma merkezi** tutuyoruz. Birini seçip rehberi izleyin:

    - [VPS barındırma](/tr/vps) (tüm sağlayıcılar tek yerde)
    - [Fly.io](/tr/install/fly)
    - [Hetzner](/tr/install/hetzner)
    - [exe.dev](/tr/install/exe-dev)

    Bulutta çalışma şekli: **Gateway sunucuda çalışır** ve ona
    dizüstünüzden/telefonunuzdan Control UI (veya Tailscale/SSH) üzerinden erişirsiniz. Durumunuz + çalışma alanınız
    sunucuda yaşar, bu yüzden ana makineyi doğruluk kaynağı olarak kabul edin ve yedekleyin.

    Yerel ekran/kamera/canvas erişimi sağlamak veya Gateway’i bulutta tutarken
    dizüstünüzde komutlar çalıştırmak için bu bulut Gateway’e **düğümler**
    (Mac/iOS/Android/headless) eşleyebilirsiniz.

    Merkez: [Platformlar](/tr/platforms). Uzaktan erişim: [Gateway uzaktan](/tr/gateway/remote).
    Düğümler: [Düğümler](/tr/nodes), [Düğümler CLI](/tr/cli/nodes).

  </Accordion>

  <Accordion title="OpenClaw’dan kendini güncellemesini isteyebilir miyim?">
    Kısa yanıt: **mümkün, önerilmez**. Güncelleme akışı Gateway’i yeniden
    başlatabilir (bu da etkin oturumu düşürür), temiz bir git checkout gerektirebilir ve
    onay isteyebilir. Daha güvenlisi: güncellemeleri operatör olarak bir kabuktan çalıştırın.

    CLI kullanın:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Bir ajandan otomasyon yapmanız gerekiyorsa:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Dokümanlar: [Güncelle](/tr/cli/update), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="İlk yapılandırma gerçekte ne yapar?">
    `openclaw onboard` önerilen kurulum yoludur. **Yerel modda** size şunlarda rehberlik eder:

    - **Model/kimlik doğrulama kurulumu** (sağlayıcı OAuth, API anahtarları, Anthropic setup-token, ayrıca LM Studio gibi yerel model seçenekleri)
    - **Çalışma alanı** konumu + bootstrap dosyaları
    - **Gateway ayarları** (bind/port/auth/tailscale)
    - **Kanallar** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, ayrıca QQ Bot gibi paketli kanal plugins)
    - **Daemon kurulumu** (macOS’ta LaunchAgent; Linux/WSL2’de systemd kullanıcı birimi)
    - **Sağlık kontrolleri** ve **skills** seçimi

    Ayrıca ana istemler başlamadan önce süre beklentilerini belirler ve yapılandırılmış
    modeliniz bilinmiyorsa veya kimlik doğrulaması eksikse uyarır.

  </Accordion>

  <Accordion title="Bunu çalıştırmak için Claude veya OpenAI aboneliğine ihtiyacım var mı?">
    Hayır. OpenClaw’ı **API anahtarları** (Anthropic/OpenAI/diğerleri) ile veya
    verileriniz cihazınızda kalsın diye **yalnızca yerel modellerle** çalıştırabilirsiniz. Abonelikler (Claude
    Pro/Max veya OpenAI Codex), bu sağlayıcılarda kimlik doğrulamak için isteğe bağlı yollardır.

    OpenClaw’da Anthropic için pratik ayrım şöyledir:

    - **Anthropic API anahtarı**: normal Anthropic API faturalandırması
    - **OpenClaw’da Claude CLI / Claude abonelik kimlik doğrulaması**: Anthropic çalışanları
      bize bu kullanımın yeniden izinli olduğunu söyledi ve OpenClaw, Anthropic yeni bir
      politika yayımlamadığı sürece `claude -p`
      kullanımını bu entegrasyon için onaylı kabul ediyor

    Uzun ömürlü gateway ana makineleri için Anthropic API anahtarları hâlâ daha
    öngörülebilir kurulumdur. OpenAI Codex OAuth, OpenClaw gibi harici
    araçlar için açıkça desteklenir.

    OpenClaw ayrıca **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** ve
    **Z.AI / GLM Coding Plan** dahil başka barındırılan abonelik tarzı seçenekleri de destekler.

    Dokümanlar: [Anthropic](/tr/providers/anthropic), [OpenAI](/tr/providers/openai),
    [Qwen Cloud](/tr/providers/qwen),
    [MiniMax](/tr/providers/minimax), [Z.AI (GLM)](/tr/providers/zai),
    [Yerel modeller](/tr/gateway/local-models), [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="API anahtarı olmadan Claude Max aboneliğini kullanabilir miyim?">
    Evet.

    Anthropic çalışanları bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi, bu yüzden
    OpenClaw, Anthropic yeni bir politika yayımlamadığı sürece Claude abonelik kimlik doğrulamasını ve `claude -p` kullanımını
    bu entegrasyon için onaylı kabul eder. En öngörülebilir sunucu tarafı kurulumu istiyorsanız bunun yerine
    bir Anthropic API anahtarı kullanın.

  </Accordion>

  <Accordion title="Claude abonelik kimlik doğrulamasını destekliyor musunuz (Claude Pro veya Max)?">
    Evet.

    Anthropic çalışanları bize bu kullanımın yeniden izinli olduğunu söyledi, bu yüzden OpenClaw,
    Anthropic yeni bir politika yayımlamadığı sürece Claude CLI yeniden kullanımını ve `claude -p` kullanımını
    bu entegrasyon için onaylı kabul eder.

    Anthropic setup-token hâlâ desteklenen bir OpenClaw token yolu olarak kullanılabilir, ancak OpenClaw artık mevcut olduğunda Claude CLI yeniden kullanımını ve `claude -p` yolunu tercih eder.
    Üretim veya çok kullanıcılı iş yükleri için Anthropic API anahtarı kimlik doğrulaması hâlâ
    daha güvenli ve daha öngörülebilir seçimdir. OpenClaw’da başka abonelik tarzı barındırılan
    seçenekler istiyorsanız [OpenAI](/tr/providers/openai), [Qwen / Model
    Cloud](/tr/providers/qwen), [MiniMax](/tr/providers/minimax) ve [GLM
    Modelleri](/tr/providers/zai) sayfalarına bakın.

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

  <AccordionGroup>
  <Accordion title="Anthropic'ten neden HTTP 429 rate_limit_error görüyorum?">
    Bu, geçerli pencere için **Anthropic kota/hız sınırınızın** tükendiği anlamına gelir. **Claude CLI** kullanıyorsanız pencerenin sıfırlanmasını bekleyin veya planınızı yükseltin. **Anthropic API anahtarı** kullanıyorsanız kullanım/faturalandırma için Anthropic Console'u kontrol edin ve gerektiğinde sınırları artırın.

    Mesaj özellikle şuysa:
    `Extra usage is required for long context requests`, istek Anthropic'in 1M bağlam penceresini kullanmaya çalışıyordur (GA destekli 1M Claude 4.x modeli veya eski `context1m: true` yapılandırması). Bu yalnızca kimlik bilginiz uzun bağlam faturalandırmasına uygunsa çalışır (API anahtarı faturalandırması veya Extra Usage etkin OpenClaw Claude giriş yolu).

    İpucu: OpenClaw'ın bir sağlayıcı hız sınırına takıldığında yanıt vermeyi sürdürebilmesi için bir **yedek model** ayarlayın.
    Bkz. [Modeller](/tr/cli/models), [OAuth](/tr/concepts/oauth) ve
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/tr/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock destekleniyor mu?">
    Evet. OpenClaw paketlenmiş bir **Amazon Bedrock (Converse)** sağlayıcısına sahiptir. AWS ortam işaretleri mevcut olduğunda OpenClaw, akış/metin Bedrock kataloğunu otomatik keşfedip örtük bir `amazon-bedrock` sağlayıcısı olarak birleştirebilir; aksi halde `plugins.entries.amazon-bedrock.config.discovery.enabled` ayarını açıkça etkinleştirebilir veya manuel bir sağlayıcı girdisi ekleyebilirsiniz. Bkz. [Amazon Bedrock](/tr/providers/bedrock) ve [Model sağlayıcıları](/tr/providers/models). Yönetilen bir anahtar akışını tercih ediyorsanız Bedrock önünde OpenAI uyumlu bir proxy hâlâ geçerli bir seçenektir.
  </Accordion>

  <Accordion title="Codex kimlik doğrulaması nasıl çalışır?">
    OpenClaw, OAuth (ChatGPT oturum açma) üzerinden **OpenAI Code (Codex)** destekler. Yaygın kurulum için `openai/gpt-5.5` kullanın: ChatGPT/Codex abonelik kimlik doğrulaması artı yerel Codex uygulama sunucusu yürütmesi. Eski Codex GPT başvuruları, `openclaw doctor --fix` tarafından onarılan eski yapılandırmadır. Doğrudan OpenAI API anahtarı erişimi, ajan olmayan OpenAI API yüzeyleri ve sıralı bir `openai` API anahtarı profili üzerinden ajan modelleri için kullanılabilir kalır.
    Bkz. [Model sağlayıcıları](/tr/concepts/model-providers) ve [İlk kurulum (CLI)](/tr/start/wizard).
  </Accordion>

  <Accordion title="OpenClaw neden hâlâ eski OpenAI Codex önekinden bahsediyor?">
    `openai`, hem OpenAI API anahtarları hem de ChatGPT/Codex OAuth için sağlayıcı ve kimlik doğrulama profili kimliğidir. Eski yapılandırmada ve geçiş uyarılarında hâlâ eski OpenAI Codex önekini görebilirsiniz.
    Daha eski yapılandırmalar bunu model öneki olarak da kullanıyordu:

    - `openai/gpt-5.5` = ajan dönüşleri için yerel Codex runtime ile ChatGPT/Codex abonelik kimlik doğrulaması
    - eski Codex GPT-5.5 ref = `openclaw doctor --fix` tarafından onarılan eski model rotası
    - `openai/gpt-5.5` artı sıralı bir `openai` API anahtarı profili = bir OpenAI ajan modeli için API anahtarı kimlik doğrulaması
    - eski Codex kimlik doğrulama profili kimlikleri = `openclaw doctor --fix` tarafından taşınan eski kimlik doğrulama profili kimliği

    Doğrudan OpenAI Platform faturalandırma/sınır yolunu istiyorsanız `OPENAI_API_KEY` ayarlayın. ChatGPT/Codex abonelik kimlik doğrulaması istiyorsanız `openclaw models auth login --provider openai` ile oturum açın. Model ref değerini `openai/gpt-5.5` olarak tutun; eski Codex model ref değerleri, `openclaw doctor --fix` tarafından yeniden yazılan eski yapılandırmadır.

  </Accordion>

  <Accordion title="Codex OAuth sınırları neden ChatGPT web'den farklı olabilir?">
    Codex OAuth, OpenAI tarafından yönetilen, plana bağlı kota pencereleri kullanır. Pratikte bu sınırlar, ikisi de aynı hesaba bağlı olsa bile ChatGPT web sitesi/uygulama deneyiminden farklı olabilir.

    OpenClaw, o anda görünen sağlayıcı kullanım/kota pencerelerini `openclaw models status` içinde gösterebilir, ancak ChatGPT web haklarını doğrudan API erişimine uydurmaz veya normalleştirmez. Doğrudan OpenAI Platform faturalandırma/sınır yolunu istiyorsanız bir API anahtarıyla `openai/*` kullanın.

  </Accordion>

  <Accordion title="OpenAI abonelik kimlik doğrulamasını (Codex OAuth) destekliyor musunuz?">
    Evet. OpenClaw, **OpenAI Code (Codex) abonelik OAuth** desteğini tam olarak sunar.
    OpenAI, OpenClaw gibi harici araçlarda/iş akışlarında abonelik OAuth kullanımına açıkça izin verir. İlk kurulum OAuth akışını sizin için çalıştırabilir.

    Bkz. [OAuth](/tr/concepts/oauth), [Model sağlayıcıları](/tr/concepts/model-providers) ve [İlk kurulum (CLI)](/tr/start/wizard).

  </Accordion>

  <Accordion title="Gemini CLI OAuth'u nasıl kurarım?">
    Gemini CLI, `openclaw.json` içinde bir istemci kimliği veya gizli anahtar değil, bir **Plugin kimlik doğrulama akışı** kullanır.

    Adımlar:

    1. Gemini CLI'yi yerel olarak kurun, böylece `gemini` `PATH` üzerinde olur
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin'i etkinleştirin: `openclaw plugins enable google`
    3. Oturum açın: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Oturum açtıktan sonraki varsayılan model: `google-gemini-cli/gemini-3-flash-preview`
    5. İstekler başarısız olursa Gateway ana makinesinde `GOOGLE_CLOUD_PROJECT` veya `GOOGLE_CLOUD_PROJECT_ID` ayarlayın

    Bu, OAuth token'larını Gateway ana makinesindeki kimlik doğrulama profillerinde saklar. Ayrıntılar: [Model sağlayıcıları](/tr/concepts/model-providers).

  </Accordion>

  <Accordion title="Gündelik sohbetler için yerel model uygun mu?">
    Genellikle hayır. OpenClaw büyük bağlam + güçlü güvenlik gerektirir; küçük kartlar kırpar ve sızıntı yapar. Mecbursanız yerel olarak çalıştırabileceğiniz **en büyük** model derlemesini çalıştırın (LM Studio) ve bkz. [/gateway/local-models](/tr/gateway/local-models). Daha küçük/nicelenmiş modeller prompt injection riskini artırır - bkz. [Güvenlik](/tr/gateway/security).
  </Accordion>

  <Accordion title="Barındırılan model trafiğini belirli bir bölgede nasıl tutarım?">
    Bölgeye sabitlenmiş uç noktaları seçin. OpenRouter, MiniMax, Kimi ve GLM için ABD'de barındırılan seçenekler sunar; verileri bölgede tutmak için ABD'de barındırılan varyantı seçin. Seçtiğiniz bölgesel sağlayıcıya saygı gösterirken yedeklerin kullanılabilir kalması için `models.mode: "merge"` kullanarak Anthropic/OpenAI modellerini bunların yanında listeleyebilirsiniz.
  </Accordion>

  <Accordion title="Bunu kurmak için Mac Mini satın almam gerekir mi?">
    Hayır. OpenClaw macOS veya Linux üzerinde çalışır (Windows, WSL2 üzerinden). Mac mini isteğe bağlıdır - bazı kişiler her zaman açık bir ana makine olarak bir tane satın alır, ancak küçük bir VPS, ev sunucusu veya Raspberry Pi sınıfı bir kutu da çalışır.

    Yalnızca **macOS'a özel araçlar** için Mac gerekir. iMessage için, Messages'a giriş yapılmış herhangi bir Mac'te `imsg` ile [iMessage](/tr/channels/imessage) kullanın. Gateway Linux üzerinde veya başka bir yerde çalışıyorsa `channels.imessage.cliPath` değerini o Mac'te `imsg` çalıştıran bir SSH sarmalayıcısına ayarlayın. Başka macOS'a özel araçlar istiyorsanız Gateway'i bir Mac'te çalıştırın veya bir macOS node eşleştirin.

    Dokümanlar: [iMessage](/tr/channels/imessage), [Node'lar](/tr/nodes), [Mac uzak modu](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="iMessage desteği için Mac mini gerekir mi?">
    Messages'a giriş yapılmış **bir macOS cihazına** ihtiyacınız vardır. Bunun Mac mini olması **gerekmez** -
    herhangi bir Mac çalışır. **`imsg` ile [iMessage](/tr/channels/imessage) kullanın**; Gateway o Mac'te çalışabilir veya bir SSH sarmalayıcısı `cliPath` ile başka bir yerde çalışabilir.

    Yaygın kurulumlar:

    - Gateway'i Linux/VPS üzerinde çalıştırın ve `channels.imessage.cliPath` değerini Messages'a giriş yapılmış bir Mac'te `imsg` çalıştıran bir SSH sarmalayıcısına ayarlayın.
    - En basit tek makine kurulumunu istiyorsanız her şeyi Mac üzerinde çalıştırın.

    Dokümanlar: [iMessage](/tr/channels/imessage), [Node'lar](/tr/nodes),
    [Mac uzak modu](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="OpenClaw çalıştırmak için Mac mini alırsam onu MacBook Pro'ma bağlayabilir miyim?">
    Evet. **Mac mini Gateway'i çalıştırabilir** ve MacBook Pro'nuz bir **node** (yardımcı cihaz) olarak bağlanabilir. Node'lar Gateway çalıştırmaz - o cihazda ekran/kamera/tuval ve `system.run` gibi ek yetenekler sağlar.

    Yaygın desen:

    - Gateway Mac mini üzerinde (her zaman açık).
    - MacBook Pro macOS uygulamasını veya bir node ana makinesini çalıştırır ve Gateway ile eşleşir.
    - Bunu görmek için `openclaw nodes status` / `openclaw nodes list` kullanın.

    Dokümanlar: [Node'lar](/tr/nodes), [Nodes CLI](/tr/cli/nodes).

  </Accordion>

  <Accordion title="Bun kullanabilir miyim?">
    Bun **önerilmez**. Özellikle WhatsApp ve Telegram ile runtime hataları görüyoruz.
    Kararlı gateway'ler için **Node** kullanın.

    Yine de Bun ile deneme yapmak istiyorsanız bunu WhatsApp/Telegram olmayan, üretim dışı bir gateway üzerinde yapın.

  </Accordion>

  <Accordion title="Telegram: allowFrom içine ne girilir?">
    `channels.telegram.allowFrom`, **insan gönderenin Telegram kullanıcı kimliğidir** (sayısal). Bot kullanıcı adı değildir.

    Kurulum yalnızca sayısal kullanıcı kimlikleri ister. Yapılandırmada hâlihazırda eski `@username` girdileriniz varsa `openclaw doctor --fix` bunları çözmeyi deneyebilir.

    Daha güvenli (üçüncü taraf bot yok):

    - Botunuza DM gönderin, ardından `openclaw logs --follow` çalıştırın ve `from.id` değerini okuyun.

    Resmi Bot API:

    - Botunuza DM gönderin, ardından `https://api.telegram.org/bot<bot_token>/getUpdates` çağırın ve `message.from.id` değerini okuyun.

    Üçüncü taraf (daha az özel):

    - `@userinfobot` veya `@getidsbot` hesabına DM gönderin.

    Bkz. [/channels/telegram](/tr/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Bir WhatsApp numarasını farklı OpenClaw örnekleriyle birden fazla kişi kullanabilir mi?">
    Evet, **çoklu ajan yönlendirme** üzerinden. Her gönderenin WhatsApp **DM**'ini (peer `kind: "direct"`, gönderen E.164 örn. `+15551234567`) farklı bir `agentId` değerine bağlayın; böylece herkes kendi çalışma alanına ve oturum deposuna sahip olur. Yanıtlar yine **aynı WhatsApp hesabından** gelir ve DM erişim denetimi (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) WhatsApp hesabı başına geneldir. Bkz. [Çoklu Ajan Yönlendirme](/tr/concepts/multi-agent) ve [WhatsApp](/tr/channels/whatsapp).
  </Accordion>

  <Accordion title='"Hızlı sohbet" ajanı ve "kodlama için Opus" ajanı çalıştırabilir miyim?'>
    Evet. Çoklu ajan yönlendirme kullanın: her ajana kendi varsayılan modelini verin, ardından gelen rotaları (sağlayıcı hesabı veya belirli peer'lar) her ajana bağlayın. Örnek yapılandırma [Çoklu Ajan Yönlendirme](/tr/concepts/multi-agent) içinde yer alır. Ayrıca bkz. [Modeller](/tr/concepts/models) ve [Yapılandırma](/tr/gateway/configuration).
  </Accordion>

  <Accordion title="Homebrew Linux üzerinde çalışır mı?">
    Evet. Homebrew Linux'u destekler (Linuxbrew). Hızlı kurulum:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    OpenClaw'ı systemd üzerinden çalıştırıyorsanız, `brew` ile kurulan araçların oturum açma olmayan kabuklarda çözümlenebilmesi için servis PATH değerinin `/home/linuxbrew/.linuxbrew/bin` (veya brew önekinizi) içerdiğinden emin olun.
    Son derlemeler ayrıca Linux systemd servislerinde yaygın kullanıcı bin dizinlerini başa ekler (örneğin `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) ve ayarlandığında `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` ve `FNM_DIR` değerlerini dikkate alır.

  </Accordion>

  <Accordion title="Hacklenebilir git kurulumu ile npm kurulumu arasındaki fark">
    - **Hacklenebilir (git) kurulum:** tam kaynak checkout, düzenlenebilir, katkıda bulunanlar için en iyisi.
      Derlemeleri yerel olarak çalıştırırsınız ve kod/dokümanlara yama yapabilirsiniz.
    - **npm kurulumu:** global CLI kurulumu, repo yok, "sadece çalıştırmak" için en iyisi.
      Güncellemeler npm dist-tag'lerinden gelir.

    Dokümanlar: [Başlarken](/tr/start/getting-started), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="npm ve git kurulumları arasında daha sonra geçiş yapabilir miyim?">
    Evet. OpenClaw zaten kuruluysa `openclaw update --channel ...` kullanın.
    Bu **verilerinizi silmez** - yalnızca OpenClaw kod kurulumunu değiştirir.
    Durumunuz (`~/.openclaw`) ve çalışma alanınız (`~/.openclaw/workspace`) dokunulmadan kalır.

    npm'den git'e:

    ```bash
    openclaw update --channel dev
    ```

    git'ten npm'e:

    ```bash
    openclaw update --channel stable
    ```

    Planlanan mod değişikliğini önce önizlemek için `--dry-run` ekleyin. Güncelleyici
    Doctor takip işlemlerini çalıştırır, hedef kanal için plugin kaynaklarını yeniler ve
    `--no-restart` geçmediğiniz sürece gateway'i yeniden başlatır.

    Yükleyici iki modu da zorunlu kılabilir:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Yedekleme ipuçları: bkz. [Yedekleme stratejisi](/tr/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Gateway'i dizüstü bilgisayarımda mı yoksa bir VPS'te mi çalıştırmalıyım?">
    Kısa yanıt: **7/24 güvenilirlik istiyorsanız, VPS kullanın**. En düşük
    sürtünmeyi istiyorsanız ve uyku/yeniden başlatmalar sizin için sorun değilse, yerel olarak çalıştırın.

    **Dizüstü bilgisayar (yerel Gateway)**

    - **Artıları:** sunucu maliyeti yok, yerel dosyalara doğrudan erişim, canlı tarayıcı penceresi.
    - **Eksileri:** uyku/ağ kesintileri = bağlantı kopmaları, işletim sistemi güncellemeleri/yeniden başlatmaları kesintiye uğratır, uyanık kalması gerekir.

    **VPS / bulut**

    - **Artıları:** her zaman açık, kararlı ağ, dizüstü bilgisayar uyku sorunları yok, çalışır halde tutması daha kolay.
    - **Eksileri:** genellikle başsız çalışır (ekran görüntüleri kullanın), yalnızca uzaktan dosya erişimi, güncellemeler için SSH kullanmanız gerekir.

    **OpenClaw'a özel not:** WhatsApp/Telegram/Slack/Mattermost/Discord bir VPS'ten sorunsuz çalışır. Tek gerçek ödünleşim **başsız tarayıcı** ile görünür pencere arasındadır. Bkz. [Tarayıcı](/tr/tools/browser).

    **Önerilen varsayılan:** Daha önce gateway bağlantı kopmaları yaşadıysanız VPS. Mac'i etkin olarak kullanırken ve görünür bir tarayıcıyla yerel dosya erişimi veya UI otomasyonu istediğinizde yerel kullanım harikadır.

  </Accordion>

  <Accordion title="OpenClaw'ı ayrılmış bir makinede çalıştırmak ne kadar önemlidir?">
    Zorunlu değildir, ancak **güvenilirlik ve yalıtım için önerilir**.

    - **Ayrılmış ana makine (VPS/Mac mini/Raspberry Pi):** her zaman açık, daha az uyku/yeniden başlatma kesintisi, daha temiz izinler, çalışır halde tutması daha kolay.
    - **Paylaşılan dizüstü/masaüstü:** test ve etkin kullanım için tamamen uygundur, ancak makine uyuduğunda veya güncellendiğinde duraklamalar bekleyin.

    İki dünyanın en iyisini istiyorsanız, Gateway'i ayrılmış bir ana makinede tutun ve dizüstü bilgisayarınızı yerel ekran/kamera/exec araçları için bir **düğüm** olarak eşleştirin. Bkz. [Düğümler](/tr/nodes).
    Güvenlik yönergeleri için [Güvenlik](/tr/gateway/security) bölümünü okuyun.

  </Accordion>

  <Accordion title="Minimum VPS gereksinimleri ve önerilen işletim sistemi nelerdir?">
    OpenClaw hafiftir. Temel bir Gateway + bir sohbet kanalı için:

    - **Mutlak minimum:** 1 vCPU, 1GB RAM, ~500MB disk.
    - **Önerilen:** ek kapasite için 1-2 vCPU, 2GB RAM veya daha fazlası (günlükler, medya, birden çok kanal). Node araçları ve tarayıcı otomasyonu kaynak tüketebilir.

    İşletim sistemi: **Ubuntu LTS** kullanın (veya modern bir Debian/Ubuntu). Linux kurulum yolu en iyi burada test edilmiştir.

    Dokümanlar: [Linux](/tr/platforms/linux), [VPS barındırma](/tr/vps).

  </Accordion>

  <Accordion title="OpenClaw'ı bir VM'de çalıştırabilir miyim ve gereksinimler nelerdir?">
    Evet. Bir VM'yi VPS ile aynı şekilde ele alın: her zaman açık, erişilebilir olmalı ve Gateway ile etkinleştirdiğiniz kanallar için yeterli
    RAM'e sahip olmalıdır.

    Temel yönergeler:

    - **Mutlak minimum:** 1 vCPU, 1GB RAM.
    - **Önerilen:** birden çok kanal, tarayıcı otomasyonu veya medya araçları çalıştırıyorsanız 2GB RAM veya daha fazlası.
    - **İşletim sistemi:** Ubuntu LTS veya başka bir modern Debian/Ubuntu.

    Windows kullanıyorsanız masaüstü kurulumu için **Windows Hub** kullanın veya özellikle geniş araç uyumluluğuna sahip Linux tarzı bir Gateway VM istediğinizde WSL2 kullanın. Bkz. [Windows](/tr/platforms/windows), [VPS barındırma](/tr/vps).
    macOS'i bir VM'de çalıştırıyorsanız bkz. [macOS VM](/tr/install/macos-vm).

  </Accordion>
</AccordionGroup>

## İlgili

- [SSS](/tr/help/faq) — ana SSS (modeller, oturumlar, gateway, güvenlik, daha fazlası)
- [Kuruluma genel bakış](/tr/install)
- [Başlarken](/tr/start/getting-started)
- [Sorun giderme](/tr/help/troubleshooting)

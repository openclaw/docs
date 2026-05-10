---
read_when:
    - Yeni kurulum, takılı kalan başlangıç süreci veya ilk çalıştırma hataları
    - Kimlik doğrulama ve sağlayıcı aboneliklerini seçme
    - docs.openclaw.ai'ye erişilemiyor, gösterge paneli açılamıyor, kurulum takıldı
sidebarTitle: First-run FAQ
summary: 'SSS: hızlı başlangıç ve ilk çalıştırma kurulumu — yükleme, başlangıç yapılandırması, kimlik doğrulama, abonelikler, ilk hatalar'
title: 'SSS: ilk çalıştırma kurulumu'
x-i18n:
    generated_at: "2026-05-10T19:40:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: f19f755d41dc09c17e20845487037d1edc338d0edff5fc0190973f3d72a7f0ab
    source_path: help/faq-first-run.md
    workflow: 16
---

  Hızlı başlangıç ve ilk çalıştırma SSS. Günlük işlemler, modeller, kimlik doğrulama, oturumlar
  ve sorun giderme için ana [SSS](/tr/help/faq) sayfasına bakın.

  ## Hızlı başlangıç ve ilk çalıştırma kurulumu

  <AccordionGroup>
  <Accordion title="Takıldım, en hızlı şekilde nasıl ilerlerim?">
    **Makinenizi görebilen** yerel bir AI ajanı kullanın. Bu, Discord'da sormaktan çok daha etkilidir,
    çünkü çoğu "takıldım" durumu, uzaktaki yardımcıların inceleyemeyeceği **yerel yapılandırma veya ortam sorunlarıdır**.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Bu araçlar repo'yu okuyabilir, komutları çalıştırabilir, günlükleri inceleyebilir ve makine düzeyindeki
    kurulumunuzu (PATH, servisler, izinler, kimlik doğrulama dosyaları) düzeltmeye yardımcı olabilir. Hacklenebilir (git)
    kurulum aracılığıyla onlara **tam kaynak checkout'unu** verin:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Bu, OpenClaw'ı **bir git checkout'undan** kurar; böylece ajan kodu + dokümanları okuyabilir ve
    çalıştırdığınız tam sürüm hakkında akıl yürütebilir. Daha sonra yükleyiciyi `--install-method git`
    olmadan yeniden çalıştırarak her zaman kararlı sürüme geri dönebilirsiniz.

    İpucu: ajandan düzeltmeyi **planlamasını ve denetlemesini** isteyin (adım adım), ardından yalnızca
    gerekli komutları çalıştırın. Bu, değişiklikleri küçük ve denetlenmesi daha kolay tutar.

    Gerçek bir hata veya düzeltme keşfederseniz lütfen bir GitHub issue açın ya da PR gönderin:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Şu komutlarla başlayın (yardım isterken çıktıları paylaşın):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Ne yaparlar:

    - `openclaw status`: gateway/ajan sağlığı + temel yapılandırmanın hızlı anlık görüntüsü.
    - `openclaw models status`: sağlayıcı kimlik doğrulamasını + model kullanılabilirliğini kontrol eder.
    - `openclaw doctor`: yaygın yapılandırma/durum sorunlarını doğrular ve onarır.

    Diğer yararlı CLI kontrolleri: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Hızlı hata ayıklama döngüsü: [Bir şey bozuksa ilk 60 saniye](/tr/help/faq#first-60-seconds-if-something-is-broken).
    Kurulum dokümanları: [Kurulum](/tr/install), [Yükleyici bayrakları](/tr/install/installer), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="Heartbeat atlamaya devam ediyor. Atlama nedenleri ne anlama gelir?">
    Yaygın Heartbeat atlama nedenleri:

    - `quiet-hours`: yapılandırılmış etkin saatler penceresinin dışında
    - `empty-heartbeat-file`: `HEARTBEAT.md` var ama yalnızca boş/yalnızca başlık iskeleti içeriyor
    - `no-tasks-due`: `HEARTBEAT.md` görev modu etkin ama görev aralıklarının hiçbiri henüz gelmemiş
    - `alerts-disabled`: tüm heartbeat görünürlüğü devre dışı (`showOk`, `showAlerts` ve `useIndicator` tamamen kapalı)

    Görev modunda, vade zaman damgaları yalnızca gerçek bir heartbeat çalıştırması
    tamamlandıktan sonra ilerletilir. Atlanan çalıştırmalar görevleri tamamlandı olarak işaretlemez.

    Dokümanlar: [Heartbeat](/tr/gateway/heartbeat), [Otomasyon ve Görevler](/tr/automation).

  </Accordion>

  <Accordion title="OpenClaw'ı kurmak ve ayarlamak için önerilen yol">
    Repo, kaynaktan çalıştırmayı ve onboarding kullanmayı önerir:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Sihirbaz UI varlıklarını otomatik olarak da derleyebilir. Onboarding'den sonra Gateway'i genellikle **18789** portunda çalıştırırsınız.

    Kaynaktan (katkıda bulunanlar/geliştiriciler):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Henüz global bir kurulumunuz yoksa `pnpm openclaw onboard` ile çalıştırın.

  </Accordion>

  <Accordion title="Onboarding'den sonra dashboard'u nasıl açarım?">
    Sihirbaz, onboarding'den hemen sonra tarayıcınızı temiz (token'laştırılmamış) bir dashboard URL'siyle açar ve bağlantıyı özette de yazdırır. O sekmeyi açık tutun; açılmadıysa, yazdırılan URL'yi aynı makinede kopyalayıp yapıştırın.
  </Accordion>

  <Accordion title="Dashboard kimlik doğrulamasını localhost ile uzak ortamda nasıl yaparım?">
    **Localhost (aynı makine):**

    - `http://127.0.0.1:18789/` adresini açın.
    - Paylaşılan gizli anahtar kimlik doğrulaması isterse, yapılandırılmış token'ı veya parolayı Control UI ayarlarına yapıştırın.
    - Token kaynağı: `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`).
    - Parola kaynağı: `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`).
    - Henüz paylaşılan bir gizli anahtar yapılandırılmadıysa `openclaw doctor --generate-gateway-token` ile bir token oluşturun.

    **Localhost üzerinde değilse:**

    - **Tailscale Serve** (önerilir): bind loopback'i koruyun, `openclaw gateway --tailscale serve` çalıştırın, `https://<magicdns>/` adresini açın. `gateway.auth.allowTailscale` `true` ise kimlik başlıkları Control UI/WebSocket kimlik doğrulamasını karşılar (yapıştırılmış paylaşılan gizli anahtar gerekmez, güvenilir gateway host'u varsayılır); HTTP API'leri ise özel-ingress `none` veya güvenilir-proxy HTTP kimlik doğrulamasını özellikle kullanmadığınız sürece paylaşılan gizli anahtar kimlik doğrulaması gerektirir.
      Aynı istemciden gelen hatalı eşzamanlı Serve kimlik doğrulama girişimleri, başarısız kimlik doğrulama sınırlayıcısı bunları kaydetmeden önce sıraya alınır; bu nedenle ikinci hatalı yeniden deneme zaten `retry later` gösterebilir.
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` çalıştırın (veya parola kimlik doğrulamasını yapılandırın), `http://<tailscale-ip>:18789/` adresini açın, ardından eşleşen paylaşılan gizli anahtarı dashboard ayarlarına yapıştırın.
    - **Kimlik farkındalığı olan reverse proxy**: Gateway'i güvenilir bir proxy arkasında tutun, `gateway.auth.mode: "trusted-proxy"` yapılandırın, ardından proxy URL'sini açın. Aynı host üzerindeki loopback proxy'leri açık `gateway.auth.trustedProxy.allowLoopback = true` gerektirir.
    - **SSH tüneli**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, ardından `http://127.0.0.1:18789/` adresini açın. Paylaşılan gizli anahtar kimlik doğrulaması tünel üzerinden de geçerlidir; sorulursa yapılandırılmış token'ı veya parolayı yapıştırın.

    Bind modları ve kimlik doğrulama ayrıntıları için [Dashboard](/tr/web/dashboard) ve [Web yüzeyleri](/tr/web) bölümlerine bakın.

  </Accordion>

  <Accordion title="Sohbet onayları için neden iki exec onay yapılandırması var?">
    Farklı katmanları kontrol ederler:

    - `approvals.exec`: onay istemlerini sohbet hedeflerine iletir
    - `channels.<channel>.execApprovals`: o kanalın exec onayları için yerel bir onay istemcisi gibi davranmasını sağlar

    Host exec ilkesi hâlâ gerçek onay kapısıdır. Sohbet yapılandırması yalnızca onay
    istemlerinin nerede görüneceğini ve insanların bunları nasıl yanıtlayabileceğini kontrol eder.

    Çoğu kurulumda ikisine birden **ihtiyacınız yoktur**:

    - Sohbet zaten komutları ve yanıtları destekliyorsa, aynı sohbet `/approve` ortak yol üzerinden çalışır.
    - Desteklenen yerel bir kanal onaylayanları güvenli şekilde çıkarabiliyorsa, `channels.<channel>.execApprovals.enabled` ayarlanmamış veya `"auto"` olduğunda OpenClaw artık DM öncelikli yerel onayları otomatik etkinleştirir.
    - Yerel onay kartları/düğmeleri kullanılabildiğinde, bu yerel UI birincil yoldur; ajan yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın tek yol olduğunu söylüyorsa manuel `/approve` komutu eklemelidir.
    - `approvals.exec` yalnızca istemlerin başka sohbetlere veya açık operasyon odalarına da iletilmesi gerektiğinde kullanın.
    - `channels.<channel>.execApprovals.target: "channel"` veya `"both"` yalnızca onay istemlerinin açıkça kaynak odaya/konuya geri gönderilmesini istediğinizde kullanın.
    - Plugin onayları yine ayrıdır: varsayılan olarak aynı sohbet `/approve` kullanır, isteğe bağlı `approvals.plugin` yönlendirmesi vardır ve yalnızca bazı yerel kanallar bunun üstünde plugin-approval-native işlemeyi korur.

    Kısa sürüm: yönlendirme rota belirleme içindir, yerel istemci yapılandırması daha zengin kanala özel UX içindir.
    Bkz. [Exec Onayları](/tr/tools/exec-approvals).

  </Accordion>

  <Accordion title="Hangi runtime'a ihtiyacım var?">
    Node **>= 22** gereklidir. `pnpm` önerilir. Bun, Gateway için **önerilmez**.
  </Accordion>

  <Accordion title="Raspberry Pi üzerinde çalışır mı?">
    Evet. Gateway hafiftir; dokümanlar kişisel kullanım için **512MB-1GB RAM**, **1 çekirdek** ve yaklaşık **500MB**
    diskin yeterli olduğunu listeler ve **Raspberry Pi 4'ün çalıştırabildiğini** belirtir.

    Ek hareket alanı istiyorsanız (günlükler, medya, diğer servisler), **2GB önerilir**, ancak
    bu katı bir minimum değildir.

    İpucu: küçük bir Pi/VPS Gateway'i barındırabilir ve yerel ekran/kamera/canvas veya komut yürütme için
    dizüstü bilgisayarınızda/telefonunuzda **node'ları** eşleştirebilirsiniz. Bkz. [Node'lar](/tr/nodes).

  </Accordion>

  <Accordion title="Raspberry Pi kurulumları için ipucu var mı?">
    Kısa sürüm: çalışır, ancak pürüzlere hazırlıklı olun.

    - **64-bit** işletim sistemi kullanın ve Node >= 22 tutun.
    - Günlükleri görebilmek ve hızlı güncellemek için **hacklenebilir (git) kurulumu** tercih edin.
    - Kanallar/skills olmadan başlayın, sonra bunları tek tek ekleyin.
    - Tuhaf ikili dosya sorunlarıyla karşılaşırsanız, bu genellikle bir **ARM uyumluluğu** problemidir.

    Dokümanlar: [Linux](/tr/platforms/linux), [Kurulum](/tr/install).

  </Accordion>

  <Accordion title="Wake up my friend ekranında takıldı / onboarding hatch olmuyor. Şimdi ne yapmalıyım?">
    Bu ekran Gateway'in erişilebilir ve kimliği doğrulanmış olmasına bağlıdır. TUI ayrıca ilk hatch sırasında
    "Wake up, my friend!" mesajını otomatik gönderir. Bu satırı **yanıt olmadan** görüyorsanız
    ve token'lar 0'da kalıyorsa, ajan hiç çalışmamıştır.

    1. Gateway'i yeniden başlatın:

    ```bash
    openclaw gateway restart
    ```

    2. Durumu + kimlik doğrulamayı kontrol edin:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Hâlâ takılıyorsa şunu çalıştırın:

    ```bash
    openclaw doctor
    ```

    Gateway uzaksa tünel/Tailscale bağlantısının açık olduğundan ve UI'ın
    doğru Gateway'e yöneldiğinden emin olun. Bkz. [Uzaktan erişim](/tr/gateway/remote).

  </Accordion>

  <Accordion title="Kurulumumu onboarding'i yeniden yapmadan yeni bir makineye (Mac mini) taşıyabilir miyim?">
    Evet. **Durum dizinini** ve **çalışma alanını** kopyalayın, ardından Doctor'ı bir kez çalıştırın. Bu,
    **her iki** konumu da kopyaladığınız sürece botunuzu "tamamen aynı" (bellek, oturum geçmişi, kimlik doğrulama ve kanal
    durumu) tutar:

    1. Yeni makineye OpenClaw'ı kurun.
    2. Eski makineden `$OPENCLAW_STATE_DIR` (varsayılan: `~/.openclaw`) kopyalayın.
    3. Çalışma alanınızı kopyalayın (varsayılan: `~/.openclaw/workspace`).
    4. `openclaw doctor` çalıştırın ve Gateway servisini yeniden başlatın.

    Bu, yapılandırmayı, auth profillerini, WhatsApp kimlik bilgilerini, oturumları ve belleği korur. Uzak
    moddaysanız, oturum deposu ve çalışma alanının gateway host'una ait olduğunu unutmayın.

    **Önemli:** yalnızca çalışma alanınızı GitHub'a commit/push ederseniz,
    **bellek + bootstrap dosyalarını** yedeklemiş olursunuz, ancak **oturum geçmişi veya kimlik doğrulamayı** değil. Bunlar
    `~/.openclaw/` altında yaşar (örneğin `~/.openclaw/agents/<agentId>/sessions/`).

    İlgili: [Taşıma](/tr/install/migrating), [Diskte neler nerede yaşar](/tr/help/faq#where-things-live-on-disk),
    [Ajan çalışma alanı](/tr/concepts/agent-workspace), [Doctor](/tr/gateway/doctor),
    [Uzak mod](/tr/gateway/remote).

  </Accordion>

  <Accordion title="En son sürümde nelerin yeni olduğunu nereden görebilirim?">
    GitHub changelog'unu kontrol edin:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    En yeni girdiler üsttedir. Üst bölüm **Unreleased** olarak işaretliyse, sonraki tarihli
    bölüm en son yayımlanmış sürümdür. Girdiler **Highlights**, **Changes** ve
    **Fixes** (gerektiğinde docs/diğer bölümlerle birlikte) altında gruplandırılır.

  </Accordion>

  <Accordion title="docs.openclaw.ai adresine erişilemiyor (SSL hatası)">
    Bazı Comcast/Xfinity bağlantıları, Xfinity Advanced Security üzerinden `docs.openclaw.ai` adresini yanlış şekilde engeller.
    Bunu devre dışı bırakın veya `docs.openclaw.ai` adresini izin listesine alın, ardından tekrar deneyin.
    Engelin kaldırılmasına yardımcı olmak için lütfen burada bildirin: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Siteye hâlâ erişemiyorsanız belgeler GitHub'da yansıtılmıştır:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Kararlı ve beta arasındaki fark">
    **Kararlı** ve **beta**, ayrı kod satırları değil, **npm dist-tag**'leridir:

    - `latest` = kararlı
    - `beta` = test için erken derleme

    Genellikle kararlı bir sürüm önce **beta**'ya gelir, ardından açık bir
    yükseltme adımı aynı sürümü `latest`'e taşır. Bakımcılar gerektiğinde
    doğrudan `latest`'e de yayımlayabilir. Bu yüzden beta ve kararlı, yükseltmeden
    sonra **aynı sürüme** işaret edebilir.

    Nelerin değiştiğini görün:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Kurulum tek satırlıkları ve beta ile dev arasındaki fark için aşağıdaki akordiyona bakın.

  </Accordion>

  <Accordion title="Beta sürümünü nasıl kurarım ve beta ile dev arasındaki fark nedir?">
    **Beta**, npm dist-tag `beta`'dır (yükseltmeden sonra `latest` ile eşleşebilir).
    **Dev**, `main`'in hareketli başıdır (git); yayımlandığında npm dist-tag `dev` kullanır.

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

    2. **Hacklenebilir kurulum (yükleyici sitesinden):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Bu size düzenleyebileceğiniz yerel bir depo verir; ardından git üzerinden güncelleyebilirsiniz.

    Temiz bir klonu elle tercih ederseniz şunu kullanın:

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
    Kabaca kılavuz:

    - **Kurulum:** 2-5 dakika
    - **İlk yapılandırma:** yapılandırdığınız kanal/model sayısına bağlı olarak 5-15 dakika

    Takılırsa [Yükleyici takıldı](#quick-start-and-first-run-setup)
    ve [Takıldım](#quick-start-and-first-run-setup) içindeki hızlı hata ayıklama döngüsünü kullanın.

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

    Hacklenebilir (git) kurulum için:

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
    Windows'ta sık görülen iki sorun:

    **1) npm error spawn git / git not found**

    - **Git for Windows**'ı kurun ve `git`'in PATH'inizde olduğundan emin olun.
    - PowerShell'i kapatıp yeniden açın, ardından yükleyiciyi tekrar çalıştırın.

    **2) kurulumdan sonra openclaw tanınmıyor**

    - npm genel bin klasörünüz PATH'te değil.
    - Yolu kontrol edin:

      ```powershell
      npm config get prefix
      ```

    - Bu dizini kullanıcı PATH'inize ekleyin (Windows'ta `\bin` son eki gerekmez; çoğu sistemde `%AppData%\npm` olur).
    - PATH'i güncelledikten sonra PowerShell'i kapatıp yeniden açın.

    En sorunsuz Windows kurulumunu istiyorsanız yerel Windows yerine **WSL2** kullanın.
    Belgeler: [Windows](/tr/platforms/windows).

  </Accordion>

  <Accordion title="Windows exec çıktısı bozuk Çince metin gösteriyor - ne yapmalıyım?">
    Bu, yerel Windows kabuklarında genellikle bir konsol kod sayfası uyumsuzluğudur.

    Belirtiler:

    - `system.run`/`exec` çıktısı Çinceyi mojibake olarak işliyor
    - Aynı komut başka bir terminal profilinde düzgün görünüyor

    PowerShell'de hızlı geçici çözüm:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Ardından Gateway'i yeniden başlatın ve komutunuzu yeniden deneyin:

    ```powershell
    openclaw gateway restart
    ```

    Bunu en son OpenClaw sürümünde hâlâ yeniden üretebiliyorsanız, şurada izleyin/bildirin:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Dokümanlar sorumu yanıtlamadı - nasıl daha iyi bir yanıt alırım?">
    Tam kaynak ve dokümanlar yerelde elinizde olsun diye **hacklenebilir (git) kurulumu** kullanın, ardından
    botunuza (veya Claude/Codex'e) depoyu okuyup kesin yanıt verebilmesi için _o klasörden_ sorun.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Daha fazla ayrıntı: [Install](/tr/install) ve [Installer flags](/tr/install/installer).

  </Accordion>

  <Accordion title="OpenClaw'u Linux'a nasıl kurarım?">
    Kısa yanıt: Linux kılavuzunu izleyin, ardından onboarding'i çalıştırın.

    - Linux hızlı yol + servis kurulumu: [Linux](/tr/platforms/linux).
    - Tam adım adım anlatım: [Getting Started](/tr/start/getting-started).
    - Kurucu + güncellemeler: [Install & updates](/tr/install/updating).

  </Accordion>

  <Accordion title="OpenClaw'u bir VPS'e nasıl kurarım?">
    Herhangi bir Linux VPS çalışır. Sunucuya kurun, ardından Gateway'e erişmek için SSH/Tailscale kullanın.

    Kılavuzlar: [exe.dev](/tr/install/exe-dev), [Hetzner](/tr/install/hetzner), [Fly.io](/tr/install/fly).
    Uzaktan erişim: [Gateway remote](/tr/gateway/remote).

  </Accordion>

  <Accordion title="Bulut/VPS kurulum kılavuzları nerede?">
    Yaygın sağlayıcıları içeren bir **barındırma merkezi** tutuyoruz. Birini seçip kılavuzu izleyin:

    - [VPS hosting](/tr/vps) (tüm sağlayıcılar tek yerde)
    - [Fly.io](/tr/install/fly)
    - [Hetzner](/tr/install/hetzner)
    - [exe.dev](/tr/install/exe-dev)

    Bulutta çalışma şekli: **Gateway sunucuda çalışır** ve ona
    dizüstü bilgisayarınızdan/telefonunuzdan Control UI (veya Tailscale/SSH) üzerinden erişirsiniz. Durumunuz + çalışma alanınız
    sunucuda yaşar, bu nedenle ana makineyi doğruluk kaynağı olarak kabul edin ve yedekleyin.

    Yerel ekran/kamera/canvas'a erişmek veya Gateway'i bulutta tutarken dizüstü bilgisayarınızda
    komut çalıştırmak için **düğümleri** (Mac/iOS/Android/headless) bu bulut Gateway ile eşleştirebilirsiniz.

    Merkez: [Platforms](/tr/platforms). Uzaktan erişim: [Gateway remote](/tr/gateway/remote).
    Düğümler: [Nodes](/tr/nodes), [Nodes CLI](/tr/cli/nodes).

  </Accordion>

  <Accordion title="OpenClaw'dan kendini güncellemesini isteyebilir miyim?">
    Kısa yanıt: **mümkün, önerilmez**. Güncelleme akışı
    Gateway'i yeniden başlatabilir (bu da etkin oturumu düşürür), temiz bir git checkout gerektirebilir ve
    onay isteyebilir. Daha güvenlisi: güncellemeleri operatör olarak bir shell'den çalıştırın.

    CLI'yi kullanın:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Bir ajandan otomatikleştirmeniz gerekiyorsa:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Dokümanlar: [Update](/tr/cli/update), [Updating](/tr/install/updating).

  </Accordion>

  <Accordion title="Onboarding gerçekte ne yapar?">
    `openclaw onboard` önerilen kurulum yoludur. **Yerel modda** sizi şunlardan geçirir:

    - **Model/auth setup** (sağlayıcı OAuth, API anahtarları, Anthropic setup-token ve LM Studio gibi yerel model seçenekleri)
    - **Workspace** konumu + başlangıç dosyaları
    - **Gateway ayarları** (bind/port/auth/tailscale)
    - **Kanallar** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage ve QQ Bot gibi paketli kanal pluginleri)
    - **Daemon kurulumu** (macOS'te LaunchAgent; Linux/WSL2'de systemd kullanıcı birimi)
    - **Sağlık kontrolleri** ve **skills** seçimi

    Ayrıca yapılandırılmış modeliniz bilinmiyorsa veya auth eksikse uyarır.

  </Accordion>

  <Accordion title="Bunu çalıştırmak için Claude veya OpenAI aboneliğine ihtiyacım var mı?">
    Hayır. OpenClaw'u **API anahtarlarıyla** (Anthropic/OpenAI/diğerleri) veya
    verileriniz cihazınızda kalsın diye **yalnızca yerel modellerle** çalıştırabilirsiniz. Abonelikler (Claude
    Pro/Max veya OpenAI Codex), bu sağlayıcılarda kimlik doğrulamak için isteğe bağlı yollardır.

    OpenClaw'da Anthropic için pratik ayrım şöyledir:

    - **Anthropic API anahtarı**: normal Anthropic API faturalaması
    - **OpenClaw'da Claude CLI / Claude abonelik auth'u**: Anthropic personeli
      bu kullanımın yeniden izinli olduğunu bize söyledi ve OpenClaw, Anthropic yeni bir
      politika yayımlamadığı sürece `claude -p`
      kullanımını bu entegrasyon için onaylı kabul ediyor

    Uzun ömürlü gateway ana makineleri için Anthropic API anahtarları hâlâ daha
    öngörülebilir kurulumdur. OpenAI Codex OAuth, OpenClaw gibi harici
    araçlar için açıkça desteklenir.

    OpenClaw ayrıca **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** ve
    **Z.AI / GLM Coding Plan** dahil diğer barındırılan abonelik tarzı seçenekleri destekler.

    Dokümanlar: [Anthropic](/tr/providers/anthropic), [OpenAI](/tr/providers/openai),
    [Qwen Cloud](/tr/providers/qwen),
    [MiniMax](/tr/providers/minimax), [GLM Models](/tr/providers/glm),
    [Local models](/tr/gateway/local-models), [Models](/tr/concepts/models).

  </Accordion>

  <Accordion title="Claude Max aboneliğini API anahtarı olmadan kullanabilir miyim?">
    Evet.

    Anthropic personeli, OpenClaw tarzı Claude CLI kullanımının yeniden izinli olduğunu bize söyledi, bu nedenle
    OpenClaw, Anthropic yeni bir politika yayımlamadığı sürece Claude abonelik auth'unu ve `claude -p` kullanımını
    bu entegrasyon için onaylı kabul eder. En öngörülebilir sunucu tarafı kurulumu
    istiyorsanız bunun yerine Anthropic API anahtarı kullanın.

  </Accordion>

  <Accordion title="Claude abonelik auth'unu (Claude Pro veya Max) destekliyor musunuz?">
    Evet.

    Anthropic personeli bu kullanımın yeniden izinli olduğunu bize söyledi, bu nedenle OpenClaw
    Claude CLI yeniden kullanımını ve `claude -p` kullanımını, Anthropic yeni bir politika
    yayımlamadığı sürece bu entegrasyon için onaylı kabul eder.

    Anthropic setup-token desteklenen bir OpenClaw token yolu olarak hâlâ kullanılabilir, ancak OpenClaw artık mümkün olduğunda Claude CLI yeniden kullanımını ve `claude -p` kullanımını tercih eder.
    Üretim veya çok kullanıcılı iş yükleri için Anthropic API anahtarı auth'u hâlâ
    daha güvenli ve daha öngörülebilir seçimdir. OpenClaw'da diğer abonelik tarzı barındırılan
    seçenekleri istiyorsanız [OpenAI](/tr/providers/openai), [Qwen / Model
    Cloud](/tr/providers/qwen), [MiniMax](/tr/providers/minimax) ve [GLM
    Models](/tr/providers/glm) sayfalarına bakın.

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Anthropic'ten neden HTTP 429 rate_limit_error görüyorum?">
    Bu, mevcut pencere için **Anthropic kota/hız sınırınızın** tükendiği anlamına gelir. **Claude CLI** kullanıyorsanız,
    pencerenin sıfırlanmasını bekleyin veya planınızı yükseltin. **Anthropic API anahtarı** kullanıyorsanız,
    kullanım/faturalama için Anthropic Console'u kontrol edin ve gerektiğinde sınırları yükseltin.

    If the message is specifically:
    `Extra usage is required for long context requests`, istek
    Anthropic'in 1M context betasını (`context1m: true`) kullanmaya çalışıyordur. Bu yalnızca
    kimlik bilgileriniz uzun bağlam faturalandırması için uygunsa (API key faturalandırması veya
    Extra Usage etkin OpenClaw Claude-login yolu) çalışır.

    İpucu: OpenClaw'ın bir sağlayıcı rate-limited durumdayken yanıt vermeye devam edebilmesi için bir **fallback model** ayarlayın.
    Bkz. [Models](/tr/cli/models), [OAuth](/tr/concepts/oauth) ve
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/tr/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock destekleniyor mu?">
    Evet. OpenClaw, paketlenmiş bir **Amazon Bedrock (Converse)** sağlayıcısına sahiptir. AWS env işaretçileri mevcut olduğunda OpenClaw, streaming/text Bedrock kataloğunu otomatik keşfedebilir ve bunu örtük bir `amazon-bedrock` sağlayıcısı olarak birleştirebilir; aksi halde `plugins.entries.amazon-bedrock.config.discovery.enabled` seçeneğini açıkça etkinleştirebilir veya elle bir sağlayıcı girdisi ekleyebilirsiniz. Bkz. [Amazon Bedrock](/tr/providers/bedrock) ve [Model sağlayıcıları](/tr/providers/models). Yönetilen bir anahtar akışını tercih ediyorsanız Bedrock'un önündeki OpenAI uyumlu bir proxy de geçerli bir seçenektir.
  </Accordion>

  <Accordion title="Codex kimlik doğrulaması nasıl çalışır?">
    OpenClaw, OAuth (ChatGPT oturum açma) üzerinden **OpenAI Code (Codex)** desteği sunar. Yaygın kurulum için
    `openai/gpt-5.5` kullanın: ChatGPT/Codex abonelik kimlik doğrulaması ve
    yerel Codex app-server yürütmesi. `openai-codex/gpt-*` model ref'leri,
    `openclaw doctor --fix` tarafından onarılan eski yapılandırmadır. Doğrudan OpenAI API-key
    erişimi, agent olmayan OpenAI API yüzeyleri ve sıralı bir `openai-codex` API-key profili üzerinden agent
    modelleri için kullanılabilir kalır.
    Bkz. [Model sağlayıcıları](/tr/concepts/model-providers) ve [Onboarding (CLI)](/tr/start/wizard).
  </Accordion>

  <Accordion title="OpenClaw neden hâlâ openai-codex'ten bahsediyor?">
    `openai-codex`, ChatGPT/Codex OAuth için sağlayıcı ve auth-profile id'sidir.
    Eski yapılandırmalar bunu model öneki olarak da kullanıyordu:

    - `openai/gpt-5.5` = agent dönüşleri için yerel Codex runtime ile ChatGPT/Codex abonelik kimlik doğrulaması
    - `openai-codex/gpt-5.5` = `openclaw doctor --fix` tarafından onarılan eski model rotası
    - `openai/gpt-5.5` artı sıralı bir `openai-codex` API-key profili = bir OpenAI agent modeli için API-key kimlik doğrulaması
    - `openai-codex:...` = auth profile id, model ref değil

    Doğrudan OpenAI Platform faturalandırma/limit yolunu istiyorsanız
    `OPENAI_API_KEY` ayarlayın. ChatGPT/Codex abonelik kimlik doğrulaması istiyorsanız
    `openclaw models auth login --provider openai-codex` ile oturum açın. Model ref'i
    `openai/gpt-5.5` olarak tutun; `openai-codex/*` model ref'leri,
    `openclaw doctor --fix` tarafından yeniden yazılan eski yapılandırmadır.

  </Accordion>

  <Accordion title="Codex OAuth limitleri neden ChatGPT web'den farklı olabilir?">
    Codex OAuth, OpenAI tarafından yönetilen, plana bağlı kota pencereleri kullanır. Uygulamada,
    her ikisi de aynı hesaba bağlı olsa bile bu limitler ChatGPT web sitesi/uygulama deneyiminden
    farklı olabilir.

    OpenClaw, şu anda görünen sağlayıcı kullanım/kota pencerelerini
    `openclaw models status` içinde gösterebilir, ancak ChatGPT-web haklarını
    doğrudan API erişimi olarak uydurmaz veya normalleştirmez. Doğrudan OpenAI Platform
    faturalandırma/limit yolunu istiyorsanız bir API key ile `openai/*` kullanın.

  </Accordion>

  <Accordion title="OpenAI abonelik kimlik doğrulamasını (Codex OAuth) destekliyor musunuz?">
    Evet. OpenClaw, **OpenAI Code (Codex) abonelik OAuth** desteğini tam olarak sunar.
    OpenAI, OpenClaw gibi harici araçlarda/iş akışlarında abonelik OAuth kullanımına
    açıkça izin verir. Onboarding, OAuth akışını sizin için çalıştırabilir.

    Bkz. [OAuth](/tr/concepts/oauth), [Model sağlayıcıları](/tr/concepts/model-providers) ve [Onboarding (CLI)](/tr/start/wizard).

  </Accordion>

  <Accordion title="Gemini CLI OAuth'u nasıl kurarım?">
    Gemini CLI, `openclaw.json` içinde bir client id veya secret değil, bir **Plugin auth flow** kullanır.

    Adımlar:

    1. Gemini CLI'yi yerel olarak kurun; böylece `gemini`, `PATH` üzerinde olur
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin'i etkinleştirin: `openclaw plugins enable google`
    3. Oturum açın: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Oturum açtıktan sonraki varsayılan model: `google-gemini-cli/gemini-3-flash-preview`
    5. İstekler başarısız olursa gateway host üzerinde `GOOGLE_CLOUD_PROJECT` veya `GOOGLE_CLOUD_PROJECT_ID` ayarlayın

    Bu, OAuth token'larını gateway host üzerindeki auth profile'larda saklar. Ayrıntılar: [Model sağlayıcıları](/tr/concepts/model-providers).

  </Accordion>

  <Accordion title="Yerel bir model gündelik sohbetler için uygun mu?">
    Genellikle hayır. OpenClaw büyük context + güçlü güvenlik gerektirir; küçük kartlar keser ve sızdırır. Mecbursanız, yerel olarak çalıştırabildiğiniz **en büyük** model build'ini kullanın (LM Studio) ve [/gateway/local-models](/tr/gateway/local-models) sayfasına bakın. Daha küçük/quantized modeller prompt-injection riskini artırır - bkz. [Security](/tr/gateway/security).
  </Accordion>

  <Accordion title="Barındırılan model trafiğini belirli bir bölgede nasıl tutarım?">
    Bölgeye sabitlenmiş endpoint'leri seçin. OpenRouter, MiniMax, Kimi ve GLM için ABD'de barındırılan seçenekler sunar; veriyi bölge içinde tutmak için ABD'de barındırılan varyantı seçin. `models.mode: "merge"` kullanarak Anthropic/OpenAI'ı bunların yanında listelemeye devam edebilirsiniz; böylece seçtiğiniz bölgeli sağlayıcıya saygı gösterilirken fallback'ler kullanılabilir kalır.
  </Accordion>

  <Accordion title="Bunu kurmak için Mac Mini satın almam gerekiyor mu?">
    Hayır. OpenClaw macOS veya Linux üzerinde çalışır (Windows, WSL2 üzerinden). Mac mini isteğe bağlıdır - bazı kişiler
    sürekli açık bir host olarak bir tane satın alır, ancak küçük bir VPS, ev sunucusu veya Raspberry Pi sınıfı bir kutu da çalışır.

    Yalnızca **macOS'a özgü araçlar** için Mac gerekir. iMessage için, Messages'da oturum açmış herhangi bir Mac üzerinde `imsg` ile [iMessage](/tr/channels/imessage) kullanın. Gateway Linux'ta veya başka bir yerde çalışıyorsa `channels.imessage.cliPath` değerini, o Mac üzerinde `imsg` çalıştıran bir SSH wrapper'a ayarlayın. Diğer macOS'a özgü araçları istiyorsanız Gateway'i bir Mac üzerinde çalıştırın veya bir macOS Node eşleyin.

    Dokümanlar: [iMessage](/tr/channels/imessage), [Node'lar](/tr/nodes), [Mac remote mode](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="iMessage desteği için Mac mini'ye ihtiyacım var mı?">
    Messages'da oturum açmış **bir macOS cihazına** ihtiyacınız var. Bunun Mac mini olması **gerekmez** -
    herhangi bir Mac çalışır. `imsg` ile **[iMessage](/tr/channels/imessage) kullanın**; Gateway o Mac üzerinde çalışabilir veya bir SSH wrapper `cliPath` ile başka bir yerde çalışabilir.

    Yaygın kurulumlar:

    - Gateway'i Linux/VPS üzerinde çalıştırın ve `channels.imessage.cliPath` değerini, Messages'da oturum açmış bir Mac üzerinde `imsg` çalıştıran bir SSH wrapper'a ayarlayın.
    - En basit tek makine kurulumunu istiyorsanız her şeyi Mac üzerinde çalıştırın.

    Dokümanlar: [iMessage](/tr/channels/imessage), [Node'lar](/tr/nodes),
    [Mac remote mode](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="OpenClaw çalıştırmak için bir Mac mini satın alırsam onu MacBook Pro'ma bağlayabilir miyim?">
    Evet. **Mac mini Gateway'i çalıştırabilir** ve MacBook Pro'nuz
    bir **Node** (eşlik eden cihaz) olarak bağlanabilir. Node'lar Gateway'i çalıştırmaz - ekran/kamera/canvas ve o cihazda `system.run` gibi ek
    yetenekler sağlar.

    Yaygın desen:

    - Gateway Mac mini üzerinde (sürekli açık).
    - MacBook Pro macOS uygulamasını veya bir Node host'u çalıştırır ve Gateway ile eşleşir.
    - Görmek için `openclaw nodes status` / `openclaw nodes list` kullanın.

    Dokümanlar: [Node'lar](/tr/nodes), [Nodes CLI](/tr/cli/nodes).

  </Accordion>

  <Accordion title="Bun kullanabilir miyim?">
    Bun **önerilmez**. Özellikle WhatsApp ve Telegram ile runtime hataları görüyoruz.
    Kararlı gateway'ler için **Node** kullanın.

    Bun ile yine de denemeler yapmak istiyorsanız bunu WhatsApp/Telegram olmadan üretim dışı bir gateway üzerinde yapın.

  </Accordion>

  <Accordion title="Telegram: allowFrom içine ne girer?">
    `channels.telegram.allowFrom`, **insan gönderenin Telegram kullanıcı kimliğidir** (sayısal). Bot kullanıcı adı değildir.

    Kurulum yalnızca sayısal kullanıcı ID'leri ister. Yapılandırmada zaten eski `@username` girdileriniz varsa `openclaw doctor --fix` bunları çözümlemeyi deneyebilir.

    Daha güvenli (üçüncü taraf bot yok):

    - Bot'unuza DM gönderin, ardından `openclaw logs --follow` çalıştırın ve `from.id` değerini okuyun.

    Resmi Bot API:

    - Bot'unuza DM gönderin, ardından `https://api.telegram.org/bot<bot_token>/getUpdates` çağırın ve `message.from.id` değerini okuyun.

    Üçüncü taraf (daha az özel):

    - `@userinfobot` veya `@getidsbot` ile DM yapın.

    Bkz. [/channels/telegram](/tr/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Birden fazla kişi, farklı OpenClaw instance'larıyla tek bir WhatsApp numarası kullanabilir mi?">
    Evet, **multi-agent routing** üzerinden. Her gönderenin WhatsApp **DM**'ini (peer `kind: "direct"`, gönderen E.164 biçiminde, ör. `+15551234567`) farklı bir `agentId` değerine bağlayın; böylece her kişi kendi workspace'ini ve session store'unu alır. Yanıtlar yine **aynı WhatsApp hesabından** gelir ve DM erişim denetimi (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) WhatsApp hesabı başına globaldir. Bkz. [Multi-Agent Routing](/tr/concepts/multi-agent) ve [WhatsApp](/tr/channels/whatsapp).
  </Accordion>

  <Accordion title='Bir "hızlı sohbet" agent'ı ve bir "kodlama için Opus" agent'ı çalıştırabilir miyim?'>
    Evet. Multi-agent routing kullanın: her agent'a kendi varsayılan modelini verin, ardından gelen rotaları (sağlayıcı hesabı veya belirli peer'ler) her agent'a bağlayın. Örnek yapılandırma [Multi-Agent Routing](/tr/concepts/multi-agent) içinde yer alır. Ayrıca bkz. [Models](/tr/concepts/models) ve [Configuration](/tr/gateway/configuration).
  </Accordion>

  <Accordion title="Homebrew Linux'ta çalışır mı?">
    Evet. Homebrew Linux'u destekler (Linuxbrew). Hızlı kurulum:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    OpenClaw'ı systemd üzerinden çalıştırıyorsanız, `brew` ile kurulan araçların non-login shell'lerde çözümlenebilmesi için servis PATH'inin `/home/linuxbrew/.linuxbrew/bin` (veya brew prefix'iniz) içerdiğinden emin olun.
    Son build'ler ayrıca Linux systemd servislerinde yaygın kullanıcı bin dizinlerini başa ekler (örneğin `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) ve ayarlandıklarında `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` ve `FNM_DIR` değerlerini dikkate alır.

  </Accordion>

  <Accordion title="Hackable git kurulumu ile npm kurulumu arasındaki fark">
    - **Hackable (git) kurulum:** tam kaynak checkout'u, düzenlenebilir, katkıda bulunanlar için en iyisi.
      Build'leri yerel olarak çalıştırırsınız ve kodu/dokümanları patch'leyebilirsiniz.
    - **npm kurulumu:** global CLI kurulumu, repo yok, "sadece çalıştır" için en iyisi.
      Güncellemeler npm dist-tag'lerinden gelir.

    Dokümanlar: [Başlarken](/tr/start/getting-started), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="Daha sonra npm ve git kurulumları arasında geçiş yapabilir miyim?">
    Evet. OpenClaw zaten kuruluysa `openclaw update --channel ...` kullanın.
    Bu **verilerinizi silmez** - yalnızca OpenClaw kod kurulumunu değiştirir.
    Durumunuz (`~/.openclaw`) ve workspace'iniz (`~/.openclaw/workspace`) dokunulmadan kalır.

    npm'den git'e:

    ```bash
    openclaw update --channel dev
    ```

    git'ten npm'e:

    ```bash
    openclaw update --channel stable
    ```

    Önce planlanan mod geçişini önizlemek için `--dry-run` ekleyin. Güncelleyici
    Doctor takip adımlarını çalıştırır, hedef kanal için Plugin kaynaklarını yeniler ve
    `--no-restart` geçmediğiniz sürece gateway'i yeniden başlatır.

    Kurucu da her iki modu zorlayabilir:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Yedekleme ipuçları: bkz. [Yedekleme stratejisi](/tr/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Gateway'i dizüstü bilgisayarımda mı yoksa bir VPS'te mi çalıştırmalıyım?">
    Kısa cevap: **7/24 güvenilirlik istiyorsanız VPS kullanın**. En düşük sürtünmeyi istiyorsanız ve uyku/yeniden başlatma durumları sizin için sorun değilse yerel olarak çalıştırın.

    **Dizüstü bilgisayar (yerel Gateway)**

    - **Artıları:** sunucu maliyeti yok, yerel dosyalara doğrudan erişim, canlı tarayıcı penceresi.
    - **Eksileri:** uyku/ağ kesintileri = bağlantı kopmaları, işletim sistemi güncellemeleri/yeniden başlatmaları kesintiye neden olur, uyanık kalmalıdır.

    **VPS / bulut**

    - **Artıları:** her zaman açık, kararlı ağ, dizüstü bilgisayar uyku sorunu yok, çalışır durumda tutması daha kolay.
    - **Eksileri:** genellikle başsız çalışır (ekran görüntüleri kullanın), yalnızca uzaktan dosya erişimi, güncellemeler için SSH kullanmanız gerekir.

    **OpenClaw'a özgü not:** WhatsApp/Telegram/Slack/Mattermost/Discord bir VPS'ten sorunsuz çalışır. Tek gerçek ödünleşim **başsız tarayıcı** ile görünür pencere arasındadır. Bkz. [Tarayıcı](/tr/tools/browser).

    **Önerilen varsayılan:** Daha önce gateway bağlantı kopmaları yaşadıysanız VPS. Mac'i aktif olarak kullanıyorsanız ve yerel dosya erişimi ya da görünür tarayıcıyla UI otomasyonu istiyorsanız yerel kurulum harikadır.

  </Accordion>

  <Accordion title="OpenClaw'u adanmış bir makinede çalıştırmak ne kadar önemli?">
    Zorunlu değildir, ancak **güvenilirlik ve yalıtım için önerilir**.

    - **Adanmış ana makine (VPS/Mac mini/Pi):** her zaman açık, daha az uyku/yeniden başlatma kesintisi, daha temiz izinler, çalışır durumda tutması daha kolay.
    - **Paylaşılan dizüstü/masaüstü bilgisayar:** test ve aktif kullanım için tamamen uygundur, ancak makine uyuduğunda veya güncellendiğinde duraklamalar bekleyin.

    Her iki dünyanın en iyisini istiyorsanız, Gateway'i adanmış bir ana makinede tutun ve dizüstü bilgisayarınızı yerel ekran/kamera/exec araçları için bir **Node** olarak eşleştirin. Bkz. [Node'lar](/tr/nodes).
    Güvenlik yönergeleri için [Güvenlik](/tr/gateway/security) bölümünü okuyun.

  </Accordion>

  <Accordion title="Minimum VPS gereksinimleri ve önerilen işletim sistemi nedir?">
    OpenClaw hafiftir. Temel bir Gateway + bir sohbet kanalı için:

    - **Mutlak minimum:** 1 vCPU, 1GB RAM, ~500MB disk.
    - **Önerilen:** hareket alanı için 1-2 vCPU, 2GB RAM veya daha fazlası (günlükler, medya, birden çok kanal). Node araçları ve tarayıcı otomasyonu kaynak tüketebilir.

    İşletim sistemi: **Ubuntu LTS** kullanın (veya herhangi bir modern Debian/Ubuntu). Linux kurulum yolu en iyi burada test edilmiştir.

    Belgeler: [Linux](/tr/platforms/linux), [VPS barındırma](/tr/vps).

  </Accordion>

  <Accordion title="OpenClaw'u bir VM içinde çalıştırabilir miyim ve gereksinimler nelerdir?">
    Evet. Bir VM'i VPS ile aynı şekilde ele alın: her zaman açık, erişilebilir olmalı ve Gateway ile etkinleştirdiğiniz kanallar için yeterli RAM'e sahip olmalıdır.

    Temel yönergeler:

    - **Mutlak minimum:** 1 vCPU, 1GB RAM.
    - **Önerilen:** birden çok kanal, tarayıcı otomasyonu veya medya araçları çalıştırıyorsanız 2GB RAM veya daha fazlası.
    - **İşletim sistemi:** Ubuntu LTS veya başka bir modern Debian/Ubuntu.

    Windows kullanıyorsanız, **WSL2 en kolay VM tarzı kurulumdur** ve en iyi araç uyumluluğuna sahiptir. Bkz. [Windows](/tr/platforms/windows), [VPS barındırma](/tr/vps).
    macOS'i bir VM'de çalıştırıyorsanız, bkz. [macOS VM](/tr/install/macos-vm).

  </Accordion>
</AccordionGroup>

## İlgili

- [SSS](/tr/help/faq) — ana SSS (modeller, oturumlar, gateway, güvenlik, daha fazlası)
- [Kurulum genel bakışı](/tr/install)
- [Başlarken](/tr/start/getting-started)
- [Sorun giderme](/tr/help/troubleshooting)

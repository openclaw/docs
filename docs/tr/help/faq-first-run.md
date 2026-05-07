---
read_when:
    - Yeni kurulum, ilk kurulumda takılma veya ilk çalıştırma hataları
    - Kimlik doğrulama ve sağlayıcı aboneliklerini seçme
    - docs.openclaw.ai sitesine erişilemiyor, kontrol paneli açılamıyor, kurulum takıldı
sidebarTitle: First-run FAQ
summary: 'SSS: hızlı başlangıç ve ilk çalıştırma kurulumu — yükleme, başlangıç süreci, kimlik doğrulama, abonelikler, ilk hatalar'
title: 'SSS: ilk çalıştırma kurulumu'
x-i18n:
    generated_at: "2026-05-07T13:18:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 347a09ebdbdf564389b406de3d5d47d097ead33d33eed4a68880bfbcaf82e048
    source_path: help/faq-first-run.md
    workflow: 16
---

  Hızlı başlangıç ve ilk çalıştırma SSS. Günlük işlemler, modeller, kimlik doğrulama, oturumlar
  ve sorun giderme için ana [SSS](/tr/help/faq) sayfasına bakın.

  ## Hızlı başlangıç ve ilk çalıştırma kurulumu

  <AccordionGroup>
  <Accordion title="Takıldım, takılmayı en hızlı nasıl aşarım">
    **Makinenizi görebilen** yerel bir yapay zeka ajanı kullanın. Bu, Discord'da sormaktan çok daha etkilidir,
    çünkü çoğu "takıldım" durumu, uzaktan yardımcı olanların inceleyemediği **yerel yapılandırma veya ortam sorunlarıdır**.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Bu araçlar repoyu okuyabilir, komut çalıştırabilir, günlükleri inceleyebilir ve makine düzeyindeki
    kurulumunuzu (PATH, servisler, izinler, kimlik doğrulama dosyaları) düzeltmeye yardımcı olabilir. Onlara hacklenebilir (git) kurulum üzerinden
    **tam kaynak checkout'unu** verin:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Bu, OpenClaw'ı **bir git checkout'undan** kurar; böylece ajan kodu + dokümanları okuyabilir ve
    çalıştırdığınız tam sürüm hakkında akıl yürütebilir. Daha sonra yükleyiciyi `--install-method git` olmadan
    yeniden çalıştırarak her zaman kararlı sürüme dönebilirsiniz.

    İpucu: ajandan düzeltmeyi **planlamasını ve denetlemesini** (adım adım) isteyin, ardından yalnızca
    gerekli komutları çalıştırın. Bu, değişiklikleri küçük ve denetlemesi daha kolay tutar.

    Gerçek bir hata veya düzeltme keşfederseniz lütfen bir GitHub issue'su açın veya PR gönderin:
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
    - `openclaw models status`: sağlayıcı kimlik doğrulaması + model kullanılabilirliğini denetler.
    - `openclaw doctor`: yaygın yapılandırma/durum sorunlarını doğrular ve onarır.

    Diğer yararlı CLI denetimleri: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Hızlı hata ayıklama döngüsü: [Bir şey bozuksa ilk 60 saniye](/tr/help/faq#first-60-seconds-if-something-is-broken).
    Kurulum dokümanları: [Kurulum](/tr/install), [Yükleyici bayrakları](/tr/install/installer), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="Heartbeat atlamaya devam ediyor. Atlama nedenleri ne anlama geliyor?">
    Yaygın Heartbeat atlama nedenleri:

    - `quiet-hours`: yapılandırılmış etkin saatler penceresinin dışında
    - `empty-heartbeat-file`: `HEARTBEAT.md` mevcut ama yalnızca boş/yalnızca başlıklı iskelet içeriyor
    - `no-tasks-due`: `HEARTBEAT.md` görev modu etkin ama görev aralıklarının hiçbiri henüz gelmemiş
    - `alerts-disabled`: tüm Heartbeat görünürlüğü devre dışı (`showOk`, `showAlerts` ve `useIndicator` tamamen kapalı)

    Görev modunda, son tarih zaman damgaları yalnızca gerçek bir Heartbeat çalışması
    tamamlandıktan sonra ilerletilir. Atlanan çalışmalar görevleri tamamlandı olarak işaretlemez.

    Dokümanlar: [Heartbeat](/tr/gateway/heartbeat), [Otomasyon ve Görevler](/tr/automation).

  </Accordion>

  <Accordion title="OpenClaw'ı kurmak ve ayarlamak için önerilen yol">
    Repo, kaynaktan çalıştırmayı ve onboarding kullanmayı önerir:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Sihirbaz ayrıca UI varlıklarını otomatik olarak derleyebilir. Onboarding sonrasında Gateway'i genellikle **18789** portunda çalıştırırsınız.

    Kaynaktan (katkıda bulunanlar/geliştirme):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Henüz global kurulumunuz yoksa `pnpm openclaw onboard` üzerinden çalıştırın.

  </Accordion>

  <Accordion title="Onboarding sonrasında panoyu nasıl açarım?">
    Sihirbaz, onboarding hemen sonrasında tarayıcınızı temiz (token'laştırılmamış) bir pano URL'siyle açar ve bağlantıyı özette de yazdırır. O sekmeyi açık tutun; açılmadıysa yazdırılan URL'yi aynı makinede kopyalayıp yapıştırın.
  </Accordion>

  <Accordion title="Panoda localhost ve uzak ortam için nasıl kimlik doğrularım?">
    **Localhost (aynı makine):**

    - `http://127.0.0.1:18789/` adresini açın.
    - Paylaşılan gizli anahtar kimlik doğrulaması isterse, yapılandırılmış token'ı veya parolayı Control UI ayarlarına yapıştırın.
    - Token kaynağı: `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`).
    - Parola kaynağı: `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`).
    - Henüz paylaşılan gizli anahtar yapılandırılmadıysa `openclaw doctor --generate-gateway-token` ile token oluşturun.

    **Localhost üzerinde değilse:**

    - **Tailscale Serve** (önerilir): bind değerini loopback olarak tutun, `openclaw gateway --tailscale serve` çalıştırın, `https://<magicdns>/` adresini açın. `gateway.auth.allowTailscale` `true` ise kimlik başlıkları Control UI/WebSocket kimlik doğrulamasını karşılar (yapıştırılmış paylaşılan gizli anahtar yok, güvenilir gateway host varsayılır); HTTP API'leri, private-ingress `none` veya trusted-proxy HTTP kimlik doğrulamasını bilerek kullanmadığınız sürece yine de paylaşılan gizli anahtar kimlik doğrulaması gerektirir.
      Aynı istemciden gelen hatalı eşzamanlı Serve kimlik doğrulama denemeleri, başarısız kimlik doğrulama sınırlayıcısı bunları kaydetmeden önce serileştirilir; bu nedenle ikinci hatalı yeniden deneme zaten `retry later` gösterebilir.
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` çalıştırın (veya parola kimlik doğrulamasını yapılandırın), `http://<tailscale-ip>:18789/` adresini açın, ardından eşleşen paylaşılan gizli anahtarı pano ayarlarına yapıştırın.
    - **Kimlik farkında ters proxy**: Gateway'i güvenilir bir proxy arkasında tutun, `gateway.auth.mode: "trusted-proxy"` yapılandırın, ardından proxy URL'sini açın. Aynı host üzerindeki loopback proxy'leri için açıkça `gateway.auth.trustedProxy.allowLoopback = true` gerekir.
    - **SSH tüneli**: `ssh -N -L 18789:127.0.0.1:18789 user@host` ardından `http://127.0.0.1:18789/` adresini açın. Paylaşılan gizli anahtar kimlik doğrulaması tünel üzerinden de geçerlidir; istenirse yapılandırılmış token'ı veya parolayı yapıştırın.

    Bind modları ve kimlik doğrulama ayrıntıları için [Pano](/tr/web/dashboard) ve [Web yüzeyleri](/tr/web) sayfalarına bakın.

  </Accordion>

  <Accordion title="Sohbet onayları için neden iki exec onay yapılandırması var?">
    Farklı katmanları kontrol ederler:

    - `approvals.exec`: onay istemlerini sohbet hedeflerine iletir
    - `channels.<channel>.execApprovals`: bu kanalın exec onayları için yerel bir onay istemcisi gibi davranmasını sağlar

    Host exec politikası hâlâ gerçek onay kapısıdır. Sohbet yapılandırması yalnızca onay
    istemlerinin nerede görüneceğini ve insanların bunları nasıl yanıtlayabileceğini kontrol eder.

    Çoğu kurulumda ikisine birden **ihtiyacınız yoktur**:

    - Sohbet zaten komutları ve yanıtları destekliyorsa, aynı sohbet `/approve` ortak yol üzerinden çalışır.
    - Desteklenen bir yerel kanal onaylayıcıları güvenle çıkarabiliyorsa, OpenClaw artık `channels.<channel>.execApprovals.enabled` ayarlanmamışsa veya `"auto"` ise DM-first yerel onayları otomatik etkinleştirir.
    - Yerel onay kartları/düğmeleri kullanılabiliyorsa birincil yol bu yerel UI'dır; ajan, yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın tek yol olduğunu söylüyorsa manuel `/approve` komutu eklemelidir.
    - `approvals.exec` yalnızca istemlerin başka sohbetlere veya açık operasyon odalarına da iletilmesi gerektiğinde kullanın.
    - `channels.<channel>.execApprovals.target: "channel"` veya `"both"` yalnızca onay istemlerinin kaynak odaya/konuya geri gönderilmesini açıkça istediğinizde kullanın.
    - Plugin onayları yine ayrıdır: varsayılan olarak aynı sohbet `/approve`, isteğe bağlı `approvals.plugin` iletimi ve yalnızca bazı yerel kanallarda bunun üstünde plugin-approval-native işleme kullanırlar.

    Kısa sürüm: iletme yönlendirme içindir, yerel istemci yapılandırması daha zengin kanala özgü UX içindir.
    Bkz. [Exec Onayları](/tr/tools/exec-approvals).

  </Accordion>

  <Accordion title="Hangi çalışma zamanına ihtiyacım var?">
    Node **>= 22** gereklidir. `pnpm` önerilir. Bun, Gateway için **önerilmez**.
  </Accordion>

  <Accordion title="Raspberry Pi üzerinde çalışır mı?">
    Evet. Gateway hafiftir - dokümanlar kişisel kullanım için **512MB-1GB RAM**, **1 çekirdek** ve yaklaşık **500MB**
    diskin yeterli olduğunu listeler ve **Raspberry Pi 4'ün çalıştırabileceğini** belirtir.

    Ek pay istiyorsanız (günlükler, medya, diğer servisler), **2GB önerilir**, ancak
    katı bir minimum değildir.

    İpucu: küçük bir Pi/VPS Gateway'i barındırabilir; dizüstü/telefonunuzdaki **Node'ları**
    yerel ekran/kamera/canvas veya komut yürütme için eşleştirebilirsiniz. Bkz. [Node'lar](/tr/nodes).

  </Accordion>

  <Accordion title="Raspberry Pi kurulumları için ipucu var mı?">
    Kısa sürüm: çalışır, ancak pürüzler bekleyin.

    - **64-bit** OS kullanın ve Node >= 22 tutun.
    - Günlükleri görebilmek ve hızlı güncellemek için **hacklenebilir (git) kurulumu** tercih edin.
    - Kanallar/skills olmadan başlayın, ardından bunları tek tek ekleyin.
    - Garip binary sorunlarıyla karşılaşırsanız genellikle bu bir **ARM uyumluluğu** sorunudur.

    Dokümanlar: [Linux](/tr/platforms/linux), [Kurulum](/tr/install).

  </Accordion>

  <Accordion title="wake up my friend ekranında takıldı / onboarding hatch olmuyor. Şimdi ne yapmalıyım?">
    Bu ekran Gateway'in erişilebilir ve kimliği doğrulanmış olmasına bağlıdır. TUI ayrıca ilk hatch sırasında
    "Wake up, my friend!" mesajını otomatik gönderir. Bu satırı **yanıt olmadan** görüyorsanız
    ve token'lar 0'da kalıyorsa ajan hiç çalışmamıştır.

    1. Gateway'i yeniden başlatın:

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

    Gateway uzaksa tünel/Tailscale bağlantısının açık olduğundan ve UI'ın doğru Gateway'i
    gösterdiğinden emin olun. Bkz. [Uzaktan erişim](/tr/gateway/remote).

  </Accordion>

  <Accordion title="Onboarding'i yeniden yapmadan kurulumumu yeni bir makineye (Mac mini) taşıyabilir miyim?">
    Evet. **Durum dizinini** ve **çalışma alanını** kopyalayın, ardından Doctor'ı bir kez çalıştırın. Bu,
    **iki** konumu da kopyaladığınız sürece botunuzu (bellek, oturum geçmişi, kimlik doğrulama ve kanal
    durumu) "tamamen aynı" tutar:

    1. Yeni makineye OpenClaw kurun.
    2. Eski makineden `$OPENCLAW_STATE_DIR` dizinini (varsayılan: `~/.openclaw`) kopyalayın.
    3. Çalışma alanınızı kopyalayın (varsayılan: `~/.openclaw/workspace`).
    4. `openclaw doctor` çalıştırın ve Gateway servisini yeniden başlatın.

    Bu, yapılandırmayı, kimlik doğrulama profillerini, WhatsApp kimlik bilgilerini, oturumları ve belleği korur. Uzak
    moddaysanız oturum deposu ve çalışma alanının gateway host'una ait olduğunu unutmayın.

    **Önemli:** yalnızca çalışma alanınızı GitHub'a commit/push yaparsanız **bellek + bootstrap dosyalarını**
    yedeklemiş olursunuz, ancak oturum geçmişini veya kimlik doğrulamayı **yedeklemiş olmazsınız**. Bunlar
    `~/.openclaw/` altında yaşar (örneğin `~/.openclaw/agents/<agentId>/sessions/`).

    İlgili: [Taşıma](/tr/install/migrating), [Diskte şeyler nerede yaşar](/tr/help/faq#where-things-live-on-disk),
    [Ajan çalışma alanı](/tr/concepts/agent-workspace), [Doctor](/tr/gateway/doctor),
    [Uzak mod](/tr/gateway/remote).

  </Accordion>

  <Accordion title="En son sürümde yenilikleri nerede görürüm?">
    GitHub changelog'unu kontrol edin:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    En yeni girdiler en üsttedir. Üst bölüm **Unreleased** olarak işaretliyse, sonraki tarihli
    bölüm en son yayınlanmış sürümdür. Girdiler **Öne Çıkanlar**, **Değişiklikler** ve
    **Düzeltmeler** (gerektiğinde dokümanlar/diğer bölümlerle birlikte) olarak gruplandırılır.

  </Accordion>

  <Accordion title="docs.openclaw.ai erişilemiyor (SSL hatası)">
    Bazı Comcast/Xfinity bağlantıları, Xfinity Advanced Security üzerinden `docs.openclaw.ai` adresini yanlışlıkla
    engeller. Devre dışı bırakın veya `docs.openclaw.ai` adresini izin listesine alın, ardından yeniden deneyin.
    Engelin kaldırılmasına yardımcı olmak için lütfen buradan bildirin: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Siteye hâlâ erişemiyorsanız belgeler GitHub’da yansılanır:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Stable ile beta arasındaki fark">
    **Stable** ve **beta** ayrı kod hatları değil, **npm dist-tag’leridir**:

    - `latest` = stable
    - `beta` = test için erken derleme

    Genellikle bir stable sürüm önce **beta** üzerinde yayınlanır, ardından açık bir
    yükseltme adımı aynı sürümü `latest` konumuna taşır. Gerektiğinde bakımcılar
    doğrudan `latest` olarak da yayınlayabilir. Bu yüzden beta ve stable, yükseltmeden
    sonra **aynı sürümü** gösterebilir.

    Nelerin değiştiğine bakın:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Tek satırlık kurulum komutları ve beta ile dev arasındaki fark için aşağıdaki akordiyona bakın.

  </Accordion>

  <Accordion title="Beta sürümünü nasıl kurarım ve beta ile dev arasındaki fark nedir?">
    **Beta**, npm dist-tag’i `beta`’dır (yükseltmeden sonra `latest` ile eşleşebilir).
    **Dev**, `main`’in hareketli ucudur (git); yayınlandığında npm dist-tag’i `dev` kullanılır.

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

    2. **Düzenlenebilir kurulum (yükleyici sitesinden):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Bu size düzenleyebileceğiniz yerel bir repo verir; sonra git üzerinden güncelleyebilirsiniz.

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

  <Accordion title="Kurulum ve onboarding genellikle ne kadar sürer?">
    Yaklaşık kılavuz:

    - **Kurulum:** 2-5 dakika
    - **Onboarding:** yapılandırdığınız kanal/model sayısına bağlı olarak 5-15 dakika

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

    Düzenlenebilir (git) kurulum için:

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

    **1) npm hatası spawn git / git bulunamadı**

    - **Git for Windows** kurun ve `git`’in PATH üzerinde olduğundan emin olun.
    - PowerShell’i kapatıp yeniden açın, ardından yükleyiciyi tekrar çalıştırın.

    **2) Kurulumdan sonra openclaw tanınmıyor**

    - npm global bin klasörünüz PATH üzerinde değil.
    - Yolu kontrol edin:

      ```powershell
      npm config get prefix
      ```

    - Bu dizini kullanıcı PATH’inize ekleyin (Windows’ta `\bin` soneki gerekmez; çoğu sistemde `%AppData%\npm` olur).
    - PATH’i güncelledikten sonra PowerShell’i kapatıp yeniden açın.

    En sorunsuz Windows kurulumunu istiyorsanız yerel Windows yerine **WSL2** kullanın.
    Belgeler: [Windows](/tr/platforms/windows).

  </Accordion>

  <Accordion title="Windows exec çıktısı bozuk Çince metin gösteriyor - ne yapmalıyım?">
    Bu genellikle yerel Windows kabuklarında bir konsol kod sayfası uyuşmazlığıdır.

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

    Bunu en son OpenClaw üzerinde hâlâ yeniden üretebiliyorsanız şurada takip edin/bildirin:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Belgeler soruma yanıt vermedi - nasıl daha iyi bir yanıt alırım?">
    **Düzenlenebilir (git) kurulumu** kullanın; böylece tüm kaynak ve belgeler yerelde olur, ardından
    botunuza (veya Claude/Codex’e) repoyu okuyup kesin yanıt verebilmesi için _o klasörden_ sorun.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Daha fazla ayrıntı: [Kurulum](/tr/install) ve [Yükleyici bayrakları](/tr/install/installer).

  </Accordion>

  <Accordion title="OpenClaw’u Linux’a nasıl kurarım?">
    Kısa yanıt: Linux kılavuzunu izleyin, ardından onboarding’i çalıştırın.

    - Linux hızlı yolu + servis kurulumu: [Linux](/tr/platforms/linux).
    - Tam adım adım anlatım: [Başlarken](/tr/start/getting-started).
    - Yükleyici + güncellemeler: [Kurulum ve güncellemeler](/tr/install/updating).

  </Accordion>

  <Accordion title="OpenClaw’u bir VPS’e nasıl kurarım?">
    Herhangi bir Linux VPS çalışır. Sunucuya kurun, ardından Gateway’e erişmek için SSH/Tailscale kullanın.

    Kılavuzlar: [exe.dev](/tr/install/exe-dev), [Hetzner](/tr/install/hetzner), [Fly.io](/tr/install/fly).
    Uzaktan erişim: [Gateway uzaktan](/tr/gateway/remote).

  </Accordion>

  <Accordion title="Bulut/VPS kurulum kılavuzları nerede?">
    Yaygın sağlayıcılar için bir **barındırma merkezi** tutuyoruz. Birini seçip kılavuzu izleyin:

    - [VPS barındırma](/tr/vps) (tüm sağlayıcılar tek yerde)
    - [Fly.io](/tr/install/fly)
    - [Hetzner](/tr/install/hetzner)
    - [exe.dev](/tr/install/exe-dev)

    Bulutta çalışma şekli: **Gateway sunucuda çalışır** ve ona
    dizüstü bilgisayarınızdan/telefonunuzdan Control UI (veya Tailscale/SSH) üzerinden erişirsiniz. Durumunuz + çalışma alanınız
    sunucuda yaşar; bu yüzden ana makineyi doğruluk kaynağı olarak görün ve yedekleyin.

    Yerel ekran/kamera/canvas erişimi sağlamak veya Gateway bulutta kalırken
    dizüstü bilgisayarınızda komut çalıştırmak için **nodes**’ı (Mac/iOS/Android/headless) bu bulut Gateway ile eşleştirebilirsiniz.

    Merkez: [Platformlar](/tr/platforms). Uzaktan erişim: [Gateway uzaktan](/tr/gateway/remote).
    Nodes: [Nodes](/tr/nodes), [Nodes CLI](/tr/cli/nodes).

  </Accordion>

  <Accordion title="OpenClaw’dan kendini güncellemesini isteyebilir miyim?">
    Kısa yanıt: **mümkün, önerilmez**. Güncelleme akışı
    Gateway’i yeniden başlatabilir (bu da aktif oturumu düşürür), temiz bir git checkout gerektirebilir ve
    onay isteyebilir. Daha güvenlisi: güncellemeleri operatör olarak bir kabuktan çalıştırın.

    CLI’yi kullanın:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Bir agent üzerinden otomasyon yapmak zorundaysanız:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Belgeler: [Güncelleme](/tr/cli/update), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="Onboarding gerçekte ne yapar?">
    `openclaw onboard` önerilen kurulum yoludur. **local modda** size şunlarda rehberlik eder:

    - **Model/auth kurulumu** (sağlayıcı OAuth, API anahtarları, Anthropic setup-token, ayrıca LM Studio gibi yerel model seçenekleri)
    - **Çalışma alanı** konumu + başlangıç dosyaları
    - **Gateway ayarları** (bind/port/auth/tailscale)
    - **Kanallar** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, ayrıca QQ Bot gibi paketli kanal Plugin’leri)
    - **Daemon kurulumu** (macOS’ta LaunchAgent; Linux/WSL2’de systemd kullanıcı birimi)
    - **Sağlık kontrolleri** ve **Skills** seçimi

    Ayrıca yapılandırılmış modeliniz bilinmiyorsa veya auth eksikse uyarır.

  </Accordion>

  <Accordion title="Bunu çalıştırmak için Claude veya OpenAI aboneliğine ihtiyacım var mı?">
    Hayır. OpenClaw’u **API anahtarları** (Anthropic/OpenAI/diğerleri) veya
    verileriniz cihazınızda kalsın diye **yalnızca yerel modeller** ile çalıştırabilirsiniz. Abonelikler (Claude
    Pro/Max veya OpenAI Codex), bu sağlayıcılarda kimlik doğrulamak için isteğe bağlı yollardır.

    OpenClaw’da Anthropic için pratik ayrım şudur:

    - **Anthropic API anahtarı**: normal Anthropic API faturalandırması
    - **OpenClaw’da Claude CLI / Claude abonelik auth**: Anthropic personeli
      bize bu kullanımın yeniden izinli olduğunu söyledi ve OpenClaw, Anthropic yeni bir
      politika yayımlamadığı sürece `claude -p`
      kullanımını bu entegrasyon için onaylı kabul ediyor

    Uzun ömürlü Gateway ana makineleri için Anthropic API anahtarları hâlâ daha
    öngörülebilir kurulumdur. OpenAI Codex OAuth, OpenClaw gibi harici
    araçlar için açıkça desteklenir.

    OpenClaw ayrıca **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** ve
    **Z.AI / GLM Coding Plan** dahil olmak üzere diğer barındırılan abonelik tarzı seçenekleri destekler.

    Belgeler: [Anthropic](/tr/providers/anthropic), [OpenAI](/tr/providers/openai),
    [Qwen Cloud](/tr/providers/qwen),
    [MiniMax](/tr/providers/minimax), [GLM Models](/tr/providers/glm),
    [Yerel modeller](/tr/gateway/local-models), [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="API anahtarı olmadan Claude Max aboneliğini kullanabilir miyim?">
    Evet.

    Anthropic personeli bize OpenClaw tarzı Claude CLI kullanımının yeniden izinli olduğunu söyledi; bu yüzden
    OpenClaw, Anthropic yeni bir politika yayımlamadığı sürece Claude abonelik auth ve `claude -p` kullanımını
    bu entegrasyon için onaylı kabul eder. En öngörülebilir sunucu tarafı kurulumu
    istiyorsanız bunun yerine bir Anthropic API anahtarı kullanın.

  </Accordion>

  <Accordion title="Claude abonelik auth’u (Claude Pro veya Max) destekliyor musunuz?">
    Evet.

    Anthropic personeli bize bu kullanımın yeniden izinli olduğunu söyledi; bu yüzden OpenClaw,
    Anthropic yeni bir politika yayımlamadığı sürece Claude CLI yeniden kullanımını ve `claude -p` kullanımını
    bu entegrasyon için onaylı kabul eder.

    Anthropic setup-token, desteklenen bir OpenClaw token yolu olarak hâlâ kullanılabilir; ancak OpenClaw artık mevcut olduğunda Claude CLI yeniden kullanımını ve `claude -p`’yi tercih eder.
    Production veya çok kullanıcılı iş yükleri için Anthropic API anahtarı auth hâlâ
    daha güvenli ve daha öngörülebilir seçimdir. OpenClaw’da diğer abonelik tarzı barındırılan
    seçenekleri istiyorsanız [OpenAI](/tr/providers/openai), [Qwen / Model
    Cloud](/tr/providers/qwen), [MiniMax](/tr/providers/minimax) ve [GLM
    Models](/tr/providers/glm) sayfalarına bakın.

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Anthropic’ten neden HTTP 429 rate_limit_error görüyorum?">
    Bu, geçerli pencere için **Anthropic kotanızın/hız sınırınızın** tükendiği anlamına gelir. **Claude CLI** kullanıyorsanız
    pencerenin sıfırlanmasını bekleyin veya planınızı yükseltin. **Anthropic API anahtarı** kullanıyorsanız,
    kullanım/faturalandırma için Anthropic Console’u kontrol edin ve gerektiğinde sınırları artırın.

    Mesaj özellikle şuysa:
    `Extra usage is required for long context requests`, istek Anthropic'in 1M bağlam betasını (`context1m: true`) kullanmaya çalışıyordur. Bu yalnızca kimlik bilginiz uzun bağlam faturalandırmasına uygunsa çalışır (API anahtarı faturalandırması veya Extra Usage etkinleştirilmiş OpenClaw Claude oturum açma yolu).

    İpucu: Bir sağlayıcı hız sınırına takıldığında OpenClaw'ın yanıt vermeye devam edebilmesi için bir **yedek model** ayarlayın.
    Bkz. [Modeller](/tr/cli/models), [OAuth](/tr/concepts/oauth) ve
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/tr/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock destekleniyor mu?">
    Evet. OpenClaw, paketle birlikte gelen bir **Amazon Bedrock (Converse)** sağlayıcısına sahiptir. AWS ortam belirteçleri mevcut olduğunda OpenClaw, akış/metin Bedrock kataloğunu otomatik keşfedip örtük bir `amazon-bedrock` sağlayıcısı olarak birleştirebilir; aksi halde `plugins.entries.amazon-bedrock.config.discovery.enabled` ayarını açıkça etkinleştirebilir veya manuel bir sağlayıcı girdisi ekleyebilirsiniz. Bkz. [Amazon Bedrock](/tr/providers/bedrock) ve [Model sağlayıcıları](/tr/providers/models). Yönetilen bir anahtar akışını tercih ediyorsanız, Bedrock'un önünde OpenAI uyumlu bir proxy de geçerli bir seçenektir.
  </Accordion>

  <Accordion title="Codex kimlik doğrulaması nasıl çalışır?">
    OpenClaw, OAuth (ChatGPT oturum açma) yoluyla **OpenAI Code (Codex)** destekler. Yaygın kurulum için
    `openai/gpt-5.5` modelini `agentRuntime.id: "codex"` ile kullanın:
    ChatGPT/Codex abonelik kimlik doğrulaması ve yerel Codex uygulama sunucusu yürütmesi. `openai-codex/gpt-5.5` seçeneğini yalnızca varsayılan Codex çalışma zamanı üzerinden Codex OAuth istediğinizde kullanın. Doğrudan OpenAI API anahtarı erişimi, ajan olmayan OpenAI API yüzeyleri ve sıralı bir `openai-codex` API anahtarı profili üzerinden ajan modelleri için kullanılabilir olmaya devam eder.
    Bkz. [Model sağlayıcıları](/tr/concepts/model-providers) ve [Başlangıç kurulumu (CLI)](/tr/start/wizard).
  </Accordion>

  <Accordion title="OpenClaw neden hâlâ openai-codex'ten bahsediyor?">
    `openai-codex`, ChatGPT/Codex OAuth için sağlayıcı ve kimlik doğrulama profili kimliğidir.
    Daha eski yapılandırmalar bunu model öneki olarak da kullanıyordu:

    - `openai/gpt-5.5` = ajan turları için yerel Codex çalışma zamanı ile ChatGPT/Codex abonelik kimlik doğrulaması
    - `openai-codex/gpt-5.5` = `openclaw doctor --fix` tarafından onarılan eski model rotası
    - `openai/gpt-5.5` artı sıralı bir `openai-codex` API anahtarı profili = bir OpenAI ajan modeli için API anahtarı kimlik doğrulaması
    - `openai-codex:...` = kimlik doğrulama profili kimliği, model başvurusu değil

    Doğrudan OpenAI Platform faturalandırma/sınır yolunu istiyorsanız
    `OPENAI_API_KEY` ayarlayın. ChatGPT/Codex abonelik kimlik doğrulaması istiyorsanız
    `openclaw models auth login --provider openai-codex` ile oturum açın. Model başvurusunu
    `openai/gpt-5.5` olarak tutun; `openai-codex/*` model başvuruları, `openclaw doctor --fix` tarafından yeniden yazılan eski yapılandırmadır.

  </Accordion>

  <Accordion title="Codex OAuth sınırları neden ChatGPT web'den farklı olabilir?">
    Codex OAuth, OpenAI tarafından yönetilen, plana bağlı kota pencerelerini kullanır. Pratikte bu sınırlar, her ikisi de aynı hesaba bağlı olsa bile ChatGPT web sitesi/uygulama deneyiminden farklı olabilir.

    OpenClaw, şu anda görünür olan sağlayıcı kullanım/kota pencerelerini
    `openclaw models status` içinde gösterebilir, ancak ChatGPT web haklarını doğrudan API erişimine dönüştürmez veya normalleştirmez. Doğrudan OpenAI Platform faturalandırma/sınır yolunu istiyorsanız, API anahtarıyla `openai/*` kullanın.

  </Accordion>

  <Accordion title="OpenAI abonelik kimlik doğrulamasını (Codex OAuth) destekliyor musunuz?">
    Evet. OpenClaw, **OpenAI Code (Codex) abonelik OAuth** desteğini tam olarak sunar.
    OpenAI, OpenClaw gibi harici araçlarda/iş akışlarında abonelik OAuth kullanımına açıkça izin verir. Başlangıç kurulumu OAuth akışını sizin için çalıştırabilir.

    Bkz. [OAuth](/tr/concepts/oauth), [Model sağlayıcıları](/tr/concepts/model-providers) ve [Başlangıç kurulumu (CLI)](/tr/start/wizard).

  </Accordion>

  <Accordion title="Gemini CLI OAuth'u nasıl kurarım?">
    Gemini CLI, `openclaw.json` içinde bir istemci kimliği veya gizli anahtar değil, bir **Plugin kimlik doğrulama akışı** kullanır.

    Adımlar:

    1. Gemini CLI'ı yerel olarak yükleyin; böylece `gemini`, `PATH` üzerinde olsun
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin'i etkinleştirin: `openclaw plugins enable google`
    3. Oturum açın: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Oturum açtıktan sonraki varsayılan model: `google-gemini-cli/gemini-3-flash-preview`
    5. İstekler başarısız olursa Gateway ana makinesinde `GOOGLE_CLOUD_PROJECT` veya `GOOGLE_CLOUD_PROJECT_ID` ayarlayın

    Bu, OAuth tokenlarını Gateway ana makinesindeki kimlik doğrulama profillerinde saklar. Ayrıntılar: [Model sağlayıcıları](/tr/concepts/model-providers).

  </Accordion>

  <Accordion title="Sıradan sohbetler için yerel bir model uygun mu?">
    Genellikle hayır. OpenClaw büyük bağlam + güçlü güvenlik gerektirir; küçük kartlar keser ve sızdırır. Zorundaysanız, yerel olarak çalıştırabileceğiniz **en büyük** model derlemesini (LM Studio) çalıştırın ve [/gateway/local-models](/tr/gateway/local-models) sayfasına bakın. Daha küçük/kuantize modeller istem enjeksiyonu riskini artırır - bkz. [Güvenlik](/tr/gateway/security).
  </Accordion>

  <Accordion title="Barındırılan model trafiğini belirli bir bölgede nasıl tutarım?">
    Bölgeye sabitlenmiş uç noktaları seçin. OpenRouter, MiniMax, Kimi ve GLM için ABD'de barındırılan seçenekler sunar; verileri bölgede tutmak için ABD'de barındırılan varyantı seçin. Seçtiğiniz bölgesel sağlayıcıya saygı gösterirken yedeklerin kullanılabilir kalması için `models.mode: "merge"` kullanarak Anthropic/OpenAI'ı bunların yanında listelemeye devam edebilirsiniz.
  </Accordion>

  <Accordion title="Bunu kurmak için Mac Mini satın almak zorunda mıyım?">
    Hayır. OpenClaw macOS veya Linux üzerinde çalışır (Windows, WSL2 üzerinden). Mac mini isteğe bağlıdır - bazı kişiler her zaman açık bir ana makine olarak bir tane satın alır, ancak küçük bir VPS, ev sunucusu veya Raspberry Pi sınıfı bir kutu da çalışır.

    Yalnızca **sadece macOS araçları** için bir Mac gerekir. iMessage için [BlueBubbles](/tr/channels/bluebubbles) kullanın (önerilir) - BlueBubbles sunucusu herhangi bir Mac üzerinde çalışır ve Gateway Linux üzerinde veya başka bir yerde çalışabilir. Başka sadece macOS araçları istiyorsanız Gateway'i bir Mac üzerinde çalıştırın veya bir macOS düğümü eşleyin.

    Belgeler: [BlueBubbles](/tr/channels/bluebubbles), [Düğümler](/tr/nodes), [Mac uzak modu](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="iMessage desteği için Mac mini gerekir mi?">
    Messages'da oturum açmış **bir macOS cihazına** ihtiyacınız var. Bunun Mac mini olması **gerekmez** -
    herhangi bir Mac olur. iMessage için **[BlueBubbles](/tr/channels/bluebubbles) kullanın** (önerilir) - BlueBubbles sunucusu macOS üzerinde çalışırken Gateway Linux üzerinde veya başka bir yerde çalışabilir.

    Yaygın kurulumlar:

    - Gateway'i Linux/VPS üzerinde çalıştırın ve BlueBubbles sunucusunu Messages'da oturum açmış herhangi bir Mac üzerinde çalıştırın.
    - En basit tek makine kurulumunu istiyorsanız her şeyi Mac üzerinde çalıştırın.

    Belgeler: [BlueBubbles](/tr/channels/bluebubbles), [Düğümler](/tr/nodes),
    [Mac uzak modu](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="OpenClaw çalıştırmak için Mac mini satın alırsam onu MacBook Pro'ma bağlayabilir miyim?">
    Evet. **Mac mini Gateway'i çalıştırabilir** ve MacBook Pro'nuz bir **düğüm** (eşlik eden cihaz) olarak bağlanabilir. Düğümler Gateway'i çalıştırmaz - ekran/kamera/canvas ve o cihazda `system.run` gibi ek yetenekler sağlar.

    Yaygın desen:

    - Gateway Mac mini üzerinde (her zaman açık).
    - MacBook Pro macOS uygulamasını veya bir düğüm ana makinesini çalıştırır ve Gateway ile eşleşir.
    - Görmek için `openclaw nodes status` / `openclaw nodes list` kullanın.

    Belgeler: [Düğümler](/tr/nodes), [Düğümler CLI](/tr/cli/nodes).

  </Accordion>

  <Accordion title="Bun kullanabilir miyim?">
    Bun **önerilmez**. Özellikle WhatsApp ve Telegram ile çalışma zamanı hataları görüyoruz.
    Kararlı Gateway'ler için **Node** kullanın.

    Yine de Bun ile deneme yapmak istiyorsanız bunu WhatsApp/Telegram olmadan, üretim dışı bir Gateway üzerinde yapın.

  </Accordion>

  <Accordion title="Telegram: allowFrom içine ne girer?">
    `channels.telegram.allowFrom`, **insan göndericinin Telegram kullanıcı kimliğidir** (sayısal). Bot kullanıcı adı değildir.

    Kurulum yalnızca sayısal kullanıcı kimlikleri ister. Yapılandırmada zaten eski `@username` girdileriniz varsa, `openclaw doctor --fix` bunları çözmeyi deneyebilir.

    Daha güvenli (üçüncü taraf bot yok):

    - Botunuza DM gönderin, ardından `openclaw logs --follow` çalıştırın ve `from.id` değerini okuyun.

    Resmi Bot API:

    - Botunuza DM gönderin, ardından `https://api.telegram.org/bot<bot_token>/getUpdates` çağırın ve `message.from.id` değerini okuyun.

    Üçüncü taraf (daha az özel):

    - `@userinfobot` veya `@getidsbot` ile DM gönderin.

    Bkz. [/channels/telegram](/tr/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Birden fazla kişi farklı OpenClaw örnekleriyle tek bir WhatsApp numarasını kullanabilir mi?">
    Evet, **çoklu ajan yönlendirme** yoluyla. Her göndericinin WhatsApp **DM**'ini (eş `kind: "direct"`, gönderici E.164 biçiminde ör. `+15551234567`) farklı bir `agentId` değerine bağlayın; böylece her kişi kendi çalışma alanını ve oturum deposunu alır. Yanıtlar yine **aynı WhatsApp hesabından** gelir ve DM erişim denetimi (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) her WhatsApp hesabı için geneldir. Bkz. [Çoklu Ajan Yönlendirme](/tr/concepts/multi-agent) ve [WhatsApp](/tr/channels/whatsapp).
  </Accordion>

  <Accordion title='Bir "hızlı sohbet" ajanı ve bir "kodlama için Opus" ajanı çalıştırabilir miyim?'>
    Evet. Çoklu ajan yönlendirmeyi kullanın: Her ajana kendi varsayılan modelini verin, ardından gelen rotaları (sağlayıcı hesabı veya belirli eşler) her ajana bağlayın. Örnek yapılandırma [Çoklu Ajan Yönlendirme](/tr/concepts/multi-agent) içinde yer alır. Ayrıca bkz. [Modeller](/tr/concepts/models) ve [Yapılandırma](/tr/gateway/configuration).
  </Accordion>

  <Accordion title="Homebrew Linux üzerinde çalışır mı?">
    Evet. Homebrew Linux'u destekler (Linuxbrew). Hızlı kurulum:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    OpenClaw'ı systemd üzerinden çalıştırıyorsanız, hizmet PATH'inin `/home/linuxbrew/.linuxbrew/bin` (veya brew önekinizi) içerdiğinden emin olun; böylece `brew` ile yüklenen araçlar oturum açma dışı kabuklarda çözümlenir.
    Son derlemeler ayrıca Linux systemd hizmetlerinde yaygın kullanıcı bin dizinlerini başa ekler (örneğin `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) ve ayarlandığında `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` ve `FNM_DIR` değerlerine uyar.

  </Accordion>

  <Accordion title="Düzenlenebilir git kurulumu ile npm kurulumu arasındaki fark">
    - **Düzenlenebilir (git) kurulum:** tam kaynak checkout'u, düzenlenebilir, katkıda bulunanlar için en iyisi.
      Derlemeleri yerel olarak çalıştırırsınız ve kod/belge yamalayabilirsiniz.
    - **npm kurulumu:** genel CLI kurulumu, depo yok, "sadece çalıştırmak" için en iyisi.
      Güncellemeler npm dist-tag'lerinden gelir.

    Belgeler: [Başlarken](/tr/start/getting-started), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="Daha sonra npm ve git kurulumları arasında geçiş yapabilir miyim?">
    Evet. OpenClaw zaten kurulu olduğunda `openclaw update --channel ...` kullanın.
    Bu **verilerinizi silmez** - yalnızca OpenClaw kod kurulumunu değiştirir.
    Durumunuz (`~/.openclaw`) ve çalışma alanınız (`~/.openclaw/workspace`) dokunulmadan kalır.

    npm'den git'e:

    ```bash
    openclaw update --channel dev
    ```

    git'ten npm'ye:

    ```bash
    openclaw update --channel stable
    ```

    Planlanan mod geçişini önce önizlemek için `--dry-run` ekleyin. Güncelleyici
    Doctor takip adımlarını çalıştırır, hedef kanal için Plugin kaynaklarını yeniler ve
    `--no-restart` geçmediğiniz sürece Gateway'i yeniden başlatır.

    Kurucu da iki modu zorlayabilir:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Yedekleme ipuçları: bkz. [Yedekleme stratejisi](/tr/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Gateway'i dizüstü bilgisayarımda mı yoksa bir VPS üzerinde mi çalıştırmalıyım?">
    Kısa cevap: **7/24 güvenilirlik istiyorsanız VPS kullanın**. En düşük sürtünmeyi istiyorsanız ve uyku/yeniden başlatmalar sizin için sorun değilse yerel olarak çalıştırın.

    **Dizüstü bilgisayar (yerel Gateway)**

    - **Artıları:** sunucu maliyeti yok, yerel dosyalara doğrudan erişim, canlı tarayıcı penceresi.
    - **Eksileri:** uyku/ağ kesintileri = bağlantı kopmaları, işletim sistemi güncellemeleri/yeniden başlatmalar kesintiye neden olur, uyanık kalması gerekir.

    **VPS / bulut**

    - **Artıları:** her zaman açık, kararlı ağ, dizüstü uyku sorunu yok, çalışır durumda tutması daha kolay.
    - **Eksileri:** genellikle başsız çalışır (ekran görüntüleri kullanın), yalnızca uzak dosya erişimi, güncellemeler için SSH kullanmanız gerekir.

    **OpenClaw'a özgü not:** WhatsApp/Telegram/Slack/Mattermost/Discord hepsi VPS üzerinden sorunsuz çalışır. Tek gerçek ödünleşim **başsız tarayıcı** ile görünür pencere arasındadır. Bkz. [Tarayıcı](/tr/tools/browser).

    **Önerilen varsayılan:** Daha önce gateway bağlantı kopmaları yaşadıysanız VPS. Mac'i aktif olarak kullanıyorsanız ve yerel dosya erişimi ya da görünür tarayıcıyla UI otomasyonu istiyorsanız yerel kullanım harikadır.

  </Accordion>

  <Accordion title="OpenClaw'u özel bir makinede çalıştırmak ne kadar önemli?">
    Zorunlu değildir, ancak **güvenilirlik ve yalıtım için önerilir**.

    - **Özel host (VPS/Mac mini/Pi):** her zaman açık, daha az uyku/yeniden başlatma kesintisi, daha temiz izinler, çalışır durumda tutması daha kolay.
    - **Paylaşılan dizüstü/masaüstü:** test ve aktif kullanım için tamamen uygundur, ancak makine uykuya geçtiğinde veya güncellendiğinde duraklamalar bekleyin.

    İki dünyanın da en iyisini istiyorsanız Gateway'i özel bir host üzerinde tutun ve dizüstü bilgisayarınızı yerel ekran/kamera/exec araçları için bir **Node** olarak eşleştirin. Bkz. [Node'lar](/tr/nodes).
    Güvenlik rehberliği için [Güvenlik](/tr/gateway/security) bölümünü okuyun.

  </Accordion>

  <Accordion title="Minimum VPS gereksinimleri ve önerilen işletim sistemi nedir?">
    OpenClaw hafiftir. Temel bir Gateway + bir sohbet kanalı için:

    - **Mutlak minimum:** 1 vCPU, 1 GB RAM, ~500 MB disk.
    - **Önerilen:** rahat kullanım payı için 1-2 vCPU, 2 GB RAM veya daha fazlası (günlükler, medya, birden fazla kanal). Node araçları ve tarayıcı otomasyonu kaynak tüketebilir.

    İşletim sistemi: **Ubuntu LTS** (veya modern bir Debian/Ubuntu) kullanın. Linux kurulum yolu en iyi burada test edilmiştir.

    Dokümanlar: [Linux](/tr/platforms/linux), [VPS barındırma](/tr/vps).

  </Accordion>

  <Accordion title="OpenClaw'u bir VM içinde çalıştırabilir miyim ve gereksinimler nelerdir?">
    Evet. Bir VM'yi VPS ile aynı şekilde değerlendirin: her zaman açık, erişilebilir olmalı ve Gateway ile etkinleştirdiğiniz kanallar için yeterli
    RAM'e sahip olmalıdır.

    Temel rehberlik:

    - **Mutlak minimum:** 1 vCPU, 1 GB RAM.
    - **Önerilen:** birden fazla kanal, tarayıcı otomasyonu veya medya araçları çalıştırıyorsanız 2 GB RAM veya daha fazlası.
    - **İşletim sistemi:** Ubuntu LTS veya başka bir modern Debian/Ubuntu.

    Windows kullanıyorsanız **WSL2 en kolay VM tarzı kurulumdur** ve en iyi araç
    uyumluluğuna sahiptir. Bkz. [Windows](/tr/platforms/windows), [VPS barındırma](/tr/vps).
    macOS'i bir VM içinde çalıştırıyorsanız bkz. [macOS VM](/tr/install/macos-vm).

  </Accordion>
</AccordionGroup>

## İlgili

- [SSS](/tr/help/faq) — ana SSS (modeller, oturumlar, gateway, güvenlik, daha fazlası)
- [Kurulum genel bakışı](/tr/install)
- [Başlarken](/tr/start/getting-started)
- [Sorun giderme](/tr/help/troubleshooting)

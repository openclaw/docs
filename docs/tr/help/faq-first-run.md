---
read_when:
    - Yeni kurulum, takılı kalan başlangıç kurulumu veya ilk çalıştırma hataları
    - Kimlik doğrulama ve sağlayıcı aboneliklerini seçme
    - docs.openclaw.ai adresine erişilemiyor, kontrol paneli açılamıyor, kurulum takılı kaldı
sidebarTitle: First-run FAQ
summary: 'SSS: hızlı başlangıç ve ilk çalıştırma kurulumu — kurulum, ilk kullanıma hazırlama, kimlik doğrulama, abonelikler, ilk hatalar'
title: 'SSS: ilk çalıştırma kurulumu'
x-i18n:
    generated_at: "2026-05-02T08:57:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 469fbd24fea69d91c5b0408dff9c7d7b2382f9c59430a1d5331cb5dcabdce295
    source_path: help/faq-first-run.md
    workflow: 16
---

  Hızlı başlangıç ve ilk çalıştırma soru-cevapları. Günlük işlemler, modeller, kimlik doğrulama, oturumlar
  ve sorun giderme için ana [SSS](/tr/help/faq) bölümüne bakın.

  ## Hızlı başlangıç ve ilk çalıştırma kurulumu

  <AccordionGroup>
  <Accordion title="Takıldım, takılmayı aşmanın en hızlı yolu">
    **Makinenizi görebilen** yerel bir AI ajanı kullanın. Bu, Discord üzerinde
    sormaktan çok daha etkilidir, çünkü çoğu "takıldım" durumu, uzaktan yardımcı olanların
    inceleyemediği **yerel yapılandırma veya ortam sorunlarıdır**.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Bu araçlar repoyu okuyabilir, komut çalıştırabilir, günlükleri inceleyebilir ve makine düzeyindeki
    kurulumunuzu (PATH, servisler, izinler, kimlik doğrulama dosyaları) düzeltmeye yardımcı olabilir. Onlara
    hacklenebilir (git) kurulumla **tam kaynak checkout'unu** verin:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Bu, OpenClaw'ı **bir git checkout'undan** kurar; böylece ajan kodu + dokümanları okuyabilir ve
    çalıştırdığınız tam sürüm hakkında akıl yürütebilir. Daha sonra yükleyiciyi `--install-method git`
    olmadan yeniden çalıştırarak istediğiniz zaman kararlı sürüme dönebilirsiniz.

    İpucu: ajandan düzeltmeyi **planlamasını ve denetlemesini** (adım adım) isteyin, sonra yalnızca
    gerekli komutları çalıştırın. Bu, değişiklikleri küçük ve denetlemesi daha kolay tutar.

    Gerçek bir hata veya düzeltme bulursanız, lütfen bir GitHub issue açın veya PR gönderin:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Bu komutlarla başlayın (yardım isterken çıktıları paylaşın):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Ne yaparlar:

    - `openclaw status`: gateway/ajan sağlığı + temel yapılandırmanın hızlı anlık görüntüsü.
    - `openclaw models status`: provider kimlik doğrulamasını + model kullanılabilirliğini denetler.
    - `openclaw doctor`: yaygın yapılandırma/durum sorunlarını doğrular ve onarır.

    Diğer yararlı CLI denetimleri: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Hızlı hata ayıklama döngüsü: [Bir şey bozulduysa ilk 60 saniye](#first-60-seconds-if-something-is-broken).
    Kurulum dokümanları: [Kurulum](/tr/install), [Yükleyici bayrakları](/tr/install/installer), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="Heartbeat sürekli atlanıyor. Atlama nedenleri ne anlama geliyor?">
    Yaygın heartbeat atlama nedenleri:

    - `quiet-hours`: yapılandırılmış etkin saatler penceresinin dışında
    - `empty-heartbeat-file`: `HEARTBEAT.md` var ama yalnızca boş/yalnızca başlıklı iskelet içeriyor
    - `no-tasks-due`: `HEARTBEAT.md` görev modu etkin ama görev aralıklarının hiçbiri henüz zamanı gelmiş değil
    - `alerts-disabled`: tüm heartbeat görünürlüğü devre dışı (`showOk`, `showAlerts` ve `useIndicator` tümü kapalı)

    Görev modunda, zamanı gelen zaman damgaları yalnızca gerçek bir heartbeat çalıştırması
    tamamlandıktan sonra ilerletilir. Atlanan çalıştırmalar görevleri tamamlandı olarak işaretlemez.

    Dokümanlar: [Heartbeat](/tr/gateway/heartbeat), [Otomasyon ve Görevler](/tr/automation).

  </Accordion>

  <Accordion title="OpenClaw'ı kurmak ve ayarlamak için önerilen yol">
    Repo, kaynaktan çalıştırmayı ve onboarding kullanmayı önerir:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Sihirbaz UI varlıklarını otomatik olarak da derleyebilir. Onboarding sonrası genellikle Gateway'i **18789** portunda çalıştırırsınız.

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

  <Accordion title="Onboarding sonrası panoyu nasıl açarım?">
    Sihirbaz, onboarding'den hemen sonra tarayıcınızı temiz (token içermeyen) bir pano URL'siyle açar ve bağlantıyı özette de yazdırır. Bu sekmeyi açık tutun; açılmadıysa, yazdırılan URL'yi aynı makinede kopyalayıp yapıştırın.
  </Accordion>

  <Accordion title="Panonun kimliğini localhost ve uzak ortamda nasıl doğrularım?">
    **Localhost (aynı makine):**

    - `http://127.0.0.1:18789/` adresini açın.
    - Paylaşılan gizli anahtar kimlik doğrulaması isterse, yapılandırılmış token'ı veya parolayı Control UI ayarlarına yapıştırın.
    - Token kaynağı: `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`).
    - Parola kaynağı: `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`).
    - Henüz paylaşılan gizli anahtar yapılandırılmadıysa, `openclaw doctor --generate-gateway-token` ile bir token oluşturun.

    **Localhost üzerinde değilse:**

    - **Tailscale Serve** (önerilir): bind'i loopback olarak tutun, `openclaw gateway --tailscale serve` çalıştırın, `https://<magicdns>/` adresini açın. `gateway.auth.allowTailscale` `true` ise, kimlik başlıkları Control UI/WebSocket kimlik doğrulamasını karşılar (yapıştırılmış paylaşılan gizli anahtar gerekmez, güvenilir gateway host varsayılır); HTTP API'leri, özel-ingress `none` veya trusted-proxy HTTP kimlik doğrulamasını bilerek kullanmadığınız sürece yine de paylaşılan gizli anahtar kimlik doğrulaması gerektirir.
      Aynı istemciden gelen hatalı eşzamanlı Serve kimlik doğrulama denemeleri, failed-auth sınırlayıcı bunları kaydetmeden önce serileştirilir; bu nedenle ikinci hatalı yeniden deneme zaten `retry later` gösterebilir.
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` çalıştırın (veya parola kimlik doğrulamasını yapılandırın), `http://<tailscale-ip>:18789/` adresini açın, sonra eşleşen paylaşılan gizli anahtarı pano ayarlarına yapıştırın.
    - **Kimlik farkındalığı olan ters proxy**: Gateway'i güvenilir bir proxy arkasında tutun, `gateway.auth.mode: "trusted-proxy"` yapılandırın, sonra proxy URL'sini açın. Aynı host üzerindeki loopback proxy'leri açıkça `gateway.auth.trustedProxy.allowLoopback = true` gerektirir.
    - **SSH tüneli**: `ssh -N -L 18789:127.0.0.1:18789 user@host` ardından `http://127.0.0.1:18789/` adresini açın. Paylaşılan gizli anahtar kimlik doğrulaması tünel üzerinden de geçerlidir; istenirse yapılandırılmış token'ı veya parolayı yapıştırın.

    Bind modları ve kimlik doğrulama ayrıntıları için [Pano](/tr/web/dashboard) ve [Web yüzeyleri](/tr/web) bölümlerine bakın.

  </Accordion>

  <Accordion title="Sohbet onayları için neden iki exec onay yapılandırması var?">
    Farklı katmanları kontrol ederler:

    - `approvals.exec`: onay istemlerini sohbet hedeflerine iletir
    - `channels.<channel>.execApprovals`: bu kanalın exec onayları için yerel bir onay istemcisi gibi davranmasını sağlar

    Host exec politikası hâlâ gerçek onay kapısıdır. Sohbet yapılandırması yalnızca onay
    istemlerinin nerede görüneceğini ve insanların bunları nasıl yanıtlayabileceğini kontrol eder.

    Çoğu kurulumda **ikisine birden** ihtiyacınız yoktur:

    - Sohbet zaten komutları ve yanıtları destekliyorsa, aynı sohbette `/approve` paylaşılan yol üzerinden çalışır.
    - Desteklenen yerel bir kanal onaylayıcıları güvenli biçimde çıkarabiliyorsa, OpenClaw artık `channels.<channel>.execApprovals.enabled` unset veya `"auto"` olduğunda DM-first yerel onayları otomatik etkinleştirir.
    - Yerel onay kartları/düğmeleri kullanılabildiğinde, birincil yol bu yerel UI'dır; ajan yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya tek yolun manuel onay olduğunu söylüyorsa manuel bir `/approve` komutu eklemelidir.
    - `approvals.exec` yalnızca istemlerin başka sohbetlere veya açık operasyon odalarına da iletilmesi gerektiğinde kullanın.
    - `channels.<channel>.execApprovals.target: "channel"` veya `"both"` yalnızca onay istemlerinin kaynak odaya/konuya geri gönderilmesini açıkça istediğinizde kullanın.
    - Plugin onayları yine ayrıdır: varsayılan olarak aynı sohbet `/approve`, isteğe bağlı `approvals.plugin` iletimi kullanırlar ve yalnızca bazı yerel kanallar üstüne plugin-approval-native işlemeyi sürdürür.

    Kısa sürüm: iletme yönlendirme içindir, yerel istemci yapılandırması daha zengin kanala özgü UX içindir.
    [Exec Onayları](/tr/tools/exec-approvals) bölümüne bakın.

  </Accordion>

  <Accordion title="Hangi runtime gerekiyor?">
    Node **>= 22** gereklidir. `pnpm` önerilir. Bun, Gateway için **önerilmez**.
  </Accordion>

  <Accordion title="Raspberry Pi üzerinde çalışır mı?">
    Evet. Gateway hafiftir - dokümanlar kişisel kullanım için **512MB-1GB RAM**, **1 çekirdek** ve yaklaşık **500MB**
    diskin yeterli olduğunu listeler ve **Raspberry Pi 4'ün çalıştırabileceğini** belirtir.

    Ek pay (günlükler, medya, diğer servisler) istiyorsanız **2GB önerilir**, ancak bu
    zorunlu bir minimum değildir.

    İpucu: küçük bir Pi/VPS Gateway'i barındırabilir ve yerel ekran/kamera/canvas veya komut çalıştırma için
    dizüstü bilgisayarınızdaki/telefonunuzdaki **düğümleri** eşleyebilirsiniz. [Düğümler](/tr/nodes) bölümüne bakın.

  </Accordion>

  <Accordion title="Raspberry Pi kurulumları için ipucu var mı?">
    Kısa sürüm: çalışır, ancak pürüzler bekleyin.

    - **64-bit** işletim sistemi kullanın ve Node >= 22 tutun.
    - Günlükleri görebilmek ve hızlı güncelleyebilmek için **hacklenebilir (git) kurulumu** tercih edin.
    - Kanallar/skills olmadan başlayın, sonra bunları tek tek ekleyin.
    - Garip binary sorunlarıyla karşılaşırsanız, bu genellikle bir **ARM uyumluluğu** sorunudur.

    Dokümanlar: [Linux](/tr/platforms/linux), [Kurulum](/tr/install).

  </Accordion>

  <Accordion title="wake up my friend üzerinde takıldı / onboarding hatch olmuyor. Şimdi ne yapmalıyım?">
    Bu ekran Gateway'in erişilebilir ve kimliği doğrulanmış olmasına bağlıdır. TUI ayrıca ilk hatch sırasında
    "Wake up, my friend!" mesajını otomatik gönderir. Bu satırı **yanıt olmadan** görüyorsanız
    ve token'lar 0'da kalıyorsa, ajan hiç çalışmamıştır.

    1. Gateway'i yeniden başlatın:

    ```bash
    openclaw gateway restart
    ```

    2. Durum + kimlik doğrulamayı denetleyin:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Hâlâ takılıyorsa çalıştırın:

    ```bash
    openclaw doctor
    ```

    Gateway uzaksa, tünel/Tailscale bağlantısının ayakta olduğundan ve UI'ın
    doğru Gateway'e yöneldiğinden emin olun. [Uzak erişim](/tr/gateway/remote) bölümüne bakın.

  </Accordion>

  <Accordion title="Onboarding'i yeniden yapmadan kurulumumu yeni bir makineye (Mac mini) taşıyabilir miyim?">
    Evet. **Durum dizinini** ve **çalışma alanını** kopyalayın, ardından Doctor'ı bir kez çalıştırın. Bu,
    **iki** konumu da kopyaladığınız sürece botunuzu "tamamen aynı" (bellek, oturum geçmişi, kimlik doğrulama ve kanal
    durumu) tutar:

    1. Yeni makineye OpenClaw kurun.
    2. Eski makineden `$OPENCLAW_STATE_DIR` (varsayılan: `~/.openclaw`) kopyalayın.
    3. Çalışma alanınızı kopyalayın (varsayılan: `~/.openclaw/workspace`).
    4. `openclaw doctor` çalıştırın ve Gateway servisini yeniden başlatın.

    Bu; yapılandırmayı, kimlik doğrulama profillerini, WhatsApp kimlik bilgilerini, oturumları ve belleği korur. Uzak
    moddaysanız, oturum deposunun ve çalışma alanının gateway host'a ait olduğunu unutmayın.

    **Önemli:** çalışma alanınızı yalnızca GitHub'a commit/push ederseniz,
    **bellek + bootstrap dosyalarını** yedeklersiniz, ancak oturum geçmişini veya kimlik doğrulamayı **yedeklemezsiniz**. Bunlar
    `~/.openclaw/` altında yaşar (örneğin `~/.openclaw/agents/<agentId>/sessions/`).

    İlgili: [Taşıma](/tr/install/migrating), [Dosyada her şey nerede bulunur](#where-things-live-on-disk),
    [Ajan çalışma alanı](/tr/concepts/agent-workspace), [Doctor](/tr/gateway/doctor),
    [Uzak mod](/tr/gateway/remote).

  </Accordion>

  <Accordion title="En son sürümde nelerin yeni olduğunu nerede görürüm?">
    GitHub changelog'unu denetleyin:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    En yeni girdiler en üsttedir. En üst bölüm **Unreleased** olarak işaretliyse, sonraki tarihli
    bölüm en son yayınlanmış sürümdür. Girdiler **Öne Çıkanlar**, **Değişiklikler** ve
    **Düzeltmeler** (gerektiğinde dokümanlar/diğer bölümlerle birlikte) olarak gruplanır.

  </Accordion>

  <Accordion title="docs.openclaw.ai erişilemiyor (SSL hatası)">
    Bazı Comcast/Xfinity bağlantıları, Xfinity Advanced Security üzerinden `docs.openclaw.ai` adresini yanlışlıkla engeller.
    Bunu devre dışı bırakın veya `docs.openclaw.ai` adresini allowlist'e ekleyin, sonra yeniden deneyin.
    Engelin kaldırılmasına yardımcı olmak için lütfen buradan bildirin: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Siteye hâlâ ulaşamıyorsanız, dokümanlar GitHub üzerinde yansıtılır:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Kararlı ve beta arasındaki fark">
    **Kararlı** ve **beta**, ayrı kod hatları değil, **npm dist-tag**'leridir:

    - `latest` = kararlı
    - `beta` = test için erken derleme

    Genellikle kararlı bir sürüm önce **beta**'ya gelir, ardından açık bir
    yükseltme adımı aynı sürümü `latest` konumuna taşır. Bakımcılar gerektiğinde
    doğrudan `latest` olarak da yayımlayabilir. Bu yüzden beta ve kararlı,
    yükseltmeden sonra **aynı sürüme** işaret edebilir.

    Nelerin değiştiğine bakın:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Tek satırlık kurulum komutları ve beta ile dev arasındaki fark için aşağıdaki akordiyona bakın.

  </Accordion>

  <Accordion title="Beta sürümünü nasıl kurarım ve beta ile dev arasındaki fark nedir?">
    **Beta**, npm dist-tag'i `beta`dır (yükseltmeden sonra `latest` ile eşleşebilir).
    **Dev**, `main` dalının hareketli başıdır (git); yayımlandığında npm dist-tag'i `dev` kullanılır.

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

  <Accordion title="En yeni parçaları nasıl denerim?">
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

    Elle temiz bir klon tercih ediyorsanız şunu kullanın:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Belgeler: [Güncelle](/tr/cli/update), [Geliştirme kanalları](/tr/install/development-channels),
    [Kurulum](/tr/install).

  </Accordion>

  <Accordion title="Kurulum ve onboarding genellikle ne kadar sürer?">
    Kabaca kılavuz:

    - **Kurulum:** 2-5 dakika
    - **Onboarding:** Yapılandırdığınız kanal/model sayısına bağlı olarak 5-15 dakika

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
    Windows'ta sık görülen iki sorun:

    **1) npm error spawn git / git not found**

    - **Git for Windows** kurun ve `git`'in PATH üzerinde olduğundan emin olun.
    - PowerShell'i kapatıp yeniden açın, ardından yükleyiciyi yeniden çalıştırın.

    **2) Kurulumdan sonra openclaw tanınmıyor**

    - npm global bin klasörünüz PATH üzerinde değil.
    - Yolu kontrol edin:

      ```powershell
      npm config get prefix
      ```

    - Bu dizini kullanıcı PATH'inize ekleyin (Windows'ta `\bin` soneki gerekmez; çoğu sistemde `%AppData%\npm` olur).
    - PATH'i güncelledikten sonra PowerShell'i kapatıp yeniden açın.

    En sorunsuz Windows kurulumunu istiyorsanız yerel Windows yerine **WSL2** kullanın.
    Belgeler: [Windows](/tr/platforms/windows).

  </Accordion>

  <Accordion title="Windows exec çıktısı bozuk Çince metin gösteriyor - ne yapmalıyım?">
    Bu genellikle yerel Windows kabuklarında konsol kod sayfası uyumsuzluğudur.

    Belirtiler:

    - `system.run`/`exec` çıktısı Çinceyi mojibake olarak işler
    - Aynı komut başka bir terminal profilinde düzgün görünür

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

    Bunu en son OpenClaw üzerinde hâlâ yeniden üretebiliyorsanız şurada takip edin/bildirin:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Belgeler sorumu yanıtlamadı - nasıl daha iyi bir yanıt alırım?">
    Tam kaynak ve belgeler yerelde olsun diye **değiştirilebilir (git) kurulum** kullanın, ardından
    botunuza (veya Claude/Codex'e) _o klasörden_ sorun; böylece repoyu okuyup kesin yanıt verebilir.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Daha fazla ayrıntı: [Kurulum](/tr/install) ve [Yükleyici bayrakları](/tr/install/installer).

  </Accordion>

  <Accordion title="OpenClaw'u Linux'a nasıl kurarım?">
    Kısa yanıt: Linux kılavuzunu izleyin, ardından onboarding çalıştırın.

    - Linux hızlı yolu + hizmet kurulumu: [Linux](/tr/platforms/linux).
    - Tam adım adım kılavuz: [Başlarken](/tr/start/getting-started).
    - Yükleyici + güncellemeler: [Kurulum ve güncellemeler](/tr/install/updating).

  </Accordion>

  <Accordion title="OpenClaw'u bir VPS'e nasıl kurarım?">
    Herhangi bir Linux VPS çalışır. Sunucuya kurun, ardından Gateway'e erişmek için SSH/Tailscale kullanın.

    Kılavuzlar: [exe.dev](/tr/install/exe-dev), [Hetzner](/tr/install/hetzner), [Fly.io](/tr/install/fly).
    Uzaktan erişim: [Gateway uzaktan](/tr/gateway/remote).

  </Accordion>

  <Accordion title="Bulut/VPS kurulum kılavuzları nerede?">
    Yaygın sağlayıcılarla bir **barındırma merkezi** tutuyoruz. Birini seçin ve kılavuzu izleyin:

    - [VPS barındırma](/tr/vps) (tüm sağlayıcılar tek yerde)
    - [Fly.io](/tr/install/fly)
    - [Hetzner](/tr/install/hetzner)
    - [exe.dev](/tr/install/exe-dev)

    Bulutta çalışma şekli: **Gateway sunucuda çalışır** ve ona
    dizüstü bilgisayarınızdan/telefonunuzdan Control UI (veya Tailscale/SSH) aracılığıyla erişirsiniz. Durumunuz + çalışma alanınız
    sunucuda yaşar, bu yüzden ana makineyi doğruluk kaynağı olarak kabul edin ve yedekleyin.

    Yerel ekran/kamera/canvas'a erişmek veya Gateway'i bulutta tutarken dizüstü bilgisayarınızda
    komut çalıştırmak için **düğümleri** (Mac/iOS/Android/headless) bu bulut Gateway ile eşleştirebilirsiniz.

    Merkez: [Platformlar](/tr/platforms). Uzaktan erişim: [Gateway uzaktan](/tr/gateway/remote).
    Düğümler: [Düğümler](/tr/nodes), [Düğümler CLI](/tr/cli/nodes).

  </Accordion>

  <Accordion title="OpenClaw'dan kendini güncellemesini isteyebilir miyim?">
    Kısa yanıt: **mümkün, önerilmez**. Güncelleme akışı
    Gateway'i yeniden başlatabilir (bu aktif oturumu düşürür), temiz bir git checkout gerektirebilir ve
    onay isteyebilir. Daha güvenlisi: güncellemeleri operatör olarak bir kabuktan çalıştırın.

    CLI'ı kullanın:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Bir agent'tan otomatikleştirmeniz gerekiyorsa:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Belgeler: [Güncelle](/tr/cli/update), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="Onboarding gerçekte ne yapar?">
    `openclaw onboard`, önerilen kurulum yoludur. **Yerel modda** sizi şunlardan geçirir:

    - **Model/kimlik doğrulama kurulumu** (sağlayıcı OAuth, API anahtarları, Anthropic setup-token ve LM Studio gibi yerel model seçenekleri)
    - **Çalışma alanı** konumu + önyükleme dosyaları
    - **Gateway ayarları** (bind/port/auth/tailscale)
    - **Kanallar** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage ve QQ Bot gibi paketli kanal plugin'leri)
    - **Daemon kurulumu** (macOS'ta LaunchAgent; Linux/WSL2'de systemd kullanıcı birimi)
    - **Sağlık kontrolleri** ve **skills** seçimi

    Yapılandırılmış modeliniz bilinmiyorsa veya kimlik doğrulaması eksikse uyarı da verir.

  </Accordion>

  <Accordion title="Bunu çalıştırmak için Claude veya OpenAI aboneliğine ihtiyacım var mı?">
    Hayır. OpenClaw'u **API anahtarlarıyla** (Anthropic/OpenAI/diğerleri) veya
    verileriniz cihazınızda kalsın diye **yalnızca yerel modellerle** çalıştırabilirsiniz. Abonelikler (Claude
    Pro/Max veya OpenAI Codex), bu sağlayıcılarda kimlik doğrulamak için isteğe bağlı yollardır.

    OpenClaw içinde Anthropic için pratik ayrım şudur:

    - **Anthropic API anahtarı**: normal Anthropic API faturalandırması
    - **OpenClaw'da Claude CLI / Claude abonelik kimlik doğrulaması**: Anthropic personeli
      bize bu kullanımın yeniden izinli olduğunu söyledi ve OpenClaw, Anthropic yeni bir
      politika yayımlamadıkça bu entegrasyon için `claude -p`
      kullanımını onaylı kabul ediyor

    Uzun ömürlü gateway ana makineleri için Anthropic API anahtarları hâlâ daha
    öngörülebilir kurulumdur. OpenAI Codex OAuth, OpenClaw gibi harici
    araçlar için açıkça desteklenir.

    OpenClaw ayrıca **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** ve
    **Z.AI / GLM Coding Plan** dahil olmak üzere diğer barındırılan abonelik tarzı seçenekleri destekler.

    Belgeler: [Anthropic](/tr/providers/anthropic), [OpenAI](/tr/providers/openai),
    [Qwen Cloud](/tr/providers/qwen),
    [MiniMax](/tr/providers/minimax), [GLM Modelleri](/tr/providers/glm),
    [Yerel modeller](/tr/gateway/local-models), [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="Claude Max aboneliğini API anahtarı olmadan kullanabilir miyim?">
    Evet.

    Anthropic personeli bize OpenClaw tarzı Claude CLI kullanımının yeniden izinli olduğunu söyledi, bu yüzden
    OpenClaw, Anthropic yeni bir politika yayımlamadıkça Claude abonelik kimlik doğrulamasını ve `claude -p` kullanımını
    bu entegrasyon için onaylı kabul eder. En öngörülebilir sunucu tarafı kurulumu istiyorsanız
    bunun yerine Anthropic API anahtarı kullanın.

  </Accordion>

  <Accordion title="Claude abonelik kimlik doğrulamasını (Claude Pro veya Max) destekliyor musunuz?">
    Evet.

    Anthropic personeli bize bu kullanımın yeniden izinli olduğunu söyledi, bu yüzden OpenClaw
    Anthropic yeni bir politika yayımlamadıkça Claude CLI yeniden kullanımını ve `claude -p` kullanımını
    bu entegrasyon için onaylı kabul eder.

    Anthropic setup-token, desteklenen bir OpenClaw token yolu olarak hâlâ kullanılabilir, ancak OpenClaw artık mevcut olduğunda Claude CLI yeniden kullanımını ve `claude -p`'yi tercih eder.
    Üretim veya çok kullanıcılı iş yükleri için Anthropic API anahtarı kimlik doğrulaması hâlâ
    daha güvenli ve daha öngörülebilir seçimdir. OpenClaw içinde başka abonelik tarzı barındırılan
    seçenekler istiyorsanız [OpenAI](/tr/providers/openai), [Qwen / Model
    Cloud](/tr/providers/qwen), [MiniMax](/tr/providers/minimax) ve [GLM
    Modelleri](/tr/providers/glm) sayfalarına bakın.

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Neden Anthropic'ten HTTP 429 rate_limit_error görüyorum?">
    Bu, mevcut pencere için **Anthropic kota/hız limitinizin** tükendiği anlamına gelir. **Claude CLI** kullanıyorsanız
    pencerenin sıfırlanmasını bekleyin veya planınızı yükseltin. **Anthropic API anahtarı** kullanıyorsanız
    kullanım/faturalandırma için Anthropic Console'u kontrol edin ve gerektiğinde limitleri artırın.

    Mesaj özellikle şunu söylüyorsa:
    `Extra usage is required for long context requests`, istek
    Anthropic'in 1M context beta'sını (`context1m: true`) kullanmaya çalışıyordur. Bu yalnızca
    kimlik bilginiz uzun bağlam faturalandırması için uygunsa (API anahtarı faturalandırması veya
    Extra Usage etkinleştirilmiş OpenClaw Claude-login yolu) çalışır.

    İpucu: OpenClaw’ın bir sağlayıcı hız sınırına takıldığında yanıt vermeye devam edebilmesi için bir **yedek model** ayarlayın.
    Bkz. [Modeller](/tr/cli/models), [OAuth](/tr/concepts/oauth) ve
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/tr/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock destekleniyor mu?">
    Evet. OpenClaw, paketle birlikte gelen bir **Amazon Bedrock (Converse)** sağlayıcısına sahiptir. AWS ortam işaretleri mevcut olduğunda OpenClaw, akış/metin Bedrock kataloğunu otomatik olarak keşfedip örtük bir `amazon-bedrock` sağlayıcısı olarak birleştirebilir; aksi halde `plugins.entries.amazon-bedrock.config.discovery.enabled` ayarını açıkça etkinleştirebilir veya manuel bir sağlayıcı girdisi ekleyebilirsiniz. Bkz. [Amazon Bedrock](/tr/providers/bedrock) ve [Model sağlayıcıları](/tr/providers/models). Yönetilen bir anahtar akışını tercih ediyorsanız, Bedrock’un önünde OpenAI uyumlu bir proxy de hâlâ geçerli bir seçenektir.
  </Accordion>

  <Accordion title="Codex kimlik doğrulaması nasıl çalışır?">
    OpenClaw, OAuth (ChatGPT oturum açma) üzerinden **OpenAI Code (Codex)** desteği sağlar. Yaygın kurulum için
    `agentRuntime.id: "codex"` ile `openai/gpt-5.5` kullanın:
    ChatGPT/Codex abonelik kimlik doğrulaması ve yerel Codex uygulama sunucusu yürütmesi. Varsayılan
    PI çalıştırıcısı üzerinden Codex OAuth istediğinizde yalnızca
    `openai-codex/gpt-5.5` kullanın. Doğrudan OpenAI API anahtarı erişimi için
    Codex çalışma zamanı geçersiz kılması olmadan `openai/gpt-5.5` kullanın.
    Bkz. [Model sağlayıcıları](/tr/concepts/model-providers) ve [Başlatma (CLI)](/tr/start/wizard).
  </Accordion>

  <Accordion title="OpenClaw neden hâlâ openai-codex'ten bahsediyor?">
    `openai-codex`, ChatGPT/Codex OAuth için sağlayıcı ve kimlik doğrulama profili kimliğidir.
    Ayrıca Codex OAuth için açık PI model önekidir:

    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = yerel Codex çalışma zamanı ile ChatGPT/Codex abonelik kimlik doğrulaması
    - `openai-codex/gpt-5.5` = PI içinde Codex OAuth rotası
    - Codex çalışma zamanı geçersiz kılması olmadan `openai/gpt-5.5` = PI içinde doğrudan OpenAI API anahtarı rotası
    - `openai-codex:...` = kimlik doğrulama profili kimliği, model referansı değil

    Doğrudan OpenAI Platform faturalandırma/sınır yolunu istiyorsanız
    `OPENAI_API_KEY` ayarlayın. ChatGPT/Codex abonelik kimlik doğrulaması istiyorsanız
    `openclaw models auth login --provider openai-codex` ile oturum açın. Yerel Codex
    çalışma zamanı için model referansını `openai/gpt-5.5` olarak tutun ve
    `agentRuntime.id: "codex"` ayarlayın. `openai-codex/*` model referanslarını yalnızca PI
    çalıştırmaları için kullanın.

  </Accordion>

  <Accordion title="Codex OAuth sınırları neden ChatGPT web'den farklı olabilir?">
    Codex OAuth, OpenAI tarafından yönetilen, plana bağlı kota pencereleri kullanır. Pratikte,
    her ikisi de aynı hesaba bağlı olsa bile bu sınırlar ChatGPT web sitesi/uygulama deneyiminden farklı olabilir.

    OpenClaw, şu anda görünen sağlayıcı kullanım/kota pencerelerini
    `openclaw models status` içinde gösterebilir, ancak ChatGPT web
    haklarını doğrudan API erişimine uydurmaz veya bunları kendisi oluşturmaz. Doğrudan OpenAI Platform
    faturalandırma/sınır yolunu istiyorsanız, bir API anahtarıyla `openai/*` kullanın.

  </Accordion>

  <Accordion title="OpenAI abonelik kimlik doğrulamasını (Codex OAuth) destekliyor musunuz?">
    Evet. OpenClaw, **OpenAI Code (Codex) abonelik OAuth** desteğini tam olarak sağlar.
    OpenAI, OpenClaw gibi harici araçlarda/iş akışlarında abonelik OAuth kullanımına açıkça izin verir.
    Başlatma süreci OAuth akışını sizin için çalıştırabilir.

    Bkz. [OAuth](/tr/concepts/oauth), [Model sağlayıcıları](/tr/concepts/model-providers) ve [Başlatma (CLI)](/tr/start/wizard).

  </Accordion>

  <Accordion title="Gemini CLI OAuth'u nasıl kurarım?">
    Gemini CLI, `openclaw.json` içinde bir istemci kimliği veya gizli anahtar değil, bir **Plugin kimlik doğrulama akışı** kullanır.

    Adımlar:

    1. Gemini CLI’yi yerel olarak kurun; böylece `gemini`, `PATH` üzerinde olur
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin'i etkinleştirin: `openclaw plugins enable google`
    3. Oturum açın: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Oturum açtıktan sonraki varsayılan model: `google-gemini-cli/gemini-3-flash-preview`
    5. İstekler başarısız olursa Gateway ana makinesinde `GOOGLE_CLOUD_PROJECT` veya `GOOGLE_CLOUD_PROJECT_ID` ayarlayın

    Bu, OAuth belirteçlerini Gateway ana makinesindeki kimlik doğrulama profillerinde saklar. Ayrıntılar: [Model sağlayıcıları](/tr/concepts/model-providers).

  </Accordion>

  <Accordion title="Yerel bir model gündelik sohbetler için uygun mu?">
    Genellikle hayır. OpenClaw büyük bağlam + güçlü güvenlik gerektirir; küçük kartlar metni kırpar ve sızıntıya yol açar. Mecbursanız, yerel olarak çalıştırabileceğiniz **en büyük** model derlemesini (LM Studio) çalıştırın ve [/gateway/local-models](/tr/gateway/local-models) sayfasına bakın. Daha küçük/nicelenmiş modeller prompt injection riskini artırır - bkz. [Güvenlik](/tr/gateway/security).
  </Accordion>

  <Accordion title="Barındırılan model trafiğini belirli bir bölgede nasıl tutarım?">
    Bölgeye sabitlenmiş uç noktaları seçin. OpenRouter, MiniMax, Kimi ve GLM için ABD’de barındırılan seçenekler sunar; veriyi bölgede tutmak için ABD’de barındırılan varyantı seçin. Yedeklerin kullanılabilir kalmasını sağlarken seçtiğiniz bölgesel sağlayıcıya uymak için `models.mode: "merge"` kullanarak Anthropic/OpenAI’yi bunların yanında listelemeye devam edebilirsiniz.
  </Accordion>

  <Accordion title="Bunu kurmak için Mac Mini almam gerekiyor mu?">
    Hayır. OpenClaw macOS veya Linux üzerinde çalışır (Windows için WSL2 üzerinden). Mac mini isteğe bağlıdır - bazı kişiler
    sürekli açık bir ana makine olarak bir tane alır, ancak küçük bir VPS, ev sunucusu veya Raspberry Pi sınıfı bir cihaz da işe yarar.

    Yalnızca **macOS'a özel araçlar** için bir Mac gerekir. iMessage için [BlueBubbles](/tr/channels/bluebubbles) kullanın (önerilir) - BlueBubbles sunucusu herhangi bir Mac üzerinde çalışır ve Gateway Linux üzerinde veya başka bir yerde çalışabilir. Başka macOS'a özel araçlar istiyorsanız Gateway'i bir Mac üzerinde çalıştırın veya bir macOS Node eşleştirin.

    Belgeler: [BlueBubbles](/tr/channels/bluebubbles), [Node'lar](/tr/nodes), [Mac uzaktan modu](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="iMessage desteği için Mac mini gerekiyor mu?">
    Messages’a oturum açmış **herhangi bir macOS cihazına** ihtiyacınız var. Bunun bir Mac mini olması **gerekmez** -
    herhangi bir Mac olur. iMessage için **[BlueBubbles](/tr/channels/bluebubbles) kullanın** (önerilir) - BlueBubbles sunucusu macOS üzerinde çalışırken Gateway Linux üzerinde veya başka bir yerde çalışabilir.

    Yaygın kurulumlar:

    - Gateway'i Linux/VPS üzerinde çalıştırın ve BlueBubbles sunucusunu Messages’a oturum açmış herhangi bir Mac üzerinde çalıştırın.
    - En basit tek makineli kurulumu istiyorsanız her şeyi Mac üzerinde çalıştırın.

    Belgeler: [BlueBubbles](/tr/channels/bluebubbles), [Node'lar](/tr/nodes),
    [Mac uzaktan modu](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="OpenClaw çalıştırmak için Mac mini alırsam, onu MacBook Pro'ma bağlayabilir miyim?">
    Evet. **Mac mini Gateway'i çalıştırabilir** ve MacBook Pro’nuz bir
    **node** (yardımcı cihaz) olarak bağlanabilir. Node'lar Gateway'i çalıştırmaz - o cihazda ekran/kamera/canvas ve `system.run` gibi ek
    yetenekler sağlar.

    Yaygın kalıp:

    - Gateway Mac mini üzerinde (sürekli açık).
    - MacBook Pro macOS uygulamasını veya bir node ana makinesini çalıştırır ve Gateway ile eşleşir.
    - Görmek için `openclaw nodes status` / `openclaw nodes list` kullanın.

    Belgeler: [Node'lar](/tr/nodes), [Nodes CLI](/tr/cli/nodes).

  </Accordion>

  <Accordion title="Bun kullanabilir miyim?">
    Bun **önerilmez**. Özellikle WhatsApp ve Telegram ile çalışma zamanı hataları görüyoruz.
    Kararlı Gateway'ler için **Node** kullanın.

    Yine de Bun ile denemek istiyorsanız, bunu WhatsApp/Telegram olmayan üretim dışı bir Gateway üzerinde yapın.

  </Accordion>

  <Accordion title="Telegram: allowFrom içine ne yazılır?">
    `channels.telegram.allowFrom`, **insan gönderenin Telegram kullanıcı kimliğidir** (sayısal). Bot kullanıcı adı değildir.

    Kurulum yalnızca sayısal kullanıcı kimlikleri ister. Yapılandırmada eski `@username` girdileriniz zaten varsa, `openclaw doctor --fix` bunları çözümlemeyi deneyebilir.

    Daha güvenli (üçüncü taraf bot yok):

    - Botunuza DM gönderin, ardından `openclaw logs --follow` çalıştırın ve `from.id` değerini okuyun.

    Resmi Bot API:

    - Botunuza DM gönderin, ardından `https://api.telegram.org/bot<bot_token>/getUpdates` çağrısını yapın ve `message.from.id` değerini okuyun.

    Üçüncü taraf (daha az özel):

    - `@userinfobot` veya `@getidsbot` hesabına DM gönderin.

    Bkz. [/channels/telegram](/tr/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Birden fazla kişi farklı OpenClaw örnekleriyle tek bir WhatsApp numarası kullanabilir mi?">
    Evet, **çok aracılı yönlendirme** üzerinden. Her gönderenin WhatsApp **DM**’ini (eş `kind: "direct"`, gönderen E.164 biçiminde, örneğin `+15551234567`) farklı bir `agentId` değerine bağlayın; böylece her kişi kendi çalışma alanını ve oturum deposunu alır. Yanıtlar hâlâ **aynı WhatsApp hesabından** gelir ve DM erişim denetimi (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) WhatsApp hesabı başına geneldir. Bkz. [Çok Aracılı Yönlendirme](/tr/concepts/multi-agent) ve [WhatsApp](/tr/channels/whatsapp).
  </Accordion>

  <Accordion title='Bir "hızlı sohbet" aracısı ve bir "kodlama için Opus" aracısı çalıştırabilir miyim?'>
    Evet. Çok aracılı yönlendirme kullanın: her aracıya kendi varsayılan modelini verin, ardından gelen rotaları (sağlayıcı hesabı veya belirli eşler) her aracıya bağlayın. Örnek yapılandırma [Çok Aracılı Yönlendirme](/tr/concepts/multi-agent) içinde bulunur. Ayrıca bkz. [Modeller](/tr/concepts/models) ve [Yapılandırma](/tr/gateway/configuration).
  </Accordion>

  <Accordion title="Homebrew Linux'ta çalışır mı?">
    Evet. Homebrew Linux’u destekler (Linuxbrew). Hızlı kurulum:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    OpenClaw’ı systemd üzerinden çalıştırıyorsanız, hizmet PATH değerinin `/home/linuxbrew/.linuxbrew/bin` (veya brew önekinizi) içerdiğinden emin olun; böylece `brew` ile kurulan araçlar oturum açılmayan kabuklarda çözümlenir.
    Son derlemeler ayrıca Linux systemd hizmetlerinde yaygın kullanıcı bin dizinlerini başa ekler (örneğin `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) ve ayarlandığında `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` ve `FNM_DIR` değerlerini dikkate alır.

  </Accordion>

  <Accordion title="Düzenlenebilir git kurulumu ile npm kurulumu arasındaki fark">
    - **Düzenlenebilir (git) kurulum:** tam kaynak checkout, düzenlenebilir, katkıda bulunanlar için en iyisi.
      Derlemeleri yerel olarak çalıştırırsınız ve kod/belge yamalayabilirsiniz.
    - **npm kurulumu:** global CLI kurulumu, repo yok, "sadece çalıştırmak" için en iyisi.
      Güncellemeler npm dist-tag’lerinden gelir.

    Belgeler: [Başlarken](/tr/start/getting-started), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="Daha sonra npm ve git kurulumları arasında geçiş yapabilir miyim?">
    Evet. OpenClaw zaten kurulu olduğunda `openclaw update --channel ...` kullanın.
    Bu **verilerinizi silmez** - yalnızca OpenClaw kod kurulumunu değiştirir.
    Durumunuz (`~/.openclaw`) ve çalışma alanınız (`~/.openclaw/workspace`) dokunulmadan kalır.

    npm’den git’e:

    ```bash
    openclaw update --channel dev
    ```

    git’ten npm’ye:

    ```bash
    openclaw update --channel stable
    ```

    Önce planlanan mod geçişini önizlemek için `--dry-run` ekleyin. Güncelleyici
    Doctor takip işlemlerini çalıştırır, hedef kanal için Plugin kaynaklarını yeniler ve
    `--no-restart` geçmediğiniz sürece Gateway'i yeniden başlatır.

    Kurucu da iki moddan birini zorlayabilir:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Yedekleme ipuçları: bkz. [Diskte şeylerin nerede bulunduğu](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Gateway'i dizüstü bilgisayarımda mı yoksa VPS'te mi çalıştırmalıyım?">
    Kısa yanıt: **7/24 güvenilirlik istiyorsanız VPS kullanın**. En düşük
    sürtünmeyi istiyorsanız ve uyku/yeniden başlatmalar sorun değilse, yerel olarak çalıştırın.

    **Dizüstü bilgisayar (yerel Gateway)**

    - **Artılar:** sunucu maliyeti yok, yerel dosyalara doğrudan erişim, canlı tarayıcı penceresi.
    - **Eksiler:** uyku/ağ kesintileri = bağlantı kopmaları, işletim sistemi güncellemeleri/yeniden başlatmaları kesinti yaratır, uyanık kalması gerekir.

    **VPS / bulut**

    - **Artıları:** her zaman açık, kararlı ağ, dizüstü bilgisayar uyku sorunları yok, çalışır durumda tutması daha kolay.
    - **Eksileri:** genellikle headless çalışır (ekran görüntüleri kullanın), yalnızca uzaktan dosya erişimi vardır, güncellemeler için SSH kullanmanız gerekir.

    **OpenClaw'a özgü not:** WhatsApp/Telegram/Slack/Mattermost/Discord bir VPS üzerinden sorunsuz çalışır. Tek gerçek değiş tokuş **headless tarayıcı** ile görünür pencere arasındadır. Bkz. [Tarayıcı](/tr/tools/browser).

    **Önerilen varsayılan:** Daha önce gateway bağlantı kopmaları yaşadıysanız VPS. Mac'i etkin olarak kullanıyorsanız ve yerel dosya erişimi ya da görünür bir tarayıcıyla UI otomasyonu istiyorsanız yerel kurulum harikadır.

  </Accordion>

  <Accordion title="OpenClaw'ı adanmış bir makinede çalıştırmak ne kadar önemlidir?">
    Zorunlu değildir, ancak **güvenilirlik ve yalıtım için önerilir**.

    - **Adanmış ana makine (VPS/Mac mini/Pi):** her zaman açık, daha az uyku/yeniden başlatma kesintisi, daha temiz izinler, çalışır durumda tutması daha kolay.
    - **Paylaşılan dizüstü/masaüstü:** test ve etkin kullanım için tamamen uygundur, ancak makine uyuduğunda veya güncellendiğinde duraklamalar bekleyin.

    İki dünyanın da en iyisini istiyorsanız Gateway'i adanmış bir ana makinede tutun ve dizüstü bilgisayarınızı yerel ekran/kamera/exec araçları için bir **node** olarak eşleştirin. Bkz. [Nodes](/tr/nodes).
    Güvenlik kılavuzu için [Güvenlik](/tr/gateway/security) bölümünü okuyun.

  </Accordion>

  <Accordion title="Minimum VPS gereksinimleri ve önerilen OS nedir?">
    OpenClaw hafiftir. Temel bir Gateway + bir sohbet kanalı için:

    - **Mutlak minimum:** 1 vCPU, 1GB RAM, ~500MB disk.
    - **Önerilen:** çalışma payı için 1-2 vCPU, 2GB RAM veya daha fazlası (günlükler, medya, birden çok kanal). Node araçları ve tarayıcı otomasyonu kaynak tüketebilir.

    OS: **Ubuntu LTS** kullanın (veya modern bir Debian/Ubuntu). Linux kurulum yolu en iyi burada test edilmiştir.

    Belgeler: [Linux](/tr/platforms/linux), [VPS barındırma](/tr/vps).

  </Accordion>

  <Accordion title="OpenClaw'ı bir VM içinde çalıştırabilir miyim ve gereksinimler nelerdir?">
    Evet. VM'yi VPS ile aynı şekilde değerlendirin: her zaman açık, erişilebilir olmalı ve Gateway ile etkinleştirdiğiniz kanallar için yeterli
    RAM'e sahip olmalıdır.

    Temel kılavuz:

    - **Mutlak minimum:** 1 vCPU, 1GB RAM.
    - **Önerilen:** birden çok kanal, tarayıcı otomasyonu veya medya araçları çalıştırıyorsanız 2GB RAM veya daha fazlası.
    - **OS:** Ubuntu LTS veya başka bir modern Debian/Ubuntu.

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

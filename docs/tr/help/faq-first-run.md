---
read_when:
    - Yeni kurulum, onboarding takılması veya ilk çalıştırma hataları
    - Kimlik doğrulama ve sağlayıcı aboneliklerini seçme
    - docs.openclaw.ai'ye erişilemiyor, pano açılamıyor, kurulum takıldı
sidebarTitle: First-run FAQ
summary: 'FAQ: hızlı başlangıç ve ilk çalıştırma kurulumu — yükleme, onboard, kimlik doğrulama, abonelikler, ilk hatalar'
title: 'SSS: ilk çalıştırma kurulumu'
x-i18n:
    generated_at: "2026-06-28T00:40:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 182022cc91cea7ec4857aeb222fe1d001a1476a90c221f610616cc7da7ba8a98
    source_path: help/faq-first-run.md
    workflow: 16
---

  Hızlı başlangıç ve ilk çalıştırma SSS. Günlük işlemler, modeller, kimlik doğrulama, oturumlar
  ve sorun giderme için ana [SSS](/tr/help/faq) sayfasına bakın.

  ## Hızlı başlangıç ve ilk çalıştırma kurulumu

  <AccordionGroup>
  <Accordion title="Takıldım, en hızlı çıkış yolu">
    **Makinenizi görebilen** yerel bir AI agent kullanın. Bu, Discord'da sormaktan çok daha etkilidir,
    çünkü çoğu "takıldım" durumu uzak yardımcıların inceleyemeyeceği **yerel yapılandırma veya ortam sorunlarıdır**.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Bu araçlar repoyu okuyabilir, komutları çalıştırabilir, günlükleri inceleyebilir ve makine düzeyindeki
    kurulumunuzu (PATH, hizmetler, izinler, kimlik doğrulama dosyaları) düzeltmeye yardımcı olabilir. Onlara
    hacklenebilir (git) kurulum aracılığıyla **tam kaynak checkout** verin:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Bu, OpenClaw'ı **bir git checkout içinden** kurar; böylece agent kodu + dokümantasyonu okuyabilir ve
    çalıştırdığınız tam sürüm hakkında akıl yürütebilir. Daha sonra yükleyiciyi `--install-method git` olmadan
    yeniden çalıştırarak istediğiniz zaman kararlı sürüme geri dönebilirsiniz.

    İpucu: agent'tan düzeltmeyi **planlamasını ve denetlemesini** (adım adım) isteyin, ardından yalnızca
    gerekli komutları yürütün. Bu, değişiklikleri küçük ve denetlemesi daha kolay tutar.

    Gerçek bir hata veya düzeltme keşfederseniz, lütfen bir GitHub issue açın veya PR gönderin:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Bu komutlarla başlayın (yardım isterken çıktıları paylaşın):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Ne yaptıkları:

    - `openclaw status`: gateway/agent sağlığı + temel yapılandırmanın hızlı anlık görüntüsü.
    - `openclaw models status`: sağlayıcı kimlik doğrulamasını + model kullanılabilirliğini denetler.
    - `openclaw doctor`: yaygın yapılandırma/durum sorunlarını doğrular ve onarır.

    Diğer yararlı CLI denetimleri: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Hızlı hata ayıklama döngüsü: [Bir şey bozuksa ilk 60 saniye](/tr/help/faq#first-60-seconds-if-something-is-broken).
    Kurulum dokümanları: [Kurulum](/tr/install), [Yükleyici bayrakları](/tr/install/installer), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="Heartbeat sürekli atlıyor. Atlama nedenleri ne anlama geliyor?">
    Yaygın heartbeat atlama nedenleri:

    - `quiet-hours`: yapılandırılmış etkin saatler penceresinin dışında
    - `empty-heartbeat-file`: `HEARTBEAT.md` var ancak yalnızca boş, yorum, başlık, fence veya boş denetim listesi iskeleti içeriyor
    - `no-tasks-due`: `HEARTBEAT.md` görev modu etkin ancak görev aralıklarının hiçbiri henüz gelmemiş
    - `alerts-disabled`: tüm heartbeat görünürlüğü devre dışı (`showOk`, `showAlerts` ve `useIndicator` tamamı kapalı)

    Görev modunda, vade zaman damgaları yalnızca gerçek bir heartbeat çalışması
    tamamlandıktan sonra ilerletilir. Atlanan çalışmalar görevleri tamamlanmış olarak işaretlemez.

    Dokümanlar: [Heartbeat](/tr/gateway/heartbeat), [Otomasyon](/tr/automation).

  </Accordion>

  <Accordion title="OpenClaw'ı kurmak ve ayarlamak için önerilen yol">
    Repo, kaynaktan çalıştırmayı ve onboarding kullanmayı önerir:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Sihirbaz UI varlıklarını da otomatik olarak derleyebilir. Onboarding sonrasında genellikle Gateway'i **18789** portunda çalıştırırsınız.

    Kaynaktan (katkıda bulunanlar/geliştiriciler):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Henüz global kurulumunuz yoksa, `pnpm openclaw onboard` ile çalıştırın.

  </Accordion>

  <Accordion title="Onboarding sonrasında dashboard'u nasıl açarım?">
    Sihirbaz, onboarding hemen sonrasında tarayıcınızı temiz (token'laştırılmamış) bir dashboard URL'siyle açar ve bağlantıyı özette de yazdırır. O sekmeyi açık tutun; açılmadıysa, yazdırılan URL'yi aynı makinede kopyalayıp yapıştırın.
  </Accordion>

  <Accordion title="Dashboard kimlik doğrulamasını localhost ve uzak ortamda nasıl yaparım?">
    **Localhost (aynı makine):**

    - `http://127.0.0.1:18789/` adresini açın.
    - Paylaşılan gizli anahtar kimlik doğrulaması isterse, yapılandırılmış token'ı veya parolayı Control UI ayarlarına yapıştırın.
    - Token kaynağı: `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`).
    - Parola kaynağı: `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`).
    - Henüz paylaşılan gizli anahtar yapılandırılmadıysa, `openclaw doctor --generate-gateway-token` ile bir token oluşturun.

    **Localhost üzerinde değilse:**

    - **Tailscale Serve** (önerilir): bind'i local loopback olarak tutun, `openclaw gateway --tailscale serve` çalıştırın, `https://<magicdns>/` adresini açın. `gateway.auth.allowTailscale` `true` ise, kimlik üstbilgileri Control UI/WebSocket kimlik doğrulamasını karşılar (yapıştırılmış paylaşılan gizli anahtar yok, güvenilir gateway host varsayılır); HTTP API'leri, özel olarak private-ingress `none` veya trusted-proxy HTTP auth kullanmadığınız sürece yine paylaşılan gizli anahtar kimlik doğrulaması gerektirir.
      Aynı istemciden gelen kötü eşzamanlı Serve auth denemeleri, failed-auth sınırlayıcı bunları kaydetmeden önce seri hale getirilir; bu yüzden ikinci kötü yeniden deneme zaten `retry later` gösterebilir.
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` çalıştırın (veya parola kimlik doğrulamasını yapılandırın), `http://<tailscale-ip>:18789/` adresini açın, ardından dashboard ayarlarına eşleşen paylaşılan gizli anahtarı yapıştırın.
    - **Kimlik farkındalıklı reverse proxy**: Gateway'i güvenilir bir proxy arkasında tutun, `gateway.auth.mode: "trusted-proxy"` yapılandırın, ardından proxy URL'sini açın. Aynı host local loopback proxy'leri açık `gateway.auth.trustedProxy.allowLoopback = true` gerektirir.
    - **SSH tüneli**: `ssh -N -L 18789:127.0.0.1:18789 user@host` ardından `http://127.0.0.1:18789/` adresini açın. Paylaşılan gizli anahtar kimlik doğrulaması tünel üzerinden hâlâ geçerlidir; istenirse yapılandırılmış token'ı veya parolayı yapıştırın.

    Bind modları ve auth ayrıntıları için [Dashboard](/tr/web/dashboard) ve [Web yüzeyleri](/tr/web) sayfalarına bakın.

  </Accordion>

  <Accordion title="Sohbet onayları için neden iki exec onay yapılandırması var?">
    Farklı katmanları kontrol ederler:

    - `approvals.exec`: onay istemlerini sohbet hedeflerine iletir
    - `channels.<channel>.execApprovals`: bu kanalın exec onayları için yerel bir onay istemcisi gibi davranmasını sağlar

    Host exec policy hâlâ gerçek onay kapısıdır. Sohbet yapılandırması yalnızca onay
    istemlerinin nerede görüneceğini ve insanların bunları nasıl yanıtlayabileceğini kontrol eder.

    Çoğu kurulumda ikisine birden **ihtiyacınız yoktur**:

    - Sohbet zaten komutları ve yanıtları destekliyorsa, aynı sohbet `/approve` paylaşılan yol üzerinden çalışır.
    - Desteklenen yerel bir kanal onaylayıcıları güvenli biçimde çıkarabiliyorsa, OpenClaw artık `channels.<channel>.execApprovals.enabled` ayarlanmadığında veya `"auto"` olduğunda DM öncelikli yerel onayları otomatik etkinleştirir.
    - Yerel onay kartları/düğmeleri kullanılabiliyorsa, birincil yol o yerel UI'dır; agent yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın tek yol olduğunu söylüyorsa manuel `/approve` komutu eklemelidir.
    - `approvals.exec` yalnızca istemlerin başka sohbetlere veya açık operasyon odalarına da iletilmesi gerektiğinde kullanın.
    - `channels.<channel>.execApprovals.target: "channel"` veya `"both"` değerini yalnızca onay istemlerinin açıkça kaynak oda/konuya geri gönderilmesini istediğinizde kullanın.
    - Plugin onayları yine ayrıdır: varsayılan olarak aynı sohbet `/approve`, isteğe bağlı `approvals.plugin` iletimi kullanırlar ve yalnızca bazı yerel kanallar bunun üstünde plugin-approval-native işlemeyi tutar.

    Kısa sürüm: iletme yönlendirme içindir, yerel istemci yapılandırması daha zengin kanala özgü UX içindir.
    [Exec Onayları](/tr/tools/exec-approvals) sayfasına bakın.

  </Accordion>

  <Accordion title="Hangi runtime gerekir?">
    Node **>= 22** gereklidir. `pnpm` önerilir. Bun, Gateway için **önerilmez**.
  </Accordion>

  <Accordion title="Raspberry Pi üzerinde çalışır mı?">
    Evet. Gateway hafiftir - dokümanlar kişisel kullanım için **512MB-1GB RAM**, **1 çekirdek** ve yaklaşık **500MB**
    diskin yeterli olduğunu listeler ve **Raspberry Pi 4 bunu çalıştırabilir** diye belirtir.

    Ek pay istiyorsanız (günlükler, medya, diğer hizmetler), **2GB önerilir**, ancak
    kesin bir minimum değildir.

    İpucu: küçük bir Raspberry Pi/VPS Gateway'i barındırabilir ve yerel ekran/kamera/canvas veya komut yürütme için
    dizüstü bilgisayarınızda/telefonunuzda **node'lar** eşleştirebilirsiniz. [Node'lar](/tr/nodes) sayfasına bakın.

  </Accordion>

  <Accordion title="Raspberry Pi kurulumları için ipucu var mı?">
    Kısa sürüm: çalışır, ancak pürüzler bekleyin.

    - **64-bit** OS kullanın ve Node >= 22 tutun.
    - Günlükleri görebilmek ve hızlı güncellemek için **hacklenebilir (git) kurulumu** tercih edin.
    - Kanallar/skills olmadan başlayın, sonra bunları tek tek ekleyin.
    - Tuhaf ikili dosya sorunları yaşarsanız, bu genellikle bir **ARM uyumluluğu** sorunudur.

    Dokümanlar: [Linux](/tr/platforms/linux), [Kurulum](/tr/install).

  </Accordion>

  <Accordion title="wake up my friend üzerinde takıldı / onboarding hatch olmuyor. Şimdi ne yapmalıyım?">
    Bu ekran Gateway'in erişilebilir ve kimliği doğrulanmış olmasına bağlıdır. TUI ayrıca ilk hatch sırasında
    "Wake up, my friend!" mesajını otomatik gönderir. Bu satırı **yanıt olmadan** görüyorsanız
    ve token'lar 0'da kalıyorsa, agent hiç çalışmamıştır.

    1. Gateway'i yeniden başlatın:

    ```bash
    openclaw gateway restart
    ```

    2. Durum + auth denetleyin:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Hâlâ takılıyorsa, şunu çalıştırın:

    ```bash
    openclaw doctor
    ```

    Gateway uzaksa, tünel/Tailscale bağlantısının açık olduğundan ve UI'ın
    doğru Gateway'e işaret ettiğinden emin olun. [Uzaktan erişim](/tr/gateway/remote) sayfasına bakın.

  </Accordion>

  <Accordion title="Onboarding'i yeniden yapmadan kurulumumu yeni bir makineye (Mac mini) taşıyabilir miyim?">
    Evet. **Durum dizinini** ve **çalışma alanını** kopyalayın, ardından Doctor'ı bir kez çalıştırın. Bu,
    **her iki** konumu da kopyaladığınız sürece botunuzu "tamamen aynı" tutar (bellek, oturum geçmişi, auth ve kanal
    durumu):

    1. Yeni makineye OpenClaw kurun.
    2. Eski makineden `$OPENCLAW_STATE_DIR` (varsayılan: `~/.openclaw`) kopyalayın.
    3. Çalışma alanınızı kopyalayın (varsayılan: `~/.openclaw/workspace`).
    4. `openclaw doctor` çalıştırın ve Gateway hizmetini yeniden başlatın.

    Bu, yapılandırmayı, auth profillerini, WhatsApp kimlik bilgilerini, oturumları ve belleği korur. Uzak
    moddaysanız, gateway host'un oturum deposuna ve çalışma alanına sahip olduğunu unutmayın.

    **Önemli:** yalnızca çalışma alanınızı GitHub'a commit/push ederseniz,
    **bellek + bootstrap dosyalarını** yedeklemiş olursunuz, ancak **oturum geçmişini veya auth'u** yedeklemezsiniz. Bunlar
    `~/.openclaw/` altında yaşar (örneğin `~/.openclaw/agents/<agentId>/sessions/`).

    İlgili: [Taşıma](/tr/install/migrating), [Diskte öğeler nerede yaşar](/tr/help/faq#where-things-live-on-disk),
    [Agent çalışma alanı](/tr/concepts/agent-workspace), [Doctor](/tr/gateway/doctor),
    [Uzak mod](/tr/gateway/remote).

  </Accordion>

  <Accordion title="En son sürümde nelerin yeni olduğunu nerede görürüm?">
    GitHub changelog'u kontrol edin:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    En yeni girdiler en üsttedir. En üst bölüm **Unreleased** olarak işaretliyse, sonraki tarihli
    bölüm en son yayımlanmış sürümdür. Girdiler **Öne çıkanlar**, **Değişiklikler** ve
    **Düzeltmeler** olarak gruplanır (gerektiğinde dokümanlar/diğer bölümlerle birlikte).

  </Accordion>

  <Accordion title="docs.openclaw.ai adresine erişilemiyor (SSL hatası)">
    Bazı Comcast/Xfinity bağlantıları `docs.openclaw.ai` adresini Xfinity
    Advanced Security üzerinden hatalı şekilde engeller. Bunu devre dışı bırakın veya `docs.openclaw.ai` adresini izin listesine alın, sonra yeniden deneyin.
    Engelin kaldırılmasına yardımcı olmak için lütfen buradan bildirin: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Siteye hâlâ erişemiyorsanız belgeler GitHub'da yansıtılır:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Kararlı ve beta arasındaki fark">
    **Kararlı** ve **beta**, ayrı kod satırları değil, **npm dist-tags**'tir:

    - `latest` = kararlı
    - `beta` = test için erken derleme

    Genellikle kararlı bir sürüm önce **beta**ya iner, ardından açık bir
    yükseltme adımı aynı sürümü `latest`'e taşır. Bakımcılar gerektiğinde
    doğrudan `latest`'e de yayımlayabilir. Bu yüzden beta ve kararlı, yükseltmeden
    sonra **aynı sürümü** gösterebilir.

    Nelerin değiştiğine bakın:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Tek satırlık kurulum komutları ve beta ile dev arasındaki fark için aşağıdaki akordeona bakın.

  </Accordion>

  <Accordion title="Beta sürümü nasıl kurarım ve beta ile dev arasındaki fark nedir?">
    **Beta**, npm dist-tag'i `beta`dır (yükseltmeden sonra `latest` ile eşleşebilir).
    **Dev**, `main`'in hareketli ucudur (git); yayımlandığında npm dist-tag'i `dev` kullanılır.

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

    Bu size düzenleyebileceğiniz yerel bir repo verir; ardından git üzerinden güncelleyebilirsiniz.

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

  <Accordion title="Kurulum ve başlangıç yapılandırması genellikle ne kadar sürer?">
    Yaklaşık rehber:

    - **Kurulum:** 2-5 dakika
    - **Başlangıç yapılandırması:** Yapılandırdığınız kanal/model sayısına bağlı olarak 5-15 dakika

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

    **1) npm error spawn git / git not found**

    - **Git for Windows**'u kurun ve `git`'in PATH'inizde olduğundan emin olun.
    - PowerShell'i kapatıp yeniden açın, ardından yükleyiciyi yeniden çalıştırın.

    **2) Kurulumdan sonra openclaw tanınmıyor**

    - npm global bin klasörünüz PATH'te değil.
    - Yolu kontrol edin:

      ```powershell
      npm config get prefix
      ```

    - Bu dizini kullanıcı PATH'inize ekleyin (Windows'ta `\bin` soneki gerekmez; çoğu sistemde `%AppData%\npm`'dir).
    - PATH'i güncelledikten sonra PowerShell'i kapatıp yeniden açın.

    Masaüstü kurulumu için yerel **Windows Hub** uygulamasını kullanın. Yalnızca terminal
    kurulumu için PowerShell yükleyicisi ve WSL2 Gateway yollarının ikisi de desteklenir.
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

    Ardından Gateway'i yeniden başlatın ve komutunuzu tekrar deneyin:

    ```powershell
    openclaw gateway restart
    ```

    Bunu en son OpenClaw'da hâlâ yeniden üretebiliyorsanız şurada izleyin/bildirin:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Belgeler sorumu yanıtlamadı - nasıl daha iyi bir yanıt alırım?">
    Tam kaynak ve belgeler yerelde olsun diye **değiştirilebilir (git) kurulumu** kullanın, ardından botunuza
    (veya Claude/Codex'e) _o klasörden_ sorun; böylece repoyu okuyup kesin yanıt verebilir.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Daha fazla ayrıntı: [Kurulum](/tr/install) ve [Yükleyici bayrakları](/tr/install/installer).

  </Accordion>

  <Accordion title="OpenClaw'ı Linux'a nasıl kurarım?">
    Kısa yanıt: Linux rehberini izleyin, ardından başlangıç yapılandırmasını çalıştırın.

    - Linux hızlı yolu + hizmet kurulumu: [Linux](/tr/platforms/linux).
    - Tam adım adım rehber: [Başlarken](/tr/start/getting-started).
    - Yükleyici + güncellemeler: [Kurulum ve güncellemeler](/tr/install/updating).

  </Accordion>

  <Accordion title="OpenClaw'ı bir VPS'ye nasıl kurarım?">
    Herhangi bir Linux VPS çalışır. Sunucuya kurun, ardından Gateway'e erişmek için SSH/Tailscale kullanın.

    Rehberler: [exe.dev](/tr/install/exe-dev), [Hetzner](/tr/install/hetzner), [Fly.io](/tr/install/fly).
    Uzaktan erişim: [Gateway uzaktan](/tr/gateway/remote).

  </Accordion>

  <Accordion title="Bulut/VPS kurulum rehberleri nerede?">
    Yaygın sağlayıcılarla bir **barındırma merkezi** tutuyoruz. Birini seçin ve rehberi izleyin:

    - [VPS barındırma](/tr/vps) (tüm sağlayıcılar tek yerde)
    - [Fly.io](/tr/install/fly)
    - [Hetzner](/tr/install/hetzner)
    - [exe.dev](/tr/install/exe-dev)

    Bulutta çalışma şekli: **Gateway sunucuda çalışır** ve ona
    dizüstü bilgisayarınızdan/telefonunuzdan Control UI üzerinden (veya Tailscale/SSH ile) erişirsiniz. Durumunuz + çalışma alanınız
    sunucuda yaşar; bu yüzden ana makineyi doğruluk kaynağı olarak görün ve yedekleyin.

    Yerel ekran/kamera/canvas'a erişmek veya komutları dizüstü bilgisayarınızda çalıştırmak için
    **nodes**'u (Mac/iOS/Android/headless) bu bulut Gateway'iyle eşleştirebilirsiniz; Gateway
    bulutta kalır.

    Merkez: [Platformlar](/tr/platforms). Uzaktan erişim: [Gateway uzaktan](/tr/gateway/remote).
    Nodes: [Nodes](/tr/nodes), [Nodes CLI](/tr/cli/nodes).

  </Accordion>

  <Accordion title="OpenClaw'dan kendini güncellemesini isteyebilir miyim?">
    Kısa yanıt: **mümkün, önerilmez**. Güncelleme akışı
    Gateway'i yeniden başlatabilir (bu da etkin oturumu düşürür), temiz bir git checkout gerektirebilir ve
    onay isteyebilir. Daha güvenlisi: güncellemeleri operatör olarak bir kabuktan çalıştırın.

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

    Belgeler: [Güncelleme](/tr/cli/update), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="Başlangıç yapılandırması aslında ne yapar?">
    `openclaw onboard`, önerilen kurulum yoludur. **Yerel modda** size şu adımlarda rehberlik eder:

    - **Model/auth kurulumu** (sağlayıcı OAuth, API anahtarları, Anthropic setup-token, ayrıca LM Studio gibi yerel model seçenekleri)
    - **Çalışma alanı** konumu + başlangıç dosyaları
    - **Gateway ayarları** (bind/port/auth/tailscale)
    - **Kanallar** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, ayrıca QQ Bot gibi paketli kanal plugin'leri)
    - **Daemon kurulumu** (macOS'ta LaunchAgent; Linux/WSL2'de systemd kullanıcı birimi)
    - **Sağlık kontrolleri** ve **skills** seçimi

    Yapılandırılmış modeliniz bilinmiyorsa veya auth eksikse ayrıca uyarır.

  </Accordion>

  <Accordion title="Bunu çalıştırmak için Claude veya OpenAI aboneliğine ihtiyacım var mı?">
    Hayır. OpenClaw'ı **API anahtarlarıyla** (Anthropic/OpenAI/diğerleri) veya
    verileriniz cihazınızda kalsın diye **yalnızca yerel modellerle** çalıştırabilirsiniz. Abonelikler (Claude
    Pro/Max veya OpenAI Codex), bu sağlayıcılarda kimlik doğrulaması için isteğe bağlı yollardır.

    OpenClaw'da Anthropic için pratik ayrım şudur:

    - **Anthropic API anahtarı**: normal Anthropic API faturalandırması
    - **OpenClaw'da Claude CLI / Claude abonelik auth'u**: Anthropic personeli
      bize bu kullanımın yeniden izinli olduğunu söyledi ve OpenClaw, `claude -p`
      kullanımını Anthropic yeni bir politika yayımlamadığı sürece bu entegrasyon için onaylı
      olarak değerlendiriyor

    Uzun ömürlü gateway ana makineleri için Anthropic API anahtarları hâlâ daha
    öngörülebilir kurulumdur. OpenAI Codex OAuth, OpenClaw gibi harici
    araçlar için açıkça desteklenir.

    OpenClaw ayrıca **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** ve
    **Z.AI / GLM Coding Plan** dahil olmak üzere başka barındırılan abonelik tarzı seçenekleri de destekler.

    Belgeler: [Anthropic](/tr/providers/anthropic), [OpenAI](/tr/providers/openai),
    [Qwen Cloud](/tr/providers/qwen),
    [MiniMax](/tr/providers/minimax), [Z.AI (GLM)](/tr/providers/zai),
    [Yerel modeller](/tr/gateway/local-models), [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="API anahtarı olmadan Claude Max aboneliğini kullanabilir miyim?">
    Evet.

    Anthropic personeli bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi; bu nedenle
    OpenClaw, Anthropic yeni bir politika yayımlamadığı sürece Claude abonelik auth'unu ve `claude -p` kullanımını
    bu entegrasyon için onaylı olarak ele alır. En öngörülebilir sunucu tarafı
    kurulumu istiyorsanız bunun yerine Anthropic API anahtarı kullanın.

  </Accordion>

  <Accordion title="Claude abonelik auth'unu (Claude Pro veya Max) destekliyor musunuz?">
    Evet.

    Anthropic personeli bize bu kullanımın yeniden izinli olduğunu söyledi; bu nedenle OpenClaw,
    Anthropic yeni bir politika yayımlamadığı sürece Claude CLI yeniden kullanımını ve `claude -p` kullanımını
    bu entegrasyon için onaylı olarak ele alır.

    Anthropic setup-token, desteklenen bir OpenClaw belirteç yolu olarak hâlâ kullanılabilir, ancak OpenClaw artık mevcut olduğunda Claude CLI yeniden kullanımını ve `claude -p`'yi tercih eder.
    Üretim veya çok kullanıcılı iş yükleri için Anthropic API anahtarı auth'u hâlâ
    daha güvenli, daha öngörülebilir seçimdir. OpenClaw'da başka abonelik tarzı barındırılan
    seçenekler istiyorsanız [OpenAI](/tr/providers/openai), [Qwen / Model
    Cloud](/tr/providers/qwen), [MiniMax](/tr/providers/minimax) ve [GLM
    Modelleri](/tr/providers/zai) bölümlerine bakın.

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Anthropic'ten neden HTTP 429 rate_limit_error görüyorum?">
    Bu, geçerli pencere için **Anthropic kota/hız sınırınızın** tükendiği anlamına gelir. **Claude CLI** kullanıyorsanız pencerenin sıfırlanmasını bekleyin veya planınızı yükseltin. **Anthropic API anahtarı** kullanıyorsanız kullanım/faturalandırma için Anthropic Console'u kontrol edin ve gerektiğinde limitleri yükseltin.

    Mesaj özellikle şuysa:
    `Extra usage is required for long context requests`, istek
    Anthropic'in 1M bağlam penceresini (GA kullanılabilir 1M Claude 4.x modeli veya eski
    `context1m: true` yapılandırması) kullanmaya çalışıyor demektir. Bu yalnızca kimlik bilgileriniz
    uzun bağlam faturalandırmasına uygunsa çalışır (API anahtarı faturalandırması veya Ek Kullanım
    etkinleştirilmiş OpenClaw Claude oturum açma yolu).

    İpucu: Bir sağlayıcı hız sınırına takıldığında OpenClaw'ın yanıt vermeye devam edebilmesi için bir **yedek model** ayarlayın.
    Bkz. [Modeller](/tr/cli/models), [OAuth](/tr/concepts/oauth) ve
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/tr/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock destekleniyor mu?">
    Evet. OpenClaw, paketlenmiş bir **Amazon Bedrock (Converse)** sağlayıcısına sahiptir. AWS env işaretleri mevcut olduğunda OpenClaw, akış/metin Bedrock kataloğunu otomatik keşfedebilir ve örtük bir `amazon-bedrock` sağlayıcısı olarak birleştirebilir; aksi halde `plugins.entries.amazon-bedrock.config.discovery.enabled` ayarını açıkça etkinleştirebilir veya manuel bir sağlayıcı girdisi ekleyebilirsiniz. Bkz. [Amazon Bedrock](/tr/providers/bedrock) ve [Model sağlayıcıları](/tr/providers/models). Yönetilen bir anahtar akışını tercih ediyorsanız, Bedrock önünde OpenAI uyumlu bir proxy hâlâ geçerli bir seçenektir.
  </Accordion>

  <Accordion title="Codex kimlik doğrulaması nasıl çalışır?">
    OpenClaw, OAuth (ChatGPT oturum açma) üzerinden **OpenAI Code (Codex)** desteği sağlar. Yaygın kurulum için
    `openai/gpt-5.5` kullanın: ChatGPT/Codex abonelik kimlik doğrulaması ve
    yerel Codex uygulama sunucusu yürütmesi. Eski Codex GPT referansları,
    `openclaw doctor --fix` tarafından onarılan eski yapılandırmadır. Doğrudan OpenAI API anahtarı
    erişimi, ajan dışı OpenAI API yüzeyleri ve sıralı bir `openai` API anahtarı profili üzerinden ajan
    modelleri için kullanılabilir olmaya devam eder.
    Bkz. [Model sağlayıcıları](/tr/concepts/model-providers) ve [İlk kurulum (CLI)](/tr/start/wizard).
  </Accordion>

  <Accordion title="OpenClaw neden hâlâ eski OpenAI Codex önekinden bahsediyor?">
    `openai`, hem OpenAI API anahtarları hem de
    ChatGPT/Codex OAuth için sağlayıcı ve kimlik doğrulama profili kimliğidir. Eski yapılandırmada ve
    geçiş uyarılarında hâlâ eski OpenAI Codex önekini görebilirsiniz.
    Daha eski yapılandırmalar bunu model öneki olarak da kullanıyordu:

    - `openai/gpt-5.5` = ajan dönüşleri için yerel Codex runtime ile ChatGPT/Codex abonelik kimlik doğrulaması
    - eski Codex GPT-5.5 referansı = `openclaw doctor --fix` tarafından onarılan eski model rotası
    - `openai/gpt-5.5` artı sıralı bir `openai` API anahtarı profili = bir OpenAI ajan modeli için API anahtarı kimlik doğrulaması
    - eski Codex kimlik doğrulama profili kimlikleri = `openclaw doctor --fix` tarafından taşınan eski kimlik doğrulama profili kimliği

    Doğrudan OpenAI Platform faturalandırma/sınır yolunu istiyorsanız,
    `OPENAI_API_KEY` ayarlayın. ChatGPT/Codex abonelik kimlik doğrulaması istiyorsanız,
    `openclaw models auth login --provider openai` ile oturum açın. Model referansını
    `openai/gpt-5.5` olarak tutun; eski Codex model referansları,
    `openclaw doctor --fix` tarafından yeniden yazılan eski yapılandırmadır.

  </Accordion>

  <Accordion title="Codex OAuth sınırları neden ChatGPT web'den farklı olabilir?">
    Codex OAuth, OpenAI tarafından yönetilen, plana bağlı kota pencerelerini kullanır. Pratikte
    bu sınırlar, ikisi de aynı hesaba bağlı olsa bile ChatGPT web sitesi/uygulama deneyiminden
    farklı olabilir.

    OpenClaw, şu anda görünen sağlayıcı kullanım/kota pencerelerini
    `openclaw models status` içinde gösterebilir, ancak ChatGPT web
    yetkilerini doğrudan API erişimine uydurmaz veya normalleştirmez. Doğrudan OpenAI Platform
    faturalandırma/sınır yolunu istiyorsanız, API anahtarıyla `openai/*` kullanın.

  </Accordion>

  <Accordion title="OpenAI abonelik kimlik doğrulamasını (Codex OAuth) destekliyor musunuz?">
    Evet. OpenClaw, **OpenAI Code (Codex) abonelik OAuth** desteğini tam olarak sağlar.
    OpenAI, OpenClaw gibi harici araçlarda/iş akışlarında abonelik OAuth kullanımına açıkça izin verir.
    İlk kurulum OAuth akışını sizin için çalıştırabilir.

    Bkz. [OAuth](/tr/concepts/oauth), [Model sağlayıcıları](/tr/concepts/model-providers) ve [İlk kurulum (CLI)](/tr/start/wizard).

  </Accordion>

  <Accordion title="Gemini CLI OAuth'u nasıl kurarım?">
    Gemini CLI, `openclaw.json` içinde bir istemci kimliği veya gizli anahtar değil, bir **Plugin kimlik doğrulama akışı** kullanır.

    Adımlar:

    1. Gemini CLI'ı yerel olarak kurun, böylece `gemini` `PATH` üzerinde olur
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin'i etkinleştirin: `openclaw plugins enable google`
    3. Oturum açın: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Oturum açtıktan sonra varsayılan model: `google-gemini-cli/gemini-3-flash-preview`
    5. İstekler başarısız olursa gateway ana makinesinde `GOOGLE_CLOUD_PROJECT` veya `GOOGLE_CLOUD_PROJECT_ID` ayarlayın

    Bu, OAuth belirteçlerini gateway ana makinesindeki kimlik doğrulama profillerinde saklar. Ayrıntılar: [Model sağlayıcıları](/tr/concepts/model-providers).

  </Accordion>

  <Accordion title="Gündelik sohbetler için yerel model uygun mu?">
    Genellikle hayır. OpenClaw büyük bağlam + güçlü güvenlik gerektirir; küçük kartlar keser ve sızdırır. Kullanmak zorundaysanız, yerelde çalıştırabildiğiniz **en büyük** model derlemesini (LM Studio) çalıştırın ve [/gateway/local-models](/tr/gateway/local-models) sayfasına bakın. Daha küçük/nicelenmiş modeller prompt enjeksiyonu riskini artırır - bkz. [Güvenlik](/tr/gateway/security).
  </Accordion>

  <Accordion title="Barındırılan model trafiğini belirli bir bölgede nasıl tutarım?">
    Bölgeye sabitlenmiş uç noktalar seçin. OpenRouter, MiniMax, Kimi ve GLM için ABD'de barındırılan seçenekler sunar; veriyi bölgede tutmak için ABD'de barındırılan varyantı seçin. Yine de `models.mode: "merge"` kullanarak Anthropic/OpenAI'ı bunların yanında listeleyebilirsiniz; böylece seçtiğiniz bölgesel sağlayıcıya saygı gösterilirken yedekler kullanılabilir kalır.
  </Accordion>

  <Accordion title="Bunu kurmak için Mac Mini satın almam gerekiyor mu?">
    Hayır. OpenClaw macOS veya Linux üzerinde çalışır (Windows, WSL2 üzerinden). Mac mini isteğe bağlıdır - bazı kişiler
    sürekli açık ana makine olarak bir tane satın alır, ancak küçük bir VPS, ev sunucusu veya Raspberry Pi sınıfı kutu da çalışır.

    Yalnızca **macOS'a özel araçlar** için Mac gerekir. iMessage için, Mesajlar'da oturum açmış herhangi bir Mac üzerinde `imsg` ile [iMessage](/tr/channels/imessage) kullanın. Gateway Linux'ta veya başka bir yerde çalışıyorsa, `channels.imessage.cliPath` değerini o Mac üzerinde `imsg` çalıştıran bir SSH sarmalayıcısına ayarlayın. Başka macOS'a özel araçlar istiyorsanız, Gateway'i bir Mac üzerinde çalıştırın veya bir macOS düğümü eşleyin.

    Belgeler: [iMessage](/tr/channels/imessage), [Düğümler](/tr/nodes), [Mac uzak modu](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="iMessage desteği için Mac mini gerekir mi?">
    Mesajlar'da oturum açmış **bir macOS aygıtına** ihtiyacınız var. Bunun Mac mini olması **gerekmez** -
    herhangi bir Mac çalışır. `imsg` ile **[iMessage](/tr/channels/imessage) kullanın**; Gateway o Mac üzerinde çalışabilir veya bir SSH sarmalayıcı `cliPath` ile başka yerde çalışabilir.

    Yaygın kurulumlar:

    - Gateway'i Linux/VPS üzerinde çalıştırın ve `channels.imessage.cliPath` değerini Mesajlar'da oturum açmış bir Mac üzerinde `imsg` çalıştıran bir SSH sarmalayıcısına ayarlayın.
    - En basit tek makine kurulumunu istiyorsanız her şeyi Mac üzerinde çalıştırın.

    Belgeler: [iMessage](/tr/channels/imessage), [Düğümler](/tr/nodes),
    [Mac uzak modu](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="OpenClaw çalıştırmak için Mac mini satın alırsam, onu MacBook Pro'ma bağlayabilir miyim?">
    Evet. **Mac mini Gateway'i çalıştırabilir** ve MacBook Pro'nuz
    **düğüm** (eşlik eden aygıt) olarak bağlanabilir. Düğümler Gateway'i çalıştırmaz - ekran/kamera/tuval ve o aygıtta `system.run` gibi ek
    yetenekler sağlar.

    Yaygın desen:

    - Gateway Mac mini üzerinde (sürekli açık).
    - MacBook Pro macOS uygulamasını veya bir düğüm ana makinesini çalıştırır ve Gateway ile eşleşir.
    - Görmek için `openclaw nodes status` / `openclaw nodes list` kullanın.

    Belgeler: [Düğümler](/tr/nodes), [Düğümler CLI](/tr/cli/nodes).

  </Accordion>

  <Accordion title="Bun kullanabilir miyim?">
    Bun **önerilmez**. Özellikle WhatsApp ve Telegram ile runtime hataları görüyoruz.
    Kararlı gateway'ler için **Node** kullanın.

    Yine de Bun ile deneme yapmak istiyorsanız, bunu WhatsApp/Telegram olmayan üretim dışı bir gateway üzerinde yapın.

  </Accordion>

  <Accordion title="Telegram: allowFrom içine ne yazılır?">
    `channels.telegram.allowFrom`, **insan gönderenin Telegram kullanıcı kimliğidir** (sayısal). Bot kullanıcı adı değildir.

    Kurulum yalnızca sayısal kullanıcı kimliklerini ister. Yapılandırmada zaten eski `@username` girdileri varsa, `openclaw doctor --fix` bunları çözümlemeyi deneyebilir.

    Daha güvenli (üçüncü taraf bot yok):

    - Botunuza DM gönderin, ardından `openclaw logs --follow` çalıştırın ve `from.id` değerini okuyun.

    Resmi Bot API:

    - Botunuza DM gönderin, ardından `https://api.telegram.org/bot<bot_token>/getUpdates` çağırın ve `message.from.id` değerini okuyun.

    Üçüncü taraf (daha az özel):

    - `@userinfobot` veya `@getidsbot` hesabına DM gönderin.

    Bkz. [/channels/telegram](/tr/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Birden fazla kişi farklı OpenClaw örnekleriyle tek bir WhatsApp numarasını kullanabilir mi?">
    Evet, **çoklu ajan yönlendirme** üzerinden. Her gönderenin WhatsApp **DM**'ini (peer `kind: "direct"`, `+15551234567` gibi E.164 gönderen) farklı bir `agentId` değerine bağlayın; böylece her kişi kendi çalışma alanını ve oturum deposunu alır. Yanıtlar yine **aynı WhatsApp hesabından** gelir ve DM erişim denetimi (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) WhatsApp hesabı başına geneldir. Bkz. [Çoklu Ajan Yönlendirme](/tr/concepts/multi-agent) ve [WhatsApp](/tr/channels/whatsapp).
  </Accordion>

  <Accordion title='Bir "hızlı sohbet" ajanı ve bir "kodlama için Opus" ajanı çalıştırabilir miyim?'>
    Evet. Çoklu ajan yönlendirmeyi kullanın: Her ajana kendi varsayılan modelini verin, ardından gelen rotaları (sağlayıcı hesabı veya belirli eşler) her ajana bağlayın. Örnek yapılandırma [Çoklu Ajan Yönlendirme](/tr/concepts/multi-agent) içinde bulunur. Ayrıca bkz. [Modeller](/tr/concepts/models) ve [Yapılandırma](/tr/gateway/configuration).
  </Accordion>

  <Accordion title="Homebrew Linux üzerinde çalışır mı?">
    Evet. Homebrew Linux'u destekler (Linuxbrew). Hızlı kurulum:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    OpenClaw'ı systemd üzerinden çalıştırıyorsanız, hizmet PATH değerinin `/home/linuxbrew/.linuxbrew/bin` (veya brew önekinizi) içerdiğinden emin olun; böylece `brew` ile kurulan araçlar giriş yapılmayan kabuklarda çözümlenir.
    Son derlemeler ayrıca Linux systemd hizmetlerinde yaygın kullanıcı bin dizinlerini başa ekler (örneğin `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) ve ayarlandıklarında `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` ve `FNM_DIR` değerlerini dikkate alır.

  </Accordion>

  <Accordion title="Hacklenebilir git kurulumu ile npm kurulumu arasındaki fark">
    - **Hacklenebilir (git) kurulum:** tam kaynak checkout, düzenlenebilir, katkıda bulunanlar için en iyisi.
      Derlemeleri yerelde çalıştırırsınız ve kod/belge yamalayabilirsiniz.
    - **npm kurulumu:** global CLI kurulumu, repo yok, "sadece çalıştırmak" için en iyisi.
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

    git'ten npm'e:

    ```bash
    openclaw update --channel stable
    ```

    Önce planlanan mod geçişini önizlemek için `--dry-run` ekleyin. Güncelleyici,
    Doctor takip işlemlerini çalıştırır, hedef kanal için plugin kaynaklarını yeniler ve
    `--no-restart` iletmediğiniz sürece gateway'i yeniden başlatır.

    Kurucu da iki modu zorlayabilir:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Yedekleme ipuçları: bkz. [Yedekleme stratejisi](/tr/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Gateway'i dizüstü bilgisayarımda mı yoksa bir VPS'te mi çalıştırmalıyım?">
    Kısa cevap: **7/24 güvenilirlik istiyorsanız bir VPS kullanın**. En düşük
    sürtünmeyi istiyorsanız ve uyku/yeniden başlatma sorunlarını kabul ediyorsanız, yerel olarak çalıştırın.

    **Dizüstü bilgisayar (yerel Gateway)**

    - **Artıları:** sunucu maliyeti yok, yerel dosyalara doğrudan erişim, canlı tarayıcı penceresi.
    - **Eksileri:** uyku/ağ kesintileri = bağlantı kopmaları, işletim sistemi güncellemeleri/yeniden başlatmalar kesintiye uğratır, uyanık kalması gerekir.

    **VPS / bulut**

    - **Artıları:** her zaman açık, kararlı ağ, dizüstü bilgisayar uyku sorunu yok, çalışır halde tutması daha kolay.
    - **Eksileri:** genellikle başsız çalışır (ekran görüntüleri kullanın), yalnızca uzak dosya erişimi, güncellemeler için SSH kullanmanız gerekir.

    **OpenClaw'a özel not:** WhatsApp/Telegram/Slack/Mattermost/Discord hepsi bir VPS'ten sorunsuz çalışır. Tek gerçek ödünleşim **başsız tarayıcı** ile görünür pencere arasındadır. Bkz. [Tarayıcı](/tr/tools/browser).

    **Önerilen varsayılan:** Daha önce gateway bağlantı kopmaları yaşadıysanız VPS. Mac'i aktif olarak kullanıyorsanız ve yerel dosya erişimi veya görünür tarayıcıyla kullanıcı arayüzü otomasyonu istiyorsanız yerel kullanım harikadır.

  </Accordion>

  <Accordion title="OpenClaw'ı ayrılmış bir makinede çalıştırmak ne kadar önemli?">
    Zorunlu değildir, ancak **güvenilirlik ve yalıtım için önerilir**.

    - **Ayrılmış ana makine (VPS/Mac mini/Raspberry Pi):** her zaman açık, daha az uyku/yeniden başlatma kesintisi, daha temiz izinler, çalışır halde tutması daha kolay.
    - **Paylaşılan dizüstü/masaüstü:** test ve aktif kullanım için tamamen uygundur, ancak makine uyuduğunda veya güncellendiğinde duraklamalar bekleyin.

    Her iki dünyanın en iyisini istiyorsanız, Gateway'i ayrılmış bir ana makinede tutun ve yerel ekran/kamera/exec araçları için dizüstü bilgisayarınızı bir **düğüm** olarak eşleştirin. Bkz. [Düğümler](/tr/nodes).
    Güvenlik rehberliği için [Güvenlik](/tr/gateway/security) bölümünü okuyun.

  </Accordion>

  <Accordion title="Minimum VPS gereksinimleri ve önerilen işletim sistemi nelerdir?">
    OpenClaw hafiftir. Temel bir Gateway + bir sohbet kanalı için:

    - **Mutlak minimum:** 1 vCPU, 1GB RAM, ~500MB disk.
    - **Önerilen:** ek kapasite için 1-2 vCPU, 2GB RAM veya daha fazlası (günlükler, medya, birden çok kanal). Node araçları ve tarayıcı otomasyonu kaynak tüketebilir.

    İşletim sistemi: **Ubuntu LTS** (veya herhangi bir modern Debian/Ubuntu) kullanın. Linux kurulum yolu en iyi burada test edilmiştir.

    Belgeler: [Linux](/tr/platforms/linux), [VPS barındırma](/tr/vps).

  </Accordion>

  <Accordion title="OpenClaw'ı bir VM içinde çalıştırabilir miyim ve gereksinimleri nelerdir?">
    Evet. Bir VM'yi VPS ile aynı şekilde değerlendirin: her zaman açık, erişilebilir olması ve Gateway ile etkinleştirdiğiniz kanallar için yeterli
    RAM'e sahip olması gerekir.

    Temel rehberlik:

    - **Mutlak minimum:** 1 vCPU, 1GB RAM.
    - **Önerilen:** birden çok kanal, tarayıcı otomasyonu veya medya araçları çalıştırıyorsanız 2GB RAM veya daha fazlası.
    - **İşletim sistemi:** Ubuntu LTS veya başka bir modern Debian/Ubuntu.

    Windows kullanıyorsanız masaüstü kurulumu için **Windows Hub** kullanın veya özellikle geniş araç
    uyumluluğuna sahip Linux tarzı bir Gateway VM istediğinizde WSL2 kullanın. Bkz. [Windows](/tr/platforms/windows), [VPS barındırma](/tr/vps).
    macOS'i bir VM içinde çalıştırıyorsanız, bkz. [macOS VM](/tr/install/macos-vm).

  </Accordion>
</AccordionGroup>

## İlgili

- [SSS](/tr/help/faq) — ana SSS (modeller, oturumlar, gateway, güvenlik, daha fazlası)
- [Kurulum özeti](/tr/install)
- [Başlarken](/tr/start/getting-started)
- [Sorun giderme](/tr/help/troubleshooting)

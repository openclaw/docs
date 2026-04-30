---
read_when:
    - Yeni kurulum, takılı kalan ilk kullanım akışı veya ilk çalıştırma hataları
    - Kimlik doğrulamayı ve sağlayıcı aboneliklerini seçme
    - docs.openclaw.ai'ye erişilemiyor, kontrol paneli açılamıyor, kurulum takıldı
sidebarTitle: First-run FAQ
summary: 'SSS: hızlı başlangıç ve ilk çalıştırma kurulumu — yükleme, ilk kullanım, kimlik doğrulama, abonelikler, ilk hatalar'
title: 'SSS: ilk çalıştırma kurulumu'
x-i18n:
    generated_at: "2026-04-30T09:26:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 959e5c8a94cce6369af84d3d1e252dbfb22acb5891ac1d8b64722c4c40679e65
    source_path: help/faq-first-run.md
    workflow: 16
---

  Hızlı başlangıç ve ilk çalıştırma SSS. Günlük işlemler, modeller, kimlik doğrulama, oturumlar
  ve sorun giderme için ana [SSS](/tr/help/faq) sayfasına bakın.

  ## Hızlı başlangıç ve ilk çalıştırma kurulumu

  <AccordionGroup>
  <Accordion title="Takıldım, takılmayı aşmanın en hızlı yolu">
    **Makinenizi görebilen** yerel bir AI ajanı kullanın. Bu, Discord'da sormaktan çok daha etkilidir,
    çünkü çoğu "takıldım" durumu, uzaktaki yardımcıların inceleyemeyeceği **yerel yapılandırma veya ortam sorunlarıdır**.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Bu araçlar depoyu okuyabilir, komut çalıştırabilir, günlükleri inceleyebilir ve makine düzeyindeki
    kurulumunuzu (PATH, hizmetler, izinler, kimlik doğrulama dosyaları) düzeltmeye yardımcı olabilir. Onlara
    hacklenebilir (git) kurulum üzerinden **tam kaynak checkout'unu** verin:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Bu, OpenClaw'ı **bir git checkout'undan** kurar; böylece ajan kodu ve belgeleri okuyabilir ve
    çalıştırdığınız tam sürüm hakkında akıl yürütebilir. Daha sonra kurucuyu `--install-method git`
    olmadan yeniden çalıştırarak her zaman kararlı sürüme geri dönebilirsiniz.

    İpucu: ajandan düzeltmeyi **planlamasını ve denetlemesini** (adım adım) isteyin, sonra yalnızca
    gerekli komutları çalıştırın. Bu, değişiklikleri küçük ve denetlemesi daha kolay tutar.

    Gerçek bir hata veya düzeltme keşfederseniz lütfen GitHub issue açın ya da PR gönderin:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Şu komutlarla başlayın (yardım isterken çıktıları paylaşın):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Ne yaparlar:

    - `openclaw status`: Gateway/ajan sağlığı ve temel yapılandırmanın hızlı anlık görüntüsü.
    - `openclaw models status`: sağlayıcı kimlik doğrulamasını ve model kullanılabilirliğini denetler.
    - `openclaw doctor`: yaygın yapılandırma/durum sorunlarını doğrular ve onarır.

    Diğer yararlı CLI denetimleri: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Hızlı hata ayıklama döngüsü: [Bir şey bozuksa ilk 60 saniye](#first-60-seconds-if-something-is-broken).
    Kurulum belgeleri: [Kurulum](/tr/install), [Kurucu bayrakları](/tr/install/installer), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="Heartbeat sürekli atlıyor. Atlama nedenleri ne anlama geliyor?">
    Yaygın heartbeat atlama nedenleri:

    - `quiet-hours`: yapılandırılmış etkin saatler aralığının dışında
    - `empty-heartbeat-file`: `HEARTBEAT.md` var ama yalnızca boş/yalnızca başlık içeren iskelet barındırıyor
    - `no-tasks-due`: `HEARTBEAT.md` görev modu etkin ama görev aralıklarının hiçbiri henüz gelmemiş
    - `alerts-disabled`: tüm heartbeat görünürlüğü devre dışı (`showOk`, `showAlerts` ve `useIndicator` kapalı)

    Görev modunda, vade zaman damgaları yalnızca gerçek bir heartbeat çalıştırması
    tamamlandıktan sonra ilerletilir. Atlanan çalıştırmalar görevleri tamamlandı olarak işaretlemez.

    Belgeler: [Heartbeat](/tr/gateway/heartbeat), [Otomasyon ve Görevler](/tr/automation).

  </Accordion>

  <Accordion title="OpenClaw'ı kurmak ve ayarlamak için önerilen yol">
    Depo, kaynaktan çalıştırmayı ve onboarding kullanmayı önerir:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Sihirbaz UI varlıklarını da otomatik olarak oluşturabilir. Onboarding'den sonra Gateway'i genellikle **18789** portunda çalıştırırsınız.

    Kaynaktan (katkıda bulunanlar/geliştirme):

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

  <Accordion title="Onboarding'den sonra panoyu nasıl açarım?">
    Sihirbaz, onboarding'in hemen ardından tarayıcınızı temiz (tokenize edilmemiş) bir pano URL'siyle açar ve bağlantıyı özette de yazdırır. Bu sekmeyi açık tutun; açılmadıysa yazdırılan URL'yi aynı makinede kopyalayıp yapıştırın.
  </Accordion>

  <Accordion title="Panoda localhost ile uzaktan nasıl kimlik doğrularım?">
    **Localhost (aynı makine):**

    - `http://127.0.0.1:18789/` adresini açın.
    - Paylaşılan gizli anahtar kimlik doğrulaması isterse yapılandırılmış token'ı veya parolayı Control UI ayarlarına yapıştırın.
    - Token kaynağı: `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`).
    - Parola kaynağı: `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`).
    - Henüz paylaşılan gizli anahtar yapılandırılmadıysa `openclaw doctor --generate-gateway-token` ile bir token oluşturun.

    **Localhost dışında:**

    - **Tailscale Serve** (önerilir): bind'i loopback'te tutun, `openclaw gateway --tailscale serve` çalıştırın, `https://<magicdns>/` adresini açın. `gateway.auth.allowTailscale` `true` ise kimlik başlıkları Control UI/WebSocket kimlik doğrulamasını karşılar (yapıştırılmış paylaşılan gizli anahtar yoktur, güvenilir Gateway ana makinesi varsayılır); HTTP API'leri, özel-ingress `none` veya trusted-proxy HTTP kimlik doğrulamasını bilinçli olarak kullanmadığınız sürece hâlâ paylaşılan gizli anahtar kimlik doğrulaması gerektirir.
      Aynı istemciden gelen hatalı eşzamanlı Serve kimlik doğrulama girişimleri, başarısız-kimlik doğrulama sınırlayıcısı bunları kaydetmeden önce serileştirilir; bu yüzden ikinci hatalı yeniden deneme zaten `retry later` gösterebilir.
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` çalıştırın (veya parola kimlik doğrulamasını yapılandırın), `http://<tailscale-ip>:18789/` adresini açın, sonra eşleşen paylaşılan gizli anahtarı pano ayarlarına yapıştırın.
    - **Kimlik farkındalıklı ters proxy**: Gateway'i güvenilir bir proxy arkasında tutun, `gateway.auth.mode: "trusted-proxy"` yapılandırın, sonra proxy URL'sini açın. Aynı ana makinedeki loopback proxy'leri açıkça `gateway.auth.trustedProxy.allowLoopback = true` gerektirir.
    - **SSH tüneli**: `ssh -N -L 18789:127.0.0.1:18789 user@host` ardından `http://127.0.0.1:18789/` adresini açın. Paylaşılan gizli anahtar kimlik doğrulaması tünel üzerinden de geçerlidir; istenirse yapılandırılmış token'ı veya parolayı yapıştırın.

    Bind modları ve kimlik doğrulama ayrıntıları için [Pano](/tr/web/dashboard) ve [Web yüzeyleri](/tr/web) bölümlerine bakın.

  </Accordion>

  <Accordion title="Sohbet onayları için neden iki exec onay yapılandırması var?">
    Farklı katmanları kontrol ederler:

    - `approvals.exec`: onay istemlerini sohbet hedeflerine iletir
    - `channels.<channel>.execApprovals`: o kanalın exec onayları için yerel bir onay istemcisi gibi davranmasını sağlar

    Ana makine exec ilkesi hâlâ gerçek onay kapısıdır. Sohbet yapılandırması yalnızca onay
    istemlerinin nerede görüneceğini ve insanların bunlara nasıl yanıt verebileceğini kontrol eder.

    Çoğu kurulumda ikisine de **ihtiyacınız yoktur**:

    - Sohbet zaten komutları ve yanıtları destekliyorsa aynı sohbet `/approve` paylaşılan yol üzerinden çalışır.
    - Desteklenen yerel bir kanal onaylayıcıları güvenli biçimde çıkarabiliyorsa, `channels.<channel>.execApprovals.enabled` ayarlanmamış veya `"auto"` olduğunda OpenClaw artık DM-öncelikli yerel onayları otomatik etkinleştirir.
    - Yerel onay kartları/düğmeleri kullanılabiliyorsa birincil yol bu yerel UI'dır; ajan, yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya manuel onayın tek yol olduğunu söylüyorsa manuel `/approve` komutu eklemelidir.
    - `approvals.exec` yalnızca istemlerin başka sohbetlere veya açık operasyon odalarına da iletilmesi gerektiğinde kullanın.
    - `channels.<channel>.execApprovals.target: "channel"` veya `"both"` yalnızca onay istemlerinin açıkça kaynak odaya/konuya geri gönderilmesini istediğinizde kullanın.
    - Plugin onayları yine ayrıdır: varsayılan olarak aynı sohbet `/approve` kullanırlar, isteğe bağlı `approvals.plugin` iletimi vardır ve yalnızca bazı yerel kanallar bunun üstünde plugin-onay-yerel işlemeyi korur.

    Kısa sürüm: iletme yönlendirme içindir, yerel istemci yapılandırması ise daha zengin kanala özgü UX içindir.
    Bkz. [Exec Onayları](/tr/tools/exec-approvals).

  </Accordion>

  <Accordion title="Hangi runtime'a ihtiyacım var?">
    Node **>= 22** gereklidir. `pnpm` önerilir. Bun, Gateway için **önerilmez**.
  </Accordion>

  <Accordion title="Raspberry Pi üzerinde çalışır mı?">
    Evet. Gateway hafiftir; belgeler kişisel kullanım için **512MB-1GB RAM**, **1 çekirdek** ve yaklaşık **500MB**
    diskin yeterli olduğunu listeler ve **Raspberry Pi 4'ün bunu çalıştırabileceğini** belirtir.

    Ek pay (günlükler, medya, diğer hizmetler) istiyorsanız **2GB önerilir**, ancak
    katı bir minimum değildir.

    İpucu: küçük bir Pi/VPS Gateway'i barındırabilir ve dizüstü bilgisayarınızda/telefonunuzda yerel ekran/kamera/canvas veya komut yürütme için **düğümleri** eşleyebilirsiniz. Bkz. [Düğümler](/tr/nodes).

  </Accordion>

  <Accordion title="Raspberry Pi kurulumları için ipucu var mı?">
    Kısa sürüm: çalışır, ancak pürüzler bekleyin.

    - **64-bit** işletim sistemi kullanın ve Node >= 22 tutun.
    - Günlükleri görebilmek ve hızlı güncellemek için **hacklenebilir (git) kurulumu** tercih edin.
    - Kanallar/skills olmadan başlayın, sonra bunları tek tek ekleyin.
    - Tuhaf ikili dosya sorunlarıyla karşılaşırsanız bu genellikle bir **ARM uyumluluğu** sorunudur.

    Belgeler: [Linux](/tr/platforms/linux), [Kurulum](/tr/install).

  </Accordion>

  <Accordion title="Wake up my friend ekranında takıldı / onboarding çatlamıyor. Şimdi ne olacak?">
    Bu ekran Gateway'in erişilebilir ve kimliği doğrulanmış olmasına bağlıdır. TUI ayrıca ilk hatch sırasında
    "Wake up, my friend!" ifadesini otomatik gönderir. Bu satırı **yanıt olmadan** görürseniz
    ve token'lar 0'da kalırsa, ajan hiç çalışmamıştır.

    1. Gateway'i yeniden başlatın:

    ```bash
    openclaw gateway restart
    ```

    2. Durumu ve kimlik doğrulamayı denetleyin:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Hâlâ takılı kalıyorsa şunu çalıştırın:

    ```bash
    openclaw doctor
    ```

    Gateway uzaktaysa tünel/Tailscale bağlantısının açık olduğundan ve UI'ın doğru Gateway'e
    işaret ettiğinden emin olun. Bkz. [Uzaktan erişim](/tr/gateway/remote).

  </Accordion>

  <Accordion title="Onboarding'i yeniden yapmadan kurulumumu yeni bir makineye (Mac mini) taşıyabilir miyim?">
    Evet. **Durum dizinini** ve **çalışma alanını** kopyalayın, sonra Doctor'ı bir kez çalıştırın. Bu,
    **her iki** konumu da kopyaladığınız sürece botunuzu "tam olarak aynı" tutar (bellek, oturum geçmişi, kimlik doğrulama ve kanal durumu):

    1. Yeni makineye OpenClaw'ı kurun.
    2. Eski makineden `$OPENCLAW_STATE_DIR` (varsayılan: `~/.openclaw`) kopyalayın.
    3. Çalışma alanınızı kopyalayın (varsayılan: `~/.openclaw/workspace`).
    4. `openclaw doctor` çalıştırın ve Gateway hizmetini yeniden başlatın.

    Bu; yapılandırmayı, kimlik doğrulama profillerini, WhatsApp kimlik bilgilerini, oturumları ve belleği korur. Uzaktan
    moddaysanız oturum deposu ve çalışma alanının gateway ana makinesine ait olduğunu unutmayın.

    **Önemli:** yalnızca çalışma alanınızı GitHub'a commit/push ederseniz
    **bellek + bootstrap dosyalarını** yedeklemiş olursunuz, ancak oturum geçmişini veya kimlik doğrulamayı **yedeklemezsiniz**. Bunlar
    `~/.openclaw/` altında yaşar (örneğin `~/.openclaw/agents/<agentId>/sessions/`).

    İlgili: [Taşıma](/tr/install/migrating), [Diskte şeylerin nerede yaşadığı](#where-things-live-on-disk),
    [Ajan çalışma alanı](/tr/concepts/agent-workspace), [Doctor](/tr/gateway/doctor),
    [Uzaktan mod](/tr/gateway/remote).

  </Accordion>

  <Accordion title="En son sürümde nelerin yeni olduğunu nerede görürüm?">
    GitHub changelog'unu kontrol edin:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    En yeni girdiler en üsttedir. Üst bölüm **Unreleased** olarak işaretlenmişse bir sonraki tarihli
    bölüm yayımlanmış en son sürümdür. Girdiler **Highlights**, **Changes** ve
    **Fixes** altında gruplanır (gerektiğinde belgeler/diğer bölümler de eklenir).

  </Accordion>

  <Accordion title="docs.openclaw.ai adresine erişilemiyor (SSL hatası)">
    Bazı Comcast/Xfinity bağlantıları, Xfinity Advanced Security üzerinden `docs.openclaw.ai` adresini yanlışlıkla engeller.
    Bunu devre dışı bırakın veya `docs.openclaw.ai` adresini izin verilenler listesine ekleyin, sonra yeniden deneyin.
    Engeli kaldırmamıza yardımcı olmak için lütfen burada bildirin: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Siteye hâlâ ulaşamıyorsanız belgeler GitHub'da yansıtılmıştır:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Kararlı ve beta arasındaki fark">
    **Kararlı** ve **beta**, ayrı kod satırları değil, **npm dist-tag** değerleridir:

    - `latest` = kararlı
    - `beta` = test için erken derleme

    Genellikle kararlı bir sürüm önce **beta** olarak çıkar, ardından açık bir
    yükseltme adımı aynı sürümü `latest` konumuna taşır. Bakımcılar gerektiğinde
    doğrudan `latest` olarak da yayınlayabilir. Bu yüzden beta ve kararlı, yükseltmeden
    sonra **aynı sürümü** gösterebilir.

    Nelerin değiştiğine bakın:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Tek satırlık kurulum komutları ve beta ile dev arasındaki fark için aşağıdaki akordeona bakın.

  </Accordion>

  <Accordion title="Beta sürümü nasıl kurarım ve beta ile dev arasındaki fark nedir?">
    **Beta**, npm dist-tag değeri olan `beta`dir (yükseltmeden sonra `latest` ile eşleşebilir).
    **Dev**, `main` başının (git) hareketli halidir; yayınlandığında npm dist-tag değeri olarak `dev` kullanır.

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

    Temiz bir kopyayı elle almayı tercih ederseniz şunu kullanın:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Belgeler: [Güncelle](/tr/cli/update), [Geliştirme kanalları](/tr/install/development-channels),
    [Kurulum](/tr/install).

  </Accordion>

  <Accordion title="Kurulum ve ilk yapılandırma genellikle ne kadar sürer?">
    Kabaca kılavuz:

    - **Kurulum:** 2-5 dakika
    - **İlk yapılandırma:** yapılandırdığınız kanal/model sayısına bağlı olarak 5-15 dakika

    Takılı kalırsa [Yükleyici takıldı](#quick-start-and-first-run-setup)
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
    İki yaygın Windows sorunu:

    **1) npm hatası spawn git / git bulunamadı**

    - **Git for Windows** kurun ve `git` komutunun PATH üzerinde olduğundan emin olun.
    - PowerShell'i kapatıp yeniden açın, ardından yükleyiciyi yeniden çalıştırın.

    **2) kurulumdan sonra openclaw tanınmıyor**

    - npm global bin klasörünüz PATH üzerinde değil.
    - Yolu denetleyin:

      ```powershell
      npm config get prefix
      ```

    - Bu dizini kullanıcı PATH değerinize ekleyin (Windows'ta `\bin` sonekine gerek yoktur; çoğu sistemde bu `%AppData%\npm` olur).
    - PATH güncellendikten sonra PowerShell'i kapatıp yeniden açın.

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

    Bunu en son OpenClaw sürümünde hâlâ yeniden üretebiliyorsanız şurada izleyin/bildirin:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Belgeler sorumu yanıtlamadı - nasıl daha iyi bir yanıt alırım?">
    Tam kaynak ve belgeler yerelde olsun diye **değiştirilebilir (git) kurulumu** kullanın, ardından
    botunuza (veya Claude/Codex'e) repoyu okuyup kesin yanıt verebilmesi için _o klasörden_ sorun.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Daha fazla ayrıntı: [Kurulum](/tr/install) ve [Yükleyici bayrakları](/tr/install/installer).

  </Accordion>

  <Accordion title="OpenClaw'u Linux'a nasıl kurarım?">
    Kısa yanıt: Linux kılavuzunu izleyin, ardından ilk yapılandırmayı çalıştırın.

    - Linux hızlı yol + servis kurulumu: [Linux](/tr/platforms/linux).
    - Tam adım adım anlatım: [Başlarken](/tr/start/getting-started).
    - Yükleyici + güncellemeler: [Kurulum ve güncellemeler](/tr/install/updating).

  </Accordion>

  <Accordion title="OpenClaw'u bir VPS üzerine nasıl kurarım?">
    Herhangi bir Linux VPS çalışır. Sunucuya kurun, ardından Gateway'e erişmek için SSH/Tailscale kullanın.

    Kılavuzlar: [exe.dev](/tr/install/exe-dev), [Hetzner](/tr/install/hetzner), [Fly.io](/tr/install/fly).
    Uzak erişim: [Gateway uzak](/tr/gateway/remote).

  </Accordion>

  <Accordion title="Bulut/VPS kurulum kılavuzları nerede?">
    Yaygın sağlayıcıları içeren bir **barındırma merkezi** tutuyoruz. Birini seçip kılavuzu izleyin:

    - [VPS barındırma](/tr/vps) (tüm sağlayıcılar tek yerde)
    - [Fly.io](/tr/install/fly)
    - [Hetzner](/tr/install/hetzner)
    - [exe.dev](/tr/install/exe-dev)

    Bulutta çalışma biçimi: **Gateway sunucuda çalışır** ve ona dizüstü bilgisayarınızdan/telefonunuzdan
    Control UI (veya Tailscale/SSH) üzerinden erişirsiniz. Durumunuz + çalışma alanınız
    sunucuda yaşar; bu yüzden ana makineyi gerçek kaynak olarak kabul edin ve yedekleyin.

    Yerel ekran/kamera/canvas erişimi sağlamak veya Gateway'i bulutta tutarken
    dizüstü bilgisayarınızda komut çalıştırmak için **düğümleri** (Mac/iOS/Android/headless) o bulut Gateway ile eşleştirebilirsiniz.

    Merkez: [Platformlar](/tr/platforms). Uzak erişim: [Gateway uzak](/tr/gateway/remote).
    Düğümler: [Düğümler](/tr/nodes), [Düğümler CLI](/tr/cli/nodes).

  </Accordion>

  <Accordion title="OpenClaw'dan kendini güncellemesini isteyebilir miyim?">
    Kısa yanıt: **mümkün, önerilmez**. Güncelleme akışı Gateway'i yeniden başlatabilir
    (bu da etkin oturumu düşürür), temiz bir git checkout gerektirebilir ve
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

    Belgeler: [Güncelle](/tr/cli/update), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="İlk yapılandırma gerçekte ne yapar?">
    `openclaw onboard` önerilen kurulum yoludur. **yerel modda** size şunlarda adım adım rehberlik eder:

    - **Model/kimlik doğrulama kurulumu** (sağlayıcı OAuth, API anahtarları, Anthropic setup-token, ayrıca LM Studio gibi yerel model seçenekleri)
    - **Çalışma alanı** konumu + başlangıç dosyaları
    - **Gateway ayarları** (bind/port/auth/tailscale)
    - **Kanallar** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, ayrıca QQ Bot gibi paketle gelen kanal pluginleri)
    - **Daemon kurulumu** (macOS'ta LaunchAgent; Linux/WSL2'de systemd kullanıcı birimi)
    - **Sağlık denetimleri** ve **Skills** seçimi

    Ayrıca yapılandırılmış modeliniz bilinmiyorsa veya kimlik doğrulaması eksikse uyarır.

  </Accordion>

  <Accordion title="Bunu çalıştırmak için Claude veya OpenAI aboneliğine ihtiyacım var mı?">
    Hayır. OpenClaw'u **API anahtarları** (Anthropic/OpenAI/diğerleri) veya verilerinizin
    cihazınızda kalması için **yalnızca yerel modellerle** çalıştırabilirsiniz. Abonelikler (Claude
    Pro/Max veya OpenAI Codex), bu sağlayıcılarda kimlik doğrulamanın isteğe bağlı yollarıdır.

    OpenClaw'da Anthropic için pratik ayrım şudur:

    - **Anthropic API anahtarı**: normal Anthropic API faturalandırması
    - **OpenClaw'da Claude CLI / Claude abonelik kimlik doğrulaması**: Anthropic çalışanları
      bize bu kullanımın yeniden izinli olduğunu söyledi ve OpenClaw, Anthropic yeni bir
      ilke yayımlamadıkça `claude -p` kullanımını bu entegrasyon için onaylanmış kabul ediyor

    Uzun süre çalışan gateway ana makineleri için Anthropic API anahtarları hâlâ daha
    öngörülebilir kurulumdur. OpenAI Codex OAuth, OpenClaw gibi harici
    araçlar için açıkça desteklenir.

    OpenClaw ayrıca **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** ve
    **Z.AI / GLM Coding Plan** dahil olmak üzere abonelik tarzı diğer barındırılan seçenekleri destekler.

    Belgeler: [Anthropic](/tr/providers/anthropic), [OpenAI](/tr/providers/openai),
    [Qwen Cloud](/tr/providers/qwen),
    [MiniMax](/tr/providers/minimax), [GLM Modelleri](/tr/providers/glm),
    [Yerel modeller](/tr/gateway/local-models), [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="API anahtarı olmadan Claude Max aboneliğini kullanabilir miyim?">
    Evet.

    Anthropic çalışanları bize OpenClaw tarzı Claude CLI kullanımının yeniden izinli olduğunu söyledi; bu nedenle
    OpenClaw, Anthropic yeni bir ilke yayımlamadıkça Claude abonelik kimlik doğrulaması ve `claude -p` kullanımını
    bu entegrasyon için onaylanmış kabul eder. En öngörülebilir sunucu tarafı kurulumu istiyorsanız bunun yerine
    bir Anthropic API anahtarı kullanın.

  </Accordion>

  <Accordion title="Claude abonelik kimlik doğrulamasını (Claude Pro veya Max) destekliyor musunuz?">
    Evet.

    Anthropic çalışanları bize bu kullanımın yeniden izinli olduğunu söyledi; bu nedenle OpenClaw,
    Anthropic yeni bir ilke yayımlamadıkça Claude CLI yeniden kullanımı ve `claude -p` kullanımını
    bu entegrasyon için onaylanmış kabul eder.

    Anthropic setup-token, desteklenen bir OpenClaw token yolu olarak hâlâ kullanılabilir, ancak OpenClaw artık mevcut olduğunda Claude CLI yeniden kullanımını ve `claude -p` seçeneğini tercih eder.
    Üretim veya çok kullanıcılı iş yükleri için Anthropic API anahtarı kimlik doğrulaması hâlâ
    daha güvenli ve daha öngörülebilir tercihtir. OpenClaw'da abonelik tarzı başka barındırılan
    seçenekler istiyorsanız [OpenAI](/tr/providers/openai), [Qwen / Model
    Cloud](/tr/providers/qwen), [MiniMax](/tr/providers/minimax) ve [GLM
    Modelleri](/tr/providers/glm) bölümlerine bakın.

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Anthropic'ten neden HTTP 429 rate_limit_error görüyorum?">
    Bu, **Anthropic kota/hız sınırınızın** geçerli pencere için tükendiği anlamına gelir. **Claude CLI** kullanıyorsanız
    pencerenin sıfırlanmasını bekleyin veya planınızı yükseltin. **Anthropic API anahtarı** kullanıyorsanız kullanımı/faturalandırmayı
    Anthropic Console üzerinden denetleyin ve gerektiğinde sınırları artırın.

    Mesaj özellikle şöyleyse:
    `Extra usage is required for long context requests`, istek
    Anthropic'in 1M context beta özelliğini (`context1m: true`) kullanmaya çalışıyordur. Bu yalnızca
    kimlik bilgileriniz uzun bağlam faturalandırması için uygunsa çalışır (API anahtarı faturalandırması veya
    Extra Usage etkinleştirilmiş OpenClaw Claude-login yolu).

    İpucu: OpenClaw’ın bir sağlayıcı hız sınırına takıldığında yanıt vermeye devam edebilmesi için bir **yedek model** ayarlayın.
    Bkz. [Modeller](/tr/cli/models), [OAuth](/tr/concepts/oauth) ve
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/tr/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock destekleniyor mu?">
    Evet. OpenClaw, paketle birlikte gelen bir **Amazon Bedrock (Converse)** sağlayıcısına sahiptir. AWS ortam işaretleri mevcut olduğunda OpenClaw, Bedrock akış/metin kataloğunu otomatik olarak keşfedebilir ve bunu örtük bir `amazon-bedrock` sağlayıcısı olarak birleştirebilir; aksi halde `plugins.entries.amazon-bedrock.config.discovery.enabled` ayarını açıkça etkinleştirebilir veya manuel bir sağlayıcı girdisi ekleyebilirsiniz. Bkz. [Amazon Bedrock](/tr/providers/bedrock) ve [Model sağlayıcıları](/tr/providers/models). Yönetilen bir anahtar akışını tercih ediyorsanız, Bedrock’un önünde OpenAI uyumlu bir proxy hâlâ geçerli bir seçenektir.
  </Accordion>

  <Accordion title="Codex kimlik doğrulaması nasıl çalışır?">
    OpenClaw, OAuth (ChatGPT oturum açma) üzerinden **OpenAI Code (Codex)** desteği sunar. Varsayılan PI çalıştırıcısı üzerinden Codex OAuth için
    `openai-codex/gpt-5.5` kullanın. Doğrudan OpenAI API anahtarı erişimi için
    `openai/gpt-5.5` kullanın. GPT-5.5 ayrıca `openai-codex/gpt-5.5` üzerinden
    abonelik/OAuth kullanabilir veya `openai/gpt-5.5` ve `agentRuntime.id: "codex"` ile yerel Codex uygulama sunucusu
    çalıştırmaları yapabilir.
    Bkz. [Model sağlayıcıları](/tr/concepts/model-providers) ve [İlk kurulum (CLI)](/tr/start/wizard).
  </Accordion>

  <Accordion title="OpenClaw neden hâlâ openai-codex’ten bahsediyor?">
    `openai-codex`, ChatGPT/Codex OAuth için sağlayıcı ve kimlik doğrulama profili kimliğidir.
    Ayrıca Codex OAuth için açık PI model önekidir:

    - `openai/gpt-5.5` = PI içinde mevcut doğrudan OpenAI API anahtarı rotası
    - `openai-codex/gpt-5.5` = PI içinde Codex OAuth rotası
    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = yerel Codex uygulama sunucusu rotası
    - `openai-codex:...` = kimlik doğrulama profili kimliği, model referansı değil

    Doğrudan OpenAI Platform faturalandırma/sınır yolunu istiyorsanız
    `OPENAI_API_KEY` ayarlayın. ChatGPT/Codex abonelik kimlik doğrulamasını istiyorsanız
    `openclaw models auth login --provider openai-codex` ile oturum açın ve PI çalıştırmaları için
    `openai-codex/*` model referanslarını kullanın.

  </Accordion>

  <Accordion title="Codex OAuth sınırları neden ChatGPT web’den farklı olabilir?">
    Codex OAuth, OpenAI tarafından yönetilen ve plana bağlı kota pencerelerini kullanır. Pratikte
    bu sınırlar, ikisi de aynı hesaba bağlı olsa bile ChatGPT web sitesi/uygulama deneyiminden farklı olabilir.

    OpenClaw, şu anda görünür sağlayıcı kullanım/kota pencerelerini
    `openclaw models status` içinde gösterebilir, ancak ChatGPT web
    haklarını doğrudan API erişimine uydurmaz veya normalleştirmez. Doğrudan OpenAI Platform
    faturalandırma/sınır yolunu istiyorsanız API anahtarıyla `openai/*` kullanın.

  </Accordion>

  <Accordion title="OpenAI abonelik kimlik doğrulamasını (Codex OAuth) destekliyor musunuz?">
    Evet. OpenClaw, **OpenAI Code (Codex) abonelik OAuth** desteğini tam olarak sunar.
    OpenAI, OpenClaw gibi harici araçlarda/iş akışlarında abonelik OAuth kullanımına açıkça izin verir.
    İlk kurulum OAuth akışını sizin için çalıştırabilir.

    Bkz. [OAuth](/tr/concepts/oauth), [Model sağlayıcıları](/tr/concepts/model-providers) ve [İlk kurulum (CLI)](/tr/start/wizard).

  </Accordion>

  <Accordion title="Gemini CLI OAuth nasıl kurulur?">
    Gemini CLI, `openclaw.json` içinde bir istemci kimliği veya gizli anahtar değil, bir **Plugin kimlik doğrulama akışı** kullanır.

    Adımlar:

    1. Gemini CLI’ı yerel olarak kurun, böylece `gemini` `PATH` üzerinde olur
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin’i etkinleştirin: `openclaw plugins enable google`
    3. Oturum açın: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Oturum açtıktan sonra varsayılan model: `google-gemini-cli/gemini-3-flash-preview`
    5. İstekler başarısız olursa Gateway ana makinesinde `GOOGLE_CLOUD_PROJECT` veya `GOOGLE_CLOUD_PROJECT_ID` ayarlayın

    Bu, OAuth belirteçlerini Gateway ana makinesindeki kimlik doğrulama profillerinde saklar. Ayrıntılar: [Model sağlayıcıları](/tr/concepts/model-providers).

  </Accordion>

  <Accordion title="Gündelik sohbetler için yerel model uygun mu?">
    Genellikle hayır. OpenClaw büyük bağlama + güçlü güvenliğe ihtiyaç duyar; küçük kartlar kırpar ve sızıntı yapar. Kullanmanız gerekiyorsa yerelde çalıştırabildiğiniz **en büyük** model derlemesini (LM Studio) çalıştırın ve [/gateway/local-models](/tr/gateway/local-models) bölümüne bakın. Daha küçük/kuantize modeller prompt enjeksiyonu riskini artırır - bkz. [Güvenlik](/tr/gateway/security).
  </Accordion>

  <Accordion title="Barındırılan model trafiğini belirli bir bölgede nasıl tutarım?">
    Bölgeye sabitlenmiş uç noktaları seçin. OpenRouter, MiniMax, Kimi ve GLM için ABD’de barındırılan seçenekler sunar; verileri bölge içinde tutmak için ABD’de barındırılan varyantı seçin. Seçtiğiniz bölgesel sağlayıcıya saygı gösterirken yedeklerin kullanılabilir kalması için `models.mode: "merge"` kullanarak Anthropic/OpenAI’ı bunların yanında listeleyebilirsiniz.
  </Accordion>

  <Accordion title="Bunu kurmak için Mac Mini satın almak zorunda mıyım?">
    Hayır. OpenClaw macOS veya Linux üzerinde çalışır (Windows için WSL2 üzerinden). Mac mini isteğe bağlıdır - bazı kişiler
    her zaman açık bir ana makine olarak bir tane satın alır, ancak küçük bir VPS, ev sunucusu veya Raspberry Pi sınıfı bir cihaz da çalışır.

    Yalnızca **macOS’a özel araçlar** için bir Mac gerekir. iMessage için [BlueBubbles](/tr/channels/bluebubbles) kullanın (önerilir) - BlueBubbles sunucusu herhangi bir Mac’te çalışır ve Gateway Linux üzerinde veya başka bir yerde çalışabilir. Başka macOS’a özel araçlar istiyorsanız Gateway’i bir Mac’te çalıştırın veya bir macOS Node eşleştirin.

    Dokümanlar: [BlueBubbles](/tr/channels/bluebubbles), [Node’lar](/tr/nodes), [Mac uzaktan mod](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="iMessage desteği için Mac mini gerekir mi?">
    Mesajlar’a giriş yapmış **bir macOS cihazına** ihtiyacınız var. Bunun Mac mini olması **gerekmez** -
    herhangi bir Mac olur. iMessage için **[BlueBubbles](/tr/channels/bluebubbles) kullanın** (önerilir) - BlueBubbles sunucusu macOS üzerinde çalışırken Gateway Linux üzerinde veya başka bir yerde çalışabilir.

    Yaygın kurulumlar:

    - Gateway’i Linux/VPS üzerinde, BlueBubbles sunucusunu ise Mesajlar’a giriş yapmış herhangi bir Mac’te çalıştırın.
    - En basit tek makineli kurulumu istiyorsanız her şeyi Mac’te çalıştırın.

    Dokümanlar: [BlueBubbles](/tr/channels/bluebubbles), [Node’lar](/tr/nodes),
    [Mac uzaktan mod](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="OpenClaw çalıştırmak için bir Mac mini alırsam, onu MacBook Pro’ma bağlayabilir miyim?">
    Evet. **Mac mini Gateway’i çalıştırabilir** ve MacBook Pro’nuz bir
    **Node** (yardımcı cihaz) olarak bağlanabilir. Node’lar Gateway’i çalıştırmaz - o cihazda ekran/kamera/canvas ve `system.run` gibi ek
    yetenekler sağlar.

    Yaygın model:

    - Gateway Mac mini üzerinde (her zaman açık).
    - MacBook Pro macOS uygulamasını veya bir Node ana makinesini çalıştırır ve Gateway ile eşleşir.
    - Bunu görmek için `openclaw nodes status` / `openclaw nodes list` kullanın.

    Dokümanlar: [Node’lar](/tr/nodes), [Nodes CLI](/tr/cli/nodes).

  </Accordion>

  <Accordion title="Bun kullanabilir miyim?">
    Bun **önerilmez**. Özellikle WhatsApp ve Telegram ile çalışma zamanı hataları görüyoruz.
    Kararlı Gateway’ler için **Node** kullanın.

    Yine de Bun ile deneme yapmak istiyorsanız bunu WhatsApp/Telegram olmadan, üretim dışı bir Gateway üzerinde yapın.

  </Accordion>

  <Accordion title="Telegram: allowFrom içine ne yazılır?">
    `channels.telegram.allowFrom`, **insan gönderenin Telegram kullanıcı kimliğidir** (sayısal). Bot kullanıcı adı değildir.

    Kurulum yalnızca sayısal kullanıcı kimlikleri ister. Yapılandırmada zaten eski `@username` girdileriniz varsa `openclaw doctor --fix` bunları çözmeyi deneyebilir.

    Daha güvenli (üçüncü taraf bot yok):

    - Botunuza DM gönderin, ardından `openclaw logs --follow` çalıştırın ve `from.id` değerini okuyun.

    Resmi Bot API:

    - Botunuza DM gönderin, ardından `https://api.telegram.org/bot<bot_token>/getUpdates` çağrısı yapın ve `message.from.id` değerini okuyun.

    Üçüncü taraf (daha az özel):

    - `@userinfobot` veya `@getidsbot` hesabına DM gönderin.

    Bkz. [/channels/telegram](/tr/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Birden fazla kişi, farklı OpenClaw örnekleriyle tek bir WhatsApp numarasını kullanabilir mi?">
    Evet, **çoklu ajan yönlendirme** üzerinden. Her gönderenin WhatsApp **DM**’ini (eş `kind: "direct"`, gönderen E.164 biçiminde ör. `+15551234567`) farklı bir `agentId` ile bağlayın; böylece her kişi kendi çalışma alanına ve oturum deposuna sahip olur. Yanıtlar hâlâ **aynı WhatsApp hesabından** gelir ve DM erişim denetimi (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) WhatsApp hesabı başına geneldir. Bkz. [Çoklu Ajan Yönlendirme](/tr/concepts/multi-agent) ve [WhatsApp](/tr/channels/whatsapp).
  </Accordion>

  <Accordion title='Bir "hızlı sohbet" ajanı ve bir "kodlama için Opus" ajanı çalıştırabilir miyim?'>
    Evet. Çoklu ajan yönlendirme kullanın: her ajana kendi varsayılan modelini verin, ardından gelen rotaları (sağlayıcı hesabı veya belirli eşler) her ajana bağlayın. Örnek yapılandırma [Çoklu Ajan Yönlendirme](/tr/concepts/multi-agent) içinde yer alır. Ayrıca bkz. [Modeller](/tr/concepts/models) ve [Yapılandırma](/tr/gateway/configuration).
  </Accordion>

  <Accordion title="Homebrew Linux’ta çalışır mı?">
    Evet. Homebrew Linux’u destekler (Linuxbrew). Hızlı kurulum:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    OpenClaw’ı systemd üzerinden çalıştırıyorsanız hizmet PATH’inin `/home/linuxbrew/.linuxbrew/bin` (veya brew önekiniz) içerdiğinden emin olun; böylece `brew` ile kurulmuş araçlar oturum açılmayan kabuklarda çözümlenir.
    Son derlemeler ayrıca Linux systemd hizmetlerinde yaygın kullanıcı bin dizinlerini başa ekler (örneğin `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) ve ayarlandıklarında `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` ve `FNM_DIR` değerlerine uyar.

  </Accordion>

  <Accordion title="Düzenlenebilir git kurulumu ile npm kurulumu arasındaki fark">
    - **Düzenlenebilir (git) kurulum:** tam kaynak checkout, düzenlenebilir, katkıda bulunanlar için en iyisi.
      Derlemeleri yerel olarak çalıştırırsınız ve kodu/dokümanları yamalayabilirsiniz.
    - **npm kurulumu:** global CLI kurulumu, repo yok, "sadece çalıştırmak" için en iyisi.
      Güncellemeler npm dist-tag’lerinden gelir.

    Dokümanlar: [Başlarken](/tr/start/getting-started), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="Daha sonra npm ve git kurulumları arasında geçiş yapabilir miyim?">
    Evet. OpenClaw zaten kurulu olduğunda `openclaw update --channel ...` kullanın.
    Bu **verilerinizi silmez** - yalnızca OpenClaw kod kurulumunu değiştirir.
    Durumunuz (`~/.openclaw`) ve çalışma alanınız (`~/.openclaw/workspace`) olduğu gibi kalır.

    npm’den git’e:

    ```bash
    openclaw update --channel dev
    ```

    git’ten npm’ye:

    ```bash
    openclaw update --channel stable
    ```

    Planlanan mod geçişini önce önizlemek için `--dry-run` ekleyin. Güncelleyici
    Doctor takip işlemlerini çalıştırır, hedef kanal için Plugin kaynaklarını yeniler ve
    `--no-restart` geçmediğiniz sürece Gateway’i yeniden başlatır.

    Kurucu da iki modu zorlayabilir:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Yedekleme ipuçları: bkz. [Yedekleme stratejisi](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Gateway’i dizüstü bilgisayarımda mı yoksa bir VPS’te mi çalıştırmalıyım?">
    Kısa yanıt: **7/24 güvenilirlik istiyorsanız bir VPS kullanın**. En düşük
    sürtünmeyi istiyorsanız ve uyku/yeniden başlatmalar sizin için sorun değilse yerel olarak çalıştırın.

    **Dizüstü bilgisayar (yerel Gateway)**

    - **Artılar:** sunucu maliyeti yok, yerel dosyalara doğrudan erişim, canlı tarayıcı penceresi.
    - **Eksiler:** uyku/ağ düşmeleri = bağlantı kesintileri, işletim sistemi güncellemeleri/yeniden başlatmaları kesinti yaratır, uyanık kalmalıdır.

    **VPS / bulut**

    - **Artılar:** her zaman açık, kararlı ağ, dizüstü bilgisayar uyku sorunları yok, çalışır durumda tutmak daha kolay.
    - **Eksiler:** çoğunlukla başsız çalışır (ekran görüntüleri kullanın), yalnızca uzaktan dosya erişimi, güncellemeler için SSH kullanmanız gerekir.

    **OpenClaw’a özel not:** WhatsApp/Telegram/Slack/Mattermost/Discord hepsi VPS’ten sorunsuz çalışır. Tek gerçek ödünleşim **başsız tarayıcı** ile görünür pencere arasındadır. Bkz. [Tarayıcı](/tr/tools/browser).

    **Önerilen varsayılan:** Daha önce Gateway bağlantı kopmaları yaşadıysanız VPS. Mac'i aktif olarak kullanıyorsanız ve yerel dosya erişimi veya görünür bir tarayıcıyla kullanıcı arayüzü otomasyonu istiyorsanız yerel kurulum harikadır.

  </Accordion>

  <Accordion title="OpenClaw’ı ayrılmış bir makinede çalıştırmak ne kadar önemli?">
    Gerekli değildir, ancak **güvenilirlik ve yalıtım için önerilir**.

    - **Ayrılmış ana makine (VPS/Mac mini/Pi):** sürekli açık, daha az uyku/yeniden başlatma kesintisi, daha temiz izinler, çalışır durumda tutması daha kolay.
    - **Paylaşılan dizüstü/masaüstü:** test ve aktif kullanım için tamamen uygundur, ancak makine uykuya geçtiğinde veya güncellendiğinde duraklamalar bekleyin.

    Her iki dünyanın da en iyi tarafını istiyorsanız Gateway’i ayrılmış bir ana makinede tutun ve dizüstü bilgisayarınızı yerel ekran/kamera/komut çalıştırma araçları için bir **node** olarak eşleştirin. Bkz. [Nodes](/tr/nodes).
    Güvenlik rehberliği için [Security](/tr/gateway/security) sayfasını okuyun.

  </Accordion>

  <Accordion title="Minimum VPS gereksinimleri ve önerilen işletim sistemi nedir?">
    OpenClaw hafiftir. Temel bir Gateway + bir sohbet kanalı için:

    - **Mutlak minimum:** 1 vCPU, 1GB RAM, ~500MB disk.
    - **Önerilen:** ek kapasite (günlükler, medya, birden çok kanal) için 1-2 vCPU, 2GB RAM veya daha fazlası. Node araçları ve tarayıcı otomasyonu kaynak tüketebilir.

    İşletim sistemi: **Ubuntu LTS** (veya modern bir Debian/Ubuntu) kullanın. Linux kurulum yolu en iyi burada test edilmiştir.

    Dokümanlar: [Linux](/tr/platforms/linux), [VPS barındırma](/tr/vps).

  </Accordion>

  <Accordion title="OpenClaw’ı bir VM içinde çalıştırabilir miyim ve gereksinimler nelerdir?">
    Evet. Bir VM’i VPS ile aynı şekilde değerlendirin: sürekli açık, erişilebilir olmalı ve Gateway ile etkinleştirdiğiniz kanallar için yeterli
    RAM’e sahip olmalıdır.

    Temel rehberlik:

    - **Mutlak minimum:** 1 vCPU, 1GB RAM.
    - **Önerilen:** birden çok kanal, tarayıcı otomasyonu veya medya araçları çalıştırıyorsanız 2GB RAM veya daha fazlası.
    - **İşletim sistemi:** Ubuntu LTS veya başka bir modern Debian/Ubuntu.

    Windows kullanıyorsanız, **WSL2 en kolay VM tarzı kurulumdur** ve en iyi araç uyumluluğuna sahiptir.
    Bkz. [Windows](/tr/platforms/windows), [VPS barındırma](/tr/vps).
    macOS’i bir VM içinde çalıştırıyorsanız bkz. [macOS VM](/tr/install/macos-vm).

  </Accordion>
</AccordionGroup>

## İlgili

- [SSS](/tr/help/faq) — ana SSS (modeller, oturumlar, Gateway, güvenlik ve daha fazlası)
- [Kurulum özeti](/tr/install)
- [Başlarken](/tr/start/getting-started)
- [Sorun giderme](/tr/help/troubleshooting)

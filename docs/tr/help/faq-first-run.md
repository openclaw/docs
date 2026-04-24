---
read_when:
    - Yeni kurulum, takılan onboarding veya ilk çalıştırma hataları
    - Kimlik doğrulama ve sağlayıcı aboneliklerini seçme
    - docs.openclaw.ai erişilemiyor, kontrol paneli açılamıyor, kurulum takıldı
sidebarTitle: First-run FAQ
summary: 'SSS: hızlı başlangıç ve ilk çalıştırma kurulumu — kurulum, onboarding, kimlik doğrulama, abonelikler, ilk hatalar'
title: 'SSS: ilk çalıştırma kurulumu'
x-i18n:
    generated_at: "2026-04-24T09:12:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68dd2d2c306735dc213a25c4d2a3e5c20e2a707ffca553f3e7503d75efd74f5c
    source_path: help/faq-first-run.md
    workflow: 15
---

  Hızlı başlangıç ve ilk çalıştırma Soru-Cevap. Günlük işlemler, modeller, kimlik doğrulama, oturumlar
  ve sorun giderme için ana [FAQ](/tr/help/faq) bölümüne bakın.

  ## Hızlı başlangıç ve ilk çalıştırma kurulumu

  <AccordionGroup>
  <Accordion title="Takıldım, en hızlı nasıl çıkabilirim?">
    Makinenizi **görebilen** yerel bir AI aracı kullanın. Bu, Discord'da sormaktan çok daha etkilidir
    çünkü çoğu "takıldım" durumu, uzak yardımcıların inceleyemeyeceği **yerel config veya ortam sorunlarıdır**.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Bu araçlar repo'yu okuyabilir, komut çalıştırabilir, günlükleri inceleyebilir ve makine düzeyindeki
    kurulumunuzu (PATH, hizmetler, izinler, auth dosyaları) düzeltmeye yardımcı olabilir. Onlara
    hacklenebilir (git) kurulum üzerinden **tam kaynak checkout'u** verin:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Bu, OpenClaw'ı **bir git checkout'undan** kurar, böylece aracı kodu + belgeleri okuyabilir ve
    tam olarak hangi sürümü çalıştırdığınızı değerlendirebilir. Daha sonra
    yükleyiciyi `--install-method git` olmadan yeniden çalıştırarak her zaman stable sürüme geri dönebilirsiniz.

    İpucu: aracıdan düzeltmeyi **planlamasını ve denetlemesini** isteyin (adım adım), sonra yalnızca
    gerekli komutları yürütün. Bu, değişiklikleri küçük ve denetlenmesi kolay tutar.

    Gerçek bir hata veya düzeltme keşfederseniz lütfen bir GitHub sorunu açın veya PR gönderin:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Şu komutlarla başlayın (yardım isterken çıktıları paylaşın):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Yaptıkları:

    - `openclaw status`: gateway/aracı sağlığı + temel config için hızlı anlık görüntü.
    - `openclaw models status`: sağlayıcı kimlik doğrulamasını + model kullanılabilirliğini kontrol eder.
    - `openclaw doctor`: yaygın config/durum sorunlarını doğrular ve onarır.

    Diğer yararlı CLI kontrolleri: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Hızlı hata ayıklama döngüsü: [Bir şey bozuksa ilk 60 saniye](#first-60-seconds-if-something-is-broken).
    Kurulum belgeleri: [Install](/tr/install), [Installer flags](/tr/install/installer), [Updating](/tr/install/updating).

  </Accordion>

  <Accordion title="Heartbeat sürekli atlanıyor. Atlama nedenleri ne anlama geliyor?">
    Yaygın Heartbeat atlama nedenleri:

    - `quiet-hours`: yapılandırılmış etkin saatler penceresinin dışında
    - `empty-heartbeat-file`: `HEARTBEAT.md` var ama yalnızca boş/yalnızca başlık iskeleti içeriyor
    - `no-tasks-due`: `HEARTBEAT.md` görev modu etkin ama görev aralıklarından hiçbiri henüz zamanı gelmiş değil
    - `alerts-disabled`: tüm Heartbeat görünürlüğü devre dışı (`showOk`, `showAlerts` ve `useIndicator` hepsi kapalı)

    Görev modunda, zaman damgaları yalnızca gerçek bir Heartbeat çalıştırması
    tamamlandıktan sonra ilerletilir. Atlanan çalıştırmalar görevleri tamamlanmış olarak işaretlemez.

    Belgeler: [Heartbeat](/tr/gateway/heartbeat), [Automation & Tasks](/tr/automation).

  </Accordion>

  <Accordion title="OpenClaw'ı kurmanın ve ayarlamanın önerilen yolu">
    Repo, kaynaktan çalıştırmayı ve onboarding kullanmayı önerir:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Sihirbaz UI varlıklarını da otomatik olarak derleyebilir. Onboarding'den sonra genellikle Gateway'i **18789** portunda çalıştırırsınız.

    Kaynaktan (katkıcılar/geliştiriciler):

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

  <Accordion title="Onboarding'den sonra dashboard'u nasıl açarım?">
    Sihirbaz, onboarding'den hemen sonra tarayıcınızı temiz (token'sız) bir dashboard URL'si ile açar ve bağlantıyı özet içinde de yazdırır. O sekmeyi açık tutun; açılmadıysa aynı makinede yazdırılan URL'yi kopyalayıp yapıştırın.
  </Accordion>

  <Accordion title="Dashboard'u localhost'ta ve uzakta nasıl kimlik doğrularım?">
    **Localhost (aynı makine):**

    - `http://127.0.0.1:18789/` adresini açın.
    - Paylaşılan gizli kimlik doğrulaması isterse yapılandırılmış token veya parolayı Control UI ayarlarına yapıştırın.
    - Token kaynağı: `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`).
    - Parola kaynağı: `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`).
    - Henüz paylaşılan gizli yapılandırılmadıysa `openclaw doctor --generate-gateway-token` ile bir token üretin.

    **Localhost'ta değilse:**

    - **Tailscale Serve** (önerilir): bind'i loopback olarak tutun, `openclaw gateway --tailscale serve` çalıştırın, `https://<magicdns>/` açın. `gateway.auth.allowTailscale`, `true` ise kimlik başlıkları Control UI/WebSocket auth'u karşılar (yapıştırılan paylaşılan gizli yoktur, güvenilir gateway sunucusunu varsayar); HTTP API'leri ise özel olarak private-ingress `none` veya trusted-proxy HTTP auth kullanmadığınız sürece yine paylaşılan gizli auth gerektirir.
      Aynı istemciden gelen kötü eşzamanlı Serve auth girişimleri, başarısız auth sınırlayıcı bunları kaydetmeden önce serileştirilir; bu yüzden ikinci kötü yeniden deneme zaten `retry later` gösterebilir.
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` çalıştırın (veya password auth yapılandırın), `http://<tailscale-ip>:18789/` açın, sonra eşleşen paylaşılan gizliyi dashboard ayarlarına yapıştırın.
    - **Kimlik farkında reverse proxy**: Gateway'i loopback dışı güvenilir bir proxy arkasında tutun, `gateway.auth.mode: "trusted-proxy"` yapılandırın, sonra proxy URL'sini açın.
    - **SSH tüneli**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, sonra `http://127.0.0.1:18789/` açın. Paylaşılan gizli auth, tünel üzerinden de geçerlidir; istenirse yapılandırılmış token veya parolayı yapıştırın.

    Bind modları ve auth ayrıntıları için bkz. [Dashboard](/tr/web/dashboard) ve [Web surfaces](/tr/web).

  </Accordion>

  <Accordion title="Sohbet onayları için neden iki exec approval config'i var?">
    Bunlar farklı katmanları denetler:

    - `approvals.exec`: onay istemlerini sohbet hedeflerine iletir
    - `channels.<channel>.execApprovals`: o kanalın exec onayları için yerel bir onay istemcisi gibi davranmasını sağlar

    Sunucu exec ilkesi yine de gerçek onay geçididir. Sohbet config'i yalnızca onay
    istemlerinin nerede görüneceğini ve insanların nasıl yanıt verebileceğini denetler.

    Çoğu kurulumda **ikisine de** ihtiyacınız yoktur:

    - Sohbet zaten komutları ve yanıtları destekliyorsa aynı sohbet içinde `/approve`, paylaşılan yol üzerinden çalışır.
    - Desteklenen bir yerel kanal onaylayıcıları güvenle çıkarabiliyorsa, OpenClaw artık `channels.<channel>.execApprovals.enabled` ayarlanmadığında veya `"auto"` olduğunda DM öncelikli yerel onayları otomatik etkinleştirir.
    - Yerel onay kartları/düğmeleri mevcut olduğunda, bu yerel UI birincil yoldur; araç sonucu sohbet onaylarının kullanılamadığını veya tek yolun manuel onay olduğunu söylemedikçe aracı yalnızca manuel `/approve` komutu içermelidir.
    - İstemler ayrıca diğer sohbetlere veya açık operasyon odalarına da iletilmek zorundaysa yalnızca `approvals.exec` kullanın.
    - Onay istemlerinin kaynak oda/konuya geri gönderilmesini açıkça istiyorsanız yalnızca `channels.<channel>.execApprovals.target: "channel"` veya `"both"` kullanın.
    - Plugin onayları yine ayrıdır: varsayılan olarak aynı sohbette `/approve`, isteğe bağlı `approvals.plugin` iletimi kullanırlar ve yalnızca bazı yerel kanallar üstüne Plugin onayı yerel işlemesini korur.

    Kısa sürüm: iletim yönlendirme içindir, yerel istemci config'i ise daha zengin kanala özgü UX içindir.
    Bkz. [Exec Approvals](/tr/tools/exec-approvals).

  </Accordion>

  <Accordion title="Hangi çalışma zamanına ihtiyacım var?">
    Node **>= 22** gereklidir. `pnpm` önerilir. Bun, Gateway için **önerilmez**.
  </Accordion>

  <Accordion title="Raspberry Pi üzerinde çalışır mı?">
    Evet. Gateway hafiftir - belgelerde kişisel kullanım için **512MB-1GB RAM**, **1 çekirdek** ve yaklaşık **500MB**
    diskin yeterli olduğu yazıyor ve bir **Raspberry Pi 4'ün bunu çalıştırabileceği** belirtiliyor.

    Ek pay bırakmak isterseniz (günlükler, medya, diğer hizmetler), **2GB önerilir**, ancak
    bu katı bir minimum değildir.

    İpucu: küçük bir Pi/VPS Gateway'i barındırabilir ve dizüstü/telefonunuzdaki **Node**'ları
    yerel ekran/kamera/canvas veya komut yürütme için eşleştirebilirsiniz. Bkz. [Nodes](/tr/nodes).

  </Accordion>

  <Accordion title="Raspberry Pi kurulumları için ipuçları var mı?">
    Kısa sürüm: çalışır, ama pürüzler bekleyin.

    - **64-bit** bir OS kullanın ve Node >= 22 tutun.
    - Günlükleri görebilmek ve hızlı güncelleyebilmek için **hacklenebilir (git) kurulum** tercih edin.
    - Kanallar/Skills olmadan başlayın, sonra bunları tek tek ekleyin.
    - Garip ikili dosya sorunlarıyla karşılaşırsanız, bu genellikle bir **ARM uyumluluk** sorunudur.

    Belgeler: [Linux](/tr/platforms/linux), [Install](/tr/install).

  </Accordion>

  <Accordion title="Wake up my friend ekranında takılıyor / onboarding hatch olmuyor. Şimdi ne yapmalıyım?">
    Bu ekran, Gateway'in erişilebilir ve kimliği doğrulanmış olmasına bağlıdır. TUI ayrıca
    ilk hatch sırasında "Wake up, my friend!" ifadesini otomatik gönderir. Bu satırı **hiç yanıt olmadan**
    görüyorsanız ve token'lar 0'da kalıyorsa, aracı hiç çalışmamıştır.

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

    Gateway uzaktaysa tünel/Tailscale bağlantısının açık olduğundan ve UI'ın
    doğru Gateway'i gösterdiğinden emin olun. Bkz. [Remote access](/tr/gateway/remote).

  </Accordion>

  <Accordion title="Kurulumumu yeni bir makineye (Mac mini) onboarding'i yeniden yapmadan taşıyabilir miyim?">
    Evet. **Durum dizinini** ve **çalışma alanını** kopyalayın, sonra Doctor'ı bir kez çalıştırın. Bu,
    **her iki konumu da** kopyaladığınız sürece botunuzu "tam olarak aynı" (bellek, oturum geçmişi, kimlik doğrulama ve kanal
    durumu) olarak tutar:

    1. Yeni makineye OpenClaw kurun.
    2. Eski makineden `$OPENCLAW_STATE_DIR` (varsayılan: `~/.openclaw`) dizinini kopyalayın.
    3. Çalışma alanınızı kopyalayın (varsayılan: `~/.openclaw/workspace`).
    4. `openclaw doctor` çalıştırın ve Gateway hizmetini yeniden başlatın.

    Bu; config'i, auth profillerini, WhatsApp kimlik bilgilerini, oturumları ve belleği korur. Uzak moddaysanız,
    gateway sunucusunun oturum deposuna ve çalışma alanına sahip olduğunu unutmayın.

    **Önemli:** çalışma alanınızı yalnızca GitHub'a commit/push ediyorsanız,
    **belleği + bootstrap dosyalarını** yedekliyorsunuzdur; ama **oturum geçmişini veya kimlik doğrulamayı değil**. Bunlar
    `~/.openclaw/` altında yaşar (örneğin `~/.openclaw/agents/<agentId>/sessions/`).

    İlgili: [Migrating](/tr/install/migrating), [Diskte neler nerede yaşar](#where-things-live-on-disk),
    [Agent workspace](/tr/concepts/agent-workspace), [Doctor](/tr/gateway/doctor),
    [Remote mode](/tr/gateway/remote).

  </Accordion>

  <Accordion title="En son sürümde nelerin yeni olduğunu nerede görebilirim?">
    GitHub changelog'una bakın:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    En yeni girdiler en üsttedir. En üst bölüm **Unreleased** olarak işaretliyse, bir sonraki tarihli
    bölüm gönderilmiş en son sürümdür. Girdiler **Highlights**, **Changes** ve
    **Fixes** altında gruplanır (gerektiğinde docs/diğer bölümlerle birlikte).

  </Accordion>

  <Accordion title="docs.openclaw.ai erişilemiyor (SSL hatası)">
    Bazı Comcast/Xfinity bağlantıları `docs.openclaw.ai` adresini Xfinity
    Advanced Security üzerinden yanlışlıkla engelliyor. Bunu devre dışı bırakın veya `docs.openclaw.ai` alanını allowlist'e ekleyin, sonra yeniden deneyin.
    Lütfen bunu engelden çıkarmamıza yardımcı olmak için buradan bildirin: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Siteye hâlâ ulaşamıyorsanız, belgeler GitHub üzerinde yansılanmıştır:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Stable ile beta arasındaki fark">
    **Stable** ve **beta**, ayrı kod hatları değil, **npm dist-tag**'leridir:

    - `latest` = stable
    - `beta` = test için erken derleme

    Genellikle bir stable sürüm önce **beta** üzerine gelir, sonra açık bir
    yükseltme adımı aynı sürümü `latest`'e taşır. Bakımcılar ayrıca
    gerektiğinde doğrudan `latest`'e de yayımlayabilir. Bu yüzden beta ve stable,
    yükseltmeden sonra **aynı sürümü** gösterebilir.

    Nelerin değiştiğini görün:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Kurulum tek satırlıkları ve beta ile dev arasındaki fark için aşağıdaki accordion'a bakın.

  </Accordion>

  <Accordion title="Beta sürümünü nasıl kurarım ve beta ile dev arasındaki fark nedir?">
    **Beta**, npm dist-tag `beta`'dır (`latest` ile yükseltmeden sonra eşleşebilir).
    **Dev**, `main` dalının hareketli ucudur (git); yayımlandığında npm dist-tag `dev` kullanır.

    Tek satırlık komutlar (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows yükleyici (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Daha fazla ayrıntı: [Development channels](/tr/install/development-channels) ve [Installer flags](/tr/install/installer).

  </Accordion>

  <Accordion title="En son bit'leri nasıl denerim?">
    İki seçenek vardır:

    1. **Dev kanalı (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Bu, `main` dalına geçer ve kaynaktan günceller.

    2. **Hacklenebilir kurulum (yükleyici sitesinden):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Bu size düzenleyebileceğiniz yerel bir repo verir, sonra git üzerinden güncelleyebilirsiniz.

    Temiz bir clone'u elle tercih ediyorsanız, şunu kullanın:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Belgeler: [Update](/tr/cli/update), [Development channels](/tr/install/development-channels),
    [Install](/tr/install).

  </Accordion>

  <Accordion title="Kurulum ve onboarding genelde ne kadar sürer?">
    Yaklaşık kılavuz:

    - **Kurulum:** 2-5 dakika
    - **Onboarding:** Kaç kanal/model yapılandırdığınıza bağlı olarak 5-15 dakika

    Takılırsa [Installer stuck](#quick-start-and-first-run-setup)
    ve [I am stuck](#quick-start-and-first-run-setup) içindeki hızlı hata ayıklama döngüsünü kullanın.

  </Accordion>

  <Accordion title="Yükleyici takıldı mı? Daha fazla geri bildirimi nasıl alırım?">
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
    # install.ps1 için henüz ayrılmış bir -Verbose bayrağı yok.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Daha fazla seçenek: [Installer flags](/tr/install/installer).

  </Accordion>

  <Accordion title="Windows kurulumu git not found veya openclaw not recognized diyor">
    Windows'ta iki yaygın sorun:

    **1) npm error spawn git / git not found**

    - **Git for Windows** kurun ve `git` komutunun PATH üzerinde olduğundan emin olun.
    - PowerShell'i kapatıp yeniden açın, sonra yükleyiciyi yeniden çalıştırın.

    **2) Kurulumdan sonra openclaw is not recognized**

    - npm global bin klasörünüz PATH üzerinde değil.
    - Yolu kontrol edin:

      ```powershell
      npm config get prefix
      ```

    - Bu dizini kullanıcı PATH'inize ekleyin (Windows'ta `\bin` soneki gerekmez; çoğu sistemde bu `%AppData%\npm` olur).
    - PATH'i güncelledikten sonra PowerShell'i kapatıp yeniden açın.

    En sorunsuz Windows kurulumu için yerel Windows yerine **WSL2** kullanın.
    Belgeler: [Windows](/tr/platforms/windows).

  </Accordion>

  <Accordion title="Windows exec çıktısı bozuk Çince metin gösteriyor - ne yapmalıyım?">
    Bu genellikle yerel Windows kabuklarında bir konsol kod sayfası uyumsuzluğudur.

    Belirtiler:

    - `system.run`/`exec` çıktısı Çinceyi bozuk karakter olarak gösterir
    - Aynı komut başka bir terminal profilinde düzgün görünür

    PowerShell'de hızlı çözüm:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Sonra Gateway'i yeniden başlatın ve komutunuzu yeniden deneyin:

    ```powershell
    openclaw gateway restart
    ```

    Bunu en son OpenClaw sürümünde hâlâ yeniden üretebiliyorsanız, şurada izleyin/bildirin:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Belgeler sorumu yanıtlamadı - daha iyi bir yanıtı nasıl alırım?">
    **Hacklenebilir (git) kurulumu** kullanın; böylece tam kaynak ve belgelere yerel olarak sahip olursunuz, sonra
    botunuza (veya Claude/Codex'e) _o klasörün içinden_ sorun ki repo'yu okuyup tam yanıt verebilsin.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Daha fazla ayrıntı: [Install](/tr/install) ve [Installer flags](/tr/install/installer).

  </Accordion>

  <Accordion title="OpenClaw'ı Linux'a nasıl kurarım?">
    Kısa yanıt: Linux kılavuzunu izleyin, sonra onboarding çalıştırın.

    - Linux hızlı yolu + hizmet kurulumu: [Linux](/tr/platforms/linux).
    - Tam adım adım kılavuz: [Getting Started](/tr/start/getting-started).
    - Yükleyici + güncellemeler: [Install & updates](/tr/install/updating).

  </Accordion>

  <Accordion title="OpenClaw'ı VPS üzerine nasıl kurarım?">
    Herhangi bir Linux VPS çalışır. Sunucuya kurun, sonra Gateway'e ulaşmak için SSH/Tailscale kullanın.

    Kılavuzlar: [exe.dev](/tr/install/exe-dev), [Hetzner](/tr/install/hetzner), [Fly.io](/tr/install/fly).
    Uzak erişim: [Gateway remote](/tr/gateway/remote).

  </Accordion>

  <Accordion title="Bulut/VPS kurulum kılavuzları nerede?">
    Yaygın sağlayıcılar için bir **barındırma merkezi** tutuyoruz. Birini seçin ve kılavuzu izleyin:

    - [VPS hosting](/tr/vps) (tüm sağlayıcılar tek yerde)
    - [Fly.io](/tr/install/fly)
    - [Hetzner](/tr/install/hetzner)
    - [exe.dev](/tr/install/exe-dev)

    Bulutta nasıl çalışır: **Gateway sunucuda çalışır** ve siz buna
    dizüstü/telefonunuzdan Control UI (veya Tailscale/SSH) aracılığıyla erişirsiniz. Durumunuz + çalışma alanınız
    sunucuda yaşar, bu yüzden sunucuyu doğruluk kaynağı olarak görün ve yedekleyin.

    Yerel ekran/kamera/canvas erişmek veya dizüstünüzde komut çalıştırmak için
    bulut Gateway'ine **Node**'lar (Mac/iOS/Android/headless) eşleştirebilir,
    Gateway'i ise bulutta tutabilirsiniz.

    Merkez: [Platforms](/tr/platforms). Uzak erişim: [Gateway remote](/tr/gateway/remote).
    Nodes: [Nodes](/tr/nodes), [Nodes CLI](/tr/cli/nodes).

  </Accordion>

  <Accordion title="OpenClaw'ın kendini güncellemesini isteyebilir miyim?">
    Kısa yanıt: **mümkün, ama önerilmez**. Güncelleme akışı
    Gateway'i yeniden başlatabilir (bu da etkin oturumu düşürür), temiz bir git checkout gerektirebilir ve
    onay isteyebilir. Daha güvenlisi: güncellemeleri operatör olarak kabuktan çalıştırmak.

    CLI kullanın:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Bunu bir aracıdan otomatikleştirmek zorundaysanız:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Belgeler: [Update](/tr/cli/update), [Updating](/tr/install/updating).

  </Accordion>

  <Accordion title="Onboarding gerçekte ne yapar?">
    `openclaw onboard`, önerilen kurulum yoludur. **Yerel modda** size şunları adım adım sunar:

    - **Model/auth kurulumu** (sağlayıcı OAuth, API anahtarları, Anthropic setup-token ve LM Studio gibi yerel model seçenekleri)
    - **Çalışma alanı** konumu + bootstrap dosyaları
    - **Gateway ayarları** (bind/port/auth/Tailscale)
    - **Kanallar** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage ve QQ Bot gibi paketlenmiş kanal Plugin'leri)
    - **Daemon kurulumu** (macOS'ta LaunchAgent; Linux/WSL2'de systemd kullanıcı birimi)
    - **Sağlık kontrolleri** ve **Skills** seçimi

    Ayrıca yapılandırılmış modeliniz bilinmiyorsa veya auth eksikse uyarır.

  </Accordion>

  <Accordion title="Bunu çalıştırmak için Claude veya OpenAI aboneliğine ihtiyacım var mı?">
    Hayır. OpenClaw'ı **API anahtarları** (Anthropic/OpenAI/diğerleri) ile veya
    verilerinizin cihazınızda kalması için **yalnızca yerel modellerle** çalıştırabilirsiniz. Abonelikler (Claude
    Pro/Max veya OpenAI Codex), bu sağlayıcılarla kimlik doğrulamanın isteğe bağlı yollarıdır.

    OpenClaw içindeki Anthropic için pratik ayrım şudur:

    - **Anthropic API anahtarı**: normal Anthropic API faturalandırması
    - **OpenClaw içinde Claude CLI / Claude abonelik kimlik doğrulaması**: Anthropic çalışanları
      bize bu kullanımın yeniden izinli olduğunu söyledi ve OpenClaw, Anthropic yeni bir
      politika yayımlamadığı sürece `claude -p` kullanımını bu entegrasyon için izinli
      kabul ediyor

    Uzun ömürlü gateway sunucuları için Anthropic API anahtarları yine de daha
    öngörülebilir kurulumdur. OpenAI Codex OAuth, OpenClaw gibi harici
    araçlar için açıkça desteklenir.

    OpenClaw, diğer barındırılan abonelik tarzı seçenekleri de destekler; bunlar arasında
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** ve
    **Z.AI / GLM Coding Plan** bulunur.

    Belgeler: [Anthropic](/tr/providers/anthropic), [OpenAI](/tr/providers/openai),
    [Qwen Cloud](/tr/providers/qwen),
    [MiniMax](/tr/providers/minimax), [GLM Models](/tr/providers/glm),
    [Local models](/tr/gateway/local-models), [Models](/tr/concepts/models).

  </Accordion>

  <Accordion title="API anahtarı olmadan Claude Max aboneliğini kullanabilir miyim?">
    Evet.

    Anthropic çalışanları bize OpenClaw tarzı Claude CLI kullanımının yeniden izinli olduğunu söyledi; bu yüzden
    OpenClaw, Anthropic yeni bir politika yayımlamadığı sürece
    Claude abonelik kimlik doğrulamasını ve `claude -p` kullanımını bu entegrasyon için izinli kabul eder. En öngörülebilir sunucu tarafı kurulumu istiyorsanız
    bunun yerine bir Anthropic API anahtarı kullanın.

  </Accordion>

  <Accordion title="Claude abonelik kimlik doğrulamasını (Claude Pro veya Max) destekliyor musunuz?">
    Evet.

    Anthropic çalışanları bize bu kullanımın yeniden izinli olduğunu söyledi, bu yüzden OpenClaw
    Anthropic yeni bir politika yayımlamadığı sürece
    Claude CLI yeniden kullanımını ve `claude -p` kullanımını bu entegrasyon için izinli kabul eder.

    Anthropic setup-token hâlâ desteklenen bir OpenClaw token yolu olarak mevcuttur, ancak OpenClaw artık mevcut olduğunda Claude CLI yeniden kullanımını ve `claude -p` kullanımını tercih eder.
    Üretim veya çok kullanıcılı iş yükleri için Anthropic API anahtarı kimlik doğrulaması hâlâ
    daha güvenli ve daha öngörülebilir seçimdir. OpenClaw içindeki diğer abonelik tarzı barındırılan
    seçenekleri istiyorsanız bkz. [OpenAI](/tr/providers/openai), [Qwen / Model
    Cloud](/tr/providers/qwen), [MiniMax](/tr/providers/minimax) ve [GLM
    Models](/tr/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Anthropic'ten neden HTTP 429 rate_limit_error görüyorum?">
    Bu, geçerli pencere için **Anthropic kotanızın/rate limit'inizin** tükendiği anlamına gelir. **Claude CLI**
    kullanıyorsanız pencerenin sıfırlanmasını bekleyin veya planınızı yükseltin. **Anthropic API anahtarı**
    kullanıyorsanız kullanım/faturalandırma için Anthropic Console'u
    kontrol edin ve gerektiğinde limitleri yükseltin.

    Mesaj özellikle şuysa:
    `Extra usage is required for long context requests`, istek
    Anthropic'in 1M bağlam beta'sını (`context1m: true`) kullanmaya çalışıyordur. Bu yalnızca kimlik bilginiz uzun bağlam faturalandırmasına uygunsa çalışır (API anahtarı faturalandırması veya
    Extra Usage etkin OpenClaw Claude giriş yolu).

    İpucu: bir sağlayıcı rate-limit durumundayken OpenClaw'ın yanıt vermeye devam etmesi için bir **fallback model** ayarlayın.
    Bkz. [Models](/tr/cli/models), [OAuth](/tr/concepts/oauth) ve
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/tr/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock destekleniyor mu?">
    Evet. OpenClaw, paketlenmiş bir **Amazon Bedrock (Converse)** sağlayıcısına sahiptir. AWS env işaretçileri mevcut olduğunda OpenClaw, akışlı/metin Bedrock kataloğunu otomatik keşfedebilir ve bunu örtük bir `amazon-bedrock` sağlayıcısı olarak birleştirebilir; aksi halde `plugins.entries.amazon-bedrock.config.discovery.enabled` özelliğini açıkça etkinleştirebilir veya manuel bir sağlayıcı girdisi ekleyebilirsiniz. Bkz. [Amazon Bedrock](/tr/providers/bedrock) ve [Model providers](/tr/providers/models). Yönetilen anahtar akışını tercih ederseniz, Bedrock'un önündeki OpenAI uyumlu bir proxy yine de geçerli bir seçenektir.
  </Accordion>

  <Accordion title="Codex auth nasıl çalışır?">
    OpenClaw, **OpenAI Code (Codex)** desteğini OAuth (ChatGPT girişi) üzerinden sağlar. Varsayılan PI çalıştırıcısı üzerinden Codex OAuth için
    `openai-codex/gpt-5.5` kullanın.
    Geçerli doğrudan OpenAI API anahtarı erişimi için `openai/gpt-5.4` kullanın. GPT-5.5 doğrudan
    API anahtarı erişimi, OpenAI bunu genel API'de etkinleştirdiğinde desteklenir; bugün
    GPT-5.5, `openai-codex/gpt-5.5` üzerinden abonelik/OAuth veya
    `openai/gpt-5.5` ile `embeddedHarness.runtime: "codex"` üzerinden yerel Codex
    app-server çalıştırmaları kullanır.
    Bkz. [Model providers](/tr/concepts/model-providers) ve [Onboarding (CLI)](/tr/start/wizard).
  </Accordion>

  <Accordion title="OpenClaw neden hâlâ openai-codex'ten bahsediyor?">
    `openai-codex`, ChatGPT/Codex OAuth için sağlayıcı ve auth-profile kimliğidir.
    Aynı zamanda Codex OAuth için açık PI model önekidir:

    - `openai/gpt-5.4` = PI içindeki geçerli doğrudan OpenAI API anahtarı yolu
    - `openai/gpt-5.5` = OpenAI GPT-5.5'i API'de etkinleştirdiğinde gelecekteki doğrudan API anahtarı yolu
    - `openai-codex/gpt-5.5` = PI içindeki Codex OAuth yolu
    - `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` = yerel Codex app-server yolu
    - `openai-codex:...` = model ref'i değil, auth profil kimliği

    Doğrudan OpenAI Platform faturalandırma/limit yolunu istiyorsanız
    `OPENAI_API_KEY` ayarlayın. ChatGPT/Codex abonelik kimlik doğrulaması istiyorsanız,
    `openclaw models auth login --provider openai-codex` ile oturum açın ve
    PI çalıştırmaları için `openai-codex/*` model ref'lerini kullanın.

  </Accordion>

  <Accordion title="Codex OAuth limitleri neden ChatGPT web'den farklı olabilir?">
    Codex OAuth, OpenAI tarafından yönetilen, plana bağlı kota pencereleri kullanır. Pratikte,
    her ikisi de aynı hesaba bağlı olsa bile bu limitler ChatGPT web sitesi/uygulama deneyiminden farklı olabilir.

    OpenClaw, şu anda görünür sağlayıcı kullanım/kota pencerelerini
    `openclaw models status` içinde gösterebilir, ancak ChatGPT-web
    haklarını doğrudan API erişimine dönüştürmez veya normalize etmez. Doğrudan OpenAI Platform
    faturalandırma/limit yolunu istiyorsanız, API anahtarıyla `openai/*` kullanın.

  </Accordion>

  <Accordion title="OpenAI abonelik kimlik doğrulamasını (Codex OAuth) destekliyor musunuz?">
    Evet. OpenClaw, **OpenAI Code (Codex) abonelik OAuth** desteğini tam olarak sağlar.
    OpenAI, OpenClaw gibi harici araçlar/iş akışlarında
    abonelik OAuth kullanımına açıkça izin verir. Onboarding, OAuth akışını sizin için çalıştırabilir.

    Bkz. [OAuth](/tr/concepts/oauth), [Model providers](/tr/concepts/model-providers) ve [Onboarding (CLI)](/tr/start/wizard).

  </Accordion>

  <Accordion title="Gemini CLI OAuth'u nasıl kurarım?">
    Gemini CLI, `openclaw.json` içinde istemci kimliği veya gizli yerine
    **Plugin auth akışı** kullanır.

    Adımlar:

    1. `gemini` komutunun `PATH` üzerinde olması için Gemini CLI'ı yerel olarak kurun
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin'i etkinleştirin: `openclaw plugins enable google`
    3. Giriş yapın: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Giriş sonrası varsayılan model: `google-gemini-cli/gemini-3-flash-preview`
    5. İstekler başarısız olursa gateway sunucusunda `GOOGLE_CLOUD_PROJECT` veya `GOOGLE_CLOUD_PROJECT_ID` ayarlayın

    Bu, OAuth token'larını gateway sunucusundaki auth profillerinde saklar. Ayrıntılar: [Model providers](/tr/concepts/model-providers).

  </Accordion>

  <Accordion title="Gündelik sohbetler için yerel model uygun mu?">
    Genellikle hayır. OpenClaw büyük bağlam + güçlü güvenlik gerektirir; küçük kartlar keser ve sızdırır. Mecbursanız, yerel olarak çalıştırabildiğiniz **en büyük** model derlemesini (LM Studio) kullanın ve bkz. [/gateway/local-models](/tr/gateway/local-models). Daha küçük/kuantize modeller prompt-injection riskini artırır - bkz. [Security](/tr/gateway/security).
  </Accordion>

  <Accordion title="Barındırılan model trafiğini belirli bir bölgede nasıl tutarım?">
    Bölgeye sabitlenmiş uç noktaları seçin. OpenRouter, MiniMax, Kimi ve GLM için ABD'de barındırılan seçenekler sunar; verileri bölgede tutmak için ABD'de barındırılan varyantı seçin. Bunların yanında Anthropic/OpenAI'yi yine listeleyebilirsiniz; bunun için `models.mode: "merge"` kullanın, böylece seçtiğiniz bölgesel sağlayıcıya saygı gösterirken fallback'ler kullanılabilir kalır.
  </Accordion>

  <Accordion title="Bunu kurmak için mutlaka Mac Mini almam gerekiyor mu?">
    Hayır. OpenClaw macOS veya Linux üzerinde çalışır (Windows, WSL2 üzerinden). Mac mini isteğe bağlıdır - bazı kişiler
    her zaman açık bir sunucu olarak bir tane alır, ancak küçük bir VPS, ev sunucusu veya Raspberry Pi sınıfı bir kutu da çalışır.

    Yalnızca **macOS'e özel araçlar** için Mac gerekir. iMessage için [BlueBubbles](/tr/channels/bluebubbles) kullanın (önerilir) - BlueBubbles sunucusu herhangi bir Mac üzerinde çalışır ve Gateway Linux'ta veya başka bir yerde çalışabilir. Başka macOS'e özel araçlar istiyorsanız, Gateway'i bir Mac üzerinde çalıştırın veya bir macOS Node'u eşleştirin.

    Belgeler: [BlueBubbles](/tr/channels/bluebubbles), [Nodes](/tr/nodes), [Mac remote mode](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="iMessage desteği için Mac mini gerekiyor mu?">
    Mesajlar uygulamasında oturum açmış **bir tür macOS cihazına** ihtiyacınız var. Bunun mutlaka Mac mini olması gerekmez -
    herhangi bir Mac çalışır. iMessage için **[BlueBubbles](/tr/channels/bluebubbles)** kullanın (önerilir) - BlueBubbles sunucusu macOS üzerinde çalışır, Gateway ise Linux'ta veya başka bir yerde olabilir.

    Yaygın kurulumlar:

    - Gateway'i Linux/VPS üzerinde, BlueBubbles sunucusunu ise Mesajlar'da oturum açmış herhangi bir Mac üzerinde çalıştırın.
    - En basit tek makine kurulumu istiyorsanız her şeyi Mac üzerinde çalıştırın.

    Belgeler: [BlueBubbles](/tr/channels/bluebubbles), [Nodes](/tr/nodes),
    [Mac remote mode](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="OpenClaw'ı çalıştırmak için bir Mac mini alırsam, onu MacBook Pro'ma bağlayabilir miyim?">
    Evet. **Mac mini Gateway'i çalıştırabilir**, MacBook Pro'nuz ise
    **Node** (eşlik eden cihaz) olarak bağlanabilir. Node'lar Gateway'i çalıştırmaz -
    o cihaz üzerinde ekran/kamera/canvas ve `system.run`
    gibi ek yetenekler sağlar.

    Yaygın desen:

    - Gateway Mac mini üzerinde (her zaman açık).
    - MacBook Pro macOS uygulamasını veya bir Node sunucusunu çalıştırır ve Gateway ile eşleştirilir.
    - Bunu görmek için `openclaw nodes status` / `openclaw nodes list` kullanın.

    Belgeler: [Nodes](/tr/nodes), [Nodes CLI](/tr/cli/nodes).

  </Accordion>

  <Accordion title="Bun kullanabilir miyim?">
    Bun **önerilmez**. Özellikle WhatsApp ve Telegram ile çalışma zamanı hataları görüyoruz.
    Kararlı gateway'ler için **Node** kullanın.

    Bun ile yine de denemek istiyorsanız, bunu
    WhatsApp/Telegram olmayan bir üretim dışı gateway üzerinde yapın.

  </Accordion>

  <Accordion title="Telegram: allowFrom içine ne yazılır?">
    `channels.telegram.allowFrom`, **insan gönderenin Telegram kullanıcı kimliğidir** (sayısal). Bot kullanıcı adı değildir.

    Kurulum yalnızca sayısal kullanıcı kimliklerini ister. Config içinde zaten eski `@username` girdileriniz varsa, `openclaw doctor --fix` bunları çözümlemeyi deneyebilir.

    Daha güvenli (üçüncü taraf bot olmadan):

    - Botunuza DM gönderin, sonra `openclaw logs --follow` çalıştırın ve `from.id` değerini okuyun.

    Resmi Bot API:

    - Botunuza DM gönderin, sonra `https://api.telegram.org/bot<bot_token>/getUpdates` çağırın ve `message.from.id` değerini okuyun.

    Üçüncü taraf (daha az gizli):

    - `@userinfobot` veya `@getidsbot`'a DM gönderin.

    Bkz. [/channels/telegram](/tr/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Bir WhatsApp numarasını farklı OpenClaw örnekleriyle birden çok kişi kullanabilir mi?">
    Evet, **çoklu aracı yönlendirme** ile. Her gönderenin WhatsApp **DM**'sini (eş `kind: "direct"`, gönderen E.164 örneğin `+15551234567`) farklı bir `agentId`'ye bağlayın; böylece her kişi kendi çalışma alanını ve oturum deposunu alır. Yanıtlar yine **aynı WhatsApp hesabından** gelir ve DM erişim denetimi (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) WhatsApp hesabı başına globaldir. Bkz. [Multi-Agent Routing](/tr/concepts/multi-agent) ve [WhatsApp](/tr/channels/whatsapp).
  </Accordion>

  <Accordion title='Bir "hızlı sohbet" aracısı ve bir "kodlama için Opus" aracısı çalıştırabilir miyim?'>
    Evet. Çoklu aracı yönlendirme kullanın: her aracıya kendi varsayılan modelini verin, sonra gelen rotaları (sağlayıcı hesabı veya belirli eşler) her aracıya bağlayın. Örnek config [Multi-Agent Routing](/tr/concepts/multi-agent) içinde bulunur. Ayrıca bkz. [Models](/tr/concepts/models) ve [Configuration](/tr/gateway/configuration).
  </Accordion>

  <Accordion title="Homebrew Linux üzerinde çalışır mı?">
    Evet. Homebrew Linux'u (Linuxbrew) destekler. Hızlı kurulum:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    OpenClaw'ı systemd üzerinden çalıştırıyorsanız, hizmet PATH'inin `/home/linuxbrew/.linuxbrew/bin` (veya brew önekiniz) içermesini sağlayın ki `brew` ile kurulan araçlar giriş olmayan kabuklarda çözümlenebilsin.
    Son derlemeler ayrıca Linux systemd hizmetlerinde yaygın kullanıcı bin dizinlerini de öne ekler (örneğin `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) ve ayarlı olduğunda `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` ve `FNM_DIR` değerlerine uyar.

  </Accordion>

  <Accordion title="Hacklenebilir git kurulumu ile npm kurulumu arasındaki fark">
    - **Hacklenebilir (git) kurulum:** tam kaynak checkout, düzenlenebilir, katkıcılar için en iyisi.
      Derlemeleri yerel olarak çalıştırırsınız ve kod/belgeleri yamalayabilirsiniz.
    - **npm kurulumu:** global CLI kurulumu, repo yok, "sadece çalıştırmak" için en iyisi.
      Güncellemeler npm dist-tag'lerinden gelir.

    Belgeler: [Getting started](/tr/start/getting-started), [Updating](/tr/install/updating).

  </Accordion>

  <Accordion title="npm ve git kurulumları arasında daha sonra geçiş yapabilir miyim?">
    Evet. Diğer türü kurun, sonra gateway hizmetinin yeni giriş noktasını göstermesi için Doctor çalıştırın.
    Bu **verilerinizi silmez** - yalnızca OpenClaw kod kurulumunu değiştirir. Durumunuz
    (`~/.openclaw`) ve çalışma alanınız (`~/.openclaw/workspace`) olduğu gibi kalır.

    npm'den git'e:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    Git'ten npm'e:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor, gateway hizmet giriş noktası uyumsuzluğunu algılar ve hizmet config'ini geçerli kurulumla eşleşecek şekilde yeniden yazmayı önerir (otomasyonda `--repair` kullanın).

    Yedekleme ipuçları: bkz. [Backup strategy](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Gateway'i dizüstümde mi yoksa VPS üzerinde mi çalıştırmalıyım?">
    Kısa yanıt: **7/24 güvenilirlik istiyorsanız VPS kullanın**. En düşük sürtünmeyi istiyorsanız ve uyku/yeniden başlatmaları sorun etmiyorsanız yerelde çalıştırın.

    **Dizüstü (yerel Gateway)**

    - **Artılar:** sunucu maliyeti yok, yerel dosyalara doğrudan erişim, canlı browser penceresi.
    - **Eksiler:** uyku/ağ kopmaları = bağlantı kesilmeleri, OS güncellemeleri/yeniden başlatmalar kesintiye uğratır, makine uyanık kalmalıdır.

    **VPS / bulut**

    - **Artılar:** her zaman açık, kararlı ağ, dizüstü uyku sorunları yok, çalışır durumda tutmak daha kolay.
    - **Eksiler:** genelde headless çalışır (ekran görüntüsü kullanın), yalnızca uzaktan dosya erişimi, güncellemeler için SSH gerekir.

    **OpenClaw'e özgü not:** WhatsApp/Telegram/Slack/Mattermost/Discord bir VPS üzerinden sorunsuz çalışır. Tek gerçek değiş tokuş **headless browser** ile görünür pencere arasındadır. Bkz. [Browser](/tr/tools/browser).

    **Önerilen varsayılan:** Daha önce gateway bağlantı kopmaları yaşadıysanız VPS. Yerel kurulum, Mac'i etkin olarak kullanırken ve yerel dosya erişimi veya görünür bir browser ile UI otomasyonu istediğinizde harikadır.

  </Accordion>

  <Accordion title="OpenClaw'ı ayrı bir makinede çalıştırmak ne kadar önemli?">
    Zorunlu değil, ancak **güvenilirlik ve yalıtım için önerilir**.

    - **Ayrılmış sunucu (VPS/Mac mini/Pi):** her zaman açık, daha az uyku/yeniden başlatma kesintisi, daha temiz izinler, çalışır durumda tutmak daha kolay.
    - **Paylaşılan dizüstü/masaüstü:** test ve etkin kullanım için tamamen uygun, ancak makine uyuduğunda veya güncellendiğinde duraklamalar bekleyin.

    Her iki dünyanın da en iyisini istiyorsanız Gateway'i ayrılmış bir sunucuda tutun ve dizüstünüzü yerel ekran/kamera/exec araçları için **Node** olarak eşleştirin. Bkz. [Nodes](/tr/nodes).
    Güvenlik rehberliği için [Security](/tr/gateway/security) bölümünü okuyun.

  </Accordion>

  <Accordion title="En düşük VPS gereksinimleri ve önerilen OS nedir?">
    OpenClaw hafiftir. Temel bir Gateway + bir sohbet kanalı için:

    - **Mutlak minimum:** 1 vCPU, 1GB RAM, ~500MB disk.
    - **Önerilen:** Pay bırakmak için 1-2 vCPU, 2GB RAM veya daha fazlası (günlükler, medya, birden çok kanal). Node araçları ve browser otomasyonu kaynak tüketebilir.

    OS: **Ubuntu LTS** kullanın (veya herhangi bir modern Debian/Ubuntu). Linux kurulum yolu en iyi orada test edilmiştir.

    Belgeler: [Linux](/tr/platforms/linux), [VPS hosting](/tr/vps).

  </Accordion>

  <Accordion title="OpenClaw'ı bir VM içinde çalıştırabilir miyim ve gereksinimler nelerdir?">
    Evet. Bir VM'yi VPS ile aynı şekilde değerlendirin: her zaman açık olmalı, erişilebilir olmalı ve
    Gateway ile etkinleştirdiğiniz kanallar için yeterli RAM'e sahip olmalıdır.

    Temel kılavuz:

    - **Mutlak minimum:** 1 vCPU, 1GB RAM.
    - **Önerilen:** Birden çok kanal, browser otomasyonu veya medya araçları çalıştırıyorsanız 2GB RAM veya daha fazlası.
    - **OS:** Ubuntu LTS veya başka bir modern Debian/Ubuntu.

    Windows kullanıyorsanız, **WSL2 en kolay VM tarzı kurulumdur** ve en iyi araç
    uyumluluğuna sahiptir. Bkz. [Windows](/tr/platforms/windows), [VPS hosting](/tr/vps).
    macOS'u bir VM içinde çalıştırıyorsanız bkz. [macOS VM](/tr/install/macos-vm).

  </Accordion>
</AccordionGroup>

## İlgili

- [FAQ](/tr/help/faq) — ana SSS (modeller, oturumlar, gateway, güvenlik, daha fazlası)
- [Install overview](/tr/install)
- [Getting started](/tr/start/getting-started)
- [Troubleshooting](/tr/help/troubleshooting)

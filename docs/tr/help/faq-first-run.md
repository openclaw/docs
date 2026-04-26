---
read_when:
    - Yeni kurulum, takılan onboarding veya ilk çalıştırma hataları
    - Auth ve sağlayıcı aboneliklerini seçme
    - docs.openclaw.ai erişilemiyor, dashboard açılamıyor, kurulum takılıyor
sidebarTitle: First-run FAQ
summary: 'SSS: hızlı başlangıç ve ilk çalıştırma kurulumu — kurulum, onboarding, auth, abonelikler, ilk hatalar'
title: 'SSS: ilk çalıştırma kurulumu'
x-i18n:
    generated_at: "2026-04-26T11:32:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55d375285eb9f79cfa210b1b591b07b57d8a0a4d38c330062886d1204135ff48
    source_path: help/faq-first-run.md
    workflow: 15
---

  Hızlı başlangıç ve ilk çalıştırma Soru-Cevap. Günlük işlemler, modeller, auth, oturumlar
  ve sorun giderme için ana [SSS](/tr/help/faq) sayfasına bakın.

  ## Hızlı başlangıç ve ilk çalıştırma kurulumu

  <AccordionGroup>
  <Accordion title="Takıldım, en hızlı şekilde nasıl çözerim?">
    Makinenizi **görebilen** yerel bir AI aracı kullanın. Bu, Discord’da sormaktan çok daha etkilidir;
    çünkü “takıldım” vakalarının çoğu, uzaktaki yardımcıların inceleyemediği **yerel config veya ortam sorunlarıdır**.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Bu araçlar depoyu okuyabilir, komut çalıştırabilir, günlükleri inceleyebilir ve makine düzeyindeki
    kurulumunuzu (PATH, servisler, izinler, auth dosyaları) düzeltmenize yardımcı olabilir. Onlara
    hacklenebilir (git) kurulum aracılığıyla **tam kaynak checkout’u** verin:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Bu, OpenClaw’ı **git checkout’undan** kurar; böylece aracı kodu + belgeleri okuyabilir ve
    çalıştırdığınız tam sürüm hakkında akıl yürütebilir. Daha sonra yükleyiciyi `--install-method git`
    olmadan yeniden çalıştırarak her zaman kararlı sürüme geri dönebilirsiniz.

    İpucu: aracıdan düzeltmeyi **planlamasını ve denetlemesini** isteyin (adım adım), sonra yalnızca
    gerekli komutları yürütün. Bu, değişiklikleri küçük ve denetlenmesi daha kolay tutar.

    Gerçek bir hata veya düzeltme bulursanız, lütfen bir GitHub issue açın veya PR gönderin:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Şu komutlarla başlayın (yardım isterken çıktıları paylaşın):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Ne yaptıkları:

    - `openclaw status`: Gateway/aracı sağlığı + temel config için hızlı anlık görüntü.
    - `openclaw models status`: sağlayıcı auth + model kullanılabilirliğini kontrol eder.
    - `openclaw doctor`: yaygın config/durum sorunlarını doğrular ve onarır.

    Diğer yararlı CLI kontrolleri: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Hızlı hata ayıklama döngüsü: [Bir şey bozuksa ilk 60 saniye](#bir-şey-bozuksa-ilk-60-saniye).
    Kurulum belgeleri: [Install](/tr/install), [Installer flags](/tr/install/installer), [Updating](/tr/install/updating).

  </Accordion>

  <Accordion title="Heartbeat durmadan atlanıyor. Atlama nedenleri ne anlama geliyor?">
    Yaygın Heartbeat atlama nedenleri:

    - `quiet-hours`: yapılandırılmış etkin saat aralığının dışında
    - `empty-heartbeat-file`: `HEARTBEAT.md` var ama yalnızca boş/başlık-only iskelet içeriyor
    - `no-tasks-due`: `HEARTBEAT.md` görev modu etkin ama görev aralıklarından hiçbiri henüz zamanı gelmiş değil
    - `alerts-disabled`: tüm Heartbeat görünürlüğü devre dışı (`showOk`, `showAlerts` ve `useIndicator` tamamen kapalı)

    Görev modunda, zaman damgaları yalnızca gerçek bir Heartbeat çalıştırması
    tamamlandıktan sonra ilerletilir. Atlanan çalıştırmalar görevleri tamamlanmış olarak işaretlemez.

    Belgeler: [Heartbeat](/tr/gateway/heartbeat), [Automation & Tasks](/tr/automation).

  </Accordion>

  <Accordion title="OpenClaw’ı kurmak ve ayarlamak için önerilen yol">
    Depo, kaynaktan çalıştırmayı ve onboarding kullanmayı önerir:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Sihirbaz UI varlıklarını da otomatik olarak derleyebilir. Onboarding’den sonra genellikle Gateway’i **18789** portunda çalıştırırsınız.

    Kaynaktan (katkı verenler/geliştiriciler):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Henüz global kurulumunuz yoksa bunu `pnpm openclaw onboard` ile çalıştırın.

  </Accordion>

  <Accordion title="Onboarding’den sonra dashboard’ı nasıl açarım?">
    Sihirbaz, onboarding’den hemen sonra tarayıcınızı temiz (token içermeyen) bir dashboard URL’siyle açar ve bağlantıyı özet kısmında da yazdırır. O sekmeyi açık tutun; açılmadıysa yazdırılan URL’yi aynı makinede kopyalayıp yapıştırın.
  </Accordion>

  <Accordion title="Dashboard auth işlemini localhost ve remote için nasıl yaparım?">
    **Localhost (aynı makine):**

    - `http://127.0.0.1:18789/` adresini açın.
    - Paylaşılan gizli bilgi auth isterse yapılandırılmış token veya parolayı Control UI ayarlarına yapıştırın.
    - Token kaynağı: `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`).
    - Parola kaynağı: `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`).
    - Henüz paylaşılan gizli bilgi yapılandırılmadıysa `openclaw doctor --generate-gateway-token` ile bir token üretin.

    **Localhost dışında:**

    - **Tailscale Serve** (önerilir): bind loopback olarak kalsın, `openclaw gateway --tailscale serve` çalıştırın, `https://<magicdns>/` açın. `gateway.auth.allowTailscale` `true` ise kimlik başlıkları Control UI/WebSocket auth’ı karşılar (yapıştırılmış paylaşılan gizli bilgi gerekmez, güvenilen Gateway ana makinesi varsayılır); HTTP API’leri ise özel olarak private-ingress `none` veya trusted-proxy HTTP auth kullanmadığınız sürece yine de paylaşılan gizli bilgi auth gerektirir.
      Aynı istemciden gelen hatalı eşzamanlı Serve auth denemeleri, başarısız-auth sınırlayıcı bunları kaydetmeden önce serileştirilir; bu yüzden ikinci hatalı deneme bile zaten `retry later` gösterebilir.
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` çalıştırın (veya parola auth yapılandırın), `http://<tailscale-ip>:18789/` açın, ardından eşleşen paylaşılan gizli bilgiyi dashboard ayarlarına yapıştırın.
    - **Kimlik farkındalığı olan ters proxy**: Gateway’i loopback olmayan güvenilen bir proxy’nin arkasında tutun, `gateway.auth.mode: "trusted-proxy"` yapılandırın, sonra proxy URL’sini açın.
    - **SSH tüneli**: `ssh -N -L 18789:127.0.0.1:18789 user@host` sonra `http://127.0.0.1:18789/` açın. Tünel üzerinden de paylaşılan gizli bilgi auth geçerlidir; istenirse yapılandırılmış token’ı veya parolayı yapıştırın.

    Bind modları ve auth ayrıntıları için bkz. [Dashboard](/tr/web/dashboard) ve [Web surfaces](/tr/web).

  </Accordion>

  <Accordion title="Sohbet onayları için neden iki exec onay config’i var?">
    Farklı katmanları denetlerler:

    - `approvals.exec`: onay istemlerini sohbet hedeflerine iletir
    - `channels.<channel>.execApprovals`: o kanalın exec onayları için yerel onay istemcisi gibi davranmasını sağlar

    Ana makine exec ilkesi hâlâ gerçek onay kapısıdır. Sohbet config’i yalnızca onay istemlerinin nerede
    görüneceğini ve insanların nasıl yanıt verebileceğini denetler.

    Çoğu kurulumda **ikisine birden** ihtiyacınız olmaz:

    - Sohbet zaten komutları ve yanıtları destekliyorsa, aynı sohbet içindeki `/approve` paylaşılan yol üzerinden çalışır.
    - Desteklenen bir yerel kanal onaylayanları güvenli biçimde çıkarabiliyorsa, OpenClaw artık `channels.<channel>.execApprovals.enabled` ayarlanmamışsa veya `"auto"` ise DM-first yerel onayları otomatik etkinleştirir.
    - Yerel onay kartları/düğmeleri varsa, bu yerel UI birincil yoldur; araç sonucu sohbet onaylarının kullanılamadığını veya tek yolun manuel onay olduğunu söylemediği sürece aracı yalnızca manuel `/approve` komutu içermelidir.
    - İstemler başka sohbetlere veya açık ops odalarına da iletilmek zorundaysa yalnızca `approvals.exec` kullanın.
    - Onay istemlerinin kaynak oda/konuya da geri gönderilmesini açıkça istiyorsanız yalnızca `channels.<channel>.execApprovals.target: "channel"` veya `"both"` kullanın.
    - Plugin onayları yine ayrıdır: varsayılan olarak aynı sohbette `/approve` kullanırlar, isteğe bağlı `approvals.plugin` iletimi vardır ve yalnızca bazı yerel kanallar üstüne Plugin onayı-yerel işlemesini korur.

    Kısa sürüm: iletme yönlendirme içindir, yerel istemci config’i ise daha zengin kanala özgü UX içindir.
    Bkz. [Exec Approvals](/tr/tools/exec-approvals).

  </Accordion>

  <Accordion title="Hangi çalışma zamanına ihtiyacım var?">
    Node **>= 22** gereklidir. `pnpm` önerilir. Gateway için Bun **önerilmez**.
  </Accordion>

  <Accordion title="Raspberry Pi üzerinde çalışır mı?">
    Evet. Gateway hafiftir — belgelerde kişisel kullanım için **512MB-1GB RAM**, **1 çekirdek** ve yaklaşık **500MB**
    diskin yeterli olduğu belirtilir ve **Raspberry Pi 4 üzerinde çalışabildiği** not edilir.

    Ek boşluk istiyorsanız (günlükler, medya, diğer servisler), **2GB önerilir**, ancak
    bu katı bir alt sınır değildir.

    İpucu: küçük bir Pi/VPS Gateway’i barındırabilir ve yerel ekran/kamera/Canvas veya komut yürütme için
    dizüstü bilgisayarınızda/telefonunuzda **Node**’lar eşleştirebilirsiniz. Bkz. [Nodes](/tr/nodes).

  </Accordion>

  <Accordion title="Raspberry Pi kurulumları için ipucu var mı?">
    Kısa sürüm: çalışır, ama pürüzler bekleyin.

    - **64-bit** OS kullanın ve Node >= 22 tutun.
    - Günlükleri görebilmek ve hızlı güncellemek için **hacklenebilir (git) kurulumunu** tercih edin.
    - Kanallar/Skills olmadan başlayın, sonra tek tek ekleyin.
    - Tuhaf ikili dosya sorunlarıyla karşılaşırsanız, bu genellikle bir **ARM uyumluluk** problemidir.

    Belgeler: [Linux](/tr/platforms/linux), [Install](/tr/install).

  </Accordion>

  <Accordion title="Wake up my friend ekranında takılı kaldı / onboarding çatlamıyor. Ne yapmalıyım?">
    O ekran, Gateway’in erişilebilir ve kimliği doğrulanmış olmasına bağlıdır. TUI ilk çıkışta
    otomatik olarak “Wake up, my friend!” de gönderir. Bu satırı **hiç yanıt olmadan**
    görüyorsanız ve token’lar 0’da kalıyorsa, aracı hiç çalışmamış demektir.

    1. Gateway’i yeniden başlatın:

    ```bash
    openclaw gateway restart
    ```

    2. Durumu ve auth’ı kontrol edin:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Hâlâ takılıyorsa şunu çalıştırın:

    ```bash
    openclaw doctor
    ```

    Gateway remote ise tünel/Tailscale bağlantısının açık olduğundan ve UI’ın
    doğru Gateway’i hedeflediğinden emin olun. Bkz. [Remote access](/tr/gateway/remote).

  </Accordion>

  <Accordion title="Kurulumu yeni bir makineye (Mac mini) onboarding’i yeniden yapmadan taşıyabilir miyim?">
    Evet. **Durum dizinini** ve **çalışma alanını** kopyalayın, sonra Doctor’ı bir kez çalıştırın. Bu,
    **her iki** konumu da kopyaladığınız sürece botunuzu “tam olarak aynı” halde
    (bellek, oturum geçmişi, auth ve kanal durumu) tutar:

    1. Yeni makineye OpenClaw kurun.
    2. Eski makineden `$OPENCLAW_STATE_DIR` (varsayılan: `~/.openclaw`) dizinini kopyalayın.
    3. Çalışma alanınızı kopyalayın (varsayılan: `~/.openclaw/workspace`).
    4. `openclaw doctor` çalıştırın ve Gateway servisini yeniden başlatın.

    Bu, config’i, auth profillerini, WhatsApp kimlik bilgilerini, oturumları ve belleği korur. Remote
    moddaysanız, Gateway ana makinesinin oturum deposuna ve çalışma alanına sahip olduğunu unutmayın.

    **Önemli:** yalnızca çalışma alanınızı GitHub’a commit/push ederseniz,
    **bellek + bootstrap dosyalarını** yedeklemiş olursunuz, ancak **oturum geçmişini veya auth’ı değil**.
    Bunlar `~/.openclaw/` altında bulunur (örneğin `~/.openclaw/agents/<agentId>/sessions/`).

    İlgili: [Migrating](/tr/install/migrating), [Diskte neler nerede bulunur](#diskte-neler-nerede-bulunur),
    [Agent workspace](/tr/concepts/agent-workspace), [Doctor](/tr/gateway/doctor),
    [Remote mode](/tr/gateway/remote).

  </Accordion>

  <Accordion title="En son sürümde nelerin yeni olduğunu nerede görebilirim?">
    GitHub changelog’una bakın:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    En yeni girdiler üsttedir. Üst bölüm **Unreleased** olarak işaretliyse, bir sonraki tarihli
    bölüm yayımlanmış en son sürümdür. Girdiler **Highlights**, **Changes** ve
    **Fixes** olarak gruplanır (gerektiğinde docs/diğer bölümlerle birlikte).

  </Accordion>

  <Accordion title="docs.openclaw.ai erişilemiyor (SSL hatası)">
    Bazı Comcast/Xfinity bağlantıları `docs.openclaw.ai` alanını Xfinity
    Advanced Security üzerinden yanlış biçimde engeller. Bunu devre dışı bırakın veya `docs.openclaw.ai` alanını allowlist’e ekleyin, sonra yeniden deneyin.
    Lütfen burada bildirerek engelin kaldırılmasına yardımcı olun: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Siteye hâlâ ulaşamıyorsanız, belgeler GitHub üzerinde de aynalanır:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Kararlı ve beta arasındaki fark">
    **Kararlı** ve **beta**, ayrı kod hatları değil, **npm dist-tag**’leridir:

    - `latest` = kararlı
    - `beta` = test için erken derleme

    Genellikle bir kararlı sürüm önce **beta**’ya gelir, ardından açık bir
    terfi adımı aynı sürümü `latest`’e taşır. Gerektiğinde bakımcılar doğrudan
    `latest`’e de yayımlayabilir. Bu yüzden terfiden sonra beta ve kararlı
    **aynı sürümü** gösterebilir.

    Nelerin değiştiğine bakın:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Kurulum tek satırlıkları ve beta ile dev arasındaki fark için aşağıdaki accordion’a bakın.

  </Accordion>

  <Accordion title="Beta sürümü nasıl kurarım ve beta ile dev arasındaki fark nedir?">
    **Beta**, npm dist-tag `beta`’dır (terfiden sonra `latest` ile aynı olabilir).
    **Dev**, `main` dalının hareketli başıdır (git); yayımlandığında npm dist-tag `dev` kullanılır.

    Tek satırlık komutlar (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows yükleyicisi (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Daha fazla ayrıntı: [Development channels](/tr/install/development-channels) ve [Installer flags](/tr/install/installer).

  </Accordion>

  <Accordion title="En son parçaları nasıl denerim?">
    İki seçenek:

    1. **Dev kanalı (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Bu, sizi `main` dalına geçirir ve kaynaktan günceller.

    2. **Hacklenebilir kurulum (yükleyici sitesinden):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Bu size düzenleyebileceğiniz yerel bir repo verir, sonra git ile güncelleyebilirsiniz.

    Elle temiz bir clone tercih ederseniz şunu kullanın:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Belgeler: [Update](/tr/cli/update), [Development channels](/tr/install/development-channels),
    [Install](/tr/install).

  </Accordion>

  <Accordion title="Kurulum ve onboarding genellikle ne kadar sürer?">
    Yaklaşık rehber:

    - **Kurulum:** 2-5 dakika
    - **Onboarding:** kaç kanal/model yapılandırdığınıza bağlı olarak 5-15 dakika

    Takılırsa [Yükleyici takıldı](#quick-start-and-first-run-setup)
    ve [Takıldım](#quick-start-and-first-run-setup) içindeki hızlı hata ayıklama döngüsünü kullanın.

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
    # install.ps1 dosyasında henüz özel bir -Verbose bayrağı yok.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Daha fazla seçenek: [Installer flags](/tr/install/installer).

  </Accordion>

  <Accordion title="Windows kurulumunda git bulunamadı veya openclaw tanınmıyor deniyor">
    İki yaygın Windows sorunu:

    **1) npm error spawn git / git bulunamadı**

    - **Git for Windows** kurun ve `git` komutunun PATH üzerinde olduğundan emin olun.
    - PowerShell’i kapatıp yeniden açın, ardından yükleyiciyi tekrar çalıştırın.

    **2) Kurulumdan sonra openclaw tanınmıyor**

    - npm global bin klasörünüz PATH üzerinde değil.
    - Yolu kontrol edin:

      ```powershell
      npm config get prefix
      ```

    - Bu dizini kullanıcı PATH’inize ekleyin (Windows’ta `\bin` son eki gerekmez; çoğu sistemde bu `%AppData%\npm` olur).
    - PATH’i güncelledikten sonra PowerShell’i kapatıp yeniden açın.

    En sorunsuz Windows kurulumu için yerel Windows yerine **WSL2** kullanın.
    Belgeler: [Windows](/tr/platforms/windows).

  </Accordion>

  <Accordion title="Windows exec çıktısında bozuk Çince metin görünüyor - ne yapmalıyım?">
    Bu genellikle yerel Windows kabuklarında konsol kod sayfası uyuşmazlığıdır.

    Belirtiler:

    - `system.run`/`exec` çıktısı Çinceyi mojibake olarak gösterir
    - Aynı komut başka bir terminal profilinde düzgün görünür

    PowerShell’de hızlı geçici çözüm:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Sonra Gateway’i yeniden başlatın ve komutunuzu tekrar deneyin:

    ```powershell
    openclaw gateway restart
    ```

    Bunu en son OpenClaw sürümünde hâlâ yeniden üretebiliyorsanız, şurada izleyin/bildirin:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Belgeler sorumu yanıtlamadı - daha iyi bir yanıtı nasıl alırım?">
    Tam kaynak ve belgelere yerelde sahip olmak için **hacklenebilir (git) kurulumunu** kullanın, sonra
    botunuza (veya Claude/Codex’e) _o klasörün içinden_ sorun; böylece depoyu okuyup tam olarak yanıt verebilir.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Daha fazla ayrıntı: [Install](/tr/install) ve [Installer flags](/tr/install/installer).

  </Accordion>

  <Accordion title="OpenClaw’ı Linux’ta nasıl kurarım?">
    Kısa yanıt: Linux rehberini izleyin, sonra onboarding çalıştırın.

    - Linux hızlı yol + servis kurulumu: [Linux](/tr/platforms/linux).
    - Tam adım adım rehber: [Getting Started](/tr/start/getting-started).
    - Yükleyici + güncellemeler: [Install & updates](/tr/install/updating).

  </Accordion>

  <Accordion title="OpenClaw’ı bir VPS üzerinde nasıl kurarım?">
    Her Linux VPS çalışır. Sunucuya kurun, sonra Gateway’e ulaşmak için SSH/Tailscale kullanın.

    Rehberler: [exe.dev](/tr/install/exe-dev), [Hetzner](/tr/install/hetzner), [Fly.io](/tr/install/fly).
    Uzak erişim: [Gateway remote](/tr/gateway/remote).

  </Accordion>

  <Accordion title="Bulut/VPS kurulum rehberleri nerede?">
    Yaygın sağlayıcıları içeren bir **barındırma merkezi** tutuyoruz. Birini seçin ve rehberi izleyin:

    - [VPS hosting](/tr/vps) (tüm sağlayıcılar tek yerde)
    - [Fly.io](/tr/install/fly)
    - [Hetzner](/tr/install/hetzner)
    - [exe.dev](/tr/install/exe-dev)

    Bulutta nasıl çalıştığı: **Gateway sunucuda çalışır** ve siz ona
    dizüstü bilgisayarınızdan/telefonunuzdan Control UI (veya Tailscale/SSH) ile erişirsiniz. Durumunuz + çalışma alanınız
    sunucuda yaşar, bu yüzden ana makineyi doğruluk kaynağı olarak görün ve yedekleyin.

    Yerel ekran/kamera/Canvas’a erişmek veya dizüstü bilgisayarınızda komut çalıştırmak için
    bulut Gateway’ine **Node**’lar (Mac/iOS/Android/başsız) eşleştirebilirsiniz; böylece
    Gateway bulutta kalır.

    Merkez: [Platforms](/tr/platforms). Uzak erişim: [Gateway remote](/tr/gateway/remote).
    Nodes: [Nodes](/tr/nodes), [Nodes CLI](/tr/cli/nodes).

  </Accordion>

  <Accordion title="OpenClaw’dan kendisini güncellemesini isteyebilir miyim?">
    Kısa yanıt: **mümkün, ama önerilmez**. Güncelleme akışı
    Gateway’i yeniden başlatabilir (bu da etkin oturumu düşürür), temiz bir git checkout gerektirebilir ve
    onay isteyebilir. Daha güvenlisi: güncellemeleri operatör olarak kabuktan çalıştırın.

    CLI’yi kullanın:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Bir aracıdan otomatikleştirmeniz gerekiyorsa:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Belgeler: [Update](/tr/cli/update), [Updating](/tr/install/updating).

  </Accordion>

  <Accordion title="Onboarding gerçekte ne yapar?">
    `openclaw onboard` önerilen kurulum yoludur. **Yerel modda** sizi şunlar boyunca yönlendirir:

    - **Model/auth kurulumu** (sağlayıcı OAuth, API anahtarları, Anthropic setup-token ve LM Studio gibi yerel model seçenekleri)
    - **Çalışma alanı** konumu + bootstrap dosyaları
    - **Gateway ayarları** (bind/port/auth/tailscale)
    - **Kanallar** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage ve QQ Bot gibi paketlenmiş kanal Plugin’leri)
    - **Daemon kurulumu** (macOS’ta LaunchAgent; Linux/WSL2’de systemd kullanıcı birimi)
    - **Sağlık kontrolleri** ve **Skills** seçimi

    Ayrıca yapılandırdığınız model bilinmiyorsa veya auth eksikse uyarı verir.

  </Accordion>

  <Accordion title="Bunu çalıştırmak için Claude veya OpenAI aboneliğine ihtiyacım var mı?">
    Hayır. OpenClaw’ı **API anahtarlarıyla** (Anthropic/OpenAI/diğerleri) veya
    verileriniz cihazınızda kalsın diye **yalnızca yerel modellerle** çalıştırabilirsiniz. Abonelikler (Claude
    Pro/Max veya OpenAI Codex), bu sağlayıcılarda kimlik doğrulamak için isteğe bağlı yollardır.

    OpenClaw’daki Anthropic için pratik ayrım şudur:

    - **Anthropic API anahtarı**: normal Anthropic API faturalandırması
    - **OpenClaw içinde Claude CLI / Claude abonelik auth’ı**: Anthropic çalışanları
      bize bu kullanımın tekrar izinli olduğunu söyledi ve OpenClaw
      Anthropic yeni bir ilke yayımlamadıkça `claude -p`
      kullanımını bu entegrasyon için onaylı kabul ediyor

    Uzun ömürlü Gateway ana makineleri için Anthropic API anahtarları hâlâ daha
    öngörülebilir kurulumdur. OpenAI Codex OAuth, OpenClaw gibi harici
    araçlar için açıkça desteklenir.

    OpenClaw ayrıca diğer barındırılan abonelik tarzı seçenekleri de destekler:
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** ve
    **Z.AI / GLM Coding Plan**.

    Belgeler: [Anthropic](/tr/providers/anthropic), [OpenAI](/tr/providers/openai),
    [Qwen Cloud](/tr/providers/qwen),
    [MiniMax](/tr/providers/minimax), [GLM Models](/tr/providers/glm),
    [Local models](/tr/gateway/local-models), [Models](/tr/concepts/models).

  </Accordion>

  <Accordion title="Claude Max aboneliğini API anahtarı olmadan kullanabilir miyim?">
    Evet.

    Anthropic çalışanları bize OpenClaw tarzı Claude CLI kullanımına tekrar izin verildiğini söyledi; bu nedenle
    Anthropic yeni bir ilke yayımlamadıkça OpenClaw, Claude abonelik auth’ını ve `claude -p` kullanımını
    bu entegrasyon için onaylı kabul eder. En öngörülebilir sunucu tarafı kurulumunu istiyorsanız,
    bunun yerine bir Anthropic API anahtarı kullanın.

  </Accordion>

  <Accordion title="Claude abonelik auth’ını (Claude Pro veya Max) destekliyor musunuz?">
    Evet.

    Anthropic çalışanları bu kullanımın tekrar izinli olduğunu söyledi, bu yüzden OpenClaw
    Anthropic yeni bir ilke yayımlamadıkça Claude CLI yeniden kullanımını ve `claude -p`
    kullanımını bu entegrasyon için onaylı kabul eder.

    Anthropic setup-token, desteklenen bir OpenClaw token yolu olarak hâlâ mevcuttur, ancak OpenClaw artık mümkün olduğunda Claude CLI yeniden kullanımını ve `claude -p` kullanımını tercih eder.
    Üretim veya çok kullanıcılı iş yükleri için Anthropic API anahtarı auth’ı hâlâ
    daha güvenli ve daha öngörülebilir seçimdir. OpenClaw’da başka abonelik tarzı
    barındırılan seçenekler istiyorsanız [OpenAI](/tr/providers/openai), [Qwen / Model
    Cloud](/tr/providers/qwen), [MiniMax](/tr/providers/minimax) ve [GLM
    Models](/tr/providers/glm) sayfalarına bakın.

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Anthropic’ten neden HTTP 429 rate_limit_error görüyorum?">
    Bu, mevcut pencere için **Anthropic kotanızın/hız sınırınızın** tükendiği anlamına gelir. **Claude CLI**
    kullanıyorsanız, pencerenin sıfırlanmasını bekleyin veya planınızı yükseltin. Bir
    **Anthropic API anahtarı** kullanıyorsanız, kullanım/faturalandırma için Anthropic Console’u
    kontrol edin ve gerekirse limitleri artırın.

    Mesaj özellikle şuysa:
    `Extra usage is required for long context requests`, istek
    Anthropic’in 1M bağlam beta özelliğini (`context1m: true`) kullanmaya çalışıyor demektir. Bu yalnızca
    kimlik bilginiz uzun bağlam faturalandırmasına uygunsa çalışır (API anahtarı faturalandırması veya
    OpenClaw Claude-login yolu ve etkin Extra Usage ile).

    İpucu: bir **geri dönüş modeli** ayarlayın; böylece bir sağlayıcı hız sınırına takıldığında OpenClaw yanıt vermeye devam edebilir.
    Bkz. [Models](/tr/cli/models), [OAuth](/tr/concepts/oauth) ve
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/tr/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock destekleniyor mu?">
    Evet. OpenClaw, paketlenmiş bir **Amazon Bedrock (Converse)** sağlayıcısına sahiptir. AWS env işaretçileri mevcut olduğunda OpenClaw, akış/metin Bedrock kataloğunu otomatik keşfedebilir ve bunu örtük bir `amazon-bedrock` sağlayıcısı olarak birleştirebilir; aksi takdirde `plugins.entries.amazon-bedrock.config.discovery.enabled` değerini açıkça etkinleştirebilir veya manuel bir sağlayıcı girdisi ekleyebilirsiniz. Bkz. [Amazon Bedrock](/tr/providers/bedrock) ve [Model providers](/tr/providers/models). Yönetilen bir anahtar akışı tercih ediyorsanız, Bedrock önünde OpenAI uyumlu bir proxy de geçerli bir seçenektir.
  </Accordion>

  <Accordion title="Codex auth nasıl çalışır?">
    OpenClaw, **OpenAI Code (Codex)** desteğini OAuth (ChatGPT oturumu açma) ile sunar. Varsayılan PI runner üzerinden Codex OAuth için
    `openai-codex/gpt-5.5` kullanın. Doğrudan OpenAI API anahtarı erişimi için
    `openai/gpt-5.5` kullanın. GPT-5.5 ayrıca
    `openai-codex/gpt-5.5` üzerinden abonelik/OAuth veya
    `openai/gpt-5.5` ile `agentRuntime.id: "codex"` üzerinden yerel Codex app-server
    çalıştırmaları kullanabilir.
    Bkz. [Model providers](/tr/concepts/model-providers) ve [Onboarding (CLI)](/tr/start/wizard).
  </Accordion>

  <Accordion title="OpenClaw neden hâlâ openai-codex’ten bahsediyor?">
    `openai-codex`, ChatGPT/Codex OAuth için sağlayıcı ve auth-profile kimliğidir.
    Aynı zamanda Codex OAuth için açık PI model önekidir:

    - `openai/gpt-5.5` = PI içindeki güncel doğrudan OpenAI API anahtarı rotası
    - `openai-codex/gpt-5.5` = PI içindeki Codex OAuth rotası
    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = yerel Codex app-server rotası
    - `openai-codex:...` = auth profile kimliği, model başvurusu değil

    Doğrudan OpenAI Platform faturalandırma/limit yolunu istiyorsanız
    `OPENAI_API_KEY` ayarlayın. ChatGPT/Codex abonelik auth’ı istiyorsanız
    `openclaw models auth login --provider openai-codex` ile oturum açın ve
    PI çalıştırmaları için `openai-codex/*` model başvurularını kullanın.

  </Accordion>

  <Accordion title="Codex OAuth limitleri neden ChatGPT web’den farklı olabilir?">
    Codex OAuth, OpenAI tarafından yönetilen, plana bağlı kota pencereleri kullanır. Pratikte,
    her ikisi de aynı hesaba bağlı olsa bile bu limitler ChatGPT web sitesi/uygulama deneyiminden
    farklı olabilir.

    OpenClaw şu anda görünen sağlayıcı kullanım/kota pencerelerini
    `openclaw models status` içinde gösterebilir, ancak ChatGPT web
    yetkilerini doğrudan API erişimine uydurmaz veya uyduruyormuş gibi yapmaz. Doğrudan OpenAI Platform
    faturalandırma/limit yolunu istiyorsanız API anahtarıyla `openai/*` kullanın.

  </Accordion>

  <Accordion title="OpenAI abonelik auth’ını (Codex OAuth) destekliyor musunuz?">
    Evet. OpenClaw, **OpenAI Code (Codex) abonelik OAuth** desteğini tam olarak sunar.
    OpenAI, OpenClaw gibi harici araçlar/iş akışlarında abonelik OAuth kullanımına
    açıkça izin verir. Onboarding OAuth akışını sizin için çalıştırabilir.

    Bkz. [OAuth](/tr/concepts/oauth), [Model providers](/tr/concepts/model-providers) ve [Onboarding (CLI)](/tr/start/wizard).

  </Accordion>

  <Accordion title="Gemini CLI OAuth nasıl kurulur?">
    Gemini CLI, `openclaw.json` içindeki client id veya secret ile değil, bir **Plugin auth akışı**
    kullanır.

    Adımlar:

    1. `gemini` komutu `PATH` üzerinde olacak şekilde Gemini CLI’yi yerel olarak kurun
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin’i etkinleştirin: `openclaw plugins enable google`
    3. Giriş yapın: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Girişten sonraki varsayılan model: `google-gemini-cli/gemini-3-flash-preview`
    5. İstekler başarısız olursa, Gateway ana makinesinde `GOOGLE_CLOUD_PROJECT` veya `GOOGLE_CLOUD_PROJECT_ID` ayarlayın

    Bu, OAuth token’larını Gateway ana makinesindeki auth profillerinde saklar. Ayrıntılar: [Model providers](/tr/concepts/model-providers).

  </Accordion>

  <Accordion title="Günlük sıradan sohbetler için yerel model olur mu?">
    Genellikle hayır. OpenClaw büyük bağlam + güçlü güvenlik gerektirir; küçük kartlar kırpar ve sızıntı yapar. Mecbursanız yerelde çalıştırabildiğiniz **en büyük** model derlemesini (LM Studio) kullanın ve [/gateway/local-models](/tr/gateway/local-models) sayfasına bakın. Daha küçük/kuantize modeller prompt injection riskini artırır — bkz. [Security](/tr/gateway/security).
  </Accordion>

  <Accordion title="Barındırılan model trafiğini belirli bir bölgede nasıl tutarım?">
    Bölgeye sabitlenmiş uç noktaları seçin. OpenRouter, MiniMax, Kimi ve GLM için ABD’de barındırılan seçenekler sunar; verileri bölgede tutmak için ABD’de barındırılan varyantı seçin. Seçtiğiniz bölgesel sağlayıcıya saygı gösterirken geri dönüşlerin kullanılabilir kalması için `models.mode: "merge"` kullanarak bunların yanında Anthropic/OpenAI’yi yine listeleyebilirsiniz.
  </Accordion>

  <Accordion title="Bunu kurmak için Mac Mini almak zorunda mıyım?">
    Hayır. OpenClaw macOS veya Linux üzerinde çalışır (Windows için WSL2). Mac mini isteğe bağlıdır — bazı kişiler
    sürekli açık bir ana makine olarak alır, ama küçük bir VPS, ev sunucusu veya Raspberry Pi sınıfı bir cihaz da çalışır.

    Yalnızca **macOS-only araçlar** için Mac gerekir. iMessage için [BlueBubbles](/tr/channels/bluebubbles) kullanın (önerilir) —
    BlueBubbles sunucusu herhangi bir Mac üzerinde çalışır ve Gateway Linux veya başka bir yerde çalışabilir. Diğer macOS-only araçları istiyorsanız Gateway’i bir Mac üzerinde çalıştırın veya bir macOS Node eşleştirin.

    Belgeler: [BlueBubbles](/tr/channels/bluebubbles), [Nodes](/tr/nodes), [Mac remote mode](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="iMessage desteği için Mac mini gerekir mi?">
    Messages oturumu açık **bir tür macOS cihazına** ihtiyacınız var. Bunun Mac mini olması **gerekmez** —
    herhangi bir Mac çalışır. iMessage için **[BlueBubbles](/tr/channels/bluebubbles)** kullanın (önerilir) — BlueBubbles sunucusu macOS üzerinde çalışır, Gateway ise Linux veya başka bir yerde olabilir.

    Yaygın kurulumlar:

    - Gateway’i Linux/VPS üzerinde çalıştırın ve Messages oturumu açık herhangi bir Mac üzerinde BlueBubbles sunucusunu çalıştırın.
    - En basit tek makine kurulumu için her şeyi Mac üzerinde çalıştırın.

    Belgeler: [BlueBubbles](/tr/channels/bluebubbles), [Nodes](/tr/nodes),
    [Mac remote mode](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="OpenClaw çalıştırmak için Mac mini alırsam, onu MacBook Pro’ma bağlayabilir miyim?">
    Evet. **Mac mini Gateway’i çalıştırabilir** ve MacBook Pro’nuz bir
    **Node** (yardımcı cihaz) olarak bağlanabilir. Node’lar Gateway’i çalıştırmaz —
    o cihazda ekran/kamera/Canvas ve `system.run` gibi ek
    yetenekler sağlarlar.

    Yaygın düzen:

    - Gateway Mac mini üzerinde (sürekli açık).
    - MacBook Pro, macOS uygulamasını veya bir Node ana makinesini çalıştırır ve Gateway ile eşleşir.
    - Bunu görmek için `openclaw nodes status` / `openclaw nodes list` kullanın.

    Belgeler: [Nodes](/tr/nodes), [Nodes CLI](/tr/cli/nodes).

  </Accordion>

  <Accordion title="Bun kullanabilir miyim?">
    Bun **önerilmez**. Özellikle WhatsApp ve Telegram ile çalışma zamanı hataları görüyoruz.
    Kararlı Gateway’ler için **Node** kullanın.

    Yine de Bun ile denemek istiyorsanız, bunu WhatsApp/Telegram olmayan
    üretim dışı bir Gateway üzerinde yapın.

  </Accordion>

  <Accordion title="Telegram: allowFrom içine ne girer?">
    `channels.telegram.allowFrom`, **insan gönderenin Telegram kullanıcı kimliğidir** (sayısal). Bot kullanıcı adı değildir.

    Kurulum yalnızca sayısal kullanıcı kimlikleri ister. Config içinde zaten eski `@username` girdileriniz varsa, `openclaw doctor --fix` bunları çözümlemeyi deneyebilir.

    Daha güvenli yöntem (üçüncü taraf bot yok):

    - Botunuza DM gönderin, sonra `openclaw logs --follow` çalıştırın ve `from.id` değerini okuyun.

    Resmî Bot API:

    - Botunuza DM gönderin, sonra `https://api.telegram.org/bot<bot_token>/getUpdates` çağrısını yapın ve `message.from.id` değerini okuyun.

    Üçüncü taraf (daha az özel):

    - `@userinfobot` veya `@getidsbot`’a DM gönderin.

    Bkz. [/channels/telegram](/tr/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Birden fazla kişi farklı OpenClaw örnekleriyle tek bir WhatsApp numarasını kullanabilir mi?">
    Evet, **çoklu aracı yönlendirme** ile. Her gönderenin WhatsApp **DM**’sini (peer `kind: "direct"`, gönderen E.164 biçiminde ör. `+15551234567`) farklı bir `agentId`’ye bağlayın; böylece her kişinin kendi çalışma alanı ve oturum deposu olur. Yanıtlar yine **aynı WhatsApp hesabından** gelir ve DM erişim denetimi (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) WhatsApp hesabı başına genel kalır. Bkz. [Multi-Agent Routing](/tr/concepts/multi-agent) ve [WhatsApp](/tr/channels/whatsapp).
  </Accordion>

  <Accordion title='Bir "hızlı sohbet" aracısı ve bir "kodlama için Opus" aracısı çalıştırabilir miyim?'>
    Evet. Çoklu aracı yönlendirme kullanın: her aracıya kendi varsayılan modelini verin, sonra gelen rotaları (sağlayıcı hesabı veya belirli peer’ler) her aracıya bağlayın. Örnek config [Multi-Agent Routing](/tr/concepts/multi-agent) içinde yer alır. Ayrıca bkz. [Models](/tr/concepts/models) ve [Configuration](/tr/gateway/configuration).
  </Accordion>

  <Accordion title="Homebrew Linux üzerinde çalışır mı?">
    Evet. Homebrew Linux’u destekler (Linuxbrew). Hızlı kurulum:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    OpenClaw’ı systemd ile çalıştırıyorsanız, login olmayan kabuklarda `brew` ile kurulan araçların çözülebilmesi için servis PATH’inin `/home/linuxbrew/.linuxbrew/bin` (veya brew önekiniz) içerdiğinden emin olun.
    Son derlemeler ayrıca Linux systemd servislerinde yaygın kullanıcı bin dizinlerini öne ekler (örneğin `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) ve ayarlıysa `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` ve `FNM_DIR` değerlerine uyar.

  </Accordion>

  <Accordion title="Hacklenebilir git kurulumu ile npm install arasındaki fark">
    - **Hacklenebilir (git) kurulumu:** tam kaynak checkout’u, düzenlenebilir, katkı verenler için en iyisi.
      Derlemeleri yerelde çalıştırır ve kod/belgeleri yamalayabilirsiniz.
    - **npm install:** global CLI kurulumu, repo yok, “sadece çalıştır” için en iyisi.
      Güncellemeler npm dist-tag’lerinden gelir.

    Belgeler: [Getting started](/tr/start/getting-started), [Updating](/tr/install/updating).

  </Accordion>

  <Accordion title="Daha sonra npm ve git kurulumları arasında geçiş yapabilir miyim?">
    Evet. OpenClaw zaten kuruluysa `openclaw update --channel ...` kullanın.
    Bu **verilerinizi silmez** — yalnızca OpenClaw kod kurulumunu değiştirir.
    Durumunuz (`~/.openclaw`) ve çalışma alanınız (`~/.openclaw/workspace`) olduğu gibi kalır.

    npm’den git’e:

    ```bash
    openclaw update --channel dev
    ```

    Git’ten npm’e:

    ```bash
    openclaw update --channel stable
    ```

    Planlanan mod değişimini önce önizlemek için `--dry-run` ekleyin. Güncelleyici
    Doctor takip adımlarını çalıştırır, hedef kanal için Plugin kaynaklarını yeniler ve
    `--no-restart` vermezseniz Gateway’i yeniden başlatır.

    Yükleyici de her iki modu zorlayabilir:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Yedekleme ipuçları: bkz. [Yedekleme stratejisi](#diskte-neler-nerede-bulunur).

  </Accordion>

  <Accordion title="Gateway’i dizüstü bilgisayarımda mı yoksa bir VPS üzerinde mi çalıştırmalıyım?">
    Kısa yanıt: **7/24 güvenilirlik istiyorsanız VPS kullanın**. En düşük sürtünmeyi istiyorsanız
    ve uyku/yeniden başlatmalara razıysanız yerelde çalıştırın.

    **Dizüstü bilgisayar (yerel Gateway)**

    - **Artıları:** sunucu maliyeti yok, yerel dosyalara doğrudan erişim, canlı tarayıcı penceresi.
    - **Eksileri:** uyku/ağ kesintileri = bağlantı kopmaları, OS güncellemeleri/yeniden başlatmalar kesinti yaratır, uyanık kalması gerekir.

    **VPS / bulut**

    - **Artıları:** her zaman açık, kararlı ağ, dizüstü bilgisayar uyku sorunları yok, çalışır durumda tutmak daha kolay.
    - **Eksileri:** genellikle başsız çalışır (ekran görüntüsü kullanın), yalnızca uzak dosya erişimi vardır, güncellemeler için SSH gerekir.

    **OpenClaw’a özgü not:** WhatsApp/Telegram/Slack/Mattermost/Discord bir VPS üzerinde sorunsuz çalışır. Gerçek fark yalnızca **başsız tarayıcı** ile görünür pencere arasındadır. Bkz. [Browser](/tr/tools/browser).

    **Önerilen varsayılan:** Daha önce Gateway bağlantı kopmaları yaşadıysanız VPS. Yerel kurulum ise Mac’i aktif olarak kullanırken ve yerel dosya erişimi veya görünür bir tarayıcıyla UI otomasyonu istediğinizde harikadır.

  </Accordion>

  <Accordion title="OpenClaw’ı özel bir makinede çalıştırmak ne kadar önemli?">
    Zorunlu değil, ama **güvenilirlik ve yalıtım için önerilir**.

    - **Özel ana makine (VPS/Mac mini/Pi):** her zaman açık, daha az uyku/yeniden başlatma kesintisi, daha temiz izinler, çalışır durumda tutması daha kolay.
    - **Paylaşılan dizüstü/masaüstü:** test ve aktif kullanım için tamamen uygundur, ancak makine uyuduğunda veya güncellendiğinde duraklamalar bekleyin.

    Her iki dünyanın en iyisini istiyorsanız Gateway’i özel bir ana makinede tutun ve dizüstü bilgisayarınızı yerel ekran/kamera/exec araçları için bir **Node** olarak eşleştirin. Bkz. [Nodes](/tr/nodes).
    Güvenlik rehberi için [Security](/tr/gateway/security) sayfasını okuyun.

  </Accordion>

  <Accordion title="Asgari VPS gereksinimleri ve önerilen OS nedir?">
    OpenClaw hafiftir. Temel bir Gateway + bir sohbet kanalı için:

    - **Mutlak asgari:** 1 vCPU, 1GB RAM, ~500MB disk.
    - **Önerilen:** boşluk payı için 1-2 vCPU, 2GB RAM veya daha fazlası (günlükler, medya, birden çok kanal). Node araçları ve tarayıcı otomasyonu kaynak tüketebilir.

    OS: **Ubuntu LTS** kullanın (veya modern bir Debian/Ubuntu). Linux kurulum yolu en çok burada test edilir.

    Belgeler: [Linux](/tr/platforms/linux), [VPS hosting](/tr/vps).

  </Accordion>

  <Accordion title="OpenClaw’ı bir VM içinde çalıştırabilir miyim ve gereksinimler nelerdir?">
    Evet. Bir VM’yi VPS ile aynı şekilde değerlendirin: her zaman açık olmalı, erişilebilir olmalı ve
    Gateway ile etkinleştirdiğiniz kanallar için yeterli RAM’e sahip olmalıdır.

    Temel rehber:

    - **Mutlak asgari:** 1 vCPU, 1GB RAM.
    - **Önerilen:** birden çok kanal, tarayıcı otomasyonu veya medya araçları çalıştırıyorsanız 2GB RAM veya daha fazlası.
    - **OS:** Ubuntu LTS veya başka bir modern Debian/Ubuntu.

    Windows kullanıyorsanız, **WSL2 en kolay VM tarzı kurulumdur** ve en iyi araç uyumluluğunu
    sunar. Bkz. [Windows](/tr/platforms/windows), [VPS hosting](/tr/vps).
    macOS’u bir VM içinde çalıştırıyorsanız bkz. [macOS VM](/tr/install/macos-vm).

  </Accordion>
</AccordionGroup>

## İlgili

- [FAQ](/tr/help/faq) — ana SSS (modeller, oturumlar, Gateway, güvenlik ve daha fazlası)
- [Install overview](/tr/install)
- [Getting started](/tr/start/getting-started)
- [Troubleshooting](/tr/help/troubleshooting)

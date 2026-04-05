---
read_when:
    - Yaygın kurulum, yükleme, onboarding veya çalışma zamanı destek sorularını yanıtlarken
    - Kullanıcı tarafından bildirilen sorunları daha derin hata ayıklamadan önce triyaj ederken
summary: OpenClaw kurulumu, yapılandırması ve kullanımı hakkında sık sorulan sorular
title: SSS
x-i18n:
    generated_at: "2026-04-05T14:18:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f71dc12f60aceaa1d095aaa4887d59ecf2a53e349d10a3e2f60e464ae48aff6
    source_path: help/faq.md
    workflow: 15
---

# SSS

Gerçek dünya kurulumları için hızlı yanıtlar ve daha derin sorun giderme (yerel geliştirme, VPS, çoklu ajan, OAuth/API anahtarları, model devretme). Çalışma zamanı tanılamaları için [Sorun Giderme](/tr/gateway/troubleshooting) bölümüne bakın. Tam yapılandırma başvurusu için [Yapılandırma](/tr/gateway/configuration) bölümüne bakın.

## Bir şey bozuksa ilk 60 saniye

1. **Hızlı durum (ilk kontrol)**

   ```bash
   openclaw status
   ```

   Hızlı yerel özet: işletim sistemi + güncelleme, ağ geçidi/hizmet erişilebilirliği, ajanlar/oturumlar, sağlayıcı yapılandırması + çalışma zamanı sorunları (ağ geçidine erişilebildiğinde).

2. **Paylaşması güvenli rapor**

   ```bash
   openclaw status --all
   ```

   Günlük sonu ile salt okunur teşhis (jetonlar gizlenir).

3. **Daemon + port durumu**

   ```bash
   openclaw gateway status
   ```

   Yönetici çalışma zamanı ile RPC erişilebilirliğini, hedef sorgu URL’sini ve hizmetin muhtemelen hangi yapılandırmayı kullandığını gösterir.

4. **Derin sorgular**

   ```bash
   openclaw status --deep
   ```

   Desteklendiğinde kanal sorguları da dahil olmak üzere canlı bir ağ geçidi sağlık sorgusu çalıştırır
   (erişilebilir bir ağ geçidi gerektirir). [Sağlık](/tr/gateway/health) bölümüne bakın.

5. **En son günlüğü izle**

   ```bash
   openclaw logs --follow
   ```

   RPC kapalıysa şuna dönün:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Dosya günlükleri hizmet günlüklerinden ayrıdır; [Günlükleme](/tr/logging) ve [Sorun Giderme](/tr/gateway/troubleshooting) bölümlerine bakın.

6. **Doctor çalıştırın (onarım)**

   ```bash
   openclaw doctor
   ```

   Yapılandırma/durumu onarır veya taşır + sağlık kontrolleri çalıştırır. [Doctor](/tr/gateway/doctor) bölümüne bakın.

7. **Ağ geçidi anlık görüntüsü**

   ```bash
   openclaw health --json
   openclaw health --verbose   # hatalarda hedef URL + yapılandırma yolunu gösterir
   ```

   Çalışan ağ geçidinden tam anlık görüntü ister (yalnızca WS). [Sağlık](/tr/gateway/health) bölümüne bakın.

## Hızlı başlangıç ve ilk çalıştırma kurulumu

<AccordionGroup>
  <Accordion title="Takıldım, en hızlı şekilde nasıl kurtulurum?">
    **Makinenizi görebilen** yerel bir AI ajanı kullanın. Bu, Discord’da sormaktan çok daha etkilidir;
    çünkü “takıldım” durumlarının çoğu, uzaktaki yardımcıların inceleyemeyeceği **yerel yapılandırma veya ortam sorunlarıdır**.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Bu araçlar depoyu okuyabilir, komut çalıştırabilir, günlükleri inceleyebilir ve makine düzeyindeki
    kurulumunuzu düzeltmenize yardımcı olabilir (PATH, hizmetler, izinler, kimlik doğrulama dosyaları).
    Onlara tam kaynak ödeme işlemini hacklenebilir (git) kurulum üzerinden verin:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Bu, OpenClaw’ı **bir git çalışma kopyasından** yükler; böylece ajan kodu + belgeleri okuyabilir ve
    çalıştırdığınız tam sürüm üzerinde düşünebilir. Daha sonra, yükleyiciyi `--install-method git`
    olmadan yeniden çalıştırarak her zaman kararlı sürüme geri dönebilirsiniz.

    İpucu: ajandan düzeltmeyi **planlamasını ve denetlemesini** isteyin (adım adım), ardından yalnızca
    gerekli komutları yürütün. Bu, değişiklikleri küçük tutar ve denetlenmesini kolaylaştırır.

    Gerçek bir hata veya düzeltme bulursanız lütfen bir GitHub issue açın veya bir PR gönderin:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Yardım isterken şu komutlarla başlayın (çıktıları paylaşın):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Ne yaptıkları:

    - `openclaw status`: ağ geçidi/ajan sağlığı + temel yapılandırmanın hızlı anlık görüntüsü.
    - `openclaw models status`: sağlayıcı kimlik doğrulaması + model kullanılabilirliğini kontrol eder.
    - `openclaw doctor`: yaygın yapılandırma/durum sorunlarını doğrular ve onarır.

    Diğer yararlı CLI kontrolleri: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Hızlı hata ayıklama döngüsü: [Bir şey bozuksa ilk 60 saniye](#bir-şey-bozuksa-ilk-60-saniye).
    Kurulum belgeleri: [Yükleme](/tr/install), [Yükleyici bayrakları](/tr/install/installer), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="Heartbeat atlayıp duruyor. Atlama nedenleri ne anlama geliyor?">
    Yaygın heartbeat atlama nedenleri:

    - `quiet-hours`: yapılandırılmış active-hours penceresinin dışında
    - `empty-heartbeat-file`: `HEARTBEAT.md` var ama yalnızca boş/başlık iskeleti içeriyor
    - `no-tasks-due`: `HEARTBEAT.md` görev modu etkin ama görev aralıklarının henüz hiçbiri zamanı gelmiş değil
    - `alerts-disabled`: tüm heartbeat görünürlüğü devre dışı (`showOk`, `showAlerts` ve `useIndicator` kapalı)

    Görev modunda, zamanı gelen zaman damgaları yalnızca gerçek bir heartbeat çalıştırması
    tamamlandıktan sonra ilerletilir. Atlanan çalıştırmalar görevleri tamamlanmış olarak işaretlemez.

    Belgeler: [Heartbeat](/tr/gateway/heartbeat), [Otomasyon ve Görevler](/tr/automation).

  </Accordion>

  <Accordion title="OpenClaw yüklemek ve kurmak için önerilen yol">
    Depo, kaynaktan çalıştırmayı ve onboarding kullanmayı önerir:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Sihirbaz UI varlıklarını da otomatik olarak oluşturabilir. Onboarding’den sonra genellikle Gateway’i **18789** portunda çalıştırırsınız.

    Kaynaktan (katkıda bulunanlar/geliştiriciler):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # ilk çalıştırmada UI bağımlılıklarını otomatik yükler
    openclaw onboard
    ```

    Henüz global kurulumunuz yoksa `pnpm openclaw onboard` ile çalıştırın.

  </Accordion>

  <Accordion title="Onboarding sonrası dashboard'u nasıl açarım?">
    Sihirbaz, onboarding’den hemen sonra tarayıcınızı temiz (jetonsuz) bir dashboard URL’si ile açar ve bağlantıyı özette de yazdırır. O sekmeyi açık tutun; açılmazsa, aynı makinede yazdırılan URL’yi kopyalayıp yapıştırın.
  </Accordion>

  <Accordion title="Dashboard'da localhost ve uzak erişimde nasıl kimlik doğrularım?">
    **Localhost (aynı makine):**

    - `http://127.0.0.1:18789/` adresini açın.
    - Paylaşılan gizli kimlik doğrulaması isterse, yapılandırılmış token veya parolayı Control UI ayarlarına yapıştırın.
    - Token kaynağı: `gateway.auth.token` (veya `OPENCLAW_GATEWAY_TOKEN`).
    - Parola kaynağı: `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`).
    - Henüz paylaşılan bir gizli yapılandırılmadıysa `openclaw doctor --generate-gateway-token` ile bir token üretin.

    **Localhost üzerinde değilse:**

    - **Tailscale Serve** (önerilen): bağlamayı loopback olarak tutun, `openclaw gateway --tailscale serve` çalıştırın, `https://<magicdns>/` adresini açın. `gateway.auth.allowTailscale` `true` ise kimlik başlıkları Control UI/WebSocket kimlik doğrulamasını karşılar (paylaşılan gizliyi yapıştırmak gerekmez, güvenilen ağ geçidi ana bilgisayarını varsayar); HTTP API’leri ise private-ingress `none` veya trusted-proxy HTTP auth’ı kasıtlı olarak kullanmadığınız sürece yine paylaşılan gizli kimlik doğrulaması gerektirir.
      Aynı istemciden gelen hatalı eşzamanlı Serve kimlik doğrulama girişimleri, başarısız kimlik doğrulama sınırlayıcısı kayda geçmeden önce sıralanır; bu yüzden ikinci hatalı deneme bile zaten `retry later` gösterebilir.
    - **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` çalıştırın (veya parola kimlik doğrulamasını yapılandırın), `http://<tailscale-ip>:18789/` adresini açın, sonra dashboard ayarlarına eşleşen paylaşılan gizliyi yapıştırın.
    - **Kimlik farkında reverse proxy**: Gateway’i loopback olmayan güvenilir bir proxy arkasında tutun, `gateway.auth.mode: "trusted-proxy"` yapılandırın, sonra proxy URL’sini açın.
    - **SSH tüneli**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, sonra `http://127.0.0.1:18789/` adresini açın. Tünel üzerinden de paylaşılan gizli kimlik doğrulaması geçerlidir; istenirse yapılandırılmış token veya parolayı yapıştırın.

    Bağlama modları ve kimlik doğrulama ayrıntıları için [Dashboard](/web/dashboard) ve [Web yüzeyleri](/web) bölümlerine bakın.

  </Accordion>

  <Accordion title="Sohbet onayları için neden iki exec onay yapılandırması var?">
    Farklı katmanları kontrol ederler:

    - `approvals.exec`: onay istemlerini sohbet hedeflerine iletir
    - `channels.<channel>.execApprovals`: o kanalın exec onayları için yerel bir onay istemcisi gibi davranmasını sağlar

    Ana bilgisayar exec ilkesi hâlâ gerçek onay kapısıdır. Sohbet yapılandırması yalnızca onay
    istemlerinin nerede görüneceğini ve insanların nasıl yanıt verebileceğini kontrol eder.

    Çoğu kurulumda **ikisinin de** gerekli olması gerekmez:

    - Sohbet zaten komutları ve yanıtları destekliyorsa, aynı sohbette `/approve` ortak yol üzerinden çalışır.
    - Desteklenen bir yerel kanal onaylayanları güvenli biçimde çıkarabiliyorsa, OpenClaw artık `channels.<channel>.execApprovals.enabled` ayarsız veya `"auto"` olduğunda DM öncelikli yerel onayları otomatik etkinleştirir.
    - Yerel onay kartları/düğmeleri mevcut olduğunda, asıl yol bu yerel UI’dır; araç sonucu sohbet onaylarının kullanılamadığını veya tek yolun manuel onay olduğunu söylemediği sürece ajan yalnızca manuel `/approve` komutunu eklemelidir.
    - İstemlerin ayrıca diğer sohbetlere veya açık operasyon odalarına iletilmesi gerekiyorsa yalnızca `approvals.exec` kullanın.
    - Onay istemlerinin kaynak oda/konuya geri gönderilmesini özellikle istiyorsanız yalnızca `channels.<channel>.execApprovals.target: "channel"` veya `"both"` kullanın.
    - Plugin onayları yine ayrıdır: varsayılan olarak aynı sohbette `/approve`, isteğe bağlı `approvals.plugin` iletimi kullanırlar ve yalnızca bazı yerel kanallar buna ek olarak plugin-onay-yerel işleme katmanını korur.

    Kısa sürüm: iletme yönlendirme içindir, yerel istemci yapılandırması ise daha zengin kanala özgü UX içindir.
    [Exec Onayları](/tr/tools/exec-approvals) bölümüne bakın.

  </Accordion>

  <Accordion title="Hangi çalışma zamanına ihtiyacım var?">
    Node **>= 22** gereklidir. `pnpm` önerilir. Gateway için Bun **önerilmez**.
  </Accordion>

  <Accordion title="Raspberry Pi üzerinde çalışıyor mu?">
    Evet. Gateway hafiftir - belgelerde kişisel kullanım için **512MB-1GB RAM**, **1 çekirdek** ve yaklaşık **500MB**
    disk yeterli olarak listelenir ve bir **Raspberry Pi 4’ün bunu çalıştırabileceği** belirtilir.

    Ek boşluk istiyorsanız (günlükler, medya, diğer hizmetler), **2GB önerilir**,
    ancak bu katı bir alt sınır değildir.

    İpucu: küçük bir Pi/VPS Gateway’i barındırabilir ve dizüstü bilgisayarınız/telefonunuz üzerinde
    yerel ekran/kamera/canvas veya komut yürütme için **nodes** eşleştirebilirsiniz. [Nodes](/tr/nodes) bölümüne bakın.

  </Accordion>

  <Accordion title="Raspberry Pi kurulumları için ipuçları var mı?">
    Kısa sürüm: çalışır, ama pürüzler bekleyin.

    - **64 bit** bir işletim sistemi kullanın ve Node sürümünü >= 22 tutun.
    - Günlükleri görebilmek ve hızlı güncellemek için **hacklenebilir (git) kurulumu** tercih edin.
    - Kanallar/Skills olmadan başlayın, sonra onları tek tek ekleyin.
    - Garip ikili dosya sorunları yaşarsanız, bu genellikle bir **ARM uyumluluk** sorunudur.

    Belgeler: [Linux](/tr/platforms/linux), [Yükleme](/tr/install).

  </Accordion>

  <Accordion title="wake up my friend ekranında takılı kaldı / onboarding açılmıyor. Ne yapmalıyım?">
    Bu ekran, Gateway’e erişilebilir ve kimliği doğrulanmış olmasına bağlıdır. TUI ayrıca
    ilk açılışta otomatik olarak "Wake up, my friend!" gönderir. Bu satırı **yanıt olmadan**
    görüyorsanız ve tokenlar 0’da kalıyorsa, ajan hiç çalışmamıştır.

    1. Gateway’i yeniden başlatın:

    ```bash
    openclaw gateway restart
    ```

    2. Durum + kimlik doğrulamasını kontrol edin:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Hâlâ takılıyorsa şunu çalıştırın:

    ```bash
    openclaw doctor
    ```

    Gateway uzaktaysa, tünel/Tailscale bağlantısının açık olduğundan ve UI’ın
    doğru Gateway’e baktığından emin olun. [Uzak erişim](/tr/gateway/remote) bölümüne bakın.

  </Accordion>

  <Accordion title="Kurulumu yeni bir makineye (Mac mini) onboarding'i tekrar yapmadan taşıyabilir miyim?">
    Evet. **Durum dizinini** ve **çalışma alanını** kopyalayın, ardından Doctor’ı bir kez çalıştırın. Bu,
    **her iki** konumu da kopyaladığınız sürece botunuzu “tam olarak aynı” (bellek, oturum geçmişi, kimlik doğrulama ve kanal
    durumu) tutar:

    1. Yeni makineye OpenClaw yükleyin.
    2. Eski makineden `$OPENCLAW_STATE_DIR` dizinini (varsayılan: `~/.openclaw`) kopyalayın.
    3. Çalışma alanınızı kopyalayın (varsayılan: `~/.openclaw/workspace`).
    4. `openclaw doctor` çalıştırın ve Gateway hizmetini yeniden başlatın.

    Bu, yapılandırmayı, kimlik doğrulama profillerini, WhatsApp kimlik bilgilerini, oturumları ve belleği korur. Eğer
    uzak moddaysanız, oturum deposu ve çalışma alanı gateway ana bilgisayarına aittir.

    **Önemli:** çalışma alanınızı yalnızca GitHub’a commit/push ederseniz,
    **bellek + bootstrap dosyalarını** yedeklemiş olursunuz, ama **oturum geçmişini veya kimlik doğrulamayı**
    değil. Bunlar `~/.openclaw/` altında yaşar (örneğin `~/.openclaw/agents/<agentId>/sessions/`).

    İlgili: [Taşıma](/tr/install/migrating), [Diskte neler nerede yaşar](#diskte-neler-nerede-yaşar),
    [Ajan çalışma alanı](/tr/concepts/agent-workspace), [Doctor](/tr/gateway/doctor),
    [Uzak mod](/tr/gateway/remote).

  </Accordion>

  <Accordion title="En son sürümde nelerin yeni olduğunu nerede görebilirim?">
    GitHub changelog’una bakın:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    En yeni girdiler üsttedir. En üst bölüm **Unreleased** olarak işaretliyse, bir sonraki tarihli
    bölüm yayımlanmış en son sürümdür. Girdiler **Highlights**, **Changes** ve
    **Fixes** altında gruplanır (gerektiğinde docs/other bölümleri de olur).

  </Accordion>

  <Accordion title="docs.openclaw.ai erişilemiyor (SSL hatası)">
    Bazı Comcast/Xfinity bağlantıları `docs.openclaw.ai` sitesini Xfinity
    Advanced Security üzerinden yanlışlıkla engeller. Bunu devre dışı bırakın veya `docs.openclaw.ai` sitesini izin listesine ekleyin, sonra tekrar deneyin.
    Lütfen şurada bildirerek engelin kaldırılmasına yardımcı olun: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Siteye hâlâ erişemiyorsanız, belgeler GitHub üzerinde yansılanmıştır:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Kararlı ve beta arasındaki fark">
    **Stable** ve **beta**, ayrı kod hatları değil **npm dist-tag** etiketleridir:

    - `latest` = stable
    - `beta` = test için erken derleme

    Genellikle bir kararlı sürüm önce **beta**’ya gelir, sonra açık bir
    yükseltme adımı aynı sürümü `latest`’e taşır. Bakımcılar gerektiğinde
    doğrudan `latest`’e de yayımlayabilir. Bu yüzden beta ve stable, yükseltmeden sonra
    **aynı sürümü** gösterebilir.

    Nelerin değiştiğini görün:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Tek satırlık kurulum komutları ve beta ile dev arasındaki fark için aşağıdaki akordeona bakın.

  </Accordion>

  <Accordion title="Beta sürümü nasıl yüklerim ve beta ile dev arasındaki fark nedir?">
    **Beta**, npm dist-tag `beta`’dır (`latest` ile yükseltmeden sonra eşleşebilir).
    **Dev**, `main` dalının hareketli başıdır (git); yayımlandığında npm dist-tag `dev` kullanır.

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

    Bu, sizi `main` dalına geçirir ve kaynaktan günceller.

    2. **Hacklenebilir kurulum (yükleyici sitesinden):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Bu, size düzenleyebileceğiniz yerel bir repo verir; daha sonra git üzerinden güncelleyebilirsiniz.

    Daha temiz bir clone’u elle tercih ederseniz şunu kullanın:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Belgeler: [Güncelle](/cli/update), [Geliştirme kanalları](/tr/install/development-channels),
    [Yükleme](/tr/install).

  </Accordion>

  <Accordion title="Yükleme ve onboarding genelde ne kadar sürer?">
    Kabaca rehber:

    - **Yükleme:** 2-5 dakika
    - **Onboarding:** yapılandırdığınız kanal/model sayısına bağlı olarak 5-15 dakika

    Takılırsa [Yükleyici takıldı](#hızlı-başlangıç-ve-ilk-çalıştırma-kurulumu)
    ve [Takıldım](#hızlı-başlangıç-ve-ilk-çalıştırma-kurulumu) içindeki hızlı hata ayıklama döngüsünü kullanın.

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
    # install.ps1 için henüz ayrılmış bir -Verbose bayrağı yok.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Daha fazla seçenek: [Yükleyici bayrakları](/tr/install/installer).

  </Accordion>

  <Accordion title="Windows kurulumunda git not found veya openclaw not recognized hatası alıyorum">
    İki yaygın Windows sorunu:

    **1) npm error spawn git / git not found**

    - **Git for Windows** yükleyin ve `git`’in PATH üzerinde olduğundan emin olun.
    - PowerShell’i kapatıp yeniden açın, sonra yükleyiciyi yeniden çalıştırın.

    **2) Kurulumdan sonra openclaw tanınmıyor**

    - npm global bin klasörünüz PATH üzerinde değil.
    - Yolu kontrol edin:

      ```powershell
      npm config get prefix
      ```

    - O dizini kullanıcı PATH’inize ekleyin (Windows’ta `\bin` son eki gerekmez; çoğu sistemde `%AppData%\npm` olur).
    - PATH’i güncelledikten sonra PowerShell’i kapatıp yeniden açın.

    En sorunsuz Windows kurulumu için yerel Windows yerine **WSL2** kullanın.
    Belgeler: [Windows](/tr/platforms/windows).

  </Accordion>

  <Accordion title="Windows exec çıktısında Çince metin bozuk görünüyor - ne yapmalıyım?">
    Bu genellikle yerel Windows kabuklarında bir konsol kod sayfası uyumsuzluğudur.

    Belirtiler:

    - `system.run`/`exec` çıktısı Çince’yi bozuk karakterlerle gösterir
    - Aynı komut başka bir terminal profilinde düzgün görünür

    PowerShell’de hızlı geçici çözüm:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Sonra Gateway’i yeniden başlatın ve komutunuzu yeniden deneyin:

    ```powershell
    openclaw gateway restart
    ```

    Bunu hâlâ en son OpenClaw sürümünde yeniden üretebiliyorsanız, şurada izleyin/bildirin:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Belgeler soruma yanıt vermedi - daha iyi bir yanıtı nasıl alırım?">
    Tam kaynak ve belgeler yerelde olsun diye **hacklenebilir (git) kurulum** kullanın, sonra
    botunuza (veya Claude/Codex’e) _o klasörden_ sorun ki depoyu okuyup net yanıt verebilsin.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Daha fazla ayrıntı: [Yükleme](/tr/install) ve [Yükleyici bayrakları](/tr/install/installer).

  </Accordion>

  <Accordion title="OpenClaw'ı Linux'ta nasıl yüklerim?">
    Kısa yanıt: Linux rehberini izleyin, sonra onboarding çalıştırın.

    - Linux hızlı yol + hizmet kurulumu: [Linux](/tr/platforms/linux).
    - Tam adım adım rehber: [Başlarken](/tr/start/getting-started).
    - Yükleyici + güncellemeler: [Yükleme ve güncellemeler](/tr/install/updating).

  </Accordion>

  <Accordion title="OpenClaw'ı bir VPS üzerinde nasıl yüklerim?">
    Her Linux VPS çalışır. Sunucuya kurun, sonra Gateway’e erişmek için SSH/Tailscale kullanın.

    Rehberler: [exe.dev](/tr/install/exe-dev), [Hetzner](/tr/install/hetzner), [Fly.io](/tr/install/fly).
    Uzak erişim: [Gateway remote](/tr/gateway/remote).

  </Accordion>

  <Accordion title="Bulut/VPS kurulum rehberleri nerede?">
    Yaygın sağlayıcılar için bir **barındırma merkezi** tutuyoruz. Birini seçin ve rehberi izleyin:

    - [VPS hosting](/vps) (tüm sağlayıcılar tek yerde)
    - [Fly.io](/tr/install/fly)
    - [Hetzner](/tr/install/hetzner)
    - [exe.dev](/tr/install/exe-dev)

    Bulutta nasıl çalışır: **Gateway sunucuda çalışır**, siz de ona
    dizüstü bilgisayarınızdan/telefonunuzdan Control UI (veya Tailscale/SSH) ile erişirsiniz. Durumunuz + çalışma alanınız
    sunucuda yaşar; bu yüzden ana makineyi doğruluk kaynağı olarak kabul edin ve yedekleyin.

    Yerel ekran/kamera/canvas erişmek veya dizüstü bilgisayarınızda komut çalıştırmak için, Gateway’i
    bulutta tutarken o bulut Gateway ile **nodes** (Mac/iOS/Android/headless) eşleştirebilirsiniz.

    Merkez: [Platformlar](/tr/platforms). Uzak erişim: [Gateway remote](/tr/gateway/remote).
    Nodes: [Nodes](/tr/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="OpenClaw'dan kendini güncellemesini isteyebilir miyim?">
    Kısa yanıt: **mümkün, ama önerilmez**. Güncelleme akışı
    Gateway’i yeniden başlatabilir (bu da etkin oturumu düşürür), temiz bir git checkout’u
    gerektirebilir ve onay isteyebilir. Daha güvenli olanı: güncellemeleri operatör olarak kabuktan çalıştırmaktır.

    CLI kullanın:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Bir ajan üzerinden otomatikleştirmeniz gerekiyorsa:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Belgeler: [Güncelle](/cli/update), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="Onboarding gerçekte ne yapıyor?">
    `openclaw onboard` önerilen kurulum yoludur. **Yerel modda** size şunlarda yol gösterir:

    - **Model/kimlik doğrulama kurulumu** (sağlayıcı OAuth, Claude CLI yeniden kullanımı ve API anahtarları desteklenir; ayrıca LM Studio gibi yerel model seçenekleri)
    - **Çalışma alanı** konumu + bootstrap dosyaları
    - **Gateway ayarları** (bind/port/auth/tailscale)
    - **Kanallar** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage ve QQ Bot gibi paketlenmiş kanal plugin’leri)
    - **Daemon kurulumu** (macOS’ta LaunchAgent; Linux/WSL2’de systemd kullanıcı birimi)
    - **Sağlık kontrolleri** ve **Skills** seçimi

    Ayrıca yapılandırdığınız model bilinmiyorsa veya kimlik doğrulaması eksikse uyarır.

  </Accordion>

  <Accordion title="Bunu çalıştırmak için Claude veya OpenAI aboneliğine ihtiyacım var mı?">
    Hayır. OpenClaw’ı **API anahtarları** (Anthropic/OpenAI/diğerleri) ile veya
    verileriniz cihazınızda kalsın diye **yalnızca yerel modellerle** çalıştırabilirsiniz. Abonelikler (Claude
    Pro/Max veya OpenAI Codex) bu sağlayıcılarla kimlik doğrulamak için isteğe bağlı yollardır.

    Claude Code CLI geri dönüşünün, Anthropic’in genel CLI belgelerine göre
    yerel, kullanıcı tarafından yönetilen otomasyon için muhtemelen izinli olduğuna inanıyoruz. Ancak,
    Anthropic’in üçüncü taraf harness politikası, dış ürünlerde abonelik destekli kullanım
    konusunda yeterince belirsizlik yarattığı için bunu üretim için önermiyoruz.
    Anthropic ayrıca **4 Nisan 2026
    saat 12:00 PM PT / 8:00 PM BST** tarihinde OpenClaw kullanıcılarına,
    **OpenClaw** Claude giriş yolunun üçüncü taraf harness kullanımı sayıldığını
    ve artık abonelikten ayrı faturalanan **Extra Usage**
    gerektirdiğini bildirdi. OpenAI Codex OAuth ise OpenClaw gibi
    dış araçlar için açıkça desteklenmektedir.

    OpenClaw ayrıca diğer barındırılan abonelik tarzı seçenekleri de destekler:
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** ve
    **Z.AI / GLM Coding Plan**.

    Belgeler: [Anthropic](/tr/providers/anthropic), [OpenAI](/tr/providers/openai),
    [Qwen Cloud](/tr/providers/qwen),
    [MiniMax](/tr/providers/minimax), [GLM Models](/tr/providers/glm),
    [Yerel modeller](/tr/gateway/local-models), [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="Claude Max aboneliğini API anahtarı olmadan kullanabilir miyim?">
    Evet, gateway ana bilgisayarında yerel bir **Claude CLI** girişi üzerinden.

    Claude Pro/Max abonelikleri **API anahtarı içermez**, bu nedenle Claude CLI
    yeniden kullanımı OpenClaw’da yerel geri dönüş yoludur. Claude Code CLI
    geri dönüşünün, Anthropic’in genel CLI belgelerine göre yerel, kullanıcı tarafından yönetilen
    otomasyon için muhtemelen izinli olduğuna inanıyoruz. Ancak Anthropic’in üçüncü taraf harness
    politikası, dış
    ürünlerde abonelik destekli kullanım konusunda yeterince belirsizlik yarattığı için bunu üretim için önermiyoruz.
    Bunun yerine Anthropic API anahtarlarını öneriyoruz.

  </Accordion>

  <Accordion title="Claude abonelik kimlik doğrulamasını (Claude Pro veya Max) destekliyor musunuz?">
    Evet. Gateway ana bilgisayarında yerel bir **Claude CLI** girişini `openclaw models auth login --provider anthropic --method cli --set-default` ile yeniden kullanın.

    Anthropic setup-token da artık yeniden eski/manual bir OpenClaw yolu olarak mevcut. Anthropic’in OpenClaw’e özel faturalandırma bildirimi burada da geçerlidir; bu yüzden Anthropic’in **Extra Usage** gerektirdiği beklentisiyle kullanın. [Anthropic](/tr/providers/anthropic) ve [OAuth](/tr/concepts/oauth) bölümlerine bakın.

    Önemli: Claude Code CLI geri dönüşünün, Anthropic’in genel CLI belgelerine göre yerel,
    kullanıcı tarafından yönetilen otomasyon için muhtemelen izinli olduğuna inanıyoruz. Ancak,
    Anthropic’in üçüncü taraf harness politikası, dış ürünlerde abonelik destekli kullanım
    konusunda yeterince belirsizlik yaratmaktadır; bu nedenle bunu üretim için önermiyoruz.
    Anthropic ayrıca **4 Nisan 2026 saat
    12:00 PM PT / 8:00 PM BST** tarihinde OpenClaw kullanıcılarına,
    **OpenClaw** Claude giriş yolunun,
    abonelikten ayrı faturalanan **Extra Usage** gerektirdiğini söyledi.

    Üretim veya çok kullanıcılı iş yükleri için, Anthropic API anahtarı ile kimlik doğrulama
    daha güvenli ve önerilen seçimdir. OpenClaw’da başka abonelik tarzı barındırılan
    seçenekler istiyorsanız [OpenAI](/tr/providers/openai), [Qwen / Model
    Cloud](/tr/providers/qwen), [MiniMax](/tr/providers/minimax) ve
    [GLM Models](/tr/providers/glm) bölümlerine bakın.

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Anthropic'ten neden HTTP 429 rate_limit_error görüyorum?">
Bu, geçerli pencere için **Anthropic kotanızın/oran sınırınızın** tükendiği anlamına gelir. Eğer
**Claude CLI** kullanıyorsanız pencerenin sıfırlanmasını bekleyin veya planınızı yükseltin. Eğer
bir **Anthropic API anahtarı** kullanıyorsanız, kullanım/faturalama için Anthropic Console’u
kontrol edin ve gerekirse limitleri yükseltin.

    Mesaj özellikle şu ise:
    `Extra usage is required for long context requests`, istek
    Anthropic’in 1M bağlam beta özelliğini (`context1m: true`) kullanmaya çalışıyordur. Bu yalnızca
    kimlik bilgileriniz uzun bağlam faturalandırmasına uygunsa çalışır (API anahtarı faturalandırması veya
    Extra Usage etkinleştirilmiş OpenClaw Claude giriş yolu).

    İpucu: bir sağlayıcı oran sınırına takıldığında OpenClaw’ın yanıt vermeye devam edebilmesi için
    bir **yedek model** ayarlayın.
    [Models](/cli/models), [OAuth](/tr/concepts/oauth) ve
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/tr/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context) bölümlerine bakın.

  </Accordion>

  <Accordion title="AWS Bedrock destekleniyor mu?">
    Evet. OpenClaw, paketlenmiş bir **Amazon Bedrock (Converse)** sağlayıcısına sahiptir. AWS ortam işaretçileri mevcutsa OpenClaw, akış/metin Bedrock kataloğunu otomatik olarak keşfedip bunu örtük bir `amazon-bedrock` sağlayıcısı olarak birleştirebilir; aksi halde `plugins.entries.amazon-bedrock.config.discovery.enabled` ayarını açıkça etkinleştirebilir veya el ile bir sağlayıcı girdisi ekleyebilirsiniz. [Amazon Bedrock](/tr/providers/bedrock) ve [Model providers](/tr/providers/models) bölümlerine bakın. Yönetilen bir anahtar akışını tercih ediyorsanız, Bedrock önünde OpenAI uyumlu bir proxy kullanmak da geçerli bir seçenektir.
  </Accordion>

  <Accordion title="Codex kimlik doğrulaması nasıl çalışır?">
    OpenClaw, OAuth (ChatGPT ile oturum açma) üzerinden **OpenAI Code (Codex)** destekler. Onboarding OAuth akışını çalıştırabilir ve uygun olduğunda varsayılan modeli `openai-codex/gpt-5.4` olarak ayarlar. [Model providers](/tr/concepts/model-providers) ve [Onboarding (CLI)](/tr/start/wizard) bölümlerine bakın.
  </Accordion>

  <Accordion title="OpenAI abonelik kimlik doğrulamasını (Codex OAuth) destekliyor musunuz?">
    Evet. OpenClaw, **OpenAI Code (Codex) abonelik OAuth** desteğini tam olarak sunar.
    OpenAI, OpenClaw gibi dış araçlar/iş akışlarında abonelik OAuth kullanımına açıkça
    izin verir. Onboarding bu OAuth akışını sizin için çalıştırabilir.

    [OAuth](/tr/concepts/oauth), [Model providers](/tr/concepts/model-providers) ve [Onboarding (CLI)](/tr/start/wizard) bölümlerine bakın.

  </Accordion>

  <Accordion title="Gemini CLI OAuth'u nasıl kurarım?">
    Gemini CLI, `openclaw.json` içinde client id veya secret değil,
    **plugin auth flow** kullanır.

    Adımlar:

    1. `gemini` PATH üzerinde olacak şekilde Gemini CLI’yi yerel olarak yükleyin
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Plugin’i etkinleştirin: `openclaw plugins enable google`
    3. Giriş yapın: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Girişten sonraki varsayılan model: `google-gemini-cli/gemini-3.1-pro-preview`
    5. İstekler başarısız olursa gateway ana bilgisayarında `GOOGLE_CLOUD_PROJECT` veya `GOOGLE_CLOUD_PROJECT_ID` ayarlayın

    Bu, OAuth tokenlarını gateway ana bilgisayarındaki auth profillerinde saklar. Ayrıntılar: [Model providers](/tr/concepts/model-providers).

  </Accordion>

  <Accordion title="Gündelik sohbetler için yerel model uygun mu?">
    Genellikle hayır. OpenClaw geniş bağlam + güçlü güvenlik gerektirir; küçük kartlar keser ve sızdırır. Mecbursanız yerelde çalıştırabildiğiniz **en büyük** model derlemesini kullanın (LM Studio) ve [/gateway/local-models](/tr/gateway/local-models) bölümüne bakın. Daha küçük/kuantize modeller prompt injection riskini artırır - [Güvenlik](/tr/gateway/security) bölümüne bakın.
  </Accordion>

  <Accordion title="Barındırılan model trafiğini belirli bir bölgede nasıl tutarım?">
    Bölgeye sabitlenmiş uç noktaları seçin. OpenRouter, MiniMax, Kimi ve GLM için ABD barındırmalı seçenekler sunar; verileri bölgede tutmak için ABD barındırmalı varyantı seçin. Seçtiğiniz bölgesel sağlayıcıya uyarken geri dönüşlerin kullanılabilir kalması için yine de `models.mode: "merge"` kullanarak Anthropic/OpenAI’yı bunlarla birlikte listeleyebilirsiniz.
  </Accordion>

  <Accordion title="Bunu yüklemek için Mac Mini satın almak zorunda mıyım?">
    Hayır. OpenClaw macOS veya Linux üzerinde çalışır (Windows, WSL2 üzerinden). Mac mini isteğe bağlıdır - bazı insanlar
    onu her zaman açık bir ana bilgisayar olarak satın alır, ancak küçük bir VPS, ev sunucusu veya Raspberry Pi sınıfı kutu da çalışır.

    Yalnızca **macOS'a özel araçlar** için bir Mac gerekir. iMessage için [BlueBubbles](/tr/channels/bluebubbles) kullanın (önerilir) -
    BlueBubbles sunucusu herhangi bir Mac üzerinde çalışır, Gateway ise Linux’ta veya başka bir yerde çalışabilir. Başka macOS’a özel araçlar istiyorsanız Gateway’i bir Mac üzerinde çalıştırın veya bir macOS node eşleştirin.

    Belgeler: [BlueBubbles](/tr/channels/bluebubbles), [Nodes](/tr/nodes), [Mac remote mode](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="iMessage desteği için Mac mini gerekli mi?">
    Messages oturumu açılmış **bir macOS cihazına** ihtiyacınız var. Bunun mutlaka bir Mac mini olması gerekmez -
    herhangi bir Mac olur. iMessage için **[BlueBubbles](/tr/channels/bluebubbles)** kullanın (önerilir) - BlueBubbles sunucusu macOS üzerinde çalışırken Gateway Linux’ta veya başka bir yerde çalışabilir.

    Yaygın kurulumlar:

    - Gateway’i Linux/VPS üzerinde çalıştırın, BlueBubbles sunucusunu ise Messages oturumu açık herhangi bir Mac üzerinde çalıştırın.
    - En basit tek makine kurulumu istiyorsanız her şeyi Mac üzerinde çalıştırın.

    Belgeler: [BlueBubbles](/tr/channels/bluebubbles), [Nodes](/tr/nodes),
    [Mac remote mode](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="OpenClaw çalıştırmak için bir Mac mini alırsam, onu MacBook Pro'ya bağlayabilir miyim?">
    Evet. **Mac mini Gateway’i çalıştırabilir**, MacBook Pro’nuz ise
    **bir node** (yardımcı cihaz) olarak bağlanabilir. Nodes, Gateway’i çalıştırmaz -
    o cihazda ekran/kamera/canvas ve `system.run` gibi ek
    yetenekler sağlar.

    Yaygın düzen:

    - Gateway, Mac mini üzerinde (her zaman açık).
    - MacBook Pro, macOS uygulamasını veya node host’u çalıştırır ve Gateway ile eşleşir.
    - Bunu görmek için `openclaw nodes status` / `openclaw nodes list` kullanın.

    Belgeler: [Nodes](/tr/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Bun kullanabilir miyim?">
    Bun **önerilmez**. Özellikle WhatsApp ve Telegram ile çalışma zamanı hataları görüyoruz.
    Kararlı ağ geçitleri için **Node** kullanın.

    Yine de Bun ile deneme yapmak istiyorsanız, bunu WhatsApp/Telegram olmayan
    üretim dışı bir ağ geçidinde yapın.

  </Accordion>

  <Accordion title="Telegram: allowFrom içine ne yazılır?">
    `channels.telegram.allowFrom`, **insan gönderenin Telegram kullanıcı kimliğidir** (sayısal). Bot kullanıcı adı değildir.

    Onboarding `@username` girişini kabul eder ve bunu sayısal kimliğe çözer, ancak OpenClaw yetkilendirmesi yalnızca sayısal kimlikler kullanır.

    Daha güvenli (üçüncü taraf bot yok):

    - Botunuza DM atın, sonra `openclaw logs --follow` çalıştırın ve `from.id` değerini okuyun.

    Resmî Bot API:

    - Botunuza DM atın, sonra `https://api.telegram.org/bot<bot_token>/getUpdates` çağrısı yapın ve `message.from.id` değerini okuyun.

    Üçüncü taraf (daha az özel):

    - `@userinfobot` veya `@getidsbot` hesabına DM atın.

    [/channels/telegram](/tr/channels/telegram#access-control-and-activation) bölümüne bakın.

  </Accordion>

  <Accordion title="Birden fazla kişi tek bir WhatsApp numarasını farklı OpenClaw örnekleriyle kullanabilir mi?">
    Evet, **çoklu ajan yönlendirme** ile. Her gönderenin WhatsApp **DM**’ini (`kind: "direct"` eş, gönderen E.164 biçiminde `+15551234567`) farklı bir `agentId`’ye bağlayın; böylece her kişinin kendi çalışma alanı ve oturum deposu olur. Yanıtlar yine **aynı WhatsApp hesabından** gelir ve DM erişim denetimi (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) WhatsApp hesabı başına küreseldir. [Çoklu Ajan Yönlendirme](/tr/concepts/multi-agent) ve [WhatsApp](/tr/channels/whatsapp) bölümlerine bakın.
  </Accordion>

  <Accordion title='Bir "hızlı sohbet" ajanı ve bir "kodlama için Opus" ajanı çalıştırabilir miyim?'>
    Evet. Çoklu ajan yönlendirmeyi kullanın: her ajana kendi varsayılan modelini verin, sonra gelen yolları (sağlayıcı hesabı veya belirli eşler) her ajana bağlayın. Örnek yapılandırma [Çoklu Ajan Yönlendirme](/tr/concepts/multi-agent) içinde yer alır. Ayrıca [Models](/tr/concepts/models) ve [Yapılandırma](/tr/gateway/configuration) bölümlerine bakın.
  </Accordion>

  <Accordion title="Homebrew Linux'ta çalışır mı?">
    Evet. Homebrew Linux’u destekler (Linuxbrew). Hızlı kurulum:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    OpenClaw’ı systemd üzerinden çalıştırıyorsanız, hizmet PATH’inin `/home/linuxbrew/.linuxbrew/bin` (veya sizin brew önekiniz) içerdiğinden emin olun; böylece `brew` ile yüklenmiş araçlar giriş yapılmayan kabuklarda çözülebilir.
    Son derlemeler ayrıca Linux systemd hizmetlerinde yaygın kullanıcı bin dizinlerini (`~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin` gibi) başa ekler ve ayarlıysa `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` ve `FNM_DIR` değerlerine uyar.

  </Accordion>

  <Accordion title="Hacklenebilir git kurulumu ile npm install arasındaki fark">
    - **Hacklenebilir (git) kurulum:** tam kaynak checkout, düzenlenebilir, katkıda bulunanlar için en iyisi.
      Derlemeleri yerelde çalıştırırsınız ve kod/belgeleri yamalayabilirsiniz.
    - **npm install:** global CLI kurulumu, repo yok, “yalnızca çalıştırmak” için en iyisi.
      Güncellemeler npm dist-tag’lerden gelir.

    Belgeler: [Başlarken](/tr/start/getting-started), [Güncelleme](/tr/install/updating).

  </Accordion>

  <Accordion title="Daha sonra npm ve git kurulumları arasında geçiş yapabilir miyim?">
    Evet. Diğer türü yükleyin, sonra Doctor çalıştırarak gateway hizmetinin yeni giriş noktasına işaret etmesini sağlayın.
    Bu, **verilerinizi silmez** - yalnızca OpenClaw kod kurulumunu değiştirir. Durumunuz
    (`~/.openclaw`) ve çalışma alanınız (`~/.openclaw/workspace`) dokunulmadan kalır.

    npm’den git’e:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    git’ten npm’ye:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor, gateway hizmeti giriş noktası uyuşmazlığını tespit eder ve hizmet yapılandırmasını geçerli kurulumla eşleşecek şekilde yeniden yazmayı önerir (otomasyonda `--repair` kullanın).

    Yedekleme ipuçları: [Yedekleme stratejisi](#diskte-neler-nerede-yaşar) bölümüne bakın.

  </Accordion>

  <Accordion title="Gateway'i dizüstü bilgisayarımda mı yoksa bir VPS'te mi çalıştırmalıyım?">
    Kısa yanıt: **7/24 güvenilirlik istiyorsanız bir VPS kullanın**. En düşük sürtünmeyi istiyor
    ve uyku/yeniden başlatmalarla sorun yaşamıyorsanız, yerelde çalıştırın.

    **Dizüstü bilgisayar (yerel Gateway)**

    - **Artıları:** sunucu maliyeti yok, yerel dosyalara doğrudan erişim, canlı tarayıcı penceresi.
    - **Eksileri:** uyku/ağ kesintileri = bağlantı kopmaları, işletim sistemi güncellemeleri/yeniden başlatmalar kesinti yaratır, açık kalması gerekir.

    **VPS / bulut**

    - **Artıları:** her zaman açık, kararlı ağ, dizüstü bilgisayar uyku sorunları yok, çalışır durumda tutmak daha kolay.
    - **Eksileri:** genelde headless çalışır (ekran görüntüsü kullanın), yalnızca uzak dosya erişimi vardır, güncellemeler için SSH gerekir.

    **OpenClaw’a özgü not:** WhatsApp/Telegram/Slack/Mattermost/Discord bir VPS’ten gayet iyi çalışır. Tek gerçek ödünleşim **headless browser** ile görünür pencere arasındadır. [Browser](/tools/browser) bölümüne bakın.

    **Önerilen varsayılan:** Daha önce gateway bağlantı kopmaları yaşadıysanız VPS. Mac’i etkin kullanıyorsanız ve yerel dosya erişimi veya görünür tarayıcı ile UI otomasyonu istiyorsanız yerel kurulum harikadır.

  </Accordion>

  <Accordion title="OpenClaw'ı ayrılmış bir makinede çalıştırmak ne kadar önemli?">
    Gerekli değil, ama **güvenilirlik ve yalıtım için önerilir**.

    - **Ayrılmış ana makine (VPS/Mac mini/Pi):** her zaman açık, daha az uyku/yeniden başlatma kesintisi, daha temiz izinler, çalışır tutması daha kolay.
    - **Paylaşılan dizüstü/masaüstü:** test ve aktif kullanım için tamamen uygun, ancak makine uyuduğunda veya güncellendiğinde duraklamalar bekleyin.

    İki dünyanın en iyisini istiyorsanız, Gateway’i ayrılmış bir ana makinede tutun ve dizüstü bilgisayarınızı yerel ekran/kamera/exec araçları için bir **node** olarak eşleştirin. [Nodes](/tr/nodes) bölümüne bakın.
    Güvenlik rehberi için [Güvenlik](/tr/gateway/security) bölümünü okuyun.

  </Accordion>

  <Accordion title="Minimum VPS gereksinimleri ve önerilen işletim sistemi nedir?">
    OpenClaw hafiftir. Temel bir Gateway + bir sohbet kanalı için:

    - **Mutlak minimum:** 1 vCPU, 1GB RAM, ~500MB disk.
    - **Önerilen:** boşluk için 1-2 vCPU, 2GB RAM veya daha fazlası (günlükler, medya, birden fazla kanal). Node araçları ve tarayıcı otomasyonu kaynak tüketebilir.

    İşletim sistemi: **Ubuntu LTS** kullanın (veya modern bir Debian/Ubuntu). Linux kurulum yolu burada en iyi test edilmiştir.

    Belgeler: [Linux](/tr/platforms/linux), [VPS hosting](/vps).

  </Accordion>

  <Accordion title="OpenClaw'ı bir VM içinde çalıştırabilir miyim ve gereksinimler nelerdir?">
    Evet. Bir VM’e de tıpkı bir VPS gibi yaklaşın: her zaman açık olmalı, erişilebilir olmalı ve
    Gateway ile etkinleştirdiğiniz kanallar için yeterli RAM’e sahip olmalıdır.

    Temel rehber:

    - **Mutlak minimum:** 1 vCPU, 1GB RAM.
    - **Önerilen:** birden çok kanal, tarayıcı otomasyonu veya medya araçları kullanıyorsanız 2GB RAM veya daha fazlası.
    - **İşletim sistemi:** Ubuntu LTS veya başka modern bir Debian/Ubuntu.

    Windows kullanıyorsanız **en kolay VM tarzı kurulum WSL2**’dir ve araç uyumluluğu en iyisidir.
    [Windows](/tr/platforms/windows), [VPS hosting](/vps) bölümlerine bakın.
    macOS’u bir VM içinde çalıştırıyorsanız [macOS VM](/tr/install/macos-vm) bölümüne bakın.

  </Accordion>
</AccordionGroup>

## OpenClaw nedir?

<AccordionGroup>
  <Accordion title="Tek paragrafta OpenClaw nedir?">
    OpenClaw, kendi cihazlarınızda çalıştırdığınız kişisel bir AI asistandır. Zaten kullandığınız mesajlaşma yüzeylerinde (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat ve QQ Bot gibi paketlenmiş kanal plugin’leri) yanıt verir ve desteklenen platformlarda ses + canlı Canvas da yapabilir. **Gateway** her zaman açık kontrol düzlemidir; ürünün kendisi asistandır.
  </Accordion>

  <Accordion title="Değer önerisi">
    OpenClaw “yalnızca bir Claude sarmalayıcı” değildir. Bu, zaten kullandığınız sohbet uygulamalarından
    erişilebilir, durum bilgili oturumlar, bellek ve araçlarla **kendi donanımınızda**
    güçlü bir asistan çalıştırmanızı sağlayan **yerel öncelikli bir kontrol düzlemidir** -
    iş akışlarınızın kontrolünü barındırılan bir
    SaaS’a bırakmadan.

    Öne çıkanlar:

    - **Cihazlarınız, verileriniz:** Gateway’i istediğiniz yerde çalıştırın (Mac, Linux, VPS) ve
      çalışma alanını + oturum geçmişini yerel tutun.
    - **Gerçek kanallar, web sandbox’ı değil:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/vb.,
      ayrıca desteklenen platformlarda mobil ses ve Canvas.
    - **Modelden bağımsız:** Anthropic, OpenAI, MiniMax, OpenRouter vb. kullanın; ajan başına yönlendirme
      ve devretme ile.
    - **Yalnızca yerel seçenek:** İsterseniz **tüm verilerin cihazınızda kalması** için yerel modeller çalıştırın.
    - **Çoklu ajan yönlendirme:** kanal, hesap veya görev başına ayrı ajanlar; her biri kendi
      çalışma alanı ve varsayılanlarıyla.
    - **Açık kaynak ve hacklenebilir:** satıcıya kilitlenmeden inceleyin, genişletin ve kendiniz barındırın.

    Belgeler: [Gateway](/tr/gateway), [Kanallar](/tr/channels), [Çoklu ajan](/tr/concepts/multi-agent),
    [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="Yeni kurdum - önce ne yapmalıyım?">
    İyi ilk projeler:

    - Bir web sitesi oluşturun (WordPress, Shopify veya basit bir statik site).
    - Mobil uygulama prototipi oluşturun (taslak, ekranlar, API planı).
    - Dosya ve klasörleri düzenleyin (temizleme, adlandırma, etiketleme).
    - Gmail bağlayın ve özetleri veya takipleri otomatikleştirin.

    Büyük görevleri halledebilir, ancak bunları aşamalara ayırıp
    paralel çalışma için alt ajanlar kullandığınızda en iyi sonucu verir.

  </Accordion>

  <Accordion title="OpenClaw için en iyi beş günlük kullanım senaryosu nedir?">
    Günlük kazanımlar genelde şuna benzer:

    - **Kişisel brifingler:** gelen kutusu, takvim ve önemsediğiniz haberlerin özetleri.
    - **Araştırma ve taslak hazırlama:** e-postalar veya belgeler için hızlı araştırma, özetler ve ilk taslaklar.
    - **Hatırlatıcılar ve takipler:** cron veya heartbeat tabanlı dürtmeler ve kontrol listeleri.
    - **Tarayıcı otomasyonu:** formları doldurma, veri toplama ve web görevlerini tekrar etme.
    - **Cihazlar arası koordinasyon:** telefonunuzdan görev gönderin, Gateway bunu sunucuda çalıştırsın ve sonuç size sohbette geri gelsin.

  </Accordion>

  <Accordion title="OpenClaw, bir SaaS için lead gen, outreach, reklam ve blog işlerinde yardımcı olabilir mi?">
    **Araştırma, nitelendirme ve taslak hazırlama** için evet. Siteleri tarayabilir, kısa listeler oluşturabilir,
    potansiyel müşterileri özetleyebilir ve outreach veya reklam metni taslakları yazabilir.

    **Outreach veya reklam çalıştırma** için insanı döngüde tutun. Spam yapmaktan kaçının, yerel yasalara ve
    platform politikalarına uyun ve gönderilmeden önce her şeyi gözden geçirin. En güvenli düzen,
    OpenClaw’ın taslak hazırlaması ve sizin onaylamanızdır.

    Belgeler: [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Web geliştirme için Claude Code'a göre avantajları neler?">
    OpenClaw bir **kişisel asistan** ve koordinasyon katmanıdır, bir IDE yerine geçmez. Bir depoda
    en hızlı doğrudan kodlama döngüsü için Claude Code veya Codex kullanın. Kalıcı bellek,
    cihazlar arası erişim ve araç orkestrasyonu istediğinizde OpenClaw kullanın.

    Avantajlar:

    - Oturumlar arasında **kalıcı bellek + çalışma alanı**
    - **Çok platformlu erişim** (WhatsApp, Telegram, TUI, WebChat)
    - **Araç orkestrasyonu** (browser, dosyalar, planlama, hooks)
    - **Her zaman açık Gateway** (bir VPS üzerinde çalıştırın, her yerden etkileşin)
    - Yerel browser/ekran/kamera/exec için **Nodes**

    Vitrin: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills ve otomasyon

<AccordionGroup>
  <Accordion title="Depoyu kirletmeden Skills özelleştirmesini nasıl yaparım?">
    Depo kopyasını düzenlemek yerine yönetilen geçersiz kılmaları kullanın. Değişikliklerinizi `~/.openclaw/skills/<name>/SKILL.md` içine koyun (veya `~/.openclaw/openclaw.json` içinde `skills.load.extraDirs` üzerinden bir klasör ekleyin). Öncelik sırası `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → paketlenmiş → `skills.load.extraDirs` şeklindedir; bu yüzden yönetilen geçersiz kılmalar, git’e dokunmadan paketlenmiş skills üzerinde yine öncelik kazanır. Skill’in genel olarak yüklü olmasını ama yalnızca bazı ajanlar tarafından görünmesini istiyorsanız, ortak kopyayı `~/.openclaw/skills` altında tutun ve görünürlüğü `agents.defaults.skills` ve `agents.list[].skills` ile kontrol edin. Yalnızca upstream’e uygun düzenlemeler depoda yaşamalı ve PR olarak gönderilmelidir.
  </Accordion>

  <Accordion title="Skills'i özel bir klasörden yükleyebilir miyim?">
    Evet. `~/.openclaw/openclaw.json` içinde `skills.load.extraDirs` üzerinden ek dizinler ekleyin (en düşük öncelik). Varsayılan öncelik `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → paketlenmiş → `skills.load.extraDirs` şeklindedir. `clawhub` varsayılan olarak `./skills` içine kurar; OpenClaw bunu bir sonraki oturumda `<workspace>/skills` olarak ele alır. Skill yalnızca belirli ajanlar için görünür olmalıysa, bunu `agents.defaults.skills` veya `agents.list[].skills` ile eşleştirin.
  </Accordion>

  <Accordion title="Farklı görevler için farklı modelleri nasıl kullanabilirim?">
    Bugün desteklenen düzenler şunlardır:

    - **Cron işleri**: yalıtılmış işler, iş başına `model` geçersiz kılması ayarlayabilir.
    - **Alt ajanlar**: görevleri farklı varsayılan modellere sahip ayrı ajanlara yönlendirin.
    - **İsteğe bağlı geçiş**: geçerli oturum modelini istediğiniz zaman değiştirmek için `/model` kullanın.

    [Cron işleri](/tr/automation/cron-jobs), [Çoklu Ajan Yönlendirme](/tr/concepts/multi-agent) ve [Slash komutları](/tools/slash-commands) bölümlerine bakın.

  </Accordion>

  <Accordion title="Bot ağır iş yaparken donuyor. Bunu nasıl başka yere aktarırım?">
    Uzun veya paralel görevler için **alt ajanlar** kullanın. Alt ajanlar kendi oturumlarında çalışır,
    özet döndürür ve ana sohbetinizin yanıt vermeye devam etmesini sağlar.

    Botunuza “bu görev için bir alt ajan başlat” deyin veya `/subagents` kullanın.
    Gateway’in şu anda ne yaptığını görmek için sohbette `/status` kullanın (ve meşgul olup olmadığını).

    Token ipucu: uzun görevler ve alt ajanlar token tüketir. Maliyet önemliyse
    alt ajanlar için `agents.defaults.subagents.model` üzerinden daha ucuz bir model ayarlayın.

    Belgeler: [Alt ajanlar](/tools/subagents), [Arka Plan Görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="Discord'da iş parçacığına bağlı subagent oturumları nasıl çalışır?">
    İş parçacığı bağlarını kullanın. Bir Discord iş parçacığını bir alt ajan veya oturum hedefine bağlayabilirsiniz; böylece o iş parçacığındaki takip mesajları bağlı oturumda kalır.

    Temel akış:

    - `sessions_spawn` ile `thread: true` kullanarak başlatın (ve kalıcı takip için isteğe bağlı olarak `mode: "session"`).
    - Veya elle `/focus <target>` ile bağlayın.
    - Bağ durumunu incelemek için `/agents` kullanın.
    - Otomatik odağı kaldırmayı kontrol etmek için `/session idle <duration|off>` ve `/session max-age <duration|off>` kullanın.
    - İş parçacığını ayırmak için `/unfocus` kullanın.

    Gerekli yapılandırma:

    - Genel varsayılanlar: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord geçersiz kılmaları: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Başlatmada otomatik bağlama: `channels.discord.threadBindings.spawnSubagentSessions: true` ayarlayın.

    Belgeler: [Alt ajanlar](/tools/subagents), [Discord](/tr/channels/discord), [Yapılandırma Başvurusu](/tr/gateway/configuration-reference), [Slash komutları](/tools/slash-commands).

  </Accordion>

  <Accordion title="Bir subagent tamamlandı, ama tamamlanma güncellemesi yanlış yere gitti veya hiç gönderilmedi. Neyi kontrol etmeliyim?">
    Önce çözümlenen istek sahibi yönünü kontrol edin:

    - Tamamlama modundaki alt ajan teslimi, varsa bağlı iş parçacığı veya konuşma yönünü tercih eder.
    - Tamamlama kaynağı yalnızca bir kanal taşıyorsa, OpenClaw doğrudan teslimin yine de başarılı olabilmesi için istek sahibinin oturumundaki saklı yöne (`lastChannel` / `lastTo` / `lastAccountId`) geri döner.
    - Ne bağlı bir yön ne de kullanılabilir bir saklı yön varsa, doğrudan teslim başarısız olabilir ve sonuç sohbete hemen gönderilmek yerine kuyruğa alınmış oturum teslimine geri döner.
    - Geçersiz veya bayat hedefler yine kuyruk geri dönüşünü veya son teslim başarısızlığını zorlayabilir.
    - Çocuğun son görünür asistan yanıtı tam olarak sessiz belirteç `NO_REPLY` / `no_reply` ya da tam olarak `ANNOUNCE_SKIP` ise, OpenClaw eski ilerlemeyi göndermek yerine duyuruyu bilerek bastırır.
    - Çocuk yalnızca araç çağrılarından sonra zaman aşımına uğradıysa, duyuru ham araç çıktısını tekrar oynamak yerine bunu kısa bir kısmi ilerleme özetine daraltabilir.

    Hata ayıklama:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Alt ajanlar](/tools/subagents), [Arka Plan Görevleri](/tr/automation/tasks), [Oturum Araçları](/tr/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron veya hatırlatıcılar çalışmıyor. Neyi kontrol etmeliyim?">
    Cron, Gateway süreci içinde çalışır. Gateway sürekli çalışmıyorsa
    zamanlanmış işler çalışmaz.

    Kontrol listesi:

    - Cron’un etkin olduğunu (`cron.enabled`) ve `OPENCLAW_SKIP_CRON` ayarlanmadığını doğrulayın.
    - Gateway’in 7/24 çalıştığını kontrol edin (uyku/yeniden başlatma yok).
    - İşin zaman dilimi ayarlarını doğrulayın (`--tz` ile ana makinenin zaman dilimi).

    Hata ayıklama:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon ve Görevler](/tr/automation).

  </Accordion>

  <Accordion title="Cron tetiklendi ama kanala hiçbir şey gönderilmedi. Neden?">
    Önce teslim modunu kontrol edin:

    - `--no-deliver` / `delivery.mode: "none"` ise dış mesaj beklenmez.
    - Eksik veya geçersiz duyuru hedefi (`channel` / `to`) nedeniyle çalıştırıcı dışa teslimi atlamıştır.
    - Kanal kimlik doğrulama hataları (`unauthorized`, `Forbidden`) çalıştırıcının teslim etmeye çalıştığını ama kimlik bilgilerinin engellediğini gösterir.
    - Sessiz bir yalıtılmış sonuç (`NO_REPLY` / `no_reply` yalnızca) bilerek teslim edilemez olarak ele alınır; bu yüzden çalıştırıcı kuyruk geri dönüş teslimini de bastırır.

    Yalıtılmış cron işleri için son teslim çalıştırıcıya aittir. Ajanın,
    çalıştırıcının gönderebilmesi için düz metin bir özet döndürmesi beklenir. `--no-deliver`,
    bu sonucu içerde tutar; ajanın bunun yerine message tool ile doğrudan
    göndermesine izin vermez.

    Hata ayıklama:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Arka Plan Görevleri](/tr/automation/tasks).

  </Accordion>

  <Accordion title="Yalıtılmış bir cron çalıştırması neden model değiştirdi veya bir kez yeniden denedi?">
    Bu genellikle yinelenen zamanlama değil, canlı model değiştirme yoludur.

    Yalıtılmış cron, bir çalışma zamanı model devrini kalıcılaştırabilir ve etkin
    çalıştırma `LiveSessionModelSwitchError` fırlattığında yeniden deneyebilir. Yeniden deneme,
    değiştirilen sağlayıcıyı/modeli korur; geçiş yeni bir auth profile geçersiz kılması da taşıdıysa cron
    bunu da yeniden denemeden önce kalıcılaştırır.

    İlgili seçim kuralları:

    - Uygunsa önce Gmail hook model geçersiz kılması kazanır.
    - Sonra iş başına `model`.
    - Sonra saklı herhangi bir cron-oturum model geçersiz kılması.
    - Sonra normal ajan/varsayılan model seçimi.

    Yeniden deneme döngüsü sınırlıdır. İlk denemeden sonra artı 2 değiştirme yeniden denemesinden sonra,
    cron sonsuza dek döngüye girmek yerine iptal eder.

    Hata ayıklama:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [cron CLI](/cli/cron).

  </Accordion>

  <Accordion title="Linux'ta Skills nasıl yüklenir?">
    Yerel `openclaw skills` komutlarını kullanın veya skills’i çalışma alanınıza bırakın. macOS Skills UI Linux’ta mevcut değildir.
    Skills’e [https://clawhub.ai](https://clawhub.ai) üzerinden göz atın.

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    Yerel `openclaw skills install`, etkin çalışma alanının `skills/`
    dizinine yazar. Kendi skills’inizi yayımlamak veya
    eşitlemek istemiyorsanız ayrı `clawhub` CLI’yi yüklemeyin. Ajanlar arasında ortak kurulumlar için skill’i
    `~/.openclaw/skills` altına koyun ve hangi ajanların görebileceğini daraltmak istiyorsanız
    `agents.defaults.skills` veya
    `agents.list[].skills` kullanın.

  </Accordion>

  <Accordion title="OpenClaw görevleri zamanlı veya arka planda sürekli çalıştırabilir mi?">
    Evet. Gateway zamanlayıcısını kullanın:

    - Zamanlanmış veya yinelenen görevler için **Cron işleri** (yeniden başlatmalar arasında kalıcıdır).
    - “Ana oturum” dönemsel kontrolleri için **Heartbeat**.
    - Özetler gönderen veya sohbetlere teslim eden özerk ajanlar için **Yalıtılmış işler**.

    Belgeler: [Cron işleri](/tr/automation/cron-jobs), [Otomasyon ve Görevler](/tr/automation),
    [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title="Linux'tan yalnızca Apple macOS'a özel skills çalıştırabilir miyim?">
    Doğrudan hayır. macOS skills, `metadata.openclaw.os` artı gerekli ikili dosyalarla kapılıdır ve skills sistem istemine yalnızca **Gateway ana bilgisayarında** uygun olduklarında görünür. Linux’ta, `darwin`-yalnız skills (`apple-notes`, `apple-reminders`, `things-mac` gibi) kapılamayı geçersiz kılmadığınız sürece yüklenmez.

    Desteklenen üç düzen vardır:

    **Seçenek A - Gateway’i bir Mac üzerinde çalıştırın (en basit).**
    Gateway’i macOS ikili dosyalarının bulunduğu yerde çalıştırın, sonra Linux’tan [uzak modda](#gateway-portları-zaten-çalışıyor-ve-uzak-mod) veya Tailscale üzerinden bağlanın. Skills normal şekilde yüklenir çünkü Gateway ana bilgisayarı macOS’tur.

    **Seçenek B - macOS node kullanın (SSH yok).**
    Gateway’i Linux’ta çalıştırın, bir macOS node’u (menü çubuğu uygulaması) eşleştirin ve Mac’te **Node Run Commands** ayarını “Always Ask” veya “Always Allow” yapın. Gerekli ikili dosyalar node üzerinde bulunduğunda OpenClaw, macOS’a özel skills’i uygun sayabilir. Ajan, bu skills’i `nodes` aracı üzerinden çalıştırır. “Always Ask” seçerseniz, istemde “Always Allow” onayı bu komutu allowlist’e ekler.

    **Seçenek C - macOS ikili dosyalarını SSH üzerinden vekilleyin (ileri seviye).**
    Gateway’i Linux’ta tutun, ancak gerekli CLI ikili dosyaları bir Mac üzerinde çalışan SSH sarmalayıcılarına çözülsün. Sonra skill’i Linux’a izin verecek şekilde geçersiz kılın ki uygun kalsın.

    1. İkili dosya için bir SSH sarmalayıcısı oluşturun (örnek: Apple Notes için `memo`):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Sarmalayıcıyı Linux ana bilgisayarında PATH üzerine koyun (örneğin `~/bin/memo`).
    3. Skill metadata’sını geçersiz kılıp Linux’a izin verin (çalışma alanı veya `~/.openclaw/skills`):

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Skills anlık görüntüsünün yenilenmesi için yeni bir oturum başlatın.

  </Accordion>

  <Accordion title="Notion veya HeyGen entegrasyonunuz var mı?">
    Bugün yerleşik değil.

    Seçenekler:

    - **Özel skill / plugin:** güvenilir API erişimi için en iyisi (Notion/HeyGen’in ikisinin de API’si var).
    - **Tarayıcı otomasyonu:** kod gerektirmez ama daha yavaş ve daha kırılgandır.

    Bağlamı müşteri başına tutmak istiyorsanız (ajans iş akışları), basit bir düzen şu olabilir:

    - Müşteri başına bir Notion sayfası (bağlam + tercihler + etkin iş).
    - Ajandan oturum başında bu sayfayı getirmesini isteyin.

    Yerel bir entegrasyon istiyorsanız, özellik isteği açın veya o API’leri
    hedefleyen bir skill oluşturun.

    Skills yüklemek için:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Yerel kurulumlar etkin çalışma alanının `skills/` dizinine iner. Ajanlar arasında ortak skills için onları `~/.openclaw/skills/<name>/SKILL.md` içine yerleştirin. Paylaşılan bir kurulumu yalnızca bazı ajanlar görmeli ise `agents.defaults.skills` veya `agents.list[].skills` yapılandırın. Bazı skills Homebrew ile kurulmuş ikili dosyalar bekler; Linux’ta bu Linuxbrew anlamına gelir (yukarıdaki Homebrew Linux SSS girdisine bakın). [Skills](/tools/skills), [Skills config](/tools/skills-config) ve [ClawHub](/tr/tools/clawhub) bölümlerine bakın.

  </Accordion>

  <Accordion title="OpenClaw ile mevcut oturum açılmış Chrome'umu nasıl kullanırım?">
    Chrome DevTools MCP üzerinden bağlanan yerleşik `user` browser profilini kullanın:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Özel bir ad istiyorsanız, açık bir MCP profili oluşturun:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Bu yol host-yereldir. Gateway başka yerde çalışıyorsa, ya tarayıcı makinesinde bir node host çalıştırın ya da bunun yerine uzak CDP kullanın.

    `existing-session` / `user` üzerindeki mevcut sınırlamalar:

    - işlemler CSS selector tabanlı değil, ref tabanlıdır
    - yüklemeler `ref` / `inputRef` gerektirir ve şu anda aynı anda yalnızca bir dosyayı destekler
    - `responsebody`, PDF dışa aktarma, indirme yakalama ve toplu işlemler için hâlâ yönetilen bir browser veya ham CDP profili gerekir

  </Accordion>
</AccordionGroup>

## Sandbox ve bellek

<AccordionGroup>
  <Accordion title="Ayrı bir sandboxing belgesi var mı?">
    Evet. [Sandboxing](/tr/gateway/sandboxing) bölümüne bakın. Docker’a özel kurulum için (Docker içinde tam gateway veya sandbox imajları), [Docker](/tr/install/docker) bölümüne bakın.
  </Accordion>

  <Accordion title="Docker sınırlı hissettiriyor - tam özellikleri nasıl etkinleştiririm?">
    Varsayılan imaj güvenlik önceliklidir ve `node` kullanıcısı olarak çalışır; bu nedenle
    sistem paketleri, Homebrew veya paketlenmiş tarayıcılar içermez. Daha tam bir kurulum için:

    - Önbelleklerin kalıcı olması için `/home/node` dizinini `OPENCLAW_HOME_VOLUME` ile kalıcılaştırın.
    - Sistem bağımlılıklarını imajın içine `OPENCLAW_DOCKER_APT_PACKAGES` ile gömün.
    - Paketlenmiş CLI ile Playwright tarayıcılarını yükleyin:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH` ayarlayın ve yolun kalıcı olduğundan emin olun.

    Belgeler: [Docker](/tr/install/docker), [Browser](/tools/browser).

  </Accordion>

  <Accordion title="DM'leri kişisel tutup grupları tek ajanla herkese açık/sandbox içinde yapabilir miyim?">
    Evet - özel trafiğiniz **DM**, herkese açık trafiğiniz **gruplar** ise.

    `agents.defaults.sandbox.mode: "non-main"` kullanın; böylece grup/kanal oturumları (ana olmayan anahtarlar) Docker içinde çalışırken ana DM oturumu ana makine üzerinde kalır. Sonra sandbox içindeki oturumlarda hangi araçların kullanılabildiğini `tools.sandbox.tools` ile kısıtlayın.

    Kurulum rehberi + örnek yapılandırma: [Gruplar: kişisel DM’ler + herkese açık gruplar](/tr/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Ana yapılandırma başvurusu: [Gateway yapılandırması](/tr/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Ana bilgisayar klasörünü sandbox'a nasıl bağlarım?">
    `agents.defaults.sandbox.docker.binds` değerini `["host:path:mode"]` olarak ayarlayın (örn. `"/home/user/src:/src:ro"`). Genel + ajan başına bind’ler birleşir; `scope: "shared"` olduğunda ajan başına bind’ler yok sayılır. Hassas olan her şey için `:ro` kullanın ve bind’lerin sandbox dosya sistemi duvarlarını aştığını unutmayın.

    OpenClaw, bind kaynaklarını hem normalize edilmiş yol hem de en derin mevcut üst öğe üzerinden çözülen kanonik yol karşısında doğrular. Bu, son yol parçası henüz yokken bile symlink üst öğe kaçışlarının kapalı başarısız olacağı ve symlink çözümlemesinden sonra da izin verilen kök kontrollerinin uygulanacağı anlamına gelir.

    Örnekler ve güvenlik notları için [Sandboxing](/tr/gateway/sandboxing#custom-bind-mounts) ve [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) bölümlerine bakın.

  </Accordion>

  <Accordion title="Bellek nasıl çalışır?">
    OpenClaw belleği, ajan çalışma alanındaki Markdown dosyalarından ibarettir:

    - `memory/YYYY-MM-DD.md` içindeki günlük notlar
    - `MEMORY.md` içindeki düzenlenmiş uzun vadeli notlar (yalnızca ana/özel oturumlar)

    OpenClaw ayrıca sessiz bir **sıkıştırma öncesi bellek yazma** çalıştırır; bu, modele
    otomatik sıkıştırmadan önce kalıcı notlar yazmasını hatırlatır. Bu yalnızca çalışma alanı
    yazılabilir olduğunda çalışır (salt okunur sandbox’lar bunu atlar). [Bellek](/tr/concepts/memory) bölümüne bakın.

  </Accordion>

  <Accordion title="Bellek bir şeyleri unutuyor. Nasıl kalıcı hale getiririm?">
    Bottan **gerçeği belleğe yazmasını** isteyin. Uzun vadeli notlar `MEMORY.md` içine,
    kısa vadeli bağlam ise `memory/YYYY-MM-DD.md` içine gitmelidir.

    Bu hâlâ geliştirdiğimiz bir alan. Modele anıları saklamasını hatırlatmak yardımcı olur;
    ne yapacağını bilir. Hâlâ unutuyorsa Gateway’in her çalıştırmada aynı
    çalışma alanını kullandığını doğrulayın.

    Belgeler: [Bellek](/tr/concepts/memory), [Ajan çalışma alanı](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Bellek sonsuza kadar kalır mı? Sınırlar nedir?">
    Bellek dosyaları disk üzerinde yaşar ve siz silene kadar kalır. Sınır model değil,
    depolamanızdır. **Oturum bağlamı** yine de modelin bağlam penceresiyle sınırlıdır,
    bu yüzden uzun konuşmalar sıkıştırılabilir veya kesilebilir. Bu yüzden
    bellek arama vardır - yalnızca ilgili bölümleri yeniden bağlama çeker.

    Belgeler: [Bellek](/tr/concepts/memory), [Bağlam](/tr/concepts/context).

  </Accordion>

  <Accordion title="Anlamsal bellek araması için OpenAI API anahtarı gerekiyor mu?">
    Yalnızca **OpenAI embeddings** kullanıyorsanız. Codex OAuth sohbet/tamamlamaları kapsar ve
    embeddings erişimi **sağlamaz**; bu yüzden **Codex ile oturum açmak (OAuth veya
    Codex CLI girişi)** anlamsal bellek aramasında yardımcı olmaz. OpenAI embeddings için
    hâlâ gerçek bir API anahtarı gerekir (`OPENAI_API_KEY` veya `models.providers.openai.apiKey`).

    Bir sağlayıcıyı açıkça ayarlamazsanız, OpenClaw bir API anahtarını çözebildiğinde
    otomatik olarak bir sağlayıcı seçer (auth profiles, `models.providers.*.apiKey` veya ortam değişkenleri).
    Bir OpenAI anahtarı çözülürse önce OpenAI’ı, yoksa bir Gemini anahtarı
    çözülürse Gemini’yi, sonra Voyage’ı, ardından Mistral’ı tercih eder. Uzak bir anahtar yoksa, onu yapılandırana kadar
    bellek araması devre dışı kalır. Eğer yapılandırılmış ve mevcut bir yerel model yolunuz varsa, OpenClaw
    `local` seçeneğini
    tercih eder. `memorySearch.provider = "ollama"` açıkça ayarlandığında Ollama desteklenir.

    Yerelde kalmayı tercih ediyorsanız `memorySearch.provider = "local"` ayarlayın (ve isteğe bağlı olarak
    `memorySearch.fallback = "none"`). Gemini embeddings istiyorsanız
    `memorySearch.provider = "gemini"` ayarlayın ve `GEMINI_API_KEY` (veya
    `memorySearch.remote.apiKey`) sağlayın. **OpenAI, Gemini, Voyage, Mistral, Ollama veya local** embedding
    modellerini destekliyoruz - kurulum ayrıntıları için [Bellek](/tr/concepts/memory) bölümüne bakın.

  </Accordion>
</AccordionGroup>

## Diskte neler nerede yaşar

<AccordionGroup>
  <Accordion title="OpenClaw ile kullanılan tüm veriler yerel olarak mı kaydedilir?">
    Hayır - **OpenClaw’ın durumu yereldir**, ama **dış hizmetler onlara gönderdiğiniz şeyleri yine görür**.

    - **Varsayılan olarak yerel:** oturumlar, bellek dosyaları, yapılandırma ve çalışma alanı Gateway ana bilgisayarında yaşar
      (`~/.openclaw` + çalışma alanı dizininiz).
    - **Zorunlu olarak uzak:** model sağlayıcılarına (Anthropic/OpenAI/vb.) gönderdiğiniz mesajlar onların
      API’lerine gider ve sohbet platformları (WhatsApp/Telegram/Slack/vb.) mesaj verilerini
      kendi sunucularında depolar.
    - **Ayak izini siz kontrol edersiniz:** yerel modeller kullanmak istemleri makinenizde tutar, ancak kanal
      trafiği yine de kanalın sunucularından geçer.

    İlgili: [Ajan çalışma alanı](/tr/concepts/agent-workspace), [Bellek](/tr/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw verilerini nerede depolar?">
    Her şey `$OPENCLAW_STATE_DIR` altında yaşar (varsayılan: `~/.openclaw`):

    | Yol                                                            | Amaç                                                              |
    | --------------------------------------------------------------- | ----------------------------------------------------------------- |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Ana yapılandırma (JSON5)                                          |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Eski OAuth içe aktarması (ilk kullanımda auth profillerine kopyalanır) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profilleri (OAuth, API anahtarları ve isteğe bağlı `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef sağlayıcıları için isteğe bağlı dosya destekli gizli payload |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Eski uyumluluk dosyası (statik `api_key` girdileri temizlenmiş)   |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Sağlayıcı durumu (örn. `whatsapp/<accountId>/creds.json`)         |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Ajan başına durum (agentDir + oturumlar)                          |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Konuşma geçmişi ve durumu (ajan başına)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Oturum meta verileri (ajan başına)                                |

    Eski tek ajan yolu: `~/.openclaw/agent/*` (`openclaw doctor` ile taşınır).

    **Çalışma alanınız** (AGENTS.md, bellek dosyaları, skills vb.) ayrıdır ve `agents.defaults.workspace` üzerinden yapılandırılır (varsayılan: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md nerede olmalı?">
    Bu dosyalar `~/.openclaw` içinde değil, **ajan çalışma alanında** yaşar.

    - **Çalışma alanı (ajan başına)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (veya `MEMORY.md` yoksa eski geri dönüş `memory.md`),
      `memory/YYYY-MM-DD.md`, isteğe bağlı `HEARTBEAT.md`.
    - **Durum dizini (`~/.openclaw`)**: yapılandırma, kanal/sağlayıcı durumu, auth profilleri, oturumlar, günlükler,
      ve ortak skills (`~/.openclaw/skills`).

    Varsayılan çalışma alanı `~/.openclaw/workspace`’tir, şu yolla yapılandırılabilir:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Bot yeniden başlatmadan sonra “unutuyorsa”, Gateway’in her açılışta aynı
    çalışma alanını kullandığını doğrulayın (ve unutmayın: uzak mod **gateway ana bilgisayarının**
    çalışma alanını kullanır, yerel dizüstü bilgisayarınızınkini değil).

    İpucu: kalıcı bir davranış veya tercih istiyorsanız, sohbet geçmişine güvenmek yerine
    bottan bunu **AGENTS.md veya MEMORY.md içine yazmasını** isteyin.

    [Ajan çalışma alanı](/tr/concepts/agent-workspace) ve [Bellek](/tr/concepts/memory) bölümlerine bakın.

  </Accordion>

  <Accordion title="Önerilen yedekleme stratejisi">
    **Ajan çalışma alanınızı** özel bir git deposuna koyun ve bunu
    özel bir yerde yedekleyin (örneğin özel GitHub). Bu, bellek + AGENTS/SOUL/USER
    dosyalarını yakalar ve asistanın “zihnini” daha sonra geri yüklemenizi sağlar.

    `~/.openclaw` altındaki hiçbir şeyi commit etmeyin (kimlik bilgileri, oturumlar, tokenlar veya şifrelenmiş gizli payload’lar).
    Tam geri yükleme gerekiyorsa çalışma alanını ve durum dizinini
    ayrı ayrı yedekleyin (yukarıdaki taşıma sorusuna bakın).

    Belgeler: [Ajan çalışma alanı](/tr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="OpenClaw'ı tamamen nasıl kaldırırım?">
    Ayrılmış rehbere bakın: [Kaldırma](/tr/install/uninstall).
  </Accordion>

  <Accordion title="Ajanlar çalışma alanı dışında çalışabilir mi?">
    Evet. Çalışma alanı **varsayılan cwd** ve bellek çıpasıdır, katı bir sandbox değildir.
    Göreli yollar çalışma alanı içinde çözülür, ama mutlak yollar
    sandboxing etkin değilse başka ana bilgisayar konumlarına erişebilir. Yalıtım istiyorsanız
    [`agents.defaults.sandbox`](/tr/gateway/sandboxing) veya ajan başına sandbox ayarlarını kullanın. Bir
    deponun varsayılan çalışma dizini olmasını istiyorsanız, o ajanın
    `workspace` alanını depo köküne yöneltin. OpenClaw deposu yalnızca kaynak koddur; ajanı bilerek içinde çalıştırmak istemiyorsanız çalışma alanını ondan ayrı tutun.

    Örnek (repo varsayılan cwd olarak):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Uzak mod: oturum deposu nerede?">
    Oturum durumu **gateway ana bilgisayarı** tarafından sahiplenilir. Uzak moddaysanız, ilgilendiğiniz oturum deposu yerel dizüstü bilgisayarınızda değil uzak makinededir. [Oturum yönetimi](/tr/concepts/session) bölümüne bakın.
  </Accordion>
</AccordionGroup>

## Yapılandırma temelleri

<AccordionGroup>
  <Accordion title="Yapılandırma hangi biçimde? Nerede?">
    OpenClaw, `$OPENCLAW_CONFIG_PATH` içinden isteğe bağlı bir **JSON5** yapılandırması okur (varsayılan: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Dosya eksikse güvenli sayılabilecek varsayılanları kullanır (`~/.openclaw/workspace` varsayılan çalışma alanı dahil).

  </Accordion>

  <Accordion title='gateway.bind: "lan" (veya "tailnet") ayarladım ve artık hiçbir şey dinlemiyor / UI unauthorized diyor'>
    Loopback olmayan bağlamalar **geçerli bir gateway auth yolu** gerektirir. Uygulamada bunun anlamı şudur:

    - paylaşılan gizli kimlik doğrulaması: token veya parola
    - doğru yapılandırılmış loopback olmayan kimlik farkında bir reverse proxy arkasında `gateway.auth.mode: "trusted-proxy"`

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    Notlar:

    - `gateway.remote.token` / `.password` kendi başına yerel gateway auth’ı etkinleştirmez.
    - Yerel çağrı yolları, yalnızca `gateway.auth.*` ayarsız olduğunda geri dönüş olarak `gateway.remote.*` kullanabilir.
    - Parola auth için `gateway.auth.mode: "password"` ve `gateway.auth.password` (veya `OPENCLAW_GATEWAY_PASSWORD`) ayarlayın.
    - `gateway.auth.token` / `gateway.auth.password` SecretRef üzerinden açıkça yapılandırılmış ama çözümlenmemişse, çözümleme kapalı başarısız olur (uzak geri dönüş bunu maskelemez).
    - Paylaşılan gizli Control UI kurulumları `connect.params.auth.token` veya `connect.params.auth.password` üzerinden kimlik doğrular (uygulama/UI ayarlarında saklanır). Tailscale Serve veya `trusted-proxy` gibi kimlik taşıyan modlar bunun yerine istek başlıklarını kullanır. Paylaşılan gizlileri URL’lere koymaktan kaçının.
    - `gateway.auth.mode: "trusted-proxy"` ile aynı ana bilgisayar üzerindeki loopback reverse proxy’ler hâlâ trusted-proxy auth’ı karşılamaz. Güvenilir proxy yapılandırılmış loopback olmayan bir kaynak olmalıdır.

  </Accordion>

  <Accordion title="Neden artık localhost üzerinde de token gerekiyor?">
    OpenClaw, loopback dahil olmak üzere varsayılan olarak gateway auth uygular. Normal varsayılan yolda bu token auth anlamına gelir: açık bir auth yolu yapılandırılmamışsa, gateway başlangıcı token moduna çözülür ve otomatik olarak bir token üretip bunu `gateway.auth.token` içine kaydeder; dolayısıyla **yerel WS istemcilerinin kimlik doğrulaması yapması gerekir**. Bu, diğer yerel süreçlerin Gateway’i çağırmasını engeller.

    Başka bir auth yolu tercih ediyorsanız, açıkça password modunu seçebilir (veya loopback olmayan kimlik farkında reverse proxy’ler için `trusted-proxy`) seçebilirsiniz. **Gerçekten** açık loopback istiyorsanız, yapılandırmanızda açıkça `gateway.auth.mode: "none"` ayarlayın. Doctor size her zaman token üretebilir: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Yapılandırmayı değiştirdikten sonra yeniden başlatmam gerekiyor mu?">
    Gateway yapılandırmayı izler ve sıcak yeniden yüklemeyi destekler:

    - `gateway.reload.mode: "hybrid"` (varsayılan): güvenli değişiklikleri sıcak uygular, kritik olanlarda yeniden başlatır
    - `hot`, `restart`, `off` da desteklenir

  </Accordion>

  <Accordion title="Komik CLI sloganlarını nasıl kapatırım?">
    Yapılandırmada `cli.banner.taglineMode` ayarlayın:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: slogan metnini gizler ama başlık/sürüm satırını korur.
    - `default`: her zaman `All your chats, one OpenClaw.` kullanır.
    - `random`: dönen komik/mevsimsel sloganlar (varsayılan davranış).
    - Hiç banner istemiyorsanız `OPENCLAW_HIDE_BANNER=1` ortam değişkenini ayarlayın.

  </Accordion>

  <Accordion title="Web search'ü (ve web fetch'i) nasıl etkinleştiririm?">
    `web_fetch` API anahtarı olmadan çalışır. `web_search`, seçtiğiniz
    sağlayıcıya bağlıdır:

    - Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity ve Tavily gibi API destekli sağlayıcılar normal API anahtarı kurulumlarını gerektirir.
    - Ollama Web Search anahtarsızdır, ancak yapılandırılmış Ollama ana bilgisayarınızı kullanır ve `ollama signin` gerektirir.
    - DuckDuckGo anahtarsızdır, ama resmî olmayan HTML tabanlı bir entegrasyondur.
    - SearXNG anahtarsız/kendin barındırmalı bir çözümdür; `SEARXNG_BASE_URL` veya `plugins.entries.searxng.config.webSearch.baseUrl` yapılandırın.

    **Önerilen:** `openclaw configure --section web` çalıştırın ve bir sağlayıcı seçin.
    Ortam değişkeni alternatifleri:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` veya `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` veya `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` veya `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // isteğe bağlı; otomatik algılama için boş bırakın
            },
          },
        },
    }
    ```

    Sağlayıcıya özgü web-search yapılandırması artık `plugins.entries.<plugin>.config.webSearch.*` altında yaşar.
    Eski `tools.web.search.*` sağlayıcı yolları uyumluluk için geçici olarak hâlâ yüklenir, ancak yeni yapılandırmalarda kullanılmamalıdır.
    Firecrawl web-fetch geri dönüş yapılandırması `plugins.entries.firecrawl.config.webFetch.*` altında yaşar.

    Notlar:

    - Allowlist kullanıyorsanız `web_search`/`web_fetch`/`x_search` veya `group:web` ekleyin.
    - `web_fetch` varsayılan olarak etkindir (açıkça devre dışı bırakılmadıkça).
    - `tools.web.fetch.provider` boş bırakılırsa, OpenClaw mevcut kimlik bilgileri arasından hazır ilk fetch geri dönüş sağlayıcısını otomatik algılar. Bugün paketlenmiş sağlayıcı Firecrawl’dır.
    - Daemon’lar ortam değişkenlerini `~/.openclaw/.env` dosyasından (veya hizmet ortamından) okur.

    Belgeler: [Web araçları](/tools/web).

  </Accordion>

  <Accordion title="config.apply yapılandırmamı sildi. Nasıl geri kurtarırım ve bunu nasıl önlerim?">
    `config.apply` **tüm yapılandırmayı** değiştirir. Kısmi bir nesne gönderirseniz,
    geri kalan her şey kaldırılır.

    Kurtarma:

    - Yedekten geri yükleyin (git veya kopyalanmış `~/.openclaw/openclaw.json`).
    - Yedeğiniz yoksa `openclaw doctor` yeniden çalıştırın ve kanalları/modelleri yeniden yapılandırın.
    - Beklenmedik bir durumsa hata bildirimi açın ve son bilinen yapılandırmanızı veya herhangi bir yedeği ekleyin.
    - Yerel bir kodlama ajanı çoğu zaman günlüklerden veya geçmişten çalışan bir yapılandırmayı yeniden kurabilir.

    Önleme:

    - Küçük değişiklikler için `openclaw config set` kullanın.
    - Etkileşimli düzenlemeler için `openclaw configure` kullanın.
    - Tam yol veya alan şekli konusunda emin değilseniz önce `config.schema.lookup` kullanın; size sığ bir şema düğümü ve aşağı inmek için hemen alt özetleri döndürür.
    - Kısmi RPC düzenlemeleri için `config.patch` kullanın; `config.apply` yalnızca tam yapılandırma değişimi için kalsın.
    - Bir ajan çalıştırmasından sahip-yalnız `gateway` aracını kullanıyorsanız, bu yine de `tools.exec.ask` / `tools.exec.security` yollarına yazmayı reddeder (aynı korumalı exec yollarına normalize olan eski `tools.bash.*` takma adları dahil).

    Belgeler: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/tr/gateway/doctor).

  </Accordion>

  <Accordion title="Merkezi bir Gateway'i cihazlar arası uzman işçilerle nasıl çalıştırırım?">
    Yaygın düzen **bir Gateway** (ör. Raspberry Pi) artı **nodes** ve **agents** kullanmaktır:

    - **Gateway (merkezi):** kanalların (Signal/WhatsApp) sahibi olur, yönlendirme ve oturumları yönetir.
    - **Nodes (cihazlar):** Mac/iOS/Android çevre birimi olarak bağlanır ve yerel araçları açığa çıkarır (`system.run`, `canvas`, `camera`).
    - **Agents (işçiler):** özel roller için ayrı beyinler/çalışma alanlarıdır (ör. “Hetzner ops”, “Kişisel veri”).
    - **Alt ajanlar:** paralellik istediğinizde ana ajandan arka plan çalışması başlatır.
    - **TUI:** Gateway’e bağlanır ve ajanlar/oturumlar arasında geçiş yapar.

    Belgeler: [Nodes](/tr/nodes), [Uzak erişim](/tr/gateway/remote), [Çoklu Ajan Yönlendirme](/tr/concepts/multi-agent), [Alt ajanlar](/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="OpenClaw browser headless çalışabilir mi?">
    Evet. Bu bir yapılandırma seçeneğidir:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    Varsayılan `false`’dur (headful). Headless, bazı sitelerde anti-bot kontrollerini tetiklemeye daha yatkındır. [Browser](/tools/browser) bölümüne bakın.

    Headless, **aynı Chromium motorunu** kullanır ve çoğu otomasyon için çalışır (formlar, tıklamalar, scraping, girişler). Başlıca farklar:

    - Görünür tarayıcı penceresi yoktur (görsel gerekiyorsa ekran görüntüsü kullanın).
    - Bazı siteler headless modda otomasyona karşı daha katıdır (CAPTCHA’lar, anti-bot).
      Örneğin X/Twitter, headless oturumları sık sık engeller.

  </Accordion>

  <Accordion title="Tarayıcı kontrolü için Brave'i nasıl kullanırım?">
    `browser.executablePath` değerini Brave ikili dosyanıza (veya Chromium tabanlı başka bir tarayıcıya) ayarlayın ve Gateway’i yeniden başlatın.
    Tam yapılandırma örnekleri için [Browser](/tools/browser#use-brave-or-another-chromium-based-browser) bölümüne bakın.
  </Accordion>
</AccordionGroup>

## Uzak ağ geçitleri ve nodes

<AccordionGroup>
  <Accordion title="Komutlar Telegram, gateway ve nodes arasında nasıl yayılır?">
    Telegram mesajları **gateway** tarafından işlenir. Gateway ajanı çalıştırır ve
    bir node aracına ihtiyaç olduğunda ancak ondan sonra **Gateway WebSocket** üzerinden nodes çağırır:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes gelen sağlayıcı trafiğini görmez; yalnızca node RPC çağrılarını alır.

  </Accordion>

  <Accordion title="Gateway uzakta barındırılıyorsa ajanım bilgisayarıma nasıl erişebilir?">
    Kısa yanıt: **bilgisayarınızı node olarak eşleştirin**. Gateway başka yerde çalışır, ama
    Gateway WebSocket üzerinden yerel makinenizde `node.*` araçlarını (screen, camera, system) çağırabilir.

    Tipik kurulum:

    1. Gateway’i her zaman açık ana bilgisayarda çalıştırın (VPS/ev sunucusu).
    2. Gateway ana bilgisayarı ve bilgisayarınızı aynı tailnet’e koyun.
    3. Gateway WS’nin erişilebilir olduğundan emin olun (tailnet bind veya SSH tüneli).
    4. macOS uygulamasını yerelde açın ve **Remote over SSH** modunda (veya doğrudan tailnet)
       bağlanın; böylece kendini node olarak kaydedebilir.
    5. Gateway üzerinde node’u onaylayın:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Ayrı bir TCP köprüsü gerekmez; nodes Gateway WebSocket üzerinden bağlanır.

    Güvenlik hatırlatması: bir macOS node eşleştirmek o makinede `system.run` izni verir. Yalnızca
    güvendiğiniz cihazları eşleştirin ve [Güvenlik](/tr/gateway/security) bölümünü gözden geçirin.

    Belgeler: [Nodes](/tr/nodes), [Gateway protocol](/tr/gateway/protocol), [macOS remote mode](/tr/platforms/mac/remote), [Güvenlik](/tr/gateway/security).

  </Accordion>

  <Accordion title="Tailscale bağlı ama yanıt gelmiyor. Ne yapmalıyım?">
    Temelleri kontrol edin:

    - Gateway çalışıyor mu: `openclaw gateway status`
    - Gateway sağlığı: `openclaw status`
    - Kanal sağlığı: `openclaw channels status`

    Sonra kimlik doğrulama ve yönlendirmeyi doğrulayın:

    - Tailscale Serve kullanıyorsanız, `gateway.auth.allowTailscale` doğru ayarlandığından emin olun.
    - SSH tüneli ile bağlanıyorsanız, yerel tünelin açık olduğunu ve doğru porta işaret ettiğini doğrulayın.
    - Allowlist’lerinizin hesabınızı içerdiğini doğrulayın (DM veya grup).

    Belgeler: [Tailscale](/tr/gateway/tailscale), [Uzak erişim](/tr/gateway/remote), [Kanallar](/tr/channels).

  </Accordion>

  <Accordion title="İki OpenClaw örneği birbiriyle konuşabilir mi (yerel + VPS)?">
    Evet. Yerleşik bir “botlar arası” köprü yoktur, ancak bunu birkaç
    güvenilir şekilde kurabilirsiniz:

    **En basiti:** her iki botun da erişebildiği normal bir sohbet kanalı kullanın (Telegram/Slack/WhatsApp).
    Bot A, Bot B’ye mesaj göndersin; sonra Bot B her zamanki gibi yanıtlasın.

    **CLI köprüsü (genel):** diğer Gateway’i çağıran bir betik çalıştırın;
    `openclaw agent --message ... --deliver` ile diğer botun
    dinlediği sohbeti hedefleyin. Botlardan biri uzak bir VPS üzerindeyse, CLI’nizi o uzak Gateway’e
    SSH/Tailscale üzerinden yöneltin ([Uzak erişim](/tr/gateway/remote) bölümüne bakın).

    Örnek düzen (hedef Gateway’e erişebilen bir makinede çalıştırın):

    ```bash
    openclaw agent --message "Yerel bottan merhaba" --deliver --channel telegram --reply-to <chat-id>
    ```

    İpucu: iki botun sonsuz döngüye girmemesi için bir koruma ekleyin (yalnızca bahsetme,
    kanal allowlist’leri veya “bot mesajlarına yanıt verme” kuralı).

    Belgeler: [Uzak erişim](/tr/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/tr/tools/agent-send).

  </Accordion>

  <Accordion title="Birden fazla ajan için ayrı VPS'lere ihtiyacım var mı?">
    Hayır. Tek bir Gateway, her birinin kendi çalışma alanı, model varsayılanları
    ve yönlendirmesi olan birden fazla ajan barındırabilir. Bu normal kurulumdur ve
    ajan başına bir VPS çalıştırmaktan çok daha ucuz ve basittir.

    Ayrı VPS’ler yalnızca sert yalıtım (güvenlik sınırları) gerektiğinde veya paylaşmak
    istemediğiniz çok farklı yapılandırmalarınız olduğunda kullanın. Aksi halde tek bir Gateway tutun ve
    birden çok ajan veya alt ajan kullanın.

  </Accordion>

  <Accordion title="Uzak bir Gateway'den SSH yerine kişisel dizüstü bilgisayarımda node kullanmanın bir faydası var mı?">
    Evet - uzak bir Gateway’den dizüstü bilgisayarınıza erişmenin birinci sınıf yolu node’lardır ve
    yalnızca kabuk erişiminden daha fazlasını açarlar. Gateway macOS/Linux üzerinde çalışır (Windows, WSL2 üzerinden) ve
    hafiftir (küçük bir VPS veya Raspberry Pi sınıfı kutu yeterlidir; 4 GB RAM fazlasıyla yeterlidir), bu yüzden yaygın
    kurulum her zaman açık bir ana makine artı dizüstü bilgisayarınızın node olmasıdır.

    - **Gelen SSH gerekmez.** Nodes dışarı doğru Gateway WebSocket’e bağlanır ve cihaz eşleştirmesi kullanır.
    - **Daha güvenli yürütme denetimleri.** `system.run`, o dizüstü bilgisayardaki node allowlist/onayları ile kapılanır.
    - **Daha fazla cihaz aracı.** Nodes, `system.run` yanında `canvas`, `camera` ve `screen` açığa çıkarır.
    - **Yerel tarayıcı otomasyonu.** Gateway’i VPS üzerinde tutun, ama Chrome’u dizüstünde node host ile yerelde çalıştırın ya da ana makinede yerel Chrome’a Chrome MCP üzerinden bağlanın.

    SSH geçici kabuk erişimi için iyidir, ancak ajan iş akışları ve
    cihaz otomasyonu için nodes daha basittir.

    Belgeler: [Nodes](/tr/nodes), [Nodes CLI](/cli/nodes), [Browser](/tools/browser).

  </Accordion>

  <Accordion title="Nodes bir gateway service çalıştırır mı?">
    Hayır. Bilerek yalıtılmış profiller çalıştırmıyorsanız, ana bilgisayar başına yalnızca **bir gateway**
    çalışmalıdır ([Birden çok gateway](/tr/gateway/multiple-gateways) bölümüne bakın). Nodes, gateway’e bağlanan çevre birimleridir
    (iOS/Android nodes veya menü çubuğu uygulamasında macOS “node mode”). Headless node
    host’lar ve CLI denetimi için [Node host CLI](/cli/node) bölümüne bakın.

    `gateway`, `discovery` ve `canvasHost` değişiklikleri için tam yeniden başlatma gerekir.

  </Accordion>

  <Accordion title="Yapılandırmayı uygulamak için API / RPC yolu var mı?">
    Evet.

    - `config.schema.lookup`: yazmadan önce bir yapılandırma alt ağacını sığ şema düğümü, eşleşen UI ipucu ve hemen alt özetleriyle inceleyin
    - `config.get`: mevcut anlık görüntü + hash’i getirin
    - `config.patch`: güvenli kısmi güncelleme (çoğu RPC düzenlemesi için tercih edilir)
    - `config.apply`: doğrula + tüm yapılandırmayı değiştir, sonra yeniden başlat
    - Sahip-yalnız `gateway` çalışma zamanı aracı yine de `tools.exec.ask` / `tools.exec.security` yollarını yeniden yazmayı reddeder; eski `tools.bash.*` takma adları aynı korumalı exec yollarına normalize olur

  </Accordion>

  <Accordion title="İlk kurulum için asgari makul yapılandırma">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Bu, çalışma alanınızı ayarlar ve botu kimin tetikleyebileceğini kısıtlar.

  </Accordion>

  <Accordion title="Bir VPS'te Tailscale'i nasıl kurar ve Mac'imden nasıl bağlanırım?">
    En az adımlar:

    1. **VPS üzerinde yükleyin + giriş yapın**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac’inizde yükleyin + giriş yapın**
       - Tailscale uygulamasını kullanın ve aynı tailnet’e giriş yapın.
    3. **MagicDNS’i etkinleştirin (önerilen)**
       - Tailscale yönetim konsolunda MagicDNS’i etkinleştirin ki VPS’in kararlı bir adı olsun.
    4. **Tailnet ana bilgisayar adını kullanın**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH olmadan Control UI istiyorsanız, VPS’te Tailscale Serve kullanın:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Bu, gateway’i loopback’e bağlı tutar ve HTTPS’i Tailscale üzerinden açığa çıkarır. [Tailscale](/tr/gateway/tailscale) bölümüne bakın.

  </Accordion>

  <Accordion title="Bir Mac node'u uzak bir Gateway'e nasıl bağlarım (Tailscale Serve)?">
    Serve, **Gateway Control UI + WS** yüzeyini açığa çıkarır. Nodes da aynı Gateway WS uç noktası üzerinden bağlanır.

    Önerilen kurulum:

    1. **VPS + Mac’in aynı tailnet üzerinde olduğundan emin olun**.
    2. **macOS uygulamasını Remote modunda kullanın** (SSH hedefi tailnet ana bilgisayar adı olabilir).
       Uygulama Gateway portunu tüneller ve node olarak bağlanır.
    3. Gateway üzerinde node’u **onaylayın**:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Belgeler: [Gateway protocol](/tr/gateway/protocol), [Discovery](/tr/gateway/discovery), [macOS remote mode](/tr/platforms/mac/remote).

  </Accordion>

  <Accordion title="İkinci dizüstü bilgisayara mı kurmalıyım yoksa sadece node mu eklemeliyim?">
    İkinci dizüstü bilgisayarda yalnızca **yerel araçlara** (screen/camera/exec) ihtiyacınız varsa, onu
    bir **node** olarak ekleyin. Bu tek bir Gateway tutar ve yinelenen yapılandırmadan kaçınır. Yerel node araçları
    şu anda yalnızca macOS’tur, ancak bunu diğer işletim sistemlerine genişletmeyi planlıyoruz.

    İkinci Gateway’i yalnızca **sert yalıtım** veya tamamen ayrı iki bot gerektiğinde kurun.

    Belgeler: [Nodes](/tr/nodes), [Nodes CLI](/cli/nodes), [Birden çok gateway](/tr/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Ortam değişkenleri ve .env yükleme

<AccordionGroup>
  <Accordion title="OpenClaw ortam değişkenlerini nasıl yükler?">
    OpenClaw ortam değişkenlerini üst süreçten (kabuk, launchd/systemd, CI vb.) okur ve ayrıca şunları yükler:

    - geçerli çalışma dizinindeki `.env`
    - `~/.openclaw/.env` içindeki genel geri dönüş `.env` dosyası (yani `$OPENCLAW_STATE_DIR/.env`)

    Hiçbir `.env` dosyası mevcut ortam değişkenlerini geçersiz kılmaz.

    Yapılandırma içinde satır içi ortam değişkenleri de tanımlayabilirsiniz (yalnızca süreç ortamında eksikse uygulanır):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Tam öncelik ve kaynaklar için [/environment](/tr/help/environment) bölümüne bakın.

  </Accordion>

  <Accordion title="Gateway'i service ile başlattım ve ortam değişkenlerim kayboldu. Ne yapmalıyım?">
    İki yaygın çözüm:

    1. Eksik anahtarları `~/.openclaw/.env` içine koyun; böylece hizmet kabuk ortamınızı devralmasa da alınırlar.
    2. Kabuk içe aktarmayı etkinleştirin (isteğe bağlı kolaylık):

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    Bu, giriş kabuğunuzu çalıştırır ve yalnızca beklenen eksik anahtarları içe aktarır (asla geçersiz kılmaz).
    Ortam değişkeni karşılıkları:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN ayarladım ama models status "Shell env: off." gösteriyor. Neden?'>
    `openclaw models status`, **shell env import** özelliğinin etkin olup olmadığını bildirir. “Shell env: off”
    ortam değişkenleriniz eksik demek değildir - sadece OpenClaw’ın
    giriş kabuğunuzu otomatik yüklemeyeceği anlamına gelir.

    Gateway bir hizmet olarak çalışıyorsa (launchd/systemd), kabuk
    ortamınızı devralmaz. Bunu şu yollardan biriyle düzeltin:

    1. Token’ı `~/.openclaw/.env` içine koyun:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Veya shell import’u etkinleştirin (`env.shellEnv.enabled: true`).
    3. Veya yapılandırmadaki `env` bloğuna ekleyin (yalnızca eksikse uygulanır).

    Sonra gateway’i yeniden başlatın ve tekrar kontrol edin:

    ```bash
    openclaw models status
    ```

    Copilot tokenları `COPILOT_GITHUB_TOKEN` üzerinden okunur (ayrıca `GH_TOKEN` / `GITHUB_TOKEN`).
    [/concepts/model-providers](/tr/concepts/model-providers) ve [/environment](/tr/help/environment) bölümlerine bakın.

  </Accordion>
</AccordionGroup>

## Oturumlar ve birden çok sohbet

<AccordionGroup>
  <Accordion title="Yeni bir konuşmayı nasıl başlatırım?">
    Bağımsız mesaj olarak `/new` veya `/reset` gönderin. [Oturum yönetimi](/tr/concepts/session) bölümüne bakın.
  </Accordion>

  <Accordion title="Hiç /new göndermezsem oturumlar otomatik sıfırlanır mı?">
    Oturumlar `session.idleMinutes` sonrasında süresi dolabilir, ancak bu **varsayılan olarak devre dışıdır** (varsayılan **0**).
    Bunu etkinleştirmek için pozitif bir değer ayarlayın. Etkin olduğunda boşta kalma süresinden
    sonraki **sonraki** mesaj, o sohbet anahtarı için yeni bir oturum kimliği başlatır.
    Bu, dökümleri silmez - yalnızca yeni bir oturum başlatır.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Bir OpenClaw örnekleri takımı yapmanın yolu var mı (bir CEO ve çok sayıda ajan)?">
    Evet, **çoklu ajan yönlendirme** ve **alt ajanlar** ile. Bir koordinatör
    ajan ve kendi çalışma alanları ve modelleri olan birkaç işçi ajan oluşturabilirsiniz.

    Bununla birlikte, bunu en iyi **eğlenceli bir deney** olarak görmek gerekir. Token açısından ağırdır ve çoğu zaman
    ayrı oturumlara sahip tek bir bot kullanmaktan daha verimsizdir. Genelde
    öngördüğümüz model, konuştuğunuz tek bir bot ve paralel iş için farklı oturumlardır. Bu
    bot gerektiğinde alt ajanlar da başlatabilir.

    Belgeler: [Çoklu ajan yönlendirme](/tr/concepts/multi-agent), [Alt ajanlar](/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="Bağlam görev ortasında neden kesildi? Bunu nasıl önlerim?">
    Oturum bağlamı model penceresiyle sınırlıdır. Uzun sohbetler, büyük araç çıktıları veya çok sayıda
    dosya sıkıştırma ya da kesmeyi tetikleyebilir.

    Yardımcı olanlar:

    - Bottan geçerli durumu özetlemesini ve bir dosyaya yazmasını isteyin.
    - Uzun görevlerden önce `/compact`, konu değiştirirken `/new` kullanın.
    - Önemli bağlamı çalışma alanında tutun ve bottan bunu tekrar okumasını isteyin.
    - Ana sohbet daha küçük kalsın diye uzun veya paralel işler için alt ajanlar kullanın.
    - Bu sık oluyorsa daha büyük bağlam pencereli bir model seçin.

  </Accordion>

  <Accordion title="OpenClaw'ı tamamen sıfırlayıp kurulu bırakmak nasıl olur?">
    Sıfırlama komutunu kullanın:

    ```bash
    openclaw reset
    ```

    Etkileşimsiz tam sıfırlama:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Sonra kurulumu yeniden çalıştırın:

    ```bash
    openclaw onboard --install-daemon
    ```

    Notlar:

    - Onboarding mevcut yapılandırma görürse **Reset** de sunar. [Onboarding (CLI)](/tr/start/wizard) bölümüne bakın.
    - Profiller kullandıysanız (`--profile` / `OPENCLAW_PROFILE`), her durum dizinini sıfırlayın (varsayılanlar `~/.openclaw-<profile>`).
    - Geliştirici sıfırlaması: `openclaw gateway --dev --reset` (yalnızca geliştirme; geliştirici yapılandırması + kimlik bilgileri + oturumlar + çalışma alanını siler).

  </Accordion>

  <Accordion title='“context too large” hataları alıyorum - nasıl sıfırlar veya sıkıştırırım?'>
    Şunlardan birini kullanın:

    - **Sıkıştır** (konuşmayı korur ama eski turları özetler):

      ```
      /compact
      ```

      veya özeti yönlendirmek için `/compact <instructions>`.

    - **Sıfırla** (aynı sohbet anahtarı için yeni oturum kimliği):

      ```
      /new
      /reset
      ```

    Sürekli oluyorsa:

    - Eski araç çıktısını kırpmak için **oturum budamayı** (`agents.defaults.contextPruning`) etkinleştirin veya ayarlayın.
    - Daha büyük bağlam pencereli bir model kullanın.

    Belgeler: [Sıkıştırma](/tr/concepts/compaction), [Oturum budama](/tr/concepts/session-pruning), [Oturum yönetimi](/tr/concepts/session).

  </Accordion>

  <Accordion title='Neden "LLM request rejected: messages.content.tool_use.input field required" görüyorum?'>
    Bu, sağlayıcı doğrulama hatasıdır: model gerekli
    `input` olmadan bir `tool_use` bloğu yaymıştır. Genelde oturum geçmişinin bayat veya bozuk olduğu anlamına gelir (çoğunlukla uzun iş parçacıklarından
    veya araç/şema değişikliğinden sonra).

    Çözüm: bağımsız mesaj olarak `/new` ile yeni bir oturum başlatın.

  </Accordion>

  <Accordion title="Neden her 30 dakikada bir heartbeat mesajları alıyorum?">
    Heartbeat’ler varsayılan olarak her **30m**’de bir çalışır (**OAuth auth kullanılıyorsa 1h**). Ayarlayın veya devre dışı bırakın:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // veya devre dışı bırakmak için "0m"
          },
        },
      },
    }
    ```

    Eğer `HEARTBEAT.md` var ama fiilen boşsa (yalnızca boş satırlar ve
    `# Heading` gibi markdown başlıkları), OpenClaw API çağrılarını azaltmak için heartbeat çalıştırmasını atlar.
    Dosya eksikse heartbeat yine çalışır ve ne yapacağına model karar verir.

    Ajan başına geçersiz kılmalar `agents.list[].heartbeat` kullanır. Belgeler: [Heartbeat](/tr/gateway/heartbeat).

  </Accordion>

  <Accordion title='Bir WhatsApp grubuna "bot hesabı" eklemem gerekiyor mu?'>
    Hayır. OpenClaw **kendi hesabınızda** çalışır; yani siz gruptaysanız OpenClaw da onu görebilir.
    Varsayılan olarak grup yanıtları gönderenlere izin verene kadar engellenir (`groupPolicy: "allowlist"`).

    Sadece **sizin** grup yanıtlarını tetikleyebilmenizi istiyorsanız:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Bir WhatsApp grubunun JID değerini nasıl alırım?">
    Seçenek 1 (en hızlı): günlükleri izleyin ve gruba bir test mesajı gönderin:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us` ile biten `chatId` (veya `from`) değerini arayın:
    `1234567890-1234567890@g.us`.

    Seçenek 2 (zaten yapılandırılmış/allowlist’e alınmışsa): grupları yapılandırmadan listeleyin:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Belgeler: [WhatsApp](/tr/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="OpenClaw bir grupta neden yanıt vermiyor?">
    İki yaygın neden:

    - Mention kapısı açık (varsayılan). Botu @mention etmeniz gerekir (veya `mentionPatterns` ile eşleşmesi gerekir).
    - `channels.whatsapp.groups` yapılandırdınız ama `"*"` yok ve grup allowlist’e alınmamış.

    [Gruplar](/tr/channels/groups) ve [Grup mesajları](/tr/channels/group-messages) bölümlerine bakın.

  </Accordion>

  <Accordion title="Gruplar/iş parçacıkları DM'lerle bağlam paylaşır mı?">
    Doğrudan sohbetler varsayılan olarak ana oturuma çöker. Gruplar/kanalların kendi oturum anahtarları vardır, Telegram konuları / Discord iş parçacıkları ise ayrı oturumlardır. [Gruplar](/tr/channels/groups) ve [Grup mesajları](/tr/channels/group-messages) bölümlerine bakın.
  </Accordion>

  <Accordion title="Kaç çalışma alanı ve ajan oluşturabilirim?">
    Katı sınır yok. Onlarca (hatta yüzlerce) sorun olmaz, ancak şunlara dikkat edin:

    - **Disk büyümesi:** oturumlar + dökümler `~/.openclaw/agents/<agentId>/sessions/` altında yaşar.
    - **Token maliyeti:** daha fazla ajan daha çok eşzamanlı model kullanımı demektir.
    - **Operasyon yükü:** ajan başına auth profilleri, çalışma alanları ve kanal yönlendirmesi.

    İpuçları:

    - Ajan başına bir **etkin** çalışma alanı tutun (`agents.defaults.workspace`).
    - Disk büyürse eski oturumları budayın (JSONL veya depo girdilerini silin).
    - Dağınık çalışma alanlarını ve profil uyuşmazlıklarını tespit etmek için `openclaw doctor` kullanın.

  </Accordion>

  <Accordion title="Aynı anda birden çok bot veya sohbet (Slack) çalıştırabilir miyim ve bunu nasıl kurmalıyım?">
    Evet. Birden fazla yalıtılmış ajan çalıştırmak ve gelen mesajları
    kanal/hesap/eşe göre yönlendirmek için **Çoklu Ajan Yönlendirme** kullanın. Slack bir kanal olarak desteklenir ve belirli ajanlara bağlanabilir.

    Tarayıcı erişimi güçlüdür ama “bir insanın yapabildiği her şeyi yapar” değildir - anti-bot,
    CAPTCHA’lar ve MFA yine otomasyonu engelleyebilir. En güvenilir tarayıcı denetimi için ana makinede yerel Chrome MCP kullanın,
    veya tarayıcıyı gerçekten çalıştıran makinede CDP kullanın.

    En iyi uygulama kurulumu:

    - Her zaman açık Gateway ana bilgisayarı (VPS/Mac mini).
    - Rol başına bir ajan (bağlar).
    - O ajanlara bağlı Slack kanalları.
    - Gerektiğinde Chrome MCP veya node üzerinden yerel browser.

    Belgeler: [Çoklu Ajan Yönlendirme](/tr/concepts/multi-agent), [Slack](/tr/channels/slack),
    [Browser](/tools/browser), [Nodes](/tr/nodes).

  </Accordion>
</AccordionGroup>

## Modeller: varsayılanlar, seçim, takma adlar, geçiş

<AccordionGroup>
  <Accordion title='“Varsayılan model” nedir?'>
    OpenClaw’ın varsayılan modeli, şurada ayarladığınız şeydir:

    ```
    agents.defaults.model.primary
    ```

    Modeller `provider/model` olarak başvurulur (örnek: `openai/gpt-5.4`). Sağlayıcıyı atlarsanız OpenClaw önce bir takma adı, sonra o tam model kimliği için benzersiz yapılandırılmış sağlayıcı eşleşmesini dener ve ancak ondan sonra artık önerilmeyen uyumluluk yolu olarak yapılandırılmış varsayılan sağlayıcıya döner. O sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa, bayat kaldırılmış sağlayıcı varsayılanını yüzeye çıkarmak yerine ilk yapılandırılmış sağlayıcı/modele geri döner. Yine de **açıkça** `provider/model` ayarlamalısınız.

  </Accordion>

  <Accordion title="Hangi modeli öneriyorsunuz?">
    **Önerilen varsayılan:** sağlayıcı yığınınızda mevcut olan en güçlü en yeni nesil modeli kullanın.
    **Araç etkin veya güvenilmeyen girdi alan ajanlar için:** maliyetten çok model gücünü önceliklendirin.
    **Rutin/düşük riskli sohbetler için:** daha ucuz yedek modeller kullanın ve ajan rolüne göre yönlendirin.

    MiniMax’ın kendi belgeleri vardır: [MiniMax](/tr/providers/minimax) ve
    [Yerel modeller](/tr/gateway/local-models).

    Kabaca kural: yüksek riskli işler için karşılayabildiğiniz **en iyi modeli** kullanın ve rutin
    sohbet veya özetler için daha ucuz bir model kullanın. Modelleri ajan başına yönlendirebilir ve uzun işleri
    paralelleştirmek için alt ajanlar kullanabilirsiniz (her alt ajan token tüketir). [Modeller](/tr/concepts/models) ve
    [Alt ajanlar](/tools/subagents) bölümlerine bakın.

    Güçlü uyarı: daha zayıf/aşırı kuantize modeller prompt
    injection ve güvensiz davranışlara daha açıktır. [Güvenlik](/tr/gateway/security) bölümüne bakın.

    Daha fazla bağlam: [Modeller](/tr/concepts/models).

  </Accordion>

  <Accordion title="Yapılandırmamı silmeden modeller arasında nasıl geçiş yaparım?">
    **Model komutlarını** kullanın veya yalnızca **model** alanlarını düzenleyin. Tam yapılandırma değişimlerinden kaçının.

    Güvenli seçenekler:

    - sohbette `/model` (hızlı, oturum başına)
    - `openclaw models set ...` (yalnızca model yapılandırmasını günceller)
    - `openclaw configure --section model` (etkileşimli)
    - `~/.openclaw/openclaw.json` içinde `agents.defaults.model` düzenlemek

    Tüm yapılandırmayı değiştirmek istemiyorsanız, kısmi bir nesne ile `config.apply` kullanmaktan kaçının.
    RPC düzenlemeleri için önce `config.schema.lookup` ile inceleyin ve `config.patch` tercih edin. Lookup payload size normalize edilmiş yolu, sığ şema belgeleri/kısıtları ve hemen alt özetleri verir.
    kısmi güncellemeler için.
    Yapılandırmanın üzerine yazdıysanız yedekten geri yükleyin veya onarmak için `openclaw doctor` yeniden çalıştırın.

    Belgeler: [Modeller](/tr/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/tr/gateway/doctor).

  </Accordion>

  <Accordion title="Kendi barındırdığım modelleri kullanabilir miyim (llama.cpp, vLLM, Ollama)?">
    Evet. Yerel modeller için en kolay yol Ollama’dır.

    En hızlı kurulum:

    1. Ollama’yı `https://ollama.com/download` adresinden yükleyin
    2. `ollama pull glm-4.7-flash` gibi bir yerel model çekin
    3. Bulut modelleri de istiyorsanız `ollama signin` çalıştırın
    4. `openclaw onboard` çalıştırın ve `Ollama` seçin
    5. `Local` veya `Cloud + Local` seçin

    Notlar:

    - `Cloud + Local` size bulut modelleri ile yerel Ollama modellerinizi birlikte verir
    - `kimi-k2.5:cloud` gibi bulut modelleri yerel çekme gerektirmez
    - elle geçiş için `openclaw models list` ve `openclaw models set ollama/<model>` kullanın

    Güvenlik notu: daha küçük veya yoğun kuantize edilmiş modeller prompt
    injection’a daha açıktır. Araç kullanabilen her bot için **büyük modelleri**
    güçlü şekilde öneriyoruz. Yine de küçük modeller istiyorsanız sandboxing ve katı araç allowlist’leri etkinleştirin.

    Belgeler: [Ollama](/tr/providers/ollama), [Yerel modeller](/tr/gateway/local-models),
    [Model providers](/tr/concepts/model-providers), [Güvenlik](/tr/gateway/security),
    [Sandboxing](/tr/gateway/sandboxing).

  </Accordion>

  <Accordion title="OpenClaw, Flawd ve Krill modeller için ne kullanıyor?">
    - Bu dağıtımlar farklı olabilir ve zaman içinde değişebilir; sabit bir sağlayıcı önerisi yoktur.
    - Her gateway’de geçerli çalışma zamanı ayarını `openclaw models status` ile kontrol edin.
    - Güvenliğe duyarlı/araç etkin ajanlar için mevcut en güçlü en yeni nesil modeli kullanın.
  </Accordion>

  <Accordion title="Modeller arasında anında (yeniden başlatmadan) nasıl geçiş yaparım?">
    Bağımsız mesaj olarak `/model` komutunu kullanın:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    Bunlar yerleşik takma adlardır. Özel takma adlar `agents.defaults.models` üzerinden eklenebilir.

    Kullanılabilir modelleri `/model`, `/model list` veya `/model status` ile listeleyebilirsiniz.

    `/model` (ve `/model list`) kısa, numaralı bir seçim listesi gösterir. Numarayla seçin:

    ```
    /model 3
    ```

    Sağlayıcı için belirli bir auth profile’ı da zorlayabilirsiniz (oturum başına):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    İpucu: `/model status`, hangi ajanın etkin olduğunu, hangi `auth-profiles.json` dosyasının kullanıldığını ve sonraki hangi auth profile’ın deneneceğini gösterir.
    Mevcutsa yapılandırılmış sağlayıcı uç noktasını (`baseUrl`) ve API modunu (`api`) da gösterir.

    **@profile ile ayarladığım profile sabitlemesini nasıl kaldırırım?**

    `/model` komutunu `@profile` son eki **olmadan** yeniden çalıştırın:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Varsayılana dönmek istiyorsanız, `/model` içinden seçin (veya `/model <default provider/model>` gönderin).
    Hangi auth profile’ın etkin olduğunu doğrulamak için `/model status` kullanın.

  </Accordion>

  <Accordion title="Günlük görevler için GPT 5.2 ve kodlama için Codex 5.3 kullanabilir miyim?">
    Evet. Birini varsayılan yapın ve gerektiğinde değiştirin:

    - **Hızlı geçiş (oturum başına):** günlük görevler için `/model gpt-5.4`, Codex OAuth ile kodlama için `/model openai-codex/gpt-5.4`.
    - **Varsayılan + geçiş:** `agents.defaults.model.primary` değerini `openai/gpt-5.4` yapın, sonra kodlama yaparken `openai-codex/gpt-5.4`’e geçin (veya tam tersi).
    - **Alt ajanlar:** kodlama görevlerini farklı varsayılan modele sahip alt ajanlara yönlendirin.

    [Modeller](/tr/concepts/models) ve [Slash komutları](/tools/slash-commands) bölümlerine bakın.

  </Accordion>

  <Accordion title='Neden "Model ... is not allowed" görüp sonra yanıt alamıyorum?'>
    `agents.defaults.models` ayarlıysa, bu `/model` ve herhangi bir
    oturum geçersiz kılması için **allowlist** olur. Bu listede olmayan bir modeli seç
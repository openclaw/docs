---
read_when:
    - Ajan çalışma alanını veya dosya düzenini açıklamanız gerekir
    - Bir ajan çalışma alanını yedeklemek veya taşımak istiyorsunuz
sidebarTitle: Agent workspace
summary: 'Ajan çalışma alanı: konum, düzen ve yedekleme stratejisi'
title: Ajan çalışma alanı
x-i18n:
    generated_at: "2026-05-06T09:06:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: be5c4c55f3cda5dcf6b763f8e59fa926283cee18270a58dbd62593947a55e67c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

Çalışma alanı, ajanın evidir. Dosya araçları ve çalışma alanı bağlamı için kullanılan tek çalışma dizinidir. Onu özel tutun ve bellek gibi ele alın.

Bu, yapılandırma, kimlik bilgileri ve oturumları depolayan `~/.openclaw/` dizininden ayrıdır.

<Warning>
Çalışma alanı **varsayılan cwd**'dir, katı bir sandbox değildir. Araçlar göreli yolları çalışma alanına göre çözer, ancak sandboxing etkin değilse mutlak yollar ana makinede başka yerlere yine de erişebilir. Yalıtım gerekiyorsa [`agents.defaults.sandbox`](/tr/gateway/sandboxing) (ve/veya ajan başına sandbox yapılandırması) kullanın.

Sandboxing etkinleştirildiğinde ve `workspaceAccess` `"rw"` değilse, araçlar ana makine çalışma alanınızda değil, `~/.openclaw/sandboxes` altındaki bir sandbox çalışma alanında çalışır.
</Warning>

## Varsayılan konum

- Varsayılan: `~/.openclaw/workspace`
- `OPENCLAW_PROFILE` ayarlanmışsa ve `"default"` değilse, varsayılan `~/.openclaw/workspace-<profile>` olur.
- `~/.openclaw/openclaw.json` içinde geçersiz kılın:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure` veya `openclaw setup`, çalışma alanını oluşturur ve eksikse başlangıç dosyalarını yerleştirir.

<Note>
Sandbox tohum kopyaları yalnızca çalışma alanı içindeki normal dosyaları kabul eder; kaynak çalışma alanının dışına çözümlenen symlink/hardlink takma adları yok sayılır.
</Note>

Çalışma alanı dosyalarını zaten kendiniz yönetiyorsanız, başlangıç dosyası oluşturmayı devre dışı bırakabilirsiniz:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Ek çalışma alanı klasörleri

Eski kurulumlar `~/openclaw` oluşturmuş olabilir. Etrafta birden fazla çalışma alanı dizini tutmak, aynı anda yalnızca bir çalışma alanı etkin olduğu için kafa karıştırıcı kimlik doğrulama veya durum kaymasına neden olabilir.

<Note>
**Öneri:** tek bir etkin çalışma alanı tutun. Ek klasörleri artık kullanmıyorsanız, arşivleyin veya Çöp Kutusu'na taşıyın (örneğin `trash ~/openclaw`). Bilerek birden fazla çalışma alanı tutuyorsanız, `agents.defaults.workspace` değerinin etkin olana işaret ettiğinden emin olun.

`openclaw doctor`, ek çalışma alanı dizinleri algıladığında uyarır.
</Note>

## Çalışma alanı dosya haritası

Bunlar OpenClaw'ın çalışma alanı içinde beklediği standart dosyalardır:

<AccordionGroup>
  <Accordion title="AGENTS.md - çalışma talimatları">
    Ajan için çalışma talimatları ve belleği nasıl kullanması gerektiği. Her oturumun başında yüklenir. Kurallar, öncelikler ve "nasıl davranmalı" ayrıntıları için iyi bir yerdir.
  </Accordion>
  <Accordion title="SOUL.md - kişilik ve ton">
    Kişilik, ton ve sınırlar. Her oturumda yüklenir. Kılavuz: [SOUL.md kişilik kılavuzu](/tr/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - kullanıcının kim olduğu">
    Kullanıcının kim olduğu ve ona nasıl hitap edileceği. Her oturumda yüklenir.
  </Accordion>
  <Accordion title="IDENTITY.md - ad, hava, emoji">
    Ajanın adı, havası ve emojisi. Başlangıç ritüeli sırasında oluşturulur/güncellenir.
  </Accordion>
  <Accordion title="TOOLS.md - yerel araç kuralları">
    Yerel araçlarınız ve kurallarınız hakkında notlar. Araç kullanılabilirliğini denetlemez; yalnızca rehberliktir.
  </Accordion>
  <Accordion title="HEARTBEAT.md - heartbeat kontrol listesi">
    Heartbeat çalıştırmaları için isteğe bağlı küçük kontrol listesi. Token tüketimini önlemek için kısa tutun.
  </Accordion>
  <Accordion title="BOOT.md - başlangıç kontrol listesi">
    Gateway yeniden başlatıldığında otomatik olarak çalıştırılan isteğe bağlı başlangıç kontrol listesi ([internal hooks](/tr/automation/hooks) etkin olduğunda). Kısa tutun; dışa giden gönderimler için mesaj aracını kullanın.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - ilk çalıştırma ritüeli">
    Tek seferlik ilk çalıştırma ritüeli. Yalnızca yepyeni bir çalışma alanı için oluşturulur. Ritüel tamamlandıktan sonra silin.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - günlük bellek kaydı">
    Günlük bellek kaydı (günde bir dosya). Oturum başlangıcında bugünü + dünü okumanız önerilir.
  </Accordion>
  <Accordion title="MEMORY.md - düzenlenmiş uzun süreli bellek (isteğe bağlı)">
    Düzenlenmiş uzun süreli bellek. Yalnızca ana, özel oturumda yükleyin (paylaşılan/grup bağlamlarında değil). İş akışı ve otomatik bellek boşaltma için [Bellek](/tr/concepts/memory) bölümüne bakın.
  </Accordion>
  <Accordion title="skills/ - çalışma alanı Skills (isteğe bağlı)">
    Çalışma alanına özgü Skills. Bu çalışma alanı için en yüksek öncelikli skill konumu. Adlar çakıştığında proje ajanı skills, kişisel ajan skills, yönetilen skills, paketli skills ve `skills.load.extraDirs` üzerine yazar.
  </Accordion>
  <Accordion title="canvas/ - Canvas UI dosyaları (isteğe bağlı)">
    Node görünümleri için Canvas UI dosyaları (örneğin `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Herhangi bir başlangıç dosyası eksikse, OpenClaw oturuma bir "eksik dosya" işareti ekler ve devam eder. Büyük başlangıç dosyaları eklenirken kısaltılır; sınırları `agents.defaults.bootstrapMaxChars` (varsayılan: 12000) ve `agents.defaults.bootstrapTotalMaxChars` (varsayılan: 60000) ile ayarlayın. `openclaw setup`, mevcut dosyaların üzerine yazmadan eksik varsayılanları yeniden oluşturabilir.
</Note>

## Çalışma alanında NELER YOKTUR

Bunlar `~/.openclaw/` altında bulunur ve çalışma alanı reposuna commit EDİLMEMELİDİR:

- `~/.openclaw/openclaw.json` (yapılandırma)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (model kimlik doğrulama profilleri: OAuth + API anahtarları)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (ajan başına Codex çalışma zamanı hesabı, yapılandırma, skills, plugins ve yerel thread durumu)
- `~/.openclaw/credentials/` (kanal/sağlayıcı durumu ve eski OAuth içe aktarma verileri)
- `~/.openclaw/agents/<agentId>/sessions/` (oturum dökümleri + meta veriler)
- `~/.openclaw/skills/` (yönetilen skills)

Oturumları veya yapılandırmayı taşımanız gerekiyorsa, bunları ayrı kopyalayın ve sürüm denetiminin dışında tutun.

## Git yedeklemesi (önerilir, özel)

Çalışma alanını özel bellek gibi ele alın. Yedeklenmesi ve kurtarılabilir olması için onu **özel** bir git reposuna koyun.

Bu adımları Gateway'in çalıştığı makinede çalıştırın (çalışma alanının bulunduğu yer orasıdır).

<Steps>
  <Step title="Repo'yu başlatın">
    Git kuruluysa, yepyeni çalışma alanları otomatik olarak başlatılır. Bu çalışma alanı zaten bir repo değilse şunu çalıştırın:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Özel bir remote ekleyin">
    <Tabs>
      <Tab title="GitHub web UI">
        1. GitHub'da yeni bir **özel** repository oluşturun.
        2. README ile başlatmayın (merge çakışmalarını önler).
        3. HTTPS remote URL'sini kopyalayın.
        4. Remote'u ekleyip push edin:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub CLI (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="GitLab web UI">
        1. GitLab'de yeni bir **özel** repository oluşturun.
        2. README ile başlatmayın (merge çakışmalarını önler).
        3. HTTPS remote URL'sini kopyalayın.
        4. Remote'u ekleyip push edin:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Sürekli güncellemeler">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## Gizli bilgileri commit etmeyin

<Warning>
Özel bir repoda bile, çalışma alanında gizli bilgileri saklamaktan kaçının:

- API anahtarları, OAuth token'ları, parolalar veya özel kimlik bilgileri.
- `~/.openclaw/` altındaki her şey.
- Sohbetlerin veya hassas eklerin ham dökümleri.

Hassas referansları saklamanız gerekiyorsa, yer tutucular kullanın ve gerçek gizli bilgiyi başka bir yerde tutun (parola yöneticisi, ortam değişkenleri veya `~/.openclaw/`).
</Warning>

Önerilen `.gitignore` başlangıcı:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Çalışma alanını yeni bir makineye taşıma

<Steps>
  <Step title="Repo'yu klonlayın">
    Repo'yu istenen yola klonlayın (varsayılan `~/.openclaw/workspace`).
  </Step>
  <Step title="Yapılandırmayı güncelleyin">
    `~/.openclaw/openclaw.json` içinde `agents.defaults.workspace` değerini bu yola ayarlayın.
  </Step>
  <Step title="Eksik dosyaları yerleştirin">
    Eksik dosyaları yerleştirmek için `openclaw setup --workspace <path>` çalıştırın.
  </Step>
  <Step title="Oturumları kopyalayın (isteğe bağlı)">
    Oturumlara ihtiyacınız varsa, eski makineden `~/.openclaw/agents/<agentId>/sessions/` dizinini ayrı olarak kopyalayın.
  </Step>
</Steps>

## Gelişmiş notlar

- Çok ajanlı yönlendirme, ajan başına farklı çalışma alanları kullanabilir. Yönlendirme yapılandırması için [Kanal yönlendirme](/tr/channels/channel-routing) bölümüne bakın.
- `agents.defaults.sandbox` etkinse, ana olmayan oturumlar `agents.defaults.sandbox.workspaceRoot` altında oturum başına sandbox çalışma alanları kullanabilir.

## İlgili

- [Heartbeat](/tr/gateway/heartbeat) - HEARTBEAT.md çalışma alanı dosyası
- [Sandboxing](/tr/gateway/sandboxing) - sandboxed ortamlarda çalışma alanı erişimi
- [Oturum](/tr/concepts/session) - oturum depolama yolları
- [Kalıcı talimatlar](/tr/automation/standing-orders) - çalışma alanı dosyalarındaki kalıcı talimatlar

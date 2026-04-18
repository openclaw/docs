---
read_when:
    - Ajan çalışma alanını veya dosya düzenini açıklamanız gerekir.
    - Bir ajan çalışma alanını yedeklemek veya taşımak istiyorsunuz.
summary: 'Ajan çalışma alanı: konum, düzen ve yedekleme stratejisi'
title: Ajan Çalışma Alanı
x-i18n:
    generated_at: "2026-04-18T08:32:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd2e74614d8d45df04b1bbda48e2224e778b621803d774d38e4b544195eb234e
    source_path: concepts/agent-workspace.md
    workflow: 15
---

# Ajan çalışma alanı

Çalışma alanı, ajanın evidir. Dosya araçları ve çalışma alanı bağlamı için kullanılan tek çalışma dizinidir. Onu özel tutun ve bellek olarak değerlendirin.

Bu, yapılandırma, kimlik bilgileri ve oturumları depolayan `~/.openclaw/` dizininden ayrıdır.

**Önemli:** çalışma alanı, katı bir sandbox değil, **varsayılan cwd**'dir. Araçlar göreli yolları çalışma alanına göre çözer, ancak sandboxing etkin değilse mutlak yollar yine de ana makinedeki başka yerlere erişebilir. İzolasyona ihtiyacınız varsa [`agents.defaults.sandbox`](/tr/gateway/sandboxing) (ve/veya ajan başına sandbox yapılandırması) kullanın. Sandboxing etkin olduğunda ve `workspaceAccess` `"rw"` olmadığında, araçlar ana makine çalışma alanınızda değil, `~/.openclaw/sandboxes` altındaki bir sandbox çalışma alanında çalışır.

## Varsayılan konum

- Varsayılan: `~/.openclaw/workspace`
- `OPENCLAW_PROFILE` ayarlıysa ve `"default"` değilse, varsayılan şu olur:
  `~/.openclaw/workspace-<profile>`.
- `~/.openclaw/openclaw.json` içinde geçersiz kılın:

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`, `openclaw configure` veya `openclaw setup`, çalışma alanını oluşturur ve eksiklerse önyükleme dosyalarını yerleştirir.
Sandbox seed kopyaları yalnızca çalışma alanı içindeki normal dosyaları kabul eder; kaynak çalışma alanı dışına çözümlenen symlink/hardlink takma adları yok sayılır.

Çalışma alanı dosyalarını zaten kendiniz yönetiyorsanız, önyükleme dosyası oluşturmayı devre dışı bırakabilirsiniz:

```json5
{ agent: { skipBootstrap: true } }
```

## Ek çalışma alanı klasörleri

Eski kurulumlar `~/openclaw` oluşturmuş olabilir. Birden fazla çalışma alanı dizinini etrafta tutmak, aynı anda yalnızca bir çalışma alanı etkin olduğundan, kafa karıştırıcı kimlik doğrulama veya durum kaymasına neden olabilir.

**Öneri:** tek bir etkin çalışma alanı bulundurun. Ek klasörleri artık kullanmıyorsanız, arşivleyin veya Çöp Kutusu'na taşıyın (örneğin `trash ~/openclaw`).
Kasıtlı olarak birden fazla çalışma alanı tutuyorsanız, `agents.defaults.workspace` ayarının etkin olanı işaret ettiğinden emin olun.

`openclaw doctor`, ek çalışma alanı dizinleri algıladığında uyarır.

## Çalışma alanı dosya haritası (her dosyanın anlamı)

Bunlar, OpenClaw'un çalışma alanı içinde beklediği standart dosyalardır:

- `AGENTS.md`
  - Ajan için çalışma talimatları ve belleği nasıl kullanması gerektiği.
  - Her oturumun başında yüklenir.
  - Kurallar, öncelikler ve "nasıl davranmalı" ayrıntıları için iyi bir yerdir.

- `SOUL.md`
  - Kişilik, ton ve sınırlar.
  - Her oturumda yüklenir.
  - Kılavuz: [SOUL.md Kişilik Kılavuzu](/tr/concepts/soul)

- `USER.md`
  - Kullanıcının kim olduğu ve ona nasıl hitap edileceği.
  - Her oturumda yüklenir.

- `IDENTITY.md`
  - Ajanın adı, havası ve emojisi.
  - Önyükleme ritüeli sırasında oluşturulur/güncellenir.

- `TOOLS.md`
  - Yerel araçlarınız ve kurallarınız hakkında notlar.
  - Araç kullanılabilirliğini kontrol etmez; yalnızca rehberlik sağlar.

- `HEARTBEAT.md`
  - Heartbeat çalıştırmaları için isteğe bağlı küçük kontrol listesi.
  - Token tüketimini önlemek için kısa tutun.

- `BOOT.md`
  - İç hook'lar etkin olduğunda Gateway yeniden başlatıldığında yürütülen isteğe bağlı başlangıç kontrol listesi.
  - Kısa tutun; dışa giden gönderimler için message aracını kullanın.

- `BOOTSTRAP.md`
  - Tek seferlik ilk çalıştırma ritüeli.
  - Yalnızca yepyeni bir çalışma alanı için oluşturulur.
  - Ritüel tamamlandıktan sonra silin.

- `memory/YYYY-MM-DD.md`
  - Günlük bellek günlüğü (günde bir dosya).
  - Oturum başlangıcında bugün + dünü okumanız önerilir.

- `MEMORY.md` (isteğe bağlı)
  - Düzenlenmiş uzun vadeli bellek.
  - Yalnızca ana, özel oturumda yükleyin (paylaşılan/grup bağlamlarında değil).

İş akışı ve otomatik bellek flush işlemi için [Bellek](/tr/concepts/memory) bölümüne bakın.

- `skills/` (isteğe bağlı)
  - Çalışma alanına özgü Skills.
  - O çalışma alanı için en yüksek öncelikli Skill konumu.
  - Ad çakışması olduğunda proje ajan Skills, kişisel ajan Skills, yönetilen Skills, paketlenmiş Skills ve `skills.load.extraDirs` öğelerini geçersiz kılar.

- `canvas/` (isteğe bağlı)
  - Node görüntüleri için Canvas UI dosyaları (örneğin `canvas/index.html`).

Herhangi bir önyükleme dosyası eksikse, OpenClaw oturuma "eksik dosya" işaretçisi ekler ve devam eder. Büyük önyükleme dosyaları oturuma eklenirken kırpılır; sınırları `agents.defaults.bootstrapMaxChars` (varsayılan: 12000) ve `agents.defaults.bootstrapTotalMaxChars` (varsayılan: 60000) ile ayarlayın.
`openclaw setup`, mevcut dosyaların üzerine yazmadan eksik varsayılanları yeniden oluşturabilir.

## Çalışma alanında OLMAYANLAR

Bunlar `~/.openclaw/` altında bulunur ve çalışma alanı reposuna **commit edilmemelidir**:

- `~/.openclaw/openclaw.json` (yapılandırma)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (model kimlik doğrulama profilleri: OAuth + API anahtarları)
- `~/.openclaw/credentials/` (kanal/sağlayıcı durumu ve eski OAuth içe aktarma verileri)
- `~/.openclaw/agents/<agentId>/sessions/` (oturum dökümleri + metadata)
- `~/.openclaw/skills/` (yönetilen Skills)

Oturumları veya yapılandırmayı taşımanız gerekiyorsa, bunları ayrı olarak kopyalayın ve sürüm kontrolünün dışında tutun.

## Git yedeği (önerilen, özel)

Çalışma alanını özel bellek olarak değerlendirin. Yedeklenebilir ve geri yüklenebilir olması için onu **özel** bir git reposuna koyun.

Bu adımları Gateway'in çalıştığı makinede uygulayın (çalışma alanı orada bulunur).

### 1) Repoyu başlatın

Git yüklüyse, yepyeni çalışma alanları otomatik olarak başlatılır. Bu çalışma alanı henüz bir repo değilse, şunu çalıştırın:

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) Özel bir remote ekleyin (başlangıç dostu seçenekler)

Seçenek A: GitHub web arayüzü

1. GitHub üzerinde yeni bir **özel** repo oluşturun.
2. README ile başlatmayın (merge çatışmalarını önler).
3. HTTPS remote URL'sini kopyalayın.
4. Remote'u ekleyin ve push edin:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

Seçenek B: GitHub CLI (`gh`)

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

Seçenek C: GitLab web arayüzü

1. GitLab üzerinde yeni bir **özel** repo oluşturun.
2. README ile başlatmayın (merge çatışmalarını önler).
3. HTTPS remote URL'sini kopyalayın.
4. Remote'u ekleyin ve push edin:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3) Sürekli güncellemeler

```bash
git status
git add .
git commit -m "Update memory"
git push
```

## Sırları commit etmeyin

Özel bir repoda bile, sırları çalışma alanında depolamaktan kaçının:

- API anahtarları, OAuth token'ları, parolalar veya özel kimlik bilgileri.
- `~/.openclaw/` altındaki herhangi bir şey.
- Sohbetlerin ham dökümleri veya hassas ekler.

Hassas referanslar depolamanız gerekiyorsa, yer tutucular kullanın ve gerçek sırrı başka bir yerde saklayın (parola yöneticisi, ortam değişkenleri veya `~/.openclaw/`).

Önerilen `.gitignore` başlangıcı:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Çalışma alanını yeni bir makineye taşıma

1. Repoyu istediğiniz yola clone edin (varsayılan `~/.openclaw/workspace`).
2. `~/.openclaw/openclaw.json` içinde `agents.defaults.workspace` ayarını bu yola ayarlayın.
3. Eksik dosyaları yerleştirmek için `openclaw setup --workspace <path>` komutunu çalıştırın.
4. Oturumlara ihtiyacınız varsa, `~/.openclaw/agents/<agentId>/sessions/` dizinini eski makineden ayrıca kopyalayın.

## Gelişmiş notlar

- Çok ajanlı yönlendirme, ajan başına farklı çalışma alanları kullanabilir. Yönlendirme yapılandırması için [Kanal yönlendirme](/tr/channels/channel-routing) bölümüne bakın.
- `agents.defaults.sandbox` etkinse, ana olmayan oturumlar `agents.defaults.sandbox.workspaceRoot` altında oturum başına sandbox çalışma alanları kullanabilir.

## İlgili

- [Standing Orders](/tr/automation/standing-orders) — çalışma alanı dosyalarındaki kalıcı talimatlar
- [Heartbeat](/tr/gateway/heartbeat) — HEARTBEAT.md çalışma alanı dosyası
- [Session](/tr/concepts/session) — oturum depolama yolları
- [Sandboxing](/tr/gateway/sandboxing) — sandbox ortamlarında çalışma alanı erişimi

---
read_when:
    - Yeni bir OpenClaw aracı oturumu başlatma
    - Varsayılan Skills’leri etkinleştirme veya denetleme
summary: Kişisel asistan kurulumu için varsayılan OpenClaw aracı talimatları ve Skills listesi
title: Varsayılan AGENTS.md
x-i18n:
    generated_at: "2026-04-24T09:28:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce1ce4e8bd84ca8913dc30112fd2d7ec81782c1f84f62eb8cc5c1032e9b060da
    source_path: reference/AGENTS.default.md
    workflow: 15
---

# AGENTS.md - OpenClaw Kişisel Asistanı (varsayılan)

## İlk çalıştırma (önerilen)

OpenClaw, aracı için ayrılmış bir çalışma alanı dizini kullanır. Varsayılan: `~/.openclaw/workspace` (`agents.defaults.workspace` ile yapılandırılabilir).

1. Çalışma alanını oluşturun (zaten yoksa):

```bash
mkdir -p ~/.openclaw/workspace
```

2. Varsayılan çalışma alanı şablonlarını çalışma alanına kopyalayın:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. İsteğe bağlı: Kişisel asistan Skills listesini istiyorsanız, AGENTS.md’yi bu dosyayla değiştirin:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. İsteğe bağlı: `agents.defaults.workspace` ayarlayarak farklı bir çalışma alanı seçin (`~` desteklenir):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Varsayılan güvenlik ayarları

- Dizinleri veya sırları sohbete dökmeyin.
- Açıkça istenmedikçe yıkıcı komutlar çalıştırmayın.
- Harici mesajlaşma yüzeylerine kısmi/akışlı yanıtlar göndermeyin (yalnızca nihai yanıtlar).

## Oturum başlangıcı (zorunlu)

- `SOUL.md`, `USER.md` ve `memory/` içindeki bugün+dünü okuyun.
- Varsa `MEMORY.md` dosyasını okuyun.
- Yanıt vermeden önce bunu yapın.

## Soul (zorunlu)

- `SOUL.md` kimliği, tonu ve sınırları tanımlar. Güncel tutun.
- `SOUL.md` dosyasını değiştirirseniz kullanıcıya söyleyin.
- Her oturumda yeni bir örneksiniz; süreklilik bu dosyalarda yaşar.

## Paylaşılan alanlar (önerilen)

- Kullanıcının sesi siz değilsiniz; grup sohbetlerinde veya herkese açık kanallarda dikkatli olun.
- Özel verileri, iletişim bilgilerini veya dahili notları paylaşmayın.

## Bellek sistemi (önerilen)

- Günlük kayıt: `memory/YYYY-MM-DD.md` (gerekirse `memory/` oluşturun).
- Uzun vadeli bellek: kalıcı gerçekler, tercihler ve kararlar için `MEMORY.md`.
- Küçük harfli `memory.md` yalnızca eski onarım girdisidir; kökte iki dosyayı bilerek bir arada tutmayın.
- Oturum başlangıcında bugün + dün + varsa `MEMORY.md` dosyasını okuyun.
- Şunları kaydedin: kararlar, tercihler, kısıtlamalar, açık döngüler.
- Açıkça istenmedikçe sırlardan kaçının.

## Araçlar ve Skills

- Araçlar Skills içinde bulunur; gerektiğinde her Skill’in `SKILL.md` dosyasını izleyin.
- Ortama özgü notları `TOOLS.md` içinde tutun (Skills için Notlar).

## Yedekleme ipucu (önerilen)

Bu çalışma alanını Clawd’un “belleği” olarak görüyorsanız, `AGENTS.md` ve bellek dosyalarınız yedeklensin diye bunu bir git deposu yapın (tercihen özel).

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# İsteğe bağlı: özel bir uzak depo ekleyin + push edin
```

## OpenClaw Ne Yapar

- Asistanın sohbetleri okuyup yazabilmesi, bağlam getirebilmesi ve ana Mac üzerinden Skills çalıştırabilmesi için WhatsApp Gateway + Pi kodlama aracısını çalıştırır.
- macOS uygulaması izinleri (ekran kaydı, bildirimler, mikrofon) yönetir ve paketlenmiş ikili dosyası üzerinden `openclaw` CLI’sini sunar.
- Doğrudan sohbetler varsayılan olarak aracının `main` oturumuna daraltılır; gruplar `agent:<agentId>:<channel>:group:<id>` olarak yalıtılmış kalır (odalar/kanallar: `agent:<agentId>:<channel>:channel:<id>`); Heartbeat’ler arka plan görevlerini canlı tutar.

## Çekirdek Skills (Ayarlar → Skills içinde etkinleştirin)

- **mcporter** — Harici Skill arka uçlarını yönetmek için araç sunucusu çalışma zamanı/CLI.
- **Peekaboo** — İsteğe bağlı AI görsel analiziyle hızlı macOS ekran görüntüleri.
- **camsnap** — RTSP/ONVIF güvenlik kameralarından kareler, klipler veya hareket uyarıları yakalayın.
- **oracle** — Oturum yeniden oynatma ve tarayıcı denetimi içeren, OpenAI’ye hazır aracı CLI’si.
- **eightctl** — Uykunuzu terminalden denetleyin.
- **imsg** — iMessage ve SMS gönderin, okuyun, akışını izleyin.
- **wacli** — WhatsApp CLI: eşitle, ara, gönder.
- **discord** — Discord eylemleri: reaction, çıkartmalar, anketler. `user:<id>` veya `channel:<id>` hedeflerini kullanın (yalın sayısal kimlikler belirsizdir).
- **gog** — Google Suite CLI: Gmail, Calendar, Drive, Contacts.
- **spotify-player** — Oynatmayı aramak/kuyruğa almak/denetlemek için terminal Spotify istemcisi.
- **sag** — mac tarzı say UX’i ile ElevenLabs konuşma; varsayılan olarak hoparlörlere akış yapar.
- **Sonos CLI** — Sonos hoparlörlerini betiklerden denetleyin (keşif/durum/oynatma/ses düzeyi/gruplama).
- **blucli** — BluOS oynatıcılarını betiklerden oynatın, gruplayın ve otomatikleştirin.
- **OpenHue CLI** — Sahneler ve otomasyonlar için Philips Hue aydınlatma denetimi.
- **OpenAI Whisper** — Hızlı dikte ve sesli mesaj dökümleri için yerel konuşmadan metne.
- **Gemini CLI** — Hızlı soru-cevap için terminalden Google Gemini modelleri.
- **agent-tools** — Otomasyonlar ve yardımcı betikler için yardımcı araç takımı.

## Kullanım notları

- Betikleme için `openclaw` CLI’sini tercih edin; izinleri mac uygulaması yönetir.
- Kurulumları Skills sekmesinden çalıştırın; bir ikili dosya zaten mevcutsa düğmeyi gizler.
- Asistanın hatırlatıcılar zamanlayabilmesi, gelen kutularını izleyebilmesi ve kamera yakalamalarını tetikleyebilmesi için Heartbeat’leri etkin tutun.
- Canvas kullanıcı arayüzü yerel katmanlarla tam ekran çalışır. Kritik denetimleri sol üst/sağ üst/alt kenarlara yerleştirmekten kaçının; yerleşime açık oluklar ekleyin ve güvenli alan iç boşluklarına güvenmeyin.
- Tarayıcı güdümlü doğrulama için OpenClaw tarafından yönetilen Chrome profiliyle `openclaw browser` kullanın (sekmeler/durum/ekran görüntüsü).
- DOM incelemesi için `openclaw browser eval|query|dom|snapshot` kullanın (makine çıktısına ihtiyacınız olduğunda `--json`/`--out` ile).
- Etkileşimler için `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` kullanın (`click`/`type` snapshot başvuruları gerektirir; CSS seçicileri için `evaluate` kullanın).

## İlgili

- [Aracı çalışma alanı](/tr/concepts/agent-workspace)
- [Aracı çalışma zamanı](/tr/concepts/agent)

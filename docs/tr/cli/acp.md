---
read_when:
    - ACP tabanlı IDE entegrasyonlarını ayarlama
    - ACP oturumunun Gateway'e yönlendirilmesinde hata ayıklama
summary: IDE entegrasyonları için ACP köprüsünü çalıştırın
title: ACP
x-i18n:
    generated_at: "2026-05-06T09:04:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: c91de534078b4d49b2776d7a85264d2ba8d7bdd7a3cd715ce615b4b4b26c6528
    source_path: cli/acp.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) köprüsünü, bir OpenClaw Gateway ile konuşacak şekilde çalıştırın.

Bu komut, IDE'ler için stdio üzerinden ACP konuşur ve istemleri WebSocket
üzerinden Gateway'e iletir. ACP oturumlarını Gateway oturum anahtarlarıyla eşli
tutar.

`openclaw acp`, Gateway destekli bir ACP köprüsüdür; tam bir ACP yerel editör
çalışma zamanı değildir. Oturum yönlendirme, istem iletimi ve temel akış
güncellemelerine odaklanır.

Bir ACP harness oturumu barındırmak yerine harici bir MCP istemcisinin doğrudan
OpenClaw kanal konuşmalarıyla konuşmasını istiyorsanız bunun yerine
[`openclaw mcp serve`](/tr/cli/mcp) kullanın.

## Bu ne değildir

Bu sayfa sık sık ACP harness oturumlarıyla karıştırılır.

`openclaw acp` şu anlama gelir:

- OpenClaw bir ACP sunucusu gibi davranır
- bir IDE veya ACP istemcisi OpenClaw'a bağlanır
- OpenClaw bu işi bir Gateway oturumuna iletir

Bu, OpenClaw'ın Codex veya Claude Code gibi harici bir harness'i `acpx` üzerinden
çalıştırdığı [ACP Aracıları](/tr/tools/acp-agents) durumundan farklıdır.

Hızlı kural:

- editör/istemci OpenClaw ile ACP konuşmak istiyorsa: `openclaw acp` kullanın
- OpenClaw, Codex/Claude/Gemini'yi ACP harness olarak başlatmalıysa: `/acp spawn` ve [ACP Aracıları](/tr/tools/acp-agents) kullanın

## Uyumluluk Matrisi

| ACP alanı                                                             | Durum          | Notlar                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Uygulandı      | stdio üzerinden Gateway chat/send + abort'a giden temel köprü akışı.                                                                                                                                                                        |
| `listSessions`, slash komutları                                       | Uygulandı      | Oturum listesi Gateway oturum durumuna göre çalışır; komutlar `available_commands_update` üzerinden duyurulur.                                                                                                                             |
| `loadSession`                                                         | Kısmi          | ACP oturumunu bir Gateway oturum anahtarına yeniden bağlar ve saklanan kullanıcı/asistan metin geçmişini yeniden oynatır. Araç/sistem geçmişi henüz yeniden oluşturulmaz.                                                                   |
| İstem içeriği (`text`, gömülü `resource`, görseller)                  | Kısmi          | Metin/kaynaklar sohbet girdisine düzleştirilir; görseller Gateway eklerine dönüşür.                                                                                                                                                        |
| Oturum modları                                                        | Kısmi          | `session/set_mode` desteklenir ve köprü; düşünce düzeyi, araç ayrıntı düzeyi, reasoning, kullanım ayrıntısı ve yükseltilmiş eylemler için başlangıç Gateway destekli oturum kontrolleri sunar. Daha geniş ACP yerel mod/yapılandırma yüzeyleri hâlâ kapsam dışıdır. |
| Oturum bilgisi ve kullanım güncellemeleri                             | Kısmi          | Köprü, önbelleğe alınmış Gateway oturum anlık görüntülerinden `session_info_update` ve en iyi çaba `usage_update` bildirimleri yayar. Kullanım yaklaşıktır ve yalnızca Gateway token toplamları güncel olarak işaretlendiğinde gönderilir. |
| Araç akışı                                                            | Kısmi          | `tool_call` / `tool_call_update` olayları, Gateway araç argümanları/sonuçları bunları açığa çıkardığında ham G/Ç, metin içeriği ve en iyi çaba dosya konumlarını içerir. Gömülü terminaller ve daha zengin diff yerel çıktı hâlâ sunulmaz. |
| Oturum başına MCP sunucuları (`mcpServers`)                           | Desteklenmiyor | Köprü modu, oturum başına MCP sunucu isteklerini reddeder. MCP'yi bunun yerine OpenClaw Gateway veya aracı üzerinde yapılandırın.                                                                                                           |
| İstemci dosya sistemi yöntemleri (`fs/read_text_file`, `fs/write_text_file`) | Desteklenmiyor | Köprü, ACP istemci dosya sistemi yöntemlerini çağırmaz.                                                                                                                                                                                     |
| İstemci terminal yöntemleri (`terminal/*`)                            | Desteklenmiyor | Köprü, ACP istemci terminalleri oluşturmaz veya terminal kimliklerini araç çağrıları üzerinden akıtmaz.                                                                                                                                     |
| Oturum planları / düşünce akışı                                       | Desteklenmiyor | Köprü şu anda ACP planı veya düşünce güncellemeleri değil, çıktı metni ve araç durumu yayar.                                                                                                                                                |

## Bilinen Sınırlamalar

- `loadSession`, saklanan kullanıcı ve asistan metin geçmişini yeniden oynatır,
  ancak geçmiş araç çağrılarını, sistem bildirimlerini veya daha zengin ACP yerel
  olay türlerini yeniden oluşturmaz.
- Birden fazla ACP istemcisi aynı Gateway oturum anahtarını paylaşıyorsa olay ve
  iptal yönlendirmesi, istemci başına katı biçimde yalıtılmış olmak yerine en
  iyi çaba düzeyindedir. Temiz editör yerel dönüşlere ihtiyaç duyduğunuzda
  varsayılan yalıtılmış `acp:<uuid>` oturumlarını tercih edin.
- Gateway durdurma durumları ACP durdurma nedenlerine çevrilir, ancak bu eşleme
  tamamen ACP yerel bir çalışma zamanına göre daha az ifade gücüne sahiptir.
- Başlangıç oturum kontrolleri şu anda Gateway ayar düğmelerinin odaklı bir alt
  kümesini sunar: düşünce düzeyi, araç ayrıntı düzeyi, reasoning, kullanım
  ayrıntısı ve yükseltilmiş eylemler. Model seçimi ve exec-host kontrolleri
  henüz ACP yapılandırma seçenekleri olarak sunulmaz.
- `session_info_update` ve `usage_update`, canlı ACP yerel çalışma zamanı
  muhasebesinden değil Gateway oturum anlık görüntülerinden türetilir. Kullanım
  yaklaşıktır, maliyet verisi taşımaz ve yalnızca Gateway toplam token verisini
  güncel olarak işaretlediğinde yayılır.
- Araç izleme verisi en iyi çaba düzeyindedir. Köprü, bilinen araç
  argümanlarında/sonuçlarında görünen dosya yollarını gösterebilir, ancak henüz
  ACP terminalleri veya yapılandırılmış dosya diff'leri yaymaz.

## Kullanım

```bash
openclaw acp

# Remote Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Remote Gateway (token from file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Attach to an existing session key
openclaw acp --session agent:main:main

# Attach by label (must already exist)
openclaw acp --session-label "support inbox"

# Reset the session key before the first prompt
openclaw acp --session agent:main:main --reset-session
```

## ACP istemcisi (hata ayıklama)

Köprüyü bir IDE olmadan sağlamlık açısından kontrol etmek için yerleşik ACP
istemcisini kullanın. ACP köprüsünü başlatır ve istemleri etkileşimli olarak
yazmanıza olanak tanır.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

İzin modeli (istemci hata ayıklama modu):

- Otomatik onay, izin listesi temellidir ve yalnızca güvenilir temel araç kimlikleri için geçerlidir.
- `read` otomatik onayı, geçerli çalışma diziniyle kapsamlanır (`--cwd` ayarlandığında).
- ACP yalnızca dar readonly sınıfları otomatik onaylar: etkin cwd altındaki kapsamlı `read` çağrıları ve readonly arama araçları (`search`, `web_search`, `memory_search`). Bilinmeyen/çekirdek dışı araçlar, kapsam dışı okumalar, exec yapabilen araçlar, kontrol düzlemi araçları, mutasyon yapan araçlar ve etkileşimli akışlar her zaman açık istem onayı gerektirir.
- Sunucunun sağladığı `toolCall.kind`, güvenilmeyen metadata olarak ele alınır (yetkilendirme kaynağı değildir).
- Bu ACP köprü ilkesi ACPX harness izinlerinden ayrıdır. OpenClaw'ı `acpx` arka ucu üzerinden çalıştırırsanız, `plugins.entries.acpx.config.permissionMode=approve-all` o harness oturumu için break-glass "yolo" anahtarıdır.

## Bunu nasıl kullanırsınız

Bir IDE (veya başka bir istemci) Agent Client Protocol konuşuyorsa ve bunun bir
OpenClaw Gateway oturumunu sürmesini istiyorsanız ACP kullanın.

1. Gateway'in çalıştığından emin olun (yerel veya uzak).
2. Gateway hedefini yapılandırın (yapılandırma veya bayraklar).
3. IDE'nizi stdio üzerinden `openclaw acp` çalıştıracak şekilde ayarlayın.

Örnek yapılandırma (kalıcı):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Örnek doğrudan çalıştırma (yapılandırma yazmadan):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Aracı seçme

ACP aracıları doğrudan seçmez. Gateway oturum anahtarına göre yönlendirir.

Belirli bir aracı hedeflemek için aracı kapsamlı oturum anahtarlarını kullanın:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Her ACP oturumu tek bir Gateway oturum anahtarıyla eşlenir. Bir aracının birçok
oturumu olabilir; anahtarı veya etiketi geçersiz kılmazsanız ACP varsayılan
olarak yalıtılmış bir `acp:<uuid>` oturumunu kullanır.

Köprü modunda oturum başına `mcpServers` desteklenmez. Bir ACP istemcisi bunları
`newSession` veya `loadSession` sırasında gönderirse köprü, bunları sessizce
yok saymak yerine açık bir hata döndürür.

ACPX destekli oturumların OpenClaw Plugin araçlarını veya `cron` gibi seçili
yerleşik araçları görmesini istiyorsanız, oturum başına `mcpServers` geçirmeye
çalışmak yerine Gateway tarafı ACPX MCP köprülerini etkinleştirin. Bkz.
[ACP Aracıları](/tr/tools/acp-agents-setup#plugin-tools-mcp-bridge) ve
[OpenClaw araçları MCP köprüsü](/tr/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## `acpx` üzerinden kullanma (Codex, Claude, diğer ACP istemcileri)

Codex veya Claude Code gibi bir kodlama aracısının OpenClaw botunuzla ACP
üzerinden konuşmasını istiyorsanız, yerleşik `openclaw` hedefiyle `acpx`
kullanın.

Tipik akış:

1. Gateway'i çalıştırın ve ACP köprüsünün ona erişebildiğinden emin olun.
2. `acpx openclaw` öğesini `openclaw acp` hedefine yöneltin.
3. Kodlama aracısının kullanmasını istediğiniz OpenClaw oturum anahtarını hedefleyin.

Örnekler:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

`acpx openclaw` komutunun her seferinde belirli bir Gateway ve oturum anahtarını
hedeflemesini istiyorsanız, `~/.acpx/config.json` içindeki `openclaw` aracı
komutunu geçersiz kılın:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Depo yerel bir OpenClaw checkout'ı için dev runner yerine doğrudan CLI giriş
noktasını kullanın, böylece ACP akışı temiz kalır. Örneğin:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Bu, Codex, Claude Code veya ACP farkındalığı olan başka bir istemcinin terminal
kazıması yapmadan bir OpenClaw aracısından bağlamsal bilgi çekmesini sağlamanın
en kolay yoludur.

## Zed editörü kurulumu

`~/.config/zed/settings.json` içine özel bir ACP aracısı ekleyin (veya Zed'in Settings UI'ını kullanın):

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

Belirli bir Gateway veya ajanı hedeflemek için:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

Zed'de, bir iş parçacığı başlatmak için Ajan panelini açın ve "OpenClaw ACP" seçeneğini belirleyin.

## Oturum eşlemesi

Varsayılan olarak, ACP oturumları `acp:` ön ekine sahip yalıtılmış bir Gateway oturum anahtarı alır.
Bilinen bir oturumu yeniden kullanmak için bir oturum anahtarı veya etiketi geçirin:

- `--session <key>`: belirli bir Gateway oturum anahtarı kullanın.
- `--session-label <label>`: mevcut bir oturumu etikete göre çözümleyin.
- `--reset-session`: bu anahtar için yeni bir oturum kimliği üretin (aynı anahtar, yeni transkript).

ACP istemciniz metadata destekliyorsa oturum başına geçersiz kılabilirsiniz:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Oturum anahtarları hakkında daha fazla bilgi için [/concepts/session](/tr/concepts/session) sayfasına bakın.

## Seçenekler

- `--url <url>`: Gateway WebSocket URL'si (yapılandırıldığında varsayılan olarak gateway.remote.url kullanılır).
- `--token <token>`: Gateway kimlik doğrulama belirteci.
- `--token-file <path>`: Gateway kimlik doğrulama belirtecini dosyadan oku.
- `--password <password>`: Gateway kimlik doğrulama parolası.
- `--password-file <path>`: Gateway kimlik doğrulama parolasını dosyadan oku.
- `--session <key>`: varsayılan oturum anahtarı.
- `--session-label <label>`: çözümlenecek varsayılan oturum etiketi.
- `--require-existing`: oturum anahtarı/etiketi yoksa başarısız ol.
- `--reset-session`: ilk kullanımdan önce oturum anahtarını sıfırla.
- `--no-prefix-cwd`: istemlerin başına çalışma dizinini ekleme.
- `--provenance <off|meta|meta+receipt>`: ACP köken üst verilerini veya alındılarını dahil et.
- `--verbose, -v`: stderr'ye ayrıntılı günlükleme.

Güvenlik notu:

- `--token` ve `--password` bazı sistemlerde yerel süreç listelerinde görünebilir.
- `--token-file`/`--password-file` veya ortam değişkenlerini (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`) tercih edin.
- Gateway kimlik doğrulama çözümlemesi, diğer Gateway istemcileri tarafından kullanılan paylaşılan sözleşmeyi izler:
  - yerel mod: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> yalnızca `gateway.auth.*` ayarlanmamışsa `gateway.remote.*` yedeği (yapılandırılmış ama çözümlenmemiş yerel SecretRefs güvenli şekilde başarısız olur)
  - uzak mod: uzak öncelik kurallarına göre env/config yedeğiyle `gateway.remote.*`
  - `--url` geçersiz kılma açısından güvenlidir ve örtük config/env kimlik bilgilerini yeniden kullanmaz; açık `--token`/`--password` (veya dosya varyantlarını) iletin
- ACP çalışma zamanı backend alt süreçleri `OPENCLAW_SHELL=acp` alır; bu, bağlama özgü kabuk/profil kuralları için kullanılabilir.
- `openclaw acp client`, oluşturulan köprü sürecinde `OPENCLAW_SHELL=acp-client` ayarlar.

### `acp client` seçenekleri

- `--cwd <dir>`: ACP oturumu için çalışma dizini.
- `--server <command>`: ACP sunucu komutu (varsayılan: `openclaw`).
- `--server-args <args...>`: ACP sunucusuna iletilen ek argümanlar.
- `--server-verbose`: ACP sunucusunda ayrıntılı günlüklemeyi etkinleştir.
- `--verbose, -v`: ayrıntılı istemci günlüklemesi.

## İlgili

- [CLI referansı](/tr/cli)
- [ACP ajanları](/tr/tools/acp-agents)

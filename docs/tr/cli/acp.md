---
read_when:
    - ACP tabanlı IDE entegrasyonlarını ayarlama
    - Gateway için ACP oturum yönlendirmesinde hata ayıklama
summary: IDE entegrasyonları için ACP köprüsünü çalıştırın
title: ACP
x-i18n:
    generated_at: "2026-05-10T19:27:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0614b40723ef8374c5bc26d92516ac5725ae2d8ef5e8f4db360b2259879fe320
    source_path: cli/acp.md
    workflow: 16
---

Bir OpenClaw Gateway ile konuşan [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) köprüsünü çalıştırın.

Bu komut, IDE'ler için stdio üzerinden ACP konuşur ve istemleri WebSocket
üzerinden Gateway'e iletir. ACP oturumlarını Gateway oturum anahtarlarıyla eşlenmiş halde tutar.

`openclaw acp`, tam ACP-yerel bir düzenleyici çalışma zamanı değil, Gateway destekli bir ACP köprüsüdür.
Oturum yönlendirmeye, istem teslimine ve temel akış güncellemelerine odaklanır.

Bir ACP harness oturumu barındırmak yerine harici bir MCP istemcisinin doğrudan OpenClaw kanal
konuşmalarıyla konuşmasını istiyorsanız bunun yerine
[`openclaw mcp serve`](/tr/cli/mcp) kullanın.

## Bunun ne olmadığı

Bu sayfa genellikle ACP harness oturumlarıyla karıştırılır.

`openclaw acp` şu anlama gelir:

- OpenClaw bir ACP sunucusu gibi davranır
- bir IDE veya ACP istemcisi OpenClaw'a bağlanır
- OpenClaw bu işi bir Gateway oturumuna iletir

Bu, OpenClaw'ın Codex veya Claude Code gibi harici bir harness'i `acpx` üzerinden çalıştırdığı [ACP Agents](/tr/tools/acp-agents) yaklaşımından farklıdır.

Hızlı kural:

- düzenleyici/istemci OpenClaw ile ACP konuşmak istiyorsa: `openclaw acp` kullanın
- OpenClaw, Codex/Claude/Gemini'yi bir ACP harness olarak başlatmalıysa: `/acp spawn` ve [ACP Agents](/tr/tools/acp-agents) kullanın

## Uyumluluk Matrisi

| ACP alanı                                                             | Durum       | Notlar                                                                                                                                                                                                                                          |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Uygulandı   | stdio üzerinden Gateway chat/send + abort akışına uzanan çekirdek köprü akışı.                                                                                                                                                                  |
| `listSessions`, slash komutları                                       | Uygulandı   | Oturum listesi, sınırlandırılmış imleç sayfalamasıyla Gateway oturum durumu üzerinde çalışır ve Gateway oturum satırları çalışma alanı metadata'sı taşıdığında `cwd` filtrelemesi yapar; komutlar `available_commands_update` ile duyurulur. |
| `resumeSession`, `closeSession`                                       | Uygulandı   | Resume, geçmişi yeniden oynatmadan bir ACP oturumunu mevcut bir Gateway oturumuna yeniden bağlar. Close, etkin köprü işini iptal eder, bekleyen istemleri iptal edilmiş olarak çözer ve köprü oturum durumunu serbest bırakır.                  |
| `loadSession`                                                         | Kısmi       | ACP oturumunu bir Gateway oturum anahtarına yeniden bağlar ve köprü tarafından oluşturulan oturumlar için ACP olay defteri geçmişini yeniden oynatır. Daha eski/deftersiz oturumlar saklanan kullanıcı/asistan metnine geri döner.            |
| İstem içeriği (`text`, gömülü `resource`, görseller)                  | Kısmi       | Metin/kaynaklar sohbet girdisine düzleştirilir; görseller Gateway eklerine dönüşür.                                                                                                                                                             |
| Oturum modları                                                        | Kısmi       | `session/set_mode` desteklenir ve köprü, düşünce düzeyi, araç ayrıntı düzeyi, akıl yürütme, kullanım ayrıntısı ve yükseltilmiş eylemler için başlangıçta Gateway destekli oturum denetimlerini sunar. Daha geniş ACP-yerel mod/config yüzeyleri hâlâ kapsam dışıdır. |
| Oturum bilgisi ve kullanım güncellemeleri                             | Kısmi       | Köprü, önbelleğe alınmış Gateway oturum anlık görüntülerinden `session_info_update` ve en iyi çaba `usage_update` bildirimleri yayar. Kullanım yaklaşıktır ve yalnızca Gateway token toplamları güncel olarak işaretlendiğinde gönderilir.     |
| Araç akışı                                                            | Kısmi       | `tool_call` / `tool_call_update` olayları, Gateway araç argümanları/sonuçları bunları açığa çıkardığında ham G/Ç, metin içeriği ve en iyi çaba dosya konumlarını içerir. Gömülü terminaller ve daha zengin diff-yerel çıktı hâlâ sunulmaz.    |
| Exec onayları                                                         | Kısmi       | Etkin ACP istem turları sırasında Gateway exec onay istemleri, `session/request_permission` ile ACP istemcisine aktarılır.                                                                                                                       |
| Oturum başına MCP sunucuları (`mcpServers`)                           | Desteklenmez | Köprü modu, oturum başına MCP sunucusu isteklerini reddeder. MCP'yi bunun yerine OpenClaw gateway veya agent üzerinde yapılandırın.                                                                                                             |
| İstemci dosya sistemi yöntemleri (`fs/read_text_file`, `fs/write_text_file`) | Desteklenmez | Köprü, ACP istemci dosya sistemi yöntemlerini çağırmaz.                                                                                                                                                                                         |
| İstemci terminal yöntemleri (`terminal/*`)                            | Desteklenmez | Köprü, ACP istemci terminalleri oluşturmaz veya araç çağrıları üzerinden terminal kimlikleri akıtmaz.                                                                                                                                           |
| Oturum planları / düşünce akışı                                       | Desteklenmez | Köprü şu anda ACP plan veya düşünce güncellemeleri değil, çıktı metni ve araç durumu yayar.                                                                                                                                                     |

## Bilinen Sınırlamalar

- `loadSession`, tam ACP olay defteri geçmişini yalnızca köprü tarafından
  oluşturulmuş oturumlar için yeniden oynatabilir. Daha eski/deftersiz oturumlar
  yine transkript geri dönüşünü kullanır ve geçmiş araç çağrılarını veya sistem
  bildirimlerini yeniden oluşturmaz.
- Birden fazla ACP istemcisi aynı Gateway oturum anahtarını paylaşıyorsa olay ve
  iptal yönlendirmesi istemci başına kesin biçimde yalıtılmış olmak yerine en iyi
  çabadır. Temiz, düzenleyiciye yerel turlara ihtiyaç duyduğunuzda varsayılan
  yalıtılmış `acp:<uuid>` oturumlarını tercih edin.
- Gateway durma durumları ACP durma nedenlerine çevrilir, ancak bu eşleme tam
  ACP-yerel bir çalışma zamanına göre daha az ifade gücüne sahiptir.
- Başlangıç oturum denetimleri şu anda Gateway ayarlarının odaklı bir alt kümesini
  yüzeye çıkarır: düşünce düzeyi, araç ayrıntı düzeyi, akıl yürütme, kullanım
  ayrıntısı ve yükseltilmiş eylemler. Model seçimi ve exec-host denetimleri henüz
  ACP config seçenekleri olarak sunulmaz.
- `session_info_update` ve `usage_update`, canlı ACP-yerel çalışma zamanı
  muhasebesinden değil, Gateway oturum anlık görüntülerinden türetilir. Kullanım
  yaklaşıktır, maliyet verisi taşımaz ve yalnızca Gateway toplam token verisini
  güncel olarak işaretlediğinde yayılır.
- Araç takip verileri en iyi çabadır. Köprü, bilinen araç argümanlarında/sonuçlarında
  görünen dosya yollarını yüzeye çıkarabilir, ancak henüz ACP terminalleri veya
  yapılandırılmış dosya diff'leri yaymaz.
- Exec onayı aktarımı etkin ACP istem turuyla sınırlıdır; diğer Gateway oturumlarından
  gelen onaylar yok sayılır.

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

## ACP istemcisi (debug)

Köprüyü bir IDE olmadan sağlamlık açısından kontrol etmek için yerleşik ACP istemcisini kullanın.
Bu, ACP köprüsünü başlatır ve etkileşimli olarak istem yazmanıza izin verir.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

İzin modeli (istemci debug modu):

- Otomatik onay, izin listesi tabanlıdır ve yalnızca güvenilir çekirdek araç kimliklerine uygulanır.
- `read` otomatik onayı, geçerli çalışma diziniyle sınırlıdır (`--cwd` ayarlandığında).
- ACP yalnızca dar salt okunur sınıfları otomatik onaylar: etkin cwd altındaki kapsamlı `read` çağrıları ve salt okunur arama araçları (`search`, `web_search`, `memory_search`). Bilinmeyen/çekirdek dışı araçlar, kapsam dışı okumalar, exec yetenekli araçlar, denetim düzlemi araçları, değişiklik yapan araçlar ve etkileşimli akışlar her zaman açık istem onayı gerektirir.
- Sunucunun sağladığı `toolCall.kind`, güvenilmeyen metadata olarak ele alınır (yetkilendirme kaynağı değildir).
- Bu ACP köprü ilkesi, ACPX harness izinlerinden ayrıdır. OpenClaw'ı `acpx` backend'i üzerinden çalıştırırsanız `plugins.entries.acpx.config.permissionMode=approve-all`, o harness oturumu için acil durum "yolo" anahtarıdır.

## Protokol smoke testi

Protokol düzeyinde hata ayıklama için yalıtılmış durumla bir Gateway başlatın ve
bir ACP JSON-RPC istemcisiyle stdio üzerinden `openclaw acp` sürün. `initialize`,
`session/new`, mutlak bir `cwd` ile `session/list`, `session/resume`,
`session/close`, yinelenen close ve eksik resume akışlarını kapsayın.

Kanıt, duyurulan yaşam döngüsü yeteneklerini, Gateway destekli bir oturum satırını,
güncelleme bildirimlerini ve Gateway `sessions.list` günlüğünü içermelidir:

```json
{
  "initialize": {
    "protocolVersion": 1,
    "agentCapabilities": {
      "sessionCapabilities": {
        "list": {},
        "resume": {},
        "close": {}
      }
    }
  },
  "listSessions": {
    "sessions": [
      {
        "sessionId": "agent:main:acp-smoke",
        "cwd": "/path/to/workspace",
        "_meta": {
          "sessionKey": "agent:main:acp-smoke",
          "kind": "direct"
        }
      }
    ],
    "nextCursor": null
  },
  "notifications": ["session_info_update", "available_commands_update", "usage_update"],
  "gatewayLogTail": ["[gateway] ready", "[ws] ⇄ res ✓ sessions.list 305ms"]
}
```

Tek ACP kanıtı olarak `openclaw gateway call sessions.list` kullanmaktan kaçının.
Bu CLI yolu, fresh-token operator kapsam yükseltmesi isteyebilir; ACP köprü
doğruluğu, ACP stdio çerçeveleri ve Gateway `sessions.list` günlüğüyle kanıtlanır.

## Bunu nasıl kullanırsınız

Bir IDE (veya başka bir istemci) Agent Client Protocol konuştuğunda ve bunun
bir OpenClaw Gateway oturumunu sürmesini istediğinizde ACP kullanın.

1. Gateway'in çalıştığından emin olun (yerel veya uzak).
2. Gateway hedefini yapılandırın (config veya bayraklar).
3. IDE'nizi stdio üzerinden `openclaw acp` çalıştıracak şekilde yönlendirin.

Örnek config (kalıcı):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Örnek doğrudan çalıştırma (config yazmadan):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Agent seçme

ACP doğrudan agent seçmez. Gateway oturum anahtarına göre yönlendirir.

Belirli bir agent hedeflemek için agent kapsamlı oturum anahtarları kullanın:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Her ACP oturumu tek bir Gateway oturum anahtarıyla eşlenir. Bir agent'ın birçok
oturumu olabilir; anahtarı veya etiketi geçersiz kılmadığınız sürece ACP varsayılan
olarak yalıtılmış bir `acp:<uuid>` oturumu kullanır.

Oturum başına `mcpServers`, köprü modunda desteklenmez. Bir ACP istemcisi bunları `newSession` veya `loadSession` sırasında gönderirse köprü, sessizce yok saymak yerine açık bir hata döndürür.

ACPX destekli oturumların OpenClaw Plugin araçlarını veya `cron` gibi seçili yerleşik araçları görmesini istiyorsanız, oturum başına `mcpServers` geçirmeye çalışmak yerine Gateway tarafındaki ACPX MCP köprülerini etkinleştirin. Bkz.
[ACP aracıları](/tr/tools/acp-agents-setup#plugin-tools-mcp-bridge) ve
[OpenClaw araçları MCP köprüsü](/tr/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## `acpx` üzerinden kullanma (Codex, Claude, diğer ACP istemcileri)

Codex veya Claude Code gibi bir kodlama aracısının ACP üzerinden OpenClaw botunuzla konuşmasını istiyorsanız, yerleşik `openclaw` hedefiyle `acpx` kullanın.

Tipik akış:

1. Gateway’i çalıştırın ve ACP köprüsünün ona erişebildiğinden emin olun.
2. `acpx openclaw` öğesini `openclaw acp` hedefine yönlendirin.
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

`acpx openclaw` öğesinin her seferinde belirli bir Gateway’i ve oturum anahtarını hedeflemesini istiyorsanız, `~/.acpx/config.json` içinde `openclaw` aracı komutunu geçersiz kılın:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Depoya yerel bir OpenClaw checkout’ı için, ACP akışının temiz kalması amacıyla dev runner yerine doğrudan CLI giriş noktasını kullanın. Örneğin:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Bu, Codex, Claude Code veya ACP uyumlu başka bir istemcinin bir terminali kazımadan OpenClaw aracısından bağlamsal bilgi çekmesini sağlamanın en kolay yoludur.

## Zed düzenleyici kurulumu

`~/.config/zed/settings.json` içine özel bir ACP aracısı ekleyin (veya Zed’in Settings kullanıcı arayüzünü kullanın):

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

Belirli bir Gateway’i veya aracıyı hedeflemek için:

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

Zed’de Agent panelini açın ve bir iş parçacığı başlatmak için "OpenClaw ACP" seçeneğini belirleyin.

## Oturum eşleme

Varsayılan olarak ACP oturumları, `acp:` önekine sahip yalıtılmış bir Gateway oturum anahtarı alır.
Bilinen bir oturumu yeniden kullanmak için bir oturum anahtarı veya etiket geçirin:

- `--session <key>`: belirli bir Gateway oturum anahtarı kullanın.
- `--session-label <label>`: mevcut bir oturumu etikete göre çözümleyin.
- `--reset-session`: bu anahtar için yeni bir oturum kimliği üretin (aynı anahtar, yeni transcript).

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

- `--url <url>`: Gateway WebSocket URL’si (yapılandırıldığında varsayılan değer gateway.remote.url).
- `--token <token>`: Gateway kimlik doğrulama token’ı.
- `--token-file <path>`: Gateway kimlik doğrulama token’ını dosyadan okuyun.
- `--password <password>`: Gateway kimlik doğrulama parolası.
- `--password-file <path>`: Gateway kimlik doğrulama parolasını dosyadan okuyun.
- `--session <key>`: varsayılan oturum anahtarı.
- `--session-label <label>`: çözümlenecek varsayılan oturum etiketi.
- `--require-existing`: oturum anahtarı/etiketi yoksa başarısız olun.
- `--reset-session`: ilk kullanımdan önce oturum anahtarını sıfırlayın.
- `--no-prefix-cwd`: istemlerin başına çalışma dizinini eklemeyin.
- `--provenance <off|meta|meta+receipt>`: ACP provenance metadata’sı veya receipt’ları ekleyin.
- `--verbose, -v`: stderr’e ayrıntılı günlükleme.

Güvenlik notu:

- `--token` ve `--password` bazı sistemlerde yerel süreç listelerinde görünebilir.
- `--token-file`/`--password-file` veya ortam değişkenlerini (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`) tercih edin.
- Gateway kimlik doğrulama çözümlemesi, diğer Gateway istemcileri tarafından kullanılan ortak sözleşmeyi izler:
  - yerel mod: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> yalnızca `gateway.auth.*` ayarlanmamışsa `gateway.remote.*` yedeği (yapılandırılmış ama çözümlenmemiş yerel SecretRefs kapalı kalacak şekilde başarısız olur)
  - uzak mod: uzak öncelik kurallarına göre env/config yedeğiyle `gateway.remote.*`
  - `--url` geçersiz kılma açısından güvenlidir ve örtük config/env kimlik bilgilerini yeniden kullanmaz; açık `--token`/`--password` (veya dosya varyantları) geçirin
- ACP runtime backend alt süreçleri `OPENCLAW_SHELL=acp` alır; bu, bağlama özgü shell/profile kuralları için kullanılabilir.
- `openclaw acp client`, başlatılan köprü sürecinde `OPENCLAW_SHELL=acp-client` ayarlar.

### `acp client` seçenekleri

- `--cwd <dir>`: ACP oturumu için çalışma dizini.
- `--server <command>`: ACP sunucu komutu (varsayılan: `openclaw`).
- `--server-args <args...>`: ACP sunucusuna geçirilen ek argümanlar.
- `--server-verbose`: ACP sunucusunda ayrıntılı günlüklemeyi etkinleştirin.
- `--verbose, -v`: ayrıntılı istemci günlükleme.

## İlgili

- [CLI referansı](/tr/cli)
- [ACP aracıları](/tr/tools/acp-agents)

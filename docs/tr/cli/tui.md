---
read_when:
    - Gateway için bir terminal kullanıcı arayüzü istiyorsunuz (uzaktan kullanıma uygun)
    - url/token/session değerlerini betiklerden geçirmek istiyorsunuz
    - TUI'yi Gateway olmadan yerel gömülü modda çalıştırmak istiyorsunuz
    - openclaw chat veya openclaw tui --local kullanmak istiyorsunuz
summary: '`openclaw tui` için CLI referansı (Gateway destekli veya yerel gömülü terminal kullanıcı arayüzü)'
title: TUI
x-i18n:
    generated_at: "2026-05-10T19:31:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e59f0f5360a456d19cfee38adc540b27665c55de68480616f269d1088f13677
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Gateway'e bağlı terminal kullanıcı arayüzünü açın veya yerel gömülü
modda çalıştırın.

İlgili:

- TUI kılavuzu: [TUI](/tr/web/tui)

## Seçenekler

| Bayrak                | Varsayılan                                | Açıklama                                                                                    |
| --------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| `--local`             | `false`                                   | Gateway yerine yerel gömülü agent çalışma zamanına karşı çalıştırın.                       |
| `--url <url>`         | yapılandırmadan `gateway.remote.url`      | Gateway WebSocket URL'si.                                                                   |
| `--token <token>`     | (yok)                                     | Gerekliyse Gateway token'ı.                                                                 |
| `--password <pass>`   | (yok)                                     | Gerekliyse Gateway parolası.                                                                |
| `--session <key>`     | `main` (veya kapsam global olduğunda `global`) | Oturum anahtarı. Bir agent çalışma alanı içindeyken önek kullanılmadıkça o agent'ı otomatik seçer. |
| `--deliver`           | `false`                                   | Assistant yanıtlarını yapılandırılmış kanallar üzerinden iletin.                            |
| `--thinking <level>`  | (model varsayılanı)                       | Thinking düzeyi geçersiz kılması.                                                          |
| `--message <text>`    | (yok)                                     | Bağlandıktan sonra bir başlangıç mesajı gönderin.                                           |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`          | Agent zaman aşımı. Geçersiz değerler bir uyarı günlüğe yazar ve yok sayılır.                |
| `--history-limit <n>` | `200`                                     | Bağlanırken yüklenecek geçmiş girdileri.                                                    |

Alias'lar: `openclaw chat` ve `openclaw terminal`, aynı komutu `--local` örtük olacak şekilde çağırır.

Notlar:

- `chat` ve `terminal`, `openclaw tui --local` için alias'lardır.
- `--local`, `--url`, `--token` veya `--password` ile birlikte kullanılamaz.
- `tui`, mümkün olduğunda token/parola kimlik doğrulaması için yapılandırılmış gateway auth SecretRefs değerlerini çözer (`env`/`file`/`exec` sağlayıcıları).
- Yapılandırılmış bir agent çalışma alanı dizini içinden başlatıldığında TUI, oturum anahtarı varsayılanı için o agent'ı otomatik seçer (`--session` açıkça `agent:<id>:...` olmadığı sürece).
- Yerel mod, gömülü agent çalışma zamanını doğrudan kullanır. Çoğu yerel araç çalışır, ancak yalnızca Gateway'e özgü özellikler kullanılamaz.
- Yerel mod, TUI komut yüzeyine `/auth [provider]` ekler.
- Plugin onay kapıları yerel modda da geçerlidir. Onay gerektiren araçlar terminalde karar istemi gösterir; Gateway dahil olmadığı için hiçbir şey sessizce otomatik onaylanmaz.

## Örnekler

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```

## Yapılandırma onarım döngüsü

Geçerli yapılandırma zaten doğrulanıyorsa ve gömülü agent'ın bunu incelemesini,
belgelerle karşılaştırmasını ve aynı terminalden onarmaya yardım etmesini
istiyorsanız yerel modu kullanın:

`openclaw config validate` zaten başarısız oluyorsa önce `openclaw configure` veya
`openclaw doctor --fix` kullanın. `openclaw chat`, geçersiz yapılandırma korumasını
atlamaz.

```bash
openclaw chat
```

Ardından TUI içinde:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Hedefli düzeltmeleri `openclaw config set` veya `openclaw configure` ile uygulayın,
ardından `openclaw config validate` komutunu yeniden çalıştırın. Bkz. [TUI](/tr/web/tui) ve [Config](/tr/cli/config).

## İlgili

- [CLI referansı](/tr/cli)
- [TUI](/tr/web/tui)

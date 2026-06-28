---
read_when:
    - Gateway için bir terminal kullanıcı arayüzü istiyorsunuz (uzaktan kullanıma uygun)
    - url/token/session değerlerini betiklerden geçirmek istiyorsunuz
    - TUI'yi Gateway olmadan yerel gömülü modda çalıştırmak istiyorsunuz
    - Openclaw chat veya openclaw tui --local kullanmak istiyorsunuz
summary: '`openclaw tui` için CLI referansı (Gateway destekli veya yerel gömülü terminal kullanıcı arayüzü)'
title: TUI
x-i18n:
    generated_at: "2026-06-28T00:25:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 514bbbcd0b695e8d4ccc87d1e242d816e264ac1f8b137f2bd891803ef7f48d5a
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Gateway'e bağlı terminal kullanıcı arayüzünü açın veya yerel gömülü
modda çalıştırın.

İlgili:

- TUI kılavuzu: [TUI](/tr/web/tui)

## Seçenekler

| Bayrak                | Varsayılan                               | Açıklama                                                                                   |
| --------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| `--local`             | `false`                                  | Gateway yerine yerel gömülü agent çalışma zamanına karşı çalıştırın.                      |
| `--url <url>`         | yapılandırmadan `gateway.remote.url`     | Gateway WebSocket URL'si.                                                                  |
| `--token <token>`     | (yok)                                    | Gerekirse Gateway token'ı.                                                                 |
| `--password <pass>`   | (yok)                                    | Gerekirse Gateway parolası.                                                                |
| `--session <key>`     | `main` (veya kapsam global olduğunda `global`) | Oturum anahtarı. Bir agent çalışma alanının içindeyken, önek eklenmedikçe o agent'ı otomatik seçer. |
| `--deliver`           | `false`                                  | Asistan yanıtlarını yapılandırılmış kanallar üzerinden iletin.                             |
| `--thinking <level>`  | (model varsayılanı)                      | Düşünme düzeyi geçersiz kılması.                                                           |
| `--message <text>`    | (yok)                                    | Bağlandıktan sonra başlangıç mesajı gönderin.                                              |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`         | Agent zaman aşımı. Geçersiz değerler bir uyarı günlüğe yazar ve yok sayılır.               |
| `--history-limit <n>` | `200`                                    | Bağlanırken yüklenecek geçmiş girdileri.                                                   |

Takma adlar: `openclaw chat` ve `openclaw terminal`, aynı komutu `--local` varsayılmış olarak çağırır.

Notlar:

- `chat` ve `terminal`, `openclaw tui --local` için takma adlardır.
- `--local`, `--url`, `--token` veya `--password` ile birlikte kullanılamaz.
- `tui`, mümkün olduğunda token/parola kimlik doğrulaması için yapılandırılmış gateway kimlik doğrulama SecretRefs değerlerini çözümler (`env`/`file`/`exec` sağlayıcıları).
- Yapılandırılmış bir agent çalışma alanı dizininin içinden başlatıldığında, TUI oturum anahtarı varsayılanı için o agent'ı otomatik seçer (`--session` açıkça `agent:<id>:...` olmadığı sürece).
- Yerel olmayan URL destekli bağlantılar için alt bilgide Gateway ana makine adını göstermek üzere `openclaw config set tui.footer.showRemoteHost true` çalıştırın. Ana makine etiketi varsayılan olarak kapalıdır ve loopback veya gömülü yerel bağlantılar için hiçbir zaman görünmez.
- Yerel mod, gömülü agent çalışma zamanını doğrudan kullanır. Çoğu yerel araç çalışır, ancak yalnızca Gateway'e özgü özellikler kullanılamaz.
- Yerel mod, TUI komut yüzeyinin içine `/auth [provider]` ekler.
- Plugin onay kapıları yerel modda da geçerlidir. Onay gerektiren araçlar terminalde karar ister; Gateway dahil olmadığı için hiçbir şey sessizce otomatik onaylanmaz.
- Oturum [hedefleri](/tr/tools/goal) alt bilgide görünür ve `/goal` ile yönetilebilir.

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
dokümanlarla karşılaştırmasını ve aynı terminalden onarmaya yardımcı olmasını
istiyorsanız yerel modu kullanın:

`openclaw config validate` zaten başarısız oluyorsa önce `openclaw configure`
veya `openclaw doctor --fix` kullanın. `openclaw chat`, geçersiz yapılandırma
korumasını atlamaz.

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

Hedefli düzeltmeleri `openclaw config set` veya `openclaw configure` ile
uygulayın, ardından `openclaw config validate` komutunu yeniden çalıştırın. Bkz. [TUI](/tr/web/tui) ve [Yapılandırma](/tr/cli/config).

## İlgili

- [CLI başvurusu](/tr/cli)
- [TUI](/tr/web/tui)
- [Hedef](/tr/tools/goal)

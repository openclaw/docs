---
read_when:
    - Praca nad funkcjami Zalo lub Webhookami
summary: Status obsługi bota Zalo, możliwości i konfiguracja
title: Zalo
x-i18n:
    generated_at: "2026-05-02T22:16:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6226af1217e1e8b03b485df99f6375872b487f7040c091f2bb2d85e18dec75d0
    source_path: channels/zalo.md
    workflow: 16
---

Status: eksperymentalny. DM są obsługiwane. Poniższa sekcja [Możliwości](#capabilities) odzwierciedla obecne działanie botów Marketplace.

## Wbudowany Plugin

Zalo jest dostarczane jako wbudowany Plugin w obecnych wydaniach OpenClaw, więc zwykłe spakowane
kompilacje nie wymagają osobnej instalacji.

Jeśli używasz starszej kompilacji lub niestandardowej instalacji, która wyklucza Zalo, zainstaluj
pakiet npm bezpośrednio:

- Instalacja przez CLI: `openclaw plugins install @openclaw/zalo`
- Przypięta wersja: `openclaw plugins install @openclaw/zalo@2026.5.2`
- Albo z checkoutu źródłowego: `openclaw plugins install ./path/to/local/zalo-plugin`
- Szczegóły: [Pluginy](/pl/tools/plugin)

## Szybka konfiguracja (dla początkujących)

1. Upewnij się, że Plugin Zalo jest dostępny.
   - Obecne spakowane wydania OpenClaw już go zawierają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie poleceniami powyżej.
2. Ustaw token:
   - Env: `ZALO_BOT_TOKEN=...`
   - Albo konfiguracja: `channels.zalo.accounts.default.botToken: "..."`.
3. Uruchom ponownie Gateway (albo dokończ konfigurację).
4. Dostęp przez DM domyślnie używa parowania; zatwierdź kod parowania przy pierwszym kontakcie.

Minimalna konfiguracja:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

## Czym to jest

Zalo to aplikacja komunikacyjna skupiona na Wietnamie; jej Bot API pozwala Gateway uruchamiać bota do rozmów 1:1.
Dobrze sprawdza się w obsłudze klienta lub powiadomieniach, gdy chcesz mieć deterministyczny routing z powrotem do Zalo.

Ta strona odzwierciedla obecne działanie OpenClaw dla **botów Zalo Bot Creator / Marketplace**.
**Boty Zalo Official Account (OA)** są inną powierzchnią produktu Zalo i mogą działać inaczej.

- Kanał Zalo Bot API zarządzany przez Gateway.
- Deterministyczny routing: odpowiedzi wracają do Zalo; model nigdy nie wybiera kanałów.
- DM współdzielą główną sesję agenta.
- Poniższa sekcja [Możliwości](#capabilities) pokazuje obecną obsługę botów Marketplace.

## Konfiguracja (szybka ścieżka)

### 1) Utwórz token bota (Zalo Bot Platform)

1. Przejdź do [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) i zaloguj się.
2. Utwórz nowego bota i skonfiguruj jego ustawienia.
3. Skopiuj pełny token bota (zwykle `numeric_id:secret`). W przypadku botów Marketplace używalny token runtime może pojawić się w wiadomości powitalnej bota po utworzeniu.

### 2) Skonfiguruj token (env lub konfiguracja)

Przykład:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

Jeśli później przejdziesz na powierzchnię bota Zalo, gdzie dostępne są grupy, możesz jawnie dodać konfigurację specyficzną dla grup, taką jak `groupPolicy` i `groupAllowFrom`. Obecne działanie botów Marketplace opisuje sekcja [Możliwości](#capabilities).

Opcja env: `ZALO_BOT_TOKEN=...` (działa tylko dla konta domyślnego).

Obsługa wielu kont: użyj `channels.zalo.accounts` z tokenami dla poszczególnych kont oraz opcjonalnym `name`.

3. Uruchom ponownie Gateway. Zalo startuje, gdy token zostanie rozstrzygnięty (env lub konfiguracja).
4. Dostęp przez DM domyślnie używa parowania. Zatwierdź kod po pierwszym kontakcie z botem.

## Jak to działa (zachowanie)

- Wiadomości przychodzące są normalizowane do współdzielonej koperty kanału z placeholderami mediów.
- Odpowiedzi zawsze wracają do tego samego czatu Zalo.
- Domyślnie używany jest long-polling; tryb webhook jest dostępny przez `channels.zalo.webhookUrl`.

## Limity

- Tekst wychodzący jest dzielony na fragmenty po 2000 znaków (limit Zalo API).
- Pobieranie/wysyłanie mediów jest ograniczone przez `channels.zalo.mediaMaxMb` (domyślnie 5).
- Streaming jest domyślnie blokowany, ponieważ limit 2000 znaków zmniejsza jego użyteczność.

## Kontrola dostępu (DM)

### Dostęp przez DM

- Domyślnie: `channels.zalo.dmPolicy = "pairing"`. Nieznani nadawcy otrzymują kod parowania; wiadomości są ignorowane do czasu zatwierdzenia (kody wygasają po 1 godzinie).
- Zatwierdzanie przez:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- Parowanie jest domyślną wymianą tokenu. Szczegóły: [Parowanie](/pl/channels/pairing)
- `channels.zalo.allowFrom` akceptuje numeryczne identyfikatory użytkowników (wyszukiwanie po nazwie użytkownika nie jest dostępne).

## Kontrola dostępu (grupy)

Dla **botów Zalo Bot Creator / Marketplace** obsługa grup nie była dostępna w praktyce, ponieważ bota w ogóle nie dało się dodać do grupy.

Oznacza to, że poniższe klucze konfiguracji związane z grupami istnieją w schemacie, ale nie były użyteczne dla botów Marketplace:

- `channels.zalo.groupPolicy` kontroluje obsługę przychodzącą w grupach: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` ogranicza, które identyfikatory nadawców mogą wywołać bota w grupach.
- Jeśli `groupAllowFrom` nie jest ustawione, Zalo wraca do `allowFrom` przy sprawdzaniu nadawców.
- Uwaga runtime: jeśli `channels.zalo` całkowicie brakuje, runtime nadal wraca do `groupPolicy="allowlist"` ze względów bezpieczeństwa.

Wartości polityki grupowej (gdy dostęp do grup jest dostępny na powierzchni Twojego bota) to:

- `groupPolicy: "disabled"` — blokuje wszystkie wiadomości grupowe.
- `groupPolicy: "open"` — dopuszcza dowolnego członka grupy (z bramkowaniem przez wzmiankę).
- `groupPolicy: "allowlist"` — domyślne zachowanie fail-closed; akceptowani są tylko dozwoleni nadawcy.

Jeśli używasz innej powierzchni produktu bota Zalo i zweryfikowano działające zachowanie grupowe, udokumentuj je osobno, zamiast zakładać, że odpowiada przepływowi bota Marketplace.

## Long-polling kontra webhook

- Domyślnie: long-polling (publiczny URL nie jest wymagany).
- Tryb webhook: ustaw `channels.zalo.webhookUrl` i `channels.zalo.webhookSecret`.
  - Sekret webhook musi mieć 8-256 znaków.
  - URL webhook musi używać HTTPS.
  - Zalo wysyła zdarzenia z nagłówkiem `X-Bot-Api-Secret-Token` do weryfikacji.
  - HTTP Gateway obsługuje żądania webhook pod `channels.zalo.webhookPath` (domyślnie ścieżka z URL webhook).
  - Żądania muszą używać `Content-Type: application/json` (albo typów mediów `+json`).
  - Zduplikowane zdarzenia (`event_name + message_id`) są ignorowane przez krótkie okno ponownego odtworzenia.
  - Ruch skokowy jest limitowany per ścieżka/źródło i może zwrócić HTTP 429.

**Uwaga:** getUpdates (polling) i webhook wzajemnie się wykluczają zgodnie z dokumentacją Zalo API.

## Obsługiwane typy wiadomości

Szybki przegląd obsługi znajdziesz w sekcji [Możliwości](#capabilities). Poniższe uwagi dodają szczegóły tam, gdzie zachowanie wymaga dodatkowego kontekstu.

- **Wiadomości tekstowe**: Pełna obsługa z dzieleniem na fragmenty po 2000 znaków.
- **Zwykłe URL w tekście**: Zachowują się jak normalne wejście tekstowe.
- **Podglądy linków / bogate karty linków**: Zobacz status bota Marketplace w sekcji [Możliwości](#capabilities); nie wywoływały one niezawodnie odpowiedzi.
- **Wiadomości obrazkowe**: Zobacz status bota Marketplace w sekcji [Możliwości](#capabilities); obsługa obrazów przychodzących była zawodna (wskaźnik pisania bez końcowej odpowiedzi).
- **Naklejki**: Zobacz status bota Marketplace w sekcji [Możliwości](#capabilities).
- **Notatki głosowe / pliki audio / wideo / ogólne załączniki plików**: Zobacz status bota Marketplace w sekcji [Możliwości](#capabilities).
- **Nieobsługiwane typy**: Logowane (na przykład wiadomości od chronionych użytkowników).

## Możliwości

Ta tabela podsumowuje obecne działanie **bota Zalo Bot Creator / Marketplace** w OpenClaw.

| Funkcja                     | Status                                            |
| --------------------------- | ------------------------------------------------- |
| Wiadomości bezpośrednie     | ✅ Obsługiwane                                    |
| Grupy                       | ❌ Niedostępne dla botów Marketplace              |
| Media (obrazy przychodzące) | ⚠️ Ograniczone / zweryfikuj w swoim środowisku    |
| Media (obrazy wychodzące)   | ⚠️ Nie przetestowano ponownie dla botów Marketplace |
| Zwykłe URL w tekście        | ✅ Obsługiwane                                    |
| Podglądy linków             | ⚠️ Zawodne dla botów Marketplace                  |
| Reakcje                     | ❌ Nieobsługiwane                                 |
| Naklejki                    | ⚠️ Brak odpowiedzi agenta dla botów Marketplace   |
| Notatki głosowe / audio / wideo | ⚠️ Brak odpowiedzi agenta dla botów Marketplace |
| Załączniki plików           | ⚠️ Brak odpowiedzi agenta dla botów Marketplace   |
| Wątki                       | ❌ Nieobsługiwane                                 |
| Ankiety                     | ❌ Nieobsługiwane                                 |
| Polecenia natywne           | ❌ Nieobsługiwane                                 |
| Streaming                   | ⚠️ Zablokowany (limit 2000 znaków)                |

## Cele dostarczania (CLI/cron)

- Użyj identyfikatora czatu jako celu.
- Przykład: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Rozwiązywanie problemów

**Bot nie odpowiada:**

- Sprawdź, czy token jest prawidłowy: `openclaw channels status --probe`
- Zweryfikuj, że nadawca jest zatwierdzony (parowanie albo allowFrom)
- Sprawdź logi Gateway: `openclaw logs --follow`

**Webhook nie odbiera zdarzeń:**

- Upewnij się, że URL webhook używa HTTPS
- Zweryfikuj, że token sekretu ma 8-256 znaków
- Potwierdź, że punkt końcowy HTTP Gateway jest osiągalny na skonfigurowanej ścieżce
- Sprawdź, czy polling getUpdates nie działa (wzajemnie się wykluczają)

## Odniesienie konfiguracji (Zalo)

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

Płaskie klucze najwyższego poziomu (`channels.zalo.botToken`, `channels.zalo.dmPolicy` i podobne) są starszym skrótem dla pojedynczego konta. Dla nowych konfiguracji preferuj `channels.zalo.accounts.<id>.*`. Obie formy nadal są tutaj udokumentowane, ponieważ istnieją w schemacie.

Opcje dostawcy:

- `channels.zalo.enabled`: włącza/wyłącza uruchamianie kanału.
- `channels.zalo.botToken`: token bota z Zalo Bot Platform.
- `channels.zalo.tokenFile`: odczytuje token ze zwykłej ścieżki pliku. Dowiązania symboliczne są odrzucane.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: pairing).
- `channels.zalo.allowFrom`: allowlist DM (identyfikatory użytkowników). `open` wymaga `"*"`. Kreator poprosi o numeryczne identyfikatory.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (domyślnie: allowlist). Obecne w konfiguracji; bieżące działanie botów Marketplace opisują [Możliwości](#capabilities) i [Kontrola dostępu (grupy)](#access-control-groups).
- `channels.zalo.groupAllowFrom`: allowlist nadawców grupowych (identyfikatory użytkowników). Wraca do `allowFrom`, gdy nie jest ustawione.
- `channels.zalo.mediaMaxMb`: limit mediów przychodzących/wychodzących (MB, domyślnie 5).
- `channels.zalo.webhookUrl`: włącza tryb webhook (wymagane HTTPS).
- `channels.zalo.webhookSecret`: sekret webhook (8-256 znaków).
- `channels.zalo.webhookPath`: ścieżka webhook na serwerze HTTP Gateway.
- `channels.zalo.proxy`: URL proxy dla żądań API.

Opcje wielu kont:

- `channels.zalo.accounts.<id>.botToken`: token dla konta.
- `channels.zalo.accounts.<id>.tokenFile`: zwykły plik tokenu dla konta. Dowiązania symboliczne są odrzucane.
- `channels.zalo.accounts.<id>.name`: nazwa wyświetlana.
- `channels.zalo.accounts.<id>.enabled`: włącza/wyłącza konto.
- `channels.zalo.accounts.<id>.dmPolicy`: polityka DM dla konta.
- `channels.zalo.accounts.<id>.allowFrom`: allowlist dla konta.
- `channels.zalo.accounts.<id>.groupPolicy`: polityka grupowa dla konta. Obecne w konfiguracji; bieżące działanie botów Marketplace opisują [Możliwości](#capabilities) i [Kontrola dostępu (grupy)](#access-control-groups).
- `channels.zalo.accounts.<id>.groupAllowFrom`: allowlist nadawców grupowych dla konta.
- `channels.zalo.accounts.<id>.webhookUrl`: URL webhook dla konta.
- `channels.zalo.accounts.<id>.webhookSecret`: sekret webhook dla konta.
- `channels.zalo.accounts.<id>.webhookPath`: ścieżka webhook dla konta.
- `channels.zalo.accounts.<id>.proxy`: URL proxy dla konta.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie przez wzmianki
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń

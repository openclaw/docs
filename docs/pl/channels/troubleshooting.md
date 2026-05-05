---
read_when:
    - Transport kanału zgłasza połączenie, ale odpowiedzi kończą się niepowodzeniem
    - Przed szczegółową dokumentacją dostawcy potrzebne są kontrole specyficzne dla kanału
summary: Szybkie rozwiązywanie problemów na poziomie kanału z sygnaturami awarii i poprawkami dla poszczególnych kanałów
title: Rozwiązywanie problemów z kanałami
x-i18n:
    generated_at: "2026-05-05T08:25:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 360184c41ce6929c696688af597c5104a8a28b54620c354f7ee400a2e5490519
    source_path: channels/troubleshooting.md
    workflow: 16
---

Użyj tej strony, gdy kanał się łączy, ale zachowanie jest nieprawidłowe.

## Drabina poleceń

Najpierw uruchom je w tej kolejności:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Zdrowy stan bazowy:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` lub `admin-capable`
- Sonda kanału pokazuje, że transport jest połączony oraz, tam gdzie jest to obsługiwane, `works` lub `audit ok`

## WhatsApp

### Sygnatury awarii WhatsApp

| Objaw                               | Najszybsza kontrola                                  | Naprawa                                                                                                                                    |
| ----------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Połączono, ale brak odpowiedzi w DM | `openclaw pairing list whatsapp`                     | Zatwierdź nadawcę albo zmień zasadę DM/listę dozwolonych.                                                                                  |
| Wiadomości grupowe są ignorowane    | Sprawdź `requireMention` + wzorce wzmianek w config  | Wspomnij bota albo poluzuj zasadę wzmianek dla tej grupy.                                                                                  |
| Logowanie QR kończy się 408         | Sprawdź zmienne env `HTTPS_PROXY` / `HTTP_PROXY` dla Gateway | Ustaw osiągalne proxy; używaj `NO_PROXY` tylko do obejść.                                                                                  |
| Losowe rozłączenia/pętle logowania  | `openclaw channels status --probe` + logi            | Ostatnie ponowne połączenia są oznaczane nawet przy obecnym połączeniu; obserwuj logi, uruchom ponownie Gateway, a potem ponownie połącz, jeśli niestabilność trwa. |
| Odpowiedzi przychodzą po sekundach/minutach | `openclaw doctor --fix`                       | Doctor zatrzymuje zweryfikowane, przestarzałe lokalne klienty TUI, gdy degradują pętlę zdarzeń Gateway.                                    |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z WhatsApp](/pl/channels/whatsapp#troubleshooting)

## Telegram

### Sygnatury awarii Telegram

| Objaw                                | Najszybsza kontrola                                  | Naprawa                                                                                                                          |
| ------------------------------------ | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `/start`, ale brak użytecznego przepływu odpowiedzi | `openclaw pairing list telegram`           | Zatwierdź parowanie albo zmień zasadę DM.                                                                                        |
| Bot jest online, ale grupa milczy    | Sprawdź wymóg wzmianki i tryb prywatności bota       | Wyłącz tryb prywatności dla widoczności w grupie albo wspomnij bota.                                                             |
| Błędy wysyłania z błędami sieci      | Sprawdź logi pod kątem błędów wywołań API Telegram   | Napraw routing DNS/IPv6/proxy do `api.telegram.org`.                                                                             |
| Start zgłasza `getMe returned 401`   | Sprawdź skonfigurowane źródło tokena                 | Ponownie skopiuj albo wygeneruj token BotFather i zaktualizuj `botToken`, `tokenFile` albo `TELEGRAM_BOT_TOKEN` konta domyślnego. |
| Polling zacina się albo wolno ponawia połączenie | `openclaw logs --follow` dla diagnostyki pollingu | Zaktualizuj; jeśli restarty są fałszywymi alarmami, dostrój `pollingStallThresholdMs`. Uporczywe zacięcia nadal wskazują na proxy/DNS/IPv6. |
| `setMyCommands` odrzucone przy starcie | Sprawdź logi pod kątem `BOT_COMMANDS_TOO_MUCH`     | Zmniejsz liczbę poleceń Plugin/umiejętności/niestandardowych Telegram albo wyłącz natywne menu.                                  |
| Po aktualizacji lista dozwolonych cię blokuje | `openclaw security audit` i listy dozwolonych w config | Uruchom `openclaw doctor --fix` albo zastąp `@username` numerycznymi identyfikatorami nadawców.                                  |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z Telegram](/pl/channels/telegram#troubleshooting)

## Discord

### Sygnatury awarii Discord

| Objaw                                      | Najszybsza kontrola                                                    | Naprawa                                                                                                                                                                  |
| ------------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bot jest online, ale brak odpowiedzi w guild | `openclaw channels status --probe`                                   | Zezwól na guild/kanał i zweryfikuj intencję treści wiadomości.                                                                                                           |
| Wiadomości grupowe są ignorowane           | Sprawdź logi pod kątem odrzuceń przez bramkę wzmianek                  | Wspomnij bota albo ustaw `requireMention: false` dla guild/kanału.                                                                                                       |
| Użycie pisania/tokenu, ale brak wiadomości Discord | Log sesji pokazuje tekst asystenta z `didSendViaMessagingTool: false` | Model odpowiedział prywatnie zamiast wywołać narzędzie wiadomości. Użyj modelu niezawodnego w wywołaniach narzędzi albo ustaw `messages.groupChat.visibleReplies: "automatic"`, aby automatycznie publikować. |
| Brak odpowiedzi DM                         | `openclaw pairing list discord`                                        | Zatwierdź parowanie DM albo dostosuj zasadę DM.                                                                                                                         |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z Discord](/pl/channels/discord#troubleshooting)

## Slack

### Sygnatury awarii Slack

| Objaw                                  | Najszybsza kontrola                         | Naprawa                                                                                                                                                  |
| -------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tryb socket jest połączony, ale brak odpowiedzi | `openclaw channels status --probe`    | Zweryfikuj token aplikacji + token bota i wymagane zakresy; obserwuj `botTokenStatus` / `appTokenStatus = configured_unavailable` w konfiguracjach opartych na SecretRef. |
| DM zablokowane                         | `openclaw pairing list slack`               | Zatwierdź parowanie albo poluzuj zasadę DM.                                                                                                              |
| Wiadomość na kanale ignorowana         | Sprawdź `groupPolicy` i listę dozwolonych kanałów | Zezwól na kanał albo przełącz zasadę na `open`.                                                                                                      |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów ze Slack](/pl/channels/slack#troubleshooting)

## iMessage i BlueBubbles

### Sygnatury awarii iMessage i BlueBubbles

| Objaw                              | Najszybsza kontrola                                                       | Naprawa                                               |
| ---------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------- |
| Brak zdarzeń przychodzących        | Zweryfikuj osiągalność webhooka/serwera i uprawnienia aplikacji           | Napraw URL webhooka albo stan serwera BlueBubbles.    |
| Można wysyłać, ale brak odbioru w macOS | Sprawdź uprawnienia prywatności macOS dla automatyzacji Messages      | Ponownie przyznaj uprawnienia TCC i uruchom ponownie proces kanału. |
| Nadawca DM zablokowany             | `openclaw pairing list imessage` lub `openclaw pairing list bluebubbles`  | Zatwierdź parowanie albo zaktualizuj listę dozwolonych. |

Pełne rozwiązywanie problemów:

- [Rozwiązywanie problemów z iMessage](/pl/channels/imessage#troubleshooting)
- [Rozwiązywanie problemów z BlueBubbles](/pl/channels/bluebubbles#troubleshooting)

## Signal

### Sygnatury awarii Signal

| Objaw                            | Najszybsza kontrola                       | Naprawa                                                   |
| -------------------------------- | ----------------------------------------- | --------------------------------------------------------- |
| Daemon jest osiągalny, ale bot milczy | `openclaw channels status --probe`    | Zweryfikuj URL/konto daemona `signal-cli` i tryb odbioru. |
| DM zablokowane                   | `openclaw pairing list signal`            | Zatwierdź nadawcę albo dostosuj zasadę DM.                |
| Odpowiedzi grupowe nie są wyzwalane | Sprawdź listę dozwolonych grup i wzorce wzmianek | Dodaj nadawcę/grupę albo poluzuj bramkowanie.       |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z Signal](/pl/channels/signal#troubleshooting)

## QQ Bot

### Sygnatury awarii QQ Bot

| Objaw                                | Najszybsza kontrola                             | Naprawa                                                        |
| ------------------------------------ | ----------------------------------------------- | -------------------------------------------------------------- |
| Bot odpowiada „gone to Mars”         | Zweryfikuj `appId` i `clientSecret` w config    | Ustaw dane uwierzytelniające albo uruchom ponownie Gateway.    |
| Brak wiadomości przychodzących       | `openclaw channels status --probe`              | Zweryfikuj dane uwierzytelniające na QQ Open Platform.         |
| Głos nie jest transkrybowany         | Sprawdź config dostawcy STT                     | Skonfiguruj `channels.qqbot.stt` albo `tools.media.audio`.     |
| Wiadomości proaktywne nie docierają  | Sprawdź wymagania interakcji platformy QQ       | QQ może blokować wiadomości inicjowane przez bota bez niedawnej interakcji. |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z QQ Bot](/pl/channels/qqbot#troubleshooting)

## Matrix

### Sygnatury awarii Matrix

| Objaw                                    | Najszybsza kontrola                       | Naprawa                                                                     |
| ---------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| Zalogowano, ale wiadomości w pokoju są ignorowane | `openclaw channels status --probe` | Sprawdź `groupPolicy`, listę dozwolonych pokojów i bramkowanie wzmianek.    |
| DM nie są przetwarzane                   | `openclaw pairing list matrix`            | Zatwierdź nadawcę albo dostosuj zasadę DM.                                  |
| Pokoje szyfrowane zawodzą                | `openclaw matrix verify status`           | Ponownie zweryfikuj urządzenie, a potem sprawdź `openclaw matrix verify backup status`. |
| Przywracanie kopii zapasowej oczekuje/jest uszkodzone | `openclaw matrix verify backup status` | Uruchom `openclaw matrix verify backup restore` albo ponów z kluczem odzyskiwania. |
| Cross-signing/bootstrap wygląda nieprawidłowo | `openclaw matrix verify bootstrap`    | Napraw tajny magazyn, cross-signing i stan kopii zapasowej w jednym przebiegu. |

Pełna konfiguracja i ustawienia: [Matrix](/pl/channels/matrix)

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Routing kanałów](/pl/channels/channel-routing)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)

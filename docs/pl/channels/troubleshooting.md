---
read_when:
    - Transport kanału zgłasza połączenie, ale odpowiedzi kończą się niepowodzeniem
    - Potrzebujesz sprawdzeń specyficznych dla kanału przed szczegółową dokumentacją dostawców
summary: Szybkie rozwiązywanie problemów na poziomie kanału z sygnaturami awarii i sposobami naprawy dla każdego kanału
title: Rozwiązywanie problemów z kanałami
x-i18n:
    generated_at: "2026-04-30T09:40:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6024f2ae0a058b2296758c237c912a5cd8ea6bbafea33cc201690cc081efcbee
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

Zdrowa linia bazowa:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` lub `admin-capable`
- Sonda kanału pokazuje, że transport jest połączony oraz, tam gdzie jest to obsługiwane, `works` lub `audit ok`

## WhatsApp

### Sygnatury awarii WhatsApp

| Objaw                           | Najszybsze sprawdzenie                              | Naprawa                                                                                                                          |
| ------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Połączono, ale brak odpowiedzi w DM | `openclaw pairing list whatsapp`                    | Zatwierdź nadawcę albo zmień zasadę DM/listę dozwolonych.                                                                        |
| Wiadomości grupowe ignorowane   | Sprawdź `requireMention` + wzorce wzmianek w konfiguracji | Wspomnij bota albo złagodź zasadę wzmianek dla tej grupy.                                                                        |
| Logowanie QR kończy się timeoutem 408 | Sprawdź zmienne env Gateway `HTTPS_PROXY` / `HTTP_PROXY` | Ustaw osiągalny serwer proxy; używaj `NO_PROXY` tylko dla obejść.                                                                |
| Losowe pętle rozłączania/ponownego logowania | `openclaw channels status --probe` + logi           | Ostatnie ponowne połączenia są oznaczane nawet wtedy, gdy kanał jest obecnie połączony; obserwuj logi, zrestartuj Gateway, a potem ponownie połącz, jeśli niestabilność trwa. |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z WhatsApp](/pl/channels/whatsapp#troubleshooting)

## Telegram

### Sygnatury awarii Telegram

| Objaw                                | Najszybsze sprawdzenie                          | Naprawa                                                                                                                     |
| ------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `/start`, ale brak użytecznego przepływu odpowiedzi | `openclaw pairing list telegram`                 | Zatwierdź parowanie albo zmień zasadę DM.                                                                                  |
| Bot online, ale grupa pozostaje cicha | Sprawdź wymóg wzmianki i tryb prywatności bota   | Wyłącz tryb prywatności dla widoczności grupy albo wspomnij bota.                                                          |
| Błędy wysyłania z błędami sieci       | Sprawdź logi pod kątem nieudanych wywołań API Telegram | Napraw routing DNS/IPv6/proxy do `api.telegram.org`.                                                                       |
| Start zgłasza `getMe returned 401`    | Sprawdź skonfigurowane źródło tokenu             | Skopiuj ponownie albo wygeneruj od nowa token BotFather i zaktualizuj `botToken`, `tokenFile` albo `TELEGRAM_BOT_TOKEN` konta domyślnego. |
| Polling zacina się albo wolno łączy ponownie | `openclaw logs --follow` dla diagnostyki pollingu | Zaktualizuj; jeśli restarty są fałszywymi alarmami, dostrój `pollingStallThresholdMs`. Uporczywe zacięcia nadal wskazują na proxy/DNS/IPv6. |
| `setMyCommands` odrzucone przy starcie | Sprawdź logi pod kątem `BOT_COMMANDS_TOO_MUCH`   | Zmniejsz liczbę poleceń Telegram z Plugin/skill/niestandardowych albo wyłącz natywne menu.                                  |
| Po aktualizacji lista dozwolonych cię blokuje | `openclaw security audit` i listy dozwolonych w konfiguracji | Uruchom `openclaw doctor --fix` albo zastąp `@username` numerycznymi ID nadawców.                                          |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z Telegram](/pl/channels/telegram#troubleshooting)

## Discord

### Sygnatury awarii Discord

| Objaw                           | Najszybsze sprawdzenie              | Naprawa                                                   |
| ------------------------------- | ----------------------------------- | --------------------------------------------------------- |
| Bot online, ale brak odpowiedzi w gildii | `openclaw channels status --probe`  | Zezwól na gildię/kanał i sprawdź intent treści wiadomości. |
| Wiadomości grupowe ignorowane   | Sprawdź logi pod kątem odrzuceń przez bramkowanie wzmianek | Wspomnij bota albo ustaw `requireMention: false` dla gildii/kanału. |
| Brak odpowiedzi DM              | `openclaw pairing list discord`     | Zatwierdź parowanie DM albo dostosuj zasadę DM.           |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z Discord](/pl/channels/discord#troubleshooting)

## Slack

### Sygnatury awarii Slack

| Objaw                                  | Najszybsze sprawdzenie                    | Naprawa                                                                                                                                              |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode połączony, ale brak odpowiedzi | `openclaw channels status --probe`        | Sprawdź token aplikacji + token bota i wymagane zakresy; obserwuj `botTokenStatus` / `appTokenStatus = configured_unavailable` w konfiguracjach opartych na SecretRef. |
| DM zablokowane                         | `openclaw pairing list slack`             | Zatwierdź parowanie albo złagodź zasadę DM.                                                                                                         |
| Wiadomość kanału ignorowana            | Sprawdź `groupPolicy` i listę dozwolonych kanałów | Zezwól na kanał albo zmień zasadę na `open`.                                                                                                       |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów ze Slack](/pl/channels/slack#troubleshooting)

## iMessage i BlueBubbles

### Sygnatury awarii iMessage i BlueBubbles

| Objaw                            | Najszybsze sprawdzenie                                                | Naprawa                                                |
| -------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| Brak zdarzeń przychodzących      | Sprawdź osiągalność Webhook/serwera i uprawnienia aplikacji            | Napraw URL Webhook albo stan serwera BlueBubbles.     |
| Można wysyłać, ale brak odbioru na macOS | Sprawdź uprawnienia prywatności macOS dla automatyzacji Messages       | Nadaj ponownie uprawnienia TCC i zrestartuj proces kanału. |
| Nadawca DM zablokowany           | `openclaw pairing list imessage` lub `openclaw pairing list bluebubbles` | Zatwierdź parowanie albo zaktualizuj listę dozwolonych. |

Pełne rozwiązywanie problemów:

- [Rozwiązywanie problemów z iMessage](/pl/channels/imessage#troubleshooting)
- [Rozwiązywanie problemów z BlueBubbles](/pl/channels/bluebubbles#troubleshooting)

## Signal

### Sygnatury awarii Signal

| Objaw                           | Najszybsze sprawdzenie                    | Naprawa                                                   |
| ------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| Demon osiągalny, ale bot milczy | `openclaw channels status --probe`         | Sprawdź URL/konto demona `signal-cli` i tryb odbioru.    |
| DM zablokowany                  | `openclaw pairing list signal`             | Zatwierdź nadawcę albo dostosuj zasadę DM.               |
| Odpowiedzi grupowe się nie wyzwalają | Sprawdź listę dozwolonych grup i wzorce wzmianek | Dodaj nadawcę/grupę albo poluzuj bramkowanie.            |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z Signal](/pl/channels/signal#troubleshooting)

## QQ Bot

### Sygnatury awarii QQ Bot

| Objaw                           | Najszybsze sprawdzenie                     | Naprawa                                                         |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| Bot odpowiada "poleciał na Marsa" | Sprawdź `appId` i `clientSecret` w konfiguracji | Ustaw poświadczenia albo zrestartuj Gateway.                    |
| Brak wiadomości przychodzących  | `openclaw channels status --probe`          | Sprawdź poświadczenia na QQ Open Platform.                      |
| Głos nie jest transkrybowany    | Sprawdź konfigurację dostawcy STT           | Skonfiguruj `channels.qqbot.stt` albo `tools.media.audio`.      |
| Wiadomości proaktywne nie docierają | Sprawdź wymagania interakcji platformy QQ   | QQ może blokować wiadomości inicjowane przez bota bez niedawnej interakcji. |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z QQ Bot](/pl/channels/qqbot#troubleshooting)

## Matrix

### Sygnatury awarii Matrix

| Objaw                              | Najszybsze sprawdzenie                    | Naprawa                                                                    |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| Zalogowano, ale ignoruje wiadomości w pokoju | `openclaw channels status --probe`     | Sprawdź `groupPolicy`, listę dozwolonych pokojów i bramkowanie wzmianek.  |
| DM nie są przetwarzane              | `openclaw pairing list matrix`         | Zatwierdź nadawcę albo dostosuj zasadę DM.                                |
| Szyfrowane pokoje zawodzą           | `openclaw matrix verify status`        | Ponownie zweryfikuj urządzenie, a potem sprawdź `openclaw matrix verify backup status`. |
| Przywracanie kopii zapasowej oczekuje/nie działa | `openclaw matrix verify backup status` | Uruchom `openclaw matrix verify backup restore` albo ponów z kluczem odzyskiwania. |
| Cross-signing/bootstrap wygląda nieprawidłowo | `openclaw matrix verify bootstrap`     | Napraw tajny magazyn, cross-signing i stan kopii zapasowej w jednym przebiegu. |

Pełna konfiguracja i ustawienia: [Matrix](/pl/channels/matrix)

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Routing kanałów](/pl/channels/channel-routing)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)

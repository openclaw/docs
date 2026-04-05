---
read_when:
    - Transport kanału pokazuje połączenie, ale odpowiedzi nie działają
    - Potrzebujesz kontroli specyficznych dla kanału przed przejściem do szczegółowej dokumentacji dostawcy
summary: Szybkie rozwiązywanie problemów na poziomie kanału z sygnaturami awarii i poprawkami dla poszczególnych kanałów
title: Rozwiązywanie problemów z kanałami
x-i18n:
    generated_at: "2026-04-05T13:46:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: d45d8220505ea420d970b20bc66e65216c2d7024b5736db1936421ffc0676e1f
    source_path: channels/troubleshooting.md
    workflow: 15
---

# Rozwiązywanie problemów z kanałami

Użyj tej strony, gdy kanał się łączy, ale działa nieprawidłowo.

## Sekwencja poleceń

Najpierw uruchom je w tej kolejności:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Prawidłowy stan bazowy:

- `Runtime: running`
- `RPC probe: ok`
- Sonda kanału pokazuje połączony transport oraz, tam gdzie jest to obsługiwane, `works` lub `audit ok`

## WhatsApp

### Sygnatury awarii WhatsApp

| Objaw                           | Najszybsza kontrola                             | Poprawka                                                |
| ------------------------------- | ----------------------------------------------- | ------------------------------------------------------- |
| Połączono, ale brak odpowiedzi w DM | `openclaw pairing list whatsapp`             | Zatwierdź nadawcę albo zmień politykę DM/listę dozwolonych. |
| Wiadomości grupowe są ignorowane | Sprawdź `requireMention` + wzorce wzmianek w konfiguracji | Wspomnij bota albo złagodź politykę wzmianek dla tej grupy. |
| Losowe pętle rozłączeń/ponownych logowań | `openclaw channels status --probe` + logi | Zaloguj się ponownie i sprawdź, czy katalog poświadczeń jest w dobrym stanie. |

Pełne rozwiązywanie problemów: [/channels/whatsapp#troubleshooting](/channels/whatsapp#troubleshooting)

## Telegram

### Sygnatury awarii Telegram

| Objaw                               | Najszybsza kontrola                         | Poprawka                                                                    |
| ----------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------- |
| `/start`, ale brak użytecznego przepływu odpowiedzi | `openclaw pairing list telegram` | Zatwierdź parowanie albo zmień politykę DM.                                  |
| Bot jest online, ale grupa milczy   | Sprawdź wymóg wzmianki i tryb prywatności bota | Wyłącz tryb prywatności dla widoczności w grupie albo wspomnij bota.         |
| Błędy wysyłania z błędami sieciowymi | Sprawdź logi pod kątem błędów wywołań API Telegram | Napraw routing DNS/IPv6/proxy do `api.telegram.org`.                         |
| `setMyCommands` odrzucone przy uruchamianiu | Sprawdź logi pod kątem `BOT_COMMANDS_TOO_MUCH` | Ogranicz komendy plugin/Skills/własne komendy Telegram albo wyłącz natywne menu. |
| Po aktualizacji lista dozwolonych Cię blokuje | `openclaw security audit` i listy dozwolonych w konfiguracji | Uruchom `openclaw doctor --fix` albo zastąp `@username` numerycznymi identyfikatorami nadawców. |

Pełne rozwiązywanie problemów: [/channels/telegram#troubleshooting](/channels/telegram#troubleshooting)

## Discord

### Sygnatury awarii Discord

| Objaw                           | Najszybsza kontrola                  | Poprawka                                                  |
| ------------------------------- | ------------------------------------ | --------------------------------------------------------- |
| Bot jest online, ale brak odpowiedzi na serwerze | `openclaw channels status --probe` | Zezwól na serwer/kanał i sprawdź uprawnienie message content. |
| Wiadomości grupowe są ignorowane | Sprawdź logi pod kątem odrzuceń przez reguły wzmianek | Wspomnij bota albo ustaw `requireMention: false` dla serwera/kanału. |
| Brak odpowiedzi w DM            | `openclaw pairing list discord`      | Zatwierdź parowanie DM albo dostosuj politykę DM.         |

Pełne rozwiązywanie problemów: [/channels/discord#troubleshooting](/channels/discord#troubleshooting)

## Slack

### Sygnatury awarii Slack

| Objaw                                  | Najszybsza kontrola                  | Poprawka                                                                                                                                             |
| -------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode połączony, ale brak odpowiedzi | `openclaw channels status --probe` | Sprawdź token aplikacji + token bota i wymagane zakresy; obserwuj `botTokenStatus` / `appTokenStatus = configured_unavailable` w konfiguracjach opartych na SecretRef. |
| DM są blokowane                        | `openclaw pairing list slack`        | Zatwierdź parowanie albo złagodź politykę DM.                                                                                                       |
| Wiadomość na kanale jest ignorowana    | Sprawdź `groupPolicy` i listę dozwolonych kanałów | Zezwól na kanał albo przełącz politykę na `open`.                                                                                                  |

Pełne rozwiązywanie problemów: [/channels/slack#troubleshooting](/channels/slack#troubleshooting)

## iMessage i BlueBubbles

### Sygnatury awarii iMessage i BlueBubbles

| Objaw                            | Najszybsza kontrola                                                   | Poprawka                                             |
| -------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------- |
| Brak zdarzeń przychodzących      | Sprawdź osiągalność webhooka/serwera i uprawnienia aplikacji          | Napraw URL webhooka albo stan serwera BlueBubbles.   |
| Można wysyłać, ale brak odbioru na macOS | Sprawdź uprawnienia prywatności macOS dla automatyzacji Messages | Nadaj ponownie uprawnienia TCC i uruchom ponownie proces kanału. |
| Nadawca DM jest blokowany        | `openclaw pairing list imessage` lub `openclaw pairing list bluebubbles` | Zatwierdź parowanie albo zaktualizuj listę dozwolonych. |

Pełne rozwiązywanie problemów:

- [/channels/imessage#troubleshooting](/pl/channels/imessage#troubleshooting)
- [/channels/bluebubbles#troubleshooting](/pl/channels/bluebubbles#troubleshooting)

## Signal

### Sygnatury awarii Signal

| Objaw                           | Najszybsza kontrola                  | Poprawka                                                     |
| ------------------------------- | ------------------------------------ | ------------------------------------------------------------ |
| Demon jest osiągalny, ale bot milczy | `openclaw channels status --probe` | Sprawdź URL/konto demona `signal-cli` oraz tryb odbioru.     |
| DM są blokowane                 | `openclaw pairing list signal`       | Zatwierdź nadawcę albo dostosuj politykę DM.                 |
| Odpowiedzi w grupie nie są wyzwalane | Sprawdź listę dozwolonych grup i wzorce wzmianek | Dodaj nadawcę/grupę albo złagodź reguły blokujące.           |

Pełne rozwiązywanie problemów: [/channels/signal#troubleshooting](/channels/signal#troubleshooting)

## QQ Bot

### Sygnatury awarii QQ Bot

| Objaw                           | Najszybsza kontrola                            | Poprawka                                                        |
| ------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------- |
| Bot odpowiada „gone to Mars”    | Sprawdź `appId` i `clientSecret` w konfiguracji | Ustaw poświadczenia albo uruchom ponownie gateway.              |
| Brak wiadomości przychodzących  | `openclaw channels status --probe`             | Zweryfikuj poświadczenia na QQ Open Platform.                   |
| Mowa nie jest transkrybowana    | Sprawdź konfigurację dostawcy STT              | Skonfiguruj `channels.qqbot.stt` lub `tools.media.audio`.       |
| Wiadomości proaktywne nie docierają | Sprawdź wymagania platformy QQ dotyczące interakcji | QQ może blokować wiadomości inicjowane przez bota bez niedawnej interakcji. |

Pełne rozwiązywanie problemów: [/channels/qqbot#troubleshooting](/pl/channels/qqbot#troubleshooting)

## Matrix

### Sygnatury awarii Matrix

| Objaw                               | Najszybsza kontrola                    | Poprawka                                                                  |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| Zalogowano, ale ignoruje wiadomości w pokoju | `openclaw channels status --probe` | Sprawdź `groupPolicy`, listę dozwolonych pokoi i reguły wzmianek.         |
| DM nie są przetwarzane              | `openclaw pairing list matrix`         | Zatwierdź nadawcę albo dostosuj politykę DM.                              |
| Szyfrowane pokoje nie działają      | `openclaw matrix verify status`        | Zweryfikuj urządzenie ponownie, a następnie sprawdź `openclaw matrix verify backup status`. |
| Przywracanie kopii zapasowej oczekuje/jest uszkodzone | `openclaw matrix verify backup status` | Uruchom `openclaw matrix verify backup restore` albo wykonaj ponownie z kluczem odzyskiwania. |
| Cross-signing/bootstrap wygląda nieprawidłowo | `openclaw matrix verify bootstrap` | Napraw magazyn sekretów, cross-signing i stan kopii zapasowej w jednym przebiegu. |

Pełna konfiguracja i ustawienia: [Matrix](/channels/matrix)

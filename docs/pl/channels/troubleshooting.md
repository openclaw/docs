---
read_when:
    - Transport kanału pokazuje połączenie, ale odpowiedzi nie działają
    - Potrzebujesz kontroli specyficznych dla kanału, zanim przejdziesz do szczegółowej dokumentacji providera
summary: Szybkie rozwiązywanie problemów na poziomie kanału z sygnaturami awarii i poprawkami dla każdego kanału z osobna
title: Rozwiązywanie problemów z kanałami
x-i18n:
    generated_at: "2026-04-21T09:52:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69e9e8f093bee1c7aafc244d6b999a957b7571cc125096d72060d0df52bf52c0
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
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` lub `admin-capable`
- Probe kanału pokazuje, że transport jest połączony oraz, tam gdzie to obsługiwane, `works` lub `audit ok`

## WhatsApp

### Sygnatury awarii WhatsApp

| Objaw                          | Najszybsza kontrola                             | Poprawka                                               |
| ------------------------------ | ----------------------------------------------- | ------------------------------------------------------ |
| Połączono, ale brak odpowiedzi w DM | `openclaw pairing list whatsapp`                | Zatwierdź nadawcę albo zmień politykę DM/listę dozwolonych. |
| Wiadomości grupowe są ignorowane | Sprawdź `requireMention` i wzorce wzmianek w konfiguracji | Wspomnij bota albo złagodź politykę wzmianek dla tej grupy. |
| Losowe rozłączenia/pętle ponownego logowania | `openclaw channels status --probe` + logi       | Zaloguj się ponownie i sprawdź, czy katalog poświadczeń jest w dobrym stanie. |

Pełne rozwiązywanie problemów: [/channels/whatsapp#troubleshooting](/pl/channels/whatsapp#troubleshooting)

## Telegram

### Sygnatury awarii Telegram

| Objaw                               | Najszybsza kontrola                              | Poprawka                                                                                                                     |
| ----------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `/start`, ale brak użytecznego przepływu odpowiedzi | `openclaw pairing list telegram`                 | Zatwierdź parowanie albo zmień politykę DM.                                                                                  |
| Bot jest online, ale grupa milczy   | Sprawdź wymóg wzmianki i tryb prywatności bota   | Wyłącz tryb prywatności, aby bot widział grupę, albo wspomnij bota.                                                          |
| Błędy wysyłania z błędami sieciowymi | Sprawdź logi pod kątem nieudanych wywołań Telegram API | Napraw routing DNS/IPv6/proxy do `api.telegram.org`.                                                                         |
| Polling zatrzymuje się lub łączy ponownie z opóźnieniem | `openclaw logs --follow` dla diagnostyki pollingu | Zaktualizuj; jeśli restarty są fałszywymi alarmami, dostrój `pollingStallThresholdMs`. Utrzymujące się zastoje nadal wskazują na proxy/DNS/IPv6. |
| `setMyCommands` odrzucone przy starcie | Sprawdź logi pod kątem `BOT_COMMANDS_TOO_MUCH`   | Ogranicz niestandardowe polecenia Telegram z pluginów/Skills albo wyłącz natywne menu.                                      |
| Po aktualizacji lista dozwolonych Cię blokuje | `openclaw security audit` i listy dozwolonych w konfiguracji | Uruchom `openclaw doctor --fix` albo zastąp `@username` numerycznymi identyfikatorami nadawców.                             |

Pełne rozwiązywanie problemów: [/channels/telegram#troubleshooting](/pl/channels/telegram#troubleshooting)

## Discord

### Sygnatury awarii Discord

| Objaw                         | Najszybsza kontrola                  | Poprawka                                                   |
| ----------------------------- | ------------------------------------ | ---------------------------------------------------------- |
| Bot jest online, ale brak odpowiedzi na serwerze | `openclaw channels status --probe`  | Zezwól na serwer/kanał i sprawdź uprawnienie do treści wiadomości. |
| Wiadomości grupowe są ignorowane | Sprawdź w logach odrzucenia przez wymóg wzmianki | Wspomnij bota albo ustaw `requireMention: false` dla serwera/kanału. |
| Brak odpowiedzi w DM          | `openclaw pairing list discord`      | Zatwierdź parowanie DM albo dostosuj politykę DM.          |

Pełne rozwiązywanie problemów: [/channels/discord#troubleshooting](/pl/channels/discord#troubleshooting)

## Slack

### Sygnatury awarii Slack

| Objaw                                   | Najszybsza kontrola                      | Poprawka                                                                                                                                             |
| --------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode jest połączony, ale brak odpowiedzi | `openclaw channels status --probe`        | Sprawdź token aplikacji, token bota i wymagane scope'y; zwracaj uwagę na `botTokenStatus` / `appTokenStatus = configured_unavailable` w konfiguracjach opartych o SecretRef. |
| DM są blokowane                         | `openclaw pairing list slack`            | Zatwierdź parowanie albo złagodź politykę DM.                                                                                                       |
| Wiadomość na kanale jest ignorowana     | Sprawdź `groupPolicy` i listę dozwolonych kanałów | Zezwól na kanał albo zmień politykę na `open`.                                                                                                      |

Pełne rozwiązywanie problemów: [/channels/slack#troubleshooting](/pl/channels/slack#troubleshooting)

## iMessage i BlueBubbles

### Sygnatury awarii iMessage i BlueBubbles

| Objaw                            | Najszybsza kontrola                                                       | Poprawka                                              |
| -------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------- |
| Brak zdarzeń przychodzących      | Sprawdź dostępność webhooka/serwera i uprawnienia aplikacji               | Napraw URL webhooka albo stan serwera BlueBubbles.    |
| Można wysyłać, ale nie odbiera na macOS | Sprawdź uprawnienia prywatności macOS dla automatyzacji Messages          | Ponownie nadaj uprawnienia TCC i uruchom ponownie proces kanału. |
| Nadawca DM jest blokowany        | `openclaw pairing list imessage` lub `openclaw pairing list bluebubbles` | Zatwierdź parowanie albo zaktualizuj listę dozwolonych. |

Pełne rozwiązywanie problemów:

- [/channels/imessage#troubleshooting](/pl/channels/imessage#troubleshooting)
- [/channels/bluebubbles#troubleshooting](/pl/channels/bluebubbles#troubleshooting)

## Signal

### Sygnatury awarii Signal

| Objaw                          | Najszybsza kontrola                 | Poprawka                                                 |
| ------------------------------ | ----------------------------------- | -------------------------------------------------------- |
| Daemon jest osiągalny, ale bot milczy | `openclaw channels status --probe` | Sprawdź URL daemon `signal-cli`, konto i tryb odbioru.   |
| DM jest blokowany              | `openclaw pairing list signal`      | Zatwierdź nadawcę albo dostosuj politykę DM.             |
| Odpowiedzi w grupach się nie uruchamiają | Sprawdź listę dozwolonych grup i wzorce wzmianek | Dodaj nadawcę/grupę albo złagodź reguły filtrowania.     |

Pełne rozwiązywanie problemów: [/channels/signal#troubleshooting](/pl/channels/signal#troubleshooting)

## QQ Bot

### Sygnatury awarii QQ Bot

| Objaw                          | Najszybsza kontrola                           | Poprawka                                                        |
| ------------------------------ | --------------------------------------------- | --------------------------------------------------------------- |
| Bot odpowiada „gone to Mars”   | Sprawdź `appId` i `clientSecret` w konfiguracji | Ustaw poświadczenia albo uruchom ponownie gateway.              |
| Brak wiadomości przychodzących | `openclaw channels status --probe`            | Sprawdź poświadczenia na QQ Open Platform.                      |
| Głos nie jest transkrybowany   | Sprawdź konfigurację providera STT            | Skonfiguruj `channels.qqbot.stt` albo `tools.media.audio`.      |
| Wiadomości proaktywne nie docierają | Sprawdź wymagania interakcji platformy QQ     | QQ może blokować wiadomości inicjowane przez bota bez niedawnej interakcji. |

Pełne rozwiązywanie problemów: [/channels/qqbot#troubleshooting](/pl/channels/qqbot#troubleshooting)

## Matrix

### Sygnatury awarii Matrix

| Objaw                               | Najszybsza kontrola                      | Poprawka                                                                      |
| ----------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| Zalogowano, ale ignoruje wiadomości z pokoju | `openclaw channels status --probe`     | Sprawdź `groupPolicy`, listę dozwolonych pokoi i filtrowanie po wzmiankach.   |
| DM nie są przetwarzane              | `openclaw pairing list matrix`          | Zatwierdź nadawcę albo dostosuj politykę DM.                                  |
| Zaszyfrowane pokoje nie działają    | `openclaw matrix verify status`         | Zweryfikuj urządzenie ponownie, a potem sprawdź `openclaw matrix verify backup status`. |
| Odtwarzanie kopii zapasowej oczekuje/jest uszkodzone | `openclaw matrix verify backup status` | Uruchom `openclaw matrix verify backup restore` albo wykonaj ponownie z kluczem odzyskiwania. |
| Cross-signing/bootstrap wygląda nieprawidłowo | `openclaw matrix verify bootstrap`     | Napraw secret storage, cross-signing i stan kopii zapasowej w jednym przebiegu. |

Pełna konfiguracja i instalacja: [Matrix](/pl/channels/matrix)

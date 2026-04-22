---
read_when:
    - Transport kanału pokazuje połączenie, ale odpowiedzi nie działają
    - Potrzebujesz sprawdzeń specyficznych dla kanału, zanim przejdziesz do szczegółowej dokumentacji dostawcy
summary: Szybkie rozwiązywanie problemów na poziomie kanału z sygnaturami awarii i poprawkami dla każdego kanału osobno
title: Rozwiązywanie problemów z kanałami
x-i18n:
    generated_at: "2026-04-22T04:21:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c57934b52086ea5f41565c5aae77ef6fa772cf7d56a6427655a844a5c63d1c6
    source_path: channels/troubleshooting.md
    workflow: 15
---

# Rozwiązywanie problemów z kanałami

Użyj tej strony, gdy kanał łączy się, ale działa nieprawidłowo.

## Drabina poleceń

Najpierw uruchom je w tej kolejności:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Stan prawidłowy:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` lub `admin-capable`
- Test kanału pokazuje połączony transport i, tam gdzie jest to obsługiwane, `works` lub `audit ok`

## WhatsApp

### Sygnatury awarii WhatsApp

| Objaw                           | Najszybsze sprawdzenie                              | Poprawka                                                 |
| ------------------------------- | -------------------------------------------------- | -------------------------------------------------------- |
| Połączono, ale brak odpowiedzi w DM | `openclaw pairing list whatsapp`                | Zatwierdź nadawcę lub zmień politykę DM/listę dozwolonych. |
| Wiadomości grupowe są ignorowane | Sprawdź `requireMention` i wzorce wzmianek w konfiguracji | Wspomnij bota lub złagodź politykę wzmianek dla tej grupy. |
| Losowe rozłączenia/pętle ponownego logowania | `openclaw channels status --probe` + logi | Zaloguj się ponownie i sprawdź, czy katalog danych uwierzytelniających jest w dobrym stanie. |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z WhatsApp](/pl/channels/whatsapp#troubleshooting)

## Telegram

### Sygnatury awarii Telegram

| Objaw                                   | Najszybsze sprawdzenie                           | Poprawka                                                                                                                     |
| --------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `/start`, ale brak użytecznego przepływu odpowiedzi | `openclaw pairing list telegram`        | Zatwierdź parowanie lub zmień politykę DM.                                                                                   |
| Bot jest online, ale grupa milczy       | Sprawdź wymóg wzmianki i tryb prywatności bota   | Wyłącz tryb prywatności dla widoczności w grupie lub wspomnij bota.                                                         |
| Błędy wysyłania z błędami sieciowymi     | Sprawdź logi pod kątem błędów wywołań API Telegram | Napraw routing DNS/IPv6/proxy do `api.telegram.org`.                                                                         |
| Polling się zawiesza lub wolno ponawia połączenie | `openclaw logs --follow` dla diagnostyki pollingu | Zaktualizuj; jeśli restarty są fałszywymi alarmami, dostrój `pollingStallThresholdMs`. Utrzymujące się zawieszenia nadal wskazują na proxy/DNS/IPv6. |
| `setMyCommands` odrzucone przy starcie  | Sprawdź logi pod kątem `BOT_COMMANDS_TOO_MUCH`    | Ogranicz polecenia Telegram pluginów/Skills/niestandardowe lub wyłącz natywne menu.                                         |
| Po aktualizacji blokuje cię lista dozwolonych | `openclaw security audit` i listy dozwolonych w konfiguracji | Uruchom `openclaw doctor --fix` lub zastąp `@username` liczbowymi identyfikatorami nadawców.                                |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z Telegram](/pl/channels/telegram#troubleshooting)

## Discord

### Sygnatury awarii Discord

| Objaw                           | Najszybsze sprawdzenie              | Poprawka                                                    |
| ------------------------------- | ----------------------------------- | ----------------------------------------------------------- |
| Bot jest online, ale brak odpowiedzi na serwerze | `openclaw channels status --probe` | Zezwól na serwer/kanał i sprawdź intencję zawartości wiadomości. |
| Wiadomości grupowe są ignorowane | Sprawdź logi pod kątem odrzuceń przez ograniczanie do wzmianek | Wspomnij bota lub ustaw `requireMention: false` dla serwera/kanału. |
| Brak odpowiedzi w DM            | `openclaw pairing list discord`     | Zatwierdź parowanie DM lub dostosuj politykę DM.            |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z Discord](/pl/channels/discord#troubleshooting)

## Slack

### Sygnatury awarii Slack

| Objaw                                    | Najszybsze sprawdzenie                    | Poprawka                                                                                                                                             |
| ---------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode połączony, ale brak odpowiedzi | `openclaw channels status --probe`      | Sprawdź token aplikacji i token bota oraz wymagane zakresy; obserwuj `botTokenStatus` / `appTokenStatus = configured_unavailable` w konfiguracjach opartych na SecretRef. |
| DM są blokowane                          | `openclaw pairing list slack`             | Zatwierdź parowanie lub złagodź politykę DM.                                                                                                         |
| Wiadomość na kanale jest ignorowana      | Sprawdź `groupPolicy` i listę dozwolonych kanałów | Zezwól na kanał lub zmień politykę na `open`.                                                                                                        |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z Slack](/pl/channels/slack#troubleshooting)

## iMessage i BlueBubbles

### Sygnatury awarii iMessage i BlueBubbles

| Objaw                            | Najszybsze sprawdzenie                                                  | Poprawka                                              |
| -------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| Brak zdarzeń przychodzących      | Sprawdź osiągalność Webhooka/serwera i uprawnienia aplikacji            | Napraw URL Webhooka lub stan serwera BlueBubbles.     |
| Można wysyłać, ale nie odbiera na macOS | Sprawdź uprawnienia prywatności macOS dla automatyzacji Messages | Ponownie przyznaj uprawnienia TCC i uruchom ponownie proces kanału. |
| Nadawca DM jest blokowany        | `openclaw pairing list imessage` lub `openclaw pairing list bluebubbles` | Zatwierdź parowanie lub zaktualizuj listę dozwolonych. |

Pełne rozwiązywanie problemów:

- [Rozwiązywanie problemów z iMessage](/pl/channels/imessage#troubleshooting)
- [Rozwiązywanie problemów z BlueBubbles](/pl/channels/bluebubbles#troubleshooting)

## Signal

### Sygnatury awarii Signal

| Objaw                           | Najszybsze sprawdzenie              | Poprawka                                                 |
| ------------------------------- | ----------------------------------- | -------------------------------------------------------- |
| Demon jest osiągalny, ale bot milczy | `openclaw channels status --probe` | Sprawdź URL/konto demona `signal-cli` i tryb odbierania. |
| DM jest blokowany               | `openclaw pairing list signal`      | Zatwierdź nadawcę lub dostosuj politykę DM.              |
| Odpowiedzi grupowe się nie uruchamiają | Sprawdź listę dozwolonych grup i wzorce wzmianek | Dodaj nadawcę/grupę lub złagodź ograniczenia.            |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z Signal](/pl/channels/signal#troubleshooting)

## Bot QQ

### Sygnatury awarii bota QQ

| Objaw                           | Najszybsze sprawdzenie                      | Poprawka                                                          |
| ------------------------------- | ------------------------------------------ | ----------------------------------------------------------------- |
| Bot odpowiada „gone to Mars”    | Sprawdź `appId` i `clientSecret` w konfiguracji | Ustaw dane uwierzytelniające lub uruchom ponownie Gateway.        |
| Brak wiadomości przychodzących  | `openclaw channels status --probe`         | Sprawdź dane uwierzytelniające na QQ Open Platform.               |
| Głos nie jest transkrybowany    | Sprawdź konfigurację dostawcy STT          | Skonfiguruj `channels.qqbot.stt` lub `tools.media.audio`.         |
| Wiadomości proaktywne nie docierają | Sprawdź wymagania platformy QQ dotyczące interakcji | QQ może blokować wiadomości inicjowane przez bota bez niedawnej interakcji. |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z QQ Bot](/pl/channels/qqbot#troubleshooting)

## Matrix

### Sygnatury awarii Matrix

| Objaw                                   | Najszybsze sprawdzenie                 | Poprawka                                                                   |
| --------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------- |
| Zalogowano, ale ignoruje wiadomości w pokojach | `openclaw channels status --probe` | Sprawdź `groupPolicy`, listę dozwolonych pokoi i ograniczanie do wzmianek. |
| DM nie są przetwarzane                  | `openclaw pairing list matrix`         | Zatwierdź nadawcę lub dostosuj politykę DM.                                |
| Zaszyfrowane pokoje nie działają        | `openclaw matrix verify status`        | Ponownie zweryfikuj urządzenie, a potem sprawdź `openclaw matrix verify backup status`. |
| Przywracanie kopii zapasowej oczekuje/jest uszkodzone | `openclaw matrix verify backup status` | Uruchom `openclaw matrix verify backup restore` lub wykonaj ponownie z kluczem odzyskiwania. |
| Cross-signing/bootstrap wygląda nieprawidłowo | `openclaw matrix verify bootstrap` | Napraw w jednym przebiegu stan magazynu sekretów, cross-signing i kopii zapasowej. |

Pełna konfiguracja i ustawienia: [Matrix](/pl/channels/matrix)

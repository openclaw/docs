---
read_when:
    - Transport kanału zgłasza połączenie, ale odpowiedzi kończą się niepowodzeniem
    - Przed szczegółową dokumentacją dostawcy wymagane są kontrole specyficzne dla kanału
summary: Szybkie rozwiązywanie problemów na poziomie kanału z sygnaturami awarii i poprawkami dla poszczególnych kanałów
title: Rozwiązywanie problemów z kanałami
x-i18n:
    generated_at: "2026-05-10T19:24:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9a314cd772e15c038008b78603f811caaa40a3be31e7268c8fb1eefbb000b32
    source_path: channels/troubleshooting.md
    workflow: 16
---

Użyj tej strony, gdy kanał się łączy, ale zachowanie jest nieprawidłowe.

## Drabina poleceń

Najpierw uruchom je po kolei:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Zdrowa wartość bazowa:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` lub `admin-capable`
- Sonda kanału pokazuje połączony transport oraz, tam gdzie jest to obsługiwane, `works` lub `audit ok`

## WhatsApp

### Sygnatury awarii WhatsApp

| Objaw                               | Najszybsze sprawdzenie                              | Naprawa                                                                                                                                     |
| ----------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Połączono, ale brak odpowiedzi DM   | `openclaw pairing list whatsapp`                    | Zatwierdź nadawcę albo zmień politykę/listę dozwolonych DM.                                                                                 |
| Wiadomości grupowe ignorowane       | Sprawdź `requireMention` i wzorce wzmianek w config | Wspomnij bota albo złagodź politykę wzmianek dla tej grupy.                                                                                 |
| Logowanie QR kończy się 408         | Sprawdź zmienne env Gateway `HTTPS_PROXY` / `HTTP_PROXY` | Ustaw osiągalny serwer proxy; używaj `NO_PROXY` tylko do obejść.                                                                            |
| Losowe pętle rozłączeń/logowania    | `openclaw channels status --probe` + logi           | Ostatnie ponowne połączenia są oznaczane nawet przy obecnym połączeniu; obserwuj logi, zrestartuj Gateway, a potem połącz ponownie, jeśli niestabilność trwa. |
| Odpowiedzi przychodzą po sekundach/minutach | `openclaw doctor --fix`                             | Doctor zatrzymuje zweryfikowane przestarzałe lokalne klienty TUI, gdy pogarszają pętlę zdarzeń Gateway.                                     |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z WhatsApp](/pl/channels/whatsapp#troubleshooting)

## Telegram

### Sygnatury awarii Telegram

| Objaw                                | Najszybsze sprawdzenie                           | Naprawa                                                                                                                      |
| ------------------------------------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `/start`, ale brak użytecznego przepływu odpowiedzi | `openclaw pairing list telegram`                 | Zatwierdź parowanie albo zmień politykę DM.                                                                                  |
| Bot online, ale grupa pozostaje cicha | Zweryfikuj wymaganie wzmianki i tryb prywatności bota | Wyłącz tryb prywatności dla widoczności w grupie albo wspomnij bota.                                                         |
| Błędy wysyłania z błędami sieci       | Sprawdź logi pod kątem nieudanych wywołań API Telegram | Napraw routing DNS/IPv6/proxy do `api.telegram.org`.                                                                         |
| Uruchamianie zgłasza `getMe returned 401` | Sprawdź skonfigurowane źródło tokenu              | Skopiuj ponownie albo wygeneruj ponownie token BotFather i zaktualizuj `botToken`, `tokenFile` lub domyślne konto `TELEGRAM_BOT_TOKEN`. |
| Odpytywanie zatrzymuje się lub wolno łączy ponownie | `openclaw logs --follow` dla diagnostyki odpytywania | Zaktualizuj; jeśli restarty są fałszywymi alarmami, dostrój `pollingStallThresholdMs`. Trwałe zatrzymania nadal wskazują na proxy/DNS/IPv6. |
| `setMyCommands` odrzucone przy uruchomieniu | Sprawdź logi pod kątem `BOT_COMMANDS_TOO_MUCH`    | Zmniejsz liczbę poleceń Telegram z Plugin/skill/niestandardowych albo wyłącz natywne menu.                                   |
| Po aktualizacji lista dozwolonych cię blokuje | `openclaw security audit` i listy dozwolonych w config | Uruchom `openclaw doctor --fix` albo zastąp `@username` numerycznymi identyfikatorami nadawców.                              |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z Telegram](/pl/channels/telegram#troubleshooting)

## Discord

### Sygnatury awarii Discord

| Objaw                                      | Najszybsze sprawdzenie                                                 | Naprawa                                                                                                                                                                   |
| ------------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot online, ale brak odpowiedzi w gildii   | `openclaw channels status --probe`                                     | Zezwól na gildię/kanał i zweryfikuj intencję treści wiadomości.                                                                                                           |
| Wiadomości grupowe ignorowane              | Sprawdź logi pod kątem odrzuceń przez bramkowanie wzmianek             | Wspomnij bota albo ustaw `requireMention: false` dla gildii/kanału.                                                                                                       |
| Użycie pisania/tokenu, ale brak wiadomości Discord | Log sesji pokazuje tekst asystenta z `didSendViaMessagingTool: false` | Model odpowiedział prywatnie zamiast wywołać narzędzie wiadomości. Użyj modelu niezawodnego w wywołaniach narzędzi albo ustaw `messages.groupChat.visibleReplies: "automatic"`, aby publikować automatycznie. |
| Brak odpowiedzi DM                         | `openclaw pairing list discord`                                        | Zatwierdź parowanie DM albo dostosuj politykę DM.                                                                                                                         |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z Discord](/pl/channels/discord#troubleshooting)

## Slack

### Sygnatury awarii Slack

| Objaw                                | Najszybsze sprawdzenie                    | Naprawa                                                                                                                                                |
| ------------------------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Socket mode połączony, ale brak odpowiedzi | `openclaw channels status --probe`        | Zweryfikuj token aplikacji + token bota oraz wymagane zakresy; obserwuj `botTokenStatus` / `appTokenStatus = configured_unavailable` w konfiguracjach opartych na SecretRef. |
| DM zablokowane                       | `openclaw pairing list slack`             | Zatwierdź parowanie albo złagodź politykę DM.                                                                                                          |
| Wiadomość kanału ignorowana          | Sprawdź `groupPolicy` i listę dozwolonych kanałów | Zezwól na kanał albo zmień politykę na `open`.                                                                                                         |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów ze Slack](/pl/channels/slack#troubleshooting)

## iMessage

### Sygnatury awarii iMessage

| Objaw                              | Najszybsze sprawdzenie                                  | Naprawa                                                                  |
| ---------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------ |
| Brak `imsg` albo awaria poza macOS | `openclaw channels status --probe --channel imessage`   | Uruchom OpenClaw na Macu z Messages albo użyj wrappera SSH dla `cliPath`. |
| Można wysyłać, ale nie odbierać na macOS | Sprawdź uprawnienia prywatności macOS dla automatyzacji Messages | Przyznaj ponownie uprawnienia TCC i zrestartuj proces kanału.            |
| Nadawca DM zablokowany             | `openclaw pairing list imessage`                        | Zatwierdź parowanie albo zaktualizuj listę dozwolonych.                  |

Pełne rozwiązywanie problemów:

- [Rozwiązywanie problemów z iMessage](/pl/channels/imessage#troubleshooting)

## Signal

### Sygnatury awarii Signal

| Objaw                         | Najszybsze sprawdzenie                     | Naprawa                                                   |
| ----------------------------- | ------------------------------------------ | --------------------------------------------------------- |
| Daemon osiągalny, ale bot milczy | `openclaw channels status --probe`         | Zweryfikuj URL/konto daemon `signal-cli` i tryb odbioru.  |
| DM zablokowane                | `openclaw pairing list signal`             | Zatwierdź nadawcę albo dostosuj politykę DM.              |
| Odpowiedzi grupowe się nie uruchamiają | Sprawdź listę dozwolonych grup i wzorce wzmianek | Dodaj nadawcę/grupę albo poluzuj bramkowanie.             |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z Signal](/pl/channels/signal#troubleshooting)

## QQ Bot

### Sygnatury awarii QQ Bot

| Objaw                         | Najszybsze sprawdzenie                       | Naprawa                                                        |
| ----------------------------- | ------------------------------------------- | -------------------------------------------------------------- |
| Bot odpowiada "gone to Mars"  | Zweryfikuj `appId` i `clientSecret` w config | Ustaw dane uwierzytelniające albo zrestartuj Gateway.          |
| Brak wiadomości przychodzących | `openclaw channels status --probe`          | Zweryfikuj dane uwierzytelniające na QQ Open Platform.         |
| Głos nie jest transkrybowany  | Sprawdź config dostawcy STT                 | Skonfiguruj `channels.qqbot.stt` albo `tools.media.audio`.     |
| Wiadomości proaktywne nie docierają | Sprawdź wymagania interakcji platformy QQ  | QQ może blokować wiadomości inicjowane przez bota bez niedawnej interakcji. |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z QQ Bot](/pl/channels/qqbot#troubleshooting)

## Matrix

### Sygnatury awarii Matrix

| Objaw                               | Najszybsze sprawdzenie                   | Naprawa                                                                       |
| ----------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| Zalogowano, ale ignoruje wiadomości w pokojach | `openclaw channels status --probe`       | Sprawdź `groupPolicy`, listę dozwolonych pokojów i bramkowanie wzmianek.      |
| DM nie są przetwarzane              | `openclaw pairing list matrix`           | Zatwierdź nadawcę albo dostosuj politykę DM.                                  |
| Zaszyfrowane pokoje zawodzą         | `openclaw matrix verify status`          | Zweryfikuj ponownie urządzenie, potem sprawdź `openclaw matrix verify backup status`. |
| Przywracanie kopii zapasowej oczekuje/uszkodzone | `openclaw matrix verify backup status`   | Uruchom `openclaw matrix verify backup restore` albo ponów z kluczem odzyskiwania. |
| Cross-signing/bootstrap wygląda nieprawidłowo | `openclaw matrix verify bootstrap`       | Napraw tajny magazyn, cross-signing i stan kopii zapasowej w jednym przebiegu. |

Pełna konfiguracja i config: [Matrix](/pl/channels/matrix)

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Routing kanałów](/pl/channels/channel-routing)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)

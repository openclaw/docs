---
read_when:
    - Transport kanału pokazuje połączenie, ale odpowiedzi nie działają
    - Potrzebujesz kontroli specyficznych dla kanału przed zagłębieniem się w dokumentację providera
summary: Szybkie rozwiązywanie problemów na poziomie kanału z sygnaturami awarii i poprawkami dla poszczególnych kanałów
title: Rozwiązywanie problemów z kanałami
x-i18n:
    generated_at: "2026-04-24T09:00:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae605835c3566958341b11d8bdfc3cd4cb4656142bb2953933d06ed6018a483f
    source_path: channels/troubleshooting.md
    workflow: 15
---

Użyj tej strony, gdy kanał się łączy, ale działa nieprawidłowo.

## Drabina poleceń

Najpierw uruchom je w tej kolejności:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Prawidłowa baza:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable` lub `admin-capable`
- Sonda kanału pokazuje połączony transport oraz, tam gdzie jest to obsługiwane, `works` lub `audit ok`

## WhatsApp

### Sygnatury awarii WhatsApp

| Objaw                           | Najszybsza kontrola                            | Poprawka                                               |
| ------------------------------- | --------------------------------------------- | ------------------------------------------------------ |
| Połączono, ale brak odpowiedzi DM | `openclaw pairing list whatsapp`              | Zatwierdź nadawcę albo przełącz zasady DM/allowlist.   |
| Wiadomości grupowe są ignorowane | Sprawdź `requireMention` + wzorce wzmianek w konfiguracji | Wspomnij bota albo poluzuj zasady wzmianek dla tej grupy. |
| Losowe rozłączenia/pętle ponownego logowania | `openclaw channels status --probe` + logi | Zaloguj się ponownie i sprawdź, czy katalog poświadczeń jest w dobrym stanie.   |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z WhatsApp](/pl/channels/whatsapp#troubleshooting)

## Telegram

### Sygnatury awarii Telegram

| Objaw                               | Najszybsza kontrola                             | Poprawka                                                                                                                    |
| ----------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `/start`, ale brak użytecznego przepływu odpowiedzi | `openclaw pairing list telegram`                | Zatwierdź parowanie albo zmień zasady DM.                                                                                   |
| Bot online, ale grupa milczy        | Sprawdź wymóg wzmianki i tryb prywatności bota  | Wyłącz tryb prywatności, aby bot widział grupę, albo wspomnij bota.                                                        |
| Błędy wysyłania z błędami sieciowymi | Sprawdź logi pod kątem błędów wywołań Telegram API | Napraw routing DNS/IPv6/proxy do `api.telegram.org`.                                                                        |
| Polling zawiesza się lub wolno ponownie łączy | `openclaw logs --follow` dla diagnostyki pollingu | Zaktualizuj; jeśli restarty są fałszywymi alarmami, dostrój `pollingStallThresholdMs`. Uporczywe zawieszenia nadal wskazują na proxy/DNS/IPv6. |
| `setMyCommands` odrzucone przy starcie | Sprawdź logi pod kątem `BOT_COMMANDS_TOO_MUCH`  | Ogranicz polecenia Telegram z Plugin/Skills/niestandardowe albo wyłącz natywne menu.                                       |
| Po aktualizacji allowlist cię blokuje | `openclaw security audit` i allowlist w konfiguracji | Uruchom `openclaw doctor --fix` albo zastąp `@username` numerycznymi identyfikatorami nadawców.                            |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z Telegram](/pl/channels/telegram#troubleshooting)

## Discord

### Sygnatury awarii Discord

| Objaw                           | Najszybsza kontrola                  | Poprawka                                                   |
| ------------------------------- | ------------------------------------ | ---------------------------------------------------------- |
| Bot online, ale brak odpowiedzi na serwerze | `openclaw channels status --probe`   | Zezwól na serwer/kanał i sprawdź Message Content Intent.   |
| Wiadomości grupowe są ignorowane | Sprawdź logi pod kątem odrzuceń przez blokadę wzmianek | Wspomnij bota albo ustaw `requireMention: false` dla serwera/kanału. |
| Brak odpowiedzi DM              | `openclaw pairing list discord`      | Zatwierdź parowanie DM albo dostosuj zasady DM.            |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z Discord](/pl/channels/discord#troubleshooting)

## Slack

### Sygnatury awarii Slack

| Objaw                                  | Najszybsza kontrola                    | Poprawka                                                                                                                                               |
| -------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Socket mode połączony, ale brak odpowiedzi | `openclaw channels status --probe`     | Sprawdź token aplikacji + token bota i wymagane zakresy; obserwuj `botTokenStatus` / `appTokenStatus = configured_unavailable` w konfiguracjach opartych na SecretRef. |
| DM zablokowane                         | `openclaw pairing list slack`          | Zatwierdź parowanie albo poluzuj zasady DM.                                                                                                            |
| Wiadomość na kanale jest ignorowana    | Sprawdź `groupPolicy` i allowlist kanału | Zezwól na kanał albo przełącz zasady na `open`.                                                                                                        |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z Slack](/pl/channels/slack#troubleshooting)

## iMessage i BlueBubbles

### Sygnatury awarii iMessage i BlueBubbles

| Objaw                            | Najszybsza kontrola                                                | Poprawka                                             |
| -------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------- |
| Brak zdarzeń przychodzących      | Sprawdź osiągalność Webhook/server i uprawnienia aplikacji         | Napraw adres URL Webhook albo stan serwera BlueBubbles. |
| Można wysyłać, ale brak odbioru w macOS | Sprawdź uprawnienia prywatności macOS dla automatyzacji Messages | Ponownie nadaj uprawnienia TCC i uruchom proces kanału ponownie. |
| Nadawca DM jest zablokowany      | `openclaw pairing list imessage` lub `openclaw pairing list bluebubbles` | Zatwierdź parowanie albo zaktualizuj allowlist.      |

Pełne rozwiązywanie problemów:

- [Rozwiązywanie problemów z iMessage](/pl/channels/imessage#troubleshooting)
- [Rozwiązywanie problemów z BlueBubbles](/pl/channels/bluebubbles#troubleshooting)

## Signal

### Sygnatury awarii Signal

| Objaw                           | Najszybsza kontrola                   | Poprawka                                                  |
| ------------------------------- | ------------------------------------- | --------------------------------------------------------- |
| Demon jest osiągalny, ale bot milczy | `openclaw channels status --probe`    | Sprawdź adres URL/konto demona `signal-cli` i tryb odbioru. |
| DM zablokowane                  | `openclaw pairing list signal`        | Zatwierdź nadawcę albo dostosuj zasady DM.                |
| Odpowiedzi grupowe się nie uruchamiają | Sprawdź allowlist grupy i wzorce wzmianek | Dodaj nadawcę/grupę albo poluzuj bramkowanie.             |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z Signal](/pl/channels/signal#troubleshooting)

## QQ Bot

### Sygnatury awarii QQ Bot

| Objaw                           | Najszybsza kontrola                        | Poprawka                                                       |
| ------------------------------- | ------------------------------------------ | -------------------------------------------------------------- |
| Bot odpowiada „gone to Mars”    | Sprawdź `appId` i `clientSecret` w konfiguracji | Ustaw poświadczenia albo uruchom Gateway ponownie.             |
| Brak wiadomości przychodzących  | `openclaw channels status --probe`         | Sprawdź poświadczenia na QQ Open Platform.                     |
| Głos nie jest transkrybowany    | Sprawdź konfigurację providera STT         | Skonfiguruj `channels.qqbot.stt` lub `tools.media.audio`.      |
| Proaktywne wiadomości nie docierają | Sprawdź wymagania QQ Platform dotyczące interakcji | QQ może blokować wiadomości inicjowane przez bota bez niedawnej interakcji. |

Pełne rozwiązywanie problemów: [Rozwiązywanie problemów z QQ Bot](/pl/channels/qqbot#troubleshooting)

## Matrix

### Sygnatury awarii Matrix

| Objaw                               | Najszybsza kontrola                     | Poprawka                                                                   |
| ----------------------------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| Zalogowano, ale ignoruje wiadomości w pokoju | `openclaw channels status --probe`      | Sprawdź `groupPolicy`, allowlist pokoju i blokadę wzmianek.                |
| DM nie są przetwarzane              | `openclaw pairing list matrix`          | Zatwierdź nadawcę albo dostosuj zasady DM.                                 |
| Szyfrowane pokoje nie działają      | `openclaw matrix verify status`         | Ponownie zweryfikuj urządzenie, a następnie sprawdź `openclaw matrix verify backup status`. |
| Przywracanie kopii zapasowej oczekuje/jest uszkodzone | `openclaw matrix verify backup status` | Uruchom `openclaw matrix verify backup restore` albo uruchom ponownie z kluczem odzyskiwania. |
| Cross-signing/bootstrap wygląda nieprawidłowo | `openclaw matrix verify bootstrap`      | Napraw magazyn sekretów, cross-signing i stan kopii zapasowej w jednym przebiegu. |

Pełna konfiguracja i ustawienia: [Matrix](/pl/channels/matrix)

## Powiązane

- [Parowanie](/pl/channels/pairing)
- [Routowanie kanałów](/pl/channels/channel-routing)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)

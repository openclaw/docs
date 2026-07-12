---
read_when:
    - Praca nad funkcjami Zalo lub webhookami
summary: Stan obsługi, możliwości i konfiguracja bota Zalo
title: Zalo
x-i18n:
    generated_at: "2026-07-12T14:55:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 36e624f1abeeaee56d7376b9df9209f8e7614ade2f089bcecd76ff746b942765
    source_path: channels/zalo.md
    workflow: 16
---

Status: eksperymentalny. Zaimplementowano zarówno wiadomości bezpośrednie, jak i czaty grupowe; poniższa tabela [Możliwości](#capabilities) przedstawia zachowanie zweryfikowane dla botów Zalo Bot Creator / Marketplace.

## Dołączony plugin

Zalo jest dostarczane jako dołączony plugin w bieżących wydaniach OpenClaw, więc kompilacje pakietowe nie wymagają osobnej instalacji.

W starszej kompilacji lub instalacji niestandardowej, która nie zawiera Zalo, zainstaluj pakiet npm bezpośrednio:

- Instalacja: `openclaw plugins install @openclaw/zalo`
- Przypięta wersja: `openclaw plugins install @openclaw/zalo@2026.6.11`
- Z lokalnego repozytorium roboczego: `openclaw plugins install ./path/to/local/zalo-plugin`
- Szczegóły: [Pluginy](/pl/tools/plugin)

## Szybka konfiguracja

1. Utwórz token bota na stronie [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) (zaloguj się, utwórz bota i skonfiguruj ustawienia). Token ma postać `numeric_id:secret`; w przypadku botów Marketplace token używany w środowisku uruchomieniowym może znajdować się w wiadomości powitalnej bota.
2. Ustaw token jako zmienną środowiskową `ZALO_BOT_TOKEN=...` (tylko dla konta domyślnego) lub w konfiguracji.
3. Uruchom ponownie Gateway.
4. Przy pierwszym kontakcie przez wiadomość bezpośrednią zatwierdź kod parowania (domyślna zasada wiadomości bezpośrednich to parowanie).

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

Wiele kont: dodaj kolejne wpisy w `channels.zalo.accounts.<id>`, każdy z własnymi wartościami `botToken`/`name`. `channels.zalo.botToken` (płaska forma bez `accounts`) to starszy skrót konfiguracji jednego konta; w nowych konfiguracjach preferuj `accounts.<id>.*`.

## Czym jest Zalo

Zalo to aplikacja do komunikacji przeznaczona głównie na rynek wietnamski. Jej Bot API umożliwia Gateway obsługę bota zarówno w rozmowach indywidualnych, jak i czatach grupowych, z deterministycznym kierowaniem odpowiedzi z powrotem do Zalo (model nigdy nie wybiera kanałów).

Ta strona dotyczy **botów Zalo Bot Creator / Marketplace**. **Boty Zalo Official Account (OA)** stanowią inny obszar produktu i mogą zachowywać się inaczej; ta strona ich nie obejmuje.

## Jak to działa

- Wiadomości przychodzące są normalizowane do wspólnej otoczki kanału z symbolami zastępczymi multimediów.
- Odpowiedzi są zawsze kierowane z powrotem do tego samego czatu Zalo; odpowiedź z cytowaniem nie jest używana (`replyToMode` jest trwale wyłączony).
- Domyślnie używane jest długie odpytywanie (`getUpdates`); tryb Webhook jest dostępny przez `channels.zalo.webhookUrl`.
- W grupach do wywołania bota wymagane jest użycie @wzmianki; nie można tego skonfigurować osobno dla kanału.

## Limity

| Limit                              | Wartość                                                                                 |
| ---------------------------------- | --------------------------------------------------------------------------------------- |
| Rozmiar fragmentu tekstu wychodzącego | 2000 znaków (limit API Zalo)                                                         |
| Rozmiar multimediów (przychodzących/wychodzących) | `channels.zalo.mediaMaxMb`, domyślnie `5` MB                              |
| Treść żądania Webhook              | 1 MB, limit czasu odczytu 30 s                                                          |
| Limit częstotliwości Webhook       | 120 żądań / 60 s na ścieżkę i adres IP klienta, następnie HTTP 429                     |
| Okno zduplikowanych zdarzeń Webhook | 5 minut (klucz: ścieżka + konto + nazwa zdarzenia + czat + nadawca + identyfikator wiadomości) |

## Kontrola dostępu

### Wiadomości bezpośrednie

- `channels.zalo.dmPolicy`: `pairing` (domyślnie) | `allowlist` | `open` | `disabled`.
- Parowanie: nieznani nadawcy otrzymują kod parowania; wiadomości są ignorowane do czasu zatwierdzenia. Kody wygasają po 1 godzinie.
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
  - Szczegóły: [Parowanie](/pl/channels/pairing)
- `channels.zalo.allowFrom` przyjmuje numeryczne identyfikatory użytkowników Zalo (bez wyszukiwania według nazwy użytkownika). `open` wymaga `"*"`.

### Grupy

Czaty grupowe są obsługiwane przez plugin (`chatTypes: ["direct", "group"]`), a dostęp jest ograniczony przez wymóg wzmianki oraz zasady grup:

- `channels.zalo.groupPolicy`: `open` | `allowlist` | `disabled`.
- `channels.zalo.groupAllowFrom` ogranicza identyfikatory nadawców, którzy mogą wywołać bota w grupach; jeśli nie ustawiono tej opcji, używana jest wartość `allowFrom`.
- Domyślne rozstrzyganie: gdy skonfigurowano `channels.zalo`, nieustawiona wartość `groupPolicy` jest rozstrzygana jako `open`. Gdy całkowicie brakuje `channels.zalo`, środowisko uruchomieniowe bezpiecznie przyjmuje `allowlist`.
- Zgłaszane zastrzeżenie z praktycznego użycia: w niektórych konfiguracjach botów Marketplace nie można było w ogóle dodać bota do grupy. Jeśli wystąpi ten problem, zweryfikuj ustawienia bota na Zalo Bot Platform; jest to ograniczenie platformy, a nie zasada OpenClaw.

## Długie odpytywanie a Webhook

- Domyślnie: długie odpytywanie (publiczny adres URL nie jest wymagany).
- Tryb Webhook: ustaw `channels.zalo.webhookUrl` i `channels.zalo.webhookSecret`.
  - Adres URL Webhook musi używać HTTPS.
  - Sekret Webhook musi mieć od 8 do 256 znaków.
  - Zalo wysyła zdarzenia z nagłówkiem `X-Bot-Api-Secret-Token`, który jest sprawdzany za pomocą porównania w stałym czasie.
  - Serwer HTTP Gateway obsługuje żądania Webhook pod ścieżką `channels.zalo.webhookPath` (domyślnie jest to ścieżka adresu URL Webhook).
  - Żądania muszą używać `Content-Type: application/json` (lub typu multimediów z przyrostkiem `+json`).
  - Zgodnie z dokumentacją API Zalo odpytywanie getUpdates i Webhook wzajemnie się wykluczają.

## Obsługiwane typy wiadomości

- Tekst: pełna obsługa, dzielony na fragmenty po 2000 znaków.
- Multimedia: przychodzące i wychodzące, ograniczone przez `mediaMaxMb`.
- Reakcje, wątki, ankiety i polecenia natywne: nie są obsługiwane przez plugin.
- Przesyłanie strumieniowe: plugin deklaruje możliwość strumieniowego przesyłania bloków, ale Zalo nie ma osobnych opcji dostrajania kolejki wychodzącej ani scalania tekstu (w przeciwieństwie do niektórych innych kanałów regionalnych); jeśli ma to znaczenie w Twoim zastosowaniu, zweryfikuj bieżące zachowanie w swoim środowisku.

## Możliwości

| Funkcja                          | Status                                      |
| -------------------------------- | ------------------------------------------- |
| Wiadomości bezpośrednie          | Obsługiwane                                 |
| Grupy                            | Obsługiwane (wymagana wzmianka)             |
| Multimedia (przychodzące/wychodzące) | Obsługiwane, ograniczone przez `mediaMaxMb` |
| Reakcje                          | Nieobsługiwane                              |
| Wątki                            | Nieobsługiwane                              |
| Ankiety                          | Nieobsługiwane                              |
| Polecenia natywne                | Nieobsługiwane                              |
| Odpowiedź do / cytowanie         | Nieużywane (trwale wyłączone)               |

## Cele dostarczania (CLI/Cron)

Użyj identyfikatora czatu jako celu:

```bash
openclaw message send --channel zalo --target 123456789 --message "hi"
```

## Rozwiązywanie problemów

**Bot nie odpowiada:**

- Sprawdź token: `openclaw channels status --probe`
- Sprawdź, czy nadawca został zatwierdzony (przez parowanie lub `allowFrom`)
- Sprawdź dzienniki Gateway: `openclaw logs --follow`

**Webhook nie odbiera zdarzeń:**

- Upewnij się, że adres URL Webhook używa HTTPS
- Upewnij się, że sekret ma od 8 do 256 znaków
- Upewnij się, że punkt końcowy HTTP Gateway jest dostępny pod skonfigurowaną ścieżką
- Upewnij się, że odpytywanie getUpdates nie jest również uruchomione (te tryby wzajemnie się wykluczają)
- Nagły wzrost liczby żądań może powodować zwracanie HTTP 429 (120 żądań / 60 s na ścieżkę i adres IP); zwiększ odstęp i spróbuj ponownie

## Dokumentacja konfiguracji

Pełna konfiguracja: [Konfiguracja](/pl/gateway/configuration)

| Ustawienie                                   | Opis                                              | Wartość domyślna       |
| -------------------------------------------- | ------------------------------------------------- | ---------------------- |
| `channels.zalo.enabled`                      | Włącza lub wyłącza uruchamianie kanału            | `true`                 |
| `channels.zalo.accounts.<id>.botToken`       | Token bota z Zalo Bot Platform                    | -                      |
| `channels.zalo.accounts.<id>.tokenFile`      | Odczytuje token z pliku (dowiązania symboliczne są odrzucane) | -          |
| `channels.zalo.accounts.<id>.name`           | Nazwa wyświetlana                                 | -                      |
| `channels.zalo.accounts.<id>.enabled`        | Włącza lub wyłącza to konto                       | `true`                 |
| `channels.zalo.accounts.<id>.dmPolicy`       | Zasada wiadomości bezpośrednich dla danego konta  | `pairing`              |
| `channels.zalo.accounts.<id>.allowFrom`      | Lista dozwolonych wiadomości bezpośrednich (identyfikatory użytkowników) | - |
| `channels.zalo.accounts.<id>.groupPolicy`    | Zasada grup dla danego konta                      | zobacz [Grupy](#groups) |
| `channels.zalo.accounts.<id>.groupAllowFrom` | Lista dozwolonych nadawców grupowych; w razie braku używa `allowFrom` | - |
| `channels.zalo.accounts.<id>.mediaMaxMb`     | Limit multimediów przychodzących/wychodzących (MB) | `5`                   |
| `channels.zalo.accounts.<id>.webhookUrl`     | Włącza tryb Webhook (wymagane HTTPS)              | -                      |
| `channels.zalo.accounts.<id>.webhookSecret`  | Sekret Webhook (8–256 znaków)                     | -                      |
| `channels.zalo.accounts.<id>.webhookPath`    | Ścieżka Webhook na serwerze HTTP Gateway          | ścieżka adresu URL Webhook |
| `channels.zalo.accounts.<id>.proxy`          | Adres URL serwera proxy dla żądań API             | -                      |
| `channels.zalo.accounts.<id>.responsePrefix` | Zastąpienie prefiksu odpowiedzi wychodzącej       | -                      |
| `channels.zalo.defaultAccount`               | Konto domyślne, gdy skonfigurowano wiele kont     | `default`              |

`channels.zalo.botToken`, `channels.zalo.dmPolicy` i inne płaskie klucze najwyższego poziomu są starszym skrótem konfiguracji jednego konta dla powyższych pól; obsługiwane są obie formy.

Opcja środowiskowa: `ZALO_BOT_TOKEN=...` określa token wyłącznie dla konta domyślnego.

## Powiązane

- [Przegląd kanałów](/pl/channels) - wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) - uwierzytelnianie wiadomości bezpośrednich i proces parowania
- [Grupy](/pl/channels/groups) - zachowanie czatów grupowych i wymóg wzmianki
- [Kierowanie kanałów](/pl/channels/channel-routing) - kierowanie sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) - model dostępu i wzmacnianie zabezpieczeń

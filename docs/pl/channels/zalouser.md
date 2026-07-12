---
read_when:
    - Konfigurowanie Zalo Personal dla OpenClaw
    - Debugowanie logowania lub przepływu wiadomości w Zalo Personal
summary: Obsługa konta osobistego Zalo przez natywną bibliotekę zca-js (logowanie kodem QR), możliwości i konfiguracja
title: Zalo osobiste
x-i18n:
    generated_at: "2026-07-12T14:57:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 962697c4a56dfb733fe4973e23129ccb365506e35c09e673365842f45a837949
    source_path: channels/zalouser.md
    workflow: 16
---

Status: eksperymentalna. Ta integracja automatyzuje **osobiste konto Zalo** za pomocą natywnego `zca-js`, wewnątrz procesu, bez zewnętrznego pliku binarnego CLI.

<Warning>
Jest to nieoficjalna integracja, która może skutkować zawieszeniem lub zablokowaniem konta. Używasz jej na własne ryzyko.
</Warning>

## Instalacja

Zalo Personal jest oficjalnym zewnętrznym pluginem, niedołączonym do rdzenia. Zainstaluj go przed użyciem:

```bash
openclaw plugins install @openclaw/zalouser
```

- Przypnij wersję: `openclaw plugins install @openclaw/zalouser@<version>`
- Z kopii roboczej kodu źródłowego: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Szczegóły: [Pluginy](/pl/tools/plugin)

## Szybka konfiguracja

1. Zainstaluj plugin (powyżej).
2. Zaloguj się (kod QR, na komputerze z Gateway):
   - `openclaw channels login --channel zalouser`
   - Zeskanuj kod QR za pomocą aplikacji mobilnej Zalo.
3. Włącz kanał:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. Uruchom ponownie Gateway (lub dokończ konfigurację).
5. Dostęp do wiadomości prywatnych domyślnie korzysta z parowania; przy pierwszym kontakcie zatwierdź kod parowania.

## Czym jest ta integracja

- Działa w całości wewnątrz procesu za pośrednictwem biblioteki `zca-js` (bez zewnętrznego pliku binarnego `zca`/`openzca`).
- Używa natywnych detektorów zdarzeń (`message`, `error`) do odbierania wiadomości przychodzących.
- Wysyła odpowiedzi bezpośrednio przez interfejs API JS (tekst/multimedia/link).
- Jest przeznaczona do zastosowań z „kontem osobistym”, w których interfejs Zalo Bot API nie jest dostępny.

## Nazewnictwo

Identyfikator kanału to `zalouser`, aby wyraźnie wskazać, że automatyzowane jest **osobiste konto użytkownika Zalo** (nieoficjalnie). Identyfikator `zalo` jest zarezerwowany dla potencjalnej przyszłej oficjalnej integracji z interfejsem API Zalo.

## Znajdowanie identyfikatorów (katalog)

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Ograniczenia

- Tekst wychodzący jest dzielony na fragmenty po 2000 znaków (limit klienta Zalo).
- Strumieniowanie nie jest obsługiwane.

## Kontrola dostępu (wiadomości prywatne)

`channels.zalouser.dmPolicy`: `pairing | allowlist | open | disabled` (domyślnie: `pairing`).

W `channels.zalouser.allowFrom` należy używać stabilnych identyfikatorów użytkowników Zalo. Można również odwoływać się do statycznych grup dostępu nadawców (`accessGroup:<name>`). Podczas interaktywnej konfiguracji wprowadzone nazwy mogą zostać przekształcone na identyfikatory za pomocą działającego wewnątrz procesu mechanizmu wyszukiwania kontaktów pluginu.

Jeśli w konfiguracji pozostanie nieprzetworzona nazwa, podczas uruchamiania zostanie przekształcona tylko wtedy, gdy włączono `channels.zalouser.dangerouslyAllowNameMatching: true`. Bez tego jawnego ustawienia kontrole nadawców w czasie działania opierają się wyłącznie na identyfikatorach, a nieprzetworzone nazwy są ignorowane podczas autoryzacji.

Zatwierdź za pomocą:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Dostęp grupowy (opcjonalny)

- Domyślnie: `channels.zalouser.groupPolicy = "allowlist"` (grupy wymagają jawnego wpisu na liście dozwolonych).
- Otwórz wszystkie grupy: `channels.zalouser.groupPolicy = "open"`.
- Zablokuj wszystkie grupy: `channels.zalouser.groupPolicy = "disabled"`.
- Przy `groupPolicy = "allowlist"`:
  - Kluczami `channels.zalouser.groups` powinny być stabilne identyfikatory grup; nazwy są przekształcane na identyfikatory podczas uruchamiania tylko wtedy, gdy włączono `channels.zalouser.dangerouslyAllowNameMatching: true`.
  - `channels.zalouser.groupAllowFrom` określa, którzy nadawcy w dozwolonych grupach mogą aktywować bota; do statycznych grup dostępu nadawców można odwoływać się za pomocą `accessGroup:<name>`.
- Kreator konfiguracji może wyświetlić monit o listy dozwolonych grup.
- Domyślnie dopasowywanie listy dozwolonych grup opiera się wyłącznie na identyfikatorach. Nazwy, których nie udało się przekształcić, są ignorowane podczas autoryzacji, chyba że włączono `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` to awaryjny tryb zgodności, który ponownie włącza przekształcanie zmiennych nazw podczas uruchamiania i dopasowywanie nazw grup w czasie działania.
- W przypadku zwykłych wiadomości grupowych `groupAllowFrom` **nie** używa zastępczo `allowFrom`: pozostawienie tej wartości pustej dla grupy znajdującej się na liście dozwolonych otwiera tę grupę dla dowolnego nadawcy. Wyjątkiem są autoryzowane polecenia sterujące (na przykład `/new`); gdy `groupAllowFrom` jest puste, kontrole nadawcy polecenia używają zastępczo `allowFrom`.

Przykład:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { enabled: true },
        "Work Chat": { enabled: true },
      },
    },
  },
}
```

<Note>
`channels.zalouser.groups.<id>.allow` to starsza nazwa pola; bieżąca konfiguracja używa `enabled`. Polecenie `openclaw doctor --fix` automatycznie migruje `allow` do `enabled`.
</Note>

### Wymaganie wzmianki w grupie

- `channels.zalouser.groups.<group>.requireMention` określa, czy odpowiedzi w grupie wymagają wzmianki.
- Kolejność rozstrzygania: identyfikator grupy -> alias `group:<id>` -> nazwa/skrót grupy (kandydaci oparci na nazwach mają zastosowanie tylko przy `dangerouslyAllowNameMatching: true`) -> `*` -> wartość domyślna (`true`).
- Dotyczy zarówno grup z listy dozwolonych, jak i trybu otwartych grup.
- Zacytowanie wiadomości bota jest traktowane jako niejawna wzmianka aktywująca grupę.
- Autoryzowane polecenia sterujące (na przykład `/new`) mogą pomijać wymóg wzmianki.
- Gdy wiadomość grupowa zostanie pominięta z powodu wymaganej wzmianki, OpenClaw zapisuje ją jako oczekującą historię grupy i dołącza do następnej przetwarzanej wiadomości grupowej.
- Limit historii grupy: `channels.zalouser.historyLimit`, następnie `messages.groupChat.historyLimit`, a potem wartość zastępcza `50`.

Przykład:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { enabled: true, requireMention: true },
        "Work Chat": { enabled: true, requireMention: false },
      },
    },
  },
}
```

## Wiele kont

Konta są mapowane na profile `zalouser` w stanie OpenClaw. Przykład:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## Zmienne środowiskowe

Profil można również wybrać za pomocą zmiennych środowiskowych:

| Zmienna            | Przeznaczenie                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| `ZALOUSER_PROFILE` | Nazwa profilu używana, gdy `profile` nie ustawiono w konfiguracji kanału ani konta.                |
| `ZCA_PROFILE`      | Starsza wartość zastępcza, używana tylko wtedy, gdy `ZALOUSER_PROFILE` nie jest ustawiona.         |

Nazwy profili wybierają zapisane dane logowania Zalo w stanie OpenClaw. Kolejność rozstrzygania:

1. Jawnie określony `profile` w konfiguracji.
2. `ZALOUSER_PROFILE`.
3. `ZCA_PROFILE`.
4. Identyfikator konta w przypadku kont innych niż domyślne albo `default` w przypadku konta domyślnego.

W konfiguracjach z wieloma kontami najlepiej ustawić `profile` dla każdego konta w konfiguracji, aby jedna zmienna środowiskowa nie spowodowała współdzielenia tej samej sesji logowania przez wiele kont.

## Wskaźnik pisania, reakcje i potwierdzenia dostarczenia

- OpenClaw wysyła zdarzenie pisania przed przekazaniem odpowiedzi do wysłania (w miarę możliwości).
- Akcja reakcji na wiadomość `react` jest obsługiwana dla `zalouser` w akcjach kanału.
  - Użyj `remove: true`, aby usunąć określoną reakcję emoji z wiadomości.
  - Zasady działania reakcji: [Reakcje](/pl/tools/reactions)
- W przypadku wiadomości przychodzących zawierających metadane zdarzenia OpenClaw wysyła potwierdzenia dostarczenia i wyświetlenia (w miarę możliwości).

## Rozwiązywanie problemów

**Logowanie nie jest zachowywane:**

- `openclaw channels status --probe`
- Zaloguj się ponownie: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Nie udało się przekształcić nazwy na liście dozwolonych lub nazwy grupy:**

- Użyj identyfikatorów liczbowych w `allowFrom`/`groupAllowFrom` oraz stabilnych identyfikatorów grup w `groups`. Jeśli celowo musisz używać dokładnych nazw znajomych lub grup, włącz `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Aktualizacja ze starej konfiguracji opartej na zewnętrznym `zca`/CLI:**

- Usuń wszelkie założenia dotyczące zewnętrznego procesu `zca`; kanał działa teraz w całości wewnątrz procesu za pośrednictwem `zca-js`, bez zewnętrznego pliku binarnego CLI.

## Powiązane materiały

- [Przegląd kanałów](/pl/channels) - wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) - uwierzytelnianie wiadomości prywatnych i przebieg parowania
- [Grupy](/pl/channels/groups) - działanie czatów grupowych i wymóg wzmianki
- [Trasowanie kanałów](/pl/channels/channel-routing) - trasowanie sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) - model dostępu i wzmacnianie zabezpieczeń

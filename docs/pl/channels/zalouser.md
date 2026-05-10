---
read_when:
    - Konfigurowanie Zalo Personal dla OpenClaw
    - Debugowanie logowania lub przepływu wiadomości w Zalo Personal
summary: Obsługa osobistego konta Zalo za pomocą natywnego zca-js (logowanie QR), możliwości i konfiguracja
title: Zalo osobiste
x-i18n:
    generated_at: "2026-05-10T19:24:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8b55f980b92a17f6a8de39df0ce49fc5705b5cb2bf4d69589c07d84a854e863a
    source_path: channels/zalouser.md
    workflow: 16
---

Status: eksperymentalny. Ta integracja automatyzuje **osobiste konto Zalo** przez natywne `zca-js` w OpenClaw.

<Warning>
To jest nieoficjalna integracja i może skutkować zawieszeniem lub zablokowaniem konta. Używasz jej na własne ryzyko.
</Warning>

## Dołączony Plugin

Zalo Personal jest dostarczany jako dołączony Plugin w obecnych wydaniach OpenClaw, więc zwykłe
kompilacje pakietowe nie wymagają oddzielnej instalacji.

Jeśli używasz starszej kompilacji albo niestandardowej instalacji, która wyklucza Zalo Personal,
zainstaluj pakiet npm bezpośrednio:

- Instalacja przez CLI: `openclaw plugins install @openclaw/zalouser`
- Przypięta wersja: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Albo z checkoutu źródłowego: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Szczegóły: [Pluginy](/pl/tools/plugin)

Nie jest wymagany zewnętrzny binarny plik CLI `zca`/`openzca`.

## Szybka konfiguracja (dla początkujących)

1. Upewnij się, że Plugin Zalo Personal jest dostępny.
   - Obecne pakietowe wydania OpenClaw już go zawierają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie za pomocą powyższych poleceń.
2. Zaloguj się (QR, na maszynie Gateway):
   - `openclaw channels login --channel zalouser`
   - Zeskanuj kod QR aplikacją mobilną Zalo.
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

4. Uruchom ponownie Gateway (albo dokończ konfigurację).
5. Dostęp do DM domyślnie używa parowania; zatwierdź kod parowania przy pierwszym kontakcie.

## Czym to jest

- Działa całkowicie w procesie przez `zca-js`.
- Używa natywnych listenerów zdarzeń do odbierania wiadomości przychodzących.
- Wysyła odpowiedzi bezpośrednio przez API JS (tekst/media/link).
- Zaprojektowane dla przypadków użycia „osobistego konta”, gdy Zalo Bot API nie jest dostępne.

## Nazewnictwo

Identyfikator kanału to `zalouser`, aby jednoznacznie wskazać, że automatyzuje **osobiste konto użytkownika Zalo** (nieoficjalnie). `zalo` pozostawiamy zarezerwowane dla potencjalnej przyszłej oficjalnej integracji z Zalo API.

## Znajdowanie ID (katalog)

Użyj CLI katalogu, aby odkrywać osoby/grupy i ich ID:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Ograniczenia

- Tekst wychodzący jest dzielony na fragmenty po około 2000 znaków (limity klienta Zalo).
- Streaming jest domyślnie blokowany.

## Kontrola dostępu (DM)

`channels.zalouser.dmPolicy` obsługuje: `pairing | allowlist | open | disabled` (domyślnie: `pairing`).

`channels.zalouser.allowFrom` powinno używać stabilnych ID użytkowników Zalo. Może też odwoływać się do statycznych grup dostępu nadawców (`accessGroup:<name>`). Podczas interaktywnej konfiguracji wprowadzone nazwy mogą zostać rozwiązane do ID przy użyciu wyszukiwania kontaktów w procesie Pluginu.

Jeśli surowa nazwa pozostaje w konfiguracji, przy starcie jest rozwiązywana tylko wtedy, gdy włączono `channels.zalouser.dangerouslyAllowNameMatching: true`. Bez tej zgody sprawdzanie nadawców w runtime działa wyłącznie na ID, a surowe nazwy są ignorowane podczas autoryzacji.

Zatwierdź przez:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Dostęp grupowy (opcjonalnie)

- Domyślnie: `channels.zalouser.groupPolicy = "open"` (grupy dozwolone). Użyj `channels.defaults.groupPolicy`, aby nadpisać wartość domyślną, gdy nie jest ustawiona.
- Ogranicz do listy dozwolonych za pomocą:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (kluczami powinny być stabilne ID grup; nazwy są rozwiązywane do ID przy starcie tylko wtedy, gdy włączono `channels.zalouser.dangerouslyAllowNameMatching: true`)
  - `channels.zalouser.groupAllowFrom` (kontroluje, którzy nadawcy w dozwolonych grupach mogą wywołać bota; do statycznych grup dostępu nadawców można odwoływać się przez `accessGroup:<name>`)
- Zablokuj wszystkie grupy: `channels.zalouser.groupPolicy = "disabled"`.
- Kreator konfiguracji może zapytać o listy dozwolonych grup.
- Przy starcie OpenClaw rozwiązuje nazwy grup/użytkowników na listach dozwolonych do ID i loguje mapowanie tylko wtedy, gdy włączono `channels.zalouser.dangerouslyAllowNameMatching: true`.
- Dopasowywanie listy dozwolonych grup jest domyślnie wyłącznie oparte na ID. Nierozwiązane nazwy są ignorowane na potrzeby uwierzytelniania, chyba że włączono `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` to awaryjny tryb zgodności, który ponownie włącza zmienne rozwiązywanie nazw przy starcie i dopasowywanie nazw grup w runtime.
- Jeśli `groupAllowFrom` nie jest ustawione, runtime wraca do `allowFrom` podczas sprawdzania nadawców grupowych.
- Sprawdzanie nadawców dotyczy zarówno zwykłych wiadomości grupowych, jak i poleceń sterujących (na przykład `/new`, `/reset`).

Przykład:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### Bramkowanie wzmianek w grupie

- `channels.zalouser.groups.<group>.requireMention` kontroluje, czy odpowiedzi grupowe wymagają wzmianki.
- Kolejność rozwiązywania: dokładne ID/nazwa grupy -> znormalizowany slug grupy -> `*` -> domyślnie (`true`).
- Dotyczy to zarówno grup z listy dozwolonych, jak i trybu otwartych grup.
- Zacytowanie wiadomości bota liczy się jako niejawna wzmianka aktywująca grupę.
- Autoryzowane polecenia sterujące (na przykład `/new`) mogą pominąć bramkowanie wzmiankami.
- Gdy wiadomość grupowa zostanie pominięta, ponieważ wymagana jest wzmianka, OpenClaw zapisuje ją jako oczekującą historię grupy i dołącza ją do następnej przetwarzanej wiadomości grupowej.
- Limit historii grupowej domyślnie wynosi `messages.groupChat.historyLimit` (wartość zapasowa `50`). Możesz nadpisać go dla konta za pomocą `channels.zalouser.historyLimit`.

Przykład:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## Wiele kont

Konta mapują się na profile `zalouser` w stanie OpenClaw. Przykład:

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

## Pisanie, reakcje i potwierdzenia dostarczenia

- OpenClaw wysyła zdarzenie pisania przed wysłaniem odpowiedzi (best-effort).
- Akcja reakcji na wiadomość `react` jest obsługiwana dla `zalouser` w akcjach kanału.
  - Użyj `remove: true`, aby usunąć z wiadomości konkretną reakcję emoji.
  - Semantyka reakcji: [Reakcje](/pl/tools/reactions)
- Dla wiadomości przychodzących zawierających metadane zdarzeń OpenClaw wysyła potwierdzenia dostarczenia i odczytania (best-effort).

## Rozwiązywanie problemów

**Logowanie się nie utrzymuje:**

- `openclaw channels status --probe`
- Ponowne logowanie: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Lista dozwolonych/nazwa grupy nie została rozwiązana:**

- Użyj numerycznych ID w `allowFrom`/`groupAllowFrom` i stabilnych ID grup w `groups`. Jeśli celowo potrzebujesz dokładnych nazw znajomych/grup, włącz `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Aktualizacja ze starej konfiguracji opartej na CLI:**

- Usuń wszelkie stare założenia dotyczące zewnętrznego procesu `zca`.
- Kanał działa teraz w pełni w OpenClaw bez zewnętrznych binarnych plików CLI.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie

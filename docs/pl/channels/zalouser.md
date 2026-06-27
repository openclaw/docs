---
read_when:
    - Konfigurowanie Zalo Personal dla OpenClaw
    - Debugowanie logowania Zalo Personal lub przepływu wiadomości
summary: Obsługa osobistego konta Zalo przez natywne zca-js (logowanie QR), możliwości i konfiguracja
title: Zalo osobisty
x-i18n:
    generated_at: "2026-06-27T17:15:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdd331d118bfc0d9aba90ac5e42c2ba52e010eafba1342bd3523c64642057dc6
    source_path: channels/zalouser.md
    workflow: 16
---

Stan: eksperymentalne. Ta integracja automatyzuje **osobiste konto Zalo** przez natywne `zca-js` wewnątrz OpenClaw.

<Warning>
To nieoficjalna integracja i może skutkować zawieszeniem lub zbanowaniem konta. Używasz jej na własne ryzyko.
</Warning>

## Dołączony Plugin

Zalo Personal jest dostarczany jako dołączony Plugin w aktualnych wydaniach OpenClaw, więc zwykłe
pakietowane kompilacje nie wymagają osobnej instalacji.

Jeśli używasz starszej kompilacji albo instalacji niestandardowej, która wyklucza Zalo Personal,
zainstaluj pakiet npm bezpośrednio:

- Instalacja przez CLI: `openclaw plugins install @openclaw/zalouser`
- Przypięta wersja: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Albo z checkoutu źródłowego: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Szczegóły: [Plugins](/pl/tools/plugin)

Nie jest wymagany zewnętrzny plik binarny CLI `zca`/`openzca`.

## Szybka konfiguracja (dla początkujących)

1. Upewnij się, że Plugin Zalo Personal jest dostępny.
   - Aktualne pakietowane wydania OpenClaw już go zawierają.
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

4. Uruchom ponownie Gateway (albo zakończ konfigurację).
5. Dostęp przez DM domyślnie używa parowania; zatwierdź kod parowania przy pierwszym kontakcie.

## Czym to jest

- Działa w całości w procesie przez `zca-js`.
- Używa natywnych nasłuchiwaczy zdarzeń do odbierania wiadomości przychodzących.
- Wysyła odpowiedzi bezpośrednio przez API JS (tekst/media/link).
- Zaprojektowane do przypadków użycia „konta osobistego”, gdy Zalo Bot API nie jest dostępne.

## Nazewnictwo

Identyfikator kanału to `zalouser`, aby jednoznacznie wskazać, że automatyzuje **osobiste konto użytkownika Zalo** (nieoficjalnie). `zalo` rezerwujemy dla potencjalnej przyszłej oficjalnej integracji z API Zalo.

## Znajdowanie identyfikatorów (katalog)

Użyj CLI katalogu, aby odkrywać peerów/grupy i ich identyfikatory:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Limity

- Tekst wychodzący jest dzielony na fragmenty po około 2000 znaków (limity klienta Zalo).
- Strumieniowanie jest domyślnie blokowane.

## Kontrola dostępu (DM)

`channels.zalouser.dmPolicy` obsługuje: `pairing | allowlist | open | disabled` (domyślnie: `pairing`).

`channels.zalouser.allowFrom` powinno używać stabilnych identyfikatorów użytkowników Zalo. Może też odwoływać się do statycznych grup dostępu nadawców (`accessGroup:<name>`). Podczas interaktywnej konfiguracji wprowadzone nazwy mogą być rozwiązywane na identyfikatory z użyciem wyszukiwania kontaktów w procesie Plugina.

Jeśli surowa nazwa pozostanie w konfiguracji, przy starcie zostanie rozwiązana tylko wtedy, gdy włączone jest `channels.zalouser.dangerouslyAllowNameMatching: true`. Bez tej świadomej zgody sprawdzanie nadawców w czasie działania opiera się wyłącznie na identyfikatorach, a surowe nazwy są ignorowane przy autoryzacji.

Zatwierdź przez:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Dostęp grupowy (opcjonalnie)

- Domyślnie: `channels.zalouser.groupPolicy = "open"` (grupy dozwolone). Użyj `channels.defaults.groupPolicy`, aby nadpisać wartość domyślną, gdy nie jest ustawiona.
- Ogranicz do listy dozwolonych za pomocą:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (klucze powinny być stabilnymi identyfikatorami grup; nazwy są rozwiązywane na identyfikatory przy starcie tylko wtedy, gdy włączone jest `channels.zalouser.dangerouslyAllowNameMatching: true`)
  - `channels.zalouser.groupAllowFrom` (kontroluje, którzy nadawcy w dozwolonych grupach mogą uruchamiać bota; do statycznych grup dostępu nadawców można odwoływać się przez `accessGroup:<name>`)
- Zablokuj wszystkie grupy: `channels.zalouser.groupPolicy = "disabled"`.
- Kreator konfiguracji może zapytać o listy dozwolonych grup.
- Przy starcie OpenClaw rozwiązuje nazwy grup/użytkowników na listach dozwolonych na identyfikatory i loguje mapowanie tylko wtedy, gdy włączone jest `channels.zalouser.dangerouslyAllowNameMatching: true`.
- Dopasowywanie listy dozwolonych grup domyślnie opiera się wyłącznie na identyfikatorach. Nierozwiązane nazwy są ignorowane przy autoryzacji, chyba że włączone jest `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` to awaryjny tryb zgodności, który ponownie włącza zmienne rozwiązywanie nazw przy starcie i dopasowywanie nazw grup w czasie działania.
- Jeśli `groupAllowFrom` nie jest ustawione, w czasie działania sprawdzanie nadawców w grupach używa zastępczo `allowFrom`.
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

- `channels.zalouser.groups.<group>.requireMention` kontroluje, czy odpowiedzi w grupie wymagają wzmianki.
- Kolejność rozwiązywania: dokładny identyfikator/nazwa grupy -> znormalizowany slug grupy -> `*` -> wartość domyślna (`true`).
- Dotyczy to zarówno grup z listy dozwolonych, jak i trybu otwartych grup.
- Cytowanie wiadomości bota liczy się jako niejawna wzmianka do aktywacji w grupie.
- Autoryzowane polecenia sterujące (na przykład `/new`) mogą omijać bramkowanie wzmianek.
- Gdy wiadomość grupowa zostanie pominięta, ponieważ wymagana jest wzmianka, OpenClaw zapisuje ją jako oczekującą historię grupy i dołącza przy następnej przetwarzanej wiadomości grupowej.
- Limit historii grup domyślnie wynosi `messages.groupChat.historyLimit` (wartość zastępcza `50`). Możesz nadpisać go dla konta za pomocą `channels.zalouser.historyLimit`.

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

## Zmienne środowiskowe

Plugin Zalo Personal może też odczytywać wybór profilu ze zmiennych środowiskowych:

- `ZALOUSER_PROFILE`: nazwa profilu używana, gdy w konfiguracji kanału lub konta nie ustawiono `profile`.
- `ZCA_PROFILE`: starsza zastępcza nazwa profilu, używana tylko wtedy, gdy `ZALOUSER_PROFILE` nie jest ustawione.

Nazwy profili wybierają zapisane dane logowania Zalo w stanie OpenClaw. Kolejność rozwiązywania:

1. Jawne `profile` w konfiguracji.
2. `ZALOUSER_PROFILE`.
3. `ZCA_PROFILE`.
4. Identyfikator konta dla kont innych niż domyślne albo `default` dla konta domyślnego.

W konfiguracjach z wieloma kontami preferuj ustawienie `profile` dla każdego konta w konfiguracji, aby
jedna zmienna środowiskowa nie powodowała współdzielenia tej samej sesji logowania
przez wiele kont.

## Pisanie, reakcje i potwierdzenia dostarczenia

- OpenClaw wysyła zdarzenie pisania przed wysłaniem odpowiedzi (best-effort).
- Akcja reakcji na wiadomość `react` jest obsługiwana dla `zalouser` w akcjach kanału.
  - Użyj `remove: true`, aby usunąć określone emoji reakcji z wiadomości.
  - Semantyka reakcji: [Reakcje](/pl/tools/reactions)
- Dla wiadomości przychodzących, które zawierają metadane zdarzenia, OpenClaw wysyła potwierdzenia dostarczenia i wyświetlenia (best-effort).

## Rozwiązywanie problemów

**Logowanie nie zostaje zapamiętane:**

- `openclaw channels status --probe`
- Ponowne logowanie: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Nazwa na liście dozwolonych/grupy nie została rozwiązana:**

- Użyj numerycznych identyfikatorów w `allowFrom`/`groupAllowFrom` oraz stabilnych identyfikatorów grup w `groups`. Jeśli celowo potrzebujesz dokładnych nazw znajomych/grup, włącz `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Aktualizacja ze starej konfiguracji opartej na CLI:**

- Usuń wszelkie stare założenia dotyczące zewnętrznego procesu `zca`.
- Kanał działa teraz w pełni w OpenClaw bez zewnętrznych plików binarnych CLI.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie

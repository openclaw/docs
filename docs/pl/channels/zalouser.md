---
read_when:
    - Konfigurowanie Zalo Personal dla OpenClaw
    - Debugowanie logowania lub przepływu wiadomości w Zalo Personal
summary: Obsługa osobistych kont Zalo za pośrednictwem natywnego zca-js (logowanie kodem QR), możliwości i konfiguracja
title: Zalo osobiste
x-i18n:
    generated_at: "2026-05-06T17:52:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: d56cbf0a6300709e9fe23421cd134acc68852d0025f305c73413308f412349e8
    source_path: channels/zalouser.md
    workflow: 16
---

Stan: eksperymentalne. Ta integracja automatyzuje **osobiste konto Zalo** przez natywne `zca-js` w OpenClaw.

<Warning>
To jest nieoficjalna integracja i może skutkować zawieszeniem lub zablokowaniem konta. Używasz jej na własne ryzyko.
</Warning>

## Dołączony plugin

Zalo Personal jest dostarczany jako dołączony plugin w bieżących wydaniach OpenClaw, więc normalne
spakowane kompilacje nie wymagają osobnej instalacji.

Jeśli używasz starszej kompilacji lub instalacji niestandardowej, która wyklucza Zalo Personal,
zainstaluj pakiet npm bezpośrednio:

- Instalacja przez CLI: `openclaw plugins install @openclaw/zalouser`
- Przypięta wersja: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Albo z checkoutu źródeł: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Szczegóły: [Pluginy](/pl/tools/plugin)

Nie jest wymagany zewnętrzny plik binarny CLI `zca`/`openzca`.

## Szybka konfiguracja (dla początkujących)

1. Upewnij się, że plugin Zalo Personal jest dostępny.
   - Bieżące spakowane wydania OpenClaw już go zawierają.
   - Starsze/niestandardowe instalacje mogą dodać go ręcznie przy użyciu powyższych poleceń.
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
5. Dostęp DM domyślnie używa parowania; zatwierdź kod parowania przy pierwszym kontakcie.

## Czym to jest

- Działa w całości w procesie przez `zca-js`.
- Używa natywnych odbiorników zdarzeń do odbierania wiadomości przychodzących.
- Wysyła odpowiedzi bezpośrednio przez API JS (tekst/media/link).
- Zaprojektowane dla przypadków użycia „konta osobistego”, gdy Zalo Bot API nie jest dostępne.

## Nazewnictwo

Identyfikator kanału to `zalouser`, aby jednoznacznie wskazać, że automatyzuje **osobiste konto użytkownika Zalo** (nieoficjalnie). `zalo` pozostawiamy zarezerwowane dla potencjalnej przyszłej oficjalnej integracji z API Zalo.

## Znajdowanie identyfikatorów (katalog)

Użyj CLI katalogu, aby odkrywać peerów/grupy i ich identyfikatory:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Limity

- Tekst wychodzący jest dzielony na fragmenty po około 2000 znaków (limity klienta Zalo).
- Streaming jest domyślnie blokowany.

## Kontrola dostępu (DM)

`channels.zalouser.dmPolicy` obsługuje: `pairing | allowlist | open | disabled` (domyślnie: `pairing`).

`channels.zalouser.allowFrom` powinno używać stabilnych identyfikatorów użytkowników Zalo. Podczas konfiguracji interaktywnej wprowadzone nazwy mogą zostać rozwiązane do identyfikatorów przy użyciu wyszukiwania kontaktów w procesie pluginu.

Jeśli surowa nazwa pozostaje w konfiguracji, podczas uruchamiania jest rozwiązywana tylko wtedy, gdy włączone jest `channels.zalouser.dangerouslyAllowNameMatching: true`. Bez tej zgody sprawdzanie nadawców w czasie działania używa wyłącznie identyfikatorów, a surowe nazwy są ignorowane przy autoryzacji.

Zatwierdzanie:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Dostęp grupowy (opcjonalnie)

- Domyślnie: `channels.zalouser.groupPolicy = "open"` (grupy dozwolone). Użyj `channels.defaults.groupPolicy`, aby nadpisać wartość domyślną, gdy nie jest ustawiona.
- Ogranicz do listy dozwolonych przy użyciu:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (kluczami powinny być stabilne identyfikatory grup; nazwy są rozwiązywane do identyfikatorów podczas uruchamiania tylko wtedy, gdy włączone jest `channels.zalouser.dangerouslyAllowNameMatching: true`)
  - `channels.zalouser.groupAllowFrom` (kontroluje, którzy nadawcy w dozwolonych grupach mogą uruchomić bota)
- Zablokuj wszystkie grupy: `channels.zalouser.groupPolicy = "disabled"`.
- Kreator konfiguracji może zapytać o listy dozwolonych grup.
- Podczas uruchamiania OpenClaw rozwiązuje nazwy grup/użytkowników na listach dozwolonych do identyfikatorów i loguje mapowanie tylko wtedy, gdy włączone jest `channels.zalouser.dangerouslyAllowNameMatching: true`.
- Dopasowanie listy dozwolonych grup domyślnie używa wyłącznie identyfikatorów. Nierozwiązane nazwy są ignorowane przy uwierzytelnianiu, chyba że włączone jest `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` to awaryjny tryb zgodności, który ponownie włącza zmienne rozwiązywanie nazw podczas uruchamiania i dopasowanie nazw grup w czasie działania.
- Jeśli `groupAllowFrom` nie jest ustawione, środowisko uruchomieniowe wraca do `allowFrom` przy sprawdzaniu nadawców grupowych.
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

### Bramka wzmianek w grupie

- `channels.zalouser.groups.<group>.requireMention` kontroluje, czy odpowiedzi grupowe wymagają wzmianki.
- Kolejność rozwiązywania: dokładny identyfikator/nazwa grupy -> znormalizowany slug grupy -> `*` -> wartość domyślna (`true`).
- Dotyczy to zarówno grup z listy dozwolonych, jak i trybu grup otwartych.
- Cytowanie wiadomości bota liczy się jako niejawna wzmianka aktywująca grupę.
- Autoryzowane polecenia sterujące (na przykład `/new`) mogą ominąć bramkę wzmianek.
- Gdy wiadomość grupowa zostaje pominięta, ponieważ wymagana jest wzmianka, OpenClaw przechowuje ją jako oczekującą historię grupy i dołącza ją do następnej przetwarzanej wiadomości grupowej.
- Limit historii grupy domyślnie używa `messages.groupChat.historyLimit` (wartość zapasowa `50`). Możesz nadpisać go dla konta przy użyciu `channels.zalouser.historyLimit`.

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

## Pisanie, reakcje i potwierdzenia dostarczenia

- OpenClaw wysyła zdarzenie pisania przed wysłaniem odpowiedzi (best-effort).
- Akcja reakcji na wiadomość `react` jest obsługiwana dla `zalouser` w akcjach kanału.
  - Użyj `remove: true`, aby usunąć konkretną reakcję emoji z wiadomości.
  - Semantyka reakcji: [Reakcje](/pl/tools/reactions)
- Dla wiadomości przychodzących zawierających metadane zdarzenia OpenClaw wysyła potwierdzenia dostarczenia i zobaczenia (best-effort).

## Rozwiązywanie problemów

**Logowanie się nie utrzymuje:**

- `openclaw channels status --probe`
- Zaloguj się ponownie: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Nazwa z listy dozwolonych/grupy nie została rozwiązana:**

- Użyj numerycznych identyfikatorów w `allowFrom`/`groupAllowFrom` i stabilnych identyfikatorów grup w `groups`. Jeśli celowo potrzebujesz dokładnych nazw znajomych/grup, włącz `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Aktualizacja ze starej konfiguracji opartej na CLI:**

- Usuń wszelkie stare założenia dotyczące zewnętrznego procesu `zca`.
- Kanał działa teraz w pełni w OpenClaw bez zewnętrznych plików binarnych CLI.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramka wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie

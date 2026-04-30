---
read_when:
    - Konfigurowanie Zalo Personal dla OpenClaw
    - Debugowanie logowania lub przepływu wiadomości w Zalo Personal
summary: Obsługa konta osobistego Zalo za pomocą natywnego zca-js (logowanie kodem QR), możliwości i konfiguracja
title: Zalo osobiste
x-i18n:
    generated_at: "2026-04-30T09:40:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 581a427f7fa37b0fa204f6b813c767eaa7af1f577baf2ac6ea3a31bf23ca6a49
    source_path: channels/zalouser.md
    workflow: 16
---

Status: eksperymentalne. Ta integracja automatyzuje **osobiste konto Zalo** za pomocą natywnego `zca-js` w OpenClaw.

<Warning>
To nieoficjalna integracja, która może skutkować zawieszeniem lub zablokowaniem konta. Używasz jej na własne ryzyko.
</Warning>

## Plugin dołączony w pakiecie

Zalo Personal jest dostarczany jako Plugin dołączony w pakiecie w bieżących wydaniach OpenClaw, więc zwykłe
pakietowane kompilacje nie wymagają osobnej instalacji.

Jeśli używasz starszej kompilacji lub niestandardowej instalacji, która wyklucza Zalo Personal,
zainstaluj bieżący pakiet npm, gdy zostanie opublikowany:

- Instalacja przez CLI: `openclaw plugins install @openclaw/zalouser`
- Albo z checkoutu źródłowego: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Szczegóły: [Pluginy](/pl/tools/plugin)

Jeśli npm zgłasza pakiet należący do OpenClaw jako przestarzały, użyj bieżącej pakietowanej
kompilacji OpenClaw albo ścieżki lokalnego checkoutu, dopóki nowszy pakiet npm nie zostanie
opublikowany.

Zewnętrzny binarny plik CLI `zca`/`openzca` nie jest wymagany.

## Szybka konfiguracja (początkujący)

1. Upewnij się, że Plugin Zalo Personal jest dostępny.
   - Bieżące pakietowane wydania OpenClaw już go zawierają.
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
5. Dostęp DM domyślnie używa parowania; zatwierdź kod parowania przy pierwszym kontakcie.

## Czym to jest

- Działa w całości w procesie przez `zca-js`.
- Używa natywnych nasłuchiwaczy zdarzeń do odbierania wiadomości przychodzących.
- Wysyła odpowiedzi bezpośrednio przez API JS (tekst/media/link).
- Zaprojektowane do przypadków użycia „konta osobistego”, w których Zalo Bot API nie jest dostępne.

## Nazewnictwo

Identyfikator kanału to `zalouser`, aby jasno wskazać, że automatyzuje on **osobiste konto użytkownika Zalo** (nieoficjalnie). Zachowujemy `zalo` dla potencjalnej przyszłej oficjalnej integracji z API Zalo.

## Znajdowanie identyfikatorów (katalog)

Użyj CLI katalogu, aby wykryć peerów/grupy i ich identyfikatory:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Limity

- Tekst wychodzący jest dzielony na fragmenty o długości około 2000 znaków (limity klienta Zalo).
- Streaming jest domyślnie blokowany.

## Kontrola dostępu (DM)

`channels.zalouser.dmPolicy` obsługuje: `pairing | allowlist | open | disabled` (domyślnie: `pairing`).

`channels.zalouser.allowFrom` przyjmuje identyfikatory użytkowników lub nazwy. Podczas konfiguracji nazwy są rozwiązywane do identyfikatorów za pomocą działającego w procesie wyszukiwania kontaktów Pluginu.

Zatwierdź przez:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Dostęp grupowy (opcjonalny)

- Domyślnie: `channels.zalouser.groupPolicy = "open"` (grupy dozwolone). Użyj `channels.defaults.groupPolicy`, aby nadpisać domyślną wartość, gdy nie jest ustawiona.
- Ogranicz do allowlist za pomocą:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (klucze powinny być stabilnymi identyfikatorami grup; nazwy są rozwiązywane do identyfikatorów przy starcie, gdy to możliwe)
  - `channels.zalouser.groupAllowFrom` (kontroluje, którzy nadawcy w dozwolonych grupach mogą uruchamiać bota)
- Zablokuj wszystkie grupy: `channels.zalouser.groupPolicy = "disabled"`.
- Kreator konfiguracji może zapytać o allowlist grup.
- Przy starcie OpenClaw rozwiązuje nazwy grup/użytkowników z allowlist do identyfikatorów i zapisuje mapowanie w logach.
- Dopasowywanie allowlist grup domyślnie odbywa się tylko po identyfikatorze. Nierozwiązane nazwy są ignorowane na potrzeby autoryzacji, chyba że włączono `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` to awaryjny tryb zgodności, który ponownie włącza zmienne dopasowywanie nazw grup.
- Jeśli `groupAllowFrom` nie jest ustawione, środowisko uruchomieniowe wraca do `allowFrom` przy sprawdzaniu nadawców grupowych.
- Sprawdzenia nadawcy dotyczą zarówno zwykłych wiadomości grupowych, jak i poleceń sterujących (na przykład `/new`, `/reset`).

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

### Bramkowanie wzmianek w grupach

- `channels.zalouser.groups.<group>.requireMention` kontroluje, czy odpowiedzi grupowe wymagają wzmianki.
- Kolejność rozwiązywania: dokładny identyfikator/nazwa grupy -> znormalizowany slug grupy -> `*` -> domyślnie (`true`).
- Dotyczy to zarówno grup z allowlist, jak i trybu otwartych grup.
- Cytowanie wiadomości bota liczy się jako niejawna wzmianka aktywująca grupę.
- Autoryzowane polecenia sterujące (na przykład `/new`) mogą omijać bramkowanie wzmianek.
- Gdy wiadomość grupowa zostanie pominięta, ponieważ wymagana jest wzmianka, OpenClaw zapisuje ją jako oczekującą historię grupy i dołącza ją do następnej przetwarzanej wiadomości grupowej.
- Limit historii grupowej domyślnie używa `messages.groupChat.historyLimit` (wartość zapasowa `50`). Możesz nadpisać go dla każdego konta za pomocą `channels.zalouser.historyLimit`.

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

## Wpisywanie, reakcje i potwierdzenia dostarczenia

- OpenClaw wysyła zdarzenie wpisywania przed wysłaniem odpowiedzi (best-effort).
- Akcja reakcji na wiadomość `react` jest obsługiwana dla `zalouser` w akcjach kanału.
  - Użyj `remove: true`, aby usunąć konkretną reakcję emoji z wiadomości.
  - Semantyka reakcji: [Reakcje](/pl/tools/reactions)
- Dla wiadomości przychodzących zawierających metadane zdarzenia OpenClaw wysyła potwierdzenia dostarczenia i wyświetlenia (best-effort).

## Rozwiązywanie problemów

**Logowanie nie zostaje zapamiętane:**

- `openclaw channels status --probe`
- Zaloguj się ponownie: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Allowlist/nazwa grupy nie została rozwiązana:**

- Użyj numerycznych identyfikatorów w `allowFrom`/`groupAllowFrom`/`groups` albo dokładnych nazw znajomych/grup.

**Uaktualniono ze starej konfiguracji opartej na CLI:**

- Usuń wszelkie stare założenia dotyczące zewnętrznego procesu `zca`.
- Kanał działa teraz w pełni w OpenClaw bez zewnętrznych binarnych plików CLI.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i bramkowanie wzmianek
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie

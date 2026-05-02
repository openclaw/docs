---
read_when:
    - Konfigurowanie Zalo Personal dla OpenClaw
    - Debugowanie logowania lub przepływu wiadomości w Zalo Personal
summary: Obsługa osobistego konta Zalo za pomocą natywnego zca-js (logowanie QR), możliwości i konfiguracja
title: Zalo osobiste
x-i18n:
    generated_at: "2026-05-02T22:17:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0096775e0017e504130f2e19e05ab8114eadb873a9e11f79ea8f0dd91297567f
    source_path: channels/zalouser.md
    workflow: 16
---

Status: eksperymentalne. Ta integracja automatyzuje **osobiste konto Zalo** za pomocą natywnego `zca-js` w OpenClaw.

<Warning>
To nieoficjalna integracja i może skutkować zawieszeniem lub zablokowaniem konta. Używasz jej na własne ryzyko.
</Warning>

## Dołączony Plugin

Zalo Personal jest dostarczany jako dołączony Plugin w bieżących wydaniach OpenClaw, więc normalne
pakietowe kompilacje nie wymagają osobnej instalacji.

Jeśli używasz starszej kompilacji lub niestandardowej instalacji, która wyklucza Zalo Personal,
zainstaluj pakiet npm bezpośrednio:

- Instalacja przez CLI: `openclaw plugins install @openclaw/zalouser`
- Przypięta wersja: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Albo z checkoutu źródeł: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Szczegóły: [Pluginy](/pl/tools/plugin)

Nie jest wymagany zewnętrzny binarny plik CLI `zca`/`openzca`.

## Szybka konfiguracja (dla początkujących)

1. Upewnij się, że Plugin Zalo Personal jest dostępny.
   - Bieżące pakietowe wydania OpenClaw już go zawierają.
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

4. Uruchom ponownie Gateway (lub zakończ konfigurację).
5. Dostęp przez DM domyślnie używa parowania; zatwierdź kod parowania przy pierwszym kontakcie.

## Czym to jest

- Działa w całości w procesie za pomocą `zca-js`.
- Używa natywnych nasłuchiwaczy zdarzeń do odbierania wiadomości przychodzących.
- Wysyła odpowiedzi bezpośrednio przez JS API (tekst/media/link).
- Zaprojektowane dla przypadków użycia „konta osobistego”, w których Zalo Bot API nie jest dostępne.

## Nazewnictwo

Identyfikator kanału to `zalouser`, aby było jasne, że automatyzuje **osobiste konto użytkownika Zalo** (nieoficjalnie). `zalo` pozostawiamy zarezerwowane dla potencjalnej przyszłej oficjalnej integracji z Zalo API.

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

`channels.zalouser.allowFrom` akceptuje identyfikatory użytkowników lub nazwy. Podczas konfiguracji nazwy są rozwiązywane na identyfikatory za pomocą wewnątrzprocesowego wyszukiwania kontaktów Pluginu.

Zatwierdź za pomocą:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Dostęp grupowy (opcjonalnie)

- Domyślnie: `channels.zalouser.groupPolicy = "open"` (grupy dozwolone). Użyj `channels.defaults.groupPolicy`, aby zastąpić domyślne ustawienie, gdy nie jest ustawione.
- Ogranicz do allowlist za pomocą:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (klucze powinny być stabilnymi identyfikatorami grup; nazwy są rozwiązywane na identyfikatory przy uruchomieniu, gdy to możliwe)
  - `channels.zalouser.groupAllowFrom` (kontroluje, którzy nadawcy w dozwolonych grupach mogą wyzwalać bota)
- Zablokuj wszystkie grupy: `channels.zalouser.groupPolicy = "disabled"`.
- Kreator konfiguracji może pytać o allowlist grup.
- Przy uruchomieniu OpenClaw rozwiązuje nazwy grup/użytkowników na allowlist na identyfikatory i zapisuje mapowanie w logach.
- Dopasowanie allowlist grup domyślnie odbywa się tylko według identyfikatora. Nierozwiązane nazwy są ignorowane na potrzeby autoryzacji, chyba że włączono `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` to awaryjny tryb zgodności, który ponownie włącza dopasowanie według zmiennych nazw grup.
- Jeśli `groupAllowFrom` nie jest ustawione, środowisko uruchomieniowe wraca do `allowFrom` przy sprawdzaniu nadawców grupowych.
- Sprawdzanie nadawcy ma zastosowanie zarówno do zwykłych wiadomości grupowych, jak i poleceń sterujących (na przykład `/new`, `/reset`).

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
- Kolejność rozwiązywania: dokładny identyfikator/nazwa grupy -> znormalizowany slug grupy -> `*` -> domyślnie (`true`).
- Dotyczy to zarówno grup z allowlist, jak i trybu otwartej grupy.
- Cytowanie wiadomości bota liczy się jako niejawna wzmianka aktywująca grupę.
- Autoryzowane polecenia sterujące (na przykład `/new`) mogą omijać bramkowanie wzmianek.
- Gdy wiadomość grupowa zostanie pominięta, ponieważ wymagana jest wzmianka, OpenClaw zapisuje ją jako oczekującą historię grupy i dołącza ją do następnej przetwarzanej wiadomości grupowej.
- Limit historii grupy domyślnie wynosi `messages.groupChat.historyLimit` (fallback `50`). Możesz nadpisać go dla konta za pomocą `channels.zalouser.historyLimit`.

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

- OpenClaw wysyła zdarzenie pisania przed wysłaniem odpowiedzi (w miarę możliwości).
- Akcja reakcji na wiadomość `react` jest obsługiwana dla `zalouser` w akcjach kanału.
  - Użyj `remove: true`, aby usunąć konkretną reakcję emoji z wiadomości.
  - Semantyka reakcji: [Reakcje](/pl/tools/reactions)
- Dla wiadomości przychodzących, które zawierają metadane zdarzenia, OpenClaw wysyła potwierdzenia dostarczenia i przeczytania (w miarę możliwości).

## Rozwiązywanie problemów

**Logowanie się nie utrzymuje:**

- `openclaw channels status --probe`
- Zaloguj się ponownie: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Nazwa allowlist/grupy nie została rozwiązana:**

- Użyj numerycznych identyfikatorów w `allowFrom`/`groupAllowFrom`/`groups` albo dokładnych nazw znajomych/grup.

**Uaktualniono ze starej konfiguracji opartej na CLI:**

- Usuń wszelkie stare założenia dotyczące zewnętrznego procesu `zca`.
- Kanał działa teraz w pełni w OpenClaw bez zewnętrznych binarnych plików CLI.

## Powiązane

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie DM i przepływ parowania
- [Grupy](/pl/channels/groups) — zachowanie czatów grupowych i bramkowanie wzmianek
- [Trasowanie kanałów](/pl/channels/channel-routing) — trasowanie sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i utwardzanie

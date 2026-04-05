---
read_when:
    - Chcesz trwałej pamięci, która działa między sesjami i kanałami
    - Chcesz funkcji przywoływania wspomaganych przez AI i modelowania użytkownika
summary: Natywna dla AI pamięć między sesjami za pomocą pluginu Honcho
title: Pamięć Honcho
x-i18n:
    generated_at: "2026-04-05T13:50:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83ae3561152519a23589f754e0625f1e49c43e38f85de07686b963170a6cf229
    source_path: concepts/memory-honcho.md
    workflow: 15
---

# Pamięć Honcho

[Honcho](https://honcho.dev) dodaje do OpenClaw pamięć natywną dla AI. Utrwala
rozmowy w dedykowanej usłudze i z czasem buduje modele użytkownika oraz agenta,
zapewniając agentowi kontekst między sesjami, który wykracza poza pliki Markdown
obszaru roboczego.

## Co zapewnia

- **Pamięć między sesjami** -- rozmowy są utrwalane po każdej turze, dzięki czemu
  kontekst jest przenoszony między resetami sesji, kompaktowaniem i przełączaniem kanałów.
- **Modelowanie użytkownika** -- Honcho utrzymuje profil dla każdego użytkownika (preferencje,
  fakty, styl komunikacji) oraz dla agenta (osobowość, wyuczone
  zachowania).
- **Wyszukiwanie semantyczne** -- wyszukiwanie obserwacji z wcześniejszych rozmów, a nie
  tylko bieżącej sesji.
- **Świadomość wielu agentów** -- agenci nadrzędni automatycznie śledzą uruchomione
  podagenty, a agenci nadrzędni są dodawani jako obserwatorzy w sesjach potomnych.

## Dostępne narzędzia

Honcho rejestruje narzędzia, których agent może używać podczas rozmowy:

**Pobieranie danych (szybkie, bez wywołania LLM):**

| Narzędzie                  | Co robi                                                 |
| -------------------------- | ------------------------------------------------------- |
| `honcho_context`           | Pełna reprezentacja użytkownika między sesjami          |
| `honcho_search_conclusions` | Wyszukiwanie semantyczne zapisanych wniosków           |
| `honcho_search_messages`   | Wyszukiwanie wiadomości między sesjami (filtrowanie według nadawcy, daty) |
| `honcho_session`           | Historia i podsumowanie bieżącej sesji                  |

**Pytania i odpowiedzi (zasilane przez LLM):**

| Narzędzie    | Co robi                                                                     |
| ------------ | ---------------------------------------------------------------------------- |
| `honcho_ask` | Zadawanie pytań o użytkownika. `depth='quick'` dla faktów, `'thorough'` dla syntezy |

## Pierwsze kroki

Zainstaluj plugin i uruchom konfigurację:

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

Polecenie konfiguracji prosi o dane uwierzytelniające API, zapisuje konfigurację i
opcjonalnie migruje istniejące pliki pamięci obszaru roboczego.

<Info>
Honcho może działać całkowicie lokalnie (self-hosted) lub przez zarządzane API pod adresem
`api.honcho.dev`. Opcja self-hosted nie wymaga żadnych zewnętrznych zależności.
</Info>

## Konfiguracja

Ustawienia znajdują się w `plugins.entries["openclaw-honcho"].config`:

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // pomiń dla self-hosted
          workspaceId: "openclaw", // izolacja pamięci
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

W przypadku instancji self-hosted ustaw `baseUrl` na lokalny serwer (na przykład
`http://localhost:8000`) i pomiń klucz API.

## Migracja istniejącej pamięci

Jeśli masz istniejące pliki pamięci obszaru roboczego (`USER.md`, `MEMORY.md`,
`IDENTITY.md`, `memory/`, `canvas/`), `openclaw honcho setup` wykryje je i
zaproponuje migrację.

<Info>
Migracja jest nieniszcząca -- pliki są przesyłane do Honcho. Oryginały
nigdy nie są usuwane ani przenoszone.
</Info>

## Jak to działa

Po każdej turze AI rozmowa jest utrwalana w Honcho. Obserwowane są zarówno wiadomości użytkownika, jak i
agenta, co pozwala Honcho z czasem budować i udoskonalać swoje modele.

Podczas rozmowy narzędzia Honcho odpytują usługę w fazie `before_prompt_build`,
wstrzykując odpowiedni kontekst, zanim model zobaczy prompt. Zapewnia to
dokładne granice tur i trafne przywoływanie informacji.

## Honcho a wbudowana pamięć

|                   | Wbudowana / QMD               | Honcho                              |
| ----------------- | ----------------------------- | ----------------------------------- |
| **Przechowywanie** | Pliki Markdown obszaru roboczego | Dedykowana usługa (lokalna lub hostowana) |
| **Między sesjami** | Przez pliki pamięci          | Automatyczne, wbudowane             |
| **Modelowanie użytkownika** | Ręczne (zapis do `MEMORY.md`) | Automatyczne profile         |
| **Wyszukiwanie**  | Wektorowe + słowa kluczowe (hybrydowe) | Semantyczne po obserwacjach |
| **Wiele agentów** | Nieśledzone                  | Świadomość relacji nadrzędny/potomny |
| **Zależności**    | Brak (wbudowane) lub binarka QMD | Instalacja pluginu               |

Honcho i wbudowany system pamięci mogą działać razem. Gdy skonfigurowano QMD,
dostępne stają się dodatkowe narzędzia do przeszukiwania lokalnych plików Markdown
obok pamięci między sesjami Honcho.

## Polecenia CLI

```bash
openclaw honcho setup                        # Skonfiguruj klucz API i zmigruj pliki
openclaw honcho status                       # Sprawdź stan połączenia
openclaw honcho ask <question>               # Zapytaj Honcho o użytkownika
openclaw honcho search <query> [-k N] [-d D] # Wyszukiwanie semantyczne w pamięci
```

## Dalsza lektura

- [Kod źródłowy pluginu](https://github.com/plastic-labs/openclaw-honcho)
- [Dokumentacja Honcho](https://docs.honcho.dev)
- [Przewodnik integracji Honcho z OpenClaw](https://docs.honcho.dev/v3/guides/integrations/openclaw)
- [Pamięć](/concepts/memory) -- omówienie pamięci w OpenClaw
- [Silniki kontekstu](/concepts/context-engine) -- jak działają pluginowe silniki kontekstu

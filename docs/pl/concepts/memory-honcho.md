---
read_when:
    - Potrzebujesz trwałej pamięci działającej między sesjami i kanałami
    - Potrzebujesz wspomaganego przez AI przywoływania informacji i modelowania użytkownika
summary: Natywna dla AI pamięć między sesjami za pośrednictwem pluginu Honcho
title: Pamięć Honcho
x-i18n:
    generated_at: "2026-07-12T14:58:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fadcf6d8e2505ab4fe6a81340695b7c8fee49c3cb4889665af13389941619117
    source_path: concepts/memory-honcho.md
    workflow: 16
---

[Honcho](https://honcho.dev) dodaje do OpenClaw pamięć zaprojektowaną z myślą o AI za pośrednictwem
zewnętrznego pluginu. Utrwala rozmowy w dedykowanej usłudze i z czasem tworzy
modele użytkownika oraz agenta, zapewniając agentowi kontekst między sesjami,
który wykracza poza pliki Markdown w obszarze roboczym.

## Co zapewnia

- **Pamięć między sesjami** — rozmowy są utrwalane po każdej turze, dzięki czemu
  kontekst jest zachowywany po resetach sesji, procesie Compaction i zmianach kanałów.
- **Modelowanie użytkownika** — Honcho utrzymuje profil każdego użytkownika
  (preferencje, fakty, styl komunikacji) oraz agenta (osobowość, wyuczone
  zachowania).
- **Wyszukiwanie semantyczne** — przeszukiwanie obserwacji z wcześniejszych rozmów,
  a nie tylko bieżącej sesji.
- **Świadomość wielu agentów** — agenci nadrzędni automatycznie śledzą utworzonych
  podagentów, a także są dodawani jako obserwatorzy w sesjach podrzędnych.

## Dostępne narzędzia

Honcho rejestruje narzędzia, których agent może używać podczas rozmowy:

**Pobieranie danych (szybkie, bez wywołania LLM):**

| Narzędzie                   | Działanie                                                         |
| --------------------------- | ----------------------------------------------------------------- |
| `honcho_context`            | Pełna reprezentacja użytkownika obejmująca wszystkie sesje        |
| `honcho_search_conclusions` | Semantyczne przeszukiwanie zapisanych wniosków                     |
| `honcho_search_messages`    | Wyszukiwanie wiadomości w sesjach (według nadawcy i daty)         |
| `honcho_session`            | Historia i podsumowanie bieżącej sesji                             |

**Pytania i odpowiedzi (obsługiwane przez LLM):**

| Narzędzie    | Działanie                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------- |
| `honcho_ask` | Zadawanie pytań o użytkownika. `depth='quick'` dla faktów, `'thorough'` dla syntezy informacji |

## Pierwsze kroki

Zainstaluj plugin i uruchom konfigurację:

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

Polecenie konfiguracji prosi o dane uwierzytelniające API, zapisuje konfigurację
i opcjonalnie migruje istniejące pliki pamięci z obszaru roboczego.

<Info>
Honcho może działać całkowicie lokalnie (na własnym serwerze) lub za pośrednictwem
zarządzanego API pod adresem `api.honcho.dev`. Wariant uruchamiany na własnym
serwerze nie wymaga żadnych zewnętrznych zależności.
</Info>

## Konfiguracja

Ustawienia znajdują się w `plugins.entries["openclaw-honcho"].config`:

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // omit for self-hosted
          workspaceId: "openclaw", // memory isolation
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

W przypadku instancji uruchamianych na własnym serwerze ustaw `baseUrl` na adres
lokalnego serwera (na przykład `http://localhost:8000`) i pomiń klucz API.

## Migrowanie istniejącej pamięci

Jeśli masz istniejące pliki pamięci obszaru roboczego (`USER.md`, `MEMORY.md`,
`IDENTITY.md`, `memory/`, `canvas/`), polecenie `openclaw honcho setup` wykryje je
i zaproponuje ich migrację.

<Info>
Migracja jest niedestrukcyjna — pliki są przesyłane do Honcho. Oryginały nigdy
nie są usuwane ani przenoszone.
</Info>

## Jak to działa

Po każdej turze AI rozmowa jest utrwalana w Honcho. Obserwowane są zarówno
wiadomości użytkownika, jak i agenta, co pozwala Honcho z czasem tworzyć
i udoskonalać swoje modele.

Podczas rozmowy narzędzia Honcho wysyłają zapytania do usługi za pośrednictwem
haka pluginu `before_prompt_build` w OpenClaw, wstrzykując odpowiedni kontekst,
zanim model otrzyma prompt.

## Honcho a wbudowana pamięć

|                    | Wbudowana / QMD                 | Honcho                                      |
| ------------------ | ------------------------------- | ------------------------------------------- |
| **Przechowywanie** | Pliki Markdown obszaru roboczego | Dedykowana usługa (lokalna lub hostowana)   |
| **Między sesjami** | Za pośrednictwem plików pamięci | Automatycznie, jako funkcja wbudowana        |
| **Modelowanie użytkownika** | Ręczne (zapis do MEMORY.md) | Automatyczne profile                         |
| **Wyszukiwanie**   | Wektorowe + według słów kluczowych (hybrydowe) | Semantyczne przeszukiwanie obserwacji |
| **Wiele agentów**  | Brak śledzenia                  | Świadomość relacji nadrzędny/podrzędny       |
| **Zależności**     | Brak (wbudowane) lub plik binarny QMD | Instalacja pluginu                      |

Honcho i wbudowany system pamięci mogą działać razem. Po skonfigurowaniu QMD
dostępne stają się dodatkowe narzędzia do przeszukiwania lokalnych plików
Markdown wraz z pamięcią Honcho obejmującą wiele sesji.

## Polecenia CLI

```bash
openclaw honcho setup                        # Configure API key and migrate files
openclaw honcho status                       # Check connection status
openclaw honcho ask <question>               # Query Honcho about the user
openclaw honcho search <query> [-k N] [-d D] # Semantic search over memory
```

## Więcej informacji

- [Kod źródłowy pluginu](https://github.com/plastic-labs/openclaw-honcho)
- [Dokumentacja Honcho](https://docs.honcho.dev)
- [Przewodnik po integracji Honcho z OpenClaw](https://docs.honcho.dev/v3/guides/integrations/openclaw)

## Powiązane materiały

- [Omówienie pamięci](/pl/concepts/memory)
- [Wbudowany mechanizm pamięci](/pl/concepts/memory-builtin)
- [Mechanizm pamięci QMD](/pl/concepts/memory-qmd)
- [Mechanizmy kontekstu](/pl/concepts/context-engine)

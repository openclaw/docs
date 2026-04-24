---
read_when:
    - Chcesz trwałej pamięci działającej między sesjami i kanałami
    - Chcesz wspomaganego przez AI przywoływania informacji i modelowania użytkownika
summary: Natywna dla AI pamięć między sesjami przez Plugin Honcho
title: Pamięć Honcho
x-i18n:
    generated_at: "2026-04-24T09:05:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: d77af5c7281a4abafc184e426b1c37205a6d06a196b50353c1abbf67cc93bb97
    source_path: concepts/memory-honcho.md
    workflow: 15
---

[Honcho](https://honcho.dev) dodaje do OpenClaw natywną dla AI pamięć. Utrwala
rozmowy w dedykowanej usłudze i z czasem buduje modele użytkownika oraz agenta,
dając agentowi kontekst między sesjami, który wykracza poza pliki Markdown w
przestrzeni roboczej.

## Co zapewnia

- **Pamięć między sesjami** -- rozmowy są utrwalane po każdej turze, więc
  kontekst przenosi się między resetami sesji, Compaction i przełączaniem kanałów.
- **Modelowanie użytkownika** -- Honcho utrzymuje profil dla każdego użytkownika (preferencje,
  fakty, styl komunikacji) oraz dla agenta (osobowość, wyuczone
  zachowania).
- **Wyszukiwanie semantyczne** -- wyszukiwanie obserwacji z poprzednich rozmów, a nie
  tylko bieżącej sesji.
- **Świadomość wielu agentów** -- agenci nadrzędni automatycznie śledzą uruchomionych
  podagentów, a rodzice są dodawani jako obserwatorzy w sesjach podrzędnych.

## Dostępne narzędzia

Honcho rejestruje narzędzia, których agent może używać podczas rozmowy:

**Pobieranie danych (szybkie, bez wywołania LLM):**

| Narzędzie                  | Co robi                                               |
| -------------------------- | ----------------------------------------------------- |
| `honcho_context`           | Pełna reprezentacja użytkownika między sesjami        |
| `honcho_search_conclusions`| Wyszukiwanie semantyczne po zapisanych wnioskach      |
| `honcho_search_messages`   | Znajdowanie wiadomości między sesjami (filtrowanie po nadawcy, dacie) |
| `honcho_session`           | Historia i podsumowanie bieżącej sesji                |

**Pytania i odpowiedzi (zasilane przez LLM):**

| Narzędzie    | Co robi                                                                  |
| ------------ | ------------------------------------------------------------------------ |
| `honcho_ask` | Zadawanie pytań o użytkownika. `depth='quick'` dla faktów, `'thorough'` dla syntezy |

## Pierwsze kroki

Zainstaluj Plugin i uruchom konfigurację:

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

Polecenie konfiguracji pyta o poświadczenia API, zapisuje konfigurację i
opcjonalnie migruje istniejące pliki pamięci przestrzeni roboczej.

<Info>
Honcho może działać całkowicie lokalnie (self-hosted) albo przez zarządzane API pod adresem
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

W przypadku instancji self-hosted wskaż `baseUrl` na lokalny serwer (na przykład
`http://localhost:8000`) i pomiń klucz API.

## Migracja istniejącej pamięci

Jeśli masz istniejące pliki pamięci przestrzeni roboczej (`USER.md`, `MEMORY.md`,
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

## Honcho vs pamięć wbudowana

|                   | Wbudowana / QMD               | Honcho                              |
| ----------------- | ----------------------------- | ----------------------------------- |
| **Przechowywanie**| Pliki Markdown w przestrzeni roboczej | Dedykowana usługa (lokalna lub hostowana) |
| **Między sesjami**| Przez pliki pamięci           | Automatyczne, wbudowane             |
| **Modelowanie użytkownika** | Ręczne (zapis do `MEMORY.md`) | Automatyczne profile                |
| **Wyszukiwanie**  | Wektorowe + słowa kluczowe (hybrydowe) | Semantyczne po obserwacjach         |
| **Wiele agentów** | Nieśledzone                   | Świadomość relacji rodzic/potomek   |
| **Zależności**    | Brak (wbudowane) lub binarka QMD | Instalacja Pluginu                |

Honcho i wbudowany system pamięci mogą działać razem. Gdy skonfigurowano QMD,
stają się dostępne dodatkowe narzędzia do wyszukiwania lokalnych plików Markdown obok
pamięci między sesjami Honcho.

## Polecenia CLI

```bash
openclaw honcho setup                        # Konfiguracja klucza API i migracja plików
openclaw honcho status                       # Sprawdzenie stanu połączenia
openclaw honcho ask <question>               # Zapytanie Honcho o użytkownika
openclaw honcho search <query> [-k N] [-d D] # Wyszukiwanie semantyczne w pamięci
```

## Dalsza lektura

- [Kod źródłowy Pluginu](https://github.com/plastic-labs/openclaw-honcho)
- [Dokumentacja Honcho](https://docs.honcho.dev)
- [Przewodnik integracji Honcho z OpenClaw](https://docs.honcho.dev/v3/guides/integrations/openclaw)
- [Memory](/pl/concepts/memory) -- przegląd pamięci OpenClaw
- [Context Engines](/pl/concepts/context-engine) -- jak działają silniki kontekstu Pluginów

## Powiązane

- [Przegląd pamięci](/pl/concepts/memory)
- [Wbudowany silnik pamięci](/pl/concepts/memory-builtin)
- [Silnik pamięci QMD](/pl/concepts/memory-qmd)

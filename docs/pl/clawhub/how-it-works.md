---
read_when:
    - Omówienie list, wersji, instalacji, publikowania i moderacji
summary: Jak działają wpisy, wersje, instalacje, publikowanie, skany i aktualizacje ClawHub.
x-i18n:
    generated_at: "2026-06-28T10:01:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Jak działa ClawHub

ClawHub to warstwa rejestru dla Skills i Pluginów OpenClaw. Daje użytkownikom miejsce do odkrywania pakietów, wydawcom miejsce do publikowania wersji, a OpenClaw wystarczające metadane do bezpiecznego instalowania i aktualizowania tych pakietów.

## Rekordy rejestru

Każda publiczna pozycja to rekord rejestru zawierający:

- właściciela oraz slug lub nazwę pakietu
- jedną lub więcej opublikowanych wersji
- metadane, podsumowanie, pliki i atrybucję źródła
- dziennik zmian i informacje o tagach, takie jak `latest`
- sygnały pobrań, instalacji i gwiazdek
- status skanowania bezpieczeństwa i moderacji

Strona pozycji jest kanonicznym miejscem, w którym użytkownicy mogą sprawdzić, co dany Skill lub Plugin deklaruje, że robi, przed jego instalacją.

## Skills

Skill to wersjonowany pakiet tekstowy skupiony wokół `SKILL.md`. Może zawierać pliki pomocnicze, przykłady, szablony i skrypty.

ClawHub odczytuje frontmatter `SKILL.md`, aby zrozumieć nazwę Skill, opis, wymagania, zmienne środowiskowe i metadane. Dokładne metadane są ważne, ponieważ pomagają użytkownikom zdecydować, czy zainstalować dany Skill, i pomagają automatycznym skanom wykrywać niezgodności między deklarowanym a zaobserwowanym zachowaniem.

Zobacz [Format Skill](/pl/clawhub/skill-format).

## Pluginy

Pluginy to spakowane rozszerzenia OpenClaw. ClawHub przechowuje metadane pakietów, informacje o zgodności, linki źródłowe, artefakty i rekordy wersji.

Gdy OpenClaw instaluje Plugin z ClawHub, przed instalacją sprawdza deklarowane metadane zgodności. Rekordy pakietów mogą zawierać zgodność API, minimalną wersję Gateway, docelowe hosty, wymagania środowiskowe i skróty artefaktów.

Użyj jawnego źródła instalacji ClawHub, gdy chcesz, aby rejestr był źródłem prawdy:

```bash
openclaw plugins install clawhub:<package>
```

## Publikowanie

Publikowanie tworzy nowy niezmienny rekord wersji. Wydawcy używają CLI `clawhub` do uwierzytelnionych przepływów pracy rejestru:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Używaj przebiegów próbnych, aby podejrzeć rozwiązany ładunek przed przesłaniem. Strony publiczne pokazują następnie opublikowane metadane, pliki, atrybucję źródła i status skanowania.

## Instalacje i aktualizacje

Polecenia instalacji OpenClaw używają ClawHub jako źródła pakietów:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw zapisuje metadane źródła instalacji, aby aktualizacje mogły później rozwiązać ten sam pakiet rejestru. CLI ClawHub obsługuje także bezpośrednie przepływy instalowania i aktualizowania Skills dla użytkowników, którzy chcą folderów Skills zarządzanych przez rejestr poza pełnym obszarem roboczym OpenClaw.

## Stan bezpieczeństwa

ClawHub jest otwarty na publikowanie, ale wydania nadal podlegają bramkom przesyłania, automatycznym kontrolom, zgłoszeniom użytkowników i działaniom moderatorów.

Strony publiczne pokazują podsumowania skanowania, gdy są dostępne. Treści wstrzymane, ukryte lub zablokowane mogą zniknąć z publicznego wyszukiwania i przepływów instalacji, pozostając widoczne dla właściciela na potrzeby diagnostyki.

Zobacz [Bezpieczeństwo](/pl/clawhub/security), [Audyty bezpieczeństwa](/pl/clawhub/security-audits), [Moderacja i bezpieczeństwo konta](/pl/clawhub/moderation) oraz [Akceptowalne użycie](/pl/clawhub/acceptable-usage).

## Dostęp do API

ClawHub udostępnia publiczne API odczytu do odkrywania, wyszukiwania, szczegółów pakietów i pobrań. Katalogi firm trzecich mogą używać tych API, gdy linkują z powrotem do kanonicznej pozycji ClawHub, przestrzegają limitów szybkości i unikają sugerowania poparcia.

Zobacz [Publiczne API](/pl/clawhub/api) i [HTTP API](/pl/clawhub/http-api).

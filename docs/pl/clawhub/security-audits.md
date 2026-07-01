---
read_when:
    - Zrozumienie wyników audytu bezpieczeństwa ClawHub
    - Decydowanie, czy zainstalować skill czy Plugin
    - Wyjaśnianie statusu audytu ClawHub, poziomu ryzyka lub ustaleń
sidebarTitle: Security Audits
summary: Jak rozumieć wyniki audytu bezpieczeństwa ClawHub przed zainstalowaniem Skills lub Plugin.
title: Audyty bezpieczeństwa
x-i18n:
    generated_at: "2026-07-01T15:31:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Audyty bezpieczeństwa

Audyty bezpieczeństwa ClawHub pomagają zdecydować, czy umiejętność lub wtyczka jest wystarczająco bezpieczna
do zainstalowania. Pokazują, co robi wydanie, o jakie uprawnienia prosi oraz
czy coś wymaga dodatkowej uwagi, zanim uzyska dostęp do plików, kont,
poświadczeń, kodu lub usług zewnętrznych.

Audyty są silnymi sygnałami bezpieczeństwa, ale nie gwarantują, że wydanie jest
wolne od ryzyka. Zawsze kieruj się własną oceną przed przyznaniem wrażliwego dostępu.

Zobacz też [Bezpieczeństwo](/clawhub/security), [Dopuszczalne użycie](/clawhub/acceptable-usage)
oraz [Moderacja i bezpieczeństwo konta](/clawhub/moderation).

## Co sprawdzić przed instalacją

Przed instalacją sprawdź:

- ogólny status audytu
- poziom ryzyka
- wszystkie wymienione ustalenia
- wymagane poświadczenia, uprawnienia lub zmienne środowiskowe
- właściciela, źródło, wersję, changelog, pobrania, gwiazdki i inne sygnały zaufania

Instaluj tylko treści, które rozumiesz i którym ufasz.

## Status audytu

Status audytu mówi, jak zareagować na wynik audytu:

| Status      | Znaczenie                                                                 |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Nie znaleziono widocznego problemu powyżej niskiego ryzyka.               |
| `Review`    | Przeczytaj ustalenia przed instalacją. Wydanie nadal może być prawidłowe. |
| `Warn`      | Zachowaj szczególną ostrożność. ClawHub znalazł problem o dużym wpływie lub sygnał ostrzegawczy. |
| `Malicious` | Nie instaluj.                                                             |
| `Pending`   | Audyty nie zostały jeszcze zakończone.                                    |
| `Error`     | Nie udało się ukończyć audytu.                                            |

`Pass` uspokaja, ale nie zastępuje własnej oceny. Ma to największe znaczenie
w przypadku narzędzi, które mogą publikować treści, edytować dane, uruchamiać polecenia, czytać pliki lub
uzyskiwać dostęp do systemów produkcyjnych.

## Poziom ryzyka

Poziom ryzyka opisuje zasięg oddziaływania: jak dużą władzę wydaje się mieć wydanie, jeśli
używasz go zgodnie z przeznaczeniem.

| Poziom ryzyka | Znaczenie                                                                       |
| ------------- | ------------------------------------------------------------------------------- |
| `Low`         | Znaleziono niewielką wrażliwą władzę lub niewielki wpływ na użytkownika.        |
| `Medium`      | Wydanie ma znaczącą władzę, na przykład dostęp do konta lub możliwość zmiany danych. |
| `High`        | Wydanie ma władzę o dużym wpływie, poważne ustalenia lub sygnały złośliwości.   |

Poziom ryzyka i status audytu odpowiadają na różne pytania:

- Poziom ryzyka pyta: „Ile władzy tu jest?”
- Status audytu pyta: „Co należy zrobić z tym wynikiem?”

Na przykład umiejętność publikowania może pokazywać `Review` z ryzykiem `Medium`. To
nie znaczy, że jest złośliwa. Oznacza to, że umiejętność wydaje się zgodna z celem, ale może
działać ze znaczącą władzą nad kontem.

## Ustalenia

Ustalenia wyjaśniają, dlaczego pokazano dany wynik audytu. Każde ustalenie zwykle obejmuje:

- co oznacza
- dlaczego zostało oznaczone
- odpowiednią zawartość umiejętności lub wtyczki
- rekomendację

Ustalenia mogą mieć etykiety `Info`, `Low`, `Medium`, `High` lub `Critical`. Ustalenia o wyższej
wadze silniej wpływają na poziom ryzyka i status audytu.

Ustalenia o niskiej pewności są ukryte w publicznym podsumowaniu audytu, aby strona
pozostawała skupiona na użytecznych dowodach.

## Co sprawdza ClawHub

ClawHub audytuje przesłane artefakty wydań, w tym:

- instrukcje umiejętności lub metadane wtyczki
- zadeklarowane zmienne środowiskowe i uprawnienia
- instrukcje instalacji i metadane pakietu
- dołączone pliki i manifesty plików
- metadane zgodności i możliwości

Główne pytanie dotyczy spójności: czy nazwa, podsumowanie, metadane, żądana
władza i rzeczywista zawartość są zgodne z tym, czego użytkownicy mogliby rozsądnie oczekiwać?

Silne zachowanie nie jest automatycznie złe. Wiele użytecznych narzędzi potrzebuje poświadczeń,
lokalnych poleceń, interfejsów API dostawców lub instalacji pakietów. Audyt sprawdza, czy ta
władza jest oczekiwana, ujawniona i proporcjonalna.

Strony artefaktów linkują do pełnego audytu pod adresem:

```text
/<owner>/skills/<slug>/security-audit
```

Strona audytu łączy:

1. SkillSpector
2. VirusTotal
3. Analizę ryzyka

## VirusTotal

ClawHub używa VirusTotal jako telemetrii malware w stosie audytu. VirusTotal jest
zaufanym standardem branżowym dla reputacji plików i skanowania malware, a nasze
partnerstwo pozwala ClawHub dodać szerszą inteligencję bezpieczeństwa do przeglądu umiejętności i wtyczek.

VirusTotal jest szczególnie przydatny dla znanych złośliwych artefaktów, trafień silników i
sygnałów reputacji, które uzupełniają agent-aware review ClawHub. Gdy dostępne są
liczby od silników dostawców, audyt podsumowuje je prostym językiem, na przykład:

```text
62/62 vendors flagged this skill as clean.
```

albo:

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

Gdy ClawHub nie ma telemetrii liczby dostawców do podsumowania, audyt mówi:

```text
No VirusTotal findings
```

VirusTotal pozostaje telemetrią. Nie zastępuje własnej, świadomej artefaktów
analizy ryzyka ClawHub.

## Analiza ryzyka

Analiza ryzyka jest wewnętrznie obsługiwana przez ClawScan, własny system audytu bezpieczeństwa
ClawHub. Przegląda każde wydanie jako artefakt przeznaczony dla agenta: instrukcje,
metadane, zadeklarowane uprawnienia, pliki, sygnały możliwości, sygnały skanowania statycznego,
ustalenia SkillSpector, telemetrię VirusTotal oraz kontekst podany przez wydawcę.
Sygnały skanowania statycznego są wewnętrznym kontekstem dla tego przeglądu; nie są
samodzielną publiczną sekcją audytu ani werdyktem blokującym instalację.

Analiza ryzyka używa
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
jako perspektywy dla ryzyk takich jak prompt injection, nadużycie narzędzi, ujawnienie poświadczeń,
niebezpieczne wykonywanie, zatruwanie pamięci lub kontekstu oraz nadmierna sprawczość.

ClawScan nie traktuje groźnie wyglądającej możliwości jako automatycznie złośliwej.
Pyta, czy możliwość jest ujawniona, zgodna z celem i wspierana przez
deklarowany przypadek użycia wydania.

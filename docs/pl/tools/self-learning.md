---
read_when:
    - Chcesz, aby OpenClaw uczył się procedur wielokrotnego użytku na podstawie zakończonych rozmów
    - Podejmowana jest decyzja, czy włączyć autonomiczne propozycje umiejętności
    - Trzeba zrozumieć bezpieczeństwo samouczenia, koszty, kryteria kwalifikacji lub rozwiązywanie problemów
sidebarTitle: Self-learning
summary: Pozwól OpenClaw proponować wielokrotnego użytku Skills na podstawie poprawek i istotnych ukończonych prac
title: Samouczenie się
x-i18n:
    generated_at: "2026-07-16T19:13:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b10618c1a64441bdf0ba58f03e02972bdf2b1d59643a78358910594f8139ccb8
    source_path: tools/self-learning.md
    workflow: 16
---

Samouczenie pozwala OpenClaw przekształcać przydatne informacje z rozmów w oczekujące
propozycje [Skill Workshop](/pl/tools/skill-workshop). Nie trenuje ono wag modelu,
nie edytuje aktywnych umiejętności ani nie zmienia po cichu zachowania agenta. Każda wyuczona
procedura pozostaje oczekująca, dopóki operator jej nie przejrzy i nie zastosuje.

Samouczenie jest **domyślnie wyłączone**. Należy je włączać tylko wtedy, gdy dodatkowe
uruchomienie modelu w tle i przegląd transkrypcji są odpowiednie dla danego obszaru roboczego.

## Włączanie samouczenia

W interfejsie Control UI otwórz **Plugins → Workshop** i włącz **Self-learning**. Zmiana
zaczyna obowiązywać natychmiast; gdy inny proces zapisujący konfigurację zaktualizował
plik, Control UI odświeża migawkę konfiguracji i ponawia próbę przełączenia bez
ponownego ładowania strony ani Gateway.

Użycie CLI:

```bash
openclaw config set skills.workshop.autonomous.enabled true --strict-json
```

Można też edytować `~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: true,
      },
    },
  },
}
```

Ponowne wyłączenie:

```bash
openclaw config set skills.workshop.autonomous.enabled false --strict-json
```

Tworzenie umiejętności na żądanie użytkownika, `/learn` oraz ręczne operacje Skill Workshop
działają nadal, gdy samouczenie jest wyłączone.

## Ręczne przeglądanie wcześniejszych sesji

Ręczny przegląd historii jest zachowawczą alternatywą dla autonomicznego przechwytywania.
W interfejsie Control UI otwórz **Plugins → Workshop** i wybierz **Find skill ideas**.
Nie zmienia to `skills.workshop.autonomous.enabled`.

Każde skanowanie:

- zaczyna od najnowszych nieprzejrzanych sesji i cofa się;
- przegląda maksymalnie 20 istotnych sesji obejmujących co najmniej sześć tur modelu;
- pomija sesje cron, heartbeat, hook, subagent, ACP, należące do pluginów oraz wewnętrzne
  sesje przeglądu;
- redaguje rozpoznane sekrety i ogranicza pakiet transkrypcji przed wysłaniem go
  do skonfigurowanego modelu wybranego agenta;
- stosuje ten sam wysoki próg co autonomiczny przegląd doświadczeń; oraz
- może utworzyć lub zmienić najwyżej trzy oczekujące propozycje, nigdy aktywne umiejętności.

Workshop raportuje łączną liczbę sesji, zakres dat i liczbę znalezionych pomysłów.
Wybierz **Scan earlier work**, aby przejść do następnego starszego zakresu. Gdy kursor dotrze
do początku kwalifikującej się historii, działanie zmieni się na **Scan new work**.
OpenClaw zapisuje we współdzielonej bazie danych stanu tylko kursor i metadane zakresu;
nie tworzy drugiego archiwum transkrypcji.

Sesje są skanowane tylko wtedy, gdy OpenClaw może potwierdzić ich własność i wykluczyć
treść z zewnętrznych hooków. Po aktualizacji bieżąca transkrypcja sprzed aktualizacji może
zostać sklasyfikowana lokalnie, ale rotowane transkrypcje sprzed aktualizacji bez danych
o pochodzeniu poszczególnych uruchomień są pomijane. Nowe transkrypcje zachowują te dane pochodzenia podczas rotacji.

Ręczne skanowania nadal generują koszty dostawcy modelu i wysyłają kwalifikującą się treść
rozmów do skonfigurowanego dostawcy. Należy ich używać tylko wtedy, gdy taki przegląd jest zgodny
z wymaganiami obszaru roboczego dotyczącymi prywatności i przetwarzania danych.

## Czego OpenClaw może się nauczyć

Samouczenie ma dwie zachowawcze ścieżki:

1. **Bezpośrednie instrukcje i korekty.** OpenClaw wykrywa trwałe sformułowania,
   takie jak „od teraz”, „następnym razem”, oraz korekty nieskutecznego podejścia.
   Gdy samouczenie jest włączone, może przekształcić te sygnały w oczekujące propozycje
   bez czekania na kolejny monit. Ta deterministyczna ścieżka może grupować powiązane
   instrukcje w maksymalnie trzy propozycje, kierować je do zapisywalnej umiejętności obszaru roboczego
   lub zmieniać własną powiązaną oczekującą propozycję. Uruchamia się również po nieudanych turach,
   ponieważ przechwytuje instrukcje użytkownika, zamiast oceniać ukończenie.
2. **Przegląd doświadczeń.** Po pomyślnej, istotnej turze pierwszoplanowej
   OpenClaw może przejrzeć ukończoną pracę pod kątem techniki odzyskiwania nadającej się do ponownego użycia lub
   stabilnej procedury, która wyeliminowałaby co najmniej dwie przyszłe rundy
   modelu lub narzędzi.

Dobrymi kandydatami są:

- niezawodny sposób odzyskiwania po powtarzających się awariach narzędzia lub modelu;
- nieoczywiste ograniczenie kolejności, które zapobiegło powtarzającemu się błędowi;
- stabilny wieloetapowy przepływ pracy, który wymagał wielokrotnego rozpoznania; lub
- wielokrotnego użytku kontrola wstępna, która pozwoliłaby uniknąć wielu przyszłych wywołań.

Recenzent powinien powstrzymać się od działania w przypadku rutynowej udanej pracy, jednorazowych próśb,
faktów osobistych, prostych preferencji, przejściowych awarii środowiska, ogólnych
porad, niepopartych twierdzeń negatywnych oraz sekretów.

## Kiedy uruchamia się przegląd doświadczeń

Przegląd doświadczeń jest celowo opóźniony i ograniczony:

- Tura pierwszoplanowa musi zakończyć się powodzeniem.
- Bieżąca tura musi zawierać co najmniej dziesięć iteracji modelu.
- Sesje cron, heartbeat, pamięci, przepełnienia, hooków, subagentów i przeglądu są
  wykluczone.
- Uruchomienie pierwszoplanowe musi mieć rozpoznanego dostawcę i model oraz rzeczywiście
  mieć dostęp do `skill_workshop`.
- OpenClaw czeka 30 sekund po ukończeniu. Późniejsze ukończenie zadania pierwszoplanowego w
  tej samej sesji rozpoczyna ten okres ciszy od nowa.
- Jeśli jakiekolwiek uruchomienie agenta lub odpowiedzi jest nadal aktywne, przegląd czeka kolejne 30 sekund.
- Jednocześnie działa tylko jeden przegląd doświadczeń.
- Opóźniony przegląd jest lokalną dla procesu pracą Gateway. Gateway musi działać
  przez cały okres bezczynności; jednorazowe środowiska lokalne i oparte na CLI nie zachowują
  wystarczającego kontekstu trajektorii ani dostępności narzędzi, aby go zaplanować.

Odpowiedź pierwszoplanowa nigdy nie jest opóźniana na potrzeby uczenia. Nieudana lub niekwalifikująca się
tura nie rozpoczyna przeglądu doświadczeń, chociaż bezpośrednie korekty użytkownika mogą
nadal zostać zaproponowane jako sugestia, gdy autonomia jest wyłączona.

## Co otrzymuje recenzent

Recenzent działający w tle otrzymuje tylko bieżącą turę, począwszy od jej najnowszej
wiadomości użytkownika. Wyrenderowana trajektoria jest ograniczona do 60,000 znaków;
w razie potrzeby OpenClaw zachowuje pierwszą wiadomość i najnowsze dowody oraz
oznacza pominiętą środkową część.

Recenzent ponownie wykorzystuje rozpoznanego dostawcę i model. Ponownie wykorzystuje profil
uwierzytelniania zadania pierwszoplanowego, gdy ta tożsamość jest dostępna, i wyłącza rozwiązania awaryjne modelu.
Przegląd rozpoczyna zatem dodatkowe uruchomienie modelu u skonfigurowanego dostawcy.
To uruchomienie może wysłać więcej niż jedno żądanie do dostawcy podczas sprawdzania lub tworzenia
propozycji. Obowiązują ceny i warunki przetwarzania danych dostawcy, tak samo jak w przypadku
tury pierwszoplanowej.

Przed rozpoczęciem OpenClaw ponownie wczytuje bieżącą konfigurację środowiska uruchomieniowego i ponownie sprawdza
obowiązujące zasady piaskownicy i narzędzi dla pierwotnej rozmowy. Jeśli uruchomienie odbywa się
w piaskownicy, zasady nie zezwalają już na `skill_workshop` albo brakuje wymaganych danych
środowiska uruchomieniowego, przegląd kończy się bezpiecznym niepowodzeniem i niczego nie tworzy.

<Warning>
  Włączenie samouczenia pozwala wysyłać kwalifikującą się treść rozmowy, w tym dane wejściowe
  i wyniki narzędzi z bieżącej tury, do wybranego dostawcy modelu
  w celu wykonania jednego dodatkowego przeglądu. Nie należy go włączać w obszarze roboczym, w którym
  taki przegląd naruszałby wymagania dotyczące przetwarzania danych.
</Warning>

## Bezpieczeństwo propozycji

Recenzent działa w odizolowanej sesji z celowo ograniczonym
zestawem narzędzi:

- Może tylko wyświetlać lub sprawdzać propozycje Workshop oraz utworzyć albo zmienić jedną
  oczekującą propozycję.
- Nie może aktualizować aktywnej umiejętności, stosować propozycji, odrzucać propozycji, poddawać
  propozycji kwarantannie, wysyłać wiadomości ani używać ogólnych narzędzi agenta.
- Jeden budżet modyfikacji jest współdzielony między ponownymi próbami modelu, dlatego przegląd może utworzyć lub
  zmienić najwyżej jedną propozycję.
- Przeglądana trajektoria jest traktowana jako niezaufany materiał dowodowy, a nie jako instrukcje
  dla agenta działającego w tle.
- Skill Workshop skanuje treść propozycji i odrzuca rozpoznane dosłowne
  dane uwierzytelniające, zanim stan propozycji zostanie zapisany.

Nadal obowiązują standardowe limity Workshop, w tym `maxPending`, `maxSkillBytes`,
ograniczenia plików pomocniczych, kontrole skanera oraz zapisy wyłącznie w obszarze roboczym. Ustawienie
`approvalPolicy: "auto"` nie przyznaje recenzentowi działającemu w tle dostępu
do działań cyklu życia.

## Przeglądanie wyuczonych propozycji

Samouczenie tworzy takie same oczekujące propozycje jak ręczne użycie Workshop.
Należy je sprawdzić przed zastosowaniem:

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Propozycje, które są przydatne, ale jeszcze niegotowe, można zmienić, odrzucić lub poddać kwarantannie:

```bash
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop reject <proposal-id> --reason "Zbyt szczegółowe"
openclaw skills workshop quarantine <proposal-id> --reason "Wymaga przeglądu bezpieczeństwa"
```

Zastosowanie jest jedyną operacją zapisującą aktywną `SKILL.md`. Pełny model
cyklu życia i przechowywania opisano w [Skill Workshop](/pl/tools/skill-workshop).

## Konfiguracja

| Ustawienie                                  | Domyślnie | Wpływ samouczenia                                                                                                                  |
| ------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `skills.workshop.autonomous.enabled`       | `false`  | Włącza bezpośrednie przechwytywanie korekt i opóźniony przegląd doświadczeń.                                                       |
| `skills.workshop.approvalPolicy`           | `"auto"` | Steruje monitami o zatwierdzenie dla standardowych działań cyklu życia inicjowanych przez agenta; nie rozszerza uprawnień recenzenta działającego w tle. |
| `skills.workshop.maxPending`               | `50`     | Ogranicza liczbę oczekujących i poddanych kwarantannie propozycji w obszarze roboczym.                                             |
| `skills.workshop.maxSkillBytes`            | `40000`  | Ogranicza rozmiar treści propozycji w bajtach.                                                                                     |
| `skills.workshop.allowSymlinkTargetWrites` | `false`  | Wpływa tylko na zachowanie podczas stosowania; samo samouczenie zapisuje stan propozycji, a nie aktywne docelowe umiejętności.     |

Pełny schemat, zakresy i powiązane ustawienia umiejętności opisano w sekcji
[Konfiguracja Skills](/pl/tools/skills-config#workshop-skills-workshop).

## Rozwiązywanie problemów

### Po długiej turze nie pojawia się żadna propozycja

Należy sprawdzić wszystkie poniższe warunki:

1. `skills.workshop.autonomous.enabled` ma wartość `true` w aktywnej konfiguracji Gateway.
2. Tura zakończyła się powodzeniem i obejmowała co najmniej dziesięć iteracji modelu po najnowszej
   wiadomości użytkownika.
3. Rozmowa była standardowym uruchomieniem pierwszoplanowym, a nie uruchomieniem zaplanowanym, pamięci,
   hooka lub subagenta.
4. Pierwotne uruchomienie miało dostęp do `skill_workshop` i nie działało w piaskownicy.
5. System pozostawał bezczynny wystarczająco długo, aby opóźniony przegląd mógł się odbyć.
6. Długotrwały proces Gateway pozostał aktywny przez cały okres bezczynności;
   jednorazowe polecenie lokalne nie czeka na opóźniony przegląd.

Kwalifikujący się przegląd nadal może nie utworzyć żadnej propozycji. Powstrzymanie się od działania jest oczekiwanym
wynikiem, gdy materiał dowodowy nie spełnia progu procedury nadającej się do ponownego użycia.

### Doctor zgłasza, że narzędzie Workshop jest ukryte

Gdy samouczenie jest włączone, `openclaw doctor` sprawdza, czy obowiązujące zasady
narzędzi domyślnego agenta zezwalają na `skill_workshop`. Należy zastosować zgłoszoną
zmianę `tools.allow` lub `tools.alsoAllow` albo wyłączyć samouczenie.

### Pojawia się zbyt wiele propozycji o małej wartości

Należy wyłączyć samouczenie i nadal używać `/learn` lub jawnych żądań Workshop:

```bash
openclaw config set skills.workshop.autonomous.enabled false --strict-json
```

Oczekujące propozycje można nadal przeglądać po wyłączeniu funkcji. Wyłączenie
samouczenia nie stosuje, nie odrzuca ani nie usuwa tych propozycji.

## Powiązane

- [Skill Workshop](/pl/tools/skill-workshop) do przeglądu propozycji, zatwierdzania i
  przechowywania
- [Tworzenie umiejętności](/pl/tools/creating-skills) dla umiejętności tworzonych ręcznie oraz
  struktury `SKILL.md`
- [Konfiguracja umiejętności](/pl/tools/skills-config) dla wszystkich ustawień `skills.*`
- [CLI umiejętności](/pl/cli/skills) dla poleceń Workshop i kuratora

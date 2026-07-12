---
read_when:
    - Refaktoryzacja cyklu życia sesji ACP lub czyszczenia procesów ACPX
    - Debugowanie osieroconych procesów ACPX, ponownego użycia PID-ów oraz bezpieczeństwa czyszczenia w środowisku z wieloma Gatewayami
    - Zmiana widoczności sessions_list dla utworzonych sesji ACP lub podagentów
    - Projektowanie metadanych własności dla zadań działających w tle, sesji ACP lub dzierżaw procesów
sidebarTitle: ACP lifecycle refactor
summary: Plan migracji w celu jawnego określenia własności sesji ACP i procesu ACPX
title: Refaktoryzacja cyklu życia ACP
x-i18n:
    generated_at: "2026-07-12T15:32:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7f4ee447e0b436601c68251c26c1b897a642f6a8b1886d18647b62817996792
    source_path: refactor/acp.md
    workflow: 16
---

Cykl życia ACP obecnie działa, ale zbyt wiele jego aspektów jest wnioskowanych dopiero po fakcie.
Oczyszczanie procesów odtwarza własność na podstawie PID-ów, ciągów poleceń, ścieżek
skryptów opakowujących i bieżącej tabeli procesów. Widoczność sesji odtwarza własność
na podstawie ciągów kluczy sesji oraz dodatkowych wywołań `sessions.list({ spawnedBy })`.
Pozwala to wprowadzać precyzyjne poprawki, ale ułatwia też przeoczenie przypadków brzegowych:
ponowne użycie PID-u, polecenia w cudzysłowach, procesy potomne dalszego stopnia adaptera, katalogi główne stanu wielu Gatewayów,
`cancel` w porównaniu z `close` oraz widoczność `tree` w porównaniu z `all` stają się osobnymi
miejscami, w których trzeba na nowo ustalać te same reguły własności.

Ta refaktoryzacja nadaje własności pierwszorzędny charakter. Celem nie jest nowy obszar produktu ACP,
lecz bezpieczniejszy kontrakt wewnętrzny dla istniejącego zachowania ACP i ACPX.

## Cele

- Oczyszczanie nigdy nie wysyła sygnału do procesu, chyba że bieżące dane z działającego procesu odpowiadają
  dzierżawie należącej do OpenClaw.
- `cancel`, `close` i oczyszczanie podczas uruchamiania mają odrębne intencje dotyczące cyklu życia.
- `sessions_list`, `sessions_history`, `sessions_send` i kontrole stanu używają
  tego samego modelu sesji należących do żądającego.
- Instalacje z wieloma Gatewayami nie mogą oczyszczać nawzajem swoich skryptów opakowujących ACPX.
- Stare rekordy sesji ACPX nadal działają podczas migracji.
- Środowisko uruchomieniowe pozostaje własnością Pluginu; rdzeń nie poznaje szczegółów pakietu ACPX.

## Poza zakresem

- Zastąpienie ACPX lub zmiana publicznego interfejsu polecenia `/acp`.
- Przenoszenie specyficznego dla dostawcy zachowania adaptera ACP do rdzenia.
- Wymaganie od użytkowników ręcznego oczyszczenia stanu przed aktualizacją.
- Powodowanie, że `cancel` zamyka sesje ACP wielokrotnego użytku.

## Model docelowy

### Tożsamość instancji Gatewaya

Każdy proces Gatewaya powinien mieć stabilny identyfikator instancji środowiska uruchomieniowego:

```ts
type GatewayInstanceId = string;
```

Może być generowany podczas uruchamiania Gatewaya i utrwalany w stanie przez cały okres działania
danej instalacji. Nie jest sekretem bezpieczeństwa; jest wyróżnikiem własności używanym
w celu uniknięcia pomylenia procesów ACP jednego Gatewaya z procesami innego Gatewaya.

### Własność sesji ACP

Każda uruchomiona sesja ACP powinna mieć znormalizowane metadane własności:

```ts
type AcpSessionOwner = {
  sessionKey: string;
  spawnedBy?: string;
  parentSessionKey?: string;
  ownerSessionKey: string;
  agentId: string;
  backend: "acpx";
  gatewayInstanceId: GatewayInstanceId;
  createdAt: number;
};
```

Gateway powinien zwracać te pola w wierszach sesji, gdy są znane.
Filtrowanie widoczności powinno być czystym sprawdzeniem metadanych wiersza:

```ts
canSeeSessionRow({
  row,
  requesterSessionKey,
  visibility,
  a2aPolicy,
});
```

Usuwa to ukryte dodatkowe wywołania `sessions.list({ spawnedBy })` z
kontroli widoczności. Uruchomiona między agentami sesja potomna ACP należy do żądającego, ponieważ
tak wskazuje wiersz, a nie dlatego, że drugie zapytanie przypadkowo ją odnajduje.

### Dzierżawy procesów ACPX

Każde uruchomienie wygenerowanego skryptu opakowującego powinno utworzyć rekord dzierżawy:

```ts
type AcpxProcessLease = {
  leaseId: string;
  gatewayInstanceId: GatewayInstanceId;
  sessionKey: string;
  wrapperRoot: string;
  wrapperPath: string;
  rootPid: number;
  processGroupId?: number;
  commandHash: string;
  startedAt: number;
  state: "open" | "closing" | "closed" | "lost";
};
```

Proces skryptu opakowującego powinien otrzymywać identyfikator dzierżawy i identyfikator instancji Gatewaya w swoim
środowisku:

```sh
OPENCLAW_ACPX_LEASE_ID=...
OPENCLAW_GATEWAY_INSTANCE_ID=...
```

Jeśli platforma na to pozwala, weryfikacja powinna preferować bieżące metadane procesu,
których nie można pomylić z powodu cudzysłowów w poleceniu:

- główny PID nadal istnieje
- bieżąca ścieżka skryptu opakowującego znajduje się w `wrapperRoot`
- grupa procesów odpowiada dzierżawie, jeśli jest dostępna
- środowisko zawiera oczekiwany identyfikator dzierżawy, jeśli można je odczytać
- skrót polecenia lub ścieżka pliku wykonywalnego odpowiada dzierżawie

Jeśli nie można zweryfikować działającego procesu, oczyszczanie bezpiecznie odmawia działania.

## Kontroler cyklu życia

Należy wprowadzić jeden kontroler cyklu życia ACPX, który jest właścicielem dzierżaw procesów i zasad
oczyszczania:

```ts
interface AcpxLifecycleController {
  ensureSession(input: AcpRuntimeEnsureInput): Promise<AcpRuntimeHandle>;
  cancelTurn(handle: AcpRuntimeHandle): Promise<void>;
  closeSession(input: {
    handle: AcpRuntimeHandle;
    discardPersistentState?: boolean;
    reason?: string;
  }): Promise<void>;
  reapStartupOrphans(): Promise<void>;
  verifyOwnedTree(lease: AcpxProcessLease): Promise<OwnedProcessTree | null>;
}
```

`cancelTurn` żąda wyłącznie anulowania tury. Nie może oczyszczać procesów skryptów opakowujących
ani adapterów wielokrotnego użytku.

`closeSession` może przeprowadzać oczyszczanie, ale dopiero po wczytaniu rekordu sesji,
wczytaniu dzierżawy i zweryfikowaniu, że bieżące drzewo procesów nadal należy do tej
dzierżawy.

`reapStartupOrphans` rozpoczyna od otwartych dzierżaw w stanie. Może używać tabeli
procesów do znajdowania procesów potomnych, ale nie powinien najpierw skanować dowolnych poleceń
przypominających ACP, a następnie uznawać, że prawdopodobnie należą do nas.

## Kontrakt skryptu opakowującego

Generowane skrypty opakowujące powinny pozostać niewielkie. Powinny:

- uruchamiać adapter w grupie procesów, jeśli jest to obsługiwane
- przekazywać zwykłe sygnały zakończenia do grupy procesów
- wykrywać śmierć procesu nadrzędnego
- po śmierci procesu nadrzędnego wysyłać SIGTERM, a następnie utrzymywać skrypt opakowujący przy życiu do czasu
  uruchomienia awaryjnego SIGKILL
- przekazywać główny PID i identyfikator grupy procesów z powrotem do kontrolera cyklu życia, gdy
  są dostępne

Skrypty opakowujące nie powinny decydować o zasadach sesji. Egzekwują jedynie lokalne
oczyszczanie drzewa procesów własnej grupy adaptera.

## Kontrakt widoczności sesji

Widoczność powinna używać znormalizowanej własności wiersza:

```ts
type SessionVisibilityInput = {
  requesterSessionKey: string;
  row: {
    key: string;
    agentId: string;
    ownerSessionKey?: string;
    spawnedBy?: string;
    parentSessionKey?: string;
  };
  visibility: "self" | "tree" | "agent" | "all";
  a2aPolicy: AgentToAgentPolicy;
};
```

Reguły:

- `self`: tylko sesja żądającego.
- `tree`: sesja żądającego oraz wiersze należące do żądającego lub uruchomione z jego sesji.
- `all`: wszystkie wiersze tego samego agenta, wiersze między agentami dozwolone przez a2a oraz należące do żądającego
  uruchomione wiersze między agentami, nawet gdy ogólne a2a jest wyłączone.
- `agent`: tylko ten sam agent, chyba że jawna relacja własności wskazuje, że wiersz
  należy do żądającego.

Dzięki temu `tree` i `all` są monotoniczne: `all` nie może ukrywać należącej do żądającego sesji potomnej, którą
pokazałoby `tree`.

## Plan migracji

### Etap 1: Dodanie tożsamości i dzierżaw

- Dodaj `gatewayInstanceId` do stanu Gatewaya.
- Dodaj magazyn dzierżaw ACPX w katalogu stanu ACPX.
- Zapisuj dzierżawę przed uruchomieniem wygenerowanego skryptu opakowującego.
- Zapisuj `leaseId` w nowych rekordach sesji ACPX.
- Zachowaj istniejące pola PID-u i polecenia dla starych rekordów.

### Etap 2: Oczyszczanie oparte przede wszystkim na dzierżawach

- Zmień oczyszczanie przy zamykaniu tak, aby najpierw wczytywało `leaseId`.
- Przed wysłaniem sygnału zweryfikuj własność działającego procesu względem dzierżawy.
- Zachowaj bieżący główny PID i mechanizm awaryjny oparty na katalogu głównym skryptów opakowujących tylko dla starszych rekordów.
- Po zweryfikowanym oczyszczeniu oznacz dzierżawy jako `closed`.
- Oznacz dzierżawy jako `lost`, gdy proces zniknął przed oczyszczeniem.

### Etap 3: Oczyszczanie przy uruchamianiu oparte przede wszystkim na dzierżawach

- Oczyszczanie przy uruchamianiu skanuje otwarte dzierżawy.
- Dla każdej dzierżawy zweryfikuj proces główny i zbierz procesy potomne.
- Oczyszczaj zweryfikowane drzewa, zaczynając od procesów potomnych.
- Usuwaj stare dzierżawy `closed` i `lost` po upływie ograniczonego okresu przechowywania.
- Zachowaj skanowanie znaczników poleceń wyłącznie jako tymczasowy mechanizm awaryjny dla starszych wersji, chroniony w miarę możliwości przez
  katalog główny skryptów opakowujących i instancję Gatewaya.

### Etap 4: Wiersze własności sesji

- Dodaj metadane własności do wierszy sesji Gatewaya.
- Dostosuj komponenty zapisujące ACPX, podagentów, zadania w tle i magazyn sesji, aby uzupełniały
  `ownerSessionKey` lub `spawnedBy`.
- Przekształć kontrole widoczności sesji tak, aby używały metadanych wierszy.
- Usuń dodatkowe wywołania `sessions.list({ spawnedBy })` wykonywane podczas sprawdzania widoczności.

### Etap 5: Usunięcie starszych heurystyk

Po upływie okresu jednego wydania:

- przestań polegać na zapisanych ciągach poleceń procesu głównego przy oczyszczaniu rekordów ACPX, które nie są starszego typu
- usuń skanowanie znaczników poleceń podczas uruchamiania
- usuń awaryjne wywołania listy podczas sprawdzania widoczności
- zachowaj defensywne, bezpiecznie odmawiające działania zachowanie w przypadku brakujących lub niemożliwych do zweryfikowania dzierżaw

## Testy

Dodaj dwa zestawy testów sterowane tabelami.

Symulator cyklu życia procesów:

- PID ponownie użyty przez niepowiązany proces
- PID ponownie użyty przez katalog główny skryptów opakowujących innego Gatewaya
- zapisane polecenie skryptu opakowującego jest ujęte w cudzysłowy powłoki, a bieżące polecenie `ps` nie
- proces potomny adaptera kończy działanie, ale proces potomny dalszego stopnia pozostaje w grupie procesów
- mechanizm awaryjny SIGTERM po śmierci procesu nadrzędnego dochodzi do SIGKILL
- lista procesów jest niedostępna
- nieaktualna dzierżawa bez procesu
- osierocony proces przy uruchamianiu ze skryptem opakowującym, procesem potomnym adaptera i procesem potomnym dalszego stopnia

Macierz widoczności sesji:

- `self`, `tree`, `agent`, `all`
- a2a włączone i wyłączone
- wiersz tego samego agenta
- wiersz między agentami
- należący do żądającego uruchomiony wiersz ACP między agentami
- żądający działający w piaskownicy, ograniczony do `tree`
- działania listy, historii, wysyłania i stanu

Ważny niezmiennik: uruchomiona sesja potomna należąca do żądającego jest widoczna wszędzie tam,
gdzie skonfigurowana widoczność obejmuje drzewo sesji żądającego, a `all` nie jest
mniej funkcjonalne niż `tree`.

## Uwagi dotyczące zgodności

Stare rekordy sesji mogą nie mieć `leaseId`. Powinny używać starszej
ścieżki oczyszczania bezpiecznie odmawiającej działania:

- wymagaj działającego procesu głównego
- wymagaj własności katalogu głównego skryptów opakowujących, gdy oczekiwany jest wygenerowany skrypt opakowujący
- wymagaj zgodności poleceń w przypadku procesów głównych bez skryptów opakowujących
- nigdy nie wysyłaj sygnału wyłącznie na podstawie nieaktualnych zapisanych metadanych PID-u

Jeśli starszego rekordu nie można zweryfikować, pozostaw go bez zmian. Oczyszczanie dzierżaw przy uruchamianiu i
kolejny okres wydania powinny ostatecznie umożliwić wycofanie tego mechanizmu awaryjnego.

## Kryteria sukcesu

- Zamknięcie starej lub nieaktualnej sesji ACPX nie może zakończyć procesu innego Gatewaya.
- Śmierć procesu nadrzędnego nie pozostawia uporczywie działających procesów potomnych dalszego stopnia adaptera.
- `cancel` przerywa aktywną turę bez zamykania sesji wielokrotnego użytku.
- `sessions_list` może wyświetlać należące do żądającego sesje potomne ACP między agentami zarówno w trybie
  `tree`, jak i `all`.
- Oczyszczanie przy uruchamianiu jest sterowane dzierżawami, a nie szerokim skanowaniem ciągów poleceń.
- Ukierunkowane testy macierzy procesów i widoczności obejmują każdy przypadek brzegowy, który
  wcześniej wymagał doraźnych poprawek podczas przeglądu.

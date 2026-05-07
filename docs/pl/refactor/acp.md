---
read_when:
    - Refaktoryzacja cyklu życia sesji ACP lub czyszczenia procesu ACPX
    - Debugowanie osieroconych procesów ACPX, ponownego użycia PID lub bezpieczeństwa czyszczenia w konfiguracji z wieloma Gateway
    - Zmiana widoczności sessions_list dla utworzonych sesji ACP lub sesji podagentów
    - Projektowanie metadanych własności dla zadań w tle, sesji ACP lub dzierżaw procesów
sidebarTitle: ACP lifecycle refactor
summary: Plan migracji mający na celu jawne określenie własności sesji ACP i procesu ACPX
title: Refaktoryzacja cyklu życia ACP
x-i18n:
    generated_at: "2026-05-07T13:25:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: b7f4ee447e0b436601c68251c26c1b897a642f6a8b1886d18647b62817996792
    source_path: refactor/acp.md
    workflow: 16
---

Cykl życia ACP obecnie działa, ale zbyt wiele jego elementów jest wnioskowanych po fakcie.
Czyszczenie procesów odtwarza własność z PID-ów, ciągów poleceń, ścieżek
wrapperów i aktywnej tabeli procesów. Widoczność sesji odtwarza własność
z ciągów kluczy sesji oraz dodatkowych odpytań `sessions.list({ spawnedBy })`.
To umożliwia wąskie poprawki, ale sprawia też, że łatwo przeoczyć przypadki brzegowe:
ponowne użycie PID-u, polecenia w cudzysłowach, wnuki adapterów, korzenie stanu wielu Gatewayów,
`cancel` kontra `close` oraz widoczność `tree` kontra `all` stają się osobnymi
miejscami do ponownego odkrywania tych samych reguł własności.

Ta refaktoryzacja czyni własność pojęciem pierwszorzędnym. Celem nie jest nowa
powierzchnia produktu ACP; jest nim bezpieczniejszy kontrakt wewnętrzny dla
istniejących zachowań ACP i ACPX.

## Cele

- Czyszczenie nigdy nie wysyła sygnału do procesu, chyba że bieżące dowody z działającego systemu pasują do
  dzierżawy należącej do OpenClaw.
- `cancel`, `close` i zbieranie osieroconych procesów przy starcie mają odrębne intencje cyklu życia.
- `sessions_list`, `sessions_history`, `sessions_send` i kontrole statusu używają
  tego samego modelu sesji należącej do żądającego.
- Instalacje z wieloma Gatewayami nie mogą zbierać nawzajem swoich wrapperów ACPX.
- Stare rekordy sesji ACPX nadal działają podczas migracji.
- Runtime pozostaje własnością Pluginu; core nie poznaje szczegółów pakietu ACPX.

## Poza zakresem

- Zastąpienie ACPX lub zmiana publicznej powierzchni polecenia `/acp`.
- Przenoszenie specyficznego dla dostawcy zachowania adaptera ACP do core.
- Wymaganie od użytkowników ręcznego czyszczenia stanu przed aktualizacją.
- Sprawienie, aby `cancel` zamykał sesje ACP wielokrotnego użytku.

## Model docelowy

### Tożsamość instancji Gatewaya

Każdy proces Gateway powinien mieć stabilny identyfikator instancji runtime:

```ts
type GatewayInstanceId = string;
```

Może być generowany przy starcie Gatewaya i utrwalany w stanie przez okres życia
tej instalacji. Nie jest sekretem bezpieczeństwa; to dyskryminator własności używany
do uniknięcia pomylenia procesów ACP jednego Gatewaya z procesami innego Gatewaya.

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

Gateway powinien zwracać te pola w wierszach sesji, w których są znane.
Filtrowanie widoczności powinno być czystą kontrolą na metadanych wiersza:

```ts
canSeeSessionRow({
  row,
  requesterSessionKey,
  visibility,
  a2aPolicy,
});
```

Usuwa to ukryte dodatkowe wywołania `sessions.list({ spawnedBy })` z kontroli
widoczności. Uruchomione międzyagentowe dziecko ACP należy do żądającego, ponieważ
wiersz tak mówi, a nie dlatego, że drugie zapytanie akurat je znajduje.

### Dzierżawy procesów ACPX

Każde uruchomienie wygenerowanego wrappera powinno utworzyć rekord dzierżawy:

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

Proces wrappera powinien otrzymać identyfikator dzierżawy i identyfikator instancji Gatewaya
w swoim środowisku:

```sh
OPENCLAW_ACPX_LEASE_ID=...
OPENCLAW_GATEWAY_INSTANCE_ID=...
```

Gdy platforma na to pozwala, weryfikacja powinna preferować metadane działającego procesu,
których nie można pomylić przez cytowanie polecenia:

- główny PID nadal istnieje
- ścieżka aktywnego wrappera znajduje się pod `wrapperRoot`
- grupa procesów pasuje do dzierżawy, gdy jest dostępna
- środowisko zawiera oczekiwany identyfikator dzierżawy, gdy można je odczytać
- hash polecenia lub ścieżka pliku wykonywalnego pasuje do dzierżawy

Jeśli działającego procesu nie można zweryfikować, czyszczenie kończy się bez działania.

## Kontroler cyklu życia

Wprowadź jeden kontroler cyklu życia ACPX, który posiada dzierżawy procesów i politykę
czyszczenia:

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

`cancelTurn` żąda wyłącznie anulowania tury. Nie może zbierać wrapperów ani
procesów adapterów wielokrotnego użytku.

`closeSession` może zbierać procesy, ale dopiero po wczytaniu rekordu sesji,
wczytaniu dzierżawy i zweryfikowaniu, że aktywne drzewo procesów nadal należy do tej
dzierżawy.

`reapStartupOrphans` zaczyna od otwartych dzierżaw w stanie. Może użyć tabeli procesów
do znalezienia potomków, ale nie powinien najpierw skanować dowolnych poleceń
wyglądających jak ACP, a potem decydować, że prawdopodobnie są nasze.

## Kontrakt wrappera

Wygenerowane wrappery powinny pozostać małe. Powinny:

- uruchamiać adapter w grupie procesów, gdy jest to obsługiwane
- przekazywać zwykłe sygnały zakończenia do grupy procesów
- wykrywać śmierć rodzica
- po śmierci rodzica wysłać SIGTERM, a następnie utrzymać wrapper przy życiu do czasu uruchomienia
  awaryjnego SIGKILL
- raportować główny PID i identyfikator grupy procesów z powrotem do kontrolera cyklu życia, gdy
  jest to dostępne

Wrappery nie powinny decydować o polityce sesji. Wymuszają tylko lokalne czyszczenie
drzewa procesów dla własnej grupy adaptera.

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
- `all`: wszystkie wiersze tego samego agenta, międzyagentowe wiersze dozwolone przez a2a oraz należące do żądającego
  uruchomione międzyagentowe wiersze, nawet gdy ogólne a2a jest wyłączone.
- `agent`: tylko ten sam agent, chyba że jawna relacja własności mówi, że wiersz
  należy do żądającego.

Dzięki temu `tree` i `all` są monotoniczne: `all` nie może ukrywać należącego dziecka,
które pokazałoby `tree`.

## Plan migracji

### Faza 1: Dodanie tożsamości i dzierżaw

- Dodaj `gatewayInstanceId` do stanu Gatewaya.
- Dodaj magazyn dzierżaw ACPX pod katalogiem stanu ACPX.
- Zapisz dzierżawę przed uruchomieniem wygenerowanego wrappera.
- Zapisuj `leaseId` w nowych rekordach sesji ACPX.
- Zachowaj istniejące pola PID i polecenia dla starych rekordów.

### Faza 2: Czyszczenie oparte najpierw na dzierżawie

- Zmień czyszczenie przy zamykaniu tak, aby najpierw wczytywało `leaseId`.
- Zweryfikuj własność działającego procesu względem dzierżawy przed wysłaniem sygnału.
- Zachowaj bieżący główny PID i awaryjną ścieżkę korzenia wrappera tylko dla rekordów legacy.
- Oznacz dzierżawy jako `closed` po zweryfikowanym czyszczeniu.
- Oznacz dzierżawy jako `lost`, gdy proces zniknął przed czyszczeniem.

### Faza 3: Zbieranie przy starcie oparte najpierw na dzierżawie

- Zbieranie przy starcie skanuje otwarte dzierżawy.
- Dla każdej dzierżawy zweryfikuj proces główny i zbierz potomków.
- Zbieraj zweryfikowane drzewa od dzieci do rodziców.
- Wygaszaj stare dzierżawy `closed` i `lost` z ograniczonym oknem retencji.
- Zachowaj skanowanie markerów poleceń tylko jako tymczasową awaryjną ścieżkę legacy, chronioną
  przez korzeń wrappera i instancję Gatewaya, gdy to możliwe.

### Faza 4: Wiersze własności sesji

- Dodaj metadane własności do wierszy sesji Gatewaya.
- Naucz autorów ACPX, subagentów, zadań w tle i magazynu sesji wypełniać
  `ownerSessionKey` lub `spawnedBy`.
- Przekształć kontrole widoczności sesji tak, aby używały metadanych wierszy.
- Usuń dodatkowe odpytywania `sessions.list({ spawnedBy })` wykonywane w czasie kontroli widoczności.

### Faza 5: Usunięcie heurystyk legacy

Po jednym oknie wydania:

- przestań polegać na zapisanych ciągach poleceń głównych dla czyszczenia ACPX niebędącego legacy
- usuń skany markerów poleceń przy starcie
- usuń awaryjne odpytywania list w widoczności
- zachowaj defensywne zachowanie bez działania dla brakujących lub niemożliwych do zweryfikowania dzierżaw

## Testy

Dodaj dwa zestawy sterowane tabelami.

Symulator cyklu życia procesu:

- PID ponownie użyty przez niepowiązany proces
- PID ponownie użyty przez korzeń wrappera innego Gatewaya
- zapisane polecenie wrappera jest cytowane przez shell, aktywne polecenie `ps` nie jest
- dziecko adaptera kończy działanie, wnuk pozostaje w grupie procesów
- awaryjne SIGTERM po śmierci rodzica dochodzi do SIGKILL
- lista procesów niedostępna
- nieaktualna dzierżawa z brakującym procesem
- osierocony proces przy starcie z wrapperem, dzieckiem adaptera i wnukiem

Macierz widoczności sesji:

- `self`, `tree`, `agent`, `all`
- a2a włączone i wyłączone
- wiersz tego samego agenta
- wiersz międzyagentowy
- należący do żądającego uruchomiony międzyagentowy wiersz ACP
- żądający w piaskownicy ograniczony do `tree`
- akcje list, history, send i status

Ważny niezmiennik: należące do żądającego uruchomione dziecko jest widoczne wszędzie tam,
gdzie skonfigurowana widoczność obejmuje drzewo sesji żądającego, a `all` nie jest
mniej zdolne niż `tree`.

## Uwagi dotyczące zgodności

Stare rekordy sesji mogą nie mieć `leaseId`. Powinny używać ścieżki czyszczenia legacy
bez działania przy braku pewności:

- wymagaj działającego procesu głównego
- wymagaj własności korzenia wrappera, gdy oczekiwany jest wygenerowany wrapper
- wymagaj zgodności poleceń dla korzeni niebędących wrapperami
- nigdy nie wysyłaj sygnału wyłącznie na podstawie nieaktualnych zapisanych metadanych PID

Jeśli rekordu legacy nie można zweryfikować, zostaw go bez zmian. Czyszczenie dzierżaw przy starcie i
następne okno wydania powinny ostatecznie wycofać awaryjną ścieżkę.

## Kryteria sukcesu

- Zamknięcie starej lub nieaktualnej sesji ACPX nie może zabić procesu innego Gatewaya.
- Śmierć rodzica nie zostawia uruchomionych uporczywych wnuków adaptera.
- `cancel` przerywa aktywną turę bez zamykania sesji wielokrotnego użytku.
- `sessions_list` może pokazywać należące do żądającego międzyagentowe dzieci ACP zarówno przy
  `tree`, jak i `all`.
- Czyszczenie przy starcie jest napędzane dzierżawami, a nie szerokimi skanami ciągów poleceń.
- Skoncentrowane testy macierzy procesów i widoczności obejmują każdy przypadek brzegowy, który
  wcześniej wymagał jednorazowych poprawek po przeglądzie.

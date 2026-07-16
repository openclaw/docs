---
doc-schema-version: 1
read_when:
    - Hostujesz OpenClaw dla wielu użytkowników lub organizacji
    - Należy wybrać granicę izolacji dla obciążeń dzierżawców
summary: Obsługuj wiele domen zaufania dzierżawców jako jedną izolowaną komórkę Gateway OpenClaw na każdego dzierżawcę
title: Hosting wielodostępny
x-i18n:
    generated_at: "2026-07-16T18:27:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 383d32331b45d40db6fb4ff8242dd9a3cf8898a3ccab19f0372cd06bbd83fc05
    source_path: gateway/multi-tenant-hosting.md
    workflow: 16
---

# Hosting wielodostępny

Domyślny model zabezpieczeń OpenClaw zakłada jedną granicę zaufanego operatora na każdy Gateway, a nie izolację wrogich dzierżawców wewnątrz jednego współdzielonego Gateway. Hosting użytkowników lub organizacji, które nie należą do tej samej granicy zaufania, wymaga zatem uruchomienia osobnej, kompletnej instancji OpenClaw dla każdego dzierżawcy.

`openclaw fleet` nazywa każdą izolowaną instancję **komórką**. Komórka to pełny Gateway w utwardzonym kontenerze, z własnym stanem, poświadczeniami, obszarem roboczym, kontami kanałów, tokenem i portem hosta dostępnym wyłącznie przez interfejs pętli zwrotnej.

Fleet jest funkcją **eksperymentalną**: jego polecenia, flagi i profil kontenera mogą zmieniać się między wydaniami bez okresu wycofywania.

Fleet jest testowany na hostach z systemami Linux i macOS. Hosty z systemem Windows nie są obecnie przetestowane.

## Dlaczego każdy dzierżawca potrzebuje komórki

Uwierzytelniony operator w obrębie jednego Gateway pełni zaufaną rolę w płaszczyźnie sterowania. Identyfikatory sesji służą do wyboru routingu; nie autoryzują jednego dzierżawcy względem drugiego. Piaskownica agenta może ograniczyć skutki niezaufanej zawartości i wykonywania narzędzi, ale nie przekształca jednego współdzielonego Gateway w granicę autoryzacji dzierżawców.

Należy używać jednej komórki na dzierżawcę, aby każda domena zaufania miała osobny proces Gateway, kontener, trwałe drzewo stanu i poświadczenie Gateway. Jest to zgodne z [modelem zabezpieczeń Gateway](/pl/gateway/security): nie należy umieszczać wzajemnie niezaufanych użytkowników w jednym procesie OpenClaw ani na jednym koncie użytkownika systemu operacyjnego.

## Architektura

CLI Fleet jest nadzorcą cyklu życia działającym po stronie hosta. Rejestruje komórki w bazie danych stanu OpenClaw i zleca lokalnemu środowisku wykonawczemu Docker lub Podman tworzenie, sprawdzanie, uruchamianie, zatrzymywanie, zastępowanie i usuwanie ich kontenerów. Zdalne punkty końcowe środowiska wykonawczego nie są obsługiwane, ponieważ ścieżki montowania Fleet i adresy URL pętli zwrotnej należą do lokalnego hosta. Fleet nie pośredniczy w przesyłaniu wiadomości dzierżawców ani nie dodaje współdzielonej ścieżki danych na poziomie aplikacji między komórkami.

Każda komórka uruchamia oficjalny obraz `ghcr.io/openclaw/openclaw` we własnej, definiowanej przez użytkownika sieci mostkowej. Osobne mosty zapobiegają bezpośredniemu ruchowi między adresami IP kontenerów należących do różnych komórek, zachowując jednocześnie wychodzący dostęp NAT dla dostawców i kanałów. Ruch wychodzący jest domyślnie nieograniczony. Komórki Podman mogą używać `--network internal` do blokowania ruchu wychodzącego przy zachowaniu opublikowanego portu Gateway na interfejsie pętli zwrotnej. Wewnętrzne sieci Docker uniemożliwiają działanie tego opublikowanego portu, dlatego Fleet odrzuca tę kombinację; zasady ruchu wychodzącego Docker należy egzekwować za pomocą reguł zapory hosta, takich jak łańcuch `DOCKER-USER`. Gateway komórki nasłuchuje na porcie `18789` wewnątrz kontenera, natomiast środowisko wykonawcze publikuje go na hoście wyłącznie pod adresem `127.0.0.1:<allocated-port>`. Gdy wymagany jest dostęp zdalny, operator może umieścić przed tym punktem końcowym pętli zwrotnej zatwierdzone odwrotne proxy, tunel SSH lub sieć tailnet.

Trwały stan Gateway pochodzi z `<state-dir>/fleet/cells/<tenant>/` i jest montowany w `/home/node/.openclaw`. Klucze szyfrowania profili uwierzytelniania pochodzą z osobnej ścieżki hosta `<state-dir>/fleet/auth-profile-secrets/<tenant>/` i są montowane w `/home/node/.config/openclaw`, zgodnie z oficjalnym [układem trwałego przechowywania Docker](/pl/install/docker#storage-and-persistence). Klucz nie jest zagnieżdżony pod zwykłym punktem montowania stanu. Konta kanałów poszczególnych dzierżawców kończą połączenia wewnątrz komórki, która jest ich właścicielem; Fleet nie udostępnia współdzielonego konta kanału ani routera wiadomości przychodzących.

Oficjalny obraz domyślnie używa użytkownika bez uprawnień roota `node` o UID 1000. Fleet używa mapowań użytkowników zgodnych z hostem, aby prywatne montowania typu bind pozostawały zapisywalne: Podman używa `keep-id`, Docker działający z uprawnieniami roota używa tożsamości wywołującego użytkownika bez uprawnień roota, a Docker działający bez uprawnień roota mapuje użytkownika root kontenera na nieuprzywilejowanego użytkownika demona. Gdy na hoście aktywny jest SELinux, Docker i Podman stosują prywatne ponowne etykietowanie `:Z`. Profil kontenera unika uprzywilejowanych funkcji hosta i jest przystosowany do działania bez uprawnień roota, ale taki tryb działania jest wyborem i wymaganiem wstępnym środowiska wykonawczego hosta, a nie funkcją automatycznie włączaną przez Fleet.

## Granica zaufania

Wielodostępność chroni dzierżawców przed sobą nawzajem. Operator Fleet i host są zaufani przez każdego dzierżawcę. Odporność na przejęcie hosta nie jest celem.

Oznacza to, że administrator hosta może sprawdzać konfigurację i środowisko kontenerów, odczytywać zamontowane dane komórek, zastępować obrazy lub uzyskiwać dostęp do kontenerów. Tokeny Gateway i wartości przekazywane za pomocą `--env` są widoczne dla administratora podczas sprawdzania przez Docker lub Podman. Należy odpowiednio stosować mechanizmy kontroli hosta, zasady dostępu administracyjnego, monitorowanie, kopie zapasowe i zatwierdzony menedżer sekretów.

Konfiguracja bazowa zapobiega przypadkowemu udostępnieniu sieciowemu z użyciem symboli wieloznacznych i usuwa typowe mechanizmy eskalacji uprawnień kontenera, ale nie zapewnia bezpieczeństwa niezaufanego hosta.

## Poziomy izolacji

Należy wybrać granicę odpowiadającą obsługiwanym dzierżawcom:

1. **Utwardzona konfiguracja bazowa kontenera.** Fleet usuwa wszystkie możliwości systemu Linux, włącza `no-new-privileges`, stosuje limity PID, pamięci, CPU i opcjonalny limit dysku dla zapisywalnej warstwy, używa osobnych trwałych montowań i sieci dla każdej komórki oraz publikuje port wyłącznie na interfejsie pętli zwrotnej hosta. Sieć mostkowa nie ogranicza ruchu wychodzącego; gdy komórka nie może inicjować połączeń wychodzących, należy użyć `--network internal` w Podman lub zasad zapory hosta dla Docker. Jest to domyślny profil dla dzierżawców ufających operatorowi i hostowi.
2. **Silniejsza izolacja kontenera lub maszyny wirtualnej.** W przypadku obciążeń o wyższym ryzyku należy skonfigurować Docker lub Podman do korzystania z silniejszego środowiska izolacji OCI, takiego jak gVisor lub Kata Containers, albo umieścić komórki w mikromaszynach wirtualnych. Jest to konfiguracja środowiska wykonawczego lub infrastruktury; opcja `--runtime docker|podman` Fleet wybiera CLI kontenera, a nie mechanizm izolacji OCI. Zobacz [alternatywne środowiska wykonawcze kontenerów](https://docs.docker.com/engine/daemon/alternative-runtimes/) Docker oraz [przewodnik dotyczący środowiska wykonawczego maszyn wirtualnych Docker](/pl/install/docker-vm-runtime).
3. **Osobne maszyny dla wrogich dzierżawców.** Nie należy umieszczać wrogich dzierżawców w jednym procesie OpenClaw ani na jednym koncie użytkownika systemu operacyjnego. Jeśli dzierżawcy nie ufają temu samemu operatorowi hosta lub wymagają silniejszej granicy administracyjnej, należy użyć osobnych maszyn wirtualnych lub hostów fizycznych z osobnym zarządzaniem środowiskiem wykonawczym.

Żaden poziom tej hierarchii nie zmienia modelu zaufania aplikacji OpenClaw: jeden Gateway pozostaje jedną domeną zaufanego operatora.

## Szybki start

Utwórz komórkę. Polecenie wyświetla wygenerowany token Gateway tylko raz, dlatego należy go natychmiast zapisać:

```bash
openclaw fleet create acme
```

Otwórz zgłoszony adres URL `http://127.0.0.1:<port>` na hoście Fleet, uwierzytelnij się tokenem tego dzierżawcy, a następnie skonfiguruj poświadczenia dostawcy i konta kanałów wewnątrz komórki.

Sprawdź stan kontenera i dostępność Gateway:

```bash
openclaw fleet status acme
```

Przeprowadź aktualizację z zachowaniem portu hosta, zamontowanych danych, profilu zasobów, środowiska podanego przez użytkownika i tokenu Gateway:

```bash
openclaw fleet upgrade acme
```

Usuń kontener i wiersz rejestru, zachowując dane dzierżawcy:

```bash
openclaw fleet rm acme --force
```

Aby usunąć również trwałe dane dzierżawcy, dodaj `--purge-data`. Czyszczenie wymaga `--force`, jest nieodwracalne i przed usunięciem czegokolwiek sprawdza, czy rozwiązana ścieżka znajduje się w dozwolonym zakresie:

```bash
openclaw fleet rm acme --purge-data --force
```

Pełną listę poleceń i opcji zawiera [dokumentacja CLI `openclaw fleet`](/cli/fleet).

## Obecny zakres

Fleet nie udostępnia następujących funkcji:

- Współdzielonych kont kanałów ani współdzielonego routera ruchu przychodzącego
- Odchudzonych procesów hosta dla poszczególnych dzierżawców zamiast kompletnych instancji OpenClaw
- Zdalnych hostów komórek zarządzanych przez jednego nadzorcę
- Portalu samoobsługowego dzierżawców, płaszczyzny rozliczeniowej ani interfejsu użytkownika do delegowanego zarządzania

Te możliwości wymagają jawnych kontraktów dotyczących tożsamości, routingu, autoryzacji i domen awarii. Nie należy ich zastępować współdzieleniem jednego Gateway ani jego poświadczeń między dzierżawcami. Fleet jest nadzorcą cyklu życia na jednym hoście; floty obejmujące wiele maszyn i zarządzane na podstawie tożsamości wymagają osobnej warstwy płaszczyzny sterowania.

## Powiązane

- [`openclaw fleet`](/cli/fleet)
- [Zabezpieczenia Gateway](/pl/gateway/security)
- [Wiele bram Gateway](/pl/gateway/multiple-gateways)
- [Docker](/pl/install/docker)
- [Podman](/pl/install/podman)

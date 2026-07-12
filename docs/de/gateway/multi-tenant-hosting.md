---
read_when:
    - Sie hosten OpenClaw für mehrere Benutzer oder Organisationen
    - Sie müssen eine Isolationsgrenze für Mandanten-Workloads auswählen
summary: Hosten Sie mehrere Mandanten-Vertrauensdomänen als jeweils eine isolierte OpenClaw-Gateway-Zelle pro Mandant
title: Mandantenfähiges Hosting
x-i18n:
    generated_at: "2026-07-12T15:25:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5ffb873c7b9e7e463d932ad35eb009c34218447a051ac065c151ba57dc71b799
    source_path: gateway/multi-tenant-hosting.md
    workflow: 16
---

# Multi-Tenant-Hosting

Das standardmäßige Sicherheitsmodell von OpenClaw sieht eine vertrauenswürdige Betreibergrenze pro Gateway vor, nicht die Isolierung nicht vertrauenswürdiger Mandanten innerhalb eines gemeinsam genutzten Gateways. Das Hosting von Benutzern oder Organisationen, die keine gemeinsame Vertrauensgrenze haben, erfordert daher für jeden Mandanten eine separate, vollständige OpenClaw-Instanz.

`openclaw fleet` bezeichnet jede isolierte Instanz als **Zelle**. Eine Zelle ist ein vollständiges Gateway in einem gehärteten Container mit eigenem Zustand, eigenen Anmeldedaten, eigenem Arbeitsbereich, eigenen Kanalkonten, eigenem Token und einem Host-Port, der ausschließlich an die Loopback-Schnittstelle gebunden ist.

Fleet ist **experimentell**: Die Befehle, Flags und das Containerprofil können sich zwischen Releases ohne Übergangsfrist ändern, während sich die Schnittstelle stabilisiert.

Fleet wurde auf Linux- und macOS-Hosts getestet. Windows-Hosts sind derzeit nicht getestet.

## Warum jeder Mandant eine Zelle benötigt

Ein authentifizierter Betreiber innerhalb eines Gateways besitzt eine vertrauenswürdige Rolle auf der Steuerungsebene. Sitzungs-IDs wählen das Routing aus; sie autorisieren keinen Mandanten gegenüber einem anderen. Agent-Sandboxing kann die Auswirkungen nicht vertrauenswürdiger Inhalte und Werkzeugausführungen reduzieren, verwandelt ein gemeinsam genutztes Gateway jedoch nicht in eine Autorisierungsgrenze zwischen Mandanten.

Verwenden Sie eine Zelle pro Mandant, damit jede Vertrauensdomäne über einen separaten Gateway-Prozess, Container, persistenten Zustandsbaum und eigene Gateway-Anmeldedaten verfügt. Dies entspricht dem [Gateway-Sicherheitsmodell](/de/gateway/security): Führen Sie Benutzer, die einander nicht vertrauen, nicht gemeinsam in einem OpenClaw-Prozess oder unter einem Betriebssystembenutzer aus.

## Architektur

Die Fleet-CLI ist eine hostseitige Lebenszyklusverwaltung. Sie erfasst Zellen in der OpenClaw-Zustandsdatenbank und weist eine lokale Docker- oder Podman-Laufzeitumgebung an, deren Container zu erstellen, zu untersuchen, zu starten, zu stoppen, zu ersetzen und zu entfernen. Endpunkte entfernter Laufzeitumgebungen werden abgelehnt, da die Bind-Pfade und Loopback-URLs von Fleet zum lokalen Host gehören; entfernte Zellen-Hosts werden zurückgestellt, bis ein expliziter Speicher- und Endpunktvertrag vorliegt. Fleet leitet keine Mandantennachrichten weiter und fügt keinen gemeinsam genutzten Datenpfad auf Anwendungsebene zwischen Zellen hinzu.

Jede Zelle führt das offizielle Image `ghcr.io/openclaw/openclaw` in einem eigenen benutzerdefinierten Bridge-Netzwerk aus. Separate Bridges verhindern direkten Datenverkehr zwischen Zellen über Container-IP-Adressen und ermöglichen weiterhin ausgehenden NAT-Zugriff für Provider und Kanäle. Ausgehender Datenverkehr ist standardmäßig uneingeschränkt. Podman-Zellen können `--network internal` verwenden, um ausgehenden Datenverkehr zu blockieren und gleichzeitig den veröffentlichten Loopback-Port des Gateways beizubehalten. Interne Docker-Netzwerke unterbrechen diesen veröffentlichten Port, weshalb Fleet diese Kombination ablehnt; setzen Sie Richtlinien für ausgehenden Docker-Datenverkehr stattdessen mit Host-Firewallregeln wie der `DOCKER-USER`-Kette durch. Das Gateway der Zelle lauscht innerhalb des Containers auf Port `18789`, während die Laufzeitumgebung ihn auf dem Host ausschließlich unter `127.0.0.1:<allocated-port>` veröffentlicht. Wenn Remotezugriff erforderlich ist, kann ein Betreiber einen genehmigten Reverse-Proxy, SSH-Tunnel oder ein Tailnet vor diesem Loopback-Endpunkt platzieren.

Der persistente Gateway-Zustand stammt aus `<state-dir>/fleet/cells/<tenant>/` und wird unter `/home/node/.openclaw` eingebunden. Verschlüsselungsschlüssel für Authentifizierungsprofile stammen aus dem separaten Host-Pfad `<state-dir>/fleet/auth-profile-secrets/<tenant>/` und werden unter `/home/node/.config/openclaw` eingebunden, entsprechend dem offiziellen [Docker-Persistenzlayout](/de/install/docker#storage-and-persistence). Der Schlüssel befindet sich nicht unterhalb der gewöhnlichen Zustandseinbindung. Mandantenspezifische Kanalkonten enden innerhalb der Zelle, zu der sie gehören. Daher gibt es im Fleet-MVP weder ein gemeinsam genutztes Kanalkonto noch einen gemeinsam genutzten Router für eingehende Nachrichten.

Das offizielle Image verwendet standardmäßig den Nicht-Root-Benutzer `node` mit der UID 1000. Fleet verwendet hostkompatible Benutzerzuordnungen, damit private Bind-Mounts beschreibbar bleiben: Podman verwendet `keep-id`, Docker im Root-Modus verwendet die Identität des aufrufenden Nicht-Root-Benutzers und Docker im Rootless-Modus ordnet den Container-Root-Benutzer dem nicht privilegierten Daemon-Benutzer zu. Docker und Podman wenden bei aktivem SELinux auf dem Host eine private `:Z`-Neukennzeichnung an. Das Containerprofil vermeidet privilegierte Hostfunktionen und ist für den Rootless-Betrieb geeignet. Der Rootless-Betrieb ist jedoch eine Entscheidung und Voraussetzung der Host-Laufzeitumgebung und wird von Fleet nicht automatisch aktiviert.

## Vertrauensgrenze

Multi-Tenancy schützt Mandanten voreinander. Jeder Mandant vertraut dem Fleet-Betreiber und dem Host. Der Schutz vor einem kompromittierten Host ist kein Ziel.

Das bedeutet, dass ein Hostadministrator die Containerkonfiguration und -umgebung untersuchen, eingebundene Zellendaten lesen, Images ersetzen oder Container betreten kann. Gateway-Tokens und mit `--env` übergebene Werte sind für einen Administrator über die Inspektionsfunktionen von Docker oder Podman sichtbar. Verwenden Sie daher entsprechende Hostkontrollen, Richtlinien für administrativen Zugriff, Überwachung, Sicherungen und einen genehmigten Secret Manager.

Die Basiskonfiguration verhindert eine versehentliche Netzwerkfreigabe über Wildcards und entfernt gängige Mechanismen zur Rechteausweitung in Containern, macht einen nicht vertrauenswürdigen Host jedoch nicht sicher.

## Isolierungsstufen

Wählen Sie die Grenze, die zu den von Ihnen gehosteten Mandanten passt:

1. **Gehärtete Container-Basiskonfiguration.** Fleet entfernt alle Linux-Capabilities, aktiviert `no-new-privileges`, wendet Grenzwerte für PID, Arbeitsspeicher, CPU und optional den beschreibbaren Layer an, verwendet separate persistente Einbindungen und Netzwerke pro Zelle und veröffentlicht ausschließlich auf der Loopback-Schnittstelle des Hosts. Bridge-Netzwerke lassen ausgehenden Datenverkehr uneingeschränkt; verwenden Sie Podman mit `--network internal` oder eine Docker-Host-Firewallrichtlinie, wenn eine Zelle keine ausgehenden Verbindungen herstellen darf. Dies ist das MVP-Profil für Mandanten, die dem Betreiber und dem Host vertrauen.
2. **Stärkere Container- oder VM-Isolierung.** Konfigurieren Sie Docker oder Podman für Workloads mit höherem Risiko so, dass eine stärkere OCI-Isolierungslaufzeit wie gVisor oder Kata Containers verwendet wird, oder führen Sie Zellen in MicroVMs aus. Dies ist eine Konfiguration der Laufzeitumgebung oder Infrastruktur; die Fleet-Option `--runtime docker|podman` wählt die Container-CLI aus, nicht das OCI-Isolierungs-Backend. Weitere Informationen finden Sie unter [Alternative Containerlaufzeiten](https://docs.docker.com/engine/daemon/alternative-runtimes/) von Docker und im [Leitfaden zur Docker-VM-Laufzeit](/de/install/docker-vm-runtime).
3. **Separate Maschinen für nicht vertrauenswürdige Mandanten.** Führen Sie Mandanten, die einander nicht vertrauen, nicht gemeinsam in einem OpenClaw-Prozess oder unter einem Betriebssystembenutzer aus. Wenn Mandanten nicht demselben Hostbetreiber vertrauen oder eine stärkere administrative Grenze benötigen, verwenden Sie separate VMs oder physische Hosts mit separater Laufzeitverwaltung.

Keine Stufe dieser Leiter ändert das Vertrauensmodell der OpenClaw-Anwendung: Ein Gateway bleibt eine vertrauenswürdige Betreiberdomäne.

## Schnellstart

Erstellen Sie eine Zelle. Der Befehl gibt ein generiertes Gateway-Token einmalig aus; speichern Sie es daher sofort:

```bash
openclaw fleet create acme
```

Öffnen Sie die angegebene URL `http://127.0.0.1:<port>` auf dem Fleet-Host, authentifizieren Sie sich mit dem Token dieses Mandanten und konfigurieren Sie die Provider-Anmeldedaten und Kanalkonten innerhalb der Zelle.

Prüfen Sie den Containerzustand und die Erreichbarkeit des Gateways:

```bash
openclaw fleet status acme
```

Führen Sie ein Upgrade durch, wobei Host-Port, eingebundene Daten, Ressourcenprofil, benutzerdefinierte Umgebung und Gateway-Token erhalten bleiben:

```bash
openclaw fleet upgrade acme
```

Entfernen Sie den Container und den Registrierungseintrag, während die Mandantendaten erhalten bleiben:

```bash
openclaw fleet rm acme --force
```

Um auch die persistenten Mandantendaten zu löschen, fügen Sie `--purge-data` hinzu. Das Löschen erfordert `--force`, kann nicht rückgängig gemacht werden und führt vor dem Löschen eine Einschlussprüfung des aufgelösten Pfads durch:

```bash
openclaw fleet rm acme --purge-data --force
```

Alle Befehle und Optionen finden Sie in der [CLI-Referenz zu `openclaw fleet`](/cli/fleet).

## Nicht im MVP enthalten

Das erste Fleet-Release überlässt die folgenden Bereiche bewusst späteren Entwürfen:

- Gemeinsam genutzte Kanalkonten oder ein gemeinsam genutzter Ingress-Router
- Verschlankte Hostprozesse pro Mandant anstelle vollständiger OpenClaw-Instanzen
- Von einer zentralen Verwaltung verwaltete entfernte Zellen-Hosts
- Ein Self-Service-Portal für Mandanten, eine Abrechnungsebene oder eine Benutzeroberfläche für delegierte Administration

Diese Funktionen erfordern explizite Verträge für Identität, Routing, Autorisierung und Ausfalldomänen. Sie sollten nicht näherungsweise umgesetzt werden, indem ein Gateway oder dessen Anmeldedaten von mehreren Mandanten gemeinsam genutzt werden. Sie gehören außerdem nicht zum Aufgabenbereich von Fleet: Fleet bleibt eine Lebenszyklusverwaltung für einen einzelnen Host, während mandantenfähige, identitätsgesteuerte Flotten auf mehreren Maschinen in eine dedizierte, darüberliegende Steuerungsebene gehören.

## Verwandte Themen

- [`openclaw fleet`](/cli/fleet)
- [Gateway-Sicherheit](/de/gateway/security)
- [Mehrere Gateways](/de/gateway/multiple-gateways)
- [Docker](/de/install/docker)
- [Podman](/de/install/podman)

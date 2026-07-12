---
read_when:
    - Arbeitsbereich-Tabs und Widgets erstellen oder neu anordnen
    - Einen Agenten einen Arbeitsbereich zusammenstellen lassen
    - Überprüfung des Genehmigungs- und Sandbox-Modells für benutzerdefinierte Widgets
summary: Durch Agenten zusammenstellbare Arbeitsbereiche in der Control UI
title: Arbeitsbereiche
x-i18n:
    generated_at: "2026-07-12T16:08:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 234baefc18be736599addeeb35f8404b617c1d8f07f058c4a02ec2615ca21aa0
    source_path: web/workspaces.md
    workflow: 16
---

Der Tab **Arbeitsbereiche** in der [Control UI](/de/web/control-ui) ist eine Oberfläche, die Sie und Ihre
Agenten gemeinsam gestalten. Tabs, Widgets, ihre Positionen in einem 12-spaltigen Raster und ihre
Datenbindungen befinden sich alle in einem Dokument. Alles, was dieses Dokument bearbeiten kann, kann
den Arbeitsbereich zusammenstellen: Sie, die CLI `openclaw workspaces` oder ein Agent, der `workspace_*`-Tools aufruft.

Jeder Schreibvorgang durchläuft denselben validierten Pfad, sodass das Layout eines Menschen und das eines Agenten
nicht voneinander abweichen können. Jeder akzeptierte Schreibvorgang erhöht eine Version und sendet
`plugin.workspaces.changed`, sodass die Bearbeitung eines Agenten ohne
Neuladen in einem bereits geöffneten Browser erscheint.

## Arbeitsbereiche aktivieren

Das mitgelieferte Workspaces-Plugin ist standardmäßig deaktiviert. Öffnen Sie in der Control UI **Plugins**,
suchen Sie **Workspaces** und wählen Sie **Aktivieren** aus. Sie können es auch über die CLI aktivieren:

```sh
openclaw plugins enable workspaces
```

Durch das Aktivieren des Plugins wird der Tab **Arbeitsbereiche** hinzugefügt, und die CLI `openclaw workspaces`
sowie die Agenten-Tools `workspace_*` werden verfügbar. Durch das Deaktivieren werden diese Oberflächen entfernt, ohne
die Arbeitsbereichsdatenbank oder Widget-Assets zu löschen.

## Der Standardarbeitsbereich

Beim ersten Laden erhalten Sie einen Arbeitsbereich namens **Übersicht**: Kosten- und Token-Karten, Instanzstatus,
Sitzungen, Cron-Status und einen Aktivitätsfeed. Dabei handelt es sich um gewöhnliche Arbeitsbereichsinhalte – Sie können sie verschieben,
einklappen, ausblenden oder löschen.

## Integrierte Widgets

Neun vertrauenswürdige Widgets werden mit dem Plugin ausgeliefert und als Erstanbieter-UI dargestellt:

`stat-card`, `markdown`, `table`, `iframe-embed`, `sessions`, `usage`, `cron`,
`instances`, `activity`.

Widgets deklarieren Daten über **Bindungen**; sie rufen sie niemals selbst ab:

| Bindung  | Wird aufgelöst zu                                                                                         |
| -------- | --------------------------------------------------------------------------------------------------------- |
| `static` | Ein im Dokument gespeicherter Literalwert (max. 8 KB).                                                    |
| `file`   | Eine JSON-, Markdown- oder CSV-Datei unter `<stateDir>/workspaces/data/`, optional durch einen JSON-Zeiger eingegrenzt. |
| `rpc`    | Eine Methode aus einer festen Positivliste schreibgeschützter Gateway-Methoden, aufgelöst durch die vertrauenswürdige Control UI. |

Die Bindung `file` ist die einfachste Möglichkeit, eigene Zahlen in einem Arbeitsbereich anzuzeigen: Schreiben Sie eine
JSON-Datei in das Datenverzeichnis und verweisen Sie mit einer `stat-card` darauf.

## Herkunft

Tabs und Widgets tragen einen `createdBy`-Vermerk – `user`, `system` oder `agent:<id>` –, der anhand
der Person oder Instanz festgelegt wird, die den Schreibvorgang ausgeführt hat. Der Aufrufer kann ihn nicht angeben, sodass ein Agent seine
Arbeit nicht als Ihre kennzeichnen kann und der „AI“-Chip auf einem von einem Agenten erstellten Widget stets der Wahrheit entspricht.

## Benutzerdefinierte Widgets

Ein Agent kann mit `workspace_widget_scaffold` ein echtes HTML-Widget erstellen (oder Sie mit
`openclaw workspaces widget-scaffold <name>`). Von Agenten erstellter Code wird als potenziell schädlich behandelt:

- Ein mit einem Grundgerüst versehenes Widget wird mit dem Status **ausstehend** in die Registrierung aufgenommen. Es wird kein iframe erstellt und die
  Asset-Route gibt für seine Dateien 404 zurück, bis ein Operator es genehmigt.
- Die Genehmigung ist eine von der Bearbeitung eines Layouts getrennte Entscheidung: `workspaces.widget.approve`
  erfordert den Geltungsbereich `operator.approvals`, also denselben Geltungsbereich, der Ausführungsgenehmigungen schützt.
- Ein genehmigtes Widget wird in einem `<iframe sandbox="allow-scripts">` dargestellt – niemals mit
  `allow-same-origin` –, sodass sein Ursprung undurchsichtig ist und es nicht auf DOM,
  Speicher oder Cookies des übergeordneten Dokuments zugreifen kann.
- Seine Assets werden mit `connect-src 'none'` bereitgestellt, wodurch Skriptnetzwerkzugriffe wie
  `fetch`, XHR und WebSockets blockiert werden. Es besitzt keine Anmeldedaten und kommuniziert niemals mit dem Gateway.
- Daten erreichen es ausschließlich über eine versionierte `postMessage`-Brücke. Benutzerdefinierter Code kann
  deklarierte `static`-Bindungen empfangen, bei denen es sich bereits um von Agenten oder Operatoren erstellte Arbeitsbereichswerte
  handelt. RPC- und Dateibindungen verbleiben in vertrauenswürdigen integrierten Widgets: Browser erlauben einem
  in einer Sandbox ausgeführten untergeordneten Element, seinen eigenen Frame zu navigieren, daher werden privilegierte Daten niemals an
  von Agenten erstelltes HTML gesendet.

Das Senden einer Eingabeaufforderung aus einem Widget in den Chat erfordert zusätzlich eine Manifest-Fähigkeit, eine
Bestätigung bei jedem Aufruf, die den genauen Text zitiert, und unterliegt einer Ratenbegrenzung.

## CLI

```sh
openclaw workspaces tabs list
openclaw workspaces tabs create --title Financials
openclaw workspaces widget-scaffold revenue-chart --title "Revenue Chart"
openclaw workspaces widget-approve revenue-chart
```

`widget-approve` benötigt ein Gerät, das mit dem Geltungsbereich `operator.approvals` gekoppelt ist; bei einer Genehmigung über
die Control UI ist dies nicht erforderlich, da der Browser ihn bereits besitzt.

## Speicherung

Das Arbeitsbereichsdokument, die Registrierung benutzerdefinierter Widgets und ein Rückgängig-Ring mit 20 Einträgen befinden sich in
`<stateDir>/workspaces/workspaces.sqlite`. Von Agenten erstellte Widget-Assets verbleiben auf dem Datenträger unter
`<stateDir>/workspaces/widgets/<name>/` und Daten für Dateibindungen unter
`<stateDir>/workspaces/data/`, da ein Agent diese mit gewöhnlichen Datei-Tools erstellt und
die Widget-Route ihre Bytes bereitstellt.
